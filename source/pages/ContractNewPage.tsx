// 新建合同向导（向导页）—— 布局 / 交互 / 页面结构复刻「合同新增.html」（五来源 · FR-CONT-001）
// 创建来源：手工录入 / OCR 识别 / 标准模板 / 企业模板 / 复制历史合同。原「报价转化」入口已移除，
// 改由合同明细的「从报价单导入」承接（报价台账仍可【转合同】直达本页，明细按单勾选导入）。
// 内部步号 0..5：0 选择创建来源 → 1 来源处理（OCR 上传 / 标准模板 / 企业模板 / 复制历史）
//   → 2 OCR 左图右字段校对 → 3 合同主体与工期 → 4 金额与收款 → 5 条款与附件
// 步骤条只渲染「当前来源实际会走的步」（route），并连续重编号为 Step1..StepN：
//   步骤条是为内容服务的（手工录入内容太多才需要分步），出现内容里没有的步就与内容脱节。
// 硬规则：
//  · 编号前缀由类型决定：HT 销售 / WB 维护保养 / CG 采购 / FK 分包 / KJ 框架（提交时生成 · 不可改）
//  · 含税口径 税额 = 总额 × 税率 ÷ (100 + 税率)；不含税 税额 = 总额 × 税率 ÷ 100
//  · 审批链 = 类型 × 金额矩阵自动路由（或签 / 会签），提交时存快照
//  · A-04：关联「已有项目」若存在未归并收支 → 提交硬拦截
//  · 签约日期 ≤ 今天（硬拦截）· 工期止 ≥ 工期起（硬拦截）
//  · 收款计划 ≤ 12 期，合计须与明细合计勾稽（差额一键补平）
//  · 附件：单份 ≤50MB、每类 ≤5 份；DWG / DXF 仅「其他」类可传
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Banner, Btn, Card, Check, Collapse, EntityLink, Field, Modal, Money, Op, PageHead, Tag, Tip, useToast, pressProps,} from '../components/ui';
import { CUSTOMERS, PROJECT_TERMINAL, SUPPLIERS, canSeeMoney, fmt, TODAY } from '../components/data';
import type { Contract } from '../components/data';
import {
  addContract, consumePendingQuote, consumePendingRenew, getBizStatus, getContracts, getPendingContract,
  getProjects, getQuotes, patchContract, patchQuote, setBizStatus, setPendingContract, subscribeStore,
} from '../components/store';
import { Ico, StatusIco, type IconName } from '../components/icons';

/* ============================ 常量：来源 / 类型 / 路由 ============================ */
type Src = 'manual' | 'ocr' | 'std' | 'ent' | 'copy' | null;

const SRC_META: Record<string, { n: string; r: number[] }> = {
  manual: { n: '手工录入', r: [0, 3, 4, 5] },
  ocr: { n: 'OCR 识别', r: [0, 1, 2, 3, 4, 5] },
  std: { n: '标准模板', r: [0, 1, 3, 4, 5] },
  ent: { n: '企业模板', r: [0, 1, 3, 4, 5] },
  copy: { n: '复制历史合同', r: [0, 1, 3, 4, 5] },
};

/** 内部步号 0..5 → 步骤名。内部步号恒定（决定下方渲染哪块内容）；步骤条显示的序号另算 */
const STEP_NAMES = ['选择创建来源', '来源处理', 'OCR 校对', '合同主体与工期', '金额与收款', '条款与附件'];

const SRC_CARDS: { key: Src; ico: IconName; t: string; d: string; p: string }[] = [
  { key: 'manual', ico: 'edit', t: '手工录入', d: '空表单直入「合同主体与工期」，从零填写合同信息、明细与收款计划', p: '共 4 步' },
  { key: 'ocr', ico: 'camera', t: 'OCR 识别', d: '上传 PDF/JPG ≤50MB → 异步识别 ≤10s → 左图右字段校对', p: '共 6 步 · 含上传与 OCR 校对' },
  { key: 'std', ico: 'scroll', t: '标准模板', d: '全局模板 → 预览（内置风险条款标注）→ 变量替换 → 生成草稿', p: '共 5 步 · 含模板预览与变量替换' },
  { key: 'ent', ico: 'building', t: '企业模板', d: '先选客户 → 其专属模板 → 同标准模板（预览 + 变量替换）', p: '共 5 步 · 含企业模板预览' },
  { key: 'copy', ico: 'clipboard', t: '复制历史合同', d: '选择器（本客户优先 + 同类型）→ 差异预览 → 逐项确认带入', p: '共 5 步 · 含源合同差异确认' },
];

const TYPES = ['销售合同', '维护保养合同', '采购合同', '分包合同', '框架协议'];
const PREFIX: Record<string, string> = { 销售合同: 'HT', 维护保养合同: 'WB', 采购合同: 'CG', 分包合同: 'FK', 框架协议: 'KJ' };
const PNAME: Record<string, string> = {
  销售合同: '客户', 维护保养合同: '客户', 采购合同: '供应商', 分包合同: '分包商', 框架协议: '客户 / 供应商',
};
const CUS = CUSTOMERS.map((c) => `${c.id} ${c.name}`);
const SUP = SUPPLIERS.filter((s) => !s.blacklist).map((s) => `${s.id} ${s.name}`);
const PARTIES: Record<string, string[]> = {
  销售合同: CUS, 维护保养合同: CUS, 采购合同: SUP,
  分包合同: ['SUB-000007 云南××机电安装工程有限公司', 'SUB-000011 ××消防工程劳务有限公司'],
  框架协议: [CUS[0], SUP[0]],
};

/** 相对方下拉的选项值形如「KH20260312001 昆明万达广场商业管理有限公司」；
    上游（投标 / 报价 / 续签）只带客户名或客户 ID，这里统一归一，否则 select 值匹配不上会显示为空。 */
const partyOptOf = (raw: string): string => {
  if (!raw) return '';
  if (Object.values(PARTIES).flat().includes(raw)) return raw;
  const cust = CUSTOMERS.find((c) => c.id === raw || c.name === raw);
  if (cust) return `${cust.id} ${cust.name}`;
  const sup = SUPPLIERS.find((s) => s.id === raw || s.name === raw);
  if (sup) return `${sup.id} ${sup.name}`;
  return '';
};

/** 审批路由矩阵：阈值与或签 / 会签 */
const APPROVAL: Record<string, { max: number; nodes: [string, string?][] }[]> = {
  销售合同: [
    { max: 500000, nodes: [['部门负责人', '会签'], ['分管副总', '或签']] },
    { max: 2000000, nodes: [['部门负责人', '会签'], ['分管副总'], ['总经理']] },
    { max: Infinity, nodes: [['部门负责人', '会签'], ['分管副总'], ['总经理'], ['财务负责人', '会签']] },
  ],
  维护保养合同: [
    { max: 1000000, nodes: [['部门负责人', '会签'], ['分管副总', '或签']] },
    { max: Infinity, nodes: [['部门负责人', '会签'], ['分管副总'], ['总经理']] },
  ],
  采购合同: [
    { max: 300000, nodes: [['部门负责人', '会签'], ['分管副总', '或签']] },
    { max: 1000000, nodes: [['部门负责人', '会签'], ['分管副总']] },
    { max: Infinity, nodes: [['部门负责人', '会签'], ['分管副总'], ['总经理'], ['财务负责人', '会签']] },
  ],
  分包合同: [
    { max: 1000000, nodes: [['部门负责人', '会签'], ['分管副总'], ['法务', '会签']] },
    { max: Infinity, nodes: [['部门负责人', '会签'], ['分管副总'], ['总经理'], ['法务', '会签']] },
  ],
  框架协议: [{ max: Infinity, nodes: [['分管副总'], ['总经理'], ['法务', '会签']] }],
};
const TIER_LABELS: Record<string, string[]> = {
  销售合同: ['<50万', '50–200万', '≥200万'],
  维护保养合同: ['<100万', '≥100万'],
  采购合同: ['<30万', '30–100万', '≥100万'],
  分包合同: ['<100万', '≥100万'],
  框架协议: ['全额 · 战略'],
};
const getChain = (type: string, amt: number) => {
  const tiers = APPROVAL[type];
  let i = tiers.findIndex((t) => amt < t.max);
  if (i < 0) i = tiers.length - 1;
  return { label: TIER_LABELS[type][i], nodes: tiers[i].nodes };
};

/** 附件分类规则：单份 ≤50MB · 每类 ≤5 份 · DWG/DXF 仅「其他」类 */
const ATT_CATS: Record<string, string[]> = {
  合同扫描件: ['pdf', 'jpg', 'jpeg', 'png'],
  补充协议: ['pdf', 'jpg', 'jpeg', 'png'],
  报价单: ['pdf', 'jpg', 'jpeg', 'png', 'xlsx', 'xls'],
  图纸: ['pdf', 'jpg', 'jpeg', 'png'],
  其他: ['pdf', 'jpg', 'jpeg', 'png', 'dwg', 'dxf'],
};
const ATT_MAX = 5;

/** 六条款检查（硬拦截 · 缺失项拦截并定位） */
const SIX_CLAUSES = ['合同主体与签章', '标的与工程量清单', '合同价款与支付条件', '工期与交付节点', '质量与验收标准', '违约责任与争议解决'];

const TAGS = ['战略客户', '老客户复购', '政府项目', '垫资项目', '年度框架'];
const OWNERS = ['蓝峰', '周斌', '李强', '徐工'];
const INDUSTRIES = ['商业综合体', '医疗', '电力/制造', '化工', '地产', '文旅', '其他'];
const REGIONS = ['华北', '华东', '华南', '华中', '西南', '东北', '西北'];
const COSTS = ['工程成本', '服务成本', '外购成本', '管理费用', '其他'];
const BIZ_TYPES = ['消防改造', '维护保养服务', '消防检测', '咨询服务'];

type OcrField = { k: string; l: string; v: string; c: number };
const OCR_INIT: OcrField[] = [
  { k: 'name', l: '合同名称', v: '昆明万达广场消防改造工程补充合同', c: 96 },
  { k: 'party', l: '相对方', v: 'KH20260312001 昆明万达广场商业管理有限公司', c: 98 },
  { k: 'amt', l: '合同金额', v: '¥3,200,000.00', c: 85 },
  { k: 'sign', l: '签约日期', v: '2026-09-18', c: 93 },
  { k: 'plan', l: '工期起止', v: '2026-09-20 ~ 2027-03-31', c: 82 },
  { k: 'term', l: '付款条款', v: '签订后7日内支付30%预付款，竣工验收后支付60%，质保期满支付10%', c: 91 },
];

/** 可关联项目：排除已到终态（已结项 / 已关闭 / 作废）的项目 —— 数据源改为组件内读共享 store（见 projOpts） */

