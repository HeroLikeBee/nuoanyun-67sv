// 证书批量导入：台账表格解析 + 证书照片识别
//
// 通用的「文件 → 二维网格」在 components/xlsx.ts；本文件把网格认成证书，或把照片认成证书。
//
// 两条来源统一收敛成 CertDraft —— 核对清单只消费一种结构，因此
// 「传表格」与「传照片」共用同一套核对 / 入库逻辑（区别只在 conf 置信度）。
//
// ⚠️ 照片识别目前是**模拟实现**（原型没有真实 OCR 服务）：内置 6 份样例证书，
//    按上传顺序 / 文件名关键词返回，并给出字段级置信度。接入真实 OCR 时
//    只需替换 recognizeCertImages() 一个函数，其余逻辑不用动。

import {
  CERT_SUBTYPES, CERT_SUBTYPE_META, certStatusOf, certWarnDays,
} from './data';
import type { Cert } from './data';
import { isImageFile, isTableFile, readTableFile } from './xlsx';

/* ============================ 一、草稿模型 ============================ */

/** 需要逐字段置信度 / 认不出标注的字段 */
export type CertField = 'name' | 'certNo' | 'subType' | 'holder' | 'issue' | 'validTo';
export const CERT_FIELD_CN: Record<CertField, string> = {
  name: '证书名称', certNo: '证书编号', subType: '专业子类',
  holder: '持证人', issue: '发证机关', validTo: '有效期至',
};

export type CertDraft = {
  /** 来源标签（文件名 / 表格行号），核对时用于定位 */
  src: string;
  name: string;
  certNo: string;
  subType: string;
  holder: string;
  issue: string;
  /** 'YYYY-MM-DD'；长期有效为空串 */
  validTo: string;
  longTerm: boolean;
  /** 到期提前提醒天数 */
  remind: number;
  /** 字段级置信度 0~1：表格解析一律 1；照片识别按识别质量给。低于 0.9 在核对清单里标黄 */
  conf: Partial<Record<CertField, number>>;
  /** 认不出的原文（字段 → 原文），核对清单里提示人工确认 */
  bad: Partial<Record<CertField, string>>;
  /** 行级告警 */
  warns: string[];
  /** 表格里显式写了占用方式 / 上限时覆盖按子类的派生值 */
  mode?: 'single' | 'multi' | 'log';
  cap?: number;
  /** 持证补贴（仅人员证书；表格导入不带，手动新增时可填） */
  subsidy?: Cert['subsidy'];
};

/** 归属类型由子类派生（企业资质 / 人员证书），不单独问用户 */
export const ownerOf = (subType: string): '人员证书' | '企业资质' =>
  (CERT_SUBTYPE_META[subType]?.owner ?? '人员证书');

export const modeOf = (d: CertDraft) => d.mode ?? CERT_SUBTYPE_META[d.subType]?.mode ?? 'log';
export const capOf = (d: CertDraft) => d.cap ?? CERT_SUBTYPE_META[d.subType]?.cap ?? 1;

/**
 * 草稿 → 可入库的证书记录（id 由调用方生成，见 store.nextCertNos）。
 * ⚠️ warnDays / status 是**存储值**，必须与 validTo 一起写；
 *    长期有效的证书 validTo 为空串、warnDays 为 0、status 为「正常」。
 */
export function draftToCert(d: CertDraft, id: string): Cert {
  const owner = ownerOf(d.subType);
  const validTo = d.longTerm ? '' : d.validTo;
  return {
    id,
    certNo: d.certNo,
    name: d.name,
    type: owner,
    subType: d.subType,
    holder: d.holder,
    holderId: owner === '企业资质' ? 'COMPANY' : '',
    mode: modeOf(d),
    validTo,
    warnDays: d.longTerm ? 0 : certWarnDays(validTo),
    cap: capOf(d),
    used: [],
    status: d.longTerm ? '正常' : certStatusOf(validTo),
    issue: d.issue,
    longTerm: d.longTerm || undefined,
    remind: d.remind,
    subsidy: d.subsidy,
  };
}

/* ============================ 二、台账表格 → 草稿 ============================ */

/**
 * 表头别名表。匹配时**按别名长度降序**试，
 * 否则「证书编号」会被更短的「证书」先吃掉，整列错位。
 */
