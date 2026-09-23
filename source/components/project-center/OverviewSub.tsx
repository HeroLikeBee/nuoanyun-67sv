// 项目详情 · 概览（默认子页）
//
// 职责：回答「这个项目现在怎么样、卡在哪、下一步做什么」，不重复摊开台账明细。
// 版式：KPI 带 → 三列（合同与回款 / 成本与利润 / 风险与覆盖）× 业务域入口 → 全链路血缘。
// 口径：所有绝对值只在此处出现一次，其余子页只承接差额 / 比率 / 流水。
import React from 'react';
import { Btn, Card, Code, EntityLink, Progress, Tag, Tip } from '../ui';
import { Ico } from '../icons';
import type { IconName } from '../icons';
import { PROJECT_STATUS_TONE, isServiceProject, fmtAmt } from '../data';
import { PjSection } from './PjSection';
import type { PjCtx } from './ctx';

/** KPI 带：6 格，绝对值口径；每格可穿透（jump 为 undefined 时不可点） */
function KpiStrip({ C }: { C: PjCtx }) {
  const cells: { k: string; v: React.ReactNode; sub: string; tone?: string; jump?: string }[] = [
    {
      k: '合同额', v: fmtAmt(C.CONTRACT_NOW),
      sub: `执行额 ${(C.EXEC_AMT / 10000).toFixed(1)} 万（含已生效变更）`, jump: 'biz',
    },
    {
      k: '已回款', v: fmtAmt(C.CASH_IN),
      sub: `回款率 ${C.PAY_PROGRESS.toFixed(1)}% ÷ 执行额 · 未回款 ${(C.UNRECV / 10000).toFixed(1)} 万`, jump: 'biz',
    },
    {
      k: '已发生成本', v: fmtAmt(C.COST_SUM),
      sub: `目标成本 ${(C.PLAN_SUM / 10000).toFixed(1)} 万 · 占目标 ${C.COST_PROGRESS.toFixed(1)}%`, jump: 'cost',
    },
    {
      k: '净现金流', v: `${C.NET_IN >= 0 ? '+' : '−'}${fmtAmt(Math.abs(C.NET_IN))}`,
      sub: '已到账 − 已付出 · 审批中不计', jump: 'cost',
    },
    {
      k: '施工进度', v: `${C.progActual}%`,
      sub: `计划应到 ${C.progPlan}% · 偏差 ${C.progDev >= 0 ? '+' : ''}${C.progDev}% ${C.progTag}`,
      tone: C.progLevel === 'red' ? 'red' : C.progLevel === 'yellow' ? 'orange' : undefined,
      jump: 'track',
    },
    {
      k: '质量整改待闭环', v: `${C.dunCount}`, sub: '含逾期应收 / 超支 / 待审批', tone: C.dunCount > 0 ? 'orange' : undefined, jump: 'quality',
    },
  ];
  return (
    <Card style={{ marginTop: 0 }}>
      <div className="nc-ovstrip" style={{ marginTop: 0, border: 0, boxShadow: 'none', borderRadius: 0 }}>
        {cells.map((c) => (
          <button
            key={c.k} className="nc-ovcell" onClick={() => c.jump && C.pj(c.jump)}
            title={c.jump ? '查看对应业务域' : undefined}
          >
            <span className="nc-ovcell-k">{c.k} {c.jump && <span className="nc-drill">穿透↗</span>}</span>
            <span
              className="nc-ovcell-v num"
              style={c.tone === 'green' ? { color: 'var(--c-success)' }
                : c.tone === 'red' ? { color: 'var(--c-danger)' }
                  : c.tone === 'orange' ? { color: 'var(--c-warning-mid)' } : undefined}
            >{c.v}</span>
            <span className="nc-ovcell-sub">{c.sub}</span>
          </button>
        ))}
      </div>
    </Card>
  );
}

