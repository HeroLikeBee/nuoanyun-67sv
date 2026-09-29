// 诺安云 6.0 · 财务与发票 · 应收应付台账
// 统一收付款主体（2026-09-28 评审 P1）：期次级台账，替代应收散落在合同期次 / 项目资金台账 / 驾驶舱账龄
// 三处各自表达的局面——此处是权威台账，其余视图为只读引用，不再各自维护口径。
// 应收 = RECEIVABLES（销售/维保/检测合同期次）；应付 = PAYABLES（采购/分包合同期次，金额与合同勾稽可口算）。
import React, { useState } from 'react';
import {
  Banner, Btn, Card, DataTable, Drawer, EntityLink, Field, KvGrid, ListToolbar, Modal,
  Money, Op, OpSep, PageHead, TableFoot, Tag, Tabs, Tile, Timeline, Tip, useToast, type Col, type TagTone, pressProps,
} from '../components/ui';
import { PAYABLES, RECEIVABLES, TODAY, can, canSeeMoney, fmtWan } from '../components/data';
import { Ico } from '../components/icons';
import { getUserName } from '../components/export';

type Ar = (typeof RECEIVABLES)[number];
type Ap = (typeof PAYABLES)[number];

const AR_TONE: Record<string, TagTone> = { 已开票未到账: 'orange', 可请款: 'blue', 未到期: 'gray', 已结清: 'green' };
const AP_TONE: Record<string, TagTone> = { 待付: 'orange', 部分付: 'blue', 未到期: 'gray', 已付清: 'green' };
const dayDiff = (a: string, b: string) => Math.round((new Date(`${a}T00:00:00`).getTime() - new Date(`${b}T00:00:00`).getTime()) / 86400000);

