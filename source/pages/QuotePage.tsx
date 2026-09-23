// 报价台账（列表）—— 报价单总入口 · FR-OPP-003
// 状态机：草稿 → 待审批 → 已审批 → 已转化（终态）；旁支：作废
// 双触发规则：整体浮率 <15% 或 总额 ≥50 万 → 进审批；均未命中 → 免审通过
import React, { useEffect, useMemo, useState } from 'react';
import {
  Btn, Banner, Card, DataTable, Drawer, Field, IdCell, KvGrid, Modal, Money, Op, OpMore, OpNone,
  PageHead, ListToolbar, TableFoot, Tag, Timeline, Tip, useToast, ChainBar, Check, Code, Collapse, ConfirmModal, EntityLink,
} from '../components/ui';
import type { OpMoreItem } from '../components/ui';
import { QUOTE_STATUS, QUOTE_CATS, APPROVALS, CUSTOMERS, TODAY, approveLevel, calcTax, fmt, fmtWan, quoteTrigger } from '../components/data';
import type { Quote } from '../components/data';
import {
  addQuote, consumeFocus, getApprovals, getBids, getBizStatus, getOpps, getQuotes, patchQuote, pushApproval,
  setBizStatus, setFocus, setPendingQuote, subscribeStore,
} from '../components/store';
import { Ico } from '../components/icons';

const ST_TONE: Record<string, 'gray' | 'blue' | 'green' | 'red' | 'gold'> = {
  草稿: 'gray', 待审批: 'blue', 已审批: 'green', 已转化: 'gold', 作废: 'red', 审批中: 'blue',
};
type Q = Quote;

/** 报价单号：BJ + 6 位流水（取现有最大流水 + 1） */
const nextQuoteNo = () => {
  const max = getQuotes()
    .filter((q) => /^BJ\d{6}$/.test(q.id))
    .map((q) => Number(q.id.slice(2)))
    .reduce((a, b) => Math.max(a, b), 0);
  return `BJ${String(max + 1).padStart(6, '0')}`;
};

/** 生成报价审批单（提交审批 → 审批中心可见，形成正向闭环） */
const makeQuoteApproval = (ref: string, ver: string, obj: string, amt: number, level: string) => {
  const [y, m, d] = TODAY.split('-');
  return {
    id: `SP-${y}-${m}${d}-${String(getApprovals().length + 1).padStart(2, '0')}`,
    ap: '蓝峰', type: '报价审批', obj, ref: `${ref} 报价单 ${ver}`,
    amt, time: `${TODAY} 14:00`, status: '待审批',
    level: level === '—' ? '部门负责人' : level, node: 0, reason: '', cc: ['李思敏'],
  } as Parameters<typeof pushApproval>[0];
};

