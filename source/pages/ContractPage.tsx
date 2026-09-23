// 合同管理（列表）—— 合同全生命周期台账
// 编码前缀：销售 HT / 采购 CG / 框架 FK / 维护保养 WB
// 状态机（唯一事实源见 data.ts CONTRACT_STATUS）：草稿 → 待审批 → 已签约 → 履约中 → 已续签；旁支 已终止
// 终止方式（中止 / 解除 / 正常结束）记在 terminateType，不占状态枚举；读写一律走 normContractStatus()（筛选 / 步骤条 / 状态列同源，不会漏判）
// 版式参照「合同管理.html」：页面级 Tab → 工具条（搜索 + 下拉 + 右侧快捷 chips）→ 表格白卡（首末列吸附）
// 行点击 → 跳转独立详情页 #page=contract-detail&id=xxx（内容区全屏打开），不再用右侧抽屉
import React, { useEffect, useMemo, useState } from 'react';
import {
  Btn, Card, Code, DataTable, EntityLink, IdCell, Money, Op, OpMore, OpNone, PageHead, Progress, TableFoot, Tag, useToast,
} from '../components/ui';
import type { OpMoreItem } from '../components/ui';
import { Ico } from '../components/icons';
import { CONTRACTS, CONTRACT_STATUS_TONE, CUSTOMERS, PROJECTS, fmtWan, normContractStatus, signStatusOf, SIGN_STATUS_TONE, TODAY } from '../components/data';
import { getContracts, consumeFocus, patchContract, setBizStatus, subscribeStore, getBizStatus, setFocus, setFocusTab, recomputeProjectExecAmt } from '../components/store';

/** 状态色调：与详情抽屉 / 驾驶舱共用 data.ts 的唯一事实源 */
const ST_TONE = CONTRACT_STATUS_TONE;
const TYPE_TONE: Record<string, 'blue' | 'orange' | 'purple' | 'green'> = {
  销售合同: 'blue', 采购合同: 'orange', 框架协议: 'purple', 维护保养合同: 'green', 综合合同: 'green',
};
type C = (typeof CONTRACTS)[number];

const TABS = ['全部', '待审批', '已签约', '收款逾期', '已续签', '已终止'] as const;
/** 需要红点提示的行动项页签（有积压才亮红，避免常红疲劳） */
const HOT_TABS = ['待审批', '已签约', '收款逾期'] as const;
const QUICKS = ['全部状态', '履约中', '待签署', '有逾期', '超付预警'] as const;
/** 终态合同：字段锁定、不再有变更 / 结算 / 续签一类的后续操作 */
const TERMINAL = ['已续签', '已终止'];

