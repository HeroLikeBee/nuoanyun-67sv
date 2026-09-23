// 驾驶舱（合并「我的工作台」+「经营驾驶舱」）—— 首页一屏掌握经营全局 + 今日该干什么
// 版式参照：驾驶舱.html（角色视角 Tab + 数据范围 seg + 新手引导 + 区域卡矩阵 + 岗位延伸块）
//
// 三维收敛原则：
//   1) 同一租户同一数据源，仅按「角色视角 × 数据范围 × 权限层级」裁剪视图；
//   2) 数据范围（本月/本季/本年）仅作用「区间类」指标；「时点类」指标一律不随动；
//   3) 金额类按 A-02 口径处理：无权限显示「—」（脱敏），而非隐藏整块（否则用户不知道有这块数据）。
// 硬规则：指标全部由基础数据自动推算，禁止人工填报；穿透 ≤3 click。
/* 本项目 vite 用 jsxRuntime: 'classic' —— JSX 编译成 React.createElement，
   所以即使代码里不显式写 React.xxx，也必须保留默认导入，删掉会运行时抛 React is not defined */
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Btn, Card, Code, EntityLink, Kpi, Op, PageHead, Progress, Tag, Tabs, Tip, useToast, pressProps,} from '../components/ui';
import {
  APPROVALS, BIDS, CERTS, CONTRACTS, CUSTOMERS, INVOICES, ITEMS, MATERIALS, OPPS, PROJECTS,
  RECEIVABLES, RISKS, ROLES, SUPPLIERS,
  fmt, fmtWan, isOppClosed, normContractStatus, oppStageTone, CONTRACT_STATUS_TONE, TODAY, canSeeMoney,
} from '../components/data';
import { Ico } from '../components/icons';
import { getOppStageIdx, getOppStages, getOppStageWeight, setFocus, setFocusTab } from '../components/store';
import type { IconName } from '../components/icons';

/** 距今天的天数（正 = 未来，负 = 已过期） */
function daysFromToday(date: string) {
  if (!date) return NaN;
  const a = new Date(`${TODAY}T00:00:00`).getTime();
  const b = new Date(`${date}T00:00:00`).getTime();
  return Math.round((b - a) / 86400000);
}

/* ============================ 数据范围（仅区间类联动） ============================ */
// 说明：区间类「本月应收 / 成本发生额」为演示区间快照（种子为时点数据，无法还原历史区间），
// 已在 KPI note 标注；「新增客户」改由客户建档月份真实派生，不再写死。
const SCOPES = [
  { key: 'm', label: '本月', recv: '¥128万', pay: '¥31.2万', cost: '¥16.8万' },
  { key: 'q', label: '本季', recv: '¥312万', pay: '¥88万', cost: '¥48.6万' },
  { key: 'y', label: '本年', recv: '¥1,080万', pay: '¥320万', cost: '¥186万' },
];
/** 按数据范围统计新增客户（建档月份口径，真实派生） */
function newCustOf(scope: string) {
  if (scope === 'm') return CUSTOMERS.filter((c) => c.since === '2026-09').length;
  if (scope === 'q') return CUSTOMERS.filter((c) => c.since >= '2026-07' && c.since <= '2026-09').length;
  return CUSTOMERS.filter((c) => c.since >= '2026-01').length;
}

/* ============================ 商机漏斗（数量 / 金额双口径） ============================ */
// 口径：全部由商机主数据派生，阶段取 store 的阶段模板真实档位（赢单 / 输单为终态，不入漏斗）；
// 数量口径 = 商机个数；金额口径 = 加权（金额 × 阶段权重）。禁止硬编码档位数值。
// 阶段模板可配置（BG-02）：后台增删 / 排序 / 改权重后，本漏斗档位与加权额同步重算。
/** 漏斗行：数量档 value = 个数；金额档 value = 加权额（元，用于条长比例） */
function buildFunnel(mode: 'c' | 'a') {
  const live = OPPS.filter((o) => !isOppClosed(o));
  const stages = getOppStages();
  const rows = stages.map((st) => {
    const list = live.filter((o) => o.stage === st.name);
    const prob = st.weight;
    const sum = list.reduce((s, o) => s + o.amt, 0);
    const weighted = Math.round(list.reduce((s, o) => s + o.amt * (prob / 100), 0));
    return {
      name: st.name,
      value: mode === 'c' ? list.length : weighted,
      label: mode === 'c' ? `${list.length} 个` : fmtWan(weighted),
    };
  });
  return { rows, live, total: live.reduce((s, o) => s + o.amt, 0), weighted: Math.round(live.reduce((s, o) => s + o.amt * (getOppStageWeight(o.stage) / 100), 0)) };
}

/* ============================ 证书预警 6 档口径 ============================ */
function certBuckets() {
  const expired = CERTS.filter((c) => c.validTo < TODAY);
  const d30 = CERTS.filter((c) => c.warnDays > 0 && c.warnDays <= 30);
  const d60 = CERTS.filter((c) => c.warnDays > 30 && c.warnDays <= 60);
  const d90 = CERTS.filter((c) => c.warnDays > 60 && c.warnDays <= 90);
  // 催出逾期：外借已过约定归还日仍未收回（演示口径固定 0，避免与证书台账重复计数）
  const urgeLate = 0;
  // 履约期过期提醒：证书已过期但仍在项目占用中（占用维持 + 提醒持证人/PM + 不影响验收，N-61）
  const holdExpired = CERTS.filter((c) => c.validTo < TODAY && (c.used as string[]).length > 0).length;
  return { expired, d30, d60, d90, urgeLate, holdExpired };
}

/* ============================ 新手引导（5 步，长期保留可回看） ============================ */
const GUIDE_STEPS = [
  { t: '切换数据范围', d: '本月 / 本季 / 本年只影响「区间类」指标（本月应收 · 本年新增客户 · 商机加权）；「时点类」指标（逾期应收 · 待我审批 · 待付款 · 保证金未退）不随动。' },
  { t: '读懂「资金与合同」分区', d: '逾期应收 = 近逾期欠款 − 红字冲销净额；点指标右上 ↗ 可穿透明细（全局穿透 ≤3 click）；鼠标悬停标题可看完整口径 Tooltip。' },
  { t: '处理「待我审批」（闭环）', d: '五类聚合：合同 / 变更 / 付款 / 开票 / 用章；审批口径以提交时快照为准；审批完成后状态自动回写、对应提醒即时消除（无合同付款固定路由总经理）。' },
  { t: '清空「我的待办」（闭环）', d: '每条待办都带直达操作：催收 / 补金额 / 去提交 / 去投标详情；处理完自动销提醒；提醒频控 ≤5 条/人日防打扰。' },
  { t: '善用角色视角与快捷条', d: '切换角色视角后，指标按 A-02 权限裁剪：无权限金额显示「—」脱敏而非隐藏；底部快捷条随角色变化，新建立即回流刷新。' },
];

/* ============================ 底部快捷操作（随角色变化） ============================ */
type Quick = [string, string, number];
const QUICK: Record<string, Quick[]> = {
  boss: [[' 去审批', 'primary', 3], [' 催收期次3', '', 3], [' 项目经营中心', '', 0], [' 待批配置', '', 0], [' 资金核心', 'finance', 0], [' 采购成本', 'purchase', 0]],
  deputy: [[' 去审批', 'primary', 2], [' 项目经营中心', '', 0], [' 团队客户', '', 0], [' 团队漏斗', '', 0]],
  sales: [[' 新建客户', 'primary', 0], [' 客户跟进', '', 2], [' 新建商机', '', 0], [' 生成报价', '', 1], [' 去投标看板', '', 0]],
  pm: [[' 现场报工', 'primary', 0], [' 上传照片', '', 0], [' 发起验收', '', 1], [' 整改反馈', '', 1]],
  finance: [[' 登记收款-期次3', 'primary', 1], [' 付款审批', '', 1], [' 红字冲销', '', 0], [' 归并提醒', '', 1], [' 成本台账', '', 0]],
  admin: [[' 用户管理', 'primary', 0], [' 证书管理', '', 3], [' 操作日志', '', 0], [' 枚举/模板/提醒', '', 0]],
  sysadmin: [[' 用户管理', 'primary', 0], [' 证书管理', '', 3], [' 操作日志', '', 0], [' 枚举/模板/提醒', '', 0], [' 成本归类维护', '', 0]],
};

const ADMIN_SYSTEMS = [
  { name: '枚举管理（29 组 · 含区域）', st: '正常', note: '—' },
  { name: '模板库（4 套 · 白名单变量）', st: '正常', note: '—' },
  { name: '提醒矩阵（18 事件 × 渠道）', st: '正常', note: '频控 ≤5 条/人日' },
  { name: '操作日志', st: '正常', note: '今日 23 条 · 保留 ≥2 年' },
  { name: '租户 Logo', st: '已上传', note: '决策 27' },
  { name: '待批开关', st: '关（默认）', note: '本月 0 笔' },
];

