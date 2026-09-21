// 诺安云 6.0 · 系统设置（一级页面）· PRD §16 / §18
// 定位：把散落在各业务页里「与业务流程关系不紧密」的公共配置集中到一处，
//       业务页只留台账与流程，配置项统一在此维护并留痕。
// 迁入清单（来源页 → 本页）：
//   · 材料管理：报价分类目录 / 单位字典 / 认证标记 / 价格与浮率 / 变更日志（原 5 个 Tab）
//   · 供应商管理：准入资料清单（必需项缺失不可准入）
//   · 发票管理：税率口径（工程 9% / 服务 6% / 货物 13%）
//   · 证书管理：到期提前提醒天数（7 / 15 / 30 / 60 / 90）
//   · 客户管理：来源字典 / 跟进方式字典
//   · 全局：组织与人员（部门 · 角色）、审批分级路由阈值
import React, { useMemo, useState } from 'react';
import {
  Banner, Btn, Check, Field, Modal, Op, PageHead, Tag, useToast, type TagTone,
} from '../components/ui';
import CategoryTree from '../components/CategoryTree';
import {
  CHANGE_LOGS, CAT_TREE, CUST_SOURCES, DEPTS, FOLLOW_WAYS, MARK_TYPES, MATERIALS, PRODUCTS, QUOTE_CATS,
  SUP_CATS, UNITS, UNIT_DESC, UNIT_GROUPS, catPath, catSubtreeIds,
} from '../components/data';
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

const SET_META: Record<string, { t: string; d: string; icon: IconName }> = {
  cat: { t: '多级分类目录', d: '产品目录 / 材料目录两棵树，支持任意层级嵌套；可新增子级、重命名、删除（有子级或被引用时禁删）。材料与产品的分类目录均取自本处。', icon: 'folder' },
  unit: { t: '单位字典', d: '消防行业标准计量单位。单位变更会影响已有报价与被引用的历史单据，系统将标记「历史单位」并在报表中保留原口径。', icon: 'swap' },
  mark: { t: '认证标记', d: '国标与强制性认证标记。列入强制性产品目录的消防产品无 CCCF 证书不得用于工程，报价与采购环节将校验。', icon: 'shield' },
  quote: { t: '报价目录与浮率', d: '报价明细行与成本科目的公共分类基线；每个目录对应默认整体浮率与成本红线，报价时按目录批量套用。', icon: 'trend' },
  kbiz: { t: '业务字典', d: '跨页共用的枚举值：客户来源、跟进方式、供应商供货范围。字典项变更不影响历史单据，仅影响后续新增与下拉选项。', icon: 'book' },
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
    <table className="nc-tbl">
      <thead><tr>{head.map(([t, w]) => <th key={t} style={w ? { width: w } : undefined}>{t}</th>)}</tr></thead>
      <tbody>{children}</tbody>
    </table>
  );
}

