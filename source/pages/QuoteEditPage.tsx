// 报价编辑（工作台）—— 目录化组价与批量调价，报价的「干活页面」
// 核心：8 目录批量调价 · 明细 5 列内嵌可编辑 · 汇总项只读自动计算 · 粘性汇总条触发提示
import React, { useMemo, useState } from 'react';
import {
  Btn, Banner, Card, Field, KvGrid, Modal, Money, Op, OpSep, PageHead, SearchInput,
  Tag, Tip, useToast, Check, Code, Collapse, ChainBar, DataTable, Drawer, EntityLink,
} from '../components/ui';
import { QUOTE_CATS, UNITS, MATERIALS, KITS, RECIPES, bomCost, itemByCode, CUSTOMERS, OPPS, PROJECTS, matPriceRef, fmt, fmtWan, approveLevel, quoteTrigger, TODAY } from '../components/data';
import { Ico } from '../components/icons';

type Item = {
  id: number; cat: string; name: string; spec: string; unit: string;
  qty: number; cost: number; markup: number; note: string;
  /** 材料编码：来自材料库 / 项目用料时写入，用于「¥参考」三源价格查询；自定义行无编码 */
  code?: string;
  /** 手改行标记：手改成本价后批量调价不重算（对齐参考口径） */
  manual?: boolean;
};

/** 成本参考价采纳留痕（谁 · 何时 · 旧值→新值 · 来源） */
type CostEdit = { row: string; old: number; nu: number; by: string; t: string; src: string };

const INIT: Item[] = [
  { id: 1, cat: '消防电', name: '点型感烟火灾探测器', spec: 'JBF-3131（含底座）', unit: '个', qty: 860, cost: 92, markup: 25, note: '' },
  { id: 2, cat: '消防电', name: '手动火灾报警按钮', spec: 'JBF-3121', unit: '个', qty: 96, cost: 118, markup: 25, note: '' },
  { id: 3, cat: '消防电', name: '火灾报警控制器（联动型）', spec: 'JB-QB-JBF-5010 · 2 回路', unit: '台', qty: 4, cost: 18600, markup: 25, note: '含配套电源盘' },
  { id: 4, cat: '消防水', name: '喷洒头（下垂型）', spec: 'ZSTX-15/68℃', unit: '个', qty: 1240, cost: 21, markup: 20, note: '' },
  { id: 5, cat: '消防水', name: '消防水泵接合器', spec: 'SQD150-A', unit: '套', qty: 6, cost: 1580, markup: 20, note: '' },
  { id: 6, cat: '防排烟', name: '排烟防火阀', spec: 'FVD-70℃ · 1200×400', unit: '个', qty: 42, cost: 780, markup: 22, note: '' },
  { id: 7, cat: '防排烟', name: '轴流排烟风机', spec: 'HTF-Ⅰ-No.10 · 3.0kW', unit: '台', qty: 8, cost: 8600, markup: 22, note: '含减振与软接' },
  { id: 8, cat: '应急照明', name: '集中控制型应急照明控制器', spec: 'YZ-C-100', unit: '台', qty: 2, cost: 9600, markup: 18, note: '' },
  { id: 9, cat: '应急照明', name: '安全出口标志灯', spec: 'LED · 集中电源型', unit: '套', qty: 186, cost: 138, markup: 18, note: '' },
  { id: 10, cat: '气体灭火', name: '七氟丙烷灭火装置', spec: 'GQQ-120L · 单瓶组', unit: '套', qty: 6, cost: 12800, markup: 18, note: '含管网与喷头' },
  { id: 11, cat: '消防结构', name: '钢质防火门', spec: '甲级 · 1500×2100（含闭门器）', unit: '樘', qty: 24, cost: 1680, markup: 15, note: '' },
  { id: 12, cat: '土建配合', name: '管道沟槽开挖与回填', spec: '深度 ≤1.2m · 含夯实', unit: '米', qty: 320, cost: 86, markup: 15, note: '' },
  { id: 13, cat: '土建配合', name: '管道支吊架制安', spec: '综合支架 · 热镀锌', unit: '套', qty: 420, cost: 68, markup: 15, note: '' },
  { id: 14, cat: '服务费', name: '消防深化设计费', spec: '按建筑面积计取', unit: '项', qty: 1, cost: 68000, markup: 12, note: '图纸深化 + 报审配合' },
  { id: 15, cat: '服务费', name: '消防设施检测费', spec: '第三方检测机构', unit: '项', qty: 1, cost: 32000, markup: 12, note: '' },
];

const CAT_KEYS = QUOTE_CATS.map((c) => c.name);
const catDefaultMarkup = (cat: string) => QUOTE_CATS.find((c) => c.name === cat)?.markup ?? 15;

/* ============ 项目用料清单（原型派生） ============ */
/** 项目推荐套件：按项目编码散列取一半套件，保证不同项目用料清单不同 */
const projKitList = (projId: string) => {
  const h = [...projId].reduce((a, c) => a + c.charCodeAt(0), 0);
  const kits = KITS;
  const picked = kits.filter((_, i) => (i + h) % 2 === 0);
  return picked.length ? picked : kits.slice(0, 1);
};
/** 项目常用材料：按项目编码散列取 6~7 项 */
const projMatList = (projId: string) => {
  const h = [...projId].reduce((a, c) => a + c.charCodeAt(0), 0);
  return MATERIALS.filter((_, i) => (i + h) % 3 !== 2).slice(0, 7);
};

