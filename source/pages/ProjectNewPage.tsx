// 诺安云 6.0 · 新增项目（立项向导 v2）· PRD §14 重构版
// 设计口径（评审定稿）：
//   ① 入口塌缩两类：有合同立项（常规）/ 应急工程·无合同（30 日补签）—— 上游溯源由合同继承，不再手选
//   ② 服务周期明细不在立项填报 —— 立项后于「项目经营中心 · 计划管理」按巡检/施工计划滚动补录
//   ③ 证书三段式：立项=合规预检+需求清单存档（只读）｜借出=开工前证书中心办理｜齐套=开工闸门
//   ④ 提交走审批中心闭环（pushApproval + XM 回写，见 store.syncBizFromApproval）
//   ⑤ 草稿真存续（localStorage），重进可恢复
import React, { useMemo, useState } from 'react';
import {
  Btn, Card, Check, EntityLink, Field, KvGrid, Modal, PageHead, Steps, Tag, Tip, pressProps, useToast,
} from '../components/ui';
import {
  APPROVALS, BIDS, CERTS, CONTRACTS, CUSTOMERS, OPPS, PROJECTS, QUOTES,
  TODAY, approveLevel, fmt, fmtWan, normContractStatus,
} from '../components/data';
import { addProject, getApprovals, getProjects, pushApproval } from '../components/store';
import { Ico, StatusIco, type IconName } from '../components/icons';

/* ============ 入口（2 类） ============ */
type Mode = 'contract' | 'emergency';
const ENTRY_CARDS: { key: Mode; label: string; desc: string; icon: IconName; tone: string }[] = [
  { key: 'contract', label: '有合同立项', desc: '选择一份「已签约」合同发起 · 自动带出客户 / 金额 / 工期，并继承商机→报价→投标溯源链', icon: 'receipt', tone: 'blue' },
  { key: 'emergency', label: '应急工程 · 无合同', desc: '抢险抢修先施工 · 标记「无合同施工」，须 30 日内完成合同补签', icon: 'flame', tone: 'red' },
];

const PTYPES = ['新建', '改造', '维护保养'];
const BIZ = [{ k: 'GC', n: '工程施工' }, { k: 'WB', n: '维护保养' }, { k: 'RJ', n: '消防软件' }, { k: 'QT', n: '其他' }];
const SIGN_TYPES = ['维护保养合同', '销售合同'];

/** 服务明细后补口径（立项环节不填报的说明，确认页复述） */
const DETAIL_HINT =
  '服务周期明细与工程量清单不在立项环节填报：立项后由「项目经营中心 · 计划管理」按巡检 / 施工计划滚动补录，累计金额超出合同额时引导走合同变更。';

/** 合同类型 → 项目类型 / 业务条线 */
const mapTypeBiz = (t: string) => {
  const s = t || '';
  if (s.includes('维保') || s.includes('维护')) return { type: '维护保养', biz: 'WB' };
  if (s.includes('综合')) return { type: '改造', biz: 'GC' };
  return { type: '新建', biz: 'GC' };
};

/** 里程碑模板：立项时全部未完成；「消防验收」为验收节点（需提交核验单） */
const MILESTONE_TPL = [
  { n: '进场准备', d: '', ok: false },
  { n: '主体施工', d: '', ok: false },
  { n: '安装调试', d: '', ok: false },
  { n: '消防验收', d: '', ok: true },
  { n: '竣工移交', d: '', ok: false },
];
type Mile = { n: string; d: string; ok: boolean };

/** 证书需求预判：项目类型 × 金额 × 面积（只读生成，立项不现场占用证书） */
function predictCertNeed(type: string, amt: number, area: number) {
  const rows: { name: string; need: number; why: string }[] = [];
  const scale = amt >= 5000000 || area >= 40000 ? 3 : amt >= 2000000 || area >= 15000 ? 2 : 1;
  rows.push({ name: '注册建造师（机电工程）', need: 1, why: '一证一项目 · 项目负责人必须为本公司注册建造师' });
  if (type !== '维护保养') rows.push({ name: 'B 类安全生产考核合格证', need: 1, why: '建造师三要素之一 · B 证须有效且随建造师本人' });
  rows.push({ name: '建构筑物消防员（中级）', need: Math.max(1, scale), why: '按次登记 · 每个作业面至少 1 人' });
  if (type !== '维护保养') rows.push({ name: '消防设施工程专业承包（二级）', need: 1, why: '多项目引用 · 企业施工资质' });
  rows.push({ name: '安全生产许可证', need: 1, why: '多项目引用 · 过期将导致全部投标废标' });
  if (type === '维护保养') rows.push({ name: '消防设施维护保养检测资质（二级）', need: 1, why: '多项目引用 · 维护保养业务必备' });
  return rows;
}

/** 建造师三要素校验（证书有效 + B 证有效 + 无在建） */
function builderCheck(name: string) {
  const c = CERTS.find((x) => x.isBuilder && x.holder === name);
  if (!c) return { ok: false, why: '无本公司注册建造师记录' };
  if (c.validTo < TODAY) return { ok: false, why: `证书已于 ${c.validTo} 过期` };
  if (!c.hasB) return { ok: false, why: 'B 类安全生产考核合格证缺失' };
  if ((c.bValidTo || '') < TODAY) return { ok: false, why: `B 证已于 ${c.bValidTo} 过期` };
  if ((c.used as string[]).length >= c.cap) return { ok: false, why: '已有在建项目（一证一项目）' };
  return { ok: true, why: '' };
}

