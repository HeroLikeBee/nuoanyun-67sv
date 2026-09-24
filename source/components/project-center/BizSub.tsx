// 项目详情 · 合同变更子页
//
// 回答「合同怎么签的、收款期次怎么安排、变更签证怎么算」。
// 合同树按收款 / 付款方向分组，收款期次展开看合同安排；
// 变更与签证是合同单据（要签补充协议）—— 项目侧只承接结果，发起回落到合同详情「变更与签证」。
// 资金实际收支 / 保证金在「资金台账」，成本在「成本管控」，本页不重复。
import React, { useState } from 'react';
import { Btn, Code, EntityLink, IdCell, Op, Steps, Tag, Tip } from '../ui';
import { Ico } from '../icons';
import { PjSection } from './PjSection';
import { BILL_BASIS_CN, fmt, SERVICES, srvRateOf, wbQuoteOf } from '../data';
import type { BillBasis } from '../data';
import type { PjCtx, PjPayRow, PjSaleContract } from './ctx';

/** 无合同付款行状态（合同树内挂账区用） */
function paySt(r: PjPayRow): { t: 'green' | 'orange' | 'red' | 'blue' | 'gray'; n: string } {
  switch (r.st) {
    case 'paid': return { t: 'green', n: '已付款' };
    case 'approving': return { t: 'blue', n: '审批中 · 不计现金' };
    case 'flushed': return { t: 'gray', n: '已红字冲销' };
    case 'hc': return { t: 'gray', n: '红字冲销单' };
    default: return { t: 'gray', n: r.st };
  }
}

const FLOW = ['发起', 'PM 审核', '商务审批', '客户确认', '生效'];

/** 收款期次状态 → 徽标色（绿=已走完 / 金=部分 / 蓝=开票待到账 / 红=逾期 / 灰=未到期） */
const INST_TONE: Record<string, 'green' | 'gold' | 'blue' | 'red' | 'gray'> = {
  已到账: 'green', 部分到账: 'gold', '已开票·待到账': 'blue', 逾期未收: 'red', 未到期: 'gray',
};

