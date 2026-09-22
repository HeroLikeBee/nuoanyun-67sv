// 项目列表（列表）—— 贯通管道：在谈（初谈/已报价/待签）→ 转合同 → 履约（待启动/实施中/待验收）→ 已完工
// 版式与状态机参照 项目管理.html + 在谈项目列表.html
// 状态机：初谈 → 已报价 → 待签（商机段，仅此三态可转合同）→ 待启动 → 实施中 → 待验收 → 已完工；旁路终态：甩置 / 丢单
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Banner, Btn, Card, Code, DataTable, EntityLink, IdCell, Modal, Money, Op, OpMore, OpNone, PageHead,
  TableFoot, Tag, useToast, Progress, Field,
} from '../components/ui';
import type { OpMoreItem } from '../components/ui';
import { BIDS, CONTRACTS, CUSTOMERS, OPPS, OPP_STAGE_PROB, PROJECTS, PROJECT_SOURCES, QUOTES, fmt, TODAY } from '../components/data';
import { getProjects, setFocus, subscribeStore } from '../components/store';
import { Ico } from '../components/icons';

/* 在谈段（商机管道：可转合同 / 项目）—— 对齐参考《商机管理》阶段状态机 */
const PIPE = ['推进中', '重点', '甲方立项确认', '商务谈判'];
/* 履约段（已签约，进入交付）—— 项目侧状态机，与商机阶段严格区分 */
const DELIVERY = ['待启动', '实施中', '待验收'];
/* 终态：商机终态（未中标 / 关闭）+ 项目终态（已完工） */
const TERMINAL = ['未中标', '关闭', '已完工'];

const ST_TONE: Record<string, 'blue' | 'green' | 'gray' | 'orange' | 'red' | 'gold'> = {
  推进中: 'gray', 重点: 'gold', 甲方立项确认: 'orange', 商务谈判: 'blue', 已中标: 'green',
  待启动: 'green', 实施中: 'green', 待验收: 'orange', 已完工: 'gray',
  未中标: 'gray', 关闭: 'red',
};

type Row = {
  id: string; name: string; customer: string; customerId?: string; industry: string; region: string;
  owner: string; stage: string; amt: number; signDate: string;
  quote: { no: string; st: string } | null;
  contract: string | null;
  certs: { have: number; lack: number };
  last: string; lastDays: number;
  src: 'opp' | 'proj'; type: string;
};

/* 项目类型：含「检测」（PROJECTS 里有检测类项目，原列表漏了这一档，筛「检测」会命中 0） */
const TYPES = ['新建', '改造', '维护保养', '检测'] as const;
/** 跨段的快捷视图 chips（阶段明细走带计数的下拉） */
const QUICK_VIEWS = [
  { key: 'all', label: '全部' },
  { key: 'pipe', label: '在谈管道' },
  { key: 'delivery', label: '履约中' },
  { key: 'stale', label: '逾期跟进' },
] as const;

/* 上游单据一律从 BIDS / QUOTES / CONTRACTS 真实数据反查，不再写死示例编号。
   原先所有项目共用同一个合同号（'HT20260912-0009'）、报价单号是拼出来的 'BJ2026000x'，
   列表看起来像假数据，也让「证书配备 / 合同号」列失真。 */
const contractOfProject = (pid: string) => CONTRACTS.find((c) => c.project === pid)?.id ?? null;
const quoteOfCustomer = (cid?: string) => QUOTES.filter((q) => cid && q.customerId === cid).sort((a, b) => b.date.localeCompare(a.date))[0];

/* PROJECTS（履约段）→ 统一行：已立项=待启动 / 执行中=实施中·待验收 / 已结项=已完工
   G1 跨页 Q18：改为按传入的项目列表构建，新增项目后可重建行，而非常量快照。 */
