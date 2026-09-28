// 考勤记录表识别（业务层）
//
// 通用的「文件 → 二维网格」在 components/xlsx.ts；本文件只负责把网格认成考勤记录。
//
// 识别目标（与现场用的《考勤记录表》一致）：
//   第 1 行  标题        阳宗海消防改造项目考勤记录表
//   第 2 行  月份 + 符号说明   月份：2026年8月   （"√"表示出勤1天，"半"表示出勤0.5天…）
//   第 3 行  表头        序号 | 姓名 | 出勤天数 | 1 | 2 | … | 31
//   第 4 行起 数据        13 | 赵维维 | 23 | 假 | 假 | √ | …
// 为了容忍实际文件里的空行 / 多出的说明行，表头是「按内容找」而不是「按行号取」。

/* ============================ 符号归一化 ============================ */

/** 符号归一化：把现场各种写法收敛到 ATT_MARKS 的 6 个符号 */
const SYM: Record<string, string> = {
  '√': '√', '✓': '√', '✔': '√', 'v': '√', 'V': '√', 'y': '√', 'Y': '√', '对': '√',
  '半': '半', '0.5': '半', '.5': '半',
  '加': '加', '1.5': '加',
  '休': '休',
  '假': '假',
  '': '', '-': '', '—': '', '–': '', '·': '', '/': '', '空': '', '未': '',
};

export type ImpRow = {
  /** 文件里的序号（仅用于对照，不参与匹配） */
  no: string;
  name: string;
  /** 文件里写的「出勤天数」原值（可能是公式算好的数） */
  fileDays: string;
  /** 逐日符号：日号 → 符号 */
  marks: Record<number, string>;
  /** 该行里认不出来的符号（日号 + 原文） */
  bad: { d: number; raw: string }[];
};

export type ImpGrid = {
  /** 标题行去掉「考勤记录表」后的项目名（可能为空） */
  projName: string;
  /** 识别到的年月 'YYYY-MM'（可能为空） */
  ym: string;
  /** 该月天数（按表头里的日号取最大值） */
  days: number;
  rows: ImpRow[];
  /** 未阻断但需要提醒的事（如「表头里只有 1~30 天」） */
  warns: string[];
};

const isInt = (s: string) => /^\d{1,2}$/.test(s.trim());

/**
 * 从二维网格里识别考勤记录。
 * 表头按内容定位（找同时含「姓名」与「出勤天数」的行），因此标题行数、空行数变化都不影响。
 */
export function parseAttGrid(grid: string[][]): ImpGrid {
  const warns: string[] = [];
  if (!grid.length) throw new Error('表格是空的，没有读到任何内容');

  /* --- 1. 找表头行 --- */
  const headIdx = grid.findIndex((r) => r.some((c) => c.trim() === '姓名') && r.some((c) => c.trim() === '出勤天数'));
  if (headIdx < 0) {
    throw new Error('没找到表头行。请确认表格里有「姓名」和「出勤天数」两列（见导入说明的格式示意）');
  }
  const head = grid[headIdx];
  const nameCol = head.findIndex((c) => c.trim() === '姓名');

  /* --- 2. 日号列：表头里值为 1~31 的列 --- */
  const dayCols: { d: number; c: number }[] = [];
  head.forEach((c, i) => { if (isInt(c)) dayCols.push({ d: Number(c.trim()), c: i }); });
  if (!dayCols.length) throw new Error('没找到日期列（表头里应有 1、2、3 … 这样的日号）');
  const days = Math.max(...dayCols.map((x) => x.d));
  if (days < 28) warns.push(`表头里只到 ${days} 日，不足整月；未出现的日期按「未在现场」处理`);

  /* --- 3. 标题 / 月份：在表头之前找 --- */
  let projName = '';
  let ym = '';
  for (let i = 0; i < headIdx; i++) {
    const line = grid[i].map((c) => c.trim()).filter(Boolean).join(' ');
    const m = /(\d{4})\s*年\s*(\d{1,2})\s*月/.exec(line);
    if (m && !ym) ym = `${m[1]}-${String(Number(m[2])).padStart(2, '0')}`;
    /* 标题行：含「考勤」且不是那行符号说明 */
    if (!projName && /考勤/.test(line) && !/表示/.test(line)) {
      projName = line.replace(/考勤记录表|考勤表|考勤记录/g, '').replace(/[\s_—-]+$/, '').trim();
    }
  }

  /* --- 4. 数据行 --- */
  const rows: ImpRow[] = [];
  for (let i = headIdx + 1; i < grid.length; i++) {
    const r = grid[i];
    const name = (r[nameCol] ?? '').trim();
    if (!name || name === '姓名' || name === '合计') continue;
    const marks: Record<number, string> = {};
    const bad: { d: number; raw: string }[] = [];
    for (const { d, c } of dayCols) {
      const raw = (r[c] ?? '').trim();
      const sym = SYM[raw];
      if (sym === undefined) { bad.push({ d, raw }); continue; }
      if (sym) marks[d] = sym;
    }
    rows.push({
      no: (r[Math.max(0, nameCol - 1)] ?? '').trim(),
      name,
      fileDays: (r[nameCol + 1] ?? '').trim(),
      marks,
      bad,
    });
  }
  if (!rows.length) throw new Error('表头下面没有读到人员，请确认数据从「序号 / 姓名」那一行开始');

  return { projName, ym, days, rows, warns };
}

/** 出勤天数 = Σ 符号值（与页面口径一致；导入时用它复核文件里写死的天数） */
export function sumMarks(marks: Record<number, string>): number {
  let d = 0;
  for (const k of Object.keys(marks)) {
    const v = marks[Number(k)];
    d += v === '√' ? 1 : v === '半' ? 0.5 : v === '加' ? 1.5 : 0;
  }
  return Math.round(d * 10) / 10;
}
