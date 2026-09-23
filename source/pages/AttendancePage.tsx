// 考勤管理 —— 外包用工月度考勤矩阵 · 人工成本自动派生
// 口径：出勤天数 = Σ 符号值（√ 1 天 / 半 0.5 天 / 加 1.5 天 / 休·假·空 0）；人工成本 = 出勤天数 × 岗位单价
// 岗位单价唯一来源：LABOR_RATES（在「岗位单价」页维护，改动留痕）；考勤按「项目 + 班组」归属外包成本
import React, { useMemo, useState } from 'react';
import {
  Banner, Btn, Card, EntityLink, Field, KvGrid, Modal, Op, OpSep, PageHead, TableFoot,
  Tabs, Tag, Tip, WatermarkModal, useToast, Code,
} from '../components/ui';
import {
  ATT_MARKS, ATT_TEAMS, ATT_WORKERS, LABOR_RATES, PROJECTS, TODAY,
  attDays, canSeeMoney, fmt, type AttWorker,
} from '../components/data';
import { Ico } from '../components/icons';

/** 本月天数（2026-09） */
const MONTH_DAYS = 30;
/** 已过天数（截至 TODAY = 2026-09-20） */
const PASSED_DAYS = 20;

type Rate = { trade: string; rate: number };

export default function AttendancePage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  const money = canSeeMoney(role);
  const [tab, setTab] = useState('sheet');
  const [projF, setProjF] = useState('全部');
  const [teamF, setTeamF] = useState('全部');
  const [workers, setWorkers] = useState<AttWorker[]>(ATT_WORKERS);
  /* 岗位单价：页面内可改（原值来自 LABOR_RATES） */
  const [rates, setRates] = useState<Rate[]>(LABOR_RATES.map((r) => ({ ...r })));
  const [rateEdit, setRateEdit] = useState<Rate | null>(null);
  const [rateVal, setRateVal] = useState('');
  const [wmOpen, setWmOpen] = useState(false);
  /* 单价改动留痕 */
  const [rateLog, setRateLog] = useState<{ trade: string; old: number; nu: number; t: string }[]>([]);

  const rateOf = (trade: string) => rates.find((r) => r.trade === trade)?.rate ?? 0;
  const daysOf = (w: AttWorker) => attDays(w, MONTH_DAYS);
  const costOf = (w: AttWorker) => Math.round(daysOf(w) * rateOf(w.trade));

  const list = useMemo(
    () => workers.filter((w) => (projF === '全部' || w.proj === projF) && (teamF === '全部' || w.team === teamF)),
    [workers, projF, teamF],
  );

  const totalDays = Math.round(list.reduce((a, w) => a + daysOf(w), 0) * 10) / 10;
  const totalCost = list.reduce((a, w) => a + costOf(w), 0);
  const onSite = list.filter((w) => (w.marks[PASSED_DAYS] ?? '') && w.marks[PASSED_DAYS] !== '假').length;

  /** 点击格子：循环切换符号（√ → 半 → 加 → 休 → 假 → 空 → √） */
  const cycleMark = (wid: string, day: number) => {
    setWorkers((ws) => ws.map((w) => {
      if (w.id !== wid) return w;
      const cur = w.marks[day] ?? '';
      const idx = ATT_MARKS.findIndex((m) => m.k === cur);
      const next = ATT_MARKS[(idx + 1) % ATT_MARKS.length].k;
      return { ...w, marks: { ...w.marks, [day]: next } };
    }));
  };

  /* 按项目 / 按岗位汇总 */
  const byProj = useMemo(() => PROJECTS.map((p) => {
    const ws = workers.filter((w) => w.proj === p.id);
    return {
      id: p.id, name: p.name, cnt: ws.length,
      days: Math.round(ws.reduce((a, w) => a + daysOf(w), 0) * 10) / 10,
      cost: ws.reduce((a, w) => a + costOf(w), 0),
    };
  }).filter((r) => r.cnt > 0), [workers, rates]);

  const byTrade = useMemo(() => rates.map((r) => {
    const ws = workers.filter((w) => w.trade === r.trade);
    return {
      trade: r.trade, rate: r.rate, cnt: ws.length,
      days: Math.round(ws.reduce((a, w) => a + daysOf(w), 0) * 10) / 10,
      cost: ws.reduce((a, w) => a + costOf(w), 0),
    };
  }).filter((r) => r.cnt > 0), [workers, rates]);

  const MAIN_TABS = [
    { key: 'sheet', label: '月度考勤表' },
    { key: 'rate', label: '岗位单价', cnt: rates.length },
    { key: 'cost', label: '人工成本汇总' },
  ];

  return (
    <>
      <PageHead
        crumbs={['交付管理', '考勤管理']}
        title="考勤管理"
        badges={<><Tag tone="blue">2026 年 9 月</Tag><Tag tone="orange">外包用工 {workers.length} 人</Tag></>}
        sub={<span>外包用工月度考勤与人工成本<Tip w={360} text="出勤天数 = Σ 符号值；人工成本 = 出勤天数 × 岗位单价（岗位单价在「岗位单价」页维护）。考勤按「项目 + 班组」归属，可据此结算外包费用。" /></span>}
        actions={<>
          <Btn onClick={() => setTab('rate')}><Ico n="edit" size={16} /> 岗位单价</Btn>
          <Btn kind="primary" onClick={() => setWmOpen(true)}><Ico n="download" size={16} /> 导出考勤表</Btn>
        </>}
      />

      <div className="nc-tiles nc-tiles-4">
        <div className="nc-tile">
          <div className="nc-tile-label">在场人数（{PASSED_DAYS} 日）</div>
          <div className="nc-tile-value num">{onSite}</div>
          <div className="nc-tile-sub">已过 {PASSED_DAYS} 天 · 剔除「离开现场」</div>
        </div>
        <div className="nc-tile">
          <div className="nc-tile-label">本月出勤天数</div>
          <div className="nc-tile-value num">{totalDays}</div>
          <div className="nc-tile-sub">Σ 符号值（半 = 0.5 · 加 = 1.5）</div>
        </div>
        <div className="nc-tile">
          <div className="nc-tile-label">外包人工成本</div>
          <div className="nc-tile-value num nc-v-red">{money ? fmt(totalCost) : '—'}</div>
          <div className="nc-tile-sub">出勤天数 × 岗位单价 · 计入项目成本</div>
        </div>
        <div className="nc-tile">
          <div className="nc-tile-label">在用岗位</div>
          <div className="nc-tile-value num">{byTrade.length}</div>
          <div className="nc-tile-sub">共 {rates.length} 个岗位单价在册</div>
        </div>
      </div>

      <Card flush>
        <div style={{ padding: '12px 16px 0' }}>
          <Tabs value={tab} onChange={setTab} items={MAIN_TABS} />
        </div>

        {/* ============ 月度考勤表 ============ */}
        {tab === 'sheet' && (
          <div style={{ padding: 16 }}>
            <div className="nc-atd-toolbar">
              <select className="nc-input" style={{ width: 230 }} value={projF} onChange={(e) => setProjF(e.target.value)}>
                <option value="全部">全部项目</option>
                {PROJECTS.map((p) => <option key={p.id} value={p.id}>{p.id} · {p.name}</option>)}
              </select>
              <select className="nc-input" style={{ width: 170 }} value={teamF} onChange={(e) => setTeamF(e.target.value)}>
                <option value="全部">全部班组</option>
                {ATT_TEAMS.map((t) => <option key={t}>{t}</option>)}
              </select>
              <span className="nc-cell-sub" style={{ marginLeft: 'auto' }}>
                符号口径<Tip w={300} text="√ 出勤 1 天 · 半 0.5 天 · 加 1.5 天 · 休 现场休息不计考勤 · 假 离开现场 · 空 未在现场。点击格子循环切换。" />
              </span>
            </div>

            {list.length ? (
              <div className="nc-atd-wrap">
                <table className="nc-tbl nc-atd-tbl" style={{ minWidth: 1240 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>序</th>
                      <th style={{ width: 160 }}>姓名 / 岗位</th>
                      {Array.from({ length: MONTH_DAYS }, (_, i) => (
                        <th key={i} className={`is-center${i + 1 > PASSED_DAYS ? ' is-future' : ''}`} style={{ width: 26 }}>{i + 1}</th>
                      ))}
                      <th style={{ width: 72 }} className="is-num">出勤</th>
                      <th style={{ width: 96 }} className="is-num">岗位单价</th>
                      <th style={{ width: 108 }} className="is-num">人工成本</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((w, i) => {
                      const d = daysOf(w);
                      const r = rateOf(w.trade);
                      return (
                        <tr key={w.id}>
                          <td className="num">{i + 1}</td>
                          <td>
                            <b>{w.name}</b>
                            <div className="nc-tiny nc-muted">{w.trade} · {w.team}</div>
                          </td>
                          {Array.from({ length: MONTH_DAYS }, (_, k) => {
                            const day = k + 1;
                            const mk = w.marks[day] ?? '';
                            const cls = mk === '√' ? ' is-on' : mk === '半' ? ' is-half' : mk === '加' ? ' is-plus'
                              : mk === '假' ? ' is-off' : mk === '休' ? ' is-rest' : '';
                            return (
                              <td
                                key={day}
                                className={`nc-atd-cell${cls}`}
                                onClick={() => cycleMark(w.id, day)}
                                title={`${w.name} · ${day} 日：${ATT_MARKS.find((m) => m.k === mk)?.label ?? '未在现场'}`}
                              >
                                {mk || '·'}
                              </td>
                            );
                          })}
                          <td className="is-num num"><b>{d}</b></td>
                          <td className="is-num num nc-muted">{fmt(r)}</td>
                          <td className="is-num num"><b>{money ? fmt(Math.round(d * r)) : '—'}</b></td>
                        </tr>
                      );
                    })}
                    <tr className="nc-atd-sum">
                      <td colSpan={2}><b>合计（{list.length} 人）</b></td>
                      {Array.from({ length: MONTH_DAYS }, (_, i) => <td key={i} />)}
                      <td className="is-num num"><b>{totalDays}</b></td>
                      <td />
                      <td className="is-num num"><b>{money ? fmt(totalCost) : '—'}</b></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="nc-empty-mini">当前筛选下无考勤记录，请调整项目 / 班组筛选。</div>
            )}
          </div>
        )}

        {/* ============ 岗位单价 ============ */}
        {tab === 'rate' && (
          <div style={{ padding: 16 }}>
            <Banner tone="info">
              岗位单价是<b>人工费的唯一来源</b>：考勤出勤天数 × 岗位单价 = 外包人工成本。调整单价会重算全部在册考勤的人工成本，并写入留痕。
            </Banner>
            <table className="nc-tbl" style={{ minWidth: 620 }}>
              <thead><tr>
                <th>岗位 / 工种</th>
                <th style={{ width: 130 }} className="is-num">单价（元 / 工日）</th>
                <th style={{ width: 110 }} className="is-num">在册人数</th>
                <th style={{ width: 130 }} className="is-num">本月人工成本</th>
                <th style={{ width: 90 }}>操作</th>
              </tr></thead>
              <tbody>
                {byTrade.map((r) => (
                  <tr key={r.trade}>
                    <td><b>{r.trade}</b></td>
                    <td className="is-num num">{fmt(r.rate)}</td>
                    <td className="is-num num">{r.cnt}</td>
                    <td className="is-num num">{money ? fmt(r.cost) : '—'}</td>
                    <td><Op onClick={() => { setRateEdit({ trade: r.trade, rate: r.rate }); setRateVal(String(r.rate)); }}>调整单价</Op></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {rateLog.length > 0 && (
              <>
                <div className="nc-sec-title" style={{ marginTop: 18 }}>单价调整留痕（{rateLog.length}）</div>
                <table className="nc-tbl" style={{ minWidth: 520 }}>
                  <thead><tr><th>岗位</th><th style={{ width: 170 }}>旧值 → 新值</th><th style={{ width: 130 }}>时间</th></tr></thead>
                  <tbody>
                    {rateLog.map((h, i) => (
                      <tr key={i}>
                        <td>{h.trade}</td>
                        <td className="num">{fmt(h.old)} → <b>{fmt(h.nu)}</b></td>
                        <td className="nc-tiny nc-muted">{h.t}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* ============ 人工成本汇总 ============ */}
        {tab === 'cost' && (
          <div style={{ padding: 16 }}>
            <div className="nc-sec-title">按项目汇总（外包成本归属）</div>
            <table className="nc-tbl" style={{ minWidth: 720 }}>
              <thead><tr>
                <th style={{ width: 120 }}>项目编号</th>
                <th>项目名称</th>
                <th style={{ width: 100 }} className="is-num">用工人数</th>
                <th style={{ width: 110 }} className="is-num">出勤天数</th>
                <th style={{ width: 130 }} className="is-num">人工成本</th>
                <th style={{ width: 100 }}>操作</th>
              </tr></thead>
              <tbody>
                {byProj.map((r) => (
                  <tr key={r.id}>
                    <td className="num nc-id-cell"><EntityLink target="project-center" id={r.id} go={go} title="下钻到项目详情">{r.id}</EntityLink></td>
                    <td>{r.name}</td>
                    <td className="is-num num">{r.cnt}</td>
                    <td className="is-num num">{r.days}</td>
                    <td className="is-num num"><b>{money ? fmt(r.cost) : '—'}</b></td>
                    <td><Op onClick={() => { setProjF(r.id); setTab('sheet'); }}>查看考勤</Op></td>
                  </tr>
                ))}
                <tr className="nc-atd-sum">
                  <td colSpan={2}><b>合计（{byProj.length} 个项目）</b></td>
                  <td className="is-num num"><b>{byProj.reduce((a, r) => a + r.cnt, 0)}</b></td>
                  <td className="is-num num"><b>{Math.round(byProj.reduce((a, r) => a + r.days, 0) * 10) / 10}</b></td>
                  <td className="is-num num"><b>{money ? fmt(byProj.reduce((a, r) => a + r.cost, 0)) : '—'}</b></td>
                  <td />
                </tr>
              </tbody>
            </table>

            <div className="nc-sec-title" style={{ marginTop: 18 }}>按岗位汇总</div>
            <table className="nc-tbl" style={{ minWidth: 720 }}>
              <thead><tr>
                <th>岗位 / 工种</th>
                <th style={{ width: 130 }} className="is-num">单价</th>
                <th style={{ width: 100 }} className="is-num">人数</th>
                <th style={{ width: 110 }} className="is-num">出勤天数</th>
                <th style={{ width: 130 }} className="is-num">人工成本</th>
              </tr></thead>
              <tbody>
                {byTrade.map((r) => (
                  <tr key={r.trade}>
                    <td><b>{r.trade}</b></td>
                    <td className="is-num num">{fmt(r.rate)}</td>
                    <td className="is-num num">{r.cnt}</td>
                    <td className="is-num num">{r.days}</td>
                    <td className="is-num num"><b>{money ? fmt(r.cost) : '—'}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="nc-listhint" style={{ marginTop: 14 }}>
              <span>成本口径<Tip w={340} text="外包人工成本 = Σ（个人出勤天数 × 岗位单价）；本页为考勤口径的人工成本，登记成本（CB）时可按项目引用本金额，避免重复计入。" /></span>
            </div>
          </div>
        )}
      </Card>

      {/* ============ 调整岗位单价 ============ */}
      <Modal open={!!rateEdit} onClose={() => setRateEdit(null)} width={480}
        title={`调整岗位单价 · ${rateEdit?.trade ?? ''}`}
        foot={<><Btn onClick={() => setRateEdit(null)}>取消</Btn><Btn kind="primary" onClick={() => {
          const v = Number(rateVal);
          if (!(v > 0)) { toast('单价须 > 0'); return; }
          if (rateEdit) {
            setRates((rs) => rs.map((r) => (r.trade === rateEdit.trade ? { ...r, rate: v } : r)));
            setRateLog((h) => [{ trade: rateEdit.trade, old: rateEdit.rate, nu: v, t: TODAY }, ...h]);
            toast(`${rateEdit.trade} 单价 ${fmt(rateEdit.rate)} → ${fmt(v)}（已留痕，人工成本已重算）`);
          }
          setRateEdit(null);
        }}>保存</Btn></>}>
        <Banner tone="warn">单价调整将<b>重算全部在册考勤</b>的人工成本并留痕（谁 / 何时 / 旧值 → 新值）。</Banner>
        <div className="nc-form-grid">
          <Field label="岗位 / 工种" span={2}><input className="nc-input" readOnly value={rateEdit?.trade ?? ''} /></Field>
          <Field label="当前单价" span={2}><input className="nc-input" readOnly value={rateEdit ? fmt(rateEdit.rate) : ''} /></Field>
          <Field label="新单价（元 / 工日）" req span={2}>
            <input className="nc-input" type="number" value={rateVal} onChange={(e) => setRateVal(e.target.value)} />
          </Field>
        </div>
      </Modal>

      {/* ============ 水印设置（导出考勤表） ============ */}
      <WatermarkModal
        open={wmOpen}
        scope={`月度考勤表（2026 年 9 月 · ${list.length} 人）`}
        onClose={() => setWmOpen(false)}
        onConfirm={(cfg) => {
          setWmOpen(false);
          toast(`已导出考勤表（水印：${cfg.text}）· ${list.length} 人 / 出勤 ${totalDays} 天`);
        }}
      />
    </>
  );
}
