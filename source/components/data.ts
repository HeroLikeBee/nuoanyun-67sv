// 诺安云 6.0 · 演示数据（消防行业口径）
// 编号体系：KH 客户 / SJ 商机 / BJ 报价 / TB 投标 / ZS 证书 / HT 合同 / CG 采购 / WB 维护保养
//           FK 框架协议 / XM 项目 / MP 模板 / GYS 供应商 / CL 材料 / CP 产品 / SB 设备 / FP 发票
// 全部为虚构示例，手机号按规范脱敏（跨团队 138****1234），金额为演示值且可口算校验

import type { IconName } from './icons';

/* ============================ 角色（7 个，顶栏下拉唯一入口） ============================ */
export const ROLES = [
  { id: 'boss', name: '总经理', icon: 'chart', desc: '大额审批 · 经营全局' },
  { id: 'deputy', name: '分管副总', icon: 'user', desc: '分管业务 · 投标与商机' },
  { id: 'sales', name: '销售', icon: 'wallet', desc: '客户跟进 · 商机推进' },
  { id: 'pm', name: '项目经理', icon: 'wrench', desc: '驻场管理 · 成本验收' },
  { id: 'finance', name: '财务', icon: 'wallet', desc: '收款开票 · 账龄核销' },
  { id: 'admin', name: '行政', icon: 'shield', desc: '证书台账 · 资料归档' },
  { id: 'sysadmin', name: '超级管理员', icon: 'gear', desc: '口径维护 · 异常处置' },
];

/* ============================ 顶栏 13 模块 Tab（仅「经营管理」可点） ============================ */
export const MODULE_TABS = [
  { id: 'proj-overview', name: '项目概况', disabled: true, note: '物联模块' },
  { id: 'dispatch', name: '调度中心', disabled: true, note: '物联模块' },
  { id: 'iot-monitor', name: '联网监测', disabled: true, note: '物联模块' },
  { id: 'workbench-mod', name: '工作台', disabled: true, note: '已合并入本模块「驾驶舱」（角色视角在页内切换）' },
  { id: 'engineering', name: '工程管理', disabled: true, note: '物联模块' },
  { id: 'goods', name: '物品管理', disabled: true, note: '材料 / 产品 / 套件 BOM 已归入经营管理 · 供应链管理' },
  { id: 'biz', name: '经营管理', disabled: false, note: '唯一业务模块，承载 6 组侧栏菜单' },
  { id: 'reports', name: '数据报表', disabled: true, note: '第二批' },
  { id: 'knowledge', name: '知识中心', disabled: true, note: '第二批' },
  { id: 'emergency', name: '应急管理', disabled: true, note: '物联模块' },
  { id: 'platform', name: '平台配置', disabled: true, note: '第二批' },
  { id: 'ops', name: '运营监测', disabled: true, note: '物联模块' },
  { id: 'system', name: '系统管理', disabled: true, note: '第二批' },
];

/* ============================ 侧栏 6 组 13 项（严格按用户截图，工作台已合并入驾驶舱） ============================ */
// roles：菜单可见角色白名单（缺省 = 全角色可见）。总经理默认包含在所有菜单 → 与截图全量菜单一致；
// 切换角色后无权限菜单自动隐藏（A-01 权限裁剪），徽标数值由业务数据派生（见 AppShell）。
const ALL_ROLES = ['boss', 'deputy', 'sales', 'pm', 'finance', 'admin', 'sysadmin'];
export const MENU: { group: string; items: { id: string; label: string; icon: IconName; badgeKey?: 'bid' | 'cert'; roles?: string[] }[] }[] = [
  {
    group: '综合',
    items: [
      { id: 'dashboard', label: '驾驶舱', icon: 'chart', roles: ALL_ROLES },
    ],
  },
  {
    group: '销售管理',
    items: [
      { id: 'customer', label: '客户管理', icon: 'user', roles: ['boss', 'deputy', 'sales', 'pm', 'finance', 'sysadmin'] },
      { id: 'opp', label: '商机管理', icon: 'target', roles: ['boss', 'deputy', 'sales', 'sysadmin'] },
      { id: 'quote', label: '报价台账', icon: 'file', roles: ['boss', 'deputy', 'sales', 'finance', 'sysadmin'] },
      { id: 'bid', label: '投标管理', icon: 'mail', badgeKey: 'bid', roles: ['boss', 'deputy', 'sales', 'admin', 'sysadmin'] },
    ],
  },
  {
    group: '资源管理',
    items: [
      { id: 'cert', label: '证书管理', icon: 'scroll', badgeKey: 'cert', roles: ['boss', 'deputy', 'pm', 'admin', 'sysadmin'] },
      { id: 'doc', label: '文档中心', icon: 'folder', roles: ALL_ROLES },
    ],
  },
  {
    group: '交付管理',
    items: [
      { id: 'contract', label: '合同管理', icon: 'receipt', roles: ['boss', 'deputy', 'sales', 'pm', 'finance', 'sysadmin'] },
      { id: 'project', label: '项目管理', icon: 'building', roles: ['boss', 'deputy', 'pm', 'finance', 'sysadmin'] },
      { id: 'attendance', label: '考勤管理', icon: 'clipboard', roles: ['boss', 'deputy', 'pm', 'finance', 'sysadmin'] },
    ],
  },
  {
    group: '供应链管理',
    items: [
      { id: 'supplier', label: '供应商管理', icon: 'package', roles: ['boss', 'deputy', 'pm', 'finance', 'sysadmin'] },
      { id: 'material', label: '物料与服务', icon: 'package', roles: ['boss', 'deputy', 'pm', 'finance', 'sysadmin'] },
    ],
  },
  {
    group: '财务管理',
    items: [{ id: 'invoice', label: '发票管理', icon: 'coin', roles: ['boss', 'deputy', 'finance', 'sysadmin'] }],
  },
  {
    group: '系统设置',
    items: [
      { id: 'settings', label: '系统设置', icon: 'gear', roles: ALL_ROLES },
    ],
  },
];

/* ============================ 页面注册表（路由 + 页签标题） ============================ */
export const PAGE_META: Record<string, { title: string; group: string }> = {
  dashboard: { title: '驾驶舱', group: '综合' },
  customer: { title: '客户管理', group: '销售管理' },
  opp: { title: '商机管理', group: '销售管理' },
  quote: { title: '报价台账', group: '销售管理' },
  'quote-edit': { title: '报价编辑', group: '销售管理' },
  'quote-detail': { title: '报价详情', group: '销售管理' },
  bid: { title: '投标管理', group: '销售管理' },
  cert: { title: '证书管理', group: '资源管理' },
  doc: { title: '文档中心', group: '资源管理' },
  contract: { title: '合同管理', group: '交付管理' },
  'contract-new': { title: '新建合同', group: '交付管理' },
  'contract-detail': { title: '合同详情', group: '交付管理' },
  project: { title: '项目管理', group: '交付管理' },
  'project-center': { title: '项目经营中心', group: '交付管理' },
  'project-new': { title: '新增项目', group: '交付管理' },
  attendance: { title: '考勤管理', group: '交付管理' },
  approval: { title: '审批中心', group: '交付管理' },
  supplier: { title: '供应商管理', group: '供应链管理' },
  material: { title: '物料与服务', group: '供应链管理' },
  invoice: { title: '发票管理', group: '财务管理' },
  settings: { title: '系统设置', group: '系统设置' },
};

// 侧栏主菜单页（用于判断侧栏高亮）
export const SIDEBAR_PAGES = Object.keys(PAGE_META).filter(
  (k) => !k.includes('-edit') && !k.includes('-detail') && !k.includes('-new') && !k.includes('-center') && k !== 'approval',
);
// 把子页归属到主菜单，用于侧栏高亮
export const PAGE_PARENT: Record<string, string> = {
  'quote-edit': 'quote', 'quote-detail': 'quote',
  'contract-new': 'contract', 'contract-detail': 'contract',
  'project-center': 'project', 'project-new': 'project',
  approval: 'project',
};

/* ============================ 客户（KH + 6 位流水） ============================ */
export const CUSTOMERS = [
  { id: 'KH20260312001', name: '昆明万达广场商业管理有限公司', grade: 'A', status: '成交', industry: '商业综合体', region: '昆明', source: '自主开发', owner: '蓝峰', contact: '王志豪', phone: '138****1101', fullPhone: '13888001101', lastFollow: '2026-09-18', lastFollowDays: 2, dealAmt: 12800000, recv: 1560000, since: '2024-03', note: '决策链：区域总 → 工程部 → 招采' },
  { id: 'KH20260312002', name: '云南师范大学附属中学', grade: 'A', status: '成交', industry: '教育', region: '昆明', source: '老客户转介绍', owner: '李思敏', contact: '李教授', phone: '138****2203', fullPhone: '13888002203', lastFollow: '2026-09-17', lastFollowDays: 3, dealAmt: 8600000, recv: 430000, since: '2023-09', note: '寒暑假施工窗口，工期敏感' },
  { id: 'KH20260418003', name: '昆明市第一人民医院', grade: 'A', status: '成交', industry: '医疗', region: '昆明', source: '政府平台招标', owner: '王志海', contact: '张教授', phone: '137****3105', fullPhone: '13788003105', lastFollow: '2026-09-16', lastFollowDays: 4, dealAmt: 9600000, recv: 2800000, since: '2024-06', note: '院感要求高，施工需夜间作业' },
  { id: 'KH20250902004', name: '楚雄州人民医院', grade: 'A', status: '成交', industry: '医疗', region: '楚雄', source: '属地排查', owner: '赵薇', contact: '刘国栋', phone: '136****4402', fullPhone: '13688004402', lastFollow: '2026-09-12', lastFollowDays: 8, dealAmt: 7800000, recv: 920000, since: '2023-11', note: '州级集采入库供应商' },
  { id: 'KH20260506005', name: '文山三七产业园管委会', grade: 'B', status: '意向', industry: '园区/政府平台', region: '文山', source: '招投标平台', owner: '刘宇', contact: '陈主任', phone: '138****5506', fullPhone: '13888005506', lastFollow: '2026-09-08', lastFollowDays: 12, dealAmt: 3200000, recv: 0, since: '2026-05', note: '园区二期规划中，2027 年立项' },
  { id: 'KH20260620006', name: '广西柳州钢铁集团有限公司', grade: 'B', status: '成交', industry: '电力/制造', region: '广西', source: '同行引荐', owner: '赵薇', contact: '徐志强', phone: '187****6606', fullPhone: '18788006606', lastFollow: '2026-09-14', lastFollowDays: 6, dealAmt: 5600000, recv: 1400000, since: '2026-06', note: '省外首个大单，跨区域服务能力验证' },
  { id: 'KH20260115007', name: '昆明长水国际机场后勤保障部', grade: 'B', status: '成交', industry: '交通枢纽', region: '昆明', source: '老客户转介绍', owner: '蓝峰', contact: '孙飞', phone: '138****7707', fullPhone: '13888007707', lastFollow: '2026-09-15', lastFollowDays: 5, dealAmt: 4200000, recv: 2100000, since: '2026-01', note: '不停航施工，仅夜间作业窗口 4 小时' },
  { id: 'KH20260728008', name: '曲靖万达广场商业管理有限公司', grade: 'B', status: '意向', industry: '商业综合体', region: '曲靖', source: '招投标平台', owner: '李慧敏', contact: '周总', phone: '137****8804', fullPhone: '13788008804', lastFollow: '2026-09-01', lastFollowDays: 19, dealAmt: 2600000, recv: 0, since: '2026-07', note: '与昆明万达同体系，可复用交付标准' },
  { id: 'KH20250823009', name: '昆明滇池国家旅游度假区', grade: 'B', status: '成交', industry: '文旅', region: '昆明', source: '政府平台招标', owner: '刘宇', contact: '吴锦锦', phone: '138****9909', fullPhone: '13888009909', lastFollow: '2026-06-20', lastFollowDays: 92, dealAmt: 1800000, recv: 0, since: '2023-08', note: '已结项，2027 年有续保机会' },
  { id: 'KH20260928010', name: '云南建工集团有限公司', grade: 'C', status: '潜在', industry: '地产', region: '昆明', source: '自主开发', owner: '李慧敏', contact: '赵总', phone: '138****1010', fullPhone: '13888001010', lastFollow: '2026-09-10', lastFollowDays: 10, dealAmt: 0, recv: 0, since: '2026-08', note: '总包分包合作，需先建立信任' },
  { id: 'KH20260511011', name: '大理古城文旅运营管理有限公司', grade: 'C', status: '潜在', industry: '文旅', region: '大理', source: '行业展会', owner: '李思敏', contact: '杨总', phone: '139****1121', fullPhone: '13988001121', lastFollow: '2026-08-12', lastFollowDays: 39, dealAmt: 0, recv: 0, since: '2026-05', note: '古建消防特殊要求，防火与风貌平衡' },
  { id: 'KH20260330012', name: '普洱云岭茶业有限公司', grade: 'C', status: '潜在', industry: '其他', region: '普洱', source: '属地排查', owner: '刘宇', contact: '岩温', phone: '139****1222', fullPhone: '13988001222', lastFollow: '2026-09-05', lastFollowDays: 15, dealAmt: 0, recv: 0, since: '2026-03', note: '厂区消防基础薄弱，改造意愿强' },
  { id: 'KH20260710013', name: '云南××磷化工有限公司', grade: 'B', status: '成交', industry: '化工', region: '安宁', source: '属地排查', owner: '赵薇', contact: '李安环', phone: '138****4418', fullPhone: '13888004418', lastFollow: '2026-09-16', lastFollowDays: 5, dealAmt: 1280000, recv: 384000, since: '2026-07', note: '危化区域动火审批严格，检测需配合停产窗口' },
];

/* ============================ 商机（SJ + 6 位） ============================ */
/* 状态机（4 档收敛口径 · 2026-09-23 业务拍板）：意向 10% → 方案报价 50%（预计金额开始必填）→ 投标 70%（按单启用）→ 签约 100%。
   终态不占阶段枚举：由 status（跟进中 / 赢单 / 输单）承载，stage 冻结在终态发生时所处阶段 —— 保留 6.0 的正交改进。
   阶段权重：意向 10% / 方案报价 50%（gate）/ 投标 70%（按单启用）/ 签约 100%；
   加权预测金额 = 金额 × 当前阶段权重，供驾驶舱漏斗预测。
   ⚠️ 本口径与《SaaS 消防经营平台 · 研发级功能规格》的七阶段为「主动分歧」，不是实现回退 ——
      七阶段的「线索」会吞并独立线索池（入池上限 / 15 天公海 / 查重体系）、「投标」会吞并独立投标模块，
      故收敛为 4 档过程阶段。此处「投标」仅是商机进度标记，投标单据仍归 BidPage 管理（BIDS[].opp 关联），不重复建单。
   阶段模板（阶段枚举后台可维护）：默认见 OPP_STAGE_TPL；
   运行期以 store 的租户模板为准（系统设置 · 业务字典 · 商机阶段），可增删 / 排序 / 改权重。
   gate 标记 = 「进入该阶段起预计金额必填」（金额是漏斗加权预测的输入，缺则预测失真）。
   转化不受阶段限制：赢单后可一键转报价（带客户）或转合同草稿，转化由赢单动作触发，不做阶段前置校验。 */
export type OppStageTpl = { name: string; weight: number; gate?: boolean; requireBid?: boolean };
/** 默认阶段模板（4 档）；后台可调，读写走 store.getOppStages()
 *  requireBid = true：该阶段「按单启用」，商机须已存在关联投标单（BIDS[].opp）方可推进到此档。 */
export const OPP_STAGE_TPL: OppStageTpl[] = [
  { name: '意向', weight: 10 },
  { name: '方案报价', weight: 50, gate: true },
  { name: '投标', weight: 70, requireBid: true },
  { name: '签约', weight: 100 },
];
export const OPP_STAGES: string[] = OPP_STAGE_TPL.map((s) => s.name);
/** 默认阶段权重（按阶段名）；运行期口径以 store 模板为准 */
export const OPP_STAGE_PROB: Record<string, number> = Object.fromEntries(OPP_STAGE_TPL.map((s) => [s.name, s.weight]));
/** 阶段胶囊配色按序号派生 —— 阶段可配置，不能按阶段名硬编码；自定义阶段超出模板长度时回落蓝色 */
export const OPP_STAGE_TONES: ('gray' | 'orange' | 'blue' | 'purple' | 'green' | 'red')[] = ['gray', 'orange', 'blue', 'purple'];
export const oppStageTone = (i: number): 'gray' | 'orange' | 'blue' | 'purple' | 'green' | 'red' => OPP_STAGE_TONES[i] ?? 'blue';
/** 默认 gate 序号（金额必填分界线）；运行期用 store.getOppGateIdx() */
export const OPP_GATE_IDX = OPP_STAGE_TPL.findIndex((s) => s.gate);
/** 商机状态：跟进中为活跃；赢单 / 输单为终态 */
export const OPP_STATUS = ['跟进中', '赢单', '输单'] as const;
/** 输单原因枚举（输单必填） */
export const LOSE_REASONS = ['价格', '关系', '资质', '其他'] as const;
/** 是否已关闭（终态）：终态不可再推进阶段，也不再计入漏斗与加权预测 */
export const isOppClosed = (o: { status: string }) => o.status !== '跟进中';
/* 种子数据口径（收敛后必须自洽）：
   ① stage 只取 OPP_STAGE_TPL 的过程阶段；赢单 / 输单 的 stage 冻结在终态发生时所处阶段；
   ② 约定「quotes > 0 ⟹ stage 序号 ≥ gate 序号」：报价由勘察生成，而「生成报价」按钮按阶段 ≥ 方案报价显隐，
      故未过 gate 的商机不应带报价单 —— 种子按此约定重排（SJ000461 / SJ000475 已有报价，故置入「方案报价」档），
      同时让「勘察记录 Tab」的派生口径与报价存在性一致；
   ③ 投标只作进度标记：关联投标数由 BIDS[].opp 派生（见 store.getOppBids），投标单据本身归 BidPage 管理。
      一致性：商机阶段不应落后于其关联投标 —— SJ000512 关联 TB000041（已到「开标」），故置入「投标」档。
   ④ 金额待定样本：SJ000501 置于「意向」（未过 gate）且 amt = 0，用于演示未过闸口时的「待定」渲染；
      amt 是闸口下限而非上限，故未过 gate 的行也可以填金额（如 SJ000490）。 */
export const OPPS = [
  { id: 'SJ000456', name: '昆明万达广场消防设施改造工程', customer: '昆明万达广场商业管理有限公司', customerId: 'KH20260312001', stage: '签约', status: '跟进中', amt: 3200000, owner: '蓝峰', type: '改造', biz: 'GC', last: '2026-09-18', lastDays: 2, quotes: 3, signDate: '2026-10-15', industry: '商业综合体' },
  { id: 'SJ000461', name: '云南师大附中消防系统升级（2027 年度）', customer: '云南师范大学附属中学', customerId: 'KH20260312002', stage: '方案报价', status: '跟进中', amt: 2100000, owner: '李思敏', type: '改造', biz: 'GC', last: '2026-09-15', lastDays: 5, quotes: 1, signDate: '2026-11-30', industry: '教育' },
  { id: 'SJ000462', name: '昆明万达广场消防改造（二标段）', customer: '昆明万达广场商业管理有限公司', customerId: 'KH20260312001', stage: '签约', status: '跟进中', amt: 1800000, owner: '蓝峰', type: '改造', biz: 'GC', last: '2026-09-19', lastDays: 1, quotes: 1, signDate: '2026-12-10', industry: '商业综合体' },
  { id: 'SJ000470', name: '昆明市第一人民医院住院楼消防升级', customer: '昆明市第一人民医院', customerId: 'KH20260418003', stage: '签约', status: '赢单', amt: 4800000, owner: '王志海', type: '改造', biz: 'GC', last: '2026-09-19', lastDays: 1, quotes: 4, signDate: '2026-06-30', industry: '医疗' },
  { id: 'SJ000475', name: '文山三七产业园智慧消防平台', customer: '文山三七产业园管委会', customerId: 'KH20260506005', stage: '方案报价', status: '跟进中', amt: 1200000, owner: '刘宇', type: '新建', biz: 'RJ', last: '2026-09-06', lastDays: 14, quotes: 1, signDate: '', industry: '园区/政府平台' },
  { id: 'SJ000478', name: '曲靖万达广场消防维护保养（2027 年度）', customer: '曲靖万达广场商业管理有限公司', customerId: 'KH20260728008', stage: '方案报价', status: '跟进中', amt: 680000, owner: '李慧敏', type: '维护保养', biz: 'WB', last: '2026-09-10', lastDays: 10, quotes: 2, signDate: '2026-10-01', industry: '商业综合体' },
  { id: 'SJ000482', name: '柳州钢铁厂区消防管网改造', customer: '广西柳州钢铁集团有限公司', customerId: 'KH20260620006', stage: '签约', status: '赢单', amt: 5600000, owner: '赵薇', type: '改造', biz: 'GC', last: '2026-09-14', lastDays: 6, quotes: 5, signDate: '2026-07-31', industry: '电力/制造' },
  { id: 'SJ000490', name: '长水机场航站楼消防设施检测', customer: '昆明长水国际机场后勤保障部', customerId: 'KH20260115007', stage: '方案报价', status: '跟进中', amt: 420000, owner: '蓝峰', type: '检测', biz: 'JC', last: '2026-09-15', lastDays: 5, quotes: 0, signDate: '2026-11-15', industry: '交通枢纽' },
  { id: 'SJ000495', name: '楚雄州人民医院消防维护保养续签', customer: '楚雄州人民医院', customerId: 'KH20250902004', stage: '投标', status: '跟进中', amt: 960000, owner: '赵薇', type: '维护保养', biz: 'WB', last: '2026-09-12', lastDays: 8, quotes: 2, signDate: '2026-10-20', industry: '医疗' },
  { id: 'SJ000501', name: '云南建工智慧展厅消防安装', customer: '云南建工集团有限公司', customerId: 'KH20260928010', stage: '意向', status: '跟进中', amt: 0, owner: '李慧敏', type: '新建', biz: 'GC', last: '2026-09-08', lastDays: 12, quotes: 0, signDate: '', industry: '地产' },
  { id: 'SJ000503', name: '大理古城客栈群消防改造', customer: '大理古城文旅运营管理有限公司', customerId: 'KH20260511011', stage: '投标', status: '输单', loseReason: '其他', loseCompetitor: '本地××消防工程公司', amt: 1200000, owner: '李思敏', type: '改造', biz: 'GC', last: '2026-08-12', lastDays: 39, quotes: 1, signDate: '', industry: '文旅' },
  { id: 'SJ000508', name: '普洱茶厂消防设施维护保养', customer: '普洱云岭茶业有限公司', customerId: 'KH20260330012', stage: '签约', status: '输单', loseReason: '价格', loseCompetitor: '普洱××消防服务商', amt: 380000, owner: '刘宇', type: '维护保养', biz: 'WB', last: '2026-07-28', lastDays: 54, quotes: 1, signDate: '', industry: '其他' },
  { id: 'SJ000512', name: '云南××中学消防改造', customer: '××市教育局', stage: '投标', status: '跟进中', amt: 860000, owner: '李强', type: '改造', biz: 'GC', last: '2026-09-20', lastDays: 2, quotes: 0, signDate: '', industry: '教育' },
];

