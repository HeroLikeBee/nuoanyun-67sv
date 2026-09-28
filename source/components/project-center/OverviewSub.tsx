// 项目详情 · 概览（默认子页）
//
// 职责：回答「这个项目现在怎么样、卡在哪、下一步做什么」，不重复摊开各业务域台账。
// 版式：KPI 带 → 基本信息 → 风险与待办。（上游溯源见页头溯源链，不再铺全链路血缘卡）
// 去重（2026-09-23 评审）：删除与各 tab 重复的三列摘要卡（合同回款 / 成本利润）、
//   删除业务域入口卡（二级导航本身就是入口）；绝对值只在 KPI 带出现一次。
// 血缘：页头溯源链承担；下游节点 / 验收 / 结算状态已由风险与待办覆盖。
import React from 'react';
import { Btn, Card, EntityLink, KvGrid, Tag } from '../ui';
import { Ico } from '../icons';
import { PROJECT_STATUS_TONE, TODAY, isServiceProject, fmtAmt } from '../data';
import type { PjCtx } from './ctx';

/** 业务线中文（数据层存缩写） */
const BIZ_CN: Record<string, string> = {
  GC: '消防工程', WB: '维保服务', JC: '消防检测', RJ: '软件平台', QT: '其他',
};

/** 基本信息：项目档案的身份与契约属性（不含金额——金额全归 KPI 带，避免重复） */
function CardProfile({ C }: { C: PjCtx }) {
  const { P } = C;
  const DAY = 86400000;
  const t = (s?: string) => (s ? new Date(s).getTime() : NaN);
  const daysLeft = Number.isFinite(t(P.end)) ? Math.round((t(P.end) - t(TODAY)) / DAY) : null;
  const daysText = daysLeft == null ? '—'
    : daysLeft >= 0 ? `剩余 ${daysLeft} 天`
      : `已超期 ${Math.abs(daysLeft)} 天`;
  const span = Number.isFinite(t(P.start)) && Number.isFinite(t(P.end)) ? Math.round((t(P.end) - t(P.start)) / DAY) : 0;
  const passed = span > 0 && Number.isFinite(t(TODAY)) ? Math.round((t(TODAY) - t(P.start)) / DAY) : 0;
  const done = span > 0 ? Math.min(100, Math.max(0, Math.round((passed / span) * 100))) : 0;
  return (
    <Card
      hd={<span><Ico n="building" size={16} /> 基本信息</span>}
      extra={
        <span className="nc-cell-sub">
          立项来源 {(BIZ_CN[P.biz] ?? P.biz)} · 最近更新 {P.updatedAt ?? P.start}
        </span>
      }
    >
      <KvGrid cols={2} rows={[
        { k: '项目类型', v: P.type },
        { k: '业务线', v: BIZ_CN[P.biz] ?? P.biz },
        {
          k: '立项来源', v: P.noContract && P.backfillBy
            ? <><span>{P.source}</span> <Tag tone="orange">无合同施工 · 补签期限 {P.backfillBy}</Tag></>
            : P.source,
        },
        { k: '客户', v: P.customerId
          ? <EntityLink target="customer" id={P.customerId} go={C.go} title="下钻到客户详情">{P.customer}</EntityLink>
          : P.customer },
        { k: '甲方现场对接人', v: (P as { clientContact?: string }).clientContact ?? '—' },
        { k: '项目经理', v: P.pm },
        { k: '销售负责人', v: P.owner },
        { k: '消防验收状态', v: <Tag tone={P.acceptStatus === '已通过' || P.acceptStatus === '已备案' ? 'green' : P.acceptStatus ? 'blue' : 'gray'}>{P.acceptStatus ?? '未申报'}</Tag> },
        {
          k: '计划工期',
          v: <><span className="num">{P.start} ~ {P.end}</span> <span className="nc-cell-sub">{daysText} · 已过工期 {done}%</span></>,
        },
        {
          k: '项目状态',
          v: <><Tag tone={(PROJECT_STATUS_TONE[P.status] || 'blue') as 'blue'}>{P.status}</Tag> <span className="nc-cell-sub">当前节点 {P.milestoneName}</span></>,
        },
      ]} />
      {isServiceProject(P) && (
        <div className="nc-gate-block" style={{ background: 'var(--c-primary-bg)', borderColor: 'var(--c-primary-border)', marginTop: 10 }}>
          <Ico n="shield" size={14} />
          本项目含维保服务，服务期 <span className="num">{P.serviceStart ?? '—'} ~ {P.serviceEnd ?? '—'}</span>
          （服务期限由合同带出，此处只读）—— 结项后可转入长期维保。
        </div>
      )}
      {P.pauseReason && (
        <div className="nc-gate-block" style={{ marginTop: 10 }}>
          <Ico n="warning" size={14} />
          暂停原因：{P.pauseReason}（暂停于 {P.pausedAt ?? '—'}，留痕见操作记录）
        </div>
      )}
    </Card>
  );
}

