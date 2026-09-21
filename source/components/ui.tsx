// 诺安云 6.0 · 共享 UI 组件（严格遵循 src/themes/nuoan-cloud/DESIGN.md token）
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Ico } from './icons';
import { canSeeMoney, fmt, fmtWan } from './data';
import { setFocus } from './store';

/* ============================ Toast ============================ */
type ToastFn = (msg: string, tone?: 'ok' | 'err') => void;
const ToastCtx = createContext<ToastFn>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [msg, setMsg] = useState<{ text: string; tone: string } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const push: ToastFn = useCallback((text, tone = 'ok') => {
    setMsg({ text, tone });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMsg(null), tone === 'err' ? 5000 : 3000);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      {msg && <div className={`nc-toast is-show ${msg.tone === 'err' ? 'nc-toast-err' : 'nc-toast-ok'}`}>{msg.tone === 'err' ? ' ' : ' '}{msg.text}</div>}
    </ToastCtx.Provider>
  );
}

/* ============================ 基础 ============================ */
export type TagTone = 'blue' | 'green' | 'orange' | 'red' | 'gray' | 'purple' | 'link' | 'solid' | 'gold';
export function Tag({ tone = 'gray', pill, children }: { tone?: TagTone; pill?: boolean; children: React.ReactNode }) {
  return <span className={`nc-tag nc-tag-${tone}${pill ? ' nc-tag-pill' : ''}`}>{children}</span>;
}
export function Dot({ tone = 'gray' }: { tone?: 'red' | 'orange' | 'green' | 'gray' }) {
  return <span className={`nc-dot nc-dot-${tone}`} />;
}
export function Code({ children }: { children: React.ReactNode }) {
  return <span className="nc-code">{children}</span>;
}

/**
 * 实体穿透链接：把关联实体名（客户 / 项目 / 合同 / 报价 / 商机 …）渲染为可点击文本。
 * 点击行为：① 记录目标页要聚焦的实体 ID → ② 跳转到目标页并打开其详情。
 * 用途：列表单元格、详情抽屉、Tab 内的关联实体，统一由此实现「层层下钻」。
 *
 * 注意：置于表格行内时需阻止冒泡，避免同时触发行点击。
 */
export function EntityLink({ target, id, go, children, title, strong }: {
  /** 目标页面 ID（PAGE_META 的 key，如 'customer' / 'project-center'） */
  target: string;
  /** 目标实体 ID（供目标页 getFocus 定位） */
  id?: string;
  /** 路由跳转函数（各页从 props 透传的 go） */
  go: (pageId: string) => void;
  children: React.ReactNode;
  title?: string;
  /** 是否加粗（用于主字段） */
  strong?: boolean;
}) {
  const onClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (id) setFocus(target, id);
    go(target);
  };
  return (
    <span
      className={`nc-link${strong ? ' is-strong' : ''}`}
      role="link"
      tabIndex={0}
      title={title || '查看详情'}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(e as unknown as React.MouseEvent); }}
    >{children}</span>
  );
}

/**
 * 帮助提示：字段 / 区块旁的 ? 图标，鼠标悬停显示规则解释。
 * 用于承接原先常驻在页面上的规则说明长文，避免正文被大段文字淹没。
 */
export function Tip({ text, w }: { text: React.ReactNode; w?: number }) {
  return (
    <span className="nc-tip" tabIndex={0} role="note" aria-label="说明">
      <Ico n="help" size={13} />
      <span className="nc-tip-pop" style={w ? { width: w } : undefined}>{text}</span>
    </span>
  );
}

/**
 * 评审 G2：金额脱敏原子组件（A-02 口径）
 * 无金额查看权限的角色（销售 / 行政）统一显示「—」，避免各页各自实现导致口径漂移。
 * 用法：<Money v={row.amt} role={role} />  ·  wan=true 时按万元格式化。
 */
export function Money({ v, role, wan, className }: {
  v: number | string; role: string; wan?: boolean; className?: string;
}) {
  const can = canSeeMoney(role);
  const num = typeof v === 'number' ? v : Number(v || 0);
  const text = can ? (wan ? fmtWan(num) : fmt(num)) : '—';
  return (
    <span className={['num', className].filter(Boolean).join(' ')}
      title={can ? undefined : '当前角色无金额查看权限（A-02 口径）'}>{text}</span>
  );
}

