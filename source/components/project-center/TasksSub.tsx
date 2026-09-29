// 项目详情 · 项目任务（③ tasks，11/13-Tab 统一骨架）
//
// 三线共用的工单实体：GC 施工任务 / WB 维保巡检工单 / JC 检测作业 —— 字段同构、kind 区分，
// 「项目任务」Tab 承载三线派工（里程碑 → 任务 → 交付物链路的中间层）。
// ⚠️ 数据经 PjCtx（buildPjDemo 按 biz 派生），不持有跨项目常量。
import React, { useMemo, useState } from 'react';
import { Btn, Tag, Tip } from '../ui';
import { PjSection } from './PjSection';
import type { PjCtx } from './ctx';

const TASK_TONE: Record<string, 'green' | 'blue' | 'gray' | 'red'> = {
  已完成: 'green', 进行中: 'blue', 未开始: 'gray', 已逾期: 'red',
};

export default function TasksSub({ C }: { C: PjCtx }) {
  const [f, setF] = useState('全部');
  const kinds = useMemo(() => [...new Set(C.tasks.map((t) => t.kind))], [C.tasks]);
  const rows = f === '全部' ? C.tasks : C.tasks.filter((t) => t.kind === f);
  const doneN = C.tasks.filter((t) => t.st === '已完成').length;
  const lateN = C.tasks.filter((t) => t.st === '已逾期').length;

  return (
    <PjSection
      title={<>项目任务</>}
      extra={<>
        <span className="nc-cell-sub">{doneN}/{C.tasks.length} 已完成{lateN > 0 ? ` · 逾期 ${lateN}` : ''}</span>
        <Tip w={420} text="任务实体三线共用：工程施工线为施工任务、维保线为巡检工单、检测线为检测作业；任务挂里程碑节点，完成情况汇总进项目进度，交付物在进度页跟踪。" />
        <Btn size="sm" kind="primary" onClick={() => C.toast('已打开「新增任务 / 派工」表单（演示）')}>＋ 新增任务</Btn>
      </>}
    >
      {kinds.length > 1 && (
        <div className="nc-subtabs">
          {['全部', ...kinds].map((k) => (
            <button key={k} className={`nc-subtab${f === k ? ' is-on' : ''}`} onClick={() => setF(k)}>{k}</button>
          ))}
        </div>
      )}
      {rows.length === 0
        ? <div className="nc-empty">本项目暂无「{f}」类任务。</div>
        : (
          <table className="nc-tbl" style={{ minWidth: 920 }}>
            <thead><tr>
              <th style={{ width: 120 }}>任务号</th>
              <th>任务名称</th>
              <th style={{ width: 100 }}>类别</th>
              <th style={{ width: 180 }}>所属节点</th>
              <th style={{ width: 90 }}>负责人</th>
              <th style={{ width: 100 }}>班组</th>
              <th style={{ width: 190 }} className="is-num">起止日期</th>
              <th style={{ width: 90 }}>状态</th>
            </tr></thead>
            <tbody>
              {rows.map((t) => {
                const over = t.st === '已逾期';
                return (
                  <tr key={t.id} className={over ? 'is-danger-row' : ''}>
                    <td><b>{t.id}</b></td>
                    <td>{t.name}<div className="nc-cell-sub">{t.note}</div></td>
                    <td><Tag tone="purple">{t.kind}</Tag></td>
                    <td className="nc-cell-sub">{t.mile}</td>
                    <td>{t.owner}</td>
                    <td>{t.team}</td>
                    <td className="is-num num">{t.start} ~ {t.end}</td>
                    <td><Tag tone={TASK_TONE[t.st] ?? 'gray'}>{t.st}</Tag></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      <div className="nc-cell-sub" style={{ marginTop: 8 }}>
        任务由里程碑节点派生并支持人工增补；派工人员在「团队与干系人」维护，考勤联动在人力域。
      </div>
    </PjSection>
  );
}
