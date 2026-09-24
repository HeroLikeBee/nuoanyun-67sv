/**
 * 穿透预览 · 模块级状态（与 UI 解耦，供 ui.tsx 的 EntityLink 与 entityPreview.tsx 宿主共同使用）。
 */
import { useEffect, useState } from 'react';

let _p: { target: string; id: string } | null = null;
const subs = new Set<() => void>();
const emit = () => { subs.forEach((f) => f()); };
const getP = () => _p;

/** 支持穿透预览的目标页面 key */
export const previewTargets = ['customer', 'opp', 'quote', 'bid', 'contract', 'supplier', 'project-center'] as const;
export const isPreviewTarget = (t: string) => (previewTargets as readonly string[]).includes(t);

/** 打开穿透预览（EntityLink 点击时调用；不再 go 跳页） */
export const openPreview = (target: string, id: string) => { _p = { target, id }; emit(); };
/** 关闭穿透预览 */
export const closePreview = () => { _p = null; emit(); };
/** 订阅当前穿透目标（宿主组件用） */
export const usePreview = () => {
  const [p, setP] = useState(getP());
  useEffect(() => {
    const f = () => setP(getP());
    subs.add(f);
    return () => { subs.delete(f); };
  }, []);
  return p;
};