type BtnKind = 'default' | 'primary' | 'danger' | 'ghost' | 'link';
/**
 * 评审 I2：全站无加载态，已明确「后台处理」的操作（OCR 识别 / 打包 ZIP / 批量审批 / 批量导入）
 * 点击后无任何进行中反馈，用户会重复点击。Btn 现内置 loading：
 * 展示 spinner 并自动禁用，形成防重复提交锁。
 */
export function Btn({ kind = 'default', size, disabled, danger, loading, onClick, children, title }: {
  kind?: BtnKind; size?: 'sm' | 'lg'; disabled?: boolean; danger?: boolean; loading?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void; children: React.ReactNode; title?: string;
}) {
  const cls = ['nc-btn'];
  if (kind === 'primary') cls.push('nc-btn-primary');
  if (kind === 'danger' || danger) cls.push('nc-btn-danger');
  if (kind === 'ghost') cls.push('nc-btn-ghost');
  if (kind === 'link') cls.push('nc-btn-link');
  if (size === 'sm') cls.push('nc-btn-sm');
  if (size === 'lg') cls.push('nc-btn-lg');
  if (loading) cls.push('is-loading');
  return (
    <button className={cls.join(' ')} disabled={disabled || loading} title={title} onClick={onClick}>
      {loading && <span className="nc-btn-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function Op({ danger, gold, disabled, onClick, children, title }: {
  danger?: boolean; gold?: boolean; disabled?: boolean; onClick?: () => void; children: React.ReactNode; title?: string;
}) {
  return (
    <button className={`nc-op${danger ? ' is-danger' : ''}${gold ? ' is-gold' : ''}`} disabled={disabled} title={title} onClick={onClick}>{children}</button>
  );
}
export function OpSep() { return <span className="nc-op-sep">·</span>; }

/* ============================ 卡片 / 分区 ============================ */
export function Card({ flush, hd, extra, children, style }: {
  flush?: boolean; hd?: React.ReactNode; extra?: React.ReactNode; children?: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <section className={`nc-card${flush ? ' is-flush' : ''}`} style={style}>
      {hd && <div className="nc-card-hd"><h3>{hd}</h3>{extra && <div className="nc-card-hd-extra">{extra}</div>}</div>}
      {children && <div className={flush ? '' : 'nc-card-bd'}>{children}</div>}
    </section>
  );
}

export function SectionTitle({ children, extra }: { children: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
      <h3 className="nc-sec-title">{children}</h3>
      {extra && <div style={{ marginLeft: 'auto' }}>{extra}</div>}
    </div>
  );
}

/**
 * 评审 P0-6 · 可点击元素三条铁律的落地工具。
 *
 * 铁律①：能用原生就用原生（button / a）；
 * 铁律②：不得不用 div / span 承载点击时，必须补齐 role + tabIndex + onKeyDown 三件套；
 * 铁律③：全局 :focus-visible 焦点环已在 style.css 兜底。
 *
 * 把「补三件套」集中到这一个函数，避免每个组件各写一遍导致口径再次漂移。
 * 用法：<div {...pressProps(onClick)}>…，onClick 为空时不附加任何语义（保持静态元素）。
 */
export function pressProps(onClick?: () => void) {
  if (!onClick) return {};
  return {
    role: 'button' as const,
    tabIndex: 0,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
    },
  };
}

/* ============================ 指标卡 ============================ */
export function Kpi({ label, value, sub, tone, drill, onClick, locked, note }: {
  label: React.ReactNode; value: React.ReactNode; sub?: React.ReactNode;
  tone?: 'red' | 'orange' | 'green' | 'blue'; drill?: boolean; onClick?: () => void; locked?: boolean; note?: string;
}) {
  return (
    <div className={`nc-kpi${onClick ? ' is-clickable' : ''}`} onClick={onClick} title={note} {...pressProps(onClick)}>
      <div className="nc-kpi-label">
        {label}
        {locked && <span className="nc-locked"><Ico n="lock" size={16} /> 无权限</span>}
        {drill && <span className="nc-kpi-drill">穿透 ↗</span>}
      </div>
      <div className={`nc-kpi-value num${tone ? ` nc-v-${tone}` : ''}`}>{locked ? <span className="nc-v-muted">—</span> : value}</div>
      {sub && <div className="nc-kpi-sub">{sub}</div>}
    </div>
  );
}

