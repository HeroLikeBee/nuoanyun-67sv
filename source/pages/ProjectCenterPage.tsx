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
  PROJECT_STATUS_TONE, PROJECT_TERMINAL, TODAY,
  fmt, fmtAmt, fmtPct, fmtWan, isContractClosed, isServiceProject, normContractStatus,
  teamOfProject, occOfProject, CERTS,
} from '../components/data';
import { consumeFocusTab, getContracts, getFocus, getOpps, getProjects, moveProject, patchContract, patchProject, relOfProject, setFocus, setFocusTab, subscribeStore } from '../components/store';
import OverviewSub from '../components/project-center/OverviewSub';
import ExecSub from '../components/project-center/ExecSub';
import QualitySub from '../components/project-center/QualitySub';
import BizSub from '../components/project-center/BizSub';
import FundSub from '../components/project-center/FundSub';
import CostSub from '../components/project-center/CostSub';
import MembersSub from '../components/project-center/MembersSub';
import { buildPjDemo, daysBetween, groupContracts, isLegalNode, mileTplOf, nodeKey } from '../components/project-center/seed';
import type { PjCtx } from '../components/project-center/ctx';

/* ==================================================================
 * 子页注册表：5 个业务域。key 同时是 hash 深链参数（view=?sub=? 见下）
 * ================================================================== */
const SUBS = [
  { key: 'overview', label: '概览', comp: OverviewSub },
  { key: 'track', label: '进度履约', comp: ExecSub },
  { key: 'quality', label: '质量安全', comp: QualitySub },
  { key: 'contract', label: '合同变更', comp: BizSub },
  { key: 'fund', label: '资金台账', comp: FundSub },
  { key: 'cost', label: '成本管控', comp: CostSub },
  { key: 'members', label: '团队与干系人', comp: MembersSub },
] as const;
type SubKey = typeof SUBS[number]['key'];
const SUB_KEYS = SUBS.map((s) => s.key) as readonly string[];

/** 历史深链 key → 新子页 key（DashboardPage 等处曾 setFocusTab('project-center','cost')） */
const LEGACY_SUB: Record<string, SubKey> = {
  exec: 'track', mile: 'track', progress: 'track',
  cost: 'cost', biz: 'contract', quality: 'quality', team: 'members',
};

/* ==================================================================
 * 目标成本科目模板（本项目页唯一保留的模块级数据）
 * 说明：科目的「占比」是与具体项目无关的行业经验值，故留在这里；金额按项目的
 *       目标成本等比缩放后落到具体项目。除此之外，项目详情的全部台账都由
 *       seed.ts 的 buildPjDemo(P, contracts) 按项目自身字段派生 ——
 *       不再有跨项目共用的演示数据（改造前 17 组常量会让任何项目都显示同一个项目的数据）。
 * ================================================================== */
/* 目标成本科目按业务线裁剪 —— 检测项目不存在「分包安装/主材」、维保项目以人工为主，
   统一套施工模板会得到一堆 0 值科目（权重和为 1，保证「目标成本 = Σ 各科目」成立）。 */
