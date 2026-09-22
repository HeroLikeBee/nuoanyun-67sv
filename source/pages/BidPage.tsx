// 投标管理（看板 ⇄ 列表双视图）—— 投标全流程 8 阶段
// 硬规则：证书过期不可引用 · 占用上限拦截 · 建造师三要素 · 已投标后证书引用锁定 · 安许过期=全部废标
// 列表版式（简化版）：页头(共N项·进行中N + 视图切换/导出/发起) → 5 统计卡 → 工具条(搜索+3下拉+右侧快捷chips) → 表格
//   复杂度下沉到详情抽屉：页级不再放安许警示条 / 阶段统计条 / 证书占用列 / 提示行
import React, { useEffect, useMemo, useState } from 'react';
import {
  Btn, Banner, Card, DataTable, Drawer, Field, IdCell, KvGrid, ListToolbar, Modal, Money, Op, OpMore, OpNone, OpSep,
  PageHead, TableFoot, Tag, Timeline, Tip, useToast, ChainBar, Check, Code, Progress, Tabs, ConfirmModal, EntityLink, pressProps,
} from '../components/ui';
import type { OpMoreItem } from '../components/ui';
import { BIDS, BID_STAGES, CERTS, fmt, fmtWan, TODAY, approveLevel } from '../components/data';
import { consumeFocus, setFocus, setPendingContract } from '../components/store';
import { Ico } from '../components/icons';

const ST_TONE: Record<string, 'gray' | 'blue' | 'green' | 'red' | 'gold' | 'orange'> = {
  报名: 'gray', 招标中: 'blue', 做标书: 'blue', 已交保证金: 'orange', 已投标: 'blue', 开标: 'gold', 中标: 'green', 未中标: 'red',
};
const DEP_TONE: Record<string, 'gray' | 'blue' | 'green' | 'red'> = { 未交: 'gray', 已交: 'blue', 未退: 'red', 已退: 'green', 未涉及: 'gray' };
type B = (typeof BIDS)[number];

const CERT_MODE_LABEL: Record<string, string> = { single: '一证一项目', multi: '多项目引用', log: '按次登记' };
const QUICKS = ['全部', '开标≤7天', '今日开标', '保未交/未退', '证书满载', '待登记结果'] as const;

/** 税率口径 6 档：含税 9/13/6 · 不含税 9/13/6 */
const TAX = [
  { v: 'in9', label: '含税 9%（建筑业）', rate: 9, mode: 'in' },
  { v: 'in13', label: '含税 13%', rate: 13, mode: 'in' },
  { v: 'in6', label: '含税 6%（服务）', rate: 6, mode: 'in' },
  { v: 'out9', label: '不含税 9%', rate: 9, mode: 'out' },
  { v: 'out13', label: '不含税 13%', rate: 13, mode: 'out' },
  { v: 'out6', label: '不含税 6%', rate: 6, mode: 'out' },
];
/** 税额：含税 = 总额 × 税率 ÷ (100+税率)；不含税 = 总额 × 税率 ÷ 100 */
const taxAmt = (amt: number, v: string) => {
  const t = TAX.find((x) => x.v === v);
  if (!t || !(amt > 0)) return null;
  return t.mode === 'in' ? amt * t.rate / (100 + t.rate) : amt * t.rate / 100;
};

/** 保证金缴纳方式 */
const DEP_METHODS = ['银行转账', '银行保函', '保证保险'];

/** 证书配额行（发起向导逐行预检） */
type CertLine = { t: string; q: number };
const CERT_LINE_TYPES = [
  { v: 'ZZ', n: '消防设施工程专业承包（二级）', type: '企业资质' },
  { v: 'WB', n: '消防设施维护保养检测资质（二级）', type: '企业资质' },
  { v: 'AQ', n: '安全生产许可证', type: '企业资质' },
  { v: 'ZJ', n: '注册建造师（机电工程）', type: '人员证书' },
  { v: 'XF', n: '一级注册消防工程师', type: '人员证书' },
  { v: 'JG', n: '建构筑物消防员（中级）', type: '人员证书' },
  { v: 'DG', n: '电工证', type: '人员证书' },
  { v: 'HG', n: '焊工证', type: '人员证书' },
];
/** 逐行预检：ok 可满足 / warn 部分缺口 / bad 无法满足 / none 待选择 */
const precheck = (l: CertLine, openDate: string) => {
  const def = CERT_LINE_TYPES.find((x) => x.v === l.t);
  if (!def) return { lv: 'none' as const, head: '待选择', detail: '' };
  if (l.t === 'DG' || l.t === 'HG') return { lv: 'ok' as const, head: `可满足 ×${l.q}`, detail: '按次登记类，不占用证书资源，引用后登记使用人' };
  const pool = CERTS.filter((c) => (def.type === '企业资质' ? c.type === '企业资质' : c.type === '人员证书') && c.name.includes(def.n.replace(/（.*?）/g, '')));
  if (!pool.length) return { lv: 'bad' as const, head: ' 库内无此类证书', detail: '需外部借调或新办' };
  const usable: string[] = []; const blocked: string[] = [];
  pool.forEach((c) => {
    const expired = c.validTo < TODAY;
    const full = c.mode === 'single' && c.used.length >= c.cap;
    const expBeforeOpen = openDate && c.validTo < openDate;
    const why = expired ? '已过期' : expBeforeOpen ? `开标日（${openDate}）前到期` : full ? `已达并行占用上限 ${c.used.length}/${c.cap}` : '';
    if (why) blocked.push(`${c.id} ${c.holder}：${why}`);
    else usable.push(`${c.id} ${c.holder}`);
  });
  if (usable.length >= l.q) return { lv: 'ok' as const, head: `可满足 ×${l.q}`, detail: `可用：${usable.join('、')}` };
  if (usable.length) return { lv: 'warn' as const, head: `缺口 ${l.q - usable.length} 本`, detail: `可用 ${usable.join('、')}；受阻：${blocked.join('；')}` };
  return { lv: 'bad' as const, head: ' 无法满足', detail: blocked.join('；') };
};

/** 投标结果（含废标 / 流标） */
const RESULT_TYPES = ['中标', '未中标', '废标 / 流标'] as const;

/** 跟进记录：人工登记（可增删改，提交后不可改） */
const followsOf = (b: B) => [
  { date: '2026-09-05', text: `电话跟进招标代理，确认资格预审要求（需证书 ${b.certNeed} 本）`, by: b.owner },
  { date: '2026-09-12', text: `现场踏勘：${b.name}，重点核对${b.certNeed > 3 ? '消防主机房与管网走向' : '作业面与工期窗口'}`, by: b.owner },
];
/** 操作记录：系统自动生成（不可编辑、不可删除） */
const opsOf = (b: B) => {
  const l: { date: string; text: string; by: string }[] = [
    { date: '2026-09-01', text: '创建投标 · 独立新建', by: b.owner },
  ];
  if (b.certGot > 0) l.push({ date: '2026-09-08', text: `引用证书：${b.certGot} 本（并行占用 +${b.certGot}）`, by: b.owner });
  if (['已交', '未退', '已退'].includes(b.depositSt)) l.push({ date: '2026-09-12', text: `保证金登记已交：${fmtWan(b.deposit)}（银行转账）`, by: b.owner });
  if (b.depositSt === '已退') l.push({ date: '2026-09-20', text: `保证金登记已退：${fmtWan(b.deposit)}`, by: '财务' });
  if (['已投标', '开标', '中标', '未中标'].includes(b.stage)) l.push({ date: b.openDate, text: `流转：已交保证金 → 已投标（标书递交）`, by: b.owner });
  if (['开标', '中标', '未中标'].includes(b.stage)) l.push({ date: b.openDate, text: '流转：已投标 → 开标（阶段锁定）', by: b.owner });
  if (b.stage === '中标') l.push({ date: b.openDate, text: `登记结果：中标 ${fmtWan(b.amt)}（已回写商机）`, by: b.owner });
  if (b.stage === '未中标') l.push({ date: b.openDate, text: `登记结果：未中标（${b.risk || '价稍高'}）`, by: b.owner });
  l.push({ date: TODAY, text: `当前阶段：${b.stage}`, by: '系统' });
  return l;
};

