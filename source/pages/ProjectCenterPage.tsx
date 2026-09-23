/* 项目详情（项目详情）· 分层详情外壳 —— 概览页 + 5 个业务域子页
 *
 * 重构要点（对齐用户 2026-09-23 评审）：
 *   1. 形态：由「单页 6 卡 + 长 Tab」改为「概览页 + 独立子页」。子页是兄弟视图，不是弹窗 / 抽屉。
 *   2. 载体：不同载体各守其界 ——
 *        概览页与子页 → 同级导航（二级页签，不进浏览器历史栈）；
 *        审阅型跨模块视图（项目全景 / 操作记录全文）→ 抽屉；
 *        编辑或登记类短表单（≤5 字段）→ 弹窗 480；长表单 → 抽屉 640。
 *   3. 分层导航：页头（面包屑 + 身份 + 状态 + 溯源 + 操作）与二级导航条常驻，
 *      内容区吃满剩余高度后内部滚动，避免「要滑很多屏才看到真正要看的东西」。
 *   4. 数字唯一归属：绝对值只在概览页出现一次，其它子页只承接差额 / 比率 / 流水；
 *      同一个数字的两种说法（回款率 / 回款进度）合并为一种。
 *   5. 闭环：全链路血缘（每跳可点）· 风险处置到销项 · 节点准入资料硬拦截 · 资金穿透链。
 *
 * 口径（唯一事实源，全页共用）：
 *   合同额 = 主合同签约价（立项锚点，冻结）
 *   执行额 = 合同额 + 已生效变更增量
 *   未回款 + 已回款 + 已核销坏账 = 执行额
 *   回款率 = 已回款 ÷ 执行额      （不再保留「收入完成度 / 回款进度」等同值指标）
 *   质保金 = 合同额 × 3%（法定上限）
 *
 * 硬规则：成本更正不可物理删除（负数追加）· 验收→结项须资料完整度 ·
 *        节点确认须准入资料齐备（缺件硬拦截）· 签证未生成变更单不计执行额、不可收款 ·
 *        变更 / 签证转变更单在合同侧发起（要签补充协议），项目侧只承接结果
 *
 * ⚠️ vite.config.ts 为 jsxRuntime: 'classic'，JSX 编译为 React.createElement，
 *    本文件与全部子页必须保留 `import React from 'react'`（删掉会在运行时报 React is not defined）。
 */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Banner, Btn, Card, Code, ConfirmModal, Drawer, EntityLink, IdCell, KvGrid, Modal, Money,
  Op, OpMore, PageHead, Progress, Tag, Timeline, Tip, Tabs, useToast,
} from '../components/ui';
import { Ico } from '../components/icons';
import {
  ATT_WORKERS, CUSTOMERS, EQUIPMENTS, MATERIALS,
  PROJECT_STATUS_TONE, PROJECT_TERMINAL, TODAY,
  attCost, attDays, fmt, fmtAmt, fmtPct, fmtWan, isContractClosed, isServiceProject, laborRate, normContractStatus,
  teamOfProject, occOfProject, CERTS,
} from '../components/data';
import type { Installment } from '../components/data';
import { consumeFocusTab, getContracts, getFocus, getOpps, getProjects, moveProject, patchContract, patchProject, relOfProject, setFocus, setFocusTab, subscribeStore } from '../components/store';
import OverviewSub from '../components/project-center/OverviewSub';
import ExecSub from '../components/project-center/ExecSub';
import QualitySub from '../components/project-center/QualitySub';
import BizSub from '../components/project-center/BizSub';
import CostSub from '../components/project-center/CostSub';
import MembersSub from '../components/project-center/MembersSub';
import type { PjCtx } from '../components/project-center/ctx';

/* ==================================================================
 * 子页注册表：5 个业务域。key 同时是 hash 深链参数（view=?sub=? 见下）
 * ================================================================== */
const SUBS = [
  { key: 'overview', label: '概览', comp: OverviewSub },
  { key: 'track', label: '执行履约', comp: ExecSub },
  { key: 'quality', label: '质量验收', comp: QualitySub },
  { key: 'biz', label: '商务合同', comp: BizSub },
  { key: 'cost', label: '成本台账', comp: CostSub },
  { key: 'members', label: '团队资料', comp: MembersSub },
] as const;
type SubKey = typeof SUBS[number]['key'];
const SUB_KEYS = SUBS.map((s) => s.key) as readonly string[];

/** 历史深链 key → 新子页 key（DashboardPage 等处曾 setFocusTab('project-center','cost')） */
const LEGACY_SUB: Record<string, SubKey> = {
  exec: 'track', mile: 'track', progress: 'track',
  cost: 'cost', biz: 'biz', quality: 'quality', team: 'members',
};

/* ==================================================================
 * 静态业务数据集
 * 说明：以下为演示用种子（里程碑轴 / 预算科目 / 成本流水 / 收支明细 / 变更 / 保证金），
 *       金额与数量在页面内按项目规模等比缩放，保证 13 个项目都能打开且数字自洽。
 * ================================================================== */

/** 里程碑轴（全页唯一的轴）—— pct 为该节点对应的累计形象进度 */
const MILE_AXIS = [
  { name: 'M1 进场准备', date: '已完成 2026-09-20', st: 'done', pct: 5 },
  { name: 'M2 进场施工', date: '已完成 2026-09-22', st: 'done', pct: 15 },
  { name: 'M3 管线安装', date: '预计完成 2026-11-30', st: 'cur', pct: 40 },
  { name: 'M4 系统联调', date: '待开始', st: '', pct: 70 },
  { name: 'M5 竣工验收', date: '预计完成 2027-02-28', st: '', pct: 100 },
  { name: 'M6 质保期', date: '待开始', st: '', pct: 100 },
];

const PLAN_ROWS = [
  { type: '材料费', amt: 1320000, note: '镀锌钢管 / 报警设备 / 喷淋头' },
  { type: '分包费', amt: 560000, note: '安装劳务分包' },
  { type: '人工费', amt: 210000, note: '班组工资' },
  { type: '机械费', amt: 90000, note: '吊装 / 台班' },
  { type: '管理费', amt: 50000, note: '现场管理' },
  { type: '检测费', amt: 30000, note: '第三方检测' },
];
const PLAN_BASE = PLAN_ROWS.reduce((s, r) => s + r.amt, 0); // 2,260,000

const COST_ROWS: {
  id: string; src: 'CG' | 'CB' | 'PF'; type: string; amt: number; date: string;
  note: string; st?: string; mergedTo?: string;
}[] = [
  { id: 'CG000003', src: 'CG', type: '材料费', amt: 1320000, date: '2026-08-12', note: '消防设备采购合同' },
  { id: 'CG000005', src: 'CG', type: '分包费', amt: 560000, date: '2026-08-20', note: '安装劳务分包合同' },
  { id: 'CB000002', src: 'CB', type: '人工费', amt: 210000, date: '2026-09-02', note: '8 月班组工资' },
  { id: 'CB000003', src: 'CB', type: '管理费', amt: 62000, date: '2026-09-06', note: '现场管理杂费' },
  { id: 'PF000004', src: 'PF', type: '分包费', amt: 180000, date: '2026-09-05', note: '无合同付款 · 应急采购风机', mergedTo: 'CG000005' },
  { id: 'PF000082', src: 'PF', type: '材料费', amt: 80000, date: '2026-09-19', note: '无合同付款 · 应急辅材', st: 'approving' },
];
const COST_BASE = COST_ROWS.reduce((s, r) => s + r.amt, 0); // 2,412,000
const COST9 = ['材料费', '分包费', '人工费', '机械费', '管理费', '设计费', '检测费', '税费', '其他'];

