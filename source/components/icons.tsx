// 诺安云 6.0 · 统一 SVG 图标集
// 评审 D1：原原型中 672 处 emoji 与少量 SVG 混用作图标，存在跨端字形不一致、
// 无法随主题着色、无法统一线宽与视觉重量、在 Windows 端易退化为方框等问题。
// 本图标集为唯一图标来源：24×24 viewBox · stroke 1.5 · currentColor · 线性风格，
// 与 AntD 观感一致；emoji 后续仅允许出现在「演示态提示 / 数据种子」等非主干位。
import React from 'react';

export type IconName =
  | 'file' | 'clipboard' | 'folder' | 'book' | 'receipt' | 'scroll' | 'package' | 'camera'
  | 'chart' | 'trend' | 'target' | 'trophy' | 'coin' | 'wallet' | 'card'
  | 'users' | 'user' | 'shield' | 'wrench' | 'gear' | 'building' | 'pin' | 'robot'
  | 'bell' | 'search' | 'refresh' | 'edit' | 'paperclip' | 'star' | 'swap' | 'lock'
  | 'check' | 'checkCircle' | 'close' | 'ban' | 'warning' | 'help' | 'bolt' | 'link' | 'arrowRight'
  | 'arrowLeft' | 'mail' | 'plus' | 'download' | 'upload' | 'clock' | 'flame' | 'module'
  | 'history';