/* ============================ 报价（BJ + 6 位流水，5 状态机） ============================ */
// 状态机：草稿 → 待审批 → 已审批 → 已转化；旁支：作废（终态，可复制新版本）
export const QUOTE_STATUS = ['草稿', '待审批', '已审批', '已转化', '作废'] as const;
export const QUOTES = [
  { id: 'BJ000011', ver: 'V2', customer: '昆明市第一人民医院', customerId: 'KH20260418003', opp: 'SJ000470', name: '昆明市第一人民医院住院楼消防升级报价', total: 4800000, taxRate: 9, taxMode: '含税', status: '待审批', owner: '王志海', date: '2026-09-12', update: '2026-09-20', approveLevel: '总经理', markup: 22, region: '昆明', uplift: 0, items: 7, base: '医院', costSqm: 386, bidId: 'TB000045',
    lines: [
      { matId: 'CL000123', name: '镀锌钢管', spec: 'DN100', unit: '米', qty: 8000, price: 85 },
      { matId: 'CL000145', name: '喷淋头（上喷）', spec: '68℃ / DN15', unit: '个', qty: 2000, price: 28 },
      { matId: 'EQ000002', name: '感烟探测器', spec: 'JTY-GM-GST101', unit: '只', qty: 1500, price: 68 },
      { matId: 'EQ000001', name: '火灾报警控制器', spec: 'JB-QB-GST5000', unit: '台', qty: 3, price: 6800 },
      { matId: 'CL000158', name: '消火栓箱', spec: 'SG24A65', unit: '台', qty: 100, price: 460 },
      { matId: 'CL000201', name: '应急照明灯具', spec: 'ZF-JCZ', unit: '套', qty: 600, price: 95 },
      { name: '安装工程费（人工+机械+辅材）', unit: '项', qty: 1, price: 3848900 },
    ] },
  { id: 'BJ000017', ver: 'V1', customer: '文山三七产业园管委会', customerId: 'KH20260506005', opp: 'SJ000475', name: '文山三七产业园智慧消防平台报价', total: 0, taxRate: 9, taxMode: '含税', status: '草稿', owner: '刘宇', date: '2026-09-19', update: '2026-09-19', approveLevel: '—', markup: 0, region: '文山', uplift: 0, items: 8, base: '园区', costSqm: 0 },
  { id: 'BJ000007', ver: 'V3', customer: '昆明万达广场商业管理有限公司', customerId: 'KH20260312001', opp: 'SJ000456', name: '昆明万达广场消防设施改造报价', total: 3200000, taxRate: 9, taxMode: '含税', status: '已转化', owner: '蓝峰', date: '2026-09-08', update: '2026-09-16', approveLevel: '分管副总', markup: 20, region: '昆明', uplift: 0, items: 6, base: '商业综合体', costSqm: 412, bidId: 'TB000038',
    lines: [
      { matId: 'CL000123', name: '镀锌钢管', spec: 'DN100', unit: '米', qty: 5000, price: 85 },
      { matId: 'CL000145', name: '喷淋头（上喷）', spec: '68℃ / DN15', unit: '个', qty: 1200, price: 28 },
      { matId: 'EQ000002', name: '感烟探测器', spec: 'JTY-GM-GST101', unit: '只', qty: 800, price: 68 },
      { matId: 'EQ000001', name: '火灾报警控制器', spec: 'JB-QB-GST5000', unit: '台', qty: 2, price: 6800 },
      { matId: 'CL000158', name: '消火栓箱', spec: 'SG24A65', unit: '台', qty: 60, price: 460 },
      { name: '安装工程费（人工+机械+辅材）', unit: '项', qty: 1, price: 2753200 },
    ] },
  { id: 'BJ000004', ver: 'V1', customer: '楚雄州人民医院', customerId: 'KH20250902004', opp: 'SJ000495', name: '楚雄州人民医院消防维护保养报价（2027 年度）', total: 960000, taxRate: 6, taxMode: '含税', status: '已审批', owner: '赵薇', date: '2026-09-05', update: '2026-09-14', approveLevel: '部门负责人', markup: 25, region: '楚雄', uplift: 0, items: 12, base: '医疗', costSqm: 0 },
  { id: 'BJ000002', ver: 'V1', customer: '云南师大附中', customerId: 'KH20260312002', opp: 'SJ000461', name: '云南师大附中消防系统升级报价', total: 2100000, taxRate: 9, taxMode: '含税', status: '待审批', owner: '李思敏', date: '2026-08-25', update: '2026-09-18', approveLevel: '分管副总', markup: 22, region: '昆明', uplift: 0, items: 29, base: '教育', costSqm: 358 },
  { id: 'BJ000001', ver: 'V2', customer: '柳州钢铁集团', customerId: 'KH20260620006', opp: 'SJ000482', name: '柳州钢铁厂区消防管网改造报价', total: 5600000, taxRate: 9, taxMode: '含税', status: '作废', owner: '赵薇', date: '2026-08-20', update: '2026-09-02', approveLevel: '总经理', markup: 18, region: '广西', uplift: 3, items: 52, base: '电力/制造', costSqm: 296 },
  { id: 'BJ000021', ver: 'V1', customer: '曲靖万达广场商业管理有限公司', customerId: 'KH20260728008', opp: 'SJ000478', name: '曲靖万达广场消防维护保养报价（2027 年度）', total: 680000, taxRate: 6, taxMode: '含税', status: '草稿', owner: '李慧敏', date: '2026-09-21', update: '2026-09-21', approveLevel: '—', markup: 25, region: '曲靖', uplift: 0, items: 9, base: '商业综合体', costSqm: 0 },
];

// 报价 8 目录体系（默认毛利率）
export const QUOTE_CATS = [
  { key: 'firewater', name: '消防水', markup: 20, cats: ['喷淋系统', '消火栓系统', '水泵接合器', '消防水箱'] },
  { key: 'fireelec', name: '消防电', markup: 25, cats: ['火灾自动报警', '消防联动控制', '电气火灾监控', '消防电源监控'] },
  { key: 'smoke', name: '防排烟', markup: 22, cats: ['机械排烟', '机械加压送风', '防火阀', '排烟窗'] },
  { key: 'emergency', name: '应急照明', markup: 18, cats: ['应急照明', '疏散指示', '集中控制型系统'] },
  { key: 'gasext', name: '气体灭火', markup: 18, cats: ['七氟丙烷', 'IG541', '二氧化碳'] },
  { key: 'structure', name: '消防结构', markup: 15, cats: ['防火门', '防火卷帘', '防火玻璃'] },
  { key: 'civil', name: '土建配合', markup: 15, cats: ['管道沟槽', '开孔封堵', '支架制安'] },
  { key: 'service', name: '服务费', markup: 12, cats: ['深化设计', '检测费', '验收辅导', '培训'] },
];

// 单位字典（维护入口在「系统设置 · 主数据配置 · 单位字典」）
// 「年 / 工日 / 盘 / 条」为服务与成卷材料补充的计量单位（原缺失导致维保按「年」计价却不在字典内）
export const UNITS = ['套', '台', '个', '米', '㎡', '项', '批', '次', '系统', '具', '只', '樘', '处', '年', '工日', '盘', '条'];
/** 单位分组（消防行业标准计量口径） */
export const UNIT_GROUPS = [
  { g: '计数', items: ['套', '台', '个', '只', '具', '樘', '处', '项', '批', '次', '系统'] },
  { g: '长度', items: ['米', '条'] },
  { g: '面积', items: ['㎡'] },
  { g: '服务', items: ['年', '工日', '盘'] },
];
/** 单位计量说明 */
export const UNIT_DESC: Record<string, string> = {
  套: '成套设备 / 成套装置（含配件）', 台: '单台设备（泵、阀、风机等）', 个: '通用零件 / 管件',
  只: '探测类点位（感烟 / 感温探测器）', 具: '灭火器 / 消火栓等灭火器具', 樘: '门（防火门专用计量）',
  处: '点位 / 部位（报警回路点、喷头群组）', 项: '一次性服务 / 单项工程', 批: '批量材料（不细分规格）',
  次: '按次计量的服务（检测 / 维护保养巡检）', 系统: '整套系统（报警系统 / 气体灭火系统）',
  米: '管材 / 线缆 / 桥架等长度计量', '㎡': '面积类（涂料 / 防火板等）',
  年: '按年计量的长期服务（维保 / 托管）', 工日: '人工工日 · 工种 × 工日 × 单价（人工费唯一来源）',
  盘: '成卷材料（水带 / 线缆）', 条: '条状材料（水带 / 密封条）',
};

/* ============================ 国标 / 强制性认证标记（维护入口在「系统设置」） ============================ */
export const MARK_TYPES = [
  { k: 'CCCF', n: '消防产品认证证书', desc: '强制性产品认证 · 未取得不得销售使用', tone: 'red' as const },
  { k: '国标', n: '国家标准符合性', desc: 'GB 系列标准 · 用于大型项目投标', tone: 'blue' as const },
  { k: '型式检验', n: '型式检验报告', desc: '产品定型检验 · 有效期 3 年', tone: 'blue' as const },
  { k: '强制', n: '强制性产品目录', desc: '列入目录必须持证 · 无证即不合格', tone: 'red' as const },
];

/* ============================ 业务字典（多页共用枚举，可在「系统设置」维护） ============================ */
/** 供应商供货范围 */
export const SUP_CATS = ['材料', '分包', '劳务', '机械', '检测'];
/** 客户来源 */
export const CUST_SOURCES = ['自主开发', '老客户转介绍', '政府平台招标', '招投标平台', '同行引荐', '属地排查', '行业展会'];
/** 跟进方式（上门拜访须上传带水印照片 · 硬拦截） */
export const FOLLOW_WAYS = ['上门拜访', '电话', '微信/邮件', '会议'];
/** 部门与角色（人员 / 权限基线） */
export const DEPTS = [
  { id: 'sales', n: '商务部', head: '蓝峰', roles: ['销售', '商务合同管理员'] },
  { id: 'pm', n: '工程部', head: '张工', roles: ['项目经理', '施工员'] },
  { id: 'wh', n: '仓储部', head: '张仓', roles: ['仓管员'] },
  { id: 'fin', n: '财务部', head: '陈静', roles: ['会计', '出纳'] },
  { id: 'adm', n: '行政部', head: '王敏', roles: ['行政', '主数据管理员'] },
];

/* ============================ 立项向导字典（项目管理模块改造 第 19–38 条） ============================ */

/** 项目类型固定字典（第 19 条：不允许自由输入，避免同义异名） */
export const PROJ_TYPES = ['新建', '改造', '维护保养', '检测'] as const;

/**
 * 业务来源（第 19 条）：与「项目类型」的区别 ——
 *   项目类型 = 干什么活（新建 / 改造 / 维保 / 检测）；
 *   业务来源 = 这活怎么来的（自签 / 分包 / 合作）。
 */
export const BIZ_SOURCES = ['自签', '分包', '合作'] as const;

/** 部门 → 人员花名册（第 20 条：项目经理按所属部门联动过滤，可切「全部人员」跨部门选择） */
export const DEPT_STAFF: Record<string, { name: string; role: string; phone: string }[]> = {
  sales: [
    { name: '蓝峰', role: '销售', phone: '138****1101' },
    { name: '王志海', role: '商务经理', phone: '139****1102' },
    { name: '赵薇', role: '销售', phone: '137****1103' },
    { name: '陈静', role: '商务合同管理员', phone: '136****1104' },
  ],
  pm: [
    { name: '张工', role: '项目经理', phone: '138****8801' },
    { name: '王工', role: '项目经理', phone: '138****8802' },
    { name: '李工', role: '项目经理', phone: '138****8803' },
    { name: '周斌', role: '项目经理', phone: '138****8805' },
    { name: '陈工', role: '施工员', phone: '138****8804' },
    { name: '刘宇', role: '施工员', phone: '138****8806' },
  ],
  wh: [{ name: '张仓', role: '仓管员', phone: '138****9901' }],
  fin: [
    { name: '陈静', role: '会计', phone: '137****3303' },
    { name: '李思敏', role: '出纳', phone: '137****3304' },
  ],
  adm: [
    { name: '王敏', role: '行政', phone: '136****7701' },
    { name: '王芳', role: '主数据管理员', phone: '136****7702' },
  ],
};

/** 项目地址省市区三级字典（第 23 条：地址改为三级联动 + 详细地址） */
export const REGION_TREE: { p: string; cities: { c: string; ds: string[] }[] }[] = [
  {
    p: '云南省',
    cities: [
      { c: '昆明市', ds: ['五华区', '盘龙区', '官渡区', '西山区', '呈贡区', '安宁市'] },
      { c: '曲靖市', ds: ['麒麟区', '沾益区', '马龙区', '宣威市'] },
      { c: '楚雄州', ds: ['楚雄市', '禄丰市', '南华县'] },
      { c: '文山州', ds: ['文山市', '砚山县'] },
      { c: '大理州', ds: ['大理市', '祥云县'] },
      { c: '普洱市', ds: ['思茅区', '宁洱县'] },
      { c: '丽江市', ds: ['古城区', '玉龙县'] },
    ],
  },
  {
    p: '广西壮族自治区',
    cities: [
      { c: '柳州市', ds: ['城中区', '鱼峰区', '柳北区', '柳南区'] },
      { c: '南宁市', ds: ['青秀区', '西青区', '江南区'] },
    ],
  },
];

/** 预算科目字典（第 31 条：预置消防行业分项 + 支持自定义添加） */
export const BUDGET_CATS = [
  '火灾自动报警系统', '消火栓系统', '自动喷淋系统', '气体灭火系统', '防排烟系统',
  '应急照明与疏散', '灭火器', '维护保养巡检', '消防设施检测', '应急维修', '备件更换', '其他',
];

/** 预算科目模板（第 37 条：一键套用，占比合计 100%） */
export const BUDGET_TPL: { key: string; n: string; items: { cat: string; r: number }[] }[] = [
  {
    key: 'install', n: '消防安装类',
    items: [
      { cat: '火灾自动报警系统', r: 26 }, { cat: '消火栓系统', r: 16 }, { cat: '自动喷淋系统', r: 20 },
      { cat: '防排烟系统', r: 12 }, { cat: '应急照明与疏散', r: 9 }, { cat: '灭火器', r: 2 }, { cat: '其他', r: 15 },
    ],
  },
  {
    key: 'retrofit', n: '消防改造类',
    items: [
      { cat: '火灾自动报警系统', r: 22 }, { cat: '消火栓系统', r: 14 }, { cat: '自动喷淋系统', r: 18 },
      { cat: '气体灭火系统', r: 10 }, { cat: '防排烟系统', r: 12 }, { cat: '应急照明与疏散', r: 8 },
      { cat: '灭火器', r: 3 }, { cat: '其他', r: 13 },
    ],
  },
  {
    key: 'maintain', n: '维保类',
    items: [
      { cat: '维护保养巡检', r: 46 }, { cat: '消防设施检测', r: 20 }, { cat: '应急维修', r: 14 },
      { cat: '备件更换', r: 12 }, { cat: '其他', r: 8 },
    ],
  },
];

/* ============================ 投标（TB + 6 位，7 阶段） ============================ */
/* 状态机（规格 §4.2）：
   报名 → 购买文件 → 做标书 → 开标 ─┬─ 中标 → 转合同 / 项目（保证金转履约或退还 · 证书占用改归属）
                                    └─ 未中标（含流标 / 废标，登记 resultType）→ 退保证金 → 归档
   任意阶段 ─放弃（原因必填）→ 已放弃〔终态〕：已交保证金转「未退」进风险榜 · 证书占用立即释放。
   保证金独立流转（depositSt：未交 / 已交 / 未退 / 已退），不占用阶段枚举。 */
export const BID_STAGES = ['报名', '购买文件', '做标书', '开标', '中标', '未中标', '已放弃'] as const;
/** 终态：不可再推进 */
export const BID_TERMINAL = ['中标', '未中标', '已放弃'] as const;
export const isBidClosed = (b: { stage: string }) => (BID_TERMINAL as readonly string[]).includes(b.stage);
/** 未中标登记时必填的结果口径（供报表，不增加状态） */
export const BID_RESULT_TYPES = ['未中标', '流标', '废标'] as const;
/** 放弃原因枚举（放弃必填） */
export const BID_ABANDON_REASONS = ['资质不满足', '成本倒挂', '客户变更需求', '招标条件不利', '其他'] as const;
/** 投标单实体。stage 仅承载在途 / 终态阶段；resultType 仅在未中标时登记（供报表口径）。 */
export type Bid = {
  id: string; name: string; customer: string; customerId?: string;
  stage: string;
  /** 未中标时的结果口径：未中标 / 流标 / 废标 */
  resultType?: string;
  /** 未中标原因（未中标登记必填） */
  loseReason?: string;
  /** 未中标 / 流标 / 废标的情况说明（未中标登记必填，≤200 字） */
  loseText?: string;
  /** 放弃原因（放弃必填） */
  abandonReason?: string;
  amt: number; deposit: number; depositSt: string; openDate: string;
  owner: string; certNeed: number; certGot: number;
  projMgr: string; pmB: string; pmBusy: boolean; risk: string; opp?: string;
  /** 关联报价单ID（报价→投标外键） */
  quoteId?: string;
};
export const BIDS: Bid[] = [
  { id: 'TB000041', name: '云南××中学消防改造', customer: '××市教育局', stage: '开标', amt: 860000, deposit: 50000, depositSt: '已交', openDate: '2026-09-25', owner: '李强', certNeed: 3, certGot: 3, projMgr: '张工', pmB: '有效', pmBusy: false, risk: '', opp: 'SJ000512' },
  { id: 'TB000038', name: '昆明万达广场消防改造', customer: '昆明万达广场商业管理有限公司', customerId: 'KH20260312001', stage: '做标书', amt: 3200000, deposit: 100000, depositSt: '已交', openDate: '2026-09-22', owner: '蓝峰', certNeed: 4, certGot: 4, projMgr: '张工', pmB: '有效', pmBusy: false, risk: '安许 60 天内到期', opp: 'SJ000462', quoteId: 'BJ000007' },
  { id: 'TB000045', name: '昆明市第一人民医院住院楼升级', customer: '昆明市第一人民医院', customerId: 'KH20260418003', stage: '开标', amt: 4800000, deposit: 150000, depositSt: '已交', openDate: '2026-09-28', owner: '王志海', certNeed: 3, certGot: 3, projMgr: '王工', pmB: '有效', pmBusy: false, risk: '', opp: 'SJ000470', quoteId: 'BJ000011' },
  { id: 'TB000052', name: '楚雄州人民医院维护保养续投', customer: '楚雄州人民医院', customerId: 'KH20250902004', stage: '做标书', amt: 960000, deposit: 60000, depositSt: '已交', openDate: '2026-10-08', owner: '赵薇', certNeed: 2, certGot: 2, projMgr: '李工', pmB: '有效', pmBusy: false, risk: '', opp: 'SJ000495', quoteId: 'BJ000004' },
  { id: 'TB000056', name: '柳州钢铁管网改造二标段', customer: '广西柳州钢铁集团有限公司', customerId: 'KH20260620006', stage: '报名', amt: 2600000, deposit: 80000, depositSt: '未交', openDate: '2026-10-15', owner: '赵薇', certNeed: 4, certGot: 2, projMgr: '张工', pmB: '有效', pmBusy: false, risk: '证书缺口 2 本' },
  { id: 'TB000058', name: '长水机场消防设施检测服务', customer: '昆明长水国际机场后勤保障部', customerId: 'KH20260115007', stage: '购买文件', amt: 420000, deposit: 20000, depositSt: '未交', openDate: '2026-10-22', owner: '蓝峰', certNeed: 2, certGot: 2, projMgr: '陈工', pmB: '30 天内到期', pmBusy: false, risk: 'B 证 30 天内到期' },
  { id: 'TB000037', name: '××酒店消防设施改造', customer: '××酒店管理公司', stage: '未中标', resultType: '未中标', loseReason: '报价高于对手', amt: 1500000, deposit: 50000, depositSt: '未退', openDate: '2026-08-20', owner: '周斌', certNeed: 3, certGot: 3, projMgr: '张工', pmB: '有效', pmBusy: false, risk: '保证金未退 · 已 31 天' },
  { id: 'TB000028', name: '产业园一期消防工程', customer: '××工业园区开发有限公司', stage: '中标', amt: 2600000, deposit: 80000, depositSt: '已退', openDate: '2026-07-30', owner: '周斌', certNeed: 5, certGot: 5, projMgr: '张工', pmB: '有效', pmBusy: false, risk: '' },
  { id: 'TB000049', name: '××园区管廊消防工程', customer: '××工业园区开发有限公司', stage: '已放弃', abandonReason: '资质不满足', amt: 1900000, deposit: 60000, depositSt: '未退', openDate: '2026-09-30', owner: '周斌', certNeed: 4, certGot: 2, projMgr: '张工', pmB: '有效', pmBusy: false, risk: '已放弃 · 保证金未退 · 证书已释放' },
];

