// 识别工作台（共享组件）—— 图纸 / 证书 / 营业执照 OCR 识别结果逐行核对
// 左栏：识别图预览（mock 占位，支持多页 P1/P2/P3 切换）
// 右栏：识别字段逐行核对（字段名 + 可编辑识别值 + 行内确认勾选）
// 底部：全部确认并写入（回调回传编辑后的字段）/ 取消
// 复用 ui.tsx 的 Modal / Btn / Check 与 nc- 类，自身只补 .nc-recog-* 布局样式。
import React, { useEffect, useMemo, useState } from 'react';
import { Btn, Check, Modal } from './ui';
import { Ico } from './icons';

/** 单条识别字段：key 由调用方约定（用于回填业务表单），value 为 OCR 识别出的原文，可在工作台内编辑。 */
export interface RecognitionField {
  key: string;
  label: string;
  value: string;
  type?: 'text' | 'number' | 'date';
}

export interface RecognitionWorkbenchProps {
  open: boolean;
  onClose: () => void;
  /** 弹窗标题，如「报价明细识别」「证书信息识别」「营业执照识别」 */
  title: string;
  /** 识别出的字段（调用方给 mock 数据） */
  fields: RecognitionField[];
  /** 识别图预览地址；缺省时渲染 mock 占位框 */
  imageUrl?: string;
  /** 多页件数（图纸 / 多页扫描件），默认 1 */
  pageCount?: number;
  /** 全部确认并写入：回传用户编辑后的全部字段，由调用方负责落业务表单 / 明细 */
  onConfirm: (fields: RecognitionField[]) => void;
}

export function RecognitionWorkbench({
  open, onClose, title, fields, imageUrl, pageCount = 1, onConfirm,
}: RecognitionWorkbenchProps) {
  /** 工作台内可编辑副本：打开时从 props.fields 同步一次，避免外部 state 被工作台编辑污染 */
  const [draft, setDraft] = useState<RecognitionField[]>(fields);
  /** 逐行确认勾选（默认全部确认 —— OCR 结果预置信，用户只需改动 / 取消个别行） */
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [pageIdx, setPageIdx] = useState(0);

  /* 每次打开都用最新的识别结果重置工作台：换一份图 / 换一个入口进来不带上次的残留 */
  useEffect(() => {
    if (!open) return;
    setDraft(fields.map((f) => ({ ...f })));
    const allOn: Record<string, boolean> = {};
    fields.forEach((f) => { allOn[f.key] = true; });
    setChecked(allOn);
    setPageIdx(0);
  }, [open, fields]);

  const total = draft.length;
  const checkedCount = useMemo(
    () => draft.filter((f) => checked[f.key]).length,
    [draft, checked],
  );
  const allOn = total > 0 && checkedCount === total;

  const setValue = (key: string, v: string) => {
    setDraft((p) => p.map((f) => (f.key === key ? { ...f, value: v } : f)));
  };
  const setOne = (key: string, v: boolean) => {
    setChecked((p) => ({ ...p, [key]: v }));
  };
  const toggleAll = (v: boolean) => {
    const next: Record<string, boolean> = {};
    draft.forEach((f) => { next[f.key] = v; });
    setChecked(next);
  };

  const confirm = () => {
    onConfirm(draft);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="L"
      title={title}
      foot={<>
        <Btn onClick={onClose}>取消</Btn>
        <Btn kind="primary" onClick={confirm}><Ico n="check" size={16} /> 全部确认并写入</Btn>
      </>}>
      <div className="nc-recog-wrap">
        {/* 左：识别图预览 */}
        <div className="nc-recog-img">
          {imageUrl ? (
            <img className="nc-recog-img-el" src={imageUrl} alt="识别图预览" />
          ) : (
            <div className="nc-recog-ph">
              <Ico n="file" size={30} />
              <div className="nc-recog-ph-t">识别图预览 · P{pageIdx + 1}</div>
              <div className="nc-recog-ph-s">mock 占位（接入后此处渲染原图 / 扫描件）</div>
            </div>
          )}
          {pageCount > 1 && (
            <div className="nc-recog-pages">
              {Array.from({ length: pageCount }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`nc-recog-page${i === pageIdx ? ' is-on' : ''}`}
                  onClick={() => setPageIdx(i)}
                >P{i + 1}</button>
              ))}
            </div>
          )}
        </div>

        {/* 右：逐行核对 */}
        <div className="nc-recog-fields">
          <div className="nc-recog-head">
            <Check checked={allOn} onChange={toggleAll} label="全选确认" />
            <span className="nc-recog-count">已确认 <b>{checkedCount}</b> / {total} 项</span>
          </div>
          <div className="nc-recog-list">
            {draft.map((f) => (
              <div key={f.key} className={`nc-recog-row${checked[f.key] ? '' : ' is-off'}`}>
                <div className="nc-recog-row-label">{f.label}</div>
                <input
                  className="nc-input nc-input-sm"
                  type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'}
                  value={f.value}
                  onChange={(e) => setValue(f.key, e.target.value)}
                />
                <Check checked={!!checked[f.key]} onChange={(v) => setOne(f.key, v)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default RecognitionWorkbench;
