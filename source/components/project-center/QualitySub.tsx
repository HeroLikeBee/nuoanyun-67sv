// 项目详情 · 质量验收子页
//
// 回答「质量怎么控住的、验收走到哪一步」。
// 闭环要点：报验缺件硬拦截 → 隐蔽工程签认 → 第三方检测 → 验收整改多轮 → 备案归档。
// 本页不重复概览页的进度百分比，只承接质量事件与准入状态。
import React, { useState } from 'react';
import { Banner, Btn, Card, Code, IdCell, Steps, Tag, Tip } from '../ui';
import { Ico } from '../icons';
import { PjSection } from './PjSection';
import type { PjCtx } from './ctx';

/* 报验批次：系统按材料「进场报验要求」自动校验附件，缺件硬拦截 */
const ARRIVALS = [
  { no: 'JCBY000012', batch: '第 3 批', date: '2026-10-04', items: '镀锌钢管 DN100 × 1860m、沟槽卡箍 × 640 只', need: ['合格证', '检测报告'], have: ['合格证', '检测报告'], sign: '已签认' },
  { no: 'JCBY000011', batch: '第 2 批', date: '2026-09-26', items: '点型感烟探测器 × 420 只、输入输出模块 × 260 只', need: ['合格证', '3C 证书'], have: ['合格证'], sign: '缺件退回' },
  { no: 'JCBY000010', batch: '第 1 批', date: '2026-09-23', items: '消火栓箱 × 34 套、防火阀 × 28 只', need: ['合格证', '3C 证书', '检测报告'], have: ['合格证', '3C 证书', '检测报告'], sign: '已签认' },
];
const HIDDEN = [
  { part: '一区 · 喷淋支管隐蔽', date: '2026-09-30', content: '支管标高、坡度、支架间距、防腐处理经监理验收合格', photos: 8, sign: '何监理（已签认）' },
  { part: '二区 · 报警总线穿管隐蔽', date: '2026-10-08', content: '线管保护、防火封堵、跨接线连接经验收合格', photos: 6, sign: '何监理（已签认）' },
];
const SAFE_ROWS = [
  { item: '临时用电箱接地检查', res: '合格', by: '陈工', date: '2026-09-22' },
  { item: '高处作业安全带佩戴', res: '合格', by: '陈工', date: '2026-09-24' },
  { item: '动火作业审批与看护', res: '整改后合格', by: '陈工', date: '2026-09-26' },
  { item: '消防通道占用排查', res: '合格', by: '张工', date: '2026-09-28' },
  { item: '焊接作业区灭火器配置', res: '合格', by: '陈工', date: '2026-10-02' },
];
/** 验收状态机：未申报 → 已申报 → 整改中（可多轮）→ 已通过 → 已备案 */
const ACCEPT_FLOW = ['未申报', '已申报', '整改中', '已通过', '已备案'];
/** 检测报告与验收结论的占位信息（本项目尚未完工，故为空壳直到申报） */
const CHECK_INFO = {
  org: '云南××消防检测有限公司', no: 'JC2027-0219', date: '—', res: '—',
  note: '完工（M6 系统调试完成）后由项目经理发起委托，报告归档至「文档 · 验收」分类。',
};

