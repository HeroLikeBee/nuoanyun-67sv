// 合同管理（列表）—— 合同全生命周期台账
// 编码前缀：销售 HT / 采购 CG / 框架 FK / 维护保养 WB
// 状态机（唯一事实源见 data.ts CONTRACT_STATUS）：草稿 → 待审批 → 已签约 → 履约中 → 已续签；旁支 已终止
// 终止方式（中止 / 解除 / 正常结束）记在 terminateType，不占状态枚举；读写一律走 normContractStatus()（筛选 / 步骤条 / 状态列同源，不会漏判）
// 版式参照「合同管理.html」：页面级 Tab → 工具条（搜索 + 下拉 + 右侧快捷 chips）→ 表格白卡（首末列吸附）
// 行点击 → 跳转独立详情页 #page=contract-detail&id=xxx（内容区全屏打开），不再用右侧抽屉
import React, { useEffect, useMemo, useState } from 'react';
import {
  Btn, Card, Code, DataTable, EntityLink, FilterEcho, IdCell, Money, Op, OpMore, OpNone, PageHead, Progress, ProjectPicker, TableFoot, Tag, useToast,
} from '../components/ui';
import type { OpMoreItem } from '../components/ui';
import { Ico } from '../components/icons';
import { CONTRACTS, CONTRACT_STATUS_TONE, CUSTOMERS, PROJECTS, contractOverdue, contractOverpay, fmtWan, normContractStatus, signStatusOf, TODAY } from '../components/data';
import { getContracts, consumeFocus, patchContract, setBizStatus, setPendingRenew, subscribeStore, getBizStatus, setFocus, setFocusTab, recomputeProjectExecAmt } from '../components/store';
import { ExportButton, useExport, getUserName, ExportDialog, type ExportField } from '../components/export';

/** 状态色调：与详情抽屉 / 驾驶舱共用 data.ts 的唯一事实源 */
const ST_TONE = CONTRACT_STATUS_TONE;
const TYPE_TONE: Record<string, 'blue' | 'orange' | 'purple' | 'green'> = {
  销售合同: 'blue', 检测合同: 'blue', 采购合同: 'orange', 框架协议: 'purple', 维护保养合同: 'green', 综合合同: 'green',
};
type C = (typeof CONTRACTS)[number];

const TABS = ['全部', '销售合同', '检测合同', '采购合同', '综合合同'] as const;
/** 状态维度 chips（单选，不选=全部；与类型 tabs 正交） */
const STATUS_CHIPS = ['待审批', '已签约', '履约中', '已终止'] as const;
/** 行动项 chips（布尔触发，独立于状态单选） */
const QUICKS = ['待签署', '收款逾期', '超付预警'] as const;
/** 终态合同：字段锁定、不再有变更 / 结算 / 续签一类的后续操作 */
const TERMINAL = ['已续签', '已终止'];

