// 项目详情 · 项目进度（② progress，11/13-Tab 统一骨架）
//
// 二级 Tab 分区（参照「甘特图 / 里程碑进展 / 交付物进展」二级页签形态）：
//   甘特图 ｜ 里程碑进展（节点 + 准入与档案）｜ 交付物进展 ｜ 工程量与日志
// 区块实现复用 Sections.tsx（与 WB/JC 专属作业 Tab 同一份实现，防两处真相）；
// 原履约域的「身份标识 / HSE」已迁「质量安全」，本页不再重复。
import React from 'react';
import { Tag, Tip, Tabs } from '../ui';
import { TODAY } from '../data';
import { daysBetween } from './seed';
import { GateAndFiles, Milestones, SiteLogs, WorkItems } from './Sections';
import { PjSection } from './PjSection';
import type { PjCtx } from './ctx';

/** 甘特图：行 = 里程碑，条 = 上一节点计划日 → 本节点计划日，竖线 = 今日 */
function Gantt({ C }: { C: PjCtx }) {
  const { P } = C;
  const span = Math.max(1, daysBetween(P.start, P.end));
  const pctOf = (d: string) => Math.min(100, Math.max(0, (daysBetween(P.start, d) / span) * 100));
  const todayPct = pctOf(TODAY);
  let prev = 0;
  const bars = C.mileRows.map((r) => {
    const to = pctOf(r.plan);
    const bar = { n: r.n, from: prev, to: Math.max(to, prev + 2), st: r.st };
    prev = to;
    return bar;
  });
  const doneN = C.mileRows.filter((m) => m.st === '已完成').length;
  return (
    <PjSection
      title={<>甘特图 · 里程碑计划</>}
      extra={<>
        <span className="nc-cell-sub">{P.start} ~ {P.end} · {doneN}/{C.mileRows.length} 已完成</span>
        <Tip w={380} text="计划条按里程碑模板的节点排期铺开（工程线按业务线 + 项目类型分叉），蓝线为今日；节点状态与下方里程碑表同源。" />
      </>}
    >
      <div className="nc-gantt">
        <div className="nc-gantt-grid">
          {[0, 25, 50, 75, 100].map((p) => (
            <div key={p} className="nc-gantt-vline" style={{ left: `${p}%` }} />
          ))}
          {todayPct > 0 && todayPct < 100 && (
            <div className="nc-gantt-today" style={{ left: `${todayPct}%` }} title={`今日 ${TODAY}`} />
          )}
          {bars.map((b) => (
            <div key={b.n} className="nc-gantt-row" title={`${b.n} · 计划完成 ${C.mileRows.find((m) => m.n === b.n)?.plan ?? ''}`}>
              <span className="nc-gantt-n">{b.n}</span>
              <span className="nc-gantt-track">
                <span
                  className={`nc-gantt-bar is-${b.st === '已完成' ? 'done' : b.st === '进行中' ? 'cur' : 'wait'}`}
                  style={{ left: `${b.from}%`, width: `${Math.max(2, b.to - b.from)}%` }}
                />
              </span>
            </div>
          ))}
        </div>
        <div className="nc-cell-sub" style={{ marginTop: 8 }}>
          <span className="nc-gantt-dot is-done" /> 已完成　<span className="nc-gantt-dot is-cur" /> 进行中　<span className="nc-gantt-dot is-wait" /> 未开始　<span className="nc-gantt-dot is-today" /> 今日
        </div>
      </div>
    </PjSection>
  );
}

/** 交付物进展：里程碑必传资料的「编制 → 提交 → 确认」推进 */
function Deliverables({ C }: { C: PjCtx }) {
  const toneOf = (st: string) => (st === '已确认' ? 'green' : st === '已提交' ? 'blue' : st === '编制中' ? 'orange' : 'gray');
  const confirmed = C.delivers.filter((d) => d.st === '已确认').length;
  return (
    <PjSection
      title={<>交付物进展</>}
      extra={<>
        <span className="nc-cell-sub">{confirmed}/{C.delivers.length} 已确认</span>
        <Tip w={380} text="交付物 = 各节点必传资料的提交与确认进展（编制中 → 已提交 → 已确认）；归档文件本体在「项目文档」，节点准入口径见上方档案区。" />
      </>}
    >
      {C.delivers.length === 0
        ? <div className="nc-empty">本项目里程碑未定义必传交付物。</div>
        : (
          <table className="nc-tbl" style={{ minWidth: 760 }}>
            <thead><tr>
              <th>交付物</th><th style={{ width: 190 }}>所属节点</th>
              <th style={{ width: 110 }} className="is-num">要求完成日</th>
              <th style={{ width: 110 }}>状态</th><th style={{ width: 110 }}>责任人</th>
            </tr></thead>
            <tbody>
              {C.delivers.map((d) => (
                <tr key={d.id} className={d.st === '编制中' ? 'is-warn-row' : ''}>
                  <td><b>{d.name}</b></td>
                  <td className="nc-cell-sub">{d.mile}</td>
                  <td className="is-num num">{d.due}</td>
                  <td><Tag tone={toneOf(d.st)}>{d.st}</Tag></td>
                  <td>{d.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
    </PjSection>
  );
}

/** 二级页签：项目进度内容分区（与主「项目进度」页签形成两级导航） */
const PROGRESS_SECS = [
  { key: 'gantt', label: '甘特图' },
  { key: 'mile', label: '里程碑进展' },
  { key: 'deli', label: '交付物进展' },
  { key: 'field', label: '工程量与日志' },
];

export default function ProgressSub({ C }: { C: PjCtx }) {
  const [sec, setSec] = React.useState('gantt');
  return (
    <>
      <div style={{ marginBottom: 4 }}>
        <Tabs items={PROGRESS_SECS} value={sec} onChange={setSec} />
      </div>
      {sec === 'gantt' && <Gantt C={C} />}
      {sec === 'mile' && <><Milestones C={C} /><GateAndFiles C={C} /></>}
      {sec === 'deli' && <Deliverables C={C} />}
      {sec === 'field' && <><WorkItems C={C} /><SiteLogs C={C} /></>}
    </>
  );
}
