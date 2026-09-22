// 商机管理（列表 + 看板双视图）
// 阶段状态机：推进中 → 重点 → 甲方立项确认 → 商务谈判 → 已中标 / 未中标 / 关闭（终态）
// 阶段概率：推进中 20% / 重点 40% / 甲方立项确认 60% / 商务谈判 80% / 已中标 100%；加权金额 = 金额 × 概率
// 复刻「商机管理.html」补齐：勘察记录（含工程量清单 · 生成报价后锁定只读）· 关联报价 / 投标 / 阶段历史
// · 转化为合同·项目（原子事务 · 唯一约束）· 关闭商机（必选原因）· 重开（管理员 · 已转化不可重开）· 阶段可跳选可回退
import React, { useEffect, useMemo, useState } from 'react';
import {
  Banner, Btn, Card, ChainBar, DataTable, Drawer, EntityLink, Field, KvGrid, ListToolbar, Modal,
  Op, OpSep, PageHead, TableFoot, Tag, Tabs, Timeline, Tile, useToast, Code, IdCell, pressProps,} from '../components/ui';
import { OPPS, OPP_STAGES, OPP_STAGE_PROB, OPP_TERMINAL, OPP_POST, OPP_AMT_REQUIRED_FROM, fmtWan, canSeeMoney, TODAY } from '../components/data';
import { consumeFocus, setFocus } from '../components/store';
import { Ico } from '../components/icons';

const STAGE_TONE: Record<string, 'blue' | 'orange' | 'green' | 'gray' | 'red'> = {
  推进中: 'gray', 重点: 'orange', 甲方立项确认: 'orange', 商务谈判: 'blue', 已中标: 'green',
  未中标: 'gray', 关闭: 'red',
};
const BIZ_NAME: Record<string, string> = { GC: '消防工程', WB: '维护保养', JC: '检测', RJ: '软件研发', QT: '其他' };
const SYS_TYPES = ['火灾自动报警系统', '自动喷淋灭火系统', '防排烟系统', '应急照明与疏散', '气体灭火系统', '消防水系统', '全系统'];
const CLOSE_REASONS = ['客户预算取消', '价格高于对手', '技术方案不满足', '关系资源不足', '工期无法满足', '资质 / 证书不达标', '项目暂缓', '其他'];
/** 商机来源（FR-OPP-003） */
const OPP_SRC = ['转介绍', '招投标', '自拓', '老客户复购', '其他'];
const SORT_OPTS = ['最近推进倒序', '金额从高到低', '金额从低到高', '预计签约日最近'];
type O = (typeof OPPS)[number];

/* ============================ 勘察记录 ============================ */
type QtyRow = { n: string; u: string; q: string; r: string };
type Svy = {
  id: string; at: string; persons: string[]; sys: string; desc: string;
  photos: number; rows: QtyRow[]; quoteId?: string;
};
/** 已进入报价 / 待签的商机默认有一条已生成报价的勘察（锁定只读） */
const svySeed = (o: O): Svy[] => (['已报价', '待签'].includes(o.stage) ? [{
  id: `SRV-2026-${o.id.slice(-3)}`, at: '2026-09-05', persons: [o.owner], sys: '火灾自动报警系统 / 自动喷淋',
  desc: '现场踏勘：主机房 2 处、报警回路 24 路；喷洒头原型号 ZSTX-15 老化需全部更换；消防泵房设备需同步改造；弱电井桥架可利用。',
  photos: 4,
  rows: [
    { n: '点型感烟火灾探测器', u: '只', q: '860', r: '含底座' },
    { n: '喷洒头 ZSTX-15/68℃', u: '个', q: '1240', r: '下垂型' },
    { n: '火灾报警控制器（联动型）', u: '台', q: '4', r: '2 回路' },
    { n: '消防水泵接合器 SQD150-A', u: '套', q: '6', r: '含止回阀' },
  ],
  quoteId: 'BJ20260912-0011',
}] : []);

/* 关联报价 / 投标 / 阶段历史（示意数据，按商机派生） */
const relQuotes = (o: O) => o.quotes > 0
  ? [{ id: 'BJ20260912-0011', ver: 'V2', amt: 4800000, status: '待审批', date: o.last }]
  : [];
const relBids = (o: O) => (['商务谈判', '已中标'].includes(o.stage)
  ? [{ id: 'TB20260902-0007', name: `${o.name}（投标）`, amt: o.amt || 0, status: '已投标', date: '2026-09-02' }]
  : []);
const stageHist = (o: O) => [
  { at: o.last, from: '商务谈判', to: o.stage, by: o.owner, note: o.stage === '已中标' ? '中标通知书签收' : o.stage === '未中标' ? '开标未中标' : '' },
  { at: '2026-08-12', from: '甲方立项确认', to: '商务谈判', by: o.owner, note: '进入商务条款谈判' },
  { at: '2026-07-02', from: '—', to: '推进中', by: o.owner, note: '创建商机' },
];

