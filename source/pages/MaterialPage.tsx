// 诺安云 6.0 · 材料 / 产品主数据工作台 · PRD §16
// 三块主数据：材料（纯物料）/ 产品与服务（单品、套件）/ 套件 BOM（套件的材料组合）
// 套件成本 = Σ(材料×单耗×(1+损耗%)) + 人工 + 其他
// 分类为多级树（CategoryTree 组件，任意层级可维护）
// 配置类 Tab（报价分类目录 / 单位字典 / 认证标记 / 价格与浮率 / 变更日志）已迁入「系统设置」
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Banner, Btn, Card, Check, DataTable, Drawer, EntityLink, Field, KvGrid, ListToolbar, Modal, Op, OpSep,
  PageHead, TableFoot, Tag, Tabs, Tile, Tip, useToast, type Col, type TagTone, pressProps,} from '../components/ui';
import CategoryTree from '../components/CategoryTree';
import {
  BOMS, MARK_TYPES, MATERIALS, PRODUCTS, SUPPLIERS, UNITS, bomCost, catOptions, catPath, catSubtreeIds,
  fmt, fmtWan, UNIT_DESC,
  /* 材料域配套数据集：原写死在页内，已下沉数据层以保证可溯源 */
  WAREHOUSES as WH, LOCATIONS as LOC, PRICE_LIB,
  FLOW_ROWS as FLOW_SEED, FLOW_TONE,
  CERT_TYPES, CERT_CHANNELS as CHANNELS, CERT_ROWS as CERT_SEED, daysLeft,
  RFQ_ROWS as RFQ_SEED, RFQ_TONE,
  MAT_AUDIT_ROWS as AUDIT_SEED,
  type CertRow, type RfqRow,
} from '../components/data';
import { Ico } from '../components/icons';

type Mat = (typeof MATERIALS)[number] & { ty?: string };
/** 台账行 = 材料 | 产品；套件作为产品的一款类型展示 */
type Row = Mat & { kind: '材料' | '产品'; isKit?: boolean };

/* 仓库 / 库位、价格库、作业流水、认证报告、询比价、操作日志
   均已下沉至 components/data.ts（可溯源），见上方 import。 */

/* 作业流水 / 认证报告数据集已下沉至 data.ts（FLOW_SEED / CERT_SEED 见 import） */

/* 认证类型 / 通知渠道 / 认证记录 / daysLeft 已下沉至 data.ts */

/* 询比价记录与状态色板已下沉至 data.ts（RFQ_SEED / RFQ_TONE 见 import） */
const supName = (id: string) => SUPPLIERS.find((s) => s.id === id)?.name || id;
const supOf = (id: string) => SUPPLIERS.find((s) => s.id === id);

/* 操作日志（审计）已下沉至 data.ts（AUDIT_SEED 见 import） */

