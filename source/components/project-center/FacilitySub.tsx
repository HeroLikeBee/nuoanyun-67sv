// 项目详情 · 设施台账与计价子页（WB 维保 / JC 检测专属，GC 工程不显示）
//
// 回答「服务对象有多大、按什么口径计价」——建筑面积、各类点位数量、设施资产原值。
// 维保 / 检测报价不数材料，数的就是这三个基数：报价行按台账自动带入，台账缺项则报价行无依据。
// 从原「合同信息」Tab 抽出独立成页并在 WB / JC 前置：它是服务 / 检测业务的计量与计价主线，不是合同单据。
import React from 'react';
import { PjSection } from './PjSection';
import { BILL_BASIS_CN, fmt, SERVICES, srvRateOf, wbQuoteOf } from '../data';
import type { BillBasis } from '../data';
import type { PjCtx } from './ctx';

export default function FacilitySub({ C }: { C: PjCtx }) {
  const { P } = C;
  const area = P.builtArea || 0;
  const pts = P.points || [];
  const asset = P.assetAmt || 0;
  const totalPts = pts.reduce((s, p) => s + p.qty, 0);
  const empty = !area && !pts.length && !asset;

  /* 价卡按业务线选定：维保项目挂「年度维保」、检测项目挂「消防设施检测」，
     不再写死某一张价卡 —— 否则检测项目展示的始终是维保单价与「元/年」。 */
  const svc = SERVICES.find((s) => (P.biz === 'JC'
    ? /检测/.test(s.name)
    : /维保/.test(s.name)));
  const rateCode = svc?.code;
  const unitCn = svc?.unit === '年' ? '元/年' : `元/${svc?.unit ?? '次'}`;

  const rate = srvRateOf(rateCode);
  const tryIt = (b: BillBasis) => (rate ? wbQuoteOf(rateCode!, { area, points: pts, assetAmt: asset }, b) : undefined);
  const areaQ = tryIt('area');
  const pointQ = tryIt('point');
  const assetQ = tryIt('asset');

  return (
    <PjSection
      title={<>消防设施台账</>}
      extra={<>
        <span className="nc-cell-sub">
          建筑面积 {area ? area.toLocaleString('en-US') : '—'} ㎡ · 点位 {totalPts ? totalPts.toLocaleString('en-US') : '—'} 个 ·
          设施资产原值 {asset ? fmt(asset) : '—'}
        </span>
      </>}
    >
      {empty ? (
        <div className="nc-empty">
          本项目尚未登记消防设施台账。做维保 / 检测报价时会缺少计量基数，需在报价页手工补录后回来补齐。
          <div className="nc-cell-sub" style={{ marginTop: 6 }}>台账是维保 / 检测报价的计量依据：面积、点位、设施资产原值三项至少登记一项。</div>
        </div>
      ) : (
        <>
          <table className="nc-tbl" style={{ minWidth: 880 }}>
            <thead><tr>
              <th>点位类别</th><th style={{ width: 100 }}>计量单位</th>
              <th style={{ width: 120, textAlign: 'right' }}>数量</th>
              <th style={{ width: 150, textAlign: 'right' }}>单价（{unitCn}）</th>
              <th style={{ width: 130, textAlign: 'right' }}>
                {P.biz === 'JC' ? '检测小计（元）' : '年度小计（元）'}</th>
            </tr></thead>
            <tbody>
              {pts.map((p) => {
                const pr = rate?.pointRates?.find((x) => x.kind === p.kind);
                return (
                  <tr key={p.kind}>
                    <td>{p.kind}</td>
                    <td className="nc-tiny">{pr?.unit || '—'}</td>
                    <td className="is-num num">{p.qty.toLocaleString('en-US')}</td>
                    <td className="is-num num">{pr ? fmt(pr.price) : '—'}</td>
                    <td className="is-num num"><b>{pr ? fmt(pr.price * p.qty) : '—'}</b></td>
                  </tr>
                );
              })}
              {!pts.length && <tr><td colSpan={5} className="nc-empty-mini">无点位台账（可按面积 / 设施资产口径计价）</td></tr>}
            </tbody>
          </table>

          <div className="nc-ledhd" style={{ marginTop: 16 }}>
            按本项目台账试算{P.biz === 'JC' ? '单次检测' : '年度维保'}
          </div>
          <table className="nc-tbl" style={{ minWidth: 880 }}>
            <thead><tr>
              <th style={{ width: 150 }}>计价口径</th><th>算式</th>
              <th style={{ width: 160, textAlign: 'right' }}>
                金额（{P.biz === 'JC' ? '元/次' : '元/年'}）</th>
            </tr></thead>
            <tbody>
              {[
                { b: 'area' as BillBasis, q: areaQ },
                { b: 'point' as BillBasis, q: pointQ },
                { b: 'asset' as BillBasis, q: assetQ },
              ].map(({ b, q }) => (
                <tr key={b}>
                  <td>{BILL_BASIS_CN[b]}</td>
                  <td className="nc-tiny nc-muted">
                    {q && q.total > 0
                      ? q.rows.map((r) => (r.qty > 1 ? `${r.label} × ${r.unitPrice}` : r.label)).join('；')
                      : '台账缺该口径所需基数'}
                    {q?.hitMin ? ` · 低于最低限价，按 ${fmt(q.minFee)} 保底` : ''}
                  </td>
                  <td className="is-num num"><b>{q && q.total > 0 ? fmt(q.total) : '—'}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="nc-cell-sub" style={{ marginTop: 8 }}>
            三种口径结果不同属行业常态：面积 / 点位对应常规{P.biz === 'JC' ? '检测' : '年度巡检'}，
            按设施造价对应全包型合同（含配件更换 / 驻点）。签约前须选定一种写入合同，选定后该口径即为结算依据。
          </div>
        </>
      )}
    </PjSection>
  );
}