export default function QuoteEditPage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  // L0 头部
  const [customer, setCustomer] = useState('昆明市第一人民医院');
  const [opp, setOpp] = useState('SJ000470');
  const [pType, setPType] = useState('改造');
  const [qName, setQName] = useState('昆明市第一人民医院住院楼消防系统升级报价');
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
  const [bCat, setBCat] = useState('消防电');
  const [bMode, setBMode] = useState<'rate' | 'price'>('rate');
  const [bRate, setBRate] = useState(25);
  const [bPrice, setBPrice] = useState(0);
  // 明细
  const [items, setItems] = useState<Item[]>(INIT);
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
  /** 已勾选的用料编码（套件 = CP 编码 / 材料 = CL 编码） */
  const [projSel, setProjSel] = useState<Set<string>>(new Set());
  /** 套件带入方式：expand 展开为材料明细 / whole 整体带入 1 行 */
  const [kitMode, setKitMode] = useState<Record<string, 'expand' | 'whole'>>({});
  const [submitOpen, setSubmitOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [aiRun, setAiRun] = useState(false);
  const [aiPicked, setAiPicked] = useState<string[]>([]);
  const [matKw, setMatKw] = useState('');
  const [matPick, setMatPick] = useState<string[]>([]);
  const [cName, setCName] = useState(''); const [cSpec, setCSpec] = useState(''); const [cUnit, setCUnit] = useState('项');
  const [cQty, setCQty] = useState(1); const [cCost, setCCost] = useState(0); const [cCat, setCCat] = useState('服务费');
  const [miss, setMiss] = useState<number[]>([]);
  // 新增：打印留痕 / 版本管理 / 转合同（原子事务）/ 报价审批 / 独立新建报价单
  const [printOpen, setPrintOpen] = useState(false);
  const [verOpen, setVerOpen] = useState(false);
  const [cvtOpen, setCvtOpen] = useState(false);
  const [apprOpen, setApprOpen] = useState(false);
  const [newQOpen, setNewQOpen] = useState(false);
  const [nqName, setNqName] = useState('');
  const [nqCust, setNqCust] = useState('昆明市第一人民医院');
  const [nqType, setNqType] = useState('改造');
  const [matCat, setMatCat] = useState('全部目录');

  /* ---------- 派生计算（只读，不可手填） ---------- */
  const line = (it: Item) => {
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

  const setIt = (id: number, patch: Partial<Item>) => setItems((p) => p.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  /* 版本记录（多轮报价逐版留痕，可对比追溯） */
  const VERSIONS = [
    { v: 'V2', at: '2026-09-12 10:24', by: '李思敏', amt: sumExTax, note: '按客户意见下调应急照明 2 档，报警点位优化', st: '草稿' },
    { v: 'V1', at: '2026-09-08 16:40', by: '李思敏', amt: Math.round(sumExTax * 1.08), note: '首版报价（含应急照明全套）', st: '已作废' },
  ];

  const applyCat = () => {
    const hitRows = items.filter((it) => it.cat === bCat);
    if (!hitRows.length) { toast(`目录「${bCat}」下暂无明细行`); return; }
    setItems((p) => p.map((it) => {
      if (it.cat !== bCat) return it;
      if (bMode === 'rate') return { ...it, markup: bRate };
      const price = it.cost + (it.markup / 100) * it.cost;
      return { ...it, markup: price ? Math.max(0, ((bPrice - it.cost) / it.cost) * 100) : it.markup };
    }));
    toast(`已应用于「${bCat}」目录 ${hitRows.length} 条明细`);
  };

  const useCatDef = () => { setBRate(catDefaultMarkup(bCat)); toast(`已带出「${bCat}」默认上浮率 ${catDefaultMarkup(bCat)}%`); };

  const applyRegion = () => {
    setItems((p) => p.map((it) => ({ ...it, markup: Math.round((it.markup + 3) * 10) / 10 })));
    toast('区域系数（云南 +3%）已刷新全清单报价价，共 15 条变动');
  };

  const doAI = () => {
    setAiRun(true);
    setTimeout(() => {
      const add: Item[] = [
        { id: 101, cat: '消防电', name: '消防应急广播扬声器', spec: '3W · 吸顶式', unit: '个', qty: 68, cost: 96, markup: 25, note: 'AI 识别：图纸标注「应急广播」' },
        { id: 102, cat: '消防水', name: '减压孔板', spec: 'DN100', unit: '个', qty: 14, cost: 168, markup: 20, note: 'AI 识别：图纸标注「减压」' },
        { id: 103, cat: '防排烟', name: '止回阀', spec: 'DN800 · 排烟系统', unit: '个', qty: 6, cost: 1240, markup: 22, note: 'AI 识别：风管节点' },
      ];
      setItems((p) => [...p, ...add]);
      setAiRun(false); setAiPicked(add.map((a) => a.name));
      toast('AI 已识别图纸并生成 3 条明细，请逐条核对规格与数量');
    }, 700);
  };

  const addFromMat = () => {
    const add: Item[] = (matPick.length ? matPick : [MATERIALS[0]?.id ?? '']).filter(Boolean).map((id, i) => {
      const m = MATERIALS.find((x) => x.id === id);
      return {
        id: 200 + i, cat: '消防电', name: m?.name ?? '材料', spec: m?.spec ?? '', unit: m?.unit ?? '个',
        qty: m?.stock ?? 1, cost: Math.round((m?.price ?? 0) / 1.13), markup: catDefaultMarkup('消防电'), note: '来自材料库',
        code: m?.code,
      } as Item;
    });
    if (!add.length) { toast('请先勾选材料'); return; }
    setItems((p) => [...p, ...add]);
    setAddOpen(false); setMatPick([]);
    toast(`已从材料库添加 ${add.length} 条明细（自动带出编码/规格/单位/目录/成本参考价）`);
  };

  /** 从项目拉取用料 → 生成报价明细（套件可整体带入 1 行，或展开为材料明细） */
  const addFromProj = () => {
    if (!projSel.size) { toast('请先勾选用料'); return; }
    const proj = PROJECTS.find((p) => p.id === projPick);
    /* 数量规模：按项目合同额派生（50 万为 1 个基准单位），避免全部为 1 的不真实感 */
    const scale = Math.max(1, Math.round((proj?.contractAmt ?? 500000) / 500000));
    const add: Item[] = [];
    let seq = 400 + items.length;
    projKitList(projPick).filter((k) => projSel.has(k.code)).forEach((k) => {
      const mode = kitMode[k.code] ?? 'expand';
      if (mode === 'whole') {
        add.push({
          id: seq++, cat: '消防电', name: k.name, spec: k.spec, unit: k.unit,
          qty: scale, cost: bomCost(k.code).total, markup: catDefaultMarkup('消防电'),
          note: `来自项目 ${projPick} · 套件整体`, code: k.code,
        });
      } else {
        const R = RECIPES[k.code];
        const ver = R?.versions.find((v) => v.v === R.cur);
        (ver?.lines ?? []).forEach((l) => {
          const m = itemByCode(l.code);
          if (!m) return;
          add.push({
            id: seq++, cat: '消防电', name: m.name, spec: m.spec, unit: m.unit,
            qty: l.qty * scale, cost: Math.round(m.price / 1.13), markup: catDefaultMarkup('消防电'),
            note: `来自项目 ${projPick} · 套件「${k.name}」展开`, code: m.code,
          });
        });
      }
    });
    projMatList(projPick).filter((m) => projSel.has(m.code)).forEach((m) => {
      add.push({
        id: seq++, cat: '消防电', name: m.name, spec: m.spec, unit: m.unit,
        qty: 10 * scale, cost: Math.round(m.price / 1.13), markup: catDefaultMarkup('消防电'),
        note: `来自项目 ${projPick}`, code: m.code,
      });
    });
    setItems((p) => [...p, ...add]);
    setProjOpen(false); setProjSel(new Set()); setKitMode({});
    toast(`已从项目 ${projPick} 拉取 ${add.length} 条报价明细`);
  };

  const addCustom = () => {
    if (!cName.trim() || !cCost) { toast('名称与成本参考价必填'); return; }
    setItems((p) => [...p, { id: 300 + p.length, cat: cCat, name: cName, spec: cSpec, unit: cUnit, qty: cQty, cost: cCost, markup: catDefaultMarkup(cCat), note: '手输自定义行' }]);
    setCustomOpen(false); setCName(''); setCSpec(''); setCQty(1); setCCost(0);
    toast('自定义行已添加');
  };

  const preSubmit = () => {
    const m = items.filter((it) => !it.name.trim() || !it.qty || !it.cost).map((it) => it.id);
    setMiss(m);
    if (m.length) { toast(`有 ${m.length} 行缺少必填（名称 / 数量 / 成本参考价），已红框定位`); return; }
    const below = items.filter((it) => line(it).price < it.cost);
    if (below.length) { toast(`${below.length} 行报价价低于成本价，锁死不可提交（须理由 + 特批）`); return; }
    setSubmitOpen(true);
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

  const grouped = useMemo(() => CAT_KEYS.map((c) => ({ cat: c, rows: items.filter((it) => it.cat === c) })).filter((g) => g.rows.length), [items]);

  return (
    <>
      <PageHead
        title="报价编辑 · 工作台"
        badges={<><Tag tone="gray">草稿</Tag><Tag tone="blue">BJ20260912-0011 V2</Tag></>}
        sub={<span>目录化组价工作台<Tip text="目录化组价 · 批量调价 · 汇总项自动计算（不可手填）。" /></span>}
        actions={<>
          <Btn onClick={() => go('quote')}>← 返回台账</Btn>
          <Btn onClick={() => toast('草稿已保存（成本参考价快照已留痕）')}>保存草稿</Btn>
          <Btn onClick={() => setNewQOpen(true)}>＋ 新建报价单</Btn>
          <Btn onClick={() => setPrintOpen(true)}><Ico n="file" size={16} /> 打印预览</Btn>
          <Btn onClick={() => setVerOpen(true)}><Ico n="folder" size={16} /> 版本管理</Btn>
          <Btn onClick={() => setApprOpen(true)}><Ico n="receipt" size={16} /> 报价审批</Btn>
          <Btn onClick={() => setCvtOpen(true)}><Ico n="bolt" size={16} /> 转合同</Btn>
          <Btn kind="primary" onClick={preSubmit}>提交审批</Btn>
        </>}
      />

      {/* ===== L0 头部 ===== */}
      <Card>
        <div className="nc-l0">
          <Field label="客户" req><select className="nc-input" value={customer} onChange={(e) => setCustomer(e.target.value)}>
            {CUSTOMERS.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select></Field>
          <Field label="关联商机"><select className="nc-input" value={opp} onChange={(e) => setOpp(e.target.value)}>
            {OPPS.filter((o) => !['未中标', '关闭'].includes(o.stage)).map((o) => <option key={o.id} value={o.id}>{o.id} · {o.name}</option>)}
            <option value="">暂不关联</option>
          </select></Field>
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
            <Field label="关联项目"><select className="nc-input" value={linkedProj} onChange={(e) => setLinkedProj(e.target.value)}>
              <option value="">暂不关联</option><option>XM20260412-0007 昆明万达广场消防设施改造</option>
            </select></Field>
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
            <Btn size="sm" onClick={() => setAddOpen(true)}><Ico n="building" size={16} /> 从材料库添加</Btn>
            <Btn size="sm" onClick={() => { setAiOpen(true); setAiPicked([]); }}><Ico n="bolt" size={16} /> AI 识别图纸生成</Btn>
            <Btn size="sm" onClick={() => setCustomOpen(true)}>＋ 手输自定义行</Btn>
          </div>
          <span className="nc-listhint">材料自动带出<Tip text="编码 / 规格 / 单位 / 目录 / 成本参考价；目录列来自材料档案，只读锁定。" /></span>
        </div>
        <div className="nc-catbar">
          <span className="nc-catbar-lb">目录批量调价</span>
          <select className="nc-input nc-input-sm" value={bCat} onChange={(e) => setBCat(e.target.value)}>
            {CAT_KEYS.map((c) => <option key={c} value={c}>{c}（默认 ±{catDefaultMarkup(c)}%）</option>)}
          </select>
          <select className="nc-input nc-input-sm" value={bMode} onChange={(e) => setBMode(e.target.value as 'rate' | 'price')}>
            <option value="rate">上浮比例 %</option><option value="price">上浮单价 ¥</option>
          </select>
          {bMode === 'rate'
            ? <input className="nc-input nc-input-sm" type="number" value={bRate} onChange={(e) => setBRate(Number(e.target.value))} />
            : <input className="nc-input nc-input-sm" type="number" value={bPrice} onChange={(e) => setBPrice(Number(e.target.value))} />}
          <Btn size="sm" onClick={useCatDef}>按目录默认上浮率带出</Btn>
          <Btn size="sm" kind="primary" onClick={applyCat}>应用到目录</Btn>
          <span className="nc-cell-sub">命中 <b className="num">{items.filter((it) => it.cat === bCat).length}</b> 条</span>
          <span className="nc-catbar-sp" />
          <Btn size="sm" onClick={applyRegion}>区域系数调价（云南 +3%）</Btn>
        </div>

        {/* ===== 明细表 ===== */}
        <div className="nc-tbl-wrap">
          <table className="nc-tbl nc-tbl-edit" style={{ minWidth: 1500 }}>
            <thead>
              <tr>
                <th style={{ width: 44 }}>#</th>
                <th style={{ width: 110 }}>目录</th>
                <th style={{ width: 230 }}>名称 <span className="nc-req">√≤50</span></th>
                {showSpec && <th style={{ width: 200 }}>规格</th>}
                <th style={{ width: 80 }}>单位</th>
                <th style={{ width: 90 }} className="is-num">数量 √</th>
                <th style={{ width: 120 }} className="is-num">成本参考价 √</th>
                <th style={{ width: 110 }} className="is-num">上浮率 %</th>
                <th style={{ width: 110 }} className="is-num">上浮单价 √</th>
                <th style={{ width: 130 }} className="is-num">上浮前</th>
                <th style={{ width: 130 }} className="is-num">金额</th>
                {showNote && <th style={{ width: 160 }}>备注</th>}
                <th style={{ width: 60 }} className="is-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map((g) => (
                <React.Fragment key={g.cat}>
                  <tr className="nc-tbl-group"><td colSpan={showSpec && showNote ? 13 : showSpec || showNote ? 12 : 11}>
                    <span className="nc-group-name">{g.cat}</span>
                    <span className="nc-cell-sub">默认上浮率 {catDefaultMarkup(g.cat)}% · {g.rows.length} 行 · 小计 <b className="num">{fmt(g.rows.reduce((a, it) => a + line(it).amt, 0))}</b></span>
                  </td></tr>
                  {g.rows.map((it, i) => {
                    const l = line(it);
                    const dev = it.cost ? (l.price - it.cost) / it.cost : 0;
                    const offTone = dev > 0.2 ? ' is-red' : dev > 0.1 ? ' is-orange' : '';
                    return (
                      <tr key={it.id} className={miss.includes(it.id) ? 'is-miss' : ''}>
                        <td className="is-num">{items.indexOf(it) + 1}</td>
                        <td><span className="nc-cell-sub">{it.cat}</span></td>
                        <td className={miss.includes(it.id) && !it.name.trim() ? 'cell-miss' : ''}>
                          <input className={`nc-cell-in${miss.includes(it.id) && !it.name.trim() ? ' miss' : ''}`} value={it.name} maxLength={50} onChange={(e) => setIt(it.id, { name: e.target.value })} />
                        </td>
                        {showSpec && <td><span className="nc-cell-sub">{it.spec || '/'}</span></td>}
                        <td>
                          <select className="nc-cell-in" value={it.unit} onChange={(e) => setIt(it.id, { unit: e.target.value })}>
                            {UNITS.map((u) => <option key={u}>{u}</option>)}
                          </select>
                        </td>
                        <td className="is-num">
                          <input className={`nc-cell-in is-num${miss.includes(it.id) && !it.qty ? ' miss' : ''}`} type="number" value={it.qty} onChange={(e) => setIt(it.id, { qty: Number(e.target.value) })} />
                        </td>
                        <td className="is-num">
                          <input className={`nc-cell-in is-num${miss.includes(it.id) && !it.cost ? ' miss' : ''}`} type="number" value={it.cost} onChange={(e) => setIt(it.id, { cost: Number(e.target.value) })} />
                          <button className="nc-refbtn" onClick={() => setRefOpen(it)} title="查看成本参考价三源">¥参考</button>
                        </td>
                        <td className="is-num">
                          <select className={`nc-cell-in${offTone}`} value={it.markup} onChange={(e) => setIt(it.id, { markup: Number(e.target.value) })}>
                            {[0, 5, 8, 10, 12, 15, 18, 20, 22, 25, 28, 30, 35, 40].map((n) => <option key={n} value={n}>{n}%</option>)}
                          </select>
                        </td>
                        <td className="is-num"><b className={`num${offTone}`}>{fmt(l.price)}</b></td>
                        <td className="is-num nc-cell-sub">{fmt(l.before)}</td>
                        <td className="is-num"><b className="num">{fmt(l.amt)}</b></td>
                        {showNote && <td><input className="nc-cell-in" value={it.note} onChange={(e) => setIt(it.id, { note: e.target.value })} placeholder="—" /></td>}
                        <td className="is-center"><Op danger onClick={() => { setItems((p) => p.filter((x) => x.id !== it.id)); toast('已删除明细行'); }}>删</Op></td>
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
          <div className="nc-sum-cell"><span>整体浮率</span><b className={`num${grossMarkup >= 30 ? ' is-red' : ''}`}>{grossMarkup.toFixed(1)}%</b></div>
          <div className={`nc-sum-trig${hit ? ' is-hit' : ' is-ok'}`}>{hitWhy}</div>
        </div>
      </Card>

      {/* ===== 从材料库添加 ===== */}
      <Drawer open={addOpen} onClose={() => setAddOpen(false)} width={760} title="从材料库添加" sub="材料自动带出编码 / 规格 / 单位 / 目录 / 成本参考价；目录列只读锁定"
        foot={<><Btn onClick={() => setAddOpen(false)}>取消</Btn><Btn kind="primary" onClick={addFromMat}>添加 {matPick.length || 0} 条</Btn></>}>
        <div className="nc-toolbar">
          <SearchInput value={matKw} onChange={setMatKw} placeholder="材料名称 / 编码 / 规格" width={260} />
          <select className="nc-input nc-input-sm" value={matCat} onChange={(e) => setMatCat(e.target.value)}>
            <option>全部目录</option>{CAT_KEYS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="nc-cell-sub">价格档案：含税成交价取自材料价格库（采购合同沉淀 / 询比价 / 历史报价）</span>
        </div>
        <DataTable
          cols={[
            { key: 'id', title: '编码', width: 110, render: (m: any) => <Code>{m.id}</Code> },
            { key: 'name', title: '材料名称', width: 190, render: (m: any) => <div className="nc-cell-main"><div>{m.name}</div><div className="nc-cell-sub">{m.spec}</div></div> },
            { key: 'unit', title: '单位', width: 60 },
            { key: 'cat', title: '目录', width: 90, render: (m: any) => <Tag tone="blue">{m.cat}</Tag> },
            { key: 'stock', title: '库存', width: 70, align: 'right' as const },
            { key: 'price', title: '含税成交价', width: 110, align: 'right' as const, render: (m: any) => <b className="num">{fmt(m.price)}</b> },
            { key: 'cost', title: '成本参考价', width: 110, align: 'right' as const, render: (m: any) => <span className="num nc-cell-sub">{fmt(Math.round(m.price / 1.13))}</span> },
            { key: 'src', title: '价格来源', width: 110, render: () => <span className="nc-cell-sub">采购合同沉淀</span> },
          ]}
          rows={MATERIALS.filter((m: any) => (matCat === '全部目录' || m.cat === matCat) && (!matKw || (m.name + m.id + (m.spec || '')).includes(matKw)))}
          rowKey={(m: any) => m.id}
          minWidth={860}
          selectable
          selected={matPick}
          onSelectAll={(ids) => setMatPick(ids)}
          onSelectRow={(id) => setMatPick((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
        />
      </Drawer>

      {/* ===== AI 识别图纸 ===== */}
      <Modal open={aiOpen} onClose={() => setAiOpen(false)} width={620} title="AI 识别图纸生成明细"
        foot={<><Btn onClick={() => setAiOpen(false)}>取消</Btn><Btn kind="primary" disabled={aiRun} onClick={() => { doAI(); }}>{aiRun ? '识别中…' : '开始识别'}</Btn><Btn disabled={!aiPicked.length} onClick={() => { setAiOpen(false); toast(`已确认 ${aiPicked.length} 条 AI 明细`); }}>确认采用</Btn></>}>
        <Banner tone="info">上传消防图纸（PDF / DWG 导出图 / 照片）→ 自动识别系统类型、点位数量、设备型号，生成待确认明细行；<b>识别结果须逐条核对</b>。</Banner>
        <div className="nc-dropzone"><Ico n="edit" size={16} /> 拖入图纸或 <Btn size="sm">选择文件</Btn><div className="nc-cell-sub">支持 PDF / PNG / JPG / DWG 导出图，单文件 ≤50MB</div></div>
        {aiRun && <div className="nc-rulebar">识别中：正在解析图层与图例…</div>}
        {!!aiPicked.length && (
          <>
            <div className="nc-sec-title">识别结果（{aiPicked.length} 条待确认）</div>
            <ul className="nc-check-list">{aiPicked.map((n) => <li key={n}><Ico n="check" size={16} /> {n}</li>)}</ul>
          </>
        )}
      </Modal>

      {/* ===== 手输自定义行 ===== */}
      <Modal open={customOpen} onClose={() => setCustomOpen(false)} width={620} title="＋ 手输自定义行"
        foot={<><Btn onClick={() => setCustomOpen(false)}>取消</Btn><Btn kind="primary" onClick={addCustom}>添加</Btn></>}>
        <div className="nc-form-grid">
          <Field label="所属目录" req><select className="nc-input" value={cCat} onChange={(e) => setCCat(e.target.value)}>
            {CAT_KEYS.map((c) => <option key={c}>{c}</option>)}
          </select></Field>
          <Field label="名称" req><input className="nc-input" value={cName} onChange={(e) => setCName(e.target.value)} maxLength={50} placeholder="≤50 字" /></Field>
          <Field label="规格"><input className="nc-input" value={cSpec} onChange={(e) => setCSpec(e.target.value)} /></Field>
          <Field label="单位" req><select className="nc-input" value={cUnit} onChange={(e) => setCUnit(e.target.value)}>
            {UNITS.map((u) => <option key={u}>{u}</option>)}
          </select></Field>
          <Field label="数量" req><input className="nc-input" type="number" value={cQty} onChange={(e) => setCQty(Number(e.target.value))} /></Field>
          <Field label="成本参考价" req note="低于此价将锁死不可提交"><input className="nc-input" type="number" value={cCost} onChange={(e) => setCCost(Number(e.target.value))} /></Field>
        </div>
      </Modal>

      {/* ===== 从项目拉取用料 ===== */}
      <Drawer open={projOpen} onClose={() => setProjOpen(false)} width={920} title="从项目拉取用料"
        sub="选项目 → 勾材料 / 套件 → 一键生成报价明细（支持部分选择）"
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
              <Banner tone="info">按项目用料清单拉取：材料自动带出规格 / 单位 / 成本参考价；<b>套件可选「整体带入」或「展开为材料明细」</b>。</Banner>
              <div className="nc-form-grid">
                <Field label="选择项目" req span={2}>
                  <select className="nc-input" value={projPick} onChange={(e) => { setProjPick(e.target.value); setProjSel(new Set()); setKitMode({}); }}>
                    {PROJECTS.map((p) => <option key={p.id} value={p.id}>{p.id} · {p.name}（{p.type}）</option>)}
                  </select>
                </Field>
                <Field label="客户" span={2}>
                  <input className="nc-input" readOnly value={proj?.customer ?? ''} />
                </Field>
              </div>

              <div className="nc-sec-title" style={{ marginTop: 14 }}>套件（{kits.length}）<span className="nc-tiny nc-muted">可整体带入或展开为材料明细</span></div>
              <table className="nc-tbl" style={{ minWidth: 840 }}>
                <thead><tr>
                  <th style={{ width: 40 }}><Check checked={allKits} onChange={(v) => toggleAll(kits.map((k) => k.code), v)} /></th>
                  <th>套件</th>
                  <th style={{ width: 90 }} className="is-num">含材料</th>
                  <th style={{ width: 110 }} className="is-num">套件成本</th>
                  <th style={{ width: 176 }}>带入方式</th>
                </tr></thead>
                <tbody>
                  {kits.map((k) => {
                    const c = bomCost(k.code);
                    const ver = RECIPES[k.code]?.versions.find((v) => v.v === RECIPES[k.code].cur);
                    return (
                      <tr key={k.code}>
                        <td><Check checked={projSel.has(k.code)} onChange={(v) => toggleOne(k.code, v)} /></td>
                        <td><b>{k.name}</b> <Tag tone="purple">套件</Tag><div className="nc-tiny nc-muted">{k.code} · {k.spec}</div></td>
                        <td className="is-num num">{ver?.lines.length ?? 0} 项</td>
                        <td className="is-num num">{fmt(c.total)}</td>
                        <td>
                          <select className="nc-input" value={kitMode[k.code] ?? 'expand'} onChange={(e) => setKitMode((m) => ({ ...m, [k.code]: e.target.value as 'expand' | 'whole' }))}>
                            <option value="expand">展开为材料明细</option>
                            <option value="whole">整体带入（1 行）</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="nc-sec-title" style={{ marginTop: 16 }}>材料（{mats.length}）</div>
              <table className="nc-tbl" style={{ minWidth: 840 }}>
                <thead><tr>
                  <th style={{ width: 40 }}><Check checked={allMats} onChange={(v) => toggleAll(mats.map((m) => m.code), v)} /></th>
                  <th style={{ width: 110 }}>编码</th>
                  <th>名称 / 规格</th>
                  <th style={{ width: 64, textAlign: 'center' }}>单位</th>
                  <th style={{ width: 110 }} className="is-num">成本参考价</th>
                </tr></thead>
                <tbody>
                  {mats.map((m) => (
                    <tr key={m.code}>
                      <td><Check checked={projSel.has(m.code)} onChange={(v) => toggleOne(m.code, v)} /></td>
                      <td className="num nc-id-cell">{m.code}</td>
                      <td>{m.name} <span className="nc-tiny nc-muted">{m.spec}</span></td>
                      <td style={{ textAlign: 'center' }}>{m.unit}</td>
                      <td className="is-num num">{fmt(Math.round(m.price / 1.13))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          );
        })()}
      </Drawer>

      {/* ===== 价格参考（三源 · 图表化） ===== */}
      <Drawer open={!!refOpen} onClose={() => setRefOpen(null)} width={780} title="价格参考"
        sub={refOpen && (() => {
          const m = MATERIALS.find((x) => x.code === refOpen.code) || MATERIALS.find((x) => x.name === refOpen.name);
          return `${refOpen.name}${m ? `（${m.code}）` : '（自定义材料）'} · 当前成本 ${fmt(refOpen.cost)}`;
        })()}>
        {refOpen && (() => {
          const mat = MATERIALS.find((x) => x.code === refOpen.code) || MATERIALS.find((x) => x.name === refOpen.name);
          /* 自定义材料：无价格档案 → 仅支持手工填写 */
          if (!mat) {
            const guess = MATERIALS.filter((x) => x.name.slice(0, 2) === refOpen.name.slice(0, 2)).slice(0, 3);
            return (
              <>
                <Banner tone="warn">
                  该行为<b>自定义材料</b>，无价格档案。{guess.length ? <>可参考同类材料（{guess.map((g) => g.name).join(' / ')}）。</> : null}
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
                    adopt(v, '手工填写（自定义材料）');
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
                编码 <b>{mat.code}</b> · 规格 {mat.spec || '—'} · 单位 {mat.unit} ｜ 材料库参考成本 <b className="num">{fmt(R.libPrice)}</b> ｜ 当前成本 <b className="num">{fmt(refOpen.cost)}</b>
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
      <Modal open={submitOpen} onClose={() => setSubmitOpen(false)} width={600} title="提交审批"
        foot={<><Btn onClick={() => setSubmitOpen(false)}>取消</Btn><Btn kind="primary" onClick={() => {
          if (!reason.trim()) { toast('变更原因必填'); return; }
          toast(`已提交审批 · 路由至${approveLevel(sumExTax)}`);
          setSubmitOpen(false); go('quote');
        }}>确认提交</Btn></>}>
        <Banner tone={hit ? 'warn' : 'info'}>{hitWhy}{hit && <> · 按金额分级路由至 <b>{approveLevel(sumExTax)}</b></>}</Banner>
        <KvGrid cols={2} rows={[
          { k: '明细行数', v: `${items.length} 行` },
          { k: '报价总额（含税）', v: fmt(sumExTax) },
          { k: '整体浮率', v: grossMarkup.toFixed(1) + '%' },
          { k: '税率', v: `含税 ${taxRate}%` },
        ]} />
        <Field label="变更原因" req note={`${reason.length}/200 字`}>
          <textarea className="nc-input" rows={3} maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="例：按客户预算删减应急照明系统，报警点位优化" />
        </Field>
      </Modal>

      {/* ===== 打印预览（留痕） ===== */}
      <Modal open={printOpen} onClose={() => setPrintOpen(false)} width={820} title="打印预览"
        foot={<><Btn onClick={() => setPrintOpen(false)}>取消</Btn><Btn kind="primary" onClick={() => { setPrintOpen(false); toast(`已确认打印并留痕：${qName} · V2 · 打印人 ${role} · ${TODAY}`); }}>确认打印（留痕）</Btn></>}>
        <div className="nc-warnbox is-info">打印 / 导出将记录<b>谁 · 何时 · 哪一版</b>，客户收到的纸质报价可追溯；报价单标注<b>{exTax ? '不含税价' : '含税价'}</b>。</div>
        <div style={{ border: '1px solid var(--c-hairline)', borderRadius: 'var(--r-lg)', padding: 16 }}>
          <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{qName}</div>
          <div style={{ textAlign: 'center' }} className="nc-cell-sub">客户 {customer} · 项目类型 {pType} · 报价有效期 {valid} · 版本 V2</div>
          <table className="nc-tbl" style={{ minWidth: 700, marginTop: 12 }}>
            <thead><tr><th style={{ width: 90 }}>目录</th><th>名称</th><th style={{ width: 60 }}>单位</th><th style={{ width: 80 }} className="is-num">数量</th><th style={{ width: 110 }} className="is-num">单价</th><th style={{ width: 120 }} className="is-num">金额</th></tr></thead>
            <tbody>
              {items.slice(0, 6).map((it) => (
                <tr key={it.id}><td className="nc-cell-sub">{it.cat}</td><td>{it.name}</td><td>{it.unit}</td><td className="is-num num">{it.qty}</td><td className="is-num num">{fmt(line(it).price)}</td><td className="is-num num">{fmt(line(it).amt)}</td></tr>
              ))}
              <tr><td colSpan={5} className="nc-cell-sub">（预览仅展示前 6 行，共 {items.length} 行）</td><td /></tr>
            </tbody>
            <tfoot><tr className="nc-tbl-sum">
              <td colSpan={5}>报价总额（{exTax ? '不含税' : '含税'}）</td><td className="is-num num">{fmt(total)}</td>
            </tr></tfoot>
          </table>
          <div className="nc-cell-sub" style={{ marginTop: 8 }}>
            价格口径：本报价为<b>{exTax ? '不含税价（明确标注）' : '含税价'}</b>；税率 {taxRate}%，税额 {fmt(tax)}。
          </div>
        </div>
      </Modal>

      {/* ===== 版本管理 ===== */}
      <Modal open={verOpen} onClose={() => setVerOpen(false)} width={760} title="版本管理"
        foot={<><Btn onClick={() => setVerOpen(false)}>关闭</Btn><Btn kind="primary" onClick={() => { setVerOpen(false); toast('已基于 V2 生成 V3（按审批意见调整），旧版永久保留可追溯'); }}>生成新版本</Btn></>}>
        <div className="nc-cell-sub" style={{ marginBottom: 8 }}>多轮报价逐版留痕，可对比追溯；已提交审批的版本不可直接编辑。</div>
        <table className="nc-tbl" style={{ minWidth: 680 }}>
          <thead><tr><th style={{ width: 60 }}>版本</th><th style={{ width: 140 }}>时间</th><th style={{ width: 90 }}>操作人</th><th style={{ width: 120, textAlign: 'right' }}>报价总额</th><th style={{ width: 90 }}>状态</th><th>变更说明</th><th style={{ width: 70 }}>操作</th></tr></thead>
          <tbody>
            {VERSIONS.map((v) => (
              <tr key={v.v}>
                <td><Tag tone={v.st === '草稿' ? 'blue' : 'gray'}>{v.v}</Tag></td>
                <td className="num nc-tiny">{v.at}</td>
                <td>{v.by}</td>
                {/* 评审 P0-1 同族：版本快照的报价总额原先 fmt 直出，绕过 A-02 脱敏口径 */}
                <td className="is-num"><Money v={v.amt} role={role} /></td>
                <td><Tag tone={v.st === '草稿' ? 'blue' : 'gray'}>{v.st}</Tag></td>
                <td className="nc-cell-sub">{v.note}</td>
                <td><Op onClick={() => toast(`已打开 ${v.v} 快照（只读）`)}>查看</Op></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>

      {/* ===== 报价审批（页内） ===== */}
      <Modal open={apprOpen} onClose={() => setApprOpen(false)} width={680} title="报价审批"
        foot={<><Btn onClick={() => setApprOpen(false)}>← 返回台账</Btn><Btn onClick={() => { setApprOpen(false); go('approval'); }}>去审批中心</Btn><Btn kind="primary" onClick={() => { setApprOpen(false); toast('已通过并流转至下一节点'); }}>通过并流转</Btn></>}>
        <Banner tone={hit ? 'warn' : 'info'}>{hitWhy}{hit && <> · 分级路由至 <b>{approveLevel(sumExTax)}</b></>}</Banner>
        <KvGrid cols={2} rows={[
          { k: '报价单号', v: <EntityLink target="quote-detail" id="BJ20260912-0011" go={go} title="下钻到报价详情">BJ20260912-0011</EntityLink> },
          { k: '版本', v: 'V2' },
          { k: '客户', v: customer },
          { k: '税率口径', v: `${exTax ? '不含税' : '含税'} ${taxRate}%（税额 ${fmt(tax)}）` },
          { k: '报价总额', v: fmt(total) },
          { k: '整体浮率', v: grossMarkup.toFixed(1) + '%' },
          { k: '有效期', v: `报价后 ${valid}` },
          { k: '审批路由', v: approveLevel(sumExTax) },
        ]} />
        <Field label="审批意见" note="可填写审批意见，将展示在审批链中（选填）">
          <textarea className="nc-input" rows={3} placeholder="通过后流转至：总经理（刘振国）；驳回需填写原因并退回报价草稿状态" />
        </Field>
      </Modal>

      {/* ===== 转合同 · 原子事务 ===== */}
      <Modal open={cvtOpen} onClose={() => setCvtOpen(false)} width={680} title="转合同 · 原子事务"
        foot={<><Btn onClick={() => setCvtOpen(false)}>取消</Btn><Btn kind="primary" onClick={() => {
          setCvtOpen(false);
          toast(`转合同成功：HT${TODAY.replace(/-/g, '')}-0013 已生成（${items.length} 行明细逐行转入）· 商机置「待启动」· 单项事务失败整体回滚`);
          go('contract');
        }}>确认转合同</Btn></>}>
        <Banner tone="gold">单事务：报价明细<b>逐行转入合同明细</b>，同时生成销售合同草稿并回写商机 / 项目；任一步失败<b>整体回滚</b>，不留半数据。</Banner>
        <KvGrid cols={2} rows={[
          { k: '报价单', v: <><EntityLink target="quote-detail" id="BJ20260912-0011" go={go} title="下钻到报价详情">BJ20260912-0011</EntityLink> · V2</> },
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
      <Modal open={newQOpen} onClose={() => setNewQOpen(false)} width={620} title="＋ 新建报价单（独立新建）"
        foot={<><Btn onClick={() => setNewQOpen(false)}>取 消</Btn><Btn kind="primary" disabled={!nqName.trim()} title={nqName.trim() ? undefined : '请填写报价单名称（必填）'} onClick={() => {
          setNewQOpen(false); setNqName('');
          toast(`报价草稿已创建：BJ${TODAY.replace(/-/g, '')}-0021（客户 ${nqCust} · 类型 ${nqType}）`);
        }}>创建草稿</Btn></>}>
        <div className="nc-warnbox is-info">独立新建不继承当前页明细；编号自动生成 <Code>BJ</Code> + 日期 + 4 位流水，初始状态「草稿」。</div>
        <div className="nc-form-grid">
          <Field label="客户" req span={2}>
            <select className="nc-input" value={nqCust} onChange={(e) => setNqCust(e.target.value)}>
              {['昆明市第一人民医院', '文山三七产业园管委会', '昆明万达广场商业管理有限公司', '云南师大附中'].map((c) => <option key={c}>{c}</option>)}
            </select>
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
    </>
  );
}