/* ============================ 提示条 / 提醒 ============================ */
export function Banner({ tone = 'info', actions, children }: {
  tone?: 'info' | 'gold' | 'warn' | 'danger' | 'ok'; actions?: React.ReactNode; children: React.ReactNode;
}) {
  return <div className={`nc-banner nc-banner-${tone}`}><div style={{ flex: 1, minWidth: 0 }}>{children}</div>{actions && <div className="nc-banner-actions">{actions}</div>}</div>;
}

export function Alert({ icon, title, sub, op, tone }: { icon: React.ReactNode; title: React.ReactNode; sub?: React.ReactNode; op?: React.ReactNode; tone?: 'warn' | 'danger' }) {
  return (
    <div className="nc-alert" style={tone === 'danger' ? { background: 'var(--c-danger-bg)', borderColor: 'var(--c-danger-border)' } : undefined}>
      <span className="nc-alert-ic">{icon}</span>
      <div className="nc-alert-bd"><div className="nc-alert-t">{title}</div>{sub && <div className="nc-alert-s">{sub}</div>}</div>
      {op && <div className="nc-alert-op">{op}</div>}
    </div>
  );
}

/* ============================ 筛选 ============================ */
export function ChipRow({ label, options, value, onChange, width }: {
  label?: string; options: { key: string; label: string; cnt?: number }[];
  value: string; onChange: (key: string) => void; width?: number;
}) {
  return (
    <div className="nc-chip-row">
      {label && <span className="nc-chip-lbl" style={width ? { width } : undefined}>{label}</span>}
      {options.map((o) => (
        <button key={o.key} className={`nc-fchip${value === o.key ? ' is-on' : ''}`} onClick={() => onChange(o.key)}>
          {o.label}{o.cnt != null && <span className="nc-chip-cnt">{o.cnt}</span>}
        </button>
      ))}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder, width }: {
  value: string; onChange: (v: string) => void; placeholder?: string; width?: number;
}) {
  return (
    <div className="nc-search" style={width ? { width } : undefined}>
      <svg className="nc-search-ico" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
      <input value={value} placeholder={placeholder || '搜索'} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** 工具栏式筛选行：关键词 + N 个下拉 + 查询/重置（用于还原截图的单行筛选） */
export function FilterBar({ children, onQuery, onReset, ops }: {
  children: React.ReactNode; onQuery?: () => void; onReset?: () => void; ops?: React.ReactNode;
}) {
  return (
    <div className="nc-filterbar">
      {children}
      <div className="nc-filterbar-ops">
        <Btn kind="primary" size="sm" onClick={onQuery}>查询</Btn>
        <Btn size="sm" onClick={onReset}>重置</Btn>
        {ops}
      </div>
    </div>
  );
}

/** 单个筛选字段（label + select/input），用于 FilterBar 内 */
export function FField({ label, children, width }: { label: string; children: React.ReactNode; width?: number }) {
  return (
    <div className="nc-ffield" style={width ? { width } : undefined}>
      <span className="nc-ffield-lbl">{label}</span>
      {children}
    </div>
  );
}

/* ============================ 表单 ============================ */
export function Field({ label, req, err, note, tip, tipW, warn, span, children, extra }: {
  label: string; req?: boolean; err?: string; note?: string;
  /** 字段帮助提示：显示 ? 图标，hover 展示规则解释（替代常驻长文） */
  tip?: React.ReactNode; tipW?: number;
  warn?: boolean; span?: 2 | 3 | 4; children: React.ReactNode; extra?: React.ReactNode;
}) {
  return (
    <div className={`nc-field${span === 2 ? ' nc-field-2' : ''}${span === 3 ? ' nc-field-3' : ''}${span === 4 ? ' nc-field-4' : ''}${err ? ' has-err' : ''}`}>
      <div className={`nc-field-label${req ? ' is-req' : ''}`}>{label}{tip && <Tip text={tip} w={tipW} />}{extra}</div>
      {children}
      {err && <div className="nc-field-err">{err}</div>}
      {note && !err && <div className={`nc-field-note${warn ? ' is-warn' : ''}`}>{note}</div>}
    </div>
  );
}

export function Collapse({ title, open, onToggle, badge, children }: {
  title: React.ReactNode; open: boolean; onToggle: () => void; badge?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <>
      <button className={`nc-collapse-hd${open ? ' is-open' : ''}`} onClick={onToggle}>
        <span>{title}</span>{badge}
        <span className="nc-collapse-arrow">▾</span>
      </button>
      {open && <div className="nc-collapse-bd">{children}</div>}
    </>
  );
}

/* ============================ 表格 ============================ */
export type Col<T> = {
  key: string; title: string; width?: number;
  align?: 'left' | 'right' | 'center';
  /** 宽表横向滚动时吸附：left 常驻首列 / right 常驻末列 */
  sticky?: 'left' | 'right';
  render?: (row: T) => React.ReactNode;
};
export function DataTable<T extends Record<string, unknown>>({
  cols, rows, rowKey, rowClass, onRowClick, foot, empty, emptyCta, minWidth = 900, selectable, selected, onSelectAll, onSelectRow,
}: {
  cols: Col<T>[]; rows: T[]; rowKey: (row: T) => string;
  rowClass?: (row: T) => string; onRowClick?: (row: T) => void;
  foot?: React.ReactNode; empty?: string; emptyCta?: React.ReactNode; minWidth?: number;
  selectable?: boolean; selected?: string[]; onSelectAll?: (ids: string[]) => void; onSelectRow?: (id: string) => void;
}) {
  if (!rows.length) {
    return (
      <div className="nc-empty">
        <div className="nc-empty-ico"><Ico n="folder" size={34} /></div>
        <div>/ 没有符合条件的记录</div>
        {empty && <div>{empty}</div>}
        {emptyCta && <div>{emptyCta}</div>}
      </div>
    );
  }
  const allOn = selectable && selected && rows.length > 0 && rows.every((r) => selected.includes(rowKey(r)));
  const headCols = selectable
    ? [{ key: '__chk', title: '', width: 40 }, ...cols]
    : cols;
  return (
    <div className="nc-tbl-wrap">
      <table className="nc-tbl" style={{ minWidth }}>
        <thead>
          <tr>{headCols.map((c) => (
            <th key={c.key} style={{ width: c.width, textAlign: c.align }} className={[c.align === 'right' ? 'is-num' : c.align === 'center' ? 'is-center' : '', c.sticky ? `is-sticky-${c.sticky === 'left' ? 'l' : 'r'}` : ''].filter(Boolean).join(' ')}>
              {c.key === '__chk' && selectable ? (
                <input type="checkbox" className="nc-check" checked={!!allOn} onChange={() => onSelectAll?.(allOn ? [] : rows.map(rowKey))} />
              ) : c.title}
            </th>
          ))}</tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const id = rowKey(r);
            return (
              <tr key={id} className={rowClass ? rowClass(r) : ''} onClick={onRowClick ? () => onRowClick(r) : undefined} style={onRowClick ? { cursor: 'pointer' } : undefined}>
                {selectable && (
                  <td onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" className="nc-check" checked={!!selected?.includes(id)} onChange={() => onSelectRow?.(id)} />
                  </td>
                )}
                {cols.map((c) => (
                  <td key={c.key} className={[c.align === 'right' ? 'is-num' : c.align === 'center' ? 'is-center' : '', c.sticky ? `is-sticky-${c.sticky === 'left' ? 'l' : 'r'}` : ''].filter(Boolean).join(' ')}>
                    {c.render ? c.render(r) : String(r[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
        {foot}
      </table>
    </div>
  );
}

/* ============================ 列表筛选条 ============================ */
/**
 * 列表筛选条 —— 版式统一参照「项目管理.html / 客户管理.html / 证书管理.html」：
 * 带标签的 chip 行（含计数徽标）+ 右侧下拉 / 搜索框 / 操作。
 * 取代旧式「带标签输入框」的 FilterBar，与参考稿观感一致。
 */
export type ChipRow = {
  label: string;
  value: string;
  onChange: (key: string) => void;
  items: { key: string; label: string; cnt?: number }[];
};
export function ListToolbar({ rows, right, children }: {
  rows?: ChipRow[]; right?: React.ReactNode; children?: React.ReactNode;
}) {
  return (
    <div className="nc-ltbar">
      {(rows ?? []).map((r) => (
        <div className="nc-ltrow" key={r.label}>
          <span className="nc-ltlbl">{r.label}</span>
          {r.items.map((it) => (
            <button
              key={it.key} type="button"
              className={`nc-fchip${r.value === it.key ? ' is-on' : ''}`}
              onClick={() => r.onChange(it.key)}
            >
              {it.label}{it.cnt != null && <span className="n">{it.cnt}</span>}
            </button>
          ))}
        </div>
      ))}
      {children}
      {right && <div className="nc-ltrow"><div className="nc-ltright">{right}</div></div>}
    </div>
  );
}

/** 列表页脚：共 N 条 · 当前筛选 M 条 + 分页（还原截图左下统计 + 右下分页） */
export function TableFoot({ total, filtered, page, pageSize, onPage, onPageSize, extra, unit }: {
  total: number; filtered?: number; page: number; pageSize: number;
  onPage?: (p: number) => void; onPageSize?: (n: number) => void; extra?: React.ReactNode;
  /** 计数单位，默认「条数据」；列表页可传「个项目」「份」「笔」等贴合业务口径的单位 */
  unit?: string;
}) {
  const pages = Math.max(1, Math.ceil((filtered ?? total) / pageSize));
  const nums: number[] = [];
  if (pages <= 7) { for (let i = 1; i <= pages; i++) nums.push(i); }
  else if (page <= 4) { nums.push(1, 2, 3, 4, 5, -1, pages); }
  else if (page >= pages - 3) { nums.push(1, -1, pages - 4, pages - 3, pages - 2, pages - 1, pages); }
  else { nums.push(1, -1, page - 1, page, page + 1, -1, pages); }
  return (
    <div className="nc-tbl-foot">
      <span>共 <b className="num">{total}</b> {unit ?? '条数据'}{filtered != null && filtered !== total ? <> · 当前筛选 <b className="num">{filtered}</b> {unit ? unit.replace(/^个/, '') : '条'}</> : null}{extra}</span>
      <div className="nc-pager">
        <span className="nc-tbl-foot-lbl">每页</span>
        <select className="nc-mini-select" value={pageSize} onChange={(e) => onPageSize?.(Number(e.target.value))}>
          {[10, 20, 50, 100].map((n) => <option key={n} value={n}>{n} 条</option>)}
        </select>
        <button className="nc-page-btn" disabled={page <= 1} onClick={() => onPage?.(page - 1)}>‹</button>
        {nums.map((n, i) => n === -1
          ? <span key={`e${i}`} className="nc-page-ellipsis">…</span>
          : <button key={n} className={`nc-page-btn${page === n ? ' is-on' : ''}`} onClick={() => onPage?.(n)}>{n}</button>)}
        <button className="nc-page-btn" disabled={page >= pages} onClick={() => onPage?.(page + 1)}>›</button>
      </div>
    </div>
  );
}

export function Pager({ total, page, pageSize, onPage }: { total: number; page: number; pageSize: number; onPage: (p: number) => void }) {
  return <TableFoot total={total} page={page} pageSize={pageSize} onPage={onPage} />;
}

/* ============================ 抽屉 / 弹窗 ============================ */
/**
 * 评审 I7：弹窗 / 抽屉打开时未锁背景滚动，长表单在窄屏滚动会穿透到背景页，
 * 关闭后背景位置错乱。统一在此收口：打开时给 body 加 overflow:hidden，
 * 并按滚动条宽度补偿 padding-right，避免锁定瞬间页面横向抖动。
 */
function useScrollLock(open: boolean) {
  useEffect(() => {
    if (!open) return undefined;
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPad = body.style.paddingRight;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => { body.style.overflow = prevOverflow; body.style.paddingRight = prevPad; };
  }, [open]);
}

export function Drawer({ open, title, sub, width, onClose, foot, children }: {
  open: boolean; title: React.ReactNode; sub?: React.ReactNode;
  width?: number; onClose: () => void; foot?: React.ReactNode; children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  useScrollLock(open);
  if (!open) return null;
  return (
    <>
      <div className="nc-mask is-open" onClick={onClose} />
      <aside className="nc-drawer is-open" style={{ width: width || 640, maxWidth: '96vw' }}>
        <div className="nc-drawer-hd">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3>{title}</h3>
            {sub && <div className="nc-drawer-sub">{sub}</div>}
          </div>
          <button className="nc-drawer-close" onClick={onClose} aria-label="关闭"><Ico n="close" size={16} /></button>
        </div>
        <div className="nc-drawer-bd">{children}</div>
        {foot && <div className="nc-drawer-ft">{foot}</div>}
      </aside>
    </>
  );
}

export function Modal({ open, title, width, onClose, foot, children }: {
  open: boolean; title: React.ReactNode; width?: number; onClose: () => void;
  foot?: React.ReactNode; children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  useScrollLock(open);
  if (!open) return null;
  return (
    <>
      <div className="nc-modal-mask is-open" onClick={onClose} />
      <div className="nc-modal is-open" style={{ width: width || 480, maxWidth: '94vw', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 96 }} onClick={(e) => e.stopPropagation()}>
        <div className="nc-modal-hd"><h3>{title}</h3><button className="nc-drawer-close" onClick={onClose} aria-label="关闭"><Ico n="close" size={16} /></button></div>
        <div className="nc-modal-bd">{children}</div>
        {foot && <div className="nc-modal-ft">{foot}</div>}
      </div>
    </>
  );
}

/* ============================ 破坏性操作二次确认 ============================ */
/**
 * 统一的「不可逆 / 高影响操作」确认弹窗。
 * 评审 I1：原 6 处破坏性操作（移除证书引用 / 解除证书占用 / 移除成员 / 审批驳回 / 报价作废 / 文档删除）
 * 均为一步生效、无确认、无留痕说明，在消防业务中误操作直接影响投标资格与验收资料完整度。
 * 统一收口为：标题 + 影响说明 + 必填原因（驳回 / 撤回类）+ 二次输入（删除类）。
 */
/**
 * 评审 P0-2：原先 reason 与 typed 两个输入框共用同一个 state `txt`，
 * 同时启用（删除类 DocPage 传入 reason + typed）时两个框内容互相覆盖，
 * 校验条件互斥（同一份文本既要 ≥4 字原因、又要等于目标名称），导致操作永远无法提交。
 * 现拆为两个独立 state：reasonText 归 reason、typedText 归 typed，各自校验。
 */
export function ConfirmModal({ open, title, impact, reason, reasonLabel, typed, typedLabel, okText, onOk, onClose }: {
  open: boolean; title: string; impact?: React.ReactNode;
  /** 需填写原因（驳回 / 撤回 / 释放类），提交时校验非空且 ≥4 字 */
  reason?: boolean; reasonLabel?: string;
  /** 需二次输入确认文本（删除类），必须与 typed 完全一致才允许提交 */
  typed?: string; typedLabel?: string;
  okText?: string;
  onOk: (reasonText: string) => void; onClose: () => void;
}) {
  const [reasonText, setReasonText] = useState('');
  const [typedText, setTypedText] = useState('');
  const [tip, setTip] = useState('');
  useEffect(() => { if (open) { setReasonText(''); setTypedText(''); setTip(''); } }, [open]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  const needReason = !!reason;
  const needTyped = !!typed;
  const okDisabled = (needReason && reasonText.trim().length < 4) || (needTyped && typedText.trim() !== typed);
  const submit = () => {
    if (needReason && reasonText.trim().length < 4) { setTip('原因不得少于 4 个字，且需说明具体依据'); return; }
    if (needTyped && typedText.trim() !== typed) { setTip(`请输入「${typed}」以确认`); return; }
    onOk((needReason ? reasonText : typedText).trim());
    onClose();
  };
  return (
    <>
      <div className="nc-modal-mask is-open" onClick={onClose} />
      <div className="nc-modal is-open" style={{ width: 460, maxWidth: '94vw', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 97 }} onClick={(e) => e.stopPropagation()}>
        <div className="nc-modal-hd">
          <h3><span className="nc-cfirm-ic"><Ico n="warning" size={16} /></span>{title}</h3>
          <button className="nc-drawer-close" onClick={onClose} aria-label="关闭"><Ico n="close" size={16} /></button>
        </div>
        <div className="nc-modal-bd">
          {impact && <div className="nc-cfirm-impact">{impact}</div>}
          {needReason && (
            <div className="nc-cfirm-field">
              <label>{reasonLabel ?? '操作原因'} <span className="nc-req">*</span></label>
              <textarea className="nc-input" rows={3} maxLength={200} value={reasonText} onChange={(e) => { setReasonText(e.target.value); setTip(''); }} placeholder="请说明具体依据（≥4 字），将写入操作留痕" />
            </div>
          )}
          {needTyped && (
            <div className="nc-cfirm-field">
              <label>{typedLabel ?? `请输入「${typed}」以确认`} <span className="nc-req">*</span></label>
              <input className="nc-input" value={typedText} onChange={(e) => { setTypedText(e.target.value); setTip(''); }} placeholder={typed} />
            </div>
          )}
          {tip && <div className="nc-cfirm-tip">{tip}</div>}
        </div>
        <div className="nc-modal-ft">
          <Btn onClick={onClose}>取消</Btn>
          <Btn kind="primary" danger disabled={okDisabled} onClick={submit}>{okText ?? '确认'}</Btn>
        </div>
      </div>
    </>
  );
}

/* ============================ 页内 Tabs ============================ */
export function Tabs({ items, value, onChange }: {
  items: { key: string; label: string; cnt?: number }[]; value: string; onChange: (k: string) => void;
}) {
  return (
    <div className="nc-ptabs">
      {items.map((it) => (
        <button key={it.key} className={`nc-ptab${value === it.key ? ' is-on' : ''}`} onClick={() => onChange(it.key)}>
          {it.label}{it.cnt != null && <span className="nc-ptab-cnt">{it.cnt}</span>}
        </button>
      ))}
    </div>
  );
}

/* ============================ 步骤条 ============================ */
export function Steps({ items, cur, onStep }: { items: { label: string; sub?: string }[]; cur: number; onStep?: (i: number) => void }) {
  return (
    <div className="nc-steps">
      {items.map((it, i) => (
        <button key={it.label} className={`nc-step${i < cur ? ' is-done' : ''}${i === cur ? ' is-cur' : ''}`} onClick={() => onStep?.(i)}>
          {/* 已完成 = ✓ 打勾（success 绿底）；当前 = 序号（primary 蓝底）；待办 = 序号（灰描边） */}
          <div className="nc-step-dot">{i < cur ? <Ico n="check" size={13} /> : i + 1}</div>
          <div className="nc-step-label">{it.label}{it.sub ? <em> · {it.sub}</em> : null}</div>
        </button>
      ))}
    </div>
  );
}

/* ============================ 进度 / 键值对 / 时间线 / 漏斗 ============================ */
export function Progress({ value, tone }: { value: number; tone?: 'green' | 'orange' | 'red' }) {
  return (
    <div className={`nc-progress${tone ? ` is-${tone}` : ''}`}>
      <i style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

export function KvGrid({ rows, cols = 2 }: { rows: { k: string; v: React.ReactNode }[]; cols?: 1 | 2 | 3 | 4 }) {
  return <div className={`nc-kv-grid nc-kv-grid-${cols}`}>
    {rows.map((r, i) => <div key={`${r.k}-${i}`} className="nc-kv"><span className="nc-k">{r.k}</span><span className="nc-v">{r.v}</span></div>)}
  </div>;
}

export function Timeline({ items }: { items: { date: string; text: React.ReactNode; tone?: 'ok' | 'gold' | 'red' | 'gray' }[] }) {
  return (
    <div className="nc-timeline">
      {items.map((it, i) => (
        <div key={i} className={`nc-tl-item${it.tone ? ` is-${it.tone}` : ''}`}>
          <span className="nc-tl-date num">{it.date}</span>
          <span style={{ flex: 1, minWidth: 0 }}>{it.text}</span>
        </div>
      ))}
    </div>
  );
}

export function Funnel({ rows }: { rows: { name: string; value: number; label: string }[] }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="nc-funnel">
      {rows.map((r) => (
        <div key={r.name} className="nc-funnel-row">
          <span className="nc-funnel-name">{r.name}</span>
          <span className="nc-funnel-track">
            <span className="nc-funnel-bar" style={{ width: `${Math.max(14, (r.value / max) * 100)}%` }}>{r.value}</span>
          </span>
          <span className="nc-funnel-val num">{r.label}</span>
        </div>
      ))}
    </div>
  );
}

/** 横向节点条：审批链 / 阶段条（done / current / rejected 三态） */
export function ChainBar({ nodes, tone }: { nodes: { label: string; sub?: string; state: 'done' | 'cur' | 'todo' | 'rejected' }[]; tone?: 'blue' | 'gold' }) {
  return (
    <div className={`nc-chain${tone === 'gold' ? ' is-gold' : ''}`}>
      {nodes.map((n, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="nc-chain-line" />}
          <span className={`nc-chain-node is-${n.state}`}>
            {/* 已完成 = ✓ 打勾；驳回 = ✕；当前 / 待办 = 序号 */}
            <i className="nc-chain-dot">
              {n.state === 'done' ? <Ico n="check" size={13} /> : n.state === 'rejected' ? <Ico n="close" size={12} /> : i + 1}
            </i>
            <b>{n.label}</b>
            {n.sub && <em>{n.sub}</em>}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

/* ============================ 页头 ============================ */
export function PageHead({ crumbs, title, badges, sub, actions }: {
  crumbs?: string[]; title: React.ReactNode; badges?: React.ReactNode;
  sub?: React.ReactNode; actions?: React.ReactNode;
}) {
  const crumbsList = crumbs || [];
  return (
    <>
      {crumbsList.length > 0 && (
        <div className="nc-crumb">
          {crumbsList.map((c, i) => (
            <span key={i}>{i > 0 && <span style={{ color: 'var(--c-hairline-strong)', margin: '0 2px' }}>/</span>}{i === crumbsList.length - 1 ? <b>{c}</b> : c}</span>
          ))}
        </div>
      )}
      <div className="nc-pagehead">
        <div className="nc-pagehead-main">
          <div className="nc-pagehead-title"><h1>{title}</h1>{badges}</div>
          {sub && <div className="nc-pagehead-sub">{sub}</div>}
        </div>
        {actions && <div className="nc-pagehead-actions">{actions}</div>}
      </div>
    </>
  );
}

/* ============================ 复选框 / 开关 ============================ */
export function Check({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="nc-checkwrap" onClick={(e) => e.stopPropagation()}>
      <input type="checkbox" className="nc-check" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label && <span>{label}</span>}
    </label>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    /* 评审 P0-6：Switch 用原生 checkbox 承载语义，天然支持 Space 切换与屏幕阅读器播报，无需再用 span 模拟 */
    <label className="nc-switchwrap" onClick={(e) => e.stopPropagation()}>
      <input
        type="checkbox"
        className="nc-switch-input"
        checked={checked}
        aria-label={label}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={`nc-switch${checked ? ' is-on' : ''}`} aria-hidden="true"><i /></span>
      {label && <span>{label}</span>}
    </label>
  );
}

/* ============================ 统计瓦片（证书 / 材料等） ============================ */
export function Tile({ label, value, sub, tone, onClick, active, tip, tipW }: {
  label: string; value: React.ReactNode; sub?: React.ReactNode;
  tone?: 'red' | 'orange' | 'green' | 'blue'; onClick?: () => void; active?: boolean;
  /** 指标口径帮助提示：label 后显示 ? 图标 */
  tip?: React.ReactNode; tipW?: number;
}) {
  return (
    <div className={`nc-tile${onClick ? ' is-clickable' : ''}${active ? ' is-active' : ''}`} onClick={onClick} {...pressProps(onClick)}>
      <div className="nc-tile-label">{label}{tip && <Tip text={tip} w={tipW} />}</div>
      <div className={`nc-tile-value num${tone ? ` nc-v-${tone}` : ''}`}>{value}</div>
      {sub && <div className="nc-tile-sub">{sub}</div>}
    </div>
  );
}