export default function DashboardPage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  const money = canSeeMoney(role);

  /* ---- 顶部工具区状态 ---- */
  const [view, setView] = useState(role); // 角色视角（默认跟随顶栏切换的角色）
  /* 顶栏角色变更后同步页内视角：此前 useState 初值只在挂载时取一次 role，
     顶栏换角色后 view 不变 → 「视角 Tab」与「权限裁剪 money=canSeeMoney(role)」永久错位。 */
  useEffect(() => { setView(role); }, [role]);
  const [scope, setScope] = useState('m');
  /* L1：项目经营卡「盈亏 / 现金流」两种口径切换（默认权责口径） */
  const [bizTab, setBizTab] = useState<'profit' | 'cash'>('profit');
  /* L1：我的项目卡「执行概览 / 项目进度明细」切换 */
  const [projTab, setProjTab] = useState<'kpi' | 'list'>('kpi');
  const [funMode, setFunMode] = useState<'c' | 'a'>('c');
  const [updTime, setUpdTime] = useState(TODAY + ' 10:23');

  /* ---- 新手引导状态 ---- */
  const [guideOpen, setGuideOpen] = useState(true);
  const [guideStep, setGuideStep] = useState(-1);
  const [guideDone, setGuideDone] = useState<boolean[]>([false, false, false, false, false]);

  /* ---- 我的待办已读 ---- */
  const [read, setRead] = useState<string[]>([]);

  const sc = SCOPES.find((s) => s.key === scope)!;
  const viewName = ROLES.find((r) => r.id === view)?.name ?? '总经理';
  const quick = QUICK[view] ?? QUICK.sysadmin;
  /* 漏斗档位与数值全部由商机主数据派生（阶段 × 概率），不再写死 4 档数字 */
  const funnel = useMemo(() => buildFunnel(funMode), [funMode]);
  const funnelRows = funnel.rows;

  const cb = certBuckets();
  const approvalTabs = APPROVALS.filter((a) => a.status === '待审批');
  /* 应收榜口径：逾期 + 已开票未到账（账龄 60-90 天）；已开票未到账不计入回款，与回款榜不重叠 */
  const overdueRecv = RECEIVABLES.filter((r) => r.status === '逾期' || r.status === '已开票未到账');
  const payable = RECEIVABLES.filter((r) => r.status === '可请款');
  const overdueContracts = CONTRACTS.filter((c) => c.overdue);
  const overpayContracts = CONTRACTS.filter((c) => c.overpay);
  const lowStock = MATERIALS.filter((m) => m.stock < m.safe);
  const pendingBidDeposit = BIDS.filter((b) => b.depositSt === '未退');
  const waitingOpen = BIDS.filter((b) => b.stage === '开标');

  const newClientCount = newCustOf(scope);
  const clientsToFollow = CUSTOMERS.filter((c) => c.lastFollowDays > 30);
  const myOpps = OPPS.filter((o) => !isOppClosed(o)).sort((a, b) => b.amt - a.amt);
  const myProjects = PROJECTS.slice(0, 4);
  const myCertsWarn = CERTS.filter((c) => c.warnDays > 0 || c.validTo < TODAY);
  /* 异常处置：已过有效期证书（须续证或停用）。
     原写法 `validTo < TODAY && status !== '已过期'` 恒为空集——status 字段本身就是
     「已过期 / 60 天内到期 / 30 天内到期」的预警档位，过期证书 status 必为「已过期」，
     两个条件互斥。改为只按有效期判定，并在副文案区分是否仍被项目占用。 */
  const healthDanger = CERTS.filter((c) => c.validTo < TODAY);

  /* ---------------- 资金类派生指标（禁止硬编码） ---------------- */
  /** 逾期应收 = Σ逾期期次金额 − 红字冲销净额（当前无冲销，净额 = 0） */
  const overdueTotal = overdueRecv.reduce((s, r) => s + r.amt, 0);
  /** 未来 7 / 30 天应收预测：计划日在窗口内且尚未逾期的期次 */
  const dueIn = (days: number) => RECEIVABLES
    .filter((r) => r.status !== '逾期' && r.status !== '已开票未到账' && (() => { const d = daysFromToday(r.dueDate); return d >= 0 && d <= days; })())
    .reduce((s, r) => s + r.amt, 0);
  const dueIn7 = dueIn(7);
  const dueIn30 = dueIn(30);
  /** 收款类合同（销售 + 维保）：用于实收 / 回款率 */
  const saleContracts = CONTRACTS.filter((c) => c.type === '销售合同' || c.type === '维护保养合同');
  /** 采购类合同：用于现金流出 */
  const buyContracts = CONTRACTS.filter((c) => c.type === '采购合同');
  const inflow = saleContracts.reduce((s, c) => s + c.recv, 0);
  const outflow = buyContracts.reduce((s, c) => s + c.recv, 0);
  /** 待付款 = 审批中 / 待审批的付款申请（已通过未付另计，当前无） */
  const payPending = APPROVALS
    .filter((a) => a.type === '付款申请' && (a.status === '待审批' || a.status === '审批中'))
    .reduce((s, a) => s + a.amt, 0);
  /** 回款执行率 = Σ实收 ÷ Σ执行金额（收款类合同，同期可比） */
  const recvBase = saleContracts.reduce((s, c) => s + c.execAmt, 0);
  const recvRate = recvBase ? inflow / recvBase : 0;

  /* ---------------- 项目经营派生指标 ---------------- */
  type Pj = { id: string; name: string; contractAmt: number; execAmt: number; cost: number };
  const pj = PROJECTS as unknown as Pj[];
  const profitAmtOf = (p: Pj) => p.contractAmt - p.cost;
  const pjWithAmt = pj.filter((p) => p.contractAmt > 0);
  const pjSorted = [...pj].sort((a, b) => profitAmtOf(a) - profitAmtOf(b));
  const worstPj = pjSorted[0];
  const bestPj = pjSorted[pjSorted.length - 1];
  /** 亏损项目：合同额 < 成本（含无合同在途已发生成本） */
  const lossCnt = pj.filter((p) => profitAmtOf(p) < 0).length;
  /** 成本率 = Σ实际成本 ÷ Σ执行金额；红线 80% */
  const COST_REDLINE = 0.8;
  const costSum = pjWithAmt.reduce((s, p) => s + p.cost, 0);
  const execSum = pjWithAmt.reduce((s, p) => s + p.execAmt, 0);
  const costRate = execSum ? costSum / execSum : 0;
  const overCostCnt = pjWithAmt.filter((p) => p.execAmt && p.cost / p.execAmt > COST_REDLINE).length;
  /** 成本率最高的项目（用于经营提醒定向） */
  const topCostPj = [...pjWithAmt].sort((a, b) => (b.cost / (b.execAmt || 1)) - (a.cost / (a.execAmt || 1)))[0];
  /** 证照 60 天内到期 / 已过期 的供应商数 */
  const suppCertSoon = SUPPLIERS.filter((s) => s.validTo && daysFromToday(s.validTo) <= 60).length;
  /** 无销售合同在途（项目先行兜底） */
  const noContract = PROJECTS.filter((p) => p.risk === 'nocontract');

  /* ---------- 待办（个人视角，原工作台核心内容并入） ---------- */
  type Todo = { key: string; n: number; label: string; sub: string; page: string; tone: 'red' | 'orange' | 'green' | 'blue' | 'gray' | 'gold' };
  const todos: Todo[] = [
    { key: 'approve', n: approvalTabs.length, label: '待我审批', sub: '合同 1 · 变更 1 · 付款 1 · 开票 1', page: 'approval', tone: 'orange' },
    { key: 'follow', n: clientsToFollow.length, label: '待我跟进客户（>30 天）', sub: clientsToFollow.length ? `最久 ${Math.max(...clientsToFollow.map((c) => c.lastFollowDays))} 天未跟进（已超期）` : '无超期客户', page: 'customer', tone: 'orange' },
    { key: 'recv', n: overdueRecv.length, label: '待我登记收款', sub: overdueRecv[0] ? `${overdueRecv[0].contract} 期次逾期 ${overdueRecv[0].overdueDays} 天` : '无逾期期次', page: 'contract', tone: 'red' },
    { key: 'cost', n: 2, label: '待登记项目成本', sub: '上月 2 个项目未登记成本', page: 'project-center', tone: 'blue' },
  ];

  /** 时点类不随范围；区间类取当前范围值 */
  const onScope = (k: string) => {
    setScope(k);
    const s = SCOPES.find((x) => x.key === k)!;
    toast(`数据范围已切换为「${s.label}」：仅区间类指标联动，时点类不随动`);
  };

  const markDone = (i: number) => {
    setGuideDone((prev) => {
      const next = prev.map((v, ix) => (ix === i ? true : v));
      if (next.every(Boolean)) toast(' 新手引导已全部完成！引导长期保留，可随时回看');
      else toast(`已完成第 ${i + 1} 步：${GUIDE_STEPS[i].t}`);
      return next;
    });
    setGuideStep(-1);
  };

  const guideProgress = guideDone.filter(Boolean).length;

  /* ============================ 公共区块 ============================ */

  /** 资金与合同—— 6 指标，含随范围 / 时点两类 */
  const blockMoney = (title: string, opts?: { todoAppr?: number }) => {
    const o = opts ?? {};
    return (
      <Card hd={<>{title}</>}>
        <div className="nc-kpi-grid is-6">
          <Kpi
            label={<>逾期应收{overdueRecv.length > 0 && <span className="nc-dotpos" />}</>}
            value={money ? fmtWan(overdueTotal) : '—'}
            tone={money ? 'red' : undefined}
            locked={!money}
            sub={overdueRecv[0] ? `${overdueRecv[0].node} · 逾期 ${overdueRecv[0].overdueDays} 天` : '无逾期'}
            note="口径：Σ逾期期次金额 − 红字冲销净额（时点类，不随数据范围切换）"
            onClick={() => go('contract')}
            drill
          />
          <Kpi
            label="本月应收"
            value={money ? sc.recv : '—'}
            tone="orange"
            locked={!money}
            sub="随数据范围"
            note="口径：区间类，随「本月 / 本季 / 本年」联动"
            onClick={() => go('contract')}
            drill
          />
          <Kpi
            label="未来 7 / 30 天应收"
            value={<>{money ? fmtWan(dueIn7) : '—'} <small>/ {money ? fmtWan(dueIn30) : '—'}</small></>}
            locked={!money}
            sub="回款预测"
            note="口径：按收款期次计划日期滚动预测（7 / 30 天窗口内未逾期期次合计）"
            onClick={() => go('contract')}
            drill
          />
          <Kpi
            label="待我审批"
            value={o.todoAppr != null ? `${o.todoAppr} 笔` : `${approvalTabs.length} 笔`}
            tone="orange"
            sub="合同 · 变更 · 付款 · 开票 · 用章"
            note="口径：五类聚合，按当前角色可见审批节点统计（时点类）"
            onClick={() => go('approval')}
            drill
          />
          <Kpi
            label="待付款"
            value={money ? fmtWan(payPending) : '—'}
            tone="orange"
            locked={!money}
            sub="审批中 + 已通过未付"
            note="口径：Σ付款申请（待审批 + 审批中）+ 已通过未付（时点类）"
            onClick={() => go('approval')}
            drill
          />
          <Kpi
            label="保证金未退"
            value={`${pendingBidDeposit.length} 笔`}
            tone={pendingBidDeposit.length ? 'orange' : undefined}
            sub={pendingBidDeposit[0] ? `${pendingBidDeposit[0].id} · ${fmtWan(pendingBidDeposit[0].deposit)}` : '暂无未退保证金'}
            note="口径：开标后到期未登记退回的投标保证金（时点类）"
            onClick={() => go('bid')}
            drill
          />
        </div>
      </Card>
    );
  };

  /** 商机漏斗 */
  const blockFunnel = (title: string) => (
    <Card
      hd={title}
      extra={
        <div className="nc-seg">
          <button className={`nc-seg-btn${funMode === 'c' ? ' is-on' : ''}`} onClick={() => setFunMode('c')}>数量</button>
          <button className={`nc-seg-btn${funMode === 'a' ? ' is-on' : ''}`} onClick={() => setFunMode('a')}>金额</button>
        </div>
      }
    >
      <div className="nc-funnel">
        {funnelRows.map((r) => {
          const max = Math.max(...funnelRows.map((x) => x.value), 1);
          return (
            <div key={r.name} className="nc-funnel-row">
              <span className="nc-funnel-name">{r.name}</span>
              <span className="nc-funnel-track">
                <span className="nc-funnel-bar" style={{ width: `${Math.max(14, (r.value / max) * 100)}%` }}>{r.value}</span>
              </span>
              <span className="nc-funnel-val num">{r.label}</span>
            </div>
          );
        })}
      </div>
      <div className="nc-dash-funnel-foot">
        <span className="nc-cell-sub">
          加权 = 金额 × 阶段权重 ｜ 在谈总额 {money ? fmtWan(funnel.total) : '—'} · 加权 {money ? fmtWan(funnel.weighted) : '—'}
        </span>
        <Btn size="sm" onClick={() => go('opp')}>穿透商机列表 →</Btn>
      </div>
    </Card>
  );

  /** 投标在途 —— 7 阶段中前 4 阶段为在途（报名 / 购买文件 / 做标书 / 开标），其余为终态 */
  const blockBid = () => {
    const stages: { label: string; real: string }[] = [
      { label: '报名', real: '报名' },
      { label: '购买文件', real: '购买文件' },
      { label: '做标书', real: '做标书' },
      { label: '开标待登记', real: '开标' },
    ];
    return (
      <Card
        hd={<><Ico n="mail" size={16} /> 投标在途<span> <Tip w={340} text="投标 7 阶段中前 4 阶段为「在途」（报名 / 购买文件 / 做标书 / 开标）；「开标」= 已递标、待登记结果。保证金独立流转，不占阶段枚举。" /></span></>}
        extra={<Btn size="sm" onClick={() => go('bid')}>投标管理 →</Btn>}>
        <div className="nc-kpi-grid is-4" style={{ gap: 8 }}>
          {stages.map((s) => {
            const n = BIDS.filter((b) => b.stage === s.real).length;
            const isLast = s.label === '开标待登记';
            return (
              <button key={s.label} className={`nc-stage-pill${isLast && n > 0 ? ' is-orange' : ''}`} onClick={() => go('bid')}>
                <span className="nc-stage-pill-n num">{n}</span>
                <span className="nc-stage-pill-l">{s.label}</span>
              </button>
            );
          })}
        </div>
        {waitingOpen.length > 0 && (
          <Alert
            icon={<Ico n="bell" size={16} />}
            title={<span className="nc-t-orange">最近开标：{waitingOpen[0].openDate} · {waitingOpen[0].name}（{waitingOpen[0].id}）</span>}
            sub={<>开标后须登记结果，未中标项目须在 30 天内登记保证金退回（当前 {pendingBidDeposit.length} 笔未退）</>}
            op={<Op onClick={() => go('bid')}>去登记结果</Op>}
          />
        )}
      </Card>
    );
  };

  /** 证书预警 —— 6 档 */
  const blockCert = () => (
    <Card hd={<><Ico n="scroll" size={16} /> 证书预警</>} extra={<Btn size="sm" onClick={() => go('cert')}>证书管理 →</Btn>}>
      <div className="nc-kpi-grid is-6" style={{ gap: 8 }}>
        {[
          { n: cb.expired.length, l: '过期', tone: 'red' as const },
          { n: cb.d30.length, l: '30 天内', tone: 'orange' as const },
          { n: cb.d60.length, l: '60 天内', tone: 'orange' as const },
          { n: cb.d90.length, l: '90 天内' },
          { n: cb.urgeLate, l: '催出逾期' },
          { n: cb.holdExpired, l: '履约期过期提醒', tone: 'orange' as const },
        ].map((x) => (
          <button key={x.l} className="nc-stage-pill" onClick={() => go('cert')}>
            <span className={`nc-stage-pill-n num${x.tone ? ` nc-v-${x.tone}` : ''}`}>{x.n}</span>
            <span className="nc-stage-pill-l">{x.l}</span>
          </button>
        ))}
      </div>
    </Card>
  );

  /** 客户卡 */
  const blockCustomer = (cols = 2) => (
    <Card hd={<><Ico n="users" size={16} /> 客户卡</>} extra={<Btn size="sm" onClick={() => go('customer')}>客户管理 →</Btn>}>
      <div className="nc-kpi-grid" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        <Kpi
          label={`新增客户（${sc.label}）`}
          value={String(newClientCount)}
          sub="随数据范围"
          note="口径：区间类，按客户建档月份统计（本月 / 本季 / 本年）"
          onClick={() => go('customer')}
          drill
        />
        <Kpi
          label="待跟进（>30 天）"
          value={clientsToFollow.length}
          tone="orange"
          sub={clientsToFollow.length ? `最久 ${Math.max(...clientsToFollow.map((c) => c.lastFollowDays))} 天` : '无超期'}
          note="口径：距最近一次跟进记录 > 30 天，触发待办"
          onClick={() => go('customer')}
          drill
        />
      </div>
    </Card>
  );

  /** 项目盈亏摘要 */
  /** 盈亏卡尾部：最差 / 最优项目 */
  const profitTail = () => {
    const withAmt = (PROJECTS as unknown as { id: string; name: string; contractAmt: number; cost: number; profit: number }[])
      .filter((p) => p.contractAmt > 0);
    if (!withAmt.length) return null;
    const worst = [...withAmt].sort((a, b) => a.profit - b.profit)[0];
    const best = [...withAmt].sort((a, b) => b.profit - a.profit)[0];
    return (
      <div className="nc-inline-ops" style={{ marginTop: 8 }}>
        <span className="nc-cell-sub">
          <Ico n="warning" size={14} style={{ color: 'var(--c-warning-mid)' }} /> 最差项目 <EntityLink target="project-center" id={worst.id} go={go} title="下钻到项目经营中心">{worst.name} ↗</EntityLink>
          {' '}· 毛利率 <b className="num nc-v-red">{worst.profit}%</b>
          {' '}· 合同 {money ? fmtWan(worst.contractAmt) : '—'} / 成本 {money ? fmtWan(worst.cost) : '—'}
        </span>
        <span className="nc-cell-sub" style={{ marginLeft: 'auto' }}>
          <Ico n="trophy" size={14} style={{ color: 'var(--c-warning-mid)' }} /> 最优项目 <EntityLink target="project-center" id={best.id} go={go} title="下钻到项目经营中心">{best.name} ↗</EntityLink>
          {' '}· 毛利率 <b className="num nc-v-green">{best.profit}%</b>
        </span>
      </div>
    );
  };

  const blockProfit = (rows: { label: string; value: string; tone?: 'red' | 'orange' | 'green' | 'blue'; sub: string; page?: string }[]) =>
    blockProjectBiz(rows, true);

  /** 经营提醒 —— 单条 CTA 直达修复页 */
  const blockAlert = (items: { tone: 'red' | 'orange' | 'gray'; title: string; sub: string; act: string; page: string; focusId?: string; tab?: string }[], title = ' 经营提醒区', badge = '兜底') => (
    <Card hd={title} extra={<Tag tone="gray">{badge}</Tag>}>
      {items.map((it) => (
        <div key={it.title} className="nc-alertrow" onClick={() => { if (it.focusId) setFocus(it.page, it.focusId); if (it.tab) setFocusTab(it.page, it.tab); go(it.page); }} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { if (it.focusId) setFocus(it.page, it.focusId); if (it.tab) setFocusTab(it.page, it.tab); go(it.page); } }}>          <Tag tone={it.tone}>{it.tone === 'red' ? '风险' : it.tone === 'orange' ? '待修复' : '提醒'}</Tag>
          <span style={{ flex: 1, minWidth: 0 }}>
            <div className="nc-alertrow-t">{it.title}</div>
            <div className="nc-cell-sub">{it.sub}</div>
          </span>
          <span className="nc-alertrow-cta">{it.act} →</span>
        </div>
      ))}
    </Card>
  );

  /** 待我审批表 */
  const blockApproval = (rows: typeof APPROVALS, total: number) => (
    <Card
      hd={<><span><Ico n="check" size={16} /> 待我审批</span>{total > 0 && <Tag tone="orange">五类聚合 = {total} 笔</Tag>}</>}
      extra={<><span className="nc-cell-sub">审批口径以提交快照为准</span><Btn size="sm" kind="primary" onClick={() => go('approval')}>去审批中心 →</Btn></>}
    >
      <table className="nc-tbl is-md">
        <thead><tr><th>类型</th><th>单据</th><th className="is-num" style={{ width: 120 }}>金额</th><th style={{ width: 130 }}>分级 / 路由</th><th style={{ width: 70 }}>操作</th></tr></thead>
        <tbody>
          {rows.slice(0, 4).map((a) => (
            <tr key={a.id}>
              <td><Tag tone={a.type === '合同审批' ? 'blue' : a.type === '变更审批' ? 'green' : a.type === '付款申请' ? 'orange' : 'gray'}>{a.type.replace('审批', '').replace('申请', '')}</Tag></td>
              <td><span className="nc-link" onClick={() => go('approval')} role="link" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') go('approval'); }}>{a.ref.split(' ')[0]}</span></td>
              <td className={`is-num${a.type === '变更审批' ? ' nc-v-green' : ''}`}>{money ? `${a.type === '变更审批' ? '+' : ''}${fmt(a.amt)}` : '—'}</td>
              <td>
                <Tag tone={a.amt >= 2000000 ? 'red' : a.amt >= 500000 ? 'orange' : 'gray'}>{a.level}</Tag>
                <div className="nc-cell-sub">{a.amt >= 500000 ? '浮率 / 金额双触发' : a.amt >= 200000 ? '金额分级' : '2 级校验'}</div>
              </td>
              <td><Op onClick={() => go('approval')}>去审批</Op></td>
            </tr>
          ))}
          {!rows.length && <tr><td colSpan={5} className="nc-cell-sub" style={{ textAlign: 'center', padding: 18 }}><Ico n="check" size={16} /> 当前账号无待审批单据</td></tr>}
        </tbody>
      </table>
    </Card>
  );

  /** 我的待办（个人视角，原「我的工作台」核心） */
  const blockTodo = () => (
    <Card hd="我的待办" extra={<><Tag tone="blue">个人提醒直达操作 · 站内 + 钉钉</Tag><Btn size="sm" onClick={() => { setRead([]); toast('待办已全部标记为已读'); }}>全部标记已读</Btn></>}>
      <table className="nc-tbl is-sm">
        <thead><tr><th style={{ width: 78 }}>类型</th><th>提醒</th><th className="is-num" style={{ width: 150 }}>建议操作</th></tr></thead>
        <tbody>
          {todos.map((t) => (
            <tr key={t.key} className={read.includes(t.key) ? 'is-muted' : undefined}>
              <td><Tag tone={t.tone}>{t.label.slice(0, 2)}</Tag></td>
              <td>
                <div className={t.n > 0 ? 'nc-v-red' : undefined}>{t.label} · {t.n} 项</div>
                <div className="nc-cell-sub">{t.sub}</div>
              </td>
              <td className="is-num">
                <Op onClick={() => { setRead((p) => [...new Set([...p, t.key])]); go(t.page); }}>{t.label.slice(0, 4)} →</Op>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );

  /** 我 / 团队 客户 */
  const blockMyOpp = (title: string, scopeTag: string) => (
    <Card hd={title} extra={<Tag tone="blue">{scopeTag}</Tag>}>
      <table className="nc-tbl is-md">
        <thead><tr><th>类型</th><th>编号</th><th>阶段 / 状态</th><th className="is-num">金额</th><th className="is-num" style={{ width: 110 }}>操作</th></tr></thead>
        <tbody>
          {myOpps.slice(0, 3).map((o) => (
            <tr key={o.id}>
              <td><Tag tone={o.amt >= 1000000 ? 'blue' : 'green'}>{o.amt >= 1000000 ? '商机' : '报价'}</Tag></td>
              <td><span className="nc-link" onClick={() => go('opp')} role="link" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') go('opp'); }}>{o.id}</span></td>
              <td>
                <Tag tone={oppStageTone(getOppStageIdx(o.stage))}>
                  {o.stage}{o.amt === 0 ? ' ⊙未填' : ''}
                </Tag>
              </td>
              <td className="is-num">{money ? (o.amt ? fmtWan(o.amt) : '—') : '—'}</td>
              <td className="is-num"><Op onClick={() => go('opp')}>推进</Op></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );

  /** 我的投标 */
  const blockMyBid = () => {
    const mine = BIDS.slice(0, 3);
    return (
      <Card hd="我的投标" extra={<span className="nc-cell-sub">关联投标结果自动回写商机</span>}>
        <table className="nc-tbl is-sm">
          <thead><tr><th>编号 / 项目</th><th>状态</th><th style={{ width: 80 }}>开标</th><th className="is-num" style={{ width: 110 }}>操作</th></tr></thead>
          <tbody>
            {mine.map((b) => (
              <tr key={b.id}>
                <td><span className="nc-link" onClick={() => go('bid')} role="link" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') go('bid'); }}>{b.id} {b.name}</span></td>
                <td>
                  <Tag tone={b.stage === '未中标' ? 'red' : b.stage === '中标' ? 'green' : b.stage === '已放弃' ? 'gray' : 'blue'}>{b.stage}</Tag>
                  {b.risk && <div className="nc-cell-sub nc-v-orange">{b.risk}</div>}
                </td>
                <td>{(b.openDate || '').slice(5)}</td>
                <td className="is-num"><Op onClick={() => go('bid')}>去投标详情</Op></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    );
  };

  /** 我的项目 · 执行概览（施工人员 / 项目经理） */
  const myProjectKpiBody = () => (
    <>
      <div className="nc-kpi-grid is-6">
        <Kpi label="在建项目" value={PROJECTS.filter((p) => ['执行中', '暂停', '验收结算中'].includes(p.status)).length} tone="blue" sub="本人负责施工" onClick={() => go('project')} drill />
        <Kpi label="今日任务" value={5} tone="blue" sub="2 项需现场照片" />
        <Kpi label="逾期任务" value={1} tone="red" sub="GC0009 · 逾期 1 天" />
        <Kpi label="待验收节点" value={1} tone="orange" sub="××中学 · 10-22" onClick={() => go('project-center')} drill />
        <Kpi label="本周报工" value="12 次" tone="green" sub="照片齐备率 100%" />
        <Kpi label="整改未闭环" value={1} tone="orange" sub="GC0012 · 3 项已 2 天" />
      </div>
    </>
  );

  /** 我的项目（仅概览）—— 总经理视角并列展示时使用 */
  const blockMyProject = () => (
    <Card hd={<><Ico n="building" size={16} /> 我的项目</>} extra={<Btn size="sm" onClick={() => go('project')}>项目管理 →</Btn>}>
      {myProjectKpiBody()}
    </Card>
  );

  /**
   * 评审 L1：原「我的项目」KPI 卡与「项目进度」表描述的是同一批 myProjects
   * 的两种呈现，信息重叠且各占一张卡位。合并为一张卡，页内 Tab 切换概览 / 明细。
   */
  const blockProjectExec = () => (
    <Card hd={<><Ico n="building" size={16} /> 我的项目</>} extra={<Btn size="sm" onClick={() => go('project')}>项目管理 →</Btn>}>
      <Tabs value={projTab} onChange={(k) => setProjTab(k as 'kpi' | 'list')} items={[
        { key: 'kpi', label: '执行概览' },
        { key: 'list', label: '项目进度明细', cnt: myProjects.length },
      ]} />
      <div style={{ marginTop: 12 }}>
        {projTab === 'kpi' ? myProjectKpiBody() : myProjectTableBody()}
      </div>
    </Card>
  );

  /** 项目进度明细表 */
  const myProjectTableBody = () => (
    <table className="nc-tbl is-sm">
        <thead><tr><th>项目</th><th style={{ width: 90 }}>阶段</th><th style={{ width: 120 }}>进度</th><th className="is-num" style={{ width: 150 }}>操作</th></tr></thead>
        <tbody>
          {myProjects.map((p) => (
            <tr key={p.id}>
              <td>
                <EntityLink target="project-center" id={p.id} go={go} title="下钻到项目经营中心">{p.id} {p.name}</EntityLink>
                <div className="nc-cell-sub">{(() => { const cid = (p as { customerId?: string }).customerId || CUSTOMERS.find((x) => x.name === p.customer)?.id; return cid ? <EntityLink target="customer" id={cid} go={go} title="下钻到客户档案">{p.customer}</EntityLink> : p.customer; })()}{p.risk && p.risk !== 'none' ? ` · ${p.risk === 'overcost' ? '成本超支' : p.risk === 'nocontract' ? '无合同在途' : '收款逾期'}` : ''}</div>
              </td>
              <td><Tag tone={p.milestone >= 100 ? 'green' : p.milestone >= 60 ? 'blue' : 'orange'}>{p.milestoneName}</Tag></td>
              <td>
                <div className="nc-prog-cell">
                  <Progress value={p.milestone} tone={p.milestone >= 80 ? 'green' : p.milestone >= 40 ? 'orange' : 'red'} />
                  <span className="num nc-cell-sub">{p.milestone}%</span>
                </div>
              </td>
              <td className="is-num">
                <Op onClick={() => toast('已打开报工（演示）')}>报工</Op>
                <span className="nc-op-sep">·</span>
                <Op onClick={() => go('project-center')}>上传照片</Op>
              </td>
            </tr>
          ))}
        </tbody>
    </table>
  );

  /** 收款逾期期次 */
  const blockOverdueRecv = () => (
    <Card hd="应收账龄（逾期 + 已开票未到账）" extra={<span className="nc-cell-sub">行内直达操作（与合同详情双向同源）· 已开票未到账不计入回款</span>}>
      <table className="nc-tbl is-md">
        <thead><tr><th>合同</th><th>期次</th><th className="is-num">计划金额</th><th style={{ width: 100 }}>计划日期</th><th style={{ width: 110 }}>状态</th><th className="is-num" style={{ width: 150 }}>操作</th></tr></thead>
        <tbody>
          {overdueRecv.map((r) => (
            <tr key={r.id} className="nc-row-warn">
              <td><EntityLink target="contract" id={r.contract} go={go} title="下钻到合同详情">{r.contract}</EntityLink></td>
              <td>{r.node}</td>
              <td className="is-num">{money ? fmt(r.amt) : '—'}</td>
              <td>{r.dueDate.slice(5)}</td>
              <td><Tag tone={r.status === '已开票未到账' ? 'orange' : 'red'}>{r.status === '已开票未到账' ? `已开票·待到账 ${r.overdueDays} 天` : `逾期 ${r.overdueDays} 天`}</Tag></td>
              <td className="is-num">
                <Op onClick={() => toast(`已发起催收提醒（短信 + 待办）· ${r.contract}`)}>催收</Op>
                <span className="nc-op-sep">·</span>
                <Op onClick={() => toast(`已打开登记收款：${r.node}（首笔后合同转履约中）`)}>登记收款</Op>
              </td>
            </tr>
          ))}
          {!overdueRecv.length && <tr><td colSpan={6} className="nc-cell-sub" style={{ textAlign: 'center', padding: 18 }}><Ico n="check" size={16} /> 无逾期期次</td></tr>}
        </tbody>
      </table>
    </Card>
  );

  /** 付款待处理 */
  const blockPayable = () => (
    <Card hd="付款待处理" extra={<span className="nc-cell-sub">含无合同付款徽标 · 特批徽标</span>}>
      <table className="nc-tbl is-md">
        <thead><tr><th>单据</th><th>类型</th><th className="is-num">金额</th><th>状态</th><th className="is-num" style={{ width: 100 }}>操作</th></tr></thead>
        <tbody>
          {approvalTabs.filter((a) => a.type === '付款申请').map((a) => (
            <tr key={a.id}>
              <td><span className="nc-link" onClick={() => go('approval')} role="link" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') go('approval'); }}>{a.ref.split(' ')[0]}</span></td>
              <td>采购付款 · 辅材款</td>
              <td className="is-num">{money ? fmt(a.amt) : '—'}</td>
              <td><Tag tone="blue">审批中 · {a.level}</Tag></td>
              <td className="is-num"><Op onClick={() => go('approval')}>审批</Op></td>
            </tr>
          ))}
          {payable.map((r) => (
            <tr key={r.id}>
              <td><EntityLink target="contract" id={r.contract} go={go} title="下钻到合同详情">{r.contract}</EntityLink></td>
              <td>项目款项 · {r.node}</td>
              <td className="is-num">{money ? fmt(r.amt) : '—'}</td>
              <td><Tag tone="orange">可请款</Tag></td>
              <td className="is-num"><Op onClick={() => toast('已打开付款校验明细（已付 + 本次 ≤ 执行金额 × 100%）')}>校验明细</Op></td>
            </tr>
          ))}
          {overpayContracts.map((c) => (
            <tr key={c.id} className="nc-row-warn">
              <td><EntityLink target="contract" id={c.id} go={go} title="下钻到合同详情">{c.id}</EntityLink></td>
              <td><Tag tone="orange">超额已付 · 需特批留痕</Tag></td>
              <td className="is-num">{money ? fmt(c.execAmt) : '—'}</td>
              <td><Tag tone="red">超执行金额</Tag></td>
              <td className="is-num"><Op onClick={() => toast('超付演示：输入金额 → 模拦截红色明细 →「特殊审批放行」理由必填')}>超付校验</Op></td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );

  /** 现金流（收付实现制 · 红字冲销净额 · 审批中不计流出） */
  const cashflowBody = (withQuick: boolean) => (
    <>
      <div className="nc-kpi-grid is-4">
        <Kpi label="现金流入" value={money ? fmtWan(inflow) : '—'} tone={money ? 'green' : undefined} locked={!money}
          sub={`∑实收 · ${saleContracts.length} 份收款类合同`} note="口径：∑实收（销售 + 维保合同已收），红字冲销净额" onClick={() => go('contract')} drill />
        <Kpi label="现金流出" value={money ? fmtWan(outflow) : '—'} locked={!money}
          sub={<>∑已付款 · 审批中 {money ? fmtWan(payPending) : '—'} 不计流出</>} note="口径：∑采购合同已付款，审批中不计流出（收付实现制）" onClick={() => go('contract')} drill />
        <Kpi label="净流入" value={money ? fmtWan(inflow - outflow) : '—'} tone="blue" locked={!money} sub="流入 − 流出" onClick={() => go('contract')} drill />
        <Kpi label="回款执行率" value={money ? `${(recvRate * 100).toFixed(1)}%` : '—'} tone="blue" locked={!money}
          sub="实收 ÷ 执行金额" note="口径：Σ实收 ÷ Σ执行金额（收款类合同，同期可比）" onClick={() => go('contract')} drill />
      </div>
      {withQuick && (
        <div className="nc-quickbar">
          <button className="nc-qk" onClick={() => toast('已打开：登记收款 - 期次3（演示）')}><Ico n="coin" size={16} /> 登记收款-期次3</button>
          <button className="nc-qk" onClick={() => go('approval')}><Ico n="card" size={16} /> 付款审批</button>
          <button className="nc-qk" onClick={() => toast('已打开：红字冲销（演示）· 负数单冲正、不回退合同状态')}><Ico n="refresh" size={16} /> 红字冲销</button>
          <button className="nc-qk" onClick={() => toast('已打开：归并提醒（演示）')}><Ico n="star" size={16} /> 归并提醒</button>
          <button className="nc-qk" onClick={() => { setFocusTab('project-center', 'cost'); go('project-center'); }}><Ico n="book" size={16} /> 成本台账</button>
        </div>
      )}
    </>
  );

  /**
   * 评审 L1：原「项目盈亏摘要」与「项目现金流摘要」两张卡同标 BG-10、
   * 口径却不同（权责毛利 vs 收付现金流），并列易误读且占用首屏。
   * 合并为一张「项目经营」卡，用页内 Tab 切换两个口径，并在卡头明示口径差异。
   */
  const blockProjectBiz = (rows?: { label: string; value: string; tone?: 'red' | 'orange' | 'green' | 'blue'; sub: string; page?: string }[], withQuick = false) => (
    <Card
      hd={<><Ico n="chart" size={16} /> 项目经营</>}
      extra={<span className="nc-cell-sub">{rows ? '权责口径（盈亏）／收付口径（现金流）' : '收付口径 · 红字冲销净额 · 审批中不计流出'}</span>}
    >
      {rows ? (
        <>
          <Tabs value={bizTab} onChange={(k) => setBizTab(k as 'profit' | 'cash')} items={[
            { key: 'profit', label: '盈亏（权责发生制）' },
            { key: 'cash', label: '现金流（收付实现制）' },
          ]} />
          <div style={{ marginTop: 12 }}>
            {bizTab === 'profit' ? (
              <>
                <div className="nc-kpi-grid" style={{ gridTemplateColumns: `repeat(${rows.length}, minmax(0, 1fr))` }}>
                  {rows.map((r) => (
                    <Kpi key={r.label} label={r.label} value={money ? r.value : '—'} tone={money ? r.tone : undefined}
                      locked={!money} sub={r.sub}
                      note="口径：实际毛利 = 合同额 − 实际成本（含采购 / 劳务 / 无合同付款归口），当日刷新"
                      onClick={() => go(r.page ?? 'project-center')} drill />
                  ))}
                </div>
                {profitTail()}
              </>
            ) : cashflowBody(withQuick)}
          </div>
        </>
      ) : cashflowBody(withQuick)}
    </Card>
  );

  const blockCashflow = (withQuick: boolean) => blockProjectBiz(undefined, withQuick);

  /** 岗位延伸区块（按角色渲染） */
  const renderView = () => {
    /* ---------- 总经理：经营全局 ---------- */
    if (view === 'boss') {
      return (
        <>
          <div className="nc-dash-row">
            <div className="nc-dash-main">{blockMoney(' 资金与合同')}</div>
            {blockFunnel(' 商机漏斗')}
          </div>
          <div className="nc-dash-row">
            {blockBid()}
            {blockCert()}
          </div>
          <div className="nc-dash-2">
            {blockCustomer()}
            {blockProfit([
              { label: ' 最佳项目', value: bestPj ? fmtWan(profitAmtOf(bestPj)) : '¥0', tone: 'green', sub: bestPj ? `${bestPj.id} · ${bestPj.name.slice(0, 8)}` : '—' },
              { label: ' 最差项目', value: worstPj ? fmtWan(profitAmtOf(worstPj)) : '¥0', tone: 'red', sub: worstPj ? `${worstPj.id} · ${worstPj.name.slice(0, 8)}` : '—' },
              { label: '亏损项目数', value: String(lossCnt), tone: lossCnt ? 'red' : undefined, sub: lossCnt ? '需经营复盘' : '无亏损项目' },
              { label: '平均成本率', value: `${(costRate * 100).toFixed(1)}%`, tone: costRate > COST_REDLINE ? 'red' : 'green', sub: `红线 ${COST_REDLINE * 100}% · 超线 ${overCostCnt} 个` },
            ])}
          </div>
          <div className="nc-dash-2">
            {blockAlert([
              { tone: 'orange', title: `${noContract.length} 个项目无销售合同在途 > 30 天`, sub: noContract.map((p) => `${p.id} · ${p.name}`).join(' / ') || '无', act: '补签合同', page: 'contract-new' },
              { tone: 'orange', title: '上月 2 个项目未登记成本', sub: '登记纪律兜底 · 附录 D', act: '去登记成本', page: 'project-center', tab: 'cost' },
              { tone: 'orange', title: `${lowStock.length} 种材料低于安全库存线`, sub: lowStock.map((m) => `${m.name}（${m.stock}/${m.safe}）`).slice(0, 3).join(' · ') || '—', act: lowStock.length ? '查看最缺材料' : '一键询价', page: 'material', focusId: lowStock[0]?.code },
            ])}
            {blockApproval(approvalTabs, approvalTabs.length)}
          </div>
          <div className="nc-sec-title">总经理 · 经营全局延伸（穿透二级，≤3 click）</div>
          <div className="nc-dash-2">
            {blockOverdueRecv()}
            {blockPayable()}
          </div>
          <div className="nc-dash-2">
            {blockMyProject()}
            <Card hd="系统健康" extra={<Tag tone="gray">仅管理员可见</Tag>}>
              <table className="nc-tbl is-sm">
                <thead><tr><th>子系统</th><th style={{ width: 100 }}>状态</th><th className="is-num">待处理</th></tr></thead>
                <tbody>
                  {ADMIN_SYSTEMS.map((s) => (
                    <tr key={s.name}>
                      <td>{s.name}</td>
                      <td><Tag tone={s.st.indexOf('正常') >= 0 || s.st.indexOf('已上传') >= 0 ? 'green' : 'gray'}>{s.st}</Tag></td>
                      <td className="is-num nc-cell-sub">{s.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
          <Card hd="风险 Top6" extra={<span className="nc-cell-sub">按严重度排序 · 红 / 橙 / 灰三级</span>}>
            {RISKS.map((r) => (
              <div key={r.t} className={`nc-riskrow is-${r.tone}`}>
                <span className={`nc-dot is-${r.tone}`} />
                <div className="nc-riskrow-main">
                  <div className="nc-riskrow-t">{r.t}</div>
                  <div className="nc-cell-sub">{r.d}</div>
                </div>
                <div className="nc-riskrow-right">
                  {!!r.amt && <b className="num">{money ? fmtWan(r.amt) : '—'}</b>}
                  <span className="nc-cell-sub">{r.owner}</span>
                </div>
              </div>
            ))}
          </Card>
        </>
      );
    }

    /* ---------- 分管负责人：团队 ---------- */
    if (view === 'deputy') {
      return (
        <>
          <div className="nc-dash-row">
            <div className="nc-dash-main">{blockMoney(' 分管资金与合同')}</div>
            {blockFunnel(' 团队漏斗')}
          </div>
          <div className="nc-dash-2">
            {blockAlert([
              { tone: 'orange', title: '2 个成员客户 > 30 天未跟进', sub: `${clientsToFollow.slice(0, 2).map((c) => `${c.name.slice(0, 6)} ${c.lastFollowDays}天`).join(' · ') || '广西×× 42 天 · 人民医院 35 天'}`, act: '查看名单', page: 'customer' },
              { tone: 'orange', title: `${overCostCnt} 个项目成本率超 ${COST_REDLINE * 100}% 红线`, sub: topCostPj ? `${topCostPj.id} · 实际 ${money ? fmtWan(topCostPj.cost) : '—'} / 执行 ${money ? fmtWan(topCostPj.execAmt) : '—'} · 成本率 ${((topCostPj.cost / topCostPj.execAmt) * 100).toFixed(1)}%` : '当前无项目超成本红线', act: '项目经营中心', page: 'project-center' },
              { tone: 'gray', title: '团队证书 60 天内到期 1 本', sub: `${CERTS.find((c) => c.warnDays > 30 && c.warnDays <= 60)?.name ?? '施工资质'} · 投标引用受影响`, act: '去看证书', page: 'cert' },
            ], ' 团队经营提醒')}
            {blockApproval(approvalTabs.slice(0, 2), 2)}
          </div>
          <div className="nc-dash-2">
            {blockCustomer()}
            {blockProfit([
              { label: ' 分管毛利', value: fmtWan(pjWithAmt.reduce((s, p) => s + profitAmtOf(p), 0)), tone: 'green', sub: `${pjWithAmt.length} 个有合同额项目合计` },
              { label: '亏损项目数', value: String(lossCnt), tone: lossCnt ? 'red' : undefined, sub: '需经营复盘' },
              { label: '平均成本率', value: `${(costRate * 100).toFixed(1)}%`, tone: costRate > COST_REDLINE ? 'red' : 'green', sub: `红线 ${COST_REDLINE * 100}%` },
            ])}
          </div>
          <div className="nc-dash-2">
            {blockTodo()}
            {blockOverdueRecv()}
          </div>
        </>
      );
    }

    /* ---------- 销售人员：客户 / 商机 / 报价 / 投标（原「我的工作台」主体） ---------- */
    if (view === 'sales') {
      return (
        <>
          <div className="nc-dash-row">
            <div className="nc-dash-main">
              <Card hd="我的客户" extra={<Tag tone="blue">本人数据范围</Tag>}>
                <div className="nc-kpi-grid is-4">
                  <Kpi label="名下有效客户" value="3 个" tone="blue" sub="已合并客户不重复计数" onClick={() => go('customer')} drill />
                  <Kpi label="待跟进（>30 天）" value={clientsToFollow.length} tone="orange" sub={clientsToFollow.map((c) => `${c.name.slice(0, 4)} ${c.lastFollowDays}天`).slice(0, 2).join(' / ') || '—'} onClick={() => go('customer')} drill />
                  <Kpi label="本周跟进" value="1 次" sub="本周已跟进次数" />
                  <Kpi label="公司逾期应收" value="—" locked sub="公司级 A-02 不可见" />
                </div>
              </Card>
            </div>
            {blockFunnel(' 我的商机漏斗')}
          </div>
          <div className="nc-dash-2">
            {blockMyOpp(' 我的商机 / 报价', '可操作')}
            {blockMyBid()}
          </div>
          {blockTodo()}
          <div className="nc-dash-2">
            {blockCustomer(2)}
            {blockProfit([
              { label: '公司实际毛利', value: '—', sub: ' A-02 无权限' },
              { label: '现金流入', value: '—', sub: ' A-02 无权限' },
              { label: '净流入', value: '—', sub: ' A-02 无权限' },
            ])}
          </div>
          <Card hd="快捷操作">
            <div className="nc-quickbar" style={{ marginTop: 0, borderTop: 'none', paddingTop: 0 }}>
              <button className="nc-qk" onClick={() => go('customer')}><Ico n="user" size={16} /> 新建客户</button>
              <button className="nc-qk" onClick={() => go('customer')}><Ico n="edit" size={16} /> 客户跟进</button>
              <button className="nc-qk" onClick={() => go('opp')}><Ico n="target" size={16} /> 新建商机</button>
              <button className="nc-qk" onClick={() => go('quote-edit')}><Ico n="file" size={16} /> 生成报价</button>
              <button className="nc-qk" onClick={() => go('bid')}><Ico n="mail" size={16} /> 去投标看板</button>
            </div>
          </Card>
        </>
      );
    }

    /* ---------- 施工人员 / 项目经理：项目执行与验收闭环 ---------- */
    if (view === 'pm') {
      return (
        <>
          <div className="nc-dash-2">
            {blockProjectExec()}
            <Card hd={<><Ico n="bell" size={16} /> 施工提醒</>} extra={<Tag tone="gray">频控 ≤5 条/人日</Tag>}>
              <Alert icon={<Ico n="bell" size={16} />} title="验收预约：××中学消防改造 · 10-22 上午" sub="请提前 1 天完成自检并上传现场照片" op={<Op onClick={() => go('project-center')}>去准备</Op>} />
              <Alert icon={<Ico n="warning" size={16} />} title={<span className="nc-t-orange">整改单 GC0012：3 项未闭环（已 2 天）</span>} sub="闭环后自动通知项目经理验收" op={<Op onClick={() => go('project-center')}>整改反馈</Op>} />
              <Alert icon={<Ico n="package" size={16} />} title="材料到货确认：辅材 1 批（关联 PF000009）" sub="确认后同步采购收货状态" op={<Op onClick={() => toast('已确认到货 · 同步采购收货状态（演示）')}>确认到货</Op>} />
            </Card>
          </div>
          <div className="nc-dash-2">
            {blockTodo()}
            {blockAlert([
              { tone: 'orange', title: '1 个项目证书履约期已过期', sub: '占用维持 + 提醒持证人 / 项目经理，不影响验收（N-61）', act: '去看证书', page: 'cert' },
              { tone: 'gray', title: '本月报工照片齐备率 100%', sub: '报工须上传现场照片（水印 + GPS）', act: '去报工', page: 'project-center' },
            ], ' 项目合规提醒')}
          </div>
          <Card hd="文档与验收资料" extra={<Tag tone="blue">按项目归口</Tag>}>
            <div className="nc-quickbar" style={{ marginTop: 0, borderTop: 'none', paddingTop: 0 }}>
              <button className="nc-qk" onClick={() => go('doc')}><Ico n="folder" size={16} /> 项目文档中心</button>
              <button className="nc-qk" onClick={() => go('doc')}><Ico n="file" size={16} /> 隐蔽验收记录</button>
              <button className="nc-qk" onClick={() => go('doc')}><Ico n="clipboard" size={16} /> 检测报告归档</button>
              <button className="nc-qk" onClick={() => toast('已发起验收申请（演示）')}><Ico n="check" size={16} /> 发起验收申请</button>
            </div>
          </Card>
        </>
      );
    }

    /* ---------- 财务：资金收付与账龄核销 ---------- */
    if (view === 'finance') {
      return (
        <>
          <div className="nc-dash-row">
            <div className="nc-dash-main">{blockMoney(' 资金核心')}</div>
            {blockFunnel(' 商机漏斗')}
          </div>
          <div className="nc-dash-2">
            {blockOverdueRecv()}
            {blockPayable()}
          </div>
          <div className="nc-dash-2">
            <Card hd="发票与税额" extra={<Btn size="sm" onClick={() => go('invoice')}>发票管理 →</Btn>}>
              <table className="nc-tbl is-sm">
                <thead><tr><th>发票号</th><th>关联合同</th><th className="is-num">含税金额</th><th>状态</th></tr></thead>
                <tbody>
                  {INVOICES.slice(0, 4).map((inv) => (
                    <tr key={inv.id}>
                      <td><span className="nc-link" onClick={() => go('invoice')} role="link" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') go('invoice'); }}>{inv.id}</span></td>
                      <td className="nc-cell-sub">{inv.contract}</td>
                      <td className="is-num">{money ? fmt(inv.total) : '—'}</td>
                      <td><Tag tone={inv.status === '正常' ? 'green' : inv.status === '已红字冲销' ? 'orange' : 'gray'}>{inv.status}</Tag></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <Card hd="合同履约与开票" extra={<Btn size="sm" onClick={() => go('contract')}>合同管理 →</Btn>}>
              <table className="nc-tbl is-sm">
                <thead><tr><th>合同</th><th>状态</th><th className="is-num">回款率</th><th className="is-num">已收</th></tr></thead>
                <tbody>
                  {CONTRACTS.slice(0, 4).map((c) => (
                    <tr key={c.id} className={c.overdue ? 'nc-row-warn' : undefined}>
                      <td><EntityLink target="contract" id={c.id} go={go} title="下钻到合同详情">{c.id}</EntityLink></td>
                      <td><Tag tone={CONTRACT_STATUS_TONE[normContractStatus(c.status)] ?? 'gray'}>{normContractStatus(c.status)}</Tag></td>
                      <td className="is-num">{c.recvPct}%</td>
                      <td className="is-num">{money ? fmtWan(c.recv) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>
        </>
      );
    }

    /* ---------- 行政 / 超级管理员：用户 · 证书 · 系统健康 ---------- */
    return (
      <>
        <div className="nc-dash-2">
          <Card hd="用户" extra={<span className="nc-cell-sub">离职清零方可停用（H-34 主入口）</span>}>
            <div className="nc-kpi-grid is-4">
              <Kpi label="启用用户" value={5} tone="blue" sub="角色 ≤3 / 人" />
              <Kpi label="待离职处理" value={1} tone="orange" sub="归属项未清零" />
              <Kpi label="已停用" value={0} sub="停用时失效会话" />
              <Kpi label="角色模板" value={9} sub="含 2 个管理员模板" />
            </div>
          </Card>
          {blockCert()}
        </div>
        <div className="nc-dash-2">
          <Card hd="待办 · 离职清零引导" extra={<Tag tone="orange">逐项处理后方可停用</Tag>}>
            <table className="nc-tbl is-sm">
              <thead><tr><th>用户</th><th>归属项</th><th className="is-num">数量</th><th className="is-num">操作</th></tr></thead>
              <tbody>
                <tr>
                  <td rowSpan={3}><b>李红</b><div className="nc-cell-sub"><Tag tone="gray">销售 · 离职流程中</Tag></div></td>
                  <td>名下客户</td><td className="is-num">0</td>
                  <td className="is-num"><Tag tone="green">已清零</Tag></td>
                </tr>
                <tr><td>名下商机</td><td className="is-num">0</td><td className="is-num"><Tag tone="green">已清零</Tag></td></tr>
                <tr>
                  <td>人员证书</td>
                  <td className="is-num nc-v-orange">1（ZS000015）</td>
                  <td className="is-num"><Op onClick={() => go('cert')}>归属处理</Op></td>
                </tr>
              </tbody>
            </table>
          </Card>
          <Card hd="系统健康" extra={<Tag tone="gray"><Ico n="lock" size={16} /> 金额类不可见</Tag>}>
            <table className="nc-tbl is-sm">
              <thead><tr><th>子系统</th><th style={{ width: 100 }}>状态</th><th className="is-num">待处理</th></tr></thead>
              <tbody>
                {ADMIN_SYSTEMS.map((s) => (
                  <tr key={s.name}>
                    <td>{s.name}</td>
                    <td><Tag tone={s.st.indexOf('正常') >= 0 || s.st.indexOf('已上传') >= 0 ? 'green' : 'gray'}>{s.st}</Tag></td>
                    <td className="is-num nc-cell-sub">{s.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
        <div className="nc-dash-2">
          <Card hd="供应商准入" extra={<Btn size="sm" onClick={() => go('supplier')}>供应商管理 →</Btn>}>
            <div className="nc-kpi-grid is-4">
              <Kpi label="已准入" value={SUPPLIERS.filter((s) => s.status === '已准入').length} tone="green" sub={`共 ${SUPPLIERS.length} 家`} onClick={() => go('supplier')} drill />
              <Kpi label="待准入" value={SUPPLIERS.filter((s) => s.status === '待准入').length} tone="orange" sub="资质待核验" onClick={() => go('supplier')} drill />
              <Kpi label="已冻结" value={SUPPLIERS.filter((s) => s.status === '已冻结').length} tone="red" sub="黑名单硬拦截" onClick={() => go('supplier')} drill />
              <Kpi label="证照 60 天内到期" value={suppCertSoon} tone={suppCertSoon ? 'orange' : undefined} sub={suppCertSoon ? '含已过期 · 准入失效' : '无临期证照'} onClick={() => go('supplier')} drill />
            </div>
          </Card>
          <Card hd="行政快捷入口">
            <div className="nc-quickbar" style={{ marginTop: 0, borderTop: 'none', paddingTop: 0 }}>
              <button className="nc-qk" onClick={() => toast('已跳转：用户管理（演示）')}><Ico n="user" size={16} /> 用户管理</button>
              <button className="nc-qk" onClick={() => go('cert')}><Ico n="scroll" size={16} /> 证书管理</button>
              <button className="nc-qk" onClick={() => toast('已跳转：操作日志（演示）')}><Ico n="clipboard" size={16} /> 操作日志</button>
              <button className="nc-qk" onClick={() => toast('已打开：枚举 / 模板 / 提醒（演示）')}><Ico n="module" size={16} /> 枚举/模板/提醒</button>
              <button className="nc-qk" onClick={() => toast('已打开：租户 Logo（演示）')}><Ico n="camera" size={16} /> 租户 Logo</button>
            </div>
          </Card>
        </div>
        {healthDanger.length > 0 && (
          <Card hd="异常处置" extra={<Tag tone="red">{healthDanger.length} 项</Tag>}>
            {healthDanger.map((c) => (
              <div key={c.id} className="nc-alertrow" onClick={() => go('cert')} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') go('cert'); }}>
                <Tag tone="red">已过期</Tag>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <div className="nc-alertrow-t">{c.name}（{c.id}）已于 {c.validTo} 过期</div>
                  <div className="nc-cell-sub">
                    {c.used.length > 0
                      ? <>仍被 {c.used.length} 个项目占用 · 履约期占用维持但禁止新借出与投标引用</>
                      : <>未被项目占用 · 请安排续证或停用注销</>}
                  </div>
                </span>
                <span className="nc-alertrow-cta">去处置 →</span>
              </div>
            ))}
          </Card>
        )}
      </>
    );
  };

  return (
    <>
      <PageHead
        title="驾驶舱"
        badges={<>
          <Tag tone="blue">{viewName}视角</Tag>
          <Tag tone="gray">更新 {updTime} · 自动刷新 10 min</Tag>
        </>}
        actions={<>
          <div className="nc-seg">
            {SCOPES.map((s) => (
              <button key={s.key} className={`nc-seg-btn${scope === s.key ? ' is-on' : ''}`} onClick={() => onScope(s.key)}>{s.label}</button>
            ))}
          </div>
          <Btn onClick={() => { const d = new Date(); const p = (n: number) => String(n).padStart(2, '0'); setUpdTime(`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`); toast('数据已刷新（演示）'); }}><Ico n="refresh" size={16} /> 刷新</Btn>
        </>}
      />

      {/* 角色视角 Tab（7 个岗位） */}
      <div className="nc-rolebar">
        {ROLES.map((r) => (
          <button
            key={r.id}
            className={`nc-role-tab${view === r.id ? ' is-on' : ''}`}
            onClick={() => { setView(r.id); toast(`已切换到「${r.name}」视角：指标按 A-02 权限裁剪`); }}
            title={`${r.name} · ${r.desc}`}
          >
            <Ico n={r.icon as IconName} size={16} /> {r.name}
          </button>
        ))}
      </div>

      {/* 新手引导（5 步，长期保留可回看） */}
      {guideOpen && (
        <section className="nc-guide">
          <div className="nc-guide-top">
            <span className="nc-guide-tt"><Ico n="book" size={16} /> <b>{guideProgress}</b>/5 新手引导</span>
            <Tag tone="blue">点击任务查看分步指引 → 完成后「标记完成」</Tag>
            <span className="nc-cell-sub">引导长期保留，可随时回看</span>
            <span className="nc-guide-ops">
              <Btn size="sm" onClick={() => { setGuideDone([false, false, false, false, false]); setGuideStep(-1); toast('新手引导已重置'); }}>重置</Btn>
              <Btn size="sm" onClick={() => setGuideOpen(false)}>关闭</Btn>
            </span>
          </div>
          <div className="nc-g-steps">
            {GUIDE_STEPS.map((s, i) => (
              <button
                key={s.t}
                className={`nc-g-step${guideDone[i] ? ' is-done' : ''}${guideStep === i ? ' is-open' : ''}`}
                onClick={() => setGuideStep(guideStep === i ? -1 : i)}
              >
                <span className="nc-g-no">{guideDone[i] ? '' : i + 1}</span>
                {s.t}
                {!guideDone[i] && (
                  <span className="nc-g-mark" onClick={(e) => { e.stopPropagation(); markDone(i); }} {...pressProps(() => markDone(i))}>标记完成</span>
                )}
              </button>
            ))}
          </div>
          {guideStep >= 0 && (
            <div className="nc-g-detail">
              <b>第 {guideStep + 1} 步 · {GUIDE_STEPS[guideStep].t}</b>：{GUIDE_STEPS[guideStep].d}
              {!guideDone[guideStep] && <span className="nc-g-mark" onClick={() => markDone(guideStep)} {...pressProps(() => markDone(guideStep))}>标记完成</span>}
            </div>
          )}
        </section>
      )}

      {/* ===== 岗位视图 ===== */}
      {renderView()}

      {/* ===== 底部快捷条（随角色变化） ===== */}
      <Card hd="快捷条（随角色变化）" extra={<span className="nc-cell-sub">数字为待处理笔数 · 权限外入口自动隐藏</span>}>
        <div className="nc-quickbar" style={{ marginTop: 0, borderTop: 'none', paddingTop: 0 }}>
          {quick.map(([label, target, bdg]) => (
            <button
              key={label}
              className="nc-qk"
              onClick={() => {
                const map: Record<string, string> = { finance: 'contract', purchase: 'supplier' };
                if (target && map[target]) go(map[target]);
                else if (label.indexOf('审批') >= 0) go('approval');
                else if (label.indexOf('证书') >= 0) go('cert');
                else if (label.indexOf('投标') >= 0 || label.indexOf('催收') >= 0) go('bid');
                else if (label.indexOf('客户') >= 0) go('customer');
                else if (label.indexOf('成本') >= 0 || label.indexOf('项目') >= 0) go('project-center');
                else if (label.indexOf('用户') >= 0 || label.indexOf('日志') >= 0) toast(`${label}（演示：已按当前角色权限直达）`);
                else toast(`${label}（演示：已按当前角色权限直达）`);
              }}
            >
              {label}
              {bdg > 0 && <span className="nc-qk-bdg">{bdg}</span>}
            </button>
          ))}
        </div>
      </Card>

    </>
  );
}
