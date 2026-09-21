// 诺安云 6.0 · 跨页共享数据（原型级极简 store）
// 解决「假闭环跨页」：新建合同 / 新建项目提交后，合同台账与项目台账看不到新单据。
// 设计：模块级可变数组 + 订阅广播；各台账页用 useState(getXxx) 播种并 useEffect 订阅，
//      保证 A 页写入后 B 页挂载 / 已挂载都能拿到最新数据（不引入第三方状态库）。
// 说明：BIDS / QUOTES / INVOICES 等在下方「实体关系图」处二次导入，此处不重复声明。
import { APPROVALS, CONTRACTS, PROJECTS } from './data';

type C = (typeof CONTRACTS)[number];
type P = (typeof PROJECTS)[number];
type A = (typeof APPROVALS)[number];
type B = (typeof BIDS)[number];
type Q = (typeof QUOTES)[number];
type Listener = () => void;

const listeners = new Set<Listener>();
const emit = () => listeners.forEach((l) => l());

/** 订阅 store 变更；返回取消订阅函数 */
export function subscribeStore(l: Listener) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

let contracts: C[] = CONTRACTS.slice();
let projects: P[] = PROJECTS.slice();

export const getContracts = () => contracts;
export const getProjects = () => projects;

/** 新增合同（台账页会实时出现） */
export function addContract(c: C) {
  contracts = [c, ...contracts];
  emit();
}

/** 新增项目（项目台帐页会实时出现） */
export function addProject(p: P) {
  projects = [p, ...projects];
  emit();
}

/* ============================ 审批中心 ↔ 业务单据 双向联动 ============================ */
// 原缺陷：审批中心通过 / 退回只改自身 APPROVALS 副本，业务对象（报价 / 合同 / 付款 / 变更）
// 状态永远停在「待审批」，形成「审批完了但业务单据不动」的假闭环。
//
// 设计：审批单的 ref 字段带上游单据号，按前缀路由到业务实体并回写状态。
//   报价 BJ…  → QUOTES.status      合同 HT…/WB… → CONTRACTS.status
//   投标 TB…  → BIDS.stage         变更 BG… / 付款 PF… → 状态覆盖层 bizStatus
// 业务页渲染状态时统一走 getBizStatus(单据号, 原状态)，无覆盖时回落到 data.ts 原值。

let approvals: A[] = APPROVALS.slice();
export const getApprovals = () => approvals;

/** 更新审批单（节点 / 状态 / 意见），并广播 */
export function setApprovalState(id: string, patch: Partial<A>) {
  approvals = approvals.map((x) => (x.id === id ? { ...x, ...patch } : x));
  emit();
}

/** 业务单据状态覆盖层：单据号 → 状态 */
let bizStatus: Record<string, string> = {};
export const getBizStatus = (no: string, fallback: string) => bizStatus[no] || fallback;
export function setBizStatus(no: string, st: string) {
  bizStatus = { ...bizStatus, [no]: st };
  emit();
}

/** 从审批单 ref 中解析上游业务单据号（BJ…/HT…/WB…/TB…/BG…/PF…） */
export function refBizNo(ref: string): string {
  const m = /^([A-Z]{2}\d{8}-\d{4}|[A-Z]{2}\d{6})/.exec(ref);
  return m ? m[1] : '';
}

/**
 * 审批结果 → 业务单据状态回写。返回被回写的单据号（未命中返回 ''）。
 * allDone=true 表示审批链走完（终审通过）；false 表示仅推进到下一节点。
 */
export function syncBizFromApproval(
  appr: { type: string; ref: string; status: string },
  allDone: boolean,
): string {
  const no = refBizNo(appr.ref);
  if (!no) return '';
  const rejected = appr.status === '已退回' || appr.status === '已终止';

  // 报价审批：待审批 → 审批中 → 已审批；退回回到草稿
  if (no.startsWith('BJ')) {
    const q = QUOTES.find((x) => x.id === no);
    if (!q) return '';
    const st = rejected ? '草稿' : allDone ? '已审批' : '待审批';
    setBizStatus(no, st);
    return no;
  }
  // 合同审批：通过 → 已签约（履约前）/ 退回 → 审批退回
  if (no.startsWith('HT') || no.startsWith('WB')) {
    const k = CONTRACTS.find((x) => x.id === no);
    if (!k) return '';
    const st = rejected ? '审批退回' : allDone ? (k.status === '履约中' ? '履约中' : '已签约') : '审批中';
    setBizStatus(no, st);
    return no;
  }
  // 其余（变更 BG / 付款 PF / 借阅 JY）：通用三态
  const st = rejected ? '已退回' : allDone ? '已通过' : '审批中';
  setBizStatus(no, st);
  return no;
}

