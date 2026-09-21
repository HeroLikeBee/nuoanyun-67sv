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
    ],
  },
  {
    group: '供应链管理',
    items: [
      { id: 'supplier', label: '供应商管理', icon: 'package', roles: ['boss', 'deputy', 'pm', 'finance', 'sysadmin'] },
      { id: 'material', label: '材料管理', icon: 'package', roles: ['boss', 'deputy', 'pm', 'finance', 'sysadmin'] },
      { id: 'device', label: '设备管理', icon: 'wrench', roles: ['boss', 'deputy', 'pm', 'sysadmin'] },
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
  project: { title: '项目管理', group: '交付管理' },
  'project-center': { title: '项目经营中心', group: '交付管理' },
  'project-new': { title: '新增项目', group: '交付管理' },
  approval: { title: '审批中心', group: '交付管理' },
  supplier: { title: '供应商管理', group: '供应链管理' },
  material: { title: '材料管理', group: '供应链管理' },
  device: { title: '设备管理', group: '供应链管理' },
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
  'contract-new': 'contract',
  'project-center': 'project', 'project-new': 'project',
  approval: 'project',
};

/* ============================ 客户（KH + YYYYMMDD + 4 位） ============================ */
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
];

/* ============================ 商机（SJ + 6 位） ============================ */
/* 阶段状态机（对齐参考 HTML《商机管理》262-265 行）：
   推进中 → 重点 → 甲方立项确认（金额开始必填）→ 商务谈判 → 已中标 / 未中标 / 关闭（终态，管理员可重开留痕）
   加权口径：金额 × 阶段概率（20 / 40 / 60 / 80 / 100），终态概率记 0。 */
export const OPP_STAGES = ['推进中', '重点', '甲方立项确认', '商务谈判', '已中标'] as const;
export const OPP_STAGE_PROB: Record<string, number> = {
  推进中: 20, 重点: 40, 甲方立项确认: 60, 商务谈判: 80, 已中标: 100,
  未中标: 0, 关闭: 0,
};
/** 终态（不可再推进；管理员可重开留痕，已关联合同不可重开） */
export const OPP_TERMINAL = ['未中标', '关闭'];
/** 允许生成报价 / 转化合同项目的阶段（gating） */
export const OPP_POST = ['甲方立项确认', '商务谈判', '已中标'];
/** 阶段 ≥ 甲方立项确认 时预计金额必填 */
export const OPP_AMT_REQUIRED_FROM = '甲方立项确认';
export const OPPS = [
  { id: 'SJ000456', name: '昆明万达广场消防设施改造工程', customer: '昆明万达广场商业管理有限公司', customerId: 'KH20260312001', stage: '商务谈判', amt: 3200000, owner: '蓝峰', type: '改造', biz: 'GC', last: '2026-09-18', lastDays: 2, quotes: 3, signDate: '2026-10-15', industry: '商业综合体' },
  { id: 'SJ000461', name: '云南师大附中消防系统升级（2027 年度）', customer: '云南师范大学附属中学', customerId: 'KH20260312002', stage: '重点', amt: 2100000, owner: '李思敏', type: '改造', biz: 'GC', last: '2026-09-15', lastDays: 5, quotes: 2, signDate: '2026-11-30', industry: '教育' },
  { id: 'SJ000470', name: '昆明市第一人民医院住院楼消防升级', customer: '昆明市第一人民医院', customerId: 'KH20260418003', stage: '已中标', amt: 4800000, owner: '王志海', type: '改造', biz: 'GC', last: '2026-09-19', lastDays: 1, quotes: 4, signDate: '2026-06-30', industry: '医疗' },
  { id: 'SJ000475', name: '文山三七产业园智慧消防平台', customer: '文山三七产业园管委会', customerId: 'KH20260506005', stage: '推进中', amt: 0, owner: '刘宇', type: '新建', biz: 'RJ', last: '2026-09-06', lastDays: 14, quotes: 1, signDate: '', industry: '园区/政府平台' },
  { id: 'SJ000478', name: '曲靖万达广场消防维护保养（2027 年度）', customer: '曲靖万达广场商业管理有限公司', customerId: 'KH20260728008', stage: '商务谈判', amt: 680000, owner: '李慧敏', type: '维护保养', biz: 'WB', last: '2026-09-10', lastDays: 10, quotes: 2, signDate: '2026-10-01', industry: '商业综合体' },
  { id: 'SJ000482', name: '柳州钢铁厂区消防管网改造', customer: '广西柳州钢铁集团有限公司', customerId: 'KH20260620006', stage: '已中标', amt: 5600000, owner: '赵薇', type: '改造', biz: 'GC', last: '2026-09-14', lastDays: 6, quotes: 5, signDate: '2026-07-31', industry: '电力/制造' },
  { id: 'SJ000490', name: '长水机场航站楼消防设施检测', customer: '昆明长水国际机场后勤保障部', customerId: 'KH20260115007', stage: '重点', amt: 420000, owner: '蓝峰', type: '检测', biz: 'JC', last: '2026-09-15', lastDays: 5, quotes: 1, signDate: '2026-11-15', industry: '交通枢纽' },
  { id: 'SJ000495', name: '楚雄州人民医院消防维护保养续签', customer: '楚雄州人民医院', customerId: 'KH20250902004', stage: '商务谈判', amt: 960000, owner: '赵薇', type: '维护保养', biz: 'WB', last: '2026-09-12', lastDays: 8, quotes: 2, signDate: '2026-10-20', industry: '医疗' },
  { id: 'SJ000501', name: '云南建工智慧展厅消防安装', customer: '云南建工集团有限公司', customerId: 'KH20260928010', stage: '甲方立项确认', amt: 1580000, owner: '李慧敏', type: '新建', biz: 'GC', last: '2026-09-08', lastDays: 12, quotes: 0, signDate: '', industry: '地产' },
  { id: 'SJ000503', name: '大理古城客栈群消防改造', customer: '大理古城文旅运营管理有限公司', customerId: 'KH20260511011', stage: '关闭', amt: 1200000, owner: '李思敏', type: '改造', biz: 'GC', last: '2026-08-12', lastDays: 39, quotes: 1, signDate: '', industry: '文旅' },
  { id: 'SJ000508', name: '普洱茶厂消防设施维护保养', customer: '普洱云岭茶业有限公司', customerId: 'KH20260330012', stage: '未中标', amt: 380000, owner: '刘宇', type: '维护保养', biz: 'WB', last: '2026-07-28', lastDays: 54, quotes: 1, signDate: '', industry: '其他' },
];

