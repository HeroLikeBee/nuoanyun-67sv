// 商机管理（列表 + 看板双视图）
// 状态机（4 档收敛口径 · 2026-09-23 拍板）：意向 10% → 方案报价 50%（预计金额开始必填）→ 投标 70%（按单启用）→ 签约 100% → 终态
// 阶段模板可配置：阶段名与权重读 store（系统设置 · 业务字典 · 商机阶段），增删 / 排序 / 改权重即时全站生效
// 阶段权重（默认值）：意向 10% / 方案报价 50% / 投标 70%（按单启用，须有投标单）/ 签约 100%；加权金额 = 金额 × 权重
// gate 分界线（默认「方案报价」）：进入起预计金额必填。转化不受阶段限制 —— 由赢单动作触发，不做阶段前置校验
// 状态（与阶段正交）：跟进中 / 赢单 / 输单 —— 终态由 status 承载，输单必填原因（价格 / 关系 / 资质 / 其他）
// 投标只作商机进度标记：关联投标数由 BIDS[].opp 派生，投标单据本身归 BidPage 管理，不重复建单
// 复刻「商机管理.html」补齐：勘察记录（含工程量清单 · 生成报价后锁定只读）· 关联报价 / 投标 / 阶段历史
// · 赢单 / 输单 · 重开（管理员）· 阶段可跳选可回退
// 转化出口（2026-09-23 统一口径）：三条**互相独立**的路径，各落各的单，互不捆绑 ——
//   ① 转报价 —— 工程类单子先出报价单，审批通过后由报价转合同（规格 §3.3 QUO-06）；
//   ② 转合同 —— 维保 / 检测 / 金额明确的单子，不经过报价与投标，直接落合同草稿（规格 §2.2 SJ-01③「或转合同草稿」）；
//   ③ 转项目 —— 例外路径（应急抢修）：无合同先施工，落 oppId + 无合同标记 + 30 日补签期限，并进驾驶舱风险榜。
// 「一个商机仅可转化一次」的旧约束已删 —— 规格 §2.2④ 写的是「关联报价 / 投标 / 合同列表」，
// 分标段分别投标、分批成交是消防工程常态，故允许多次转化，已产出数量由下游外键派生。
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Banner, Btn, Card, ChainBar, DataTable, Drawer, EntityLink, Field, KvGrid, ListToolbar, Modal,
  Op, OpMore, OpNone, OpSep, PageHead, TableFoot, Tag, Tabs, Timeline, Tile, Tip, useToast, Code, IdCell, pressProps,
  CustomerPicker, ItemPicker, type CustOpt,} from '../components/ui';
import {
  OPP_STATUS, LOSE_REASONS, isBidClosed, isOppClosed, fmtWan, canSeeMoney, TODAY, oppStageTone,
  CUSTOMERS, CUST_GRADES, CUST_GRADE_LABEL, CUST_INDUSTRIES, CUST_REGIONS, CUST_SOURCES, CUST_STATUS_NEW,
  ITEM_KINDS, getOppFollowDays, itemCostBase, markupOf,
  type QuoteLine, type Svy, type SvyQtyRow,
} from '../components/data';
import {
  consumeFocus, setFocus, subscribeStore, getOpps, getOppLogs, getOppClose,
  getOppStages, getOppStageIdx, getOppGateIdx, getOppStageWeight, getOppBids,
  moveOpp, closeOpp, reopenOpp, setPendingBid,
  getQuotes, getContracts, getProjects, getActiveItems,
  setPendingContract, setPendingProject, setPendingOppQuote,
  addQuote, nextQuoteNo, getSvys, addSvy, patchSvy,
} from '../components/store';
import { Ico } from '../components/icons';
import { ExportButton, ExportDialog, useExport, getUserName, type ExportField } from '../components/export';
import { parseDelimited, readTableFile } from '../components/xlsx';

const STATUS_TONE: Record<string, 'blue' | 'green' | 'gray'> = { 跟进中: 'blue', 赢单: 'green', 输单: 'gray' };
const BIZ_NAME: Record<string, string> = { GC: '消防工程', WB: '维护保养', JC: '检测', RJ: '软件研发', QT: '其他' };
const SYS_TYPES = ['火灾自动报警系统', '自动喷淋灭火系统', '防排烟系统', '应急照明与疏散', '气体灭火系统', '消防水系统', '全系统'];
/** 商机来源（FR-OPP-003） */
const OPP_SRC = ['转介绍', '招投标', '自拓', '老客户复购', '其他'];
const SORT_OPTS = ['最近推进倒序', '金额从高到低', '金额从低到高', '预计签约日最近'];
type O = ReturnType<typeof getOpps>[number];

/* 商机已产出的下游单据：全部由外键派生，不再用本地「已转化」标记。
   规格 §2.2④ 写的是「关联报价 / 投标 / 合同列表」—— 一个商机可关联多份；
   分标段分别投标、分批成交是消防工程常态，故不设「仅可转化一次」约束。 */
const outputsOf = (id: string) => ({
  quotes: getQuotes().filter((q) => q.opp === id),
  bids: getOppBids(id),
  contracts: getContracts().filter((c) => c.oppId === id),
  projects: getProjects().filter((p) => p.oppId === id),
});
/** 是否已成交：存在下游合同或项目（只有报价 / 投标只代表在谈，不算成交） */
const isWonDeal = (id: string) => {
  const o = outputsOf(id);
  return o.contracts.length > 0 || o.projects.length > 0;
};
/** 已产出摘要文案 */
const outText = (id: string) => {
  const o = outputsOf(id);
  return `报价 ${o.quotes.length} · 投标 ${o.bids.length} · 合同 ${o.contracts.length} · 项目 ${o.projects.length}`;
};

/* ============================ 勘察记录 ============================ */
/** 工程量行：名称 / 单位取自物料主数据（选料 / 模板库 / OCR 带出），数量现场填，备注默认带参考单价 */
type QtyRow = SvyQtyRow;
/** 物料主数据行类型（模板库 / OCR 候选集元素） */
type ItemRow = ReturnType<typeof getActiveItems>[number];
/** 模板库 / OCR 候选集的分页步长（弹窗内「获取更多」） */
const TPL_PAGE = 10;

/** OCR 识别录入示例（mock）：现场手写 / 打印的工程量清单照片 → 结构化行。
    真实产品接 OCR 服务；此处按物料主数据编码给出识别结果，保证「内容与物料主数据一致」。
    conf = 识别置信度，低于 90% 的行在弹窗内提示人工复核。 */
const OCR_DEMO: { code: string; q: string; conf: number }[] = [
  { code: 'EQ000002', q: '860', conf: 0.98 },
  { code: 'CL000145', q: '1240', conf: 0.96 },
  { code: 'EQ000001', q: '4', conf: 0.93 },
  { code: 'CL000226', q: '6', conf: 0.91 },
  { code: 'CL000201', q: '180', conf: 0.88 },
  { code: 'SV000004', q: '2', conf: 0.72 },
];

/* ============================ 工程量清单：Excel 粘贴 / 批量填列 ============================ */
/** 粘贴核对行：解析出的原始行 + 物料匹配结果 */
type PasteRow = { name: string; unit: string; qty: string; note: string; item?: ItemRow };
/** 批量填列可作用的列（名称列只能选料，故不开放） */
const FILL_COLS = [
  { key: 'u' as const, label: '单位' },
  { key: 'q' as const, label: '数量' },
  { key: 'r' as const, label: '备注' },
];

/** 名称归一：去空格 / 全角括号转半角 / 小写 —— 把粘贴进来的名称对到物料主数据 */
const normName = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '').replace(/（/g, '(').replace(/）/g, ')');

/** 名称 / 编码 → 物料主数据：名称全等 → 编码全等 → 去掉括号后缀后全等 */
function matchItemOf(list: ItemRow[], key: string): ItemRow | undefined {
  const k = normName(key);
  if (!k) return undefined;
  return list.find((i) => normName(i.name) === k)
    ?? list.find((i) => i.code.toLowerCase() === k)
    ?? list.find((i) => normName(i.name).replace(/\(.*?\)/g, '') === k.replace(/\(.*?\)/g, ''));
}

/** 粘贴内容带表头（含「名称」且含「数量 / 单位」）时剥掉首行 */
function stripHeader(grid: string[][]): string[][] {
  const h = grid[0] ?? [];
  return grid.length > 1 && h.some((c) => /名称|物料/.test(c)) && h.some((c) => /数量|单位/.test(c))
    ? grid.slice(1) : grid;
}

/** 只改某一列（避免计算属性键的类型收窄问题） */
const withCol = (r: QtyRow, col: 'u' | 'q' | 'r', v: string): QtyRow =>
  ({ ...r, u: col === 'u' ? v : r.u, q: col === 'q' ? v : r.q, r: col === 'r' ? v : r.r });

/** 关联报价：按商机派生的示意数据（多版本口径，与列表「报价 N 版」同源） */
const relQuotes = (o: O) => o.quotes > 0
  ? [{ id: 'BJ000011', ver: 'V2', amt: 4800000, status: '待审批', date: o.last }]
  : [];
/** 关联投标：取 BIDS 中 opp 外键指向本商机且仍在途的记录（投标单据归 BidPage 管理） */
const relBids = (o: O) => getOppBids(o.id);

