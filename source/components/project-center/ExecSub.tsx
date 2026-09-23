// 项目详情 · 执行履约子页
//
// 回答「工期走到哪了、现场在干什么、投入够不够」。
// 闭环要点：每个里程碑节点挂「准入资料 + 实际操作」，节点确认后自动推状态；
// 进度断点可下钻到负责该节点的责任人。
// 本页不重复概览页的百分比口径，只承接节点、日志、打卡与投入曲线。
import React, { useState } from 'react';
import { Btn, Card, Code, IdCell, Progress, Tag, Timeline, Tip } from '../ui';
import { Ico } from '../icons';
import { ATT_WORKERS, TODAY, MILESTONE_LEGAL, attDays } from '../data';
import { PjSection } from './PjSection';
import type { PjCtx } from './ctx';

const MILE_ST_TONE: Record<string, 'green' | 'blue' | 'gray' | 'red'> = {
  已完成: 'green', 进行中: 'blue', 待开始: 'gray', 逾期: 'red',
};
const SITE_LOGS = [
  { date: '2026-10-06', weather: '晴 18~26℃', text: '三区喷淋支管安装 68 根，当区完成 72%；隐蔽验收记录（三区）已上传归档。', photos: 6, att: 'AT20261006012' },
  { date: '2026-10-05', weather: '多云 17~24℃', text: '二区报警总线敷设 320m；第二批材料进场报验单经监理签认。', photos: 4, att: 'AT20261005009' },
  { date: '2026-10-03', weather: '小雨 15~21℃', text: '雨天停止室外作业，转为消控室主机接线与回路测试。', photos: 3, att: 'AT20261003005' },
  { date: '2026-09-30', weather: '晴 19~28℃', text: '一区管线安装完成并通过隐蔽验收，监理签认 3 份。', photos: 8, att: 'AT20260930021' },
];
const WORK_ITEMS = [
  { name: '喷头安装', totalQty: 100, doneQty: 80, unitPrice: 1000, unit: '个' },
  { name: '镀锌钢管敷设', totalQty: 1000, doneQty: 600, unitPrice: 100, unit: '米' },
  { name: '报警探测器安装', totalQty: 200, doneQty: 140, unitPrice: 500, unit: '只' },
  { name: '防排烟风管制作', totalQty: 500, doneQty: 350, unitPrice: 200, unit: '㎡' },
];

/** 里程碑节点表：计划 / 实际 / 状态 / 责任人 + 准入资料齐备标志（唯一可确认动作在节点行内） */
function Milestones({ C }: { C: PjCtx }) {
  const mileOf = (n: string) => C.mileRows.find((m) => m.n === n);
  const curKey = C.curMile?.name.slice(0, 2) ?? '';
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
            const key = r.n.slice(0, 2);
            const g = C.attach.find((a) => a.mile.startsWith(key));
            const miss = g ? g.req.filter((x) => !g.files.some((f) => f.name.includes(x.slice(0, 4)))) : [];
            const isCur = key === curKey;
            const over = r.st !== '已完成' && r.plan < TODAY;
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
          当前节点「{C.curMile.name}」缺 {C.curMiss.join('、')} —— 缺件硬拦截：确认按钮置灰，须先补齐资料。
          <span style={{ marginLeft: 'auto' }}><Btn size="sm" onClick={() => C.pj('members')}>去补资料</Btn></span>
        </div>
      )}
    </PjSection>
  );
}