/* ============================ 证书（ZS + 6 位，三分法） ============================ */
// 占用方式：一证一项目 single / 多项目引用 multi / 按次登记 log
export const CERTS = [
  { id: 'ZS000015', name: '一级注册消防工程师', type: '人员证书', subType: '注册消防工程师', holder: '张工', holderId: 'EMP001', mode: 'single', validTo: '2026-10-20', warnDays: 30, cap: 1, used: ['XM000123'], status: '30 天内到期', issue: '云南省消防救援总队' },
  { id: 'ZS000018', name: '一级注册消防工程师', type: '人员证书', subType: '注册消防工程师', holder: '王工', holderId: 'EMP002', mode: 'single', validTo: '2027-06-30', warnDays: 0, cap: 1, used: ['XM000118'], status: '正常', issue: '云南省消防救援总队' },
  { id: 'ZS000022', name: '建构筑物消防员（中级）', type: '人员证书', subType: '建构筑物消防员', holder: '李工', holderId: 'EMP003', mode: 'log', validTo: '2027-03-15', warnDays: 0, cap: 2, used: ['XM000123', 'XM000118'], status: '正常', issue: '应急管理部' },
  { id: 'ZS000031', name: '消防设施维护保养检测资质（二级）', type: '企业资质', subType: '维护保养资质', holder: '诺盾博达消防科技有限公司', holderId: 'COMPANY', mode: 'multi', validTo: '2027-01-31', warnDays: 0, cap: 99, used: ['XM000123', 'XM000118', 'XM000105'], status: '正常', issue: '云南省住建厅' },
  { id: 'ZS000035', name: '消防设施工程专业承包（二级）', type: '企业资质', subType: '施工资质', holder: '诺盾博达消防科技有限公司', holderId: 'COMPANY', mode: 'multi', validTo: '2026-11-05', warnDays: 60, cap: 99, used: ['XM000123', 'XM000105', 'XM000098', 'XM000087'], status: '60 天内到期', issue: '云南省住建厅' },
  { id: 'ZS000008', name: '电工操作证', type: '人员证书', subType: '电工', holder: '陈工', holderId: 'EMP005', mode: 'log', validTo: '2025-12-20', warnDays: 0, cap: 2, used: [], status: '已过期', issue: '应急管理部' },
  { id: 'ZS000041', name: '消防设施工程设计资质（乙级）', type: '企业资质', subType: '设计资质', holder: '诺盾博达消防科技有限公司', holderId: 'COMPANY', mode: 'multi', validTo: '2027-04-20', warnDays: 0, cap: 99, used: ['XM000105'], status: '正常', issue: '云南省住建厅' },
  { id: 'ZS000028', name: '焊工操作证', type: '人员证书', subType: '焊工', holder: '孙工', holderId: 'EMP006', mode: 'log', validTo: '2026-12-28', warnDays: 0, cap: 2, used: ['XM000123'], status: '正常', issue: '应急管理部' },
  { id: 'ZS000044', name: '安全生产许可证', type: '企业资质', subType: '安许', holder: '诺盾博达消防科技有限公司', holderId: 'COMPANY', mode: 'multi', validTo: '2026-09-10', warnDays: 60, cap: 99, used: ['XM000123', 'XM000118', 'XM000105', 'XM000098', 'XM000087'], status: '已过期', issue: '云南省住建厅', level: 'company-red' },
  { id: 'ZS000050', name: '注册建造师（机电工程 · 一级）', type: '人员证书', subType: '建造师', holder: '张工', holderId: 'EMP001', mode: 'single', validTo: '2027-08-31', warnDays: 0, cap: 1, used: ['XM000123'], status: '正常', issue: '住建部', isBuilder: true, hasB: true, bValidTo: '2027-05-31' },
  { id: 'ZS000051', name: '注册建造师（机电工程 · 二级）', type: '人员证书', subType: '建造师', holder: '王工', holderId: 'EMP002', mode: 'single', validTo: '2026-12-15', warnDays: 0, cap: 1, used: [], status: '正常', issue: '住建部', isBuilder: true, hasB: true, bValidTo: '2027-06-30' },
  { id: 'ZS000055', name: 'B 类安全生产考核合格证', type: '人员证书', subType: 'B证', holder: '陈工', holderId: 'EMP005', mode: 'log', validTo: '2026-10-15', warnDays: 30, cap: 1, used: [], status: '30 天内到期', issue: '云南省住建厅', followBuilder: true },
];

/* ============================ 合同（HT 销售 / CG 采购 / FK 框架 / WB 维护保养） ============================ */
export const CONTRACT_TYPES = ['销售合同', '采购合同', '框架协议', '维护保养合同'] as const;
/**
 * 合同状态机（唯一事实源 · 对齐《研发级功能规格》§5.2 · 2026-09-22 收敛为 6 态）
 *   草稿 ─提交→ 待审批 ─通过 + 电子签完成→ 已签约 ─首笔款 / 进场→ 履约中 ─到期续签→ 已续签〔生成新合同〕
 *   　　　　　└驳回→草稿　　　　　　　　　　　　　　　　　　　　└ 中止 / 解除 / 正常结束 → 已终止
 * 说明：
 *   ①「中止 / 解除 / 正常结束」是**动作**不是状态，落态统一为「已终止」，用 terminateType 区分（文档口径）。
 *   ②原自造态「已审批 / 结算中 / 已结项 / 已中止 / 已解除」按文档删除 —— 结算与结项是**单据 / 项目**的里程碑，
 *     不占合同状态枚举；历史数据经 normContractStatus() / normTerminateType() 归一化。
 *   ③「审批中」回退为文档口径「待审批」；原「已审批」表示已批待签，同属签约前阶段，一并归入「待审批」。
 *   ④读写一律走 normContractStatus()，筛选 / 步骤条 / 状态列同源，不会漏判。
 */
export const CONTRACT_STATUS = ['草稿', '待审批', '已签约', '履约中', '已续签', '已终止'] as const;
/** 终态：不可再推进 */
export const CONTRACT_TERMINAL = ['已续签', '已终止'] as const;
export const isContractClosed = (c: { status: string }) =>
  (CONTRACT_TERMINAL as readonly string[]).includes(normContractStatus(c.status));
/** 终止方式（status = 已终止 时填写）。「正常结束」为文档未定义出口的业务补位。 */
export const CONTRACT_TERMINATE_TYPES = ['中止', '解除', '正常结束'] as const;
/** 状态语义色（列表标签 / 详情大标签 / 驾驶舱共用） */
export const CONTRACT_STATUS_TONE: Record<string, 'gray' | 'blue' | 'green' | 'red' | 'orange' | 'purple'> = {
  草稿: 'gray', 待审批: 'orange', 已签约: 'green', 履约中: 'blue', 已续签: 'purple', 已终止: 'red',
};
/** 合同状态归一化：历史别名 → 规范态（未知原样返回） */
export const CONTRACT_STATUS_ALIAS: Record<string, string> = {
  审批中: '待审批', 已审批: '待审批', 结算中: '履约中',
  已结项: '已终止', 已中止: '已终止', 已解除: '已终止',
};
export function normContractStatus(s: string): string {
  return CONTRACT_STATUS_ALIAS[s] ?? s;
}
/** 历史终止类状态 → 终止方式 */
export const CONTRACT_TERMINATE_ALIAS: Record<string, string> = {
  已结项: '正常结束', 已中止: '中止', 已解除: '解除',
};
export function normTerminateType(s: string): string {
  return CONTRACT_TERMINATE_ALIAS[s] ?? s;
}
/**
 * 合同台账行类型：renewedTo = 续签指向的新合同编号；sub = 框架子合同
 * contractRole（合同四分类，§9）：primary 主合同 / supplement_price 价格调整补充（挂主合同下）/
 *   supplement_service 新增服务补充（独立）/ maintenance 维保（独立）。parentId 为价格调整补充挂载的主合同号。
 */
export type Contract = {
  id: string; name: string; type: string; party: string; project: string;
  amt: number; execAmt: number; status: string; recvPct: number; recv: number;
  owner: string; sign: string; start: string; end: string; nodes: string;
  overdue: boolean; overpay: boolean; renewedTo?: string; sub?: boolean;
  contractRole?: 'primary' | 'supplement_price' | 'supplement_service' | 'maintenance';
  parentId?: string;
  /** 终止方式（status = 已终止 时填写）：中止 / 解除 / 正常结束 */
  terminateType?: string;
  /** 电子签状态（规格 §5.1）：未发起 / 签署中 / 已签 / 已撤回；未登记视为未发起 */
  signStatus?: string;
  /** 中标通知/投标单ID（投标→合同外键） */
  bidId?: string;
};
export const CONTRACTS: Contract[] = [
  /* XM000123 主合同：合同额冻结为签约价 180 万（立项锚点）；执行额 195 万 = 180 + 已生效价格调整补充 +15 万。
     recv=银行已到账 54 万；已开票未到账 33.75 万挂应收账龄（见 RECEIVABLES），不计入 recv。 */
  { id: 'HT000009', name: '昆明万达广场消防改造工程合同', type: '销售合同', party: '昆明万达广场商业管理有限公司', project: 'XM000123', amt: 1800000, execAmt: 1950000, status: '履约中', signStatus: '已签', contractRole: 'primary', recvPct: 27.7, recv: 540000, owner: '蓝峰', sign: '2026-09-12', start: '2026-09-20', end: '2027-03-31', nodes: '预付 30% · 进度 40% · 竣工 25% · 质保 5%', overdue: false, overpay: false, bidId: 'TB000038' },
  /* 价格调整类补充协议：挂 HT000009 下，amt 存增量 +15 万；已签署 → 联动 BG0001 生效并刷新 execAmt */
  { id: 'HT000009S1', name: '昆明万达广场消防改造工程价格调整补充协议', type: '销售合同', party: '昆明万达广场商业管理有限公司', project: 'XM000123', amt: 150000, execAmt: 150000, status: '已签约', signStatus: '已签', contractRole: 'supplement_price', parentId: 'HT000009', recvPct: 0, recv: 0, owner: '蓝峰', sign: '2026-09-18', start: '2026-09-18', end: '2027-03-31', nodes: '随主合同执行', overdue: false, overpay: false },
  /* 新增服务类补充协议：独立成行 8 万 */
  { id: 'HT000009S2', name: '昆明万达广场消防改造工程新增服务补充协议（联动调试培训）', type: '销售合同', party: '昆明万达广场商业管理有限公司', project: 'XM000123', amt: 80000, execAmt: 80000, status: '已签约', signStatus: '已签', contractRole: 'supplement_service', recvPct: 0, recv: 0, owner: '蓝峰', sign: '2026-09-20', start: '2027-01-01', end: '2027-03-31', nodes: '完工验收后一次性', overdue: false, overpay: false },
  /* 维保合同：独立成行 12 万（签约在改造验收之后） */
  { id: 'WB000123', name: '昆明万达广场消防改造工程维保合同（验收后一年）', type: '维护保养合同', party: '昆明万达广场商业管理有限公司', project: 'XM000123', amt: 120000, execAmt: 120000, status: '待审批', signStatus: '未发起', contractRole: 'maintenance', recvPct: 0, recv: 0, owner: '蓝峰', sign: '—', start: '2027-04-01', end: '2028-03-31', nodes: '年付 100%', overdue: false, overpay: false },
  { id: 'WB000003', name: '楚雄州人民医院消防维护保养合同（2027）', type: '维护保养合同', party: '楚雄州人民医院', project: 'XM000118', amt: 960000, execAmt: 960000, status: '履约中', contractRole: 'maintenance', recvPct: 62.5, recv: 600000, owner: '赵薇', sign: '2026-09-01', start: '2026-09-01', end: '2027-08-31', nodes: '半年付 50% × 2', overdue: false, overpay: false },
  { id: 'HT000005', name: '丽江景区智慧消防平台合同', type: '销售合同', party: '丽江××文旅开发集团', project: 'XM000105', amt: 2400000, execAmt: 2400000, status: '已签约', contractRole: 'primary', recvPct: 25, recv: 600000, owner: '陈静', sign: '2026-08-18', start: '2026-09-01', end: '2027-01-31', nodes: '预付 25% · 验收 75%', overdue: false, overpay: false },
  { id: 'HT000002', name: '产业园一期消防工程合同', type: '销售合同', party: '××工业园区开发有限公司', project: 'XM000087', amt: 2600000, execAmt: 2600000, status: '履约中', contractRole: 'primary', recvPct: 78, recv: 2028000, owner: '周斌', sign: '2026-07-30', start: '2026-08-01', end: '2026-12-31', nodes: '预付 30% · 进度 40% · 竣工 27% · 质保 3%', overdue: false, overpay: true, bidId: 'TB000028' },
  { id: 'CG000003', name: '消防设备采购合同（报警系统）', type: '采购合同', party: '云南××消防设备有限公司', project: 'XM000123', amt: 860000, execAmt: 860000, status: '履约中', signStatus: '已签', contractRole: 'primary', recvPct: 0, recv: 0, owner: '蓝峰', sign: '2026-09-01', start: '2026-09-05', end: '2026-11-30', nodes: '到货 70% · 验收 30%', overdue: false, overpay: false },
  { id: 'CG000005', name: '劳务分包合同（喷淋安装）', type: '采购合同', party: '昆明××建筑劳务有限公司', project: 'XM000123', amt: 580000, execAmt: 580000, status: '履约中', contractRole: 'primary', recvPct: 0, recv: 0, owner: '蓝峰', sign: '2026-09-02', start: '2026-09-10', end: '2026-12-20', nodes: '进度 60% · 完工 40%', overdue: false, overpay: false },
  { id: 'FK000001', name: '昆明万达广场消防维护保养框架协议', type: '框架协议', party: '昆明万达广场商业管理有限公司', project: '', amt: 0, execAmt: 5000000, status: '履约中', recvPct: 0, recv: 0, owner: '蓝峰', sign: '2026-06-01', start: '2026-06-01', end: '2029-05-31', nodes: '按子合同工作量结算', overdue: false, overpay: false },
  { id: 'WB000001', name: '楚雄州人民医院消防综合维保合同（2025-2026）', type: '综合合同', party: '楚雄州人民医院', project: 'XM000118', amt: 900000, execAmt: 900000, status: '已续签', contractRole: 'maintenance', recvPct: 100, recv: 900000, owner: '赵薇', sign: '2025-09-01', start: '2025-09-01', end: '2026-08-31', nodes: '半年付 50% × 2', overdue: false, overpay: false, renewedTo: 'WB000003' },
  { id: 'FK000008', name: '万达广场秋季维保服务（框架子合同）', type: '框架协议', party: '昆明万达广场商业管理有限公司', project: 'XM000123', amt: 380000, execAmt: 380000, status: '履约中', recvPct: 30, recv: 114000, owner: '蓝峰', sign: '2026-09-10', start: '2026-09-15', end: '2026-12-15', nodes: '完工 100%', overdue: false, overpay: false, sub: true },
  { id: 'CG000002', name: '××酒店灭火器批次采购合同', type: '采购合同', party: '云南××消防设备有限公司', project: 'XM000105', amt: 120000, execAmt: 120000, status: '已终止', terminateType: '解除', signStatus: '已签', contractRole: 'primary', recvPct: 0, recv: 0, owner: '陈静', sign: '2026-04-15', start: '2026-04-20', end: '2026-06-30', nodes: '到货 100%', overdue: false, overpay: false },
  { id: 'HT000011', name: '柳州钢铁厂区消防管网改造合同', type: '销售合同', party: '广西柳州钢铁集团有限公司', project: 'XM000131', amt: 5600000, execAmt: 5600000, status: '履约中', signStatus: '已签', contractRole: 'primary', recvPct: 0, recv: 0, owner: '赵薇', sign: '2026-07-25', start: '2026-07-31', end: '2026-10-31', nodes: '预付 20% · 进度 50% · 竣工 27% · 质保 3%', overdue: true, overpay: false, bidId: 'TB000056' },
];


/* ============================ 电子签章（CON-02 · 落签地配置 + 签署链） ============================
 * 背景（规格 §0.7）：第三方电子签**已对接完成**，本期只做「落签地 / 签署位置配置」与「签署链留痕」。
 * 规则（CON-02）：
 *   ① 签署配置：签署顺序（我方先签 / 对方先签 / 无序）；落签地按**关键字定位**或**坐标定位**指定签署区；
 *      多签署方各自落签位置、签章类型（公章 / 个人章）、骑缝章开关。
 *   ② 发起签署 → 逐方记录签署时间戳与状态，形成**签署链**；撤回留痕可追溯。
 *   ③ 电子签全部完成（signStatus = 已签）→ 合同方可转「已签约」。
 *   异常：落签位置未配置 → **不允许发起签署**。
 * ========================================================================== */
/** 电子签状态（规格 §5.1 signStatus） */
export const SIGN_STATUS = ['未发起', '签署中', '已签', '已撤回'] as const;
export const SIGN_STATUS_TONE: Record<string, 'gray' | 'orange' | 'green' | 'red'> = {
  未发起: 'gray', 签署中: 'orange', 已签: 'green', 已撤回: 'red',
};
/** 签署顺序 */
export const SIGN_ORDERS = ['我方先签', '对方先签', '无序'] as const;
/** 落签地定位方式 */
export const SIGN_LOCATE_MODES = ['按关键字定位', '按坐标定位'] as const;
/** 签章类型 */
export const SIGN_SEAL_TYPES = ['公章', '个人章'] as const;
/** 签署方状态 */
export const SIGN_PARTY_STATUS = ['待签署', '已签', '已撤回'] as const;

/** 签署方（= 落签地配置 + 签署链上的一个节点） */
export type SignParty = {
  /** 签署方名称 */
  name: string;
  /** 我方 / 对方 */
  side: '我方' | '对方';
  /** 签章类型：公章 / 个人章 */
  seal: string;
  /** 骑缝章开关 */
  across: boolean;
  /** 落签地定位方式：按关键字定位 / 按坐标定位 */
  locateMode: string;
  /** 落签位置：关键字（如「甲方盖章处」）或坐标（如 x:120 y:860） */
  anchor: string;
  /** 签署状态：待签署 / 已签 / 已撤回 */
  st: string;
  /** 签署时间戳（形成签署链） */
  at?: string;
  by?: string;
  ip?: string;
};
export type SignConfig = {
  /** 签署顺序 */
  order: string;
  parties: SignParty[];
  /** 撤回 / 发起留痕 */
  logs: { at: string; text: string; by: string }[];
};

/** 签署方工厂（压缩演示数据） */
const SP = (
  name: string, side: '我方' | '对方', seal: string, across: boolean,
  locateMode: string, anchor: string, st: string, at?: string, by?: string, ip?: string,
): SignParty => ({ name, side, seal, across, locateMode, anchor, st, at, by, ip });

const OUR = '诺盾博达消防科技有限公司';

/** 签署配置（按合同编号挂载；未登记的合同 = 未发起，需先配置落签地） */
export const SIGN_CHAINS: Record<string, SignConfig> = {
  /* 待审批 + 签署中：我方已签、对方待签 —— 演示「签署中」与签署链时间戳 */
  HT000011: {
    order: '我方先签',
    parties: [
      SP(OUR, '我方', '公章', true, '按关键字定位', '乙方盖章处（末页签署栏）', '已签', '2026-09-21 10:12', '蓝峰', '116.52.31.208'),
      SP('广西柳州钢铁集团有限公司', '对方', '公章', true, '按关键字定位', '甲方盖章处（末页签署栏）', '待签署'),
    ],
    logs: [{ at: '2026-09-21 09:40', text: '发起签署 · 按配置落签地渲染签章（签署顺序：我方先签）', by: '蓝峰' }],
  },
  /* 履约中 + 已签：对方先签，含个人章 */
  HT000009: {
    order: '对方先签',
    parties: [
      SP('昆明万达广场商业管理有限公司', '对方', '公章', true, '按关键字定位', '甲方盖章处（末页签署栏）', '已签', '2026-09-11 15:03', '王芳', '220.163.88.14'),
      SP(OUR, '我方', '公章', true, '按关键字定位', '乙方盖章处（末页签署栏）', '已签', '2026-09-12 09:26', '蓝峰', '116.52.31.208'),
      SP('李思敏', '我方', '个人章', false, '按坐标定位', 'x:120 y:860（法定代表人签字区）', '已签', '2026-09-12 09:31', '李思敏', '116.52.31.209'),
    ],
    logs: [{ at: '2026-09-11 14:50', text: '发起签署 · 按配置落签地渲染签章（签署顺序：对方先签）', by: '蓝峰' }],
  },
  /* 履约中 + 已签：无序签署，含坐标定位 + 撤回留痕（可追溯） */
  CG000003: {
    order: '无序',
    parties: [
      SP('云南××消防设备有限公司', '对方', '公章', false, '按坐标定位', 'x:96 y:812（供方盖章区）', '已签', '2026-09-03 11:08', '张伟', '182.245.66.31'),
      SP(OUR, '我方', '公章', true, '按关键字定位', '乙方盖章处（末页签署栏）', '已签', '2026-09-03 14:22', '蓝峰', '116.52.31.208'),
    ],
    logs: [
      { at: '2026-09-02 17:10', text: '发起签署 · 按配置落签地渲染签章（签署顺序：无序）', by: '蓝峰' },
      { at: '2026-09-02 18:05', text: '撤回签署 · 原因：供方落签地坐标偏移，需重新配置后再次发起', by: '蓝峰' },
      { at: '2026-09-03 09:30', text: '重新发起签署（落签地已修正：x:96 y:812）', by: '蓝峰' },
    ],
  },
  /* 已终止 + 已签：个人章示例 */
  CG000002: {
    order: '我方先签',
    parties: [
      SP(OUR, '我方', '个人章', false, '按关键字定位', '乙方经办人签字处', '已签', '2026-04-15 10:40', '陈静', '116.52.31.210'),
      SP('云南××消防设备有限公司', '对方', '公章', true, '按关键字定位', '甲方盖章处（末页签署栏）', '已签', '2026-04-15 16:12', '张伟', '182.245.66.31'),
    ],
    logs: [{ at: '2026-04-15 10:20', text: '发起签署 · 按配置落签地渲染签章（签署顺序：我方先签）', by: '陈静' }],
  },
};

export const signConfigOf = (id: string): SignConfig | null => SIGN_CHAINS[id] ?? null;
/** 电子签状态（未登记 signStatus 的合同视为「未发起」） */
export const signStatusOf = (c: { signStatus?: string }) => c.signStatus || '未发起';
/** 签署链是否全部签完 */
export const isSignDone = (cfg: SignConfig | null) =>
  !!cfg && cfg.parties.length > 0 && cfg.parties.every((p) => p.st === '已签');

/* ============================ 项目（XM + 6 位） ============================ */
/**
 * 项目来源（立项入口口径）：
 *   合同立项 —— 由已签约合同发起，上游（报价 / 投标 / 商机）由合同自动继承，不手选来源；
 *   应急工程 —— 无合同先施工，须在 30 日内补签；
 *   其余为历史数据的存量来源，保留兼容（台账「来源」列仍可筛选）。
 */
export const PROJECT_SOURCES = ['合同立项', '投标中标', '商机直签', '报价转化', '应急工程'] as const;

/**
 * 项目状态机（对齐《研发级功能规格》§6.2）：
 *   待启动 ─进场/合同就绪→ 执行中 ─完工→ 验收结算中 ─验收+结算完成→ 已结项（施工型终点）
 *   执行中 ⇄ 暂停（显式操作，必填原因，写 logs 留痕）
 *   维保型：已结项 → 维保服务中（长期）→ 到期续签 → 继续；服务终止 → 已关闭
 *   旁支：作废 = 建错（留痕不可恢复）；已关闭可重开
 */
export const PROJECT_STATUS = [
  '待启动', '执行中', '暂停', '验收结算中', '已结项', '维保服务中', '已关闭', '作废',
] as const;
/** 施工型终点 = 已结项；维保型终点 = 已关闭；作废为不可恢复旁支 */
export const PROJECT_TERMINAL = ['已结项', '已关闭', '作废'] as const;
/** 状态语义色（列表标签 / 详情大标签共用） */
export const PROJECT_STATUS_TONE: Record<string, string> = {
  待启动: 'gray', 执行中: 'blue', 暂停: 'orange', 验收结算中: 'gold',
  已结项: 'green', 维保服务中: 'green', 已关闭: 'gray', 作废: 'red',
};
/** 维保型项目（走「维保服务中」，不适用「已结项」终点） */
export const isServiceProject = (p: { type: string }) => p.type === '维护保养';
/** 项目风险标记（规格 §6.1 risks[] + 附录 A）：列表风险标记组 / 驾驶舱风险榜共用同一口径 */
export const PROJECT_RISKS: Record<string, { label: string; tone: 'red' | 'orange' | 'gold'; hint: string }> = {
  nocontract: { label: '无合同施工', tone: 'red', hint: '已进入执行中但无销售合同，需补签并关联销售合同' },
  overcost: { label: '成本超支', tone: 'red', hint: '实际成本已超目标成本，需调整目标成本（留痕）或结项' },
  overdue: { label: '收款逾期', tone: 'orange', hint: '收款期次超过计划日期未到账' },
  milestoneOverdue: { label: '里程碑逾期', tone: 'orange', hint: '里程碑计划日超期未完成，需更新完成状态' },
  maintenanceOverdue: { label: '维保问题超期', tone: 'orange', hint: '问题超过要求完成日未销项，需甲方确认销项' },
};
/** 取项目风险标记（risk === 'none' 返回 null） */
export const riskOf = (risk: string) => PROJECT_RISKS[risk] || null;

