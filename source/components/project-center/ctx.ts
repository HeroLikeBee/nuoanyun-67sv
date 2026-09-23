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

export type Project = typeof PROJECTS[number];

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
  /** 目标成本（立项预算） */
  TARGET_COST: number;
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
  depInAmt: number;

  /* ---------- 台账数据（缩放 / 派生后） ---------- */
  costRows: PjCostRow[];
  planRows: { type: string; amt: number; note: string }[];
  groupedPlan: { g: string; rows: { type: string; amt: number; note: string }[]; sum: number }[];
  /** 9 个成本类别的 实际 vs 计划（用于对比条） */
  bars: { t: string; act: number; pln: number; max: number }[];
  barMax: number;
  /** 现场投入：人工 / 机械 / 材料 */
  laborRows: PjLaborRow[];
  laborSum: number;
  machRows: PjMachRow[];
  machSum: number;
  matRows: PjMatRow[];
  matSum: number;
  /** 收支明细 */
  payRows: PjPayRow[];
  payFilter: string;
  setPayFilter: (v: string) => void;
  SUM_IN: number;
  SUM_OUT: number;
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
  curMile: PjMileAxis | undefined;
  curReq: string[];
  curFiles: { name: string; size: string; by: string; date: string }[];
  curMiss: string[];
  /** 督办条目数（与右栏渲染条目一一对应，不硬编码） */
  dunCount: number;
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