const BUDGET_TPL_BY_BIZ: Record<string, { g: string; rows: { type: string; w: number; note: string }[] }[]> = {
  GC: [
    {
      g: '直接费', rows: [
        { type: '材料费', w: 0.52, note: '主材 / 报警设备 / 喷淋头' },
        { type: '分包费', w: 0.22, note: '安装劳务分包' },
        { type: '人工费', w: 0.09, note: '班组工资' },
        { type: '机械费', w: 0.04, note: '吊装 / 台班' },
      ],
    },
    {
      g: '间接费', rows: [
        { type: '管理费', w: 0.05, note: '现场管理' },
        { type: '检测费', w: 0.04, note: '第三方检测' },
        { type: '税费', w: 0.04, note: '按适用税率计提' },
      ],
    },
  ],
  WB: [
    {
      g: '直接费', rows: [
        { type: '人工费', w: 0.46, note: '巡检 / 值班班组' },
        { type: '材料费', w: 0.22, note: '更换配件 / 耗材' },
        { type: '机械费', w: 0.04, note: '登高作业台班' },
      ],
    },
    {
      g: '间接费', rows: [
        { type: '管理费', w: 0.16, note: '服务站点管理' },
        { type: '检测费', w: 0.06, note: '季度联动检测外协' },
        { type: '税费', w: 0.06, note: '按适用税率计提' },
      ],
    },
  ],
  JC: [
    {
      g: '直接费', rows: [
        { type: '人工费', w: 0.58, note: '现场检测作业' },
        { type: '分包费', w: 0.06, note: '外协复检' },
        { type: '机械费', w: 0.06, note: '检测仪器折旧 / 台班' },
        { type: '材料费', w: 0.04, note: '检测耗材' },
      ],
    },
    {
      g: '间接费', rows: [
        { type: '管理费', w: 0.20, note: '报告编制与质控' },
        { type: '税费', w: 0.06, note: '按适用税率计提' },
      ],
    },
  ],
  RJ: [
    {
      g: '直接费', rows: [
        { type: '材料费', w: 0.42, note: '网关 / 传感器硬件' },
        { type: '分包费', w: 0.16, note: '现场实施外包' },
        { type: '人工费', w: 0.18, note: '部署与培训人工' },
      ],
    },
    {
      g: '间接费', rows: [
        { type: '管理费', w: 0.10, note: '项目管理' },
        { type: '设计费', w: 0.06, note: '方案与深化设计' },
        { type: '税费', w: 0.08, note: '按适用税率计提' },
      ],
    },
  ],
  QT: [
    {
      g: '直接费', rows: [
        { type: '材料费', w: 0.38, note: '抢修用料 / 管件' },
        { type: '人工费', w: 0.34, note: '抢修班组（含夜间）' },
        { type: '分包费', w: 0.10, note: '土建恢复外协' },
        { type: '机械费', w: 0.06, note: '抽水 / 试压台班' },
      ],
    },
    {
      g: '间接费', rows: [
        { type: '管理费', w: 0.06, note: '应急响应管理' },
        { type: '税费', w: 0.06, note: '按适用税率计提' },
      ],
    },
  ],
};

/** 成本类别全集（登记成本弹窗的类别下拉） */
const COST_TYPES = ['材料费', '分包费', '人工费', '机械费', '管理费', '设计费', '检测费', '税费', '其他'];