/** 旧状态别名归一化（历史数据兼容） */
export const PROJECT_STATUS_ALIAS: Record<string, string> = {
  草稿: '待启动', 待审批: '待启动', 已立项: '待启动',
};
export function normProjectStatus(s: string): string {
  return PROJECT_STATUS_ALIAS[s] ?? s;
}

export type Project = {
  id: string; name: string; type: string; biz: string; source: string;
  customer: string; customerId?: string; owner: string; pm: string;
  contractAmt: number; execAmt: number; cost: number; milestone: number;
  milestoneName: string; recvPct: number; risk: string; status: string;
  start: string; end: string; profit: number;
  /** 立项来源合同（合同立项路径写入；历史数据缺省） */
  contractId?: string;
  /** 无合同施工标记（应急工程） */
  noContract?: boolean;
  /** 合同补签期限（应急工程 = 立项日 + 30 日） */
  backfillBy?: string;
  /** 暂停原因（暂停态必填，写入 logs 留痕） */
  pauseReason?: string;
  /** 暂停日期 */
  pausedAt?: string;
  /** 甲方现场对接人（独立于客户单位联系人，规格 §6.1 clientContact） */
  clientContact?: string;
  /** 维保服务周期（维保型只读来自合同，规格 PRJ-04） */
  serviceStart?: string;
  serviceEnd?: string;
  /** 消防验收状态（规格 PRJ-08）：未申报/已申报/整改中/已通过/已备案 */
  acceptStatus?: string;
  /** 消防验收通过日（驱动质保起算与履约保证金退还提醒） */
  acceptDate?: string;
  /** 最近更新时间（列表「更新时间」列；缺省回落 start） */
  updatedAt?: string;
  /** 状态流转留痕（暂停 / 恢复 / 关闭 / 重开 / 作废，规格 §6.2「写入 logs[] 留痕可审计」） */
  logs?: ProjectLog[];
  /** 进度（产值权重法，工序填报自动汇总，禁止手工填百分比入口）：实际 / 计划应到（%） */
  progressActual?: number;
  progressPlan?: number;
  /** 工序产值清单：进度 = Σ(doneQty×unitPrice) ÷ Σ(totalQty×unitPrice) */
  workItems?: { name: string; totalQty: number; doneQty: number; unitPrice: number }[];
};

/** 项目状态流转日志（规格 §6.2：暂停 / 恢复必填原因，留痕可审计） */
export type ProjectLog = {
  at: string; from: string; to: string; by: string;
  reason?: string; auto?: boolean;
};

export const PROJECTS: Project[] = [
  /* contractAmt = 主合同签约价（HT000009 合同额冻结为 1,800,000，立项锚点）；execAmt = 执行额 1,950,000（180 + 已生效价格调整补充 +15 万）。
     cost = 已发生实际成本 1,423,000（立项预算/目标成本 1,300,000，超支 12.3 万）。回款 recvPct = 已到账 54 万 ÷ 执行额 195 万 = 27.7%。 */
  { id: 'XM000123', name: '昆明万达广场消防改造工程', type: '改造', biz: 'GC', source: '投标中标', customer: '昆明万达广场商业管理有限公司', customerId: 'KH20260312001', owner: '蓝峰', pm: '张工', contractAmt: 1800000, execAmt: 1950000, cost: 1423000, milestone: 70, milestoneName: '施工中', recvPct: 27.7, risk: 'overcost', status: '执行中', start: '2026-09-20', end: '2027-03-31', profit: 21.0, updatedAt: '2026-09-22', contractId: 'HT000009',
    progressActual: 70, progressPlan: 82,
    workItems: [
      { name: '喷头安装', totalQty: 100, doneQty: 80, unitPrice: 1000 },
      { name: '镀锌钢管敷设', totalQty: 1000, doneQty: 600, unitPrice: 100 },
      { name: '报警探测器安装', totalQty: 200, doneQty: 140, unitPrice: 500 },
      { name: '防排烟风管制作', totalQty: 500, doneQty: 350, unitPrice: 200 },
    ] },
  { id: 'XM000118', name: '楚雄州人民医院消防维护保养', type: '维护保养', biz: 'WB', source: '商机直签', customer: '楚雄州人民医院', customerId: 'KH20250902004', owner: '赵薇', pm: '李工', contractAmt: 960000, execAmt: 960000, cost: 590000, milestone: 58, milestoneName: '周期巡检', recvPct: 62.5, risk: 'none', status: '维保服务中', serviceStart: '2026-09-01', serviceEnd: '2027-08-31', start: '2026-09-01', end: '2027-08-31', profit: 38.5, updatedAt: '2026-09-18', contractId: 'WB000003' },
  { id: 'XM000105', name: '丽江景区智慧消防平台', type: '新建', biz: 'RJ', source: '报价转化', customer: '丽江××文旅开发集团', owner: '陈静', pm: '王工', contractAmt: 2400000, execAmt: 2400000, cost: 1620000, milestone: 25, milestoneName: '进场准备', recvPct: 25, risk: 'none', status: '待启动', start: '2026-09-01', end: '2027-01-31', profit: 32.5, updatedAt: '2026-09-15', contractId: 'HT000005' },
  { id: 'XM000098', name: '××酒店消防设施应急抢修', type: '维护保养', biz: 'QT', source: '应急工程', customer: '××酒店管理公司', owner: '周斌', pm: '张工', contractAmt: 0, execAmt: 0, cost: 186000, milestone: 90, milestoneName: '质保期', recvPct: 0, risk: 'nocontract', status: '执行中', start: '2026-07-15', end: '2026-12-31', profit: 0, updatedAt: '2026-09-19' },
  { id: 'XM000096', name: '曲靖一院消控室改造', type: '改造', biz: 'GC', source: '商机直签', customer: '曲靖××第一人民医院', owner: '周斌', pm: '陈工', contractAmt: 680000, execAmt: 680000, cost: 452000, milestone: 100, milestoneName: '质保期', recvPct: 95, risk: 'none', status: '已结项', start: '2026-03-01', end: '2026-08-31', profit: 33.5, updatedAt: '2026-08-31' },
  { id: 'XM000087', name: '产业园一期消防工程', type: '新建', biz: 'GC', source: '投标中标', customer: '××工业园区开发有限公司', owner: '周斌', pm: '张工', contractAmt: 2600000, execAmt: 2600000, cost: 1820000, milestone: 88, milestoneName: '竣工验收', recvPct: 78, risk: 'none', status: '执行中', start: '2026-08-01', end: '2026-12-31', profit: 30, updatedAt: '2026-09-21', contractId: 'HT000002' },
  { id: 'XM000131', name: '柳州钢铁厂区消防管网改造', type: '改造', biz: 'GC', source: '商机直签', customer: '广西柳州钢铁集团有限公司', customerId: 'KH20260620006', owner: '赵薇', pm: '王工', contractAmt: 5600000, execAmt: 5600000, cost: 3860000, milestone: 96, milestoneName: '待验收', recvPct: 0, risk: 'overdue', status: '验收结算中', acceptStatus: '已申报', start: '2026-07-31', end: '2026-10-31', profit: 31.1, updatedAt: '2026-09-16', contractId: 'HT000011' },
  { id: 'XM000142', name: '云南××磷化工有限公司厂区消防设施检测', type: '检测', biz: 'JC', source: '商机直签', customer: '云南××磷化工有限公司', customerId: 'KH20260710013', owner: '赵薇', pm: '陈工', contractAmt: 1280000, execAmt: 1280000, cost: 820000, milestone: 35, milestoneName: '检测作业', recvPct: 30, risk: 'none', status: '执行中', start: '2026-08-20', end: '2026-11-30', profit: 36, updatedAt: '2026-09-20' },
  { id: 'XM000136', name: '昆明长水国际机场航站楼消防设施年度检测', type: '检测', biz: 'JC', source: '投标中标', customer: '昆明长水国际机场后勤保障部', customerId: 'KH20260715007', owner: '蓝峰', pm: '王工', contractAmt: 1560000, execAmt: 1560000, cost: 980000, milestone: 60, milestoneName: '检测作业', recvPct: 50, risk: 'none', status: '执行中', start: '2026-07-01', end: '2027-06-30', profit: 37.2, updatedAt: '2026-09-17' },
  /* 暂停态样例：里程碑逾期 + 暂停原因留痕（规格 §6.2 执行中 ⇄ 暂停） */
  { id: 'XM000150', name: '××政务服务中心消防改造工程', type: '改造', biz: 'GC', source: '商机直签', customer: '××政务服务中心', owner: '刘宇', pm: '陈工', clientContact: '后勤科 杨科长 139****3321', contractAmt: 1850000, execAmt: 1850000, cost: 640000, milestone: 40, milestoneName: '管线安装', recvPct: 20, risk: 'milestoneOverdue', status: '暂停', start: '2026-06-01', end: '2026-12-31', profit: 0, pauseReason: '甲方装修标段交叉作业，作业面未移交', pausedAt: '2026-08-15', updatedAt: '2026-08-15',
    logs: [
      { at: '2026-08-15', from: '执行中', to: '暂停', by: '刘宇', reason: '甲方装修标段交叉作业，作业面未移交' },
      { at: '2026-06-01', from: '待启动', to: '执行中', by: '系统', auto: true },
    ] },
  /* 已关闭样例：维保型服务到期未续签 → 服务终止（终态，可重开） */
  { id: 'XM000079', name: '玉溪××酒店消防维护保养', type: '维护保养', biz: 'WB', source: '商机直签', customer: '玉溪××酒店管理有限公司', owner: '赵薇', pm: '李工', contractAmt: 420000, execAmt: 420000, cost: 268000, milestone: 100, milestoneName: '服务期满', recvPct: 100, risk: 'none', status: '已关闭', serviceStart: '2025-07-01', serviceEnd: '2026-06-30', start: '2025-07-01', end: '2026-06-30', profit: 36.2, updatedAt: '2026-07-01',
    logs: [{ at: '2026-07-01', from: '维保服务中', to: '已关闭', by: '赵薇', reason: '服务期满，甲方未续签' }] },
  /* 作废样例：建错单据（终态，留痕不可恢复） */
  { id: 'XM000075', name: '××科技园消防改造工程（重复录入）', type: '改造', biz: 'GC', source: '商机直签', customer: '××科技园运营管理有限公司', owner: '陈静', pm: '王工', contractAmt: 0, execAmt: 0, cost: 0, milestone: 0, milestoneName: '—', recvPct: 0, risk: 'none', status: '作废', start: '2026-05-10', end: '2026-05-10', profit: 0, updatedAt: '2026-05-12',
    logs: [{ at: '2026-05-12', from: '待启动', to: '作废', by: '陈静', reason: '与 XM000074 重复录入，作废' }] },
];

/* ============================ 里程碑模板（规格 §6.4 PRJ-04 / EFF-06） ============================
 * 由系统管理员按项目类型维护；新建施工型项目一键套用。套用后为实例，改模板不影响已生成项目。
 * ============================================================ */
export const MILESTONE_TPL: { type: string; name: string; nodes: string[] }[] = [
  {
    type: '新建', name: '新建工程标准模板',
    nodes: ['进场准备', '材料进场报验', '隐蔽工程验收', '管线安装', '设备安装', '系统调试', '第三方消防检测', '消防验收备案', '竣工资料', '结算'],
  },
  {
    type: '改造', name: '改造工程标准模板',
    nodes: ['进场准备', '现状勘察与交底', '材料进场报验', '隐蔽工程验收', '管线安装', '设备安装', '系统调试', '第三方消防检测', '消防验收备案', '竣工资料', '结算'],
  },
  {
    type: '维护保养', name: '维保服务模板',
    nodes: ['服务启动与交底', '点位建档与贴码', '首轮全面巡检', '周期巡检（月 / 季 / 年）', '问题闭环', '年度服务报告', '续签评估'],
  },
  {
    type: '检测', name: '消防设施检测模板',
    nodes: ['进场准备', '资料收集与预检', '现场检测作业', '数据整理与判定', '出具检测报告', '整改复检', '报告归档'],
  },
];
/** 取项目类型对应的里程碑模板（缺省回落施工型首套） */
export const milestoneTplOf = (type: string) =>
  MILESTONE_TPL.find((t) => t.type === type) || MILESTONE_TPL[0];
/** 法定节点：删除时需二次确认，防漏（规格 PRJ-04 异常） */
export const MILESTONE_LEGAL = ['隐蔽工程验收', '第三方消防检测', '消防验收备案'];

/* ============================ 消防验收状态机（规格 PRJ-08「行业命门」） ============================ */
export const ACCEPT_FLOW = ['未申报', '已申报', '整改中', '已通过', '已备案'] as const;
export const ACCEPT_TONE: Record<string, string> = {
  未申报: 'gray', 已申报: 'blue', 整改中: 'orange', 已通过: 'green', 已备案: 'green',
};

/* ============================ 材料进场报验要求（规格 PRJ-09 / PRD-04） ============================ */
export const ARRIVAL_REQ = ['无需', '合格证', '检测报告', '3C 证书'] as const;

/* ============================ 证书占用记录（规格 §4.3 独立实体） ============================
 * 占用查询 = 统计 status='占用中' 的记录；
 * 中标转项目 = 改归属留痕、不重建；结项 = 置为已释放。
 * 原型以 CERTS.used 作为存量存储（CertPage 借还回写），此处派生为带起止与状态的记录视图。
 * ============================================================ */
export type CertOccupancy = {
  id: string; certId: string; certName: string; holder: string;
  subjectType: '投标' | '项目'; subjectId: string; subjectName: string;
  startDate: string; endDate: string; status: '占用中' | '已释放'; createdBy: string;
};
/** 投标占用（做标书阶段选证生成的占用记录） */
const OCC_BID: CertOccupancy[] = [
  { id: 'ZY000015-B1', certId: 'ZS000015', certName: '一级注册消防工程师', holder: '张工', subjectType: '投标', subjectId: 'TB000038', subjectName: '昆明万达广场消防改造', startDate: '2026-09-08', endDate: '2026-09-25', status: '占用中', createdBy: '蓝峰' },
  { id: 'ZY000035-B1', certId: 'ZS000035', certName: '消防设施工程专业承包（二级）', holder: '诺盾博达消防科技有限公司', subjectType: '投标', subjectId: 'TB000041', subjectName: '云南××中学消防改造', startDate: '2026-09-10', endDate: '2026-09-25', status: '占用中', createdBy: '李强' },
];
export const CERT_OCCUPANCY: CertOccupancy[] = [
  ...OCC_BID,
  ...CERTS.flatMap((c) =>
    c.used.map((pid, i) => {
      const p = PROJECTS.find((x) => x.id === pid);
      const released = !!p && (PROJECT_TERMINAL as readonly string[]).includes(p.status);
      return {
        id: `ZY${c.id.slice(2)}-${String(i + 1).padStart(2, '0')}`,
        certId: c.id, certName: c.name, holder: c.holder,
        subjectType: '项目' as const, subjectId: pid,
        subjectName: p?.name || pid,
        startDate: p?.start || '2026-09-01',
        endDate: p?.end || '—',
        status: (released ? '已释放' : '占用中') as '已释放' | '占用中',
        createdBy: '蓝峰',
      };
    }),
  ),
];
/** 占用查询口径：某证书占用中的记录数（规格 §4.3） */
export const occCount = (certId: string) =>
  CERT_OCCUPANCY.filter((o) => o.certId === certId && o.status === '占用中').length;
/** 某项目占用的证书记录（项目详情「团队与证书」Tab 用） */
export const occOfProject = (pid: string) =>
  CERT_OCCUPANCY.filter((o) => o.subjectType === '项目' && o.subjectId === pid);

/* ============================ 项目团队（规格 §6.1 team[]） ============================ */
export const PROJECT_TEAM: Record<string, { name: string; role: string; phone: string }[]> = {
  XM000123: [
    { name: '张工', role: '项目经理', phone: '138****8801' },
    { name: '李强', role: '施工班组长', phone: '138****6620' },
    { name: '陈工', role: '安全员', phone: '138****4418' },
    { name: '孙工', role: '焊工', phone: '138****9027' },
    { name: '王工', role: '调试工程师', phone: '138****5514' },
  ],
  XM000131: [
    { name: '王工', role: '项目经理', phone: '138****5514' },
    { name: '刘宇', role: '施工班组长', phone: '138****7733' },
    { name: '陈工', role: '安全员', phone: '138****4418' },
  ],
  XM000118: [
    { name: '李工', role: '项目经理', phone: '138****2203' },
    { name: '赵薇', role: '维保负责人', phone: '138****9902' },
    { name: '孙工', role: '巡检工程师', phone: '138****9027' },
  ],
};
/** 取项目团队（缺省给一套通用班组，保证 Tab 不空） */
export const teamOfProject = (pid: string, pm: string) =>
  PROJECT_TEAM[pid] || [
    { name: pm, role: '项目经理', phone: '138****0000' },
    { name: '陈工', role: '安全员', phone: '138****4418' },
  ];


/* ============================ 供应商（GYS + 6 位） ============================ */
/* 供应商综合评分（对齐参考《主数据管理》339 行）：质量 40% + 交期 30% + 价格 20% + 服务 10% */
export const SUP_SCORE_W = { q: 0.4, d: 0.3, p: 0.2, s: 0.1 } as const;
/** 综合评分 = 质量×40% + 交期×30% + 价格×20% + 服务×10%（四维各 0~100 分） */
export const supScore = (s: { q: number; d: number; p: number; s: number }) =>
  Math.round(s.q * SUP_SCORE_W.q + s.d * SUP_SCORE_W.d + s.p * SUP_SCORE_W.p + s.s * SUP_SCORE_W.s);

export const SUPPLIERS = [
  { id: 'GYS000012', name: '云南××消防设备有限公司', cats: ['材料', '分包'], status: '已准入', level: 'A', coop: 12, amt: 3860000, blacklist: false, validTo: '2027-06-30', contact: '刘经理', phone: '138****3301', q: 94, d: 91, p: 86, s: 92, onTime: 96.2, qualRate: 99.1, priceAgr: '2026 年度框架价 · 有效期至 12-31' },
  { id: 'GYS000023', name: '昆明××建筑劳务有限公司', cats: ['劳务', '分包'], status: '已准入', level: 'B', coop: 8, amt: 1420000, blacklist: false, validTo: '2027-03-31', contact: '张经理', phone: '138****4402', q: 85, d: 82, p: 88, s: 80, onTime: 88.5, qualRate: 96.4, priceAgr: '按项目议价 · 无年度协议' },
  { id: 'GYS000028', name: '××安防材料科技有限公司', cats: ['材料'], status: '待准入', level: 'C', coop: 0, amt: 0, blacklist: false, validTo: '', contact: '陈经理', phone: '138****5503', q: 0, d: 0, p: 0, s: 0, onTime: 0, qualRate: 0, priceAgr: '未建档 · 待准入后议定' },
  { id: 'GYS000035', name: '曲靖××机电安装有限公司', cats: ['机械', '分包'], status: '已准入', level: 'B', coop: 5, amt: 860000, blacklist: false, validTo: '2027-01-31', contact: '周经理', phone: '138****6604', q: 82, d: 88, p: 79, s: 84, onTime: 92.1, qualRate: 95.8, priceAgr: '2026 年度框架价 · 有效期至 12-31' },
  { id: 'GYS000019', name: '××线缆供应链有限公司', cats: ['材料'], status: '已冻结', level: 'D', coop: 2, amt: 320000, blacklist: true, validTo: '2026-06-30', contact: '孙经理', phone: '138****7705', q: 58, d: 46, p: 72, s: 50, onTime: 61.3, qualRate: 82.7, priceAgr: '协议已过期 · 已冻结' },
  { id: 'GYS000041', name: '云南××检测技术有限公司', cats: ['检测'], status: '已准入', level: 'A', coop: 9, amt: 480000, blacklist: false, validTo: '2027-08-31', contact: '吴经理', phone: '138****8806', q: 96, d: 94, p: 78, s: 95, onTime: 97.4, qualRate: 99.6, priceAgr: '2026 年度框架价 · 有效期至 12-31' },
];

/* ============================ 主数据 · 多级分类树（任意层级 · 两棵根树） ============================ */
// 依据参考「主数据管理.html」TREE 模型：两棵根树，节点可无限嵌套。
// 维护能力：＋新增子分类 / 重命名 / 删除（有子级或被引用则禁删）+ 同级重名校验。
// 本次重构：分类树覆盖全部四种物料类型，不再只挂材料 ——
//   物料目录（mat）= 材料 + 设备（硬件，有库存 / 有证书）
//   服务与套件目录（prod）= 服务 + 套件（无实物库存 / 引用主数据构成成本）
// 树上计数由页面的 countOf 从 ITEMS 实时统计，不再出现「树上 21 条、台账 8 条」这类无来源数字。
export type CatNode = { id: string; n: string; owner?: string; ch?: CatNode[] };

/** 分类唯一 ID 生成器（保留原 key 命名习惯，便于与 ITEMS.cat 对齐） */
export const newCatId = (root: 'prod' | 'mat') => `${root}-c${Date.now().toString(36).slice(-5)}`;

export const CAT_TREE: Record<'prod' | 'mat', CatNode> = {
  mat: {
    id: 'mat', n: '物料目录（材料 / 设备）', ch: [
      { id: 'm1', n: '消防电', owner: '张仓', ch: [{ id: 'm11', n: '报警设备' }, { id: 'm12', n: '线缆桥架' }] },
      { id: 'm2', n: '消防水', owner: '张仓', ch: [{ id: 'm21', n: '管阀件' }, { id: 'm22', n: '消火栓箱组' }] },
      { id: 'm3', n: '防排烟' },
      { id: 'm4', n: '应急照明' },
      { id: 'm5', n: '气体灭火设备' },
    ],
  },
  prod: {
    id: 'prod', n: '服务与套件目录', ch: [
      { id: 'p1', n: '工程服务', owner: '陈工', ch: [{ id: 'p11', n: '安装调试' }, { id: 'p12', n: '深化设计' }] },
      { id: 'p2', n: '运维服务', owner: '赵薇', ch: [{ id: 'p21', n: '维护保养' }, { id: 'p22', n: '消防检测' }] },
      { id: 'p3', n: '成套产品', owner: '徐工', ch: [{ id: 'p31', n: '报警成套' }, { id: 'p32', n: '消火栓成套' }, { id: 'p33', n: '疏散成套' }] },
    ],
  },
};