export default function SettingsPage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  const [grp, setGrp] = useState('cat');
  const [unitOn, setUnitOn] = useState<Record<string, boolean>>(() => Object.fromEntries(UNITS.map((u) => [u, true])));
  const [markOn, setMarkOn] = useState<Record<string, boolean>>(() => Object.fromEntries(MARK_TYPES.map((m) => [m.k, true])));
  const [markup, setMarkup] = useState<Record<string, number>>(() => Object.fromEntries(QUOTE_CATS.map((c) => [c.key, c.markup])));
  const redline = 20;
  const [trigger, setTrigger] = useState(50);
  const [snapshot, setSnapshot] = useState(30);
  const [srcs, setSrcs] = useState(CUST_SOURCES);
  const [ways, setWays] = useState(FOLLOW_WAYS);
  const [supCats, setSupCats] = useState(SUP_CATS);
  const [accessOn, setAccessOn] = useState<Record<string, boolean>>(() => Object.fromEntries(ACCESS_DOCS.map((d) => [d.k, d.req])));
  const [warnCh, setWarnCh] = useState<Record<string, string>>(() => Object.fromEntries(CERT_WARN.map((w) => [w.k, w.ch])));
  const [rates, setRates] = useState<Record<string, number>>(() => Object.fromEntries(TAX_RULES.map((t) => [t.k, t.rate])));
  const [dictNew, setDictNew] = useState<{ kind: 'src' | 'way' | 'sup' | null }>({ kind: null });
  const [dictVal, setDictVal] = useState('');

  const meta = SET_META[grp];

  /**
   * 评审 P0-4：`role` 原先解构后全程未使用，等于任何角色都能改税率、审批阈值与准入硬校验。
   * 现收口为「仅系统管理员可改」，其余角色进入只读态（输入框禁用 + 隐藏保存入口 + 明示原因）。
   */
  const isAdmin = role === 'sysadmin';

  /** 分类树的引用计数（跨材料与产品） */
  const catCount = (id: string) =>
    [...MATERIALS, ...PRODUCTS].filter((r) => catSubtreeIds(id).includes(r.cat)).length;
  const catUsed = useMemo(() => [...MATERIALS, ...PRODUCTS].map((r) => r.cat).filter(Boolean), []);
  /** 目录条目数：按目录名匹配分类树末级名称的条目（原型口径，仅作数量感知） */
  const catEntries = (names: string[]) =>
    [...MATERIALS, ...PRODUCTS].filter((r) => {
      const leaf = catPath(r.cat).split(' / ').pop() || '';
      return names.includes(leaf);
    }).length;

  const body = () => {
    switch (grp) {
      /* ---------------- 多级分类目录 ---------------- */
      case 'cat': {
        /** 两棵树的一级分类概览（点开树可继续下钻） */
        const roots = [
          { key: 'prod' as const, n: '产品目录', tone: 'blue' as TagTone },
          { key: 'mat' as const, n: '材料目录', tone: 'gray' as TagTone },
        ];
        return (
          <div className="nc-doc-layout">
            <aside className="nc-doc-side">
              <CategoryTree value="" onChange={() => {}} countOf={catCount} usedIds={catUsed} />
            </aside>
            <div className="nc-doc-main">
              <Banner tone="info">
                分类为<b>两棵独立的树</b>：产品目录（报价单元）与材料目录（采购 / 库存单元）。
                任意层级均可新增子级、重命名与删除；<b>有子级或被材料 / 产品引用时禁删</b>，删除会写入变更日志。
              </Banner>
              <Table head={[['分类树', 120], ['一级分类', 200], ['负责人', 110], ['含下级引用条目', 140], ['维护', 260]]}>
                {roots.flatMap((rt) => CAT_TREE[rt.key].ch!.map((c) => (
                  <tr key={c.id}>
                    <td><Tag tone={rt.tone}>{rt.n}</Tag></td>
                    <td><b>{c.n}</b>{c.ch?.length ? <span className="nc-tiny nc-muted"> ·{c.ch.length} 个二级</span> : null}</td>
                    <td>{c.owner || '—'}</td>
                    <td className="is-num num">{catCount(c.id) || '—'}</td>
                    <td className="nc-tiny nc-muted">在左栏树中 <Ico n="plus" size={12} /> 加子级 · <Ico n="edit" size={12} /> 改名 · <Ico n="close" size={12} /> 删除（二次确认）</td>
                  </tr>
                )))}
              </Table>
              <div className="nc-tiny nc-muted">
                维护方式与「规范.md §5.4 主数据页」一致：列表 + 树维护，删除走二次确认（危险操作红色按钮），同级重名校验，全部留痕。
              </div>
            </div>
          </div>
        );
      }

      /* ---------------- 单位字典 ---------------- */
      case 'unit':
        return (
          <>
            <Banner tone="warn">
              单位变更会影响已有报价与被引用的历史单据，系统将标记「历史单位」并在报表中保留原口径；本页变更写入变更日志。
            </Banner>
            <Table head={[['分组', 90], ['单位', 76], ['消防行业计量说明', undefined], ['引用条目', 100], ['启用', 90]]}>
              {UNIT_GROUPS.flatMap((g) => g.items.map((u) => {
                const used = [...MATERIALS, ...PRODUCTS].filter((r) => r.unit === u).length;
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
            <div className="nc-tiny nc-muted">
              停用 ≠ 删除（规范 §5.4）：停用后不在新增下拉中出现，历史单据与台账仍保留原单位口径。
            </div>
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
                  ? [...MATERIALS, ...PRODUCTS].filter((r) => r.ccc).length
                  : m.k === '强制'
                    ? [...MATERIALS, ...PRODUCTS].filter((r) => r.mand).length
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
            <Banner tone="info">
              报价分类目录为<b>报价明细行</b>与<b>成本科目</b>的公共分类基线；每个目录对应默认整体浮率，报价时按目录批量套用。
              本页与「材料 / 产品」的分类树是两套口径：树管<b>可维护的层级</b>，本页管<b>默认浮率与成本红线</b>。
            </Banner>
            <Table head={[['序', 56], ['目录名称', 170], ['默认整体浮率', 160], ['成本红线', 110], ['建议最低报价率', 150], ['条目数', 100]]}>
              {QUOTE_CATS.map((c, i) => (
                <tr key={c.key}>
                  <td className="num">{i + 1}</td>
                  <td><b>{c.name}</b><div className="nc-tiny nc-muted">{c.cats.slice(0, 2).join(' · ')}{c.cats.length > 2 ? ' …' : ''}</div></td>
                  <td>
                    <input className="nc-cell-in" style={{ width: 70, textAlign: 'right' }} type="number"
                      value={markup[c.key]} onChange={(e) => setMarkup((s) => ({ ...s, [c.key]: Number(e.target.value) }))} /> %
                  </td>
                  <td className="is-num num nc-v-red">{redline}%</td>
                  <td className="is-num num nc-v-green">{(100 / (1 - redline / 100)).toFixed(1)}%</td>
                  <td className="is-center num">{catEntries(c.cats) || '—'}</td>
                </tr>
              ))}
            </Table>
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
            <div className="nc-tiny nc-muted" style={{ marginTop: 10 }}>
              校正规则：云南区域整体上浮 +3%；单目录浮率可人工覆盖，覆盖后该行报价行标记「人工调整」。
            </div>
          </>
        );

      /* ---------------- 业务字典 ---------------- */
      case 'kbiz':
        return (
          <>
            <Banner tone="info">
              跨页共用的枚举值集中在此维护；字典项<b>变更不影响历史单据</b>，只影响后续新增与表单下拉选项。
            </Banner>
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

            <div className="nc-sec-title" style={{ marginTop: 18 }}>跟进方式（客户管理）</div>
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

            <div className="nc-sec-title" style={{ marginTop: 18 }}>供应商供货范围（供应商管理）</div>
            <div className="nc-pick-inline" style={{ marginBottom: 8 }}>
              {supCats.map((s) => (
                <span key={s} className="nc-pick-chip is-on">
                  <span>{s}</span>
                  <Op danger onClick={() => setSupCats((v) => v.filter((x) => x !== s))}>移除</Op>
                </span>
              ))}
            </div>
            <Btn size="sm" onClick={() => { setDictVal(''); setDictNew({ kind: 'sup' }); }}>＋ 新增范围</Btn>

            <div className="nc-tiny nc-muted" style={{ marginTop: 14 }}>
              跟进口径：上门拜访必须上传现场照片（自动叠加时间水印 + GPS），无照片不可提交 —— 此规则在客户管理页硬拦截。
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
            <div className="nc-warnbox is-orange" style={{ marginTop: 12 }}>
              <b>准入状态机</b>
              <div>待准入（资质审核中，不可参与询比价与下单）→ 已准入（可参与询比价、下单与结算）／已拒绝（永久不可下单，可申诉一次）；已冻结（暂停全部业务往来）。</div>
            </div>
          </>
        );

      /* ---------------- 税率与开票口径 ---------------- */
      case 'tax':
        return (
          <>
            <Banner tone="danger">
              税率口径一致性 · 硬拦截：发票税率必须与合同约定的税率口径一致，不一致时系统<b>阻断开票</b>，须先发起合同变更调整税率，或在开票单中上传书面说明并走特批。
            </Banner>
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
            <div className="nc-tiny nc-muted" style={{ marginTop: 10 }}>
              兼营业务须分别核算，故同一合同允许对应多个可开票税率（工程 + 服务并存时按明细行口径拆分）。
            </div>
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
                <tr key={w.k} className={w.k === '已过期' || w.k === '30 天内' ? 'is-danger-row' : ''}>
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
            <div className="nc-tiny nc-muted" style={{ marginTop: 10 }}>
              长期有效证书（如消防设施操作员职业资格证书）不参与预警；一证一项目 / 多项目引用 / 按次登记的占用口径见证书管理页。
            </div>
          </>
        );

      /* ---------------- 审批分级路由 ---------------- */
      case 'approve':
        return (
          <>
            <Banner tone="info">
              按单据类型与金额区间决定审批层级；阈值变更<b>仅影响新发起的单据</b>，在途单据按发起时口径执行（避免审批链中途改口径）。
            </Banner>
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
            <Banner tone="info">
              角色决定侧栏菜单可见性（A-01）、金额脱敏口径（A-02）与按钮可见性；「超级管理员」为口径维护与异常处置角色。
            </Banner>
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
            <div className="nc-tiny nc-muted" style={{ marginTop: 10 }}>
              演示租户：诺盾博达消防科技有限公司 · 7 个角色视角可在顶栏头像处切换（菜单与金额随视角变化）。
            </div>
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
        title={dictNew.kind === 'src' ? '新增客户来源' : dictNew.kind === 'way' ? '新增跟进方式' : '新增供货范围'}
        foot={<>
          <Btn onClick={() => setDictNew({ kind: null })}>取消</Btn>
          <Btn kind="primary" onClick={() => {
            const v = dictVal.trim();
            if (!v) { toast('名称必填', 'err'); return; }
            if (dictNew.kind === 'src') setSrcs((s) => [...s, v]);
            if (dictNew.kind === 'way') setWays((s) => [...s, v]);
            if (dictNew.kind === 'sup') setSupCats((s) => [...s, v]);
            setDictNew({ kind: null });
            toast(`已新增「${v}」（留痕）`);
          }}>保存</Btn>
        </>}
      >
        <div className="nc-dnote" style={{ marginBottom: 12 }}>字典项变更不影响历史单据，仅影响后续新增与表单下拉选项。</div>
        <Field label="名称" req>
          <input className="nc-input" autoFocus value={dictVal} onChange={(e) => setDictVal(e.target.value)} placeholder="如：行业协会推荐" />
        </Field>
      </Modal>
    </>
  );
}
