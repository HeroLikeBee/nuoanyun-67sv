// 诺安云 6.0 · AI 助手 · 会话 store
//
// 与业务 store（store.ts 五切片）分开：AI 会话是「日志」而不是业务台账，
// 业务台账随演示重置，会话要留下来当需求分析依据 —— 所以这里单独落 localStorage。
//
// 为什么持久化：用户要求「历史会话数据可留作用户需求分析依据」。
// 只在内存里留，刷新即失，就谈不上「留作依据」；且助手是跨页常驻组件，
// 会话本就不属于任何单个页面，放页面 state 会随路由切换丢失。
//
// 关键设计：未命中的问题标 miss = true，单独聚合成「需求线索」。
// 预置问题答得再好也只证明「已知需求做对了」，真正的增量信息全在没答上来的那些问句里。
import { useCallback, useEffect, useState } from 'react';

export type AiRoute = { label: string; page: string; focus?: string; tab?: string };

export type AiMsg = {
  id: string;
  role: 'user' | 'ai';
  text: string;
  at: string;
  /** 可路由定位：点击跳到对应功能页面（可带聚焦实体与子页签） */
  routes?: AiRoute[];
  /** 口径出处，让人能自己去核对 */
  src?: string;
  /** 命中的预置问题编号（未命中为空） */
  presetId?: string;
  /** 未命中：该问句进「需求线索」 */
  miss?: boolean;
};

export type AiSession = {
  id: string;
  title: string;
  startedAt: string;
  /** 本会话问到过的页面（需求分析的「关注面」维度） */
  pages: string[];
  msgs: AiMsg[];
};

const LS_KEY = 'nuoan6.ai.sessions';

let seq = 0;
const uid = (p: string) => `${p}${Date.now().toString(36)}${(seq++).toString(36)}`;

/** 时间戳：用真实时钟而非演示基准日（TODAY 滞后于系统日，日志用它会对不上） */
export function stamp(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 种子会话：体现「会话能留作依据」这件事本身（两条历史 + 一条含未命中） */
function seed(): AiSession[] {
  return [
    {
      id: 'AIS-20260922-01', title: '逾期应收与回款率口径', startedAt: '2026-09-22 10:12', pages: ['dashboard', 'project-center'],
      msgs: [
        { id: 'm1', role: 'user', text: '本月逾期应收有多少？', at: '2026-09-22 10:12' },
        {
          id: 'm2', role: 'ai', at: '2026-09-22 10:12', presetId: 'p-recv-overdue',
          text: '逾期应收 = 已过合同约定收款日、但银行仍未到账的收款期次。驾驶舱首张卡给出总额与笔数，点进去可看到每一笔的客户、期次、逾期天数与责任人。',
          src: '口径：收付款计划 · 已过计划日且实收未满额',
          routes: [{ label: '去驾驶舱看逾期汇总', page: 'dashboard' }],
        },
        { id: 'm3', role: 'user', text: '那回款率是按合同额还是执行额算？', at: '2026-09-22 10:14' },
        {
          id: 'm4', role: 'ai', at: '2026-09-22 10:14', presetId: 'p-pay-rate',
          text: '按执行额。执行额 = 合同额 + 已生效的变更增量，所以签了补充协议后分母变大，回款率可能反而下降。',
          src: '口径：仅银行已到账计入已回款',
          routes: [{ label: '去项目看资金台账', page: 'project-center', focus: 'XM000123', tab: 'fund' }],
        },
      ],
    },
    {
      id: 'AIS-20260921-02', title: '证书占用与项目经理资格', startedAt: '2026-09-21 15:40', pages: ['cert', 'bid'],
      msgs: [
        { id: 'm1', role: 'user', text: '证书被占用还能再投标吗？', at: '2026-09-21 15:40' },
        {
          id: 'm2', role: 'ai', at: '2026-09-21 15:40', presetId: 'p-cert-occupy',
          text: '工程施工类要求「建造师证 + B 证 + 无在建」，只要还有在建项目占用就不能再挂；维护保养类只看注册证书本身有没有被占用。',
          src: '规则：工程施工类须「无在建」',
          routes: [{ label: '去证书管理看占用情况', page: 'cert' }],
        },
        { id: 'm3', role: 'user', text: '能不能按人批量看他一共有几本证？', at: '2026-09-21 15:43' },
        { id: 'm4', role: 'ai', at: '2026-09-21 15:43', miss: true, text: '这个问题我暂时答不上来——已记入「需求线索」。' },
      ],
    },
    {
      id: 'AIS-20260920-03', title: '未命名会话', startedAt: '2026-09-20 09:05', pages: [],
      msgs: [
        { id: 'm1', role: 'user', text: '有没有手机端审批？', at: '2026-09-20 09:05' },
        { id: 'm2', role: 'ai', at: '2026-09-20 09:05', miss: true, text: '这个问题我暂时答不上来——已记入「需求线索」。' },
      ],
    },
  ];
}

/* ---------------- 模块级可变状态 + 订阅（与 store.ts 同构） ---------------- */
let sessions: AiSession[] = load();
let activeId: string = sessions[0]?.id ?? '';
const listeners = new Set<() => void>();
const emit = () => { save(); listeners.forEach((l) => l()); };

function load(): AiSession[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return seed();
    const parsed = JSON.parse(raw) as AiSession[];
    return Array.isArray(parsed) && parsed.length ? parsed : seed();
  } catch {
    /* 隐私模式 / 存储被禁用时静默回落种子数据，不影响主流程 */
    return seed();
  }
}
function save() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(sessions)); } catch { /* 同上 */ }
}

