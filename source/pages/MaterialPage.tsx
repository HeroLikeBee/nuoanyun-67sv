// 诺安云 6.0 · 物料与服务（供应链管理）
// ------------------------------------------------------------------
// 统一主数据：物料 / 服务 / 软件 / 套件 四类同表（ITEMS），用「类型」字段区分。
//   · 服务与套件共享同一套「配置 / 成本构成」编辑器；
//   · 配置行只能引用主数据（物料 / 服务 / 软件 / 子套件），人工费只能来自工种单价主数据；
//   · 台账徽标、合规证书、价格库、批次账全部由同一份主数据派生，杜绝两页说法不一。
// 信息架构（M-IA 重构）：「供应链管理」组下 5 个二级菜单平铺，各自就是终点页，鼠标点即到 ——
//   物料主数据 material-list（一张列表含物料 / 服务 / 软件 / 套件四类）· 库存管理 material-stock
//   采购寻源 material-src（询比价 / 物料价格库）· 认证与报告 material-cert
// 全站统一二级：不再有「物料与资源」一级折叠层；本组件由路由驱动决定展示哪一域，
// 顶部 4 张指标瓦片只做「跳到对应二级菜单页」，不另起一套域切换状态（消口径两套账）。
// 原「服务资质」独立 Tab 已取消：其行 = 全部服务主数据，与主数据列表重复，资质要求改为主数据字段；
// 原「操作日志」已从业务域移出，改为页面级抽屉（页头「日志」按钮）。
// 链路闭环：库存预警 → 发起询价（带物料与缺口）→ 比价选定 → 生成采购订单 → 入库回写订单。
import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  Alert, Banner, Btn, Card, Check, DataTable, Drawer, EntityLink, Field, IdCell, KvGrid, ListToolbar, Modal,
  ItemPicker, Op, OpMore, OpSep, PageHead, PickSelect, ProjectPicker, TableFoot, Tag, Tabs, Tip, usePaged, useToast, type Col, type TagTone, pressProps,
} from '../components/ui';
import CategoryTree from '../components/CategoryTree';
import {
  CERT_CHANNELS as CHANNELS, CERT_ROWS as CERT_SEED, CERT_TYPES, ITEMS, ITEM_KINDS,
  LABOR_RATES, LOCATIONS as LOC, MAIN_WH, MAT_AUDIT_ROWS as AUDIT_SEED, PRICE_LIB, PROJ_WH, RECIPES,
  RFQ_ROWS as RFQ_SEED, RFQ_TONE, SUPPLIERS, TODAY, UNITS, UNIT_DESC, WAREHOUSES as WH, WH_STOCK_SEED,
  catOptions, catPath, catSubtreeIds, catVersion, daysLeft, fmt, fmtWan, inheritsMand, isStocked, itemBatches,
  itemCostBase, itemTaxRate, laborRate, matPriceTrend, matSupQuotes, opNo, poNo, priceHistory, recipeCost, serviceCost, suggestSale,
  stockUnitCost, toBaseAmt,
  can, subscribeCats, certRuleCn, certRuleOf, itemCertMiss, itemNeedCCC, listCodeOf,
  ID_MARK_FLOWS, ID_MARK_RANGES, PUSH_BATCHES, arrivalReqOf, fmtMark, idMarkAddFlow, idMarkAddRange, idMarkAlloc,
  idMarkCheck, idMarkFlowsOfRange, idMarkRuleOf, idMarkStockOf, idMarkVersion, itemNeedIdMark, subscribeIdMark, shiftMark,
  pushConfirm, pushReject, itemByCode,
  BILL_BASIS_CN, srvRateOf, tierPriceOf,
  FLOW_ROWS as FLOW_SEED, FLOW_TONE,
  type CertRow, type ConsumableLine, type FlowRow, type Item, type ItemKind, type LaborLine, type MatAuditRow,
  type RecipeLine, type RfqRow,
} from '../components/data';
import { Ico } from '../components/icons';
import IdMarkVerify from '../components/IdMarkVerify';
import { addPjCostRow, getFocus, getItems, subscribeStore, updateItems } from '../components/store';
import { ExportButton, useExport, getUserName, ExportDialog, type ExportField } from '../components/export';

/* ============ 类型色板 ============ */
const KIND_TONE: Record<ItemKind, TagTone> = { 物料: 'blue', 服务: 'purple', 套件: 'gold', 软件: 'link' };
const KIND_DESC: Record<ItemKind, string> = {
  物料: '有库存（仓库分账 + 安全线）· 认证要求由所属目录派生 · 成本 = 含税采购价还原',
  服务: '无实物库存 · 成本 = 人工构成（工种 × 工日 × 单价）+ 可挂耗材行',
  套件: '成套交付 · 成本 = 配置行（引用主数据，可嵌子套件）自动合计',
  软件: '无实物库存 · 许可 / 订阅费 · 成本 = 参考价（6% 现代服务口径，不做价税分离）',
};
/** 配置行可选类型（套件配置 = 物料 / 服务 / 软件行混合，可嵌子套件） */
const LINE_KINDS: ItemKind[] = [...ITEM_KINDS];
/* 物料选择器的类型档位常量：选择器把 kinds 当 useMemo 依赖，必须在模块级定义（不能每渲染新造数组） */
const KINDS_NO_KIT = ITEM_KINDS.filter((k) => k !== '套件');
const KINDS_STOCKED = ITEM_KINDS.filter((k) => isStocked(k));

/**
 * 路由 → 域 / Tab 映射（模块作用域常量）。
 * 物料域已压平为左侧二级菜单（供应链管理组 6 项平铺），5 个二级页各自就是主菜单项、
 * **点即到**，不再需要先点开「物料与资源」再展开子树。
 * 路由是唯一的域/页签来源：无论从左侧菜单还是顶部瓦片进入，都走同一条 `go(route)`，
 * 由下面的 useEffect 单向写入 domain / tab —— 杜绝「菜单与瓦片两套导航各自改状态」的重叠。
 */
const ROUTE_VIEW: Record<string, { domain: 'master' | 'wh' | 'src' | 'cmp'; tab: string }> = {
  'material-list': { domain: 'master', tab: 'list' },
  /** 套件与配置已并入物料主数据**同一张列表**（套件与配置的 12 条本就是主数据 31 条的子集，
      成本构成入口保留在行内「配置」按钮）；旧链接 material-kit 保留路由兜底，落到与 material-list 完全一致的页 */
  'material-kit': { domain: 'master', tab: 'list' },
  'material-stock': { domain: 'wh', tab: 'stock' },
  'material-src': { domain: 'src', tab: 'rfq' },
  'material-cert': { domain: 'cmp', tab: 'cert' },
};

type EditLine = { kind: ItemKind; code: string; qty: number; loss: number; locked?: number };

