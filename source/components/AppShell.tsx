// 诺安云 6.0 · 应用外壳
// 顶栏（品牌 + 13 模块 Tab + 右侧工具区）+ 页签栏（可关闭）+ 侧栏（6 组 14 项）+ 内容区
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  APPROVALS, BIDS, CERTS, MENU, MODULE_TABS, RECEIVABLES, ROLES, PAGE_META, PAGE_PARENT,
  TODAY, canSeeMoney, fmtWan,
} from './data';
import { useToast } from './ui';
import { Ico, type IconName } from './icons';

type Props = {
  page: string;
  onNavigate: (pageId: string) => void;
  role: string;
  onRoleChange: (roleId: string) => void;
  pending: number;
  /** 列表型页面：内容区视口锁定，页头 / 筛选固定，表格卡吃满剩余高度并局部滚动 */
  fixedLayout?: boolean;
  crumbs?: string[];
  children: React.ReactNode;
};

/**
 * 消息通知：由业务数据派生（与顶栏角标 pending 同源），避免写死条目与真实数据脱节。
 * 口径 = 逾期应收期次 + 待审批单据 + 保证金未退 + 证书已过期 / 30 天内到期。
 */

/* AI 助手示例问法（演示态）：点击后给出确定性答复，不做真实模型调用 */
const AI_ASKS = [
  { q: '本月逾期应收有多少？', a: '逾期应收由「合同 → 收付款计划」实时汇总，驾驶舱首张卡可穿透到期次明细。' },
  { q: '哪些证书 30 天内到期？', a: '证书台账按 6 档预警（过期 / 30 / 60 / 90 天 / 催出逾期 / 履约期过期），可一键筛选。' },
  { q: '这笔付款为什么被拦截？', a: '付款校验规则：累计已付 + 本次 ≤ 执行金额 × 付款比例上限；超限需「特殊审批放行」并填写理由。' },
  { q: '质保金最多能留多少？', a: '按建质〔2017〕138 号，质量保证金不得超过结算总额 3%。' },
];

