// 诺安云 6.0 · 系统设置（一级页面）· PRD §16 / §18
// 定位：把散落在各业务页里「与业务流程关系不紧密」的公共配置集中到一处，
//       业务页只留台账与流程，配置项统一在此维护并留痕。
// 迁入清单（来源页 → 本页）：
//   · 材料管理：报价分类目录 / 单位字典 / 认证标记 / 价格与浮率 / 变更日志（原 5 个 Tab）
//   · 供应商管理：准入资料清单（必需项缺失不可准入）
//   · 发票管理：税率口径（工程 9% / 服务 6% / 货物 13%）
//   · 证书管理：到期提前提醒天数（7 / 15 / 30 / 60 / 90）
//   · 客户管理：来源字典 / 跟进方式字典
//   · 商机管理：商机阶段模板（顺序 / 权重 / 分界线，BG-02 阶段枚举后台可维护）
//   · 全局：组织与人员（部门 · 角色）、审批分级路由阈值
import React, { useMemo, useState, useSyncExternalStore } from 'react';
import {
  Banner, Btn, Check, Field, Modal, Op, OpSep, PageHead, TableFoot, Tag, useToast, type TagTone,
} from '../components/ui';
import CategoryTree from '../components/CategoryTree';
import {
  CHANGE_LOGS, CAT_TREE, CUST_SOURCES, DEPTS, FOLLOW_WAYS, ITEMS, MARK_TYPES, QUOTE_SCOPES,
  SUP_CATS, UNITS, UNIT_DESC, UNIT_GROUPS, catPath, catPathsOfScope, catSubtreeIds, catVersion,
  quoteScopeOf, subscribeCats, getOppFollowDays, getProjectRiskRules, setBusinessConfig,
  getCustomerLevelRules, getTodoConfig,
  type ProjectRiskRuleKey, type ProjectRiskRules, type QuoteScopeKey, type CustomerLevelRules, type TodoConfig,
} from '../components/data';
import {
  addOppStage, countOppsInStage, getOppStages, moveOppStage, removeOppStage,
  setOppStageWeight, subscribeStore,
} from '../components/store';
import { Ico, type IconName } from '../components/icons';

/* ============ 导航（按「配置域」分组，与业务页解耦） ============ */
type NavItem = { key: string; label: string; icon: IconName };
const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: '主数据配置',
    items: [
      { key: 'cat', label: '多级分类目录', icon: 'folder' },
      { key: 'unit', label: '单位字典', icon: 'swap' },
      { key: 'mark', label: '认证标记', icon: 'shield' },
      { key: 'quote', label: '报价目录与浮率', icon: 'trend' },
      { key: 'kbiz', label: '业务字典', icon: 'book' },
    ],
  },
  {
    group: '业务规则',
    items: [
      { key: 'access', label: '供应商准入规则', icon: 'checkCircle' },
      { key: 'tax', label: '税率与开票口径', icon: 'receipt' },
      { key: 'warn', label: '证书到期提醒', icon: 'bell' },
      { key: 'approve', label: '审批分级路由', icon: 'arrowRight' },
    ],
  },
  {
    group: '组织与审计',
    items: [
      { key: 'org', label: '组织与人员', icon: 'users' },
      { key: 'change', label: '变更日志', icon: 'clipboard' },
    ],
  },
];

/* ============ 配置常量 ============ */
/** 供应商准入资料清单（硬校验：必需项缺失不可准入） */
const ACCESS_DOCS = [
  { k: '营业执照', req: true },
  { k: '消防产品认证证书（CCCF）', req: true },
  { k: '安全生产许可证', req: false },
  { k: '开户许可证 / 银行信息', req: true },
  { k: '一般纳税人资格证明', req: true },
  { k: '近三年业绩证明', req: false },
];

/** 税率与开票口径（发票税率须与合同一致，不一致为硬拦截） */
const TAX_RULES = [
  { k: '工程类', rate: 9, note: '消防设施工程施工 / 改造 · 安装工程', count: 6 },
  { k: '服务类', rate: 6, note: '维护保养 / 检测 / 深化设计 / 验收辅导', count: 3 },
  { k: '货物类', rate: 13, note: '设备 / 材料单纯销售（不含安装）', count: 2 },
];

/** 证书到期提醒（多档预警 + 通知渠道） */
const CERT_WARN = [
  { k: '已过期', days: 0, ch: '站内 + 钉钉 + 短信', tone: 'red' as TagTone, note: '过期将直接导致投标废标，须立即处置' },
  { k: '30 天内', days: 30, ch: '站内 + 钉钉 + 短信', tone: 'red' as TagTone, note: '安排续期，材料准备周期不足需走特批借用' },
  { k: '60 天内', days: 60, ch: '站内 + 钉钉', tone: 'orange' as TagTone, note: '提前准备延续注册材料' },
  { k: '90 天内', days: 90, ch: '站内', tone: 'blue' as TagTone, note: '纳入季度计划' },
];

/** 审批分级路由阈值（万元口径） */
const APPROVE_RULES = [
  { k: '报价审批', a: 50, b: 200, note: '＜50 万 部门负责人 · 50~200 万 分管副总 · ≥200 万 总经理' },
  { k: '合同审批', a: 50, b: 200, note: '与报价一致；含框架协议按年度上限计' },
  { k: '采购付款', a: 30, b: 100, note: '＜30 万 部门负责人 · 30~100 万 分管副总 · ≥100 万 总经理' },
  { k: '维护保养', a: 100, b: null, note: '＜100 万 部门负责人 · ≥100 万 总经理' },
];