/** 树工具：深度优先查找（返回节点 + 祖先路径） */
export function catFind(id: string): { node: CatNode; path: CatNode[] } | null {
  let hit: { node: CatNode; path: CatNode[] } | null = null;
  const walk = (n: CatNode, path: CatNode[]) => {
    if (n.id === id) { hit = { node: n, path: [...path, n] }; return; }
    (n.ch || []).forEach((c) => walk(c, [...path, n]));
  };
  Object.values(CAT_TREE).forEach((r) => walk(r, []));
  return hit;
}

/** 树工具：取节点自身 + 全部后代 ID（用于"被引用禁删"与计数） */
export function catSubtreeIds(id: string): string[] {
  const hit = catFind(id);
  if (!hit) return [];
  const out: string[] = [];
  const walk = (n: CatNode) => { out.push(n.id); (n.ch || []).forEach(walk); };
  walk(hit.node);
  return out;
}

/* ---- 分类树可变存储（同源单一事实） ----
 * 树上维护（新增 / 重命名 / 删除）直接写回 CAT_TREE，并由版本号通知订阅组件重渲染；
 * catPath / catOptions / catSubtreeIds 全部读同一份数据，杜绝「树上改名、面包屑与表单下拉仍旧名」的假同步。
 */
let catVer = 0;
const catListeners = new Set<() => void>();
/** 订阅分类树变更（组件内配合 useSyncExternalStore 使用） */
export function subscribeCats(fn: () => void): () => void {
  catListeners.add(fn);
  return () => { catListeners.delete(fn); };
}
/** 变更版本号（getSnapshot） */
export const catVersion = () => catVer;
function bumpCats() { catVer += 1; catListeners.forEach((f) => f()); }

/** 新增分类：parentId 为空时挂在对应根树的末级（不再替换整棵根树）；成功返回新节点 */
export function catAddChild(root: 'prod' | 'mat', parentId: string | null, n: string, owner?: string): CatNode | null {
  const node: CatNode = { id: newCatId(root), n: n.trim(), owner: owner?.trim() || undefined };
  if (parentId) {
    const hit = catFind(parentId);
    if (!hit) return null;
    hit.node.ch = hit.node.ch || [];
    hit.node.ch.push(node);
  } else {
    CAT_TREE[root].ch = CAT_TREE[root].ch || [];
    CAT_TREE[root].ch!.push(node);
  }
  bumpCats();
  return node;
}
/** 重命名 / 修改负责人 */
export function catRename(id: string, n: string, owner?: string): boolean {
  const hit = catFind(id);
  if (!hit) return false;
  hit.node.n = n.trim();
  hit.node.owner = owner?.trim() || undefined;
  bumpCats();
  return true;
}
/** 删除分类（有子级 / 被引用的校验由调用方完成） */
export function catRemove(root: 'prod' | 'mat', id: string): boolean {
  const rm = (list: CatNode[]): CatNode[] =>
    list.filter((x) => x.id !== id).map((x) => ({ ...x, ch: x.ch ? rm(x.ch) : undefined }));
  CAT_TREE[root] = { ...CAT_TREE[root], ch: rm(CAT_TREE[root].ch || []) };
  bumpCats();
  return true;
}

/** 树工具：分类路径文案，如「材料目录 / 消防水 / 管阀件」 */
export function catPath(id: string): string {
  const hit = catFind(id);
  return hit ? hit.path.map((x) => x.n).join(' / ') : '—';
}

/** 树工具：扁平化下拉选项（带缩进前缀） */
export function catOptions(root: 'prod' | 'mat'): { id: string; label: string }[] {
  const out: { id: string; label: string }[] = [];
  const walk = (n: CatNode, depth: number) => {
    if (depth > 0) out.push({ id: n.id, label: '　'.repeat(depth - 1) + n.n });
    (n.ch || []).forEach((c) => walk(c, depth + 1));
  };
  walk(CAT_TREE[root], 0);
  return out;
}

/* ==================================================================
 * 统一主数据：物料与服务（一张表 + 类型字段）
 * ------------------------------------------------------------------
 * 重构背景：原先把「材料台账 / 产品与服务 / 套件 BOM」建成三张互不引用的
 * 平行表，由此产生三类症状：
 *   ① 套件的「人工 / 其他」是自由填写的数字，不引用任何主数据 → 成本与台账脱节；
 *   ② 强制认证标记与合规证书两处各自维护 → 同一物料证书类型两页说法不一；
 *   ③ 合规页出现台账中根本不存在的「孤儿物料」。
 * 现在统一为 ITEMS 一张表，用 ty 区分四类：
 *   材料 | 有库存（仓库分账 + 安全线） | CCCF 等证书        | 成本 = 采购价
 *   设备 | 有库存                     | CCCF 等证书        | 成本 = 采购价
 *   服务 | 无实物库存                 | 资质要求字段        | 成本 = 人工构成 + 耗材行
 *   套件 | 视组成                     | 继承所含硬件证书    | 成本 = 配方行（引用主数据）
 * 硬规则：
 *   · 人工费只能来自 LABOR_RATES（工种 × 工日 × 单价），禁止自由文本数字；
 *   · 配方行只能引用 ITEMS 中已存在的主数据（搜不到 → 先去主数据新建）；
 *   · 证书类型是物料属性（certType），合规台账由它派生，杜绝两处维护。
 * ================================================================== */

/** 物料类型（统一主数据的唯一分类维度） */
export const ITEM_KINDS = ['材料', '设备', '服务', '套件'] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];

/** 是否持有实物库存（服务的成本是人工，不建库存账） */
export const isStocked = (k: ItemKind) => k === '材料' || k === '设备';

/* ---------- 人工工种单价：人工费的唯一来源 ---------- */
export const LABOR_RATES = [
  { trade: '电工', rate: 300 },
  { trade: '管工', rate: 320 },
  { trade: '焊工', rate: 380 },
  { trade: '消防设施操作员', rate: 280 },
  { trade: '调试工程师', rate: 450 },
  { trade: '消防设计师', rate: 420 },
];
export const laborRate = (trade: string) => LABOR_RATES.find((x) => x.trade === trade)?.rate ?? 0;

/* ============================ 考勤（外包用工 · 月度矩阵） ============================ */
/**
 * 考勤符号口径（对齐现场记录表）：
 * √ 出勤 1 天 · 半 出勤 0.5 天 · 加 出勤 1.5 天 · 休 现场休息不计考勤 · 假 离开现场 · 空 未在现场
 */
export const ATT_MARKS = [
  { k: '√', label: '出勤（1 天）', v: 1 },
  { k: '半', label: '出勤（0.5 天）', v: 0.5 },
  { k: '加', label: '出勤（1.5 天）', v: 1.5 },
  { k: '休', label: '现场休息（不计考勤）', v: 0 },
  { k: '假', label: '离开现场', v: 0 },
  { k: '', label: '未在现场', v: 0 },
] as const;

export type AttWorker = {
  id: string;
  name: string;
  /** 岗位 / 工种 —— 引用 LABOR_RATES，决定人工单价 */
  trade: string;
  /** 外包班组 */
  team: string;
  /** 关联项目（外包成本归属） */
  proj: string;
  /** 1~31 日 → 符号 */
  marks: Record<number, string>;
};

/** 由模式串生成 marks（逐日）；'.' 表示未在现场（空格） */
export const attMarks = (pat: string) => {
  const m: Record<number, string> = {};
  [...pat].forEach((c, i) => { m[i + 1] = c === '.' ? '' : c; });
  return m;
};

/** 出勤天数 = Σ 各日符号值（半 = 0.5 · 加 = 1.5 · 休/假/空 = 0） */
export const attDays = (w: AttWorker, upTo = 31) => {
  let d = 0;
  for (let i = 1; i <= upTo; i++) {
    const hit = ATT_MARKS.find((x) => x.k === w.marks[i]);
    if (hit) d += hit.v;
  }
  return Math.round(d * 10) / 10;
};

/** 人工成本 = 出勤天数 × 岗位单价 */
export const attCost = (w: AttWorker, upTo = 31) => Math.round(attDays(w, upTo) * laborRate(w.trade));

/** 外包班组 */
export const ATT_TEAMS = ['宏基劳务班组', '云安消防安装班组', '滇通机电班组'];

export const ATT_WORKERS: AttWorker[] = [
  { id: 'WG000001', name: '赵维维', trade: '电工', team: '宏基劳务班组', proj: 'XM000123', marks: attMarks('假假√√√√√√√√√√√假假√√√√√√') },
  { id: 'WG000002', name: '魏银宇', trade: '管工', team: '宏基劳务班组', proj: 'XM000123', marks: attMarks('假假√√假假假假假假假假假假假假假假假假') },
  { id: 'WG000003', name: '杨昕玥', trade: '焊工', team: '云安消防安装班组', proj: 'XM000123', marks: attMarks('假假√√√假假假假假假假假假假假假假假假假') },
  { id: 'WG000004', name: '杨来伟', trade: '消防设施操作员', team: '云安消防安装班组', proj: 'XM000123', marks: attMarks('假假√√√假假假假假假假假假假假假假假假假') },
  { id: 'WG000005', name: '李文强', trade: '电工', team: '滇通机电班组', proj: 'XM000131', marks: attMarks('√√√√√半半√√√√√假假假√√√√√√') },
  { id: 'WG000006', name: '陈志远', trade: '调试工程师', team: '滇通机电班组', proj: 'XM000131', marks: attMarks('√√√加加√√√√√√√√√√√√√√√√') },
  { id: 'WG000007', name: '王海涛', trade: '管工', team: '宏基劳务班组', proj: 'XM000118', marks: attMarks('休休√√√√√√√休休√√√√√√√√√') },
  { id: 'WG000008', name: '刘建军', trade: '焊工', team: '云安消防安装班组', proj: 'XM000118', marks: attMarks('假假假√√√√√√√√√√√√√√√√√') },
];

/** 人工行（工种引用 LABOR_RATES · 工日可小数） */
export type LaborLine = { trade: string; days: number };
/** 耗材行（引用材料 / 设备主数据） */
export type ConsumableLine = { code: string; qty: number };

export type Item = {
  id: string; code: string; name: string; spec: string;
  /** 类型：材料 / 设备 / 服务 / 套件（统一列表的「类型」列） */
  ty: ItemKind;
  unit: string; cat: string;
  /** 参考单价：材料 / 设备 = 采购含税价；服务 = 人工 + 耗材成本；套件 = 对外价（等价 sale） */
  price: number;
  status: '启用' | '停用';
  /** 库存三件套：结余 / 预占 / 安全线。可用 = 结余 − 预占；服务与套件恒为 0 */
  stock: number; hold: number; safe: number;
  ccc: boolean; mand: boolean;
  /** 认证（物料级唯一配置 → 台账徽标与合规台账同源） */
  certType?: string; certNo?: string; certValidTo?: string; certFiles?: number;
  /** 关联批次（与库存批次账呼应） */
  batch?: string;
  /** 到期通知渠道；certValidTo = '—'（长期有效）时留空，不派发 */
  notifyCh?: string;
  /** 服务：资质要求（服务不进证书台账，只保留此字段） */
  qualReq?: string;
  /** 服务：人工构成 */
  labor?: LaborLine[];
  /** 服务：可含耗材行 */
  consumables?: ConsumableLine[];
  /** 套件：对外价 / 被报价引用次数 */
  sale?: number; refs?: number;
  owner: string;
};

/* ---------- 材料（CL + 6 位）：纯物料，有库存 ---------- */
export const MATERIALS: Item[] = [
  { id: 'CL000123', code: 'CL000123', name: '镀锌钢管', spec: 'DN100', ty: '材料', unit: '米', cat: 'm21', price: 85, status: '启用', stock: 1280, hold: 80, safe: 500, ccc: false, mand: false, owner: '张仓' },
  { id: 'CL000145', code: 'CL000145', name: '喷淋头（上喷）', spec: '68℃ / DN15', ty: '材料', unit: '个', cat: 'm21', price: 28, status: '启用', stock: 560, hold: 34, safe: 300, ccc: false, mand: false, owner: '张仓' },
  { id: 'CL000158', code: 'CL000158', name: '消火栓箱', spec: 'SG24A65', ty: '材料', unit: '台', cat: 'm22', price: 460, status: '启用', stock: 32, hold: 2, safe: 60, ccc: true, mand: true, certType: 'CCCF 强制性认证', certNo: 'CCCF-2025-FH-008821', certValidTo: '2027-05-31', certFiles: 2, batch: 'PC20260512-A', notifyCh: '站内 + 钉钉 + 短信', owner: '张仓' },
  { id: 'CL000177', code: 'CL000177', name: '防火阀', spec: 'FHF-400', ty: '材料', unit: '台', cat: 'm3', price: 620, status: '启用', stock: 48, hold: 3, safe: 40, ccc: true, mand: true, certType: 'CCCF 强制性认证', certNo: 'CCCF-2025-FH-009117', certValidTo: '2027-08-31', certFiles: 2, batch: 'PC20260608-B', notifyCh: '站内 + 钉钉 + 短信', owner: '张仓' },
  { id: 'CL000188', code: 'CL000188', name: '桥架', spec: '200×100', ty: '材料', unit: '米', cat: 'm12', price: 65, status: '启用', stock: 860, hold: 52, safe: 400, ccc: false, mand: false, certType: '型式检验报告', certNo: 'XJ2025-0873', certValidTo: '2028-06-30', certFiles: 1, batch: 'PC20260705-A', notifyCh: '站内 + 钉钉', owner: '张仓' },
  { id: 'CL000201', code: 'CL000201', name: '应急照明灯具', spec: 'ZF-JCZ', ty: '材料', unit: '套', cat: 'm4', price: 95, status: '启用', stock: 320, hold: 20, safe: 200, ccc: true, mand: true, certType: 'CCCF 强制性认证', certNo: 'CCCF-2025-ZM-002290', certValidTo: '2027-01-31', certFiles: 2, batch: 'PC20260530-A', notifyCh: '站内 + 短信', owner: '张仓' },
  { id: 'CL000214', code: 'CL000214', name: '防火门（甲级）', spec: 'FM1021', ty: '材料', unit: '樘', cat: 'm3', price: 1580, status: '启用', stock: 12, hold: 1, safe: 20, ccc: true, mand: true, certType: 'CCCF 强制性认证', certNo: 'CCCF-2025-FH-010334', certValidTo: '2027-11-30', certFiles: 1, batch: 'PC20260811-A', notifyCh: '站内 + 钉钉', owner: '张仓' },
  { id: 'CL000226', code: 'CL000226', name: '消防水泵接合器', spec: 'SQX100', ty: '材料', unit: '套', cat: 'm22', price: 680, status: '启用', stock: 18, hold: 1, safe: 15, ccc: false, mand: false, certType: '出厂合格证', certNo: 'HG2026-0092', certValidTo: '—', certFiles: 1, batch: 'PC20260912-A', notifyCh: '', owner: '张仓' },
  { id: 'CL000231', code: 'CL000231', name: '消防水带', spec: 'DN65 × 25m', ty: '材料', unit: '盘', cat: 'm22', price: 78, status: '启用', stock: 240, hold: 14, safe: 150, ccc: false, mand: false, owner: '张仓' },
  { id: 'CL000232', code: 'CL000232', name: '直流水枪', spec: 'QZ19', ty: '材料', unit: '个', cat: 'm22', price: 45, status: '启用', stock: 180, hold: 10, safe: 120, ccc: false, mand: false, owner: '张仓' },
  { id: 'CL000233', code: 'CL000233', name: '输入/输出模块', spec: 'GST-LD-8300', ty: '材料', unit: '只', cat: 'm11', price: 210, status: '启用', stock: 420, hold: 25, safe: 300, ccc: false, mand: false, owner: '张仓' },
  { id: 'CL000234', code: 'CL000234', name: '应急照明集中电源', spec: 'EPS-3KVA', ty: '材料', unit: '台', cat: 'm4', price: 2600, status: '启用', stock: 26, hold: 2, safe: 10, ccc: false, mand: false, owner: '张仓' },
];

/* ---------- 设备（EQ + 6 位）：消防设备，有库存 · 原属合规页「孤儿物料」，本次补入主数据 ---------- */
export const EQUIPMENTS: Item[] = [
  { id: 'EQ000001', code: 'EQ000001', name: '火灾报警控制器', spec: 'JB-QB-GST5000', ty: '设备', unit: '台', cat: 'm11', price: 6800, status: '启用', stock: 6, hold: 1, safe: 2, ccc: true, mand: true, certType: 'CCCF 强制性认证', certNo: 'CCCF-2025-DQ-005511', certValidTo: '2027-07-31', certFiles: 3, batch: 'PC20260701-A', notifyCh: '站内 + 钉钉 + 短信', owner: '徐工' },
  { id: 'EQ000002', code: 'EQ000002', name: '感烟探测器', spec: 'JTY-GM-GST101', ty: '设备', unit: '只', cat: 'm11', price: 68, status: '启用', stock: 860, hold: 60, safe: 200, ccc: true, mand: true, certType: 'CCCF 强制性认证', certNo: 'CCCF-2024-GW-007733', certValidTo: '2026-10-15', certFiles: 1, batch: 'PC20260420-C', notifyCh: '站内 + 钉钉 + 短信', owner: '徐工' },
  { id: 'EQ000003', code: 'EQ000003', name: '气体灭火装置（七氟丙烷）', spec: 'GQQ70', ty: '设备', unit: '套', cat: 'm5', price: 18500, status: '启用', stock: 2, hold: 0, safe: 1, ccc: true, mand: true, certType: 'CCCF 强制性认证', certNo: 'CCCF-2025-QT-003318', certValidTo: '2026-11-30', certFiles: 2, batch: 'PC20260318-B', notifyCh: '站内 + 钉钉', owner: '徐工' },
  { id: 'EQ000004', code: 'EQ000004', name: '电气火灾监控设备', spec: 'LDT9100', ty: '设备', unit: '台', cat: 'm11', price: 4200, status: '启用', stock: 5, hold: 1, safe: 3, ccc: true, mand: true, certType: 'CCCF 强制性认证', certNo: 'CCCF-2025-DQ-005506', certValidTo: '2027-09-30', certFiles: 2, batch: 'PC20260722-A', notifyCh: '站内 + 钉钉', owner: '徐工' },
];

/* ---------- 服务（SV + 6 位）：人工构成 + 可挂耗材，无实物库存 ----------
   人工费落成服务型主数据（如「综合工日-电工 ¥300/工日」），禁止自由文本数字。
   参考单价 == 人工合计 + 耗材合计（由 serviceCost 校验，不手填）。 */
export const SERVICES: Item[] = [
  { id: 'SV000001', code: 'SV000001', name: '综合工日-电工', spec: '按工日计价', ty: '服务', unit: '工日', cat: 'p11', price: 300, status: '启用', stock: 0, hold: 0, safe: 0, ccc: false, mand: false, labor: [{ trade: '电工', days: 1 }], consumables: [], qualReq: '电工特种作业操作证', owner: '陈工' },
  { id: 'SV000002', code: 'SV000002', name: '综合工日-管工', spec: '按工日计价', ty: '服务', unit: '工日', cat: 'p11', price: 320, status: '启用', stock: 0, hold: 0, safe: 0, ccc: false, mand: false, labor: [{ trade: '管工', days: 1 }], consumables: [], qualReq: '管道工职业技能等级证', owner: '陈工' },
  { id: 'SV000003', code: 'SV000003', name: '综合工日-焊工', spec: '按工日计价', ty: '服务', unit: '工日', cat: 'p11', price: 380, status: '启用', stock: 0, hold: 0, safe: 0, ccc: false, mand: false, labor: [{ trade: '焊工', days: 1 }], consumables: [], qualReq: '焊工特种作业操作证', owner: '陈工' },
  { id: 'SV000004', code: 'SV000004', name: '安装调试服务', spec: '含联动调试与点位核对', ty: '服务', unit: '项', cat: 'p11', price: 1800, status: '启用', stock: 0, hold: 0, safe: 0, ccc: false, mand: false, labor: [{ trade: '调试工程师', days: 4 }], consumables: [], qualReq: '消防设施操作员证（中级）', owner: '陈工' },
  { id: 'SV000005', code: 'SV000005', name: '消防设施年度维保', spec: '按年（含 4 次巡检 + 24h 响应）', ty: '服务', unit: '年', cat: 'p21', price: 27800, status: '启用', stock: 0, hold: 0, safe: 0, ccc: false, mand: false, labor: [{ trade: '消防设施操作员', days: 80 }, { trade: '调试工程师', days: 12 }], consumables: [], qualReq: '消防设施维护保养检测资质', owner: '赵薇' },
  { id: 'SV000006', code: 'SV000006', name: '消防设施检测', spec: '按次（第三方检测口径）', ty: '服务', unit: '次', cat: 'p22', price: 12200, status: '启用', stock: 0, hold: 0, safe: 0, ccc: false, mand: false, labor: [{ trade: '调试工程师', days: 24 }, { trade: '消防设施操作员', days: 5 }], consumables: [], qualReq: '消防技术服务机构资质', owner: '陈工' },
  { id: 'SV000007', code: 'SV000007', name: '消防深化设计', spec: '按项（含图审配合）', ty: '服务', unit: '项', cat: 'p12', price: 12600, status: '启用', stock: 0, hold: 0, safe: 0, ccc: false, mand: false, labor: [{ trade: '消防设计师', days: 30 }], consumables: [], qualReq: '消防设施专项设计资质', owner: '徐工' },
  { id: 'SV000008', code: 'SV000008', name: '消火栓箱成套安装', spec: '含箱体固定 / 管道接驳 / 试压', ty: '服务', unit: '套', cat: 'p11', price: 510, status: '启用', stock: 0, hold: 0, safe: 0, ccc: false, mand: false, labor: [{ trade: '管工', days: 1 }, { trade: '焊工', days: 0.5 }], consumables: [], qualReq: '消防设施工程专业承包资质', owner: '陈工' },
];

/* ---------- 套件（CP + 6 位）：配方引用主数据，对外计价 ---------- */
export const KITS: Item[] = [
  { id: 'CP000041', code: 'CP000041', name: '消防报警套件', spec: '控制器 ×1 + 探测器 ×20 + 模块 ×8 + 安装调试', ty: '套件', unit: '套', cat: 'p31', price: 15800, sale: 15800, refs: 6, status: '启用', stock: 0, hold: 0, safe: 0, ccc: false, mand: false, owner: '徐工' },
  { id: 'CP000042', code: 'CP000042', name: '消火栓箱成套', spec: '箱 ×1 + 水带 ×2 + 水枪 ×1 + 成套安装', ty: '套件', unit: '套', cat: 'p32', price: 1680, sale: 1680, refs: 3, status: '启用', stock: 0, hold: 0, safe: 0, ccc: false, mand: false, owner: '张仓' },
  { id: 'CP000043', code: 'CP000043', name: '应急疏散照明包', spec: '灯具 ×6 + 集中电源 ×1 + 安装调试', ty: '套件', unit: '套', cat: 'p33', price: 5600, sale: 5600, refs: 0, status: '启用', stock: 0, hold: 0, safe: 0, ccc: false, mand: false, owner: '张仓' },
];