export default function ContractPage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  const [tab, setTab] = useState<string>('全部');
  const [kw, setKw] = useState('');
  const [typeF, setTypeF] = useState('');
  const [projF, setProjF] = useState('');
  /* 合同四分类筛选：primary 主合同 / supplement_price 价格调整补充 / supplement_service 新增服务补充 / maintenance 维保 */
  const [roleF, setRoleF] = useState('');
  const [quick, setQuick] = useState<string>('全部状态');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  /**
   * 打开合同详情独立页；t 指定落地 Tab（money 收款计划 / change 变更与签证 / borrow 借阅 / log 日志 …）。
   * 先 setFocus 把合同 ID 传给详情页，再按需 setFocusTab 定位到对应分区。
   */
  const openDetail = (c: C, t = 'doc') => {
    setFocus('contract-detail', c.id);
    if (t && t !== 'doc') setFocusTab('contract-detail', t);
    go('contract-detail');
  };
  /* G1：原 rows 派生自模块常量 CONTRACTS，登记收款只 toast 不改数据，
     「已收 / 收支进度」列与统计永远不动。改为可写 state。 */
  const [contracts, setContracts] = useState(getContracts);
  /* G1 跨页：订阅共享 store —— 新建合同页提交后，台账页无需刷新即可看到新合同 */
  useEffect(() => subscribeStore(() => {
    setContracts(getContracts());
  }), []);
  /**
   * 跨页穿透：从客户 / 项目 / 商机等页面下钻进来时（对方先 setFocus('contract', id) 再跳转），
   * 不再就地弹抽屉，而是直接转发到合同详情独立页。
   */
  useEffect(() => {
    const id = consumeFocus('contract');
    if (!id) return;
    const hit = getContracts().find((k) => k.id === id);
    if (hit) { setFocus('contract-detail', hit.id); go('contract-detail'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav]);
  /**
   * 审批中心回写的状态覆盖层：优先取覆盖值，无覆盖时回落原状态（打通「审批 → 合同」闭环）。
   * 结果统一过 normContractStatus，历史别名（审批中 / 已审批 / 结算中 / 已结项 / 已中止 / 已解除）收敛为规范态。
   */
  const st = (c: C) => normContractStatus(getBizStatus(c.id, c.status));

  const counts: Record<string, number> = {
    全部: contracts.length,
    待审批: contracts.filter((c) => st(c) === '待审批').length,
    已签约: contracts.filter((c) => st(c) === '已签约').length,
    收款逾期: contracts.filter((c) => c.overdue).length,
    已续签: contracts.filter((c) => st(c) === '已续签').length,
    已终止: contracts.filter((c) => st(c) === '已终止').length,
  };

  const rows = useMemo(() => contracts.filter((c) => {
    if (tab === '待审批' && st(c) !== '待审批') return false;
    if (tab === '已签约' && st(c) !== '已签约') return false;
    if (tab === '收款逾期' && !c.overdue) return false;
    if (tab === '已续签' && st(c) !== '已续签') return false;
    if (tab === '已终止' && st(c) !== '已终止') return false;
    if (typeF && c.type !== typeF) return false;
    if (projF && c.project !== projF) return false;
    if (roleF && (c.contractRole || '') !== roleF) return false;
    /* 待签署 = 电子签未完成且合同未到终态（未发起 / 签署中 / 已撤回 均需推动） */
    if (quick === '待签署'
      && !(['未发起', '签署中', '已撤回'].includes(signStatusOf(c)) && !TERMINAL.includes(st(c)))) return false;
    if (quick === '有逾期' && !c.overdue) return false;
    if (quick === '超付预警' && !c.overpay) return false;
    if (kw && !(c.id + c.name + c.party).includes(kw)) return false;
    return true;
    // contracts 必须进依赖：登记收款 / 审批回写后列表与状态列要跟着刷新
  }), [tab, kw, typeF, projF, quick, contracts]);

  /* 主从列表：价格调整类补充协议不独立成行，紧跟挂载主合同之后缩进显示；新增服务/维保独立成行 */
  const treeRows = useMemo(() => {
    const children = rows.filter((c) => c.contractRole === 'supplement_price');
    const parents = rows.filter((c) => c.contractRole !== 'supplement_price');
    const out = [...parents];
    children.forEach((ch) => {
      const idx = out.findIndex((r) => r.id === ch.parentId);
      out.splice(idx >= 0 ? idx + 1 : out.length, 0, ch);
    });
    return out;
  }, [rows]);
  const paged = treeRows.slice((page - 1) * pageSize, page * pageSize);
  const daysLeft = (d: string) => Math.round((new Date(d).getTime() - new Date(TODAY).getTime()) / 86400000);
  const overdueCnt = contracts.filter((c) => c.overdue).length;
  const overpayCnt = contracts.filter((c) => c.overpay).length;
  /* 金额口径概览（KPI 卡）：执行金额合计 / 已收 / 待收 / 逾期未收 */
  const sumExec = contracts.filter((c) => c.contractRole !== 'supplement_price').reduce((s, c) => s + c.execAmt, 0);
  const sumRecv = contracts.reduce((s, c) => s + c.recv, 0);
  const openRecv = Math.max(sumExec - sumRecv, 0);
  const overdueAmt = contracts.filter((c) => c.overdue).reduce((s, c) => s + Math.max(c.execAmt - c.recv, 0), 0);
  const recvRate = sumExec ? Math.round((sumRecv / sumExec) * 100) : 0;

  const cols = [
    {
      key: 'id', title: '编号', width: 136, sticky: 'left' as const,
      render: (c: C) => (
        <div className="nc-cell-main" style={c.contractRole === 'supplement_price' ? { marginLeft: 16 } : undefined}>
          <IdCell onClick={() => openDetail(c)} title="查看合同详情">{c.id}</IdCell>
          {c.contractRole === 'supplement_price' && <div className="nc-cell-sub">↳ 价格调整补充（挂载主合同）</div>}
          {c.renewedTo && <div className="nc-cell-sub nc-ellip" title={`续签 → ${c.renewedTo}`}>续签 → {c.renewedTo}</div>}
          {!c.renewedTo && c.sub && <div className="nc-cell-sub">子合同</div>}
        </div>
      ),
    },
    {
      /* 名称走单行省略（完整名称在详情抽屉 / title 提示）：每行固定「主行 + 相对方副行」，
         行高才整齐；否则长名换行会把个别行撑高、整张表看起来毛糙。 */
      key: 'name', title: '名称 / 相对方', width: 226,
      render: (c: C) => (
        <div className="nc-cell-main">
          <div className="nc-ellip" title={c.name}>{c.name}</div>
          <div className="nc-cell-sub nc-ellip" title={c.party}>{c.party}</div>
        </div>
      ),
    },
    {
      key: 'type', title: '类型', width: 108,
      render: (c: C) => <Tag tone={TYPE_TONE[c.type] ?? 'gray'}>{c.type}</Tag>,
    },
    {
      key: 'project', title: '关联项目', width: 114,
      render: (c: C) => (c.project
        ? <div className="nc-cell-main"><EntityLink target="project-center" id={c.project} go={go} title="下钻到项目经营中心"><Code>{c.project}</Code></EntityLink><div className="nc-cell-sub nc-ellip" title={PROJECTS.find((p) => p.id === c.project)?.name ?? ''}>{PROJECTS.find((p) => p.id === c.project)?.name ?? ''}</div></div>
        : <span className="nc-cell-sub">框架（挂子合同）</span>),
    },
    {
      key: 'amt', title: '金额 → 执行金额', width: 126, align: 'right' as const,
      render: (c: C) => (
        c.contractRole === 'supplement_price'
          ? <div className="num">+{fmtWan(c.amt)}<div className="nc-cell-sub">增量（进执行额）</div></div>
          : c.type === '框架协议' && !c.sub
          ? <div className="num">额度 {fmtWan(c.execAmt)}</div>
          : (
            <div>
              <div className="num">{fmtWan(c.amt)}</div>
              {c.execAmt !== c.amt && <div className="nc-cell-sub num" style={{ textDecoration: 'line-through' }}>{fmtWan(c.execAmt)}</div>}
            </div>
          )
      ),
    },
    {
      /* 超付标签下沉到副行：与状态标签并排会把整列顶宽（列宽固定后就会挤到相邻列） */
      key: 'status', title: '状态', width: 112,
      render: (c: C) => (
        <div className="nc-cell-main">
          <Tag tone={ST_TONE[st(c)] ?? 'gray'}>{st(c)}</Tag>
          {signStatusOf(c) !== '未发起' && (
            <div className="nc-cell-sub" style={{ marginTop: 3 }}>
              <Tag tone={SIGN_STATUS_TONE[signStatusOf(c)] ?? 'gray'}>电子签 · {signStatusOf(c)}</Tag>
            </div>
          )}
          {c.overpay && <div className="nc-cell-sub" style={{ marginTop: 3 }}><Tag tone="red">超付</Tag></div>}
        </div>
      ),
    },
    {
      key: 'recvPct', title: '收支进度', width: 132,
      render: (c: C) => (
        <div className="nc-cell-main">
          <div className="nc-cell-sub num">已{['采购合同'].includes(c.type) ? '付' : '收'} <Money v={c.recv} role={role} wan />/<Money v={c.execAmt} role={role} wan /></div>
          <Progress value={Math.min(c.recvPct, 100)} tone={c.overpay ? 'red' : c.overdue ? 'red' : c.recvPct >= 70 ? 'green' : 'orange'} />
        </div>
      ),
    },
    {
      /**
       * 操作列：槽位恒定 —— ① 按状态差异化的主操作 ② 详情 ③ 更多 ⋯。
       * 之前只剩「审批（仅待审批）+ 详情」，绝大多数行只剩一个「详情」，操作看起来被砍光了。
       * 现在主操作按合同状态给（草稿→编辑 / 待审批→审批 / 已签约·履约中→登记收款·请款），
       * 其余（编辑、签署、变更签证、结算、开票、收付款、合同文件、借阅、日志、续签、
       * 终止类）全量收进「更多」，跨行按钮数量与位置不再漂移。
       */
      key: 'op', title: '操作', width: 186, align: 'right' as const, sticky: 'right' as const,
      render: (c: C) => {
        const s = st(c);
        const done = TERMINAL.includes(s);
        const purchase = c.type === '采购合同';
        /* 草稿 / 待审批 尚未生效：变更、结算、开票都还不存在 */
        const early = s === '草稿' || s === '待审批';
        const moneyLabel = purchase ? '付款记录' : '收款计划';

        /* ① 主操作（状态决定；无可用操作时用占位符，保证整列对齐） */
        let main: React.ReactNode;
        if (s === '待审批' && signStatusOf(c) === '已签') {
          /* 规格 CON-02 ③：电子签全部完成 → 合同方可转「已签约」 */
          main = <Btn size="sm" kind="primary" onClick={() => { patchContract(c.id, { status: '已签约' }); setBizStatus(c.id, '已签约'); toast(`${c.id} 电子签已完成 · 合同转「已签约」`); }} title="电子签已全部完成，确认转「已签约」">确认签约</Btn>;
        } else if (s === '待审批') {
          main = <Btn size="sm" kind="primary" onClick={() => { toast(`已打开 ${c.id} 的审批单，可在审批中心处理`); go('approval'); }}>审批</Btn>;
        } else if (s === '草稿') {
          main = <Op onClick={() => openDetail(c)} title="打开详情后编辑基础信息">编辑</Op>;
        } else if (s === '已签约' || (s === '履约中' && !purchase)) {
          main = <Op onClick={() => { openDetail(c, 'money'); toast(`已打开《${c.name}》${moneyLabel}，可逐期登记回款`); }} title="登记收款">登记收款</Op>;
        } else if (s === '履约中') {
          main = <Op onClick={() => { openDetail(c, 'money'); toast(`已打开《${c.name}》${moneyLabel}`); }} title="请款 / 付款">请款</Op>;
        } else {
          main = <OpNone title={`${s} 为终态，无可执行操作`} />;
        }

        /* ③ 更多：其余操作全量收口，不随数据可用性增减 */
        const more: OpMoreItem[] = [
          { label: '编辑合同', disabled: done, title: done ? '终态合同字段已锁定，请走变更流程' : '修改基础信息', onClick: () => openDetail(c) },
          { label: '电子签章 / 签署链', disabled: s === '草稿', title: s === '草稿' ? '草稿不可发起电子签' : '落签地配置 · 发起签署 · 签署链留痕', onClick: () => openDetail(c, 'sign') },
          { label: '变更 / 签证', disabled: done || early, title: early ? '合同尚未生效，暂无变更签证' : '发起变更 / 设计变更 / 工程签证', onClick: () => { openDetail(c, 'change'); toast('已定位到「变更与签证」，可发起变更 / 设计变更 / 工程签证'); } },
          { label: '发起结算', disabled: done || early, title: early ? '合同尚未生效，暂无结算' : '按执行金额发起结算', onClick: () => { openDetail(c); toast('请在抽屉顶部【结算】发起结算'); } },
          { label: '开票', disabled: done || early, title: early ? '合同尚未生效，暂无开票' : '跳转发票管理开票', onClick: () => { toast(`已按《${c.name}》跳转发票管理`); go('invoice'); } },
          { label: moneyLabel, onClick: () => openDetail(c, 'money') },
          { label: '合同文件', onClick: () => openDetail(c, 'doc') },
          { label: '借阅记录', onClick: () => openDetail(c, 'borrow') },
          { label: '操作日志', onClick: () => openDetail(c, 'log') },
          { label: '续签', disabled: done, title: done ? '终态合同不可续签' : '生成续签合同草稿', onClick: () => { toast(`已按《${c.name}》发起续签：来源选「复制历史」`); go('contract-new'); } },
          { label: '终止 / 中止 / 解除 / 作废', danger: true, disabled: done, title: done ? '终态合同无可执行的终止类操作' : '终止类动作落态均为「已终止」，方式记入 terminateType', onClick: () => { openDetail(c); toast('请在抽屉右上角【更多操作 ⋯】办理终止（含中止 / 解除）/ 作废'); } },
        ];

        return (
          <div className="nc-ops" onClick={(e) => e.stopPropagation()}>
            <span className="nc-ops-slot">{main}</span>
            <Op onClick={() => openDetail(c)}>详情</Op>
            <OpMore items={more} />
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHead
        title="合同管理"
        sub={`共 ${contracts.length} 份 · 履约中 ${contracts.filter((c) => st(c) === '履约中').length} 份 · 逾期未收 ${overdueCnt} 份`}
        actions={<Btn kind="primary" onClick={() => go('contract-new')}><Ico n="plus" size={14} /> 新建合同</Btn>}
      />

      {/* 金额概览 5 卡（执行口径；卡即筛选入口，与投标 / 项目页同一套瓦片） */}
      <div className="nc-tiles nc-tiles-5">
        <div className="nc-tile is-clickable" title="口径：执行金额合计（含子合同额度）" onClick={() => { setTab('全部'); setQuick('全部状态'); setPage(1); }}>
          <div className="nc-tile-value num"><Money v={sumExec} role={role} wan /></div>
          <div className="nc-tile-label">合同总额</div>
          <div className="nc-tile-sub">执行金额口径 · {contracts.length} 份</div>
        </div>
        <div className="nc-tile is-clickable" title="口径：累计已收（采购合同为已付）" onClick={() => { setTab('全部'); setQuick('全部状态'); setPage(1); }}>
          <div className="nc-tile-value num nc-v-green"><Money v={sumRecv} role={role} wan /></div>
          <div className="nc-tile-label">已收款</div>
          <div className="nc-tile-sub">回款率 {recvRate}%</div>
        </div>
        <div className="nc-tile is-clickable" title="口径：执行金额 − 累计已收" onClick={() => { setTab('全部'); setQuick('全部状态'); setPage(1); }}>
          <div className="nc-tile-value num"><Money v={openRecv} role={role} wan /></div>
          <div className="nc-tile-label">待收款</div>
          <div className="nc-tile-sub">占总 {100 - recvRate}%</div>
        </div>
        <div className="nc-tile is-clickable" title="口径：已过收款计划日且未收齐" onClick={() => { setTab('收款逾期'); setQuick('全部状态'); setPage(1); }}>
          <div className="nc-tile-value num nc-v-red">{overdueCnt}</div>
          <div className="nc-tile-label">收款逾期</div>
          <div className="nc-tile-sub">涉及未收 <Money v={overdueAmt} role={role} wan /> · 点击直达</div>
        </div>
        <div className="nc-tile is-clickable" title="口径：累计已收 > 执行金额" onClick={() => { setTab('全部'); setQuick('超付预警'); setPage(1); }}>
          <div className="nc-tile-value num nc-v-orange">{overpayCnt}</div>
          <div className="nc-tile-label">超付预警</div>
          <div className="nc-tile-sub">已收超执行金额 · 点击直达</div>
        </div>
      </div>

      {/* ---- 页面级 Tab（计数徽标；行动项页签有积压时亮红） ---- */}
      <div className="nc-ltabs">
        {TABS.map((t) => (
          <button key={t} className={`nc-ltab${tab === t ? ' is-on' : ''}`} onClick={() => { setTab(t); setPage(1); }}>
            {t}<span className={`n${(HOT_TABS as readonly string[]).includes(t) && counts[t] > 0 ? ' is-hot' : ''}`}>{counts[t]}</span>
          </button>
        ))}
      </div>

      {/* ---- 工具条：搜索 + 下拉 + 右侧快捷 chips ---- */}
      <div className="nc-ctbar">
        <input
          className="nc-input nc-ct-search" value={kw} placeholder="搜索编号 / 名称 / 相对方"
          onChange={(e) => { setKw(e.target.value); setPage(1); }}
        />
        <select className="nc-input" style={{ width: 130 }} value={typeF} onChange={(e) => { setTypeF(e.target.value); setPage(1); }}>
          <option value="">全部类型</option>
          {['销售合同', '采购合同', '框架协议', '维护保养合同', '综合合同'].map((t) => <option key={t}>{t}</option>)}
        </select>
        <select className="nc-input" style={{ width: 160 }} value={projF} onChange={(e) => { setProjF(e.target.value); setPage(1); }}>
          <option value="">全部项目</option>
          {PROJECTS.map((p) => <option key={p.id} value={p.id}>{p.id}</option>)}
        </select>
        <select className="nc-input" style={{ width: 150 }} value={roleF} onChange={(e) => { setRoleF(e.target.value); setPage(1); }}>
          <option value="">全部分类</option>
          <option value="primary">主合同</option>
          <option value="supplement_price">价格调整补充</option>
          <option value="supplement_service">新增服务补充</option>
          <option value="maintenance">维保合同</option>
        </select>
        <div className="nc-ctchips">
          {QUICKS.map((q) => (
            <button
              key={q} className={`nc-fchip${quick === q ? ' is-on' : ''}`}
              onClick={() => { setQuick(q); setPage(1); toast(`已切换「${q}」，命中 ${contracts.filter((c) => (q === '有逾期' ? c.overdue : q === '超付预警' ? c.overpay : q === '履约中' ? st(c) === '履约中' : true)).length} 份`); }}
            >
              {q}{q === '有逾期' && <span> {overdueCnt}</span>}{q === '超付预警' && <span> {overpayCnt}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ---- 表格白卡（与其他列表页同一容器：卡头/筛选固定 · 表体局部滚动 · 分页脚吸底） ---- */}
      <Card flush>
        <DataTable
          cols={cols} rows={paged} rowKey={(c) => c.id} minWidth={1120}
          /* 条目背景色统一：逾期 / 超付不再整行铺色，改由行内标签承担 */
          onRowClick={(c) => openDetail(c)}
          empty="没有符合条件的合同"
        />
        <TableFoot
          total={contracts.length} filtered={rows.length} page={page} pageSize={pageSize}
          onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }}
          /* G3：原 contracts[0].end 硬编码索引 0，改为取「剩余工期最短」的合同（口径与排序无关） */
          extra={<span className="nc-cell-sub"> ｜ 行点击打开详情页 · 最近到期剩余 {daysLeft([...contracts].filter((c) => c.end).sort((a, b) => daysLeft(a.end) - daysLeft(b.end))[0]?.end ?? TODAY)} 天 · 30 天内到期 {contracts.filter((c) => daysLeft(c.end) < 30).length} 份</span>}
        />
      </Card>
    </>
  );
}
