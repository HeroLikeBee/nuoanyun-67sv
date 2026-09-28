// 报价编辑（工作台）—— 目录化组价与批量调价，报价的「干活页面」
// 核心：8 目录批量调价 · 明细 5 列内嵌可编辑 · 汇总项只读自动计算 · 粘性汇总条触发提示
import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  Btn, Banner, Card, Field, KvGrid, Modal, Money, Op, OpMore, OpSep, PageHead, ProjectPicker, SearchInput,
  Tag, Tip, useToast, Check, Code, Collapse, ChainBar, CustomerPicker, DataTable, Drawer, EntityLink, OppPicker, usePaged,
} from '../components/ui';
import {
  REAL_SCOPES, SCOPE_UNASSIGNED, UNITS, MATERIALS, KITS, RECIPES, bomCost, itemByCode, CUSTOMERS,
  PROJECTS, QUOTES, matPriceRef, catLeafOptions, catPath, catScopeName, catDefaultMarkup, quoteScopeOf, scopeName, scopeMarkup,
  fmt, approveLevel, quoteTrigger, TODAY, verNo, ITEM_KINDS, isStocked, itemCostBase,
  catVersion, subscribeCats, certRuleCn, itemCertMiss, listCodeOf,
  higherLevel, lineBaseMarkup, lineMarginBelow, marginApprover, marginGuardOf, marginGuardText,
  SRV_RATES, BILL_BASIS_CN, assetPctOf, projFacilityOf, srvRateOf, wbQuoteOf,
  type BillBasis, type ProjPoint, type QuoteScopeKey, type SrvRate, type WbQuote,
} from '../components/data';
import type { Quote, QuoteLine } from '../components/data';
import { addQuote, consumePendingOppQuote, getFocus, getItems, getQuote, getQuotes, nextApprovalNo, patchQuote, pushApproval, setBizStatus, setFocus, setPendingQuote, snapshotQuoteVersion, subscribeStore } from '../components/store';
import { Ico } from '../components/icons';
import { EditDiffTable, buildEditDiff, type DiffLineView, type EditChange } from '../components/quoteEditDiff';
import { ExportButton, ExportDialog, useExport, getUserName, type ExportField } from '../components/export';
import { RecognitionWorkbench, type RecognitionField } from '../components/RecognitionWorkbench';

type Item = {
  /**
   * 所属目录 = 分类树叶子节点 ID（CAT_TREE），与物料主数据的 Item.cat 同源同一套 ID。
   * 报价科目与上浮率由它派生（quoteScopeOf / markupOf），行内不存口径结果。
   * 空字符串 = 未指定目录 —— 落在「未归类」科目，提交前必须指定，不再静默归到某个系统。
   */
  id: number; catId: string; name: string; spec: string; unit: string;
  qty: number; cost: number; markup: number; note: string;
  /**
   * 基线行序（1-based）：由「进入编辑时载入的已保存明细」按行序打上，本次新增的行没有它。
   * 「本次改动对比」靠它把草稿行认回原来的那一行 —— 而不是靠编码 / 名称对齐：
   * 编辑期把名称或目录改掉的行，必须仍被认成「这一行改了」，而不是「删一行 + 加一行」。
   */
  srcId?: number;
  /** 物料编码：来自物料库 / 项目用料时写入，用于「¥参考」三源价格查询；自定义行无编码 */
  code?: string;
  /** 手改行标记：手改成本价后批量调价不重算（对齐参考口径） */
  manual?: boolean;
  /**
   * 配置版本快照（M8）：该行由套件配置展开时，记下当时的配置版本号。
   * 配置「已被引用则升版」，若不记版本，配置升版后历史报价无法还原当时成本 —— 版本控制维度失效。
   */
  recipeVer?: string;
  /** 来源套件编码（配置版本快照的归属，用于反查该套件当前版本） */
  kitCode?: string;
  /* 维保 / 检测行的计价口径与基数（仅 SRV_RATES 登记过的服务行生效）：
     这类行的金额 = wbQuoteOf(口径, 基数)，与 qty / markup 无关。 */
  /**
   * 目录默认毛利快照（4.6）：老单子行上都记着自己建单时的目录默认值，
   * 改树上的默认毛利不会让它们一夜之间变成「严重让价」；新开的行没有快照，按当日目录值判定。
   */
  baseMarkup?: number;
  basis?: BillBasis;
  basisArea?: number;
  basisAsset?: number;
  basisPoints?: ProjPoint[];
  /** 本次编辑会话内新增行的加入序号（越大越新）：组内把新增行排到最前并按加入时间倒序；载入行无此字段 */
  addedAt?: number;
};

/** 成本参考价采纳留痕（谁 · 何时 · 旧值→新值 · 来源） */
type CostEdit = { row: string; old: number; nu: number; by: string; t: string; src: string };

/** 改动痕迹：某字段 旧值→新值（仅视觉，不落行数据） */
type CellDiff = { prev: number; cur: number };

const INIT: Item[] = [
  { id: 1, catId: 'm11', name: '点型感烟火灾探测器', spec: 'JBF-3131（含底座）', unit: '个', qty: 860, cost: 92, markup: 25, note: '' },
  { id: 2, catId: 'm11', name: '手动火灾报警按钮', spec: 'JBF-3121', unit: '个', qty: 96, cost: 118, markup: 25, note: '' },
  { id: 3, catId: 'm11', name: '火灾报警控制器（联动型）', spec: 'JB-QB-JBF-5010 · 2 回路', unit: '台', qty: 4, cost: 18600, markup: 25, note: '含配套电源盘' },
  { id: 4, catId: 'm212', name: '喷洒头（下垂型）', spec: 'ZSTX-15/68℃', unit: '个', qty: 1240, cost: 21, markup: 20, note: '' },
  { id: 5, catId: 'm22', name: '消防水泵接合器', spec: 'SQD150-A', unit: '套', qty: 6, cost: 1580, markup: 20, note: '' },
  { id: 6, catId: 'm3', name: '排烟防火阀', spec: 'FVD-70℃ · 1200×400', unit: '个', qty: 42, cost: 780, markup: 22, note: '' },
  { id: 7, catId: 'm3', name: '轴流排烟风机', spec: 'HTF-Ⅰ-No.10 · 3.0kW', unit: '台', qty: 8, cost: 8600, markup: 22, note: '含减振与软接' },
  { id: 8, catId: 'm4', name: '集中控制型应急照明控制器', spec: 'YZ-C-100', unit: '台', qty: 2, cost: 9600, markup: 18, note: '' },
  { id: 9, catId: 'm4', name: '安全出口标志灯', spec: 'LED · 集中电源型', unit: '套', qty: 186, cost: 138, markup: 18, note: '' },
  { id: 10, catId: 'm5', name: '七氟丙烷灭火装置', spec: 'GQQ-120L · 单瓶组', unit: '套', qty: 6, cost: 12800, markup: 18, note: '含管网与喷头' },
  { id: 11, catId: 'm6', name: '钢质防火门', spec: '甲级 · 1500×2100（含闭门器）', unit: '樘', qty: 24, cost: 1680, markup: 15, note: '' },
  { id: 12, catId: 'm7', name: '管道沟槽开挖与回填', spec: '深度 ≤1.2m · 含夯实', unit: '米', qty: 320, cost: 86, markup: 15, note: '' },
  { id: 13, catId: 'm7', name: '管道支吊架制安', spec: '综合支架 · 热镀锌', unit: '套', qty: 420, cost: 68, markup: 15, note: '' },
  { id: 14, catId: 'p12', name: '消防深化设计费', spec: '按建筑面积计取', unit: '项', qty: 1, cost: 68000, markup: 12, note: '图纸深化 + 报审配合' },
  { id: 15, catId: 'p22', name: '消防设施检测费', spec: '第三方检测机构', unit: '项', qty: 1, cost: 32000, markup: 12, note: '' },
];

/**
 * 明细行 id 自增计数器（模块作用域）。
 * 原先各添加入口用 `200 + i` / `300 + p.length` / `400 + items.length` 硬编码基数，会互相撞号，
 * 导致 React key 冲突与 `setIt(id)` 命中错行。
 */
let rowSeq = 1000;
const nextRowId = () => ++rowSeq;
/** 新增行加入序号（模块作用域，独立于行 id）：组内排序用，越大越新；不要用 id+长度，删行后会撞号 */
let addSeq = 0;

/** AI 识别图纸 → 识别工作台 mock 字段：一行明细的名称/规格/单位/数量/单价/备注 */
const QUOTE_RECOG_FIELDS: RecognitionField[] = [
  { key: 'name', label: '物料名称', value: '镀锌钢管', type: 'text' },
  { key: 'spec', label: '规格型号', value: 'DN50 · 热镀锌', type: 'text' },
  { key: 'unit', label: '单位', value: 'm', type: 'text' },
  { key: 'qty', label: '数量', value: '100', type: 'number' },
  { key: 'price', label: '单价（元）', value: '35.50', type: 'number' },
  { key: 'note', label: '识别备注', value: 'AI 识别：图纸标注「消防给水立管」', type: 'text' },
];

/* ------------------------------------------------------------------
 * 「目录 → 报价科目 → 默认上浮率」的换算全部由 data.ts 的 quoteScopeOf / markupOf 完成。
 * 此前本页自留了一份报价 8 目录（CAT_KEYS）与一张硬编码别名表（CAT_MAP / CAT_ALIAS / quoteCatOf），
 * 物料侧树上一改就失效，映射不到就静默回落「消防电」——曾把维保服务算成消防电 25% 而非服务费 12%。
 * 现在：**报价行只存分类树节点 ID，与物料主数据共用同一棵树**，
 * 树上挪动子树，科目归集与默认上浮率随之变化，页面上不存在任何名称映射表。
 * ------------------------------------------------------------------ */
/** 批量调价的下拉取值：科目 key（或 __all 表示整体调价） */
type BatchScope = QuoteScopeKey | '__all';

/** 报价单号：BJ + 6 位流水（取现有最大流水 + 1） */
const nextQuoteNo = () => {
  const max = getQuotes()
    .filter((q) => /^BJ\d{6}$/.test(q.id))
    .map((q) => Number(q.id.slice(2)))
    .reduce((a, b) => Math.max(a, b), 0);
  return `BJ${String(max + 1).padStart(6, '0')}`;
};

/** 生成报价审批单（提交审批 → 审批中心可见，形成正向闭环） */
const makeQuoteApproval = (ref: string, ver: string, obj: string, amt: number, level: string) => ({
  id: nextApprovalNo(),
  ap: '蓝峰', type: '报价审批', obj,
  ref: `${ref} 报价单 ${ver}`,
  amt, time: `${TODAY} 14:00`, status: '待审批',
  level: level === '—' ? '部门负责人' : level,
  node: 0, reason: '', cc: ['李思敏'],
} as Parameters<typeof pushApproval>[0]);

/* ============ 项目用料清单（原型派生） ============ */
/** 项目推荐套件：按项目编码散列取一半套件，保证不同项目用料清单不同 */
const projKitList = (projId: string) => {
  const h = [...projId].reduce((a, c) => a + c.charCodeAt(0), 0);
  const kits = KITS;
  const picked = kits.filter((_, i) => (i + h) % 2 === 0);
  return picked.length ? picked : kits.slice(0, 1);
};
/** 项目用料物料：从项目关联报价单的明细行取（matId 存在的行） */
const projMatList = (projId: string) => {
  const q = QUOTES.find((x) => x.projectId === projId);
  if (!q?.lines) return [];
  const matCodes = q.lines.filter((ln) => ln.matId).map((ln) => ln.matId!);
  return MATERIALS.filter((m) => matCodes.includes(m.code));
};

