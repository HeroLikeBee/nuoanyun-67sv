// 诺安云 6.0 · 新增项目（立项向导）· PRD §14
import React, { useMemo, useState } from 'react';
import {
  Btn, Card, Check, EntityLink, Field, KvGrid, Modal, Op, OpSep, PageHead, Steps, Tag, Tip, useToast, pressProps,} from '../components/ui';
import {
  CERTS, CONTRACTS, CUSTOMERS, OPP_STAGES, OPP_POST, OPPS, PROJECTS, PROJECT_SOURCES, QUOTES, ROLES, TODAY,
  approveLevel, fmt, fmtWan,
} from '../components/data';
import { addProject } from '../components/store';
import { Ico, StatusIco, type IconName } from '../components/icons';

/* ============ 入口来源（4 类） ============ */
type SrcKey = 'bid' | 'opp' | 'quote' | 'emergency';
const SRC_CARDS: { key: SrcKey; label: string; desc: string; icon: IconName; tone: string }[] = [
  { key: 'bid', label: '投标中标', desc: '由已登记「中标」的投标单发起 · 自动带出中标金额与客户', icon: 'trophy', tone: 'blue' },
  { key: 'opp', label: '商机直签', desc: '由「待启动 / 已签」阶段商机发起 · 未走投标流程', icon: 'users', tone: 'green' },
  { key: 'quote', label: '报价转化', desc: '由「已审批」报价单转化 · 带出报价明细作为预算基线', icon: 'file', tone: 'purple' },
  { key: 'emergency', label: '应急工程', desc: '抢险 / 抢修先施工 · 系统标记「无合同施工」，须限期补签', icon: 'flame', tone: 'red' },
];

/* ============ 项目类型 / 业务条线 ============ */
const PTYPES = ['新建', '改造', '维护保养'];
const BIZ = [{ k: 'GC', n: '工程施工' }, { k: 'WB', n: '维护保养' }, { k: 'RJ', n: '消防软件' }, { k: 'QT', n: '其他' }];

/* ============ 服务明细：业务类型（按行选择，不设合同级统一类型） ============ */
const BTYPES = ['火灾自动报警系统', '消火栓系统', '自动喷淋系统', '防排烟系统', '应急照明与疏散指示', '气体灭火系统', '防火门 / 防火卷帘', '维护保养巡检（年度）', '消防设施检测评估', '深化设计与验收辅导', '其他'];
type DetRow = { type: string; ps: string; pe: string; amt: number; note: string };

/* ============ 证书需求预判：按行业自动勾选 ============ */
const CERT_NEED = ['消防专包资质', '建造师（项目经理）', '专职安全员 C 证 ×2', '电工证', '焊工证'] as const;
const CERT_MAP: Record<string, string[]> = {
  商业综合体: ['消防专包资质', '专职安全员 C 证 ×2', '电工证', '焊工证'],
  医疗: ['专职安全员 C 证 ×2', '电工证'],
  教育: ['消防专包资质', '电工证'],
  电力: ['电工证'],
  文旅: ['消防专包资质', '电工证'],
  地产: ['消防专包资质', '建造师（项目经理）', '电工证'],
  园区: ['消防专包资质', '电工证'],
  其他: ['电工证'],
  化工: ['焊工证', '电工证'],
};
const certPredict = (ind: string) => CERT_MAP[ind] || ['电工证'];

/* ============ 附件 4 类（统一入口 + 选分类） ============ */
const FILE_CATS = ['报价清单', '安全协议', '中标通知书', '其他'] as const;
type FileItem = { cat: string; name: string; size: number };

/* ============ 合同 → 项目：行业 / 地区字典 ============ */
const INDS = ['商业综合体', '医疗', '教育', '电力', '化工', '地产', '文旅', '园区', '其他'];
const REGIONS = ['昆明', '曲靖', '楚雄', '文山', '大理', '普洱', '丽江', '广西'];
/** 合同未存行业 / 地区，按承包方主体反查客户档案派生（无档案时兜底） */
const ctMeta = (party: string) => {
  const cu = CUSTOMERS.find((x) => x.name === party);
  return { industry: cu?.industry || '其他', region: cu?.region || '昆明' };
};

/* ============ 证书需求矩阵：按项目类型 × 面积/金额 预判 ============ */
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

/* ============ 建造师三要素校验 ============ */
function builderCheck(name: string) {
  const c = CERTS.find((x) => x.isBuilder && x.holder === name);
  if (!c) return { ok: false, why: '无本公司注册建造师记录' };
  if (c.validTo < TODAY) return { ok: false, why: `证书已于 ${c.validTo} 过期` };
  if (!c.hasB) return { ok: false, why: 'B 类安全生产考核合格证缺失' };
  if ((c.bValidTo || '') < TODAY) return { ok: false, why: `B 证已于 ${c.bValidTo} 过期` };
  if ((c.used as string[]).length >= c.cap) return { ok: false, why: '已有在建项目（一证一项目）' };
  return { ok: true, why: '' };
}

