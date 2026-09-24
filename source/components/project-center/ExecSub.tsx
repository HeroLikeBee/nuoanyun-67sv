// 项目详情 · 进度履约子页
//
// 回答「工期走到哪、节点资料齐不齐、现场在干什么、投入够不够」。
// 闭环：每个里程碑挂「准入资料 + 确认动作」，节点确认后自动推进；
//       节点档案紧跟里程碑（资料是节点的附属物）；进度断点可下钻到工序填报。
// HSE 安全检查已并入「质量安全」；本页不重复金额口径，只承接节点 / 资料 / 日志 / 在场投入。
//
// ⚠️ 数据全部经 PjCtx（buildPjDemo 按本项目派生），不持有跨项目常量。
import React, { useState } from 'react';
import { Btn, Card, Field, KvGrid, Modal, Progress, Tag, Timeline, Tip } from '../ui';
import { Ico } from '../icons';
import { MILESTONE_LEGAL, TODAY } from '../data';
import { nodeKey } from './seed';
import { PjSection } from './PjSection';
import type { PjCtx } from './ctx';

const MILE_ST_TONE: Record<string, 'green' | 'blue' | 'gray' | 'red'> = {
  已完成: 'green', 进行中: 'blue', 待开始: 'gray', 逾期: 'red',
};

