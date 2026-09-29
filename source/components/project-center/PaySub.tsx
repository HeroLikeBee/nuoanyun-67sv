// 项目详情 · 项目付款（⑨ pay，11/13-Tab 统一骨架）
//
// 付款视角：合同付款流水（只读镜像）+ 无合同付款挂账（项目侧唯一可写的钱）。
// 合同付款的登记入口在合同侧（付款与请款），本页只读承接；无合同付款走本页弹窗提交审批。
import React from 'react';
import { Btn, Code, IdCell, Tag, Tip } from '../ui';
import { Ico } from '../icons';
import { PjSection } from './PjSection';
import { paySt } from './RecvSub';
import type { PjCtx } from './ctx';

export default function PaySub({ C }: { C: PjCtx }) {
  const rows = C.payRowsAll.filter((r) => r.kind !== '收入');
  const noCt = rows.filter((r) => r.kind === '无合同付款');
  const ctRows = rows.filter((r) => r.kind !== '无合同付款');
  const sumPaid = rows.filter((r) => r.st === 'paid').reduce((s, r) => s + r.amt, 0);

  return (
    <>
      <div className="nc-gate-block" style={{ marginBottom: 12 }}>
        <Ico n="help" size={14} />
        合同付款的登记入口在合同侧（合同详情「收付款计划 · 付款与请款」），本页为只读镜像；
        <strong>无合同付款挂账</strong>是项目侧唯一可写的付款（应急采购，须审批，批准后计入成本流水）。
      </div>

      <PjSection
        title={<>付款流水</>}
        extra={<>
          <span className="nc-cell-sub">已付 {sumPaid.toLocaleString()} 元 · {rows.length} 笔（含红冲）</span>
          <Tip w={400} text="付款流水按合同号挂接：到货预付 / 进度款来自付款类合同期次，红字冲销按净额追加、原行保留并置灰；审批中的付款不计现金。" />
        </>}
      >
        {ctRows.length === 0
          ? <div className="nc-empty">本项目暂无合同付款流水（关联合同后自动同步）。</div>
          : (
            <table className="nc-tbl" style={{ minWidth: 940 }}>
              <thead><tr>
                <th style={{ width: 120 }}>单据号</th>
                <th style={{ width: 100 }}>类别</th>
                <th style={{ width: 150 }}>关联合同</th>
                <th style={{ width: 120 }} className="is-num">金额（元）</th>
                <th>用途 / 说明</th>
                <th style={{ width: 110 }} className="is-num">日期</th>
                <th style={{ width: 130 }}>状态</th>
                <th style={{ width: 90 }}>操作</th>
              </tr></thead>
              <tbody>
                {ctRows.map((r) => (
                  <tr key={r.id} className={r.mergedTo || r.st === 'flushed' ? 'is-warn-row' : ''}>
                    <td><IdCell>{r.id}</IdCell></td>
                    <td>{r.kind}</td>
                    <td><Code>{r.contract}</Code></td>
                    <td className={`is-num num${r.amt < 0 ? ' nc-v-red' : ''}`}>{r.amt.toLocaleString()}</td>
                    <td>
                      {r.use}
                      {r.hc && <> <Tag tone="gray">已冲销 → {r.hc}</Tag></>}
                      {r.mergedTo && <> <Tag tone="gray">已归并 → {r.mergedTo}</Tag></>}
                    </td>
                    <td className="is-num num">{r.date}</td>
                    <td><Tag tone={paySt(r).t}>{paySt(r).n}</Tag></td>
                    <td>
                      {r.contract !== '—（项目级）'
                        ? <Btn size="sm" onClick={() => { C.go('contract-detail'); }}>看合同</Btn>
                        : <span className="nc-cell-sub">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </PjSection>

      <PjSection
        title={<>无合同付款挂账</>}
        extra={<>
          <span className="nc-cell-sub">{noCt.length} 笔 · 应急采购前提是现场在动</span>
          <Tip w={420} text="无合同付款 = 现场应急采购先花钱、合同后补的场景：项目级挂账提交审批，批准后计入成本流水，并在补签合同后归并到对应合同（原行保留并置灰）。" />
          <Btn size="sm" kind="primary" onClick={() => C.openM('pay')}>＋ 无合同付款挂账</Btn>
        </>}
      >
        {noCt.length === 0
          ? <div className="nc-empty">本项目暂无无合同付款挂账。</div>
          : (
            <table className="nc-tbl" style={{ minWidth: 820 }}>
              <thead><tr>
                <th style={{ width: 120 }}>单据号</th>
                <th style={{ width: 120 }} className="is-num">金额（元）</th>
                <th>用途 / 说明</th>
                <th style={{ width: 140 }}>归并去向</th>
                <th style={{ width: 110 }} className="is-num">日期</th>
                <th style={{ width: 140 }}>状态</th>
              </tr></thead>
              <tbody>
                {noCt.map((r) => (
                  <tr key={r.id} className={r.mergedTo ? 'is-warn-row' : ''}>
                    <td><IdCell>{r.id}</IdCell></td>
                    <td className="is-num num">{r.amt.toLocaleString()}</td>
                    <td>{r.use}</td>
                    <td>{r.mergedTo ? <><Code>{r.mergedTo}</Code> <Tag tone="gray">已归并</Tag></> : <span className="nc-cell-sub">待补签合同后归并</span>}</td>
                    <td className="is-num num">{r.date}</td>
                    <td><Tag tone={paySt(r).t}>{paySt(r).n}</Tag></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </PjSection>
    </>
  );
}