export function subscribeAi(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}
export function getAiSessions() { return sessions; }
export function getAiActiveId() { return activeId; }
export function getAiActive() { return sessions.find((s) => s.id === activeId) ?? sessions[0]; }

export function newAiSession() {
  const s: AiSession = { id: uid('AIS-'), title: '未命名会话', startedAt: stamp(), pages: [], msgs: [] };
  sessions = [s, ...sessions];
  activeId = s.id;
  emit();
  return s.id;
}
export function openAiSession(id: string) {
  activeId = id;
  emit();
}
export function deleteAiSession(id: string) {
  sessions = sessions.filter((s) => s.id !== id);
  if (activeId === id) activeId = sessions[0]?.id ?? '';
  if (!sessions.length) newAiSession();
  else emit();
}
export function clearAiSessions() {
  sessions = [];
  newAiSession();
}

/** 追加一条消息；首条用户问句自动成为会话标题（便于在历史里认出这次在问什么） */
export function pushAiMsg(msg: Omit<AiMsg, 'id' | 'at'> & { at?: string }) {
  const cur = getAiActive();
  if (!cur) return;
  const full: AiMsg = { ...msg, id: uid('m'), at: msg.at ?? stamp() };
  cur.msgs.push(full);
  if (msg.role === 'user' && (cur.title === '未命名会话' || !cur.title)) {
    cur.title = msg.text.length > 18 ? `${msg.text.slice(0, 18)}…` : msg.text;
  }
  emit();
}

/** 记录一次页面路由（会话的「关注面」，导出时用于看用户主要在哪些模块打转） */
export function noteAiPage(page: string) {
  const cur = getAiActive();
  if (!cur || cur.pages.includes(page)) return;
  cur.pages.push(page);
  emit();
}

/* ---------------- 需求分析派生 ---------------- */

export type AiClue = { q: string; count: number; sessions: number; firstAt: string };

/** 需求线索：所有未命中的问句，按出现次数聚类 */
export function aiClues(): AiClue[] {
  const map = new Map<string, AiClue>();
  sessions.forEach((s) => {
    s.msgs.filter((m) => m.role === 'user').forEach((m) => {
      const next = s.msgs[s.msgs.indexOf(m) + 1];
      if (!next || !next.miss) return;
      const key = m.text.trim();
      const hit = map.get(key);
      if (hit) { hit.count += 1; hit.sessions += 1; }
      else map.set(key, { q: key, count: 1, sessions: 1, firstAt: m.at });
    });
  });
  return [...map.values()].sort((a, b) => b.count - a.count || (a.firstAt < b.firstAt ? -1 : 1));
}

/** 模块关注度：各页面被问到的次数（按会话去重） */
export function aiFocusRank(): { page: string; n: number }[] {
  const map = new Map<string, number>();
  sessions.forEach((s) => s.pages.forEach((p) => map.set(p, (map.get(p) ?? 0) + 1)));
  return [...map.entries()].map(([page, n]) => ({ page, n })).sort((a, b) => b.n - a.n);
}

/** 导出为「需求分析依据」文本：会话全文 + 线索聚合 + 模块关注度 */
export function aiExportText(): string {
  const L: string[] = [];
  L.push('诺安云 6.0 · AI 助手会话记录（需求分析依据）');
  L.push(`导出时间：${stamp()}`);
  L.push(`会话 ${sessions.length} 个 · 问句 ${sessions.reduce((n, s) => n + s.msgs.filter((m) => m.role === 'user').length, 0)} 条`);
  L.push('');

  const clues = aiClues();
  L.push('【一】需求线索（未命中的问句，按频次排序）');
  if (!clues.length) L.push('  无 —— 所有问句均命中了内置口径问答。');
  clues.forEach((c, i) => L.push(`  ${i + 1}. ${c.q}（出现 ${c.count} 次 · 首次 ${c.firstAt}）`));
  L.push('');

  const rank = aiFocusRank();
  L.push('【二】模块关注度（用户在哪些模块的疑问最多）');
  if (!rank.length) L.push('  无记录。');
  rank.forEach((r, i) => L.push(`  ${i + 1}. ${r.page} —— ${r.n} 个会话涉及`));
  L.push('');

  L.push('【三】会话全文');
  sessions.forEach((s) => {
    L.push('');
    L.push(`── ${s.id}｜${s.title}｜${s.startedAt}${s.pages.length ? `｜涉及页面：${s.pages.join(' / ')}` : ''}`);
    s.msgs.forEach((m) => {
      L.push(`  [${m.at}] ${m.role === 'user' ? '用户' : '助手'}：${m.text}`);
      if (m.src) L.push(`        出处：${m.src}`);
      if (m.routes?.length) L.push(`        可跳转：${m.routes.map((r) => r.label).join(' / ')}`);
    });
  });
  return L.join('\n');
}

/** 订阅 hook：组件内用，避免每个消费方各写一遍 useEffect */
export function useAiStore() {
  const [, force] = useState(0);
  const rerender = useCallback(() => force((n) => n + 1), []);
  useEffect(() => subscribeAi(rerender), [rerender]);
  return { sessions: getAiSessions(), activeId: getAiActiveId(), active: getAiActive() };
}
