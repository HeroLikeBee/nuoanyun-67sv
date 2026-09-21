// 合同详情抽屉 —— 列表行点击后从右侧滑出（920px）
// 结构对齐参考「合同管理.html」抽屉：页头 / 基础信息（13 字段 · 编辑态）/ 5 张统计卡 / Tab / 主体 / 页脚
// ★ 合同文件页（Tab「文档」）= 基础信息 + 电子合同纸面正文 + AI 审查侧栏（零切换，三者同屏）
//   电子合同：条款正文按合同类型套用模板 → 变量插值；电子签章完成即「已签署」并生成签署栏 + 印章 + 防伪水印
//   AI 融入电子合同：AI 不再单独占 Tab，而是作为纸面右侧审查栏，与条款双向定位（角标 ↔ 风险项）
// 主子合同体系：主合同可下钻子合同（独立明细 · 收款计划 · 附件 · 日志），子合同可返回主合同
// 勾稽：合同总额 = Σ明细行；已收款 = Σ收款计划实收；质保金 = 结算总额 × 3% 上限；实收只来自回款登记
// 收款红字冲销一笔仅一次 · 付款超限硬拦截 · 政府 / 部队四件套
import React, { useEffect, useMemo, useState } from 'react';
import {
  Banner, Btn, ChainBar, Code, EntityLink, Field, KvGrid, Money, Modal, Op, OpSep, Progress, Tabs, Tag, Timeline, Tip, useToast, pressProps,} from './ui';
import { CONTRACTS, CUSTOMERS, PROJECTS, canSeeMoney, fmt, fmtWan, normContractStatus, TODAY } from './data';
import { Ico } from './icons';

type C = (typeof CONTRACTS)[number];

/**
 * 纯文本金额的脱敏格式化（A-02 口径）。
 * 说明：JSX 文本位统一用 <Money>，但模板字符串 / input.value / 字符串插值这类
 * 「必须要 string」的上下文无法塞组件，统一走这里，保证两种写法口径一致。
 */
const moneyTxt = (v: number, role: string, wan?: boolean) =>
  canSeeMoney(role) ? (wan ? fmtWan(v) : fmt(v)) : '—';

const PARTY_B = '诺盾博达消防科技有限公司';
/** 按主体名称反查客户档案（用于「相对方」穿透到客户详情） */
const custOf = (name: string) => CUSTOMERS.find((x) => x.name === name);
const ST_TONE: Record<string, 'gray' | 'blue' | 'green' | 'red' | 'orange'> = {
  草稿: 'gray', 待审批: 'orange', 审批中: 'blue', 已审批: 'blue', 已签约: 'green',
  履约中: 'green', 结算中: 'orange', 已结项: 'gray', 已完成: 'green',
};
const TYPE_TONE: Record<string, 'blue' | 'orange' | 'purple' | 'green'> = {
  销售合同: 'blue', 采购合同: 'orange', 框架协议: 'purple', 维护保养合同: 'green',
};
/** 参考：done / processing / part / pending 四态 pill */
const STYPE_TONE: Record<string, 'gray' | 'blue' | 'green' | 'orange'> = {
  done: 'green', processing: 'blue', part: 'orange', pending: 'gray',
};