/** 项目风险规则配置行（项20）：label / 说明 / 阈值类型（cost=成本超支倍数, days=逾期天数, 空=无阈值） */
const RISK_RULE_ROWS: Record<ProjectRiskRuleKey, { label: string; note: string; threshold: 'cost' | 'days' | null }> = {
  noContract: { label: '无合同施工', note: '已进入执行中但无销售合同，红色硬提醒（需补签并关联）', threshold: null },
  costOverrun: { label: '成本超支', note: '实际成本超过目标成本 × 阈值倍即计入风险', threshold: 'cost' },
  milestoneOverdue: { label: '里程碑逾期', note: '里程碑计划日超期未完成的天数口径', threshold: 'days' },
  paymentOverdue: { label: '收款逾期', note: '收款期次超过计划日期未到账的天数口径', threshold: 'days' },
};

const SET_META: Record<string, { t: string; d: string; icon: IconName }> = {
  cat: { t: '多级分类目录', d: '产品目录 / 材料目录两棵树，支持任意层级嵌套；可新增子级、重命名、删除（有子级或被引用时禁删）。材料与产品的分类目录均取自本处。', icon: 'folder' },
  unit: { t: '单位字典', d: '消防行业标准计量单位。单位变更会影响已有报价与被引用的历史单据，系统将标记「历史单位」并在报表中保留原口径。', icon: 'swap' },
  mark: { t: '认证标记', d: '国标与强制性认证标记。列入强制性产品目录的消防产品无 CCCF 证书不得用于工程，报价与采购环节将校验。', icon: 'shield' },
  quote: { t: '报价目录与浮率', d: '报价明细行与成本科目的公共分类基线；每个目录对应默认整体浮率与成本红线，报价时按目录批量套用。', icon: 'trend' },
  kbiz: { t: '业务字典', d: '跨页共用的枚举值：客户来源、跟进方式、供应商供货范围、商机阶段（含顺序与权重，对应 BG-02 阶段枚举后台可维护）。字典项变更不影响历史单据，仅影响后续新增与下拉选项；商机阶段例外 —— 顺序与权重改动会即时重算在谈漏斗与加权预测。', icon: 'book' },
  access: { t: '供应商准入规则', d: '准入资料清单与硬校验口径。必需项缺失时「准入」按钮不可用，供应商不可参与询比价、下单与结算。', icon: 'checkCircle' },
  tax: { t: '税率与开票口径', d: '发票税率必须与合同约定的税率口径一致，不一致时系统阻断开票，须先发起合同变更或走特批。', icon: 'receipt' },
  warn: { t: '证书到期提醒', d: '证书到期的多档预警天数与通知渠道，影响证书台账筛选档位、驾驶舱待处理黄条与消息角标。', icon: 'bell' },
  approve: { t: '审批分级路由', d: '按单据类型与金额区间决定审批层级；阈值变更仅影响新发起的单据，在途单据按发起时口径执行。', icon: 'arrowRight' },
  org: { t: '组织与人员', d: '部门、负责人与角色分工。角色决定侧栏菜单可见性、金额脱敏口径与按钮可见性（A-01 / A-02）。', icon: 'users' },
  change: { t: '变更日志', d: '主数据与配置的变更留痕（操作人 / 时间 / 对象 / 内容），用于审计追溯。日志只读，不可编辑或删除。', icon: 'clipboard' },
};

/**
 * 通用小表格 —— 必须定义在模块顶层。
 *
 * 评审 P0-4：此前它定义在 SettingsPage 组件函数体内，每次 render 都会创建新的组件类型，
 * React 认为是「另一个组件」而卸载重挂载整棵子树，表内输入框每敲一个字符就失焦，
 * 浮率 / 税率几乎无法编辑。提到顶层后引用恒定，输入恢复正常。
 * 经验：任何组件都不要在另一个组件的 render 里定义。
 */
