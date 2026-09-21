// 项目经营中心（详情）—— 版式与交互复刻 项目详情.html
// 结构：① 头部+概况合并一卡 ② 盈利 12 指标+双口径+计划vs实际 ③ 项目进程 | 风险聚合 ④ 9 Tab
// 双口径：① 成本（权责）= CG+CB+PF（含审批中）；② 现金（收付）= 净额（审批中不计）
// 硬规则：成本更正不可物理删除（负数追加）· 验收→结项须资料完整度 · 预收 >30 天归并
import React, { useMemo, useState } from 'react';
import {
  Banner, Btn, Card, EntityLink, KvGrid, Modal, Money, Op, OpSep, PageHead, Progress, Tabs,
  Tag, Timeline, useToast, Code, ConfirmModal, pressProps,} from '../components/ui';
import { CUSTOMERS, PROJECTS, OPPS, QUOTES, CONTRACTS, fmt, fmtWan, TODAY } from '../components/data';
import { getFocus, setFocus } from '../components/store';
import { Ico } from '../components/icons';

/* G3：原 const P = PROJECTS[0] 硬编码索引 0 —— 从任何入口进入都只看 XM000123。
   现改为组件内按聚焦 ID 解析（以 nav 为依赖重算），保证「客户 / 合同 / 报价 → 项目」层层下钻时定位正确。
   依赖 P 的派生常量（REV / COLL_PCT）随之移入组件。 */

/** 根据项目反查溯源链（商机 → 报价 → 合同） */
function traceOf(p: typeof PROJECTS[number]) {
  const opp = OPPS.find((o) => o.customerId === p.customerId && o.stage === '商务谈判');
  const quote = QUOTES.find((q) => q.customerId === p.customerId && q.status === '已转化');
  const contract = CONTRACTS.find((c) => c.project === p.id);
  return { opp, quote, contract };
}

/* ============ 经营基线（同源派生）============ */
// 原为「与项目无关的固定演示口径」写死常量：换项目后成本 / 现金流 / 完成度一律不刷新，
// 且与 data.ts 的 PROJECTS.cost、收支明细互相矛盾。现全部改为从本页台账派生，保证可溯源。
// 说明：CHG_PENDING / CASH_IN / CASH_OUT 依赖下方 CHANGES / PAY_ROWS，故定义在其后（见「经营基线派生」）。

/* 生命周期轴（① 头部卡） */
const LIFE = [
  { n: '报价', st: 'done' }, { n: '签约', st: 'done' }, { n: '履约（施工中）', st: 'cur' },
  { n: '竣工验收', st: '' }, { n: '结算中', st: '' }, { n: '质保期', st: '' }, { n: '结项', st: '' },
];

/* A 里程碑轴（③ 项目进程） */
const MILE_AXIS = [
  { name: '进场准备', date: '2026-09-20', st: 'done' },
  { name: '进场施工', date: '2026-09-22', st: 'done' },
  { name: '系统联调', date: '进行中 72%', st: 'cur' },
  { name: '竣工验收', date: '预计 2027-02-28', st: '' },
  { name: '结算中', date: '—', st: '' },
  { name: '质保期', date: '—', st: '' },
];

/* B 商务状态轴（点击过滤关联合同 Tab） */
const BIZ_AXIS = [
  { n: '审批中', c: 4, tone: 'blue' },
  { n: '已签约', c: 0, tone: '' },
  { n: '履约中', c: 3, tone: 'green' },
  { n: '结算中', c: 0, tone: '' },
  { n: '已结项', c: 0, tone: '' },
];

/* 目标成本子表（计划口径 · 行内编辑留痕） */
const PLAN_ROWS = [
  { type: '材料费', amt: 1320000, note: '镀锌钢管 / 报警设备 / 喷淋头' },
  { type: '分包费', amt: 560000, note: '安装劳务分包' },
  { type: '人工费', amt: 210000, note: '班组工资' },
  { type: '机械费', amt: 90000, note: '吊装 / 台班' },
  { type: '管理费', amt: 50000, note: '现场管理' },
  { type: '检测费', amt: 30000, note: '第三方检测' },
];
/** 基线合计（XM000123 口径）· 仅作缩放基准，页面展示一律用组件内派生的 PLAN_SUM */
const PLAN_BASE = PLAN_ROWS.reduce((s, r) => s + r.amt, 0); // 2,260,000

/* 成本流水（CG 成本归类 | CB 登记 | PF 无合同付款） */
type CostRow = { id: string; src: 'CG' | 'CB' | 'PF'; type: string; amt: number; date: string; note: string; st?: string };
const COST_ROWS: CostRow[] = [
  { id: 'CG20260901-0003', src: 'CG', type: '材料费', amt: 1320000, date: '2026-08-12', note: '消防设备采购合同' },
  { id: 'CG20260902-0005', src: 'CG', type: '分包费', amt: 560000, date: '2026-08-20', note: '安装劳务分包合同' },
  { id: 'CB20260903-0002', src: 'CB', type: '人工费', amt: 210000, date: '2026-09-02', note: '8 月班组工资' },
  { id: 'CB20260906-0003', src: 'CB', type: '管理费', amt: 62000, date: '2026-09-06', note: '现场管理杂费' },
  { id: 'PF20260905-0004', src: 'PF', type: '其他', amt: 180000, date: '2026-09-05', note: '无合同付款 · 应急采购风机' },
  { id: 'PF000082', src: 'PF', type: '材料费', amt: 80000, date: '2026-09-19', note: '无合同付款 · 应急辅材', st: 'approving' },
];
/** 基线合计 · 仅作缩放基准，页面展示一律用组件内派生的 COST_SUM */
const COST_BASE = COST_ROWS.reduce((s, r) => s + r.amt, 0); // 2,412,000
const COST9 = ['材料费', '分包费', '人工费', '机械费', '管理费', '设计费', '检测费', '税费', '其他'];

/* 收支明细 */
type PayRow = { id: string; kind: string; contract: string; amt: number; use: string; st: string; date: string; hc?: string };
const PAY_ROWS: PayRow[] = [
  { id: 'SK20260912-001', kind: '收入', contract: 'HT20260912-0009', amt: 984000, use: '期1 · 预付款（30%）', st: 'paid', date: '2026-09-12' },
  { id: 'SK20260918-002', kind: '收入', contract: 'HT20260912-0009', amt: 518000, use: '期2 · 进度款（部分）', st: 'paid', date: '2026-09-18' },
  { id: 'QK20260901-003', kind: '收入', contract: 'HT20260912-0009', amt: 958000, use: '期2 · 尾款（到期 2026-09-01）', st: 'overdue', date: '2026-09-01' },
  { id: 'PF20260805-0002', kind: '采购付款', contract: 'CG20260901-0003', amt: 573000, use: '设备预付款', st: 'paid', date: '2026-08-05' },
  { id: 'PF20260905-0004', kind: '无合同付款', contract: '—（项目级）', amt: 180000, use: '应急采购风机', st: 'paid', date: '2026-09-05' },
  { id: 'PF20260908-0006', kind: '采购付款', contract: 'CG20260901-0003', amt: 250000, use: '设备进度款', st: 'flushed', date: '2026-09-08', hc: 'HC000047' },
  { id: 'PF20260910-0007', kind: '采购付款', contract: 'CG20260901-0003', amt: 45000, use: '运杂费', st: 'flushed', date: '2026-09-10', hc: 'HC20260916-0001' },
  { id: 'HC000047', kind: '红字冲销单', contract: '冲抵 PF20260908-0006', amt: -250000, use: '红字冲销 · 发票抬头错误（财务 · 王会计）', st: 'hc', date: '2026-09-15' },
  { id: 'HC20260916-0001', kind: '红字冲销单', contract: '冲抵 PF20260910-0007', amt: -45000, use: '红字冲销 · 重复提交（财务 · 王会计）', st: 'hc', date: '2026-09-16' },
  { id: 'PF20260918-0009', kind: '采购付款', contract: 'CG20260901-0003', amt: 80000, use: '辅材款', st: 'approving', date: '2026-09-18' },
  { id: 'PF000082', kind: '无合同付款', contract: '—（项目级）', amt: 80000, use: '应急辅材', st: 'approving', date: '2026-09-19' },
];
const PAY_FILTERS = ['全部', '收入', '采购付款', '无合同付款', '红字冲销单'];
const SUM_IN = PAY_ROWS.filter((r) => r.kind === '收入' && r.st === 'paid').reduce((s, r) => s + r.amt, 0);
const SUM_OUT = PAY_ROWS.filter((r) => r.kind !== '收入' && r.st === 'paid').reduce((s, r) => s + r.amt, 0);

/* 变更 */
const CHANGES = [
  { id: 'BG20260912-0009', title: '机房气体灭火系统增补', amt: 80000, st: '商务审批中', flowIdx: 2, by: '蓝峰', date: '2026-09-12', contract: 'HT20260912-0009' },
  { id: 'BG20260904-0004', title: '工程量签证（管道增加 68 米）', amt: 32000, st: '已生效', flowIdx: 4, by: '张工', date: '2026-09-04', contract: 'HT20260912-0009' },
];
const FLOW = ['发起', 'PM 审核', '商务审批', '客户确认', '生效'];

/* ---------- 经营基线派生（同源取代原写死常量） ---------- */
/** 审批中变更金额 —— 来源：变更台账 CHANGES（不计现金，计入权责与收入口径） */
const CHG_PENDING = CHANGES.filter((c) => c.st === '商务审批中').reduce((s, c) => s + c.amt, 0);
/** 实收净额 —— 来源：收支明细实收合计（红字冲销已对冲） */
const CASH_IN = SUM_IN;
/** 实付净额 —— 来源：收支明细实付合计（审批中不计） */
const CASH_OUT = SUM_OUT;
const NET_IN = CASH_IN - CASH_OUT;

