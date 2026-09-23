// 诺安云 6.0 · 审批中心 · PRD §15
import React, { useEffect, useMemo, useState } from 'react';
import {
  Btn, Card, DataTable, Drawer, Field, ListToolbar, Modal, Money, Op, OpSep,
  PageHead, TableFoot, Tag, Tabs, Tile, Tip, useToast, type Col, ConfirmModal, EntityLink, pressProps,} from '../components/ui';
import { APPROVALS, approveLevel, fmt, fmtWan, TODAY } from '../components/data';
import { getApprovals, setApprovalState, syncBizFromApproval, subscribeStore, refBizNo } from '../components/store';
import { Ico } from '../components/icons';

/* ============ 审批类型 → 审批链模板（分级路由） ============ */
type ChainNode = { label: string; role: string };
const chainOf = (type: string, amt: number, level: string): ChainNode[] => {
  // 项目立项：审批级别由立项页决定（成本率 >80% 红线时已上浮一级），此处按级别字段生成，不再按金额二次推导
  if (type === '项目立项') {
    const LV = ['部门负责人', '分管副总', '总经理'];
    const ROLE: Record<string, string> = { 部门负责人: '蓝峰', 分管副总: '王志海', 总经理: '刘振国' };
    const idx = Math.max(0, LV.indexOf(level));
    return [{ label: '发起', role: '业务' }, ...LV.slice(0, idx + 1).map((l) => ({ label: l, role: ROLE[l] }))];
  }
  const lv = approveLevel(amt, type === '付款申请' ? 'purchase' : type === '合同审批' ? 'main' : 'main');
  const biz = type === '付款申请' ? 'purchase' : 'main';
  const tail: ChainNode[] = [];
  if (biz === 'purchase') {
    tail.push({ label: '部门负责人', role: '蓝峰' });
    if (amt >= 300000) tail.push({ label: '分管副总', role: '王志海' });
    if (amt >= 1000000) tail.push({ label: '总经理', role: '刘振国' });
  } else {
    tail.push({ label: '部门负责人', role: '蓝峰' });
    if (amt >= 500000) tail.push({ label: '分管副总', role: '王志海' });
    if (amt >= 2000000) tail.push({ label: '总经理', role: '刘振国' });
  }
  if (type === '合同审批' || type === '报价审批' || type === '变更审批') tail.push({ label: '财务复核', role: '李思敏' });
  return [{ label: '发起', role: '业务' }, ...tail];
};

/** 审批状态全集（评审 B3：原状态集缺「审批中 / 已撤回 / 已终止」，多节点单据无法与首关区分） */
const APPR_STATUS = ['待审批', '审批中', '已通过', '已退回', '已撤回', '已终止'] as const;
/** 仍在流转中的状态（未终态） */
const ACTIVE_ST = ['待审批', '审批中'];
/** 终态 */
const FINAL_ST = ['已通过', '已终止'];
type ApprStatus = (typeof APPR_STATUS)[number];

const stTone = (s: string) =>
  s === '待审批' ? 'orange' : s === '审批中' ? 'blue' : s === '已通过' ? 'green'
    : s === '已退回' ? 'red' : 'gray';

/* ============ 报价审批内嵌：报价明细（快照）+ 历史同类价格参照 ============ */
const QUOTE_SNAP: [string, string, string, number][] = [
  ['消防工程', '火灾自动报警系统（72 元/㎡ × 1.03）', '26,000 ㎡', 1928160],
  ['消防工程', '消火栓及自动喷淋改造（56 元/㎡ × 1.03）', '26,000 ㎡', 1499680],
  ['智能化工程', '消防主机及联动调试（含平台接入）', '1 项', 1372160],
];
const REF_HIST = [
  { name: '昭通市第一人民医院 · 消防系统升级', date: '2025-06', amt: 2980000, area: 24000, up: 124.2 },
  { name: '曲靖市第二人民医院 · 消防系统改造', date: '2024-11', amt: 1950000, area: 17000, up: 114.7 },
  { name: '楚雄州中医医院 · 消防升级项目', date: '2026-02', amt: 3890000, area: 31000, up: 125.5 },
];

/** 审批链节点：处理人 / 处理时间 / 意见 / 待处理标 */
const apprChain = (r: VRow) => chainOf(r.type, r.amt, r.level).map((n, i) => {
  if (r.status === '已退回') {
    return {
      ...n, who: n.role,
      st: (i < r.node ? 'done' : i === r.node ? 'rejected' : 'wait') as 'done' | 'rejected' | 'wait',
      time: i <= r.node ? r.time.slice(5) : '—',
      op: i === r.node ? (r.reason || '已退回') : i < r.node ? '同意' : '',
    };
  }
  const st = (r.status === '已通过' || i < r.node ? 'done' : i === r.node ? 'cur' : 'wait') as 'done' | 'cur' | 'wait';
  return {
    ...n, who: n.role, st,
    time: st === 'done' ? r.time.slice(5) : '—',
    op: st === 'done' && i > 0 ? '同意' : '',
  };
});

/* ============ 待办 / 已办 视图 ============ */
type Row = (typeof APPROVALS)[number];
type VRow = Row & { mine: boolean; overdueH: number };
/** 当前登录人（演示身份：商务经理 蓝峰）—— 「我发起的 / 抄送我的」两 Tab 的口径判定基准 */
const MY_NAME = '蓝峰';

