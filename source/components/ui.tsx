// 诺安云 6.0 · 共享 UI 组件（严格遵循 src/themes/nuoan-cloud/DESIGN.md token）
import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Ico } from './icons';
import { canSeeMoney, fmt, fmtAmt, fmtWan, PROJECTS, TODAY } from './data';
import { isPreviewTarget, openPreview } from './entityPreviewState';
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
    timer.current = window.setTimeout(() => setMsg(null), tone === 'err' ? 5000 : 4500);
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
 * 编号列单元格 —— 统一「编号可点击 = 蓝色 + 点击打开本行详情」。
 * 有 onClick 时渲染为蓝色链接（并阻止冒泡，避免与行点击重复触发）；无 onClick 时保持中性灰，
 * 不给出可点击的视觉暗示。列表页首列编号统一走这里，避免各页各自实现导致有的蓝有的黑。
 */
export function IdCell({ children, onClick, title }: {
  children: React.ReactNode; onClick?: () => void; title?: string;
}) {
  if (!onClick) return <span className="nc-id-cell">{children}</span>;
  return (
    <button
      type="button" className="nc-id-cell is-link" title={title || '查看详情'}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >{children}</button>
  );
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
    /* 查看型穿透：目标实体支持穿透预览且有 id → 当前页打开抽屉 / 弹窗，不打断操作；
       id 缺失（无对应实体）或目标页不支持预览 → 回退整页跳转（原行为） */
    if (id && isPreviewTarget(target)) { openPreview(target, id); return; }
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
export function Money({ v, role, wan, className, title }: {
  v: number | string; role: string; wan?: boolean; className?: string; title?: string;
}) {
  const can = canSeeMoney(role);
  const num = typeof v === 'number' ? v : Number(v || 0);
  // 全局单位规范：≥1万 → 「¥X.XX万」；<1万 → 「¥X,XXX」；hover 显示原始元值
  const text = can ? (wan ? fmtAmt(num) : fmt(num)) : '—';
  return (
    <span className={['num', className].filter(Boolean).join(' ')}
      title={can ? (title ?? fmt(num)) : '当前角色无金额查看权限（A-02 口径）'}>{text}</span>
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

/** 操作列占位符：该行不具备此操作权限时占住槽位，保证同一列跨行的按钮位置恒定对齐 */
export function OpNone({ title }: { title?: string }) {
  return <span className="nc-op-none" title={title} aria-label="无操作权限">—</span>;
}

/* ============================ 操作列收口「更多」 ============================ */
export type OpMoreItem = {
  label: React.ReactNode;
  disabled?: boolean; danger?: boolean; title?: string; onClick?: () => void;
};

/**
 * 操作列收口容器「更多 ⋯」。
 *
 * 背景：操作列原先按数据可用性逐个拼装（2~6 个不等），同一列在不同行的按钮数量、
 * 位置都在漂移，用户竖着扫视时找不到「我要的那个按钮」。改为「常用操作最多外露 3 个
 * + 其余收进更多 + 无权限留占位」，每行槽位数恒定。
 *
 * 面板用 Portal + position:fixed 而非 absolute：表格外层容器带 overflow-x:auto，
 * absolute 会被滚动容器裁切，fixed 挂在 body 上才能浮出容器之外。
 */
export function OpMore({ items, label = '更多 ⋯' }: { items: OpMoreItem[]; label?: string }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /** 贴合触发按钮右下角；下方空间不够则上翻，右侧超出视口则左移 */
  const place = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const w = 176;
    const h = panelRef.current?.offsetHeight ?? 120;
    const below = r.bottom + 4;
    const top = below + h > window.innerHeight && r.top - h - 4 > 0 ? r.top - h - 4 : below;
    const left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8));
    setPos({ top, left });
  }, []);

  useLayoutEffect(() => { if (open) place(); }, [open, place]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, place]);

  return (
    <>
      <button
        ref={btnRef} className="nc-op nc-op-more" disabled={!items.length}
        aria-haspopup="menu" aria-expanded={open}
        title={!items.length ? '当前无可用操作' : undefined}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
      >{label}</button>
      {open && createPortal(
        <div
          ref={panelRef} className="nc-opmenu" role="menu" style={{ top: pos.top, left: pos.left }}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((it, i) => (
            <button
              key={i} role="menuitem" disabled={it.disabled} title={it.title}
              className={`nc-oplist-item${it.disabled ? ' is-dis' : ''}${it.danger ? ' is-danger' : ''}`}
              onClick={() => { if (it.disabled) return; it.onClick?.(); setOpen(false); }}
            >{it.label}</button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}

/* ============================ 卡片 / 分区 ============================ */
export function Card({ flush, hd, extra, children, style }: {
  flush?: boolean; hd?: React.ReactNode; extra?: React.ReactNode; children?: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <section className={`nc-card${flush ? ' is-flush' : ''}`} style={style}>
      {hd && <div className="nc-card-hd"><h3>{hd}</h3>{extra && <div className="nc-card-hd-extra">{extra}</div>}</div>}
      {children && (flush ? children : <div className="nc-card-bd">{children}</div>)}
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
      <div className="nc-tbl-host">
        <div className="nc-empty">
          <div className="nc-empty-ico"><Ico n="folder" size={34} /></div>
          <div>/ 没有符合条件的记录</div>
          {empty && <div>{empty}</div>}
          {emptyCta && <div>{emptyCta}</div>}
        </div>
      </div>
    );
  }
  const allOn = selectable && selected && rows.length > 0 && rows.every((r) => selected.includes(rowKey(r)));
  const headCols = selectable
    ? [{ key: '__chk', title: '', width: 40 }, ...cols]
    : cols;
  return (
    /* 表体与页脚是兄弟节点：视口锁定下卡头 / 筛选 / 分页固定，只有表格区局部滚动 */
    <div className="nc-tbl-host">
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
        </table>
      </div>
      {foot}
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

/**
 * 弹窗宽度统一三档（第 52 条；2026-09-22 档位对齐 UI 交互规范 §三「短表单用弹窗、最大 480」）：
 *   S = 480px（确认 / 提示 / 短表单 ≤5 字段）· M = 640px（一般表单 / 单表明细）· L = 840px（大表单 / 宽表）
 * 调用方仍可传任意 width，组件会就近吸附到档位 —— 避免全站 20+ 种宽度并存。
 * 与抽屉档位的关系：640 / 840 两档弹窗与抽屉共用同一语义（台账档 / 复杂表单档），跨载体口径一致。
 */
const snapW = (w: number) => (w <= 600 ? 480 : w <= 800 ? 640 : 840);

export function Modal({ open, title, width, size, onClose, foot, children, dirty, maskClosable = false }: {
  open: boolean; title: React.ReactNode; width?: number;
  /** 宽度档位（优先于 width） */
  size?: 'S' | 'M' | 'L';
  onClose: () => void; foot?: React.ReactNode; children: React.ReactNode;
  /** 弹窗内有未保存数据：点 X / Esc 时先二次确认，避免误关丢数据（第 54 条） */
  dirty?: boolean;
  /** 点遮罩是否关闭，默认 false —— 避免误点底层内容时丢数据（第 53 条） */
  maskClosable?: boolean;
}) {
  const [ask, setAsk] = useState(false);
  useEffect(() => {
    if (!open) setAsk(false);
  }, [open]);
  /** 关闭请求：有未保存数据先确认 */
  const requestClose = () => { if (dirty) { setAsk(true); return; } onClose(); };
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') requestClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });
  useScrollLock(open);
  if (!open) return null;
  const W = size === 'S' ? 480 : size === 'M' ? 640 : size === 'L' ? 840 : snapW(width || 520);
  return (
    <>
      <div className="nc-modal-mask is-open" onClick={() => { if (maskClosable) requestClose(); }} />
      <div className="nc-modal is-open" style={{ width: W, maxWidth: '94vw', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 96 }} onClick={(e) => e.stopPropagation()}>
        <div className="nc-modal-hd"><h3>{title}</h3><button className="nc-drawer-close" onClick={requestClose} aria-label="关闭"><Ico n="close" size={16} /></button></div>
        <div className="nc-modal-bd">{children}</div>
        {foot && <div className="nc-modal-ft">{foot}</div>}
      </div>
      {/* 未保存数据 · 关闭确认（第 54 条） */}
      {ask && (
        <>
          <div className="nc-modal-mask is-open" style={{ zIndex: 97 }} />
          <div className="nc-modal is-open" style={{ width: 420, maxWidth: '94vw', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 98 }}>
            <div className="nc-modal-hd"><h3>放弃编辑？</h3></div>
            <div className="nc-modal-bd">弹窗内已填写的内容尚未保存，关闭后将全部丢弃。</div>
            <div className="nc-modal-ft">
              <Btn onClick={() => setAsk(false)}>继续编辑</Btn>
              <Btn kind="primary" danger onClick={() => { setAsk(false); onClose(); }}>放弃并关闭</Btn>
            </div>
          </div>
        </>
      )}
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
          {/* 已完成 = ✓ 打勾（primary 蓝底）；当前 = 序号（primary 蓝底 + 光晕）；待办 = 序号（灰描边，灰字） */}
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

/**
 * 横向节点条：审批链 / 阶段条（done / current / rejected 三态）。
 * 配色统一：已完成 = 蓝色 + ✓；当前 = 蓝色实心 + 光晕；待办 = 灰色空心；驳回 = 红色 ✕。
 * compact = 紧凑模式：去掉序号与副标题，节点不再撑开最小宽度，用于抽屉内的长阶段条（如投标 8 阶段）。
 */
export function ChainBar({ nodes, tone, compact }: {
  nodes: { label: string; sub?: string; state: 'done' | 'cur' | 'todo' | 'rejected' }[];
  tone?: 'blue' | 'gold';
  compact?: boolean;
}) {
  return (
    <div className={`nc-chain${tone === 'gold' ? ' is-gold' : ''}${compact ? ' is-compact' : ''}`}>
      {nodes.map((n, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="nc-chain-line" />}
          <span className={`nc-chain-node is-${n.state}`} title={n.sub ? `${n.label} · ${n.sub}` : undefined}>
            {/* 已完成 = ✓ 打勾；驳回 = ✕；当前 / 待办 = 序号（紧凑模式下不显示序号，只留状态点） */}
            <i className="nc-chain-dot">
              {n.state === 'done' ? <Ico n="check" size={13} /> : n.state === 'rejected' ? <Ico n="close" size={12} /> : compact ? null : i + 1}
            </i>
            <b>{n.label}</b>
            {!compact && n.sub && <em>{n.sub}</em>}
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

/* ============================ 水印设置（导出 / 分享前配置） ============================ */
/**
 * 水印设置弹窗：导出 / 分享前配置水印内容。
 * 替代原先写死的「导出人 + 时间 + 租户」口径 —— 支持自定义文本（如「仅限××项目使用」）、
 * 快捷模板、关联项目（自动替换文本中的「本项目」）、以及附加信息开关。
 */
export function WatermarkModal({ open, onClose, onConfirm, scope }: {
  open: boolean;
  onClose: () => void;
  /** 确认回调：回传最终水印配置（text 已按所选项目解析） */
  onConfirm: (cfg: { text: string; proj: string; by: boolean; time: boolean; tenant: boolean }) => void;
  /** 作用范围描述，如「证书台账」「已选 3 个文档」 */
  scope?: string;
}) {
  const PRESETS = ['仅限本项目使用', '仅限内部使用', '请勿外传', '商业秘密 · 禁止外泄'];
  const [text, setText] = useState('仅限本项目使用');
  const [proj, setProj] = useState('');
  const [by, setBy] = useState(true);
  const [time, setTime] = useState(true);
  const [tenant, setTenant] = useState(true);

  /* 每次打开重置为默认，避免上一轮配置误带入 */
  useEffect(() => {
    if (open) { setText('仅限本项目使用'); setProj(''); setBy(true); setTime(true); setTenant(true); }
  }, [open]);

  /** 主文本：含「本项目」且已选项目时，替换为具体项目名 */
  const main = proj && text.includes('本项目') ? text.replace('本项目', proj) : text;
  const extras = [
    by ? '导出人：当前用户' : '',
    time ? `时间：${TODAY}` : '',
    tenant ? '租户：云南诺安消防' : '',
  ].filter(Boolean);
  const preview = [main, ...extras].join('  ·  ');
  const projName = PROJECTS.find((p) => p.id === proj)?.name;

  return (
    <Modal open={open} onClose={onClose} width={480} title="水印设置"
      foot={<>
        <Btn onClick={onClose}>取消</Btn>
        <Btn kind="primary" disabled={!text.trim()} onClick={() => onConfirm({ text: main, proj, by, time, tenant })}>确认并导出</Btn>
      </>}>
      {scope && <div className="nc-wm-scope">作用范围：<b>{scope}</b></div>}
      <Field label="水印文字" req note="支持自定义；选择项目后，文本中的「本项目」会自动替换为项目名称">
        <input className="nc-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="如：仅限××项目使用" />
      </Field>
      <Field label="快捷模板">
        <div className="nc-pick-inline">
          {PRESETS.map((p) => (
            <button key={p} type="button" className={`nc-fchip${text === p ? ' is-on' : ''}`} onClick={() => setText(p)}>{p}</button>
          ))}
        </div>
      </Field>
      <Field label="关联项目" note="选填；选择后「本项目」将替换为该项目的实际名称">
        <select className="nc-input" value={proj} onChange={(e) => setProj(e.target.value)}>
          <option value="">不关联具体项目</option>
          {PROJECTS.map((p) => <option key={p.id} value={p.id}>{p.id} · {p.name}</option>)}
        </select>
      </Field>
      <Field label="附加信息" span={2}>
        <div className="nc-pick-inline">
          <Check checked={by} onChange={setBy} label="导出人" />
          <Check checked={time} onChange={setTime} label="导出时间" />
          <Check checked={tenant} onChange={setTenant} label="租户名称" />
        </div>
      </Field>
      <Field label="水印预览" span={2}>
        <div className="nc-wm-preview">
          <div className="nc-wm-preview-doc">
            <div className="nc-wm-preview-lines"><i /><i /><i /><i /></div>
            <div className="nc-wm-preview-mark">{preview}</div>
          </div>
          <div className="nc-tiny nc-muted" style={{ marginTop: 8 }}>
            {projName ? <>已关联项目：<b>{projName}</b> · </> : null}导出文件将叠加此水印，不可移除。
          </div>
        </div>
      </Field>
    </Modal>
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
