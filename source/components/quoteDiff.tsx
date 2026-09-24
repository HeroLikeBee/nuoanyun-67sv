// 报价版本差异对比 · 共享组件
// 台账详情抽屉与独立详情页共用同一份「快照差异回放」逻辑：
// 旧版只读保留，按两版快照的明细行做真实差异回放（不变 / 改价 / 已删除 / 新增），
// 末尾补「区域上浮」与「明细基价合计」—— 数字全部可溯源到 data.ts 的 QUOTES.versions。
// 此前台账抽屉写死 [2,1] 卡片 + total*1.04 假金额、对比表写死 4 行静态行，
// 换一张报价单看到的还是同一份差异 —— 已废弃，统一走本组件。
import React from 'react';
import { fmt, verNo } from './data';
import type { QuoteVersion } from './data';

export type DiffRow = { name: string; v1: string; v2: string; chg: string; tone: 'warn' | 'gray' | 'danger' | 'info' | 'sum' };
const DIFF_TONE: Record<string, string> = { warn: 'var(--c-warning-deep)', gray: 'var(--ink-3)', danger: 'var(--c-danger-deep)', info: 'var(--c-primary)', sum: 'var(--c-warning-deep)' };

/** 行对齐键：优先物料编码 matId，无 matId 的手输行 / 包干行按「目录 + 名称」对齐（目录已与物料同源同一棵树） */
const dKey = (l: { matId?: string; catId?: string; name: string }) => l.matId || `${l.catId ?? ''}|${l.name}`;
const dAmt = (l: { qty: number; price: number }) => Math.round(l.qty * l.price);

/** 对比两版快照明细：逐行给出 不变 / 改价 / 已删除 / 新增，末尾补「区域上浮」与「明细基价合计」 */
export function buildDiff(prev: QuoteVersion, cur: QuoteVersion): DiffRow[] {
  const rows: DiffRow[] = [];
  const curMap = new Map(cur.lines.map((l) => [dKey(l), l]));
  const hit = new Set<string>();
  for (const l of prev.lines) {
    const k = dKey(l);
    const a = dAmt(l);
    const c = curMap.get(k);
    if (!c) { rows.push({ name: l.name, v1: fmt(a), v2: '—', chg: '已删除', tone: 'danger' }); continue; }
    hit.add(k);
    const b = dAmt(c);
    rows.push(a === b
      ? { name: l.name, v1: fmt(a), v2: fmt(b), chg: '不变', tone: 'gray' }
      : { name: l.name, v1: fmt(a), v2: fmt(b), chg: `${b > a ? '+' : '−'}${fmt(Math.abs(b - a))}`, tone: 'warn' });
  }
  for (const l of cur.lines) {
    if (hit.has(dKey(l))) continue;
    rows.push({ name: l.name, v1: '—', v2: fmt(dAmt(l)), chg: '新增', tone: 'info' });
  }
  if (prev.uplift !== cur.uplift) {
    rows.push({ name: '区域上浮', v1: `${prev.uplift}%`, v2: `${cur.uplift}%`, chg: cur.uplift > prev.uplift ? '上浮上调' : '上浮下调', tone: 'info' });
  }
  const curSum = cur.lines.reduce((a, l) => a + dAmt(l), 0);
  rows.push({
    name: '明细基价合计', v1: fmt(prev.amt), v2: fmt(curSum),
    chg: `${curSum >= prev.amt ? '+' : '−'}${fmt(Math.abs(curSum - prev.amt))}`, tone: 'sum',
  });
  return rows;
}

/** 两版排序（ver 升序）工具 */
export const sortVers = (list: QuoteVersion[]): QuoteVersion[] => [...list].sort((a, b) => verNo(a.ver) - verNo(b.ver));
/** 上一版快照：cur 之前最近的一版（无则 undefined） */
export const prevOf = (list: QuoteVersion[], cur: QuoteVersion) => {
  const sorted = sortVers(list);
  return sorted.filter((v) => verNo(v.ver) < verNo(cur.ver)).pop();
};

/** 差异回放表格（台账抽屉 / 详情页弹窗共用；只读） */
export function DiffTable({ prev, cur, title }: { prev: QuoteVersion; cur: QuoteVersion; title?: string }) {
  const rows = buildDiff(prev, cur);
  return (
    <>
      {title && (
        <div className="nc-cell-sub" style={{ margin: '4px 0 10px' }}>
          {title}
        </div>
      )}
      <table className="nc-tbl" style={{ minWidth: 700 }}>
        <thead>
          <tr>
            <th>明细项</th>
            <th style={{ width: 130 }} className="is-num">{prev.ver}</th>
            <th style={{ width: 130 }} className="is-num">{cur.ver}</th>
            <th style={{ width: 170 }}>变更</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={`${r.name}-${i}`}>
              <td>{r.name}</td>
              <td className="is-num">{r.v1}</td>
              <td className="is-num"><b className="num">{r.v2}</b></td>
              <td style={{ color: DIFF_TONE[r.tone], fontWeight: r.tone === 'sum' ? 600 : 400 }}>{r.chg}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
