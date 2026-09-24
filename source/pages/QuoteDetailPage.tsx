// 报价详情（只读详情 + 版本追溯）
// 复刻「报价详情.html」：派生=金额/税额/单方；工具=区域上浮批量；参照=历史同类单方；流转=撤回/升版
// 硬规则：税率口径公式写死 · 区域上浮 0~30 越界拦截且联动顶部卡与单方造价 · 升版必填变更原因 · 版本对比含「不变/已删除/新增」性质
import React, { useEffect, useMemo, useState } from 'react';
import {
  Btn, Banner, Card, EntityLink, KvGrid, Modal, Money, PageHead, Tag, Timeline, useToast, Code,
} from '../components/ui';
import { RECIPES, fmt, lineMarginBelow, marginGuardOf, marginGuardText, verNo } from '../components/data';
import type { QuoteVersion } from '../components/data';
import { getApprovals, getBizStatus, getFocus, setFocus, getProjects, getQuotes, subscribeStore } from '../components/store';
import { DiffTable, prevOf, sortVers } from '../components/quoteDiff';

/* G3：原 const Q = QUOTES[0] 硬编码索引 0 —— 从任何入口进入都只看 BJ000011。
   改为组件内读取聚焦 ID（上游页面跳转前写入 store），并以 nav 为依赖重新解析，
   保证「客户 → 报价 → 客户 → 另一张报价」这类反复下钻都能正确定位。
   项目面积 / 设备行金额也改为按当前报价单明细派生（见组件内 AREA / devSum），
   不再用模块级常量 —— 那两个常量只对 BJ000011 成立。 */

/**
 * 报价明细行模板（结构口径 + 金额权重）。
 * 原实现把三行金额写死，导致点开任意报价单都显示同一份「昆明万达」明细，且合计与该单
 * QUOTES.total 对不上。现改为「按当前报价单总额落地」：总额锚定 Q.total，各行按权重分摊，
 * 单价 = 分摊额 ÷ 数量 —— 保证「点哪张看哪张」，数字全部可溯源到 data.ts 的 QUOTES。
 */
const LINE_TPL: { bt: string; name: string; unit: string; qty: number; w: number }[] = [
  { bt: '消防工程', name: '火灾自动报警系统（按图纸点位）', unit: '㎡', qty: 26000, w: 0.4017 },
  { bt: '消防工程', name: '消火栓系统及自动喷淋改造', unit: '㎡', qty: 26000, w: 0.31243 },
  { bt: '智能化工程', name: '消防主机及联动调试（含平台接入）', unit: '项', qty: 1, w: 0.28587 },
];
/** 默认区域上浮 3%（与 QUOTES 基线总额口径一致，用于还原未上浮基价） */
const BASE_UPLIFT = 3;
/** 按报价单总额生成明细行 */
const linesOf = (quoteTotal: number) => {
  const base = quoteTotal > 0 ? quoteTotal / (1 + BASE_UPLIFT / 100) : 0;
  return LINE_TPL.map((t) => ({ ...t, price: t.qty > 0 ? Math.round((base * t.w) / t.qty) : Math.round(base * t.w) }));
};
type Line = ReturnType<typeof linesOf>[number];
const linkAmt = (l: Line) => Math.round(l.qty * l.price);
const lineUp = (l: Line, uplift: number) => Math.round(linkAmt(l) * (1 + uplift / 100));

/** 历史同类项目（行业「医疗」· 类型「消防系统升级」· 近 18 个月成交） */
const REF = [
  { name: '昭通市第一人民医院 · 消防系统升级', date: '2025-06', amt: 2980000, area: 24000, up: 124.2 },
  { name: '曲靖市第二人民医院 · 消防系统改造', date: '2024-11', amt: 1950000, area: 17000, up: 114.7 },
  { name: '楚雄州中医医院 · 消防升级项目', date: '2026-02', amt: 3890000, area: 31000, up: 125.5 },
];

/**
 * 该物料所属套件的「当前」配方版本（M8）。
 * 明细行只记了「按 V1.2 计价」，要提示「当前 V1.3」需反查套件配方；
 * 两者不一致即说明配方在上游升过版，本单成本口径需复核。
 */