export default function OppPage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  const money = canSeeMoney(role);
  const isAdmin = role === 'boss' || role === 'admin' || role === '超级管理员';

  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [stage, setStage] = useState('全部');
  const [type, setType] = useState('全部');
  const [kw, setKw] = useState('');
  const [owner, setOwner] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [detail, setDetail] = useState<O | null>(null);
  const [dTab, setDTab] = useState('overview');
  const [addOpen, setAddOpen] = useState(false);
  const [loseOpen, setLoseOpen] = useState<O | null>(null);
  const [loseReason, setLoseReason] = useState('');
  const [quoteOpen, setQuoteOpen] = useState<O | null>(null);
  /* ---- 新增：阶段推进（可跳选可回退） / 关闭 / 重开 / 转化 / 勘察 ---- */
  const [advOpen, setAdvOpen] = useState<O | null>(null);
  const [advStage, setAdvStage] = useState('');
  const [advNote, setAdvNote] = useState('');
  const [closeOpen, setCloseOpen] = useState<O | null>(null);
  const [closeReason, setCloseReason] = useState('');
  const [reopenOpen, setReopenOpen] = useState<O | null>(null);
  const [cvtOpen, setCvtOpen] = useState<O | null>(null);
  const [svyOpen, setSvyOpen] = useState<{ o: O; s: Svy | null } | null>(null);
  const [svyForm, setSvyForm] = useState<Svy>({ id: '', at: TODAY, persons: [], sys: '', desc: '', photos: 0, rows: [] });
  const [svyMap, setSvyMap] = useState<Record<string, Svy[]>>({});
  const [converted, setConverted] = useState<Record<string, { xm: string; ht: string }>>({});

  /* ---- 新增：更多筛选（金额区间 / 创建区间 / 排序） ---- */
  const [more, setMore] = useState(false);
  const [amtMin, setAmtMin] = useState('');
  const [amtMax, setAmtMax] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [sort, setSort] = useState(SORT_OPTS[0]);

  /* ---- 新增：新建商机（L0 必填 / L1 选填折叠 · 客户弹层新建 · 来源 · 重复提醒 · 草稿） ---- */
  const [nName, setNName] = useState('');
  const [nCust, setNCust] = useState('昆明万达广场商业管理有限公司');
  const [nBiz, setNBiz] = useState('GC');
  const [nTypeF, setNTypeF] = useState('新建');
  const [nSrc, setNSrc] = useState('自拓');
  const [nAmt, setNAmt] = useState('');
  const [nSign, setNSign] = useState('');
  const [nOwner, setNOwner] = useState('蓝峰');
  const [nNote, setNNote] = useState('');
  const [l1Open, setL1Open] = useState(false);
  const [custNew, setCustNew] = useState(false);
  const [custName, setCustName] = useState('');
  const [custInd, setCustInd] = useState('医疗');

  /** 重复不拦截，仅黄字提醒 */
  const dupHit = useMemo(() => {
    const k = nName.trim();
    if (k.length < 4) return [] as O[];
    return OPPS.filter((o) => o.name.includes(k) || k.includes(o.name.slice(0, 8)));
  }, [nName]);

  const rows = useMemo(() => {
    const list = OPPS.filter((o) =>
      (stage === '全部' || o.stage === stage) && (type === '全部' || o.type === type) &&
      (!owner || o.owner === owner) && (!kw || (o.name + o.customer + o.id).includes(kw)) &&
      (!amtMin || o.amt >= Number(amtMin) * 10000) && (!amtMax || o.amt <= Number(amtMax) * 10000) &&
      (!from || o.last >= from) && (!to || o.last <= to));
    const arr = [...list];
    if (sort === '最近推进倒序') arr.sort((a, b) => b.last.localeCompare(a.last));
    else if (sort === '金额从高到低') arr.sort((a, b) => b.amt - a.amt);
    else if (sort === '金额从低到高') arr.sort((a, b) => a.amt - b.amt);
    else arr.sort((a, b) => (a.signDate || '9999').localeCompare(b.signDate || '9999'));
    return arr;
  }, [stage, type, owner, kw, amtMin, amtMax, from, to, sort]);

  const paged = rows.slice((page - 1) * pageSize, page * pageSize);
  const active = OPPS.filter((o) => !OPP_TERMINAL.includes(o.stage));
  const weighted = active.reduce((s, o) => s + o.amt * (OPP_STAGE_PROB[o.stage] || 0) / 100, 0);
  const stageCnt = (s: string) => OPPS.filter((o) => o.stage === s).length;
  const svyOf = (o: O) => svyMap[o.id] ?? svySeed(o);

  /**
   * 跨页穿透：从客户 / 报价 / 项目等页面下钻进来时，自动打开目标商机详情。
   * 以 nav（路由脉冲）为依赖，保证反复下钻同一页也能重新定位。
   */
  useEffect(() => {
    const id = consumeFocus('opp');
    if (!id) return;
    const hit = OPPS.find((o) => o.id === id);
    if (hit) { setDetail(hit); setDTab('overview'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav]);

  /* ---------- 推进阶段（弹窗选阶段 + 说明，可跳选可回退） ---------- */
  const openAdv = (o: O) => {
    setAdvOpen(o); setAdvStage(o.stage); setAdvNote('');
  };
  const doAdv = () => {
    const o = advOpen;
    if (!o) return;
    if (advStage === o.stage) { toast('新阶段与当前阶段相同，无需推进', 'err'); return; }
    if (!advNote.trim()) { toast('阶段说明必填（用于阶段历史留痕）', 'err'); return; }
    /* gating（对齐参考《商机管理》249 行）：报价 / 转化仅限 [甲方立项确认, 商务谈判, 已中标]；
       阶段 ≥ 甲方立项确认 时预计金额必填，未填先就地补填（终态阶段不受此约束） */
    if (OPP_POST.includes(advStage) && o.quotes === 0) { toast(`推进到「${advStage}」需先有报价单 · 请先在勘察中生成报价`, 'err'); return; }
    const reachedAmtGate = (OPP_STAGES as readonly string[]).indexOf(advStage) >= (OPP_STAGES as readonly string[]).indexOf(OPP_AMT_REQUIRED_FROM);
    if (!OPP_TERMINAL.includes(advStage) && reachedAmtGate && !o.amt) { toast(`推进到「${advStage}」起预计金额必填 · 请先在商机详情就地补填`, 'err'); return; }
    if (advStage === '已中标' && !o.quotes) { toast('推进到「已中标」需已有报价单作为中标价依据', 'err'); return; }
    toast(`阶段已推进：${o.stage} → ${advStage}（说明：${advNote.trim()}）`);
    setAdvOpen(null); setAdvNote('');
  };

  /* ---------- 勘察：新增 / 保存 / 生成报价 ---------- */
  const openSvy = (o: O, s: Svy | null) => {
    setSvyOpen({ o, s });
    setSvyForm(s ?? { id: `SRV-2026-${String(100 + Math.floor(Math.random() * 800))}`, at: TODAY, persons: [], sys: '', desc: '', photos: 0, rows: [{ n: '', u: '个', q: '', r: '' }] });
  };
  const togglePerson = (p: string) => setSvyForm((f) => ({
    ...f,
    persons: f.persons.includes(p) ? f.persons.filter((x) => x !== p) : (f.persons.length >= 5 ? (toast('勘察人员最多 5 人', 'err'), f.persons) : [...f.persons, p]),
  }));
  const setRow = (i: number, k: keyof QtyRow, v: string) => setSvyForm((f) => ({ ...f, rows: f.rows.map((r, ix) => (ix === i ? { ...r, [k]: v } : r)) }));
  const validSvy = () => {
    if (!svyForm.at) { toast('勘察时间必填', 'err'); return false; }
    if (svyForm.at > TODAY) { toast(`勘察时间不可晚于当前时间（${TODAY}）`, 'err'); return false; }
    if (!svyForm.persons.length) { toast('勘察人员至少 1 人', 'err'); return false; }
    if (!svyForm.sys) { toast('系统类别必选', 'err'); return false; }
    if (svyForm.desc.trim().length < 10) { toast('勘察描述至少 10 个字', 'err'); return false; }
    return true;
  };
  const saveSvy = () => {
    if (!validSvy() || !svyOpen) return;
    const o = svyOpen.o;
    const rec: Svy = { ...svyForm, rows: svyForm.rows.filter((r) => r.n.trim()) };
    setSvyMap((m) => ({ ...m, [o.id]: [rec, ...svyOf(o)] }));
    toast(`勘察已保存：${rec.id}（工程量 ${rec.rows.length} 行）`);
    setSvyOpen(null);
  };
  const genQuote = () => {
    if (!validSvy() || !svyOpen) return;
    const o = svyOpen.o;
    const ok = svyForm.rows.filter((r) => r.n.trim() && Number(r.q) > 0);
    const skip = svyForm.rows.filter((r) => r.n.trim() && !(Number(r.q) > 0));
    if (!ok.length) { toast('工程量清单至少 1 行且数量 > 0 才能生成报价', 'err'); return; }
    const qid = `BJ${TODAY.replace(/-/g, '')}-00${20 + ok.length}`;
    const rec: Svy = { ...svyForm, rows: svyForm.rows.filter((r) => r.n.trim()), quoteId: qid };
    setSvyMap((m) => ({ ...m, [o.id]: [rec, ...svyOf(o)] }));
    toast(`报价草稿已生成：${qid}（带入 ${ok.length} 行${skip.length ? `；${skip.length} 行未填数量未带入` : ''}；勘察已入库并锁定）`);
    setSvyOpen(null);
  };

  return (
    <>
      <PageHead
        title="商机管理"
        badges={<Tag tone="gray">五阶段推进</Tag>}
        actions={<>
          <Btn onClick={() => toast('商机列表已导出 CSV（含阶段 / 金额 / 概率 / 加权金额）')}>⇩ 导出 CSV</Btn>
          <Btn kind="primary" onClick={() => setAddOpen(true)}>＋ 新建商机</Btn>
        </>}
      />

      <div className="nc-tiles nc-tiles-5">
        <div className="nc-tile"><div className="nc-tile-label">在谈商机</div><div className="nc-tile-value">{active.length}</div><div className="nc-tile-sub">不含未中标 / 关闭</div></div>
        <div className="nc-tile"><div className="nc-tile-label">在谈金额</div><div className="nc-tile-value nc-v-blue">{money ? fmtWan(active.reduce((s, o) => s + o.amt, 0)) : '—'}</div><div className="nc-tile-sub">含税未折概率</div></div>
        <Tile label="加权金额" tone="orange" value={money ? fmtWan(weighted) : '—'} sub="用于经营测算"
          tip={<>
            <b>加权金额 = 金额 × 阶段概率</b><br />
            推进中 20% · 重点 40% · 甲方立项确认 60% · 商务谈判 80% · 已中标 100%
          </>} />
        <Tile label="商务谈判" value={stageCnt('商务谈判')} sub="可转合同 / 项目"
          tip={<>
            <b>阶段推进规则</b><br />
            推进中 → 重点 → 甲方立项确认（金额开始必填）→ 商务谈判 → 已中标 / 未中标 / 关闭<br />
            推进 / 回退须填说明并留痕；关闭必选原因；终态仅管理员可重开，已转化不可重开；勘察生成报价后锁定只读（修改 = 新建一条）。
          </>} />
        <div className="nc-tile"><div className="nc-tile-label">超 14 天未跟进</div><div className="nc-tile-value nc-v-red">{OPPS.filter((o) => o.lastDays > 14 && !['未中标', '关闭'].includes(o.stage)).length}</div><div className="nc-tile-sub">需立即跟进</div></div>
      </div>

      <Card flush>
        <ListToolbar
          rows={[
            {
              label: '阶段', value: stage, onChange: (k) => { setStage(k); setPage(1); },
              items: [
                { key: '全部', label: '全部阶段', cnt: OPPS.length },
                ...[...OPP_STAGES, ...OPP_TERMINAL].map((s) => ({ key: s, label: s, cnt: OPPS.filter((o) => o.stage === s).length })),
              ],
            },
            {
              label: '类型', value: type, onChange: (k) => { setType(k); setPage(1); },
              items: [
                { key: '全部', label: '全部类型', cnt: OPPS.length },
                ...['新建', '改造', '维护保养', '检测'].map((t) => ({ key: t, label: t, cnt: OPPS.filter((o) => o.type === t).length })),
              ],
            },
          ]}
          children={more ? (
            <div className="nc-ltrow" style={{ gap: 6, alignItems: 'center' }}>
              <span className="nc-ltlbl">金额区间</span>
              <input className="nc-input num" style={{ width: 88 }} value={amtMin} onChange={(e) => { setAmtMin(e.target.value); setPage(1); }} placeholder="最小" />
              <span className="nc-muted nc-tiny">万元 ~</span>
              <input className="nc-input num" style={{ width: 88 }} value={amtMax} onChange={(e) => { setAmtMax(e.target.value); setPage(1); }} placeholder="最大" />
              <span className="nc-muted nc-tiny">万元</span>
              <span className="nc-ltlbl" style={{ marginLeft: 14 }}>创建区间</span>
              <input className="nc-input num" style={{ width: 132 }} type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
              <span className="nc-muted nc-tiny">~</span>
              <input className="nc-input num" style={{ width: 132 }} type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
              <span className="nc-tiny nc-muted" style={{ marginLeft: 'auto' }}>命中 <b>{rows.length}</b> 条 · 金额按万元输入</span>
            </div>
          ) : undefined}
          right={<>
            <select className="nc-input" style={{ width: 130 }} value={owner} onChange={(e) => { setOwner(e.target.value); setPage(1); }}>
              <option value="">全部归属人</option>{['蓝峰', '李思敏', '王志海', '赵薇', '刘宇', '李慧敏'].map((s) => <option key={s}>{s}</option>)}
            </select>
            <select className="nc-input" style={{ width: 140 }} value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} title="排序">
              {SORT_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Btn size="sm" onClick={() => setMore((v) => !v)}>{more ? '收起筛选 ▴' : '更多筛选 ▾'}</Btn>
            <input className="nc-input nc-lt-search" value={kw} placeholder="搜索商机名称 / 客户 / 编号"
              onChange={(e) => { setKw(e.target.value); setPage(1); }} />
            <div className="nc-role-view">
              <span className="nc-role-lbl">视图</span>
              <Btn size="sm" kind={view === 'list' ? 'primary' : 'default'} onClick={() => setView('list')}>列表</Btn>
              <Btn size="sm" kind={view === 'kanban' ? 'primary' : 'default'} onClick={() => setView('kanban')}>看板</Btn>
            </div>
            <Btn onClick={() => {
              setStage('全部'); setType('全部'); setKw(''); setOwner(''); setAmtMin(''); setAmtMax(''); setFrom(''); setTo(''); setSort(SORT_OPTS[0]); setPage(1); toast('筛选已重置');
            }}>重置</Btn>
          </>}
        />
      </Card>

      {view === 'list' ? (
        <Card flush>
            <DataTable<O>
              minWidth={1520}
              cols={[
                { key: 'id', title: '商机编号', width: 110, render: (o) => <IdCell onClick={() => { setDetail(o); setDTab('overview'); }} title="查看商机详情">{o.id}</IdCell> },
                { key: 'name', title: '商机名称', width: 250, render: (o) => (<div><div className="nc-td-main">{o.name}{converted[o.id] && <Tag tone="green">已转化</Tag>}</div><div className="nc-td-sub">{BIZ_NAME[o.biz]} · {o.type} · 报价 {o.quotes} 版</div></div>) },
                { key: 'customer', title: '客户', width: 190, render: (o) => <span>{o.customer}</span> },
                { key: 'stage', title: '阶段', width: 92, render: (o) => <Tag tone={STAGE_TONE[o.stage]}>{o.stage}</Tag> },
                { key: 'prob', title: '概率', width: 68, align: 'right', render: (o) => <span className="num">{OPP_STAGE_PROB[o.stage] ?? 0}%</span> },
                { key: 'amt', title: '预计金额', width: 130, align: 'right', render: (o) => <b className="num">{money ? (o.amt ? fmtWan(o.amt) : '待定') : '—'}</b> },
                { key: 'w', title: '加权金额', width: 120, align: 'right', render: (o) => <span className="num" style={{ color: 'var(--c-warning-deep)' }}>{money ? fmtWan(o.amt * (OPP_STAGE_PROB[o.stage] || 0) / 100) : '—'}</span> },
                { key: 'signDate', title: '预计签约', width: 110, render: (o) => o.signDate ? <span className={`num ${daysUntil(o.signDate) < 0 ? 'nc-v-red' : daysUntil(o.signDate) <= 30 ? 'nc-v-orange' : ''}`}>{o.signDate}</span> : <span style={{ color: 'var(--ink-3)' }}>待定</span> },
                { key: 'owner', title: '归属人', width: 82 },
                { key: 'last', title: '最近跟进', width: 110, render: (o) => <span className="num" style={{ color: o.lastDays > 14 ? 'var(--c-danger)' : undefined }}>{o.last}{o.lastDays > 14 ? <> <Ico n="warning" size={12} style={{ color: 'var(--c-warning-mid)' }} /></> : null}</span> },
                {
                  key: 'ops', title: '操作', width: 240, render: (o) => (
                    <span className="nc-ops" onClick={(e) => e.stopPropagation()}>
                      <Op onClick={() => { setDetail(o); setDTab('overview'); }}>详情</Op><OpSep />
                      <Op gold onClick={() => setQuoteOpen(o)}>去报价</Op><OpSep />
                      <Op onClick={() => openAdv(o)}>推进</Op>
                      {!OPP_TERMINAL.includes(o.stage) && <><OpSep /><Op danger onClick={() => { setLoseOpen(o); setLoseReason(''); }}>未中标 / 关闭</Op></>}
                    </span>
                  ),
                },
              ]}
              rows={paged} rowKey={(o) => o.id} onRowClick={(o) => { setDetail(o); setDTab('overview'); }}
              rowClass={(o) => (OPP_TERMINAL.includes(o.stage) ? 'nc-row-dead' : '')}
              foot={<TableFoot total={OPPS.length} filtered={rows.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />}
            />
        </Card>
      ) : (
        <Card>
          <div className="nc-kanban">
            {[...OPP_STAGES, ...OPP_TERMINAL].map((s) => {
              const list = OPPS.filter((o) => o.stage === s);
              return (
                <div className="nc-kb-col" key={s}>
                  <div className="nc-kb-hd"><Tag tone={STAGE_TONE[s]}>{s}</Tag><span className="nc-kb-cnt">{list.length}</span></div>
                  <div className="nc-kb-cards">
                    {list.map((o) => (
                      <div className="nc-kb-card" key={o.id} onClick={() => { setDetail(o); setDTab('overview'); }} {...pressProps(() => { setDetail(o); setDTab('overview'); })}>
                        <div className="nc-kb-id num">{o.id}</div>
                        <div className="nc-kb-name">{o.name}</div>
                        <div className="nc-kb-cust"><EntityLink target="customer" id={o.customerId} go={go} title="下钻到客户档案">{o.customer}</EntityLink></div>
                        <div className="nc-kb-amt num">{money ? (o.amt ? fmtWan(o.amt) : '待定') : '—'}</div>
                        <div className="nc-kb-chips">
                          <Tag tone="gray">{o.type}</Tag>
                          <Tag tone="blue">{OPP_STAGE_PROB[o.stage] ?? 0}%</Tag>
                          {o.lastDays > 14 && <Tag tone="red"><Ico n="warning" size={16} /> {o.lastDays} 天未跟进</Tag>}
                        </div>
                      </div>
                    ))}
                    {!list.length && <div className="nc-empty-mini" style={{ margin: '4px 0' }}>/ 无</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ============ 详情抽屉（5 Tab） ============ */}
      <Drawer open={!!detail} width={760} title={detail?.name || ''}
        sub={detail && <span className="num">{detail.id} · {BIZ_NAME[detail.biz]} · {detail.type} · 归属 {detail.owner}</span>}
        onClose={() => setDetail(null)}
        foot={<>
          <Btn onClick={() => { setLoseOpen(detail); setDetail(null); setLoseReason(''); }}>标记未中标 / 关闭</Btn>
          {detail && OPP_TERMINAL.includes(detail.stage) && (
            isAdmin
              ? <Btn onClick={() => { setReopenOpen(detail); setDetail(null); }}>重开</Btn>
              : <Btn disabled title="仅管理员可重开；已转化不可重开">重开</Btn>
          )}
          <Btn onClick={() => { setQuoteOpen(detail); setDetail(null); }}>去报价</Btn>
          {detail && !converted[detail.id] && OPP_POST.includes(detail.stage) && (
            <Btn kind="primary" onClick={() => { setCvtOpen(detail); setDetail(null); }}>转化为合同·项目</Btn>
          )}
          <Btn kind="primary" onClick={() => { openAdv(detail!); setDetail(null); }}>推进 / 回退阶段</Btn>
        </>}>
        {detail && (
          <>
            <Tabs value={dTab} onChange={setDTab} items={[
              { key: 'overview', label: '概览' },
              { key: 'srv', label: '勘察记录', cnt: svyOf(detail).length },
              { key: 'rel', label: '关联', cnt: relQuotes(detail).length + relBids(detail).length },
              { key: 'hist', label: '阶段历史' },
              { key: 'tl', label: '流转记录' },
            ]} />

            {dTab === 'overview' && (
              <div style={{ marginTop: 12 }}>
                <ChainBar nodes={[...OPP_STAGES].map((s, i) => {
                  const cur = (OPP_STAGES as readonly string[]).indexOf(detail.stage);
                  return { label: s, sub: `${OPP_STAGE_PROB[s] ?? 0}%`, state: (i < cur ? 'done' : i === cur ? 'cur' : 'todo') as 'done' | 'cur' | 'todo' };
                })} />
                <div className="nc-tiles nc-tiles-3" style={{ margin: '14px 0' }}>
                  <div className="nc-tile"><div className="nc-tile-label">预计金额（含税）</div><div className="nc-tile-value nc-v-blue">{money ? (detail.amt ? fmtWan(detail.amt) : '待定') : '—'}</div><div className="nc-tile-sub">报价 {detail.quotes} 版</div></div>
                  <div className="nc-tile"><div className="nc-tile-label">加权金额</div><div className="nc-tile-value nc-v-orange">{money ? fmtWan(detail.amt * (OPP_STAGE_PROB[detail.stage] || 0) / 100) : '—'}</div><div className="nc-tile-sub">金额 × {OPP_STAGE_PROB[detail.stage] ?? 0}%</div></div>
                  <div className="nc-tile"><div className="nc-tile-label">预计签约日</div><div className="nc-tile-value" style={{ fontSize: 16 }}>{detail.signDate || '待定'}</div><div className="nc-tile-sub">{detail.signDate ? `距今 ${daysUntil(detail.signDate)} 天` : '—'}</div></div>
                </div>
                <div className="nc-sec-title" style={{ marginBottom: 12 }}>商机信息</div>
                <KvGrid cols={2} rows={[
                  { k: '商机编号', v: <span className="num">{detail.id}</span> },
                  { k: '所属客户', v: <EntityLink target="customer" id={detail.customerId} go={go} title="下钻到客户档案">{detail.customer}</EntityLink> },
                  { k: '业务域', v: BIZ_NAME[detail.biz] },
                  { k: '业务类型', v: detail.type },
                  { k: '当前阶段', v: <Tag tone={STAGE_TONE[detail.stage]}>{detail.stage}</Tag> },
                  { k: '阶段概率', v: `${OPP_STAGE_PROB[detail.stage] ?? 0}%` },
                  { k: '行业', v: detail.industry },
                  { k: '归属人', v: detail.owner },
                  { k: '最近跟进', v: <span className="num" style={{ color: detail.lastDays > 14 ? 'var(--c-danger)' : undefined }}>{detail.last}（{detail.lastDays} 天前）{detail.lastDays > 14 ? <> <Ico n="warning" size={12} style={{ color: 'var(--c-warning-mid)' }} /></> : null}</span> },
                  { k: '转化记录', v: converted[detail.id] ? <span>项目 <EntityLink target="project-center" id={converted[detail.id].xm} go={go} title="下钻到项目经营中心">{converted[detail.id].xm}</EntityLink> · 合同 <EntityLink target="contract" id={converted[detail.id].ht} go={go} title="下钻到合同详情">{converted[detail.id].ht}</EntityLink></span> : <span style={{ color: 'var(--ink-3)' }}>未转化</span> },
                ]} />
                <div className="nc-sec-title" style={{ margin: '14px 0 10px' }}>竞争与策略（在谈项目档案）</div>
                <KvGrid cols={2} rows={[
                  { k: '客户 / 行业', v: <><EntityLink target="customer" id={detail.customerId} go={go} title="下钻到客户档案">{detail.customer}</EntityLink> · {detail.industry}</> },
                  { k: '负责人', v: detail.owner },
                  { k: '决策链', v: <span className="nc-cell-sub">{chainText(detail)}</span> },
                  { k: '竞争对手', v: <span className="nc-cell-sub">{compText(detail)}</span> },
                  { k: '我方优势', v: <span className="nc-cell-sub">{advText(detail)}</span> },
                  { k: '下一步动作', v: <span className="nc-cell-sub">{nextText(detail)}</span> },
                ]} />
                <div className="nc-tiny nc-muted" style={{ marginTop: 8 }}>
                  跟进记录超 <b>14 天</b>未跟进将出现在管道页提醒；加权金额（金额 × 阶段概率）为经营目标测算口径，替代拍脑袋。
                </div>
                <Banner tone="gold">
                  状态机 gating：推进到「已报价」需已有报价单；推进到「待签」需客户已确认报价；「待签 → 待启动」将走转化为合同·项目原子事务。转化后不可重开。
                </Banner>
              </div>
            )}

            {dTab === 'srv' && (
              <div style={{ marginTop: 12 }}>
                <div className="nc-inline-ops" style={{ marginBottom: 12 }}>
                  <span className="nc-cell-sub">生成报价后勘察锁定只读；如需修改请新建一条</span>
                  <span style={{ flex: 1 }} />
                  <Btn size="sm" kind="primary" onClick={() => openSvy(detail, null)}>＋ 新增勘察记录</Btn>
                </div>
                {svyOf(detail).length === 0
                  ? <div className="nc-empty-mini">暂无勘察记录：点击「＋ 新增勘察记录」登记现场情况，工程量可用于生成报价草稿</div>
                  : (
                    <table className="nc-tbl" style={{ minWidth: 700 }}>
                      <thead><tr>
                        <th style={{ width: 130 }}>勘察编号</th><th style={{ width: 100 }}>勘察时间</th>
                        <th style={{ width: 120 }}>勘察人员</th><th>系统类别</th>
                        <th style={{ width: 90 }} className="is-num">工程量</th><th style={{ width: 110 }}>报价状态</th><th style={{ width: 80 }}>操作</th>
                      </tr></thead>
                      <tbody>
                        {svyOf(detail).map((s) => (
                          <tr key={s.id}>
                            <td><Code>{s.id}</Code></td>
                            <td className="num">{s.at}</td>
                            <td>{s.persons.join('、')}</td>
                            <td>{s.sys}</td>
                            <td className="is-num">{s.rows.length} 行</td>
                            <td>{s.quoteId ? <Tag tone="green">已生成 {s.quoteId}</Tag> : <Tag tone="gray">未生成</Tag>}</td>
                            <td><Op onClick={() => openSvy(detail, s)}>{s.quoteId ? '查看' : '编辑'}</Op></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
              </div>
            )}

            {dTab === 'rel' && (
              <div style={{ marginTop: 12 }}>
                <div className="nc-sec-title" style={{ marginBottom: 8 }}>报价单</div>
                {relQuotes(detail).length === 0
                  ? <div className="nc-empty-mini">暂无报价单：可在勘察记录中由工程量清单一键生成，或点「去报价」手工创建</div>
                  : (
                    <table className="nc-tbl" style={{ minWidth: 620 }}>
                      <thead><tr><th style={{ width: 160 }}>报价单号</th><th style={{ width: 70 }}>版本</th><th style={{ width: 130 }} className="is-num">金额</th><th style={{ width: 90 }}>状态</th><th style={{ width: 110 }}>日期</th></tr></thead>
                      <tbody>{relQuotes(detail).map((q) => (
                        <tr key={q.id}>
                          <td><EntityLink target="quote-detail" id={q.id} go={go} title="下钻到报价详情">{q.id}</EntityLink></td>
                          <td><Tag tone="blue">{q.ver}</Tag></td>
                          <td className="is-num num">{money ? fmtWan(q.amt) : '—'}</td>
                          <td><Tag tone="orange">{q.status}</Tag></td>
                          <td className="num">{q.date}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  )}
                <div className="nc-sec-title" style={{ margin: '16px 0 8px' }}>关联投标</div>
                {relBids(detail).length === 0
                  ? <div className="nc-empty-mini">暂无关联投标：来源为「招投标」的商机可在此挂接投标记录</div>
                  : (
                    <table className="nc-tbl" style={{ minWidth: 620 }}>
                      <thead><tr><th style={{ width: 160 }}>投标编号</th><th>投标项目</th><th style={{ width: 130 }} className="is-num">投标金额</th><th style={{ width: 90 }}>状态</th><th style={{ width: 110 }}>日期</th></tr></thead>
                      <tbody>{relBids(detail).map((b) => (
                        <tr key={b.id}>
                          <td><EntityLink target="bid" id={b.id} go={go} title="下钻到投标详情">{b.id}</EntityLink></td>
                          <td>{b.name}</td>
                          <td className="is-num num">{money ? fmtWan(b.amt) : '—'}</td>
                          <td><Tag tone="blue">{b.status}</Tag></td>
                          <td className="num">{b.date}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  )}
              </div>
            )}

            {dTab === 'hist' && (
              <div style={{ marginTop: 12 }}>
                <div className="nc-cell-sub" style={{ marginBottom: 8 }}>阶段可跳选可回退，每次变更留痕（时间 / 从 / 到 / 操作人 / 说明）</div>
                <table className="nc-tbl" style={{ minWidth: 620 }}>
                  <thead><tr><th style={{ width: 110 }}>时间</th><th style={{ width: 90 }}>原阶段</th><th style={{ width: 90 }}>新阶段</th><th style={{ width: 90 }}>操作人</th><th>说明</th></tr></thead>
                  <tbody>{stageHist(detail).map((h, i) => (
                    <tr key={i}>
                      <td className="num">{h.at}</td>
                      <td>{h.from}</td>
                      <td><Tag tone={STAGE_TONE[h.to] ?? 'gray'}>{h.to}</Tag></td>
                      <td>{h.by}</td>
                      <td className="nc-cell-sub">{h.note || '—'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}

            {dTab === 'tl' && (
              <div style={{ marginTop: 12 }}>
                <Timeline items={[
                  { date: detail.signDate || TODAY, tone: 'gold', text: <>预计签约日 {detail.signDate || '待定'}</> },
                  { date: '2026-09-15', tone: 'ok', text: <>客户确认预算口径 · 报价第 {detail.quotes} 版（{detail.owner}）</> },
                  { date: '2026-09-05', tone: 'gray', text: <>完成现场勘察（{detail.owner}）· 工程量清单已登记</> },
                  { date: '2026-09-02', tone: 'gray', text: <>创建商机 · 初始阶段「推进中」（来源：{detail.customer}）</> },
                ]} />
              </div>
            )}
          </>
        )}
      </Drawer>

      {/* ============ 新建商机（L0 最少必填 / L1 选填） ============ */}
      <Modal open={addOpen} width={720} title="新建商机 · L0 最少必填" onClose={() => setAddOpen(false)}
        foot={<>
          <Btn onClick={() => setAddOpen(false)}>取消</Btn>
          <Btn onClick={() => {
            if (!nName.trim()) { toast('商机名称必填', 'err'); return; }
            setAddOpen(false); toast('草稿已保存（未提交 · 可在列表「推进中」中继续编辑）');
          }}>保存草稿</Btn>
          <Btn kind="primary" onClick={() => {
            if (!nName.trim()) { toast('商机名称必填（L0 最少必填）', 'err'); return; }
            if (!nCust) { toast('所属客户必填（L0 最少必填）', 'err'); return; }
            setAddOpen(false); setNName(''); setNNote('');
            toast(`商机已创建（编号 SJ0005xx · 初始阶段「推进中」· 概率 20% · 来源 ${nSrc}）`);
          }}>创建商机</Btn>
        </>}>
        {dupHit.length > 0 && (
          <div className="nc-warnbox is-orange">
            <b><Ico n="warning" size={16} /> 创建前请确认：</b>
            <div>
              检测到 {dupHit.length} 条相似商机（重复<b>不拦截</b>，仅黄字提醒）：
              {dupHit.slice(0, 3).map((o) => `${o.id} ${o.name}（${o.customer} · ${o.owner}）`).join('；')}
              。如为同一项目请直接跟进原商机，避免重复跟进与客户侧多头对接。
            </div>
          </div>
        )}
        <div className="nc-form-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
          <Field label="商机名称" req span={2} note="≤100 字，如：××医院住院楼消防改造工程">
            <input className="nc-input" value={nName} onChange={(e) => setNName(e.target.value)} placeholder="如 昆明万达广场消防设施改造工程" />
          </Field>
          <Field label="客户" req span={2} note="档案强校验；弹层新建后自动回填并选中">
            <div style={{ display: 'flex', gap: 8 }}>
              <select className="nc-input" value={nCust} onChange={(e) => {
                const v = e.target.value;
                if (v === '__new__') { setCustNew(true); return; }
                setNCust(v);
              }}>
                {['昆明万达广场商业管理有限公司', '曲靖市第一人民医院', '云南××置业有限公司', '昭通市第一人民医院'].map((c) => <option key={c} value={c}>{c}</option>)}
                <option value="__new__">＋ 新建客户…</option>
              </select>
              <Btn size="sm" onClick={() => setCustNew(true)}>＋ 新建客户</Btn>
            </div>
          </Field>
          <Field label="商机来源" req>
            <select className="nc-input" value={nSrc} onChange={(e) => setNSrc(e.target.value)}>
              {OPP_SRC.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="业务类型" req>
            <select className="nc-input" value={nTypeF} onChange={(e) => setNTypeF(e.target.value)}>
              {['新建', '改造', '维护保养', '检测'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="归属人" req note="默认当前登录人">
            <select className="nc-input" value={nOwner} onChange={(e) => setNOwner(e.target.value)}>
              {['蓝峰', '李思敏', '王志海', '赵薇', '刘宇', '李慧敏'].map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="业务域">
            <select className="nc-input" value={nBiz} onChange={(e) => setNBiz(e.target.value)}>
              {Object.entries(BIZ_NAME).map(([k, v]) => <option key={k} value={k}>{v} {k}</option>)}
            </select>
          </Field>
        </div>

        <div className="nc-sec-title" style={{ margin: '14px 0 8px', cursor: 'pointer' }} onClick={() => setL1Open((v) => !v)} {...pressProps(() => setL1Open((v) => !v))}>
          更多信息（L1 选填）{l1Open ? '▴' : '▾'}
        </div>
        {l1Open && (
          <div className="nc-form-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
            <Field label="预计金额（元）" note="含税；可先留空，报价后回填">
              <input className="nc-input num" value={nAmt} onChange={(e) => setNAmt(e.target.value)} placeholder="如 3200000" />
            </Field>
            <Field label="预计签约日" note="≤30 天标橙 · 已过标红">
              <input className="nc-input num" type="date" value={nSign} onChange={(e) => setNSign(e.target.value)} />
            </Field>
            <Field label="备注" span={2} note={`${nNote.length}/500 · ≤500 字`}>
              <textarea className="nc-input" rows={3} maxLength={500} value={nNote} onChange={(e) => setNNote(e.target.value)} placeholder="客户诉求、决策链、竞争态势…" />
            </Field>
          </div>
        )}
        <Banner tone="info">商机编号自动生成 <Code>SJ</Code> + 6 位流水；初始阶段「推进中」，概率 20%；L1 信息可在后续跟进中补齐。</Banner>
      </Modal>

      {/* ============ 弹层新建客户（回填并选中） ============ */}
      <Modal open={custNew} width={520} title="新建客户（弹层）" onClose={() => setCustNew(false)}
        foot={<><Btn onClick={() => setCustNew(false)}>取消</Btn>
          <Btn kind="primary" disabled={!custName.trim()} title={custName.trim() ? undefined : '请填写客户名称（必填）'} onClick={() => {
            setNCust(custName.trim()); setCustNew(false); setCustName('');
            toast(`客户「${custName.trim()}」已建档并回填选中（档案强校验通过）`);
          }}>保存并选中</Btn></>}>
        <div className="nc-warnbox is-info">客户档案强校验：名称不可与已有档案重复；弹层新建后<b>自动回填并选中</b>，无需返回客户管理页。</div>
        <div className="nc-form-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
          <Field label="客户名称" req span={2}><input className="nc-input" value={custName} onChange={(e) => setCustName(e.target.value)} placeholder="如 曲靖市第二人民医院" /></Field>
          <Field label="行业"><select className="nc-input" value={custInd} onChange={(e) => setCustInd(e.target.value)}>
            {['医疗', '商业', '教育', '工业', '政府', '住宅', '其他'].map((i) => <option key={i} value={i}>{i}</option>)}
          </select></Field>
          <Field label="地区"><select className="nc-input">{['昆明', '曲靖', '昭通', '玉溪', '楚雄', '大理'].map((r) => <option key={r}>{r}</option>)}</select></Field>
        </div>
      </Modal>

      {/* ============ 推进 / 回退阶段 ============ */}
      <Modal open={!!advOpen} width={520} title={`推进阶段：${advOpen?.stage ?? ''}`} onClose={() => setAdvOpen(null)}
        foot={<><Btn onClick={() => setAdvOpen(null)}>取消</Btn><Btn kind="primary" onClick={doAdv}>确认推进</Btn></>}>
        <div className="nc-cell-sub" style={{ marginBottom: 8 }}>阶段可跳选也可回退，变更将写入「阶段历史」并留痕。</div>
        <div className="nc-form-grid">
          <Field label="新阶段" req>
            <select className="nc-select" value={advStage} onChange={(e) => setAdvStage(e.target.value)}>
              {[...OPP_STAGES, ...OPP_TERMINAL].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="阶段概率" note="按阶段自动折算加权金额">{OPP_STAGE_PROB[advStage] ?? 0}%</Field>
          <Field label="阶段说明" req span={2} note="必填 · 写入阶段历史">
            <textarea className="nc-input" rows={3} value={advNote} onChange={(e) => setAdvNote(e.target.value)} placeholder="如：发包方立项批复，金额确认 ¥300,000" />
          </Field>
        </div>
      </Modal>

      {/* ============ 标记未中标 / 关闭 ============ */}
      <Modal open={!!loseOpen} width={480} title={`标记未中标 / 关闭 · ${loseOpen?.id || ''}`} onClose={() => setLoseOpen(null)}
        foot={<>
          <Btn onClick={() => setLoseOpen(null)}>取消</Btn>
          <Btn kind="danger" onClick={() => {
            if (!loseReason) { toast('未中标 / 关闭原因必填（用于丢标复盘）', 'err'); return; }
            setLoseOpen(null); toast('商机已标记终态（未中标 / 关闭 · 可重开并留痕）');
          }}>确认标记</Btn>
        </>}>
        <div className="nc-modal-cap"><Ico n="warning" size={16} /> 危险操作：未中标 / 关闭为终态，将停止跟进提醒并计入丢标复盘。需二次确认。</div>
        <div style={{ marginTop: 12 }}>
          <Field label="未中标 / 关闭原因" req note="必填 · 进入丢标复盘看板">
            <select className="nc-select" onChange={(e) => setLoseReason(e.target.value)} defaultValue="">
              <option value="">请选择原因</option>
              {['价格高于对手', '技术方案不满足', '客户预算取消', '关系资源不足', '工期无法满足', '资质 / 证书不达标', '其他'].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="补充说明" span={4}><textarea className="nc-textarea" placeholder="对手报价、失分点、可改进项…" /></Field>
        </div>
      </Modal>

      {/* ============ 关闭商机（必选原因） ============ */}
      <Modal open={!!closeOpen} width={480} title={`关闭商机 · ${closeOpen?.id || ''}`} onClose={() => setCloseOpen(null)}
        foot={<><Btn onClick={() => setCloseOpen(null)}>取消</Btn>
          <Btn kind="danger" disabled={!closeReason} title={closeReason ? undefined : '请先选择关闭原因，关闭后管理员可重开并留痕'} onClick={() => { setCloseOpen(null); toast(`商机已关闭（原因：${closeReason}）· 管理员可重开并留痕`); }}>确认关闭</Btn></>}>
        <div className="nc-modal-cap">关闭为终态：停止跟进提醒、退出加权金额测算；已转化的商机不可重开。</div>
        <div style={{ marginTop: 12 }}>
          <Field label="关闭原因" req note="必选 · 写入阶段历史">
            <select className="nc-select" value={closeReason} onChange={(e) => setCloseReason(e.target.value)}>
              <option value="">请选择原因</option>
              {CLOSE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
        </div>
      </Modal>

      {/* ============ 重开（管理员 · 已转化不可重开） ============ */}
      <Modal open={!!reopenOpen} width={460} title={`重开商机 · ${reopenOpen?.id || ''}`} onClose={() => setReopenOpen(null)}
        foot={<><Btn onClick={() => setReopenOpen(null)}>取消</Btn>
          <Btn kind="primary" onClick={() => { setReopenOpen(null); toast('商机已重开至「推进中」· 重开记录已留痕'); }}>确认重开</Btn></>}>
        {reopenOpen && converted[reopenOpen.id]
          ? <div className="nc-warnbox is-red"><Ico n="ban" size={16} /> 该商机已转化（项目 / 合同已生成），不可重开。</div>
          : <div className="nc-warnbox is-orange">重开后商机回到「推进中」，恢复跟进提醒并重新计入加权金额；重开记录写入阶段历史。</div>}
      </Modal>

      {/* ============ 转化为合同·项目（原子事务） ============ */}
      <Modal open={!!cvtOpen} width={620} title={`转化为合同·项目 · ${cvtOpen?.id || ''}`} onClose={() => setCvtOpen(null)}
        foot={<><Btn onClick={() => setCvtOpen(null)}>取消</Btn>
          <Btn kind="primary" onClick={() => {
            const o = cvtOpen;
            if (!o) return;
            setConverted((m) => ({ ...m, [o.id]: { xm: `XM0001${String(30 + o.id.length).slice(-2)}`, ht: `HT${TODAY.replace(/-/g, '')}-00${12 + o.id.length}` } }));
            setCvtOpen(null);
            toast('转化成功：项目已立项 + 销售合同草稿已生成（原子事务 · 商机置「待启动」）');
            go('project');
          }}>确认转化</Btn></>}>
        {cvtOpen && (
          <>
            <Banner tone="gold">单事务：同时生成<b>项目（已立项 · 商机直签）</b>与<b>销售合同草稿（报价转化）</b>；任一步失败整体回滚，不留半数据；成功后商机自动置「待启动」，且此后不可重开。</Banner>
            <div className="nc-form-grid">
              <Field label="项目档案" note="编号自动生成 XM + 6 位流水">
                <div className="nc-ctx-grid">
                  <div className="nc-ctx"><span>项目名称</span><b>{cvtOpen.name}</b></div>
                  <div className="nc-ctx"><span>立项状态</span><b>已立项（商机直签）</b></div>
                  <div className="nc-ctx"><span>负责人</span><b>{cvtOpen.owner}</b></div>
                  <div className="nc-ctx"><span>客户</span><b>{cvtOpen.customer}</b></div>
                </div>
              </Field>
              <Field label="销售合同草稿" note="编号自动生成 HT + 日期 + 4 位流水">
                <div className="nc-ctx-grid">
                  <div className="nc-ctx"><span>合同名称</span><b>{cvtOpen.name}</b></div>
                  <div className="nc-ctx"><span>合同金额</span><b className="num">{money ? fmtWan(cvtOpen.amt || 0) : '—'}</b></div>
                  <div className="nc-ctx"><span>金额来源</span><b>报价转化（与报价差额进变更台账）</b></div>
                  <div className="nc-ctx"><span>关联项目</span><b>自动生成</b></div>
                </div>
              </Field>
              <Field label="唯一约束" span={2} note="一个商机仅可转化一次">
                <div className="nc-cell-sub">{converted[cvtOpen.id] ? ' 该商机已转化，不可重复转化' : ' 未转化，可执行' }</div>
              </Field>
            </div>
          </>
        )}
      </Modal>

      {/* ============ 去报价 ============ */}
      <Modal open={!!quoteOpen} width={520} title={`创建报价 · ${quoteOpen?.name || ''}`} onClose={() => setQuoteOpen(null)}
        foot={<>
          <Btn onClick={() => setQuoteOpen(null)}>取消</Btn>
          <Btn kind="primary" onClick={() => { setQuoteOpen(null); toast('已创建报价草稿，已载入报价工作台'); go('quote-edit'); }}>创建并编辑</Btn>
        </>}>
        <Banner tone="info">创建报价将预填客户与商机信息，自动生成 <Code>BJ</Code> + 日期 + 4 位流水编号，初始状态「草稿」。也可在「勘察记录」中由工程量清单一键生成。</Banner>
        <div className="nc-form-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)', marginTop: 12 }}>
          <Field label="报价名称" req span={2}><input className="nc-input" defaultValue={quoteOpen ? `${quoteOpen.name}报价` : ''} /></Field>
          <Field label="税率口径" req note="含税 9%（建筑业）/ 13% / 6%（服务）">
            <select className="nc-select"><option>含税 9%（建筑业）</option><option>含税 13%</option><option>含税 6%（服务）</option><option>不含税 6%</option><option>不含税 13%</option></select>
          </Field>
          <Field label="区域上浮" note="默认云南 +3%，可一键批量应用">
            <select className="nc-select"><option>不上浮</option><option>云南 +3%</option><option>广西 +3%</option></select>
          </Field>
        </div>
      </Modal>

      {/* ============ 勘察记录（新增 / 只读查看） ============ */}
      <Modal open={!!svyOpen} width={900} title={svyOpen?.s ? `勘察记录 · ${svyOpen.s.id}` : '新增勘察记录'} onClose={() => setSvyOpen(null)}
        foot={svyOpen?.s?.quoteId
          ? <>
            <span className="nc-cell-sub"><Ico n="lock" size={16} /> 已生成报价 {svyOpen.s.quoteId} · 锁定只读（修改请新建一条）</span>
            <Btn onClick={() => setSvyOpen(null)}>关闭</Btn>
            <Btn kind="primary" onClick={() => svyOpen && openSvy(svyOpen.o, null)}>＋ 新建一条勘察</Btn>
          </>
          : <>
            <span className="nc-cell-sub">照片自动加时间 / 定位水印 · 工程量行 ≤100 行</span>
            <Btn onClick={() => setSvyOpen(null)}>取消</Btn>
            <Btn onClick={saveSvy}>保存勘察</Btn>
            <Btn kind="primary" onClick={genQuote}>生成报价单（预填工程量）</Btn>
          </>}>
        {svyOpen && (
          <>
            <div className="nc-form-grid" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
              <Field label="勘察时间" req note="不可晚于当前时间">
                <input className="nc-input num" type="date" value={svyForm.at} disabled={!!svyOpen.s?.quoteId} onChange={(e) => setSvyForm((f) => ({ ...f, at: e.target.value }))} />
              </Field>
              <Field label="系统类别" req>
                <select className="nc-select" value={svyForm.sys} disabled={!!svyOpen.s?.quoteId} onChange={(e) => setSvyForm((f) => ({ ...f, sys: e.target.value }))}>
                  <option value="">请选择</option>{SYS_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="勘察人员" req span={2} note={`已选 ${svyForm.persons.length} / 5 人`}>
                <div className="nc-pick-inline">
                  {['蓝峰', '李思敏', '王志海', '赵薇', '刘宇', '李慧敏', '徐工'].map((p) => (
                    <span key={p} className={`nc-pick-chip${svyForm.persons.includes(p) ? ' is-on' : ''}`} onClick={() => !svyOpen.s?.quoteId && togglePerson(p)} {...pressProps(() => !svyOpen.s?.quoteId && togglePerson(p))}>{p}</span>
                  ))}
                </div>
              </Field>
              <Field label="勘察描述" req span={2} note={`${svyForm.desc.length} 字（10~1000）`}>
                <textarea className="nc-input" rows={3} value={svyForm.desc} disabled={!!svyOpen.s?.quoteId} onChange={(e) => setSvyForm((f) => ({ ...f, desc: e.target.value }))} placeholder="现场情况、既有系统型号、改造难点…" />
              </Field>
              <Field label="现场照片" note="≤9 张 · 自动加时间 / 定位水印">
                <input className="nc-input" type="file" multiple disabled={!!svyOpen.s?.quoteId} />
              </Field>
            </div>

            <div className="nc-sec-title" style={{ margin: '14px 0 8px' }}>工程量清单（≤100 行 · 数量 &gt; 0 · ≤3 位小数）</div>
            <table className="nc-tbl" style={{ minWidth: 640 }}>
              <thead><tr><th style={{ width: 40 }} className="is-num">#</th><th>名称（≤50）</th><th style={{ width: 80 }}>单位</th><th style={{ width: 110 }} className="is-num">数量</th><th>备注</th><th style={{ width: 70 }}>操作</th></tr></thead>
              <tbody>
                {svyForm.rows.map((r, i) => (
                  <tr key={i}>
                    <td className="is-num">{i + 1}</td>
                    <td><input className="nc-input" value={r.n} maxLength={50} disabled={!!svyOpen.s?.quoteId} onChange={(e) => setRow(i, 'n', e.target.value)} /></td>
                    <td><input className="nc-input" value={r.u} disabled={!!svyOpen.s?.quoteId} onChange={(e) => setRow(i, 'u', e.target.value)} /></td>
                    <td><input className="nc-input num" value={r.q} disabled={!!svyOpen.s?.quoteId} onChange={(e) => setRow(i, 'q', e.target.value)} /></td>
                    <td><input className="nc-input" value={r.r} disabled={!!svyOpen.s?.quoteId} onChange={(e) => setRow(i, 'r', e.target.value)} /></td>
                    <td><Op danger disabled={!!svyOpen.s?.quoteId || svyForm.rows.length <= 1} onClick={() => setSvyForm((f) => ({ ...f, rows: f.rows.filter((_, ix) => ix !== i) }))}>删除</Op></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!svyOpen.s?.quoteId && svyForm.rows.length < 100 && (
              <Btn size="sm" onClick={() => setSvyForm((f) => ({ ...f, rows: [...f.rows, { n: '', u: '个', q: '', r: '' }] }))}>＋ 新增工程量行</Btn>
            )}
          </>
        )}
      </Modal>
    </>
  );
}

/* ============ 在谈项目档案：决策链 / 竞争 / 优势 / 下一步（按行业派生） ============ */
const CHAIN_BY_IND: Record<string, string> = {
  医疗: '后勤处 → 分管副院长 → 院长办公会',
  商业: '工程部 → 区域运营总监 → 集团采购中心',
  教育: '后勤基建处 → 分管副校长 → 校长办公会',
  工业: '安全环保部 → 生产副总 → 总经理办公会',
  政府: '使用单位 → 主管机关 → 公共资源交易中心',
  住宅: '项目部 → 成本部 → 区域总',
};
const chainText = (o: O) => CHAIN_BY_IND[o.industry] || '使用部门 → 分管领导 → 决策会';
const compText = (o: O) => (o.amt >= 3000000
  ? '本地 2 家同类企业 + 1 家省外一级资质企业（价格战）'
  : '本地 2 家（无壹级消防专包资质）');
const advText = (o: O) => `贰级消防专包 + ${o.industry}同类业绩 ${2 + (o.quotes || 0)} 例 · 本地化服务响应 ≤4 小时`;
const nextText = (o: O) => (o.stage === '推进中'
  ? '现场勘察 + 技术交流，输出工程量清单'
  : o.stage === '重点'
    ? '推动甲方立项确认，锁定预算范围与技术口径'
    : o.stage === '甲方立项确认'
      ? '深化技术方案并递交报价，进入商务谈判'
      : o.stage === '商务谈判'
        ? '合同条款评审 + 走转化为合同·项目'
        : '已中标，按项目履约计划推进');

function daysUntil(d: string) {
  const t = new Date(`${d}T00:00:00`).getTime();
  const now = new Date('2026-09-20T00:00:00').getTime();
  return Math.round((t - now) / 86400000);
}