/** 工程量完成情况：可下钻到工序填报 */
function WorkItems({ C }: { C: PjCtx }) {
  const [rows, setRows] = useState(WORK_ITEMS);
  const pct = rows.reduce((s, r) => s + r.doneQty, 0) / Math.max(1, rows.reduce((s, r) => s + r.totalQty, 0)) * 100;
  return (
    <PjSection
      title={<><Ico n="chart" size={16} /> 工程量完成情况</>}
      extra={<>
        <span className="nc-cell-sub">综合完成率 {pct.toFixed(1)}%（按数量加权）</span>
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
            const p = (r.doneQty / r.totalQty) * 100;
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
                  <Btn size="sm" onClick={() => {
                    const v = window.prompt(`填报「${r.name}」完成量（0-${r.totalQty}）`, String(r.doneQty));
                    if (v === null) return;
                    const q = Math.min(r.totalQty, Math.max(0, Number(v) || 0));
                    setRows((s) => s.map((x, k) => (k === i ? { ...x, doneQty: q } : x)));
                    C.toast(`「${r.name}」完成量已更新为 ${q} ${r.unit}`);
                  }}>填报</Btn>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </PjSection>
  );
}

/** 施工日志：可关联打卡记录 */
function SiteLogs({ C }: { C: PjCtx }) {
  return (
    <PjSection
      title={<><Ico n="file" size={16} /> 施工日志</>}
      extra={<>
        <span className="nc-cell-sub">可关联移动端打卡（含定位与照片），本平台只读消费</span>
        <Btn size="sm" kind="primary" onClick={() => C.openM('log')}>＋ 写日志</Btn>
      </>}
    >
      <Timeline items={SITE_LOGS.map((l) => ({
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

/** 现场投入：人工 / 机械 / 材料三段的当日在场情况（成本金额归成本域，此处只看在场与投入） */
function SiteInput({ C }: { C: PjCtx }) {
  const workers = ATT_WORKERS.filter((w) => w.proj === C.P.id);
  const list = workers.length ? workers : ATT_WORKERS.slice(0, 4);
  return (
    <PjSection
      title={<><Ico n="user" size={16} /> 现场投入</>}
      extra={<span className="nc-cell-sub">人工 {list.length} 人 · 机械 {C.machRows.length} 台班计划 · 材料设备 {C.matRows.length} 项领用</span>}
    >
      <div className="nc-2col">
        <Card hd={<span>在场人员 <span className="nc-cell-sub">按工种</span></span>}>
          <table className="nc-tbl">
            <thead><tr>
              <th>姓名</th><th style={{ width: 110 }}>工种</th>
              <th style={{ width: 130 }}>班组</th><th style={{ width: 100 }} className="is-num">在场天数</th>
              <th style={{ width: 100 }}>状态</th>
            </tr></thead>
            <tbody>
              {list.map((w) => (
                <tr key={w.id}>
                  <td><b>{w.name}</b></td>
                  <td>{w.trade}</td>
                  <td>{w.team}</td>
                  <td className="is-num num">{attDays(w, 21)}</td>
                  <td><Tag tone="green">在场</Tag></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card hd={<span>机械进场计划 <span className="nc-cell-sub">台班</span></span>}>
          <table className="nc-tbl">
            <thead><tr>
              <th>机械名称</th><th style={{ width: 90 }} className="is-num">台班数</th>
              <th style={{ width: 110 }}>进场日期</th><th style={{ width: 100 }}>状态</th>
            </tr></thead>
            <tbody>
              {C.machRows.map((m, i) => (
                <tr key={m.name}>
                  <td><b>{m.name}</b></td>
                  <td className="is-num num">{m.qty}</td>
                  <td className="num">{m.date}</td>
                  <td><Tag tone={i < 2 ? 'green' : 'gray'}>{i < 2 ? '已进场' : '计划中'}</Tag></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      <Card style={{ marginTop: 16 }} hd="现场照片墙"
        extra={<span className="nc-cell-sub">水印 + GPS · 由移动端上传</span>}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}>
          {['管线安装夜间作业', '喷淋头排布', '报警探测器接线', '风管吊装', '隐蔽验收签认', '现场安全交底', '材料进场验收', '消控室接线'].map((t) => (
            <div key={t} style={{ height: 96, borderRadius: 8, background: 'linear-gradient(135deg,#c9d6e8,#9db4d4)', display: 'flex', alignItems: 'flex-end', padding: 8, color: '#243b63', fontSize: 12 }}>
              {t}
            </div>
          ))}
        </div>
      </Card>
    </PjSection>
  );
}

/** 状态流转痕迹（操作记录抽屉的入口在本页也留一个） */
function StatusTrace({ C }: { C: PjCtx }) {
  return (
    <PjSection
      title={<><Ico n="clock" size={16} /> 状态流转</>}
      extra={<Btn size="sm" onClick={C.openLog}>操作记录全文</Btn>}
    >
      <div className="nc-gate">
        {[
          { t: '2026-09-12', n: '创建项目（待启动）', d: '来源：合同立项 · 合同交底已确认', tag: '手动' },
          { t: '2026-09-18', n: '立项审批通过（待启动 → 执行中）', d: '触发：终审通过 · 里程碑轴启用', tag: '自动' },
          { t: '2026-09-20', n: 'M1 进场准备完成', d: '操作人：张工 · 已上传开工报告', tag: '手动' },
          { t: '2026-09-22', n: 'M2 进场施工完成', d: '操作人：张工 · 关联打卡 12 人次', tag: '手动' },
        ].map((r) => (
          <div key={r.t + r.n} className="nc-gate-row">
            <span className="nc-gate-n">
              <b>{r.n}</b>
              <div className="nc-cell-sub">{r.d} · {r.t}</div>
            </span>
            <span className="nc-gate-s"><Tag tone={r.tag === '自动' ? 'blue' : 'gray'}>{r.tag}</Tag></span>
          </div>
        ))}
        <div className="nc-gate-row">
          <span className="nc-gate-n">
            <b>执行中 · 施工阶段（当前）</b>
            <div className="nc-cell-sub">{C.curMile ? `${C.curMile.name} 进行中` : '里程碑节点已全部完成'} · {TODAY}</div>
          </span>
          <span className="nc-gate-s"><Tag tone="orange">进行中</Tag></span>
        </div>
      </div>
    </PjSection>
  );
}

export default function ExecSub({ C }: { C: PjCtx }) {
  return (
    <>
      <Milestones C={C} />
      <WorkItems C={C} />
      <SiteLogs C={C} />
      <SiteInput C={C} />
      <StatusTrace C={C} />
    </>
  );
}