/** 复制历史：仅 已签约 / 履约中 / 已续签（可复用的在履行合同）；本客户优先 → 同类型 */
const HIST = [
  {
    id: 'HT000009', name: '昆明万达广场消防改造工程合同', type: '销售合同',
    party: 'KH20260312001 昆明万达广场商业管理有限公司', amt: 3200000, st: '履约中', tag: '本客户优先',
    term: '签订后7日内付30%预付款；竣工验收后付60%；质保期满付10%', sign: '2026-09-12', war: '24',
    dtl: [['消防改造', '2026-09-20', '2027-03-31', 3200000, '昆明万达广场消防改造']] as [string, string, string, number, string][],
    plan: [['预付款（签订后7日内）', 960000, '2026-09-19', false], ['进度款（竣工验收后）', 1920000, '2027-01-31', false], ['质保金（质保期满）', 320000, '2028-03-31', true]] as [string, number, string, boolean][],
  },
  {
    id: 'HT000005', name: '丽江景区智慧消防平台合同', type: '销售合同',
    party: '丽江××文旅开发集团', amt: 2400000, st: '已签约', tag: '同类型（销售）',
    term: '预付25%；平台上线验收后付75%', sign: '2026-08-18', war: '12',
    dtl: [['消防改造', '2026-09-01', '2027-01-31', 2400000, '丽江景区智慧消防平台']] as [string, string, string, number, string][],
    plan: [['预付款（签订后7日内）', 600000, '2026-08-25', false], ['验收款（平台上线）', 1800000, '2027-02-10', false]] as [string, number, string, boolean][],
  },
  {
    id: 'WB000003', name: '楚雄州人民医院消防维护保养合同（2027）', type: '维护保养合同',
    party: 'KH20250902004 楚雄州人民医院', amt: 960000, st: '履约中', tag: '同类型（维护保养）',
    term: '半年付 50% × 2', sign: '2026-09-01', war: '12',
    dtl: [['维护保养服务', '2026-09-01', '2027-08-31', 960000, '楚雄州人民医院年度维护保养']] as [string, string, string, number, string][],
    plan: [['上半年维护保养费', 480000, '2026-09-10', false], ['下半年维护保养费', 480000, '2027-03-10', false]] as [string, number, string, boolean][],
  },
];