const HEAD_ALIAS: [string, string][] = [
  ['证书名称', 'name'], ['证书全称', 'name'], ['证书', 'name'], ['名称', 'name'],
  ['证书编号', 'certNo'], ['证书号', 'certNo'], ['证号', 'certNo'],
  ['专业子类', 'subType'], ['专业类别', 'subType'], ['子类', 'subType'], ['专业', 'subType'],
  ['持证人员', 'holder'], ['持证人', 'holder'], ['持有人', 'holder'], ['姓名', 'holder'],
  ['发证机关', 'issue'], ['发证单位', 'issue'], ['发证机构', 'issue'], ['颁发机构', 'issue'],
  ['有效期至', 'validTo'], ['有效期到', 'validTo'], ['截止日期', 'validTo'], ['到期日', 'validTo'], ['有效期', 'validTo'],
  ['占用方式', 'mode'], ['并行上限', 'cap'], ['占用上限', 'cap'], ['并行占用上限', 'cap'],
];

/** 归一化表头单元格：去空白与常见分隔符，便于包含匹配 */
const normHead = (s: string) => s.replace(/[\s·・:：()（）\-_/]/g, '');

/** 表头行 → 列号映射（列号 → 字段名） */
function mapHead(row: string[]): Record<string, number> {
  const byLen = [...HEAD_ALIAS].sort((a, b) => b[0].length - a[0].length);
  const out: Record<string, number> = {};
  row.forEach((cell, i) => {
    const h = normHead(cell);
    if (!h) return;
    for (const [alias, field] of byLen) {
      if (h.includes(alias)) { if (!(field in out)) out[field] = i; return; }
    }
  });
  return out;
}

/** 日期归一化：2027-06-30 / 2027/6/30 / 2027.6.30 / 2027年6月30日 → 'YYYY-MM-DD' */
function normDate(raw: string): { date: string; longTerm: boolean; bad: boolean } {
  const s = raw.trim();
  if (!s || /^[—–\-/·]+$/.test(s)) return { date: '', longTerm: false, bad: false };
  if (/长期|永久|不限|无期限/.test(s)) return { date: '', longTerm: true, bad: false };
  const m = /(\d{4})\s*[-/.年]\s*(\d{1,2})\s*[-/.月]\s*(\d{1,2})/.exec(s);
  if (!m) return { date: '', longTerm: false, bad: true };
  const mm = String(Number(m[2])).padStart(2, '0');
  const dd = String(Number(m[3])).padStart(2, '0');
  return { date: `${m[1]}-${mm}-${dd}`, longTerm: false, bad: false };
}

/**
 * 子类归一化：现场表里写的是完整证书名（「消防设施工程专业承包（二级）」），
 * 要收敛到字典里的 10 个子类。按关键词长度降序试，避免短词先命中。
 */
const SUBTYPE_HINT: [string, string][] = [
  ['注册消防工程师', '注册消防工程师'], ['消防工程师', '注册消防工程师'],
  ['安全生产考核合格证', 'B证'], ['B类', 'B证'], ['B证', 'B证'],
  ['建构筑物消防员', '建构筑物消防员'], ['消防设施操作员', '建构筑物消防员'], ['消防员', '建构筑物消防员'],
  ['安全生产许可证', '安许'], ['安许', '安许'],
  ['维护保养', '维护保养资质'], ['维保资质', '维护保养资质'], ['检测资质', '维护保养资质'],
  ['专业承包', '施工资质'], ['总承包', '施工资质'], ['施工资质', '施工资质'],
  ['设计资质', '设计资质'],
  ['建造师', '建造师'],
  ['电工', '电工'], ['焊工', '焊工'],
];

function normSubType(raw: string): { subType: string; bad: boolean } {
  const s = raw.trim();
  if (!s) return { subType: '', bad: false };
  const exact = (CERT_SUBTYPES as readonly string[]).find((x) => x === s);
  if (exact) return { subType: exact, bad: false };
  const byLen = [...SUBTYPE_HINT].sort((a, b) => b[0].length - a[0].length);
  for (const [hint, val] of byLen) if (s.includes(hint)) return { subType: val, bad: false };
  return { subType: '', bad: true };
}

