// 项目详情 · 共用上下文与子页统一签名
//
// 设计契约：
//   各业务域子页（成本 / 商务 / 质量 / 资料 / 履约）只消费本文件的 PjCtx，不各自取数，
//   保证「同一个数字只算一次」——口径集中在 ProjectCenterPage 的 usePjCtx()，
//   子页只负责按业务域组织展示与交互。
//
// 子页返回结构：多个 <section className="nc-pjsection">，由外壳统一放进内容区。
import React from 'react';
import type { PROJECTS } from '../data';
import type {
  PjArrivalRow, PjChangeRow, PjCheckInfo, PjHiddenRow, PjOpRow, PjPartyGroup,
  PjRectifyRound, PjSafeRow, PjScene, PjSiteLog, PjVisaRow,
} from './seed';

export type Project = typeof PROJECTS[number];

/* 子页数据行类型统一由 seed.ts 定义并在此转出，避免子页各自声明同名类型 */
export type {
  PjArrivalRow, PjChangeRow, PjCheckInfo, PjHiddenRow, PjOpRow, PjPartyGroup,
  PjRectifyRound, PjSafeRow, PjScene, PjSiteLog, PjVisaRow,
};

/** 子页统一 props：go 用于跨页穿透，pj 用于回到项目自身子页 */
export type PjSubProps = { C: PjCtx };

export type PjCtx = {
  /** 当前项目（由 getFocus('project-center') 解析） */
  P: Project;
  role: string;
  go: (p: string) => void;
  /** 跳回本项目的某个子页（不做整页跳转，只切二级页签） */
  pj: (sub: string) => void;
  /** 打开本页内的弹窗：key 由 ProjectCenterPage 的 MODAL 注册表解析 */
  openM: (k: string) => void;
  /**
   * 变更 / 签证转为变更单 —— 一律回落到合同侧（合同详情「变更与签证」Tab）。
   * 变更是要签补充协议的合同单据，项目只是执行主体、消费结果，不在项目侧发起。
   * 不传 contractId 时落到本项目第一份收款类合同。
   */
  gotoContractChange: (contractId?: string) => void;
  toast: (msg: string, tone?: 'ok' | 'err') => void;
  /** 全局「操作记录」抽屉 */
  openLog: () => void;
  /** 项目全景（跨模块全链路，长内容 → 抽屉） */
  openPanorama: () => void;

  /** 按业务类型动态裁剪：false 的模块在子页隐藏（避免维保 / 检测项目出现机械 / 材料 / 分包空表） */
  feature: { machine: boolean; material: boolean; subcontract: boolean };
  /** 场景文案：施工 / 维保 / 检测 / 平台 / 抢修各自的标题与空态，子页不再写死施工口径 */
  scene: PjScene;

  /* ---------- 经营口径（唯一事实源 · 与概览页同源，不重复取数） ---------- */
  /** 合同额 = 主合同签约价（立项锚点，冻结） */
  CONTRACT_NOW: number;
  /** 执行额 = 合同额 + 已生效变更增量 */
  EXEC_AMT: number;
  /** 已回款（仅银行已到账） */
  CASH_IN: number;
  /** 净现金流 = 已回款 − 已付成本 */
  NET_IN: number;
  /** 未回款 = 执行额 − 已回款 − 坏账 */
  UNRECV: number;
  /** 回款进度 = 已回款 ÷ 执行额 */
  PAY_PROGRESS: number;
  /** 质保金 = 合同额 × 3% */
  WARRANTY: number;
  /** 目标成本为「未录入 · 按执行额估算」而非立项实录 */
  BUDGET_EST: boolean;
  /** 目标成本来源：手工编制 / 从关联报价成本明细带入（未录入时为空） */
  BUDGET_SRC?: 'manual' | 'quote';
  /** 实际成本（已发生） */
  COST_SUM: number;
  /** 目标成本合计（预算科目缩放后） */
  PLAN_SUM: number;
  /** 成本偏差 = 实际 − 目标（正为超支） */
  dev: number;
  devPct: number;
  COST_PROGRESS: number;
  /** 计划毛利率 / 实际毛利率（合同额口径） */
  planProfit: number;
  actProfit: number;
  /** 进度：实际 / 计划 / 偏差 / 预警级别 */
  progActual: number;
  progPlan: number;
  progDev: number;
  progLevel: 'red' | 'yellow' | 'ok';
  progTag: string;
  /** 应收账龄 */
  overdue: PjPayRow[];
  overdueAmt: number;
  /** 已生效 / 审批中变更金额 */
  CHG_EFFECTIVE: number;
  CHG_PENDING: number;
  /** 我方缴纳未退保证金 */
  depIn: { id: string; type: string; amt: number; due: string }[];

  /* ---------- 台账数据（全部由 seed.ts 的 buildPjDemo 按本项目派生） ---------- */
  costRows: PjCostRow[];
  groupedPlan: { g: string; rows: { type: string; amt: number; note: string }[]; sum: number }[];
  /** 现场投入：人工 / 机械 / 材料 */
  laborRows: PjLaborRow[];
  laborSum: number;
  machRows: PjMachRow[];
  machSum: number;
  matRows: PjMatRow[];
  matSum: number;
  /** 收支明细（已按资金域筛选器过滤） */
  payRows: PjPayRow[];
  /** 收支明细全集 —— 与资金域筛选器无关。
      收入类口径（回款四段、无合同付款挂账）必须用它，否则资金域一筛选就把别处的账清空。 */
  payRowsAll: PjPayRow[];
  payFilter: string;
  setPayFilter: (v: string) => void;
  SUM_IN: number;
  SUM_OUT: number;
  /** 应收账龄（已开票未到账）最长天数 */
  overdueDays: number;
  /** 保证金台账（含质保金义务行） */
  depositRows: PjDepositRow[];
  /** 团队与证书 */
  teamRows: PjTeamRow[];
  certRows: PjCertRow[];
  certValidTo: (id: string) => string;
  /** 关联合同（收款类 / 付款类） */
  saleCt: PjSaleContract[];
  buyCt: PjBuyContract[];
  /** 附件与里程碑 */
  attach: PjAttachGroup[];
  attCnt: number;
  mileRows: PjMileRow[];
  /** 里程碑轴（概览与全链路血缘共用） */
  mileAxis: PjMileAxis[];
  curMile: PjMileAxis | undefined;
  curReq: string[];
  curFiles: { name: string; size: string; by: string; date: string }[];
  curMiss: string[];
  /** 工序产值清单（进度 = Σ(doneQty×unitPrice) ÷ Σ(totalQty×unitPrice)） */
  workItems: { name: string; totalQty: number; doneQty: number; unitPrice: number; unit: string }[];

  /* ---------- 商务域台账（单一事实源：商务合同与成本台账共用同一份变更） ---------- */
  changes: PjChangeRow[];
  visas: PjVisaRow[];

  /* ---------- 质量域台账 ---------- */
  arrivals: PjArrivalRow[];
  hidden: PjHiddenRow[];
  /** 安全检查（HSE）—— 归执行履约域，不属质量验收 */
  safeRows: PjSafeRow[];
  rectifyRounds: PjRectifyRound[];
  checkInfo: PjCheckInfo;
  /** 质量待办：报验缺件批数 + 整改未闭环项数（KPI 与质量域同源） */
  qualityTodo: number;

  /* ---------- 现场与协作 ---------- */
  siteLogs: PjSiteLog[];
  parties: PjPartyGroup[];
  ops: PjOpRow[];
};

