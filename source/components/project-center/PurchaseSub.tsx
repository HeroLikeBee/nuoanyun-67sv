// 项目详情 · 项目采购（⑦ purchase，11/13-Tab 统一骨架）
//
// 采购视角：本项目付款类合同（采购 / 分包，过滤视图）+ 材料领用记录（物料域回写）。
// 采购动作（询价 / 下单 / 入库）在供应链域，本页只做项目视角的只读承接。
import React from 'react';
import { Code, Tag, Tip } from '../ui';
import { PjSection } from './PjSection';
import type { PjCtx } from './ctx';

export default function PurchaseSub({ C }: { C: PjCtx }) {
  const buySum = C.buyCt.reduce((s, b) => s + b.amt, 0);
  const matSum = C.matSum;
  return (
    <>
      <PjSection
        title={<>付款类合同（采购 / 分包）</>}
        extra={<>
          <span className="nc-cell-sub">{C.buyCt.length} 份 · 合计 {buySum.toLocaleString()} 元</span>
          <Tip w={420} text="本页只列挂在本项目下的付款类合同（采购 / 分包）；询价、下单、到货与供方考评在供应链域操作，合同条款与付款请款在合同详情处理。" />
        </>}
      >
        {C.buyCt.length === 0
          ? <div className="nc-empty">本项目暂无付款类合同。</div>
          : (
            <table className="nc-tbl" style={{ minWidth: 860 }}>
              <thead><tr>
                <th style={{ width: 130 }}>合同编号</th><th>合同名称</th>
                <th style={{ width: 100 }}>状态</th>
                <th style={{ width: 140 }} className="is-num">合同额（元）</th>
                <th style={{ width: 260 }}>提示</th>
              </tr></thead>
              <tbody>
                {C.buyCt.map((b) => (
                  <tr key={b.code}>
                    <td><Code>{b.code}</Code></td>
                    <td><b>{b.name}</b></td>
                    <td><Tag tone={b.tone}>{b.st}</Tag></td>
                    <td className="is-num num">{b.amt.toLocaleString()}</td>
                    <td className="nc-cell-sub">{b.warn ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </PjSection>

      <PjSection
        title={<>材料领用</>}
        extra={<>
          <span className="nc-cell-sub">{C.matRows.length} 项 · 合计 {matSum.toLocaleString()} 元（按加权单价结转）</span>
          <Tip w={420} text="材料领用由物料域（仓储泳道）回写：领用时按移动加权单价结转本项目成本并写入成本流水；本页只读展示领用记录，出入库作业在「库存」处理。" />
        </>}
      >
        {C.matRows.length === 0
          ? <div className="nc-empty">本项目暂无材料领用记录。</div>
          : (
            <table className="nc-tbl" style={{ minWidth: 900 }}>
              <thead><tr>
                <th style={{ width: 120 }}>物料编码</th>
                <th style={{ width: 110 }} className="is-num">领用日期</th>
                <th>物料名称</th><th style={{ width: 110 }}>规格</th>
                <th style={{ width: 90 }} className="is-num">数量</th>
                <th style={{ width: 70 }}>单位</th>
                <th style={{ width: 100 }} className="is-num">单价（元）</th>
                <th style={{ width: 120 }} className="is-num">金额（元）</th>
              </tr></thead>
              <tbody>
                {C.matRows.map((m) => (
                  <tr key={m.code + m.date}>
                    <td><Code>{m.code}</Code></td>
                    <td className="is-num num">{m.date}</td>
                    <td>{m.name}</td>
                    <td className="nc-cell-sub">{m.spec}</td>
                    <td className="is-num num">{m.qty}</td>
                    <td>{m.unit}</td>
                    <td className="is-num num">{m.price.toLocaleString()}</td>
                    <td className="is-num num"><b>{m.amt.toLocaleString()}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        <div className="nc-cell-sub" style={{ marginTop: 8 }}>
          成本科目视角（材料费 / 分包费 / 人工费 …）与目标成本对比在「项目成本」；本页是采购与领用的业务视角。
        </div>
      </PjSection>
    </>
  );
}
