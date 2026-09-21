// 诺安云 6.0 · 物料与服务（供应链管理）
// ------------------------------------------------------------------
// 统一主数据：材料 / 设备 / 服务 / 套件 四类同表（ITEMS），用「类型」字段区分。
//   · 服务与套件共享同一套「配方 / 成本构成」编辑器；
//   · 配方行只能引用主数据（材料 / 设备 / 服务 / 子套件），人工费只能来自工种单价主数据；
//   · 台账徽标、合规证书、价格库、批次账全部由同一份主数据派生，杜绝两页说法不一。
// 四个工作域（顶部指标卡即域切换器）：
//   主数据（物料与服务 / 配方与成本）· 库存作业（库存与领用 / 作业流水）
//   采购寻源（询比价 / 材料价格库）· 合规资质（认证与报告 / 服务资质 / 操作日志）
// 链路闭环：库存预警 → 发起询价（带物料与缺口）→ 比价选定 → 生成采购订单 → 入库回写订单。
import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  Alert, Banner, Btn, Card, Check, DataTable, Drawer, EntityLink, Field, KvGrid, ListToolbar, Modal,
  Op, OpSep, PageHead, TableFoot, Tag, Tabs, Tile, Tip, useToast, type Col, type TagTone, pressProps,
} from '../components/ui';
import CategoryTree from '../components/CategoryTree';
import {
  CAT_TREE, CERT_CHANNELS as CHANNELS, CERT_ROWS as CERT_SEED, CERT_TYPES, HOLD_RATE, ITEMS, ITEM_KINDS,
  LABOR_RATES, LOCATIONS as LOC, MAIN_WH, MAT_AUDIT_ROWS as AUDIT_SEED, PRICE_LIB, PROJ_WH, RECIPES,
  RFQ_ROWS as RFQ_SEED, RFQ_TONE, SUPPLIERS, TODAY, UNITS, UNIT_DESC, WAREHOUSES as WH, WH_STOCK_SEED,
  catOptions, catPath, catSubtreeIds, catVersion, daysLeft, fmt, fmtWan, inheritsMand, isStocked, itemBatches,
  laborRate, matPriceTrend, matSupQuotes, opNo, poNo, priceHistory, recipeCost, serviceCost, suggestSale,
  subscribeCats,
  FLOW_ROWS as FLOW_SEED, FLOW_TONE,
  type CertRow, type ConsumableLine, type FlowRow, type Item, type ItemKind, type LaborLine, type MatAuditRow,
  type RecipeLine, type RfqRow,
} from '../components/data';
import { Ico } from '../components/icons';
import { getFocus } from '../components/store';

/* ============ 类型色板 ============ */
const KIND_TONE: Record<ItemKind, TagTone> = { 材料: 'gray', 设备: 'blue', 服务: 'purple', 套件: 'gold' };
const KIND_DESC: Record<ItemKind, string> = {
  材料: '纯物料 · 有库存（仓库分账 + 安全线）· 成本 = 采购价',
  设备: '消防设备 · 有库存 · 需 CCCF / 型式检验 · 成本 = 采购价',
  服务: '无实物库存 · 成本 = 人工构成（工种 × 工日 × 单价）+ 可挂耗材行',
  套件: '成套交付 · 成本 = 配方行（引用主数据，可嵌子套件）自动合计',
};
/** 配方行可选类型（套件配方 = 材料 / 设备 / 服务行混合，可嵌子套件） */
const LINE_KINDS: ItemKind[] = ['材料', '设备', '服务', '套件'];

type EditLine = { kind: ItemKind; code: string; qty: number; loss: number; locked?: number };