function Table({ head, children }: { head: [string, number | undefined][]; children: React.ReactNode }) {
  return (
    /* 外层包一层横向滚动容器：.nc-tbl 有 min-width:720px，落在「多级分类目录」这类
       左树右表布局的窄右栏里会撑破容器，而 .nc-page 是 overflow-x:hidden
       → 右侧「维护」列会被直接裁掉且无法滚动。装得下时无滚动条、布局不变。 */
    <div className="nc-tblscroll">
      {/* minWidth:0 —— 覆盖 .nc-tbl 的 min-width:720px。本页表格都在「左树右表」的窄右栏里，
          沿用 720 地板会撑破容器（.nc-page 是 overflow-x:hidden）把右侧列裁掉；
          去掉地板后表格按容器宽度自适应、长文本换行，全部列一眼可见。 */}
      <table className="nc-tbl" style={{ minWidth: 0 }}>
        <thead><tr>{head.map(([t, w]) => <th key={t} style={w ? { width: w } : undefined}>{t}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export default function SettingsPage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  /* 分类树同源订阅：左栏树维护后，右侧「一级分类」汇总表与路径文案即时刷新 */
  useSyncExternalStore(subscribeCats, catVersion, catVersion);
  const [grp, setGrp] = useState('cat');
  const [unitOn, setUnitOn] = useState<Record<string, boolean>>(() => Object.fromEntries(UNITS.map((u) => [u, true])));
  const [markOn, setMarkOn] = useState<Record<string, boolean>>(() => Object.fromEntries(MARK_TYPES.map((m) => [m.k, true])));
  const [markup, setMarkup] = useState<Record<string, number>>(() => Object.fromEntries(QUOTE_SCOPES.map((c) => [c.key, c.markup])));
  const redline = 20;
  const [trigger, setTrigger] = useState(50);
  const [snapshot, setSnapshot] = useState(30);
  const [srcs, setSrcs] = useState(CUST_SOURCES);
  const [ways, setWays] = useState(FOLLOW_WAYS);
  const [supCats, setSupCats] = useState(SUP_CATS);
  const [accessOn, setAccessOn] = useState<Record<string, boolean>>(() => Object.fromEntries(ACCESS_DOCS.map((d) => [d.k, d.req])));
  const [warnCh, setWarnCh] = useState<Record<string, string>>(() => Object.fromEntries(CERT_WARN.map((w) => [w.k, w.ch])));
  const [rates, setRates] = useState<Record<string, number>>(() => Object.fromEntries(TAX_RULES.map((t) => [t.k, t.rate])));
  const [dictNew, setDictNew] = useState<{ kind: 'src' | 'way' | 'sup' | 'stage' | null }>({ kind: null });
  const [dictVal, setDictVal] = useState('');
  const [dictW, setDictW] = useState(30);
  /* 商机阶段模板同源订阅：本页增删 / 排序 / 改权重后，商机页与驾驶舱漏斗即时跟随（BG-02） */
  const oppStageList = useSyncExternalStore(subscribeStore, getOppStages, getOppStages);

  /* 业务运行配置（项2 商机跟进超期天数 / 项20 项目风险规则）：读 getter 初始化 → 本地编辑 → setBusinessConfig 写回 */
  const [oppDays, setOppDays] = useState<number>(() => getOppFollowDays());
  const [riskRules, setRiskRules] = useState<ProjectRiskRules>(() => JSON.parse(JSON.stringify(getProjectRiskRules())));
  /* 项1：客户分级自动建议规则；项2：跟进超期自动进待办（读 getter 初始化 → 本地编辑 → setBusinessConfig 写回） */
  const [custLvl, setCustLvl] = useState<CustomerLevelRules>(() => JSON.parse(JSON.stringify(getCustomerLevelRules())));
  const [todoCfg, setTodoCfg] = useState<TodoConfig>(() => ({ ...getTodoConfig() }));

  const meta = SET_META[grp];

  /**
   * 评审 P0-4：`role` 原先解构后全程未使用，等于任何角色都能改税率、审批阈值与准入硬校验。
   * 现收口为「仅系统管理员可改」，其余角色进入只读态（输入框禁用 + 隐藏保存入口 + 明示原因）。
   */
  const isAdmin = role === 'sysadmin';

  /** 分类树计数：组件内部会按子树汇总，这里只返回「精确挂在该分类上」的条目数（避免父子重复相加） */
  const catCountExact = (id: string) => ITEMS.filter((r) => r.cat === id).length;
  /** 含下级引用条目（页面表格的展示口径：含全部后代分类） */
  const catCount = (id: string) =>
    ITEMS.filter((r) => catSubtreeIds(id).includes(r.cat)).length;
  const catUsed = useMemo(() => ITEMS.map((r) => r.cat).filter(Boolean), []);
  /**
   * 科目命中条目数：由物料自身的目录沿祖先链派生（quoteScopeOf），
   * 不再靠「目录名 × 分类树末级名」拍脑袋匹配 —— 树上改名 / 加层级都不会让它失准。
   */
  const scopeEntries = (k: QuoteScopeKey) => ITEMS.filter((r) => quoteScopeOf(r.cat) === k).length;
  /** 科目挂在树上的哪些子树（只读反查，用于核对归集是否符合预期） */
  const scopePaths = (k: QuoteScopeKey) => catPathsOfScope(k);

  const body = () => {
    switch (grp) {
      /* ---------------- 多级分类目录 ---------------- */
      case 'cat': {
        /** 两棵树的一级分类概览（点开树可继续下钻） */
        const roots = [
          { key: 'prod' as const, n: '产品目录', tone: 'blue' as TagTone },
          { key: 'mat' as const, n: '材料目录', tone: 'gray' as TagTone },
        ];
        const rootRows = roots.flatMap((rt) => CAT_TREE[rt.key].ch!.map((c) => ({ rt, c })));
        return (
          <div className="nc-doc-layout">
            <aside className="nc-doc-side">
              <CategoryTree value="" onChange={() => {}} countOf={catCountExact} usedIds={catUsed} />
            </aside>
            <div className="nc-doc-main">
              <Table head={[['分类树', 120], ['一级分类', 200], ['负责人', 110], ['含下级引用条目', 140], ['维护', 260]]}>
                {rootRows.map(({ rt, c }) => (
                  <tr key={c.id}>
                    <td><Tag tone={rt.tone}>{rt.n}</Tag></td>
                    <td><b>{c.n}</b>{c.ch?.length ? <span className="nc-tiny nc-muted"> ·{c.ch.length} 个二级</span> : null}</td>
                    <td>{c.owner || '—'}</td>
                    <td className="is-num num">{catCount(c.id) || '—'}</td>
                    <td className="nc-tiny nc-muted">在左栏树中 <Ico n="plus" size={12} /> 加子级 · <Ico n="edit" size={12} /> 改名 · <Ico n="close" size={12} /> 删除（二次确认）</td>
                  </tr>
                ))}
              </Table>
              <TableFoot total={rootRows.length} page={1} pageSize={rootRows.length} unit="个一级分类" />
            </div>
          </div>
        );
      }

      /* ---------------- 单位字典 ---------------- */
      case 'unit':
        return (
          <>
            <Table head={[['分组', 90], ['单位', 76], ['消防行业计量说明', undefined], ['引用条目', 100], ['启用', 90]]}>
              {UNIT_GROUPS.flatMap((g) => g.items.map((u) => {
                const used = ITEMS.filter((r) => r.unit === u).length;
                return (
                  <tr key={u} className={unitOn[u] ? '' : 'is-muted-row'}>
                    <td><Tag tone="gray">{g.g}</Tag></td>
                    <td><b>{u}</b></td>
                    <td className="nc-tiny">{UNIT_DESC[u] || '—'}</td>
                    <td className="is-num num">{used || '—'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <Check checked={!!unitOn[u]} onChange={(v) => {
                        if (!v && used > 0) { toast(`单位「${u}」已被 ${used} 条主数据引用，停用前请先改单位`, 'err'); return; }
                        setUnitOn((s) => ({ ...s, [u]: v }));
                      }} />
                    </td>
                  </tr>
                );
              }))}
            </Table>
          </>
        );

      /* ---------------- 认证标记 ---------------- */
      case 'mark':
        return (
          <>
            <Banner tone="danger">
              列入<b>强制性产品目录</b>的消防产品（火灾报警控制器、感烟探测器、防火门、应急照明灯具等）无 CCCF 证书不得用于工程；报价与采购环节将校验。
            </Banner>
            <Table head={[['标记', 120], ['名称', 200], ['说明', undefined], ['关联条目', 130], ['启用', 90]]}>
              {MARK_TYPES.map((m) => {
                const used = m.k === 'CCCF'
                  ? ITEMS.filter((r) => r.ccc).length
                  : m.k === '强制'
                    ? ITEMS.filter((r) => r.mand).length
                    : 0;
                return (
                  <tr key={m.k} className={markOn[m.k] ? '' : 'is-muted-row'}>
                    <td><Tag tone={m.tone}>{m.k}</Tag></td>
                    <td><b>{m.n}</b></td>
                    <td className="nc-tiny">{m.desc}</td>
                    <td className="is-num num">{used || '—'}</td>
                    <td style={{ textAlign: 'center' }}><Check checked={!!markOn[m.k]} onChange={(v) => setMarkOn((s) => ({ ...s, [m.k]: v }))} /></td>
                  </tr>
                );
              })}
            </Table>
          </>
        );

      /* ---------------- 报价目录与浮率 ---------------- */
      case 'quote':
        return (
          <>
            <Table head={[['序', 56], ['报价科目', 170], ['默认整体浮率', 160], ['成本红线', 110], ['建议最低报价率', 150], ['条目数', 100]]}>
              {QUOTE_SCOPES.map((c, i) => {
                const paths = scopePaths(c.key);
                return (
                  <tr key={c.key}>
                    <td className="num">{i + 1}</td>
                    <td><b>{c.name}</b><div className="nc-tiny nc-muted" title={paths.join('；')}>
                      {paths.length ? `${paths.slice(0, 2).join(' · ')}${paths.length > 2 ? ' …' : ''}` : '尚未在分类树上指定'}
                    </div></td>
                    <td>
                      <input className="nc-cell-in" style={{ width: 70, textAlign: 'right' }} type="number"
                        value={markup[c.key]} onChange={(e) => setMarkup((s) => ({ ...s, [c.key]: Number(e.target.value) }))} /> %
                    </td>
                    <td className="is-num num nc-v-red">{redline}%</td>
                    <td className="is-num num nc-v-green">{(100 / (1 - redline / 100)).toFixed(1)}%</td>
                    <td className="is-center num">{scopeEntries(c.key) || '—'}</td>
                  </tr>
                );
              })}
            </Table>
            <div className="nc-cell-sub" style={{ marginTop: 8 }}>
              科目不由本表直接接单：<b>分类树节点上的「报价科目」声明才是归集依据</b>（子节点继承最近祖先）。
              本表只定义计价口径与默认浮率；在「多级分类目录」里挪动子树，归集结果即刻跟随。
            </div>
            <div className="nc-warnbox is-info" style={{ marginTop: 12 }}>
              <b>报价双触发规则</b>
              <div>
                报价单总额 ≥
                <input className="nc-cell-in" style={{ width: 56, textAlign: 'right', margin: '0 4px' }} type="number" value={trigger}
                  onChange={(e) => setTrigger(Number(e.target.value))} /> 万，<b>或</b> 整体浮率 ≥
                <input className="nc-cell-in" style={{ width: 56, textAlign: 'right', margin: '0 4px' }} type="number" value={snapshot}
                  onChange={(e) => setSnapshot(Number(e.target.value))} /> % 时，系统自动生成「待审批」并触发审批流；该审批单一旦生成，即使后续修改金额也不回退审批状态。
              </div>
            </div>
          </>
        );

      /* ---------------- 业务字典 ---------------- */
      case 'kbiz':
        return (
          <>
            <div className="nc-sec-title">客户来源（客户管理）</div>
            <div className="nc-pick-inline" style={{ marginBottom: 8 }}>
              {srcs.map((s) => (
                <span key={s} className="nc-pick-chip is-on">
                  <span>{s}</span>
                  <Op danger onClick={() => { setSrcs((v) => v.filter((x) => x !== s)); toast(`已移除来源「${s}」（留痕）`); }}>移除</Op>
                </span>
              ))}
            </div>
            <Btn size="sm" onClick={() => { setDictVal(''); setDictNew({ kind: 'src' }); }}>＋ 新增来源</Btn>

            <div className="nc-sec-title nc-sec-block">跟进方式（客户管理）</div>
            <div className="nc-pick-inline" style={{ marginBottom: 8 }}>
              {ways.map((w) => (
                <span key={w} className="nc-pick-chip is-on">
                  <span>{w}{w === '上门拜访' && <Tag tone="orange">需照片</Tag>}</span>
                  <Op danger onClick={() => {
                    if (w === '上门拜访') { toast('「上门拜访」为硬拦截依赖项（须上传带水印照片），不可移除', 'err'); return; }
                    setWays((v) => v.filter((x) => x !== w));
                  }}>移除</Op>
                </span>
              ))}
            </div>
            <Btn size="sm" onClick={() => { setDictVal(''); setDictNew({ kind: 'way' }); }}>＋ 新增方式</Btn>

            <div className="nc-sec-title nc-sec-block">供应商供货范围（供应商管理）</div>
            <div className="nc-pick-inline" style={{ marginBottom: 8 }}>
              {supCats.map((s) => (
                <span key={s} className="nc-pick-chip is-on">
                  <span>{s}</span>
                  <Op danger onClick={() => setSupCats((v) => v.filter((x) => x !== s))}>移除</Op>
                </span>
              ))}
            </div>
            <Btn size="sm" onClick={() => { setDictVal(''); setDictNew({ kind: 'sup' }); }}>＋ 新增范围</Btn>


            <div className="nc-sec-title nc-sec-block">商机阶段（商机管理）</div>
            <table className="nc-tbl" style={{ minWidth: 620 }}>
              <thead><tr>
                <th style={{ width: 46 }} className="is-num">顺序</th>
                <th>阶段名</th>
                <th style={{ width: 90 }} className="is-num">权重 %</th>
                <th style={{ width: 90 }} className="is-num">商机数</th>
                <th style={{ width: 210 }}>操作</th>
              </tr></thead>
              <tbody>
                {oppStageList.map((s, i) => (
                  <tr key={s.name}>
                    <td className="is-num">{i + 1}</td>
                    <td>
                      <b>{s.name}</b>
                      {s.gate && <Tag tone="orange">分界线 · 金额必填</Tag>}
                    </td>
                    <td className="is-num">
                      <input className="nc-input num" style={{ width: 72 }} value={s.weight}
                        onChange={(e) => setOppStageWeight(s.name, Math.min(100, Number(e.target.value.replace(/[^\d]/g, '')) || 0))} />
                    </td>
                    <td className="is-num">{countOppsInStage(s.name)}</td>
                    <td>
                      <Op disabled={i === 0} title={i === 0 ? '已是首档' : '上移一档'} onClick={() => { const r = moveOppStage(s.name, -1); toast(r.msg, r.ok ? undefined : 'err'); }}>上移</Op>
                      <OpSep />
                      <Op disabled={i === oppStageList.length - 1} title={i === oppStageList.length - 1 ? '已是末档' : '下移一档'} onClick={() => { const r = moveOppStage(s.name, 1); toast(r.msg, r.ok ? undefined : 'err'); }}>下移</Op>
                      <OpSep />
                      <Op danger onClick={() => { const r = removeOppStage(s.name); toast(r.msg, r.ok ? undefined : 'err'); }}>移除</Op>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TableFoot total={oppStageList.length} page={1} pageSize={oppStageList.length} unit="个阶段" />
            <div style={{ marginTop: 8 }}>
              <Btn size="sm" onClick={() => { setDictVal(''); setDictW(30); setDictNew({ kind: 'stage' }); }}>＋ 新增阶段</Btn>
              <span className="nc-tiny nc-muted" style={{ marginLeft: 10 }}>
                共 {oppStageList.length} 档 · 默认 4 档 · 分界线阶段起预计金额必填
              </span>
            </div>

            {/* 项2：商机跟进超期天数（原硬编码 14，改为可配置） */}
            <div className="nc-sec-title nc-sec-block">商机跟进超期提醒（商机管理）</div>
            <div className="nc-warnbox is-info">
              <div>商机超过
                <input className="nc-cell-in" style={{ width: 56, textAlign: 'right', margin: '0 4px' }} type="number" min={1}
                  value={oppDays}
                  onChange={(e) => {
                    const v = Math.max(1, Number(e.target.value) || 14);
                    setOppDays(v);
                    setBusinessConfig({ oppFollowOverdueDays: v });
                  }} />
                天未跟进即标红，并计入「超 {oppDays} 天未跟进」统计卡、列表「最近跟进」列、看板红标与商机详情。
              </div>
            </div>

            {/* 项20：项目风险判定规则（开关 + 阈值，禁用口径不计入风险） */}
            <div className="nc-sec-title nc-sec-block">项目风险判定规则（项目管理）</div>
            <Table head={[['风险口径', 150], ['启用', 90], ['阈值', 150], ['说明', undefined]]}>
              {(Object.keys(RISK_RULE_ROWS) as ProjectRiskRuleKey[]).map((k) => {
                const row = RISK_RULE_ROWS[k];
                const cur = riskRules[k];
                return (
                  <tr key={k} className={cur.enabled ? '' : 'is-muted-row'}>
                    <td><b>{row.label}</b></td>
                    <td style={{ textAlign: 'center' }}>
                      <Check checked={cur.enabled} label={cur.enabled ? '启用' : '停用'}
                        onChange={(v) => {
                          const next = { ...riskRules, [k]: { ...cur, enabled: v } };
                          setRiskRules(next); setBusinessConfig({ projectRiskRules: next });
                          toast(v ? `已启用「${row.label}」风险口径` : `已停用「${row.label}」口径（不计入项目风险）`);
                        }} />
                    </td>
                    <td>
                      {row.threshold === 'cost' && (
                        <>成本超目标
                          <input className="nc-cell-in" style={{ width: 56, textAlign: 'right', margin: '0 4px' }} type="number" step={0.1} min={1}
                            value={cur.threshold ?? 1.0}
                            onChange={(e) => {
                              const next = { ...riskRules, [k]: { ...cur, threshold: Math.max(1, Number(e.target.value) || 1) } };
                              setRiskRules(next); setBusinessConfig({ projectRiskRules: next });
                            }} /> 倍
                        </>
                      )}
                      {row.threshold === 'days' && (
                        <>逾期
                          <input className="nc-cell-in" style={{ width: 56, textAlign: 'right', margin: '0 4px' }} type="number" min={1}
                            value={cur.days ?? 7}
                            onChange={(e) => {
                              const next = { ...riskRules, [k]: { ...cur, days: Math.max(1, Number(e.target.value) || 7) } };
                              setRiskRules(next); setBusinessConfig({ projectRiskRules: next });
                            }} /> 天
                        </>
                      )}
                      {!row.threshold && <span className="nc-muted">—</span>}
                    </td>
                    <td className="nc-tiny nc-muted">{row.note}</td>
                  </tr>
                );
              })}
            </Table>
            <div className="nc-cell-sub" style={{ marginTop: 8 }}>
              停用某口径后，对应风险标记不再计入项目风险统计与「只看风险项目」；阈值调整即时影响后续判定（原型演示，配置随浏览器保留）。
            </div>

            {/* 项1：客户分级自动建议规则（新增客户表单按阈值建议等级，可手动覆盖） */}
            <div className="nc-sec-title nc-sec-block">客户分级自动建议规则（客户管理）</div>
            <div className="nc-warnbox is-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Check checked={custLvl.autoSuggest} label={custLvl.autoSuggest ? '开启自动建议' : '关闭自动建议'}
                  onChange={(v) => {
                    const next = { ...custLvl, autoSuggest: v };
                    setCustLvl(next); setBusinessConfig({ customerLevelRules: next });
                    toast(v ? '已开启新增客户分级自动建议' : '已关闭自动建议，分级恢复为手动选择');
                  }} />
                <span className="nc-tiny nc-muted">新增客户时按下列阈值自动建议 A / B / C 级，建档人仍可手动覆盖</span>
              </div>
            </div>
            <Table head={[['建议等级', 110], ['累计合同数 ≥', 150], ['在谈商机额 ≥', 160], ['说明', undefined]]}>
              {(['A', 'B'] as const).map((lv) => (
                <tr key={lv}>
                  <td><b>{lv} 级</b></td>
                  <td>
                    <input className="nc-cell-in" style={{ width: 64, textAlign: 'right', marginRight: 4 }} type="number" min={0}
                      value={custLvl.thresholds[lv].contracts}
                      onChange={(e) => {
                        const next = { ...custLvl, thresholds: { ...custLvl.thresholds, [lv]: { ...custLvl.thresholds[lv], contracts: Math.max(0, Number(e.target.value) || 0) } } };
                        setCustLvl(next); setBusinessConfig({ customerLevelRules: next });
                      }} /> 单
                  </td>
                  <td>
                    <input className="nc-cell-in" style={{ width: 64, textAlign: 'right', marginRight: 4 }} type="number" min={0}
                      value={custLvl.thresholds[lv].oppAmount}
                      onChange={(e) => {
                        const next = { ...custLvl, thresholds: { ...custLvl.thresholds, [lv]: { ...custLvl.thresholds[lv], oppAmount: Math.max(0, Number(e.target.value) || 0) } } };
                        setCustLvl(next); setBusinessConfig({ customerLevelRules: next });
                      }} /> 万
                  </td>
                  <td className="nc-tiny nc-muted">
                    {lv === 'A' ? '战略客户：合同与商机额均达阈值自动建议 A 级' : '重点客户：达到任一项即建议 B 级；未达 B 按 C 级建档'}
                  </td>
                </tr>
              ))}
            </Table>

            {/* 项2：跟进超期自动进待办（开关 + 提醒天数，替代驾驶舱硬编码 30 天） */}
            <div className="nc-sec-title nc-sec-block">跟进超期自动进待办（客户管理）</div>
            <div className="nc-warnbox is-info">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Check checked={todoCfg.followOverdueAutoTodo} label={todoCfg.followOverdueAutoTodo ? '自动生成待办' : '不自动生成'}
                  onChange={(v) => {
                    const next = { ...todoCfg, followOverdueAutoTodo: v };
                    setTodoCfg(next); setBusinessConfig({ todoConfig: next });
                    toast(v ? `已开启：客户超 ${todoCfg.remindDays} 天未跟进自动进待办` : '已关闭：驾驶舱不再自动生成「待我跟进客户」待办');
                  }} />
                <span className="nc-tiny nc-muted">客户超过</span>
                <input className="nc-cell-in" style={{ width: 56, textAlign: 'right' }} type="number" min={1}
                  value={todoCfg.remindDays}
                  onChange={(e) => {
                    const v = Math.max(1, Number(e.target.value) || 30);
                    const next = { ...todoCfg, remindDays: v };
                    setTodoCfg(next); setBusinessConfig({ todoConfig: next });
                  }} />
                <span className="nc-tiny nc-muted">天未跟进即自动进驾驶舱「我的待办」</span>
              </div>
            </div>
          </>
        );

      /* ---------------- 供应商准入规则 ---------------- */
      case 'access':
        return (
          <>
            <Banner tone="danger">
              <b>黑名单硬拦截：</b>处于「已冻结 / 已拒绝」或已在黑名单的供应商，在<b>询比价邀请、采购下单、付款申请</b>三个环节将被系统直接拦截，不可绕过。
            </Banner>
            <Table head={[['准入资料', undefined], ['是否必需', 120], ['校验说明', 320]]}>
              {ACCESS_DOCS.map((d) => (
                <tr key={d.k}>
                  <td><b>{d.k}</b></td>
                  <td style={{ textAlign: 'center' }}>
                    <Check checked={!!accessOn[d.k]} onChange={(v) => setAccessOn((s) => ({ ...s, [d.k]: v }))} label={accessOn[d.k] ? '必需' : '选填'} />
                  </td>
                  <td className="nc-tiny nc-muted">
                    {accessOn[d.k] ? '缺失时「准入」按钮不可用' : '仅提示，缺失不阻断准入'}
                  </td>
                </tr>
              ))}
            </Table>
            <div className="nc-warnbox is-warn" style={{ marginTop: 12 }}>
              <b>准入流程</b>
              <div>待准入（资质审核中，不可参与询比价与下单）→ 已准入（可参与询比价、下单与结算）／已拒绝（永久不可下单，可申诉一次）；已冻结（暂停全部业务往来）。</div>
            </div>
          </>
        );

      /* ---------------- 税率与开票口径 ---------------- */
      case 'tax':
        return (
          <>
            <Table head={[['业务类别', 140], ['税率', 140], ['适用范围', undefined], ['在库合同数', 120]]}>
              {TAX_RULES.map((t) => (
                <tr key={t.k}>
                  <td><b>{t.k}</b></td>
                  <td>
                    <input className="nc-cell-in" style={{ width: 60, textAlign: 'right' }} type="number" value={rates[t.k]}
                      onChange={(e) => setRates((s) => ({ ...s, [t.k]: Number(e.target.value) }))} /> %
                  </td>
                  <td className="nc-tiny">{t.note}</td>
                  <td className="is-center num">{t.count}</td>
                </tr>
              ))}
            </Table>
          </>
        );

      /* ---------------- 证书到期提醒 ---------------- */
      case 'warn':
        return (
          <>
            <Banner tone="warn">
              到期前按档位提醒证书管理员：<b>站内 + 钉钉 + 短信</b>；本页档位同时驱动证书台账筛选、驾驶舱待处理黄条与顶栏消息角标。
            </Banner>
            <Table head={[['预警档位', 130], ['提前天数', 130], ['通知渠道', 240], ['处置建议', undefined]]}>
              {CERT_WARN.map((w) => (
                /* 条目背景色统一：临期 / 已过期不再整行铺红底，改由状态列承担 */
                <tr key={w.k}>
                  <td><Tag tone={w.tone} pill>{w.k}</Tag></td>
                  <td>
                    <input className="nc-cell-in" style={{ width: 60, textAlign: 'right' }} type="number" value={w.days} disabled /> 天
                  </td>
                  <td>
                    <select className="nc-input" style={{ width: 190 }} value={warnCh[w.k]} onChange={(e) => setWarnCh((s) => ({ ...s, [w.k]: e.target.value }))}>
                      {['站内', '站内 + 钉钉', '站内 + 短信', '站内 + 钉钉 + 短信'].map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </td>
                  <td className="nc-tiny nc-muted">{w.note}</td>
                </tr>
              ))}
            </Table>
          </>
        );

      /* ---------------- 审批分级路由 ---------------- */
      case 'approve':
        return (
          <>
            <Table head={[['单据类型', 150], ['一级阈值', 150], ['二级阈值', 150], ['说明', undefined]]}>
              {APPROVE_RULES.map((r) => (
                <tr key={r.k}>
                  <td><b>{r.k}</b></td>
                  <td className="is-num num">{r.a} 万</td>
                  <td className="is-num num">{r.b == null ? '—' : `${r.b} 万`}</td>
                  <td className="nc-tiny">{r.note}</td>
                </tr>
              ))}
            </Table>
            <div className="nc-warnbox is-info" style={{ marginTop: 12 }}>
              <b>三级路由</b>
              <div>＜一级阈值 → 部门负责人；一级 ~ 二级 → 分管副总；≥ 二级 → 总经理。金额为含税合同额 / 报价总额。</div>
            </div>
          </>
        );

      /* ---------------- 组织与人员 ---------------- */
      case 'org':
        return (
          <>
            <Table head={[['部门', 130], ['负责人', 110], ['角色配置', undefined], ['说明', 220]]}>
              {DEPTS.map((d) => (
                <tr key={d.id}>
                  <td><b>{d.n}</b></td>
                  <td>{d.head}</td>
                  <td>{d.roles.map((r) => <Tag key={r} tone="blue">{r}</Tag>)}</td>
                  <td className="nc-tiny nc-muted">
                    {d.id === 'wh' ? '负责出入库作业与库存盘点' : d.id === 'adm' ? '证书台账 · 资料归档 · 主数据维护' : '—'}
                  </td>
                </tr>
              ))}
            </Table>
          </>
        );

      /* ---------------- 变更日志 ---------------- */
      case 'change':
      default:
        return (
          <>
            <Banner tone="info">
              主数据与配置的变更留痕：操作人 / 时间 / 对象 / 内容；日志<b>只读</b>，不可编辑或删除。
            </Banner>
            <Table head={[['变更时间', 150], ['操作人', 90], ['对象', 150], ['变更内容', undefined]]}>
              {CHANGE_LOGS.map((c, i) => (
                <tr key={i}>
                  <td className="num nc-tiny">{c.t}</td>
                  <td>{c.who}</td>
                  <td><Tag tone={c.tone === 'red' ? 'red' : c.tone === 'orange' ? 'orange' : c.tone === 'green' ? 'green' : c.tone === 'blue' ? 'blue' : 'gray'}>{c.obj}</Tag></td>
                  <td>{c.act}</td>
                </tr>
              ))}
            </Table>
          </>
        );
    }
  };

  const totalCfg =
    Object.keys(SET_META).length;

  return (
    <>
      <PageHead
        crumbs={['系统设置']}
        title="系统设置"
        badges={<><Tag tone="blue">配置项 {totalCfg} 组</Tag>{isAdmin ? <Tag tone="gray">超级管理员视角</Tag> : <Tag tone="orange">只读视角</Tag>}</>}
        actions={<>
          <Btn onClick={() => toast('配置已导出（JSON）')}><Ico n="download" size={16} /> 导出配置</Btn>
          {isAdmin && <Btn kind="primary" onClick={() => toast('全部配置已保存，变更写入日志')}>保存全部</Btn>}
        </>}
      />

      {/* 非管理员进入时明示只读原因，避免「输入框灰着却不知道为什么」 */}
      {!isAdmin && (
        <Banner tone="warn">
          <b>当前为只读视角。</b>系统设置会改变全公司口径（税率、审批阈值、准入硬校验、浮率红线），
          仅<b>系统管理员</b>可修改。如需变更，请联系管理员或在右上角切换至管理员视角。
        </Banner>
      )}

      <div className="nc-set-layout">
        <nav className="nc-set-nav">
          {NAV.map((g) => (
            <React.Fragment key={g.group}>
              <div className="nc-set-group">{g.group}</div>
              {g.items.map((it) => (
                <button key={it.key} className={`nc-set-item${grp === it.key ? ' is-on' : ''}`} onClick={() => setGrp(it.key)}>
                  <Ico n={it.icon} size={15} />
                  <span>{it.label}</span>
                </button>
              ))}
            </React.Fragment>
          ))}
        </nav>

        <div className="nc-set-main">
          <div className="nc-set-hd">
            <div className="nc-set-hd-ico"><Ico n={meta.icon} size={16} /></div>
            <div className="nc-set-hd-bd">
              <h3>{meta.t}</h3>
              <p>{meta.d}</p>
            </div>
          </div>
          {/*
            只读守卫：非管理员时，用原生 fieldset 语义一次性禁用其内全部
            input / select / textarea / button，无需逐个加 disabled，也不会漏改。
            视觉上整体降透明度，配合上方 Banner 说明原因。
          */}
          <fieldset className="nc-ro-guard" disabled={!isAdmin}>
            {body()}
          </fieldset>
        </div>
      </div>

      {/* ============ 新增字典项 ============ */}
      <Modal open={!!dictNew.kind} width={480} onClose={() => setDictNew({ kind: null })}
        title={dictNew.kind === 'src' ? '新增客户来源' : dictNew.kind === 'way' ? '新增跟进方式' : dictNew.kind === 'stage' ? '新增商机阶段' : '新增供货范围'}
        foot={<>
          <Btn onClick={() => setDictNew({ kind: null })}>取消</Btn>
          <Btn kind="primary" onClick={() => {
            const v = dictVal.trim();
            if (!v) { toast('名称必填', 'err'); return; }
            if (dictNew.kind === 'stage') {
              const r = addOppStage(v, dictW);
              toast(r.msg, r.ok ? undefined : 'err');
              if (!r.ok) return;
              setDictNew({ kind: null });
              return;
            }
            if (dictNew.kind === 'src') setSrcs((s) => [...s, v]);
            if (dictNew.kind === 'way') setWays((s) => [...s, v]);
            if (dictNew.kind === 'sup') setSupCats((s) => [...s, v]);
            setDictNew({ kind: null });
            toast(`已新增「${v}」（留痕）`);
          }}>保存</Btn>
        </>}
      >
        <div className="nc-dnote" style={{ marginBottom: 12 }}>
          {dictNew.kind === 'stage'
            ? '新增阶段追加在末位，可再上移调整顺序；阶段名会同步出现在商机筛选、看板列与推进弹窗中。'
            : '字典项变更不影响历史单据，仅影响后续新增与表单下拉选项。'}
        </div>
        <Field label={dictNew.kind === 'stage' ? '阶段名' : '名称'} req>
          <input className="nc-input" autoFocus value={dictVal} onChange={(e) => setDictVal(e.target.value)}
            placeholder={dictNew.kind === 'stage' ? '如：技术交底' : '如：行业协会推荐'} />
        </Field>
        {dictNew.kind === 'stage' && (
          <Field label="阶段权重（%）" req note="用于加权预测金额 = 金额 × 权重">
            <input className="nc-input num" value={dictW} onChange={(e) => setDictW(Math.min(100, Number(e.target.value.replace(/[^\d]/g, '')) || 0))} />
          </Field>
        )}
      </Modal>
    </>
  );
}
