// 项目详情（项目经营中心）
//
// 版式原则（评审「二、收敛方案」）：一屏一主题，每个数字只出现一次，轴只留一条。
//   ┌ 头部：面包屑 + 标题 + 状态 Tag + 溯源链 + 操作区（发起变更 ｜ 确认里程碑 ｜ ⋯更多）
//   ├ 区1 项目档案卡：只读字段 + 项目描述
//   ├ 区2 经营指标：6 卡，每卡右上角统一「穿透↗」
//   ├ 区3 项目进度（全页唯一的轴）：里程碑轴 + 回款/成本双进度条 ｜ 风险聚合
//   ├ Tabs（10 个，对齐《产品设计文档》§9.2）：
//   │     ① 里程碑与日志 ② 关联合同 ③ 成本台账 ④ 收付款 ⑤ 报验与隐蔽
//   │     ⑥ 检测与验收 ⑦ 签证洽商 ⑧ 团队与证书 ⑨ 维保管理（仅维保型）⑩ 文档
//   └ 右下角全局「操作记录」抽屉（状态流转 + 操作明细）
//
// 口径（唯一事实源，全页共用）：
//   合同金额 = 已生效合同 + 审批中变更（BG）
//   已回款 + 未回款 + 已核销坏账 = 合同金额
//   回款进度 = 已回款 ÷ 合同金额        （不再保留「收入完成度」等同值指标）
//   质保金   = 合同金额 × 3%（法定上限）
//
// 硬规则：成本更正不可物理删除（负数追加）· 验收→结项须资料完整度 · 预收 >30 天归并
import React, { useEffect, useMemo, useState } from 'react';
import {
  Banner, Btn, Card, ConfirmModal, Drawer, EntityLink, KvGrid, Modal, Money, Op, OpMore, OpSep,
  PageHead, Progress, Steps, Tabs, Tag, Timeline, Tip, useToast, Code, pressProps,
} from '../components/ui';
import {
  ACCEPT_FLOW, ATT_WORKERS, CERTS, CONTRACTS, CUSTOMERS, EQUIPMENTS, MATERIALS, MILESTONE_LEGAL,
  OPPS, PROJECTS, PROJECT_STATUS_TONE, PROJECT_TERMINAL, QUOTES, TODAY, isOppClosed,
  attCost, attDays, fmt, fmtAmt, fmtPct, isServiceProject, isStdDocNo, laborRate, occOfProject, teamOfProject,
} from '../components/data';
import { applyChangeDelta, consumeFocusTab, getFocus, getProjects, moveProject, setFocus, subscribeStore } from '../components/store';
import { Ico } from '../components/icons';

/** 根据项目反查溯源链（商机 → 报价 → 合同） */
function traceOf(p: typeof PROJECTS[number]) {
  // 优先取已赢单商机，其次取在谈商机，保证溯源链指向真正成交的那条
  const opp = OPPS.find((o) => o.customerId === p.customerId && o.status === '赢单')
    || OPPS.find((o) => o.customerId === p.customerId && !isOppClosed(o));
  const quote = QUOTES.find((q) => q.customerId === p.customerId && q.status === '已转化');
  const contract = CONTRACTS.find((c) => c.project === p.id);
  return { opp, quote, contract };
}

/* ============================ 里程碑轴（全页唯一的轴） ============================
 * 节点状态：done 已完成 · cur 当前（唯一可确认） · '' 待开始
 * 「预计完成」显式写在节点文案里，避免裸日期被误读成开始日。
 * ========================================================================== */
const MILE_AXIS = [
  { name: 'M1 进场准备', date: '已完成 2026-09-20', st: 'done' },
  { name: 'M2 进场施工', date: '已完成 2026-09-22', st: 'done' },
  { name: 'M3 管线安装', date: '预计完成 2026-11-30', st: 'cur' },
  { name: 'M4 系统联调', date: '待开始', st: '' },
  { name: 'M5 竣工验收', date: '预计完成 2027-02-28', st: '' },
  { name: 'M6 质保期', date: '待开始', st: '' },
];

/* ============================ 预算科目（计划口径 · 行内编辑留痕） ============================ */
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

/* ============================ 成本流水 ============================
 * 来源：CG 采购归类 ｜ CB 登记 ｜ PF 无合同付款
 * mergedTo：已归并的无合同付款 —— 归并生效后原行保留（不删除）但置灰并标记去向。
 * ================================================================ */
type CostRow = {
  id: string; src: 'CG' | 'CB' | 'PF'; type: string; amt: number; date: string;
  note: string; st?: string; mergedTo?: string;
};
const COST_ROWS: CostRow[] = [
  { id: 'CG000003', src: 'CG', type: '材料费', amt: 1320000, date: '2026-08-12', note: '消防设备采购合同' },
  { id: 'CG000005', src: 'CG', type: '分包费', amt: 560000, date: '2026-08-20', note: '安装劳务分包合同' },
  { id: 'CB000002', src: 'CB', type: '人工费', amt: 210000, date: '2026-09-02', note: '8 月班组工资' },
  { id: 'CB000003', src: 'CB', type: '管理费', amt: 62000, date: '2026-09-06', note: '现场管理杂费' },
  {
    id: 'PF000004', src: 'PF', type: '分包费', amt: 180000, date: '2026-09-05',
    note: '无合同付款 · 应急采购风机', mergedTo: 'CG000005',
  },
  { id: 'PF000082', src: 'PF', type: '材料费', amt: 80000, date: '2026-09-19', note: '无合同付款 · 应急辅材', st: 'approving' },
];
const COST_BASE = COST_ROWS.reduce((s, r) => s + r.amt, 0); // 2,412,000
const COST9 = ['材料费', '分包费', '人工费', '机械费', '管理费', '设计费', '检测费', '税费', '其他'];
/** 成本来源简写 → 业务名称（界面不出现 CG / CB / PF 这类单据前缀缩写） */
const SRC_NAME: Record<string, string> = { CG: '采购', CB: '登记', PF: '无合同付款' };

/* ============================ 收支明细 ============================ */
type PayRow = {
  id: string; kind: string; contract: string; amt: number; use: string; st: string;
  date: string; hc?: string; mergedTo?: string;
};
const PAY_ROWS: PayRow[] = [
  /* 回款口径：仅银行已到账（paid）计入回款；已开票未到账（invoiced）挂应收账龄，不计回款 */
  { id: 'SK000001', kind: '收入', contract: 'HT000009', amt: 540000, use: '收款期次 1 · 预付款（30%）· 银行已到账', st: 'paid', date: '2026-09-12' },
  { id: 'SK000002', kind: '收入', contract: 'HT000009', amt: 337500, use: '收款期次 2 · 进度款（已开票未到账 · 账龄 75 天）', st: 'invoiced', date: '2026-07-20' },
  { id: 'PF000002', kind: '采购付款', contract: 'CG000003', amt: 573000, use: '设备预付款', st: 'paid', date: '2026-08-05' },
  {
    id: 'PF000004', kind: '无合同付款', contract: '—（项目级）', amt: 180000,
    use: '应急采购风机', st: 'paid', date: '2026-09-05', mergedTo: 'CG000005',
  },
  { id: 'PF000006', kind: '采购付款', contract: 'CG000003', amt: 250000, use: '设备进度款', st: 'flushed', date: '2026-09-08', hc: 'HC000047' },
  { id: 'PF000007', kind: '采购付款', contract: 'CG000003', amt: 45000, use: '运杂费', st: 'flushed', date: '2026-09-10', hc: 'HC000001' },
  { id: 'HC000047', kind: '红字冲销单', contract: '冲抵 PF000006', amt: -250000, use: '红字冲销 · 发票抬头错误（财务 · 王会计）', st: 'hc', date: '2026-09-15' },
  { id: 'HC000001', kind: '红字冲销单', contract: '冲抵 PF000007', amt: -45000, use: '红字冲销 · 重复提交（财务 · 王会计）', st: 'hc', date: '2026-09-16' },
  { id: 'PF000009', kind: '采购付款', contract: 'CG000003', amt: 80000, use: '辅材款', st: 'approving', date: '2026-09-18' },
  { id: 'PF000082', kind: '无合同付款', contract: '—（项目级）', amt: 80000, use: '应急辅材', st: 'approving', date: '2026-09-19' },
];
const PAY_FILTERS = ['全部', '收入', '采购付款', '无合同付款', '红字冲销单'];
const SUM_IN = PAY_ROWS.filter((r) => r.kind === '收入' && r.st === 'paid').reduce((s, r) => s + r.amt, 0);
const SUM_OUT = PAY_ROWS.filter((r) => r.kind !== '收入' && r.st === 'paid').reduce((s, r) => s + r.amt, 0);

/* ============================ 变更 ============================
 * st = '商务审批中' → 计入「合同金额（展示口径）」，不进现金
 * ============================================================ */
const CHANGES = [
  { id: 'BG0001', title: '材料调差价格调整补充协议（HT000009S1）', amt: 150000, st: '已生效', flowIdx: 4, by: '蓝峰', date: '2026-09-18', contract: 'HT000009', cat: '材料调差' },
  { id: 'BG000009', title: '机房气体灭火系统增补', amt: 80000, st: '商务审批中', flowIdx: 2, by: '蓝峰', date: '2026-09-12', contract: 'HT000009', cat: '材料费' },
];
const FLOW = ['发起', 'PM 审核', '商务审批', '客户确认', '生效'];

/** 单据号（前缀 + 6 位流水，对齐规格 §0.2）；非规范号自动挂「历史号」标注 */
const DocNo = ({ id }: { id: string }) => (
  <span className="nc-docno">
    <Code>{id}</Code>
    {!isStdDocNo(id) && <Tag tone="gray">历史号</Tag>}
  </span>
);

/* ---------- 经营基线派生 ---------- */
/** 审批中变更金额 —— 计入合同展示口径与权责，不计现金 */
const CHG_PENDING = CHANGES.filter((c) => c.st === '商务审批中').reduce((s, c) => s + c.amt, 0);
/** 已生效变更金额 —— 同步体现在预算科目行 */
const CHG_EFFECTIVE = CHANGES.filter((c) => c.st === '已生效').reduce((s, c) => s + c.amt, 0);
const CASH_IN = SUM_IN;
const CASH_OUT = SUM_OUT;
const NET_IN = CASH_IN - CASH_OUT;

/* ============================ 审批待办 ============================ */
const APPROVALS = [
  { id: 'BG000009', type: '变更', desc: `机房气体灭火系统增补 +${fmtAmt(80000)} · 商务审批` },
  { id: 'PF000009', type: '付款', desc: `辅材款 ${fmtAmt(80000)} · CG000003` },
  { id: 'PF000082', type: '付款', desc: `材料费 ${fmtAmt(80000)} · 无合同付款` },
];

/* ============================ 关联合同 ============================
 * 收款期次：plan 为计划日期（必须递增），got/gotDate 为实收，inv 为开票状态。
 * ================================================================ */
type PayStage = { n: string; amt: number; st: string; plan: string; got: number; gotDate: string; inv: string; note: string };
const SALE_CT: {
  code: string; name: string; st: string; tone: 'blue' | 'orange' | 'green';
  badge?: string; amt: number; role?: string;
  children?: { code: string; name: string; amt: number; note: string }[];
  payplan?: PayStage[];
}[] = [
  {
    /* 主合同：amt = 合同额（签约价 180 万，冻结）；children 挂价格调整类补充协议（增量进执行额） */
    code: 'HT000009', name: '昆明万达广场消防改造工程合同', st: '履约中', tone: 'blue', role: 'primary',
    badge: '工期倒计时 193 天 · 执行额 195 万 = 合同额 180 + 已生效变更 +15', amt: 1800000,
    children: [
      { code: 'HT000009S1', name: '价格调整补充协议（材料调差）', amt: 150000, note: '+15 万（增量）· 已签署生效 · 凭证 HT000009S1' },
    ],
    payplan: [
      { n: '收款期次 1 · 预付款', amt: 540000, st: '已到账', plan: '2026-08-20', got: 540000, gotDate: '2026-09-12', inv: '已开票', note: '30% 预付款 · 银行已到账' },
      { n: '收款期次 2 · 进度款', amt: 337500, st: '已开票·待到账', plan: '2026-09-01', got: 0, gotDate: '—', inv: '已开票', note: '已开票未到账 · 账龄 75 天（计入应收账龄，不计回款）' },
      { n: '收款期次 3 · 竣工结算款', amt: 1072500, st: '未到期', plan: '2027-03-31', got: 0, gotDate: '—', inv: '未开票', note: '竣工验收后结算' },
    ],
  },
  /* 新增服务类补充协议：独立成行 8 万 */
  { code: 'HT000009S2', name: '新增服务补充协议（联动调试培训）', st: '已签约', tone: 'green', role: 'supplement_service', amt: 80000 },
  /* 维保合同：独立成行 12 万 */
  { code: 'WB000123', name: '维保合同（验收后一年）', st: '待审批', tone: 'orange', role: 'maintenance', amt: 120000 },
];

/* ============================ 外部相关方（建设单位 / 监理 / 检测 / 备案 / 供应商分包） ============================
 * 我方团队统一取自 data.ts 的 teamOfProject()；此处只列外部单位对接人。
 * 状态语义统一为一种维度：外部相关方「合作中 / 已退场」，我方成员「在职 / 已离场」。
 * ========================================================================== */
type PartyRow = { name: string; role: string; org: string; phone: string; st: string };
const PARTIES: { key: string; g: string; tone: 'blue' | 'green' | 'orange' | 'purple'; rows: PartyRow[] }[] = [
  {
    key: 'owner', g: '建设单位', tone: 'green',
    rows: [{ name: '刘经理', role: '项目对接人', org: '昆明万达广场商业管理有限公司', phone: '138****6601', st: '合作中' }],
  },
  {
    key: 'sup', g: '监理单位', tone: 'orange',
    rows: [{ name: '何监理', role: '总监理工程师', org: '云南××工程监理有限公司', phone: '139****7702', st: '合作中' }],
  },
  {
    key: 'test', g: '第三方检测机构', tone: 'purple',
    rows: [{ name: '杨工', role: '检测项目负责人', org: '云南××消防检测有限公司', phone: '137****5503', st: '合作中' }],
  },
  {
    key: 'gov', g: '消防备案 / 监管', tone: 'blue',
    rows: [{ name: '李工', role: '消防备案对接人', org: '昆明市西山区消防救援大队', phone: '0871-6****119', st: '合作中' }],
  },
  {
    key: 'vendor', g: '供应商 / 分包', tone: 'purple',
    rows: [
      { name: '刘经理', role: '供货负责人', org: '云南××消防设备有限公司', phone: '138****3301', st: '合作中' },
      { name: '张经理', role: '劳务负责人', org: '昆明××建筑劳务有限公司', phone: '138****4402', st: '合作中' },
    ],
  },
];

/* ============================ 档案（按里程碑归组） ============================
 * reached：节点是否已到 —— 决定必传项缺失时红点颜色（未到=灰 / 已到仍缺=红 / 已传=绿）
 * 「验收查验记录」（竣工验收消防查验记录）只挂 M5，其余节点不再重复配置。
 * ========================================================================== */
type AttFile = { name: string; size: string; by: string; date: string };
const ATTACH: { mile: string; reached: boolean; req: string[]; files: AttFile[] }[] = [
  {
    mile: 'M1 进场准备', reached: true, req: ['施工方案报审', '开工令'],
    files: [
      { name: '施工方案报审表.pdf', size: '2.1MB', by: '陈工', date: '2026-09-18' },
      { name: '开工令.pdf', size: '0.8MB', by: '蓝峰', date: '2026-09-20' },
    ],
  },
  {
    mile: 'M2 进场施工', reached: true, req: ['进场报审表', '进场人员名单'],
    files: [
      { name: '进场报审表.pdf', size: '1.2MB', by: '陈工', date: '2026-09-22' },
      { name: '进场人员名单.xlsx', size: '0.3MB', by: '陈工', date: '2026-09-22' },
    ],
  },
  { mile: 'M3 管线安装（预计完成 2026-11-30）', reached: true, req: ['隐蔽工程验收记录', '影像资料'], files: [] },
  { mile: 'M4 系统联调（进行中 72%）', reached: true, req: ['联调报告', '影像资料'], files: [] },
  { mile: 'M5 竣工验收（预计完成 2027-02-28）', reached: false, req: ['验收查验记录', '竣工资料', '影像资料', '签字件'], files: [] },
  {
    mile: '项目级（合同 / 立项 / 其他）', reached: true, req: [],
    files: [
      { name: '消防改造合同-盖章版.pdf', size: '4.2MB', by: '李商务', date: '2026-09-12' },
      { name: '项目立项审批单.pdf', size: '0.6MB', by: '蓝峰', date: '2026-09-20' },
    ],
  },
];
const ATT_CNT = ATTACH.reduce((s, g) => s + g.files.length, 0);

/* ============================ 保证金台账（我方缴纳部分） ============================
 * 质保金是「结算时客户扣留」的应收义务，不属于我方缴纳台账，故单独派生，不与本表混算。
 * ========================================================================== */
const DEPOSITS = [
  { id: 'BZ000003', type: '履约保证金', dir: 'in', party: '云南××消防设备有限公司（CG000003）', amt: 12000, pay: '2026-09-01', due: '2026-09-15', st: '未退' },
  { id: 'BZ000002', type: '履约保证金', dir: 'in', party: '昆明万达广场商业管理有限公司', amt: 20000, pay: '2026-06-01', due: '2027-06-30', st: '未退' },
  { id: 'BZ000001', type: '投标保证金', dir: 'in', party: '昆明万达广场商业管理有限公司', amt: 5000, pay: '2026-05-20', due: '2026-06-10', st: '已退还' },
];

/* ============================ 状态流转（并入操作记录抽屉） ============================ */
const HIST = [
  { time: '2026-09-12', title: '创建项目（待启动）', tag: '手动', tone: 'gray' as const, cls: 'done', desc: '来源：合同立项 · 入口A 合同详情创建 · 合同交底已确认' },
  { time: '2026-09-18', title: '立项审批通过（待启动 → 执行中）', tag: '自动', tone: 'blue' as const, cls: 'sys', desc: '触发：终审通过 · 里程碑轴启用' },
  { time: '2026-09-20', title: 'M1 进场准备完成', tag: '手动', tone: 'blue' as const, cls: 'done', desc: '操作人：张工 · 已上传开工报告' },
  { time: '2026-09-22', title: 'M2 进场施工完成', tag: '手动', tone: 'blue' as const, cls: 'done', desc: '操作人：张工 · 关联打卡 12 人次' },
  { time: TODAY, title: '执行中 · 施工阶段（当前）', tag: '进行中', tone: 'orange' as const, cls: 'cur', desc: 'M3 管线安装进行中 72%' },
];

/* ============================ 操作记录 ============================ */
const OPS = [
  { t: '2026-09-19 17:42', w: '系统', tag: '自动', d: `无合同付款 PF000082 提交审批（材料费 ${fmtAmt(80000)} · 暂计入成本流水）` },
  { t: '2026-09-19 18:00', w: '蓝峰', tag: '手动', d: 'PF000004 归并 → CG000005（原行保留并置灰）' },
  { t: '2026-09-16 10:18', w: '财务 · 王会计', tag: '手动', d: '红字冲销 PF000007 → HC000001' },
  { t: '2026-09-15 15:03', w: '财务 · 王会计', tag: '手动', d: '红字冲销 PF000006 → HC000047' },
  { t: '2026-09-12 11:05', w: '蓝峰', tag: '手动', d: `发起变更 BG000009（+${fmtAmt(80000)}）` },
];

