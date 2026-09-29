// 项目详情 · 基本信息（① info，11/13-Tab 统一骨架首位）
//
// 11-Tab 重构（2026-09-28）：原「概览」升级为「基本信息」Tab，按用户拍板结构承载六个子块：
//   KPI 带（经营读数，可穿透）→ 项目概览 → 阶段信息（立项·启动·实施·验收）→
//   项目条款 → 风险与待办 → 团队与干系人（原独立 Tab 收编为区块）。
// 去重规则不变：绝对值只在 KPI 带出现一次；比率类下放各业务域。
import React from 'react';
import { Btn, Card, EntityLink, KvGrid, Tag } from '../ui';
import { Ico } from '../icons';
import { PROJECT_STATUS_TONE, TODAY, isServiceProject, fmtAmt } from '../data';
import { PjSection } from './PjSection';
import MembersSub from './MembersSub';
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
      sec
      hd={<>项目概览</>}
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

/** 阶段信息：立项 → 启动 → 实施 → 验收四段，时间从项目状态流转日志与当前节点派生 */
function StageInfo({ C }: { C: PjCtx }) {
  const { P } = C;
  const logs = P.logs ?? [];
  const startedAt = logs.filter((l) => l.to === '执行中').map((l) => l.at).sort()[0];
  const rows = [
    {
      n: '立项', main: P.start, sub: `来源 ${P.source} · 负责人 ${P.owner}`,
      done: true,
    },
    {
      n: '启动', main: startedAt ? startedAt.slice(0, 10) : '—',
      sub: startedAt ? `由「${logs.find((l) => l.to === '执行中')?.from ?? '待启动'}」进入执行` : '尚未进入执行',
      done: !!startedAt,
    },
    {
      n: '实施', main: `${P.milestone}%`,
      sub: C.curMile ? `当前节点 ${C.curMile.name}${C.curMiss.length ? ` · 准入资料缺 ${C.curMiss.length} 项` : ' · 资料齐备'}` : '无进行中节点',
      done: P.milestone > 0,
    },
    {
      n: '验收', main: P.acceptStatus ?? '未申报',
      sub: C.checkInfo.no !== '—' ? `检测报告 ${C.checkInfo.no}` : '完工自检合格后申报第三方检测',
      done: ['已通过', '已备案'].includes(P.acceptStatus ?? ''),
    },
  ];
  return (
    <Card sec hd={<>阶段信息</>}>
      <div className="nc-gate">
        {rows.map((r) => (
          <div key={r.n} className="nc-gate-row">
            <span className="nc-gate-n">
              <b>{r.n}</b>
              <div className="nc-cell-sub">{r.sub}</div>
            </span>
            <span className="is-num num">{r.main}</span>
            <span className="nc-gate-s"><Tag tone={r.done ? 'green' : 'gray'}>{r.done ? '已到达' : '未到达'}</Tag></span>
          </div>
        ))}
      </div>
    </Card>
  );
}