/** 建造师候选：从证书台账动态取持证人员（不再硬编码名单） */
const builderNames = () =>
  Array.from(new Set(CERTS.filter((c) => c.isBuilder).map((c) => c.holder as string)));

const daysTo = (d: string) => Math.ceil((new Date(d).getTime() - new Date(TODAY).getTime()) / 86400000);
const addDays = (d: string, n: number) => new Date(new Date(d).getTime() + n * 86400000).toISOString().slice(0, 10);

/** 编号：递增取号 + 查重（静态台账 + store 新增，杜绝随机撞号） */
function nextXmId() {
  const all = [...PROJECTS, ...getProjects()];
  const nums = all.map((p) => Number(String(p.id).replace(/\D/g, ''))).filter((n) => !Number.isNaN(n));
  const used = new Set(all.map((p) => p.id));
  let n = (nums.length ? Math.max(...nums) : 100) + 1;
  let id = `XM${String(n).padStart(6, '0')}`;
  while (used.has(id)) { n += 1; id = `XM${String(n).padStart(6, '0')}`; }
  return id;
}

/** 审批单号：SP-YYYY-MMDD-序，当日递增查重 */
function nextSpId() {
  const y = TODAY.slice(0, 4);
  const md = TODAY.slice(5, 7) + TODAY.slice(8, 10);
  const used = new Set(getApprovals().map((a) => a.id));
  let i = 1;
  let id = `SP-${y}-${md}-${String(i).padStart(2, '0')}`;
  while (used.has(id)) { i += 1; id = `SP-${y}-${md}-${String(i).padStart(2, '0')}`; }
  return id;
}

/** 审批路由升级（成本红线 >80% 时升一级）：部门负责人 → 分管副总 → 总经理 */
const LEVELS = ['部门负责人', '分管副总', '总经理'];
const upLevel = (lv: string) => LEVELS[Math.min(LEVELS.indexOf(lv) + 1, LEVELS.length - 1)] || lv;

/* ============ 草稿（localStorage 真存续） ============ */
const DRAFT_KEY = 'nc.projectNew.draft.v2';
type Draft = Record<string, unknown>;
const loadDraft = (): Draft | null => {
  try { const s = localStorage.getItem(DRAFT_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
};
const clearDraft = () => { try { localStorage.removeItem(DRAFT_KEY); } catch { /* 忽略 */ } };
const putDraft = (d: Draft) => { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)); } catch { /* 忽略 */ } };

