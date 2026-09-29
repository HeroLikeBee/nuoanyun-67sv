// 诺安云 6.0 · 共享 UI 组件（严格遵循 src/themes/nuoan-cloud/DESIGN.md token）
import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Ico, StatusIco } from './icons';
import { canSeeMoney, fmt, fmtAmt, fmtWan, CONTRACT_STATUS_TONE, CONTRACT_TERMINAL, CONTRACT_TYPES, CUSTOMERS, entityNameOf, entityShortOf, ITEM_KINDS, normContractStatus, oppStageTone, OUR_ENTITIES, PROJ_TYPES, PROJECT_STATUS_TONE, PROJECT_TERMINAL, SUPPLIERS, TODAY } from './data';
import { isPreviewTarget, openPreview } from './entityPreviewState';
import { getActiveItems, getContracts, getItems, getOppStageIdx, getOppStages, getOpps, getProjects, setFocus, subscribeStore } from './store';
import { WatermarkPreview } from './export';

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
      {msg && <div className={`nc-toast is-show ${msg.tone === 'err' ? 'nc-toast-err' : 'nc-toast-ok'}`}><StatusIco kind={msg.tone === 'err' ? 'close' : 'ok'} size={15} />{msg.text}</div>}
    </ToastCtx.Provider>
  );
}