/** 统一主数据：页面上看到的「一张表」 */
export const ITEMS: Item[] = [...MATERIALS, ...EQUIPMENTS, ...SERVICES, ...KITS];
export const itemByCode = (code: string) => ITEMS.find((x) => x.code === code);
export const itemLabel = (code: string) => { const i = itemByCode(code); return i ? `${i.name} ${i.spec}`.trim() : code; };
export const byKind = (k: ItemKind) => ITEMS.filter((x) => x.ty === k);

/** 兼容既有引用：原「产品 / 服务」集合 == 服务 + 套件 */
export const PRODUCTS = [...SERVICES, ...KITS];

/* ==================================================================
 * 配方（套件 / 服务共用同一套「成本构成」编辑器）
 * ------------------------------------------------------------------
 * 配方行只能「引用主数据」，不再允许手工填数字：
 *   材料 / 设备行 → 单价自动取自 ITEMS，可锁价修改但会标记 lockedPrice；
 *   服务行       → 其人工构成即为本次配方的人工费来源（替代原自由填写的「人工」）；
 *   子套件行     → 支持嵌套，成本递归展开。
 * 编辑已被引用的配方 → 自动生成新版本，旧版永久保留（报价引用快照）。
 * ================================================================== */
export type RecipeLine = {
  /** 行类型：材料 / 设备 / 服务 / 子套件 */
  kind: ItemKind;
  /** 引用对象（只能是 ITEMS 中已存在的主数据编码） */
  code: string;
  /** 数量 / 单耗 */
  qty: number;
  /** 损耗%（仅材料 / 设备行） */
  loss?: number;
  /** 锁价：人工改过单价时记录，用于标记「偏离主数据」 */
  lockedPrice?: number;
};
export type RecipeVersion = { v: string; st: '生效' | '历史'; lines: RecipeLine[]; created: string; refs: number };
export const RECIPES: Record<string, { pid: string; cur: string; versions: RecipeVersion[] }> = {
  CP000041: {
    pid: 'CP000041', cur: 'V1.2', versions: [
      {
        v: 'V1.2', st: '生效', created: '2026-08-01', refs: 6, lines: [
          { kind: '设备', code: 'EQ000001', qty: 1 },
          { kind: '设备', code: 'EQ000002', qty: 20 },
          { kind: '材料', code: 'CL000233', qty: 8, loss: 2 },
          { kind: '服务', code: 'SV000004', qty: 1 },
        ],
      },
      {
        v: 'V1.1', st: '历史', created: '2026-05-11', refs: 0, lines: [
          { kind: '设备', code: 'EQ000001', qty: 1 },
          { kind: '设备', code: 'EQ000002', qty: 16 },
          { kind: '材料', code: 'CL000233', qty: 6, loss: 2 },
        ],
      },
    ],
  },
  CP000042: {
    pid: 'CP000042', cur: 'V1.0', versions: [
      {
        v: 'V1.0', st: '生效', created: '2026-06-15', refs: 3, lines: [
          { kind: '材料', code: 'CL000158', qty: 1, loss: 1 },
          { kind: '材料', code: 'CL000231', qty: 2, loss: 1 },
          { kind: '材料', code: 'CL000232', qty: 1, loss: 1 },
          { kind: '服务', code: 'SV000008', qty: 1 },
        ],
      },
    ],
  },
  CP000043: {
    pid: 'CP000043', cur: 'V1.1', versions: [
      {
        v: 'V1.1', st: '生效', created: '2026-07-20', refs: 0, lines: [
          { kind: '材料', code: 'CL000201', qty: 6, loss: 2 },
          { kind: '材料', code: 'CL000234', qty: 1, loss: 2 },
          { kind: '服务', code: 'SV000004', qty: 1 },
        ],
      },
      { v: 'V1.0', st: '历史', created: '2026-04-02', refs: 0, lines: [{ kind: '材料', code: 'CL000201', qty: 6, loss: 2 }] },
    ],
  },
};

/** 主数据查找（可传入页面内的可写副本，保证编辑器实时汇总与数据层同一套算法） */
const findItem = (code: string, items?: Item[]) => (items ?? ITEMS).find((x) => x.code === code);

/** 服务单位成本 = 人工构成（工种 × 工日 × 单价）+ 耗材行 */
export const serviceCost = (code: string, items?: Item[]) => {
  const it = findItem(code, items);
  if (!it) return { labor: 0, mat: 0, total: 0 };
  const labor = (it.labor || []).reduce((s, l) => s + laborRate(l.trade) * l.days, 0);
  const mat = (it.consumables || []).reduce((s, c) => s + (findItem(c.code, items)?.price ?? 0) * c.qty, 0);
  return { labor, mat, total: labor + mat };
};

export type RecipeCost = {
  /** 材料小计（材料 + 设备行，自动按引用单价合计） */
  mat: number;
  /** 人工小计（服务行的人工构成 + 嵌套子套件的人工部分） */
  labor: number;
  /** 套件成本 = 材料小计 + 人工小计 */
  total: number;
  sale: number; gross: number;
  /** 缺料项数（引用不存在 / 库存不足） */
  short: number;
  lineCnt: number;
  /** 引用不到的主数据编码 */
  miss: string[];
};

/** 计算来源：不传则用数据层基线；传入页面内的可写副本即可做编辑态实时汇总 */
export type RecipeSource = {
  items?: Item[];
  recipes?: Record<string, { pid: string; cur: string; versions: RecipeVersion[] }>;
};

/** 配方成本核算：材料小计 / 人工小计 / 套件成本 / 对外价 / 毛利率 */
export function recipeCost(pid: string, ver?: string, opts?: RecipeSource): RecipeCost {
  const src = opts?.recipes ?? RECIPES;
  const R = src[pid];
  const empty: RecipeCost = { mat: 0, labor: 0, total: 0, sale: 0, gross: 0, short: 0, lineCnt: 0, miss: [] };
  if (!R) return empty;
  const v = R.versions.find((x) => x.v === (ver || R.cur)) || R.versions[0];
  let mat = 0; let labor = 0; let short = 0;
  const miss: string[] = [];
  v.lines.forEach((l) => {
    const ref = findItem(l.code, opts?.items);
    if (!ref) { miss.push(l.code); short += 1; return; }
    if (l.kind === '服务') {
      labor += serviceCost(l.code, opts?.items).total * l.qty;
    } else if (l.kind === '套件') {
      /* 嵌套子套件：材料部分计入材料小计、人工部分计入人工小计，保证「成本 = 材料 + 人工」口径不破 */
      const sub = recipeCost(l.code, undefined, opts);
      mat += sub.mat * l.qty;
      labor += sub.labor * l.qty;
      if (sub.short > 0) short += 1;
    } else {
      const p = l.lockedPrice ?? ref.price;
      mat += p * l.qty * (1 + (l.loss ?? 0) / 100);
      if (ref.stock < l.qty) short += 1;
    }
  });
  mat = Math.round(mat); labor = Math.round(labor);
  const total = mat + labor;
  const sale = findItem(pid, opts?.items)?.sale ?? 0;
  const gross = sale ? Math.round(((sale - total) / sale) * 1000) / 10 : 0;
  return { mat, labor, total, sale, gross, short, lineCnt: v.lines.length, miss };
}

/** 兼容旧调用名：原「BOM 成本」= 配方成本 */
export const bomCost = recipeCost;

/**
 * 强制认证继承：套件 / 服务自身不发证，但配方（含耗材）中任一硬件在强制目录内即继承。
 * 用于主数据列表的「强制（继承）」徽标 —— 与合规台账同源，不额外维护。
 */
export const inheritsMand = (code: string): boolean => {
  const it = itemByCode(code);
  if (!it) return false;
  if (it.ty === '材料' || it.ty === '设备') return it.mand;
  const codes: string[] = [];
  if (it.consumables) it.consumables.forEach((c) => codes.push(c.code));
  const R = RECIPES[code];
  if (R) {
    const v = R.versions.find((x) => x.v === R.cur) || R.versions[0];
    v.lines.forEach((l) => codes.push(l.code));
  }
  return codes.some((c) => { const x = itemByCode(c); return !!x && (x.mand || inheritsMand(c)); });
};

/** 建议对外价：按目标毛利率反算（用于负毛利 / 低毛利的「调价」动作） */
export const suggestSale = (cost: number, targetGross = 25) =>
  Math.ceil(cost / (1 - targetGross / 100) / 10) * 10;

/* ============================ 变更日志（主数据留痕） ============================ */
export const CHANGE_LOGS = [
  { t: '2026-09-21 09:12', who: '王敏', obj: '分类目录', act: '新增子分类「管阀件」于 材料目录 / 消防水', tone: 'blue' as const },
  { t: '2026-09-20 16:40', who: '徐工', obj: '产品 CP000041', act: 'BOM 升级 V1.1 → V1.2（旧版快照保留）', tone: 'orange' as const },
  { t: '2026-09-19 11:05', who: '张仓', obj: '材料 CL000226', act: '安全库存 15 → 15（确认），单位改为「套」', tone: 'gray' as const },
  { t: '2026-09-18 15:22', who: '王敏', obj: '认证标记', act: '新增「型式检验报告」类型，适用消防产品', tone: 'green' as const },
  { t: '2026-09-17 10:08', who: '徐工', obj: '单位字典', act: '停用单位「处」，已有 3 条材料引用需改单位', tone: 'red' as const },
  { t: '2026-09-15 09:30', who: '何总', obj: '价格浮率', act: '消防电整体浮率 25% → 24%（区域上浮规则不变）', tone: 'orange' as const },
];

/* 材料 / 设备 / 服务 / 套件已合并为统一主数据 ITEMS（见上方「统一主数据」段）。 */

/* ============================ 发票（FP + 6 位流水） ============================ */
export const INVOICES = [
  { id: 'FP000007', type: '增值税专用发票', no: '011002500111', date: '2026-09-12', buyer: '昆明万达广场商业管理有限公司', amt: 328000, taxRate: 9, tax: 29500, total: 357500, contract: 'HT000009', status: '正常', mode: '含税' },
  { id: 'FP000004', type: '增值税专用发票', no: '011002500087', date: '2026-09-05', buyer: '楚雄州人民医院', amt: 480000, taxRate: 9, tax: 43200, total: 523200, contract: 'WB000003', status: '正常', mode: '含税' },
  { id: 'FP000003', type: '增值税普通发票', no: '011002500076', date: '2026-08-25', buyer: '丽江××文旅开发集团', amt: 600000, taxRate: 6, tax: 36000, total: 636000, contract: 'HT000005', status: '正常', mode: '含税' },
  { id: 'FP000002', type: '增值税专用发票', no: '011002500065', date: '2026-08-20', buyer: '××工业园区开发有限公司', amt: 780000, taxRate: 9, tax: 70200, total: 850200, contract: 'HT000002', status: '已红字冲销', mode: '含税' },
  { id: 'FP000001', type: '增值税专用发票', no: '011002500041', date: '2026-08-10', buyer: '昆明万达广场商业管理有限公司', amt: 120000, taxRate: 6, tax: 7200, total: 127200, contract: 'FK000001', status: '作废', mode: '含税' },
];

/* ============================ 审批（SP + 日期 + 序） ============================ */
export const APPROVALS = [
  // M29：node 为 0-based 审批链下标（0 = 发起），node > 1 表示已有决策节点通过 → 状态须为「审批中」而非「待审批」
  // cc = 抄送人列表（知会性质，不占待办；参考《审批中心》四 Tab 口径之「抄送我的」）
  { id: 'SP-2026-0924-01', ap: '蓝峰', type: '报价审批', obj: '昆明市第一人民医院住院楼消防升级报价', ref: 'BJ000011 报价单 V2', amt: 4800000, time: '2026-09-24 10:24', status: '审批中', level: '总经理', node: 2, reason: '', cc: ['李思敏', '蓝峰'] },
  { id: 'SP-2026-0923-01', ap: '赵薇', type: '合同审批', obj: '楚雄州人民医院消防维护保养合同（2027）', ref: 'WB000003 维护保养合同', amt: 960000, time: '2026-09-23 09:41', status: '待审批', level: '部门负责人', node: 1, reason: '', cc: ['李思敏'] },
  { id: 'SP-2026-0922-01', ap: '蓝峰', type: '变更审批', obj: '昆明万达广场消防改造 · 设计变更（增机房气体灭火）', ref: 'BG000009 变更单', amt: 80000, time: '2026-09-22 16:05', status: '待审批', level: '部门负责人', node: 1, reason: '', cc: [] },
  { id: 'SP-2026-0921-01', ap: '陈静', type: '付款申请', obj: '消防设备采购付款（报警系统）', ref: 'PF000031 付款单', amt: 258000, time: '2026-09-21 14:32', status: '待审批', level: '分管副总', node: 1, reason: '', cc: ['蓝峰'] },
  { id: 'SP-2026-0920-02', ap: '蓝峰', type: '合同审批', obj: '昆明万达广场消防改造工程合同', ref: 'HT000009 销售合同', amt: 3280000, time: '2026-09-20 11:18', status: '已通过', level: '总经理', node: 3, reason: '', cc: ['李思敏', '蓝峰'] },
  { id: 'SP-2026-0919-03', ap: '赵薇', type: '报价审批', obj: '柳州钢铁厂区消防管网改造报价', ref: 'BJ000001 报价单 V2', amt: 5600000, time: '2026-09-19 15:50', status: '已通过', level: '总经理', node: 3, reason: '', cc: ['蓝峰'] },
  { id: 'SP-2026-0918-01', ap: '李思敏', type: '变更审批', obj: '丽江景区智慧消防平台 · 范围变更', ref: 'BG000008 变更单', amt: 120000, time: '2026-09-18 10:15', status: '已退回', level: '部门负责人', node: 1, reason: '变更依据不足，需补充发包方书面确认函', cc: ['蓝峰'] },
  { id: 'SP-2026-0917-01', ap: '行政', type: '借阅申请', obj: '合同借阅（昆明万达广场合同扫描件）', ref: 'JY000017 借阅单', amt: 0, time: '2026-09-17 09:08', status: '已通过', level: '部门负责人', node: 1, reason: '', cc: ['蓝峰', '李思敏'] },
];

/* ============================ 文档（DOC + 4 位） ============================ */
export const DOC_STAGES = ['投标', '合同', '施工', '验收', '竣工'] as const;

/** 文档分类导航（消防行业口径 · 一级分类 + 二级子类） */
export const DOC_CATS = [
  { key: '资质证照', icon: 'trophy', subs: ['营业执照', '资质证书', '人员证书', '安全生产许可证'] },
  { key: '招投标', icon: 'mail', subs: ['招标文件', '投标文件', '中标通知书', '答疑澄清'] },
  { key: '合同协议', icon: 'file', subs: ['主合同', '补充协议', '安全协议', '技术协议'] },
  { key: '施工过程', icon: 'building', subs: ['施工组织设计', '技术交底', '隐蔽验收记录', '材料合格证', '影像资料'] },
  { key: '检测报告', icon: 'search', subs: ['第三方检测', '联动测试', '材料送检'] },
  { key: '验收交付', icon: 'checkCircle', subs: ['验收查验记录', '竣工图', '竣工验收报告', '移交清单'] },
  { key: '维护保养记录', icon: 'wrench', subs: ['巡检记录', '维修工单', '年度检测'] },
  { key: '财务票据', icon: 'receipt', subs: ['发票', '结算单', '付款凭证'] },
  { key: '体系文件', icon: 'book', subs: ['管理制度', '作业指导书', '表单模板'] },
] as const;

/** 文档状态 */
export const DOC_STATUS = ['已归档', '待审核', '已作废'] as const;