/** 合同树：收款类（销售 / 维保 / 补充协议）+ 付款类（采购 / 分包）+ 无合同付款挂账 */
function ContractTree({ C }: { C: PjCtx }) {
  /* 展开态按项目内实际合同号初始化，不预置某个具体合同号 */
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setOpen((s) => ({ ...s, [k]: !s[k] }));
  const saleSum = C.saleCt.reduce((s, c) => s + c.amt, 0);
  const buySum = C.buyCt.reduce((s, c) => s + c.amt, 0);
  /* 用全集而非资金域筛选结果：否则资金域切到「收入」筛选时，这里会空掉 */
  const noCt = C.payRowsAll.filter((r) => r.kind === '无合同付款');

  return (
    <PjSection
      title={<><Ico n="card" size={16} /> 项目合同树</>}
      extra={<>
        <span className="nc-cell-sub">收款类 {C.saleCt.length} 份 · {saleSum.toLocaleString()} 元　付款类 {C.buyCt.length} 份 · {buySum.toLocaleString()} 元</span>
        <Tip w={380} text="按收款 / 付款方向分组：同一份合同在项目侧与合同详情侧双向可见。执行中项目若无销售合同，会进驾驶舱「无合同施工」风险榜。" />
        <Btn size="sm" onClick={() => C.openM('link')}>＋ 关联合同</Btn>
      </>}
    >
      <div className="nc-2col">
        <div>
          <div className="nc-ledhd">收款类 · 销售 / 维保合同 <b>{C.saleCt.length}</b></div>
          {C.saleCt.length === 0 && <div className="nc-empty-mini">本项目暂无收款类合同{C.P.noContract ? '（无合同先施工，待补签）' : ''}</div>}
          {C.saleCt.map((c: PjSaleContract) => (
            <div key={c.code} className="nc-ctcard">
              <div className="nc-ctcard-hd">
                <EntityLink target="contract" id={c.code} go={C.go} title="下钻到合同详情"><Code>{c.code}</Code></EntityLink>
                <b>{c.name}</b><Tag tone={c.tone}>{c.st}</Tag>
                <span className="nc-ctcard-amt">{c.amt.toLocaleString()}</span>
                {c.payplan
                  ? <Btn size="sm" onClick={() => toggle(c.code)}>{open[c.code] ? '收起期次 ▲' : '展开期次 ▼'}</Btn>
                  : <Btn size="sm" onClick={() => C.go('contract-detail')}>详情</Btn>}
              </div>
              {c.badge && <div className="nc-cell-sub">{c.badge}</div>}
              {c.children?.map((ch) => (
                <div key={ch.code} style={{ margin: '6px 0 0 12px', paddingLeft: 10, borderLeft: '2px solid var(--c-primary-3)' }}>
                  <EntityLink target="contract" id={ch.code} go={C.go} title="下钻到合同详情"><Code>{ch.code}</Code></EntityLink>
                  <b>{ch.name}</b> <Tag tone="blue">价格调整补充</Tag>
                  <span style={{ float: 'right' }} className="num">+{ch.amt.toLocaleString()}（增量：合同额不动，只加执行额）</span>
                  <div className="nc-cell-sub">{ch.note}</div>
                </div>
              ))}
              {c.payplan && open[c.code] && <div className="nc-cell-sub">收款期次已展开，明细见下方「收款期次」表。</div>}
            </div>
          ))}
        </div>

        <div>
          <div className="nc-ledhd">付款类 · 采购 / 分包合同 <b>{C.buyCt.length}</b></div>
          {C.buyCt.length === 0 && <div className="nc-empty-mini">本项目暂无采购 / 分包合同</div>}
          {C.buyCt.map((c) => (
            <div key={c.code} className="nc-ctcard">
              <div className="nc-ctcard-hd">
                <EntityLink target="contract" id={c.code} go={C.go} title="下钻到合同详情"><Code>{c.code}</Code></EntityLink>
                <b>{c.name}</b><Tag tone={c.tone}>{c.st}</Tag>
                <span className="nc-ctcard-amt">{c.amt.toLocaleString()}</span>
                <Btn size="sm" onClick={() => C.go('contract-detail')}>详情</Btn>
              </div>
              {c.warn && <div className="nc-cell-sub nc-v-orange">{c.warn}</div>}
            </div>
          ))}

          <div className="nc-ledhd" style={{ marginTop: 18 }}>无合同付款（项目级挂账） <b>{noCt.length}</b>
            <Tip w={340} text="应急采购在归并到合同前单独挂账；归并后原行保留置灰、标记去向，避免重复计入成本。实际收支流水见「资金台账」。" />
          </div>
          {noCt.length === 0
            ? <div className="nc-empty-mini">本项目暂无无合同付款</div>
            : (
              <div className="nc-gate">
                {noCt.map((r) => (
                  <div key={r.id} className="nc-gate-row">
                    <span className="nc-gate-n">{r.id} <div className="nc-cell-sub">{r.use} · {r.date}</div></span>
                    <span className="is-num num">{r.amt.toLocaleString()}</span>
                    <span className="nc-gate-s">
                      {r.mergedTo ? <Tag tone="gray">已归并 → {r.mergedTo}</Tag> : <Tag tone={paySt(r).t}>{paySt(r).n}</Tag>}
                    </span>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>

      {/* 收款期次：全宽展示合同安排，避免列被挤成竖排（实际到账流水在「资金台账」） */}
      {C.saleCt.filter((c) => c.payplan && open[c.code]).map((c) => (
        <div key={`q-${c.code}`} style={{ marginTop: 14 }}>
          <div className="nc-ledhd">
            <Code>{c.code}</Code> 收款期次
            <span className="nc-cell-sub" style={{ marginLeft: 8 }}>
              合同安排应收 {c.payplan!.reduce((s, p) => s + p.amt, 0).toLocaleString()} 元
            </span>
            <span style={{ marginLeft: 'auto' }}><Btn size="sm" onClick={() => toggle(c.code)}>收起 ▲</Btn></span>
          </div>
          <table className="nc-tbl" style={{ minWidth: 980 }}>
            <thead><tr>
              <th style={{ width: 150 }}>收款期次</th>
              <th style={{ width: 110 }} className="is-num">约定应收</th>
              <th style={{ width: 160 }}>实收情况</th>
              <th style={{ width: 110 }}>实收日期</th>
              <th style={{ width: 100 }}>开票状态</th>
              <th style={{ width: 100 }}>状态</th>
              <th style={{ width: 110 }}>计划日期</th>
              <th>备注</th>
            </tr></thead>
            <tbody>
              {c.payplan!.map((p) => (
                <tr key={p.n} className={p.st === '已开票·待到账' || p.st === '逾期未收' ? 'is-warn-row' : ''}>
                  <td>{p.n}</td>
                  <td className="is-num num">{p.amt.toLocaleString()}</td>
                  <td className="num">{p.got > 0 ? p.got.toLocaleString() : '—'} <span className="nc-cell-sub">/ {p.amt.toLocaleString()}</span></td>
                  <td className="num">{p.gotDate}</td>
                  <td><Tag tone={p.inv === '已开票' ? 'blue' : 'gray'}>{p.inv}</Tag></td>
                  <td><Tag tone={INST_TONE[p.st] ?? 'gray'}>{p.st}</Tag></td>
                  <td className="num">{p.plan}</td>
                  <td className="nc-cell-sub">{p.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </PjSection>
  );
}

/** 变更与签证：变更是合同单据（要签补充协议），项目侧只读结果，发起入口回落到合同 */
function ChangeVisa({ C }: { C: PjCtx }) {
  const orphan = C.visas.filter((v) => v.chg === '—');
  return (
    <PjSection
      title={<><Ico n="swap" size={16} /> 变更与签证</>}
      extra={<>
        <span className="nc-cell-sub">执行额 = 合同额 + 已生效变更 {C.CHG_EFFECTIVE.toLocaleString()}{C.CHG_PENDING > 0 ? ` · 审批中 +${C.CHG_PENDING.toLocaleString()}` : ''}</span>
        <Tip w={400} text="变更属合同单据（生效后要签补充协议），因此只能由合同发起：项目侧展示它落到本项目的结果，发起请回到对应合同的「变更与签证」。" />
        <Btn size="sm" kind="primary" onClick={() => C.gotoContractChange()}>到合同发起变更 →</Btn>
      </>}
    >
      <div className="nc-ledhd">合同变更 <b>{C.changes.length}</b>
        <Tip w={380} text="变更流程：发起 → PM 审核 → 商务审批 → 客户确认 → 生效。已生效变更进执行额；审批中暂计入展示口径，不计现金。变更单由对应合同发起并归档。" />
      </div>
      {C.changes.length === 0
        ? <div className="nc-empty-mini">本项目尚无合同变更</div>
        : C.changes.map((c) => (
          <div key={c.id} className="nc-ctcard">
            <div className="nc-ctcard-hd">
              <Code>{c.id}</Code><b>{c.title}</b>
              <Tag tone={c.st === '已生效' ? 'green' : 'blue'}>{c.st}</Tag>
              <span className="nc-ctcard-amt">+{c.amt.toLocaleString()}</span>
            </div>
            <div className="nc-cell-sub">
              {c.cat} · 归属合同{' '}
              <Op onClick={() => C.gotoContractChange(c.contract)} title={`打开合同 ${c.contract} 的「变更与签证」`}>{c.contract}</Op>
              {' '}· {c.by} · {c.date}
            </div>
            <Steps items={FLOW.map((f) => ({ label: f }))} cur={c.st === '已生效' ? FLOW.length : (c.flowIdx ?? 0) + 1} />
          </div>
        ))}

      <div className="nc-ledhd" style={{ marginTop: 16 }}>签证洽商 <b>{C.visas.length}</b>
        <Tip w={400} text="未走完合同变更审批与补充协议的签证，不计入执行额、不可据此收款——这是常见的漏单点，故在签证行内直接显示「已生成变更单 / 未生成」。" />
      </div>
      {C.visas.length === 0
        ? <div className="nc-empty-mini">本项目尚无签证洽商</div>
        : (
          <table className="nc-tbl" style={{ minWidth: 900 }}>
            <thead><tr>
              <th style={{ width: 110 }}>签证号</th><th style={{ width: 110 }}>日期</th>
              <th>事由</th><th style={{ width: 110 }} className="is-num">金额（元）</th>
              <th style={{ width: 90 }}>照片</th><th style={{ width: 100 }}>签认</th>
              <th style={{ width: 120 }}>变更单</th><th style={{ width: 130 }}>变更状态</th>
            </tr></thead>
            <tbody>
              {C.visas.map((v) => (
                <tr key={v.no} className={v.chg === '—' ? 'is-warn-row' : ''}>
                  <td><IdCell>{v.no}</IdCell></td>
                  <td className="num">{v.date}</td>
                  <td>{v.reason}</td>
                  <td className="is-num num">{v.amt.toLocaleString()}</td>
                  <td className="num">{v.photos} 张</td>
                  <td><Tag tone={v.sign === '已签认' ? 'green' : 'orange'}>{v.sign}</Tag></td>
                  <td>{v.chg === '—' ? <span className="nc-cell-sub">未生成</span> : <Code>{v.chg}</Code>}</td>
                  <td>
                    {v.chgSt === '未生成变更单'
                      ? <Btn size="sm" onClick={() => C.gotoContractChange()} title="到对应合同「变更与签证」把该签证转为变更单">去合同生成</Btn>
                      : <Tag tone="blue">{v.chgSt}</Tag>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      {orphan.length > 0 && (
        <div className="nc-gate-block" style={{ background: 'var(--c-warning-bg)', borderColor: 'var(--c-warning-border)' }}>
          <Ico n="warning" size={14} />
          存在 {orphan.length} 笔未生成变更单的签证（{orphan.map((v) => `${v.no} · ${v.amt.toLocaleString()} 元`).join('；')}）——
          变更单须在合同侧生成（入口：合同详情「变更与签证」→ ＋ 新增变更）；生效并签补充协议前，该金额不计入执行额、不可据此向甲方收款。
        </div>
      )}
    </PjSection>
  );
}

/**
 * 消防设施台账：回答「服务对象有多大」——建筑面积、各类点位数量、设施资产原值。
 * 维保 / 检测报价不数材料，数的就是这三个基数：后续报价行按台账自动带入，台账缺项则报价行无依据。
 */
function FacilityLedger({ C }: { C: PjCtx }) {
  const area = C.P.builtArea || 0;
  const pts = C.P.points || [];
  const asset = C.P.assetAmt || 0;
  const totalPts = pts.reduce((s, p) => s + p.qty, 0);
  const empty = !area && !pts.length && !asset;

  /* 价卡按业务线选定：维保项目挂「年度维保」、检测项目挂「消防设施检测」，
     不再写死某一张价卡 —— 否则检测项目展示的始终是维保单价与「元/年」。 */
  const svc = SERVICES.find((s) => (C.P.biz === 'JC'
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
      title={<><Ico n="building" size={16} /> 消防设施台账</>}
      extra={<>
        <span className="nc-cell-sub">
          建筑面积 {area ? area.toLocaleString('en-US') : '—'} ㎡ · 点位 {totalPts ? totalPts.toLocaleString('en-US') : '—'} 个 ·
          设施资产原值 {asset ? fmt(asset) : '—'}
        </span>
        <Tip w={380} text="维保 / 检测报价的计量基数取自本台账：按面积（阶梯单价）、按点位（分设备单价）、按设施造价（百分比）三种口径各有取值。台账缺项时报价只能在报价页手工补录，事后须回来补齐。" />
      </>}
    >
      {empty ? (
        <div className="nc-empty-mini">
          本项目尚未登记消防设施台账。做维保 / 检测报价时会缺少计量基数，需在报价页手工补录后回来补齐。
        </div>
      ) : (
        <>
          <table className="nc-tbl" style={{ minWidth: 880 }}>
            <thead><tr>
              <th>点位类别</th><th style={{ width: 100 }}>计量单位</th>
              <th style={{ width: 120, textAlign: 'right' }}>数量</th>
              <th style={{ width: 150, textAlign: 'right' }}>单价（{unitCn}）</th>
              <th style={{ width: 130, textAlign: 'right' }}>年度小计（元）</th>
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
              {!pts.length && <tr><td colSpan={5} className="nc-empty-mini">无点位台账</td></tr>}
            </tbody>
          </table>

          <div className="nc-ledhd" style={{ marginTop: 16 }}>按本项目台账试算{C.P.biz === 'JC' ? '单次检测' : '年度维保'}
            <Tip w={420} text="同一套台账、三种行业口径的价格差异一目了然 —— 报给甲方选哪种，取决于结算习惯与「哪种口径对我方更有利」，因此报价时还能再切换。" />
          </div>
          <table className="nc-tbl" style={{ minWidth: 880 }}>
            <thead><tr>
              <th style={{ width: 150 }}>计价口径</th><th>算式</th>
              <th style={{ width: 140, textAlign: 'right' }}>金额（元/年）</th>
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
            三种口径结果不同属行业常态：面积 / 点位对应常规年度巡检，按设施造价对应全包型合同（含配件更换 / 驻点）。
            签约前须选定一种写入合同，选定后该口径即为结算依据。
          </div>
        </>
      )}
    </PjSection>
  );
}

export default function BizSub({ C }: { C: PjCtx }) {
  return (
    <>
      <ContractTree C={C} />
      <FacilityLedger C={C} />
      <ChangeVisa C={C} />
    </>
  );
}