function Arrival({ C }: { C: PjCtx }) {
  const lack = ARRIVALS.filter((a) => a.have.length < a.need.length);
  return (
    <PjSection
      title={<><Ico n="check" size={16} /> 材料进场报验</>}
      extra={<>
        <span className="nc-cell-sub">{ARRIVALS.length} 批 · 缺件退回 {lack.length} 批</span>
        <Tip w={400} text="系统按材料主数据的「进场报验要求」（合格证 / 3C 证书 / 检测报告）自动校验附件，缺件硬拦截，不允许先用于施工后补件。" />
        <Btn size="sm" kind="primary" onClick={() => C.openM('upload')}>＋ 新增报验</Btn>
      </>}
    >
      <table className="nc-tbl" style={{ minWidth: 960 }}>
        <thead><tr>
          <th style={{ width: 130 }}>报验单号</th><th style={{ width: 90 }}>批次</th>
          <th style={{ width: 110 }}>进场日期</th><th>材料 / 设备</th>
          <th style={{ width: 230 }}>报验要求核验</th><th style={{ width: 110 }}>监理签认</th>
          <th style={{ width: 110 }}>操作</th>
        </tr></thead>
        <tbody>
          {ARRIVALS.map((a) => {
            const miss = a.need.filter((n) => !a.have.includes(n));
            return (
              <tr key={a.no} className={miss.length ? 'is-warn-row' : ''}>
                <td><IdCell>{a.no}</IdCell></td>
                <td>{a.batch}</td>
                <td className="num">{a.date}</td>
                <td>{a.items}</td>
                <td>
                  {a.need.map((n) => (
                    <Tag key={n} tone={a.have.includes(n) ? 'green' : 'red'}>{a.have.includes(n) ? '✓ ' : '✗ '}{n}</Tag>
                  ))}
                </td>
                <td><Tag tone={a.sign === '已签认' ? 'green' : 'red'}>{a.sign}</Tag></td>
                <td>{miss.length ? <Btn size="sm" onClick={() => C.openM('upload')}>补传缺件</Btn> : <span className="nc-cell-sub">—</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {lack.length > 0 && (
        <div className="nc-gate-block">
          <Ico n="warning" size={14} />
          {lack[0].no} 缺 {lack[0].need.filter((n) => !lack[0].have.includes(n)).join('、')}，已退回不得投入使用 —— 补齐附件后由监理重新签认。
        </div>
      )}
    </PjSection>
  );
}

function HiddenWorks({ C }: { C: PjCtx }) {
  return (
    <PjSection
      title={<><Ico n="check" size={16} /> 隐蔽工程验收</>}
      extra={<span className="nc-cell-sub">{HIDDEN.length} 项 · 均经监理签认</span>}
    >
      <table className="nc-tbl" style={{ minWidth: 820 }}>
        <thead><tr>
          <th style={{ width: 230 }}>部位</th><th style={{ width: 110 }}>验收日期</th>
          <th>验收内容</th><th style={{ width: 90 }}>影像</th><th style={{ width: 160 }}>签认</th>
        </tr></thead>
        <tbody>
          {HIDDEN.map((h) => (
            <tr key={h.part}>
              <td><b>{h.part}</b></td>
              <td className="num">{h.date}</td>
              <td className="nc-cell-sub">{h.content}</td>
              <td className="num">{h.photos} 张</td>
              <td><Tag tone="green">{h.sign}</Tag></td>
            </tr>
          ))}
        </tbody>
      </table>
    </PjSection>
  );
}

function Safety({ C }: { C: PjCtx }) {
  const bad = SAFE_ROWS.filter((s) => s.res !== '合格');
  return (
    <PjSection
      title={<><Ico n="check" size={16} /> 安全检查</>}
      extra={<span className="nc-cell-sub">{SAFE_ROWS.length} 次检查 · 整改后合格 {bad.length} 次</span>}
    >
      <table className="nc-tbl" style={{ minWidth: 700 }}>
        <thead><tr>
          <th>检查项</th><th style={{ width: 130 }}>结果</th>
          <th style={{ width: 100 }}>检查人</th><th style={{ width: 110 }}>检查日期</th>
        </tr></thead>
        <tbody>
          {SAFE_ROWS.map((s) => (
            <tr key={s.item}>
              <td>{s.item}</td>
              <td><Tag tone={s.res === '合格' ? 'green' : 'orange'}>{s.res}</Tag></td>
              <td>{s.by}</td>
              <td className="num">{s.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </PjSection>
  );
}

function Acceptance({ C }: { C: PjCtx }) {
  const cur = Math.max(0, ACCEPT_FLOW.indexOf(C.P.acceptStatus ?? '未申报'));
  return (
    <PjSection
      title={<><Ico n="trophy" size={16} /> 检测与消防验收</>}
      extra={<Tip w={420} text="验收状态机：未申报 → 已申报 → 整改中（可多轮，每轮记录整改项与复验日）→ 已通过 → 已备案。整改轮次不设上限，历史轮次全部留痕。" />}
    >
      <Steps items={ACCEPT_FLOW.map((f) => ({ label: f }))} cur={cur} />
      <div className="nc-2col">
        <Card hd="第三方消防检测">
          <div className="nc-gate">
            {[
              { n: '检测机构', v: CHECK_INFO.org },
              { n: '委托单号', v: CHECK_INFO.no },
              { n: '检测日期', v: CHECK_INFO.date },
              { n: '检测结论', v: CHECK_INFO.res },
            ].map((r) => (
              <div key={r.n} className="nc-gate-row">
                <span className="nc-gate-n">{r.n}</span>
                <span className="is-num num">{r.v}</span>
                <span className="nc-gate-s" />
              </div>
            ))}
          </div>
          <div className="nc-cell-sub" style={{ marginTop: 8 }}>{CHECK_INFO.note}</div>
          <div style={{ marginTop: 10 }}>
            <Btn onClick={() => C.openM('check')}>登记检测结果</Btn>
          </div>
        </Card>

        <Card hd="消防验收备案">
          <div className="nc-gate">
            {[
              { n: '申报状态', v: C.P.acceptStatus ?? '未申报' },
              { n: '申报日期', v: C.P.acceptStatus ? '2026-09-16' : '—' },
              { n: '备案受理机关', v: '昆明市西山区消防救援大队' },
              { n: '受理编号', v: C.P.acceptStatus ? 'BA2026-0916' : '—' },
            ].map((r) => (
              <div key={r.n} className="nc-gate-row">
                <span className="nc-gate-n">{r.n}</span>
                <span className="is-num num">{r.v}</span>
                <span className="nc-gate-s" />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10 }}>
            <Btn onClick={() => C.openM('accept')}>登记验收结论</Btn>
          </div>
        </Card>
      </div>

      <Card style={{ marginTop: 16 }} hd={<span>整改轮次记录</span>}
        extra={<span className="nc-cell-sub">整改项须逐条闭环后方可复验</span>}>
        <table className="nc-tbl" style={{ minWidth: 760 }}>
          <thead><tr>
            <th style={{ width: 80 }}>轮次</th><th style={{ width: 120 }}>检查日期</th>
            <th>整改项（数量 / 摘要）</th><th style={{ width: 130 }}>复验日期</th><th style={{ width: 120 }}>责任人</th>
          </tr></thead>
          <tbody>
            <tr>
              <td>第 1 轮</td>
              <td className="num">—</td>
              <td className="nc-cell-sub">—</td>
              <td className="num">—</td>
              <td>—</td>
            </tr>
          </tbody>
        </table>
        <div className="nc-cell-sub" style={{ marginTop: 8 }}>
          当前 {C.P.acceptStatus ? `已申报（${C.P.acceptStatus}）` : '尚未申报'} —— 完工并通过自检后申报第三方检测，检测合格方可申报消防验收备案。
        </div>
      </Card>
    </PjSection>
  );
}

export default function QualitySub({ C }: { C: PjCtx }) {
  return (
    <>
      {C.curMiss.length > 0 && (
        <Banner tone="warn" actions={<Btn size="sm" onClick={() => C.openM('upload')}>补齐资料</Btn>}>
          当前节点「{C.curMile?.name}」资料不齐：缺 {C.curMiss.join('、')} —— 节点确认需资料齐备，缺件将在资料域与验收域同时计为待办。
        </Banner>
      )}
      <Arrival C={C} />
      <HiddenWorks C={C} />
      <Safety C={C} />
      <Acceptance C={C} />
    </>
  );
}