const MODE_ALIAS: [string, 'single' | 'multi' | 'log'][] = [
  ['一证一项目', 'single'], ['single', 'single'], ['独占', 'single'],
  ['多项目', 'multi'], ['multi', 'multi'],
  ['按次', 'log'], ['log', 'log'],
];
const normMode = (raw: string) => {
  const s = raw.trim().toLowerCase();
  if (!s) return undefined;
  for (const [hint, v] of MODE_ALIAS) if (s.includes(hint.toLowerCase())) return v;
  return undefined;
};

export type CertGrid = { drafts: CertDraft[]; warns: string[] };

/**
 * 台账表格 → 草稿。
 * 表头按内容定位（找同时含「证书名称」与「证书编号 / 有效期 / 持证人」之一的行），
 * 因此标题行、说明行、空行多几行都不影响。
 */
export function parseCertGrid(grid: string[][], srcLabel = '表格'): CertGrid {
  const warns: string[] = [];
  if (!grid.length) throw new Error('表格是空的，没有读到任何内容');

  /* --- 1. 找表头行：必须认出「证书名称」，且另外还认出至少一列 --- */
  let headIdx = -1;
  let cols: Record<string, number> = {};
  for (let i = 0; i < Math.min(grid.length, 12); i++) {
    const m = mapHead(grid[i]);
    if ('name' in m && ('certNo' in m || 'validTo' in m || 'holder' in m)) { headIdx = i; cols = m; break; }
  }
  if (headIdx < 0) {
    throw new Error('没找到表头行。表格里至少要有「证书名称」，以及「证书编号 / 有效期至 / 持证人」中的一列（见导入说明的格式示意）');
  }
  if (!('validTo' in cols)) warns.push('表里没有「有效期至」列，导入的证书有效期将为空 —— 请在核对清单里逐条补上，或按长期有效处理');
  if (!('certNo' in cols)) warns.push('表里没有「证书编号」列，无法按编号去重；请在核对清单里补上编号，否则重复导入会新增重复记录');
  if (!('subType' in cols)) warns.push('表里没有「专业子类」列 —— 子类决定归属类型与占用方式，需在核对清单里逐条选择');
  if (!('holder' in cols)) warns.push('表里没有「持证人」列 —— 人员证书必须有持证人，需在核对清单里逐条补上');

  const cell = (r: string[], field: string) => (cols[field] === undefined ? '' : (r[cols[field]] ?? '').trim());

  /* --- 2. 数据行 --- */
  const drafts: CertDraft[] = [];
  for (let i = headIdx + 1; i < grid.length; i++) {
    const r = grid[i];
    const name = cell(r, 'name');
    if (!name || /^(证书名称|名称|合计|小计)$/.test(name)) continue;

    const bad: Partial<Record<CertField, string>> = {};
    const rowWarns: string[] = [];

    const st = normSubType(cell(r, 'subType'));
    if (st.bad) bad.subType = cell(r, 'subType');

    const dt = normDate(cell(r, 'validTo'));
    if (dt.bad) bad.validTo = cell(r, 'validTo');

    /* 只在「列存在但单元格为空」时标 bad —— 整列缺失由上面的 warns 统一提示，避免逐行刷屏 */
    const certNo = cell(r, 'certNo');
    if ('certNo' in cols && !certNo) bad.certNo = '空';
    const holder = cell(r, 'holder');
    if ('holder' in cols && !holder) bad.holder = '空';
    const issue = cell(r, 'issue');
    if ('issue' in cols && !issue) bad.issue = '空';

    if (st.subType === '' && !st.bad) {
      rowWarns.push('未填专业子类 —— 子类决定归属类型与占用方式，必须选择');
    }
    if (!dt.date && !dt.longTerm && !dt.bad) {
      rowWarns.push('有效期为空 —— 请确认是「长期有效」还是漏填');
    }
    if (dt.date && certStatusOf(dt.date) === '已过期') {
      rowWarns.push(`有效期 ${dt.date} 已过期，请确认是否为历史证书`);
    }

    const capRaw = Number(cell(r, 'cap'));

    drafts.push({
      src: `${srcLabel} 第 ${i + 1} 行`,
      name,
      certNo,
      subType: st.subType,
      holder,
      issue,
      validTo: dt.date,
      longTerm: dt.longTerm,
      remind: 30,
      conf: {},
      bad,
      warns: rowWarns,
      mode: normMode(cell(r, 'mode')),
      cap: Number.isFinite(capRaw) && capRaw > 0 ? capRaw : undefined,
    });
  }
  if (!drafts.length) throw new Error('表头下面没有读到证书，请确认数据从「证书名称」那一行开始');

  return { drafts, warns };
}