/** 左栏：合同与回款 —— 合同树 + 回款期次 + 未回款构成（绝对值的唯一归属地） */
function CardReceipt({ C }: { C: PjCtx }) {
  const got = C.payRows.filter((r) => r.kind === '收入' && r.st === 'paid');
  const invoiced = C.overdue;
  const pendingPlan = C.saleCt.flatMap((c) => c.payplan ?? []).filter((p) => p.st === '未到期');
  const rest = Math.max(0, C.EXEC_AMT - C.CASH_IN - C.overdueAmt);
  const pct = (v: number) => (C.EXEC_AMT > 0 ? (v / C.EXEC_AMT) * 100 : 0);

  return (
    <Card
      hd={<span><Ico n="card" size={16} /> 合同与回款</span>}
      extra={<Btn size="sm" onClick={() => C.pj('biz')}>进入商务合同 →</Btn>}
    >
      {C.saleCt.map((c) => (
        <div key={c.code} className="nc-ctcard">
          <div className="nc-ctcard-hd">
            <EntityLink target="contract" id={c.code} go={C.go} title="下钻到合同详情"><Code>{c.code}</Code></EntityLink>
            <b>{c.name}</b>
            <Tag tone={c.tone}>{c.st}</Tag>
            <span className="nc-ctcard-amt">{c.payplan ? (c.amt / 10000).toFixed(0) : (c.amt / 10000).toFixed(0)} 万</span>
          </div>
          {c.children?.map((ch) => (
            <div key={ch.code} className="nc-cell-sub" style={{ margin: '4px 0 0 12px' }}>
              └ {ch.code} {ch.name} <span className="num">+{(ch.amt / 10000).toFixed(1)} 万</span>
            </div>
          ))}
        </div>
      ))}

      <div className="nc-ledhd" style={{ marginTop: 14 }}>
        未回款构成 <b>{(C.UNRECV / 10000).toFixed(1)} 万</b>
        <Tip w={340} text="未回款 = 执行额 − 银行已到账 − 已核销坏账。已开票未到账挂应收账龄，不计回款；未到期为按合同尚未到期的期次。" />
      </div>
      <div className="nc-gate">
        {[
          { n: '已到账（计入回款）', v: C.CASH_IN, st: <Tag tone="green">已回款</Tag>, exp: got.map((r) => r.id).join(' / ') },
          { n: '已开票未到账（应收账龄）', v: C.overdueAmt, st: <Tag tone="orange">催收中</Tag>, exp: invoiced.map((r) => r.id).join(' / ') },
          { n: '未到期（按合同未到收款期）', v: rest, st: <Tag tone="gray">未到期</Tag>, exp: pendingPlan.map((p) => p.n).join(' / ') },
        ].map((r) => (
          <div key={r.n} className="nc-gate-row">
            <span className="nc-gate-n">{r.n}<div className="nc-cell-sub">{r.exp || '—'}</div></span>
            <span className="nc-num">{r.v > 0 ? `${(r.v / 10000).toFixed(1)} 万` : '—'}</span>
            <span className="nc-gate-s">{r.st}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 10 }}>
        <Progress value={Math.min(100, pct(C.CASH_IN))} tone="green" />
        <div className="nc-cell-sub" style={{ marginTop: 4 }}>
          回款率 {C.PAY_PROGRESS.toFixed(1)}% · 已到账 {got.length} 笔 / 应收 {C.overdueAmt > 0 ? `+ 未到账 ${C.overdue.length} 笔` : '全部按期'}
        </div>
      </div>
    </Card>
  );
}

/** 中栏：成本与利润 —— 目标 vs 实际 + 预算科目构成 + 三处偏差（不重复绝对值） */
function CardCost({ C }: { C: PjCtx }) {
  const top = [...C.groupedPlan].sort((a, b) => b.sum - a.sum).slice(0, 4);
  const max = Math.max(...top.map((g) => g.sum), 1);
  return (
    <Card
      hd={<span><Ico n="chart" size={16} /> 成本与利润</span>}
      extra={<Btn size="sm" onClick={() => C.pj('cost')}>进入成本台账 →</Btn>}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
        <div>
          <div className="nc-cell-sub">目标成本</div>
          <div className="num" style={{ fontSize: 20, fontWeight: 600 }}>{C.PLAN_SUM.toLocaleString()}</div>
        </div>
        <div style={{ color: 'var(--ink-3)' }}>vs</div>
        <div>
          <div className="nc-cell-sub">已发生</div>
          <div className="num" style={{ fontSize: 20, fontWeight: 600, color: C.dev > 0 ? 'var(--c-danger)' : 'var(--c-success)' }}>
            {C.COST_SUM.toLocaleString()}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div className="nc-cell-sub">{C.dev > 0 ? '超支' : '结余'}</div>
          <div className="num" style={{ fontSize: 17, fontWeight: 600, color: C.dev > 0 ? 'var(--c-danger)' : 'var(--c-success)' }}>
            {C.dev > 0 ? '+' : ''}{(Math.abs(C.dev) / 10000).toFixed(1)} 万
          </div>
        </div>
      </div>
      <Progress value={Math.min(100, C.COST_PROGRESS)} tone={C.dev > 0 ? 'red' : 'green'} />

      <div className="nc-ledhd" style={{ marginTop: 14 }}>目标成本构成（直接费 / 间接费）</div>
      {top.map((g) => (
        <div key={g.g} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', fontSize: 12.5 }}>
            <span style={{ flex: 1 }}>{g.g} <span className="nc-cell-sub">{g.rows.length} 个科目</span></span>
            <span className="num">{(g.sum / 10000).toFixed(1)} 万 · 占 {((g.sum / C.PLAN_SUM) * 100).toFixed(0)}%</span>
          </div>
          <div className="nc-paybar" style={{ width: '100%' }}>
            <i style={{ width: `${(g.sum / max) * 100}%`, background: 'var(--c-primary)' }} />
          </div>
        </div>
      ))}

      <div className="nc-ledhd" style={{ marginTop: 14 }}>三处偏差</div>
      {[
        { k: '成本偏差', v: `${C.dev > 0 ? '+' : ''}${(C.dev / 10000).toFixed(1)} 万 · ${C.devPct > 0 ? '+' : ''}${C.devPct.toFixed(1)}%`, t: C.dev > 0 ? 'danger' : 'ok' },
        { k: '毛利率', v: `计划 ${C.planProfit.toFixed(1)}% → 实际 ${C.actProfit.toFixed(1)}%`, t: C.actProfit < C.planProfit ? 'danger' : 'ok' },
        { k: '进度偏差', v: `${C.progDev >= 0 ? '+' : ''}${C.progDev}% · ${C.progTag}`, t: C.progLevel === 'ok' ? 'ok' : 'danger' },
      ].map((r) => (
        <div key={r.k} className="nc-looprow">
          <span className="nc-looprow-k">{r.k}</span>
          <span className="nc-looprow-v num" style={{ color: r.t === 'danger' ? 'var(--c-danger)' : 'var(--c-success)' }}>{r.v}</span>
        </div>
      ))}

      <div className="nc-ledhd" style={{ marginTop: 14 }}>质保金（结算时客户扣留）</div>
      <div className="nc-looprow">
        <span className="nc-looprow-k">质保金</span>
        <span className="nc-looprow-v num">{C.WARRANTY.toLocaleString()} 元 <span className="nc-cell-sub">= 合同额 × 3%（法定上限）</span></span>
      </div>
    </Card>
  );
}

/** 右栏：风险与闭环 —— 现状 / 目标 / 处置三列，每条都能处置并销项 */
function CardRisk({ C }: { C: PjCtx }) {
  const rows: { k: string; now: string; aim: string; act: string; onAct: () => void; tone: string }[] = [];
  if (C.overdue.length > 0) {
    rows.push({
      k: '逾期应收', now: `${C.overdue.length} 笔 · ${(C.overdueAmt / 10000).toFixed(1)} 万 · 账龄 75 天`,
      aim: '全部到账或签署延期确认', act: '发起催收', onAct: () => C.openM('dunning'), tone: 'orange',
    });
  }
  if (C.dev > 0) {
    rows.push({
      k: '成本超支', now: `超出目标 ${(C.dev / 10000).toFixed(1)} 万（${C.devPct.toFixed(1)}%）`,
      aim: '回到目标成本内或完成变更归集', act: '成本台账', onAct: () => C.pj('cost'), tone: 'orange',
    });
  }
  if (C.progLevel !== 'ok') {
    rows.push({
      k: '进度告警', now: `实际 ${C.progActual}% vs 计划 ${C.progPlan}%（${C.progDev}%）`,
      aim: '提交纠偏方案并追平日程', act: '进度填报', onAct: () => C.pj('track'), tone: C.progLevel === 'red' ? 'red' : 'orange',
    });
  }
  if (C.depIn.length > 0) {
    rows.push({
      k: '保证金待退', now: `${C.depIn.length} 笔 · ${C.depIn.map((d) => d.id).join(' / ')}`,
      aim: '到期退还或转履约', act: '保证金台账', onAct: () => C.openM('deposit'), tone: 'gold',
    });
  }
  if (C.curMile && C.curMiss.length > 0) {
    rows.push({
      k: '节点资料缺项', now: `${C.curMile.name} 缺 ${C.curMiss.join('、')}`,
      aim: '资料齐备后方可确认节点', act: '上传档案', onAct: () => C.openM('upload'), tone: 'orange',
    });
  }

  return (
    <Card
      hd={<span><Ico n="warning" size={16} /> 风险与待办 <b className="nc-v-orange">{rows.length}</b></span>}
      extra={<Btn size="sm" onClick={C.openLog}>操作记录</Btn>}
    >
      {rows.length === 0 && <div className="nc-empty-mini">当前无待处置事项</div>}
      {rows.map((r) => (
        <div key={r.k} className={`nc-risk-item is-${r.tone === 'red' ? 'red' : r.tone === 'gold' ? 'gold' : 'orange'}`} style={{ marginBottom: 8 }}>
          <div className="nc-risk-main">
            <b>{r.k}</b>
            <div className="nc-risk-sub">现状：{r.now}</div>
            <div className="nc-risk-sub">处置目标：{r.aim}</div>
          </div>
          <Btn size="sm" onClick={r.onAct}>{r.act}</Btn>
        </div>
      ))}
      <div className="nc-cell-sub" style={{ marginTop: 6 }}>
        处置完成自动销项；未销项条目同步出现在驾驶舱风险榜与待办。
      </div>
    </Card>
  );
}

/** 业务域入口：5 个域，各带计数 + 待办角标（点进去是子页，不是弹窗） */
function DomainCards({ C }: { C: PjCtx }) {
  const domains: { key: string; label: string; icon: IconName; v: string; sub: string; todo: string; tone: 'orange' | 'red' | 'blue' }[] = [
    {
      key: 'track', label: '执行履约', icon: 'swap',
      v: `${C.progActual}%`, sub: `里程碑 ${C.mileRows.length} 个 · 日志与投入已在域内`,
      todo: C.progLevel !== 'ok' ? '进度告警' : '', tone: 'orange',
    },
    {
      key: 'quality', label: '质量验收', icon: 'check',
      v: `${C.attCnt}`, sub: '报验 / 隐蔽 / 检测 / 验收资料份数',
      todo: C.curMiss.length > 0 ? `${C.curMiss.length} 项缺件` : '', tone: 'orange',
    },
    {
      key: 'biz', label: '商务合同', icon: 'card',
      v: `${C.saleCt.length + C.buyCt.length}`, sub: `收款类 ${C.saleCt.length} · 付款类 ${C.buyCt.length}`,
      todo: C.overdue.length > 0 ? `逾期 ${C.overdue.length} 笔` : '', tone: 'red',
    },
    {
      key: 'cost', label: '成本台账', icon: 'book',
      v: `${C.costRows.length}`, sub: `已发生 ${(C.COST_SUM / 10000).toFixed(1)} 万 · 目标 ${(C.PLAN_SUM / 10000).toFixed(1)} 万`,
      todo: C.dev > 0 ? `超支 ${(C.dev / 10000).toFixed(1)} 万` : '', tone: 'orange',
    },
    {
      key: 'members', label: '团队资料', icon: 'user',
      v: `${C.teamRows.length}`, sub: `团队 ${C.teamRows.length} 人 · 证书占用 ${C.certRows.length} 项 · 档案 ${C.attCnt} 份`,
      todo: '', tone: 'blue',
    },
  ];
  return (
    <div className="nc-domain">
      {domains.map((d) => (
        <button key={d.key} className="nc-domain-card" onClick={() => C.pj(d.key)} title={`进入${d.label}`}>
          <span className="nc-domain-card-hd"><Ico n={d.icon} size={15} /> {d.label} <span className="nc-drill">进入↗</span></span>
          <span className="nc-domain-card-v num">{d.v}</span>
          <span className="nc-domain-card-sub">{d.sub}</span>
          {d.todo && <Tag tone={d.tone as 'orange'}>{d.todo}</Tag>}
        </button>
      ))}
    </div>
  );
}

/** 全链路血缘：商机 → 报价 → 合同 → 项目 → 节点 → 验收 → 结算 → 质保 / 维保，每跳可点 */
function Lineage({ C }: { C: PjCtx }) {
  const { P } = C;
  const svc = isServiceProject(P);
  const trOpp = P.customerId ? `商机` : null;
  const nodes: { k: string; v: React.ReactNode; st: string; cur?: boolean; void?: boolean; onClick?: () => void }[] = [
    {
      k: '商机', v: trOpp ?? '无关联', st: trOpp ? '商机直签 / 投标中标' : '未登记溯源',
      onClick: trOpp ? () => C.go('opp') : undefined,
    },
    { k: '报价', v: '已转化', st: '报价单转合同草稿', onClick: () => C.go('quote') },
    {
      k: '合同', v: C.saleCt[0]?.code ?? '—', st: C.saleCt[0] ? `${C.saleCt[0].st} · ${(C.saleCt[0].amt / 10000).toFixed(0)} 万` : '无销售合同',
      void: !C.saleCt[0],
      onClick: C.saleCt[0] ? () => C.go('contract-detail') : undefined,
    },
    { k: '项目', v: P.id, st: `${P.status} · ${P.milestoneName}`, cur: true },
    {
      k: '当前节点', v: C.curMile?.name ?? '全部完成', st: C.curMile?.date ?? '—',
      onClick: () => C.pj('track'),
    },
    {
      k: '质量验收', v: P.acceptStatus ?? '未申报', st: P.acceptStatus ? '已进入验收流程' : '完工后申报',
      onClick: () => C.pj('quality'),
    },
    { k: '结算', v: P.status === '已结项' ? '已结算' : '未结算', st: P.status === '已结项' ? '结算额已确认' : '验收通过后结算', void: P.status !== '已结项' },
    {
      k: svc ? '维保服务' : '质保期', v: svc ? '服务中' : '待进入',
      st: svc ? `${P.serviceStart ?? ''} ~ ${P.serviceEnd ?? ''}` : `质保金 ${(C.WARRANTY / 10000).toFixed(2)} 万待扣留`,
      void: !svc,
    },
  ];
  return (
    <Card hd={<span><Ico n="swap" size={16} /> 全链路血缘</span>}
      extra={<Btn size="sm" onClick={C.openPanorama}><Ico n="search" size={14} /> 项目全景</Btn>}>
      <div className="nc-lineage">
        {nodes.map((n, i) => (
          <React.Fragment key={n.k}>
            {i > 0 && <span className="nc-lineage-arrow">→</span>}
            {n.onClick ? (
              <button className={`nc-lineage-node${n.cur ? ' is-cur' : ''}${n.void ? ' is-void' : ''}`} onClick={n.onClick} title={`穿透到${n.k}`}>
                <span className="nc-lineage-k">{n.k}</span>
                <span className="nc-lineage-v">{n.v}</span>
                <span className="nc-lineage-st">{n.st}</span>
              </button>
            ) : (
              <span className={`nc-lineage-node${n.cur ? ' is-cur' : ''}${n.void ? ' is-void' : ''}`}>
                <span className="nc-lineage-k">{n.k}</span>
                <span className="nc-lineage-v">{n.v}</span>
                <span className="nc-lineage-st">{n.st}</span>
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="nc-cell-sub" style={{ marginTop: 8 }}>
        当前所处位置：<Tag tone={(PROJECT_STATUS_TONE[P.status] || 'blue') as 'blue'}>{P.status}</Tag>
        　上游缺单据的环节以虚线标出 —— 未签合同的执行中项目会进驾驶舱「无合同施工」风险榜。
      </div>
    </Card>
  );
}

export default function OverviewSub({ C }: { C: PjCtx }) {
  return (
    <div className="nc-pjsection">
      <KpiStrip C={C} />
      <div className="nc-pjsplit" style={{ marginTop: 16 }}>
        <CardReceipt C={C} />
        <CardCost C={C} />
        <CardRisk C={C} />
      </div>
      <PjSection title={<><Ico n="module" size={16} /> 业务域</>}>
        <DomainCards C={C} />
      </PjSection>
      <Lineage C={C} />
    </div>
  );
}