export default function BidPage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  const [view, setView] = useState<'kanban' | 'list'>('list');
  const [kw, setKw] = useState('');
  const [stage, setStage] = useState('');
  const [owner, setOwner] = useState('');
  const [dep, setDep] = useState('');
  const [quick, setQuick] = useState('全部');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detail, setDetail] = useState<B | null>(null);
  const [tab, setTab] = useState('overview');

  const [wizOpen, setWizOpen] = useState(false);
  const [wizStep, setWizStep] = useState(0);
  const [riskOpen, setRiskOpen] = useState(false);
  const [riskAck, setRiskAck] = useState(false);
  const [resultOpen, setResultOpen] = useState<B | null>(null);
  const [resultType, setResultType] = useState('中标');
  const [winAmt, setWinAmt] = useState(0);
  const [loseReason, setLoseReason] = useState('');
  const [loseText, setLoseText] = useState('');
  // 评审 I1：移除证书引用属高影响操作，改为二次确认 + 原因必填
  const [unrefOpen, setUnrefOpen] = useState<(typeof CERTS)[number] | null>(null);
  const [poolOpen, setPoolOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>(['ZS000015']);
  const [useText, setUseText] = useState<Record<string, string>>({});
  // 发起向导：税率 / 保证金 / 证书配额行
  const [wTax, setWTax] = useState('in9');
  const [wAmt, setWAmt] = useState(860000);
  const [wOpen, setWOpen] = useState('2026-09-25');
  const [wCertLines, setWCertLines] = useState<CertLine[]>([{ t: 'ZZ', q: 1 }, { t: 'AQ', q: 1 }, { t: 'ZJ', q: 1 }, { t: 'DG', q: 2 }]);
  // 保证金：登记弹窗 / 台账
  const [depOpen, setDepOpen] = useState<B | null>(null);
  const [depMethod, setDepMethod] = useState('银行转账');
  const [depAmt, setDepAmt] = useState(0);
  const [ledgerOpen, setLedgerOpen] = useState(false);
  // 跟进记录（人工登记）
  const [followOpen, setFollowOpen] = useState(false);
  const [followText, setFollowText] = useState('');

  const daysUntil = (d: string) => Math.round((new Date(d).getTime() - new Date(TODAY).getTime()) / 86400000);

  const quickMatch = (b: B) => {
    const dd = daysUntil(b.openDate);
    if (quick === '开标≤7天') return dd >= 0 && dd <= 7 && !['中标', '未中标'].includes(b.stage);
    if (quick === '今日开标') return dd === 0;
    if (quick === '保未交/未退') return b.depositSt === '未交' || b.depositSt === '未退';
    if (quick === '证书满载') return b.certGot >= b.certNeed;
    if (quick === '待登记结果') return b.stage === '开标';
    return true;
  };

  /* G1：原 rows 派生自模块常量 BIDS，推进阶段 / 登记结果 / 保证金登记只 toast 不改数据，
     看板阶段列与统计永远不动。改为可写 state。 */
  const [bids, setBids] = useState(BIDS);

  /**
   * 跨页穿透：从商机 / 客户等页面下钻进来时，自动打开目标投标详情。
   * 以 nav（路由脉冲）为依赖，保证反复下钻也能重新定位。
   */
  useEffect(() => {
    const id = consumeFocus('bid');
    if (!id) return;
    const hit = BIDS.find((b) => b.id === id);
    if (hit) { setDetail(hit as B); setTab('overview'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav]);
  /** 投标单据回写 */
  const patchBid = (id: string, patch: Partial<B>, msg: string) => {
    setBids((bs) => bs.map((x) => (x.id === id ? ({ ...x, ...patch } as B) : x)));
    setDetail((d) => (d && d.id === id ? ({ ...d, ...patch } as B) : d));
    toast(msg);
  };
  const rows = useMemo(() => bids.filter((b) => {
    if (stage && b.stage !== stage) return false;
    if (owner && b.owner !== owner) return false;
    if (dep && b.depositSt !== dep) return false;
    if (kw && !(b.id + b.name + b.customer).includes(kw)) return false;
    return quickMatch(b);
  }), [stage, owner, dep, kw, quick]);

  const paged = rows.slice((page - 1) * pageSize, page * pageSize);

  // 建造师三要素校验（硬拦截）
  const builderCheck = (b: B) => {
    const builder = CERTS.find((c) => c.isBuilder && c.holder === b.projMgr);
    const okValid = !!builder && builder.validTo >= TODAY;
    const okB = b.pmB === '有效';
    const okBusy = !b.pmBusy;
    return { okValid, okB, okBusy, pass: okValid && okB && okBusy, builder };
  };

  const advance = (b: B) => {
    if (b.stage === '开标') { setResultOpen(b); setWinAmt(b.amt); return; }
    const seq = BID_STAGES as readonly string[];
    const i = seq.indexOf(b.stage);
    const next = i >= 0 && i < seq.indexOf('开标') ? seq[i + 1] : b.stage;
    if (next === b.stage) { toast('当前阶段需通过「登记开标结果」推进'); return; }
    patchBid(b.id, { stage: next as B['stage'] }, `${b.id} 阶段已推进：${b.stage} → ${next}（开标当日锁定不可回退）`);
  };

  const cols = [
    {
      key: 'id', title: '投标编号', width: 110,
      render: (b: B) => (
        <div className="nc-cell-main">
          {/* 编号可点击 → 蓝色，点击打开本行详情（与整行点击一致，全站统一） */}
          <IdCell onClick={() => { setDetail(b); setTab('overview'); }} title="查看投标详情">{b.id}</IdCell>
          {b.opp && <div className="nc-cell-sub">商机 {b.opp}</div>}
        </div>
      ),
    },
    {
      key: 'name', title: '项目 / 客户', width: 240,
      render: (b: B) => (<div className="nc-cell-main"><div>{b.name}</div><div className="nc-cell-sub">{b.customer}</div></div>),
    },
    { key: 'amt', title: '预估金额', width: 110, align: 'right' as const, render: (b: B) => <b className="num"><Money v={b.amt} role={role} wan /></b> },
    { key: 'stage', title: '阶段', width: 96, render: (b: B) => <Tag tone={ST_TONE[b.stage]}>{b.stage}</Tag> },
    {
      key: 'deposit', title: '保证金', width: 130,
      render: (b: B) => <span><Tag tone={DEP_TONE[b.depositSt]}>{b.depositSt}</Tag> <Money v={b.deposit} role={role} wan className="nc-cell-sub" /></span>,
    },
    {
      key: 'openDate', title: '开标时间', width: 170,
      render: (b: B) => {
        const d = daysUntil(b.openDate);
        const done = ['中标', '未中标'].includes(b.stage);
        return (
          <span className="nc-cell-main">
            <span>{b.openDate}</span>
            {d === 0 && !done && <Tag tone="red">今日开标</Tag>}
            {d > 0 && !done && <Tag tone={d <= 3 ? 'red' : d <= 7 ? 'orange' : 'gray'}>开标 +{d} 天</Tag>}
          </span>
        );
      },
    },
    { key: 'owner', title: '负责人', width: 76 },
    {
      /* 操作列收口：每行恒定 3 个槽位 —— ① 当前阶段的主操作（终态留占位）② 详情 ③ 更多 ⋯。
         原实现按数据可用性逐个拼装（2~4 个不等、顺序也随阶段漂移），竖着扫视时按钮位置对不齐；
         现将「编辑 / 流转 / 保证金登记 / 证书池」统一收进「更多 ⋯」，槽位数与位置行行一致。 */
      key: 'op', title: '操作', width: 200, align: 'right' as const,
      render: (b: B) => {
        const flow: OpMoreItem[] = [];
        if (!['中标', '未中标'].includes(b.stage)) flow.push({ label: b.stage === '开标' ? '登记开标结果' : `推进阶段（${b.stage} → 下一步）`, onClick: () => advance(b) });
        if (b.depositSt === '未交' || b.depositSt === '未退') flow.push({ label: b.depositSt === '未交' ? '登记保证金已交' : '解除 / 登记已退', onClick: () => { setDepAmt(b.deposit); setDepOpen(b); } });
        flow.push({ label: '证书池选择', onClick: () => setPoolOpen(true) });
        flow.push({ label: '编辑', onClick: () => toast('已打开编辑表单（字段与发起投标向导一致）') });
        const terminal = ['中标', '未中标'].includes(b.stage);
        return (
          <div className="nc-ops" onClick={(e) => e.stopPropagation()}>
            {b.stage === '开标'
              ? <Btn size="sm" kind="primary" onClick={() => { setResultOpen(b); setWinAmt(b.amt); }}>登记结果</Btn>
              : terminal
                ? <OpNone title="已登记结果（终态），无待办操作" />
                : <Op onClick={() => advance(b)}>推进</Op>}
            <Op onClick={() => { setDetail(b); setTab('overview'); }}>详情</Op>
            <OpMore items={flow} />
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHead
        title="投标管理"
        sub={`共 ${bids.length} 项 · 进行中 ${bids.filter((b) => !['中标', '未中标'].includes(b.stage)).length} 项`}
        actions={<>
          <div className="nc-seg">
            <button className={`nc-seg-btn${view === 'kanban' ? ' is-on' : ''}`} onClick={() => setView('kanban')}>▦ 看板</button>
            <button className={`nc-seg-btn${view === 'list' ? ' is-on' : ''}`} onClick={() => setView('list')}>≡ 列表</button>
          </div>
          <Btn onClick={() => toast('已导出 CSVT-投标台账（UTF-8 BOM）')}>导出 CSV</Btn>
          <Btn kind="primary" onClick={() => { setWizStep(0); setWizOpen(true); }}>＋ 发起投标</Btn>
        </>}
      />

      {/* 投标概览 5 卡（简化：值 + 标签，点击即筛选；明细与风险下沉到详情抽屉） */}
      {(() => {
        const total = bids.length;
        const doing = bids.filter((b) => !['中标', '未中标'].includes(b.stage)).length;
        const pending = bids.filter((b) => b.stage === '开标').length;
        const soon = bids.filter((b) => { const d = daysUntil(b.openDate); return !['中标', '未中标'].includes(b.stage) && d >= 0 && d <= 7; }).length;
        const w = bids.filter((b) => b.stage === '中标').length;
        const l = bids.filter((b) => b.stage === '未中标').length;
        const rate = (w + l) ? Math.round(w / (w + l) * 100) : null;
        return (
          <div className="nc-tiles nc-tiles-5">
            <div className="nc-tile is-clickable" onClick={() => { setQuick('全部'); setStage(''); setPage(1); }} {...pressProps(() => { setQuick('全部'); setStage(''); setPage(1); })}>
              <div className="nc-tile-value">{total}</div>
              <div className="nc-tile-label">全部投标</div>
            </div>
            <div className="nc-tile is-clickable" onClick={() => { setQuick('全部'); setStage(''); setDep(''); setKw(''); setOwner(''); setPage(1); }} {...pressProps(() => { setQuick('全部'); setStage(''); setDep(''); setKw(''); setOwner(''); setPage(1); })}>
              <div className="nc-tile-value nc-v-blue">{doing}</div>
              <div className="nc-tile-label">进行中</div>
            </div>
            <div className="nc-tile is-clickable" onClick={() => { setQuick('待登记结果'); setPage(1); }} {...pressProps(() => { setQuick('待登记结果'); setPage(1); })}>
              <div className="nc-tile-value nc-v-orange">{pending}</div>
              <div className="nc-tile-label">待登记结果</div>
            </div>
            <div className="nc-tile is-clickable" onClick={() => { setQuick('开标≤7天'); setPage(1); }} {...pressProps(() => { setQuick('开标≤7天'); setPage(1); })}>
              <div className="nc-tile-value nc-v-orange">{soon}</div>
              <div className="nc-tile-label">临近开标 ≤7 天</div>
            </div>
            <div className="nc-tile">
              <div className="nc-tile-value nc-v-green">{rate === null ? '—' : `${rate}%`} <small style={{ fontSize: 13, color: 'var(--ink-3)', marginLeft: 3 }}>中标 {w} / 未中标 {l}</small></div>
              <div className="nc-tile-label">中标率</div>
            </div>
          </div>
        );
      })()}

      {view === 'list' ? (
        <Card flush>
          {/* 工具条：搜索 + 3 下拉 + 右侧快捷 chips */}
          <div className="nc-ctbar" style={{ padding: '10px 12px', borderBottom: '1px solid var(--c-hairline)' }}>
            <input
              className="nc-input nc-ct-search" value={kw} placeholder="搜索编号 / 项目 / 客户"
              onChange={(e) => { setKw(e.target.value); setPage(1); }}
            />
            <select className="nc-input" style={{ width: 120 }} value={stage} onChange={(e) => { setStage(e.target.value); setPage(1); }}>
              <option value="">全部阶段</option>
              {BID_STAGES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <select className="nc-input" style={{ width: 120 }} value={owner} onChange={(e) => { setOwner(e.target.value); setPage(1); }}>
              <option value="">全部负责人</option>{['李强', '蓝峰', '王志海', '赵薇', '周斌'].map((o) => <option key={o}>{o}</option>)}
            </select>
            <select className="nc-input" style={{ width: 130 }} value={dep} onChange={(e) => { setDep(e.target.value); setPage(1); }}>
              <option value="">保证金全部状态</option>{['未交', '已交', '未退', '已退', '未涉及'].map((d) => <option key={d}>{d}</option>)}
            </select>
            <div className="nc-ctchips">
              {QUICKS.map((q) => (
                <button key={q} className={`nc-fchip${quick === q ? ' is-on' : ''}`} onClick={() => { setQuick(q); setPage(1); }}>
                  {q === '开标≤7天' && <Ico n="bell" size={12} />} {q}
                </button>
              ))}
            </div>
          </div>
          <DataTable
            cols={cols} rows={paged} rowKey={(b) => b.id} minWidth={1120}
            empty="没有符合筛选条件的投标项目；投标可由中标商机一键发起，也可在投标看板独立新建"
            /* 条目背景色统一：不再整行铺黄底 / 红底（会压过行悬停反馈，且与「整行选中」的视觉冲突）。
               风险与临近信息仍由行内标签承载：保证金状态、开标倒计时、证书缺口。 */
            onRowClick={(b) => { setDetail(b); setTab('overview'); }}
            foot={<TableFoot total={bids.length} filtered={rows.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} extra={<span className="nc-cell-sub"> ｜ 行点击打开详情 · <Op onClick={() => setLedgerOpen(true)}>保证金台账</Op></span>} />}
          />
        </Card>
      ) : (
        <>
          {/* 评审 P0-5：原文案宣称「卡片可拖拽推进」，但代码并无拖拽实现 —— 属虚假引导，已改为真实可达的交互说明 */}
          <div className="nc-listhint nc-kanban-hint">看板列 = 投标阶段，共 {BID_STAGES.length} 个阶段，由左至右推进。<Tip text="点击卡片打开投标详情，在详情内推进阶段；窄屏下横向滑动查看全部阶段。" /></div>
          <div className="nc-kanban">
            {BID_STAGES.map((s) => {
              const cs = bids.filter((b) => b.stage === s);
              return (
                <div key={s} className="nc-kb-col">
                  <div className="nc-kb-hd"><span>{s}</span><span className="nc-kb-cnt num">{cs.length}</span></div>
                  <div className="nc-kb-bd">
                    {cs.map((b) => {
                      const d = daysUntil(b.openDate);
                      return (
                        /* P0-5：原为 div+onClick，键盘不可达；改用原生 button 后 Tab / Enter 可用 */
                        <button
                          key={b.id}
                          type="button"
                          className="nc-kb-card"
                          title={`${b.name} · 查看详情并推进阶段`}
                          onClick={() => { setDetail(b); setTab('overview'); }}
                        >
                          <Code>{b.id}</Code>
                          <div className="nc-kb-name">{b.name}</div>
                          <div className="nc-kb-amt"><Money v={b.amt} role={role} wan /></div>
                          <div className="nc-kb-meta">
                            <Tag tone={DEP_TONE[b.depositSt]}>保证金{b.depositSt}</Tag>
                            {b.certGot < b.certNeed && <Tag tone="red">证书 {b.certGot}/{b.certNeed} 不足</Tag>}
                          </div>
                          {!['中标', '未中标'].includes(b.stage) && (
                            <div className={`nc-kb-days${d < 0 ? '' : d <= 3 ? ' is-red' : d <= 7 ? ' is-orange' : ''}`}>
                              开标 {b.openDate}{d >= 0 ? ` · 剩 ${d} 天` : ' · 已开标'}
                            </div>
                          )}
                        </button>
                      );
                    })}
                    {!cs.length && <div className="nc-kb-empty">/</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ================= 详情抽屉 ================= */}
      <Drawer
        open={!!detail} onClose={() => setDetail(null)} width={720}
        title={<span>投标详情 {detail && <Code>{detail.id}</Code>} {detail && <Tag tone={ST_TONE[detail.stage]}>{detail.stage}</Tag>}</span>}
        sub={detail && <>{detail.name} · {detail.customer} · {fmtWan(detail.amt)} · 负责人 {detail.owner} · 开标 {detail.openDate}</>}
        foot={detail && (
          <div className="nc-ops">
            {!['中标', '未中标'].includes(detail.stage) && <Btn kind="primary" size="sm" onClick={() => advance(detail)}>{detail.stage === '开标' ? '登记开标结果' : '推进阶段'}</Btn>}
            {detail.stage === '开标' && <Btn size="sm" danger onClick={() => setRiskOpen(true)}>提交登记（风险确认）</Btn>}
            {detail.stage === '中标' && <>
              <Btn kind="primary" size="sm" onClick={() => {
                setPendingContract({ bidId: detail.id, customer: detail.customer, name: detail.name, amt: detail.amt });
                setDetail(null); go('contract-new');
              }}>中标 → 生成合同</Btn>
              <Btn size="sm" onClick={() => { setDetail(null); go('project-new'); }}>补建项目（无合同场景）</Btn>
            </>}
            {(detail.depositSt === '未交' || detail.depositSt === '未退') && (
              <Btn size="sm" onClick={() => { setDepAmt(detail.deposit); setDepOpen(detail); }}>
                {detail.depositSt === '未交' ? '登记保证金已交' : '解除 / 登记已退'}
              </Btn>
            )}
            <Btn size="sm" onClick={() => setPoolOpen(true)}>证书池选择</Btn>
            <Btn size="sm" onClick={() => toast('已一键打包：中标通知书 + 合同 + 验收证明（按业绩组合）')}>一键打包业绩</Btn>
          </div>
        )}
      >
        {detail && (() => {
          const bc = builderCheck(detail);
          const d = daysUntil(detail.openDate);
          const locked = ['已投标', '开标'].includes(detail.stage);
          return (
            <>
              {/* 问题条：红/橙/金三级 */}
              <div className="nc-issues">
                {detail.certGot < detail.certNeed && <div className="nc-issue is-red"><Ico n="ban" size={16} /> 证书硬缺口 {detail.certNeed - detail.certGot} 本 —— 开标资格审查将废标</div>}
                {!bc.pass && <div className="nc-issue is-red"><Ico n="ban" size={16} /> 建造师三要素不通过：{!bc.okValid ? '建造师证书过期/缺失' : !bc.okB ? '同人 B 证无效' : '存在在建项目'}</div>}
                {detail.depositSt === '未退' && <div className="nc-issue is-orange"><Ico n="warning" size={16} /> 保证金 {fmtWan(detail.deposit)} 未退（已 {Math.abs(d)} 天）</div>}
                {d >= 0 && d <= 7 && !['中标', '未中标'].includes(detail.stage) && <div className="nc-issue is-gold"><Ico n="bell" size={16} /> 开标临近：剩 {d} 天（{detail.openDate}）</div>}
                {!detail.certGot || detail.certGot >= detail.certNeed ? null : null}
                {bc.pass && detail.depositSt !== '未退' && !(d >= 0 && d <= 7) && detail.certGot >= detail.certNeed && <div className="nc-issue is-ok"><Ico n="check" size={16} /> 资格预检通过：证书齐备 · 建造师三要素通过 · 保证金正常</div>}
              </div>

              {/* 8 阶段长条：抽屉宽度有限，改用紧凑模式 —— 去掉序号与节点最小宽度，一行铺满，
                  只保留核心进行（已完成 = 蓝色 ✓ / 当前 = 蓝色 / 待办 = 灰色），不再折成两行。 */}
              <ChainBar compact nodes={BID_STAGES.map((s) => {
                const cur = (BID_STAGES as readonly string[]).indexOf(detail.stage);
                const idx = (BID_STAGES as readonly string[]).indexOf(s);
                const state = detail.stage === '未中标' && s === '未中标' ? 'rejected' : idx < cur ? 'done' : idx === cur ? 'cur' : 'todo';
                return { label: s, state: state as 'done' | 'cur' | 'todo' | 'rejected' };
              })} />

              <Tabs
                items={[
                  { key: 'overview', label: '概览' },
                  { key: 'cert', label: '引用证书 ' + picked.length },
                  { key: 'log', label: '跟进记录 ' + followsOf(detail).length },
                  { key: 'ops', label: '操作记录 ' + opsOf(detail).length },
                ]}
                value={tab} onChange={setTab}
              />

              {tab === 'overview' && (
                <>
                  <KvGrid cols={2} rows={[
                    { k: '投标编号', v: <Code>{detail.id}</Code> },
                    { k: '阶段', v: <Tag tone={ST_TONE[detail.stage]}>{detail.stage}</Tag> },
                    { k: '项目名称', v: detail.name },
                    { k: '客户', v: <EntityLink target="customer" id={detail.customerId} go={go} title="下钻到客户档案">{detail.customer}</EntityLink> },
                    { k: '预估金额', v: <Money v={detail.amt} role={role} /> },
                    { k: '保证金', v: <><Money v={detail.deposit} role={role} wan /> · {detail.depositSt}</> },
                    { k: '开标时间', v: `${detail.openDate}（${d >= 0 ? '剩 ' + d + ' 天' : '已开标'}）` },
                    { k: '负责人', v: detail.owner },
                    { k: '拟派项目经理', v: detail.projMgr },
                    { k: '证书占用', v: <span className={detail.certGot < detail.certNeed ? 'is-red' : ''}>{detail.certGot}/{detail.certNeed}{detail.certGot < detail.certNeed ? <><Ico n="warning" size={12} style={{ color: 'var(--c-warning-mid)' }} /> 缺口 {detail.certNeed - detail.certGot}</> : null}</span> },
                    { k: '证书引用状态', v: locked ? <Tag tone="red">已锁定（{detail.stage} 后不可移除）</Tag> : <Tag tone="green">可增删（做标书前）</Tag> },
                    { k: '风险提示', v: detail.risk || '/' },
                  ]} />

                  <div className="nc-sec-title">建造师三要素校验</div>
                  <div className={`nc-warnbox ${bc.pass ? 'is-green' : 'is-red'}`}>
                    <div className="nc-warnbox-hd">{bc.pass ? ' 三要素全部满足，可担任本项目经理' : ' 三要素不满足，不可提交投标文件'}</div>
                    <ul className="nc-check-list">
                      <li>{bc.okValid ? <Ico n="check" size={13} style={{ color: 'var(--c-success-deep)' }} /> : <Ico n="ban" size={13} style={{ color: 'var(--c-danger)' }} />} 建造师证书有效{bc.builder ? `（${bc.builder.name} · 有效期至 ${bc.builder.validTo}）` : '（未找到该建造师证书）'}</li>
                      <li>{bc.okB ? <Ico n="check" size={13} style={{ color: 'var(--c-success-deep)' }} /> : <Ico n="ban" size={13} style={{ color: 'var(--c-danger)' }} />} 同人 B 证有效（当前：{detail.pmB}）</li>
                      <li>{bc.okBusy ? <Ico n="check" size={13} style={{ color: 'var(--c-success-deep)' }} /> : <Ico n="ban" size={13} style={{ color: 'var(--c-danger)' }} />} 无在建项目（当前：{detail.pmBusy ? '存在在建项目' : '无在建'}）</li>
                    </ul>
                  </div>

                  <div className="nc-sec-title">保证金流转</div>
                  <Timeline items={[
                    { date: detail.openDate > TODAY ? TODAY : detail.openDate, text: `保证金 ${fmtWan(detail.deposit)} · 当前状态「${detail.depositSt}」`, tone: detail.depositSt === '未退' ? 'red' : detail.depositSt === '已退' ? 'ok' : 'gray' },
                    ...(detail.depositSt === '未交' ? [{ date: TODAY, text: '待缴纳（保证金未交不可进入「已投标」）', tone: 'gold' as const }] : []),
                    ...(detail.depositSt === '未退' ? [{ date: TODAY, text: `已超 30 天未退，请跟进招标代理机构（保证金独立流转）`, tone: 'red' as const }] : []),
                  ]} />
                </>
              )}

              {tab === 'cert' && (
                <>
                  {locked && <Banner tone="warn"><Ico n="ban" size={16} /> 当前阶段证书引用已锁定，不可移除（{detail.stage} 后锁定）。如需变更请联系商务负责人走变更流程。</Banner>}
                  <div className="nc-sec-title">引用证书（配额 {detail.certGot}/{detail.certNeed}）</div>
                  <Progress value={(detail.certGot / detail.certNeed) * 100} tone={detail.certGot >= detail.certNeed ? 'green' : detail.certGot >= detail.certNeed - 1 ? 'orange' : 'red'} />
                  <table className="nc-tbl" style={{ minWidth: 640 }}>
                    <thead><tr><th>证书名称</th><th style={{ width: 100 }}>占用方式</th><th style={{ width: 100 }}>持有人</th><th style={{ width: 110 }}>有效期至</th><th style={{ width: 90 }} className="is-center">移除</th></tr></thead>
                    <tbody>
                      {CERTS.slice(0, detail.certGot).map((c) => (
                        <tr key={c.id}>
                          <td>{c.name}<div className="nc-cell-sub"><Code>{c.id}</Code></div></td>
                          <td><Tag tone={c.mode === 'single' ? 'red' : c.mode === 'multi' ? 'blue' : 'gray'}>{CERT_MODE_LABEL[c.mode]}</Tag></td>
                          <td>{c.holder}</td>
                          <td className={c.validTo < TODAY ? 'is-red' : c.warnDays ? 'is-orange' : ''}>{c.validTo}</td>
                          <td className="is-center">{locked ? <Op disabled title="该证书正被项目占用，须先在证书台账「用完收回」后才能移除引用">锁定</Op> : <Op danger onClick={() => setUnrefOpen(c)}>移除</Op>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {detail.certNeed > detail.certGot && (
                    <div className="nc-warnbox is-red">
                      <div className="nc-warnbox-hd"><Ico n="ban" size={16} /> 证书硬缺口 {detail.certNeed - detail.certGot} 本</div>
                      开标资格审查将废标，请立即补配或走提额流程。
                      <div className="nc-ops" style={{ marginTop: 8 }}>
                        <Btn size="sm" kind="primary" onClick={() => setPoolOpen(true)}>从证书池补配</Btn>
                        <Btn size="sm" onClick={() => toast('提额申请已发起（超出并行占用上限）')}>申请提额</Btn>
                      </div>
                    </div>
                  )}
                  {picked.some((id) => CERTS.find((c) => c.id === id)?.mode === 'log') && (
                    <div className="nc-warnbox is-gold">
                      <Ico n="check" size={14} style={{ color: 'var(--c-success-deep)' }} /> 已引用「按次登记」类证书（电工证 / 焊工证等），请在下方登记使用人
                    </div>
                  )}
                </>
              )}

              {tab === 'log' && (
                <>
                  <div className="nc-sec-title" style={{ marginBottom: 12 }}>
                    跟进记录（人工登记）
                    <span className="nc-hint" style={{ fontWeight: 400, marginLeft: 8 }}>仅记录人工跟进动作；提交后不可改，错误走「更正」</span>
                  </div>
                  <Timeline items={followsOf(detail).map((f) => ({
                    date: f.date, tone: 'ok' as const, text: <>{f.text} <span className="nc-hint">· {f.by}</span></>,
                  }))} />
                  <Btn size="sm" onClick={() => { setFollowText(''); setFollowOpen(true); }}>＋ 登记跟进</Btn>
                </>
              )}

              {tab === 'ops' && (
                <>
                  <div className="nc-sec-title" style={{ marginBottom: 12 }}>
                    操作记录（系统自动生成）
                    <span className="nc-hint" style={{ fontWeight: 400, marginLeft: 8 }}>流转 / 引用 / 保证金等系统动作自动留痕，不可编辑或删除</span>
                  </div>
                  <Timeline items={opsOf(detail).map((o) => ({
                    date: o.date,
                    tone: o.by === '系统' ? 'gray' as const : o.text.includes('中标') ? 'ok' as const : 'gold' as const,
                    text: <>{o.text} <span className="nc-hint">· {o.by}</span></>,
                  }))} />
                </>
              )}
            </>
          );
        })()}
      </Drawer>

      {/* ================= 发起投标向导 ================= */}
      <Modal open={wizOpen} onClose={() => setWizOpen(false)} width={720} title="发起投标"
        foot={<>
          {wizStep > 0 && <Btn onClick={() => setWizStep(wizStep - 1)}>上一步</Btn>}
          {wizStep < 2
            ? <Btn kind="primary" onClick={() => setWizStep(wizStep + 1)}>下一步</Btn>
            : <Btn kind="primary" onClick={() => { toast('投标已创建（报名阶段）· 证书预检通过 3/4'); setWizOpen(false); }}>确认发起</Btn>}
        </>}>
        <div className="nc-steps-wrap">
          <ChainBar nodes={[
            { label: '① 基础信息', sub: '商机带出', state: wizStep === 0 ? 'cur' : 'done' },
            { label: '② 保证金', sub: '金额/状态', state: wizStep === 1 ? 'cur' : wizStep > 1 ? 'done' : 'todo' },
            { label: '③ 证书预检', sub: '缺口校验', state: wizStep === 2 ? 'cur' : 'todo' },
          ]} />
        </div>
        {wizStep === 0 && (
          <>
            <div className="nc-form-grid">
              <Field label="项目名称" req span={2}><input className="nc-input" defaultValue="云南××中学消防改造" /></Field>
              <Field label="客户" req><select className="nc-input"><option>××市教育局</option><option>昆明万达广场商业管理有限公司</option></select></Field>
              <Field label="关联商机" note="建议从商机发起：中标结果自动回写商机漏斗"><select className="nc-input"><option>SJ000470 · 一院住院楼消防升级</option><option value="">暂不关联</option></select></Field>
              <Field label="预估金额" req note="必须 &gt; 0">
                <input className="nc-input" type="number" value={wAmt || ''} onChange={(e) => setWAmt(Number(e.target.value))} />
              </Field>
              <Field label="税率口径" req note="6 档 · 税额自动计算">
                <select className="nc-input" value={wTax} onChange={(e) => setWTax(e.target.value)}>
                  {TAX.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="税额（自动）" note="不可手工修改">
                <input className="nc-input is-locked" readOnly value={(() => {
                  const t = taxAmt(wAmt, wTax);
                  return t === null ? '选择税率口径后自动计算' : fmt(Math.round(t));
                })()} />
              </Field>
              <Field label="开标时间" req note="不能早于今天">
                <input className="nc-input" type="date" value={wOpen} onChange={(e) => setWOpen(e.target.value)} />
              </Field>
              <Field label="负责人" req><select className="nc-input"><option>李强</option><option>蓝峰</option><option>赵薇</option></select></Field>
            </div>
            {taxAmt(wAmt, wTax) !== null && (
              <div className="nc-dnote" style={{ marginTop: 12 }}>
                按「{TAX.find((t) => t.v === wTax)?.label}」计算：金额 {fmt(wAmt)} → 税额 <b className="num">{fmt(Math.round(taxAmt(wAmt, wTax)!))}</b>
                （{TAX.find((t) => t.v === wTax)?.mode === 'in' ? '含税：总额 × 税率 ÷ (100+税率)' : '不含税：总额 × 税率 ÷ 100'}）
              </div>
            )}
          </>
        )}
        {wizStep === 1 && (
          <div className="nc-form-grid">
            <Field label="是否涉及保证金" req><select className="nc-input"><option>涉及</option><option>不涉及</option></select></Field>
            <Field label="保证金金额"><input className="nc-input" type="number" defaultValue={50000} /></Field>
            <Field label="缴纳方式" req note="银行转账 / 银行保函 / 保证保险">
              <select className="nc-input">{DEP_METHODS.map((m) => <option key={m}>{m}</option>)}</select>
            </Field>
            <Field label="计划缴纳日" req note="须早于开标日"><input className="nc-input" type="date" defaultValue="2026-09-20" /></Field>
            <Field label="预计退还日" span={2}><input className="nc-input" type="date" defaultValue="2026-10-25" /></Field>
          </div>
        )}
        {wizStep === 2 && (
          <>
            <Banner tone="info">证书配额逐行预检：按行选择证书类型与数量（1~5），系统校验有效期与并行占用；含硬缺口时提交须确认废标风险。</Banner>
            <table className="nc-tbl" style={{ minWidth: 660 }}>
              <thead>
                <tr>
                  <th>证书类型</th>
                  <th style={{ width: 100 }}>数量</th>
                  <th style={{ width: 150 }}>预检结果</th>
                  <th>说明</th>
                  <th style={{ width: 56 }}></th>
                </tr>
              </thead>
              <tbody>
                {wCertLines.map((l, i) => {
                  const pk = precheck(l, wOpen);
                  const tone = pk.lv === 'ok' ? 'green' : pk.lv === 'warn' ? 'orange' : pk.lv === 'bad' ? 'red' : 'gray';
                  return (
                    <tr key={i}>
                      <td>
                        <select className="nc-cell-in" style={{ width: '100%' }} value={l.t}
                          onChange={(e) => setWCertLines((ls) => ls.map((x, j) => j === i ? { ...x, t: e.target.value } : x))}>
                          <option value="">请选择</option>
                          {CERT_LINE_TYPES.map((c) => <option key={c.v} value={c.v}>{c.n}</option>)}
                        </select>
                      </td>
                      <td>
                        <input className="nc-cell-in" style={{ width: 64, textAlign: 'center' }} type="number" min={1} max={5} value={l.q}
                          onChange={(e) => setWCertLines((ls) => ls.map((x, j) => j === i ? { ...x, q: Math.min(5, Math.max(1, Number(e.target.value) || 1)) } : x))} />
                      </td>
                      <td><Tag tone={tone}>{pk.head}</Tag></td>
                      <td><span className="nc-cell-sub">{pk.detail || '—'}</span></td>
                      <td><span className="nc-ops"><Op danger onClick={() => setWCertLines((ls) => ls.filter((_, j) => j !== i))}><Ico n="close" size={16} /></Op></span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <Btn size="sm" onClick={() => setWCertLines((ls) => [...ls, { t: '', q: 1 }])}>＋ 添加证书行</Btn>
            {(() => {
              const bads = wCertLines.filter((l) => l.t && precheck(l, wOpen).lv === 'bad');
              const warns = wCertLines.filter((l) => l.t && precheck(l, wOpen).lv === 'warn');
              return bads.length
                ? <div className="nc-warnbox is-red" style={{ marginTop: 12 }}>
                  <b><Ico n="ban" size={16} /> 含 {bads.length} 项证书硬缺口，开标资格审查将废标</b>
                  <div>{bads.map((l) => CERT_LINE_TYPES.find((c) => c.v === l.t)?.n).join('、')} —— 请补配、换人或走提额流程。</div>
                </div>
                : <div className="nc-warnbox is-gold" style={{ marginTop: 12 }}>
                  <Ico n="check" size={14} style={{ color: 'var(--c-success-deep)' }} /> 预检通过 {wCertLines.filter((l) => l.t && precheck(l, wOpen).lv === 'ok').length} / {wCertLines.filter((l) => l.t).length}
                  {warns.length ? ` · ${warns.length} 项部分缺口（可继续创建后处理）` : ' · 全部满足'}
                </div>;
            })()}
          </>
        )}
      </Modal>

      {/* ================= 证书池选择器 ================= */}
      <Drawer open={poolOpen} onClose={() => setPoolOpen(false)} width={780} title="证书池选择" sub="不可用证书置灰并显示原因；过期 / 超上限不可选"
        foot={<><Btn onClick={() => setPoolOpen(false)}>取消</Btn><Btn kind="primary" onClick={() => { toast(`已引用 ${picked.length} 本证书，并行占用 +${picked.length}`); setPoolOpen(false); }}>确认引用（{picked.length}）</Btn></>}>
        <Banner tone="warn"><Ico n="ban" size={16} /> 硬拦截：过期证书不可引用 · 超出并行占用上限不可引用 · 已投标/开标后引用锁定不可移除。</Banner>
        <table className="nc-tbl" style={{ minWidth: 740 }}>
          <thead><tr><th style={{ width: 44 }} /><th>证书名称 / 编号</th><th style={{ width: 110 }}>占用方式</th><th style={{ width: 100 }}>持有人</th><th style={{ width: 110 }}>有效期至</th><th style={{ width: 90 }} className="is-num">占用</th></tr></thead>
          <tbody>
            {CERTS.map((c) => {
              const expired = c.validTo < TODAY;
              const full = c.mode === 'single' && c.used.length >= c.cap;
              const dis = expired || full;
              const why = expired ? '已过期' : full ? `已达并行占用上限（${c.used.length}/${c.cap}）` : '';
              return (
                <tr key={c.id} className={dis ? 'is-muted' : ''}>
                  <td>
                    <input type="checkbox" className="nc-check" disabled={dis} checked={picked.includes(c.id)}
                      onChange={() => setPicked((p) => (p.includes(c.id) ? p.filter((x) => x !== c.id) : [...p, c.id]))} />
                  </td>
                  <td>
                    {c.name}
                    <div className="nc-cell-sub"><Code>{c.id}</Code> · {c.issue}{dis && <span className="is-red"> · <Ico n="ban" size={12} /> {why}</span>}</div>
                    {c.mode === 'log' && picked.includes(c.id) && (
                      <div className="nc-pick-row">
                        <input className="nc-cell-in" placeholder="请输入使用人（按次登记必填）" value={useText[c.id] || ''} onChange={(e) => setUseText((p) => ({ ...p, [c.id]: e.target.value }))} />
                      </div>
                    )}
                    {c.mode === 'single' && full && <div className="nc-cell-sub is-red">占用明细：{c.used.join('、')} · 可申请提额</div>}
                  </td>
                  <td><Tag tone={c.mode === 'single' ? 'red' : c.mode === 'multi' ? 'blue' : 'gray'}>{CERT_MODE_LABEL[c.mode]}</Tag></td>
                  <td>{c.holder}</td>
                  <td className={expired ? 'is-red' : c.warnDays ? 'is-orange' : ''}>{c.validTo}</td>
                  <td className="is-num">{c.used.length}/{c.cap === 99 ? '∞' : c.cap}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Drawer>

      {/* ================= 风险二次确认 ================= */}
      <Modal open={riskOpen} onClose={() => setRiskOpen(false)} width={600} title="证书硬缺口风险确认"
        foot={<><Btn onClick={() => setRiskOpen(false)}>取消</Btn><Btn danger disabled={!riskAck} title={riskAck ? undefined : '请先勾选「已知悉废标风险」后方可登记'} onClick={() => { toast('已提交登记（已知悉废标风险）'); setRiskOpen(false); setRiskAck(false); }}>确认提交</Btn></>}>
        <Banner tone="danger">存在证书硬缺口，开标资格审查将废标，请二次确认：</Banner>
        <Check checked={riskAck} onChange={setRiskAck} label="已知悉废标风险，仍要求提交登记" />
      </Modal>

      {/* ================= 结果登记 ================= */}
      <Modal open={!!resultOpen} onClose={() => setResultOpen(null)} width={620} title={`开标结果登记 · ${resultOpen?.id ?? ''}`}
        foot={<><Btn onClick={() => setResultOpen(null)}>取消</Btn><Btn kind="primary" onClick={() => {
          if (resultType === '废标 / 流标' && !loseText.trim()) { toast('废标 / 流标须填写情况说明（≤200 字）', 'err'); return; }
          if (resultType === '未中标' && (!loseReason || !loseText.trim())) { toast('未中标原因必选 + 说明 ≤200 字'); return; }
          if (!resultOpen) return;
          if (resultType === '中标') { patchBid(resultOpen.id, { stage: '中标', amt: winAmt > 0 ? winAmt : resultOpen.amt }, `已登记中标 ¥${(winAmt || resultOpen.amt).toLocaleString('en-US')} → 可生成项目 XM 编号（幂等防重）`); }
          else if (resultType === '废标 / 流标') { patchBid(resultOpen.id, { stage: '未中标' }, '已登记废标 / 流标 · 计入未中标，保证金进入待退流程'); }
          else { patchBid(resultOpen.id, { stage: '未中标' }, '已登记未中标 · 回写商机丢标原因'); }
          setResultOpen(null);
        }}>确认登记</Btn></>}>
        <Banner tone="info">结果强制登记：中标金额默认取投标金额可改；未中标原因必选枚举 + 说明 ≤200 字；废标 / 流标计入未中标并触发保证金退还。</Banner>
        <div className="nc-form-grid">
          <Field label="结果" req><select className="nc-input" value={resultType} onChange={(e) => setResultType(e.target.value)}>{RESULT_TYPES.map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="开标日期"><input className="nc-input" type="date" defaultValue={resultOpen?.openDate} /></Field>
          {resultType === '中标' && (
            <>
              <Field label="中标金额" req note="默认取投标金额，可改"><input className="nc-input" type="number" value={winAmt} onChange={(e) => setWinAmt(Number(e.target.value))} /></Field>
              <Field label="中标通知书"><input className="nc-input" type="file" /></Field>
            </>
          )}
          {resultType === '未中标' && (
            <Field label="未中标原因" req span={2}>
              <select className="nc-input" value={loseReason} onChange={(e) => setLoseReason(e.target.value)}>
                <option value="">请选择原因</option>
                <option>报价高于对手</option><option>技术标得分低</option><option>资质/证书不符</option>
                <option>业绩不足</option><option>客户关系因素</option><option>其他</option>
              </select>
            </Field>
          )}
          {(resultType === '未中标' || resultType === '废标 / 流标') && (
            <Field label={resultType === '废标 / 流标' ? '废标 / 流标说明' : '说明'} req span={2} note={`${loseText.length}/200 字`}>
              <textarea className="nc-input" rows={3} maxLength={200} value={loseText} onChange={(e) => setLoseText(e.target.value)}
                placeholder={resultType === '废标 / 流标' ? '如 三家投标均超最高限价，招标人流标（≤200 字）' : '补充说明（≤200 字）'} />
            </Field>
          )}
        </div>
      </Modal>

      {/* ================= 保证金登记（缴纳方式） ================= */}
      <Modal open={!!depOpen} onClose={() => setDepOpen(null)} width={560} title={`保证金登记 · ${depOpen?.id ?? ''}`}
        foot={<><Btn onClick={() => setDepOpen(null)}>取消</Btn>
          <Btn kind="primary" onClick={() => {
            if (!(depAmt > 0)) { toast('请填写保证金金额', 'err'); return; }
            if (!depOpen) return;
            const to = depOpen.depositSt === '未交' ? '已交' : '已退';
            patchBid(depOpen.id, { depositSt: to as B['depositSt'], deposit: depAmt }, `保证金已登记为「${to}」：${fmt(depAmt)}（${depMethod}）`);
            setDepOpen(null);
          }}>确认登记</Btn></>}>
        <Banner tone="info">
          保证金<b>独立流转</b>：缴纳 / 退还与投标阶段解耦，未交不可进入「已投标」，退还逾期（&gt;30 天）自动升级为红色风险。
        </Banner>
        <div className="nc-form-grid" style={{ marginTop: 12 }}>
          <Field label="保证金金额" req>
            <input className="nc-input" type="number" value={depAmt || ''} onChange={(e) => setDepAmt(Number(e.target.value))} />
          </Field>
          <Field label="登记动作" req>
            <select className="nc-input" defaultValue={depOpen?.depositSt === '未交' ? '已交' : '已退'}>
              <option>已交</option><option>已退</option>
            </select>
          </Field>
          <Field label="缴纳方式" req note="银行转账 / 银行保函 / 保证保险">
            <select className="nc-input" value={depMethod} onChange={(e) => setDepMethod(e.target.value)}>
              {DEP_METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="发生日期" req><input className="nc-input" type="date" defaultValue={TODAY} /></Field>
          <Field label="凭证编号" span={2} note="银行回单 / 保函编号 / 保单号"><input className="nc-input" placeholder="如 20260920-ICBC-008721" /></Field>
        </div>
      </Modal>

      {/* ================= 保证金台账 ================= */}
      <Drawer open={ledgerOpen} onClose={() => setLedgerOpen(false)} width={960} title="保证金台账"
        sub={<span>保证金台账<Tip w={340} text="独立流转：缴纳 → 占用 → 退还（解除）全链路；未退超 30 天自动升级红色风险。" /></span>}
        foot={<><Btn onClick={() => setLedgerOpen(false)}>关闭</Btn><Btn onClick={() => toast('保证金台账已导出（含缴纳方式 / 占用天数）')}>导出台账</Btn></>}>
        <div className="nc-stat4">
          {(['未交', '已交', '未退', '已退'] as const).map((s) => {
            const ls = bids.filter((b) => b.depositSt === s);
            return (
              <div className="nc-stat4-cell" key={s}>
                {s}（{ls.length} 笔）
                <b className="num">{fmtWan(ls.reduce((a, b) => a + b.deposit, 0))}</b>
              </div>
            );
          })}
        </div>
        <table className="nc-tbl" style={{ minWidth: 880 }}>
          <thead>
            <tr>
              <th style={{ width: 100 }}>投标编号</th><th>项目 / 客户</th>
              <th style={{ width: 110, textAlign: 'right' }}>保证金</th>
              <th style={{ width: 90 }}>状态</th>
              <th style={{ width: 100 }}>缴纳方式</th>
              <th style={{ width: 110 }}>开标日</th>
              <th style={{ width: 90 }}>占用天数</th>
              <th style={{ width: 100 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {bids.filter((b) => b.deposit > 0).map((b) => {
              const d = daysUntil(b.openDate);
              const held = d < 0 ? Math.abs(d) : 0;
              return (
                <tr key={b.id}>
                  <td><Code>{b.id}</Code></td>
                  <td>{b.name}<div className="nc-cell-sub">{b.customer}</div></td>
                  <td className="is-num"><b className="num"><Money v={b.deposit} role={role} /></b></td>
                  <td><Tag tone={DEP_TONE[b.depositSt]}>{b.depositSt}</Tag></td>
                  <td>{b.depositSt === '未交' ? '—' : DEP_METHODS[Number(b.id.slice(-1)) % 3]}</td>
                  <td className="num">{b.openDate}</td>
                  <td className={`num${held > 30 ? ' is-red' : ''}`}>{held || '—'}{held > 30 ? <> <Ico n="warning" size={12} style={{ color: 'var(--c-warning-mid)' }} /></> : null}</td>
                  <td>
                    <span className="nc-ops">
                      {b.depositSt === '未交'
                        ? <Op gold onClick={() => { setDepAmt(b.deposit); setDepOpen(b); setLedgerOpen(false); }}>登记已交</Op>
                        : b.depositSt === '未退'
                          ? <Op gold onClick={() => { setDepAmt(b.deposit); setDepOpen(b); setLedgerOpen(false); }}>解除 / 登记已退</Op>
                          : <Op disabled title="该整改单已闭环验收，无需重复处理（如需重开请联系项目经理）">已闭环</Op>}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="nc-tbl-sum">
              <td colSpan={2}>占用合计（未交 + 已交 + 未退）</td>
              <td className="is-num"><b className="num">{fmt(bids.filter((b) => b.depositSt !== '已退').reduce((a, b) => a + b.deposit, 0))}</b></td>
              <td colSpan={5} style={{ fontWeight: 400, color: 'var(--ink-3)' }}>
                未退 {bids.filter((b) => b.depositSt === '未退').length} 笔 · 其中超 30 天 {bids.filter((b) => b.depositSt === '未退' && daysUntil(b.openDate) < -30).length} 笔
              </td>
            </tr>
          </tfoot>
        </table>
      </Drawer>

      {/* ================= 登记跟进（人工） ================= */}
      <Modal open={followOpen} onClose={() => setFollowOpen(false)} width={560} title="登记跟进 · 人工记录"
        foot={<><Btn onClick={() => setFollowOpen(false)}>取消</Btn>
          <Btn kind="primary" onClick={() => {
            if (!followText.trim()) { toast('请填写跟进内容', 'err'); return; }
            setFollowOpen(false); toast('跟进已登记 · 提交后不可改，错误走「更正」');
          }}>提交跟进</Btn></>}>
        <Banner tone="info">跟进记录为<b>人工登记</b>，与系统自动生成的「操作记录」分离；提交后不可修改。</Banner>
        <div className="nc-form-grid" style={{ marginTop: 12 }}>
          <Field label="跟进方式" req><select className="nc-input"><option>电话</option><option>现场踏勘</option><option>会议</option><option>微信/邮件</option></select></Field>
          <Field label="跟进日期" req><input className="nc-input" type="date" defaultValue={TODAY} /></Field>
          <Field label="跟进内容" req span={2} note={`${followText.length}/500 字`}>
            <textarea className="nc-input" rows={3} maxLength={500} value={followText} onChange={(e) => setFollowText(e.target.value)} placeholder="如 与招标代理确认资格预审需补充安许副本" />
          </Field>
        </div>
      </Modal>

      {/* ============ 移除证书引用（评审 I1：二次确认 + 原因必填） ============ */}
      <ConfirmModal
        open={!!unrefOpen} onClose={() => setUnrefOpen(null)} okText="确认移除"
        title="移除投标证书引用"
        reason reasonLabel="移除原因"
        impact={unrefOpen && <>将解除 <b>{detail?.id} {detail?.name}</b> 对证书 <b>{unrefOpen.name}</b>（{unrefOpen.id}）的引用。<br />移除后该投标的<b>证书数量将低于资格审查要求</b>，开标资格审查存在废标风险，名额释放后可被其他投标占用。</>}
        onOk={(r) => { toast(`已移除证书引用（${unrefOpen?.name}）并留痕，原因：${r}`); setUnrefOpen(null); }}
      />
    </>
  );
}