/* 审批待办 */
const APPROVALS = [
  { id: 'BG20260912-0009', type: '变更', desc: '机房气体灭火系统增补 +¥8.00 万 · 商务审批' },
  { id: 'PF20260918-0009', type: '付款', desc: '辅材款 ¥8.00 万 · CG20260901-0003' },
  { id: 'PF000082', type: '付款', desc: '材料费 ¥8.00 万 · 无合同付款' },
];

/* 关联合同（销售 / 采购 双分组）· 演示数据以首条项目（XM000123）为准 */
const SALE_CT = [
  {
    code: 'HT20260912-0009', name: '昆明万达广场消防改造工程合同', st: '履约中', tone: 'blue' as const,
    badge: ' 工期倒计时 193 天', amt: 3280000,
    payplan: [
      { n: '期1 · 预付款', amt: 984000, st: '已收', d: '2026-09-12' },
      { n: '期2 · 进度款', amt: 1476000, st: '部分收款 ¥51.80 万', d: '2026-09-01' },
      { n: '期3 · 竣工结算款', amt: 820000, st: '未到期', d: '2027-03-31' },
    ],
  },
  { code: 'HT20260918-0012', name: '机房气体灭火系统增补合同', st: '审批中', tone: 'orange' as const, amt: 80000 },
];
const BUY_CT = [
  { code: 'CG20260901-0003', name: '消防设备采购合同 · 云南××消防设备有限公司', st: '履约中', tone: 'blue' as const, amt: 1320000, warn: 'PF20260908-0006 / PF20260910-0007 已红字冲销 · 重付在审批' },
  { code: 'CG20260902-0005', name: '安装劳务分包合同 · 昆明××建筑劳务有限公司', st: '履约中', tone: 'blue' as const, amt: 560000 },
];

/* 项目成员 */
const MEMBERS = [
  { name: '蓝峰', role: '项目负责人', tone: 'blue' as const, phone: '138****1101', duty: '项目总负责 · 里程碑确认 · 验收发起', join: '2026-09-20', st: '在职' },
  { name: '张工', role: '项目经理', tone: 'blue' as const, phone: '138****8801', duty: '现场管理 · 进度质量 · 验收发起', join: '2026-09-20', st: '在职' },
  { name: '李商务', role: '商务经理', tone: 'orange' as const, phone: '139****2202', duty: '合同 / 变更 / 回款催收', join: '2026-09-20', st: '在职' },
  { name: '王会计', role: '财务专员', tone: 'green' as const, phone: '137****3303', duty: '收款确认 / 红字冲销 / 付款审批', join: '2026-09-20', st: '在职' },
  { name: '陈工', role: '专职安全员', tone: 'red' as const, phone: '136****4404', duty: '安全交底 · 隐患排查闭环', join: '2026-09-20', st: '在职' },
];

/* 附件分组（按里程碑归组） */
const ATTACH = [
  { mile: 'M1 进场准备（2026-09-20）', req: ['施工方案报审', '开工令'], files: [
    { name: '施工方案报审表.pdf', size: '2.1MB', by: '陈工', date: '2026-09-18' },
    { name: '开工令.pdf', size: '0.8MB', by: '蓝峰', date: '2026-09-20' }] },
  { mile: 'M2 进场施工（2026-09-22）', req: ['进场报审表'], files: [
    { name: '进场报审表.pdf', size: '1.2MB', by: '陈工', date: '2026-09-22' },
    { name: '进场人员名单.xlsx', size: '0.3MB', by: '陈工', date: '2026-09-22' }] },
  { mile: 'M3 管线安装（2026-11-30）', req: ['隐蔽工程验收记录', '竣工验收消防查验记录', '影像资料'], files: [] },
  { mile: 'M4 系统联调（进行中）', req: ['联调报告', '竣工验收消防查验记录', '影像资料', '签字件'], files: [] },
  { mile: 'M5 竣工验收（预计 2027-02-28）', req: ['竣工资料', '竣工验收消防查验记录', '影像资料', '签字件'], files: [] },
  { mile: '项目级（合同 / 立项 / 其他）', req: [], files: [
    { name: '消防改造合同-盖章版.pdf', size: '4.2MB', by: '李商务', date: '2026-09-12' },
    { name: '项目立项审批单.pdf', size: '0.6MB', by: '蓝峰', date: '2026-09-20' }] },
];
const ATT_CNT = ATTACH.reduce((s, g) => s + g.files.length, 0);

/* 保证金台账 */
const DEPOSITS = [
  { id: 'BZ20260901-002', type: '履约保证金', dir: 'in', party: '云南××消防设备有限公司（CG20260901-0003）', amt: 12000, pay: '2026-09-01', due: '2026-09-15', st: '未退' },
  { id: 'BZ20260601-001', type: '履约保证金', dir: 'in', party: '昆明万达广场商业管理有限公司', amt: 20000, pay: '2026-06-01', due: '2027-06-30', st: '未退' },
  { id: 'BZ20260520-000', type: '投标保证金', dir: 'in', party: '昆明万达广场商业管理有限公司', amt: 5000, pay: '2026-05-20', due: '2026-06-10', st: '已退还' },
  { id: 'BZ20260615-003', type: '质保金（收款留存 3%）', dir: 'out', party: '昆明万达广场商业管理有限公司（HT20260912-0009）', amt: 98400, pay: '2026-06-15', due: '2027-09-30', st: '未退' },
];

/* 里程碑记录 / 状态历史 / 操作记录 */
const MILE_RECORDS = [
  { time: '2026-09-20', title: 'M1 进场准备', tag: '已完成', tone: 'green' as const, cls: 'done', desc: '施工方案报审 · 开工令' },
  { time: '2026-09-22', title: 'M2 进场施工', tag: '已完成', tone: 'green' as const, cls: 'done', desc: '进场报审表 · 人员名单' },
  { time: '—', title: 'M3 管线安装', tag: '进行中 72%', tone: 'orange' as const, cls: 'cur', desc: '隐蔽工程验收记录（待上传）' },
  { time: '2027-02-28', title: 'M4 竣工验收', tag: '预计 · 未开始', tone: 'gray' as const, cls: 'future', desc: '需上传：竣工验收消防查验记录 + 影像资料（强制校验）' },
];
const HIST = [
  { time: '2026-09-18', title: '立项草稿 → 已立项', tag: '手动', tone: 'gray' as const, cls: 'done', desc: '操作人：蓝峰' },
  { time: '2026-09-12', title: '已立项 → 合同审批中', tag: '自动', tone: 'blue' as const, cls: 'sys', desc: '触发：关联合同提交审批' },
  { time: '2026-09-12', title: '合同审批中 → 已签约', tag: '自动', tone: 'blue' as const, cls: 'sys', desc: '触发：合同审批通过 · 里程碑轴启用' },
  { time: '2026-09-22', title: '已签约 → 履约中', tag: '自动', tone: 'blue' as const, cls: 'sys', desc: '触发：M2 进场施工确认' },
  { time: TODAY, title: '履约中 · 施工阶段（当前）', tag: '进行中', tone: 'orange' as const, cls: 'cur', desc: 'M3 管线安装进行中 72%' },
];
const OPS = [
  { t: '2026-09-19 17:42', w: '系统', tag: '自动', d: '无合同付款 PF000082 提交审批（材料费 ¥8.00 万 · 权责计入成本流水）' },
  { t: '2026-09-19 18:00', w: '蓝峰', tag: '手动', d: 'PF20260905-0004 归并 → CG20260902-0005' },
  { t: '2026-09-16 10:18', w: '财务 · 王会计', tag: '手动', d: '红字冲销 PF20260910-0007 → HC20260916-0001' },
  { t: '2026-09-15 15:03', w: '财务 · 王会计', tag: '手动', d: '红字冲销 PF20260908-0006 → HC000047' },
  { t: '2026-09-12 11:05', w: '蓝峰', tag: '手动', d: '发起变更 BG20260912-0009（+¥8.00 万）' },
];

const PAY_ST: Record<string, { t: 'green' | 'orange' | 'red' | 'blue' | 'gray'; n: string }> = {
  paid: { t: 'green', n: '已收 / 已付' },
  overdue: { t: 'red', n: '逾期未收' },
  flushed: { t: 'gray', n: '已红字冲销' },
  hc: { t: 'gray', n: '红字冲销单' },
  approving: { t: 'blue', n: '审批中 · 不计现金' },
};