export const DOCS = [
  { id: 'DOC0001', name: '招标文件-昆明万达广场消防改造.pdf', cat: '招投标', sub: '招标文件', type: '招标文件', proj: 'XM000123', contract: '', stage: '投标', by: '蓝峰', date: '2026-09-08', size: '4.2 MB', need: true, ver: 'V1', status: '已归档', tags: ['万达', '公开招标'], summary: '招标人昆明万达广场商业管理有限公司，工期 120 天，控制价 328 万。', dl: 42, vis: '项目成员' },
  { id: 'DOC0002', name: '投标文件-昆明万达广场消防改造.pdf', cat: '招投标', sub: '投标文件', type: '投标文件', proj: 'XM000123', contract: '', stage: '投标', by: '蓝峰', date: '2026-09-20', size: '18.6 MB', need: true, ver: 'V3', status: '已归档', tags: ['万达', '技术标', '商务标'], summary: '含技术标（施工方案 / 进度计划）与商务标（清单报价）全套，V3 为递交终版。', dl: 88, vis: '项目成员' },
  { id: 'DOC0003', name: '中标通知书-昆明万达广场.pdf', cat: '招投标', sub: '中标通知书', type: '中标通知书', proj: 'XM000123', contract: 'HT000009', stage: '合同', by: '系统', date: '2026-09-12', size: '540 KB', need: true, ver: 'V1', status: '已归档', tags: ['万达', '中标'], summary: '中标价 328 万，要求 30 日内签订合同并缴纳履约保证金 5%。', dl: 31, vis: '全员可见' },
  { id: 'DOC0004', name: '主合同-昆明万达广场消防改造（签署版）.pdf', cat: '合同协议', sub: '主合同', type: '主合同', proj: 'XM000123', contract: 'HT000009', stage: '合同', by: '蓝峰', date: '2026-09-12', size: '8.8 MB', need: true, ver: 'V2', status: '已归档', tags: ['万达', '双签', '质保金3%'], summary: '合同额 328 万，含税；质保金 3%（法定上限，验收满 12 个月返还）；四期收款。', dl: 156, vis: '项目成员' },
  { id: 'DOC0005', name: '安全协议-昆明万达广场.pdf', cat: '合同协议', sub: '安全协议', type: '安全协议', proj: 'XM000123', contract: 'HT000009', stage: '合同', by: '蓝峰', date: '2026-09-12', size: '1.2 MB', need: true, ver: 'V1', status: '已归档', tags: ['万达', '安全生产'], summary: '明确甲乙双方安全责任、动火审批流程与现场监护人配置。', dl: 27, vis: '项目成员' },
  { id: 'DOC0006', name: '技术协议-报警系统接入.pdf', cat: '合同协议', sub: '技术协议', type: '技术协议', proj: 'XM000123', contract: 'HT000009', stage: '合同', by: '陈静', date: '2026-09-14', size: '2.1 MB', need: false, ver: 'V1', status: '已归档', tags: ['报警系统', '接入'], summary: '约定火灾报警主机点位表、通讯协议与联动逻辑接口。', dl: 19, vis: '项目成员' },
  { id: 'DOC0007', name: '隐蔽工程验收记录-喷淋管网.pdf', cat: '施工过程', sub: '隐蔽验收记录', type: '隐蔽验收记录', proj: 'XM000123', contract: '', stage: '施工', by: '张工', date: '2026-09-16', size: '3.4 MB', need: true, ver: 'V1', status: '已归档', tags: ['喷淋', '隐蔽', '监理签字'], summary: 'F1–F3 喷淋管网试压 1.2MPa 保压 30min 无渗漏，监理已签字确认。', dl: 34, vis: '项目成员' },
  { id: 'DOC0008', name: '材料合格证-火灾报警控制器.pdf', cat: '施工过程', sub: '材料合格证', type: '合格证', proj: 'XM000123', contract: '', stage: '施工', by: '资料管理员', date: '2026-09-15', size: '820 KB', need: true, ver: 'V1', status: '已归档', tags: ['强制性认证', '报警控制器'], summary: 'JB-QB-GST5000 型，强制性产品认证（CCC/CCCF）编号 20260815XX，出厂检验合格。', dl: 22, vis: '项目成员' },
  { id: 'DOC0009', name: '材料合格证-感烟探测器.pdf', cat: '施工过程', sub: '材料合格证', type: '合格证', proj: 'XM000123', contract: '', stage: '施工', by: '资料管理员', date: '2026-09-15', size: '760 KB', need: true, ver: 'V1', status: '已归档', tags: ['强制性认证', '感烟'], summary: 'JTY-GD-G3T 型点型光电感烟探测器，批次 2026-08-12，共 860 只。', dl: 21, vis: '项目成员' },
  { id: 'DOC0010', name: '检测报告-消防联动测试.pdf', cat: '检测报告', sub: '联动测试', type: '检测报告', proj: 'XM000123', contract: '', stage: '验收', by: '消防技术服务机构', date: '2026-09-19', size: '5.6 MB', need: true, ver: 'V2', status: '已归档', tags: ['联动', '第三方', '合格'], summary: '云南省消防技术服务机构出具；联动逻辑、喷淋泵、防排烟均判定合格。', dl: 67, vis: '全员可见' },
  { id: 'DOC0011', name: '维护保养合同-楚雄州医院（扫描件）.pdf', cat: '合同协议', sub: '主合同', type: '主合同', proj: 'XM000118', contract: 'WB000003', stage: '合同', by: '赵薇', date: '2026-09-01', size: '6.2 MB', need: true, ver: 'V1', status: '已归档', tags: ['维护保养', '医院'], summary: '年度维护保养 48 万，含季度巡检 ×4 与 24h 应急响应。', dl: 45, vis: '项目成员' },
  { id: 'DOC0012', name: '竣工图-昆明万达广场 F2 层.dwg', cat: '验收交付', sub: '竣工图', type: '图纸', proj: 'XM000123', contract: '', stage: '竣工', by: '设计单位', date: '2026-09-22', size: '28.4 MB', need: true, ver: 'V2', status: '待审核', tags: ['竣工图', 'CAD', '待审'], summary: 'F2 层喷淋、报警、防排烟综合竣工图，含现场变更标注（云线）。', dl: 12, vis: '项目成员' },
  { id: 'DOC0013', name: '消防设施检测报告-柳州钢铁.pdf', cat: '检测报告', sub: '第三方检测', type: '检测报告', proj: 'XM000131', contract: 'HT000011', stage: '验收', by: '消防技术服务机构', date: '2026-09-18', size: '6.8 MB', need: true, ver: 'V1', status: '已归档', tags: ['柳钢', '第三方', '合格'], summary: '厂区消防管网及室外栓系统检测，结论：符合 GB50974 要求。', dl: 38, vis: '项目成员' },
  { id: 'DOC0014', name: '营业执照-云南诺安消防工程有限公司.pdf', cat: '资质证照', sub: '营业执照', type: '营业执照', proj: '', contract: '', stage: '投标', by: '行政', date: '2026-03-02', size: '1.1 MB', need: false, ver: 'V1', status: '已归档', tags: ['公司', '三证合一'], summary: '统一社会信用代码 91530100XXXX，经营范围含消防设施工程施工。', dl: 210, vis: '全员可见' },
  { id: 'DOC0015', name: '消防设施工程专业承包一级资质.pdf', cat: '资质证照', sub: '资质证书', type: '资质证书', proj: '', contract: '', stage: '投标', by: '行政', date: '2026-04-18', size: '980 KB', need: false, ver: 'V1', status: '已归档', tags: ['一级资质', '投标必备'], summary: '证书编号 D2-XXXX，有效期至 2029-04-17；投标资格审查必备。', dl: 188, vis: '全员可见' },
  { id: 'DOC0016', name: '一级注册消防工程师-蓝峰.pdf', cat: '资质证照', sub: '人员证书', type: '人员证书', proj: '', contract: '', stage: '投标', by: '行政', date: '2026-05-06', size: '640 KB', need: false, ver: 'V1', status: '已归档', tags: ['注册消防工程师', '蓝峰'], summary: '注册编号 XF2026XXXX，注册有效期至 2029-05-05。', dl: 33, vis: '仅上传者与管理员' },
  { id: 'DOC0017', name: '安全生产许可证.pdf', cat: '资质证照', sub: '安全生产许可证', type: '安全生产许可证', proj: '', contract: '', stage: '投标', by: '行政', date: '2026-06-11', size: '720 KB', need: false, ver: 'V1', status: '已归档', tags: ['安许', '到期预警'], summary: '编号（云）JZ安许证〔2026〕XXXX，有效期至 2027-06-10。', dl: 96, vis: '全员可见' },
  { id: 'DOC0018', name: '答疑澄清函-昆明万达广场（第 02 号）.pdf', cat: '招投标', sub: '答疑澄清', type: '答疑澄清', proj: 'XM000123', contract: '', stage: '投标', by: '蓝峰', date: '2026-09-10', size: '460 KB', need: false, ver: 'V1', status: '已归档', tags: ['万达', '答疑'], summary: '招标人回复：报警主机品牌可替换同等档次；工期不可顺延。', dl: 16, vis: '项目成员' },
  { id: 'DOC0019', name: '补充协议-增项报警点位 120 个.pdf', cat: '合同协议', sub: '补充协议', type: '补充协议', proj: 'XM000123', contract: 'HT000009', stage: '施工', by: '蓝峰', date: '2026-09-18', size: '1.6 MB', need: true, ver: 'V1', status: '待审核', tags: ['增项', '变更', '待审'], summary: '发包方书面确认增补报警点位 120 个，增项金额 12.8 万，走变更审批。', dl: 9, vis: '项目成员' },
  { id: 'DOC0020', name: '施工组织设计-昆明万达广场消防改造.pdf', cat: '施工过程', sub: '施工组织设计', type: '施工组织设计', proj: 'XM000123', contract: '', stage: '施工', by: '张工', date: '2026-09-13', size: '9.4 MB', need: true, ver: 'V2', status: '已归档', tags: ['万达', '专项方案'], summary: '含进度横道图、劳动力计划、动火作业专项方案与应急预案。', dl: 52, vis: '项目成员' },
  { id: 'DOC0021', name: '技术交底记录-喷淋支管安装.pdf', cat: '施工过程', sub: '技术交底', type: '技术交底', proj: 'XM000123', contract: '', stage: '施工', by: '张工', date: '2026-09-15', size: '1.4 MB', need: false, ver: 'V1', status: '已归档', tags: ['交底', '喷淋', '签字'], summary: '向班组交底支管坡度、支架间距与试压要求，8 人签字。', dl: 14, vis: '项目成员' },
  { id: 'DOC0022', name: '现场影像-管网试压（照片 ×18）.zip', cat: '施工过程', sub: '影像资料', type: '影像资料', proj: 'XM000123', contract: '', stage: '施工', by: '张工', date: '2026-09-17', size: '46.2 MB', need: true, ver: 'V1', status: '已归档', tags: ['影像', '水印', 'GPS'], summary: '试压过程照片 18 张，带水印（拍摄人 + 时间 + GPS）。', dl: 11, vis: '项目成员' },
  { id: 'DOC0023', name: '竣工验收消防查验记录-昆明万达广场（三方签字）.pdf', cat: '验收交付', sub: '验收查验记录', type: '验收查验记录', proj: 'XM000123', contract: 'HT000009', stage: '验收', by: '蓝峰', date: '2026-09-21', size: '2.3 MB', need: true, ver: 'V1', status: '已归档', tags: ['验收', '三方签字', '必备'], summary: '建设 / 施工 / 监理三方签字，消防验收申报必备件。', dl: 29, vis: '项目成员' },
  { id: 'DOC0024', name: '竣工验收报告-昆明万达广场消防改造.pdf', cat: '验收交付', sub: '竣工验收报告', type: '竣工验收报告', proj: 'XM000123', contract: 'HT000009', stage: '竣工', by: '蓝峰', date: '2026-09-22', size: '7.9 MB', need: true, ver: 'V1', status: '待审核', tags: ['竣工', '待审'], summary: '含验收组意见、整改闭环记录与质量评定，待质监站备案。', dl: 6, vis: '项目成员' },
  { id: 'DOC0025', name: '竣工资料移交清单.pdf', cat: '验收交付', sub: '移交清单', type: '移交清单', proj: 'XM000123', contract: 'HT000009', stage: '竣工', by: '资料管理员', date: '2026-09-22', size: '880 KB', need: true, ver: 'V1', status: '已归档', tags: ['移交', '清单'], summary: '共 6 卷 42 份，发包方资料室签收，双方签字确认。', dl: 8, vis: '项目成员' },
  { id: 'DOC0026', name: '季度巡检记录-楚雄州医院 2026Q3.pdf', cat: '维护保养记录', sub: '巡检记录', type: '巡检记录', proj: 'XM000118', contract: 'WB000003', stage: '竣工', by: '维护保养班组', date: '2026-09-15', size: '3.1 MB', need: true, ver: 'V1', status: '已归档', tags: ['维护保养', '季度巡检'], summary: '巡检点位 486 个，故障 3 处已闭环（更换喷头 ×2、模块 ×1）。', dl: 17, vis: '项目成员' },
  { id: 'DOC0027', name: '维修工单-报警主机通讯故障.pdf', cat: '维护保养记录', sub: '维修工单', type: '维修工单', proj: 'XM000118', contract: 'WB000003', stage: '竣工', by: '维护保养班组', date: '2026-09-19', size: '1.1 MB', need: false, ver: 'V1', status: '已归档', tags: ['工单', '闭环'], summary: '回路板通讯中断，更换 RS485 模块后恢复，工单已闭环。', dl: 5, vis: '项目成员' },
  { id: 'DOC0028', name: '年度消防设施检测报告-楚雄州医院.pdf', cat: '维护保养记录', sub: '年度检测', type: '年度检测', proj: 'XM000118', contract: 'WB000003', stage: '竣工', by: '消防技术服务机构', date: '2026-08-28', size: '5.2 MB', need: true, ver: 'V1', status: '已归档', tags: ['年度检测', '医院'], summary: '依据 GB25201 年度检测，综合判定合格，有效期 12 个月。', dl: 13, vis: '项目成员' },
  { id: 'DOC0029', name: '进度结算单-昆明万达广场（第三期）.pdf', cat: '财务票据', sub: '结算单', type: '结算单', proj: 'XM000123', contract: 'HT000009', stage: '施工', by: '陈静', date: '2026-09-18', size: '1.8 MB', need: false, ver: 'V2', status: '已归档', tags: ['结算', '进度款'], summary: '本期完成产值 96 万，累计 232 万；监理与发包方已确认。', dl: 24, vis: '项目成员' },
  { id: 'DOC0030', name: '增值税专用发票-万达进度款（128 万）.pdf', cat: '财务票据', sub: '发票', type: '发票', proj: 'XM000123', contract: 'HT000009', stage: '施工', by: '财务', date: '2026-09-19', size: '620 KB', need: false, ver: 'V1', status: '已作废', tags: ['发票', '已红字冲销'], summary: '原票税率填开错误，已于 2026-09-20 红字冲销并重开（同金额）。', dl: 3, vis: '仅上传者与管理员' },
  { id: 'DOC0031', name: '动火作业管理制度（2026 版）.pdf', cat: '体系文件', sub: '管理制度', type: '管理制度', proj: '', contract: '', stage: '施工', by: '安全部', date: '2026-01-15', size: '2.6 MB', need: false, ver: 'V3', status: '已归档', tags: ['制度', '动火'], summary: '三级动火审批、现场监护与应急器材配置要求，2026 版修订。', dl: 74, vis: '全员可见' },
  { id: 'DOC0032', name: '喷淋安装作业指导书.pdf', cat: '体系文件', sub: '作业指导书', type: '作业指导书', proj: '', contract: '', stage: '施工', by: '技术部', date: '2026-02-20', size: '3.3 MB', need: false, ver: 'V2', status: '已归档', tags: ['SOP', '喷淋'], summary: '支吊架间距、喷头间距与梁底距离的标准化做法图示。', dl: 61, vis: '全员可见' },
  { id: 'DOC0033', name: '隐蔽验收记录表（空白模板）.xlsx', cat: '体系文件', sub: '表单模板', type: '表单模板', proj: '', contract: '', stage: '施工', by: '资料管理员', date: '2026-01-08', size: '48 KB', need: false, ver: 'V1', status: '已归档', tags: ['模板', '表单'], summary: '现场填写后 24h 内上传归档，逾期在竣工资料完整度中扣分。', dl: 132, vis: '全员可见' },
  { id: 'DOC0034', name: '检测方案-磷化工厂区消防设施检测.docx', cat: '招投标', sub: '技术协议', type: '技术协议', proj: 'XM000142', contract: '', stage: '投标', by: '赵薇', date: '2026-08-12', size: '1.6 MB', need: true, ver: 'V2', status: '已归档', tags: ['磷化工', '检测方案', '危化'], summary: '含火灾自动报警、消火栓、泡沫灭火系统检测范围与停产窗口排期。', dl: 16, vis: '项目成员' },
  { id: 'DOC0035', name: '技术协议-磷化工厂区消防设施检测.pdf', cat: '合同协议', sub: '技术协议', type: '技术协议', proj: 'XM000142', contract: 'HT000007', stage: '合同', by: '赵薇', date: '2026-08-20', size: '2.3 MB', need: true, ver: 'V1', status: '已归档', tags: ['磷化工', '技术协议'], summary: '约定检测项 128 项、出具报告时限 7 个工作日、复检一次免费。', dl: 21, vis: '项目成员' },
  { id: 'DOC0036', name: '消防设施检测报告-磷化工厂区（阶段性）.pdf', cat: '检测报告', sub: '第三方检测', type: '第三方检测', proj: 'XM000142', contract: 'HT000007', stage: '施工', by: '陈工', date: '2026-09-15', size: '9.8 MB', need: true, ver: 'V1', status: '已归档', tags: ['磷化工', '检测报告', '危化'], summary: '已完成罐区泡沫灭火系统与报警联动检测，不合格项 4 项待整改复检。', dl: 33, vis: '项目成员' },
  { id: 'DOC0037', name: '年度检测报告-长水机场航站楼消防设施.pdf', cat: '检测报告', sub: '第三方检测', type: '第三方检测', proj: 'XM000136', contract: 'HT000004', stage: '施工', by: '王工', date: '2026-09-10', size: '14.2 MB', need: true, ver: 'V2', status: '已归档', tags: ['长水机场', '年度检测', '交通枢纽'], summary: '按 GA 503 年度检测口径完成，覆盖航站楼防火分区、排烟与应急照明。', dl: 57, vis: '项目成员' },
  { id: 'DOC0038', name: '巡检记录-长水机场航站楼消防设施（9 月）.xlsx', cat: '维护保养记录', sub: '巡检记录', type: '巡检记录', proj: 'XM000136', contract: 'HT000004', stage: '施工', by: '李工', date: '2026-09-18', size: '860 KB', need: false, ver: 'V1', status: '已归档', tags: ['长水机场', '巡检'], summary: '月度巡检 36 点位，隐患 2 项已闭环。', dl: 12, vis: '项目成员' },
  { id: 'DOC0039', name: '施工组织设计-柳钢厂区消防管网改造.pdf', cat: '施工过程', sub: '施工组织设计', type: '施工组织设计', proj: 'XM000131', contract: 'HT000013', stage: '施工', by: '王工', date: '2026-08-05', size: '6.4 MB', need: true, ver: 'V1', status: '已归档', tags: ['柳钢', '管网改造', '电力/制造'], summary: '含管网走向、动火作业审批与厂区夜间施工窗口安排。', dl: 28, vis: '项目成员' },
  { id: 'DOC0040', name: '隐蔽验收记录-柳钢厂区消防管网埋地段.pdf', cat: '施工过程', sub: '隐蔽验收记录', type: '隐蔽验收记录', proj: 'XM000131', contract: 'HT000013', stage: '施工', by: '王工', date: '2026-09-02', size: '3.1 MB', need: true, ver: 'V1', status: '已归档', tags: ['柳钢', '隐蔽验收'], summary: '埋地管网 1.8km 分段验收，监理与甲方签字齐全。', dl: 19, vis: '项目成员' },
  { id: 'DOC0041', name: '材料送检报告-柳钢项目镀锌钢管.pdf', cat: '检测报告', sub: '材料送检', type: '材料送检', proj: 'XM000131', contract: 'HT000013', stage: '施工', by: '陈工', date: '2026-09-12', size: '2.7 MB', need: true, ver: 'V1', status: '待审核', tags: ['柳钢', '材料送检'], summary: '镀锌钢管壁厚与耐压送检合格，待第三方签章确认。', dl: 8, vis: '项目成员' },
  { id: 'DOC0042', name: '巡检记录-楚雄州人民医院消防维保（9 月）.xlsx', cat: '维护保养记录', sub: '巡检记录', type: '巡检记录', proj: 'XM000118', contract: 'HT000003', stage: '施工', by: '李工', date: '2026-09-16', size: '720 KB', need: false, ver: 'V1', status: '已归档', tags: ['楚雄医院', '巡检', '医疗'], summary: '月度维保巡检 24 点位，故障 1 项已处理。', dl: 14, vis: '项目成员' },
  { id: 'DOC0043', name: '技术交底-丽江智慧消防平台设备安装.pdf', cat: '施工过程', sub: '技术交底', type: '技术交底', proj: 'XM000105', contract: '', stage: '施工', by: '王工', date: '2026-09-09', size: '2.2 MB', need: true, ver: 'V1', status: '已归档', tags: ['丽江', '智慧消防', '文旅'], summary: '含摄像头、烟感与平台联调要点，景区施工需避开营业时段。', dl: 11, vis: '项目成员' },
];

/** 文档版本记录（按文档编号归集） */
export const DOC_VERSIONS = [
  { doc: 'DOC0002', ver: 'V3', by: '蓝峰', date: '2026-09-20', size: '18.6 MB', note: '递交终版 · 商务标报价微调（下调 1.8%）' },
  { doc: 'DOC0002', ver: 'V2', by: '蓝峰', date: '2026-09-16', size: '18.1 MB', note: '按答疑 02 号替换报警主机品牌' },
  { doc: 'DOC0002', ver: 'V1', by: '蓝峰', date: '2026-09-11', size: '17.4 MB', note: '初版' },
  { doc: 'DOC0004', ver: 'V2', by: '蓝峰', date: '2026-09-12', size: '8.8 MB', note: '双方签署版（含骑缝章）' },
  { doc: 'DOC0004', ver: 'V1', by: '蓝峰', date: '2026-09-10', size: '8.6 MB', note: '法务审核稿' },
  { doc: 'DOC0010', ver: 'V2', by: '消防技术服务机构', date: '2026-09-19', size: '5.6 MB', note: '补充防排烟联动测试页' },
  { doc: 'DOC0010', ver: 'V1', by: '消防技术服务机构', date: '2026-09-17', size: '4.9 MB', note: '初次出具' },
  { doc: 'DOC0012', ver: 'V2', by: '设计单位', date: '2026-09-22', size: '28.4 MB', note: '按现场变更补绘 F2 层喷淋走向' },
  { doc: 'DOC0012', ver: 'V1', by: '设计单位', date: '2026-09-20', size: '26.1 MB', note: '初版竣工图' },
];

/** 文档操作记录（全量留痕） */
export const DOC_LOGS = [
  { doc: 'DOC0010', act: '下载', by: '蓝峰', time: '2026-09-20 09:12', note: '带水印下载' },
  { doc: 'DOC0010', act: '在线发送', by: '蓝峰', time: '2026-09-20 09:20', note: '发给发包方 · 有效期 7 天' },
  { doc: 'DOC0004', act: '预览', by: '陈静', time: '2026-09-19 16:04', note: '在线预览 · 水印' },
  { doc: 'DOC0012', act: '上传新版本', by: '设计单位', time: '2026-09-22 10:31', note: 'V1 → V2' },
  { doc: 'DOC0029', act: '版本替换', by: '陈静', time: '2026-09-18 14:47', note: 'V1 → V2（发包方确认后）' },
  { doc: 'DOC0030', act: '作废', by: '财务', time: '2026-09-20 11:02', note: '税率填开错误 · 已红字冲销' },
];

/* ============================ 跟进记录（客户跟进闭环） ============================ */
export const FOLLOWS = [
  { id: 'GJ0001', customerId: 'KH20260312001', way: '上门拜访', date: '2026-09-14', by: '蓝峰', text: '现场勘察消防主机房与管网走向（照片 ×6 · 水印）', photo: 6, gps: '昆明市西山区前兴路 688 号' },
  { id: 'GJ0002', customerId: 'KH20260312001', way: '电话', date: '2026-09-18', by: '蓝峰', text: '确认预算口径与招标时间', photo: 0, gps: '' },
  { id: 'GJ0003', customerId: 'KH20260312001', way: '微信/邮件', date: '2026-08-30', by: '蓝峰', text: '发送公司资质与业绩案例', photo: 0, gps: '' },
  { id: 'GJ0004', customerId: 'KH20260418003', way: '会议', date: '2026-09-16', by: '王志海', text: '院感科与基建处联合评审会，确认夜间施工方案（照片 ×3 · 水印）', photo: 3, gps: '昆明市第一人民医院行政楼 3F' },
];

/* ============================ 经营驾驶舱 · 风险 Top6 ============================ */
export const RISKS = [
  { tone: 'orange', t: '已开票未到账 · 昆明万达广场', d: '进度款 40% 已开票未到账 · 账龄 75 天（60-90 天档）· ¥33.75 万', amt: 337500, owner: '蓝峰' },
  { tone: 'red', t: '成本超支 · XM000123 昆明万达广场', d: '实际成本 142.30 万超立项预算 130 万 · 超支 ¥12.3 万（9.5%）', amt: 123000, owner: '张工' },
  { tone: 'orange', t: '进度黄警 · XM000123 昆明万达广场', d: '实际 70% vs 计划应到 82% · 偏差 -12%（≥10% 黄警）', amt: 0, owner: '张工' },
  { tone: 'red', t: '安全生产许可证已过期', d: 'ZS000044 · 已过期 · 全部投标废标，先续期再投标', amt: 0, owner: '行政' },
  { tone: 'orange', t: '无合同施工 · XM000098 酒店应急抢修', d: '已施工 68 天仍未补签合同 · ¥18.6 万成本无归口', amt: 186000, owner: '周斌' },
  { tone: 'gray', t: '沉默客户 · 昆明滇池度假区', d: '92 天未跟进 · 历史成交 ¥180 万', amt: 1800000, owner: '刘宇' },
];

/* ============================ 收付款计划（可请款池） ============================ */
export const RECEIVABLES = [
  { id: 'YS0001', contract: 'HT000009', customer: '昆明万达广场商业管理有限公司', node: '进度款 40%（已开票未到账）', amt: 337500, dueDate: '2026-07-20', status: '已开票未到账', overdueDays: 75, owner: '蓝峰' },
  { id: 'YS0002', contract: 'HT000002', customer: '××工业园区开发有限公司', node: '竣工款 25%', amt: 650000, dueDate: '2026-10-31', status: '可请款', overdueDays: 0, owner: '周斌' },
  { id: 'YS0003', contract: 'WB000003', customer: '楚雄州人民医院', node: '第二期 50%', amt: 480000, dueDate: '2027-03-01', status: '未到期', overdueDays: 0, owner: '赵薇' },
  { id: 'YS0004', contract: 'HT000005', customer: '丽江××文旅开发集团', node: '验收款 75%', amt: 1800000, dueDate: '2026-11-30', status: '未到期', overdueDays: 0, owner: '陈静' },
  { id: 'YS0005', contract: 'HT000011', customer: '广西柳州钢铁集团有限公司', node: '预付款 20%', amt: 1120000, dueDate: '2026-10-08', status: '可请款', overdueDays: 0, owner: '赵薇' },
];

/* ============================ 工具函数 ============================ */
export const fmt = (n: number) => '¥' + Math.round(n).toLocaleString('en-US');
export const fmtWan = (n: number) => {
  if (!n) return '¥0';
  const w = n / 10000;
  return '¥' + (Number.isInteger(w) ? w : w.toFixed(1)) + '万';
};

/* ==================================================================
 * 全局显示规范（评审「四、全局三张规范表」—— 一次定死，全站生效）
 * ------------------------------------------------------------------
 * ① 单位：金额 ≥ 1 万 → 「¥X.XX万」（2 位小数，整数万不带小数）；< 1 万 → 「¥X,XXX」（元）。
 *    需要精确元值时，把原始值放进 title / Tooltip。
 * ② 百分比：一律 1 位小数。
 * ③ 单号：前缀 + 6 位流水（SJ / BJ / HT / CG / CB / PF / BG / QK / HC / SK / BZ / FP / WB / FK / XM）。
 *    历史短号（无日期段或流水不足 4 位）按原样显示并标记 legacy，不强制改写。
 * ================================================================== */

/** 金额显示（唯一入口）：≥1万 用「万」，<1万 用「元」 */
export const fmtAmt = (n: number) => {
  const abs = Math.abs(n);
  if (abs < 10000) return fmt(n);
  const w = n / 10000;
  return `¥${Number.isInteger(w) ? w : w.toFixed(2)}万`;
};

/** 百分比显示（唯一入口）：1 位小数 */
export const fmtPct = (n: number) => `${n.toFixed(1)}%`;

/**
 * 单号规范正则：前缀 2 位大写 + 6 位流水（对齐《研发级功能规格》§0.2 编号体系，如 SJ000456）。
 * DOC 文档类沿用 4 位流水，故下限取 4。
 */
export const DOC_NO_RE = /^[A-Z]{2}\d{4,6}$/;
/** 是否为规范单号；false = 历史短号（兼容显示，不做改写） */
export const isStdDocNo = (id: string) => DOC_NO_RE.test(id);

/** 税额：含税 = 总额 × 税率 ÷ (100+税率)；不含税 = 总额 × 税率 ÷ 100 */
export const calcTax = (total: number, rate: number, mode: '含税' | '不含税') =>
  Math.round(total * rate / (mode === '含税' ? 100 + rate : 100));

/** 审批分级路由：<50 万 → 部门负责人；50~200 万 → 分管副总；≥200 万 → 总经理 */
export const approveLevel = (amt: number, kind: 'main' | 'purchase' | 'maintain' = 'main') => {
  if (kind === 'purchase') return amt < 300000 ? '部门负责人' : amt < 1000000 ? '分管副总' : '总经理';
  if (kind === 'maintain') return amt < 1000000 ? '部门负责人' : '总经理';
  return amt < 500000 ? '部门负责人' : amt < 2000000 ? '分管副总' : '总经理';
};

