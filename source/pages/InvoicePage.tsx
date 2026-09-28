// 诺安云 6.0 · 发票管理 · PRD §20
import React, { useMemo, useState } from 'react';
import {
  Alert, Btn, Card, DataTable, Drawer, Field, KvGrid, ListToolbar, Modal, Money,
  EntityLink, Op, OpSep, PageHead, Progress, TableFoot, Tag, Tabs, Tile, Timeline, Tip, usePaged, useToast, type Col, pressProps,
  ContractPicker,} from '../components/ui';
import { CONTRACTS, CUSTOMERS, INVOICES, TODAY, calcTax, canSeeMoney, fmt, fmtWan } from '../components/data';
import { Ico } from '../components/icons';
import { ExportButton, useExport, getUserName, ExportDialog, type ExportField } from '../components/export';

/** 可开票合同 = 非框架协议（模块级常量，选择器把它当 useMemo 依赖） */
const INV_CONTRACTS = CONTRACTS.filter((c) => c.type !== '框架协议');

const TAX_RATES = [6, 9, 13];
/** 按购方名称反查客户档案 ID（用于「购方名称」穿透到客户详情） */
const custIdOf = (name: string) => CUSTOMERS.find((c) => c.name === name)?.id;
const ST_TONE: Record<string, string> = { 正常: 'green', 已红字冲销: 'gray', 作废: 'gray', 待开票: 'orange' };

type Inv = (typeof INVOICES)[number] & { mode: '含税' | '不含税'; contractName?: string; invAmt?: number };