export default function FundPage({ go, role }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  const [tab, setTab] = useState<'ar' | 'ap'>('ar');
  const [arRows, setArRows] = useState<Ar[]>(() => RECEIVABLES.map((r) => ({ ...r })));
  const [apRows, setApRows] = useState<Ap[]>(() => PAYABLES.map((r) => ({ ...r })));
  const [stF, setStF] = useState('all');
  const [kw, setKw] = useState('');
  const [detail, setDetail] = useState<{ kind: 'ar' | 'ap'; row: Ar | Ap } | null>(null);
  const [recvOpen, setRecvOpen] = useState<Ar | null>(null);
  const [recvDate, setRecvDate] = useState(TODAY);
  const [payOpen, setPayOpen] = useState<Ap | null>(null);
  const [payAmt, setPayAmt] = useState(0);
  const [payDate, setPayDate] = useState(TODAY);
  const [payErr, setPayErr] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const canWrite = can(role, 'fund');
  const see = canSeeMoney(role);

  /* ===== 统计（瓦片 = 聚合口径，表格 = 期次明细；金额统一 A-02 脱敏） ===== */
  const arRemain = arRows.reduce((a, b) => a + b.amt, 0);
  const arOverdue = arRows.filter((r) => r.overdueDays > 0);
  const arOverdueAmt = arOverdue.reduce((a, b) => a + b.amt, 0);
  const apRemain = apRows.reduce((a, b) => a + (b.amt - b.paidAmt), 0);
  const apOverdueAmt = apRows.filter((r) => r.overdueDays > 0).reduce((a, b) => a + (b.amt - b.paidAmt), 0);

  const arStatuses = ['已开票未到账', '可请款', '未到期', '已结清'];
  const apStatuses = ['待付', '部分付', '未到期', '已付清'];
  const statuses = tab === 'ar' ? arStatuses : apStatuses;
  /* 应收 / 应付各一套过滤链：Ar 与 Ap 结构不同，不共用联合类型，避免 DataTable rows 泛型不兼容 */
  const arFiltered = arRows.filter((r) => (stF === 'all' || r.status === stF) && (!kw || r.id.includes(kw) || r.contract.includes(kw) || r.customer.includes(kw)));
  const apFiltered = apRows.filter((r) => (stF === 'all' || r.status === stF) && (!kw || r.id.includes(kw) || r.contract.includes(kw) || r.supplier.includes(kw)));
  const arPaged = arFiltered.slice((page - 1) * pageSize, page * pageSize);
  const apPaged = apFiltered.slice((page - 1) * pageSize, page * pageSize);
  const arTabBase = arRows.filter((r) => stF === 'all' || r.status === stF);
  const apTabBase = apRows.filter((r) => stF === 'all' || r.status === stF);

  const patchAr = (id: string, p: Partial<Ar>, msg: string) => {
    setArRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
    setDetail((d) => (d && d.kind === 'ar' && d.row.id === id ? { ...d, row: { ...d.row, ...p } } : d));
    toast(msg);
  };
  const patchAp = (id: string, p: Partial<Ap>, msg: string) => {
    setApRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
    setDetail((d) => (d && d.kind === 'ap' && d.row.id === id ? { ...d, row: { ...d.row, ...p } } : d));
    toast(msg);
  };

  const arCols: Col<Ar>[] = [
    { key: 'id', title: '期次号', width: 100, hide: true, render: (r) => <span className="num nc-link" onClick={() => setDetail({ kind: 'ar', row: r })} {...pressProps(() => setDetail({ kind: 'ar', row: r }))}>{r.id}</span> },
    { key: 'contract', title: '合同', sticky: 'left', width: 130, render: (r) => <EntityLink target="contract" id={r.contract} go={go} title="下钻到合同详情">{r.contract}</EntityLink> },
    { key: 'customer', title: '客户 / 期次', width: 230, render: (r) => (
      <span><b style={{ display: 'block' }}>{r.customer}</b><span className="nc-cell-sub">{r.id} · {r.node}</span></span>
    ) },
    { key: 'dueDate', title: '到期日', width: 106, align: 'right', render: (r) => <span className="num">{r.dueDate}</span> },
    { key: 'amt', title: '应收金额', width: 116, align: 'right', render: (r) => <Money v={r.amt} role={role} /> },
    {
      key: 'overdueDays', title: <>逾期 <Tip w={280} text="静态演示值：按期次到期日相对当前账期（2026-09-20）计算；登记收款后状态变更。" /></>, width: 88, align: 'right',
      render: (r) => r.overdueDays > 0 ? <span className="num" style={{ color: 'var(--c-danger)' }}>{r.overdueDays} 天</span> : <span className="num" style={{ color: 'var(--ink-3)' }}>—</span>,
    },
    { key: 'status', title: '状态', width: 120, render: (r) => <Tag tone={AR_TONE[r.status] || 'gray'}>{r.status}</Tag> },
    {
      key: 'op', title: '操作', width: 130, render: (r) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Op onClick={() => setDetail({ kind: 'ar', row: r })}>详情</Op>
          {canWrite && r.status !== '已结清' && <><OpSep /><Op onClick={() => { setRecvOpen(r); setRecvDate(TODAY); }}>登记收款</Op></>}
        </span>
      ),
    },
  ];

  const apCols: Col<Ap>[] = [
    { key: 'id', title: '期次号', width: 100, hide: true, render: (r) => <span className="num nc-link" onClick={() => setDetail({ kind: 'ap', row: r })} {...pressProps(() => setDetail({ kind: 'ap', row: r }))}>{r.id}</span> },
    { key: 'contract', title: '合同', sticky: 'left', width: 130, render: (r) => <EntityLink target="contract" id={r.contract} go={go} title="下钻到合同详情">{r.contract}</EntityLink> },
    { key: 'supplier', title: '供应商 / 期次', width: 230, render: (r) => (
      <span><b style={{ display: 'block' }}>{r.supplier}</b><span className="nc-cell-sub">{r.id} · {r.node}</span></span>
    ) },
    { key: 'dueDate', title: '付款期限', width: 106, align: 'right', render: (r) => <span className="num">{r.dueDate}</span> },
    { key: 'amt', title: '应付金额', width: 112, align: 'right', render: (r) => <Money v={r.amt} role={role} /> },
    { key: 'paidAmt', title: '已付', width: 104, align: 'right', render: (r) => <Money v={r.paidAmt} role={role} /> },
    {
      key: 'remain', title: '未付余额', width: 112, align: 'right',
      render: (r) => <Money v={r.amt - r.paidAmt} role={role} />,
    },
    {
      key: 'overdueDays', title: <>逾期 <Tip w={280} text="逾期未付部分计入应付逾期余额；登记付款付清后自动消除。" /></>, width: 88, align: 'right',
      render: (r) => r.overdueDays > 0 ? <span className="num" style={{ color: 'var(--c-danger)' }}>{r.overdueDays} 天</span> : <span className="num" style={{ color: 'var(--ink-3)' }}>—</span>,
    },
    { key: 'status', title: '状态', width: 92, render: (r) => <Tag tone={AP_TONE[r.status] || 'gray'}>{r.status}</Tag> },
    {
      key: 'op', title: '操作', width: 130, render: (r) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Op onClick={() => setDetail({ kind: 'ap', row: r })}>详情</Op>
          {canWrite && r.status !== '已付清' && r.status !== '未到期' && <><OpSep /><Op onClick={() => { setPayOpen(r); setPayAmt(r.amt - r.paidAmt); setPayDate(TODAY); setPayErr(''); }}>登记付款</Op></>}
        </span>
      ),
    },
  ];

  const doRecv = () => {
    if (!recvOpen) return;
    patchAr(recvOpen.id, { status: '已结清' }, `${recvOpen.id} 已登记收款（${getUserName(role)} · ${recvDate}），台账与合同收款记录同步`);
    setRecvOpen(null);
  };

  const doPay = () => {
    if (!payOpen) return;
    const remain = payOpen.amt - payOpen.paidAmt;
    if (payAmt <= 0 || payAmt > remain) { setPayErr(`本次付款须大于 0 且不超过未付余额 ${remain.toLocaleString('en-US')} 元`); return; }
    const paid = payOpen.paidAmt + payAmt;
    patchAp(payOpen.id, { paidAmt: paid, status: paid >= payOpen.amt ? '已付清' : '部分付', overdueDays: paid >= payOpen.amt ? 0 : payOpen.overdueDays },
      `${payOpen.id} 已登记付款，${paid >= payOpen.amt ? '期次付清' : '累计部分付'}`);
    setPayOpen(null);
  };

  return (
    <>
      <PageHead
        crumbs={['财务', '应收应付台账']}
        title="应收应付台账"
        badges={<><Tag tone="blue">应收 {arRows.length} 期</Tag><Tag tone="gray">应付 {apRows.length} 期</Tag></>}
        sub="统一收付款主体：应收 = 销售/维保/检测合同期次，应付 = 采购/分包合同期次；登记后与合同收款/付款记录同步"
      />

      <div className="nc-tiles nc-tiles-5">
        <Tile label="应收余额" value={see ? fmtWan(arRemain) : '—'} tone="green" sub={`${arRows.length} 期 · 逾期 ${arOverdue.length} 期`} />
        <Tile label="应收逾期" value={see ? fmtWan(arOverdueAmt) : '—'} tone={arOverdueAmt > 0 ? 'red' : undefined} sub="已开票未到账期次为主" />
        <Tile label="应付余额" value={see ? fmtWan(apRemain) : '—'} sub="应付金额 − 已付" />
        <Tile label="应付逾期" value={see ? fmtWan(apOverdueAmt) : '—'} tone={apOverdueAmt > 0 ? 'orange' : undefined} sub="逾期期次的未付部分" />
        <Tile label="净头寸" value={see ? fmtWan(arRemain - apRemain) : '—'} sub="应收余额 − 应付余额" />
      </div>

      <Card flush>
        <div style={{ padding: '12px 16px 0' }}>
          <ListToolbar
            rows={[
              {
                label: '状态', value: stF, onChange: (k) => { setStF(k); setPage(1); },
                items: [
                  { key: 'all', label: '全部状态', cnt: (tab === 'ar' ? arRows : apRows).length },
                  ...statuses.map((s) => ({ key: s, label: s, cnt: (tab === 'ar' ? arRows : apRows).filter((r) => r.status === s).length })),
                ],
              },
            ]}
            search={{ value: kw, onChange: (v) => { setKw(v); setPage(1); }, placeholder: `搜索期次号 / 合同号 / ${tab === 'ar' ? '客户' : '供应商'}` }}
            onReset={() => { setKw(''); setStF('all'); setPage(1); }}
          />
        </div>
        <div style={{ padding: '0 16px 12px' }}>
          <Tabs value={tab} onChange={(k: string) => { setTab(k as 'ar' | 'ap'); setStF('all'); setPage(1); }} items={[
            { key: 'ar', label: `应收（${arRows.length}）` },
            { key: 'ap', label: `应付（${apRows.length}）` },
          ]} />
        </div>
        {tab === 'ar' ? (
          <DataTable cols={arCols} rows={arPaged} rowKey={(r) => r.id} minWidth={1080} onRowClick={(r) => setDetail({ kind: 'ar', row: r })}
            empty="没有符合筛选条件的应收期次"
            foot={<TableFoot total={arTabBase.length} filtered={arFiltered.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />} />
        ) : (
          <DataTable cols={apCols} rows={apPaged} rowKey={(r) => r.id} minWidth={1180} onRowClick={(r) => setDetail({ kind: 'ap', row: r })}
            empty="没有符合筛选条件的应付期次"
            foot={<TableFoot total={apTabBase.length} filtered={apFiltered.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />} />
        )}
      </Card>

      {/* ============ 期次详情 ============ */}
      <Drawer open={!!detail} width={680} onClose={() => setDetail(null)} title={`期次详情 · ${detail?.row.id || ''}`}
        foot={detail && detail.kind === 'ar' && canWrite && (detail.row as Ar).status !== '已结清' && (
          <><Btn onClick={() => setDetail(null)}>关闭</Btn>
            <Btn kind="primary" onClick={() => { setRecvOpen(detail.row as Ar); setRecvDate(TODAY); }}>登记收款</Btn></>
        )}>
        {detail?.kind === 'ar' && (() => {
          const r = detail.row as Ar;
          return (
            <>
              <Field label="应收期次" span={4}>
                <KvGrid cols={2} rows={[
                  { k: '期次号', v: r.id },
                  { k: '状态', v: <Tag tone={AR_TONE[r.status] || 'gray'}>{r.status}</Tag> },
                  { k: '关联合同', v: <EntityLink target="contract" id={r.contract} go={go} title="下钻到合同详情">{r.contract}</EntityLink> },
                  { k: '客户', v: r.customer },
                  { k: '期次', v: r.node },
                  { k: '到期日', v: <span className="num">{r.dueDate}</span> },
                  { k: '应收金额', v: <Money v={r.amt} role={role} /> },
                  { k: '逾期', v: r.overdueDays > 0 ? <span className="num" style={{ color: 'var(--c-danger)' }}>{r.overdueDays} 天</span> : '—' },
                ]} />
              </Field>
              <Field label="轨迹" span={4}>
                <Timeline items={[
                  { date: r.dueDate, text: `期次到期 · ${r.node}`, tone: r.overdueDays > 0 ? 'red' : 'gray' },
                  ...(r.status === '已结清' ? [{ date: TODAY, text: '收款已登记，台账与合同收款记录同步', tone: 'ok' as const }] : []),
                  ...(r.status === '已开票未到账' ? [{ date: TODAY, text: '发票已开出，款项未到账——账龄持续计算', tone: 'gray' as const }] : []),
                ]} />
              </Field>
            </>
          );
        })()}
        {detail?.kind === 'ap' && (() => {
          const r = detail.row as Ap;
          return (
            <>
              <Field label="应付期次" span={4}>
                <KvGrid cols={2} rows={[
                  { k: '期次号', v: r.id },
                  { k: '状态', v: <Tag tone={AP_TONE[r.status] || 'gray'}>{r.status}</Tag> },
                  { k: '关联合同', v: <EntityLink target="contract" id={r.contract} go={go} title="下钻到合同详情">{r.contract}</EntityLink> },
                  { k: '供应商', v: r.supplier },
                  { k: '期次', v: r.node },
                  { k: '付款期限', v: <span className="num">{r.dueDate}</span> },
                  { k: '应付金额', v: <Money v={r.amt} role={role} /> },
                  { k: '已付 / 未付', v: <span className="num"><Money v={r.paidAmt} role={role} /> / <Money v={r.amt - r.paidAmt} role={role} /></span> },
                  { k: '逾期', v: r.overdueDays > 0 ? <span className="num" style={{ color: 'var(--c-danger)' }}>{r.overdueDays} 天</span> : '—' },
                ]} />
              </Field>
              <Field label="轨迹" span={4}>
                <Timeline items={[
                  { date: r.dueDate, text: `付款期限 · ${r.node}`, tone: r.overdueDays > 0 ? 'red' : 'gray' },
                  ...(r.paidAmt > 0 ? [{ date: TODAY, text: `已累计付款（演示值 ${r.paidAmt.toLocaleString('en-US')} 元），台账与合同付款记录同步`, tone: 'ok' as const }] : []),
                  ...(r.status === '已付清' ? [{ date: TODAY, text: '期次付清，逾期自动消除', tone: 'ok' as const }] : []),
                ]} />
              </Field>
            </>
          );
        })()}
      </Drawer>

      {/* ============ 登记收款 ============ */}
      <Modal open={!!recvOpen} title={`登记收款 · ${recvOpen?.id || ''}`} width={520} onClose={() => setRecvOpen(null)}
        foot={<><Btn onClick={() => setRecvOpen(null)}>取消</Btn>
          <Btn kind="primary" onClick={doRecv}>确认登记</Btn></>}>
        {recvOpen && (
          <>
            <Banner tone="info">收款登记后<b>期次状态置为已结清</b>；合同收款计划与项目资金台账为只读引用，不在此重复登记。</Banner>
            <KvGrid rows={[
              { k: '客户 / 期次', v: `${recvOpen.customer} · ${recvOpen.node}` },
              { k: '关联合同', v: recvOpen.contract },
              { k: '应收金额', v: <Money v={recvOpen.amt} role={role} /> },
            ]} />
            <Field label="收款日期" req><input className="nc-input" type="date" value={recvDate} onChange={(e) => setRecvDate(e.target.value)} /></Field>
          </>
        )}
      </Modal>

      {/* ============ 登记付款 ============ */}
      <Modal open={!!payOpen} title={`登记付款 · ${payOpen?.id || ''}`} width={520} onClose={() => setPayOpen(null)}
        foot={<><Btn onClick={() => setPayOpen(null)}>取消</Btn>
          <Btn kind="primary" disabled={!payAmt || !!payErr} onClick={doPay}>确认登记</Btn></>}>
        {payOpen && (
          <>
            <Banner tone="info">支持部分付款：累计付款达到应付金额后期次自动<b>付清</b>，逾期同步消除；超付会被硬拦截。</Banner>
            {payErr && <Banner tone="danger">{payErr}</Banner>}
            <KvGrid rows={[
              { k: '供应商 / 期次', v: `${payOpen.supplier} · ${payOpen.node}` },
              { k: '应付金额', v: <Money v={payOpen.amt} role={role} /> },
              { k: '已付 / 未付', v: <span className="num">{payOpen.paidAmt.toLocaleString('en-US')} / {(payOpen.amt - payOpen.paidAmt).toLocaleString('en-US')} 元</span> },
            ]} />
            <Field label="本次付款金额（元）" req err={payErr || undefined}>
              <input className="nc-input" type="number" min={0} value={payAmt || ''} onChange={(e) => { setPayAmt(Number(e.target.value)); setPayErr(''); }} />
            </Field>
            <Field label="付款日期" req><input className="nc-input" type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} /></Field>
          </>
        )}
      </Modal>
    </>
  );
}