/** 里程碑节点表：计划 / 实际 / 状态 / 责任人 + 准入资料齐备标志（唯一可确认动作在节点行内） */
function Milestones({ C }: { C: PjCtx }) {
  // ⚠️ 必须用 nodeKey（取「M10 结算」的 M10），不能用 slice(0, 2) —— 后者会把 M10 认成 M1
  const curKey = nodeKey(C.curMile?.name ?? '');
  return (
    <PjSection
      title={<><Ico n="swap" size={16} /> 里程碑节点</>}
      extra={<>
        <span className="nc-cell-sub">
          {C.mileRows.filter((m) => m.st === '已完成').length} / {C.mileRows.length} 已完成
          {C.curMile ? ` · 当前 ${C.curMile.name}` : ''}
        </span>
        <Tip w={400} text="节点由系统按业务事件自动推进，人工只能确认当前节点；确认前须满足该节点的必传资料（缺件硬拦截）。法定节点（隐蔽验收 / 第三方检测 / 消防验收备案）删除须二次确认，防漏。" />
        <Btn size="sm" onClick={() => C.toast(`已按「${C.P.type}」类型套用里程碑模板`)}>套用模板</Btn>
        <Btn size="sm" onClick={() => C.toast('已打开「新增里程碑节点」表单（演示）')}>＋ 新增节点</Btn>
      </>}
    >
      <table className="nc-tbl" style={{ minWidth: 900 }}>
        <thead><tr>
          <th>节点</th>
          <th style={{ width: 120 }}>计划完成日</th>
          <th style={{ width: 120 }}>实际完成日</th>
          <th style={{ width: 100 }}>状态</th>
          <th style={{ width: 100 }}>责任人</th>
          <th style={{ width: 120 }}>准入资料</th>
          <th style={{ width: 130 }}>操作</th>
        </tr></thead>
        <tbody>
          {C.mileRows.map((r) => {
            const g = C.attach.find((a) => nodeKey(a.mile) === nodeKey(r.n));
            const miss = g ? g.req.filter((x) => !g.files.some((f) => f.name.includes(x.slice(0, 4)))) : [];
            const isCur = nodeKey(r.n) === curKey;
            const over = r.st !== '已完成' && r.plan !== '—' && r.plan < TODAY;
            return (
              <tr key={r.n} className={isCur ? 'trig-hit' : over ? 'is-danger-row' : ''}>
                <td>
                  <b>{r.n}</b>
                  {MILESTONE_LEGAL.includes(r.n.replace(/^M\d+\s*/, '')) && <Tag tone="gray">法定</Tag>}
                  {isCur && <Tag tone="blue">当前</Tag>}
                </td>
                <td className={`num${over ? ' nc-v-red' : ''}`}>{r.plan}{over && ' ⚠'}</td>
                <td className="num">{r.act}</td>
                <td><Tag tone={MILE_ST_TONE[r.st] ?? 'gray'}>{r.st}</Tag></td>
                <td>{r.owner}</td>
                <td>
                  {!g || g.req.length === 0 ? <span className="nc-cell-sub">无必传项</span>
                    : miss.length === 0 ? <Tag tone="green">齐备</Tag>
                      : <Tag tone={r.st === '已完成' ? 'red' : 'gray'}>缺 {miss.length} 项</Tag>}
                </td>
                <td>
                  {isCur
                    ? (miss.length > 0
                      ? <Btn size="sm" disabled title={`缺 ${miss.join('、')}，补齐后方可确认`}>确认（缺件）</Btn>
                      : <Btn size="sm" kind="primary" onClick={() => C.openM('mile')}>确认节点</Btn>)
                    : <span className="nc-cell-sub">—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {C.curMile && C.curMiss.length > 0 && (
        <div className="nc-gate-block">
          <Ico n="warning" size={14} />
          当前节点「{C.curMile.name}」缺 {C.curMiss.join('、')} —— 缺件硬拦截：确认按钮置灰，须先补齐资料（见下方节点档案）。
        </div>
      )}
    </PjSection>
  );
}

/** 节点准入与档案：每个里程碑需要哪些资料、缺哪份、谁签认 —— 缺件硬拦截 */
function GateAndFiles({ C }: { C: PjCtx }) {
  const [open, setOpen] = useState<string | null>(C.curMile ? nodeKey(C.curMile.name) : null);
  return (
    <PjSection
      title={<><Ico n="paperclip" size={16} /> 节点准入与档案</>}
      extra={<>
        <span className="nc-cell-sub">{C.attach.length} 组 · 已归档 {C.attCnt} 份</span>
        <Tip w={440} text="节点准入清单由里程碑模板带出：每个节点有必传资料项，缺件时节点无法确认（硬拦截），不允许「先确认后补件」。法定节点另有删除二次确认。" />
        <Btn size="sm" kind="primary" onClick={() => C.openM('upload')}>＋ 上传档案</Btn>
      </>}
    >
      {C.curMiss.length > 0 && (
        <div className="nc-gate-block">
          <Ico n="warning" size={14} />
          当前节点「{C.curMile?.name}」还缺 {C.curMiss.length} 项必传资料（{C.curMiss.join('、')}）—— 「确认里程碑」按钮在补齐前不可提交。
        </div>
      )}
      <div className="nc-gate" style={{ marginTop: 10 }}>
        {C.attach.map((g) => {
          const mileKey = nodeKey(g.mile);
          const isCur = C.curMile ? nodeKey(C.curMile.name) === mileKey : false;
          const miss = g.req.filter((r) => !g.files.some((f) => f.name.includes(r.slice(0, 4))));
          const isOpen = open === mileKey;
          return (
            <div key={g.mile}>
              <div className="nc-gate-row" style={{ background: isCur ? 'var(--c-primary-bg)' : undefined }}>
                <span className="nc-gate-n">
                  <button
                    className="nc-id-cell is-link" style={{ font: 'inherit', color: 'inherit' }}
                    onClick={() => setOpen(isOpen ? null : mileKey)}
                  >
                    {isOpen ? '▾ ' : '▸ '}<b>{g.mile}</b>
                  </button>
                  {isCur && <Tag tone="blue">当前节点</Tag>}
                  {MILESTONE_LEGAL.includes(g.mile.replace(/^M\d+\s*/, '').split('（')[0]) && <Tag tone="gray">法定</Tag>}
                  {g.req.length === 0 && <span className="nc-cell-sub">无必传项</span>}
                  {g.req.length > 0 && miss.length === 0 && <Tag tone="green">必传项齐备</Tag>}
                  {miss.length > 0 && <Tag tone={g.reached ? 'red' : 'gray'}>{g.reached ? `已到节点仍缺 ${miss.length} 项` : `缺 ${miss.length} 项（未到节点）`}</Tag>}
                  <div className="nc-cell-sub">
                    必传：{g.req.length ? g.req.join(' / ') : '—'}　已归档 {g.files.length} 份
                    {miss.length > 0 && `　缺：${miss.join(' / ')}`}
                  </div>
                </span>
                <span className="nc-gate-s"><Btn size="sm" onClick={() => C.openM('upload')}>上传</Btn></span>
              </div>
              {isOpen && (
                <div style={{ padding: '4px 12px 10px 24px' }}>
                  {g.files.length === 0 && <div className="nc-empty-mini">该节点暂无归档文件</div>}
                  {g.files.map((f) => (
                    <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 13 }}>
                      <Ico n="paperclip" size={14} />
                      <span style={{ flex: 1, minWidth: 0 }}>{f.name}</span>
                      <span className="nc-cell-sub">{f.size}</span>
                      <span className="nc-cell-sub">{f.by}</span>
                      <span className="nc-cell-sub num">{f.date}</span>
                      <Btn size="sm" onClick={() => C.toast(`「${f.name}」已下载（演示）`)}>下载</Btn>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PjSection>
  );
}

/** 工程量完成情况：可下钻到工序填报 */
function WorkItems({ C }: { C: PjCtx }) {
  const [rows, setRows] = useState(C.workItems);
  const [editing, setEditing] = useState<number | null>(null);
  const [qty, setQty] = useState('');
  const sumQty = rows.reduce((s, r) => s + r.totalQty, 0);
  const pct = rows.reduce((s, r) => s + r.doneQty * r.unitPrice, 0) / Math.max(1, rows.reduce((s, r) => s + r.totalQty * r.unitPrice, 0)) * 100;
  const cur = editing === null ? null : rows[editing];

  if (rows.length === 0) {
    return (
      <PjSection title={<><Ico n="chart" size={16} /> 工程量完成情况</>}
        extra={<Btn size="sm" onClick={() => C.openM('progress')}>更新进度</Btn>}>
        <div className="nc-empty">
          本项目尚未拆分工序产值清单。
          <div className="nc-cell-sub" style={{ marginTop: 6 }}>可先「套用模板」生成工序清单，之后填报工程量即自动重算进度。</div>
        </div>
      </PjSection>
    );
  }

  return (
    <PjSection
      title={<><Ico n="chart" size={16} /> 工程量完成情况</>}
      extra={<>
        <Tip w={380} text="进度由工序填报数量加权派生：填了工程量，进度自动重算，不再让人工拍一个百分比。项目经理可直接填报百分比作为兜底。" />
        <Btn size="sm" onClick={() => C.openM('progress')}>更新进度</Btn>
      </>}
    >
      <table className="nc-tbl" style={{ minWidth: 860 }}>
        <thead><tr>
          <th>工序 / 分项</th><th style={{ width: 90 }}>单位</th>
          <th style={{ width: 110 }} className="is-num">总量</th><th style={{ width: 110 }} className="is-num">已完成</th>
          <th style={{ width: 110 }} className="is-num">单价（元）</th><th style={{ width: 130 }} className="is-num">已完产值</th>
          <th style={{ width: 160 }}>完成率</th><th style={{ width: 100 }}>操作</th>
        </tr></thead>
        <tbody>
          {rows.map((r, i) => {
            const p = (r.doneQty / Math.max(1, r.totalQty)) * 100;
            return (
              <tr key={r.name}>
                <td><b>{r.name}</b></td>
                <td>{r.unit}</td>
                <td className="is-num num">{r.totalQty.toLocaleString()}</td>
                <td className="is-num num">{r.doneQty.toLocaleString()}</td>
                <td className="is-num num">{r.unitPrice.toLocaleString()}</td>
                <td className="is-num num">{(r.doneQty * r.unitPrice).toLocaleString()}</td>
                <td>
                  <Progress value={p} tone={p >= 100 ? 'green' : p < 50 ? 'red' : 'orange'} />
                  <span className="nc-cell-sub">{p.toFixed(0)}%</span>
                </td>
                <td>
                  <Btn size="sm" onClick={() => { setEditing(i); setQty(String(r.doneQty)); }}>填报</Btn>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {/* 产值加权完成率放在清单合计行（表内汇总不算重复口径）；概览 KPI 的「施工进度」是它的高层读数 */}
      <div className="nc-cell-sub" style={{ marginTop: 8 }}>
        工程量合计 {sumQty.toLocaleString()}（跨单位不做加总，此处仅作清单规模提示）· 产值加权完成率 {pct.toFixed(1)}%
      </div>

      <Modal
        open={editing !== null} width={480} title={`填报「${cur?.name ?? ''}」完成量`}
        onClose={() => setEditing(null)}
        foot={<>
          <Btn onClick={() => setEditing(null)}>取消</Btn>
          <Btn kind="primary" onClick={() => {
            if (editing === null || !cur) return;
            const v = Math.min(cur.totalQty, Math.max(0, Number(qty) || 0));
            setRows((s) => s.map((x, k) => (k === editing ? { ...x, doneQty: v } : x)));
            C.toast(`「${cur.name}」完成量已更新为 ${v} ${cur.unit}`);
            setEditing(null);
          }}>保存</Btn>
        </>}
      >
        {cur && (
          <>
            <KvGrid cols={2} rows={[
              { k: '工序', v: cur.name },
              { k: '总量 / 单位', v: `${cur.totalQty.toLocaleString()} ${cur.unit}`},
            ]} />
            <Field label="已完成量" req note={`取值范围 0 ~ ${cur.totalQty.toLocaleString()} ${cur.unit}`}>
              <input className="nc-input" type="number" min={0} max={cur.totalQty}
                value={qty} onChange={(e) => setQty(e.target.value)} />
            </Field>
          </>
        )}
      </Modal>
    </PjSection>
  );
}

/** 现场作业日志（标题与文案按业务线派生，维保不写施工日志）：
 *  可关联打卡记录（照片墙与打卡明细归属「考勤 / 现场作业」，此处只读消费） */
function SiteLogs({ C }: { C: PjCtx }) {
  if (C.siteLogs.length === 0) {
    return (
      <PjSection title={<><Ico n="file" size={16} /> {C.scene.logTitle}</>}
        extra={<Btn size="sm" kind="primary" onClick={() => C.openM('log')}>＋ 写日志</Btn>}>
        <div className="nc-empty">{C.scene.logEmpty}</div>
      </PjSection>
    );
  }
  return (
    <PjSection
      title={<><Ico n="file" size={16} /> {C.scene.logTitle}</>}
      extra={<>
        <span className="nc-cell-sub">可关联移动端打卡（含定位与照片），本平台只读消费</span>
        <Btn size="sm" kind="primary" onClick={() => C.openM('log')}>＋ 写日志</Btn>
      </>}
    >
      <Timeline items={C.siteLogs.map((l) => ({
        date: l.date, tone: 'ok' as const,
        text: <>
          <b>{l.weather}</b>
          {l.att && <> <Tag tone="blue">打卡 {l.att}</Tag></>}
          <div style={{ marginTop: 4 }}>{l.text}</div>
          <div className="nc-cell-sub" style={{ marginTop: 4 }}>
            <Ico n="paperclip" size={14} /> 现场照片 {l.photos} 张（水印 + GPS）
            {l.att && <> · <button className="nc-id-cell is-link" style={{ font: 'inherit' }} onClick={() => C.go('attendance')}>查看打卡定位与照片</button></>}
          </div>
        </>,
      }))} />
    </PjSection>
  );
}

/** 现场投入：人工 / 机械两段的当日在场情况（成本金额归成本域，此处只看在场与投入） */
function SiteInput({ C }: { C: PjCtx }) {
  return (
    <PjSection
      title={<><Ico n="user" size={16} /> 现场投入</>}
      extra={<span className="nc-cell-sub">人工 {C.laborRows.length} 人{ C.feature.machine ? ` · 机械 ${C.machRows.length} 项台班` : ''}{ C.feature.material ? ` · 材料设备 ${C.matRows.length} 项领用` : ''}</span>}
    >
      <div className={C.feature.machine ? 'nc-2col' : ''}>
        <Card hd={<span>在场人员 <span className="nc-cell-sub">按工种</span></span>}>
          {C.laborRows.length === 0
            ? <div className="nc-empty">本项目暂无人工投入记录。</div>
            : (
              <table className="nc-tbl">
                <thead><tr>
                  <th>姓名</th><th style={{ width: 110 }}>工种</th>
                  <th style={{ width: 130 }}>班组</th><th style={{ width: 100 }} className="is-num">在场天数</th>
                  <th style={{ width: 100 }}>状态</th>
                </tr></thead>
                <tbody>
                  {C.laborRows.map((w) => (
                    <tr key={w.id}>
                      <td><b>{w.name}</b></td>
                      <td>{w.trade}</td>
                      <td>{w.team}</td>
                      <td className="is-num num">{w.days}</td>
                      <td><Tag tone={w.days > 0 ? 'green' : 'gray'}>{w.days > 0 ? '在场' : '已退场'}</Tag></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </Card>
        {C.feature.machine && (
          <Card hd={<span>机械进场计划 <span className="nc-cell-sub">台班</span></span>}>
            {C.machRows.length === 0
              ? <div className="nc-empty">本项目暂无机械投入记录。</div>
              : (
                <table className="nc-tbl">
                <thead><tr>
                  <th>机械名称</th><th style={{ width: 90 }} className="is-num">台班数</th>
                  <th style={{ width: 110 }}>进场日期</th><th style={{ width: 100 }}>状态</th>
                </tr></thead>
                <tbody>
                  {C.machRows.map((m) => {
                    const inSite = m.date !== '—' && m.date <= TODAY;
                    return (
                      <tr key={m.name}>
                        <td><b>{m.name}</b></td>
                        <td className="is-num num">{m.qty}</td>
                        <td className="num">{m.date}</td>
                        <td><Tag tone={inSite ? 'green' : 'gray'}>{inSite ? '已进场' : '计划中'}</Tag></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              )}
          </Card>
        )}
      </div>
    </PjSection>
  );
}

export default function ExecSub({ C }: { C: PjCtx }) {
  return (
    <>
      <Milestones C={C} />
      <GateAndFiles C={C} />
      <WorkItems C={C} />
      <SiteLogs C={C} />
      <SiteInput C={C} />
    </>
  );
}