export default function MaterialPage({ go, role }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  /* 分类树同源订阅：树上新增 / 重命名 / 删除后，面包屑「当前分类」、分类目录列与表单下拉即时刷新 */
  useSyncExternalStore(subscribeCats, catVersion, catVersion);

  /**
   * 主数据写入权限（与页面上「权限说明」同源，不再是空话）：
   * 主数据 / 配方 / 调价属于口径与成本动作，仅 总经理 / 分管副总 / 项目经理 / 超级管理员 可写。
   * 无权时不静默失效，而是明确告知缺少哪个角色 —— 原型可切换角色演示。
   */
  const WRITE_ROLES = ['boss', 'deputy', 'pm', 'sysadmin'];
  const canWrite = WRITE_ROLES.includes(role);
  const guardWrite = (fn: () => void) => () => {
    if (canWrite) { fn(); return; }
    toast(`当前角色（${role}）无主数据写入权限 · 需 项目经理 / 分管副总 / 总经理 / 超级管理员`, 'err');
  };

  /* ============ 可写主数据（原型级会话副本，数据层 ITEMS / RECIPES 为基线） ============ */
  const [items, setItems] = useState<Item[]>(() => ITEMS.map((i) => ({ ...i })));
  const [recipes, setRecipes] = useState(() => JSON.parse(JSON.stringify(RECIPES)) as typeof RECIPES);
  const byCode = (code: string) => items.find((x) => x.code === code);
  const costOf = (code: string, ver?: string) => recipeCost(code, ver, { items, recipes });
  const svcCostOf = (code: string) => serviceCost(code, items);
  /** 服务参考单价 == 人工 + 耗材（不手填，改配方即同步） */
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

  /* ============ 详情 / 配方编辑器 ============ */
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
    ty: '材料' as ItemKind, name: '', spec: '', cat: '', unit: UNITS[0], price: '', safe: '',
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
  const [batchFor, setBatchFor] = useState<string | null>(null);
  const [whStock, setWhStock] = useState<Record<string, Record<string, number>>>(WH_STOCK_SEED);
  const [flow, setFlow] = useState<FlowRow[]>(FLOW_SEED);
  const [audit, setAudit] = useState<MatAuditRow[]>(AUDIT_SEED);

  const resetOpForm = () => { setInErr(''); setInQty(''); setInBatch(''); setInPrice(''); setInPo(''); };
  const whOf = (code: string) => whStock[code] || {};
  /** 当前仓库视图口径下的库存：全部 = 总账，否则 = 该仓实存 */
  const scopeStock = (code: string, total: number) => (whView === '全部' ? total : (whOf(code)[whView] || 0));

  /** 有库存的主数据（材料 / 设备）—— 库存作业域自动只出现这两类，不靠人工维护 */
  const stocked = useMemo(() => items.filter((i) => isStocked(i.ty)), [items]);
  /** 可用 = 结余 − 预占（逐行可验算） */
  const availOf = (it: Item) => Math.max(0, (whView === '全部' ? it.stock : (whOf(it.code)[whView] || 0)) - Math.round(it.hold * (whView === '全部' ? 1 : (whOf(it.code)[whView] || 0) / Math.max(1, it.stock))));
  const lowItems = useMemo(() => items.filter((i) => isStocked(i.ty) && i.stock < i.safe), [items]);
  const gapOf = (it: Item) => Math.max(1, it.safe - it.stock);

  /**
   * 作业提交（入库 / 领用 / 退料 / 盘点 / 调拨）：一次写四处，保证同源。
   * ① 仓库分账 ② 总账（由分账派生）③ 作业流水 ④ 操作日志
   */
  const commitOp = (o: {
    type: '入库' | '领用' | '退料' | '盘点' | '调拨';
    code: string; wh: string; toWh?: string; qty: number; by: string; msg: string; act: string;
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
    setItems((rs) => rs.map((x) => (x.code === o.code ? { ...x, stock: total } : x)));
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
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); setGSearch(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* 默认作业物料：第一件有库存的主数据 */
  useEffect(() => { if (!inCode && stocked.length) setInCode(stocked[0].code); }, [inCode, stocked]);
  useEffect(() => { if (!cuMat && stocked.length) setCuMat(stocked[0].code); }, [cuMat, stocked]);

  /** 外部下钻：EntityLink target="material" → 打开该物料详情 */
  useEffect(() => {
    const code = getFocus('material');
    if (!code) return;
    const hit = ITEMS.find((x) => x.code === code);
    if (!hit) return;
    setDomain('master'); setTab('list'); setTyF('全部'); setCatTree(''); setPage(1);
    setDetail(hit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getFocus('material')]);

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
      || (certF === '强制' ? m.mand
        : certF === 'CCCF' ? m.ccc
          : certF === '继承' ? (!isStocked(m.ty) && inheritsMand(m.code)) : true))
    && (!kw || m.name.includes(kw) || m.code.includes(kw) || m.spec.includes(kw))), [base, stF, certF, kw]);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  /* 分类树计数：只给「精确挂在分类上」的条目数，子树汇总由 CategoryTree 内部完成 */
  const catCountExact = (id: string) => items.filter((r) => r.cat === id).length;
  const catUsed = useMemo(() => items.map((r) => r.cat).filter(Boolean), [items]);

  /* ============ 工作域与 Tab（徽标一律为「行数」语义） ============ */
  const openRfq = rfqs.filter((r) => r.status === '询价中' || r.status === '已报价').length;
  const expSoon = certs.filter((c) => { const d = daysLeft(c.validTo); return d !== Infinity && d <= 30; }).length;
  const recipeItems = items.filter((i) => i.ty === '服务' || i.ty === '套件');

  const DOMAIN_TABS: Record<typeof domain, { key: string; label: string; cnt: number }[]> = {
    master: [
      { key: 'list', label: '物料与服务', cnt: items.length },
      { key: 'recipe', label: '配方与成本', cnt: recipeItems.length },
    ],
    wh: [
      { key: 'stock', label: '库存与领用', cnt: stocked.length },
      { key: 'flow', label: '作业流水', cnt: flow.length },
    ],
    src: [
      { key: 'rfq', label: '询比价', cnt: rfqs.length },
      { key: 'plib', label: '材料价格库', cnt: PRICE_LIB.length },
    ],
    cmp: [
      { key: 'cert', label: '认证与报告', cnt: certs.length },
      { key: 'qual', label: '服务资质', cnt: recipeItems.filter((i) => i.ty === '服务').length },
      { key: 'audit', label: '操作日志', cnt: audit.length },
    ],
  };

  /* 顶部指标卡即域切换器：每张卡的「标题 = 口径」，杜绝标题与内容错位 */
  const DOMAINS: { key: typeof domain; label: string; value: React.ReactNode; sub: string; tone?: 'red' | 'orange' | 'green' | 'blue'; tip: string }[] = [
    {
      key: 'master', label: '物料与服务', value: items.length, tone: 'blue',
      sub: `材料 ${items.filter((i) => i.ty === '材料').length} · 设备 ${items.filter((i) => i.ty === '设备').length} · 服务 ${items.filter((i) => i.ty === '服务').length} · 套件 ${items.filter((i) => i.ty === '套件').length}`,
      tip: `统一主数据条目总数（材料 / 设备 / 服务 / 套件同表）· 写入权限：项目经理 / 分管副总 / 总经理 / 超级管理员（当前 ${role}${canWrite ? ' · 可写' : ' · 只读'}）`,
    },
    {
      key: 'wh', label: '库存预警', value: lowItems.length, tone: 'red',
      sub: lowItems.length ? lowItems.map((i) => i.name).slice(0, 2).join(' · ') : '库存充足',
      tip: '结余低于安全线的物料条数（只统计材料 / 设备，服务与套件不建库存账）',
    },
    {
      key: 'src', label: '待处理寻源', value: openRfq, tone: 'orange',
      sub: `询价中 ${rfqs.filter((r) => r.status === '询价中').length} · 已报价 ${rfqs.filter((r) => r.status === '已报价').length}`,
      tip: '进行中的询比价单数（询价中 + 已报价）',
    },
    {
      key: 'cmp', label: '合规证书', value: certs.length, tone: 'green',
      sub: expSoon ? `${expSoon} 项 30 天内到期` : '均在有效期内',
      tip: '证书台账条数（由主数据的证书属性派生，另有服务资质要求不占证书位）',
    },
  ];

  const enterDomain = (d: typeof domain) => {
    setDomain(d);
    setTab(DOMAIN_TABS[d][0].key);
    setCatTree(''); setPage(1);
  };

  /* ============ 配方编辑器 ============ */
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

  /** 保存配方：服务就地更新；套件已被引用则升版（旧版快照保留） */
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
      toast(`${it.name} 成本构成已保存 · 参考单价按人工 + 耗材自动同步为 ${fmt(draftCost?.total ?? 0)}`);
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
        toast(`配方已升版至 ${nv}（被报价引用 ${cur.refs} 次，旧版快照保留）`);
      } else {
        cur.lines = lines;
        toast(`配方已就地更新（未被报价引用，不产生新版本）`);
      }
      return next;
    });
    if (draftSale !== it.sale) setItems((rs) => rs.map((x) => (x.code === recipeFor ? { ...x, sale: draftSale, price: draftSale } : x)));
    auditOnly(it.owner, '主数据管理员', `配方调整 · ${it.name}（${draftLines.length} 行）`);
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
      key: 'code', title: '编码', width: 104, sticky: 'left',
      render: (m) => <span className="num nc-id-cell nc-link" onClick={() => setDetail(m)} {...pressProps(() => setDetail(m))}>{m.code}</span>,
    },
    {
      key: 'name', title: '名称 / 规格', render: (m) => (
        <div>
          <div>
            {m.name}
            {m.ccc && <Tag tone="red">CCCF</Tag>}
            {m.mand && <Tag tone="orange">强制</Tag>}
            {!isStocked(m.ty) && inheritsMand(m.code) && <Tag tone="orange">强制（继承）</Tag>}
          </div>
          <div className="nc-tiny nc-muted">规格型号：{m.spec}</div>
        </div>
      ),
    },
    { key: 'ty', title: '类型', width: 84, render: (m) => <Tag tone={KIND_TONE[m.ty]}>{m.ty}</Tag> },
    { key: 'cat', title: '分类目录', width: 140, render: (m) => <span className="nc-tiny" title={catPath(m.cat)}>{catPath(m.cat)}</span> },
    { key: 'unit', title: '单位', width: 62, align: 'center', render: (m) => <b>{m.unit}</b> },
    { key: 'price', title: '参考单价', width: 96, align: 'right', render: (m) => <b className="num">{fmt(m.price)}</b> },
    {
      key: 'stock', title: '库存概要', width: 176, render: (m) => {
        if (!isStocked(m.ty)) return <span className="nc-muted nc-tiny">—（{m.ty}不持实物库存）</span>;
        const low = m.stock < m.safe;
        const b = scopeStock(m.code, m.stock);
        const avail = Math.max(0, b - Math.round(m.hold * (whView === '全部' ? 1 : b / Math.max(1, m.stock))));
        return (
          <span className={low ? 'nc-v-red' : ''}>
            <b className="num">{m.stock}</b><span className="nc-muted"> / 安全线 {m.safe}</span>
            <div className="nc-tiny nc-muted">可用 {avail} = 结余 {b} − 预占 {b - avail}</div>
            {low && <Tag tone="red">需补货</Tag>}
          </span>
        );
      },
    },
    {
      key: 'cost', title: '成本构成', width: 176, render: (m) => {
        if (m.ty === '服务') { const c = svcCostOf(m.code); return <span className="nc-tiny">人工 {fmt(c.labor)}{c.mat > 0 ? ` + 耗材 ${fmt(c.mat)}` : ''} <Tag tone="purple">按工种</Tag></span>; }
        if (m.ty === '套件') {
          const c = costOf(m.code);
          return <span className="nc-tiny">成本 <b className="num">{fmt(c.total)}</b> · 毛利 <b className={c.gross < 20 ? 'nc-v-red' : 'nc-v-green'}>{c.gross.toFixed(1)}%</b></span>;
        }
        return <span className="nc-muted nc-tiny">采购价口径</span>;
      },
    },
    { key: 'status', title: '状态', width: 78, render: (m) => <Tag tone={m.status === '启用' ? 'green' : 'gray'} pill>{m.status}</Tag> },
    {
      key: 'op', title: '操作', width: 176, sticky: 'right', render: (m) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Op onClick={() => setDetail(m)}>详情</Op>
          <OpSep />
          {!isStocked(m.ty)
            ? <Op gold onClick={() => openRecipe(m.code)}>配方</Op>
            : <Op onClick={() => openRecipe(m.code)}>成本构成</Op>}
          <OpSep />
          <Op onClick={guardWrite(() => {
            const pfx = m.ty === '材料' ? 'CL' : m.ty === '设备' ? 'EQ' : m.ty === '服务' ? 'SV' : 'CP';
            const n = Math.max(...items.map((r) => Number(r.code.replace(/\D/g, ''))), 0) + 1;
            const clone: Item = { ...m, id: pfx + String(n).padStart(6, '0'), code: pfx + String(n).padStart(6, '0'), name: `${m.name}（副本）`, stock: 0, hold: 0 };
            setItems((rs) => [...rs, clone]);
            auditOnly(m.owner, '主数据管理员', `复制主数据 ${m.code} → ${clone.code}（待提交变更审批）`);
            toast(`已复制为 ${clone.code} · ${clone.name}`);
          })}>复制</Op>
        </span>
      ),
    },
  ];

  /* ============ 配方与成本 列表列 ============ */
  const recipeCols: Col<Item>[] = [
    { key: 'code', title: '编码', width: 104, render: (m) => <span className="num nc-id-cell">{m.code}</span> },
    { key: 'name', title: '名称 / 规格', render: (m) => <><b>{m.name}</b><div className="nc-tiny nc-muted">{m.spec}</div></> },
    { key: 'ty', title: '类型', width: 84, render: (m) => <Tag tone={KIND_TONE[m.ty]}>{m.ty}</Tag> },
    {
      key: 'lines', title: '构成', width: 150,
      render: (m) => (m.ty === '服务'
        ? <span className="nc-tiny">人工 {m.labor?.length ?? 0} 行{(m.consumables?.length ?? 0) > 0 ? ` · 耗材 ${m.consumables!.length} 行` : ''}</span>
        : <span className="nc-tiny">配方 {recipes[m.code]?.versions.find((v) => v.v === recipes[m.code].cur)?.lines.length ?? 0} 行 · 版本 {recipes[m.code]?.cur ?? '—'}</span>),
    },
    {
      key: 'mat', title: '材料小计', width: 100, align: 'right',
      render: (m) => <span className="num">{fmt(m.ty === '服务' ? svcCostOf(m.code).mat : costOf(m.code).mat)}</span>,
    },
    {
      key: 'labor', title: '人工小计', width: 100, align: 'right',
      render: (m) => <span className="num">{fmt(m.ty === '服务' ? svcCostOf(m.code).labor : costOf(m.code).labor)}</span>,
    },
    {
      key: 'total', title: '成本', width: 104, align: 'right',
      render: (m) => <b className="num">{fmt(m.ty === '服务' ? svcCostOf(m.code).total : costOf(m.code).total)}</b>,
    },
    {
      key: 'sale', title: '对外价', width: 100, align: 'right',
      render: (m) => (m.ty === '服务' ? <span className="num nc-muted">—（按工日计价）</span> : <span className="num">{fmt(m.sale || 0)}</span>),
    },
    {
      key: 'gross', title: '毛利率', width: 96, align: 'right',
      render: (m) => {
        if (m.ty === '服务') return <span className="nc-muted nc-tiny">—</span>;
        const c = costOf(m.code);
        return <span className={`num${c.gross < 20 ? ' nc-v-red' : ' nc-v-green'}`}>{c.gross.toFixed(1)}%</span>;
      },
    },
    {
      key: 'chk', title: '预检', width: 110,
      render: (m) => {
        const c = m.ty === '服务' ? null : costOf(m.code);
        if (!c) return <Tag tone="gray">不校验库存</Tag>;
        return c.short > 0 ? <Tag tone="red">缺料 {c.short} 项</Tag> : <Tag tone="green">可配齐</Tag>;
      },
    },
    {
      key: 'op', title: '操作', width: 150, render: (m) => (
        <>
          <Op gold onClick={() => openRecipe(m.code)}>编辑配方</Op>
          {m.ty === '套件' && costOf(m.code).gross < 20 && <><OpSep /><Op onClick={guardWrite(() => { setPriceOpen(m.code); setPriceVal(String(suggestSale(costOf(m.code).total))); })}>调价</Op></>}
        </>
      ),
    },
  ];

  return (
    <>
      <PageHead
        crumbs={['供应链管理', '物料与服务']}
        title="物料与服务"
        badges={<>
          <Tag tone="blue">材料 {items.filter((i) => i.ty === '材料').length}</Tag>
          <Tag tone="blue">设备 {items.filter((i) => i.ty === '设备').length}</Tag>
          <Tag tone="purple">服务 {items.filter((i) => i.ty === '服务').length}</Tag>
          <Tag tone="gold">套件 {items.filter((i) => i.ty === '套件').length}</Tag>
          <Tag tone="red">库存预警 {lowItems.length}</Tag>
        </>}
        actions={<>
          <Btn onClick={() => setGSearch(true)} title="本页检索 Ctrl+K"><Ico n="search" size={16} /> 搜索 Ctrl+K</Btn>
          <Btn onClick={() => { setDomain('cmp'); setTab('audit'); setPage(1); }} title="操作日志（关键操作审计）"><Ico n="clipboard" size={16} /> 日志</Btn>
          <Btn onClick={() => go('settings')} title="分类 / 单位 / 认证标记 / 人工工种单价等公共基线维护"><Ico n="gear" size={16} /> 系统设置</Btn>
          <Btn onClick={() => setImportOpen(true)}>批量导入</Btn>
          <Btn kind="primary" onClick={() => { setNewErr(''); setNewOpen(true); }}>＋ 新增主数据</Btn>
        </>}
      />

      {/* 域切换器：卡标题 = 口径，卡数值 = 该口径下的行数 */}
      <div className="nc-tiles nc-tiles-4">
        {DOMAINS.map((d) => (
          <Tile key={d.key} label={d.label} value={d.value} sub={d.sub} tone={d.tone} tip={d.tip}
            active={domain === d.key} onClick={() => enterDomain(d.key)} />
        ))}
      </div>

      <Card flush>
        <div style={{ padding: '12px 16px 0' }}>
          <Tabs value={tab} onChange={(k) => { setTab(k); setPage(1); }} items={DOMAIN_TABS[domain]} />
        </div>

        {/* ==================== 主数据 · 统一列表 ==================== */}
        {tab === 'list' && (
          <div className="nc-doc-layout">
            <aside className="nc-doc-side">
              <CategoryTree
                value={catTree}
                onChange={(id) => { setCatTree(id); setPage(1); }}
                countOf={catCountExact}
                usedIds={catUsed}
              />
              <div className="nc-doc-side-foot">
                <button className="nc-dir-item" onClick={() => go('settings')}>
                  <span>分类 / 单位 / 标记维护</span><span className="nc-tiny">→</span>
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
                      { key: '强制', label: '强制认证', cnt: cntBy((m) => m.mand) },
                      { key: 'CCCF', label: 'CCCF', cnt: cntBy((m) => m.ccc) },
                      { key: '继承', label: '套件继承', cnt: cntBy((m) => !isStocked(m.ty) && inheritsMand(m.code)) },
                    ],
                  },
                ]}
                right={<>
                  <div className="nc-search" style={{ width: 220 }}>
                    <svg className="nc-search-ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                    <input value={kw} onChange={(e) => { setKw(e.target.value); setPage(1); }} placeholder="编码 / 名称 / 规格型号" />
                  </div>
                  <Btn size="sm" onClick={() => { setStF('全部'); setCertF('全部'); setTyF('全部'); setKw(''); setCatTree(''); setPage(1); }}>重置</Btn>
                </>}
              >
                <span className="nc-muted nc-tiny" style={{ marginLeft: 'auto' }}>
                  当前分类：<b>{catTree ? catPath(catTree) : '全部分类'}</b> · {filtered.length} 条
                </span>
              </ListToolbar>
              <DataTable cols={cols} rows={paged} rowKey={(m) => m.id} minWidth={1400}
                onRowClick={(m) => (!isStocked(m.ty) ? openRecipe(m.code) : setDetail(m))}
                empty="没有符合筛选条件的条目；材料 / 设备需库存，服务 / 套件需配方，均可在此新建"
                emptyCta={<Btn size="sm" kind="primary" onClick={() => setNewOpen(true)}>＋ 新增主数据</Btn>}
                foot={<TableFoot total={base.length} filtered={filtered.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />} />
              </Card>
            </div>
          </div>
        )}

        {/* ==================== 主数据 · 配方与成本 ==================== */}
        {tab === 'recipe' && (
          <div style={{ padding: 16 }}>
            <Banner tone="info">
              服务与套件共用同一套<b>成本构成</b>：配方行只能引用主数据，<b>人工费只能来自「工种 × 工日 × 单价」主数据</b>（如 综合工日-电工 ¥300/工日），
              不允许手工填数字；套件成本 = 材料小计 + 人工小计，由引用自动合计。
            </Banner>
            <div className="nc-tiny nc-muted" style={{ margin: '10px 0 8px' }}>
              共 {recipeItems.length} 条需维护成本（服务 {recipeItems.filter((i) => i.ty === '服务').length} · 套件 {recipeItems.filter((i) => i.ty === '套件').length}）· 毛利率低于 20% 标红并提供「调价」（按目标毛利率反算对外价）。
            </div>
            <DataTable minWidth={1240} rows={recipeItems} rowKey={(m) => m.code} cols={recipeCols}
              rowClass={(m) => (m.ty === '套件' && costOf(m.code).gross < 20 ? 'is-danger-row' : '')}
              empty="暂无服务 / 套件；新增主数据时选择「服务」或「套件」类型即可在此维护成本构成" />
          </div>
        )}

        {/* ==================== 库存作业 · 库存与领用 ==================== */}
        {tab === 'stock' && (
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <Btn size="sm" onClick={() => { resetOpForm(); setOpIn(true); }}>＋ 入库</Btn>
              <Btn size="sm" onClick={() => { resetOpForm(); setOpOut(true); }}>＋ 领用</Btn>
              <Btn size="sm" onClick={() => { resetOpForm(); setOpBack(true); }}>↩ 退料</Btn>
              <Btn size="sm" onClick={() => { resetOpForm(); setOpCheck(true); }}><Ico n="clipboard" size={16} /> 盘点</Btn>
              <Btn size="sm" onClick={() => { resetOpForm(); setOpMove(true); }}><Ico n="swap" size={16} /> 调拨</Btn>
              <Btn size="sm" onClick={() => startRfq(lowItems.map((i) => ({ code: i.code, qty: String(gapOf(i)) })), '库存补齐')}>
                <Ico n="search" size={16} /> 一键补齐询价（{lowItems.length}）
              </Btn>
              <span style={{ marginLeft: 'auto' }} className="nc-cell-sub">
                可用 = 结余 − 预占<Tip text="成本口径：入库计入项目成本、出库不影响（防重复），退料回冲；盘点差异生成调整单；低于安全线即进入「库存预警」，可一键带物料与缺口数量发起询价。服务与套件不建库存账。" />
              </span>
              <select className="nc-input" style={{ width: 150 }} value={whView} onChange={(e) => setWhView(e.target.value)}>
                <option value="全部">视图：全部仓库</option>
                {WH.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <DataTable
              minWidth={1300}
              rows={[...stocked].sort((a, b) => (a.stock - a.safe) - (b.stock - b.safe))}
              rowKey={(m) => m.id}
              rowClass={(m) => (m.stock - m.safe < 0 ? 'is-danger-row' : '')}
              onRowClick={(m) => setDetail(m)}
              empty="当前没有有库存的主数据（材料 / 设备）；服务与套件不建库存账"
              cols={[
                { key: 'code', title: '编码', width: 100, sticky: 'left', render: (m) => <span className="num">{m.code}</span> },
                { key: 'name', title: '名称 / 规格', render: (m) => <>{m.name} <span className="nc-tiny nc-muted">{m.spec}</span></> },
                { key: 'ty', title: '类型', width: 74, render: (m) => <Tag tone={KIND_TONE[m.ty]}>{m.ty}</Tag> },
                { key: 'unit', title: '单位', width: 60, align: 'center', render: (m) => m.unit },
                { key: 'mainWh', title: '主仓库', width: 92, align: 'right', render: (m) => <span className="num" style={{ background: whView === MAIN_WH ? 'rgba(24,144,255,0.06)' : undefined }}>{whView === PROJ_WH ? '—' : (whOf(m.code)[MAIN_WH] || 0)}</span> },
                { key: 'projWh', title: '项目临时仓', width: 108, align: 'right', render: (m) => <span className="num" style={{ background: whView === PROJ_WH ? 'rgba(24,144,255,0.06)' : undefined }}>{whView === MAIN_WH ? '—' : (whOf(m.code)[PROJ_WH] || 0)}</span> },
                { key: 'stock', title: '结余', width: 88, align: 'right', render: (m) => <b className="num">{m.stock}</b> },
                { key: 'hold', title: '预占', width: 88, align: 'right', render: (m) => <span className="num nc-muted">{Math.round(scopeStock(m.code, m.stock) * HOLD_RATE) || m.hold}</span> },
                { key: 'avail', title: '可用', width: 88, align: 'right', render: (m) => <b className="num">{availOf(m)}</b> },
                { key: 'safe', title: '安全线', width: 88, align: 'right', render: (m) => <span className="num">{m.safe}</span> },
                { key: 'st', title: '状态', width: 88, render: (m) => (m.stock - m.safe < 0 ? <Tag tone="red">需补货</Tag> : <Tag tone="green">充足</Tag>) },
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
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <span className="nc-tiny nc-muted">时间 / 类型 / 单号 / 物料 / 数量 / 仓库·项目 / 经办 · 入库计入项目成本、出库不影响（防重复）</span>
              <div style={{ marginLeft: 'auto' }}><Btn size="sm" onClick={() => toast('作业流水已导出（CSV）')}><Ico n="download" size={16} /> 导出</Btn></div>
            </div>
            <DataTable
              minWidth={1000}
              rows={flow.filter((f) => whView === '全部' || f.wh.includes(whView))}
              rowKey={(f) => f.no}
              empty="当前仓库视图下没有作业流水；入库 / 领用 / 调拨 / 盘点后自动生成"
              cols={[
                { key: 't', title: '时间', width: 140, render: (f) => <span className="num nc-tiny">{f.t}</span> },
                { key: 'type', title: '类型', width: 80, render: (f) => <Tag tone={(FLOW_TONE[f.type] || 'gray') as TagTone}>{f.type}</Tag> },
                { key: 'no', title: '单号', width: 130, render: (f) => <span className="num">{f.no}</span> },
                { key: 'mat', title: '物料', render: (f) => f.mat },
                { key: 'qty', title: '数量', width: 130, align: 'right', render: (f) => <span className="num">{f.qty}</span> },
                { key: 'wh', title: '仓库 / 项目', width: 220, render: (f) => <span className="nc-tiny">{f.wh}</span> },
                { key: 'by', title: '经办', width: 80, render: (f) => f.by },
              ]}
            />
          </div>
        )}

        {/* ==================== 采购寻源 · 询比价 ==================== */}
        {tab === 'rfq' && (
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', marginBottom: 12, alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span className="nc-cell-sub">询比价<Tip text="状态机：询价中 → 已报价 → 已选定 → 已关闭；已选定后可生成采购订单，入库时回写订单状态，与库存闭环。" /></span>
              <Check checked={demo} onChange={setDemo} label="演示模式（显示「模拟报价」）" />
              <div style={{ marginLeft: 'auto' }}><Btn size="sm" kind="primary" onClick={() => startRfq([{ code: '', qty: '' }], '手工发起')}>＋ 发起询价</Btn></div>
            </div>
            <DataTable
              minWidth={1240}
              rows={rfqs}
              rowKey={(r) => r.id}
              empty="暂无询比价单；可从库存「需补货」行一键发起，或点击「＋ 发起询价」"
              cols={[
                { key: 'id', title: '询价单号', width: 130, render: (r) => <span className="num">{r.id}</span> },
                { key: 'from', title: '来源', width: 90, render: (r) => <Tag tone={r.from === '库存补齐' ? 'orange' : 'gray'}>{r.from || '手工发起'}</Tag> },
                { key: 'mats', title: '物料 / 服务（数量）', render: (r) => <span className="nc-tiny">{r.mats.map((m) => `${m.name} ×${m.qty}${m.unit}`).join('；')}</span> },
                { key: 'needDate', title: '需求日期', width: 100, render: (r) => <span className="num nc-tiny">{r.needDate}</span> },
                { key: 'deadline', title: '报价截止', width: 130, render: (r) => <span className="num nc-tiny">{r.deadline}</span> },
                {
                  key: 'invited', title: '邀约供应商', width: 200,
                  render: (r) => <span className="nc-tiny">{r.invited.map((id, i) => <React.Fragment key={id}>{i > 0 ? '、' : ''}<EntityLink target="supplier" id={id} go={go} title="下钻到供应商档案">{supName(id)}</EntityLink></React.Fragment>)}</span>,
                },
                { key: 'status', title: '状态', width: 90, render: (r) => <Tag tone={(RFQ_TONE[r.status] || 'gray') as TagTone}>{r.status}</Tag> },
                {
                  key: 'po', title: '采购订单', width: 140,
                  render: (r) => (r.po
                    ? <span className="nc-tiny num">{r.po.no}<div className="nc-tiny nc-muted">{r.po.status}</div></span>
                    : <span className="nc-muted nc-tiny">—</span>),
                },
                {
                  key: 'op', title: '操作', width: 240, sticky: 'right', render: (r) => (
                    <span onClick={(e) => e.stopPropagation()}>
                      <Op onClick={() => setMatrix(r)}>比价矩阵</Op><OpSep />
                      <Op onClick={() => setQrOpen(r.id)}>二维码</Op><OpSep />
                      {r.status === '已选定' && !r.po && <><Op gold onClick={() => setPoFor(r)}>生成采购订单</Op><OpSep /></>}
                      {demo && r.status !== '已关闭' && <Op onClick={() => { setQuoteOpen(r); setQuoteAs(r.invited[0] || 'GYS000012'); setQuoteVals({}); }}>模拟报价</Op>}
                    </span>
                  ),
                },
              ]}
            />
          </div>
        )}

        {/* ==================== 采购寻源 · 材料价格库 ==================== */}
        {tab === 'plib' && (
          <div style={{ padding: 16 }}>
            <Banner tone="info">
              已入库采购合同明细自动沉淀 · 与询比价 / 历史报价同源 · CNY <b>含税</b>；覆盖范围 = 可采购硬件（材料 + 设备），
              服务与套件不在此库（服务按人工构成、套件按配方成本）。<b>参考用途，不强制校验</b>。询比价「历史参照」取自本库。
            </Banner>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <Check checked={plibRev} onChange={setPlibRev} label="仅看需复核调价（偏离 ≥ ±10%）" />
              <span className="nc-tiny nc-muted" style={{ marginLeft: 'auto' }}>偏离 = （标准价 − 成交价）/ 成交价，±10% 可配</span>
            </div>
            <DataTable
              minWidth={1080}
              rows={PRICE_LIB.filter((p) => !plibRev || p.review)}
              rowKey={(p) => p.code}
              rowClass={(p) => (p.review ? 'is-danger-row' : '')}
              empty={plibRev ? '当前没有偏离 ≥ ±10% 的需复核价格；可取消「仅看需复核」查看全部' : '价格库暂无记录；采购合同入库后会自动沉淀成交价'}
              cols={[
                { key: 'code', title: '物料编码', width: 100, render: (p) => <span className="num">{p.code}</span> },
                { key: 'name', title: '名称 / 规格', render: (p) => <><b>{p.name}</b> <span className="nc-tiny nc-muted">{p.spec}</span></> },
                { key: 'brand', title: '品牌 / 厂家', width: 90, render: (p) => p.brand },
                { key: 'supplier', title: '供应商', width: 200, render: (p) => { const s = SUPPLIERS.find((x) => x.name === p.supplier); return <span className="nc-tiny">{s ? <EntityLink target="supplier" id={s.id} go={go} title="下钻到供应商档案">{p.supplier}</EntityLink> : p.supplier}</span>; } },
                { key: 'price', title: '含税成交价', width: 100, align: 'right', render: (p) => <span className="num">{fmt(p.price)}</span> },
                { key: 'std', title: '标准价', width: 100, align: 'right', render: (p) => <span className="num nc-muted">{fmt(p.std)}</span> },
                { key: 'dev', title: '偏离', width: 90, align: 'right', render: (p) => <span className={`num${Math.abs(p.dev) > 10 ? ' nc-v-red' : ''}`}>{p.dev > 0 ? '+' : ''}{p.dev.toFixed(1)}%</span> },
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
              证书类型是<b>物料属性</b>（主数据上的「认证」配置），本台账由它派生 —— 因此台账的 CCCF / 强制徽标与这里的证书类型永远一致；
              到期前 30 天按物料级渠道提醒；上传 / 查看<b>留审计</b>。服务不进证书台账（见「服务资质」）。
            </Banner>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <span className="nc-tiny nc-muted">共 {certs.length} 条 · 30 天内到期 {expSoon} 条 · 长期有效（无有效期）{certs.filter((c) => c.validTo === '—').length} 条不派发通知</span>
              <div style={{ marginLeft: 'auto' }}><Btn size="sm" kind="primary" onClick={() => setCertUp(true)}>＋ 上传</Btn></div>
            </div>
            <DataTable
              minWidth={1140}
              rows={certs}
              rowKey={(c) => c.no}
              rowClass={(c) => (daysLeft(c.validTo) <= 30 ? 'is-danger-row' : '')}
              empty="没有认证与报告记录；证书在主数据上配置后自动出现在此"
              cols={[
                { key: 'matCode', title: '物料编码', width: 100, render: (c) => <span className="num">{c.matCode}</span> },
                { key: 'mat', title: '物料', render: (c) => c.mat },
                { key: 'type', title: '证书类型', width: 150, render: (c) => <Tag tone={c.type.startsWith('CCCF') ? 'red' : 'blue'}>{c.type}</Tag> },
                { key: 'no', title: '证书编号', width: 170, render: (c) => <span className="num">{c.no}</span> },
                { key: 'validTo', title: '有效期至', width: 110, render: (c) => <span className="num nc-tiny">{c.validTo}</span> },
                {
                  key: 'left', title: '剩余', width: 90, align: 'right',
                  render: (c) => {
                    const dl = daysLeft(c.validTo);
                    return <span className="num">{dl === Infinity ? '长期有效' : dl <= 0 ? <span className="nc-v-red">已过期</span> : <span className={dl <= 30 ? 'nc-v-red' : ''}>{dl} 天</span>}</span>;
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

        {/* ==================== 合规资质 · 服务资质 ==================== */}
        {tab === 'qual' && (
          <div style={{ padding: 16 }}>
            <Banner tone="info">服务不发产品证书，只维护<b>资质要求</b>字段；投标 / 派工时按此校验承包资质与人员持证。</Banner>
            <DataTable
              minWidth={900}
              rows={items.filter((i) => i.ty === '服务')}
              rowKey={(m) => m.code}
              empty="暂无服务型主数据"
              cols={[
                { key: 'code', title: '服务编码', width: 110, render: (m) => <span className="num">{m.code}</span> },
                { key: 'name', title: '服务名称', render: (m) => <><b>{m.name}</b> <span className="nc-tiny nc-muted">{m.spec}</span></> },
                { key: 'unit', title: '计价单位', width: 90, align: 'center', render: (m) => m.unit },
                { key: 'qual', title: '资质要求', width: 240, render: (m) => <Tag tone="blue">{m.qualReq || '—'}</Tag> },
                {
                  key: 'labor', title: '人工构成', width: 260,
                  render: (m) => <span className="nc-tiny">{(m.labor || []).map((l) => `${l.trade} ${l.days} 工日 × ${fmt(laborRate(l.trade))}`).join('；') || '—'}</span>,
                },
                { key: 'price', title: '参考单价', width: 110, align: 'right', render: (m) => <b className="num">{fmt(svcCostOf(m.code).total)}</b> },
                { key: 'op', title: '操作', width: 100, render: (m) => <Op onClick={() => openRecipe(m.code)}>编辑成本构成</Op> },
              ]}
            />
          </div>
        )}

        {/* ==================== 合规资质 · 操作日志 ==================== */}
        {tab === 'audit' && (
          <div style={{ padding: 16 }}>
            <div className="nc-listhint">
              <span>操作审计<Tip w={380} text="关键操作审计：入库 / 领用 / 退料 / 盘点 / 调拨 / 调价 / 询价 / 采购订单 / 安全线调整 / 配方调整 / 认证附件查看，全部留痕可追溯。" /></span>
            </div>
            <DataTable
              minWidth={900}
              rows={audit}
              rowKey={(a) => `${a.t}-${a.who}-${a.act.slice(0, 8)}`}
              empty="暂无操作审计记录；关键操作会自动留痕"
              cols={[
                { key: 't', title: '时间', width: 140, render: (a) => <span className="num nc-tiny">{a.t}</span> },
                { key: 'who', title: '操作人', width: 90, render: (a) => a.who },
                { key: 'role', title: '角色', width: 130, render: (a) => <Tag tone="gray">{a.role}</Tag> },
                { key: 'act', title: '动作', render: (a) => a.act },
              ]}
            />
          </div>
        )}
      </Card>

      {/* ==================== 详情抽屉 ==================== */}
      <Drawer open={!!detail} width={720} onClose={() => setDetail(null)} title={detail?.name || ''}
        sub={detail ? `${detail.code} · 类型 ${detail.ty} · 规格 ${detail.spec} · 单位 ${detail.unit}` : ''}
        foot={<>
          <Btn onClick={() => {
            if (!detail) return;
            setItems((rs) => rs.map((r) => (r.code === detail.code ? { ...r, status: r.status === '启用' ? '停用' : '启用' } : r)));
            auditOnly('王敏', '主数据管理员', `${detail.status === '启用' ? '停用' : '启用'}主数据 ${detail.code} · ${detail.name}`);
            toast(`${detail.code} 已${detail.status === '启用' ? '停用' : '启用'}`);
            setDetail(null);
          }} danger>{detail?.status === '启用' ? '停用' : '启用'}</Btn>
          {detail && !isStocked(detail.ty) && <Btn onClick={() => { const c = detail.code; setDetail(null); openRecipe(c); }} kind="primary">编辑配方 / 成本构成</Btn>}
          <Btn onClick={() => setDetail(null)}>关闭</Btn>
        </>}>
        {detail && <>
          <KvGrid cols={2} rows={[
            { k: '编码', v: detail.code },
            { k: '名称', v: detail.name },
            { k: '类型', v: `${detail.ty} · ${KIND_DESC[detail.ty]}` },
            { k: '规格型号', v: detail.spec },
            { k: '分类目录', v: catPath(detail.cat) },
            { k: '计量单位', v: `${detail.unit}${UNIT_DESC[detail.unit] ? ` · ${UNIT_DESC[detail.unit]}` : ''}` },
            { k: '参考单价', v: fmt(detail.price) },
            { k: '责任维护人', v: detail.owner || '—' },
            ...(isStocked(detail.ty)
              ? [
                { k: '结余 / 预占 / 可用', v: `${detail.stock} / ${Math.round(scopeStock(detail.code, detail.stock) * HOLD_RATE) || detail.hold} / ${availOf(detail)} ${detail.unit}` },
                { k: '安全线', v: `${detail.safe} ${detail.unit}` },
                { k: '分布', v: WH.map((w) => `${w} ${whOf(detail.code)[w] || 0}`).join(' · ') },
              ]
              : [
                { k: '库存', v: '不持实物库存（服务 / 套件）' },
                { k: '资质要求', v: detail.qualReq || '—' },
              ]),
            { k: '状态', v: detail.status },
            { k: 'CCCF 认证', v: detail.ccc ? '已取得' : '未涉及' },
            { k: '强制性目录', v: detail.mand ? '在目录内' : (!isStocked(detail.ty) && inheritsMand(detail.code) ? '继承所含硬件' : '不在目录内') },
            { k: '证书', v: detail.certType ? `${detail.certType} · ${detail.certNo || '—'} · 有效期至 ${detail.certValidTo || '—'}` : (isStocked(detail.ty) ? '未涉及' : '不发产品证书（由所含硬件持证）') },
          ]} />

          {detail.mand && (
            <div className="nc-warnbox is-danger">
              <b><Ico n="warning" size={16} /> 该条目列入强制性产品目录</b>
              <div>无有效 CCCF 证书的批次不得用于工程；采购入库与报价选用时将校验证书编号与有效期。当前证书：{detail.certNo || '—'}（有效期至 {detail.certValidTo || '—'}）。</div>
            </div>
          )}

          {!isStocked(detail.ty) && (() => {
            const c = detail.ty === '服务' ? svcCostOf(detail.code) : costOf(detail.code);
            return (
              <Field label={detail.ty === '服务' ? '成本构成（人工 + 耗材）' : '配方（引用主数据，自动合计）'} span={4}>
                <div className="nc-money-row" style={{ marginBottom: 10 }}>
                  {[
                    { k: '材料小计', v: fmt(c.mat) },
                    { k: '人工小计', v: fmt(c.labor) },
                    { k: '成本', v: fmt(c.total) },
                    ...(detail.ty === '套件' ? [{ k: '对外价', v: fmt(detail.sale || 0) }, { k: '毛利率', v: `${costOf(detail.code).gross.toFixed(1)}%` }] : []),
                  ].map((m) => <div key={m.k} className="nc-money-cell"><span className="nc-tiny nc-muted">{m.k}</span><b className="num">{m.v}</b></div>)}
                </div>
                {detail.ty === '服务' ? (
                  <table className="nc-tbl" style={{ minWidth: 520 }}>
                    <thead><tr><th style={{ width: 150 }}>工种（主数据单价）</th><th style={{ width: 90, textAlign: 'right' }}>工日</th><th style={{ width: 100, textAlign: 'right' }}>单价</th><th style={{ textAlign: 'right' }}>小计</th></tr></thead>
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
                    <thead><tr><th style={{ width: 66 }}>行类型</th><th style={{ width: 100 }}>引用编码</th><th>引用对象</th><th style={{ width: 70, textAlign: 'right' }}>数量</th><th style={{ width: 70, textAlign: 'right' }}>损耗</th><th style={{ width: 90, textAlign: 'right' }}>单价</th><th style={{ width: 96, textAlign: 'right' }}>小计</th></tr></thead>
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
                <div className="nc-tiny nc-muted" style={{ marginTop: 8 }}>配方行只能引用主数据；人工费来自「工种 × 工日 × 单价」，不存在手工填写的幽灵数字。</div>
              </Field>
            );
          })()}

          {isStocked(detail.ty) && (
            <>
              <Field label="供应商报价对比（三源比价）" span={4}>
                <table className="nc-tbl" style={{ minWidth: 520 }}>
                  <thead><tr><th>供应商</th><th style={{ width: 96, textAlign: 'right' }}>报价</th><th style={{ width: 80, textAlign: 'right' }}>偏差</th><th style={{ width: 80 }}>准入</th></tr></thead>
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
                  <thead><tr><th style={{ width: 110 }}>期间</th><th style={{ width: 110, textAlign: 'right' }}>成交均价</th><th style={{ width: 110, textAlign: 'right' }}>采购量</th><th>趋势</th></tr></thead>
                  <tbody>
                    {matPriceTrend(detail.code).slice().reverse().map((r) => (
                      <tr key={r.d}><td>{r.d}</td><td className="is-num num">{fmt(r.p)}</td><td className="is-num num">{r.q}</td><td className="nc-tiny">{r.t}</td></tr>
                    ))}
                  </tbody>
                </table>
              </Field>
              <Field label="批次账（与证书关联批次呼应）" span={4}>
                <table className="nc-tbl" style={{ minWidth: 520 }}>
                  <thead><tr><th style={{ width: 130 }}>批次</th><th style={{ width: 170 }}>仓库</th><th style={{ width: 90, textAlign: 'right' }}>数量</th><th style={{ width: 100 }}>性质</th><th>证书</th></tr></thead>
                  <tbody>
                    {itemBatches(detail.code, whOf(detail.code)).map((b) => (
                      <tr key={b.batch + b.wh}><td className="num">{b.batch}</td><td className="nc-tiny">{b.wh}</td><td className="is-num num">{b.qty}</td><td><Tag tone={b.src === '认证批次' ? 'blue' : 'gray'}>{b.src}</Tag></td><td className="nc-tiny num">{b.cert}</td></tr>
                    ))}
                  </tbody>
                </table>
              </Field>
            </>
          )}
        </>}
      </Drawer>

      {/* ==================== 配方 / 成本构成 编辑器（服务与套件共用） ==================== */}
      <Drawer open={!!recipeFor} width={980} onClose={closeRecipe}
        title={recipeFor ? `${byCode(recipeFor)?.name || recipeFor} · ${byCode(recipeFor)?.ty === '服务' ? '成本构成' : '配方'}` : ''}
        sub={recipeFor ? `${recipeFor} · 类型 ${byCode(recipeFor)?.ty} · 配方行只能引用主数据` : ''}
        foot={<>
          <Btn onClick={closeRecipe}>取消</Btn>
          {recipeFor && byCode(recipeFor)?.ty === '套件' && draftCost && draftCost.gross < 20 && (
            <Btn onClick={() => { setPriceOpen(recipeFor); setPriceVal(String(suggestSale(draftCost.total))); }}>调价</Btn>
          )}
          <Btn kind="primary" onClick={saveRecipe}>保存配方</Btn>
        </>}>
        {recipeFor && (
          <>
            <div className="nc-money-row" style={{ marginBottom: 14 }}>
              {[
                { k: '材料小计', v: fmt(draftCost?.mat ?? 0) },
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
                      <th style={{ width: 110, textAlign: 'right' }}>单价</th>
                      <th style={{ width: 120, textAlign: 'right' }}>小计</th>
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

                <Field label="耗材行（可选 · 引用材料 / 设备主数据）" span={4}>
                  <table className="nc-tbl" style={{ minWidth: 620 }}>
                    <thead><tr>
                      <th>引用对象</th><th style={{ width: 110 }}>数量</th><th style={{ width: 110, textAlign: 'right' }}>单价</th><th style={{ width: 120, textAlign: 'right' }}>小计</th><th style={{ width: 70 }}>操作</th>
                    </tr></thead>
                    <tbody>
                      {svcDraft.consumables.map((c, i) => (
                        <tr key={i}>
                          <td>
                            <select className="nc-input" value={c.code} onChange={(e) => setSvcDraft({ ...svcDraft, consumables: svcDraft.consumables.map((x, j) => (j === i ? { ...x, code: e.target.value } : x)) })}>
                              <option value="">请选择主数据…</option>
                              {items.filter((x) => isStocked(x.ty)).map((x) => <option key={x.code} value={x.code}>{x.code} · {x.name} {x.spec}</option>)}
                            </select>
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
              <Field label="配方行（材料 / 设备 / 服务 / 子套件 混合）" req span={4}>
                <table className="nc-tbl" style={{ minWidth: 820 }}>
                  <thead><tr>
                    <th style={{ width: 44 }}>序</th>
                    <th style={{ width: 96 }}>行类型</th>
                    <th>引用对象（主数据）</th>
                    <th style={{ width: 92 }}>数量</th>
                    <th style={{ width: 76 }}>损耗%</th>
                    <th style={{ width: 96, textAlign: 'right' }}>单价</th>
                    <th style={{ width: 104, textAlign: 'right' }}>小计</th>
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
                            <select className="nc-input" value={l.code} onChange={(e) => setDraftLines((v) => v.map((x, j) => (j === i ? { ...x, code: e.target.value, locked: undefined } : x)))}>
                              <option value="">请选择主数据…</option>
                              {items.filter((x) => x.ty === l.kind && x.code !== recipeFor).map((x) => <option key={x.code} value={x.code}>{x.code} · {x.name} {x.spec}</option>)}
                            </select>
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
                              ? <span className="nc-v-red" title="已锁价，偏离主数据参考单价">{fmt(l.locked)}<Tag tone="orange">锁价</Tag></span>
                              : <>{fmt(base)}{l.kind !== '服务' && l.kind !== '套件' && <a className="nc-link" style={{ marginLeft: 6 }} onClick={() => setDraftLines((v) => v.map((x, j) => (j === i ? { ...x, locked: base } : x)))}>锁价</a>}</>}
                          </td>
                          <td className="is-num num"><b>{fmt(sub)}</b></td>
                          <td><Op danger onClick={() => setDraftLines((v) => v.filter((_, j) => j !== i))}>删除</Op></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <button className="nc-addrow" onClick={() => setDraftLines((v) => [...v, { kind: '材料', code: '', qty: 1, loss: 0 }])}>＋ 添加配方行</button>
                <div className="nc-tiny nc-muted" style={{ marginTop: 8 }}>
                  单价自动从主数据带出；锁价修改会标记（偏离主数据参考价）。服务行的人工费来自该服务的「工种 × 工日 × 单价」，不再单独手填「人工 / 其他」。
                </div>
              </Field>
            )}
          </>
        )}
      </Drawer>

      {/* ==================== 调价（按目标毛利率反算） ==================== */}
      <Modal open={!!priceOpen} title={`调价 · ${priceOpen ? byCode(priceOpen)?.name : ''}`} width={560} onClose={() => setPriceOpen(null)}
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
          <div>成本由配方自动合计；目标毛利率按 25% 反算建议价，可手工覆盖（会写入操作日志）。</div>
        </div>
        <div className="nc-form-grid">
          <Field label="当前成本"><input className="nc-input" disabled value={priceOpen ? fmt(costOf(priceOpen).total) : ''} /></Field>
          <Field label="当前对外价"><input className="nc-input" disabled value={priceOpen ? fmt(byCode(priceOpen)?.sale || 0) : ''} /></Field>
          <Field label="建议对外价（毛利率 25%）"><input className="nc-input" disabled value={priceOpen ? fmt(suggestSale(costOf(priceOpen).total)) : ''} /></Field>
          <Field label="新对外价" req note="保存后同步为该套件的参考单价"><input className="nc-input" type="number" value={priceVal} onChange={(e) => setPriceVal(e.target.value)} /></Field>
        </div>
      </Modal>

      {/* ==================== 批次账 ==================== */}
      <Drawer open={!!batchFor} width={720} onClose={() => setBatchFor(null)}
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
      <Modal open={opIn} title="入库登记" width={700} onClose={() => setOpIn(false)}
        foot={<><Btn onClick={() => setOpIn(false)}>取消</Btn><Btn kind="primary" onClick={() => {
          const m = byCode(inCode);
          if (!m) { setInErr('请选择物料'); return; }
          if (m.ccc || m.mand) { if (!inBatch.trim()) { setInErr('消防产品批次号必填（强制性产品认证目录内产品）'); return; } }
          if (!(Number(inQty) > 0)) { setInErr('入库数量须 > 0'); return; }
          if (!(Number(inPrice) > 0)) { setInErr('入库单价须 > 0'); return; }
          const q = Number(inQty);
          setOpIn(false); resetOpForm();
          commitOp({
            type: '入库', code: inCode, wh: inWh, qty: q, by: inBy,
            msg: `已入库 ${m.name} ${q}${m.unit}（批次 ${inBatch || '—'}）至「${inWh}」，金额 ¥${fmt(q * Number(inPrice))} 计入项目成本 · 结余 ${m.stock + q}${m.unit}`,
            act: `${m.name} +${q}${m.unit} · 批次 ${inBatch || '—'} · 金额 ¥${fmt(q * Number(inPrice))} 计入项目成本${inPo ? ` · 关联采购订单 ${inPo}` : ''}`,
          });
          /* 入库回写采购订单，闭合「询价 → 采购订单 → 入库」链路 */
          if (inPo) {
            setRfqs((v) => v.map((r) => (r.po && r.po.no === inPo ? { ...r, po: { ...r.po, status: '已入库' } } : r)));
            toast(`采购订单 ${inPo} 已回写为「已入库」`);
          }
        }}>确认入库</Btn></>}>
        <div className="nc-warnbox is-info"><b>成本口径</b><div>金额自动计入项目合同成本（关联项目时）；消防产品批次必填，批次账与证书关联批次呼应。</div></div>
        {inErr && <Alert icon={<Ico n="warning" size={16} />} tone="danger" title={inErr} />}
        <div className="nc-form-grid">
          <Field label="关联采购订单" span={2} note="来自询比价「已选定」后生成的订单，入库后自动回写状态">
            <select className="nc-input" value={inPo} onChange={(e) => setInPo(e.target.value)}>
              <option value="">（不关联）</option>
              {rfqs.filter((r) => r.po && r.po.status !== '已入库').map((r) => <option key={r.po!.no} value={r.po!.no}>{r.po!.no} · {supName(r.po!.supplier)} · {fmtWan(r.po!.amt)}</option>)}
            </select>
          </Field>
          <Field label="物料" req span={2}>
            <select className="nc-input" value={inCode} onChange={(e) => setInCode(e.target.value)}>
              {stocked.map((m) => <option key={m.code} value={m.code}>{m.code} · {m.name} {m.spec}</option>)}
            </select>
          </Field>
          <Field label="仓库" req><select className="nc-input" value={inWh} onChange={(e) => setInWh(e.target.value)}>{WH.map((w) => <option key={w}>{w}</option>)}</select></Field>
          <Field label="库位" req><select className="nc-input" value={inLoc} onChange={(e) => setInLoc(e.target.value)}>{LOC.map((l) => <option key={l}>{l}</option>)}</select></Field>
          <Field label="批次号" req={byCode(inCode)?.ccc || byCode(inCode)?.mand} err={inErr.includes('批次') ? inErr : undefined} note="消防产品批次必填，如 PC20260921-A">
            <input className="nc-input" value={inBatch} onChange={(e) => setInBatch(e.target.value)} placeholder="PC20260921-A" />
          </Field>
          <Field label="数量" req><input className="nc-input" type="number" value={inQty} onChange={(e) => setInQty(e.target.value)} placeholder="0" /></Field>
          <Field label="单价（含税）" req><input className="nc-input" type="number" value={inPrice} onChange={(e) => setInPrice(e.target.value)} placeholder="0.00" /></Field>
          <Field label="日期"><input className="nc-input" type="date" value={inDate} onChange={(e) => setInDate(e.target.value)} /></Field>
          <Field label="经办"><select className="nc-input" value={inBy} onChange={(e) => setInBy(e.target.value)}><option>张仓</option><option>李工</option><option>王工</option></select></Field>
        </div>
      </Modal>

      {/* ==================== 领用登记 ==================== */}
      <Modal open={opOut} title="领用登记" width={700} onClose={() => setOpOut(false)}
        foot={<><Btn onClick={() => setOpOut(false)}>取消</Btn><Btn kind="primary" onClick={() => {
          const m = byCode(inCode);
          if (!m) { setInErr('请选择物料'); return; }
          if (!(Number(inQty) > 0)) { setInErr('领用数量须 > 0'); return; }
          const whAvail = whOf(inCode)[inWh] || 0;
          if (Number(inQty) > whAvail) { setInErr(`领用数量 ${inQty}${m.unit} 超出「${inWh}」可用库存 ${whAvail}${m.unit}`); return; }
          const q = Number(inQty);
          setOpOut(false); resetOpForm();
          commitOp({
            type: '领用', code: inCode, wh: inWh, qty: q, by: inBy,
            msg: `已领用 ${m.name} ${q}${m.unit}（自「${inWh}」）；出库不影响项目成本（入库时已计入）· 结余 ${m.stock - q}${m.unit}`,
            act: `${m.name} -${q}${m.unit} · 出库自「${inWh}」· 出库不重复计入成本`,
          });
        }}>确认领用</Btn></>}>
        <div className="nc-warnbox is-info"><b>成本口径</b><div>领用（出库）<b>不影响</b>项目成本——成本在入库时已计入，避免重复；退料自动回冲。</div></div>
        {inErr && <Alert icon={<Ico n="warning" size={16} />} tone="danger" title={inErr} />}
        <div className="nc-form-grid">
          <Field label="物料" req span={2}>
            <select className="nc-input" value={inCode} onChange={(e) => setInCode(e.target.value)}>
              {stocked.map((m) => <option key={m.code} value={m.code}>{m.code} · {m.name}（{inWh}可用 {whOf(m.code)[inWh] || 0} {m.unit}）</option>)}
            </select>
          </Field>
          <Field label="出库仓" req><select className="nc-input" value={inWh} onChange={(e) => setInWh(e.target.value)}>{WH.map((w) => <option key={w}>{w}</option>)}</select></Field>
          <Field label="关联项目"><select className="nc-input"><option>XM000123 · ××中心大厦消防改造</option><option>XM000118 · 云南省××医院住院楼</option><option>（不关联）</option></select></Field>
          <Field label="领用数量" req><input className="nc-input" type="number" value={inQty} onChange={(e) => setInQty(e.target.value)} placeholder="0" /></Field>
          <Field label="领用人"><select className="nc-input" value={inBy} onChange={(e) => setInBy(e.target.value)}><option>张仓</option><option>李工</option><option>王工</option></select></Field>
        </div>
      </Modal>

      {/* ==================== 退料 ==================== */}
      <Modal open={opBack} title="退料（项目 → 仓库）" width={700} onClose={() => setOpBack(false)}
        foot={<><Btn onClick={() => setOpBack(false)}>取消</Btn><Btn kind="primary" onClick={() => {
          const mb = byCode(inCode);
          if (!mb) { setInErr('请选择物料'); return; }
          if (!(Number(inQty) > 0)) { setInErr('退料数量须 > 0'); return; }
          const q = Number(inQty);
          setOpBack(false); resetOpForm();
          commitOp({
            type: '退料', code: inCode, wh: inWh, qty: q, by: inBy,
            msg: `已退料 ${mb.name} ${q}${mb.unit} 至「${inWh}」，项目成本自动回冲 · 结余 ${mb.stock + q}${mb.unit}`,
            act: `${mb.name} +${q}${mb.unit} · 退入「${inWh}」· 项目成本已回冲`,
          });
        }}>确认退料</Btn></>}>
        <div className="nc-warnbox is-info"><b>回冲规则</b><div>退料回冲项目成本（与入库计入口径互逆），库存回到对应仓库库位。</div></div>
        {inErr && <Alert icon={<Ico n="warning" size={16} />} tone="danger" title={inErr} />}
        <div className="nc-form-grid">
          <Field label="物料" req span={2}>
            <select className="nc-input" value={inCode} onChange={(e) => setInCode(e.target.value)}>
              {stocked.map((m) => <option key={m.code} value={m.code}>{m.code} · {m.name}</option>)}
            </select>
          </Field>
          <Field label="来源项目" req><select className="nc-input"><option>XM000123 · ××中心大厦消防改造</option><option>XM000118 · 云南省××医院住院楼</option></select></Field>
          <Field label="退回仓" req><select className="nc-input" value={inWh} onChange={(e) => setInWh(e.target.value)}>{WH.map((w) => <option key={w}>{w}</option>)}</select></Field>
          <Field label="退料数量" req><input className="nc-input" type="number" value={inQty} onChange={(e) => setInQty(e.target.value)} placeholder="0" /></Field>
          <Field label="经办"><select className="nc-input" value={inBy} onChange={(e) => setInBy(e.target.value)}><option>张仓</option><option>李工</option><option>王工</option></select></Field>
          <Field label="退料原因" span={4}><textarea className="nc-input" rows={2} placeholder="如：现场设计变更，剩余材料退回" /></Field>
        </div>
      </Modal>

      {/* ==================== 库存盘点 ==================== */}
      <Modal open={opCheck} title="库存盘点" width={680} onClose={() => setOpCheck(false)}
        foot={<><Btn onClick={() => setOpCheck(false)}>取消</Btn><Btn kind="primary" onClick={() => {
          const m = byCode(inCode);
          if (!m) { setInErr('请选择物料'); return; }
          const book = whOf(inCode)[inWh] || 0;
          const diff = Number(inQty || 0) - book;
          setOpCheck(false); resetOpForm();
          commitOp({
            type: '盘点', code: inCode, wh: inWh, qty: diff, by: inBy,
            msg: `已生成《盘点调整单》·「${inWh}」账面 ${book} → 实盘 ${inQty || 0}，差异 ${diff > 0 ? '+' : ''}${diff}（留痕）· 库存已按实盘调整`,
            act: `${m.name}「${inWh}」账面 ${book} → 实盘 ${inQty || 0} · 差异 ${diff > 0 ? '+' : ''}${diff}`,
          });
        }}>生成调整单</Btn></>}>
        <div className="nc-warnbox is-info"><b>盘点规则</b><div>实盘与账面差异将生成《盘点调整单》并留痕；账面对比所选仓库。</div></div>
        <div className="nc-form-grid">
          <Field label="物料" req span={2}>
            <select className="nc-input" value={inCode} onChange={(e) => setInCode(e.target.value)}>
              {stocked.map((m) => <option key={m.code} value={m.code}>{m.code} · {m.name}</option>)}
            </select>
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
      <Modal open={opMove} title="库存调拨" width={680} onClose={() => setOpMove(false)}
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
        <div className="nc-warnbox is-info"><b>调拨规则</b><div>跨仓调拨，总量不变，留痕。</div></div>
        {inErr && <Alert icon={<Ico n="warning" size={16} />} tone="danger" title={inErr} />}
        <div className="nc-form-grid">
          <Field label="物料" req span={4}>
            <select className="nc-input" value={inCode} onChange={(e) => setInCode(e.target.value)}>
              {stocked.map((m) => <option key={m.code} value={m.code}>{m.code} · {m.name}</option>)}
            </select>
          </Field>
          <Field label="调出仓" req><select className="nc-input" value={inWh} onChange={(e) => setInWh(e.target.value)}>{WH.map((w) => <option key={w}>{w}</option>)}</select></Field>
          <Field label="调入仓" req><select className="nc-input" value={inToWh} onChange={(e) => setInToWh(e.target.value)}>{WH.map((w) => <option key={w}>{w}</option>)}</select></Field>
          <Field label="数量" req><input className="nc-input" type="number" value={inQty} onChange={(e) => setInQty(e.target.value)} placeholder="0" /></Field>
          <Field label="经办"><select className="nc-input" value={inBy} onChange={(e) => setInBy(e.target.value)}><option>张仓</option><option>李工</option><option>王工</option></select></Field>
        </div>
      </Modal>

      {/* ==================== 设置安全线 ==================== */}
      <Modal open={!!opSafe} title={`设置安全线 · ${opSafe?.name || ''}`} width={560} onClose={() => setOpSafe(null)}
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
        <div className="nc-warnbox is-info">调整记录留痕（谁 / 何时 / 旧值 → 新值）；低于安全线即进入「库存预警」，可就地发起询价。</div>
        <div className="nc-form-grid">
          <Field label="物料" span={4}><input className="nc-input" disabled value={`${opSafe?.code} · ${opSafe?.name} ${opSafe?.spec}`} /></Field>
          <Field label="当前安全线"><input className="nc-input" disabled value={String(opSafe?.safe ?? '')} /></Field>
          <Field label="安全线数量" req><input className="nc-input" type="number" value={safeVal} onChange={(e) => setSafeVal(e.target.value)} /></Field>
        </div>
      </Modal>

      {/* ==================== 价格库历史 ==================== */}
      <Modal open={!!plibHis} title={`价格历史 · ${plibHis?.name || ''}`} width={680} onClose={() => setPlibHis(null)}
        foot={<><Btn onClick={() => setPlibHis(null)}>关闭</Btn><Btn kind="primary" onClick={() => { setPlibHis(null); toast('已发起调价复核（变更单 MD + 6 位）'); }}>发起调价复核</Btn></>}>
        <table className="nc-tbl" style={{ minWidth: 600 }}>
          <thead><tr><th style={{ width: 110 }}>生效日期</th><th style={{ width: 110, textAlign: 'right' }}>含税价</th><th style={{ width: 90, textAlign: 'right' }}>涨跌</th><th style={{ width: 120 }}>来源</th><th>备注</th></tr></thead>
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
      <Modal open={certUp} title="上传认证与报告（≤5 附件 · PDF/JPG/PNG）" width={680} onClose={() => setCertUp(false)}
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
            <select className="nc-input" value={cuMat} onChange={(e) => setCuMat(e.target.value)}>
              {stocked.map((m) => <option key={m.code} value={m.code}>{m.code} · {m.name}</option>)}
            </select>
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
      </Modal>

      {/* ==================== 发起询价 ==================== */}
      <Modal open={rfqNew} title="发起询价" width={820} onClose={() => setRfqNew(false)}
        foot={<><Btn onClick={() => setRfqNew(false)}>取消</Btn><Btn kind="primary" onClick={() => {
          if (!rfqLines.length) { setRfqErr('请至少添加一行物料 / 服务'); return; }
          if (rfqLines.some((l) => !l.code)) { setRfqErr('每行须选择物料 / 服务'); return; }
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
        <div className="nc-warnbox is-info">填写需要的物料 / 服务与数量 → 生成二维码，供应商扫码填价；<b>黑名单供应商不可邀约</b>。服务只寻源可外采项，套件不询价。</div>
        {rfqErr && <Alert icon={<Ico n="warning" size={16} />} tone="danger" title={rfqErr} />}
        <Field label="物料 / 服务（数量）" req span={4}>
          <table className="nc-tbl" style={{ minWidth: 560 }}>
            <thead><tr><th>物料 / 服务</th><th style={{ width: 120 }}>数量</th><th style={{ width: 60 }}>操作</th></tr></thead>
            <tbody>
              {rfqLines.map((l, i) => (
                <tr key={i}>
                  <td>
                    <select className="nc-input" value={l.code} onChange={(e) => setRfqLines((v) => v.map((x, j) => (j === i ? { ...x, code: e.target.value } : x)))}>
                      <option value="">请选择…</option>
                      {items.filter((m) => m.ty !== '套件').map((m) => <option key={m.code} value={m.code}>{m.code} · {m.name} {m.spec}</option>)}
                    </select>
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
          <Field label="寻源范围"><select className="nc-input" defaultValue="可外采（硬件 + 服务）"><option>可外采（硬件 + 服务）</option><option>仅硬件（材料 / 设备）</option></select></Field>
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
      <Modal open={!!matrix} title={`比价矩阵 · ${matrix?.id || ''}`} width={920} onClose={() => setMatrix(null)}
        foot={<>
          <Btn onClick={() => setMatrix(null)}>关闭</Btn>
          {matrix && matrix.status !== '已选定' && matrix.status !== '已关闭' && (
            <Btn kind="primary" onClick={() => {
              const ranked = matrix.invited.filter((g) => matrix.quotes[g])
                .map((g) => ({ g, amt: matrix.mats.reduce((s, m) => s + (matrix.quotes[g]?.[m.code] ?? 0) * m.qty, 0) }))
                .sort((a, b) => a.amt - b.amt);
              if (!ranked.length) { toast('尚无供应商报价，暂不能选定', 'err'); return; }
              const low = ranked[0];
              setRfqs((v) => v.map((r) => (r.id === matrix.id ? { ...r, status: '已选定', picked: low.g } : r)));
              auditOnly('李思敏', '商务合同管理员', `询比价 ${matrix.id} 选定 ${supName(low.g)} · 合计 ${fmt(low.amt)}`);
              toast(`${matrix.id} 已选定 ${supName(low.g)}（${fmt(low.amt)}）· 可在列表「生成采购订单」`);
              setMatrix(null);
            }}>选定最低价</Btn>
          )}
        </>}>
        {matrix && (() => {
          const supIds = matrix.invited.filter((g) => matrix.quotes[g]);
          const amtOf = (g: string) => matrix.mats.reduce((s, m) => s + (matrix.quotes[g]?.[m.code] ?? 0) * m.qty, 0);
          const lowAmt = supIds.length ? Math.min(...supIds.map((g) => amtOf(g))) : 0;
          const stdAmt = matrix.mats.reduce((s, m) => s + (byCode(m.code)?.price ?? 0) * m.qty, 0);
          return <>
            <div className="nc-warnbox is-info">
              <b>比价口径</b>
              <div>行 = 需求项（数量取自主数据档案）· 列 = 受邀供应商报价；绿色 = 该行最低价，合计最低者即推荐中标。
                标准价合计 <b className="num">{fmt(stdAmt)}</b>（主数据参考价，仅作对照）。</div>
            </div>
            <table className="nc-tbl" style={{ minWidth: 760 }}>
              <thead><tr>
                <th>需求项</th>
                <th style={{ width: 90, textAlign: 'right' }}>数量</th>
                <th style={{ width: 110, textAlign: 'right' }}>标准价</th>
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
                  <td><b>合计</b></td>
                  <td />
                  <td className="is-num num nc-muted">{fmt(stdAmt)}</td>
                  {supIds.map((g) => <td key={g} className={`is-num num${amtOf(g) === lowAmt ? ' nc-v-green' : ''}`}><b>{fmt(amtOf(g))}</b></td>)}
                </tr>
              </tbody>
            </table>
            <div className="nc-tiny nc-muted" style={{ marginTop: 8 }}>
              已选定：{matrix.picked ? <b>{supName(matrix.picked)}</b> : '尚未选定'}
              {matrix.invited.length - supIds.length > 0 ? ` · ${matrix.invited.length - supIds.length} 家尚未报价（显示「—」）` : ''}
            </div>
          </>;
        })()}
      </Modal>

      {/* ==================== 二维码邀约（一人一码） ==================== */}
      <Modal open={!!qrOpen} title={`供应商报价二维码 · ${qrOpen || ''}`} width={580} onClose={() => setQrOpen(null)}
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
            style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: 6, flex: 'none' }}>
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
              { k: '物料 / 服务', v: (rfqs.find((r) => r.id === qrOpen)?.mats || []).map((m) => `${m.name} ×${m.qty}${m.unit}`).join('；') || '—' },
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
      <Modal open={!!quoteOpen} title={`模拟供应商报价 · ${quoteOpen?.id || ''}`} width={720} onClose={() => setQuoteOpen(null)}
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
            <thead><tr><th>需求项</th><th style={{ width: 96, textAlign: 'right' }}>数量</th><th style={{ width: 150 }}>报价单价（含税）</th></tr></thead>
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
      <Modal open={!!poFor} title={`生成采购订单 · 来源 ${poFor?.id || ''}`} width={720} onClose={() => setPoFor(null)}
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
              { k: '币种', v: 'CNY' },
            ]} />
            <table className="nc-tbl" style={{ minWidth: 520, marginTop: 10 }}>
              <thead><tr><th>物料 / 服务</th><th style={{ width: 100, textAlign: 'right' }}>数量</th><th style={{ width: 110, textAlign: 'right' }}>成交单价</th><th style={{ width: 110, textAlign: 'right' }}>小计</th></tr></thead>
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
      <Modal open={gSearch} title="本页检索" width={680} onClose={() => setGSearch(false)}>
        <Field label="关键词" span={4} note="检索统一主数据（编码 / 名称 / 规格型号）">
          <input className="nc-input" autoFocus value={gKw} onChange={(e) => setGKw(e.target.value)} placeholder="如 镀锌钢管 / CL000123" />
        </Field>
        {(() => {
          const hit = items
            .filter((i) => !gKw || i.name.includes(gKw) || i.code.includes(gKw) || i.spec.includes(gKw))
            .slice(0, 12);
          return (
            <table className="nc-tbl" style={{ minWidth: 560 }}>
              <thead><tr><th style={{ width: 104 }}>编码</th><th>名称 / 规格</th><th style={{ width: 80 }}>类型</th><th style={{ width: 80 }}>操作</th></tr></thead>
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
      <Modal open={importOpen} title="批量导入主数据" width={640} onClose={() => setImportOpen(false)}
        foot={<>
          <Btn onClick={() => setImportOpen(false)}>取消</Btn>
          <Btn onClick={() => toast('模板已下载（XLSX）')}>下载模板</Btn>
          <Btn kind="primary" onClick={() => { setImportOpen(false); toast('已导入 0 条（原型不解析文件内容）'); }}>开始导入</Btn>
        </>}>
        <div className="nc-warnbox is-info">
          <b>导入规则</b>
          <div>先下载模板按列填写；服务型须填「工日 + 工种」，套件型导入后到「配方与成本」补配方行。
            重名 / 重码逐行报错，<b>不覆盖</b>既有数据。</div>
        </div>
        <div className="nc-form-grid">
          <Field label="类型" req span={2}><select className="nc-input">{ITEM_KINDS.map((k) => <option key={k}>{k}</option>)}</select></Field>
          <Field label="文件" req span={2}><div className="nc-dropzone"><Ico n="paperclip" size={16} /> 点击或拖拽上传（XLSX / CSV · ≤5MB）</div></Field>
        </div>
      </Modal>

      {/* ==================== 新增主数据（四类同表，类型可切换） ==================== */}
      <Modal open={newOpen} title="新增主数据" width={860} onClose={() => setNewOpen(false)}
        foot={<>
          <Btn onClick={() => setNewOpen(false)}>取消</Btn>
          <Btn kind="primary" onClick={() => {
            if (!nf.name.trim()) { setNewErr('名称必填'); return; }
            if (!nf.cat) { setNewErr('请选择分类目录'); return; }
            const stockedKind = isStocked(nf.ty);
            if (stockedKind && !(Number(nf.price) > 0)) { setNewErr('参考单价须 > 0'); return; }
            if (nf.ty === '服务' && nfLabor.some((l) => !(l.days > 0))) { setNewErr('人工行的工日须 > 0'); return; }
            if (nf.ty === '套件' && !(Number(nf.sale) > 0)) { setNewErr('套件对外价须 > 0'); return; }
            const pfx = nf.ty === '材料' ? 'CL' : nf.ty === '设备' ? 'EQ' : nf.ty === '服务' ? 'SV' : 'CP';
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
            setNf({ ty: '材料', name: '', spec: '', cat: '', unit: UNITS[0], price: '', safe: '', ccc: false, mand: false, certType: CERT_TYPES[0], certNo: '', certValidTo: '', batch: '', notifyCh: CHANNELS[0], qualReq: '', sale: '' });
            setNfLabor([{ trade: LABOR_RATES[0].trade, days: 1 }]);
            setNfMats([]);
            toast(`已新增 ${code} · ${item.name}（${nf.ty}）${nf.ty === '套件' ? '，请到「配方与成本」补配方行' : ''}`);
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
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {ITEM_KINDS.map((k) => (
                  <Btn key={k} size="sm" kind={nf.ty === k ? 'primary' : undefined}
                    onClick={() => {
                      setNf((f) => ({ ...f, ty: k, cat: '', price: '', safe: '', sale: '', ccc: false, mand: false }));
                      setNfLabor([{ trade: LABOR_RATES[0].trade, days: 1 }]);
                      setNfMats([]);
                    }}>{k}</Btn>
                ))}
              </div>
            </Field>
            <div className="nc-form-grid">
              <Field label="名称" req><input className="nc-input" value={nf.name} onChange={(e) => setNf((f) => ({ ...f, name: e.target.value }))} placeholder="如 镀锌钢管" /></Field>
              <Field label="规格型号"><input className="nc-input" value={nf.spec} onChange={(e) => setNf((f) => ({ ...f, spec: e.target.value }))} placeholder="如 DN100" /></Field>
              <Field label="分类目录" req note={stockKind ? '物料目录 = 材料 + 设备' : '服务与套件目录 = 服务 + 套件'}>
                <select className="nc-input" value={nf.cat} onChange={(e) => setNf((f) => ({ ...f, cat: e.target.value }))}>
                  <option value="">请选择…</option>
                  {opts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="计量单位" req note={UNIT_DESC[nf.unit]}>
                <select className="nc-input" value={nf.unit} onChange={(e) => setNf((f) => ({ ...f, unit: e.target.value }))}>
                  {UNITS.map((u) => <option key={u}>{u}</option>)}
                </select>
              </Field>
            </div>
            {stockKind && (
              <div className="nc-form-grid">
                <Field label="参考单价（含税）" req><input className="nc-input" type="number" value={nf.price} onChange={(e) => setNf((f) => ({ ...f, price: e.target.value }))} placeholder="0.00" /></Field>
                <Field label="安全库存线" note="低于安全线即进入「库存预警」，可一键发起询价"><input className="nc-input" type="number" value={nf.safe} onChange={(e) => setNf((f) => ({ ...f, safe: e.target.value }))} placeholder="0" /></Field>
                <Field label="认证属性" span={2}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Check checked={nf.ccc} onChange={(b) => setNf((f) => ({ ...f, ccc: b }))} label="CCCF 强制性认证" />
                    <Check checked={nf.mand} onChange={(b) => setNf((f) => ({ ...f, mand: b }))} label="强制认证目录（无证不得用于工程）" />
                  </div>
                </Field>
              </div>
            )}
            {stockKind && (nf.ccc || nf.mand) && (
              <div className="nc-form-grid">
                <Field label="证书类型" req note="物料级唯一配置，合规台账由它派生 → 台账徽标与证书类型永远一致">
                  <select className="nc-input" value={nf.certType} onChange={(e) => setNf((f) => ({ ...f, certType: e.target.value }))}>
                    {CERT_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="证书编号" req><input className="nc-input" value={nf.certNo} onChange={(e) => setNf((f) => ({ ...f, certNo: e.target.value }))} placeholder="如 CCCF-2026-FH-001122" /></Field>
                <Field label="有效期至" note="留空 = 长期有效，不显示也不派发到期通知"><input className="nc-input" type="date" value={nf.certValidTo} onChange={(e) => setNf((f) => ({ ...f, certValidTo: e.target.value }))} /></Field>
                <Field label="到期通知渠道" note="物料级配置；无有效期时不适用">
                  <select className="nc-input" value={nf.notifyCh} onChange={(e) => setNf((f) => ({ ...f, notifyCh: e.target.value }))} disabled={!nf.certValidTo}>
                    {CHANNELS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="关联批次" note="与库存批次账呼应"><input className="nc-input" value={nf.batch} onChange={(e) => setNf((f) => ({ ...f, batch: e.target.value }))} placeholder="如 PC20260921-A" /></Field>
              </div>
            )}
            {nf.ty === '服务' && <>
              <Field label="资质要求" req span={2} note="服务不发产品证书，只维护资质要求；投标 / 派工时按此校验承包资质与人员持证">
                <input className="nc-input" value={nf.qualReq} onChange={(e) => setNf((f) => ({ ...f, qualReq: e.target.value }))} placeholder="如 消防设施维护保养一级资质" />
              </Field>
              <Field label="人工构成（工种 × 工日 × 单价）" req span={4} note="人工费只能来自工种单价主数据，禁止手工填数字">
                <table className="nc-tbl" style={{ minWidth: 520 }}>
                  <thead><tr><th>工种</th><th style={{ width: 110 }}>工日</th><th style={{ width: 120, textAlign: 'right' }}>单价</th><th style={{ width: 110, textAlign: 'right' }}>小计</th><th style={{ width: 60 }}>操作</th></tr></thead>
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
                  <thead><tr><th>耗材</th><th style={{ width: 110 }}>数量</th><th style={{ width: 110, textAlign: 'right' }}>小计</th><th style={{ width: 60 }}>操作</th></tr></thead>
                  <tbody>
                    {nfMats.length === 0 && <tr><td colSpan={4} className="nc-muted nc-tiny">暂无耗材行（可留空，表示纯人工服务）</td></tr>}
                    {nfMats.map((c, i) => (
                      <tr key={i}>
                        <td>
                          <select className="nc-input" value={c.code} onChange={(e) => setNfMats((v) => v.map((x, j) => (j === i ? { ...x, code: e.target.value } : x)))}>
                            <option value="">请选择…</option>
                            {stocked.map((m) => <option key={m.code} value={m.code}>{m.code} · {m.name} {m.spec}</option>)}
                          </select>
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
                  { k: '参考单价（自动带出）', v: <b className="num nc-v-green">{fmt(laborSum + matSum)}</b> },
                ]} />
              </Field>
            </>}
            {nf.ty === '套件' && <>
              <div className="nc-form-grid">
                <Field label="对外价" req note="套件成本由配方行自动合计（材料小计 + 人工小计），此处只定对外价">
                  <input className="nc-input" type="number" value={nf.sale} onChange={(e) => setNf((f) => ({ ...f, sale: e.target.value }))} placeholder="0.00" />
                </Field>
              </div>
              <div className="nc-warnbox is-info">
                <b>下一步</b>
                <div>套件保存后到「配方与成本」维护配方行（引用材料 / 设备 / 服务 / 子套件），成本与毛利率会实时计算，负毛利会给「调价」动作。</div>
              </div>
            </>}
          </>;
        })()}
      </Modal>
    </>
  );
}