export default function AppShell({ page, onNavigate, role, onRoleChange, pending, fixedLayout, crumbs, children }: Props) {
  const toast = useToast();
  const [mini, setMini] = useState(false);
  const [mOpen, setMOpen] = useState(false);
  const [dd, setDd] = useState<'' | 'role' | 'bell' | 'search' | 'ai'>('');
  const [groupFold, setGroupFold] = useState<Record<string, boolean>>({});
  const [menuKw, setMenuKw] = useState('');
  const [tabs, setTabs] = useState<string[]>(['dashboard', 'customer']);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const cur = ROLES.find((r) => r.id === role) || ROLES[6];
  const activeMenu = PAGE_PARENT[page] || page;

  // 页面变化时累加页签（首页固定 + 最多 8 个）
  useEffect(() => {
    setTabs((prev) => {
      if (prev.includes(page)) return prev;
      const next = [...prev, page];
      return next.length > 8 ? next.slice(next.length - 8) : next;
    });
  }, [page]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest('.nc-dd') && !t.closest('.nc-hbtn') && !t.closest('.nc-avatar')) setDd('');
      if (!t.closest('.nc-tabx')) setCtxMenu(null);
      // 窄屏抽屉侧栏：点击遮罩或侧栏外区域关闭
      if (mOpen && !t.closest('.nc-side') && !t.closest('.nc-hamburger')) setMOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setDd(''); setCtxMenu(null); setMOpen(false); }
      /**
       * 评审 I5：顶栏搜索与页面级检索弹窗（文档中心 / 材料主数据）都监听 Ctrl+K，
       * 在两个页面会同时弹出两层浮层。约定：页面级处理器先调用 preventDefault()
       * 并在事件对象上打 __ncHandled 标记表示「已接管」；顶栏延后一拍检查该标记，
       * 已被页面接管时让位，保证同一时刻只有一层浮层。
       */
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setTimeout(() => { if (!(e as KeyboardEvent & { __ncHandled?: boolean }).__ncHandled) setDd('search'); }, 0);
      }
    };
    document.addEventListener('click', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('click', onDoc); document.removeEventListener('keydown', onKey); };
  }, [mOpen]);

  /**
   * 侧栏菜单：先按角色白名单裁剪（roles 缺省 = 全角色可见），再按关键字过滤。
   * 组为空时整组隐藏，避免出现「只有标题没有项」的空组。
   */
  const menuGroups = useMemo(() => {
    const kw = menuKw.trim();
    const byRole = MENU
      .map((g) => ({ group: g.group, items: g.items.filter((it) => !it.roles || it.roles.includes(role)) }))
      .filter((g) => g.items.length > 0);
    if (!kw) return byRole;
    return byRole
      .map((g) => ({ group: g.group, items: g.items.filter((it) => it.label.includes(kw) || g.group.includes(kw)) }))
      .filter((g) => g.items.length > 0);
  }, [menuKw, role]);

  /** 消息通知列表（与顶栏角标同源派生） */
  const notis = useMemo(() => {
    const money = canSeeMoney(role);
    const amt = (n: number) => (money ? fmtWan(n) : '—');
    const list: { tone: string; t: string; d: string }[] = [];
    RECEIVABLES.filter((r) => r.status === '逾期').forEach((r) => list.push({
      tone: 'red', t: `逾期收款 · ${r.customer.slice(0, 10)}`, d: `${r.node} 逾期 ${r.overdueDays} 天 · ${amt(r.amt)}`,
    }));
    APPROVALS.filter((a) => a.status === '待审批' || a.status === '审批中').forEach((a) => list.push({
      tone: 'orange', t: `审批提醒 · ${a.type}`, d: `${a.ref.split(' ')[0]} 待您审批 · ${amt(a.amt)}`,
    }));
    BIDS.filter((b) => b.depositSt === '未退').forEach((b) => list.push({
      tone: 'gray', t: `保证金未退 · ${b.id}`, d: `${b.name.slice(0, 12)} · 保证金 ${amt(b.deposit)}`,
    }));
    CERTS.filter((c) => c.validTo < TODAY || (c.warnDays > 0 && c.warnDays <= 30)).forEach((c) => list.push({
      tone: c.validTo < TODAY ? 'red' : 'orange', t: `证书${c.validTo < TODAY ? '已过期' : '临期'} · ${c.name.slice(0, 12)}`, d: `${c.id} · 有效期至 ${c.validTo}（过期将导致投标废标）`,
    }));
    return list;
  }, [role]);

  /** 侧栏徽标：由业务数据派生，避免写死数字与台账脱节 */
  const badgeOf = (key?: 'bid' | 'cert') => {
    if (key === 'bid') return BIDS.filter((b) => b.stage === '开标' || b.depositSt === '未退').length;
    // 证书：已过期 + 30 天内到期（即预警卡红色 / 橙色两档，需立即处置）
    if (key === 'cert') return CERTS.filter((c) => c.validTo < TODAY || (c.warnDays > 0 && c.warnDays <= 30)).length;
    return 0;
  };

  const closeTab = (id: string) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t !== id);
      const final = next.length ? next : ['dashboard'];
      if (id === page) onNavigate(final[final.length - 1]);
      return final;
    });
  };
  const closeOthers = (id: string) => {
    setTabs(['dashboard', id].filter((v, i, a) => a.indexOf(v) === i));
    onNavigate(id);
  };
  const closeRight = (id: string) => {
    setTabs((prev) => {
      const i = prev.indexOf(id);
      return prev.slice(0, i + 1);
    });
  };

  const sideBadge = (b?: number) => (b ? <span className="nc-menu-badge">{b}</span> : null);

  return (
    <div className="nc-app">
      {/* ==================== 顶栏 ==================== */}
      <header className="nc-topbar">
        <button
          className="nc-hamburger"
          title={window.innerWidth <= 992 ? '展开菜单' : '折叠菜单'}
          onClick={() => (window.innerWidth <= 992 ? setMOpen(!mOpen) : setMini(!mini))}
          aria-label="菜单开关"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
        </button>
        <div className="nc-brand">
          <span className="nc-brand-logo" title="诺盾博达">
            <svg width="16" height="16" viewBox="0 0 24 24"><path d="M12 2l8 3v6c0 5.2-3.4 8.9-8 11-4.6-2.1-8-5.8-8-11V5l8-3z" fill="currentColor" /><path d="M8.5 12l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          <span className="nc-brand-name">诺盾博达</span>
        </div>
        <div className="nc-tabs-wrap">
          <nav className="nc-tabs">
            {MODULE_TABS.map((t) => (
              <button
                key={t.id}
                className={`nc-tab${t.id === 'biz' ? ' is-active' : ''}${t.disabled ? ' is-disabled' : ''}`}
                title={t.disabled ? `${t.name}（${t.note}，本轮范围外）` : `${t.name}（${t.note}）`}
                onClick={() => { if (!t.disabled) onNavigate('dashboard'); }}
              >{t.name}</button>
            ))}
          </nav>
        </div>
        <div className="nc-hright">
          <div className="nc-globalsearch" onClick={(e) => { e.stopPropagation(); setDd(dd === 'search' ? '' : 'search'); }} title="全局搜索（Ctrl+K）">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
            <span>搜索功能 / 消息</span>
          </div>
          <button className="nc-hbtn" title="消息" onClick={(e) => { e.stopPropagation(); setDd(dd === 'bell' ? '' : 'bell'); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
            <span className="nc-badge">{pending}</span>
          </button>
          <button
            className="nc-hbtn nc-hbtn-ai"
            title="AI 助手（演示态）· 点击展开示例问法"
            onClick={(e) => { e.stopPropagation(); setDd(dd === 'ai' ? '' : 'ai'); }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9z" /><path d="M19 15l.9 2.6 2.6.9-2.6.9L19 22l-.9-2.6-2.6-.9 2.6-.9z" /></svg>
            <span>AI 助手</span>
          </button>
          <button className="nc-avatar" title="切换角色视角" onClick={(e) => { e.stopPropagation(); setDd(dd === 'role' ? '' : 'role'); }}>{cur.name[0]}</button>
        </div>
      </header>

      {/* 角色视角下拉 */}
      {dd === 'role' && (
        <div className="nc-dd" onClick={(e) => e.stopPropagation()}>
          <div className="nc-dd-head">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span className="nc-avatar" style={{ width: 36, height: 36, fontSize: 14 }}>{cur.name[0]}</span>
              <div>
                <div style={{ fontWeight: 600 }}>诺安云 6.0 · 演示租户</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>当前视角：{cur.name} · {cur.desc}</div>
              </div>
            </div>
          </div>
          <div className="nc-dd-title">切换视角（菜单可见性 / 金额脱敏 / 按钮可见性随视角变化）</div>
          {ROLES.map((r) => (
            <button key={r.id} className={`nc-dd-item${r.id === role ? ' is-on' : ''}`} onClick={() => { onRoleChange(r.id); setDd(''); }}>
              <Ico n={r.icon as IconName} size={18} />
              <span style={{ flex: 1 }}>{r.name}<span style={{ display: 'block', fontSize: 11, color: 'var(--ink-3)' }}>{r.desc}</span></span>
              {r.id === role && <Ico n="check" size={14} style={{ color: 'var(--c-primary)' }} />}
            </button>
          ))}
          <div className="nc-dd-sep" />
          <button className="nc-dd-item" onClick={() => setDd('')}>个人设置</button>
          <button className="nc-dd-item" style={{ color: 'var(--c-danger)' }} onClick={() => setDd('')}>退出登录</button>
        </div>
      )}

      {/* 消息下拉 */}
      {dd === 'bell' && (
        <div className="nc-dd" style={{ width: 320 }} onClick={(e) => e.stopPropagation()}>
          <div className="nc-dd-head" style={{ fontWeight: 600 }}>消息通知（{pending}）</div>
          {notis.map((n, i) => (
            <button key={i} className="nc-dd-item" style={{ alignItems: 'flex-start' }} onClick={() => setDd('')}>
              <span className={`nc-dot nc-dot-${n.tone}`} style={{ marginTop: 7 }} />
              <span style={{ flex: 1, minWidth: 0 }}><b style={{ fontSize: 13 }}>{n.t}</b><span style={{ display: 'block', fontSize: 12, color: 'var(--ink-3)' }}>{n.d}</span></span>
            </button>
          ))}
          <div className="nc-dd-sep" />
          <button className="nc-dd-item" onClick={() => { setDd(''); onNavigate('dashboard'); }}>查看全部待办 → 驾驶舱</button>
        </div>
      )}

      {/* 全局搜索下拉 */}
      {dd === 'search' && (
        <div className="nc-dd" style={{ width: 400, right: 260 }} onClick={(e) => e.stopPropagation()}>
          <div style={{ padding: 8 }}>
            <input className="nc-input" autoFocus placeholder="搜索客户 / 商机 / 合同 / 项目 / 证书（Ctrl+K）" />
          </div>
          <div className="nc-dd-title">跨 12 类对象检索：客户 / 商机 / 报价 / 合同 / 项目 / 投标 / 证书 / 业绩 / 文档 / 发票 / 供应商 / 材料，按权限过滤后返回</div>
          <button className="nc-dd-item" onClick={() => setDd('')}><Ico n="search" size={16} /> Enter 进入聚合结果页（演示态）</button>
        </div>
      )}

      {/* AI 助手下拉（演示态：示例问法 + 确定性答复，不做真实模型调用） */}
      {dd === 'ai' && (
        <div className="nc-dd" style={{ width: 360, right: 120 }} onClick={(e) => e.stopPropagation()}>
          <div className="nc-dd-head" style={{ fontWeight: 600 }}><Ico n="star" size={16} /> AI 助手 · 问数 / 问流程</div>
          <div className="nc-dd-title">演示态：以下为内置示例问法，点击即可查看口径答复（不调用外部模型）</div>
          {AI_ASKS.map((a) => (
            <button key={a.q} className="nc-dd-item" style={{ alignItems: 'flex-start' }} onClick={() => toast(`AI 助手：${a.a}`)}>
              <Ico n="robot" size={16} />
              <span style={{ flex: 1, minWidth: 0 }}>
                <b style={{ fontSize: 13 }}>{a.q}</b>
                <span style={{ display: 'block', fontSize: 12, color: 'var(--ink-3)' }}>{a.a}</span>
              </span>
            </button>
          ))}
          <div className="nc-dd-sep" />
          <button className="nc-dd-item" onClick={() => { setDd(''); onNavigate('dashboard'); }}>进入驾驶舱查看全部指标 →</button>
        </div>
      )}

      {/* ==================== 页签栏 ==================== */}
      <div className="nc-tabbar">
        {tabs.map((t) => {
          const meta = PAGE_META[t];
          if (!meta) return null;
          const isHome = t === 'dashboard';
          return (
            <div
              key={t}
              className={`nc-tabx${t === page ? ' is-on' : ''}`}
              onClick={() => onNavigate(t)}
              onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, id: t }); }}
              title={meta.title}
            >
              {isHome && <span className="nc-tabx-home"><Ico n="building" size={16} /></span>}
              <span className="nc-tabx-label">{meta.title}</span>
              {!isHome && (
                <button className="nc-tabx-x" onClick={(e) => { e.stopPropagation(); closeTab(t); }} aria-label="关闭"><Ico n="close" size={16} /></button>
              )}
            </div>
          );
        })}
        <span className="nc-tabbar-hint">页签右键可关闭当前 / 左侧 / 右侧 / 其他 / 全部</span>
      </div>

      {/* 页签右键菜单 */}
      {ctxMenu && (
        <div className="nc-ctxmenu" style={{ left: ctxMenu.x, top: ctxMenu.y + 6 }} onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { closeTab(ctxMenu.id); setCtxMenu(null); }}>关闭当前</button>
          <button onClick={() => { setTabs((prev) => { const i = prev.indexOf(ctxMenu.id); return prev.slice(i); }); setCtxMenu(null); }}>关闭左侧</button>
          <button onClick={() => { closeRight(ctxMenu.id); setCtxMenu(null); }}>关闭右侧</button>
          <button onClick={() => { closeOthers(ctxMenu.id); setCtxMenu(null); }}>关闭其他</button>
          <button onClick={() => { setTabs(['dashboard']); onNavigate('dashboard'); setCtxMenu(null); }}>关闭全部</button>
        </div>
      )}

      {/* ==================== 主体 ==================== */}
      <div className="nc-body">
        {mOpen && <div className="nc-side-mask" onClick={() => setMOpen(false)} />}
        <aside className={`nc-side${mini ? ' is-mini' : ''}${mOpen ? ' is-mopen' : ''}`}>
          {!mini && (
            <div className="nc-side-search">
              <span className="nc-side-search-lbl">菜单</span>
              <input value={menuKw} placeholder="搜索菜单…" onChange={(e) => setMenuKw(e.target.value)} />
            </div>
          )}
          <nav className="nc-side-nav">
            {menuGroups.map((g) => {
              const folded = !!groupFold[g.group];
              return (
                <div className="nc-group" key={g.group}>
                  <button className={`nc-group-title${folded ? ' is-collapsed' : ''}`} onClick={() => setGroupFold({ ...groupFold, [g.group]: !folded })} title={g.group}>
                    <span className="nc-group-label">{g.group}</span>
                    <span className="nc-caret">▾</span>
                  </button>
                  {!folded && g.items.map((it) => (
                    <button
                      key={it.id}
                      className={`nc-menu-item${activeMenu === it.id ? ' is-active' : ''}`}
                      title={it.label}
                      onClick={() => { onNavigate(it.id); setMOpen(false); }}
                    >
                      <span className="nc-menu-ico"><Ico n={it.icon as IconName} size={16} /></span>
                      <span className="nc-menu-label">{it.label}</span>
                      {sideBadge(badgeOf(it.badgeKey))}
                    </button>
                  ))}
                </div>
              );
            })}
            {!menuGroups.length && <div className="nc-empty-mini" style={{ margin: '12px 10px' }}>/ 无匹配菜单</div>}
          </nav>
        </aside>

        <main className="nc-main">
          <div className={`nc-page${fixedLayout ? ' is-fixed' : ''}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