const buildProjRows = (list: (typeof PROJECTS)[number][]): Row[] => list.map((p) => {
  const stage = p.status === '已立项' ? '待启动'
    : p.status === '已结项' ? '已完工'
      : p.milestoneName === '待验收' ? '待验收' : '实施中';
  /* 上游单据按来源取真实单据：投标中标 → 中标投标单；报价转化 → 报价单；其余无上游 */
  const upNo = p.source === '投标中标'
    ? BIDS.find((b) => p.customerId && b.customerId === p.customerId)?.id
    : p.source === '报价转化' ? quoteOfCustomer(p.customerId)?.id : undefined;
  const need = p.type === '新建' ? 4 : p.type === '改造' ? 3 : 2;
  const got = p.risk === 'overcost' ? need - 1 : need;
  /* 行业：项目主数据无该字段，按 customerId 反查客户档案派生（对齐参考《项目管理》行业筛选） */
  const cus = CUSTOMERS.find((c) => c.id === p.customerId);
  return {
    id: p.id, name: p.name, customer: p.customer, customerId: p.customerId, industry: cus?.industry ?? '其他', region: `云南 · ${cus?.region ?? '昆明'}`,
    owner: p.owner, stage, amt: p.contractAmt, signDate: p.start,
    quote: upNo ? { no: upNo, st: p.source } : null,
    contract: contractOfProject(p.id),
    certs: { have: got, lack: Math.max(need - got, 0) },
    last: TODAY, lastDays: 0, src: 'proj', type: p.type,
  };
});

/* OPPS（在谈段 + 终态）→ 统一行 */
const oppRows: Row[] = (OPPS as unknown as (typeof OPPS)[number][]).map((o) => {
  const q0 = QUOTES.find((q) => q.opp === o.id);
  const ct = o.stage === '已中标' ? CONTRACTS.find((c) => o.customerId && c.party === o.customer)?.id ?? null : null;
  return {
    id: o.id, name: o.name, customer: o.customer, customerId: o.customerId, industry: o.industry, region: '云南 · 昆明',
    owner: o.owner, stage: o.stage, amt: o.amt, signDate: o.signDate,
    quote: q0 ? { no: q0.id, st: q0.status } : null,
    contract: ct,
    certs: { have: 0, lack: ct ? 2 : 0 },
    last: o.last, lastDays: o.lastDays, src: 'opp', type: o.type,
  };
});

const canToContract = (s: string) => PIPE.includes(s);
const pipeAmt = (rows: Row[]) => rows.filter((r) => PIPE.includes(r.stage)).reduce((s, r) => s + r.amt, 0);
const weighted = (r: Row) => Math.round(r.amt * ((OPP_STAGE_PROB as Record<string, number>)[r.stage] ?? 100) / 100);
const daysTo = (s: string) => (s ? Math.round((new Date(s).getTime() - new Date(TODAY).getTime()) / 86400000) : null);

