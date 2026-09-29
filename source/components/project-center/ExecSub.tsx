// 项目详情 · 现场作业专页（WB 巡检维保执行 / JC 检测作业与报告 共用）
//
// 全库「一个区块只有一个家」（2026-09-29 去重）：
//   里程碑 / 准入档案 / 工程量 / 日志 → 「项目进度」（ProgressSub）
//   报验 / 隐蔽工程 → 「质量安全」（QualitySub）
//   现场投入 / 身份标识流向 / HSE / 检测与消防验收 → 本页（现场作业专页，四块唯一归属）
// 说明：WB / JC 两个专属 Tab 内容完全一致 —— 现场作业 + 本业务线的检测验收都是作业本身的产出。
// ⚠️ 数据全部经 PjCtx（buildPjDemo 按本项目派生），不持有跨项目常量。
import React from 'react';
import { Acceptance, IdMarkFlow, Safety, SiteInput } from './Sections';
import type { PjCtx } from './ctx';

export default function ExecSub({ C }: { C: PjCtx }) {
  return (
    <>
      <SiteInput C={C} />
      <IdMarkFlow C={C} />
      <Safety C={C} />
      <Acceptance C={C} />
    </>
  );
}
