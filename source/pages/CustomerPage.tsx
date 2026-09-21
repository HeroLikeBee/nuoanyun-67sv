// 客户管理（列表 · 还原截图基准页）—— 客户主数据唯一建档入口
// 十要素：骨架/统计卡/筛选/完整列/新建弹窗/详情抽屉/状态机/规则/示例数据
import React, { useEffect, useMemo, useState } from 'react';
import {
  Btn, Banner, Card, DataTable, Drawer, EntityLink, Field, KvGrid, ListToolbar, Modal, Op, OpSep,
  PageHead, Progress, TableFoot, Tabs, Tag, Timeline, Tip, useToast, Code, IdCell, pressProps,} from '../components/ui';
import { CUSTOMERS, FOLLOWS, OPPS, OPP_TERMINAL, PROJECTS, QUOTES, CONTRACTS, fmtWan, canSeeMoney, TODAY } from '../components/data';
import { getFocus, setFocus } from '../components/store';
import { Ico } from '../components/icons';

const ST_TONE: Record<string, 'green' | 'blue' | 'gray'> = { 成交: 'green', 意向: 'blue', 潜在: 'gray' };
const G_TONE: Record<string, 'orange' | 'blue' | 'gray'> = { A: 'orange', B: 'blue', C: 'gray', 潜: 'gray' };
const G_TXT: Record<string, string> = { A: 'A 级 · 战略客户', B: 'B 级 · 重点客户', C: 'C 级 · 常规客户', 潜: '潜在客户 · 尚无成交' };
type C = (typeof CUSTOMERS)[number];
type Contact = { n: string; r: string; p: string };

/** 等级：无成交 → 潜在（尚无成交），其余按累计成交自动归档 */
const gOf = (c: C) => (c.dealAmt > 0 ? c.grade : '潜');
/** 在谈商机（优先按 customerId 关联，回退按客户名） */
const pipeOf = (c: C) => OPPS.filter((o) => (o as any).customerId ? (o as any).customerId === c.id : o.customer === c.name);
/** 报价单归属 */
const quotesOf = (c: C) => QUOTES.filter((q) => q.customerId === c.id || q.customer === c.name);
/** 合同关联（按承包方主体名称） */
const contractsOf = (c: C) => CONTRACTS.filter((x) => x.party === c.name);
/** 项目关联（优先按 customerId 外键，回落按客户名） */
const projectsOf = (c: C) => PROJECTS.filter((p) => ((p as { customerId?: string }).customerId === c.id) || p.customer === c.name);

/** 联系人：主联系人 + 决策链其他成员（客户决策链留痕，跨团队脱敏） */
const CONTACT_SEED: Record<string, Contact[]> = {
  KH20260312001: [{ n: '王志豪', r: '工程部经理', p: '138****1101' }, { n: '李蓉', r: '招采负责人', p: '139****2087' }, { n: '张宏', r: '区域总经理', p: '137****6631' }],
  KH20260312002: [{ n: '李教授', r: '后勤副校长', p: '138****2203' }, { n: '马俊', r: '总务处主任', p: '139****5520' }],
  KH20260418003: [{ n: '张教授', r: '后勤保障部主任', p: '137****3105' }, { n: '刘敏', r: '基建科科长', p: '138****4412' }],
  KH20250902004: [{ n: '刘国栋', r: '设备科科长', p: '136****4402' }, { n: '杨丽', r: '财务科', p: '135****7788' }],
  KH20260620006: [{ n: '徐志强', r: '安环部部长', p: '187****6606' }],
  KH20260115007: [{ n: '孙飞', r: '后勤保障部主管', p: '138****7707' }, { n: '周涛', r: '消防主管', p: '139****3312' }],
  KH20260506005: [{ n: '陈主任', r: '园区管委会', p: '138****5506' }],
  KH20260728008: [{ n: '周总', r: '项目总经理', p: '137****8804' }],
};
const seedContacts = (c: C): Contact[] => CONTACT_SEED[c.id] || [{ n: c.contact, r: '主联系人', p: c.phone }];
const pipeAmtOf = (c: C) => pipeOf(c).reduce((a, o) => a + (o.amt || 0), 0);
/** 合同回款率 = 1 − 应收余额 / 累计成交 */
const recvRate = (c: C) => (c.dealAmt > 0 ? Math.round((1 - c.recv / c.dealAmt) * 100) : 0);

const GRADE_RULE = '等级规则：A 年成交 ≥300 万 · B 100~300 万 · C <100 万 · 潜在 = 尚无成交（按累计成交自动归档，可手工覆盖并留痕）';