/* ============================ 报价（BJ + YYYYMMDD + 4 位，5 状态机） ============================ */
// 状态机：草稿 → 待审批 → 已审批 → 已转化；旁支：作废（终态，可复制新版本）
export const QUOTE_STATUS = ['草稿', '待审批', '已审批', '已转化', '作废'] as const;
export const QUOTES = [
  { id: 'BJ20260912-0011', ver: 'V2', customer: '昆明市第一人民医院', customerId: 'KH20260418003', opp: 'SJ000470', name: '昆明市第一人民医院住院楼消防升级报价', total: 4800000, taxRate: 9, taxMode: '含税', status: '待审批', owner: '王志海', date: '2026-09-12', update: '2026-09-20', approveLevel: '总经理', markup: 22, region: '昆明', uplift: 0, items: 46, base: '医院', costSqm: 386 },
  { id: 'BJ20260919-0017', ver: 'V1', customer: '文山三七产业园管委会', customerId: 'KH20260506005', opp: 'SJ000475', name: '文山三七产业园智慧消防平台报价', total: 0, taxRate: 9, taxMode: '含税', status: '草稿', owner: '刘宇', date: '2026-09-19', update: '2026-09-19', approveLevel: '—', markup: 0, region: '文山', uplift: 0, items: 8, base: '园区', costSqm: 0 },
  { id: 'BJ20260908-0007', ver: 'V3', customer: '昆明万达广场商业管理有限公司', customerId: 'KH20260312001', opp: 'SJ000456', name: '昆明万达广场消防设施改造报价', total: 3200000, taxRate: 9, taxMode: '含税', status: '已转化', owner: '蓝峰', date: '2026-09-08', update: '2026-09-16', approveLevel: '分管副总', markup: 20, region: '昆明', uplift: 0, items: 38, base: '商业综合体', costSqm: 412 },
  { id: 'BJ20260905-0004', ver: 'V1', customer: '楚雄州人民医院', customerId: 'KH20250902004', opp: 'SJ000495', name: '楚雄州人民医院消防维护保养报价（2027 年度）', total: 960000, taxRate: 6, taxMode: '含税', status: '已审批', owner: '赵薇', date: '2026-09-05', update: '2026-09-14', approveLevel: '部门负责人', markup: 25, region: '楚雄', uplift: 0, items: 12, base: '医疗', costSqm: 0 },
  { id: 'BJ20260825-0002', ver: 'V1', customer: '云南师大附中', customerId: 'KH20260312002', opp: 'SJ000461', name: '云南师大附中消防系统升级报价', total: 2100000, taxRate: 9, taxMode: '含税', status: '待审批', owner: '李思敏', date: '2026-08-25', update: '2026-09-18', approveLevel: '分管副总', markup: 22, region: '昆明', uplift: 0, items: 29, base: '教育', costSqm: 358 },
  { id: 'BJ20260820-0001', ver: 'V2', customer: '柳州钢铁集团', customerId: 'KH20260620006', opp: 'SJ000482', name: '柳州钢铁厂区消防管网改造报价', total: 5600000, taxRate: 9, taxMode: '含税', status: '作废', owner: '赵薇', date: '2026-08-20', update: '2026-09-02', approveLevel: '总经理', markup: 18, region: '广西', uplift: 3, items: 52, base: '电力/制造', costSqm: 296 },
  { id: 'BJ20260921-0021', ver: 'V1', customer: '曲靖万达广场商业管理有限公司', customerId: 'KH20260728008', opp: 'SJ000478', name: '曲靖万达广场消防维护保养报价（2027 年度）', total: 680000, taxRate: 6, taxMode: '含税', status: '草稿', owner: '李慧敏', date: '2026-09-21', update: '2026-09-21', approveLevel: '—', markup: 25, region: '曲靖', uplift: 0, items: 9, base: '商业综合体', costSqm: 0 },
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
export const UNITS = ['套', '台', '个', '米', '㎡', '项', '批', '次', '系统', '具', '只', '樘', '处'];
/** 单位分组（消防行业标准计量口径） */
export const UNIT_GROUPS = [
  { g: '计数', items: ['套', '台', '个', '只', '具', '樘', '处', '项', '批', '次', '系统'] },
  { g: '长度', items: ['米'] },
  { g: '面积', items: ['㎡'] },
];
/** 单位计量说明 */
export const UNIT_DESC: Record<string, string> = {
  套: '成套设备 / 成套装置（含配件）', 台: '单台设备（泵、阀、风机等）', 个: '通用零件 / 管件',
  只: '探测类点位（感烟 / 感温探测器）', 具: '灭火器 / 消火栓等灭火器具', 樘: '门（防火门专用计量）',
  处: '点位 / 部位（报警回路点、喷头群组）', 项: '一次性服务 / 单项工程', 批: '批量材料（不细分规格）',
  次: '按次计量的服务（检测 / 维护保养巡检）', 系统: '整套系统（报警系统 / 气体灭火系统）',
  米: '管材 / 线缆 / 桥架等长度计量', '㎡': '面积类（涂料 / 防火板等）',
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

/* ============================ 投标（TB + 6 位，8 阶段） ============================ */
export const BID_STAGES = ['报名', '招标中', '做标书', '已交保证金', '已投标', '开标', '中标', '未中标'] as const;
export const BIDS = [
  { id: 'TB000041', name: '云南××中学消防改造', customer: '××市教育局', stage: '开标', amt: 860000, deposit: 50000, depositSt: '已交', openDate: '2026-09-25', owner: '李强', certNeed: 3, certGot: 3, projMgr: '张工', pmB: '有效', pmBusy: false, risk: '' },
  { id: 'TB000038', name: '昆明万达广场消防改造', customer: '昆明万达广场商业管理有限公司', customerId: 'KH20260312001', stage: '做标书', amt: 3200000, deposit: 100000, depositSt: '已交', openDate: '2026-09-22', owner: '蓝峰', certNeed: 4, certGot: 4, projMgr: '张工', pmB: '有效', pmBusy: false, risk: '安许 60 天内到期' },
  { id: 'TB000045', name: '昆明市第一人民医院住院楼升级', customer: '昆明市第一人民医院', customerId: 'KH20260418003', stage: '已投标', amt: 4800000, deposit: 150000, depositSt: '已交', openDate: '2026-09-28', owner: '王志海', certNeed: 3, certGot: 3, projMgr: '王工', pmB: '有效', pmBusy: false, risk: '' },
  { id: 'TB000052', name: '楚雄州人民医院维护保养续投', customer: '楚雄州人民医院', customerId: 'KH20250902004', stage: '已交保证金', amt: 960000, deposit: 60000, depositSt: '已交', openDate: '2026-10-08', owner: '赵薇', certNeed: 2, certGot: 2, projMgr: '李工', pmB: '有效', pmBusy: false, risk: '' },
  { id: 'TB000056', name: '柳州钢铁管网改造二标段', customer: '广西柳州钢铁集团有限公司', customerId: 'KH20260620006', stage: '报名', amt: 2600000, deposit: 80000, depositSt: '未交', openDate: '2026-10-15', owner: '赵薇', certNeed: 4, certGot: 2, projMgr: '张工', pmB: '有效', pmBusy: false, risk: '证书缺口 2 本' },
  { id: 'TB000058', name: '长水机场消防设施检测服务', customer: '昆明长水国际机场后勤保障部', customerId: 'KH20260115007', stage: '招标中', amt: 420000, deposit: 20000, depositSt: '未交', openDate: '2026-10-22', owner: '蓝峰', certNeed: 2, certGot: 2, projMgr: '陈工', pmB: '30 天内到期', pmBusy: false, risk: 'B 证 30 天内到期' },
  { id: 'TB000037', name: '××酒店消防设施改造', customer: '××酒店管理公司', stage: '未中标', amt: 1500000, deposit: 50000, depositSt: '未退', openDate: '2026-08-20', owner: '周斌', certNeed: 3, certGot: 3, projMgr: '张工', pmB: '有效', pmBusy: false, risk: '保证金未退 · 已 31 天' },
  { id: 'TB000028', name: '产业园一期消防工程', customer: '××工业园区开发有限公司', stage: '中标', amt: 2600000, deposit: 80000, depositSt: '已退', openDate: '2026-07-30', owner: '周斌', certNeed: 5, certGot: 5, projMgr: '张工', pmB: '有效', pmBusy: false, risk: '' },
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
  { id: 'ZS000044', name: '安全生产许可证', type: '企业资质', subType: '安许', holder: '诺盾博达消防科技有限公司', holderId: 'COMPANY', mode: 'multi', validTo: '2026-11-18', warnDays: 60, cap: 99, used: ['XM000123', 'XM000118', 'XM000105', 'XM000098', 'XM000087'], status: '60 天内到期', issue: '云南省住建厅', level: 'company-red' },
  { id: 'ZS000050', name: '注册建造师（机电工程 · 一级）', type: '人员证书', subType: '建造师', holder: '张工', holderId: 'EMP001', mode: 'single', validTo: '2027-08-31', warnDays: 0, cap: 1, used: ['XM000123'], status: '正常', issue: '住建部', isBuilder: true, hasB: true, bValidTo: '2027-05-31' },
  { id: 'ZS000051', name: '注册建造师（机电工程 · 二级）', type: '人员证书', subType: '建造师', holder: '王工', holderId: 'EMP002', mode: 'single', validTo: '2026-12-15', warnDays: 0, cap: 1, used: [], status: '正常', issue: '住建部', isBuilder: true, hasB: false, bValidTo: '' },
  { id: 'ZS000055', name: 'B 类安全生产考核合格证', type: '人员证书', subType: 'B证', holder: '陈工', holderId: 'EMP005', mode: 'log', validTo: '2026-10-15', warnDays: 30, cap: 1, used: [], status: '30 天内到期', issue: '云南省住建厅', followBuilder: true },
];

/* ============================ 合同（HT 销售 / CG 采购 / FK 框架 / WB 维护保养） ============================ */
export const CONTRACT_TYPES = ['销售合同', '采购合同', '框架协议', '维护保养合同'] as const;
/**
 * 合同状态机（唯一事实源 · 与状态轴 STAGES 一致）
 * 主干：草稿 → 审批中 → 已审批 → 已签约 → 履约中 → 结算中 → 已结项
 * 旁支：已续签 / 已终止 / 已中止 / 已解除
 * 说明：「待审批」为历史别名，语义与「审批中」重叠（两者都表示已提交、正在审批流中）。
 *      全局统一收敛为「审批中」，读写一律走 normContractStatus() 归一化，避免筛选 / 步骤条漏判。
 */
export const CONTRACT_STATUS = [
  '草稿', '审批中', '已审批', '已签约', '履约中', '结算中', '已结项',
  '已续签', '已终止', '已中止', '已解除',
] as const;
/** 合同状态归一化：历史别名 → 规范态（未知原样返回） */
export const CONTRACT_STATUS_ALIAS: Record<string, string> = { 待审批: '审批中' };
export function normContractStatus(s: string): string {
  return CONTRACT_STATUS_ALIAS[s] ?? s;
}
export const CONTRACTS = [
  { id: 'HT20260912-0009', name: '昆明万达广场消防改造工程合同', type: '销售合同', party: '昆明万达广场商业管理有限公司', project: 'XM000123', amt: 3200000, execAmt: 3280000, status: '履约中', recvPct: 45.8, recv: 1500000, owner: '蓝峰', sign: '2026-09-12', start: '2026-09-20', end: '2027-03-31', nodes: '预付 30% · 进度 40% · 竣工 25% · 质保 5%', overdue: true, overpay: false },
  { id: 'WB20260901-0003', name: '楚雄州人民医院消防维护保养合同（2027）', type: '维护保养合同', party: '楚雄州人民医院', project: 'XM000118', amt: 960000, execAmt: 960000, status: '履约中', recvPct: 62.5, recv: 600000, owner: '赵薇', sign: '2026-09-01', start: '2026-09-01', end: '2027-08-31', nodes: '半年付 50% × 2', overdue: false, overpay: false },
  { id: 'HT20260818-0005', name: '丽江景区智慧消防平台合同', type: '销售合同', party: '丽江××文旅开发集团', project: 'XM000105', amt: 2400000, execAmt: 2400000, status: '已签约', recvPct: 25, recv: 600000, owner: '陈静', sign: '2026-08-18', start: '2026-09-01', end: '2027-01-31', nodes: '预付 25% · 验收 75%', overdue: false, overpay: false },
  { id: 'HT20260730-0002', name: '产业园一期消防工程合同', type: '销售合同', party: '××工业园区开发有限公司', project: 'XM000087', amt: 2600000, execAmt: 2600000, status: '履约中', recvPct: 78, recv: 2028000, owner: '周斌', sign: '2026-07-30', start: '2026-08-01', end: '2026-12-31', nodes: '预付 30% · 进度 40% · 竣工 27% · 质保 3%', overdue: false, overpay: true },
  { id: 'CG20260901-0003', name: '消防设备采购合同（报警系统）', type: '采购合同', party: '云南××消防设备有限公司', project: 'XM000123', amt: 860000, execAmt: 860000, status: '履约中', recvPct: 0, recv: 0, owner: '蓝峰', sign: '2026-09-01', start: '2026-09-05', end: '2026-11-30', nodes: '到货 70% · 验收 30%', overdue: false, overpay: false },
  { id: 'CG20260902-0005', name: '劳务分包合同（喷淋安装）', type: '采购合同', party: '昆明××建筑劳务有限公司', project: 'XM000123', amt: 580000, execAmt: 580000, status: '履约中', recvPct: 0, recv: 0, owner: '蓝峰', sign: '2026-09-02', start: '2026-09-10', end: '2026-12-20', nodes: '进度 60% · 完工 40%', overdue: false, overpay: false },
  { id: 'FK20260601-0001', name: '昆明万达广场消防维护保养框架协议', type: '框架协议', party: '昆明万达广场商业管理有限公司', project: '', amt: 0, execAmt: 5000000, status: '履约中', recvPct: 0, recv: 0, owner: '蓝峰', sign: '2026-06-01', start: '2026-06-01', end: '2029-05-31', nodes: '按子合同工作量结算', overdue: false, overpay: false },
  { id: 'HT20260920-0011', name: '柳州钢铁厂区消防管网改造合同', type: '销售合同', party: '广西柳州钢铁集团有限公司', project: 'XM000098', amt: 5600000, execAmt: 5600000, status: '审批中', recvPct: 0, recv: 0, owner: '赵薇', sign: '2026-09-20', start: '2026-10-08', end: '2027-04-30', nodes: '预付 20% · 进度 50% · 竣工 27% · 质保 3%', overdue: false, overpay: false },
];

/* ============================ 项目（XM + 6 位，4 来源） ============================ */
export const PROJECT_SOURCES = ['投标中标', '商机直签', '报价转化', '应急工程'] as const;
export const PROJECTS = [
  { id: 'XM000123', name: '昆明万达广场消防改造工程', type: '改造', biz: 'GC', source: '投标中标', customer: '昆明万达广场商业管理有限公司', customerId: 'KH20260312001', owner: '蓝峰', pm: '张工', contractAmt: 3280000, execAmt: 3280000, cost: 2260000, milestone: 72, milestoneName: '施工中', recvPct: 45.8, risk: 'overcost', status: '执行中', start: '2026-09-20', end: '2027-03-31', profit: 31.1 },
  { id: 'XM000118', name: '楚雄州人民医院消防维护保养', type: '维护保养', biz: 'WB', source: '商机直签', customer: '楚雄州人民医院', customerId: 'KH20250902004', owner: '赵薇', pm: '李工', contractAmt: 960000, execAmt: 960000, cost: 590000, milestone: 58, milestoneName: '周期巡检', recvPct: 62.5, risk: 'none', status: '执行中', start: '2026-09-01', end: '2027-08-31', profit: 38.5 },
  { id: 'XM000105', name: '丽江景区智慧消防平台', type: '新建', biz: 'RJ', source: '报价转化', customer: '丽江××文旅开发集团', owner: '陈静', pm: '王工', contractAmt: 2400000, execAmt: 2400000, cost: 1620000, milestone: 25, milestoneName: '进场准备', recvPct: 25, risk: 'none', status: '已立项', start: '2026-09-01', end: '2027-01-31', profit: 32.5 },
  { id: 'XM000098', name: '××酒店消防设施应急抢修', type: '维护保养', biz: 'QT', source: '应急工程', customer: '××酒店管理公司', owner: '周斌', pm: '张工', contractAmt: 0, execAmt: 0, cost: 186000, milestone: 90, milestoneName: '质保期', recvPct: 0, risk: 'nocontract', status: '执行中', start: '2026-07-15', end: '2026-12-31', profit: 0 },
  { id: 'XM000096', name: '曲靖一院消控室改造', type: '改造', biz: 'GC', source: '商机直签', customer: '曲靖××第一人民医院', owner: '周斌', pm: '陈工', contractAmt: 680000, execAmt: 680000, cost: 452000, milestone: 100, milestoneName: '质保期', recvPct: 95, risk: 'none', status: '已结项', start: '2026-03-01', end: '2026-08-31', profit: 33.5 },
  { id: 'XM000087', name: '产业园一期消防工程', type: '新建', biz: 'GC', source: '投标中标', customer: '××工业园区开发有限公司', owner: '周斌', pm: '张工', contractAmt: 2600000, execAmt: 2600000, cost: 1820000, milestone: 88, milestoneName: '竣工验收', recvPct: 78, risk: 'none', status: '执行中', start: '2026-08-01', end: '2026-12-31', profit: 30 },
  { id: 'XM000131', name: '柳州钢铁厂区消防管网改造', type: '改造', biz: 'GC', source: '商机直签', customer: '广西柳州钢铁集团有限公司', customerId: 'KH20260620006', owner: '赵薇', pm: '王工', contractAmt: 5600000, execAmt: 5600000, cost: 3860000, milestone: 96, milestoneName: '待验收', recvPct: 0, risk: 'overdue', status: '执行中', start: '2026-07-31', end: '2026-10-31', profit: 31.1 },
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
// 依据参考「主数据管理.html」TREE 模型：产品目录 / 材料目录 两棵根树，节点可无限嵌套。
// 维护能力：＋新增子分类 / 重命名 / 删除（有子级或被引用则禁删）+ 同级重名校验。
export type CatNode = { id: string; n: string; owner?: string; ch?: CatNode[] };

/** 分类唯一 ID 生成器（保留原 key 命名习惯，便于与 MATERIALS.cat 对齐） */
export const newCatId = (root: 'prod' | 'mat') => `${root}-c${Date.now().toString(36).slice(-5)}`;

export const CAT_TREE: Record<'prod' | 'mat', CatNode> = {
  prod: {
    id: 'prod', n: '产品目录', ch: [
      { id: 'p11', n: '消防电', owner: '徐工', ch: [{ id: 'p111', n: '火灾自动报警' }, { id: 'p112', n: '消防联动控制' }] },
      { id: 'p12', n: '消防水', owner: '徐工', ch: [{ id: 'p121', n: '消火栓系统' }, { id: 'p122', n: '喷淋系统' }] },
      { id: 'p13', n: '气体灭火', owner: '徐工' },
      { id: 'p2', n: '智能化', ch: [{ id: 'p21', n: '视频监控' }] },
      { id: 'p3', n: '机电安装', owner: '张工' },
      { id: 'p4', n: '维修保养', owner: '赵薇' },
      { id: 'p5', n: '检测服务' },
    ],
  },
  mat: {
    id: 'mat', n: '材料目录', ch: [
      { id: 'm1', n: '消防电', owner: '张仓', ch: [{ id: 'm11', n: '报警设备' }, { id: 'm12', n: '线缆桥架' }] },
      { id: 'm2', n: '消防水', owner: '张仓', ch: [{ id: 'm21', n: '管阀件' }, { id: 'm22', n: '消火栓箱组' }] },
      { id: 'm3', n: '防排烟' },
      { id: 'm4', n: '应急照明' },
      { id: 'm5', n: '气体灭火剂' },
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

/* ============================ 产品 / 服务（CP + 6 位；ty = 单品 | 套件） ============================ */
// 产品分「单品」与「套件」；套件保存后到 BOM 页组合材料。
// 报价按生效版本 BOM 展开，调价不影响已出报价。
export const PRODUCTS = [
  { id: 'CP000021', code: 'CP000021', name: '火灾报警控制器', spec: 'JB-QB-GST5000', ty: '单品', unit: '台', cat: 'p111', price: 6800, status: '在售', ccc: true, mand: true, rng: '¥6,500–6,900', avg: 6720, dev: 1.2, ref: { q: 3, c: 2, p: 1 }, owner: '徐工' },
  { id: 'CP000022', code: 'CP000022', name: '感烟探测器', spec: 'JTY-GM-GST101', ty: '单品', unit: '只', cat: 'p111', price: 68, status: '在售', ccc: true, mand: true, rng: '¥62–72', avg: 66, dev: 3.0, ref: { q: 8, c: 3, p: 2 }, owner: '徐工' },
  { id: 'CP000028', code: 'CP000028', name: '气体灭火装置（七氟丙烷）', spec: 'GQQ70', ty: '单品', unit: '套', cat: 'p13', price: 18500, status: '在售', ccc: true, mand: true, rng: '—', avg: null, dev: null, ref: { q: 1, c: 1, p: 0 }, owner: '徐工' },
  { id: 'CP000035', code: 'CP000035', name: '电气火灾监控设备', spec: 'LDT9100', ty: '单品', unit: '台', cat: 'p112', price: 4200, status: '在售', ccc: true, mand: true, rng: '¥4,100–4,400', avg: 4180, dev: 0.5, ref: { q: 2, c: 1, p: 0 }, owner: '徐工' },
  { id: 'CP000041', code: 'CP000041', name: '消防报警套件', spec: '控制器 + 探测器 ×20 + 模块 ×8', ty: '套件', unit: '套', cat: 'p111', price: 9200, status: '在售', ccc: true, mand: true, rng: '¥8,900–9,600', avg: 9150, dev: 0.5, ref: { q: 4, c: 1, p: 1 }, owner: '徐工' },
  { id: 'CP000042', code: 'CP000042', name: '消火栓箱成套', spec: '箱 + 栓 + 水带 + 水枪', ty: '套件', unit: '套', cat: 'p121', price: 1680, status: '在售', ccc: false, mand: false, rng: '—', avg: null, dev: null, ref: { q: 2, c: 1, p: 0 }, owner: '张仓' },
  { id: 'CP000043', code: 'CP000043', name: '应急疏散照明包', spec: '灯具 ×6 + 集中电源', ty: '套件', unit: '套', cat: 'p3', price: 980, status: '在售', ccc: false, mand: false, rng: '—', avg: null, dev: null, ref: { q: 0, c: 0, p: 0 }, owner: '张仓' },
  { id: 'CP000044', code: 'CP000044', name: '气体灭火系统安装', spec: '按套计价（含调试）', ty: '单品', unit: '套', cat: 'p13', price: 96000, status: '停售', ccc: false, mand: false, rng: '—', avg: null, dev: null, ref: { q: 0, c: 0, p: 0 }, owner: '李四' },
  { id: 'CP000045', code: 'CP000045', name: '消防设施年度维保', spec: '按年（含 4 次巡检）', ty: '单品', unit: '年', cat: 'p4', price: 28000, status: '在售', ccc: false, mand: false, rng: '¥30,000–42,000', avg: 34200, dev: -18.1, ref: { q: 6, c: 2, p: 1 }, owner: '赵薇' },
];

/* ============================ 套件 BOM（按产品挂配方 · 版本化） ============================ */
// 套件成本 = Σ(材料 × 单耗 × (1+损耗%)) + 人工 + 其他；毛利率实时预览。
// 编辑已被引用的 BOM → 自动生成新版本，旧版永久保留（报价引用快照）。
export type BomVersion = { v: string; st: '生效' | '历史'; items: [string, number, string][]; loss: number; labor: number; other: number; sale: number; created: string; refs: number };
export const BOMS: Record<string, { pid: string; name: string; cur: string; versions: BomVersion[] }> = {
  CP000041: {
    pid: 'CP000041', name: '消防报警套件', cur: 'V1.2', versions: [
      { v: 'V1.2', st: '生效', items: [['CL000123', 3, ''], ['CL000201', 4, ''], ['CL000226', 2, '']], loss: 2, labor: 120, other: 30, sale: 9200, created: '2026-08-01', refs: 6 },
      { v: 'V1.1', st: '历史', items: [['CL000123', 3, ''], ['CL000201', 4, '']], loss: 2, labor: 120, other: 30, sale: 8900, created: '2026-05-11', refs: 0 },
      { v: 'V1.0', st: '历史', items: [['CL000123', 2, ''], ['CL000201', 4, '']], loss: 2, labor: 100, other: 20, sale: 8500, created: '2026-03-02', refs: 0 },
    ],
  },
  CP000042: {
    pid: 'CP000042', name: '消火栓箱成套', cur: 'V1.0', versions: [
      { v: 'V1.0', st: '生效', items: [['CL000158', 1, ''], ['CL000226', 2, ''], ['CL000188', 1, ''], ['CL000214', 1, '']], loss: 1, labor: 80, other: 0, sale: 1680, created: '2026-06-15', refs: 3 },
    ],
  },
  CP000043: {
    pid: 'CP000043', name: '应急疏散照明包', cur: 'V1.1', versions: [
      { v: 'V1.1', st: '生效', items: [['CL000201', 6, '可替代：自带电池型'], ['CL000188', 1, '']], loss: 2, labor: 60, other: 20, sale: 980, created: '2026-07-20', refs: 0 },
    ],
  },
};

/** BOM 成本核算：套件成本 = Σ(材料×单耗×(1+损耗%)) + 人工 + 其他 */
export function bomCost(pid: string, ver?: string) {
  const B = BOMS[pid];
  if (!B) return { mat: 0, total: 0, sale: 0, gross: 0, short: 0 };
  const v = B.versions.find((x) => x.v === (ver || B.cur)) || B.versions[0];
  let mat = 0; let short = 0;
  v.items.forEach(([code, qty]) => {
    const m = MATERIALS.find((x) => x.code === code);
    if (!m) { short += 1; return; }
    mat += m.price * qty * (1 + v.loss / 100);
    if (m.stock < qty) short += 1;
  });
  mat = Math.round(mat);
  const total = Math.round(mat + v.labor + v.other);
  const gross = v.sale ? Math.round(((v.sale - total) / v.sale) * 1000) / 10 : 0;
  return { mat, total, sale: v.sale, gross, short };
}

/* ============================ 变更日志（主数据留痕） ============================ */
export const CHANGE_LOGS = [
  { t: '2026-09-21 09:12', who: '王敏', obj: '分类目录', act: '新增子分类「管阀件」于 材料目录 / 消防水', tone: 'blue' as const },
  { t: '2026-09-20 16:40', who: '徐工', obj: '产品 CP000041', act: 'BOM 升级 V1.1 → V1.2（旧版快照保留）', tone: 'orange' as const },
  { t: '2026-09-19 11:05', who: '张仓', obj: '材料 CL000226', act: '安全库存 15 → 15（确认），单位改为「套」', tone: 'gray' as const },
  { t: '2026-09-18 15:22', who: '王敏', obj: '认证标记', act: '新增「型式检验报告」类型，适用消防产品', tone: 'green' as const },
  { t: '2026-09-17 10:08', who: '徐工', obj: '单位字典', act: '停用单位「处」，已有 3 条材料引用需改单位', tone: 'red' as const },
  { t: '2026-09-15 09:30', who: '何总', obj: '价格浮率', act: '消防电整体浮率 25% → 24%（区域上浮规则不变）', tone: 'orange' as const },
];

/* ============================ 材料（CL + 6 位） ============================ */
// 纯材料：不再包含产品 / 套件（套件是产品的 BOM 组合，见 PRODUCTS.ty + BOMS）
export const MATERIALS = [
  { id: 'CL000123', code: 'CL000123', name: '镀锌钢管', spec: 'DN100', unit: '米', type: '材料', cat: 'm21', price: 85, stock: 1280, status: '启用', ccc: false, mand: false, safe: 500 },
  { id: 'CL000145', code: 'CL000145', name: '喷淋头（上喷）', spec: '68℃ / DN15', unit: '个', type: '材料', cat: 'm21', price: 28, stock: 560, status: '启用', ccc: false, mand: false, safe: 300 },
  { id: 'CL000158', code: 'CL000158', name: '消火栓箱', spec: 'SG24A65', unit: '台', type: '材料', cat: 'm22', price: 460, stock: 32, status: '启用', ccc: true, mand: true, safe: 60 },
  { id: 'CL000177', code: 'CL000177', name: '防火阀', spec: 'FHF-400', unit: '台', type: '材料', cat: 'm3', price: 620, stock: 48, status: '启用', ccc: true, mand: true, safe: 40 },
  { id: 'CL000188', code: 'CL000188', name: '桥架', spec: '200×100', unit: '米', type: '材料', cat: 'm12', price: 65, stock: 860, status: '启用', ccc: false, mand: false, safe: 400 },
  { id: 'CL000201', code: 'CL000201', name: '应急照明灯具', spec: 'ZF-JCZ', unit: '套', type: '材料', cat: 'm4', price: 95, stock: 320, status: '启用', ccc: true, mand: true, safe: 200 },
  { id: 'CL000214', code: 'CL000214', name: '防火门（甲级）', spec: 'FM1021', unit: '樘', type: '材料', cat: 'm3', price: 1580, stock: 12, status: '启用', ccc: true, mand: true, safe: 20 },
  { id: 'CL000226', code: 'CL000226', name: '消防水泵接合器', spec: 'SQX100', unit: '套', type: '材料', cat: 'm22', price: 680, stock: 18, status: '启用', ccc: false, mand: false, safe: 15 },
];

/* ============================ 设备（SB + 6 位，本期占位） ============================ */
export const DEVICES = [
  { id: 'SB000001', name: '消防水泵', spec: 'XBD6.0/40', unit: '台', cat: '消防水', qty: 12, status: '自有', location: '昆明仓库', keeper: '张工', checkDate: '2026-06-30' },
  { id: 'SB000002', name: '柴油发电机组', spec: '200kW', unit: '台', cat: '消防电', qty: 2, status: '自有', location: '昆明仓库', keeper: '张工', checkDate: '2026-07-15' },
  { id: 'SB000003', name: '高空作业车', spec: '14 米', unit: '台', cat: '机械', qty: 1, status: '外租', location: 'XM000123 现场', keeper: '王工', checkDate: '2026-09-01' },
  { id: 'SB000004', name: '消防设施检测仪', spec: 'SD-1000', unit: '套', cat: '检测', qty: 6, status: '自有', location: '技术部', keeper: '陈工', checkDate: '2026-08-20' },
];

/* ============================ 发票（FP + YYYYMMDD + 4 位） ============================ */
export const INVOICES = [
  { id: 'FP20260912-0007', type: '增值税专用发票', no: '011002500111', date: '2026-09-12', buyer: '昆明万达广场商业管理有限公司', amt: 328000, taxRate: 9, tax: 29500, total: 357500, contract: 'HT20260912-0009', status: '正常', mode: '含税' },
  { id: 'FP20260905-0004', type: '增值税专用发票', no: '011002500087', date: '2026-09-05', buyer: '楚雄州人民医院', amt: 480000, taxRate: 9, tax: 43200, total: 523200, contract: 'WB20260901-0003', status: '正常', mode: '含税' },
  { id: 'FP20260825-0003', type: '增值税普通发票', no: '011002500076', date: '2026-08-25', buyer: '丽江××文旅开发集团', amt: 600000, taxRate: 6, tax: 36000, total: 636000, contract: 'HT20260818-0005', status: '正常', mode: '含税' },
  { id: 'FP20260820-0002', type: '增值税专用发票', no: '011002500065', date: '2026-08-20', buyer: '××工业园区开发有限公司', amt: 780000, taxRate: 9, tax: 70200, total: 850200, contract: 'HT20260730-0002', status: '已红字冲销', mode: '含税' },
  { id: 'FP20260810-0001', type: '增值税专用发票', no: '011002500041', date: '2026-08-10', buyer: '昆明万达广场商业管理有限公司', amt: 120000, taxRate: 6, tax: 7200, total: 127200, contract: 'FK20260601-0001', status: '作废', mode: '含税' },
];

/* ============================ 审批（SP + 日期 + 序） ============================ */
export const APPROVALS = [
  // M29：node 为 0-based 审批链下标（0 = 发起），node > 1 表示已有决策节点通过 → 状态须为「审批中」而非「待审批」
  // cc = 抄送人列表（知会性质，不占待办；参考《审批中心》四 Tab 口径之「抄送我的」）
  { id: 'SP-2026-0924-01', ap: '蓝峰', type: '报价审批', obj: '昆明市第一人民医院住院楼消防升级报价', ref: 'BJ20260912-0011 报价单 V2', amt: 4800000, time: '2026-09-24 10:24', status: '审批中', level: '总经理', node: 2, reason: '', cc: ['李思敏', '蓝峰'] },
  { id: 'SP-2026-0923-01', ap: '赵薇', type: '合同审批', obj: '楚雄州人民医院消防维护保养合同（2027）', ref: 'WB20260901-0003 维护保养合同', amt: 960000, time: '2026-09-23 09:41', status: '待审批', level: '部门负责人', node: 1, reason: '', cc: ['李思敏'] },
  { id: 'SP-2026-0922-01', ap: '蓝峰', type: '变更审批', obj: '昆明万达广场消防改造 · 设计变更（增机房气体灭火）', ref: 'BG000009 变更单', amt: 80000, time: '2026-09-22 16:05', status: '待审批', level: '部门负责人', node: 1, reason: '', cc: [] },
  { id: 'SP-2026-0921-01', ap: '陈静', type: '付款申请', obj: '消防设备采购付款（报警系统）', ref: 'PF000031 付款单', amt: 258000, time: '2026-09-21 14:32', status: '待审批', level: '分管副总', node: 1, reason: '', cc: ['蓝峰'] },
  { id: 'SP-2026-0920-02', ap: '蓝峰', type: '合同审批', obj: '昆明万达广场消防改造工程合同', ref: 'HT20260912-0009 销售合同', amt: 3280000, time: '2026-09-20 11:18', status: '已通过', level: '总经理', node: 3, reason: '', cc: ['李思敏', '蓝峰'] },
  { id: 'SP-2026-0919-03', ap: '赵薇', type: '报价审批', obj: '柳州钢铁厂区消防管网改造报价', ref: 'BJ20260820-0001 报价单 V2', amt: 5600000, time: '2026-09-19 15:50', status: '已通过', level: '总经理', node: 3, reason: '', cc: ['蓝峰'] },
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
  { key: '验收交付', icon: 'checkCircle', subs: ['竣工验收消防查验记录', '竣工图', '竣工验收报告', '移交清单'] },
  { key: '维护保养记录', icon: 'wrench', subs: ['巡检记录', '维修工单', '年度检测'] },
  { key: '财务票据', icon: 'receipt', subs: ['发票', '结算单', '付款凭证'] },
  { key: '体系文件', icon: 'book', subs: ['管理制度', '作业指导书', '表单模板'] },
] as const;

/** 文档状态 */
export const DOC_STATUS = ['已归档', '待审核', '已作废'] as const;

export const DOCS = [
  { id: 'DOC0001', name: '招标文件-昆明万达广场消防改造.pdf', cat: '招投标', sub: '招标文件', type: '招标文件', proj: 'XM000123', contract: '', stage: '投标', by: '蓝峰', date: '2026-09-08', size: '4.2 MB', need: true, ver: 'V1', status: '已归档', tags: ['万达', '公开招标'], summary: '招标人昆明万达广场商业管理有限公司，工期 120 天，控制价 328 万。', dl: 42, vis: '项目成员' },
  { id: 'DOC0002', name: '投标文件-昆明万达广场消防改造.pdf', cat: '招投标', sub: '投标文件', type: '投标文件', proj: 'XM000123', contract: '', stage: '投标', by: '蓝峰', date: '2026-09-20', size: '18.6 MB', need: true, ver: 'V3', status: '已归档', tags: ['万达', '技术标', '商务标'], summary: '含技术标（施工方案 / 进度计划）与商务标（清单报价）全套，V3 为递交终版。', dl: 88, vis: '项目成员' },
  { id: 'DOC0003', name: '中标通知书-昆明万达广场.pdf', cat: '招投标', sub: '中标通知书', type: '中标通知书', proj: 'XM000123', contract: 'HT20260912-0009', stage: '合同', by: '系统', date: '2026-09-12', size: '540 KB', need: true, ver: 'V1', status: '已归档', tags: ['万达', '中标'], summary: '中标价 328 万，要求 30 日内签订合同并缴纳履约保证金 5%。', dl: 31, vis: '全员可见' },
  { id: 'DOC0004', name: '主合同-昆明万达广场消防改造（签署版）.pdf', cat: '合同协议', sub: '主合同', type: '主合同', proj: 'XM000123', contract: 'HT20260912-0009', stage: '合同', by: '蓝峰', date: '2026-09-12', size: '8.8 MB', need: true, ver: 'V2', status: '已归档', tags: ['万达', '双签', '质保金3%'], summary: '合同额 328 万，含税；质保金 3%（法定上限，验收满 12 个月返还）；四期收款。', dl: 156, vis: '项目成员' },
  { id: 'DOC0005', name: '安全协议-昆明万达广场.pdf', cat: '合同协议', sub: '安全协议', type: '安全协议', proj: 'XM000123', contract: 'HT20260912-0009', stage: '合同', by: '蓝峰', date: '2026-09-12', size: '1.2 MB', need: true, ver: 'V1', status: '已归档', tags: ['万达', '安全生产'], summary: '明确甲乙双方安全责任、动火审批流程与现场监护人配置。', dl: 27, vis: '项目成员' },
  { id: 'DOC0006', name: '技术协议-报警系统接入.pdf', cat: '合同协议', sub: '技术协议', type: '技术协议', proj: 'XM000123', contract: 'HT20260912-0009', stage: '合同', by: '陈静', date: '2026-09-14', size: '2.1 MB', need: false, ver: 'V1', status: '已归档', tags: ['报警系统', '接入'], summary: '约定火灾报警主机点位表、通讯协议与联动逻辑接口。', dl: 19, vis: '项目成员' },
  { id: 'DOC0007', name: '隐蔽工程验收记录-喷淋管网.pdf', cat: '施工过程', sub: '隐蔽验收记录', type: '隐蔽验收记录', proj: 'XM000123', contract: '', stage: '施工', by: '张工', date: '2026-09-16', size: '3.4 MB', need: true, ver: 'V1', status: '已归档', tags: ['喷淋', '隐蔽', '监理签字'], summary: 'F1–F3 喷淋管网试压 1.2MPa 保压 30min 无渗漏，监理已签字确认。', dl: 34, vis: '项目成员' },
  { id: 'DOC0008', name: '材料合格证-火灾报警控制器.pdf', cat: '施工过程', sub: '材料合格证', type: '合格证', proj: 'XM000123', contract: '', stage: '施工', by: '资料管理员', date: '2026-09-15', size: '820 KB', need: true, ver: 'V1', status: '已归档', tags: ['强制性认证', '报警控制器'], summary: 'JB-QB-GST5000 型，强制性产品认证（CCC/CCCF）编号 20260815XX，出厂检验合格。', dl: 22, vis: '项目成员' },
  { id: 'DOC0009', name: '材料合格证-感烟探测器.pdf', cat: '施工过程', sub: '材料合格证', type: '合格证', proj: 'XM000123', contract: '', stage: '施工', by: '资料管理员', date: '2026-09-15', size: '760 KB', need: true, ver: 'V1', status: '已归档', tags: ['强制性认证', '感烟'], summary: 'JTY-GD-G3T 型点型光电感烟探测器，批次 2026-08-12，共 860 只。', dl: 21, vis: '项目成员' },
  { id: 'DOC0010', name: '检测报告-消防联动测试.pdf', cat: '检测报告', sub: '联动测试', type: '检测报告', proj: 'XM000123', contract: '', stage: '验收', by: '消防技术服务机构', date: '2026-09-19', size: '5.6 MB', need: true, ver: 'V2', status: '已归档', tags: ['联动', '第三方', '合格'], summary: '云南省消防技术服务机构出具；联动逻辑、喷淋泵、防排烟均判定合格。', dl: 67, vis: '全员可见' },
  { id: 'DOC0011', name: '维护保养合同-楚雄州医院（扫描件）.pdf', cat: '合同协议', sub: '主合同', type: '主合同', proj: 'XM000118', contract: 'WB20260901-0003', stage: '合同', by: '赵薇', date: '2026-09-01', size: '6.2 MB', need: true, ver: 'V1', status: '已归档', tags: ['维护保养', '医院'], summary: '年度维护保养 48 万，含季度巡检 ×4 与 24h 应急响应。', dl: 45, vis: '项目成员' },
  { id: 'DOC0012', name: '竣工图-昆明万达广场 F2 层.dwg', cat: '验收交付', sub: '竣工图', type: '图纸', proj: 'XM000123', contract: '', stage: '竣工', by: '设计单位', date: '2026-09-22', size: '28.4 MB', need: true, ver: 'V2', status: '待审核', tags: ['竣工图', 'CAD', '待审'], summary: 'F2 层喷淋、报警、防排烟综合竣工图，含现场变更标注（云线）。', dl: 12, vis: '项目成员' },
  { id: 'DOC0013', name: '消防设施检测报告-柳州钢铁.pdf', cat: '检测报告', sub: '第三方检测', type: '检测报告', proj: 'XM000131', contract: 'HT20260920-0011', stage: '验收', by: '消防技术服务机构', date: '2026-09-18', size: '6.8 MB', need: true, ver: 'V1', status: '已归档', tags: ['柳钢', '第三方', '合格'], summary: '厂区消防管网及室外栓系统检测，结论：符合 GB50974 要求。', dl: 38, vis: '项目成员' },
  { id: 'DOC0014', name: '营业执照-云南诺安消防工程有限公司.pdf', cat: '资质证照', sub: '营业执照', type: '营业执照', proj: '', contract: '', stage: '投标', by: '行政', date: '2026-03-02', size: '1.1 MB', need: false, ver: 'V1', status: '已归档', tags: ['公司', '三证合一'], summary: '统一社会信用代码 91530100XXXX，经营范围含消防设施工程施工。', dl: 210, vis: '全员可见' },
  { id: 'DOC0015', name: '消防设施工程专业承包一级资质.pdf', cat: '资质证照', sub: '资质证书', type: '资质证书', proj: '', contract: '', stage: '投标', by: '行政', date: '2026-04-18', size: '980 KB', need: false, ver: 'V1', status: '已归档', tags: ['一级资质', '投标必备'], summary: '证书编号 D2-XXXX，有效期至 2029-04-17；投标资格审查必备。', dl: 188, vis: '全员可见' },
  { id: 'DOC0016', name: '一级注册消防工程师-蓝峰.pdf', cat: '资质证照', sub: '人员证书', type: '人员证书', proj: '', contract: '', stage: '投标', by: '行政', date: '2026-05-06', size: '640 KB', need: false, ver: 'V1', status: '已归档', tags: ['注册消防工程师', '蓝峰'], summary: '注册编号 XF2026XXXX，注册有效期至 2029-05-05。', dl: 33, vis: '仅上传者与管理员' },
  { id: 'DOC0017', name: '安全生产许可证.pdf', cat: '资质证照', sub: '安全生产许可证', type: '安全生产许可证', proj: '', contract: '', stage: '投标', by: '行政', date: '2026-06-11', size: '720 KB', need: false, ver: 'V1', status: '已归档', tags: ['安许', '到期预警'], summary: '编号（云）JZ安许证〔2026〕XXXX，有效期至 2027-06-10。', dl: 96, vis: '全员可见' },
  { id: 'DOC0018', name: '答疑澄清函-昆明万达广场（第 02 号）.pdf', cat: '招投标', sub: '答疑澄清', type: '答疑澄清', proj: 'XM000123', contract: '', stage: '投标', by: '蓝峰', date: '2026-09-10', size: '460 KB', need: false, ver: 'V1', status: '已归档', tags: ['万达', '答疑'], summary: '招标人回复：报警主机品牌可替换同等档次；工期不可顺延。', dl: 16, vis: '项目成员' },
  { id: 'DOC0019', name: '补充协议-增项报警点位 120 个.pdf', cat: '合同协议', sub: '补充协议', type: '补充协议', proj: 'XM000123', contract: 'HT20260912-0009', stage: '施工', by: '蓝峰', date: '2026-09-18', size: '1.6 MB', need: true, ver: 'V1', status: '待审核', tags: ['增项', '变更', '待审'], summary: '发包方书面确认增补报警点位 120 个，增项金额 12.8 万，走变更审批。', dl: 9, vis: '项目成员' },
  { id: 'DOC0020', name: '施工组织设计-昆明万达广场消防改造.pdf', cat: '施工过程', sub: '施工组织设计', type: '施工组织设计', proj: 'XM000123', contract: '', stage: '施工', by: '张工', date: '2026-09-13', size: '9.4 MB', need: true, ver: 'V2', status: '已归档', tags: ['万达', '专项方案'], summary: '含进度横道图、劳动力计划、动火作业专项方案与应急预案。', dl: 52, vis: '项目成员' },
  { id: 'DOC0021', name: '技术交底记录-喷淋支管安装.pdf', cat: '施工过程', sub: '技术交底', type: '技术交底', proj: 'XM000123', contract: '', stage: '施工', by: '张工', date: '2026-09-15', size: '1.4 MB', need: false, ver: 'V1', status: '已归档', tags: ['交底', '喷淋', '签字'], summary: '向班组交底支管坡度、支架间距与试压要求，8 人签字。', dl: 14, vis: '项目成员' },
  { id: 'DOC0022', name: '现场影像-管网试压（照片 ×18）.zip', cat: '施工过程', sub: '影像资料', type: '影像资料', proj: 'XM000123', contract: '', stage: '施工', by: '张工', date: '2026-09-17', size: '46.2 MB', need: true, ver: 'V1', status: '已归档', tags: ['影像', '水印', 'GPS'], summary: '试压过程照片 18 张，带水印（拍摄人 + 时间 + GPS）。', dl: 11, vis: '项目成员' },
  { id: 'DOC0023', name: '竣工验收消防查验记录-昆明万达广场（三方签字）.pdf', cat: '验收交付', sub: '竣工验收消防查验记录', type: '竣工验收消防查验记录', proj: 'XM000123', contract: 'HT20260912-0009', stage: '验收', by: '蓝峰', date: '2026-09-21', size: '2.3 MB', need: true, ver: 'V1', status: '已归档', tags: ['验收', '三方签字', '必备'], summary: '建设 / 施工 / 监理三方签字，消防验收申报必备件。', dl: 29, vis: '项目成员' },
  { id: 'DOC0024', name: '竣工验收报告-昆明万达广场消防改造.pdf', cat: '验收交付', sub: '竣工验收报告', type: '竣工验收报告', proj: 'XM000123', contract: 'HT20260912-0009', stage: '竣工', by: '蓝峰', date: '2026-09-22', size: '7.9 MB', need: true, ver: 'V1', status: '待审核', tags: ['竣工', '待审'], summary: '含验收组意见、整改闭环记录与质量评定，待质监站备案。', dl: 6, vis: '项目成员' },
  { id: 'DOC0025', name: '竣工资料移交清单.pdf', cat: '验收交付', sub: '移交清单', type: '移交清单', proj: 'XM000123', contract: 'HT20260912-0009', stage: '竣工', by: '资料管理员', date: '2026-09-22', size: '880 KB', need: true, ver: 'V1', status: '已归档', tags: ['移交', '清单'], summary: '共 6 卷 42 份，发包方资料室签收，双方签字确认。', dl: 8, vis: '项目成员' },
  { id: 'DOC0026', name: '季度巡检记录-楚雄州医院 2026Q3.pdf', cat: '维护保养记录', sub: '巡检记录', type: '巡检记录', proj: 'XM000118', contract: 'WB20260901-0003', stage: '竣工', by: '维护保养班组', date: '2026-09-15', size: '3.1 MB', need: true, ver: 'V1', status: '已归档', tags: ['维护保养', '季度巡检'], summary: '巡检点位 486 个，故障 3 处已闭环（更换喷头 ×2、模块 ×1）。', dl: 17, vis: '项目成员' },
  { id: 'DOC0027', name: '维修工单-报警主机通讯故障.pdf', cat: '维护保养记录', sub: '维修工单', type: '维修工单', proj: 'XM000118', contract: 'WB20260901-0003', stage: '竣工', by: '维护保养班组', date: '2026-09-19', size: '1.1 MB', need: false, ver: 'V1', status: '已归档', tags: ['工单', '闭环'], summary: '回路板通讯中断，更换 RS485 模块后恢复，工单已闭环。', dl: 5, vis: '项目成员' },
  { id: 'DOC0028', name: '年度消防设施检测报告-楚雄州医院.pdf', cat: '维护保养记录', sub: '年度检测', type: '年度检测', proj: 'XM000118', contract: 'WB20260901-0003', stage: '竣工', by: '消防技术服务机构', date: '2026-08-28', size: '5.2 MB', need: true, ver: 'V1', status: '已归档', tags: ['年度检测', '医院'], summary: '依据 GB25201 年度检测，综合判定合格，有效期 12 个月。', dl: 13, vis: '项目成员' },
  { id: 'DOC0029', name: '进度结算单-昆明万达广场（第三期）.pdf', cat: '财务票据', sub: '结算单', type: '结算单', proj: 'XM000123', contract: 'HT20260912-0009', stage: '施工', by: '陈静', date: '2026-09-18', size: '1.8 MB', need: false, ver: 'V2', status: '已归档', tags: ['结算', '进度款'], summary: '本期完成产值 96 万，累计 232 万；监理与发包方已确认。', dl: 24, vis: '项目成员' },
  { id: 'DOC0030', name: '增值税专用发票-万达进度款（128 万）.pdf', cat: '财务票据', sub: '发票', type: '发票', proj: 'XM000123', contract: 'HT20260912-0009', stage: '施工', by: '财务', date: '2026-09-19', size: '620 KB', need: false, ver: 'V1', status: '已作废', tags: ['发票', '已红字冲销'], summary: '原票税率填开错误，已于 2026-09-20 红字冲销并重开（同金额）。', dl: 3, vis: '仅上传者与管理员' },
  { id: 'DOC0031', name: '动火作业管理制度（2026 版）.pdf', cat: '体系文件', sub: '管理制度', type: '管理制度', proj: '', contract: '', stage: '施工', by: '安全部', date: '2026-01-15', size: '2.6 MB', need: false, ver: 'V3', status: '已归档', tags: ['制度', '动火'], summary: '三级动火审批、现场监护与应急器材配置要求，2026 版修订。', dl: 74, vis: '全员可见' },
  { id: 'DOC0032', name: '喷淋安装作业指导书.pdf', cat: '体系文件', sub: '作业指导书', type: '作业指导书', proj: '', contract: '', stage: '施工', by: '技术部', date: '2026-02-20', size: '3.3 MB', need: false, ver: 'V2', status: '已归档', tags: ['SOP', '喷淋'], summary: '支吊架间距、喷头间距与梁底距离的标准化做法图示。', dl: 61, vis: '全员可见' },
  { id: 'DOC0033', name: '隐蔽验收记录表（空白模板）.xlsx', cat: '体系文件', sub: '表单模板', type: '表单模板', proj: '', contract: '', stage: '施工', by: '资料管理员', date: '2026-01-08', size: '48 KB', need: false, ver: 'V1', status: '已归档', tags: ['模板', '表单'], summary: '现场填写后 24h 内上传归档，逾期在竣工资料完整度中扣分。', dl: 132, vis: '全员可见' },
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
  { tone: 'red', t: '逾期收款 · 昆明万达广场', d: '期次 3 逾期 19 天 · ¥195.0 万', amt: 1950000, owner: '蓝峰' },
  { tone: 'red', t: '成本超支 · XM000123 昆明万达广场', d: '实际成本超预算 12.4% · 超支 ¥26.8 万', amt: 268000, owner: '张工' },
  { tone: 'orange', t: '安全生产许可证 60 天内到期', d: 'ZS000044 · 过期将导致全部投标废标', amt: 0, owner: '行政' },
  { tone: 'orange', t: '无合同施工 · XM000098 酒店应急抢修', d: '已施工 68 天仍未补签合同 · ¥18.6 万成本无归口', amt: 186000, owner: '周斌' },
  { tone: 'orange', t: '报价待客户确认超 7 天', d: 'BJ20260825-0002 云南师大附中 · 已 24 天', amt: 2100000, owner: '李思敏' },
  { tone: 'gray', t: '沉默客户 · 昆明滇池度假区', d: '92 天未跟进 · 历史成交 ¥180 万', amt: 1800000, owner: '刘宇' },
];

/* ============================ 收付款计划（可请款池） ============================ */
export const RECEIVABLES = [
  { id: 'YS0001', contract: 'HT20260912-0009', customer: '昆明万达广场商业管理有限公司', node: '进度款 40%', amt: 1280000, dueDate: '2026-09-05', status: '逾期', overdueDays: 19, owner: '蓝峰' },
  { id: 'YS0002', contract: 'HT20260730-0002', customer: '××工业园区开发有限公司', node: '竣工款 25%', amt: 650000, dueDate: '2026-10-31', status: '可请款', overdueDays: 0, owner: '周斌' },
  { id: 'YS0003', contract: 'WB20260901-0003', customer: '楚雄州人民医院', node: '第二期 50%', amt: 480000, dueDate: '2027-03-01', status: '未到期', overdueDays: 0, owner: '赵薇' },
  { id: 'YS0004', contract: 'HT20260818-0005', customer: '丽江××文旅开发集团', node: '验收款 75%', amt: 1800000, dueDate: '2026-11-30', status: '未到期', overdueDays: 0, owner: '陈静' },
  { id: 'YS0005', contract: 'HT20260920-0011', customer: '广西柳州钢铁集团有限公司', node: '预付款 20%', amt: 1120000, dueDate: '2026-10-08', status: '可请款', overdueDays: 0, owner: '赵薇' },
];

/* ============================ 工具函数 ============================ */
export const fmt = (n: number) => '¥' + Math.round(n).toLocaleString('en-US');
export const fmtWan = (n: number) => {
  if (!n) return '¥0';
  const w = n / 10000;
  return '¥' + (Number.isInteger(w) ? w : w.toFixed(1)) + '万';
};
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
  { t: '2026-09-16 14:50', type: '领用', no: 'LY20260916011', mat: '阻燃电线 ZR-BV-2.5', qty: '-800 米', wh: '项目临时仓·××中心大厦', by: '李工' },
  { t: '2026-09-16 08:40', type: '入库', no: 'RK20260916006', mat: '消火栓箱 SG24A65', qty: '+20 台', wh: '主仓库', by: '张仓' },
  { t: '2026-09-15 16:12', type: '领用', no: 'LY20260915010', mat: '感烟探测器 JTY-GM-GST101', qty: '-60 只', wh: '项目临时仓·××中心大厦', by: '王工' },
  { t: '2026-09-15 09:33', type: '盘点', no: 'PD20260915001', mat: '防火门（甲级）FM1021', qty: '+0（无差异）', wh: '主仓库', by: '张仓' },
  { t: '2026-09-14 15:26', type: '调拨', no: 'DB20260914002', mat: '消防水泵接合器 SQX100', qty: '8 套', wh: '主仓库 → 项目临时仓', by: '张仓' },
  { t: '2026-09-12 10:02', type: '入库', no: 'RK20260912005', mat: '气体灭火装置 GQQ70', qty: '+2 套', wh: '主仓库', by: '张仓' },
];
export const FLOW_TONE: Record<string, string> = { 入库: 'green', 领用: 'blue', 退料: 'orange', 盘点: 'purple', 调拨: 'link' };

/** 认证与报告（FR-MAT-006 · ≤5 附件 PDF/JPG/PNG） */
export const CERT_TYPES = ['CCCF 强制性认证', '型式检验报告', '出厂合格证', '第三方检测报告', '消防验收资料'];
export const CERT_CHANNELS = ['站内 + 钉钉', '站内 + 短信', '站内 + 钉钉 + 短信', '仅站内'];
export type CertRow = { mat: string; type: string; no: string; validTo: string; batch: string; files: number; ch: string };
export const CERT_ROWS: CertRow[] = [
  { mat: '消火栓箱 SG24A65', type: 'CCCF 强制性认证', no: 'CCCF-2025-FH-008821', validTo: '2027-05-31', batch: 'PC20260512-A', files: 2, ch: '站内 + 钉钉 + 短信' },
  { mat: '防火阀 FHF-400', type: 'CCCF 强制性认证', no: 'CCCF-2025-FH-009117', validTo: '2027-08-31', batch: 'PC20260608-B', files: 2, ch: '站内 + 钉钉 + 短信' },
  { mat: '火灾报警控制器 JB-QB-GST5000', type: '型式检验报告', no: 'XJ2025-1142', validTo: '2028-03-31', batch: 'PC20260701-A', files: 3, ch: '站内 + 钉钉' },
  { mat: '感烟探测器 JTY-GM-GST101', type: 'CCCF 强制性认证', no: 'CCCF-2024-GW-007733', validTo: '2026-10-15', batch: 'PC20260420-C', files: 1, ch: '站内 + 钉钉 + 短信' },
  { mat: '应急照明灯具 ZF-JCZ', type: 'CCCF 强制性认证', no: 'CCCF-2025-ZM-002290', validTo: '2027-01-31', batch: 'PC20260530-A', files: 2, ch: '站内 + 短信' },
  { mat: '防火门（甲级）FM1021', type: '出厂合格证', no: 'HG2026-0092', validTo: '—', batch: 'PC20260811-A', files: 1, ch: '仅站内' },
  { mat: '气体灭火装置 GQQ70', type: '第三方检测报告', no: 'SF2025-3371', validTo: '2026-11-30', batch: 'PC20260318-B', files: 2, ch: '站内 + 钉钉' },
  { mat: '电气火灾监控设备 LDT9100', type: 'CCCF 强制性认证', no: 'CCCF-2025-DQ-005506', validTo: '2027-09-30', batch: 'PC20260722-A', files: 2, ch: '站内 + 钉钉' },
];
/** 距到期天数（— 表示长期有效） */
export const daysLeft = (d: string) => {
  if (d === '—') return Infinity;
  const a = new Date(d + 'T00:00:00').getTime();
  const b = new Date(TODAY + 'T00:00:00').getTime();
  return Math.round((a - b) / 86400000);
};

/** 询比价（状态机：询价中 → 已报价 → 已选定 → 已关闭） */
export type RfqRow = {
  id: string; mats: { code: string; name: string; qty: number; unit: string }[];
  needDate: string; deadline: string; status: string; invited: string[];
  quotes: Record<string, Record<string, number>>; picked?: string;
};
export const RFQ_ROWS: RfqRow[] = [
  {
    id: 'XJ20260918001', status: '已选定', needDate: '2026-09-28', deadline: '2026-09-21 18:00',
    mats: [{ code: 'CL000123', name: '镀锌钢管 DN100', qty: 600, unit: '米' }, { code: 'CL000145', name: '喷淋头（上喷）', qty: 300, unit: '个' }],
    invited: ['GYS000012', 'GYS000028', 'GYS000019'],
    quotes: { GYS000012: { CL000123: 82, CL000145: 26 }, GYS000028: { CL000123: 79, CL000145: 27 }, GYS000019: { CL000123: 74, CL000145: 24 } },
    picked: 'GYS000028',
  },
  {
    id: 'XJ20260919002', status: '已报价', needDate: '2026-10-08', deadline: '2026-09-23 18:00',
    mats: [{ code: 'CL000177', name: '防火阀 FHF-400', qty: 40, unit: '台' }, { code: 'CL000188', name: '桥架 200×100', qty: 200, unit: '米' }],
    invited: ['GYS000012', 'GYS000035'],
    quotes: { GYS000012: { CL000177: 605, CL000188: 63 }, GYS000035: { CL000177: 590, CL000188: 66 } },
  },
  {
    id: 'XJ20260920003', status: '询价中', needDate: '2026-10-15', deadline: '2026-09-25 18:00',
    mats: [{ code: 'CP000022', name: '感烟探测器 JTY-GM-GST101', qty: 500, unit: '只' }],
    invited: ['GYS000012', 'GYS000028'],
    quotes: { GYS000012: { CP000022: 66 } },
  },
  {
    id: 'XJ20260905004', status: '已关闭', needDate: '2026-09-12', deadline: '2026-09-08 18:00',
    mats: [{ code: 'CL000201', name: '应急照明灯具 ZF-JCZ', qty: 200, unit: '套' }],
    invited: ['GYS000012', 'GYS000028', 'GYS000035'],
    quotes: { GYS000012: { CL000201: 92 }, GYS000028: { CL000201: 88 }, GYS000035: { CL000201: 95 } },
    picked: 'GYS000028',
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
  { t: '2026-09-12 10:02', who: '张仓', role: '仓管员', act: '上传认证附件 · 气体灭火装置 第三方检测报告 SF2025-3371（查看留审计）' },
  { t: '2026-09-08 14:50', who: '王敏', role: '主数据管理员', act: '新增材料 消防水泵接合器 SQX100（变更单 MD000018）' },
];