export default function MaterialPage({ go, role, nav, pageId }: {
  go: (p: string) => void; role: string; nav?: number;
  /** 路由 id（material-list / material-kit / material-stock / material-src / material-cert） */
  pageId?: string;
}) {
  const toast = useToast();
  /* 分类树同源订阅：树上新增 / 重命名 / 删除后，面包屑「当前分类」、分类目录列与表单下拉即时刷新 */
  useSyncExternalStore(subscribeCats, catVersion, catVersion);
  /* 号段 / 流向账同源订阅：入库采录、领用回写后，台账与批次账即时刷新（跨页共享同一份数组） */
  useSyncExternalStore(subscribeIdMark, idMarkVersion, idMarkVersion);

  /**
   * 主数据写入权限（M10）：统一走 `can(role, 'material-list')` —— 与左侧「物料主数据」菜单的
   * 「角色 × 模块」矩阵同源，不再本页自留一份角色白名单（两套口径迟早打架：本页原先只放 4 个角色，而菜单对「物料与服务」
   * 还开放了财务，改一处忘一处就会出现「菜单进得来、按钮点不动」或反之）。
   * 无权时不静默失效，而是明确告知当前角色无权限 —— 原型可切换角色演示。
   */
  /* 仓管：库存作业可写，但主数据 / 套件配置 / 寻源只读 */
  const canWrite = can(role, 'material-list') && role !== 'warehouse';
  const guardWrite = (fn: () => void) => () => {
    if (canWrite) { fn(); return; }
    toast(`当前角色（${role}）无主数据写入权限 · 可写角色见「物料主数据」菜单授权范围`, 'err');
  };

  /* ============ 可写主数据 ============
   * 数据落在共享 store（不再用页面本地副本）：物料新增 / 停用 / 改价 / 认证维护后，
   * 报价工作台的「从物料库添加」与配置编辑器即时可见。
   * setItems 指向 store 的 updateItems（签名与 setState 一致），页面内既有写点无需改写。
   * ==================================================================== */
  const [items, setItemsState] = useState<Item[]>(getItems);
  useEffect(() => subscribeStore(() => setItemsState(getItems())), []);
  const setItems = updateItems;
  const [recipes, setRecipes] = useState(() => JSON.parse(JSON.stringify(RECIPES)) as typeof RECIPES);
  const byCode = (code: string) => items.find((x) => x.code === code);
  const costOf = (code: string, ver?: string) => recipeCost(code, ver, { items, recipes });
  const svcCostOf = (code: string) => serviceCost(code, items);
  /** 服务参考单价 == 人工 + 耗材（不手填，改配置即同步） */
  const normService = (it: Item): Item => (it.ty === '服务' ? { ...it, price: serviceCost(it.code, items).total } : it);

  /* ============ 导航 ============ */
  const [domain, setDomain] = useState<'master' | 'wh' | 'src' | 'cmp'>('master');
  const [tab, setTab] = useState('list');
  const [kw, setKw] = useState('');
  const [tyF, setTyF] = useState<'全部' | ItemKind>('全部');
  const [stF, setStF] = useState('全部');
  const [certF, setCertF] = useState('全部');
  const [catTree, setCatTree] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  /** 操作日志抽屉（页面级入口：关键操作审计不属于任何业务域） */
  const [auditOpen, setAuditOpen] = useState(false);
  /* 身份标识验真抽屉（页面级入口：验真是「对着实物问真伪」，不属于某个业务域，
     与日志抽屉同层；型号明细里带入的明码通过 verifyMark 传入） */
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyMark, setVerifyMark] = useState('');
  /** 厂家号段推送 · 驳回原因弹窗（驳回必填原因，供厂家侧追溯） */
  const [pushRj, setPushRj] = useState<string | null>(null);
  const [pushWhy, setPushWhy] = useState('');

  /* ============ 详情 / 配置编辑器 ============ */
  const [detail, setDetail] = useState<Item | null>(null);
  const [recipeFor, setRecipeFor] = useState<string | null>(null);
  const [draftLines, setDraftLines] = useState<EditLine[]>([]);
  const [draftSale, setDraftSale] = useState(0);
  const [svcDraft, setSvcDraft] = useState<{ labor: LaborLine[]; consumables: ConsumableLine[] } | null>(null);
  const [priceOpen, setPriceOpen] = useState<string | null>(null);
  const [priceVal, setPriceVal] = useState('');

  /* ============ 新增主数据 ============ */
  const [newOpen, setNewOpen] = useState(false);
  const [newErr, setNewErr] = useState('');
  const [nf, setNf] = useState({
    ty: '物料' as ItemKind, name: '', spec: '', cat: '', unit: UNITS[0], price: '', safe: '',
    ccc: false, mand: false, certType: CERT_TYPES[0], certNo: '', certValidTo: '', batch: '', notifyCh: CHANNELS[0],
    qualReq: '', sale: '',
  });
  const [nfLabor, setNfLabor] = useState<LaborLine[]>([{ trade: LABOR_RATES[0].trade, days: 1 }]);
  const [nfMats, setNfMats] = useState<ConsumableLine[]>([]);
  const [importOpen, setImportOpen] = useState(false);

  /* ============ 库存作业 ============ */
  const [whView, setWhView] = useState('全部');
  const [opIn, setOpIn] = useState(false);
  const [opOut, setOpOut] = useState(false);
  const [opBack, setOpBack] = useState(false);
  const [opCheck, setOpCheck] = useState(false);
  const [opMove, setOpMove] = useState(false);
  const [opSafe, setOpSafe] = useState<Item | null>(null);
  const [safeVal, setSafeVal] = useState('');
  const [inCode, setInCode] = useState('');
  const [inWh, setInWh] = useState(WH[0]);
  const [inToWh, setInToWh] = useState(WH[1] || WH[0]);
  const [inLoc, setInLoc] = useState(LOC[0]);
  const [inBatch, setInBatch] = useState('');
  const [inQty, setInQty] = useState('');
  const [inPrice, setInPrice] = useState('');
  const [inPo, setInPo] = useState('');
  const [inDate, setInDate] = useState(TODAY);
  const [inBy, setInBy] = useState('张仓');
  const [inErr, setInErr] = useState('');
  /** 消防产品身份标识：入库采录的起止明码（仅强制认证产品必填） */
  const [inMarkFrom, setInMarkFrom] = useState('');
  const [inMarkTo, setInMarkTo] = useState('');
  /** 领用流向回写：关联项目 + 安装部位 */
  const [outProj, setOutProj] = useState('XM000123');
  const [outPart, setOutPart] = useState('');
  const [batchFor, setBatchFor] = useState<string | null>(null);
  const [whStock, setWhStock] = useState<Record<string, Record<string, number>>>(WH_STOCK_SEED);
  const [flow, setFlow] = useState<FlowRow[]>(FLOW_SEED);
  const [audit, setAudit] = useState<MatAuditRow[]>(AUDIT_SEED);

  /* ============ 各 Tab 导出勾选（切换 Tab 时清空） ============ */
  const [listSel, setListSel] = useState<string[]>([]);
  const [stockSel, setStockSel] = useState<string[]>([]);
  const [flowSel, setFlowSel] = useState<string[]>([]);
  const [rfqSel, setRfqSel] = useState<string[]>([]);
  const [plibSel, setPlibSel] = useState<string[]>([]);
  const [certSel, setCertSel] = useState<string[]>([]);
  const [certMissOnly, setCertMissOnly] = useState(false); /* 可落地④：缺证物料视图开关 */

  const resetOpForm = () => {
    setInErr(''); setInQty(''); setInBatch(''); setInPrice(''); setInPo('');
    setInMarkFrom(''); setInMarkTo(''); setOutPart('');
  };
  const whOf = (code: string) => whStock[code] || {};
  /** 当前仓库视图口径下的库存：全部 = 总账，否则 = 该仓实存 */
  const scopeStock = (code: string, total: number) => (whView === '全部' ? total : (whOf(code)[whView] || 0));

  /** 有库存的主数据（物料）—— 库存作业域自动只出现这两类，不靠人工维护 */
  const stocked = useMemo(() => items.filter((i) => isStocked(i.ty)), [items]);
  /** 可用 = 结余（预占不再以 6% 估算；真实占用派生前，可用即结余） */
  const availOf = (it: Item) => Math.max(0, (whView === '全部' ? it.stock : (whOf(it.code)[whView] || 0)));
  const lowItems = useMemo(() => items.filter((i) => isStocked(i.ty) && i.stock < i.safe), [items]);
  /* D3：在途 = 该物料所有未关闭 PO 的未收数量合计（待到货 + 部分到货，扣已入库 received） */
  const inTransitOf = (code: string) => rfqs.reduce((sum, r) => {
    if (!r.po || r.po.status === '已入库') return sum;
    const line = r.mats.find((m) => m.code === code);
    if (!line) return sum;
    const recv = r.po.received ?? 0;
    return sum + Math.max(0, line.qty - recv);
  }, 0);
  /* D3：缺口 = 安全线 − 结余 − 在途（在途到货后补足缺口，不再重复采购） */
  const gapOf = (it: Item) => Math.max(1, it.safe - it.stock - inTransitOf(it.code));

  /**
   * 作业提交（入库 / 领用 / 退料 / 盘点 / 调拨）：一次写四处，保证同源。
   * ① 仓库分账 ② 总账（由分账派生）③ 作业流水 ④ 操作日志
   */
  const commitOp = (o: {
    type: '入库' | '领用' | '退料' | '盘点' | '调拨';
    code: string; wh: string; toWh?: string; qty: number; by: string; msg: string; act: string;
    /** 存货金额变动（元 · 不含税）：正 = 入库 / 退料回冲，负 = 领用结转 / 盘亏。调拨不传（总量不变） */
    amt?: number;
  }) => {
    const m = byCode(o.code);
    if (!m) return;
    const now = new Date();
    const time = `${TODAY} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const no = opNo(o.type, TODAY, flow.length + 1);

    const nextWh = { ...whOf(o.code) };
    const delta = o.type === '调拨' ? 0 : o.type === '领用' ? -Math.abs(o.qty) : o.qty;
    if (o.type === '调拨' && o.toWh && o.toWh !== o.wh) {
      nextWh[o.wh] = Math.max(0, (nextWh[o.wh] || 0) - Math.abs(o.qty));
      nextWh[o.toWh] = (nextWh[o.toWh] || 0) + Math.abs(o.qty);
    } else {
      nextWh[o.wh] = Math.max(0, (nextWh[o.wh] || 0) + delta);
    }
    const total = Object.values(nextWh).reduce((s, n) => s + n, 0);
    setWhStock((prev) => ({ ...prev, [o.code]: nextWh }));
    setItems((rs) => rs.map((x) => (x.code === o.code
      ? { ...x, stock: total, stockAmt: o.amt == null ? x.stockAmt : Math.max(0, (x.stockAmt ?? 0) + o.amt) }
      : x)));
    setFlow((v) => [{
      t: time, type: o.type, no, mat: `${m.name} ${m.spec}`.trim(),
      qty: `${o.type === '调拨' ? '' : delta > 0 ? '+' : ''}${o.type === '调拨' ? Math.abs(o.qty) : delta} ${m.unit}`,
      wh: o.type === '调拨' ? `${o.wh} → ${o.toWh}` : o.wh, by: o.by,
    }, ...v]);
    setAudit((v) => [{ t: time, who: o.by, role: '仓管员', act: `${o.type}登记 ${no} · ${o.act}` }, ...v]);
    toast(o.msg);
  };

  /** 非库存类关键操作单独留痕 */
  const auditOnly = (who: string, roleName: string, act: string) => {
    const now = new Date();
    const time = `${TODAY} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setAudit((v) => [{ t: time, who, role: roleName, act }, ...v]);
  };

  /* ============ 价格库 ============ */
  const [plibRev, setPlibRev] = useState(false);
  const [plibHis, setPlibHis] = useState<typeof PRICE_LIB[number] | null>(null);

  /* ============ 合规资质 ============ */
  const [certs, setCerts] = useState<CertRow[]>(CERT_SEED);
  const [certUp, setCertUp] = useState(false);
  const [cuMat, setCuMat] = useState('');
  const [cuType, setCuType] = useState(CERT_TYPES[0]);
  const [cuNo, setCuNo] = useState('');
  const [cuTo, setCuTo] = useState('');
  const [cuBatch, setCuBatch] = useState('');
  const [cuCh, setCuCh] = useState(CHANNELS[0]);

  /* ============ 采购寻源 ============ */
  const [rfqs, setRfqs] = useState<RfqRow[]>(RFQ_SEED);
  const [rfqNew, setRfqNew] = useState(false);
  const [rfqLines, setRfqLines] = useState<{ code: string; qty: string }[]>([]);
  const [rfqNeed, setRfqNeed] = useState('2026-09-28');
  const [rfqDl, setRfqDl] = useState('2026-09-23 18:00');
  const [rfqInv, setRfqInv] = useState<string[]>(['GYS000012', 'GYS000028']);
  const [rfqErr, setRfqErr] = useState('');
  const [rfqFrom, setRfqFrom] = useState('手工发起');
  const [qrOpen, setQrOpen] = useState<string | null>(null);
  const [matrix, setMatrix] = useState<RfqRow | null>(null);
  const [quoteOpen, setQuoteOpen] = useState<RfqRow | null>(null);
  const [quoteAs, setQuoteAs] = useState('GYS000012');
  const [quoteVals, setQuoteVals] = useState<Record<string, string>>({});
  const [poFor, setPoFor] = useState<RfqRow | null>(null);
  const [demo, setDemo] = useState(false);

  /* ============ 全局检索 ============ */
  const [gSearch, setGSearch] = useState(false);
  const [gKw, setGKw] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        /* 评审 I5 约定：页面级检索先接管并在事件上打 __ncHandled 标记，
           AppShell 延后一拍检查该标记后让位。缺了这个标记，Ctrl+K 会同时弹出
           「本页检索」与顶栏全局搜索两层浮层（文档中心 DocPage 同款写法）。 */
        (e as KeyboardEvent & { __ncHandled?: boolean }).__ncHandled = true;
        setGSearch(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* 默认作业物料：第一件有库存的主数据 */
  useEffect(() => { if (!inCode && stocked.length) setInCode(stocked[0].code); }, [inCode, stocked]);
  useEffect(() => { if (!cuMat && stocked.length) setCuMat(stocked[0].code); }, [cuMat, stocked]);

  /**
   * 路由 → 域 / Tab：由左侧二级菜单驱动。
   * 声明在「外部下钻」之前 —— 后者声明在后、执行在后，能把域强制拉回主数据列表，
   * 保证从别处下钻进来的物料详情一定可见。
   */
  useEffect(() => {
    const v = ROUTE_VIEW[pageId ?? 'material-list'];
    if (!v) return;
    setDomain(v.domain); setTab(v.tab); setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId, nav]);

  /**
   * 外部下钻：驾驶舱「低于安全库存」等卡片 → 打开该物料详情。
   * focus key 固定为 'material'（历史深链键），与本页路由名压平后不再同名，故两个键都认。
   */
  useEffect(() => {
    const code = getFocus('material') || getFocus('material-list');
    if (!code) return;
    const hit = items.find((x) => x.code === code);
    if (!hit) return;
    setDomain('master'); setTab('list'); setTyF('全部'); setCatTree(''); setPage(1);
    setDetail(hit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getFocus('material'), getFocus('material-list')]);

  const supName = (id: string) => SUPPLIERS.find((s) => s.id === id)?.name || id;
  const supOf = (id: string) => SUPPLIERS.find((s) => s.id === id);

  /* ============ 主数据列表筛选 ============ */
  const inCat = (id: string, code: string) => !code || catSubtreeIds(id).includes(code);
  const base = useMemo(() => items.filter((m) =>
    (tyF === '全部' || m.ty === tyF)
    && (!catTree || inCat(catTree, m.cat))), [items, tyF, catTree]);
  const cntBy = (fn: (m: Item) => boolean) => base.filter(fn).length;
  const filtered = useMemo(() => base.filter((m) =>
    (stF === '全部' || m.status === stF)
    && (certF === '全部'
      || (certF === '强制' ? itemNeedCCC(m)
        : certF === 'CCCF' ? m.ccc
          : certF === '缺证' ? itemCertMiss(m)
            : certF === '继承' ? (!isStocked(m.ty) && inheritsMand(m.code)) : true))
    && (!kw || m.name.includes(kw) || m.code.includes(kw) || m.spec.includes(kw))), [base, stF, certF, kw]);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  /* 分类树计数：只给「精确挂在分类上」的条目数，子树汇总由 CategoryTree 内部完成 */
  const catCountExact = (id: string) => items.filter((r) => r.cat === id).length;
  const catUsed = useMemo(() => items.map((r) => r.cat).filter(Boolean), [items]);

  /* ============ 工作域与 Tab（徽标一律为「行数」语义） ============ */
  const openRfq = rfqs.filter((r) => r.status === '询价中' || r.status === '已报价').length;
  const expSoon = certs.filter((c) => { const d = daysLeft(c.validTo); return d !== Infinity && d <= 30; }).length;
  /* 页签条只服务「一域多视图」的域 —— 物料主数据域已不再有页签。
     「套件与配置」的 12 条（服务 8 + 套件 4）本来就是主数据 31 条的**子集**，只是多带一层成本构成视角；
     拆成两个页签会让同一批行出现在两处，切一次还要重置 8 个筛选态，故并成**一张列表**：
     成本构成由「成本」列 + 行内「配置」入口承担（见 cols）；要看这批行用「类型」筛选逐类查。 */
  const DOMAIN_TABS: Record<'wh' | 'src' | 'cmp', { key: string; label: string; cnt: number }[]> = {
    wh: [
      { key: 'stock', label: '库存与领用', cnt: stocked.length },
      { key: 'flow', label: '作业流水', cnt: flow.length },
      /* 厂家号段推送：货未到、号段先到，确认入库才写入企业号段账 —— 放在库存域，与「作业流水」同级 */
      { key: 'push', label: '号段推送管理', cnt: PUSH_BATCHES.filter((b) => b.status === '待确认').length },
    ],
    src: [
      { key: 'rfq', label: '询比价', cnt: rfqs.length },
      { key: 'plib', label: '物料价格库', cnt: PRICE_LIB.length },
    ],
    /* 原「服务资质」「操作日志」两项已移出本域：
       服务资质 = 全部服务主数据的重复视图（资质要求已是主数据字段，见列表「资质要求」列与详情抽屉）；
       操作日志 = 页面级审计，不属于任何业务域（改为页头「日志」抽屉）。 */
    cmp: [
      { key: 'cert', label: '认证与报告', cnt: certs.length },
    ],
  };

  /* 顶部指标卡 = 口径概览 + 穿透入口；导航只有一个来源：左侧二级菜单（本页由路由驱动） */
  const DOMAIN_TITLE: Record<typeof domain, string> = {
    /* 合并页统一叫「物料主数据」（与左侧菜单 / 页签标题同源）；两段各自的名字见页内分区标题 */
    master: '物料主数据',
    wh: '库存管理',
    src: '采购寻源',
    cmp: '认证与报告',
  };

  /* ============ 统一导出（各 Tab 接入公共导出组件；敏感字段强制水印 + 审计） ============ */
  const flowFiltered = flow.filter((f) => whView === '全部' || f.wh.includes(whView));
  const plibFiltered = PRICE_LIB.filter((p) => !plibRev || p.review);

  const listFields: ExportField[] = [
    { key: 'code', label: '物料编码' },
    { key: 'name', label: '名称' },
    { key: 'spec', label: '规格型号' },
    { key: 'unit', label: '单位' },
    { key: 'cat', label: '类别' },
    { key: 'price', label: '参考价', sensitive: true },
    { key: 'stock', label: '库存' },
    { key: 'status', label: '状态' },
  ];
  const listExport = useExport({
    pageKey: 'material-list', pageName: '物料主数据',
    fields: listFields, defaultFieldKeys: listFields.map((f) => f.key),
    totalCount: base.length, filteredCount: filtered.length, selectedCount: listSel.length,
    previewRows: filtered.slice(0, 5),
    userName: getUserName(role),
    onExport: () => { /* 原型：导出与审计由 useExport 内置完成 */ },
  });

  const stockFields: ExportField[] = [
    { key: 'code', label: '物料编码' },
    { key: 'name', label: '名称' },
    { key: 'wh', label: '仓库' },
    { key: 'stock', label: '库存数' },
    { key: 'unit', label: '单位' },
    { key: 'lastIn', label: '最近出入库日' },
  ];
  const stockExport = useExport({
    pageKey: 'material-stock', pageName: '库存台账',
    fields: stockFields, defaultFieldKeys: stockFields.map((f) => f.key),
    totalCount: stocked.length, filteredCount: stocked.length, selectedCount: stockSel.length,
    previewRows: stocked.slice(0, 5),
    userName: getUserName(role),
    onExport: () => {},
  });

  const flowFields: ExportField[] = [
    { key: 'no', label: '流水号' },
    { key: 't', label: '日期' },
    { key: 'type', label: '类型' },
    { key: 'mat', label: '物料' },
    { key: 'qty', label: '数量' },
    { key: 'wh', label: '仓库' },
    { key: 'by', label: '经办人' },
  ];
  const flowExport = useExport({
    pageKey: 'material-flow', pageName: '作业流水',
    fields: flowFields, defaultFieldKeys: flowFields.map((f) => f.key),
    totalCount: flow.length, filteredCount: flowFiltered.length, selectedCount: flowSel.length,
    previewRows: flowFiltered.slice(0, 5),
    userName: getUserName(role),
    onExport: () => {},
  });

  const rfqFields: ExportField[] = [
    { key: 'id', label: '询价单号' },
    { key: 'mats', label: '物料' },
    { key: 'invited', label: '供应商' },
    { key: 'quote', label: '报价', sensitive: true },
    { key: 'taxRate', label: '税率', sensitive: true },
    { key: 'status', label: '状态' },
  ];
  const rfqExport = useExport({
    pageKey: 'material-rfq', pageName: '采购寻源',
    fields: rfqFields, defaultFieldKeys: rfqFields.map((f) => f.key),
    totalCount: rfqs.length, filteredCount: rfqs.length, selectedCount: rfqSel.length,
    previewRows: rfqs.slice(0, 5),
    userName: getUserName(role),
    onExport: () => {},
  });

  const plibFields: ExportField[] = [
    { key: 'code', label: '物料编码' },
    { key: 'name', label: '名称' },
    { key: 'brand', label: '品牌' },
    { key: 'supplier', label: '供应商' },
    { key: 'price', label: '含税成交价', sensitive: true },
    { key: 'std', label: '标准价', sensitive: true },
    { key: 'dev', label: '偏离' },
    { key: 'src', label: '来源' },
  ];
  const plibExport = useExport({
    pageKey: 'material-plib', pageName: '物料价格库',
    fields: plibFields, defaultFieldKeys: plibFields.map((f) => f.key),
    totalCount: PRICE_LIB.length, filteredCount: plibFiltered.length, selectedCount: plibSel.length,
    previewRows: plibFiltered.slice(0, 5),
    userName: getUserName(role),
    onExport: () => {},
  });

  const certFields: ExportField[] = [
    { key: 'no', label: '证书编号' },
    { key: 'mat', label: '物料' },
    { key: 'type', label: '类型' },
    { key: 'issuer', label: '发证机构' },
    { key: 'validTo', label: '有效期' },
    { key: 'status', label: '状态' },
  ];
  const certExport = useExport({
    pageKey: 'material-cert', pageName: '认证与报告',
    fields: certFields, defaultFieldKeys: certFields.map((f) => f.key),
    totalCount: certs.length, filteredCount: certs.length, selectedCount: certSel.length,
    previewRows: certs.slice(0, 5),
    userName: getUserName(role),
    onExport: () => {},
  });



  /* ============ 配置编辑器 ============ */
  const openRecipe = (code: string) => {
    const it = byCode(code);
    if (!it) return;
    setRecipeFor(code);
    if (it.ty === '服务') {
      setSvcDraft({ labor: (it.labor || []).map((l) => ({ ...l })), consumables: (it.consumables || []).map((c) => ({ ...c })) });
    } else {
      const R = recipes[code];
      const v = R?.versions.find((x) => x.v === R.cur) || R?.versions[0];
      setDraftLines((v?.lines || []).map((l) => ({ kind: l.kind, code: l.code, qty: l.qty, loss: l.loss ?? 0, locked: l.lockedPrice })));
      setDraftSale(byCode(code)?.sale ?? 0);
    }
  };
  const closeRecipe = () => { setRecipeFor(null); setSvcDraft(null); setDraftLines([]); };

  /** 编辑态实时汇总（与数据层同一套算法，只是把草稿作为来源传进去） */
  const draftCost = (() => {
    if (!recipeFor) return null;
    const it = byCode(recipeFor);
    if (!it) return null;
    if (it.ty === '服务' && svcDraft) {
      const labor = svcDraft.labor.reduce((s, l) => s + laborRate(l.trade) * l.days, 0);
      const mat = svcDraft.consumables.reduce((s, c) => s + (byCode(c.code)?.price ?? 0) * c.qty, 0);
      return { mat: Math.round(mat), labor: Math.round(labor), total: Math.round(mat + labor), sale: 0, gross: 0, short: 0, lineCnt: svcDraft.labor.length + svcDraft.consumables.length, miss: [] as string[] };
    }
    /* 用草稿行 + 暂存对外价做一次等价推演 */
    const tmp: typeof recipes = JSON.parse(JSON.stringify(recipes));
    const R = tmp[recipeFor];
    if (R) {
      const v = R.versions.find((x) => x.v === R.cur) || R.versions[0];
      if (v) v.lines = draftLines.map((l) => ({ kind: l.kind, code: l.code, qty: l.qty, loss: l.loss, lockedPrice: l.locked }));
    }
    const tmpItems = items.map((i) => (i.code === recipeFor ? { ...i, sale: draftSale } : i));
    return recipeCost(recipeFor, undefined, { items: tmpItems, recipes: tmp });
  })();

  /** 保存配置：服务就地更新；套件已被引用则升版（旧版快照保留） */
  const saveRecipe = () => {
    if (!recipeFor) return;
    const it = byCode(recipeFor);
    if (!it) return;
    if (it.ty === '服务' && svcDraft) {
      const empty = svcDraft.labor.some((l) => !(l.days > 0));
      if (empty) { toast('人工行的工日须 > 0', 'err'); return; }
      setItems((rs) => rs.map((x) => {
        if (x.code !== recipeFor) return x;
        const next: Item = { ...x, labor: svcDraft.labor, consumables: svcDraft.consumables };
        return { ...next, price: next.labor!.reduce((s, l) => s + laborRate(l.trade) * l.days, 0) + next.consumables!.reduce((s, c) => s + (byCode(c.code)?.price ?? 0) * c.qty, 0) };
      }));
      auditOnly(it.owner, '主数据管理员', `服务成本构成调整 · ${it.name}（人工 ${svcDraft.labor.length} 行 · 耗材 ${svcDraft.consumables.length} 行）`);
      toast(`${it.name} 成本构成已保存 · 参考价按人工 + 耗材自动同步为 ${fmt(draftCost?.total ?? 0)}`);
      closeRecipe();
      return;
    }
    if (draftLines.some((l) => !l.code || !(l.qty > 0))) { toast('每行须选择引用对象且数量 > 0', 'err'); return; }
    setRecipes((prev) => {
      const next = JSON.parse(JSON.stringify(prev)) as typeof RECIPES;
      const R = next[recipeFor];
      if (!R) return prev;
      const cur = R.versions.find((x) => x.v === R.cur) || R.versions[0];
      const lines: RecipeLine[] = draftLines.map((l) => ({ kind: l.kind, code: l.code, qty: l.qty, loss: l.kind === '服务' || l.kind === '套件' ? undefined : l.loss, lockedPrice: l.locked }));
      if ((cur?.refs ?? 0) > 0) {
        const [maj, min] = R.cur.slice(1).split('.').map(Number);
        const nv = `V${maj}.${(min || 0) + 1}`;
        R.versions.forEach((v) => { v.st = '历史'; });
        R.versions.unshift({ v: nv, st: '生效', lines, created: TODAY, refs: cur.refs });
        R.cur = nv;
        toast(`配置已升版至 ${nv}（被报价引用 ${cur.refs} 次，旧版快照保留）`);
      } else {
        cur.lines = lines;
        toast(`配置已就地更新（未被报价引用，不产生新版本）`);
      }
      return next;
    });
    if (draftSale !== it.sale) setItems((rs) => rs.map((x) => (x.code === recipeFor ? { ...x, sale: draftSale, price: draftSale } : x)));
    auditOnly(it.owner, '主数据管理员', `配置调整 · ${it.name}（${draftLines.length} 行）`);
    closeRecipe();
  };

  /* ============ 询价：携带物料与缺口 ============ */
  const startRfq = (lines: { code: string; qty: string }[], from: string) => {
    setRfqLines(lines);
    setRfqFrom(from);
    setRfqErr('');
    setDomain('src'); setTab('rfq');
    setRfqNew(true);
  };

  /* ============ 主数据列表列 ============ */
  const cols: Col<Item>[] = [
    {
      key: 'code', title: '编码', width: 104, hide: true,
      /* 编号列统一走 IdCell：可点击 → 蓝色，点击打开本行详情 */
      render: (m) => <IdCell onClick={() => setDetail(m)} title="查看主数据详情">{m.code}</IdCell>,
    },
    {
      key: 'name', title: '名称 / 规格型号', sticky: 'left', render: (m) => {
        /* 认证类徽标合并为 1 个「证：CCCF / 缺证」，缺证才红；行内 tag 外露 2 个，其余收 +N */
        const rowTags: { label: string; tone: TagTone; title?: string }[] = [];
        if (m.ccc) rowTags.push({ label: '证：CCCF', tone: 'blue' });
        else if (itemNeedCCC(m) && !m.ccc) rowTags.push({ label: '证：缺证', tone: 'red', title: `${catPath(m.cat)} 要求 ${certRuleCn(m.cat)}，该条目暂无 CCCF 证书` });
        if (itemNeedCCC(m) && !m.mand) rowTags.push({ label: '强制·派生', tone: 'orange', title: '由所属目录派生的强制要求' });
        if (m.mand) rowTags.push({ label: '强制·收紧', tone: 'orange', title: '人工收紧：该型号确属强制性产品目录' });
        if (!isStocked(m.ty) && inheritsMand(m.code)) rowTags.push({ label: '强制·继承', tone: 'orange' });
        const extra = rowTags.slice(2);
        return (
          <div>
            <div>
              {m.name}
              {rowTags.slice(0, 2).map((t) => <span key={t.label} title={t.title}><Tag tone={t.tone}>{t.label}</Tag></span>)}
              {extra.length > 0 && <span title={extra.map((t) => t.label).join('、')}><Tag tone="gray">+{extra.length}</Tag></span>}
            </div>
            <div className="nc-tiny nc-muted">规格型号：{m.spec}</div>
          </div>
        );
      },
    },
    { key: 'ty', title: '类型', width: 84, render: (m) => <Tag tone={KIND_TONE[m.ty]}>{m.ty}</Tag> },
    { key: 'cat', title: '分类目录', width: 140, render: (m) => <span className="nc-tiny" title={catPath(m.cat)}>{catPath(m.cat)}</span> },
    { key: 'unit', title: '单位', width: 62, align: 'center', render: (m) => <b>{m.unit}</b> },
    { key: 'price', title: '参考价', width: 96, align: 'right', render: (m) => <b className="num">{m.price >= 10000 ? fmtWan(m.price) : fmt(m.price)}</b> },
    {
      /* 成本构成并进本表后新增的一列 —— 口径走唯一入口 itemCostBase()，四类都有值：
         物料 / 套件 = 参考价（套件取配置展开成本）按 Item.taxRate 还原为不含税；服务 / 软件 = 参考价本身即成本。
         毛利率 / 构成行数 / 缺料预检等仍留在行内「配置」抽屉，不铺成只有少数行有值的空列。 */
      key: 'cost', title: '成本', width: 104, align: 'right',
      render: (m) => (
        <span className="num" title={(m.ty === '服务' || m.ty === '软件')
          ? `${m.ty}参考价即成本（不含税）`
          : `参考价 ${fmt(m.price)} 按 ${itemTaxRate(m)}% 税率还原为不含税成本`}
        >{fmt(itemCostBase(m))}</span>
      ),
    },

    {
      key: 'stock', title: '库存概要', width: 176, render: (m) => {
        if (!isStocked(m.ty)) return <span className="nc-muted nc-tiny">—（{m.ty}不持实物库存）</span>;
        const low = m.stock < m.safe;
        const b = scopeStock(m.code, m.stock);
        return (
          <span className={low ? 'nc-v-red' : ''} title={low ? `当前库存 ${m.stock}，低于安全线 ${m.safe}，缺口 ${gapOf(m)}；可用 = 结余 ${b}` : `可用 = 结余 ${b}`}>
            <b className="num">{m.stock}</b><span className="nc-muted"> / 安全线 {m.safe}</span>
            {low && <Tag tone="red">需补货</Tag>}
          </span>
        );
      },
    },

    { key: 'status', title: '状态', width: 78, render: (m) => <Tag tone={m.status === '启用' ? 'green' : 'gray'} pill>{m.status}</Tag> },
    {
      key: 'op', title: '操作', width: 150, sticky: 'right', render: (m) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Op onClick={() => setDetail(m)}>详情</Op>
          <OpSep />
          {(m.ty === '服务' || m.ty === '套件') && <Op gold onClick={() => openRecipe(m.code)}>配置</Op>}
          <OpMore items={[
            { label: '复制', onClick: guardWrite(() => {
              const pfx = m.ty === '物料' ? 'CL' : m.ty === '服务' ? 'SV' : m.ty === '软件' ? 'SW' : 'CP'; /* EQ 为历史设备编码，新建物料统一用 CL */
              const n = Math.max(...items.map((r) => Number(r.code.replace(/\D/g, ''))), 0) + 1;
              const clone: Item = { ...m, id: pfx + String(n).padStart(6, '0'), code: pfx + String(n).padStart(6, '0'), name: `${m.name}（副本）`, stock: 0, hold: 0 };
              setItems((rs) => [...rs, clone]);
              auditOnly(m.owner, '主数据管理员', `复制主数据 ${m.code} → ${clone.code}（待提交变更审批）`);
              toast(`已复制为 ${clone.code} · ${clone.name}`);
            }) },
          ]} />
        </span>
      ),
    },
  ];

  /* ============ 各页签列表分页：主列表一律带分页 + 总计数（列表页布局规范） ============ */
  const stockRows = useMemo(() => [...stocked].sort((a, b) => (a.stock - a.safe) - (b.stock - b.safe)), [stocked]);
  const stockPaged = usePaged(stockRows);
  const flowPaged = usePaged(flowFiltered);
  const pushPaged = usePaged(PUSH_BATCHES);
  const rfqPaged = usePaged(rfqs);
  const plibPaged = usePaged(plibFiltered);
  const certPaged = usePaged(certs);

  return (
    <>
      <PageHead
        crumbs={['供应链与物料', DOMAIN_TITLE[domain]]}
        title={DOMAIN_TITLE[domain]}
        badges={undefined}
        actions={<>
          <Btn onClick={() => { setVerifyMark(''); setVerifyOpen(true); }} title="消防产品身份标识（A / B 签）验真：外部备案核对 + 本企业流向回查"><Ico n="shield" size={16} /> 身份验真</Btn>
          <Btn onClick={() => setAuditOpen(true)} title="操作日志（关键操作审计 · 页面级入口）"><Ico n="clipboard" size={16} /> 日志</Btn>
        </>}
      />



      <Card flush>
        {/* 页签条：物料主数据域已合并为单页（无页签）；其余域只剩 1 项的也不渲染，
            避免「只有一个选项的切换器」 */}
        {domain !== 'master' && DOMAIN_TABS[domain].length > 1 && (
          <div style={{ padding: '12px 16px 0' }}>
            <Tabs value={tab} onChange={(k) => { setTab(k); setPage(1); setListSel([]); setStockSel([]); setFlowSel([]); setRfqSel([]); setPlibSel([]); setCertSel([]); setTyF('全部'); setStF('全部'); setCertF('全部'); setKw(''); setCatTree(''); setWhView('全部'); setPlibRev(false); }} items={DOMAIN_TABS[domain]} />
          </div>
        )}

        {/* ==================== 物料主数据 · 一张列表（物料 / 服务 / 软件 / 套件） ==================== */}
        {domain === 'master' && (
          <div className="nc-doc-layout" style={{ padding: 16 }}>
            <aside className="nc-doc-side">
              {/* 项17：物料分类树改为只读浏览，新增 / 重命名 / 删除统一在系统设置「多级分类目录」维护 */}
              <CategoryTree
                value={catTree}
                onChange={(id) => { setCatTree(id); setPage(1); }}
                countOf={catCountExact}
                usedIds={catUsed}
                editable={false}
              />
              <div className="nc-doc-side-foot">
                <button className="nc-dir-item" onClick={() => go('settings')}>
                  <span>分类维护在系统设置</span><span className="nc-tiny">→</span>
                </button>
              </div>
            </aside>
            <div className="nc-doc-main">
              <Card flush>
              <ListToolbar
                rows={[
                  {
                    label: '类型', value: tyF, onChange: (k) => { setTyF(k as '全部' | ItemKind); setPage(1); },
                    items: [
                      { key: '全部', label: '全部', cnt: items.length },
                      ...ITEM_KINDS.map((k) => ({ key: k, label: k, cnt: items.filter((i) => i.ty === k).length })),
                    ],
                  },
                  {
                    label: '状态', value: stF, onChange: (k) => { setStF(k); setPage(1); },
                    items: [
                      { key: '全部', label: '全部', cnt: base.length },
                      { key: '启用', label: '启用', cnt: cntBy((m) => m.status === '启用') },
                      { key: '停用', label: '停用', cnt: cntBy((m) => m.status === '停用') },
                    ],
                  },
                  {
                    label: '认证', value: certF, onChange: (k) => { setCertF(k); setPage(1); },
                    items: [
                      { key: '全部', label: '全部', cnt: base.length },
                      { key: '强制', label: '强制认证', cnt: cntBy((m) => itemNeedCCC(m)) },
                      { key: 'CCCF', label: 'CCCF', cnt: cntBy((m) => m.ccc) },
                      { key: '缺证', label: '缺证风险', cnt: cntBy((m) => itemCertMiss(m)) },
                      { key: '继承', label: '套件继承', cnt: cntBy((m) => !isStocked(m.ty) && inheritsMand(m.code)) },
                    ],
                  },
                ]}
                search={{ value: kw, onChange: (v) => { setKw(v); setPage(1); }, placeholder: '编码 / 名称 / 规格型号', width: 220 }}
                onReset={() => { setStF('全部'); setCertF('全部'); setTyF('全部'); setKw(''); setCatTree(''); setPage(1); }}
                moreMenu={[
                  { label: '批量导入', onClick: () => setImportOpen(true) },
                  /* 原套件列表工具条的「＋ 新增套件 / 服务」并到这里，不占工具条主位、也不丢入口 */
                  { label: '新增套件 / 服务', onClick: () => { if (!canWrite) { toast('当前角色无主数据维护权限', 'err'); return; } setNewErr(''); setNf((s) => ({ ...s, ty: '套件' })); setNewOpen(true); } },
                ]}
                actions={<>
                  <ExportButton onClick={listExport.trigger} selectedCount={listSel.length} />
                  <Btn kind="primary" disabled={!canWrite} title={canWrite ? undefined : `当前角色（${role}）无主数据维护权限`}
                    onClick={() => { if (!canWrite) { toast('当前角色无主数据维护权限', 'err'); return; } setNewErr(''); setNewOpen(true); }}>＋ 新增主数据</Btn>
                </>}
                echoItems={[
                  ...(tyF !== '全部' ? [{ key: 'ty', label: `类型：${tyF}` }] : []),
                  ...(stF !== '全部' ? [{ key: 'st', label: `状态：${stF}` }] : []),
                  ...(certF !== '全部' ? [{ key: 'cert', label: `认证：${certF}` }] : []),
                ]}
                onEchoRemove={(k) => {
                  if (k === 'ty') setTyF('全部'); else if (k === 'st') setStF('全部'); else setCertF('全部');
                  setPage(1);
                }}
                onEchoClear={() => { setStF('全部'); setCertF('全部'); setTyF('全部'); setKw(''); setCatTree(''); setPage(1); }}
              >
                <span className="nc-muted nc-tiny" style={{ marginLeft: 'auto' }}>
                  当前分类：<b>{catTree ? catPath(catTree) : '全部分类'}</b> · {filtered.length} 条
                </span>
              </ListToolbar>
              {/* 新增「成本」列后表宽不涨反降（1290 → 1260）：弹性列「名称 / 规格型号」吸收新列，
                  多出的宽度则从它身上收 —— 否则 1600px 窗口下右端被推出可视区，参考价只剩半个数字、
                  新增的成本值正好落在折线外，看着像坏了。此表本身列多，右端横向滚动是既有状态。 */}
              <DataTable cols={cols} rows={paged} rowKey={(m) => m.id} minWidth={1260}
                onRowClick={(m) => (!isStocked(m.ty) ? openRecipe(m.code) : setDetail(m))}
                selectable selected={listSel} onSelectAll={setListSel} onSelectRow={(id) => setListSel((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])}
                empty="没有符合筛选条件的条目；物料需库存，服务 / 套件需配置，均可在此新建"
                emptyCta={<Btn kind="primary" disabled={!canWrite} onClick={() => { if (!canWrite) { toast('当前角色无主数据维护权限', 'err'); return; } setNewOpen(true); }}>＋ 新增主数据</Btn>}
                foot={<TableFoot total={base.length} filtered={filtered.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />} />
              </Card>
            </div>
          </div>
        )}

        {/* ==================== 库存作业 · 库存与领用 ==================== */}
        {tab === 'stock' && (
          <div style={{ padding: 16 }}>
            <div className="nc-ltrow" style={{ marginBottom: 8 }}>
              <ExportButton onClick={stockExport.trigger} selectedCount={stockSel.length} />
              <Btn onClick={() => { resetOpForm(); setOpIn(true); }}>＋ 入库</Btn>
              <Btn onClick={() => { resetOpForm(); setOpOut(true); }}>＋ 领用</Btn>
              <OpMore items={[
                { label: '↩ 退料', onClick: () => { resetOpForm(); setOpBack(true); } },
                { label: '盘点', onClick: () => { resetOpForm(); setOpCheck(true); } },
                { label: '调拨', onClick: () => { resetOpForm(); setOpMove(true); } },
              ]} />
              <span style={{ marginLeft: 'auto' }} />
              <select className="nc-input" style={{ width: 150 }} value={whView} onChange={(e) => setWhView(e.target.value)}>
                <option value="全部">视图：全部仓库</option>
                {WH.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
              <span className="nc-ltbar-div" />
              <Btn kind="primary" onClick={() => startRfq(lowItems.map((i) => ({ code: i.code, qty: String(gapOf(i)) })), '库存补齐')}>
                <Ico n="search" size={16} /> 一键补齐询价（{lowItems.length}）
              </Btn>
            </div>
            <div className="nc-tiny nc-muted" style={{ marginBottom: 12 }}>
              库存口径<Tip w={440} text="可用 = 结余（预占取消 6% 估算；真实占用派生前可用即结余）。成本归集点在「领用」：入库按不含税采购价计入存货，领用时按移动加权平均单价结转至领用项目并写入项目成本台账，退料按原领用项目回冲（净额追加，不删原行），盘点差异按同一单价调整存货成本。低于安全线即进入「库存预警」，可一键发起询价。服务与套件不建库存账。" />
            </div>
            <div className="nc-ltrow" style={{ margin: '0 0 12px', gap: 10 }}>
              <span className="nc-tiny">库存总金额 <b className="num">¥{fmt(stocked.reduce((s, m) => s + (m.stockAmt ?? 0), 0))}</b><span className="nc-muted">（不含税，逐条 = 单位成本 × 结余）</span></span>
              <span className="nc-tiny">在库条目 <b className="num">{stocked.length}</b></span>
              <span className="nc-tiny">低库存 <b className="num" style={lowItems.length ? { color: 'var(--nc-red, #e64545)' } : undefined}>{lowItems.length}</b></span>
              <span className="nc-tiny">本月领用 <b className="num">{flow.filter((f) => f.type === '领用').length}</b> 笔<span className="nc-muted">（领用按移动加权单价结转计入项目成本台账，流水记数量不记金额）</span></span>
            </div>
            <DataTable
              minWidth={1200}
              rows={stockPaged.paged}
              rowKey={(m) => m.id}
              selectable selected={stockSel} onSelectAll={setStockSel} onSelectRow={(id) => setStockSel((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])}
              /* 条目背景色统一：低于安全库存不再整行铺红底，改由库存列的红色数值承担 */
              onRowClick={(m) => setDetail(m)}
              empty="当前没有有库存的主数据（物料）；服务与套件不建库存账"
              foot={stockPaged.foot}
              cols={[
                { key: 'code', title: '编码', width: 100, hide: true, render: (m) => <span className="num">{m.code}</span> },
                { key: 'name', title: '名称 / 规格型号', sticky: 'left', render: (m) => <>{m.name} <span className="nc-tiny nc-muted">{m.spec}</span></> },
                { key: 'ty', title: '类型', width: 74, render: (m) => <Tag tone={KIND_TONE[m.ty]}>{m.ty}</Tag> },
                { key: 'unit', title: '单位', width: 60, align: 'center', render: (m) => m.unit },
                { key: 'mainWh', title: '主仓库', width: 92, align: 'right', render: (m) => <span className="num" style={{ background: whView === MAIN_WH ? 'var(--c-primary-weak)' : undefined }}>{whView === PROJ_WH ? '—' : (whOf(m.code)[MAIN_WH] || 0)}</span> },
                { key: 'projWh', title: '项目临时仓', width: 108, align: 'right', render: (m) => <span className="num" style={{ background: whView === PROJ_WH ? 'var(--c-primary-weak)' : undefined }}>{whView === MAIN_WH ? '—' : (whOf(m.code)[PROJ_WH] || 0)}</span> },
                { key: 'stock', title: '结余', width: 88, align: 'right', render: (m) => <b className="num">{m.stock}</b> },

                { key: 'avail', title: '可用', width: 88, align: 'right', render: (m) => <b className="num">{availOf(m)}</b> },
                { key: 'transit', title: '在途', width: 80, align: 'right', render: (m) => { const t = inTransitOf(m.code); return <span className="num" title="已下采购单、尚未到货入库的数量（待到货 / 部分到货 PO 合计，扣已入库）">{t ? <span className="nc-v-blue">{t}</span> : <span className="nc-muted">0</span>}</span>; } },
                {
                  key: 'amt', title: '存货成本', width: 112, align: 'right',
                  render: (m) => <span className="num" title={`单位成本 ${fmt(stockUnitCost(m))} 元/${m.unit}（移动加权平均）· 领用时按此单价结转至项目`}>{fmt(m.stockAmt ?? 0)}</span>,
                },
                { key: 'safe', title: '安全线', width: 88, align: 'right', render: (m) => <span className="num">{m.safe}</span> },
                { key: 'st', title: '状态 · 缺口升序', width: 116, render: (m) => (m.stock - m.safe < 0 ? <span title={`当前库存 ${m.stock} < 安全线 ${m.safe}，缺口 ${gapOf(m)}，可发起询价补齐`}><Tag tone="red">需补货</Tag></span> : <Tag tone="green">充足</Tag>) },
                {
                  key: 'op', title: '操作', width: 208, sticky: 'right', render: (m) => (
                    <span onClick={(e) => e.stopPropagation()}>
                      {m.stock < m.safe && (
                        <>
                          <Op gold onClick={() => startRfq([{ code: m.code, qty: String(gapOf(m)) }], '库存补齐')}>发起询价</Op>
                          <OpSep />
                        </>
                      )}
                      <Op onClick={() => { auditOnly('张仓', '仓管员', `查看批次账 · ${m.name}`); setBatchFor(m.code); }}>批次</Op>
                      <OpSep />
                      <Op onClick={() => { setOpSafe(m); setSafeVal(String(m.safe)); }}>设置安全线</Op>
                    </span>
                  ),
                },
              ]}
            />
          </div>
        )}

        {/* ==================== 库存作业 · 作业流水 ==================== */}
        {tab === 'flow' && (
          <div style={{ padding: 16 }}>
            <div className="nc-ltrow" style={{ marginBottom: 12 }}>
              <span className="nc-tiny nc-muted">作业口径<Tip w={400} text="成本归集点在「领用」：入库存货 +、领用按加权平均单价结转至项目 −，退料按原项目回冲 +，盘点差异按同一单价调整。流水按下方仓库视图过滤。" /></span>
              <select className="nc-input" style={{ width: 150 }} value={whView} onChange={(e) => setWhView(e.target.value)}>
                <option value="全部">视图：全部仓库</option>
                {WH.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
              <div style={{ marginLeft: 'auto' }}><ExportButton onClick={flowExport.trigger} selectedCount={flowSel.length} /></div>
            </div>
            <DataTable
              minWidth={1000}
              rows={flowPaged.paged}
              rowKey={(f) => f.no}
              selectable selected={flowSel} onSelectAll={setFlowSel} onSelectRow={(id) => setFlowSel((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])}
              empty="当前仓库视图下没有作业流水；入库 / 领用 / 调拨 / 盘点后自动生成"
              foot={flowPaged.foot}
              cols={[
                { key: 't', title: '时间', width: 140, render: (f) => <span className="num nc-tiny">{f.t}</span> },
                { key: 'type', title: '类型', width: 80, render: (f) => <Tag tone={f.type === '调拨' ? 'blue' : ((FLOW_TONE[f.type] || 'gray') as TagTone)}>{f.type}</Tag> },
                { key: 'no', title: '单号', width: 130, render: (f) => <span className="num">{f.no}</span> },
                { key: 'mat', title: '物料', render: (f) => f.mat },
                { key: 'qty', title: '数量', width: 130, align: 'right', render: (f) => <span className="num">{f.qty}</span> },
                { key: 'wh', title: '仓库 / 项目', width: 220, render: (f) => <span className="nc-tiny">{f.wh}</span> },
                { key: 'by', title: '经办', width: 80, render: (f) => f.by },
              ]}
            />
          </div>
        )}

        {/* ==================== 库存作业 · 厂家号段推送（货未到、号段先到） ==================== */}
        {tab === 'push' && (
          <div style={{ padding: 16 }}>
            <DataTable
              minWidth={1220}
              rows={pushPaged.paged}
              rowKey={(b) => b.id}
              empty="暂无厂家推送；厂家在备案平台登记新号段后会推送至此"
              foot={pushPaged.foot}
              cols={[
                { key: 'id', title: '推送单号', width: 100, render: (b) => <span className="num">{b.id}</span> },
                { key: 'sup', title: '推送方（备案生产厂）', width: 240, render: (b) => <span className="nc-tiny">{b.supplier}</span> },
                {
                  key: 'item', title: '型号', width: 240,
                  render: (b) => {
                    const it = itemByCode(b.code);
                    return <span title={`编码 ${b.code}`}><b>{it?.name ?? b.code}</b> <span className="nc-tiny nc-muted">{[it?.spec, b.code].filter(Boolean).join(' · ')}</span></span>;
                  },
                },
                { key: 'batch', title: '生产批号', width: 130, render: (b) => <span className="num nc-tiny">{b.batch}</span> },
                {
                  key: 'range', title: '号段（14 位明码）', width: 230,
                  render: (b) => <span className="num nc-tiny">{fmtMark(b.from)} ~ {fmtMark(b.to)}</span>,
                },
                { key: 'qty', title: '数量', width: 96, align: 'right', render: (b) => <b className="num">{b.qty}{itemByCode(b.code)?.unit ?? ''}</b> },
                { key: 'at', title: '推送日', width: 106, render: (b) => <span className="num nc-tiny">{b.at}</span> },
                {
                  key: 'status', title: '状态', width: 96,
                  render: (b) => <Tag tone={b.status === '已入库' ? 'green' : b.status === '已驳回' ? 'red' : 'orange'}>{b.status}</Tag>,
                },
                {
                  key: 'op', title: '操作', width: 168, sticky: 'right',
                  render: (b) => (b.status === '待确认' ? (
                    <>
                      <Op gold onClick={() => {
                        const msg = pushConfirm(b.id, '张仓');
                        if (msg.startsWith('入库校验未通过')) { toast(msg, 'err'); return; }
                        toast(msg, 'ok');
                      }}>确认入库</Op>
                      <OpSep />
                      <Op danger onClick={() => { setPushRj(b.id); setPushWhy(''); }}>驳回</Op>
                    </>
                  ) : <span className="nc-tiny nc-muted">{b.note ?? '—'}</span>),
                },
              ]}
            />
            <div className="nc-tiny nc-muted" style={{ marginTop: 8 }}>
              号段一旦落入企业账，即可按「每樘一件」下发到项目部位；未经本页确认的推送不产生任何可报验的号码资源。
            </div>
          </div>
        )}

        {/* ==================== 采购寻源 · 询比价 ==================== */}
        {tab === 'rfq' && (
          <div style={{ padding: 16 }}>
            <div className="nc-ltrow" style={{ marginBottom: 12, gap: 12 }}>
              <span className="nc-cell-sub">询比价<Tip w={360} text="流程：询价中 → 已报价 → 已选定 → 已关闭；已选定后可生成采购订单，入库时回写订单状态，与库存闭环。" /></span>
              <div style={{ marginLeft: 'auto' }}>
                <OpMore items={[{ label: demo ? '关闭演示模式' : '演示模式（模拟报价）', onClick: () => setDemo((d) => !d) }]} />
                <ExportButton onClick={rfqExport.trigger} selectedCount={rfqSel.length} /><Btn kind="primary" onClick={() => startRfq([{ code: '', qty: '' }], '手工发起')}>＋ 发起询价</Btn>
              </div>
            </div>
            <DataTable
              minWidth={1240}
              rows={rfqPaged.paged}
              rowKey={(r) => r.id}
              selectable selected={rfqSel} onSelectAll={setRfqSel} onSelectRow={(id) => setRfqSel((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])}
              empty="暂无询比价单；可从库存「需补货」行一键发起，或点击「＋ 发起询价」"
              foot={rfqPaged.foot}
              cols={[
                { key: 'id', title: '询价单号', width: 130, render: (r) => <span className="num">{r.id}</span> },
                { key: 'from', title: '来源', width: 90, render: (r) => <Tag tone={r.from === '库存补齐' ? 'orange' : 'gray'}>{r.from || '手工发起'}</Tag> },
                { key: 'mats', title: '物料 / 服务 / 软件（数量）', render: (r) => <span className="nc-tiny">{r.mats.map((m) => `${m.name} ×${m.qty}${m.unit}`).join('；')}</span> },
                { key: 'needDate', title: '需求日期', width: 100, align: 'right', render: (r) => <span className="num nc-tiny">{r.needDate}</span> },
                { key: 'deadline', title: '报价截止', width: 130, align: 'right', render: (r) => <span className="num nc-tiny">{r.deadline}</span> },
                {
                  key: 'invited', title: '邀约供应商', width: 200,
                  render: (r) => <span className="nc-tiny">{r.invited.map((id, i) => <React.Fragment key={id}>{i > 0 ? '、' : ''}<EntityLink target="supplier" id={id} go={go} title="下钻到供应商档案">{supName(id)}</EntityLink></React.Fragment>)}</span>,
                },
                { key: 'status', title: '状态', width: 90, render: (r) => <Tag tone={(RFQ_TONE[r.status] || 'gray') as TagTone}>{r.status}</Tag> },
                {
                  key: 'po', title: '采购订单', width: 160,
                  render: (r) => (r.po
                    ? <span className="nc-tiny num">{r.po.no} <Tag tone="gray">{r.po.status}</Tag></span>
                    : <span className="nc-muted nc-tiny">—</span>),
                },
                {
                  key: 'op', title: '操作', width: 200, sticky: 'right', render: (r) => (
                    <span onClick={(e) => e.stopPropagation()}>
                      <Op onClick={() => setMatrix(r)}>比价矩阵</Op>
                      {r.status === '已选定' && !r.po && <><OpSep /><Op gold onClick={() => setPoFor(r)}>生成采购订单</Op></>}
                      <OpMore items={[
                        { label: '二维码', onClick: () => setQrOpen(r.id) },
                        ...(demo && r.status !== '已关闭' ? [{ label: '模拟报价', onClick: () => { setQuoteOpen(r); setQuoteAs(r.invited[0] || 'GYS000012'); setQuoteVals({}); } }] : []),
                      ]} />
                    </span>
                  ),
                },
              ]}
            />
          </div>
        )}

        {/* ==================== 采购寻源 · 物料价格库 ==================== */}
        {tab === 'plib' && (
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <Check checked={plibRev} onChange={setPlibRev} label="仅看需复核调价（偏离 ≥ ±10%）" />
              <span className="nc-tiny nc-muted" style={{ marginLeft: 'auto' }}>
                价格库口径<Tip w={400} text="已入库采购合同明细自动沉淀，与询比价 / 历史报价同源，CNY 含税；仅覆盖可采购硬件（物料），服务与套件不在此库。参考用途，不强制校验；询比价「历史参照」取自本库。" />
              </span>
              <ExportButton onClick={plibExport.trigger} selectedCount={plibSel.length} />
            </div>
            <DataTable
              minWidth={1080}
              rows={plibPaged.paged}
              rowKey={(p) => p.code}
              selectable selected={plibSel} onSelectAll={setPlibSel} onSelectRow={(id) => setPlibSel((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])}
              /* 条目背景色统一：待审核配置不再整行铺红底，改由状态列承担 */
              empty={plibRev ? '当前没有偏离 ≥ ±10% 的需复核价格；可取消「仅看需复核」查看全部' : '价格库暂无记录；采购合同入库后会自动沉淀成交价'}
              foot={plibPaged.foot}
              cols={[
                { key: 'code', title: '物料编码', width: 100, render: (p) => <span className="num">{p.code}</span> },
                { key: 'name', title: '名称 / 规格型号', render: (p) => <><b>{p.name}</b> <span className="nc-tiny nc-muted">{p.spec}</span></> },
                { key: 'brand', title: '品牌 / 厂家', width: 90, render: (p) => p.brand },
                { key: 'supplier', title: '供应商', width: 200, render: (p) => { const s = SUPPLIERS.find((x) => x.name === p.supplier); return <span className="nc-tiny">{s ? <EntityLink target="supplier" id={s.id} go={go} title="下钻到供应商档案">{p.supplier}</EntityLink> : p.supplier}</span>; } },
                { key: 'price', title: '含税成交价', width: 100, align: 'right', render: (p) => <span className="num">{fmt(p.price)}</span> },
                { key: 'std', title: '标准价', width: 100, align: 'right', render: (p) => <span className="num nc-muted">{fmt(p.std)}</span> },
                { key: 'dev', title: '偏离', width: 90, align: 'right', render: (p) => <span className={`num${Math.abs(p.dev) > 10 ? ' nc-v-red' : ''}`} title="偏离 =（标准价 − 成交价）/ 成交价，超 ±10% 触发复核">{p.dev > 0 ? '+' : ''}{p.dev.toFixed(1)}%</span> },
                { key: 'eff', title: '生效区间', width: 170, render: (p) => <span className="num nc-tiny">{p.eff}</span> },
                { key: 'src', title: '来源', width: 110, render: (p) => <Tag tone={p.src === '采购合同沉淀' ? 'blue' : p.src === '询比价' ? 'purple' : 'gray'}>{p.src}</Tag> },
                { key: 'op', title: '操作', width: 70, render: (p) => <Op onClick={() => setPlibHis(p)}>历史</Op> },
              ]}
            />
          </div>
        )}

        {/* ==================== 合规资质 · 认证与报告 ==================== */}
        {tab === 'cert' && (
          <div style={{ padding: 16 }}>
            <Banner tone="warn">
              证书由主数据「认证」属性派生，徽标与证书类型一致；到期前 30 天按物料渠道提醒，上传 / 查看留审计。
              <span style={{ marginLeft: 12 }}><button className="nc-dir-item" style={{ display: 'inline-flex', padding: 0, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-primary, #1456f0)', fontSize: 12 }} onClick={() => go('cert')}>↗ 企业机构证书在「证书管理」模块统一维护</button></span>
            </Banner>
            <div className="nc-ltrow" style={{ marginBottom: 12 }}>
              <span className="nc-tiny nc-muted">共 {certs.length} 条 · 30 天内到期 {expSoon} 条 · 长期有效（无有效期）{certs.filter((c) => c.validTo === '—').length} 条不派发通知</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <Btn kind={certMissOnly ? 'danger' : 'default'} onClick={() => setCertMissOnly((v) => !v)} title="需 CCCF 但证书类型为空的物料（强制认证缺件）">
                  缺证物料 {items.filter((i) => itemCertMiss(i)).length}
                </Btn>
                <ExportButton onClick={certExport.trigger} selectedCount={certSel.length} /><Btn kind="primary" onClick={() => setCertUp(true)}>＋ 上传</Btn>
              </div>
            </div>
            {certMissOnly && (
              <div style={{ marginBottom: 12, padding: 12, border: '1px solid var(--c-danger-weak, #f5c6c6)', borderRadius: 8, background: 'var(--c-danger-weak, #fff1f0)' }}>
                <b style={{ color: 'var(--c-danger, #d4380d)' }}>需 CCCF 但缺证的物料（{items.filter((i) => itemCertMiss(i)).length}）—— 强制认证缺件，红色标注，不可投标 / 报验</b>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {items.filter((i) => itemCertMiss(i)).map((i) => (
                    <Tag key={i.code} tone="red">{i.name} <span className="nc-muted">{i.code}</span></Tag>
                  ))}
                </div>
              </div>
            )}
            <DataTable
              minWidth={1140}
              rows={certPaged.paged}
              rowKey={(c) => c.no}
              selectable selected={certSel} onSelectAll={setCertSel} onSelectRow={(id) => setCertSel((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])}
              /* 条目背景色统一：临期证书不再整行铺红底，改由有效期列的橙色数值承担 */
              empty="没有认证与报告记录；证书在主数据上配置后自动出现在此"
              foot={certPaged.foot}
              cols={[
                { key: 'matCode', title: '物料编码', width: 100, render: (c) => <span className="num">{c.matCode}</span> },
                { key: 'mat', title: '物料', render: (c) => c.mat },
                { key: 'type', title: '证书类型', width: 150, render: (c) => <Tag tone={c.type.startsWith('CCCF') ? 'red' : 'blue'}>{c.type}</Tag> },
                { key: 'no', title: '证书编号', width: 170, render: (c) => <span className="num">{c.no}</span> },
                { key: 'validTo', title: '有效期至', width: 110, align: 'right', render: (c) => <span className="num nc-tiny">{c.validTo}</span> },
                {
                  key: 'left', title: '剩余', width: 90, align: 'right',
                  render: (c) => {
                    const dl = daysLeft(c.validTo);
                    return <span className="num" title={dl === Infinity ? undefined : dl <= 0 ? '证书已过期，不可用于投标 / 报验；到期前 30 天已按物料级渠道提醒' : dl <= 30 ? `距到期 ${dl} 天，已按物料级渠道（${c.ch || '短信 / 邮件'}）提醒` : undefined}>{dl === Infinity ? '长期有效' : dl <= 0 ? <span className="nc-v-red">已过期</span> : <span className={dl <= 30 ? 'nc-v-red' : ''}>{dl} 天</span>}</span>;
                  },
                },
                { key: 'batch', title: '关联批次', width: 130, render: (c) => <span className="num nc-tiny">{c.batch}</span> },
                { key: 'files', title: '附件', width: 70, align: 'center', render: (c) => c.files },
                { key: 'ch', title: '到期通知渠道', width: 160, render: (c) => (c.validTo === '—' ? <span className="nc-muted nc-tiny">不适用（长期有效）</span> : <span className="nc-tiny">{c.ch || '—'}</span>) },
                {
                  key: 'op', title: '操作', width: 130, render: (c) => (
                    <>
                      <Op onClick={() => toast(`已查看 ${c.no}（查看行为已留审计）`)}>查看</Op>
                      <OpSep />
                      <Op onClick={() => { setBatchFor(c.matCode); }}>批次</Op>
                    </>
                  ),
                },
              ]}
            />
          </div>
        )}

      </Card>

      {/* ==================== 操作日志（页面级入口 · 不属于任何业务域） ==================== */}
      <Drawer open={auditOpen} width={900} onClose={() => setAuditOpen(false)} title="操作日志"
        foot={<Btn onClick={() => setAuditOpen(false)}>关闭</Btn>}>
        <DataTable
          minWidth={860}
          rows={audit}
          rowKey={(a) => `${a.t}-${a.who}-${a.act.slice(0, 8)}`}
          empty="暂无操作审计记录"
          cols={[
            { key: 't', title: '时间', width: 140, render: (a) => <span className="num nc-tiny">{a.t}</span> },
            { key: 'who', title: '操作人', width: 90, render: (a) => a.who },
            { key: 'role', title: '角色', width: 130, render: (a) => <Tag tone="gray">{a.role}</Tag> },
            { key: 'act', title: '动作', render: (a) => a.act },
          ]}
        />
      </Drawer>

      {/* ==================== 详情抽屉 ==================== */}
      <Drawer open={!!detail} width={800} onClose={() => setDetail(null)} title={detail?.name || ''}
        sub={detail ? `${detail.code} · 类型 ${detail.ty} · 规格型号 ${detail.spec} · 单位 ${detail.unit}` : ''}
        foot={<>
          <Btn onClick={() => {
            if (!detail) return;
            setItems((rs) => rs.map((r) => (r.code === detail.code ? { ...r, status: r.status === '启用' ? '停用' : '启用' } : r)));
            auditOnly('王敏', '主数据管理员', `${detail.status === '启用' ? '停用' : '启用'}主数据 ${detail.code} · ${detail.name}`);
            toast(`${detail.code} 已${detail.status === '启用' ? '停用' : '启用'}`);
            setDetail(null);
          }} danger>{detail?.status === '启用' ? '停用' : '启用'}</Btn>
          {detail && !isStocked(detail.ty) && canWrite && <Btn onClick={() => { const c = detail.code; setDetail(null); openRecipe(c); }} kind="primary">编辑配置 / 成本构成</Btn>}
          <Btn onClick={() => setDetail(null)}>关闭</Btn>
        </>}>
        {detail && <>
          <KvGrid cols={2} rows={[
            { k: '编码', v: detail.code },
            { k: '名称', v: detail.name },
            { k: '类型', v: `${detail.ty} · ${KIND_DESC[detail.ty]}` },
            { k: '规格型号', v: detail.spec },
            { k: '分类目录', v: catPath(detail.cat) },
            { k: '单位', v: `${detail.unit}${UNIT_DESC[detail.unit] ? ` · ${UNIT_DESC[detail.unit]}` : ''}` },
            { k: '参考价', v: `${fmt(detail.price)} · 适用税率 ${itemTaxRate(detail)}%` },
            { k: '责任维护人', v: detail.owner || '—' },
            ...(isStocked(detail.ty)
              ? [
                { k: '结余 / 可用', v: `${detail.stock} / ${availOf(detail)} ${detail.unit}` },
                { k: '安全线', v: `${detail.safe} ${detail.unit}` },
                { k: '分布', v: WH.map((w) => `${w} ${whOf(detail.code)[w] || 0}`).join(' · ') },
              ]
              : [
                { k: '库存', v: '不持实物库存（服务 / 套件）' },
                { k: '资质要求', v: detail.qualReq || '—' },
              ]),
            { k: '状态', v: detail.status },
            { k: '投标清单编码', v: listCodeOf(detail.cat) || '不在安装工程清单体系内' },
            /* 认证要求由所属目录派生（品目决定要不要证），人工只能在更高要求上收紧 */
            { k: '认证要求', v: `${certRuleCn(detail.cat)}${detail.mand && certRuleOf(detail.cat) !== 'cccf' ? ' · 人工收紧至强制' : ''}` },
            { k: 'CCCF 认证', v: detail.ccc ? '已取得' : (itemNeedCCC(detail) ? '未取得（缺证）' : '未涉及') },
            { k: '证书', v: detail.certType ? `${detail.certType} · ${detail.certNo || '—'} · 有效期至 ${detail.certValidTo || '—'}` : (isStocked(detail.ty) ? '未涉及' : '不发产品证书（由所含硬件持证）') },
          ]} />

          {(isStocked(detail.ty) || detail.ty === '软件') && (
            <Field label={detail.ty === '软件' ? '成本口径（许可 / 订阅采购价）' : '成本口径（采购价还原）'} span={4}>
              <div className="nc-money-row" style={{ marginBottom: 10 }}>
                {[
                  { k: '参考价（含税）', v: fmt(detail.price) },
                  { k: '适用税率', v: `${itemTaxRate(detail)}%` },
                  { k: '当前成本（不含税）', v: fmt(Math.round((detail.price ?? 0) / (1 + itemTaxRate(detail) / 100))) },
                ].map((m) => <div key={m.k} className="nc-money-cell"><span className="nc-tiny nc-muted">{m.k}</span><b className="num">{m.v}</b></div>)}
              </div>
              <div className="nc-tiny nc-muted">
                成本口径 = 采购价按税率还原为不含税（一般纳税人进项可抵扣，对外结算仍含税）；
                {isStocked(detail.ty)
                  ? <>已入库按移动加权平均单价 <b className="num">{fmt(stockUnitCost(detail))}</b> 元/{detail.unit} 结转，未入库按参考价还原。</>
                  : '软件为许可 / 订阅费，最小单元无构成。'}
                最小单元不可配置，要组合请用「套件」。
              </div>
            </Field>
          )}

          {itemNeedCCC(detail) && (
            <div className="nc-warnbox is-danger">
              <b><Ico n="warning" size={16} /> {itemCertMiss(detail) ? '目录要求强制性认证，该条目暂无 CCCF 证书' : '该条目列入强制性产品目录'}</b>
              <div>无有效 CCCF 证书的批次不得用于工程；采购入库与报价选用时将校验证书编号与有效期。当前证书：{detail.certNo || '—'}（有效期至 {detail.certValidTo || '—'}）。</div>
            </div>
          )}

          {!isStocked(detail.ty) && (() => {
            const c = detail.ty === '服务' ? svcCostOf(detail.code) : costOf(detail.code);
            return (
              <Field label={detail.ty === '服务' ? '成本构成（人工 + 耗材）' : '配置（引用主数据，自动合计）'} span={4}>
                <div className="nc-money-row" style={{ marginBottom: 10 }}>
                  {[
                    { k: '物料小计', v: fmt(c.mat) },
                    { k: '人工小计', v: fmt(c.labor) },
                    { k: '成本', v: fmt(c.total) },
                    ...(detail.ty === '套件' ? [{ k: '对外价', v: fmt(detail.sale || 0) }, { k: '毛利率', v: `${costOf(detail.code).gross.toFixed(1)}%` }] : []),
                  ].map((m) => <div key={m.k} className="nc-money-cell"><span className="nc-tiny nc-muted">{m.k}</span><b className="num">{m.v}</b></div>)}
                </div>
                {detail.ty === '服务' ? (
                  <table className="nc-tbl" style={{ minWidth: 520 }}>
                    <thead><tr><th style={{ width: 150 }}>工种（主数据单价）</th><th style={{width: 90}} className="is-num">工日</th><th style={{width: 100}} className="is-num">单价</th><th style={{}} className="is-num">小计</th></tr></thead>
                    <tbody>
                      {(detail.labor || []).map((l) => (
                        <tr key={l.trade}><td>{l.trade}</td><td className="is-num num">{l.days}</td><td className="is-num num">{fmt(laborRate(l.trade))}</td><td className="is-num num"><b>{fmt(laborRate(l.trade) * l.days)}</b></td></tr>
                      ))}
                      {(detail.consumables || []).map((m) => (
                        <tr key={m.code} className="is-muted-row"><td>耗材 · {byCode(m.code)?.name || m.code}</td><td className="is-num num">{m.qty}</td><td className="is-num num">{fmt(byCode(m.code)?.price || 0)}</td><td className="is-num num">{fmt((byCode(m.code)?.price || 0) * m.qty)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="nc-tbl" style={{ minWidth: 560 }}>
                    <thead><tr><th style={{ width: 66 }}>行类型</th><th style={{ width: 100 }}>引用编码</th><th>引用对象</th><th style={{width: 70}} className="is-num">数量</th><th style={{width: 70}} className="is-num">损耗</th><th style={{width: 90}} className="is-num">单价</th><th style={{width: 96}} className="is-num">小计</th></tr></thead>
                    <tbody>
                      {(recipes[detail.code]?.versions.find((v) => v.v === recipes[detail.code].cur)?.lines || []).map((l, i) => {
                        const r = byCode(l.code);
                        const unit = l.kind === '服务' ? (r ? svcCostOf(l.code).total : 0) : l.kind === '套件' ? (r ? costOf(l.code).total : 0) : (l.lockedPrice ?? r?.price ?? 0);
                        return (
                          <tr key={`${l.code}-${i}`}>
                            <td><Tag tone={KIND_TONE[l.kind]}>{l.kind}</Tag></td>
                            <td className="num nc-id-cell">{l.code}</td>
                            <td>{r ? <>{r.name} <span className="nc-tiny nc-muted">{r.spec}</span></> : <span className="nc-v-red">引用丢失</span>}{l.lockedPrice != null && <Tag tone="orange">锁价</Tag>}</td>
                            <td className="is-num num">{l.qty} {r?.unit}</td>
                            <td className="is-num num">{l.loss ? `${l.loss}%` : '—'}</td>
                            <td className="is-num num">{fmt(unit)}</td>
                            <td className="is-num num"><b>{fmt(unit * l.qty * (1 + (l.loss ?? 0) / 100))}</b></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </Field>
            );
          })()}

          {detail.ty === '服务' && srvRateOf(detail.code) && (() => {
            const rate = srvRateOf(detail.code)!;
            return (
              <Field label="维保 / 检测计价口径" span={4}
                tip="消防维保不按「数量」计价，按服务对象的规模算：建筑面积（元/㎡·年，面积越大单价越低）、设施点位（元/点·年）、或设施造价百分比。报价时可切换口径对比。" tipW={340}>
                <div className="nc-cell-sub" style={{ marginBottom: 10 }}>
                  默认口径 <b>{BILL_BASIS_CN[rate.basis]}</b> · 计费周期 <b>{rate.period}</b>
                  {rate.minFee ? <> · 最低限价 <b className="num">{fmt(rate.minFee)}</b> 元/{rate.period}</> : null}
                  {rate.note ? <div className="nc-tiny nc-muted" style={{ marginTop: 4 }}>{rate.note}</div> : null}
                </div>
                {rate.tiers && rate.tiers.length > 0 && (
                  <>
                    <div className="nc-tiny nc-muted" style={{ marginBottom: 6 }}>按建筑面积 · 阶梯单价（元/㎡·{rate.period}）</div>
                    <table className="nc-tbl" style={{ minWidth: 460, marginBottom: 12 }}>
                      <thead><tr>
                        <th>面积区间（㎡）</th>
                        <th style={{width: 110}} className="is-num">单价</th>
                      </tr></thead>
                      <tbody>
                        {rate.tiers.map((t) => (
                          <tr key={t.to}>
                            <td className="num">{t.from.toLocaleString('en-US')} ~ {t.to === Infinity ? '以上' : t.to.toLocaleString('en-US')}</td>
                            <td className="is-num num"><b>{t.price}</b></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
                {rate.pointRates && rate.pointRates.length > 0 && (
                  <>
                    <div className="nc-tiny nc-muted" style={{ marginBottom: 6 }}>按设施点位 · 点位单价（元/{rate.period}）</div>
                    <table className="nc-tbl" style={{ minWidth: 460 }}>
                      <thead><tr>
                        <th>点位类别</th><th style={{ width: 80 }}>单位</th>
                        <th style={{width: 100}} className="is-num">单价</th>
                      </tr></thead>
                      <tbody>
                        {rate.pointRates.map((pr) => (
                          <tr key={pr.kind}>
                            <td>{pr.kind}</td>
                            <td className="nc-tiny">{pr.unit}</td>
                            <td className="is-num num"><b>{fmt(pr.price)}</b></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
                {rate.assetTiers && rate.assetTiers.length > 0 && (
                  <>
                    <div className="nc-tiny nc-muted" style={{ marginBottom: 6 }}>按设施造价 · 投资额分档费率（%/{rate.period}）</div>
                    <table className="nc-tbl" style={{ minWidth: 460 }}>
                      <thead><tr>
                        <th>设施总投资</th>
                        <th style={{width: 110}} className="is-num">费率</th>
                      </tr></thead>
                      <tbody>
                        {rate.assetTiers.map((t) => (
                          <tr key={t.to}>
                            <td className="num">{t.from / 10000} 万 ~ {t.to === Infinity ? '以上' : `${t.to / 10000} 万`}</td>
                            <td className="is-num num"><b>{t.pct}%</b></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="nc-cell-sub" style={{ marginTop: 8 }}>
                      按全额累进：命中档后 <b>总投资 × 该档费率</b>，投资额越大费率越低。
                    </div>
                  </>
                )}
              </Field>
            );
          })()}

          {isStocked(detail.ty) && (
            <>
              <Field label="供应商报价对比（三源比价）" span={4}>
                <table className="nc-tbl" style={{ minWidth: 520 }}>
                  <thead><tr><th>供应商</th><th style={{width: 96}} className="is-num">报价</th><th style={{width: 80}} className="is-num">偏差</th><th style={{ width: 80 }}>准入</th></tr></thead>
                  <tbody>
                    {matSupQuotes(detail.code).map((s) => {
                      const dev = detail.price ? ((s.price - detail.price) / detail.price) * 100 : 0;
                      return (
                        <tr key={s.id} className={s.ok ? '' : 'is-muted-row'}>
                          <td>{s.name} <span className="nc-tiny nc-muted">L{s.level}</span></td>
                          <td className="is-num num">{fmt(s.price)}</td>
                          <td className={`is-num num${dev <= -10 ? ' nc-v-green' : dev >= 10 ? ' nc-v-red' : ''}`}>{dev > 0 ? '+' : ''}{dev.toFixed(1)}%</td>
                          <td>{s.ok ? <Tag tone="green">已准入</Tag> : <Tag tone="gray">未准入</Tag>}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="nc-tiny nc-muted" style={{ marginTop: 8 }}>未准入供应商报价不计入最低价判定。</div>
              </Field>
              <Field label="历史采购价走势" span={4}>
                <table className="nc-tbl" style={{ minWidth: 520 }}>
                  <thead><tr><th style={{ width: 110 }}>期间</th><th style={{width: 110}} className="is-num">成交均价</th><th style={{width: 110}} className="is-num">采购量</th><th>趋势</th></tr></thead>
                  <tbody>
                    {matPriceTrend(detail.code).slice().reverse().map((r) => (
                      <tr key={r.d}><td>{r.d}</td><td className="is-num num">{fmt(r.p)}</td><td className="is-num num">{r.q}</td><td className="nc-tiny">{r.t}</td></tr>
                    ))}
                  </tbody>
                </table>
              </Field>
              <Field label="批次账（与证书关联批次呼应）" span={4}>
                <table className="nc-tbl" style={{ minWidth: 520 }}>
                  <thead><tr><th style={{ width: 130 }}>批次</th><th style={{ width: 170 }}>仓库</th><th style={{width: 90}} className="is-num">数量</th><th style={{ width: 100 }}>性质</th><th>证书</th></tr></thead>
                  <tbody>
                    {itemBatches(detail.code, whOf(detail.code)).map((b) => (
                      <tr key={b.batch + b.wh}><td className="num">{b.batch}</td><td className="nc-tiny">{b.wh}</td><td className="is-num num">{b.qty}</td><td><Tag tone={b.src === '认证批次' ? 'blue' : 'gray'}>{b.src}</Tag></td><td className="nc-tiny num">{b.cert}</td></tr>
                    ))}
                  </tbody>
                </table>
              </Field>
              {itemNeedIdMark(detail) && (() => {
                const rule = idMarkRuleOf(detail.code);
                const rs = ID_MARK_RANGES.filter((r) => r.code === detail.code);
                const st = idMarkStockOf(detail.code);
                const flows = rs.flatMap((r) => idMarkFlowsOfRange(r.id));
                return (
                  <Field label="消防产品身份标识（A / B 签）" span={4}>
                    <div className="nc-cell-sub" style={{ marginBottom: 8 }}>
                      标志类型 <b>{rule?.type === 'I' ? 'I 型 33×22mm' : 'II 型 45×40mm'}</b> ·
                      厂家备案号段 <b className="num">{rule?.prefix ?? '—'}</b> ·
                      已采录 <b className="num">{st.inQty}</b>{detail.unit} · 已流向 <b className="num">{st.outQty}</b>{detail.unit} ·
                      可报验 <b className="num">{st.free}</b>{detail.unit}
                    </div>
                    <table className="nc-tbl" style={{ minWidth: 700 }}>
                      <thead><tr>
                        <th style={{ width: 118 }}>批次</th><th>号段（14 位明码）</th>
                        <th style={{width: 74}} className="is-num">数量</th><th style={{ width: 150 }}>流向</th><th style={{ width: 78 }}>状态</th>
                        <th style={{ width: 62 }}>操作</th>
                      </tr></thead>
                      <tbody>
                        {rs.map((r) => {
                          const fs = idMarkFlowsOfRange(r.id);
                          if (!fs.length) {
                            return (
                              <tr key={r.id}>
                                <td className="num">{r.batch}</td>
                                <td className="num nc-tiny">{fmtMark(r.from)} ~ {fmtMark(r.to)}</td>
                                <td className="is-num num">{r.qty}</td>
                                <td className="nc-tiny nc-muted">在库（{r.wh}）</td>
                                <td><Tag tone="gray">未流向</Tag></td>
                                <td><Op onClick={() => { setVerifyMark(r.from); setVerifyOpen(true); }}>验真</Op></td>
                              </tr>
                            );
                          }
                          return fs.map((f, i) => (
                            <tr key={f.id}>
                              {i === 0 && <td className="num" rowSpan={fs.length}>{r.batch}</td>}
                              <td className="num nc-tiny">{fmtMark(f.from)} ~ {fmtMark(f.to)}</td>
                              <td className="is-num num">{f.qty}</td>
                              <td className="nc-tiny">{f.proj} · {f.part}</td>
                              <td><Tag tone={f.status === '已报验' ? 'green' : f.status === '已安装' ? 'blue' : 'orange'}>{f.status}</Tag></td>
                              <td><Op onClick={() => { setVerifyMark(f.from); setVerifyOpen(true); }}>验真</Op></td>
                            </tr>
                          ));
                        })}
                      </tbody>
                    </table>
                    <div className="nc-tiny nc-muted" style={{ marginTop: 8 }}>
                      A 签贴于产品本体（防转移），B 签由本表按号段生成报验清单；竣工验收要求流向单位与采购单位一致。点行内「验真」可核对这樘产品的外部备案与本企业流向。
                      {st.free === 0 && rs.length > 0 && <b className="nc-v-red"> 当前已无未流向号段，新增领用前须先入库采录。</b>}
                    </div>
                  </Field>
                );
              })()}
            </>
          )}

          {/* 被引用来源单据：mock 反向引用列表（报价单 / 项目成本构成 / 供应商供货范围） */}
          <Field label="被引用来源单据" span={4} tip="反向追踪谁在用这条主数据；mock 演示，不做真实关联查询" tipW={360}>
            {(() => {
              /* 按 code 散列出稳定的 mock 引用清单，避免每次渲染变化 */
              const seed = (detail.code || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
              const refs: { from: string; doc: string; docNo: string; qty?: string }[] = [
                { from: '报价单', doc: '报价明细行', docNo: 'QT2025' + String(100 + (seed % 80)).padStart(3, '0') },
                { from: '项目成本构成', doc: '项目领用/成本行', docNo: 'XM00' + String(100 + (seed % 90)).padStart(3, '0') },
              ];
              if (detail.ty === '物料') {
                refs.push({ from: '供应商供货范围', doc: '供应商可供品', docNo: 'GYS0000' + String(10 + (seed % 5)) });
              }
              if (detail.ty === '套件' && (detail.refs ?? 0) > 0) {
                refs.push({ from: '报价套件展开', doc: '套件配置展开行', docNo: '被引用 ' + (detail.refs ?? 0) + ' 次' });
              }
              return (
                <table className="nc-tbl" style={{ minWidth: 560 }}>
                  <thead><tr>
                    <th style={{ width: 130 }}>来源模块</th><th>引用用途</th>
                    <th style={{ width: 180 }}>来源单据号</th><th style={{ width: 90 }}>操作</th>
                  </tr></thead>
                  <tbody>
                    {refs.map((r) => (
                      <tr key={r.from + r.docNo}>
                        <td><Tag tone="blue">{r.from}</Tag></td>
                        <td>{r.doc}</td>
                        <td className="num">{r.docNo}</td>
                        <td><span className="nc-link" onClick={() => toast(`跳转查看 ${r.docNo}（演示态）`)}>查看 →</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </Field>
        </>}
      </Drawer>

      {/* ==================== 配置 / 成本构成 编辑器（服务与套件共用） ==================== */}
      <Drawer open={!!recipeFor} width={840} onClose={closeRecipe}
        title={recipeFor ? `${byCode(recipeFor)?.name || recipeFor} · ${byCode(recipeFor)?.ty === '服务' ? '成本构成' : '配置'}` : ''}
        sub={recipeFor ? `${recipeFor} · 类型 ${byCode(recipeFor)?.ty} · 配置行只能引用主数据` : ''}
        foot={<>
          <Btn onClick={closeRecipe}>取消</Btn>
          {recipeFor && byCode(recipeFor)?.ty === '套件' && draftCost && draftCost.gross < 20 && (
            <Btn onClick={() => { setPriceOpen(recipeFor); setPriceVal(String(suggestSale(draftCost.total))); }}>调价</Btn>
          )}
          <Btn kind="primary" disabled={!canWrite} onClick={saveRecipe}>保存配置</Btn>
        </>}>
        {recipeFor && (
          <>
            <div className="nc-money-row" style={{ marginBottom: 14 }}>
              {[
                { k: '物料小计', v: fmt(draftCost?.mat ?? 0) },
                { k: '人工小计', v: fmt(draftCost?.labor ?? 0) },
                { k: recipeFor && byCode(recipeFor)?.ty === '服务' ? '服务成本' : '套件成本', v: fmt(draftCost?.total ?? 0) },
                ...(byCode(recipeFor)?.ty === '套件' ? [
                  { k: '对外价', v: fmt(draftSale) },
                  { k: '毛利率', v: `${(draftCost?.gross ?? 0).toFixed(1)}%` },
                ] : []),
              ].map((m) => (
                <div key={m.k} className="nc-money-cell">
                  <span className="nc-tiny nc-muted">{m.k}</span>
                  <b className={`num${m.k === '毛利率' && (draftCost?.gross ?? 0) < 20 ? ' nc-v-red' : ''}`}>{m.v}</b>
                </div>
              ))}
            </div>

            {byCode(recipeFor)?.ty === '套件' && draftCost && draftCost.gross < 20 && (
              <div className="nc-warnbox is-danger">
                <b><Ico n="warning" size={16} /> 毛利率偏低（{(draftCost.gross ?? 0).toFixed(1)}% &lt; 20%）</b>
                <div>成本 {fmt(draftCost.total)} 已高于或逼近对外价 {fmt(draftSale)}。建议对外价 ≥ <b>{fmt(suggestSale(draftCost.total))}</b>（目标毛利率 25%），点击页脚「调价」一键应用。</div>
              </div>
            )}

            {byCode(recipeFor)?.ty === '服务' && svcDraft ? (
              <>
                <Field label="人工构成（工种 × 工日 × 单价）" req span={4}>
                  <table className="nc-tbl" style={{ minWidth: 620 }}>
                    <thead><tr>
                      <th style={{ width: 200 }}>工种（人工单价主数据）</th>
                      <th style={{ width: 110 }}>工日</th>
                      <th style={{width: 110}} className="is-num">单价</th>
                      <th style={{width: 120}} className="is-num">小计</th>
                      <th style={{ width: 70 }}>操作</th>
                    </tr></thead>
                    <tbody>
                      {svcDraft.labor.map((l, i) => (
                        <tr key={i}>
                          <td>
                            <select className="nc-input" value={l.trade} onChange={(e) => setSvcDraft({ ...svcDraft, labor: svcDraft.labor.map((x, j) => (j === i ? { ...x, trade: e.target.value } : x)) })}>
                              {LABOR_RATES.map((r) => <option key={r.trade} value={r.trade}>{r.trade}（{fmt(r.rate)}/工日）</option>)}
                            </select>
                          </td>
                          <td><input className="nc-input" type="number" value={String(l.days)} onChange={(e) => setSvcDraft({ ...svcDraft, labor: svcDraft.labor.map((x, j) => (j === i ? { ...x, days: Number(e.target.value) } : x)) })} /></td>
                          <td className="is-num num">{fmt(laborRate(l.trade))}</td>
                          <td className="is-num num"><b>{fmt(laborRate(l.trade) * l.days)}</b></td>
                          <td>{svcDraft.labor.length > 1 ? <Op danger onClick={() => setSvcDraft({ ...svcDraft, labor: svcDraft.labor.filter((_, j) => j !== i) })}>删除</Op> : <span className="nc-muted nc-tiny">—</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button className="nc-addrow" onClick={() => setSvcDraft({ ...svcDraft, labor: [...svcDraft.labor, { trade: LABOR_RATES[0].trade, days: 1 }] })}>＋ 添加人工行</button>
                </Field>

                <Field label="耗材行（可选 · 引用物料主数据）" span={4}>
                  <table className="nc-tbl" style={{ minWidth: 620 }}>
                    <thead><tr>
                      <th>引用对象</th><th style={{ width: 110 }}>数量</th><th style={{width: 110}} className="is-num">单价</th><th style={{width: 120}} className="is-num">小计</th><th style={{ width: 70 }}>操作</th>
                    </tr></thead>
                    <tbody>
                      {svcDraft.consumables.map((c, i) => (
                        <tr key={i}>
                          <td>
                            <ItemPicker value={c.code} kinds={KINDS_STOCKED} clearLabel="请选择主数据…"
                              onChange={(v) => setSvcDraft({ ...svcDraft, consumables: svcDraft.consumables.map((x, j) => (j === i ? { ...x, code: v } : x)) })} />
                          </td>
                          <td><input className="nc-input" type="number" value={String(c.qty)} onChange={(e) => setSvcDraft({ ...svcDraft, consumables: svcDraft.consumables.map((x, j) => (j === i ? { ...x, qty: Number(e.target.value) } : x)) })} /></td>
                          <td className="is-num num">{fmt(byCode(c.code)?.price || 0)}</td>
                          <td className="is-num num"><b>{fmt((byCode(c.code)?.price || 0) * c.qty)}</b></td>
                          <td><Op danger onClick={() => setSvcDraft({ ...svcDraft, consumables: svcDraft.consumables.filter((_, j) => j !== i) })}>删除</Op></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button className="nc-addrow" onClick={() => setSvcDraft({ ...svcDraft, consumables: [...svcDraft.consumables, { code: stocked[0]?.code || '', qty: 1 }] })}>＋ 添加耗材行</button>
                  <div className="nc-tiny nc-muted" style={{ marginTop: 8 }}>搜不到所需物料？<a className="nc-link" onClick={() => { closeRecipe(); setNewOpen(true); }}>先去主数据新建</a>；禁止在成本里手填数字。</div>
                </Field>
              </>
            ) : (
              <Field label="配置行（物料 / 服务 / 软件 / 子套件 混合）" req span={4}>
                <table className="nc-tbl" style={{ minWidth: 820 }}>
                  <thead><tr>
                    <th style={{ width: 44 }}>序</th>
                    <th style={{ width: 96 }}>行类型</th>
                    <th>引用对象（主数据）</th>
                    <th style={{ width: 92 }}>数量</th>
                    <th style={{ width: 76 }}>损耗%</th>
                    <th style={{width: 96}} className="is-num">单价</th>
                    <th style={{width: 104}} className="is-num">小计</th>
                    <th style={{ width: 60 }}>操作</th>
                  </tr></thead>
                  <tbody>
                    {draftLines.map((l, i) => {
                      const r = byCode(l.code);
                      const base = l.kind === '服务' ? svcCostOf(l.code).total : l.kind === '套件' ? costOf(l.code).total : (r?.price || 0);
                      const unit = l.locked ?? base;
                      const sub = unit * l.qty * (1 + (l.kind === '服务' || l.kind === '套件' ? 0 : l.loss) / 100);
                      return (
                        <tr key={i}>
                          <td className="num">{i + 1}</td>
                          <td>
                            <select className="nc-input" value={l.kind} onChange={(e) => setDraftLines((v) => v.map((x, j) => (j === i ? { ...x, kind: e.target.value as ItemKind, code: '', locked: undefined } : x)))}>
                              {LINE_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                            </select>
                          </td>
                          <td>
                            <ItemPicker value={l.code} kinds={[l.kind]} clearLabel="请选择主数据…"
                              options={items.filter((x) => x.code !== recipeFor)}
                              onChange={(v) => setDraftLines((rows) => rows.map((x, j) => (j === i ? { ...x, code: v, locked: undefined } : x)))} />
                            {!l.code && <div className="nc-tiny nc-v-red">请选择引用对象；找不到则先去主数据新建</div>}
                          </td>
                          <td><input className="nc-input" type="number" value={String(l.qty)} onChange={(e) => setDraftLines((v) => v.map((x, j) => (j === i ? { ...x, qty: Number(e.target.value) } : x)))} /></td>
                          <td>
                            {l.kind === '服务' || l.kind === '套件'
                              ? <span className="nc-muted nc-tiny">—</span>
                              : <input className="nc-input" type="number" value={String(l.loss)} onChange={(e) => setDraftLines((v) => v.map((x, j) => (j === i ? { ...x, loss: Number(e.target.value) } : x)))} />}
                          </td>
                          <td className="is-num num">
                            {l.locked != null
                              ? <span className="nc-v-red" title="已锁价，偏离主数据参考价">{fmt(l.locked)}<Tag tone="orange">锁价</Tag></span>
                              : <>{fmt(base)}{l.kind !== '服务' && l.kind !== '套件' && <a className="nc-link" style={{ marginLeft: 6 }} onClick={() => setDraftLines((v) => v.map((x, j) => (j === i ? { ...x, locked: base } : x)))}>锁价</a>}</>}
                          </td>
                          <td className="is-num num"><b>{fmt(sub)}</b></td>
                          <td><Op danger onClick={() => setDraftLines((v) => v.filter((_, j) => j !== i))}>删除</Op></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <button className="nc-addrow" onClick={() => setDraftLines((v) => [...v, { kind: '物料', code: '', qty: 1, loss: 0 }])}>＋ 添加配置行</button>
              </Field>
            )}
          </>
        )}
      </Drawer>

      {/* ==================== 调价（按目标毛利率反算） ==================== */}
      <Modal open={!!priceOpen} title={`调价 · ${priceOpen ? byCode(priceOpen)?.name : ''}`} width={480} onClose={() => setPriceOpen(null)}
        foot={<><Btn onClick={() => setPriceOpen(null)}>取消</Btn><Btn kind="primary" onClick={() => {
          const v = Number(priceVal);
          if (!(v > 0)) { toast('对外价须 > 0', 'err'); return; }
          if (priceOpen) {
            const c = costOf(priceOpen);
            setItems((rs) => rs.map((x) => (x.code === priceOpen ? { ...x, sale: v, price: v } : x)));
            setDraftSale(v);
            auditOnly('李思敏', '商务合同管理员', `套件调价 · ${byCode(priceOpen)?.name} ${fmt(byCode(priceOpen)?.sale || 0)} → ${fmt(v)}（成本 ${fmt(c.total)}，毛利率 ${(((v - c.total) / v) * 100).toFixed(1)}%）`);
            toast(`已调价至 ${fmt(v)} · 毛利率 ${(((v - c.total) / v) * 100).toFixed(1)}%`);
          }
          setPriceOpen(null);
        }}>应用调价</Btn></>}>
        <div className="nc-warnbox is-info">
          <b>调价依据</b>
          <div>成本由配置自动合计；目标毛利率按 25% 反算建议价，可手工覆盖（会写入操作日志）。</div>
        </div>
        <div className="nc-form-grid">
          <Field label="当前成本"><input className="nc-input" disabled value={priceOpen ? fmt(costOf(priceOpen).total) : ''} /></Field>
          <Field label="当前对外价"><input className="nc-input" disabled value={priceOpen ? fmt(byCode(priceOpen)?.sale || 0) : ''} /></Field>
          <Field label="建议对外价（毛利率 25%）"><input className="nc-input" disabled value={priceOpen ? fmt(suggestSale(costOf(priceOpen).total)) : ''} /></Field>
          <Field label="新对外价" req note="保存后同步为该套件的参考价"><input className="nc-input" type="number" value={priceVal} onChange={(e) => setPriceVal(e.target.value)} /></Field>
        </div>
      </Modal>

      {/* ==================== 批次账 ==================== */}
      <Drawer open={!!batchFor} width={640} onClose={() => setBatchFor(null)}
        title={batchFor ? `${byCode(batchFor)?.name || batchFor} · 批次账` : ''}
        sub={batchFor ? `${batchFor} · 与证书「关联批次」呼应` : ''}
        foot={<Btn onClick={() => setBatchFor(null)}>关闭</Btn>}>
        {batchFor && (
          <>
            <div className="nc-tiny nc-muted" style={{ marginBottom: 10 }}>
              结余 {byCode(batchFor)?.stock ?? 0} {byCode(batchFor)?.unit} · 分布 {WH.map((w) => `${w} ${whOf(batchFor)[w] || 0}`).join(' · ')} ·
              认证批次 {byCode(batchFor)?.batch || '—'}（证书 {byCode(batchFor)?.certNo || '—'}）
            </div>
            <DataTable
              minWidth={560}
              rows={itemBatches(batchFor, whOf(batchFor))}
              rowKey={(b) => b.batch + b.wh}
              empty="该物料暂无库存批次（库存为 0）"
              cols={[
                { key: 'batch', title: '批次号', width: 140, render: (b) => <span className="num">{b.batch}</span> },
                { key: 'wh', title: '仓库', width: 180, render: (b) => <span className="nc-tiny">{b.wh}</span> },
                { key: 'qty', title: '数量', width: 90, align: 'right', render: (b) => <b className="num">{b.qty}</b> },
                { key: 'src', title: '性质', width: 100, render: (b) => <Tag tone={b.src === '认证批次' ? 'blue' : 'gray'}>{b.src}</Tag> },
                { key: 'cert', title: '对应证书', render: (b) => <span className="nc-tiny num">{b.cert}</span> },
              ]}
            />
          </>
        )}
      </Drawer>

      {/* ==================== 入库登记 ==================== */}
      <Drawer open={opIn} title="入库登记" width={840} onClose={() => setOpIn(false)}
        foot={<><Btn onClick={() => setOpIn(false)}>取消</Btn><Btn kind="primary" onClick={() => {
          const m = byCode(inCode);
          if (!m) { setInErr('请选择物料'); return; }
          if (m.ccc || itemNeedCCC(m)) { if (!inBatch.trim()) { setInErr('消防产品批次号必填（强制性产品认证目录内产品）'); return; } }
          if (!(Number(inQty) > 0)) { setInErr('入库数量须 > 0'); return; }
          if (!(Number(inPrice) > 0)) { setInErr('入库单价须 > 0'); return; }
          const q = Number(inQty);
          /* 身份标识采录：强制认证产品须录明码号段，且长度必须等于入库数量 —— 「货到了但身份没录」等于验收无证可查 */
          const needMark = itemNeedIdMark(m);
          if (needMark) {
            const err = idMarkCheck(inCode, inMarkFrom.trim(), inMarkTo.trim(), q, ID_MARK_RANGES);
            if (err) { setInErr(err); return; }
          }
          if (needMark && inMarkFrom.trim()) {
            idMarkAddRange({
              code: inCode, batch: inBatch.trim(), from: inMarkFrom.trim(), to: inMarkTo.trim(), qty: q,
              wh: inWh, date: inDate, po: inPo || undefined, by: inBy,
            });
          }
          setOpIn(false); resetOpForm();
          const markTxt = needMark && inMarkFrom.trim() ? ` · 身份标识 ${fmtMark(inMarkFrom.trim())} ~ ${fmtMark(inMarkTo.trim())}` : '';
          /* 入库只增存货：不含税金额进存货账，成本留到领用时按加权平均单价结转到项目 */
          const inAmt = toBaseAmt(m, q * Number(inPrice));
          commitOp({
            type: '入库', code: inCode, wh: inWh, qty: q, by: inBy, amt: inAmt,
            msg: `已入库 ${m.name} ${q}${m.unit}（批次 ${inBatch || '—'}）至「${inWh}」，存货成本 +¥${fmt(inAmt)}（领用时结转至项目）· 结余 ${m.stock + q}${m.unit}${markTxt ? ` · 已采录身份标识 ${q} 件` : ''}`,
            act: `${m.name} +${q}${m.unit} · 批次 ${inBatch || '—'} · 存货成本 +¥${fmt(inAmt)}${markTxt}${inPo ? ` · 关联采购订单 ${inPo}` : ''}`,
          });
          /* 入库回写采购订单，闭合「询价 → 采购订单 → 入库」链路（可落地⑮：支持分次入库） */
          if (inPo) {
            setRfqs((v) => v.map((r) => {
              if (!r.po || r.po.no !== inPo) return r;
              const line = r.mats.find((m) => m.code === inCode);
              const total = line?.qty ?? q;
              const recv = (r.po.received ?? 0) + q;
              const done = recv >= total;
              return { ...r, po: { ...r.po, received: recv, status: done ? '已入库' : '部分到货' } };
            }));
            const rr = rfqs.find((r) => r.po && r.po.no === inPo);
            const lineQ = rr?.mats.find((m) => m.code === inCode)?.qty ?? q;
            const newRecv = (rr?.po?.received ?? 0) + q;
            toast(newRecv >= lineQ ? `采购订单 ${inPo} 已全部入库` : `采购订单 ${inPo} 部分到货（已入 ${newRecv}/${lineQ}）· 仍可继续分次入库`);
          }
        }}>确认入库</Btn></>}>
        {itemNeedIdMark(byCode(inCode)) && (
          <div className="nc-warnbox is-warn"><b>本品须采录身份标识（A / B 签）</b><div>
            该物料所属目录要求强制性认证，须按厂家号段采录 14 位明码区间，长度与入库数量一致。
            A 签随货贴于产品本体，B 签由本系统按号段生成报验清单 —— 未采录则竣工验收无 B 签可交。
          </div></div>
        )}
        {inErr && <Alert icon={<Ico n="warning" size={16} />} tone="danger" title={inErr} />}
        <div className="nc-form-grid">
          <Field label="关联采购订单" span={2} note="来自询比价「已选定」后生成的订单，入库后自动回写状态">
            <select className="nc-input" value={inPo} onChange={(e) => setInPo(e.target.value)}>
              <option value="">（不关联）</option>
              {rfqs.filter((r) => r.po && r.po.status !== '已入库').map((r) => <option key={r.po!.no} value={r.po!.no}>{r.po!.no} · {supName(r.po!.supplier)} · {fmtWan(r.po!.amt)}</option>)}
            </select>
          </Field>
          <Field label="物料" req span={2}>
            <ItemPicker value={inCode} onChange={setInCode} options={stocked} />
          </Field>
          <Field label="仓库" req><select className="nc-input" value={inWh} onChange={(e) => setInWh(e.target.value)}>{WH.map((w) => <option key={w}>{w}</option>)}</select></Field>
          <Field label="库位" req><select className="nc-input" value={inLoc} onChange={(e) => setInLoc(e.target.value)}>{LOC.map((l) => <option key={l}>{l}</option>)}</select></Field>
          <Field label="批次号" req={itemNeedCCC(byCode(inCode)) || byCode(inCode)?.ccc} err={inErr.includes('批次') ? inErr : undefined} note="消防产品批次必填，如 PC20260921-A">
            <input className="nc-input" value={inBatch} onChange={(e) => setInBatch(e.target.value)} placeholder="PC20260921-A" />
          </Field>
          {itemNeedIdMark(byCode(inCode)) && (() => {
            const rule = idMarkRuleOf(inCode);
            const q = Number(inQty) || 0;
            return (
              <>
                <Field label="身份标识起始明码" req span={2}
                  note={`14 位 · 厂家备案号段 ${rule?.prefix ?? '—'} 开头（${rule?.type === 'I' ? 'I 型 33×22mm' : 'II 型 45×40mm'}）`}>
                  <input className="nc-input" inputMode="numeric" value={inMarkFrom}
                    onChange={(e) => setInMarkFrom(e.target.value.replace(/\D/g, '').slice(0, 14))}
                    placeholder={rule ? `${rule.prefix}000001` : '14 位明码'} />
                </Field>
                <Field label="身份标识截止明码" req
                  note={q > 0 && /^\d{14}$/.test(inMarkFrom) ? `预计截止 ${fmtMark(shiftMark(inMarkFrom, q - 1))}（${q} 件）` : '按数量自动推算，可手改'}>
                  <input className="nc-input" inputMode="numeric" value={inMarkTo}
                    onChange={(e) => setInMarkTo(e.target.value.replace(/\D/g, '').slice(0, 14))}
                    placeholder={q > 0 && /^\d{14}$/.test(inMarkFrom) ? shiftMark(inMarkFrom, q - 1) : '14 位明码'} />
                </Field>
              </>
            );
          })()}
          <Field label="数量" req><input className="nc-input" type="number" value={inQty} onChange={(e) => setInQty(e.target.value)} placeholder="0" /></Field>
          <Field label="单价（含税）" req><input className="nc-input" type="number" value={inPrice} onChange={(e) => setInPrice(e.target.value)} placeholder="0.00" /></Field>
          <Field label="日期"><input className="nc-input" type="date" value={inDate} onChange={(e) => setInDate(e.target.value)} /></Field>
          <Field label="经办"><select className="nc-input" value={inBy} onChange={(e) => setInBy(e.target.value)}><option>张仓</option><option>李工</option><option>王工</option></select></Field>
        </div>
      </Drawer>

      {/* ==================== 领用登记（含身份标识流向回写） ====================
          字段超过 5 个（物料 / 出库仓 / 关联项目 / 安装部位 / 数量 / 领用人），按交互规范改用抽屉 640 */}
      {(() => {
        const mOut = byCode(inCode);
        const needOut = itemNeedIdMark(mOut);
        const qOut = Number(inQty) || 0;
        const alloc = needOut && qOut > 0 ? idMarkAlloc(inCode, qOut, ID_MARK_RANGES, ID_MARK_FLOWS) : null;
        const stockOut = idMarkStockOf(inCode);
        return (
      <Drawer open={opOut} title="领用登记" width={640} onClose={() => setOpOut(false)}
        sub={needOut ? '领用即回写身份标识流向：号段随货发往项目现场，竣工验收据此出 B 签清单' : undefined}
        foot={<><Btn onClick={() => setOpOut(false)}>取消</Btn><Btn kind="primary" onClick={() => {
          const m = byCode(inCode);
          if (!m) { setInErr('请选择物料'); return; }
          if (!(Number(inQty) > 0)) { setInErr('领用数量须 > 0'); return; }
          const whAvail = whOf(inCode)[inWh] || 0;
          if (Number(inQty) > whAvail) { setInErr(`领用数量 ${inQty}${m.unit} 超出「${inWh}」可用库存 ${whAvail}${m.unit}`); return; }
          const q = Number(inQty);
          /* 成本归集点在领用：材料成本结转到哪个项目由「关联项目」决定，故所有领用都必须选项目 */
          if (!outProj) { setInErr('请选择关联项目（材料成本在领用时结转至该项目）'); return; }
          /* 流向回写：把一段号段绑定到「项目 + 部位」。没有可分配号段 = 货有身份没录，验收查不到，故硬拦截 */
          if (needOut) {
            if (!outProj) { setInErr('该物料须回写流向，请选择关联项目'); return; }
            if (!outPart.trim()) { setInErr('该物料须回写流向，请填写安装部位（如 F2 走廊 · 点位 B-01 ~ B-40）'); return; }
            if (!alloc) {
              setInErr(`可用身份标识仅剩 ${stockOut.free}${m.unit}，不足以覆盖本次 ${q}${m.unit}；请先入库采录号段`);
              return;
            }
          }
          setOpOut(false); resetOpForm();
          if (needOut && alloc) {
            idMarkAddFlow({
              rangeId: alloc.rangeId, code: inCode, from: alloc.from, to: alloc.to, qty: q,
              proj: outProj, part: outPart.trim(), date: inDate, by: inBy, status: '已领未装',
            });
          }
          /* 领用即结转：按移动加权平均单价把存货成本结转到领用项目，并回写项目成本台账 */
          const unitCost = stockUnitCost(m);
          const outAmt = Math.round(q * unitCost);
          commitOp({
            type: '领用', code: inCode, wh: inWh, qty: q, by: inBy, amt: -outAmt,
            msg: `已领用 ${m.name} ${q}${m.unit}（自「${inWh}」）；按加权平均单价 ¥${fmt(unitCost)} 结转 ¥${fmt(outAmt)} 至项目 ${outProj} · 结余 ${m.stock - q}${m.unit}${alloc ? ` · 流向已回写 ${outProj} ${outPart}` : ''}`,
            act: `${m.name} -${q}${m.unit} · 结转至 ${outProj} ¥${fmt(outAmt)}${alloc ? ` · 身份标识 ${fmtMark(alloc.from)} ~ ${fmtMark(alloc.to)} → ${outProj} ${outPart}` : ''}`,
          });
          addPjCostRow(outProj, {
            id: `CB${Date.now().toString().slice(-6)}`,
            src: 'CB', type: '材料费', amt: outAmt, date: inDate,
            note: `${m.name} ×${q}${m.unit} · 领用自「${inWh}」· 结转单价 ¥${fmt(unitCost)}`,
            st: '已计入成本',
          });
        }}>确认领用</Btn></>}>
        {needOut && (
          <div className="nc-warnbox is-warn"><b>本品须回写身份标识流向</b><div>
            A 签随货贴于产品本体，本系统按领用号段生成 B 签清单；竣工验收要求「流向单位与采购单位一致」，
            当前可分配存量 <b>{stockOut.free}</b>{mOut?.unit}（已采录 {stockOut.inQty} · 已流向 {stockOut.outQty}）。
          </div></div>
        )}
        {inErr && <Alert icon={<Ico n="warning" size={16} />} tone="danger" title={inErr} />}
        <div className="nc-form-grid">
          <Field label="物料" req span={2}>
            <ItemPicker value={inCode} onChange={setInCode}
              options={stocked.map((m) => ({ ...m, sub: `${m.spec} · ${inWh} 可用 ${whOf(m.code)[inWh] || 0} ${m.unit}` }))} />
          </Field>
          <Field label="出库仓" req><select className="nc-input" value={inWh} onChange={(e) => setInWh(e.target.value)}>{WH.map((w) => <option key={w}>{w}</option>)}</select></Field>
          <Field label="关联项目" req={needOut}>
            <ProjectPicker
              value={outProj} onChange={setOutProj}
              clearLabel="（不关联）" placeholder="（不关联 · 可搜索项目）"
            />
          </Field>
          <Field label="安装部位 / 点位" req={needOut} span={2}
            note={needOut ? '决定 B 签清单的归属，须精确到楼层与点位区间' : '可选，便于后续按部位追溯'}>
            <input className="nc-input" value={outPart} onChange={(e) => setOutPart(e.target.value)}
              placeholder={needOut ? '如 F2 走廊 · 点位 B-01 ~ B-40' : '如 F1 大厅'} />
          </Field>
          <Field label="领用数量" req><input className="nc-input" type="number" value={inQty} onChange={(e) => setInQty(e.target.value)} placeholder="0" /></Field>
          <Field label="领用人"><select className="nc-input" value={inBy} onChange={(e) => setInBy(e.target.value)}><option>张仓</option><option>李工</option><option>王工</option></select></Field>
          {needOut && qOut > 0 && (
            <Field label="本次回写号段" span={4}>
              {alloc
                ? <div className="nc-cell-sub num">{fmtMark(alloc.from)} ~ {fmtMark(alloc.to)}（共 {qOut}{mOut?.unit}）· 状态 已领未装</div>
                : <div className="nc-field-err">可分配存量不足，请先入库采录号段</div>}
            </Field>
          )}
        </div>
      </Drawer>
        );
      })()}

      {/* ==================== 退料 ==================== */}
      <Drawer open={opBack} title="退料（项目 → 仓库）" width={640} onClose={() => setOpBack(false)}
        foot={<><Btn onClick={() => setOpBack(false)}>取消</Btn><Btn kind="primary" onClick={() => {
          const mb = byCode(inCode);
          if (!mb) { setInErr('请选择物料'); return; }
          if (!(Number(inQty) > 0)) { setInErr('退料数量须 > 0'); return; }
          const q = Number(inQty);
          if (!outProj) { setInErr('请选择来源项目（退料按该项目回冲材料成本）'); return; }
          setOpBack(false); resetOpForm();
          /* 退料回冲：按加权平均单价冲减该项目的材料成本（净额追加，不删原行），存货退回仓库 */
          const backUnit = stockUnitCost(mb);
          const backAmt = Math.round(q * backUnit);
          commitOp({
            type: '退料', code: inCode, wh: inWh, qty: q, by: inBy, amt: backAmt,
            msg: `已退料 ${mb.name} ${q}${mb.unit} 至「${inWh}」，按加权平均单价 ¥${fmt(backUnit)} 回冲项目 ${outProj} 成本 ¥${fmt(backAmt)} · 结余 ${mb.stock + q}${mb.unit}`,
            act: `${mb.name} +${q}${mb.unit} · 退入「${inWh}」· 回冲 ${outProj} ¥${fmt(backAmt)}`,
          });
          addPjCostRow(outProj, {
            id: `CB${Date.now().toString().slice(-6)}`,
            src: 'CB', type: '材料费', amt: -backAmt, date: inDate,
            note: `${mb.name} ×${q}${mb.unit} · 退料回冲（退回「${inWh}」）· 单价 ¥${fmt(backUnit)}`,
            st: '已计入成本',
          });
        }}>确认退料</Btn></>}>
        {inErr && <Alert icon={<Ico n="warning" size={16} />} tone="danger" title={inErr} />}
        <div className="nc-form-grid">
          <Field label="物料" req span={2}>
            <ItemPicker value={inCode} onChange={setInCode} options={stocked} />
          </Field>
          <Field label="来源项目" req note="退料回冲的就是这个项目的材料成本">
            <ProjectPicker value={outProj} onChange={setOutProj} placeholder="（可搜索项目）" />
          </Field>
          <Field label="退回仓" req><select className="nc-input" value={inWh} onChange={(e) => setInWh(e.target.value)}>{WH.map((w) => <option key={w}>{w}</option>)}</select></Field>
          <Field label="退料数量" req><input className="nc-input" type="number" value={inQty} onChange={(e) => setInQty(e.target.value)} placeholder="0" /></Field>
          <Field label="经办"><select className="nc-input" value={inBy} onChange={(e) => setInBy(e.target.value)}><option>张仓</option><option>李工</option><option>王工</option></select></Field>
          <Field label="退料原因" span={4}><textarea className="nc-input" rows={2} placeholder="如：现场设计变更，剩余物料退回" /></Field>
        </div>
      </Drawer>

      {/* ==================== 库存盘点 ==================== */}
      <Modal open={opCheck} title="库存盘点" width={480} onClose={() => setOpCheck(false)}
        foot={<><Btn onClick={() => setOpCheck(false)}>取消</Btn><Btn kind="primary" onClick={() => {
          const m = byCode(inCode);
          if (!m) { setInErr('请选择物料'); return; }
          const book = whOf(inCode)[inWh] || 0;
          const diff = Number(inQty || 0) - book;
          setOpCheck(false); resetOpForm();
          /* 盘点差异同样走金额：按加权平均单价调整存货成本，盘盈增加、盘亏减少 */
          const chkUnit = stockUnitCost(m);
          const chkAmt = Math.round(diff * chkUnit);
          commitOp({
            type: '盘点', code: inCode, wh: inWh, qty: diff, by: inBy, amt: chkAmt,
            msg: `已生成《盘点调整单》·「${inWh}」账面 ${book} → 实盘 ${inQty || 0}，差异 ${diff > 0 ? '+' : ''}${diff}（留痕）· 按加权平均单价 ¥${fmt(chkUnit)} 调整存货成本 ${chkAmt >= 0 ? '+' : ''}¥${fmt(Math.abs(chkAmt))}`,
            act: `${m.name}「${inWh}」账面 ${book} → 实盘 ${inQty || 0} · 差异 ${diff > 0 ? '+' : ''}${diff} · 存货成本 ${chkAmt >= 0 ? '+' : '-'}¥${fmt(Math.abs(chkAmt))}`,
          });
        }}>生成调整单</Btn></>}>
        <div className="nc-form-grid">
          <Field label="物料" req span={2}>
            <ItemPicker value={inCode} onChange={setInCode} options={stocked} />
          </Field>
          <Field label="仓库" req><select className="nc-input" value={inWh} onChange={(e) => setInWh(e.target.value)}>{WH.map((w) => <option key={w}>{w}</option>)}</select></Field>
          <Field label="实盘数量" req><input className="nc-input" type="number" value={inQty} onChange={(e) => setInQty(e.target.value)} placeholder="0" /></Field>
          <Field label="账面 / 差异" span={4}>
            <div className="nc-money-row">
              <div className="nc-money-cell"><span className="nc-tiny nc-muted">账面（{inWh}）</span><b className="num">{whOf(inCode)[inWh] || 0}</b></div>
              <div className="nc-money-cell"><span className="nc-tiny nc-muted">实盘</span><b className="num">{Number(inQty || 0)}</b></div>
              <div className="nc-money-cell"><span className="nc-tiny nc-muted">差异</span><b className={`num${Number(inQty || 0) - (whOf(inCode)[inWh] || 0) !== 0 ? ' nc-v-red' : ''}`}>{(Number(inQty || 0) - (whOf(inCode)[inWh] || 0)) > 0 ? '+' : ''}{Number(inQty || 0) - (whOf(inCode)[inWh] || 0)}</b></div>
            </div>
          </Field>
        </div>
      </Modal>

      {/* ==================== 库存调拨 ==================== */}
      <Modal open={opMove} title="库存调拨" width={480} onClose={() => setOpMove(false)}
        foot={<><Btn onClick={() => setOpMove(false)}>取消</Btn><Btn kind="primary" onClick={() => {
          const mm = byCode(inCode);
          if (!mm) { setInErr('请选择物料'); return; }
          if (!(Number(inQty) > 0)) { setInErr('调拨数量须 > 0'); return; }
          if (inWh === inToWh) { setInErr('调出仓与调入仓不可相同'); return; }
          const srcAvail = whOf(inCode)[inWh] || 0;
          if (Number(inQty) > srcAvail) { setInErr(`调拨数量 ${inQty}${mm.unit} 超出「${inWh}」库存 ${srcAvail}${mm.unit}`); return; }
          const q = Number(inQty);
          setInErr(''); setOpMove(false); resetOpForm();
          commitOp({
            type: '调拨', code: inCode, wh: inWh, toWh: inToWh, qty: q, by: inBy,
            msg: `已调拨 ${mm.name} ${q}${mm.unit}：${inWh} → ${inToWh}（总量不变，留痕）· 结余 ${mm.stock}${mm.unit}`,
            act: `${mm.name} ${q}${mm.unit} · ${inWh} → ${inToWh} · 跨仓移动总量不变`,
          });
        }}>确认调拨</Btn></>}>
        {inErr && <Alert icon={<Ico n="warning" size={16} />} tone="danger" title={inErr} />}
        <div className="nc-form-grid">
          <Field label="物料" req span={4}>
            <ItemPicker value={inCode} onChange={setInCode} options={stocked} />
          </Field>
          <Field label="调出仓" req><select className="nc-input" value={inWh} onChange={(e) => setInWh(e.target.value)}>{WH.map((w) => <option key={w}>{w}</option>)}</select></Field>
          <Field label="调入仓" req><select className="nc-input" value={inToWh} onChange={(e) => setInToWh(e.target.value)}>{WH.map((w) => <option key={w}>{w}</option>)}</select></Field>
          <Field label="数量" req><input className="nc-input" type="number" value={inQty} onChange={(e) => setInQty(e.target.value)} placeholder="0" /></Field>
          <Field label="经办"><select className="nc-input" value={inBy} onChange={(e) => setInBy(e.target.value)}><option>张仓</option><option>李工</option><option>王工</option></select></Field>
        </div>
      </Modal>

      {/* ==================== 设置安全线 ==================== */}
      <Modal open={!!opSafe} title={`设置安全线 · ${opSafe?.name || ''}`} width={480} onClose={() => setOpSafe(null)}
        foot={<><Btn onClick={() => setOpSafe(null)}>取消</Btn><Btn kind="primary" onClick={() => {
          const v = Number(safeVal);
          if (!(v >= 0)) { toast('安全线须 ≥ 0', 'err'); return; }
          if (opSafe) {
            setItems((rs) => rs.map((r) => (r.code === opSafe.code ? { ...r, safe: v } : r)));
            auditOnly('王敏', '主数据管理员', `安全线调整 · ${opSafe.name} ${opSafe.safe} → ${v}（留痕：谁/何时/旧值→新值）`);
            toast(`安全线 ${opSafe.name}：${opSafe.safe} → ${v}（调整记录已留痕）`);
          }
          setOpSafe(null);
        }}>保存</Btn></>}>
        <div className="nc-form-grid">
          <Field label="物料" span={4}><input className="nc-input" disabled value={`${opSafe?.code} · ${opSafe?.name} ${opSafe?.spec}`} /></Field>
          <Field label="当前安全线"><input className="nc-input" disabled value={String(opSafe?.safe ?? '')} /></Field>
          <Field label="安全线数量" req><input className="nc-input" type="number" value={safeVal} onChange={(e) => setSafeVal(e.target.value)} /></Field>
        </div>
      </Modal>

      {/* ==================== 价格库历史 ==================== */}
      <Modal open={!!plibHis} title={`价格历史 · ${plibHis?.name || ''}`} width={640} onClose={() => setPlibHis(null)}
        foot={<><Btn onClick={() => setPlibHis(null)}>关闭</Btn><Btn kind="primary" onClick={() => { setPlibHis(null); toast('已发起调价复核（变更单 MD + 6 位）'); }}>发起调价复核</Btn></>}>
        <table className="nc-tbl" style={{ minWidth: 560 }}>
          <thead><tr><th style={{ width: 110 }}>生效日期</th><th style={{width: 110}} className="is-num">含税价</th><th style={{width: 90}} className="is-num">涨跌</th><th style={{ width: 120 }}>来源</th><th>备注</th></tr></thead>
          <tbody>
            {priceHistory(plibHis?.code || '').map((r, i, arr) => {
              const prev = arr[i + 1];
              const chg = prev ? ((r.p - prev.p) / prev.p) * 100 : 0;
              return (
                <tr key={r.d}>
                  <td className="num nc-tiny">{r.d}</td>
                  <td className="is-num num">{fmt(r.p)}</td>
                  <td className={`is-num num${chg > 0 ? ' nc-v-red' : chg < 0 ? ' nc-v-green' : ''}`}>{i === arr.length - 1 ? '—' : `${chg > 0 ? '+' : ''}${chg.toFixed(1)}%`}</td>
                  <td><Tag tone="blue">{r.s}</Tag></td>
                  <td className="nc-tiny nc-muted">{r.n}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Modal>

      {/* ==================== 上传认证与报告 ==================== */}
      <Drawer open={certUp} title="上传认证与报告（≤5 附件 · PDF/JPG/PNG）" width={640} onClose={() => setCertUp(false)}
        foot={<><Btn onClick={() => setCertUp(false)}>取消</Btn><Btn kind="primary" onClick={() => {
          if (!cuNo.trim()) { toast('请填写证书编号', 'err'); return; }
          const m = byCode(cuMat);
          setCerts((v) => [{ matCode: cuMat, mat: m ? `${m.name} ${m.spec}`.trim() : cuMat, type: cuType, no: cuNo.trim(), validTo: cuTo || '—', batch: cuBatch || m?.batch || '—', files: 1, ch: cuTo ? cuCh : '' }, ...v]);
          setItems((rs) => rs.map((x) => (x.code === cuMat ? { ...x, certType: cuType, certNo: cuNo.trim(), certValidTo: cuTo || '—', certFiles: (x.certFiles ?? 0) + 1, batch: cuBatch || x.batch, notifyCh: cuTo ? cuCh : '' } : x)));
          auditOnly('张仓', '仓管员', `上传认证附件 · ${m?.name || cuMat} ${cuType} ${cuNo.trim()}（≤5 附件）`);
          setCertUp(false); setCuNo(''); setCuTo(''); setCuBatch('');
          toast('已上传并记录审计日志；证书属性同步回主数据，到期前 30 天自动提醒');
        }}>保存</Btn></>}>
        <div className="nc-warnbox is-info"><b>同源规则</b><div>证书上传后同步回主数据的「认证」属性 —— 台账徽标与合规台账因此永远一致；无有效期（长期有效）时不派发通知渠道。</div></div>
        <div className="nc-form-grid">
          <Field label="物料" req span={2}>
            <ItemPicker value={cuMat} onChange={setCuMat} options={stocked} />
          </Field>
          <Field label="证书类型" req span={2}>
            <select className="nc-input" value={cuType} onChange={(e) => setCuType(e.target.value)}>{CERT_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
          </Field>
          <Field label="证书编号" req><input className="nc-input" value={cuNo} onChange={(e) => setCuNo(e.target.value)} placeholder="如 CCCF-2026-FH-001122" /></Field>
          <Field label="有效期至" note="留空 = 长期有效，不派发到期通知"><input className="nc-input" type="date" value={cuTo} onChange={(e) => setCuTo(e.target.value)} /></Field>
          <Field label="关联批次"><input className="nc-input" value={cuBatch} onChange={(e) => setCuBatch(e.target.value)} placeholder="如 PC20260921-A" /></Field>
          <Field label="到期通知渠道">
            <select className="nc-input" value={cuCh} onChange={(e) => setCuCh(e.target.value)} disabled={!cuTo}>{CHANNELS.map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
          <Field label="附件" req span={4}><div className="nc-dropzone"><Ico n="paperclip" size={16} /> 点击或拖拽上传（≤5 个 · PDF / JPG / PNG）</div></Field>
        </div>
      </Drawer>

      {/* ==================== 发起询价 ==================== */}
      <Modal open={rfqNew} title="发起询价" width={640} onClose={() => setRfqNew(false)}
        foot={<><Btn onClick={() => setRfqNew(false)}>取消</Btn><Btn kind="primary" onClick={() => {
          if (!rfqLines.length) { setRfqErr('请至少添加一行物料 / 服务 / 软件'); return; }
          if (rfqLines.some((l) => !l.code)) { setRfqErr('每行须选择物料 / 服务 / 软件'); return; }
          if (rfqLines.some((l) => !(Number(l.qty) > 0))) { setRfqErr('每行数量须 > 0'); return; }
          if (!rfqDl || new Date(rfqDl.replace(' ', 'T')).getTime() <= new Date(`${TODAY}T12:00`).getTime()) { setRfqErr('报价截止须晚于当前时间'); return; }
          if (!rfqInv.length) { setRfqErr('请至少邀约一家供应商'); return; }
          setRfqErr('');
          const id = `XJ${TODAY.replace(/-/g, '')}${String(rfqs.length + 1).padStart(3, '0')}`;
          setRfqs((v) => [{
            id, status: '询价中', needDate: rfqNeed, deadline: rfqDl, from: rfqFrom,
            /* 数量取自主数据档案口径，避免与库存缺口脱节 */
            mats: rfqLines.map((l) => { const m = byCode(l.code)!; return { code: m.code, name: `${m.name} ${m.spec}`.trim(), qty: Number(l.qty), unit: m.unit }; }),
            invited: rfqInv, quotes: {},
          }, ...v]);
          setRfqNew(false); setQrOpen(id);
          toast(`询价单 ${id} 已发起（来源：${rfqFrom}），已生成一人一码二维码`);
        }}>生成二维码并发起</Btn></>}>
        <div className="nc-warnbox is-info">填写需要的物料 / 服务 / 软件与数量 → 生成二维码，供应商扫码填价；<b>黑名单供应商不可邀约</b>。服务只寻源可外采项，套件不询价。</div>
        {rfqErr && <Alert icon={<Ico n="warning" size={16} />} tone="danger" title={rfqErr} />}
        <Field label="物料 / 服务 / 软件（数量）" req span={4}>
          <table className="nc-tbl" style={{ minWidth: 560 }}>
            <thead><tr><th>物料 / 服务 / 软件</th><th style={{ width: 120 }}>数量</th><th style={{ width: 60 }}>操作</th></tr></thead>
            <tbody>
              {rfqLines.map((l, i) => (
                <tr key={i}>
                  <td>
                    <ItemPicker value={l.code} kinds={KINDS_NO_KIT} clearLabel="请选择…"
                      onChange={(v) => setRfqLines((rows) => rows.map((x, j) => (j === i ? { ...x, code: v } : x)))} />
                  </td>
                  <td><input className="nc-input" type="number" value={l.qty} onChange={(e) => setRfqLines((v) => v.map((x, j) => (j === i ? { ...x, qty: e.target.value } : x)))} placeholder="0" /></td>
                  <td>{rfqLines.length > 1 ? <Op danger onClick={() => setRfqLines((v) => v.filter((_, j) => j !== i))}>删除</Op> : <span className="nc-muted nc-tiny">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="nc-addrow" onClick={() => setRfqLines((v) => [...v, { code: '', qty: '' }])}>＋ 添加</button>
          <div className="nc-tiny nc-muted" style={{ marginTop: 8 }}>合计 {rfqLines.length} 项 · 单位取自主数据档案（{rfqLines.map((l) => byCode(l.code)?.unit).filter(Boolean).join(' / ') || '—'}）</div>
        </Field>
        <div className="nc-form-grid">
          <Field label="需求日期" req><input className="nc-input" type="date" value={rfqNeed} onChange={(e) => setRfqNeed(e.target.value)} /></Field>
          <Field label="报价截止" req note="须晚于当前时间"><input className="nc-input" value={rfqDl} onChange={(e) => setRfqDl(e.target.value)} placeholder="2026-09-23 18:00" /></Field>
          <Field label="来源" note="库存补齐 = 由「库存预警」一键带出物料与缺口数量"><input className="nc-input" value={rfqFrom} readOnly /></Field>
          <Field label="寻源范围"><select className="nc-input" defaultValue="可外采（硬件 + 服务）"><option>可外采（硬件 + 服务）</option><option>仅硬件（物料）</option></select></Field>
        </div>
        <Field label={`邀约供应商（已选 ${rfqInv.length} 家）`} req span={4}>
          <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--line)', borderRadius: 6 }}>
            {SUPPLIERS.map((s) => (
              <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderBottom: '1px solid var(--line)', opacity: s.blacklist ? 0.55 : 1, cursor: s.blacklist ? 'not-allowed' : 'pointer' }}>
                <input type="checkbox" checked={rfqInv.includes(s.id)} disabled={s.blacklist}
                  onChange={(e) => setRfqInv((v) => (e.target.checked ? [...v, s.id] : v.filter((x) => x !== s.id)))} />
                <span style={{ flex: 1 }}>{s.name}</span>
                <span className="nc-tiny nc-muted">{s.cats.join(' / ')} · {s.status} · 评级 {s.level}</span>
                {s.blacklist && <Tag tone="red">黑名单不可邀约</Tag>}
                {!s.blacklist && s.status === '待准入' && <Tag tone="orange">待准入</Tag>}
              </label>
            ))}
          </div>
          <div className="nc-tiny nc-muted" style={{ marginTop: 8 }}>邀约后自动生成<b>一人一码</b>二维码，供应商扫码填价，无需注册。</div>
        </Field>
      </Modal>

      {/* ==================== 比价矩阵 ==================== */}
      <Modal open={!!matrix} title={`比价矩阵 · ${matrix?.id || ''}`} width={840} onClose={() => setMatrix(null)}
        foot={<>
          <Btn onClick={() => setMatrix(null)}>关闭</Btn>
          {matrix && matrix.status !== '已选定' && matrix.status !== '已关闭' && (() => {
            const bidders = matrix.invited.filter((g) => matrix.quotes[g]);
            const amtOf = (g: string) => matrix.mats.reduce((s, m) => s + (matrix.quotes[g]?.[m.code] ?? 0) * m.qty, 0);
            const low = bidders.length ? bidders.reduce((a, b) => (amtOf(a) <= amtOf(b) ? a : b)) : '';
            return (
              <Btn kind="primary" disabled={bidders.length < 2} title={bidders.length < 2 ? '报价家数 < 2，不具备比价条件，请走「单一来源」审批' : '选定合计最低的供应商'}
                onClick={() => {
                  if (bidders.length < 2) { toast('报价家数 < 2，请走「单一来源」审批', 'err'); return; }
                  setRfqs((v) => v.map((r) => (r.id === matrix.id ? { ...r, status: '已选定', picked: low } : r)));
                  auditOnly('李思敏', '商务合同管理员', `询比价 ${matrix.id} 选定最低价 ${supName(low)} · 合计 ${fmt(amtOf(low))}`);
                  toast(`${matrix.id} 已选定 ${supName(low)}（${fmt(amtOf(low))}）· 可在列表「生成采购订单」`);
                  setMatrix(null);
                }}>选定最低价{bidders.length < 2 ? '（走单一来源）' : ''}</Btn>
            );
          })()}
        </>}>
        {matrix && (() => {
          const supIds = matrix.invited.filter((g) => matrix.quotes[g]);
          const amtOf = (g: string) => matrix.mats.reduce((s, m) => s + (matrix.quotes[g]?.[m.code] ?? 0) * m.qty, 0);
          const lowAmt = supIds.length ? Math.min(...supIds.map((g) => amtOf(g))) : 0;
          const lowest = supIds.length ? supIds.reduce((a, b) => (amtOf(a) <= amtOf(b) ? a : b)) : '';
          const stdAmt = matrix.mats.reduce((s, m) => s + (byCode(m.code)?.price ?? 0) * m.qty, 0);
          /* D5：任意供应商可手动选为中标方；非最低价中标强制填议价原因并留痕 */
          const doPick = (g: string, isLowest: boolean) => {
            if (!g) return;
            if (!isLowest) {
              const overPct = Math.round((amtOf(g) - lowAmt) / lowAmt * 100);
              const reason = window.prompt(`非最低价中标：${supName(g)}（${fmt(amtOf(g))}）较最低 ${supName(lowest)}（${fmt(lowAmt)}）高 ${overPct}%\n请填写议价原因（必填，留痕）：`);
              if (reason === null) return;
              if (!reason.trim()) { toast('非最低价中标必须填写议价原因', 'err'); return; }
              setRfqs((v) => v.map((r) => (r.id === matrix.id ? { ...r, status: '已选定', picked: g, bidReason: reason.trim() } : r)));
              auditOnly('李思敏', '商务合同管理员', `询比价 ${matrix.id} 非最低价选定 ${supName(g)} · 高于最低 ${overPct}% · 原因：${reason.trim()}`);
            } else {
              setRfqs((v) => v.map((r) => (r.id === matrix.id ? { ...r, status: '已选定', picked: g } : r)));
              auditOnly('李思敏', '商务合同管理员', `询比价 ${matrix.id} 选定最低价 ${supName(g)} · 合计 ${fmt(lowAmt)}`);
            }
            toast(`${matrix.id} 已选定 ${supName(g)}`);
            setMatrix(null);
          };
          return <>
            <div className="nc-warnbox is-info">
              <b>比价口径</b>
              <div>行 = 需求项（数量取自主数据档案）· 列 = 受邀供应商报价；绿色 = 该行最低价，合计最低者即推荐中标。
                标准价合计 <b className="num">{fmt(stdAmt)}</b>（主数据参考价，仅作对照）。</div>
            </div>
            <table className="nc-tbl" style={{ minWidth: 760 }}>
              <thead><tr>
                <th>需求项</th>
                <th style={{width: 90}} className="is-num">数量</th>
                <th style={{width: 110}} className="is-num">标准价</th>
                {supIds.map((g) => <th key={g} style={{ width: 132, textAlign: 'right' }}>{supName(g)}</th>)}
              </tr></thead>
              <tbody>
                {matrix.mats.map((m) => {
                  const std = byCode(m.code)?.price ?? 0;
                  const vals = supIds.map((g) => matrix.quotes[g]?.[m.code]).filter((x): x is number => typeof x === 'number');
                  const lo = vals.length ? Math.min(...vals) : -1;
                  return (
                    <tr key={m.code}>
                      <td>{m.name}<div className="nc-tiny nc-muted">{m.code}</div></td>
                      <td className="is-num num">{m.qty} {m.unit}</td>
                      <td className="is-num num nc-muted">{fmt(std)}</td>
                      {supIds.map((g) => {
                        const p = matrix.quotes[g]?.[m.code];
                        const best = typeof p === 'number' && p === lo;
                        return <td key={g} className={`is-num num${best ? ' nc-v-green' : ''}`}>{p === undefined ? '—' : <>{fmt(p)}{best ? ' ★' : ''}</>}</td>;
                      })}
                    </tr>
                  );
                })}
                <tr>
                  <td><b>合计</b>{supIds.length < 2 && <div className="nc-tiny nc-v-red">报价不足 2 家 → 走单一来源</div>}</td>
                  <td />
                  <td className="is-num num nc-muted">{fmt(stdAmt)}</td>
                  {supIds.map((g) => {
                    const isLow = amtOf(g) === lowAmt;
                    const over = isLow ? 0 : Math.round((amtOf(g) - lowAmt) / lowAmt * 100);
                    return (
                      <td key={g} className={`is-num num${isLow ? ' nc-v-green' : ''}`}>
                        {matrix.status !== '已选定' && matrix.status !== '已关闭' && (
                          <label style={{ cursor: 'pointer', marginRight: 6 }} title="选为中标方">
                            <input type="radio" name="win" checked={matrix.picked === g} onChange={() => doPick(g, isLow)} />
                          </label>
                        )}
                        <b>{fmt(amtOf(g))}</b>
                        {!isLow && <div className="nc-tiny nc-muted">高于最低 {over}%</div>}
                        {matrix.picked === g && <div className="nc-tiny nc-v-green">★ 中标</div>}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
            <div className="nc-tiny nc-muted" style={{ marginTop: 8 }}>
              已选定：{matrix.picked ? <b>{supName(matrix.picked)}</b> : '尚未选定'}
              {matrix.bidReason ? <span> · 议价原因：<b style={{ color: 'var(--c-warn-text, #b26a00)' }}>{matrix.bidReason}</b></span> : ''}
              {matrix.invited.length - supIds.length > 0 ? ` · ${matrix.invited.length - supIds.length} 家尚未报价（显示「—」）` : ''}
            </div>
          </>;
        })()}
      </Modal>

      {/* ==================== 二维码邀约（一人一码） ==================== */}
      <Modal open={!!qrOpen} title={`供应商报价二维码 · ${qrOpen || ''}`} width={480} onClose={() => setQrOpen(null)}
        foot={<>
          <Btn onClick={() => {
            const u = `https://nuoan.example.com/rfq/${qrOpen}`;
            if (navigator.clipboard) navigator.clipboard.writeText(u);
            toast('报价链接已复制，可发送给供应商');
          }}>复制链接</Btn>
          <Btn kind="primary" onClick={() => { setQrOpen(null); setDomain('src'); setTab('rfq'); }}>返回询比价</Btn>
        </>}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <svg width={168} height={168} viewBox="0 0 25 25" shapeRendering="crispEdges"
            style={{ background: 'var(--c-canvas)', border: '1px solid var(--c-border)', borderRadius: 6, flex: 'none' }}>
            {Array.from({ length: 625 }).map((_, i) => {
              const x = i % 25;
              const y = Math.floor(i / 25);
              const seed = `${qrOpen || 'XJ'}`.split('').reduce((a, c, j) => a + c.charCodeAt(0) * (j + 3), 7);
              const finder = (fx: number, fy: number) => (x >= fx && x < fx + 7 && y >= fy && y < fy + 7)
                && (x === fx || x === fx + 6 || y === fy || y === fy + 6
                  || (x >= fx + 2 && x <= fx + 4 && y >= fy + 2 && y <= fy + 4));
              const on = ((seed * (x + 5) * (y + 11)) + x * y * 31) % 13 < 6;
              return (on || finder(0, 0) || finder(18, 0) || finder(0, 18))
                ? <rect key={i} x={x} y={y} width={1} height={1} fill="#1f2329" />
                : null;
            })}
          </svg>
          <div style={{ flex: 1, minWidth: 0 }}>
            <KvGrid cols={1} rows={[
              { k: '询价单号', v: qrOpen || '—' },
              { k: '物料 / 服务 / 软件', v: (rfqs.find((r) => r.id === qrOpen)?.mats || []).map((m) => `${m.name} ×${m.qty}${m.unit}`).join('；') || '—' },
              { k: '报价截止', v: rfqs.find((r) => r.id === qrOpen)?.deadline || '—' },
              { k: '邀请供应商', v: (rfqs.find((r) => r.id === qrOpen)?.invited || []).map((g) => supName(g)).join('、') || '—' },
            ]} />
            <div className="nc-tiny nc-muted" style={{ marginTop: 10 }}>
              一人一码：每家供应商扫码进入自己的报价页，填价即回填比价矩阵，彼此不可见。
            </div>
          </div>
        </div>
      </Modal>

      {/* ==================== 模拟供应商报价（仅演示模式） ==================== */}
      <Modal open={!!quoteOpen} title={`模拟供应商报价 · ${quoteOpen?.id || ''}`} width={640} onClose={() => setQuoteOpen(null)}
        foot={<>
          <Btn onClick={() => setQuoteOpen(null)}>取消</Btn>
          <Btn kind="primary" onClick={() => {
            if (!quoteOpen) return;
            if (quoteOpen.mats.some((m) => !(Number(quoteVals[m.code]) > 0))) { toast('每一项都须填写 > 0 的报价单价', 'err'); return; }
            const quote = Object.fromEntries(quoteOpen.mats.map((m) => [m.code, Number(quoteVals[m.code])]));
            setRfqs((v) => v.map((r) => (r.id === quoteOpen.id
              ? { ...r, quotes: { ...r.quotes, [quoteAs]: quote }, status: r.status === '询价中' ? '已报价' : r.status }
              : r)));
            auditOnly('李思敏', '商务合同管理员', `模拟报价录入 · ${quoteOpen.id} · ${supName(quoteAs)}（演示模式）`);
            toast(`${supName(quoteAs)} 的报价已回填 ${quoteOpen.id}（演示模式）`);
            setQuoteOpen(null);
          }}>提交报价</Btn>
        </>}>
        <div className="nc-warnbox is-info">
          <b>演示开关</b>
          <div>此入口仅在勾选「演示模式」时显示，用于模拟供应商扫码后的填价行为；真实场景由供应商扫码自助填写。</div>
        </div>
        <Field label="报价方" req span={2}>
          <select className="nc-input" value={quoteAs} onChange={(e) => { setQuoteAs(e.target.value); setQuoteVals({}); }}>
            {(quoteOpen?.invited || []).map((g) => <option key={g} value={g}>{supName(g)}</option>)}
          </select>
        </Field>
        {quoteOpen && (
          <table className="nc-tbl" style={{ minWidth: 560 }}>
            <thead><tr><th>需求项</th><th style={{width: 96}} className="is-num">数量</th><th style={{ width: 150 }}>报价单价（含税）</th></tr></thead>
            <tbody>
              {quoteOpen.mats.map((m) => (
                <tr key={m.code}>
                  <td>{m.name}<div className="nc-tiny nc-muted">{m.code} · 标准价 {fmt(byCode(m.code)?.price ?? 0)}</div></td>
                  <td className="is-num num">{m.qty} {m.unit}</td>
                  <td><input className="nc-input" type="number" value={quoteVals[m.code] ?? ''} onChange={(e) => setQuoteVals((v) => ({ ...v, [m.code]: e.target.value }))} placeholder="0.00" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Modal>

      {/* ==================== 生成采购订单 ==================== */}
      <Modal open={!!poFor} title={`生成采购订单 · 来源 ${poFor?.id || ''}`} width={640} onClose={() => setPoFor(null)}
        foot={<>
          <Btn onClick={() => setPoFor(null)}>取消</Btn>
          <Btn kind="primary" onClick={() => {
            if (!poFor) return;
            const sup = poFor.picked || poFor.invited[0];
            if (!sup) { toast('该询价单没有可下单的供应商', 'err'); return; }
            const amt = poFor.mats.reduce((s, m) => s + (poFor.quotes[sup]?.[m.code] ?? (byCode(m.code)?.price ?? 0)) * m.qty, 0);
            const no = poNo(TODAY, rfqs.filter((r) => r.po).length + 1);
            setRfqs((v) => v.map((r) => (r.id === poFor.id
              ? { ...r, po: { no, supplier: sup, amt: Math.round(amt), date: TODAY, status: '待到货' } }
              : r)));
            auditOnly('李思敏', '商务合同管理员', `生成采购订单 ${no} · 来源询价 ${poFor.id} · ${supName(sup)} · ${fmt(amt)}`);
            toast(`采购订单 ${no} 已生成（${supName(sup)} · ${fmt(amt)}）· 入库时可在「关联采购订单」回写`);
            setPoFor(null);
          }}>确认下单</Btn>
        </>}>
        {poFor && (() => {
          const sup = poFor.picked || poFor.invited[0];
          const amt = poFor.mats.reduce((s, m) => s + (poFor.quotes[sup]?.[m.code] ?? (byCode(m.code)?.price ?? 0)) * m.qty, 0);
          return <>
            <div className="nc-warnbox is-info">
              <b>闭环</b>
              <div>订单生成后状态为「待到货」；在「库存与领用 · 入库登记」的<b>关联采购订单</b>中选中本单，入库后自动回写为「已入库」。</div>
            </div>
            <KvGrid cols={2} rows={[
              { k: '供应商', v: sup ? supName(sup) : '—' },
              { k: '下单日期', v: TODAY },
              { k: '订单金额（含税）', v: <b className="num">{fmt(amt)}</b> },
              { k: '预估不含税存货成本', v: <span className="num" title="入库后按不含税单价计入存货账，领用时结转项目成本（按各行税率折算）">{fmt(poFor.mats.reduce((t, m) => { const p = poFor.quotes[sup]?.[m.code] ?? (byCode(m.code)?.price ?? 0); const tr = byCode(m.code)?.taxRate ?? 13; return t + p * m.qty / (1 + tr / 100); }, 0))}</span> },
            ]} />
            <table className="nc-tbl" style={{ minWidth: 520, marginTop: 10 }}>
              <thead><tr><th>物料 / 服务 / 软件</th><th style={{width: 100}} className="is-num">数量</th><th style={{width: 110}} className="is-num">成交单价</th><th style={{width: 110}} className="is-num">小计</th></tr></thead>
              <tbody>
                {poFor.mats.map((m) => {
                  const p = poFor.quotes[sup]?.[m.code] ?? (byCode(m.code)?.price ?? 0);
                  return <tr key={m.code}><td>{m.name}</td><td className="is-num num">{m.qty} {m.unit}</td><td className="is-num num">{fmt(p)}</td><td className="is-num num">{fmt(p * m.qty)}</td></tr>;
                })}
              </tbody>
            </table>
          </>;
        })()}
      </Modal>

      {/* ==================== 本页检索（Ctrl+K） ==================== */}
      <Modal open={gSearch} title="本页检索" width={640} onClose={() => setGSearch(false)}>
        <Field label="关键词" span={4} note="检索统一主数据（编码 / 名称 / 规格型号）">
          <input className="nc-input" autoFocus value={gKw} onChange={(e) => setGKw(e.target.value)} placeholder="如 镀锌钢管 / CL000123" />
        </Field>
        {(() => {
          const hit = items
            .filter((i) => !gKw || i.name.includes(gKw) || i.code.includes(gKw) || i.spec.includes(gKw))
            .slice(0, 12);
          return (
            <table className="nc-tbl" style={{ minWidth: 560 }}>
              <thead><tr><th style={{ width: 104 }}>编码</th><th>名称 / 规格型号</th><th style={{ width: 80 }}>类型</th><th style={{ width: 80 }}>操作</th></tr></thead>
              <tbody>
                {hit.length === 0 && <tr><td colSpan={4} className="nc-muted nc-tiny">没有匹配的条目</td></tr>}
                {hit.map((i) => (
                  <tr key={i.code}>
                    <td className="num">{i.code}</td>
                    <td>{i.name} <span className="nc-tiny nc-muted">{i.spec}</span></td>
                    <td><Tag tone={KIND_TONE[i.ty]}>{i.ty}</Tag></td>
                    <td>
                      <Op onClick={() => {
                        setGSearch(false); setDomain('master'); setTab('list');
                        if (!isStocked(i.ty)) openRecipe(i.code); else setDetail(i);
                      }}>打开</Op>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })()}
        <div className="nc-tiny nc-muted" style={{ marginTop: 8 }}>此处只检索统一主数据；库存 / 询价 / 证书等内容请在对应工作域内检索。</div>
      </Modal>

      {/* ==================== 批量导入 ==================== */}
      <Modal open={importOpen} title="批量导入主数据" width={480} onClose={() => setImportOpen(false)}
        foot={<>
          <Btn onClick={() => setImportOpen(false)}>取消</Btn>
          <Btn onClick={() => toast('模板已下载（XLSX）')}>下载模板</Btn>
          <Btn kind="primary" onClick={() => { setImportOpen(false); toast('已导入 0 条（原型不解析文件内容）'); }}>开始导入</Btn>
        </>}>
        <div className="nc-warnbox is-info">
          <b>导入规则</b>
          <div>先下载模板按列填写；服务型须填「工日 + 工种」，套件型导入后到行内「配置」补配置行。
            重名 / 重码逐行报错，<b>不覆盖</b>既有数据。</div>
        </div>
        <div className="nc-form-grid">
          <Field label="类型" req span={2}><select className="nc-input">{ITEM_KINDS.map((k) => <option key={k}>{k}</option>)}</select></Field>
          <Field label="文件" req span={2}><div className="nc-dropzone"><Ico n="paperclip" size={16} /> 点击或拖拽上传（XLSX / CSV · ≤5MB）</div></Field>
        </div>
      </Modal>

      {/* ==================== 新增主数据（四类同表，类型可切换） ==================== */}
      <Drawer open={newOpen} title="新增主数据" width={840} onClose={() => setNewOpen(false)}
        foot={<>
          <Btn onClick={() => setNewOpen(false)}>取消</Btn>
          <Btn kind="primary" onClick={() => {
            if (!nf.name.trim()) { setNewErr('名称必填'); return; }
            if (!nf.cat) { setNewErr('请选择分类目录'); return; }
            const stockedKind = isStocked(nf.ty);
            if (stockedKind && !(Number(nf.price) > 0)) { setNewErr('参考价须 > 0'); return; }
            if (nf.ty === '服务' && nfLabor.some((l) => !(l.days > 0))) { setNewErr('人工行的工日须 > 0'); return; }
            if (nf.ty === '套件' && !(Number(nf.sale) > 0)) { setNewErr('套件对外价须 > 0'); return; }
            const pfx = nf.ty === '物料' ? 'CL' : nf.ty === '服务' ? 'SV' : nf.ty === '软件' ? 'SW' : 'CP';
            const n = Math.max(...items.map((r) => Number(r.code.replace(/\D/g, ''))), 0) + 1;
            const code = pfx + String(n).padStart(6, '0');
            const laborSum = nfLabor.reduce((s, l) => s + laborRate(l.trade) * l.days, 0);
            const matSum = nfMats.reduce((s, c) => s + (byCode(c.code)?.price ?? 0) * c.qty, 0);
            const certOn = stockedKind && (nf.ccc || nf.mand);
            const item: Item = {
              id: code, code, name: nf.name.trim(), spec: nf.spec.trim(), ty: nf.ty, unit: nf.unit, cat: nf.cat,
              price: nf.ty === '服务' ? Math.round(laborSum + matSum) : nf.ty === '套件' ? Number(nf.sale) : Number(nf.price),
              status: '启用',
              stock: 0, hold: 0, safe: stockedKind ? Number(nf.safe || 0) : 0,
              ccc: stockedKind ? nf.ccc : false, mand: stockedKind ? nf.mand : false,
              certType: certOn ? nf.certType : undefined,
              certNo: certOn ? nf.certNo || undefined : undefined,
              certValidTo: certOn ? nf.certValidTo || '—' : undefined,
              certFiles: certOn ? 1 : undefined,
              batch: stockedKind ? nf.batch || undefined : undefined,
              notifyCh: certOn && nf.certValidTo ? nf.notifyCh : undefined,
              qualReq: nf.ty === '服务' ? nf.qualReq || undefined : undefined,
              labor: nf.ty === '服务' ? nfLabor : undefined,
              consumables: nf.ty === '服务' ? nfMats : undefined,
              sale: nf.ty === '套件' ? Number(nf.sale) : undefined,
              refs: nf.ty === '套件' ? 0 : undefined,
              owner: '王敏',
            };
            setItems((rs) => [...rs, item]);
            if (stockedKind) setWhStock((prev) => ({ ...prev, [code]: { [WH[0]]: 0, [WH[1]]: 0 } }));
            auditOnly('王敏', '主数据管理员', `新增主数据 ${code} · ${item.name}（类型 ${nf.ty}）`);
            setNewErr('');
            setNewOpen(false);
            setNf({ ty: '物料', name: '', spec: '', cat: '', unit: UNITS[0], price: '', safe: '', ccc: false, mand: false, certType: CERT_TYPES[0], certNo: '', certValidTo: '', batch: '', notifyCh: CHANNELS[0], qualReq: '', sale: '' });
            setNfLabor([{ trade: LABOR_RATES[0].trade, days: 1 }]);
            setNfMats([]);
            toast(`已新增 ${code} · ${item.name}（${nf.ty}）${nf.ty === '套件' ? '，请点行内「配置」补配置行' : ''}`);
          }}>保存</Btn>
        </>}>
        {newErr && <Alert icon={<Ico n="warning" size={16} />} tone="danger" title={newErr} />}
        {(() => {
          const stockKind = isStocked(nf.ty);
          const opts = catOptions(stockKind ? 'mat' : 'prod');
          const laborSum = nfLabor.reduce((s, l) => s + laborRate(l.trade) * l.days, 0);
          const matSum = nfMats.reduce((s, c) => s + (byCode(c.code)?.price ?? 0) * c.qty, 0);
          return <>
            <Field label="类型" req span={4} note={KIND_DESC[nf.ty]}>
              <div className="nc-seg">
                {ITEM_KINDS.map((k) => (
                  <button key={k} className={`nc-seg-btn${nf.ty === k ? ' is-on' : ''}`}
                    onClick={() => {
                      setNf((f) => ({ ...f, ty: k, cat: '', price: '', safe: '', sale: '', ccc: false, mand: false }));
                      setNfLabor([{ trade: LABOR_RATES[0].trade, days: 1 }]);
                      setNfMats([]);
                    }}>{k}</button>
                ))}
              </div>
            </Field>
            <div className="nc-form-grid">
              <Field label="名称" req><input className="nc-input" value={nf.name} onChange={(e) => setNf((f) => ({ ...f, name: e.target.value }))} placeholder="如 镀锌钢管" /></Field>
              <Field label="规格型号"><input className="nc-input" value={nf.spec} onChange={(e) => setNf((f) => ({ ...f, spec: e.target.value }))} placeholder="如 DN100" /></Field>
              <Field label="分类目录" req note={stockKind ? '物料目录（有库存）' : '服务与套件目录（服务 / 软件 / 套件，无实物库存）'}>
                <select className="nc-input" value={nf.cat} onChange={(e) => setNf((f) => ({ ...f, cat: e.target.value }))}>
                  <option value="">请选择…</option>
                  {opts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="单位" req note={UNIT_DESC[nf.unit]}>
                <select className="nc-input" value={nf.unit} onChange={(e) => setNf((f) => ({ ...f, unit: e.target.value }))}>
                  {UNITS.map((u) => <option key={u}>{u}</option>)}
                </select>
              </Field>
            </div>
            {stockKind && (
              <div className="nc-form-grid">
                <Field label="参考价（含税）" req><input className="nc-input" type="number" value={nf.price} onChange={(e) => setNf((f) => ({ ...f, price: e.target.value }))} placeholder="0.00" /></Field>
                <Field label="安全库存线" note="低于安全线即进入「库存预警」，可一键发起询价"><input className="nc-input" type="number" value={nf.safe} onChange={(e) => setNf((f) => ({ ...f, safe: e.target.value }))} placeholder="0" /></Field>
                <Field label="认证要求" span={2} note={nf.cat
                  ? `由所属目录派生：${catPath(nf.cat)} → ${certRuleCn(nf.cat)}${nf.mand ? '（已人工收紧至强制）' : ''}`
                  : '先选分类目录，认证要求自动派生'}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Tag tone={itemNeedCCC({ cat: nf.cat, mand: nf.mand }) ? 'orange' : 'gray'}>
                      {nf.cat ? certRuleCn(nf.cat) : '未选目录'}
                    </Tag>
                    {/* 目录只给要求基线；确属强制目录的型号可人工收紧（只能提高不能降低） */}
                    {certRuleOf(nf.cat) !== 'cccf' && (
                      <Check checked={nf.mand} onChange={(b) => setNf((f) => ({ ...f, mand: b }))} label="收紧为强制认证目录" />
                    )}
                    <Check checked={nf.ccc} onChange={(b) => setNf((f) => ({ ...f, ccc: b }))} label="已取得 CCCF 证书" />
                  </div>
                </Field>
              </div>
            )}
            {/* 目录已要求强制认证时，即使还没取证也要先登记证书字段（缺证会在台账与报价侧标红） */}
            {stockKind && (nf.ccc || itemNeedCCC({ cat: nf.cat, mand: nf.mand })) && (
              <div className="nc-form-grid">
                <Field label="证书类型" req note="物料级唯一配置，合规台账由它派生 → 台账徽标与证书类型永远一致">
                  <select className="nc-input" value={nf.certType} onChange={(e) => setNf((f) => ({ ...f, certType: e.target.value }))}>
                    {CERT_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="证书编号" req note="可从认证台账选择，或手工填写">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="nc-input" value={nf.certNo} onChange={(e) => setNf((f) => ({ ...f, certNo: e.target.value }))} placeholder="如 CCCF-2026-FH-001122" />
                    <PickSelect
                      value={nf.certNo}
                      onChange={(v) => setNf((f) => ({ ...f, certNo: v }))}
                      opts={certs.filter((c) => c.type.indexOf('CCCF') === 0).map((c) => ({ id: c.no, name: c.no, sub: c.mat, code: c.matCode }))}
                      placeholder="从认证台账选择…"
                      clearLabel="手填 / 清空选择"
                    />
                  </div>
                </Field>
                <Field label="有效期至" note="留空 = 长期有效，不显示也不派发到期通知"><input className="nc-input" type="date" value={nf.certValidTo} onChange={(e) => setNf((f) => ({ ...f, certValidTo: e.target.value }))} /></Field>
                <Field label="到期通知渠道" note="物料级配置；无有效期时不适用">
                  <select className="nc-input" value={nf.notifyCh} onChange={(e) => setNf((f) => ({ ...f, notifyCh: e.target.value }))} disabled={!nf.certValidTo}>
                    {CHANNELS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="关联批次" note="与库存批次账呼应；可从已有批次选择，或手工填写">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input className="nc-input" value={nf.batch} onChange={(e) => setNf((f) => ({ ...f, batch: e.target.value }))} placeholder="如 PC20260921-A" />
                    <PickSelect
                      value={nf.batch}
                      onChange={(v) => setNf((f) => ({ ...f, batch: v }))}
                      opts={items.map((m) => m.batch).filter((b): b is string => !!b).filter((v, i, a) => a.indexOf(v) === i).map((b) => ({ id: b, name: b, sub: '已有批次' }))}
                      placeholder="选择批次…"
                      clearLabel="手填 / 清空选择"
                    />
                  </div>
                </Field>
              </div>
            )}
            {nf.ty === '服务' && <>
              <Field label="资质要求" req span={2} note="服务不发产品证书，只维护资质要求；投标 / 派工时按此校验承包资质与人员持证">
                <input className="nc-input" value={nf.qualReq} onChange={(e) => setNf((f) => ({ ...f, qualReq: e.target.value }))} placeholder="如 消防设施维护保养一级资质" />
              </Field>
              <Field label="人工构成（工种 × 工日 × 单价）" req span={4} note="人工费只能来自工种单价主数据，禁止手工填数字">
                <table className="nc-tbl" style={{ minWidth: 520 }}>
                  <thead><tr><th>工种</th><th style={{ width: 110 }}>工日</th><th style={{width: 120}} className="is-num">单价</th><th style={{width: 110}} className="is-num">小计</th><th style={{ width: 60 }}>操作</th></tr></thead>
                  <tbody>
                    {nfLabor.map((l, i) => (
                      <tr key={i}>
                        <td>
                          <select className="nc-input" value={l.trade} onChange={(e) => setNfLabor((v) => v.map((x, j) => (j === i ? { ...x, trade: e.target.value } : x)))}>
                            {LABOR_RATES.map((r) => <option key={r.trade}>{r.trade}</option>)}
                          </select>
                        </td>
                        <td><input className="nc-input" type="number" value={l.days} onChange={(e) => setNfLabor((v) => v.map((x, j) => (j === i ? { ...x, days: Number(e.target.value) } : x)))} placeholder="0" /></td>
                        <td className="is-num num">{fmt(laborRate(l.trade))}</td>
                        <td className="is-num num">{fmt(laborRate(l.trade) * l.days)}</td>
                        <td>{nfLabor.length > 1 ? <Op danger onClick={() => setNfLabor((v) => v.filter((_, j) => j !== i))}>删除</Op> : <span className="nc-muted nc-tiny">—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="nc-addrow" onClick={() => setNfLabor((v) => [...v, { trade: LABOR_RATES[0].trade, days: 1 }])}>＋ 添加工种</button>
              </Field>
              <Field label="耗材行（可选 · 引用主数据）" span={4} note="服务可挂耗材，耗材同样只能从主数据中选">
                <table className="nc-tbl" style={{ minWidth: 520 }}>
                  <thead><tr><th>耗材</th><th style={{ width: 110 }}>数量</th><th style={{width: 110}} className="is-num">小计</th><th style={{ width: 60 }}>操作</th></tr></thead>
                  <tbody>
                    {nfMats.length === 0 && <tr><td colSpan={4} className="nc-muted nc-tiny">暂无耗材行（可留空，表示纯人工服务）</td></tr>}
                    {nfMats.map((c, i) => (
                      <tr key={i}>
                        <td>
                          <ItemPicker value={c.code} options={stocked} clearLabel="请选择…"
                            onChange={(v) => setNfMats((rows) => rows.map((x, j) => (j === i ? { ...x, code: v } : x)))} />
                        </td>
                        <td><input className="nc-input" type="number" value={c.qty} onChange={(e) => setNfMats((v) => v.map((x, j) => (j === i ? { ...x, qty: Number(e.target.value) } : x)))} placeholder="0" /></td>
                        <td className="is-num num">{fmt((byCode(c.code)?.price ?? 0) * c.qty)}</td>
                        <td><Op danger onClick={() => setNfMats((v) => v.filter((_, j) => j !== i))}>删除</Op></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="nc-addrow" onClick={() => setNfMats((v) => [...v, { code: stocked[0]?.code || '', qty: 1 }])}>＋ 添加耗材</button>
              </Field>
              <Field label="成本汇总（自动）" span={4}>
                <KvGrid cols={3} rows={[
                  { k: '人工小计', v: <b className="num">{fmt(laborSum)}</b> },
                  { k: '耗材小计', v: <b className="num">{fmt(matSum)}</b> },
                  { k: '参考价（自动带出）', v: <b className="num nc-v-green">{fmt(laborSum + matSum)}</b> },
                ]} />
              </Field>
            </>}
            {nf.ty === '套件' && <>
              <div className="nc-form-grid">
                <Field label="对外价" req note="套件成本由配置行自动合计（材料小计 + 人工小计），此处只定对外价">
                  <input className="nc-input" type="number" value={nf.sale} onChange={(e) => setNf((f) => ({ ...f, sale: e.target.value }))} placeholder="0.00" />
                </Field>
              </div>
              <div className="nc-warnbox is-info">
                <b>下一步</b>
                <div>套件保存后点行内「配置」维护配置行（引用物料 / 服务 / 软件 / 子套件），成本与毛利率会实时计算，负毛利会给「调价」动作。</div>
              </div>
            </>}
            {nf.ty === '软件' && (
              <div className="nc-form-grid">
                <Field label="参考价（订阅费 / 许可费）" req note="软件无实物库存与强制认证；成本 = 参考价（6% 现代服务口径直接取价，不做价税分离）">
                  <input className="nc-input" type="number" value={nf.price} onChange={(e) => setNf((f) => ({ ...f, price: e.target.value }))} placeholder="0.00" />
                </Field>
              </div>
            )}
          </>;
        })()}
      </Drawer>

      {/* ==================== 身份标识验真（页面级抽屉） ====================
          验真是「对着一件实物问真伪」，不属于任何业务域，与操作日志同层；
          型号明细里点某批号段的「验真」会把该号段首码带进来。 */}
      <IdMarkVerify open={verifyOpen} initMark={verifyMark} onClose={() => setVerifyOpen(false)} />

      {/* ==================== 厂家号段推送 · 驳回原因 ==================== */}
      <Modal open={!!pushRj} title={`驳回厂家推送 · ${pushRj || ''}`} width={480}
        onClose={() => setPushRj(null)}
        foot={<>
          <Btn onClick={() => setPushRj(null)}>取消</Btn>
          <Btn kind="primary" disabled={!pushWhy.trim()} onClick={() => {
            if (pushRj) pushReject(pushRj, pushWhy);
            toast('已驳回，原因同步至厂家侧', 'ok');
            setPushRj(null);
          }}>确认驳回</Btn>
        </>}>
        <div className="nc-form-grid">
          <Field label="驳回原因" req span={4} note="退回厂家侧并要求重新核发号段；不写明原因无法追溯是哪一批实物不合格">
            <input className="nc-input" autoFocus value={pushWhy} onChange={(e) => setPushWhy(e.target.value)}
              placeholder="如 到货抽检铭牌印刷与备案号段不符，整批退回" />
          </Field>
        </div>
      </Modal>

      {/* ============ 统一导出弹窗（各 Tab 一个，由 open 控制） ============ */}
      <ExportDialog {...listExport.dialogProps} />
      <ExportDialog {...stockExport.dialogProps} />
      <ExportDialog {...flowExport.dialogProps} />
      <ExportDialog {...rfqExport.dialogProps} />
      <ExportDialog {...plibExport.dialogProps} />
      <ExportDialog {...certExport.dialogProps} />
    </>
  );
}