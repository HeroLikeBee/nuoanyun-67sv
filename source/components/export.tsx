// 诺安云 6.0 · 统一导出公共组件（全站样板）
// 一次实现：范围 / 字段 / 格式 / 水印 四块配置 + 真实水印预览 + 审计上报 + localStorage 记忆。
// 后续页面（合同 / 发票 / 物料 / 客户 …）一律用 useExport + ExportButton 接入，不要再各自写导出按钮与水印弹窗。
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Btn, Check, Field, Modal, useToast } from './ui';
import { Ico } from './icons';
import { ROLES } from './data';

/* ============================ 类型（后续批次严格依赖此 API） ============================ */
export interface ExportField {
  key: string;
  label: string;
  /** 敏感字段：导出时单元格脱敏展示为 **，并强制写入审计日志 */
  sensitive?: boolean;
}
export type ExportScope = 'selected' | 'filtered' | 'all';
export type ExportFormat = 'xlsx' | 'pdf' | 'csv';
export interface ExportConfig {
  scope: ExportScope;
  fieldKeys: string[];
  format: ExportFormat;
  /** 变量已替换为真实值后的最终水印文字（CSV 时为空串） */
  watermark: string;
  fileName: string;
}

/* ============================ 审计日志（模块级，供查阅） ============================ */
export interface ExportAuditEntry {
  userName: string;
  time: string;
  pageName: string;
  pageKey: string;
  scope: ExportScope;
  fieldKeys: string[];
  format: ExportFormat;
  watermark: string;
  hasSensitive: boolean;
}
export const EXPORT_AUDIT_LOG: ExportAuditEntry[] = [];
function reportExportAudit(e: ExportAuditEntry) {
  EXPORT_AUDIT_LOG.push(e);
  // 原型阶段审计落到 console，不接后端
  console.info('[导出审计]', e);
}

/* ============================ 辅助 ============================ */
/** ROLES 映射为当前用户名；未知 role 回落「当前用户」 */
export function getUserName(role: string): string {
  return ROLES.find((r) => r.id === role)?.name || '当前用户';
}

