// 合同管理（列表）—— 合同全生命周期台账
// 编码前缀：销售 HT / 采购 CG / 框架 FK / 维护保养 WB
// 状态机（唯一事实源见 data.ts CONTRACT_STATUS）：草稿 → 审批中 → 已审批 → 已签约 → 履约中 → 结算中 → 已结项；旁支 已续签/已终止/已中止/已解除
// 「待审批」为历史别名，已统一收敛为「审批中」；读写一律走 normContractStatus()（筛选 / 步骤条 / 状态列同源，不会漏判）
// 版式参照「合同管理.html」：页面级 Tab → 工具条（搜索 + 下拉 + 右侧快捷 chips）→ 表格白卡（首末列吸附）
// 行点击 → 右侧滑出详情抽屉（920px），不再跳转独立详情页
import React, { useEffect, useMemo, useState } from 'react';
import {
  Banner, Btn, Code, DataTable, EntityLink, KvGrid, Modal, Money, Op, OpSep, PageHead, Progress, TableFoot, Tag, useToast,
} from '../components/ui';
import ContractDrawer from '../components/ContractDrawer';
import { Ico } from '../components/icons';
import { CONTRACTS, CUSTOMERS, PROJECTS, fmt, fmtWan, normContractStatus, TODAY } from '../components/data';
import { getContracts, getFocus, subscribeStore, getBizStatus } from '../components/store';

const ST_TONE: Record<string, 'gray' | 'blue' | 'green' | 'red' | 'orange'> = {
  草稿: 'gray', 待审批: 'orange', 审批中: 'blue', 已审批: 'blue', 已签约: 'green',
  履约中: 'green', 结算中: 'orange', 已结项: 'gray',
};
const TYPE_TONE: Record<string, 'blue' | 'orange' | 'purple' | 'green'> = {
  销售合同: 'blue', 采购合同: 'orange', 框架协议: 'purple', 维护保养合同: 'green',
};
type C = (typeof CONTRACTS)[number];

const TABS = ['全部', '待我审批', '履约中', '已结项', '框架与子合同'] as const;
const QUICKS = ['全部状态', '履约中', '有逾期', '超付预警'] as const;