export default function QuotePage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  /* 报价台账读共享 store：新建 / 提交 / 撤回 / 作废后本列表即时刷新 */
  const [tick, setTick] = useState(0);
  useEffect(() => subscribeStore(() => setTick((n) => n + 1)), []);
  const quotes = useMemo(() => getQuotes(), [tick, nav]);
  /**
   * 状态口径：一律走审批回写覆盖层 getBizStatus(单号, 原状态)。
   * 修复前状态列 / 筛选 / 计数 / 操作分支读的是 data.ts 原值，审批中心通过后列表仍显示「待审批」，
   * 且 `q.status === '已审批'` 的「转合同」入口永远不出现 —— 报价 → 合同主线在 UI 上走不通。
   */
  const st = (q: Q) => getBizStatus(q.id, q.status);
  const [status, setStatus] = useState('全部');
  const [kw, setKw] = useState('');
  const [type, setType] = useState('');
  const [owner, setOwner] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detail, setDetail] = useState<Q | null>(null);
  /**
   * 跨页穿透：从客户 / 商机 / 投标等页面下钻进来时，自动打开目标报价单详情。
   * 以 nav（路由脉冲）为依赖，保证反复下钻同一页也能重新定位。
   */
  useEffect(() => {
    const id = consumeFocus('quote');
    if (!id) return;
    const hit = quotes.find((q) => q.id === id);
    if (hit) setDetail(hit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav]);
  const [newOpen, setNewOpen] = useState(false);
  const [libOpen, setLibOpen] = useState(false);
  const [integOpen, setIntegOpen] = useState(false);
  const [verOpen, setVerOpen] = useState<Q | null>(null);
  const [diffOpen, setDiffOpen] = useState(false);
  const [voidOpen, setVoidOpen] = useState<Q | null>(null);
  const [submitOpen, setSubmitOpen] = useState<Q | null>(null);
  const [reason, setReason] = useState('');
  // 新建表单
  const [fName, setFName] = useState('');
  const [fCustomer, setFCustomer] = useState('');
  const [fType, setFType] = useState('新建');
  const [fTax, setFTax] = useState('9');
  const [fOpp, setFOpp] = useState('');
  const [errs, setErrs] = useState<Record<string, string>>({});
  /* 客户 / 商机下拉一律读真实数据源：原先硬编码 6 个客户名 + 写死一条商机，
     新建的报价挂不到真实客户与商机上，下游「关联商机」列与漏斗回写全部失真。 */
  const custOptions = useMemo(() => CUSTOMERS.map((c) => ({ id: c.id, name: c.name })), []);
  const oppOptions = useMemo(
    () => getOpps().filter((o) => !['赢单', '输单'].includes(o.status)).map((o) => ({ id: o.id, name: o.name })),
    [tick, nav],
  );

  const counts = useMemo(() => {
    const m: Record<string, number> = { 全部: quotes.length };
    QUOTE_STATUS.forEach((s) => { m[s] = quotes.filter((q) => st(q) === s).length; });
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotes, tick]);

  const rows = useMemo(() => quotes.filter((q) => {
    if (status !== '全部' && st(q) !== status) return false;
    if (type && !q.name.includes(type) && !(type === '维护保养' && q.taxRate === 6)) return false;
    if (owner && q.owner !== owner) return false;
    if (kw) { const s = q.id + q.name + q.customer; if (!s.includes(kw)) return false; }
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [quotes, status, kw, type, owner, tick]);

  const paged = rows.slice((page - 1) * pageSize, page * pageSize);

  /* 概览统计（报价管理口径）—— 一律按状态覆盖层 st(q) 统计，与列表筛选结果保持一致 */
  const owners = [...new Set(quotes.map((q) => q.owner))];
  const ongoing = quotes.filter((q) => ['草稿', '待审批', '已审批'].includes(st(q)));
  const ongoingAmt = ongoing.reduce((s, q) => s + q.total, 0);
  const monthNew = quotes.filter((q) => q.update >= '2026-09-01').length;
  const winCnt = quotes.filter((q) => st(q) === '已转化').length;
  const winRate = quotes.length ? (winCnt / quotes.length) * 100 : 0;
  const inFlight = ongoing.length;

  // 双触发判定 —— 口径统一由 data.ts 的 quoteTrigger 提供（单一事实源），
  // 修正前此处为 markup < 15%，而报价工作台写的是 grossMarkup >= 30%，两者方向相反。
  const trig = (q: Q) => quoteTrigger(q, role).need;
  const trigText = (q: Q) => quoteTrigger(q, role).why;

  /** 提交审批（落库）：写状态 + 推审批单，保证审批中心能看到待办 */
  const submit = () => {
    if (!submitOpen) return;
    const e: Record<string, string> = {};
    if (!reason.trim()) e.reason = '变更原因必填';
    if (reason.length > 200) e.reason = '变更原因 ≤200 字';
    setErrs(e);
    if (Object.keys(e).length) return;
    const q = submitOpen;
    const lvl = trig(q) ? approveLevel(q.total) : '—';
    patchQuote(q.id, { status: '待审批', update: TODAY, approveLevel: lvl });
    pushApproval(makeQuoteApproval(q.id, q.ver, q.name, q.total, lvl));
    toast(`已提交审批 · ${q.id} · 审批中不可改价，驳回后回草稿修订产生新版本`);
    setSubmitOpen(null); setReason('');
  };

  /** 撤回审批（落库）：回「草稿」，可修改后重新提交 */
  const withdraw = (q: Q) => {
    patchQuote(q.id, { status: '草稿', update: TODAY });
    setBizStatus(q.id, '草稿');
    toast(`${q.id} 已撤回审批，回到「草稿」状态`);
  };

  const cols = [
    {
      key: 'id', title: '报价单', width: 190,
      render: (q: Q) => (
        <div className="nc-cell-main">
          {/* 单号可点击 → 蓝色，点击打开本行详情（全站统一） */}
          <IdCell onClick={() => setDetail(q)} title="查看报价单详情">{q.id}</IdCell>
          <Tag tone="blue">{q.ver}</Tag>
          <div className="nc-cell-sub">{q.name}</div>
        </div>
      ),
    },
    { key: 'customer', title: '客户', width: 200, render: (q: Q) => <span>{q.customer}</span> },
    { key: 'opp', title: '关联商机', width: 110, render: (q: Q) => (q.opp ? <span>{q.opp}</span> : <span className="nc-cell-sub">—</span>) },
    { key: 'cat', title: '类型', width: 76, render: (q: Q) => (q.taxRate === 6 ? '维护保养' : q.name.includes('改造') ? '改造' : '新建') },
    { key: 'region', title: '区域', width: 70 },
    { key: 'total', title: '报价总额（含税）', width: 130, align: 'right' as const, render: (q: Q) => <b className="num"><Money v={q.total} role={role} /></b> },
    {
      key: 'markup', title: '整体浮率', width: 90, align: 'right' as const,
      render: (q: Q) => <span className={`num${q.markup && q.markup < 15 ? ' is-red' : ''}`}>{q.markup ? q.markup + '%' : '/'}</span>,
    },
    { key: 'taxRate', title: '税率', width: 70, align: 'right' as const, render: (q: Q) => `${q.taxMode} ${q.taxRate}%` },
    { key: 'base', title: '来源', width: 90, render: (q: Q) => q.base },
    { key: 'status', title: '状态', width: 84, render: (q: Q) => <Tag tone={ST_TONE[st(q)] ?? 'gray'}>{st(q)}</Tag> },
    {
      /* 参考《报价管理》121 行「审批级（按金额自动）」列：按金额自动分级路由，未命中触发条件 = 免审 */
      key: 'approveLevel', title: '审批级（按金额自动）', width: 130,
      render: (q: Q) => (
        <span className="nc-valid-pill" title="<50 万→部门负责人；50~200 万→分管副总；≥200 万→总经理（维护保养类按 100 万口径）">
          {q.approveLevel === '—' || !trig(q) ? '免审' : q.approveLevel}
        </span>
      ),
    },
    {
      /* 操作列收口：每行恒定 3 个槽位 —— ① 按状态的主操作（终态留占位）② 详情 ③ 更多 ⋯。
         原实现把 详情 / 编辑 / 提交审批 / 作废 / 版本管理 / 打印 全内联，最多 7 个按钮且随状态增减，
         竖着扫视找不到固定位置；现按「常用外露 ≤3 + 其余收进更多」统一。
         状态一律取 st(q)（审批回写覆盖层），否则审批通过后「转合同」入口永不出现。 */
      key: 'op', title: '操作', width: 200, align: 'right' as const,
      render: (q: Q) => {
        const s = st(q);
        const more: OpMoreItem[] = [];
        if (s === '草稿') more.push({ label: '提交审批', onClick: () => setSubmitOpen(q) });
        if (s === '待审批') more.push({ label: '撤回审批', danger: true, onClick: () => withdraw(q) });
        if (s === '已审批' || s === '草稿') more.push({ label: '作废', danger: true, onClick: () => setVoidOpen(q) });
        if (s !== '作废') more.push({ label: '版本管理', onClick: () => setVerOpen(q) });
        more.push({ label: '打印', onClick: () => toast('已调起打印预览（报价单 A4）') });
        return (
          <div className="nc-ops" onClick={(e) => e.stopPropagation()}>
            {s === '草稿' && <Op gold onClick={() => { setFocus('quote-edit', q.id); go('quote-edit'); }}>编辑</Op>}
            {s === '待审批' && <Op onClick={() => withdraw(q)}>撤回</Op>}
            {s === '已审批' && <Op gold onClick={() => { setPendingQuote({ quoteId: q.id }); go('contract-new'); }}>转合同</Op>}
            {s === '已转化' && <OpNone title="已转化 = 终态，不可再编辑 / 作废" />}
            {s === '作废' && <OpNone title="作废为终态，不可再编辑 / 审批；可「复制新版本」重新发起" />}
            <Op onClick={() => setDetail(q)}>详情</Op>
            <OpMore items={more} />
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHead
        title="报价台账"
        actions={<>
          <Btn kind="primary" onClick={() => { setFName(''); setFCustomer(''); setErrs({}); setNewOpen(true); }}>＋ 新建报价单</Btn>
        </>}
      />

      <div className="nc-tiles nc-tiles-4">
        <button className="nc-tile is-clickable" onClick={() => { setStatus('全部'); setPage(1); }}>
          <div className="nc-tile-label">进行中报价总额</div>
          <div className="nc-tile-value num nc-v-blue"><Money v={ongoingAmt} role={role} wan /></div>
          <div className="nc-tile-sub">草稿 + 审批中 + 待客户确认（{inFlight} 单）</div>
        </button>
        <button className="nc-tile is-clickable" onClick={() => { setStatus('草稿'); setPage(1); }}>
          <div className="nc-tile-label">草稿</div>
          <div className="nc-tile-value num">{counts['草稿'] ?? 0}</div>
          <div className="nc-tile-sub">可编辑 / 可提交</div>
        </button>
        <button className="nc-tile is-clickable" onClick={() => { setStatus('已审批'); setPage(1); }}>
          <div className="nc-tile-label">本月新增报价</div>
          <div className="nc-tile-value num nc-v-orange">{monthNew}</div>
          <div className="nc-tile-sub">2026-09 创建 / 更新</div>
        </button>
        <div className="nc-tile">
          <div className="nc-tile-label">近 90 天成交率</div>
          <div className="nc-tile-value num nc-v-green">{winRate.toFixed(0)}%</div>
          <div className="nc-tile-sub">已转化 {winCnt} / 全部 {quotes.length} 单</div>
        </div>
      </div>

      <Card flush>
        <ListToolbar
          rows={[{
            label: '状态', value: status, onChange: (v) => { setStatus(v); setPage(1); },
            items: ['全部', ...QUOTE_STATUS].map((s) => ({ key: s, label: s, cnt: counts[s] ?? 0 })),
          }]}
          right={<>
            <select className="nc-input" style={{ width: 130 }} value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
              <option value="">全部类型</option>
              <option value="新建">新建</option>
              <option value="改造">改造</option>
              <option value="维护保养">维护保养</option>
            </select>
            <select className="nc-input" style={{ width: 130 }} value={owner} onChange={(e) => { setOwner(e.target.value); setPage(1); }}>
              <option value="">全部提交人</option>
              {owners.map((o) => <option key={o}>{o}</option>)}
            </select>
            <input className="nc-input nc-lt-search" value={kw} placeholder="搜索报价单号 / 项目 / 客户"
              onChange={(e) => { setKw(e.target.value); setPage(1); }} />
            <Btn onClick={() => { setKw(''); setType(''); setOwner(''); setStatus('全部'); setPage(1); }}>重置</Btn>
          </>}
        />

        <DataTable
          cols={cols}
          rows={paged}
          rowKey={(q) => q.id}
          minWidth={1420}
          empty="没有符合筛选条件的报价单；报价由商机推进生成，作废为终态可复制新版本"
          emptyCta={<Btn size="sm" onClick={() => go('quote-edit')}>＋ 新建报价单</Btn>}
          /* 条目背景色统一：不再对「命中审批触发」的行铺红底——整行红底与行悬停 / 整行选中的视觉冲突，
             且多行铺红会互相淹没。是否需审批由「审批级（按金额自动）」列（免审 / 分级）单独承担。 */
          rowClass={(q) => (st(q) === '作废' ? 'is-muted' : '')}
          onRowClick={(q) => setDetail(q)}
          foot={<TableFoot total={quotes.length} filtered={rows.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />}
        />
      </Card>

      {/* ============ 详情抽屉 ============ */}
      <Drawer
        open={!!detail} onClose={() => setDetail(null)} width={800}
        title={<span>报价单详情 {detail && <Code>{detail.id}</Code>}</span>}
        sub={detail && <>{detail.customer} · {detail.ver} · 负责人 {detail.owner} · 末次更新 {detail.update}</>}
        foot={detail && (() => {
          /* 状态一律取覆盖层 st(detail)：修复前读 detail.status 原值，审批中心通过后
             详情页永远停在「待审批」，`=== '已审批'` 的「转合同」按钮永不出现 —— 主线在详情页断链。 */
          const s = st(detail);
          return (
            <div className="nc-ops">
              {s === '草稿' && <><Btn kind="primary" size="sm" onClick={() => { setSubmitOpen(detail); setDetail(null); }}>提交审批</Btn><Btn size="sm" onClick={() => { setFocus('quote-edit', detail.id); setDetail(null); go('quote-edit'); }}>编辑</Btn></>}
              {s === '待审批' && <><Btn size="sm" danger onClick={() => { withdraw(detail); setDetail(null); }}>撤回审批</Btn><Btn size="sm" onClick={() => go('approval')}>查看审批进度</Btn></>}
              {s === '已审批' && <Btn kind="primary" size="sm" onClick={() => { setPendingQuote({ quoteId: detail.id }); setDetail(null); go('contract-new'); }}>转合同（同步生成项目 + 合同草稿）</Btn>}
              <Btn size="sm" onClick={() => { setVerOpen(detail); setDetail(null); }}>版本管理</Btn>
              <Btn size="sm" onClick={() => toast('已调起打印预览')}>打印</Btn>
            </div>
          );
        })()}
      >
        {detail && (
          <>
            <div className="nc-tiles nc-tiles-4">
              <div className="nc-tile"><div className="nc-tile-label">报价总额（含税）</div><div className="nc-tile-value num">{fmt(detail.total)}</div><div className="nc-tile-sub">不含税 {fmt(detail.total - calcTax(detail.total, detail.taxRate, detail.taxMode as '含税'))}</div></div>
              <div className="nc-tile"><div className="nc-tile-label">税额（{detail.taxRate}%）</div><div className="nc-tile-value num">{fmt(calcTax(detail.total, detail.taxRate, detail.taxMode as '含税'))}</div><div className="nc-tile-sub">含税：总额×税率÷(100+税率)</div></div>
              <div className="nc-tile"><div className="nc-tile-label">整体浮率</div><div className={`nc-tile-value num${detail.markup < 15 ? ' is-red' : ''}`}>{detail.markup ? detail.markup + '%' : '/'}</div><div className="nc-tile-sub">红线 &lt;15% 触发审批</div></div>
              <div className="nc-tile"><div className="nc-tile-label">明细行数</div><div className="nc-tile-value num">{detail.items}</div><div className="nc-tile-sub">{detail.ver} 当前版本</div></div>
            </div>

            <div className={`nc-rulebar${trig(detail) ? ' is-hit' : ' is-ok'}`}>{trigText(detail)}</div>

            <KvGrid cols={2} rows={[
              { k: '客户', v: <EntityLink target="customer" id={detail.customerId} go={go} title="下钻到客户档案">{detail.customer}</EntityLink> },
              { k: '关联商机', v: detail.opp ? <EntityLink target="opp" id={detail.opp} go={go} title="下钻到商机详情">{detail.opp}</EntityLink> : <span className="nc-cell-sub">—</span> },
              { k: '行业', v: detail.base },
              { k: '区域', v: detail.region + (detail.uplift ? ` · 区域上浮 ${detail.uplift}%` : ' · 无区域上浮') },
              { k: '报价名称', v: detail.name },
              { k: '负责人 · 创建日期', v: `${detail.owner} · ${detail.date}` },
              { k: '税率口径', v: `${detail.taxMode} ${detail.taxRate}%` },
              { k: '有效期', v: '报价后 30 天' },
              { k: '审批层级', v: detail.approveLevel === '—' ? '免审（未命中触发条件）' : <Tag tone="blue">{detail.approveLevel}</Tag> },
              { k: '工程费单方（不含设备）', v: detail.costSqm ? detail.costSqm + ' 元/㎡' : '/' },
            ]} />

            <div className="nc-sec-title">流转记录</div>
            <Timeline items={[
              { date: detail.date, text: `创建报价单 ${detail.ver}（成本参考价快照已留痕）`, tone: 'ok' },
              { date: detail.date, text: `明细组价完成 · ${detail.items} 行 · 整体浮率 ${detail.markup}%`, tone: 'ok' },
              ...(detail.approveLevel !== '—' ? [{ date: detail.update, text: `命中触发条件 → 进入待审批 · 路由至${detail.approveLevel}`, tone: 'gold' as const }] : []),
              { date: detail.update, text: `当前状态：${st(detail)}`, tone: st(detail) === '作废' ? 'red' as const : 'gray' as const },
            ]} />
          </>
        )}
      </Drawer>

      {/* ============ 新建报价单 ============ */}
      <Modal
        open={newOpen} onClose={() => setNewOpen(false)} width={480} title="新建报价单"
        foot={<><Btn onClick={() => setNewOpen(false)}>取消</Btn><Btn kind="primary" onClick={() => {
          const e: Record<string, string> = {};
          if (!fCustomer) e.customer = '客户必填';
          if (!fName) e.name = '报价名称必填';
          setErrs(e);
          if (Object.keys(e).length) return;
          /* 落库：修复前仅 toast 后跳转，报价单从未写进共享 store ——
             返回台账看不到新单，工作台也拿不到 id（编辑态为空），整条主线凭空断掉。 */
          const no = nextQuoteNo();
          const custId = custOptions.find((c) => c.name === fCustomer)?.id ?? '';
          const tax = Number(fTax);
          addQuote({
            id: no, ver: 'V1', customer: fCustomer, customerId: custId,
            opp: fOpp, name: fName.trim(), total: 0,
            taxRate: tax, taxMode: '含税',
            status: '草稿', owner: '当前用户', date: TODAY, update: TODAY,
            approveLevel: '—', markup: 0, region: '昆明', uplift: 0,
            items: 0, base: '其他', costSqm: 0,
            lines: [],
          });
          toast(`报价单 ${no} 已创建（草稿）· 进入报价工作台组价`);
          setNewOpen(false);
          setFName(''); setFCustomer(''); setFOpp(''); setErrs({});
          setFocus('quote-edit', no);
          go('quote-edit');
        }}>创建并进入工作台</Btn></>}
      >
        <div className="nc-form-grid">
          <Field label="客户" req err={errs.customer}>
            <select className="nc-input" value={fCustomer} onChange={(e) => setFCustomer(e.target.value)}>
              <option value="">请选择客户</option>
              {custOptions.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="项目类型" req>
            <select className="nc-input" value={fType} onChange={(e) => setFType(e.target.value)}>
              <option>新建</option><option>改造</option><option>维护保养</option>
            </select>
          </Field>
          <Field label="报价名称" req span={2} err={errs.name}>
            <input className="nc-input" value={fName} onChange={(e) => setFName(e.target.value)} placeholder="例：××医院住院楼消防系统升级报价" />
          </Field>
          <Field label="税率口径" req note="口径必选：不含税报价后续开票将另加税额，避免纠纷">
            <select className="nc-input" value={fTax} onChange={(e) => setFTax(e.target.value)}>
              <option value="9">含税 9%（建筑业）</option>
              <option value="13">含税 13%</option>
              <option value="6">含税 6%（服务/维护保养）</option>
              <option value="3">含税 3%</option>
            </select>
          </Field>
          <Field label="关联商机" note="关联后报价金额回写商机加权金额，推进商机阶段">
            <select className="nc-input" value={fOpp} onChange={(e) => setFOpp(e.target.value)}>
              <option value="">暂不关联</option>
              {oppOptions.map((o) => <option key={o.id} value={o.id}>{o.id} · {o.name}</option>)}
            </select>
          </Field>
        </div>
      </Modal>

      {/* ============ 材料库·价格档案 ============ */}
      <Drawer open={libOpen} onClose={() => setLibOpen(false)} width={960} title="材料库 · 价格档案" sub="报价的唯一成本价来源（成本参考价锁死，改动留痕）">
        <div className="nc-sec-title">8 目录体系与默认上浮率</div>
        <table className="nc-tbl" style={{ minWidth: 560 }}>
          <thead><tr><th>目录</th><th>覆盖品类</th><th className="is-num">默认上浮率</th></tr></thead>
          <tbody>
            {QUOTE_CATS.map((c, i) => (
              <tr key={c.key}>
                <td>{String(i + 1).padStart(2, '0')} {c.name}</td>
                <td className="nc-cell-sub">{c.cats.join(' / ')}</td>
                <td className="is-num"><b className="num">{c.markup}%</b></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="nc-listhint">
          <span>成本参考价<Tip w={340} text={<>来源三档：① 最近采购价 ② 供应商框架价 ③ 历史同类合同价。<br />报价价低于成本价 → 锁死不可提交（须理由 + 特批）。</>} /></span>
        </div>
      </Drawer>

      {/* ============ 穿透设置 ============ */}
      <Drawer open={integOpen} onClose={() => setIntegOpen(false)} width={560} title="穿透设置" sub="报价 ↔ 商机 ↔ 合同的数据联动规则">
        <div className="nc-sec-title">打通关系</div>
        <KvGrid cols={1} rows={[
          { k: '报价 → 商机', v: '报价单挂载关联商机；已审批/已转化回写商机加权金额与阶段（→ 报价阶段）' },
          { k: '报价 → 合同', v: '已审批点「转合同」→ 同时创建项目（来源=报价转化）+ 合同草稿，重复提交不会生成第二份' },
          { k: '报价 → 材料库', v: '明细从材料库带出编码/规格/单位/目录/成本参考价，目录列只读锁定' },
          { k: '报价 → 审批中心', v: '命中双触发条件后生成审批单，按金额分级路由' },
          { k: '报价 → 历史参照', v: '详情页按「行业 + 业务类型」匹配近 18 个月成交，算单方造价对比' },
        ]} />
      </Drawer>

      {/* ============ 提交审批 ============ */}
      <Modal
        open={!!submitOpen} onClose={() => setSubmitOpen(null)} width={480} title={`提交审批 · ${submitOpen?.id ?? ''}`}
        foot={<><Btn onClick={() => setSubmitOpen(null)}>取消</Btn><Btn kind="primary" onClick={submit}>确认提交</Btn></>}
      >
        {submitOpen && (
          <>
            <Banner tone={trig(submitOpen) ? 'warn' : 'info'}>
              {trigText(submitOpen)}
              {trig(submitOpen) && <> · 按金额分级路由至 <b>{approveLevel(submitOpen.total)}</b></>}
            </Banner>
            <div className="nc-sec-title">提交前置校验</div>
            <ul className="nc-check-list">
              <li><Ico n="check" size={16} /> 客户 / 类型必填</li>
              <li><Ico n="check" size={16} /> 明细 ≥1 行</li>
              <li><Ico n="check" size={16} /> 名称 / 数量 / 成本参考价必填</li>
              <li><Ico n="check" size={16} /> 变更原因必填 ≤200 字</li>
            </ul>
            <Field label="变更原因" req err={errs.reason} note={`${reason.length}/200 字 · 每次提交必填，用于版本追溯`}>
              <textarea className="nc-input" rows={3} value={reason} maxLength={200} onChange={(e) => setReason(e.target.value)} placeholder="例：按客户预算删减应急照明系统，报警点位优化" />
            </Field>
          </>
        )}
      </Modal>

      {/* ============ 作废（评审 I1：统一二次确认 + 原因必填校验；H8：列出引用方） ============ */}
      <ConfirmModal
        open={!!voidOpen} onClose={() => setVoidOpen(null)} okText="确认作废"
        title={`作废报价单 ${voidOpen?.id ?? ''}`}
        reason reasonLabel="作废原因"
        impact={voidOpen && (() => {
          /* H8 上游作废阻断：列出引用该报价单的下游单据（投标按 BIDS.quoteId 外键），
             避免「报价已作废、投标仍挂着它」的失效引用无人处理。 */
          const refBids = getBids().filter((b) => b.quoteId === voidOpen.id);
          return (
            <>
              将作废报价单 <b>{voidOpen.id} {voidOpen.name}</b>（金额 {fmt(voidOpen.total)}）。<br />
              作废后<b>不可恢复</b>，已转化 = 终态不可编辑亦不可作废。
              {refBids.length > 0
                ? <>当前有 <b>{refBids.length}</b> 张投标单引用本报价（{refBids.map((b) => b.id).join('、')}），作废后其「关联报价」将变为失效引用，请同步处理。</>
                : <>未发现引用本报价单的投标 / 合同，可直接作废。</>}
            </>
          );
        })()}
        onOk={(r) => {
          patchQuote(voidOpen!.id, { status: '作废', update: TODAY });
          setBizStatus(voidOpen!.id, '作废');
          toast(`报价单 ${voidOpen?.id} 已作废，原因：${r}`);
          setVoidOpen(null);
        }}
      />

      {/* ============ 版本管理 ============ */}
      <Drawer open={!!verOpen} onClose={() => setVerOpen(null)} width={640} title="版本管理" sub={verOpen && `${verOpen.name} · 当前 ${verOpen.ver}`}>
        {verOpen && (
          <>
            <div className="nc-sec-title">版本链</div>
            <ChainBar nodes={[
              { label: 'V1', sub: `${fmtWan(verOpen.total * 1.04)}`, state: 'done' },
              { label: 'V2', sub: `${fmtWan(verOpen.total)}`, state: 'cur' },
              { label: 'V3', sub: '待生成', state: 'todo' },
            ]} />
            <div className="nc-listhint">
              <span>版本留痕<Tip text="驳回回草稿修订 → 自动产生新版本（旧版只读保留）；支持「与 V1 对比」差异回放。" /></span>
            </div>
            <table className="nc-tbl" style={{ minWidth: 520 }}>
              <thead><tr><th>版本</th><th className="is-num">金额</th><th>日期</th><th>变更说明</th><th>操作</th></tr></thead>
              <tbody>
                <tr><td><Tag tone="blue">V2</Tag></td><td className="is-num">{fmt(verOpen.total)}</td><td>{verOpen.update}</td><td className="nc-cell-sub">按客户意见调整明细与浮率</td><td><Op>当前</Op></td></tr>
                <tr><td><Tag>V1</Tag></td><td className="is-num">{fmt(verOpen.total * 1.04)}</td><td>{verOpen.date}</td><td className="nc-cell-sub">首次组价提交</td><td><Op onClick={() => setDiffOpen(true)}>与 V2 对比</Op></td></tr>
              </tbody>
            </table>
          </>
        )}
      </Drawer>

      {/* ============ 版本差异对比 ============ */}
      <Modal open={diffOpen} onClose={() => setDiffOpen(false)} width={840} title="V1 → V2 变更对比"
        foot={<><span className="nc-cell-sub" style={{ marginRight: 'auto' }}>共 6 处变动 · 旧版只读保留</span><Btn kind="primary" onClick={() => setDiffOpen(false)}>关闭</Btn></>}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <span className="nc-chip is-green">新增 1</span>
          <span className="nc-chip is-red">删除 1</span>
          <span className="nc-chip is-orange">修改 3</span>
          <span className="nc-chip">不变 1</span>
        </div>
        <table className="nc-tbl" style={{ minWidth: 760 }}>
          <thead>
            <tr>
              <th style={{ width: 40 }}> </th>
              <th>明细项</th>
              <th style={{ width: 140 }} className="is-num">V1（旧）</th>
              <th style={{ width: 140 }} className="is-num">V2（新）</th>
              <th style={{ width: 160 }}>变更说明</th>
            </tr>
          </thead>
          <tbody>
            {([
              ['mod', '火灾自动报警系统（元/㎡）', '74', '72', '单价下调 2 元'],
              ['same', '消火栓及喷淋改造（元/㎡）', '56', '56', '—'],
              ['mod', '消防主机及联动调试', '¥1,352,000', '¥1,332,194', '核减 ¥19,806'],
              ['del', '应急照明系统改造', '¥130,000', '—', '已删除（院方预算收紧）'],
              ['add', '区域上浮', '—', '3%', '新增云南区域上浮'],
              ['mod', '报价总额（含税）', '¥4,862,000', '¥4,800,000', '↓ ¥62,000（-1.27%）'],
            ] as [string, string, string, string, string][]).map(([kind, name, v1, v2, note]) => (
              <tr key={name} className={`nc-diff-row is-${kind}`}>
                <td style={{ textAlign: 'center' }}>
                  {kind === 'add' && <Tag tone="green">新增</Tag>}
                  {kind === 'del' && <Tag tone="red">删除</Tag>}
                  {kind === 'mod' && <Tag tone="orange">修改</Tag>}
                  {kind === 'same' && <Tag tone="gray">不变</Tag>}
                </td>
                <td><b>{name}</b></td>
                <td className="is-num" style={{ textDecoration: kind === 'del' ? 'line-through' : 'none', color: kind === 'del' ? 'var(--c-danger)' : 'inherit' }}>{v1}</td>
                <td className="is-num" style={{ fontWeight: kind === 'add' || kind === 'mod' ? 600 : 400, color: kind === 'add' ? 'var(--c-success)' : kind === 'mod' ? 'var(--c-warning-deep)' : 'inherit' }}>{v2}</td>
                <td className="nc-cell-sub">{note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>
    </>
  );
}