/* ============================ 现场投入数据（成本台账 · 现场投入子页） ============================ */
const MACH_ROWS = [
  { name: '25T 汽车吊', unit: '台班', qty: 12, price: 2400, date: '2026-09-24' },
  { name: '高空作业车', unit: '台班', qty: 18, price: 1600, date: '2026-10-02' },
  { name: '电焊机（含耗材）', unit: '台班', qty: 26, price: 320, date: '2026-10-15' },
  { name: '管道试压泵', unit: '台班', qty: 6, price: 580, date: '2026-10-28' },
];
const MAT_USE = [
  { code: 'CL000123', qty: 1860, date: '2026-09-23' },
  { code: 'CL000145', qty: 420, date: '2026-09-26' },
  { code: 'CL000188', qty: 640, date: '2026-09-28' },
  { code: 'EQ000002', qty: 260, date: '2026-09-30' },
  { code: 'CL000177', qty: 34, date: '2026-10-06' },
  { code: 'EQ000001', qty: 2, date: '2026-10-09' },
];
const SAFE_ROWS = [
  { item: '临时用电箱接地检查', res: '合格', by: '陈工', date: '2026-09-22' },
  { item: '高处作业安全带佩戴', res: '合格', by: '陈工', date: '2026-09-24' },
  { item: '动火作业审批与看护', res: '整改后合格', by: '陈工', date: '2026-09-26' },
  { item: '消防通道占用排查', res: '合格', by: '张工', date: '2026-09-28' },
  { item: '焊接作业区灭火器配置', res: '合格', by: '陈工', date: '2026-10-02' },
];

/* ============================ ① 里程碑与施工日志（规格 §9.2 Tab① · PRJ-04） ============================
 * 里程碑表由系统模板（按项目类型）一键套用后可增删改；法定节点（隐蔽验收 / 第三方检测 / 消防验收备案）
 * 删除须二次确认。施工日志可关联移动端打卡记录（本平台只读消费）。
 * ========================================================================== */
type MileRow = { n: string; plan: string; act: string; st: string; owner: string };
const MILE_ROWS: MileRow[] = [
  { n: 'M1 进场准备', plan: '2026-09-20', act: '2026-09-20', st: '已完成', owner: '张工' },
  { n: 'M2 材料进场报验', plan: '2026-09-24', act: '2026-09-24', st: '已完成', owner: '陈工' },
  { n: 'M3 隐蔽工程验收', plan: '2026-10-08', act: '2026-10-08', st: '已完成', owner: '何监理' },
  { n: 'M4 管线安装', plan: '2026-11-30', act: '—', st: '进行中', owner: '张工' },
  { n: 'M5 设备安装', plan: '2026-12-20', act: '—', st: '待开始', owner: '张工' },
  { n: 'M6 系统调试', plan: '2027-01-15', act: '—', st: '待开始', owner: '王工' },
  { n: 'M7 第三方消防检测', plan: '2027-02-10', act: '—', st: '待开始', owner: '杨工' },
  { n: 'M8 消防验收备案', plan: '2027-02-28', act: '—', st: '待开始', owner: '李工' },
  { n: 'M9 竣工资料', plan: '2027-03-15', act: '—', st: '待开始', owner: '陈静' },
  { n: 'M10 结算', plan: '2027-03-31', act: '—', st: '待开始', owner: '王会计' },
];
const MILE_ST_TONE: Record<string, 'green' | 'blue' | 'gray' | 'red'> = {
  已完成: 'green', 进行中: 'blue', 待开始: 'gray', 逾期: 'red',
};
type SiteLog = { date: string; weather: string; text: string; photos: number; att?: string };
const SITE_LOGS: SiteLog[] = [
  { date: '2026-10-06', weather: '晴 18~26℃', text: '三区喷淋支管安装 68 根，当区完成 72%；隐蔽验收记录（三区）已上传归档。', photos: 6, att: 'AT20261006012' },
  { date: '2026-10-05', weather: '多云 17~24℃', text: '二区报警总线敷设 320m；第二批材料进场报验单经监理签认。', photos: 4, att: 'AT20261005009' },
  { date: '2026-10-03', weather: '小雨 15~21℃', text: '雨天停止室外作业，转为消控室主机接线与回路测试。', photos: 3, att: 'AT20261003005' },
  { date: '2026-09-30', weather: '晴 19~28℃', text: '一区管线安装完成并通过隐蔽验收，监理签认 3 份。', photos: 8, att: 'AT20260930021' },
];

/* ============================ ⑤ 报验与隐蔽（规格 §9.2 Tab⑤ · PRJ-09） ============================
 * 进场报验：系统按材料「进场报验要求」（CCC / 检测报告 / 合格证）自动校验附件，缺件硬拦截。
 * ========================================================================== */
type Arrival = { no: string; batch: string; date: string; items: string; need: string[]; have: string[]; sign: string };
const ARRIVALS: Arrival[] = [
  { no: 'JCBY000012', batch: '第 3 批', date: '2026-10-04', items: '镀锌钢管 DN100 × 1860m、沟槽卡箍 × 640 只', need: ['合格证', '检测报告'], have: ['合格证', '检测报告'], sign: '已签认' },
  { no: 'JCBY000011', batch: '第 2 批', date: '2026-09-26', items: '点型感烟探测器 × 420 只、输入输出模块 × 260 只', need: ['合格证', '3C 证书'], have: ['合格证'], sign: '缺件退回' },
  { no: 'JCBY000010', batch: '第 1 批', date: '2026-09-23', items: '消火栓箱 × 34 套、防火阀 × 28 只', need: ['合格证', '3C 证书', '检测报告'], have: ['合格证', '3C 证书', '检测报告'], sign: '已签认' },
];
type Hidden = { part: string; date: string; content: string; photos: number; sign: string };
const HIDDEN: Hidden[] = [
  { part: '一区 · 喷淋支管隐蔽', date: '2026-09-30', content: '支管标高、坡度、支架间距、防腐处理经监理验收合格', photos: 8, sign: '何监理（已签认）' },
  { part: '二区 · 报警总线穿管隐蔽', date: '2026-10-08', content: '线管保护、防火封堵、跨接线连接经验收合格', photos: 6, sign: '何监理（已签认）' },
];

/* ============================ ⑥ 检测与验收（规格 §9.2 Tab⑥ · PRJ-08） ============================
 * 验收状态机：未申报 → 已申报 → 整改中（可多轮，每轮记录整改项与复验日）→ 已通过 → 已备案。
 * ========================================================================== */
const CHECK_INFO = {
  org: '云南××消防检测有限公司', no: 'JC2027-0219', date: '—', res: '—',
  note: '完工（M6 系统调试完成）后由项目经理发起委托，报告归档至「文档 · 验收」分类。',
};
type AcceptRound = { r: number; date: string; items: string; recheck: string; by: string };
const ACCEPT_ROUNDS: AcceptRound[] = [
  { r: 1, date: '—', items: '—', recheck: '—', by: '—' },
];

/* ============================ ⑦ 签证洽商（规格 §9.2 Tab⑦ · PRJ-11） ============================
 * 未走完合同变更（CON-05）审批与补充协议的签证，不计入 execAmt、不可据此收款。
 * ========================================================================== */
type Visa = { no: string; date: string; reason: string; amt: number; photos: number; sign: string; chg: string; chgSt: string };
const VISAS: Visa[] = [
  { no: 'QZ000007', date: '2026-09-28', reason: '商场 B1 机房新增气体灭火系统（甲方口头要求）', amt: 80000, photos: 5, sign: '已签认', chg: 'BG000009', chgSt: '商务审批中' },
  { no: 'QZ000006', date: '2026-10-02', reason: '二区吊顶内新增桥架绕行（现场洽商）', amt: 23500, photos: 3, sign: '待签认', chg: '—', chgSt: '未生成变更单' },
];

/* ============================ ⑨ 维保管理（规格 §9.2 Tab⑨ · PRJ-10，仅维保型项目） ============================ */
type MaintPlan = { cycle: string; scope: string; next: string; st: string };
const MAINT_PLANS: MaintPlan[] = [
  { cycle: '月检', scope: '全院消防设施外观与功能巡检（36 点位）', next: '2026-10-01', st: '待执行' },
  { cycle: '季检', scope: '消火栓系统、喷淋系统联动测试', next: '2026-12-01', st: '待执行' },
  { cycle: '年检', scope: '全系统联动测试 + 第三方检测配合', next: '2027-09-01', st: '待执行' },
];
type MaintIssue = { no: string; from: string; level: string; desc: string; found: string; due: string; owner: string; st: string; inWarranty: string };
const MAINT_ISSUES: MaintIssue[] = [
  { no: 'WT000021', from: '巡检', level: '一般', desc: '3F 东侧防火门闭门器失效', found: '2026-09-18', due: '2026-09-25', owner: '李工', st: '待确认', inWarranty: '质保内' },
  { no: 'WT000020', from: '报修', level: '紧急', desc: 'B 区消火栓压力不足', found: '2026-09-15', due: '2026-09-17', owner: '李工', st: '已销项', inWarranty: '质保内' },
  { no: 'WT000018', from: '巡检', level: '一般', desc: '2F 应急照明持续供电时间不足 90min', found: '2026-09-02', due: '2026-09-09', owner: '陈工', st: '已销项', inWarranty: '质保外' },
];

const PAY_ST: Record<string, { t: 'green' | 'orange' | 'red' | 'blue' | 'gray'; n: string }> = {
  paid: { t: 'green', n: '已到账 / 已付' },
  invoiced: { t: 'orange', n: '已开票·待到账' },
  overdue: { t: 'red', n: '逾期未收' },
  flushed: { t: 'gray', n: '已红字冲销' },
  hc: { t: 'gray', n: '红字冲销单' },
  approving: { t: 'blue', n: '审批中 · 不计现金' },
};

/**
 * 页签 key（用于 URL 同步校验）。10 个 Tab 对齐《产品设计文档》§9.2；
 * 「维保管理」仅在维保型项目（type = 维护保养）显示，其余项目不出现该页签。
 */
const TAB_KEYS = ['mile', 'progress', 'contract', 'cost', 'pay', 'arrival', 'accept', 'visa', 'team', 'maint', 'doc'];

