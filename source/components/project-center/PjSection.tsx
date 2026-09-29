// 项目详情 · 子页外壳（多内容包一层 section，统一纵向节奏 + 卡片化）
// 说明：ctx.ts 只放纯类型与数据契约（.ts 不含 JSX），渲染组件单独放这里，
// 避免 ctx.ts / ctx.tsx 同名解析歧义。
//
// 2026-09-29：由「裸 section（透明底、无边框）」升级为**卡片式**，与「项目概览」等 Card 模块对齐
// （白底 + 1px 描边 + 8px 圆角 + 16px 内边距）。此前本项目多个模块浮在页面底色上、与相邻卡片不成一体。
//
// 2026-09-30：标题口径与合同详情卡片统一 —— 「蓝竖条 + 灰字标题 + 右上角操作」。
// 此前复用 ui.tsx 的 Card 头部（.nc-card-hd h3，16px/600 黑字），与本轮全站唯一卡内标题口径
// （灰字 + 3px 主色竖条）不一致，故改为直接复用 .nc-sec-title。
// ⚠️ 不可复用 .nc-ledhd：那是「卡内二级小标题」，只 margin-bottom:8px，上边距语义不同。
import React from 'react';

/** 子页外壳：统一 section 语义与纵向节奏 + 卡片外观，避免每个子页各写 margin / 各画一遍卡片壳 */
export function PjSection({ title, extra, children }: {
  title?: React.ReactNode; extra?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section className="nc-pjsection nc-card" style={{ marginBottom: 16 }}>
      {(title != null || extra != null) && (
        <div className="nc-pjsec-title">
          <div className="nc-sec-title">{title}</div>
          {extra != null && <div className="nc-pjsec-title-extra">{extra}</div>}
        </div>
      )}
      <div className="nc-card-bd">{children}</div>
    </section>
  );
}
