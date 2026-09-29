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
import { CONTRACTS, CONTRACT_STATUS_TONE, CUSTOMERS, PROJECTS, contractOverdue, contractOverpay, contractOverpayed, fmtWan, isPayContract, normContractStatus, openPayOf, paidOf, paidPctOf, signStatusOf, TODAY } from '../components/data';
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
  /* 方向筛选（2026-09-29）：收款类 = 非付款类型；付款类 = 采购 / 分包（isPayContract）。与类型页签正交 */
  const [dirF, setDirF] = useState<'' | 'in' | 'out'>('');
  /* 低频下拉（类型/项目/分类）默认收进「更多筛选」展开行 */
  const [moreOpen, setMoreOpen] = useState(false);
  /* 2026-09-28 筛选改版：常用（对方主体 / 签署日期区间）+ 高级（含税金额 / 已收付 / 未收付 / 资金进度 / 生效与结束日期区间）。
     数值区间存输入框原始字符串，过滤时 Number('') 视为未启用。 */
  const [partyF, setPartyF] = useState('');
  const [signFrom, setSignFrom] = useState('');
  const [signTo, setSignTo] = useState('');
  const [advOpen, setAdvOpen] = useState(false);
  const [amtMin, setAmtMin] = useState('');
  const [amtMax, setAmtMax] = useState('');
  const [doneMin, setDoneMin] = useState('');
  const [doneMax, setDoneMax] = useState('');
  const [openMin, setOpenMin] = useState('');
  const [openMax, setOpenMax] = useState('');
  const [progMin, setProgMin] = useState('');
  const [progMax, setProgMax] = useState('');
  const [effFrom, setEffFrom] = useState('');
  const [effTo, setEffTo] = useState('');
  const [endFrom, setEndFrom] = useState('');
  const [endTo, setEndTo] = useState('');
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
    if (dirF === 'in' && isPayContract(c)) return false;
    if (dirF === 'out' && !isPayContract(c)) return false;
    /* 待签署 = 电子签未完成且合同未到终态（未发起 / 签署中 / 已撤回 均需推动） */
    if (quick === '待签署'
      && !(['未发起', '签署中', '已撤回'].includes(signStatusOf(c)) && !TERMINAL.includes(st(c)))) return false;
    if (quick === '收款逾期' && !contractOverdue(c)) return false;
    if (quick === '超付预警' && !contractOverpay(c)) return false;
    /* 2026-09-28 筛选改版：对方主体 + 签署日期区间 + 高级区间。
       金额类按合同方向取值：收款类 = 已收/未收（recv），采购类 = 已付/未付（paidOf）。 */
    if (partyF && c.party !== partyF) return false;
    if (signFrom || signTo) {
      if (c.sign === '—') return false;
      if (signFrom && c.sign < signFrom) return false;
      if (signTo && c.sign > signTo) return false;
    }
    const n = (s: string) => (s === '' ? null : Number(s));
    const amtMinN = n(amtMin); if (amtMinN !== null && c.amt < amtMinN) return false;
    const amtMaxN = n(amtMax); if (amtMaxN !== null && c.amt > amtMaxN) return false;
    const doneAmt = isPayContract(c) ? paidOf(c) : c.recv;
    const doneMinN = n(doneMin); if (doneMinN !== null && doneAmt < doneMinN) return false;
    const doneMaxN = n(doneMax); if (doneMaxN !== null && doneAmt > doneMaxN) return false;
    const openAmt = Math.max(c.execAmt - doneAmt, 0);
    const openMinN = n(openMin); if (openMinN !== null && openAmt < openMinN) return false;
    const openMaxN = n(openMax); if (openMaxN !== null && openAmt > openMaxN) return false;
    const pctF = Math.min(isPayContract(c) ? paidPctOf(c) : c.recvPct, 100);
    const progMinN = n(progMin); if (progMinN !== null && pctF < progMinN) return false;
    const progMaxN = n(progMax); if (progMaxN !== null && pctF > progMaxN) return false;
    const effD = c.effectiveDate ?? c.sign;
    if (effFrom || effTo) {
      if (effD === '—') return false;
      if (effFrom && effD < effFrom) return false;
      if (effTo && effD > effTo) return false;
    }
    const endD = c.effectiveEnd ?? c.end;
    if (endFrom && endD < endFrom) return false;
    if (endTo && endD > endTo) return false;
    if (kw && !(c.id + c.name + c.party).includes(kw)) return false;
    return true;
    // contracts 必须进依赖：登记收款 / 审批回写后列表与状态列要跟着刷新
  }), [tab, stF, kw, typeF, projF, roleF, topOnly, curOnly, quick, dirF, contracts,
    partyF, signFrom, signTo, amtMin, amtMax, doneMin, doneMax, openMin, openMax, progMin, progMax, effFrom, effTo, endFrom, endTo]);

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
  /* ⚠️ 收付必须分算：采购合同的钱是我方付出去的，执行额是「应付」不是「应收」。
     改前把采购执行额也减进「待收款」，等于把应付当应收。两侧各算各的分母。 */
  const scopeRows = contracts.filter(inScope);
  const recvRows = scopeRows.filter((c) => !isPayContract(c));
  const payRows = scopeRows.filter(isPayContract);
  const sumExec = recvRows.reduce((s, c) => s + c.execAmt, 0);
  const sumRecv = recvRows.reduce((s, c) => s + c.recv, 0);
  const openRecv = Math.max(sumExec - sumRecv, 0);
  const sumPay = payRows.reduce((s, c) => s + c.execAmt, 0);
  const sumPaid = payRows.reduce((s, c) => s + paidOf(c), 0);
  const openPay = Math.max(sumPay - sumPaid, 0);
  /* 逾期未收 = Σ 逾期期次差额（已开票未收齐）—— 与项目经营中心「已开票未到账」同一期次级口径，避免合同级差额对不上账 */
  const overdueAmt = recvRows.filter(contractOverdue).reduce(
    (s, c) => s + (c.installments ?? []).filter((i) => i.inv === '已开票' && (i.got ?? 0) < i.amt)
      .reduce((x, i) => x + (i.amt - (i.got ?? 0)), 0), 0);
  const recvRate = sumExec ? Math.round((sumRecv / sumExec) * 100) : 0;
  const payRate = sumPay ? Math.round((sumPaid / sumPay) * 100) : 0;
  /* 资金进度列头固定为「资金进度」（2026-09-28 确认）：不再随筛选动态改名（旧 payCnt/progTitle 派生已删），
     行内「收 / 付」方向标区分两个口径 —— 排序、导出、列宽不再随视图漂移。 */

  /* 表格上方副标题：最近到期 / 30 天内到期（从 TableFoot.extra 移出，不再挤分页行） */
  const soonest = [...contracts].filter((c) => c.end).sort((a, b) => daysLeft(a.end) - daysLeft(b.end));
  const nearestEndDays = soonest.length ? daysLeft(soonest[0].end) : 0;
  const dueSoonCnt = contracts.filter((c) => daysLeft(c.end) < 30).length;

  /* 重置：清空全部筛选条件（kw/typeF/projF/roleF/topOnly/curOnly/quick/dirF） */
  const resetFilters = () => {
    setKw(''); setTypeF(''); setProjF(''); setRoleF('');
    setTopOnly(false); setCurOnly(false); setStF(''); setQuick(''); setDirF(''); setPage(1);
    setPartyF(''); setSignFrom(''); setSignTo(''); setAdvOpen(false);
    setAmtMin(''); setAmtMax(''); setDoneMin(''); setDoneMax('');
    setOpenMin(''); setOpenMax(''); setProgMin(''); setProgMax('');
    setEffFrom(''); setEffTo(''); setEndFrom(''); setEndTo('');
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
    !!dirF && { key: 'dirF', label: dirF === 'in' ? '方向：我方收款' : '方向：我方付款' },
    stF && { key: 'stF', label: `状态：${stF}` },
    !!quick && { key: 'quick', label: quick },
    !!partyF && { key: 'partyF', label: `对方主体：${partyF}` },
    (!!signFrom || !!signTo) && { key: 'signRange', label: `签署：${signFrom || '…'} ~ ${signTo || '…'}` },
    (amtMin !== '' || amtMax !== '') && { key: 'amtRange', label: `含税金额：${amtMin || '…'}~${amtMax || '…'}` },
    (doneMin !== '' || doneMax !== '') && { key: 'doneRange', label: `已收/已付：${doneMin || '…'}~${doneMax || '…'}` },
    (openMin !== '' || openMax !== '') && { key: 'openRange', label: `未收/未付：${openMin || '…'}~${openMax || '…'}` },
    (progMin !== '' || progMax !== '') && { key: 'progRange', label: `资金进度：${progMin || '…'}~${progMax || '…'}%` },
    (!!effFrom || !!effTo) && { key: 'effRange', label: `生效：${effFrom || '…'} ~ ${effTo || '…'}` },
    (!!endFrom || !!endTo) && { key: 'endRange', label: `结束：${endFrom || '…'} ~ ${endTo || '…'}` },
  ].filter(Boolean) as { key: string; label: React.ReactNode }[];
  const onEchoRemove = (key: string) => {
    if (key === 'typeF') setTypeF('');
    else if (key === 'projF') setProjF('');
    else if (key === 'roleF') setRoleF('');
    else if (key === 'topOnly') setTopOnly(false);
    else if (key === 'curOnly') setCurOnly(false);
    else if (key === 'dirF') setDirF('');
    else if (key === 'stF') setStF('');
    else if (key === 'quick') setQuick('');
    else if (key === 'partyF') setPartyF('');
    else if (key === 'signRange') { setSignFrom(''); setSignTo(''); }
    else if (key === 'amtRange') { setAmtMin(''); setAmtMax(''); }
    else if (key === 'doneRange') { setDoneMin(''); setDoneMax(''); }
    else if (key === 'openRange') { setOpenMin(''); setOpenMax(''); }
    else if (key === 'progRange') { setProgMin(''); setProgMax(''); }
    else if (key === 'effRange') { setEffFrom(''); setEffTo(''); }
    else if (key === 'endRange') { setEndFrom(''); setEndTo(''); }
    setPage(1);
  };

  /* ---------- 统一导出（公共组件） ---------- */
  /* 导出模板与列表列同步（2026-09-28 列表改版）：乙方 → 对方主体、合同金额 → 合同含税金额、
     到期日 → 合同结束日期，新增合同生效日期；负责人列按确认口径移除（列表不展示）。 */
  const exportFields: ExportField[] = [
    { key: 'id', label: '合同编号' },
    { key: 'name', label: '合同名称' },
    { key: 'party', label: '对方主体' },
    { key: 'amt', label: '合同含税金额', sensitive: true },
    { key: 'sign', label: '签署日期' },
    { key: 'effectiveDate', label: '合同生效日期' },
    { key: 'end', label: '合同结束日期' },
    { key: 'status', label: '状态' },
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
      key: 'id', title: '合同编号', width: 136,
      render: (c: C) => (
        <div className="nc-cell-main">
          <IdCell onClick={() => openDetail(c)} title="查看合同详情">{c.id}</IdCell>
          {c.contractRole === 'supplement_service' && c.parentId && <div className="nc-cell-sub" title={`挂载 ${c.parentId}`}>↳ 服务执行单</div>}
          {c.renewedTo && <div className="nc-cell-sub nc-ellip" title={`续签 → ${c.renewedTo}`}>续签 → {c.renewedTo}</div>}
        </div>
      ),
    },
    {
      /* 名称走单行省略（完整名称在详情 / title 提示）。相对方已独立成「对方主体」列（2026-09-28 列表改版）。 */
      key: 'name', title: '合同名称', width: 200, sticky: 'left' as const,
      render: (c: C) => (
        <div className="nc-cell-main">
          <div className="nc-ellip" title={c.name}>{c.name}</div>
        </div>
      ),
    },
    {
      key: 'type', title: '合同类型', width: 108,
      render: (c: C) => <Tag tone={TYPE_TONE[c.type] ?? 'gray'}>{c.type}</Tag>,
    },
    {
      /* 对方主体（2026-09-28 列表改版）：数据层 party 本就存相对方（销售=客户 / 采购=供应商），
         方向相对命名一套列名通吃；我方主体单主体不设列（用户决策）。 */
      key: 'party', title: '对方主体', width: 176,
      render: (c: C) => <div className="nc-ellip" title={c.party}>{c.party}</div>,
    },
    {
      key: 'project', title: '关联项目', width: 114,
      render: (c: C) => (c.project
        ? <div className="nc-cell-main"><EntityLink target="project-center" id={c.project} go={go} title="下钻到项目详情"><Code>{c.project}</Code></EntityLink><div className="nc-cell-sub nc-ellip" title={PROJECTS.find((p) => p.id === c.project)?.name ?? ''}>{PROJECTS.find((p) => p.id === c.project)?.name ?? ''}</div></div>
        : <span className="nc-cell-sub">框架（挂执行单）</span>),
    },
    {
      key: 'amt', title: '合同含税金额', width: 126, align: 'right' as const,
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
      /* 资金进度（2026-09-28 确认固定列头）：收款类看「收款进度」（已收 / 应收），付款类（采购）看「付款进度」（已付 / 应付）。
         列头不再随筛选动态改名（排序 / 导出 / 列宽随之稳定），行内「收 / 付」方向标区分两个口径。 */
      key: 'prog', title: '资金进度', width: 136, align: 'right' as const,
      render: (c: C) => {
        const pay = isPayContract(c);
        const pct = pay ? paidPctOf(c) : c.recvPct;
        const done = pay ? paidOf(c) : c.recv;
        const bad = pay ? contractOverpayed(c) : (contractOverpay(c) || contractOverdue(c));
        return (
          <div className="nc-prog-cell" title={`已${pay ? '付' : '收'} ${fmtWan(done)} / ${pay ? '应付' : '应收'} ${fmtWan(c.execAmt)}`}>
            <span className={`nc-prog-dir${pay ? ' is-pay' : ''}`} title={pay ? '付款进度（我方付款）' : '收款进度（我方收款）'}>{pay ? '付' : '收'}</span>
            <Progress value={Math.min(pct, 100)} tone={bad ? 'red' : pct >= 70 ? 'green' : 'orange'} />
            <b className="num">{Math.min(pct, 100)}%</b>
          </div>
        );
      },
    },
    {
      key: 'sign', title: '签署日期', width: 100,
      render: (c: C) => <span className="num">{c.sign}</span>,
    },
    {
      /* 合同生效日期 / 结束日期（2026-09-28 新增字段）：种子由 data.ts 数组后 forEach 回填（生效=签署 / 结束=end） */
      key: 'eff', title: '合同生效日期', width: 106,
      render: (c: C) => <span className="num">{c.effectiveDate ?? c.sign}</span>,
    },
    {
      key: 'endD', title: '合同结束日期', width: 106,
      render: (c: C) => <span className="num">{c.effectiveEnd ?? c.end}</span>,
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

      {/* 金额概览 6 卡：**收款侧 3 张 + 付款侧 3 张**，两侧各算各的分母，不再相加。
          改前 5 卡全是收款口径，却把采购执行额也减进「待收款」—— 等于把应付当应收。
          「收款逾期」「超付预警」两张行动卡已由上方 chips 承担（带计数，同样可点选）。 */}
      <div className="nc-tiles nc-tiles-6">
        <div className="nc-tile" title={`口径：收款类合同执行额合计（销售 / 检测 / 维保 / 综合；框架协议仅计其下执行单、不含框架额度；已排除价格调整补充与历史续签） · 收款类 ${recvRows.length} 份 / 台账共 ${contracts.length} 份`}>
          <div className="nc-tile-value num"><Money v={sumExec} role={role} wan /></div>
          <div className="nc-tile-label">应收合同额</div>
          <div className="nc-tile-sub">收款类 {recvRows.length} 份</div>
        </div>
        <div className="nc-tile" title="口径：收款类合同累计已收（Σ 收款期次实收）">
          <div className="nc-tile-value num"><Money v={sumRecv} role={role} wan /></div>
          <div className="nc-tile-label">已收款</div>
          <div className="nc-tile-sub">回款率 {recvRate}%</div>
        </div>
        <div className="nc-tile is-clickable" title="口径：收款类执行额 − 累计已收。点击筛选：已过收款计划日且未收齐" onClick={() => { setTab('全部'); setStF(''); setQuick('收款逾期'); setPage(1); }}>
          <div className="nc-tile-value num"><Money v={openRecv} role={role} wan /></div>
          <div className="nc-tile-label">待收款</div>
          <div className="nc-tile-sub">{overdueCnt ? <>逾期 {overdueCnt} 份 · <Money v={overdueAmt} role={role} wan /></> : <>占总 {100 - recvRate}%</>}</div>
        </div>
        <div className="nc-tile" title={`口径：采购合同执行额合计（我方应付） · 采购 ${payRows.length} 份`}>
          <div className="nc-tile-value num"><Money v={sumPay} role={role} wan /></div>
          <div className="nc-tile-label">应付合同额</div>
          <div className="nc-tile-sub">采购 {payRows.length} 份</div>
        </div>
        <div className="nc-tile" title="口径：Σ 状态为「已付款」的付款单金额">
          <div className="nc-tile-value num"><Money v={sumPaid} role={role} wan /></div>
          <div className="nc-tile-label">已付款</div>
          <div className="nc-tile-sub">付款率 {payRate}%</div>
        </div>
        <div className="nc-tile" title="口径：采购执行额 − 累计已付">
          <div className="nc-tile-value num"><Money v={openPay} role={role} wan /></div>
          <div className="nc-tile-label">待付款</div>
          <div className="nc-tile-sub">占总 {100 - payRate}%</div>
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
          <button className={`nc-fchip${dirF === 'in' ? ' is-on' : ''}`} onClick={() => { setDirF(dirF === 'in' ? '' : 'in'); setPage(1); }} title="收款类：销售 / 检测 / 维保等，我方收钱">我方收款<span className="n">{contracts.filter((c) => !isPayContract(c)).length}</span></button>
          <button className={`nc-fchip${dirF === 'out' ? ' is-on' : ''}`} onClick={() => { setDirF(dirF === 'out' ? '' : 'out'); setPage(1); }} title="付款类：采购 / 分包，我方付钱">我方付款<span className="n">{contracts.filter((c) => isPayContract(c)).length}</span></button>
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
        <Btn onClick={() => setMoreOpen((v) => !v)} title="展开对方主体 / 签署日期 / 类型 / 项目 / 合同分类等筛选">
          {moreOpen ? '收起筛选 ▴' : '更多筛选 ▾'}
        </Btn>
        <Btn onClick={() => setAdvOpen((v) => !v)} title="含税金额 / 已收付 / 未收付 / 资金进度 / 生效与结束日期区间">
          {advOpen ? '收起高级 ▴' : '高级筛选 ▾'}
        </Btn>
        <Btn kind="link" size="sm" onClick={resetFilters}>重置</Btn>
        <span style={{ flex: 1 }} />
        <span className="nc-ltbar-div" />
        <ExportButton onClick={exportApi.trigger} selectedCount={contractSel.length} />
        <Btn kind="primary" onClick={() => go('contract-new')}><Ico n="plus" size={14} /> 新建合同</Btn>
      </div>

      {/* 「更多筛选」展开行：对方主体 + 签署日期区间（常用）+ 项目选择器 + 类型/分类合并下拉，默认收起 */}
      {moreOpen && (
        <div className="nc-ctbar" style={{ marginTop: 8 }}>
          <select className="nc-input" style={{ width: 180 }} value={partyF} title="对方主体（客户 / 供应商）"
            onChange={(e) => { setPartyF(e.target.value); setPage(1); }}>
            <option value="">对方主体</option>
            {Array.from(new Set(contracts.map((c) => c.party))).map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <input type="date" className="nc-input" style={{ width: 138 }} value={signFrom} title="签署日期从"
            onChange={(e) => { setSignFrom(e.target.value); setPage(1); }} />
          <span className="nc-cell-sub">至</span>
          <input type="date" className="nc-input" style={{ width: 138 }} value={signTo} title="签署日期到"
            onChange={(e) => { setSignTo(e.target.value); setPage(1); }} />
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

      {/* 「高级筛选」展开行（2026-09-28 新增）：金额与资金类区间按合同方向取值 —— 收款类 = 已收/未收，采购类 = 已付/未付 */}
      {advOpen && (
        <div className="nc-ctbar" style={{ marginTop: 8 }}>
          <label className="nc-cell-sub" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>含税金额
            <input type="number" className="nc-input" style={{ width: 104 }} placeholder="最小" value={amtMin}
              onChange={(e) => { setAmtMin(e.target.value); setPage(1); }} />
            <span>~</span>
            <input type="number" className="nc-input" style={{ width: 104 }} placeholder="最大" value={amtMax}
              onChange={(e) => { setAmtMax(e.target.value); setPage(1); }} />
          </label>
          <label className="nc-cell-sub" style={{ display: 'flex', alignItems: 'center', gap: 4 }} title="收款类合同取「已收」，采购类合同取「已付」">已收 / 已付
            <input type="number" className="nc-input" style={{ width: 104 }} placeholder="最小" value={doneMin}
              onChange={(e) => { setDoneMin(e.target.value); setPage(1); }} />
            <span>~</span>
            <input type="number" className="nc-input" style={{ width: 104 }} placeholder="最大" value={doneMax}
              onChange={(e) => { setDoneMax(e.target.value); setPage(1); }} />
          </label>
          <label className="nc-cell-sub" style={{ display: 'flex', alignItems: 'center', gap: 4 }} title="收款类合同取「未收」，采购类合同取「未付」">未收 / 未付
            <input type="number" className="nc-input" style={{ width: 104 }} placeholder="最小" value={openMin}
              onChange={(e) => { setOpenMin(e.target.value); setPage(1); }} />
            <span>~</span>
            <input type="number" className="nc-input" style={{ width: 104 }} placeholder="最大" value={openMax}
              onChange={(e) => { setOpenMax(e.target.value); setPage(1); }} />
          </label>
          <label className="nc-cell-sub" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>资金进度 %
            <input type="number" className="nc-input" style={{ width: 72 }} placeholder="最小" min={0} max={100} value={progMin}
              onChange={(e) => { setProgMin(e.target.value); setPage(1); }} />
            <span>~</span>
            <input type="number" className="nc-input" style={{ width: 72 }} placeholder="最大" min={0} max={100} value={progMax}
              onChange={(e) => { setProgMax(e.target.value); setPage(1); }} />
          </label>
          <label className="nc-cell-sub" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>生效日期
            <input type="date" className="nc-input" style={{ width: 132 }} value={effFrom}
              onChange={(e) => { setEffFrom(e.target.value); setPage(1); }} />
            <span>~</span>
            <input type="date" className="nc-input" style={{ width: 132 }} value={effTo}
              onChange={(e) => { setEffTo(e.target.value); setPage(1); }} />
          </label>
          <label className="nc-cell-sub" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>结束日期
            <input type="date" className="nc-input" style={{ width: 132 }} value={endFrom}
              onChange={(e) => { setEndFrom(e.target.value); setPage(1); }} />
            <span>~</span>
            <input type="date" className="nc-input" style={{ width: 132 }} value={endTo}
              onChange={(e) => { setEndTo(e.target.value); setPage(1); }} />
          </label>
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