export default function ProjectPage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  /* G1 跨页 Q18：项目列表播种共享 store —— 新建项目页提交后，本项目台帐实时可见 */
  const [projects, setProjects] = useState(getProjects);
  useEffect(() => subscribeStore(() => setProjects(getProjects())), []);
  const ALL: Row[] = useMemo(() => [...oppRows, ...buildProjRows(projects)], [projects]);
  const [kw, setKw] = useState('');
  const [stage, setStage] = useState('all');
  const [type, setType] = useState('');
  const [industry, setIndustry] = useState('');
  const [owner, setOwner] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortAsc, setSortAsc] = useState(false);
  const [mileOpen, setMileOpen] = useState<Row | null>(null);
  const [toCt, setToCt] = useState<Row | null>(null);
  const [lossOpen, setLossOpen] = useState<Row | null>(null);
  const [followOpen, setFollowOpen] = useState<Row | null>(null);
  /* 「逾期跟进」不再用独立的 onlyStale 隐藏态：统一走 stage='stale'，避免出现
     「下拉显示全部、结果却仍被隐藏筛选过滤」的不可见状态。 */
  /* Q4：里程碑推进 · 验收类节点强制三件套
     原实现只要 stage === '待验收' 就无条件 return，节点永远推不动（流程断头）。
     改为逐项校验：齐备则放行，缺件则列出具体缺失项，用户补齐后即可推进。 */
  const MILE_DOCS = [
    { key: 'record', label: '竣工验收消防查验记录' },
    { key: 'media', label: '影像资料' },
    { key: 'sign', label: '签字件' },
  ] as const;
  const [mileDoc, setMileDoc] = useState<Record<string, boolean>>({});
  const [mileNote, setMileNote] = useState('');
  const openMile = (r: Row) => { setMileDoc({}); setMileNote(''); setMileOpen(r); };
  const mileMissing = MILE_DOCS.filter((d) => !mileDoc[d.key]).map((d) => d.label);

  const owners = [...new Set(ALL.map((r) => r.owner))];
  const stale = ALL.filter((r) => !TERMINAL.includes(r.stage) && r.lastDays > 14);
  const noAmt = ALL.filter((r) => PIPE.includes(r.stage) && !r.amt);

  const stageCnt = (k: string) => {
    if (k === 'all') return ALL.length;
    if (k === 'pipe') return ALL.filter((r) => PIPE.includes(r.stage)).length;
    if (k === 'delivery') return ALL.filter((r) => DELIVERY.includes(r.stage)).length;
    if (k === 'stale') return stale.length;
    return ALL.filter((r) => r.stage === k).length;
  };

  const rows = useMemo(() => {
    let list = ALL.filter((r) => {
      if (stage === 'all') return true;
      if (stage === 'pipe') return PIPE.includes(r.stage);
      if (stage === 'delivery') return DELIVERY.includes(r.stage);
      if (stage === 'stale') return !TERMINAL.includes(r.stage) && r.lastDays > 14;
      return r.stage === stage;
    });
    list = list.filter((r) => {
      if (type && r.type !== type) return false;
      if (industry && r.industry !== industry) return false;
      if (owner && r.owner !== owner) return false;
      if (kw && !(`${r.id}${r.name}${r.customer}`).includes(kw)) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      const x = a.signDate || '9999-99-99'; const y = b.signDate || '9999-99-99';
      return sortAsc ? x.localeCompare(y) : y.localeCompare(x);
    });
    // ALL 必须进依赖：新建项目写入 store 后 ALL 会重建，列表筛选结果要跟着刷新
  }, [ALL, stage, type, industry, owner, kw, sortAsc]);

  const paged = rows.slice((page - 1) * pageSize, page * pageSize);
  const setStateAll = () => { setStage('all'); setPage(1); };

  /** 打开项目（经营中心）。商机段也应跳项目详情，而不是回商机管理页 */
  const openProject = (r: Row) => { setFocus('project-center', r.id); go('project-center'); };
  /** 里程碑推进仅对「履约段 + 项目来源」的行可用（商机行还没有交付里程碑） */
  const canMile = (r: Row) => DELIVERY.includes(r.stage) && r.src === 'proj';

  const cols = [
    { key: 'id', title: '项目编号', width: 136, sticky: 'left' as const,
      /* G7：编号列统一走 IdCell —— 可点击时蓝色（点击穿透到项目经营中心），不可点击时保持中性灰 */
      render: (r: Row) => (
        <IdCell onClick={() => openProject(r)} title="打开项目经营中心">{r.id}</IdCell>
      ) },
    {
      /* 名称 / 客户 · 行业 压成两行 + 单行省略：与合同页「名称 / 相对方」列版式一致，
         行高不再因为长名换行而参差；完整名称见 title 提示与项目经营中心。 */
      key: 'name', title: '项目名称 · 客户', width: 236,
      render: (r: Row) => (
        <div className="nc-cell-main">
          <div className="nc-ellip" title={r.name}>{r.name}</div>
          <div className="nc-cell-sub nc-ellip">{r.customer}{` · ${r.industry}`}</div>
        </div>
      ),
    },
    { key: 'owner', title: '负责人', width: 88, render: (r: Row) => <span><span className="nc-avatar">{r.owner[0]}</span> {r.owner}</span> },
    {
      /* 状态标签 + 单据副行（已签约→合同号 / 在谈→报价单号 + 报价状态 / 无单据→成交概率）
         原「报价单」独立列并入这里，省掉一整列。 */
      key: 'stage', title: '状态 / 单据', width: 130,
      render: (r: Row) => {
        const signed = r.stage === '已中标' || DELIVERY.includes(r.stage);
        return (
          <div className="nc-cell-main">
            <Tag tone={ST_TONE[r.stage] ?? 'gray'} pill>{r.stage}</Tag>
            {signed
              ? (r.contract
                ? <div className="nc-cell-sub nc-ellip" title={`已签合同 ${r.contract}`}><Code>{r.contract}</Code></div>
                : <div className="nc-cell-sub">合同待建</div>)
              : r.quote
                ? <div className="nc-cell-sub nc-ellip" title={`${r.quote.no} · ${r.quote.st}`}><EntityLink target="quote-detail" id={r.quote.no} go={go} title="下钻到报价详情"><Code>{r.quote.no}</Code></EntityLink> {r.quote.st}</div>
                : PIPE.includes(r.stage)
                  ? <div className="nc-cell-sub num">成交概率 {(OPP_STAGE_PROB as Record<string, number>)[r.stage]}%</div>
                  : <div className="nc-cell-sub">无上游单据</div>}
          </div>
        );
      },
    },
    {
      /* 金额 + 加权金额副行（原「加权金额」独立列并入），省掉一整列 */
      key: 'amt', title: '预计 / 合同金额', width: 134, align: 'right' as const,
      render: (r: Row) => (!r.amt
        ? <span className="nc-v-orange">未填</span>
        : (
          <div className="nc-cell-main">
            <b className="num"><Money v={r.amt} role={role} /></b>
            {PIPE.includes(r.stage) && <div className="nc-cell-sub num">加权 <Money v={weighted(r)} role={role} wan /></div>}
          </div>
        )),
    },
    {
      key: 'cert', title: '证书配备', width: 104,
      render: (r: Row) => (r.contract
        ? (r.certs.lack > 0
          ? <div className="nc-cell-main"><span className="nc-gap-b is-lack">缺口 {r.certs.lack}</span><div className="nc-cell-sub"><Op onClick={() => go('cert')}>去配备 →</Op></div></div>
          : <span className="nc-gap-b is-full">已配 {r.certs.have} 本</span>)
        : <span className="nc-cell-sub">未签约</span>),
    },
    {
      /* 签约日 + 最近跟进（原「最近跟进」独立列并入）：两个时间信号同列便于一起扫视 */
      key: 'sign', title: `预计签约日 ${sortAsc ? '↑' : '↓'}`, width: 120,
      render: (r: Row) => {
        const d = r.signDate ? (daysTo(r.signDate) as number) : null;
        const cls = d === null ? '' : d < 0 ? 'nc-v-red' : d <= 30 ? 'nc-v-orange' : '';
        const tip = d === null ? '待定' : d < 0 ? `已过 ${-d} 天` : `剩 ${d} 天`;
        return (
          <div className="nc-cell-main">
            <span className={'num ' + cls}>{r.signDate || '—'}</span>
            <div className={'nc-cell-sub num ' + cls}>{tip}</div>
            <div className={`nc-cell-sub num${r.lastDays > 14 ? ' nc-v-red' : ''}`}>跟进 {r.lastDays > 0 ? `${r.lastDays} 天前` : '今日'}</div>
          </div>
        );
      },
    },
    {
      /* 操作列：槽位恒定 —— ① 主操作（在谈→转合同 / 履约→里程碑 / 终态→占位）② 详情 ③ 更多 ⋯。
         原先按数据可用性拼 1~5 个操作、数量与位置逐行漂移，且不吸右，窄屏要横向滚动才看得到。 */
      key: 'op', title: '操作', width: 190, align: 'right' as const, sticky: 'right' as const,
      render: (r: Row) => {
        const done = TERMINAL.includes(r.stage);
        const toCt = canToContract(r.stage);
        const mile = canMile(r);

        /* ① 主操作 */
        let main: React.ReactNode;
        if (toCt) main = <Op gold onClick={() => setToCt(r)} title="转为合同，带出报价 / 投标明细">转合同</Op>;
        else if (mile) main = <Op onClick={() => openMile(r)} title="按里程碑推进交付节点">里程碑</Op>;
        else main = <OpNone title={done ? `${r.stage} 为终态，无可执行操作` : '常用操作见「更多 ⋯」'} />;

        /* ③ 更多：其余操作全量收口 */
        const more: OpMoreItem[] = [
          { label: '打开项目经营中心', onClick: () => openProject(r) },
          { label: '登记跟进', disabled: done, title: done ? '终态项目不再跟进' : '记录本次沟通结论与下一步动作', onClick: () => setFollowOpen(r) },
          { label: '里程碑推进', disabled: !mile, title: mile ? '按里程碑推进交付节点' : '仅履约段（项目来源）可推进里程碑', onClick: () => openMile(r) },
          { label: '转合同', disabled: !toCt, title: toCt ? '带出报价 / 投标明细生成合同草稿' : '仅「在谈」段可转合同', onClick: () => setToCt(r) },
          { label: '下钻客户档案', disabled: !r.customerId, title: r.customerId ? '打开客户档案' : '该行没有关联客户档案', onClick: () => { if (r.customerId) { setFocus('customer', r.customerId); go('customer'); } } },
          { label: '丢单 / 甩置', danger: true, disabled: !toCt, title: toCt ? '标记丢单并停止跟进（记录保留）' : '仅「在谈」段可标记丢单', onClick: () => setLossOpen(r) },
        ];

        return (
          <div className="nc-ops" onClick={(e) => e.stopPropagation()}>
            <span className="nc-ops-slot">{main}</span>
            <Op onClick={() => openProject(r)}>详情</Op>
            <OpMore items={more} />
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHead
        title="项目列表"
        sub={`共 ${ALL.length} 个 · 在谈 ${ALL.filter((r) => PIPE.includes(r.stage)).length} · 履约 ${ALL.filter((r) => DELIVERY.includes(r.stage)).length} · 终态 ${ALL.filter((r) => TERMINAL.includes(r.stage)).length}`}
        actions={<>
          <Btn onClick={() => go('opp')}>＋ 新增商机</Btn>
          <Btn onClick={() => go('project-new')}>从合同新增</Btn>
          <Btn kind="primary" onClick={() => go('project-new')}>＋ 新增项目</Btn>
        </>}
      />

      {stale.length > 0 && (
        <Banner tone="warn" actions={<Btn size="sm" onClick={() => { setStage('stale'); setPage(1); }}>只看逾期跟进</Btn>}>
          <Ico n="warning" size={14} style={{ color: 'var(--c-warning-mid)' }} /> <b>跟进提醒：</b>{stale.length} 个项目超过 14 天未跟进
          {noAmt.length > 0 && <> ｜ {noAmt.length} 个在谈项目<b>金额未填</b>，加权金额无法计算</>}
          ｜ 预计签约日 ≤30 天标橙、已过标红。
        </Banner>
      )}

      {/* 概览 4 卡（值在上 / 标签在下，与投标页同一套瓦片版式） */}
      <div className="nc-tiles nc-tiles-4">
        <button className="nc-tile is-clickable" onClick={() => setStateAll()} title="口径：在谈段 + 履约段合计（含终态）">
          <div className="nc-tile-value num">{ALL.length}</div>
          <div className="nc-tile-label">项目总数</div>
          <div className="nc-tile-sub">在谈 {ALL.filter((r) => PIPE.includes(r.stage)).length} · 履约 {ALL.filter((r) => DELIVERY.includes(r.stage)).length}</div>
        </button>
        <button className="nc-tile is-clickable" onClick={() => { setStage('pipe'); setPage(1); }} title="口径：在谈段（推进中 / 重点 / 甲方立项确认 / 商务谈判）预计金额合计">
          <div className="nc-tile-value num"><Money v={pipeAmt(ALL)} role={role} wan /></div>
          <div className="nc-tile-label">在谈管道金额</div>
          <div className="nc-tile-sub">另含加权 <Money v={ALL.filter((r) => PIPE.includes(r.stage)).reduce((s, r) => s + weighted(r), 0)} role={role} wan /></div>
        </button>
        <button className="nc-tile is-clickable" onClick={() => { setStage('delivery'); setPage(1); }} title="口径：待启动 / 实施中 / 待验收">
          <div className="nc-tile-value num nc-v-blue">{ALL.filter((r) => DELIVERY.includes(r.stage)).length}</div>
          <div className="nc-tile-label">交付中项目</div>
          <div className="nc-tile-sub">待启动 / 实施中 / 待验收</div>
        </button>
        <button className="nc-tile is-clickable" onClick={() => { setStage('stale'); setPage(1); }} title="口径：非终态且超过 14 天未跟进">
          <div className={`nc-tile-value num${stale.length ? ' nc-v-red' : ''}`}>{stale.length}</div>
          <div className="nc-tile-label">逾期跟进</div>
          <div className="nc-tile-sub">超 14 天未跟进 · 点击直达</div>
        </button>
      </div>

      <Card flush>
        {/* 工具条：搜索 + 4 个下拉 + 快捷视图 chips（与投标 / 合同页同一套 .nc-ctbar）。
            原来 5 行 chip 面板（在谈 / 履约 / 终态 / 类型 / 行业）占 228px，把表格推到首屏之外；
            阶段改为带计数的下拉、类型 / 行业同样收进下拉，只留 4 个跨段快捷视图在 chip 行。 */}
        <div className="nc-ctbar" style={{ padding: '10px 12px', borderBottom: '1px solid var(--c-hairline)' }}>
          <input
            className="nc-input nc-ct-search" value={kw} placeholder="搜索项目名称 / 客户 / 编号"
            onChange={(e) => { setKw(e.target.value); setPage(1); }}
          />
          <select className="nc-input" style={{ width: 170 }} value={stage} onChange={(e) => { setStage(e.target.value); setPage(1); }}>
            <option value="all">全部阶段（{stageCnt('all')}）</option>
            <option value="pipe">在谈管道（{stageCnt('pipe')}）</option>
            {PIPE.map((s) => <option key={s} value={s}>{s}（{stageCnt(s)}）</option>)}
            <option value="已中标">已中标（{stageCnt('已中标')}）</option>
            <option value="delivery">履约中（{stageCnt('delivery')}）</option>
            {DELIVERY.map((s) => <option key={s} value={s}>{s}（{stageCnt(s)}）</option>)}
            <option value="已完工">已完工（{stageCnt('已完工')}）</option>
            <option value="未中标">未中标（{stageCnt('未中标')}）</option>
            <option value="关闭">关闭（{stageCnt('关闭')}）</option>
          </select>
          <select className="nc-input" style={{ width: 132 }} value={owner} onChange={(e) => { setOwner(e.target.value); setPage(1); }}>
            <option value="">全部负责人</option>
            {owners.map((o) => <option key={o}>{o}</option>)}
          </select>
          <select className="nc-input" style={{ width: 132 }} value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
            <option value="">全部类型</option>
            {TYPES.map((t) => <option key={t} value={t}>{t}（{ALL.filter((r) => r.type === t).length}）</option>)}
          </select>
          <select className="nc-input" style={{ width: 140 }} value={industry} onChange={(e) => { setIndustry(e.target.value); setPage(1); }}>
            <option value="">全部行业</option>
            {[...new Set(ALL.map((r) => r.industry))].filter((x) => x && x !== '—').map((x) => (
              <option key={x} value={x}>{x}（{ALL.filter((r) => r.industry === x).length}）</option>
            ))}
          </select>
          <div className="nc-ctchips">
            {QUICK_VIEWS.map((q) => (
              <button
                key={q.key} className={`nc-fchip${stage === q.key ? ' is-on' : ''}`}
                onClick={() => { setStage(q.key); setPage(1); }}
              >
                {q.label}<span className="n">{stageCnt(q.key)}</span>
              </button>
            ))}
            <Btn size="sm" onClick={() => setSortAsc(!sortAsc)}>签约日 {sortAsc ? '↑' : '↓'}</Btn>
            <Btn size="sm" onClick={() => { setKw(''); setType(''); setIndustry(''); setOwner(''); setStage('all'); setPage(1); toast('已重置筛选条件'); }}>重置</Btn>
          </div>
        </div>
        <DataTable
          cols={cols} rows={paged} rowKey={(r) => r.id} minWidth={1120}
          /* 条目背景色统一：仅保留「终态」的灰底弱化，待验收不再整行铺黄底 */
          rowClass={(r) => (TERMINAL.includes(r.stage) ? 'is-dead-row' : '')}
          onRowClick={(r) => openProject(r)}
          empty="没有符合条件的项目"
        />
        <TableFoot
          unit="个项目" total={ALL.length} filtered={rows.length} page={page} pageSize={pageSize}
          onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }}
          extra={<span className="nc-cell-sub"> ｜ 行点击进入详情 ｜ 来源：{PROJECT_SOURCES.join(' / ')}</span>}
        />
      </Card>

      {/* ============ 转合同（仅初谈 / 已报价 / 待签 可操作） ============ */}
      <Modal open={!!toCt} onClose={() => setToCt(null)} width={620} title="转合同"
        foot={<><Btn onClick={() => setToCt(null)}>取消</Btn><Btn kind="primary" onClick={() => {
          const q = toCt?.quote;
          toast(q ? `已生成合同草稿并带出报价 ${q.no} 明细，项目流转为「待启动」` : '无报价单：合同明细按预计金额预填 1 行，项目流转为「待启动」');
          setToCt(null);
        }}>确认转合同</Btn></>}>
        {toCt && (
          <>
            <Alert icon={<Ico n="swap" size={16} />} tone="warn" title={`确认将「${toCt.name}」转为合同？`}
              sub={<>
                将自动带出：客户 / 负责人 / 地区 / 行业 / 预计签约日 / 服务周期。
                {toCt.quote
                  ? <>报价单 <b>{toCt.quote.no}</b> 明细将<b>逐行转入合同明细</b>。</>
                  : <span className="nc-v-orange">该项目无报价单，合同明细按预计金额<b>预填 1 行</b>。</span>}
                <div className="nc-cell-sub" style={{ marginTop: 4 }}>转成功后项目流转为「已签 → 待启动」，合同编号自动生成。</div>
              </>} />
            <div className="nc-form-grid" style={{ marginTop: 12 }}>
              <div className="nc-field"><div className="nc-field-label">客户</div><input className="nc-input" readOnly value={toCt.customer} /></div>
              <div className="nc-field"><div className="nc-field-label">负责人</div><input className="nc-input" readOnly value={toCt.owner} /></div>
              <div className="nc-field"><div className="nc-field-label">行业 / 地区</div><input className="nc-input" readOnly value={`${toCt.industry} / ${toCt.region}`} /></div>
              <div className="nc-field"><div className="nc-field-label">预计签约日</div><input className="nc-input" readOnly value={toCt.signDate || '待定'} /></div>
              <div className="nc-field"><div className="nc-field-label is-req">合同金额</div><input className="nc-input" defaultValue={toCt.quote ? toCt.amt : toCt.amt} /></div>
              <div className="nc-field"><div className="nc-field-label">金额来源</div>
                <select className="nc-input"><option>{toCt.quote ? `报价总额 ${fmt(toCt.amt)}` : '商机预计金额'}</option><option>手工录入</option></select></div>
            </div>
          </>
        )}
      </Modal>

      {/* ============ 丢单 / 甩置（危险确认） ============ */}
      <Modal open={!!lossOpen} onClose={() => setLossOpen(null)} width={520} title="标记丢单"
        foot={<><Btn onClick={() => setLossOpen(null)}>取消</Btn><Btn danger onClick={() => { toast(`已标记丢单：${lossOpen?.name}`); setLossOpen(null); }}>标记丢单</Btn></>}>
        <Banner tone="warn">确认将 <b>{lossOpen?.name}</b> 标记为丢单？标记后<b>停止跟进</b>，可在筛选「丢单」中查看，<b>记录保留</b>。</Banner>
        <div className="nc-form-grid">
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">丢单原因</div>
            <select className="nc-input"><option>价格无竞争力</option><option>资质不满足</option><option>客户取消计划</option><option>竞争对手中标</option><option>其他</option></select></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label">补充说明</div><textarea className="nc-input" rows={2} /></div>
        </div>
      </Modal>

      {/* ============ 登记跟进（保存后回写最近跟进） ============ */}
      <Modal open={!!followOpen} onClose={() => setFollowOpen(null)} width={560} title={`登记跟进 · ${followOpen?.name ?? ''}`}
        foot={<><Btn onClick={() => setFollowOpen(null)}>取消</Btn><Btn kind="primary" onClick={() => { toast('跟进已登记 · 最近跟进日与下一步动作已回写'); setFollowOpen(null); }}>保存跟进</Btn></>}>
        <div className="nc-form-grid">
          <div className="nc-field"><div className="nc-field-label is-req">跟进方式</div>
            <select className="nc-input"><option>电话沟通</option><option>上门拜访</option><option>微信/邮件</option><option>现场勘查</option><option>会议洽谈</option></select></div>
          <div className="nc-field"><div className="nc-field-label is-req">跟进日期</div><input className="nc-input" type="date" defaultValue={TODAY} /></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label is-req">跟进摘要</div><textarea className="nc-input" rows={2} placeholder="本次沟通结论" /></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label">下一步动作</div><input className="nc-input" placeholder="如：递交正式报价" /></div>
          <div className="nc-field nc-field-2"><div className="nc-field-label">计划日期</div><input className="nc-input" type="date" /></div>
        </div>
      </Modal>

      {/* ============ 里程碑推进 ============ */}
      <Modal
        open={!!mileOpen} onClose={() => setMileOpen(null)} width={640} title={`里程碑推进 · ${mileOpen?.name ?? ''}`}
        foot={<><Btn onClick={() => setMileOpen(null)}>取消</Btn><Btn kind="primary" onClick={() => {
          if (mileOpen?.stage === '待验收' && mileMissing.length) { toast(`验收类节点还缺 ${mileMissing.length} 项强制资料：${mileMissing.join('、')}`); return; }
          if (mileOpen?.stage === '待验收' && !mileNote.trim()) { toast('完成说明未填写（验收类节点必填）'); return; }
          toast('里程碑已推进 · 资料自动归档至项目附件对应里程碑'); setMileOpen(null);
        }}>确认推进</Btn></>}>
        <div className="nc-mile-axis">
          {['进场准备', '施工中', '竣工验收', '结算', '质保期'].map((m) => {
            const cur = m === '竣工验收';
            const done = ['进场准备', '施工中'].includes(m);
            {/* 已完成 = ✓ 打勾（success 语义）；当前 = 蓝实心；待办 = 灰描边 */}
            return <div key={m} className={`nc-mile-node${cur ? ' is-cur' : done ? ' is-done' : ''}`}><span className="nc-mile-dot">{done ? <Ico n="check" size={12} /> : ''}</span>{m}</div>;
          })}
        </div>
        <Banner tone="warn">验收类节点强制上传【竣工验收消防查验记录】+ 影像 + 签字件；通过后资料自动归档至【项目附件】对应里程碑。</Banner>
        <div className="nc-form-grid">
          <Field label="推进至" req><select className="nc-input"><option>竣工验收</option><option>结算</option><option>质保期</option></select></Field>
          {MILE_DOCS.map((d) => (
            <Field key={d.key} label={d.label} req={mileOpen?.stage === '待验收'} span={2}
              note={mileDoc[d.key] ? '已上传' : undefined}>
              <input className="nc-input" type="file"
                onChange={(e) => setMileDoc((m) => ({ ...m, [d.key]: (e.target.files?.length ?? 0) > 0 }))} />
            </Field>
          ))}
          <Field label="完成说明" span={4} req={mileOpen?.stage === '待验收'}>
            <textarea className="nc-input" rows={3} value={mileNote} onChange={(e) => setMileNote(e.target.value)} placeholder="验收结论、遗留问题与整改要求" />
          </Field>
        </div>
      </Modal>
    </>
  );
}
