// 项目详情 · 质量验收子页
//
// 回答「质量怎么控住」。
// 质量闭环：材料 / 配件进场报验（缺件硬拦截）→ 隐蔽签认。
//
// 归位说明（2026-09-29 去重后）:
// - 「检测与消防验收」+「现场安全检查 HSE」+「身份标识流向」由本页**迁出**到现场作业专页
//   （ExecSub = WB 巡检维保执行 / JC 检测作业与报告）—— 区块实现统一在 Sections.tsx，
//   本页不再重复，避免「一个区块两个家」。
// - 本页只保留「质量怎么控」：进场报验 + 隐蔽工程验收。
// - 检测（JC）项目无进场报验 / 隐蔽工程，本页在 JC 下无内容（页签会显示空，属正常）。
//
// ⚠️ 数据来源：全部经 PjCtx（buildPjDemo 按本项目派生），不持有跨项目常量。
import React from 'react';
import { Btn, IdCell, Tag, Tip } from '../ui';
import { Ico } from '../icons';
import { PjSection } from './PjSection';
import type { PjCtx } from './ctx';

/** 材料 / 配件进场报验：系统按物料主数据的「进场报验要求」自动校验附件，缺件硬拦截 */
function Arrival({ C }: { C: PjCtx }) {
  /* 检测项目不发生材料 / 设备进场报验（检测对象是甲方既有的消防设施），
     整段不渲染 —— 连「仪器仪表进场」空态都不显示，避免检测作业页出现无关空卡。 */
  if (C.P.biz === 'JC') return null;
  const lack = C.arrivals.filter((a) => a.have.length < a.need.length);
  if (C.arrivals.length === 0) {
    return (
      <PjSection title={<>{C.scene.arrivalTitle}</>}
        extra={<Btn size="sm" kind="primary" onClick={() => C.openM('upload')}>＋ 新增报验</Btn>}>
        <div className="nc-empty">{C.scene.arrivalEmpty}</div>
      </PjSection>
    );
  }
  return (
    <PjSection
      title={<>{C.scene.arrivalTitle}</>}
      extra={<>
        <span className="nc-cell-sub">{C.arrivals.length} 批 · 缺件退回 {lack.length} 批</span>
        <Tip w={400} text="系统按物料主数据自动校验收货附件（合格证 / 检测报告 / 3C 证书），属强制性认证目录的产品还会校验「B 签清单」；缺件硬拦截，不允许先用于施工后补件。" />
        <Btn size="sm" kind="primary" onClick={() => C.openM('upload')}>＋ 新增报验</Btn>
      </>}
    >
      <table className="nc-tbl" style={{ minWidth: 960 }}>
        <thead><tr>
          <th style={{ width: 130 }}>报验单号</th><th style={{ width: 90 }}>批次</th>
          <th style={{ width: 110 }} className="is-num">进场日期</th><th>物料</th>
          <th style={{ width: 230 }}>报验要求核验</th><th style={{ width: 110 }}>监理签认</th>
          <th style={{ width: 110 }}>操作</th>
        </tr></thead>
        <tbody>
          {C.arrivals.map((a) => {
            const miss = a.need.filter((n) => !a.have.includes(n));
            return (
              <tr key={a.no} className={miss.length ? 'is-warn-row' : ''}>
                <td><IdCell>{a.no}</IdCell></td>
                <td>{a.batch}</td>
                <td className="is-num num">{a.date}</td>
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

/**
 * 隐蔽工程验收：法定节点，签认后不可逆。
 * 维保 / 检测 / 平台项目不存在隐蔽工程 —— 直接不渲染本区块，避免打开就是一张「不适用」空卡。
 */
function HiddenWorks({ C }: { C: PjCtx }) {
  if (C.hidden.length === 0) return null;
  return (
    <PjSection
      title={<>{C.scene.hiddenTitle}</>}
      extra={<>
        <span className="nc-cell-sub">{C.scene.hiddenSub(C.hidden.length)}</span>
        <Tip w={360} text="隐蔽工程验收是法定节点：签认后覆土 / 封板即不可复验，故删除须二次确认，记录须附影像留档。" />
      </>}
    >
      <table className="nc-tbl" style={{ minWidth: 820 }}>
        <thead><tr>
          <th style={{ width: 230 }}>部位</th><th style={{ width: 110 }} className="is-num">验收日期</th>
          <th>验收内容</th><th style={{ width: 90 }}>影像</th><th style={{ width: 160 }}>签认</th>
        </tr></thead>
        <tbody>
          {C.hidden.map((h) => (
            <tr key={h.part}>
              <td><b>{h.part}</b></td>
              <td className="is-num num">{h.date}</td>
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

export default function QualitySub({ C }: { C: PjCtx }) {
  /* 本页只承载「进场报验 + 隐蔽工程」。检测类项目二者皆无（检测对象是甲方既有设施，
     不发生我方材料进场，也无封闭部位隐蔽），此时给一句明确空态，避免打开是整片空白。 */
  const hasContent = C.arrivals.length > 0 || C.hidden.length > 0;
  if (!hasContent) {
    return (
      <PjSection title={<>质量验收</>}>
        <div className="nc-empty">
          本项目不涉及材料 / 设备进场报验与隐蔽工程验收，本页无内容；
          检测结论与整改验收见「{C.P.biz === 'JC' ? '检测作业与报告' : '巡检维保执行'}」。
        </div>
      </PjSection>
    );
  }
  return (
    <>
      <Arrival C={C} />
      <HiddenWorks C={C} />
    </>
  );
}