/* ==================================================================
 * 报价审批触发条件（★ 单一事实源）
 * ------------------------------------------------------------------
 * 背景：评审发现 QuotePage（台账）与 QuoteEditPage（工作台）各写一套规则且方向相反
 *       —— 台账写 markup < 15%，工作台写 grossMarkup >= 30%，
 *       导致同一单在台账判「免审」、进工作台却提示「需审批」，且台账行高亮（原 markup>=30）
 *       标红的恰恰不是需要审批的行。现收敛为下面的常量与函数，两处共用同一个口径。
 *
 * ⚠ 业务口径待确认：当前采用「浮率过低需审批」（低于 rateBelow% 触发，防低价接单亏损）。
 *   若业务实际为「浮率过高需审批」，只需把下方 `q.markup < RATE_BELOW` 改成 `>`，
 *   全站（台账高亮 / 规则条 / 工作台 / 提交弹窗）同步生效，无需再改页面。
 * ================================================================== */
// 【口径分歧 · 待业务确认 P2-1】当前代码口径：整体浮率 < 15% 触发审批（rateBelow），金额门槛 50 万（amtAtLeast）。
//   与《产品设计文档》口径不一致：规格写「浮率 ≥ 30% 触发」、PRD 写金额门槛 5 万。
//   本次不改业务数值，仅在此标注分歧，待业务确认后统一 rateBelow / amtAtLeast 两处即可全站生效。
export const QUOTE_TRIGGER = { rateBelow: 15, amtAtLeast: 500000 } as const;

/** 判定报价是否命中价格特批，返回 { need, why }；why 已按 A-02 口径做金额脱敏 */
export const quoteTrigger = (q: { markup: number; total: number }, role: string) => {
  const lowRate = q.markup < QUOTE_TRIGGER.rateBelow;
  const bigAmt = q.total >= QUOTE_TRIGGER.amtAtLeast;
  const w = (n: number) => (canSeeMoney(role) ? fmtWan(n) : '—');
  const why = lowRate && bigAmt
    ? `命中双触发：整体浮率 ${q.markup}% <${QUOTE_TRIGGER.rateBelow}% 且总额 ${w(q.total)} ≥50 万 → 需审批`
    : lowRate
      ? `命中：整体浮率 ${q.markup}% <${QUOTE_TRIGGER.rateBelow}% → 需审批`
      : bigAmt
        ? `命中：报价总额 ${w(q.total)} ≥50 万 → 需审批`
        : `免审通过：总额 <50 万且整体浮率 ≥${QUOTE_TRIGGER.rateBelow}%（当前 ${q.markup}%）`;
  return { need: lowRate || bigAmt, why };
};

/** 客户分级：A ≥300 万 / B 100~300 万 / C <100 万 */
export const gradeOf = (dealAmt: number) => (dealAmt >= 3000000 ? 'A' : dealAmt >= 1000000 ? 'B' : 'C');

export const canSeeMoney = (role: string) => ['boss', 'deputy', 'finance', 'pm', 'sysadmin'].includes(role);

export const TODAY = '2026-09-20';

/* ==================================================================
 * 材料 / 产品主数据 · 配套数据集
 * 说明：以下数据集原先硬编码在 MaterialPage 页内（无法溯源），
 *       现已下沉到数据层，使页面展示的每一条记录都可追溯到明确数据源。
 * ================================================================== */

/** 仓库与库位（仓储作业域基础字典） */
export const WAREHOUSES = ['主仓库', '项目临时仓·××中心大厦'];
export const LOCATIONS = ['A-01', 'A-02', 'B-01', 'B-05', 'C-03'];

/** 材料价格库：由已入库采购合同明细自动沉淀 · CNY 含税 */
const BRAND_SEED = ['诺盾', '盾博达', '海湾', '利达', '泰和安', '北大青鸟'];
const SRC_SEED = ['采购合同沉淀', '询比价', '历史报价'];
export const PRICE_LIB = MATERIALS.map((m, i) => {
  const dev = [-14.2, -8.5, -3.1, 0, 2.4, 6.8, 11.5, -6.2, 9.3, -2.0, 4.1, 13.6, -9.8][i % 13];
  return {
    code: m.code, name: m.name, spec: m.spec, unit: m.unit,
    brand: BRAND_SEED[i % BRAND_SEED.length],
    supplier: SUPPLIERS[i % SUPPLIERS.length].name,
    price: m.price,
    std: Math.round(m.price * 1.06),
    eff: i % 3 === 0 ? '2026-07-01 ~ 至今' : i % 3 === 1 ? '2026-04-01 ~ 至今' : '2026-01-01 ~ 至今',
    src: SRC_SEED[i % 3],
    dev,
    review: Math.abs(dev) > 10,
  };
});

/** 仓库作业流水：入库 / 领用 / 调拨 / 退料 / 盘点 */
export type FlowRow = { t: string; type: string; no: string; mat: string; qty: string; wh: string; by: string };
export const FLOW_ROWS: FlowRow[] = [
  { t: '2026-09-19 16:42', type: '入库', no: 'RK20260919008', mat: '镀锌钢管 DN100', qty: '+600 米', wh: '主仓库', by: '张仓' },
  { t: '2026-09-19 10:15', type: '领用', no: 'LY20260919012', mat: '喷淋头（上喷）68℃', qty: '-120 个', wh: '项目临时仓·××中心大厦', by: '李工' },
  { t: '2026-09-18 15:30', type: '调拨', no: 'DB20260918003', mat: '桥架 200×100', qty: '200 米', wh: '主仓库 → 项目临时仓', by: '张仓' },
  { t: '2026-09-18 09:08', type: '退料', no: 'TL20260918002', mat: '防火阀 FHF-400', qty: '+6 台', wh: '项目临时仓 → 主仓库', by: '王工' },
  { t: '2026-09-17 17:20', type: '盘点', no: 'PD20260917001', mat: '应急照明灯具 ZF-JCZ', qty: '-4 套（差异）', wh: '主仓库', by: '张仓' },
  { t: '2026-09-17 11:05', type: '入库', no: 'RK20260917007', mat: '火灾报警控制器 JB-QB-GST5000', qty: '+4 台', wh: '主仓库', by: '张仓' },
  { t: '2026-09-16 14:50', type: '领用', no: 'LY20260916011', mat: '输入/输出模块 GST-LD-8300', qty: '-800 只', wh: '项目临时仓·××中心大厦', by: '李工' },
  { t: '2026-09-16 08:40', type: '入库', no: 'RK20260916006', mat: '消火栓箱 SG24A65', qty: '+20 台', wh: '主仓库', by: '张仓' },
  { t: '2026-09-15 16:12', type: '领用', no: 'LY20260915010', mat: '感烟探测器 JTY-GM-GST101', qty: '-60 只', wh: '项目临时仓·××中心大厦', by: '王工' },
  { t: '2026-09-15 09:33', type: '盘点', no: 'PD20260915001', mat: '防火门（甲级）FM1021', qty: '+0（无差异）', wh: '主仓库', by: '张仓' },
  { t: '2026-09-14 15:26', type: '调拨', no: 'DB20260914002', mat: '消防水泵接合器 SQX100', qty: '8 套', wh: '主仓库 → 项目临时仓', by: '张仓' },
  { t: '2026-09-12 10:02', type: '入库', no: 'RK20260912005', mat: '气体灭火装置 GQQ70', qty: '+2 套', wh: '主仓库', by: '张仓' },
];
export const FLOW_TONE: Record<string, string> = { 入库: 'green', 领用: 'blue', 退料: 'orange', 盘点: 'purple', 调拨: 'link' };

/** 认证与报告（FR-MAT-006 · ≤5 附件 PDF/JPG/PNG）
 *  唯一事实源 = 物料属性 certType：台账徽标（ccc / mand）与合规台账同源，不再两处维护。
 *  服务与套件不发证书（服务只保留「资质要求」qualReq 字段）。 */
export const CERT_TYPES = ['CCCF 强制性认证', '型式检验报告', '出厂合格证', '第三方检测报告', '消防验收资料'];
export const CERT_CHANNELS = ['站内 + 钉钉', '站内 + 短信', '站内 + 钉钉 + 短信', '仅站内'];
export type CertRow = { matCode: string; mat: string; type: string; no: string; validTo: string; batch: string; files: number; ch: string };
export const CERT_ROWS: CertRow[] = ITEMS.filter((i) => !!i.certType).map((i) => ({
  matCode: i.code,
  mat: `${i.name} ${i.spec}`.trim(),
  type: i.certType as string,
  no: i.certNo || '—',
  validTo: i.certValidTo || '—',
  batch: i.batch || '—',
  files: i.certFiles ?? 0,
  /* 无有效期的物料（如出厂合格证）不派发到期通知渠道 */
  ch: i.certValidTo && i.certValidTo !== '—' ? (i.notifyCh || '') : '',
}));
/** 距到期天数（— 表示长期有效） */
export const daysLeft = (d: string) => {
  if (d === '—') return Infinity;
  const a = new Date(d + 'T00:00:00').getTime();
  const b = new Date(TODAY + 'T00:00:00').getTime();
  return Math.round((a - b) / 86400000);
};

/** 询比价（状态机：询价中 → 已报价 → 已选定 → 已关闭；
 *  已选定后可「生成采购订单」→ 与入库衔接，闭环到库存。）
 *  行内 mats 引用主数据编码（服务 / 套件不进询价，只寻源可外采的硬件与服务） */
export type RfqRow = {
  id: string; mats: { code: string; name: string; qty: number; unit: string }[];
  needDate: string; deadline: string; status: string; invited: string[];
  quotes: Record<string, Record<string, number>>; picked?: string;
  /** 已生成的采购订单（选定后由「生成采购订单」写入，与入库衔接） */
  po?: { no: string; supplier: string; amt: number; date: string; status: '待到货' | '部分到货' | '已入库' };
  /** 来源：手工发起 / 库存补齐（库存预警一键带出物料与缺口数量） */
  from?: string;
};
export const RFQ_ROWS: RfqRow[] = [
  {
    id: 'XJ20260918001', status: '已选定', needDate: '2026-09-28', deadline: '2026-09-21 18:00', from: '手工发起',
    mats: [{ code: 'CL000123', name: '镀锌钢管 DN100', qty: 600, unit: '米' }, { code: 'CL000145', name: '喷淋头（上喷）', qty: 300, unit: '个' }],
    invited: ['GYS000012', 'GYS000028', 'GYS000019'],
    quotes: { GYS000012: { CL000123: 82, CL000145: 26 }, GYS000028: { CL000123: 79, CL000145: 27 }, GYS000019: { CL000123: 74, CL000145: 24 } },
    picked: 'GYS000028',
  },
  {
    id: 'XJ20260919002', status: '已报价', needDate: '2026-10-08', deadline: '2026-09-23 18:00', from: '手工发起',
    mats: [{ code: 'CL000177', name: '防火阀 FHF-400', qty: 40, unit: '台' }, { code: 'CL000188', name: '桥架 200×100', qty: 200, unit: '米' }],
    invited: ['GYS000012', 'GYS000035'],
    quotes: { GYS000012: { CL000177: 605, CL000188: 63 }, GYS000035: { CL000177: 590, CL000188: 66 } },
  },
  {
    id: 'XJ20260920003', status: '询价中', needDate: '2026-10-15', deadline: '2026-09-25 18:00', from: '库存补齐',
    mats: [{ code: 'EQ000002', name: '感烟探测器 JTY-GM-GST101', qty: 500, unit: '只' }],
    invited: ['GYS000012', 'GYS000028'],
    quotes: { GYS000012: { EQ000002: 66 } },
  },
  {
    id: 'XJ20260905004', status: '已关闭', needDate: '2026-09-12', deadline: '2026-09-08 18:00', from: '库存补齐',
    mats: [{ code: 'CL000201', name: '应急照明灯具 ZF-JCZ', qty: 200, unit: '套' }],
    invited: ['GYS000012', 'GYS000028', 'GYS000035'],
    quotes: { GYS000012: { CL000201: 92 }, GYS000028: { CL000201: 88 }, GYS000035: { CL000201: 95 } },
    picked: 'GYS000028',
    po: { no: 'CG000007', supplier: 'GYS000028', amt: 17600, date: '2026-09-10', status: '已入库' },
  },
];
export const RFQ_TONE: Record<string, string> = { 询价中: 'orange', 已报价: 'blue', 已选定: 'green', 已关闭: 'gray' };

/** 主数据操作日志（关键操作审计） */
export const MAT_AUDIT_ROWS = [
  { t: '2026-09-19 16:42', who: '张仓', role: '仓管员', act: '入库登记 RK20260919008 · 镀锌钢管 +600 米 · 金额计入 XM000123 项目成本' },
  { t: '2026-09-19 10:15', who: '李工', role: '项目经理', act: '领用登记 LY20260919012 · 喷淋头 −120 个 · 出库不影响成本' },
  { t: '2026-09-18 15:30', who: '张仓', role: '仓管员', act: '库存调拨 DB20260918003 · 桥架 200 米（总量不变）' },
  { t: '2026-09-18 09:08', who: '王工', role: '施工员', act: '退料登记 TL20260918002 · 防火阀 +6 台 · 回冲项目成本' },
  { t: '2026-09-17 17:20', who: '张仓', role: '仓管员', act: '库存盘点 PD20260917001 · 生成《盘点调整单》差异 −4 套' },
  { t: '2026-09-17 11:02', who: '李思敏', role: '商务合同管理员', act: '材料价格调整 · 火灾报警控制器 ¥6,500 → ¥6,800（变更单 MD000019）' },
  { t: '2026-09-16 14:50', who: '李思敏', role: '商务合同管理员', act: '发起询比价 XJ20260919002 · 邀约 2 家供应商 · 生成一人一码二维码' },
  { t: '2026-09-15 09:33', who: '王敏', role: '主数据管理员', act: '安全线调整 · 防火门（甲级）15 → 20（留痕：谁/何时/旧值→新值）' },
  { t: '2026-09-12 10:02', who: '张仓', role: '仓管员', act: '上传认证附件 · 气体灭火装置（七氟丙烷） CCCF 证书 CCCF-2025-QT-003318（查看留审计）' },
  { t: '2026-09-08 14:50', who: '王敏', role: '主数据管理员', act: '新增设备 电气火灾监控设备 LDT9100（变更单 MD000018）' },
];

export type MatAuditRow = (typeof MAT_AUDIT_ROWS)[number];

/* ============ 仓储作业：仓库库存 / 单号 / 可用量口径 ============ */

export const MAIN_WH = '主仓库';
export const PROJ_WH = '项目临时仓·××中心大厦';

/**
 * 期初仓库分布（库存的唯一事实源）。
 * 语义：每个「有库存」主数据（材料 / 设备）的 stock 总额按「主仓库 + 项目临时仓」建账，
 * Σ 各仓 = stock。之后所有库存变动只由作业流水驱动，不再按比例硬拆。
 * 服务与套件不建库存账（isStocked 过滤），从数据层就排除了「给服务记库存」这类错账。
 */
export const WH_STOCK_SEED: Record<string, Record<string, number>> = Object.fromEntries(
  ITEMS.filter((i) => isStocked(i.ty) && i.stock > 0).map((i) => {
    const main = Math.round(i.stock * 0.68);
    return [i.code, { [MAIN_WH]: main, [PROJ_WH]: i.stock - main }];
  }),
);

/** 预占：已审批未领用的作业预留量，逐条落在主数据 hold 字段上（可用 = 结余 − 预占，可逐行验算） */
export const HOLD_RATE = 0.06;

/* ---------- 批次账：与证书「关联批次」呼应，按仓库分账派生 ---------- */
/** 非认证批次的批次号（按仓库序号取用） */
export const ALT_BATCH = ['PC20260712-B', 'PC20260803-C'];
/** 认证批次的占比（其余为常规采购批次） */
export const BATCH_SPLIT = 0.6;

/**
 * 某物料的批次明细：把当前仓库分账再按批次拆开。
 * 首个仓库的 60% 归入证书上的「关联批次」，其余归入常规采购批次 ——
 * 因此批次账永远与库存、与证书批次三者对得上。
 */
export const itemBatches = (code: string, stockByWh: Record<string, number>) => {
  const it = itemByCode(code);
  const certBatch = it?.batch;
  const out: { batch: string; wh: string; qty: number; src: string; cert: string }[] = [];
  Object.entries(stockByWh).forEach(([wh, qty], wi) => {
    if (!qty) return;
    if (wi === 0 && certBatch) {
      const a = Math.round(qty * BATCH_SPLIT);
      if (a > 0) out.push({ batch: certBatch, wh, qty: a, src: '认证批次', cert: it?.certNo || '—' });
      if (qty - a > 0) out.push({ batch: ALT_BATCH[wi % ALT_BATCH.length], wh, qty: qty - a, src: '常规采购', cert: '—' });
    } else {
      out.push({ batch: ALT_BATCH[wi % ALT_BATCH.length], wh, qty, src: '常规采购', cert: it?.certNo || '—' });
    }
  });
  return out;
};

/** 作业类型 → 单号前缀 */
export const OP_PREFIX: Record<string, string> = { 入库: 'RK', 领用: 'LY', 退料: 'TL', 盘点: 'PD', 调拨: 'DB' };

/** 作业单号：前缀 + 6 位流水（OP_PREFIX + opNo 生成） */
export const opNo = (type: string, date: string, seq: number) =>
  `${OP_PREFIX[type] || 'QT'}${date.replace(/-/g, '')}${String(seq).padStart(3, '0')}`;

/** 采购订单号：CG + 日期 + 三位流水（询比价「已选定」后生成，与入库衔接） */
export const poNo = (date: string, seq: number) =>
  `CG${date.replace(/-/g, '')}${String(seq).padStart(3, '0')}`;

/* ============ 详情抽屉数据源（原写死在页内：点任何材料都是同一套数字） ============ */

/** 字符序列散列的稳定基数：同一编码恒定得到同一组派生结果 */
const hashOf = (code: string) => [...code].reduce((a, c) => a + c.charCodeAt(0), 0);

/**
 * 三源比价：由 SUPPLIERS（准入状态）× PRICE_LIB（标准价）确定性派生。
 * 不同材料得到不同的供应商组合与报价，避免"所有材料同一张三源比价表"。
 */
export const matSupQuotes = (code: string) => {
  const lib = PRICE_LIB.find((p) => p.code === code);
  const base = lib?.std ?? 0;
  const h = hashOf(code);
  const offset = h % SUPPLIERS.length;
  return [0, 1, 2].map((i) => {
    const s = SUPPLIERS[(offset + i) % SUPPLIERS.length];
    const discount = 0.98 - i * 0.06 - (h % 7) * 0.005;
    return {
      id: s.id, name: s.name, ok: s.status === '已准入', level: s.level,
      price: Math.round(base * discount),
    };
  });
};

/**
 * 历史采购价走势：以该材料参考单价为基准，按稳定散列派生近四个季度。
 * 趋势方向随材料变化（有的涨有的跌），不再是统一形状。
 */
export const matPriceTrend = (code: string) => {
  const lib = PRICE_LIB.find((p) => p.code === code);
  const base = lib?.price ?? 0;
  const h = hashOf(code);
  const steps = [0, 1, 2, 3].map((i) => {
    const k = 1 - (0.03 + ((h + i * 5) % 9) * 0.008) * (i + 1);
    return Math.round(base * k);
  }).reverse(); // 由远及近：2025Q4 → 2026Q3
  const labels = ['2025 Q4', '2026 Q1', '2026 Q2', '2026 Q3'];
  return steps.map((p, i) => {
    const prev = i > 0 ? steps[i - 1] : null;
    const chg = prev ? ((p - prev) / prev) * 100 : 0;
    return {
      d: labels[i], p, q: 120 + ((h + i * 37) % 90) * 2,
      t: prev === null ? '— 基期' : chg > 0.5 ? '↑ 上涨' : chg < -0.5 ? '↓ 下降' : '→ 持平',
    };
  });
};

/** 价格库历史：由 PRICE_LIB 的有效期内的信息派生，替代原写死三行 */
export const priceHistory = (code: string) => {
  const lib = PRICE_LIB.find((p) => p.code === code);
  const price = lib?.price ?? 0;
  const effFrom = (lib?.eff || '2026-01-01 ~ 至今').split(' ~ ')[0];
  return [
    { d: effFrom, p: price, s: lib?.src || '采购合同沉淀', n: '最近一次成交沉淀' },
    { d: '2026-04-01', p: Math.round(price * (1 - 0.03 - (hashOf(code) % 5) * 0.004)), s: '询比价', n: `${code} 询比价中标价` },
    { d: '2026-01-01', p: Math.round(price * (1 - 0.07 - (hashOf(code) % 6) * 0.005)), s: '历史报价', n: '年度框架价' },
  ];
};

/* ============================ 报价「¥参考」三源价格 ============================ */
/**
 * 市场行情（近 6 月）：以材料参考价为基准，按材料散列扰动出有涨有跌的走势，
 * 保证不同材料曲线不同 —— 供报价「¥参考」面板的柱状图使用。
 */
export const matMarketTrend = (code: string) => {
  const lib = PRICE_LIB.find((p) => p.code === code);
  const base = lib?.price ?? 0;
  const h = hashOf(code);
  const months = ['4月', '5月', '6月', '7月', '8月', '9月'];
  const coef = [0.94, 0.97, 0.95, 0.99, 1.01, 1.03];
  return months.map((m, i) => ({
    m,
    v: Math.max(1, Math.round(base * (coef[i] + (((h + i * 11) % 7) - 3) * 0.006))),
  }));
};

/**
 * 历史项目使用价：由 PROJECTS 按材料散列确定性派生（项目名脱敏），
 * 供报价「¥参考」面板的第三源使用。
 */
export const matProjectPrices = (code: string) => {
  const lib = PRICE_LIB.find((p) => p.code === code);
  const base = lib?.price ?? 0;
  const h = hashOf(code);
  const dates = ['2026-09-01', '2026-07-15', '2026-05-20'];
  const sts = ['已转化', '已审批', '已转化'];
  return [0, 1, 2].map((i) => {
    const p = PROJECTS[(h + i * 3) % PROJECTS.length];
    return {
      proj: `${p.name.slice(0, 6)}…`,
      price: Math.max(1, Math.round(base * (0.93 + i * 0.055 + (h % 5) * 0.004))),
      date: dates[i],
      st: sts[i],
    };
  });
};

/**
 * 三源价格汇总：市场现价 / 供应商最低 / 项目最近成交，建议价取三源中位数。
 * 口径与参考 HTML 报价台账一致，供「¥参考」面板与「采纳」逻辑共用。
 */
export const matPriceRef = (code: string) => {
  const lib = PRICE_LIB.find((p) => p.code === code);
  const trend = matMarketTrend(code);
  const market = trend[trend.length - 1].v;
  const sups = matSupQuotes(code);
  const projs = matProjectPrices(code);
  const sup = sups.length ? Math.min(...sups.map((s) => s.price)) : 0;
  const prj = projs[0].price;
  const sorted = [market, sup, prj].sort((a, b) => a - b);
  return { market, sup, prj, sug: sorted[1], sups, projs, trend, libPrice: lib?.price ?? 0, libStd: lib?.std ?? 0 };
};