const kitCurVer = (code: string): string | undefined => {
  for (const key of Object.keys(RECIPES)) {
    const R = RECIPES[key];
    const cur = R.versions.find((v) => v.v === R.cur);
    if (cur?.lines.some((l) => l.code === code)) return R.cur;
  }
  return undefined;
};

export default function QuoteDetailPage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  /* 订阅共享 store：报价工作台 / 台账的编辑与状态回写要即时反映到详情页 */
  const [tick, setTick] = useState(0);
  useEffect(() => subscribeStore(() => setTick((n) => n + 1)), []);
  /** 穿透目标报价单：按 nav 重算，保证反复下钻时始终定位到当前聚焦实体（取不到回落首条） */
  const Q = useMemo(() => {
    const id = getFocus('quote-detail');
    const all = getQuotes();
    return all.find((q) => q.id === id) || all[0];
  }, [nav, tick]);
  /* 状态口径走审批回写覆盖层，与台账 / 审批中心一致 */
  const Q_ST = getBizStatus(Q.id, Q.status);
  /* 毛利分层治理（4.6）：判定与措辞全部取自 data.ts，与台账「低于标准毛利」列同源 */
  const guard = useMemo(() => marginGuardOf(Q), [Q, tick]);
  /* 关联项目：优先报价单自身外键（projectId），兜底按项目的 quoteId 反查 —— 修复前固定显示 PROJECTS[0] */
  const relProj = useMemo(() => {
    const all = getProjects();
    return all.find((p) => p.id === Q.projectId) || all.find((p) => p.quoteId === Q.id);
  }, [Q.id, Q.projectId, tick]);
  /* 详情页纯只读展示：税率 / 区域上浮固定取报价单落库口径（Q.taxMode / Q.taxRate / Q.uplift），
     不再提供切换与批量应用 —— 修改请经「编辑报价」进入报价编辑页 */
  const uplift = Q.uplift ?? 3;
  const RATE = Q.taxRate;
  const INC = Q.taxMode === '含税';
  /* 版本对比：diffPair = 选中的两版快照（prev → cur）；selA/selB 为弹窗内「任意两版」选择器的值 */
  const [diffPair, setDiffPair] = useState<{ prev: QuoteVersion; cur: QuoteVersion } | null>(null);
  const [selA, setSelA] = useState('');
  const [selB, setSelB] = useState('');
  const [recallOpen, setRecallOpen] = useState(false);

  /** 明细：优先用 data.ts 存储的明细行（引用物料ID），无存储行时回退模板按总额分摊 */
  const LINES = useMemo(() => {
    const stored = (Q as any).lines as { matId?: string; name: string; spec?: string; unit: string; qty: number; price: number; recipeVer?: string; catId?: string; markup?: number; baseMarkup?: number; basis?: string }[] | undefined;
    if (stored && stored.length) {
      return stored.map((l) => ({
        bt: l.matId ? '材料/设备（从物料库选择）' : '安装工程',
        name: l.spec ? `${l.name}（${l.spec}）` : l.name,
        unit: l.unit, qty: l.qty, price: l.price, w: 0,
        /* 低于目录标准毛利的行要在明细里就地说明（4.6），记账口径取自 data.ts */
        below: lineMarginBelow({ catId: l.catId ?? '', markup: l.markup ?? 0, baseMarkup: l.baseMarkup, basis: l.basis }),
        /** 配方版本快照（M8）：该行来自套件配方时记下当时的版本号 */
        recipeVer: l.recipeVer,
        /** 该物料所属套件的当前配方版本（用于提示「按 V1.2 计价 · 当前 V1.3」） */
        curVer: l.matId ? kitCurVer(l.matId) : undefined,
      }));
    }
    return linesOf(Q.total).map((l) => ({ ...l, below: 0, recipeVer: undefined as string | undefined, curVer: undefined as string | undefined }));
  }, [Q]);
  const preTotal = LINES.reduce((a, l) => a + linkAmt(l), 0);
  const total = LINES.reduce((a, l) => a + lineUp(l, uplift), 0);

  /**
   * 项目面积：优先取报价单自身的 `area`（报价工作台录入 / 落库），
   * 无值时回落到明细中「㎡」计量行的数量，仍无则用原型常量。
   * 设备 / 平台接入行（「项」计量）在计算「工程费单方」时剔除。
   * 修复前两者是模块级常量 26000 / 2，只对 BJ000011 成立，别的报价单单方造价全错。
   */
  const AREA = Q.area || LINES.find((l) => l.unit === '㎡')?.qty || 26000;
  /** 设备 / 平台接入 / 服务费行（单位「项」）不参与单方造价，按整行剔除（不止首行） */
  const devSum = LINES.filter((l) => l.unit === '项').reduce((a, l) => a + lineUp(l, uplift), 0);

  /**
   * 版本历史：按 ver 升序。curSnap = 当前版快照（无快照则退化为「实时明细」）。
   * 版本对比统一走共享 quoteDiff（DiffTable / prevOf / sortVers），台账抽屉与本页共用同一份差异回放。
   */
  const verList = useMemo(() => (Q.versions ?? []).slice().sort((a, b) => verNo(a.ver) - verNo(b.ver)), [Q]);
  const curSnap = verList.find((v) => v.ver === Q.ver) ?? verList[verList.length - 1];
  /**
   * 流转记录：按审批单 ref 命中本报价单派生（ref 形如「BJ000011 报价单 V2」）。
   * 修复前是 5 行写死的昆明万达流转文案，打开任何报价单都长一样。
   */
  const flows = useMemo(() => {
    const rows: { date: string; text: string; tone: 'ok' | 'red' | 'gold' }[] = [];
    rows.push({ date: Q.date, text: `创建 ${Q.ver} 并提交审批（负责人 ${Q.owner}）`, tone: 'ok' });
    getApprovals()
      .filter((a) => a.ref.includes(Q.id))
      .slice()
      .sort((a, b) => a.time.localeCompare(b.time))
      .forEach((a) => {
        const tone = a.status === '已退回' ? 'red' : a.status === '已通过' ? 'ok' : 'gold';
        const tail = a.status === '已退回' ? `驳回：${a.reason || '未填写原因'}` : a.status === '已通过' ? `${a.level} · 审批通过` : `${a.level} · ${a.status}`;
        rows.push({ date: a.time.slice(0, 10), text: `${a.ap} · ${tail}`, tone });
      });
    return rows;
  }, [Q.id, Q.ver, Q.date, Q.owner, tick]);

  /** 税率口径（只读）：按报价单落库口径计算 —— 含税 → 税额 = 总额×税率÷(100+税率)；不含税 → 税额 = 总额×税率÷100 */
  const tax = INC ? Math.round(total * RATE / (100 + RATE)) : Math.round(total * RATE / 100);
  const t = INC
    ? { mode: '含税', rate: RATE, tax, net: total - tax, gross: total }
    : { mode: '不含税', rate: RATE, tax, net: total, gross: total + tax };
  const eng = total - devSum;
  const unit = AREA > 0 ? eng / AREA : 0;

  const mean = REF.reduce((a, r) => a + r.up, 0) / REF.length;
  const dev = ((unit - mean) / mean) * 100;
  const devTone = Math.abs(dev) <= 10 ? 'is-green' : Math.abs(dev) <= 20 ? 'is-orange' : 'is-red';
  /* 单方 / 历史均值 / 偏离度只在下方 warnbox 标题里出现一次，正文只给判断与送审建议 */
  const devText = Math.abs(dev) <= 10
    ? '偏离幅度在合理区间内，可直接送审。'
    : Math.abs(dev) > 20
      ? '偏离幅度超出 ±20%，需重点说明定价依据后再送审。'
      : '偏离幅度处于 ±10%~20%，建议复核定价依据。';

  return (
    <>
      <PageHead
        title={<span className="nc-mono-lg">{Q.id}</span>}
        badges={<><Tag tone="blue">{Q.ver} 当前版本</Tag><Tag tone="blue">{Q_ST}</Tag><Tag tone="orange">{t.mode} {t.rate}%</Tag></>}
        sub={`${Q.name} · ${Q.customer} · 负责人 ${Q.owner}`}
        actions={<>
          <Btn onClick={() => go('quote')}>← 返回台账</Btn>
          <Btn kind="primary" onClick={() => { setFocus('quote-edit', Q.id); go('quote-edit'); }}>编辑报价</Btn>
        </>}
      />

      {/* ---------- 顶部派生卡（随税率 / 上浮实时重算） ----------
          单方造价不在此处重复：它的唯一出处是下方「历史同类项目价格参照」的「本单」行，
          那里同时给出历史均值与偏离度，比单摆一个数字更有判断价值。 */}
      <div className="nc-tiles nc-tiles-3">
        <div className="nc-tile">
          <div className="nc-tile-label">报价总额（{t.mode}）</div>
          <div className="nc-tile-value num"><Money v={total} role={role} /></div>
          <div className="nc-tile-sub">明细 {LINES.length} 行</div>
        </div>
        <div className="nc-tile">
          <div className="nc-tile-label">税额（{t.rate}%）</div>
          <div className="nc-tile-value num"><Money v={t.tax} role={role} /></div>
          <div className="nc-tile-sub">{t.mode === '含税' ? <>不含税 <Money v={t.net} role={role} /></> : <>含税合计 <Money v={t.gross} role={role} /></>}</div>
        </div>
        <div className="nc-tile">
          <div className="nc-tile-label">区域上浮</div>
          <div className="nc-tile-value num" style={{ color: 'var(--c-primary)' }}>+{uplift}%</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
      {/* 基本信息 */}
      <Card hd="基本信息" extra={<span className="nc-cell-sub">关联项目 {relProj ? <EntityLink target="project-center" id={relProj.id} go={go} title="下钻到项目详情">{relProj.id} →</EntityLink> : '—'}</span>}>
        <div className="nc-rv-grid">
          <KvGrid cols={2} rows={[
            { k: '客户', v: <EntityLink target="customer" id={Q.customerId} go={go} title="下钻到客户档案">{Q.customer}</EntityLink> },
            { k: '行业', v: Q.base },
            { k: '项目面积', v: <span className="num">{AREA.toLocaleString('en-US')} ㎡</span> },
            { k: '提交人 / 日期', v: `${Q.owner} · ${Q.date}` },
            { k: '税率口径', v: <b>{Q.taxMode} {Q.taxRate}%（税额按「{Q.taxMode === '含税' ? '总额×税率÷(100+税率)' : '总额×税率÷100'}」计算）</b> },
            { k: '有效期', v: `报价后 30 天（至 2026-10-12）` },
            { k: '关联商机', v: Q.opp ? <EntityLink target="opp" id={Q.opp} go={go} title="下钻到商机详情">{Q.opp}</EntityLink> : <span className="nc-cell-sub">—</span> },
            { k: '整体浮率', v: <b className={`num${Q.markup >= 30 ? ' is-red' : ''}`}>{Q.markup}%</b> },
            { k: '低于标准毛利', v: <span title={marginGuardText(guard)}>{guard.rows.length
              ? <Tag tone={guard.level === '—' ? 'gold' : 'red'}>{`低 ${guard.gap.toFixed(1)} 个百分点${guard.level === '—' ? '' : ` · ${guard.level}特批`}`}</Tag>
              : <span className="nc-cell-sub">各明细行均未低于目录默认毛利</span>} </span> },
          ]} />
        </div>
      </Card>

      {/* 报价明细 */}
      <Card hd="报价明细" extra={<span className="nc-cell-sub">区域上浮 {uplift}%（只读 · 修改请进编辑页）</span>}>
        <div className="nc-tbl-wrap">
          <table className="nc-tbl" style={{ minWidth: 860 }}>
            <thead>
              <tr>
                <th style={{ width: 110 }}>业务类型</th>
                <th>内容</th>
                <th style={{ width: 110 }} className="is-num">数量</th>
                <th style={{ width: 120 }} className="is-num">单价</th>
                <th style={{ width: 140 }} className="is-num">上浮前</th>
                <th style={{ width: 140 }} className="is-num">上浮后</th>
              </tr>
            </thead>
            <tbody>
              {LINES.map((l, i) => (
                /* key 用「行下标 + 名称」：同名不同规格的行（如两行「镀锌钢管」DN100 / DN150）用纯名称会冲突，
                   导致 React 复用错行、上浮重算时行序错乱。 */
                <tr key={`${i}-${l.name}`}>
                  <td><Tag tone="gray">{l.bt}</Tag></td>
                  <td>
                    {l.name}
                    {/* M8：配方版本快照 —— 上游配方升版后此处给出「当前 Vx」提示，提醒复核成本口径 */}
                    {l.recipeVer && (
                      <div className="nc-cell-sub">
                        按 {l.recipeVer} 配方计价
                        {l.curVer && l.curVer !== l.recipeVer ? ` · 套件当前 ${l.curVer}，成本口径需复核` : ''}
                      </div>
                    )}
                    {l.below > 0 && (
                      <div className="nc-cell-sub" style={{ color: 'var(--c-warning-deep)' }}>
                        低于该目录默认毛利 {l.below.toFixed(1)} 个百分点
                      </div>
                    )}
                  </td>
                  <td className="is-num">{l.qty.toLocaleString('en-US')} {l.unit}</td>
                  <td className="is-num"><Money v={l.price} role={role} /></td>
                  <td className="is-num" style={{ color: 'var(--ink-2)' }}><Money v={linkAmt(l)} role={role} /></td>
                  <td className="is-num"><b className="num"><Money v={lineUp(l, uplift)} role={role} /></b></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="nc-tbl-sum">
                <td colSpan={4}>合计</td>
                <td className="is-num">{fmt(preTotal)}</td>
                <td className="is-num"><b className="num" style={{ color: 'var(--c-primary)' }}>{fmt(total)}</b></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* 历史同类项目价格参照 */}
      <Card hd="历史同类项目价格参照" extra={<span className="nc-cell-sub">行业「{Q.base}」· 类型「消防系统升级」· 近 18 个月成交</span>}>
        {REF.map((r) => (
          <div key={r.name} className="nc-refrow">
            <div className="nc-refname">
              {r.name}
              <div className="nc-cell-sub">{r.date} · 成交 {fmt(r.amt)} · {r.area.toLocaleString('en-US')} ㎡</div>
            </div>
            <span className="nc-refval num">{r.up.toFixed(1)} 元/㎡</span>
          </div>
        ))}
        <div className="nc-refrow is-cur">
          <div className="nc-refname">
            <b>本单（{Q.ver} · 含税）</b>
            <div className="nc-cell-sub">工程费 {fmt(eng)} ÷ {AREA.toLocaleString('en-US')} ㎡</div>
          </div>
          <span className="nc-refval num" style={{ color: 'var(--c-primary)', fontWeight: 700 }}>{unit.toFixed(1)} 元/㎡</span>
        </div>
        <div className={`nc-warnbox ${devTone}`}>
          <div className="nc-warnbox-hd">历史均值 {mean.toFixed(1)} 元/㎡ → 本单 {unit.toFixed(1)} 元/㎡，偏离 <b className="num">{dev > 0 ? '+' : ''}{dev.toFixed(1)}%</b></div>
          <div>{devText}</div>
        </div>
      </Card>

      </div>
      <div style={{ width: 280, flexShrink: 0 }}>
      {/* 版本历史（右侧栏） */}
      <Card hd="版本历史" extra={<span className="nc-cell-sub">点击版本号查看当时明细</span>}>
        {verList.length ? [...verList].reverse().map((v) => {
          const isCur = v.ver === curSnap?.ver;
          return (
            <div key={v.ver} className={`nc-vercard${isCur ? ' is-cur' : ''}`} style={{ cursor: 'pointer' }} onClick={() => {
              const vlist = sortVers(verList);
              if (isCur) {
                const prev = prevOf(vlist, v);
                if (prev) { setSelA(prev.ver); setSelB(v.ver); setDiffPair({ prev, cur: v }); }
                else toast('本单暂无更早的版本快照');
                return;
              }
              /* 点击历史版本 → 直接打开「该版 → 下一版」真实对比（不再只 toast） */
              const next = vlist.find((x) => verNo(x.ver) === verNo(v.ver) + 1) ?? v;
              setSelA(v.ver); setSelB(next.ver);
              setDiffPair({ prev: v, cur: next });
            }}>
              <Tag tone={isCur ? 'blue' : 'gray'}>{v.ver}{isCur ? ' · 当前' : ''}</Tag>
              <b className="num">{fmt(v.amt)}</b>
              <span className="nc-cell-sub" style={{ marginTop: 0 }}>
                {v.at} · {v.by} · {v.note}{v.uplift ? ` · 区域上浮 ${v.uplift}%` : ''} · 明细基价合计（未含区域上浮）
              </span>
              <span className="nc-vercard-op">{isCur ? '与上一版对比 ›' : '与下一版对比 ›'}</span>
            </div>
          );
        }) : (
          <div className="nc-vercard is-cur">
            <Tag tone="blue">{Q.ver} · 当前</Tag>
            <b className="num">{fmt(Q.total)}</b>
            <span className="nc-cell-sub" style={{ marginTop: 0 }}>{Q.update} · 该单未留存版本快照，暂无法对比追溯</span>
          </div>
        )}
      </Card>
      </div>
      </div>

      {/* 流转记录：按审批单 ref 命中本单派生（不再写死昆明万达的 5 行文案） */}
      <Card hd="流转记录" extra={
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span className="nc-cell-sub">按审批单留痕自动汇总</span>
          {['待审批', '审批中'].includes(Q_ST) && <Btn size="sm" danger onClick={() => setRecallOpen(true)}>撤回审批</Btn>}
        </span>
      }>
        <Timeline items={flows} />
      </Card>

      {/* 撤回审批 */}
      <Modal
        open={recallOpen} onClose={() => setRecallOpen(false)} width={480} title="撤回审批"
        foot={<><Btn onClick={() => setRecallOpen(false)}>取消</Btn><Btn danger onClick={() => { toast('已撤回审批，回到草稿状态，可修改后重新提交'); setRecallOpen(false); }}>撤回</Btn></>}>
        <div style={{ fontSize: 13 }}>确认撤回本单审批？撤回后回到草稿状态，可修改后重新提交。</div>
      </Modal>

      {/* 版本差异回放：任意两版快照对比（共享 DiffTable，含「不变 / 改价 / 已删除 / 新增」性质列） */}
      <Modal open={!!diffPair} onClose={() => setDiffPair(null)} width={860}
        title={diffPair ? `${diffPair.prev.ver} → ${diffPair.cur.ver} 变更对比` : '版本变更对比'}
        foot={<Btn kind="primary" onClick={() => setDiffPair(null)}>关闭</Btn>}>
        <Banner tone="info">差异回放（只读）：旧版只读保留，避免误改不可恢复。</Banner>
        {diffPair && verList.length >= 2 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0 10px', flexWrap: 'wrap' }}>
              <span className="nc-cell-sub">对比版本：</span>
              <select className="nc-input nc-input-sm" value={selA} onChange={(e) => {
                const av = e.target.value; setSelA(av);
                const bv = selB && selB !== av ? selB : verList.find((x) => x.ver !== av)?.ver ?? '';
                setSelB(bv);
                if (av && bv) setDiffPair({ prev: verList.find((x) => x.ver === av)!, cur: verList.find((x) => x.ver === bv)! });
              }}>
                {verList.map((v) => <option key={v.ver} value={v.ver}>{v.ver} · {fmt(v.amt)}</option>)}
              </select>
              <span className="nc-cell-sub">→</span>
              <select className="nc-input nc-input-sm" value={selB} onChange={(e) => {
                const bv = e.target.value; setSelB(bv);
                const av = selA && selA !== bv ? selA : verList.find((x) => x.ver !== bv)?.ver ?? '';
                setSelA(av);
                if (av && bv) setDiffPair({ prev: verList.find((x) => x.ver === av)!, cur: verList.find((x) => x.ver === bv)! });
              }}>
                {verList.map((v) => <option key={v.ver} value={v.ver}>{v.ver} · {fmt(v.amt)}</option>)}
              </select>
            </div>
            <DiffTable prev={diffPair.prev} cur={diffPair.cur}
              title={`${diffPair.prev.ver} ${diffPair.prev.at} · ${diffPair.prev.by} · ${diffPair.prev.note} → ${diffPair.cur.ver} ${diffPair.cur.at} · ${diffPair.cur.by} · ${diffPair.cur.note}`} />
          </>
        )}
        {!diffPair && <div className="nc-cell-sub">该报价单未留存两个及以上版本快照，暂无可对比的差异。</div>}
      </Modal>
    </>
  );
}
