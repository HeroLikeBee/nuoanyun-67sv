// 诺安云 6.0 · 跨页共享数据（原型级极简 store）
// 解决「假闭环跨页」：新建合同 / 新建项目提交后，合同台账与项目台账看不到新单据。
// 设计：模块级可变数组 + 订阅广播；各台账页用 useState(getXxx) 播种并 useEffect 订阅，
//      保证 A 页写入后 B 页挂载 / 已挂载都能拿到最新数据（不引入第三方状态库）。
// 说明：BIDS / QUOTES / INVOICES 等在下方「实体关系图」处二次导入，此处不重复声明。
import { APPROVALS, BIDS, CERT_OCCUPANCY, CERT_OCCUPANCY_SEED, CONTRACTS, CUSTOMERS, ID_MARK_FLOWS, ID_MARK_FLOWS_SEED, ID_MARK_RANGES, ID_MARK_RANGES_SEED, INVOICES, ITEMS, OPP_STAGE_TPL, OPPS, PROJECTS, PUSH_BATCHES, PUSH_BATCHES_SEED, QUOTES, SIGN_CHAINS, TODAY, normContractStatus, verNo } from './data';
import type { Item, OppStageTpl, Quote, QuoteVersion, SignConfig } from './data';

type C = (typeof CONTRACTS)[number];
type P = (typeof PROJECTS)[number];
type A = (typeof APPROVALS)[number];
type B = (typeof BIDS)[number];
type Q = (typeof QUOTES)[number];
type O = (typeof OPPS)[number];
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

/** 新增项目（项目台帐页会实时出现）。p.contractId 有值时即为「合同立项」，上游单据由合同继承。 */
export function addProject(p: P) {
  projects = [p, ...projects];
  emit();
}

/* ============================ 主数据 / 报价 / 投标切片 ============================
 * 修复「新建 / 编辑不落库」：原先这三个实体只存在于各自页面的 useState，
 * 跨页不可见（材料新增后在报价工作台选不到、报价提交后审批中心无待办、投标新建后商机看不到）。
 * 与 contracts / projects 同构：模块级可变数组 + emit() 广播 + resetStore() 同步。
 * ========================================================================== */

let items: Item[] = ITEMS.map((i) => ({ ...i }));

export const getItems = () => items;
/** 仅「启用」物料：报价 / 投标 / 配方等下游选择器一律用这个，避免停用物料继续被引用 */
export const getActiveItems = () => items.filter((i) => i.status === '启用');

export function addItem(it: Item) {
  items = [it, ...items];
  emit();
}

/** 按编码局部回写物料（改价 / 认证 / 安全库存 / 配方对外价等） */
export function patchItem(code: string, patch: Partial<Item>) {
  items = items.map((x) => (x.code === code ? ({ ...x, ...patch } as Item) : x));
  emit();
}

/** 启用 ⇄ 停用（停用后下游选择器不再出现该物料） */
export function toggleItemStatus(code: string) {
  items = items.map((x) => (x.code === code ? { ...x, status: x.status === '启用' ? '停用' : '启用' } : x));
  emit();
}

/**
 * 整表更新（供材料页的批量操作使用）。
 * 材料页有多处「按条件 map 整表」的写点（入库回写库存 / 配方保存 / 改价 / 认证维护 / 停用启用），
 * 逐个改成 patchItem 会打散原有逻辑，故保留 updater 形态；与 useState 的 setState 签名一致，
 * 页面侧只需把 `setItems` 指向本函数即可完成落库改造。
 */
export function updateItems(updater: (list: Item[]) => Item[]) {
  items = updater(items);
  emit();
}

let quotes: Quote[] = QUOTES.slice();

export const getQuotes = () => quotes;
export const getQuote = (id: string) => quotes.find((q) => q.id === id) ?? null;

export function addQuote(q: Quote) {
  quotes = [q, ...quotes];
  emit();
}

/** 按 id 局部回写报价单（状态 / 明细行 / 关联外键 / 浮率等） */
export function patchQuote(id: string, patch: Partial<Quote>) {
  quotes = quotes.map((q) => (q.id === id ? ({ ...q, ...patch } as Quote) : q));
  emit();
}

/** 保存报价明细行（工作台提交时调用；同时把 items 行数同步为明细行数） */
export function saveQuoteLines(id: string, lines: Quote['lines']) {
  quotes = quotes.map((q) => (q.id === id ? ({ ...q, lines, items: lines?.length ?? q.items } as Quote) : q));
  emit();
}

/**
 * 落一条版本快照（按当前 ver 幂等 upsert）。
 * 报价每次「提交审批 / 升版」都留痕，详情页的「版本记录」与「版本对比」据此做真实差异回放；
 * 此前对比表是写死 BJ000011 的静态行，换一张报价单看到的还是同一份昆明万达差异。
 * amt 取该版明细基价合计（不含区域上浮），与详情页「明细基价合计」口径一致。
 */
