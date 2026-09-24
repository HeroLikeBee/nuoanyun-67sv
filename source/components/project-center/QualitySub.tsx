// 项目详情 · 质量安全子页
//
// 回答「质量怎么控住、验收走到哪一步、现场安不安全」。
// 质量闭环：报验缺件硬拦截 → 隐蔽签认 → 第三方检测 → 验收整改多轮 → 备案归档；
// HSE 安全检查（临时用电 / 高处作业 / 动火 / 消防通道）同属现场管控，并入本页。
//
// ⚠️ 数据来源：全部经 PjCtx（buildPjDemo 按本项目派生），不持有跨项目常量。
import React, { useSyncExternalStore } from 'react';
import { Banner, Btn, Card, IdCell, Steps, Tag, Tip } from '../ui';
import { Ico } from '../icons';
import { ACCEPT_FLOW, ID_MARK_FLOWS, fmtMark, idMarkFlowsOfProj, idMarkVersion, itemByCode, subscribeIdMark } from '../data';
import { PjSection } from './PjSection';
import type { PjCtx } from './ctx';

/**
 * 消防产品身份标识流向（A / B 签）—— 竣工报验的 B 签清单就来自这里。
 * 数据来源是物料域「领用回写」的同一份 ID_MARK_FLOWS（跨页共享，不另建一套项目侧台账）。
 */