export default function ContractPage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  const [tab, setTab] = useState<string>('全部');
  const [stF, setStF] = useState('');
  const [kw, setKw] = useState('');
  const [typeF, setTypeF] = useState('');
  const [projF, setProjF] = useState('');
  /* 合同四分类筛选：primary 主合同 / supplement_price 价格调整补充 / supplement_service 新增服务补充 / maintenance 维保 */
  const [roleF, setRoleF] = useState('');
  const [topOnly, setTopOnly] = useState(false);   /* 仅顶层合同：隐藏有 parentId 的补充/执行单 */
  const [curOnly, setCurOnly] = useState(false);   /* 当前有效：隐藏已续签 / 已终止历史 */
  const [quick, setQuick] = useState<string>('');
  /* 低频下拉（类型/项目/分类）默认收进「更多筛选」展开行 */
  const [moreOpen, setMoreOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  /** 列表勾选（统一导出用） */
  const [contractSel, setContractSel] = useState<string[]>([]);
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
    销售合同: contracts.filter((c) => c.type === '销售合同').length,
    检测合同: contracts.filter((c) => c.type === '检测合同').length,
    采购合同: contracts.filter((c) => c.type === '采购合同').length,
    综合合同: contracts.filter((c) => c.type === '综合合同').length,
  };

  const rows = useMemo(() => contracts.filter((c) => {
    if (tab === '销售合同' && c.type !== '销售合同') return false;
    if (tab === '检测合同' && c.type !== '检测合同') return false;
    if (tab === '采购合同' && c.type !== '采购合同') return false;
    if (tab === '综合合同' && c.type !== '综合合同') return false;
    if (stF && st(c) !== stF) return false;
    if (typeF && c.type !== typeF) return false;
    if (projF && c.project !== projF) return false;
    if (roleF && (c.contractRole || '') !== roleF) return false;
    if (topOnly && c.parentId) return false;
    if (curOnly && (c.renewedTo || st(c) === '已终止')) return false;
    /* 待签署 = 电子签未完成且合同未到终态（未发起 / 签署中 / 已撤回 均需推动） */
    if (quick === '待签署'
      && !(['未发起', '签署中', '已撤回'].includes(signStatusOf(c)) && !TERMINAL.includes(st(c)))) return false;
    if (quick === '收款逾期' && !contractOverdue(c)) return false;
    if (quick === '超付预警' && !contractOverpay(c)) return false;
    if (kw && !(c.id + c.name + c.party).includes(kw)) return false;
    return true;
    // contracts 必须进依赖：登记收款 / 审批回写后列表与状态列要跟着刷新
  }), [tab, stF, kw, typeF, projF, roleF, topOnly, curOnly, quick, contracts]);

  /* 主从列表：凡有 parentId 的（价格/服务补充、框架执行单）不独立平铺，紧跟挂载父合同之后缩进显示；
     无 parentId 的顶层合同独立成行（对齐泛微：子合同/订单在主合同卡片聚合，不独立进列表）。 */
  const treeRows = useMemo(() => {
    const children = rows.filter((c) => c.parentId);
    const parents = rows.filter((c) => !c.parentId);
    const out = [...parents];
    children.forEach((ch) => {
      const idx = out.findIndex((r) => r.id === ch.parentId);
      out.splice(idx >= 0 ? idx + 1 : out.length, 0, ch);
    });
    return out;
  }, [rows]);
  const paged = treeRows.slice((page - 1) * pageSize, page * pageSize);
  const daysLeft = (d: string) => Math.round((new Date(d).getTime() - new Date(TODAY).getTime()) / 86400000);
  const overdueCnt = contracts.filter((c) => contractOverdue(c)).length;
  const overpayCnt = contracts.filter((c) => contractOverpay(c)).length;
  /* 金额口径概览（KPI 卡）：执行金额合计 / 已收 / 待收 / 逾期未收。
     当前口径（去重）：排除价格调整补充（增量已并入主合同 execAmt）、框架协议本身（amt 为额度而非执行额，
     其下执行单照常计入）、已续签旧合同（renewedTo，历史）。 */
  const inScope = (c: C) => c.contractRole !== 'supplement_price' && c.type !== '框架协议' && !c.renewedTo;
  const sumExec = contracts.filter(inScope).reduce((s, c) => s + c.execAmt, 0);
  const sumRecv = contracts.filter(inScope).reduce((s, c) => s + c.recv, 0);
  const openRecv = Math.max(sumExec - sumRecv, 0);
  /* 逾期未收 = Σ 逾期期次差额（已开票未收齐）—— 与项目经营中心「已开票未到账」同一期次级口径，避免合同级差额对不上账 */
  const overdueAmt = contracts.filter((c) => contractOverdue(c) && inScope(c)).reduce(
    (s, c) => s + (c.installments ?? []).filter((i) => i.inv === '已开票' && (i.got ?? 0) < i.amt)
      .reduce((x, i) => x + (i.amt - (i.got ?? 0)), 0), 0);
  const recvRate = sumExec ? Math.round((sumRecv / sumExec) * 100) : 0;

  /* 表格上方副标题：最近到期 / 30 天内到期（从 TableFoot.extra 移出，不再挤分页行） */
  const soonest = [...contracts].filter((c) => c.end).sort((a, b) => daysLeft(a.end) - daysLeft(b.end));
  const nearestEndDays = soonest.length ? daysLeft(soonest[0].end) : 0;
  const dueSoonCnt = contracts.filter((c) => daysLeft(c.end) < 30).length;

  /* 重置：清空全部筛选条件（kw/typeF/projF/roleF/topOnly/curOnly/quick） */
  const resetFilters = () => {
    setKw(''); setTypeF(''); setProjF(''); setRoleF('');
    setTopOnly(false); setCurOnly(false); setStF(''); setQuick(''); setPage(1);
  };
  /* 已选条件回显：typeF/projF/roleF/topOnly/curOnly/quick */
  const ROLE_LABEL: Record<string, string> = {
    primary: '主合同', supplement_price: '价格调整补充', supplement_service: '新增服务补充', maintenance: '维保合同',
  };
  const echoItems: { key: string; label: React.ReactNode }[] = [
    typeF && { key: 'typeF', label: `类型：${typeF}` },
    projF && { key: 'projF', label: `项目：${projF}` },
    roleF && { key: 'roleF', label: `分类：${ROLE_LABEL[roleF] ?? roleF}` },
    topOnly && { key: 'topOnly', label: '仅顶层' },
    curOnly && { key: 'curOnly', label: '当前有效' },
    stF && { key: 'stF', label: `状态：${stF}` },
    !!quick && { key: 'quick', label: quick },
  ].filter(Boolean) as { key: string; label: React.ReactNode }[];
  const onEchoRemove = (key: string) => {
    if (key === 'typeF') setTypeF('');
    else if (key === 'projF') setProjF('');
    else if (key === 'roleF') setRoleF('');
    else if (key === 'topOnly') setTopOnly(false);
    else if (key === 'curOnly') setCurOnly(false);
    else if (key === 'stF') setStF('');
    else if (key === 'quick') setQuick('');
    setPage(1);
  };

  /* ---------- 统一导出（公共组件） ---------- */
  const exportFields: ExportField[] = [
    { key: 'id', label: '合同编号' },
    { key: 'name', label: '合同名称' },
    { key: 'customer', label: '客户' },
    { key: 'party', label: '乙方' },
    { key: 'amt', label: '合同金额', sensitive: true },
    { key: 'signDate', label: '签署日期' },
    { key: 'status', label: '状态' },
    { key: 'owner', label: '负责人' },
    { key: 'end', label: '到期日' },
  ];
  const exportApi = useExport({
    pageKey: 'contract', pageName: '合同台账',
    fields: exportFields, defaultFieldKeys: exportFields.map((f) => f.key),
    totalCount: contracts.length, filteredCount: rows.length, selectedCount: contractSel.length,
    previewRows: rows.slice(0, 5),
    userName: getUserName(role),
    onExport: () => {},
  });

  const cols = [
    {
      key: 'id', title: '编号', width: 136, hide: true,
      render: (c: C) => (
        <div className="nc-cell-main" style={c.parentId ? { marginLeft: 16 } : undefined}>
          <IdCell onClick={() => openDetail(c)} title="查看合同详情">{c.id}</IdCell>
          {c.contractRole === 'supplement_price' && <div className="nc-cell-sub" title={`挂主合同 ${c.parentId}`}>↳ 价格调整补充</div>}
          {c.contractRole === 'supplement_service' && c.parentId && <div className="nc-cell-sub" title={`挂载 ${c.parentId}`}>↳ 服务执行单</div>}
          {c.renewedTo && <div className="nc-cell-sub nc-ellip" title={`续签 → ${c.renewedTo}`}>续签 → {c.renewedTo}</div>}
        </div>
      ),
    },
    {
      /* 名称走单行省略（完整名称在详情抽屉 / title 提示）：每行固定「主行 + 相对方副行」，
         行高才整齐；否则长名换行会把个别行撑高、整张表看起来毛糙。 */
      key: 'name', title: '名称 / 相对方', width: 226, sticky: 'left' as const,
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
        ? <div className="nc-cell-main"><EntityLink target="project-center" id={c.project} go={go} title="下钻到项目详情"><Code>{c.project}</Code></EntityLink><div className="nc-cell-sub nc-ellip" title={PROJECTS.find((p) => p.id === c.project)?.name ?? ''}>{PROJECTS.find((p) => p.id === c.project)?.name ?? ''}</div></div>
        : <span className="nc-cell-sub">框架（挂执行单）</span>),
    },
    {
      key: 'amt', title: '金额 → 执行金额', width: 126, align: 'right' as const,
      /* 主行只留主金额；增量 / 已执行 / 删除线原额一律收 title，不再嵌套多行小字 */
      render: (c: C) => (
        c.contractRole === 'supplement_price'
          ? <div className="num" title="价格调整补充 · 增量计入执行额">+{fmtWan(c.amt)}</div>
          : c.type === '框架协议'
          ? <div className="num" title={`已执行 ${fmtWan(c.execAmt)}`}>额度 {fmtWan(c.amt)}</div>
          : <div className="num" title={c.execAmt !== c.amt ? `已执行 ${fmtWan(c.execAmt)}` : undefined}>{fmtWan(c.amt)}</div>
      ),
    },
    {
      /* 状态列单层：主状态 Tag + 超付警告同行；电子签进度收 title，不再堆叠三层 Tag */
      key: 'status', title: '状态', width: 112,
      render: (c: C) => {
        const sign = signStatusOf(c);
        const tip = [sign !== '未发起' ? `电子签：${sign}` : '', contractOverpay(c) ? '超付预警' : ''].filter(Boolean).join(' · ');
        return (
          <div className="nc-cell-main" style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }} title={tip || undefined}>
            <Tag tone={ST_TONE[st(c)] ?? 'gray'}>{st(c)}</Tag>
            {contractOverpay(c) && <Tag tone="red">超付</Tag>}
          </div>
        );
      },
    },
    {
      key: 'recvPct', title: '收支进度', width: 120, align: 'right' as const,
      render: (c: C) => (
        <div className="nc-prog-cell" title={`已${['采购合同'].includes(c.type) ? '付' : '收'} ${fmtWan(c.recv)} / 执行 ${fmtWan(c.execAmt)}`}>
          <Progress value={Math.min(c.recvPct, 100)} tone={contractOverpay(c) ? 'red' : contractOverdue(c) ? 'red' : c.recvPct >= 70 ? 'green' : 'orange'} />
          <b className="num">{Math.min(c.recvPct, 100)}%</b>
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
          main = <Op onClick={() => { patchContract(c.id, { status: '已签约' }); setBizStatus(c.id, '已签约'); toast(`${c.id} 电子签已完成 · 合同转「已签约」`); }} title="电子签已全部完成，确认转「已签约」">确认签约</Op>;
        } else if (s === '待审批') {
          main = <Op onClick={() => { toast(`已打开 ${c.id} 的审批单，可在审批中心处理`); go('approval'); }}>审批</Op>;
        } else if (s === '草稿') {
          main = <Op onClick={() => openDetail(c)} title="打开详情后编辑基础信息">编辑</Op>;
        } else if (s === '已签约' || (s === '履约中' && !purchase)) {
          main = <Op onClick={() => { openDetail(c, 'money'); toast(`已打开《${c.name}》${moneyLabel}，可逐期登记收款`); }} title="登记收款">登记收款</Op>;
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
          { label: '发起补充协议', disabled: done || early, title: early ? '合同尚未生效，暂无补充协议' : '价格调整 / 新增服务，挂载至主合同', onClick: () => { openDetail(c, 'change'); toast('已定位到「变更与签证」，可发起价格调整 / 新增服务补充协议'); } },
          { label: '发起结算', disabled: done || early, title: early ? '合同尚未生效，暂无结算' : '按执行金额发起结算', onClick: () => { openDetail(c); toast('请在抽屉顶部【结算】发起结算'); } },
          { label: '开票', disabled: done || early, title: early ? '合同尚未生效，暂无开票' : '跳转发票管理开票', onClick: () => { toast(`已按《${c.name}》跳转发票管理`); go('invoice'); } },
          { label: moneyLabel, onClick: () => openDetail(c, 'money') },
          { label: '合同文件', onClick: () => openDetail(c, 'doc') },
          { label: '借阅记录', onClick: () => openDetail(c, 'borrow') },
          { label: '操作日志', onClick: () => openDetail(c, 'log') },
          { label: '续签', disabled: done, title: done ? '终态合同不可续签' : '生成续签合同草稿', onClick: () => { setPendingRenew({ contractId: c.id }); go('contract-new'); } },
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
      />

      {/* 金额概览 5 卡（执行口径；卡即筛选入口，与投标 / 项目页同一套瓦片） */}
      <div className="nc-tiles nc-tiles-5">
        <div className="nc-tile" title={`口径：执行金额合计（框架协议仅计其下执行单、不含框架额度；已排除历史续签） · 当前口径 ${contracts.filter(inScope).length} 份 / 台账共 ${contracts.length} 份`}>
          <div className="nc-tile-value num"><Money v={sumExec} role={role} wan /></div>
          <div className="nc-tile-label">合同总额</div>
          <div className="nc-tile-sub">执行口径 {contracts.filter(inScope).length} 份</div>
        </div>
        <div className="nc-tile" title="口径：累计已收（采购合同为已付）">
          <div className="nc-tile-value num"><Money v={sumRecv} role={role} wan /></div>
          <div className="nc-tile-label">已收款</div>
          <div className="nc-tile-sub">回款率 {recvRate}%</div>
        </div>
        <div className="nc-tile" title="口径：执行金额 − 累计已收">
          <div className="nc-tile-value num"><Money v={openRecv} role={role} wan /></div>
          <div className="nc-tile-label">待收款</div>
          <div className="nc-tile-sub">占总 {100 - recvRate}%</div>
        </div>
        <div className="nc-tile is-clickable" title="点击筛选：已过收款计划日且未收齐" onClick={() => { setTab('全部'); setStF(''); setQuick('收款逾期'); setPage(1); }}>
          <div className={`nc-tile-value num ${overdueCnt ? 'nc-v-orange' : 'nc-v-muted'}`}>{overdueCnt}</div>
          <div className="nc-tile-label">收款逾期</div>
          <div className="nc-tile-sub">涉及未收 <Money v={overdueAmt} role={role} wan /></div>
        </div>
        <div className="nc-tile is-clickable" title="点击筛选：累计已收超过执行金额" onClick={() => { setTab('全部'); setStF(''); setQuick('超付预警'); setPage(1); }}>
          <div className={`nc-tile-value num ${overpayCnt ? 'nc-v-orange' : 'nc-v-muted'}`}>{overpayCnt}</div>
          <div className="nc-tile-label">超付预警</div>
          <div className="nc-tile-sub">已收超执行金额</div>
        </div>
      </div>

      {/* ---- 页面级 Tab（计数徽标；行动项页签有积压时亮红） ---- */}
      <div className="nc-ltabs">
        {TABS.map((t) => (
          <button key={t} className={`nc-ltab${tab === t ? ' is-on' : ''}`} onClick={() => { setTab(t); setPage(1); }}>
            {t}<span className="n">{counts[t]}</span>
          </button>
        ))}
      </div>

      {/* ---- 工具条：低频筛选收进「更多筛选」+ 重置 + 搜索（筛选之后）+ 高频 chips + 主操作最右 ---- */}
      <div className="nc-ctbar">
        <div className="nc-ctchips" style={{ marginLeft: 0 }}>
          {STATUS_CHIPS.map((s) => (
            <button key={s} className={`nc-fchip${stF === s ? ' is-on' : ''}`} onClick={() => { setStF(stF === s ? '' : s); setPage(1); }}>
              {s}<span className="n">{contracts.filter((c) => st(c) === s).length}</span>
            </button>
          ))}
          <button className={`nc-fchip${topOnly ? ' is-on' : ''}`} onClick={() => { setTopOnly(!topOnly); setPage(1); }} title="只显示无 parentId 的顶层合同">仅顶层</button>
          <button className={`nc-fchip${curOnly ? ' is-on' : ''}`} onClick={() => { setCurOnly(!curOnly); setPage(1); }} title="隐藏已续签 / 已终止的历史合同">当前有效</button>
          {QUICKS.map((q) => (
            <button
              key={q} className={`nc-fchip${quick === q ? ' is-on' : ''}`}
              onClick={() => { setQuick(quick === q ? '' : q); setPage(1); }}
            >
              {q}{q === '收款逾期' && overdueCnt > 0 && <span> {overdueCnt}</span>}{q === '超付预警' && overpayCnt > 0 && <span> {overpayCnt}</span>}
            </button>
          ))}
        </div>
        <input
          className="nc-input nc-ct-search" value={kw} placeholder="搜索编号 / 名称 / 相对方"
          onChange={(e) => { setKw(e.target.value); setPage(1); }}
        />
        <Btn onClick={() => setMoreOpen((v) => !v)} title="展开类型 / 项目 / 合同分类等低频筛选">
          {moreOpen ? '收起筛选 ▴' : '更多筛选 ▾'}
        </Btn>
        <Btn kind="link" size="sm" onClick={resetFilters}>重置</Btn>
        <span style={{ flex: 1 }} />
        <span className="nc-ltbar-div" />
        <ExportButton onClick={exportApi.trigger} selectedCount={contractSel.length} />
        <Btn kind="primary" onClick={() => go('contract-new')}><Ico n="plus" size={14} /> 新建合同</Btn>
      </div>

      {/* 「更多筛选」展开行：项目选择器 + 类型/分类合并下拉（原「全部类型」「全部分类」两个相似下拉合并为一个带分组的选择器；业务类型仍由顶部 tabs 承担，二者正交可叠加），默认收起 */}
      {moreOpen && (
        <div className="nc-ctbar" style={{ marginTop: 8 }}>
          <ProjectPicker
            value={projF} onChange={(id) => { setProjF(id); setPage(1); }}
            scope="all" clearLabel="全部项目" placeholder="全部项目" width={160}
          />
          <select className="nc-input" style={{ width: 200 }}
            value={typeF ? 'type:' + typeF : roleF ? 'role:' + roleF : ''}
            onChange={(e) => {
              const [dim, v = ''] = e.target.value.split(':');
              if (dim === 'type') { setTypeF(v); setRoleF(''); }
              else if (dim === 'role') { setRoleF(v); setTypeF(''); }
              else { setTypeF(''); setRoleF(''); }
              setPage(1);
            }}>
            <option value="">类型 / 分类</option>
            <optgroup label="业务类型">
              {['销售合同', '检测合同', '采购合同', '框架协议', '维护保养合同', '综合合同'].map((t) => <option key={'type:' + t} value={'type:' + t}>{t}</option>)}
            </optgroup>
            <optgroup label="合同分类">
              <option value="role:primary">主合同</option>
              <option value="role:supplement_price">价格调整补充</option>
              <option value="role:supplement_service">新增服务补充</option>
              <option value="role:maintenance">维保合同</option>
            </optgroup>
          </select>
        </div>
      )}

      {/* 已选筛选条件回显（可单项移除 / 清除全部） */}
      {echoItems.length > 0 && (
        <FilterEcho items={echoItems} onRemove={onEchoRemove} onClear={resetFilters} />
      )}

      {/* ---- 表格白卡（与其他列表页同一容器：卡头/筛选固定 · 表体局部滚动 · 分页脚吸底） ---- */}
      <Card flush>
        <div className="nc-cell-sub" style={{ padding: '8px 12px 0' }}>
          最近到期剩余 {nearestEndDays} 天 · 30 天内到期 {dueSoonCnt} 份
        </div>
        <DataTable
          cols={cols} rows={paged} rowKey={(c) => c.id} minWidth={990}
          /* 条目背景色统一：逾期 / 超付不再整行铺色，改由行内标签承担 */
          onRowClick={(c) => openDetail(c)}
          selectable selected={contractSel}
          onSelectAll={(ids) => {
            const pageIds = ids.length ? ids : paged.map((c) => c.id);
            const allChecked = pageIds.length > 0 && pageIds.every((id) => contractSel.includes(id));
            setContractSel(allChecked ? contractSel.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...contractSel, ...pageIds])));
          }}
          onSelectRow={(id) => setContractSel((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
          empty="没有符合条件的合同"
        />
        <TableFoot
          unit="份" total={contracts.length} filtered={rows.length} page={page} pageSize={pageSize}
          onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }}
        />
      </Card>

      {/* ============ 统一导出 ============ */}
      <ExportDialog {...exportApi.dialogProps} />
    </>
  );
}
