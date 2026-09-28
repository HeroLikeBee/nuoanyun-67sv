// 报价编辑 · 本次改动对比（编辑草稿 vs 保存基线）
// 与 quoteDiff.tsx 的分工：
//   quoteDiff.tsx —— 两个「已落库的版本快照」互比（版本回放，台账抽屉 / 详情页用）
//   本组件        —— 「正在编辑的草稿」与「进入编辑时的已保存内容」互比（编辑页独有场景）
// 行身份刻意**不用**「编码 / 名称」对齐：编辑期把某行的名称或目录改掉之后，
// 按编码对齐会把它判成「删一行 + 加一行」——用户看到的不是「这行改了」而是两行陌生数据。
// 所以基线行与草稿行按载入时的行序（srcId）配对，改名称 / 改目录都如实归到「这一行」名下。
import React from 'react';
import { fmt } from './data';

/** 对比用的行视图：基线行与草稿行都归一成这个形状（字段名与落库口径一致） */
export type DiffLineView = {
  /** 基线行序（1-based）。草稿行没有它 = 本次新增行 */
  srcId?: number;
  /** 当前显示行号（1-based） */
  no: number;
  name: string;
  /** 物料编码（对应 QuoteLine.matId），手输行为空 */
  code?: string;
  catId: string;
  spec: string;
  unit: string;
  qty: number;
  cost: number;
  markup: number;
  note: string;
  /** 上浮单价（计价行 = 按口径试算价） */
  price: number;
  /** 金额 */
  amt: number;
};

export type FieldChange = { label: string; from: string; to: string };

export type EditChange = {
  kind: 'add' | 'del' | 'mod';
  key: string;
  no: number;
  name: string;
  code?: string;
  /** kind === 'mod' 时逐字段的原值 / 现值 */
  fields: FieldChange[];
  /** 金额差（现值 − 原值）；新增行 = +金额，删除行 = −金额 */
  delta: number;
};

export type EditDiffSummary = { add: number; del: number; mod: number; total: number; delta: number };

const n2 = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(2));
const txt = (v?: string) => (v && v.trim() ? v : '—');
const cat = (id: string, labelOf?: (id: string) => string) => (id ? (labelOf ? labelOf(id) : id) : '未指定');

/** 逐字段比对两行，只返回真正发生变化的字段（原值 / 现值） */
function cmpFields(b: DiffLineView, c: DiffLineView, labelOf?: (id: string) => string): FieldChange[] {
  const out: FieldChange[] = [];
  const push = (label: string, from: string, to: string) => { if (from !== to) out.push({ label, from, to }); };
  push('所属目录', cat(b.catId, labelOf), cat(c.catId, labelOf));
  push('名称', txt(b.name), txt(c.name));
  push('规格', txt(b.spec), txt(c.spec));
  push('单位', txt(b.unit), txt(c.unit));
  push('数量', n2(b.qty), n2(c.qty));
  push('成本参考价', fmt(b.cost), fmt(c.cost));
  push('上浮率', `${n2(b.markup)}%`, `${n2(c.markup)}%`);
  push('上浮单价', fmt(b.price), fmt(c.price));
  push('金额', fmt(b.amt), fmt(c.amt));
  push('备注', txt(b.note), txt(c.note));
  return out;
}

/**
 * 生成「本次改动清单」。
 * @param base  进入编辑时的已保存明细（归一化后的视图）；新建模式传空数组
 * @param cur   当前编辑草稿
 * @param labelOf 目录 id → 可读路径（页面传 catPath，不传则直接显示 id）
 */
export function buildEditDiff(base: DiffLineView[], cur: DiffLineView[], labelOf?: (id: string) => string): EditChange[] {
  const baseMap = new Map<number, DiffLineView>();
  base.forEach((b) => baseMap.set(b.srcId ?? b.no, b));
  const used = new Set<number>();
  const out: EditChange[] = [];

  cur.forEach((c) => {
    const b = c.srcId != null ? baseMap.get(c.srcId) : undefined;
    if (!b) {
      out.push({ kind: 'add', key: `add-${c.no}`, no: c.no, name: c.name, code: c.code, fields: [], delta: Math.round(c.amt) });
      return;
    }
    used.add(c.srcId!);
    const fields = cmpFields(b, c, labelOf);
    if (fields.length) {
      out.push({
        kind: 'mod', key: `mod-${c.no}`, no: c.no, name: c.name, code: c.code,
        fields, delta: Math.round(c.amt - b.amt),
      });
    }
  });

  base.forEach((b) => {
    const sid = b.srcId ?? b.no;
    if (used.has(sid)) return;
    out.push({ kind: 'del', key: `del-${sid}`, no: b.no, name: b.name, code: b.code, fields: [], delta: -Math.round(b.amt) });
  });

  return out;
}

