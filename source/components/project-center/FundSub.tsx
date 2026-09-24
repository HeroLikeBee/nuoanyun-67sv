// 项目详情 · 资金台账子页
//
// 回答「钱收得怎么样、流水怎么走、保证金 / 质保金处于什么状态」。
// 口径：回款仅认银行已到账；已开票未到账挂应收账龄；收支流水按方向区分状态文案；
//       质保金 = 合同额 × 3%（法定上限），不并入我方缴纳台账。
// 本页只承接资金：合同与变更单据在「合同变更」，成本科目在「成本管控」，不重复。
import React from 'react';
import { Btn, Code, IdCell, Money, Tag, Tip } from '../ui';
import { Ico } from '../icons';
import { PjSection } from './PjSection';
import type { PjCtx, PjPayRow } from './ctx';

/** 收支流水状态：收入 / 支出方向不同，文案必须分开（「已到账」不能用在付款行上） */
function paySt(r: PjPayRow): { t: 'green' | 'orange' | 'red' | 'blue' | 'gray'; n: string } {
  switch (r.st) {
    case 'paid': return r.kind === '收入'
      ? { t: 'green', n: '已到账' }
      : { t: 'green', n: '已付款' };
    case 'invoiced': return { t: 'orange', n: '已开票·待到账' };
    case 'overdue': return { t: 'red', n: '逾期未收' };
    case 'flushed': return { t: 'gray', n: '已红字冲销' };
    case 'hc': return { t: 'gray', n: '红字冲销单' };
    case 'approving': return { t: 'blue', n: '审批中 · 不计现金' };
    default: return { t: 'gray', n: r.st };
  }
}

const PAY_FILTERS = ['全部', '收入', '采购付款', '无合同付款', '红字冲销单'];

/** 回款口径：四段互不重复（已开票未到账已含在未回款内，单列以对齐账龄） */
function ReceiptKpi({ C }: { C: PjCtx }) {
  /* 取全集：本卡是全项目的回款口径，不应被下方流水筛选器过滤 */
  const inv = C.payRowsAll.filter((r) => r.st === 'invoiced');
  return (
    <PjSection
      title={<><Ico n="card" size={16} /> 回款口径</>}
      extra={<Tip w={380} text="回款口径：仅银行已到账计入回款；已开票未到账挂应收账龄。四段关系：执行额 = 已回款 + 已开票未到账 + 未到期 − 坏账。" />}
    >
      <div className="nc-stat4">
        {[
          { k: '应收（执行额）', v: C.EXEC_AMT, n: '合同额 + 已生效变更' },
          { k: '已回款（银行到账）', v: C.CASH_IN, n: `回款率 ${C.PAY_PROGRESS.toFixed(1)}%` },
          { k: '已开票未到账', v: C.overdueAmt, n: inv.map((r) => r.id).join(' / ') || '—' },
          { k: '未回款', v: C.UNRECV, n: '执行额 − 已回款 − 坏账' },
        ].map((x) => (
          <div key={x.k} className="nc-stat4-cell">
            {x.k}<b className="num">{x.v.toLocaleString()}</b>
            <span className="nc-cell-sub">{x.n}</span>
          </div>
        ))}
      </div>
      <div className="nc-cell-sub" style={{ marginTop: 8 }}>
        已开票未到账最长账龄 {C.overdueDays} 天 —— 逾期可在「待办」中发起催收。
      </div>
    </PjSection>
  );
}

