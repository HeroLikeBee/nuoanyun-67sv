// 诺安云 6.0 · AI 助手（全局悬浮窗）
//
// 形态演进（用户 2026-09-24 评审）：
//   原形态 = 顶栏「AI 助手」按钮 + 下拉浮层（nc-dd）—— 三个问题：
//     ① 一移鼠标就关，看长答复不方便，也没法边看边操作；
//     ② 层随按钮走，用户滚到页面下半部分想提问，得先滚回顶栏；
//     ③ 答完即走，问过什么、哪些没答上来，一点痕迹都没留下。
//   新形态 = 可拖拽的常驻悬浮窗（置顶）：
//     ① 置顶悬浮，与页面内容、抽屉互不遮挡（z-index 110，高于抽屉 95）；
//     ② 答复里的「去 XX」按钮直接把用户送到对应功能页（可带聚焦实体与子页签）；
//     ③ 预置常见问题按业务域分类，点一下就有确定性口径答复；
//     ④ 会话落本地存储，并单独聚合「需求线索」——没答上来的问句才是产品迭代的真实输入。
//
// 第二轮打磨（用户 2026-09-24 复审：「不同页面路由触发不同对话提示，窗口太小、
// 页面利用率低，不方便翻看记录」）：
//   ⑤ 页面上下文提示 —— 助手先知道「你在哪个页面」，把该页最相关的几个问题摆在最前面。
//      ⚠️ 关键判断：上下文提示**不写入会话记录**。会话要留作「需求分析依据」，
//         若每切一次页面就往 msgs 里插一条系统提示，导出文本会被噪音淹没、线索统计失真。
//         所以做成「提示条」——只影响界面引导，不进会话。
//   ⑥ 窗口三档尺寸（标准 / 宽 / 大），选择落本地存储；消息气泡宽度随档位自适应。
//   ⑦ 历史视图分段（线索 / 模块 / 会话）+ 搜索 + 就地展开预览，翻看记录不再丢上下文。
//
// ⚠️ 演示态：不调用外部模型。命中预置问题给确定性答复，未命中明确说「答不上来」并记入线索。
//    （宁可承认不知道，也不要编一个听起来对的答案——这是内部工具，编答案的代价比说不知道高得多。）
// ⚠️ 文案铁律：面向业务用户，禁止出现表名 / 字段名 / 代码符号 / 架构术语。
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Btn, Tag, useToast } from './ui';
import { Ico } from './icons';
import { PAGE_META } from './data';
import { setFocus, setFocusTab, setPageAction } from './store';
import {
  AI_CATS, AI_FOLLOWUPS, AI_MISS_REPLY, AI_PRESETS, hintsFor, matchPreset, type AiPreset,
} from './ai/presets';
import { actionsFor, IMP_KINDS, IMP_STEPS, type PageAction } from './ai/actions';
import {
  aiClues, aiExportText, aiFocusRank, deleteAiSession, newAiSession, noteAiPage, openAiSession,
  pushAiMsg, useAiStore, type AiRoute,
} from './ai/store';

/* ---------------------------------------------------------------------------
   窗口尺寸三档（用户诉求：窗口太小、页面利用率低）
   高度按视口夹取：矮屏上「大」档自动收窄，不至于顶到屏幕外；
   宽度同理，避免 800px 宽的小屏上「大」档横向出屏。
   --------------------------------------------------------------------------- */
const SIZES = [
  { id: 'std', label: '标准', w: 384, h: 560 },
  { id: 'wide', label: '宽', w: 520, h: 680 },
  { id: 'large', label: '大', w: 760, h: 0 }, // h = 0 → 运行时按视口 82% 算
] as const;
type SizeId = (typeof SIZES)[number]['id'];
const SIZE_LS = 'nuoan6.ai.size';
const GAP = 24;

/* 悬浮球：圆形小按钮（原为「图标 + AI 助手」胶囊，横着占 110px，压页面内容）。
   hover 时向右侧展开露出文字 —— 平时最小巧，需要辨认时也不缺说明。
   位置可拖拽并落本地存储，避免固定右下角时挡住页面右下角的操作区。 */
const FAB = 44;
const FAB_LS = 'nuoan6.ai.fab';