export default function MaterialPage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  /** 初始落在「主数据 · 材料台账」：tab 必须是 DOMAIN_TABS[domain] 中的有效 key，
      否则 Tabs 无选中项且主体无匹配分支 → 整页空白 */
  const [tab, setTab] = useState('mat');
  /** 工作域：把原先 10 个平铺 Tab 收敛为 4 个工作域（主数据 / 仓储 / 寻源 / 合规），
      解决「Tab 过载 + 与顶部指标卡双导航」导致的信息架构混乱 */
  const [domain, setDomain] = useState<'master' | 'wh' | 'src' | 'cmp'>('master');
  const [kw, setKw] = useState('');
  const [cat, setCat] = useState('全部');
  const [st, setSt] = useState('全部');
  const [cert, setCert] = useState('全部');
  const [detail, setDetail] = useState<Mat | null>(null);
  /** 当前展开配方的套件产品编码（空 = 未展开） */
  const [bomProd, setBomProd] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', spec: '', cat: '', unit: UNITS[0], price: '', safe: '', ccc: false, mand: false });
  const [newErr, setNewErr] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [catTree, setCatTree] = useState('');
  /** 台账视图：材料 / 产品（套件=产品 ty 字段） */
  const [kind, setKind] = useState<'材料' | '产品'>('材料');

  /* —— 库存作业 —— */
  const [whView, setWhView] = useState('全部');
  const [opIn, setOpIn] = useState(false);
  const [opOut, setOpOut] = useState(false);
  const [opBack, setOpBack] = useState(false);
  const [opCheck, setOpCheck] = useState(false);
  const [opMove, setOpMove] = useState(false);
  const [opSafe, setOpSafe] = useState<Mat | null>(null);
  const [safeVal, setSafeVal] = useState('');
  const [inCode, setInCode] = useState(MATERIALS[0].code);
  const [inWh, setInWh] = useState(WH[0]);
  const [inLoc, setInLoc] = useState(LOC[0]);
  const [inBatch, setInBatch] = useState('');
  const [inQty, setInQty] = useState('');
  const [inPrice, setInPrice] = useState('');
  const [inDate, setInDate] = useState('2026-09-20');
  const [inBy, setInBy] = useState('张仓');
  const [inErr, setInErr] = useState('');
  /** 出入库 / 退料 / 盘点共用同一套表单 state：打开与提交后重置数量类字段，
      避免上次输入的批次号 / 单价 / 数量被误带入下一笔单据（物料与仓库保留上次选择） */
  const resetOpForm = () => { setInErr(''); setInQty(''); setInBatch(''); setInPrice(''); };

  /* —— 价格库 —— */
  const [plibRev, setPlibRev] = useState(false);
  const [plibHis, setPlibHis] = useState<typeof PRICE_LIB[number] | null>(null);

  /* —— 认证与报告 —— */
  const [certs, setCerts] = useState<CertRow[]>(CERT_SEED);
  const [certUp, setCertUp] = useState(false);
  const [cuMat, setCuMat] = useState(MATERIALS[0].code);
  const [cuType, setCuType] = useState(CERT_TYPES[0]);
  const [cuNo, setCuNo] = useState('');
  const [cuTo, setCuTo] = useState('');
  const [cuBatch, setCuBatch] = useState('');
  const [cuCh, setCuCh] = useState(CHANNELS[0]);

  /* —— 询比价 —— */
  const [rfqs, setRfqs] = useState<RfqRow[]>(RFQ_SEED);
  const [rfqNew, setRfqNew] = useState(false);
  const [rfqLines, setRfqLines] = useState<{ code: string; qty: string }[]>([{ code: MATERIALS[0].code, qty: '' }]);
  const [rfqNeed, setRfqNeed] = useState('2026-09-28');
  const [rfqDl, setRfqDl] = useState('2026-09-23 18:00');
  const [rfqInv, setRfqInv] = useState<string[]>(['GYS000012', 'GYS000028']);
  const [rfqErr, setRfqErr] = useState('');
  const [qrOpen, setQrOpen] = useState<string | null>(null);
  const [matrix, setMatrix] = useState<RfqRow | null>(null);
  const [quoteAs, setQuoteAs] = useState('GYS000012');
  const [quoteOpen, setQuoteOpen] = useState<RfqRow | null>(null);
  const [quoteVals, setQuoteVals] = useState<Record<string, string>>({});
  const [bomUp, setBomUp] = useState<string | null>(null);

  /* —— 搜索（Ctrl+K 全局检索，本页内） —— */
  const [gSearch, setGSearch] = useState(false);
  const [gKw, setGKw] = useState('');

  /* 全局搜索 Ctrl+K */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); (e as unknown as { __ncHandled?: boolean }).__ncHandled = true; setGSearch(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* G1：原 rows 直接读模块常量，入库 / 领用 / 退料 / 盘点只 toast 不改库存，
     「库存 / 安全库存」列与低库存计数永远不变。改为可写 state。 */
  const [rows, setRows] = useState<Mat[]>(MATERIALS as unknown as Mat[]);

  /** 台账行：材料（可写）+ 产品 / 服务（含套件，只读视图） */
  const allRows = useMemo<Row[]>(() => [
    ...rows.map((m) => ({ ...m, kind: '材料' as const, isKit: false })),
    ...PRODUCTS.map((p) => ({
      id: p.code, code: p.code, name: p.name, spec: p.spec, unit: p.unit,
      type: '产品' as const, cat: p.cat, price: p.price,
      /* 产品 / 服务不持有实物库存，库存列显示「—」；字段保留 0 以复用列渲染 */
      stock: 0, safe: 0, status: p.status,
      ccc: p.ccc, mand: p.mand,
      kind: '产品' as const, isKit: p.ty === '套件',
      ty: p.ty, owner: p.owner, rng: p.rng, avg: p.avg, dev: p.dev, ref: p.ref,
    })),
  ], [rows]);

  /** 库存增减（正数入库 / 退料 / 盘盈，负数领用 / 盘亏） */
  const adjStock = (code: string, delta: number, msg: string) => {
    setRows((rs) => rs.map((x) => (x.code === code ? { ...x, stock: Math.max(0, x.stock + delta) } : x)));
    toast(msg);
  };
  /** 分类过滤：树节点 → 含全部后代（多级分类的应有语义） */
  const inCat = (id: string, code: string) => !code || catSubtreeIds(id).includes(code);
  const base = useMemo(() => allRows.filter((m) =>
    m.kind === kind
    && (!catTree || inCat(catTree, m.cat))
    && (cat === '全部' || m.cat === cat)), [allRows, kind, catTree, cat]);
  const cntBy = (fn: (m: Row) => boolean) => base.filter(fn).length;
  const filtered = useMemo(() => base.filter((m) =>
    (st === '全部' || m.status === st)
    && (cert === '全部' || (cert === '强制认证' ? m.mand : m.ccc))
    && (!kw || m.name.includes(kw) || m.code.includes(kw) || m.spec.includes(kw))), [base, st, cert, kw]);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);
  /** 分类树上的条目计数（跨材料 / 产品全量，便于判断分类是否被引用） */
  const catCount = (id: string) => allRows.filter((r) => catSubtreeIds(id).includes(r.cat)).length;

  /* 目录映射已按工作域拆分，见下方 DOMAIN_TABS（原 10 个平铺 Tab 已废弃） */

  /** 工作域 → 子 Tab：每个域只暴露 2~3 个，避免一次性平铺 10 个 Tab */
  const DOMAIN_TABS: Record<typeof domain, { key: string; label: string; cnt: number }[]> = {
    master: [
      { key: 'mat', label: '材料台账', cnt: allRows.filter((r) => r.kind === '材料').length },
      { key: 'prod', label: '产品 / 服务', cnt: allRows.filter((r) => r.kind === '产品').length },
      { key: 'bom', label: '套件 BOM', cnt: Object.keys(BOMS).length },
    ],
    wh: [
      { key: 'stock', label: '库存与领用', cnt: rows.filter((r) => r.stock < r.safe).length },
      { key: 'flow', label: '作业流水', cnt: FLOW_SEED.length },
    ],
    src: [
      { key: 'rfq', label: '询比价', cnt: rfqs.length },
      { key: 'plib', label: '材料价格库', cnt: PRICE_LIB.filter((p) => p.review).length },
      { key: 'sup', label: '供应商报价', cnt: SUPPLIERS.length },
    ],
    cmp: [
      { key: 'cert', label: '认证与报告', cnt: certs.length },
      { key: 'audit', label: '操作日志', cnt: AUDIT_SEED.length },
    ],
  };

  /** 工作域定义：顶部指标卡即域切换器（消除原「指标卡 + Tab」双导航） */
  const DOMAINS: { key: typeof domain; label: string; value: React.ReactNode; sub: string; tone?: 'red' | 'orange' | 'blue' | 'green' }[] = [
    { key: 'master', label: '主数据', value: allRows.length, sub: `材料 ${rows.length} · 产品 ${PRODUCTS.length}`, tone: 'blue' },
    { key: 'wh', label: '仓储作业', value: rows.filter((r) => r.stock < r.safe).length, sub: '低于安全库存待补货', tone: 'red' },
    { key: 'src', label: '采购寻源', value: rfqs.length, sub: `待复核调价 ${PRICE_LIB.filter((p) => p.review).length} 项`, tone: 'orange' },
    { key: 'cmp', label: '合规审计', value: certs.length, sub: '认证与报告在册', tone: 'green' },
  ];

  /** 切换工作域：进入该域首个 Tab 并重置筛选 / 分页 */
  const enterDomain = (d: typeof domain) => {
    setDomain(d);
    const first = DOMAIN_TABS[d][0].key;
    setTab(first);
    if (first === 'mat') setKind('材料');
    if (first === 'prod') setKind('产品');
    setCatTree(''); setCat('全部'); setSt('全部'); setCert('全部'); setPage(1);
  };

  /** 台账列：材料 / 产品同表，套件走「套件」徽标（BOM 入口只在套件行出现） */
  const cols: Col<Row>[] = [
    { key: 'code', title: '编码', width: 118, render: (m) => <span className="num nc-id-cell nc-link" onClick={() => setDetail(m)} {...pressProps(() => setDetail(m))}>{m.code}</span> },
    {
      key: 'name', title: '名称 / 规格', render: (m) => (
        <div>
          <div>
            {m.name}
            {m.kind === '产品' && m.ty === '套件' && <Tag tone="purple">套件</Tag>}
            {m.ccc && <Tag tone="red">CCCF</Tag>}
            {m.mand && <Tag tone="orange">强制</Tag>}
          </div>
          <div className="nc-tiny nc-muted">规格型号：{m.spec}</div>
        </div>
      ),
    },
    { key: 'kind', title: '类别', width: 92, render: (m) => <Tag tone={m.kind === '产品' ? 'blue' : 'gray'}>{m.kind}</Tag> },
    {
      key: 'cat', title: '分类目录', width: 150, render: (m) => (
        <span className="nc-tiny" title={catPath(m.cat)}>{catPath(m.cat)}</span>
      ),
    },
    { key: 'unit', title: '单位', width: 64, align: 'center', render: (m) => <b>{m.unit}</b> },
    { key: 'price', title: '参考单价', width: 108, align: 'right', render: (m) => <b className="num">{fmt(m.price)}</b> },
    {
      key: 'stock', title: '库存 / 安全库存', width: 152, render: (m) => {
        /* 产品 / 服务不持有实物库存（实物在材料侧） */
        if (m.kind === '产品') return <span className="nc-muted nc-tiny">—（服务 / 成套交付）</span>;
        const low = m.stock < m.safe;
        return <span className={low ? 'nc-v-red' : ''}><b className="num">{m.stock}</b><span className="nc-muted"> / {m.safe} {m.unit}</span>{low && <Tag tone="red">低库存</Tag>}</span>;
      },
    },
    {
      key: 'status', title: '状态', width: 84,
      render: (m) => (m.status === '启用' || m.status === '在售' ? <Tag tone="green" pill>{m.status}</Tag> : <Tag tone="gray" pill>{m.status}</Tag>),
    },
    {
      key: 'op', title: '操作', width: 168, render: (m) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Op onClick={() => setDetail(m)}>详情</Op>
          <OpSep />
          {m.isKit
            ? <Op onClick={() => { setDomain('master'); setBomProd(m.code); setTab('bom'); setPage(1); }}>展开 BOM</Op>
            : <Op onClick={() => setDetail(m)}>编辑</Op>}
          <OpSep />
          <Op onClick={() => { const clone = { ...m, id: m.id + '_cpy_' + Date.now(), code: m.code + '-C' + Math.floor(Math.random() * 900 + 100), name: m.name + '（副本）', stock: 0 }; setRows((rs) => [...rs, clone as Mat]); toast(`已复制 ${m.code} 为新编码 ${clone.code}`); }}>复制</Op>
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHead
        crumbs={['供应链管理', '材料管理']}
        title="材料 / 产品主数据"
        badges={<><Tag tone="orange">低库存 {rows.filter((r) => r.stock < r.safe).length}</Tag><Tag tone="red">强制认证 {rows.filter((r) => r.mand || r.ccc).length}</Tag></>}
        actions={<>
          <Btn onClick={() => setGSearch(true)} title="本页检索 Ctrl+K"><Ico n="search" size={16} /> 搜索 Ctrl+K</Btn>
          {/* 操作日志属「合规审计」域：必须同时切域，否则 tab 不在当前域 Tab 列表内 → 整页空白 */}
          <Btn onClick={() => { setDomain('cmp'); setTab('audit'); setPage(1); }} title="操作日志（关键操作审计）"><Ico n="clipboard" size={16} /> 日志</Btn>
          <Btn onClick={() => go('settings')} title="分类 / 单位 / 认证标记等公共基线维护"><Ico n="gear" size={16} /> 系统设置</Btn>
          <Btn onClick={() => setImportOpen(true)}>批量导入</Btn>
          <Btn kind="primary" onClick={() => setNewOpen(true)}>+ 新增材料 / 产品</Btn>
        </>}
      />

      {/* 工作域指标卡 = 域切换器：4 个域取代原「6 指标卡 + 10 Tab」的双导航，
          指标卡只负责切域，Tab 只负责域内子视图，层级不再交叉 */}
      <div className="nc-tiles nc-tiles-4">
        {DOMAINS.map((d) => (
          <Tile key={d.key} label={d.label} value={d.value} sub={d.sub} tone={d.tone}
            active={domain === d.key} onClick={() => enterDomain(d.key)} />
        ))}
      </div>

      <Card flush>
        <div style={{ padding: '12px 16px 0' }}>
          <Tabs value={tab} onChange={(k) => { setTab(k); setPage(1); if (k === 'mat') setKind('材料'); if (k === 'prod') setKind('产品'); if (k !== 'bom') setBomProd(null); }} items={DOMAIN_TABS[domain]} />
        </div>

        {/* ============ 材料台账 / 产品·服务 ============ */}
        {(tab === 'mat' || tab === 'prod') && (
          <div className="nc-doc-layout">
            <aside className="nc-doc-side">
              {/* 多级分类树：任意层级可维护（增 / 改名 / 删，被引用禁删） */}
              <CategoryTree
                value={catTree}
                onChange={(id) => { setCatTree(id); setPage(1); }}
                countOf={catCount}
                usedIds={allRows.map((r) => r.cat).filter(Boolean)}
                rootFilter={kind === '材料' ? 'mat' : 'prod'}
              />
              <div className="nc-doc-side-foot">
                <button className="nc-dir-item" onClick={() => go('settings')}>
                  <span>分类 / 单位 / 标记维护</span><span className="nc-tiny">→</span>
                </button>
              </div>
            </aside>
            <div className="nc-doc-main">
              <ListToolbar
                rows={[
                  {
                    label: '视图', value: kind, onChange: (k) => { const v = k as '材料' | '产品'; setTab(v === '材料' ? 'mat' : 'prod'); setKind(v); setCatTree(''); setCat('全部'); setSt('全部'); setCert('全部'); setPage(1); },
                    items: [
                      { key: '材料', label: '材料台账', cnt: rows.length },
                      { key: '产品', label: '产品 / 服务', cnt: PRODUCTS.length },
                    ],
                  },
                  {
                    label: '状态', value: st, onChange: (k) => { setSt(k); setPage(1); },
                    items: [
                      { key: '全部', label: '全部', cnt: base.length },
                      ...(kind === '材料'
                        ? [
                          { key: '启用', label: '启用', cnt: cntBy((m) => m.status === '启用') },
                          { key: '停用', label: '停用', cnt: cntBy((m) => m.status === '停用') },
                        ]
                        : [
                          { key: '在售', label: '在售', cnt: cntBy((m) => m.status === '在售') },
                          { key: '停售', label: '停售', cnt: cntBy((m) => m.status === '停售') },
                        ]),
                    ],
                  },
                  {
                    label: '认证', value: cert, onChange: (k) => { setCert(k); setPage(1); },
                    items: [
                      { key: '全部', label: '全部', cnt: base.length },
                      { key: '强制认证', label: '强制认证', cnt: cntBy((m) => m.mand) },
                      { key: 'CCCF', label: 'CCCF', cnt: cntBy((m) => m.ccc) },
                    ],
                  },
                ]}
                right={<>
                  <div className="nc-search" style={{ width: 220 }}>
                    <svg className="nc-search-ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                    <input value={kw} onChange={(e) => { setKw(e.target.value); setPage(1); }} placeholder="编码 / 名称 / 规格型号" />
                  </div>
                  <Btn size="sm" onClick={() => { setSt('全部'); setCert('全部'); setCat('全部'); setKw(''); setCatTree(''); setPage(1); }}>重置</Btn>
                </>}
              >
                <span className="nc-muted nc-tiny" style={{ marginLeft: 'auto' }}>
                  当前分类：<b>{catTree ? catPath(catTree) : '全部分类'}</b> · {filtered.length} 条
                </span>
              </ListToolbar>
              <DataTable cols={cols} rows={paged} rowKey={(m) => m.id} minWidth={1240}
                empty={kind === '材料'
                  ? '没有符合筛选条件的材料；材料为纯物料，套件请到「产品 / 服务」按组合配方维护'
                  : '没有符合筛选条件的产品 / 服务；套件须先在「套件 BOM」组合材料'}
                emptyCta={<Btn size="sm" kind="primary" onClick={() => setNewOpen(true)}>{kind === '材料' ? '＋ 新增材料' : '＋ 新增产品 / 服务'}</Btn>}
                foot={<TableFoot total={base.length} filtered={filtered.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />} />
            </div>
          </div>
        )}

        {/* ============
           套件 BOM（按产品挂配方 · 版本化）
           依据参考「主数据管理.html」：成本 = Σ(材料×单耗×(1+损耗%)) + 人工 + 其他；
           编辑已被引用的 BOM → 自动生成新版本，旧版永久保留（报价引用快照）。
           ============ */}
        {tab === 'bom' && (
          <div style={{ padding: 16 }}>
            <Banner tone="info">
              套件由多个材料组合而成，可作为一个整体对外报价；报价时一键展开为多行材料明细。
            </Banner>
            <div className="nc-tiny nc-muted" style={{ margin: '10px 0 8px' }}>
              共 {Object.keys(BOMS).length} 个套件 · 套件成本 = Σ（材料 × 单耗 ×（1 + 损耗%））+ 人工 + 其他；忽略损耗与人工将导致毛利虚高。
            </div>
            <DataTable
              minWidth={1040}
              rows={PRODUCTS.filter((p) => p.ty === '套件')}
              rowKey={(p) => p.code}
              empty="暂无套件产品；可在「产品 / 服务」中新增套件并配置配方"
              cols={[
                { key: 'code', title: '套件编号', width: 110, render: (p) => <span className="num nc-id-cell">{p.code}</span> },
                { key: 'name', title: '套件名称', width: 220, render: (p) => <><b>{p.name}</b><div className="nc-tiny nc-muted">{p.spec}</div></> },
                {
                  key: 'ver', title: '当前版本', width: 90,
                  render: (p) => {
                    const B = BOMS[p.code];
                    const nVer = B ? B.versions.length : 0;
                    return <><span className="num">{B?.cur || '—'}</span>{nVer > 1 && <span className="nc-tiny nc-muted"> ·{nVer} 版</span>}</>;
                  },
                },
                { key: 'mat', title: '材料成本', width: 90, align: 'right', render: (p) => <span className="num nc-muted">{fmt(bomCost(p.code).mat)}</span> },
                { key: 'total', title: '套件成本', width: 100, align: 'right', render: (p) => <b className="num">{fmt(bomCost(p.code).total)}</b> },
                { key: 'sale', title: '对外价', width: 100, align: 'right', render: (p) => { const c = bomCost(p.code); return <span className="num">{fmt(c.sale || p.price)}</span>; } },
                {
                  key: 'gross', title: '毛利率', width: 90, align: 'right',
                  render: (p) => {
                    const c = bomCost(p.code);
                    return <span className={`num${c.gross < 20 ? ' nc-v-red' : c.gross >= 30 ? ' nc-v-green' : ''}`}>{c.gross.toFixed(1)}%</span>;
                  },
                },
                {
                  key: 'check', title: '预检', width: 110,
                  render: (p) => (bomCost(p.code).short > 0 ? <Tag tone="red">缺料 {bomCost(p.code).short} 项</Tag> : <Tag tone="green">可配齐</Tag>),
                },
                {
                  key: 'op', title: '操作', width: 120,
                  render: (p) => <><Op onClick={() => setBomProd(p.code)}>查看配方</Op><OpSep /><Op onClick={() => setBomUp(p.code)}>升版</Op></>,
                },
              ]}
            />
          </div>
        )}

        {/* ============ 套件配方 BOM（详情 Drawer） ============ */}
        <Drawer open={!!bomProd} onClose={() => setBomProd(null)} width={860} title={bomProd ? `${PRODUCTS.find((x) => x.code === bomProd)?.name ?? bomProd} · 配方 BOM` : ''}>
          {bomProd && (() => {
            const B = BOMS[bomProd];
            const P0 = PRODUCTS.find((x) => x.code === bomProd);
            if (!B || !P0) return null;
            const c = bomCost(bomProd);
            const ver = B.versions.find((v) => v.v === B.cur)!;
            return (
              <>
                <div className="nc-money-row" style={{ marginBottom: 12 }}>
                  {[
                    { k: '当前版本', v: B.cur },
                    { k: '材料成本', v: fmt(c.mat) },
                    { k: '套件成本', v: fmt(c.total) },
                    { k: '对外价', v: fmt(c.sale) },
                    { k: '毛利率', v: `${c.gross.toFixed(1)}%` },
                    { k: '引用次数', v: `${ver.refs ?? 0} 次` },
                  ].map((m) => (
                    <div key={m.k} className="nc-money-cell"><span className="nc-tiny nc-muted">{m.k}</span><b className="num">{m.v}</b></div>
                  ))}
                </div>
                <table className="nc-tbl" style={{ minWidth: 760 }}>
                  <thead><tr>
                    <th style={{ width: 44 }}>序</th>
                    <th style={{ width: 110 }}>材料编码</th>
                    <th>材料名称 / 规格</th>
                    <th style={{ width: 80, textAlign: 'right' }}>单耗</th>
                    <th style={{ width: 56, textAlign: 'center' }}>单位</th>
                    <th style={{ width: 100, textAlign: 'right' }}>参考单价</th>
                    <th style={{ width: 100, textAlign: 'right' }}>小计</th>
                    <th style={{ width: 120 }}>备注</th>
                  </tr></thead>
                  <tbody>
                    {ver.items.map(([code, qty, note], i) => {
                      const m = MATERIALS.find((x) => x.code === code);
                      return (
                        <tr key={code + i}>
                          <td className="num">{i + 1}</td>
                          <td className="num nc-id-cell">{code}</td>
                          <td>{m ? <>{m.name} <span className="nc-tiny nc-muted">{m.spec}</span></> : <span className="nc-v-red">材料已下架</span>}</td>
                          <td className="is-num num">{qty}</td>
                          <td style={{ textAlign: 'center' }}>{m?.unit || '—'}</td>
                          <td className="is-num num">{fmt(m?.price || 0)}</td>
                          <td className="is-num num">{fmt((m?.price || 0) * qty)}</td>
                          <td className="nc-tiny nc-muted">{note || '—'}</td>
                        </tr>
                      );
                    })}
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'right' }} className="nc-tiny">损耗 {ver.loss}% · 人工 {fmt(ver.labor)} · 其他 {fmt(ver.other)}</td>
                      <td className="is-num num"><b>{fmt(c.total)}</b></td>
                      <td />
                    </tr>
                  </tbody>
                </table>
                <div className="nc-tiny nc-muted" style={{ marginTop: 10 }}>
                  版本历史：{B.versions.map((v) => `${v.v}${v.st === '生效' ? '（生效）' : ''} ${v.created}`).join(' · ')}
                </div>
              </>
            );
          })()}
        </Drawer>

        {/* ============ 材料价格库 ============ */}
        {tab === 'plib' && (
          <div style={{ padding: 16 }}>
            <Banner tone="info">已入库采购合同明细自动沉淀 · 与询比价 / 历史报价同源 · CNY <b>含税</b>；权限 = 商务合同管理员 / 财务 / 项目经理；<b>参考用途，不强制校验</b>。询比价「历史参照」与供应商历史报价均取自本库。</Banner>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
              <Check checked={plibRev} onChange={setPlibRev} label="仅看需复核调价（偏离 ≥ ±10%）" />
              <span className="nc-tiny nc-muted" style={{ marginLeft: 'auto' }}>
                偏离 = (标准价 − 成交均值) / 成交均值，±10% 可配
              </span>
            </div>
            <DataTable
              minWidth={1080}
              rows={PRICE_LIB.filter((p) => !plibRev || p.review)}
              rowKey={(p) => p.code}
              rowClass={(p) => (p.review ? 'is-danger-row' : '')}
              empty={plibRev ? '当前没有偏离 ≥ ±10% 的需复核价格；可取消「仅看需复核」查看全部' : '价格库暂无记录；采购合同入库后会自动沉淀成交价'}
              cols={[
                { key: 'code', title: '材料编码', width: 100, render: (p) => <span className="num">{p.code}</span> },
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

        {/* ============ 库存与领用 ============ */}
        {tab === 'stock' && (
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <Btn size="sm" onClick={() => { resetOpForm(); setOpIn(true); }}>＋ 入库</Btn>
              <Btn size="sm" onClick={() => { resetOpForm(); setOpOut(true); }}>＋ 领用</Btn>
              <Btn size="sm" onClick={() => { resetOpForm(); setOpBack(true); }}>↩ 退料</Btn>
              <Btn size="sm" onClick={() => { resetOpForm(); setOpCheck(true); }}><Ico n="clipboard" size={16} /> 盘点</Btn>
              <Btn size="sm" onClick={() => { setInErr(''); setOpMove(true); }}><Ico n="swap" size={16} /> 调拨</Btn>
              <Btn size="sm" onClick={() => toast('已唤起扫码枪，请扫描材料二维码')}><Ico n="camera" size={16} /> 扫码</Btn>
              <span style={{ marginLeft: 'auto' }} className="nc-cell-sub">可用 = 结余 − 预占<Tip text="成本口径：入库计入项目成本、出库不影响（防重复），退料回冲；盘点差异生成调整单；安全线可配，低于即提醒并建议询价（调整留痕）。" /></span>
              <select className="nc-input" style={{ width: 130 }} value={whView} onChange={(e) => setWhView(e.target.value)}>
                <option value="全部">视图：全部仓库</option>
                {WH.map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <DataTable
              minWidth={1120}
              rows={[...rows].sort((a, b) => (a.stock - a.safe) - (b.stock - b.safe))}
              rowKey={(m) => m.id}
              rowClass={(m) => (m.stock - m.safe < 0 ? 'is-danger-row' : '')}
              onRowClick={(m) => setDetail(m)}
              empty="当前仓库视图下没有材料库存记录；可通过「＋ 入库」登记首笔库存"
              cols={[
                { key: 'code', title: '编码', width: 100, render: (m) => <span className="num">{m.code}</span> },
                { key: 'name', title: '名称 / 规格', render: (m) => <>{m.name} <span className="nc-tiny nc-muted">{m.spec}</span></> },
                { key: 'unit', title: '单位', width: 64, align: 'center', render: (m) => m.unit },
                { key: 'mainWh', title: '主仓库', width: 96, align: 'right', render: (m) => <span className="num" style={{ background: whView === '主仓库' ? 'rgba(24,144,255,0.06)' : undefined }}>{whView === '项目临时仓·××中心大厦' ? '—' : Math.round(m.stock * 0.68)}</span> },
                { key: 'projWh', title: '项目临时仓', width: 110, align: 'right', render: (m) => <span className="num" style={{ background: whView === '项目临时仓·××中心大厦' ? 'rgba(24,144,255,0.06)' : undefined }}>{whView === '主仓库' ? '—' : m.stock - Math.round(m.stock * 0.68)}</span> },
                { key: 'stock', title: '结余', width: 100, align: 'right', render: (m) => <b className="num">{m.stock}</b> },
                { key: 'hold', title: '预占', width: 90, align: 'right', render: (m) => <span className="num nc-muted">{Math.round(m.stock * 0.06)}</span> },
                { key: 'avail', title: '可用', width: 100, align: 'right', render: (m) => <b className="num">{m.stock - Math.round(m.stock * 0.06)}</b> },
                { key: 'safe', title: '安全线', width: 100, align: 'right', render: (m) => <span className="num">{m.safe}</span> },
                { key: 'st', title: '状态', width: 90, render: (m) => (m.stock - m.safe < 0 ? <Tag tone="red">需补货</Tag> : <Tag tone="green">充足</Tag>) },
                { key: 'op', title: '操作', width: 96, render: (m) => <span onClick={(e) => e.stopPropagation()}><Op onClick={() => { setOpSafe(m); setSafeVal(String(m.safe)); }}>设置安全线</Op></span> },
              ]}
            />
          </div>
        )}

        {/* ============ 作业流水 ============ */}
        {tab === 'flow' && (
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <span className="nc-tiny nc-muted">时间 / 类型 / 单号 / 材料 / 数量 / 仓库·项目 / 经办 · 入库计入项目成本、出库不影响（防重复）</span>
              <div style={{ marginLeft: 'auto' }}><Btn size="sm" onClick={() => toast('作业流水已导出（CSV）')}><Ico n="download" size={16} /> 导出</Btn></div>
            </div>
            <DataTable
              minWidth={1000}
              rows={FLOW_SEED.filter((f) => whView === '全部' || f.wh.includes(whView))}
              rowKey={(f) => f.no}
              empty="当前仓库视图下没有作业流水；入库 / 领用 / 调拨 / 盘点后自动生成"
              cols={[
                { key: 't', title: '时间', width: 140, render: (f) => <span className="num nc-tiny">{f.t}</span> },
                { key: 'type', title: '类型', width: 80, render: (f) => <Tag tone={(FLOW_TONE[f.type] || 'gray') as TagTone}>{f.type}</Tag> },
                { key: 'no', title: '单号', width: 130, render: (f) => <span className="num">{f.no}</span> },
                { key: 'mat', title: '材料', render: (f) => f.mat },
                { key: 'qty', title: '数量', width: 130, align: 'right', render: (f) => <span className="num">{f.qty}</span> },
                { key: 'wh', title: '仓库 / 项目', width: 220, render: (f) => <span className="nc-tiny">{f.wh}</span> },
                { key: 'by', title: '经办', width: 80, render: (f) => f.by },
              ]}
            />
          </div>
        )}

        {/* ============ 认证与报告 ============ */}
        {tab === 'cert' && (
          <div style={{ padding: 16 }}>
            <Banner tone="warn">到期前 30 天提醒证书管理员：<b>站内 + 钉钉 + 短信</b>；消防验收资料自动归集；上传 / 查看<b>留审计</b>。</Banner>
            <div style={{ display: 'flex', marginBottom: 12 }}>
              <div style={{ marginLeft: 'auto' }}><Btn size="sm" kind="primary" onClick={() => setCertUp(true)}>＋ 上传</Btn></div>
            </div>
            <DataTable
              minWidth={1100}
              rows={certs}
              rowKey={(c) => c.no}
              rowClass={(c) => (daysLeft(c.validTo) <= 30 ? 'is-danger-row' : '')}
              empty="没有认证与报告记录；点击「＋ 上传」登记首份证书"
              cols={[
                { key: 'mat', title: '材料 / 产品', render: (c) => c.mat },
                { key: 'type', title: '类型', width: 150, render: (c) => <Tag tone={c.type.startsWith('CCCF') ? 'red' : 'blue'}>{c.type}</Tag> },
                { key: 'no', title: '证书编号', width: 170, render: (c) => <span className="num">{c.no}</span> },
                { key: 'validTo', title: '有效期至', width: 110, render: (c) => <span className="num nc-tiny">{c.validTo}</span> },
                {
                  key: 'left', title: '剩余', width: 90, align: 'right',
                  render: (c) => {
                    const dl = daysLeft(c.validTo);
                    return <span className="num">{dl === Infinity ? '—' : dl <= 0 ? <span className="nc-v-red">已过期</span> : <span className={dl <= 30 ? 'nc-v-red' : ''}>{dl} 天</span>}</span>;
                  },
                },
                { key: 'batch', title: '关联批次', width: 130, render: (c) => <span className="num nc-tiny">{c.batch}</span> },
                { key: 'files', title: '附件', width: 80, align: 'center', render: (c) => c.files },
                { key: 'ch', title: '到期通知渠道', width: 150, render: (c) => <span className="nc-tiny">{c.ch}</span> },
                { key: 'op', title: '操作', width: 70, render: (c) => <Op onClick={() => toast(`已查看 ${c.no}（查看行为已留审计）`)}>查看</Op> },
              ]}
            />
          </div>
        )}

        {/* ============ 询比价 ============ */}
        {tab === 'rfq' && (
          <div style={{ padding: 16 }}>
            <div style={{ display: 'flex', marginBottom: 12, alignItems: 'center' }}>
              <span className="nc-cell-sub">询比价<Tip text="状态机：询价中 → 已报价 → 已选定 → 已关闭；黑名单不可邀约；截止后不可提交。" /></span>
              <div style={{ marginLeft: 'auto' }}><Btn size="sm" kind="primary" onClick={() => { setRfqErr(''); setRfqNew(true); }}>＋ 发起询价</Btn></div>
            </div>
            <DataTable
              minWidth={1080}
              rows={rfqs}
              rowKey={(r) => r.id}
              empty="暂无询比价单；点击「＋ 发起询价」向已准入供应商邀约报价"
              cols={[
                { key: 'id', title: '询价单号', width: 130, render: (r) => <span className="num">{r.id}</span> },
                { key: 'mats', title: '材料 / 产品（数量）', render: (r) => <span className="nc-tiny">{r.mats.map((m) => `${m.name} ×${m.qty}${m.unit}`).join('；')}</span> },
                { key: 'needDate', title: '需求日期', width: 100, render: (r) => <span className="num nc-tiny">{r.needDate}</span> },
                { key: 'deadline', title: '报价截止', width: 140, render: (r) => <span className="num nc-tiny">{r.deadline}</span> },
                { key: 'invited', title: '邀约供应商', width: 220, render: (r) => <span className="nc-tiny">{r.invited.map((id, i) => <React.Fragment key={id}>{i > 0 ? '、' : ''}<EntityLink target="supplier" id={id} go={go} title="下钻到供应商档案">{supName(id)}</EntityLink></React.Fragment>)}</span> },
                { key: 'status', title: '状态', width: 90, render: (r) => <Tag tone={(RFQ_TONE[r.status] || 'gray') as TagTone}>{r.status}</Tag> },
                {
                  key: 'op', title: '操作', width: 180, render: (r) => (
                    <>
                      <Op onClick={() => setMatrix(r)}>比价矩阵</Op><OpSep />
                      <Op onClick={() => { setQrOpen(r.id); }}>二维码</Op><OpSep />
                      {r.status !== '已关闭' && <Op onClick={() => { setQuoteOpen(r); setQuoteAs(r.invited[0] || 'GYS000012'); setQuoteVals({}); }}>模拟报价</Op>}
                    </>
                  ),
                },
              ]}
            />
          </div>
        )}

        {/* ============ 操作日志 ============ */}
        {tab === 'audit' && (
          <div style={{ padding: 16 }}>
            <div className="nc-listhint">
              <span>操作审计<Tip w={380} text="关键操作审计：入库 / 领用 / 退料 / 盘点 / 调拨 / 调价 / 询价 / 安全线调整 / 认证附件查看，全部留痕可追溯。" /></span>
            </div>
            <DataTable
              minWidth={900}
              rows={AUDIT_SEED}
              rowKey={(a) => `${a.t}-${a.who}`}
              empty="暂无操作审计记录；关键操作（入库 / 调价 / 安全线调整等）会自动留痕"
              cols={[
                { key: 't', title: '时间', width: 140, render: (a) => <span className="num nc-tiny">{a.t}</span> },
                { key: 'who', title: '操作人', width: 90, render: (a) => a.who },
                { key: 'role', title: '角色', width: 130, render: (a) => <Tag tone="gray">{a.role}</Tag> },
                { key: 'act', title: '动作', render: (a) => a.act },
              ]}
            />
          </div>
        )}

        {/* ============ 供应商报价 ============ */}
        {tab === 'sup' && (
          <div style={{ padding: 16 }}>
            <Banner tone="warn">仅<b>已准入</b>供应商的报价参与比价；未准入 / 已冻结供应商记录标灰且不计入最低价。</Banner>
            <DataTable
              minWidth={900}
              rows={SUPPLIERS}
              rowKey={(s) => s.id}
              rowClass={(s) => (s.status === '已准入' ? '' : 'is-muted-row')}
              empty="暂无供应商记录；请先到供应商管理完成准入"
              cols={[
                { key: 'id', title: '供应商编号', width: 110, render: (s) => <span className="num">{s.id}</span> },
                { key: 'name', title: '供应商名称', render: (s) => s.name },
                { key: 'cats', title: '供货范围', width: 140, render: (s) => <>{s.cats.map((c) => <Tag key={c} tone="blue">{c}</Tag>)}</> },
                { key: 'level', title: '评级', width: 80, align: 'center', render: (s) => <b>{s.level}</b> },
                { key: 'amt', title: '累计合作额', width: 110, align: 'right', render: (s) => <span className="num">{s.amt ? fmtWan(s.amt) : '—'}</span> },
                { key: 'status', title: '准入状态', width: 100, render: (s) => <Tag tone={s.status === '已准入' ? 'green' : 'gray'}>{s.status}</Tag> },
              ]}
            />
          </div>
        )}

      </Card>

      {/* ============ 材料详情 ============ */}
      <Drawer open={!!detail} width={680} onClose={() => setDetail(null)} title={detail?.name || ''}
        sub={`${detail?.code} · 规格 ${detail?.spec} · 单位 ${detail?.unit}`}
        foot={<>
          <Btn onClick={() => { if (!detail) return; setRows((rs) => rs.map((r) => r.code === detail.code ? { ...r, status: '停用' as const } : r)); toast(`${detail.code} 已下架`); setDetail(null); }} danger>下架</Btn>
          <Btn onClick={() => setDetail(null)}>关闭</Btn>
        </>}>
        {detail && <>
          <KvGrid cols={2} rows={[
            { k: '编码', v: detail.code },
            { k: '名称', v: detail.name },
            { k: '规格型号', v: detail.spec },
            { k: '类别', v: detail.type },
            { k: '报价分类目录', v: detail.cat },
            { k: '计量单位', v: `${detail.unit}${UNIT_DESC[detail.unit] ? ` · ${UNIT_DESC[detail.unit]}` : ''}` },
            { k: '参考单价', v: fmt(detail.price) },
            { k: '当前库存', v: `${detail.stock} ${detail.unit}` },
            { k: '安全库存', v: `${detail.safe} ${detail.unit}` },
            { k: '状态', v: detail.status },
            { k: 'CCCF 认证', v: detail.ccc ? '已取得' : '未涉及' },
            { k: '强制性目录', v: detail.mand ? '在目录内' : '不在目录内' },
          ]} />

          {detail.mand && (
            <div className="nc-warnbox is-danger">
              <b><Ico n="warning" size={16} /> 该条目列入强制性产品目录</b>
              <div>无有效 CCCF 证书的批次不得用于工程；采购入库与报价选用时将校验证书编号与有效期。</div>
            </div>
          )}

          <Field label="供应商报价对比（三源比价）" span={4}>
            <table className="nc-tbl" style={{ minWidth: 520 }}>
              <thead><tr><th>供应商</th><th style={{ width: 96, textAlign: 'right' }}>报价</th><th style={{ width: 80, textAlign: 'right' }}>偏差</th><th style={{ width: 80 }}>准入</th></tr></thead>
              <tbody>
                {[{ n: '云南××消防设备有限公司', p: Math.round(detail.price * 0.94), ok: true }, { n: '××安防材料科技有限公司', p: Math.round(detail.price * 0.88), ok: false }, { n: '××线缆供应链有限公司', p: Math.round(detail.price * 0.82), ok: false }].map((s) => {
                  const dev = detail.price ? ((s.p - detail.price) / detail.price) * 100 : 0;
                  return (
                    <tr key={s.n} className={s.ok ? '' : 'is-muted-row'}>
                      <td>{s.n}</td>
                      <td className="is-num num">{fmt(s.p)}</td>
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
                {[{ d: '2026 Q3', p: detail.price, q: 320, t: '→ 持平' }, { d: '2026 Q2', p: Math.round(detail.price * 0.97), q: 280, t: '↑ 略涨' }, { d: '2026 Q1', p: Math.round(detail.price * 0.93), q: 210, t: '↑ 上涨' }, { d: '2025 Q4', p: Math.round(detail.price * 0.9), q: 180, t: '— 基期' }].map((r) => (
                  <tr key={r.d}><td>{r.d}</td><td className="is-num num">{fmt(r.p)}</td><td className="is-num num">{r.q}</td><td className="nc-tiny">{r.t}</td></tr>
                ))}
              </tbody>
            </table>
          </Field>
        </>}
      </Drawer>

      {/* ============ 新增材料 / 产品 ============ */}
      <Modal open={newOpen} title={`新增${kind === '材料' ? '材料' : '产品 / 服务'}`} width={760} onClose={() => { setNewOpen(false); setNewErr(''); }}
        foot={<><Btn onClick={() => { setNewOpen(false); setNewErr(''); }}>取消</Btn><Btn kind="primary" onClick={() => {
          if (!newForm.name.trim()) { setNewErr('名称必填'); return; }
          if (!newForm.spec.trim()) { setNewErr('规格型号必填'); return; }
          if (!newForm.cat) { setNewErr('分类目录必填'); return; }
          if (!(Number(newForm.price) > 0)) { setNewErr('参考单价须 > 0'); return; }
          const nextId = Math.max(...rows.map((r) => Number(r.id.replace(/\D/g, ''))), 0) + 1;
          const code = kind === '材料' ? `CL${String(nextId).padStart(6, '0')}` : `CP${String(nextId).padStart(6, '0')}`;
          const added: Mat = {
            id: String(nextId), code, name: newForm.name.trim(), spec: newForm.spec.trim(),
            unit: newForm.unit, cat: newForm.cat, price: Number(newForm.price),
            stock: 0, safe: Number(newForm.safe) || 0, status: '启用',
            ccc: newForm.ccc, mand: newForm.mand, type: '材料',
          };
          setRows((rs) => [...rs, added]);
          setNewOpen(false); setNewErr(''); setNewForm({ name: '', spec: '', cat: '', unit: UNITS[0], price: '', safe: '', ccc: false, mand: false });
          toast(`已新增${kind} ${code} · ${added.name}，提交主数据审批后生效`);
        }}>提交主数据审批</Btn></>}>
        <div className="nc-warnbox is-info">
          <b>主数据变更须审批</b>
          <div>新增 / 修改价格 / 调整分类将生成变更日志（MD + 6 位），审批通过后生效；名称在同类型下唯一。</div>
        </div>
        {newErr && <Alert icon={<Ico n="warning" size={16} />} tone="danger" title={newErr} />}
        <div className="nc-form-grid">
          <Field label="类别" req note="材料 = 纯物料；产品 = 单品 / 服务；套件属产品的子类">
            <select className="nc-input" value={kind} disabled>
              <option>材料</option><option>产品 / 服务</option>
            </select>
          </Field>
          <Field label="编码" note={kind === '材料' ? '自动生成 CL + 6 位' : '自动生成 CP + 6 位'}>
            <input className="nc-input" disabled placeholder="系统自动生成" />
          </Field>
          <Field label="名称" req><input className="nc-input" value={newForm.name} onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))} placeholder={kind === '材料' ? '如：防火阀' : '如：消防报警套件'} /></Field>
          <Field label="规格型号" req><input className="nc-input" value={newForm.spec} onChange={(e) => setNewForm((f) => ({ ...f, spec: e.target.value }))} placeholder={kind === '材料' ? '如：FHF-400' : '如：控制器 + 探测器 ×20'} /></Field>
          <Field label="分类目录" req note="多级分类 · 可在左栏直接维护">
            <select className="nc-input" value={newForm.cat} onChange={(e) => setNewForm((f) => ({ ...f, cat: e.target.value }))}>
              <option value="">请选择</option>
              {catOptions(kind === '材料' ? 'mat' : 'prod').map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </Field>
          <Field label="计量单位" req note="取自「系统设置 · 单位字典」">
            <select className="nc-input" value={newForm.unit} onChange={(e) => setNewForm((f) => ({ ...f, unit: e.target.value }))}>
              {UNITS.map((u) => <option key={u}>{u}</option>)}
            </select>
          </Field>
          <Field label="参考单价" req><input className="nc-input" type="number" value={newForm.price} onChange={(e) => setNewForm((f) => ({ ...f, price: e.target.value }))} placeholder="0.00" /></Field>
          {kind === '材料' && (
            <Field label="安全库存"><input className="nc-input" type="number" value={newForm.safe} onChange={(e) => setNewForm((f) => ({ ...f, safe: e.target.value }))} placeholder="0" /></Field>
          )}
          <Field label="认证标记" span={2} note="标记类型取自「系统设置 · 认证标记」；勾选 CCCF / 强制后需填证书编号">
            <div className="nc-pick-inline">
              {MARK_TYPES.map((m) => (
                <label key={m.k} className="nc-pick-chip">
                  <input type="checkbox" className="nc-check" checked={m.k === 'CCCF' ? newForm.ccc : newForm.mand} onChange={(e) => setNewForm((f) => ({ ...f, [m.k === 'CCCF' ? 'ccc' : 'mand']: e.target.checked }))} />
                  <span>{m.k}</span>
                </label>
              ))}
            </div>
          </Field>
          <Field label="备注" span={4}><textarea className="nc-input" rows={2} placeholder="选填" /></Field>
        </div>
      </Modal>

      {/* ============ 批量导入 ============ */}
      <Modal open={importOpen} title="批量导入材料 / 产品" width={620} onClose={() => setImportOpen(false)}
        foot={<><Btn onClick={() => setImportOpen(false)}>取消</Btn><Btn kind="primary" onClick={() => { setImportOpen(false); toast('已校验 128 行，其中 3 行单位不合规待修正'); }}>开始校验导入</Btn></>}>
        <div className="nc-dropzone"><Ico n="paperclip" size={16} /> 点击或拖拽上传 Excel / CSV 模板（必填列：名称、规格型号、报价分类目录、单位、参考单价）</div>
        <div className="nc-tiny nc-muted" style={{ marginTop: 12 }}>校验规则：① 单位必须在「单位字典」内；② 双重编码冲突时以「跳过并报告」处理；③ CCCF / 强制标记需附证书编号。</div>
        <div style={{ marginTop: 12 }}><Btn size="sm" onClick={() => toast('模板已下载')}>下载导入模板</Btn></div>
      </Modal>

      {/* ============ 入库登记 ============ */}
      <Modal open={opIn} title="入库登记" width={700} onClose={() => setOpIn(false)}
        foot={<><Btn onClick={() => setOpIn(false)}>取消</Btn><Btn kind="primary" onClick={() => {
          const m = rows.find((r) => r.code === inCode)!;
          if (m.ccc || m.mand) { if (!inBatch.trim()) { setInErr('消防产品批次号必填（强制性产品认证目录内产品）'); return; } }
          if (!(Number(inQty) > 0)) { setInErr('入库数量须 > 0'); return; }
          if (!(Number(inPrice) > 0)) { setInErr('入库单价须 > 0'); return; }
          setOpIn(false); resetOpForm();
          adjStock(inCode, Number(inQty),
            `已入库 ${m.name} ${inQty}${m.unit}（批次 ${inBatch || '—'}），金额 ¥${fmt(Number(inQty) * Number(inPrice))} 计入项目成本 · 结余 ${m.stock + Number(inQty)}${m.unit}`);
        }}>确认入库</Btn></>}>
        <div className="nc-warnbox is-info"><b>成本口径</b><div>金额自动计入项目合同成本（关联项目时）；消防产品批次必填。</div></div>
        {inErr && <Alert icon={<Ico n="warning" size={16} />} tone="danger" title={inErr} />}
        <div className="nc-form-grid">
          <Field label="材料" req span={2}>
            <select className="nc-input" value={inCode} onChange={(e) => setInCode(e.target.value)}>
              {rows.map((m) => <option key={m.code} value={m.code}>{m.code} · {m.name} {m.spec}</option>)}
            </select>
          </Field>
          <Field label="仓库" req>
            <select className="nc-input" value={inWh} onChange={(e) => setInWh(e.target.value)}>{WH.map((w) => <option key={w}>{w}</option>)}</select>
          </Field>
          <Field label="库位" req>
            <select className="nc-input" value={inLoc} onChange={(e) => setInLoc(e.target.value)}>{LOC.map((l) => <option key={l}>{l}</option>)}</select>
          </Field>
          <Field label="批次号" req={rows.find((r) => r.code === inCode)?.ccc || rows.find((r) => r.code === inCode)?.mand} err={inErr && inErr.includes('批次') ? inErr : undefined} note="消防产品批次必填，如 PC20260921-A">
            <input className="nc-input" value={inBatch} onChange={(e) => setInBatch(e.target.value)} placeholder="PC20260921-A" />
          </Field>
          <Field label="数量" req><input className="nc-input" type="number" value={inQty} onChange={(e) => setInQty(e.target.value)} placeholder="0" /></Field>
          <Field label="单价（含税）" req><input className="nc-input" type="number" value={inPrice} onChange={(e) => setInPrice(e.target.value)} placeholder="0.00" /></Field>
          <Field label="日期"><input className="nc-input" type="date" value={inDate} onChange={(e) => setInDate(e.target.value)} /></Field>
          <Field label="经办"><select className="nc-input" value={inBy} onChange={(e) => setInBy(e.target.value)}><option>张仓</option><option>李工</option><option>王工</option></select></Field>
        </div>
      </Modal>

      {/* ============ 领用登记 ============ */}
      <Modal open={opOut} title="领用登记" width={700} onClose={() => setOpOut(false)}
        foot={<><Btn onClick={() => setOpOut(false)}>取消</Btn><Btn kind="primary" onClick={() => {
          const m = rows.find((r) => r.code === inCode)!;
          if (!(Number(inQty) > 0)) { setInErr('领用数量须 > 0'); return; }
          if (Number(inQty) > m.stock) { setInErr(`领用数量 ${inQty}${m.unit} 超出可用库存 ${m.stock}${m.unit}`); return; }
          setOpOut(false); resetOpForm();
          adjStock(inCode, -Number(inQty),
            `已领用 ${m.name} ${inQty}${m.unit}；出库不影响项目成本（入库时已计入）· 结余 ${m.stock - Number(inQty)}${m.unit}`);
        }}>确认领用</Btn></>}>
        <div className="nc-warnbox is-info"><b>成本口径</b><div>领用（出库）<b>不影响</b>项目成本——成本在入库时已计入，避免重复；退料自动回冲。</div></div>
        {inErr && <Alert icon={<Ico n="warning" size={16} />} tone="danger" title={inErr} />}
        <div className="nc-form-grid">
          <Field label="材料" req span={2}>
            <select className="nc-input" value={inCode} onChange={(e) => setInCode(e.target.value)}>
              {rows.map((m) => <option key={m.code} value={m.code}>{m.code} · {m.name}（可用 {m.stock} {m.unit}）</option>)}
            </select>
          </Field>
          <Field label="出库仓" req><select className="nc-input" value={inWh} onChange={(e) => setInWh(e.target.value)}>{WH.map((w) => <option key={w}>{w}</option>)}</select></Field>
          <Field label="关联项目"><select className="nc-input"><option>XM000123 · ××中心大厦消防改造</option><option>XM000118 · 云南省××医院住院楼</option><option>（不关联）</option></select></Field>
          <Field label="领用数量" req><input className="nc-input" type="number" value={inQty} onChange={(e) => setInQty(e.target.value)} placeholder="0" /></Field>
          <Field label="领用人"><select className="nc-input" value={inBy} onChange={(e) => setInBy(e.target.value)}><option>张仓</option><option>李工</option><option>王工</option></select></Field>
        </div>
      </Modal>

      {/* ============ 退料（项目 → 仓库） ============ */}
      <Modal open={opBack} title="退料（项目 → 仓库）" width={700} onClose={() => setOpBack(false)}
        foot={<><Btn onClick={() => setOpBack(false)}>取消</Btn><Btn kind="primary" onClick={() => {
          if (!(Number(inQty) > 0)) { setInErr('退料数量须 > 0'); return; }
          const mb = rows.find((r) => r.code === inCode)!;
          setOpBack(false); resetOpForm();
          adjStock(inCode, Number(inQty), `已退料 ${mb.name} ${inQty}${mb.unit}，项目成本自动回冲 · 结余 ${mb.stock + Number(inQty)}${mb.unit}`);
        }}>确认退料</Btn></>}>
        <div className="nc-warnbox is-info"><b>回冲规则</b><div>退料回冲项目成本（与入库计入口径互逆），库存回到对应仓库库位。</div></div>
        {inErr && <Alert icon={<Ico n="warning" size={16} />} tone="danger" title={inErr} />}
        <div className="nc-form-grid">
          <Field label="材料" req span={2}>
            <select className="nc-input" value={inCode} onChange={(e) => setInCode(e.target.value)}>
              {rows.map((m) => <option key={m.code} value={m.code}>{m.code} · {m.name}</option>)}
            </select>
          </Field>
          <Field label="来源项目" req><select className="nc-input"><option>XM000123 · ××中心大厦消防改造</option><option>XM000118 · 云南省××医院住院楼</option></select></Field>
          <Field label="退回仓" req><select className="nc-input" value={inWh} onChange={(e) => setInWh(e.target.value)}>{WH.map((w) => <option key={w}>{w}</option>)}</select></Field>
          <Field label="退料数量" req><input className="nc-input" type="number" value={inQty} onChange={(e) => setInQty(e.target.value)} placeholder="0" /></Field>
          <Field label="经办"><select className="nc-input" value={inBy} onChange={(e) => setInBy(e.target.value)}><option>张仓</option><option>李工</option><option>王工</option></select></Field>
          <Field label="退料原因" span={4}><textarea className="nc-input" rows={2} placeholder="如：现场设计变更，剩余材料退回" /></Field>
        </div>
      </Modal>

      {/* ============ 库存盘点 ============ */}
      <Modal open={opCheck} title="库存盘点" width={680} onClose={() => setOpCheck(false)}
        foot={<><Btn onClick={() => setOpCheck(false)}>取消</Btn><Btn kind="primary" onClick={() => {
          const m = rows.find((r) => r.code === inCode)!;
          const diff = Number(inQty || 0) - m.stock;
          setOpCheck(false); resetOpForm();
          adjStock(inCode, diff, `已生成《盘点调整单》· 账面 ${m.stock} → 实盘 ${inQty || 0}，差异 ${diff > 0 ? '+' : ''}${diff}（留痕）· 库存已按实盘调整`);
        }}>生成调整单</Btn></>}>
        <div className="nc-warnbox is-info"><b>盘点规则</b><div>实盘与账面差异将生成《盘点调整单》并留痕。</div></div>
        <div className="nc-form-grid">
          <Field label="材料" req span={2}>
            <select className="nc-input" value={inCode} onChange={(e) => setInCode(e.target.value)}>
              {rows.map((m) => <option key={m.code} value={m.code}>{m.code} · {m.name}</option>)}
            </select>
          </Field>
          <Field label="仓库" req><select className="nc-input" value={inWh} onChange={(e) => setInWh(e.target.value)}>{WH.map((w) => <option key={w}>{w}</option>)}</select></Field>
          <Field label="实盘数量" req><input className="nc-input" type="number" value={inQty} onChange={(e) => setInQty(e.target.value)} placeholder="0" /></Field>
          <Field label="账面 / 差异" span={4}>
            <div className="nc-money-row">
              <div className="nc-money-cell"><span className="nc-tiny nc-muted">账面</span><b className="num">{rows.find((r) => r.code === inCode)?.stock ?? 0}</b></div>
              <div className="nc-money-cell"><span className="nc-tiny nc-muted">实盘</span><b className="num">{Number(inQty || 0)}</b></div>
              <div className="nc-money-cell"><span className="nc-tiny nc-muted">差异</span><b className={`num${Number(inQty || 0) - (rows.find((r) => r.code === inCode)?.stock ?? 0) !== 0 ? ' nc-v-red' : ''}`}>{(Number(inQty || 0) - (rows.find((r) => r.code === inCode)?.stock ?? 0)) > 0 ? '+' : ''}{Number(inQty || 0) - (rows.find((r) => r.code === inCode)?.stock ?? 0)}</b></div>
            </div>
          </Field>
        </div>
      </Modal>

      {/* ============ 库存调拨 ============ */}
      <Modal open={opMove} title="库存调拨" width={680} onClose={() => setOpMove(false)}
        foot={<><Btn onClick={() => setOpMove(false)}>取消</Btn><Btn kind="primary" onClick={() => {
          if (!(Number(inQty) > 0)) { setInErr('调拨数量须 > 0'); return; }
          setInErr(''); setOpMove(false); toast(`已调拨 ${inQty}（跨仓调拨，总量不变，留痕）`);
        }}>确认调拨</Btn></>}>
        <div className="nc-warnbox is-info"><b>调拨规则</b><div>跨仓调拨，总量不变，留痕。</div></div>
        {inErr && <Alert icon={<Ico n="warning" size={16} />} tone="danger" title={inErr} />}
        <div className="nc-form-grid">
          <Field label="材料" req span={4}>
            <select className="nc-input" value={inCode} onChange={(e) => setInCode(e.target.value)}>
              {rows.map((m) => <option key={m.code} value={m.code}>{m.code} · {m.name}</option>)}
            </select>
          </Field>
          <Field label="调出仓" req><select className="nc-input"><option>主仓库</option><option>项目临时仓·××中心大厦</option></select></Field>
          <Field label="调入仓" req><select className="nc-input"><option>项目临时仓·××中心大厦</option><option>主仓库</option></select></Field>
          <Field label="数量" req><input className="nc-input" type="number" value={inQty} onChange={(e) => setInQty(e.target.value)} placeholder="0" /></Field>
          <Field label="经办"><select className="nc-input" value={inBy} onChange={(e) => setInBy(e.target.value)}><option>张仓</option><option>李工</option><option>王工</option></select></Field>
        </div>
      </Modal>

      {/* ============ 设置安全线 ============ */}
      <Modal open={!!opSafe} title={`设置安全线 · ${opSafe?.name || ''}`} width={560} onClose={() => setOpSafe(null)}
        foot={<><Btn onClick={() => setOpSafe(null)}>取消</Btn><Btn kind="primary" onClick={() => {
          const v = Number(safeVal);
          if (!(v >= 0)) { toast('安全线须 ≥ 0'); return; }
          if (opSafe) {
            setRows((rs) => rs.map((r) => r.code === opSafe.code ? { ...r, safe: v } : r));
            toast(`安全线 ${opSafe.name}：${opSafe.safe} → ${v}（调整记录已留痕）`);
          }
          setOpSafe(null);
        }}>保存</Btn></>}>
        <div className="nc-warnbox is-info">调整记录留痕（谁 / 何时 / 旧值 → 新值）；低于安全线即提醒并建议一键询价。</div>
        <div className="nc-form-grid">
          <Field label="材料" span={4}><input className="nc-input" disabled value={`${opSafe?.code} · ${opSafe?.name} ${opSafe?.spec}`} /></Field>
          <Field label="当前安全线"><input className="nc-input" disabled value={String(opSafe?.safe ?? '')} /></Field>
          <Field label="安全线数量" req><input className="nc-input" type="number" value={safeVal} onChange={(e) => setSafeVal(e.target.value)} /></Field>
        </div>
      </Modal>

      {/* ============ 价格库历史 ============ */}
      <Modal open={!!plibHis} title={`价格历史 · ${plibHis?.name || ''}`} width={680} onClose={() => setPlibHis(null)}
        foot={<><Btn onClick={() => setPlibHis(null)}>关闭</Btn><Btn kind="primary" onClick={() => { setPlibHis(null); toast('已发起调价复核（变更单 MD + 6 位）'); }}>发起调价复核</Btn></>}>
        <table className="nc-tbl" style={{ minWidth: 600 }}>
          <thead><tr><th style={{ width: 110 }}>生效日期</th><th style={{ width: 110, textAlign: 'right' }}>含税价</th><th style={{ width: 90, textAlign: 'right' }}>涨跌</th><th style={{ width: 120 }}>来源</th><th>备注</th></tr></thead>
          <tbody>
            {[
              { d: '2026-07-01', p: plibHis?.price || 0, s: '采购合同沉淀', n: 'CG20260628-011 入库沉淀' },
              { d: '2026-04-01', p: Math.round((plibHis?.price || 0) * 0.97), s: '询比价', n: 'XJ20260325002 中标价' },
              { d: '2026-01-01', p: Math.round((plibHis?.price || 0) * 0.93), s: '历史报价', n: '年度框架价' },
            ].map((r, i, arr) => {
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

      {/* ============ 上传认证与报告 ============ */}
      <Modal open={certUp} title="上传认证与报告（≤5 附件 · PDF/JPG/PNG）" width={680} onClose={() => setCertUp(false)}
        foot={<><Btn onClick={() => setCertUp(false)}>取消</Btn><Btn kind="primary" onClick={() => {
          if (!cuNo.trim()) { toast('请填写证书编号'); return; }
          setCerts((v) => [{ mat: rows.find((r) => r.code === cuMat)?.name + ' ' + rows.find((r) => r.code === cuMat)?.spec, type: cuType, no: cuNo.trim(), validTo: cuTo || '—', batch: cuBatch || '—', files: 1, ch: cuCh }, ...v]);
          setCertUp(false); setCuNo(''); setCuTo(''); setCuBatch('');
          toast('已上传并记录审计日志；到期前 30 天自动提醒证书管理员');
        }}>保存</Btn></>}>
        <div className="nc-form-grid">
          <Field label="材料 / 产品" req span={2}>
            <select className="nc-input" value={cuMat} onChange={(e) => setCuMat(e.target.value)}>
              {rows.map((m) => <option key={m.code} value={m.code}>{m.code} · {m.name}</option>)}
            </select>
          </Field>
          <Field label="类型" req span={2}>
            <select className="nc-input" value={cuType} onChange={(e) => setCuType(e.target.value)}>{CERT_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
          </Field>
          <Field label="证书编号" req><input className="nc-input" value={cuNo} onChange={(e) => setCuNo(e.target.value)} placeholder="如 CCCF-2026-FH-001122" /></Field>
          <Field label="有效期至"><input className="nc-input" type="date" value={cuTo} onChange={(e) => setCuTo(e.target.value)} /></Field>
          <Field label="关联批次"><input className="nc-input" value={cuBatch} onChange={(e) => setCuBatch(e.target.value)} placeholder="如 PC20260921-A" /></Field>
          <Field label="到期通知渠道">
            <select className="nc-input" value={cuCh} onChange={(e) => setCuCh(e.target.value)}>{CHANNELS.map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
          <Field label="附件" req span={4}><div className="nc-dropzone"><Ico n="paperclip" size={16} /> 点击或拖拽上传（≤5 个 · PDF / JPG / PNG）</div></Field>
        </div>
      </Modal>

      {/* ============ 发起询价 ============ */}
      <Modal open={rfqNew} title="发起询价" width={780} onClose={() => setRfqNew(false)}
        foot={<><Btn onClick={() => setRfqNew(false)}>取消</Btn><Btn kind="primary" onClick={() => {
          if (rfqLines.some((l) => !(Number(l.qty) > 0))) { setRfqErr('每行数量须 > 0'); return; }
          if (!rfqDl || new Date(rfqDl.replace(' ', 'T')).getTime() <= new Date('2026-09-20T12:00').getTime()) { setRfqErr('报价截止须晚于当前时间（2026-09-21 12:00）'); return; }
          if (!rfqInv.length) { setRfqErr('请至少邀约一家供应商'); return; }
          setRfqErr('');
          const id = 'XJ' + '20260920' + String(rfqs.length + 1).padStart(3, '0');
          setRfqs((v) => [{
            id, status: '询价中', needDate: rfqNeed, deadline: rfqDl,
            mats: rfqLines.map((l) => { const m = rows.find((r) => r.code === l.code)!; return { code: m.code, name: m.name, qty: Number(l.qty), unit: m.unit }; }),
            invited: rfqInv, quotes: {},
          }, ...v]);
          setRfqNew(false); setQrOpen(id);
          toast(`询价单 ${id} 已发起，已生成一人一码二维码`);
        }}>生成二维码并发起</Btn></>}>
        <div className="nc-warnbox is-info">填写需要的材料 / 产品与数量 → 生成二维码，供应商扫码填价；<b>黑名单供应商不可邀约</b>。</div>
        {rfqErr && <Alert icon={<Ico n="warning" size={16} />} tone="danger" title={rfqErr} />}
        <Field label="材料 / 产品（数量）" req span={4}>
          <table className="nc-tbl" style={{ minWidth: 520 }}>
            <thead><tr><th>材料 / 产品</th><th style={{ width: 110 }}>数量</th><th style={{ width: 60 }}>操作</th></tr></thead>
            <tbody>
              {rfqLines.map((l, i) => {
                return (
                  <tr key={i}>
                    <td>
                      <select className="nc-input" value={l.code} onChange={(e) => setRfqLines((v) => v.map((x, j) => j === i ? { ...x, code: e.target.value } : x))}>
                        {rows.map((mm) => <option key={mm.code} value={mm.code}>{mm.code} · {mm.name} {mm.spec}</option>)}
                      </select>
                    </td>
                    <td><input className="nc-input" type="number" value={l.qty} onChange={(e) => setRfqLines((v) => v.map((x, j) => j === i ? { ...x, qty: e.target.value } : x))} placeholder="0" /></td>
                    <td>{rfqLines.length > 1 ? <Op danger onClick={() => setRfqLines((v) => v.filter((_, j) => j !== i))}>删除</Op> : <span className="nc-muted nc-tiny">—</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <button className="nc-addrow" onClick={() => setRfqLines((v) => [...v, { code: MATERIALS[0].code, qty: '' }])}>＋ 添加</button>
          <div className="nc-tiny nc-muted" style={{ marginTop: 8 }}>合计 {rfqLines.length} 项 · 单位取自材料档案（{rfqLines.map((l) => rows.find((r) => r.code === l.code)?.unit).join(' / ')}）</div>
        </Field>
        <div className="nc-form-grid">
          <Field label="需求日期" req><input className="nc-input" type="date" value={rfqNeed} onChange={(e) => setRfqNeed(e.target.value)} /></Field>
          <Field label="报价截止" req err={rfqErr.includes('截止') ? rfqErr : undefined}><input className="nc-input" value={rfqDl} onChange={(e) => setRfqDl(e.target.value)} placeholder="2026-09-23 18:00" /></Field>
        </div>
        <Field label="邀约供应商" req span={4}>
          <div className="nc-pick-inline">
            {SUPPLIERS.map((s) => {
              const ban = s.blacklist;
              return (
                <label key={s.id} className={`nc-pick-chip${ban ? ' is-disabled' : ''}`} title={ban ? '黑名单供应商不可邀约' : ''}>
                  <input type="checkbox" className="nc-check" disabled={ban} checked={rfqInv.includes(s.id)}
                    onChange={() => setRfqInv((v) => v.includes(s.id) ? v.filter((x) => x !== s.id) : [...v, s.id])} />
                  <span>{s.name}{ban ? '（黑名单·禁邀）' : s.status !== '已准入' ? `（${s.status}）` : ''}</span>
                </label>
              );
            })}
          </div>
        </Field>
      </Modal>

      {/* ============ 询价二维码 ============ */}
      <Modal open={!!qrOpen} title="询价二维码" width={620} onClose={() => setQrOpen(null)}
        foot={<><Btn onClick={() => setQrOpen(null)}>← 返回</Btn><Btn onClick={() => toast('二维码 PNG 已下载')}><Ico n="download" size={16} /> 下载PNG</Btn><Btn onClick={() => setQrOpen(null)}>关闭</Btn></>}>
        <div className="nc-warnbox is-info">一人一码 · 绑定供应商 token · 到期自动失效 · 请用钉钉 / 微信扫码。</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', padding: '10px 0' }}>
          {(() => {
            const r = rfqs.find((x) => x.id === qrOpen);
            return (r?.invited || []).map((id) => {
              const s = supOf(id)!;
              return (
                <div key={id} style={{ width: 160, textAlign: 'center' }}>
                  <div style={{
                    width: 120, height: 120, margin: '0 auto 6px', border: '1px solid var(--c-hairline)', borderRadius: 'var(--r-lg)',
                    background: 'repeating-conic-gradient(var(--ink-1) 0% 25%, var(--c-surface) 0% 50%) 50% / 12px 12px',
                  }} />
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{s.name}</div>
                  <div className="nc-tiny nc-muted">token {id.slice(-4)}·{r?.id.slice(-3)}</div>
                </div>
              );
            });
          })()}
        </div>
        <div className="nc-tiny nc-muted" style={{ textAlign: 'center' }}>二维码 {qrOpen} · 有效期至 {rfqs.find((x) => x.id === qrOpen)?.deadline}</div>
      </Modal>

      {/* ============ 比价矩阵 ============ */}
      <Modal open={!!matrix} title={`比价矩阵 · ${matrix?.id || ''}`} width={880} onClose={() => setMatrix(null)}
        foot={<><Btn onClick={() => setMatrix(null)}>关闭</Btn><Btn kind="primary" disabled={!!matrix?.picked} title={matrix?.picked ? '该供应商已被选定，如需改选请先取消当前选择' : undefined} onClick={() => {
          if (!matrix) return;
          const ok = matrix.invited.filter((id) => supOf(id)?.status === '已准入');
          let best = ''; let sum = Infinity;
          ok.forEach((id) => {
            const t = matrix.mats.reduce((a, m) => a + (matrix.quotes[id]?.[m.code] ?? Infinity) * m.qty, 0);
            if (t < sum) { sum = t; best = id; }
          });
          if (!best) { toast('暂无已准入供应商的完整报价，无法选定'); return; }
          setRfqs((v) => v.map((r) => r.id === matrix.id ? { ...r, picked: best, status: '已选定' } : r));
          setMatrix(null); toast(`已选定 ${supName(best)}，合计 ¥${fmt(sum)}；其余供应商自动落标，询价单转为已选定`);
        }}>{matrix?.picked ? `已选定 ${supName(matrix?.picked || '')}` : '按最低价选定'}</Btn></>}>
        {matrix && <>
          <table className="nc-tbl" style={{ minWidth: 780 }}>
            <thead><tr>
              <th style={{ width: 200 }}>材料 / 产品</th><th style={{ width: 80, textAlign: 'right' }}>数量</th>
              {matrix.invited.map((id) => <th key={id} style={{ textAlign: 'right' }}><EntityLink target="supplier" id={id} go={go} title="下钻到供应商档案">{supName(id)}</EntityLink><div className="nc-tiny nc-muted">{supOf(id)?.status}</div></th>)}
              <th style={{ width: 110, textAlign: 'right' }}>历史参照</th>
            </tr></thead>
            <tbody>
              {matrix.mats.map((m) => {
                const vals = matrix.invited
                  .filter((id) => supOf(id)?.status === '已准入')
                  .map((id) => matrix.quotes[id]?.[m.code])
                  .filter((v): v is number => typeof v === 'number');
                const min = vals.length ? Math.min(...vals) : undefined;
                return (
                  <tr key={m.code}>
                    <td>{m.name}</td>
                    <td className="is-num num">{m.qty} {m.unit}</td>
                    {matrix.invited.map((id) => {
                      const v = matrix.quotes[id]?.[m.code];
                      const ok = supOf(id)?.status === '已准入';
                      return (
                        <td key={id} className={`is-num num${!ok ? ' nc-muted' : ''}`}>
                          {v == null ? <span className="nc-muted">未报价</span> : <span className={v === min ? 'nc-v-green' : ''}>{fmt(v)}{v === min && ' ●'}</span>}
                        </td>
                      );
                    })}
                    <td className="is-num num nc-muted">{fmt(rows.find((r) => r.code === m.code)?.price || 0)}</td>
                  </tr>
                );
              })}
              <tr>
                <td><b>合计（数量加权）</b></td><td />
                {matrix.invited.map((id) => {
                  const ok = supOf(id)?.status === '已准入';
                  const done = matrix.mats.every((m) => matrix.quotes[id]?.[m.code] != null);
                  const t = done ? matrix.mats.reduce((a, m) => a + (matrix.quotes[id]?.[m.code] || 0) * m.qty, 0) : null;
                  return <td key={id} className={`is-num num${!ok ? ' nc-muted' : ''}`}>{t == null ? '—' : <b className={ok ? '' : 'nc-muted'}>{fmtWan(t)}</b>}</td>;
                })}
                <td />
              </tr>
            </tbody>
          </table>
          <div className="nc-tiny nc-muted" style={{ marginTop: 8 }}>
            仅<b>已准入</b>供应商报价参与最低价判定；未准入 / 已冻结标灰不计入。● = 该行最低价；「历史参照」取自材料价格库。
          </div>
          {matrix.picked && <div className="nc-warnbox is-green" style={{ marginTop: 12 }}><b>已选定 {supName(matrix.picked)}</b><div>询价单已转为「已选定」，可一键生成采购合同明细并沉淀回材料价格库。</div></div>}
        </>}
      </Modal>

      {/* ============ 供应商模拟报价 ============ */}
      <Modal open={!!quoteOpen} title={`供应商报价 · ${quoteOpen?.id || ''}`} width={720} onClose={() => setQuoteOpen(null)}
        foot={<><Btn onClick={() => setQuoteOpen(null)}>取消</Btn><Btn kind="primary" onClick={() => {
          if (!quoteOpen) return;
          const bad = quoteOpen.mats.some((m) => !(Number(quoteVals[m.code]) > 0));
          if (bad) { toast('请为每行填写有效报价'); return; }
          const vals: Record<string, number> = {};
          quoteOpen.mats.forEach((m) => { vals[m.code] = Number(quoteVals[m.code]); });
          setRfqs((v) => v.map((r) => {
            if (r.id !== quoteOpen.id) return r;
            const q = { ...r.quotes, [quoteAs]: vals };
            const all = r.invited.every((id) => r.mats.every((m) => q[id]?.[m.code] != null));
            return { ...r, quotes: q, status: all ? '已报价' : r.status };
          }));
          setQuoteOpen(null); toast(`${supName(quoteAs)} 报价已提交并回填比价矩阵；截止后不可提交`);
        }}>提交报价</Btn></>}>
        <div className="nc-warnbox is-info">提交后回填采购方比价矩阵 · 截止后不可提交。</div>
        <div className="nc-form-grid">
          <Field label="切换模拟身份" span={4}>
            <select className="nc-input" value={quoteAs} onChange={(e) => setQuoteAs(e.target.value)}>
              {(quoteOpen?.invited || []).map((id) => <option key={id} value={id}>{supName(id)}（{supOf(id)?.status}）</option>)}
            </select>
          </Field>
        </div>
        <table className="nc-tbl" style={{ minWidth: 520 }}>
          <thead><tr><th>材料 / 产品</th><th style={{ width: 90, textAlign: 'right' }}>数量</th><th style={{ width: 130 }}>报价（含税 ¥）</th><th style={{ width: 110, textAlign: 'right' }}>历史参照</th></tr></thead>
          <tbody>
            {(quoteOpen?.mats || []).map((m) => (
              <tr key={m.code}>
                <td>{m.name}</td>
                <td className="is-num num">{m.qty} {m.unit}</td>
                <td><input className="nc-input" type="number" value={quoteVals[m.code] || ''} onChange={(e) => setQuoteVals((v) => ({ ...v, [m.code]: e.target.value }))} placeholder="0.00" /></td>
                <td className="is-num num nc-muted">{fmt(rows.find((r) => r.code === m.code)?.price || 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>

      {/* ============ 全局搜索 ============ */}
      <Modal open={gSearch} title="全局搜索 Ctrl+K" width={720} onClose={() => setGSearch(false)} foot={<Btn onClick={() => setGSearch(false)}>关闭</Btn>}>
        <div className="nc-search" style={{ width: '100%', marginBottom: 12 }}>
          <svg className="nc-search-ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
          <input autoFocus value={gKw} onChange={(e) => setGKw(e.target.value)} placeholder="产品 / 材料 / BOM / 供应商…" />
        </div>
        {(() => {
          const k = gKw.trim();
          const mm = k ? rows.filter((r) => r.name.includes(k) || r.code.includes(k) || r.spec.includes(k)) : rows.slice(0, 6);
          const ss = k ? SUPPLIERS.filter((s) => s.name.includes(k) || s.id.includes(k)) : SUPPLIERS.slice(0, 3);
          return (
            <>
              <div className="nc-tiny nc-muted" style={{ marginBottom: 8 }}>材料 / 产品 / BOM（{mm.length}）</div>
              <table className="nc-tbl" style={{ minWidth: 560 }}>
                <tbody>
                  {mm.map((m) => (
                    <tr key={m.id} className="nc-cursor-help" onClick={() => { setGSearch(false); setDetail(m); }}>
                      <td style={{ width: 100 }} className="num">{m.code}</td>
                      <td><b>{m.name}</b> <span className="nc-tiny nc-muted">{m.spec}</span></td>
                      <td style={{ width: 80 }}><Tag tone={m.type === '产品' ? 'blue' : m.type === '套件 BOM' ? 'purple' : 'gray'}>{m.type}</Tag></td>
                      <td style={{ width: 90, textAlign: 'right' }} className="num">{fmt(m.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="nc-tiny nc-muted" style={{ margin: '10px 0 6px' }}>供应商（{ss.length}）</div>
              <table className="nc-tbl" style={{ minWidth: 560 }}>
                <tbody>
                  {ss.map((s) => (
                    <tr key={s.id} className="nc-cursor-help" onClick={() => { setGSearch(false); go('supplier'); }}>
                      <td style={{ width: 110 }} className="num">{s.id}</td>
                      <td>{s.name}</td>
                      <td style={{ width: 90 }}><Tag tone={s.status === '已准入' ? 'green' : 'gray'}>{s.status}</Tag></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          );
        })()}
      </Modal>

      {/* ============ BOM 升版确认 ============ */}
      <Modal open={!!bomUp} title="BOM 升版" width={520} onClose={() => setBomUp(null)}
        foot={<><Btn onClick={() => setBomUp(null)}>取消</Btn><Btn kind="primary" onClick={() => { setBomUp(null); toast(`已生成 ${bomUp} 的 BOM 新版本草稿（旧版快照保留，报价引用不受影响）`); }}>确认升版</Btn></>}>
        {bomUp && (() => {
          const B = BOMS[bomUp];
          const P0 = PRODUCTS.find((x) => x.code === bomUp);
          if (!B || !P0) return null;
          return (
            <>
              <div className="nc-warnbox is-info">
                <b>升版规则</b>
                <div>编辑已被引用的 BOM → 自动生成新版本，旧版永久保留（报价引用快照不受影响）；升版后可在「套件 BOM」页维护配方。</div>
              </div>
              <KvGrid cols={2} rows={[
                { k: '套件', v: P0.name },
                { k: '当前版本', v: B.cur },
                { k: '新版本', v: 'V' + (B.versions.length + 1) },
                { k: '引用次数', v: `${B.versions.find((v) => v.v === B.cur)?.refs ?? 0} 次` },
              ]} />
            </>
          );
        })()}
      </Modal>

    </>
  );
}