/** 档案文件（上传 / 删除弹窗用） */
type AttFile = { name: string; size: string; by: string; date: string };

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

  /* 抽屉里的构成信息只取笔数与最近单据，不重复金额 */
  const costMix = useMemo(() => {
    const m = new Map<string, number>();
    C.costRows.forEach((r) => m.set(r.type, (m.get(r.type) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([t, n]) => `${t} ${n} 笔`);
  }, [C.costRows]);
  const inCnt = C.payRowsAll.filter((r) => r.kind === '收入').length;
  const outCnt = C.payRowsAll.length - inCnt;
  const lastPay = [...C.payRowsAll].sort((a, b) => (a.date < b.date ? 1 : -1))[0];

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
          { k: '立项', v: `来源 ${P.source} · 立项日 ${P.start}${P.noContract ? ` · 无合同施工（补签期限 ${P.backfillBy ?? '—'}）` : ''}`, go: null },
        ].map((r) => (
          <div key={r.k} className="nc-gate-row">
            <span className="nc-gate-n">{r.k} <div className="nc-cell-sub">{r.v}</div></span>
            <span className="nc-gate-s">{r.go ? <Btn size="sm" onClick={r.go}>穿透</Btn> : <Tag tone="green">已完成</Tag>}</span>
          </div>
        ))}
      </div>

      {/* 「去向」只讲链路与单据构成：金额 / 比率各自归属业务域子页（回款率归资金域、成本偏差归成本域），
          抽屉不再复述一遍，避免同一个数字在全景与子页两处出现。 */}
      <div className="nc-ledhd" style={{ marginTop: 18 }}>去向（钱与货流到哪去）</div>
      <div className="nc-gate">
        {[
          { k: '合同树', v: `${C.saleCt.length} 收款类 / ${C.buyCt.length} 付款类`, sub: (C.saleCt[0]?.code ?? '—') + (C.saleCt.length > 1 ? ` 等 ${C.saleCt.length} 份` : '') },
          { k: '成本流水', v: `${C.costRows.length} 笔`, sub: costMix.length > 0 ? costMix.join(' / ') : '尚未发生成本' },
          { k: '收支明细', v: `收入 ${inCnt} 笔 / 支出 ${outCnt} 笔`, sub: lastPay ? `最近一笔 ${lastPay.date} · ${lastPay.id}` : '暂无收支' },
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
        { k: '客户对接人', v: (P as { clientContact?: string }).clientContact ?? '—' },
        { k: '监理单位', v: C.parties.find((g) => g.key === 'sup')?.rows.map((r) => `${r.org} · ${r.name}`).join('、') ?? '—' },
      ]} />

      <div className="nc-ledhd" style={{ marginTop: 18 }}>操作记录</div>
      <Timeline items={C.ops.map((o) => ({ date: o.t.slice(0, 10), tone: o.tag === '自动' ? 'gray' as const : 'ok' as const, text: <><Tag tone={o.tag === '自动' ? 'gray' : 'blue'}>{o.tag}</Tag> <b>{o.w}</b> · {o.d}</> }))} />
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

  const [payFilter, setPayFilter] = useState('全部');
  const [m, setM] = useState<string | null>(null);
  /** 关联合同弹窗选中项（挂接后双向落库：合同记 project，项目回写合同额并解除无合同标记） */
  const [linkCt, setLinkCt] = useState('');
  const [logOpen, setLogOpen] = useState(false);
  const [panoOpen, setPanoOpen] = useState(false);
  const [flushId, setFlushId] = useState('');
  const [depRelId, setDepRelId] = useState<string | null>(null);
  const [delFile, setDelFile] = useState<AttFile | null>(null);
  const [rejA, setRejA] = useState<{ id: string; desc: string } | null>(null);
  const [progEdit, setProgEdit] = useState<number>(P.progressActual ?? P.milestone);

  /* ---------- 项目合同树 + 全套台账：一次性由项目级工厂派生 ----------
     改造前这里有 17 组模块级常量（收支明细 / 成本流水 / 变更 / 保证金 / 施工日志 / 报验 /
     隐蔽验收 / 安全检查 / 整改轮次 / 相关方 / 机械 / 材料领用 / 操作记录 / 里程碑 / 准入资料 /
     工程量），点开任何项目看到的都是「昆明万达」的那一套 —— 项目 A 的页面显示项目 B 的钱。
     现在按 project === P.id 过滤合同后交给 buildPjDemo 派生，做到一个项目一套数。 */
  const projContracts = useMemo(
    () => getContracts().filter((c) => c.project === P.id),
    [P.id, tick],
  );
  const { saleCt, buyCt } = useMemo(() => groupContracts(projContracts), [projContracts]);
  const D = useMemo(() => buildPjDemo(P, projContracts), [P, projContracts, tick]);

  /* ---------- 经营口径（唯一事实源 · 由子页共享，不在子页重算） ---------- */
  const CONTRACT_NOW = P.contractAmt;
  const EXEC_AMT = P.execAmt;
  const BAD_DEBT = 0;
  /** 已回款 = 已到账收入合计（与「收款期次」同源，不再读跨项目的模块级常量） */
  const CASH_IN = D.cashIn;
  const UNRECV = Math.max(0, EXEC_AMT - CASH_IN - BAD_DEBT);
  const PAY_PROGRESS = EXEC_AMT > 0 ? (CASH_IN / EXEC_AMT) * 100 : 0;
  const NET_IN = CASH_IN - D.sumOut;
  const WARRANTY = Math.round(CONTRACT_NOW * 0.03);

  /**
   * 目标成本（立项预算）＝ 立项时录入的 `budget`，仅作「目标 vs 实际」的对比基线。
   * 未录入（历史存量 / 作废单）时按「执行额 × 目标成本率」估算，并置 BUDGET_EST 让子页标注来源，
   * 避免所有项目都显示同一个写死的 130 万（假数据）。
   */
  const BUDGET_RATE = 0.72;
  const BUDGET_EST = !P.budget && P.execAmt > 0;
  const TARGET_COST = P.budget ?? (BUDGET_EST ? Math.round(P.execAmt * BUDGET_RATE) : 0);
  /* 科目金额按目标成本等比缩放；「占比」是按业务线裁剪的行业经验值，故模板留在页面内 */
  const groupedPlan = useMemo(() => {
    const tpl = BUDGET_TPL_BY_BIZ[P.biz] ?? BUDGET_TPL_BY_BIZ.GC;
    return tpl.map((x) => {
    const rows = x.rows.map((r) => ({ type: r.type, amt: Math.round(TARGET_COST * r.w), note: r.note }));
      return { g: x.g, rows, sum: rows.reduce((a, r) => a + r.amt, 0) };
    }).filter((x) => x.rows.length > 0);
  }, [TARGET_COST, P.biz]);
  const PLAN_SUM = groupedPlan.reduce((s, g) => s + g.sum, 0);
  const COST_SUM = D.costRows.reduce((s, r) => s + r.amt, 0);
  const dev = COST_SUM - PLAN_SUM;
  const devPct = PLAN_SUM > 0 ? (dev / PLAN_SUM) * 100 : 0;
  const COST_PROGRESS = PLAN_SUM > 0 ? (COST_SUM / PLAN_SUM) * 100 : 0;
  const planProfit = CONTRACT_NOW > 0 ? ((CONTRACT_NOW - PLAN_SUM) / CONTRACT_NOW) * 100 : 0;
  const actProfit = CONTRACT_NOW > 0 ? ((CONTRACT_NOW - COST_SUM) / CONTRACT_NOW) * 100 : 0;

  /* ---------- 进度：实际取项目形象进度，计划由工厂按项目工期与计划曲线派生 ---------- */
  const progActual = progEdit;
  const progPlan = D.progPlan;
  const progDev = Math.round((progActual - progPlan) * 10) / 10;
  const progLevel: 'red' | 'yellow' | 'ok' = progDev <= -20 ? 'red' : progDev <= -10 ? 'yellow' : 'ok';
  const progTag = progLevel === 'red' ? '红警' : progLevel === 'yellow' ? '黄警' : progDev > 10 ? '超前' : '正常';

  const depIn = D.deposits.filter((d) => d.dir === 'in' && d.st === '未退');
  const depositRows = [
    ...D.deposits,
    {
      id: `ZB-${P.id}`, type: '质保金（结算时客户扣留）', dir: 'out',
      party: `${P.customer}（${P.id}）`, amt: WARRANTY, pay: '—', due: '结算后 12 个月', st: '待扣留',
    },
  ];

  const curMile = D.mileAxis.find((x) => x.st === 'cur');
  const curReq = D.curReq;
  const curFiles = D.curFiles;
  const curMiss = D.curMiss;

  /**
   * 节点确认 / 进度保存的统一落库：把形象进度写回项目（刷新 / 重进后节点仍「已完成」），
   * 并在关键法定 / 末节点联动项目状态。moveProject 内部校验状态机，非法流转自动不生效。
   * 返回需要追加到 toast 的状态联动说明。
   */
  const commitProgress = (newPct: number): string => {
    /* 节点状态 / 工程量由 P.milestone 派生（seed），progressActual 同步写避免两字段漂移 */
    patchProject(P.id, { milestone: newPct, progressActual: newPct });
    const nodeAt = mileTplOf(P.biz).find((n) => n.pct === newPct);
    const bare = (nodeAt?.name ?? '').replace(/^M\d+\s*/, '');
    /* GC 法定关口：消防验收备案完成 → 执行中转入验收结算 */
    if (P.biz === 'GC' && bare === '消防验收备案') {
      return moveProject(P.id, '验收结算中') ? '，消防验收已备案，项目转入验收结算' : '';
    }
    if (newPct >= 100) {
      if (P.biz === 'GC') {
        if (P.status === '执行中') moveProject(P.id, '验收结算中');
        return moveProject(P.id, '已结项') ? '，结算完成，项目已结项' : '';
      }
      if (P.biz === 'JC') {
        return moveProject(P.id, '验收结算中') ? '，检测报告已交付，进入结算' : '';
      }
      /* WB 维保：末节点为年度续签评估与结算，服务持续，不自动结项 */
    }
    return '';
  };

  const teamRows = useMemo(() => teamOfProject(P.id, P.pm), [P.id, P.pm]);
  const certRows = useMemo(() => occOfProject(P.id), [P.id]);
  const certValidTo = (certId: string) => CERTS.find((c) => c.id === certId)?.validTo || '—';

  const payRows = payFilter === '全部' ? D.payRows : D.payRows.filter((r) => r.kind === payFilter);
  /** 变更金额：已生效进执行额，审批中只作过程记录 */
  const CHG_EFFECTIVE = D.changes.filter((c) => c.st === '已生效').reduce((s, c) => s + c.amt, 0);
  const CHG_PENDING = D.changes.filter((c) => c.st !== '已生效').reduce((s, c) => s + c.amt, 0);
  const qualityTodo = D.arrivals.filter((a) => a.have.length < a.need.length).length
    + D.rectifyRounds.reduce((s, r) => s + r.items.filter((i) => !i.done).length, 0);

  /** 本项目待审批事项（变更 + 无合同付款）—— 项目侧只列与本项目相关的，全局审批在「审批中心」 */
  const pending = [
    ...D.changes.filter((c) => c.st !== '已生效').map((c) => ({
      id: c.id, type: '合同变更',
      desc: `${c.title} · 增量 ${c.amt.toLocaleString()} 元 · 归属合同 ${c.contract}`,
    })),
    ...D.payRows.filter((r) => r.st === 'approving').map((r) => ({
      id: r.id, type: '无合同付款', desc: `${r.use} · ${r.amt.toLocaleString()} 元 · 项目级挂账`,
    })),
  ];

  /** 状态流转：由 P.logs 派生（规格 §6.2 要求暂停/恢复/关闭/重开/作废全部留痕）。
   *  logs 里已有「— → 状态」的建档行时不再补建，避免同一事件出现两行。 */
  const flowRows = useMemo(() => {
    const rows: { time: string; title: string; tag: string; d: string }[] = [];
    const hasBirth = (P.logs ?? []).some((l) => l.from === '—');
    if (!hasBirth) {
      rows.push({
        time: P.start, title: '创建项目（待启动）', tag: '手动',
        d: `来源：${P.source} · 负责人：${P.owner}${P.pm ? ` · 项目经理：${P.pm}` : ''}`
          + (P.noContract ? ' · 无合同先施工，须按期限补签合同' : ''),
      });
    }
    (P.logs ?? []).forEach((l) => {
      rows.push({
        time: l.at,
        title: l.from === '—' ? `立项（→ ${l.to}）` : `${l.from} → ${l.to}`,
        tag: l.auto ? '自动' : '手动',
        d: `${l.by}${l.reason ? ` · ${l.reason}` : ''}`,
      });
    });
    return rows;
  }, [P]);

  /* 按业务类型动态裁剪不适用模块：消防工程全配；维保无大型机械 / 分包（有耗材）；检测为纯人力服务 */
  const feature = {
    machine: P.biz === 'GC',
    material: P.biz !== 'JC',
    subcontract: P.biz === 'GC',
  };

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
    feature,
    scene: D.scene,
    CONTRACT_NOW, EXEC_AMT, CASH_IN, NET_IN, UNRECV, PAY_PROGRESS, WARRANTY,
    COST_SUM, PLAN_SUM, dev, devPct, COST_PROGRESS, planProfit, actProfit,
    BUDGET_EST, BUDGET_SRC: P.budgetSrc,
    progActual, progPlan, progDev, progLevel, progTag,
    overdue: D.overdue, overdueAmt: D.overdueAmt, overdueDays: D.overdueDays,
    CHG_EFFECTIVE, CHG_PENDING,
    depIn: depIn.map((d) => ({ id: d.id, type: d.type, amt: d.amt, due: d.due })),
    costRows: D.costRows, groupedPlan,
    laborRows: D.laborRows, laborSum: D.laborSum,
    machRows: D.machRows, machSum: D.machSum,
    matRows: D.matRows, matSum: D.matSum,
    payRows, payRowsAll: D.payRows, payFilter, setPayFilter, SUM_IN: D.sumIn, SUM_OUT: D.sumOut,
    depositRows, teamRows, certRows, certValidTo,
    saleCt, buyCt, attach: D.attach, attCnt: D.attCnt, mileRows: D.mileRows, mileAxis: D.mileAxis,
    curMile, curReq, curFiles, curMiss, workItems: D.workItems,
    changes: D.changes, visas: D.visas,
    arrivals: D.arrivals, hidden: D.hidden, safeRows: D.safeRows,
    rectifyRounds: D.rectifyRounds, checkInfo: D.checkInfo, qualityTodo,
    siteLogs: D.siteLogs, parties: D.parties, ops: D.ops,
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
          <Btn onClick={() => setLogOpen(true)}><Ico n="history" size={16} /> 操作记录</Btn>
          <Btn onClick={() => setPanoOpen(true)}><Ico n="search" size={16} /> 项目全景</Btn>
        </>}
      />

      {/* ---- 二级导航：7 个子页（概览 + 6 业务域），附着在内容区顶部不随滚动 ---- */}
      <div className="nc-pjnav">
        <span className="nc-pjnav-lb">项目视图</span>
        <Tabs
          value={sub}
          onChange={setSub}
          items={[
            { key: 'overview', label: '概览' },
            { key: 'track', label: '进度履约', cnt: D.mileRows.length },
            { key: 'quality', label: qualityTodo > 0 ? '质量安全 ⚠' : '质量安全', cnt: D.arrivals.length + D.hidden.length + D.safeRows.length + D.rectifyRounds.reduce((s, r) => s + r.items.length, 0) },
            { key: 'contract', label: '合同变更', cnt: saleCt.length + buyCt.length },
            { key: 'fund', label: '资金台账', cnt: D.payRows.length },
            { key: 'cost', label: dev > 0 ? '成本管控 ⚠' : '成本管控', cnt: D.costRows.length },
            { key: 'members', label: '团队与干系人', cnt: teamRows.length + certRows.length },
          ]}
        />
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* 更新时间取项目自身的 updatedAt（改造前写死「TODAY 10:24」，永远是同一个时刻） */}
          <span className="nc-cell-sub">更新于 {P.updatedAt ?? P.start}</span>
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
        {C.overdue.length > 0 && sub !== 'fund' && (
          <Banner tone="warn" actions={<Btn size="sm" onClick={() => { setSub('fund'); }}>去处理</Btn>}>
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
                foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" disabled={curMiss.length > 0} onClick={() => {
          const np = curMile?.pct ?? progEdit;
          const note = commitProgress(np);
          setProgEdit(np);
          toast(`${curMile?.name} 已确认，进度更新为 ${np}%${note}`);
          closeM();
        }}>确认</Btn></>}
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
          <select className="nc-input">{COST_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        </label>
        <label className="nc-field nc-field-4"><span>发生金额（元）</span><input className="nc-input" /></label>
        <div className="nc-field nc-field-4"><div className="nc-cell-sub">成本更正不可物理删除，冲销走红字单按净额追加。</div></div>
      </Modal>

      <Modal open={m === 'dunning'} width={480} title="发起催收" onClose={closeM}
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => { toast('催收函已生成并推送甲方对接人'); closeM(); }}>生成催收函</Btn></>}>
        {D.overdue.map((r) => (
          <div key={r.id} className="nc-gate-row">
            <span className="nc-gate-n">{r.id}<div className="nc-cell-sub">{r.use} · {r.date}</div></span>
            <span className="is-num num">{r.amt.toLocaleString()}</span>
            <span className="nc-gate-s"><Tag tone="orange">账龄 {daysBetween(r.date, TODAY)} 天</Tag></span>
          </div>
        ))}
        {D.overdue.length === 0 && <div className="nc-empty-mini">本项目当前无已开票未到账款项</div>}
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
          <select className="nc-input">{D.attach.map((g) => <option key={g.mile}>{g.mile}</option>)}</select>
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
        foot={<><Btn onClick={closeM}>取消</Btn><Btn kind="primary" onClick={() => {
          const note = commitProgress(progEdit);
          toast(`进度已保存为 ${progEdit}%${note}`);
          closeM();
        }}>保存</Btn></>}>
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

      <Modal open={m === 'approve'} width={480} title="本项目待审批事项" onClose={closeM}
        foot={<><span className="nc-cell-sub" style={{ marginRight: 'auto' }}>全局审批在「审批中心」，此处只列与本项目相关的单据</span><Btn onClick={closeM}>关闭</Btn></>}>
        <div className="nc-gate">
          {pending.length === 0 && <div className="nc-empty-mini">本项目当前无待审批事项</div>}
          {pending.map((a) => (
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
        impact={`原单据保留并置灰，冲销按净额追加；${D.payRows.find((r) => r.id === flushId)?.amt.toLocaleString() ?? ''} 元将不再计入现金。`}
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
          {flowRows.map((h) => (
            <div key={h.time + h.title} className="nc-gate-row">
              <span className="nc-gate-n"><b>{h.title}</b><div className="nc-cell-sub">{h.d}</div></span>
              <span className="is-num num">{h.time}</span>
              <span className="nc-gate-s"><Tag tone={h.tag === '自动' ? 'gray' : 'blue'}>{h.tag}</Tag></span>
            </div>
          ))}
          <div className="nc-gate-row">
            <span className="nc-gate-n">
              <b>{P.status}{D.curMileName ? ` · ${D.curMileName}` : ''}（当前）</b>
              <div className="nc-cell-sub">
                {D.curMileName
                  ? `${D.curMileName}进行中 · 节点准入资料${curMiss.length ? `缺 ${curMiss.length} 项` : '齐备'}`
                  : `进度 ${progActual}%`}
              </div>
            </span>
            <span className="is-num num">{P.updatedAt ?? P.start}</span>
            <span className="nc-gate-s">
              <Tag tone={(PROJECT_STATUS_TONE[P.status] || 'blue') as 'blue'}>{P.status}</Tag>
            </span>
          </div>
        </div>
        <div className="nc-ledhd" style={{ marginTop: 18 }}>操作明细</div>
        <Timeline items={C.ops.map((o) => ({
          date: o.t, tone: o.tag === '自动' ? 'gray' as const : 'ok' as const,
          text: <><b>{o.w}</b> <Tag tone={o.tag === '自动' ? 'gray' : 'blue'}>{o.tag}</Tag><div style={{ marginTop: 4 }}>{o.d}</div></>,
        }))} />
      </Drawer>
    </div>
  );
}