export default function ProjectNewPage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  /** 入口形态：来源向导（4 类） / 从合同新增（存量合同补建项目） */
  const [mode, setMode] = useState<'src' | 'contract'>('src');
  const [step, setStep] = useState(0);
  const [src, setSrc] = useState<SrcKey | ''>('');
  const [srcPick, setSrcPick] = useState('');

  // 从合同新增
  const [ctIdx, setCtIdx] = useState(0);
  const [cSummary, setCSummary] = useState('');
  const [cCert, setCCert] = useState<string[]>([]);

  // 服务明细（服务周期明细行）
  const [details, setDetails] = useState<DetRow[]>([{ type: '', ps: '', pe: '', amt: 0, note: '' }]);
  const [balModal, setBalModal] = useState(false);

  // 附件（4 类）
  const [files, setFiles] = useState<FileItem[]>([
    { cat: '报价清单', name: '消防系统升级报价清单.pdf', size: 520 },
    { cat: '其他', name: '现场勘察照片.zip', size: 8600 },
  ]);

  // Step1 基本信息
  const [name, setName] = useState('');
  const [type, setType] = useState('新建');
  const [biz, setBiz] = useState('GC');
  const [customer, setCustomer] = useState('');
  const [area, setArea] = useState(0);
  const [amt, setAmt] = useState(0);
  const [pm, setPm] = useState('');
  const [start, setStart] = useState('2026-10-08');
  const [end, setEnd] = useState('2027-04-30');
  const [parent, setParent] = useState('');

  // Step2 证书需求
  const [certRows, setCertRows] = useState<{ name: string; need: number; why: string; picked: string[] }[]>([]);
  const [gapModal, setGapModal] = useState(false);

  // Step3
  const [milestones, setMilestones] = useState([
    { n: '进场准备', d: '2026-10-08', ok: true },
    { n: '主体施工', d: '2026-12-20', ok: true },
    { n: '安装调试', d: '2027-02-28', ok: false },
    { n: '消防验收', d: '2027-03-25', ok: false },
    { n: '竣工移交', d: '2027-04-30', ok: false },
  ]);
  const [budget, setBudget] = useState([
    { n: '人工费', v: 620000 }, { n: '材料费', v: 1180000 }, { n: '机械费', v: 180000 },
    { n: '分包费', v: 460000 }, { n: '其他直接费', v: 120000 },
  ]);
  const [agreed, setAgreed] = useState(false);
  const [leaveModal, setLeaveModal] = useState(false);

  /* ============ 来源候选 ============ */
  const srcOptions = useMemo(() => {
    if (src === 'bid') return [
      { id: 'TB000028', t: '产业园一期消防工程', s: '中标 · ¥260.0万 · ××工业园区开发有限公司', amt: 2600000 },
      { id: 'TB000035', t: '昆明万达广场消防改造', s: '中标 · ¥320.0万 · 昆明万达广场商业管理有限公司', amt: 3200000 },
    ];
    if (src === 'opp') return OPPS.filter((o) => OPP_POST.includes(o.stage)).map((o) => ({
      id: o.id, t: o.name, s: `${o.stage} · 预计 ${fmtWan(o.amt)} · ${o.customer}`, amt: o.amt,
    }));
    if (src === 'quote') return QUOTES.filter((q) => q.status === '已审批').map((q) => ({
      id: q.id, t: q.name, s: `已审批 · ${fmtWan(q.total)}（含税）· ${q.customer}`, amt: q.total,
    }));
    return [{ id: 'EMG0001', t: '××酒店消防设施应急抢修', s: '抢险抢修 · 成本 ¥18.6万 · 无合同（须补签）', amt: 0 }];
  }, [src]);

  const pickSrc = (o: { id: string; t: string; s: string; amt: number }) => {
    setSrcPick(o.id);
    setName(o.t);
    setAmt(o.amt);
    const seg = o.s.split(' · ');
    if (seg.length > 2) setCustomer(seg[2].replace(/^.*· /, ''));
    if (src === 'emergency') { setType('维护保养'); setBiz('QT'); }
    if (src === 'bid') setType('新建');
    if (src === 'opp') setType('新建');
    if (src === 'quote') setType('新建');
    setMilestones((m) => m.map((x, i) => ({ ...x, ok: i < 2 })));
  };

  const mkCertRows = () => setCertRows(predictCertNeed(type, amt, area).map((r) => ({ ...r, picked: [] })));

  /* ============ 服务明细：汇总 / 差额 / 补平 ============ */
  const detSum = details.reduce((a, d) => a + (Number(d.amt) || 0), 0);
  const diff = detSum - (Number(amt) || 0);
  const detErrs = details.flatMap((d, i) => {
    const e: string[] = [];
    if (!d.type) e.push(`第 ${i + 1} 行：请选择业务类型`);
    if (!d.ps || !d.pe) e.push(`第 ${i + 1} 行：服务周期起止必填`);
    else if (d.pe <= d.ps) e.push(`第 ${i + 1} 行：周期止须晚于周期起`);
    if (!(Number(d.amt) > 0)) e.push(`第 ${i + 1} 行：金额须大于 0`);
    return e;
  });
  const addRow = () => setDetails((ds) => [...ds, { type: '', ps: '', pe: '', amt: 0, note: '' }]);
  const delRow = (i: number) => {
    if (details.length <= 1) { toast('至少保留一行明细', 'err'); return; }
    setDetails((ds) => ds.filter((_, k) => k !== i));
  };
  /** 一键补平：差额补入最后一行；明细超出预计则须手动调整 */
  const balance = () => {
    if (Math.abs(diff) <= 0.5) { toast('明细已与预计金额一致'); return; }
    if (diff < 0) { toast(`明细超出预计金额 ${fmt(-diff)}，请手动调整明细`, 'err'); return; }
    setDetails((ds) => {
      const last = { ...ds[ds.length - 1] };
      if (!last.type) last.type = '其他';
      last.amt = (Number(last.amt) || 0) + diff;
      return [...ds.slice(0, -1), last];
    });
    toast(`已将差额 ${fmt(diff)} 补入最后一行`);
  };

  /* ============ 从合同新增项目 ============ */
  const ct = CONTRACTS[ctIdx];
  const pickContract = (i: number) => {
    setCtIdx(i);
    const c = CONTRACTS[i];
    setName(`${c.name}（履约）`);
    setCustomer(c.party);
    setAmt(c.amt || c.execAmt);
    setStart(c.start); setEnd(c.end);
    setCSummary(c.name);
    setCCert(certPredict(ctMeta(c.party).industry));
  };
  const createFromContract = () => {
    if (!name.trim()) { toast('请填写项目名称', 'err'); return; }
    if (!customer.trim()) { toast('请填写客户', 'err'); return; }
    if (!pm) { toast('请指定项目负责人', 'err'); return; }
    if (end <= start) { toast('项目周期止须晚于周期起', 'err'); return; }
    if (!(Number(amt) > 0)) { toast('预计金额须大于 0', 'err'); return; }
    /* G1 跨页 Q18：原仅 toast + 跳转，项目台帐查不到新建项目。写入共享 store。 */
    addProject({
      id: `XM000${132 + Math.floor(Math.random() * 800)}`, name: name.trim(), type: '改造', biz: 'GC',
      source: '商机直签', customer: customer.trim(), customerId: '', owner: pm || '—', pm: pm || '—',
      contractAmt: Number(amt), execAmt: Number(amt), cost: 0, milestone: 0, milestoneName: '待启动',
      recvPct: 0, risk: 'none', status: '执行中', start, end, profit: 0,
    } as (typeof PROJECTS)[number]);
    toast(`项目「${name}」创建成功，已关联合同 ${ct.id} · 证书需求 ${cCert.length} 项已同步证书资源中心 · 已回流项目台帐`);
    go('project');
  };

  const next = () => {
    if (step === 0) {
      if (!src) { toast('请先选择项目来源', 'err'); return; }
      if (!srcPick) { toast('请选择要转化的来源单据', 'err'); return; }
      // 应急工程：无合同来源，需二次确认
      if (src === 'emergency') {
        setModalEmergency(true);
        return;
      }
      setStep(1);
      return;
    }
    if (step === 1) {
      if (!name.trim()) { toast('请填写项目名称', 'err'); return; }
      if (!customer) { toast('请选择建设单位（客户）', 'err'); return; }
      if (!pm) { toast('请指定项目负责人', 'err'); return; }
      const b = builderCheck(pm);
      if (!b.ok) { toast(`项目负责人不合规：${b.why}`, 'err'); return; }
      if (!amt && src !== 'emergency') { toast('请填写合同金额', 'err'); return; }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (detErrs.length) { toast(detErrs[0], 'err'); return; }
      if (Math.abs(diff) > 0.5) { setBalModal(true); return; }
      mkCertRows();
      setStep(3);
      return;
    }
    if (step === 3) {
      const unfilled = certRows.filter((r) => r.need > 0 && r.picked.length < Math.min(r.need, 1));
      const gap = certRows.filter((r) => r.picked.length < r.need);
      if (gap.length) { setGapModal(true); return; }
      if (unfilled.length) { toast('存在未关联证书的必填项', 'err'); return; }
      setStep(4);
      return;
    }
    if (step === 4) {
      if (!agreed) { toast('请确认立项承诺条款', 'err'); return; }
      addProject({
        id: `XM000${132 + Math.floor(Math.random() * 800)}`, name: name.trim(), type: type || '改造', biz: 'GC',
        source: src === 'emergency' ? '应急工程' : src === 'bid' ? '投标中标' : src === 'quote' ? '报价转化' : '商机直签',
        customer: customer.trim(), customerId: '', owner: pm || '—', pm: pm || '—',
        contractAmt: Number(amt), execAmt: Number(amt), cost: 0, milestone: 0, milestoneName: '待启动',
        recvPct: 0, risk: 'none', status: '执行中', start, end, profit: 0,
      } as (typeof PROJECTS)[number]);
      toast(`项目「${name}」已提交立项审批，路由至 ${approveLevel(amt)} · 附件 ${files.length} 份已归档 · 已回流项目台帐`);
      go('project');
    }
  };

  const saveDraft = () => toast('草稿已保存 · 可在「项目经营中心 · 草稿」继续编辑');

  const [modalEmergency, setModalEmergency] = useState(false);

  const STEPS = [
    { label: '选择来源', sub: src === 'emergency' ? '应急工程' : '4 类入口' },
    { label: '基本信息', sub: '主体与规模' },
    { label: '服务明细', sub: `${details.length} 行 · 周期与金额` },
    { label: '证书需求', sub: '预判与关联' },
    { label: '计划与预算', sub: '里程碑 / 成本 / 附件' },
  ];

  /* ============ 证书可选池 ============ */
  const poolFor = (certName: string) => {
    const kw = certName.replace(/（.*?）/g, '');
    return CERTS.filter((c) => c.name.includes(kw) || c.subType === kw || (certName.includes('建构筑物') && c.subType === '建构筑物消防员'))
      .map((c) => {
        const expired = c.validTo < TODAY;
        const full = c.mode === 'single' && (c.used as string[]).length >= c.cap;
        return {
          c,
          disabled: expired || full,
          why: expired ? `已过期（${c.validTo}）` : full ? '已达并行占用上限（一证一项目）' : '',
          label: `${c.holder} · ${c.name}${c.subType ? `（${c.subType}）` : ''} · 有效期至 ${c.validTo} · ${c.mode === 'single' ? '一证一项目' : c.mode === 'multi' ? '多项目引用' : '按次登记'}`,
        };
      });
  };

  const budgetTotal = budget.reduce((a, b) => a + b.v, 0);
  const costRate = amt ? (budgetTotal / amt) * 100 : 0;
  const belowRedline = costRate > 80; // 成本红线 80%（毛利率红线 20%）

  /* 证书缺口汇总 */
  const gaps = certRows.filter((r) => r.picked.length < r.need);

  return (
    <>
      <PageHead
        crumbs={['项目管理', mode === 'contract' ? '从合同新增项目' : '新增项目']}
        title={mode === 'contract' ? '从合同新增项目' : '新增项目 · 立项'}
        badges={<>
          {mode === 'contract'
            ? <><Tag tone="blue">存量合同补建项目</Tag><Tag tone="gray">归集证书 / 附件 / 回款</Tag></>
            : <Tag tone="blue">向导</Tag>}
        </>}
        sub={mode === 'contract'
          ? '选择存量合同 → 系统带出客户 / 负责人 / 行业 / 地区 / 金额 / 工期 → 确认后创建项目并自动关联合同'
          : '来源单据 → 基本信息 → 服务明细 → 证书需求 → 计划与预算，五步完成立项；立项后自动进入「项目经营中心」并生成证书借用台账'}
        actions={mode === 'contract'
          ? <><Btn onClick={() => setMode('src')}>← 改用来源向导</Btn><Btn kind="primary" onClick={createFromContract}>创建项目</Btn></>
          : <>
            <Btn onClick={() => { pickContract(ctIdx); setMode('contract'); }}><Ico n="file" size={16} /> 从合同新增项目</Btn>
            <Btn onClick={() => setLeaveModal(true)}>取消</Btn>
            <Btn onClick={saveDraft}>保存草稿</Btn>
            <Btn kind="primary" onClick={next}>{step === 4 ? '提交立项审批' : '下一步'}</Btn>
          </>}
      />

      {mode === 'src' && (
        <div style={{ marginBottom: 16 }}>
          <Steps items={STEPS} cur={step} onStep={(i) => { if (i < step) setStep(i); }} />
        </div>
      )}

      {/* ================= 从合同新增项目（存量合同补建） ================= */}
      {mode === 'contract' && (
        <>
          <Card hd="合同信息（只读引用）" extra={<span className="nc-muted">合同编号 {ct.id}（已签约）</span>}>
            <div style={{ marginBottom: 12 }}>
              <select className="nc-input" style={{ width: 420 }} value={ctIdx} onChange={(e) => pickContract(Number(e.target.value))}>
                {CONTRACTS.map((c, i) => <option key={c.id} value={i}>{c.id} · {c.name}</option>)}
              </select>
            </div>
            <KvGrid cols={4} rows={[
              { k: '客户', v: ct.party },
              { k: '合同总额', v: fmt(ct.amt || ct.execAmt) },
              { k: '签约日期', v: ct.sign },
              { k: '合同工期', v: `${ct.start} ~ ${ct.end}` },
              { k: '行业', v: ctMeta(ct.party).industry },
              { k: '地区', v: ctMeta(ct.party).region },
              { k: '负责人', v: ct.owner },
              { k: '服务内容', v: cSummary || ct.name },
            ]} />
          </Card>

          <div className="nc-issuestrip">
            <span className="nc-issue is-orange">客户 / 负责人 / 行业 / 地区 / 金额 / 周期 已由合同带出，可修改</span>
            <span className="nc-issue">项目周期须落在合同工期（{ct.start} ~ {ct.end}）内，超出将提示核实</span>
          </div>

          <Card hd="新建项目" extra={<span className="nc-muted">带 <b style={{ color: 'var(--c-primary)' }}>proj</b> 徽标的字段已由合同带出，可修改</span>}>
            <div className="nc-form-grid">
              <Field label="项目名称" req span={2}><input className="nc-input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
              <Field label="客户" req note={CUSTOMERS.some((c) => c.name === customer) ? ' 已匹配客户档案' : '未匹配档案 —— 保存后自动建档'}>
                <input className="nc-input" list="ncCustList" value={customer} onChange={(e) => setCustomer(e.target.value)} />
              </Field>
              <datalist id="ncCustList">{CUSTOMERS.map((c) => <option key={c.id} value={c.name} />)}</datalist>
              <Field label="负责人" req>
                <select className="nc-input" value={pm || ct.owner} onChange={(e) => setPm(e.target.value)}>
                  {[ct.owner, '张工', '王工', '李工', '陈工'].filter((v, i, a) => a.indexOf(v) === i).map((p) => {
                    const b = builderCheck(p);
                    return <option key={p} value={p}>{p}{b.ok ? '' : ` · ${b.why}`}</option>;
                  })}
                </select>
              </Field>
              <Field label="行业" req>
                <select className="nc-input" value={ctMeta(ct.party).industry} onChange={(e) => setCCert(certPredict(e.target.value))}>
                  {INDS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="地区" req>
                <select className="nc-input" defaultValue={ctMeta(ct.party).region}>{REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}</select>
              </Field>
              <Field label="签约日期" req note="= 合同签约日"><input className="nc-input" type="date" defaultValue={ct.sign} /></Field>
              <Field label="项目周期起" req><input className="nc-input" type="date" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
              <Field label="项目周期止" req note="周期需落在合同工期内"><input className="nc-input" type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
              <Field label="预计金额（元）" req note="= 合同总额 · 可改">
                <input className="nc-input" type="number" value={amt || ''} onChange={(e) => setAmt(Number(e.target.value))} />
              </Field>
              <Field label="服务内容摘要" span={4}><input className="nc-input" value={cSummary} onChange={(e) => setCSummary(e.target.value)} placeholder="用于项目资料归档与证书需求预判" /></Field>
            </div>

            <div className="nc-sec-title" style={{ margin: '16px 0 10px' }}>
              证书需求预判
              <span className="nc-hint" style={{ fontWeight: 400, marginLeft: 8 }}>按行业自动勾选 · 可调整</span>
            </div>
            <div className="nc-pick-inline">
              {CERT_NEED.map((k) => (
                <label key={k} className={`nc-pick-chip${cCert.includes(k) ? ' is-on' : ''}`}>
                  <input type="checkbox" className="nc-check" checked={cCert.includes(k)}
                    onChange={() => setCCert((p) => p.includes(k) ? p.filter((x) => x !== k) : [...p, k])} />
                  <span>{k}</span>
                </label>
              ))}
            </div>
            <div className="nc-hint" style={{ marginTop: 8 }}>创建后同步至证书资源中心的项目需求清单，配备情况可在项目详情跟踪</div>

            <div className="nc-dnote" style={{ marginTop: 16 }}>
              <b>系统判定：</b>将创建项目 <b className="num">XM0001xx</b>（编号自动生成） · 客户
              {CUSTOMERS.some((c) => c.name === customer)
                ? <span style={{ color: 'var(--c-success-deep)' }}>已匹配档案</span>
                : <span style={{ color: 'var(--c-warning-deep)' }}>未匹配档案，将自动建档</span>}
              {' '}· 证书需求 {cCert.length} 项将同步证书资源中心
              {end > ct.end && <span style={{ color: 'var(--c-warning-deep)' }}> · 项目周期止（{end}）超出合同工期（{ct.end}），请核实</span>}
            </div>
          </Card>
        </>
      )}

      {mode === 'src' && (<>

      {/* ================= Step 0 选择来源 ================= */}
      {step === 0 && (
        <>
          <Card hd="① 选择项目来源" extra={<span className="nc-muted">来源决定带出字段与后续闭环路径</span>}>
            <div className="nc-src-grid">
              {SRC_CARDS.map((s) => (
                <div key={s.key} className={`nc-src-card is-${s.tone}${src === s.key ? ' is-on' : ''}`} onClick={() => { setSrc(s.key); setSrcPick(''); }} {...pressProps(() => { setSrc(s.key); setSrcPick(''); })}>
                  <div className="nc-src-ic"><Ico n={s.icon as IconName} size={20} /></div>
                  <div className="nc-src-t">{s.label}</div>
                  <div className="nc-src-d">{s.desc}</div>
                  {src === s.key && <span className="nc-src-on"><Ico n="check" size={16} /> 已选</span>}
                </div>
              ))}
            </div>
          </Card>

          {src && (
            <Card hd={`② 选择来源单据（${SRC_CARDS.find((s) => s.key === src)?.label}）`} extra={<span className="nc-muted">共 {srcOptions.length} 条可转化</span>}>
              {src === 'emergency' && (
                <div className="nc-warnbox is-danger">
                  <b><Ico n="warning" size={16} /> 应急工程将标记「无合同施工」</b>
                  <div>系统在项目卡片与驾驶舱风险区持续提示，须在 <b>30 日内</b>完成合同补签，否则计入项目经理考核。</div>
                </div>
              )}
              <div className="nc-pick-list">
                {srcOptions.map((o) => (
                  <label key={o.id} className={`nc-pick-row${srcPick === o.id ? ' is-on' : ''}`}>
                    <input type="radio" className="nc-check" checked={srcPick === o.id} onChange={() => pickSrc(o)} />
                    <span className="nc-pick-id num">{(() => {
                      // 单据穿透：来源单据号可下钻回原单（商机 / 报价 / 投标），先看原单再决定是否转化
                      const t = o.id.startsWith('SJ') ? 'opp' : o.id.startsWith('BJ') ? 'quote-detail' : o.id.startsWith('TB') ? 'bid' : '';
                      return t ? <EntityLink target={t} id={o.id} go={go} title="查看来源单据详情">{o.id}</EntityLink> : o.id;
                    })()}</span>
                    <span className="nc-pick-t">{o.t}</span>
                    <span className="nc-pick-s">{o.s}</span>
                  </label>
                ))}
              </div>
            </Card>
          )}

          <div className="nc-rulebar">
            <b>闭环说明</b>
            <Tip w={360} text={<>
              ① 来源单据在立项成功后回写「已立项」，原单不可再重复发起；<br />
              ② 应急工程无合同来源，立项时须指定拟补签合同类型；<br />
              ③ 项目编号自动生成 XM + 6 位流水。
            </>} />
          </div>
        </>
      )}

      {/* ================= Step 1 基本信息 ================= */}
      {step === 1 && (
        <>
          {src === 'emergency' && (
            <div className="nc-warnbox is-danger" style={{ marginBottom: 12 }}>
              <b>应急工程 · 无合同施工</b>
              <div>合同金额暂缺，以成本台账归口；补签合同后由系统自动回填合同金额。</div>
            </div>
          )}
          <Card hd="基本信息" extra={<Tag tone="gray">{srcPick || '未选来源'}</Tag>}>
            <div className="nc-form-grid">
              <Field label="项目名称" req span={2}><input className="nc-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="如：柳州钢铁厂区消防管网改造" /></Field>
              <Field label="项目编号" note="系统生成 · 不可修改"><input className="nc-input" value="XM0001xx（自动生成）" readOnly disabled /></Field>
              <Field label="建设单位（客户）" req>
                <select className="nc-input" value={customer} onChange={(e) => setCustomer(e.target.value)}>
                  <option value="">请选择</option>
                  {CUSTOMERS.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="项目类型" req>
                <select className="nc-input" value={type} onChange={(e) => setType(e.target.value)}>{PTYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
              </Field>
              <Field label="业务条线" req>
                <select className="nc-input" value={biz} onChange={(e) => setBiz(e.target.value)}>{BIZ.map((b) => <option key={b.k} value={b.k}>{b.n}</option>)}</select>
              </Field>
              <Field label="合同金额（含税）" req note={src === 'emergency' ? '应急工程可暂缺' : '取自来源单据 · 可修正'}>
                <input className="nc-input" type="number" value={amt || ''} onChange={(e) => setAmt(Number(e.target.value))} />
              </Field>
              <Field label="建筑面积（㎡）"><input className="nc-input" type="number" value={area || ''} onChange={(e) => setArea(Number(e.target.value))} placeholder="用于证书需求预判" /></Field>
              <Field label="上级框架协议" note="框架协议下的子项目须关联主协议，用于额度扣减">
                <select className="nc-input" value={parent} onChange={(e) => setParent(e.target.value)}>
                  <option value="">无（独立项目）</option>
                  {CONTRACTS.filter((c) => c.type === '框架协议').map((c) => <option key={c.id} value={c.id}>{c.id} · {c.name}（额度 {fmtWan(c.execAmt)}）</option>)}
                </select>
              </Field>
              <Field label="项目负责人" req note="须为「证书有效 + B 证有效 + 无在建」三要素齐备的建造师">
                <select className="nc-input" value={pm} onChange={(e) => setPm(e.target.value)}>
                  <option value="">请选择</option>
                  {['张工', '王工', '李工'].map((p) => {
                    const b = builderCheck(p);
                    return <option key={p} value={p} disabled={!b.ok}>{p}{b.ok ? ' · 可派任' : ` · ${b.why}`}</option>;
                  })}
                </select>
              </Field>
              <Field label="计划开工" req><input className="nc-input" type="date" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
              <Field label="计划完工" req><input className="nc-input" type="date" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
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
          <div className="nc-wizard-foot">
            <Btn onClick={() => setStep(0)}>上一步</Btn>
            <Btn kind="primary" onClick={next}>下一步 · 服务明细</Btn>
          </div>
        </>
      )}

      {/* ================= Step 2 服务明细（服务周期明细行 + 差额汇总） ================= */}
      {step === 2 && (
        <>
          <div className="nc-sum3">
            <div className="nc-sum3-cell">
              <span>明细合计（自动汇总）</span>
              <b className="num">{fmt(detSum)}</b>
              <em>由明细行实时计算，不可直接填写</em>
            </div>
            <div className="nc-sum3-cell">
              <span>预计金额</span>
              <b className="num">{fmt(Number(amt) || 0)}</b>
              <em>来自步骤①，如需调整请返回修改</em>
            </div>
            <div className={`nc-sum3-cell${Math.abs(diff) <= 0.5 ? ' is-ok' : ' is-bad'}`}>
              <span>差额</span>
              <b className="num">{diff > 0 ? '+' : ''}{fmt(diff)}</b>
              <em>{Math.abs(diff) <= 0.5 ? ' 明细与预计金额一致' : diff > 0 ? '明细超出预计，请核对' : '明细不足 · 可一键补平'}</em>
            </div>
          </div>

          <Card flush hd="服务周期明细" extra={<Btn size="sm" onClick={balance} disabled={Math.abs(diff) <= 0.5 || diff < 0} title={Math.abs(diff) <= 0.5 ? '各周期占比已平衡，无需补平' : diff < 0 ? '占比合计已超 100%，请先调减后再补平' : '按比例自动补平到 100%'}>一键补平</Btn>}>
            <div className="nc-listhint">
              <span>服务周期明细<Tip text="业务类型按行选择，不设项目级统一类型；金额合计需与预计金额一致（不一致将提示，可一键补平）。" /></span>
              <span className="nc-listhint-sp" />
              <span>共 {details.length} 行 · 合计 {fmt(detSum)}</span>
            </div>
            <div style={{ padding: '0 16px 8px' }}>
              <table className="nc-tbl" style={{ minWidth: 860 }}>
                <thead>
                  <tr>
                    <th style={{ width: 190 }}>业务类型</th>
                    <th style={{ width: 150 }}>服务周期起</th>
                    <th style={{ width: 150 }}>服务周期止</th>
                    <th style={{ width: 140, textAlign: 'right' }}>金额（元）</th>
                    <th>备注</th>
                    <th style={{ width: 56 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {details.map((d, i) => {
                    const bad = d.pe && d.ps && d.pe <= d.ps;
                    return (
                      <tr key={i}>
                        <td>
                          <select className="nc-cell-in" style={{ width: '100%' }} value={d.type}
                            onChange={(e) => setDetails((ds) => ds.map((x, j) => j === i ? { ...x, type: e.target.value } : x))}>
                            <option value="">请选择</option>
                            {BTYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </td>
                        <td><input className="nc-cell-in" type="date" value={d.ps} onChange={(e) => setDetails((ds) => ds.map((x, j) => j === i ? { ...x, ps: e.target.value } : x))} /></td>
                        <td>
                          <input className="nc-cell-in" type="date" value={d.pe} onChange={(e) => setDetails((ds) => ds.map((x, j) => j === i ? { ...x, pe: e.target.value } : x))} />
                          {bad && <div className="nc-cell-sub" style={{ color: 'var(--c-danger)' }}>周期止须晚于周期起</div>}
                        </td>
                        <td className="is-num"><input className="nc-cell-in" style={{ textAlign: 'right', width: '100%' }} type="number" min={0} value={d.amt || ''} onChange={(e) => setDetails((ds) => ds.map((x, j) => j === i ? { ...x, amt: Number(e.target.value) } : x))} /></td>
                        <td><input className="nc-cell-in" style={{ width: '100%' }} value={d.note} onChange={(e) => setDetails((ds) => ds.map((x, j) => j === i ? { ...x, note: e.target.value } : x))} placeholder="如 住院楼 1~6 层" /></td>
                        <td><span className="nc-ops"><Op danger onClick={() => delRow(i)}><Ico n="close" size={16} /></Op></span></td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="nc-tbl-sum">
                    <td colSpan={3}>明细合计</td>
                    <td className="is-num"><b className="num">{fmt(detSum)}</b></td>
                    <td colSpan={2} style={{ fontWeight: 400, color: 'var(--ink-3)' }}>
                      与预计金额差额 {diff > 0 ? '+' : ''}{fmt(diff)} · {details.length} 行
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div style={{ padding: '0 16px 16px' }}>
              <button className="nc-addrow" onClick={addRow}>＋ 添加明细行</button>
            </div>
          </Card>

          {detErrs.length > 0 && (
            <div className="nc-warnbox is-warn">
              <b><Ico n="warning" size={16} /> 明细行存在 {detErrs.length} 项待完善</b>
              <div>{detErrs.slice(0, 4).join('；')}{detErrs.length > 4 ? ' …' : ''}</div>
            </div>
          )}

          <div className="nc-wizard-foot">
            <Btn onClick={() => setStep(1)}>上一步</Btn>
            <Btn onClick={saveDraft}>保存草稿</Btn>
            <Btn kind="primary" onClick={next}>下一步 · 证书需求预判</Btn>
          </div>
        </>
      )}

      {/* ================= Step 3 证书需求 ================= */}
      {step === 3 && (
        <>
          <Card
            hd="证书需求预判"
            extra={<><span className="nc-muted">依据 项目类型 × 金额 × 面积 自动预判，可人工调整</span><Btn size="sm" onClick={mkCertRows}>重新预判</Btn></>}
          >
            <div className="nc-warnbox is-info">
              <b>占用方式三分法</b>
              <div>【一证一项目】同一证书同时只能被 1 个项目占用；【多项目引用】企业资质类，可被多项目同时引用；【按次登记】作业人员类，按项目登记使用次数，不占用排他额度。</div>
            </div>
            <table className="nc-tbl" style={{ minWidth: 900 }}>
              <thead>
                <tr><th style={{ width: 260 }}>证书 / 资质</th><th style={{ width: 70, textAlign: 'center' }}>需求</th><th style={{ width: 100 }}>预判依据</th><th>关联证书（借给本项目）</th><th style={{ width: 90 }}>状态</th></tr>
              </thead>
              <tbody>
                {certRows.map((r, i) => {
                  const pool = poolFor(r.name);
                  const short = r.picked.length < r.need;
                  return (
                    <tr key={r.name}>
                      <td><b>{r.name}</b></td>
                      <td style={{ textAlign: 'center' }}>
                        <input className="nc-cell-in" style={{ width: 48, textAlign: 'center' }} type="number" value={r.need}
                          onChange={(e) => setCertRows((rs) => rs.map((x, j) => j === i ? { ...x, need: Number(e.target.value) } : x))} />
                      </td>
                      <td><span className="nc-tiny">{r.why}</span></td>
                      <td>
                        {pool.length === 0 ? <span className="nc-muted">无可用证书，需先到「证书管理」新增或续期</span> : (
                          <div className="nc-pick-inline">
                            {pool.map((p) => {
                              const on = r.picked.includes(p.c.id);
                              return (
                                <label key={p.c.id} className={`nc-pick-chip${on ? ' is-on' : ''}${p.disabled ? ' is-disabled' : ''}`} title={p.why}>
                                  <input type="checkbox" className="nc-check" disabled={p.disabled} checked={on}
                                    onChange={() => setCertRows((rs) => rs.map((x, j) => j === i ? {
                                      ...x, picked: on ? x.picked.filter((k) => k !== p.c.id) : (x.picked.length >= x.need ? x.picked : [...x.picked, p.c.id]),
                                    } : x))} />
                                  <span>{p.label}{p.disabled && <em className="nc-pick-why"> · {p.why}</em>}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </td>
                      <td>{short ? <Tag tone="red">缺 {r.need - r.picked.length}</Tag> : <Tag tone="green">已齐</Tag>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>

          {gaps.length > 0 && (
            <div className="nc-warnbox is-warn">
              <b><Ico n="warning" size={16} /> 存在 {gaps.length} 项证书缺口</b>
              <div>
                缺口项：{gaps.map((g) => `${g.name}（缺 ${g.need - g.picked.length}）`).join('、')}。
                缺口不阻断立项，但会阻断投标与开工；请到「证书管理」办理续期或提额。
              </div>
              <div style={{ marginTop: 8 }}>
                <Btn size="sm" kind="primary" onClick={() => setGapModal(true)}>一键补平（差额调配）</Btn>
                <Btn size="sm" onClick={() => go('cert')}>前往证书管理</Btn>
              </div>
            </div>
          )}

          <div className="nc-wizard-foot">
            <Btn onClick={() => setStep(2)}>上一步</Btn>
            <Btn onClick={saveDraft}>保存草稿</Btn>
            <Btn kind="primary" onClick={next}>下一步 · 计划与预算</Btn>
          </div>
        </>
      )}

      {/* ================= Step 4 计划与预算 ================= */}
      {step === 4 && (
        <>
          <Card hd="里程碑计划" extra={<span className="nc-muted">验收节点用于「竣工验收消防查验记录」校验，缺失必需资料不予结项</span>}>
            <div className="nc-mile-axis">
              {milestones.map((m, i) => (
                <div key={m.n} className={`nc-mile-node${m.ok ? ' is-done' : ''}`}>
                  {/* 已完成 = ✓ 打勾（success 语义）；未完成为序号 */}
                  <i>{m.ok ? <Ico n="check" size={12} /> : i + 1}</i>
                  <b>{m.n}</b>
                  <span className="num">{m.d}</span>
                </div>
              ))}
            </div>
            <table className="nc-tbl" style={{ minWidth: 600, marginTop: 12 }}>
              <thead><tr><th>里程碑</th><th style={{ width: 160 }}>计划完成</th><th style={{ width: 120 }}>是否验收节点</th></tr></thead>
              <tbody>
                {milestones.map((m, i) => (
                  <tr key={m.n}>
                    <td>{m.n}</td>
                    <td><input className="nc-cell-in" type="date" value={m.d} onChange={(e) => setMilestones((ms) => ms.map((x, j) => j === i ? { ...x, d: e.target.value } : x))} /></td>
                    <td><Check checked={m.ok} onChange={(v) => setMilestones((ms) => ms.map((x, j) => j === i ? { ...x, ok: v } : x))} label={m.ok ? '需提交核验单' : '普通节点'} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <Card hd="成本预算基线" extra={<span className="nc-muted">立项后作为「成本台账」的预算口径，超支触发驾驶舱预警</span>}>
            <table className="nc-tbl" style={{ minWidth: 620 }}>
              <thead><tr><th>成本科目</th><th style={{ width: 180, textAlign: 'right' }}>预算金额</th><th style={{ width: 110, textAlign: 'right' }}>占合同额</th></tr></thead>
              <tbody>
                {budget.map((b, i) => (
                  <tr key={b.n}>
                    <td>{b.n}</td>
                    <td className="is-num"><input className="nc-cell-in" style={{ textAlign: 'right' }} type="number" value={b.v} onChange={(e) => setBudget((bs) => bs.map((x, j) => j === i ? { ...x, v: Number(e.target.value) } : x))} /></td>
                    <td className="is-num">{amt ? ((b.v / amt) * 100).toFixed(1) + '%' : '—'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td><b>预算合计</b></td><td className="is-num"><b className="num">{fmt(budgetTotal)}</b></td><td className="is-num"><b className={belowRedline ? 'nc-v-red' : ''}>{costRate.toFixed(1)}%</b></td></tr>
              </tfoot>
            </table>
            {belowRedline && (
              <div className="nc-warnbox is-danger" style={{ marginTop: 12 }}>
                <b><Ico n="warning" size={16} /> 成本率 {costRate.toFixed(1)}% 已超 80% 红线</b>
                <div>对应毛利率 {(100 - costRate).toFixed(1)}%，低于公司 20% 毛利红线，立项金额将路由至 {approveLevel(amt)} 审批。</div>
              </div>
            )}
          </Card>

          <Card hd="附件（4 类 · 统一入口 + 选分类）" extra={<span className="nc-muted">共 {files.length} 份 · 立项后归入项目资料归档</span>}>
            {FILE_CATS.map((cat) => {
              const fs = files.filter((f) => f.cat === cat);
              return (
                <div key={cat} style={{ marginBottom: 12 }}>
                  <div className="nc-fg-head">
                    <span className="nc-fg-title">{cat}</span>
                    <span className="nc-fg-count">{fs.length} 份</span>
                  </div>
                  {fs.length
                    ? fs.map((f, i) => (
                      <span className="nc-filechip" key={`${f.name}-${i}`}>
                        <b>{f.name}</b>
                        <span className="nc-cell-sub">{f.size} KB</span>
                        <Op danger onClick={() => setFiles((p) => p.filter((x) => x !== f))}>删除</Op>
                      </span>
                    ))
                    : <div className="nc-empty-mini">暂无文件</div>}
                  <div>
                    <Btn size="sm" onClick={() => {
                      const n = `${cat}-${name.slice(0, 10) || '项目'}-${Math.floor(Math.random() * 900 + 100)}.pdf`;
                      setFiles((p) => [...p, { cat, name: n, size: Math.floor(Math.random() * 2000 + 300) }]);
                      toast(`已添加「${cat}」附件（演示）`);
                    }}>＋ 添加{cat}</Btn>
                  </div>
                </div>
              );
            })}
          </Card>

          <Card hd="立项确认">
            <KvGrid cols={3} rows={[
              { k: '项目来源', v: SRC_CARDS.find((s) => s.key === src)?.label || '—' },
              { k: '来源单据', v: srcPick || '—' },
              { k: '服务明细', v: `${details.length} 行 · 合计 ${fmt(detSum)}` },
              { k: '项目名称', v: name || '—' },
              { k: '建设单位', v: customer || '—' },
              { k: '项目类型 / 条线', v: `${type} · ${BIZ.find((b) => b.k === biz)?.n}` },
              { k: '合同金额（含税）', v: amt ? fmt(amt) : '待补签' },
              { k: '项目负责人', v: pm || '—' },
              { k: '计划工期', v: `${start} ~ ${end}` },
              { k: '上级框架协议', v: parent || '无' },
              { k: '证书需求项', v: `${certRows.length} 项 · 缺口 ${gaps.length} 项` },
              { k: '预算成本 / 成本率', v: `${fmt(budgetTotal)} · ${costRate.toFixed(1)}%` },
              { k: '审批路由', v: approveLevel(amt) },
            ]} />
            <div style={{ marginTop: 12 }}>
              <Check checked={agreed} onChange={setAgreed}
                label="本人确认：① 项目来源真实有效；② 项目负责人三要素齐备；③ 证书缺口已如实申报；④ 应急工程将在 30 日内完成合同补签。" />
            </div>
          </Card>

          <div className="nc-wizard-foot">
            <Btn onClick={() => setStep(3)}>上一步</Btn>
            <Btn onClick={saveDraft}>保存草稿</Btn>
            <Btn kind="primary" onClick={next}>提交立项审批</Btn>
          </div>
        </>
      )}

      </>)}

      {/* ================= 明细金额不平衡 ================= */}
      <Modal open={balModal} title="金额不平衡" width={560} onClose={() => setBalModal(false)}
        foot={<><Btn onClick={() => setBalModal(false)}>返回调整明细</Btn><Btn kind="primary" onClick={() => { setBalModal(false); mkCertRows(); setStep(3); }}>继续提交</Btn></>}>
        <div style={{ fontSize: 13, lineHeight: 1.9 }}>
          明细合计 <b className="num">{fmt(detSum)}</b> 与预计金额 <b className="num">{fmt(Number(amt) || 0)}</b> 相差{' '}
          <b style={{ color: 'var(--c-warning-deep)' }}>{fmt(Math.abs(diff))}</b>。
          <div className="nc-hint">可返回调整明细或一键补平，也可继续提交（转合同时以明细为准逐行转入）。</div>
          <div style={{ marginTop: 12 }}>
            <Btn size="sm" onClick={() => { balance(); setBalModal(false); }} disabled={diff < 0}>
              一键补平（差额 {fmt(Math.abs(diff))} 补入最后一行）
            </Btn>
            {diff < 0 && <span className="nc-hint" style={{ marginLeft: 8 }}>明细超出预计金额，不支持自动补平，请手动调整</span>}
          </div>
        </div>
      </Modal>

      {/* ================= 缺口补平 ================= */}
      <Modal open={gapModal} title={`证书缺口补平 · 差额调配（${gaps.length} 项）`} width={720} onClose={() => setGapModal(false)}
        foot={<><Btn onClick={() => { setGapModal(false); go('cert'); }}>前往证书管理处理</Btn><Btn kind="primary" onClick={() => {
          // 一键补平：对可调配的按次登记类自动补足
          setCertRows((rs) => rs.map((r) => {
            if (r.picked.length >= r.need) return r;
            const pool = poolFor(r.name).filter((p) => !p.disabled);
            const add = pool.filter((p) => !r.picked.includes(p.c.id)).slice(0, r.need - r.picked.length).map((p) => p.c.id);
            return { ...r, picked: [...r.picked, ...add] };
          }));
          setGapModal(false);
          toast('已按差额补齐可用证书，仍缺项请前往证书管理办理');
        }}>一键补平可用差额</Btn></>}>
        <div className="nc-issuestrip">
          <span className="nc-issue is-red">硬约束：一证一项目类证书不可跨项目复用</span>
          <span className="nc-issue is-orange">到期类须先续期</span>
        </div>
        <table className="nc-tbl" style={{ minWidth: 640 }}>
          <thead><tr><th>证书 / 资质</th><th style={{ width: 70, textAlign: 'center' }}>需求</th><th style={{ width: 70, textAlign: 'center' }}>已联</th><th style={{ width: 70, textAlign: 'center' }}>缺口</th><th>可补方案</th></tr></thead>
          <tbody>
            {gaps.map((g) => {
              const avail = poolFor(g.name).filter((p) => !p.disabled && !g.picked.includes(p.c.id));
              return (
                <tr key={g.name}>
                  <td><b>{g.name}</b></td>
                  <td style={{ textAlign: 'center' }} className="num">{g.need}</td>
                  <td style={{ textAlign: 'center' }} className="num">{g.picked.length}</td>
                  <td style={{ textAlign: 'center' }}><Tag tone="red">{g.need - g.picked.length}</Tag></td>
                  <td>{avail.length ? <span className="nc-tiny">可补：{avail.map((a) => a.c.holder).join('、')}（{avail.length} 个）</span> : <span className="nc-tiny nc-v-red">无可用证书 → 须新增/续期/提额</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Modal>

      {/* ================= 应急工程确认 ================= */}
      <Modal open={modalEmergency} title="应急工程 · 无合同施工确认" width={520} onClose={() => setModalEmergency(false)}
        foot={<><Btn onClick={() => setModalEmergency(false)}>再想想</Btn><Btn kind="primary" danger onClick={() => { setModalEmergency(false); setStep(1); }}>确认立项</Btn></>}>
        <div className="nc-warnbox is-danger">
          <b><Ico n="warning" size={16} /> 该来源无合同，立项后将生成「无合同施工」风险标记</b>
          <div style={{ marginTop: 8 }}>系统将：① 在项目卡片与驾驶舱风险区持续提示；② 每 7 日向项目经理与分管副总推送提醒；③ 超过 30 日未补签自动升级为红色风险。</div>
        </div>
        <KvGrid rows={[{ k: '来源单据', v: srcPick || '—' }, { k: '项目名称', v: name || '—' }, { k: '拟补签合同类型', v: '维护保养合同 / 销售合同' }, { k: '补签期限', v: '立项日起 30 日内' }]} />
      </Modal>

      {/* ================= 离开确认 ================= */}
      <Modal open={leaveModal} title="离开向导？" width={420} onClose={() => setLeaveModal(false)}
        foot={<><Btn onClick={() => setLeaveModal(false)}>继续编辑</Btn><Btn kind="primary" danger onClick={() => { setLeaveModal(false); go('project'); }}>放弃并离开</Btn></>}>
        <p style={{ margin: 0 }}>已填写的立项信息将不会保存，确定离开吗？</p>
      </Modal>
    </>
  );
}