/* ---------- 子页共用的行类型（放在 ctx 内，避免子页各自声明同名类型） ---------- */
export type PjCostRow = {
  id: string; src: 'CG' | 'CB' | 'PF'; type: string; amt: number; date: string;
  note: string; st?: string; mergedTo?: string;
};
export type PjPayRow = {
  id: string; kind: string; contract: string; amt: number; use: string; st: string;
  date: string; hc?: string; mergedTo?: string;
};
export type PjLaborRow = { id: string; name: string; trade: string; team: string; days: number; rate: number; cost: number };
export type PjMachRow = { name: string; unit: string; qty: number; price: number; date: string; amt: number };
export type PjMatRow = { code: string; date: string; qty: number; name: string; spec: string; unit: string; ty: string; price: number; stock: number; amt: number };
export type PjDepositRow = { id: string; type: string; dir: string; party: string; amt: number; pay: string; due: string; st: string };
export type PjTeamRow = { id?: string; name: string; role?: string; trade?: string; phone?: string; cert?: string; st?: string; [k: string]: unknown };
export type PjCertRow = { certId?: string; id?: string; name?: string; [k: string]: unknown };
export type PjMileRow = { n: string; plan: string; act: string; st: string; owner: string };
export type PjMileAxis = { name: string; date: string; st: string; pct: number };
export type PjAttachGroup = { mile: string; reached: boolean; req: string[]; files: { name: string; size: string; by: string; date: string }[] };
export type PjSaleContract = {
  code: string; name: string; st: string; tone: 'blue' | 'orange' | 'green';
  badge?: string; amt: number; role?: string;
  children?: { code: string; name: string; amt: number; note: string }[];
  payplan?: { n: string; amt: number; st: string; plan: string; got: number; gotDate: string; inv: string; note: string }[];
};
export type PjBuyContract = {
  code: string; name: string; st: string; tone: 'blue' | 'green' | 'orange'; amt: number; warn?: string;
};