export default function ProjectNewPage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();

  /* ---------- 页面形态 ---------- */
  const [mode, setMode] = useState<Mode | ''>('');
  const [step, setStep] = useState(0);
  const [restore, setRestore] = useState<Draft | null>(() => loadDraft());
  const [leave, setLeave] = useState<null | (() => void)>(null);

  /* ---------- 模式 A：有合同立项 ---------- */
  const [ctIdx, setCtIdx] = useState(-1);
  const [kw, setKw] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('新建');
  const [biz, setBiz] = useState('GC');
  const [pm, setPm] = useState('');
  const [area, setArea] = useState(0);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [miles, setMiles] = useState<Mile[]>(MILESTONE_TPL.map((m) => ({ ...m })));
  const [budget, setBudget] = useState<{ n: string; v: number }[]>([]);
  const [budgetInit, setBudgetInit] = useState(false);
  const [agree, setAgree] = useState(false);

  /* ---------- 模式 B：应急工程 ---------- */
  const [eName, setEName] = useState('');
  const [ePm, setEPm] = useState('');
  const [eType, setEType] = useState('维护保养');
  const [eCust, setECust] = useState('');
  const [eAmt, setEAmt] = useState(0);
  const [eSign, setESign] = useState(SIGN_TYPES[0]);
  const [eAgree, setEAgree] = useState(false);
  const [emModal, setEmModal] = useState(false);

  /* ---------- 候选合同：已签约 + 未立项 + 非框架主协议 ---------- */
  const usedIds = new Set<string>([
    ...CONTRACTS.filter((k) => k.project).map((k) => k.id),
    ...getProjects().map((p) => (p as { contractId?: string }).contractId || '').filter(Boolean),
  ]);
  const cands = CONTRACTS.filter(
    (k) => normContractStatus(k.status) === '已签约' && k.type !== '框架协议' && !usedIds.has(k.id),
  );
  const list = cands.filter((k) => !kw || (k.id + k.name + k.party).includes(kw));
  const picked = ctIdx >= 0 ? CONTRACTS[ctIdx] : null;
  const amt = picked ? picked.execAmt || picked.amt : 0;

  const pickContract = (i: number) => {
    const c = CONTRACTS[i];
    setCtIdx(i);
    const tb = mapTypeBiz(c.type);
    setName(`${c.name}（履约）`);
    setType(tb.type);
    setBiz(tb.biz);
    setStart(c.start);
    setEnd(c.end);
    setBudgetInit(false);
    setAgree(false);
  };

  /* ---------- 溯源参考（同客户关联单据，由合同继承，只读） ---------- */
  const chain = useMemo(() => {
    if (!picked) return { opps: [], quotes: [], bids: [] };
    const cid = CUSTOMERS.find((c) => c.name === picked.party)?.id || '';
    return {
      opps: cid ? OPPS.filter((o) => o.customerId === cid) : [],
      quotes: cid ? QUOTES.filter((q) => q.customerId === cid) : [],
      bids: cid ? BIDS.filter((b) => b.customerId === cid) : [],
    };
  }, [picked]);

  /* ---------- 合规预检（只读三灯） ---------- */
  const pre = useMemo(() => {
    if (!picked) return null;
    const chk = (nm: string): { tone: string; why: string } => {
      const c = CERTS.find((x) => x.name.includes(nm));
      if (!c) return { tone: 'red', why: '证书中心无此资质记录' };
      if (c.validTo < TODAY) return { tone: 'red', why: `已于 ${c.validTo} 过期` };
      if (daysTo(c.validTo) <= 30) return { tone: 'orange', why: `${c.validTo} 到期（${daysTo(c.validTo)} 天）· 建议即办续期` };
      return { tone: 'green', why: `有效期至 ${c.validTo}` };
    };
    const builders = builderNames();
    const okB = builders.filter((b) => builderCheck(b).ok);
    return {
      qual: chk('消防设施工程专业承包'),
      safety: chk('安全生产许可'),
      reserve: {
        tone: okB.length === 0 ? 'red' : okB.length === 1 ? 'orange' : 'green',
        why: `持证 ${builders.length} 人 · 当前可派任 ${okB.length} 人`,
      },
    };
  }, [picked]);

  const certNeeds = useMemo(
    () => (picked ? predictCertNeed(type, amt, area) : []),
    [picked, type, amt, area],
  );

  /* ---------- 计划与预算 ---------- */
  const budgetTotal = budget.reduce((a, b) => a + b.v, 0);
  const costRate = amt ? (budgetTotal / amt) * 100 : 0;
  const belowRedline = costRate > 80;
  const routeLevel = belowRedline ? upLevel(approveLevel(amt)) : approveLevel(amt);

  /* ---------- 离开保护 ---------- */
  const dirty = mode === 'contract' ? ctIdx >= 0 || !!name || !!pm : !!(eName || ePm || eCust);
  const guard = (action: () => void) => (dirty ? setLeave(() => action) : action());
  const backToEntry = () => guard(() => { setMode(''); setStep(0); });

  /* ---------- 草稿 ---------- */
  const snapshot = (): Draft => ({
    mode, step, ctId: picked?.id || '', name, type, biz, pm, area, start, end,
    miles, budget, eName, ePm, eType, eCust, eAmt, eSign,
  });
  const saveDraft = () => { putDraft(snapshot()); setRestore(null); toast('草稿已保存至本地 · 重新进入本页可恢复'); };
  const applyDraft = (d: Draft) => {
    const m = (d.mode as Mode) || 'contract';
    setMode(m);
    setStep(Number(d.step) || 0);
    setName(String(d.name || ''));
    setType(String(d.type || '新建'));
    setBiz(String(d.biz || 'GC'));
    setPm(String(d.pm || ''));
    setArea(Number(d.area) || 0);
    setStart(String(d.start || ''));
    setEnd(String(d.end || ''));
    if (Array.isArray(d.miles)) setMiles(d.miles as Mile[]);
    if (Array.isArray(d.budget)) { setBudget(d.budget as { n: string; v: number }[]); setBudgetInit(true); }
    setEName(String(d.eName || ''));
    setEPm(String(d.ePm || ''));
    setEType(String(d.eType || '维护保养'));
    setECust(String(d.eCust || ''));
    setEAmt(Number(d.eAmt) || 0);
    setESign(String(d.eSign || SIGN_TYPES[0]));
    if (d.ctId) { const i = CONTRACTS.findIndex((k) => k.id === d.ctId); if (i >= 0) setCtIdx(i); }
    setRestore(null);
    toast('已恢复上次草稿');
  };

  /* ---------- 提交（模式 A） ---------- */
  const submit = () => {
    if (!picked) return;
    const id = nextXmId();
    addProject({
      id, name: name.trim(), type, biz, source: '合同立项',
      customer: picked.party,
      customerId: CUSTOMERS.find((c) => c.name === picked.party)?.id || '',
      owner: picked.owner, pm, contractAmt: amt, execAmt: amt, cost: 0,
      milestone: 0, milestoneName: '待启动', recvPct: 0, risk: 'none', status: '待审批',
      start, end, profit: 0,
      contractId: picked.id,          // 合同 ↔ 项目互链（relOfContract / relOfProject 生效）
      certNeeds,                      // 证书需求清单随项目落库（档案跟踪 + 开工齐套校验依据）
    } as unknown as (typeof PROJECTS)[number]);
    const ck = CONTRACTS.find((k) => k.id === picked.id);
    if (ck) ck.project = id;
    pushApproval({
      id: nextSpId(), ap: pm || picked.owner, type: '立项审批', obj: `${name.trim()} · 立项申请`,
      ref: `${id} 立项申请单`, amt, time: `${TODAY} 10:24`, status: '待审批',
      level: routeLevel, node: 1, reason: '', cc: [],
    } as (typeof APPROVALS)[number]);
    clearDraft();
    toast(`项目「${name.trim()}」已提交立项审批 · 路由至 ${routeLevel}${belowRedline ? '（成本红线升级）' : ''} · 证书需求 ${certNeeds.length} 项已存档 · 已回流项目台帐`);
    go('project');
  };

  /* ---------- 提交（模式 B · 应急） ---------- */
  const submitEmergency = () => {
    const id = nextXmId();
    const deadline = addDays(TODAY, 30);
    const lv = approveLevel(eAmt || 0);
    addProject({
      id, name: eName.trim(), type: eType, biz: eType === '维护保养' ? 'WB' : 'GC', source: '应急工程',
      customer: eCust.trim() || '待补充',
      customerId: CUSTOMERS.find((c) => c.name === eCust.trim())?.id || '',
      owner: ePm, pm: ePm, contractAmt: eAmt || 0, execAmt: eAmt || 0, cost: 0,
      milestone: 0, milestoneName: '待启动', recvPct: 0, risk: 'nocontract', status: '待审批',
      start: TODAY, end: '', profit: 0,
      contractId: '', isEmergency: true, signDeadline: deadline, signType: eSign,
      certNeeds: predictCertNeed(eType, eAmt || 0, 0),
    } as unknown as (typeof PROJECTS)[number]);
    pushApproval({
      id: nextSpId(), ap: ePm || '蓝峰', type: '立项审批', obj: `${eName.trim()} · 应急立项（无合同）`,
      ref: `${id} 立项申请单（应急）`, amt: eAmt || 0, time: `${TODAY} 10:24`, status: '待审批',
      level: lv, node: 1, reason: '', cc: [],
    } as (typeof APPROVALS)[number]);
    clearDraft();
    toast(`应急项目「${eName.trim()}」已提交立项审批 · 路由至 ${lv} · 须于 ${deadline} 前完成合同补签`);
    setEmModal(false);
    go('project');
  };

  /* ---------- 步骤推进（模式 A） ---------- */
  const next = () => {
    if (step === 0) {
      if (!picked) { toast('请先选择一份已签约合同', 'err'); return; }
      setStep(1);
      return;
    }
    if (step === 1) {
      if (!name.trim()) { toast('请填写项目名称', 'err'); return; }
      if (!pm) { toast('请指定项目负责人', 'err'); return; }
      const b = builderCheck(pm);
      if (!b.ok) { toast(`项目负责人不合规：${b.why}`, 'err'); return; }
      if (!start || !end) { toast('请填写计划周期', 'err'); return; }
      if (end <= start) { toast('周期止须晚于周期起', 'err'); return; }
      if (start < picked!.start) { toast(`周期起（${start}）早于合同开工日（${picked!.start}）`, 'err'); return; }
      if (end > picked!.end) { toast(`周期止（${end}）超出合同完工日（${picked!.end}）`, 'err'); return; }
      if (!budgetInit && amt > 0) {
        const r = [['人工费', 0.32], ['材料费', 0.42], ['机械费', 0.06], ['分包费', 0.12], ['其他直接费', 0.08]] as const;
        setBudget(r.map(([n, p]) => ({ n, v: Math.round((amt * p) / 1000) * 1000 })));
        setBudgetInit(true);
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (budgetTotal <= 0) { toast('请填写成本预算（可后补细化，但提交时须有基线）', 'err'); return; }
      setStep(3);
      return;
    }
    if (step === 3) {
      if (!agree) { toast('请先确认立项承诺条款', 'err'); return; }
      submit();
    }
  };

  const submitEmergencyCheck = () => {
    if (!eName.trim()) { toast('请填写项目名称', 'err'); return; }
    if (!ePm) { toast('请指定项目负责人', 'err'); return; }
    const b = builderCheck(ePm);
    if (!b.ok) { toast(`项目负责人不合规：${b.why}`, 'err'); return; }
    if (!eAgree) { toast('请先确认 30 日补签承诺', 'err'); return; }
    setEmModal(true);
  };

  const STEPS = [
    { label: '选择合同', sub: '已签约 · 未立项' },
    { label: '立项信息', sub: '主体 · 负责人 · 预检' },
    { label: '计划与预算', sub: '里程碑 · 成本基线' },
    { label: '确认提交', sub: `审批路由 · ${mode === 'contract' ? routeLevel : '—'}` },
  ];

  /* ============ 渲染 ============ */
  return (
    <>
      <PageHead
        crumbs={['项目管理', '新增项目']}
        title="新增项目 · 立项"
        badges={<Tag tone="blue">立项 v2</Tag>}
        sub="有合同立项 / 应急工程两条入口；提交后进入审批中心，审批通过与驳回实时回写项目状态"
        actions={mode ? <Btn onClick={backToEntry}>← 返回入口</Btn> : undefined}
      />

      {/* 草稿恢复提示（入口层） */}
      {!mode && restore && (
        <div className="nc-warnbox is-info" style={{ marginBottom: 16 }}>
          <b><Ico n="file" size={16} /> 检测到未提交的立项草稿</b>
          <div style={{ marginTop: 8 }}>
            <Btn size="sm" kind="primary" onClick={() => applyDraft(restore)}>恢复草稿</Btn>
            <Btn size="sm" onClick={() => { clearDraft(); setRestore(null); toast('已放弃草稿'); }} style={{ marginLeft: 8 }}>放弃</Btn>
          </div>
        </div>
      )}

      {/* ================= 入口层：两张卡片 ================= */}
      {!mode && (
        <Card hd="选择立项方式" extra={<span className="nc-muted">上游转化（商机→报价→投标→签约）已在各自模块完成，立项只认「已签约」合同</span>}>
          <div className="nc-src-grid">
            {ENTRY_CARDS.map((s) => (
              <div
                key={s.key}
                className={`nc-src-card is-${s.tone}`}
                onClick={() => guard(() => setMode(s.key))}
                {...pressProps(() => guard(() => setMode(s.key)))}
              >
                <div className="nc-src-ic"><Ico n={s.icon} size={20} /></div>
                <div className="nc-src-t">{s.label}</div>
                <div className="nc-src-d">{s.desc}</div>
              </div>
            ))}
          </div>
          <div className="nc-rulebar" style={{ marginTop: 12 }}>
            <b>闭环说明</b>
            <Tip w={380} text={<> ① 一份已签约合同只能立项一个项目（候选自动排除已立项合同）；<br /> ② 立项提交 → 审批中心待办 → 通过后项目置为「已立项」、驳回回到草稿；<br /> ③ 应急项目通过后启动 30 日补签倒计时，逾期计入项目经理考核。 </>} />
          </div>
        </Card>
      )}

      {/* ================= 模式 A · 有合同立项 ================= */}
      {mode === 'contract' && (
        <>
          <div style={{ marginBottom: 16 }}>
            <Steps items={STEPS} cur={step} onStep={(i) => { if (i < step) setStep(i); }} />
          </div>

          {/* ---- Step 1 选择合同 ---- */}
          {step === 0 && (
            <Card hd="① 选择已签约合同" extra={<span className="nc-muted">共 {list.length} 份可立项（已自动排除已立项合同与框架主协议）</span>}>
              <div style={{ marginBottom: 12 }}>
                <input className="nc-input" style={{ width: 360 }} placeholder="搜索合同编号 / 名称 / 客户" value={kw} onChange={(e) => setKw(e.target.value)} />
              </div>
              {list.length === 0 ? (
                <div className="nc-warnbox is-info">
                  <b>暂无符合条件合同</b>
                  <div>「已签约」且未立项的合同为空。可前往合同管理完成签约，或先由审批中心通过在途合同审批。</div>
                  <div style={{ marginTop: 8 }}><Btn size="sm" onClick={() => go('contract')}>前往合同管理</Btn></div>
                </div>
              ) : (
                <div className="nc-pick-list">
                  {list.map((k) => {
                    const i = CONTRACTS.findIndex((x) => x.id === k.id);
                    return (
                      <label key={k.id} className={`nc-pick-row${ctIdx === i ? ' is-on' : ''}`}>
                        <input type="radio" className="nc-check" checked={ctIdx === i} onChange={() => pickContract(i)} />
                        <span className="nc-pick-id num">{k.id}</span>
                        <span className="nc-pick-t">{k.name}</span>
                        <span className="nc-pick-s">{k.type} · {k.party} · {fmtWan(k.execAmt || k.amt)} · {k.start} ~ {k.end}</span>
                      </label>
                    );
                  })}
                </div>
              )}
              {picked && (
                <>
                  <div className="nc-sec-title" style={{ margin: '16px 0 10px' }}>合同带出信息（只读引用）</div>
                  <KvGrid
                    cols={4}
                    rows={[
                      { k: '客户', v: picked.party },
                      { k: '合同总额', v: fmt(amt) },
                      { k: '合同工期', v: `${picked.start} ~ ${picked.end}` },
                      { k: '签约日 / 负责人', v: `${picked.sign} · ${picked.owner}` },
                      { k: '回款节点', v: picked.nodes },
                      { k: '项目类型预映射', v: `${mapTypeBiz(picked.type).type} · ${BIZ.find((b) => b.k === mapTypeBiz(picked.type).biz)?.n}` },
                    ]}
                  />
                  <div className="nc-sec-title" style={{ margin: '16px 0 10px' }}>
                    溯源参考（同客户关联单据 · 由合同继承，只读）
                    <Tip w={340} text="立项不再手选上游单据：商机→报价→投标链路由合同自动继承，此处展示同客户关联单据供核对。" />
                  </div>
                  <div className="nc-pick-inline">
                    {chain.opps.map((o) => <EntityLink key={o.id} target="opp" id={o.id} go={go} title="查看商机">{o.id}</EntityLink>)}
                    {chain.quotes.map((q) => <EntityLink key={q.id} target="quote-detail" id={q.id} go={go} title="查看报价">{q.id}</EntityLink>)}
                    {chain.bids.map((b) => <EntityLink key={b.id} target="bid" id={b.id} go={go} title="查看投标">{b.id}</EntityLink>)}
                    {!chain.opps.length && !chain.quotes.length && !chain.bids.length && <span className="nc-muted">无同客户关联单据（合同直签）</span>}
                  </div>
                </>
              )}
              <div className="nc-wizard-foot">
                <Btn onClick={saveDraft}>保存草稿</Btn>
                <Btn kind="primary" onClick={next}>下一步 · 立项信息</Btn>
              </div>
            </Card>
          )}

          {/* ---- Step 2 立项信息 ---- */}
          {step === 1 && picked && (
            <>
              <Card hd="② 立项信息" extra={<Tag tone="gray">{picked.id}</Tag>}>
                <div className="nc-form-grid">
                  <Field label="项目名称" req span={2}><input className="nc-input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
                  <Field label="项目编号" note="系统生成 · 递增取号"><input className="nc-input" value="提交时自动生成（XM + 6 位）" readOnly disabled /></Field>
                  <Field label="项目类型" req note="按合同类型预映射 · 可改">
                    <select className="nc-input" value={type} onChange={(e) => setType(e.target.value)}>{PTYPES.map((t) => <option key={t}>{t}</option>)}</select>
                  </Field>
                  <Field label="业务条线" req>
                    <select className="nc-input" value={biz} onChange={(e) => setBiz(e.target.value)}>{BIZ.map((b) => <option key={b.k} value={b.k}>{b.n}</option>)}</select>
                  </Field>
                  <Field label="建设单位" note="随合同锁定，保证口径一致">
                    <input className="nc-input" value={picked.party} readOnly disabled />
                  </Field>
                  <Field label="合同金额（含税）" note="以合同为准，不可在此修改"><input className="nc-input" value={fmt(amt)} readOnly disabled /></Field>
                  <Field label="项目负责人" req note="候选 = 本公司持证建造师 · 三要素实时校验">
                    <select className="nc-input" value={pm} onChange={(e) => setPm(e.target.value)}>
                      <option value="">请选择</option>
                      {builderNames().map((p) => {
                        const b = builderCheck(p);
                        return <option key={p} value={p} disabled={!b.ok}>{p}{b.ok ? ' · 可派任' : ` · ${b.why}`}</option>;
                      })}
                    </select>
                  </Field>
                  <Field label="建筑面积（㎡）" note="用于证书需求预判"><input className="nc-input" type="number" value={area || ''} onChange={(e) => setArea(Number(e.target.value))} /></Field>
                  <Field label="计划周期起" req note={`≥ 合同开工日 ${picked.start}`}>
                    <input className="nc-input" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
                  </Field>
                  <Field label="计划周期止" req note={`≤ 合同完工日 ${picked.end}`}>
                    <input className="nc-input" type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
                  </Field>
                </div>

                {pm && (
                  <div className={`nc-builder-box${builderCheck(pm).ok ? ' is-ok' : ' is-bad'}`}>
                    <b>建造师三要素校验 · {pm}</b>
                    <div className="nc-builder-grid">
                      <span><StatusIco kind={builderCheck(pm).ok ? 'ok' : 'ban'} /> ① 注册建造师证书有效</span>
                      <span><StatusIco kind={CERTS.find((c) => c.isBuilder && c.holder === pm)?.hasB ? 'ok' : 'ban'} /> ② B 证有效期内</span>
                      <span><StatusIco kind={((CERTS.find((c) => c.isBuilder && c.holder === pm)?.used as string[]) || []).length === 0 ? 'ok' : 'ban'} /> ③ 无在建项目</span>
                    </div>
                  </div>
                )}
              </Card>

              {pre && (
                <Card hd="合规预检（只读 · 结论随项目存档）" extra={<span className="nc-muted">资质与许可证状态实时取自证书中心</span>}>
                  <div className="nc-builder-box is-ok">
                    <div className="nc-builder-grid">
                      <span>
                        {pre.qual.tone === 'green' ? <StatusIco kind="ok" /> : pre.qual.tone === 'red' ? <StatusIco kind="ban" /> : <Ico n="warning" size={16} />}{' '}
                        企业施工资质 · <span className="nc-muted">{pre.qual.why}</span>
                      </span>
                      <span>
                        {pre.safety.tone === 'green' ? <StatusIco kind="ok" /> : pre.safety.tone === 'red' ? <StatusIco kind="ban" /> : <Ico n="warning" size={16} />}{' '}
                        安全生产许可证 · <span className="nc-muted">{pre.safety.why}</span>
                      </span>
                      <span>
                        {pre.reserve.tone === 'green' ? <StatusIco kind="ok" /> : pre.reserve.tone === 'red' ? <StatusIco kind="ban" /> : <Ico n="warning" size={16} />}{' '}
                        建造师储备 · <span className="nc-muted">{pre.reserve.why}</span>
                      </span>
                    </div>
                  </div>

                  <div className="nc-sec-title" style={{ margin: '16px 0 10px' }}>
                    证书需求清单（按 项目类型 × 金额 × 面积 预判 · 存档不占用）
                    <Tip w={380} text="立项只声明需求，不现场占用证书：开工前在「证书管理」按清单办理关联借出（占用自借出生效起算），齐套方可开工。" />
                  </div>
                  <table className="nc-tbl" style={{ minWidth: 720 }}>
                    <thead><tr><th style={{ width: 280 }}>证书 / 资质</th><th style={{ width: 70, textAlign: 'center' }}>需求</th><th>预判依据</th></tr></thead>
                    <tbody>
                      {certNeeds.map((r) => (
                        <tr key={r.name}>
                          <td><b>{r.name}</b></td>
                          <td style={{ textAlign: 'center' }} className="num">{r.need}</td>
                          <td><span className="nc-tiny">{r.why}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>
              )}

              <div className="nc-rulebar">
                <b>关于服务明细</b>
                <Tip w={400} text={DETAIL_HINT} />
              </div>
              <div className="nc-wizard-foot">
                <Btn onClick={() => setStep(0)}>上一步</Btn>
                <Btn onClick={saveDraft}>保存草稿</Btn>
                <Btn kind="primary" onClick={next}>下一步 · 计划与预算</Btn>
              </div>
            </>
          )}

          {/* ---- Step 3 计划与预算 ---- */}
          {step === 2 && (
            <>
              <Card hd="③ 里程碑计划（可后补细化）" extra={<span className="nc-muted">立项时全部未完成 · 日期可留空后补</span>}>
                <div className="nc-mile-axis">
                  {miles.map((m, i) => (
                    <div key={m.n} className="nc-mile-node">
                      <i>{i + 1}</i>
                      <b>{m.n}</b>
                      <span className="num">{m.d || '待排'}</span>
                    </div>
                  ))}
                </div>
                <table className="nc-tbl" style={{ minWidth: 600, marginTop: 12 }}>
                  <thead><tr><th>里程碑</th><th style={{ width: 170 }}>计划完成</th><th style={{ width: 190 }}>验收节点</th></tr></thead>
                  <tbody>
                    {miles.map((m, i) => (
                      <tr key={m.n}>
                        <td>{m.n}</td>
                        <td><input className="nc-cell-in" type="date" value={m.d} onChange={(e) => setMiles((ms) => ms.map((x, j) => (j === i ? { ...x, d: e.target.value } : x)))} /></td>
                        <td><Check checked={m.ok} onChange={(v) => setMiles((ms) => ms.map((x, j) => (j === i ? { ...x, ok: v } : x)))} label={m.ok ? '需提交核验单' : '普通节点'} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>

              <Card hd="③ 成本预算基线（可后补细化）" extra={<span className="nc-muted">立项后作为「成本台账」预算口径 · 超支触发驾驶舱预警</span>}>
                <table className="nc-tbl" style={{ minWidth: 620 }}>
                  <thead><tr><th>成本科目</th><th style={{ width: 180, textAlign: 'right' }}>预算金额</th><th style={{ width: 110, textAlign: 'right' }}>占合同额</th></tr></thead>
                  <tbody>
                    {budget.map((b, i) => (
                      <tr key={b.n}>
                        <td>{b.n}</td>
                        <td className="is-num"><input className="nc-cell-in" style={{ textAlign: 'right' }} type="number" value={b.v} onChange={(e) => setBudget((bs) => bs.map((x, j) => (j === i ? { ...x, v: Number(e.target.value) } : x)))} /></td>
                        <td className="is-num">{amt ? ((b.v / amt) * 100).toFixed(1) + '%' : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td><b>预算合计</b></td>
                      <td className="is-num"><b className="num">{fmt(budgetTotal)}</b></td>
                      <td className="is-num"><b className={belowRedline ? 'nc-v-red' : ''}>{costRate.toFixed(1)}%</b></td>
                    </tr>
                  </tfoot>
                </table>
                {belowRedline && (
                  <div className="nc-warnbox is-danger" style={{ marginTop: 12 }}>
                    <b><Ico n="warning" size={16} /> 成本率 {costRate.toFixed(1)}% 已超 80% 红线</b>
                    <div>对应毛利率 {(100 - costRate).toFixed(1)}%，低于公司 20% 毛利红线 —— 审批路由已自动升级：<b>{approveLevel(amt)} → {routeLevel}</b>。</div>
                  </div>
                )}
              </Card>

              <div className="nc-wizard-foot">
                <Btn onClick={() => setStep(1)}>上一步</Btn>
                <Btn onClick={saveDraft}>保存草稿</Btn>
                <Btn kind="primary" onClick={next}>下一步 · 确认提交</Btn>
              </div>
            </>
          )}

          {/* ---- Step 4 确认提交 ---- */}
          {step === 3 && picked && (
            <>
              <Card hd="④ 立项确认">
                <KvGrid
                  cols={3}
                  rows={[
                    { k: '立项方式', v: `有合同立项 · ${picked.id}` },
                    { k: '项目名称', v: name || '—' },
                    { k: '建设单位', v: picked.party },
                    { k: '项目类型 / 条线', v: `${type} · ${BIZ.find((b) => b.k === biz)?.n}` },
                    { k: '合同金额（含税）', v: fmt(amt) },
                    { k: '项目负责人', v: pm || '—' },
                    { k: '计划工期', v: `${start} ~ ${end}（合同工期 ${picked.start} ~ ${picked.end}）` },
                    { k: '里程碑', v: `${miles.length} 项 · 验收节点 ${miles.filter((m) => m.ok).length} 个` },
                    { k: '预算成本 / 成本率', v: `${fmt(budgetTotal)} · ${costRate.toFixed(1)}%${belowRedline ? '（超红线）' : ''}` },
                    { k: '证书需求', v: `${certNeeds.length} 项（已存档 · 开工前齐套）` },
                    { k: '合规预检', v: `${pre?.qual.tone === 'green' && pre?.safety.tone === 'green' ? '资质齐备' : '存在黄 / 红灯项，详见预检卡'}` },
                    { k: '审批路由', v: `${routeLevel}${belowRedline ? '（成本红线升级）' : ''}` },
                  ]}
                />
                <div style={{ marginTop: 12 }}>
                  <Check
                    checked={agree}
                    onChange={setAgree}
                    label="本人确认：① 合同真实有效且为本项目唯一立项合同；② 项目负责人三要素齐备；③ 证书需求清单已核对，知悉开工前须办齐关联借出；④ 服务周期明细由计划管理阶段滚动补录。"
                  />
                </div>
                <div className="nc-dnote" style={{ marginTop: 12 }}>
                  <b>提交后：</b>审批中心生成待办（{routeLevel}）· 审批通过项目置为「已立项」、驳回回到草稿 · 项目台帐实时可见。
                </div>
              </Card>
              <div className="nc-wizard-foot">
                <Btn onClick={() => setStep(2)}>上一步</Btn>
                <Btn kind="primary" onClick={next}>提交立项审批</Btn>
              </div>
            </>
          )}
        </>
      )}

      {/* ================= 模式 B · 应急工程（单步） ================= */}
      {mode === 'emergency' && (
        <>
          <div className="nc-warnbox is-danger" style={{ marginBottom: 12 }}>
            <b><Ico n="flame" size={16} /> 应急工程 · 无合同施工</b>
            <div>立项通过后生成「无合同施工」风险标记：每 7 日向项目经理与分管副总推送提醒；<b>30 日内</b>未补签自动升级红色风险并计入项目经理考核。</div>
          </div>
          <Card hd="应急立项信息" extra={<span className="nc-muted">带出字段最少化 · 客户与金额可后补</span>}>
            <div className="nc-form-grid">
              <Field label="项目名称" req span={2}><input className="nc-input" value={eName} onChange={(e) => setEName(e.target.value)} placeholder="如：××酒店消防设施应急抢修" /></Field>
              <Field label="项目负责人" req note="三要素实时校验">
                <select className="nc-input" value={ePm} onChange={(e) => setEPm(e.target.value)}>
                  <option value="">请选择</option>
                  {builderNames().map((p) => {
                    const b = builderCheck(p);
                    return <option key={p} value={p} disabled={!b.ok}>{p}{b.ok ? ' · 可派任' : ` · ${b.why}`}</option>;
                  })}
                </select>
              </Field>
              <Field label="项目类型">
                <select className="nc-input" value={eType} onChange={(e) => setEType(e.target.value)}>{PTYPES.map((t) => <option key={t}>{t}</option>)}</select>
              </Field>
              <Field label="建设单位（可后补）">
                <input className="nc-input" list="ncCustList" value={eCust} onChange={(e) => setECust(e.target.value)} />
              </Field>
              <datalist id="ncCustList">{CUSTOMERS.map((c) => <option key={c.id} value={c.name} />)}</datalist>
              <Field label="预计金额（可后补）" note="暂缺时以成本台账归口，补签后自动回填">
                <input className="nc-input" type="number" value={eAmt || ''} onChange={(e) => setEAmt(Number(e.target.value))} />
              </Field>
              <Field label="拟补签合同类型" req>
                <select className="nc-input" value={eSign} onChange={(e) => setESign(e.target.value)}>{SIGN_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
              </Field>
            </div>
            <div style={{ marginTop: 12 }}>
              <Check checked={eAgree} onChange={setEAgree} label={`本人承诺：本项目为真实应急抢险，将于立项通过后 30 日内（${addDays(TODAY, 30)} 前）完成合同补签，逾期接受考核。`} />
            </div>
            <div className="nc-wizard-foot">
              <Btn onClick={saveDraft}>保存草稿</Btn>
              <Btn kind="primary" onClick={submitEmergencyCheck}>提交立项审批</Btn>
            </div>
          </Card>
        </>
      )}

      {/* ================= 弹层 ================= */}
      {/* 应急提交确认 */}
      <Modal
        open={emModal}
        title="应急工程 · 无合同施工确认"
        width={520}
        onClose={() => setEmModal(false)}
        foot={<>
          <Btn onClick={() => setEmModal(false)}>再想想</Btn>
          <Btn kind="primary" danger onClick={submitEmergency}>确认提交</Btn>
        </>}
      >
        <div className="nc-warnbox is-danger">
          <b><Ico n="warning" size={16} /> 提交后系统将：</b>
          <div>① 在项目卡片与驾驶舱风险区持续提示「无合同施工」；② 每 7 日推送补签提醒；③ 超 30 日未补签升级红色风险。</div>
        </div>
        <KvGrid
          rows={[
            { k: '项目名称', v: eName || '—' },
            { k: '项目负责人', v: ePm || '—' },
            { k: '拟补签合同类型', v: eSign },
            { k: '补签期限', v: `${addDays(TODAY, 30)}（立项日起 30 日）` },
          ]}
        />
      </Modal>

      {/* 离开确认（切换入口 / 返回入口且有已填内容） */}
      <Modal
        open={!!leave}
        title="放弃当前填写内容？"
        width={420}
        onClose={() => setLeave(null)}
        foot={<>
          <Btn onClick={() => setLeave(null)}>继续编辑</Btn>
          <Btn onClick={() => { saveDraft(); const fn = leave; setLeave(null); fn?.(); }}>保存草稿并离开</Btn>
          <Btn kind="primary" danger onClick={() => { const fn = leave; setLeave(null); fn?.(); }}>直接离开</Btn>
        </>}
      >
        <p style={{ margin: 0 }}>当前页面已填写的内容将不会带入新流程。可先保存草稿（重新进入本页可恢复）。</p>
      </Modal>
    </>
  );
}