export default function InvoicePage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  const [tab, setTab] = useState('all');
  const [kw, setKw] = useState('');
  const [rate, setRate] = useState('all');
  const [st, setSt] = useState('all');
  const [detail, setDetail] = useState<Inv | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [red, setRed] = useState<Inv | null>(null);
  const [redTxt, setRedTxt] = useState('');
  const [voidInv, setVoidInv] = useState<Inv | null>(null);
  const [voidTxt, setVoidTxt] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  /** 导出勾选（与列表勾选列同源） */
  const [invSel, setInvSel] = useState<string[]>([]);

  // 开票表单
  /* G3：原 useState(CONTRACTS[0].id) 硬编码索引 0。改为取首个「非框架且可开票」的合同。 */
  const [fContract, setFContract] = useState(
    (CONTRACTS.find((c) => c.type !== '框架协议') || CONTRACTS[0]).id,
  );
  const [fRate, setFRate] = useState(9);
  const [fMode, setFMode] = useState<'含税' | '不含税'>('含税');
  const [fAmt, setFAmt] = useState(0);
  const [fType, setFType] = useState('增值税专用发票');

  /* G1：原 rows 为 useMemo 派生（写操作只 toast 不改数据，列表永远不变）。
     改为可写 state：红字冲销 / 作废 / 开具均真实回流列表、统计卡与「未开票重算」。 */
  const [rows, setRows] = useState<Inv[]>(() => INVOICES.map((i) => ({
    ...i,
    mode: (i.mode as '含税' | '不含税') || '含税',
    contractName: CONTRACTS.find((c) => c.id === i.contract)?.name || '—',
    invAmt: Math.max(0, (CONTRACTS.find((c) => c.id === i.contract)?.amt || 0) - i.total),
  })));

  /** 状态回写（红字冲销 / 作废 / 开具共用） */
  const patchInv = (id: string, patch: Partial<Inv>, msg: string) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setDetail((d) => (d && d.id === id ? { ...d, ...patch } : d));
    toast(msg);
  };

  const filtered = rows.filter((i) =>
    (tab === 'all' || i.status === tab)
    && (rate === 'all' || String(i.taxRate) === rate)
    && (st === 'all' || i.type === st)
    && (!kw || i.id.includes(kw) || i.no.includes(kw) || i.buyer.includes(kw) || i.contract.includes(kw)));
  /* TableFoot total 以当前页签视图为基数（再叠加税率/类型/关键词过滤出 filtered） */
  const tabBase = rows.filter((i) => tab === 'all' || i.status === tab);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  /* ============ 统一导出（金额 / 税率 / 税额为敏感字段，财务高敏） ============ */
  const exportFields: ExportField[] = [
    { key: 'id', label: '发票编号' },
    { key: 'contract', label: '合同号' },
    { key: 'buyer', label: '客户' },
    { key: 'date', label: '开票日期' },
    { key: 'amt', label: '金额', sensitive: true },
    { key: 'taxRate', label: '税率', sensitive: true },
    { key: 'tax', label: '税额', sensitive: true },
    { key: 'total', label: '价税合计' },
    { key: 'status', label: '状态' },
  ];
  const exportApi = useExport({
    pageKey: 'invoice',
    pageName: '开票台账',
    fields: exportFields,
    defaultFieldKeys: exportFields.map((f) => f.key),
    totalCount: rows.length,
    filteredCount: filtered.length,
    selectedCount: invSel.length,
    previewRows: filtered.slice(0, 5),
    userName: getUserName(role),
    onExport: () => { /* 原型：导出动作与审计上报由 useExport 内置完成 */ },
  });

  /* 税率口径一致性硬校验：合同税率 vs 发票税率
     M35：原实现将合同税率写死为 9%，导致维护保养（6%）/ 采购（13%）业务被无差别硬拦截。
     改为按合同类型取「可开票税率集合」——兼营业务须分别核算，故允许集合而非单值。 */
  const contractOf = CONTRACTS.find((c) => c.id === fContract);
  const RATES_BY_TYPE: Record<string, number[]> = {
    销售合同: [9],            // 建筑服务 · 安装 / 改造
    维护保养合同: [6, 9],      // 现代服务 6% 与建筑服务 9% 并存
    采购合同: [13],           // 货物销售
    框架协议: [6, 9, 13],      // 子合同税率不一，按实际业务分别核算
  };
  const contractRates = RATES_BY_TYPE[contractOf?.type || '销售合同'] || [9];
  const contractRate = contractRates[0];
  const rateMismatch = !contractRates.includes(fRate);

  /* 未开票重算 */
  const contractTotal = contractOf?.amt || 0;
  const contractInvoiced = rows.filter((r) => r.contract === fContract && r.status === '正常').reduce((a, b) => a + b.total, 0);
  const contractRemain = Math.max(0, contractTotal - contractInvoiced);

  const previewTax = calcTax(fAmt, fRate, fMode);
  const previewEx = fMode === '含税' ? fAmt - previewTax : fAmt;
  const previewTotal = fMode === '含税' ? fAmt : fAmt + previewTax;

  const cols: Col<Inv>[] = [
    { key: 'id', title: '发票流水号', width: 150, hide: true, render: (i) => <span className="num nc-link" onClick={() => setDetail(i)} {...pressProps(() => setDetail(i))}>{i.id}</span> },
    {
      key: 'no', title: '发票号码 / 类型', sticky: 'left', render: (i) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span className="num">{i.no}</span><Tag tone="gray">{i.type}</Tag>
        </span>
      ),
    },
    { key: 'date', title: '开票日期', width: 110, align: 'right', render: (i) => <span className="num">{i.date}</span> },
    { key: 'buyer', title: '购方名称', render: (i) => <span>{i.buyer}</span> },
    { key: 'contract', title: '关联合同', width: 150, render: (i) => <EntityLink target="contract" id={i.contract} go={go} title="下钻到合同详情">{i.contract}</EntityLink> },
    {
      key: 'mode', title: '税率口径', width: 140, align: 'right', render: (i) => (
        <span className="nc-valid-pill" title="含税：税额 = 总额 × 税率 ÷ (100+税率)；不含税：税额 = 总额 × 税率 ÷ 100">
          <b>{i.taxRate}%</b> · {i.mode}
        </span>
      ),
    },
    { key: 'amt', title: '不含税金额', width: 120, align: 'right', render: (i) => <Money v={i.mode === '含税' ? i.total - i.tax : i.amt} role={role} wan /> },
    { key: 'tax', title: '税额', width: 110, align: 'right', render: (i) => <Money v={i.tax} role={role} wan /> },
    { key: 'total', title: '价税合计', width: 120, align: 'right', render: (i) => <b className="num"><Money v={i.total} role={role} wan /></b> },
    { key: 'status', title: '状态', width: 92, render: (i) => <Tag tone={ST_TONE[i.status] as 'green'}>{i.status}</Tag> },
    {
      key: 'op', title: '操作', width: 175, render: (i) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Op onClick={() => setDetail(i)}>详情</Op>
          {i.status === '正常' && <>
            <OpSep />
            <Op danger onClick={() => { setRed(i); setRedTxt(''); }}>红字冲销</Op>
            <OpSep />
            <Op danger onClick={() => { setVoidInv(i); setVoidTxt(''); }}>作废</Op>
          </>}
          {i.status !== '正常' && <><OpSep /><Op onClick={() => toast('已下载发票影像件')}>下载</Op></>}
        </span>
      ),
    },
  ];

  const STAT = {
    total: rows.filter((r) => r.status === '正常').reduce((a, b) => a + b.total, 0),
    tax: rows.filter((r) => r.status === '正常').reduce((a, b) => a + b.tax, 0),
    red: rows.filter((r) => r.status === '已红字冲销').length,
    voidc: rows.filter((r) => r.status === '作废').length,
  };

  /* 未开票重算：合同级台账，按列表页布局规范带分页 + 总计数 */
  const unbilledPaged = usePaged(CONTRACTS.filter((c) => c.type !== '框架协议'));

  return (
    <>
      <PageHead
        crumbs={['财务', '发票管理']}
        title="发票管理"
        badges={<><Tag tone="green">正常 {rows.filter((r) => r.status === '正常').length}</Tag><Tag tone="gray">已红字冲销 {STAT.red}</Tag><Tag tone="gray">作废 {STAT.voidc}</Tag></>}
        sub="工程 9% · 服务 6% · 货物 13%；不一致硬拦截"
        actions={<><Btn onClick={() => go('settings')} title="税率口径与开票规则见系统设置"><Ico n="gear" size={16} /> 税率口径</Btn></>}
      />

      <div className="nc-tiles nc-tiles-5">
        <Tile label="已开票（价税合计）" value={canSeeMoney(role) ? fmtWan(STAT.total) : '—'} tone="green" sub={canSeeMoney(role) ? `其中税额 ${fmtWan(STAT.tax)}` : '无金额权限（A-02）'} />
        <Tile label="税额合计" value={canSeeMoney(role) ? fmtWan(STAT.tax) : '—'} sub="增值税销项税额" />
        <Tile label="已红字冲销" value={STAT.red} sub="一笔仅一次 · 不回退合同状态" />
        <Tile label="作废" value={STAT.voidc} sub="未交付购方时可用" />
        <Tile label="待开票金额" value={canSeeMoney(role) ? fmtWan(rows.reduce((a, b) => a + (b.invAmt || 0), 0)) : '—'} tone="orange" sub="合同额 − 已开票" />
      </div>

      <Card flush>
        <div style={{ padding: '12px 16px 0' }}>
          <Tabs value={tab} onChange={(k) => { setTab(k); setPage(1); }} items={[
            { key: 'all', label: '全部', cnt: rows.length },
            { key: '正常', label: '正常', cnt: rows.filter((r) => r.status === '正常').length },
            { key: '已红字冲销', label: '已红字冲销', cnt: STAT.red },
            { key: '作废', label: '作废', cnt: STAT.voidc },
          ]} />
        </div>
        <div style={{ padding: '0 16px 12px' }}>
          <ListToolbar
            rows={[
              {
                label: '税率', value: rate, onChange: (k) => { setRate(k); setPage(1); },
                items: [
                  { key: 'all', label: '全部税率', cnt: rows.length },
                  ...TAX_RATES.map((r) => ({ key: String(r), label: `${r}%`, cnt: rows.filter((i) => i.taxRate === r).length })),
                ],
              },
              {
                label: '类型', value: st, onChange: (k) => { setSt(k); setPage(1); },
                items: [
                  { key: 'all', label: '全部类型', cnt: rows.length },
                  { key: '增值税专用发票', label: '增值税专用发票', cnt: rows.filter((i) => i.type === '增值税专用发票').length },
                  { key: '增值税普通发票', label: '增值税普通发票', cnt: rows.filter((i) => i.type === '增值税普通发票').length },
                ],
              },
            ]}
            search={{ value: kw, onChange: (v) => { setKw(v); setPage(1); }, placeholder: '搜索流水号 / 发票号码 / 购方 / 合同号' }}
            onReset={() => { setKw(''); setRate('all'); setSt('all'); setPage(1); }}
            actions={<>
              <ExportButton onClick={exportApi.trigger} selectedCount={invSel.length} />
              <Btn kind="primary" onClick={() => setNewOpen(true)}>+ 开具发票</Btn>
            </>}
          />
        </div>
        <DataTable cols={cols} rows={paged} rowKey={(i) => i.id} minWidth={1250} onRowClick={(i) => setDetail(i)}
        selectable selected={invSel} onSelectAll={setInvSel} onSelectRow={(id) => setInvSel((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])}
        empty="没有符合筛选条件的发票；开票须与合同税率一致（不一致为硬拦截）"
        emptyCta={<Btn kind="primary" onClick={() => setNewOpen(true)}>＋ 开具发票</Btn>}
          rowClass={(i) => i.status === '已红字冲销' || i.status === '作废' ? 'is-muted-row' : ''}
          foot={<TableFoot total={tabBase.length} filtered={filtered.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />} />
      </Card>

      <Card hd={<>未开票重算（按合同口径） <Tip w={360} text="开票进度 = 已开票金额（正常票 · 价税合计）÷ 合同额；部分开票按金额占比累计，红字冲销 / 作废不计入。" /></>}>
        <table className="nc-tbl" style={{ minWidth: 900 }}>
          <thead><tr><th style={{ width: 150 }}>合同编号</th><th>合同名称</th><th style={{ width: 120, textAlign: 'right' }}>合同金额</th><th style={{ width: 120, textAlign: 'right' }}>已开票</th><th style={{ width: 120, textAlign: 'right' }}>未开票</th><th style={{ width: 132, textAlign: 'right' }}>开票进度 <Tip w={360} text="已开票金额（正常票 · 价税合计）÷ 合同额；部分开票按金额占比累计。" /></th><th style={{ width: 90 }}>状态</th></tr></thead>
          <tbody>
            {unbilledPaged.paged.map((c) => {
              const invoiced = rows.filter((r) => r.contract === c.id && r.status === '正常').reduce((a, b) => a + b.total, 0);
              const remain = Math.max(0, c.amt - invoiced);
              const pct = c.amt ? (invoiced / c.amt) * 100 : 0;
              return (
                <tr key={c.id}>
                  <td><EntityLink target="contract" id={c.id} go={go} title="下钻到合同详情">{c.id}</EntityLink></td>
                  <td>{c.name}</td>
                  <td className="is-num"><Money v={c.amt} role={role} wan /></td>
                  <td className="is-num"><Money v={invoiced} role={role} className="nc-v-green" wan /></td>
                  <td className="is-num">{remain > 0 ? <b className="nc-v-red"><Money v={remain} role={role} wan /></b> : '—'}</td>
                  <td className="is-num num">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                      <Progress value={pct} tone={remain <= 0 ? 'green' : pct > 0 ? 'orange' : undefined} />
                      <span>{pct.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td>{remain <= 0 ? <Tag tone="green">已开齐</Tag> : pct > 0 ? <Tag tone="orange">部分开票</Tag> : <Tag tone="gray">未开票</Tag>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {unbilledPaged.foot}
      </Card>

      {/* ============ 详情抽屉 ============ */}
      <Drawer open={!!detail} width={800} onClose={() => setDetail(null)} title={`发票详情 · ${detail?.id || ''}`}
        sub={`${detail?.no} · ${detail?.type} · 开票日期 ${detail?.date}`}
        foot={detail && (<>
          {detail.status === '正常' && <>
            <Btn danger onClick={() => { setRed(detail); setRedTxt(''); }}>红字冲销（一笔仅一次）</Btn>
            <Btn danger onClick={() => { setVoidInv(detail); setVoidTxt(''); }}>作废</Btn>
          </>}
          <Btn kind="primary" onClick={() => { setDetail(null); toast('已下载发票影像件（PDF + OFD）'); }}>下载影像件</Btn>
        </>)}>
        {detail && <>
          {detail.status === '已红字冲销' && <Alert icon={<Ico n="swap" size={16} />} title="该发票已红字冲销" sub="红字冲销凭证已生成，原发票不可再次红字冲销（一笔仅一次）；合同状态不受影响。"
            op={<Btn size="sm" onClick={() => { setDetail(null); toast(`已按原票 ${detail.id} 预填重新开具（金额 / 税率 / 抬头沿用原票）`); }}>重新开具</Btn>} />}
          {detail.status === '作废' && <Alert icon={<Ico n="close" size={16} />} title="该发票已作废" sub="作废后须重新开具，未开票金额已自动回补。"
            op={<Btn size="sm" onClick={() => { setDetail(null); toast(`已按原票 ${detail.id} 预填重新开具（金额 / 税率 / 抬头沿用原票）`); }}>重新开具</Btn>} />}

          <div className="nc-money-row">
            {[
              { k: '不含税金额', v: <Money v={detail.mode === '含税' ? detail.total - detail.tax : detail.amt} role={role} /> },
              { k: '税率', v: `${detail.taxRate}% · ${detail.mode}` },
              { k: '税额', v: <Money v={detail.tax} role={role} /> },
              { k: '价税合计', v: <Money v={detail.total} role={role} /> },
            ].map((m) => <div key={m.k} className="nc-money-cell"><span className="nc-tiny nc-muted">{m.k}</span><b className="num">{m.v}</b></div>)}
          </div>

          <Field label="票面信息" span={4}>
            <KvGrid cols={2} rows={[
              { k: '发票流水号', v: detail.id },
              { k: '发票号码', v: detail.no },
              { k: '发票类型', v: detail.type },
              { k: '开票日期', v: detail.date },
              { k: '购方名称', v: <EntityLink target="customer" id={custIdOf(detail.buyer)} go={go} title="下钻到客户档案">{detail.buyer}</EntityLink> },
              { k: '销方名称', v: '诺盾博达消防科技有限公司' },
              { k: '关联合同', v: <EntityLink target="contract" id={detail.contract} go={go} title="下钻到合同详情">{detail.contract}</EntityLink> },
              { k: '合同名称', v: detail.contractName || '—' },
              { k: '税率口径', v: `${detail.taxRate}% · ${detail.mode}` },
              { k: '当前状态', v: <Tag tone={ST_TONE[detail.status] as 'green'}>{detail.status}</Tag> },
            ]} />
          </Field>

          <Field label="关联收款记录" span={4}>
            <table className="nc-tbl" style={{ minWidth: 520 }}>
              <thead><tr><th>收款单号</th><th style={{ width: 110, textAlign: 'right' }}>收款金额</th><th style={{ width: 110 }}>收款日期</th><th style={{ width: 90 }}>核销状态</th></tr></thead>
              <tbody>
                <tr><td className="num">SK000003</td><td className="is-num num">{fmt(Math.min(detail.total, 328000))}</td><td className="num">2026-09-15</td><td><Tag tone="green">已核销</Tag></td></tr>
                {detail.total > 328000 && <tr><td className="num">SK000008</td><td className="is-num num">{fmt(detail.total - 328000)}</td><td className="num">2026-09-20</td><td><Tag tone="orange">部分核销</Tag></td></tr>}
              </tbody>
            </table>
          </Field>

          <Field label="操作记录" span={4}>
            <Timeline items={[
              { date: detail.date, text: `开具${detail.type} · 税额 ${fmt(detail.tax)}`, tone: 'ok' },
              { date: '2026-09-16', text: '交付购方（电子发票 · 邮件送达）', tone: 'gray' },
              ...(detail.status === '已红字冲销' ? [{ date: '2026-09-18', text: '红字冲销：购方退回重开，原票已全额红字冲销（一笔仅一次）', tone: 'red' as const }] : []),
              ...(detail.status === '作废' ? [{ date: '2026-08-12', text: '作废：抬头信息有误，未交付购方', tone: 'gray' as const }] : []),
            ]} />
          </Field>
        </>}
      </Drawer>

      {/* ============ 开具发票 ============ */}
      <Drawer open={newOpen} title="开具发票" width={640} onClose={() => setNewOpen(false)}
        foot={<><Btn onClick={() => setNewOpen(false)}>取消</Btn>
          <Btn kind="primary" disabled={rateMismatch || fAmt > contractRemain || fAmt <= 0}
            title={rateMismatch
              ? `开票税率与合同税率不一致（${contractOf?.type || '本合同'}可选 ${contractRates.join(' / ')}%），属硬拦截`
              : fAmt <= 0 ? '开票金额须大于 0'
                : fAmt > contractRemain ? `开票金额不得超过未开票余额 ${fmt(contractRemain)}`
                  : undefined}
            onClick={() => {
              /* G1：原仅 toast，列表不新增行（开票后查无此票）。改为真实入库并回算未开票余额。 */
              const ex = fMode === '含税' ? fAmt - previewTax : fAmt;
              const tot = fMode === '含税' ? fAmt : fAmt + previewTax;
              const id = `FP${TODAY.replace(/-/g, '')}-${String(rows.length + 1).padStart(4, '0')}`;
              const ni: Inv = {
                id, type: fType, no: String(Math.floor(Math.random() * 900000000) + 100000000),
                date: TODAY, buyer: contractOf?.party || '—', amt: Math.round(ex), taxRate: fRate,
                tax: Math.round(previewTax), total: Math.round(tot), contract: fContract,
                status: '正常', mode: fMode,
                contractName: contractOf?.name || '—',
                invAmt: Math.max(0, (contractOf?.amt || 0) - Math.round(tot)),
              } as Inv;
              setRows((rs) => [ni, ...rs]);
              setNewOpen(false);
              toast(`发票 ${id} 已开具并推送购方 · 价税合计 ${fmt(ni.total)}`);
            }}>确认开具</Btn></>}>
        <div className="nc-form-grid">
          <Field label="关联合同" req span={2}>
            <ContractPicker value={fContract} onChange={setFContract} options={INV_CONTRACTS} scope="all"
              placeholder="请选择可开票合同（非框架协议）" />
          </Field>
          <Field label="发票类型" req>
            <select className="nc-input" value={fType} onChange={(e) => setFType(e.target.value)}>
              <option>增值税专用发票</option><option>增值税普通发票</option>
            </select>
          </Field>
          <Field label="开票日期" req><input className="nc-input" type="date" defaultValue={TODAY} /></Field>
          <Field label="税率" req err={rateMismatch ? `与合同税率口径（${contractRate}%）不一致，已阻断开票` : undefined}
            note={!rateMismatch ? '工程类 9% · 服务类 6% · 货物类 13%' : undefined}>
            <select className="nc-input" value={fRate} onChange={(e) => setFRate(Number(e.target.value))}>
              {TAX_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
            </select>
          </Field>
          <Field label="金额口径" req note="含税：税额 = 总额 × 税率 ÷ (100+税率)">
            <select className="nc-input" value={fMode} onChange={(e) => setFMode(e.target.value as '含税' | '不含税')}>
              <option value="含税">含税</option><option value="不含税">不含税</option>
            </select>
          </Field>
          <Field label={`开票金额（${fMode}）`} req note={`合同未开票余额 ${fmt(contractRemain)}`}>
            <input className="nc-input" type="number" value={fAmt || ''} onChange={(e) => setFAmt(Number(e.target.value))} placeholder="0.00" />
          </Field>
          <Field label="购方名称" span={2}><input className="nc-input" disabled value={contractOf?.party || ''} /></Field>
        </div>

        <div className="nc-money-row" style={{ marginTop: 12 }}>
          {[
            { k: '不含税金额', v: fmt(previewEx) },
            { k: '税率 / 口径', v: `${fRate}% · ${fMode}` },
            { k: '税额（自动计算）', v: fmt(previewTax) },
            { k: '价税合计', v: fmt(previewTotal) },
          ].map((m) => <div key={m.k} className="nc-money-cell"><span className="nc-tiny nc-muted">{m.k}</span><b className="num">{m.v}</b></div>)}
        </div>

        {rateMismatch && (
          <div className="nc-warnbox is-danger" style={{ marginTop: 12 }}>
            <b><Ico n="warning" size={16} /> 税率口径不一致 · 开票已被硬拦截</b>
            <div>所选合同（{contractOf?.type || '—'}）可开票税率为 <b>{contractRates.join('% / ')}%</b>，当前发票税率 <b>{fRate}%</b>。请先到合同「变更签证」调整税率，或在下方上传书面说明并走特批。</div>
            <div style={{ marginTop: 8 }}>
              {/* Q1：原 go('contractDetail') 为已退役路由（死链），改跳合同台账 */}
              <Btn size="sm" danger onClick={() => { setNewOpen(false); toast(`已带合同号 ${fContract} 跳转合同台账，请在合同详情「变更签证」中发起税率变更`); go('contract'); }}>前往合同台账</Btn>
              <Btn size="sm" onClick={() => toast('已提交特批申请，路由至财务负责人')}>上传说明并特批</Btn>
            </div>
          </div>
        )}
        {fAmt > contractRemain && (
          <div className="nc-warnbox is-warn" style={{ marginTop: 12 }}>
            <b><Ico n="warning" size={16} /> 开票金额超出合同未开票余额</b>
            <div>合同未开票余额 {fmt(contractRemain)}，本次拟开 {fmt(fAmt)}，超出 {fmt(fAmt - contractRemain)}。超出部分将被拦截。</div>
          </div>
        )}
      </Drawer>

      {/* ============ 红字冲销 ============ */}
      <Modal open={!!red} title={`发票红字冲销 · ${red?.id || ''}`} width={480} onClose={() => setRed(null)}
        foot={<><Btn onClick={() => setRed(null)}>取消</Btn>
          <Btn kind="primary" danger disabled={!redTxt.trim()} title={redTxt.trim() ? undefined : '红字冲销须填写冲销原因（必填，留痕可追溯）'} onClick={() => {
            if (!red) return;
            patchInv(red.id, { status: '已红字冲销' }, `已红字冲销 ${red.id}：生成负数凭证冲正，原票保留只读（一笔仅一次），合同状态不回退`);
            setRed(null); setRedTxt('');
          }}>确认红字冲销</Btn></>}>
        <div className="nc-warnbox is-danger">
          <b><Ico n="warning" size={16} /> 红字冲销规则（硬约束）</b>
          <div>① <b>一笔仅一次</b>：同一张发票仅可红字冲销一次，红字冲销后原票不可再红字冲销；② <b>不回退合同状态</b>：红字冲销不改变合同履约状态，仅影响应收账款余额；③ 红字冲销方向记账：生成负数凭证冲正，原发票保留只读。</div>
        </div>
        {red && <KvGrid rows={[{ k: '发票号码', v: red.no }, { k: '价税合计', v: <Money v={red.total} role={role} /> }, { k: '税额', v: <Money v={red.tax} role={role} /> }, { k: '关联合同', v: red.contract }]} />}
        <Field label="红字冲销原因" req note={`${redTxt.length}/200 字`}>
          <textarea className="nc-input" rows={4} maxLength={200} value={redTxt} onChange={(e) => setRedTxt(e.target.value)} placeholder="如：购方退回要求重开，票面税率口径有误" />
        </Field>
      </Modal>

      {/* ============ 作废 ============ */}
      <Modal open={!!voidInv} title={`发票作废 · ${voidInv?.id || ''}`} width={480} onClose={() => setVoidInv(null)}
        foot={<><Btn onClick={() => setVoidInv(null)}>取消</Btn>
          <Btn kind="primary" danger disabled={!voidTxt.trim()} title={voidTxt.trim() ? undefined : '发票作废须填写作废原因（必填，留痕可追溯）'} onClick={() => {
            if (!voidInv) return;
            patchInv(voidInv.id, { status: '作废' }, `已作废 ${voidInv.id}：合同未开票金额已自动回补，须重新开具`);
            setVoidInv(null); setVoidTxt('');
          }}>确认作废</Btn></>}>
        <div className="nc-warnbox is-warn">
          <b>作废条件</b>
          <div>仅当发票<b>未交付购方</b>且<b>当月开具</b>时可作废；跨月或已交付须走红字冲销。作废后系统自动回补合同未开票金额。</div>
        </div>
        <Field label="作废原因" req note={`${voidTxt.length}/200 字`}>
          <textarea className="nc-input" rows={4} maxLength={200} value={voidTxt} onChange={(e) => setVoidTxt(e.target.value)} placeholder="如：抬头信息填写有误，未交付购方" />
        </Field>
      </Modal>

      {/* ============ 统一导出弹窗 ============ */}
      <ExportDialog {...exportApi.dialogProps} />
    </>
  );
}