export default function ProjectCenterPage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  /** 穿透目标项目：按 nav 重算，保证层层下钻始终定位到当前项目（取不到回落首条） */
  const P = useMemo(() => {
    const id = getFocus('project-center');
    return PROJECTS.find((p) => p.id === id) || PROJECTS[0];
  }, [nav]);
  /** 由 P 派生的经营口径 */
  const REV = P.contractAmt;      // 合同收入
  const COLL_PCT = P.recvPct;     // 回款执行率 = 实收 ÷ 合同额
  /** 客户穿透目标：优先按 customerId 外键，回落按客户名匹配 */
  const custId = (P as { customerId?: string }).customerId
    || CUSTOMERS.find((c) => c.name === P.customer)?.id;
  const [tab, setTab] = useState('contracts');
  const [ovOpen, setOvOpen] = useState(true);
  const [ctSide, setCtSide] = useState(0);      // 关联合同：0 销售 / 1 采购
  const [payFilter, setPayFilter] = useState('全部');
  const [planEdits, setPlanEdits] = useState<Record<string, number>>({});
  const [drill, setDrill] = useState<string | null>(null);
  const [m, setM] = useState<string | null>(null); // 弹窗
  const [flushId, setFlushId] = useState('');
  const [depRelId, setDepRelId] = useState<string | null>(null);
  // 评审 I1：移除项目成员 / 审批驳回均为高影响操作，改二次确认 + 原因必填
  const [rmMb, setRmMb] = useState<(typeof MEMBERS)[number] | null>(null);
  const [rejA, setRejA] = useState<(typeof APPROVALS)[number] | null>(null);

  /**
   * 成本同源化：目标成本锚定 data.ts 的 PROJECTS.cost（项目主数据），
   * 计划 / 实际明细按「本项目成本 ÷ 基线成本」等比缩放 —— 换项目时全屏数字随主数据刷新，
   * 不再出现「项目成本 226 万 but 经营中心永远显示固定 241.2 万」的口径冲突。
   */
  const costScale = P.cost > 0 ? P.cost / PLAN_BASE : 1;
  const planRows = useMemo(
    () => PLAN_ROWS.map((r) => ({ ...r, amt: Math.round(r.amt * costScale) })),
    [costScale],
  );
  const costRows = useMemo(
    () => COST_ROWS.map((r) => ({ ...r, amt: Math.round(r.amt * costScale) })),
    [costScale],
  );
  const PLAN_SUM = planRows.reduce((s, r) => s + r.amt, 0);
  const COST_SUM = costRows.reduce((s, r) => s + r.amt, 0);
  /** 收入完成度 = 实收净额 ÷ 合同收入（原为写死的 59.0%，与收支明细脱节） */
  const FINISH_PCT = REV > 0 ? Math.round((CASH_IN / REV) * 1000) / 10 : 0;

  /* 派生（同源实时刷新） */
  const dev = COST_SUM - PLAN_SUM;
  const devPct = (dev / PLAN_SUM) * 100;
  const planProfit = ((REV - PLAN_SUM) / REV) * 100;
  const actProfit = ((REV - COST_SUM) / REV) * 100;
  const overdue = PAY_ROWS.filter((r) => r.st === 'overdue');
  const overdueAmt = overdue.reduce((s, r) => s + r.amt, 0);
  const depOut = DEPOSITS.filter((d) => d.st === '未退');
  const depOutAmt = depOut.reduce((s, d) => s + d.amt, 0);

  const payRows = payFilter === '全部' ? PAY_ROWS : PAY_ROWS.filter((r) => r.kind === payFilter);
  const bars = COST9.map((t) => {
    const act = COST_ROWS.filter((r) => r.type === t).reduce((s, r) => s + r.amt, 0);
    const pln = PLAN_ROWS.filter((r) => r.type === t).reduce((s, r) => s + r.amt, 0);
    return { t, act, pln, max: Math.max(act, pln) };
  }).filter((b) => b.act > 0 || b.pln > 0);
  const barMax = Math.max(...bars.map((b) => b.max), 1);

  const openM = (k: string) => setM(k);
  const closeM = () => setM(null);

  return (
    <>
      <PageHead
        crumbs={['项目管理', '项目列表', '项目经营中心']}
        title={<span className="nc-pjtitle"><Ico n="star" size={16} /> {P.name}</span>}
        badges={<><Tag tone="blue">履约中 · {P.milestoneName}</Tag><Tag tone="red">成本超支 {devPct.toFixed(1)}%</Tag></>}
        sub={(() => {
          const t = traceOf(P);
          return <span className="nc-pjtrace">溯源链：
            {t.opp ? <><EntityLink target="opp" id={t.opp.id} go={go} title="下钻到商机详情">商机 {t.opp.id}</EntityLink> → </> : <span className="nc-muted">无关联商机 → </span>}
            {t.quote ? <><EntityLink target="quote-detail" id={t.quote.id} go={go} title="下钻到报价详情">报价 {t.quote.id}</EntityLink> → </> : <span className="nc-muted">无关联报价 → </span>}
            {t.contract ? <><EntityLink target="contract" id={t.contract.id} go={go} title="下钻到合同详情">合同 {t.contract.id}</EntityLink> → </> : <span className="nc-muted">无关联合同 → </span>}
            本项目 <Code>{P.id}</Code>
          </span>;
        })()}
        actions={<>
          <Btn onClick={() => go('project')}>← 返回项目列表</Btn>
          <Btn onClick={() => openM('change')}><Ico n="swap" size={16} /> 发起变更</Btn>
          <Btn kind="primary" onClick={() => openM('mile')}>推进里程碑</Btn>
          <Btn onClick={() => openM('accept')}>竣工验收消防查验记录</Btn>
        </>}
      />

      {/* ============ ① 头部 + 项目概况（合并一卡） ============ */}
      <Card>
        <div className="nc-lifebar">
          {LIFE.map((l, i) => (
            <React.Fragment key={l.n}>
              {i > 0 && <span className="nc-lifebar-arrow">→</span>}
              <span className={`nc-lc${l.st ? ` is-${l.st}` : ''}`}>{l.n}{l.st === 'done' ? <> <Ico n="check" size={12} style={{ color: 'var(--c-success-deep)' }} /></> : null}</span>
            </React.Fragment>
          ))}
        </div>

        <div className="nc-ovhd">
          <b><Ico n="clipboard" size={16} /> 项目概况 <span className="nc-cell-sub">全量档案 · 唯一事实源</span></b>
          <Op onClick={() => setOvOpen(!ovOpen)}>{ovOpen ? '收起 ▲' : '展开 ▼'}</Op>
        </div>
        {ovOpen && (
          <div className="nc-ovbody">
            <KvGrid cols={3} rows={[
              { k: '项目编号', v: <span><Code>{P.id}</Code> <Op onClick={() => toast('已复制项目编号 ' + P.id)}>⧉ 复制</Op></span> },
              { k: '项目类型 / 经营模式', v: `${P.type} · 经营（自营）` },
              { k: '所属区域', v: '云南 · 昆明' },
              { k: '客户 / 联系人', v: <><EntityLink target="customer" id={custId} go={go} title="下钻到客户档案">{P.customer}</EntityLink> / 刘经理</> },
              { k: '项目经理', v: `${P.pm}（138****8801）` },
              { k: '合同额（含审批中变更）', v: <b>{fmtWan(REV + CHG_PENDING)}</b> },
              { k: '工期', v: `${P.start} ~ ${P.end}（193 天）` },
              { k: '当前状态', v: <Tag tone="blue">履约中 · {P.milestoneName}</Tag> },
              { k: '项目地址', v: '昆明市西山区前兴路 688 号万达广场' },
              { k: '创建时间 / 创建人', v: '2026-09-20 / 蓝峰' },
            ]} />
            <div className="nc-ovdesc">
              <b>项目描述：</b>对昆明万达广场既有消防系统进行整体改造，含火灾自动报警系统更新、自动喷淋管网改造、防排烟系统调试；
              施工期间增补机房气体灭火系统（变更审批中）。商场不停业施工，夜间作业窗口 22:00-06:00，报警系统与既有主机联网。
              竣工后进入 1 年质保期，质保金按收款金额 3%（法定上限）留存。
            </div>
          </div>
        )}
      </Card>

      {/* ============ ② 盈利（12 指标 · 6 列两行 · 每卡可穿透） ============ */}
      <Card hd={<span><Ico n="trophy" size={16} /> 盈利 <Tag tone="green">毛利率</Tag></span>}
        extra={<span className="nc-cell-sub">口径说明（附录 D）ⓘ · 同源实时刷新 · 更新于 {TODAY} 10:24</span>}>
        <div className="nc-tiles nc-tiles-6">
          <button className="nc-tile is-clickable" onClick={() => setDrill('rev')}>
            <div className="nc-tile-label">收入 <span className="nc-drill">穿透↗</span></div>
            <div className="nc-tile-value num"><Money v={REV} role={role} wan /></div>
            <div className="nc-tile-sub">合同收入 · 含变更（+<Money v={CHG_PENDING} role={role} wan /> 审批中）</div>
          </button>
          <button className="nc-tile is-clickable" onClick={() => setDrill('plan')}>
            <div className="nc-tile-label">计划成本 <span className="nc-drill">穿透↗</span></div>
            <div className="nc-tile-value num"><Money v={PLAN_SUM} role={role} wan /></div>
            <div className="nc-tile-sub">目标成本子表（报价带入）</div>
          </button>
          <button className="nc-tile is-clickable" onClick={() => setDrill('act')}>
            <div className="nc-tile-label">实际成本 <span className="nc-drill">穿透↗</span></div>
            <div className="nc-tile-value num"><Money v={COST_SUM} role={role} wan /></div>
            <div className="nc-tile-sub">CG+CB+PF 权责口径</div>
          </button>
          <button className="nc-tile is-clickable" onClick={() => setDrill('dev')}>
            <div className="nc-tile-label">成本偏差 <span className="nc-drill">穿透↗</span></div>
            <div className="nc-tile-value num nc-v-red">+<Money v={dev} role={role} wan /></div>
            <div className="nc-tile-sub">超支 {devPct.toFixed(1)}%</div>
          </button>
          <button className="nc-tile is-clickable" onClick={() => setDrill('planrate')}>
            <div className="nc-tile-label">计划毛利率</div>
            <div className="nc-tile-value num">{planProfit.toFixed(1)}%</div>
            <div className="nc-tile-sub">（收入−计划）÷ 收入</div>
          </button>
          <button className="nc-tile is-clickable" onClick={() => setDrill('actrate')}>
            <div className="nc-tile-label">实际毛利率</div>
            <div className="nc-tile-value num nc-v-red">{actProfit.toFixed(1)}%</div>
            <div className="nc-tile-sub">较计划 {(actProfit - planProfit).toFixed(1)}pt</div>
          </button>
          <button className="nc-tile is-clickable" onClick={() => setDrill('in')}>
            <div className="nc-tile-label">现金流入 <span className="nc-drill">穿透↗</span></div>
            <div className="nc-tile-value num nc-v-green"><Money v={CASH_IN} role={role} wan /></div>
            <div className="nc-tile-sub">实收 · 红字冲销净额</div>
          </button>
          <button className="nc-tile is-clickable" onClick={() => setDrill('out')}>
            <div className="nc-tile-label">现金流出 <span className="nc-drill">穿透↗</span></div>
            <div className="nc-tile-value num"><Money v={CASH_OUT} role={role} wan /></div>
            <div className="nc-tile-sub">实付净额 · 审批中不计</div>
          </button>
          <button className="nc-tile is-clickable" onClick={() => setDrill('net')}>
            <div className="nc-tile-label">净流入 <span className="nc-drill">穿透↗</span></div>
            <div className="nc-tile-value num nc-v-green">{NET_IN >= 0 ? '+' : ''}<Money v={NET_IN} role={role} wan /></div>
            <div className="nc-tile-sub">流入 − 流出</div>
          </button>
          <button className="nc-tile is-clickable" onClick={() => setDrill('coll')}>
            <div className="nc-tile-label">回款执行率</div>
            <div className="nc-tile-value num">{COLL_PCT}%</div>
            <div className="nc-tile-sub">实收 ÷ 应收到期</div>
          </button>
          <button className="nc-tile is-clickable" onClick={() => setDrill('finish')}>
            <div className="nc-tile-label">收入完成度</div>
            <div className="nc-tile-value num">{FINISH_PCT}%</div>
            <div className="nc-tile-sub">执行金额 ÷ 合同额</div>
          </button>
          <button className="nc-tile is-clickable" onClick={() => openM('deposit')}>
            <div className="nc-tile-label">已解除小计 <span className="nc-drill">保证金台账</span></div>
            <div className="nc-tile-value num">{fmtWan(0)}</div>
            <div className="nc-tile-sub">已解除期次 · 历史参考</div>
          </button>
        </div>

        <div className="nc-caliber" style={{ marginTop: 12 }}>
          <Ico n="pin" size={14} /> <b>双口径：</b>① 成本（权责）= CG+CB+PF（<b>含审批中</b>，红字冲销 / 负数更正按净额追加，不删原行）；
          ② 现金（收付）= 净额（<b>审批中不计</b>）。红字冲销 = 负数单冲正 · 不回退合同状态 · <b>一笔仅一次</b>；
          负数更正 = 原行只读 · 不可删除。
        </div>

        <div className="nc-compare" style={{ marginTop: 12 }}>
          <div className="nc-compare-row">
            <span className="nc-compare-lb">收入</span>
            <div className="nc-compare-track"><i className="nc-compare-fill is-plan" style={{ width: `${FINISH_PCT}%` }} /><span className="nc-compare-mark" style={{ left: '100%' }} /></div>
            <span className="nc-compare-val num">计划 {fmtWan(REV)} — 实际 {fmtWan(Math.round(REV * FINISH_PCT / 100))} <b className="nc-v-green">+{fmtWan(CHG_PENDING)}(变更)</b></span>
          </div>
          <div className="nc-compare-row is-over">
            <span className="nc-compare-lb">成本</span>
            <div className="nc-compare-track"><i className="nc-compare-fill is-act" style={{ width: '100%' }} /><span className="nc-compare-mark" style={{ left: `${(PLAN_SUM / COST_SUM) * 100}%` }} /></div>
            <span className="nc-compare-val num">计划 {fmtWan(PLAN_SUM)} — 实际 {fmtWan(COST_SUM)} <b className="nc-v-red">+{fmtWan(dev)}(超支)</b></span>
          </div>
        </div>
      </Card>

      {/* ============ ③ 项目进程 | 风险聚合 ============ */}
      <div className="nc-grid-21" style={{ marginTop: 16 }}>
        <Card hd={<span>项目进程 <span className="nc-cell-sub">A 里程碑轴 + B 商务状态轴 + C 期次总进度</span></span>}
          extra={<><Btn size="sm" kind="primary" onClick={() => openM('mile')}>推进里程碑</Btn> <Btn size="sm" onClick={() => openM('accept')}>竣工验收消防查验记录</Btn></>}>
          <div className="nc-mile-axis">
            {MILE_AXIS.map((mi, i) => (
              <div key={mi.name} className={`nc-mile-node${mi.st ? ` is-${mi.st}` : ''}`}>
                <i>{mi.st === 'done' ? '' : mi.st === 'cur' ? '●' : i + 1}</i><b>{mi.name}</b><span>{mi.date}</span>
              </div>
            ))}
          </div>
          <div className="nc-cell-sub" style={{ marginTop: 8 }}>
            验收类节点强制上传【竣工验收消防查验记录】+ 影像 + 签字件；通过后资料自动归档至【项目附件】对应里程碑。
          </div>

          <div className="nc-cell-sub" style={{ marginTop: 12 }}>B 商务状态轴（点击过滤关联合同 Tab）</div>
          <div className="nc-bizaxis">
            {BIZ_AXIS.map((b) => (
              <span key={b.n} className={`nc-bizchip${b.tone ? ` is-${b.tone}` : ''}`}
                onClick={() => { setTab('contracts'); toast(`已按商务状态「${b.n}」过滤关联合同`); }} {...pressProps(() => { setTab('contracts'); toast(`已按商务状态「${b.n}」过滤关联合同`); })}>
                {b.n} <b>{b.c}</b>
              </span>
            ))}
          </div>

          <div className="nc-progrow"><span>C 期次总进度</span>
            <Progress value={FINISH_PCT} /><b className="num">{FINISH_PCT}%</b></div>
          <div className="nc-progrow"><span>回款执行率（到期口径）</span>
            <Progress value={COLL_PCT} tone="green" /><b className="num">{COLL_PCT}%</b></div>
        </Card>

        <Card hd={<span><Ico n="shield" size={16} /> 风险聚合 <span className="nc-cell-sub">直达操作</span></span>}>
          <div className="nc-risk-item is-red">
            <span><Ico n="clock" size={16} /></span>
            <div className="nc-risk-main">
              逾期收款 {overdue.length} 笔 <b className="nc-v-red">{fmtWan(overdueAmt)}</b>
              <div className="nc-risk-sub">{overdue[0]?.id} · 逾期 19 天 · 与收支明细红底行双向同源</div>
            </div>
            <Btn size="sm" onClick={() => openM('dunning')}>催收</Btn>
            <Btn size="sm" kind="primary" onClick={() => openM('pay')}>登记收款</Btn>
          </div>
          <div className="nc-risk-item is-orange">
            <span><Ico n="bell" size={16} /></span>
            <div className="nc-risk-main">
              待我审批 {APPROVALS.length} 笔
              <div className="nc-risk-sub">{APPROVALS[0].id} · {APPROVALS[0].desc}</div>
            </div>
            <Btn size="sm" onClick={() => openM('approve')}>审批台</Btn>
          </div>
          <div className="nc-risk-item is-orange">
            <span><Ico n="chart" size={16} /></span>
            <div className="nc-risk-main">
              成本超支 <b className="nc-v-red">+{fmtWan(dev)}（{devPct.toFixed(1)}%）</b>
              <div className="nc-risk-sub">权责口径 · 建议 补录台账 / 发起变更归集</div>
            </div>
            <Btn size="sm" onClick={() => setTab('cost')}>成本台账</Btn>
          </div>
          <div className="nc-risk-item is-gold">
            <span><Ico n="card" size={16} /></span>
            <div className="nc-risk-main">
              保证金未退 {depOut.length} 笔 <b className="nc-v-red">{fmtWan(depOutAmt)}</b>
              <div className="nc-risk-sub">我方缴纳待退回 · 另有质保金留存义务 ¥16.40 万 · 点击进入台账</div>
            </div>
            <Btn size="sm" onClick={() => openM('deposit')}>台账</Btn>
          </div>
          <div className="nc-riskfoot">
            其余风险按状态聚合：无合同在途 &gt;30 天 ｜ 里程碑停滞 ｜ 处置完成后自动销项并写入操作记录
          </div>
        </Card>
      </div>

      {/* ============ ④ 9 Tab ============ */}
      <Card flush style={{ marginTop: 16 }}>
        <div className="nc-card-hd">
          <Tabs value={tab} onChange={setTab} items={[
            { key: 'contracts', label: '关联合同' },
            { key: 'cash', label: '收支明细' },
            { key: 'cost', label: '成本台账', cnt: COST_ROWS.length },
            { key: 'change', label: '变更汇总', cnt: CHANGES.length },
            { key: 'mile', label: '里程碑记录' },
            { key: 'history', label: '状态历史' },
            { key: 'log', label: '操作记录' },
            { key: 'member', label: '项目成员', cnt: MEMBERS.length },
            { key: 'attach', label: '项目附件', cnt: ATT_CNT },
          ]} />
        </div>

        {/* ---- 关联合同 ---- */}
        {tab === 'contracts' && (
          <div className="nc-card-bd">
            <div className="nc-subtabs">
              <span className={`nc-subtab${ctSide === 0 ? ' is-on' : ''}`} onClick={() => setCtSide(0)} {...pressProps(() => setCtSide(0))}>销售合同 <b>{SALE_CT.length}</b></span>
              <span className={`nc-subtab${ctSide === 1 ? ' is-on' : ''}`} onClick={() => setCtSide(1)} {...pressProps(() => setCtSide(1))}>采购 / 分包合同 <b>{BUY_CT.length}</b></span>
              <span style={{ marginLeft: 'auto' }}><Btn size="sm" onClick={() => openM('link')}>＋ 关联新合同</Btn></span>
            </div>
            {ctSide === 0 ? SALE_CT.map((c) => (
              <div key={c.code} className="nc-ctcard">
                <div className="nc-ctcard-hd">
                  <EntityLink target="contract" id={c.code} go={go} title="下钻到合同详情"><Code>{c.code}</Code></EntityLink><b>{c.name}</b><Tag tone={c.tone}>{c.st}</Tag>
                  {c.badge && <span className="nc-cell-sub">{c.badge}</span>}
                  <span className="nc-ctcard-amt"><Money v={c.amt} role={role} /></span>
                  <Op onClick={() => { setFocus('contract', c.code); go('contract'); }}>详情</Op>
                </div>
                {'payplan' in c && (
                  <table className="nc-tbl" style={{ minWidth: 640 }}>
                    <thead><tr><th>期次</th><th style={{ width: 140 }} className="is-num">金额</th><th style={{ width: 150 }}>状态</th><th style={{ width: 120 }}>计划日期</th></tr></thead>
                    <tbody>
                      {(c.payplan as { n: string; amt: number; st: string; d: string }[]).map((p) => (
                        <tr key={p.n}><td>{p.n}</td><td className="is-num"><Money v={p.amt} role={role} /></td>
                          <td><Tag tone={p.st === '已收' ? 'green' : p.st === '未到期' ? 'gray' : 'red'}>{p.st}</Tag></td>
                          <td>{p.d}</td></tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )) : BUY_CT.map((c) => (
              <div key={c.code} className="nc-ctcard">
                <div className="nc-ctcard-hd">
                  <EntityLink target="contract" id={c.code} go={go} title="下钻到合同详情"><Code>{c.code}</Code></EntityLink><b>{c.name}</b><Tag tone={c.tone}>{c.st}</Tag>
                  <span className="nc-ctcard-amt"><Money v={c.amt} role={role} /></span>
                  <Op onClick={() => { setFocus('contract', c.code); go('contract'); }}>详情</Op>
                </div>
                {c.warn && <div className="nc-cell-sub nc-v-orange"><Ico n="warning" size={16} /> {c.warn}</div>}
              </div>
            ))}
          </div>
        )}

        {/* ---- 收支明细 ---- */}
        {tab === 'cash' && (
          <div className="nc-card-bd">
            <div className="nc-subtabs">
              {PAY_FILTERS.map((f) => (
                <span key={f} className={`nc-subtab${payFilter === f ? ' is-on' : ''}`} onClick={() => setPayFilter(f)} {...pressProps(() => setPayFilter(f))}>
                  {f} <b>{f === '全部' ? PAY_ROWS.length : PAY_ROWS.filter((r) => r.kind === f).length}</b>
                </span>
              ))}
              <span style={{ marginLeft: 'auto' }}><Btn size="sm" kind="primary" onClick={() => openM('pay')}>＋ 登记收款</Btn></span>
            </div>
            <table className="nc-tbl" style={{ minWidth: 1080 }}>
              <thead><tr>
                <th style={{ width: 150 }}>单据</th><th style={{ width: 100 }}>类型</th><th style={{ width: 160 }}>关联合同</th>
                <th style={{ width: 130 }} className="is-num">金额</th><th>用途</th><th style={{ width: 130 }}>状态</th>
                <th style={{ width: 110 }}>日期</th><th style={{ width: 120 }}>操作</th>
              </tr></thead>
              <tbody>
                {payRows.map((r) => (
                  <tr key={r.id} className={r.st === 'overdue' ? 'is-warn-row' : r.st === 'hc' ? 'is-dead-row' : ''}>
                    <td><Code>{r.id}</Code></td>
                    <td><Tag tone={r.kind === '收入' ? 'green' : r.kind === '红字冲销单' ? 'gray' : 'orange'}>{r.kind}</Tag></td>
                    <td className="nc-cell-sub">{r.contract}</td>
                    <td className={`is-num${r.amt < 0 ? ' nc-v-red' : ''}`}><b className="num"><Money v={r.amt} role={role} /></b></td>
                    <td className="nc-cell-sub">{r.use}</td>
                    <td><Tag tone={PAY_ST[r.st].t}>{PAY_ST[r.st].n}</Tag></td>
                    <td>{r.date}</td>
                    <td>
                      {r.kind === '收入' && r.st === 'overdue' && <><Op gold onClick={() => openM('dunning')}>催收</Op><OpSep /></>}
                      {r.kind !== '收入' && r.kind !== '红字冲销单' && r.st === 'paid' && <><Op danger onClick={() => { setFlushId(r.id); openM('flush'); }}>红字冲销</Op><OpSep /></>}
                      {r.kind === '无合同付款' && <Op onClick={() => openM('merge')}>归并</Op>}
                      {(r.st === 'hc' || r.st === 'flushed' || r.st === 'approving') && <span className="nc-cell-sub">—</span>}
                      {r.kind === '采购付款' && r.st === 'paid' && <span className="nc-cell-sub">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="nc-tbl-sum"><td colSpan={3}>Σ实收（红字冲销净额）</td>
                  <td className="is-num"><b className="num">{fmt(SUM_IN)}</b></td>
                  <td colSpan={4} className="nc-cell-sub">逾期 {fmtWan(overdueAmt)} 未计入</td></tr>
                <tr className="nc-tbl-sum"><td colSpan={3}>Σ实付（红字冲销净额）</td>
                  <td className="is-num"><b className="num">{fmt(SUM_OUT)}</b></td>
                  <td colSpan={4} className="nc-cell-sub">审批中不计 · 已红字冲销与负数单对冲</td></tr>
              </tfoot>
            </table>
            <div className="nc-cell-sub" style={{ marginTop: 8 }}>
              逾期行红底与合同详情双向同源 ｜ 撤销归并 = 管理员 + 24h 内 ｜ 红字冲销 = 财务 + 管理员 · 一笔仅一次 · 24h 内可撤销
            </div>
          </div>
        )}

        {/* ---- 成本台账 ---- */}
        {tab === 'cost' && (
          <div className="nc-card-bd">
            <div className="nc-overhead">
              对比&nbsp; 计划 {fmtWan(PLAN_SUM)} — vs 实际 {fmtWan(COST_SUM)} —（<b className="nc-v-red">+{devPct.toFixed(1)}% 超支</b>）同源实时刷新
            </div>
            <div className="nc-ledgrid">
              <div>
                <div className="nc-ledhd">目标成本子表（计划口径 · 行内编辑留痕）
                  <Btn size="sm" onClick={() => toast('已从报价 BJ20260908-0007 带入目标成本（幂等）')}>从报价带入</Btn></div>
                <table className="nc-tbl" style={{ minWidth: 440 }}>
                  <thead><tr><th>类型</th><th style={{ width: 120 }} className="is-num">计划金额</th><th>备注</th><th style={{ width: 80 }}>留痕</th></tr></thead>
                  <tbody>
                    {PLAN_ROWS.map((r) => (
                      <tr key={r.type}>
                        <td>{r.type}</td>
                        <td className="is-num">
                          <input className="nc-cell-in" style={{ width: 100, textAlign: 'right' }} defaultValue={r.amt}
                            onChange={() => setPlanEdits((p) => ({ ...p, [r.type]: (p[r.type] || 0) + 1 }))} />
                        </td>
                        <td className="nc-cell-sub">{r.note}</td>
                        <td className="nc-cell-sub">{planEdits[r.type] ? `已编辑 ${planEdits[r.type]} 次` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="nc-tbl-sum"><td>Σ计划成本</td>
                    <td className="is-num"><b className="num">{fmt(PLAN_SUM)}</b></td><td colSpan={2} /></tr></tfoot>
                </table>
                <div className="nc-cell-sub" style={{ marginTop: 8 }}>
                  点击「计划金额」行内编辑并自动留痕；从报价 BJ20260908-0007 带入（幂等）。
                </div>
              </div>

              <div>
                <div className="nc-ledhd">成本流水（CG 成本归类 ｜ CB 登记 ｜ PF 无合同付款）
                  <Btn size="sm" kind="primary" onClick={() => openM('cost')}>＋ 登记成本 CB</Btn></div>
                <table className="nc-tbl" style={{ minWidth: 620 }}>
                  <thead><tr><th style={{ width: 60 }}>来源</th><th style={{ width: 150 }}>单据号</th><th style={{ width: 90 }}>类型</th>
                    <th style={{ width: 120 }} className="is-num">金额</th><th style={{ width: 110 }}>日期</th><th>说明</th><th style={{ width: 80 }}>操作</th></tr></thead>
                  <tbody>
                    {COST_ROWS.map((c) => (
                      <tr key={c.id} className={c.st === 'approving' ? 'is-warn-row' : ''}>
                        <td><Tag tone={c.src === 'CG' ? 'orange' : c.src === 'CB' ? 'blue' : 'gray'}>{c.src}</Tag></td>
                        <td><Code>{c.id}</Code></td><td>{c.type}</td>
                        <td className="is-num"><b className="num"><Money v={c.amt} role={role} /></b></td>
                        <td>{c.date}</td><td className="nc-cell-sub">{c.note}</td>
                        <td>{c.src === 'CB' ? <Op onClick={() => openM('correct')}>更正</Op> : <span className="nc-cell-sub">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="nc-tbl-sum"><td colSpan={3}>Σ实际成本（含审批中）</td>
                    <td className="is-num"><b className="num">{fmt(COST_SUM)}</b></td><td colSpan={3} /></tr></tfoot>
                </table>

                <div className="nc-cell-sub" style={{ marginTop: 12 }}>类型分组小计条形（9 枚举为轴 · 蓝条 = 实际 · 黑线 = 计划）</div>
                <div className="nc-typebars">
                  {bars.map((b) => (
                    <div key={b.t} className="nc-typebar">
                      <span>{b.t}</span>
                      <div className="nc-bartrack">
                        <i className="nc-barfill" style={{ width: `${(b.act / barMax) * 100}%` }} />
                        <span className="nc-barmark" style={{ left: `${(b.pln / barMax) * 100}%` }} />
                      </div>
                      <Money v={b.act} role={role} wan />
                    </div>
                  ))}
                </div>
                <div className="nc-cell-sub" style={{ marginTop: 8 }}>
                  只追加不删除：CB 行「更正」（决策 22）；CG 更正走合同 / 变更流程；PF 红字冲销在【收支明细】双向同源。
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---- 变更汇总 ---- */}
        {tab === 'change' && (
          <div className="nc-card-bd">
            <div className="nc-subtabs" style={{ marginBottom: 12 }}>
              <span className="nc-flownode is-done">闭环：变更生效后自动同步 ① 合同执行口径 ② 收款计划期次 ③ 盈利卡收入口径</span>
              <span style={{ marginLeft: 'auto' }}><Btn size="sm" onClick={() => openM('change')}>＋ 发起变更</Btn></span>
            </div>
            {CHANGES.map((c) => (
              <div key={c.id} className="nc-chgcard">
                <div className="nc-chgcard-hd">
                  <Code>{c.id}</Code><b>{c.title}</b>
                  <span className="nc-ctcard-amt"><Money v={c.amt} role={role} /></span>
                  <Tag tone={c.st === '已生效' ? 'green' : 'gold'}>{c.st}</Tag>
                  <span className="nc-cell-sub">{c.by} · {c.date} · {c.contract}</span>
                </div>
                <div className="nc-flow">
                  {FLOW.map((f, i) => (
                    <span key={f} className={`nc-flownode${i < c.flowIdx ? ' is-done' : i === c.flowIdx ? ' is-cur' : ''}`}>
                      {/* 已完成 = ✓ 打勾（success 语义）；当前 / 待办 = 序号 */}
                      {i < c.flowIdx ? <Ico n="check" size={12} /> : i + 1}. {f}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <div className="nc-cell-sub" style={{ marginTop: 8 }}>
              闭环：变更生效后自动同步 ① 合同执行口径 ② 收款计划期次 ③ 盈利卡收入口径，全程留痕。
            </div>
          </div>
        )}

        {/* ---- 里程碑记录 ---- */}
        {tab === 'mile' && (
          <div className="nc-card-bd">
            <div className="nc-tllegend">图例：
              <span><i className="nc-lg is-done" />已完成 / 手动记录</span>
              <span><i className="nc-lg is-cur" />进行中 / 待验收</span>
              <span><i className="nc-lg is-sys" />系统自动</span>
              <span><i className="nc-lg is-future" />未开始</span>
            </div>
            <Timeline items={MILE_RECORDS.map((r) => ({
              date: r.time,
              tone: r.cls === 'done' ? 'ok' as const : r.cls === 'cur' ? 'gold' as const : 'gray' as const,
              text: <><b>{r.title}</b> <Tag tone={r.tone}>{r.tag}</Tag><div className="nc-cell-sub">{r.desc}</div></>,
            }))} />
            <div className="nc-cell-sub" style={{ marginTop: 8 }}>
              统一规范：时间(YYYY-MM-DD)｜标题｜状态标签 三段式；状态以「标签 + 节点色」表达，不混入时间文案。
            </div>
          </div>
        )}

        {/* ---- 状态历史 ---- */}
        {tab === 'history' && (
          <div className="nc-card-bd">
            <div className="nc-tllegend">图例：
              <span><i className="nc-lg is-done" />手动流转</span>
              <span><i className="nc-lg is-sys" />系统自动</span>
              <span><i className="nc-lg is-cur" />当前状态</span>
            </div>
            <Timeline items={HIST.map((h) => ({
              date: h.time,
              tone: h.cls === 'sys' ? 'gold' as const : h.cls === 'cur' ? 'gray' as const : 'ok' as const,
              text: <><b>{h.title}</b> <Tag tone={h.tone}>{h.tag}</Tag><div className="nc-cell-sub">{h.desc}</div></>,
            }))} />
            <div className="nc-cell-sub" style={{ marginTop: 8 }}>
              状态流转由系统事件驱动（合同审批 / 里程碑确认 / 变更生效 / 结算完成），禁止手工跳转。
            </div>
          </div>
        )}

        {/* ---- 操作记录 ---- */}
        {tab === 'log' && (
          <div className="nc-card-bd">
            <Timeline items={OPS.map((o) => ({
              date: o.t,
              tone: o.tag === '自动' ? 'gray' as const : 'ok' as const,
              text: <><b>{o.w}</b> <Tag tone={o.tag === '自动' ? 'blue' : 'gray'}>{o.tag}</Tag> {o.d}</>,
            }))} />
          </div>
        )}

        {/* ---- 项目成员 ---- */}
        {tab === 'member' && (
          <div className="nc-card-bd">
            <div className="nc-subtabs">
              <span className="nc-subtab is-on">成员 [{MEMBERS.length}] · 在职 {MEMBERS.filter((x) => x.st === '在职').length}</span>
              <span style={{ marginLeft: 'auto' }}><Btn size="sm" onClick={() => openM('member')}>＋ 添加成员</Btn></span>
            </div>
            <table className="nc-tbl" style={{ minWidth: 900 }}>
              <thead><tr><th style={{ width: 120 }}>成员</th><th style={{ width: 110 }}>角色</th><th style={{ width: 130 }}>联系方式</th>
                <th>职责分工</th><th style={{ width: 110 }}>加入时间</th><th style={{ width: 80 }}>状态</th><th style={{ width: 80 }}>操作</th></tr></thead>
              <tbody>
                {MEMBERS.map((mb) => (
                  <tr key={mb.name}>
                    <td><span className="nc-avatar">{mb.name[0]}</span><b style={{ marginLeft: 6 }}>{mb.name}</b></td>
                    <td><Tag tone={mb.tone}>{mb.role}</Tag></td>
                    <td className="num">{mb.phone}</td>
                    <td className="nc-cell-sub">{mb.duty}</td>
                    <td>{mb.join}</td>
                    <td><Tag tone="green">{mb.st}</Tag></td>
                    <td><Op danger onClick={() => setRmMb(mb)}>移除</Op></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="nc-cell-sub" style={{ marginTop: 8 }}>
              角色权限：项目经理 = 里程碑确认 / 验收发起；商务 = 合同 / 变更 / 催收；财务 = 收款确认 / 红字冲销 / 付款审批；
              施工 = 进度上报 / 影像采集；专职安全员 = 现场检查。移除 = 软删除（已退出）并留痕。
            </div>
          </div>
        )}

        {/* ---- 项目附件 ---- */}
        {tab === 'attach' && (
          <div className="nc-card-bd">
            <div className="nc-subtabs">
              <span className="nc-subtab is-on">附件分组 [{ATTACH.length}] · 共 <b>{ATT_CNT}</b> 个文件</span>
              <span className="nc-cell-sub" style={{ marginLeft: 6 }}>必传清单：绿 = 已传 红 = 缺失</span>
              <span style={{ marginLeft: 'auto' }}><Btn size="sm" onClick={() => openM('upload')}>＋ 上传附件</Btn></span>
            </div>
            <div className="nc-attgrp">
              {ATTACH.map((g, gi) => {
                const miss = g.req.filter((r) => !g.files.some((f) => f.name.includes(r.slice(0, 4))));
                return (
                  <div key={g.mile} className="nc-attgrp-item">
                    <div className="nc-attgrp-hd">
                      {g.mile}
                      {g.req.length > 0 && (
                        <span className="nc-cell-sub">
                          {g.req.map((r) => (
                            <span key={r} style={{ marginLeft: 8 }}>
                              <i className={`nc-reqdot ${miss.includes(r) ? 'is-miss' : 'is-ok'}`} />{r}
                            </span>
                          ))}
                        </span>
                      )}
                      <span style={{ marginLeft: 'auto' }}>
                        <Btn size="sm" onClick={() => openM('upload')}>上传</Btn>
                      </span>
                    </div>
                    {g.files.length === 0
                      ? <div className="nc-cell-sub">暂无文件 · 待上传至 {g.mile.split('（')[0]}</div>
                      : g.files.map((f) => (
                        <div key={f.name} className="nc-filechip"><Ico n="paperclip" size={16} /> {f.name}
                          <span className="nc-cell-sub">{f.size} · {f.by} · {f.date}</span>
                          <span className="nc-att-x" onClick={() => toast(`已删除 ${f.name}（与文档中心双向同源）`)} {...pressProps(() => toast(`已删除 ${f.name}（与文档中心双向同源）`))}><Ico n="close" size={16} /></span>
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>
            <div className="nc-cell-sub" style={{ marginTop: 8 }}>
              附件按里程碑归组：验收类必传项未齐时【竣工验收消防查验记录】不可提交；验收通过后核验单 / 影像 / 签字件由系统自动归档至对应组并留痕。
            </div>
          </div>
        )}
      </Card>

      {/* ============ 指标穿透 ============ */}
      <Modal open={!!drill} onClose={() => setDrill(null)} width={620} title="指标穿透 · 明细"
        foot={<><Btn onClick={() => setDrill(null)}>关闭</Btn><Btn kind="primary" onClick={() => { setDrill(null); setTab('cost'); }}>查看成本台账 →</Btn></>}>
        <Banner tone="info">口径说明与该指标的取数来源（常驻口径双通道之一）。</Banner>
        <KvGrid cols={1} rows={[
          { k: '当前指标', v: ({
            rev: '收入', plan: '计划成本', act: '实际成本', dev: '成本偏差', planrate: '计划毛利率',
            actrate: '实际毛利率', in: '现金流入', out: '现金流出', net: '净流入', coll: '回款执行率', finish: '收入完成度',
          } as Record<string, string>)[drill || ''] || '—' },
          { k: '取数来源', v: drill === 'act' || drill === 'dev' || drill === 'actrate'
            ? '成本台账（CG 采购 + CB 分包 + PF 费用），含审批中，红字冲销 / 负数更正按净额'
            : drill === 'rev' || drill === 'finish' ? '合同执行金额 + 已生效变更 + 审批中变更'
              : drill === 'plan' || drill === 'planrate' ? '目标成本子表（报价带入，行内编辑留痕）'
                : '收付款流水（净额，审批中不计）' },
          { k: '当前值', v: drill === 'rev' ? fmt(REV) : drill === 'plan' ? fmt(PLAN_SUM) : drill === 'act' ? fmt(COST_SUM)
            : drill === 'dev' ? `+${fmt(dev)}（${devPct.toFixed(1)}%）` : drill === 'in' ? fmt(CASH_IN)
              : drill === 'out' ? fmt(CASH_OUT) : drill === 'net' ? `+${fmt(NET_IN)}`
                : drill === 'coll' ? `${COLL_PCT}%` : drill === 'finish' ? `${FINISH_PCT}%`
                  : drill === 'planrate' ? `${planProfit.toFixed(1)}%` : drill === 'actrate' ? `${actProfit.toFixed(1)}%` : '—' },
          { k: '关联单据', v: '本页各 Tab 明细 · 合同详情 · 审批中心' },
        ]} />
        <div className="nc-ops" style={{ marginTop: 12 }}>
          <Btn size="sm" onClick={() => { setDrill(null); setTab('cost'); }}>查看成本台账 →</Btn>
          <Btn size="sm" onClick={() => { setDrill(null); setTab('cash'); }}>查看收支明细 →</Btn>
        </div>
      </Modal>

      {/* ============ 登记收款 ============ */}
      <Modal open={m === 'pay'} onClose={closeM} width={520} title="登记收款"
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('收款已登记 · 回款执行率已刷新'); closeM(); }}>确认登记</Btn></>}>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">关联合同</div>
            <select className="nc-input"><option>HT20260912-0009 昆明万达广场消防改造工程合同</option></select></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">收款期次</div>
            <select className="nc-input"><option>期2 · 尾款（逾期 ¥958,000）</option><option>期3 · 竣工结算款</option><option>预收（无对应期次）</option></select></div>
          <div className="nc-field"><div className="nc-field-label is-req">金额（元）</div><input className="nc-input" defaultValue={958000} /></div>
          <div className="nc-field"><div className="nc-field-label is-req">收款日期</div><input className="nc-input" type="date" defaultValue={TODAY} /></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label">凭证附件</div><input className="nc-input" type="file" /></div>
        </div>
        <Banner tone="info">登记后自动刷新：回款执行率 / 现金流入 / 净流入；逾期行销项并写入操作记录。</Banner>
      </Modal>

      {/* ============ 红字冲销 ============ */}
      <Modal open={m === 'flush'} onClose={closeM} width={520} title="红字冲销（HC · 财务 + 管理员权限）"
        foot={<><Btn onClick={closeM}>取消</Btn><Btn danger onClick={() => { setM('flush2'); }}>提交红字冲销</Btn></>}>
        <Banner tone="warn">红字冲销 = <b>负数单冲正</b> · 不回退合同状态 · <b>一笔仅一次</b> · 24h 内可撤销，全程留痕。</Banner>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label">原单据</div>
            <input className="nc-input" readOnly value={flushId || 'PF20260908-0006'} /></div>
          <div className="nc-field"><div className="nc-field-label is-req">红字冲销金额</div><input className="nc-input" defaultValue={250000} /></div>
          <div className="nc-field"><div className="nc-field-label is-req">红字冲销原因</div>
            <select className="nc-input"><option>发票抬头错误</option><option>重复提交</option><option>金额录入错误</option><option>退票重开</option></select></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label">备注</div><textarea className="nc-input" rows={2} placeholder="选填" /></div>
        </div>
      </Modal>
      <Modal open={m === 'flush2'} onClose={closeM} width={480} title="二次确认：红字冲销"
        foot={<><Btn onClick={closeM}>取消</Btn><Btn danger onClick={() => { toast('红字冲销单已生成 · 原单标记已红字冲销 · 24h 内可撤销'); setM(null); setFlushId(''); }}>确认红字冲销</Btn></>}>
        <div className="nc-cap-red">确认对 {flushId || 'PF20260908-0006'} 执行红字冲销？</div>
        <div className="nc-cell-sub" style={{ marginTop: 8 }}>红字冲销后：原单标记「已红字冲销」，生成负数单冲正；合同状态不回退；该笔不可再次红字冲销。</div>
      </Modal>

      {/* ============ 负数更正 ============ */}
      <Modal open={m === 'correct'} onClose={closeM} width={580} title="负数更正（决策 22 · 原行只读 · 不可删除）"
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('已追加负数更正行 · 原行保持只读 · 净额已刷新偏差与毛利率'); closeM(); }}>提交更正</Btn></>}>
        <Banner tone="warn">原登记行将<b>保持只读</b>，本操作<b>追加</b>一条负数流水；<b>禁止物理删除</b>。净额自动刷新成本偏差与毛利率。</Banner>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">更正对象（原行）</div>
            <select className="nc-input">{costRows.filter((c) => c.src === 'CB').map((c) => <option key={c.id}>{c.id} · {c.type} · {fmt(c.amt)}</option>)}</select></div>
          <div className="nc-field"><div className="nc-field-label is-req">更正金额（负数）</div><input className="nc-input" type="number" defaultValue={-62000} /></div>
          <div className="nc-field"><div className="nc-field-label">更正日期</div><input className="nc-input" type="date" defaultValue={TODAY} /></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">更正原因（留痕）</div><textarea className="nc-input" rows={3} placeholder="例：09-06 管理费录入重复" /></div>
        </div>
      </Modal>

      {/* ============ 登记成本 CB ============ */}
      <Modal open={m === 'cost'} onClose={closeM} width={560} title="＋ 登记成本"
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('CB 成本已登记 · 权责口径已刷新'); closeM(); }}>提交登记</Btn></>}>
        <div className="nc-form-grid">
          <div className="nc-field"><div className="nc-field-label is-req">成本类型</div>
            <select className="nc-input">{COST9.map((t) => <option key={t}>{t}</option>)}</select></div>
          <div className="nc-field"><div className="nc-field-label is-req">金额（元）</div><input className="nc-input" type="number" placeholder="0.00" /></div>
          <div className="nc-field"><div className="nc-field-label is-req">发生日期</div><input className="nc-input" type="date" defaultValue={TODAY} /></div>
          <div className="nc-field"><div className="nc-field-label">相对方</div><input className="nc-input" placeholder="供应商 / 班组" /></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">说明</div><textarea className="nc-input" rows={2} placeholder="例：9 月班组工资" /></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label">凭证</div><input className="nc-input" type="file" /></div>
        </div>
        <Banner tone="info">CB 登记即时计入权责口径（实际成本）；如需更正，走「负数更正」追加，不可删除原行。</Banner>
      </Modal>

      {/* ============ 归并到采购合同 ============ */}
      <Modal open={m === 'merge'} onClose={closeM} width={560} title="归并到采购合同"
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('无合同付款已归并 · 24h 内可撤销'); closeM(); }}>确认归并</Btn></>}>
        <Banner tone="info">归并向导 = <b>项目经理 + 管理员</b>执行；归并后 <b>24 小时内可撤销</b>，撤销留痕。</Banner>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">待归并付款</div>
            <select className="nc-input">{PAY_ROWS.filter((r) => r.kind === '无合同付款').map((r) => <option key={r.id}>{r.id} · {fmt(r.amt)}</option>)}</select></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">归并至采购合同</div>
            <select className="nc-input">{BUY_CT.map((c) => <option key={c.code}>{c.code} · {c.name}</option>)}</select></div>
        </div>
      </Modal>

      {/* ============ 保证金台账 ============ */}
      <Modal open={m === 'deposit'} onClose={closeM} width={860} title={`保证金台账 · ${P.name}`}
        foot={<Btn onClick={closeM}>关闭</Btn>}>
        <div className="nc-stat4">
          <div className="nc-stat4-cell">缴纳总额<b>{fmt(DEPOSITS.reduce((s, d) => s + d.amt, 0))}</b></div>
          <div className="nc-stat4-cell">已退还<b className="nc-v-green">{fmt(5000)}</b></div>
          <div className="nc-stat4-cell">已解除 · 待打款<b className="nc-v-orange">{fmt(0)}</b></div>
          <div className="nc-stat4-cell">未退余额<b className="nc-v-red">{fmt(depOutAmt)}</b></div>
        </div>
        <table className="nc-tbl" style={{ minWidth: 820 }}>
          <thead><tr><th style={{ width: 140 }}>单据</th><th style={{ width: 120 }}>类型</th><th>方向 / 对象</th>
            <th style={{ width: 120 }} className="is-num">金额</th><th style={{ width: 110 }}>缴纳日</th><th style={{ width: 110 }}>应退日</th>
            <th style={{ width: 110 }}>状态</th><th style={{ width: 130 }}>操作</th></tr></thead>
          <tbody>
            {DEPOSITS.map((d) => (
              <tr key={d.id} className={d.st === '未退' && d.due < TODAY ? 'is-warn-row' : ''}>
                <td><b>{d.id}</b></td><td>{d.type}</td>
                <td className="nc-cell-sub">{d.dir === 'in' ? ' 我方缴纳 · 待退回' : ' 我方收取 · 待退还'}<br />{d.party}</td>
                <td className="is-num">{fmt(d.amt)}</td><td>{d.pay}</td><td>{d.due}</td>
                <td><Tag tone={d.st === '未退' ? 'red' : 'green'}>{d.st}</Tag></td>
                <td>
                  {d.st === '未退' && d.dir === 'in'
                    ? <><Op onClick={() => { setDepRelId(d.id); setM('depRel'); }}>解除登记</Op><OpSep /><Op onClick={() => toast(`${d.id} 退还流程已发起 · 财务待办 T+3`)}>发起退还</Op></>
                    : d.st === '未退' ? <Op onClick={() => toast(`${d.id} 已退还客户`)}>退还客户</Op>
                      : <span className="nc-cell-sub">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="nc-cell-sub" style={{ marginTop: 8 }}>
          状态机：未退 →（解除登记）已解除 →（发起 / 退还）退还中 →（确认到账）已退还 ｜ 逾期行红底 ｜
          「已解除小计」= Σ已解除，全程留痕。
        </div>
      </Modal>

      {/* ============ 保证金解除登记 ============ */}
      <Modal open={m === 'depRel'} onClose={closeM} width={520} title="保证金解除登记"
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('解除登记完成：已解除小计已更新'); setM('deposit'); }}>确认解除</Btn></>}>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label">保证金</div>
            <input className="nc-input" readOnly value={DEPOSITS.find((d) => d.id === depRelId)?.id || ''} /></div>
          <div className="nc-field"><div className="nc-field-label is-req">解除金额</div>
            <input className="nc-input" defaultValue={DEPOSITS.find((d) => d.id === depRelId)?.amt || 0} /></div>
          <div className="nc-field"><div className="nc-field-label is-req">解除日期</div><input className="nc-input" type="date" defaultValue={TODAY} /></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label">依据附件</div><input className="nc-input" type="file" /></div>
        </div>
      </Modal>

      {/* ============ 推进里程碑 ============ */}
      <Modal open={m === 'mile'} onClose={closeM} width={640} title="推进里程碑"
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('里程碑已推进 · 资料已归档至项目附件'); closeM(); }}>确认推进</Btn></>}>
        <Banner tone="warn">验收类节点强制上传【竣工验收消防查验记录】+ 影像 + 签字件；通过后资料自动归档至【项目附件】对应里程碑。</Banner>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">推进至</div>
            <select className="nc-input"><option>M3 管线安装</option><option>M4 竣工验收</option><option>结算中</option><option>质保期</option></select></div>
          <div className="nc-field"><div className="nc-field-label is-req">计划完成日期</div><input className="nc-input" type="date" defaultValue={TODAY} /></div>
          <div className="nc-field"><div className="nc-field-label">实际完成日期</div><input className="nc-input" type="date" defaultValue={TODAY} /></div>
          <div className="nc-field"><div className="nc-field-label is-req">竣工验收消防查验记录（强制）</div><input className="nc-input" type="file" /></div>
          <div className="nc-field"><div className="nc-field-label is-req">影像资料（强制）</div><input className="nc-input" type="file" multiple /></div>
          <div className="nc-field"><div className="nc-field-label is-req">签字件（强制）</div><input className="nc-input" type="file" /></div>
          <div className="nc-field"><div className="nc-field-label">施工记录</div><input className="nc-input" type="file" multiple /></div>
        </div>
      </Modal>

      {/* ============ 竣工验收消防查验记录 ============ */}
      <Modal open={m === 'accept'} onClose={closeM} width={640} title="竣工验收消防查验记录"
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('竣工验收消防查验记录已提交 · 通过后归档至项目附件'); closeM(); }}>提交核验</Btn></>}>
        <table className="nc-tbl" style={{ minWidth: 560 }}>
          <thead><tr><th>核验项</th><th style={{ width: 90 }}>结果</th><th style={{ width: 190 }}>备注</th></tr></thead>
          <tbody>
            {['火灾自动报警系统联动测试', '自动喷淋系统试压与喷放', '防排烟系统风量测试', '应急照明与疏散指示连续供电', '消防水池 / 泵房联动'].map((n) => (
              <tr key={n}><td>{n}</td><td><Tag tone="green">合格</Tag></td><td className="nc-cell-sub">符合 GB 50166</td></tr>
            ))}
          </tbody>
        </table>
        <Banner tone="info">必传项未齐（核验单 + 影像 + 签字件）时不可提交；通过后由系统自动归档至对应里程碑附件组。</Banner>
      </Modal>

      {/* ============ 发起变更 ============ */}
      <Modal open={m === 'change'} onClose={closeM} width={560} title="发起变更"
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('变更已发起 · 进入审批流（PM 审核 → 商务审批 → 客户确认）'); closeM(); }}>提交变更</Btn></>}>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">变更类型</div>
            <select className="nc-input"><option>设计变更</option><option>工程量签证</option><option>材料替换</option><option>工期顺延</option></select></div>
          <div className="nc-field"><div className="nc-field-label is-req">变更金额（元）</div><input className="nc-input" type="number" placeholder="0.00" /></div>
          <div className="nc-field"><div className="nc-field-label">工期顺延（天）</div><input className="nc-input" type="number" placeholder="0" /></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">变更内容</div><textarea className="nc-input" rows={3} placeholder="例：增补机房气体灭火系统" /></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label">附件（图纸 / 签证单）</div><input className="nc-input" type="file" multiple /></div>
        </div>
        <Banner tone="info">闭环：变更生效后自动同步 ① 合同执行口径 ② 收款计划期次 ③ 盈利卡收入口径，全程留痕。</Banner>
      </Modal>

      {/* ============ 审批台 ============ */}
      <Modal open={m === 'approve'} onClose={closeM} width={680} title="审批台 · 待我审批"
        foot={<Btn onClick={closeM}>关闭</Btn>}>
        <table className="nc-tbl" style={{ minWidth: 600 }}>
          <thead><tr><th style={{ width: 160 }}>单据</th><th style={{ width: 90 }}>类型</th><th>摘要</th><th style={{ width: 120 }}>操作</th></tr></thead>
          <tbody>
            {APPROVALS.map((a) => (
              <tr key={a.id}><td><Code>{a.id}</Code></td><td><Tag tone="blue">{a.type}</Tag></td><td>{a.desc}</td>
                <td><><Op onClick={() => toast(`${a.id} 已通过`)}>通过</Op><OpSep /><Op danger onClick={() => setRejA(a)}>驳回</Op></></td></tr>
            ))}
          </tbody>
        </table>
      </Modal>

      {/* ============ 关联新合同 ============ */}
      <Modal open={m === 'link'} onClose={closeM} width={520} title="＋ 关联新合同"
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('合同已关联至本项目'); closeM(); }}>确认关联</Btn></>}>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">合同方向</div>
            <select className="nc-input"><option>销售合同</option><option>采购 / 分包合同</option></select></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">合同编号</div><input className="nc-input" placeholder="如 HT20260920-0015" /></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">合同名称</div><input className="nc-input" /></div>
          <div className="nc-field"><div className="nc-field-label is-req">金额（元）</div><input className="nc-input" type="number" /></div>
          <div className="nc-field"><div className="nc-field-label">相对方</div><input className="nc-input" /></div>
        </div>
      </Modal>

      {/* ============ 添加成员 ============ */}
      <Modal open={m === 'member'} onClose={closeM} width={520} title="＋ 添加成员"
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('成员已添加 · 权限已同步'); closeM(); }}>确认添加</Btn></>}>
        <div className="nc-form-grid">
          <div className="nc-field"><div className="nc-field-label is-req">姓名</div><input className="nc-input" /></div>
          <div className="nc-field"><div className="nc-field-label is-req">角色</div>
            <select className="nc-input"><option>项目经理</option><option>商务经理</option><option>财务专员</option><option>施工负责人</option><option>专职安全员</option></select></div>
          <div className="nc-field"><div className="nc-field-label">联系方式</div><input className="nc-input" placeholder="138****0000" /></div>
          <div className="nc-field"><div className="nc-field-label">加入时间</div><input className="nc-input" type="date" defaultValue={TODAY} /></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label">职责分工</div><textarea className="nc-input" rows={2} /></div>
        </div>
      </Modal>

      {/* ============ 上传附件 ============ */}
      <Modal open={m === 'upload'} onClose={closeM} width={520} title="上传附件"
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('附件已上传 · 与文档中心双向同源'); closeM(); }}>确认上传</Btn></>}>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">归属分组</div>
            <select className="nc-input">{ATTACH.map((g) => <option key={g.mile}>{g.mile}</option>)}</select></div>
          <div className="nc-field"><div className="nc-field-label">文件类型</div>
            <select className="nc-input"><option>竣工验收消防查验记录</option><option>影像资料</option><option>签字件</option><option>施工记录</option><option>其他</option></select></div>
          <div className="nc-field"><div className="nc-field-label">上传人</div><input className="nc-input" defaultValue="蓝峰" /></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">选择文件</div><input className="nc-input" type="file" multiple /></div>
        </div>
      </Modal>

      {/* ============ 催收记录 ============ */}
      <Modal open={m === 'dunning'} onClose={closeM} width={560} title="生成催收记录"
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('催收记录已生成 · 已推送至商务经理待办'); closeM(); }}>生成并推送</Btn></>}>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">催收对象</div>
            <select className="nc-input">{overdue.map((r) => <option key={r.id}>{r.id} · {fmt(r.amt)} · {r.use}</option>)}</select></div>
          <div className="nc-field"><div className="nc-field-label is-req">催收方式</div>
            <select className="nc-input"><option>电话催收</option><option>上门拜访</option><option>发函催告</option><option>法务函</option></select></div>
          <div className="nc-field"><div className="nc-field-label is-req">责任人</div>
            <select className="nc-input"><option>李商务（商务经理）</option><option>蓝峰（项目负责人）</option></select></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label">催收说明</div><textarea className="nc-input" rows={3} placeholder="记录沟通结果与下一步动作" /></div>
        </div>
      </Modal>

      {/* ============ 移除项目成员（评审 I1） ============ */}
      <ConfirmModal
        open={!!rmMb} onClose={() => setRmMb(null)} okText="确认移除"
        title="移除项目成员"
        reason reasonLabel="移除原因"
        impact={rmMb && <>将把 <b>{rmMb.name}</b>（{rmMb.role}）从本项目团队移除（软删除 · 记为已退出）。<br />移除后其<b>待办与责任事项将无人承接</b>；若该成员为专职安全员，安全生产职责需明确移交人后方可移除。</>}
        onOk={(r) => { toast(`${rmMb?.name} 已移除（软删除 · 已退出）并留痕，原因：${r}`); setRmMb(null); }}
      />

      {/* ============ 审批驳回（评审 I1 + B2：驳回必须写明依据，供发起人重新提交） ============ */}
      <ConfirmModal
        open={!!rejA} onClose={() => setRejA(null)} okText="确认驳回"
        title={`驳回审批单 ${rejA?.id ?? ''}`}
        reason reasonLabel="驳回理由（将推送给发起人，作为重新提交依据）"
        impact={rejA && <>将驳回 <b>{rejA.id}</b>（{rejA.type}）：{rejA.desc}。<br />驳回后单据回到发起人处，<b>需修改后重新提交</b>，审批链将重置至第 1 节点重新流转。</>}
        onOk={(r) => { toast(`${rejA?.id} 已驳回，理由已推送发起人待办：${r}`); setRejA(null); }}
      />
    </>
  );
}
