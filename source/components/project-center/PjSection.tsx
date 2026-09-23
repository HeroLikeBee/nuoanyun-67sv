// 项目详情 · 子页外壳（多内容包一层 section，统一纵向节奏）
// 说明：ctx.ts 只放纯类型与数据契约（.ts 不含 JSX），渲染组件单独放这里，
// 避免 ctx.ts / ctx.tsx 同名解析歧义。
import React from 'react';

/** 子页外壳：统一 section 语义与纵向节奏，避免每个子页各写 margin */
export function PjSection({ title, extra, children }: {
  title?: React.ReactNode; extra?: React.ReactNode; children: React.ReactNode;
}) {
  return (
    <section className="nc-pjsection" style={{ marginBottom: 16 }}>
      {(title != null || extra != null) && (
        <div className="nc-ledhd" style={{ marginBottom: 10 }}>
          {title}
          {extra != null && <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>{extra}</span>}
        </div>
      )}
      {children}
    </section>
  );
}