/* ============================ 基础 ============================ */
export type TagTone = 'blue' | 'green' | 'orange' | 'red' | 'gray' | 'purple' | 'link' | 'solid' | 'gold';
export function Tag({ tone = 'gray', pill, className, children }: { tone?: TagTone; pill?: boolean; className?: string; children: React.ReactNode }) {
  return <span className={`nc-tag nc-tag-${tone}${pill ? ' nc-tag-pill' : ''}${className ? ' ' + className : ''}`}><span className="nc-tag-tx">{children}</span></span>;
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
export function Card({ flush, hd, extra, children, style, sec, sub }: {
  flush?: boolean; hd?: React.ReactNode; extra?: React.ReactNode; children?: React.ReactNode; style?: React.CSSProperties;
  /** sec=true 时用「蓝竖条 + 灰字」小标题口径（同 .nc-sec-title）替代默认的 16px 黑粗体标题。
      只服务项目详情页（概览页 4 块 + 子页），默认 false 保持全站其它调用点不变。 */
  sec?: boolean;
  /** sub=true：嵌在外层卡（PjSection / Card sec）内部的子块。标题走 .nc-subhd（13px/600 灰字、
      无蓝竖条）—— 蓝条一卡只给外层卡标题一根，避免同卡多根蓝条视觉打架。 */
  sub?: boolean;
}) {
  if (sec || sub) {
    return (
      <section className={`nc-card${flush ? ' is-flush' : ''}`} style={style}>
        {hd && (sub
          ? <div className="nc-subhd">{hd}{extra != null && <div className="nc-subhd-extra">{extra}</div>}</div>
          : <div className="nc-pjsec-title"><div className="nc-sec-title">{hd}</div>{extra && <div className="nc-pjsec-title-extra">{extra}</div>}</div>)}
        {children && (flush ? children : <div className="nc-card-bd">{children}</div>)}
      </section>
    );
  }
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
        {drill && <span className="nc-kpi-drill">查看明细 ↗</span>}
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
/** @deprecated use ListToolbar instead; kept only for legacy pages. */

export function FilterBar({ children, onQuery, onReset, ops }: {
  children: React.ReactNode; onQuery?: () => void; onReset?: () => void; ops?: React.ReactNode;
}) {
  return (
    <div className="nc-filterbar">
      {children}
      <div className="nc-filterbar-ops">
        <Btn kind="primary" size="sm" onClick={onQuery}>查询</Btn>
        <Btn kind="link" size="sm" onClick={onReset}>重置</Btn>
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
  key: string; title: React.ReactNode; width?: number;
  align?: 'left' | 'right' | 'center';
  /** 宽表横向滚动时吸附：left 常驻首列 / right 常驻末列 */
  sticky?: 'left' | 'right';
  /** 小屏（≤1100px）隐藏：低信息密度列优先让位，把横向宽度留给冻结的名称列 */
  hideSm?: boolean;
  /** 列表不渲染：编号等低优先级列 —— 信息仍可在详情抽屉与全局搜索（按名称 + 编号）中查到。
      行身份由「名称」承担，列表不再为编号占一列宽度。 */
  hide?: boolean;
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
          <div>没有符合条件的记录</div>
          {empty && <div>{empty}</div>}
          {emptyCta && <div>{emptyCta}</div>}
        </div>
      </div>
    );
  }
  const allOn = selectable && selected && rows.length > 0 && rows.every((r) => selected.includes(rowKey(r)));
  /* hide: 列表不渲染该列（编号等）；sticky / 冻结偏移一律基于渲染后的列计算 */
  const shownCols = cols.filter((c) => !c.hide);
  const headCols: Col<T>[] = selectable
    ? [{ key: '__chk', title: '', width: 40 }, ...shownCols]
    : shownCols;
  /* 冻结列（sticky:'left'）常驻左侧：横向滚动时「名称」始终可见，逐行对比不必反复回滚。
     表格可勾选时勾选列一并冻结（否则会被冻结列盖住），首个冻结列因此让出 40px 偏移。 */
  const firstLeftKey = shownCols.find((c) => c.sticky === 'left')?.key;
  const chkFrozen = !!selectable && !!firstLeftKey;
  const frozenLeft = chkFrozen ? 40 : 0;
  const cellCls = (c: Col<T>) => [
    c.align === 'right' ? 'is-num' : c.align === 'center' ? 'is-center' : '',
    c.sticky ? `is-sticky-${c.sticky === 'left' ? 'l' : 'r'}` : '',
    c.hideSm ? 'nc-col-sm' : '',
  ].filter(Boolean).join(' ');
  const cellStyle = (c: Col<T>) => (c.key === firstLeftKey ? { left: frozenLeft } : undefined);
  return (
    /* 表体与页脚是兄弟节点：视口锁定下卡头 / 筛选 / 分页固定，只有表格区局部滚动 */
    <div className="nc-tbl-host">
      <div className="nc-tbl-wrap">
        <table className="nc-tbl" style={{ minWidth }}>
          <thead>
            <tr>{headCols.map((c) => (
              <th key={c.key} style={{ width: c.width, textAlign: c.align, ...(c.key === '__chk' && chkFrozen ? { left: 0 } : cellStyle(c)) }} className={[c.key === '__chk' && chkFrozen ? 'is-sticky-l' : cellCls(c)].filter(Boolean).join(' ')}>
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
                    <td onClick={(e) => e.stopPropagation()} className={chkFrozen ? 'is-sticky-l' : undefined} style={chkFrozen ? { left: 0 } : undefined}>
                      <input type="checkbox" className="nc-check" checked={!!selected?.includes(id)} onChange={() => onSelectRow?.(id)} />
                    </td>
                  )}
                  {shownCols.map((c) => (
                    <td key={c.key} className={cellCls(c)} style={cellStyle(c)}>
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
/**
 * 列表工具栏（增强版 · 2026-09-24 排版规范落地）
 *
 * 固定渲染顺序：
 *   [chip 筛选行 rows] → [更多筛选展开区 children] → [重置 link] [搜索框] ⟨弹性分隔⟩ [｜视图切换] [操作按钮组]
 *   下一行：[已选条件回显 FilterEcho]（仅 echoItems 非空时）
 *
 * - 旧用法 `right` 保留向后兼容；传入 search/viewSwitch/actions/onReset 任一即启用结构化右区。
 * - 重置一律 kind="link" 文字按钮，紧邻筛选控件，不得实底、不得排在视图切换之后。
 * - 视图切换与操作按钮组统一放在右区，与左侧筛选/搜索之间用竖分隔线区隔。
 */
export function ListToolbar({ rows, right, children, search, viewSwitch, actions, onReset, echoItems, onEchoRemove, onEchoClear, moreMenu }: {
  rows?: ChipRow[]; right?: React.ReactNode; children?: React.ReactNode;
  /** 搜索框配置，自动排在重置之后、弹性分隔之前 */
  search?: { value: string; onChange: (v: string) => void; placeholder?: string; width?: number };
  /** 视图切换（列表/看板/卡片等），自动放右区并带左分隔线 */
  viewSwitch?: React.ReactNode;
  /** 主/次操作按钮组，自动放最右；主操作(primary)应由调用方置最右 */
  actions?: React.ReactNode;
  /** 重置回调，渲染为 kind="link" 文字按钮紧邻筛选 */
  onReset?: () => void;
  /** 已选条件回显项，非空时在工具栏下方渲染一行可删除 Tag */
  echoItems?: { key: string; label: React.ReactNode }[];
  onEchoRemove?: (key: string) => void;
  onEchoClear?: () => void;
  moreMenu?: { label: string; onClick: () => void }[];
}) {
  const structured = !!(search || viewSwitch || actions || onReset);
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
      {structured ? (
        <div className="nc-ltrow nc-ltbar-main">
          {onReset && <Btn kind="link" size="sm" onClick={onReset}>重置</Btn>}
          {search && <SearchInput value={search.value} onChange={search.onChange} placeholder={search.placeholder} width={search.width} />}
          <span className="nc-ltbar-sp" />
          {(viewSwitch || actions) && <span className="nc-ltbar-div" />}
          {viewSwitch}
          {moreMenu && moreMenu.length > 0 && (
            <OpMore items={moreMenu.map((m) => ({ label: m.label, onClick: m.onClick }))} />
          )}
          {actions}
        </div>
      ) : (
        right && <div className="nc-ltrow"><div className="nc-ltright">{right}</div></div>
      )}
      {echoItems && echoItems.length > 0 && (
        <FilterEcho items={echoItems} onRemove={onEchoRemove} onClear={onEchoClear} />
      )}
    </div>
  );
}

/**
 * 已选筛选条件回显行：可删除 Tag + 清除全部。
 * 嵌在 ListToolbar 下方，也可独立使用。
 */
export function FilterEcho({ items, onRemove, onClear }: {
  items: { key: string; label: React.ReactNode }[];
  onRemove?: (key: string) => void;
  onClear?: () => void;
}) {
  if (!items.length) return null;
  return (
    <div className="nc-ltrow nc-echo">
      <span className="nc-ltlbl">已选</span>
      {items.map((it) => (
        <span key={it.key} className="nc-echo-tag">
          {it.label}
          {onRemove && (
            <button type="button" className="nc-echo-x" onClick={() => onRemove(it.key)} aria-label="移除筛选条件">×</button>
          )}
        </span>
      ))}
      {onClear && <Btn kind="link" size="sm" onClick={onClear}>清除全部</Btn>}
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
  const pages = Math.max(1, Math.ceil((filtered ?? total) / Math.max(1, pageSize)));
  const count = <span>共 <b className="num">{total}</b> {unit ?? '条数据'}{filtered != null && filtered !== total ? <> · 当前筛选 <b className="num">{filtered}</b> {unit ? unit.replace(/^个/, '') : '条'}</> : null}{extra}</span>;
  /* 仅计数模式：不传 onPage（如树形表 / 固定小表）时只给总数，不渲染翻页控件 */
  if (!onPage) return <div className="nc-tbl-foot">{count}</div>;
  const nums: number[] = [];
  if (pages <= 7) { for (let i = 1; i <= pages; i++) nums.push(i); }
  else if (page <= 4) { nums.push(1, 2, 3, 4, 5, -1, pages); }
  else if (page >= pages - 3) { nums.push(1, -1, pages - 4, pages - 3, pages - 2, pages - 1, pages); }
  else { nums.push(1, -1, page - 1, page, page + 1, -1, pages); }
  return (
    <div className="nc-tbl-foot">
      {count}
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

/**
 * 列表分页状态（全站统一用法）：传入已筛选好的行，返回当前页数据与可直接塞进 DataTable foot 的分页脚。
 * 列表页布局规范要求「主列表一律有分页 + 总计数」，新增列表直接用它，不必各自再写一套 page / pageSize。
 */
export function usePaged<T>(rows: T[], initSize = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initSize);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const cur = Math.min(page, pages);
  const go = (p: number) => setPage(Math.max(1, Math.min(p, pages)));
  return {
    page: cur,
    pageSize,
    pages,
    paged: rows.slice((cur - 1) * pageSize, cur * pageSize),
    setPage: go,
    foot: (
      <TableFoot
        total={rows.length}
        page={cur}
        pageSize={pageSize}
        onPage={go}
        onPageSize={(n) => { setPageSize(n); setPage(1); }}
      />
    ),
  };
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
      <aside className="nc-drawer is-open" style={{ width: snapDW(width || 640), maxWidth: '96vw' }}>
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
 * 弹窗宽度统一四档（第 52 条；2026-09-22 档位对齐 UI 交互规范 §三「短表单用弹窗、最大 480」）：
 *   S = 480px（确认 / 提示 / 短表单 ≤5 字段）· M = 640px（一般表单 / 单表明细）
 *   L = 840px（大表单 / 宽表）· XL = 1080px（多列核对表：逐日符号核对、证书批量核对）
 * 调用方仍可传任意 width，组件会就近吸附到档位 —— 避免全站 20+ 种宽度并存。
 * 与抽屉档位的关系：640 / 840 两档弹窗与抽屉共用同一语义（台账档 / 复杂表单档），跨载体口径一致。
 * 2026-09-28 补 XL 档：此前上限 840，把调用方写的 900/980/1180 全压成 840，
 * 而表格 minWidth 是按调用方写的宽度定的 → 核对表右侧列被裁掉（详见 style.css 弹窗/抽屉表格一节）。
 */
const snapW = (w: number) => (w <= 600 ? 480 : w <= 800 ? 640 : w <= 900 ? 840 : 1080);
/* Drawer 四档：400(S) / 560(M) / 760(L) / 920(XL 宽表)，消除各页零散中间值。
   XL 档与 .nc-drawer 基础样式 min(920px, 100vw) 对齐；旧写法上限 760 会把
   width={840}/{880}/{960} 的抽屉一律压成 760，导致按 840 宽写的配置表右侧列被裁。 */
const snapDW = (w: number) => (w <= 480 ? 400 : w <= 680 ? 560 : w <= 800 ? 760 : 920);

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
      <div className="nc-modal is-open" style={{ width: 480, maxWidth: '94vw', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 97 }} onClick={(e) => e.stopPropagation()}>
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

/* ============================ 长列表选择器（全站统一内核 + 各实体包装） ============================
   项目 / 客户 / 商机 / 合同 / 供应商 / 物料 都会越积越多，原生 select 无法检索。
   凡是「关联 / 选择 / 使用 / 归属 / 筛选某实体」的页面、抽屉、弹窗一律用下面导出的包装组件，
   不要再写 <select> + XXXS.map。
   · 候选集缺省读共享 store（别处新建的单据在各页选择器里立即可见）；scope="all" 才含终态
   · 快筛档位与顺序一律取自固定字典，且只保留数据里真实存在的档
   · 默认只渲染前 10 条，点「获取更多」每次追加一页；键盘走到末行按 ↓ 自动续页
   · clearLabel 传入时列表首行固定多一项「清空」（筛选条与选填字段用）
   ⚠️ 包装组件里的 filter.dict 与 filter.of 必须是**模块级稳定引用** ——
      内核把二者放进 useMemo 依赖，每渲染新造函数会让列表恒等变化、高亮行被反复 scrollIntoView。 */

export type PickTag = { text: string; tone?: TagTone };

/** 选择器候选行 —— 各实体统一压成这一种形状，内核只认它 */
export type PickOpt = {
  /** 回传给 onChange 的值（唯一）；空串保留给「清空」项 */
  id: string;
  /** 行身份：主名称 */
  name: string;
  /** 编号；与 id 相同也要传（触发器与列表都靠它识别） */
  code?: string;
  /** 副行左侧文本：客户名 / 往来单位 / 规格… */
  sub?: string;
  /** 副行徽标：类型 / 状态 / 等级… */
  tags?: PickTag[];
  /** 主行徽标（紧跟名称）：风险提示用 */
  badges?: PickTag[];
  /** 快筛档位取值 */
  group?: string;
  /** 参与搜索但不在行上展示的字段（归属人 / 联系人 / 规格…） */
  search?: string;
  /** 内部使用：清空项 */
  clear?: boolean;
};

/** 每页条数 */
export const PICK_PAGE = 10;

/** 快筛配置：档位取值与顺序都从固定字典来，禁止从数据去重推导 */
export type PickFilter = { label: string; dict: readonly string[]; of: (o: PickOpt) => string };

/** 快筛取档位的标准实现（模块级，保证引用稳定） */
const ofGroup = (o: PickOpt) => o.group ?? '';

/** 回传值口径：id（编号，默认）· name（名称）· label（「编号 名称」，合同相对方用） */
export type PickEmit = 'id' | 'name' | 'label';
/* 三个实现都放模块级 —— 选择器拿它做「当前已选项」比对，每渲染新造函数会白白重算 */
const emitId = (o: PickOpt) => o.id;
const emitName = (o: PickOpt) => o.name;
const emitLabel = (o: PickOpt) => (o.code ? `${o.code} ${o.name}` : o.name);
const EMITS: Record<PickEmit, (o: PickOpt) => string> = { id: emitId, name: emitName, label: emitLabel };

/** 内核：搜索 + 字典快筛 + 分页 + 键盘 + portal 定位。业务侧请用下方实体包装组件。 */
export function PickSelect({
  value, onChange, opts, filter, emit = 'id', unit = '项', clearLabel, placeholder, searchPlaceholder, emptyText, width,
}: {
  value: string;
  onChange: (v: string) => void;
  opts: PickOpt[];
  filter?: PickFilter;
  /** 回传值口径，见 PickEmit */
  emit?: PickEmit;
  /** 脚注计数单位，如「个项目」 */
  unit?: string;
  /** 传入则列表首行固定多一项「清空」，点击回传空串 */
  clearLabel?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  /** 筛选条里用，限制触发器宽度；弹层宽度不低于 300 */
  width?: number;
}) {
  const [open, setOpen] = useState(false);
  const [kw, setKw] = useState('');
  const [grp, setGrp] = useState('');
  const [shown, setShown] = useState(PICK_PAGE);
  const [hl, setHl] = useState(0);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  /* 先取出成 const，闭包里才不会被 TS 当成「可能已变」而丢掉 undefined 收窄 */
  const dict = filter?.dict;
  const of = filter?.of;
  const filterLabel = filter?.label;
  const emitOf = EMITS[emit];

  const cur = opts.find((o) => emitOf(o) === value);

  /** 快筛档位：取值与顺序都取自固定字典，只保留数据里真实存在的档 */
  const groups = useMemo(
    () => (dict && of ? dict.filter((t) => opts.some((o) => of(o) === t)) : []),
    [dict, of, opts],
  );

  const matched = useMemo(() => {
    const k = kw.trim().toLowerCase();
    return opts.filter((o) => {
      if (grp && (!of || of(o) !== grp)) return false;
      if (!k) return true;
      return `${o.id} ${o.code ?? ''} ${o.name} ${o.sub ?? ''} ${o.search ?? ''}`.toLowerCase().includes(k);
    });
  }, [opts, kw, grp, of]);

  /** 清空项固定占首行、不参与筛选 —— 否则用户一打字就找不到「全部」了 */
  const list: PickOpt[] = useMemo(
    () => (clearLabel ? [{ id: '', name: clearLabel, clear: true }, ...matched] : matched),
    [clearLabel, matched],
  );

  /** 已渲染的一页：默认前 10 行 */
  const visible = list.slice(0, shown);

  /** 贴合触发器下沿；下方空间不足则上翻；窄触发器（筛选条）弹层保底 300 宽并夹在视口内 */
  const place = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const h = popRef.current?.offsetHeight ?? 360;
    const w = Math.max(r.width, 300);
    const below = r.bottom + 4;
    setPos({
      top: below + h > window.innerHeight && r.top - h - 4 > 0 ? r.top - h - 4 : below,
      left: Math.max(8, Math.min(r.left, window.innerWidth - w - 8)),
      width: w,
    });
  }, []);

  useLayoutEffect(() => { if (open) place(); }, [open, place]);

  /* 每次打开都从干净状态开始：清空搜索 / 快筛，高亮落在当前已选项上。
     依赖只写 open —— opts / value 变化时不应把用户正在输入的搜索词重置掉。 */
  useEffect(() => {
    if (!open) return;
    setKw(''); setGrp(''); setShown(PICK_PAGE);
    const i = list.findIndex((o) => emitOf(o) === value);
    setHl(i >= 0 ? i : 0);
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 点击外部关闭 + resize/scroll 重定位
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || popRef.current?.contains(t)) return;
      setOpen(false);
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, place]);

  /* 键盘移动高亮时，保证高亮行始终落在列表可视区内。
     依赖不写 list —— 候选集恒等变化时不应把用户手动滚动的位置抢回去。 */
  useEffect(() => {
    if (!open) return;
    (listRef.current?.querySelector('.is-hl') as HTMLElement | null)?.scrollIntoView({ block: 'nearest' });
  }, [hl, open, shown]);

  const pick = (v: string) => { onChange(v); setOpen(false); };
  const reset = () => { setKw(''); setGrp(''); setShown(PICK_PAGE); setHl(0); };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      /* 已渲染的末行还按 ↓：自动再取一页，键盘流不中断 */
      if (hl + 1 >= visible.length && visible.length < list.length) setShown((v) => v + PICK_PAGE);
      setHl((h) => Math.min(h + 1, list.length - 1));
    } else if (e.key === 'ArrowUp') { e.preventDefault(); setHl((h) => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); const it = list[hl]; if (it) pick(emitOf(it)); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
  };

  /** 关键词高亮：只标第一处命中，够用且不必为正则做转义 */
  const mark = (text: string) => {
    const k = kw.trim();
    const i = k ? text.toLowerCase().indexOf(k.toLowerCase()) : -1;
    if (i < 0) return <>{text}</>;
    return <>{text.slice(0, i)}<mark className="nc-combo-mark">{text.slice(i, i + k.length)}</mark>{text.slice(i + k.length)}</>;
  };

  return (
    /* 传了 width 的用法多出现在筛选条里，wrapper 必须是行内块，否则会独占一行 */
    <div className={`nc-combo${width ? ' is-fixed' : ''}`}>
      <button
        type="button" ref={btnRef} aria-haspopup="listbox" aria-expanded={open}
        className={`nc-combo-trigger${open ? ' is-open' : ''}`}
        style={width ? { width } : undefined}
        onClick={() => setOpen((v) => !v)}
      >
        {cur
          ? <span className="nc-combo-val">{cur.code && <span className="num">{cur.code}</span>}{cur.code ? ' ' : ''}{cur.name}</span>
          : <span className="nc-combo-ph">{placeholder ?? '请选择'}</span>}
        <span className="nc-combo-caret" />
      </button>

      {open && createPortal(
        <div ref={popRef} className="nc-combo-pop" style={{ top: pos.top, left: pos.left, width: pos.width }}>
          <div className="nc-combo-search">
            <Ico n="search" size={16} />
            <input
              ref={inputRef} className="nc-combo-input" value={kw}
              placeholder={searchPlaceholder ?? '搜索编号 / 名称'}
              onChange={(e) => { setKw(e.target.value); setHl(0); setShown(PICK_PAGE); }} onKeyDown={onKey}
            />
            {kw && (
              <button type="button" className="nc-combo-clr" title="清空"
                onClick={() => { setKw(''); setHl(0); setShown(PICK_PAGE); inputRef.current?.focus(); }}><Ico n="close" size={14} /></button>
            )}
          </div>

          {filter && groups.length > 1 && (
            <div className="nc-combo-chips">
              <button type="button" className={`nc-fchip${grp === '' ? ' is-on' : ''}`} onClick={() => { setGrp(''); setHl(0); setShown(PICK_PAGE); }}>全部{filterLabel}</button>
              {groups.map((t) => (
                <button key={t} type="button" className={`nc-fchip${grp === t ? ' is-on' : ''}`} onClick={() => { setGrp(t); setHl(0); setShown(PICK_PAGE); }}>{t}</button>
              ))}
            </div>
          )}

          <div ref={listRef} className="nc-combo-list" role="listbox">
            {visible.map((o, i) => (
              <div
                key={o.clear ? '__clear' : o.id} role="option" aria-selected={emitOf(o) === value}
                className={`nc-combo-item${o.clear ? ' is-clear' : ''}${i === hl ? ' is-hl' : ''}${emitOf(o) === value ? ' is-on' : ''}`}
                onMouseEnter={() => setHl(i)} onClick={() => pick(emitOf(o))}
              >
                {o.clear ? (
                  <div className="nc-combo-main"><span className="nc-combo-name">{o.name}</span></div>
                ) : (
                  <>
                    <div className="nc-combo-main">
                      {o.code && <span className="num nc-combo-id">{mark(o.code)}</span>}
                      <span className="nc-combo-name">{mark(o.name)}</span>
                      {(o.badges ?? []).map((b) => <Tag key={b.text} tone={b.tone}>{b.text}</Tag>)}
                    </div>
                    <div className="nc-combo-sub">
                      {(o.tags ?? []).map((t) => <Tag key={t.text} tone={t.tone}>{t.text}</Tag>)}
                      {o.sub && <span className="nc-combo-cust">{mark(o.sub)}</span>}
                    </div>
                  </>
                )}
                {emitOf(o) === value && <span className="nc-combo-ck"><Ico n="check" size={14} /></span>}
              </div>
            ))}
            {!matched.length && (
              <div className="nc-combo-empty">
                <div><Ico n="search" size={20} /></div>
                <div>{emptyText ?? '没有匹配的项'}</div>
                <div><button type="button" className="nc-link" onClick={reset}>清空搜索条件</button></div>
              </div>
            )}
          </div>

          {visible.length < list.length && (
            <button type="button" className="nc-combo-more" onClick={() => setShown((v) => v + PICK_PAGE)}>
              获取更多（还有 {list.length - visible.length} 项）
            </button>
          )}

          <div className="nc-combo-foot">
            共 {opts.length} {unit} · 匹配 <b>{matched.length}</b> 项 · 已显示 {visible.filter((r) => !r.clear).length}
            <span className="nc-combo-keys">↑↓ 选择 · Enter 确认 · Esc 关闭</span>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

/* ---------- 项目 ---------- */

export type ProjOpt = {
  id: string; name: string; customer: string; type: string; status: string;
  /** A-04 风险标记：该项目存在未归并收支（仅合同提交场景需要，缺省不标） */
  a04?: boolean;
};

/** 项目候选集构造：读 store，不读 data.ts 常量 */
export function projPickOpts(scope: 'live' | 'all' = 'live'): ProjOpt[] {
  const all = getProjects();
  const live = scope === 'all' ? all : all.filter((q) => !(PROJECT_TERMINAL as readonly string[]).includes(q.status));
  return live.map((q) => ({ id: q.id, name: q.name, customer: q.customer, type: q.type, status: q.status }));
}

export function ProjectPicker({ value, onChange, options, scope = 'live', emit = 'id', clearLabel, placeholder, width }: {
  value: string;
  onChange: (v: string) => void;
  /** 显式候选集；不传则按 scope 从 store 取 */
  options?: ProjOpt[];
  scope?: 'live' | 'all';
  /** 回传值口径，见 PickEmit */
  emit?: PickEmit;
  clearLabel?: string;
  placeholder?: string;
  width?: number;
}) {
  /* 候选集缺省时自行订阅 store —— 否则别处新建了项目，这里的下拉看不到 */
  const [tick, setTick] = useState(0);
  useEffect(() => subscribeStore(() => setTick((n) => n + 1)), []);
  const src = useMemo(() => options ?? projPickOpts(scope), [options, scope, tick]);
  const opts = useMemo<PickOpt[]>(
    () => src.map((p) => {
      const tags: PickTag[] = [{ text: p.type, tone: 'gray' }];
      if (p.status) tags.push({ text: p.status, tone: (PROJECT_STATUS_TONE[p.status] ?? 'gray') as TagTone });
      const badges: PickTag[] = p.a04 ? [{ text: '收支未归并', tone: 'red' }] : [];
      return {
        id: p.id, code: p.id, name: p.name, sub: p.customer, group: p.type, tags, badges,
        search: `${p.id} ${p.name} ${p.customer} ${p.type}`,
      };
    }),
    [src],
  );
  return (
    <PickSelect
      value={value} onChange={onChange} opts={opts} unit="个项目" emit={emit}
      filter={{ label: '类型', dict: PROJ_TYPES, of: ofGroup }}
      clearLabel={clearLabel} width={width}
      placeholder={placeholder ?? '请选择项目（可按编号 / 名称 / 客户 / 类型搜索）'}
      searchPlaceholder="搜索项目编号 / 名称 / 客户 / 类型"
      emptyText="没有匹配的项目"
    />
  );
}

/* ---------- 客户 ---------- */

export type CustOpt = {
  id: string; name: string; grade?: string; status?: string;
  industry?: string; region?: string; owner?: string;
  /** 副行文本覆盖（如筛选条里带「N 个项目」）；缺省用「行业 · 地区」 */
  sub?: string;
};

/** 客户状态语义色（成交=成功绿 · 意向=进行中蓝 · 潜在=待办灰） */
const CUST_STATUS_TONE: Record<string, TagTone> = { 成交: 'green', 意向: 'blue', 潜在: 'gray' };
/** 客户等级语义色（A 战略=金 · B 重点=蓝 · C 常规=灰） */
const CUST_GRADE_TONE: Record<string, TagTone> = { A: 'gold', B: 'blue', C: 'gray' };
/** 客户等级字典（快筛档位由此派生） */
const CUST_GRADES = ['A', 'B', 'C'] as const;

export function CustomerPicker({ value, onChange, options, emit = 'id', clearLabel, placeholder, width }: {
  value: string;
  onChange: (v: string) => void;
  /** 显式候选集；不传则读客户主数据 */
  options?: CustOpt[];
  /** 回传值口径：多数老表单存的是客户名，传 name 保持兼容 */
  emit?: PickEmit;
  clearLabel?: string;
  placeholder?: string;
  width?: number;
}) {
  const src: CustOpt[] = options ?? CUSTOMERS;
  const opts = useMemo<PickOpt[]>(
    () => src.map((c) => {
      const tags: PickTag[] = [];
      if (c.grade) tags.push({ text: `${c.grade} 级`, tone: CUST_GRADE_TONE[c.grade] ?? 'gray' });
      if (c.status) tags.push({ text: c.status, tone: CUST_STATUS_TONE[c.status] ?? 'gray' });
      return {
        id: c.id, code: c.id, name: c.name, group: c.grade, tags,
        sub: c.sub ?? [c.industry, c.region].filter(Boolean).join(' · '),
        search: `${c.id} ${c.name} ${c.industry ?? ''} ${c.region ?? ''} ${c.owner ?? ''}`,
      };
    }),
    [src],
  );
  return (
    <PickSelect
      value={value} onChange={onChange} opts={opts} unit="个客户" emit={emit}
      filter={{ label: '等级', dict: CUST_GRADES, of: ofGroup }}
      clearLabel={clearLabel} width={width}
      placeholder={placeholder ?? '请选择客户（可按编号 / 名称 / 行业 / 地区搜索）'}
      searchPlaceholder="搜索客户编号 / 名称 / 行业 / 地区 / 归属人"
      emptyText="没有匹配的客户"
    />
  );
}

/* ---------- 商机 ---------- */

export type OppOpt = {
  id: string; name: string; customer: string; stage: string; status: string;
  owner?: string; type?: string;
};

/** 商机状态语义色（赢单=成功绿 · 输单=驳回红 · 跟进中=进行中蓝） */
const OPP_STATUS_TONE: Record<string, TagTone> = { 赢单: 'green', 输单: 'red', 跟进中: 'blue' };

export function OppPicker({ value, onChange, options, scope = 'open', emit = 'id', clearLabel, placeholder, width }: {
  value: string;
  onChange: (v: string) => void;
  /** 显式候选集；不传则读 store */
  options?: OppOpt[];
  /** open = 只列「跟进中」（默认，转报价 / 转合同 / 建投标用）；all = 含赢单与输单 */
  scope?: 'open' | 'all';
  /** 回传值口径，见 PickEmit */
  emit?: PickEmit;
  clearLabel?: string;
  placeholder?: string;
  width?: number;
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => subscribeStore(() => setTick((n) => n + 1)), []);
  const src = useMemo<OppOpt[]>(() => options ?? getOpps(), [options, tick]);
  /* 阶段字典来自 store（后台可增删排序），不能写死 */
  const dict = useMemo(() => getOppStages().map((s) => s.name), [tick]);
  const opts = useMemo<PickOpt[]>(
    () => src
      .filter((o) => scope === 'all' || o.status === '跟进中')
      .map((o) => ({
        id: o.id, code: o.id, name: o.name, sub: o.customer, group: o.stage,
        tags: [
          { text: o.stage, tone: oppStageTone(getOppStageIdx(o.stage)) as TagTone },
          { text: o.status, tone: OPP_STATUS_TONE[o.status] ?? 'gray' },
        ],
        search: `${o.id} ${o.name} ${o.customer} ${o.owner ?? ''} ${o.type ?? ''}`,
      })),
    [src, scope],
  );
  return (
    <PickSelect
      value={value} onChange={onChange} opts={opts} unit="个商机" emit={emit}
      filter={{ label: '阶段', dict, of: ofGroup }}
      clearLabel={clearLabel} width={width}
      placeholder={placeholder ?? '请选择商机（可按编号 / 名称 / 客户 / 负责人搜索）'}
      searchPlaceholder="搜索商机编号 / 名称 / 客户 / 负责人"
      emptyText="没有匹配的商机"
    />
  );
}

/* ---------- 合同 ---------- */

export type ContractOpt = {
  id: string; name: string; type: string; status: string;
  party?: string; project?: string; owner?: string; amt?: number;
};

export function ContractPicker({ value, onChange, options, scope = 'live', emit = 'id', clearLabel, placeholder, width }: {
  value: string;
  onChange: (v: string) => void;
  /** 显式候选集；不传则读 store */
  options?: ContractOpt[];
  /** live = 排除已续签 / 已终止（默认，挂新单据用）；all = 含终态（筛选与回溯用） */
  scope?: 'live' | 'all';
  /** 回传值口径，见 PickEmit */
  emit?: PickEmit;
  clearLabel?: string;
  placeholder?: string;
  width?: number;
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => subscribeStore(() => setTick((n) => n + 1)), []);
  const src = useMemo<ContractOpt[]>(() => options ?? getContracts(), [options, tick]);
  const opts = useMemo<PickOpt[]>(
    () => src
      .filter((c) => scope === 'all' || !(CONTRACT_TERMINAL as readonly string[]).includes(normContractStatus(c.status)))
      .map((c) => {
        const st = normContractStatus(c.status);
        return {
          id: c.id, code: c.id, name: c.name, sub: c.party, group: c.type,
          tags: [
            { text: c.type, tone: 'gray' },
            { text: st, tone: (CONTRACT_STATUS_TONE[st] ?? 'gray') as TagTone },
          ],
          search: `${c.id} ${c.name} ${c.party ?? ''} ${c.project ?? ''} ${c.owner ?? ''}`,
        };
      }),
    [src, scope],
  );
  return (
    <PickSelect
      value={value} onChange={onChange} opts={opts} unit="份合同" emit={emit}
      filter={{ label: '类型', dict: CONTRACT_TYPES, of: ofGroup }}
      clearLabel={clearLabel} width={width}
      placeholder={placeholder ?? '请选择合同（可按编号 / 名称 / 签约方 / 项目搜索）'}
      searchPlaceholder="搜索合同编号 / 名称 / 签约方 / 项目"
      emptyText="没有匹配的合同"
    />
  );
}

/* ---------- 供应商 ---------- */

export type SupOpt = {
  id: string; name: string; status: string; level: string;
  cats?: string[]; contact?: string; phone?: string;
};

/** 供应商状态语义色（已准入=成功绿 · 待准入=待办橙 · 已冻结=驳回红） */
const SUP_STATUS_TONE: Record<string, TagTone> = { 已准入: 'green', 待准入: 'orange', 已冻结: 'red' };
/** 供应商等级字典 */
const SUP_LEVELS = ['A', 'B', 'C', 'D'] as const;

export function SupplierPicker({ value, onChange, options, scope = 'live', emit = 'id', clearLabel, placeholder, width }: {
  value: string;
  onChange: (v: string) => void;
  /** 显式候选集；不传则读供应商主数据 */
  options?: SupOpt[];
  /** live = 只列「已准入」（默认，下单 / 比价用）；all = 含待准入与已冻结 */
  scope?: 'live' | 'all';
  /** 回传值口径，见 PickEmit */
  emit?: PickEmit;
  clearLabel?: string;
  placeholder?: string;
  width?: number;
}) {
  const src: SupOpt[] = options ?? SUPPLIERS;
  const opts = useMemo<PickOpt[]>(
    () => src
      .filter((s) => scope === 'all' || s.status === '已准入')
      .map((s) => ({
        id: s.id, code: s.id, name: s.name, group: s.level,
        sub: (s.cats ?? []).join(' / '),
        tags: [
          { text: s.status, tone: SUP_STATUS_TONE[s.status] ?? 'gray' },
          { text: `${s.level} 级`, tone: 'gray' },
        ],
        search: `${s.id} ${s.name} ${(s.cats ?? []).join(' ')} ${s.contact ?? ''} ${s.phone ?? ''}`,
      })),
    [src, scope],
  );
  return (
    <PickSelect
      value={value} onChange={onChange} opts={opts} unit="家供应商" emit={emit}
      filter={{ label: '等级', dict: SUP_LEVELS, of: ofGroup }}
      clearLabel={clearLabel} width={width}
      placeholder={placeholder ?? '请选择供应商（可按编号 / 名称 / 品类 / 联系人搜索）'}
      searchPlaceholder="搜索供应商编号 / 名称 / 品类 / 联系人"
      emptyText="没有匹配的供应商"
    />
  );
}

/** 我方签约主体选择器（合同主体与筛选共用）—— 集团多主体口径，
 *  列表行展示 short，选择器弹层展示 name + kind + uscc。 */
export function EntityPicker({ value, onChange, emit = 'id', clearLabel, placeholder, width }: {
  value: string;
  onChange: (v: string) => void;
  emit?: PickEmit;
  clearLabel?: string;
  placeholder?: string;
  width?: number;
}) {
  const opts = useMemo<PickOpt[]>(
    () => OUR_ENTITIES.map((e) => ({
      id: e.id, code: e.id, name: e.name, sub: `${e.kind} · ${e.uscc}`,
      tags: [{ text: e.short, tone: 'blue' }],
      search: `${e.id} ${e.name} ${e.short} ${e.kind}`,
    })),
    [],
  );
  return (
    <PickSelect
      value={value} onChange={onChange} opts={opts} unit="个主体" emit={emit}
      clearLabel={clearLabel} width={width}
      placeholder={placeholder ?? '请选择我方签约主体'}
      searchPlaceholder="搜索主体编号 / 全称 / 简称"
      emptyText="没有匹配的主体"
    />
  );
}

/* ---------- 物料（物料 / 服务 / 软件 / 套件） ---------- */

export type ItemOpt = {
  code: string; name: string; spec?: string; ty: string;
  /** 副行文本覆盖（如按仓库带出「可用 N」）；缺省用 spec */
  sub?: string;
  unit?: string; cat?: string; stock?: number; status?: string;
};

export function ItemPicker({ value, onChange, options, kinds, scope = 'active', emit = 'id', clearLabel, placeholder, width }: {
  value: string;
  /** 回传物料编码（emit='id' 时即编码） */
  onChange: (v: string) => void;
  /** 显式候选集；不传则按 scope 从 store 取 */
  options?: ItemOpt[];
  /** 限定类型；**须传模块级常量数组**（内核把它当 useMemo 依赖） */
  kinds?: readonly string[];
  /** active = 只列启用（默认）；all = 含停用 */
  scope?: 'active' | 'all';
  /** 回传值口径，见 PickEmit */
  emit?: PickEmit;
  clearLabel?: string;
  placeholder?: string;
  width?: number;
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => subscribeStore(() => setTick((n) => n + 1)), []);
  const src = useMemo<ItemOpt[]>(
    () => options ?? (scope === 'all' ? getItems() : getActiveItems()),
    [options, scope, tick],
  );
  const dict = useMemo(() => kinds ?? ITEM_KINDS, [kinds]);
  const opts = useMemo<PickOpt[]>(
    () => src
      .filter((m) => !kinds || kinds.includes(m.ty))
      .map((m) => {
        const tags: PickTag[] = [{ text: m.ty, tone: 'gray' }];
        if (m.status && m.status !== '启用') tags.push({ text: m.status, tone: 'red' });
        if (typeof m.stock === 'number' && (m.ty === '物料' || m.ty === '物料')) {
          tags.push({ text: `库存 ${m.stock}`, tone: m.stock > 0 ? 'blue' : 'red' });
        }
        return {
          id: m.code, code: m.code, name: m.name, sub: m.sub ?? m.spec, group: m.ty, tags,
          search: `${m.code} ${m.name} ${m.spec ?? ''} ${m.cat ?? ''}`,
        };
      }),
    [src, kinds],
  );
  return (
    <PickSelect
      value={value} onChange={onChange} opts={opts} unit="项物料" emit={emit}
      filter={{ label: '类型', dict, of: ofGroup }}
      clearLabel={clearLabel} width={width}
      placeholder={placeholder ?? '请选择物料（可按编码 / 名称 / 规格 / 目录搜索）'}
      searchPlaceholder="搜索物料编码 / 名称 / 规格 / 目录"
      emptyText="没有匹配的物料"
    />
  );
}

/* ============================ 水印设置（导出 / 分享前配置） ============================ */
/**
 * 水印设置弹窗：导出 / 分享前配置水印内容。
 * 替代原先写死的「导出人 + 时间 + 租户」口径 —— 支持自定义文本（如「仅限××项目使用」）、
 * 快捷模板、关联项目（自动替换文本中的「本项目」）、以及附加信息开关。
 */
export function WatermarkModal({ open, onClose, onConfirm, scope, userName }: {
  open: boolean;
  onClose: () => void;
  /** 确认回调：回传最终水印配置（text 已按所选项目解析） */
  onConfirm: (cfg: { text: string; proj: string; by: boolean; time: boolean; tenant: boolean }) => void;
  /** 作用范围描述，如「证书台账」「已选 3 个文档」 */
  scope?: string;
  /** 当前用户名（用于水印里的「导出人」）；不传时兜底「当前用户」 */
  userName?: string;
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
  const realNow = (() => { const d = new Date(); const p = (n: number) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`; })();
  const extras = [
    by ? `导出人：${userName || '当前用户'}` : '',
    time ? `时间：${realNow}` : '',
    tenant ? '租户：云南诺安消防' : '',
  ].filter(Boolean);
  const preview = [main, ...extras].join('  ·  ');
  const projName = getProjects().find((p) => p.id === proj)?.name;

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
        <ProjectPicker
          value={proj} onChange={setProj} scope="all"
          clearLabel="不关联具体项目" placeholder="不关联具体项目（可搜索）"
        />
      </Field>
      <Field label="附加信息" span={2}>
        <div className="nc-pick-inline">
          <Check checked={by} onChange={setBy} label="导出人" />
          <Check checked={time} onChange={setTime} label="导出时间" />
          <Check checked={tenant} onChange={setTenant} label="租户名称" />
        </div>
      </Field>
      <Field label="水印预览" span={2}>
        <WatermarkPreview mode="doc" rows={[]} watermark={preview} totalRows={0} columns={[]} />
        <div className="nc-tiny nc-muted" style={{ marginTop: 8 }}>
          {projName ? <>已关联项目：<b>{projName}</b> · </> : null}导出文件将叠加此水印，不可移除。
        </div>
      </Field>
    </Modal>
  );
}

/* ============================ 统计瓦片（证书 / 物料等） ============================ */
export function Tile({ label, value, sub, tone, onClick, active, tip, tipW }: {
  label: string; value: React.ReactNode; sub?: React.ReactNode;
  tone?: 'red' | 'orange' | 'green' | 'blue'; onClick?: () => void; active?: boolean;
  /** 指标口径帮助提示：label 后显示 ? 图标 */
  tip?: React.ReactNode; tipW?: number;
}) {
  const isZeroWarn = typeof value === 'number' && value === 0 && (tone === 'orange' || tone === 'red');
  const effTone = isZeroWarn ? undefined : tone;
  return (
    <div className={`nc-tile${onClick ? ' is-clickable' : ''}${active ? ' is-active' : ''}`} onClick={onClick} {...pressProps(onClick)}>
      <div className="nc-tile-label">{label}{tip && <Tip text={tip} w={tipW} />}</div>
      <div className={`nc-tile-value num${effTone ? ` nc-v-${effTone}` : ''}${isZeroWarn ? ' nc-v-muted' : ''}`}>{value}</div>
      {sub && <div className="nc-tile-sub">{sub}</div>}
    </div>
  );
}

/* ============================ 列表页骨架（批量操作条 / 电话脱敏） ============================ */

/**
 * 手机号脱敏：13812340101 → 138****0101（前 3 后 4，中间 4 位星号）。
 * 空值 / 非 11 位标准手机号（座机、已脱敏串、异常值）原样返回，不臆造掩码。
 */
export const maskPhone = (phone?: string | null): string => {
  const p = (phone ?? '').trim();
  if (!p) return p;
  if (!/^\d{11}$/.test(p)) return p;
  return `${p.slice(0, 3)}****${p.slice(7)}`;
};

/**
 * 电话可见性（独立权限矩阵，不再挂金额权限 money）。
 * 角色级默认：超级管理员 / 经营决策 / 销售 / 项目经理（客户归属与对接方）列表内可见全号；
 * 财务 / 行政 / 商务合同管理员 / 投标 / 资料等后台台账角色列表内脱敏。
 * 「本人 / 本团队成员」在运行期应叠加记录 owner 判定，此处提供角色级默认。
 */
export const canSeePhone = (role: string): boolean =>
  ['sysadmin', 'boss', 'deputy', 'sales', 'pm'].includes(role);

/** 批量操作条动作项 */
export type BatchAction = {
  label: string;
  onClick: () => void;
  kind?: 'default' | 'primary' | 'danger';
  disabled?: boolean;
};

/**
 * 勾选后上浮的批量操作条：与表格同宽，浅灰底 + 主题色左边框，高度紧凑（约 40px）。
 * 仅当 selectedCount > 0 时渲染；左侧「已选 N 项」+ 操作按钮组，右侧「取消选择」清空勾选。
 * 用法：列表 selectable 勾选后，在表格上方挂载本组件。
 */
export function BatchActionBar({ selectedCount, actions, onClear }: {
  selectedCount: number;
  actions: BatchAction[];
  onClear: () => void;
}) {
  if (selectedCount <= 0) return null;
  return (
    <div className="nc-batchbar" role="region" aria-label="批量操作">
      <span className="nc-batchbar-info">已选 <b className="num">{selectedCount}</b> 项</span>
      <span className="nc-batchbar-ops">
        {actions.map((a) => (
          <Btn key={a.label} size="sm"
            kind={a.kind === 'primary' ? 'primary' : a.kind === 'danger' ? 'danger' : 'default'}
            disabled={a.disabled} onClick={a.onClick}>{a.label}</Btn>
        ))}
      </span>
      <Btn kind="link" size="sm" onClick={onClear}>取消选择</Btn>
    </div>
  );
}

/** 金额「万」单位格式化：复用 data.ts 既有 fmtWan（≥1万展示为「¥X.X万」），统一从 ui 导出供各页 import。 */
export { fmtWan };