export default function CustomerPage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  const money = canSeeMoney(role);
  const [tab, setTab] = useState('all');
  const [kw, setKw] = useState('');
  const [industry, setIndustry] = useState('');
  const [region, setRegion] = useState('');
  const [grade, setGrade] = useState('');
  const [status, setStatus] = useState('');
  const [source, setSource] = useState('');
  const [owner, setOwner] = useState('');
  const [recent, setRecent] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sel, setSel] = useState<string[]>([]);
  const [detail, setDetail] = useState<C | null>(null);
  /**
   * 跨页穿透：从商机 / 报价 / 投标 / 项目 / 合同 / 发票等页面下钻进来时，自动打开目标客户档案。
   * 以 nav（路由脉冲）为依赖，保证反复下钻同一页也能重新定位。
   */
  useEffect(() => {
    const id = getFocus('customer');
    if (!id) return;
    const hit = CUSTOMERS.find((x) => x.id === id);
    if (hit) setDetail(hit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav]);
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState<C | null>(null);
  const [followOpen, setFollowOpen] = useState<C | null>(null);
  const [transferOpen, setTransferOpen] = useState<C | null>(null);
  const [convertOpen, setConvertOpen] = useState<C | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  // 联系人（决策链多人）
  const [ctOv, setCtOv] = useState<Record<string, Contact[]>>({});
  const [delCt, setDelCt] = useState<{ c: C; i: number } | null>(null);
  const [ctN, setCtN] = useState('');
  const [ctR, setCtR] = useState('');
  const [ctP, setCtP] = useState('');

  // 表单态
  const [fName, setFName] = useState('');
  const [fContact, setFContact] = useState('');
  const [fPhone, setFPhone] = useState('');
  const [fRegion, setFRegion] = useState('昆明');
  const [fGrade, setFGrade] = useState('C');
  const [fSource, setFSource] = useState('自主开发');
  const [fStatus, setFStatus] = useState('潜在');
  const [fIndustry, setFIndustry] = useState('商业综合体');
  const [fNote, setFNote] = useState('');
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [dupTip, setDupTip] = useState('');
  // 跟进态
  const [way, setWay] = useState('上门拜访');
  const [photo, setPhoto] = useState(0);
  const [gps, setGps] = useState('');
  const [followText, setFollowText] = useState('');

  const openEdit = (c: C | null) => {
    setEditRow(c);
    setFName(c?.name || ''); setFContact(c?.contact || ''); setFPhone(c?.fullPhone || '');
    setFRegion(c?.region || '昆明'); setFGrade(c?.grade || 'C'); setFSource(c?.source || '自主开发');
    setFStatus(c?.status === '成交' ? '成交' : c?.status || '潜在');
    setFIndustry(c?.industry || '商业综合体'); setFNote(c?.note || '');
    setErrs({}); setDupTip(''); setEditOpen(true);
  };

  const onNameChange = (v: string) => {
    setFName(v);
    const key = v.replace(/有限公司|股份|集团|管理|科技|医院|中学|大学/g, '').slice(0, 4);
    const hit = v.length >= 4 && CUSTOMERS.find((c) => c.name.replace(/有限公司|股份|集团|管理|科技|医院|中学|大学/g, '').slice(0, 4) === key);
    setDupTip(hit ? `与「${hit.name}」相似度 ≥80%，可能重复：查看 / 合并 / 仍要新建` : '');
  };

  const save = () => {
    const e: Record<string, string> = {};
    if (!fName) e.name = '请填写客户名称';
    if (!fContact) e.contact = '联系人姓名必填（≤20 字）';
    if (!fPhone) e.phone = '联系电话必填（重复将触发撞单提示）';
    if (!fRegion) e.region = '区域必填';
    setErrs(e);
    if (Object.keys(e).length) { toast('表单校验未通过 · 请检查红框字段', 'err'); return; }
    setEditOpen(false);
    toast(editRow ? `客户档案已更新（${editRow.id}）` : '客户档案已创建，可进入详情添加联系人');
  };

  /** 当前页签范围内的基集（chip 计数口径） */
  const base = useMemo(() => CUSTOMERS.filter((c) => {
    if (tab === 'mine' && c.owner !== '蓝峰') return false;
    if (tab === 'public' && c.status === '成交') return false;
    return true;
  }), [tab]);
  const cntBy = (fn: (c: C) => boolean) => base.filter(fn).length;

  const rows = useMemo(() => CUSTOMERS.filter((c) => {
    if (tab === 'mine' && c.owner !== '蓝峰') return false;
    if (tab === 'public' && c.status === '成交') return false;
    if (industry && c.industry !== industry) return false;
    if (region && c.region !== region) return false;
    if (grade && gOf(c) !== grade) return false;
    if (status && c.status !== status) return false;
    if (source && c.source !== source) return false;
    if (owner && c.owner !== owner) return false;
    if (recent === 'd30' && c.lastFollowDays <= 30) return false;
    if (recent === 'd14' && c.lastFollowDays <= 14) return false;
    if (kw && !(c.name + c.id + c.contact + c.phone).includes(kw)) return false;
    return true;
  }), [tab, industry, region, grade, status, source, owner, recent, kw]);

  const paged = rows.slice((page - 1) * pageSize, page * pageSize);
  const stat = useMemo(() => ({
    total: CUSTOMERS.length,
    deal: CUSTOMERS.reduce((s, c) => s + c.dealAmt, 0),
    recv: CUSTOMERS.reduce((s, c) => s + c.recv, 0),
    /* 活跃商机金额 = 全部非终态商机金额合计（真实派生，替代原硬编码 18900000） */
    active: OPPS.filter((o) => !OPP_TERMINAL.includes(o.stage)).reduce((s, o) => s + o.amt, 0),
  }), []);

  const reset = () => {
    setKw(''); setIndustry(''); setRegion(''); setGrade(''); setStatus(''); setSource(''); setOwner(''); setRecent('all'); setPage(1);
    toast('筛选条件已重置');
  };

  const detailFollows = detail ? FOLLOWS.filter((f) => f.customerId === detail.id) : [];
  const contactsOf = (c: C) => ctOv[c.id] ?? seedContacts(c);

  const addContact = () => {
    if (!detail) return;
    const n = ctN.trim(); const p = ctP.trim();
    if (!n || !p) { toast('请填写联系人姓名与电话', 'err'); return; }
    if (contactsOf(detail).some((x) => x.p === p)) { toast('该联系电话已存在，请勿重复添加', 'err'); return; }
    setCtOv((m) => ({ ...m, [detail.id]: [...contactsOf(detail), { n, r: ctR.trim() || '—', p }] }));
    setCtN(''); setCtR(''); setCtP('');
    toast(`联系人「${n}」已添加 · 已写入客户决策链`);
  };
  const doDelCt = () => {
    if (!delCt) return;
    const list = contactsOf(delCt.c);
    if (list.length <= 1) { toast('至少保留一位联系人（客户资产唯一建档要求）', 'err'); setDelCt(null); return; }
    const n = list[delCt.i].n;
    setCtOv((m) => ({ ...m, [delCt.c.id]: list.filter((_, k) => k !== delCt.i) }));
    setDelCt(null); toast(`联系人「${n}」已删除`);
  };

  return (
    <>
      <PageHead
        title="客户档案"
        actions={<>
          <Btn kind="primary" onClick={() => openEdit(null)}>＋ 新增客户</Btn>
          <Btn onClick={() => setQuickOpen(true)}><Ico n="receipt" size={16} /> 新增跟进（扫描留痕）</Btn>
          {sel.length > 0 && <Btn onClick={() => setBatchOpen(true)}>批量操作（{sel.length}）</Btn>}
          <Btn onClick={() => setTransferOpen(sel.length ? (CUSTOMERS.find((c) => c.id === sel[0]) || null) : null)}>归属转移</Btn>
          <Btn onClick={() => setImportOpen(true)}>Excel 导入</Btn>
          <Btn onClick={() => toast('客户列表已导出（CSV · 含 12 列 · 按当前筛选，手机号按角色脱敏）')}>导出</Btn>
        </>}
      />

      <Tabs
        value={tab}
        onChange={(k) => { setTab(k); setPage(1); }}
        items={[
          { key: 'all', label: '基础档案', cnt: CUSTOMERS.length },
          { key: 'mine', label: '我的客户', cnt: CUSTOMERS.filter((c) => c.owner === '蓝峰').length },
          { key: 'public', label: '公海客户', cnt: CUSTOMERS.filter((c) => c.status !== '成交').length },
        ]}
      />

      <div className={`nc-tiles nc-tiles-4`}>
        <div className="nc-tile is-clickable" onClick={() => { setGrade(''); setStatus(''); setTab('all'); toast('已切换为全部在册客户'); }} {...pressProps(() => { setGrade(''); setStatus(''); setTab('all'); toast('已切换为全部在册客户'); })}>
          <div className="nc-tile-label">客户总数</div>
          <div className="nc-tile-value">{stat.total}<small style={{ fontSize: 13, color: 'var(--ink-3)', marginLeft: 3 }}>家</small></div>
          <div className="nc-tile-sub">全部在册客户 · 点击查看全部</div>
        </div>
        <div className="nc-tile">
          <div className="nc-tile-label">年度累计成交 <span style={{ fontSize: 11 }}>（2026 签约）</span></div>
          <div className="nc-tile-value nc-v-blue">{money ? fmtWan(stat.deal) : '—'}</div>
          <div className="nc-tile-sub">本年度签约合同额合计</div>
        </div>
        <div className="nc-tile">
          <div className="nc-tile-label">应收账款余额</div>
          <div className="nc-tile-value nc-v-red">{money ? fmtWan(stat.recv) : '—'}</div>
          <div className="nc-tile-sub">应收未收合计 · 催收与登记收款直达</div>
        </div>
        <div className="nc-tile is-clickable" onClick={() => go('opp')} {...pressProps(() => go('opp'))}>
          <div className="nc-tile-label">活跃商机金额 <span className="nc-kpi-drill">穿透 ↗</span></div>
          <div className="nc-tile-value nc-v-orange">{money ? fmtWan(stat.active) : '—'}</div>
          <div className="nc-tile-sub">非终态商机合计 · 点击进入在谈管道 →</div>
        </div>
      </div>

      <Card flush>
        <ListToolbar
          rows={[
            {
              label: '等级', value: grade, onChange: (k) => { setGrade(k); setPage(1); },
              items: [
                { key: '', label: '全部等级', cnt: base.length },
                ...(['A', 'B', 'C', '潜'] as const).map((g) => ({ key: g, label: g === '潜' ? '潜在' : `${g} 级`, cnt: cntBy((c) => gOf(c) === g) })),
              ],
            },
            {
              label: '状态', value: status, onChange: (k) => { setStatus(k); setPage(1); },
              items: [
                { key: '', label: '全部状态', cnt: base.length },
                ...(['潜在', '意向', '成交'] as const).map((s) => ({ key: s, label: s, cnt: cntBy((c) => c.status === s) })),
              ],
            },
            {
              label: '跟进', value: recent, onChange: (k) => { setRecent(k); setPage(1); },
              items: [
                { key: 'all', label: '全部', cnt: base.length },
                { key: 'd14', label: '超 14 天未跟进', cnt: cntBy((c) => c.lastFollowDays > 14) },
                { key: 'd30', label: '超 30 天未跟进', cnt: cntBy((c) => c.lastFollowDays > 30) },
              ],
            },
          ]}
          right={<>
            <select className="nc-input" style={{ width: 130 }} value={industry} onChange={(e) => { setIndustry(e.target.value); setPage(1); }}>
              <option value="">全部行业</option>
              {[...new Set(CUSTOMERS.map((c) => c.industry))].map((i) => <option key={i}>{i}</option>)}
            </select>
            <select className="nc-input" style={{ width: 110 }} value={region} onChange={(e) => { setRegion(e.target.value); setPage(1); }}>
              <option value="">全部地区</option>{['昆明', '楚雄', '文山', '曲靖', '大理', '普洱', '广西'].map((r) => <option key={r}>{r}</option>)}
            </select>
            <select className="nc-input" style={{ width: 130 }} value={owner} onChange={(e) => { setOwner(e.target.value); setPage(1); }}>
              <option value="">全部归属人</option>{['蓝峰', '李思敏', '王志海', '赵薇', '刘宇', '李慧敏'].map((s) => <option key={s}>{s}</option>)}
            </select>
            <select className="nc-input" style={{ width: 140 }} value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }}>
              <option value="">全部来源</option>{[...new Set(CUSTOMERS.map((c) => c.source))].map((s) => <option key={s}>{s}</option>)}
            </select>
            <input className="nc-input nc-lt-search" value={kw} placeholder="搜索客户名称 / 联系人 / 编号"
              onChange={(e) => { setKw(e.target.value); setPage(1); }} />
            <Btn onClick={reset}>重置</Btn>
          </>}
        />
      </Card>

      <Card flush>
        <div className="nc-listhint">
          <span>客户列表<Tip text="默认按修改时间倒序；拜访跟进须现场拍照并叠加时间水印 + GPS 定位；空数据显示「 / 」。" /></span>
          <span className="nc-listhint-sp" />
          <span>等级规则<Tip text={GRADE_RULE.replace('等级规则：', '')} /></span>
        </div>
        <DataTable<C>
            selectable selected={sel}
            onSelectAll={setSel} onSelectRow={(id) => setSel((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])}
            minWidth={1720}
            cols={[
              { key: '__idx', title: '序号', width: 56, render: (c) => <span className="num">{rows.indexOf(c) + 1}</span> },
              { key: 'id', title: '客户编号', width: 150, render: (c) => <IdCell onClick={() => setDetail(c)} title="查看客户详情">{c.id}</IdCell> },
              {
                key: 'name', title: '客户名称', width: 250, render: (c) => (
                  <div>
                    <div className="nc-td-main" style={{ color: 'var(--c-primary)', cursor: 'pointer' }}>{c.name}</div>
                    <div className="nc-td-sub">{c.industry} · 建档 {c.since}</div>
                  </div>
                ),
              },
              { key: 'contact', title: '联系人', width: 100, render: (c) => c.contact },
              {
                key: 'phone', title: '联系电话', width: 130, render: (c) => (
                  money || ['蓝峰', '李思敏'].includes(c.owner)
                    ? <span className="num" style={{ color: 'var(--c-primary)', cursor: 'pointer' }} title="本人 / 本团队可见可拨号">{c.fullPhone}</span>
                    : <span className="num" style={{ color: 'var(--ink-3)' }} title="跨团队脱敏，不可拨号">{c.phone}</span>
                ),
              },
              { key: 'region', title: '区域', width: 82 },
              {
                key: 'grade', title: '分级', width: 110, render: (c) => (
                  <span className="nc-cursor-help" title={G_TXT[gOf(c)]}>
                    <Tag tone={G_TONE[gOf(c)]} pill>{gOf(c) === '潜' ? '潜在' : `${c.grade} 级`}</Tag>
                  </span>
                ),
              },
              {
                key: 'pipe', title: '在谈商机', width: 130, render: (c) => {
                  const n = pipeOf(c).length;
                  return n
                    ? <span><b className="num">{n}</b> 个 <span className="nc-cell-sub">{money ? fmtWan(pipeAmtOf(c)) : '—'}</span></span>
                    : <span className="nc-muted">—</span>;
                },
              },
              { key: 'deal', title: '累计成交', width: 120, align: 'right', render: (c) => <b className="num">{money ? (c.dealAmt ? fmtWan(c.dealAmt) : '尚无成交') : '—'}</b> },
              {
                key: 'recv', title: '合同回款', width: 140, render: (c) => (c.dealAmt
                  ? <div>
                    <div className="nc-cell-sub">应收 {money ? fmtWan(c.recv) : '—'} · 回款率 <b className="num">{recvRate(c)}%</b></div>
                    <Progress value={recvRate(c)} tone={recvRate(c) >= 80 ? 'green' : recvRate(c) >= 50 ? 'orange' : 'red'} />
                  </div>
                  : <span className="nc-muted">—</span>),
              },
              { key: 'source', title: '来源', width: 130 },
              { key: 'owner', title: '归属人', width: 88 },
              { key: 'status', title: '状态', width: 78, render: (c) => <Tag tone={ST_TONE[c.status]}>{c.status}</Tag> },
              {
                key: 'lastFollow', title: '最近跟进', width: 110, render: (c) => {
                  const tone = c.lastFollowDays <= 14 ? undefined : c.lastFollowDays <= 30 ? 'var(--ink-3)' : 'var(--c-danger)';
                  return <span className="num" style={{ color: tone }}>{c.lastFollow}{c.lastFollowDays > 30 ? <> <Ico n="warning" size={12} style={{ color: 'var(--c-warning-mid)' }} /></> : null}</span>;
                },
              },
              {
                key: 'ops', title: '操作', width: 200, render: (c) => (
                  <span className="nc-ops" onClick={(e) => e.stopPropagation()}>
                    <Op onClick={() => setDetail(c)}>详情</Op><OpSep />
                    <Op gold onClick={() => { setFollowOpen(c); setWay('上门拜访'); setPhoto(0); setGps(''); setFollowText(''); }}>新增跟进</Op><OpSep />
                    <Op onClick={() => setConvertOpen(c)}>转商机</Op><OpSep />
                    <Op onClick={() => openEdit(c)}>编辑</Op>
                  </span>
                ),
              },
            ]}
            rows={paged}
            rowKey={(c) => c.id}
            onRowClick={(c) => setDetail(c)}
            foot={<TableFoot total={CUSTOMERS.length} filtered={rows.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />}
          />
      </Card>

      {/* ============ 详情抽屉 ============ */}
      <Drawer
        open={!!detail} width={880}
        title={detail?.name || ''}
        sub={detail && <span className="num">{detail.id} · {detail.industry} · {detail.region} · 归属 {detail.owner} · 建档 {detail.since}</span>}
        onClose={() => setDetail(null)}
        foot={<>
          <Btn onClick={() => { setTransferOpen(detail); setDetail(null); }}>归属转移</Btn>
          <Btn onClick={() => { setConvertOpen(detail); setDetail(null); }}>转商机</Btn>
          <Btn onClick={() => { openEdit(detail); setDetail(null); }}>编辑档案</Btn>
          <Btn kind="primary" onClick={() => { setFollowOpen(detail); setDetail(null); setWay('上门拜访'); setPhoto(0); setGps(''); setFollowText(''); }}>＋ 新增跟进</Btn>
        </>}
      >
        {detail && (
          <>
            <Banner tone="gold">
              客户资产唯一建档 · 客户等级按「累计成交」自动归档（当前 <b>{detail.grade} 级</b>，{GRADE_RULE.replace('等级规则：', '')}）
            </Banner>

            <div className="nc-tiles nc-tiles-3" style={{ margin: '14px 0' }}>
              <div className="nc-tile">
                <div className="nc-tile-label">累计成交</div>
                <div className="nc-tile-value nc-v-blue">{money ? fmtWan(detail.dealAmt) : '—'}</div>
                <div className="nc-tile-sub">{detail.dealAmt ? `${contractsOf(detail).length} 单合同 · 建档 ${detail.since}` : '尚无成交'}</div>
              </div>
              <div className="nc-tile">
                <div className="nc-tile-label">应收余额</div>
                <div className={`nc-tile-value ${detail.recv ? 'nc-v-red' : ''}`}>{money ? (detail.recv ? fmtWan(detail.recv) : '无') : '—'}</div>
                <div className="nc-tile-sub">{detail.recv ? `回款率 ${recvRate(detail)}% · 催收与登记收款直达` : '无应收'}</div>
              </div>
              <div className="nc-tile is-clickable" onClick={() => { setDetail(null); go('opp'); }} {...pressProps(() => { setDetail(null); go('opp'); })}>
                <div className="nc-tile-label">在谈商机 <span className="nc-kpi-drill">穿透 ↗</span></div>
                <div className="nc-tile-value">{pipeOf(detail).length}</div>
                <div className="nc-tile-sub">{money ? `在谈 ${fmtWan(pipeAmtOf(detail))} · 点击进入管道` : '暂无在谈商机'}</div>
              </div>
            </div>

            <div className="nc-sec-title" style={{ marginBottom: 12 }}>客户档案</div>
            <KvGrid cols={2} rows={[
              { k: '客户状态', v: <Tag tone={ST_TONE[detail.status]}>{detail.status}</Tag> },
              { k: '客户分级', v: <><Tag tone={G_TONE[detail.grade]} pill>{detail.grade} 级</Tag> <span className="nc-hint">（可改 · 留痕）</span></> },
              { k: '联系人', v: detail.contact },
              { k: '联系电话', v: <span className="num">{money || ['蓝峰', '李思敏'].includes(detail.owner) ? `${detail.fullPhone}（完整可拨号）` : `${detail.phone}（跨团队脱敏）`}</span> },
              { k: '区域', v: detail.region },
              { k: '行业标签', v: detail.industry },
              { k: '客户来源', v: detail.source },
              { k: '归属人', v: detail.owner },
              { k: '建档时间', v: detail.since },
              { k: '最近跟进', v: <span className="num">{detail.lastFollow}（{detail.lastFollowDays} 天前）</span> },
            ]} />
            <div style={{ marginTop: 12 }}><b style={{ fontSize: 13 }}>备注（决策链 / 合作偏好）</b>
              <div className="nc-hint" style={{ marginTop: 4 }}>{detail.note || '—'}</div>
            </div>

            {/* ---------- 联系人（决策链多人 · 行内增删） ---------- */}
            <div className="nc-sec-title" style={{ margin: '18px 0 10px' }}>
              联系人（{contactsOf(detail).length}）
              <span className="nc-hint" style={{ fontWeight: 400, marginLeft: 8 }}>决策链多人留痕 · 至少保留一位；跨团队手机号脱敏</span>
            </div>
            {contactsOf(detail).map((ct, i) => (
              <div className="nc-req-row" key={`${ct.n}-${ct.p}`}>
                <span className="nc-avatar is-sm">{ct.n[0]}</span>
                <span className="nc-rr-main">
                  {ct.n} · {ct.r}
                  <span className="nc-cell-sub num" style={{ marginTop: 0 }}>{ct.p}</span>
                </span>
                <span className="nc-rops">
                  {contactsOf(detail).length > 1 && <Op danger onClick={() => setDelCt({ c: detail, i })}>删除</Op>}
                </span>
              </div>
            ))}
            <div className="nc-req-row is-add">
              <input className="nc-input" style={{ width: 110, height: 28, fontSize: 12 }} value={ctN} onChange={(e) => setCtN(e.target.value)} placeholder="姓名" />
              <input className="nc-input" style={{ width: 130, height: 28, fontSize: 12 }} value={ctR} onChange={(e) => setCtR(e.target.value)} placeholder="职务" />
              <input className="nc-input num" style={{ width: 150, height: 28, fontSize: 12 }} value={ctP} onChange={(e) => setCtP(e.target.value)} placeholder="电话" />
              <Btn size="sm" onClick={addContact}>＋ 添加联系人</Btn>
            </div>

            {/* ---------- 在谈商机 ---------- */}
            <div className="nc-sec-title" style={{ margin: '18px 0 10px' }}>在谈商机（{pipeOf(detail).length}）</div>
            {pipeOf(detail).length ? pipeOf(detail).map((p) => (
              <div className="nc-req-row" key={p.id}>
                <span className="nc-rr-main">
                  <EntityLink target="opp" id={p.id} go={go} strong>{p.id}</EntityLink> {p.name}
                  <span className="nc-cell-sub">{p.biz} · {p.type} · 预计签约 {p.signDate || '待定'} · 归属 {p.owner}</span>
                </span>
                <Tag tone={p.stage === '推进中' ? 'gray' : p.stage === '商务谈判' ? 'blue' : 'orange'}>{p.stage}</Tag>
                <b className="num">{money ? fmtWan(p.amt) : '—'}</b>
                <span className="nc-rops"><Op onClick={() => { setDetail(null); setFocus('opp', p.id); go('opp'); }}>查看 →</Op></span>
              </div>
            )) : <div className="nc-empty-mini">/ 暂无在谈商机 · 可点击「转商机」为该客户立项</div>}

            {/* ---------- 报价单 ---------- */}
            <div className="nc-sec-title" style={{ margin: '18px 0 10px' }}>报价单（{quotesOf(detail).length}）</div>
            {quotesOf(detail).length ? quotesOf(detail).map((q) => (
              <div className="nc-req-row" key={q.id}>
                <span className="nc-rr-main">
                  <EntityLink target="quote-detail" id={q.id} go={go} strong>{q.id} {q.ver}</EntityLink> {q.name}
                  <span className="nc-cell-sub">{q.date} 创建 · {q.taxRate}% {q.taxMode} · 毛利 {q.markup}% · {q.items} 项 · {q.owner}</span>
                </span>
                <Tag tone={q.status === '已转化' ? 'green' : q.status === '待审批' ? 'orange' : q.status === '已审批' ? 'blue' : q.status === '作废' ? 'red' : 'gray'}>{q.status}</Tag>
                <b className="num">{money ? (q.total ? fmtWan(q.total) : '未报价') : '—'}</b>
                <span className="nc-rops"><Op onClick={() => { setDetail(null); setFocus('quote-detail', q.id); go('quote-detail'); }}>查看 →</Op></span>
              </div>
            )) : <div className="nc-empty-mini">/ 暂无报价记录</div>}

            {/* ---------- 合同与回款 ---------- */}
            <div className="nc-sec-title" style={{ margin: '18px 0 10px' }}>合同与回款（{contractsOf(detail).length}）</div>
            {contractsOf(detail).length ? contractsOf(detail).map((x) => {
              const p = Math.min(100, Math.round(x.recv / (x.amt || x.execAmt) * 100));
              const bal = (x.amt || x.execAmt) - x.recv;
              return (
                <div className="nc-req-row" key={x.id}>
                  <span className="nc-rr-main" style={{ flex: 1 }}>
                    <EntityLink target="contract" id={x.id} go={go} strong>{x.id}</EntityLink> · {x.name}
                    <span className="nc-cell-sub">签约 {x.sign} · 总额 {money ? fmtWan(x.amt || x.execAmt) : '—'} · 已收 {money ? fmtWan(x.recv) : '—'}（{p}%）{x.project ? <> · 项目 <EntityLink target="project-center" id={x.project} go={go} title="下钻到项目经营中心">{x.project}</EntityLink></> : null}</span>
                  </span>
                  <div style={{ flex: 1, maxWidth: 160 }}><Progress value={p} tone={p >= 100 ? 'green' : undefined} /></div>
                  {bal > 0
                    ? <span className="num" style={{ fontWeight: 600, color: 'var(--c-danger)' }}>应收 {money ? fmtWan(bal) : '—'}</span>
                    : <Tag tone="green">已结清</Tag>}
                  <Tag tone={x.status === '履约中' ? 'blue' : 'gray'}>{x.status}</Tag>
                  <span className="nc-rops"><Op onClick={() => { setDetail(null); setFocus('contract', x.id); go('contract'); }}>合同 →</Op></span>
                </div>
              );
            }) : <div className="nc-empty-mini">/ 暂无合同 · 商机进入「商务谈判」后可转化为合同</div>}

            {/* ---------- 关联项目（合同之外的项目口径，含未签合同的应急 / 报价转化项目） ---------- */}
            <div className="nc-sec-title" style={{ margin: '18px 0 10px' }}>关联项目（{projectsOf(detail).length}）</div>
            {projectsOf(detail).length ? projectsOf(detail).map((p) => (
              <div className="nc-req-row" key={p.id}>
                <span className="nc-rr-main">
                  <EntityLink target="project-center" id={p.id} go={go} strong>{p.id}</EntityLink> {p.name}
                  <span className="nc-cell-sub">{p.type} · {p.source} · 项目经理 {p.pm} · 签约 {money ? fmtWan(p.contractAmt) : '—'}</span>
                </span>
                <Tag tone={p.status === '实施中' ? 'blue' : p.status === '已完工' ? 'green' : 'gray'}>{p.status}</Tag>
                <span className="nc-rops"><Op onClick={() => { setDetail(null); setFocus('project-center', p.id); go('project-center'); }}>项目 →</Op></span>
              </div>
            )) : <div className="nc-empty-mini">/ 暂无关联项目</div>}

            <div className="nc-sec-title" style={{ margin: '18px 0 10px' }}>
              跟进时间线
              <span className="nc-hint" style={{ fontWeight: 400, marginLeft: 8 }}>拜访须现场拍照 + 时间水印 + GPS；提交后不可改，错误走「更正跟进」</span>
            </div>
            {detailFollows.length ? (
              <Timeline items={detailFollows.map((f) => ({
                date: f.date,
                tone: f.way === '上门拜访' ? 'gold' : f.way === '电话' ? 'ok' : 'gray',
                text: <><Tag tone="blue">{f.way}</Tag> {f.text} <span className="nc-hint">· {f.by}</span>{f.gps && <div className="nc-hint"><Ico n="pin" size={16} /> {f.gps}</div>}</>,
              }))} />
            ) : (
              <div className="nc-empty-mini">/ 暂无跟进记录 · 点击下方「＋ 新增跟进」登记首次接触</div>
            )}
          </>
        )}
      </Drawer>

      {/* ============ 删除联系人确认 ============ */}
      <Modal open={!!delCt} width={420} title="删除联系人" onClose={() => setDelCt(null)}
        foot={<>
          <Btn onClick={() => setDelCt(null)}>取消</Btn>
          <Btn kind="primary" danger onClick={doDelCt}>删除</Btn>
        </>}>
        <div style={{ fontSize: 13, lineHeight: 1.8 }}>
          确认删除联系人 <b>{delCt ? contactsOf(delCt.c)[delCt.i]?.n : ''}</b>？
          <div className="nc-hint" style={{ marginTop: 8 }}>删除后该联系人的跟进拨号记录保留在时间线中，仅从客户决策链移除。</div>
        </div>
      </Modal>

      {/* ============ 新建 / 编辑弹窗（560px） ============ */}
      <Modal open={editOpen} width={640} title={editRow ? `编辑客户档案 · ${editRow.id}` : '新增客户'} onClose={() => setEditOpen(false)}
        foot={<>
          <Btn onClick={() => setEditOpen(false)}>取消</Btn>
          <Btn kind="primary" onClick={save}>保存</Btn>
        </>}>
        <div className="nc-form-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
          <Field label="客户名称" req span={2} err={errs.name} warn={!!dupTip}
            note={dupTip || '唯一性 + 相似度 ≥80% 检测；重复可合并（撞单弹层：查看 / 合并 / 仍要新建）'}>
            <input className="nc-input" value={fName} onChange={(e) => onNameChange(e.target.value)} placeholder="如 昆明万达广场商业管理有限公司" />
          </Field>
          <Field label="联系人姓名" req err={errs.contact} note="≤20 字，可多条（详情内行内增删）">
            <input className="nc-input" value={fContact} onChange={(e) => setFContact(e.target.value)} placeholder="如 王志豪" />
          </Field>
          <Field label="联系电话" req err={errs.phone} note="手机号或座机 · 重复触发撞单">
            <input className="nc-input" value={fPhone} onChange={(e) => setFPhone(e.target.value)} placeholder="如 13888001101" />
          </Field>
          <Field label="区域" req err={errs.region} note="默认：昆明">
            <select className="nc-select" value={fRegion} onChange={(e) => setFRegion(e.target.value)}>
              {['昆明', '曲靖', '楚雄', '丽江', '大理', '文山', '普洱', '广西', '其他'].map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="客户分级" req note="默认 C；可改（留痕）">
            <select className="nc-select" value={fGrade} onChange={(e) => setFGrade(e.target.value)}>
              {[['A', 'A 级 · 战略客户'], ['B', 'B 级 · 重点客户'], ['C', 'C 级 · 常规客户']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>
          <Field label="客户来源" req note="默认：自主开发">
            <select className="nc-select" value={fSource} onChange={(e) => setFSource(e.target.value)}>
              {['自主开发', '老客户转介绍', '政府平台招标', '招投标平台', '属地排查', '同行引荐', '行业展会'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="客户状态" req note="新建仅可选潜在 / 意向">
            <select className="nc-select" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
              <option value="潜在">潜在</option><option value="意向">意向</option>
            </select>
          </Field>
          <Field label="行业标签" span={2} note="商业综合体 / 医疗 / 电力 / 文旅 / 地产 / 园区政府平台 / 其他（用于业绩与合同检索）">
            <select className="nc-select" value={fIndustry} onChange={(e) => setFIndustry(e.target.value)}>
              {['商业综合体', '医疗', '电力/制造', '文旅', '地产', '园区/政府平台', '教育', '交通枢纽', '其他'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="备注" span={2} note="决策链 / 合作偏好">
            <textarea className="nc-textarea" value={fNote} onChange={(e) => setFNote(e.target.value)} placeholder="如 决策链：区域总 → 工程部 → 招采" />
          </Field>
        </div>
        <Banner tone="info">
          保存后可在详情中添加联系人；客户名称重复将提示（档案唯一）。手机号按角色脱敏：跨团队显示 <Code>138****1234</Code>，本人 / 本团队完整可拨号。
        </Banner>
      </Modal>

      {/* ============ 新增跟进（扫描留痕） ============ */}
      <Modal open={!!followOpen} width={640} title={`新增跟进 · ${followOpen?.name || ''}`} onClose={() => setFollowOpen(null)}
        foot={<>
          <Btn onClick={() => setFollowOpen(null)}>取消</Btn>
          <Btn kind="primary" onClick={() => {
            if (way === '上门拜访' && photo === 0) { toast('拜访跟进须上传现场照片（系统自动叠加时间水印 + GPS 定位）', 'err'); return; }
            if (!followText) { toast('请填写跟进内容', 'err'); return; }
            setFollowOpen(null);
            toast('跟进已登记（提交后不可改，错误走「更正跟进」）');
          }}>提交跟进</Btn>
        </>}>
        <div className="nc-form-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
          <Field label="跟进方式" req>
            <select className="nc-select" value={way} onChange={(e) => setWay(e.target.value)}>
              {['上门拜访', '电话', '会议', '微信/邮件'].map((w) => <option key={w}>{w}</option>)}
            </select>
          </Field>
          <Field label="跟进日期" req note={`默认 ${TODAY}`}>
            <input className="nc-input" type="date" defaultValue={TODAY} />
          </Field>
          <Field label="跟进内容" req span={2} note="记录客户诉求、决策链进展、下一步动作">
            <textarea className="nc-textarea" value={followText} onChange={(e) => setFollowText(e.target.value)} placeholder="如 现场勘察消防主机房与管网走向" />
          </Field>
        </div>
        {way === '上门拜访' && (
          <>
            <Banner tone="warn">
              <Ico n="ban" size={14} style={{ color: 'var(--c-danger)' }} /> <b>硬拦截</b>：跟进方式 = 上门拜访时，必须上传现场照片（系统自动叠加时间水印 + GPS 定位）；无照片不可提交。
            </Banner>
            <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
              <Btn onClick={() => { setPhoto((p) => p + 1); toast(`已模拟拍照上传（${photo + 1} 张 · 水印 + GPS）`); }}><Ico n="camera" size={16} /> 现场拍照 / 上传</Btn>
              <span className="nc-hint">已上传 <b className="num">{photo}</b> 张</span>
              <Btn size="sm" onClick={() => setGps('昆明市西山区前兴路 688 号')}><Ico n="pin" size={16} /> 获取定位</Btn>
              {gps && <Tag tone="green">已定位 · {gps}</Tag>}
            </div>
          </>
        )}
        {way !== '上门拜访' && <Banner tone="info">非拜访类跟进无需照片；提交后进入客户跟进时间线并刷新「最近跟进」。</Banner>}
      </Modal>

      {/* ============ 归属转移 ============ */}
      <Modal open={!!transferOpen || (sel.length > 0 && batchOpen === false && false)} width={520}
        title={`归属转移 · ${transferOpen?.name || '未选择客户'}`} onClose={() => setTransferOpen(null)}
        foot={<>
          <Btn onClick={() => setTransferOpen(null)}>取消</Btn>
          <Btn kind="primary" onClick={() => {
            if (!transferOpen) { toast('请先在列表中选择要转移的客户', 'err'); return; }
            setTransferOpen(null); toast('归属已转移（客户 + 名下商机同步转移；合同 / 项目不动）');
          }}>确认转移</Btn>
        </>}>
        <Banner tone="gold">
          <Ico n="receipt" size={14} /> <b>留痕操作</b>：归属转移会同步转移该客户名下的<b>商机</b>；已签<b>合同</b>与在施<b>项目</b>不随转移变动（保留原归属人业绩）。
        </Banner>
        <div style={{ marginTop: 12 }}>
          <Field label="转入归属人" req note="仅可选在职销售 / 市场负责人">
            <select className="nc-select">{['蓝峰', '李思敏', '王志海', '赵薇', '刘宇', '李慧敏'].map((o) => <option key={o}>{o}</option>)}</select>
          </Field>
          <Field label="转移原因" req span={4}>
            <textarea className="nc-textarea" placeholder="如 原归属人调岗，客户由区域负责人接管" />
          </Field>
        </div>
      </Modal>

      {/* ============ 转商机 ============ */}
      <Modal open={!!convertOpen} width={560} title={`商机转换 · ${convertOpen?.name || ''}`} onClose={() => setConvertOpen(null)}
        foot={<>
          <Btn onClick={() => setConvertOpen(null)}>取消</Btn>
          <Btn kind="primary" onClick={() => { setConvertOpen(null); toast('已创建商机并预填客户，编辑后保存（编号自动生成 SJ 开头）'); go('opp'); }}>创建商机</Btn>
        </>}>
        <Banner tone="info">转商机将预填客户信息，自动生成 <Code>SJ</Code> 编号，初始阶段为「推进中」。</Banner>
        <div className="nc-form-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)', marginTop: 12 }}>
          <Field label="商机名称" req span={2}><input className="nc-input" defaultValue={convertOpen ? `${convertOpen.name}消防改造工程` : ''} /></Field>
          <Field label="业务类型" req><select className="nc-select">{['新建', '改造', '维护保养', '检测'].map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="业务域" req><select className="nc-select"><option>消防工程 GC</option><option>维护保养 WB</option><option>检测 JC</option><option>软件研发 RJ</option></select></Field>
          <Field label="预计金额" req note="含税"><input className="nc-input" placeholder="如 3200000" /></Field>
          <Field label="预计签约日" req note="≤30 天标橙 · 已过标红"><input className="nc-input" type="date" /></Field>
        </div>
      </Modal>

      {/* ============ 批量操作 ============ */}
      <Modal open={batchOpen} width={480} title={`批量操作 · 已选 ${sel.length} 家客户`} onClose={() => setBatchOpen(false)}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            ['批量设置归属人', '将所选客户的归属人统一调整（留痕）'],
            ['批量调整分级', '按累计成交重算或手工指定 A / B / C'],
            ['批量打标签', '追加行业标签，用于业绩与合同检索'],
            ['批量导出', '导出所选客户为 CSV（手机号按角色脱敏）'],
          ].map(([t, d]) => (
            <button key={t} className="nc-todo is-blue" onClick={() => { setBatchOpen(false); toast(`${t}（演示态）· 已处理 ${sel.length} 条`); }}>
              <span className="nc-todo-main"><span className="nc-todo-t">{t}</span><span className="nc-todo-s">{d}</span></span>
            </button>
          ))}
        </div>
      </Modal>

      {/* ============ Excel 导入 ============ */}
      <Modal open={importOpen} width={520} title="Excel 导入客户档案" onClose={() => setImportOpen(false)}
        foot={<>
          <Btn onClick={() => { setImportOpen(false); toast('已下载导入模板（含 9 列校验规则）'); }}>下载模板</Btn>
          <Btn kind="primary" onClick={() => { setImportOpen(false); toast('导入完成 · 成功 0 条 / 跳过重复 0 条（演示态）'); }}>开始导入</Btn>
        </>}>
        <Banner tone="gold">
          导入前校验：客户名称唯一性 + 相似度 ≥80% 提示；电话重复触发撞单；区域 / 分级 / 来源须在字典内，否则整行跳过并输出错误清单。
        </Banner>
        <div className="nc-empty-mini" style={{ marginTop: 12 }}><Ico n="file" size={16} /> 拖拽 .xlsx 到此处，或点击「下载模板」按格式填写</div>
      </Modal>

      {/* ============ 快捷登记（现场留痕） ============ */}
      <Modal open={quickOpen} width={560} title="快捷登记 / 新增跟进（扫描留痕）" onClose={() => setQuickOpen(false)}
        foot={<>
          <Btn onClick={() => setQuickOpen(false)}>取消</Btn>
          <Btn kind="primary" onClick={() => { setQuickOpen(false); toast('快捷登记已提交 · 已登记至客户跟进时间线（水印 + GPS）'); }}>提交</Btn>
        </>}>
        <Banner tone="info">
          快捷登记用于一线在客户现场快速留痕：选择客户 → 拍现场照片（自动叠加时间水印 + GPS）→ 一句话结论。<b>提交后不可改</b>，错误走「更正跟进」。
        </Banner>
        <div className="nc-form-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)', marginTop: 12 }}>
          <Field label="客户" req span={2}>
            <select className="nc-select">{CUSTOMERS.map((c) => <option key={c.id}>{c.name}（{c.id}）</option>)}</select>
          </Field>
          <Field label="登记方式" req><select className="nc-select"><option>现场拍照</option><option>电话</option><option>微信/邮件</option></select></Field>
          <Field label="跟进日期" req><input className="nc-input" type="date" defaultValue={TODAY} /></Field>
        </div>
      </Modal>
    </>
  );
}