export default function OppPage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  const money = canSeeMoney(role);
  const isAdmin = role === 'boss' || role === 'admin' || role === '超级管理员';

  const [view, setView] = useState<'list' | 'kanban'>('list');
  /* 商机主数据走共享 store：推进阶段 / 赢单 / 输单 / 重开均真实回流列表、看板、筛选计数与详情。
     阶段模板同源订阅：设置页增删 / 排序 / 改权重后，本页筛选 chips、看板列、推进弹窗与加权金额即时跟随。 */
  const [opps, setOpps] = useState<O[]>(getOpps);
  /* 阶段模板本体（含权重 / gate）与阶段名数组分开：模板可配，阶段名供筛选 / 看板 / 下拉直接使用 */
  const [tpl, setTpl] = useState(getOppStages);
  /* 订阅同时维护 tick：只 setOpps(getOpps()) 在数组引用未变时会被 React 跳过重渲染，
     下游新签的合同 / 项目（已产出计数）就读不到。 */
  const [tick, setTick] = useState(0);
  useEffect(() => subscribeStore(() => { setOpps(getOpps()); setTpl(getOppStages()); setTick((n) => n + 1); }), []);
  const stages = useMemo(() => tpl.map((s) => s.name), [tpl]);
  /** gate 序号：金额必填分界线（与 store.getOppGateIdx 同源，避免两处派生逻辑漂移） */
  const gateIdx = useMemo(() => getOppGateIdx(), [tpl]);
  const stageW = getOppStageWeight;
  const idxOf = getOppStageIdx;
  const [stage, setStage] = useState('全部');
  const [statusF, setStatusF] = useState('全部');
  const [type, setType] = useState('全部');
  const [kw, setKw] = useState('');
  const [owner, setOwner] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [oppSel, setOppSel] = useState<string[]>([]);

  const [detail, setDetail] = useState<O | null>(null);
  const [dTab, setDTab] = useState('overview');
  const [addOpen, setAddOpen] = useState(false);
  /* 赢单 / 输单（终态）：输单必填原因，可填竞争对手 */
  const [loseOpen, setLoseOpen] = useState<O | null>(null);
  const [loseStatus, setLoseStatus] = useState<'赢单' | '输单'>('输单');
  const [loseReason, setLoseReason] = useState('');
  const [loseCompetitor, setLoseCompetitor] = useState('');
  const [quoteOpen, setQuoteOpen] = useState<O | null>(null);
  /* ---- 新增：阶段推进（可跳选可回退） / 重开 / 转化 / 勘察 ---- */
  const [advOpen, setAdvOpen] = useState<O | null>(null);
  const [advStage, setAdvStage] = useState('');
  const [advNote, setAdvNote] = useState('');
  const [reopenOpen, setReopenOpen] = useState<O | null>(null);
  const [svyOpen, setSvyOpen] = useState<{ o: O; s: Svy | null } | null>(null);
  const [svyForm, setSvyForm] = useState<Svy>({ id: '', oppId: '', at: TODAY, persons: [], sys: '', desc: '', photos: 0, rows: [] });
  /* 工程量项模板库勾选：内容取物料主数据（可搜索 / 按类型快筛 / 分页），勾选后带出名称+单位+参考单价，数量现场手填 */
  const [svyTplOpen, setSvyTplOpen] = useState(false);
  const [svyTplSel, setSvyTplSel] = useState<string[]>([]);
  const [svyTplKw, setSvyTplKw] = useState('');
  const [svyTplKind, setSvyTplKind] = useState('');
  const [svyTplShown, setSvyTplShown] = useState(TPL_PAGE);
  /* OCR 识别录入工程量：上传清单照片 → 识别出行 → 复核后带入清单 */
  const [ocrOpen, setOcrOpen] = useState(false);
  const [ocrStage, setOcrStage] = useState<'idle' | 'scanning' | 'done'>('idle');
  const [ocrSel, setOcrSel] = useState<string[]>([]);
  /* Excel 粘贴：粘贴 / 选文件 → 按物料库核对 → 带入清单 */
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteStep, setPasteStep] = useState<'pick' | 'check'>('pick');
  const [pasteText, setPasteText] = useState('');
  const [pasteGrid, setPasteGrid] = useState<string[][] | null>(null);
  const [pasteErr, setPasteErr] = useState('');
  const [pasteBusy, setPasteBusy] = useState(false);
  const [pasteDrag, setPasteDrag] = useState(false);
  const [pasteMode, setPasteMode] = useState<'append' | 'replace'>('append');
  /** 未匹配到物料库的名称（表格上方提示用） */
  const [badNames, setBadNames] = useState<string[]>([]);
  const pasteFileRef = useRef<HTMLInputElement>(null);
  /* 批量填列：统一值 / 按倍数 / 粘贴一列 */
  const [fillOpen, setFillOpen] = useState(false);
  const [fillCol, setFillCol] = useState<'u' | 'q' | 'r'>('q');
  const [fillMode, setFillMode] = useState<'value' | 'scale' | 'paste'>('value');
  const [fillVal, setFillVal] = useState('');
  const [fillText, setFillText] = useState('');
  const [cvtHtOpen, setCvtHtOpen] = useState<O | null>(null);
  const [cvtXmOpen, setCvtXmOpen] = useState<O | null>(null);
  const [noContractReason, setNoContractReason] = useState('');

  /* ---- 模板库候选集：取物料主数据（启用）· 类型档位由字典派生且只留真实存在的档 ---- */
  const tplItems = useMemo(() => getActiveItems(), [tick]);
  const tplKinds = useMemo(() => ITEM_KINDS.filter((k) => tplItems.some((i) => i.ty === k)), [tplItems]);
  const tplMatched = useMemo(() => {
    const k = svyTplKw.trim().toLowerCase();
    return tplItems.filter((i) => {
      if (svyTplKind && i.ty !== svyTplKind) return false;
      if (!k) return true;
      return `${i.code} ${i.name} ${i.spec} ${i.cat}`.toLowerCase().includes(k);
    });
  }, [tplItems, svyTplKw, svyTplKind]);
  const tplVisible = tplMatched.slice(0, svyTplShown);
  /* 全选口径：表头 checkbox = 「所见即所选」（当前显示的行）；
     匹配数多于显示数时，计数行另给「全选匹配的 N 项」，避免勾到看不见的项。 */
  const tplVisSel = tplVisible.filter((i) => svyTplSel.includes(i.code)).length;
  const tplAllOn = tplVisible.length > 0 && tplVisSel === tplVisible.length;
  const toggleTplAll = () => setSvyTplSel((sel) => {
    const codes = tplVisible.map((i) => i.code);
    return tplAllOn ? sel.filter((c) => !codes.includes(c)) : Array.from(new Set([...sel, ...codes]));
  });
  const selTplAllMatched = () => setSvyTplSel((sel) => Array.from(new Set([...sel, ...tplMatched.map((i) => i.code)])));
  /* ---- OCR 识别结果：按物料主数据编码解析，缺项自动跳过（主数据调整后弹窗不报错） ---- */
  const ocrHits = useMemo(
    () => OCR_DEMO.map((d) => { const it = tplItems.find((i) => i.code === d.code); return it ? { ...d, it } : null; })
      .filter((x): x is { code: string; q: string; conf: number; it: ItemRow } => !!x),
    [tplItems],
  );
  /* ---- Excel 粘贴核对行：名称按物料库匹配（命中 → 带出编码 / 单位 / 参考价） ---- */
  const pasteRows = useMemo<PasteRow[]>(() => (pasteGrid ?? []).map((r) => {
    const name = (r[0] ?? '').trim();
    const item = matchItemOf(tplItems, name);
    return { name, unit: (r[1] ?? '').trim() || item?.unit || '', qty: (r[2] ?? '').trim(), note: (r[3] ?? '').trim(), item };
  }).filter((r) => r.name || r.qty), [pasteGrid, tplItems]);
  const pasteOk = pasteRows.filter((r) => r.item);
  const pasteMiss = pasteRows.filter((r) => !r.item);

  /* ---- 新增：更多筛选（金额区间 / 创建区间 / 排序） ---- */
  const [more, setMore] = useState(false);
  const [amtMin, setAmtMin] = useState('');
  const [amtMax, setAmtMax] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState(SORT_OPTS[0]);

  /* ---- 新增：新建商机（L0 必填 / L1 选填折叠 · 客户弹层新建 · 来源 · 重复提醒 · 草稿） ---- */
  const [nName, setNName] = useState('');
  const [nCust, setNCust] = useState('昆明万达广场商业管理有限公司');
  const [nBiz, setNBiz] = useState('GC');
  const [nTypeF, setNTypeF] = useState('新建');
  const [nSrc, setNSrc] = useState('自拓');
  const [nAmt, setNAmt] = useState('');
  const [nSign, setNSign] = useState('');
  const [nOwner, setNOwner] = useState('蓝峰');
  const [nNote, setNNote] = useState('');
  const [l1Open, setL1Open] = useState(false);
  const [custNew, setCustNew] = useState(false);
  /* 弹层新建客户：字段与默认值对齐「客户管理 → 新增客户」的必填集（名称/联系人/电话/区域/分级/来源/状态） */
  const [custName, setCustName] = useState('');
  const [custContact, setCustContact] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custRegion, setCustRegion] = useState('昆明');
  const [custGrade, setCustGrade] = useState('C');
  const [custSource, setCustSource] = useState('自主开发');
  const [custStatus, setCustStatus] = useState('潜在');
  const [custIndustry, setCustIndustry] = useState('商业综合体');
  const [cErr, setCErr] = useState<Record<string, string>>({});
  const [cDup, setCDup] = useState('');
  /** 弹层新建的客户：并入选择器候选，让「自动回填并选中」在界面上真正可见（会话内有效） */
  const [custExtra, setCustExtra] = useState<CustOpt[]>([]);
  const custOpts = useMemo(() => (custExtra.length ? [...custExtra, ...CUSTOMERS] : undefined), [custExtra]);

  /** 重复不拦截，仅黄字提醒 */
  const dupHit = useMemo(() => {
    const k = nName.trim();
    if (k.length < 4) return [] as O[];
    return opps.filter((o) => o.name.includes(k) || k.includes(o.name.slice(0, 8)));
  }, [nName]);

  /* 客户档案唯一性：与「客户管理 → 新增客户」同一算法（剥离行业后缀后取前 4 字比对），只提示不拦截 */
  const CUST_SUFFIX = /有限公司|股份|集团|管理|科技|医院|中学|大学/g;
  const onCustName = (v: string) => {
    setCustName(v);
    const key = v.replace(CUST_SUFFIX, '').slice(0, 4);
    const hit = v.length >= 4 && CUSTOMERS.find((c) => c.name.replace(CUST_SUFFIX, '').slice(0, 4) === key);
    setCDup(hit ? `与「${hit.name}」相似度 ≥80%，可能重复：查看 / 合并 / 仍要新建` : '');
  };

  /** 弹层建档：校验口径与客户管理一致，通过后回填并选中当前商机的客户 */
  const doCreateCust = () => {
    const e: Record<string, string> = {};
    if (!custName.trim()) e.name = '请填写客户名称';
    if (!custContact.trim()) e.contact = '联系人姓名必填（≤20 字）';
    if (!custPhone.trim()) e.phone = '联系电话必填（重复将触发撞单提示）';
    if (!custRegion) e.region = '区域必填';
    setCErr(e);
    if (Object.keys(e).length) { toast('表单校验未通过 · 请检查红框字段', 'err'); return; }
    /* 新客户落进候选集，否则 CustomerPicker 解析不到这个值，界面只会显示占位符 */
    const newId = `KH${TODAY.replace(/-/g, '')}${String(CUSTOMERS.length + custExtra.length + 1).padStart(3, '0')}`;
    setCustExtra((a) => [{
      id: newId, name: custName.trim(), grade: custGrade, status: custStatus,
      industry: custIndustry, region: custRegion,
    }, ...a]);
    setNCust(custName.trim());
    setCustNew(false);
    toast(`客户「${custName.trim()}」已建档（${newId}）并回填选中（档案强校验通过）`);
    setCustName(''); setCustContact(''); setCustPhone(''); setCustRegion('昆明');
    setCustGrade('C'); setCustSource('自主开发'); setCustStatus('潜在'); setCustIndustry('商业综合体');
    setCErr({}); setCDup('');
  };

  const rows = useMemo(() => {
    const list = opps.filter((o) =>
      (stage === '全部' || o.stage === stage) && (statusF === '全部' || o.status === statusF) &&
      (type === '全部' || o.type === type) &&
      (!owner || o.owner === owner) && (!kw || (o.name + o.customer + o.id).includes(kw)) &&
      (!amtMin || o.amt >= Number(amtMin) * 10000) && (!amtMax || o.amt <= Number(amtMax) * 10000) &&
      (!from || o.last >= from) && (!to || o.last <= to));
    const arr = [...list];
    if (sort === '最近推进倒序') arr.sort((a, b) => b.last.localeCompare(a.last));
    else if (sort === '金额从高到低') arr.sort((a, b) => b.amt - a.amt);
    else if (sort === '金额从低到高') arr.sort((a, b) => a.amt - b.amt);
    else arr.sort((a, b) => (a.signDate || '9999').localeCompare(b.signDate || '9999'));
    return arr;
  }, [stage, statusF, type, owner, kw, amtMin, amtMax, from, to, sort]);

  const paged = rows.slice((page - 1) * pageSize, page * pageSize);
  const active = opps.filter((o) => !isOppClosed(o));
  const weighted = active.reduce((s, o) => s + o.amt * (stageW(o.stage) || 0) / 100, 0);
  /* 勘察记录走共享 store：切页不丢，且与商机按 oppId 归属 */
  const svyOf = (o: O) => getSvys(o.id);
  /** 阶段历史：store 里的真实留痕在前，无留痕时回落到按当前阶段推导的示意链 */
  const histOf = (o: O) => {
    const real = getOppLogs(o.id);
    if (real.length) return real;
    const cur = idxOf(o.stage);
    return stages.slice(0, Math.max(cur + 1, 1)).reverse().map((s, i, arr) => ({
      at: o.last, from: arr[i + 1] || '—', to: s, by: o.owner,
      note: i === 0 ? '最近一次推进' : '',
    }));
  };

  /**
   * 跨页穿透：从客户 / 报价 / 项目等页面下钻进来时，自动打开目标商机详情。
   * 以 nav（路由脉冲）为依赖，保证反复下钻同一页也能重新定位。
   */
  useEffect(() => {
    const id = consumeFocus('opp');
    if (!id) return;
    const hit = opps.find((o) => o.id === id);
    if (hit) { setDetail(hit); setDTab('overview'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav]);

  /* ---------- 推进阶段（弹窗选阶段 + 说明，可跳选可回退） ---------- */
  const openAdv = (o: O) => {
    setAdvOpen(o); setAdvStage(o.stage); setAdvNote('');
  };
  const doAdv = () => {
    const o = advOpen;
    if (!o) return;
    if (advStage === o.stage) { toast('新阶段与当前阶段相同，无需推进', 'err'); return; }
    if (!advNote.trim()) { toast('阶段说明必填（用于阶段历史留痕）', 'err'); return; }
    /* 金额闸口：阶段 ≥ gate（默认「方案报价」）起预计金额必填。
       转化不受阶段限制（由赢单动作触发），故此处只校验金额，不再校验转化资格。
       终态商机（赢单 / 输单）已由按钮隐藏，不可再推进阶段。 */
    if (idxOf(advStage) >= gateIdx && !o.amt) { toast(`推进到「${stages[gateIdx]}」起预计金额必填 · 请先在商机详情就地补填`, 'err'); return; }
    /* requireBid 门控（按单启用）：投标阶段须先发起关联投标单，否则不允许推进 */
    const advTpl = tpl.find((x) => x.name === advStage);
    if (advTpl?.requireBid && getOppBids(o.id).length === 0) { toast(`推进到「${advStage}」须先发起关联投标单 · 请前往投标管理新建投标`, 'err'); return; }
    moveOpp(o.id, advStage, advNote.trim(), o.owner);
    toast(`阶段已推进：${o.stage} → ${advStage}（权重 ${stageW(advStage)}% · 说明：${advNote.trim()}）`);
    setAdvOpen(null); setAdvNote('');
  };

  /* ---------- 勘察：新增 / 保存 / 生成报价 ---------- */
  const openSvy = (o: O, s: Svy | null) => {
    setSvyOpen({ o, s });
    setSvyForm(s ?? { id: `SRV-2026-${String(100 + Math.floor(Math.random() * 800))}`, oppId: o.id, at: TODAY, persons: [], sys: '', desc: '', photos: 0, rows: [{ code: '', n: '', u: '个', q: '', r: '' }] });
  };
  const togglePerson = (p: string) => setSvyForm((f) => ({
    ...f,
    persons: f.persons.includes(p) ? f.persons.filter((x) => x !== p) : (f.persons.length >= 5 ? (toast('勘察人员最多 5 人', 'err'), f.persons) : [...f.persons, p]),
  }));
  const setRow = (i: number, k: keyof QtyRow, v: string) => setSvyForm((f) => ({ ...f, rows: f.rows.map((r, ix) => (ix === i ? { ...r, [k]: v } : r)) }));
  /** 选料带出：名称 / 单位取自物料主数据，备注默认写参考单价；清空时同步清掉名称与备注 */
  const setRowItem = (i: number, code: string) => setSvyForm((f) => ({
    ...f,
    rows: f.rows.map((r, ix) => {
      if (ix !== i) return r;
      const it = code ? tplItems.find((x) => x.code === code) : undefined;
      return it
        ? { ...r, code: it.code, n: it.name, u: it.unit, r: r.r || `参考单价¥${it.price}/${it.unit}` }
        : { ...r, code: '', n: '', r: '' };
    }),
  }));
  const openSvyTpl = () => { setSvyTplSel([]); setSvyTplKw(''); setSvyTplKind(''); setSvyTplShown(TPL_PAGE); setSvyTplOpen(true); };
  const toggleTpl = (code: string) => setSvyTplSel((sel) => (sel.includes(code) ? sel.filter((x) => x !== code) : [...sel, code]));
  const addTplRows = () => {
    const picked = svyTplSel.map((c) => tplItems.find((i) => i.code === c)).filter((x): x is ItemRow => !!x);
    if (!picked.length) { toast('请先勾选要添加的工程量项', 'err'); return; }
    setSvyForm((f) => ({ ...f, rows: [...f.rows, ...picked.map((it) => ({ code: it.code, n: it.name, u: it.unit, q: '', r: `参考单价¥${it.price}/${it.unit}` } as QtyRow))] }));
    toast(`已从模板库带入 ${picked.length} 项，请填写数量`);
    setSvyTplOpen(false);
  };
  /* ---- OCR 识别录入工程量 ---- */
  const openOcr = () => { setOcrStage('idle'); setOcrSel([]); setOcrOpen(true); };
  const toggleOcr = (code: string) => setOcrSel((sel) => (sel.includes(code) ? sel.filter((x) => x !== code) : [...sel, code]));
  const runOcr = () => {
    setOcrStage('scanning');
    window.setTimeout(() => { setOcrStage('done'); setOcrSel(ocrHits.map((h) => h.code)); }, 900);
  };
  const addOcrRows = () => {
    const picked = ocrHits.filter((h) => ocrSel.includes(h.code));
    if (!picked.length) { toast('请先勾选要带入的识别结果', 'err'); return; }
    setSvyForm((f) => ({ ...f, rows: [...f.rows, ...picked.map((h) => ({ code: h.code, n: h.it.name, u: h.it.unit, q: h.q, r: '' } as QtyRow))] }));
    toast(`OCR 已带入 ${picked.length} 行工程量，请复核数量`);
    setOcrOpen(false);
  };
  /* ---------- Excel 粘贴 ---------- */
  const openPaste = () => {
    setPasteStep('pick'); setPasteText(''); setPasteGrid(null);
    setPasteErr(''); setPasteBusy(false); setPasteMode('append'); setPasteOpen(true);
  };
  const openFill = () => { setFillCol('q'); setFillMode('value'); setFillVal(''); setFillText(''); setFillOpen(true); };
  /** 解析结果 → 进入核对步骤 */
  const acceptPaste = (grid: string[][]) => {
    if (!grid.length) { setPasteErr('没解析到内容：请在 Excel 里选中整块单元格后再复制'); return; }
    setPasteGrid(stripHeader(grid));
    setPasteErr('');
    setPasteStep('check');
  };
  const onPasteFile = async (f: File) => {
    setPasteBusy(true); setPasteErr('');
    try { acceptPaste(await readTableFile(f)); }
    catch (e) { setPasteErr(e instanceof Error ? e.message : '读取文件失败'); }
    finally { setPasteBusy(false); }
  };
  /** 核对行 → 工程量行（命中物料：带出编码 / 单位 / 参考价；未命中：只留名称） */
  const toQtyRow = (r: PasteRow): QtyRow => (r.item
    ? { code: r.item.code, n: r.item.name, u: r.unit || r.item.unit, q: r.qty, r: r.note || `参考单价¥${r.item.price}/${r.item.unit}` }
    : { code: '', n: r.name, u: r.unit || '个', q: r.qty, r: r.note });
  const addPasteRows = () => {
    if (!pasteOk.length) { toast('没有可带入的行：名称需与物料库一致', 'err'); return; }
    setSvyForm((f) => ({
      ...f,
      rows: [...(pasteMode === 'append' ? f.rows : []), ...pasteOk.map(toQtyRow)].slice(0, 100),
    }));
    setBadNames(pasteMiss.map((r) => r.name));
    toast(`已带入 ${pasteOk.length} 行${pasteMiss.length ? `；${pasteMiss.length} 行名称未匹配物料，未带入` : ''}`);
    setPasteOpen(false);
  };
  /**
   * 表格内直接粘贴：从 (row0, col0) 起铺开。
   * 粘贴 1 列 → 填当前列（批量替换某列）；粘贴 ≥2 列 → 按「名称 / 单位 / 数量 / 备注」整行铺开。
   * 名称列按物料库匹配，未命中的行**保持原值**并汇总提示（不猜、不静默丢）。
   */
  const pasteAtCell = (grid: string[][], row0: number, col0: number) => {
    const wide = grid.some((l) => l.length >= 2);
    const startCol = wide ? 0 : col0;
    const rows = svyForm.rows.map((r) => ({ ...r }));
    const miss: string[] = [];
    while (rows.length < row0 + grid.length && rows.length < 100) rows.push({ code: '', n: '', u: '个', q: '', r: '' });
    grid.forEach((line, ri) => {
      const tr = rows[row0 + ri];
      if (!tr) return;
      line.forEach((raw, ci) => {
        const c = startCol + ci;
        if (c > 3) return;
        const v = raw.trim();
        if (c === 0) {
          if (!v) { tr.code = ''; tr.n = ''; return; }
          const it = matchItemOf(tplItems, v);
          if (it) {
            tr.code = it.code; tr.n = it.name;
            if (!tr.u) tr.u = it.unit;
            if (!tr.r) tr.r = `参考单价¥${it.price}/${it.unit}`;
          } else miss.push(v);
        } else if (c === 1) tr.u = v;
        else if (c === 2) tr.q = v;
        else tr.r = v;
      });
    });
    setSvyForm((f) => ({ ...f, rows }));
    setBadNames(miss);
    toast(miss.length ? `已粘贴；${miss.length} 个名称未匹配物料，该行名称未改动` : '已从剪贴板粘贴到工程量清单');
  };
  const onCellPaste = (e: React.ClipboardEvent, i: number, col: 0 | 1 | 2 | 3) => {
    const text = e.clipboardData.getData('text/plain');
    if (!text || !/[\t\n]/.test(text)) return;   /* 单值粘贴不拦截，走原生行为 */
    e.preventDefault();
    pasteAtCell(parseDelimited(text), i, col);
  };
  /* ---------- 批量填列 ---------- */
  const applyFill = () => {
    const label = FILL_COLS.find((c) => c.key === fillCol)?.label ?? '';
    if (fillMode === 'paste') {
      const vals = parseDelimited(fillText).map((r) => (r[0] ?? '').trim()).filter(Boolean);
      if (!vals.length) { toast('请先粘贴一列数据', 'err'); return; }
      setSvyForm((f) => ({ ...f, rows: f.rows.map((r, i) => (i < vals.length ? withCol(r, fillCol, vals[i]) : r)) }));
      toast(`「${label}」已按列更新 ${Math.min(vals.length, svyForm.rows.length)} 行`);
    } else if (fillMode === 'value') {
      if (!fillVal.trim()) { toast(`请填写要统一设置的${label}`, 'err'); return; }
      setSvyForm((f) => ({ ...f, rows: f.rows.map((r) => withCol(r, fillCol, fillVal.trim())) }));
      toast(`「${label}」整列已设为 ${fillVal.trim()}`);
    } else {
      const k = Number(fillVal);
      if (!Number.isFinite(k) || k <= 0) { toast('请填写大于 0 的倍数（如 1.2）', 'err'); return; }
      setSvyForm((f) => ({
        ...f,
        rows: f.rows.map((r) => {
          const n = Number(r[fillCol]);
          return r[fillCol] !== '' && Number.isFinite(n) ? withCol(r, fillCol, String(Math.round(n * k * 1000) / 1000)) : r;
        }),
      }));
      toast(`「${label}」已按 ${k} 倍调整`);
    }
    setFillOpen(false);
  };
  const validSvy = () => {
    if (!svyForm.at) { toast('勘察时间必填', 'err'); return false; }
    if (svyForm.at > TODAY) { toast(`勘察时间不可晚于当前时间（${TODAY}）`, 'err'); return false; }
    if (!svyForm.persons.length) { toast('勘察人员至少 1 人', 'err'); return false; }
    if (!svyForm.sys) { toast('系统类别必选', 'err'); return false; }
    if (svyForm.desc.trim().length < 10) { toast('勘察描述至少 10 个字', 'err'); return false; }
    return true;
  };
  const saveSvy = () => {
    if (!validSvy() || !svyOpen) return;
    const o = svyOpen.o;
    const rec: Svy = { ...svyForm, oppId: o.id, rows: svyForm.rows.filter((r) => r.n.trim()) };
    addSvy(rec);
    toast(`勘察已保存：${rec.id}（工程量 ${rec.rows.length} 行）· 可在下方记录行点「生成报价单」`);
    setSvyOpen(null);
  };
  /** 一条勘察记录里**可带入报价**的工程量行数：名称对上物料主数据、且数量 > 0（对不上的无法计价） */
  const quotableRowsOf = (s: Svy) => s.rows.filter((r) => r.code && Number(r.q) > 0 && tplItems.some((x) => x.code === r.code)).length;

  /* ---------- 勘察记录 → 报价单 ----------
     对**已保存的勘察记录**发起（列表行操作），不是对弹窗里那份还没落库的表单 ——
     否则「生成」就等于「顺手保存」，用户先存好、再针对某条记录生成这条正常路径反而走不通。
     真正落库一张草稿（明细 = 该记录的工程量清单），回写 quoteId 锁定该记录，再跳报价工作台继续组价。 */
  const genQuote = (o: O, s: Svy) => {
    if (s.quoteId) { toast(`该勘察记录已生成报价单 ${s.quoteId}`, 'err'); return; }
    const ok = s.rows.filter((r) => r.n.trim() && Number(r.q) > 0);
    if (!ok.length) { toast('该勘察记录没有可计价的工程量行（需名称对上物料库、数量 > 0）', 'err'); return; }
    /* 逐行按物料主数据取成本与目录默认上浮率 —— 与报价工作台同一套口径，不在这里另算一套：
       cost = itemCostBase(物料)（四类「参考价」语义各不相同）· markup = markupOf(分类树节点) */
    const lines: QuoteLine[] = [];
    ok.forEach((r) => {
      const it = r.code ? tplItems.find((x) => x.code === r.code) : undefined;
      if (!it) return;
      const cost = itemCostBase(it);
      const markup = markupOf(it.cat);
      lines.push({
        matId: it.code, catId: it.cat, name: it.name, spec: it.spec,
        unit: r.u || it.unit, qty: Number(r.q), cost, markup,
        price: Math.round((cost + (cost * markup) / 100) * 100) / 100,
        note: r.r || undefined,
      });
    });
    if (!lines.length) { toast('清单里的名称都没对上物料库，无法计价；请核对名称或联系采购新增物料', 'err'); return; }
    const dropped = s.rows.filter((r) => r.n.trim()).length - lines.length;
    const sum = lines.reduce((a, l) => a + l.price * l.qty, 0);
    const costSum = lines.reduce((a, l) => a + l.cost * l.qty, 0);
    const qid = nextQuoteNo();
    addQuote({
      id: qid, ver: 'V1', customer: o.customer,
      /* 客户外键：商机若未带 customerId，按客户名回查档案兜底（避免落成空外键） */
      customerId: o.customerId ?? CUSTOMERS.find((c) => c.name === o.customer)?.id ?? '',
      opp: o.id,
      name: `${o.name}报价`, total: Math.round(sum * 100) / 100,
      taxRate: 9, taxMode: '含税', status: '草稿', owner: o.owner,
      date: TODAY, update: TODAY, approveLevel: '—',
      /* 整单上浮率 = 各明细按成本额加权的平均浮率，与工作台「整单上浮率」同口径 */
      markup: costSum ? Math.round(lines.reduce((a, l) => a + l.markup * l.cost * l.qty, 0) / costSum) : 0,
      region: '昆明', uplift: 0, items: lines.length, base: o.industry || '其他', costSqm: 0,
      lines,
    });
    /* 回写 quoteId：该条勘察记录随即锁定只读（不新建记录，也不覆盖其它字段） */
    patchSvy(s.id, { quoteId: qid });
    toast(`报价单 ${qid} 已生成（草稿 · 明细 ${lines.length} 行${dropped ? ` · ${dropped} 行未带入` : ''}）· 已进入报价工作台`);
    setFocus('quote-edit', qid);
    go('quote-edit');
  };

  /* 统一导出：把原「一步直达 CSV」补全为标准弹窗流程；预计金额 / 加权金额为敏感字段 */
  const exportFields: ExportField[] = [
    { key: 'id', label: '商机编号' },
    { key: 'name', label: '商机名称' },
    { key: 'customer', label: '客户' },
    { key: 'stage', label: '阶段' },
    { key: 'status', label: '状态' },
    { key: 'amt', label: '预计金额', sensitive: true },
    { key: 'prob', label: '权重' },
    { key: 'w', label: '加权金额', sensitive: true },
    { key: 'owner', label: '负责人' },
    { key: 'signDate', label: '预计签约日' },
  ];
  const exportApi = useExport({
    pageKey: 'opp', pageName: '商机列表',
    fields: exportFields, defaultFieldKeys: exportFields.map((f) => f.key),
    totalCount: opps.length, filteredCount: rows.length, selectedCount: oppSel.length,
    previewRows: rows.slice(0, 5),
    userName: getUserName(role),
    onExport: () => {},
  });

  return (
    <>
      <PageHead
        title="商机管理"
        badges={<><Tag tone="gray">{stages.length} 阶段推进</Tag><Tag tone="blue">阶段可配置</Tag></>}
      />

      <div className="nc-tiles nc-tiles-5">
        <div className="nc-tile"><div className="nc-tile-label">在谈商机</div><div className="nc-tile-value">{active.length}</div><div className="nc-tile-sub">不含赢单 / 输单</div></div>
        <div className="nc-tile"><div className="nc-tile-label">在谈金额</div><div className="nc-tile-value nc-v-blue">{money ? fmtWan(active.reduce((s, o) => s + o.amt, 0)) : '—'}</div><div className="nc-tile-sub">含税未折权重</div></div>
        <Tile label="加权金额" tone="blue" value={money ? fmtWan(weighted) : '—'} sub="用于经营测算"
          tip={<>
            <b>加权金额 = 金额 × 阶段权重</b><br />
            {stages.map((s) => `${s} ${stageW(s)}%`).join(' · ')}<br />
            权重在「系统设置 · 业务字典 · 商机阶段」维护，调整后加权预测即时重算。
          </>} />
        <Tile label={stages[stages.length - 1]} value={active.filter((o) => o.stage === stages[stages.length - 1]).length} sub="在谈 · 可转合同 / 项目"
          tip={<>
            <b>阶段推进规则</b><br />
            {stages.map((s, i) => (i === gateIdx ? `${s}（金额开始必填）` : s)).join(' → ')}<br />
            此卡只计「跟进中」的商机：终态（赢单 / 输单）的阶段冻结在末档，不计入可转合同口径。<br />
            赢单后可一键转报价或转合同草稿，<b>转化不受阶段限制</b>。<br />
            推进 / 回退须填说明并留痕；赢单 / 输单为终态（输单必填原因）；终态仅管理员可重开，已转化不可重开；勘察生成报价后锁定只读（修改 = 新建一条）。
          </>} />
        <div className="nc-tile"><div className="nc-tile-label">超 {getOppFollowDays()} 天未跟进</div><div className={`nc-tile-value${opps.filter((o) => o.lastDays > getOppFollowDays() && !isOppClosed(o)).length > 0 ? ' nc-v-red' : ''}`}>{opps.filter((o) => o.lastDays > getOppFollowDays() && !isOppClosed(o)).length}</div><div className="nc-tile-sub">需立即跟进</div></div>
      </div>

      <Card flush>
        <ListToolbar
          rows={[
            {
              label: '阶段', value: stage, onChange: (k) => { setStage(k); setPage(1); },
              items: [
                { key: '全部', label: '全部阶段', cnt: opps.length },
                ...stages.map((s) => ({ key: s, label: s, cnt: opps.filter((o) => o.stage === s).length })),
              ],
            },
            {
              label: '状态', value: statusF, onChange: (k) => { setStatusF(k); setPage(1); },
              items: [
                { key: '全部', label: '全部状态', cnt: opps.length },
                ...OPP_STATUS.map((s) => ({ key: s, label: s, cnt: opps.filter((o) => o.status === s).length })),
              ],
            },
          ]}
          children={
            <div className="nc-ltrow" style={{ gap: 6, alignItems: 'center' }}>
              <Btn onClick={() => setMore((v) => !v)}>{more ? '收起筛选 ▴' : '更多筛选 ▾'}</Btn>
              {more && (<>
                <span className="nc-ltlbl">类型</span>
                <select className="nc-input" style={{ width: 120 }} value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
                  <option value="">全部类型</option>
                  {['新建', '改造', '维护保养', '检测'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <select className="nc-input" style={{ width: 130 }} value={owner} onChange={(e) => { setOwner(e.target.value); setPage(1); }}>
                  <option value="">全部归属人</option>{['蓝峰', '李思敏', '王志海', '赵薇', '刘宇', '李慧敏'].map((s) => <option key={s}>{s}</option>)}
                </select>
                <span className="nc-ltlbl" style={{ marginLeft: 8 }}>金额区间</span>
                <input className="nc-input num" style={{ width: 88 }} value={amtMin} onChange={(e) => { setAmtMin(e.target.value); setPage(1); }} placeholder="最小" />
                <span className="nc-muted nc-tiny">万元 ~</span>
                <input className="nc-input num" style={{ width: 88 }} value={amtMax} onChange={(e) => { setAmtMax(e.target.value); setPage(1); }} placeholder="最大" />
                <span className="nc-muted nc-tiny">万元</span>
                <span className="nc-ltlbl" style={{ marginLeft: 14 }}>创建区间</span>
                <input className="nc-input num" style={{ width: 132 }} type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
                <span className="nc-muted nc-tiny">~</span>
                <input className="nc-input num" style={{ width: 132 }} type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
                <span className="nc-tiny nc-muted" style={{ marginLeft: 'auto' }}>命中 <b>{rows.length}</b> 条 · 金额按万元输入</span>
              </>)}
            </div>
          }
          search={{ value: kw, onChange: setKw, placeholder: '搜索商机名称 / 客户 / 编号', width: 220 }}
          onReset={() => {
            setStage('全部'); setStatusF('全部'); setType('全部'); setKw(''); setOwner(''); setAmtMin(''); setAmtMax(''); setFrom(''); setTo(''); setSort(SORT_OPTS[0]); setPage(1); toast('筛选已重置');
          }}
          viewSwitch={
            <div className="nc-seg">
              <button type="button" className={`nc-seg-btn${view === 'list' ? ' is-on' : ''}`} onClick={() => setView('list')}>≡ 列表</button>
              <button type="button" className={`nc-seg-btn${view === 'kanban' ? ' is-on' : ''}`} onClick={() => setView('kanban')}>▦ 看板</button>
            </div>
          }
          echoItems={[
            ...(stage !== '全部' ? [{ key: 'stage', label: `阶段：${stage}` }] : []),
            ...(statusF !== '全部' ? [{ key: 'status', label: `状态：${statusF}` }] : []),
            ...(type !== '全部' ? [{ key: 'type', label: `类型：${type}` }] : []),
            ...(owner ? [{ key: 'owner', label: `归属人：${owner}` }] : []),
            ...((amtMin || amtMax) ? [{ key: 'amt', label: `金额：${amtMin || 0} ~ ${amtMax || '不限'} 万` }] : []),
          ]}
          onEchoRemove={(key) => {
            if (key === 'stage') setStage('全部');
            else if (key === 'status') setStatusF('全部');
            else if (key === 'type') setType('全部');
            else if (key === 'owner') setOwner('');
            else if (key === 'amt') { setAmtMin(''); setAmtMax(''); }
          }}
          onEchoClear={() => {
            setStage('全部'); setStatusF('全部'); setType('全部'); setKw(''); setOwner(''); setAmtMin(''); setAmtMax(''); setFrom(''); setTo(''); setSort(SORT_OPTS[0]); setPage(1); toast('筛选已重置');
          }}
          actions={
            <div style={{ display: 'flex', gap: 8 }}>
              <ExportButton onClick={exportApi.trigger} selectedCount={oppSel.length} />
              <Btn kind="primary" onClick={() => setAddOpen(true)}>＋ 新建商机</Btn>
            </div>
          }
        />
      </Card>

      {view === 'list' ? (
        <Card flush>
            <DataTable<O>
              selectable selected={oppSel}
              onSelectAll={setOppSel}
              onSelectRow={(id) => setOppSel((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])}
              minWidth={1490}
              cols={[
                { key: 'id', title: '商机编号', width: 104, hide: true, render: (o) => <IdCell onClick={() => { setDetail(o); setDTab('overview'); }} title="查看商机详情">{o.id}</IdCell> },
                { key: 'name', title: '商机名称', width: 240, sticky: 'left', render: (o) => { const nameTags = [
                    ...(isWonDeal(o.id) ? [{ k: 'won', label: '已成交', tone: 'green' as const }] : []),
                    { k: 'biz', label: BIZ_NAME[o.biz], tone: 'gray' as const },
                    { k: 'type', label: o.type, tone: 'blue' as const },
                  ];
                  const shown = nameTags.slice(0, 2);
                  const rest = nameTags.slice(2);
                  return (<div><div className="nc-td-main">{o.name} {shown.map((t) => <Tag key={t.k} tone={t.tone}>{t.label}</Tag>)}{rest.length > 0 && <Tag tone="gray">+{rest.length}</Tag>}</div></div>);
                } },
                { key: 'customer', title: '客户', width: 165, render: (o) => <span>{o.customer}</span> },
                { key: 'stage', title: '阶段', width: 82, render: (o) => <Tag tone={oppStageTone(idxOf(o.stage))}>{o.stage}</Tag> },
                { key: 'status', title: '状态', width: 78, render: (o) => <Tag tone={STATUS_TONE[o.status]}>{o.status}</Tag> },
                { key: 'prob', title: '权重', width: 64, align: 'right', render: (o) => <span className="num">{stageW(o.stage)}%</span> },
                { key: 'amt', title: '预计金额 ↕', width: 118, align: 'right', render: (o) => <b className="num">{money ? (o.amt ? fmtWan(o.amt) : '待定') : '—'}</b> },
                { key: 'w', title: '加权金额', width: 112, align: 'right', render: (o) => <span className="num" style={{ color: 'var(--c-warning-deep)' }}>{money ? fmtWan(o.amt * (stageW(o.stage) || 0) / 100) : '—'}</span> },
                { key: 'signDate', title: '预计签约 ↕', width: 106, align: 'right', render: (o) => o.signDate ? <span className={`num ${daysUntil(o.signDate) < 0 ? 'nc-v-red' : daysUntil(o.signDate) <= 30 ? 'nc-v-orange' : ''}`} title={daysUntil(o.signDate) < 0 ? '预计签约日已逾期，请尽快推动签约' : daysUntil(o.signDate) <= 30 ? `距预计签约不足 ${daysUntil(o.signDate)} 天` : undefined}>{o.signDate}</span> : <span style={{ color: 'var(--ink-3)' }}>待定</span> },
                { key: 'bids', title: '关联投标', width: 88, align: 'right', render: (o) => { const n = relBids(o).length; return n ? <span className="num">{n} 项</span> : <span style={{ color: 'var(--ink-3)' }}>—</span>; } },
                { key: 'owner', title: '归属人', width: 76 },
                { key: 'last', title: '最近跟进', width: 102, align: 'right', render: (o) => <span className="num" style={{ color: o.lastDays > getOppFollowDays() ? 'var(--c-danger)' : undefined }} title={o.lastDays > getOppFollowDays() ? `已超过${getOppFollowDays()}天未跟进，需立即推进` : undefined}>{o.last}{o.lastDays > getOppFollowDays() ? <> <Ico n="warning" size={12} style={{ color: 'var(--c-warning-mid)' }} /></> : null}</span> },
                {
                  key: 'ops', title: '操作', width: 160, render: (o) => (
                    <span className="nc-ops" onClick={(e) => e.stopPropagation()}>
                      <Op onClick={() => { setDetail(o); setDTab('overview'); }}>详情</Op><OpSep />
                      <Op onClick={() => openAdv(o)}>推进</Op><OpSep />
                      <OpMore items={[
                        ...(o.status !== '输单' ? [{ label: '转报价', onClick: () => setQuoteOpen(o) }] : []),
                        ...(!isOppClosed(o) ? [{ label: '标记结果', onClick: () => { setLoseOpen(o); setLoseStatus('输单'); setLoseReason(''); setLoseCompetitor(''); } }] : []),
                      ]} />
                    </span>
                  ),
                },
              ]}
              rows={paged} rowKey={(o) => o.id} onRowClick={(o) => { setDetail(o); setDTab('overview'); }}
              rowClass={(o) => (isOppClosed(o) ? 'nc-row-dead' : '')}
              foot={<TableFoot total={opps.length} filtered={rows.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />}
            />
        </Card>
      ) : (
        <Card>
          <div className="nc-listhint nc-kanban-hint">看板列 = 商机阶段模板，共 {stages.length} 列，由左至右推进；列头显示卡片数与金额合计。<Tip text="点击卡片打开商机详情，在详情内推进阶段；窄屏下横向滑动查看全部阶段。赢单 / 输单的商机停留在最后所处阶段列，以状态标签区分；赢单后可在详情内一键转报价或转合同·项目。阶段模板可在「系统设置 · 业务字典 · 商机阶段」增删 / 排序 / 改权重，改完本页列数即时跟随。" /></div>
          <div className="nc-kanban">
            {stages.map((s, si) => {
              const list = opps.filter((o) => o.stage === s);
              const sum = list.reduce((a, o) => a + o.amt, 0);
              return (
                <div className="nc-kb-col" key={s}>
                  <div className="nc-kb-hd">
                    <Tag tone={oppStageTone(si)}>{s}</Tag>
                    <span className="nc-kb-cnt">{list.length}{money && sum ? ` · ${fmtWan(sum)}` : ''}</span>
                  </div>
                  <div className="nc-kb-cards">
                    {list.map((o) => (
                      <div className="nc-kb-card" key={o.id} onClick={() => { setDetail(o); setDTab('overview'); }} {...pressProps(() => { setDetail(o); setDTab('overview'); })}>
                        <div className="nc-kb-id num">{o.id}</div>
                        <div className="nc-kb-name">{o.name}</div>
                        <div className="nc-kb-cust"><EntityLink target="customer" id={o.customerId} go={go} title="下钻到客户档案">{o.customer}</EntityLink></div>
                        <div className="nc-kb-amt num">{money ? (o.amt ? fmtWan(o.amt) : '待定') : '—'}</div>
                        <div className="nc-kb-chips">
                          <Tag tone="gray">{o.type}</Tag>
                          <Tag tone="blue">{stageW(o.stage)}%</Tag>
                          {o.status !== '跟进中' && <Tag tone={STATUS_TONE[o.status]}>{o.status}</Tag>}
                          {o.lastDays > getOppFollowDays() && !isOppClosed(o) && <Tag tone="red"><Ico n="warning" size={16} /> {o.lastDays} 天未跟进</Tag>}
                        </div>
                      </div>
                    ))}
                    {!list.length && <div className="nc-empty-mini" style={{ margin: '4px 0' }}>/ 无</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ============ 详情抽屉（5 Tab） ============ */}
      <Drawer open={!!detail} width={800} title={detail?.name || ''}
        sub={detail && <span className="num">{detail.id} · {BIZ_NAME[detail.biz]} · {detail.type} · 归属 {detail.owner}</span>}
        onClose={() => setDetail(null)}
        foot={<>
          {detail && !isOppClosed(detail) && (
            <Btn onClick={() => { setLoseOpen(detail); setLoseStatus('输单'); setLoseReason(''); setLoseCompetitor(''); setDetail(null); }}>赢单 / 输单</Btn>
          )}
          {detail && isOppClosed(detail) && (
            isAdmin
              ? <Btn onClick={() => { setReopenOpen(detail); setDetail(null); }}>重开</Btn>
              : <Btn disabled title="仅管理员可重开；已转化不可重开">重开</Btn>
          )}
          {detail && !isOppClosed(detail) && (
            <Btn kind="primary" onClick={() => { openAdv(detail); setDetail(null); }}>推进 / 回退阶段</Btn>
          )}
        </>}>
        {detail && (
          <>
            <Tabs value={dTab} onChange={setDTab} items={[
              { key: 'overview', label: '概览' },
              { key: 'srv', label: '勘察记录', cnt: svyOf(detail).length },
              { key: 'rel', label: '关联', cnt: relQuotes(detail).length + relBids(detail).length },
              { key: 'hist', label: '阶段历史', cnt: histOf(detail).length },
              { key: 'tl', label: '流转记录' },
            ]} />

            {dTab === 'overview' && (
              <div style={{ marginTop: 12 }}>
                <ChainBar nodes={stages.map((s, i) => {
                  const cur = idxOf(detail.stage);
                  return { label: s, sub: `${stageW(s)}%`, state: (i < cur ? 'done' : i === cur ? 'cur' : 'todo') as 'done' | 'cur' | 'todo' };
                })} />
                <div className="nc-tiles nc-tiles-3" style={{ margin: '14px 0' }}>
                  <div className="nc-tile"><div className="nc-tile-label">预计金额（含税）</div><div className="nc-tile-value nc-v-blue">{money ? (detail.amt ? fmtWan(detail.amt) : '待定') : '—'}</div><div className="nc-tile-sub">报价 {detail.quotes} 版</div></div>
                  <div className="nc-tile"><div className="nc-tile-label">加权金额</div><div className="nc-tile-value nc-v-orange">{money ? fmtWan(detail.amt * (stageW(detail.stage) || 0) / 100) : '—'}</div><div className="nc-tile-sub">金额 × {stageW(detail.stage)}%</div></div>
                  <div className="nc-tile"><div className="nc-tile-label">预计签约日</div><div className="nc-tile-value" style={{ fontSize: 16 }}>{detail.signDate || '待定'}</div><div className="nc-tile-sub">{detail.signDate ? `距今 ${daysUntil(detail.signDate)} 天` : '—'}</div></div>
                </div>
                <div className="nc-sec-title" style={{ marginBottom: 12 }}>商机信息</div>
                <KvGrid cols={2} rows={[
                  { k: '商机编号', v: <span className="num">{detail.id}</span> },
                  { k: '所属客户', v: <EntityLink target="customer" id={detail.customerId} go={go} title="下钻到客户档案">{detail.customer}</EntityLink> },
                  { k: '业务域', v: BIZ_NAME[detail.biz] },
                  { k: '业务类型', v: detail.type },
                  { k: '当前阶段', v: <><Tag tone={oppStageTone(idxOf(detail.stage))}>{detail.stage}</Tag> <span className="nc-muted nc-tiny">第 {idxOf(detail.stage) + 1} / {stages.length} 档</span></> },
                  { k: '阶段权重', v: `${stageW(detail.stage)}%` },
                  { k: '状态', v: <Tag tone={STATUS_TONE[detail.status]}>{detail.status}</Tag> },
                  { k: '行业', v: detail.industry },
                  { k: '归属人', v: detail.owner },
                  { k: '最近跟进', v: <span className="num" style={{ color: detail.lastDays > getOppFollowDays() ? 'var(--c-danger)' : undefined }}>{detail.last}（{detail.lastDays} 天前）{detail.lastDays > getOppFollowDays() ? <> <Ico n="warning" size={12} style={{ color: 'var(--c-warning-mid)' }} /></> : null}</span> },
                  { k: '已产出单据', v: <span className="num">{outText(detail.id)}{isWonDeal(detail.id) ? <> · <Tag tone="green">已成交</Tag></> : null}</span> },
                  { k: '输单复盘', v: detail.status === '输单' ? <span>原因：{detail.loseReason || '—'}{detail.loseCompetitor ? ` · 对手：${detail.loseCompetitor}` : ''}</span> : <span style={{ color: 'var(--ink-3)' }}>—</span> },
                ]} />
                <div className="nc-sec-title" style={{ margin: '14px 0 10px' }}>竞争与策略（在谈项目档案）</div>
                <KvGrid cols={2} rows={[
                  { k: '客户 / 行业', v: <><EntityLink target="customer" id={detail.customerId} go={go} title="下钻到客户档案">{detail.customer}</EntityLink> · {detail.industry}</> },
                  { k: '负责人', v: detail.owner },
                  { k: '决策链', v: <span className="nc-cell-sub">{chainText(detail)}</span> },
                  { k: '竞争对手', v: <span className="nc-cell-sub">{compText(detail)}</span> },
                  { k: '我方优势', v: <span className="nc-cell-sub">{advText(detail)}</span> },
                  { k: '下一步动作', v: <span className="nc-cell-sub">{nextText(detail)}</span> },
                ]} />
              </div>
            )}

            {dTab === 'srv' && (
              <div style={{ marginTop: 12 }}>
                <div className="nc-inline-ops" style={{ marginBottom: 12 }}>
                  <span className="nc-cell-sub">保存后可在记录行点「生成报价单」；生成后该条锁定只读，如需修改请新建一条</span>
                  <span style={{ flex: 1 }} />
                  <Btn size="sm" kind="primary" onClick={() => openSvy(detail, null)}>＋ 新增勘察记录</Btn>
                </div>
                {svyOf(detail).length === 0
                  ? <div className="nc-empty-mini">暂无勘察记录：点击「＋ 新增勘察记录」登记并保存，再在记录行点「生成报价单」由工程量清单生成报价草稿</div>
                  : (
                    <table className="nc-tbl" style={{ minWidth: 720 }}>
                      <thead><tr>
                        <th style={{ width: 116 }}>勘察编号</th><th style={{ width: 96 }}>勘察时间</th>
                        <th style={{ width: 86 }}>勘察人员</th><th>系统类别</th>
                        <th style={{ width: 66 }} className="is-num">工程量</th><th style={{ width: 130 }}>报价状态</th><th style={{ width: 140 }}>操作</th>
                      </tr></thead>
                      <tbody>
                        {svyOf(detail).map((s) => (
                          <tr key={s.id}>
                            <td><Code>{s.id}</Code></td>
                            <td className="num">{s.at}</td>
                            <td>{s.persons.join('、')}</td>
                            <td>{s.sys}</td>
                            <td className="is-num">{s.rows.length} 行</td>
                            <td>{s.quoteId ? <Tag tone="green">已生成 {s.quoteId}</Tag> : <Tag tone="gray">未生成</Tag>}</td>
                            <td>
                              <Op onClick={() => openSvy(detail, s)}>{s.quoteId ? '查看' : '编辑'}</Op>
                              {!s.quoteId && <>
                                <OpSep />
                                <Op gold disabled={quotableRowsOf(s) === 0}
                                  title={quotableRowsOf(s) === 0
                                    ? '该记录没有可计价的工程量行（名称需对上物料库、数量 > 0）'
                                    : `按该记录工程量生成报价草稿（带入 ${quotableRowsOf(s)} 行）`}
                                  onClick={() => genQuote(detail, s)}>生成报价单</Op>
                              </>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
              </div>
            )}

            {dTab === 'rel' && (
              <div style={{ marginTop: 12 }}>
                <div className="nc-sec-title" style={{ marginBottom: 8 }}>报价单</div>
                {relQuotes(detail).length === 0
                  ? <div className="nc-empty-mini">暂无报价单：可在勘察记录行点「生成报价单」由工程量清单生成，或点「去报价」手工创建</div>
                  : (
                    <table className="nc-tbl" style={{ minWidth: 620 }}>
                      <thead><tr><th style={{ width: 160 }}>报价单号</th><th style={{ width: 70 }}>版本</th><th style={{ width: 130 }} className="is-num">金额</th><th style={{ width: 90 }}>状态</th><th style={{ width: 110 }}>日期</th></tr></thead>
                      <tbody>{relQuotes(detail).map((q) => (
                        <tr key={q.id}>
                          <td><EntityLink target="quote-detail" id={q.id} go={go} title="下钻到报价详情">{q.id}</EntityLink></td>
                          <td><Tag tone="blue">{q.ver}</Tag></td>
                          <td className="is-num num">{money ? fmtWan(q.amt) : '—'}</td>
                          <td><Tag tone="orange">{q.status}</Tag></td>
                          <td className="num">{q.date}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  )}
                <div className="nc-sec-title" style={{ margin: '16px 0 8px' }}>
                  关联投标
                  <span className="nc-muted nc-tiny" style={{ marginLeft: 8 }}>投标不进商机阶段，由独立投标模块承载；此处只挂关联</span>
                  <span style={{ float: 'right' }}>
                    <Btn size="sm" kind="primary" onClick={() => {
                      /* 带上商机要素跳投标管理：名称 / 客户 / 预计金额预填，opp 外键使中标结果能回写本商机漏斗 */
                      setPendingBid({ oppId: detail.id, name: detail.name, customer: detail.customer, amt: detail.amt });
                      go('bid');
                    }}>＋ 发起投标</Btn>
                  </span>
                </div>
                {relBids(detail).length === 0
                  ? <div className="nc-empty-mini">暂无关联投标：投标单的 opp 字段指向本商机时自动出现在此处，商机侧只统计数量</div>
                  : (
                    <table className="nc-tbl" style={{ minWidth: 620 }}>
                      <thead><tr><th style={{ width: 160 }}>投标编号</th><th>投标项目</th><th style={{ width: 130 }} className="is-num">投标金额</th><th style={{ width: 90 }}>阶段</th><th style={{ width: 110 }}>开标日</th></tr></thead>
                      <tbody>{relBids(detail).map((b) => (
                        <tr key={b.id}>
                          <td><EntityLink target="bid" id={b.id} go={go} title="下钻到投标详情">{b.id}</EntityLink></td>
                          <td>{b.name}</td>
                          <td className="is-num num">{money ? fmtWan(b.amt) : '—'}</td>
                          <td><Tag tone={isBidClosed(b) ? (b.stage === '中标' ? 'green' : 'red') : 'blue'}>{b.stage}</Tag></td>
                          <td className="num">{b.openDate}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  )}
              </div>
            )}

            {dTab === 'hist' && (
              <div style={{ marginTop: 12 }}>
                <table className="nc-tbl" style={{ minWidth: 620 }}>
                  <thead><tr><th style={{ width: 110 }}>时间</th><th style={{ width: 90 }}>原阶段</th><th style={{ width: 90 }}>新阶段</th><th style={{ width: 90 }}>操作人</th><th>说明</th></tr></thead>
                  <tbody>{histOf(detail).map((h, i) => (
                    <tr key={i}>
                      <td className="num">{h.at}</td>
                      <td>{h.from}</td>
                      <td><Tag tone={oppStageTone(idxOf(h.to))}>{h.to}</Tag></td>
                      <td>{h.by}</td>
                      <td className="nc-cell-sub">{h.note || '—'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}

            {dTab === 'tl' && (
              <div style={{ marginTop: 12 }}>
                <Timeline items={[
                  { date: detail.signDate || TODAY, tone: 'gold', text: <>预计签约日 {detail.signDate || '待定'}</> },
                  { date: '2026-09-15', tone: 'ok', text: <>客户确认预算口径 · 报价第 {detail.quotes} 版（{detail.owner}）</> },
                  { date: '2026-09-05', tone: 'gray', text: <>完成现场勘察（{detail.owner}）· 工程量清单已登记</> },
                  { date: '2026-09-02', tone: 'gray', text: <>创建商机 · 初始阶段「{stages[0]}」（来源：{detail.customer}）</> },
                ]} />
              </div>
            )}
          </>
        )}
      </Drawer>

      {/* ============ 新建商机（L0 最少必填 / L1 选填） ============ */}
      <Drawer open={addOpen} width={840} title="新建商机 · L0 最少必填" onClose={() => setAddOpen(false)}
        foot={<>
          <Btn onClick={() => setAddOpen(false)}>取消</Btn>
          <Btn onClick={() => {
            if (!nName.trim()) { toast('商机名称必填', 'err'); return; }
            setAddOpen(false); toast(`草稿已保存（未提交 · 可在列表「${stages[0]}」中继续编辑）`);
          }}>保存草稿</Btn>
          <Btn kind="primary" onClick={() => {
            if (!nName.trim()) { toast('商机名称必填（L0 最少必填）', 'err'); return; }
            if (!nCust) { toast('所属客户必填（L0 最少必填）', 'err'); return; }
            setAddOpen(false); setNName(''); setNNote('');
            toast(`商机已创建（编号 SJ0005xx · 初始阶段「${stages[0]}」· 权重 ${stageW(stages[0])}% · 来源 ${nSrc}）`);
          }}>创建商机</Btn>
        </>}>
        {dupHit.length > 0 && (
          <div className="nc-warnbox is-warn">
            <b><Ico n="warning" size={16} /> 创建前请确认：</b>
            <div>
              检测到 {dupHit.length} 条相似商机（重复<b>不拦截</b>，仅黄字提醒）：
              {dupHit.slice(0, 3).map((o) => `${o.id} ${o.name}（${o.customer} · ${o.owner}）`).join('；')}
              。如为同一项目请直接跟进原商机，避免重复跟进与客户侧多头对接。
            </div>
          </div>
        )}
        <div className="nc-form-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
          <Field label="商机名称" req span={2} note="≤100 字，如：××医院住院楼消防改造工程">
            <input className="nc-input" value={nName} onChange={(e) => setNName(e.target.value)} placeholder="如 昆明万达广场消防设施改造工程" />
          </Field>
          <Field label="客户" req span={2} note="档案强校验；弹层新建后自动回填并选中">
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <CustomerPicker value={nCust} onChange={setNCust} emit="name" options={custOpts} />
              </div>
              <Btn size="sm" onClick={() => setCustNew(true)}>＋ 新建客户</Btn>
            </div>
          </Field>
          <Field label="商机来源" req>
            <select className="nc-input" value={nSrc} onChange={(e) => setNSrc(e.target.value)}>
              {OPP_SRC.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="业务类型" req>
            <select className="nc-input" value={nTypeF} onChange={(e) => setNTypeF(e.target.value)}>
              {['新建', '改造', '维护保养', '检测'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="归属人" req note="默认当前登录人">
            <select className="nc-input" value={nOwner} onChange={(e) => setNOwner(e.target.value)}>
              {['蓝峰', '李思敏', '王志海', '赵薇', '刘宇', '李慧敏'].map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="业务域">
            <select className="nc-input" value={nBiz} onChange={(e) => setNBiz(e.target.value)}>
              {Object.entries(BIZ_NAME).map(([k, v]) => <option key={k} value={k}>{v} {k}</option>)}
            </select>
          </Field>
        </div>

        <div className="nc-sec-title" style={{ margin: '14px 0 8px', cursor: 'pointer' }} onClick={() => setL1Open((v) => !v)} {...pressProps(() => setL1Open((v) => !v))}>
          更多信息（L1 选填）{l1Open ? '▴' : '▾'}
        </div>
        {l1Open && (
          <div className="nc-form-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
            <Field label="预计金额（元）" note="含税；可先留空，报价后回填">
              <input className="nc-input num" value={nAmt} onChange={(e) => setNAmt(e.target.value)} placeholder="如 3200000" />
            </Field>
            <Field label="预计签约日" note="≤30 天标橙 · 已过标红">
              <input className="nc-input num" type="date" value={nSign} onChange={(e) => setNSign(e.target.value)} />
            </Field>
            <Field label="备注" span={2} note={`${nNote.length}/500 · ≤500 字`}>
              <textarea className="nc-input" rows={3} maxLength={500} value={nNote} onChange={(e) => setNNote(e.target.value)} placeholder="客户诉求、决策链、竞争态势…" />
            </Field>
          </div>
        )}
        <Banner tone="info">商机编号自动生成 <Code>SJ</Code> + 6 位流水；初始阶段「{stages[0]}」（权重 {stageW(stages[0])}%）；L1 信息可在后续跟进中补齐。</Banner>
      </Drawer>

      {/* ============ 弹层新建客户（回填并选中） ============ */}
      <Modal open={custNew} width={640} title="新建客户（弹层）" onClose={() => setCustNew(false)}
        foot={<><Btn onClick={() => setCustNew(false)}>取消</Btn>
          <Btn kind="primary" onClick={doCreateCust}>保存并选中</Btn></>}>
        <div className="nc-warnbox is-info">客户档案强校验：名称不可与已有档案重复；弹层新建后<b>自动回填并选中</b>，无需返回客户管理页。</div>
        <div className="nc-form-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
          <Field label="客户名称" req span={2} err={cErr.name} warn={!!cDup}
            note={cDup || '唯一性 + 相似度 ≥80% 检测'}>
            <input className="nc-input" value={custName} onChange={(e) => onCustName(e.target.value)} placeholder="如 昆明万达广场商业管理有限公司" />
          </Field>
          <Field label="联系人姓名" req err={cErr.contact} note="≤20 字">
            <input className="nc-input" value={custContact} onChange={(e) => setCustContact(e.target.value)} placeholder="如 王志豪" />
          </Field>
          <Field label="联系电话" req err={cErr.phone} note="手机号或座机 · 重复触发撞单">
            <input className="nc-input" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} placeholder="如 13888001101" />
          </Field>
          <Field label="区域" req err={cErr.region} note="默认：昆明">
            <select className="nc-select" value={custRegion} onChange={(e) => setCustRegion(e.target.value)}>
              {CUST_REGIONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="客户分级" req note="默认 C；可改（留痕）">
            <select className="nc-select" value={custGrade} onChange={(e) => setCustGrade(e.target.value)}>
              {CUST_GRADES.map((g) => <option key={g} value={g}>{CUST_GRADE_LABEL[g]}</option>)}
            </select>
          </Field>
          <Field label="客户来源" req note="默认：自主开发">
            <select className="nc-select" value={custSource} onChange={(e) => setCustSource(e.target.value)}>
              {CUST_SOURCES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="客户状态" req note="新建仅可选潜在 / 意向">
            <select className="nc-select" value={custStatus} onChange={(e) => setCustStatus(e.target.value)}>
              {CUST_STATUS_NEW.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="行业标签" span={2} note="用于业绩与合同检索">
            <select className="nc-select" value={custIndustry} onChange={(e) => setCustIndustry(e.target.value)}>
              {CUST_INDUSTRIES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
        </div>
        <div className="nc-cell-sub" style={{ marginTop: 8 }}>必填项与「客户管理 → 新增客户」一致（客户名称 / 联系人姓名 / 联系电话 / 区域 / 客户分级 / 客户来源 / 客户状态）；备注与决策链联系人可在客户详情中继续补充。</div>
      </Modal>

      {/* ============ 推进 / 回退阶段 ============ */}
      <Modal open={!!advOpen} width={480} title={`推进阶段：${advOpen?.stage ?? ''}`} onClose={() => setAdvOpen(null)}
        foot={<><Btn onClick={() => setAdvOpen(null)}>取消</Btn><Btn kind="primary" onClick={doAdv}>确认推进</Btn></>}>
        <div className="nc-form-grid">
          <Field label="新阶段" req>
            <select className="nc-select" value={advStage} onChange={(e) => setAdvStage(e.target.value)}>
              {stages.map((s) => { const st = tpl.find((x) => x.name === s); const bidLocked = st?.requireBid && advOpen && getOppBids(advOpen.id).length === 0; return <option key={s} value={s}>{s}{bidLocked ? '（须先发起投标）' : ''}</option>; })}
            </select>
          </Field>
          <Field label="阶段权重" note="按阶段自动折算加权金额">{stageW(advStage)}%</Field>
          <Field label="阶段说明" req span={2} note="必填 · 写入阶段历史">
            <textarea className="nc-input" rows={3} value={advNote} onChange={(e) => setAdvNote(e.target.value)} placeholder="如：发包方立项批复，金额确认 ¥300,000" />
          </Field>
        </div>
      </Modal>

      {/* ============ 赢单 / 输单（终态） ============ */}
      <Modal open={!!loseOpen} width={480} title={`登记结果 · ${loseOpen?.name || ''}`} onClose={() => setLoseOpen(null)}
        foot={<>
          <Btn onClick={() => setLoseOpen(null)}>取消</Btn>
          <Btn kind={loseStatus === '赢单' ? 'primary' : 'danger'} onClick={() => {
            if (!loseOpen) return;
            if (loseStatus === '输单' && !loseReason) { toast('输单原因必填（用于丢标复盘）', 'err'); return; }
            closeOpp(loseOpen.id, loseStatus, { reason: loseStatus === '输单' ? loseReason : undefined, competitor: loseCompetitor || undefined, by: loseOpen.owner });
            setLoseOpen(null);
            toast(loseStatus === '赢单'
              ? '已登记赢单 · 可一键转化为合同 / 项目'
              : `已登记输单（原因：${loseReason}）· 停止跟进提醒，管理员可重开并留痕`);
          }}>确认登记</Btn>
        </>}>
        <div className="nc-modal-cap"><Ico n="warning" size={16} /> 赢单 / 输单为终态：停止跟进提醒并退出加权金额测算。输单须填原因，进入丢标复盘。</div>
        <div style={{ marginTop: 12 }}>
          <Field label="结果" req span={2}>
            <div className="nc-seg">
              {(['赢单', '输单'] as const).map((s) => (
                <button key={s} type="button" className={`nc-seg-btn${loseStatus === s ? ' is-on' : ''}`}
                  onClick={() => setLoseStatus(s)}>{s}</button>
              ))}
            </div>
          </Field>
          {loseStatus === '输单' && (
            <>
              <Field label="输单原因" req note="必填 · 进入丢标复盘看板">
                <select className="nc-select" value={loseReason} onChange={(e) => setLoseReason(e.target.value)}>
                  <option value="">请选择原因</option>
                  {LOSE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="竞争对手" note="选填">
                <input className="nc-input" value={loseCompetitor} onChange={(e) => setLoseCompetitor(e.target.value)} placeholder="如 本地××消防工程公司" />
              </Field>
            </>
          )}
          {loseStatus === '赢单' && (
            <Field label="中标说明" span={2} note="选填 · 记录中标价依据与签约要点">
              <textarea className="nc-textarea" placeholder="如：以报价 V2 ¥320 万中标，甲方要求 10 月 15 日前完成合同签署…" />
            </Field>
          )}
        </div>
      </Modal>

      {/* ============ 重开（管理员 · 已转化不可重开） ============ */}
      <Modal open={!!reopenOpen} width={480} title={`重开商机 · ${reopenOpen?.id || ''}`} onClose={() => setReopenOpen(null)}
        foot={<><Btn onClick={() => setReopenOpen(null)}>取消</Btn>
          <Btn kind="primary" onClick={() => {
            if (!reopenOpen) return;
            if (isWonDeal(reopenOpen.id)) { toast('该商机下游已生成合同 / 项目，重开会造成来源冲突，不可重开', 'err'); return; }
            reopenOpp(reopenOpen.id);
            setReopenOpen(null);
            toast(`商机已重开至「${reopenOpen.stage}」· 重开记录已留痕`);
          }}>确认重开</Btn></>}>
        {reopenOpen && isWonDeal(reopenOpen.id)
          ? <div className="nc-warnbox is-danger"><Ico n="ban" size={16} /> 该商机下游已生成合同 / 项目，重开会造成来源冲突，不可重开。</div>
          : <div className="nc-warnbox is-warn">重开后商机状态恢复为「跟进中」（阶段保持当前所处阶段），恢复跟进提醒并重新计入加权金额；重开记录写入阶段历史。</div>}
      </Modal>

      {/* ============ 转合同（商机直签 · 不经过报价 / 投标） ============ */}
      <Modal open={!!cvtHtOpen} width={480} title={`转合同 · ${cvtHtOpen?.id || ''}`} onClose={() => setCvtHtOpen(null)}
        foot={<><Btn onClick={() => setCvtHtOpen(null)}>取消</Btn>
          <Btn kind="primary" onClick={() => {
            const o = cvtHtOpen;
            if (!o) return;
            if (!isOppClosed(o)) closeOpp(o.id, '赢单', { by: o.owner });
            setPendingContract({ oppId: o.id, customer: o.customer, name: o.name, amt: o.amt || 0 });
            setCvtHtOpen(null);
            go('contract-new');
          }}>去补全合同草稿</Btn></>}>
        {cvtHtOpen && (
          <>
            <Banner tone="info">适用于<b>金额明确、不需要单独出报价</b>的单子（维保 / 检测 / 小改造）。合同要素由商机带入，编号自动生成；签署后可在合同详情创建项目。</Banner>
            <div className="nc-form-grid">
              <Field label="合同要素" span={2} note="由商机带入，进入合同新建页后可修改">
                <div className="nc-ctx-grid">
                  <div className="nc-ctx"><span>合同名称</span><b>{cvtHtOpen.name} 合同</b></div>
                  <div className="nc-ctx"><span>客户</span><b>{cvtHtOpen.customer}</b></div>
                  <div className="nc-ctx"><span>合同金额</span><b className="num">{money ? fmtWan(cvtHtOpen.amt || 0) : '—'}</b></div>
                  <div className="nc-ctx"><span>来源标记</span><b>商机直签（{cvtHtOpen.id}）</b></div>
                </div>
              </Field>
              <Field label="该商机已产出" span={2} note="同一商机可多次转化：分标段分别投标、分批成交都归到同一个商机下">
                <div className="nc-cell-sub num">{outText(cvtHtOpen.id)}</div>
              </Field>
            </div>
          </>
        )}
      </Modal>

      {/* ============ 转项目（例外路径 · 应急抢修无合同先干） ============ */}
      <Modal open={!!cvtXmOpen} width={520} title={`转项目 · ${cvtXmOpen?.id || ''}`} onClose={() => setCvtXmOpen(null)}
        foot={<><Btn onClick={() => setCvtXmOpen(null)}>取消</Btn>
          <Btn kind="primary" onClick={() => {
            const o = cvtXmOpen;
            if (!o) return;
            if (!noContractReason.trim()) { toast('请填写「无合同先施工」的原因，将写入立项留痕', 'err'); return; }
            if (!isOppClosed(o)) closeOpp(o.id, '赢单', { by: o.owner });
            setPendingProject({ oppId: o.id, name: o.name, customer: o.customer, amt: o.amt || 0, noContractReason: noContractReason.trim() });
            setCvtXmOpen(null);
            setNoContractReason('');
            go('project-new');
          }}>去补全立项信息</Btn></>}>
        {cvtXmOpen && (
          <>
            <Banner tone="warn">这是<b>例外路径</b>：项目将以「无合同先施工」建立，合同额记 <b>0</b>，须在 <b>30 日内补签</b>合同并挂接；期间会一直出现在驾驶舱「无合同施工」风险榜，补签后自动出榜。</Banner>
            <div className="nc-form-grid">
              <Field label="项目要素" span={2} note="由商机带入，进入立项页后可修改">
                <div className="nc-ctx-grid">
                  <div className="nc-ctx"><span>项目名称</span><b>{cvtXmOpen.name}</b></div>
                  <div className="nc-ctx"><span>客户</span><b>{cvtXmOpen.customer}</b></div>
                  <div className="nc-ctx"><span>预计合同额</span><b className="num">{money ? fmtWan(cvtXmOpen.amt || 0) : '—'}</b></div>
                  <div className="nc-ctx"><span>项目来源</span><b>应急工程</b></div>
                </div>
              </Field>
              <Field label="无合同先施工原因" req span={2} note="写入立项留痕，供后续复盘与审计">
                <textarea className="nc-input" rows={3} value={noContractReason} onChange={(e) => setNoContractReason(e.target.value)} placeholder="如：客户设备故障停业抢修，要求当日进场，合同走内部审批后补签…" />
              </Field>
              <Field label="项目经理" span={2} note="进入立项页后必填并做资格校验">
                <div className="nc-cell-sub">工程施工类须「建造师证有效 + B 证有效 + 无在建」三要素齐备，否则系统拦截</div>
              </Field>
            </div>
          </>
        )}
      </Modal>

      {/* ============ 去报价 ============ */}
      <Modal open={!!quoteOpen} width={480} title={`创建报价 · ${quoteOpen?.name || ''}`} onClose={() => setQuoteOpen(null)}
        foot={<>
          <Btn onClick={() => setQuoteOpen(null)}>取消</Btn>
          <Btn kind="primary" onClick={() => {
            const o = quoteOpen;
            if (!o) return;
            setPendingOppQuote({ oppId: o.id, name: o.name, customer: o.customer, amt: o.amt || 0 });
            setQuoteOpen(null);
            go('quote-edit');
          }}>去补全报价明细</Btn>
        </>}>
        <Banner tone="info">创建报价将预填客户与商机信息，编号自动生成（<Code>BJ</Code> + 6 位流水），初始状态「草稿」。也可在「勘察记录」中由工程量清单一键生成。</Banner>
        <div className="nc-form-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)', marginTop: 12 }}>
          <Field label="报价名称" req span={2}><input className="nc-input" defaultValue={quoteOpen ? `${quoteOpen.name}报价` : ''} /></Field>
          <Field label="税率口径" req note="含税 9%（建筑业）/ 13% / 6%（服务）">
            <select className="nc-select"><option>含税 9%（建筑业）</option><option>含税 13%</option><option>含税 6%（服务）</option><option>不含税 6%</option><option>不含税 13%</option></select>
          </Field>
          <Field label="区域上浮" note="默认云南 +3%，可一键批量应用">
            <select className="nc-select"><option>不上浮</option><option>云南 +3%</option><option>广西 +3%</option></select>
          </Field>
        </div>
      </Modal>

      {/* ============ 勘察记录（新增 / 只读查看） ============ */}
      <Modal open={!!svyOpen} width={840} title={svyOpen?.s ? `勘察记录 · ${svyOpen.s.id}` : '新增勘察记录'} onClose={() => setSvyOpen(null)}
        foot={svyOpen?.s?.quoteId
          ? <>
            <span className="nc-cell-sub"><Ico n="lock" size={16} /> 已生成报价 {svyOpen.s.quoteId} · 锁定只读（修改请新建一条）</span>
            <Btn onClick={() => setSvyOpen(null)}>关闭</Btn>
            <Btn kind="primary" onClick={() => svyOpen && openSvy(svyOpen.o, null)}>＋ 新建一条勘察</Btn>
          </>
          : <>
            <span className="nc-cell-sub">照片自动加时间 / 定位水印 · 工程量行 ≤100 行 · 保存后在记录行点「生成报价单」</span>
            <Btn onClick={() => setSvyOpen(null)}>取消</Btn>
            <Btn kind="primary" onClick={saveSvy}>保存勘察</Btn>
          </>}>
        {svyOpen && (
          <>
            <div className="nc-form-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
              <Field label="勘察时间" req note="不可晚于当前时间">
                <input className="nc-input num" type="date" value={svyForm.at} disabled={!!svyOpen.s?.quoteId} onChange={(e) => setSvyForm((f) => ({ ...f, at: e.target.value }))} />
              </Field>
              <Field label="系统类别" req>
                <select className="nc-select" value={svyForm.sys} disabled={!!svyOpen.s?.quoteId} onChange={(e) => setSvyForm((f) => ({ ...f, sys: e.target.value }))}>
                  <option value="">请选择</option>{SYS_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="勘察人员" req span={2} note={`已选 ${svyForm.persons.length} / 5 人`}>
                <div className="nc-pick-inline">
                  {['蓝峰', '李思敏', '王志海', '赵薇', '刘宇', '李慧敏', '徐工'].map((p) => (
                    <span key={p} className={`nc-pick-chip${svyForm.persons.includes(p) ? ' is-on' : ''}`} onClick={() => !svyOpen.s?.quoteId && togglePerson(p)} {...pressProps(() => !svyOpen.s?.quoteId && togglePerson(p))}>{p}</span>
                  ))}
                </div>
              </Field>
              <Field label="勘察描述" req span={2} note={`${svyForm.desc.length} 字（10~1000）`}>
                <textarea className="nc-input" rows={3} value={svyForm.desc} disabled={!!svyOpen.s?.quoteId} onChange={(e) => setSvyForm((f) => ({ ...f, desc: e.target.value }))} placeholder="现场情况、既有系统型号、改造难点…" />
              </Field>
              <Field label="现场照片" note="≤9 张 · 自动加时间 / 定位水印">
                <input className="nc-input" type="file" multiple disabled={!!svyOpen.s?.quoteId} />
              </Field>
            </div>

            <div className="nc-sec-title" style={{ margin: '14px 0 8px' }}>工程量清单（≤100 行 · 数量 &gt; 0 · ≤3 位小数）</div>
            {!svyOpen.s?.quoteId && (
              <div className="nc-cell-sub" style={{ marginBottom: 6 }}>支持从 Excel 直接粘贴：选中单元格后 Ctrl+V 可整块铺开（粘贴 1 列 = 填当前列，多列 = 按名称 / 单位 / 数量 / 备注整行铺开）。</div>
            )}
            {badNames.length > 0 && (
              <div className="nc-warnbox is-warn" style={{ marginBottom: 6 }}>
                <b>{badNames.length} 个名称未匹配物料库</b>（如「{badNames[0]}」）：请核对名称，或联系采购在物料主数据中新增后再录入。
              </div>
            )}
            <table className="nc-tbl" style={{ minWidth: 640 }}>
              <thead><tr><th style={{ width: 40 }} className="is-num">#</th><th>名称（≤50）</th><th style={{ width: 80 }}>单位</th><th style={{ width: 110 }} className="is-num">数量</th><th>备注</th><th style={{ width: 70 }}>操作</th></tr></thead>
              <tbody>
                {svyForm.rows.map((r, i) => (
                  <tr key={i}>
                    <td className="is-num">{i + 1}</td>
                    <td onPaste={(e) => onCellPaste(e, i, 0)}>{svyOpen.s?.quoteId
                      ? <span className="nc-combo-val">{r.code && <span className="num">{r.code}</span>}{r.code ? ' ' : ''}{r.n}</span>
                      : <ItemPicker value={r.code} clearLabel="清空" placeholder="请选择物料 / 服务 / 软件 / 套件" onChange={(v) => setRowItem(i, v)} />}</td>
                    <td><input className="nc-input" value={r.u} disabled={!!svyOpen.s?.quoteId} onChange={(e) => setRow(i, 'u', e.target.value)} onPaste={(e) => onCellPaste(e, i, 1)} /></td>
                    <td><input className="nc-input num" value={r.q} disabled={!!svyOpen.s?.quoteId} onChange={(e) => setRow(i, 'q', e.target.value)} onPaste={(e) => onCellPaste(e, i, 2)} /></td>
                    <td><input className="nc-input" value={r.r} disabled={!!svyOpen.s?.quoteId} onChange={(e) => setRow(i, 'r', e.target.value)} onPaste={(e) => onCellPaste(e, i, 3)} /></td>
                    <td><Op danger disabled={!!svyOpen.s?.quoteId || svyForm.rows.length <= 1} onClick={() => setSvyForm((f) => ({ ...f, rows: f.rows.filter((_, ix) => ix !== i) }))}>删除</Op></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!svyOpen.s?.quoteId && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <Btn size="sm" onClick={openPaste}><Ico n="clipboard" size={14} /> 从 Excel 粘贴</Btn>
                <Btn size="sm" onClick={openFill}>批量填列</Btn>
                <Btn size="sm" onClick={openOcr}><Ico n="camera" size={14} /> OCR 识别录入</Btn>
                <Btn size="sm" onClick={openSvyTpl}>从模板库勾选</Btn>
                {svyForm.rows.length < 100 && (
                  <Btn size="sm" onClick={() => setSvyForm((f) => ({ ...f, rows: [...f.rows, { code: '', n: '', u: '个', q: '', r: '' }] }))}>＋ 新增工程量行</Btn>
                )}
              </div>
            )}
          </>
        )}
      </Modal>

      {/* ============ 从模板库勾选工程量项（在勘察弹窗之上叠加 · 内容取物料主数据） ============ */}
      <Modal open={svyTplOpen} size="M" title="从模板库勾选工程量项" onClose={() => setSvyTplOpen(false)}
        foot={<>
          <span className="nc-cell-sub">已选 {svyTplSel.length} 项 · 带出名称/单位/参考单价，数量现场补填</span>
          <Btn onClick={() => setSvyTplOpen(false)}>取消</Btn>
          <Btn kind="primary" disabled={!svyTplSel.length} onClick={addTplRows}>添加到清单</Btn>
        </>}>
        <Banner tone="info">模板库内容取自<b>物料主数据</b>（物料 / 服务 / 软件 / 套件）；可按编码 / 名称 / 规格搜索，或按类型快筛。</Banner>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
          <div className="nc-search" style={{ width: '100%', flex: '1 1 auto' }}>
            <span className="nc-search-ico"><Ico n="search" size={13} /></span>
            <input value={svyTplKw} placeholder="搜索编码 / 名称 / 规格 / 目录" onChange={(e) => { setSvyTplKw(e.target.value); setSvyTplShown(TPL_PAGE); }} />
          </div>
          {svyTplKw && <Btn size="sm" onClick={() => { setSvyTplKw(''); setSvyTplShown(TPL_PAGE); }}>清空</Btn>}
        </div>
        <div className="nc-pick-inline" style={{ margin: '8px 0' }}>
          <button type="button" className={`nc-fchip${svyTplKind === '' ? ' is-on' : ''}`} onClick={() => { setSvyTplKind(''); setSvyTplShown(TPL_PAGE); }}>全部类型</button>
          {tplKinds.map((k) => (
            <button key={k} type="button" className={`nc-fchip${svyTplKind === k ? ' is-on' : ''}`} onClick={() => { setSvyTplKind(k); setSvyTplShown(TPL_PAGE); }}>{k}</button>
          ))}
        </div>
        <table className="nc-tbl" style={{ minWidth: 520 }}>
          <thead><tr>
            <th style={{ width: 40 }}>
              <input type="checkbox" className="nc-check" checked={tplAllOn} disabled={!tplVisible.length}
                ref={(el) => { if (el) el.indeterminate = !tplAllOn && tplVisSel > 0; }}
                onChange={toggleTplAll} aria-label="全选当前显示" title="全选当前显示" />
            </th>
            <th>名称</th><th style={{ width: 60 }}>类型</th><th style={{ width: 70 }}>单位</th><th style={{ width: 110 }} className="is-num">参考单价</th>
          </tr></thead>
          <tbody>
            {tplVisible.map((it) => {
              const on = svyTplSel.includes(it.code);
              return (
                <tr key={it.code} onClick={() => toggleTpl(it.code)} {...pressProps(() => toggleTpl(it.code))} style={{ cursor: 'pointer' }}>
                  <td><input type="checkbox" className="nc-check" checked={on} onChange={() => toggleTpl(it.code)} onClick={(e) => e.stopPropagation()} /></td>
                  <td><span className="num nc-muted">{it.code}</span> {it.name}<span className="nc-muted nc-tiny"> {it.spec}</span></td>
                  <td><Tag tone="gray">{it.ty}</Tag></td>
                  <td>{it.unit}</td>
                  <td className="is-num num">¥{it.price}</td>
                </tr>
              );
            })}
            {!tplMatched.length && (
              <tr><td colSpan={5}><div className="nc-empty-mini">没有匹配的物料：请调整搜索词或类型档</div></td></tr>
            )}
          </tbody>
        </table>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <span className="nc-cell-sub">共 {tplItems.length} 项 · 匹配 <b>{tplMatched.length}</b> 项 · 已显示 {tplVisible.length}</span>
          {tplVisible.length < tplMatched.length && (
            <Btn size="sm" onClick={() => setSvyTplShown((v) => v + TPL_PAGE)}>获取更多（还有 {tplMatched.length - tplVisible.length} 项）</Btn>
          )}
          {tplVisible.length < tplMatched.length && tplVisSel < tplMatched.length && (
            <Btn size="sm" onClick={selTplAllMatched}>全选匹配的 {tplMatched.length} 项</Btn>
          )}
        </div>
      </Modal>

      {/* ============ OCR 识别录入工程量（上传清单照片 → 识别 → 复核带入） ============ */}
      <Modal open={ocrOpen} size="M" title="OCR 识别录入工程量" onClose={() => setOcrOpen(false)}
        foot={<>
          <span className="nc-cell-sub">识别结果按物料主数据匹配名称与单位，低置信度行请人工复核</span>
          <Btn onClick={() => setOcrOpen(false)}>取消</Btn>
          {ocrStage === 'done'
            ? <Btn kind="primary" disabled={!ocrSel.length} onClick={addOcrRows}>带入 {ocrSel.length} 行</Btn>
            : <Btn kind="primary" disabled={ocrStage === 'scanning'} onClick={runOcr}>{ocrStage === 'scanning' ? '识别中…' : '开始识别'}</Btn>}
        </>}>
        {ocrStage === 'idle' && (
          <>
            <Banner tone="info">上传现场手写 / 打印的<b>工程量清单照片</b>，自动识别分项与数量；识别结果按物料主数据匹配名称与单位，复核后带入清单。</Banner>
            <div className="nc-dropzone"><Ico n="paperclip" size={16} /> 点击或拖拽上传工程量清单照片（JPG / PNG · ≤9 张）</div>
            <div className="nc-cell-sub">演示态：点「开始识别」将按示例照片返回 {OCR_DEMO.length} 行识别结果。</div>
          </>
        )}
        {ocrStage === 'scanning' && (
          <div className="nc-empty-mini" style={{ padding: '28px 0' }}><Ico n="search" size={18} /> 正在识别工程量清单…</div>
        )}
        {ocrStage === 'done' && (
          <>
            <div className="nc-sec-title" style={{ marginBottom: 8 }}>识别结果（{ocrHits.length} 行 · 已选 {ocrSel.length}）</div>
            <table className="nc-tbl" style={{ minWidth: 540 }}>
              <thead><tr><th style={{ width: 40 }}></th><th>识别名称</th><th style={{ width: 60 }}>单位</th><th style={{ width: 90 }} className="is-num">识别数量</th><th style={{ width: 110 }}>置信度</th></tr></thead>
              <tbody>
                {ocrHits.map((h) => {
                  const on = ocrSel.includes(h.code);
                  return (
                    <tr key={h.code} onClick={() => toggleOcr(h.code)} {...pressProps(() => toggleOcr(h.code))} style={{ cursor: 'pointer' }}>
                      <td><input type="checkbox" className="nc-check" checked={on} onChange={() => toggleOcr(h.code)} onClick={(e) => e.stopPropagation()} /></td>
                      <td><span className="num nc-muted">{h.it.code}</span> {h.it.name}</td>
                      <td>{h.it.unit}</td>
                      <td className="is-num num">{h.q}</td>
                      <td>{h.conf >= 0.9 ? <Tag tone="green">{Math.round(h.conf * 100)}%</Tag> : <Tag tone="gold">{Math.round(h.conf * 100)}% 待复核</Tag>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        )}
      </Modal>

      {/* ============ 从 Excel 粘贴工程量（粘贴 / 选文件 → 按物料库核对 → 带入） ============ */}
      <Modal open={pasteOpen} size="M" onClose={() => setPasteOpen(false)}
        title={pasteStep === 'pick' ? '从 Excel 粘贴工程量 · 选择内容' : '从 Excel 粘贴工程量 · 核对'}
        foot={pasteStep === 'pick' ? (
          <>
            <Btn onClick={() => setPasteOpen(false)}>取消</Btn>
            <Btn kind="primary" disabled={!pasteText.trim()} onClick={() => acceptPaste(parseDelimited(pasteText))}>
              <Ico n="check" size={16} /> 解析粘贴内容
            </Btn>
          </>
        ) : (
          <>
            <span className="nc-cell-sub">带入后清单 ≤ 100 行</span>
            <Btn onClick={() => setPasteStep('pick')}>返回上一步</Btn>
            <Btn kind="primary" disabled={!pasteOk.length} onClick={addPasteRows}>
              <Ico n="check" size={16} /> 带入 {pasteOk.length} 行
            </Btn>
          </>
        )}>
        {pasteStep === 'pick' && (
          <>
            <Banner tone="info">
              在 Excel 里选中整块（<b>名称 / 单位 / 数量 / 备注</b>）按 <b>Ctrl+C</b> 粘到下面；也可直接选择 <b>.xlsx / .csv</b> 文件。
            </Banner>
            <div className={`nc-dropzone${pasteDrag ? ' is-drag' : ''}`}
              onClick={() => pasteFileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setPasteDrag(true); }}
              onDragLeave={() => setPasteDrag(false)}
              onDrop={(e) => { e.preventDefault(); setPasteDrag(false); const f = e.dataTransfer.files?.[0]; if (f) void onPasteFile(f); }}>
              <Ico n="upload" size={16} /> {pasteBusy ? '正在解析…' : '点击选择文件，或把文件拖到这里'}
              <div className="nc-cell-sub">.xlsx / .xlsm / .csv / .txt · 单文件 ≤ 5MB</div>
              <input ref={pasteFileRef} type="file" accept=".xlsx,.xlsm,.csv,.txt" style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void onPasteFile(f); e.target.value = ''; }} />
            </div>
            <Field label="或粘贴表格内容" span={2}>
              <textarea className="nc-input" rows={5} value={pasteText}
                placeholder={'名称\t单位\t数量\t备注\n感烟探测器\t只\t860\t含底座'}
                onChange={(e) => setPasteText(e.target.value)} />
            </Field>
            {pasteErr && <Banner tone="danger">{pasteErr}</Banner>}
            <div className="nc-cell-sub">列序固定为 名称 → 单位 → 数量 → 备注；首行若是表头会自动跳过。</div>
          </>
        )}
        {pasteStep === 'check' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Tag tone="green">匹配 {pasteOk.length} 行</Tag>
              {pasteMiss.length > 0 && <Tag tone="red">未匹配 {pasteMiss.length} 行</Tag>}
              <span className="nc-cell-sub">按名称 / 编码与物料库比对（忽略空格与括号）</span>
            </div>
            {pasteMiss.length > 0 && (
              <div className="nc-warnbox is-warn" style={{ marginBottom: 8 }}>
                <b>{pasteMiss.length} 行名称在物料库中不存在，不会带入。</b>请核对名称，或联系采购在物料主数据中新增后再录入。
              </div>
            )}
            <table className="nc-tbl" style={{ minWidth: 560 }}>
              <thead><tr><th style={{ width: 34 }} className="is-num">#</th><th>名称</th><th style={{ width: 60 }}>单位</th><th style={{ width: 80 }} className="is-num">数量</th><th style={{ width: 90 }}>匹配</th></tr></thead>
              <tbody>
                {pasteRows.map((r, i) => (
                  <tr key={i} className={r.item ? '' : 'is-warn'}>
                    <td className="is-num">{i + 1}</td>
                    <td>{r.item ? <><span className="num nc-muted">{r.item.code}</span> {r.item.name}</> : r.name}</td>
                    <td>{r.unit}</td>
                    <td className="is-num num">{r.qty}</td>
                    <td>{r.item ? <Tag tone="green">已匹配</Tag> : <Tag tone="red">未匹配</Tag>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="nc-pick-inline" style={{ marginTop: 10 }}>
              <button type="button" className={`nc-fchip${pasteMode === 'append' ? ' is-on' : ''}`} onClick={() => setPasteMode('append')}>追加到清单</button>
              <button type="button" className={`nc-fchip${pasteMode === 'replace' ? ' is-on' : ''}`} onClick={() => setPasteMode('replace')}>替换现有清单</button>
            </div>
          </>
        )}
      </Modal>

      {/* ============ 批量填列（统一值 / 按倍数 / 粘贴一列） ============ */}
      <Modal open={fillOpen} width={480} title="批量填列" onClose={() => setFillOpen(false)}
        foot={<>
          <span className="nc-cell-sub">作用于全部 {svyForm.rows.length} 行</span>
          <Btn onClick={() => setFillOpen(false)}>取消</Btn>
          <Btn kind="primary" onClick={applyFill}>应用</Btn>
        </>}>
        <Banner tone="info">批量修改同一列：统一填一个值、按倍数调整，或从 Excel 粘贴一列（按行顺序对应）。</Banner>
        <Field label="目标列" span={2}>
          <div className="nc-pick-inline">
            {FILL_COLS.map((c) => (
              <button key={c.key} type="button" className={`nc-fchip${fillCol === c.key ? ' is-on' : ''}`} onClick={() => setFillCol(c.key)}>{c.label}</button>
            ))}
          </div>
        </Field>
        <Field label="方式" span={2}>
          <div className="nc-pick-inline">
            <button type="button" className={`nc-fchip${fillMode === 'value' ? ' is-on' : ''}`} onClick={() => setFillMode('value')}>统一值</button>
            <button type="button" className={`nc-fchip${fillMode === 'scale' ? ' is-on' : ''}`} onClick={() => setFillMode('scale')}>按倍数</button>
            <button type="button" className={`nc-fchip${fillMode === 'paste' ? ' is-on' : ''}`} onClick={() => setFillMode('paste')}>粘贴一列</button>
          </div>
        </Field>
        {fillMode === 'paste' ? (
          <Field label="粘贴一列（每行一个值）" span={2}>
            <textarea className="nc-input" rows={4} value={fillText}
              placeholder="在 Excel 里选中该列，Ctrl+C 后粘到这里"
              onChange={(e) => setFillText(e.target.value)} />
          </Field>
        ) : (
          <Field label={fillMode === 'value' ? '统一设置为' : '调整倍数'} span={2}
            note={fillMode === 'scale' ? '仅对已有数值生效，如 1.2 = 上浮 20%' : undefined}>
            <input className="nc-input num" value={fillVal} onChange={(e) => setFillVal(e.target.value)}
              placeholder={fillMode === 'value' ? '如 10' : '如 1.2'} />
          </Field>
        )}
      </Modal>

      {/* ============ 统一导出弹窗 ============ */}
      <ExportDialog {...exportApi.dialogProps} />
    </>
  );
}

/* ============ 在谈项目档案：决策链 / 竞争 / 优势 / 下一步（按行业派生） ============ */
const CHAIN_BY_IND: Record<string, string> = {
  医疗: '后勤处 → 分管副院长 → 院长办公会',
  商业: '工程部 → 区域运营总监 → 集团采购中心',
  教育: '后勤基建处 → 分管副校长 → 校长办公会',
  工业: '安全环保部 → 生产副总 → 总经理办公会',
  政府: '使用单位 → 主管机关 → 公共资源交易中心',
  住宅: '项目部 → 成本部 → 区域总',
};
const chainText = (o: O) => CHAIN_BY_IND[o.industry] || '使用部门 → 分管领导 → 决策会';
const compText = (o: O) => (o.amt >= 3000000
  ? '本地 2 家同类企业 + 1 家省外一级资质企业（价格战）'
  : '本地 2 家（无壹级消防专包资质）');
const advText = (o: O) => `贰级消防专包 + ${o.industry}同类业绩 ${2 + (o.quotes || 0)} 例 · 本地化服务响应 ≤4 小时`;
/** 下一步动作：按默认阶段模板给出业务动作（自定义阶段回落通用文案） */
const NEXT_BY_STAGE: Record<string, string> = {
  意向: '电话触达 + 需求摸底，确认预算来源与决策人',
  方案报价: '现场勘察 + 技术交流，输出工程量清单与方案报价',
  投标: '领取招标文件 + 配齐证书做标书，跟进开标结果',
  签约: '合同条款评审 + 电子签，推动签约落单',
};
const nextText = (o: O) => NEXT_BY_STAGE[o.stage] || '确认下一步跟进动作';

function daysUntil(d: string) {
  const t = new Date(`${d}T00:00:00`).getTime();
  const now = new Date('2026-09-20T00:00:00').getTime();
  return Math.round((t - now) / 86400000);
}