export const summarize = (changes: EditChange[]): EditDiffSummary => ({
  add: changes.filter((c) => c.kind === 'add').length,
  del: changes.filter((c) => c.kind === 'del').length,
  mod: changes.filter((c) => c.kind === 'mod').length,
  total: changes.length,
  delta: changes.reduce((a, c) => a + c.delta, 0),
});

/** 行级改动映射：显示行号 → 该行的改动（供明细表就地标注，避免页面重算一遍） */
export function diffRowMap(base: DiffLineView[], cur: DiffLineView[], labelOf?: (id: string) => string): Map<number, EditChange> {
  const m = new Map<number, EditChange>();
  buildEditDiff(base, cur, labelOf).forEach((c) => { if (c.kind !== 'del') m.set(c.no, c); });
  return m;
}

/** 行级标注的悬浮说明：「数量 4 → 6；上浮率 25% → 20%」 */
export const changeTip = (c: EditChange): string => (
  c.kind === 'add' ? `本次新增行 · 金额 ${fmt(c.delta)}`
    : c.kind === 'del' ? `本次删除行 · 原金额 ${fmt(Math.abs(c.delta))}`
      : c.fields.map((f) => `${f.label} ${f.from} → ${f.to}`).join('；')
);

const KIND_CN: Record<string, string> = { add: '新增整行', del: '删除整行', mod: '内容修改' };
const KIND_TONE: Record<string, string> = {
  add: 'var(--c-primary)', del: 'var(--c-danger-deep)', mod: 'var(--c-warning-deep)',
};

/** 改动清单表格（只读）：一行 = 一个变更字段，多字段变更按行分组 */
export function EditDiffTable({ base, cur, labelOf }: {
  base: DiffLineView[]; cur: DiffLineView[]; labelOf?: (id: string) => string;
}) {
  const changes = buildEditDiff(base, cur, labelOf);
  if (!changes.length) {
    return <div className="nc-editdiff-empty">本次编辑尚未改动任何明细行 —— 数量 / 成本 / 上浮率 / 目录均与进入编辑时一致。</div>;
  }
  const sum = summarize(changes);
  return (
    <>
      <div className="nc-editdiff-sum">
        <span>共 <b className="num">{sum.total}</b> 处改动</span>
        {sum.add > 0 && <span>新增 <b className="num is-blue">{sum.add}</b> 行</span>}
        {sum.del > 0 && <span>删除 <b className="num is-red">{sum.del}</b> 行</span>}
        {sum.mod > 0 && <span>修改 <b className="num">{sum.mod}</b> 行</span>}
        <span>金额合计
          <b className={`num ${sum.delta >= 0 ? 'is-red' : 'is-green'}`}>
            {sum.delta >= 0 ? '+' : '−'}{fmt(Math.abs(sum.delta))}
          </b>
        </span>
      </div>
      <table className="nc-tbl nc-editdiff-tbl" style={{ minWidth: 780 }}>
        <thead>
          <tr>
            <th style={{ width: 46 }} className="is-num">行</th>
            <th style={{ width: 250 }}>明细项</th>
            <th style={{ width: 90 }}>变更</th>
            <th style={{ width: 100 }}>字段</th>
            <th style={{ width: 160 }}>原来</th>
            <th style={{ width: 160 }}>现在</th>
          </tr>
        </thead>
        <tbody>
          {changes.map((c) => {
            const rows: FieldChange[] = c.kind === 'mod'
              ? c.fields
              : [{
                label: c.kind === 'add' ? '整行新增' : '整行删除',
                from: c.kind === 'add' ? '—' : fmt(Math.abs(c.delta)),
                to: c.kind === 'add' ? fmt(c.delta) : '—',
              }];
            return rows.map((f, i) => (
              <tr key={`${c.key}-${i}`} className={`nc-chg-row is-${c.kind}${i === 0 ? ' is-first' : ''}`}>
                {i === 0 && <td rowSpan={rows.length} className="is-num">{c.no}</td>}
                {i === 0 && (
                  <td rowSpan={rows.length}>
                    <div className="nc-chg-name">{c.name}</div>
                    <div className="nc-cell-sub">{c.code || '手输行'}</div>
                  </td>
                )}
                {i === 0 && <td rowSpan={rows.length} className="nc-chg-kind" style={{ color: KIND_TONE[c.kind] }}>{KIND_CN[c.kind]}</td>}
                <td className="nc-cell-sub">{f.label}</td>
                <td className="is-num nc-chg-from">{f.from}</td>
                <td className="is-num"><b className="num">{f.to}</b></td>
              </tr>
            ));
          })}
        </tbody>
      </table>
    </>
  );
}