export function snapshotQuoteVersion(id: string, note: string, by = '当前用户') {
  quotes = quotes.map((q) => {
    if (q.id !== id) return q;
    const lines = JSON.parse(JSON.stringify(q.lines ?? [])) as NonNullable<Quote['lines']>;
    const snap: QuoteVersion = {
      ver: q.ver,
      amt: Math.round(lines.reduce((a, l) => a + l.qty * l.price, 0)),
      uplift: q.uplift ?? 0,
      at: TODAY, by, note: note.trim() || '内容调整',
      lines,
    };
    /* 同版重复提交视为覆盖该版快照，不做版本堆叠 */
    const rest = (q.versions ?? []).filter((v) => v.ver !== q.ver);
    return { ...q, versions: [...rest, snap].sort((a, b) => verNo(a.ver) - verNo(b.ver)) } as Quote;
  });
  emit();
}

let bids: B[] = BIDS.slice();

export const getBids = () => bids;
export const getBid = (id: string) => bids.find((b) => b.id === id) ?? null;

export function addBid(b: B) {
  bids = [b, ...bids];
  emit();
}

/** 按 id 局部回写投标单（阶段 / 保证金 / 中标金额 / 关联报价等） */
export function patchBid(id: string, patch: Partial<B>) {
  bids = bids.map((b) => (b.id === id ? ({ ...b, ...patch } as B) : b));
  emit();
}

/* ---------- 电子签章（CON-02）：落签地配置 + 签署链 ----------
   写操作全部落 store，避免「发起签署 / 单方签署 / 撤回」只 toast 不落数据（G1 同类缺陷）。
   合同侧 signStatus 与签署链同源：全部签完 → 已签 → 合同方可转「已签约」。 */
let signCfgs: Record<string, SignConfig> = JSON.parse(JSON.stringify(SIGN_CHAINS));

export const getSignConfig = (id: string): SignConfig | null => signCfgs[id] ?? null;

/** 合同局部回写（signStatus / status / terminateType 等） */
export function patchContract(id: string, patch: Partial<C>) {
  contracts = contracts.map((k) => (k.id === id ? ({ ...k, ...patch } as C) : k));
  emit();
}

/* ============================ 证书占用改归属（规格 §4.3 / §4.4 BID-04） ============================
 * 规格要求：中标转项目时把占用记录的 subjectType 由「投标」改为「项目」——**改归属留痕，不重建**；
 * 未中标 / 放弃时才释放（BidPage.doAbandon 已处理释放侧）。
 * 实现说明：CERT_OCCUPANCY 是模块级记录数组（由 CERTS.used + OCC_BID 派生一次），
 * occCount() / occOfProject() 等既有读取方直接读它。此处就地改写元素字段而不重建数组，
 * 让全部读取方零改写即可看到新归属；resetStore() 用 CERT_OCCUPANCY_SEED 还原。
 * ⚠️ 已知缺口：新建投标时不生成占用记录（Bid 只有 certGot 计数、没有占用记录 id 列表），
 *    故只有种子里的投标占用能被改归属；补全需给 Bid 增加 certList 并在做标书阶段写记录。
 * ============================================================================================== */
export function reassignCertsToProject(bidId: string, projectId: string, projectName: string): number {
  let n = 0;
  CERT_OCCUPANCY.forEach((o) => {
    if (o.subjectType === '投标' && o.subjectId === bidId && o.status === '占用中') {
      o.subjectType = '项目';
      o.subjectId = projectId;
      o.subjectName = projectName;
      n += 1;
    }
  });
  if (n) emit();
  return n;
}

/**
 * 项目局部回写。用途：补签合同后回写合同额并解除「无合同施工」标记 ——
 * 规格 §6.1 定义 contractAmt = 关联销售合同汇总，无合同时为 0；挂接合同后必须同步，
 * 否则项目中心的合同额、回款比例分母、亏损判定都停在立项时的空值上。
 */
export function patchProject(id: string, patch: Partial<P>) {
  projects = projects.map((p) => (p.id === id ? ({ ...p, ...patch } as P) : p));
  emit();
}

/**
 * 变更 / 价格调整补充协议生效 → 重算项目执行额（唯一口径，§9）。
 *   执行额 = 主合同签约价(contractAmt，冻结锚点) + Σ[已签署的价格调整类补充协议增量]
 * 只刷新 execAmt，绝不改 contractAmt（合同额冻结，不随变更/补充协议变化）。
 */
export function recomputeProjectExecAmt(projectId: string): number | null {
  const main = contracts.find((c) => c.project === projectId && c.contractRole === 'primary' && c.type === '销售合同');
  if (!main) return null;
  const deltas = contracts
    .filter((c) => c.project === projectId && c.contractRole === 'supplement_price' && c.parentId === main.id && (c.status === '已签约' || c.status === '履约中'))
    .reduce((s, c) => s + c.amt, 0);
  const exec = main.amt + deltas;
  projects = projects.map((p) => (p.id === projectId ? { ...p, execAmt: exec } : p));
  contracts = contracts.map((c) => (c.id === main.id ? { ...c, execAmt: exec } : c));
  emit();
  return exec;
}

/**
 * 框架协议执行额度汇总（§9）：框架已执行额度 = Σ 其下执行单
 *   （contractRole='supplement_service'、parentId 指向本框架、状态已签约/履约中）的执行金额。
 * 框架额度 amt 冻结；Σ 超出框架额度 → exceeded=true 且不写入（调用方拦截，须先签补充协议提高额度）。
 */