function loadFab(): { x: number; y: number } | null {
  try {
    const raw = localStorage.getItem(FAB_LS);
    if (!raw) return null;
    const v = JSON.parse(raw) as { x?: number; y?: number };
    if (typeof v?.x === 'number' && typeof v?.y === 'number') return { x: v.x, y: v.y };
  } catch { /* 存储被禁用时忽略 */ }
  return null;
}

function sizeOf(id: SizeId) {
  const s = SIZES.find((x) => x.id === id) ?? SIZES[0];
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return {
    id: s.id,
    label: s.label,
    w: Math.max(320, Math.min(s.w, vw - 32)),
    h: Math.max(360, Math.min(s.h || Math.round(vh * 0.82), vh - 80)),
  };
}

/** 尺寸偏好落本地存储；隐私模式下静默回落标准档 */
function loadSize(): SizeId {
  try {
    const v = localStorage.getItem(SIZE_LS);
    if (v && SIZES.some((s) => s.id === v)) return v as SizeId;
  } catch { /* 存储被禁用时忽略 */ }
  return 'std';
}

type Props = {
  onNavigate: (pageId: string) => void;
  /** 当前角色视角：答复里带上视角，让人知道「这个答案是按谁的身份给的」 */
  roleName: string;
  /** 当前所在页面：用于「页面上下文提示」（该页最相关的常见问题） */
  page: string;
  /** 展开态由 AppShell 托管：顶栏按钮与右下角悬浮球是同一个开关的两个入口 */
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

export default function AiAssistant({ onNavigate, roleName, page, open, onOpenChange }: Props) {
  const toast = useToast();
  const { sessions, activeId, active } = useAiStore();

  const setOpen = onOpenChange;
  /** view 三态：对话 / 历史分析 / 导入识别（导入是「工作入口」，不是「问答」） */
  const [view, setView] = useState<'chat' | 'history' | 'import'>('chat');
  /** 历史视图分段：线索 / 模块关注度 / 会话记录 —— 分得清才找得到 */
  const [histTab, setHistTab] = useState<'clue' | 'rank' | 'sess'>('clue');
  /** 导入识别：识别类型 / 阶段 / 进度 / 文件名 */
  const [impKind, setImpKind] = useState(IMP_KINDS[0].id);
  const [impStage, setImpStage] = useState<'idle' | 'run' | 'done'>('idle');
  const [impPct, setImpPct] = useState(0);
  const [impFile, setImpFile] = useState('');
  const impTimer = useRef<number | null>(null);
  const [cat, setCat] = useState<string>(AI_CATS[0]);
  /** 按分类浏览（默认收起，把首屏让给「当前页面相关问题」） */
  const [browse, setBrowse] = useState(false);
  /** 历史搜索词（标题 + 消息全文） */
  const [hq, setHq] = useState('');
  /** 就地展开预览的会话 id —— 翻看历史不必跳走，也就不会丢滚动位置 */
  const [expanded, setExpanded] = useState('');
  const [draft, setDraft] = useState('');
  const [sizeId, setSizeId] = useState<SizeId>(loadSize);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  /** 悬浮球位置（可拖拽，落本地存储） */
  const [fabPos, setFabPos] = useState<{ x: number; y: number } | null>(loadFab);
  const fabPosRef = useRef(fabPos);
  fabPosRef.current = fabPos;
  /** 刚发生过拖拽 → 抑制随之而来的 click（否则拖完会顺手把面板打开） */
  const justDragged = useRef(false);
  /** resize 时强制重渲染：「大」档高度依赖视口，不重渲染就跟不上窗口变化 */
  const [, force] = useState(0);

  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const sz = sizeOf(sizeId);
  /* resize 监听里要读最新尺寸，用 ref 避免闭包拿到旧值 */
  const szRef = useRef(sz);
  szRef.current = sz;

  /** 把窗口夹在视口内（拖到边缘、或浏览器窗口缩小后都不至于跑出屏幕） */
  const clampWith = (x: number, y: number, w: number, h: number) => ({
    x: Math.max(8, Math.min(x, Math.max(8, window.innerWidth - w - 8))),
    y: Math.max(56, Math.min(y, Math.max(56, window.innerHeight - h - 8))),
  });
  const clamp = (x: number, y: number) => clampWith(x, y, sz.w, sz.h);
  const defPos = (w = sz.w, h = sz.h) => clampWith(window.innerWidth - w - GAP, window.innerHeight - h - GAP, w, h);

  /* 悬浮球允许贴边（夹取范围 0 ~ 视口-FAB，不留内缩）—— 用户明确要求「能拖到页面边缘位置」。
     因为展开方向已按位置自适应（靠右向左展开），贴住右边缘也不会顶出屏幕。 */
  const clampFab = (x: number, y: number) => ({
    x: Math.max(0, Math.min(x, window.innerWidth - FAB)),
    y: Math.max(0, Math.min(y, window.innerHeight - FAB)),
  });
  /* 默认落在右下角，但比常规悬浮球上移一截：页面右下角有常驻的浮动操作按钮
     （实测「发起催收」就在这个位置），贴着底部放会正好压住它。
     位置可拖拽并落本地存储，用户觉得碍事就自己挪走。 */
  const defFab = () => clampFab(window.innerWidth - FAB - GAP, window.innerHeight - FAB - 88);

  useEffect(() => { if (open && !pos) setPos(defPos()); }, [open, pos]);
  useEffect(() => {
    const onResize = () => {
      setPos((p) => (p ? clampWith(p.x, p.y, szRef.current.w, szRef.current.h) : p));
      setFabPos((p) => (p ? clampFab(p.x, p.y) : p));
      force((n) => n + 1);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  /* 新消息 / 切会话后滚到底：助手答复较长，不自动滚会看不到最新内容。
     ⚠️ 只在对话视图里滚 —— 历史视图也滚到底，会把「需求线索」标题顶出可视区，
        用户打开历史看到的第一屏直接是半截卡片，像是页面坏了。 */
  useEffect(() => {
    if (view !== 'chat') return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [active?.msgs.length, activeId, view, open]);

  /** 可路由定位：先写聚焦信息（目标页读它定位到具体实体 / 子页签），再跳页并触发路由脉冲 */
  const doRoute = (r: AiRoute) => {
    if (r.focus) setFocus(r.page, r.focus);
    if (r.tab) setFocusTab(r.page, r.tab);
    onNavigate(r.page);
    noteAiPage(r.page);
    toast(`已定位到「${PAGE_META[r.page]?.title ?? r.page}」`);
  };

  /**
   * 快捷操作（OCR 识别 / 导入 / 上传这类）：助手只负责「跳到入口并打开」，不代替用户提交。
   * 动作经 store 的 pageAction 通道传给目标页，目标页以 nav 脉冲为依赖消费 ——
   * 已在目标页时再点一次也能重新打开（onNavigate 每次都 setNav+1）。
   */
  const runAction = (a: PageAction) => {
    const target = a.to ?? page;
    setPageAction(target, a.id);
    onNavigate(target);
    noteAiPage(target);
    toast(`已打开「${a.label}」`);
  };

  /* ---------------- 导入识别（面板内的工作入口） ---------------- */
  const impKindObj = IMP_KINDS.find((k) => k.id === impKind) ?? IMP_KINDS[0];

  /**
   * 演示态：不真的解析文件。选 / 拖入后模拟识别进度，产出预置字段样例。
   * ⚠️ 进度分 4 段（上传 → 版面分析 → 字段提取 → 完成）而不是一根匀速条 ——
   *    用户要能看出「现在卡在哪一步」，匀速条只会让人怀疑是不是死了。
   */
  const runImport = (fileName?: string) => {
    if (impStage === 'run') return;
    if (impTimer.current) window.clearInterval(impTimer.current);
    setImpFile(fileName || `${impKindObj.label}扫描件-示例.pdf`);
    setImpStage('run');
    setImpPct(0);
    let p = 0;
    impTimer.current = window.setInterval(() => {
      p += 25;
      setImpPct(p);
      if (p >= 100) {
        if (impTimer.current) window.clearInterval(impTimer.current);
        impTimer.current = null;
        setImpStage('done');
      }
    }, 300);
  };

  /** 识别结果 → 带到业务页核对（复用页面快捷操作的 action 通道，不另造一套） */
  const goVerify = () => {
    const k = impKindObj;
    runAction({ id: k.actionId, label: k.goLabel, ico: k.ico, hint: '', to: k.toPage });
  };

  /* 面板关闭 / 卸载时清掉模拟进度定时器，避免在已卸载组件上 setState */
  useEffect(() => () => { if (impTimer.current) window.clearInterval(impTimer.current); }, []);

  const send = (raw?: string) => {
    const text = (raw ?? draft).trim();
    if (!text) return;
    pushAiMsg({ role: 'user', text });
    const hit: AiPreset | null = matchPreset(text);
    if (hit) pushAiMsg({ role: 'ai', text: hit.a, src: hit.src, routes: hit.routes, presetId: hit.id });
    else pushAiMsg({ role: 'ai', text: AI_MISS_REPLY, miss: true });
    setDraft('');
    setView('chat');
  };

  /** 尺寸循环切换；切完立刻把窗口拉回视口内（大档变宽后右下角可能已经出屏） */
  const cycleSize = () => {
    const i = SIZES.findIndex((s) => s.id === sizeId);
    const next = SIZES[(i + 1) % SIZES.length].id;
    setSizeId(next);
    try { localStorage.setItem(SIZE_LS, next); } catch { /* 同上 */ }
    const n = sizeOf(next);
    setPos((p) => (p ? clampWith(p.x, p.y, n.w, n.h) : p));
  };

  /** 拖拽：只在头部按下时启用，点在按钮上不触发（否则点「关闭」会连带拖动） */
  const onDragStart = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button, input, textarea')) return;
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ox = e.clientX - rect.left;
    const oy = e.clientY - rect.top;
    setDragging(true);
    const move = (ev: MouseEvent) => setPos(clampWith(ev.clientX - ox, ev.clientY - oy, szRef.current.w, szRef.current.h));
    const up = () => {
      setDragging(false);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  /* 悬浮球拖拽：与面板同构，但多了「区分点击与拖拽」—— 位移超过 3px 才算拖，
     否则松手时会既移动了位置又把面板弹开（用户只想点开）。 */
  const onFabDown = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const d = { ox: e.clientX - rect.left, oy: e.clientY - rect.top, sx: e.clientX, sy: e.clientY, moved: false };
    const move = (ev: MouseEvent) => {
      if (Math.abs(ev.clientX - d.sx) > 3 || Math.abs(ev.clientY - d.sy) > 3) d.moved = true;
      if (!d.moved) return;
      const np = clampFab(ev.clientX - d.ox, ev.clientY - d.oy);
      fabPosRef.current = np; // 同步写 ref：up 时读它落盘，避免读到 setState 的滞后值
      setFabPos(np);
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      justDragged.current = d.moved;
      if (d.moved && fabPosRef.current) {
        try { localStorage.setItem(FAB_LS, JSON.stringify(fabPosRef.current)); } catch { /* 同上 */ }
      }
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };

  /* ⚠️ 不能对 clues / rank 用 useMemo(sessions) —— pushAiMsg 是就地 push（数组引用不变），
     useMemo 不会重算。这里每次渲染直接算：数据量极小（几十条），且组件已由订阅强制重渲染。 */
  const clues = aiClues();
  const rank = aiFocusRank();
  const asked = sessions.reduce((n, s) => n + s.msgs.filter((m) => m.role === 'user').length, 0);
  const catQs = AI_PRESETS.filter((p) => p.cat === cat);

  /* 页面上下文：该页最相关的常见问题（未配置的页面回落为「按分类浏览」） */
  const pageHints = hintsFor(page);
  /* 页面快捷操作：该页最常用的入口（OCR 识别 / 导入 / 上传）—— 点一下跳过去并打开 */
  const pageActions = actionsFor(page);
  const pageTitle = PAGE_META[page]?.title ?? page;
  /** 未配置提示的页面直接把分类浏览摊开，否则用户没有可点的入口 */
  const showBrowse = browse || pageHints.length === 0;

  /* 历史搜索：命中标题或任一条消息全文 */
  const hqL = hq.trim().toLowerCase();
  const sessList = hqL
    ? sessions.filter((s) => s.title.toLowerCase().includes(hqL)
      || s.msgs.some((m) => m.text.toLowerCase().includes(hqL)))
    : sessions;

  /* ---------------- 悬浮球（未展开时的入口） ---------------- */
  const fabP = fabPos ?? defFab();
  /* ⚠️ 展开方向必须按位置自适应：悬浮球贴在右侧时若仍向右展开，会直接顶出屏幕
     （实测截图：只露出「🤖 A」就被裁掉）。右侧空间不够就向左展开 —— 图标在右、文字在左，
     且改用 right 锚定，这样宽度增长是往左长的，右边缘始终不动。
     EXPAND_W 必须与 CSS 里 `.nc-asst-fab:hover` 的 width 保持一致。 */
  const EXPAND_W = 116;
  const expandLeft = fabP.x + EXPAND_W > window.innerWidth - 8;
  const fab = (
    <button
      className={`nc-asst-fab${expandLeft ? ' is-left' : ''}`}
      style={expandLeft
        ? { right: Math.max(8, window.innerWidth - fabP.x - FAB), top: fabP.y }
        : { left: fabP.x, top: fabP.y }}
      onMouseDown={onFabDown}
      onClick={() => {
        /* 拖完松手会紧跟一个 click —— 用 moved 标志吃掉它，否则「挪个位置」会顺带弹开面板 */
        if (justDragged.current) { justDragged.current = false; return; }
        setOpen(true); setView('chat');
      }}
      title="AI 助手 · 按住可拖动 · 问口径 / 问流程 / 直达功能页" aria-label="打开 AI 助手"
    >
      <span className="nc-asst-fab-ico">
        <Ico n="robot" size={19} />
        {clues.length > 0 && <span className="nc-asst-fab-dot" title={`${clues.length} 条需求线索`} />}
      </span>
      <span className="nc-asst-fab-t">AI 助手</span>
    </button>
  );

  if (!open) return createPortal(fab, document.body);

  const p = pos ?? defPos();
  const nextSize = SIZES[(SIZES.findIndex((s) => s.id === sizeId) + 1) % SIZES.length];

  const body = (
    <>
      {/* 悬浮球在面板打开时收起，避免与面板右下角重叠 */}
      <div
        ref={panelRef} className={`nc-asst is-${sz.id}${dragging ? ' is-dragging' : ''}`}
        style={{ left: p.x, top: p.y, width: sz.w, height: sz.h }}
      >
        {/* ---- 头部（拖拽手柄） ---- */}
        <div className="nc-asst-hd" onMouseDown={onDragStart} title="按住可拖动">
          <span className="nc-asst-hd-ico"><Ico n="robot" size={16} /></span>
          <span className="nc-asst-hd-t">
            <b>AI 助手</b>
            <span className="nc-asst-hd-sub">
              <Tag tone="blue">置顶</Tag>
              <span>视角 {roleName}</span>
            </span>
          </span>
          <button className="nc-asst-ib" title={`切换窗口尺寸（当前「${sz.label}」，下一档「${nextSize.label}」）`} onClick={cycleSize}>
            {/* 自绘「尺寸」图标：方框 + 分格，比 package / scroll 更能表达「窗口大小」 */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 14h18M14 3v18" />
            </svg>
          </button>
          <button className="nc-asst-ib" title={view === 'chat' ? '历史会话与需求线索' : '返回对话'}
            onClick={() => setView(view === 'chat' ? 'history' : 'chat')}>
            <Ico n={view === 'chat' ? 'history' : 'arrowLeft'} size={14} />
          </button>
          <button className="nc-asst-ib" title="新建会话" onClick={() => { newAiSession(); setView('chat'); setDraft(''); setExpanded(''); }}>
            <Ico n="plus" size={14} />
          </button>
          <button className="nc-asst-ib" title="收起为悬浮球" onClick={() => setOpen(false)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
        </div>

        {view === 'history' ? (
          /* ================= 历史：线索 / 模块 / 会话 ================= */
          <>
            <div className="nc-asst-tabs">
              <button className={`nc-asst-tab${histTab === 'clue' ? ' is-on' : ''}`} onClick={() => setHistTab('clue')}>
                需求线索 <b>{clues.length}</b>
              </button>
              <button className={`nc-asst-tab${histTab === 'rank' ? ' is-on' : ''}`} onClick={() => setHistTab('rank')}>
                模块关注 <b>{rank.length}</b>
              </button>
              <button className={`nc-asst-tab${histTab === 'sess' ? ' is-on' : ''}`} onClick={() => setHistTab('sess')}>
                会话记录 <b>{sessions.length}</b>
              </button>
            </div>

            <div className="nc-asst-bd" ref={listRef}>
              {histTab === 'clue' && (
                <div className="nc-asst-sec">
                  <div className="nc-asst-sec-hd">
                    没答上来的问句
                    <span className="nc-asst-sec-sub">按出现频次排序 · 这些才是要补的东西</span>
                  </div>
                  {clues.length === 0
                    ? <div className="nc-asst-empty">暂无未命中问句 —— 内置问答已覆盖目前问到的全部问题。</div>
                    : clues.map((c) => (
                      <div key={c.q} className="nc-asst-clue">
                        <span className="nc-asst-clue-q">{c.q}</span>
                        <span className="nc-asst-clue-n">出现 {c.count} 次 · 首次 {c.firstAt}</span>
                      </div>
                    ))}
                </div>
              )}

              {histTab === 'rank' && (
                <div className="nc-asst-sec">
                  <div className="nc-asst-sec-hd">
                    用户主要在哪些模块有疑问
                    <span className="nc-asst-sec-sub">按涉及会话数排序 · 点名称可跳过去</span>
                  </div>
                  {rank.length === 0
                    ? <div className="nc-asst-empty">暂无记录。</div>
                    : rank.map((r) => (
                      <div key={r.page} className="nc-asst-rank">
                        <button className="nc-asst-rank-lb" onClick={() => doRoute({ label: '', page: r.page })} title="跳到该模块">
                          {PAGE_META[r.page]?.title ?? r.page}
                        </button>
                        <span className="nc-asst-rank-bar"><i style={{ width: `${(r.n / rank[0].n) * 100}%` }} /></span>
                        <span className="nc-asst-rank-n num">{r.n}</span>
                      </div>
                    ))}
                </div>
              )}

              {histTab === 'sess' && (
                <div className="nc-asst-sec">
                  <div className="nc-asst-sec-hd">
                    会话记录
                    <span className="nc-asst-sec-sub">共 {asked} 条问句 · 留作需求分析依据</span>
                  </div>
                  <div className="nc-asst-search">
                    <Ico n="search" size={13} />
                    <input
                      className="nc-asst-search-in" value={hq} placeholder="搜会话标题或问过的内容…"
                      onChange={(e) => setHq(e.target.value)}
                    />
                    {hq && (
                      <button className="nc-asst-ib" title="清空" onClick={() => setHq('')}><Ico n="close" size={13} /></button>
                    )}
                  </div>
                  {sessList.length === 0 && <div className="nc-asst-empty">没有匹配的会话。</div>}
                  {sessList.map((s) => (
                    <React.Fragment key={s.id}>
                      <div className={`nc-asst-sess${s.id === activeId ? ' is-on' : ''}${expanded === s.id ? ' is-open' : ''}`}>
                        <button
                          className="nc-asst-sess-main"
                          title={expanded === s.id ? '收起预览' : '展开预览'}
                          onClick={() => setExpanded(expanded === s.id ? '' : s.id)}
                        >
                          <b>{s.title}</b>
                          <span className="nc-asst-sess-sub">
                            {s.startedAt} · {s.msgs.filter((m) => m.role === 'user').length} 问
                            {s.pages.length > 0 && ` · ${s.pages.map((x) => PAGE_META[x]?.title ?? x).join(' / ')}`}
                          </span>
                        </button>
                        <button
                          className="nc-asst-ib" title="继续这个会话"
                          onClick={() => { openAiSession(s.id); setView('chat'); setExpanded(''); }}
                        >
                          <Ico n="arrowRight" size={14} />
                        </button>
                        {sessions.length > 1 && (
                          <button className="nc-asst-ib" title="删除该会话" onClick={() => deleteAiSession(s.id)}>
                            <Ico n="close" size={14} />
                          </button>
                        )}
                      </div>
                      {/* 就地展开：只读预览，翻看历史不必跳走、也不丢滚动位置 */}
                      {expanded === s.id && (
                        <div className="nc-asst-pv">
                          {s.msgs.length === 0 && <div className="nc-asst-empty">这个会话还没有内容。</div>}
                          {s.msgs.map((m) => (
                            <div key={m.id} className={`nc-asst-pv-m is-${m.role}${m.miss ? ' is-miss' : ''}`}>
                              <span className="nc-asst-pv-r">{m.role === 'user' ? '问' : '答'}</span>
                              <span className="nc-asst-pv-t">{m.text}</span>
                            </div>
                          ))}
                          <button className="nc-asst-pv-go" onClick={() => { openAiSession(s.id); setView('chat'); setExpanded(''); }}>
                            继续这个会话 <Ico n="arrowRight" size={12} />
                          </button>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : view === 'import' ? (
          /* ================= 导入识别（面板内的工作入口） ================= */
          <div className="nc-asst-bd">
            <div className="nc-asst-imp-hd">
              <b>导入识别</b>
              <span>上传文件先看识别结果，再带到对应页面逐项核对</span>
            </div>

            {/* 1. 识别类型：决定「读哪些字段」以及「识别完带到哪」 */}
            <div className="nc-asst-imp-types">
              {IMP_KINDS.map((k) => (
                <button
                  key={k.id} disabled={impStage === 'run'}
                  className={`nc-asst-imp-type${k.id === impKind ? ' is-on' : ''}`}
                  onClick={() => { setImpKind(k.id); setImpStage('idle'); setImpPct(0); setImpFile(''); }}
                >
                  <Ico n={k.ico} size={14} />{k.label}
                </button>
              ))}
            </div>

            {/* 2. 上传 / 进度 / 结果 */}
            {impStage === 'idle' && (
              <div
                className="nc-asst-imp-drop" role="button" tabIndex={0}
                onClick={() => runImport()}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); runImport(); } }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); runImport(e.dataTransfer.files?.[0]?.name); }}
              >
                <Ico n="upload" size={22} />
                <b>点击选择文件，或直接拖进来</b>
                <span>支持 PDF / JPG / PNG ≤50MB</span>
              </div>
            )}

            {impStage === 'run' && (
              <div className="nc-asst-imp-run">
                <div className="nc-asst-imp-file" title={impFile}>{impFile}</div>
                <div className="nc-asst-imp-bar"><i style={{ width: `${impPct}%` }} /></div>
                <div className="nc-asst-imp-step">
                  {IMP_STEPS[Math.min(IMP_STEPS.length - 1, Math.floor(impPct / 25))]}
                  <b className="num">{impPct}%</b>
                </div>
              </div>
            )}

            {impStage === 'done' && (
              <>
                <div className="nc-asst-imp-ok">
                  <Ico n="checkCircle" size={14} />
                  <span>识别完成 · 提取到 <b>{impKindObj.fields.length}</b> 个字段</span>
                </div>
                {impFile && <div className="nc-asst-imp-name" title={impFile}>{impFile}</div>}
                <div className="nc-asst-imp-fields">
                  {impKindObj.fields.map((f) => (
                    <div key={f.k} className="nc-asst-imp-f"><span>{f.k}</span><b>{f.v}</b></div>
                  ))}
                </div>
                <div className="nc-asst-imp-note">
                  核对需要原件与字段并排比对，助手窗口放不下 —— 带到页面里逐项确认后再保存。
                </div>
                <div className="nc-asst-imp-acts">
                  <Btn kind="primary" onClick={goVerify}>{impKindObj.goLabel}</Btn>
                  <Btn onClick={() => { setImpStage('idle'); setImpPct(0); setImpFile(''); }}>换个文件</Btn>
                </div>
              </>
            )}
          </div>
        ) : (
          /* ================= 对话 ================= */
          <>
            <div className="nc-asst-bd" ref={listRef}>
              {(!active || active.msgs.length === 0) && (
                <div className="nc-asst-hello">
                  <div className="nc-asst-hello-hd"><Ico n="robot" size={18} /> 您好，我是诺安云 AI 助手</div>
                  <div className="nc-asst-hello-sub">
                    演示版内置常见口径问答 —— 点下面的问题直接看答案，答案里带「去 XX」的按钮可以一键跳到对应功能页。
                  </div>
                </div>
              )}
              {active?.msgs.map((m) => (
                <div key={m.id} className={`nc-asst-msg is-${m.role}`}>
                  {m.role === 'ai' && <span className="nc-asst-av"><Ico n="robot" size={14} /></span>}
                  <div className="nc-asst-bubble">
                    <div className="nc-asst-text">{m.text}</div>
                    {m.src && <div className="nc-asst-src">出处 · {m.src}</div>}
                    {m.routes && m.routes.length > 0 && (
                      <div className="nc-asst-routes">
                        {m.routes.map((r) => (
                          <button key={r.label + r.page + (r.tab ?? '')} className="nc-asst-route" onClick={() => doRoute(r)}>
                            {r.label}<Ico n="arrowRight" size={13} />
                          </button>
                        ))}
                      </div>
                    )}
                    {m.miss && <div className="nc-asst-miss"><Ico n="warning" size={13} /> 已记入「需求线索」</div>}
                    <div className="nc-asst-at">{m.at}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 引导区：先给「当前页面相关问题」，再给「按分类浏览全部」 */}
            <div className="nc-asst-ask">
              {/* 快捷工作入口：导入识别常驻（任何页面都能直接开工），后面再接该页专属入口 */}
              <div className="nc-asst-acts">
                <span className="nc-asst-acts-lb"><Ico n="bolt" size={12} />快捷</span>
                <button
                  className="nc-asst-act is-imp" title="在助手窗口内上传文件并识别，再带到对应页面核对"
                  onClick={() => { setView('import'); setImpStage('idle'); setImpPct(0); setImpFile(''); }}
                >
                  <Ico n="upload" size={12} />导入识别
                </button>
                {pageActions.map((a) => (
                  <button key={a.id} className="nc-asst-act" title={a.hint} onClick={() => runAction(a)}>
                    <Ico n={a.ico} size={12} />{a.label}
                  </button>
                ))}
              </div>
              {pageHints.length > 0 && (
                <div className="nc-asst-ctx">
                  <span className="nc-asst-ctx-lb" title={`当前页面：${pageTitle}`}>
                    <Ico n="pin" size={12} />{pageTitle}
                  </span>
                  <div className="nc-asst-ctx-qs">
                    {/* 标准档只有 384px 宽，摆 4 个 chip 会换行 3 行、把消息区挤没；
                        窄档只摆 2 个，其余走「更多」。宽 / 大档摆全。 */}
                    {pageHints.slice(0, sz.id === 'std' ? 2 : 4).map((h) => (
                      <button key={h.id} className="nc-asst-ctx-q" onClick={() => send(h.q)} title={h.q}>{h.q}</button>
                    ))}
                  </div>
                  <button className="nc-asst-ctx-more" onClick={() => setBrowse((v) => !v)}>
                    <Ico n={browse ? 'close' : 'plus'} size={12} />{browse ? '收起' : '更多'}
                  </button>
                </div>
              )}
              {showBrowse && (
                <>
                  <div className="nc-asst-cats">
                    {AI_CATS.map((c) => (
                      <button key={c} className={`nc-asst-cat${c === cat ? ' is-on' : ''}`} onClick={() => setCat(c)}>{c}</button>
                    ))}
                  </div>
                  <div className="nc-asst-qs">
                    {catQs.map((q) => (
                      <button key={q.id} className="nc-asst-q" onClick={() => send(q.q)}>{q.q}</button>
                    ))}
                  </div>
                </>
              )}
              <div className="nc-asst-follow">
                还可以接着问：{AI_FOLLOWUPS.map((f) => (
                  <button key={f} className="nc-asst-fu" onClick={() => send(f)}>{f}</button>
                ))}
              </div>
            </div>

            {/* 输入区 */}
            <div className="nc-asst-ft">
              <textarea
                className="nc-input nc-asst-in" rows={1} value={draft}
                title="Enter 发送 / Shift+Enter 换行"
                placeholder="问口径、问流程、问在哪操作…"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
                }}
              />
              <Btn kind="primary" disabled={!draft.trim()} onClick={() => send()}>发送</Btn>
            </div>
          </>
        )}

        {/* ---- 底部：演示态说明 + 导出需求分析依据 ---- */}
        <div className="nc-asst-bar">
          <span className="nc-asst-note">演示态 · 不调用外部模型 · Enter 发送</span>
          <button className="nc-asst-export" onClick={() => {
            const text = aiExportText();
            /* 演示态不落文件：复制到剪贴板 + 控制台留一份，方便直接粘进需求文档 */
            try { navigator.clipboard?.writeText(text); } catch { /* 无剪贴板权限时忽略 */ }
            // eslint-disable-next-line no-console
            console.log(text);
            toast('已生成需求分析依据（会话全文 + 需求线索），已复制到剪贴板');
          }}>
            <Ico n="download" size={14} /> 导出需求分析依据
          </button>
        </div>
      </div>
    </>
  );

  return createPortal(body, document.body);
}