export default function QuoteEditPage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  /**
   * 编辑目标：由报价台账「编辑」经 setFocus('quote-edit', id) 传入；取不到 = 新建模式。
   * 修复前本页永远加载硬编码的 INIT 15 行 + 固定表头 —— 点哪张报价单进来都显示同一份。
   */
  const editing = useMemo(() => {
    const id = getFocus('quote-edit');
    return id ? getQuote(id) : null;
  }, [nav]);
  /** store 变更脉冲：物料页新增 / 停用物料后，本页物料库候选即时跟随 */
  const [tick, setTick] = useState(0);
  useEffect(() => subscribeStore(() => setTick((n) => n + 1)), []);
  /** 分类树变更脉冲：树上新增 / 改名 / 挪子树后，本页的目录下拉与科目归集即时跟随 */
  useSyncExternalStore(subscribeCats, catVersion, catVersion);
  /** 目录下拉选项（只给叶子，label 为完整多级路径）——读同一棵树，随上面的脉冲重算 */
  const catLeafOpts = useMemo(() => catLeafOptions(), [tick]);
  /* L0 头部：默认全部留空。修复前写死「昆明市第一人民医院 / SJ000470 / ××住院楼报价」，
     任意入口（含商机转报价）进来都带着同一份业务数据，且报价被静默挂到 SJ000470 名下。 */
  const [customer, setCustomer] = useState('');
  const [opp, setOpp] = useState('');
  const [pType, setPType] = useState('改造');
  const [qName, setQName] = useState('');
  // 高级
  const [adv, setAdv] = useState(false);
  const [upMode, setUpMode] = useState('整体比例');
  const [upRate, setUpRate] = useState(20);
  const [valid, setValid] = useState('+30 天');
  const [taxRate, setTaxRate] = useState(9);
  const [linkedProj, setLinkedProj] = useState('');
  const [showSpec, setShowSpec] = useState(true);
  const [showNote, setShowNote] = useState(true);
  const [exTax, setExTax] = useState(false);
  // 批量调价
  /** 批量调价的作用范围：报价科目 key（__all = 整体调价），不再是写死的中文目录名 */
  const [bCat, setBCat] = useState<BatchScope>('fireelec');
  const [bMode, setBMode] = useState<'rate' | 'price'>('rate');
  const [bRate, setBRate] = useState(25);
  const [bPrice, setBPrice] = useState(0);
  // 明细
  const [items, setItems] = useState<Item[]>([]);
  /**
   * 本次编辑的对比基线：进入编辑时的已保存明细（新建模式为空）。
   * 保存成功后基线前移 —— 「改动对比」始终回答「相对上次保存改了什么」，
   * 而不是把已经存下去的内容一直挂在清单里当未保存改动。
   */
  const [baseLines, setBaseLines] = useState<QuoteLine[]>([]);
  const [diffOpen, setDiffOpen] = useState(false);
  /* —— 改动痕迹（编辑态视觉，不落行数据）：key=`${rowId}:${field}`，field ∈ qty/cost/price/amt ——
     上浮率不参与标记（保留其区间色）；金额/上浮单价为派生值，随 数量/成本参考价 联动。 */
  const [diffMap, setDiffMap] = useState<Map<string, CellDiff>>(new Map());
  /** 批量调价应用前的命中行快照：供「重置」仅回退本次批量调价产生的改动（手改痕迹保留） */
  const batchSnapRef = useRef<{ rows: { id: number; markup: number }[]; prevDiffs: Map<string, CellDiff> } | null>(null);
  const [canResetBatch, setCanResetBatch] = useState(false);
  /** items 最新值引用：onBlur 闭包可能拿到旧渲染的 it，这里取最新 */
  const itemsRef = useRef<Item[]>(items);
  useEffect(() => { itemsRef.current = items; }, [items]);
  /** 聚焦瞬间快照：失焦时与最新值比对，得出 prev/cur */
  const snapRef = useRef<Map<string, { qty: number; cost: number; price: number; amt: number }>>(new Map());
  // 弹窗
  const [addOpen, setAddOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [refOpen, setRefOpen] = useState<Item | null>(null);
  /** 成本参考价采纳 / 修改留痕（含来源），对齐参考口径 */
  const [costHist, setCostHist] = useState<CostEdit[]>([]);
  /* —— 从项目拉取用料 —— */
  const [projOpen, setProjOpen] = useState(false);
  const [projPick, setProjPick] = useState(PROJECTS[0]?.id || '');
  /** 项目关联报价单的明细映射：matId → { qty, cost, markup, price, catId } */
  const quoteMap = useMemo(() => {
    const m: Record<string, { qty: number; cost: number; markup: number; price: number; catId: string }> = {};
    const q = QUOTES.find((x) => x.projectId === projPick) || QUOTES.find((x) => x.lines && x.bidId);
    (q?.lines ?? []).forEach((ln) => { if (ln.matId) m[ln.matId] = { qty: ln.qty, cost: ln.cost, markup: ln.markup, price: ln.price, catId: ln.catId }; });
    return m;
  }, [projPick]);
  /** 已勾选的用料编码（套件 = CP 编码 / 物料 = CL 编码） */
  const [projSel, setProjSel] = useState<Set<string>>(new Set());
  /** 套件带入方式：expand 展开为物料明细 / whole 整体带入 1 行 */
  const [kitMode, setKitMode] = useState<Record<string, 'expand' | 'whole'>>({});
  const [kitLineQty, setKitLineQty] = useState<Record<string, number>>({});
  const [matLineQty, setMatLineQty] = useState<Record<string, number>>({});
  const [submitOpen, setSubmitOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [aiRun, setAiRun] = useState(false);
  const [aiPicked, setAiPicked] = useState<{ name: string; qty: number; unit: string }[]>([]);
  const [matKw, setMatKw] = useState('');
  const [matPick, setMatPick] = useState<string[]>([]);
  const [cName, setCName] = useState(''); const [cSpec, setCSpec] = useState(''); const [cUnit, setCUnit] = useState('项');
  const [cQty, setCQty] = useState(1); const [cCost, setCCost] = useState(0); const [cCat, setCCat] = useState('p12');
  const [miss, setMiss] = useState<number[]>([]);
  // 新增：打印留痕 / 版本管理 / 转合同（原子事务）/ 报价审批 / 独立新建报价单
  const [printOpen, setPrintOpen] = useState(false);
  const [verOpen, setVerOpen] = useState(false);
  const [saveChoiceOpen, setSaveChoiceOpen] = useState(false);
  const [cvtOpen, setCvtOpen] = useState(false);
  const [apprOpen, setApprOpen] = useState(false);
  const [newQOpen, setNewQOpen] = useState(false);
  const [nqName, setNqName] = useState('');
  const [nqCust, setNqCust] = useState('');
  const [nqType, setNqType] = useState('改造');
  const [matCat, setMatCat] = useState<BatchScope>('__all');
  /** 选料抽屉的类型筛选：物料 / 服务 / 套件（默认全部类型） */
  const [matTy, setMatTy] = useState('全部类型');
  /** 项目面积（㎡）：工程费单方造价的分母，落到 Quote.area 供报价详情 / 历史参照使用 */
  const [area, setArea] = useState(0);

  /* ---------- 载入编辑目标（明细已落库 → 回到工作台无损还原 cost / markup） ---------- */
  useEffect(() => {
    /* ⚠️ 载入行与对比基线必须「同源派生」：
       ① 起步行（INIT 15 行）**只服务「新建报价单」**。已有单据一律按落库明细如实还原 ——
          打开一张明细尚未落库的旧单（如草稿 BJ000017 · total 0）时若也塞起步行，
          页面合计会凭空变成 ¥739,015，与台账的 ¥0 对不上：那不是这张单的内容。
       ② 原先写成 `if (editing.lines?.length) { setItems(...) }`：条件不成立时 items 不重置，
          「编辑完 BJ000021（9 行）→ 返回 → 新建报价单」会把上一张单的明细留在新单里。
       起步行必须补 srcId（载入行序）：改动对比靠 srcId 配对，缺了它每行都会落成「新增」。
       基线口径与保存后的 rebase() 完全一致 —— 进页即「相对上次保存零改动」。 */
    const ls = editing?.lines ?? [];
    const starter = editing ? [] : INIT;
    const rows: Item[] = ls.length
      ? ls.map((l, i) => ({
          /* srcId 与 id 同为「载入行序」，但语义不同：id 是 React key / setIt 的定位键（新增行会另发号），
             srcId 只用于改动对比配对，一旦载入就不再变 —— 中间插行 / 删行都不会错位。 */
          id: i + 1, srcId: i + 1, catId: l.catId ?? '', name: l.name, spec: l.spec ?? '', unit: l.unit,
          qty: l.qty, cost: l.cost, markup: l.markup, note: l.note ?? '', code: l.matId,
          recipeVer: l.recipeVer, kitCode: l.kitCode, baseMarkup: l.baseMarkup,
          /* 计价行的口径与基数随行还原，否则回到工作台后维保行会退回「按数量 × 成本」算错钱 */
          basis: l.basis, basisArea: l.basisArea, basisAsset: l.basisAsset, basisPoints: l.basisPoints,
        }))
      : starter.map((it, i) => ({ ...it, srcId: i + 1 }));
    setItems(rows);
    setBaseLines(
      ls.length
        ? ls /* 已落库明细原样作基线：price 是保存当日的价格（试算价行也含在内） */
        : starter.map((it) => ({
            catId: it.catId, name: it.name, spec: it.spec, unit: it.unit,
            qty: it.qty, cost: it.cost, markup: it.markup,
            /* 起步行按普通行计价：price = 成本 ×（1 + 上浮率），与 line() 同口径 */
            price: Math.round((it.cost + (it.cost * it.markup) / 100) * 100) / 100,
            note: it.note || undefined,
          })),
    );
    if (!editing) return;
    setCustomer(editing.customer);
    setOpp(editing.opp);
    setQName(editing.name);
    setTaxRate(editing.taxRate);
    setUpRate(editing.markup || 20);
    setArea(editing.area ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav]);

  /* ---------- 商机 → 转报价：从商机详情跳转过来时预填客户 / 商机外键 / 报价名称 ----------
     修复前商机「去报价」只 toast 后裸跳，不带商机号，本页「关联商机」回落写死的 SJ000470，
     任意商机转出来的报价都挂到同一个商机下，「商机 → 报价」这条边名存实亡。
     消费式读取：读后立即清除，避免下次独立进入也误预填。 */
  useEffect(() => {
    const p = consumePendingOppQuote();
    if (!p) return;
    setCustomer(p.customer);
    setOpp(p.oppId);
    setQName(`${p.name}报价`);
    toast(`已带入商机 ${p.oppId}「${p.name}」的客户与预计金额 ¥${(p.amt || 0).toLocaleString('en-US')}；明细请按勘察清单逐条编制`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav]);

  /* ---------- 物料库候选：读共享 store 且只取「启用」物料 ----------
     修复两处缺陷：① 原先只读 data.ts 常量 MATERIALS，物料页新维护的物料选不到、停用的物料照样能选；
     ② 原先「目录」筛选拿物料分类码（m21）去比报价目录名（消防水），永远筛不出结果。 */
  const matCandidates = useMemo(() => {
    /* 三类主数据全部可选：物料按含税采购价、服务按人工构成、套件按配置展开计价。
       修复缺陷：原先白名单只放「物料」，报价 8 目录里的「服务费」格永远只能靠手输
       自定义行 —— 维保 / 检测 / 深化设计等服务型主数据维护了却选不到，即「物料与服务没对应」。 */
    const active = getItems().filter((m) => m.status === '启用' && (matTy === '全部类型' || m.ty === matTy));
    return active.filter((m) => {
      if (matCat !== '__all' && quoteScopeOf(m.cat) !== matCat) return false;
      return !matKw || (m.name + m.code + (m.spec || '')).includes(matKw);
    });
  }, [matCat, matKw, matTy, nav, tick]);

  /* 物料库候选分页：Drawer 内一次渲染全部候选过长，按页切分 + TableFoot 紧凑展示 */
  const matPaged = usePaged(matCandidates, 10);

  /* ---------- 派生计算（只读，不可手填） ---------- */
  /**
   * 维保 / 检测行（SRV_RATES 登记过且口径非按数量）不按「数量 × 单价」计价 ——
   * 钱是按服务对象的规模算的：建筑面积（阶梯）/ 设施点位 / 设施资产造价百分比。
   * 这类行**不再叠加 markup（上浮率）**：试算结果就是对甲方的报价，再乘一次等于二次加价。
   */
  const isRateRow = (it: Item) => !!srvRateOf(it.code) && !!it.basis && it.basis !== 'unit';
  type LineCalc = { price: number; amt: number; before: number; rate?: SrvRate; q?: WbQuote };
  const line = (it: Item): LineCalc => {
    if (isRateRow(it)) {
      const q = wbQuoteOf(it.code!, { area: it.basisArea, points: it.basisPoints, assetAmt: it.basisAsset }, it.basis);
      /* before（上浮前金额）只对「数量 × 单价」行成立；试算价行不走上浮，置 0，
         页面按 isRateRow 显示「—」，不再把成本参考价冒充成上浮前金额。 */
      return { price: q.total, amt: q.total, before: 0, rate: srvRateOf(it.code), q };
    }
    const uplift = it.cost * (it.markup / 100);
    const price = it.cost + uplift;
    return { price, amt: price * it.qty, before: it.cost * it.qty };
  };
  const sumExTax = items.reduce((a, it) => a + line(it).amt, 0);
  const tax = exTax ? (sumExTax * taxRate) / 100 : (sumExTax * taxRate) / (100 + taxRate);
  // Q2：原三元两分支同值（含税口径下价税合计恒等于不含税合计），税额未计入总价。
  // 修正口径：不含税价报价 → 价税合计 = 不含税合计 + 税额；含税价报价 → 价税合计 = 含税合计（税额已内含）。
  const total = exTax ? sumExTax + tax : sumExTax;
  const costTotal = items.reduce((a, it) => a + it.cost * it.qty, 0);
  const grossMarkup = costTotal ? ((sumExTax - costTotal) / costTotal) * 100 : 0;
  // 双触发判定 —— 与报价台账共用 data.ts 的 quoteTrigger（此前此处写 grossMarkup >= 30，方向与台账相反）
  const hit = quoteTrigger({ markup: grossMarkup, total: sumExTax }, role).need;
  const hitWhy = quoteTrigger({ markup: grossMarkup, total: sumExTax }, role).why;

  /**
   * 毛利分层治理（4.6）：跟着明细逐笔实时算 —— 每改一行的浮率，
   * 「低于目录标准多少、要走哪一级特批」当场结果出来，业务员不必等到提交才知道触线。
   * 判定与措辞全部取自 data.ts，工作台只做展示与拦截。
   */
  const guard = useMemo(() => marginGuardOf({ lines: items }), [items]);
  /** 让价理由（低于目录默认毛利时必填，随审批单进入审批链） */
  const [guardReason, setGuardReason] = useState('');
  /**
   * 本单最终的审批路由：金额别（approveLevel）与毛利偏离别（guard.level）取较高的一级。
   * 全页只在此处做这一次比较，三处 Banner / KvGrid / 落库全部引用它 —— 避免同一张单在
   * 「提示条」和「审批单」里出现两个不同的路由级别。
   */
  const routeLvl = higherLevel(hit ? approveLevel(sumExTax) : '—', guard.level);

  const setIt = (id: number, patch: Partial<Item>) => setItems((p) => p.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  /* ---------- 改动痕迹：聚焦快照 → 失焦比对（仅 数量 / 成本参考价 / 上浮单价 / 金额） ---------- */
  const focusSnap = (id: number, kind: 'qty' | 'cost') => {
    const row = itemsRef.current.find((r) => r.id === id);
    if (!row) return;
    const l = line(row);
    snapRef.current.set(`${kind}-${id}`, { qty: row.qty, cost: row.cost, price: l.price, amt: l.amt });
  };
  const blurRec = (id: number, kind: 'qty' | 'cost') => {
    const snap = snapRef.current.get(`${kind}-${id}`);
    if (!snap) return;
    snapRef.current.delete(`${kind}-${id}`);
    const curRow = itemsRef.current.find((r) => r.id === id);
    if (!curRow) return;
    const nl = line(curRow);
    setDiffMap((m) => {
      const n = new Map(m);
      const set = (key: string, prev: number, cur: number) => {
        if (prev === cur) { n.delete(key); return; }
        const ex = n.get(key);
        n.set(key, { prev: ex?.prev ?? prev, cur });
      };
      if (kind === 'qty') {
        set(`qty-${id}`, snap.qty, curRow.qty);
        set(`amt-${id}`, snap.amt, nl.amt);
      } else {
        set(`cost-${id}`, snap.cost, curRow.cost);
        set(`price-${id}`, snap.price, nl.price);
        set(`amt-${id}`, snap.amt, nl.amt);
      }
      return n;
    });
  };
  const enterBlur = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
  };
  /** 清除某行全部痕迹（删行时调用） */
  const clearRowDiff = (id: number) => setDiffMap((m) => {
    const n = new Map(m);
    [`qty-${id}`, `cost-${id}`, `price-${id}`, `amt-${id}`].forEach((k) => n.delete(k));
    return n;
  });
  /* 有未保存改动时离开页面提示 */
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (diffMap.size > 0) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [diffMap.size]);

  /* 版本记录（多轮报价逐版留痕，可对比追溯） */
  /**
   * 版本历史：读该报价单落库的版本快照（Quote.versions），不再写死两行「李思敏」的假版本 ——
   * 原来无论编辑哪张报价单，版本管理弹窗都显示同两行，且金额由当前明细硬乘 1.08 凑出来。
   * 未留存快照时（历史存量单）退化为「当前编辑内容」一行，并说明无历史可追溯。
   */
  const VERSIONS = useMemo(() => {
    const q = editing ? getQuote(editing.id) : null;
    const list = (q?.versions ?? []).slice().sort((a, b) => verNo(b.ver) - verNo(a.ver));
    if (!list.length) {
      return [{
        v: q?.ver ?? 'V1', at: TODAY, by: '当前用户',
        amt: Math.round(sumExTax), note: '当前编辑内容（本单未留存历史版本快照）', st: '草稿',
      }];
    }
    return list.map((v) => ({
      v: v.ver, at: v.at, by: v.by, amt: v.amt, note: v.note,
      st: v.ver === q?.ver ? '当前' : '已归档',
    }));
  }, [editing, tick, sumExTax]);
  /** 下一版版本号：版本管理弹窗的「生成新版本」按当前 ver +1 推导，不写死 V3 */
  const nextVerNo = `V${verNo(editing?.ver ?? 'V1') + 1}`;

  /**
   * 打印预览下方的「价格口径说明」。
   * 维保 / 检测的三套计价口径（面积阶梯 / 设施点位 / 设施造价）各自的计量语言不同，
   * 条款必须按本单**实际采用**的口径逐项陈述 —— 统一写成一句「按合同约定」，
   * 客户既核不了价，履约期间面积或点位变动时也找不到重计价的依据。
   * 没有服务行的纯物料报价单不出现这些条款，避免印出空话。
   */
  const PRINT_TERMS = useMemo(() => {
    const terms: string[] = [
      `本报价为${exTax ? '不含税价（明确标注）' : '含税价'}，税率 ${taxRate}%，税额 ${fmt(tax)} 元。`,
      `报价有效期：自报价之日起 ${valid} 内有效。`,
      '交货方式及地点：按合同约定执行。',
      '付款方式：按合同约定执行。',
    ];
    items.filter(isRateRow).forEach((it) => {
      const L = line(it);
      const r = L.rate!;
      const q = L.q!;
      const per = r.period === '年' ? '服务周期 1 年' : '按次计费';
      /* 基数为空时不许印出「0 ㎡ / 0 点」这种看着像算过、实则没依据的话 ——
         原型里有本单未关联项目台账的情形，纸上必须如实交代「待踏勘后按实结算」。 */
      const noBase = q.rows.length === 0;
      if (noBase) {
        terms.push(
          `「${it.name}」选定${BILL_BASIS_CN[q.basis]}计价，但本单尚未关联到项目的${q.basis === 'point' ? '点位' : q.basis === 'area' ? '面积' : '投资额'}台账，`
          + `计量基数待现场踏勘确认后补充，该行暂列 0 元、按实结算，不列入本次报价承诺。`,
        );
      } else if (q.basis === 'area') {
        const area = it.basisArea ?? 0;
        const ts = r.tiers ?? [];
        const tier = ts.find((x) => area <= x.to) ?? ts[ts.length - 1];
        const range = tier
          ? `，属 ${tier.from.toLocaleString('en-US')}–${tier.to === Infinity ? '以上' : tier.to.toLocaleString('en-US')} ㎡ 阶梯档`
          : '';
        terms.push(
          `「${it.name}」${BILL_BASIS_CN[q.basis]}计价：以建筑面积 ${area.toLocaleString('en-US')} ㎡ 为计量基数，`
          + `单价 ${(q.rows[0]?.unitPrice ?? 0).toFixed(2)} 元/㎡${range}，${per}；报价金额随面积变化按同一阶梯重算，不因数量调整。`,
        );
      } else if (q.basis === 'point') {
        const sum = (it.basisPoints ?? []).reduce((s, p) => s + p.qty, 0);
        terms.push(
          `「${it.name}」${BILL_BASIS_CN[q.basis]}计价：以现场消防设施点位 ${sum.toLocaleString('en-US')} 点为计量基数`
          + `（${q.rows.map((x) => `${x.label} ${x.qty.toLocaleString('en-US')} ${x.unit} × ${x.unitPrice} 元`).join('、')}），${per}；`
          + '履约期内新增或拆除点位，按变动后的实测台账重新计量。',
        );
      } else {
        const asset = it.basisAsset ?? 0;
        terms.push(
          `「${it.name}」${BILL_BASIS_CN[q.basis]}计价：以消防设施投资额 ${fmt(asset)} 元为基数，`
          + `按 ${assetPctOf(r, asset)}% 费率分档累进计取，${per}；该口径为全包型服务（含配件更换与驻点值守），与按面积 / 点位口径的常规巡检不可混合比价。`,
        );
      }
      /* 触发最低限价的服务必须把保底规则印在纸上，否则后期按保底价结算会被甲方理解为违约加价 */
      if (q.hitMin) {
        terms.push(`上述「${it.name}」按口径试算为 ${fmt(q.subtotal)} 元，低于最低受托价，已按 ${fmt(q.minFee)} 元保底计价。`);
      }
    });
    return terms;
    /* line / isRateRow 是随 props 重建的纯函数，items 即可覆盖全部变化源 */
  }, [items, exTax, taxRate, tax, valid]);

  const applyCat = () => {
    const isAll = bCat === '__all';
    const name = isAll ? '' : scopeName(bCat);
    const hitRows = isAll ? items : items.filter((it) => quoteScopeOf(it.catId) === bCat);
    if (!hitRows.length) { toast(isAll ? '暂无明细行' : `科目「${name}」下暂无明细行`); return; }
    /* 先纯计算 nextItems，再据真实 line() 重算结果记录 上浮单价/金额 痕迹（批量调价 = 改单价） */
    const nextItems = items.map((it) => {
      if (!isAll && quoteScopeOf(it.catId) !== bCat) return it;
      if (bMode === 'rate') return { ...it, markup: bRate };
      const price = it.cost + (it.markup / 100) * it.cost;
      return { ...it, markup: price ? Math.max(0, ((bPrice - it.cost) / it.cost) * 100) : it.markup };
    });
    /* 只统计「实际变化」的行：目标值 == 现值时不落痕迹、不夸大成"已应用" */
    let changedRows = 0;
    const changedSnap: { id: number; markup: number }[] = [];
    const prevDiffs = new Map<string, CellDiff>();
    hitRows.forEach((it) => {
      const prevL = line(it);
      const nextIt = nextItems.find((x) => x.id === it.id)!;
      const nextL = line(nextIt);
      if (nextL.price !== prevL.price || nextL.amt !== prevL.amt) {
        changedRows++;
        changedSnap.push({ id: it.id, markup: it.markup });
        const pk = `price-${it.id}`, ak = `amt-${it.id}`;
        if (diffMap.has(pk)) prevDiffs.set(pk, diffMap.get(pk)!);
        if (diffMap.has(ak)) prevDiffs.set(ak, diffMap.get(ak)!);
      }
    });
    /* 目标值与现值完全相同：不写 items、不留痕迹，如实提示无变化 */
    if (!changedRows) {
      toast(`目标${bMode === 'rate' ? `上浮率 ${bRate}%` : `上浮单价 ¥${bPrice}`} 与当前值相同，无变化`);
      return;
    }
    setDiffMap((m) => {
      const n = new Map(m);
      hitRows.forEach((it) => {
        const prevL = line(it);
        const nextIt = nextItems.find((x) => x.id === it.id)!;
        const nextL = line(nextIt);
        if (nextL.price !== prevL.price) n.set(`price-${it.id}`, { prev: prevL.price, cur: nextL.price });
        if (nextL.amt !== prevL.amt) n.set(`amt-${it.id}`, { prev: prevL.amt, cur: nextL.amt });
      });
      return n;
    });
    /* 应用前快照：仅记实际变化行的原 markup 与被覆盖前的旧痕迹，供「重置」精确回退 */
    batchSnapRef.current = { rows: changedSnap, prevDiffs };
    setCanResetBatch(true);
    setItems(nextItems);
    toast(`已${isAll ? '整体调价' : `应用于「${name}」科目`} ${changedRows} 条明细（覆盖原上浮率，非累计）`);
  };

  /** 重置：恢复本次批量调价应用前的命中行上浮率（单价/金额随之重算），并清除本次应用产生的痕迹；手改痕迹保留 */
  const resetBatch = () => {
    const snap = batchSnapRef.current;
    if (!snap) { toast('尚未执行批量调价'); return; }
    setItems((p) => p.map((it) => {
      const s = snap.rows.find((r) => r.id === it.id);
      return s ? { ...it, markup: s.markup } : it;
    }));
    setDiffMap((m) => {
      const n = new Map(m);
      snap.rows.forEach((r) => { n.delete(`price-${r.id}`); n.delete(`amt-${r.id}`); });
      snap.prevDiffs.forEach((v, k) => n.set(k, v));
      return n;
    });
    batchSnapRef.current = null;
    setCanResetBatch(false);
    toast('已恢复应用前状态');
  };

  const useCatDef = () => {
    if (bCat === '__all') { toast('请选择具体科目后再带出默认上浮率', 'err'); return; }
    const v = scopeMarkup(bCat);
    setBRate(v);
    toast(`已带出「${scopeName(bCat)}」科目默认上浮率 ${v}%`);
  };


  const doAI = () => {
    setAiRun(true);
    setTimeout(() => {
      const add: Item[] = [
        { id: nextRowId(), catId: 'm11', name: '消防应急广播扬声器', spec: '3W · 吸顶式', unit: '个', qty: 68, cost: 96, markup: 25, note: 'AI 识别：图纸标注「应急广播」', addedAt: ++addSeq },
        { id: nextRowId(), catId: 'm211', name: '减压孔板', spec: 'DN100', unit: '个', qty: 14, cost: 168, markup: 20, note: 'AI 识别：图纸标注「减压」', addedAt: ++addSeq },
        { id: nextRowId(), catId: 'm3', name: '止回阀', spec: 'DN800 · 排烟系统', unit: '个', qty: 6, cost: 1240, markup: 22, note: 'AI 识别：风管节点', addedAt: ++addSeq },
      ];
      setItems((p) => [...p, ...add]);
      setAiRun(false); setAiPicked(add.map((a) => ({ name: a.name, qty: a.qty, unit: a.unit })));
      toast('AI 已识别图纸并生成 3 条明细，请逐条核对规格与数量');
    }, 700);
  };

  /** 识别工作台「全部确认并写入」：把核对后的字段转成 1 行报价明细 append 进去 */
  const onQuoteRecog = (fs: RecognitionField[]) => {
    const get = (k: string) => fs.find((f) => f.key === k)?.value ?? '';
    const row: Item = {
      id: nextRowId(), catId: 'm11',
      name: get('name') || '未命名明细', spec: get('spec'), unit: get('unit') || '项',
      qty: parseFloat(get('qty')) || 1, cost: parseFloat(get('price')) || 0,
      markup: 20, note: get('note') || 'AI 识别写入', addedAt: ++addSeq,
    };
    setItems((p) => [...p, row]);
    toast('已从识别结果写入 1 行明细，请核对规格与单价');
  };

  /**
   * 登记了计价方案的维保 / 检测服务：落行即进入该服务的默认口径，
   * 并把项目台账的建筑面积 / 点位 / 设施投资一并带上做计量基数。
   * 不做这一步的话，这类行会先按「参考成本 + 上浮率」计价 —— 与它的真实报价方式不是一回事。
   */
  const rateRowOf = (code?: string, pid?: string): Partial<Item> => {
    const rate = srvRateOf(code);
    if (!rate) return {};
    const p = projFacilityOf(pid);
    return {
      basis: rate.basis,
      basisArea: p?.builtArea,
      basisPoints: p?.points,
      basisAsset: p?.assetAmt,
    };
  };

  const addFromMat = () => {
    if (!matPick.length) { toast('请先勾选物料'); return; }
    const all = getItems();
    const add: Item[] = matPick.map((id) => {
      const m = all.find((x) => x.id === id || x.code === id);
      /* 直接用物料主数据自己的目录（同一棵树、同一套 ID），不做任何名称转换 ——
         这就是「报价与物料同源」的落点：物料在树上挪了分类，报价行的目录随之归位。 */
      const catId = m?.cat ?? '';
      return {
        id: nextRowId(), catId, name: m?.name ?? '物料', spec: m?.spec ?? '', unit: m?.unit ?? '个',
        /* 数量默认填 1：报价数量是「需求量」，不能拿库存量当默认值 */
        qty: 1, cost: m ? itemCostBase(m) : 0, markup: catDefaultMarkup(catId), note: `来自${m?.ty ?? '物料'}主数据`,
        addedAt: ++addSeq,
        code: m?.code,
        /* 套件记 kitCode 身份：既用于展开查看构成，也用于报价引用留痕 */
        kitCode: m?.ty === '套件' ? m.code : undefined,
        ...rateRowOf(m?.code, editing?.projectId),
      } as Item;
    });
    setItems((p) => [...p, ...add]);
    setAddOpen(false); setMatPick([]);
    toast(`已添加 ${add.length} 条明细（自动带出编码 / 规格 / 单位 / 目录 / 成本参考价）`);
  };

  /**
   * 切换项目 → 重置勾选状态并默认全选该项目下的套件、配置行与物料。
   * 配置行（kitCode__行序）必须一并选上，否则「展开为物料明细」会一条都拉不进来 ——
   * 套件主行勾选与否只决定整包行，构成部分组成 driven by 行级勾选。
   */
  const pickProject = (pid: string) => {
    setProjPick(pid);
    setKitMode({}); setMatLineQty({}); setKitLineQty({});
    const s = new Set<string>();
    projKitList(pid).forEach((k) => {
      s.add(k.code);
      const ver = RECIPES[k.code]?.versions.find((v) => v.v === RECIPES[k.code]?.cur);
      (ver?.lines ?? []).forEach((_, li) => s.add(`${k.code}__${li}`));
    });
    projMatList(pid).forEach((m) => s.add(m.code));
    setProjSel(s);
  };

  /** 从项目拉取用料 → 生成报价明细
   *  优先读该项目关联报价单的实际明细（数量/成本/上浮率），二次编辑直接基于历史数据 */
  const addFromProj = () => {
    if (!projSel.size) { toast('请先勾选用料'); return; }
    const proj = PROJECTS.find((p) => p.id === projPick);

    /* 找到项目关联的报价单，构建 matId → 历史数量/成本/上浮率映射 */
    const projQuote = QUOTES.find((q) => q.projectId === projPick)
      || QUOTES.find((q) => q.bidId && q.lines);
    const quoteMap: Record<string, { qty: number; cost: number; markup: number; price: number; catId: string }> = {};
    (projQuote?.lines ?? []).forEach((ln) => {
      if (ln.matId) quoteMap[ln.matId] = { qty: ln.qty, cost: ln.cost, markup: ln.markup, price: ln.price, catId: ln.catId };
    });

    const add: Item[] = [];
    projKitList(projPick).filter((k) => projSel.has(k.code)).forEach((k) => {
      const R = RECIPES[k.code];
      const ver = R?.versions.find((v) => v.v === R.cur);
      /**
       * 套件带入的两种粒度（用户在用料清单里按套件切换）：
       *   whole  整包行 —— 一行 = 一个套件，取配置展开成本自动合计，保留 kitCode + recipeVer 身份；
       *   expand 展开 —— 按当前生效配置逐行摊平为物料 / 服务。
       * 此前无论用户选哪种都只走 expand，套件身份退化为备注里的一句文本，
       * 既不能按套整包报价，也无法回溯这行从哪个套件、哪个配置版本来的。
       */
      if (kitMode[k.code] === 'whole') {
        const catId = k.cat ?? '';
        const lines = ver?.lines ?? [];
        add.push({
          id: nextRowId(),
          addedAt: ++addSeq,
          catId,
          name: k.name, spec: `${lines.length || 0} 项构成 · ${k.spec}`.trim(), unit: k.unit,
          qty: 1,
          cost: itemCostBase(k),
          markup: catDefaultMarkup(catId),
          note: `来自项目 ${projPick} · 套件整包（${k.code} ${ver?.v ?? '—'}）${projQuote ? `（报价 ${projQuote.id} 历史）` : ''}`,
          code: k.code,
          kitCode: k.code,
          recipeVer: ver?.v,
        });
        return;
      }
      (ver?.lines ?? []).forEach((l, li) => {
        const m = itemByCode(l.code);
        if (!m) return;
        const hist = quoteMap[l.code];
        /* 行键与抽屉里的配置行勾选一致：`套件编码__行序`（编码可能重复，按行序才唯一） */
        const lineKey = `${k.code}__${li}`;
        if (!projSel.has(lineKey)) return;
        add.push({
          id: nextRowId(),
          addedAt: ++addSeq,
          /* 目录取物料主数据自身的归属，与「物料 / 套件同源一棵树」保持一致 */
          catId: m.cat ?? '',
          name: m.name, spec: m.spec, unit: m.unit,
          qty: hist?.qty ?? (kitLineQty[lineKey] ?? l.qty),
          cost: hist?.cost ?? itemCostBase(m),
          markup: hist?.markup ?? catDefaultMarkup(m.cat),
          note: `来自项目 ${projPick} · 套件「${k.name}」${projQuote ? `（报价 ${projQuote.id} 历史）` : ''}`,
          code: m.code,
          kitCode: k.code,
          recipeVer: ver?.v,
        });
      });
    });
    projMatList(projPick).filter((m) => projSel.has(m.code)).forEach((m) => {
      const hist = quoteMap[m.code];
      add.push({
        id: nextRowId(),
        addedAt: ++addSeq,
        catId: m.cat ?? '',
        name: m.name, spec: m.spec, unit: m.unit,
        qty: matLineQty[m.code] ?? hist?.qty ?? 10,
        cost: hist?.cost ?? itemCostBase(m),
        markup: hist?.markup ?? catDefaultMarkup(m.cat),
        note: `来自项目 ${projPick}${projQuote ? ` · 报价 ${projQuote.id} 历史` : ''}`,
        code: m.code,
        ...rateRowOf(m.code, projPick),
      });
    });
    setItems((p) => [...p, ...add]);
    setProjOpen(false); setProjSel(new Set()); setKitMode({}); setKitLineQty({}); setMatLineQty({});
    toast(`已从项目 ${projPick} 拉取 ${add.length} 条报价明细${projQuote ? `（含报价 ${projQuote.id} 历史数量与单价）` : ''}`);
  };

  const addCustom = () => {
    if (!cName.trim() || !cCost) { toast('名称与成本参考价必填'); return; }
    /* 自编行必须落在具体目录：留悬念会导致科目归集失准，也过不了提交拦截 */
    if (!cCat) { toast('请先选择所属目录（最细一级）', 'err'); return; }
    setItems((p) => [...p, { id: nextRowId(), addedAt: ++addSeq, catId: cCat, name: cName, spec: cSpec, unit: cUnit, qty: cQty, cost: cCost, markup: catDefaultMarkup(cCat), note: '手输自定义行' }]);
    setCustomOpen(false); setCName(''); setCSpec(''); setCQty(1); setCCost(0);
    toast('自定义行已添加');
  };

  /**
   * 已停用物料集合（H8）：明细行引用的物料被停用后，行内标红并在提交时硬阻断。
   * 修复前工作台只读物料常量、不筛 status —— 停用物料仍可被报价选中，且引用后毫无提示。
   */
  const deadCodes = useMemo(
    () => new Set(getItems().filter((i) => i.status === '停用').map((i) => i.code)),
    [tick, nav],
  );

  const preSubmit = () => {
    const m = items.filter((it) => !it.name.trim() || !it.qty || !it.cost).map((it) => it.id);
    setMiss(m);
    if (m.length) { toast(`有 ${m.length} 行缺少必填（名称 / 数量 / 成本参考价），已红框定位`); return; }
    const dead = items.filter((it) => it.code && deadCodes.has(it.code));
    if (dead.length) {
      toast(`有 ${dead.length} 行引用的物料已停用（${dead.map((it) => it.code).join('、')}），请替换为在用物料后再提交`);
      return;
    }
    /* 维保 / 检测行必须有计量基数才能出价：没有面积 / 点位台账 = 报价无依据，
       此时行数还会如实影响到 cent/month —— 缺一行 = 少算一块钱。 */
    const noBasis = items.filter((it) => {
      if (!isRateRow(it)) return false;
      const q = wbQuoteOf(it.code!, { area: it.basisArea, points: it.basisPoints, assetAmt: it.basisAsset }, it.basis);
      return !(q.total > 0);
    });
    if (noBasis.length) {
      setMiss(noBasis.map((it) => it.id));
      toast(`有 ${noBasis.length} 行维保 / 检测服务缺少计量基数（建筑面积 / 点位台账 / 设施造价），请在行下补录后提交`, 'err');
      return;
    }
    const below = items.filter((it) => line(it).price < it.cost);
    if (below.length) { toast(`${below.length} 行报价价低于成本价，锁死不可提交（须理由 + 特批）`); return; }
    /* 未指定目录的行落「未归类」科目：这里的拦截取代了原先「取不到就静默归到消防电」的兜底 ——
       每一分钱都要归到科目，否则下游的成本结构分析与毛利率归因全部失真。 */
    const loose = items.filter((it) => quoteScopeOf(it.catId) === SCOPE_UNASSIGNED);
    if (loose.length) {
      setMiss(loose.map((it) => it.id));
      toast(`有 ${loose.length} 行未指定所属目录（落在「未归类」），请在目录列指定后提交`, 'err');
      return;
    }
    setSubmitOpen(true);
  };

  /**
   * 提交审批（落库）。
   * 修复前此处只 toast：明细停在组件 state，刷新即丢；审批中心也看不到这条待办，
   * 报价台账状态不变 —— 「报价 → 投标 / 合同」整条下游都没有上游依据。
   */
  const doSubmit = () => {
    if (!customer) { toast('请先选择客户', 'err'); return; }
    if (!reason.trim()) { toast('变更原因必填'); return; }
    /* 低于目录默认毛利的行必须写明理由 —— 少了这一句，审批人只知道少赚了钱，不知道换回了什么 */
    if (guard.rows.length && !guardReason.trim()) { toast('有明细行低于目录默认毛利，请写明让价理由', 'err'); return; }
    const custId = CUSTOMERS.find((c) => c.name === customer)?.id ?? '';
    const lines: QuoteLine[] = items.map((it) => ({
      matId: it.code, catId: it.catId, name: it.name, spec: it.spec, unit: it.unit,
      qty: it.qty, cost: it.cost, markup: it.markup,
      price: Math.round(line(it).price * 100) / 100,
      note: it.note || undefined,
      /* M8：配置版本快照随行落库，配置升版后历史报价仍可还原当时成本口径 */
      recipeVer: it.recipeVer,
      /* 套件整包行的身份：留了 kitCode 才能反查这行属于哪个套件、当时用了哪一版配置 */
      kitCode: it.kitCode,
      /* 目录默认毛利快照（4.6）：老行沿用当初的目录值，新留的行写上当天的目录值，
         之后在树上调默认毛利，这一版报价的让价判定不会被追溯改写。 */
      baseMarkup: it.baseMarkup ?? lineBaseMarkup(it),
      /* 维保 / 检测行的计价快照：口径 + 基数，版本回放时按同一口径重算 */
      ...(isRateRow(it) ? { basis: it.basis, basisArea: it.basisArea, basisAsset: it.basisAsset, basisPoints: it.basisPoints } : {}),
    }));
    const amt = Math.round(total);
      /* 两条路由规则取较高的一级：金额别（approveLevel）与毛利偏离别（marginGuard.level），
         名次只有 data.ts 的 higherLevel 一处比较，台账与工作台不会跑出两个结论 —— 值见上文 routeLvl。 */
      const lvl = routeLvl;
      const head = {
        customer, customerId: custId, opp,
      name: qName.trim() || `${customer}消防工程报价`,
      total: amt, taxRate, taxMode: exTax ? '不含税' : '含税', status: '待审批',
      owner: '当前用户', update: TODAY, approveLevel: lvl,
      markup: Math.round(grossMarkup * 10) / 10, items: lines.length, lines,
      /* 项目面积随单落库：报价详情的「工程费单方造价」与历史同类参照都以它为分母，
         不落库的话详情页只能回落到模板常量，别的报价单单方造价全错。 */
      area: area || undefined,
    };
    if (editing) {
      patchQuote(editing.id, { ...head, ver: editing.ver });
      pushApproval(makeQuoteApproval(editing.id, editing.ver, head.name, amt, lvl));
      /* 提交即留版：版本快照按当前 ver 覆盖写入（内容调整不算升版，升版走详情页「生成 Vn」） */
      snapshotQuoteVersion(editing.id, reason, '当前用户');
      toast(`已提交审批 · ${editing.id} 明细 ${lines.length} 行已保存 · 路由至${lvl === '—' ? '免审' : lvl}`);
    } else {
      const no = nextQuoteNo();
      addQuote({ id: no, ver: 'V1', region: '昆明', base: '其他', uplift: 0, costSqm: 0, date: TODAY, ...head });
      pushApproval(makeQuoteApproval(no, 'V1', head.name, amt, lvl));
      snapshotQuoteVersion(no, reason, '当前用户');
      toast(`报价单 ${no} 已创建并提交审批 · 明细 ${lines.length} 行 · 路由至${lvl === '—' ? '免审' : lvl}`);
    }
    setSubmitOpen(false); setReason(''); setGuardReason('');
    setDiffMap(new Map());
    go('quote');
  };

  /** 采纳三源价格：写入成本参考价并留痕（含来源）；上浮单价由 line() 按浮率自动重算 */
  const adopt = (price: number, src: string) => {
    if (!refOpen) return;
    const old = refOpen.cost;
    setItems((prev) => prev.map((it) => (it.id === refOpen.id ? { ...it, cost: price, manual: true } : it)));
    setCostHist((h) => [{ row: refOpen.name, old, nu: price, by: '当前用户', t: TODAY, src }, ...h]);
    setRefOpen(null);
    toast(`已采纳：${src} · 成本 ${fmt(old)} → ${fmt(price)}（已留痕）`);
  };

  /**
   * 明细按「报价科目」分组 —— 科目由明细行的目录逐个派生（quoteScopeOf），
   * 不再像改造前那样先落到 8 个固定的目录名、再按名字分组。
   * 未归类的行单独落在最后一组，所见即所得地提示「这些行还没确定科目」。
   */
  const grouped = useMemo(() => {
    const all = [...REAL_SCOPES.map((s) => s.key), SCOPE_UNASSIGNED];
    return all
      .map((k) => ({ key: k, name: scopeName(k), markup: scopeMarkup(k), rows: items.filter((it) => quoteScopeOf(it.catId) === k) }))
      .filter((g) => g.rows.length)
      .map((g) => ({
        ...g,
        /* 组内排序：本次新增行（有 addedAt）排最前、按加入时间倒序（最新在上）；
           载入的原有行（无 addedAt）保持原相对顺序排在其后。 */
        rows: g.rows.slice().sort((a, b) => {
          const an = a.addedAt != null, bn = b.addedAt != null;
          if (an !== bn) return an ? -1 : 1;
          if (an && bn) return (b.addedAt ?? 0) - (a.addedAt ?? 0);
          return 0;
        }),
      }));
  }, [items]);

  /** 缺证行：该行物料按其所属目录要求强制性认证（CCCF），但主数据里没有证书 —— 报价环节必须看得见 */
  const certMissRows = useMemo(
    () => items.filter((it) => !!it.code && itemCertMiss(itemByCode(it.code))),
    [items],
  );

  /* ---------- 本次改动对比：当前草稿 vs 进入编辑时的已保存明细 ----------
     金额一律取本页同一条计价链 line()：维保 / 检测行不是「数量 × 单价」，
     用 qty × price 反推会得出一个业务上根本不存在的数，改没改也判错。
     行配对用 srcId（载入行序），不用编码 —— 改了名称 / 目录的行必须算「这行改了」。 */
  const baseViews: DiffLineView[] = useMemo(
    () => baseLines.map((l, i) => ({
      srcId: i + 1, no: i + 1, name: l.name, code: l.matId, catId: l.catId ?? '',
      spec: l.spec ?? '', unit: l.unit, qty: l.qty, cost: l.cost, markup: l.markup,
      note: l.note ?? '', price: l.price, amt: Math.round(l.qty * l.price),
    })),
    [baseLines],
  );
  const curViews: DiffLineView[] = useMemo(
    () => {
      /* 行号跟随渲染顺序：组内新增行已排到最前，这里按 grouped 拍平后的顺序编号，
         保证表格 # 列、改动清单行号与屏幕上看到的行序一致 */
      const flat = grouped.flatMap((g) => g.rows);
      return flat.map((it, i) => {
        const l = line(it);
        return {
          srcId: it.srcId, no: i + 1, name: it.name, code: it.code, catId: it.catId,
          spec: it.spec, unit: it.unit, qty: it.qty, cost: it.cost, markup: it.markup,
          note: it.note, price: l.price, amt: l.amt,
        };
      });
    },
    [grouped],
  );
  const editChanges = useMemo(() => buildEditDiff(baseViews, curViews, catPath), [baseViews, curViews]);
  /** 显示行号 → 该行改动（明细表就地标注用；删除行没有当前行号，只进清单不进表） */
  const rowChg = useMemo(() => {
    const m = new Map<number, EditChange>();
    editChanges.forEach((c) => { if (c.kind !== 'del') m.set(c.no, c); });
    return m;
  }, [editChanges]);
  /** 渲染行号映射：行 id → 屏幕显示序号（按 grouped 拍平顺序，与表格 # 列、curViews.no 一致） */
  const rowNoMap = useMemo(() => {
    const m = new Map<number, number>();
    let n = 0;
    grouped.forEach((g) => g.rows.forEach((it) => { n += 1; m.set(it.id, n); }));
    return m;
  }, [grouped]);
  /** 保存成功后基线前移：把刚存下去的内容作为新的对比起点 */
  const rebase = () => setBaseLines(items.map((it) => ({
    matId: it.code, catId: it.catId, name: it.name, spec: it.spec, unit: it.unit,
    qty: it.qty, cost: it.cost, markup: it.markup,
    price: Math.round(line(it).price * 100) / 100, note: it.note || undefined,
  })));

  /* 统一导出：单单导出当前报价单（mode=single），金额 / 毛利为敏感字段 */
  const exportFields: ExportField[] = [
    { key: 'id', label: '报价编号' },
    { key: 'customer', label: '客户' },
    { key: 'name', label: '项目名称' },
    { key: 'taxMode', label: '计价方式' },
    { key: 'items', label: '明细行数' },
    { key: 'net', label: '不含税金额', sensitive: true },
    { key: 'tax', label: '税额' },
    { key: 'total', label: '含税金额', sensitive: true },
    { key: 'markup', label: '毛利', sensitive: true },
    { key: 'status', label: '状态' },
  ];
  const exportApi = useExport({
    mode: 'single', pageKey: 'quote-edit', pageName: '报价单',
    fields: exportFields, defaultFieldKeys: exportFields.map((f) => f.key),
    totalCount: 1, filteredCount: 1, selectedCount: 0,
    previewRows: editing ? [editing] : [],
    userName: getUserName(role),
    onExport: () => {},
  });

  return (
    <>
      <PageHead
        title="报价编辑 · 工作台"
        badges={<><Tag tone="gray">{editing ? editing.status : '新建草稿'}</Tag><Tag tone="blue">{editing ? `${editing.id} ${editing.ver}` : '未生成单号'}</Tag></>}
        sub={<span>目录化组价工作台<Tip text="目录化组价 · 批量调价 · 汇总项自动计算（不可手填）。" /></span>}
        actions={<>
          <Btn onClick={() => {
            if (diffMap.size > 0 && !window.confirm(`有 ${diffMap.size} 处改动未保存，确定离开？`)) return;
            go('quote');
          }}>← 返回台账</Btn>
          {diffMap.size > 0 && (
            <>
              <Tag tone="blue" className="nc-tag-btn">已改 {diffMap.size} 处</Tag>
              <Btn onClick={() => setDiffMap(new Map())} title="仅清除视觉标记，数值保留不变">清除改动标记</Btn>
            </>
          )}
          <Btn onClick={() => setDiffOpen(true)} title="查看本次编辑改了哪些行、原来是什么">
            改动对比{editChanges.length ? `（${editChanges.length}）` : ''}
          </Btn>
          <Btn onClick={() => { setSaveChoiceOpen(true); }}>保存</Btn>
          <ExportButton onClick={exportApi.trigger} />
          <OpMore label="更多 ⋯" items={[
            { label: '打印预览', onClick: () => setPrintOpen(true) },
            { label: '版本管理', onClick: () => setVerOpen(true) },
          ]} />
          <Btn kind="primary" onClick={preSubmit}>提交审批</Btn>
        </>}
      />

      {/* ===== L0 头部 ===== */}
      <Card>
        <div className="nc-l0">
          <Field label="客户" req><CustomerPicker value={customer} onChange={setCustomer} emit="name" /></Field>
          <Field label="关联商机"><OppPicker value={opp} onChange={setOpp} clearLabel="暂不关联" /></Field>
          <Field label="项目类型" req><select className="nc-input" value={pType} onChange={(e) => setPType(e.target.value)}>
            <option>新建</option><option>改造</option><option>维护保养</option>
          </select></Field>
          <Field label="报价名称" req><input className="nc-input" value={qName} onChange={(e) => setQName(e.target.value)} /></Field>
        </div>

        <Collapse title="高级" open={adv} onToggle={() => setAdv(!adv)} badge={<span className="nc-cell-sub">上浮方式 / 有效期 / 税率 / 区域 / 列显示 / 口径</span>}>
          <div className="nc-form-grid">
            <Field label="上浮方式">
              <select className="nc-input" value={upMode} onChange={(e) => setUpMode(e.target.value)}>
                <option>整体比例</option><option>单项</option><option>总量</option>
              </select>
            </Field>
            <Field label="上浮比例（%）" note="默认 20">
              <input className="nc-input" type="number" value={upRate} onChange={(e) => setUpRate(Number(e.target.value))} />
            </Field>
            <Field label="有效期" note="默认报价后 +30 天"><input className="nc-input" value={valid} onChange={(e) => setValid(e.target.value)} /></Field>
            <Field label="税率" note="9% 建筑业 / 13% / 6% 服务 / 3%">
              <select className="nc-input" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))}>
                <option value={9}>9%（建筑业）</option><option value={13}>13%</option><option value={6}>6%（服务·维护保养）</option><option value={3}>3%</option>
              </select>
            </Field>
            <Field label="关联项目"><ProjectPicker value={linkedProj} onChange={setLinkedProj} clearLabel="暂不关联" /></Field>
            <Field label="项目面积（㎡）" note="工程费单方造价的分母；维护保养 / 服务类报价可留空">
              <input className="nc-input" type="number" value={area || ''} placeholder="如 26000"
                onChange={(e) => setArea(Number(e.target.value) || 0)} />
            </Field>
            <Field label="列显示">
              <div className="nc-inline-checks">
                <Check checked={showSpec} onChange={setShowSpec} label="规格列" />
                <Check checked={showNote} onChange={setShowNote} label="备注列" />
              </div>
            </Field>
            <Field label="价格口径" span={2} note="勾选后本报价明确标注为不含税价；不含税报价后续开票将另加税额，避免纠纷">
              <Check checked={exTax} onChange={setExTax} label="本报价为不含税价（明确标注）" />
            </Field>
          </div>
        </Collapse>
      </Card>

      {/* ===== 添加明细区 ===== */}
      <Card>
        <div className="nc-addbar">
          <div className="nc-ops">
            <Btn kind="primary" size="sm" onClick={() => { setProjOpen(true); setProjPick(PROJECTS[0]?.id || ''); setProjSel(new Set()); setKitMode({}); }}><Ico n="star" size={16} /> 从项目拉取用料</Btn>
            <Btn size="sm" onClick={() => setAddOpen(true)}><Ico n="building" size={16} /> 从物料库添加</Btn>
            <Btn size="sm" onClick={() => setAiOpen(true)}><Ico n="bolt" size={16} /> AI 识别图纸生成</Btn>
            <Btn size="sm" onClick={() => setCustomOpen(true)}>＋ 手输自定义行</Btn>
          </div>
          <span className="nc-listhint">物料自动带出<Tip text="编码 / 规格 / 单位 / 目录 / 成本参考价；目录列来自物料主数据，只读锁定。" /></span>
        </div>
        <div className="nc-catbar">
          <span className="nc-catbar-lb">按科目批量调价</span>
          <select className="nc-input nc-input-sm" value={bCat} onChange={(e) => setBCat(e.target.value as BatchScope)}>
            <option value="__all">全部科目（整体调价）</option>
            {REAL_SCOPES.map((s) => <option key={s.key} value={s.key}>{s.name}（默认 ±{s.markup}%）</option>)}
            <option value={SCOPE_UNASSIGNED}>未归类（须补指定目录）</option>
          </select>
          <select className="nc-input nc-input-sm" value={bMode} onChange={(e) => setBMode(e.target.value as 'rate' | 'price')}>
            <option value="rate">上浮比例 %</option><option value="price">上浮单价 ¥</option>
          </select>
          {bMode === 'rate'
            ? <input className="nc-input nc-input-sm" type="number" value={bRate} onChange={(e) => setBRate(Number(e.target.value))} />
            : <input className="nc-input nc-input-sm" type="number" value={bPrice} onChange={(e) => setBPrice(Number(e.target.value))} />}
          <Btn size="sm" onClick={useCatDef}>按目录默认上浮率带出</Btn>
          <Btn size="sm" kind="primary" onClick={applyCat}>应用</Btn>
          <Btn size="sm" onClick={resetBatch} disabled={!canResetBatch} title={canResetBatch ? '恢复本次批量调价应用前的行值（仅回退本次批量调价，手改保留）' : '尚未执行批量调价'}>重置</Btn>
          <span className="nc-cell-sub">命中 <b className="num">{bCat === '__all' ? items.length : items.filter((it) => quoteScopeOf(it.catId) === bCat).length}</b> 条</span>
        </div>

        {/* 缺证风险：要求的认证由物料所属目录派生（品目决定要不要证），不带证的物料进了报价就是交付事故 */}
        {certMissRows.length > 0 && (
          <Banner tone="warn">
            有 <b>{certMissRows.length}</b> 行物料按其所属目录要求 <b>强制性认证 CCCF</b>，但在主数据中未登记证书：
            {certMissRows.slice(0, 3).map((r) => r.name).join('、')}{certMissRows.length > 3 ? ' 等' : ''}。
            无有效证书的批次不得用于工程，请先到「物料主数据」补录证书再提交。
          </Banner>
        )}

        {/* ===== 明细表 ===== */}
        <div className="nc-tbl-wrap">
          <table className="nc-tbl nc-tbl-edit" style={{ minWidth: 1500 }}>
            <thead>
              <tr>
                <th style={{ width: 44 }}>#</th>
                <th style={{ width: 176 }}>所属目录 <span className="nc-req">*</span></th>
                <th style={{ width: 230 }}>名称 <span className="nc-req">*≤50</span></th>
                {showSpec && <th style={{ width: 200 }}>规格型号</th>}
                <th style={{ width: 80 }}>单位</th>
                <th style={{ width: 90 }} className="is-num">数量 <span className="nc-req">*</span></th>
                <th style={{ width: 120 }} className="is-num">成本参考价 <span className="nc-req">*</span></th>
                <th style={{ width: 110 }} className="is-num">上浮率 %</th>
                <th style={{ width: 110 }} className="is-num">上浮单价 <span className="nc-req">*</span></th>
                <th style={{ width: 130 }} className="is-num">上浮前</th>
                <th style={{ width: 130 }} className="is-num">金额</th>
                {showNote && <th style={{ width: 160 }}>备注</th>}
                <th style={{ width: 60 }} className="is-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {/* 空态：明细被逐行删空、或该单本身未落库明细时显示（列数与表头保持一致）。
                  只有「新建报价单」会带 15 行起步行，不走这里 */}
              {!grouped.length && (
                <tr><td colSpan={showSpec && showNote ? 13 : showSpec || showNote ? 12 : 11} className="nc-cell-sub is-center" style={{ padding: 22 }}>
                  暂无明细行 —— 用上方「从物料库添加」或「从项目拉取用料」开始编制
                </td></tr>
              )}
              {grouped.map((g) => (
                <React.Fragment key={g.key}>
                  <tr className="nc-tbl-group"><td colSpan={showSpec && showNote ? 13 : showSpec || showNote ? 12 : 11}>
                    <span className="nc-group-name">{g.name}</span>
                    <span className="nc-cell-sub">默认上浮率 {g.markup}% · {g.rows.length} 行 · 小计 <b className="num">{fmt(g.rows.reduce((a, it) => a + line(it).amt, 0))}</b></span>
                    {g.key === SCOPE_UNASSIGNED && <span className="nc-cell-sub" style={{ marginLeft: 8 }}>需在「所属目录」列指定目录后方可提交</span>}
                  </td></tr>
                  {g.rows.map((it, i) => {
                    const l = line(it);
                    const dev = it.cost ? (l.price - it.cost) / it.cost : 0;
                    const offTone = dev > 0.2 ? ' is-red' : dev > 0.1 ? ' is-orange' : '';
                    /* 本行让了多少个百分点（相对它自己所属目录的默认毛利，含快照保护） */
                    const below = lineMarginBelow(it);
                    const rowLevel = marginApprover(below);
                    const isDead = !!it.code && deadCodes.has(it.code);
                    /** 来自主数据的行：目录由物料主数据决定，锁只读；其余行（自编 / 未归类）可在本页指定 */
                    const catLocked = !!it.code && quoteScopeOf(it.catId) !== SCOPE_UNASSIGNED;
                    const rate = srvRateOf(it.code);
                    const quote = isRateRow(it);
                    /** 本行在改动清单里的位置（显示行号 = 全表行号，与 # 列一致） */
                    const rn = rowNoMap.get(it.id) ?? 0;
                    const chg = rowChg.get(rn);
                    const dQty = diffMap.get(`qty-${it.id}`);
                    const dCost = diffMap.get(`cost-${it.id}`);
                    const dPrice = diffMap.get(`price-${it.id}`);
                    const dAmt = diffMap.get(`amt-${it.id}`);
                    return (
                      <tr key={it.id} className={`${miss.includes(it.id) || isDead ? 'is-miss' : ''}${chg ? ' is-chg-row' : ''}`}>
                        <td className="is-num">
                          <span className="nc-row-no">
                            {chg && (
                              <span className={`nc-chg-dot is-${chg.kind}`} title={chg.kind === 'add' ? '本次新增' : '本次修改'}>
                                {chg.kind === 'add' ? '新' : '改'}
                              </span>
                            )}
                            <span>{rn}</span>
                          </span>
                        </td>
                        <td>
                          {catLocked ? (
                            <span className="nc-cell-sub" title={`${catPath(it.catId)} · 取自物料主数据，如需调整请到物料主数据修改`}>{catPath(it.catId)}</span>
                          ) : (
                            <select
                              className={`nc-cell-in${quoteScopeOf(it.catId) === SCOPE_UNASSIGNED ? ' miss' : ''}`}
                              value={it.catId}
                              onChange={(e) => setIt(it.id, { catId: e.target.value })}
                              title="挂到最细一级目录；报价科目与上浮率由它派生"
                            >
                              <option value="">— 请选择目录 —</option>
                              {catLeafOpts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                            </select>
                          )}
                        </td>
                        <td className={miss.includes(it.id) && !it.name.trim() ? 'cell-miss' : ''}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input className={`nc-cell-in${miss.includes(it.id) && !it.name.trim() ? ' miss' : ''}`} value={it.name} maxLength={50} onChange={(e) => setIt(it.id, { name: e.target.value })} />
                            {isDead && <Tag tone="red">{it.code} 已停用</Tag>}
                            {it.code && itemCertMiss(itemByCode(it.code)) && <span title={`${catPath(it.catId)} 要求 ${certRuleCn(it.catId)}，该物料未登记 CCCF 证书`}><Tag tone="orange">缺CCCF证</Tag></span>}
                          </div>
                          {rate && (
                            <details className="nc-rate-drawer">
                              <summary>计量口径 ▾</summary>
                              <div className="nc-cell-sub nc-rate-row">
                              <select className="nc-cell-in" value={it.basis || rate.basis}
                                onChange={(e) => {
                                  const b = e.target.value as BillBasis;
                                  /* 切换口径只负责「补」基数，不负责「改」基数 ——
                                     业务经理手填过的面积 / 资产值必须优先保留，否则一换口径
                                     就把本单填好的数冲成当前选中项目台账的数，两单互相串数。
                                     缺的那一维才回落到项目台账；项目也没有台账就留空，
                                     由下方「缺少计量基数」提示逼着人去现场踏勘补齐。
                                     注意：这里只认**本单关联的项目**（editing.projectId），
                                     不能拿 projPick（选料时临时选的项目）来推导 ——
                                     那是另一个项目的范围，用它补基数等于把甲的尺寸报给乙。 */
                                  const p = projFacilityOf(editing?.projectId);
                                  setIt(it.id, {
                                    basis: b,
                                    basisArea: it.basisArea ?? p?.builtArea,
                                    basisPoints: it.basisPoints ?? p?.points,
                                    basisAsset: it.basisAsset ?? p?.assetAmt,
                                  });
                                }}
                                title="维保 / 检测报价的三种行业口径，可切换对比">
                                <option value="unit">按数量</option>
                                <option value="area">按建筑面积</option>
                                <option value="point">按设施点位</option>
                                <option value="asset">按设施造价</option>
                              </select>
                              {(!it.basis || it.basis === 'area') && (
                                <input className="nc-cell-in is-num" type="number" value={it.basisArea ?? ''} placeholder="建筑面积 ㎡"
                                  onChange={(e) => setIt(it.id, { basis: it.basis || rate.basis, basisArea: Number(e.target.value) })} />
                              )}
                              {it.basis === 'asset' && (
                                <input className="nc-cell-in is-num" type="number" value={it.basisAsset ?? ''} placeholder="设施资产原值 元"
                                  onChange={(e) => setIt(it.id, { basisAsset: Number(e.target.value) })} />
                              )}
                              {it.basis === 'point' && (
                                <span className="nc-tiny">
                                  {(it.basisPoints || []).map((p) => `${p.kind} ${p.qty}`).join(' · ') || '未取到项目点位台账'}
                                </span>
                              )}
                              {quote && l.q && (
                                <span className="nc-tiny nc-muted">
                                  {/* 只有真正是「数量 × 单价」的行才展开乘式；按造价行只有一行且单价就是年费，再乘一次是冗余 */}
                                  {l.q.rows.length
                                    ? l.q.rows.map((r) => (r.qty > 1 ? `${r.label} × ${r.unitPrice} = ${fmt(r.amt)}` : `${r.label} = ${fmt(r.amt)}`)).join('；')
                                    : '缺少计量基数'}
                                  {l.q.hitMin ? ` · 低于最低限价 ${fmt(l.q.minFee)}，已按保底计` : ''}
                                </span>
                              )}
                              </div>
                            </details>
                          )}
                        </td>
                        {showSpec && <td><span className="nc-cell-sub">{it.spec || '/'}</span></td>}
                        <td>
                          <select className="nc-cell-in" value={it.unit} onChange={(e) => setIt(it.id, { unit: e.target.value })}>
                            {UNITS.map((u) => <option key={u}>{u}</option>)}
                          </select>
                        </td>
                        <td className={`is-num${dQty ? ' nc-diff-bg' : ''}`}>
                          {quote
                            ? <span className="nc-cell-sub">按{l.q && BILL_BASIS_CN[l.q.basis].replace('按', '')}</span>
                            : (
                              <div className="nc-diff-cell">
                                <input className={`nc-cell-in is-num${miss.includes(it.id) && !it.qty ? ' miss' : ''}`} type="number" value={it.qty}
                                  onFocus={() => focusSnap(it.id, 'qty')}
                                  onBlur={() => blurRec(it.id, 'qty')}
                                  onKeyDown={enterBlur}
                                  onChange={(e) => setIt(it.id, { qty: Number(e.target.value) })} />
                                {dQty && <div className="nc-diff-old">原 {dQty.prev}</div>}
                              </div>
                            )}
                        </td>
                        <td className={`is-num nc-cost-cell${dCost ? ' nc-diff-bg' : ''}`}>
                          {/* ⚠️「输入框 + ¥参考」必须一起包在 .nc-cost-line 里，不能把 flex 挂在 <td> 上 ——
                              否则 td 的 table-cell 盒被打掉：行高被「计量口径」撑到 128 时这一格贴行顶、
                              ¥参考 也会掉到输入框下方（2026-09-28 修，与 style.css 同一条约定）。 */}
                          <div className="nc-diff-cell">
                            <div className="nc-cost-line">
                              <input className={`nc-cell-in is-num${miss.includes(it.id) && !it.cost ? ' miss' : ''}`} type="number" value={it.cost}
                                title={quote ? '按计量口径试算的行：此值不参与本行金额，仅用于整单毛利与审批口径' : undefined}
                                onFocus={() => focusSnap(it.id, 'cost')}
                                onBlur={() => blurRec(it.id, 'cost')}
                                onKeyDown={enterBlur}
                                onChange={(e) => setIt(it.id, { cost: Number(e.target.value) })} />
                              <button className="nc-refbtn" onClick={() => setRefOpen(it)} title="查看成本参考价三源">¥参考</button>
                            </div>
                            {dCost && <div className="nc-diff-old">原 {fmt(dCost.prev)}</div>}
                          </div>
                        </td>
                        <td className="is-num">
                          {quote
                            ? <span className="nc-cell-sub">试算价，不适用</span>
                            : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                                <select className={`nc-cell-in${offTone}`} value={it.markup} onChange={(e) => setIt(it.id, { markup: Number(e.target.value) })}>
                                  {[0, 5, 8, 10, 12, 15, 18, 20, 22, 25, 28, 30, 35, 40].map((n) => <option key={n} value={n}>{n}%</option>)}
                                </select>
                                {/* 低于本目录默认毛利的当场提示：让价不是一个抽象数字，得让人在改这一秒就知道它要付出什么代价。
                                    提示改 Tag 与下拉同行，不再另起小字行；保留“个百分点”口径。 */}
                                {below > 0 && (
                                  <span title={`低于本目录标准毛利 ${lineBaseMarkup(it)}%，让利 ${below.toFixed(1)} 个百分点`}><Tag tone="orange">
                                    低 {below.toFixed(1)} 个百分点{rowLevel === '—' ? ' · 须写理由' : ` · ${rowLevel}特批`}
                                  </Tag></span>
                                )}
                              </div>
                            )}
                        </td>
                        <td className={`is-num${dPrice ? ' nc-diff-bg' : ''}`}>
                          <div className="nc-diff-cell">
                            <b className={`num${offTone}`}>{fmt(l.price)}</b>
                            {dPrice && <div className="nc-diff-old">{fmt(dPrice.prev)}</div>}
                          </div>
                        </td>
                        {/* 试算价行没有「上浮前」这个中间量：金额由「服务单价 × 计量基数」直接得出，
                            不经过 成本 × 上浮率。此前直接显示 it.cost，同一行就出现「上浮前 ¥20 / 金额 ¥108,000」
                            两个毫不相干的数（2026-09-28 修）。 */}
                        <td className="is-num nc-cell-sub" title={quote ? '按计量口径试算的行不走上浮，没有上浮前金额' : undefined}>
                          {quote ? '—' : fmt(l.before)}
                        </td>
                        <td className={`is-num${dAmt ? ' nc-diff-bg' : ''}`}>
                          <div className="nc-diff-cell">
                            <b className="num">{fmt(l.amt)}</b>
                            {dAmt && <div className="nc-diff-old">{fmt(dAmt.prev)}</div>}
                          </div>
                        </td>
                        {showNote && <td><input className="nc-cell-in" value={it.note} onChange={(e) => setIt(it.id, { note: e.target.value })} placeholder="—" /></td>}
                        <td className="is-center"><Op danger onClick={() => { clearRowDiff(it.id); setItems((p) => p.filter((x) => x.id !== it.id)); toast('已删除明细行'); }}>删</Op></td>
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* ===== 粘性汇总条 ===== */}
        <div className="nc-sticky-bar">
          <div className="nc-sum-cell"><span>不含税合计</span><b className="num">{fmt(sumExTax - (exTax ? 0 : tax))}</b></div>
          <div className="nc-sum-cell"><span>税额（{taxRate}%）</span><b className="num">{fmt(tax)}</b></div>
          <div className="nc-sum-cell is-hl"><span>报价总额（含税 / 不含税）</span><b className="num">{fmt(total)}</b></div>
          <div className="nc-sum-cell"><span>整体浮率</span><b className={`num${grossMarkup < 15 ? ' is-red' : ''}`} title="浮率 &lt;15% 视为低毛利预警，触发审批">{grossMarkup.toFixed(1)}%</b></div>
          <div className={`nc-sum-trig${hit ? ' is-hit' : ' is-ok'}`}>{hitWhy}</div>
        </div>
      </Card>

      {/* ===== 从物料库添加 ===== */}
      <Drawer open={addOpen} onClose={() => setAddOpen(false)} width={1040} title="从物料库添加" sub="物料 / 服务 / 套件三类同表；编码 / 规格 / 单位 / 报价目录 / 成本参考价自动带出，目录列只读锁定"
        foot={<><Btn onClick={() => setAddOpen(false)}>取消</Btn><Btn kind="primary" onClick={addFromMat}>添加 {matPick.length || 0} 条</Btn></>}>
        <div className="nc-toolbar">
          <SearchInput value={matKw} onChange={setMatKw} placeholder="名称 / 编码 / 规格" width={240} />
          <select className="nc-input nc-input-sm" value={matTy} onChange={(e) => setMatTy(e.target.value)}>
            <option>全部类型</option>{ITEM_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
          <select className="nc-input nc-input-sm" value={matCat} onChange={(e) => setMatCat(e.target.value as BatchScope)}>
            <option value="__all">全部科目</option>
            {REAL_SCOPES.map((s) => <option key={s.key} value={s.key}>{s.name}</option>)}
            <option value={SCOPE_UNASSIGNED}>未归类</option>
          </select>
          <span className="nc-cell-sub">成本参考价按类型分档：物料还原含税采购价 · 服务取人工 + 耗材构成 · 套件取配置展开成本</span>
        </div>
        <DataTable
          cols={[
            { key: 'id', title: '编码', width: 110, render: (m: any) => <Code>{m.code}</Code> },
            { key: 'name', title: '名称', width: 190, render: (m: any) => <div className="nc-cell-main"><div>{m.name}</div><div className="nc-cell-sub">{m.spec}</div></div> },
            { key: 'ty', title: '类型', width: 64, render: (m: any) => <Tag tone={m.ty === '服务' ? 'gold' : m.ty === '套件' ? 'purple' : 'blue'}>{m.ty}</Tag> },
            { key: 'unit', title: '单位', width: 60 },
            { key: 'cat', title: '所属目录', width: 190, render: (m: any) => <span className="nc-tiny" title={`报价科目：${catScopeName(m.cat)}`}>{catPath(m.cat)}</span> },
            { key: 'stock', title: '库存', width: 70, align: 'right' as const, render: (m: any) => (isStocked(m.ty) ? <span className="num">{m.stock}</span> : <span className="nc-cell-sub">—</span>) },
            { key: 'price', title: '参考价', width: 100, align: 'right' as const, render: (m: any) => <b className="num">{fmt(m.price)}</b> },
            { key: 'cost', title: '成本参考价', width: 110, align: 'right' as const, render: (m: any) => <span className="num nc-cell-sub">{fmt(itemCostBase(m))}</span> },
            { key: 'src', title: '价格来源', width: 120, render: (m: any) => <span className="nc-cell-sub">{m.ty === '服务' ? '人工 + 耗材构成' : m.ty === '套件' ? '配置展开成本' : '采购合同沉淀'}</span> },
          ]}
          rows={matPaged.paged}
          rowKey={(m: any) => m.code}
          minWidth={860}
          selectable
          foot={matPaged.foot}
          selected={matPick}
          onSelectAll={(ids) => setMatPick(ids)}
          onSelectRow={(id) => setMatPick((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
        />
      </Drawer>

      {/* ===== AI 识别图纸 → 识别工作台 ===== */}
      <RecognitionWorkbench
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        title="报价明细识别"
        fields={QUOTE_RECOG_FIELDS}
        pageCount={2}
        onConfirm={onQuoteRecog}
      />

      {/* ===== 手输自定义行 ===== */}
      <Modal open={customOpen} onClose={() => setCustomOpen(false)} width={640} title="＋ 手输自定义行"
        foot={<><Btn onClick={() => setCustomOpen(false)}>取消</Btn><Btn kind="primary" onClick={addCustom}>添加</Btn></>}>
        <Banner tone="info">仅本报价单临时使用，<b>不会自动写入物料主数据</b>；如需沉淀请到物料主数据新建后从物料库添加。</Banner>
        <div className="nc-form-grid">
          <Field label="所属目录" req note="只能选最细一级，报价科目与默认上浮率由此派生">
            <select className="nc-input" value={cCat} onChange={(e) => setCCat(e.target.value)}>
              <option value="">— 请选择目录 —</option>
              {catLeafOpts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </Field>
          <Field label="名称" req><input className="nc-input" value={cName} onChange={(e) => setCName(e.target.value)} maxLength={50} placeholder="≤50 字" /></Field>
          <Field label="规格型号"><input className="nc-input" value={cSpec} onChange={(e) => setCSpec(e.target.value)} /></Field>
          <Field label="单位" req><select className="nc-input" value={cUnit} onChange={(e) => setCUnit(e.target.value)}>
            {UNITS.map((u) => <option key={u}>{u}</option>)}
          </select></Field>
          <Field label="数量" req><input className="nc-input" type="number" value={cQty} onChange={(e) => setCQty(Number(e.target.value))} /></Field>
          <Field label="成本参考价" req note="低于此价将锁死不可提交"><input className="nc-input" type="number" value={cCost} onChange={(e) => setCCost(Number(e.target.value))} /></Field>
        </div>
      </Modal>

      {/* ===== 从项目拉取用料 ===== */}
      <Drawer open={projOpen} onClose={() => setProjOpen(false)} width={880} title="从项目拉取用料"
        sub="选项目 → 勾物料 / 套件 → 一键生成报价明细（支持部分选择）"
        foot={<>
          <span className="nc-cell-sub" style={{ marginRight: 'auto' }}>已选 {projSel.size} 项</span>
          <Btn onClick={() => setProjOpen(false)}>取消</Btn>
          <Btn kind="primary" disabled={!projSel.size} onClick={addFromProj}>带入报价明细（{projSel.size}）</Btn>
        </>}>
        {(() => {
          const kits = projKitList(projPick);
          const mats = projMatList(projPick);
          const allKits = kits.length > 0 && kits.every((k) => projSel.has(k.code));
          const allMats = mats.length > 0 && mats.every((m) => projSel.has(m.code));
          const toggleOne = (code: string, v: boolean) => setProjSel((s) => { const n = new Set(s); if (v) n.add(code); else n.delete(code); return n; });
          const toggleAll = (codes: string[], v: boolean) => setProjSel((s) => { const n = new Set(s); codes.forEach((c) => { if (v) n.add(c); else n.delete(c); }); return n; });
          const proj = PROJECTS.find((p) => p.id === projPick);
          return (
            <>
              <Banner tone="info">按项目用料清单拉取：物料自动带出规格 / 单位 / 成本参考价；<b>套件可选「整体带入」或「展开为物料明细」</b>。</Banner>
              <div className="nc-form-grid">
                <Field label="选择项目" req span={2}>
                  <ProjectPicker value={projPick} onChange={pickProject} />
                </Field>
                <Field label="客户" span={2}>
                  <input className="nc-input" readOnly value={proj?.customer ?? ''} />
                </Field>
              </div>

              <div className="nc-sec-title" style={{ marginTop: 14 }}>套件（{kits.length}）</div>
              <div>
                {kits.map((k) => {
                  const c = bomCost(k.code);
                  const ver = RECIPES[k.code]?.versions.find((v) => v.v === RECIPES[k.code].cur);
                  const kitChecked = projSel.has(k.code);
                  return (
                    <div key={k.code} style={{ border: '1px solid var(--c-hairline)', borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
                      {/* 套件主行 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: kitChecked ? 'var(--c-primary-bg)' : 'var(--c-surface-soft)' }}>
                        <Check checked={kitChecked} onChange={(v) => {
                          toggleOne(k.code, v);
                          (ver?.lines ?? []).forEach((_, li) => {
                            const lineKey = `${k.code}__${li}`;
                            if (v) setProjSel((s: Set<string>) => new Set([...s, lineKey]));
                            else setProjSel((s: Set<string>) => { const n = new Set(s); n.delete(lineKey); return n; });
                          });
                        }} />
                        <b>{k.name}</b> <Tag tone="purple">套件</Tag>
                        <span className="nc-tiny nc-muted">{k.code} · {k.spec}</span>
                        {/* 带入粒度：整体 = 报价明细 1 行 = 1 个套件；展开 = 按当前生效配置逐行摊平 */}
                        <select
                          className="nc-input nc-input-sm"
                          style={{ width: 168 }}
                          value={kitMode[k.code] ?? 'expand'}
                          onChange={(e) => setKitMode((m) => ({ ...m, [k.code]: e.target.value as 'expand' | 'whole' }))}
                          title="整包：报价明细生成 1 行套件（保留套件编码与配置版本）；展开：按配置逐条生成物料 / 服务行"
                        >
                          <option value="expand">展开为物料明细</option>
                          <option value="whole">作为套件整包（1 行）</option>
                        </select>
                        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--ink-3)' }}>
                          含 {ver?.lines.length ?? 0} 项构成 · 套件成本 {fmt(c.total)}
                        </span>
                      </div>
                      {/* 展开物料明细：整包模式下逐行勾选不再有意义，整块收起避免误操作 */}
                      {kitMode[k.code] !== 'whole' && ver?.lines.map((ln, li) => {
                        const item = itemByCode(ln.code);
                        const lineKey = `${k.code}__${li}`;
                        const lineChecked = projSel.has(lineKey);
                        const lineQty = kitLineQty[lineKey] ?? ln.qty;
                        return (
                          <div key={lineKey} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px 6px 44px', borderTop: '1px dashed var(--c-hairline)' }}>
                            <Check checked={lineChecked} onChange={(v) => {
                              if (v) setProjSel((s: Set<string>) => new Set([...s, lineKey]));
                              else setProjSel((s: Set<string>) => { const n = new Set(s); n.delete(lineKey); return n; });
                            }} />
                            <span style={{ fontSize: 13 }}>{item?.name ?? ln.code} <span className="nc-tiny nc-muted">{ln.code}</span></span>
                            <span className="nc-tiny nc-muted" style={{ color: 'var(--ink-3)' }}>{ln.kind}</span>
                            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span className="nc-tiny nc-muted">数量</span>
                              <input className="nc-input" type="number" style={{ width: 70, padding: '2px 6px', fontSize: 13 }}
                                value={lineQty} min={0}
                                onChange={(e) => setKitLineQty((q: Record<string, number>) => ({ ...q, [lineKey]: Number(e.target.value) || 0 }))} />
                              <span className="nc-tiny nc-muted">{item?.unit ?? ''}</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              <div className="nc-sec-title" style={{ marginTop: 16 }}>物料（{mats.length}）<span className="nc-tiny nc-muted">勾选后可修改数量</span></div>
              <table className="nc-tbl" style={{ minWidth: 840 }}>
                <thead><tr>
                  <th style={{ width: 40 }}><Check checked={allMats} onChange={(v) => toggleAll(mats.map((m) => m.code), v)} /></th>
                  <th style={{ width: 110 }}>编码</th>
                  <th>名称 / 规格</th>
                  <th style={{ width: 64, textAlign: 'center' }}>单位</th>
                  <th style={{ width: 110 }} className="is-num">成本参考价</th>
                  <th style={{ width: 120 }} className="is-num">数量</th>
                </tr></thead>
                <tbody>
                  {mats.map((m) => {
                    const hist = quoteMap[m.code];
                    return (
                    <tr key={m.code}>
                      <td><Check checked={projSel.has(m.code)} onChange={(v) => toggleOne(m.code, v)} /></td>
                      <td className="num nc-id-cell">{m.code}</td>
                      <td>{m.name} <span className="nc-tiny nc-muted">{m.spec}</span></td>
                      <td style={{ textAlign: 'center' }}>{m.unit}</td>
                      <td className="is-num num">{fmt(itemCostBase(m))}</td>
                      <td className="is-num">
                        <input className="nc-input" type="number" style={{ width: 80, padding: '2px 6px', fontSize: 13 }}
                          value={matLineQty[m.code] ?? hist?.qty ?? 1} min={0}
                          onChange={(e) => setMatLineQty((q: Record<string, number>) => ({ ...q, [m.code]: Number(e.target.value) || 0 }))} />
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </>
          );
        })()}
      </Drawer>

      {/* ===== 价格参考（三源 · 图表化） ===== */}
      <Drawer open={!!refOpen} onClose={() => setRefOpen(null)} width={720} title="价格参考"
        sub={refOpen && (() => {
          const m = MATERIALS.find((x) => x.code === refOpen.code) || MATERIALS.find((x) => x.name === refOpen.name);
          return `${refOpen.name}${m ? `（${m.code}）` : '（自定义物料）'} · 当前成本 ${fmt(refOpen.cost)}`;
        })()}>
        {refOpen && (() => {
          const mat = MATERIALS.find((x) => x.code === refOpen.code) || MATERIALS.find((x) => x.name === refOpen.name);
          /* 自定义物料：无价格档案 → 仅支持手工填写 */
          if (!mat) {
            const guess = MATERIALS.filter((x) => x.name.slice(0, 2) === refOpen.name.slice(0, 2)).slice(0, 3);
            return (
              <>
                <Banner tone="warn">
                  该行为<b>自定义物料</b>，无价格档案。{guess.length ? <>可参考同类物料（{guess.map((g) => g.name).join(' / ')}）。</> : null}
                </Banner>
                <div className="nc-form-grid">
                  <Field label="手工填写成本参考价" req span={2}>
                    <input className="nc-input" type="number" defaultValue={refOpen.cost} id="nc-ref-manual" />
                  </Field>
                </div>
                <div style={{ marginTop: 12 }}>
                  <Btn kind="primary" onClick={() => {
                    const el = document.getElementById('nc-ref-manual') as HTMLInputElement | null;
                    const v = Number(el?.value || 0);
                    if (!(v > 0)) { toast('请填写价格'); return; }
                    adopt(v, '手工填写（自定义物料）');
                  }}>采纳并留痕</Btn>
                </div>
              </>
            );
          }
          const R = matPriceRef(mat.code);
          const vals = [...R.trend.map((t) => t.v), R.market];
          const mn = Math.min(...vals), mx = Math.max(...vals);
          const span = (mx - mn) || 1;
          /* min-max 缩放：最低柱 24% → 最高柱 90%，放大视觉差异 */
          const HH = (v: number) => Math.round(24 + ((v - mn) / span) * 66);
          const dev = refOpen.cost > 0 ? ((refOpen.cost - R.sug) / R.sug) * 100 : null;
          const maxUp = Math.max(...R.trend.slice(1).map((t, i) => ((t.v - R.trend[i].v) / R.trend[i].v) * 100));
          return (
            <>
              <div className="nc-cell-sub" style={{ marginBottom: 10 }}>
                编码 <b>{mat.code}</b> · 规格 {mat.spec || '—'} · 单位 {mat.unit} ｜ 物料库参考成本 <b className="num">{fmt(R.libPrice)}</b> ｜ 当前成本 <b className="num">{fmt(refOpen.cost)}</b>
              </div>

              {/* 三源对比条 + 综合建议价 */}
              <div className="nc-sug-strip">
                <div className="nc-sug-row">
                  三源对比：市场现价 <b className="num">{fmt(R.market)}</b> ｜ 供应商最低 <b className="num">{fmt(R.sup)}</b> ｜ 项目最近成交 <b className="num">{fmt(R.prj)}</b>
                </div>
                <div className="nc-sug-main">
                  <span>综合建议参考价（三源中位数）<b className="num nc-sug-big">{fmt(R.sug)}</b></span>
                  {dev != null && (
                    <Tag tone={Math.abs(dev) > 20 ? 'red' : Math.abs(dev) > 10 ? 'orange' : 'gray'}>
                      当前成本较建议{dev >= 0 ? '高' : '低'} {Math.abs(dev).toFixed(1)}%
                    </Tag>
                  )}
                  <Btn size="sm" kind="primary" onClick={() => adopt(R.sug, `综合建议价（三源中位数）${fmt(R.sug)}`)}>采纳建议价 {fmt(R.sug)}</Btn>
                </div>
              </div>

              {/* ① 市场价格变化 */}
              <div className="nc-prc-sec">
                <div className="nc-prc-hd">① 市场价格变化 <Tag tone="blue">行情源 · 近 6 月</Tag><span className="nc-tiny nc-muted">红↑上涨 / 绿↓下跌 · 高度按区间缩放</span></div>
                <div className="nc-bars">
                  {R.trend.map((t, i) => {
                    const prev = i > 0 ? R.trend[i - 1].v : null;
                    const ch = prev ? ((t.v - prev) / prev) * 100 : null;
                    const cls = ch == null || Math.abs(ch) <= 0.05 ? '' : ch > 0 ? ' is-up' : ' is-dn';
                    return (
                      <div className="nc-bar-col" key={t.m}>
                        <span className="nc-bar-v">{t.v}{ch != null && Math.abs(ch) > 0.05 ? <i className={ch > 0 ? 'is-up' : 'is-dn'}>{ch > 0 ? '↑' : '↓'}{Math.abs(ch).toFixed(1)}%</i> : null}</span>
                        <i className={`nc-bar${cls}`} style={{ height: HH(t.v) }} />
                        <span className="nc-bar-l">{t.m}</span>
                      </div>
                    );
                  })}
                  <div className="nc-bar-col">
                    <span className="nc-bar-v is-cur">{R.market} ✓</span>
                    <i className="nc-bar is-cur" style={{ height: HH(R.market) }} />
                    <span className="nc-bar-l is-cur">现价</span>
                  </div>
                </div>
                <div className="nc-prc-stats">
                  <span>区间：最低 <b className="num">{fmt(mn)}</b> · 最高 <b className="num">{fmt(mx)}</b> · 月均波动 <b className="num">{Math.abs(maxUp).toFixed(1)}%</b></span>
                  <span>现价 <b className="num">{fmt(R.market)}</b>（较首月 <b className={R.market >= R.trend[0].v ? 'nc-v-red' : 'nc-v-green'}>{R.market >= R.trend[0].v ? '+' : ''}{((R.market - R.trend[0].v) / R.trend[0].v * 100).toFixed(1)}%</b>）
                    <Op onClick={() => adopt(R.market, `市场现价 ${fmt(R.market)}`)}>采纳市场现价</Op>
                  </span>
                </div>
              </div>

              {/* ② 供应商报价 */}
              <div className="nc-prc-sec">
                <div className="nc-prc-hd">② 供应商报价 <Tag tone="orange">最近报价单</Tag></div>
                <table className="nc-tbl" style={{ minWidth: 640 }}>
                  <thead><tr><th>供应商</th><th style={{ width: 110 }} className="is-num">报价</th><th style={{ width: 100 }}>准入</th><th style={{ width: 90 }}>操作</th></tr></thead>
                  <tbody>
                    {R.sups.map((s) => (
                      <tr key={s.id} className={s.ok ? '' : 'is-muted-row'}>
                        <td>{s.name}{s.ok && s.price === R.sup ? <Tag tone="green">最低</Tag> : null}</td>
                        <td className="is-num num">{fmt(s.price)}</td>
                        <td>{s.ok ? <Tag tone="green">已准入</Tag> : <Tag tone="gray">未准入</Tag>}</td>
                        <td><Op onClick={() => adopt(s.price, `供应商报价 · ${s.name} · ${fmt(s.price)}`)}>采纳</Op></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="nc-tiny nc-muted" style={{ marginTop: 6 }}>未准入供应商报价不计入最低价判定。</div>
              </div>

              {/* ③ 项目使用价格 */}
              <div className="nc-prc-sec">
                <div className="nc-prc-hd">③ 项目使用价格 <Tag tone="green">历史项目实际成本</Tag></div>
                <table className="nc-tbl" style={{ minWidth: 640 }}>
                  <thead><tr><th>项目（脱敏）</th><th style={{ width: 110 }} className="is-num">使用价</th><th style={{ width: 100 }}>日期</th><th style={{ width: 84 }}>状态</th><th style={{ width: 90 }}>操作</th></tr></thead>
                  <tbody>
                    {R.projs.map((p, i) => (
                      <tr key={p.proj + i}>
                        <td>{p.proj}{i === 0 ? <Tag tone="blue">最近</Tag> : null}</td>
                        <td className="is-num num">{fmt(p.price)}</td>
                        <td className="nc-tiny num">{p.date}</td>
                        <td><Tag tone={p.st === '已转化' ? 'blue' : 'green'}>{p.st}</Tag></td>
                        <td><Op onClick={() => adopt(p.price, `项目使用价 · ${p.proj} · ${fmt(p.price)}`)}>采纳</Op></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="nc-prc-note">采纳将写入成本参考价并<b>留痕（含来源）</b>；上浮单价按上浮方式自动重算。</div>

              {costHist.length > 0 && (
                <>
                  <div className="nc-sec-title" style={{ marginTop: 14 }}>本次采纳留痕（{costHist.length}）</div>
                  <table className="nc-tbl" style={{ minWidth: 640 }}>
                    <thead><tr><th>行</th><th style={{ width: 170 }}>旧值 → 新值</th><th style={{ width: 80 }}>操作人</th><th>来源</th></tr></thead>
                    <tbody>
                      {costHist.map((h, i) => (
                        <tr key={i}>
                          <td>{h.row}</td>
                          <td className="num">{fmt(h.old)} → <b>{fmt(h.nu)}</b></td>
                          <td>{h.by}</td>
                          <td className="nc-tiny nc-muted">{h.src}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </>
          );
        })()}
      </Drawer>

      {/* ===== 提交审批 ===== */}
      <Modal open={submitOpen} onClose={() => setSubmitOpen(false)} width={480} title="提交审批"
        foot={<><Btn onClick={() => setSubmitOpen(false)}>取消</Btn><Btn kind="primary" onClick={doSubmit}>确认提交</Btn></>}>
        <Banner tone={hit ? 'warn' : 'info'}>{hitWhy}{hit && <> · 金额口径路由至 <b>{approveLevel(sumExTax)}</b></>}</Banner>
        {/* 第二道闸（4.6）：低于目录默认毛利的，提交时必须写明让价理由，且有让价就要往上加签 */}
        {guard.rows.length > 0 && (
          <Banner tone={guard.level === '—' ? 'warn' : 'danger'}>
            {marginGuardText(guard)}
            {guard.level !== '—' && <> · 加签至 <b>{routeLvl}</b></>}
          </Banner>
        )}
        <KvGrid cols={2} rows={[
          { k: '明细行数', v: `${items.length} 行` },
          { k: '报价总额（含税）', v: fmt(sumExTax) },
          { k: '整体浮率', v: grossMarkup.toFixed(1) + '%' },
          { k: '税率', v: `含税 ${taxRate}%` },
        ]} />
        {/* 「变更原因」要写的是本次到底改了什么 —— 改动清单就在旁边，别让人凭记忆写 */}
        {editing && (
          <div className="nc-editdiff-savehint">
            相对进入编辑时的内容，本次共 <b className="num">{editChanges.length}</b> 处改动
            {editChanges.length > 0
              ? <button className="nc-btn nc-btn-link" style={{ marginLeft: 8 }} onClick={() => { setSubmitOpen(false); setDiffOpen(true); }}>查看改动明细 →</button>
              : <span className="nc-cell-sub">（明细未变，仅状态推进）</span>}
          </div>
        )}
        <Field label="变更原因" req note={`${reason.length}/200 字`}>
          <textarea className="nc-input" rows={3} maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="例：按客户预算删减应急照明系统，报警点位优化" />
        </Field>
        {guard.rows.length > 0 && (
          <Field label="低于标准毛利的理由" req note={`${guardReason.length}/200 字 · ${guard.rows.length} 行低于目录默认毛利`}>
            <textarea
              className="nc-input" rows={2} maxLength={200} value={guardReason}
              onChange={(e) => setGuardReason(e.target.value)}
              placeholder={`例：${guard.rows[0].name}按甲方集采名录询价报价，以整体安装量换总体毛利`}
            />
          </Field>
        )}
      </Modal>

      {/* ===== 打印预览（留痕） ===== */}
      <Modal open={printOpen} onClose={() => setPrintOpen(false)} width={900} title="打印预览"
        foot={<><Btn onClick={() => setPrintOpen(false)}>取消</Btn><Btn kind="primary" onClick={() => { setPrintOpen(false); toast(`已确认打印并留痕：${qName} · V2 · 打印人 ${role} · ${TODAY}`); }}>确认打印（留痕）</Btn></>}>
        {/* 真实报价单样式 A4 */}
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: 32, fontFamily: 'SimSun, serif' }}>
          {/* 标题 */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 4 }}>报 价 单</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>QUOTATION</div>
          </div>

          {/* 客户信息区 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, fontSize: 13 }}>
            <div>
              <div style={{ marginBottom: 6 }}><span style={{ color: '#6b7280' }}>致：</span><b>{customer}</b></div>
              <div style={{ marginBottom: 6 }}><span style={{ color: '#6b7280' }}>项目名称：</span>{qName}</div>
              <div><span style={{ color: '#6b7280' }}>项目类型：</span>{pType}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ marginBottom: 6 }}><span style={{ color: '#6b7280' }}>报价单号：</span>BJ000011</div>
              <div style={{ marginBottom: 6 }}><span style={{ color: '#6b7280' }}>报价日期：</span>{TODAY}</div>
              <div><span style={{ color: '#6b7280' }}>有效期：</span>报价后 {valid}</div>
            </div>
          </div>

          {/* 明细表 */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 16 }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                <th style={{ border: '1px solid #d1d5db', padding: '8px 6px', textAlign: 'center', width: 40 }}>序号</th>
                <th style={{ border: '1px solid #d1d5db', padding: '8px 6px', textAlign: 'center', width: 74 }}>清单编码</th>
                <th style={{ border: '1px solid #d1d5db', padding: '8px 6px', textAlign: 'center' }}>目录</th>
                <th style={{ border: '1px solid #d1d5db', padding: '8px 6px', textAlign: 'center' }}>名称</th>
                <th style={{ border: '1px solid #d1d5db', padding: '8px 6px', textAlign: 'center', width: 60 }}>单位</th>
                <th style={{ border: '1px solid #d1d5db', padding: '8px 6px', textAlign: 'center', width: 80 }}>数量</th>
                <th style={{ border: '1px solid #d1d5db', padding: '8px 6px', textAlign: 'center', width: 100 }}>单价(元)</th>
                <th style={{ border: '1px solid #d1d5db', padding: '8px 6px', textAlign: 'center', width: 120 }}>金额(元)</th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, 8).map((it, idx) => {
                const L = line(it);
                /**
                 * 服务类行（维保 / 检测）的钱是按「服务对象的规模」算的，不是「数量 × 单价」。
                 * 若照搬物料行的印法，纸上会印出它那个无意义的 qty=1 与一个看起来像单价的年度总价 ——
                 * 客户照这行核，永远核不上。此处把三列换成该口径自己的计量语言。
                 */
                const srv = isRateRow(it) ? L.q : undefined;
                const cell = !srv
                  ? { qty: String(it.qty), unit: it.unit, price: fmt(L.price) }
                  : srv.basis === 'area'
                    ? { qty: (it.basisArea ?? 0).toLocaleString('en-US'), unit: '㎡', price: `${(srv.rows[0]?.unitPrice ?? 0).toFixed(2)} 元/㎡·${L.rate?.period ?? ''}` }
                    : srv.basis === 'point'
                      ? { qty: (it.basisPoints ?? []).reduce((s, p) => s + p.qty, 0).toLocaleString('en-US'), unit: '点', price: '按点位分项' }
                      : { qty: fmt(it.basisAsset ?? 0), unit: '元', price: `${assetPctOf(L.rate!, it.basisAsset ?? 0)}% 费率` };
                return (
                <tr key={it.id}>
                  <td style={{ border: '1px solid #d1d5db', padding: '6px', textAlign: 'center' }}>{idx + 1}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '6px', textAlign: 'center', fontSize: 11, color: '#6b7280' }}>{it.catId ? (listCodeOf(it.catId) || '—') : '—'}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '6px', fontSize: 11, color: '#6b7280' }}>{it.catId ? catPath(it.catId) : '—'}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '6px' }}>
                    {it.name}
                    {srv && <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 2 }}>{BILL_BASIS_CN[srv.basis]} · 计量基数 {srv.rows.map((r) => r.label).join('；')}</div>}
                  </td>
                  <td style={{ border: '1px solid #d1d5db', padding: '6px', textAlign: 'center' }}>{cell.unit}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '6px', textAlign: 'right' }}>{cell.qty}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '6px', textAlign: 'right' }}>{cell.price}</td>
                  <td style={{ border: '1px solid #d1d5db', padding: '6px', textAlign: 'right' }}>{fmt(L.amt)}</td>
                </tr>
                );
              })}
              <tr>
                <td colSpan={7} style={{ border: '1px solid #d1d5db', padding: '6px', textAlign: 'center', fontSize: 11, color: '#9ca3af' }}>
                  （预览展示前 8 行，共 {items.length} 行）
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={6} style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'right', fontWeight: 600 }}>合计（{exTax ? '不含税' : '含税'}）：</td>
                <td style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'right', fontWeight: 700 }}>{fmt(total)}</td>
              </tr>
            </tfoot>
          </table>

          {/* 价格口径说明 */}
          <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 20, lineHeight: 1.6 }}>
            {PRINT_TERMS.map((t, i) => <div key={i}>{i + 1}. {t}</div>)}
          </div>

          {/* 底部签章区 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, fontSize: 12 }}>
            <div>
              <div style={{ marginBottom: 40 }}>报价单位（盖章）：</div>
              <div style={{ marginBottom: 4 }}>联系人：___________</div>
              <div>联系电话：___________</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ marginBottom: 40 }}>客户确认（盖章）：</div>
              <div style={{ marginBottom: 4 }}>确认人：___________</div>
              <div>确认日期：___________</div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ===== 版本管理 ===== */}
      <Modal open={verOpen} onClose={() => setVerOpen(false)} width={900} title="版本管理"
        foot={<Btn onClick={() => setVerOpen(false)}>关闭</Btn>}>
        <table className="nc-tbl" style={{ minWidth: 780 }}>
          <thead><tr><th style={{ width: 60 }}>版本</th><th style={{ width: 140 }}>时间</th><th style={{ width: 90 }}>操作人</th><th style={{ width: 120, textAlign: 'right' }}>报价总额</th><th style={{ width: 90 }}>状态</th><th style={{ width: 200 }}>变更说明</th><th style={{ width: 100 }}>操作</th></tr></thead>
          <tbody>
            {VERSIONS.map((v) => (
              <tr key={v.v}>
                <td><Tag tone={v.st === '已归档' ? 'gray' : 'blue'}>{v.v}</Tag></td>
                <td className="num nc-tiny">{v.at}</td>
                <td>{v.by}</td>
                <td className="is-num"><Money v={v.amt} role={role} /></td>
                <td><Tag tone={v.st === '已归档' ? 'gray' : 'blue'}>{v.st}</Tag></td>
                <td className="nc-cell-sub">{v.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>

      {/* ===== 报价审批（页内） ===== */}
      <Modal open={apprOpen} onClose={() => setApprOpen(false)} width={480} title="报价审批"
        foot={<><Btn onClick={() => setApprOpen(false)}>← 返回台账</Btn><Btn onClick={() => { setApprOpen(false); go('approval'); }}>去审批中心</Btn><Btn kind="primary" onClick={() => { setApprOpen(false); toast('已通过并流转至下一节点'); }}>通过并流转</Btn></>}>
        <Banner tone={hit ? 'warn' : 'info'}>{hitWhy}{hit && <> · 分级路由至 <b>{routeLvl}</b></>}</Banner>
        <KvGrid cols={2} rows={[
          { k: '报价单号', v: <EntityLink target="quote-detail" id="BJ000011" go={go} title="下钻到报价详情">BJ000011</EntityLink> },
          { k: '版本', v: 'V2' },
          { k: '客户', v: customer },
          { k: '税率口径', v: `${exTax ? '不含税' : '含税'} ${taxRate}%（税额 ${fmt(tax)}）` },
          { k: '报价总额', v: fmt(total) },
          { k: '整体浮率', v: grossMarkup.toFixed(1) + '%' },
          { k: '有效期', v: `报价后 ${valid}` },
          { k: '审批路由', v: routeLvl },
        ]} />
        <Field label="审批意见" note="可填写审批意见，将展示在审批链中（选填）">
          <textarea className="nc-input" rows={3} placeholder="通过后流转至：总经理（刘振国）；驳回需填写原因并退回报价草稿状态" />
        </Field>
      </Modal>

      {/* ===== 本次改动对比 ===== */}
      <Drawer open={diffOpen} onClose={() => setDiffOpen(false)} width={920} title="本次改动对比"
        sub={<>对比基准：进入编辑时的已保存内容{editing ? `（${editing.id} ${editing.ver}）` : '（新建报价单，无基线，全部按新增计）'} · 当前 {items.length} 行明细</>}
        foot={<Btn onClick={() => setDiffOpen(false)}>关闭</Btn>}>
        <EditDiffTable base={baseViews} cur={curViews} labelOf={catPath} />
      </Drawer>

      {/* ===== 保存方式选择弹窗 ===== */}
      <Modal open={saveChoiceOpen} onClose={() => setSaveChoiceOpen(false)} width={520} title="保存方式">
        <div style={{ padding: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: 'var(--ink-1)' }}>请选择保存方式</div>
          {editChanges.length > 0 && (
            <div className="nc-editdiff-savehint">
              本次编辑共 <b className="num">{editChanges.length}</b> 处改动（新增 {editChanges.filter((c) => c.kind === 'add').length} · 删除 {editChanges.filter((c) => c.kind === 'del').length} · 修改 {editChanges.filter((c) => c.kind === 'mod').length}）
              <button className="nc-btn nc-btn-link" style={{ marginLeft: 8 }} onClick={() => { setSaveChoiceOpen(false); setDiffOpen(true); }}>查看改动明细 →</button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <div style={{ 
              flex: 1, 
              padding: 20, 
              border: '2px solid var(--c-border)', 
              borderRadius: 8, 
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: 'var(--c-canvas)'
            }}
            onClick={() => { setSaveChoiceOpen(false); if (editing) { patchQuote(editing.id, { update: TODAY }); rebase(); setDiffMap(new Map()); toast(`${editing.id} 已保存为当前版本`); }; }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--c-primary)'; e.currentTarget.style.background = 'var(--c-primary-bg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.background = 'var(--c-canvas)'; }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-1)', marginBottom: 4 }}>保存为当前版本</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.6 }}>覆盖原版本内容<br/>直接更新当前报价</div>
            </div>
            <div style={{ 
              flex: 1, 
              padding: 20, 
              border: '2px solid var(--c-border)', 
              borderRadius: 8, 
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: 'var(--c-canvas)'
            }}
            onClick={() => { setSaveChoiceOpen(false); if (editing) { setDiffMap(new Map()); toast(`已基于 ${editing.ver} 保存为新版本 ${nextVerNo}`); }; }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--c-primary)'; e.currentTarget.style.background = 'var(--c-primary-bg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.background = 'var(--c-canvas)'; }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>🆕</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-1)', marginBottom: 4 }}>保存为新版本</div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.6 }}>生成新的版本号<br/>保留历史版本记录</div>
            </div>
          </div>
        </div>
      </Modal>

      {/* ===== 转合同 · 原子事务 ===== */}
      <Modal open={cvtOpen} onClose={() => setCvtOpen(false)} width={480} title="转合同"
        foot={<><Btn onClick={() => setCvtOpen(false)}>取消</Btn><Btn kind="primary" onClick={() => {
          setCvtOpen(false);
          toast(`转合同成功：HT${TODAY.replace(/-/g, '')}-0013 已生成（${items.length} 行明细已转入）· 商机置「待启动」`);
          go('contract');
        }}>确认转合同</Btn></>}>
        <Banner tone="gold">报价明细将<b>逐行转入合同明细</b>，同时生成销售合同草稿并回写商机 / 项目；任一步不成功则<b>整单不生效</b>，不留半截数据。</Banner>
        <KvGrid cols={2} rows={[
          { k: '报价单', v: <><EntityLink target="quote-detail" id="BJ000011" go={go} title="下钻到报价详情">BJ000011</EntityLink> · V2</> },
          { k: '客户', v: customer },
          { k: '明细行数', v: `${items.length} 行` },
          { k: '合同金额', v: fmt(total) },
          { k: '税率口径', v: `${exTax ? '不含税' : '含税'} ${taxRate}%` },
          { k: '有效期', v: `报价后 ${valid}` },
          { k: '差额处理', v: '与报价差额进变更台账' },
          { k: '审批状态', v: hit ? <Tag tone="orange">待审批快照</Tag> : <Tag tone="green">免审</Tag> },
        ]} />
      </Modal>

      {/* ===== 独立新建报价单 ===== */}
      <Modal open={newQOpen} onClose={() => setNewQOpen(false)} width={480} title="＋ 新建报价单（独立新建）"
        foot={<><Btn onClick={() => setNewQOpen(false)}>取 消</Btn><Btn kind="primary" disabled={!nqName.trim() || !nqCust} title={!nqCust ? '请选择客户（必填）' : nqName.trim() ? undefined : '请填写报价单名称（必填）'} onClick={() => {
          const no = nextQuoteNo();
          addQuote({
            id: no, ver: 'V1', customer: nqCust, customerId: CUSTOMERS.find((c) => c.name === nqCust)?.id ?? '',
            opp: '', name: nqName.trim(), total: 0, taxRate: 9, taxMode: '含税', status: '草稿',
            owner: '当前用户', date: TODAY, update: TODAY, approveLevel: '—', markup: 0,
            region: '昆明', uplift: 0, items: 0, base: nqType, costSqm: 0, lines: [],
          });
          setNewQOpen(false); setNqName('');
          setFocus('quote-edit', no);
          go('quote-edit');
          toast(`报价单 ${no} 已创建（草稿）· 已切到该单继续组价`);
        }}>创建草稿</Btn></>}>
        <div className="nc-warnbox is-info">独立新建不继承当前页明细；单号自动生成，初始状态「草稿」，组价完成后再提交审批。</div>
        <div className="nc-form-grid">
          <Field label="客户" req span={2}>
            <CustomerPicker value={nqCust} onChange={setNqCust} emit="name" />
          </Field>
          <Field label="报价名称" req span={2}>
            <input className="nc-input" value={nqName} onChange={(e) => setNqName(e.target.value)} placeholder="如：××医院住院楼消防系统升级报价" />
          </Field>
          <Field label="项目类型" req>
            <select className="nc-input" value={nqType} onChange={(e) => setNqType(e.target.value)}>
              <option>新建</option><option>改造</option><option>维护保养</option>
            </select>
          </Field>
          <Field label="税率" note="默认 9%">
            <select className="nc-input" defaultValue={9}>
              <option value={9}>9%（建筑业）</option><option value={13}>13%</option><option value={6}>6%（服务·维护保养）</option><option value={3}>3%</option>
            </select>
          </Field>
        </div>
      </Modal>

      {/* ============ 统一导出弹窗 ============ */}
      <ExportDialog {...exportApi.dialogProps} />
    </>
  );
}