export function recomputeFrameworkExecAmt(frameworkId: string): { used: number; limit: number; exceeded: boolean } | null {
  const fw = contracts.find((c) => c.id === frameworkId && c.type === '框架协议');
  if (!fw) return null;
  const used = contracts
    .filter((c) => c.parentId === frameworkId && c.contractRole === 'supplement_service' && (c.status === '已签约' || c.status === '履约中'))
    .reduce((s, c) => s + c.execAmt, 0);
  const limit = fw.amt;
  if (limit > 0 && used > limit) return { used, limit, exceeded: true };
  contracts = contracts.map((c) => (c.id === frameworkId ? { ...c, execAmt: used } : c));
  emit();
  return { used, limit, exceeded: false };
}

/**
 * 变更录入确认（双模式换算后调用）：把增量计入执行额，合同额保持冻结不动。
 * 多轮变更基准 = 当前 execAmt；changeNo 标记变更单为「已生效」。负增量（核减）由调用方校验核减原因后传入。
 */
export function applyChangeDelta(projectId: string, delta: number, changeNo?: string): number | null {
  const proj = projects.find((p) => p.id === projectId);
  if (!proj) return null;
  const exec = proj.execAmt + delta;
  projects = projects.map((p) => (p.id === projectId ? { ...p, execAmt: exec } : p));
  const main = contracts.find((c) => c.project === projectId && c.contractRole === 'primary' && c.type === '销售合同');
  if (main) contracts = contracts.map((c) => (c.id === main.id ? { ...c, execAmt: exec } : c));
  if (changeNo) setBizStatus(changeNo, '已生效');
  emit();
  return exec;
}

/** 保存落签地配置（签署顺序 / 各方落签位置 / 签章类型 / 骑缝章） */
export function saveSignConfig(id: string, cfg: SignConfig) {
  signCfgs = { ...signCfgs, [id]: cfg };
  emit();
}

const stamp = () => `${TODAY} 16:30`;

/**
 * 发起签署（CON-02 ②）。
 * 异常（规格原文）：落签位置未配置 → 不允许发起签署 —— 无配置、无签署方、或有签署方未设锚点，一律拦截。
 */
export function startSign(id: string, by = '蓝峰'): { ok: boolean; msg: string } {
  const cfg = signCfgs[id];
  if (!cfg || !cfg.parties.length) return { ok: false, msg: '落签位置未配置，不允许发起签署' };
  if (cfg.parties.some((p) => !p.anchor.trim())) return { ok: false, msg: '存在未配置落签位置的签署方，不允许发起签署' };
  const at = stamp();
  signCfgs = {
    ...signCfgs,
    [id]: {
      ...cfg,
      parties: cfg.parties.map((p) => ({ ...p, st: '待签署', at: undefined, by: undefined, ip: undefined })),
      logs: [...cfg.logs, { at, text: `发起签署 · 按配置落签地渲染签章（签署顺序：${cfg.order}）`, by }],
    },
  };
  patchContract(id, { signStatus: '签署中' });
  return { ok: true, msg: `已发起签署 · 待签 ${cfg.parties.length} 方` };
}

/** 单方签署：记录该方签署时间戳（形成签署链）；全部签完 → signStatus 转「已签」 */
export function signOneParty(id: string, partyName: string, by = '蓝峰'): { ok: boolean; msg: string } {
  const cfg = signCfgs[id];
  if (!cfg) return { ok: false, msg: '尚未配置签署方' };
  const at = stamp();
  const parties = cfg.parties.map((p) =>
    (p.name === partyName && p.st === '待签署' ? { ...p, st: '已签', at, by, ip: '116.52.31.208' } : p));
  if (!parties.some((p, i) => p !== cfg.parties[i])) return { ok: false, msg: `${partyName} 当前不可签署` };
  signCfgs = { ...signCfgs, [id]: { ...cfg, parties, logs: [...cfg.logs, { at, text: `${partyName} 完成签署`, by }] } };
  const done = parties.every((p) => p.st === '已签');
  // 电子签全部完成：signStatus 转「已签」；业务 status 同步转「已签约」（原审批中/待签状态）
  patchContract(id, { signStatus: done ? '已签' : '签署中', ...(done ? { status: '已签约' } : {}) });
  // 补充协议全部签署完成 → 联动重算（合同额冻结不动）：
  //   价格调整补充 → 重算关联项目执行额；框架执行单 → 重算框架协议已执行额度
  if (done) {
    const c = contracts.find((x) => x.id === id);
    if (c && c.contractRole === 'supplement_price' && c.parentId && c.project) recomputeProjectExecAmt(c.project);
    if (c && c.contractRole === 'supplement_service' && c.parentId) {
      const parent = contracts.find((x) => x.id === c.parentId);
      if (parent && parent.type === '框架协议') recomputeFrameworkExecAmt(parent.id);
    }
  }
  return { ok: true, msg: done ? `${partyName} 已签署 · 电子签全部完成，合同可转「已签约」` : `${partyName} 已签署` };
}