const PAY_ROWS: {
  id: string; kind: string; contract: string; amt: number; use: string; st: string;
  date: string; hc?: string; mergedTo?: string;
}[] = [
  /* 回款口径：仅银行已到账（paid）计入回款；已开票未到账（invoiced）挂应收账龄，不计回款 */
  { id: 'SK000001', kind: '收入', contract: 'HT000009', amt: 540000, use: '收款期次 1 · 预付款（30%）· 银行已到账', st: 'paid', date: '2026-09-12' },
  { id: 'SK000002', kind: '收入', contract: 'HT000009', amt: 337500, use: '收款期次 2 · 进度款（已开票未到账 · 账龄 75 天）', st: 'invoiced', date: '2026-07-20' },
  { id: 'PF000002', kind: '采购付款', contract: 'CG000003', amt: 573000, use: '设备预付款', st: 'paid', date: '2026-08-05' },
  { id: 'PF000004', kind: '无合同付款', contract: '—（项目级）', amt: 180000, use: '应急采购风机', st: 'paid', date: '2026-09-05', mergedTo: 'CG000005' },
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

const CHANGES = [
  { id: 'BG0001', title: '材料调差价格调整补充协议（HT000009S1）', amt: 150000, st: '已生效', by: '蓝峰', date: '2026-09-18', contract: 'HT000009', cat: '材料调差' },
  { id: 'BG000009', title: '机房气体灭火系统增补', amt: 80000, st: '商务审批中', by: '蓝峰', date: '2026-09-12', contract: 'HT000009', cat: '材料费' },
];
const CHG_PENDING = CHANGES.filter((c) => c.st === '商务审批中').reduce((s, c) => s + c.amt, 0);
const CHG_EFFECTIVE = CHANGES.filter((c) => c.st === '已生效').reduce((s, c) => s + c.amt, 0);
const CASH_IN = SUM_IN;
const CASH_OUT = SUM_OUT;
const NET_IN = CASH_IN - CASH_OUT;

const APPROVALS = [
  { id: 'BG000009', type: '变更', desc: `机房气体灭火系统增补 +${fmtAmt(80000)} · 商务审批` },
  { id: 'PF000009', type: '付款', desc: `辅材款 ${fmtAmt(80000)} · CG000003` },
  { id: 'PF000082', type: '付款', desc: `材料费 ${fmtAmt(80000)} · 无合同付款` },
];

/** 合同状态 → 合同树徽标色（与合同台账语义色一致） */
const CT_TONE = (s: string): 'blue' | 'orange' | 'green' =>
  s === '履约中' ? 'blue' : (s === '已签约' || s === '已续签') ? 'green' : 'orange';

/**
 * 收款期次状态（由「实收 / 应收 / 开票 / 计划日」派生，不占合同状态枚举）：
 * 已到账 / 部分到账 / 已开票·待到账 / 逾期未收 / 未到期。
 */
const instSt = (i: Installment): string =>
  i.got >= i.amt ? '已到账'
    : i.got > 0 ? '部分到账'
      : i.inv === '已开票' ? '已开票·待到账'
        : (i.plan && i.plan < TODAY) ? '逾期未收' : '未到期';

/** 我方缴纳、尚未退回的保证金台账（质保金是客户扣留的应收义务，单独派生不混算） */
const DEPOSITS = [
  { id: 'BZ000003', type: '履约保证金', dir: 'in', party: '云南××消防设备有限公司（CG000003）', amt: 12000, pay: '2026-09-01', due: '2026-09-15', st: '未退' },
  { id: 'BZ000002', type: '履约保证金', dir: 'in', party: '昆明万达广场商业管理有限公司', amt: 20000, pay: '2026-06-01', due: '2027-06-30', st: '未退' },
  { id: 'BZ000001', type: '投标保证金', dir: 'in', party: '昆明万达广场商业管理有限公司', amt: 5000, pay: '2026-05-20', due: '2026-06-10', st: '已退还' },
];

/** 档案（按里程碑归组）：reached 决定必传项缺失时的红点颜色（未到=灰 / 已到仍缺=红 / 已传=绿） */
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

/** 里程碑节点表（对齐《产品设计文档》§9.2 执行域） */
const MILE_ROWS = [
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

/** 现场投入：机械台班计划 + 材料设备领用 */
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

/** 操作记录（抽屉全文） */
const OPS = [
  { t: '2026-09-19 17:42', w: '系统', tag: '自动', d: `无合同付款 PF000082 提交审批（材料费 ${fmtAmt(80000)} · 暂计入成本流水）` },
  { t: '2026-09-19 18:00', w: '蓝峰', tag: '手动', d: 'PF000004 归并 → CG000005（原行保留并置灰）' },
  { t: '2026-09-16 10:18', w: '财务 · 王会计', tag: '手动', d: '红字冲销 PF000007 → HC000001' },
  { t: '2026-09-15 15:03', w: '财务 · 王会计', tag: '手动', d: '红字冲销 PF000006 → HC000047' },
  { t: '2026-09-12 11:05', w: '蓝峰', tag: '手动', d: `合同侧发起变更 BG000009（+${fmtAmt(80000)}）· 商务审批中` },
];

/** 出处与去向链（项目全景抽屉用）：每个数字都能指回它的来源单据 */
function Panorama({ C, open, onClose }: { C: PjCtx; open: boolean; onClose: () => void }) {
  const { P } = C;
  /* 溯源链按外键精确取数（relOfProject），不再按 customerId 模糊匹配取首个单据 */
  const tr = useMemo(() => {
    const r = relOfProject(P.id);
    const oppId = r.quotes.map((q) => q.opp).find(Boolean) || '';
    return {
      opp: oppId ? getOpps().find((o) => o.id === oppId) : undefined,
      quote: r.quotes[0], contract: r.contracts[0], bid: r.bids[0],
    };
  }, [P.id]);

  return (
    <Drawer
      open={open} width={640} onClose={onClose}
      title="项目全景"
      sub={`${P.id} ${P.name} · 出处与去向`}
      foot={<><span className="nc-cell-sub" style={{ marginRight: 'auto' }}>跨模块只读视图，编辑请到对应业务域</span><Btn onClick={onClose}>关闭</Btn></>}
    >
      <div className="nc-ledhd">出处（这个项目从哪来）</div>
      <div className="nc-gate">
        {[
          { k: '客户', v: P.customer, go: () => C.go('customer') },
          { k: '商机', v: tr.opp ? `${tr.opp.id} · ${tr.opp.stage} · ${tr.opp.status}` : '—', go: () => C.go('opp') },
          { k: '报价', v: tr.quote ? `${tr.quote.id} · ${tr.quote.status}` : '—', go: () => C.go('quote') },
          { k: '投标', v: tr.bid ? `${tr.bid.id} · ${tr.bid.stage}` : '—', go: () => C.go('bid') },
          { k: '合同', v: tr.contract ? `${tr.contract.id} · ${tr.contract.status}` : '—', go: () => C.go('contract-detail') },
          { k: '立项审批', v: '已通过 · 2026-09-18 · 蓝峰', go: null },
        ].map((r) => (
          <div key={r.k} className="nc-gate-row">
            <span className="nc-gate-n">{r.k} <div className="nc-cell-sub">{r.v}</div></span>
            <span className="nc-gate-s">{r.go ? <Btn size="sm" onClick={r.go}>穿透</Btn> : <Tag tone="green">已完成</Tag>}</span>
          </div>
        ))}
      </div>

      <div className="nc-ledhd" style={{ marginTop: 18 }}>去向（钱与货流到哪去）</div>
      <div className="nc-gate">
        {[
          { k: '合同树', v: `${C.saleCt.length} 收款类 / ${C.buyCt.length} 付款类`, sub: `合同额 ${fmtAmt(C.CONTRACT_NOW)} · 执行额 ${fmtAmt(C.EXEC_AMT)}` },
          { k: '成本流水', v: `${C.costRows.length} 笔 · ${C.COST_SUM.toLocaleString()} 元`, sub: `目标成本 ${C.PLAN_SUM.toLocaleString()} 元 · ${C.dev > 0 ? '超支' : '结余'} ${Math.abs(C.dev).toLocaleString()}` },
          { k: '收支明细', v: `收入 ${C.SUM_IN.toLocaleString()} / 支出 ${C.SUM_OUT.toLocaleString()}`, sub: `净现金流 ${C.NET_IN.toLocaleString()} 元` },
          { k: '未回款', v: `${C.UNRECV.toLocaleString()} 元`, sub: `已回款率 ${C.PAY_PROGRESS.toFixed(1)}% · 应收账龄 ${C.overdueAmt.toLocaleString()} 元` },
          { k: '质保金', v: `${C.WARRANTY.toLocaleString()} 元`, sub: '结算时客户扣留 · 合同额 × 3%' },
          { k: '档案', v: `${C.attCnt} 份已归档`, sub: C.curMiss.length > 0 ? `当前节点仍缺 ${C.curMiss.length} 项` : '当前节点资料齐备' },
        ].map((r) => (
          <div key={r.k} className="nc-gate-row">
            <span className="nc-gate-n">{r.k} <div className="nc-cell-sub">{r.sub}</div></span>
            <span className="is-num num">{r.v}</span>
            <span className="nc-gate-s" />
          </div>
        ))}
      </div>

      <div className="nc-ledhd" style={{ marginTop: 18 }}>参与方</div>
      <KvGrid cols={2} rows={[
        { k: '销售负责人', v: P.owner },
        { k: '项目经理', v: P.pm },
        { k: '客户对接人', v: (P as { clientContact?: string }).clientContact ?? '刘经理 138****6601' },
        { k: '监理单位', v: '云南××工程监理有限公司 · 何监理' },
      ]} />

      <div className="nc-ledhd" style={{ marginTop: 18 }}>操作记录</div>
      <Timeline items={OPS.map((o) => ({ date: o.t.slice(0, 10), tone: o.tag === '自动' ? 'gray' as const : 'ok' as const, text: <><Tag tone={o.tag === '自动' ? 'gray' : 'blue'}>{o.tag}</Tag> <b>{o.w}</b> · {o.d}</> }))} />
    </Drawer>
  );
}

/* ==================================================================
 * 页面主体
 * ================================================================== */
export default function ProjectCenterPage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  const [projects, setProjects] = useState(getProjects);
  /* 每次 store 变更都递增 tick：合同 / 报价 / 投标切片变化时也要重渲染，
     否则本项目合同树读到的是旧快照（getProjects() 引用不变时 React 会跳过重渲染）。 */
  const [tick, setTick] = useState(0);
  useEffect(() => subscribeStore(() => { setProjects(getProjects()); setTick((n) => n + 1); }), []);
  const P = useMemo(() => {
    const id = getFocus('project-center');
    return projects.find((p) => p.id === id) || projects[0];
  }, [nav, projects]);

  /* ---------- 二级子页与 hash 深链同步：hash 形如 #page=project-center&sub=cost ---------- */
  const [sub, setSubState] = useState<SubKey>(() => {
    if (typeof window === 'undefined') return 'overview';
    const t = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('sub') || '';
    return (SUB_KEYS.includes(t) ? t : LEGACY_SUB[t] ?? 'overview') as SubKey;
  });
  const setSub = (k: string) => {
    const key = (SUB_KEYS.includes(k) ? k : 'overview') as SubKey;
    setSubState(key);
    if (typeof window === 'undefined') return;
    const raw = window.location.hash.replace(/^#/, '');
    const base = raw.split('&')[0] || 'page=project-center';
    window.history.replaceState(null, '', `#${base}&sub=${key}`);
  };
  /** 跨页深链：调用方先 setFocusTab('project-center', 'cost') 再跳转，本页消费一次即清除 */
  useEffect(() => {
    const t = consumeFocusTab('project-center');
    if (t) setSub(LEGACY_SUB[t] ?? (SUB_KEYS.includes(t) ? t : 'overview'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav]);

  const [costSub, setCostSub] = useState('ledger');   // 成本子页 · 子视图（保留原有深链能力）
  const [paySub, setPaySub] = useState('flow');
  const [payFilter, setPayFilter] = useState('全部');
  const [drill, setDrill] = useState<string | null>(null);
  const [m, setM] = useState<string | null>(null);
  /** 关联合同弹窗选中项（挂接后双向落库：合同记 project，项目回写合同额并解除无合同标记） */
  const [linkCt, setLinkCt] = useState('');
  const [logOpen, setLogOpen] = useState(false);
  const [panoOpen, setPanoOpen] = useState(false);
  const [flushId, setFlushId] = useState('');
  const [depRelId, setDepRelId] = useState<string | null>(null);
  const [delFile, setDelFile] = useState<AttFile | null>(null);
  const [rejA, setRejA] = useState<(typeof APPROVALS)[number] | null>(null);
  const [progEdit, setProgEdit] = useState<number>(P.progressActual ?? 0);

  /* ---------- 经营口径（唯一事实源 · 由子页共享，不在子页重算） ---------- */
  const REV = P.contractAmt;
  const CONTRACT_NOW = REV;
  const EXEC_AMT = P.execAmt;
  const BAD_DEBT = 0;
  const UNRECV = EXEC_AMT - CASH_IN - BAD_DEBT;
  const PAY_PROGRESS = EXEC_AMT > 0 ? (CASH_IN / EXEC_AMT) * 100 : 0;
  const WARRANTY = Math.round(CONTRACT_NOW * 0.03);

  /**
   * 目标成本（立项预算）＝ 立项时录入的 `budget`，仅作「目标 vs 实际」的对比基线。
   * 未录入（历史存量 / 作废单）时按「执行额 × 目标成本率」估算，并置 BUDGET_EST 让子页标注来源，
   * 避免所有项目都显示同一个写死的 130 万（假数据）。
   */
  const BUDGET_RATE = 0.72;
  const BUDGET_EST = !P.budget && P.execAmt > 0;
  const TARGET_COST = P.budget ?? (BUDGET_EST ? Math.round(P.execAmt * BUDGET_RATE) : 0);
  const planScale = PLAN_BASE > 0 ? TARGET_COST / PLAN_BASE : 0;
  /* 实际成本为 0 时不再回落到模板基数（否则作废 / 未开工项目会凭空显示 241 万成本） */
  const costScale = P.cost > 0 ? P.cost / COST_BASE : 0;
  const planRows = useMemo(() => PLAN_ROWS.map((r) => ({ ...r, amt: Math.round(r.amt * planScale) })), [planScale]);
  const costRows = useMemo(() => COST_ROWS.map((r) => ({ ...r, amt: Math.round(r.amt * costScale) })), [costScale]);
  const groupedPlan = useMemo(() => {
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
  const dev = COST_SUM - PLAN_SUM;
  const devPct = PLAN_SUM > 0 ? (dev / PLAN_SUM) * 100 : 0;
  const COST_PROGRESS = PLAN_SUM > 0 ? (COST_SUM / PLAN_SUM) * 100 : 0;
  const planProfit = CONTRACT_NOW > 0 ? ((CONTRACT_NOW - PLAN_SUM) / CONTRACT_NOW) * 100 : 0;
  const actProfit = CONTRACT_NOW > 0 ? ((CONTRACT_NOW - COST_SUM) / CONTRACT_NOW) * 100 : 0;

  const overdue = PAY_ROWS.filter((r) => r.st === 'invoiced');
  const overdueAmt = overdue.reduce((s, r) => s + r.amt, 0);

  const progActual = progEdit;
  const progPlan = P.progressPlan ?? 0;
  const progDev = Math.round((progActual - progPlan) * 10) / 10;
  const progLevel: 'red' | 'yellow' | 'ok' = progDev <= -20 ? 'red' : progDev <= -10 ? 'yellow' : 'ok';
  const progTag = progLevel === 'red' ? '红警' : progLevel === 'yellow' ? '黄警' : '正常';

  const depIn = DEPOSITS.filter((d) => d.dir === 'in' && d.st === '未退');
  const depInAmt = depIn.reduce((s, d) => s + d.amt, 0);
  const depositRows = [
    ...DEPOSITS,
    {
      id: `ZB-${P.id}`, type: '质保金（结算时客户扣留）', dir: 'out',
      party: `${P.customer}（${P.id}）`, amt: WARRANTY, pay: '—', due: '结算后 12 个月', st: '待扣留',
    },
  ];

  const curMile = MILE_AXIS.find((x) => x.st === 'cur');
  const curGroup = ATTACH.find((g) => g.mile.startsWith(curMile?.name.slice(0, 2) || '##'));
  const curReq = curGroup?.req || [];
  const curFiles = curGroup?.files || [];
  const curMiss = curReq.filter((r) => !curFiles.some((f) => f.name.includes(r.slice(0, 4))));

  const laborRows = useMemo(() => {
    const hit = ATT_WORKERS.filter((w) => w.proj === P.id);
    const list = hit.length ? hit : ATT_WORKERS.slice(0, 4);
    return list.map((w) => ({
      id: w.id, name: w.name, trade: w.trade, team: w.team,
      days: attDays(w, 21), rate: laborRate(w.trade), cost: attCost(w, 21),
    }));
  }, [P.id]);
  const laborSum = laborRows.reduce((a, b) => a + b.cost, 0);
  const machRows = useMemo(() => MACH_ROWS.map((r) => ({ ...r, amt: r.qty * r.price })), []);
  const machSum = machRows.reduce((a, r) => a + r.amt, 0);
  const matRows = useMemo(() => MAT_USE.map((u) => {
    const it = MATERIALS.find((x) => x.code === u.code) || EQUIPMENTS.find((x) => x.code === u.code);
    return {
      code: u.code, date: u.date, qty: u.qty,
      name: it?.name || '—', spec: it?.spec || '—', unit: it?.unit || '—',
      ty: it?.ty || '材料', price: it?.price || 0, stock: it?.stock ?? 0,
      amt: Math.round((it?.price || 0) * u.qty),
    };
  }), []);
  const matSum = matRows.reduce((a, r) => a + r.amt, 0);

  const teamRows = useMemo(() => teamOfProject(P.id, P.pm), [P.id, P.pm]);
  const certRows = useMemo(() => occOfProject(P.id), [P.id]);
  const certValidTo = (certId: string) => CERTS.find((c) => c.id === certId)?.validTo || '—';

  /* ---------- 项目合同树：全部由本项目真实合同派生 ----------
     修复前 saleCt 是硬编码常量 SALE_CT（昆明万达 4 份合同），任意项目点开「商务合同」
     都看到同一棵万达合同树 —— 项目 A 的页面显示项目 B 的合同。
     现在按 store 中 project === P.id 的合同分组：收款类 = 销售 / 维护保养；
     付款类 = 采购 / 分包；补充协议按 parentId 挂到主合同下。
     收款期次读合同自带的 Contract.installments（2026-09-23 补入模型），期次状态由「实收 / 应收 / 开票」派生。 */
  const projContracts = useMemo(
    () => getContracts().filter((c) => c.project === P.id),
    [P.id, tick],
  );
  const saleCt = useMemo(() => {
    const isBuy = (t: string) => t === '采购合同' || t === '分包合同';
    return projContracts
      .filter((c) => !isBuy(c.type) && !c.parentId)
      .map((c) => {
        const kids = projContracts.filter((k) => k.parentId === c.id);
        const delta = c.execAmt - c.amt;
        return {
          code: c.id, name: c.name, st: c.status, tone: CT_TONE(c.status), amt: c.amt,
          role: c.contractRole,
          badge: `合同额 ${fmtAmt(c.amt)} · 执行额 ${fmtAmt(c.execAmt)}${delta ? `（含已生效变更 ${delta > 0 ? '+' : ''}${fmtAmt(delta)}）` : ''}`,
          payplan: c.installments?.length
            ? c.installments.map((i) => ({ ...i, st: instSt(i), note: i.note ?? '' }))
            : undefined,
          children: kids.length
            ? kids.map((k) => ({
              code: k.id, name: k.name, amt: k.amt,
              note: k.contractRole === 'supplement_price'
                ? '价格调整补充协议（增量：合同额不动，只加执行额）'
                : '服务类补充协议（独立成行）',
            }))
            : undefined,
        };
      });
  }, [projContracts]);
  const buyCt = useMemo(() => projContracts
    .filter((c) => c.type === '采购合同' || c.type === '分包合同')
    .map((c) => ({
      code: c.id, name: c.name, st: c.status, tone: CT_TONE(c.status), amt: c.amt,
    })), [projContracts]);

  const payRows = payFilter === '全部' ? PAY_ROWS : PAY_ROWS.filter((r) => r.kind === payFilter);
  const bars = COST9.map((t) => {
    const act = costRows.filter((r) => r.type === t).reduce((s, r) => s + r.amt, 0);
    const pln = planRows.filter((r) => r.type === t).reduce((s, r) => s + r.amt, 0);
    return { t, act, pln, max: Math.max(act, pln) };
  });
  const barMax = Math.max(...bars.map((b) => b.max), 1);
  const flushRow = PAY_ROWS.find((r) => r.id === flushId);
  const dunCount = [overdue.length > 0, dev > 0, APPROVALS.length > 0, depIn.length > 0, curMiss.length > 0].filter(Boolean).length;

  /** 子页共享上下文：一次组装，避免每个子页各自取数导致口径漂移 */
  const C: PjCtx = {
    P, role, go, pj: setSub,
    openM: (k) => setM(k),
    /* 变更是要签补充协议的合同单据 —— 项目侧只读结果，发起统一回落到合同的「变更与签证」Tab */
    gotoContractChange: (cid) => {
      const id = cid || saleCt[0]?.code || '';
      if (!id) { toast('本项目尚未关联收款类合同，无法发起变更', 'err'); return; }
      setFocus('contract-detail', id);
      setFocusTab('contract-detail', 'change');
      go('contract-detail');
    },
    toast,
    openLog: () => setLogOpen(true),
    openPanorama: () => setPanoOpen(true),
    CONTRACT_NOW, EXEC_AMT, CASH_IN, NET_IN, UNRECV, PAY_PROGRESS, WARRANTY,
    TARGET_COST, COST_SUM, PLAN_SUM, dev, devPct, COST_PROGRESS, planProfit, actProfit,
    BUDGET_EST, BUDGET_SRC: P.budgetSrc,
    progActual, progPlan, progDev, progLevel, progTag,
    overdue, overdueAmt, CHG_EFFECTIVE, CHG_PENDING,
    depIn: depIn.map((d) => ({ id: d.id, type: d.type, amt: d.amt, due: d.due })),
    depInAmt,
    costRows, planRows, groupedPlan, bars, barMax,
    laborRows, laborSum, machRows, machSum, matRows, matSum,
    payRows, payFilter, setPayFilter, SUM_IN, SUM_OUT,
    depositRows, teamRows, certRows, certValidTo,
    saleCt, buyCt, attach: ATTACH, attCnt: ATT_CNT, mileRows: MILE_ROWS,
    curMile, curReq, curFiles, curMiss, dunCount,
  };

  /* 溯源链：按外键精确取数（relOfProject），不再按 customerId 模糊匹配取首个单据 ——
     修复前同客户有多个项目时会取到别的项目的报价 / 投标，溯源链指错上游。 */
  const trace = useMemo(() => {
    const r = relOfProject(P.id);
    const oppId = r.quotes.map((q) => q.opp).find(Boolean) || '';
    return {
      opp: oppId ? getOpps().find((o) => o.id === oppId) : undefined,
      quote: r.quotes[0], contract: r.contracts[0], bid: r.bids[0],
    };
  }, [P.id, tick]);

  const CurComp = (SUBS.find((s) => s.key === sub) ?? SUBS[0]).comp;
  const closeM = () => setM(null);

  return (
    <div className="nc-detail-page" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <PageHead
        crumbs={['项目管理', '项目列表', '项目详情', (SUBS.find((s) => s.key === sub) ?? SUBS[0]).label]}
        title={<span className="nc-pjtitle"><Code>{P.id}</Code> {P.name} <Op onClick={() => toast('已复制项目编号 ' + P.id)}>⧉ 复制</Op></span>}
        badges={<>
          <Tag tone="blue">{P.type}</Tag>
          {isServiceProject(P) && <Tag tone="purple">含维保服务</Tag>}
          <Tag tone={(PROJECT_STATUS_TONE[P.status] || 'blue') as 'blue'}>{P.status} · {P.milestoneName}</Tag>
        </>}
        sub={<span className="nc-pjtrace">溯源链：
          {trace.opp ? <><EntityLink target="opp" id={trace.opp.id} go={go} title="下钻到商机详情">商机 {trace.opp.id}</EntityLink> → </> : <span className="nc-muted">无关联商机 → </span>}
          {trace.quote ? <><EntityLink target="quote-detail" id={trace.quote.id} go={go} title="下钻到报价详情">报价 {trace.quote.id}</EntityLink> → </> : <span className="nc-muted">无关联报价 → </span>}
          {trace.bid ? <><EntityLink target="bid" id={trace.bid.id} go={go} title="下钻到投标详情">投标 {trace.bid.id}</EntityLink> → </> : <span className="nc-muted">无关联投标 → </span>}
          {trace.contract ? <><EntityLink target="contract-detail" id={trace.contract.id} go={go} title="下钻到合同详情">合同 {trace.contract.id}</EntityLink> → </> : <span className="nc-muted">无关联合同 → </span>}
          本项目
        </span>}
        actions={<>
          {/* 变更属合同单据（须签补充协议），不在项目侧发起 —— 入口见「商务合同」子页 → 对应合同 */}
          <Btn
            kind="primary" disabled={!curMile || curMiss.length > 0} onClick={() => setM('mile')}
            title={!curMile ? '当前无待确认节点' : curMiss.length > 0 ? `缺 ${curMiss.join('、')}，补齐后方可确认` : `确认 ${curMile.name}`}
          >确认里程碑</Btn>
          <OpMore items={[
            ...(P.status === '待启动' ? [{
              label: '进入执行（进场 / 合同就绪）',
              title: '状态流转：待启动 → 执行中',
              onClick: () => { moveProject(P.id, '执行中'); toast(`${P.id} 已进入执行中`); },
            }] : []),
            ...(P.status === '执行中' ? [{ label: '暂停项目（必填原因）', title: '状态流转：执行中 → 暂停，须填写暂停原因并留痕', onClick: () => setM('pause') }] : []),
            ...(P.status === '暂停' ? [{ label: '恢复执行（必填原因）', title: '状态流转：暂停 → 执行中，须填写恢复原因并留痕', onClick: () => setM('resume') }] : []),
            ...(P.status === '验收结算中' ? [
              { label: '登记第三方消防检测', onClick: () => setM('check') },
              { label: '登记消防验收备案', onClick: () => setM('accept') },
              { label: '确认结算额', onClick: () => setM('settle') },
            ] : []),
            ...(P.status === '已结项' ? [{ label: '转维保服务中', title: '含维保服务时，结项后可转入长期维保服务', onClick: () => { moveProject(P.id, '维保服务中'); toast(`${P.id} 已转维保服务中`); } }] : []),
            ...(P.status === '维保服务中' ? [{ label: '终止服务', danger: true, title: '服务终止：维保服务中 → 已关闭（可重开）', onClick: () => setM('close') }] : []),
            ...(P.status === '已关闭' ? [{ label: '重开项目', title: '状态流转：已关闭 → 执行中', onClick: () => { moveProject(P.id, '执行中'); toast(`${P.id} 已重开`); } }] : []),
            ...(!(PROJECT_TERMINAL as readonly string[]).includes(P.status) ? [{ label: '作废项目', danger: true, title: '作废 = 建错，留痕不可恢复', onClick: () => setM('void') }] : []),
            { label: '关联新合同', onClick: () => setM('link') },
            { label: '登记收款', onClick: () => setM('pay') },
            { label: '登记成本', onClick: () => setM('cost') },
            { label: '上传档案', onClick: () => setM('upload') },
          ]} />
          <Btn onClick={() => setPanoOpen(true)}><Ico n="search" size={16} /> 项目全景</Btn>
        </>}
      />

      {/* ---- 二级导航：6 个子页（概览 + 5 业务域），附着在内容区顶部不随滚动 ---- */}
      <div className="nc-pjnav">
        <span className="nc-pjnav-lb">项目视图</span>
        <Tabs
          value={sub}
          onChange={setSub}
          items={[
            { key: 'overview', label: '概览' },
            { key: 'track', label: '执行履约', cnt: MILE_ROWS.length },
            { key: 'quality', label: curMiss.length > 0 ? `质量验收 ⚠` : '质量验收', cnt: 3 + 2 + 5 },
            { key: 'biz', label: '商务合同', cnt: saleCt.length + buyCt.length + PAY_ROWS.length },
            { key: 'cost', label: dev > 0 ? '成本台账 ⚠' : '成本台账', cnt: costRows.length },
            { key: 'members', label: '团队资料', cnt: teamRows.length + certRows.length + ATT_CNT },
          ]}
        />
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="nc-cell-sub">更新于 {TODAY} 10:24</span>
          <Btn size="sm" onClick={() => setLogOpen(true)}>操作记录</Btn>
        </span>
      </div>

      {/* ---- 内容区：吃满剩余高度后内部滚动（页头与导航条常驻） ---- */}
      <div className="nc-pjbody">
        {P.status === '作废' && (
          <Banner tone="danger">
            本项目已作废（建错留痕，不可恢复）—— 仅在必要时重开，作废原因见操作记录。
          </Banner>
        )}
        {P.status === '暂停' && (
          <Banner tone="warn" actions={<Btn size="sm" onClick={() => setM('resume')}>恢复执行</Btn>}>
            项目已暂停{(P as { pauseReason?: string }).pauseReason ? `：${(P as { pauseReason?: string }).pauseReason}` : ''}
            {(P as { pausedAt?: string }).pausedAt ? `（暂停于 ${(P as { pausedAt?: string }).pausedAt}）` : ''}
          </Banner>
        )}
        {C.overdue.length > 0 && sub !== 'biz' && (
          <Banner tone="warn" actions={<Btn size="sm" onClick={() => { setSub('biz'); }}>去处理</Btn>}>
            有 {C.overdue.length} 笔已开票未到账（{C.overdueAmt.toLocaleString()} 元 · 账龄 75 天）—— 计入应收账龄，不计回款。
          </Banner>
        )}
        <CurComp C={C} />
      </div>

      {/* ================= 弹窗（编辑 / 登记类短表单） ================= */}
      {/* 变更弹窗不在此处 —— 变更属合同单据，入口在合同详情「变更与签证」Tab */}

      <Modal
        open={m === 'mile'} width={480} title={`确认里程碑节点${curMile ? `：${curMile.name}` : ''}`}
        onClose={closeM}
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" disabled={curMiss.length > 0} onClick={() => { toast(`${curMile?.name} 已确认，进度自动更新`); setProgEdit(curMile?.pct ?? progEdit); closeM(); }}>确认</Btn></>}
      >
        <div className="nc-gate">
          {curReq.length === 0 && <div className="nc-empty-mini">该节点无必传资料要求</div>}
          {curReq.map((r) => {
            const ok = !curMiss.includes(r);
            return (
              <div key={r} className="nc-gate-row">
                <span className="nc-gate-n">{ok ? '✓' : '✗'} {r}</span>
                <span className="nc-gate-s">{ok ? <Tag tone="green">已归档</Tag> : <Tag tone="red">缺失</Tag>}</span>
              </div>
            );
          })}
        </div>
        {curMiss.length > 0
          ? <div className="nc-gate-block"><Ico n="warning" size={14} />缺 {curMiss.join('、')} —— 缺件硬拦截，确认按钮不可提交。</div>
          : <div className="nc-cell-sub" style={{ marginTop: 8 }}>资料齐备，确认后节点状态更新并同步形象进度 {curMile?.pct}%。</div>}
      </Modal>

      <Modal open={m === 'pause'} width={480} title="暂停项目" onClose={closeM}
        foot={<><Btn onClick={closeM}>取消</Btn><Btn danger onClick={() => { moveProject(P.id, '暂停'); toast(`${P.id} 已暂停`); closeM(); }}>确认暂停</Btn></>}>
        <label className="nc-field nc-field-4"><span>暂停原因（必填）</span>
          <textarea className="nc-input" rows={3} placeholder="如：甲方装修标段交叉作业，作业面未移交" />
        </label>
      </Modal>

      <Modal open={m === 'resume'} width={480} title="恢复执行" onClose={closeM}
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { moveProject(P.id, '执行中'); toast(`${P.id} 已恢复执行中`); closeM(); }}>确认恢复</Btn></>}>
        <label className="nc-field nc-field-4"><span>恢复原因（必填）</span>
          <textarea className="nc-input" rows={3} placeholder="如：作业面已移交，具备进场条件" />
        </label>
      </Modal>

      <Modal open={m === 'close'} width={480} title="终止维保服务" onClose={closeM}
        foot={<><Btn onClick={closeM}>取消</Btn><Btn danger onClick={() => { moveProject(P.id, '已关闭'); toast('服务已终止，项目进入已关闭（可重开）'); closeM(); }}>确认终止</Btn></>}>
        <div className="nc-cell-sub">终止后服务状态为「已关闭」，可在需要时重开；已发生的巡检与工单记录保留。</div>
      </Modal>

      <Modal open={m === 'void'} width={480} title="作废项目" onClose={closeM}
        foot={<><Btn onClick={closeM}>取消</Btn><Btn danger onClick={() => { moveProject(P.id, '作废'); toast(`${P.id} 已作废（留痕不可恢复）`); closeM(); }}>确认作废</Btn></>}>
        <div className="nc-cell-sub">作废用于「建错项目」，终态不可恢复，仅保留痕迹。若只是中止施工请使用「暂停」。</div>
      </Modal>

      <Modal open={m === 'link'} width={520} title="关联合同" onClose={closeM}
        foot={<><Btn onClick={closeM}>取消</Btn>
          <Btn kind="primary" disabled={!linkCt} title={linkCt ? undefined : '请选择要挂接的合同'} onClick={() => {
            const ct = getContracts().find((c) => c.id === linkCt);
            if (!ct) { toast('合同不存在，请重新选择', 'err'); return; }
            const cs = normContractStatus(ct.status);
            if (isContractClosed(ct) || !['已签约', '履约中'].includes(cs)) {
              toast(`合同 ${ct.id} 当前状态为「${cs}」，仅「已签约 / 履约中」的合同可挂接`, 'err');
              return;
            }
            if (ct.project && ct.project !== P.id) {
              toast(`合同 ${ct.id} 已挂接项目 ${ct.project}，不可重复挂接`, 'err');
              return;
            }
            /* 双向落库：合同侧记 project（合同详情「关联项目」可反查），
               项目侧回写合同额并按真实合同额刷新执行额、解除「无合同施工」标记。
               修复前此处只 toast，关联动作完全不落库 —— 项目永远停在「无合同」状态，
               风险榜也不会出榜。 */
            patchContract(ct.id, { project: P.id });
            patchProject(P.id, {
              contractId: ct.id,
              contractAmt: ct.amt,
              execAmt: ct.amt,
              noContract: false,
              backfillBy: undefined,
              risk: P.risk === 'nocontract' ? 'none' : P.risk,
            });
            toast(`已挂接合同 ${ct.id} · 合同额回写 ${fmtWan(ct.amt)} · 「无合同施工」标记已解除`);
            setLinkCt(''); closeM();
          }}>确认关联</Btn></>}>
        <div className="nc-cell-sub">挂接后合同侧同步记录项目编号；项目侧按合同额回写合同额与执行额，「无合同施工」风险标记自动解除。仅列同客户、未挂其它项目、且已签约 / 履约中的合同。</div>
        <label className="nc-field nc-field-4"><span>合同编号</span>
          <select className="nc-input" value={linkCt} onChange={(e) => setLinkCt(e.target.value)}>
            <option value="">请选择合同</option>
            {getContracts()
              .filter((c) => (!c.project || c.project === P.id) && !isContractClosed(c)
                && ['已签约', '履约中'].includes(normContractStatus(c.status)))
              .map((c) => <option key={c.id} value={c.id}>{c.id} · {c.name} · {fmtWan(c.amt)}</option>)}
          </select>
        </label>
        <label className="nc-field nc-field-4"><span>关联方向</span>
          <select className="nc-input"><option>收款类（销售 / 维保合同）</option><option>付款类（采购 / 分包合同）</option></select>
        </label>
      </Modal>

      <Modal open={m === 'pay'} width={480} title="登记收款" onClose={closeM}
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('收款已登记，回款率与现金流同步更新'); closeM(); }}>确认登记</Btn></>}>
        <label className="nc-field nc-field-4"><span>收款金额（元）</span><input className="nc-input" placeholder={`执行额 ${EXEC_AMT.toLocaleString()}`} /></label>
        <label className="nc-field nc-field-4"><span>到账日期</span><input className="nc-input" type="date" defaultValue={TODAY} /></label>
        <div className="nc-field nc-field-4"><div className="nc-cell-sub">仅银行已到账才计入回款；已开票未到账请走开票登记，挂应收账龄。</div></div>
      </Modal>

      <Modal open={m === 'cost'} width={480} title="登记成本" onClose={closeM}
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('成本已登记并计入目标成本对应科目'); closeM(); }}>确认登记</Btn></>}>
        <label className="nc-field nc-field-4"><span>成本类别</span>
          <select className="nc-input">{COST9.map((t) => <option key={t}>{t}</option>)}</select>
        </label>
        <label className="nc-field nc-field-4"><span>发生金额（元）</span><input className="nc-input" /></label>
        <div className="nc-field nc-field-4"><div className="nc-cell-sub">成本更正不可物理删除，冲销走红字单按净额追加。</div></div>
      </Modal>

      <Modal open={m === 'dunning'} width={480} title="发起催收" onClose={closeM}
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('催收函已生成并推送甲方对接人'); closeM(); }}>生成催收函</Btn></>}>
        {overdue.map((r) => (
          <div key={r.id} className="nc-gate-row">
            <span className="nc-gate-n">{r.id}<div className="nc-cell-sub">{(r as { note?: string }).note ?? r.use} · {r.date}</div></span>
            <span className="is-num num">{r.amt.toLocaleString()}</span>
            <span className="nc-gate-s"><Tag tone="orange">账龄 75 天</Tag></span>
          </div>
        ))}
      </Modal>

      <Modal open={m === 'check'} width={480} title="登记第三方消防检测" onClose={closeM}
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('检测结果已登记，报告归档至文档 · 验收'); closeM(); }}>确认登记</Btn></>}>
        <label className="nc-field nc-field-4"><span>检测机构</span><input className="nc-input" defaultValue="云南××消防检测有限公司" /></label>
        <label className="nc-field nc-field-4"><span>检测日期</span><input className="nc-input" type="date" /></label>
        <label className="nc-field nc-field-4"><span>检测结论</span><select className="nc-input"><option>合格</option><option>不合格</option></select></label>
      </Modal>

      <Modal open={m === 'accept'} width={480} title="登记消防验收备案" onClose={closeM}
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('验收结论已登记，项目状态推进到已结项'); closeM(); }}>确认登记</Btn></>}>
        <label className="nc-field nc-field-4"><span>受理机关</span><input className="nc-input" defaultValue="昆明市西山区消防救援大队" /></label>
        <label className="nc-field nc-field-4"><span>受理编号</span><input className="nc-input" placeholder="如 BA2026-0916" /></label>
      </Modal>

      <Modal open={m === 'settle'} width={480} title="确认结算额" onClose={closeM}
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('结算额已确认，质保金按合同额 3% 计入台账'); closeM(); }}>确认结算</Btn></>}>
        <label className="nc-field nc-field-4"><span>结算额（元）</span><input className="nc-input" defaultValue={String(EXEC_AMT)} /></label>
        <div className="nc-field nc-field-4"><div className="nc-cell-sub">质保金 = 合同额 × 3% = {WARRANTY.toLocaleString()} 元，结算时由客户扣留，单独计入保证金台账。</div></div>
      </Modal>

      <Modal open={m === 'upload'} width={480} title="上传档案" onClose={closeM}
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('档案已上传并归档到对应节点'); closeM(); }}>确认上传</Btn></>}>
        <label className="nc-field nc-field-4"><span>归属节点</span>
          <select className="nc-input">{ATTACH.map((g) => <option key={g.mile}>{g.mile}</option>)}</select>
        </label>
        <label className="nc-field nc-field-4"><span>资料类型</span>
          <select className="nc-input">{['隐蔽工程验收记录', '影像资料', '验收查验记录', '竣工资料', '签字件', '其他'].map((t) => <option key={t}>{t}</option>)}</select>
        </label>
        <div className="nc-field nc-field-4"><div className="nc-cell-sub">缺件项在节点确认时硬拦截：资料未齐不允许确认节点。</div></div>
      </Modal>

      <Modal open={m === 'team'} width={480} title="调整项目团队" onClose={closeM}
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('团队调整已保存并同步至考勤与证书占用'); closeM(); }}>保存</Btn></>}>
        <label className="nc-field nc-field-4"><span>成员姓名</span><input className="nc-input" placeholder="从员工库选择" /></label>
        <label className="nc-field nc-field-4"><span>岗位 / 角色</span>
          <select className="nc-input">{['项目经理', '施工员', '安全员', '质量员', '资料员', '电工', '焊工', '管工'].map((r) => <option key={r}>{r}</option>)}</select>
        </label>
      </Modal>

      <Modal open={m === 'progress'} width={480} title="更新施工进度" onClose={closeM}
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast(`进度已更新为 ${progEdit}%`); closeM(); }}>保存</Btn></>}>
        <label className="nc-field nc-field-4"><span>完成百分比（0-100）</span>
          <input className="nc-input" type="number" min={0} max={100} value={progEdit} onChange={(e) => setProgEdit(Math.min(100, Math.max(0, Number(e.target.value) || 0)))} />
        </label>
        <div className="nc-field nc-field-4">
          <div className="nc-cell-sub">计划应到 {progPlan}% · 当前偏差 {progDev >= 0 ? '+' : ''}{progDev}%（落后 ≥10% 黄警，≥20% 红警）。</div>
        </div>
      </Modal>

      <Modal open={m === 'log'} width={480} title="写施工日志" onClose={closeM}
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('施工日志已保存并关联打卡记录'); closeM(); }}>保存</Btn></>}>
        <label className="nc-field nc-field-4"><span>日期</span><input className="nc-input" type="date" defaultValue={TODAY} /></label>
        <label className="nc-field nc-field-4"><span>天气</span><input className="nc-input" placeholder="如：晴 18~26℃" /></label>
        <label className="nc-field nc-field-4"><span>施工内容</span><textarea className="nc-input" rows={3} /></label>
      </Modal>

      <Modal open={m === 'deposit'} width={480} title="保证金台账" onClose={closeM}
        foot={<><Btn onClick={closeM}>关闭</Btn></>}>
        <div className="nc-gate">
          {depositRows.map((d) => (
            <div key={d.id} className="nc-gate-row">
              <span className="nc-gate-n">{d.id}<div className="nc-cell-sub">{d.type} · {d.party}</div></span>
              <span className="is-num num">{d.amt.toLocaleString()}</span>
              <span className="nc-gate-s">
                {d.st === '未退' ? <Btn size="sm" onClick={() => setDepRelId(d.id)}>登记退还</Btn> : <Tag tone={d.st === '已退还' ? 'green' : 'gray'}>{d.st}</Tag>}
              </span>
            </div>
          ))}
        </div>
      </Modal>

      <Modal open={m === 'approve'} width={480} title="待我审批" onClose={closeM}
        foot={<><Btn onClick={closeM}>关闭</Btn></>}>
        <div className="nc-gate">
          {APPROVALS.map((a) => (
            <div key={a.id} className="nc-gate-row">
              <span className="nc-gate-n">{a.id} <Tag tone="blue">{a.type}</Tag><div className="nc-cell-sub">{a.desc}</div></span>
              <span className="nc-gate-s">
                <Btn size="sm" kind="primary" onClick={() => { toast(`${a.id} 已通过`); closeM(); }}>通过</Btn>
                <span style={{ marginLeft: 6 }}><Btn size="sm" onClick={() => setRejA(a)}>驳回</Btn></span>
              </span>
            </div>
          ))}
        </div>
      </Modal>

      <ConfirmModal
        open={!!rejA} title={`驳回 ${rejA?.id ?? ''}`} impact={rejA?.desc ?? ''}
        reason reasonLabel="驳回原因" okText="确认驳回"
        onOk={() => { toast(`${rejA?.id} 已驳回`); setRejA(null); closeM(); }} onClose={() => setRejA(null)}
      />

      <ConfirmModal
        open={!!flushId} title={`红字冲销 ${flushId}`}
        impact={`原单据保留并置灰，冲销按净额追加；${flushRow ? `${flushRow.amt.toLocaleString()} 元` : ''} 将不再计入现金。`}
        reason reasonLabel="冲销原因" okText="确认冲销"
        onOk={() => { toast(`${flushId} 已红字冲销`); setFlushId(''); closeM(); }} onClose={() => setFlushId('')}
      />

      <ConfirmModal
        open={!!delFile} title={`删除档案「${delFile?.name ?? ''}」`}
        impact="删除后该节点的必传项将重新变为缺失，节点确认会被硬拦截。"
        reason reasonLabel="删除原因" okText="确认删除"
        onOk={() => { toast(`「${delFile?.name}」已删除`); setDelFile(null); }} onClose={() => setDelFile(null)}
      />

      <ConfirmModal
        open={!!depRelId} title={`登记退还 ${depRelId}`}
        impact="退还后该笔保证金销项，不再出现在督办事项与风险标签中。"
        reason reasonLabel="退还说明" okText="确认退还"
        onOk={() => { toast(`${depRelId} 已登记退还`); setDepRelId(null); closeM(); }} onClose={() => setDepRelId(null)}
      />

      {/* ================= 抽屉（审阅型跨模块视图） ================= */}
      <Panorama C={C} open={panoOpen} onClose={() => setPanoOpen(false)} />

      <Drawer
        open={logOpen} width={640} onClose={() => setLogOpen(false)}
        title="操作记录" sub={`${P.id} ${P.name} · 状态流转与操作明细`}
        foot={<><span className="nc-cell-sub" style={{ marginRight: 'auto' }}>全量留痕，不可编辑</span><Btn onClick={() => setLogOpen(false)}>关闭</Btn></>}
      >
        <div className="nc-subtabs">
          <span className="nc-subtab is-on">状态流转</span>
          <span className="nc-subtab">操作明细</span>
        </div>
        <div className="nc-gate">
          {[
            { time: '2026-09-12', title: '创建项目（待启动）', tag: '手动', d: '来源：合同立项 · 合同交底已确认' },
            { time: '2026-09-18', title: '立项审批通过（待启动 → 执行中）', tag: '自动', d: '触发：终审通过 · 里程碑轴启用' },
            { time: '2026-09-20', title: 'M1 进场准备完成', tag: '手动', d: '操作人：张工 · 已上传开工报告' },
            { time: '2026-09-22', title: 'M2 进场施工完成', tag: '手动', d: '操作人：张工 · 关联打卡 12 人次' },
          ].map((h) => (
            <div key={h.time + h.title} className="nc-gate-row">
              <span className="nc-gate-n"><b>{h.title}</b><div className="nc-cell-sub">{h.d}</div></span>
              <span className="is-num num">{h.time}</span>
              <span className="nc-gate-s"><Tag tone={h.tag === '自动' ? 'gray' : 'blue'}>{h.tag}</Tag></span>
            </div>
          ))}
          <div className="nc-gate-row">
            <span className="nc-gate-n"><b>执行中 · 施工阶段（当前）</b><div className="nc-cell-sub">M3 管线安装进行中</div></span>
            <span className="is-num num">{TODAY}</span>
            <span className="nc-gate-s"><Tag tone="orange">进行中</Tag></span>
          </div>
        </div>
        <div className="nc-ledhd" style={{ marginTop: 18 }}>操作明细</div>
        <Timeline items={OPS.map((o) => ({
          date: o.t, tone: o.tag === '自动' ? 'gray' as const : 'ok' as const,
          text: <><b>{o.w}</b> <Tag tone={o.tag === '自动' ? 'gray' : 'blue'}>{o.tag}</Tag><div style={{ marginTop: 4 }}>{o.d}</div></>,
        }))} />
      </Drawer>
    </div>
  );
}