const pad2 = (n: number) => String(n).padStart(2, '0');
/** 当前时间展示串：2026-09-24 16:21 */
function nowDisplay(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
/** 文件名时间串：20260924-1621 */
function nowFile(): string {
  const d = new Date();
  return `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}`;
}

const WM_VARS = ['{当前用户}', '{导出时间}', '{租户名称}', '{项目名称}'] as const;
const WM_TEMPLATES = ['仅限本项目使用', '仅限内部使用', '请勿外传', '商业秘密 · 禁止外泄'];

/** 把水印模板里的变量替换为真实值（调用方负责在导出瞬间再算一次时间） */
function resolveWatermark(
  tpl: string,
  vars: { userName: string; tenantName: string; projectName: string },
  time?: string,
): string {
  return tpl
    .split('{当前用户}').join(vars.userName)
    .split('{导出时间}').join(time ?? nowDisplay())
    .split('{租户名称}').join(vars.tenantName || '云南诺安消防')
    .split('{项目名称}').join(vars.projectName || '未关联');
}

/* ============================ 水印平铺预览 ============================ */
/**
 * 真实水印预览：半透明斜向平铺叠加在迷你表格 / 文档页 mock 上。
 * - table 模式：取 rows 前 5 行渲染迷你表格，敏感字段单元格显示 **
 * - doc 模式：白色文档页 mock（灰色文本占位线）
 */
export function WatermarkPreview({ rows, columns, watermark, totalRows, sensitiveKeys, mode = 'table' }: {
  rows: Record<string, unknown>[];
  columns: { key: string; label: string }[];
  watermark: string;
  totalRows: number;
  sensitiveKeys?: string[];
  mode?: 'table' | 'doc';
}) {
  const sens = new Set(sensitiveKeys ?? []);
  const previewRows = rows.slice(0, 5);
  /* 斜向平铺：把一个超大旋转容器铺在内容上方，内部 flex-wrap 重复水印文字 */
  const cells = [];
  for (let i = 0; i < 24; i++) cells.push(watermark || ' ');
  return (
    <div className="nc-export-wmpreview">
      <div className="nc-export-wmpreview-canvas">
        {mode === 'table' ? (
          <table className="nc-export-mini-tbl">
            <thead>
              <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
            </thead>
            <tbody>
              {previewRows.map((r, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c.key}>{sens.has(c.key) ? '**' : String(r[c.key] ?? '—')}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="nc-export-doc-mock">
            <div className="nc-export-doc-line is-title" />
            <div className="nc-export-doc-line" />
            <div className="nc-export-doc-line" />
            <div className="nc-export-doc-line is-short" />
            <div className="nc-export-doc-line" />
          </div>
        )}
        {/* 水印平铺层 */}
        {watermark && (
          <div className="nc-export-wm-layer" aria-hidden>
            <div className="nc-export-wm-rot">
              {cells.map((t, i) => <span key={i} className="nc-export-wm-cell">{t}</span>)}
            </div>
          </div>
        )}
      </div>
      <div className="nc-export-wmpreview-note">
        {mode === 'table'
          ? `实际文件共 ${totalRows} 行 × ${columns.length} 列，预览仅示意`
          : '预览仅示意'}
      </div>
    </div>
  );
}

/* ============================ localStorage 记忆 ============================ */
type StoredPref = { watermark: string; format: ExportFormat; fieldKeys: string[] };
const memKey = (userName: string, pageKey: string) => `nuoan-export:${userName}:${pageKey}`;
const defKey = (pageKey: string) => `nuoan-export:default:${pageKey}`;

function loadPref(userName: string, pageKey: string): Partial<StoredPref> {
  try {
    const raw = localStorage.getItem(memKey(userName, pageKey));
    if (raw) return JSON.parse(raw) as Partial<StoredPref>;
  } catch { /* ignore */ }
  return {};
}
function savePref(userName: string, pageKey: string, pref: StoredPref) {
  try { localStorage.setItem(memKey(userName, pageKey), JSON.stringify(pref)); } catch { /* ignore */ }
}
function loadDefaultWatermark(pageKey: string): string {
  try {
    const raw = localStorage.getItem(defKey(pageKey));
    if (raw) return (JSON.parse(raw) as { watermark?: string }).watermark || '';
  } catch { /* ignore */ }
  return '';
}
function saveDefaultWatermark(pageKey: string, watermark: string) {
  try { localStorage.setItem(defKey(pageKey), JSON.stringify({ watermark })); } catch { /* ignore */ }
}

/* ============================ 导出弹窗 ============================ */
export function ExportDialog({ open, onClose, mode = 'list', pageName, pageKey,
  totalCount, filteredCount, selectedCount, fields, defaultFieldKeys,
  filterSummary, onModifyFilter, projectName, userName, tenantName, onConfirm, previewRows,
}: {
  open: boolean;
  onClose: () => void;
  mode?: 'list' | 'single';
  pageName: string;
  pageKey: string;
  totalCount: number;
  filteredCount: number;
  selectedCount: number;
  fields: ExportField[];
  defaultFieldKeys: string[];
  filterSummary?: React.ReactNode;
  onModifyFilter?: () => void;
  projectName?: string;
  userName: string;
  tenantName?: string;
  onConfirm: (cfg: ExportConfig) => void;
  /** 预览用真实首行数据（取所选范围前 3~5 行，敏感列由 WatermarkPreview 统一脱敏为 **）；缺省回退示例行 */
  previewRows?: Record<string, unknown>[];
}) {
  const isSingle = mode === 'single';
  /* ---- 初始状态：打开时读 localStorage 记忆 / 默认模板 ---- */
  const [scope, setScope] = useState<ExportScope>(selectedCount > 0 ? 'selected' : 'filtered');
  const [fieldKeys, setFieldKeys] = useState<string[]>(defaultFieldKeys);
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [watermarkTpl, setWatermarkTpl] = useState('仅限内部使用');
  const [askAll, setAskAll] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const pref = loadPref(userName, pageKey);
    setScope(selectedCount > 0 ? 'selected' : 'filtered');
    setFieldKeys(pref.fieldKeys && pref.fieldKeys.length ? pref.fieldKeys : defaultFieldKeys);
    setFormat(pref.format ?? 'xlsx');
    const defWm = loadDefaultWatermark(pageKey);
    setWatermarkTpl(pref.watermark || defWm || '仅限内部使用');
    setAskAll(false);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const hasSensitive = fields.some((f) => f.sensitive && fieldKeys.includes(f.key));
  const csvNoWm = format === 'csv';
  const effTenant = tenantName || '云南诺安消防';

  /** 实时预览用的已解析水印（不含时间：预览用当前时间即可） */
  const resolvedPreview = useMemo(
    () => (csvNoWm ? '' : resolveWatermark(watermarkTpl, { userName, tenantName: effTenant, projectName: projectName || '' })),
    [watermarkTpl, userName, effTenant, projectName, csvNoWm],
  );

  /* ---- 字段全选 / 反选 / 恢复默认 ---- */
  const allKeys = fields.map((f) => f.key);
  const allOn = fieldKeys.length === allKeys.length;
  const toggleAll = () => setFieldKeys(allOn ? [] : allKeys);
  const toggleKey = (k: string) =>
    setFieldKeys((ks) => (ks.includes(k) ? ks.filter((x) => x !== k) : [...ks, k]));

  /* ---- 范围描述 / 文件名 ---- */
  const scopeDesc = isSingle
    ? '当前单据'
    : scope === 'selected' ? `勾选${selectedCount}条` : scope === 'filtered' ? '当前筛选' : '全部';
  const fileStamp = nowFile();
  const fileName = `${pageName}_${scopeDesc}_${fileStamp}.${format}`;

  /* ---- 往输入框光标处插入变量 ---- */
  const insertVar = (v: string) => {
    const el = inputRef.current;
    if (!el) { setWatermarkTpl((t) => t + v); return; }
    const pos = el.selectionStart ?? el.value.length;
    const next = el.value.slice(0, pos) + v + el.value.slice(el.selectionEnd ?? pos);
    setWatermarkTpl(next);
    requestAnimationFrame(() => { el.focus(); el.selectionStart = el.selectionEnd = pos + v.length; });
  };

  /* ---- 确认：先把用户填的「原始模板」(含变量) 写入记忆，再回调（变量在导出瞬间解析） ---- */
  const submit = () => {
    savePref(userName, pageKey, { watermark: watermarkTpl, format, fieldKeys });
    setLoading(true);
    // 原型内部 300ms 模拟后台打包
    window.setTimeout(() => {
      setLoading(false);
      onConfirm({
        scope,
        fieldKeys,
        format,
        // CSV 无法嵌水印 → 最终水印置空；其余在导出瞬间解析变量（时间用导出时刻）
        watermark: csvNoWm ? '' : resolveWatermark(watermarkTpl, { userName, tenantName: effTenant, projectName: projectName || '' }),
        fileName,
      });
    }, 300);
  };

  /* 迷你预览：优先用调用方传入的真实首行数据（前 5 行），否则按 fields 造示例占位行 */
  const previewCols = fields.slice(0, 6).map((f) => ({ key: f.key, label: f.label }));
  const exampleRows: Record<string, unknown>[] = [
    Object.fromEntries(previewCols.map((c) => [c.key, c.key === previewCols[0]?.key ? '示例 A' : '—'])),
    Object.fromEntries(previewCols.map((c) => [c.key, c.key === previewCols[0]?.key ? '示例 B' : '—'])),
    Object.fromEntries(previewCols.map((c) => [c.key, c.key === previewCols[0]?.key ? '示例 C' : '—'])),
  ];
  const effPreviewRows = previewRows && previewRows.length ? previewRows.slice(0, 5) : exampleRows;

  return (
    <>
      <Modal open={open} onClose={onClose} size="L" title="导出数据"
        foot={<>
          <Btn onClick={onClose}>取消</Btn>
          <Btn kind="primary" loading={loading} disabled={!fieldKeys.length} onClick={submit}>
            <Ico n="download" size={16} /> 确认导出
          </Btn>
        </>}>
        <div className="nc-export-dialog">
          {/* ① 导出范围 */}
          <div className="nc-export-block">
            <div className="nc-export-block-title">① 导出范围</div>
            {isSingle ? (
              <div className="nc-export-scope-single">当前单据（1 条）</div>
            ) : (
              <div className="nc-export-radios">
                {selectedCount > 0 && (
                  <label className="nc-export-radio">
                    <input type="radio" name="nc-export-scope" checked={scope === 'selected'}
                      onChange={() => setScope('selected')} />
                    <span>当前勾选（{selectedCount} 条）</span>
                  </label>
                )}
                <label className="nc-export-radio">
                  <input type="radio" name="nc-export-scope" checked={scope === 'filtered'}
                    onChange={() => setScope('filtered')} />
                  <span>当前筛选结果（{filteredCount} 条）</span>
                </label>
                <label className="nc-export-radio">
                  <input type="radio" name="nc-export-scope" checked={scope === 'all'}
                    onChange={() => setAskAll(true)} />
                  <span>全部数据（{totalCount} 条）</span>
                </label>
              </div>
            )}
            {!isSingle && (
              <div className="nc-export-filterrow">
                <span className="nc-cell-sub">
                  当前条件：{filterSummary ?? '无额外筛选'}
                </span>
                {onModifyFilter && (
                  <Btn kind="link" size="sm" onClick={() => { onModifyFilter(); onClose(); }}>去修改</Btn>
                )}
              </div>
            )}
          </div>

          {/* ② 导出字段 */}
          <div className="nc-export-block">
            <div className="nc-export-block-title">
              ② 导出字段（已选 {fieldKeys.length}/{fields.length}）
              <span className="nc-export-block-ops">
                <Btn kind="link" size="sm" onClick={toggleAll}>{allOn ? '清空' : '全选'}</Btn>
                <Btn kind="link" size="sm" onClick={() => setFieldKeys(defaultFieldKeys)}>恢复默认</Btn>
              </span>
            </div>
            <div className="nc-export-fieldgrid">
              {fields.map((f) => (
                <Check key={f.key} checked={fieldKeys.includes(f.key)} onChange={() => toggleKey(f.key)}
                  label={f.label + (f.sensitive ? ' [加密]' : '')} />
              ))}
            </div>
            {hasSensitive && (
              <div className="nc-export-warnline">含敏感字段时将强制加水印并写入审计日志。</div>
            )}
          </div>

          {/* ③ 文件格式 */}
          <div className="nc-export-block">
            <div className="nc-export-block-title">③ 文件格式</div>
            <div className="nc-export-radios">
              {([
                { k: 'xlsx', l: 'Excel（.xlsx）' },
                { k: 'pdf', l: 'PDF（.pdf）' },
                { k: 'csv', l: 'CSV（.csv）' },
              ] as { k: ExportFormat; l: string }[]).map((o) => (
                <label key={o.k} className="nc-export-radio">
                  <input type="radio" name="nc-export-fmt" checked={format === o.k}
                    onChange={() => setFormat(o.k)} />
                  <span>{o.l}</span>
                </label>
              ))}
            </div>
            {csvNoWm && (
              <Alert tone="warn" icon={<Ico n="warning" size={16} />}
                title="CSV 为纯文本格式，无法嵌入水印，如需水印请选择 Excel/PDF。" />
            )}
          </div>

          {/* ④ 水印设置 */}
          <div className={`nc-export-block${csvNoWm ? ' is-disabled' : ''}`}>
            <div className="nc-export-block-title">④ 水印设置<span className="nc-export-req">· 强制开启</span></div>
            <Field label="水印文字">
              <input ref={inputRef} className="nc-input" disabled={csvNoWm} value={watermarkTpl}
                onChange={(e) => setWatermarkTpl(e.target.value)}
                placeholder="如：仅限内部使用" />
            </Field>
            <div className="nc-export-chips">
              <span className="nc-export-chip-label">快捷模板：</span>
              {WM_TEMPLATES.map((t) => (
                <button key={t} type="button" disabled={csvNoWm}
                  className={`nc-fchip${watermarkTpl === t ? ' is-on' : ''}`}
                  onClick={() => setWatermarkTpl(t)}>{t}</button>
              ))}
            </div>
            <div className="nc-export-chips">
              <span className="nc-export-chip-label">插入变量：</span>
              {WM_VARS.map((v) => (
                <button key={v} type="button" className="nc-fchip" disabled={csvNoWm}
                  onClick={() => insertVar(v)}>{v}</button>
              ))}
            </div>
            {!csvNoWm && (
              <div className="nc-export-previewbox">
                <WatermarkPreview
                  rows={effPreviewRows} columns={previewCols} watermark={resolvedPreview}
                  totalRows={filteredCount} sensitiveKeys={fields.filter((f) => f.sensitive).map((f) => f.key)}
                />
              </div>
            )}
            <div className="nc-export-defrow">
              <Btn kind="link" size="sm" disabled={csvNoWm}
                onClick={() => { saveDefaultWatermark(pageKey, watermarkTpl); }}>
                设为默认模板
              </Btn>
            </div>
          </div>

          {/* 最终文件名 */}
          <div className="nc-export-filename">
            文件名：<code>{fileName}</code>
          </div>
        </div>
      </Modal>

      {/* 导出全部数据二次确认 */}
      {askAll && (
        <>
          <div className="nc-modal-mask is-open" style={{ zIndex: 97 }} />
          <div className="nc-modal is-open" style={{ width: 440, maxWidth: '94vw', position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 98 }}>
            <div className="nc-modal-hd">
              <h3><span className="nc-cfirm-ic"><Ico n="warning" size={16} /></span>导出全部数据？</h3>
              <button className="nc-drawer-close" onClick={() => setAskAll(false)} aria-label="关闭"><Ico n="close" size={16} /></button>
            </div>
            <div className="nc-modal-bd">
              将导出全部 <b>{totalCount}</b> 条数据，<b>不受当前筛选限制</b>，是否继续？
            </div>
            <div className="nc-modal-ft">
              <Btn onClick={() => setAskAll(false)}>取消</Btn>
              <Btn kind="primary" onClick={() => { setAskAll(false); setScope('all'); }}>继续导出全部</Btn>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/* ============================ useExport hook ============================ */
export function useExport({ pageKey, pageName, mode = 'list', fields, defaultFieldKeys,
  totalCount, filteredCount, selectedCount, filterSummary, onModifyFilter,
  projectName, userName, tenantName, onExport, previewRows,
}: {
  pageKey: string;
  pageName: string;
  mode?: 'list' | 'single';
  fields: ExportField[];
  defaultFieldKeys: string[];
  totalCount: number;
  filteredCount: number;
  selectedCount: number;
  filterSummary?: React.ReactNode;
  onModifyFilter?: () => void;
  projectName?: string;
  userName: string;
  tenantName?: string;
  onExport: (cfg: ExportConfig) => void;
  /** 预览用真实首行数据（前 3~5 行）；缺省回退示例行 */
  previewRows?: Record<string, unknown>[];
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const trigger = () => setOpen(true);

  const onConfirm = (cfg: ExportConfig) => {
    const hasSensitive = fields.some((f) => f.sensitive && cfg.fieldKeys.includes(f.key));
    reportExportAudit({
      userName, time: nowDisplay(), pageName, pageKey,
      scope: cfg.scope, fieldKeys: cfg.fieldKeys, format: cfg.format,
      watermark: cfg.watermark, hasSensitive,
    });
    // >5000 行分支：异步导出文案（原型不实现真实任务）
    const big = (cfg.scope === 'all' && totalCount > 5000) || (cfg.scope === 'filtered' && filteredCount > 5000);
    if (big) {
      toast('数据量较大，已加入导出任务，完成后在消息中心通知');
    } else {
      toast(`已导出${pageName}（${cfg.format}）· 查看文件`);
    }
    onExport(cfg);
    setOpen(false);
  };

  return {
    open,
    setOpen,
    trigger,
    btnLabel: selectedCount > 0 ? `导出 (${selectedCount})` : '导出',
    dialogProps: {
      open, onClose: () => setOpen(false), mode, pageName, pageKey,
      totalCount, filteredCount, selectedCount, fields, defaultFieldKeys,
      filterSummary, onModifyFilter, projectName, userName, tenantName, onConfirm, previewRows,
    },
  };
}
/* ============================ 统一导出按钮 ============================ */
export function ExportButton({ onClick, selectedCount, disabled, title }: {
  onClick: () => void;
  selectedCount?: number;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <Btn
      title={title || '将按当前筛选导出，可在弹窗中修改范围与内容'}
      onClick={onClick}
      disabled={disabled}
    >
      <Ico n="download" size={16} /> {selectedCount && selectedCount > 0 ? `导出 (${selectedCount})` : '导出'}
    </Btn>
  );
}