export default function ContractPage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  const [tab, setTab] = useState<string>('全部');
  const [kw, setKw] = useState('');
  const [typeF, setTypeF] = useState('');
  const [projF, setProjF] = useState('');
  const [quick, setQuick] = useState<string>('全部状态');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detail, setDetail] = useState<C | null>(null);
  const [recvOpen, setRecvOpen] = useState<C | null>(null);
  /* G1：收款金额改为受控（原 uncontrolled，提交时读不到值，无法回写已收金额） */
  const [recvAmt, setRecvAmt] = useState(0);
  /* G1：原 rows 派生自模块常量 CONTRACTS，登记收款只 toast 不改数据，
     「已收 / 收支进度」列与统计永远不动。改为可写 state。 */
  const [contracts, setContracts] = useState(getContracts);
  /* G1 跨页：订阅共享 store —— 新建合同页提交后，台账页无需刷新即可看到新合同 */
  useEffect(() => subscribeStore(() => setContracts(getContracts())), []);
  /**
   * 跨页穿透：从客户 / 项目 / 商机等页面下钻进来时，自动打开目标合同详情抽屉。
   * 以 nav（路由脉冲）为依赖，保证反复下钻同一页也能重新定位。
   */
  useEffect(() => {
    const id = getFocus('contract');
    if (!id) return;
    const hit = getContracts().find((k) => k.id === id);
    if (hit) setDetail(hit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav]);
  /**
   * 审批中心回写的状态覆盖层：优先取覆盖值，无覆盖时回落原状态（打通「审批 → 合同」闭环）。
   * 结果统一过 normContractStatus，历史别名「待审批」收敛为规范态「审批中」。
   */
  const st = (c: C) => normContractStatus(getBizStatus(c.id, c.status));

  /** 合同回写（收款登记 / 红字冲销 / 状态流转） */
  const patchContract = (id: string, patch: Partial<C>, msg: string) => {
    setContracts((cs) => cs.map((x) => (x.id === id ? ({ ...x, ...patch } as C) : x)));
    setDetail((d) => (d && d.id === id ? ({ ...d, ...patch } as C) : d));
    toast(msg);
  };

  const counts: Record<string, number> = {
    全部: contracts.length,
    待我审批: contracts.filter((c) => st(c) === '审批中').length,
    履约中: contracts.filter((c) => st(c) === '履约中').length,
    已结项: contracts.filter((c) => st(c) === '已结项').length,
    框架与子合同: contracts.filter((c) => c.type === '框架协议').length,
  };

  const rows = useMemo(() => contracts.filter((c) => {
    if (tab === '待我审批' && st(c) !== '审批中') return false;
    if (tab === '履约中' && st(c) !== '履约中') return false;
    if (tab === '已结项' && st(c) !== '已结项') return false;
    if (tab === '框架与子合同' && c.type !== '框架协议') return false;
    if (typeF && c.type !== typeF) return false;
    if (projF && c.project !== projF) return false;
    if (quick === '有逾期' && !c.overdue) return false;
    if (quick === '超付预警' && !c.overpay) return false;
    if (kw && !(c.id + c.name + c.party).includes(kw)) return false;
    return true;
    // contracts 必须进依赖：登记收款 / 审批回写后列表与状态列要跟着刷新
  }), [tab, kw, typeF, projF, quick, contracts]);

  const paged = rows.slice((page - 1) * pageSize, page * pageSize);
  const daysLeft = (d: string) => Math.round((new Date(d).getTime() - new Date(TODAY).getTime()) / 86400000);
  const overdueCnt = contracts.filter((c) => c.overdue).length;
  const overpayCnt = contracts.filter((c) => c.overpay).length;

  const cols = [
    {
      key: 'id', title: '编号', width: 160, sticky: 'left' as const,
      render: (c: C) => <div className="nc-cell-main"><Code>{c.id}</Code><span /></div>,
    },
    {
      key: 'name', title: '名称 · 相对方', width: 300,
      render: (c: C) => (
        <div className="nc-cell-main">
          <div>{c.name}<Tag tone={TYPE_TONE[c.type] ?? 'gray'}>{c.type}</Tag></div>
          <div className="nc-cell-sub">{(() => { const cid = CUSTOMERS.find((x) => x.name === c.party || c.party.includes(x.name))?.id; return cid ? <EntityLink target="customer" id={cid} go={go} title="下钻到客户档案">{c.party}</EntityLink> : c.party; })()}</div>
        </div>
      ),
    },
    {
      key: 'project', title: '关联项目', width: 150,
      render: (c: C) => (c.project
        ? <div className="nc-cell-main"><EntityLink target="project-center" id={c.project} go={go} title="下钻到项目经营中心">{PROJECTS.find((p) => p.id === c.project)?.name.slice(0, 10) ?? c.project}</EntityLink><div className="nc-cell-sub"><EntityLink target="project-center" id={c.project} go={go} title="下钻到项目经营中心"><Code>{c.project}</Code></EntityLink></div></div>
        : <span className="nc-cell-sub">框架（挂子合同）</span>),
    },
    {
      key: 'amt', title: '金额 → 执行金额', width: 170, align: 'right' as const,
      render: (c: C) => (
        <div>
          <div className="num">{fmt(c.type === '框架协议' ? c.execAmt : c.amt)}</div>
          {c.execAmt !== c.amt && <div className="nc-cell-sub num">执行 {fmt(c.execAmt)}</div>}
        </div>
      ),
    },
    { key: 'status', title: '状态', width: 90, render: (c: C) => <Tag tone={ST_TONE[st(c)] ?? 'gray'}>{st(c)}</Tag> },
    {
      key: 'recvPct', title: '收支进度', width: 150,
      render: (c: C) => (
        <div className="nc-cell-main">
          <Progress value={c.recvPct} tone={c.overdue ? 'red' : c.recvPct >= 70 ? 'green' : 'orange'} />
          <div className="nc-cell-sub num">{c.recvPct}% · 已{['采购合同'].includes(c.type) ? '付' : '收'} <Money v={c.recv} role={role} wan /></div>
        </div>
      ),
    },
    {
      key: 'op', title: '操作', width: 200, align: 'right' as const, sticky: 'right' as const,
      render: (c: C) => (
        <div className="nc-ops" onClick={(e) => e.stopPropagation()}>
          <Op onClick={() => setDetail(c)}>详情</Op><OpSep />
          {st(c) === '履约中' && !['采购合同'].includes(c.type) && <><Op gold onClick={() => { setRecvOpen(c); setRecvAmt(Math.round((c.execAmt - c.recv) * 0.25)); }}>登记收款</Op><OpSep /></>}
          <Op onClick={() => toast('已打开合同文件页（基础信息 + 纸面 + AI，零切换）')}>文件页</Op>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHead
        title="合同管理"
        actions={<Btn kind="primary" onClick={() => go('contract-new')}><Ico n="plus" size={14} /> 新建合同</Btn>}
      />

      {/* ---- 页面级 Tab（计数徽标；待我审批为热标） ---- */}
      <div className="nc-ltabs">
        {TABS.map((t) => (
          <button key={t} className={`nc-ltab${tab === t ? ' is-on' : ''}`} onClick={() => { setTab(t); setPage(1); }}>
            {t}<span className={`n${t === '待我审批' && counts[t] > 0 ? ' is-hot' : ''}`}>{counts[t]}</span>
          </button>
        ))}
      </div>

      {/* ---- 工具条：搜索 + 下拉 + 右侧快捷 chips ---- */}
      <div className="nc-ctbar">
        <input
          className="nc-input nc-ct-search" value={kw} placeholder="编号 / 名称 / 相对方"
          onChange={(e) => { setKw(e.target.value); setPage(1); }}
        />
        <select className="nc-input" style={{ width: 130 }} value={typeF} onChange={(e) => { setTypeF(e.target.value); setPage(1); }}>
          <option value="">全部类型</option>
          {['销售合同', '采购合同', '框架协议', '维护保养合同'].map((t) => <option key={t}>{t}</option>)}
        </select>
        <select className="nc-input" style={{ width: 160 }} value={projF} onChange={(e) => { setProjF(e.target.value); setPage(1); }}>
          <option value="">全部项目</option>
          {PROJECTS.map((p) => <option key={p.id} value={p.id}>{p.id}</option>)}
        </select>
        <div className="nc-ctchips">
          {QUICKS.map((q) => (
            <button
              key={q} className={`nc-fchip${quick === q ? ' is-on' : ''}`}
              onClick={() => { setQuick(q); setPage(1); toast(`已切换「${q}」，命中 ${contracts.filter((c) => (q === '有逾期' ? c.overdue : q === '超付预警' ? c.overpay : q === '履约中' ? st(c) === '履约中' : true)).length} 份`); }}
            >
              {q}{q === '有逾期' && <span> {overdueCnt}</span>}{q === '超付预警' && <span> {overpayCnt}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ---- 表格白卡 ---- */}
      <div className="nc-tbl-inner">
        <DataTable
          cols={cols} rows={paged} rowKey={(c) => c.id} minWidth={1420}
          rowClass={(c) => (c.overdue ? 'is-danger-row' : c.overpay ? 'is-warn-row' : '')}
          onRowClick={(c) => setDetail(c)}
          empty="没有符合条件的合同"
        />
        <TableFoot
          total={contracts.length} filtered={rows.length} page={page} pageSize={pageSize}
          onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }}
          /* G3：原 contracts[0].end 硬编码索引 0，改为取「剩余工期最短」的合同（口径与排序无关） */
          extra={<span className="nc-cell-sub"> ｜ 行点击打开详情抽屉 · 最近到期剩余 {daysLeft([...contracts].filter((c) => c.end).sort((a, b) => daysLeft(a.end) - daysLeft(b.end))[0]?.end ?? TODAY)} 天 · 30 天内到期 {contracts.filter((c) => daysLeft(c.end) < 30).length} 份</span>}
        />
      </div>

      {/* ============ 合同详情抽屉（行点击滑出） ============ */}
      {/* 抽屉状态与列表同源：把审批回写后的归一化状态一并传入，避免列表显示「已签约」而抽屉仍是旧值 */}
      <ContractDrawer open={!!detail} c={detail ? { ...detail, status: st(detail) } : detail} onClose={() => setDetail(null)} go={go} role={role} />

      {/* ============ 登记收款 ============ */}
      <Modal
        open={!!recvOpen} onClose={() => setRecvOpen(null)} width={580} title={`登记收款 · ${recvOpen?.id ?? ''}`}
        foot={<><Btn onClick={() => setRecvOpen(null)}>取消</Btn><Btn kind="primary" onClick={() => {
          if (!recvOpen) return;
          if (!(recvAmt > 0)) { toast('本次收款金额须 > 0', 'err'); return; }
          if (recvAmt > recvOpen.execAmt - recvOpen.recv) { toast(`收款金额 ${fmt(recvAmt)} 超出未收余额 ${fmt(recvOpen.execAmt - recvOpen.recv)}`, 'err'); return; }
          const nextRecv = recvOpen.recv + recvAmt;
          const nextPct = recvOpen.execAmt ? Math.round((nextRecv / recvOpen.execAmt) * 1000) / 10 : 0;
          patchContract(recvOpen.id, {
            recv: nextRecv, recvPct: nextPct,
            status: st(recvOpen) === '已签约' ? '履约中' : st(recvOpen),
          }, `已登记收款 ${fmt(recvAmt)} · 累计已收 ${fmt(nextRecv)}（${nextPct}%）· 首笔后合同转「履约中」· 驾驶舱与项目同步刷新`);
          setRecvOpen(null);
        }}>确认登记</Btn></>}>
        {recvOpen && (
          <>
            <Banner tone={recvOpen.overdue ? 'warn' : 'info'}>
              {recvOpen.overdue ? ' 本期次已逾期，登记后仍保留逾期留痕；单笔仅可红字冲销一次。' : '首笔收款登记后合同自动转「履约中」。'}
            </Banner>
            <KvGrid cols={2} rows={[
              { k: '合同编号', v: <Code>{recvOpen.id}</Code> },
              { k: '相对方', v: recvOpen.party },
              { k: '执行金额', v: <Money v={recvOpen.execAmt} role={role} /> },
              { k: '已收 / 未收', v: <><Money v={recvOpen.recv} role={role} /> / <Money v={recvOpen.execAmt - recvOpen.recv} role={role} /></> },
              { k: '收款节点', v: recvOpen.nodes },
              { k: '质保金（≤3% 法定上限）', v: fmt(Math.round(recvOpen.execAmt * 0.03)) },
            ]} />
            <div className="nc-form-grid">
              <div className="nc-field nc-field-2"><div className="nc-field-label is-req">本次收款金额</div>
                <input className="nc-input" type="number" value={recvAmt || ''}
                  onChange={(e) => setRecvAmt(Number(e.target.value))} placeholder="0.00" /></div>
              <div className="nc-field"><div className="nc-field-label is-req">收款日期</div><input className="nc-input" type="date" defaultValue={TODAY} /></div>
              <div className="nc-field"><div className="nc-field-label">收款方式</div><select className="nc-input"><option>银行转账</option><option>承兑汇票</option><option>现金</option></select></div>
              <div className="nc-field nc-field-2"><div className="nc-field-label">回款凭证</div><input className="nc-input" type="file" /></div>
            </div>
          </>
        )}
      </Modal>
    </>
  );
}