/** 收支明细：一条流水看资金去向；可按方向 / 类别筛选 */
function PayFlow({ C }: { C: PjCtx }) {
  const rows = C.payFilter === '全部' ? C.payRows : C.payRows.filter((r) => r.kind === C.payFilter);
  return (
    <PjSection
      title={<><Ico n="swap" size={16} /> 收支明细</>}
      extra={<>
        <span className="nc-cell-sub">收入 {C.SUM_IN.toLocaleString()} · 支出 {C.SUM_OUT.toLocaleString()} · 净额 {C.NET_IN.toLocaleString()}</span>
        <Btn size="sm" onClick={() => C.openM('pay')}>登记收款</Btn>
      </>}
    >
      <div className="nc-subtabs">
        {PAY_FILTERS.map((f) => (
          <button key={f} className={`nc-subtab${C.payFilter === f ? ' is-on' : ''}`} onClick={() => C.setPayFilter(f)}>{f}</button>
        ))}
      </div>
      {rows.length === 0
        ? <div className="nc-empty">本项目暂无「{C.payFilter}」类流水。</div>
        : (
          <table className="nc-tbl" style={{ minWidth: 940 }}>
            <thead><tr>
              <th style={{ width: 120 }}>单据号</th>
              <th style={{ width: 110 }}>类别</th>
              <th style={{ width: 130 }}>关联单据</th>
              <th style={{ width: 120 }} className="is-num">金额（元）</th>
              <th>用途 / 说明</th>
              <th style={{ width: 110 }}>日期</th>
              <th style={{ width: 130 }}>状态</th>
            </tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={r.mergedTo || r.st === 'flushed' ? 'is-warn-row' : ''}>
                  <td><IdCell>{r.id}</IdCell></td>
                  <td>{r.kind}</td>
                  <td><Code>{r.contract}</Code></td>
                  <td className={`is-num num${r.amt < 0 ? ' nc-v-red' : ''}`}>{r.amt.toLocaleString()}</td>
                  <td>
                    {r.use}
                    {r.hc && <div className="nc-cell-sub">已冲销 → {r.hc}</div>}
                    {r.mergedTo && <div className="nc-cell-sub">已归并 → {r.mergedTo}（原行保留，不重复计入）</div>}
                  </td>
                  <td className="num">{r.date}</td>
                  <td><Tag tone={paySt(r).t}>{paySt(r).n}</Tag></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </PjSection>
  );
}

/** 保证金与质保金：我方缴纳未退 + 结算时客户扣留的质保金义务行 */
function Deposits({ C }: { C: PjCtx }) {
  return (
    <PjSection
      title={<><Ico n="shield" size={16} /> 保证金与质保金</>}
      extra={<Tip w={400} text="保证金台账只放我方实际缴纳 / 退还记录；质保金按合同额 × 3% 派生为客户结算扣留义务，不并入我方缴纳台账，避免同一笔钱两处口径。" />}
    >
      {C.depositRows.length === 0
        ? <div className="nc-empty">本项目暂无保证金记录。</div>
        : (
          <table className="nc-tbl" style={{ minWidth: 820 }}>
            <thead><tr>
              <th style={{ width: 130 }}>单据号</th><th style={{ width: 180 }}>类型</th>
              <th>往来单位</th><th style={{ width: 120 }} className="is-num">金额（元）</th>
              <th style={{ width: 110 }}>缴纳 / 扣留日</th><th style={{ width: 120 }}>到期 / 退还</th><th style={{ width: 100 }}>状态</th>
            </tr></thead>
            <tbody>
              {C.depositRows.map((d) => (
                <tr key={d.id}>
                  <td><Code>{d.id}</Code></td>
                  <td>{d.type}</td>
                  <td className="nc-cell-sub">{d.party}</td>
                  <td className="is-num num">{d.amt.toLocaleString()}</td>
                  <td className="num">{d.pay}</td>
                  <td className="num">{d.due}</td>
                  <td><Tag tone={d.st === '未退' || d.st === '待扣留' ? 'orange' : d.st === '已退还' ? 'green' : 'gray'}>{d.st}</Tag></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      <div className="nc-cell-sub" style={{ marginTop: 8 }}>
        <Money role={C.role} v={C.WARRANTY} /> 质保金按合同额 × 3%（法定上限）派生，不并入我方缴纳台账。
      </div>
    </PjSection>
  );
}

export default function FundSub({ C }: { C: PjCtx }) {
  return (
    <>
      <ReceiptKpi C={C} />
      <PayFlow C={C} />
      <Deposits C={C} />
    </>
  );
}