/* ============================ 日期工具 ============================ */
function addDays(ds: string, n: number) {
  const d = new Date(`${ds}T00:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function addMonths(ds: string, m: number) {
  const d = new Date(`${ds}T00:00:00`);
  d.setMonth(d.getMonth() + Number(m));
  return d.toISOString().slice(0, 10);
}
function nowStamp() {
  const d = new Date();
  return `${TODAY} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/* ============================ 数据模型 ============================ */
type FileKey = 'quote' | 'safety' | 'award';
type FileItem = { name: string; by: string; date: string; size: string; type: string; color: string };
type FileGroups = Record<FileKey, FileItem[]>;
type DetailRow = { no: number; biz: string; period: string; amount: number; dir: string; remark: string };
type PlanRow = { no: number; node: string; plan: number; actual: number; status: string; stype: 'done' | 'part' | 'pending'; date: string };
type ProjRow = { code: string; name: string; owner: string; status: string; stype: string };
type LogRow = { time: string; warn?: boolean; text: React.ReactNode };
type CView = {
  code: string; name: string; status: string; stype: string; isSub: boolean;
  parentCode?: string; parentName?: string;
  total: number; spent: number;
  partyA: string; sign: string; end: string; start: string; warranty: number;
  place: string; owner: string; contact: string; phone: string; industry: string; region: string;
  details: DetailRow[]; plans: PlanRow[]; files: FileGroups; projects: ProjRow[]; logs: LogRow[];
};

const GROUPS: [FileKey, string][] = [['quote', '报价清单'], ['safety', '安全协议'], ['award', '中标通知书']];

/* ============================ 电子合同 · 条款模板（按合同类型套用） ============================ */
// 参考「合同管理.html」CLAUSES：四类合同各一套条款骨架，{{变量}} 由合同字段插值填充。
type ClauseTpl = { id: string; h: string; t: string };
const CLAUSES: Record<string, ClauseTpl[]> = {
  销售合同: [
    { id: 'c1', h: '第一条 工程范围', t: '乙方承接{{项目}}消防设施的设计、供货、安装、调试及配合验收工作，具体范围以本合同附件《工程范围清单》为准。' },
    { id: 'c2', h: '第二条 合同价款', t: '本合同总价款为人民币{{金额}}（含税，税率{{税率}}%），除本合同约定的变更情形外不作调整。' },
    { id: 'c3', h: '第三条 付款方式', t: '甲方按以下约定支付：{{付款条款}}。每期款项于条件达成后 14 个工作日内支付。' },
    { id: 'c4', h: '第四条 工期', t: '工期自{{工期起}}起至{{工期止}}止。因甲方原因延误的，工期相应顺延；因乙方原因延误的，每逾期一日按合同总价的 0.5‰ 支付违约金，上限为合同总价的 5%。' },
    { id: 'c5', h: '第五条 质量与验收', t: '工程质量须符合国家现行消防技术规范。验收以消防主管部门验收 / 备案为准。质保期{{质保期}}，质保金为合同总价的{{质保金比例}}，质保期满无质量问题后 14 个工作日内无息退还。' },
    { id: 'c6', h: '第六条 违约责任', t: '任何一方违约的，应向守约方支付合同总价 30% 的违约金；违约金不足以弥补损失的，守约方有权另行追偿。' },
    { id: 'c7', h: '第七条 争议解决', t: '因本合同发生争议，双方协商解决；协商不成的，提交项目所在地有管辖权的人民法院诉讼解决。' },
  ],
  采购合同: [
    { id: 'c1', h: '第一条 采购范围', t: '甲方向乙方采购{{项目}}所需消防设备材料，明细以附件《供货清单》为准。' },
    { id: 'c2', h: '第二条 合同价款', t: '本合同总价款为人民币{{金额}}（含税{{税率}}%），包含货款、包装、运输至甲方指定工地费用。' },
    { id: 'c3', h: '第三条 付款方式', t: '{{付款条款}}。乙方开具等额增值税专用发票后付款。' },
    { id: 'c4', h: '第四条 交付', t: '于{{工期止}}前送达甲方指定地点，乙方逾期交付的，每逾期一日按未交付部分货款的 1‰ 支付违约金。' },
    { id: 'c5', h: '第五条 质量与质保', t: '设备须为全新合格产品，质保期{{质保期}}。' },
    { id: 'c6', h: '第六条 违约责任', t: '任何一方违约的，违约金为合同总价 30%。' },
    { id: 'c7', h: '第七条 争议解决', t: '提交项目所在地有管辖权的人民法院诉讼。' },
  ],
  维护保养合同: [
    { id: 'c1', h: '第一条 服务范围', t: '乙方对{{项目}}的消防设施提供{{频次}}维保服务，含巡检、测试、保养及一般故障排除。' },
    { id: 'c2', h: '第二条 服务费用', t: '年度服务费人民币{{金额}}（含税{{税率}}%）。' },
    { id: 'c3', h: '第三条 付款方式', t: '{{付款条款}}' },
    { id: 'c4', h: '第四条 服务期限', t: '自{{工期起}}至{{工期止}}。' },
    { id: 'c5', h: '第五条 响应时效', t: '乙方接报修后 4 小时内响应，24 小时内到场处理；未按时到场的，每次扣减服务费 500 元。' },
    { id: 'c6', h: '第六条 违约责任', t: '任何一方违约的，违约金为年度服务费 20%。' },
    { id: 'c7', h: '第七条 争议解决', t: '提交项目所在地有管辖权的人民法院诉讼。' },
  ],
  框架协议: [
    { id: 'c1', h: '第一条 合作方式', t: '甲方委托乙方提供消防技术服务，具体需求以本框架协议项下子合同形式另行确认。' },
    { id: 'c2', h: '第二条 额度', t: '协议期内服务费用总额不超过人民币{{金额}}，超出部分另行签订补充协议。' },
    { id: 'c3', h: '第三条 子合同', t: '子合同以本协议为依据签订（编号冠以本协议号），无需重复分级审批；单笔子合同金额 ≥50 万元的，须提交财务复核。' },
    { id: 'c4', h: '第四条 协议期', t: '自{{工期起}}至{{工期止}}。' },
    { id: 'c5', h: '第五条 违约责任', t: '任何一方违约的，违约金为已发生服务费的 20%。' },
    { id: 'c6', h: '第六条 争议解决', t: '提交项目所在地有管辖权的人民法院诉讼。' },
  ],
};

type Clause = ClauseTpl & { dirty?: boolean };
/** 条款正文：模板 → 变量插值 */
function buildClauses(v: CView, type: string, tax: number, freq: string, warranty: number, role: string): Clause[] {
  const tpl = CLAUSES[type] || CLAUSES['销售合同'];
  return tpl.map((x) => ({
    id: x.id, h: x.h,
    t: x.t
      .replace('{{项目}}', v.projects[0]?.name ?? v.name)
      .replace('{{金额}}', moneyTxt(v.total, role))
      .replace('{{税率}}', String(tax))
      .replace('{{付款条款}}', '首期款 30%、进度款 40%、尾款 27%、质保金 3%')
      .replace('{{工期起}}', v.start)
      .replace('{{工期止}}', v.end)
      .replace('{{质保期}}', `${warranty} 个月`)
      .replace('{{质保金比例}}', `${RETENTION_PCT}%`)
      .replace('{{频次}}', freq),
  }));
}

/* ============================ AI 审查风险项（融入电子合同，不再独立成 Tab） ============================ */
type AiRisk = { id: string; level: '高' | '中' | '低'; dim: string; quote: string; sug: string; clauseId: string; st: '待确认' | '已确认' | '已忽略' };
/** 规则式审查：命中即标注，与参考 HTML 的 mAI 同口径 */
function scanClauses(clauses: Clause[]): AiRisk[] {
  const out: AiRisk[] = [];
  clauses.forEach((cl) => {
    const push = (level: AiRisk['level'], dim: string, sug: string) =>
      out.push({ id: `ai-${cl.id}-${dim}`, level, dim, quote: `${cl.t.slice(0, 44)}…`, sug, clauseId: cl.id, st: '待确认' });
    if (/30% 的违约金|违约金为合同总价 30%|服务费 20%/.test(cl.t)) push('高', '违约责任', '违约金比例显著偏高，建议设置上限（如 ≤10%）或改为按实际损失计算。');
    else if (/个工作日/.test(cl.t)) push('中', '付款条款风险', '「工作日」未定义节假日顺延口径，建议明确顺延规则。');
    else if (/所在地有管辖权的人民法院/.test(cl.t)) push('低', '争议解决', '与标准模板（提交仲裁委）不一致，请法务复核。');
    else if (/1‰ 支付违约金/.test(cl.t)) push('低', '工期风险', '日违约金 1‰ 无累计上限，建议增设封顶条款。');
  });
  return out;
}

/** 合同明细模板（权重合计 = 1，末行兜底差额，保证 Σ明细 = 合同总额） */
const DETAIL_TPL: [string, string, string][] = [
  ['火灾自动报警系统（含探测器 860 只）', '消防电', '含报警主机 2 台、回路板 24 块'],
  ['自动喷淋灭火系统（喷洒头 1240 个）', '消防水', '含湿式报警阀组 6 套'],
  ['防排烟系统（风机 8 台 + 阀 42 个）', '防排烟', '含风机控制箱 8 台'],
  ['消防设施改造配套土建', '土建配合', '含开孔、封堵、面层恢复'],
  ['消防检测与验收辅导', '服务费', '含年度检测报告出具'],
];
const DETAIL_W = [0.39, 0.26, 0.19, 0.085, 0.075];

function buildDetails(total: number, period: string): DetailRow[] {
  let acc = 0;
  return DETAIL_TPL.map(([biz, , remark], i) => {
    const amount = i === DETAIL_TPL.length - 1 ? total - acc : Math.round(total * DETAIL_W[i]);
    acc += amount;
    return { no: i + 1, biz, period, amount, dir: '收入', remark };
  });
}

const PLAN_TPL: [string, number][] = [
  ['首期款（合同签订后 7 日内）', 30],
  ['中期款（进度 / 半年度验收）', 40],
  ['尾款（竣工验收合格）', 27],
  ['质保金（质保期满结清）', 3],
];
/** 收款计划：计划额按 30/40/27/3（末期兜底差额，质保金封顶法定 3%）；实收按已收总额逐期填充 → 出现「部分收款」态 */
function buildPlans(total: number, recv: number, sign: string, end: string): PlanRow[] {
  const dues = [addDays(sign, 7), addDays(end, -90), end, addMonths(end, 12)];
  const plans = PLAN_TPL.map(([, pct]) => Math.round(total * pct / 100));
  plans[3] = total - plans[0] - plans[1] - plans[2];
  let left = recv;
  const actuals = plans.map((p) => { const a = Math.max(0, Math.min(p, left)); left -= a; return a; });
  return PLAN_TPL.map(([node], i) => {
    const a = actuals[i];
    const stype: PlanRow['stype'] = a === 0 ? 'pending' : a < plans[i] ? 'part' : 'done';
    return {
      no: i + 1, node, plan: plans[i], actual: a, stype, date: dues[i],
      status: stype === 'done' ? '已收款' : stype === 'part' ? '部分收款' : '待收款',
    };
  });
}

function guessIndustry(c: C) {
  if (c.party.includes('医院')) return '医疗';
  if (c.party.includes('钢铁')) return '工业';
  if (c.party.includes('景区') || c.party.includes('文旅')) return '文旅';
  if (c.party.includes('产业园') || c.party.includes('园区')) return '工业园区';
  return '商业综合体';
}
function guessRegion(c: C) {
  return c.party.includes('柳州') || c.party.includes('广西') ? '华南' : '西南';
}

/** 质保金上限比例（《建设工程质量保证金管理办法》第七条：不得高于结算总额 3%） */
const RETENTION_PCT = 3;

/** 合同税率口径（与「系统设置 · 税率与开票口径」一致）：工程 9% / 服务 6% / 货物 13% */
function taxOf(type: string) {
  if (type === '采购合同') return 13;
  if (type === '维护保养合同') return 6;
  return 9;
}
/** 维保频次：从收款节点描述推断，默认月检 */
function freqOf(c: C) {
  if (c.type !== '维护保养合同') return '按需';
  if (c.nodes.includes('季')) return '季检';
  if (c.nodes.includes('半年')) return '半年检';
  if (c.nodes.includes('月')) return '月检';
  return '月检';
}

function buildFiles(c: C, subSuffix?: string): FileGroups {
  const tag = subSuffix ? `（${subSuffix}）` : '';
  return {
    quote: [{ name: `${c.name}${tag}-报价清单.xlsx`, by: c.owner, date: c.sign, size: '186 KB', type: 'XLS', color: '#69b1ff' }],
    safety: [{ name: `施工安全管理协议-签字版${tag}.pdf`, by: c.owner, date: c.sign, size: '1.2 MB', type: 'PDF', color: '#ff7875' }],
    award: c.project ? [{ name: `中标通知书-${c.party}${tag}.pdf`, by: '系统', date: c.sign, size: '540 KB', type: 'PDF', color: '#ff7875' }] : [],
  };
}

function buildMain(c: C, role: string): CView {
  const period = `${c.start} ~ ${c.end}`;
  const proj = PROJECTS.find((p) => p.id === c.project);
  return {
    code: c.id, name: c.name, status: c.status, stype: c.status === '已结项' ? 'done' : 'processing', isSub: false,
    total: c.execAmt, spent: Math.round(c.execAmt * 0.14),
    partyA: c.party, sign: c.sign, start: c.start, end: c.end, warranty: 12,
    place: c.project ? '按项目现场实施地点执行' : '按子合同约定地点执行',
    owner: c.owner, contact: '王芳', phone: '138-0000-8888',
    industry: guessIndustry(c), region: guessRegion(c),
    details: buildDetails(c.execAmt, period),
    plans: buildPlans(c.execAmt, c.recv, c.sign, c.end),
    files: buildFiles(c),
    projects: c.project ? [{ code: c.project, name: proj ? proj.name : c.project, owner: c.owner, status: '进行中', stype: 'processing' }] : [],
    logs: [
      { time: `${c.sign} 14:32`, text: <><b>{c.owner}</b> 创建合同 <b>{c.id}</b>，签约金额 <Money v={c.amt || c.execAmt} role={role} /></> },
      { time: `${c.sign} 15:30`, text: <>合同状态变更为 <Tag tone="blue">履约中</Tag></> },
      { time: `${c.start} 09:00`, warn: true, text: <>期1款 <b><Money v={Math.round(c.execAmt * 0.3)} role={role} /></b> 到账，收款进度 {c.recvPct}%</> },
      { time: '2026-09-22 16:20', text: <><b>{c.owner}</b> 上传附件「施工安全管理协议-签字版.pdf」</> },
    ],
  };
}

/** 子合同：主合同按工作量拆分，合计约占总额 65%，余款由主合同直接执行 */
function buildSubs(c: C, role: string): CView[] {
  if (c.type === '采购合同') return [];
  const defs: { suf: string; sname: string; type: string; pct: number; status: string; stype: string; owner: string }[] = [
    { suf: '-01', sname: '一期主体', type: c.type === '框架协议' ? '维护保养' : '消防工程', pct: 0.5, status: '履约中', stype: 'processing', owner: c.owner },
    { suf: '-02', sname: '二期 / 检测', type: '检测', pct: 0.15, status: '已完成', stype: 'done', owner: '王磊' },
  ];
  return defs.map((d) => {
    const total = Math.round(c.execAmt * d.pct);
    const recv = Math.round(total * (d.stype === 'done' ? 1 : 0.62));
    const start = d.stype === 'done' ? addDays(c.start, 20) : c.start;
    const end = d.stype === 'done' ? addDays(c.end, -60) : c.end;
    return {
      code: `${c.id}${d.suf}`, name: `${c.name}（${d.sname}）`, status: d.status, stype: d.stype, isSub: true,
      parentCode: c.id, parentName: c.name,
      total, spent: Math.round(total * 0.14),
      partyA: c.party, sign: c.sign, start, end, warranty: 12,
      place: c.party, owner: d.owner, contact: '王芳', phone: '138-0000-8888',
      industry: guessIndustry(c), region: guessRegion(c),
      details: [{ no: 1, biz: `${d.type}服务`, period: `${start} ~ ${end}`, amount: total, dir: '收入', remark: d.stype === 'done' ? '已交付并验收通过' : '按主合同拆分执行' }],
      plans: buildPlans(total, recv, c.sign, end),
      files: {
        quote: [{ name: `${d.sname}分项报价.xlsx`, by: d.owner, date: c.sign, size: '92 KB', type: 'XLS', color: '#69b1ff' }],
        safety: d.stype === 'done' ? [] : [{ name: `${d.sname}安全交底记录.pdf`, by: d.owner, date: start, size: '800 KB', type: 'PDF', color: '#ff7875' }],
        award: [],
      },
      projects: c.project
        ? [{ code: `${c.project}${d.suf.replace('-', '')}`, name: `${c.name}（${d.sname}）项目`, owner: d.owner, status: d.status === '已完成' ? '已完成' : '进行中', stype: d.stype }]
        : [],
      logs: [
        { time: `${c.sign} 15:12`, text: <><b>{c.owner}</b> 创建子合同（拆分自主合同 <b>{c.id}</b>），金额 <Money v={total} role={role} /></> },
        { time: `${start} 09:00`, warn: true, text: <>期1款 <b><Money v={Math.round(total * 0.3)} role={role} /></b> 到账</> },
        ...(d.stype === 'done' ? [{ time: `${end} 16:40`, text: <><b>{d.owner}</b> 交付《{d.type}报告》，状态变更为 <Tag tone="green">已完成</Tag></> }] : []),
      ],
    };
  });
}

/* ============================ 基础信息 13 字段 ============================ */
type FieldDef = {
  k: string; label: string; type: 'input' | 'date' | 'warranty' | 'ref' | 'chip';
  span?: 2; anchor?: boolean; optional?: boolean; num?: boolean; blue?: boolean;
};
const FIELDS: FieldDef[] = [
  { k: 'name', label: '合同名称', type: 'input', span: 2 },
  { k: 'partyA', label: '发包方', type: 'input' },
  { k: 'partyB', label: '承包方', type: 'input' },
  { k: 'signDate', label: '签约日期', type: 'date', anchor: true },
  { k: 'endDate', label: '到期日', type: 'date', anchor: true },
  { k: 'startDate', label: '开工日期', type: 'date', optional: true },
  { k: 'warranty', label: '质保期', type: 'warranty' },
  { k: 'place', label: '实施地点', type: 'input', span: 2 },
  { k: 'owner', label: '负责人', type: 'input' },
  { k: 'contact', label: '发包方联系人', type: 'ref', num: false },
  { k: 'phone', label: '联系电话', type: 'ref', num: true },
  { k: 'industry', label: '行业', type: 'chip' },
  { k: 'region', label: '地区', type: 'chip', blue: true },
];
const FIELD_LABEL: Record<string, string> = {
  name: '合同名称', partyA: '发包方', partyB: '承包方', signDate: '签约日期', endDate: '到期日',
  startDate: '开工日期', warranty: '质保期', place: '实施地点', owner: '负责人',
};

const PAYMENTS = [
  { id: 'PF000031', name: '消防设备采购付款（报警系统）', party: '云南××消防设备有限公司', amt: 258000, type: '采购付款', status: '审批中', date: '2026-09-21', check: '已付 + 本次 ≤ 执行金额 × 100% ✓' },
  { id: 'PF000028', name: '劳务分包进度款（第一期）', party: '昆明××建筑劳务有限公司', amt: 180000, type: '分包付款', status: '已付款', date: '2026-09-10', check: '校验通过' },
  { id: 'PF000025', name: '安全文明施工措施费', party: '昆明××建筑劳务有限公司', amt: 46000, type: '费用付款', status: '已付款', date: '2026-09-05', check: '校验通过' },
];
const CHANGES = [
  { id: 'BG000009', name: '设计变更（增机房气体灭火）', amt: 80000, status: '审批中', date: '2026-09-22', reason: '发包方要求机房增设七氟丙烷灭火系统' },
  { id: 'BG000004', name: '工程量签证（管道增加 68 米）', amt: 32000, status: '已生效', date: '2026-09-14', reason: '现场实际走向调整，经监理确认' },
];
const STAGES = ['草稿', '审批中', '已审批', '已签约', '履约中', '结算中', '已结项'];

/* ============================ 合同详情抽屉 ============================ */
/**
 * @param role 必填 —— 抽屉内含 40+ 处金额，全部经由 Money / moneyTxt 按 A-02 口径脱敏。
 * 漏传会导致无金额权限角色看到真实数目，故不设默认值。
 */
export default function ContractDrawer({ open, c, onClose, go, role }: { open: boolean; c: C | null; onClose: () => void; go?: (p: string) => void; role: string }) {
  const toast = useToast();
  const [tab, setTab] = useState('doc');
  const [view, setView] = useState<'main' | 'sub'>('main');
  const [subIdx, setSubIdx] = useState(0);

  /* 覆盖层：回款登记 / 基础信息编辑 / 附件增删 / 追加日志 */
  const [recvOv, setRecvOv] = useState<{ key: string; actuals: number[] } | null>(null);
  const [editOv, setEditOv] = useState<{ key: string; v: Record<string, string> } | null>(null);
  const [fileDel, setFileDel] = useState<string[]>([]);
  const [fileAdd, setFileAdd] = useState<{ key: string; g: FileKey; f: FileItem }[]>([]);
  const [extraLogs, setExtraLogs] = useState<{ key: string; row: LogRow }[]>([]);

  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [payRow, setPayRow] = useState<PlanRow | null>(null);
  const [delFile, setDelFile] = useState<{ g: FileKey; i: number; name: string } | null>(null);
  const [rebutOpen, setRebuttal] = useState<PlanRow | null>(null);
  const [payOpen, setPayOpen] = useState<null | typeof PAYMENTS[number]>(null);
  const [changeOpen, setChangeOpen] = useState(false);
  const [settleOpen, setSettleOpen] = useState(false);
  const [termOpen, setTermOpen] = useState(false);
  const [actOpen, setActOpen] = useState(false);
  const [special, setSpecial] = useState(false);

  /* 电子合同：条款正文（可修订 / 追加）+ AI 审查结果 + 双向定位高亮 */
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [docVer, setDocVer] = useState(1);
  const [risks, setRisks] = useState<AiRisk[]>([]);
  const [scanned, setScanned] = useState(false);
  const [hlClause, setHlClause] = useState<string | null>(null);
  const [flashRisk, setFlashRisk] = useState<string | null>(null);
  const [clauseEdit, setClauseEdit] = useState<Clause | null>(null);
  const [clauseText, setClauseText] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [addH, setAddH] = useState('');
  const [addT, setAddT] = useState('');

  const subs = useMemo(() => (c ? buildSubs(c, role) : []), [c, role]);
  const mainV = useMemo(() => (c ? buildMain(c, role) : null), [c, role]);
  const base: CView | null = view === 'sub' ? subs[subIdx] ?? null : mainV;

  /* 应用覆盖层 → 当前视图 */
  const cur: CView | null = useMemo(() => {
    if (!base) return null;
    let out: CView = { ...base };
    if (editOv && editOv.key === base.code) {
      const v = editOv.v;
      out = {
        ...out,
        name: v.name ?? out.name,
        partyA: v.partyA ?? out.partyA,
        sign: v.signDate ?? out.sign,
        end: v.endDate ?? out.end,
        start: v.startDate ?? out.start,
        warranty: Number(v.warranty ?? out.warranty),
        place: v.place ?? out.place,
        owner: v.owner ?? out.owner,
      };
    }
    if (recvOv && recvOv.key === base.code) {
      out = {
        ...out,
        plans: out.plans.map((p, i) => {
          const a = recvOv.actuals[i] ?? p.actual;
          const stype: PlanRow['stype'] = a === 0 ? 'pending' : a < p.plan ? 'part' : 'done';
          return { ...p, actual: a, stype, status: stype === 'done' ? '已收款' : stype === 'part' ? '部分收款' : '待收款' };
        }),
      };
    }
    const files: FileGroups = { quote: [], safety: [], award: [] };
    (['quote', 'safety', 'award'] as FileKey[]).forEach((g) => {
      files[g] = base.files[g]
        .filter((_, i) => !fileDel.includes(`${base.code}|${g}|${i}`))
        .concat(fileAdd.filter((x) => x.key === base.code && x.g === g).map((x) => x.f));
    });
    out = { ...out, files, logs: [...extraLogs.filter((l) => l.key === base.code).map((l) => l.row), ...out.logs] };
    return out;
  }, [base, editOv, recvOv, fileDel, fileAdd, extraLogs]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    setTab('doc'); setView('main'); setSubIdx(0); setEdit(false); setSpecial(false);
    setRecvOv(null); setEditOv(null); setFileDel([]); setFileAdd([]); setExtraLogs([]);
    setDraft({}); setErrs({}); setPayRow(null); setDelFile(null); setRebuttal(null);
  }, [open, c?.id]);

  /* 电子合同正文：随「主 / 子合同视图」与合同类型重建；AI 审查结果同步重置 */
  useEffect(() => {
    if (!open || !cur || !c) { setClauses([]); setRisks([]); setScanned(false); return; }
    setClauses(buildClauses(cur, c.type, taxOf(c.type), freqOf(c), cur.warranty, role));
    setRisks([]); setScanned(false);
    setDocVer(1); setHlClause(null); setFlashRisk(null);
  }, [open, cur?.code, c?.type, role]);

  if (!open || !c || !cur) return null;

  const pushLog = (row: LogRow) => setExtraLogs((l) => [{ key: cur.code, row }, ...l]);

  const total = cur.details.reduce((a, d) => a + d.amount, 0);
  const received = cur.plans.reduce((a, p) => a + p.actual, 0);
  const unreceived = total - received;
  // Q3：原按 5% 计算质保金，与新建合同页的建质〔2017〕138 号硬校验（≤3%）自相矛盾。
  // 统一为 3% 上限口径（《建设工程质量保证金管理办法》第七条：预留比例不得高于工程价款结算总额 3%）。
  const RETENTION_RATE = RETENTION_PCT / 100;
  const retention = Math.round(total * RETENTION_RATE);
  const pct = total ? Math.round(received / total * 100) : 0;
  const planSum = cur.plans.reduce((a, p) => a + p.plan, 0);
  const doneN = cur.plans.filter((p) => p.stype === 'done').length;
  const partN = cur.plans.filter((p) => p.stype === 'part').length;

  const dLeft = Math.round((new Date(cur.end).getTime() - new Date(TODAY).getTime()) / 86400000);
  const isGov = c.party.includes('医院') || c.party.includes('政府') || c.party.includes('管理局');
  const isPurchase = c.type === '采购合同';
  /** 合同状态（归一化：历史别名「待审批」收敛为规范态「审批中」，与状态轴 STAGES 同源） */
  const cSt = normContractStatus(c.status);

  /* ---- 问题条（点击跳转到对应 Tab） ---- */
  const issues: { tone: string; text: string; tab: string }[] = [];
  if (c.overpay) issues.push({ tone: 'is-red', text: ' 超付预警：累计已付已接近执行金额上限，继续付款将被硬拦截', tab: 'pay' });
  if (c.overdue) issues.push({ tone: 'is-red', text: `期2 已收 ${moneyTxt(cur.plans[1].actual, role, true)} / 应收 ${moneyTxt(cur.plans[1].plan, role, true)}，差额 ${moneyTxt(cur.plans[1].plan - cur.plans[1].actual, role, true)} · 逾期风险`, tab: 'money' });
  if (cSt === '审批中') issues.push({ tone: 'is-orange', text: ' 待我审批：该合同尚未完成审批流转，请在本页页脚「同意 / 驳回」处理', tab: 'appr' });
  if (c.type === '框架协议') issues.push({ tone: 'is-orange', text: ' 框架协议：子合同累计执行金额已达框架总额 82%，超出须签补充协议', tab: 'sub' });
  if (c.overdue || c.overpay) issues.push({ tone: 'is-orange', text: ' AI 审查命中「违约金 30%」高风险条款，建议复核（见「合同文件」电子合同右栏）', tab: 'doc' });
  if (isGov) issues.push({ tone: 'is-gold', text: ' 政府 / 部队项目：安全 / 廉政 / 农民工工资 / 技术协议四件套须齐备', tab: 'attach' });

  /* ---- Tab（采购合同无子合同；子合同视图不显示子合同 Tab） ----
     对齐参考：原「概览 / AI 审查」两 Tab 合并为「合同文件」——基础信息 + 电子合同纸面 + AI 审查侧栏同屏零切换 */
  const tabs = [
    { key: 'doc', label: '合同文件' },
    { key: 'list', label: '合同明细', cnt: cur.details.length },
    ...(view === 'main' && subs.length ? [{ key: 'sub', label: '子合同', cnt: subs.length }] : []),
    isPurchase
      ? { key: 'money', label: '付款记录', cnt: PAYMENTS.length }
      : { key: 'money', label: '收款计划', cnt: cur.plans.length },
    ...(isPurchase ? [] : [{ key: 'pay', label: '付款与请款', cnt: PAYMENTS.length }]),
    { key: 'change', label: '变更与签证', cnt: CHANGES.length },
    { key: 'attach', label: '附件', cnt: GROUPS.reduce((a, [g]) => a + cur.files[g].length, 0) },
    { key: 'proj', label: '关联项目', cnt: cur.projects.length },
    { key: 'appr', label: '审批流转' },
    { key: 'borrow', label: '借阅记录', cnt: 2 },
    { key: 'log', label: '操作日志', cnt: cur.logs.length },
  ];

  /* ---- 基础信息取值（编辑态 / 查看态） ---- */
  const vals: Record<string, string> = edit
    ? draft
    : {
      name: cur.name, partyA: cur.partyA, partyB: PARTY_B,
      signDate: cur.sign, endDate: cur.end, startDate: cur.start, warranty: String(cur.warranty),
      place: cur.place, owner: cur.owner, contact: cur.contact, phone: cur.phone,
      industry: cur.industry, region: cur.region,
    };
  const setV = (k: string, v: string) => setDraft((d) => ({ ...d, [k]: v }));

  const startEdit = () => {
    if (cur.stype === 'done') { toast('该合同已完成，字段已锁定，如需修改请走变更流程'); return; }
    setDraft({
      name: cur.name, partyA: cur.partyA, partyB: PARTY_B,
      signDate: cur.sign, endDate: cur.end, startDate: cur.start, warranty: String(cur.warranty),
      place: cur.place, owner: cur.owner,
    });
    setErrs({});
    setEdit(true);
  };

  /** 校验：到期 > 签约；开工 ⊆ [签约, 到期] */
  const saveEdit = () => {
    const e: Record<string, string> = {};
    const s = draft.signDate, en = draft.endDate, st = draft.startDate;
    if (!s) e.signDate = '请选择签约日期';
    if (!en) e.endDate = '请选择到期日';
    else if (s && en <= s) e.endDate = '到期日必须晚于签约日期';
    if (st) {
      if (st < s) e.startDate = '开工日期不能早于签约日期';
      else if (st > en) e.startDate = '开工日期不能晚于到期日';
    }
    setErrs(e);
    if (Object.keys(e).length) { toast('请先修正标红的校验错误'); return; }

    const o = { name: cur.name, partyA: cur.partyA, signDate: cur.sign, endDate: cur.end, startDate: cur.start, warranty: String(cur.warranty), place: cur.place, owner: cur.owner };
    const changes: string[] = [];
    const anchors: string[] = [];
    (['name', 'partyA', 'signDate', 'endDate', 'startDate', 'warranty', 'place', 'owner'] as const).forEach((k) => {
      const nv = draft[k] ?? o[k];
      if (String(nv) !== String(o[k])) {
        const ov = k === 'warranty' ? `${o[k]} 个月` : o[k] || '空';
        const nw = k === 'warranty' ? `${nv} 个月` : nv || '空';
        changes.push(`${FIELD_LABEL[k]} ${ov} → ${nw}`);
        if (k === 'signDate' || k === 'endDate') anchors.push(FIELD_LABEL[k]);
      }
    });
    if (!changes.length) { setEdit(false); toast('未做修改'); return; }
    setEditOv({ key: cur.code, v: draft });
    setEdit(false);
    pushLog({ time: nowStamp(), warn: anchors.length > 0, text: <>管理员 <b>{anchors.length ? '发起合同变更' : '更新基础信息'}</b>：{changes.join('；')}</> });
    toast('保存成功' + (anchors.length ? `（${anchors.join('、')}变更已生成变更单）` : ''));
  };

  /* ---- 逐期登记回款 ---- */
  const confirmPay = () => {
    if (!payRow) return;
    const actuals = cur.plans.map((p) => (p.no === payRow.no ? p.plan : p.actual));
    setRecvOv({ key: cur.code, actuals });
    const sum = actuals.reduce((a, b) => a + b, 0);
    pushLog({ time: nowStamp(), warn: true, text: <>期{payRow.no}款 <b><Money v={payRow.plan} role={role} /></b> 到账（回款登记），累计实收 <Money v={sum} role={role} /></> });
    toast('回款登记成功 · 已收款 / 未收款已联动更新');
    setPayRow(null);
  };

  const gotoSub = (i: number) => {
    setSubIdx(i); setView('sub'); setTab('doc'); setEdit(false);
    toast(`已跳转至子合同详情：${subs[i].code}`);
  };
  const backMain = () => {
    setView('main'); setTab('doc'); setEdit(false);
    toast(`已返回主合同：${c.id}`);
  };

  return (
    <>
      <div className="nc-mask is-open" onClick={onClose} />
      {/* 「合同文件」页承载纸面 + AI 侧栏，加宽至 1080 保证正文可读；其余 Tab 维持 920 */}
      <aside className="nc-drawer is-open" style={{ width: tab === 'doc' ? 1080 : 920, maxWidth: '96vw' }}>

        {/* ---------- 头部 ---------- */}
        <div className="nc-d2-head">
          <div className="nc-d2-titlerow">
            <span className="nc-d2-id">{cur.code}</span>
            <Tag tone={ST_TONE[cur.status] ?? 'gray'}>{cur.status}</Tag>
            <Tag tone={TYPE_TONE[c.type] ?? 'gray'}>{c.type}</Tag>
            {cur.isSub && <Tag tone="purple">子合同</Tag>}
            {dLeft < 30 && <Tag tone="red">剩余 {dLeft} 天</Tag>}
            <span className="spacer" />
            {cur.isSub && <Btn size="sm" onClick={backMain}>← 返回主合同</Btn>}
            <button className="nc-drawer-close" onClick={onClose} aria-label="关闭"><Ico n="close" size={16} /></button>
          </div>
          <div className="nc-d2-name">{cur.name}</div>
          <div className="nc-d2-money-row">
            <span className="nc-d2-money"><Money v={total} role={role} /><small>合同总额 = Σ明细行</small></span>
            <span className="nc-d2-money-sub">
              已收 <Money v={received} role={role} wan /> · 未收 <Money v={unreceived} role={role} wan /> · 质保金 <Money v={retention} role={role} wan /> · 已支出 <Money v={cur.spent} role={role} wan /> · 剩余 {dLeft} 天
            </span>
          </div>
          <div className="nc-d2-sub">
            {cur.isSub && <span>所属主合同 <a className="nc-link" onClick={backMain}>{cur.parentCode}</a> {cur.parentName}</span>}
            {!cur.isSub && <span>相对方 {go ? <EntityLink target="customer" id={custOf(c.party)?.id} go={go} title="下钻到客户档案">{c.party}</EntityLink> : c.party}</span>}
            <span>负责人 {cur.owner}</span>
            {c.project && <span>关联项目 {go ? <EntityLink target="project-center" id={c.project} go={go} title="下钻到项目经营中心">{c.project}</EntityLink> : c.project}</span>}
            <span>工期 {cur.start} → {cur.end}</span>
            <span>签约 {cur.sign}</span>
            <span>收款进度 <b className="num">{pct}%</b></span>
          </div>
        </div>

        {/* ---------- 问题条 ---------- */}
        {issues.length > 0 && (
          <div className="nc-d2-issues">
            {issues.map((it) => (
              <div key={it.text} className={`nc-issue ${it.tone}`} onClick={() => setTab(it.tab)} {...pressProps(() => setTab(it.tab))}>
                {it.text}
              </div>
            ))}
          </div>
        )}

        {/* ---------- 5 张统计卡（复刻参考 · 常驻可见） ---------- */}
        <div className="nc-d2-stats">
          <div className="nc-stat5">
            <div className="nc-stat5-card" style={{ '--accent': 'var(--c-primary)' } as React.CSSProperties}>
              <div className="nc-stat5-hd"><span className="nc-stat5-ico is-blue">总</span>合同总额</div>
              <div className="nc-stat5-amt num"><Money v={total} role={role} /></div>
              <div className="nc-stat5-foot">由合同明细合计自动生成</div>
            </div>
            <div className="nc-stat5-card" style={{ '--accent': 'var(--c-success)' } as React.CSSProperties}>
              <div className="nc-stat5-hd"><span className="nc-stat5-ico is-green">收</span>已收款</div>
              <div className="nc-stat5-amt num is-green"><Money v={received} role={role} /></div>
              <div className="nc-stat5-foot">
                <div className="nc-stat5-row"><span>收款进度</span><b className="num" style={{ color: 'var(--c-success-deep)' }}>{pct}%</b></div>
                <Progress value={pct} tone="green" />
              </div>
            </div>
            <div className="nc-stat5-card" style={{ '--accent': 'var(--c-warning)' } as React.CSSProperties}>
              <div className="nc-stat5-hd"><span className="nc-stat5-ico is-orange">欠</span>未收款</div>
              <div className="nc-stat5-amt num is-orange"><Money v={unreceived} role={role} /></div>
              <div className="nc-stat5-foot">占总额 {100 - pct}%</div>
            </div>
            <div className="nc-stat5-card" style={{ '--accent': 'var(--c-warning-mid)' } as React.CSSProperties}>
              <div className="nc-stat5-hd"><span className="nc-stat5-ico is-gold">保</span>质保金</div>
              <div className="nc-stat5-amt num"><Money v={retention} role={role} /></div>
              <div className="nc-stat5-foot">按结算总额 {RETENTION_RATE * 100}% 上限计提 · 质保期满结清</div>
            </div>
            <div className="nc-stat5-card" style={{ '--accent': 'var(--c-danger)' } as React.CSSProperties}>
              <div className="nc-stat5-hd"><span className="nc-stat5-ico is-red">支</span>已支出</div>
              <div className="nc-stat5-amt num is-red"><Money v={cur.spent} role={role} /></div>
              <div className="nc-stat5-foot">来自项目成本模块 · 只读引用</div>
            </div>
          </div>
        </div>

        {/* ---------- 操作区 ---------- */}
        <div className="nc-d2-actions">
          {isPurchase
            ? <><Btn size="sm" kind="primary" onClick={() => setPayOpen(PAYMENTS[0])}>请款 / 付款</Btn><Btn size="sm" onClick={() => setChangeOpen(true)}>变更签证</Btn><Btn size="sm" onClick={() => setSettleOpen(true)}>结算</Btn></>
            : <><Btn size="sm" kind="primary" onClick={() => setChangeOpen(true)}>变更 / 签证</Btn><Btn size="sm" onClick={() => { setTab('money'); toast('请在「收款计划」中逐期登记回款'); }}>登记收款</Btn><Btn size="sm" onClick={() => setSettleOpen(true)}>结算</Btn></>}
          <Btn size="sm" onClick={() => setActOpen(true)}>更多操作 ⋯</Btn>
        </div>

        {/* ---------- Tab ---------- */}
        <div className="nc-d2-tabs">
          <Tabs items={tabs} value={tab} onChange={setTab} />
        </div>

        {/* ---------- 主体 ---------- */}
        <div className="nc-d2-body">
          {tab === 'doc' && (
            <>
              <div className="nc-sec-title">基础信息</div>
              {!edit && (
                <div style={{ textAlign: 'right', marginBottom: 8 }}>
                  <Btn size="sm" onClick={startEdit}><Ico n="edit" size={16} /> 编辑</Btn>
                </div>
              )}
              {edit && (
                <div className="nc-editbar">
                  <b><Ico n="edit" size={16} /> 正在编辑基础信息</b>
                  <span className="nc-editbar-hint"><Ico n="lock" size={16} /> 联系人 / 电话来自客户档案，行业 / 地区为客户标签，均不可在此修改 · 签约 / 到期日为日期锚点，变更将生成变更单</span>
                  <Btn size="sm" kind="primary" onClick={saveEdit}>保存</Btn>
                  <Btn size="sm" onClick={() => { setEdit(false); toast('已取消编辑'); }}>取消</Btn>
                </div>
              )}

              {edit ? (
                <div className="nc-form-grid-4">
                  {FIELDS.map((f) => {
                    if (f.type === 'ref') {
                      return (
                        <Field key={f.k} label={f.label}>
                          <input className="nc-input is-locked" value={vals[f.k] ?? ''} readOnly />
                          <div className="nc-footnote"><Ico n="lock" size={16} /> 来自客户档案 · {go ? <EntityLink target="customer" id={custOf(c.party)?.id} go={go} title="下钻到客户档案">去客户档案修改</EntityLink> : <a onClick={() => toast('跳转客户档案：' + c.party + '（演示）')}>去客户档案修改</a>}</div>
                        </Field>
                      );
                    }
                    if (f.type === 'chip') {
                      return (
                        <Field key={f.k} label={f.label}>
                          <input className="nc-input is-locked" value={vals[f.k] ?? ''} readOnly />
                          <div className="nc-footnote"><Ico n="lock" size={16} /> 客户属性标签</div>
                        </Field>
                      );
                    }
                    if (f.type === 'warranty') {
                      return (
                        <Field key={f.k} label={f.label}>
                          <select className="nc-input" value={vals[f.k] ?? '12'} onChange={(e) => setV(f.k, e.target.value)}>
                            {[3, 6, 12, 24].map((m) => <option key={m} value={m}>{m} 个月</option>)}
                          </select>
                          <div className="nc-footnote">质保到期日（派生）：<b className="num">{addMonths(vals.endDate ?? cur.end, Number(vals.warranty ?? cur.warranty))}</b></div>
                        </Field>
                      );
                    }
                    if (f.type === 'date') {
                      return (
                        <Field key={f.k} label={f.label + (f.optional ? '（选填）' : '')} req={!f.optional} err={errs[f.k]}>
                          <input className="nc-input num" type="date" value={vals[f.k] ?? ''} onChange={(e) => setV(f.k, e.target.value)} />
                          {f.anchor && <div className="nc-footnote"><Ico n="clock" size={16} /> 日期锚点 · 变更需走变更流程</div>}
                        </Field>
                      );
                    }
                    return (
                      <Field key={f.k} label={f.label} span={f.span}>
                        <input className="nc-input" value={vals[f.k] ?? ''} onChange={(e) => setV(f.k, e.target.value)} />
                      </Field>
                    );
                  })}
                </div>
              ) : (
                <div className="nc-desc-grid">
                  {FIELDS.map((f) => {
                    let v: React.ReactNode = vals[f.k] || <span style={{ color: 'var(--ink-3)' }}>—（未填）</span>;
                    if (f.k === 'partyA' && go) v = <><EntityLink target="customer" id={custOf(cur.partyA)?.id} go={go} title="下钻到客户档案">{vals[f.k]}</EntityLink><span className="nc-refbadge">来自客户档案</span></>;
                    else if (f.type === 'ref') v = <>{vals[f.k]}<span className="nc-refbadge">来自客户档案</span></>;
                    else if (f.type === 'chip') v = <span className={`nc-chip${f.blue ? ' is-blue' : ''}`}>{vals[f.k]}</span>;
                    else if (f.type === 'warranty') v = (
                      <>{vals[f.k]} 个月<div className="nc-derived">质保到期日 <b>{addMonths(cur.end, cur.warranty)}</b>（自动计算，不可编辑）</div></>
                    );
                    else if (f.type === 'date') v = <span className="num">{vals[f.k]}</span>;
                    return (
                      <div key={f.k} className={`nc-desc-item${f.span ? ' nc-desc-2' : ''}`}>
                        <div className="nc-desc-label">{f.label}</div>
                        <div className="nc-desc-value">{v}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {isGov && (
                <>
                  <div className="nc-sec-title">政府 / 部队四件套（硬拦截 · 缺一不可）</div>
                  <div className="nc-check-grid">
                    {['安全协议', '廉政协议', '农民工工资支付协议', '技术协议'].map((n) => (
                      <div key={n} className="nc-check-cell is-ok"><Ico n="check" size={16} /> {n}<span className="nc-cell-sub">已归档（{cur.sign}）</span></div>
                    ))}
                  </div>
                </>
              )}

              {/* ============ 电子合同（纸面正文）+ AI 审查（右栏）· 零切换同屏 ============ */}
              <div className="nc-sec-title">电子合同</div>
              <div className="nc-docbar">
                <span className="nc-docver"><Ico n="file" size={14} /> {cur.code} 电子合同正文</span>
                <Tag tone="gray">文档 v{docVer}</Tag>
                <Tag tone={cur.sign ? 'green' : 'orange'} pill>{cur.sign ? `已签署 ${cur.sign}` : '待签署'}</Tag>
                <span className="nc-toolbar-sp" />
                <Btn size="sm" onClick={() => {
                  if (cur.stype === 'done') { toast('该合同已完成，正文已锁定（终态不可修订）'); return; }
                  setAddH(''); setAddT(''); setAddOpen(true);
                }}>＋ 追加条款</Btn>
                <Btn size="sm" onClick={() => toast(`已导出：${cur.code}-v${docVer}.pdf`)}>导出 PDF</Btn>
                <Btn size="sm" kind="primary" onClick={() => {
                  const rs = scanClauses(clauses);
                  setRisks(rs); setScanned(true); setHlClause(null);
                  pushLog({ time: nowStamp(), text: <>AI 审查（v{docVer}）：命中 {rs.length} 项风险条款</> });
                  toast(rs.length ? `AI 审查完成 · 发现 ${rs.length} 项风险` : 'AI 审查完成 · 未发现风险');
                }}>
                  <Ico n="robot" size={16} /> {scanned && risks.length ? '重新审查' : 'AI 审查'}
                </Btn>
              </div>
              <div className="nc-dnote">
                电子合同正文按合同类型套用标准条款模板，签署后同步生成签署栏、电子印章与防伪水印；
                正文修订 / 追加条款将令文档版本 +1 并自动触发 AI 重扫。勾稽：总额 = Σ明细、已收 = Σ计划实收、质保金 = 结算总额 × {RETENTION_PCT}%。
              </div>

              <div className="nc-paper-layout">
                {/* ---- 左：纸面 ---- */}
                <div className="nc-paper">
                  <div className="nc-paper-title">{cur.name}</div>
                  <div className="nc-paper-meta">
                    <span>编号：{cur.code}</span>
                    <span>甲方：{cur.partyA}</span>
                    <span>乙方：{PARTY_B}</span>
                    <span>金额：<Money v={cur.total} role={role} /></span>
                  </div>
                  {clauses.map((cl) => {
                    const rs = risks.filter((r) => r.clauseId === cl.id);
                    return (
                      <div
                        key={cl.id}
                        className={`nc-paper-clause${hlClause === cl.id ? ' is-hl' : ''}`}
                        onClick={() => setHlClause(cl.id)}
                        onDoubleClick={() => {
                          if (cur.stype === 'done') { toast('该合同已完成，正文已锁定（终态不可修订）'); return; }
                          setClauseText(cl.t); setClauseEdit(cl);
                        }}
                      >
                        <span className="nc-cl-no">{cl.h}</span>
                        {cl.t}
                        {cl.dirty && <Tag tone="gold">已修订</Tag>}
                        {rs.length > 0 && (
                          <span className="nc-ai-pin">
                            {rs.map((r) => (
                              <button
                                key={r.id}
                                className={`nc-ai-flag ${r.level === '高' ? 'is-h' : r.level === '中' ? 'is-m' : 'is-l'}`}
                                title={`${r.dim}：${r.sug}`}
                                onClick={(e) => { e.stopPropagation(); setFlashRisk(r.id); toast(`已定位风险项「${r.dim}」`); }}
                              >{r.level}</button>
                            ))}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  <div className="nc-paper-sign">
                    <div className="nc-paper-sign-cell">甲方（盖章）：{cur.partyA}<b>{cur.sign ? `已签署 ${cur.sign}` : '（待签）'}</b></div>
                    <div className="nc-paper-sign-cell">乙方（盖章）：{PARTY_B}<b>{cur.sign ? `已签署 ${cur.sign}` : '（待签）'}</b></div>
                  </div>
                  {cur.sign && <div className="nc-paper-seal">诺盾博达<br />合同专用章</div>}
                  <div className="nc-paper-wm">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span key={i} style={{ top: `${8 + i * 18}%`, left: `${(i % 2) * 40 + 6}%` }}>内部资料 · {cur.owner} · {TODAY}</span>
                    ))}
                  </div>
                </div>

                {/* ---- 右：AI 审查（融入电子合同） ---- */}
                <div className="nc-ai-side">
                  <div className="nc-ai-side-hd">
                    <b><Ico n="robot" size={16} /> AI 审查</b>
                    {risks.length > 0 && <Tag tone={risks.some((r) => r.st === '待确认') ? 'red' : 'green'} pill>
                      {risks.some((r) => r.st === '待确认') ? `${risks.filter((r) => r.st === '待确认').length} 项待确认` : '全部已处理'}
                    </Tag>}
                  </div>
                  <div className="nc-ai-side-tip">点击风险项 → 定位左侧条款；条款右侧角标 → 回看此处。</div>
                  {!scanned && (
                    <div className="nc-ai-empty">
                      尚未审查<br />
                      <Btn size="sm" kind="primary" onClick={() => {
                        const rs = scanClauses(clauses);
                        setRisks(rs); setScanned(true);
                        pushLog({ time: nowStamp(), text: <>AI 审查（v{docVer}）：命中 {rs.length} 项风险条款</> });
                        toast(rs.length ? `发现 ${rs.length} 项风险` : '未发现风险');
                      }}>发起审查</Btn>
                    </div>
                  )}
                  {scanned && risks.length === 0 && (
                    <div className="nc-ai-empty"><Ico n="check" size={16} /> 未发现风险条款</div>
                  )}
                  {risks.map((r) => (
                    <div
                      key={r.id}
                      className={`nc-ai-item${flashRisk === r.id ? ' is-flash' : ''}`}
                      onClick={() => { setHlClause(r.clauseId); toast(`已定位到「${r.dim}」条款`); }}
                    >
                      <div className="nc-ai-h">
                        <Tag tone={r.level === '高' ? 'red' : r.level === '中' ? 'orange' : 'blue'}>{r.level}风险</Tag>
                        <b>{r.dim}</b>
                      </div>
                      <div className="nc-ai-quote">「{r.quote}」</div>
                      <div className="nc-ai-sug">{r.sug}</div>
                      <div className="nc-ai-foot" onClick={(e) => e.stopPropagation()}>
                        {r.st === '待确认' ? (
                          <>
                            <Btn size="sm" onClick={() => {
                              setRisks((l) => l.map((x) => x.id === r.id ? { ...x, st: '已确认' } : x));
                              pushLog({ time: nowStamp(), text: <>AI 风险「{r.dim}」已确认</> });
                              toast('已确认该风险');
                            }}>确认</Btn>
                            <Op onClick={() => {
                              setRisks((l) => l.map((x) => x.id === r.id ? { ...x, st: '已忽略' } : x));
                              toast('已忽略该风险');
                            }}>忽略</Op>
                          </>
                        ) : <Tag tone={r.st === '已确认' ? 'orange' : 'gray'} pill>{r.st}</Tag>}
                        <a className="nc-ai-loc" onClick={() => setHlClause(r.clauseId)}>定位 ›</a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {tab === 'list' && (
            <>
              <div className="nc-sec-title">合同明细行</div>
              <table className="nc-tbl" style={{ minWidth: 820 }}>
                <thead><tr>
                  <th style={{ width: 56 }} className="is-num">序号</th><th>业务类型</th>
                  <th style={{ width: 200 }}>服务周期</th><th style={{ width: 130 }} className="is-num">金额</th>
                  <th style={{ width: 90 }}>财务方向</th><th>备注</th>
                </tr></thead>
                <tbody>
                  {cur.details.map((d) => (
                    <tr key={d.no}>
                      <td className="is-num" style={{ color: 'var(--ink-3)' }}>{d.no}</td>
                      <td><a className="nc-link" onClick={() => toast('已定位业务类型「' + d.biz + '」')}>{d.biz}</a></td>
                      <td className="num" style={{ color: 'var(--ink-2)' }}>{d.period}</td>
                      <td className="is-num"><b className="num"><Money v={d.amount} role={role} /></b></td>
                      <td><Tag tone="green">{d.dir}</Tag></td>
                      <td style={{ color: 'var(--ink-2)' }}>{d.remark}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="nc-tbl-sum">
                  <td colSpan={3}>合计（{cur.details.length} 项）</td>
                  <td className="is-num"><b className="num"><Money v={total} role={role} /></b></td>
                  <td><Tag tone="green">100%</Tag></td><td />
                </tr></tfoot>
              </table>
              <div className="nc-dnote">明细行金额合计即合同总额，系统自动计算，不允许手工改写。</div>
            </>
          )}

          {tab === 'sub' && view === 'main' && (
            <>
              <div className="nc-sec-title">子合同</div>
              <div className="nc-subbar">
                <Ico n="package" size={14} /> 已拆分 {subs.length} 个子合同，合计 {<Money v={subs.reduce((a, s) => a + s.total, 0)} role={role} />}（占总额 {Math.round(subs.reduce((a, s) => a + s.total, 0) / total * 100)}%）；余款由主合同直接执行。点击行进入子合同详情。
              </div>
              <table className="nc-tbl" style={{ minWidth: 860 }}>
                <thead><tr>
                  <th style={{ width: 170 }}>子合同编号</th><th>子合同名称</th>
                  <th style={{ width: 90 }}>类型</th><th style={{ width: 130 }} className="is-num">金额</th>
                  <th style={{ width: 100 }}>状态</th><th style={{ width: 90 }}>操作</th>
                </tr></thead>
                <tbody>
                  {subs.map((s, i) => (
                    <tr key={s.code} className="nc-subrow" onClick={() => gotoSub(i)}>
                      <td><a className="nc-link num">{s.code}</a></td>
                      <td>{s.name}</td>
                      <td><Tag tone="gray">{s.details[0]?.biz ?? '—'}</Tag></td>
                      <td className="is-num"><b className="num"><Money v={s.total} role={role} /></b></td>
                      <td><Tag tone={STYPE_TONE[s.stype] ?? 'gray'}>{s.status}</Tag></td>
                      <td><div className="nc-ops"><Op onClick={() => gotoSub(i)}>查看</Op></div></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="nc-tbl-sum">
                  <td colSpan={3}>合计（已拆分）</td>
                  <td className="is-num"><b className="num">{<Money v={subs.reduce((a, s) => a + s.total, 0)} role={role} />}</b></td>
                  <td colSpan={2} style={{ fontWeight: 400, color: 'var(--ink-3)' }}>
                    占总额 {Math.round(subs.reduce((a, s) => a + s.total, 0) / total * 100)}% · 余款由主合同直接执行
                  </td>
                </tr></tfoot>
              </table>
            </>
          )}

          {tab === 'money' && !isPurchase && (
            <>
              <div className="nc-toolbar">
                <span className="nc-listhint">收款计划<Tip w={360} text="实收来自回款登记，不可在计划中直接修改 · 登记后首笔触发「履约中」· 红字冲销一笔仅一次。" /></span>
                <span className="nc-toolbar-sp" />
                <Btn size="sm" onClick={() => toast('已新增收款期次')}>＋ 新增期次</Btn>
              </div>
              <table className="nc-tbl" style={{ minWidth: 1000 }}>
                <thead><tr>
                  <th style={{ width: 56 }} className="is-num">期数</th><th>收款节点</th>
                  <th style={{ width: 130 }} className="is-num">计划金额</th><th style={{ width: 150 }} className="is-num">实收金额</th>
                  <th style={{ width: 100 }}>状态</th><th style={{ width: 110 }}>计划日期</th><th style={{ width: 170 }}>操作</th>
                </tr></thead>
                <tbody>
                  {cur.plans.map((r) => {
                    const partial = r.actual > 0 && r.actual < r.plan;
                    const canPay = r.actual < r.plan;
                    return (
                      <tr key={r.no} className={r.stype === 'pending' && c.overdue ? 'is-danger-row' : ''}>
                        <td className="is-num">{r.no}</td>
                        <td>{r.node}</td>
                        <td className="is-num"><Money v={r.plan} role={role} /></td>
                        <td className="is-num">
                          {r.actual === 0
                            ? <span style={{ color: 'var(--ink-3)' }}>—</span>
                            : <b className="num" style={partial ? { color: 'var(--c-warning-deep)' } : undefined}><Money v={r.actual} role={role} /></b>}
                          {partial && <div className="nc-cell-sub">待收 <Money v={r.plan - r.actual} role={role} /></div>}
                        </td>
                        <td><Tag tone={STYPE_TONE[r.stype]}>{r.status}</Tag></td>
                        <td className="num">{r.date}</td>
                        <td><div className="nc-ops">
                          {canPay && <><Op gold onClick={() => setPayRow(r)}>登记回款</Op><OpSep /></>}
                          {!!r.actual && <><Op danger onClick={() => setRebuttal(r)}>红字冲销</Op><OpSep /></>}
                          <Op onClick={() => toast('已修改期次')}>编辑</Op>
                        </div></td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot><tr className="nc-tbl-sum">
                  <td colSpan={2}>合计</td>
                  <td className="is-num"><b className="num"><Money v={planSum} role={role} /></b></td>
                  <td className="is-num"><b className="num" style={{ color: 'var(--c-success-deep)' }}><Money v={received} role={role} /></b></td>
                  <td colSpan={3} style={{ fontWeight: 400, color: 'var(--ink-3)' }}>
                    实收来自回款登记 · 已收 {doneN} 期整{partN ? ` + ${partN} 期部分` : ''}，累计 <Money v={received} role={role} />（{planSum ? Math.round(received / planSum * 100) : 0}%）
                  </td>
                </tr></tfoot>
              </table>
              {c.overdue && <div className="nc-warnbox is-red"><Ico n="ban" size={16} /> 期2 应收 <Money v={cur.plans[1].plan} role={role} />，已收 <Money v={cur.plans[1].actual} role={role} />，差额 <b><Money v={cur.plans[1].plan - cur.plans[1].actual} role={role} /></b>；驾驶舱「逾期应收」已联动。</div>}
            </>
          )}

          {(tab === 'pay' || (tab === 'money' && isPurchase)) && (
            <>
              <div className="nc-listhint">
                <span>付款校验<Tip w={380} text="付款超限硬拦截：已付 + 本次 > 执行金额 × 比例上限 → 硬拦截 + 校验明细；特批开关填理由放行并留痕。无关联合同付款固定路由老板审批。" /></span>
              </div>
              <table className="nc-tbl" style={{ minWidth: 1000 }}>
                <thead><tr><th style={{ width: 110 }}>付款单号</th><th>事由</th><th style={{ width: 200 }}>相对方</th><th style={{ width: 90 }}>类型</th><th style={{ width: 120 }} className="is-num">金额</th><th style={{ width: 90 }}>状态</th><th style={{ width: 200 }}>校验 / 操作</th></tr></thead>
                <tbody>
                  {PAYMENTS.map((p) => (
                    <tr key={p.id}>
                      <td><Code>{p.id}</Code></td><td>{p.name}</td><td className="nc-cell-sub">{p.party}</td>
                      <td><Tag tone="orange">{p.type}</Tag></td>
                      <td className="is-num"><b className="num"><Money v={p.amt} role={role} /></b></td>
                      <td><Tag tone={p.status === '已付款' ? 'green' : 'blue'}>{p.status}</Tag></td>
                      <td><div className="nc-ops">
                        <Op onClick={() => setPayOpen(p)}>校验明细</Op><OpSep />
                        {p.status === '审批中' && <Op onClick={() => toast('已跳转审批中心')}>去审批</Op>}
                        {p.status === '已付款' && <Op danger onClick={() => toast('付款红字冲销：生成负数凭证冲正，生成红字冲销单，原单只读，一笔仅一次')}>红字冲销</Op>}
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {tab === 'change' && (
            <>
              <div className="nc-toolbar"><span className="nc-listhint">变更记录<Tip text="任何变更留痕：记录用户 / 时间 / 内容 / 原因，不可覆盖删除。" /></span><span className="nc-toolbar-sp" /><Btn size="sm" kind="primary" onClick={() => setChangeOpen(true)}>＋ 新增变更</Btn></div>
              <table className="nc-tbl" style={{ minWidth: 880 }}>
                <thead><tr><th style={{ width: 110 }}>变更单号</th><th>变更内容</th><th style={{ width: 120 }} className="is-num">金额</th><th style={{ width: 90 }}>状态</th><th style={{ width: 110 }}>日期</th><th style={{ width: 80 }}>操作</th></tr></thead>
                <tbody>
                  {CHANGES.map((x) => (
                    <tr key={x.id}>
                      <td><Code>{x.id}</Code></td>
                      <td>{x.name}<div className="nc-cell-sub">{x.reason}</div></td>
                      <td className="is-num"><b className="num"><Money v={x.amt} role={role} /></b></td>
                      <td><Tag tone={x.status === '已生效' ? 'green' : 'blue'}>{x.status}</Tag></td>
                      <td>{x.date}</td>
                      <td><Op onClick={() => toast('已查看变更详情')}>详情</Op></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {tab === 'attach' && (
            <>
              <div className="nc-listhint">
                <span>附件归集<Tip text="附件按分类归集，与「文档中心」双向同源（任一入口上传 / 删除实时同步）。" /></span>
              </div>
              {GROUPS.map(([g, label]) => {
                const list = cur.files[g];
                return (
                  <div key={g} className="nc-fgroup">
                    <div className="nc-fg-head">
                      <span className="nc-fg-title">{label}</span>
                      <span className="nc-fg-count">{list.length} 个文件</span>
                      <span className="nc-fg-ops"><Btn size="sm" onClick={() => {
                        setFileAdd((a) => [...a, { key: cur.code, g, f: { name: '现场核验记录-新上传.jpg', by: '管理员', date: TODAY, size: '3.1 MB', type: 'JPG', color: '#b37feb' } }]);
                        pushLog({ time: nowStamp(), text: <>管理员 上传附件「现场核验记录-新上传.jpg」</> });
                        toast('上传成功（模拟）');
                      }}>＋ 上传</Btn></span>
                    </div>
                    {list.length === 0
                      ? <div className="nc-empty-mini">暂无文件，点击右上角「上传」</div>
                      : list.map((f, i) => (
                        <div key={`${g}-${i}`} className="nc-file-item">
                          <span className="nc-file-ico" style={{ background: f.color }}>{f.type}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="nc-file-name">{f.name}</div>
                            <div className="nc-file-meta">{f.by} 上传于 {f.date}</div>
                          </div>
                          <span className="nc-file-size">{f.size}</span>
                          <span className="nc-file-ops">
                            <Op onClick={() => toast('打开预览：' + f.name + '（演示）')}>查看</Op>
                            <Op danger onClick={() => setDelFile({ g, i, name: f.name })}>删除</Op>
                          </span>
                        </div>
                      ))}
                  </div>
                );
              })}
            </>
          )}

          {tab === 'proj' && (
            <>
              <div className="nc-sec-title">关联项目</div>
              {cur.projects.length === 0
                ? <div className="nc-empty-mini">框架协议暂无直接关联项目，按子合同工作量挂接</div>
                : (
                  <table className="nc-tbl" style={{ minWidth: 720 }}>
                    <thead><tr><th style={{ width: 160 }}>项目编号</th><th>项目名称</th><th style={{ width: 120 }}>负责人</th><th style={{ width: 110 }}>状态</th></tr></thead>
                    <tbody>
                      {cur.projects.map((p) => (
                        <tr key={p.code}>
                          <td>{go ? <EntityLink target="project-center" id={p.code} go={go} strong title="下钻到项目经营中心">{p.code}</EntityLink> : <span className="num">{p.code}</span>}</td>
                          <td>{p.name}</td>
                          <td>{p.owner}</td>
                          <td><Tag tone={STYPE_TONE[p.stype] ?? 'gray'}>{p.status}</Tag></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
            </>
          )}

          {tab === 'appr' && (
            <>
              <ChainBar nodes={STAGES.map((s, i) => ({
                label: s,
                state: (i < STAGES.indexOf(cSt) ? 'done' : i === STAGES.indexOf(cSt) ? 'cur' : 'todo') as 'done' | 'cur' | 'todo',
              }))} />
              <div className="nc-sec-title">审批路由（按金额自动分派）</div>
              <KvGrid cols={2} rows={[
                { k: '当前节点', v: cSt === '审批中' ? <Tag tone="orange">待我审批</Tag> : <Tag tone="green">已完成</Tag> },
                { k: '路由规则', v: c.execAmt >= 2000000 ? '≥200 万 → 总经理' : c.execAmt >= 500000 ? '50–200 万 → 分管副总' : '<50 万 → 部门负责人' },
                { k: '发起人', v: cur.owner },
                { k: '提交时间', v: cur.sign },
              ]} />
              <div className="nc-dnote">付款类审批另按「已付 + 本次 ≤ 执行金额 × 比例上限」硬校验；超限须走特批并留痕。</div>
            </>
          )}

          {tab === 'borrow' && (
            <table className="nc-tbl" style={{ minWidth: 700 }}>
              <thead><tr><th style={{ width: 110 }}>借阅单号</th><th>借阅人</th><th style={{ width: 110 }}>申请时间</th><th style={{ width: 110 }}>归还时间</th><th style={{ width: 90 }}>状态</th></tr></thead>
              <tbody>
                <tr><td><Code>JY000017</Code></td><td>行政</td><td>2026-09-17</td><td>2026-09-18</td><td><Tag tone="green">已归还</Tag></td></tr>
                <tr><td><Code>JY000021</Code></td><td>赵薇</td><td>2026-09-20</td><td>—</td><td><Tag tone="blue">借阅中</Tag></td></tr>
              </tbody>
            </table>
          )}

          {tab === 'log' && (
            <Timeline items={cur.logs.map((l) => ({
              date: l.time,
              text: l.text,
              tone: (l.warn ? 'ok' : 'gray') as 'ok' | 'gray',
            }))} />
          )}
        </div>

        {/* ---------- 页脚 ---------- */}
        <div className="nc-d2-foot">
          {cSt === '审批中'
            ? <><Btn kind="primary" onClick={() => { toast('已同意 · 流转至下一节点'); onClose(); }}>同意</Btn><Btn danger onClick={() => { toast('已驳回 · 退回发起人'); onClose(); }}>驳回</Btn><Btn onClick={() => toast('已转交')}>转交</Btn></>
            : <><Btn onClick={startEdit}>编辑</Btn><Btn onClick={() => setActOpen(true)}>更多操作 ⋯</Btn></>}
          <span className="spacer" />
          <span className="nc-cell-sub">收款进度 <Progress value={pct} tone={c.overdue ? 'red' : 'green'} /> {pct}%</span>
          <Btn onClick={onClose}>关闭</Btn>
        </div>
      </aside>

      {/* ============ 逐期登记回款（确认框） ============ */}
      <Modal
        open={!!payRow} onClose={() => setPayRow(null)} width={440} title="登记回款"
        foot={<><Btn onClick={() => setPayRow(null)}>取消</Btn><Btn kind="primary" onClick={confirmPay}>确定</Btn></>}>
        <div style={{ fontSize: 13, lineHeight: 1.7 }}>
          确认为「{payRow?.node}」登记回款 <b className="num"><Money v={(payRow?.plan ?? 0) - (payRow?.actual ?? 0)} role={role} /></b>？
          <div className="nc-cell-sub" style={{ marginTop: 8 }}>实收金额来自回款登记，不可在计划中直接修改。</div>
        </div>
      </Modal>

      {/* ============ 电子合同 · 修订条款（双击纸面条款进入） ============ */}
      <Modal
        open={!!clauseEdit} onClose={() => setClauseEdit(null)} width={560} title={`修订条款 · ${clauseEdit?.h ?? ''}`}
        foot={<><Btn onClick={() => setClauseEdit(null)}>取消</Btn><Btn kind="primary" onClick={() => {
          const v = clauseText.trim();
          if (!v) { toast('条款内容不能为空'); return; }
          const cid = clauseEdit?.id;
          setClauses((l) => l.map((x) => x.id === cid ? { ...x, t: v, dirty: true } : x));
          setDocVer((n) => n + 1);
          pushLog({ time: nowStamp(), text: <>修订条款「{clauseEdit?.h}」→ 文档 v{docVer + 1}</> });
          // 修订后正文变动 → 已有审查结论失效，强制重扫（避免旧结论误导）
          setRisks([]); setScanned(false);
          setClauseEdit(null);
          toast(`已保存 · 文档版本升至 v${docVer + 1}，AI 审查结论已失效，请重新审查`);
        }}>保存并重新生成</Btn></>}>
        <Field label="条款正文">
          <textarea className="nc-input" style={{ minHeight: 120, lineHeight: 1.8 }} value={clauseText} onChange={(e) => setClauseText(e.target.value)} />
        </Field>
        <div className="nc-dnote is-gold" style={{ marginTop: 10, marginBottom: 0 }}>
          保存后文档版本 +1（v{docVer + 1}）、留痕，并自动触发 AI 重扫。
        </div>
      </Modal>

      {/* ============ 电子合同 · 追加条款 ============ */}
      <Modal
        open={addOpen} onClose={() => setAddOpen(false)} width={560} title="追加条款"
        foot={<><Btn onClick={() => setAddOpen(false)}>取消</Btn><Btn kind="primary" onClick={() => {
          const h = addH.trim(); const t = addT.trim();
          if (!h || !t) { toast('条款标题与正文必填'); return; }
          setClauses((l) => [...l, { id: `c-${Date.now()}`, h, t, dirty: true }]);
          setDocVer((n) => n + 1);
          pushLog({ time: nowStamp(), text: <>追加条款「{h}」→ 文档 v{docVer + 1}</> });
          setRisks([]); setScanned(false);
          setAddOpen(false);
          toast(`已追加 · 文档版本升至 v${docVer + 1}`);
        }}>追加</Btn></>}>
        <Field label="条款标题">
          <input className="nc-input" placeholder="如：第八条 保密条款" value={addH} onChange={(e) => setAddH(e.target.value)} />
        </Field>
        <Field label="条款正文">
          <textarea className="nc-input" style={{ minHeight: 100, lineHeight: 1.8 }} placeholder="条款正文" value={addT} onChange={(e) => setAddT(e.target.value)} />
        </Field>
      </Modal>

      {/* ============ 删除附件 ============ */}
      <Modal
        open={!!delFile} onClose={() => setDelFile(null)} width={420} title="删除附件"
        foot={<><Btn onClick={() => setDelFile(null)}>取消</Btn><Btn danger onClick={() => {
          if (delFile) {
            setFileDel((d) => [...d, `${cur.code}|${delFile.g}|${delFile.i}`]);
            pushLog({ time: nowStamp(), text: <>管理员 删除附件「{delFile.name}」</> });
            toast('附件已删除');
          }
          setDelFile(null);
        }}>确定</Btn></>}>
        <div style={{ fontSize: 13 }}>确定删除「{delFile?.name}」吗？删除后不可恢复。</div>
      </Modal>

      {/* ============ 收款红字冲销 ============ */}
      <Modal
        open={!!rebutOpen} onClose={() => setRebuttal(null)} width={540} title={`收款红字冲销 · 期${rebutOpen?.no ?? ''}`}
        foot={<><Btn onClick={() => setRebuttal(null)}>取消</Btn><Btn danger onClick={() => { toast('已生成负数红字冲销单 · 原单只读「已红字冲销」· 合同状态不回退'); setRebuttal(null); }}>确认红字冲销</Btn></>}>
        <Banner tone="danger">收款红字冲销：生成<b>负数凭证（红字冲销单）</b>、原单只读「已红字冲销」、<b>一笔仅一次</b>、合同状态不回退。</Banner>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label">原收款金额</div><input className="nc-input" value={rebutOpen ? moneyTxt(rebutOpen.actual, role) : ''} readOnly /></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">红字冲销原因</div><textarea className="nc-input" rows={3} placeholder="例：客户重复付款，按实际退回冲正" /></div>
        </div>
      </Modal>

      {/* ============ 付款校验明细 ============ */}
      <Modal
        open={!!payOpen} onClose={() => setPayOpen(null)} width={600} title={`付款校验明细 · ${payOpen?.id ?? ''}`}
        foot={<><Btn onClick={() => setPayOpen(null)}>关闭</Btn><Btn onClick={() => { setSpecial(true); toast('已开启特批开关：请填写理由后将放行并留痕'); }}>特批放行</Btn></>}>
        {payOpen && (
          <>
            <KvGrid cols={2} rows={[
              { k: '付款单号', v: <Code>{payOpen.id}</Code> },
              { k: '本次金额', v: <Money v={payOpen.amt} role={role} /> },
              { k: '执行金额', v: <Money v={c.execAmt} role={role} /> },
              { k: '比例上限', v: '100%' },
              { k: '已付（含本次）', v: <Money v={484000} role={role} /> },
              { k: '校验结果', v: <Tag tone="green"><Ico n="check" size={16} /> 通过（已付 + 本次 ≤ 执行金额 × 100%）</Tag> },
            ]} />
            {special && (
              <Field label="特批理由" req note="超限放行须填理由并留痕（记录用户 / 时间 / 内容 / 原因）">
                <textarea className="nc-input" rows={3} placeholder="例：供应商要求预付比例提高，经分管副总同意" />
              </Field>
            )}
          </>
        )}
      </Modal>

      {/* ============ 变更 / 签证 ============ */}
      <Modal
        open={changeOpen} onClose={() => setChangeOpen(false)} width={640} title="新增变更 / 签证"
        foot={<><Btn onClick={() => setChangeOpen(false)}>取消</Btn><Btn kind="primary" onClick={() => { toast('变更单已提交 · 生效后执行金额与收款期次联动'); setChangeOpen(false); }}>提交变更</Btn></>}>
        <div className="nc-form-grid">
          <Field label="变更类型" req><select className="nc-input"><option>设计变更</option><option>工程量签证</option><option>工期变更</option><option>金额变更</option></select></Field>
          <Field label="变更金额" req note="计入合同执行金额"><input className="nc-input" type="number" placeholder="元（可负）" /></Field>
          <Field label="变更内容" req span={2}><input className="nc-input" placeholder="例：增机房气体灭火系统" /></Field>
          <Field label="变更原因" req span={2}><textarea className="nc-input" rows={3} placeholder="记录用户 / 时间 / 内容 / 原因，不可覆盖删除" /></Field>
          <Field label="发包方确认函" span={2} note="政府 / 部队项目建议上传书面确认"><input className="nc-input" type="file" /></Field>
        </div>
      </Modal>

      {/* ============ 结算 ============ */}
      <Modal
        open={settleOpen} onClose={() => setSettleOpen(false)} width={620} title="合同结算"
        foot={<><Btn onClick={() => setSettleOpen(false)}>取消</Btn><Btn kind="primary" onClick={() => { toast('已进入结算流程 · 合同转「结算中」'); setSettleOpen(false); }}>发起结算</Btn></>}>
        <Banner tone="info">结算：核对执行金额、收款期次、成本归集、质保金留存，生成结算单。</Banner>
        <KvGrid cols={2} rows={[
          { k: '合同总额', v: <Money v={total} role={role} /> },
          { k: '执行金额（含变更）', v: <Money v={c.execAmt} role={role} /> },
          { k: '已收', v: <Money v={received} role={role} /> },
          { k: '未收', v: <Money v={unreceived} role={role} /> },
          { k: '质保金留存', v: <Money v={retention} role={role} /> },
          { k: '已支出', v: <Money v={cur.spent} role={role} /> },
        ]} />
        <Field label="结算说明" span={2}><textarea className="nc-input" rows={3} placeholder="结算依据与差异说明" /></Field>
      </Modal>

      {/* ============ 更多操作 ============ */}
      <Modal open={actOpen} onClose={() => setActOpen(false)} width={480} title="更多操作" foot={<Btn onClick={() => setActOpen(false)}>关闭</Btn>}>
        <div className="nc-oplist">
          <button className="nc-oplist-item" onClick={() => { toast('已发起续签流程'); setActOpen(false); }}>续签<small>生成续签合同草稿</small></button>
          <button className="nc-oplist-item" onClick={() => { setTermOpen(true); setActOpen(false); }}>终止<small>需填原因，走审批</small></button>
          <button className="nc-oplist-item" onClick={() => { toast('已登记中止（可恢复）'); setActOpen(false); }}>中止<small>临时停工，可恢复</small></button>
          <button className="nc-oplist-item" onClick={() => { toast('已登记解除（不可恢复）'); setActOpen(false); }}>解除<small>不可恢复</small></button>
          <button className="nc-oplist-item is-danger" onClick={() => { toast('作废需管理员权限，已提交申请'); setActOpen(false); }}>作废<small>仅草稿可作废</small></button>
        </div>
      </Modal>

      <Modal open={termOpen} onClose={() => setTermOpen(false)} width={520} title="终止合同" foot={<><Btn onClick={() => setTermOpen(false)}>取消</Btn><Btn danger onClick={() => { toast('合同已终止 · 未执行期次置为「终止」'); setTermOpen(false); }}>确认终止</Btn></>}>
        <Banner tone="warn">终止后未执行期次置为「终止」，已收款不受影响；须填写终止原因并走审批。</Banner>
        <Field label="终止原因" req><textarea className="nc-input" rows={3} /></Field>
      </Modal>
    </>
  );
}