/* ============================ 人民币大写 ============================ */
const DIG = '零壹贰叁肆伍陆柒捌玖';
function seg4(d: number): string {
  const U = ['', '拾', '佰', '仟'];
  let s = ''; let z = false;
  for (let i = 3; i >= 0; i--) {
    const v = Math.floor(d / 10 ** i) % 10;
    if (v) { s += (z && s ? '零' : '') + DIG[v] + U[i]; z = false; } else if (s) z = true;
  }
  return s;
}
function toCNY(n: number): string {
  const x = Math.round((+n || 0) * 100);
  if (!x) return '零元整';
  const y = Math.floor(x / 100); const j = Math.floor((x % 100) / 10); const f = x % 100 % 10;
  const g1 = Math.floor(y / 1e8); const g2 = Math.floor((y % 1e8) / 1e4); const g3 = y % 1e4;
  let s = '';
  if (g1) s += seg4(g1) + '亿';
  if (g2) s += (seg4(g2) ? seg4(g2) + '万' : (g1 && g3 ? '零' : ''));
  else if (g1 && g3) s += '零';
  if (g3) s += ((g2 && g3 < 1000) ? '零' : '') + seg4(g3);
  if (s) s += '元';
  if (!j && !f) s += '整';
  else { if (j) s += ((!s && y) ? '零' : '') + DIG[j] + '角'; if (f) s += DIG[f] + '分'; }
  return s;
}
const addMonths = (ds: string, m: number) => {
  if (!ds || !m) return '—';
  const d = new Date(ds); d.setMonth(d.getMonth() + m);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
/** 付款条款 → 期次拆解（识别百分比 + 分号分段） */
const parseTerm = (t: string) => {
  const pcts = [...t.matchAll(/(\d+(?:\.\d+)?)\s*%/g)].map((m) => +m[1]);
  const nodes = t.split(/[；;]/).map((s) => s.trim()).filter(Boolean);
  return pcts.map((p, i) => ({ node: nodes[i] || `第${i + 1}期`, pct: p, qual: /质保/.test(nodes[i] || '') }));
};

/* ============================ 类型 ============================ */
type Dtl = { t: string; s: string; e: string; a: number; r: string };
type Plan = { node: string; amt: number; date: string; qual: boolean };
type Att = { n: string; cat: string; sz: string; fix?: boolean };
type Err = [string, string];

/** 新建合同的空白表单基线（重置向导与首次进入共用同一份，避免两处口径漂移） */
const EMPTY_FORM = {
  name: '',
  type: '销售合同',
  proj: '',
  pjname: '',
  party: '',
  owner: '蓝峰',
  addr: '',
  amt: 0,
  tax: '9',
  taxOther: '',
  sign: TODAY,
  start: '',
  end: '',
  p1: '',
  p2: '',
  term: '',
  pbr: '', pbm: '', rat: '3', ratm: '24',
  war: '', multi: '', myears: 3, renew: '30',
  cost: '', ct: '', tel: '', ind: '', reg: '',
};

/* ============================ 页面 ============================ */
export default function ContractNewPage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();

  /* 共享 store 订阅：可关联项目 / 可导入报价单都读 store，新建的实体本页立即可见 */
  const [tick, setTick] = useState(0);
  useEffect(() => subscribeStore(() => setTick((n) => n + 1)), []);
  /** 可关联项目：排除已到终态（已结项 / 已关闭 / 作废）的项目 */
  const projOpts = useMemo(
    () => getProjects()
      .filter((p) => !(PROJECT_TERMINAL as readonly string[]).includes(p.status))
      .map((p) => ({ id: p.id, name: p.name, a04: p.id === 'XM000087' })),
    [tick, nav],
  );

  /* --- 来源外键：从报价 / 投标 / 续签转来的合同，落库时记录 quoteId / bidId / parentId，
         保证「合同 → 上游」可反查 --- */
  const [srcQuote, setSrcQuote] = useState<string | null>(null);
  const [srcBid, setSrcBid] = useState<string | null>(null);
  const [srcRenew, setSrcRenew] = useState<string | null>(null);

  /* --- 向导状态 --- */
  const [src, setSrc] = useState<Src>('manual');
  const [route, setRoute] = useState<number[]>([0, 3, 4, 5]);
  const [step, setStep] = useState(0);

  /* --- Step1 状态 --- */
  const [ocrRun, setOcrRun] = useState(false);
  const [ocrPct, setOcrPct] = useState(0);
  const [ocrDone, setOcrDone] = useState(false);
  const [tries, setTries] = useState(3);
  const [ocr, setOcr] = useState<OcrField[]>(OCR_INIT);
  const [hot, setHot] = useState('');
  const [entCust, setEntCust] = useState('');
  const [tplVars, setTplVars] = useState({ a: '', b: '诺盾博达消防科技有限公司', p: '', m: '' });
  const [copySel, setCopySel] = useState('');
  const [diff, setDiff] = useState<Record<string, boolean>>({
    name: true, type: true, party: true, amt: true, term: true, sign: false, war: true, dtl: true, plan: true,
  });

  /* --- Step3 字段 ---
     全部留空（除签约日期默认今天 · 质保金默认法定上限 3%）：修复前这里写死
     「昆明万达广场消防改造工程合同 / XM000123 / ¥3,200,000」，任何来源转合同都会
     生成同一份万达合同草稿，报价→合同、投标→合同两条支线在数据上完全无法区分。 */
  const [f, setF] = useState(EMPTY_FORM);
  /**
   * 投标中标 → 转合同：从投标页携带中标标的跳转过来时，预填合同关键字段，并记录 bidId 外键。
   * 原链路「中标 → 直接建项目」跳过合同环节，与「合同 → 项目」主线矛盾，此处补齐。
   */
  useEffect(() => {
    const p = getPendingContract();
    if (!p) return;
    setF((prev) => ({ ...prev, name: `${p.name} 合同`, party: partyOptOf(p.customer), amt: p.amt || prev.amt, pjname: p.name }));
    setSrcBid(p.bidId);
    setPmode('draft');
    setDtl([{ t: '消防工程', s: TODAY, e: '', a: p.amt || 0, r: p.name }]);
    toast(`已带入中标标的「${p.name}」· 中标金额 ¥${(p.amt || 0).toLocaleString('en-US')}；合同签署后可在项目台账生成项目`);
    setPendingContract(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav]);

  /**
   * 报价已审批 → 转合同：从报价台账 / 报价详情携带报价单跳转过来，带出客户、金额与逐行明细，
   * 并记录 quoteId 外键。消费式读取，避免下次独立进入合同新建页也误预填。
   */
  useEffect(() => {
    const pq = consumePendingQuote();
    if (!pq) return;
    const q = getQuotes().find((x) => x.id === pq.quoteId);
    if (!q) return;
    setSrcQuote(q.id);
    setF((prev) => ({
      ...prev,
      name: `${q.name} 合同`,
      party: partyOptOf(q.customerId || q.customer),
      amt: q.total || prev.amt,
      tax: String(q.taxRate),
    }));
    if (q.lines?.length) {
      setDtl(q.lines.map((l) => ({
        t: /维护|保养/.test(l.name) ? '维护保养服务' : /检测/.test(l.name) ? '消防检测' : '消防改造',
        s: TODAY,
        e: '',
        a: Math.round(l.price * l.qty * 100) / 100,
        r: `报价单 ${q.id} · ${l.name}`,
      })));
    }
    toast(`已带入报价单 ${q.id} 的客户 / 金额 / ${q.lines?.length ?? 0} 行明细；签约后可在项目台账生成项目`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav]);

  /**
   * 合同续签：从合同台账 / 详情点「续签」跳转过来，按源合同要素生成续签草稿，
   * 并记录 parentId 外键。修复前该入口只 toast 后裸跳，续签与原合同没有任何数据关联。
   */
  useEffect(() => {
    const pr = consumePendingRenew();
    if (!pr) return;
    const k = getContracts().find((x) => x.id === pr.contractId);
    if (!k) return;
    setSrcRenew(k.id);
    setF((prev) => ({
      ...prev,
      name: `${k.name.replace(/（续签[^）]*）$/, '')}（续签）`,
      type: k.type,
      party: partyOptOf(k.party),
      amt: k.amt,
      start: k.start,
      end: k.end,
      p1: k.start,
      p2: k.end,
      term: k.nodes ? `按原合同收款节点：${k.nodes}` : prev.term,
    }));
    setDtl([{
      t: /维护|保养/.test(k.name) ? '维护保养服务' : '消防改造',
      s: TODAY, e: '', a: k.amt, r: `续签自 ${k.id} ${k.name}`,
    }]);
    toast(`已按原合同 ${k.id} 生成续签草稿 · 请核对期限与金额后提交`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav]);

  const [pmode, setPmode] = useState<'exist' | 'draft' | 'none'>('exist');
  const [cal, setCal] = useState<'inc' | 'exc'>('inc');
  const [tags, setTags] = useState<string[]>([]);
  /* 明细 / 收款计划 / 附件默认空：由来源（报价导入 / OCR / 模板 / 复制历史）或人工录入填充，
     不再预置「万达广场消防改造」那一份演示数据，否则任意新建合同都自带同一组明细与附件。 */
  const [dtl, setDtl] = useState<Dtl[]>([]);
  const [plan, setPlan] = useState<Plan[]>([]);
  const [files, setFiles] = useState<Att[]>([]);
  const [more, setMore] = useState(false);
  /* --- 从报价单导入明细 --- */
  const [quoteImport, setQuoteImport] = useState(false);
  const [qKw, setQKw] = useState('');
  const [qStatus, setQStatus] = useState<string>('全部');
  const [qSel, setQSel] = useState<string[]>([]);
  const [attCat, setAttCat] = useState('合同扫描件');
  const [chk, setChk] = useState<string[]>(SIX_CLAUSES.slice(0, 5));

  /* --- 弹窗 / 结果 --- */
  const [confirm, setConfirm] = useState<{ title: string; body: React.ReactNode; ok: string; cb: () => void; danger?: boolean } | null>(null);
  const [okInfo, setOkInfo] = useState<{ no: string; line: React.ReactNode } | null>(null);
  const [force, setForce] = useState(false);

  const set = <K extends keyof typeof f>(k: K, v: typeof f[K]) => setF((p) => ({ ...p, [k]: v }));

  /* ---------- 派生 ---------- */
  const rate = f.tax === 'other' ? (parseFloat(f.taxOther) || 0) : +f.tax;
  const taxVal = !f.amt ? 0 : cal === 'inc' ? (f.amt * rate) / (100 + rate) : (f.amt * rate) / 100;
  const dtlSum = dtl.reduce((s, d) => s + (+d.a || 0), 0);
  const plnSum = plan.reduce((s, p) => s + (+p.amt || 0), 0);
  const gap = dtlSum - plnSum;
  const chain = getChain(f.type, f.amt);
  const proj = projOpts.find((p) => p.id === f.proj);

  /* ---------- 报价单导入候选（关键字 + 状态筛选） ----------
     仅「已审批 / 已转化」报价单可作为合同明细依据：未审批完成的报价金额还会变，导进来就是错的。
     状态筛选也只给这两种，避免出现点了必定空列表的选项。
     数据源与状态口径都走 store：修复前读 data.ts 常量 + q.status 原值，
     本次会话新建的报价单导不进来，且审批通过的报价单仍被显示为「待审批」而筛不出来。 */
  const qList = useMemo(() => getQuotes().filter((q) => {
    const s = getBizStatus(q.id, q.status);
    if (s !== '已审批' && s !== '已转化') return false;
    const kw = qKw.trim();
    if (kw && !`${q.id} ${q.name} ${q.customer}`.includes(kw)) return false;
    if (qStatus !== '全部' && s !== qStatus) return false;
    return true;
  }), [qKw, qStatus, tick, nav]);

  /* ---------- 校验（硬拦截） ---------- */
  const errors: Err[] = [];
  if (!f.name.trim()) errors.push(['name', '合同名称未填写']);
  if (pmode === 'exist' && !f.proj) errors.push(['proj', '关联项目未选择']);
  if (pmode === 'draft' && !f.pjname.trim()) errors.push(['proj', '草稿项目名称未填写']);
  if (!f.party) errors.push(['party', '相对方未选择（强校验）']);
  if (!(f.amt > 0)) errors.push(['amt', '合同金额未填写']);
  if (f.tax === 'other' && f.taxOther.trim() === '') errors.push(['tax', '税率（其他）未填写']);
  if (!f.sign) errors.push(['sign', '签约日期未选择']);
  else if (f.sign > TODAY) errors.push(['sign', '签约日期晚于今天（硬拦截）']);
  if (f.p1 && f.p2 && f.p2 < f.p1) errors.push(['p1', '工期止早于工期起（硬拦截）']);
  // T3 合规硬校验：《建设工程质量保证金管理办法》（建质〔2017〕138 号）第七条
  // —— 预留质量保证金比例不得高于工程价款结算总额的 3%（超出直接阻断提交）
  if (f.rat !== '' && +f.rat > 3) errors.push(['rat', `质量保证金比例 ${f.rat}% ＞ 3%：违反建质〔2017〕138 号「预留比例不得高于工程价款结算总额 3%」，不可提交`]);
  if (f.type === '销售合同' && !f.term.trim()) errors.push(['term', '付款条款未填写（销售类必填）']);
  else if (f.term.length > 2000) errors.push(['term', '付款条款超过 2000 字上限']);
  if (src === 'manual' && !files.some((x) => x.cat === '合同扫描件')) errors.push(['att', '手工录入需至少 1 份「合同扫描件」类附件']);
  if (chk.length < SIX_CLAUSES.length) errors.push(['clause', `六条款检查未通过：缺少「${SIX_CLAUSES.filter((c) => !chk.includes(c)).join('、')}」`]);
  const errOf = (k: string) => errors.find((e) => e[0] === k)?.[1];
  const showErr = (k: string) => (force ? errOf(k) : undefined);

  /* ---------- 软提醒（提交前确认） ---------- */
  const issues: Err[] = [];
  if (pmode === 'exist' && proj?.a04) issues.push(['proj', `${proj.id} ${proj.name} 存在未归并收支：提交时将被 A-04 硬拦截`]);
  if (pmode === 'draft' && f.pjname.trim()) issues.push(['proj', `草稿项目「${f.pjname.trim()}」签约后自动转「待启动」，请确认名称`]);
  if (f.amt > 0 && dtlSum > 0 && dtlSum !== f.amt) issues.push(['amt', `明细合计（自动汇总）≠ 合同金额：${fmt(dtlSum)} vs ${fmt(f.amt)}`]);
  if (dtlSum > 0 && plnSum !== dtlSum) issues.push(['plan', `收款合计 ≠ 明细合计（差 ${fmt(gap)}），可一键补平`]);
  if (+f.ratm > 24) issues.push(['rat', `缺陷责任期 ${f.ratm} 个月超过 24 个月：请确认资金占用与回收风险`]);
  if (f.multi === '是' && plan.length === 0) issues.push(['plan', '已选择多年期维护保养：收款计划为空，建议按服务年度生成']);
  if (src && src !== 'manual') issues.push(['name', `名称 / 相对方 / 金额等已由「${SRC_META[src].n}」带出，请确认`]);
  if (srcQuote) issues.push(['name', `本单由报价单 ${srcQuote} 转入，提交后将回写该报价单状态`]);
  if (srcBid) issues.push(['name', `本单由中标投标单 ${srcBid} 转入，中标依据将随合同存档`]);
  if (srcRenew) issues.push(['name', `本单为 ${srcRenew} 的续签合同，提交后原合同将标记「续签 → 新合同号」`]);

  const moreFilled = [
    !!f.term, !!f.pbr, !!f.pbm, !!f.war, !!f.rat, !!f.ratm, f.multi === '是', !!f.renew,
    !!f.cost, tags.length > 0, !!f.ct, !!f.tel, !!f.ind, !!f.reg,
  ].filter(Boolean).length;

  /* ---------- 导航 ---------- */
  /** 内容区滚动容器是 AppShell 的 .nc-page，window 本身不滚动，回到顶部须直接滚动该容器 */
  const scrollPageTop = () => document.querySelector('.nc-page')?.scrollTo({ top: 0 });
  const goStep = (n: number) => {
    setStep(n);
    if (n >= 3) setForce(true);
    scrollPageTop();
  };
  const advance = () => {
    if (step === 0) {
      if (!src) { toast('请先选择创建来源', 'err'); return; }
      goStep(src === 'manual' ? 3 : 1);
    } else if (step === 1) {
      if (src === 'ocr') { if (ocrDone) goStep(2); else toast('请先上传文件并完成识别', 'err'); }
      else if (src === 'copy') { if (copySel) applyCopy(); else toast('请先选择源合同', 'err'); }
      else draftFromTpl();
    } else if (step === 2) applyOcr();
    else if (step < 5) goStep(route[route.indexOf(step) + 1]);
    else submit();
  };
  const goBack = () => {
    const i = route.indexOf(step);
    goStep(route[Math.max(0, i - 1)]);
  };
  /* 按钮文案一律说「去哪一步的名字」，不写「第几步」——步骤条按来源重排后绝对步号会漂移 */
  const nextLabel = step === 0 ? (src ? `下一步：${STEP_NAMES[src === 'manual' ? 3 : 1]}` : '下一步')
    : step === 1 ? ({ ocr: '进入「OCR 校对」→', std: '生成草稿，进入「合同主体与工期」', ent: '生成草稿，进入「合同主体与工期」', copy: '确认带入，进入「合同主体与工期」' } as Record<string, string>)[src ?? ''] ?? '下一步'
      : step === 2 ? '确认结果，进入「合同主体与工期」' : step === 3 ? '下一步：金额与收款' : step === 4 ? '下一步：条款与附件' : '提交审批（分级快照）';

  const locate = (key: string) => {
    const el = document.getElementById(`fi-${key}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('is-flash');
    setTimeout(() => el.classList.remove('is-flash'), 1300);
  };
  const locateFirstErr = () => {
    if (errors.length) { locate(errors[0][0]); toast(`已定位：${errors[0][1]}`, 'err'); }
    else toast('校验通过');
  };

  /* ---------- Step1 · OCR ---------- */
  const runOcr = () => {
    if (ocrDone) return;
    setOcrRun(true); setOcrPct(0);
    let p = 0;
    const t = setInterval(() => {
      p += 20;
      setOcrPct(Math.min(p, 100));
      if (p >= 100) {
        clearInterval(t); setOcrRun(false); setOcrDone(true);
        toast('识别完成，低置信字段已标黄，请进入「OCR 校对」');
      }
    }, 380);
  };
  const reOcr = () => {
    if (tries <= 0) return;
    setTries(tries - 1);
    setOcr((p) => p.map((x) => ({ ...x, c: Math.min(97, x.c + 9) })));
    toast('重新识别完成，低置信字段已复核');
  };
  const applyOcr = () => {
    const g = (k: string) => ocr.find((x) => x.k === k)?.v ?? '';
    const amt = +g('amt').replace(/[^\d.]/g, '') || 0;
    set('name', g('name'));
    setF((p) => ({ ...p, party: g('party'), amt, sign: g('sign'), term: g('term') }));
    const pp = g('plan').split('~').map((s) => s.trim());
    setF((p) => ({ ...p, p1: pp[0] || '', p2: pp[1] || '' }));
    setFiles((p) => (p.some((x) => x.n === 'ht-scan-demo.pdf') ? p : [...p, { n: 'ht-scan-demo.pdf', cat: '合同扫描件', sz: '8.2MB' }]));
    if (amt) {
      const rows = parseTerm(g('term'));
      if (rows.length && rows.length <= 12) setPlan(rows.map((r) => ({ node: r.node, amt: Math.round((amt * r.pct) / 100), date: '', qual: r.qual })));
      setDtl([{ t: BIZ_TYPES[0], s: pp[0] || '', e: pp[1] || '', a: amt, r: 'OCR 识别带入' }]);
    }
    toast('OCR 结果已带入「合同主体与工期」（可继续修改）');
    goStep(3);
  };

  /* ---------- Step1 · 模板 ---------- */
  const draftFromTpl = () => {
    const v = tplVars;
    if (!v.a || !v.b || !v.p || !v.m) { toast('请先填写全部 4 项白名单变量', 'err'); return; }
    setF((p) => ({
      ...p, name: `${v.p}消防工程合同（模板草稿）`, party: v.a, amt: +v.m.replace(/[^\d.]/g, '') || p.amt,
    }));
    setFiles((p) => [...p, { n: `合同草稿_${src === 'std' ? '标准模板V2' : '企业模板'}.docx`, cat: '其他', sz: '0.3MB', fix: true }]);
    toast('草稿已生成，变量已同步至「合同主体与工期」对应字段');
    goStep(3);
  };

  /* ---------- Step1 · 复制历史 ---------- */
  const applyCopy = () => {
    const d = HIST.find((h) => h.id === copySel);
    if (!d) return;
    const on = (k: string) => diff[k];
    setF((p) => ({
      ...p,
      name: on('name') ? d.name : p.name,
      type: on('type') ? d.type : p.type,
      party: on('party') ? d.party : p.party,
      amt: on('amt') ? d.amt : p.amt,
      term: on('term') ? d.term : p.term,
      sign: on('sign') ? d.sign : p.sign,
      war: on('war') ? d.war : p.war,
    }));
    if (on('dtl')) setDtl(d.dtl.map((r) => ({ t: r[0], s: r[1], e: r[2], a: r[3], r: r[4] })));
    if (on('plan')) setPlan(d.plan.map((r) => ({ node: r[0], amt: r[1], date: r[2], qual: r[3] })));
    toast('已按勾选项带入「合同主体与工期」');
    goStep(3);
  };

  /* ---------- 明细 / 收款计划 ---------- */
  const addDtl = () => setDtl((p) => [...p, { t: BIZ_TYPES[0], s: '', e: '', a: 0, r: '' }]);
  const addPlan = () => {
    if (plan.length >= 12) { toast('收款计划最多 12 期', 'err'); return; }
    setPlan((p) => [...p, { node: '', amt: 0, date: '', qual: false }]);
  };

  /* ---------- 合同明细 · 从报价单导入（替代原「报价转化」来源卡片） ----------
     「报价转化」原为 Step0 的一个创建来源，但它只能由报价台账【转合同】触发、在本页点也点不动，
     属于「占位却不可用」的入口。改为在合同明细里按报价单勾选导入明细行：合同仍在同一入口创建，
     来源不再分裂。手动添加明细行保留为主入口。 */
  const openQuoteImport = () => { setQSel([]); setQKw(''); setQStatus('全部'); setQuoteImport(true); };
  /** 逐张报价单导入为一条合同明细：业务类型按报价名称推断，金额取报价总额，备注保留报价单号可追溯 */
  const importQuotes = () => {
    const chosen = qList.filter((q) => qSel.includes(q.id));
    if (!chosen.length) { toast('请先勾选要导入的报价单', 'err'); return; }
    /* M1 去重：同一张报价单重复导入会生成重复明细行，把明细合计抬高。
       以备注里的「报价单 <单号>」作为已导入标记，重复勾选时跳过并提示。 */
    const already = new Set(
      dtl.map((d) => (d.r.match(/^报价单 (\S+)/) || [])[1]).filter(Boolean),
    );
    const fresh = chosen.filter((q) => !already.has(q.id));
    if (!fresh.length) { toast('所选报价单已全部导入过，无需重复导入', 'err'); return; }
    const lines: Dtl[] = fresh.map((q) => ({
      t: /维护|保养/.test(q.name) ? '维护保养服务' : /检测/.test(q.name) ? '消防检测' : '消防改造',
      s: q.date || TODAY,
      e: '',
      a: q.total || 0,
      r: `报价单 ${q.id} ${q.name} 导入`,
    }));
    setDtl((p) => [...p, ...lines]);
    /* 单张导入时记录来源报价外键，合同提交后可在合同详情「来源报价」栏下钻 */
    if (fresh.length === 1) setSrcQuote(fresh[0].id);
    setQuoteImport(false);
    setQSel([]);
    setQKw('');
    setQStatus('全部');
    toast(`已从报价单导入 ${fresh.length} 行合同明细 · 合计 ${fmt(fresh.reduce((s, q) => s + q.total, 0))}${chosen.length > fresh.length ? `（跳过已导入 ${chosen.length - fresh.length} 张）` : ''}`);
  };
  const fillGap = () => {
    if (!gap) { toast('当前无差额需要补入'); return; }
    if (!plan.length) { setPlan([{ node: '尾款', amt: gap, date: '', qual: false }]); toast(`已将差额 ${fmt(gap)} 补入最后一期`); return; }
    setPlan((p) => p.map((r, i) => (i === p.length - 1 ? { ...r, amt: (+r.amt || 0) + gap } : r)));
    toast(`已将差额 ${fmt(gap)} 补入最后一期`);
  };
  const splitTerm = () => {
    const rows = parseTerm(f.term);
    if (!rows.length) { toast('未识别到比例。示例：签订后7日内付30%；竣工验收后付60%；质保期满付10%', 'err'); return; }
    if (rows.length > 12) { toast('拆解结果超过 12 期，请先合并收款节点', 'err'); return; }
    const base = dtlSum || f.amt || 0;
    setConfirm({
      title: '拆解期次预览（≤12 期）',
      ok: '确认写入收款计划',
      body: (
        <table className="nc-tbl is-cols" style={{ minWidth: 460 }}>
          <thead><tr><th style={{ width: '12%' }}>期数</th><th style={{ width: '36%' }}>收款节点</th><th style={{ width: '12%' }} className="is-num">比例</th><th style={{ width: '26%' }} className="is-num">金额（元）</th><th style={{ width: '14%' }} className="is-center">质保金</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}><td>第{i + 1}期</td><td>{r.node}</td><td className="is-num">{r.pct}%</td><td className="is-num">{fmt((base * r.pct) / 100)}</td><td className="is-center"><StatusIco kind={r.qual ? 'ok' : 'close'} /></td></tr>
            ))}
          </tbody>
        </table>
      ),
      cb: () => {
        setPlan(rows.map((r) => ({ node: r.node, amt: Math.round((base * r.pct) / 100), date: '', qual: r.qual })));
        toast(`已按条款拆解 ${rows.length} 期并写入收款计划`);
      },
    });
  };
  const genYearPlan = () => {
    if (!f.amt) { toast('请先填写合同金额', 'err'); return; }
    let n = Math.round(f.myears);
    if (n < 2 || n > 5) { n = Math.max(2, Math.min(5, n)); set('myears', n); toast('服务年限须在 2~5 年，已自动修正', 'err'); }
    const per = Math.floor(f.amt / n);
    setPlan(Array.from({ length: n }, (_, i) => ({
      node: `第${i + 1}服务年度维护保养费`, amt: i === n - 1 ? f.amt - per * (n - 1) : per, date: '', qual: false,
    })));
    toast(`已按 ${n} 个服务年度生成收款计划（尾期补差）`);
  };

  /* ---------- 附件 ---------- */
  const tryPush = (name: string, cat: string, mb: number): boolean => {
    const ext = (name.split('.').pop() || '').toLowerCase();
    if (mb > 50) { toast(`单份附件超过 50MB，已拦截：${name}（${mb.toFixed(1)}MB）`, 'err'); return false; }
    if (!ATT_CATS[cat].includes(ext)) {
      toast(/^(dwg|dxf)$/.test(ext)
        ? `DWG/DXF 仅可在「其他」类上传（${cat} 类仅收 PDF/JPG/PNG），如需上传 CAD 文件请切换分类为「其他」`
        : `「${cat}」类不支持 .${ext} 格式，已拦截：${name}`, 'err');
      return false;
    }
    if (files.filter((x) => x.cat === cat).length >= ATT_MAX) { toast(`「${cat}」类已达 ${ATT_MAX} 份上限`, 'err'); return false; }
    setFiles((p) => [...p, { n: name, cat, sz: `${mb.toFixed(1)}MB` }]);
    return true;
  };

  /* ---------- 提交 ---------- */
  const projLine = () => {
    if (pmode === 'exist') return `关联项目：${proj?.name ?? '—'}（A-04 检测通过）`;
    if (pmode === 'draft') return <>项目：新建草稿「{f.pjname.trim()}」→ <b>PRJ-DRAFT-001</b>（签约后自动转「待启动」）</>;
    return '项目：暂不关联（框架协议专用）';
  };
  const submit = () => {
    if (errors.length) { setForce(true); locateFirstErr(); toast(`存在 ${errors.length} 项待完善，请先处理`, 'err'); return; }
    if (pmode === 'exist' && proj?.a04) {
      setConfirm({
        title: ' A-04 硬拦截',
        danger: true,
        ok: '前往项目归并',
        body: (
          <>
            <Alert tone="danger" icon={<Ico n="ban" size={16} />} title={`关联项目 ${proj.id} ${proj.name} 存在未归并收支`} sub="暂不能提交合同。请先完成项目收支归并后再返回提交；或将关联项目切换为「新建草稿」。" />
            <div className="nc-ops" style={{ marginTop: 12 }}>
              <Op onClick={() => toast('演示：跳转 project?tab=收支归并')}>前往项目归并 →</Op>
              <Op onClick={() => { setPmode('draft'); setConfirm(null); toast('已切换为「新建草稿」，可继续提交'); }}>改为新建草稿</Op>
            </div>
          </>
        ),
        cb: () => toast('演示：跳转 project?proj=XM000087&tab=merge'),
      });
      return;
    }
    const no = `${PREFIX[f.type]}-2026-021`;
    setConfirm({
      title: '提交确认',
      ok: '确认提交',
      body: (
        <div className="nc-kv-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="nc-kv"><span className="nc-k">合同编号</span><span className="nc-v"><b>{no}</b>（提交时生成 · 不可改）</span></div>
          <div className="nc-kv"><span className="nc-k">合同金额</span><span className="nc-v"><b className="num"><Money v={f.amt} role={role} /></b>{canSeeMoney(role) && <> · 大写 {toCNY(f.amt)}</>}</span></div>
          <div className="nc-kv"><span className="nc-k">税额</span><span className="nc-v"><Money v={taxVal} role={role} />（{cal === 'inc' ? '含税' : '不含税'} {rate}% 口径）</span></div>
          <div className="nc-kv"><span className="nc-k">关联项目</span><span className="nc-v">{projLine()}</span></div>
          <div className="nc-kv"><span className="nc-k">审批路由</span><span className="nc-v"><b>{f.type} · {chain.label}</b> → {chain.nodes.map((n) => n[0] + (n[1] ? `(${n[1]})` : '')).join(' → ')}</span></div>
        </div>
      ),
      cb: () => {
        /* G1 跨页 Q17：原仅本地 setOkInfo，合同台账永远查不到新建合同。写入共享 store。
           同时落 quoteId / bidId 两个上游外键：合同详情与项目中心据此反查报价单 / 中标投标单，
           修复前这两个字段被读后丢弃，合同→上游的溯源链在数据层是断的。 */
        const newContract: Contract = {
          id: no, name: f.name.trim(), type: f.type, party: f.party,
          project: pmode === 'exist' ? f.proj : '',
          amt: f.amt, execAmt: f.amt, status: '待审批', recvPct: 0, recv: 0,
          owner: '当前用户', sign: f.sign, start: f.p1 || f.sign, end: f.p2 || f.sign,
          nodes: plan.map((r) => r.node).join(' · ') || '按明细收款计划',
          overdue: false, overpay: false,
          ...(srcQuote ? { quoteId: srcQuote } : {}),
          ...(srcBid ? { bidId: srcBid } : {}),
          ...(srcRenew ? { parentId: srcRenew } : {}),
        };
        addContract(newContract);
        /* 续签回写：源合同记 renewedTo = 新合同号，形成「原合同 ⇄ 续签合同」双向链。
           源合同状态不在此时改「已续签」—— 续签合同仍处待审批，签约后才算真正续上。 */
        if (srcRenew) patchContract(srcRenew, { renewedTo: no });
        /* 报价单转合同后置「已转化」（5 态机终态）。同步写 bizStatus 覆盖层，
           否则审批中心回写的「已审批」会把它盖回去，报价永远到不了终态。 */
        if (srcQuote) {
          patchQuote(srcQuote, { status: '已转化', update: TODAY });
          setBizStatus(srcQuote, '已转化');
        }
        setOkInfo({ no, line: projLine() });
        setConfirm(null);
        toast(`合同 ${no} 已提交审批 · 已回流合同台账（状态「待审批」）`);
        scrollPageTop();
      },
    });
  };

  const resetAll = () => {
    setSrc('manual'); setRoute([0, 3, 4, 5]); setStep(0);
    setOcrRun(false); setOcrPct(0); setOcrDone(false); setTries(3); setOcr(OCR_INIT); setHot('');
    setEntCust(''); setTplVars({ a: '', b: '诺盾博达消防科技有限公司', p: '', m: '' });
    setCopySel(''); setPmode('exist'); setCal('inc'); setMore(false); setForce(false);
    setChk(SIX_CLAUSES.slice(0, 5));
    setF(EMPTY_FORM); setTags([]); setDtl([]); setPlan([]); setFiles([]);
    setSrcQuote(null); setSrcBid(null); setSrcRenew(null); setOkInfo(null);
    toast('向导已重置');
  };
  const askReset = () => {
    setConfirm({
      title: '重置向导？', danger: true, ok: '仍要重置',
      body: <>已填写的内容将全部丢弃，确定重置？<div className="nc-conf-money">当前已填合同金额：<b className="num">{fmt(f.amt)}</b> · 大写 <b>{toCNY(f.amt)}</b></div></>,
      cb: resetAll,
    });
  };

  /* ---------- 渲染：步骤条 ---------- */
  const Sec = ({ id, children }: { id: string; children: React.ReactNode }) => <div id={`fi-${id}`} className="nc-anchor">{children}</div>;

  return (
    <div className="nc-wiz">
      <PageHead
        title="新建合同"
        badges={<><Tag tone="blue">五来源向导 · 共 {route.length} 步</Tag><Tag tone="gray">{src ? SRC_META[src].n : '未选择来源'}</Tag></>}
        sub="合同创建统一入口：手工录入 / OCR 识别 / 标准模板 / 企业模板 / 复制历史（合同明细支持从报价单导入）"
        actions={<Btn onClick={askReset}>重置向导</Btn>}
      />

      {/* ② 步骤条 —— 只列「当前来源实际会走的步」（route），并按显示顺序连续编号 Step1..StepN。
          手工录入不出「来源处理 / OCR 校对」这两个内容里没有的步，步骤条与下方内容一一对应。
          内部步号 i（0..5）不动，它决定下面渲染哪块内容；这里只改显示序号。 */}
      <div className="nc-steps">
        {route.map((i, idx) => {
          const st = step === i ? 'is-cur' : i < step ? 'is-done' : '';
          const done = st === 'is-done';
          const mark = done ? <Ico n="check" size={13} /> : idx + 1;
          /* 连接线只在「上一步真的走过」时点亮（route 升序，看前一个内部步号是否已被越过） */
          const lineOn = idx > 0 && route[idx - 1] < step;
          return (
            <div key={i} className={`nc-step ${st}${lineOn ? ' is-line' : ''}`} onClick={() => { if (done) goStep(i); }} {...pressProps(() => { if (done) goStep(i); })}>
              <span className="nc-step-dot">{mark}</span>
              <span className="nc-step-label">Step{idx + 1} · {STEP_NAMES[i]}</span>
            </div>
          );
        })}
      </div>

      {/* ④ 黄条确认区（软提醒 · 点击定位） */}
      {!!issues.length && (
        <div className="nc-istrip">
          <span><Ico n="warning" size={16} /> 提交前请确认：</span>
          {issues.map((i) => (
            <button key={i[0] + i[1]} type="button" className="nc-ichip" onClick={() => { if (i[0] === 'term' || i[0] === 'rat' || i[0] === 'plan' && f.multi === '是') setMore(true); locate(i[0]); }}>• {i[1]}</button>
          ))}
        </div>
      )}

      {/* ============ Step0 五来源卡片 ============ */}
      {step === 0 && (
        <Card>
          <div className="nc-src-grid">
            {SRC_CARDS.map((s) => (
              <button key={s.t} type="button" className={`nc-src-card${src === s.key ? ' is-on' : ''}`} title={s.d}
                onClick={() => {
                  setSrc(s.key); setRoute(SRC_META[s.key!].r);
                  if (s.key === 'manual') { toast('已选择「手工录入」，直入「合同主体与工期」'); goStep(3); } else goStep(1);
                }}>
                <div className="nc-src-ico"><Ico n={s.ico} size={22} /></div>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
                <p className="nc-src-path">路径：{s.p}</p>
              </button>
            ))}
          </div>
          <div className="nc-pgfoot" style={{ marginTop: 12 }}>
            选择来源后进入分叉：OCR → 上传 + 校对；模板 → 预览 + 变量；复制 → 差异 + 确认；手工 → 直入「合同主体与工期」。<b>创建方式选定后锁定只读；步骤条按所选来源重排，只列这条路径实际要走的步。</b>
          </div>
        </Card>
      )}

      {/* ============ Step1 来源处理 ============ */}
      {step === 1 && src === 'ocr' && (
        <Card hd="上传合同并识别">
          <Banner tone="info">支持 PDF / JPG / PNG ≤50MB；异步识别 ≤10s；<b>重新识别 ≤3 次</b>（按单据计次，在校对步骤操作）。</Banner>
          {!ocrRun && !ocrDone && (
            <div className="nc-dropzone" onClick={runOcr} {...pressProps(runOcr)}>
              <div style={{ fontSize: 26 }}><Ico n="upload" size={16} /></div>
              <p style={{ margin: '6px 0 2px' }}><b>点击或拖拽合同文件到此处</b></p>
              <div className="nc-cell-sub">演示文件：ht-scan-demo.pdf</div>
            </div>
          )}
          {(ocrRun || ocrDone) && (
            <>
              <ol className="nc-olist">
                {['文件上传完成', '版面分析与文字识别', '合同字段提取', '识别完成，回填表单'].map((s, i) => (
                  <li key={s} className={ocrPct >= (i + 1) * 25 ? 'is-on' : ''}>{s}</li>
                ))}
              </ol>
              <div className="nc-pbar"><i style={{ width: `${ocrPct}%` }} /></div>
              <div className="nc-ops" style={{ marginTop: 12 }}>
                <Btn kind="primary" disabled={!ocrDone} title={ocrDone ? undefined : '等待 OCR 识别完成（识别中请稍候）'} onClick={() => goStep(2)}>进入「OCR 校对」→</Btn>
                <Btn onClick={() => { setOcrDone(false); setOcrPct(0); }}>重新上传</Btn>
              </div>
            </>
          )}
        </Card>
      )}

      {step === 1 && (src === 'std' || src === 'ent') && (
        <Card hd={src === 'std' ? '选择标准模板' : '选择企业模板'}>
          {src === 'ent' && (
            <div className="nc-form-grid">
              <Field label="先选客户" req note="企业模板按客户授权隔离，仅展示该客户可见的专属模板">
                <select className="nc-input" value={entCust} onChange={(e) => setEntCust(e.target.value)}>
                  <option value="">请选择客户</option>
                  {CUSTOMERS.slice(0, 6).map((c) => <option key={c.id} value={c.id}>{c.id} {c.name}</option>)}
                </select>
              </Field>
              <Field label="选择模板" req>
                <select className="nc-input" disabled={!entCust}>
                  <option>{entCust ? `${entCust} 消防工程施工合同（企业模板）` : '请先选择客户'}</option>
                  {entCust && <option>{entCust} 维护保养服务合同（企业模板）V3</option>}
                </select>
              </Field>
            </div>
          )}
          {src === 'std' && (
            <div className="nc-form-grid">
              <Field label="选择模板" req span={2} note="来源：系统管理 → 模板库（标准 = 全局）">
                <select className="nc-input"><option>消防维护保养服务合同（标准模板）V2</option><option>消防工程施工合同（标准模板）V1</option></select>
              </Field>
            </div>
          )}
          <div className="nc-sec-title">合同预览（内置风险条款黄底标注）</div>
          <div className="nc-preview">
            <div className="nc-preview-hd">{src === 'std' ? '消防工程施工合同（标准模板）V1' : entCust ? '企业模板（客户专属）' : '请先选择客户并选择模板后预览'}</div>
            <div className="nc-preview-bd">
              <p><b>发包方：</b>{tplVars.a || <span className="nc-vm">{'{{发包方名称}}'}</span>}　<b>承包方：</b>{tplVars.b || <span className="nc-vm">{'{{承包方名称}}'}</span>}</p>
              <p>就 <span className="nc-vm">{tplVars.p || '{{项目名称}}'}</span> 消防工程事宜，合同金额人民币 <span className="nc-vm">{tplVars.m || '{{金额}}'}</span> 元，双方协商一致订立本合同。</p>
              <p className="is-warn"><Ico n="warning" size={16} /> <b>第八条 违期违约金：</b>每日按合同金额 0.5%。（内置风险条款标注）</p>
              <p><b>第十二条 质量保证金：</b>预留工程价款结算总额的 {f.rat || '3'}%（≤3%，依建质〔2017〕138 号），缺陷责任期 {f.ratm || '24'} 个月届满后 14 日内无息返还。</p>
              <p className="nc-cell-sub">……（其余条款略 · 风险条款黄底标注）</p>
            </div>
          </div>
          <div className="nc-sec-title">变量替换</div>
          <div className="nc-varbox">
            {([['a', '发包方名称'], ['b', '承包方名称'], ['p', '项目名称'], ['m', '金额']] as [keyof typeof tplVars, string][]).map(([k, t]) => (
              <div className="nc-varpair" key={k}>
                <span className="nc-vchip">{`{{${t}}}`}</span>
                <input className="nc-input" placeholder={k === 'm' ? '同步至「合同主体与工期」合同金额' : k === 'a' ? '同步至「合同主体与工期」相对方' : `请输入${t}`}
                  value={tplVars[k]} onChange={(e) => setTplVars((p) => ({ ...p, [k]: e.target.value }))} />
              </div>
            ))}
          </div>
          <div className="nc-cell-sub">白名单变量 4 项（与模板库白名单一致）</div>
        </Card>
      )}

      {step === 1 && src === 'copy' && (
        <Card hd="复制历史合同（差异预览 · 逐项确认带入）">
          <div className="nc-rcard-list">
            {HIST.map((h) => (
              <label key={h.id} className={`nc-rcard${copySel === h.id ? ' is-on' : ''}`}>
                <input type="radio" name="srcC" checked={copySel === h.id} onChange={() => setCopySel(h.id)} />
                <b><EntityLink target="contract" id={h.id} go={go} title="查看源合同详情">{h.id}</EntityLink></b> {h.name}
                <Tag tone={h.st === '已签约' ? 'green' : h.st === '履约中' ? 'blue' : 'gray'}>{h.st}</Tag>
                <Tag tone="gold">{h.tag}</Tag>
                <span className="nc-cell-sub"><Money v={h.amt} role={role} /> · {h.type}</span>
              </label>
            ))}
          </div>
          <div className="nc-cell-sub">仅可选 已签约 / 履约中 / 已续签；排序：本客户优先 → 同类型</div>
          {!copySel
            ? <div className="nc-empty-mini">选择源合同后展示差异预览</div>
            : (() => {
              const d = HIST.find((h) => h.id === copySel)!;
              const rows: [string, string, React.ReactNode][] = [
                ['name', '合同名称', d.name],
                ['type', '合同类型', d.type],
                ['party', '相对方', d.party],
                ['amt', '合同金额（元）', fmt(d.amt)],
                ['term', '付款条款', d.term],
                ['sign', '签约日期', d.sign],
                ['war', '质保期', `${d.war} 个月`],
                ['dtl', `合同明细（${d.dtl.length} 行）`, d.dtl.map((r) => `${r[0]}（${r[1]} ~ ${r[2]}）${fmt(r[3])}`).join('；')],
                ['plan', `收款计划（${d.plan.length} 期）`, d.plan.map((r, i) => `第${i + 1}期 ${r[0]} ${fmt(r[1])}${r[3] ? '（质保金节点）' : ''}`).join('；')],
              ];
              return (
                <>
                  <div className="nc-sec-title">差异预览（逐项确认带入）</div>
                  <table className="nc-tbl is-cols" style={{ minWidth: 640 }}>
                    <thead><tr><th style={{ width: '10%' }} className="is-center">带入</th><th style={{ width: '22%' }}>字段</th><th style={{ width: '68%' }}>源合同值</th></tr></thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r[0]}>
                          <td className="is-center"><input type="checkbox" checked={!!diff[r[0]]} onChange={(e) => setDiff((p) => ({ ...p, [r[0]]: e.target.checked }))} /></td>
                          <td>{r[1]}</td>
                          <td className="nc-cell-sub">{r[2]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="nc-cell-sub">未勾选项保持新建状态</div>
                </>
              );
            })()}
        </Card>
      )}

      {/* ============ Step2 OCR 校对（左图右字段） ============ */}
      {step === 2 && src === 'ocr' && (
        <Card hd="OCR 校对（左图右字段）" extra={<Btn size="sm" disabled={tries <= 0} title={tries > 0 ? `每日重新识别上限 3 次，剩余 ${tries} 次` : '重新识别次数已用完（每日上限 3 次），请人工校对'} onClick={reOcr}>重新识别（剩 {tries} 次）</Btn>}>
          <div className="nc-listhint">
            <span>校对说明<Tip w={360} text="置信度 <90% 黄底提示；点击右侧字段可高亮左侧识别框；重新识别 ≤3 次（按单据计次）。" /></span>
          </div>
          <div className="nc-ocr-grid">
            <div className="nc-ocr-scan">
              <div className="nc-ocr-scan-hd"><span>合同扫描件 · P1（模拟）</span><span>ht-scan-demo.pdf</span></div>
              <div className="nc-ocr-scan-bd">
                <div className="nc-ocr-sec">甲方（发包方）与工程概况</div>
                <div className="nc-ocr-row"><span className="nc-ocr-line" style={{ width: '62%' }} /></div>
                <div className="nc-ocr-row"><span className="nc-ocr-line" style={{ width: '40%' }} /></div>
                {ocr.map((x, i) => {
                  const low = x.c < 90;
                  return (
                    <React.Fragment key={x.k}>
                      {i === 2 && <div className="nc-ocr-sec">价款与履约约定</div>}
                      <div className="nc-ocr-row">
                        <div className={`nc-ocr-box${low ? ' is-low' : ''}${hot === x.k ? ' is-hot' : ''}`}
                          style={{ width: [70, 56, 46, 52, 64, 100][i] + '%' }}
                          onClick={() => setHot(x.k)} {...pressProps(() => setHot(x.k))}>
                          <span className="nc-ocr-line" />
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="nc-ocr-fields">
                {ocr.map((x) => {
                  const low = x.c < 90;
                  return (
                    <div key={x.k} className={`nc-ocr-field${low ? ' is-low' : ''}${hot === x.k ? ' is-hot' : ''}`} onClick={() => setHot(x.k)} {...pressProps(() => setHot(x.k))}>
                      <span className="nc-ocr-fl">{x.l}</span>
                      <Tag tone={low ? 'orange' : 'green'}>{low ? '低置信' : '置信'} {x.c}%</Tag>
                      <input className="nc-ocr-val" value={x.v} onChange={(e) => setOcr((p) => p.map((o) => (o.k === x.k ? { ...o, v: e.target.value } : o)))} />
                    </div>
                  );
                })}
              </div>
              <div className="nc-cell-sub" style={{ marginTop: 12 }}>确认后 OCR 值带入「合同主体与工期」（可继续修改）</div>
            </div>
          </div>
        </Card>
      )}

      {/* ============ Step3 合同主体与工期 ============ */}
      {step === 3 && (
        <>
          {/* 基本信息 */}
          <Card hd="基本信息">
            <div className="nc-form-grid">
              <Field label="合同编号" note={`前缀由合同类型决定，当前前缀：${PREFIX[f.type]}（提交时生成 · 不可改）`}>
                <input className="nc-input" disabled placeholder="提交时系统生成（HT/WB/CG/FK/KJ 前缀 · 不可改）" />
              </Field>
              <Field label="合同类型" req note="决定前缀 · 相对方控件 · 审批路由">
                <select className="nc-input" value={f.type} onChange={(e) => {
                  const t = e.target.value;
                  set('type', t);
                  if (t !== '框架协议' && pmode === 'none') { setPmode('exist'); toast('合同类型已切换，「暂不关联」仅框架协议可用，已回退为「选择已有」', 'err'); }
                  set('party', PARTIES[t][0] ?? '');
                }}>
                  {TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="合同名称" req span={2} err={showErr('name')}>
                <Sec id="name"><input className="nc-input" value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="请输入合同名称" /></Sec>
              </Field>
              <Field label="创建方式"><input className="nc-input" value={`${src ? SRC_META[src].n : '—'}（选择来源后锁定只读）`} readOnly /></Field>
              <Field label={`相对方（${PNAME[f.type]}）`} req err={showErr('party')} note={`${f.type} → ${PNAME[f.type]}选择器（强校验，校验后可新建${PNAME[f.type]}）`}>
                <Sec id="party">
                  <select className="nc-input" value={f.party} onChange={(e) => set('party', e.target.value)}>
                    <option value="">请选择{PNAME[f.type]}（强校验）</option>
                    {PARTIES[f.type].map((p) => <option key={p}>{p}</option>)}
                  </select>
                </Sec>
              </Field>
              <Field label="负责人">
                <select className="nc-input" value={f.owner} onChange={(e) => set('owner', e.target.value)}>
                  {OWNERS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="实施地点">
                <input className="nc-input" value={f.addr} onChange={(e) => set('addr', e.target.value)} placeholder="如：××中心大厦 B2 消防泵房" />
              </Field>
            </div>

            <div className="nc-sec-title">关联项目</div>
            <Sec id="proj">
              <div className="nc-form-grid">
                <Field label="关联方式" span={2} note="选择已有 = 挂到在办项目；新建草稿 = 签约后自动转「待启动」；暂不关联 = 仅框架协议可用">
                  <div className="nc-pair">
                    <button type="button" className={`nc-fchip${pmode === 'exist' ? ' is-on' : ''}`} onClick={() => setPmode('exist')}>选择已有</button>
                    <button type="button" className={`nc-fchip${pmode === 'draft' ? ' is-on' : ''}`} onClick={() => setPmode('draft')}>新建草稿</button>
                    <button type="button" className={`nc-fchip${pmode === 'none' ? ' is-on' : ''}`} onClick={() => {
                      if (f.type !== '框架协议') { toast('「暂不关联」仅框架协议可用：请先将合同类型切换为「框架协议」', 'err'); return; }
                      setPmode('none');
                    }}>暂不关联（仅框架）</button>
                  </div>
                </Field>
                {pmode === 'exist' && (
                  <Field label="关联项目" span={2} err={showErr('proj')}>
                    <select className="nc-input" value={f.proj} onChange={(e) => set('proj', e.target.value)}>
                      <option value="">请选择项目</option>
                      {projOpts.map((p) => <option key={p.id} value={p.id}>{p.id} {p.name}</option>)}
                    </select>
                    <div className="nc-field-note"><Ico n="bolt" size={16} />A-04：提交时检测所选项目是否存在未归并收支（演示：XM000087 产业园一期消防工程 将被硬拦截）</div>
                  </Field>
                )}
                {pmode === 'draft' && (
                  <Field label="草稿项目名称" span={2} err={showErr('proj')}>
                    <input className="nc-input" value={f.pjname} onChange={(e) => set('pjname', e.target.value)} placeholder="草稿项目名称，如：××医院消防维护保养（2027 年度）" />
                    <div className="nc-field-note">保存为 <b>PRJ-DRAFT-001</b>（草稿项目）；<b>合同签约后自动转「待启动」</b>；也可签约后在合同详情点「创建项目」以合同立项方式创建</div>
                  </Field>
                )}
                {pmode === 'none' && (
                  <Field label="关联项目" span={2} err={showErr('proj')}>
                    <Banner tone="info">本合同暂不关联项目（仅框架协议允许）。经营统计将归入「未关联」维度，后续可随时补挂项目。</Banner>
                  </Field>
                )}
              </div>
            </Sec>
          </Card>

          {/* 日期与工期 */}
          <Card hd="日期与工期">
            <div className="nc-form-grid">
              <Field label="签约日期" req err={showErr('sign')} note="≤ 今天（未来日期硬拦截）">
                <Sec id="sign"><input className="nc-input" type="date" max={TODAY} value={f.sign} onChange={(e) => set('sign', e.target.value)} /></Sec>
              </Field>
              <Field label="开工日期">
                <input className="nc-input" type="date" value={f.start} onChange={(e) => set('start', e.target.value)} />
              </Field>
              <Field label="到期日">
                <input className="nc-input" type="date" value={f.end} onChange={(e) => set('end', e.target.value)} />
              </Field>
              <Field label="工期起止" err={showErr('p1')} note="止 ≥ 起（硬拦截）；用于工期倒计时">
                <Sec id="p1">
                  <div className="nc-pair">
                    <input className="nc-input" type="date" value={f.p1} onChange={(e) => set('p1', e.target.value)} />
                    <span className="nc-pair-sep">~</span>
                    <input className="nc-input" type="date" value={f.p2} onChange={(e) => set('p2', e.target.value)} />
                  </div>
                </Sec>
              </Field>
            </div>
          </Card>
        </>
      )}

      {/* ============ Step4 金额与收款 ============ */}
      {step === 4 && (
        <>
          {/* 金额与税务 */}
          <Card hd="金额与税务">
            <div className="nc-form-grid">
              <Field label="合同金额（元）" req err={showErr('amt')} note="审批链随金额自动路由，见下方「审批链预览」卡片">
                <Sec id="amt"><input className="nc-input num" type="number" value={f.amt || ''} onChange={(e) => set('amt', +e.target.value || 0)} placeholder="如 3200000" /></Sec>
              </Field>
              <Field label="金额口径" req note={cal === 'inc' ? '含税口径：税额 = 总额 × 税率 ÷ (100 + 税率)' : '不含税口径：税额 = 总额 × 税率 ÷ 100'}>
                <div className="nc-pair">
                  <button type="button" className={`nc-fchip${cal === 'inc' ? ' is-on' : ''}`} onClick={() => setCal('inc')}>含税</button>
                  <button type="button" className={`nc-fchip${cal === 'exc' ? ' is-on' : ''}`} onClick={() => setCal('exc')}>不含税</button>
                </div>
              </Field>
              <Field label="税率" req err={showErr('tax')} note="「其他」支持 0~100、两位小数；超限自动截断并提示">
                <div className="nc-pair">
                  <select className="nc-input" style={{ maxWidth: 240 }} value={f.tax} onChange={(e) => set('tax', e.target.value)}>
                    <option value="9">9%（建筑业）</option>
                    <option value="13">13%（货物销售）</option>
                    <option value="6">6%（现代服务）</option>
                    <option value="3">3%（小规模/简易计征）</option>
                    <option value="other">其他（自定义）</option>
                  </select>
                  {f.tax === 'other' && (
                    <input className="nc-input num" style={{ maxWidth: 200 }} type="number" min={0} max={100} step={0.01} placeholder="0~100"
                      value={f.taxOther} onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        if (!Number.isNaN(v) && v > 100) { set('taxOther', '100'); toast('税率超出上限，已强制截断为 100', 'err'); return; }
                        if (!Number.isNaN(v) && v < 0) { set('taxOther', '0'); toast('税率不能为负，已强制截断为 0', 'err'); return; }
                        set('taxOther', e.target.value);
                      }} />
                  )}
                </div>
              </Field>
              <Field label="税额（自动汇总）">
                <input className="nc-input num" readOnly value={f.amt ? `${fmt(taxVal)}（${cal === 'inc' ? '含税' : '不含税'} ${rate}% 口径）` : '—'} />
              </Field>
            </div>
          </Card>

          {/* 审批链预览 */}
          <Card hd="审批链预览（按类型 × 金额自动路由）">
            <div className="nc-cell-sub" style={{ marginBottom: 8 }}>
              类型：<b>{f.type}</b> · 金额档：<b>{chain.label}</b> · 路由依据：合同类型 × 金额档审批矩阵
            </div>
            <div className="nc-chain2">
              <span className="nc-cnode is-done"><span className="nc-cdot"><Ico n="check" size={16} /></span><span className="nc-clbl">发起</span></span>
              {chain.nodes.map((n, i) => (
                <React.Fragment key={n[0] + i}>
                  <span className="nc-cline" />
                  <span className={`nc-cnode${i === 0 ? ' is-cur' : ''}`}>
                    <span className="nc-cdot">{i + 1}</span>
                    <span className="nc-clbl">{n[0]}{n[1] && <span className={`nc-mdg ${n[1] === '会签' ? 'm-hj' : 'm-hq'}`} title={n[1] === '会签' ? '会签：需该节点全部通过' : '或签：任一审批人通过即生效'}>{n[1]}</span>}</span>
                  </span>
                </React.Fragment>
              ))}
            </div>
            <div className="nc-cell-sub">或签 = 任一审批人通过即生效；会签 = 需该节点全部通过。路由矩阵由 getApprovalChain(类型, 金额) 统一计算，不允许全推高层。</div>
          </Card>

          {/* 合同明细 */}
          <Card hd="合同明细" extra={<Btn size="sm" onClick={openQuoteImport} title="按报价单勾选导入明细行（仅「已审批 / 已转化」报价单可导入）">从报价单导入</Btn>}>
            <table className="nc-tbl is-cols" style={{ minWidth: 800 }}>
              <thead>
                <tr>
                  <th style={{ width: '6%' }}>序号</th><th style={{ width: '13%' }}>业务类型</th>
                  <th style={{ width: '13%' }}>服务周期起</th><th style={{ width: '13%' }}>服务周期止</th>
                  <th style={{ width: '14%' }} className="is-num">金额（元）</th><th style={{ width: '35%' }}>备注</th><th style={{ width: '6%' }} className="is-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {dtl.map((d, i) => (
                  <tr key={i}>
                    <td className="nc-cell-sub">{i + 1}</td>
                    <td><select className="nc-cell-in" value={d.t} onChange={(e) => setDtl((p) => p.map((x, j) => (j === i ? { ...x, t: e.target.value } : x)))}>{BIZ_TYPES.map((t) => <option key={t}>{t}</option>)}</select></td>
                    <td><input className="nc-cell-in" type="date" value={d.s} onChange={(e) => setDtl((p) => p.map((x, j) => (j === i ? { ...x, s: e.target.value } : x)))} /></td>
                    <td><input className="nc-cell-in" type="date" value={d.e} onChange={(e) => setDtl((p) => p.map((x, j) => (j === i ? { ...x, e: e.target.value } : x)))} /></td>
                    <td><input className="nc-cell-in num is-right" type="number" value={d.a || ''} onChange={(e) => setDtl((p) => p.map((x, j) => (j === i ? { ...x, a: +e.target.value || 0 } : x)))} /></td>
                    <td><input className="nc-cell-in" value={d.r} placeholder="备注" onChange={(e) => setDtl((p) => p.map((x, j) => (j === i ? { ...x, r: e.target.value } : x)))} /></td>
                    <td className="is-center"><Op danger onClick={() => setDtl((p) => p.filter((_, j) => j !== i))}><Ico n="close" size={16} /></Op></td>
                  </tr>
                ))}
                {!dtl.length && <tr><td colSpan={7} className="nc-cell-sub is-center">暂无明细行</td></tr>}
              </tbody>
              <tfoot>
                <tr className="nc-tbl-sum">
                  <td colSpan={4} className="is-right"><b>明细合计（自动汇总）</b></td>
                  <td className="is-num"><b className="num"><Money v={dtlSum} role={role} /></b></td><td colSpan={2} />
                </tr>
              </tfoot>
            </table>
            <button type="button" className="nc-add-row" onClick={addDtl}>＋ 添加明细行</button>
          </Card>

          {/* 收款计划 */}
          <Card hd="收款计划（≤ 12 期）">
            <table className="nc-tbl is-cols" style={{ minWidth: 760 }}>
              <thead>
                <tr>
                  <th style={{ width: '7%' }}>期数</th><th style={{ width: '38%' }}>收款节点</th>
                  <th style={{ width: '17%' }} className="is-num">计划金额（元）</th>
                  <th style={{ width: '19%' }}>计划日期</th>
                  <th style={{ width: '12%' }} className="is-center">质保金节点</th>
                  <th style={{ width: '7%' }} className="is-center">操作</th>
                </tr>
              </thead>
              <tbody>
                {plan.map((p, i) => (
                  <tr key={i}>
                    <td className="nc-cell-sub">{i + 1}</td>
                    <td><input className="nc-cell-in" value={p.node} placeholder="收款节点，如：预付款" onChange={(e) => setPlan((q) => q.map((x, j) => (j === i ? { ...x, node: e.target.value } : x)))} /></td>
                    <td><input className="nc-cell-in num is-right" type="number" value={p.amt || ''} onChange={(e) => setPlan((q) => q.map((x, j) => (j === i ? { ...x, amt: +e.target.value || 0 } : x)))} /></td>
                    <td><input className="nc-cell-in" type="date" value={p.date} onChange={(e) => setPlan((q) => q.map((x, j) => (j === i ? { ...x, date: e.target.value } : x)))} /></td>
                    <td className="is-center"><input type="checkbox" checked={p.qual} onChange={(e) => setPlan((q) => q.map((x, j) => (j === i ? { ...x, qual: e.target.checked } : x)))} /></td>
                    <td className="is-center"><Op danger onClick={() => setPlan((q) => q.filter((_, j) => j !== i))}><Ico n="close" size={16} /></Op></td>
                  </tr>
                ))}
                {!plan.length && <tr><td colSpan={6} className="nc-cell-sub is-center">暂无收款期</td></tr>}
              </tbody>
              <tfoot>
                <tr className="nc-tbl-sum">
                  <td colSpan={2} className="is-right"><b>合计（自动汇总）</b></td>
                  <td className="is-num"><b className="num"><Money v={plnSum} role={role} /></b></td><td colSpan={3} />
                </tr>
                <tr className="nc-tbl-sum">
                  <td colSpan={2} className="is-right">差额（明细 − 收款）</td>
                  <td className="is-num"><b className="num" style={{ color: gap === 0 ? 'var(--c-success-deep)' : 'var(--c-warning-deep)' }}><Money v={gap} role={role} /></b></td>
                  <td colSpan={3}><Btn size="sm" onClick={fillGap}>一键补平（补入最后一期）</Btn></td>
                </tr>
              </tfoot>
            </table>
            <button type="button" className="nc-add-row" onClick={addPlan}>＋ 添加收款期</button>
          </Card>
        </>
      )}

      {/* ============ Step5 条款与附件 ============ */}
      {step === 5 && (
        <>
          {/* 更多信息（6 组 · 14 项） */}
          <Card>
            <Collapse title="更多信息" open={more} onToggle={() => setMore(!more)} badge={<Tag tone="blue">已填 {moreFilled}/14</Tag>}>
              <div className="nc-grp-t">① 付款条款</div>
              <div className="nc-form-grid">
                <Field label="付款条款" req span={2} err={showErr('term')}
                  extra={<span className="nc-label-extra"><Btn size="sm" onClick={splitTerm} title="按条款中的比例自动生成收款计划行，与明细合计勾稽">拆解为收款计划（≤ 12 期）</Btn></span>}
                  note={`${f.term.length} / 2000 · ${f.type === '销售合同' ? '销售类必填' : '选填'}`}>
                  <Sec id="term">
                    <textarea className="nc-input" rows={3} value={f.term} onChange={(e) => set('term', e.target.value)}
                      placeholder="试输：签订后7日内付30%预付款；竣工验收后付60%；质保期满付10%" />
                  </Sec>
                </Field>
              </div>

              <div className="nc-grp-t">② 履约保证金 / 质保金</div>
              <div className="nc-form-grid">
                <Field label="履约保证金">
                  <div className="nc-pair">
                    <input className="nc-input num" type="number" style={{ maxWidth: 140 }} placeholder="比例 0~100" value={f.pbr} onChange={(e) => set('pbr', e.target.value)} />
                    <span className="nc-pair-sep">%</span>
                    <input className="nc-input num" type="number" style={{ maxWidth: 130 }} placeholder="期限 1~36" value={f.pbm} onChange={(e) => set('pbm', e.target.value)} />
                    <span className="nc-pair-sep">月</span>
                  </div>
                </Field>
                <Sec id="rat">
                  <Field label="质量保证金" req err={showErr('rat')} note={+f.ratm > 24 ? `缺陷责任期 ${f.ratm} 个月：超过 24 个月，请确认资金占用与回收风险` : '法定上限 3%（建质〔2017〕138 号）· ＞3% 硬拦截 · 缺陷责任期建议 ≤24 个月'} warn={+f.ratm > 24}>
                    <div className="nc-pair">
                      <input className="nc-input num" type="number" style={{ maxWidth: 140 }} placeholder="比例 0~100" value={f.rat} onChange={(e) => set('rat', e.target.value)} />
                      <span className="nc-pair-sep">%</span>
                      <input className="nc-input num" type="number" style={{ maxWidth: 130 }} placeholder="1~36" value={f.ratm} onChange={(e) => set('ratm', e.target.value)} />
                      <span className="nc-pair-sep">月</span>
                    </div>
                  </Field>
                </Sec>
              </div>

              <div className="nc-grp-t">③ 质保 · 维护保养 · 续签</div>
              <div className="nc-form-grid">
                <Field label="质保期" note={`质保到期日：${addMonths(f.start || f.sign, +f.war)}（自动）`}>
                  <select className="nc-input" style={{ maxWidth: 220 }} value={f.war} onChange={(e) => set('war', e.target.value)}>
                    <option value="">请选择</option>{['3', '6', '12', '24'].map((v) => <option key={v} value={v}>{v} 个月</option>)}
                  </select>
                </Field>
                <Field label="维护保养多年期">
                  <select className="nc-input" style={{ maxWidth: 220 }} value={f.multi} onChange={(e) => set('multi', e.target.value)}>
                    <option value="">请选择</option><option>否</option><option>是</option>
                  </select>
                </Field>
                {f.multi === '是' && (
                  <Field label="服务年限" note="建议按服务年度生成收款计划（每年一期，尾期补差）">
                    <div className="nc-pair">
                      <input className="nc-input num" type="number" style={{ maxWidth: 110 }} min={2} max={5} value={f.myears} onChange={(e) => set('myears', +e.target.value || 3)} />
                      <span className="nc-pair-sep">年（2~5）</span>
                      <Btn size="sm" onClick={genYearPlan}>按服务年度生成收款计划</Btn>
                    </div>
                  </Field>
                )}
                <Field label="续签提醒" span={f.multi === '是' ? undefined : 2} note="写入续证 / 续签待办，临近二次提醒">
                  <select className="nc-input" style={{ maxWidth: 220 }} value={f.renew} onChange={(e) => set('renew', e.target.value)}>
                    <option value="">请选择</option>
                    {[['30', '到期前 30 天提醒'], ['60', '到期前 60 天提醒'], ['90', '到期前 90 天提醒']].map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                  </select>
                </Field>
              </div>

              <div className="nc-grp-t">④ 成本归类 · 业务标签</div>
              <div className="nc-form-grid">
                <Field label="成本归类" note="用于毛利分析的成本科目归集">
                  <select className="nc-input" style={{ maxWidth: 220 }} value={f.cost} onChange={(e) => set('cost', e.target.value)}>
                    <option value="">请选择</option>{COSTS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="业务标签" note="可多选，用于列表筛选与经营分析">
                  <div className="nc-pair">
                    {TAGS.map((t) => (
                      <button key={t} type="button" className={`nc-fchip${tags.includes(t) ? ' is-on' : ''}`}
                        onClick={() => setTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]))}>{t}</button>
                    ))}
                  </div>
                </Field>
              </div>

              <div className="nc-grp-t">⑤ 联系人</div>
              <div className="nc-form-grid">
                <Field label="发包方联系人">
                  <input className="nc-input" placeholder="档案带出 · 可改" value={f.ct} onChange={(e) => set('ct', e.target.value)} />
                </Field>
                <Field label="联系电话">
                  <input className="nc-input num" placeholder="档案带出 · 可改" value={f.tel} onChange={(e) => set('tel', e.target.value)} />
                </Field>
              </div>

              <div className="nc-grp-t">⑥ 行业 / 地区</div>
              <div className="nc-form-grid">
                <Field label="行业">
                  <select className="nc-input" style={{ maxWidth: 220 }} value={f.ind} onChange={(e) => set('ind', e.target.value)}>
                    <option value="">请选择</option>{INDUSTRIES.map((x) => <option key={x}>{x}</option>)}
                  </select>
                </Field>
                <Field label="地区">
                  <select className="nc-input" style={{ maxWidth: 220 }} value={f.reg} onChange={(e) => set('reg', e.target.value)}>
                    <option value="">请选择</option>{REGIONS.map((x) => <option key={x}>{x}</option>)}
                  </select>
                </Field>
              </div>
            </Collapse>
          </Card>

          {/* 六条款检查（硬拦截 · 缺失项拦截并定位） */}
          <Card hd="六条款检查（硬拦截 · 缺失项拦截并定位）">
            <Sec id="clause">
              <div className="nc-clause-list">
                {SIX_CLAUSES.map((c) => (
                  <Check key={c} checked={chk.includes(c)} onChange={(v) => setChk((p) => (v ? [...p, c] : p.filter((x) => x !== c)))} label={c} />
                ))}
              </div>
              {!!showErr('clause') && <div className="nc-field-err">{showErr('clause')}</div>}
              <div className="nc-cell-sub">六条款逐项确认后方可提交；未确认项将在提交时被拦截并定位到本卡片。</div>
            </Sec>
          </Card>

          {/* 附件分类 */}
          <Card hd="附件（分类上传 · 单份 ≤50MB · 每类 ≤5 份）">
            <div className="nc-att-bar">
              <select className="nc-input nc-att-cat" value={attCat} onChange={(e) => setAttCat(e.target.value)}>
                {Object.keys(ATT_CATS).map((c) => <option key={c}>{c}</option>)}
              </select>
              <Btn onClick={() => toast('演示：文件选择器（DWG/DXF 仅「其他」类可传）')}>＋ 选择本地文件</Btn>
              <select className="nc-input nc-att-demo" defaultValue="demo-contract.pdf|8.2">
                <option value="demo-contract.pdf|8.2">示例：合同扫描件.pdf · 8.2MB</option>
                <option value="demo-structure.dwg|12.6">示例：结构图.dwg · 12.6MB</option>
                <option value="demo-fireplan.dxf|9.8">示例：消防平面图.dxf · 9.8MB</option>
                <option value="demo-quote.xlsx|1.2">示例：报价明细.xlsx · 1.2MB</option>
                <option value="demo-huge.zip|60">示例：超大附件.zip · 60MB</option>
              </select>
              <Btn onClick={(e) => {
                const sel = (e.currentTarget.previousElementSibling as HTMLSelectElement | null)?.value ?? '';
                const [n, mb] = sel.split('|');
                if (tryPush(n, attCat, +mb)) toast(`已添加：${n}`);
              }}>模拟上传</Btn>
            </div>
            <div className="nc-dropzone is-mini">或将文件拖拽到此处（DWG/DXF 仅「其他」类可传）</div>
            <Sec id="att">
              <div className="nc-att-sum">
                <span className="nc-att-sum-lbl">分类计数</span>
                {Object.keys(ATT_CATS).map((c) => (
                  <span key={c} className="nc-att-cnt">{c} <b className="num">{files.filter((x) => x.cat === c).length}/{ATT_MAX}</b></span>
                ))}
                <span className="nc-att-cnt is-total">合计 <b className="num">{files.length}</b></span>
              </div>
              <div className="nc-att-list">
                {files.map((x, i) => (
                  <div key={i} className="nc-att-item">
                    <Tag tone="gray">{x.cat}</Tag>
                    <span className="nc-att-name" title={x.n}>{x.n}</span>
                    <span className="nc-att-size num">{x.sz}</span>
                    {!x.fix && <Op danger title="移除" onClick={() => setFiles((p) => p.filter((_, j) => j !== i))}><Ico n="close" size={16} /></Op>}
                  </div>
                ))}
                {!files.length && <div className="nc-att-empty">暂无附件</div>}
              </div>
              {!!showErr('att') && <div className="nc-field-err">{showErr('att')}</div>}
            </Sec>
          </Card>
        </>
      )}

      {/* ============ 提交成功 ============ */}
      {!!okInfo && (
        <Card>
          <div className="nc-done-box">
            <div className="nc-done-ico"><Ico n="check" size={16} /></div>
            <div className="nc-done-t">合同已提交审批</div>
            <div className="nc-done-sub">
              合同编号 <b>{okInfo.no}</b> ·「{f.name}」<br />
              金额 {fmt(f.amt)}（{toCNY(f.amt)}）<br />
              {okInfo.line}<br />
              创建方式：{src ? SRC_META[src].n : '—'} · 审批路由：{f.type} · {chain.label} → {chain.nodes.map((n) => n[0]).join(' → ')}
            </div>
            <div className="nc-cell-sub" style={{ marginTop: 8 }}>A-04 关联项目检测通过 · 审批分级快照已随单存档</div>
            <div className="nc-ops" style={{ justifyContent: 'center', marginTop: 16 }}>
              <Btn kind="primary" onClick={() => go('approval')}>查看审批进度</Btn>
              <Btn onClick={() => go('contract')}>返回合同列表</Btn>
            </div>
          </div>
        </Card>
      )}

      {/* ⑥ 底部规则行 */}
      <div className="nc-pgfoot">
        编号规则：HT 销售 / WB 维护保养 / CG 采购 / FK 分包 / KJ 框架（提交时生成 · 不可改）｜审批路由：合同类型 × 金额档矩阵（自动计算）｜OCR 重识别 ≤3 次｜附件：单份 ≤50MB · 每类 ≤5 份 · DWG/DXF 仅「其他」类｜A-04：提交时检测「选择已有」项目未归并收支（硬拦截）｜草稿项目 PRJ-DRAFT-xxx 签约后自动转「待启动」
      </div>

      {/* 吸底操作栏 */}
      {!okInfo && (
        <div className="nc-navbar">
          <button type="button" className={`nc-vpill ${errors.length ? 'is-bad' : 'is-ok'}`} onClick={locateFirstErr}>
            {errors.length ? `${errors.length} 项待完善` : ' 校验通过'}
          </button>
          <div className="nc-nav-acts">
            <Btn onClick={() => setConfirm({
              title: '放弃编辑？', danger: true, ok: '仍要取消',
              body: <>内容将全部丢弃，确定取消？<div className="nc-conf-money">当前已填合同金额：<b className="num">{fmt(f.amt)}</b></div></>,
              cb: () => { resetAll(); go('contract'); },
            })}>取消</Btn>
            <Btn disabled={step === 0} title={step === 0 ? '已在第一步，无上一步' : undefined} onClick={goBack}>← 上一步</Btn>
            <Btn onClick={() => toast('草稿已保存：HT-DRAFT-001')}>保存草稿</Btn>
            <Btn kind="primary" onClick={advance}>{nextLabel}</Btn>
          </div>
        </div>
      )}

      {/* 通用确认弹窗 */}
      <Modal
        open={!!confirm} onClose={() => setConfirm(null)} width={480}
        title={confirm?.title ?? ''}
        foot={<><Btn onClick={() => setConfirm(null)}>取消</Btn><Btn kind={confirm?.danger ? undefined : 'primary'} danger={!!confirm?.danger} onClick={() => { const c = confirm; setConfirm(null); c?.cb(); }}>{confirm?.ok ?? '确定'}</Btn></>}>
        {confirm?.body}
      </Modal>

      {/* 从报价单导入合同明细 */}
      <Modal
        open={quoteImport} onClose={() => setQuoteImport(false)} width={640}
        title="从报价单导入合同明细"
        foot={<><Btn onClick={() => setQuoteImport(false)}>取消</Btn><Btn kind="primary" disabled={!qSel.length} onClick={importQuotes}>导入选中（{qSel.length}）</Btn></>}>
        <div className="nc-form-grid" style={{ marginBottom: 10 }}>
          <Field label="关键字">
            <input className="nc-input" placeholder="报价单号 / 名称 / 客户" value={qKw} onChange={(e) => setQKw(e.target.value)} />
          </Field>
          <Field label="状态筛选">
            <div className="nc-pair">
              {/* 仅列可导入的两种状态，避免出现「点了必定空列表」的筛选 */}
              {['全部', '已审批', '已转化'].map((s) => (
                <button key={s} type="button" className={`nc-fchip${qStatus === s ? ' is-on' : ''}`} onClick={() => setQStatus(s)}>{s}</button>
              ))}
            </div>
          </Field>
        </div>
        <div className="nc-cell-sub" style={{ marginBottom: 6 }}>仅「已审批 / 已转化」报价单可导入；勾选后逐张导入为合同明细行（金额、备注可继续在下方编辑）。</div>
        <table className="nc-tbl is-cols" style={{ minWidth: 640 }}>
          <thead><tr><th style={{ width: '8%' }} className="is-center">选择</th><th style={{ width: '18%' }}>报价单号</th><th style={{ width: '17%' }}>客户</th><th style={{ width: '23%' }}>名称</th><th style={{ width: '20%' }} className="is-num">金额（元）</th><th style={{ width: '14%' }} className="is-center">状态</th></tr></thead>
          <tbody>
            {qList.map((q) => {
              const on = qSel.includes(q.id);
              return (
                <tr key={q.id} className={on ? 'is-on' : ''}>
                  <td className="is-center">
                    <input type="checkbox" checked={on} onChange={(e) => setQSel((p) => (e.target.checked ? [...p, q.id] : p.filter((x) => x !== q.id)))} />
                  </td>
                  <td className="nc-cell-sub">{q.id}</td>
                  <td>{q.customer}</td>
                  <td>{q.name}</td>
                  <td className="is-num"><Money v={q.total} role={role} /></td>
                  <td className="is-center"><Tag tone={q.status === '已审批' ? 'green' : 'blue'}>{q.status}</Tag></td>
                </tr>
              );
            })}
            {!qList.length && <tr><td colSpan={6} className="nc-cell-sub is-center">无匹配的报价单</td></tr>}
          </tbody>
        </table>
      </Modal>
    </div>
  );
}