/** 单个图标路径（24×24 网格，stroke 统一 1.5） */
const P: Record<IconName, React.ReactNode> = {
  file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></>,
  clipboard: <><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M9 12h6M9 16h4" /></>,
  folder: <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />,
  book: <><path d="M4 4a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2z" /><path d="M4 17h15" /></>,
  receipt: <><path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2z" /><path d="M9 8h6M9 12h6" /></>,
  scroll: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h3" /></>,
  package: <><path d="M12 2 3 7v10l9 5 9-5V7z" /><path d="M3 7l9 5 9-5M12 12v10" /></>,
  camera: <><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><circle cx="12" cy="13" r="3.5" /></>,
  chart: <><path d="M4 20h16" /><rect x="6" y="11" width="3" height="6" /><rect x="11" y="7" width="3" height="10" /><rect x="16" y="13" width="3" height="4" /></>,
  trend: <><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.4" /></>,
  trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0z" /><path d="M8 6H5v2a3 3 0 0 0 3 3M16 6h3v2a3 3 0 0 1-3 3" /><path d="M12 13v4M9 21h6M10 21l.5-4h3l.5 4" /></>,
  coin: <><ellipse cx="12" cy="6.5" rx="8" ry="3.2" /><path d="M4 6.5v11c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2v-11" /><path d="M4 12c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2" /></>,
  wallet: <><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18" /><path d="M16 14.5h2" /></>,
  card: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M17.5 20a6.6 6.6 0 0 0-2-4.7" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></>,
  shield: <><path d="M12 2l8 3.5v6c0 5-3.4 8.6-8 10.5-4.6-1.9-8-5.5-8-10.5v-6z" /><path d="M9 12l2 2 4-4" /></>,
  wrench: <path d="M14.7 6.3a4 4 0 0 0 5.1 5.1l-7.6 7.6a2.6 2.6 0 0 1-3.7-3.7z" />,
  gear: <><circle cx="12" cy="12" r="3.2" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 15a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.4 8.1l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
  building: <><rect x="4" y="8" width="16" height="13" rx="1" /><path d="M2 21h20" /><path d="M8 12h2M14 12h2M8 16h2M14 16h2" /><path d="M12 3v5M9 5.5h6" /></>,
  pin: <><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
  robot: <><rect x="4" y="8" width="16" height="12" rx="2" /><path d="M12 8V4M8.5 4h7" /><circle cx="9" cy="14" r="1.2" /><circle cx="15" cy="14" r="1.2" /><path d="M2 13v3M22 13v3" /></>,
  bell: <><path d="M18 8a6 6 0 1 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" /><path d="M10.3 19a2 2 0 0 0 3.4 0" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
  refresh: <><path d="M21 12a9 9 0 1 1-2.6-6.4" /><path d="M21 4v5h-5" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
  paperclip: <path d="M21.4 11.1l-8.8 8.8a5 5 0 0 1-7.1-7.1l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8" />,
  star: <path d="M12 3.5l2.6 5.6 6 .9-4.4 4.3 1 6.1-5.2-2.9-5.2 2.9 1-6.1L3.4 10l6-.9z" />,
  swap: <><path d="M7 7h13l-3-3M17 17H4l3 3" /><path d="M20 7l-3 3" /></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
  check: <path d="M4 12.5l5 5L20 6.5" />,
  checkCircle: <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.5 2.5L16 9.5" /></>,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  ban: <><circle cx="12" cy="12" r="9" /><path d="M5.6 5.6l12.8 12.8" /></>,
  warning: <><path d="M12 3.5L2.5 20h19z" /><path d="M12 10v4.5M12 17.3v.2" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.6 9.4a2.5 2.5 0 1 1 3.3 2.4c-.6.2-.9.7-.9 1.3v.5" /><path d="M12 16.9v.2" /></>,
  bolt: <path d="M13 2L4.5 13.5H11l-1 8.5L19.5 10H13z" />,
  link: <><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" /><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" /></>,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H5M11 18l-6-6 6-6" />,
  mail: <><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  download: <><path d="M12 3v12" /><path d="M7.5 10.5L12 15l4.5-4.5" /><path d="M4 20h16" /></>,
  upload: <><path d="M12 15V3" /><path d="M7.5 7.5L12 3l4.5 4.5" /><path d="M4 20h16" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>,
  flame: <><path d="M12 22c4 0 6.5-2.6 6.5-6.2 0-4.4-4.5-6.3-3.6-11.8-2.6 1-4.4 3.2-4.4 5.6 0 1.4.6 2.4.6 3.4 0 1.2-.9 2-1.9 2-1.1 0-1.9-.9-1.9-2.2 0-1.2.5-2 .5-2S5.5 12.6 5.5 15.8C5.5 19.4 8 22 12 22z" /></>,
  module: <><rect x="3" y="3" width="7.5" height="7.5" rx="1" /><rect x="13.5" y="3" width="7.5" height="7.5" rx="1" /><rect x="3" y="13.5" width="7.5" height="7.5" rx="1" /><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1" /></>,
  history: <><path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" /><path d="M3.5 4.6V9H8" /><path d="M12 7.6V12l3 1.8" /></>,
};

export function Ico({ n, size = 16, className, style, title }: {
  n: IconName; size?: number; className?: string; style?: React.CSSProperties; title?: string;
}) {
  return (
    <svg
      className={`nc-ico${className ? ` ${className}` : ''}`}
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}
      style={{ flex: 'none', ...style }}
    >
      {title && <title>{title}</title>}
      {P[n]}
    </svg>
  );
}

/** 带语义色的状态图标（替代原 emoji：✓ / ⚠ / ⛔ / ✕） */
export function StatusIco({ kind, size = 14 }: { kind: 'ok' | 'warn' | 'ban' | 'close' | 'info'; size?: number }) {
  const map: Record<string, { n: IconName; c: string }> = {
    ok: { n: 'checkCircle', c: 'var(--c-success-deep)' },
    warn: { n: 'warning', c: 'var(--c-warning-mid)' },
    ban: { n: 'ban', c: 'var(--c-danger)' },
    close: { n: 'close', c: 'var(--c-danger)' },
    info: { n: 'warning', c: 'var(--c-info-ink)' },
  };
  const m = map[kind];
  return <Ico n={m.n} size={size} style={{ color: m.c }} />;
}
