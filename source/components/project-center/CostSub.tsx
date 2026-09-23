// 项目详情 · 成本台账子页
//
// 回答「钱花到哪里去了」：预算 → 科目 → 流水 → 现场投入，一笔钱从预算到发生可追。
// 不重复概览页的绝对值口径：本页只承接科目分解、流水单据与人工/机械/材料明细。
import React, { useState } from 'react';
import { Btn, Card, Code, Drawer, IdCell, Op, Tag, Tip } from '../ui';
import { Ico } from '../icons';
import { BUDGET_SRC_LABEL, TODAY } from '../data';
import { PjSection } from './PjSection';
import type { PjCtx, PjCostRow } from './ctx';

const SRC_NAME: Record<string, string> = { CG: '采购', CB: '登记', PF: '无合同付款' };
const COST_ST: Record<string, { t: 'green' | 'blue' | 'gray' | 'red'; n: string }> = {
  approving: { t: 'blue', n: '审批中 · 暂计入' },
};

/** 成本流水穿透：点单据号看钱的来源与去向（抽屉，不跳页） */
function FlowDrawer({ C, row, onClose }: { C: PjCtx; row: PjCostRow | null; onClose: () => void }) {
  const [sub, setSub] = useState('detail');
  if (!row) return null;
  const merged = C.costRows.find((r) => r.id === row.mergedTo);
  return (
    <Drawer
      open width={640} onClose={onClose}
      title={<span><Code>{row.id}</Code> 成本流水</span>}
      sub={`${row.date} · ${SRC_NAME[row.src]} · ${row.type}`}
      foot={<><span className="nc-cell-sub" style={{ marginRight: 'auto' }}>成本更正不可物理删除，负数追加</span>
        <Btn onClick={onClose}>关闭</Btn></>}
    >
      <div className="nc-subtabs">
        <button className={`nc-subtab${sub === 'detail' ? ' is-on' : ''}`} onClick={() => setSub('detail')}>单据明细</button>
        <button className={`nc-subtab${sub === 'at' ? ' is-on' : ''}`} onClick={() => setSub('at')}>成本流水</button>
      </div>
      {sub === 'detail' && (
        <>
          <div className="nc-gate">
            {[
              { n: '发生金额', v: `${row.amt.toLocaleString()} 元` },
              { n: '成本类别', v: row.type },
              { n: '发生日期', v: row.date },
              { n: '来源单据', v: row.src === 'PF' ? '无合同付款' : `${SRC_NAME[row.src]}单 ${row.id}` },
              { n: '挂账主体', v: row.src === 'PF' ? `${C.P.id}（项目级，未落合同）` : `合同 ${row.id}` },
              { n: '是否红字冲销', v: row.id.startsWith('HC') ? '是（负数追加）' : '否' },
              { n: '当前状态', v: row.st ? (COST_ST[row.st]?.n ?? row.st) : '已计入成本' },
            ].map((r) => (
              <div key={r.n} className="nc-gate-row">
                <span className="nc-gate-n">{r.n}</span>
                <span className="is-num num">{r.v}</span>
                <span className="nc-gate-s" />
              </div>
            ))}
          </div>
          {merged && (
            <div className="nc-gate-block" style={{ background: 'var(--c-warning-bg)', borderColor: 'var(--c-warning-border)' }}>
              <Ico n="warning" size={14} />
              本笔已归并至 {merged.id}（{merged.note}）—— 原行保留并置灰，不重复计入成本合计。
            </div>
          )}
          {!merged && row.src !== 'PF' && (
            <div className="nc-gate-block" style={{ background: 'var(--c-primary-bg)', borderColor: 'var(--c-primary-border)' }}>
              <Ico n="help" size={14} />
              无合同付款（项目级）在归并前单独挂账；归并后原行保留置灰、标记去向，避免重复计入。
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <Tip w={420} text="成本一经发生即计入（含审批中），红字冲销按净额追加，不做物理删除——保证台账与财务凭证可对账。" />
          </div>
        </>
      )}
      {sub === 'at' && (
        <div className="nc-gate">
          {[
            { t: `${row.date} 成本登记`, d: `${row.note} · ${row.amt.toLocaleString()} 元`, tag: 'cost' },
            { t: `${row.date} 凭证归档`, d: `附件已归档至「文档 · 成本」分类`, tag: 'doc' },
            { t: `${TODAY} 状态`, d: row.st ? COST_ST[row.st]?.n : '已计入成本合计', tag: 'now' },
          ].map((x) => (
            <div key={x.t} className="nc-gate-row">
              <span className="nc-gate-n"><b>{x.t}</b><div className="nc-cell-sub">{x.d}</div></span>
              <span className="nc-gate-s"><Tag tone={x.tag === 'now' ? 'blue' : 'gray'}>{x.tag === 'now' ? '当前' : '已完成'}</Tag></span>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}

export default function CostSub({ C }: { C: PjCtx }) {
  const [sub, setSub] = useState('ledger');
  const [flow, setFlow] = useState<PjCostRow | null>(null);
  const [filter, setFilter] = useState('全部');
  const rows = filter === '全部' ? C.costRows : C.costRows.filter((r) => r.type === filter);
  const types = ['全部', ...Array.from(new Set(C.costRows.map((r) => r.type)))];

  /** 资金穿透链：目标成本 → 预算科目 → 已发生流水 → 已付款 → 现金流 */
  const paidOut = C.payRows.filter((r) => r.kind !== '收入' && r.st === 'paid').reduce((s, r) => s + r.amt, 0);
  /** 目标成本来源：立项录入（手工 / 从报价带入）或未录入时的估算口径，据实标注 */
  const budgetNote = C.BUDGET_EST
    ? '未录入立项预算 · 按执行额 72% 估算'
    : `立项预算 · ${BUDGET_SRC_LABEL[C.BUDGET_SRC ?? 'manual']}`;
  const chain = [
    { k: '目标成本', v: C.PLAN_SUM, n: budgetNote },
    { k: '已发生成本', v: C.COST_SUM, n: `含审批中 · 占目标 ${C.COST_PROGRESS.toFixed(1)}%` },
    { k: '已付款', v: paidOut, n: '银行已付净额（红字按净额）' },
    { k: '净现金流', v: C.NET_IN, n: '已到账 − 已付出' },
  ];
  const chainMax = Math.max(...chain.map((x) => Math.abs(x.v)), 1);

  return (
    <>
      <PjSection
        title={<><Ico n="swap" size={16} /> 资金穿透链</>}
        extra={<Tip w={400} text="目标成本来自立项预算；已发生成本一经发生即计入（含审批中）；已付款为银行实付净额。逐段差额即为「已发生未付款」与「应付未结」。" />}
      >
        <div className="nc-lineage">
          {chain.map((x, i) => (
            <React.Fragment key={x.k}>
              {i > 0 && <span className="nc-lineage-arrow">→</span>}
              <span className="nc-lineage-node">
                <span className="nc-lineage-k">{x.k}</span>
                <span className="nc-lineage-v num">{(x.v / 10000).toFixed(1)} 万</span>
                <span className="nc-lineage-st">{x.n}</span>
                <span style={{ height: 4, borderRadius: 2, background: 'var(--c-hairline)', marginTop: 2 }}>
                  <span style={{ display: 'block', height: 4, borderRadius: 2, width: `${(Math.abs(x.v) / chainMax) * 100}%`, background: i === 3 ? (x.v >= 0 ? 'var(--c-success)' : 'var(--c-danger)') : 'var(--c-primary)' }} />
                </span>
              </span>
            </React.Fragment>
          ))}
        </div>
      </PjSection>

      <Card flush style={{ marginBottom: 16 }}>
        <div className="nc-card-hd">
          <div className="nc-subtabs" style={{ margin: 0 }}>
            <button className={`nc-subtab${sub === 'ledger' ? ' is-on' : ''}`} onClick={() => setSub('ledger')}>成本明细</button>
            <button className={`nc-subtab${sub === 'plan' ? ' is-on' : ''}`} onClick={() => setSub('plan')}>目标成本科目</button>
            <button className={`nc-subtab${sub === 'site' ? ' is-on' : ''}`} onClick={() => setSub('site')}>现场投入</button>
            <button className={`nc-subtab${sub === 'chg' ? ' is-on' : ''}`} onClick={() => setSub('chg')}>成本变更</button>
          </div>
          <span style={{ marginLeft: 'auto' }} />
        </div>

        {sub === 'ledger' && (
          <div className="nc-card-bd">
            <div className="nc-subtabs">
              {types.map((t) => (
                <button key={t} className={`nc-subtab${filter === t ? ' is-on' : ''}`} onClick={() => setFilter(t)}>{t}</button>
              ))}
              <Tip w={360} text="来源单据统一显示为业务名称（采购 / 登记 / 无合同付款），不出现 CG / CB / PF 这类前缀缩写。红字冲销单以负数追加，原单据保留并置灰。" />
              <span style={{ marginLeft: 'auto' }} className="nc-cell-sub">
                合计 {C.COST_SUM.toLocaleString()} 元 · 占目标成本 {C.COST_PROGRESS.toFixed(1)}%
              </span>
            </div>
            <table className="nc-tbl" style={{ minWidth: 900 }}>
              <thead><tr>
                <th style={{ width: 130 }}>单据号</th>
                <th style={{ width: 100 }}>来源</th>
                <th style={{ width: 90 }}>类别</th>
                <th style={{ width: 120 }} className="is-num">金额（元）</th>
                <th style={{ width: 110 }}>发生日期</th>
                <th>说明</th>
                <th style={{ width: 130 }}>状态</th>
                <th style={{ width: 90 }}>操作</th>
              </tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className={r.mergedTo ? 'is-warn-row' : ''}>
                    <td><IdCell onClick={() => setFlow(r)}>{r.id}</IdCell></td>
                    <td>{SRC_NAME[r.src]}</td>
                    <td>{r.type}</td>
                    <td className={`is-num num${r.amt < 0 ? ' nc-v-red' : ''}`}>{r.amt.toLocaleString()}</td>
                    <td className="num">{r.date}</td>
                    <td>
                      {r.note}
                      {r.mergedTo && <div className="nc-cell-sub">已归并 → {r.mergedTo}（原行保留置灰，不重复计入）</div>}
                    </td>
                    <td>
                      {r.mergedTo ? <Tag tone="gray">已归并</Tag>
                        : r.st ? <Tag tone={COST_ST[r.st]?.t ?? 'gray'}>{COST_ST[r.st]?.n ?? r.st}</Tag>
                          : <Tag tone="green">已计入成本</Tag>}
                    </td>
                    <td><Btn size="sm" onClick={() => setFlow(r)}>穿透</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {sub === 'plan' && (
          <div className="nc-card-bd">
            <div className="nc-subtabs">
              <Tip w={380} text="目标成本来自立项预算或报价单成本明细带入，科目行内可编辑并留痕；已生效变更同步体现在对应科目行。" />
              <span style={{ marginLeft: 'auto' }} className="nc-cell-sub">
                合计 {C.PLAN_SUM.toLocaleString()} 元 · 含已生效变更 {(C.CHG_EFFECTIVE / 10000).toFixed(1)} 万
                {C.CHG_PENDING > 0 && ` · 审批中 +${(C.CHG_PENDING / 10000).toFixed(1)} 万（虚线）`}
              </span>
            </div>
            {C.groupedPlan.map((g) => (
              <div key={g.g} style={{ marginBottom: 14 }}>
                <div className="nc-ledhd">{g.g} <b>{g.sum.toLocaleString()} 元</b></div>
                <table className="nc-tbl" style={{ minWidth: 700 }}>
                  <thead><tr>
                    <th style={{ width: 120 }}>科目</th>
                    <th style={{ width: 140 }} className="is-num">目标金额（元）</th>
                    <th style={{ width: 110 }} className="is-num">占比</th>
                    <th>说明</th>
                    <th style={{ width: 220 }}>实际发生</th>
                  </tr></thead>
                  <tbody>
                    {g.rows.map((r) => {
                      const act = C.costRows.filter((x) => x.type === r.type).reduce((s, x) => s + x.amt, 0);
                      const over = act > r.amt;
                      return (
                        <tr key={r.type}>
                          <td>{r.type}</td>
                          <td className="is-num num">{r.amt.toLocaleString()}</td>
                          <td className="is-num num">{((r.amt / C.PLAN_SUM) * 100).toFixed(1)}%</td>
                          <td className="nc-cell-sub">{r.note}</td>
                          <td>
                            <div className="nc-paybar" style={{ width: '100%' }}>
                              <i style={{ width: `${Math.min(100, (act / r.amt) * 100)}%`, background: over ? 'var(--c-danger)' : 'var(--c-primary)' }} />
                            </div>
                            <div className="nc-cell-sub">已发生 {act.toLocaleString()} · {over ? `超支 +${(act - r.amt).toLocaleString()}` : `余 ${(r.amt - act).toLocaleString()}`}</div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
            <Tip w={420} text="目标成本科目与实际成本按同一类别口径对齐，保证「科目内超支」可在行内直接看到，不必再单独做差异表。" />
          </div>
        )}

        {sub === 'site' && (
          <div className="nc-card-bd">
            <div className="nc-ledhd">
              人工投入 <b>{C.laborSum.toLocaleString()} 元</b>
              <span className="nc-cell-sub">来源：移动端报工（本平台只读消费）· 本月累计出勤</span>
            </div>
            <table className="nc-tbl" style={{ minWidth: 820 }}>
              <thead><tr>
                <th style={{ width: 90 }}>人员号</th><th>姓名</th><th style={{ width: 100 }}>工种</th>
                <th style={{ width: 130 }}>班组</th><th style={{ width: 90 }} className="is-num">出勤天数</th>
                <th style={{ width: 110 }} className="is-num">综合单价</th><th style={{ width: 120 }} className="is-num">人工费（元）</th>
              </tr></thead>
              <tbody>
                {C.laborRows.map((w) => (
                  <tr key={w.id}>
                    <td><Code>{w.id}</Code></td>
                    <td><b>{w.name}</b></td>
                    <td>{w.trade}</td>
                    <td>{w.team}</td>
                    <td className="is-num num">{w.days}</td>
                    <td className="is-num num">{w.rate}</td>
                    <td className="is-num num">{w.cost.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="nc-ledhd" style={{ marginTop: 20 }}>
              机械投入 <b>{C.machSum.toLocaleString()} 元</b>
              <span className="nc-cell-sub">台班单价 × 台班数</span>
            </div>
            <table className="nc-tbl" style={{ minWidth: 700 }}>
              <thead><tr>
                <th>机械名称</th><th style={{ width: 80 }}>计量单位</th><th style={{ width: 90 }} className="is-num">数量</th>
                <th style={{ width: 110 }} className="is-num">单价</th><th style={{ width: 120 }} className="is-num">金额（元）</th><th style={{ width: 110 }}>进场日期</th>
              </tr></thead>
              <tbody>
                {C.machRows.map((r) => (
                  <tr key={r.name}>
                    <td><b>{r.name}</b></td><td>{r.unit}</td>
                    <td className="is-num num">{r.qty}</td><td className="is-num num">{r.price}</td>
                    <td className="is-num num">{r.amt.toLocaleString()}</td><td className="num">{r.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="nc-ledhd" style={{ marginTop: 20 }}>
              材料设备投入 <b>{C.matSum.toLocaleString()} 元</b>
              <span className="nc-cell-sub">领用出库记录 · 单价取物料主数据</span>
            </div>
            <table className="nc-tbl" style={{ minWidth: 900 }}>
              <thead><tr>
                <th style={{ width: 110 }}>物料号</th><th>名称</th><th style={{ width: 160 }}>规格</th>
                <th style={{ width: 80 }}>单位</th><th style={{ width: 90 }} className="is-num">领用量</th>
                <th style={{ width: 100 }} className="is-num">单价</th><th style={{ width: 120 }} className="is-num">金额（元）</th>
                <th style={{ width: 110 }}>领用日期</th>
              </tr></thead>
              <tbody>
                {C.matRows.map((r) => (
                  <tr key={r.code + r.date}>
                    <td><Code>{r.code}</Code></td>
                    <td><b>{r.name}</b></td>
                    <td className="nc-cell-sub">{r.spec}</td>
                    <td>{r.unit}</td>
                    <td className="is-num num">{r.qty.toLocaleString()}</td>
                    <td className="is-num num">{r.price}</td>
                    <td className="is-num num">{r.amt.toLocaleString()}</td>
                    <td className="num">{r.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {sub === 'chg' && (
          <div className="nc-card-bd">
            <div className="nc-ledhd">
              成本相关变更 <b>2</b>
              <span className="nc-cell-sub">变更是合同单据（须签补充协议）→ 本表只读它对目标成本的影响；发起请回到合同「变更与签证」</span>
              <span style={{ marginLeft: 'auto' }}>
                <Op onClick={() => C.gotoContractChange()}>到合同发起变更 →</Op>
              </span>
            </div>
            <table className="nc-tbl" style={{ minWidth: 820 }}>
              <thead><tr>
                <th style={{ width: 110 }}>变更单号</th><th>变更事项</th><th style={{ width: 100 }}>类别</th>
                <th style={{ width: 120 }} className="is-num">金额（元）</th><th style={{ width: 120 }}>状态</th>
                <th style={{ width: 100 }}>发起人</th><th style={{ width: 110 }}>发起日期</th>
              </tr></thead>
              <tbody>
                {[
                  { id: 'BG0001', title: '材料调差价格调整补充协议（HT000009S1）', cat: '材料调差', amt: 150000, st: '已生效', by: '蓝峰', date: '2026-09-18' },
                  { id: 'BG000009', title: '机房气体灭火系统增补', cat: '材料费', amt: 80000, st: '商务审批中', by: '蓝峰', date: '2026-09-12' },
                ].map((r) => (
                  <tr key={r.id}>
                    <td><Code>{r.id}</Code></td>
                    <td><b>{r.title}</b></td>
                    <td>{r.cat}</td>
                    <td className="is-num num">+{r.amt.toLocaleString()}</td>
                    <td><Tag tone={r.st === '已生效' ? 'green' : 'blue'}>{r.st}</Tag></td>
                    <td>{r.by}</td>
                    <td className="num">{r.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="nc-gate-block" style={{ background: 'var(--c-primary-bg)', borderColor: 'var(--c-primary-border)' }}>
              <Ico n="help" size={14} />
              变更由合同侧发起（合同详情「变更与签证」→ ＋ 新增变更）；生效后同步体现到「目标成本科目」的对应行，执行额随之增加；未生效前只作过程记录，不参与结算。
            </div>
          </div>
        )}
      </Card>

      <FlowDrawer C={C} row={flow} onClose={() => setFlow(null)} />
    </>
  );
}