/**
 * 单据穿透：审批单的 ref 里带的是上游单据号（报价单 BJ… / 合同 HT…·WB… / 变更单 BG… / 付款单 PF…）。
 * 按前缀把 ref 映射到可下钻的目标页 + 目标实体 id，实现「审批中 → 原单据」层层透视。
 */
function refDrill(ref: string): { target: string; id: string; label: string } | null {
  const m = /^([A-Z]{2}\d{8}-\d{4}|[A-Z]{2}\d{6})/.exec(ref);
  if (!m) return null;
  const no = m[1];
  if (no.startsWith('BJ')) return { target: 'quote-detail', id: no, label: '报价单' };
  if (no.startsWith('HT') || no.startsWith('WB')) return { target: 'contract', id: no, label: '合同' };
  return null;
}

export default function ApprovalPage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  /** Q5：原 isApprover 含 'depadmin' / 'market' 两个 ROLES 中不存在的角色 id，且定义后从未被使用——
      任何角色都能审批。改为对齐 ROLES 实际成员，并接入「通过 / 退回 / 批量通过」三处操作权限校验。 */
  const APPROVER_ROLES = ['boss', 'deputy', 'finance', 'pm', 'sysadmin'];
  const isApprover = APPROVER_ROLES.includes(role);
  const noPermTitle = isApprover ? undefined : `当前角色「${role}」无审批权限`;

  const [tab, setTab] = useState('todo');
  const [types, setTypes] = useState<string[]>(['报价审批', '合同审批', '项目立项', '付款申请', '变更审批']);
  const [kw, setKw] = useState('');
  const [lv, setLv] = useState('all');
  const [stF, setStF] = useState('all');
  const [picked, setPicked] = useState<string[]>([]);
  const [detail, setDetail] = useState<VRow | null>(null);
  const [reject, setReject] = useState<VRow | null>(null);
  const [rejectTxt, setRejectTxt] = useState('');
  const [passOpen, setPassOpen] = useState<VRow | null>(null);
  const [opinion, setOpinion] = useState('');
  const [resubmit, setResubmit] = useState<VRow | null>(null);
  const [resubmitTxt, setResubmitTxt] = useState('');
  const [voidM, setVoid] = useState<VRow | null>(null);
  const [withdraw, setWithdraw] = useState<VRow | null>(null);
  const [batchOpen, setBatchOpen] = useState(false);
  /* I2：批量通过为写操作，加进行中态 + 防重复提交锁 */
  const [batchRun, setBatchRun] = useState(false);
  const [batchTxt, setBatchTxt] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sort, setSort] = useState('最近申请优先');
  /* 审批单改为从共享 store 读取：跨页往返后审批结果不丢失（原 useState(APPROVALS) 每次挂载都重置） */
  const [state, setState] = useState<Row[]>(getApprovals() as unknown as Row[]);
  useEffect(() => subscribeStore(() => setState(getApprovals() as unknown as Row[])), []);

  const rows: VRow[] = useMemo(() => state.map((a) => ({
    ...a,
    mine: ACTIVE_ST.includes(a.status),
    overdueH: ACTIVE_ST.includes(a.status) ? (a.type === '付款申请' ? 31 : a.type === '报价审批' ? 25 : 8) : 0,
  })), [state]);

  const todo = rows.filter((r) => ACTIVE_ST.includes(r.status));
  const done = rows.filter((r) => !ACTIVE_ST.includes(r.status));
  /* 参考 HTML 四 Tab 口径：待我审批 / 我已审批 / 我发起的 / 抄送我的。
     「我发起的」= 本人工号提交的单据；「抄送我的」= 知会性质、审批链流经但不占待办的单据。 */
  const ccRows = rows.filter((r) => r.cc?.includes(MY_NAME));
  const mineRows = rows.filter((r) => r.ap === MY_NAME);
  const base = tab === 'todo' ? todo
    : tab === 'done' ? done
      : tab === 'mine' ? mineRows
        : tab === 'cc' ? ccRows
          : rows;

  /* 排序：最近申请优先 / 最早申请优先 / 金额从高到低 / 金额从低到高 */
  const SORTS = ['最近申请优先', '最早申请优先', '金额从高到低', '金额从低到高'];
  const filtered = useMemo(() => {
    const list = base.filter((r) =>
      types.includes(r.type)
      && (lv === 'all' || r.level === lv)
      && (stF === 'all' || r.status === stF)
      && (!kw || r.obj.includes(kw) || r.id.includes(kw) || r.ap.includes(kw) || r.ref.includes(kw)));
    const arr = [...list];
    if (sort === '最近申请优先') arr.sort((a, b) => b.time.localeCompare(a.time));
    else if (sort === '最早申请优先') arr.sort((a, b) => a.time.localeCompare(b.time));
    else if (sort === '金额从高到低') arr.sort((a, b) => b.amt - a.amt);
    else arr.sort((a, b) => a.amt - b.amt);
    return arr;
  }, [base, types, lv, stF, kw, sort]);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const batchApprovable = filtered.filter((r) => ACTIVE_ST.includes(r.status) && ['借阅申请', '付款申请'].includes(r.type));
  const batchEligible = filtered.filter((r) => ACTIVE_ST.includes(r.status) && r.amt < 500000 && ['合同审批', '报价审批', '变更审批'].includes(r.type));

  /** 通过：审批链推进到下一节点；已是末节点则整单通过（结果同步回写上游业务单据） */
  const passRow = (r: VRow, op: string) => {
    const c = chainOf(r.type, r.amt, r.level);
    const allDone = r.node + 1 >= c.length;
    const next = Math.min(r.node + 1, c.length - 1);
    const st = allDone ? '已通过' : next > 0 ? '审批中' : '待审批';
    setApprovalState(r.id, { node: next, status: st, reason: op } as Partial<Row>);
    /* 回写业务单据：终审通过时业务单进入终态，中间节点仅标记流转中 */
    const biz = syncBizFromApproval({ type: r.type, ref: r.ref, status: '已通过' }, allDone);
    toast(allDone
      ? `已通过 ${r.id} · 审批链全部完成，单据归档${biz ? ` · 已回写业务单 ${biz} 状态` : ''}`
      : `已通过 ${r.id} · 状态转为「审批中」，流转至第 ${next}/${c.length - 1} 审批节点「${c[next].label}（${c[next].role}）」`);
    setPassOpen(null); setOpinion(''); setDetail(null);
  };
  const rejectRow = (r: VRow, reason: string) => {
    setApprovalState(r.id, { status: '已退回', reason } as Partial<Row>);
    const biz = syncBizFromApproval({ type: r.type, ref: r.ref, status: '已退回' }, false);
    toast(`已退回 ${r.id} · 退回原因已推送发起人 ${r.ap} 待办${biz ? ` · 业务单 ${biz} 已置为「${refBizNo(r.ref).startsWith('BJ') ? '草稿' : '已退回'}」可修改后重提` : ''}`);
    setReject(null); setRejectTxt(''); setDetail(null);
  };
  /** 评审 B2：已退回 → 重新提交（审批链重置至第 1 节点，回到待审批） */
  const resubmitRow = (r: VRow, note: string) => {
    setState((s) => s.map((x) => x.id === r.id
      ? { ...x, status: '待审批' as ApprStatus, node: 1, reason: `重新提交：${note}` } : x));
    toast(`${r.id} 已重新提交 · 审批链重置至第 1 节点，已推送审批人待办`);
    setResubmit(null); setResubmitTxt('');
  };
  /** 评审 B2：已退回 → 作废（终态，需原因） */
  const voidRow = (r: VRow, reason: string) => {
    setApprovalState(r.id, { status: '已终止' as ApprStatus, reason } as Partial<Row>);
    const biz = syncBizFromApproval({ type: r.type, ref: r.ref, status: '已终止' }, false);
    toast(`${r.id} 已作废（终态）· 原因已留痕并通知发起人 ${r.ap}${biz ? ` · 业务单 ${biz} 已标记为审批作废` : ''}`);
    setVoid(null); setDetail(null);
  };
  /** 评审 B3：发起人撤回（流转中可撤回） */
  const withdrawRow = (r: VRow, reason: string) => {
    setApprovalState(r.id, { status: '已撤回' as ApprStatus, reason } as Partial<Row>);
    const biz = syncBizFromApproval({ type: r.type, ref: r.ref, status: '已撤回' }, false);
    toast(`${r.id} 已撤回 · 原因已留痕，可修改后重新提交${biz ? ` · 业务单 ${biz} 同步撤回` : ''}`);
    setWithdraw(null);
  };
  /** 评审 B4：超时催办 + 分级升级 */
  const urgeRow = (r: VRow) => {
    const c = chainOf(r.type, r.amt, r.level);
    const cur = c[Math.min(r.node, c.length - 1)];
    const up = r.overdueH >= 48 ? '已升级至其上级（分管副总）' : r.overdueH >= 24 ? '已标记加急并抄送部门负责人' : '已发送站内提醒';
    toast(`已催办 ${r.id} · 当前节点「${cur.label}（${cur.role}）」停留 ${r.overdueH}h · ${up}`);
  };

  const cols: Col<VRow>[] = [
    { key: 'id', title: '审批单号', width: 150, render: (r) => <span className="num nc-link" onClick={() => { setDetail(r); setOpinion(''); }} {...pressProps(() => { setDetail(r); setOpinion(''); })}>{r.id}</span> },
    { key: 'type', title: '审批类型', width: 96, render: (r) => <Tag tone="blue">{r.type}</Tag> },
    { key: 'obj', title: '审批对象', render: (r) => <><div>{r.obj}</div><div className="nc-tiny nc-muted">{(() => { const d = refDrill(r.ref); return d ? <EntityLink target={d.target} id={d.id} go={go} title={`下钻到${d.label}详情`}>{r.ref}</EntityLink> : r.ref; })()}</div></> },
    { key: 'ap', title: '发起人', width: 78 },
    { key: 'amt', title: '金额', width: 110, align: 'right', render: (r) => r.amt ? <b className="num"><Money v={r.amt} role={role} wan /></b> : <span className="nc-muted">—</span> },
    {
      key: 'level', title: '分级路由', width: 118, render: (r) => (
        <span className="nc-valid-pill" title={`按金额自动路由：<50万→部门负责人；50~200万→分管副总；≥200万→总经理（采购 30/100 万口径）`}>
          {r.level}
        </span>
      ),
    },
    {
      key: 'node', title: '当前节点 / 审批进度', width: 170, render: (r) => {
        const c = chainOf(r.type, r.amt, r.level);
        const cur = c[Math.min(r.node, c.length - 1)];
        const isEnd = FINAL_ST.includes(r.status) || r.status === '已撤回';
        return (
          <span className="nc-tiny">
            {isEnd ? <span className="nc-muted">—（{r.status}）</span>
              : <>第 {r.node + 1}/{c.length} 节点 · <b>{cur?.label}</b>（{cur?.role}）</>}
            {!isEnd && r.status === '审批中' && <div className="nc-muted">前 {r.node} 节点已通过</div>}
          </span>
        );
      },
    },
    { key: 'time', title: '提交时间', width: 130, render: (r) => <span className="num nc-tiny">{r.time}</span> },
    { key: 'status', title: '状态', width: 92, render: (r) => <Tag tone={stTone(r.status) as 'orange'}>{r.status}</Tag> },
    {
      key: 'op', title: '操作', width: 210, render: (r) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Op onClick={() => { setDetail(r); setOpinion(''); }}>详情</Op>
          {(r.status === '待审批' || r.status === '审批中') && <>
            <OpSep />
            <Op disabled={!isApprover} title={noPermTitle} onClick={() => { setDetail(r); setOpinion(''); setPassOpen(r); }}>通过</Op>
            <OpSep />
            <Op danger disabled={!isApprover} title={noPermTitle} onClick={() => { setReject(r); setRejectTxt(''); }}>退回</Op>
            <OpSep />
            <Op onClick={() => urgeRow(r)} title={`当前节点已停留 ${r.overdueH} 小时`}>催办</Op>
            <OpSep />
            <Op onClick={() => setWithdraw(r)} title="发起人撤回，回到草稿可改">撤回</Op>
          </>}
          {/* 评审 B2：已退回补「重新提交 / 作废」出口，原仅「查看业务单」= 流程断点 */}
          {r.status === '已退回' && <>
            <OpSep />
            <Op gold onClick={() => { setResubmit(r); setResubmitTxt(''); }} title="修改后重新提交，审批链重置至第 1 节点">重新提交</Op>
            <OpSep />
            <Op danger onClick={() => setVoid(r)} title="作废本单（终态，需填写原因）">作废</Op>
            <OpSep />
            <Op onClick={() => go('project')}>查看业务单</Op>
          </>}
          {(r.status === '已撤回' || r.status === '已终止') && <>
            <OpSep />
            <Op gold onClick={() => { setResubmit(r); setResubmitTxt(''); }}>重新提交</Op>
          </>}
        </span>
      ),
    },
  ];

  const TYPES = ['报价审批', '合同审批', '付款申请', '变更审批', '借阅申请'];

  return (
    <>
      <PageHead
        crumbs={['审批中心']}
        title="审批中心"
        badges={<><Tag tone="orange">待我审批 {todo.length}</Tag><Tag tone="gray">今日办结 {done.length}</Tag></>}
        sub={<span>多类型单据统一审批<Tip w={340} text="覆盖报价 / 合同 / 付款 / 变更 / 借阅；审批链按金额分级自动路由，退回必填原因。" /></span>}
        actions={<>
          <Btn onClick={() => { setKw(''); setLv('all'); setStF('all'); setTypes(TYPES); setSort(SORTS[0]); setPage(1); toast('已刷新待办列表'); }}><Ico n="refresh" size={16} /> 刷新</Btn>
          <Btn onClick={() => toast('已导出待办清单')}>导出待办</Btn>
          <Btn kind="primary" disabled={!picked.length || !isApprover} title={noPermTitle} onClick={() => setBatchOpen(true)}>批量通过（{picked.length}）</Btn>
        </>}
      />

      <div className="nc-tiles nc-tiles-6">
        <Tile label="待我审批" value={todo.length} tone="orange" sub="超 24 小时 = 2 · 超 48 小时 = 0" active={tab === 'todo'} onClick={() => setTab('todo')} />
        <Tile label="报价审批" value={todo.filter((r) => r.type === '报价审批').length} tone="orange" sub="浮率 / 金额双触发" />
        <Tile label="合同审批" value={todo.filter((r) => r.type === '合同审批').length} sub="含六条款校验" />
        <Tile label="付款申请" value={todo.filter((r) => r.type === '付款申请').length} sub="采购 30/100 万口径" />
        <Tile label="变更审批" value={todo.filter((r) => r.type === '变更审批').length} sub="签证 / 范围变更" />
        <Tile label="审批中" value={rows.filter((r) => r.status === '审批中').length} tone="blue" sub="多节点流转中" active={stF === '审批中'} onClick={() => setStF(stF === '审批中' ? 'all' : '审批中')} />
      </div>

      <Card flush>
        <div style={{ padding: '12px 16px 0' }}>
          <Tabs value={tab} onChange={(k) => { setTab(k); setPage(1); }} items={[
            { key: 'todo', label: '待我审批', cnt: todo.length },
            { key: 'done', label: '我已审批', cnt: done.length },
            { key: 'mine', label: '我发起的', cnt: mineRows.length },
            { key: 'cc', label: '抄送我的', cnt: ccRows.length },
          ]} />
        </div>
        <div style={{ padding: '0 16px 12px' }}>
          <ListToolbar
            rows={[
              /* 评审 B3：状态集扩为 6 态后，必须提供对应筛选入口，否则新状态不可达 */
              {
                label: '状态', value: stF, onChange: (k) => { setStF(k); setPage(1); },
                items: [
                  { key: 'all', label: '全部状态', cnt: rows.length },
                  ...APPR_STATUS.map((s) => ({ key: s, label: s, cnt: rows.filter((a) => a.status === s).length })),
                ],
              },
              {
                label: '层级', value: lv, onChange: (k) => { setLv(k); setPage(1); },
                items: [
                  { key: 'all', label: '全部层级', cnt: rows.length },
                  ...(['部门负责人', '分管副总', '总经理'] as const).map((l) => ({ key: l, label: l, cnt: rows.filter((a) => a.level === l).length })),
                ],
              },
            ]}
            right={<>
              <div className="nc-pick-inline">
                {TYPES.map((t) => (
                  <label key={t} className={`nc-pick-chip${types.includes(t) ? ' is-on' : ''}`}>
                    <input type="checkbox" className="nc-check" checked={types.includes(t)} onChange={() => setTypes((ts) => ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t])} />
                    <span>{t}</span>
                  </label>
                ))}
              </div>
              <select className="nc-input" style={{ width: 140 }} value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} title="排序">
                {SORTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input className="nc-input nc-lt-search" value={kw} placeholder="搜索单号 / 对象 / 申请人"
                onChange={(e) => { setKw(e.target.value); setPage(1); }} />
              <Btn onClick={() => { setKw(''); setLv('all'); setStF('all'); setTypes(TYPES); setSort(SORTS[0]); setPage(1); }}>重置</Btn>
            </>}
          />
        </div>
        <div className="nc-issuestrip" style={{ padding: '0 16px 10px' }}>
          <span className="nc-issue is-red">已超 24 小时 {todo.filter((r) => r.overdueH >= 24).length} 单</span>
          <span className="nc-issue is-orange">安许 60 天内到期 · 关联投标须加急</span>
          <span className="nc-issue is-gold">批量通过仅适用于「借阅申请 / 付款申请」</span>
        </div>
        <DataTable
          cols={cols} rows={paged} rowKey={(r) => r.id} minWidth={1280}
          empty="没有符合筛选条件的审批单（审批由合同 / 变更 / 付款 / 开票 / 用章业务单据触发，无需手工新建）"
          emptyCta={<Btn size="sm" onClick={() => { setTypes(['报价审批', '合同审批', '项目立项', '付款申请', '变更审批']); setStF('all'); setLv('all'); setKw(''); }}>清空筛选条件</Btn>}
          selectable selected={picked} onSelectAll={setPicked} onSelectRow={(id) => setPicked((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])}
          foot={<TableFoot total={rows.length} filtered={filtered.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} extra={<span className="nc-tiny nc-muted"> · 可批量通过 {batchApprovable.length + batchEligible.length} 单</span>} />}
        />
      </Card>

      {/* ============ 详情抽屉（层类型判定 §一：信息量大 + 需保留列表上下文 → 抽屉）============ */}
      {detail && (
        <Drawer open width={800} title={`审批详情 · ${detail.id}`}
          sub={<>{detail.obj} · 发起人 {detail.ap} · {detail.time}</>}
          onClose={() => setDetail(null)}
          foot={detail.status === '待审批' || detail.status === '审批中' ? (
            <>
              <Btn danger disabled={!isApprover} title={noPermTitle} onClick={() => { setReject(detail); setRejectTxt(''); }}>退回（必填原因）</Btn>
              <Btn disabled={!isApprover} title={noPermTitle} onClick={() => toast('已转交处理')}>转交他人</Btn>
              <Btn onClick={() => urgeRow(detail)}>催办</Btn>
              <Btn kind="primary" disabled={!isApprover} title={noPermTitle} onClick={() => setPassOpen(detail)}>通过并流转</Btn>
            </>
          ) : detail.status === '已退回' || detail.status === '已撤回' || detail.status === '已终止' ? (
            <>
              <Btn onClick={() => setVoid(detail)} danger>作废（需原因）</Btn>
              <Btn kind="primary" onClick={() => { setResubmit(detail); setResubmitTxt(''); }}>重新提交</Btn>
            </>
          ) : <Btn onClick={() => setDetail(null)}>关闭</Btn>}>
          <div className="nc-approve-hd">
            <div>
              <h3 style={{ margin: 0, fontSize: 16 }}>{detail.obj}</h3>
              <div className="nc-tiny nc-muted" style={{ marginTop: 4 }}>
                {(() => { const d = refDrill(detail.ref); return d
                  ? <EntityLink target={d.target} id={d.id} go={go} title={`下钻到${d.label}详情`}>{detail.ref}</EntityLink>
                  : detail.ref; })()} · 发起人 {detail.ap} · {detail.time}
              </div>            </div>
            <Tag tone={stTone(detail.status) as 'orange'}>{detail.status}</Tag>
          </div>

          <div className="nc-money-row">
            {[
              { k: '审批金额', v: <Money v={detail.amt} role={role} /> },
              { k: '审批类型', v: detail.type },
              { k: '分级路由', v: detail.level },
              // M30：node 为 0-based 下标且含「发起」节点，原「第 N 节点」口径与进度条 / toast 不一致
              { k: '当前节点', v: `第 ${Math.max(1, detail.node)}/${apprChain(detail).length - 1} 节点 · ${apprChain(detail)[detail.node]?.label || '—'}` },
            ].map((m) => <div key={m.k} className="nc-money-cell"><span className="nc-tiny nc-muted">{m.k}</span><b className="num">{m.v}</b></div>)}
          </div>

          <Field label="审批链（分级自动路由）" span={4}>
            <div className="nc-appr-flow">
              {apprChain(detail).map((n, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className={`nc-appr-line${apprChain(detail)[i - 1].st === 'done' ? ' is-done' : ''}`} />}
                  <div className={`nc-appr-node${n.st === 'done' ? ' is-done' : n.st === 'cur' ? ' is-cur' : n.st === 'rejected' ? ' is-rejected' : ''}`}>
                    <div className="nc-appr-node-main">
                      <div className="nc-appr-dot">{n.st === 'done' ? <Ico n="check" size={12} /> : n.st === 'rejected' ? <Ico n="close" size={12} /> : i + 1}</div>
                      <div className="nc-appr-name">{n.label}</div>
                      <div className="nc-appr-who">{n.who}</div>
                      <div className="nc-appr-time num">{n.time}</div>
                      {n.op && <div className="nc-appr-op">“{n.op}”</div>}
                      {n.st === 'cur' && <div className="nc-appr-pending">待处理</div>}
                    </div>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </Field>

          <Field label="业务上下文（提交时留档）" span={4}>
            <div className="nc-ctx-grid">
              <div className="nc-ctx"><span>客户 / 供应商</span><b>{detail.obj.includes('万达') ? '昆明万达广场商业管理有限公司' : detail.obj.includes('楚雄') ? '楚雄州人民医院' : '—'}</b></div>
              <div className="nc-ctx"><span>关联项目</span><b>{detail.ref.split(' ')[0]}</b></div>
              <div className="nc-ctx"><span>税率口径</span><b>含税 · 9%</b></div>
              <div className="nc-ctx"><span>税额</span><Money v={Math.round(detail.amt * 9 / 109)} role={role} /></div>
              <div className="nc-ctx"><span>含税 / 不含税</span><span className="num"><Money v={detail.amt} role={role} wan /> / <Money v={Math.round(detail.amt / 1.09)} role={role} wan /></span></div>
              <div className="nc-ctx"><span>触发原因</span><b>{detail.type === '报价审批' ? '整体浮率 <15% 或 总额 ≥50 万' : detail.type === '付款申请' ? '采购付款分级：≥30 万需分管副总' : '金额触发分级路由'}</b></div>
            </div>
          </Field>

          {/* 报价审批内嵌：报价明细（快照） */}
          {detail.type === '报价审批' && (
            <Field label="报价明细（快照）" span={4}>
              <table className="nc-tbl" style={{ minWidth: 620 }}>
                <thead><tr><th style={{ width: 110 }}>业务类型</th><th>内容</th><th style={{ width: 110 }}>数量</th><th style={{ width: 150, textAlign: 'right' }}>上浮后金额</th></tr></thead>
                <tbody>
                  {QUOTE_SNAP.map(([bt, name, qty, amt]) => (
                    <tr key={name}>
                      <td><Tag tone="gray">{bt}</Tag></td>
                      <td>{name}</td>
                      <td className="is-num num">{qty}</td>
                      <td className="is-num num">{fmt(amt)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="nc-tbl-sum">
                  <td colSpan={3}>合计（含税）</td>
                  <td className="is-num num">{fmt(QUOTE_SNAP.reduce((a, r) => a + r[3], 0))}</td>
                </tr></tfoot>
              </table>
            </Field>
          )}

          {/* 报价审批内嵌：历史同类项目价格参照 */}
          {detail.type === '报价审批' && (() => {
            const snapTotal = QUOTE_SNAP.reduce((a, r) => a + r[3], 0);
            const eng = snapTotal - QUOTE_SNAP[2][3];
            const unit = eng / 26000;
            const mean = REF_HIST.reduce((a, r) => a + r.up, 0) / REF_HIST.length;
            const dev = ((unit - mean) / mean) * 100;
            const tone = Math.abs(dev) <= 10 ? 'is-green' : Math.abs(dev) <= 20 ? 'is-orange' : 'is-red';
            return (
              <Field label="历史同类项目价格参照" span={4}>
                {REF_HIST.map((r) => (
                  <div key={r.name} className="nc-refrow">
                    <div className="nc-refname">{r.name}<div className="nc-cell-sub">{r.date} 成交 {fmt(r.amt)} · {r.area.toLocaleString('en-US')} ㎡</div></div>
                    <span className="nc-refval num">{r.up.toFixed(1)} 元/㎡</span>
                  </div>
                ))}
                <div className="nc-refrow is-cur">
                  <div className="nc-refname"><b>本单工程费单方</b>（不含主机设备，{fmt(eng)} ÷ 26,000㎡）</div>
                  <span className="nc-refval num" style={{ color: 'var(--c-primary)', fontWeight: 700 }}>{unit.toFixed(1)} 元/㎡</span>
                </div>
                <div className={`nc-warnbox ${tone}`}>
                  <Ico n="check" size={14} style={{ color: 'var(--c-success-deep)' }} /> 本单工程费单方 <b>{unit.toFixed(1)} 元/㎡</b>，同类历史均值 <b>{mean.toFixed(1)} 元/㎡</b>，偏离 <b className="num">{dev > 0 ? '+' : ''}{dev.toFixed(1)}%</b>，
                  {Math.abs(dev) <= 10 ? '处于合理区间（±10%）。' : Math.abs(dev) <= 20 ? '建议复核定价依据。' : '超出 ±20%，需重点说明定价依据。'}
                </div>
              </Field>
            );
          })()}

          {['已退回', '已撤回', '已终止'].includes(detail.status) && (
            <div className="nc-warnbox is-danger">
              <b>{detail.status === '已终止' ? '作废原因' : detail.status === '已撤回' ? '撤回原因' : '退回原因'}</b>
              <div>{detail.reason || '—'}</div>
              {/* 评审 B2：原「已退回」仅展示原因、无任何出口，形成流程断点 */}
              <div className="nc-cell-sub" style={{ marginTop: 8 }}>
                可在下方「重新提交」修改后再次发起（审批链重置至第 1 节点），或「作废」终止本单。
              </div>
            </div>
          )}

          <Field label="审批意见" span={4}>
            <textarea className="nc-input" rows={3} maxLength={200} value={opinion} onChange={(e) => setOpinion(e.target.value)}
              placeholder="选填 · 通过时可填写意见，将展示在审批链中；退回时必填且不超过 200 字" />
          </Field>
        </Drawer>
      )}

      {/* ============ 退回 ============ */}
      <Modal open={!!reject} title={`退回审批 · ${reject?.id || ''}`} width={480} onClose={() => setReject(null)}
        foot={<><Btn onClick={() => setReject(null)}>取消</Btn>
          <Btn kind="primary" danger disabled={!rejectTxt.trim()} title={rejectTxt.trim() ? undefined : '请填写退回理由（必填）'} onClick={() => reject && rejectRow(reject, rejectTxt)}>确认退回</Btn></>}>
        <div className="nc-warnbox is-warn">
          <b>退回将回到发起人节点</b>
          <div>发起人修改后可重新提交，审批链从第 1 节点重新开始；退回原因将同步推送给发起人及其部门负责人。</div>
        </div>
        <Field label="退回原因" req note={`${rejectTxt.length}/200 字 · 必填`}>
          <textarea className="nc-input" rows={4} maxLength={200} value={rejectTxt} onChange={(e) => setRejectTxt(e.target.value)} placeholder="如：变更依据不足，需补充发包方书面确认函" />
        </Field>
      </Modal>

      {/* ============ 通过二次确认（含流转目标） ============ */}
      {passOpen && (() => {
        const c = chainOf(passOpen.type, passOpen.amt, passOpen.level);
        const nextIdx = Math.min(passOpen.node + 1, c.length - 1);
        const allDone = passOpen.node + 1 >= c.length;
        return (
          <Modal open title="确认通过" width={480} onClose={() => setPassOpen(null)}
            foot={<><Btn onClick={() => setPassOpen(null)}>取消</Btn><Btn kind="primary" onClick={() => passRow(passOpen, opinion)}>确定</Btn></>}>
            <div style={{ fontSize: 13, lineHeight: 1.8 }}>
              确认通过本单？
              <div style={{ marginTop: 4 }}>意见：<b>{opinion.trim() ? opinion.trim() : '（未填写）'}</b></div>
              <div className="nc-cell-sub" style={{ marginTop: 8 }}>
                {allDone
                  ? '通过后审批链全部完成，单据流转至归档。'
                  : `通过后流转至 ${c[nextIdx].label}（${c[nextIdx].role}）${nextIdx === c.length - 1 ? '终审' : '审批'}。`}
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* ============ 批量通过 ============ */}
      <Modal open={batchOpen} title={`批量通过（已选 ${picked.length} 单）`} width={640} onClose={() => setBatchOpen(false)}
        foot={<><Btn onClick={() => setBatchOpen(false)}>取消</Btn>
          <Btn kind="primary" loading={batchRun} disabled={!batchTxt.trim()} title={batchTxt.trim() ? undefined : '批量通过须填写统一审批意见（必填）'} onClick={() => {
            const okIds = picked.filter((id) => {
              const r = rows.find((x) => x.id === id);
              return !!r && batchApprovable.some((b) => b.id === id);
            });
            /* 批量通过同样按审批链推进节点（与单条通过同规则）：
               未到链尾 → 状态「审批中」并流转下一节点；到链尾 → 「已通过」归档。
               此前直接置「已通过」，会把 2~3 节点单据一键终审，绕过后续审批人。 */
            let doneCnt = 0; let nextCnt = 0; let bizCnt = 0;
            okIds.forEach((id) => {
              const x = rows.find((y) => y.id === id);
              if (!x) return;
              const c = chainOf(x.type, x.amt, x.level);
              const allDone = x.node + 1 >= c.length;
              const next = Math.min(x.node + 1, c.length - 1);
              if (allDone) doneCnt += 1; else nextCnt += 1;
              setApprovalState(id, {
                node: next,
                status: allDone ? '已通过' : next > 0 ? '审批中' : '待审批',
                reason: batchTxt.trim(),
              } as Partial<Row>);
              if (syncBizFromApproval({ type: x.type, ref: x.ref, status: '已通过' }, allDone)) bizCnt += 1;
            });
            setPicked(picked.filter((id) => !okIds.includes(id)));
            setBatchRun(true);
            window.setTimeout(() => {
              setBatchRun(false);
              setBatchOpen(false); setBatchTxt('');
              toast(`批量通过 ${okIds.length} 单（终审归档 ${doneCnt} 单 · 流转下一节点 ${nextCnt} 单 · 回写业务单 ${bizCnt} 单）；其余不符条件的单据未处理`);
            }, 800);
          }}>{batchRun ? '提交中…' : '确认批量通过'}</Btn></>}>
        <div className="nc-warnbox is-warn">
          <b>批量通过仅适用于「借阅申请 / 付款申请」</b>
          <div>报价 / 合同 / 变更类审批因涉及明细核对与六条款校验，必须逐单审批。</div>
          <div style={{ marginTop: 6 }}>批量通过与单条通过<b>同规则</b>：按审批链推进一个节点——未到链尾则转「审批中」并流转下一审批人，到链尾才置「已通过」归档，不会一键终审。</div>
        </div>
        <table className="nc-tbl" style={{ minWidth: 560 }}>
          <thead><tr><th>审批单</th><th>类型</th><th style={{ width: 120, textAlign: 'right' }}>金额</th><th style={{ width: 90 }}>可否批量</th></tr></thead>
          <tbody>
            {picked.map((id) => {
              const r = rows.find((x) => x.id === id);
              if (!r) return null;
              const can = batchApprovable.some((b) => b.id === id);
              return <tr key={id}><td className="num">{id}</td><td>{r.type}</td><td className="is-num num">{r.amt ? fmtWan(r.amt) : '—'}</td><td>{can ? <Tag tone="green">可</Tag> : <Tag tone="gray">须逐单</Tag>}</td></tr>;
            })}
          </tbody>
        </table>
        <div style={{ marginTop: 12 }}>
          <Field label="批量审批意见" req><textarea className="nc-input" rows={3} value={batchTxt} onChange={(e) => setBatchTxt(e.target.value)} placeholder="批量通过意见，将写入每单审批意见" /></Field>
        </div>
      </Modal>

      {/* ============ 评审 B2：已退回 → 重新提交 ============ */}
      <Modal open={!!resubmit} title={`重新提交审批 · ${resubmit?.id || ''}`} width={480} onClose={() => setResubmit(null)}
        foot={<><Btn onClick={() => setResubmit(null)}>取消</Btn>
          <Btn kind="primary" disabled={resubmitTxt.trim().length < 4} title={resubmitTxt.trim().length < 4 ? '重新提交说明不少于 4 个字（退回单据须写明整改内容）' : undefined} onClick={() => resubmit && resubmitRow(resubmit, resubmitTxt)}>确认重新提交</Btn></>}>
        <div className="nc-warnbox is-warn">
          <b>审批链将重置至第 1 节点</b>
          <div>重新提交后单据回到「待审批」，原已通过节点的意见保留在审批历史中，但需重新逐节点流转。</div>
        </div>
        {resubmit?.status === '已退回' && (
          <div className="nc-warnbox is-danger" style={{ marginTop: 8 }}>
            <b>上次退回原因（务必先处理）</b>
            <div>{resubmit.reason || '—'}</div>
          </div>
        )}
        <Field label="修改说明" req note={`${resubmitTxt.length}/200 字 · 必填，说明针对退回原因做了哪些修改`}>
          <textarea className="nc-input" rows={4} maxLength={200} value={resubmitTxt} onChange={(e) => setResubmitTxt(e.target.value)} placeholder="如：已补充发包方书面确认函与变更依据附件" />
        </Field>
      </Modal>

      {/* ============ 评审 B2：已退回 → 作废（终态，原因必填） ============ */}
      <ConfirmModal
        open={!!voidM} onClose={() => setVoid(null)} okText="确认作废"
        title={`作废审批单 ${voidM?.id ?? ''}`}
        reason reasonLabel="作废原因"
        impact={voidM && <>将作废审批单 <b>{voidM.id}</b>（{voidM.type} · {voidM.obj}）。<br />作废为<b>终态，不可恢复</b>；关联业务单（{voidM.ref}）将同步标记为「审批作废」，需重新发起。</>}
        onOk={(r) => voidM && voidRow(voidM, r)}
      />

      {/* ============ 评审 B3：发起人撤回 ============ */}
      <ConfirmModal
        open={!!withdraw} onClose={() => setWithdraw(null)} okText="确认撤回"
        title={`撤回审批单 ${withdraw?.id ?? ''}`}
        reason reasonLabel="撤回原因"
        impact={withdraw && <>将撤回 <b>{withdraw.id}</b>（当前第 {withdraw.node + 1} 节点）。<br />撤回后单据回到发起人处可修改，<b>已产生的审批意见保留留痕</b>；修改后可重新提交，审批链重置至第 1 节点。</>}
        onOk={(r) => withdraw && withdrawRow(withdraw, r)}
      />
    </>
  );
}
