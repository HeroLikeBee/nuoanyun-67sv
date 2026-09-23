// 报价详情（只读详情 + 版本追溯）
// 复刻「报价详情.html」：派生=金额/税额/单方；工具=区域上浮批量；参照=历史同类单方；流转=撤回/升版
// 硬规则：税率口径公式写死 · 区域上浮 0~30 越界拦截且联动顶部卡与单方造价 · 升版必填变更原因 · 版本对比含「不变/已删除/新增」性质
import React, { useEffect, useMemo, useState } from 'react';
import {
  Btn, Banner, Card, EntityLink, KvGrid, Modal, Money, PageHead, Tag, Timeline, useToast, Code,
} from '../components/ui';
import { fmt, TODAY } from '../components/data';
import { getBizStatus, getFocus, getProjects, getQuotes, subscribeStore } from '../components/store';
import { Ico } from '../components/icons';

/* G3：原 const Q = QUOTES[0] 硬编码索引 0 —— 从任何入口进入都只看 BJ000011。
   改为组件内读取聚焦 ID（上游页面跳转前写入 store），并以 nav 为依赖重新解析，
   保证「客户 → 报价 → 客户 → 另一张报价」这类反复下钻都能正确定位。
   项目面积 / 设备行下标也改为按当前报价单明细派生（见组件内 AREA / DEVICE_IDX），
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

/** V1 → V2 变更对比（含「不变 / 已删除 / 新增」性质列） */
const DIFF_ROWS: [string, string, string, string, 'warn' | 'gray' | 'danger' | 'info' | 'sum'][] = [
  ['火灾自动报警系统（元/㎡）', '74', '72', '单价 -2', 'warn'],
  ['消火栓及喷淋改造（元/㎡）', '56', '56', '不变', 'gray'],
  ['消防主机及联动调试', '¥1,352,000', '¥1,332,194', '-¥19,806', 'warn'],
  ['应急照明系统改造', '¥130,000', '—', '已删除（院方预算）', 'danger'],
  ['区域上浮', '0%', '3%', '新增云南区域上浮', 'info'],
  ['总额', '¥4,862,000', '¥4,800,000', '-¥62,000', 'sum'],
];
const DIFF_TONE: Record<string, string> = { warn: 'var(--c-warning-deep)', gray: 'var(--ink-3)', danger: 'var(--c-danger-deep)', info: 'var(--c-primary)', sum: 'var(--c-warning-deep)' };

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
  /* 关联项目：优先报价单自身外键（projectId），兜底按项目的 quoteId 反查 —— 修复前固定显示 PROJECTS[0] */
  const relProj = useMemo(() => {
    const all = getProjects();
    return all.find((p) => p.id === Q.projectId) || all.find((p) => p.quoteId === Q.id);
  }, [Q.id, Q.projectId, tick]);
  const [uplift, setUplift] = useState(3);
  const [taxMode, setTaxMode] = useState('tax9');
  const [applied, setApplied] = useState(false);
  const [diffOpen, setDiffOpen] = useState(false);
  const [v3Open, setV3Open] = useState(false);
  const [v3Note, setV3Note] = useState('');
  const [recallOpen, setRecallOpen] = useState(false);

  /** 明细：优先用 data.ts 存储的明细行（引用物料ID），无存储行时回退模板按总额分摊 */
  const LINES = useMemo(() => {
    const stored = (Q as any).lines as { matId?: string; name: string; spec?: string; unit: string; qty: number; price: number }[] | undefined;
    if (stored && stored.length) {
      return stored.map((l) => ({
        bt: l.matId ? '材料/设备（从物料库选择）' : '安装工程',
        name: l.spec ? `${l.name}（${l.spec}）` : l.name,
        unit: l.unit, qty: l.qty, price: l.price, w: 0,
      }));
    }
    return linesOf(Q.total);
  }, [Q]);
  const preTotal = LINES.reduce((a, l) => a + linkAmt(l), 0);
  const total = LINES.reduce((a, l) => a + lineUp(l, uplift), 0);

  /**
   * 项目面积：取明细中「㎡」计量行的数量（按当前报价单明细派生，无 ㎡ 行时回落到原型常量）。
   * 设备 / 平台接入行（「项」计量）在计算「工程费单方」时剔除。
   * 修复前两者是模块级常量 26000 / 2，只对 BJ000011 成立，别的报价单单方造价全错。
   */
  const AREA = LINES.find((l) => l.unit === '㎡')?.qty || 26000;
  const DEVICE_IDX = LINES.findIndex((l) => l.unit === '项');

  /** 初版基价锚点：明细未含区域上浮的合计（数据模型无版本历史，故以「未上浮基价」为 V1 参照，
      不再写死 4862000 —— 那个数字只对 BJ000011 成立）。 */
  const V1_AMT = preTotal;
  const v1Diff = total - V1_AMT;

  /** 税率口径：含税 → 税额 = 总额×税率÷(100+税率)；不含税 → 税额 = 总额×税率÷100 */
  const taxInfo = () => {
    const m = taxMode.slice(0, 3);
    const rate = Number(taxMode.replace(/\D/g, ''));
    if (m === 'tax') {
      const tax = Math.round(total * rate / (100 + rate));
      return { mode: '含税', rate, tax, net: total - tax, gross: total };
    }
    const tax = Math.round(total * rate / 100);
    return { mode: '不含税', rate, tax, net: total, gross: total + tax };
  };
  const t = taxInfo();
  const eng = total - (DEVICE_IDX >= 0 ? lineUp(LINES[DEVICE_IDX], uplift) : 0);
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

  /** 区域上浮：0~30 越界拦截，应用后联动明细 / 顶部卡 / 单方造价 */
  const applyUp = (v: string) => {
    const n = Number(v);
    if (Number.isNaN(n) || n < 0 || n > 30) { toast(' 上浮比例需在 0~30 之间'); return; }
    setUplift(n);
    setApplied(true);
    toast(`已将区域上浮 ${n}% 应用到全部 ${LINES.length} 行（替代逐行手动改价，防漏改）`);
  };

  return (
    <>
      <PageHead
        title={<span className="nc-mono-lg">{Q.id}</span>}
        badges={<><Tag tone="blue">{Q.ver} 当前版本</Tag><Tag tone="blue">{Q_ST}</Tag><Tag tone="orange">{t.mode} {t.rate}%</Tag></>}
        sub={`${Q.name} · ${Q.customer} · 负责人 ${Q.owner}`}
        actions={<>
          <Btn onClick={() => go('quote')}>← 返回台账</Btn>
          <Btn kind="primary" onClick={() => setV3Open(true)}>生成 V3（按意见调整）</Btn>
          <Btn onClick={() => go('approval')}>查看审批进度</Btn>
          <Btn danger onClick={() => setRecallOpen(true)}>撤回审批</Btn>
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

      {/* 基本信息 */}
      <Card hd="基本信息" extra={<span className="nc-cell-sub">关联项目 {relProj ? <EntityLink target="project-center" id={relProj.id} go={go} title="下钻到项目经营中心">{relProj.id} →</EntityLink> : '—'}</span>}>
        <div className="nc-rv-grid">
          <KvGrid cols={2} rows={[
            { k: '客户', v: <EntityLink target="customer" id={Q.customerId} go={go} title="下钻到客户档案">{Q.customer}</EntityLink> },
            { k: '行业', v: Q.base },
            { k: '项目面积', v: <span className="num">{AREA.toLocaleString('en-US')} ㎡</span> },
            { k: '提交人 / 日期', v: `${Q.owner} · ${Q.date}` },
            {
              k: '税率口径 *', v: (
                <div>
                  <select className="nc-input nc-input-sm" value={taxMode} onChange={(e) => { setTaxMode(e.target.value); toast('税率口径已切换，税额与含税合计已重算'); }}>
                    <option value="tax9">含税 9%（建筑业）</option>
                    <option value="tax13">含税 13%</option>
                    <option value="tax6">含税 6%（服务·维护保养）</option>
                    <option value="net6">不含税 6%</option>
                    <option value="net13">不含税 13%</option>
                  </select>
                  <div className="nc-field-note">口径必选：不含税报价后续开票将另加税额，避免纠纷</div>
                </div>
              ),
            },
            { k: '有效期', v: `报价后 30 天（至 2026-10-12）` },
            { k: '关联商机', v: <Code>{Q.opp}</Code> },
            { k: '整体浮率', v: <b className={`num${Q.markup >= 30 ? ' is-red' : ''}`}>{Q.markup}%</b> },
          ]} />
        </div>
      </Card>

      {/* 报价明细 */}
      <Card hd="报价明细" extra={
        <div className="nc-inline-ops">
          <span className="nc-cell-sub">区域上浮</span>
          {/* 输入即时夹取 0~30：修复前只在点「一键应用」时校验，直接输入 999 会让
              顶部报价总额与单方造价先按 999% 重算，再点应用才被拒 —— 数字先错后拦。 */}
          <input className="nc-input nc-input-sm num" type="number" min={0} max={30} value={uplift}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === '') { setUplift(0); return; }
              const n = Number(raw);
              if (Number.isNaN(n)) return;
              if (n < 0) { setUplift(0); toast('区域上浮不得为负，已修正为 0'); return; }
              if (n > 30) { setUplift(30); toast('区域上浮上限 30%，已截断为 30'); return; }
              setUplift(n);
            }} style={{ width: 64 }} />
          <span className="nc-cell-sub">%（0~30）</span>
          <Btn size="sm" kind="primary" onClick={() => applyUp(String(uplift))}>一键应用到全部行</Btn>
        </div>
      }>
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
              {LINES.map((l) => (
                <tr key={l.name}>
                  <td><Tag tone="gray">{l.bt}</Tag></td>
                  <td>{l.name}</td>
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
        {applied && <div className="nc-rulebar is-ok"><Ico n="check" size={16} /> 区域上浮 {uplift}% 已应用于全部 {LINES.length} 行（改动留痕）</div>}
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

      {/* 版本记录 */}
      <Card hd="版本记录" extra={<span className="nc-cell-sub">多轮报价逐版留痕，可对比追溯</span>}>
        <div className="nc-vercard is-cur">
          <Tag tone="blue">{Q.ver} · 当前</Tag>
          <b className="num">较初版基价 {v1Diff >= 0 ? '+' : '−'}{fmt(Math.abs(v1Diff))}</b>
          <span className="nc-cell-sub" style={{ marginTop: 0 }}>{Q.update} · 当前版本（含区域上浮 {uplift}%）</span>
          <span className="nc-vercard-ops"><Btn size="sm" onClick={() => setDiffOpen(true)}>与初版对比</Btn></span>
        </div>
        <div className="nc-vercard">
          <Tag>初版</Tag>
          <span className="num">{fmt(V1_AMT)}</span>
          <span className="nc-cell-sub" style={{ marginTop: 0 }}>{Q.date} · 明细基价合计（未含区域上浮）</span>
        </div>
      </Card>

      {/* 流转记录 */}
      <Card hd="流转记录">
        <Timeline items={[
          { date: '2026-09-12', text: '创建 V1 并提交部门负责人', tone: 'ok' },
          { date: '2026-09-14', text: '部门负责人退回：金额偏高，建议对齐院方预算', tone: 'red' },
          { date: '2026-09-20', text: '生成 V2（删减应急照明，应用区域上浮 3%）并重新提交', tone: 'ok' },
          { date: '2026-09-20', text: `部门负责人李强 · 审批通过`, tone: 'gold' },
          { date: TODAY, text: `分管副总（${role}）· 审批通过，待总经理审批`, tone: 'gold' },
        ]} />
      </Card>

      {/* 生成 V3（必填变更原因） */}
      <Modal
        open={v3Open} onClose={() => setV3Open(false)} width={480} title="生成 V3"
        foot={<><Btn onClick={() => setV3Open(false)}>取消</Btn><Btn kind="primary" onClick={() => {
          if (!v3Note.trim()) { toast(' 请填写变更原因'); return; }
          toast(`V3 草稿已生成：${v3Note.trim()}`);
          setV3Note(''); setV3Open(false);
        }}>生成 V3</Btn></>}>
        <div style={{ fontSize: 13, marginBottom: 12 }}>
          基于 {Q.ver} 复制为 V3 草稿，请填写<b>变更原因</b>（必填，用于版本追溯）：
        </div>
        <input className="nc-input" value={v3Note} onChange={(e) => setV3Note(e.target.value)} placeholder="如：按审批意见下调报警单价 2 元/㎡" />
      </Modal>

      {/* 撤回审批 */}
      <Modal
        open={recallOpen} onClose={() => setRecallOpen(false)} width={480} title="撤回审批"
        foot={<><Btn onClick={() => setRecallOpen(false)}>取消</Btn><Btn danger onClick={() => { toast('已撤回审批，回到草稿状态，可修改后重新提交'); setRecallOpen(false); }}>撤回</Btn></>}>
        <div style={{ fontSize: 13 }}>确认撤回本单审批？撤回后回到草稿状态，可修改后重新提交。</div>
      </Modal>

      {/* 版本差异回放（含性质列） */}
      <Modal open={diffOpen} onClose={() => setDiffOpen(false)} width={840} title="V1 → V2 变更对比"
        foot={<Btn kind="primary" onClick={() => setDiffOpen(false)}>关闭</Btn>}>
        <Banner tone="info">差异回放（只读）：旧版只读保留，避免误改不可恢复。</Banner>
        <table className="nc-tbl" style={{ minWidth: 700 }}>
          <thead><tr><th>明细项</th><th style={{ width: 130 }} className="is-num">V1</th><th style={{ width: 130 }} className="is-num">V2</th><th style={{ width: 170 }}>变更</th></tr></thead>
          <tbody>
            {DIFF_ROWS.map(([name, v1, v2, chg, tone]) => (
              <tr key={name}>
                <td>{name}</td>
                <td className="is-num">{v1}</td>
                <td className="is-num"><b className="num">{v2}</b></td>
                <td style={{ color: DIFF_TONE[tone], fontWeight: tone === 'sum' ? 600 : 400 }}>{chg}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>
    </>
  );
}
