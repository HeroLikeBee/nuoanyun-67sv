// 项目详情 · 商务合同子页
//
// 回答「合同怎么签的、钱怎么收的、支出怎么走的、变更签证怎么算的」。
// 口径：合同树按收款 / 付款方向分组；收款期次展开看实收与开票；变更与签证是执行额的来源。
import React, { useState } from 'react';
import { Btn, Card, Code, EntityLink, IdCell, Money, Steps, Tag, Tip } from '../ui';
import { Ico } from '../icons';
import { PjSection } from './PjSection';
import type { PjCtx, PjSaleContract } from './ctx';

const PAY_ST: Record<string, { t: 'green' | 'orange' | 'red' | 'blue' | 'gray'; n: string }> = {
  paid: { t: 'green', n: '已到账 / 已付' },
  invoiced: { t: 'orange', n: '已开票·待到账' },
  overdue: { t: 'red', n: '逾期未收' },
  flushed: { t: 'gray', n: '已红字冲销' },
  hc: { t: 'gray', n: '红字冲销单' },
  approving: { t: 'blue', n: '审批中 · 不计现金' },
};

const VISAS = [
  { no: 'QZ000007', date: '2026-09-28', reason: '商场 B1 机房新增气体灭火系统（甲方口头要求）', amt: 80000, photos: 5, sign: '已签认', chg: 'BG000009', chgSt: '商务审批中' },
  { no: 'QZ000006', date: '2026-10-02', reason: '二区吊顶内新增桥架绕行（现场洽商）', amt: 23500, photos: 3, sign: '待签认', chg: '—', chgSt: '未生成变更单' },
];
const CHANGES = [
  { id: 'BG0001', title: '材料调差价格调整补充协议（HT000009S1）', amt: 150000, st: '已生效', by: '蓝峰', date: '2026-09-18', contract: 'HT000009', cat: '材料调差' },
  { id: 'BG000009', title: '机房气体灭火系统增补', amt: 80000, st: '商务审批中', flowIdx: 2, by: '蓝峰', date: '2026-09-12', contract: 'HT000009', cat: '材料费' },
];
const FLOW = ['发起', 'PM 审核', '商务审批', '客户确认', '生效'];
const PAY_FILTERS = ['全部', '收入', '采购付款', '无合同付款', '红字冲销单'];