export default function ProjectCenterPage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  /** 穿透目标项目：按 nav 重算，保证层层下钻始终定位到当前项目（取不到回落首条） */
  /* 项目台账走共享 store：状态流转（暂停 / 恢复 / 关闭 / 重开 / 作废）后本页即时刷新 */
  const [projects, setProjects] = useState(getProjects);
  useEffect(() => subscribeStore(() => setProjects(getProjects())), []);
  const P = useMemo(() => {
    const id = getFocus('project-center');
    return projects.find((p) => p.id === id) || projects[0];
  }, [nav, projects]);

  /** 付款类合同：从 CONTRACTS 按当前项目 + 采购/分包类型派生（不再硬编码金额） */
  const BUY_CT = useMemo(() => CONTRACTS
    .filter((c) => c.project === P.id && (c.type === '采购合同' || c.type === '分包合同'))
    .map((c) => ({
      code: c.id, name: c.name, st: c.status,
      tone: (c.status === '履约中' ? 'blue' : c.status === '已完成' ? 'green' : 'orange') as 'blue' | 'green' | 'orange',
      amt: c.amt,
      warn: (c as any).warn,
    })), [P.id]);

  /**
   * Tab 与 URL 同步：hash 形如 #page=project-center&tab=cost。
   * 刷新 / 分享链接可直达同一页签；切换用 replaceState，不触发 hashchange 造成回环。
   */
  const [tab, setTabState] = useState<string>(() => {
    if (typeof window === 'undefined') return 'mile';
    const t = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('tab');
    return t && TAB_KEYS.includes(t) ? t : 'mile';
  });
  const setTab = (k: string) => {
    setTabState(k);
    if (typeof window === 'undefined') return;
    const raw = window.location.hash.replace(/^#/, '');
    const base = raw.split('&')[0] || 'page=project-center';
    window.history.replaceState(null, '', `#${base}&tab=${k}`);
  };
  /** 跨页深链：调用方先 setFocusTab('project-center', 'cost') 再跳转，本页消费一次即清除 */
  useEffect(() => {
    const t = consumeFocusTab('project-center');
    if (t && TAB_KEYS.includes(t)) setTab(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav]);
  const [hintOpen, setHintOpen] = useState(true);   // 页级提示条（口径与资料缺项）
  const [costSub, setCostSub] = useState('led');   // 成本台账子页：明细 / 现场投入
  const [paySub, setPaySub] = useState('flow');    // 收付款子页：收支明细 / 保证金
  const [ctOpen, setCtOpen] = useState(true);      // 合同卡片：期次表行内展开（不跳页）
  const [payFilter, setPayFilter] = useState('全部');
  const [planEdits, setPlanEdits] = useState<Record<string, number>>({});
  const [drill, setDrill] = useState<string | null>(null);
  const [m, setM] = useState<string | null>(null);
  const [logOpen, setLogOpen] = useState(false);   // 右下角全局「操作记录」抽屉
  const [flushId, setFlushId] = useState('');
  const [depRelId, setDepRelId] = useState<string | null>(null);
  const [rmMb, setRmMb] = useState<{ name: string; role: string } | null>(null);
  const [rejA, setRejA] = useState<(typeof APPROVALS)[number] | null>(null);
  const [delFile, setDelFile] = useState<AttFile | null>(null);
  /* 变更双模式录入：increment 增量式（直接填增量）/ total 总额式（填总额自动反算增量） */
  const [chgMode, setChgMode] = useState<'increment' | 'total'>('increment');
  const [chgAmt, setChgAmt] = useState<string>('');
  const [chgReason, setChgReason] = useState('');

  /* ---------- 经营口径（唯一事实源） ---------- */
  const REV = P.contractAmt;                                        // 合同额 = 主合同签约价（冻结锚点）
  /** 合同额口径 = 仅主合同签约价（立项锚点），不含已生效/审批中变更、不含维保/新增服务独立合同 */
  const CONTRACT_NOW = REV;
  /** 执行额 = 主合同签约价 + 已生效变更增量（变更只进执行额，合同额冻结不动） */
  const EXEC_AMT = P.execAmt;
  /** 已核销坏账（本项目无） */
  const BAD_DEBT = 0;
  /** 未回款 = 执行额 − 已到账 − 坏账（已开票未到账计入应收账龄） */
  const UNRECV = EXEC_AMT - CASH_IN - BAD_DEBT;
  /** 回款进度 = 银行已到账 ÷ 执行额 */
  const PAY_PROGRESS = EXEC_AMT > 0 ? (CASH_IN / EXEC_AMT) * 100 : 0;
  /** 质保金 = 合同额 × 3%（法定上限） */
  const WARRANTY = Math.round(CONTRACT_NOW * 0.03);

  /** 客户穿透目标：优先按 customerId 外键，回落按客户名匹配 */
  const custId = (P as { customerId?: string }).customerId
    || CUSTOMERS.find((c) => c.name === P.customer)?.id;

  /* ---------- 成本同源化：目标成本（立项预算）与实际成本（已发生）解耦 ---------- */
  /** 目标成本（立项预算）= 130 万；planRows 缩放到该值，与实际成本并排对比 */
  const TARGET_COST = 1300000;
  const planScale = TARGET_COST / PLAN_BASE;
  /** 实际成本 = P.cost（已发生）；costRows 缩放到该值 */
  const costScale = P.cost > 0 ? P.cost / COST_BASE : 1;
  const planRows = useMemo(
    () => PLAN_ROWS.map((r) => ({ ...r, amt: Math.round(r.amt * planScale) })),
    [planScale],
  );
  const costRows = useMemo(
    () => COST_ROWS.map((r) => ({ ...r, amt: Math.round(r.amt * costScale) })),
    [costScale],
  );
  /** 预算科目两级分组：直接费 / 间接费 */
  const GROUPED_PLAN = useMemo(() => {
    const G: { g: string; types: string[] }[] = [
      { g: '直接费', types: ['材料费', '分包费', '人工费', '机械费'] },
      { g: '间接费', types: ['管理费', '检测费', '设计费', '税费'] },
    ];
    return G.map((x) => {
      const rows = planRows.filter((r) => x.types.includes(r.type));
      return { g: x.g, rows, sum: rows.reduce((a, r) => a + r.amt, 0) };
    }).filter((x) => x.rows.length > 0);
  }, [planRows]);
  const PLAN_SUM = planRows.reduce((s, r) => s + r.amt, 0);
  const COST_SUM = costRows.reduce((s, r) => s + r.amt, 0);
  /** 预算含变更后的合计（已生效变更计入，审批中变更虚线展示） */
  const PLAN_WITH_CHG = PLAN_SUM + CHG_EFFECTIVE + CHG_PENDING;

  const dev = COST_SUM - PLAN_SUM;
  const devPct = PLAN_SUM > 0 ? (dev / PLAN_SUM) * 100 : 0;
  /** 成本进度 = 已发生 ÷ 预算 */
  const COST_PROGRESS = PLAN_SUM > 0 ? (COST_SUM / PLAN_SUM) * 100 : 0;
  /**
   * 毛利率口径（全页统一）：
   *   毛利率 =（合同金额 − 成本）÷ 合同金额
   *   计划值取立项预算，实际值取已发生成本。
   */
  const planProfit = CONTRACT_NOW > 0 ? ((CONTRACT_NOW - PLAN_SUM) / CONTRACT_NOW) * 100 : 0;
  const actProfit = CONTRACT_NOW > 0 ? ((CONTRACT_NOW - COST_SUM) / CONTRACT_NOW) * 100 : 0;

  /** 应收账龄：已开票未到账（不计回款） */
  const overdue = PAY_ROWS.filter((r) => r.st === 'invoiced');
  const overdueAmt = overdue.reduce((s, r) => s + r.amt, 0);
  /** 进度（产值权重法，工序填报自动汇总；禁止手工填百分比） */
  const progActual = P.progressActual ?? 0;
  const progPlan = P.progressPlan ?? 0;
  const progDev = Math.round((progActual - progPlan) * 10) / 10;
  const progLevel: 'red' | 'yellow' | 'ok' = progDev <= -20 ? 'red' : progDev <= -10 ? 'yellow' : 'ok';
  const progTag = progLevel === 'red' ? '红警' : progLevel === 'yellow' ? '黄警' : '正常';
  /** 我方缴纳、尚未退回的保证金 */
  const depIn = DEPOSITS.filter((d) => d.dir === 'in' && d.st === '未退');
  const depInAmt = depIn.reduce((s, d) => s + d.amt, 0);
  /** 保证金台账展示行 = 我方缴纳台账 + 派生的质保金义务行 */
  const depositRows = [
    ...DEPOSITS,
    {
      id: `ZB-${P.id}`, type: '质保金（结算时客户扣留）', dir: 'out',
      party: `${P.customer}（${P.id}）`, amt: WARRANTY,
      pay: '—', due: '结算后 12 个月', st: '待扣留',
    },
  ];

  /* ---------- 里程碑：全页唯一可确认节点 ---------- */
  const curMile = MILE_AXIS.find((x) => x.st === 'cur');
  /** 当前节点资料齐备性（决定「确认里程碑」可否提交） */
  const curReq = ATTACH.find((g) => g.mile.startsWith(curMile?.name.slice(0, 2) || '##'))?.req || [];
  const curFiles = ATTACH.find((g) => g.mile.startsWith(curMile?.name.slice(0, 2) || '##'))?.files || [];
  const curMiss = curReq.filter((r) => !curFiles.some((f) => f.name.includes(r.slice(0, 4))));

  /* ---------- 现场投入派生（人工 / 机械 / 材料设备，供成本台账「现场投入」子页） ---------- */
  const siteWorkers = useMemo(() => {
    const hit = ATT_WORKERS.filter((w) => w.proj === P.id);
    return hit.length ? hit : ATT_WORKERS.slice(0, 4);
  }, [P.id]);
  const laborRows = siteWorkers.map((w) => ({
    id: w.id, name: w.name, trade: w.trade, team: w.team,
    days: attDays(w, 21), rate: laborRate(w.trade), cost: attCost(w, 21),
  }));
  const laborSum = laborRows.reduce((a, b) => a + b.cost, 0);
  const machRows = useMemo(() => MACH_ROWS.map((r) => ({ ...r, amt: r.qty * r.price })), []);
  const machSum = machRows.reduce((a, r) => a + r.amt, 0);
  const matRows = useMemo(
    () => MAT_USE.map((u) => {
      const it = MATERIALS.find((x) => x.code === u.code) || EQUIPMENTS.find((x) => x.code === u.code);
      return {
        code: u.code, date: u.date, qty: u.qty,
        name: it?.name || '—', spec: it?.spec || '—', unit: it?.unit || '—',
        ty: it?.ty || '材料', price: it?.price || 0, stock: it?.stock ?? 0,
        amt: Math.round((it?.price || 0) * u.qty),
      };
    }),
    [],
  );
  const matSum = matRows.reduce((a, r) => a + r.amt, 0);

  /* ---------- ⑧ 团队与证书 ---------- */
  /** 项目团队：统一取自 data.ts（缺省给通用班组，保证 Tab 不空） */
  const teamRows = useMemo(() => teamOfProject(P.id, P.pm), [P.id, P.pm]);
  /** 证书占用：本项目在用的占用记录（规格 §4.3 独立实体，非 CERTS.used 数组） */
  const certRows = useMemo(() => occOfProject(P.id), [P.id]);
  /** 证书有效期：由证书主数据反查 */
  const certValidTo = (certId: string) => CERTS.find((c) => c.id === certId)?.validTo || '—';

  const payRows = payFilter === '全部' ? PAY_ROWS : PAY_ROWS.filter((r) => r.kind === payFilter);
  /** 类别对比：9 个枚举全部列出，零值显示「—」而不是画空条 */
  const bars = COST9.map((t) => {
    const act = costRows.filter((r) => r.type === t).reduce((s, r) => s + r.amt, 0);
    const pln = planRows.filter((r) => r.type === t).reduce((s, r) => s + r.amt, 0);
    return { t, act, pln, max: Math.max(act, pln) };
  });
  const barMax = Math.max(...bars.map((b) => b.max), 1);

  /** 当前待冲销单据 */
  const flushRow = PAY_ROWS.find((r) => r.id === flushId);

  /** 督办事项条数：与右栏实际渲染的条目一一对应，不做硬编码计数 */
  const dunCount = [overdue.length > 0, dev > 0, APPROVALS.length > 0, depIn.length > 0].filter(Boolean).length;
  /** 溯源链（商机 → 报价 → 合同）：页头与「项目全景」共用同一份事实 */
  const TR = useMemo(() => traceOf(P), [P]);
  /** 当前节点资料完整度（需求：节点确认须资料齐备） */
  const curFilePct = curReq.length ? Math.round(((curReq.length - curMiss.length) / curReq.length) * 100) : 100;

  const openM = (k: string) => setM(k);
  const closeM = () => setM(null);

  return (
    <>
      <PageHead
        crumbs={['项目管理', '项目列表', '项目详情']}
        title={<span className="nc-pjtitle"><Code>{P.id}</Code> {P.name} <Op onClick={() => toast('已复制项目编号 ' + P.id)}>⧉ 复制</Op></span>}
        badges={<>
          <Tag tone="blue">{P.type}</Tag>
          {isServiceProject(P) && <Tag tone="purple">含维保服务</Tag>}
          <Tag tone={(PROJECT_STATUS_TONE[P.status] || 'blue') as 'blue'}>{P.status} · {P.milestoneName}</Tag>
        </>}
        sub={<span className="nc-pjtrace">溯源链：
          {TR.opp ? <><EntityLink target="opp" id={TR.opp.id} go={go} title="下钻到商机详情">商机 {TR.opp.id}</EntityLink> → </> : <span className="nc-muted">无关联商机 → </span>}
          {TR.quote ? <><EntityLink target="quote-detail" id={TR.quote.id} go={go} title="下钻到报价详情">报价 {TR.quote.id}</EntityLink> → </> : <span className="nc-muted">无关联报价 → </span>}
          {TR.contract ? <><EntityLink target="contract" id={TR.contract.id} go={go} title="下钻到合同详情">合同 {TR.contract.id}</EntityLink> → </> : <span className="nc-muted">无关联合同 → </span>}
          本项目
        </span>}
        actions={<>
          <Btn onClick={() => openM('change')}><Ico n="swap" size={16} /> 发起变更</Btn>
          <Btn
            kind="primary" disabled={!curMile} onClick={() => openM('mile')}
            title={curMile ? `确认 ${curMile.name}` : '当前无待确认节点'}
          >确认里程碑</Btn>
          <OpMore items={[
            /* 状态 × 按钮（规格 §9.5）：推荐动作随状态机切换，其余动作常驻 */
            ...(P.status === '待启动' ? [{
              label: '进入执行（进场 / 合同就绪）',
              title: '状态流转：待启动 → 执行中',
              onClick: () => { moveProject(P.id, '执行中'); toast(`${P.id} 已进入执行中`); },
            }] : []),
            ...(P.status === '执行中' ? [{
              label: '暂停项目（必填原因）',
              title: '状态流转：执行中 → 暂停，须填写暂停原因并留痕',
              onClick: () => openM('pause'),
            }] : []),
            ...(P.status === '暂停' ? [{
              label: '恢复执行（必填原因）',
              title: '状态流转：暂停 → 执行中，须填写恢复原因并留痕',
              onClick: () => openM('resume'),
            }] : []),
            ...(P.status === '验收结算中' ? [
              { label: '登记第三方消防检测', onClick: () => openM('check') },
              { label: '登记消防验收备案', onClick: () => openM('accept') },
              { label: '确认结算额', onClick: () => openM('settle') },
            ] : []),
            ...(P.status === '已结项' ? [{
              label: '转维保服务中',
              title: '含维保服务时，结项后可转入长期维保服务',
              onClick: () => { moveProject(P.id, '维保服务中'); toast(`${P.id} 已转维保服务中`); },
            }] : []),
            ...(P.status === '维保服务中' ? [{
              label: '终止服务', danger: true,
              title: '服务终止：维保服务中 → 已关闭（可重开）',
              onClick: () => openM('close'),
            }] : []),
            ...(P.status === '已关闭' ? [{
              label: '重开项目',
              title: '状态流转：已关闭 → 执行中',
              onClick: () => { moveProject(P.id, '执行中'); toast(`${P.id} 已重开`); },
            }] : []),
            ...(!(PROJECT_TERMINAL as readonly string[]).includes(P.status) ? [{
              label: '作废项目', danger: true,
              title: '作废 = 建错，留痕不可恢复',
              onClick: () => openM('void'),
            }] : []),
            { label: '关联新合同', onClick: () => openM('link') },
            { label: '登记收款', onClick: () => openM('pay') },
            { label: '登记成本', onClick: () => openM('cost') },
            { label: '上传档案', onClick: () => openM('upload') },
          ]} />
          <Btn onClick={() => openM('panorama')}><Ico n="search" size={16} /> 项目全景</Btn>
        </>}
      />

      {/* ============ 经营概览条（5 项绝对值 · 全页只出现这一次） ============ */}
      <div className="nc-ovstrip">
        <button className="nc-ovcell" onClick={() => setDrill('rev')}>
          <span className="nc-ovcell-k">合同额 <span className="nc-drill">穿透↗</span></span>
          <b className="nc-ovcell-v num">{fmtAmt(CONTRACT_NOW)}</b>
          <span className="nc-ovcell-sub">主合同签约价（立项锚点，不含维保/新增服务）· 执行额 {fmtAmt(EXEC_AMT)} = {fmtAmt(REV)} + 已生效变更 +{fmtAmt(CHG_EFFECTIVE)}</span>
        </button>
        <button className="nc-ovcell" onClick={() => setDrill('in')}>
          <span className="nc-ovcell-k">已回款 <span className="nc-drill">穿透↗</span></span>
          <b className="nc-ovcell-v num nc-v-green">{fmtAmt(CASH_IN)}</b>
          <span className="nc-ovcell-sub">回款 = 银行已到账 · {fmtPct(PAY_PROGRESS)} ÷ 执行额；开票未收 {fmtAmt(overdueAmt)} 计入应收账龄，不计回款</span>
        </button>
        <button className="nc-ovcell" onClick={() => setTab('progress')}>
          <span className="nc-ovcell-k">施工进度</span>
          <b className="nc-ovcell-v num">{progActual}%</b>
          <span className="nc-paybar" style={{ width: '100%' }}><i style={{ width: progActual + '%' }} /></span>
          <span className="nc-ovcell-sub">产值权重法 · 实际 {progActual}% / 计划 {progPlan}% · 偏差 {progDev >= 0 ? '+' : ''}{progDev}% {progTag}</span>
        </button>
        <button className="nc-ovcell" onClick={() => setDrill('net')}>
          <span className="nc-ovcell-k">项目净现金流 <span className="nc-drill">穿透↗</span></span>
          <b className={`nc-ovcell-v num${NET_IN >= 0 ? ' nc-v-green' : ' nc-v-red'}`}>{NET_IN >= 0 ? '+' : ''}{fmtAmt(NET_IN)}</b>
          <span className="nc-ovcell-sub">已回款 − 已付成本</span>
        </button>
      </div>

      {/* 风险标签条已并入「进度与督办 · 督办事项」：同一批风险不在两处各说一遍 */}

      {/* ============ 常用动作（高频登记前置 · 低频动作仍留在页头 ⋯更多） ============ */}
      <div className="nc-actbar">
        <span className="nc-actbar-lb">高频登记</span>
        <Btn size="sm" onClick={() => openM('pay')}>登记收款</Btn>
        <Btn size="sm" onClick={() => openM('cost')}>登记成本</Btn>
        <Btn size="sm" onClick={() => openM('inspect')}>现场巡检</Btn>
        <Btn size="sm" onClick={() => openM('visa')}>签证洽商</Btn>
      </div>

      {/* ============ 页级提示条（取数口径 + 当前节点资料完整度 · 可收起） ============ */}
      {hintOpen && (
        <div className="nc-hintbar">
          <Banner tone="gold" actions={<>
            {curMiss.length > 0 && <Op onClick={() => setTab('doc')}>去补资料 →</Op>}
            <Op onClick={() => setHintOpen(false)}>收起</Op>
          </>}>
            合同额=主合同签约价；执行额=合同额+已生效变更；回款=银行已到账（开票未收挂应收）。
            {curMile ? (
              <> 当前节点 <b>{curMile.name}</b>（{curMile.date}）资料完整度 <b>{curFilePct}%</b>
                {curMiss.length > 0
                  ? <>，仍缺 {curMiss.map((x) => `【${x}】`).join('')}，补齐后方可提交节点确认。</>
                  : <>，资料已齐备，可提交节点确认。</>}
              </>
            ) : <> 里程碑节点已全部完成，可进入验收结算。</>}
          </Banner>
        </div>
      )}

      {/* ============ 基本信息（2 列常显 · 派生字段只读） ============ */}
      <Card
        style={{ marginTop: 16 }}
        hd={<span><Ico n="clipboard" size={16} /> 基本信息</span>}
        extra={<>
          <Btn size="sm" onClick={() => openM('edit')}>编辑</Btn>
          <OpMore items={[
            { label: '导出项目档案', onClick: () => toast('项目档案已导出（基本信息 + 经营指标 + 里程碑清单）') },
            { label: '查看操作记录', onClick: () => setLogOpen(true) },
          ]} />
        </>}>
        {/* 项目编号只在页头标题出现（含复制），此处不再重复 */}
        <KvGrid cols={2} rows={[
          { k: '项目类型', v: P.type },
          { k: '所属区域', v: '云南 · 昆明' },
          { k: '客户', v: <EntityLink target="customer" id={custId} go={go} title="下钻到客户档案">{P.customer}</EntityLink> },
          { k: '联系人', v: '刘经理' },
          { k: '项目经理', v: `${P.pm}（138****8801）` },
          { k: '当前状态', v: <Tag tone={(PROJECT_STATUS_TONE[P.status] || 'blue') as 'blue'}>{P.status} · {P.milestoneName}</Tag> },
          { k: '计划工期', v: `${P.start} ~ ${P.end}（193 天）` },
          { k: '项目地址', v: '昆明市西山区前兴路 688 号万达广场' },
          { k: '创建信息', v: '2026-09-20 / 蓝峰' },
          { k: '质保金（3%）', v: `${fmtAmt(WARRANTY)} · 结算时客户扣留` },
        ]} />
        <div className="nc-ovdesc">
          <b>项目描述：</b>对昆明万达广场既有消防系统进行整体改造，含火灾自动报警系统更新、自动喷淋管网改造、防排烟系统调试；
          施工期间增补机房气体灭火系统（变更审批中）。商场不停业施工，夜间作业窗口 22:00-06:00，报警系统与既有主机联网。
          竣工后进入 1 年质保期。
        </div>
      </Card>

      {/* ============ 经营指标（5 卡 · 差额与比率口径，绝对值见上方概览条，不重复取数） ============ */}
      <Card
        style={{ marginTop: 16 }}
        hd={<span><Ico n="trophy" size={16} /> 经营指标</span>}
        extra={<span className="nc-cell-sub">更新于 {TODAY} 10:24
          <Tip w={420} text={<>
            <b>目标成本</b> = 立项预算；<b>实际成本</b> = 已发生成本（与目标成本并排，超支额小字标注）。<br />
            <b>应收账龄</b> = 已开票未到账金额（按账龄分档，不计回款）。<br />
            <b>成本口径</b>：采购 / 分包 / 人工 / 机械 / 费用一经发生即计入（含审批中），红字冲销与更正按净额追加。<br />
            <b>现金口径</b>：按实收 / 实付净额统计，审批中不计。
          </>} />
        </span>}>
        {/* B 层只放过程指标 3 卡：目标成本 / 实际成本（并排对比）/ 应收账龄；净现金流在 A 层不重复，毛利率去重 */}
<div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }}>
          {/* 成本对比卡：目标 vs 实际 并排，中间超支/结余 */}
          <button className="nc-tile is-clickable" onClick={() => setDrill('act')} style={{ textAlign: 'left' }}>
            <div className="nc-tile-label">成本对比 <span className="nc-drill">穿透↗</span></div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 4 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>目标成本</div>
                <div className="num" style={{ fontSize: 22, fontWeight: 600 }}>{fmtAmt(PLAN_SUM)}</div>
              </div>
              <div style={{ fontSize: 18, color: 'var(--ink-3)' }}>vs</div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>实际成本</div>
                <div className={`num`} style={{ fontSize: 22, fontWeight: 600, color: dev > 0 ? '#ff4d4f' : '#52c41a' }}>{fmtAmt(COST_SUM)}</div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{dev > 0 ? '超支' : '结余'}</div>
                <div className="num" style={{ fontSize: 18, fontWeight: 600, color: dev > 0 ? '#ff4d4f' : '#52c41a' }}>{dev > 0 ? '+' : ''}{fmtAmt(Math.abs(dev))}</div>
              </div>
            </div>
            <div style={{ marginTop: 8 }}>
              <div className="nc-paybar" style={{ width: '100%' }}><i style={{ width: `${Math.min(100, (COST_SUM / PLAN_SUM) * 100)}%`, background: dev > 0 ? '#ff4d4f' : '#52c41a' }} /></div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>实际占目标 {fmtPct((COST_SUM / PLAN_SUM) * 100)} · 含审批中 · 红字冲销按净额</div>
            </div>
          </button>
          {/* 应收账龄卡 */}
          <button className="nc-tile is-clickable" onClick={() => setDrill('overdue')}>
            <div className="nc-tile-label">应收账龄 <span className="nc-drill">催收↗</span></div>
            <div className="nc-tile-value num nc-v-orange">{fmtAmt(overdueAmt)}</div>
            <div className="nc-tile-sub">已开票未到账 · 账龄 60-90 天档</div>
          </button>
        </div>
      </Card>

      {/* ============ 进度与督办（左：全页唯一的轴 ｜ 右：督办事项） ============ */}
      <Card
        style={{ marginTop: 16 }}
        hd={<span><Ico n="swap" size={16} /> 进度与督办
          <Tip w={340} text="里程碑节点由系统按业务事件自动推进，人工只能确认当前节点；验收类节点须上传【验收查验记录】+ 影像 + 签字件。" />
        </span>}
        extra={<>
          <span className="nc-cell-sub">
            {curMile ? `当前节点 ${curMile.name} · ${curMile.date}` : '里程碑节点已全部完成'}
          </span>
          <Btn size="sm" onClick={() => toast('项目风险报告已生成 · 已推送至项目群与商务待办')}>生成风险报告</Btn>
        </>}>
        <div className="nc-prjprog">
          <div>
            <div className="nc-mile-axis">
              {MILE_AXIS.map((mi, i) => (
                <div key={mi.name} className={`nc-mile-node${mi.st ? ` is-${mi.st}` : ''}`}>
                  <i>{mi.st === 'done' ? '' : mi.st === 'cur' ? '●' : i + 1}</i><b>{mi.name}</b><span>{mi.date}</span>
                </div>
              ))}
            </div>

            <div className="nc-progrow">
              <span>回款进度</span>
              <div className="nc-progwrap">
                <span className="nc-progrow-lb">已回款 ÷ 合同金额（含审批中变更）</span>
                <Progress value={Math.min(PAY_PROGRESS, 100)} tone="green" />
              </div>
              <b className="num">{fmtPct(PAY_PROGRESS)}</b>
            </div>
            <div className="nc-progrow">
              <span>成本进度</span>
              <div className="nc-progwrap">
                <span className="nc-progrow-lb">已发生 ÷ 目标成本（{dev > 0 ? '超预算' : '低于预算'} {fmtPct(Math.abs(devPct))}）</span>
                <Progress value={Math.min(COST_PROGRESS, 100)} tone="red" />
              </div>
              <b className="num">{fmtPct(COST_PROGRESS)}</b>
            </div>
          </div>

          <div>
            <div className="nc-ledhd">
              督办事项 <b>{dunCount}</b>
              <span className="nc-cell-sub">按严重度排序 · 处置后自动销项</span>
            </div>

            {overdue.length > 0 && (
              <div className="nc-risk-item is-orange">
                <span><Ico n="clock" size={16} /></span>
                <div className="nc-risk-main">
                  已开票未到账 {overdue.length} 笔
                  <div className="nc-risk-sub">{overdue[0]?.id} · 账龄 75 天（60-90 天档）· 不计回款</div>
                </div>
                <Btn size="sm" onClick={() => openM('dunning')}>催收</Btn>
              </div>
            )}
            {progLevel === 'yellow' && (
              <div className="nc-risk-item is-orange">
                <span><Ico n="chart" size={16} /></span>
                <div className="nc-risk-main">
                  进度黄警
                  <div className="nc-risk-sub">实际 {progActual}% vs 计划应到 {progPlan}% · 偏差 {progDev}%</div>
                </div>
                <Btn size="sm" onClick={() => setTab('progress')}>进度详情</Btn>
              </div>
            )}
            {dev > 0 && (
              <div className="nc-risk-item is-orange">
                <span><Ico n="chart" size={16} /></span>
                <div className="nc-risk-main">
                  成本超支
                  <div className="nc-risk-sub">建议：录入台账 / 发起变更归集</div>
                </div>
                <Btn size="sm" onClick={() => setTab('cost')}>成本台账</Btn>
              </div>
            )}
            {APPROVALS.length > 0 && (
              <div className="nc-risk-item is-orange">
                <span><Ico n="bell" size={16} /></span>
                <div className="nc-risk-main">
                  待我审批 {APPROVALS.length} 笔
                  <div className="nc-risk-sub">{APPROVALS[0].id} · {APPROVALS[0].desc}</div>
                  {APPROVALS.length > 1 && (
                    <div className="nc-risk-sub">
                      <Op onClick={() => openM('approve')}>还有 {APPROVALS.length - 1} 笔 →</Op>
                    </div>
                  )}
                </div>
                <Btn size="sm" onClick={() => openM('approve')}>审批台</Btn>
              </div>
            )}
            {depIn.length > 0 && (
              <div className="nc-risk-item is-gold">
                <span><Ico n="card" size={16} /></span>
                <div className="nc-risk-main">
                  投标 / 履约保证金待退 {depIn.length} 笔
                  <div className="nc-risk-sub">我方缴纳、尚未退回 · {depIn.map((d) => d.id).join(' / ')}</div>
                </div>
                <Btn size="sm" onClick={() => openM('deposit')}>台账</Btn>
              </div>
            )}
            {dunCount === 0 && <div className="nc-empty-mini">当前无待处置的督办事项</div>}
          </div>
        </div>
      </Card>

      {/* ============ ④ 10 Tab（对齐《产品设计文档》§9.2） ============ */}
      <Card flush style={{ marginTop: 16 }}>
        <div className="nc-card-hd">
          <Tabs value={tab} onChange={setTab} items={[
            { key: 'mile', label: '里程碑与日志', cnt: MILE_ROWS.length },
            { key: 'progress', label: '进度', cnt: P.workItems?.length || 0 },
            { key: 'contract', label: '关联合同', cnt: SALE_CT.length + BUY_CT.length },
            { key: 'cost', label: '成本台账', cnt: costRows.length + CHANGES.length },
            { key: 'pay', label: '收付款', cnt: PAY_ROWS.length + depositRows.length },
            { key: 'arrival', label: '报验与隐蔽', cnt: ARRIVALS.length + HIDDEN.length + SAFE_ROWS.length },
            { key: 'accept', label: '检测与验收', cnt: ACCEPT_ROUNDS.length },
            { key: 'visa', label: '签证洽商', cnt: VISAS.length },
            { key: 'team', label: '团队与证书', cnt: teamRows.length + certRows.length },
            ...(isServiceProject(P) ? [{ key: 'maint', label: '维保管理', cnt: MAINT_PLANS.length + MAINT_ISSUES.length }] : []),
            { key: 'doc', label: '文档', cnt: ATT_CNT },
          ]} />
        </div>

        {/* ---- ① 里程碑与日志 ---- */}
        {tab === 'mile' && (
          <div className="nc-card-bd">
            <div className="nc-ledhd">里程碑
              <Tip w={330} text="按项目类型一键套用系统预置模板，套用后可增删改节点与计划日；法定节点（隐蔽工程验收 / 第三方消防检测 / 消防验收备案）删除时二次确认，防漏。" />
              <Btn size="sm" onClick={() => toast(`已按「${P.type}」类型套用里程碑模板（10 个节点）`)}>套用里程碑模板</Btn>
              <Btn size="sm" onClick={() => toast('已打开「新增里程碑节点」表单（演示）')}>＋ 新增节点</Btn>
            </div>
            <table className="nc-tbl" style={{ minWidth: 820 }}>
              <thead><tr>
                <th>节点</th><th style={{ width: 120 }}>计划完成日</th><th style={{ width: 120 }}>实际完成日</th>
                <th style={{ width: 100 }}>状态</th><th style={{ width: 110 }}>责任人</th><th style={{ width: 110 }}>操作</th>
              </tr></thead>
              <tbody>
                {MILE_ROWS.map((r) => (
                  <tr key={r.n}>
                    <td><b>{r.n}</b>{MILESTONE_LEGAL.includes(r.n.replace(/^M\d+\s*/, '')) && <Tag tone="gray">法定</Tag>}</td>
                    <td className="num">{r.plan}</td>
                    <td className="num">{r.act}</td>
                    <td><Tag tone={MILE_ST_TONE[r.st] || 'gray'}>{r.st}</Tag></td>
                    <td>{r.owner}</td>
                    <td>
                      {r.st === '进行中'
                        ? <Op onClick={() => toast(`「${r.n}」已标记完成（演示）`)}>标记完成</Op>
                        : <span className="nc-cell-sub">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="nc-ledhd" style={{ marginTop: 20 }}>施工日志
              <Tip w={300} text="施工日志可关联移动端打卡记录（含定位与照片），本平台只读消费打卡接口数据。" />
              <Btn size="sm" kind="primary" onClick={() => toast('已打开「写施工日志」表单（演示）')}>＋ 写日志</Btn>
            </div>
            <Timeline items={SITE_LOGS.map((l) => ({
              date: l.date,
              tone: 'ok' as const,
              text: <>
                <b>{l.weather}</b>
                {l.att && <> <Tag tone="blue">打卡 {l.att}</Tag></>}
                <div style={{ marginTop: 4 }}>{l.text}</div>
                <div className="nc-cell-sub" style={{ marginTop: 4 }}>
                  <Ico n="paperclip" size={14} /> 现场照片 {l.photos} 张（水印 + GPS）
                  {l.att && <> · <Op onClick={() => go('attendance')}>查看打卡定位与照片</Op></>}
                </div>
              </>,
            }))} />
          </div>
        )}

        {/* ---- ①.5 进度（产值权重法 · 工序填报自动汇总，无手工填百分比入口） ---- */}
        {tab === 'progress' && (
          <div className="nc-card-bd">
            {/* 区块1 总进度条 + 计划对比 + 预警 */}
            <div className="nc-overhead">
              <b>总进度 {progActual}%</b>
              <span className={progLevel === 'red' ? 'nc-v-red' : 'nc-v-orange'}>　计划应到 {progPlan}% · 偏差 {progDev >= 0 ? '+' : ''}{progDev}%　{progLevel === 'red' ? '【红警 · 需提交纠偏方案】' : progLevel === 'yellow' ? '【黄警】' : '【正常】'}</span>
            </div>
            <div className="nc-paybar" style={{ height: 12, width: '100%', margin: '8px 0 16px' }}>
              <i style={{ width: progActual + '%' }} />
            </div>
            <Tip w={420} text="进度 = Σ已完成工序产值 ÷ 总产值（产值权重法），由工序填报自动汇总，无手工填写百分比入口。预警阈值：落后计划 ≥10% 黄警，≥20% 红警。" />

            {/* 区块2 里程碑时间轴 */}
            <div className="nc-ledhd" style={{ marginTop: 16 }}>里程碑时间轴</div>
            <div className="nc-mile-axis">
              {MILE_AXIS.map((mi) => (
                <div key={mi.name} className={`nc-mile-node${mi.st ? ' is-' + mi.st : ''}`}>
                  <i>{mi.st === 'done' ? '✓' : mi.st === 'cur' ? '●' : '○'}</i><b>{mi.name}</b><span>{mi.date}</span>
                </div>
              ))}
            </div>

            {/* 区块3 工序清单 */}
            <div className="nc-ledhd" style={{ marginTop: 16 }}>工序清单（产值权重）</div>
            <table className="nc-tbl" style={{ minWidth: 760 }}>
              <thead><tr><th>工序</th><th style={{ width: 180 }}>完成度</th><th className="is-num" style={{ width: 160 }}>已完成 / 总工程量</th><th className="is-num" style={{ width: 150 }}>完成产值</th></tr></thead>
              <tbody>
                {(P.workItems || []).map((w) => {
                  const pct = w.totalQty ? Math.round((w.doneQty / w.totalQty) * 100) : 0;
                  const totalV = w.totalQty * w.unitPrice;
                  const doneV = w.doneQty * w.unitPrice;
                  return (
                    <tr key={w.name}>
                      <td><b>{w.name}</b></td>
                      <td><span className="nc-paybar" style={{ width: 160 }}><i style={{ width: pct + '%' }} /></span></td>
                      <td className="is-num">{w.doneQty}/{w.totalQty} 个</td>
                      <td className="is-num">{fmtAmt(doneV)} / {fmtAmt(totalV)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* 区块4 最近7天日志摘要 + 现场照片墙 */}
            <div className="nc-ledhd" style={{ marginTop: 16 }}>最近 7 天施工日志摘要</div>
            <Timeline items={SITE_LOGS.slice(0, 3).map((l) => ({
              date: l.date, tone: 'ok' as const,
              text: <><b>{l.weather}</b> · {l.text} {l.att ? <Tag tone="blue">打卡 {l.att}</Tag> : null}</>,
            }))} />
            <div className="nc-ledhd" style={{ marginTop: 16 }}>现场照片墙</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {['管线安装夜间作业', '喷淋头排布', '报警探测器接线', '风管吊装'].map((t) => (
                <div key={t} style={{ height: 96, borderRadius: 8, background: 'linear-gradient(135deg,#c9d6e8,#9db4d4)', display: 'flex', alignItems: 'flex-end', padding: 8, color: '#243b63', fontSize: 12 }}>
                  {t}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---- ② 关联合同（收款类 / 付款类两栏分组） ---- */}
        {tab === 'contract' && (
          <div className="nc-card-bd">
            <div className="nc-subtabs">
              <span className="nc-subtab is-on">项目合同树</span>
              <Tip w={320} text="按收款 / 付款方向分组展示，合同与项目双向可见：在合同详情「关联项目」处挂本项目即自动出现在此处。未关联销售合同的执行中项目进风险榜（无合同施工）。" />
              <span style={{ marginLeft: 'auto' }}><Btn size="sm" onClick={() => openM('link')}>＋ 关联合同</Btn></span>
            </div>
            <div className="nc-2col">
              <div>
                <div className="nc-ledhd">收款类 · 销售 / 维保合同 <b>{SALE_CT.length}</b></div>
                {SALE_CT.map((c) => (
                  <div key={c.code} className="nc-ctcard">
                    <div className="nc-ctcard-hd">
                      <EntityLink target="contract" id={c.code} go={go} title="下钻到合同详情"><Code>{c.code}</Code></EntityLink><b>{c.name}</b><Tag tone={c.tone}>{c.st}</Tag>
                      {c.badge && <span className="nc-cell-sub">{c.badge}</span>}
                      <span className="nc-ctcard-amt">{fmtAmt(c.amt)}</span>
                      {c.payplan
                        ? <Op onClick={() => setCtOpen(!ctOpen)}>{ctOpen ? '收起期次 ▲' : '展开期次 ▼'}</Op>
                        : <Op onClick={() => { setFocus('contract', c.code); go('contract'); }}>详情</Op>}
                    </div>
                    {c.children && c.children.map((ch) => (
                      <div key={ch.code} style={{ margin: '4px 0 4px 28px', padding: '6px 0 6px 12px', borderLeft: '2px solid #9db4d4' }}>
                        <EntityLink target="contract" id={ch.code} go={go} title="下钻到合同详情"><Code>{ch.code}</Code></EntityLink>
                        <b>{ch.name}</b> <Tag tone="blue">价格调整补充</Tag>
                        <span style={{ float: 'right' }} className="num">+{fmtAmt(ch.amt)}（增量）</span>
                        <div className="nc-cell-sub">{ch.note}</div>
                      </div>
                    ))}
                    {c.payplan && ctOpen && (
                      <>
                        <table className="nc-tbl" style={{ minWidth: 900 }}>
                          <thead><tr>
                            <th style={{ width: 180 }}>收款期次</th>
                            <th style={{ width: 110 }} className="is-num">应收金额</th>
                            <th style={{ width: 170 }}>实收情况<Tip w={300} text="部分收款行同时显示实收 / 应收双数值；收款期次计划日期须递增，与「逾期应收」风险卡联动。" /></th>
                            <th style={{ width: 110 }}>实收日期</th>
                            <th style={{ width: 100 }}>开票状态</th>
                            <th style={{ width: 110 }}>计划日期</th>
                            <th>备注</th>
                          </tr></thead>
                          <tbody>
                            {c.payplan.map((p) => (
                              <tr key={p.n} className={p.st === '部分收款' ? 'is-warn-row' : ''}>
                                <td>{p.n}</td>
                                <td className="is-num">{fmtAmt(p.amt)}</td>
                                <td>
                                  <div className="nc-paystage">
                                    <span className="num">{fmtAmt(p.got)} / {fmtAmt(p.amt)}</span>
                                    <span className={`nc-paybar${p.got >= p.amt ? ' is-full' : p.got > 0 ? ' is-part' : ''}`}><i style={{ width: `${(p.got / p.amt) * 100}%` }} /></span>
                                  </div>
                                </td>
                                <td>{p.gotDate}</td>
                                <td><Tag tone={p.inv === '已开票' ? 'green' : p.inv === '未开票' ? 'gray' : 'gold'}>{p.inv}</Tag></td>
                                <td>{p.plan}</td>
                                <td className="nc-cell-sub">{p.note}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="nc-tbl-sum">
                              <td>Σ 合同金额</td>
                              <td className="is-num">{fmtAmt(c.payplan.reduce((s, p) => s + p.amt, 0))}</td>
                              <td className="is-num">{fmtAmt(c.payplan.reduce((s, p) => s + p.got, 0))}</td>
                              <td colSpan={4} className="nc-cell-sub">实收合计（与「已回款」一致）</td>
                            </tr>
                          </tfoot>
                        </table>
                      </>
                    )}
                  </div>
                ))}
                <div className="nc-tbl-sum" style={{ display: 'block', padding: '8px 10px', lineHeight: 1.9 }}>
                  <span>主合同 <b className="num">180 万</b>　｜　独立合同 <b className="num">20 万</b>（维保 12 + 新增服务 8）　｜　执行额 <b className="num">195 万</b>（不做单一合计）</span>
                </div>
              </div>

              <div>
                <div className="nc-ledhd">付款类 · 采购 / 分包合同 <b>{BUY_CT.length}</b></div>
                {BUY_CT.map((c) => (
                  <div key={c.code} className="nc-ctcard">
                    <div className="nc-ctcard-hd">
                      <EntityLink target="contract" id={c.code} go={go} title="下钻到合同详情"><Code>{c.code}</Code></EntityLink><b>{c.name}</b><Tag tone={c.tone}>{c.st}</Tag>
                      <span className="nc-ctcard-amt">{fmtAmt(c.amt)}</span>
                      <Op onClick={() => { setFocus('contract', c.code); go('contract'); }}>详情</Op>
                    </div>
                    {c.warn && <div className="nc-cell-sub nc-v-orange"><Ico n="warning" size={16} /> {c.warn}</div>}
                  </div>
                ))}
                <div className="nc-tbl-sum" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px' }}>
                  <span>付款类合计</span>
                  <b className="num">{fmtAmt(BUY_CT.reduce((s, c) => s + c.amt, 0))}</b>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---- ③ 成本台账 ---- */}
        {tab === 'cost' && (
          <div className="nc-card-bd">
            <div className="nc-subtabs">
              <span className={`nc-subtab${costSub === 'led' ? ' is-on' : ''}`} onClick={() => setCostSub('led')} {...pressProps(() => setCostSub('led'))}>成本明细 <b>{costRows.length}</b></span>
              <span className={`nc-subtab${costSub === 'site' ? ' is-on' : ''}`} onClick={() => setCostSub('site')} {...pressProps(() => setCostSub('site'))}>现场投入（人工 · 机械 · 材料） <b>{laborRows.length + machRows.length + matRows.length}</b></span>
              <span style={{ marginLeft: 'auto' }}><Btn size="sm" onClick={() => go('attendance')}>考勤管理 →</Btn></span>
            </div>

            {costSub === 'led' && (<>
              <div className="nc-overhead">
                预算 {fmtAmt(PLAN_SUM)} — 已发生 {fmtAmt(COST_SUM)} —（<b className="nc-v-red">+{fmtPct(devPct)} 超预算</b>）
                <Tip w={330} text="实际成本四条来源：采购合同成本（付款归集）、分包合同成本（结算归集）、非合同成本人工登记、库存领用自动行；登记错误用负数更正行冲正，原行只读。" />
              </div>
              <div className="nc-ledgrid">
                <div>
                  <div className="nc-ledhd">预算科目（计划口径 · 行内编辑留痕）
                    <Btn size="sm" onClick={() => toast('已从报价 BJ000007 带入预算科目（重复带入不会重复生成）')}>从报价带入</Btn></div>
                  <table className="nc-tbl" style={{ minWidth: 520 }}>
                    <thead><tr><th>科目</th><th style={{ width: 130 }} className="is-num">计划金额</th><th style={{ width: 90 }}>操作</th></tr></thead>
                    <tbody>
                      {GROUPED_PLAN.map((g) => (
                        <React.Fragment key={g.g}>
                          <tr className="nc-margin-row"><td colSpan={3}><b>{g.g}</b></td></tr>
                          {g.rows.map((r) => (
                            <tr key={r.type}>
                              <td style={{ paddingLeft: 22 }}>{r.type}</td>
                              <td className="is-num">
                                <input className="nc-input nc-numinput" value={planEdits[r.type] ?? r.amt}
                                  onChange={(e) => setPlanEdits({ ...planEdits, [r.type]: Number(e.target.value.replace(/[^\d]/g, '')) || 0 })}
                                  onBlur={() => toast(`「${r.type}」计划金额已调整并留痕`)} />
                              </td>
                              <td><Op onClick={() => toast(`已查看「${r.type}」调整记录（演示）`)}>留痕</Op></td>
                            </tr>
                          ))}
                          <tr className="nc-tbl-sum"><td>Σ {g.g}</td><td className="is-num"><b className="num">{fmtAmt(g.sum)}</b></td><td /></tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                    <tfoot><tr className="nc-tbl-sum"><td>Σ 预算合计</td><td className="is-num"><b className="num">{fmtAmt(PLAN_SUM)}</b></td><td /></tr></tfoot>
                  </table>
                </div>
                <div>
                  <div className="nc-ledhd">成本流水（已发生 · 只追加不删除）
                    <Btn size="sm" onClick={() => toast('已打开「登记非合同成本」抽屉（演示）')}>＋ 登记非合同成本</Btn></div>
                  <table className="nc-tbl" style={{ minWidth: 560 }}>
                    <thead><tr><th style={{ width: 100 }}>日期</th><th>科目</th><th style={{ width: 120 }}>来源单据</th><th style={{ width: 130 }} className="is-num">金额</th></tr></thead>
                    <tbody>
                      {costRows.map((r) => (
                        <tr key={r.id}>
                          <td>{r.date}</td>
                          <td>{r.type}<div className="nc-cell-sub">{r.note}</div></td>
                          <td>{SRC_NAME[r.src] ? <DocNo id={r.id} /> : <span className="nc-cell-sub">—</span>}</td>
                          <td className="is-num"><b className="num">{fmtAmt(r.amt)}</b></td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr className="nc-tbl-sum"><td colSpan={3}>Σ 已发生成本</td><td className="is-num"><b className="num">{fmtAmt(COST_SUM)}</b></td></tr></tfoot>
                  </table>
                </div>
              </div>

              <div className="nc-ledhd" style={{ marginTop: 20 }}>类别对比（计划 vs 实际）</div>
              <div className="nc-cmp">
                <div className="nc-cmp-legend">
                  <span><i className="nc-cmp-dot is-plan" />计划</span>
                  <span><i className="nc-cmp-dot is-act" />实际</span>
                </div>
                {bars.map((b) => (
                  <div key={b.t} className="nc-cmp-row">
                    <span className="nc-cmp-lb">{b.t}</span>
                    <span className="nc-cmp-track"><i className="nc-cmp-fill is-plan" style={{ width: `${(b.pln / barMax) * 100}%` }} /></span>
                    <span className="nc-cmp-track"><i className="nc-cmp-fill is-act" style={{ width: `${(b.act / barMax) * 100}%` }} /></span>
                    <span className="nc-cmp-val num">{b.act > 0 ? fmtAmt(b.act) : '—'}</span>
                  </div>
                ))}
              </div>

              <div className="nc-ledhd" style={{ marginTop: 20 }}>变更单（合同外新增 / 设计变更 / 签证）
                <Btn size="sm" onClick={() => toast('已打开「发起变更单」表单（演示）')}>＋ 发起变更</Btn></div>
              {CHANGES.map((c) => (
                <div key={c.id} className="nc-ctcard">
                  <div className="nc-ctcard-hd">
                    <DocNo id={c.id} /><b>{c.title}</b><Tag tone={c.st === '已生效' ? 'green' : c.st === '商务审批中' ? 'blue' : 'gray'}>{c.st}</Tag>
                    <span className="nc-ctcard-amt">{fmtAmt(c.amt)}</span>
                    <Op onClick={() => toast(`已打开「${c.id}」变更单（演示）`)}>查看</Op>
                  </div>
                  <Steps items={FLOW.map((f) => ({ label: f }))} cur={c.flowIdx} />
                </div>
              ))}
            </>)}

            {costSub === 'site' && (<>
              <div className="nc-ledhd">人工费
                <Tip w={300} text="人工费 = Σ（出勤工日 × 工种标准单价）；工日由考勤矩阵按月汇总，口径与「考勤管理」一致。" />
              </div>
              <table className="nc-tbl" style={{ minWidth: 900 }}>
                <thead><tr><th style={{ width: 110 }}>姓名</th><th style={{ width: 140 }}>工种</th><th style={{ width: 170 }}>所属班组</th>
                  <th style={{ width: 110 }} className="is-num">出勤工日</th><th style={{ width: 110 }} className="is-num">工日单价</th>
                  <th style={{ width: 130 }} className="is-num">人工费小计</th><th>备注</th></tr></thead>
                <tbody>
                  {laborRows.map((r) => (
                    <tr key={r.id}>
                      <td><span className="nc-avatar">{r.name[0]}</span><b style={{ marginLeft: 6 }}>{r.name}</b></td>
                      <td>{r.trade}</td>
                      <td className="nc-cell-sub">{r.team}</td>
                      <td className="is-num num">{r.days}</td>
                      <td className="is-num num">{fmt(r.rate)}</td>
                      <td className="is-num"><b className="num">{fmtAmt(r.cost)}</b></td>
                      <td className="nc-cell-sub">{r.days < 8 ? '进场后离场，出勤偏少' : '出勤正常'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="nc-tbl-sum"><td colSpan={5}>Σ 人工费</td>
                  <td className="is-num"><b className="num">{fmtAmt(laborSum)}</b></td><td /></tr></tfoot>
              </table>

              <div className="nc-ledhd" style={{ marginTop: 20 }}>机械费（台班 × 台班单价）</div>
              <table className="nc-tbl" style={{ minWidth: 820 }}>
                <thead><tr><th>机械设备</th><th style={{ width: 90 }}>单位</th><th style={{ width: 110 }} className="is-num">台班数</th>
                  <th style={{ width: 130 }} className="is-num">台班单价</th><th style={{ width: 140 }} className="is-num">金额</th>
                  <th style={{ width: 120 }}>最近使用</th></tr></thead>
                <tbody>
                  {machRows.map((r) => (
                    <tr key={r.name}>
                      <td><b>{r.name}</b></td>
                      <td>{r.unit}</td>
                      <td className="is-num num">{r.qty}</td>
                      <td className="is-num num">{fmt(r.price)}</td>
                      <td className="is-num"><b className="num">{fmtAmt(r.amt)}</b></td>
                      <td>{r.date}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="nc-tbl-sum"><td colSpan={4}>Σ 机械费</td>
                  <td className="is-num"><b className="num">{fmtAmt(machSum)}</b></td><td /></tr></tfoot>
              </table>

              <div className="nc-ledhd" style={{ marginTop: 20 }}>材料 / 设备库存领用（自动生成非合同成本行）</div>
              <table className="nc-tbl" style={{ minWidth: 980 }}>
                <thead><tr><th style={{ width: 120 }}>物料编号</th><th style={{ width: 170 }}>名称</th><th style={{ width: 130 }}>规格</th>
                  <th style={{ width: 70 }}>类型</th><th style={{ width: 70 }}>单位</th>
                  <th style={{ width: 110 }} className="is-num">领用量</th><th style={{ width: 110 }} className="is-num">单价</th>
                  <th style={{ width: 130 }} className="is-num">金额</th><th style={{ width: 100 }} className="is-num">现存</th>
                  <th style={{ width: 110 }}>领用日期</th></tr></thead>
                <tbody>
                  {matRows.map((r) => (
                    <tr key={r.code}>
                      <td><Code>{r.code}</Code></td>
                      <td><b>{r.name}</b></td>
                      <td className="nc-cell-sub">{r.spec}</td>
                      <td><Tag tone={r.ty === '设备' ? 'purple' : 'blue'}>{r.ty}</Tag></td>
                      <td>{r.unit}</td>
                      <td className="is-num num">{r.qty.toLocaleString('en-US')}</td>
                      <td className="is-num num">{fmt(r.price)}</td>
                      <td className="is-num"><b className="num">{fmtAmt(r.amt)}</b></td>
                      <td className="is-num num">{r.stock.toLocaleString('en-US')}</td>
                      <td>{r.date}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="nc-tbl-sum"><td colSpan={7}>Σ 材料设备费</td>
                  <td className="is-num"><b className="num">{fmtAmt(matSum)}</b></td><td colSpan={2} /></tr></tfoot>
              </table>
            </>)}
          </div>
        )}

        {/* ---- ④ 收付款 ---- */}
        {tab === 'pay' && (
          <div className="nc-card-bd">
            <div className="nc-subtabs">
              <span className={`nc-subtab${paySub === 'flow' ? ' is-on' : ''}`} onClick={() => setPaySub('flow')} {...pressProps(() => setPaySub('flow'))}>收支明细 <b>{PAY_ROWS.length}</b></span>
              <span className={`nc-subtab${paySub === 'deposit' ? ' is-on' : ''}`} onClick={() => setPaySub('deposit')} {...pressProps(() => setPaySub('deposit'))}>保证金 <b>{depositRows.length}</b></span>
              <span style={{ marginLeft: 'auto' }}>
                {paySub === 'flow' && <Btn size="sm" kind="primary" onClick={() => openM('pay')}>＋ 登记收款</Btn>}
                {paySub === 'deposit' && <Btn size="sm" onClick={() => openM('deposit')}>保证金台账</Btn>}
              </span>
            </div>

            {paySub === 'flow' && (
              <>
                <div className="nc-subtabs">
                  {PAY_FILTERS.map((f) => (
                    <span key={f} className={`nc-subtab${payFilter === f ? ' is-on' : ''}`} onClick={() => setPayFilter(f)} {...pressProps(() => setPayFilter(f))}>
                      {f} <b>{f === '全部' ? PAY_ROWS.length : PAY_ROWS.filter((r) => r.kind === f).length}</b>
                    </span>
                  ))}
                </div>
                <table className="nc-tbl" style={{ minWidth: 1080 }}>
                  <thead><tr>
                    <th style={{ width: 160 }}>单据</th><th style={{ width: 100 }}>类型</th><th style={{ width: 160 }}>关联合同</th>
                    <th style={{ width: 120 }} className="is-num">金额</th><th>用途</th><th style={{ width: 140 }}>状态</th>
                    <th style={{ width: 110 }}>日期</th><th style={{ width: 150 }}>操作</th>
                  </tr></thead>
                  <tbody>
                    {payRows.map((r) => (
                      <tr key={r.id} className={r.st === 'hc' || r.mergedTo ? 'is-dead-row' : ''}>
                        <td><DocNo id={r.id} /></td>
                        <td><Tag tone={r.kind === '收入' ? 'green' : r.kind === '红字冲销单' ? 'gray' : 'orange'}>{r.kind}</Tag></td>
                        <td className="nc-cell-sub">{r.contract}</td>
                        <td className={`is-num${r.amt < 0 ? ' nc-v-red' : ''}`}><b className="num">{fmtAmt(r.amt)}</b></td>
                        <td className="nc-cell-sub">
                          {r.use}
                          {r.mergedTo && <div className="nc-v-orange">已归并入 {r.mergedTo}</div>}
                        </td>
                        <td><Tag tone={PAY_ST[r.st].t}>{PAY_ST[r.st].n}</Tag></td>
                        <td>{r.date}</td>
                        <td>
                          {r.kind === '收入' && r.st === 'overdue' && <><Op gold onClick={() => openM('dunning')}>催收</Op><OpSep /></>}
                          {r.kind !== '收入' && r.kind !== '红字冲销单' && r.st === 'paid' && !r.mergedTo && <><Op danger onClick={() => { setFlushId(r.id); openM('flush'); }}>红字冲销</Op><OpSep /></>}
                          {r.kind === '无合同付款' && r.st !== 'approving' && !r.mergedTo && <Op onClick={() => openM('merge')}>归并</Op>}
                          {(r.st === 'hc' || r.st === 'flushed' || r.st === 'approving' || r.mergedTo) && <span className="nc-cell-sub">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="nc-tbl-sum"><td colSpan={3}>Σ 实收（红字冲销净额）</td>
                      <td className="is-num"><b className="num">{fmt(SUM_IN)}</b></td>
                      <td colSpan={4} className="nc-cell-sub">已开票未到账 {fmtAmt(overdueAmt)} 未计入回款</td></tr>
                    <tr className="nc-tbl-sum"><td colSpan={3}>Σ 实付（红字冲销净额）</td>
                      <td className="is-num"><b className="num">{fmt(SUM_OUT)}</b></td>
                      <td colSpan={4} className="nc-cell-sub">审批中不计 · 已红字冲销与负数单对冲</td></tr>
                  </tfoot>
                </table>
              </>
            )}

            {paySub === 'deposit' && (
              <>
                <div className="nc-stat4">
                  <div className="nc-stat4-cell">我方缴纳总额<b>{fmtAmt(DEPOSITS.reduce((a, d) => a + d.amt, 0))}</b></div>
                  <div className="nc-stat4-cell">已退还<b className="nc-v-green">{fmtAmt(5000)}</b></div>
                  <div className="nc-stat4-cell">待退回（我方缴纳）<b className="nc-v-red">{fmtAmt(depInAmt)}</b></div>
                  <div className="nc-stat4-cell">质保金义务（客户扣留）<b className="nc-v-orange">{fmtAmt(WARRANTY)}</b></div>
                </div>
                <table className="nc-tbl" style={{ minWidth: 880 }}>
                  <thead><tr><th style={{ width: 160 }}>单据</th><th style={{ width: 180 }}>类型</th><th>方向 / 对象</th>
                    <th style={{ width: 120 }} className="is-num">金额</th><th style={{ width: 110 }}>缴纳日</th><th style={{ width: 120 }}>应退日</th>
                    <th style={{ width: 110 }}>状态</th><th style={{ width: 130 }}>操作</th></tr></thead>
                  <tbody>
                    {depositRows.map((d) => (
                      <tr key={d.id}>
                        <td><b>{d.id}</b></td><td>{d.type}</td>
                        <td className="nc-cell-sub">{d.dir === 'in' ? '我方缴纳 · 待退回' : '我方收取 · 结算时扣留'}<br />{d.party}</td>
                        <td className="is-num">{fmtAmt(d.amt)}</td><td>{d.pay}</td><td>{d.due}</td>
                        <td><Tag tone={d.st === '未退' ? 'red' : d.st === '待扣留' ? 'gold' : 'green'}>{d.st}</Tag></td>
                        <td>
                          {d.st === '未退'
                            ? <><Op onClick={() => { setDepRelId(d.id); setM('depRel'); }}>解除登记</Op><OpSep /><Op onClick={() => toast(`${d.id} 退还流程已发起 · 财务待办 T+3`)}>发起退还</Op></>
                            : <span className="nc-cell-sub">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* ---- ⑤ 报验与隐蔽 ---- */}
        {tab === 'arrival' && (
          <div className="nc-card-bd">
            <div className="nc-ledhd">材料进场报验
              <Tip w={330} text="按批次登记进场材料后，系统按材料「进场报验要求」（CCC / 检测报告 / 合格证）自动检查附件齐备性，缺件拦截报验单生成。" />
              <Btn size="sm" kind="primary" onClick={() => openM('arrival')}>＋ 进场报验</Btn></div>
            <table className="nc-tbl" style={{ minWidth: 980 }}>
              <thead><tr>
                <th style={{ width: 150 }}>报验单</th><th style={{ width: 90 }}>批次</th><th style={{ width: 110 }}>进场日</th>
                <th>材料汇总</th><th style={{ width: 230 }}>附件齐备性</th><th style={{ width: 100 }}>签认</th>
              </tr></thead>
              <tbody>
                {ARRIVALS.map((a) => {
                  const miss = a.need.filter((n) => !a.have.includes(n));
                  return (
                    <tr key={a.no}>
                      <td><DocNo id={a.no} /></td>
                      <td>{a.batch}</td>
                      <td className="num">{a.date}</td>
                      <td className="nc-cell-sub">{a.items}</td>
                      <td>
                        {a.need.map((n) => (
                          <span key={n} style={{ marginRight: 8 }}>
                            <i className={`nc-reqdot ${a.have.includes(n) ? 'is-ok' : 'is-miss'}`} />{n}
                          </span>
                        ))}
                        {miss.length > 0 && <div className="nc-v-red">缺 {miss.join('、')} · 不可生成报验单</div>}
                      </td>
                      <td><Tag tone={a.sign === '已签认' ? 'green' : 'red'}>{a.sign}</Tag></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="nc-ledhd" style={{ marginTop: 20 }}>隐蔽工程验收记录
              <Btn size="sm" onClick={() => toast('已打开「登记隐蔽验收」表单（演示）')}>＋ 登记记录</Btn></div>
            <table className="nc-tbl" style={{ minWidth: 820 }}>
              <thead><tr><th style={{ width: 200 }}>验收部位</th><th style={{ width: 110 }}>验收日</th>
                <th>验收内容</th><th style={{ width: 90 }} className="is-num">照片</th><th style={{ width: 160 }}>签字</th></tr></thead>
              <tbody>
                {HIDDEN.map((h) => (
                  <tr key={h.part}>
                    <td><b>{h.part}</b></td><td className="num">{h.date}</td>
                    <td className="nc-cell-sub">{h.content}</td>
                    <td className="is-num num">{h.photos}</td>
                    <td><Tag tone="green">{h.sign}</Tag></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="nc-ledhd" style={{ marginTop: 20 }}>安全巡检记录</div>
            <table className="nc-tbl" style={{ minWidth: 720 }}>
              <thead><tr><th>巡检项</th><th style={{ width: 150 }}>检查结果</th><th style={{ width: 120 }}>检查人</th><th style={{ width: 120 }}>检查日期</th></tr></thead>
              <tbody>
                {SAFE_ROWS.map((r) => (
                  <tr key={r.item}>
                    <td>{r.item}</td>
                    <td><Tag tone={r.res === '合格' ? 'green' : 'gold'}>{r.res}</Tag></td>
                    <td>{r.by}</td>
                    <td>{r.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ---- ⑥ 检测与验收 ---- */}
        {tab === 'accept' && (
          <div className="nc-card-bd">
            <div className="nc-ledhd">第三方消防检测
              <Btn size="sm" onClick={() => toast('已打开「登记检测报告」抽屉（演示）')}>登记检测报告</Btn></div>
            <div className="nc-stat4">
              <div className="nc-stat4-cell">检测机构<b>{CHECK_INFO.org}</b></div>
              <div className="nc-stat4-cell">报告编号<b className="num">{CHECK_INFO.no}</b></div>
              <div className="nc-stat4-cell">检测日期<b className="num">{CHECK_INFO.date}</b></div>
              <div className="nc-stat4-cell">检测结论<b>{CHECK_INFO.res}</b></div>
            </div>
            <div className="nc-cell-sub" style={{ marginTop: 8 }}>{CHECK_INFO.note}</div>

            <div className="nc-ledhd" style={{ marginTop: 20 }}>消防验收备案推进
              <Tip w={340} text="流程：未申报 → 已申报 → 整改中（可多轮，每轮记录整改项与复验日）→ 已通过 → 已备案。合同收款节点的触发条件若为「消防验收通过」，在该项未通过前不允许登记收款。" />
            </div>
            <Steps
              items={ACCEPT_FLOW.map((f) => ({ label: f }))}
              cur={Math.max(0, ACCEPT_FLOW.indexOf((P.acceptStatus || '未申报') as typeof ACCEPT_FLOW[number]))}
            />
            <div style={{ marginTop: 12 }}>
              <Btn size="sm" onClick={() => toast(`已打开「登记${(P.acceptStatus || '未申报')}」抽屉（演示）`)}>登记当前状态</Btn>
              <Btn size="sm" onClick={() => toast('已打开「新增整改轮次」表单（演示）')}>＋ 新增整改轮次</Btn>
            </div>
            <table className="nc-tbl" style={{ minWidth: 760, marginTop: 12 }}>
              <thead><tr><th style={{ width: 80 }}>轮次</th><th style={{ width: 110 }}>整改日</th>
                <th>整改项</th><th style={{ width: 120 }}>复验日</th><th style={{ width: 100 }}>登记人</th></tr></thead>
              <tbody>
                {ACCEPT_ROUNDS.map((r) => (
                  <tr key={r.r}>
                    <td>第 {r.r} 轮</td><td className="num">{r.date}</td>
                    <td className="nc-cell-sub">{r.items}</td><td className="num">{r.recheck}</td><td>{r.by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ---- ⑦ 签证洽商 ---- */}
        {tab === 'visa' && (
          <div className="nc-card-bd">
            <div className="nc-ledhd">现场签证 / 洽商登记
              <Tip w={330} text="签证登记不等于变更生效：未走完合同变更审批与补充协议的签证不计入执行额，也不可作为收款依据。结项时未审批签证不参与结算。" />
              <Btn size="sm" kind="primary" onClick={() => openM('visa')}>＋ 现场签证登记</Btn></div>
            <table className="nc-tbl" style={{ minWidth: 1020 }}>
              <thead><tr>
                <th style={{ width: 140 }}>签证单</th><th style={{ width: 110 }}>日期</th><th>事由</th>
                <th style={{ width: 120 }} className="is-num">预计金额</th><th style={{ width: 80 }} className="is-num">照片</th>
                <th style={{ width: 100 }}>甲方签字</th><th style={{ width: 150 }}>关联变更单</th><th style={{ width: 130 }}>操作</th>
              </tr></thead>
              <tbody>
                {VISAS.map((v) => (
                  <tr key={v.no}>
                    <td><DocNo id={v.no} /></td>
                    <td className="num">{v.date}</td>
                    <td className="nc-cell-sub">{v.reason}</td>
                    <td className="is-num"><b className="num">{fmtAmt(v.amt)}</b></td>
                    <td className="is-num num">{v.photos}</td>
                    <td><Tag tone={v.sign === '已签认' ? 'green' : 'gold'}>{v.sign}</Tag></td>
                    <td>
                      {v.chg === '—'
                        ? <span className="nc-cell-sub">未生成变更单</span>
                        : <><DocNo id={v.chg} /><div className="nc-cell-sub">{v.chgSt}</div></>}
                    </td>
                    <td>
                      {v.chg === '—'
                        ? <Op onClick={() => { toast(`已由 ${v.no} 生成合同变更单草稿（演示）`); setTab('cost'); }}>生成合同变更单</Op>
                        : <Op onClick={() => setTab('cost')}>查看变更</Op>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ---- ⑧ 团队与证书 ---- */}
        {tab === 'team' && (
          <div className="nc-card-bd">
            <div className="nc-ledhd">项目团队
              <Btn size="sm" onClick={() => toast('已打开「添加成员」表单（演示）')}>＋ 添加成员</Btn></div>
            <table className="nc-tbl" style={{ minWidth: 720 }}>
              <thead><tr><th style={{ width: 130 }}>姓名</th><th style={{ width: 160 }}>项目角色</th><th style={{ width: 160 }}>联系电话</th><th>备注</th></tr></thead>
              <tbody>
                {teamRows.map((t) => (
                  <tr key={t.name}>
                    <td><span className="nc-avatar">{t.name[0]}</span><b style={{ marginLeft: 6 }}>{t.name}</b></td>
                    <td><Tag tone={t.role === '项目经理' ? 'blue' : t.role === '安全员' ? 'orange' : 'gray'}>{t.role}</Tag></td>
                    <td className="num">{t.phone}</td>
                    <td className="nc-cell-sub">{t.role === '项目经理' ? '一级建造师（机电）· B 证有效' : '—'}</td>
                  </tr>
                ))}
                <tr>
                  <td><b>{P.customer}</b></td>
                  <td><Tag tone="green">甲方现场对接人</Tag></td>
                  <td className="num">{P.clientContact ? P.clientContact.split(' ').pop() : '—'}</td>
                  <td className="nc-cell-sub">{P.clientContact || '未登记'}</td>
                </tr>
              </tbody>
            </table>

            <div className="nc-ledhd" style={{ marginTop: 20 }}>证书占用
              <Tip w={330} text="个人证书按证书单独设置占用上限，超限或过期给拦截；结项时系统自动释放全部占用，释放后可用于新项目。" />
              <Btn size="sm" onClick={() => openM('cert')}>＋ 挂证书</Btn></div>
            <table className="nc-tbl" style={{ minWidth: 900 }}>
              <thead><tr>
                <th style={{ width: 150 }}>证书编号</th><th>证书名称</th><th style={{ width: 110 }}>持证人</th>
                <th style={{ width: 110 }}>有效期至</th><th style={{ width: 100 }}>占用状态</th>
                <th style={{ width: 150 }}>占用起止</th><th style={{ width: 100 }}>操作</th>
              </tr></thead>
              <tbody>
                {certRows.map((c) => (
                  <tr key={c.id}>
                    <td><Code>{c.certId}</Code></td>
                    <td><b>{c.certName}</b></td>
                    <td>{c.holder}</td>
                    <td className="num">{certValidTo(c.certId)}</td>
                    <td><Tag tone={c.status === '占用中' ? 'blue' : 'gray'}>{c.status}</Tag></td>
                    <td className="nc-cell-sub">{c.startDate} ~ {c.endDate}</td>
                    <td>
                      {c.status === '占用中'
                        ? <Op onClick={() => toast(`已解除 ${c.certId} 占用（演示）`)}>解除占用</Op>
                        : <span className="nc-cell-sub">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ---- ⑨ 维保管理（仅维保型项目） ---- */}
        {tab === 'maint' && (
          <div className="nc-card-bd">
            {!isServiceProject(P) ? (
              <div className="nc-empty-mini">本项目不是维保型项目，无维保管理内容。</div>
            ) : (<>
              <div className="nc-stat4">
                <div className="nc-stat4-cell">服务周期<b className="num">{P.serviceStart} ~ {P.serviceEnd}</b></div>
                <div className="nc-stat4-cell">巡检计划<b>{MAINT_PLANS.length} 项</b></div>
                <div className="nc-stat4-cell">问题工单<b>{MAINT_ISSUES.length} 单</b></div>
                <div className="nc-stat4-cell">30 天销项率<b className="nc-v-green">100%</b></div>
              </div>

              <div className="nc-ledhd">巡检计划
                <Btn size="sm" kind="primary" onClick={() => openM('inspect')}>执行巡检</Btn>
                <Btn size="sm" onClick={() => toast('已打开「排巡检计划」表单（演示）')}>＋ 排计划</Btn>
              </div>
              <table className="nc-tbl" style={{ minWidth: 780 }}>
                <thead><tr><th style={{ width: 100 }}>周期</th><th>巡检范围</th>
                  <th style={{ width: 120 }}>下次执行日</th><th style={{ width: 100 }}>状态</th><th style={{ width: 110 }}>操作</th></tr></thead>
                <tbody>
                  {MAINT_PLANS.map((p) => (
                    <tr key={p.cycle}>
                      <td><Tag tone="blue">{p.cycle}</Tag></td>
                      <td className="nc-cell-sub">{p.scope}</td>
                      <td className="num">{p.next}</td>
                      <td><Tag tone="gold">{p.st}</Tag></td>
                      <td><Op onClick={() => openM('inspect')}>执行巡检</Op></td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="nc-ledhd" style={{ marginTop: 20 }}>问题工单
                <Tip w={330} text="闭环路径：巡检 / 报修产生问题 → 处理登记 → 甲方签字确认 → 销项。质保期 = 验收通过日 + 合同质保期，据此自动判定质保内 / 外；超期未销项进风险榜并提醒。" />
                <Btn size="sm" onClick={() => toast('已打开「登记问题」表单（演示）')}>＋ 登记问题</Btn>
                <Btn size="sm" onClick={() => toast('已导出《年度维保服务报告》（演示）')}>导出年度服务报告</Btn>
              </div>
              <table className="nc-tbl" style={{ minWidth: 1080 }}>
                <thead><tr>
                  <th style={{ width: 130 }}>工单</th><th style={{ width: 80 }}>来源</th><th style={{ width: 80 }}>等级</th>
                  <th>问题描述</th><th style={{ width: 100 }}>发现日</th><th style={{ width: 110 }}>要求完成日</th>
                  <th style={{ width: 90 }}>处理人</th><th style={{ width: 100 }}>状态</th><th style={{ width: 90 }}>质保判定</th>
                </tr></thead>
                <tbody>
                  {MAINT_ISSUES.map((i) => {
                    const late = i.st !== '已销项' && i.due < TODAY;
                    return (
                      <tr key={i.no} className={late ? 'is-warn-row' : ''}>
                        <td><DocNo id={i.no} /></td>
                        <td>{i.from}</td>
                        <td><Tag tone={i.level === '紧急' ? 'red' : 'gray'}>{i.level}</Tag></td>
                        <td className="nc-cell-sub">{i.desc}</td>
                        <td className="num">{i.found}</td>
                        <td className={late ? 'nc-v-red num' : 'num'}>{i.due}{late && ' · 超期'}</td>
                        <td>{i.owner}</td>
                        <td><Tag tone={i.st === '已销项' ? 'green' : i.st === '待确认' ? 'gold' : 'blue'}>{i.st}</Tag></td>
                        <td><Tag tone={i.inWarranty === '质保内' ? 'blue' : 'gray'}>{i.inWarranty}</Tag></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </>)}
          </div>
        )}

        {/* ---- 档案 ---- */}
        {tab === 'doc' && (
          <div className="nc-card-bd">
            <div className="nc-subtabs">
              <span className="nc-subtab is-on">项目文档 [{ATTACH.length}] · 共 <b>{ATT_CNT}</b> 个文件</span>
              <span className="nc-cell-sub" style={{ marginLeft: 6 }}>
                必传清单：<i className="nc-reqdot is-ok" />已传 ·
                <i className="nc-reqdot is-miss" />节点已到仍缺 ·
                <i className="nc-reqdot is-pending" />节点未到
              </span>
              <span style={{ marginLeft: 'auto' }}>
                <Btn size="sm" onClick={() => openM('upload')}>＋ 上传档案</Btn>
                <Tip w={330} text="竣工资料包由系统自动抓取进场报验单、隐蔽验收记录、检测报告、验收意见书、联系单与施工日志照片集，人工只补竣工图纸与验收原件扫描件。" />
                <Btn size="sm" onClick={() => toast('竣工资料包已导出（自动抓取 + 人工补齐，演示）')}>生成竣工资料包</Btn>
              </span>
            </div>
            <div className="nc-attgrp">
              {ATTACH.map((g) => {
                const miss = g.req.filter((r) => !g.files.some((f) => f.name.includes(r.slice(0, 4))));
                return (
                  <div key={g.mile} className="nc-attgrp-item">
                    <div className="nc-attgrp-hd">
                      {g.mile}
                      {!g.reached && <Tag tone="gray">节点未到</Tag>}
                      {g.req.length > 0 && (
                        <span className="nc-cell-sub">
                          {g.req.map((r) => {
                            const ok = !miss.includes(r);
                            const cls = ok ? 'is-ok' : g.reached ? 'is-miss' : 'is-pending';
                            return <span key={r} style={{ marginLeft: 8 }}><i className={`nc-reqdot ${cls}`} />{r}</span>;
                          })}
                        </span>
                      )}
                      <span style={{ marginLeft: 'auto' }}><Btn size="sm" onClick={() => openM('upload')}>上传</Btn></span>
                    </div>
                    {g.files.length === 0
                      ? <div className="nc-cell-sub">暂无文件 · {g.reached ? '节点已到，请尽快上传' : '待节点到达后上传'}</div>
                      : g.files.map((f) => (
                        <div key={f.name} className="nc-filechip"><Ico n="paperclip" size={16} /> {f.name}
                          <span className="nc-cell-sub">{f.size} · {f.by} · {f.date}</span>
                          <span className="nc-att-x" title="删除" onClick={() => setDelFile(f)} {...pressProps(() => setDelFile(f))}><Ico n="close" size={16} /></span>
                        </div>
                      ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* ============ 右下角全局「操作记录」抽屉 ============ */}
      <button className="nc-logfab" onClick={() => setLogOpen(true)}>
        <Ico n="clock" size={16} /> 操作记录
      </button>
      <Drawer open={logOpen} title="操作记录" sub={`${P.id} · ${P.name}`} width={640} onClose={() => setLogOpen(false)}
        foot={<Btn onClick={() => setLogOpen(false)}>关闭</Btn>}>
        <div className="nc-ledhd">状态流转</div>
        <Timeline items={HIST.map((h) => ({
          date: h.time,
          tone: h.cls === 'sys' ? 'gold' as const : h.cls === 'cur' ? 'gray' as const : 'ok' as const,
          text: <><b>{h.title}</b> <Tag tone={h.tone}>{h.tag}</Tag><div className="nc-cell-sub">{h.desc}</div></>,
        }))} />
        <div className="nc-cell-sub" style={{ marginTop: 4 }}>
          状态由业务事件与人工操作共同驱动：进场 / 完工 / 验收结算完成自动流转；暂停、恢复、关闭、重开、作废须人工发起并填写原因，全程留痕可审计。
        </div>

        <div className="nc-ledhd" style={{ marginTop: 16 }}>操作明细</div>
        <Timeline items={OPS.map((o) => ({
          date: o.t,
          tone: o.tag === '自动' ? 'gray' as const : 'ok' as const,
          text: <><b>{o.w}</b> <Tag tone={o.tag === '自动' ? 'blue' : 'gray'}>{o.tag}</Tag> {o.d}</>,
        }))} />
      </Drawer>

      {/* ============ 项目全景（跨模块全链路 · 只读聚合，不复制明细） ============ */}
      <Drawer open={m === 'panorama'} title="项目全景" sub={`${P.id} · ${P.name}`} width={640} onClose={closeM}
        foot={<><Btn onClick={closeM}>关闭</Btn><Btn kind="primary" onClick={() => { closeM(); setLogOpen(true); }}>查看操作记录 →</Btn></>}>
        <div className="nc-ledhd">全链路</div>
        <Timeline items={[
          {
            date: TR.opp?.last || '—', tone: TR.opp ? 'ok' : 'gray',
            text: TR.opp
              ? <>商机 <b>{TR.opp.id}</b> <Tag tone={TR.opp.status === '赢单' ? 'green' : 'blue'}>{TR.opp.status}</Tag>
                <div className="nc-cell-sub">{TR.opp.name} · 预计金额 {fmtAmt(TR.opp.amt)} · 归属 {TR.opp.owner}</div></>
              : <>未关联商机 <div className="nc-cell-sub">立项来源非商机转化（如框架协议、线下中标）</div></>,
          },
          {
            date: TR.quote?.date || '—', tone: TR.quote ? 'ok' : 'gray',
            text: TR.quote
              ? <>报价 <b>{TR.quote.id}</b> <Tag tone="gray">{TR.quote.status}</Tag>
                <div className="nc-cell-sub">{TR.quote.name} · 金额 {fmtAmt(TR.quote.total)} · 版本 {TR.quote.ver}</div></>
              : <>未关联报价 <div className="nc-cell-sub">可直接按合同额立项</div></>,
          },
          {
            date: TR.contract?.sign || P.start, tone: 'ok',
            text: <>合同 <b>{TR.contract?.id || '—'}</b> <Tag tone="blue">{TR.contract?.signStatus || '已签'}</Tag>
              <div className="nc-cell-sub">执行额 {fmtAmt(EXEC_AMT)} = 合同额 {fmtAmt(REV)} + 已生效变更 +{fmtAmt(CHG_EFFECTIVE)}（合同额冻结）</div></>,
          },
          {
            date: TODAY, tone: 'ok',
            text: <>项目执行中 <Tag tone="blue">{P.status} · {P.milestoneName}</Tag>
              <div className="nc-cell-sub">目标成本 {fmtAmt(PLAN_SUM)} · 已发生 {fmtAmt(COST_SUM)} · 成本偏差 {dev > 0 ? '+' : ''}{fmtAmt(dev)}</div></>,
          },
          {
            date: TODAY, tone: overdue.length > 0 ? 'red' : 'ok',
            text: <>资金 <b>{fmtAmt(CASH_IN)}</b> 已回款 · 回款率 {fmtPct(PAY_PROGRESS)}
              <div className="nc-cell-sub">未回款 {fmtAmt(UNRECV)} · 已开票未到账 {overdue.length} 笔 {fmtAmt(overdueAmt)} · 保证金待退 {depIn.length} 笔 {fmtAmt(depInAmt)}</div></>,
          },
          {
            date: isServiceProject(P) ? P.end : '—', tone: 'gray',
            text: <>维保衔接 <Tag tone={isServiceProject(P) ? 'purple' : 'gray'}>{isServiceProject(P) ? '含维保服务' : '无维保服务'}</Tag>
              <div className="nc-cell-sub">{isServiceProject(P) ? '结项后可转入长期维保服务，按年度服务费续签' : '竣工验收结算后项目归档'}</div></>,
          },
        ]} />
        <div className="nc-cell-sub" style={{ marginTop: 4 }}>
          全景只做跨模块聚合与下钻入口，各模块明细以本页 Tab 与对应模块页面为准，不在此重复取数。
        </div>
      </Drawer>

      {/* ============ 编辑项目档案（可编辑字段；编号 / 合同金额 / 工期为派生字段只读） ============ */}
      <Modal open={m === 'edit'} onClose={closeM} width={480} title="编辑项目档案" dirty
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('项目档案已更新 · 变更前后值已写入操作记录'); closeM(); }}>保存</Btn></>}>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">项目名称</div>
            <input className="nc-input" defaultValue={P.name} /></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">客户</div>
            <select className="nc-input" defaultValue={P.customer}>
              <option>{P.customer}</option>
            </select></div>
          <div className="nc-field"><div className="nc-field-label is-req">项目经理</div>
            <select className="nc-input" defaultValue={P.pm}>
              <option>{P.pm}</option><option>王志海</option><option>赵薇</option><option>李慧敏</option>
            </select></div>
          <div className="nc-field"><div className="nc-field-label is-req">项目类型</div>
            <select className="nc-input" defaultValue={P.type}>
              <option>{P.type}</option><option>新建</option><option>改造</option><option>维护保养</option><option>检测</option>
            </select></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">项目地址</div>
            <input className="nc-input" defaultValue="昆明市西山区前兴路 688 号万达广场" /></div>
        </div>
        <Banner tone="info">项目编号、合同金额、计划工期由业务派生，不在此直接编辑；工期调整走「发起变更」，合同金额随合同与变更单自动刷新。</Banner>
      </Modal>

      {/* ============ 指标穿透：明细列表 ============ */}
      <Modal open={!!drill} onClose={() => setDrill(null)} width={760}
        title={({
          rev: '合同额构成', in: '已回款明细', act: '已发生成本明细', payrate: '回款率构成',
          plan: '目标成本（立项预算）构成', dev: '成本偏差明细', rate: '毛利率构成',
          net: '项目净现金流构成', overdue: '应收账龄明细',
        } as Record<string, string>)[drill || ''] || '指标明细'}
        foot={<><Btn onClick={() => setDrill(null)}>关闭</Btn>{drill === 'rev' || drill === 'in'
          ? <Btn kind="primary" onClick={() => { setDrill(null); setTab('contract'); }}>查看关联合同 →</Btn>
          : drill === 'act' || drill === 'plan' || drill === 'dev'
            ? <Btn kind="primary" onClick={() => { setDrill(null); setTab('cost'); }}>查看成本台账 →</Btn>
            : drill === 'overdue'
              ? <Btn kind="primary" onClick={() => { setDrill(null); openM('dunning'); }}>去催收 →</Btn>
              : null}</>}>
        {/* ---- 合同额构成 ---- */}
        {drill === 'rev' && (
          <div>
            <Banner tone="info">合同额 = 仅主合同签约价（立项锚点），不含变更、不含维保/新增服务独立合同。</Banner>
            <table className="nc-tbl is-sm" style={{ marginTop: 10 }}>
              <thead><tr><th>合同编号</th><th>合同名称</th><th>类型</th><th>状态</th><th className="is-num">金额</th></tr></thead>
              <tbody>
                {SALE_CT.map((c) => (
                  <React.Fragment key={c.code}>
                    <tr>
                      <td><Code>{c.code}</Code></td><td>{c.name}</td>
                      <td><Tag tone={c.role === 'primary' ? 'blue' : c.role === 'maintenance' ? 'orange' : 'green'}>
                        {c.role === 'primary' ? '主合同' : c.role === 'maintenance' ? '维保合同' : '新增服务'}
                      </Tag></td>
                      <td><Tag tone={c.tone}>{c.st}</Tag></td>
                      <td className="is-num"><b>{fmtAmt(c.amt)}</b></td>
                    </tr>
                    {c.children?.map((ch) => (
                      <tr key={ch.code} style={{ background: '#f8fafd' }}>
                        <td style={{ paddingLeft: 28 }}><Code>{ch.code}</Code></td>
                        <td style={{ paddingLeft: 28 }}>{ch.name}</td>
                        <td><Tag tone="blue">价格调整补充</Tag></td>
                        <td><Tag tone="green">已生效</Tag></td>
                        <td className="is-num" style={{ color: '#52c41a' }}>+{fmtAmt(ch.amt)}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr className="nc-tbl-sum">
                  <td colSpan={4}>合同额（主合同签约价，冻结）</td>
                  <td className="is-num">{fmtAmt(REV)}</td>
                </tr>
                <tr className="nc-tbl-sum">
                  <td colSpan={4}>执行额 = 合同额 + 已生效变更 +{fmtAmt(CHG_EFFECTIVE)}</td>
                  <td className="is-num">{fmtAmt(EXEC_AMT)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
        {/* ---- 已回款明细 ---- */}
        {drill === 'in' && (
          <div>
            <Banner tone="info">回款 = 银行已到账金额；开票未到账只挂应收账龄，不计入回款。</Banner>
            <table className="nc-tbl is-sm" style={{ marginTop: 10 }}>
              <thead><tr><th>到账日期</th><th>收款编号</th><th>关联合同</th><th>说明</th><th className="is-num">到账金额</th></tr></thead>
              <tbody>
                {PAY_ROWS.filter((r) => r.kind === '收入' && r.st === 'paid').map((r) => (
                  <tr key={r.id}>
                    <td>{r.date}</td><td><Code>{r.id}</Code></td><td>{r.contract}</td>
                    <td className="nc-cell-sub">{r.use}</td>
                    <td className="is-num"><b>{fmtAmt(r.amt)}</b></td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="nc-tbl-sum">
                <td colSpan={4}>已到账合计</td><td className="is-num">{fmtAmt(CASH_IN)}</td>
              </tr></tfoot>
            </table>
            <div style={{ marginTop: 10, padding: '8px 12px', background: '#fffbe6', borderRadius: 6, fontSize: 13, color: '#ad6800' }}>
              <b>开票未到账（挂应收账龄，不计回款）：</b>
              {PAY_ROWS.filter((r) => r.kind === '收入' && r.st === 'invoiced').map((r) => (
                <div key={r.id} style={{ marginTop: 4 }}><Code>{r.id}</Code> · {r.contract} · {fmtAmt(r.amt)} · 账龄见「应收账龄」穿透</div>
              ))}
            </div>
          </div>
        )}
        {/* ---- 已发生成本明细 ---- */}
        {drill === 'act' && (
          <div>
            <Banner tone="info">成本一经发生即计入（含审批中），红字冲销与更正按净额追加。</Banner>
            <table className="nc-tbl is-sm" style={{ marginTop: 10 }}>
              <thead><tr><th>单据编号</th><th>类型</th><th>发生日期</th><th>说明</th><th className="is-num">金额</th></tr></thead>
              <tbody>
                {costRows.map((r) => (
                  <tr key={r.id}>
                    <td><Code>{r.id}</Code></td><td>{r.type}</td><td>{r.date}</td>
                    <td className="nc-cell-sub">{r.note}</td>
                    <td className="is-num">{fmtAmt(r.amt)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="nc-tbl-sum">
                <td colSpan={4}>成本合计</td><td className="is-num">{fmtAmt(COST_SUM)}</td>
              </tr></tfoot>
            </table>
          </div>
        )}
        {/* ---- 目标成本构成 ---- */}
        {drill === 'plan' && (
          <div>
            <Banner tone="info">目标成本 = 立项预算 130 万；已生效变更计入，审批中变更虚线展示。</Banner>
            <table className="nc-tbl is-sm" style={{ marginTop: 10 }}>
              <thead><tr><th>成本科目</th><th className="is-num">预算金额</th><th className="is-num">占比</th></tr></thead>
              <tbody>
                {[...new Set(planRows.map((r) => r.type))].map((t) => {
                  const sum = planRows.filter((r) => r.type === t).reduce((s, r) => s + r.amt, 0);
                  return <tr key={t}><td>{t}</td><td className="is-num">{fmtAmt(sum)}</td><td className="is-num">{fmtPct(sum / PLAN_SUM)}</td></tr>;
                })}
              </tbody>
              <tfoot><tr className="nc-tbl-sum">
                <td>目标成本合计</td><td className="is-num">{fmtAmt(PLAN_SUM)}</td><td className="is-num">100%</td>
              </tr></tfoot>
            </table>
          </div>
        )}
        {/* ---- 成本偏差 ---- */}
        {drill === 'dev' && (
          <div>
            <Banner tone="info">偏差 = 实际成本 − 目标成本；正数为超支，负数为节约。</Banner>
            <table className="nc-tbl is-sm" style={{ marginTop: 10 }}>
              <thead><tr><th>成本科目</th><th className="is-num">目标</th><th className="is-num">实际</th><th className="is-num">偏差</th></tr></thead>
              <tbody>
                {[...new Set([...planRows.map((r) => r.type), ...costRows.map((r) => r.type)])].map((t) => {
                  const pln = planRows.filter((r) => r.type === t).reduce((s, r) => s + r.amt, 0);
                  const act = costRows.filter((r) => r.type === t).reduce((s, r) => s + r.amt, 0);
                  const d = act - pln;
                  return <tr key={t}><td>{t}</td><td className="is-num">{fmtAmt(pln)}</td><td className="is-num">{fmtAmt(act)}</td>
                    <td className="is-num" style={{ color: d > 0 ? '#ff4d4f' : '#52c41a' }}>{d > 0 ? '+' : ''}{fmtAmt(d)}</td></tr>;
                })}
              </tbody>
              <tfoot><tr className="nc-tbl-sum">
                <td>合计</td><td className="is-num">{fmtAmt(PLAN_SUM)}</td><td className="is-num">{fmtAmt(COST_SUM)}</td>
                <td className="is-num" style={{ color: dev > 0 ? '#ff4d4f' : '#52c41a' }}>{dev > 0 ? '+' : ''}{fmtAmt(dev)}</td>
              </tr></tfoot>
            </table>
          </div>
        )}
        {/* ---- 应收账龄 ---- */}
        {drill === 'overdue' && (
          <div>
            <Banner tone="warn">以下款项已开票但超过计划日期未到账，建议跟进催收。</Banner>
            <table className="nc-tbl is-sm" style={{ marginTop: 10 }}>
              <thead><tr><th>开票日期</th><th>收款编号</th><th>关联合同</th><th>账龄</th><th className="is-num">未收金额</th></tr></thead>
              <tbody>
                {PAY_ROWS.filter((r) => r.kind === '收入' && r.st === 'invoiced').map((r) => (
                  <tr key={r.id}>
                    <td>{r.date}</td><td><Code>{r.id}</Code></td><td>{r.contract}</td>
                    <td><Tag tone="gold">75 天</Tag></td>
                    <td className="is-num"><b>{fmtAmt(r.amt)}</b></td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="nc-tbl-sum">
                <td colSpan={4}>应收账龄合计</td><td className="is-num">{fmtAmt(overdueAmt)}</td>
              </tr></tfoot>
            </table>
          </div>
        )}
        {/* ---- 净现金流 ---- */}
        {drill === 'net' && (
          <div>
            <Banner tone="info">净现金流 = 银行已到账 − 银行已支付（审批中不计）。</Banner>
            <table className="nc-tbl is-sm" style={{ marginTop: 10 }}>
              <tbody>
                <tr><td>银行已到账（收入）</td><td className="is-num" style={{ color: '#52c41a' }}>+{fmtAmt(CASH_IN)}</td></tr>
                <tr><td>银行已支付（支出）</td><td className="is-num" style={{ color: '#ff4d4f' }}>−{fmtAmt(CASH_OUT)}</td></tr>
              </tbody>
              <tfoot><tr className="nc-tbl-sum">
                <td>项目净现金流</td>
                <td className="is-num" style={{ color: NET_IN >= 0 ? '#52c41a' : '#ff4d4f' }}>{NET_IN >= 0 ? '+' : ''}{fmtAmt(NET_IN)}</td>
              </tr></tfoot>
            </table>
          </div>
        )}
        {/* ---- 毛利率 / 回款率 ---- */}
        {(drill === 'rate' || drill === 'payrate') && (
          <div>
            <Banner tone="info">{drill === 'rate' ? '毛利率 =（合同额 − 实际成本）÷ 合同额' : '回款率 = 已到账 ÷ 执行额'}</Banner>
            <table className="nc-tbl is-sm" style={{ marginTop: 10 }}>
              <tbody>
                {drill === 'rate' ? <>
                  <tr><td>合同额（收入锚点）</td><td className="is-num">{fmtAmt(REV)}</td></tr>
                  <tr><td>实际成本</td><td className="is-num">{fmtAmt(COST_SUM)}</td></tr>
                  <tr><td>毛利</td><td className="is-num">{fmtAmt(REV - COST_SUM)}</td></tr>
                </> : <>
                  <tr><td>已到账</td><td className="is-num">{fmtAmt(CASH_IN)}</td></tr>
                  <tr><td>执行额（应收基准）</td><td className="is-num">{fmtAmt(EXEC_AMT)}</td></tr>
                </>}
              </tbody>
              <tfoot><tr className="nc-tbl-sum">
                <td>{drill === 'rate' ? '毛利率' : '回款率'}</td>
                <td className="is-num">{drill === 'rate' ? fmtPct(actProfit) : fmtPct(PAY_PROGRESS)}</td>
              </tr></tfoot>
            </table>
          </div>
        )}
      </Modal>

      {/* ============ 登记收款 ============ */}
      <Modal open={m === 'pay'} onClose={closeM} width={480} title="登记收款" dirty
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('收款已登记 · 回款进度已刷新'); closeM(); }}>确认登记</Btn></>}>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">关联合同</div>
            <select className="nc-input"><option>HT000009 昆明万达广场消防改造工程合同</option></select></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">收款期次</div>
            <select className="nc-input">
              <option>收款期次 2 · 进度款（逾期 {fmtAmt(958000)}）</option>
              <option>收款期次 3 · 竣工结算款</option>
              <option>预收（无对应期次）</option>
            </select></div>
          <div className="nc-field"><div className="nc-field-label is-req">实收金额（元）</div><input className="nc-input" defaultValue={958000} /></div>
          <div className="nc-field"><div className="nc-field-label is-req">收款日期</div><input className="nc-input" type="date" defaultValue={TODAY} /></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label">凭证附件</div><input className="nc-input" type="file" /></div>
        </div>
        <Banner tone="info">登记后自动刷新：回款进度 / 已回款 / 未回款 / 净现金流；逾期行销项并写入操作记录。</Banner>
      </Modal>

      {/* ============ 红字冲销 ============ */}
      <Modal open={m === 'flush'} onClose={closeM} width={480} title="红字冲销 · 财务 + 管理员权限"
        foot={<><Btn onClick={closeM}>取消</Btn><Btn danger onClick={() => { setM('flush2'); }}>提交红字冲销</Btn></>}>
        <Banner tone="warn">红字冲销 = <b>负数单冲正</b> · 不回退合同状态 · <b>一笔仅一次</b> · 24h 内可撤销，全程留痕。</Banner>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label">原单据</div>
            <input className="nc-input" readOnly value={flushId || '—'} /></div>
          <div className="nc-field"><div className="nc-field-label is-req">红字冲销金额</div>
            <input className="nc-input num" readOnly value={flushRow ? fmtAmt(flushRow.amt) : '—'} /></div>
          <div className="nc-field"><div className="nc-field-label is-req">红字冲销原因</div>
            <select className="nc-input"><option>发票抬头错误</option><option>重复提交</option><option>金额录入错误</option><option>退票重开</option></select></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label">备注</div><textarea className="nc-input" rows={2} placeholder="选填" /></div>
        </div>
      </Modal>
      <Modal open={m === 'flush2'} onClose={closeM} width={480} title="二次确认 · 红字冲销"
        foot={<><Btn onClick={closeM}>取消</Btn><Btn danger onClick={() => { toast('红字冲销单已生成 · 原单标记已红字冲销 · 24h 内可撤销'); setM(null); setFlushId(''); }}>确认红字冲销</Btn></>}>
        <div className="nc-cap-red">
          确认对 {flushId || '—'} 执行红字冲销，冲销金额 {flushRow ? fmtAmt(flushRow.amt) : '—'}？
        </div>
        <div className="nc-cell-sub" style={{ marginTop: 8 }}>红字冲销后：原单标记「已红字冲销」，生成负数单冲正；合同状态不回退；该笔不可再次红字冲销。</div>
      </Modal>

      {/* ============ 更正成本 ============ */}
      <Modal open={m === 'correct'} onClose={closeM} width={480} title="更正成本 · 原行只读 · 不可删除"
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('已追加负数更正行 · 原行保持只读 · 净额已刷新偏差与毛利率'); closeM(); }}>提交更正</Btn></>}>
        <Banner tone="warn">原登记行将<b>保持只读</b>，本操作<b>追加</b>一条负数流水；<b>禁止物理删除</b>。净额自动刷新成本偏差与毛利率。</Banner>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">更正对象（原行）</div>
            <select className="nc-input">{costRows.filter((c) => c.src !== 'CG').map((c) => <option key={c.id}>{c.id} · {c.type} · {fmtAmt(c.amt)}</option>)}</select></div>
          <div className="nc-field"><div className="nc-field-label is-req">更正金额（负数）</div><input className="nc-input" type="number" defaultValue={-62000} /></div>
          <div className="nc-field"><div className="nc-field-label">更正日期</div><input className="nc-input" type="date" defaultValue={TODAY} /></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">更正原因（留痕）</div><textarea className="nc-input" rows={3} placeholder="例：09-06 管理费录入重复" /></div>
        </div>
      </Modal>

      {/* ============ 登记成本 ============ */}
      <Modal open={m === 'cost'} onClose={closeM} width={480} title="登记成本" dirty
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('成本已登记 · 成本口径已刷新'); closeM(); }}>提交登记</Btn></>}>
        <div className="nc-form-grid">
          <div className="nc-field"><div className="nc-field-label is-req">成本类型</div>
            <select className="nc-input">{COST9.map((t) => <option key={t}>{t}</option>)}</select></div>
          <div className="nc-field"><div className="nc-field-label is-req">金额（元）</div><input className="nc-input" type="number" placeholder="0.00" /></div>
          <div className="nc-field"><div className="nc-field-label is-req">发生日期</div><input className="nc-input" type="date" defaultValue={TODAY} /></div>
          <div className="nc-field"><div className="nc-field-label">相对方</div><input className="nc-input" placeholder="供应商 / 班组" /></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">说明</div><textarea className="nc-input" rows={2} placeholder="例：9 月班组工资" /></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label">凭证</div><input className="nc-input" type="file" /></div>
        </div>
        <Banner tone="info">登记后即时计入成本口径；如需更正，走「更正成本」追加负数行，不可删除原行。</Banner>
      </Modal>

      {/* ============ 归并 / 转为正式合同 ============ */}
      <Modal open={m === 'merge'} onClose={closeM} width={480} title="无合同付款 · 转为正式合同" dirty
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('已归并至采购合同 · 原行保留并标记去向 · 24h 内可撤销'); closeM(); }}>确认归并</Btn></>}>
        <Banner tone="info">归并由 <b>项目经理 + 管理员</b>执行；归并后原行<b>保留并置灰</b>、标记归并去向，<b>24 小时内可撤销</b>。</Banner>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">待归并付款</div>
            <select className="nc-input">{PAY_ROWS.filter((r) => r.kind === '无合同付款' && !r.mergedTo).map((r) => <option key={r.id}>{r.id} · {fmtAmt(r.amt)}</option>)}</select></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">归并至采购合同</div>
            <select className="nc-input">{BUY_CT.map((c) => <option key={c.code}>{c.code} · {c.name}</option>)}</select></div>
        </div>
      </Modal>

      {/* ============ 保证金台账 ============ */}
      <Modal open={m === 'deposit'} onClose={closeM} width={840} title={`保证金台账 · ${P.name}`}
        foot={<Btn onClick={closeM}>关闭</Btn>}>
        <div className="nc-stat4">
          <div className="nc-stat4-cell">我方缴纳总额<b>{fmtAmt(DEPOSITS.reduce((a, d) => a + d.amt, 0))}</b></div>
          <div className="nc-stat4-cell">已退还<b className="nc-v-green">{fmtAmt(5000)}</b></div>
          <div className="nc-stat4-cell">待退回（我方缴纳）<b className="nc-v-red">{fmtAmt(depInAmt)}</b></div>
          <div className="nc-stat4-cell">质保金义务（客户扣留）<b className="nc-v-orange">{fmtAmt(WARRANTY)}</b></div>
        </div>
        <table className="nc-tbl" style={{ minWidth: 840 }}>
          <thead><tr><th style={{ width: 160 }}>单据</th><th style={{ width: 180 }}>类型</th><th>方向 / 对象</th>
            <th style={{ width: 120 }} className="is-num">金额</th><th style={{ width: 110 }}>缴纳日</th><th style={{ width: 120 }}>应退日</th>
            <th style={{ width: 110 }}>状态</th><th style={{ width: 130 }}>操作</th></tr></thead>
          <tbody>
            {depositRows.map((d) => (
              <tr key={d.id}>
                <td><b>{d.id}</b></td><td>{d.type}</td>
                <td className="nc-cell-sub">{d.dir === 'in' ? '我方缴纳 · 待退回' : '我方收取 · 结算时扣留'}<br />{d.party}</td>
                <td className="is-num">{fmtAmt(d.amt)}</td><td>{d.pay}</td><td>{d.due}</td>
                <td><Tag tone={d.st === '未退' ? 'red' : d.st === '待扣留' ? 'gold' : 'green'}>{d.st}</Tag></td>
                <td>
                  {d.st === '未退'
                    ? <><Op onClick={() => { setDepRelId(d.id); setM('depRel'); }}>解除登记</Op><OpSep /><Op onClick={() => toast(`${d.id} 退还流程已发起 · 财务待办 T+3`)}>发起退还</Op></>
                    : <span className="nc-cell-sub">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="nc-cell-sub" style={{ marginTop: 8 }}>
          退还流转：未退 →（解除登记）已解除 →（发起 / 退还）退还中 →（确认到账）已退还 ｜ 全程留痕。
          质保金 = 合同金额 × 3%（法定上限）= {fmtAmt(WARRANTY)}，属客户扣留义务，不并入「我方缴纳待退回」。
        </div>
      </Modal>

      {/* ============ 保证金解除登记 ============ */}
      <Modal open={m === 'depRel'} onClose={closeM} width={480} title="保证金解除登记" dirty
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('解除登记完成 · 待退回金额已更新'); setM('deposit'); }}>确认解除</Btn></>}>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label">保证金</div>
            <input className="nc-input" readOnly value={DEPOSITS.find((d) => d.id === depRelId)?.id || ''} /></div>
          <div className="nc-field"><div className="nc-field-label is-req">解除金额</div>
            <input className="nc-input" defaultValue={DEPOSITS.find((d) => d.id === depRelId)?.amt || 0} /></div>
          <div className="nc-field"><div className="nc-field-label is-req">解除日期</div><input className="nc-input" type="date" defaultValue={TODAY} /></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label">依据附件</div><input className="nc-input" type="file" /></div>
        </div>
      </Modal>

      {/* ============ 确认里程碑 ============ */}
      <Modal open={m === 'mile'} onClose={closeM} width={640} title={`确认里程碑${curMile ? ` · ${curMile.name}` : ''}`}
        foot={<>
          <Btn onClick={closeM}>取消</Btn>
          <Btn kind="primary" disabled={curMiss.length > 0}
            onClick={() => { toast(`${curMile?.name} 已确认 · 资料已归档至项目档案`); closeM(); }}>
            确认当前节点
          </Btn>
        </>}>
        <Banner tone="info">
          当前节点资料齐备后方可提交；其余节点由系统推进，本页只读。
        </Banner>
        <table className="nc-tbl" style={{ minWidth: 560 }}>
          <thead><tr><th>里程碑节点</th><th style={{ width: 190 }}>计划 / 实际</th><th style={{ width: 110 }}>状态</th></tr></thead>
          <tbody>
            {MILE_AXIS.map((mi) => (
              <tr key={mi.name} className={mi.st === 'cur' ? 'is-warn-row' : mi.st === '' ? 'is-dead-row' : ''}>
                <td><b>{mi.name}</b></td>
                <td className="nc-cell-sub">{mi.date}</td>
                <td>
                  {mi.st === 'done' ? <Tag tone="green">已完成</Tag>
                    : mi.st === 'cur' ? <Tag tone="blue">待确认（当前节点）</Tag>
                    : <Tag tone="gray">未到节点</Tag>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {curMile && (
          <>
            <div className="nc-ledhd" style={{ marginTop: 12 }}>当前节点资料齐备性（{curMile.name}）</div>
            <div className="nc-reqgrid">
              {curReq.map((r) => (
                <span key={r} className={curMiss.includes(r) ? 'is-miss' : 'is-ok'}>
                  <i className={`nc-reqdot ${curMiss.includes(r) ? 'is-miss' : 'is-ok'}`} />{r}
                </span>
              ))}
            </div>
            {curMiss.length > 0 && (
              <Banner tone="warn">尚有 {curMiss.length} 项必传资料缺失，补齐后「确认当前节点」才可提交。</Banner>
            )}
          </>
        )}
      </Modal>

      {/* ============ 验收查验记录 ============ */}
      <Modal open={m === 'accept'} onClose={closeM} width={640} title="验收查验记录（竣工验收消防查验记录）"
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('验收查验记录已提交 · 通过后归档至 M5 节点'); closeM(); }}>提交核验</Btn></>}>
        <table className="nc-tbl" style={{ minWidth: 560 }}>
          <thead><tr><th>核验项</th><th style={{ width: 90 }}>结果</th><th style={{ width: 190 }}>备注</th></tr></thead>
          <tbody>
            {['火灾自动报警系统联动测试', '自动喷淋系统试压与喷放', '防排烟系统风量测试', '应急照明与疏散指示连续供电', '消防水池 / 泵房联动'].map((n) => (
              <tr key={n}><td>{n}</td><td><Tag tone="green">合格</Tag></td><td className="nc-cell-sub">符合 GB 50166</td></tr>
            ))}
          </tbody>
        </table>
        <Banner tone="info">本记录只在 M5 竣工验收节点提交；必传项未齐（核验单 + 影像 + 签字件）时不可提交。</Banner>
      </Modal>

      {/* ============ 发起变更（双模式：增量式 / 总额式） ============ */}
      <Modal open={m === 'change'} onClose={closeM} width={520} title="发起变更" dirty
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => {
          const total = Number(chgAmt) || 0;
          const delta = chgMode === 'increment' ? total : Math.round(total - EXEC_AMT);
          if (!total) { toast('请填写变更金额'); return; }
          if (delta < 0 && !chgReason.trim()) { toast('负增量（核减）必须填写核减原因'); return; }
          applyChangeDelta(P.id, delta, 'BG0002');
          toast(`变更已提交 · 增量 ${delta >= 0 ? '+' : ''}${fmtAmt(delta)} · 生效后仅刷新执行额（合同额冻结）`);
          setChgAmt(''); setChgReason(''); closeM();
        }}>提交变更</Btn></>}>
        <Banner tone="info">合同额冻结为主合同签约价；变更生效后只刷新<b>执行额</b>（合同额 + 已生效增量），并按新执行额重算收款期次。</Banner>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">录入模式</div>
            <label style={{ marginRight: 12 }}><input type="radio" checked={chgMode === 'increment'} onChange={() => setChgMode('increment')} /> 增量式（直接填增量）</label>
            <label><input type="radio" checked={chgMode === 'total'} onChange={() => setChgMode('total')} /> 总额式（填总额自动反算）</label>
          </div>
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">变更金额（元）</div>
            <input className="nc-input" type="number" value={chgAmt} onChange={(e) => setChgAmt(e.target.value)} placeholder={chgMode === 'increment' ? '如 150000（增量）' : '如 1950000（变更后总额）'} /></div>
          <div className="nc-field nc-field-2">
            <div className="nc-cell-sub" style={{ background: '#f2f6ff', padding: 8, borderRadius: 6 }}>
              当前执行额 <b className="num">{fmtAmt(EXEC_AMT)}</b>（基准 = 最新已生效执行额）。
              {chgMode === 'total' && Number(chgAmt) > 0 && (
                <>自动反算增量：<b className="num">{fmtAmt(Number(chgAmt))} − {fmtAmt(EXEC_AMT)} = {Number(chgAmt) - EXEC_AMT >= 0 ? '+' : ''}{fmtAmt(Number(chgAmt) - EXEC_AMT)}</b></>
              )}
              {chgMode === 'total' && Number(chgAmt) > 0 && Number(chgAmt) < EXEC_AMT && <div className="nc-v-red">总额低于当前执行额，将核减 —— 请确认并填写核减原因。</div>}
            </div>
          </div>
          {(() => { const total = Number(chgAmt) || 0; const delta = chgMode === 'increment' ? total : total - EXEC_AMT; return delta < 0; })() && (
            <div className="nc-field nc-field-2"><div className="nc-field-label is-req">核减原因（负增量必填）</div>
              <textarea className="nc-input" rows={2} value={chgReason} onChange={(e) => setChgReason(e.target.value)} placeholder="例：工程量核减 68 米，甲方确认…" /></div>
          )}
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">变更内容</div><textarea className="nc-input" rows={2} placeholder="例：材料调差 / 增补机房气体灭火系统" /></div>
        </div>
      </Modal>

      {/* ============ 审批台 ============ */}
      <Modal open={m === 'approve'} onClose={closeM} width={640} title="审批台 · 待我审批（本项目 3 笔）"
        foot={<Btn onClick={closeM}>关闭</Btn>}>
        <Banner tone="info">已按本项目筛选，仅展示与该详情页相关的 {APPROVALS.length} 笔待办。</Banner>
        <table className="nc-tbl" style={{ minWidth: 620 }}>
          <thead><tr><th style={{ width: 160 }}>单据</th><th style={{ width: 90 }}>类型</th><th>摘要</th><th style={{ width: 120 }}>操作</th></tr></thead>
          <tbody>
            {APPROVALS.map((a) => (
              <tr key={a.id}><td><DocNo id={a.id} /></td><td><Tag tone="blue">{a.type}</Tag></td><td>{a.desc}</td>
                <td><Op onClick={() => toast(`${a.id} 已通过`)}>通过</Op><OpSep /><Op danger onClick={() => setRejA(a)}>驳回</Op></td></tr>
            ))}
          </tbody>
        </table>
      </Modal>

      {/* ============ 关联新合同 ============ */}
      <Modal open={m === 'link'} onClose={closeM} width={480} title="关联新合同" dirty
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('合同已关联至本项目'); closeM(); }}>确认关联</Btn></>}>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">合同方向</div>
            <select className="nc-input"><option>销售合同</option><option>采购 / 分包合同</option></select></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">合同编号</div><input className="nc-input" placeholder="如 HT000015" /></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">合同名称</div><input className="nc-input" /></div>
          <div className="nc-field"><div className="nc-field-label is-req">金额（元）</div><input className="nc-input" type="number" /></div>
          <div className="nc-field"><div className="nc-field-label">相对方</div><input className="nc-input" /></div>
        </div>
      </Modal>

      {/* ============ 添加成员 ============ */}
      <Modal open={m === 'member'} onClose={closeM} width={480} title="添加成员" dirty
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

      {/* ============ 进场报验 ============ */}
      <Modal open={m === 'arrival'} onClose={closeM} width={640} title="材料进场报验" dirty
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('进场报验单已生成 · 待监理签认'); closeM(); }}>生成报验单</Btn></>}>
        <Banner tone="info">选择入库批次后，系统按材料「进场报验要求」自动检查附件是否齐备，缺件将拦截报验单生成。</Banner>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">关联入库批次</div>
            <select className="nc-input"><option>RK000021 · 2026-10-04 · 第 3 批</option><option>RK000019 · 2026-09-26 · 第 2 批</option></select></div>
          <div className="nc-field"><div className="nc-field-label">报验日期</div><input className="nc-input" type="date" defaultValue={TODAY} /></div>
          <div className="nc-field"><div className="nc-field-label is-req">报验人</div><input className="nc-input" defaultValue="张工" /></div>
        </div>
        <div className="nc-ledhd" style={{ marginTop: 12 }}>附件齐备性自动检查</div>
        <table className="nc-tbl" style={{ minWidth: 520 }}>
          <thead><tr><th>材料</th><th style={{ width: 120 }}>进场报验要求</th><th style={{ width: 110 }}>检查结果</th></tr></thead>
          <tbody>
            <tr><td>镀锌钢管 DN100</td><td className="nc-cell-sub">合格证 / 检测报告</td><td><i className="nc-reqdot is-ok" />齐备</td></tr>
            <tr><td>沟槽卡箍 DN100</td><td className="nc-cell-sub">合格证 / 3C 证书</td><td><i className="nc-reqdot is-miss" />缺 3C 证书</td></tr>
          </tbody>
        </table>
        <div className="nc-cell-sub nc-v-red" style={{ marginTop: 8 }}>
          <Ico n="warning" size={16} /> 存在缺件材料，提交将被拦截；请补齐附件后重试（缺件不可生成报验单）。
        </div>
      </Modal>

      {/* ============ 现场签证登记 ============ */}
      <Modal open={m === 'visa'} onClose={closeM} width={480} title="现场签证 / 洽商登记" dirty
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('签证已登记 · 可一键生成合同变更单'); closeM(); }}>提交登记</Btn></>}>
        <Banner tone="info">签证登记不等于变更生效：须走完合同变更审批与补充协议后才计入执行额，方可据此收款。</Banner>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">签证事由</div>
            <input className="nc-input" placeholder="如：机房新增气体灭火系统（甲方口头要求）" /></div>
          <div className="nc-field"><div className="nc-field-label is-req">预计金额（元）</div><input className="nc-input" type="number" /></div>
          <div className="nc-field"><div className="nc-field-label">发生日期</div><input className="nc-input" type="date" defaultValue={TODAY} /></div>
          <div className="nc-field"><div className="nc-field-label is-req">甲方签字</div>
            <select className="nc-input"><option>已签认（扫描件已上传）</option><option>待签认</option></select></div>
          <div className="nc-field"><div className="nc-field-label">登记人</div><input className="nc-input" defaultValue="张工" /></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">现场照片</div><input className="nc-input" type="file" multiple /></div>
        </div>
      </Modal>

      {/* ============ 挂证书 ============ */}
      <Modal open={m === 'cert'} onClose={closeM} width={480} title="挂接证书（生成占用记录）" dirty
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('证书已挂接 · 占用记录已生成'); closeM(); }}>确认挂接</Btn></>}>
        <Banner tone="info">系统校验证书有效期与占用上限：过期或已达上限将硬拦截；企业资质按「多项目共用」处理。</Banner>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">选择证书</div>
            <select className="nc-input">
              {CERTS.filter((c) => c.status !== '已过期').map((c) => <option key={c.id}>{c.id} · {c.name} · {c.holder}</option>)}
            </select></div>
          <div className="nc-field"><div className="nc-field-label">有效期至</div><input className="nc-input" defaultValue="2027-08-31" readOnly /></div>
          <div className="nc-field"><div className="nc-field-label">占用上限</div><input className="nc-input" defaultValue="1" readOnly /></div>
          <div className="nc-field"><div className="nc-field-label is-req">占用起始日</div><input className="nc-input" type="date" defaultValue={TODAY} /></div>
          <div className="nc-field"><div className="nc-field-label">预计释放日</div><input className="nc-input" type="date" /></div>
        </div>
      </Modal>

      {/* ============ 执行巡检 ============ */}
      <Modal open={m === 'inspect'} onClose={closeM} width={480} title="执行巡检（扫码 + GPS 双校验）" dirty
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('巡检记录已提交 · 计划状态已回写'); closeM(); }}>提交巡检记录</Btn></>}>
        <Banner tone="info">巡检记录须经点位扫码与移动端打卡 GPS 双校验确认到场；范围超出合同服务范围将被拦截。</Banner>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">巡检计划</div>
            <select className="nc-input">{MAINT_PLANS.map((p) => <option key={p.cycle}>{p.cycle} · {p.scope}</option>)}</select></div>
          <div className="nc-field"><div className="nc-field-label">点位扫码</div><input className="nc-input" defaultValue="PT-0036（已扫）" readOnly /></div>
          <div className="nc-field"><div className="nc-field-label">GPS 定位</div><input className="nc-input" defaultValue="已校验 · 院内 32m" readOnly /></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">巡检记录</div>
            <textarea className="nc-input" rows={3} placeholder="记录巡检发现与处理情况" /></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label">现场照片</div><input className="nc-input" type="file" multiple /></div>
        </div>
      </Modal>

      {/* ============ 项目状态流转（暂停 / 恢复 / 终止服务 / 作废） ============ */}
      <Modal open={m === 'pause'} onClose={closeM} width={480} title="暂停项目 · 必填暂停原因" dirty
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { moveProject(P.id, '暂停', { reason: '甲方作业面未移交（示例）' }); toast(`${P.id} 已暂停 · 原因已留痕`); closeM(); }}>确认暂停</Btn></>}>
        <Banner tone="warn">暂停后里程碑与收款节点计时同步挂起；恢复时须再次填写原因，两次操作均写入状态流转日志。</Banner>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">暂停原因</div>
            <textarea className="nc-input" rows={3} placeholder="如：甲方装修标段交叉作业，作业面未移交" /></div>
          <div className="nc-field"><div className="nc-field-label">暂停日期</div><input className="nc-input" type="date" defaultValue={TODAY} /></div>
          <div className="nc-field"><div className="nc-field-label">操作人</div><input className="nc-input" defaultValue="蓝峰" readOnly /></div>
        </div>
      </Modal>

      <Modal open={m === 'resume'} onClose={closeM} width={480} title="恢复执行 · 必填恢复原因" dirty
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { moveProject(P.id, '执行中', { reason: '作业面已移交（示例）' }); toast(`${P.id} 已恢复执行 · 原因已留痕`); closeM(); }}>确认恢复</Btn></>}>
        <Banner tone="info">当前暂停原因：{P.pauseReason || '—'}（暂停于 {P.pausedAt || '—'}）</Banner>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">恢复原因</div>
            <textarea className="nc-input" rows={3} placeholder="如：作业面已移交，具备施工条件" /></div>
          <div className="nc-field"><div className="nc-field-label">恢复日期</div><input className="nc-input" type="date" defaultValue={TODAY} /></div>
          <div className="nc-field"><div className="nc-field-label">操作人</div><input className="nc-input" defaultValue="蓝峰" readOnly /></div>
        </div>
      </Modal>

      <Modal open={m === 'close'} onClose={closeM} width={480} title="终止维保服务 · 转已关闭" dirty
        foot={<><Btn onClick={closeM}>取消</Btn><Btn danger onClick={() => { moveProject(P.id, '已关闭', { reason: '服务期满，甲方未续签（示例）' }); toast(`${P.id} 已关闭 · 可重开`); closeM(); }}>确认终止</Btn></>}>
        <Banner tone="warn">终止后项目进入「已关闭」终态，不再产生巡检计划与问题工单；如需继续服务须重开项目。</Banner>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">终止原因</div>
            <textarea className="nc-input" rows={3} placeholder="如：服务期满，甲方未续签" /></div>
          <div className="nc-field"><div className="nc-field-label">终止日期</div><input className="nc-input" type="date" defaultValue={TODAY} /></div>
          <div className="nc-field"><div className="nc-field-label">操作人</div><input className="nc-input" defaultValue="赵薇" readOnly /></div>
        </div>
      </Modal>

      <Modal open={m === 'void'} onClose={closeM} width={480} title="作废项目 · 不可恢复"
        foot={<><Btn onClick={closeM}>取消</Btn><Btn danger onClick={() => { moveProject(P.id, '作废', { reason: '重复录入（示例）' }); toast(`${P.id} 已作废 · 留痕不可恢复`); closeM(); }}>确认作废</Btn></>}>
        <Banner tone="danger">作废用于「建错」场景：作废后项目不可恢复，也不可重开；关联单据与已发生成本仍保留可查。</Banner>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">作废原因</div>
            <textarea className="nc-input" rows={3} placeholder="如：与 XM000074 重复录入" /></div>
          <div className="nc-field"><div className="nc-field-label">操作人</div><input className="nc-input" defaultValue="蓝峰" readOnly /></div>
        </div>
      </Modal>

      {/* ============ 登记第三方消防检测 ============ */}
      <Modal open={m === 'check'} onClose={closeM} width={480} title="登记第三方消防检测" dirty
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('检测信息已登记 · 报告已归档至「验收」分类'); closeM(); }}>保存</Btn></>}>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">检测机构</div><input className="nc-input" defaultValue={CHECK_INFO.org} /></div>
          <div className="nc-field"><div className="nc-field-label is-req">报告编号</div><input className="nc-input" placeholder="如 JC2027-0219" /></div>
          <div className="nc-field"><div className="nc-field-label is-req">检测日期</div><input className="nc-input" type="date" defaultValue={TODAY} /></div>
          <div className="nc-field"><div className="nc-field-label is-req">检测结论</div>
            <select className="nc-input"><option>合格</option><option>不合格（需整改）</option></select></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">报告附件</div><input className="nc-input" type="file" /></div>
        </div>
      </Modal>

      {/* ============ 确认结算额 ============ */}
      <Modal open={m === 'settle'} onClose={closeM} width={480} title="确认结算额" dirty
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('结算额已确认 · 结项前置链条已更新'); closeM(); }}>确认结算额</Btn></>}>
        <Banner tone="info">结项前置链条：消防检测报告 → 消防验收通过 → 结算额确认 → 竣工 checklist 归档。</Banner>
        <div className="nc-form-grid">
          <div className="nc-field"><div className="nc-field-label">合同金额</div><input className="nc-input" defaultValue={fmtAmt(CONTRACT_NOW)} readOnly /></div>
          <div className="nc-field"><div className="nc-field-label is-req">结算额（元）</div><input className="nc-input" type="number" defaultValue={CONTRACT_NOW} /></div>
          <div className="nc-field"><div className="nc-field-label">结算日期</div><input className="nc-input" type="date" defaultValue={TODAY} /></div>
          <div className="nc-field"><div className="nc-field-label">结算依据</div>
            <select className="nc-input"><option>合同 + 已生效变更</option><option>审计结算报告</option></select></div>
        </div>
      </Modal>

      {/* ============ 上传档案 ============ */}
      <Modal open={m === 'upload'} onClose={closeM} width={480} title="上传档案" dirty
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('档案已上传 · 已同步至文档中心'); closeM(); }}>确认上传</Btn></>}>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">归属节点</div>
            <select className="nc-input">{ATTACH.map((g) => <option key={g.mile}>{g.mile}</option>)}</select></div>
          <div className="nc-field"><div className="nc-field-label">文件类型</div>
            <select className="nc-input"><option>验收查验记录</option><option>影像资料</option><option>签字件</option><option>施工记录</option><option>其他</option></select></div>
          <div className="nc-field"><div className="nc-field-label">上传人</div><input className="nc-input" defaultValue="蓝峰" /></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">选择文件</div><input className="nc-input" type="file" multiple /></div>
        </div>
      </Modal>

      {/* ============ 生成催收记录 ============ */}
      <Modal open={m === 'dunning'} onClose={closeM} width={480} title="生成催收记录" dirty
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('催收记录已生成 · 已推送至商务经理待办'); closeM(); }}>生成并推送</Btn></>}>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">催收对象</div>
            <select className="nc-input">{overdue.map((r) => <option key={r.id}>{r.id} · {fmtAmt(r.amt)} · {r.use}</option>)}</select></div>
          <div className="nc-field"><div className="nc-field-label is-req">催收方式</div>
            <select className="nc-input"><option>电话催收</option><option>上门拜访</option><option>发函催告</option><option>法务函</option></select></div>
          <div className="nc-field"><div className="nc-field-label is-req">责任人</div>
            <select className="nc-input"><option>李商务（商务经理）</option><option>蓝峰（项目发起人）</option></select></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label">催收说明</div><textarea className="nc-input" rows={3} placeholder="记录沟通结果与下一步动作" /></div>
        </div>
      </Modal>

      {/* ============ 移除项目成员 ============ */}
      <ConfirmModal
        open={!!rmMb} onClose={() => setRmMb(null)} okText="确认移除"
        title="移除项目成员"
        reason reasonLabel="移除原因"
        impact={rmMb && <>将把 <b>{rmMb.name}</b>（{rmMb.role}）从本项目团队移除（软删除 · 记为已离场）。<br />移除后其<b>待办与责任事项将无人承接</b>；若该成员为专职安全员，安全生产职责需明确移交人后方可移除。</>}
        onOk={(r) => { toast(`${rmMb?.name} 已移除（软删除 · 已离场）并留痕，原因：${r}`); setRmMb(null); }}
      />

      {/* ============ 删除档案文件 ============ */}
      <ConfirmModal
        open={!!delFile} onClose={() => setDelFile(null)} okText="确认删除"
        title="删除档案文件"
        reason reasonLabel="删除原因"
        impact={delFile && <>将删除 <b>{delFile.name}</b>（{delFile.size} · {delFile.by} · {delFile.date}），并与文档中心<b>双向同步删除</b>。<br />若该文件属于验收类必传项，删除后对应节点将回到「资料未齐」状态，不可提交确认。</>}
        onOk={(r) => { toast(`${delFile?.name} 已删除并留痕，原因：${r}`); setDelFile(null); }}
      />

      {/* ============ 审批驳回 ============ */}
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