/** 撤回签署（留痕可追溯）；撤回后落签地配置保留，修正后可再次发起 */
export function withdrawSign(id: string, reason: string, by = '蓝峰'): { ok: boolean; msg: string } {
  const cfg = signCfgs[id];
  if (!cfg) return { ok: false, msg: '尚未配置签署方' };
  const at = stamp();
  signCfgs = {
    ...signCfgs,
    [id]: {
      ...cfg,
      parties: cfg.parties.map((p) => (p.st === '已签' ? p : { ...p, st: '已撤回' })),
      logs: [...cfg.logs, { at, text: `撤回签署 · 原因：${reason}`, by }],
    },
  };
  patchContract(id, { signStatus: '已撤回' });
  return { ok: true, msg: `已撤回签署（原因：${reason}）· 修正落签地后可再次发起` };
}

/* ---------- 商机阶段模板（BG-02「商机漏斗阶段可配置 · 阶段枚举后台可维护」）----------
   阶段不再写死成常量：模板存 store，设置页（系统设置 · 业务字典 · 商机阶段）可增删 / 排序 / 改权重，
   商机列表筛选、看板列、推进弹窗、驾驶舱漏斗全部读同一份模板，改完即全站生效。
   gate 标记 = 「进入该阶段起预计金额必填」。转化不受阶段限制（由赢单动作触发），故不再作转化分界线。
   删除保护：① 仍有商机停留在该阶段时硬拦截（与「上门拜访」不可移除同类口径）；② 闸口档不可移除。 */
let oppStages: OppStageTpl[] = OPP_STAGE_TPL.map((s) => ({ ...s }));

export const getOppStages = () => oppStages;
/** 阶段序号（-1 = 未命中，如历史数据残留的旧阶段名） */
export const getOppStageIdx = (name: string) => oppStages.findIndex((s) => s.name === name);
/** gate 序号：金额必填分界线（找不到 gate 会回落末档，故闸口档的删除须在 removeOppStage 拦截） */
export const getOppGateIdx = () => {
  const i = oppStages.findIndex((s) => s.gate);
  return i >= 0 ? i : oppStages.length - 1;
};
export const getOppStageWeight = (name: string) => oppStages.find((s) => s.name === name)?.weight ?? 0;
/** 商机分布在各阶段的条数（删除保护与驾驶舱口径共用） */
export const countOppsInStage = (name: string) => opps.filter((o) => o.stage === name).length;

export function addOppStage(name: string, weight: number): { ok: boolean; msg: string } {
  if (oppStages.some((s) => s.name === name)) return { ok: false, msg: `阶段「${name}」已存在` };
  oppStages = [...oppStages, { name, weight }];
  emit();
  return { ok: true, msg: `已新增阶段「${name}」（权重 ${weight}% · 追加在末位，可上调顺序）` };
}

export function removeOppStage(name: string): { ok: boolean; msg: string } {
  const i = oppStages.findIndex((s) => s.name === name);
  if (i < 0) return { ok: false, msg: `阶段「${name}」不存在` };
  if (oppStages.length <= 1) return { ok: false, msg: '至少保留 1 个过程阶段' };
  /* 闸口档不可移除：getOppGateIdx() 找不到 gate 会静默回落末档，
     会让「金额必填」从第 2 档悄悄跳到第 4 档且无任何提示 */
  if (oppStages[i].gate) return { ok: false, msg: '「金额必填分界线」阶段不可移除，请先将分界线改挂到其他阶段' };
  const used = countOppsInStage(name);
  if (used > 0) return { ok: false, msg: `仍有 ${used} 个商机停留在「${name}」，不可移除` };
  oppStages = oppStages.filter((s) => s.name !== name);
  emit();
  return { ok: true, msg: `已移除阶段「${name}」（留痕）` };
}

/** 上移 / 下移阶段（阶段顺序即漏斗推进顺序） */
export function moveOppStage(name: string, dir: -1 | 1): { ok: boolean; msg: string } {
  const i = oppStages.findIndex((s) => s.name === name);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= oppStages.length) return { ok: false, msg: '已到边界，无法继续移动' };
  const next = [...oppStages];
  [next[i], next[j]] = [next[j], next[i]];
  oppStages = next;
  emit();
  return { ok: true, msg: `「${name}」已${dir < 0 ? '上移' : '下移'}至第 ${j + 1} 档` };
}

export function setOppStageWeight(name: string, weight: number): { ok: boolean; msg: string } {
  if (!oppStages.some((s) => s.name === name)) return { ok: false, msg: `阶段「${name}」不存在` };
  if (!(weight >= 0 && weight <= 100)) return { ok: false, msg: '权重需在 0~100 之间' };
  oppStages = oppStages.map((s) => (s.name === name ? { ...s, weight } : s));
  emit();
  return { ok: true, msg: `阶段「${name}」权重已更新为 ${weight}%（加权预测即时重算）` };
}

/** 按商机 ID 取关联投标：读 store 切片，保证「新建投标 → 商机页即时可见」 */
export const getOppBids = (oppId: string) => bids.filter((b) => b.opp === oppId);