/* ============================ 三、证书照片识别（模拟） ============================ */

type OcrSample = Omit<CertDraft, 'src' | 'conf'> & {
  conf: Partial<Record<CertField, number>>;
  /** 文件名里出现这些词就优先匹配这份样例 */
  fileHints: string[];
};

/**
 * 内置样例证书 —— 覆盖 4 种核对场景：
 *   ① 与台账已有证书**同编号**（触发重复检测，默认跳过）
 *   ② 含**低置信字段**（核对清单标黄，提示人工确认）
 *   ③ **已过期**（提示确认是否历史证书）
 *   ④ **长期有效**（validTo 为空）
 */
const OCR_SAMPLES: OcrSample[] = [
  {
    name: '一级注册消防工程师', certNo: 'XF1012025000431', subType: '注册消防工程师',
    holder: '张工', issue: '云南省消防救援总队', validTo: '2026-10-20', longTerm: false, remind: 30,
    conf: { name: 1, certNo: 1, subType: 1, holder: 1, issue: 0.96, validTo: 0.82 },
    bad: {}, warns: ['有效期识别置信度偏低（照片反光），已按 2026-10-20 预填，请对照原件确认'],
    fileHints: ['消防工程师', '注册消防'],
  },
  {
    name: '安全生产许可证', certNo: '（云）JZ安许证字〔2024〕000318', subType: '安许',
    holder: '诺盾博达消防科技有限公司', issue: '云南省住建厅', validTo: '2027-09-10', longTerm: false, remind: 60,
    conf: { name: 1, certNo: 0.94, subType: 1, holder: 1, issue: 1, validTo: 0.97 },
    bad: {}, warns: [],
    fileHints: ['安许', '安全生产许可'],
  },
  {
    name: '注册建造师（机电工程 · 二级）', certNo: '云2222024009012', subType: '建造师',
    holder: '周工', issue: '住建部', validTo: '2028-03-31', longTerm: false, remind: 90,
    conf: { name: 1, certNo: 1, subType: 0.78, holder: 1, issue: 1, validTo: 1 },
    bad: {}, warns: ['专业子类识别置信度偏低（证件上写的是「机电工程」），请确认应归入哪个子类'],
    fileHints: ['建造师'],
  },
  {
    name: '建构筑物消防员（中级）', certNo: 'JZ20250318-4402', subType: '建构筑物消防员',
    holder: '郑工', issue: '应急管理部', validTo: '', longTerm: true, remind: 0,
    conf: { name: 1, certNo: 1, subType: 1, holder: 1, issue: 1, validTo: 0.62 },
    bad: {}, warns: ['未识别到有效期，按「长期有效」处理，请确认证件上是否确实没有到期日'],
    fileHints: ['建构筑物', '消防员', '操作员'],
  },
  {
    name: '焊工操作证', certNo: '', subType: '焊工',
    holder: '何工', issue: '应急管理部', validTo: '2026-08-15', longTerm: false, remind: 30,
    conf: { name: 1, certNo: 0, subType: 1, holder: 1, issue: 1, validTo: 0.91 },
    bad: { certNo: '字迹模糊' },
    warns: ['证书编号未识别出来（证件塑封反光），请手工补填；该证已过期，请确认是否为历史证书'],
    fileHints: ['焊工'],
  },
  {
    name: '消防设施工程专业承包（二级）', certNo: 'YJZ2024-SG0221', subType: '施工资质',
    holder: '诺盾博达消防科技有限公司', issue: '云南省住建厅', validTo: '2027-02-28', longTerm: false, remind: 60,
    conf: { name: 1, certNo: 0.71, subType: 1, holder: 1, issue: 1, validTo: 1 },
    bad: {}, warns: ['证书编号识别置信度偏低，请对照原件逐位确认'],
    fileHints: ['专业承包', '施工资质', '资质'],
  },
];