/** 业务侧发起审批：在审批中心生成一条待办（保证「提交审批 → 审批中心可见」正向也闭环） */
export function pushApproval(a: A) {
  approvals = [a, ...approvals];
  emit();
}

/** 中标 → 转合同的待办交接：把中标标的暂存在 store，合同新建页读取预填 */
let pendingContract: { bidId: string; customer: string; name: string; amt: number } | null = null;
export const getPendingContract = () => pendingContract;
export function setPendingContract(v: typeof pendingContract) {
  pendingContract = v;
  emit();
}

/* ============================ 详情页聚焦实体（G3：消除硬编码索引 0） ============================ */
// 列表页跳转详情页前调用 setFocus('<pageId>', '<实体ID>')，详情页用 getFocus 取，
// 取不到时回落到首条 —— 保证「点哪条看哪条」，而非永远展示 PROJECTS[0] / QUOTES[0]。
let focus: Record<string, string> = {};

/** 记录目标页要聚焦的实体 ID */
export function setFocus(page: string, id: string) {
  focus = { ...focus, [page]: id };
  emit();
}

/** 读取目标页聚焦的实体 ID（为空时调用方回落到首条） */
export function getFocus(page: string) {
  return focus[page] || '';
}

/** 演示重置（便于反复演示原型） */
export function resetStore() {
  contracts = CONTRACTS.slice();
  projects = PROJECTS.slice();
  approvals = APPROVALS.slice();
  bizStatus = {};
  pendingContract = null;
  focus = {};
  emit();
}

/* ============================ 实体关系图（层层下钻的唯一事实源） ============================ */
// 目标：任意实体卡片上的关联名称都可点击，跳到对应页面并打开该实体的详情 —— 「点哪条看哪条」。
//
// 关联链路（依据 data.ts 的外键字段）：
//   客户 customerId ─┬─ 商机 OPPS.customerId
//                    ├─ 报价 QUOTES.customerId
//                    ├─ 投标 BIDS.customerId
//                    ├─ 项目 PROJECTS.customerId
//                    ├─ 合同 CONTRACTS.party（按客户名）
//                    └─ 发票 INVOICES.buyer（按客户名）
//   商机 opp         ──── 报价 QUOTES.opp
//   项目 project     ──── 合同 CONTRACTS.project
//
// 用法：rel.customer('KH20260312001') → { opps, quotes, bids, projects, contracts, invoices }

import { BIDS, CONTRACTS as CT, CUSTOMERS, INVOICES, OPPS, PROJECTS as PJ, QUOTES } from './data';

/** 按客户 ID 汇总该客户的全部关联单据 */
export function relOfCustomer(customerId: string) {
  const c = CUSTOMERS.find((x) => x.id === customerId);
  const name = c?.name || '';
  return {
    customer: c,
    opps: OPPS.filter((o) => o.customerId === customerId),
    quotes: QUOTES.filter((q) => q.customerId === customerId),
    bids: BIDS.filter((b) => b.customerId === customerId),
    projects: projects.filter((p) => p.customerId === customerId),
    contracts: contracts.filter((k) => !!name && k.party === name),
    invoices: INVOICES.filter((v) => !!name && v.buyer === name),
  };
}

/** 按项目 ID 汇总该项目的全部关联单据（合同按 project 外键） */
export function relOfProject(projectId: string) {
  const p = projects.find((x) => x.id === projectId);
  const custId = (p as { customerId?: string } | undefined)?.customerId || '';
  return {
    project: p,
    contracts: contracts.filter((k) => k.project === projectId),
    customer: custId ? CUSTOMERS.find((x) => x.id === custId) : (p ? CUSTOMERS.find((x) => x.name === p.customer) : undefined),
    quotes: custId ? QUOTES.filter((q) => q.customerId === custId && q.name.includes(p?.name.slice(0, 4) || '\u0000')) : [],
  };
}

/** 按商机 ID 汇总关联单据 */
export function relOfOpp(oppId: string) {
  const o = OPPS.find((x) => x.id === oppId);
  return {
    opp: o,
    quotes: QUOTES.filter((q) => q.opp === oppId),
    customer: o ? CUSTOMERS.find((x) => x.id === o.customerId) : undefined,
  };
}

/** 按合同 ID 汇总关联单据（客户 / 项目 / 同项目其他合同） */
export function relOfContract(contractId: string) {
  const k = contracts.find((x) => x.id === contractId);
  const projId = k?.project || '';
  return {
    contract: k,
    project: projId ? projects.find((p) => p.id === projId) : undefined,
    customer: k ? CUSTOMERS.find((x) => x.name === k.party) : undefined,
    siblings: projId ? contracts.filter((x) => x.project === projId && x.id !== contractId) : [],
    invoices: k ? INVOICES.filter((v) => v.buyer === k.party) : [],
  };
}