function IdMarkFlow({ C }: { C: PjCtx }) {
  useSyncExternalStore(subscribeIdMark, idMarkVersion, idMarkVersion);
  const { P } = C;
  const rows = idMarkFlowsOfProj(P.id);
  const installed = rows.filter((f) => f.status !== '已领未装');
  const pending = rows.filter((f) => f.status === '已领未装');
  /* 检测 / 平台类项目不安装带身份标识的产品，整段不适用；
     施工 / 维保类暂未回写时给空态，而不是整块消失让人以为功能没做。 */
  if (rows.length === 0) {
    if (P.biz === 'JC' || P.biz === 'RJ') return null;
    return (
      <PjSection
        title={<><Ico n="file" size={16} /> 身份标识流向（A / B 签）</>}
        extra={<Tip w={420} text="强制认证产品入库时按起止号段采录，领用到本项目的部位后流向自动回写至此；尚未回写时本表为空。" />}
      >
        <div className="nc-empty">本项目暂无身份标识流向记录。</div>
      </PjSection>
    );
  }
  return (
    <PjSection
      title={<><Ico n="file" size={16} /> 身份标识流向（A / B 签）</>}
      extra={<>
        <span className="nc-cell-sub">{rows.length} 段 · 已装 {installed.length} · 未装 {pending.length}</span>
        <Tip w={420} text="A 签贴于产品本体（防转移、撕开即碎），B 签随货由本系统按号段生成报验清单。竣工验收要求「实物 A 签完整 + 资料 B 签齐全 + 流向单位与采购单位一致」，缺一即判不合格。" />
        <Btn size="sm" onClick={() => C.toast(`已导出 B 签清单 ${installed.length} 段（含号段 / 部位 / 厂家），可直接组卷进竣工资料`)}>导出 B 签清单</Btn>
      </>}
    >
      <table className="nc-tbl" style={{ minWidth: 900 }}>
        <thead><tr>
          <th style={{ width: 150 }}>物料</th><th style={{ width: 240 }}>号段（14 位明码）</th>
          <th style={{ width: 70, textAlign: 'right' }}>数量</th><th>安装部位 / 点位</th>
          <th style={{ width: 110 }}>回写日期</th><th style={{ width: 90 }}>状态</th>
        </tr></thead>
        <tbody>
          {rows.map((f) => {
            const m = itemByCode(f.code);
            return (
              <tr key={f.id} className={f.status === '已领未装' ? 'is-warn-row' : ''}>
                <td>{m?.name || f.code} <span className="nc-tiny nc-muted">{m?.spec}</span></td>
                <td className="num nc-tiny">{fmtMark(f.from)} ~ {fmtMark(f.to)}</td>
                <td className="is-num num">{f.qty}</td>
                <td className="nc-tiny">{f.part}</td>
                <td className="num">{f.date}</td>
                <td><Tag tone={f.status === '已报验' ? 'green' : f.status === '已安装' ? 'blue' : 'orange'}>{f.status}</Tag></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {pending.length > 0 && (
        <div className="nc-gate-block">
          <Ico n="warning" size={14} />
          有 {pending.length} 段已领未装，B 签清单以「已安装 / 已报验」为准 —— 安装确认后由施工员在物料域回写状态，未装段不计入竣工报验资料。
        </div>
      )}
    </PjSection>
  );
}

/** 材料进场报验：系统按材料主数据的「进场报验要求」自动校验附件，缺件硬拦截 */
function Arrival({ C }: { C: PjCtx }) {
  const lack = C.arrivals.filter((a) => a.have.length < a.need.length);
  if (C.arrivals.length === 0) {
    return (
      <PjSection title={<><Ico n="check" size={16} /> {C.scene.arrivalTitle}</>}
        extra={<Btn size="sm" kind="primary" onClick={() => C.openM('upload')}>＋ 新增报验</Btn>}>
        <div className="nc-empty">{C.scene.arrivalEmpty}</div>
      </PjSection>
    );
  }
  return (
    <PjSection
      title={<><Ico n="check" size={16} /> {C.scene.arrivalTitle}</>}
      extra={<>
        <span className="nc-cell-sub">{C.arrivals.length} 批 · 缺件退回 {lack.length} 批</span>
        <Tip w={400} text="系统按材料主数据自动校验收货附件（合格证 / 检测报告 / 3C 证书），属强制性认证目录的产品还会校验「B 签清单」；缺件硬拦截，不允许先用于施工后补件。" />
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
          {C.arrivals.map((a) => {
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

/**
 * 隐蔽工程验收：法定节点，签认后不可逆。
 * 维保 / 检测 / 平台项目不存在隐蔽工程 —— 直接不渲染本区块，避免打开就是一张「不适用」空卡。
 */
function HiddenWorks({ C }: { C: PjCtx }) {
  if (C.hidden.length === 0) return null;
  return (
    <PjSection
      title={<><Ico n="check" size={16} /> {C.scene.hiddenTitle}</>}
      extra={<>
        <span className="nc-cell-sub">{C.scene.hiddenSub(C.hidden.length)}</span>
        <Tip w={360} text="隐蔽工程验收是法定节点：签认后覆土 / 封板即不可复验，故删除须二次确认，记录须附影像留档。" />
      </>}
    >
      <table className="nc-tbl" style={{ minWidth: 820 }}>
        <thead><tr>
          <th style={{ width: 230 }}>部位</th><th style={{ width: 110 }}>验收日期</th>
          <th>验收内容</th><th style={{ width: 90 }}>影像</th><th style={{ width: 160 }}>签认</th>
        </tr></thead>
        <tbody>
          {C.hidden.map((h) => (
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

function Acceptance({ C }: { C: PjCtx }) {
  const cur = Math.max(0, ACCEPT_FLOW.indexOf((C.P.acceptStatus ?? '未申报') as typeof ACCEPT_FLOW[number]));
  const inAccept = ['已申报', '整改中', '已通过', '已备案'].includes(C.P.acceptStatus ?? '');
  const openItems = C.rectifyRounds.reduce((s, r) => s + r.items.filter((i) => !i.done).length, 0);
  const firstRound = C.rectifyRounds.find((r) => r.items.some((i) => !i.done));

  return (
    <PjSection
      title={<><Ico n="trophy" size={16} /> 检测与消防验收</>}
      extra={<Tip w={420} text="验收状态机：未申报 → 已申报 → 整改中（可多轮，每轮记录整改项与复验日）→ 已通过 → 已备案。整改轮次不设上限，历史轮次全部留痕。" />}
    >
      <Steps items={ACCEPT_FLOW.map((f) => ({ label: f }))} cur={cur} />
      <div className="nc-2col">
        <Card hd={C.scene.checkCard}>
          <div className="nc-gate">
            {[
              { n: C.scene.checkOrgLabel, v: C.checkInfo.org },
              { n: C.scene.checkNoLabel, v: C.checkInfo.no },
              { n: '检测日期', v: C.checkInfo.date },
              { n: '检测结论', v: C.checkInfo.res },
            ].map((r) => (
              <div key={r.n} className="nc-gate-row">
                <span className="nc-gate-n">{r.n}</span>
                <span className="is-num num">{r.v}</span>
                <span className="nc-gate-s" />
              </div>
            ))}
          </div>
          <div className="nc-cell-sub" style={{ marginTop: 8 }}>{C.checkInfo.note}</div>
          <div style={{ marginTop: 10 }}>
            <Btn disabled={!inAccept} title={inAccept ? undefined : '完工并完成自检后方可委托第三方检测'}
              onClick={() => C.openM('check')}>登记检测结果</Btn>
          </div>
        </Card>

        <Card hd="消防验收备案">
          <div className="nc-gate">
            {[
              { n: '申报状态', v: C.P.acceptStatus ?? '未申报' },
              { n: '申报日期', v: inAccept ? C.checkInfo.date : '—' },
              { n: '备案受理机关', v: inAccept ? '项目属地消防救援大队' : '—' },
              { n: '受理编号', v: inAccept ? `BA${C.P.end.slice(0, 4)}-${C.P.id.slice(-4)}` : '—' },
            ].map((r) => (
              <div key={r.n} className="nc-gate-row">
                <span className="nc-gate-n">{r.n}</span>
                <span className="is-num num">{r.v}</span>
                <span className="nc-gate-s" />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10 }}>
            <Btn disabled={cur < 3} title={cur < 3 ? '第三方检测合格后方可申报消防验收备案' : undefined}
              onClick={() => C.openM('accept')}>登记验收结论</Btn>
          </div>
        </Card>
      </div>

      <Card style={{ marginTop: 16 }} hd={<span>整改轮次记录</span>}
        extra={<span className="nc-cell-sub">
          {C.rectifyRounds.length === 0 ? '尚未进入验收流程'
            : `共 ${C.rectifyRounds.length} 轮 · 待整改 ${openItems} 项`}
        </span>}>
        {C.rectifyRounds.length === 0 ? (
          <div className="nc-empty">
            本项目当前验收状态为「{C.P.acceptStatus ?? '未申报'}」，尚无整改轮次。
            <div className="nc-cell-sub" style={{ marginTop: 6 }}>完成施工并自检合格后申报第三方检测，届时按轮次登记整改项与复验日期。</div>
          </div>
        ) : (
          <>
            {C.rectifyRounds.map((r) => {
              const doneN = r.items.filter((i) => i.done).length;
              const openN = r.items.length - doneN;
              return (
                <div key={r.round} style={{ marginBottom: 14 }}>
                  <div className="nc-ledhd">
                    <span style={{ marginRight: 8 }}>{r.round}</span>
                    <Tag tone={r.tone}>{r.state}</Tag>
                    <span style={{ marginLeft: 'auto' }} className="nc-cell-sub">
                      {r.items.length} 项 · 已闭环 {doneN}{openN > 0 && ` · 待整改 ${openN}`}
                    </span>
                  </div>
                  <table className="nc-tbl" style={{ minWidth: 760 }}>
                    <thead><tr>
                      <th>整改项</th><th style={{ width: 150 }}>部位</th>
                      <th style={{ width: 110 }}>检查日期</th><th style={{ width: 110 }}>复验日期</th>
                      <th style={{ width: 100 }}>责任人</th><th style={{ width: 100 }}>闭环</th>
                    </tr></thead>
                    <tbody>
                      {r.items.map((i) => (
                        <tr key={i.n}>
                          <td>{i.n}</td>
                          <td className="nc-cell-sub">{i.pos}</td>
                          <td className="num">{r.check}</td>
                          <td className="num">{r.recheck}</td>
                          <td>{r.owner}</td>
                          <td><Tag tone={i.done ? 'green' : 'orange'}>{i.done ? '已闭环' : '待整改'}</Tag></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
            {firstRound && (
              <div className="nc-cell-sub" style={{ marginTop: 8 }}>
                {firstRound.round}仍有 {firstRound.items.filter((i) => !i.done).length} 项待整改 ——
                全部闭环后方可提交复验；复验合格后申报消防验收备案。
              </div>
            )}
          </>
        )}
      </Card>
    </PjSection>
  );
}

/** 现场安全检查（HSE）：临时用电 / 高处作业 / 动火 / 消防通道，安全员周检留痕，整改后复检闭环 */
function Safety({ C }: { C: PjCtx }) {
  const bad = C.safeRows.filter((s) => s.res !== '合格');
  if (C.safeRows.length === 0) {
    return (
      <PjSection title={<><Ico n="shield" size={16} /> 现场安全检查（HSE）</>}>
        <div className="nc-empty">本项目暂无现场安全检查记录。</div>
      </PjSection>
    );
  }
  return (
    <PjSection
      title={<><Ico n="shield" size={16} /> 现场安全检查（HSE）</>}
      extra={<>
        <span className="nc-cell-sub">{C.safeRows.length} 次检查 · 需整改 {bad.length} 次</span>
        <Tip w={380} text="HSE 覆盖临时用电、高处作业、动火审批、消防通道占用等，由安全员按周巡检并留痕；整改后须复检合格方可闭环。" />
        <Btn size="sm" onClick={C.openLog}>操作记录全文</Btn>
      </>}
    >
      <table className="nc-tbl" style={{ minWidth: 700 }}>
        <thead><tr>
          <th>检查项</th><th style={{ width: 130 }}>结果</th>
          <th style={{ width: 100 }}>检查人</th><th style={{ width: 110 }}>检查日期</th>
        </tr></thead>
        <tbody>
          {C.safeRows.map((s) => (
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

export default function QualitySub({ C }: { C: PjCtx }) {
  return (
    <>
      {C.curMiss.length > 0 && (
        <Banner tone="warn" actions={<Btn size="sm" onClick={() => C.openM('upload')}>补齐资料</Btn>}>
          当前节点「{C.curMile?.name}」资料不齐：缺 {C.curMiss.join('、')} —— 节点确认需资料齐备，缺件将在履约与质量安全页同时计为待办。
        </Banner>
      )}
      <Arrival C={C} />
      <IdMarkFlow C={C} />
      <HiddenWorks C={C} />
      <Acceptance C={C} />
      <Safety C={C} />
    </>
  );
}