/** 合同树：收款类（销售 / 维保 / 补充协议）+ 付款类（采购 / 分包） */
function ContractTree({ C }: { C: PjCtx }) {
  const [open, setOpen] = useState<Record<string, boolean>>({ HT000009: true });
  const toggle = (k: string) => setOpen((s) => ({ ...s, [k]: !s[k] }));
  const saleSum = C.saleCt.reduce((s, c) => s + c.amt, 0);
  const buySum = C.buyCt.reduce((s, c) => s + c.amt, 0);

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

          <div className="nc-ledhd" style={{ marginTop: 18 }}>无合同付款（项目级挂账） <b>2</b>
            <Tip w={340} text="应急采购在归并到合同前单独挂账；归并后原行保留置灰、标记去向，避免重复计入成本。" />
          </div>
          <div className="nc-gate">
            {C.payRows.filter((r) => r.kind === '无合同付款').map((r) => (
              <div key={r.id} className="nc-gate-row">
                <span className="nc-gate-n">{r.id} <div className="nc-cell-sub">{r.use} · {r.date}</div></span>
                <span className="is-num num">{r.amt.toLocaleString()}</span>
                <span className="nc-gate-s">
                  {r.mergedTo ? <Tag tone="gray">已归并 → {r.mergedTo}</Tag> : <Tag tone={PAY_ST[r.st]?.t ?? 'gray'}>{PAY_ST[r.st]?.n ?? r.st}</Tag>}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 收款期次：7 列表格不放半宽栏内，展开后全宽展示，避免列被挤成竖排 */}
      {C.saleCt.filter((c) => c.payplan && open[c.code]).map((c) => (
        <div key={`q-${c.code}`} style={{ marginTop: 14 }}>
          <div className="nc-ledhd">
            <Code>{c.code}</Code> 收款期次
            <span className="nc-cell-sub" style={{ marginLeft: 8 }}>
              应收 {c.payplan!.reduce((s, p) => s + p.amt, 0).toLocaleString()} 元 ·
              实收 {c.payplan!.reduce((s, p) => s + p.got, 0).toLocaleString()} 元
            </span>
            <span style={{ marginLeft: 'auto' }}><Btn size="sm" onClick={() => toggle(c.code)}>收起 ▲</Btn></span>
          </div>
          <table className="nc-tbl" style={{ minWidth: 900 }}>
            <thead><tr>
              <th style={{ width: 150 }}>收款期次</th>
              <th style={{ width: 110 }} className="is-num">应收金额</th>
              <th style={{ width: 160 }}>实收情况</th>
              <th style={{ width: 110 }}>实收日期</th>
              <th style={{ width: 100 }}>开票状态</th>
              <th style={{ width: 110 }}>计划日期</th>
              <th>备注</th>
            </tr></thead>
            <tbody>
              {c.payplan!.map((p) => (
                <tr key={p.n} className={p.st === '已开票·待到账' ? 'is-warn-row' : ''}>
                  <td>{p.n}</td>
                  <td className="is-num num">{p.amt.toLocaleString()}</td>
                  <td className="num">{p.got > 0 ? p.got.toLocaleString() : '—'} <span className="nc-cell-sub">/ {p.amt.toLocaleString()}</span></td>
                  <td className="num">{p.gotDate}</td>
                  <td><Tag tone={p.inv === '已开票' ? 'blue' : 'gray'}>{p.inv}</Tag></td>
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

/** 收支明细：一条流水看资金去向；红字冲销按净额 */
function PayFlow({ C }: { C: PjCtx }) {
  const rows = C.payFilter === '全部' ? C.payRows : C.payRows.filter((r) => r.kind === C.payFilter);
  return (
    <PjSection
      title={<><Ico n="swap" size={16} /> 收支明细</>}
      extra={<>
        <span className="nc-cell-sub">收入 {C.SUM_IN.toLocaleString()} · 支出 {C.SUM_OUT.toLocaleString()} · 净额 {C.NET_IN.toLocaleString()}</span>
        <Tip w={380} text="回款口径：仅银行已到账计入回款；已开票未到账挂应收账龄。红字冲销单与原单据成对出现，按净额统计现金。" />
        <Btn size="sm" onClick={() => C.openM('pay')}>登记收款</Btn>
      </>}
    >
      <div className="nc-subtabs">
        {PAY_FILTERS.map((f) => (
          <button key={f} className={`nc-subtab${C.payFilter === f ? ' is-on' : ''}`} onClick={() => C.setPayFilter(f)}>{f}</button>
        ))}
      </div>
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
              <td><Tag tone={PAY_ST[r.st]?.t ?? 'gray'}>{PAY_ST[r.st]?.n ?? r.st}</Tag></td>
            </tr>
          ))}
        </tbody>
      </table>
    </PjSection>
  );
}

/** 变更与签证：执行额的来源；签证未走完变更审批不计入执行额、不可据此收款 */
function ChangeVisa({ C }: { C: PjCtx }) {
  return (
    <PjSection
      title={<><Ico n="swap" size={16} /> 变更与签证</>}
      extra={<>
        <span className="nc-cell-sub">执行额 = 合同额 + 已生效变更 {C.CHG_EFFECTIVE.toLocaleString()}{C.CHG_PENDING > 0 ? ` · 审批中 +${C.CHG_PENDING.toLocaleString()}` : ''}</span>
        <Btn size="sm" kind="primary" onClick={() => C.openM('change')}>＋ 发起变更</Btn>
      </>}
    >
      <div className="nc-ledhd">合同变更 <b>{CHANGES.length}</b>
        <Tip w={380} text="变更流程：发起 → PM 审核 → 商务审批 → 客户确认 → 生效。已生效变更进执行额；审批中暂计入展示口径，不计现金。" />
      </div>
      {CHANGES.map((c) => (
        <div key={c.id} className="nc-ctcard">
          <div className="nc-ctcard-hd">
            <Code>{c.id}</Code><b>{c.title}</b>
            <Tag tone={c.st === '已生效' ? 'green' : 'blue'}>{c.st}</Tag>
            <span className="nc-ctcard-amt">+{c.amt.toLocaleString()}</span>
          </div>
          <div className="nc-cell-sub">{c.cat} · 关联 {c.contract} · {c.by} · {c.date}</div>
          <Steps items={FLOW.map((f) => ({ label: f }))} cur={c.st === '已生效' ? FLOW.length : (c.flowIdx ?? 0) + 1} />
        </div>
      ))}

      <div className="nc-ledhd" style={{ marginTop: 16 }}>签证洽商 <b>{VISAS.length}</b>
        <Tip w={400} text="未走完合同变更审批与补充协议的签证，不计入执行额、不可据此收款——这是常见的漏单点，故在签证行内直接显示「已生成变更单 / 未生成」。" />
      </div>
      <table className="nc-tbl" style={{ minWidth: 900 }}>
        <thead><tr>
          <th style={{ width: 110 }}>签证号</th><th style={{ width: 110 }}>日期</th>
          <th>事由</th><th style={{ width: 110 }} className="is-num">金额（元）</th>
          <th style={{ width: 90 }}>照片</th><th style={{ width: 100 }}>签认</th>
          <th style={{ width: 120 }}>变更单</th><th style={{ width: 130 }}>变更状态</th>
        </tr></thead>
        <tbody>
          {VISAS.map((v) => (
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
                  ? <Btn size="sm" onClick={() => C.openM('change')}>生成变更单</Btn>
                  : <Tag tone="blue">{v.chgSt}</Tag>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="nc-gate-block" style={{ background: 'var(--c-warning-bg)', borderColor: 'var(--c-warning-border)' }}>
        <Ico n="warning" size={14} />
        存在 1 笔未生成变更单的签证（QZ000006 · 23,500 元）—— 在生成变更单并生效前，该金额不计入执行额、不可据此向甲方收款。
      </div>
    </PjSection>
  );
}

export default function BizSub({ C }: { C: PjCtx }) {
  const inv = C.payRows.filter((r) => r.st === 'invoiced');
  return (
    <>
      <ContractTree C={C} />
      {/* 收款与支出的三段口径：应收 / 已收 / 待收，与概览页同源不重算 */}
      <PjSection title={<><Ico n="card" size={16} /> 回款口径</>}>
        <div className="nc-lineage">
          {[
            { k: '应收（执行额）', v: C.EXEC_AMT, n: '合同额 + 已生效变更' },
            { k: '已收（银行到账）', v: C.CASH_IN, n: `回款率 ${C.PAY_PROGRESS.toFixed(1)}%` },
            { k: '已开票未到账', v: C.overdueAmt, n: inv.map((r) => r.id).join(' / ') || '—' },
            { k: '未回款', v: C.UNRECV, n: '执行额 − 已到账 − 坏账' },
          ].map((x, i) => (
            <React.Fragment key={x.k}>
              {i > 0 && <span className="nc-lineage-arrow">{i === 2 ? '／' : '→'}</span>}
              <span className="nc-lineage-node">
                <span className="nc-lineage-k">{x.k}</span>
                <span className="nc-lineage-v num">{x.v.toLocaleString()}</span>
                <span className="nc-lineage-st">{x.n}</span>
              </span>
            </React.Fragment>
          ))}
        </div>
      </PjSection>
      <PayFlow C={C} />
      <ChangeVisa C={C} />
      <Card hd={<span><Ico n="card" size={16} /> 质保金与保证金</span>}>
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
                <td><Tag tone={d.st === '未退' ? 'orange' : d.st === '已退还' ? 'green' : 'gray'}>{d.st}</Tag></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="nc-cell-sub" style={{ marginTop: 8 }}>
          <Money role={C.role} v={C.WARRANTY} /> 质保金按合同额 × 3%（法定上限）派生，不并入我方缴纳台账，避免同一笔钱两处口径。
        </div>
      </Card>
    </>
  );
}