/* ---------- 商机（SJ）----------
   阶段与状态正交：stage ∈ store 的阶段模板（仅活跃商机推进）；status ∈ 跟进中 / 赢单 / 输单。
   终态由 status 承载，stage 冻结在赢单 / 输单时所处阶段，不再占用阶段枚举。 */
export type OppLog = { at: string; from: string; to: string; by: string; note?: string };

let opps: O[] = OPPS.slice();
let oppLogs: Record<string, OppLog[]> = {};
let oppClose: Record<string, { status: string; reason?: string; competitor?: string; at: string; by: string }> = {};

export const getOpps = () => opps;
export const getOppLogs = (id: string) => oppLogs[id] || [];
export const getOppClose = (id: string) => oppClose[id] || null;

/** 推进 / 回退阶段（必填说明，写阶段历史留痕） */
export function moveOpp(id: string, to: string, note: string, by = '蓝峰') {
  const cur = opps.find((o) => o.id === id);
  if (!cur) return false;
  /* 目标阶段必须在当前模板内：模板被后台调整后，旧阶段名不应再写进新单据 */
  if (getOppStageIdx(to) < 0) return false;
  /* requireBid 门控（按单启用）：投标阶段须已有关联投标单，否则不允许推进 */
  const toTpl = oppStages.find((s) => s.name === to);
  if (toTpl?.requireBid && getOppBids(id).length === 0) return false;
  opps = opps.map((o) => (o.id === id ? { ...o, stage: to, last: TODAY } : o));
  oppLogs = { ...oppLogs, [id]: [{ at: TODAY, from: cur.stage, to, by, note }, ...(oppLogs[id] || [])] };
  emit();
  return true;
}

/** 赢单 / 输单（终态）。输单必填原因，可填竞争对手；赢单记录中标价依据。 */
export function closeOpp(
  id: string, status: '赢单' | '输单', opts: { reason?: string; competitor?: string; by?: string } = {},
) {
  const cur = opps.find((o) => o.id === id);
  if (!cur) return false;
  opps = opps.map((o) => (o.id === id
    ? ({ ...o, status, loseReason: opts.reason, loseCompetitor: opts.competitor } as O)
    : o));
  oppClose = {
    ...oppClose,
    [id]: { status, reason: opts.reason, competitor: opts.competitor, at: TODAY, by: opts.by || '蓝峰' },
  };
  emit();
  return true;
}

/** 重开（管理员）：仅把 status 复位为跟进中，阶段保持不动，已转化商机不可重开。 */
export function reopenOpp(id: string) {
  opps = opps.map((o) => (o.id === id
    ? ({ ...o, status: '跟进中', loseReason: undefined, loseCompetitor: undefined } as O)
    : o));
  const next = { ...oppClose };
  delete next[id];
  oppClose = next;
  emit();
}

/**
 * 立项审批回写（审批中心 XM 分支调用）：
 *   pass=true  → 执行中（终审通过，可进场）
 *   pass=false → 待启动（退回，可修改后重提）
 * 项目状态机（§6.2）不设「待审批」态：审批进度由 APPROVALS 记录承载，
 * 项目在审批链走完前始终保持「待启动」。退回不回到草稿，而是留在待启动等待重提。
 */
export function approveProject(no: string, pass: boolean) {
  let hit = false;
  projects = projects.map((p) => {
    if (p.id !== no) return p;
    hit = true;
    return { ...p, status: pass ? '执行中' : '待启动' };
  });
  if (hit) emit();
  return hit;
}

/**
 * 项目状态流转（规格 §6.2）：显式操作 + 必填原因 + 写入 logs 留痕。
 *   暂停  ：执行中 ⇄ 暂停（pauseReason 必填）
 *   恢复  ：暂停 → 执行中（reason 记「恢复原因」）
 *   关闭  ：维保型服务终止 → 已关闭（终态，可重开）
 *   重开  ：已关闭 → 执行中
 *   作废  ：建错 → 作废（终态，不可恢复）
 * 返回 false 表示未命中或非法流转（由调用方给出提示）。
 */
export function moveProject(
  no: string,
  to: string,
  opts: { by?: string; reason?: string } = {},
): boolean {
  const LEGAL: Record<string, string[]> = {
    待启动: ['执行中', '作废'],
    执行中: ['暂停', '验收结算中', '已关闭', '作废'],
    暂停: ['执行中', '作废'],
    验收结算中: ['已结项', '执行中'],
    已结项: ['维保服务中', '已关闭'],
    维保服务中: ['已关闭'],
    已关闭: ['执行中'],
    作废: [],
  };
  let hit = false;
  projects = projects.map((p) => {
    if (p.id !== no) return p;
    if (!(LEGAL[p.status] || []).includes(to)) return p;
    hit = true;
    const log = {
      at: new Date().toISOString().slice(0, 10),
      from: p.status, to, by: opts.by || '蓝峰', reason: opts.reason,
    };
    return {
      ...p,
      status: to,
      pauseReason: to === '暂停' ? opts.reason : p.pauseReason,
      pausedAt: to === '暂停' ? log.at : p.pausedAt,
      logs: [...(p.logs || []), log],
    };
  });
  if (hit) emit();
  return hit;
}

