// 商机管理（列表 + 看板双视图）
// 状态机（4 档收敛口径 · 2026-09-23 拍板）：意向 10% → 方案报价 50%（预计金额开始必填）→ 投标 70%（按单启用）→ 签约 100% → 终态
// 阶段模板可配置：阶段名与权重读 store（系统设置 · 业务字典 · 商机阶段），增删 / 排序 / 改权重即时全站生效
// 阶段权重（默认值）：意向 10% / 方案报价 50% / 投标 70%（按单启用，须有投标单）/ 签约 100%；加权金额 = 金额 × 权重
// gate 分界线（默认「方案报价」）：进入起预计金额必填。转化不受阶段限制 —— 由赢单动作触发，不做阶段前置校验
// 状态（与阶段正交）：跟进中 / 赢单 / 输单 —— 终态由 status 承载，输单必填原因（价格 / 关系 / 资质 / 其他）
// 投标只作商机进度标记：关联投标数由 BIDS[].opp 派生，投标单据本身归 BidPage 管理，不重复建单
// 复刻「商机管理.html」补齐：勘察记录（含工程量清单 · 生成报价后锁定只读）· 关联报价 / 投标 / 阶段历史
// · 转化为合同·项目（同步生成）· 赢单 / 输单 · 重开（管理员 · 已转化不可重开）· 阶段可跳选可回退
import React, { useEffect, useMemo, useState } from 'react';
import {
  Banner, Btn, Card, ChainBar, DataTable, Drawer, EntityLink, Field, KvGrid, ListToolbar, Modal,
  Op, OpNone, OpSep, PageHead, TableFoot, Tag, Tabs, Timeline, Tile, Tip, useToast, Code, IdCell, pressProps,} from '../components/ui';
import {
  OPP_STATUS, LOSE_REASONS, isBidClosed, isOppClosed, fmtWan, canSeeMoney, TODAY, oppStageTone,
} from '../components/data';
import {
  consumeFocus, setFocus, subscribeStore, getOpps, getOppLogs, getOppClose,
  getOppStages, getOppStageIdx, getOppGateIdx, getOppStageWeight, getOppBids,
  moveOpp, closeOpp, reopenOpp,
} from '../components/store';
import { Ico } from '../components/icons';

const STATUS_TONE: Record<string, 'blue' | 'green' | 'red'> = { 跟进中: 'blue', 赢单: 'green', 输单: 'red' };
const BIZ_NAME: Record<string, string> = { GC: '消防工程', WB: '维护保养', JC: '检测', RJ: '软件研发', QT: '其他' };
const SYS_TYPES = ['火灾自动报警系统', '自动喷淋灭火系统', '防排烟系统', '应急照明与疏散', '气体灭火系统', '消防水系统', '全系统'];
/** 商机来源（FR-OPP-003） */
const OPP_SRC = ['转介绍', '招投标', '自拓', '老客户复购', '其他'];
const SORT_OPTS = ['最近推进倒序', '金额从高到低', '金额从低到高', '预计签约日最近'];
type O = ReturnType<typeof getOpps>[number];

/* ============================ 勘察记录 ============================ */
type QtyRow = { n: string; u: string; q: string; r: string };
type Svy = {
  id: string; at: string; persons: string[]; sys: string; desc: string;
  photos: number; rows: QtyRow[]; quoteId?: string;
};
/** 已过 gate（默认「方案报价」）的商机，默认有一条已生成报价的勘察（锁定只读） */
const svySeed = (o: O): Svy[] => (getOppStageIdx(o.stage) >= getOppGateIdx() ? [{
  id: `SRV-2026-${o.id.slice(-3)}`, at: '2026-09-05', persons: [o.owner], sys: '火灾自动报警系统 / 自动喷淋',
  desc: '现场踏勘：主机房 2 处、报警回路 24 路；喷洒头原型号 ZSTX-15 老化需全部更换；消防泵房设备需同步改造；弱电井桥架可利用。',
  photos: 4,
  rows: [
    { n: '点型感烟火灾探测器', u: '只', q: '860', r: '含底座' },
    { n: '喷洒头 ZSTX-15/68℃', u: '个', q: '1240', r: '下垂型' },
    { n: '火灾报警控制器（联动型）', u: '台', q: '4', r: '2 回路' },
    { n: '消防水泵接合器 SQD150-A', u: '套', q: '6', r: '含止回阀' },
  ],
  quoteId: 'BJ000011',
}] : []);

/** 关联报价：按商机派生的示意数据（多版本口径，与列表「报价 N 版」同源） */
const relQuotes = (o: O) => o.quotes > 0
  ? [{ id: 'BJ000011', ver: 'V2', amt: 4800000, status: '待审批', date: o.last }]
  : [];
