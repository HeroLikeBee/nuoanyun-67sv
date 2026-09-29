// 项目详情 · 项目收款（⑥ recv，11/13-Tab 统一骨架）
//
// 收款视角：回款口径四段 → 销项发票（蓝票 / 红票子页签，只读镜像）→ 收入流水 → 保证金与质保金。
// 只读投影：收款登记入口在合同侧（收付款计划），本页任何地方都不设登记按钮；
// 逾期应收的「发起催收」是项目侧唯一动作（走本页弹窗，不改台账）。
import React, { useState } from 'react';
import { Btn, Code, IdCell, Tag, Tip } from '../ui';
import { Ico } from '../icons';
import { PjSection } from './PjSection';
import type { PjCtx, PjPayRow } from './ctx';

/** 收支流水状态：收入 / 支出方向不同，文案必须分开（「已到账」不能用在付款行上）。
 *  PaySub 与本页共用同一份实现，防两处口径。 */
export function paySt(r: PjPayRow): { t: 'green' | 'orange' | 'red' | 'blue' | 'gray'; n: string } {
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

/** 回款口径：四段互不重复（已开票未到账已含在未回款内，单列以对齐账龄） */
function ReceiptKpi({ C }: { C: PjCtx }) {
  /* 取全集：本卡是全项目的回款口径，不应被流水筛选过滤 */
  const inv = C.payRowsAll.filter((r) => r.st === 'invoiced');
  return (
    <PjSection
      title={<>回款口径</>}
      extra={<Tip w={380} text="回款口径：仅银行已到账计入回款；已开票未到账挂应收账龄。四段关系：执行额 = 已回款 + 已开票未到账 + 未到期 − 坏账。" />}
    >
      <div className="nc-stat4">
        {[
          { k: '应收（执行额）', v: C.EXEC_AMT, n: '合同额 + 已生效变更' },
          { k: '已回款（银行到账）', v: C.CASH_IN, n: `回款率 ${C.PAY_PROGRESS.toFixed(1)}%` },
          { k: '已开票未到账', v: C.overdueAmt, n: inv.map((r) => r.id).join(' / ') || '—' },
          { k: '未回款', v: C.UNRECV, n: '执行额 − 已回款 − 坏账' },
        ].map((x) => {
          const isOverdue = x.k === '已开票未到账';
          const weak = x.v === 0;
          const toneCls = weak ? ' nc-muted' : (isOverdue && x.v > 0) ? ' nc-v-orange' : '';
          return (
            <div key={x.k} className="nc-stat4-cell">
              {x.k}<b className={'num' + toneCls}>{x.v.toLocaleString()}</b>
              <span className="nc-cell-sub">{x.n}</span>
            </div>
          );
        })}
      </div>
      <div className="nc-cell-sub" style={{ marginTop: 8 }}>
        已开票未到账最长账龄 {C.overdueDays} 天 —— 逾期可在「基本信息 · 风险与待办」中发起催收。
      </div>
    </PjSection>
  );
}

/** 销项发票：本项目建设合同开出的票（蓝票 / 红票子页签），只读镜像发票模块 */
function InvOut({ C }: { C: PjCtx }) {
  const [sub, setSub] = useState<'blue' | 'red'>('blue');
  const blue = C.invOut.filter((v) => v.status !== '已红字冲销');
  const red = C.invOut.filter((v) => v.status === '已红字冲销');
  const rows = sub === 'blue' ? blue : red;
  return (
    <PjSection
      title={<>销项发票</>}
      extra={<>
        <span className="nc-cell-sub">蓝票 {blue.length} 张 · 红票 {red.length} 张 · 合计 {C.invOut.reduce((s, v) => s + v.total, 0).toLocaleString()} 元</span>
        <Tip w={400} text="四流合一：发票流、合同流、资金流、货物流指向同一交易 —— 发票按合同号挂接，开票 / 红冲登记在发票模块与合同详情「开票管理」操作，此处为项目视角只读镜像。" />
        <Btn size="sm" onClick={() => C.go('invoice')}>去发票模块</Btn>
      </>}
    >
      {C.invOut.length === 0
        ? <div className="nc-empty">本项目合同暂无开票记录（开票在合同详情「开票管理」或发票模块登记）。</div>
        : (
          <>
            <div className="nc-subtabs">
              <button className={`nc-subtab${sub === 'blue' ? ' is-on' : ''}`} onClick={() => setSub('blue')}>蓝票（{blue.length}）</button>
              <button className={`nc-subtab${sub === 'red' ? ' is-on' : ''}`} onClick={() => setSub('red')}>红票 · 红字冲销（{red.length}）</button>
            </div>
            {rows.length === 0
              ? <div className="nc-empty">{sub === 'blue' ? '暂无蓝票记录。' : '暂无红字冲销记录。'}</div>
              : (
                <table className="nc-tbl" style={{ minWidth: 920 }}>
                  <thead><tr>
                    <th style={{ width: 110 }}>发票号</th><th style={{ width: 120 }}>发票号码</th>
                    <th style={{ width: 110 }} className="is-num">开票日期</th><th>购买方</th>
                    <th style={{ width: 110 }} className="is-num">金额（元）</th>
                    <th style={{ width: 100 }} className="is-num">税额</th>
                    <th style={{ width: 110 }} className="is-num">价税合计</th>
                    <th style={{ width: 120 }}>关联合同</th><th style={{ width: 100 }}>状态</th>
                  </tr></thead>
                  <tbody>
                    {rows.map((v) => (
                      <tr key={v.id} className={v.status === '已红字冲销' ? 'is-warn-row' : ''}>
                        <td><IdCell>{v.id}</IdCell></td>
                        <td className="num nc-tiny">{v.no}</td>
                        <td className="is-num num">{v.date}</td>
                        <td className="nc-cell-sub">{v.buyer}</td>
                        <td className="is-num num">{v.amt.toLocaleString()}</td>
                        <td className="is-num num">{v.tax.toLocaleString()}</td>
                        <td className="is-num num"><b>{v.total.toLocaleString()}</b></td>
                        <td><Code>{v.contract}</Code></td>
                        <td><Tag tone={v.status === '已红字冲销' ? 'gray' : v.status === '正常' ? 'green' : 'orange'}>{v.status}</Tag></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </>
        )}
    </PjSection>
  );
}

/** 收入流水：本项目全部到账 / 应收收入（含无合同项目的回款），只读 */
function RecvFlow({ C }: { C: PjCtx }) {
  const rows = C.payRowsAll.filter((r) => r.kind === '收入');
  return (
    <PjSection
      title={<>收入流水</>}
      extra={<span className="nc-cell-sub">收入 {C.SUM_IN.toLocaleString()} 元 · {rows.length} 笔</span>}
    >
      {rows.length === 0
        ? <div className="nc-empty">本项目暂无收入流水（关联合同并登记回款后自动同步）。</div>
        : (
          <table className="nc-tbl" style={{ minWidth: 900 }}>
            <thead><tr>
              <th style={{ width: 120 }}>单据号</th>
              <th style={{ width: 130 }}>关联合同</th>
              <th style={{ width: 120 }} className="is-num">金额（元）</th>
              <th>用途 / 说明</th>
              <th style={{ width: 110 }} className="is-num">日期</th>
              <th style={{ width: 130 }}>状态</th>
            </tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className={r.mergedTo || r.st === 'flushed' ? 'is-warn-row' : ''}>
                  <td><IdCell>{r.id}</IdCell></td>
                  <td><Code>{r.contract}</Code></td>
                  <td className={`is-num num${r.amt < 0 ? ' nc-v-red' : ''}`}>{r.amt.toLocaleString()}</td>
                  <td>
                    {r.use}
                    {r.hc && <> <Tag tone="gray">已冲销 → {r.hc}</Tag></>}
                  </td>
                  <td className="is-num num">{r.date}</td>
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
      title={<>保证金与质保金</>}
      extra={<Tip w={400} text="保证金台账只放我方实际缴纳 / 退还记录；质保金按合同额 × 3% 派生为客户结算扣留义务，不并入我方缴纳台账，避免同一笔钱两处口径。" />}
    >
      {C.depositRows.length === 0
        ? <div className="nc-empty">本项目暂无保证金记录。</div>
        : (
          <table className="nc-tbl" style={{ minWidth: 820 }}>
            <thead><tr>
              <th style={{ width: 130 }}>单据号</th><th style={{ width: 180 }}>类型</th>
              <th>往来单位</th><th style={{ width: 120 }} className="is-num">金额（元）</th>
              <th style={{ width: 110 }} className="is-num">缴纳 / 扣留日</th><th style={{ width: 120 }} className="is-num">到期 / 退还</th><th style={{ width: 100 }}>状态</th>
            </tr></thead>
            <tbody>
              {C.depositRows.map((d) => (
                <tr key={d.id}>
                  <td><Code>{d.id}</Code></td>
                  <td>{d.type}</td>
                  <td className="nc-cell-sub">{d.party}</td>
                  <td className="is-num num">{d.amt.toLocaleString()}</td>
                  <td className="is-num num">{d.pay}</td>
                  <td className="is-num num">{d.due}</td>
                  <td><Tag tone={d.st === '未退' || d.st === '待扣留' ? 'orange' : d.st === '已退还' ? 'green' : 'gray'}>{d.st}</Tag></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      <div className="nc-cell-sub" style={{ marginTop: 8 }}>
        质保金 {C.WARRANTY.toLocaleString()} 元按合同额 × 3%（法定上限）派生，不并入我方缴纳台账。
      </div>
    </PjSection>
  );
}

export default function RecvSub({ C }: { C: PjCtx }) {
  return (
    <>
      <div className="nc-gate-block" style={{ marginBottom: 12 }}>
        <Ico n="help" size={14} />
        收款 / 开票的登记入口在合同侧（合同详情「收付款计划 · 开票管理」），此处为项目视角的<strong>只读投影</strong>，数据随合同台账实时同步。
      </div>
      <ReceiptKpi C={C} />
      <InvOut C={C} />
      <RecvFlow C={C} />
      <Deposits C={C} />
    </>
  );
}