/**
 * 立项向导草稿：真存续 —— 保存后离开页面、再从菜单进入，仍能恢复上次填写。
 * 与「离开确认弹窗」的区别：后者是未保存就离开（丢弃），前者是显式保存。
 */
let projectDraft: Record<string, unknown> | null = null;
export const getProjectDraft = () => projectDraft;
export function addProjectDraft(d: Record<string, unknown> | null) {
  projectDraft = d;
  emit();
}
export function clearProjectDraft() {
  projectDraft = null;
  emit();
}

/* ============================ 审批中心 ↔ 业务单据 双向联动 ============================ */
// 原缺陷：审批中心通过 / 退回只改自身 APPROVALS 副本，业务对象（报价 / 合同 / 付款 / 变更）
// 状态永远停在「待审批」，形成「审批完了但业务单据不动」的假闭环。
//
// 设计：审批单的 ref 字段带上游单据号，按前缀路由到业务实体并回写状态。
//   报价 BJ…  → QUOTES.status      合同 HT…/WB… → CONTRACTS.status
//   投标 TB…  → BIDS.stage         项目立项 XM…  → PROJECTS.status（执行中 / 待启动）
//   变更 BG… / 付款 PF… → 状态覆盖层 bizStatus
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
  // 合同审批：通过 → 已签约（履约前）/ 退回 → 草稿（文档 §5.2：驳回 → 草稿）
  if (no.startsWith('HT') || no.startsWith('WB')) {
    const k = CONTRACTS.find((x) => x.id === no);
    if (!k) return '';
    const st = rejected ? '草稿' : allDone ? (normContractStatus(k.status) === '履约中' ? '履约中' : '已签约') : '待审批';
    setBizStatus(no, st);
    return no;
  }
  // 项目立项（XM）：通过 → 执行中（可进场）/ 退回 → 待启动（可修改后重提）；审批链未走完保持「待启动」
  if (no.startsWith('XM')) {
    if (!projects.some((x) => x.id === no)) return '';
    if (rejected) approveProject(no, false);
    else if (allDone) approveProject(no, true);
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

/**
 * 审批单号：前缀 SP + 6 位流水（全局单号规范 · 唯一事实源）。
 * 旧的「SP-年-月日-序号」日期制已作废；取现有最大流水 +1，
 * 保证 resetStore 后不会与种子单号碰撞。
 */
export function nextApprovalNo(): string {
  const max = approvals
    .map((a) => /^SP(\d{6})$/.exec(a.id))
    .reduce((mx, m) => (m ? Math.max(mx, Number(m[1])) : mx), 0);
  return `SP${String(max + 1).padStart(6, '0')}`;
}

/* ============================ 转合同待办交接（双来源） ============================
 * 两个来源共用一个通道，合同新建页按「有 bidId 则投标中标，有 oppId 则商机直签」判定来源标记：
 *   投标中标 —— 投标详情「中标 → 生成合同」；
 *   商机直签 —— 商机详情「转合同」（赢单后不经过报价 / 投标直接落合同草稿）。
 * 合同新建页读后立即置 null，避免下次独立进入也误预填。
 * ============================================================================== */
let pendingContract: { bidId?: string; oppId?: string; customer: string; name: string; amt: number } | null = null;
export const getPendingContract = () => pendingContract;
export function setPendingContract(v: typeof pendingContract) {
  pendingContract = v;
  emit();
}

/* ============================ 报价 → 转合同 ============================
 * 场景：报价台账「转合同」→ 跳合同新建页，带上来源报价单。
 * 修复前 QuotePage 只 go('contract-new') 不传参，合同新建页回落硬编码默认值
 * （昆明万达 / 320 万 / XM000123），导致从任意报价转合同都生成同一份合同草稿。
 * 消费式读取：合同新建页读后立即清除，避免下次独立进入也误预填。
 * ==================================================================== */
let pendingQuote: { quoteId: string } | null = null;
export const getPendingQuote = () => pendingQuote;
export function setPendingQuote(v: typeof pendingQuote) {
  pendingQuote = v;
  emit();
}
export function consumePendingQuote() {
  const v = pendingQuote;
  pendingQuote = null;
  return v;
}

/* ============================ 投标入口：商机 → 发起投标 ============================
 * 场景：商机详情「关联投标」区点「＋ 发起投标」→ 跳投标管理并打开发起向导，
 * 带上商机要素（名称 / 客户 / 预计金额 / opp 外键），使中标结果能回写商机漏斗。
 * 修复前商机侧只提示「请前往投标管理新建投标」，用户需手抄一遍要素，且新单不带 opp 外键，
 * 商机「关联投标」永远为空 —— 闭环断在最后一跳。
 * 消费式读取：投标页读后立即清除，避免下次独立进入也误预填。
 * ================================================================================ */
let pendingBid: { oppId?: string; quoteId?: string; name?: string; customer?: string; amt?: number } | null = null;
export const getPendingBid = () => pendingBid;
export function setPendingBid(v: typeof pendingBid) {
  pendingBid = v;
  emit();
}
export function consumePendingBid() {
  const v = pendingBid;
  pendingBid = null;
  return v;
}

/* ============================ 商机 → 转报价 ============================
 * 场景：商机详情「转报价」→ 跳报价工作台并新建草稿，带上商机外键与客户 / 预计金额。
 * 修复前该入口只 toast + go('quote-edit')，不带商机号，报价工作台的「关联商机」回落写死的 SJ000470，
 * 导致任意商机转出来的报价都挂到同一个商机下，「商机 → 报价」这条边名存实亡。
 * 消费式读取：报价工作台读后立即清除，避免下次新建报价也误预填。
 * ==================================================================== */
let pendingOppQuote: { oppId: string; name: string; customer: string; amt: number } | null = null;
export const getPendingOppQuote = () => pendingOppQuote;
export function setPendingOppQuote(v: typeof pendingOppQuote) {
  pendingOppQuote = v;
  emit();
}
export function consumePendingOppQuote() {
  const v = pendingOppQuote;
  pendingOppQuote = null;
  return v;
}

/* ============================ 合同续签 ============================
 * 场景：合同台账 / 详情点「续签」→ 跳合同新建页，带上源合同。
 * 新建页据此预填（按源合同要素生成续签草稿）并在提交时落 parentId，
 * 同时回写源合同 renewedTo，形成「原合同 ⇄ 续签合同」双向可追溯。
 * 消费式读取：合同新建页读后立即清除，避免下次独立进入也误预填。
 * ================================================================== */
let pendingRenew: { contractId: string } | null = null;
export const getPendingRenew = () => pendingRenew;
export function setPendingRenew(v: typeof pendingRenew) {
  pendingRenew = v;
  emit();
}
export function consumePendingRenew() {
  const v = pendingRenew;
  pendingRenew = null;
  return v;
}

/* ============================ 立项待办交接（三来源） ============================
 *   合同交底 —— 合同详情「创建项目」，立项页切「入口 A」形态：预填合同要素 + 合同交底卡；
 *   投标中标 —— 投标详情「补建项目」，带投标要素并落 bidId，来源=投标中标；
 *   商机直签 —— 商机详情「转项目」，应急抢修场景：无合同先干，落 oppId + noContract + 补签期限。
 * 三者互斥（同时只会有一个），立项页按命中的外键决定来源与闸口形态。
 * 消费式读取：立项页读后立即清除，避免下次从列表进入也误判为入口 A。
 * ============================================================================== */
let pendingProject: {
  contractId?: string; bidId?: string; oppId?: string;
  /** 无合同立项（应急工程）时由商机 / 投标带入的要素，用于预填立项表单 */
  name?: string; customer?: string; amt?: number;
  /** 无合同先施工原因（应急工程必填，写入立项留痕供复盘审计） */
  noContractReason?: string;
} | null = null;
export const getPendingProject = () => pendingProject;
export function setPendingProject(v: typeof pendingProject) {
  pendingProject = v;
  emit();
}
export function consumePendingProject() {
  const v = pendingProject;
  pendingProject = null;
  return v;
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

/**
 * 消费式读取：取出并清除该页的聚焦 ID（只生效一次）。
 * 用于「打开详情抽屉」这类一次性动作 —— 修复「穿透跳转后，再从侧栏菜单进入同一页也自动弹详情」的缺陷：
 * 菜单进入时聚焦已被上次消费掉，因此不会误开抽屉。
 * 注意：决定「页面主体展示哪一条」的渲染型读取（useMemo）仍应用 getFocus，不能消费。
 */
export function consumeFocus(page: string) {
  const id = focus[page] || '';
  if (id) {
    const next = { ...focus };
    delete next[page];
    focus = next;
  }
  return id;
}

/* ============================ 跨页 Tab 深链 ============================
 * 场景：驾驶舱「成本台账」快捷入口 → 项目详情并直接切到「成本台账」Tab。
 * 与 focus 同构：消费式读取，读后即清除，避免残留导致下次从菜单进入又自动切 Tab。
 * ==================================================================== */
let focusTab: Record<string, string> = {};

/** 跳转前声明目标页签（如 setFocusTab('project-center', 'cost')） */
export function setFocusTab(page: string, tab: string) {
  focusTab = { ...focusTab, [page]: tab };
  emit();
}

/** 目标页消费式读取页签，读后立即清除（只生效一次） */
export function consumeFocusTab(page: string) {
  const t = focusTab[page] || '';
  if (t) {
    const next = { ...focusTab };
    delete next[page];
    focusTab = next;
  }
  return t;
}

/** 演示重置（便于反复演示原型） */
export function resetStore() {
  /* 深拷贝：contracts / projects / quotes / bids 均含嵌套数组（installments / logs / lines / workItems），
     浅拷贝会让切片元素与 data.ts 常量共享引用，就地改一次就污染了种子数据。 */
  contracts = JSON.parse(JSON.stringify(CONTRACTS));
  signCfgs = JSON.parse(JSON.stringify(SIGN_CHAINS));
  projects = JSON.parse(JSON.stringify(PROJECTS));
  approvals = APPROVALS.slice();
  opps = OPPS.slice();
  oppStages = OPP_STAGE_TPL.map((s) => ({ ...s }));
  quotes = JSON.parse(JSON.stringify(QUOTES));
  bids = JSON.parse(JSON.stringify(BIDS));
  items = ITEMS.map((i) => ({ ...i }));
  /* 证书占用改归属是就地改写，按种子快照还原（保持数组引用不变，读取方零改写） */
  CERT_OCCUPANCY.splice(0, CERT_OCCUPANCY.length, ...CERT_OCCUPANCY_SEED.map((o) => ({ ...o })));
  /* 消防产品身份标识：号段采录账 + 流向账，同为就地数组，按种子快照还原 */
  ID_MARK_RANGES.splice(0, ID_MARK_RANGES.length, ...ID_MARK_RANGES_SEED.map((r) => ({ ...r })));
  ID_MARK_FLOWS.splice(0, ID_MARK_FLOWS.length, ...ID_MARK_FLOWS_SEED.map((f) => ({ ...f })));
  /* 厂家号段推送：确认 / 驳回是就地改写，且确认会连带写号段账，一并回到待确认的初始态 */
  PUSH_BATCHES.splice(0, PUSH_BATCHES.length, ...PUSH_BATCHES_SEED.map((b) => ({ ...b })));
  oppLogs = {};
  oppClose = {};
  bizStatus = {};
  pendingContract = null;
  pendingQuote = null;
  pendingOppQuote = null;
  pendingRenew = null;
  pendingProject = null;
  pendingBid = null;
  focus = {};
  focusTab = {};
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
//
// ⚠️ 一律读 store 切片（quotes / bids / contracts / projects）而非 data.ts 模块常量，
//    否则新建 / 编辑的单据在下钻链路里看不到。

/** 按客户 ID 汇总该客户的全部关联单据 */
export function relOfCustomer(customerId: string) {
  const c = CUSTOMERS.find((x) => x.id === customerId);
  const name = c?.name || '';
  return {
    customer: c,
    opps: OPPS.filter((o) => o.customerId === customerId),
    quotes: quotes.filter((q) => q.customerId === customerId),
    bids: bids.filter((b) => b.customerId === customerId),
    projects: projects.filter((p) => p.customerId === customerId),
    contracts: contracts.filter((k) => !!name && k.party === name),
    invoices: INVOICES.filter((v) => !!name && v.buyer === name),
  };
}

/**
 * 按项目 ID 汇总该项目的全部关联单据。
 * 报价 / 投标走**外键精确匹配**（QUOTES.projectId / PROJECTS.quoteId / bidId），
 * 不再用「客户相同 + 名称前 4 字模糊匹配」——那个写法会取到同客户的另一张报价单。
 */
export function relOfProject(projectId: string) {
  const p = projects.find((x) => x.id === projectId);
  const custId = (p as { customerId?: string } | undefined)?.customerId || '';
  const contractIds = contracts.filter((k) => k.project === projectId).map((k) => k.id);
  return {
    project: p,
    contracts: contracts.filter((k) => k.project === projectId),
    customer: custId ? CUSTOMERS.find((x) => x.id === custId) : (p ? CUSTOMERS.find((x) => x.name === p.customer) : undefined),
    /* 报价：优先外键（projectId），兜底经来源合同反查（CONTRACTS.quoteId） */
    quotes: quotes.filter((q) => q.projectId === projectId
      || (q.id === (p?.quoteId ?? ''))
      || contractIds.some((cid) => contracts.find((k) => k.id === cid)?.quoteId === q.id)),
    /* 投标：优先外键（bidId），兜底经来源合同反查（CONTRACTS.bidId） */
    bids: bids.filter((b) => b.id === (p?.bidId ?? '')
      || contractIds.some((cid) => contracts.find((k) => k.id === cid)?.bidId === b.id)),
  };
}

/** 按商机 ID 汇总关联单据（投标按 BIDS.opp 外键挂接，不占商机阶段） */
export function relOfOpp(oppId: string) {
  const o = OPPS.find((x) => x.id === oppId);
  return {
    opp: o,
    quotes: quotes.filter((q) => q.opp === oppId),
    bids: bids.filter((b) => b.opp === oppId),
    customer: o ? CUSTOMERS.find((x) => x.id === o.customerId) : undefined,
  };
}

/** 按合同 ID 汇总关联单据（客户 / 项目 / 同项目其他合同 / 来源报价与投标） */
export function relOfContract(contractId: string) {
  const k = contracts.find((x) => x.id === contractId);
  const projId = k?.project || '';
  return {
    contract: k,
    project: projId ? projects.find((p) => p.id === projId) : undefined,
    customer: k ? CUSTOMERS.find((x) => x.name === k.party) : undefined,
    siblings: projId ? contracts.filter((x) => x.project === projId && x.id !== contractId) : [],
    invoices: k ? INVOICES.filter((v) => v.buyer === k.party) : [],
    /* 上游来源单据（中标投标单 / 来源报价单），供合同详情「中标依据 / 来源报价」栏位下钻 */
    bid: k?.bidId ? bids.find((b) => b.id === k.bidId) : undefined,
    quote: k?.quoteId ? quotes.find((q) => q.id === k.quoteId) : undefined,
  };
}