/** 项目条款：付款条款（收款期次结构快照）+ 质保金义务，均只读镜像合同侧 */
function Terms({ C }: { C: PjCtx }) {
  const main = C.saleCt[0];
  return (
    <Card sec hd={<>项目条款</>}
      extra={<span className="nc-cell-sub">{main ? `依据主合同 ${main.code}` : '尚未关联合同'}</span>}>
      {!main || !main.payplan || main.payplan.length === 0
        ? <div className="nc-empty-mini">{main ? '主合同未约定期次结构。' : '关联合同后，付款条款由合同侧自动镜像（只读）。'}</div>
        : (
          <table className="nc-tbl" style={{ minWidth: 640 }}>
            <thead><tr>
              <th>期次</th><th style={{ width: 130 }} className="is-num">约定金额（元）</th>
              <th style={{ width: 110 }} className="is-num">计划日期</th><th style={{ width: 110 }}>到账状态</th>
            </tr></thead>
            <tbody>
              {main.payplan.slice(0, 6).map((i) => (
                <tr key={i.n}>
                  <td><b>{i.n}</b></td>
                  <td className="is-num num">{i.amt.toLocaleString()}</td>
                  <td className="is-num num">{i.plan}</td>
                  <td><Tag tone={i.st === '已到账' ? 'green' : i.st === '逾期未收' ? 'red' : i.st === '部分到账' ? 'blue' : 'gray'}>{i.st}</Tag></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      <div className="nc-cell-sub" style={{ marginTop: 8 }}>
        质保金义务 {C.WARRANTY.toLocaleString()} 元（合同额 × 3%，结算时由客户扣留）—— 执行跟踪在「项目收款」。
      </div>
    </Card>
  );
}

/**
 * KPI 带：绝对值口径，每格可穿透到对应业务域（jump 为 undefined 时不可点）
 *
 * 口径归属（同一指标全站只出现一次，比率类一律下放各自业务域）：
 *   本带只给「多少钱 / 多少笔」——回款率归项目收款，占目标 / 偏差 / 毛利率归项目成本，
 *   加权完成率归项目进度。sub 只写本格数字的构成或来源，不写另一个指标。
 *
 * 版式：口径相邻的两组各占一行、格数独立（金额 4 格 / 执行 2 格），
 * 不按「一行 4 格」硬均分——否则第 5、6 格会被推到第二行并各自撑满半行，留出大片空白。
 */
function KpiStrip({ C }: { C: PjCtx }) {
  const skPaid = C.payRowsAll.filter((r) => r.kind === '收入' && r.st === 'paid').length;
  /* 0 值弱化：金额为 0 时不渲染 ¥0.0 万，统一用灰色破折号占位 */
  const amt = (n: number) => n > 0 ? fmtAmt(n) : <span className="nc-muted">—</span>;
  const groups: { grp: string; cells: { k: string; v: React.ReactNode; sub: string; tone?: string; jump?: string }[] }[] = [
    {
      grp: 'money',
      cells: [
        {
          k: '合同额', v: amt(C.CONTRACT_NOW),
          sub: `执行额 ${(C.EXEC_AMT / 10000).toFixed(1)} 万（含已生效变更）`, jump: 'contract',
        },
        {
          k: '已回款', v: amt(C.CASH_IN),
          sub: `${skPaid} 笔银行到账`, jump: 'recv',
        },
        {
          k: '已发生成本', v: amt(C.COST_SUM),
          sub: `${C.costRows.length} 笔已入账`, jump: 'cost',
        },
        {
          k: '净现金流', v: C.NET_IN === 0 ? <span className="nc-muted">—</span> : `${C.NET_IN >= 0 ? '+' : '−'}${fmtAmt(Math.abs(C.NET_IN))}`,
          sub: '已到账 − 已付出 · 审批中不计', jump: 'recv',
        },
      ],
    },
    {
      grp: 'exec',
      cells: [
        {
          k: '施工进度', v: `${C.progActual}%`,
          /* 偏差数值与告警由下方「风险与待办」统一说明，此处只给参照值，避免同一对比写两遍 */
          sub: `计划应到 ${C.progPlan}% · ${C.progTag}`,
          tone: C.progLevel === 'red' ? 'red' : C.progLevel === 'yellow' ? 'orange' : undefined,
          jump: 'progress',
        },
        {
          k: '质量待办', v: `${C.qualityTodo}`, sub: '报验缺件 + 整改未闭环', tone: C.qualityTodo > 0 ? 'orange' : undefined, jump: 'quality',
        },
      ],
    },
  ];
  return (
    <Card sec hd={<>经营读数</>} style={{ marginTop: 0 }}>
      {groups.map((g) => (
        <div key={g.grp} className="nc-ovstrip" data-grp={g.grp}>
          {g.cells.map((c) => (
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
      ))}
    </Card>
  );
}

/** 风险与待办 —— 台账表：现状 / 处置目标 / 触发动作三列，逐条处置并自动销项 */
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
      aim: '回到目标成本内或完成变更归集', act: '项目成本', onAct: () => C.pj('cost'), tone: 'orange',
    });
  }
  if (C.progLevel !== 'ok') {
    rows.push({
      k: '进度告警', now: `实际 ${C.progActual}% vs 计划 ${C.progPlan}%（${C.progDev}%）`,
      aim: '提交纠偏方案并追平日程', act: '项目进度', onAct: () => C.pj('progress'), tone: C.progLevel === 'red' ? 'red' : 'orange',
    });
  }
  if (C.depIn.length > 0) {
    rows.push({
      k: '保证金待退', now: `${C.depIn.length} 笔 · ${C.depIn.map((d) => d.id).join(' / ')}`,
      aim: '到期退还或转履约', act: '项目收款', onAct: () => C.pj('recv'), tone: 'gold',
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
      sec
      hd={<>风险与待办 <b className="nc-v-orange">{rows.length}</b></>}
    >
      {rows.length === 0
        ? <div className="nc-empty-mini">当前无待处置事项</div>
        : (
          <table className="nc-tbl nc-risk-tbl">
            <thead><tr>
              <th style={{ width: 132 }}>事项</th>
              <th>现状</th>
              <th style={{ width: 210 }}>处置目标</th>
              <th style={{ width: 100 }}>操作</th>
            </tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.k}>
                  <td><span className={`nc-risk-k is-${r.tone === 'red' ? 'red' : r.tone === 'gold' ? 'gold' : 'orange'}`}>{r.k}</span></td>
                  <td className="nc-risk-now">{r.now}</td>
                  <td className="nc-risk-aim">{r.aim}</td>
                  <td><Btn size="sm" onClick={r.onAct}>{r.act}</Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      <div className="nc-cell-sub" style={{ marginTop: 8 }}>
        处置完成自动销项；未销项条目同步出现在驾驶舱风险榜与待办。
      </div>
    </Card>
  );
}

export default function InfoSub({ C }: { C: PjCtx }) {
  return (
    <div className="nc-pjsection">
      <div className="nc-pjsplit-main">
        <div id="pjsec-kpi"><KpiStrip C={C} /></div>
        {/* 项目概览与阶段信息两卡同行 */}
        <div className="nc-2col" style={{ marginTop: 16 }}>
          <div id="pjsec-profile"><CardProfile C={C} /></div>
          <div id="pjsec-stage"><StageInfo C={C} /></div>
        </div>
        <div id="pjsec-terms" style={{ marginTop: 16 }}><Terms C={C} /></div>
        <div id="pjsec-risk" style={{ marginTop: 16 }}><CardRisk C={C} /></div>
        <div id="pjsec-team" style={{ marginTop: 16 }}>
          {/* 团队与干系人（原独立 Tab 收编）：MembersSub 自带三个区块标题，直接内嵌不再包外壳 */}
          <MembersSub C={C} />
        </div>
      </div>
    </div>
  );
}