/** 样例用尽时的兜底：只按文件名预填名称，其余留空并整体低置信 —— 明确告诉用户这张没认出来 */
function fallbackDraft(f: File): CertDraft {
  const name = f.name.replace(/\.[^.]+$/, '').replace(/[_\-.]+/g, ' ').trim();
  return {
    src: f.name,
    name,
    certNo: '', subType: '', holder: '', issue: '', validTo: '', longTerm: false, remind: 30,
    conf: { name: 0.5, certNo: 0, subType: 0, holder: 0, issue: 0, validTo: 0 },
    bad: { certNo: '未识别', subType: '未识别', holder: '未识别', issue: '未识别', validTo: '未识别' },
    warns: ['这张照片没有识别出证书要素，已按文件名预填名称，其余请手工补全'],
  };
}

/** 模拟识别耗时：让「正在识别…」有真实体感。⚠️ 接真实 OCR 时删掉这段即可 */
const OCR_DELAY_PER_FILE = 260;
const OCR_DELAY_MAX = 1400;

/**
 * 证书照片 / 扫描件 → 草稿（模拟识别）。
 *
 * 分配顺序很关键，分三轮：
 *   ① 文件名能对上样例的**先占位** —— 否则「无名照片」会把带关键词的文件该拿的样例抢走
 *      （实测踩过：未知照片-1.png 抢了「焊工」样例，真叫 焊工操作证.png 的反倒拿了「施工资质」）
 *   ② 剩下的按顺序补空位
 *   ③ 样例用尽走兜底模板
 */
export async function recognizeCertImages(files: File[]): Promise<CertDraft[]> {
  const delay = Math.min(files.length * OCR_DELAY_PER_FILE, OCR_DELAY_MAX);
  if (delay) await new Promise((r) => setTimeout(r, delay));

  const used = new Set<number>();
  const assign: (number | null)[] = files.map(() => null);

  /* ① 有文件名线索的先占 */
  files.forEach((f, i) => {
    const low = f.name.toLowerCase();
    const idx = OCR_SAMPLES.findIndex((s, k) => !used.has(k) && s.fileHints.some((h) => low.includes(h.toLowerCase())));
    if (idx >= 0) { used.add(idx); assign[i] = idx; }
  });
  /* ② 其余按顺序补空位 */
  files.forEach((f, i) => {
    if (assign[i] !== null) return;
    const idx = OCR_SAMPLES.findIndex((_, k) => !used.has(k));
    if (idx >= 0) { used.add(idx); assign[i] = idx; }
  });

  return files.map((f, i) => {
    const idx = assign[i];
    if (idx === null) return fallbackDraft(f);
    const { fileHints: _h, ...s } = OCR_SAMPLES[idx];
    return { ...s, src: f.name };
  });
}

/* ============================ 四、统一入口 ============================ */

export type CertImportResult = { drafts: CertDraft[]; skipped: string[] };

/** 一次选择里可以混传表格与照片：表格走解析，照片走识别，不支持的格式进 skipped */
export async function readCertFiles(files: File[]): Promise<CertImportResult> {
  const drafts: CertDraft[] = [];
  const skipped: string[] = [];
  const images: File[] = [];

  for (const f of files) {
    if (isTableFile(f.name)) {
      try {
        const g = parseCertGrid(await readTableFile(f), f.name);
        drafts.push(...g.drafts);
        g.warns.forEach((w) => skipped.push(`${f.name}：${w}`));
      } catch (e) {
        skipped.push(`${f.name}：${e instanceof Error ? e.message : '解析失败'}`);
      }
    } else if (isImageFile(f.name)) {
      images.push(f);
    } else {
      skipped.push(`${f.name}：不支持的格式（支持 .xlsx / .xlsm / .csv / .txt 与图片扫描件）`);
    }
  }
  if (images.length) drafts.push(...(await recognizeCertImages(images)));

  if (!drafts.length) {
    throw new Error(skipped.length ? skipped.join('；') : '没有读到任何证书，请检查文件内容');
  }
  return { drafts, skipped };
}
