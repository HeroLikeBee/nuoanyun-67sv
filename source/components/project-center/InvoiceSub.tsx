// 项目详情 · 项目收票（⑧ invoice，11/13-Tab 统一骨架）
//
// 收票 = 进项发票（供应商开给我方）：与付款类合同四流合一（合同流 / 发票流 / 资金流 / 货物流）。
// 进项票登记在发票模块与财务域，本页为项目视角只读镜像；销项发票在「项目收款」。
import React from 'react';
import { Code, Tag, Tip } from '../ui';
import { Ico } from '../icons';
import { PjSection } from './PjSection';
import type { PjCtx } from './ctx';

export default function InvoiceSub({ C }: { C: PjCtx }) {
  const got = C.invIn.filter((v) => v.st === '已收票');
  const wait = C.invIn.filter((v) => v.st === '待收票');
  const gotAmt = got.reduce((s, v) => s + v.amt, 0);
  const waitAmt = wait.reduce((s, v) => s + v.amt, 0);

  return (
    <>
      <div className="nc-gate-block" style={{ marginBottom: 12 }}>
        <Ico n="help" size={14} />
        收票（进项）与付款四流合一：收票登记在发票模块 / 财务域操作，此处为项目视角的<strong>只读镜像</strong>；
        我方开给客户的销项发票见「项目收款 · 销项发票」。
      </div>

      <PjSection
        title={<>进项发票</>}
        extra={<>
          <span className="nc-cell-sub">已收票 {got.length} 张 · {gotAmt.toLocaleString()} 元　待收票 {wait.length} 张 · {waitAmt.toLocaleString()} 元</span>
          <Tip w={420} text="进项票按付款类合同挂接：材料款 / 劳务款发票到位是付款与抵扣的前提；待收票金额同步出现在供应商对账与付款审批的校验提示里。" />
        </>}
      >
        {C.invIn.length === 0
          ? <div className="nc-empty">本项目暂无进项发票（关联合同并发生采购后自动同步）。</div>
          : (
            <table className="nc-tbl" style={{ minWidth: 900 }}>
              <thead><tr>
                <th style={{ width: 110 }}>发票号</th>
                <th style={{ width: 150 }}>关联合同</th>
                <th>销方（供应商）</th>
                <th style={{ width: 120 }} className="is-num">金额（元）</th>
                <th style={{ width: 110 }} className="is-num">开票 / 预计日期</th>
                <th style={{ width: 100 }}>状态</th>
                <th style={{ width: 200 }}>说明</th>
              </tr></thead>
              <tbody>
                {C.invIn.map((v) => (
                  <tr key={v.id} className={v.st === '待收票' ? 'is-warn-row' : ''}>
                    <td><b>{v.id}</b></td>
                    <td><Code>{v.contract}</Code></td>
                    <td className="nc-cell-sub">{v.party}</td>
                    <td className="is-num num">{v.amt.toLocaleString()}</td>
                    <td className="is-num num">{v.date}</td>
                    <td><Tag tone={v.st === '已收票' ? 'green' : 'orange'}>{v.st}</Tag></td>
                    <td className="nc-cell-sub">{v.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        <div className="nc-cell-sub" style={{ marginTop: 8 }}>
          进项抵扣与纳税申报在财务域处理；付款审批会校验「票到才付」口径（预付款除外）。
        </div>
      </PjSection>
    </>
  );
}