/**
 * KPI 带：绝对值口径，每格可穿透到对应业务域（jump 为 undefined 时不可点）
 *
 * 口径归属（同一指标全站只出现一次，比率类一律下放各自业务域）：
 *   概览只给「多少钱 / 多少笔」——回款率归资金域，占目标 / 偏差 / 毛利率归成本域，
 *   加权完成率归履约域工序清单。概览的 sub 只写本格数字的构成或来源，不写另一个指标。
 */
function KpiStrip({ C }: { C: PjCtx }) {
  const skPaid = C.payRowsAll.filter((r) => r.kind === '收入' && r.st === 'paid').length;
  /* 0 值弱化：金额为 0 时不渲染 ¥0.0 万，统一用灰色破折号占位 */
  const amt = (n: number) => n > 0 ? fmtAmt(n) : <span className="nc-muted">—</span>;
  const cells: { k: string; v: React.ReactNode; sub: string; tone?: string; jump?: string }[] = [
    {
      k: '合同额', v: amt(C.CONTRACT_NOW),
      sub: `执行额 ${(C.EXEC_AMT / 10000).toFixed(1)} 万（含已生效变更）`, jump: 'contract',
    },
    {
      k: '已回款', v: amt(C.CASH_IN),
      sub: `${skPaid} 笔银行到账`, jump: 'fund',
    },
    {
      k: '已发生成本', v: amt(C.COST_SUM),
      sub: `${C.costRows.length} 笔已入账`, jump: 'cost',
    },
    {
      k: '净现金流', v: C.NET_IN === 0 ? <span className="nc-muted">—</span> : `${C.NET_IN >= 0 ? '+' : '−'}${fmtAmt(Math.abs(C.NET_IN))}`,
      sub: '已到账 − 已付出 · 审批中不计', jump: 'fund',
    },
    {
      k: '施工进度', v: `${C.progActual}%`,
      /* 偏差数值与告警由下方「风险与待办」统一说明，此处只给参照值，避免同一对比写两遍 */
      sub: `计划应到 ${C.progPlan}% · ${C.progTag}`,
      tone: C.progLevel === 'red' ? 'red' : C.progLevel === 'yellow' ? 'orange' : undefined,
      jump: 'track',
    },
    {
      k: '质量待办', v: `${C.qualityTodo}`, sub: '报验缺件 + 整改未闭环', tone: C.qualityTodo > 0 ? 'orange' : undefined, jump: 'quality',
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
            <span className="nc-ovcell-k">{c.k} {c.jump && <span className="nc-drill">查看明细↗</span>}</span>
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

/** 风险与待办 —— 现状 / 目标 / 处置三列，每条都能处置并销项（概览的核心价值，全宽） */
function CardRisk({ C }: { C: PjCtx }) {
  const rows: { k: string; now: string; aim: string; act: string; onAct: () => void; tone: string }[] = [];
  if (C.overdue.length > 0) {
    rows.push({
      k: '逾期应收', now: `${C.overdue.length} 笔 · ${(C.overdueAmt / 10000).toFixed(1)} 万`,
      aim: '全部到账或签署延期确认', act: '发起催收', onAct: () => C.openM('dunning'), tone: 'orange',
    });
  }
  if (C.dev > 0) {
    rows.push({
      k: '成本超支', now: `超出目标 ${(C.dev / 10000).toFixed(1)} 万（${C.devPct.toFixed(1)}%）`,
      aim: '回到目标成本内或完成变更归集', act: '成本管控', onAct: () => C.pj('cost'), tone: 'orange',
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
      aim: '到期退还或转履约', act: '资金台账', onAct: () => C.pj('fund'), tone: 'gold',
    });
  }
  if (C.curMile && C.curMiss.length > 0) {
    rows.push({
      k: '节点资料缺项', now: `${C.curMile.name} 缺 ${C.curMiss.join('、')}`,
      aim: '资料齐备后方可确认节点', act: '上传档案', onAct: () => C.openM('upload'), tone: 'orange',
    });
  }

  return (
    /* 标题计数取实际渲染行数：一个口径，不存在第二个「待办数」 */
    <Card
      hd={<span><Ico n="warning" size={16} /> 风险与待办 <b className="nc-v-orange">{rows.length}</b></span>}
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

export default function OverviewSub({ C }: { C: PjCtx }) {
  return (
    <div className="nc-pjsection">
      <KpiStrip C={C} />
      <CardProfile C={C} />
      <div style={{ marginTop: 16 }}><CardRisk C={C} /></div>
    </div>
  );
}