/** 关联投标：取 BIDS 中 opp 外键指向本商机且仍在途的记录（投标单据归 BidPage 管理） */
const relBids = (o: O) => getOppBids(o.id);

export default function OppPage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  const money = canSeeMoney(role);
  const isAdmin = role === 'boss' || role === 'admin' || role === '超级管理员';

  const [view, setView] = useState<'list' | 'kanban'>('list');
  /* 商机主数据走共享 store：推进阶段 / 赢单 / 输单 / 重开均真实回流列表、看板、筛选计数与详情。
     阶段模板同源订阅：设置页增删 / 排序 / 改权重后，本页筛选 chips、看板列、推进弹窗与加权金额即时跟随。 */
  const [opps, setOpps] = useState<O[]>(getOpps);
  /* 阶段模板本体（含权重 / gate）与阶段名数组分开：模板可配，阶段名供筛选 / 看板 / 下拉直接使用 */
  const [tpl, setTpl] = useState(getOppStages);
  useEffect(() => subscribeStore(() => { setOpps(getOpps()); setTpl(getOppStages()); }), []);
  const stages = useMemo(() => tpl.map((s) => s.name), [tpl]);
  /** gate 序号：金额必填分界线（与 store.getOppGateIdx 同源，避免两处派生逻辑漂移） */
  const gateIdx = useMemo(() => getOppGateIdx(), [tpl]);
  const stageW = getOppStageWeight;
  const idxOf = getOppStageIdx;
  const [stage, setStage] = useState('全部');
  const [statusF, setStatusF] = useState('全部');
  const [type, setType] = useState('全部');
  const [kw, setKw] = useState('');
  const [owner, setOwner] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [detail, setDetail] = useState<O | null>(null);
  const [dTab, setDTab] = useState('overview');
  const [addOpen, setAddOpen] = useState(false);
  /* 赢单 / 输单（终态）：输单必填原因，可填竞争对手 */
  const [loseOpen, setLoseOpen] = useState<O | null>(null);
  const [loseStatus, setLoseStatus] = useState<'赢单' | '输单'>('输单');
  const [loseReason, setLoseReason] = useState('');
  const [loseCompetitor, setLoseCompetitor] = useState('');
  const [quoteOpen, setQuoteOpen] = useState<O | null>(null);
  /* ---- 新增：阶段推进（可跳选可回退） / 重开 / 转化 / 勘察 ---- */
  const [advOpen, setAdvOpen] = useState<O | null>(null);
  const [advStage, setAdvStage] = useState('');
  const [advNote, setAdvNote] = useState('');
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
    return opps.filter((o) => o.name.includes(k) || k.includes(o.name.slice(0, 8)));
  }, [nName]);

  const rows = useMemo(() => {
    const list = opps.filter((o) =>
      (stage === '全部' || o.stage === stage) && (statusF === '全部' || o.status === statusF) &&
      (type === '全部' || o.type === type) &&
      (!owner || o.owner === owner) && (!kw || (o.name + o.customer + o.id).includes(kw)) &&
      (!amtMin || o.amt >= Number(amtMin) * 10000) && (!amtMax || o.amt <= Number(amtMax) * 10000) &&
      (!from || o.last >= from) && (!to || o.last <= to));
    const arr = [...list];
    if (sort === '最近推进倒序') arr.sort((a, b) => b.last.localeCompare(a.last));
    else if (sort === '金额从高到低') arr.sort((a, b) => b.amt - a.amt);
    else if (sort === '金额从低到高') arr.sort((a, b) => a.amt - b.amt);
    else arr.sort((a, b) => (a.signDate || '9999').localeCompare(b.signDate || '9999'));
    return arr;
  }, [stage, statusF, type, owner, kw, amtMin, amtMax, from, to, sort]);

  const paged = rows.slice((page - 1) * pageSize, page * pageSize);
  const active = opps.filter((o) => !isOppClosed(o));
  const weighted = active.reduce((s, o) => s + o.amt * (stageW(o.stage) || 0) / 100, 0);
  const svyOf = (o: O) => svyMap[o.id] ?? svySeed(o);
  /** 阶段历史：store 里的真实留痕在前，无留痕时回落到按当前阶段推导的示意链 */
  const histOf = (o: O) => {
    const real = getOppLogs(o.id);
    if (real.length) return real;
    const cur = idxOf(o.stage);
    return stages.slice(0, Math.max(cur + 1, 1)).reverse().map((s, i, arr) => ({
      at: o.last, from: arr[i + 1] || '—', to: s, by: o.owner,
      note: i === 0 ? '最近一次推进' : '',
    }));
  };

  /**
   * 跨页穿透：从客户 / 报价 / 项目等页面下钻进来时，自动打开目标商机详情。
   * 以 nav（路由脉冲）为依赖，保证反复下钻同一页也能重新定位。
   */
  useEffect(() => {
    const id = consumeFocus('opp');
    if (!id) return;
    const hit = opps.find((o) => o.id === id);
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
    /* 金额闸口：阶段 ≥ gate（默认「方案报价」）起预计金额必填。
       转化不受阶段限制（由赢单动作触发），故此处只校验金额，不再校验转化资格。
       终态商机（赢单 / 输单）已由按钮隐藏，不可再推进阶段。 */
    if (idxOf(advStage) >= gateIdx && !o.amt) { toast(`推进到「${stages[gateIdx]}」起预计金额必填 · 请先在商机详情就地补填`, 'err'); return; }
    /* requireBid 门控（按单启用）：投标阶段须先发起关联投标单，否则不允许推进 */
    const advTpl = tpl.find((x) => x.name === advStage);
    if (advTpl?.requireBid && getOppBids(o.id).length === 0) { toast(`推进到「${advStage}」须先发起关联投标单 · 请前往投标管理新建投标`, 'err'); return; }
    moveOpp(o.id, advStage, advNote.trim(), o.owner);
    toast(`阶段已推进：${o.stage} → ${advStage}（权重 ${stageW(advStage)}% · 说明：${advNote.trim()}）`);
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
        badges={<><Tag tone="gray">{stages.length} 阶段推进</Tag><Tag tone="blue">阶段可配置</Tag></>}
        actions={<>
          <Btn onClick={() => toast('商机列表已导出 CSV（含阶段 / 金额 / 权重 / 加权金额）')}>⇩ 导出 CSV</Btn>
          <Btn kind="primary" onClick={() => setAddOpen(true)}>＋ 新建商机</Btn>
        </>}
      />

      <div className="nc-tiles nc-tiles-5">
        <div className="nc-tile"><div className="nc-tile-label">在谈商机</div><div className="nc-tile-value">{active.length}</div><div className="nc-tile-sub">不含赢单 / 输单</div></div>
        <div className="nc-tile"><div className="nc-tile-label">在谈金额</div><div className="nc-tile-value nc-v-blue">{money ? fmtWan(active.reduce((s, o) => s + o.amt, 0)) : '—'}</div><div className="nc-tile-sub">含税未折权重</div></div>
        <Tile label="加权金额" tone="orange" value={money ? fmtWan(weighted) : '—'} sub="用于经营测算"
          tip={<>
            <b>加权金额 = 金额 × 阶段权重</b><br />
            {stages.map((s) => `${s} ${stageW(s)}%`).join(' · ')}<br />
            权重在「系统设置 · 业务字典 · 商机阶段」维护，调整后加权预测即时重算。
          </>} />
        <Tile label={stages[stages.length - 1]} value={active.filter((o) => o.stage === stages[stages.length - 1]).length} sub="在谈 · 可转合同 / 项目"
          tip={<>
            <b>阶段推进规则</b><br />
            {stages.map((s, i) => (i === gateIdx ? `${s}（金额开始必填）` : s)).join(' → ')}<br />
            此卡只计「跟进中」的商机：终态（赢单 / 输单）的阶段冻结在末档，不计入可转合同口径。<br />
            赢单后可一键转报价或转合同草稿，<b>转化不受阶段限制</b>。<br />
            推进 / 回退须填说明并留痕；赢单 / 输单为终态（输单必填原因）；终态仅管理员可重开，已转化不可重开；勘察生成报价后锁定只读（修改 = 新建一条）。
          </>} />
        <div className="nc-tile"><div className="nc-tile-label">超 14 天未跟进</div><div className="nc-tile-value nc-v-red">{opps.filter((o) => o.lastDays > 14 && !isOppClosed(o)).length}</div><div className="nc-tile-sub">需立即跟进</div></div>
      </div>

      <Card flush>
        <ListToolbar
          rows={[
            {
              label: '阶段', value: stage, onChange: (k) => { setStage(k); setPage(1); },
              items: [
                { key: '全部', label: '全部阶段', cnt: opps.length },
                ...stages.map((s) => ({ key: s, label: s, cnt: opps.filter((o) => o.stage === s).length })),
              ],
            },
            {
              label: '状态', value: statusF, onChange: (k) => { setStatusF(k); setPage(1); },
              items: [
                { key: '全部', label: '全部状态', cnt: opps.length },
                ...OPP_STATUS.map((s) => ({ key: s, label: s, cnt: opps.filter((o) => o.status === s).length })),
              ],
            },
            {
              label: '类型', value: type, onChange: (k) => { setType(k); setPage(1); },
              items: [
                { key: '全部', label: '全部类型', cnt: opps.length },
                ...['新建', '改造', '维护保养', '检测'].map((t) => ({ key: t, label: t, cnt: opps.filter((o) => o.type === t).length })),
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
              setStage('全部'); setStatusF('全部'); setType('全部'); setKw(''); setOwner(''); setAmtMin(''); setAmtMax(''); setFrom(''); setTo(''); setSort(SORT_OPTS[0]); setPage(1); toast('筛选已重置');
            }}>重置</Btn>
          </>}
        />
      </Card>

      {view === 'list' ? (
        <Card flush>
            <DataTable<O>
              minWidth={1600}
              cols={[
                { key: 'id', title: '商机编号', width: 104, render: (o) => <IdCell onClick={() => { setDetail(o); setDTab('overview'); }} title="查看商机详情">{o.id}</IdCell> },
                { key: 'name', title: '商机名称', width: 220, render: (o) => (<div><div className="nc-td-main">{o.name}{converted[o.id] && <Tag tone="green">已转化</Tag>}</div><div className="nc-td-sub">{BIZ_NAME[o.biz]} · {o.type} · 报价 {o.quotes} 版</div></div>) },
                { key: 'customer', title: '客户', width: 165, render: (o) => <span>{o.customer}</span> },
                { key: 'stage', title: '阶段', width: 82, render: (o) => <Tag tone={oppStageTone(idxOf(o.stage))}>{o.stage}</Tag> },
                { key: 'status', title: '状态', width: 78, render: (o) => <Tag tone={STATUS_TONE[o.status]}>{o.status}</Tag> },
                { key: 'prob', title: '权重', width: 64, align: 'right', render: (o) => <span className="num">{stageW(o.stage)}%</span> },
                { key: 'amt', title: '预计金额', width: 118, align: 'right', render: (o) => <b className="num">{money ? (o.amt ? fmtWan(o.amt) : '待定') : '—'}</b> },
                { key: 'w', title: '加权金额', width: 112, align: 'right', render: (o) => <span className="num" style={{ color: 'var(--c-warning-deep)' }}>{money ? fmtWan(o.amt * (stageW(o.stage) || 0) / 100) : '—'}</span> },
                { key: 'signDate', title: '预计签约', width: 106, render: (o) => o.signDate ? <span className={`num ${daysUntil(o.signDate) < 0 ? 'nc-v-red' : daysUntil(o.signDate) <= 30 ? 'nc-v-orange' : ''}`}>{o.signDate}</span> : <span style={{ color: 'var(--ink-3)' }}>待定</span> },
                { key: 'bids', title: '关联投标', width: 88, align: 'right', render: (o) => { const n = relBids(o).length; return n ? <span className="num">{n} 项</span> : <span style={{ color: 'var(--ink-3)' }}>—</span>; } },
                { key: 'owner', title: '归属人', width: 76 },
                { key: 'last', title: '最近跟进', width: 102, render: (o) => <span className="num" style={{ color: o.lastDays > 14 ? 'var(--c-danger)' : undefined }}>{o.last}{o.lastDays > 14 ? <> <Ico n="warning" size={12} style={{ color: 'var(--c-warning-mid)' }} /></> : null}</span> },
                {
                  key: 'ops', title: '操作', width: 200, render: (o) => (
                    <span className="nc-ops" onClick={(e) => e.stopPropagation()}>
                      <Op onClick={() => { setDetail(o); setDTab('overview'); }}>详情</Op><OpSep />
                      {/* 生成报价不再受阶段限制（转化由赢单动作触发），只排除已终态的商机。
                          不可用时用 OpNone 占住槽位，保证操作列跨行对齐（与投标页同约定）。 */}
                      {!isOppClosed(o)
                        ? <Op gold onClick={() => setQuoteOpen(o)}>去报价</Op>
                        : <OpNone title="商机已结束，不可生成报价" />}
                      <Op onClick={() => openAdv(o)}>推进</Op>
                      {!isOppClosed(o) && <><OpSep /><Op danger onClick={() => { setLoseOpen(o); setLoseStatus('输单'); setLoseReason(''); setLoseCompetitor(''); }}>标记结果</Op></>}
                    </span>
                  ),
                },
              ]}
              rows={paged} rowKey={(o) => o.id} onRowClick={(o) => { setDetail(o); setDTab('overview'); }}
              rowClass={(o) => (isOppClosed(o) ? 'nc-row-dead' : '')}
              foot={<TableFoot total={opps.length} filtered={rows.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />}
            />
        </Card>
      ) : (
        <Card>
          <div className="nc-listhint nc-kanban-hint">看板列 = 商机阶段模板，共 {stages.length} 列，由左至右推进；列头显示卡片数与金额合计。<Tip text="点击卡片打开商机详情，在详情内推进阶段；窄屏下横向滑动查看全部阶段。赢单 / 输单的商机停留在最后所处阶段列，以状态标签区分；赢单后可在详情内一键转报价或转合同·项目。阶段模板可在「系统设置 · 业务字典 · 商机阶段」增删 / 排序 / 改权重，改完本页列数即时跟随。" /></div>
          <div className="nc-kanban">
            {stages.map((s, si) => {
              const list = opps.filter((o) => o.stage === s);
              const sum = list.reduce((a, o) => a + o.amt, 0);
              return (
                <div className="nc-kb-col" key={s}>
                  <div className="nc-kb-hd">
                    <Tag tone={oppStageTone(si)}>{s}</Tag>
                    <span className="nc-kb-cnt">{list.length}{money && sum ? ` · ${fmtWan(sum)}` : ''}</span>
                  </div>
                  <div className="nc-kb-cards">
                    {list.map((o) => (
                      <div className="nc-kb-card" key={o.id} onClick={() => { setDetail(o); setDTab('overview'); }} {...pressProps(() => { setDetail(o); setDTab('overview'); })}>
                        <div className="nc-kb-id num">{o.id}</div>
                        <div className="nc-kb-name">{o.name}</div>
                        <div className="nc-kb-cust"><EntityLink target="customer" id={o.customerId} go={go} title="下钻到客户档案">{o.customer}</EntityLink></div>
                        <div className="nc-kb-amt num">{money ? (o.amt ? fmtWan(o.amt) : '待定') : '—'}</div>
                        <div className="nc-kb-chips">
                          <Tag tone="gray">{o.type}</Tag>
                          <Tag tone="blue">{stageW(o.stage)}%</Tag>
                          {o.status !== '跟进中' && <Tag tone={STATUS_TONE[o.status]}>{o.status}</Tag>}
                          {o.lastDays > 14 && !isOppClosed(o) && <Tag tone="red"><Ico n="warning" size={16} /> {o.lastDays} 天未跟进</Tag>}
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
      <Drawer open={!!detail} width={800} title={detail?.name || ''}
        sub={detail && <span className="num">{detail.id} · {BIZ_NAME[detail.biz]} · {detail.type} · 归属 {detail.owner}</span>}
        onClose={() => setDetail(null)}
        foot={<>
          {detail && !isOppClosed(detail) && (
            <Btn onClick={() => { setLoseOpen(detail); setLoseStatus('输单'); setLoseReason(''); setLoseCompetitor(''); setDetail(null); }}>赢单 / 输单</Btn>
          )}
          {detail && isOppClosed(detail) && (
            isAdmin
              ? <Btn onClick={() => { setReopenOpen(detail); setDetail(null); }}>重开</Btn>
              : <Btn disabled title="仅管理员可重开；已转化不可重开">重开</Btn>
          )}
          {/* 生成报价 / 转化均不再受阶段限制（转化由赢单动作触发）；终态只剩「重开」。
              「一个商机仅可转化一次」由 !converted 承载，与阶段无关，必须保留。 */}
          {detail && !isOppClosed(detail) && (
            <Btn onClick={() => { setQuoteOpen(detail); setDetail(null); }}>去报价</Btn>
          )}
          {detail && !converted[detail.id] && !isOppClosed(detail) && (
            <Btn kind="primary" onClick={() => { setCvtOpen(detail); setDetail(null); }}>转化为合同·项目</Btn>
          )}
          {detail && !isOppClosed(detail) && (
            <Btn kind="primary" onClick={() => { openAdv(detail); setDetail(null); }}>推进 / 回退阶段</Btn>
          )}
        </>}>
        {detail && (
          <>
            <Tabs value={dTab} onChange={setDTab} items={[
              { key: 'overview', label: '概览' },
              { key: 'srv', label: '勘察记录', cnt: svyOf(detail).length },
              { key: 'rel', label: '关联', cnt: relQuotes(detail).length + relBids(detail).length },
              { key: 'hist', label: '阶段历史', cnt: histOf(detail).length },
              { key: 'tl', label: '流转记录' },
            ]} />

            {dTab === 'overview' && (
              <div style={{ marginTop: 12 }}>
                <ChainBar nodes={stages.map((s, i) => {
                  const cur = idxOf(detail.stage);
                  return { label: s, sub: `${stageW(s)}%`, state: (i < cur ? 'done' : i === cur ? 'cur' : 'todo') as 'done' | 'cur' | 'todo' };
                })} />
                <div className="nc-tiles nc-tiles-3" style={{ margin: '14px 0' }}>
                  <div className="nc-tile"><div className="nc-tile-label">预计金额（含税）</div><div className="nc-tile-value nc-v-blue">{money ? (detail.amt ? fmtWan(detail.amt) : '待定') : '—'}</div><div className="nc-tile-sub">报价 {detail.quotes} 版</div></div>
                  <div className="nc-tile"><div className="nc-tile-label">加权金额</div><div className="nc-tile-value nc-v-orange">{money ? fmtWan(detail.amt * (stageW(detail.stage) || 0) / 100) : '—'}</div><div className="nc-tile-sub">金额 × {stageW(detail.stage)}%</div></div>
                  <div className="nc-tile"><div className="nc-tile-label">预计签约日</div><div className="nc-tile-value" style={{ fontSize: 16 }}>{detail.signDate || '待定'}</div><div className="nc-tile-sub">{detail.signDate ? `距今 ${daysUntil(detail.signDate)} 天` : '—'}</div></div>
                </div>
                <div className="nc-sec-title" style={{ marginBottom: 12 }}>商机信息</div>
                <KvGrid cols={2} rows={[
                  { k: '商机编号', v: <span className="num">{detail.id}</span> },
                  { k: '所属客户', v: <EntityLink target="customer" id={detail.customerId} go={go} title="下钻到客户档案">{detail.customer}</EntityLink> },
                  { k: '业务域', v: BIZ_NAME[detail.biz] },
                  { k: '业务类型', v: detail.type },
                  { k: '当前阶段', v: <><Tag tone={oppStageTone(idxOf(detail.stage))}>{detail.stage}</Tag> <span className="nc-muted nc-tiny">第 {idxOf(detail.stage) + 1} / {stages.length} 档</span></> },
                  { k: '阶段权重', v: `${stageW(detail.stage)}%` },
                  { k: '状态', v: <Tag tone={STATUS_TONE[detail.status]}>{detail.status}</Tag> },
                  { k: '行业', v: detail.industry },
                  { k: '归属人', v: detail.owner },
                  { k: '最近跟进', v: <span className="num" style={{ color: detail.lastDays > 14 ? 'var(--c-danger)' : undefined }}>{detail.last}（{detail.lastDays} 天前）{detail.lastDays > 14 ? <> <Ico n="warning" size={12} style={{ color: 'var(--c-warning-mid)' }} /></> : null}</span> },
                  { k: '转化记录', v: converted[detail.id] ? <span>项目 <EntityLink target="project-center" id={converted[detail.id].xm} go={go} title="下钻到项目经营中心">{converted[detail.id].xm}</EntityLink> · 合同 <EntityLink target="contract" id={converted[detail.id].ht} go={go} title="下钻到合同详情">{converted[detail.id].ht}</EntityLink></span> : <span style={{ color: 'var(--ink-3)' }}>未转化</span> },
                  { k: '输单复盘', v: detail.status === '输单' ? <span>原因：{detail.loseReason || '—'}{detail.loseCompetitor ? ` · 对手：${detail.loseCompetitor}` : ''}</span> : <span style={{ color: 'var(--ink-3)' }}>—</span> },
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
                <div className="nc-sec-title" style={{ margin: '16px 0 8px' }}>关联投标<span className="nc-muted nc-tiny" style={{ marginLeft: 8 }}>投标不进商机阶段，由独立投标模块承载；此处只挂关联</span></div>
                {relBids(detail).length === 0
                  ? <div className="nc-empty-mini">暂无关联投标：投标单的 opp 字段指向本商机时自动出现在此处，商机侧只统计数量</div>
                  : (
                    <table className="nc-tbl" style={{ minWidth: 620 }}>
                      <thead><tr><th style={{ width: 160 }}>投标编号</th><th>投标项目</th><th style={{ width: 130 }} className="is-num">投标金额</th><th style={{ width: 90 }}>阶段</th><th style={{ width: 110 }}>开标日</th></tr></thead>
                      <tbody>{relBids(detail).map((b) => (
                        <tr key={b.id}>
                          <td><EntityLink target="bid" id={b.id} go={go} title="下钻到投标详情">{b.id}</EntityLink></td>
                          <td>{b.name}</td>
                          <td className="is-num num">{money ? fmtWan(b.amt) : '—'}</td>
                          <td><Tag tone={isBidClosed(b) ? (b.stage === '中标' ? 'green' : 'red') : 'blue'}>{b.stage}</Tag></td>
                          <td className="num">{b.openDate}</td>
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
                  <tbody>{histOf(detail).map((h, i) => (
                    <tr key={i}>
                      <td className="num">{h.at}</td>
                      <td>{h.from}</td>
                      <td><Tag tone={oppStageTone(idxOf(h.to))}>{h.to}</Tag></td>
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
                  { date: '2026-09-02', tone: 'gray', text: <>创建商机 · 初始阶段「{stages[0]}」（来源：{detail.customer}）</> },
                ]} />
              </div>
            )}
          </>
        )}
      </Drawer>

      {/* ============ 新建商机（L0 最少必填 / L1 选填） ============ */}
      <Drawer open={addOpen} width={840} title="新建商机 · L0 最少必填" onClose={() => setAddOpen(false)}
        foot={<>
          <Btn onClick={() => setAddOpen(false)}>取消</Btn>
          <Btn onClick={() => {
            if (!nName.trim()) { toast('商机名称必填', 'err'); return; }
            setAddOpen(false); toast(`草稿已保存（未提交 · 可在列表「${stages[0]}」中继续编辑）`);
          }}>保存草稿</Btn>
          <Btn kind="primary" onClick={() => {
            if (!nName.trim()) { toast('商机名称必填（L0 最少必填）', 'err'); return; }
            if (!nCust) { toast('所属客户必填（L0 最少必填）', 'err'); return; }
            setAddOpen(false); setNName(''); setNNote('');
            toast(`商机已创建（编号 SJ0005xx · 初始阶段「${stages[0]}」· 权重 ${stageW(stages[0])}% · 来源 ${nSrc}）`);
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
        <Banner tone="info">商机编号自动生成 <Code>SJ</Code> + 6 位流水；初始阶段「{stages[0]}」（权重 {stageW(stages[0])}%）；L1 信息可在后续跟进中补齐。</Banner>
      </Drawer>

      {/* ============ 弹层新建客户（回填并选中） ============ */}
      <Modal open={custNew} width={480} title="新建客户（弹层）" onClose={() => setCustNew(false)}
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
      <Modal open={!!advOpen} width={480} title={`推进阶段：${advOpen?.stage ?? ''}`} onClose={() => setAdvOpen(null)}
        foot={<><Btn onClick={() => setAdvOpen(null)}>取消</Btn><Btn kind="primary" onClick={doAdv}>确认推进</Btn></>}>
        <div className="nc-cell-sub" style={{ marginBottom: 8 }}>阶段可跳选也可回退，变更将写入「阶段历史」并留痕。</div>
        <div className="nc-form-grid">
          <Field label="新阶段" req>
            <select className="nc-select" value={advStage} onChange={(e) => setAdvStage(e.target.value)}>
              {stages.map((s) => { const st = tpl.find((x) => x.name === s); const bidLocked = st?.requireBid && advOpen && getOppBids(advOpen.id).length === 0; return <option key={s} value={s}>{s}{bidLocked ? '（须先发起投标）' : ''}</option>; })}
            </select>
          </Field>
          <Field label="阶段权重" note="按阶段自动折算加权金额">{stageW(advStage)}%</Field>
          <Field label="阶段说明" req span={2} note="必填 · 写入阶段历史">
            <textarea className="nc-input" rows={3} value={advNote} onChange={(e) => setAdvNote(e.target.value)} placeholder="如：发包方立项批复，金额确认 ¥300,000" />
          </Field>
        </div>
      </Modal>

      {/* ============ 赢单 / 输单（终态） ============ */}
      <Modal open={!!loseOpen} width={480} title={`登记结果 · ${loseOpen?.id || ''}`} onClose={() => setLoseOpen(null)}
        foot={<>
          <Btn onClick={() => setLoseOpen(null)}>取消</Btn>
          <Btn kind={loseStatus === '赢单' ? 'primary' : 'danger'} onClick={() => {
            if (!loseOpen) return;
            if (loseStatus === '输单' && !loseReason) { toast('输单原因必填（用于丢标复盘）', 'err'); return; }
            closeOpp(loseOpen.id, loseStatus, { reason: loseStatus === '输单' ? loseReason : undefined, competitor: loseCompetitor || undefined, by: loseOpen.owner });
            setLoseOpen(null);
            toast(loseStatus === '赢单'
              ? '已登记赢单 · 可一键转化为合同 / 项目'
              : `已登记输单（原因：${loseReason}）· 停止跟进提醒，管理员可重开并留痕`);
          }}>确认登记</Btn>
        </>}>
        <div className="nc-modal-cap"><Ico n="warning" size={16} /> 赢单 / 输单为终态：停止跟进提醒并退出加权金额测算。输单须填原因，进入丢标复盘。</div>
        <div style={{ marginTop: 12 }}>
          <Field label="结果" req span={2}>
            <div className="nc-seg">
              {(['赢单', '输单'] as const).map((s) => (
                <button key={s} type="button" className={`nc-seg-btn${loseStatus === s ? ' is-on' : ''}`}
                  onClick={() => setLoseStatus(s)}>{s}</button>
              ))}
            </div>
          </Field>
          {loseStatus === '输单' && (
            <>
              <Field label="输单原因" req note="必填 · 进入丢标复盘看板">
                <select className="nc-select" value={loseReason} onChange={(e) => setLoseReason(e.target.value)}>
                  <option value="">请选择原因</option>
                  {LOSE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="竞争对手" note="选填">
                <input className="nc-input" value={loseCompetitor} onChange={(e) => setLoseCompetitor(e.target.value)} placeholder="如 本地××消防工程公司" />
              </Field>
            </>
          )}
          {loseStatus === '赢单' && (
            <Field label="中标说明" span={2} note="选填 · 记录中标价依据与签约要点">
              <textarea className="nc-textarea" placeholder="如：以报价 V2 ¥320 万中标，甲方要求 10 月 15 日前完成合同签署…" />
            </Field>
          )}
        </div>
      </Modal>

      {/* ============ 重开（管理员 · 已转化不可重开） ============ */}
      <Modal open={!!reopenOpen} width={480} title={`重开商机 · ${reopenOpen?.id || ''}`} onClose={() => setReopenOpen(null)}
        foot={<><Btn onClick={() => setReopenOpen(null)}>取消</Btn>
          <Btn kind="primary" onClick={() => {
            if (!reopenOpen) return;
            reopenOpp(reopenOpen.id);
            setReopenOpen(null);
            toast(`商机已重开至「${reopenOpen.stage}」· 重开记录已留痕`);
          }}>确认重开</Btn></>}>
        {reopenOpen && converted[reopenOpen.id]
          ? <div className="nc-warnbox is-red"><Ico n="ban" size={16} /> 该商机已转化（项目 / 合同已生成），不可重开。</div>
          : <div className="nc-warnbox is-orange">重开后商机状态恢复为「跟进中」（阶段保持当前所处阶段），恢复跟进提醒并重新计入加权金额；重开记录写入阶段历史。</div>}
      </Modal>

      {/* ============ 转化为合同·项目（同步生成） ============ */}
      <Modal open={!!cvtOpen} width={480} title={`转化为合同·项目 · ${cvtOpen?.id || ''}`} onClose={() => setCvtOpen(null)}
        foot={<><Btn onClick={() => setCvtOpen(null)}>取消</Btn>
          <Btn kind="primary" onClick={() => {
            const o = cvtOpen;
            if (!o) return;
            setConverted((m) => ({ ...m, [o.id]: { xm: `XM0001${String(30 + o.id.length).slice(-2)}`, ht: `HT${TODAY.replace(/-/g, '')}-00${12 + o.id.length}` } }));
            closeOpp(o.id, '赢单', { by: o.owner });
            setCvtOpen(null);
            toast('转化成功：已创建项目（待启动）+ 销售合同草稿已生成（同步完成 · 商机置「赢单」）');
            go('project');
          }}>确认转化</Btn></>}>
        {cvtOpen && (
          <>
            <Banner tone="gold">转化不受阶段限制，任意在谈阶段均可转化；同时生成<b>项目（待启动 · 商机直签）</b>与<b>销售合同草稿（报价转化）</b>；任一步不成功则整单不生效，不留半截数据；成功后商机自动置「赢单」，且此后不可重开。</Banner>
            <div className="nc-form-grid">
              <Field label="项目档案" note="编号自动生成 XM + 6 位流水">
                <div className="nc-ctx-grid">
                  <div className="nc-ctx"><span>项目名称</span><b>{cvtOpen.name}</b></div>
                  <div className="nc-ctx"><span>项目状态</span><b>待启动（商机直签）</b></div>
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
      <Modal open={!!quoteOpen} width={480} title={`创建报价 · ${quoteOpen?.name || ''}`} onClose={() => setQuoteOpen(null)}
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
      <Modal open={!!svyOpen} width={840} title={svyOpen?.s ? `勘察记录 · ${svyOpen.s.id}` : '新增勘察记录'} onClose={() => setSvyOpen(null)}
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
/** 下一步动作：按默认阶段模板给出业务动作（自定义阶段回落通用文案） */
const NEXT_BY_STAGE: Record<string, string> = {
  意向: '电话触达 + 需求摸底，确认预算来源与决策人',
  方案报价: '现场勘察 + 技术交流，输出工程量清单与方案报价',
  投标: '领取招标文件 + 配齐证书做标书，跟进开标结果',
  签约: '合同条款评审 + 电子签，推动签约落单',
};
const nextText = (o: O) => NEXT_BY_STAGE[o.stage] || '确认下一步跟进动作';

function daysUntil(d: string) {
  const t = new Date(`${d}T00:00:00`).getTime();
  const now = new Date('2026-09-20T00:00:00').getTime();
  return Math.round((t - now) / 86400000);
}
