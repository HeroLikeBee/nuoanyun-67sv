// 项目详情 · 项目级演示数据工厂
//
// 存在意义（2026-09-23 评审）：
//   改造前，项目详情的 17 组台账（收支明细 / 成本流水 / 变更 / 签证 / 保证金 / 施工日志 /
//   报验 / 隐蔽验收 / 安全检查 / 整改轮次 / 相关方 / 机械 / 材料领用 / 操作记录 / 里程碑 /
//   准入资料 / 工程量）都是模块级常量 —— 点开任何项目看到的都是「昆明万达」的那一套。
//   本文件把这些数据改为按项目自身字段派生，做到「一个项目一套数」。
//
// 派生原则：
//   1. 能用项目自身字段算出来的，一律算出来（合同额 / 执行额 / 回款率 / 成本 / 工期）；
//   2. 算不出来的（现场记录类），用项目 id 做确定性伪随机，保证同一项目每次渲染一致、
//      不同项目之间可区分，且不需要往 data.ts 里塞十几张演示表；
//   3. 所有「已发生」的日期一律由 TODAY 反向派生 —— 结构上杜绝「未来日期标已完成」。
import { TODAY, MILESTONE_LEGAL, arrivalReqOf, attCost, attDays, itemByCode, laborRate, ATT_WORKERS, SUPPLIERS, CUSTOMERS } from '../data';
import type { Contract, Installment } from '../data';
import type { PjAttachGroup, PjCostRow, PjDepositRow, PjLaborRow, PjMachRow, PjMatRow, PjMileRow, PjPayRow, PjSaleContract, Project } from './ctx';

/* ==================================================================
 * 一、里程碑模板：一套名单，按业务线取用
 * 说明：MILESTONE_LEGAL（法定节点）按「去掉 M 序号后的名字」匹配，故节点名必须与
 *      data.ts 的 MILESTONE_LEGAL 对齐（隐蔽工程验收 / 第三方消防检测 / 消防验收备案）。
 * ================================================================== */
type MileTpl = { name: string; req: string[]; pct: number };

const MILE_TPL: Record<string, MileTpl[]> = {
  /* 消防工程施工：设计→报验→隐蔽→安装→调试→检测→备案→结算 */
  GC: [
    { name: 'M1 进场准备', req: ['施工方案报审', '开工令'], pct: 5 },
    { name: 'M2 材料进场报验', req: ['进场报审表', '材料合格证'], pct: 15 },
    { name: 'M3 隐蔽工程验收', req: ['隐蔽工程验收记录', '影像资料'], pct: 30 },
    { name: 'M4 管线安装', req: ['管线安装记录', '影像资料'], pct: 45 },
    { name: 'M5 设备安装', req: ['设备安装记录', '开箱验收单'], pct: 60 },
    { name: 'M6 系统调试', req: ['联调报告', '影像资料'], pct: 72 },
    { name: 'M7 第三方消防检测', req: ['检测委托单', '检测报告'], pct: 84 },
    { name: 'M8 消防验收备案', req: ['验收查验记录', '备案受理凭证', '产品身份标识（B 签）清单'], pct: 92 },
    { name: 'M9 竣工资料', req: ['竣工图', '签字件'], pct: 97 },
    { name: 'M10 结算', req: [], pct: 100 },
  ],
  /* 消防检测：勘查→方案→检测→整改复检→报告→结算 */
  JC: [
    { name: 'M1 进场准备', req: ['检测方案报审', '开工令'], pct: 8 },
    { name: 'M2 现场勘查', req: ['勘查记录', '影像资料'], pct: 20 },
    { name: 'M3 检测作业', req: ['检测原始记录', '影像资料'], pct: 45 },
    { name: 'M4 不合格项整改复检', req: ['整改回复单', '复检记录'], pct: 65 },
    { name: 'M5 检测报告出具', req: ['检测报告'], pct: 85 },
    { name: 'M6 报告归档与结算', req: ['报告签收单'], pct: 100 },
  ],
  /* 消防设施维护保养：方案→首检→月巡→季检→年报→续签评估 */
  WB: [
    { name: 'M1 进场准备', req: ['服务方案', '进场确认单'], pct: 8 },
    { name: 'M2 首次全面巡检', req: ['首次巡检报告'], pct: 25 },
    { name: 'M3 月度巡检', req: ['月度巡检记录'], pct: 55 },
    { name: 'M4 季度联动检测', req: ['季度检测报告'], pct: 80 },
    { name: 'M5 年度维保报告', req: ['年度维保报告'], pct: 95 },
    { name: 'M6 续签评估与结算', req: ['续签评估单'], pct: 100 },
  ],
  /* 智慧消防平台（软件 + 硬件交付）：需求→踏勘→安装→联调→试运行→培训验收→运维 */
  RJ: [
    { name: 'M1 需求确认', req: ['需求确认书', '实施方案'], pct: 10 },
    { name: 'M2 现场踏勘与点位确认', req: ['踏勘记录', '点位确认单'], pct: 25 },
    { name: 'M3 设备进场与安装', req: ['到货验收单', '安装记录'], pct: 45 },
    { name: 'M4 平台部署与联调', req: ['联调记录', '数据接入清单'], pct: 65 },
    { name: 'M5 试运行', req: ['试运行报告'], pct: 82 },
    { name: 'M6 培训与验收交付', req: ['培训签到表', '验收报告'], pct: 95 },
    { name: 'M7 运维交接与结算', req: ['运维交接单'], pct: 100 },
  ],
  /* 应急抢修：接报→查勘→抢修→复测→报告结算 */
  QT: [
    { name: 'M1 接报响应', req: ['接报记录', '派工单'], pct: 10 },
    { name: 'M2 现场查勘与方案确认', req: ['查勘记录', '抢修方案确认单'], pct: 30 },
    { name: 'M3 抢修施工', req: ['抢修记录', '影像资料'], pct: 60 },
    { name: 'M4 试压复测与系统恢复', req: ['试压记录', '恢复确认单'], pct: 82 },
    { name: 'M5 抢修报告与结算', req: ['抢修报告', '结算确认单'], pct: 100 },
  ],
};

/** 按业务线取里程碑模板（未知业务线回落工程施工） */
export function mileTplOf(biz: string): MileTpl[] {
  return MILE_TPL[biz] ?? MILE_TPL.GC;
}

/**
 * 里程碑节点 key（如 'M10 结算' → 'M10'）。
 * ⚠️ 不要用 slice(0, 2)：'M10'.slice(0, 2) === 'M1'，会让 M10 误命中 M1 的准入资料。
 */
export const nodeKey = (name: string) => name.split(' ')[0];

/** 是否法定节点（删除须二次确认） */
export const isLegalNode = (name: string) => MILESTONE_LEGAL.includes(name.replace(/^M\d+\s*/, ''));

/* ==================================================================
 * 二之二、场景文案表：同一段 UI，按业务线说本行业的话
 *
 * 背景（2026-09-24 通读发现的缺口）：以往子页标题 / 空态 / 卡片名写死为施工口径，
 * 打开维保或检测项目时通篇「隐蔽工程验收」「监理签认」「第三方消防检测委托」——
 * 一眼看出是把施工项目的页面套过去了。此处集中一处按 biz 派生，UI 只消费 scene 字段。
 * ================================================================== */
export type PjScene = {
  /** 业务线全称（用于标注口径来源） */
  bizLabel: string;
  /** 现场 / 作业日志 */
  logTitle: string;
  logEmpty: string;
  /** 隐蔽类验收（无此项的业务线由 UI 隐藏该区块，不再出现空标题） */
  hiddenTitle: string;
  hiddenSub: (n: number) => string;
  /** 材料进场报验 */
  arrivalTitle: string;
  arrivalEmpty: string;
  /** 检测 / 验收：卡片名与字段标签（检测项目由我方出具报告，不是委托第三方） */
  checkCard: string;
  checkOrgLabel: string;
  checkNoLabel: string;
  checkNote: string;
};

const SCENE: Record<string, PjScene> = {
  GC: {
    bizLabel: '消防工程施工',
    logTitle: '施工日志',
    logEmpty: '本项目暂无施工日志。',
    hiddenTitle: '隐蔽工程验收',
    hiddenSub: (n) => `${n} 项 · 均经监理签认`,
    arrivalTitle: '材料进场报验',
    arrivalEmpty: '本项目暂无材料进场报验记录。',
    checkCard: '第三方消防检测',
    checkOrgLabel: '检测机构',
    checkNoLabel: '委托单号',
    checkNote: '检测结论以第三方出具的正式报告为准，报告归档至「文档 · 验收」分类。',
  },
  WB: {
    bizLabel: '消防设施维护保养',
    logTitle: '维保服务日志',
    logEmpty: '本项目暂无维保服务日志。',
    hiddenTitle: '隐蔽工程验收',
    hiddenSub: (n) => `${n} 项`,
    arrivalTitle: '更换配件进场核验',
    arrivalEmpty: '本项目暂无更换配件进场核验记录。',
    checkCard: '季度联动检测',
    checkOrgLabel: '检测机构',
    checkNoLabel: '委托单号',
    checkNote: '维保期内的联动检测由具备资质的机构出具，报告归档至「文档 · 维保」分类。',
  },
  JC: {
    bizLabel: '建筑消防设施检测',
    logTitle: '现场检测日志',
    logEmpty: '本项目暂无现场检测日志。',
    hiddenTitle: '隐蔽工程验收',
    hiddenSub: (n) => `${n} 项`,
    arrivalTitle: '检测设备进场核验',
    arrivalEmpty: '本项目以仪器仪表进场作业，暂无材料进场报验记录。',
    checkCard: '检测报告出具',
    checkOrgLabel: '出具机构',
    checkNoLabel: '报告编号',
    checkNote: '本项目由我方出具检测报告（社会消防技术服务信息系统备案），正本归档至「文档 · 检测」。',
  },
  RJ: {
    bizLabel: '智慧消防平台',
    logTitle: '实施日志',
    logEmpty: '本项目暂无实施日志。',
    hiddenTitle: '隐蔽工程验收',
    hiddenSub: (n) => `${n} 项`,
    arrivalTitle: '设备到货验收',
    arrivalEmpty: '本项目暂无设备到货验收记录。',
    checkCard: '系统验收交付',
    checkOrgLabel: '验收组织',
    checkNoLabel: '验收单号',
    checkNote: '由建设单位组织验收并出具验收单，通过后进入质保期运维。',
  },
  QT: {
    bizLabel: '应急抢修',
    logTitle: '抢修日志',
    logEmpty: '本项目暂无抢修日志。',
    hiddenTitle: '隐蔽部位恢复前验收',
    hiddenSub: (n) => `${n} 项 · 均经甲方代表签认`,
    arrivalTitle: '抢修用料进场核验',
    arrivalEmpty: '本项目暂无抢修用料进场核验记录。',
    checkCard: '修复后复核检测',
    checkOrgLabel: '检测机构',
    checkNoLabel: '委托单号',
    checkNote: '抢修完成后按原系统标准复核，结论以修复后检测 / 试压记录为准。',
  },
};

/** 按业务线取场景文案（未知业务线回落工程施工） */
export const sceneOf = (biz: string): PjScene => SCENE[biz] ?? SCENE.GC;

/* ==================================================================
 * 二、确定性伪随机：同一项目 + 同一用途 → 恒定值
 * ================================================================== */
function seedNum(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}
/** [lo, hi] 区间内的确定性取值 */
const pick = (key: string, lo: number, hi: number) => lo + Math.round(seedNum(key) * (hi - lo));
/** 从数组里确定性取一项 */
const pickOne = <T,>(key: string, arr: T[]): T => arr[Math.floor(seedNum(key) * arr.length) % arr.length];

/* ==================================================================
 * 三、日期工具
 * ================================================================== */
const DAY = 86400000;
const t = (s: string) => new Date(`${s}T00:00:00`).getTime();
const fmt = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const addDays = (s: string, n: number) => fmt(t(s) + n * DAY);
export const daysBetween = (a: string, b: string) => Math.round((t(b) - t(a)) / DAY);
/** 距今天的天数（正数 = 过去） */
export const daysAgo = (s: string) => daysBetween(s, TODAY);
/** 过去 n 天（永远 ≤ TODAY，用于「已发生」记录） */
const past = (n: number) => addDays(TODAY, -n);

/* ==================================================================
 * 四、工厂主体
 * ================================================================== */
export type PjDemo = {
  /** 本项目的场景文案（施工 / 维保 / 检测 / 平台 / 抢修各说各的话） */
  scene: PjScene;
  /** 里程碑节点（含计划/实际/状态/责任人/准入资料齐备） */
  mileRows: PjMileRow[];
  /** 节点准入资料分组（与 mileRows 同一套名单） */
  attach: PjAttachGroup[];
  attCnt: number;
  curMileName: string | null;
  curReq: string[];
  curFiles: { name: string; size: string; by: string; date: string }[];
  curMiss: string[];
  /** 里程碑轴（概览/血缘用）：节点名 + 日期 + 状态 + 累计进度 */
  mileAxis: { name: string; date: string; st: string; pct: number }[];
  /** 施工进度（工序产值加权，与里程碑同源） */
  workItems: { name: string; totalQty: number; doneQty: number; unitPrice: number; unit: string }[];
  progActual: number;
  progPlan: number;

  /* ---- 资金 ---- */
  cashIn: number;
  payRows: PjPayRow[];
  overdue: PjPayRow[];
  overdueAmt: number;
  overdueDays: number;
  sumIn: number;
  sumOut: number;

  /* ---- 成本 ---- */
  costRows: PjCostRow[];
  machRows: PjMachRow[];
  machSum: number;
  matRows: PjMatRow[];
  matSum: number;
  laborRows: PjLaborRow[];
  laborSum: number;

  /* ---- 商务 ---- */
  changes: PjChangeRow[];
  visas: PjVisaRow[];
  deposits: PjDepositRow[];

  /* ---- 质量 ---- */
  arrivals: PjArrivalRow[];
  hidden: PjHiddenRow[];
  safeRows: PjSafeRow[];
  rectifyRounds: PjRectifyRound[];
  checkInfo: PjCheckInfo;

  /* ---- 现场与协作 ---- */
  siteLogs: PjSiteLog[];
  parties: PjPartyGroup[];
  ops: PjOpRow[];
};

export type PjChangeRow = { id: string; title: string; amt: number; st: string; by: string; date: string; contract: string; cat: string; flowIdx?: number };
export type PjVisaRow = { no: string; date: string; reason: string; amt: number; photos: number; sign: string; chg: string; chgSt: string };
export type PjArrivalRow = { no: string; batch: string; date: string; items: string; need: string[]; have: string[]; sign: string };
export type PjHiddenRow = { part: string; date: string; content: string; photos: number; sign: string };
export type PjSafeRow = { item: string; res: string; by: string; date: string };
export type PjRectifyRound = { round: string; check: string; recheck: string; owner: string; state: string; tone: 'green' | 'orange'; items: { n: string; pos: string; done: boolean }[] };
export type PjCheckInfo = { org: string; no: string; date: string; res: string; note: string };
export type PjSiteLog = { date: string; weather: string; text: string; photos: number; att: string };
export type PjPartyGroup = { key: string; g: string; tone: 'blue' | 'green' | 'orange' | 'purple'; rows: { name: string; role: string; org: string; phone: string; st: string }[] };
export type PjOpRow = { t: string; w: string; tag: string; d: string };

const CT_TERMINAL = ['已终止', '已关闭', '作废'];
const isBuyCt = (c: Contract) => c.type === '采购合同' || c.type === '分包合同';

/**
 * 组装一个项目的全套演示数据。
 * @param P         当前项目
 * @param contracts 本项目关联的全部合同（调用方已按 project 过滤）
 */
export function buildPjDemo(P: Project, contracts: Contract[]): PjDemo {
  const proj = P.id;
  const saleCtAll = contracts.filter((c) => !isBuyCt(c));
  const buyCt = contracts.filter(isBuyCt);
  /** 本项目的场景文案（施工 / 维保 / 检测 / 平台 / 抢修各说各的话） */
  const scene = sceneOf(P.biz);

  /* ---------- 4.1 计划曲线：按项目自己声明的计划进度归一化到工期跨度 ----------
     段 1（pct ≤ 计划应到）：计划起点 → TODAY 之间线性铺开
     段 2（pct > 计划应到）：TODAY → 计划竣工日之间线性铺开
     这样「已完成节点的计划日」必然落在过去，而「未完成节点」落在未来 —— 不必依赖
     P.start 是否早于今天（种子里有项目 start 就是今天，线性排期会退化）。 */
  const span = Math.max(1, daysBetween(P.start, P.end));
  const elapsed = Math.max(0, daysBetween(P.start, TODAY));
  const progPlan = P.progressPlan ?? Math.min(100, Math.round((elapsed / span) * 100));
  const progActual = P.milestone;
  const seg1 = Math.max(elapsed, Math.round((span * progPlan) / 100), 30);
  const seg2 = Math.max(1, daysBetween(TODAY, P.end));
  const planDate = (pct: number) => (pct <= progPlan
    ? addDays(TODAY, -Math.round(seg1 * (1 - pct / Math.max(1, progPlan))))
    : addDays(TODAY, Math.round((seg2 * (pct - progPlan)) / Math.max(1, 100 - progPlan))));

  /* ---------- 4.2 里程碑 + 准入资料 ---------- */
  const tpl = mileTplOf(P.biz);
  const owners = ['张工', '陈工', '何监理', '王工', '杨工', '李工', '陈静', '王会计'];
  /** 实际完成日：计划日已到则取计划日；计划日未到说明提前完成，落到 TODAY */
  const actualOf = (plan: string) => (daysBetween(plan, TODAY) >= 0 ? plan : TODAY);

  const mileRows: PjMileRow[] = tpl.map((n, i) => {
    const plan = planDate(n.pct);
    const done = n.pct <= progActual;
    const isCur = !done && tpl.slice(0, i).every((x) => x.pct <= progActual);
    return {
      n: n.name,
      plan,
      act: done ? actualOf(plan) : '—',
      st: done ? '已完成' : isCur ? '进行中' : '待开始',
      owner: owners[i % owners.length],
    };
  });
  const curIdx = mileRows.findIndex((r) => r.st === '进行中');
  const curMileName = curIdx >= 0 ? mileRows[curIdx].n : null;

  /* 准入资料：已完成节点必然齐备（缺件硬拦截本就不允许确认）；当前节点按项目确定性缺 1~2 项 */
  const missCount = curIdx >= 0 ? pick(`${proj}-miss`, 0, 2) : 0;
  const attach: PjAttachGroup[] = tpl.map((n, i) => {
    const done = n.pct <= progActual;
    const isCur = n.name === curMileName;
    const missing = isCur ? n.req.slice(n.req.length - missCount) : [];
    const files = n.req
      .filter((r) => !missing.includes(r))
      .map((r, k) => ({
        name: `${r}-${nodeKey(n.name)}.${k % 2 ? 'pdf' : 'xlsx'}`,
        size: `${(0.4 + seedNum(`${proj}${n.name}${r}`) * 3.6).toFixed(1)}MB`,
        by: owners[i % owners.length],
        date: done ? actualOf(planDate(n.pct)) : past(3 + i),
      }));
    return { mile: n.name, reached: daysBetween(planDate(n.pct), TODAY) >= 0, req: n.req, files };
  });
  const curGroup = attach.find((g) => g.mile === curMileName);
  const curReq = curGroup?.req ?? [];
  const curFiles = curGroup?.files ?? [];
  const curMiss = curReq.filter((r) => !curFiles.some((f) => f.name.includes(r)));
  const attCnt = attach.reduce((s, g) => s + g.files.length, 0);

  const mileAxis = tpl.map((n) => {
    const row = mileRows.find((r) => r.n === n.name)!;
    return {
      name: n.name,
      date: row.st === '已完成' ? `已完成 ${row.act}` : row.st === '进行中' ? `进行中 · 计划 ${row.plan}` : `待开始 · 计划 ${row.plan}`,
      st: row.st === '已完成' ? 'done' : row.st === '进行中' ? 'cur' : '',
      pct: n.pct,
    };
  });

  /* ---------- 4.3 工序产值：进度 = Σ(doneQty×unitPrice) ÷ Σ(totalQty×unitPrice) ----------
     以项目自己的 progressActual 为锚，反推工序完成量，保证「工程量完成率」与
     概览 KPI 的「施工进度」是同一个数，不再是两个口径。 */
  const WORK_BY_BIZ: Record<string, [string, string, number][]> = {
    GC: [['喷头安装', '个', 1000], ['镀锌钢管敷设', '米', 100], ['报警探测器安装', '只', 500], ['防排烟风管制作', '㎡', 200]],
    JC: [['火灾报警系统检测', '点', 120], ['消火栓系统检测', '套', 260], ['自动喷水灭火系统检测', '区', 900], ['防排烟系统检测', '处', 380]],
    WB: [['消防设施巡检', '次', 800], ['灭火器年检', '具', 60], ['报警系统联动测试', '点', 150], ['消火栓出水试验', '处', 420]],
    RJ: [['平台软件部署', '套', 12000], ['物联网关安装', '台', 2400], ['传感器接入调试', '点', 180], ['系统联合调试', '次', 3000]],
    QT: [['管段更换', '米', 260], ['阀门更换', '只', 1200], ['试压检测', '次', 1500], ['系统功能复测', '项', 800]],
  };
  const workSrc = WORK_BY_BIZ[P.biz] ?? WORK_BY_BIZ.GC;
  const workItems = (P.workItems ?? workSrc.map(([name, unit, unitPrice]) => ({
    name, unit, unitPrice,
    totalQty: Math.max(10, Math.round((P.execAmt / 10000) * pick(`${proj}${name}`, 2, 9))),
    doneQty: 0,
  }))).map((w) => ({ ...w, doneQty: Math.round((w.totalQty * progActual) / 100) }));

  /* ---------- 4.4 资金：收入取项目真实期次，支出取本项目付款类合同 ---------- */
  const payRows: PjPayRow[] = [];
  let skSeq = 0;
  let pfSeq = 0;
  let hcSeq = 0;

  /* 收入：收款类合同（非补充协议、非已终止）的期次 —— 到账的进「已到账」，开票未到账的挂账龄 */
  saleCtAll
    /* 纳入主合同 + 服务类合同（独立服务补充、框架执行单，凡挂本项目且有自己期次）的真实收付；
       仅排除价格调整补充（无独立期次，随主合同结算）与已终止合同。 */
    .filter((c) => c.contractRole !== 'supplement_price' && !CT_TERMINAL.includes(c.status))
    .forEach((c) => {
      (c.installments ?? []).forEach((i: Installment) => {
        if (i.got > 0) {
          skSeq += 1;
          payRows.push({
            id: `SK${String(skSeq).padStart(6, '0')}`, kind: '收入', contract: c.id, amt: i.got,
            use: `${i.n} · 银行已到账`, st: 'paid', date: i.gotDate === '—' ? i.plan : i.gotDate,
          });
        }
        if (i.inv === '已开票' && i.got < i.amt) {
          skSeq += 1;
          payRows.push({
            id: `SK${String(skSeq).padStart(6, '0')}`, kind: '收入', contract: c.id, amt: i.amt - i.got,
            use: `${i.n} · 已开票未到账`, st: 'invoiced', date: i.plan,
          });
        }
      });
    });

  /* 支出：本项目付款类合同（到货预付 / 进度款 + 一笔红字冲销） */
  buyCt.forEach((b) => {
    const p1 = Math.round(b.amt * 0.4);
    const p2 = Math.round(b.amt * 0.25);
    pfSeq += 1;
    payRows.push({
      id: `PF${String(pfSeq).padStart(6, '0')}`, kind: '采购付款', contract: b.id, amt: p1,
      use: `${b.name} · 到货预付款`, st: 'paid', date: past(pick(`${proj}${b.id}a`, 40, 70)),
    });
    if (b.status !== '待审批') {
      hcSeq += 1;
      const pfId = `PF${String(pfSeq + 1).padStart(6, '0')}`;
      const hcId = `HC${String(hcSeq).padStart(6, '0')}`;
      payRows.push({
        id: pfId, kind: '采购付款', contract: b.id, amt: p2,
        use: `${b.name} · 进度款`, st: 'flushed', hc: hcId, date: past(pick(`${proj}${b.id}b`, 20, 38)),
      });
      payRows.push({
        id: hcId, kind: '红字冲销单', contract: `冲抵 ${pfId}`, amt: -p2,
        use: '红字冲销 · 发票抬头错误（财务 · 王会计）', st: 'hc', date: past(pick(`${proj}${b.id}c`, 10, 18)),
      });
      pfSeq += 1;
    }
  });

  /* 无合同付款（项目级挂账）：只在有付款类合同、且项目在执行中时出现 —— 应急采购的前提是现场在动 */
  if (buyCt.length > 0 && !['待启动', '已结项', '已关闭', '作废'].includes(P.status)) {
    pfSeq += 1;
    const merged = buyCt[0];
    const amt = pick(`${proj}-nopo`, 60000, 190000);
    payRows.push({
      id: `PF${String(pfSeq).padStart(6, '0')}`, kind: '无合同付款', contract: '—（项目级）', amt,
      use: '应急采购 · 现场抢修用料', st: 'paid', date: past(pick(`${proj}-nopod`, 15, 30)),
      mergedTo: merged.id,
    });
    pfSeq += 1;
    payRows.push({
      id: `PF${String(pfSeq).padStart(6, '0')}`, kind: '无合同付款', contract: '—（项目级）',
      amt: pick(`${proj}-nopo2`, 30000, 90000), use: '应急辅材 · 待归并',
      st: 'approving', date: past(pick(`${proj}-nopo2d`, 2, 9)),
    });
  }
  payRows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const overdue = payRows.filter((r) => r.st === 'invoiced');
  const overdueAmt = overdue.reduce((s, r) => s + r.amt, 0);
  const overdueDays = overdue.length ? Math.max(...overdue.map((r) => daysAgo(r.date))) : 0;
  const sumIn = payRows.filter((r) => r.kind === '收入' && r.st === 'paid').reduce((s, r) => s + r.amt, 0);
  const sumOut = payRows.filter((r) => r.kind !== '收入' && r.st === 'paid').reduce((s, r) => s + r.amt, 0);
  /* 已回款 = 已到账收入合计（与收款期次、项目 recvPct 三处同源） */
  const cashIn = sumIn;

  /* ---------- 4.5 成本流水：按项目实际成本等比缩放，说明取本项目自己的合同 ---------- */
  // 成本结构按业务类型区分：工程重材料 / 分包 / 机械；维保重人工与备件；检测重人工与检测报告
  const COST_META: Record<string, { src: 'CG' | 'CB'; note: (c: Contract[]) => string }> = {
    材料费: { src: 'CG', note: (c) => (c.find(isBuyCt)?.name ?? '材料 / 备件采购合同') },
    分包费: { src: 'CG', note: (c) => (c.filter(isBuyCt)[1]?.name ?? '安装劳务分包') },
    人工费: { src: 'CB', note: () => '班组工资 / 检测工时（月度登记）' },
    管理费: { src: 'CB', note: () => '现场管理杂费' },
    机械费: { src: 'CB', note: () => '吊装 / 台班' },
    检测费: { src: 'CB', note: () => '第三方检测 / 仪器检定费' },
  };
  const COST_W: Record<string, { type: string; w: number }[]> = {
    GC: [
      { type: '材料费', w: 0.52 }, { type: '分包费', w: 0.24 }, { type: '人工费', w: 0.11 },
      { type: '管理费', w: 0.05 }, { type: '机械费', w: 0.04 }, { type: '检测费', w: 0.04 },
    ],
    WB: [
      { type: '人工费', w: 0.58 }, { type: '材料费', w: 0.27 }, { type: '管理费', w: 0.15 },
    ],
    JC: [
      { type: '人工费', w: 0.62 }, { type: '检测费', w: 0.26 }, { type: '管理费', w: 0.12 },
    ],
  };
  const costTpl = COST_W[P.biz] ?? COST_W.GC;
  let cgSeq = 0;
  let cbSeq = 0;
  const costRows: PjCostRow[] = costTpl.map((x, i) => {
    const meta = COST_META[x.type];
    const id = meta.src === 'CG' ? `CG${String(++cgSeq).padStart(6, '0')}` : `CB${String(++cbSeq).padStart(6, '0')}`;
    return {
      id, src: meta.src, type: x.type, amt: Math.round(P.cost * x.w), date: past(pick(`${proj}${x.type}`, 18 + i * 6, 30 + i * 6)),
      note: meta.note(contracts),
    };
  });
  /* 无合同付款的两笔也计入成本流水（与资金侧同源，避免两处口径） */
  payRows.filter((r) => r.kind === '无合同付款').forEach((r) => {
    costRows.push({
      id: r.id, src: 'PF', type: P.biz === 'GC' ? '分包费' : '人工费', amt: r.amt, date: r.date,
      note: `无合同付款 · ${r.use}`, st: r.st === 'approving' ? 'approving' : undefined, mergedTo: r.mergedTo,
    });
  });

  /* ---------- 4.6 现场投入：人工取项目真实考勤，机械 / 材料按项目规模派生 ---------- */
  const laborRows: PjLaborRow[] = (() => {
    const hit = ATT_WORKERS.filter((w) => w.proj === proj);
    const list = hit.length ? hit : ATT_WORKERS.slice(0, 4);
    return list.map((w) => ({
      id: w.id, name: w.name, trade: w.trade, team: w.team,
      days: attDays(w, 21), rate: laborRate(w.trade), cost: attCost(w, 21),
    }));
  })();
  const laborSum = laborRows.reduce((s, r) => s + r.cost, 0);
  const machRows: PjMachRow[] = P.biz === 'GC'
    ? [
      ['25T 汽车吊', '台班', 2400], ['高空作业车', '台班', 1600], ['电焊机（含耗材）', '台班', 320], ['管道试压泵', '台班', 580],
    ].map(([name, unit, price], i) => ({
      name: String(name), unit: String(unit), qty: pick(`${proj}${name}`, 6, 26), price: Number(price),
      date: i < 2 ? past(pick(`${proj}${name}d`, 20, 40)) : addDays(TODAY, pick(`${proj}${name}p`, 4, 26)),
      amt: 0,
    })).map((r) => ({ ...r, amt: r.qty * r.price }))
    : [];
  const machSum = machRows.reduce((s, r) => s + r.amt, 0);
  const matRows: PjMatRow[] = costRows.filter((r) => r.type === '材料费').map((r, i) => ({
    code: `CL${String(100 + i).padStart(6, '0')}`, date: r.date,
    qty: Math.max(1, Math.round(r.amt / 260)), name: `${P.name.slice(0, 6)}用主材 ${i + 1}`,
    spec: '见技术协议', unit: '批', ty: '材料', price: 260, stock: pick(`${proj}m${i}`, 0, 40), amt: r.amt,
  }));
  const matSum = matRows.reduce((s, r) => s + r.amt, 0);

  /* ---------- 4.7 商务：变更 / 签证 / 保证金 ---------- */
  const mainCt = saleCtAll.find((c) => c.contractRole === 'primary') ?? saleCtAll[0];
  const mainId = mainCt?.id ?? '';
  const execDelta = mainCt ? Math.max(0, mainCt.execAmt - mainCt.amt) : 0;
  const changes: PjChangeRow[] = [];
  if (mainCt) {
    if (execDelta > 0) {
      changes.push({
        id: 'BG0001', title: `价格调整补充协议（${mainId}S1）`, amt: execDelta, st: '已生效',
        by: P.owner, date: past(pick(`${proj}chg1`, 30, 50)), contract: mainId, cat: '材料调差',
      });
    }
    const pending = pick(`${proj}chg2`, 60000, 160000);
    changes.push({
      id: 'BG000009', title: '现场增补（甲方口头要求）', amt: pending, st: '商务审批中', flowIdx: 2,
      by: P.owner, date: past(pick(`${proj}chg2d`, 6, 20)), contract: mainId, cat: '材料费',
    });
  }
  const pendingChg = changes.find((c) => c.id === 'BG000009');
  const visas: PjVisaRow[] = mainCt ? [
    {
      no: 'QZ000007', date: past(pick(`${proj}v1`, 8, 22)), reason: '现场新增桥架绕行（甲方口头要求）',
      amt: pendingChg?.amt ?? 80000, photos: pick(`${proj}v1p`, 3, 8), sign: '已签认',
      chg: 'BG000009', chgSt: '商务审批中',
    },
    {
      no: 'QZ000006', date: past(pick(`${proj}v2`, 3, 12)), reason: '吊顶内管线避让（现场洽商）',
      amt: pick(`${proj}v2a`, 12000, 46000), photos: pick(`${proj}v2p`, 2, 6), sign: '待签认',
      chg: '—', chgSt: '未生成变更单',
    },
  ] : [];

  /* 保证金：只放本项目真实发生的（我方缴纳未退） */
  const depTypes = ['履约保证金', '投标保证金'];
  const deposits: PjDepositRow[] = [
    {
      id: 'BZ000003', type: depTypes[0], dir: 'in', party: `${P.customer}（${mainId || P.id}）`,
      amt: pick(`${proj}dep`, 8000, 30000), pay: past(pick(`${proj}depd`, 30, 60)),
      due: addDays(TODAY, pick(`${proj}depdue`, 10, 90)), st: '未退',
    },
    {
      id: 'BZ000001', type: depTypes[1], dir: 'in', party: P.customer,
      amt: pick(`${proj}dep2`, 3000, 12000), pay: past(pick(`${proj}dep2d`, 90, 150)),
      due: past(pick(`${proj}dep2due`, 60, 90)), st: '已退还',
    },
  ];

  /* ---------- 4.8 质量：报验 / 隐蔽 / 安全检查 / 整改轮次 / 检测 ----------
   * 报验要求**由物料主数据派生**（arrivalReqOf），不再写死三项：
   * 需施加 AB 签的强制认证产品会自动多出「B 签清单」这一项 —— 缺它 = 竣工资料无法报验。
   */
  /* 进场核验批次按业务线取：施工取主材，维保取更换配件，平台取到货设备，检测无材料批次。
     维保 / 平台批里含 CCC 强制认证产品（探测器 / 消火栓箱 / 报警控制器），照样触发 B 签校验。 */
  const ARRIVAL_MATS: Record<string, string[][]> = {
    GC: [['CL000123', 'CL000188'], ['EQ000002', 'CL000233'], ['CL000158', 'CL000177']],
    WB: [['EQ000002', 'CL000233'], ['CL000158', 'EQ000001'], ['EQ000002', 'CL000158']],
    RJ: [['EQ000001', 'EQ000002'], ['CL000233', 'EQ000002']],
    JC: [],
  };
  const arrivalSrc = ARRIVAL_MATS[P.biz] ?? ARRIVAL_MATS.GC;
  const arrivals: PjArrivalRow[] = arrivalSrc.map((codes, i) => {
    const ms = codes.map((c) => itemByCode(c)).filter(Boolean);
    const need = [...new Set(ms.flatMap((m) => arrivalReqOf(m)))];
    /* 中间那一批缺 B 签清单（演示「强制认证产品无 B 签 → 硬拦截退回」） */
    const have = i === 1 ? need.filter((n) => n !== 'B 签清单') : need;
    return {
      no: `JCBY${String(10 + i).padStart(6, '0')}`, batch: `第 ${3 - i} 批`,
      date: past(4 + i * 9),
      items: ms.map((m, k) =>
        `${m!.name} × ${pick(`${proj}ar${i}${k}`, 20, 480)}${m!.unit}`).join('、'),
      need, have, sign: have.length < need.length ? '缺件退回' : '已签认',
    };
  });

  /* 隐蔽验收只有涉及封闭部位的施工类项目才有 —— 维保 / 检测 / 平台一概不适用（留空由 UI 隐藏区块）。
     抢修多为拆开后恢复，恢复前需甲方代表或物业签认，故 QT 保留但部位与签认人按抢修口径。 */
  const HIDDEN_TPL: Record<string, [string, string, string][]> = {
    GC: [
      ['一区 · 喷淋支管隐蔽', '标高、坡度、支架间距、防腐处理经验收合格', '监理'],
      ['二区 · 报警总线穿管隐蔽', '线管保护、防火封堵、跨接线连接经验收合格', '监理'],
    ],
    QT: [
      ['客房层 · 管井管段恢复前验收', '管段更换已完成，试压 1.4MPa 保压 30 分钟无渗漏', '甲方代表'],
      ['地下一层 · 支架与套管恢复前验收', '支架间距、防腐与防火封堵经验收合格', '甲方代表'],
    ],
  };
  const hiddenSrc = HIDDEN_TPL[P.biz] ?? [];
  const hidden: PjHiddenRow[] = hiddenSrc.map(([part, content, sign], i) => ({
    part, date: past(6 + i * 7), content,
    photos: pick(`${proj}hid${i}`, 4, 10), sign: `${sign}（已签认）`,
  }));

  const SAFE_ITEMS = ['临时用电箱接地检查', '高处作业安全带佩戴', '动火作业审批与看护', '消防通道占用排查', '焊接作业区灭火器配置'];
  const safeRows: PjSafeRow[] = SAFE_ITEMS.map((item, i) => ({
    item, res: i === 2 ? '整改后合格' : '合格', by: i % 2 ? '陈工' : '张工', date: past(2 + i * 3),
  }));

  /* 整改项按业务线派生：平台类没有「喷淋/总线」问题，否则一眼看出是套施工模板 */
  const RECTIFY_SRC: Record<string, { one: [string, string][]; zero: [string, string][] }> = {
    RJ: {
      one: [
        ['消控室网关离线重连策略未生效', '平台 · 设备接入层'],
        ['水压传感器上报频率与阈值未按方案配置', '平台 · 数据配置'],
        ['移动端告警推送延迟超过 30 秒', '平台 · 告警中心'],
      ],
      zero: [
        ['历史数据补传接口字段缺失（已补充）', '平台 · 数据接口'],
        ['值班账号权限分级未按甲方要求拆分（已调整）', '平台 · 权限管理'],
      ],
    },
  };
  const rectifySrc = RECTIFY_SRC[P.biz] ?? {
    one: [
      ['末端试水装置压力表量程不匹配', '三层 · 喷淋系统'],
      ['报警主机备用电源未做放电试验记录', '一层 · 消控室'],
      ['防火阀手动复位机构标识缺失', '负一层 · 防排烟'],
    ],
    zero: [
      ['喷头间距局部超出规范上限（已调整）', '一区 · 喷淋支管'],
      ['报警总线端子压接不规范', '二区 · 报警总线'],
    ],
  };
  /* 整改轮次：只有进入验收流程（已申报及以后）的项目才有整改记录 */
  const inAccept = ['已申报', '整改中', '已通过', '已备案'].includes(P.acceptStatus ?? '');
  const rectifyRounds: PjRectifyRound[] = inAccept ? [
    {
      round: '第 1 轮', check: past(pick(`${proj}r1`, 5, 14)), recheck: '—', owner: P.pm, state: '整改中', tone: 'orange',
      items: rectifySrc.one.map(([n, pos], i) => ({ n, pos, done: i === 0 })),
    },
    {
      round: '第 0 轮（自检）', check: past(pick(`${proj}r0`, 18, 26)), recheck: past(pick(`${proj}r0b`, 15, 22)), owner: P.pm, state: '已闭环', tone: 'green',
      items: rectifySrc.zero.map(([n, pos]) => ({ n, pos, done: true })),
    },
  ] : [];

  /* 检测 / 验收口径：
     检测类项目（JC）由我方出具报告，不是委托第三方 —— org 取自有检测中心；
     其余业务线委托具备资质的第三方机构，机构名从供应商主数据取（同一 Usedto 唯一处取数），
     不再写死「云南××消防检测有限公司」。 */
  const testSupplier = SUPPLIERS.find((s) => s.cats.includes('检测'));
  const checkOrg = P.biz === 'JC'
    ? '本公司消防设施检测中心（自有资质）'
    : (testSupplier?.name ?? '—');
  const checkNo = `${P.biz === 'JC' ? 'BG' : 'JC'}${P.end.slice(0, 4)}-${String(pick(`${proj}ck`, 100, 999))}`;
  const checkInfo: PjCheckInfo = inAccept
    ? {
      org: checkOrg, no: checkNo,
      date: past(pick(`${proj}ckd`, 8, 30)), res: P.acceptStatus === '已通过' || P.acceptStatus === '已备案' ? '合格' : '—',
      note: scene.checkNote,
    }
    : { org: '—', no: '—', date: '—', res: '—', note: `完成${tpl[tpl.length - 2]?.name ?? '末节点'}后办理，${scene.checkNote}` };

  /* ---------- 4.9 作业日志 / 相关方 / 操作记录 ----------
     日志按业务线派生（维保不会写「喷淋支管安装」，检测不会写「隐蔽验收」），
     每条日志的部位与数量都由项目自身的确定性伪随机取位，避免同类项目连日志一字不差。 */
  /** 作业部位：先按业态（客户 / 项目名关键词）取词库，未命中再按业务线取兜底。
      检测项目的「机场 / 化工厂」、维保项目的「医院 / 酒店」部位词必须各自成套，
      否则磷化工厂区检测日志里会出现「航站楼 A 区」这类串味文案。 */
  const ZONE_RULES: { kw: string[]; zones: string[] }[] = [
    { kw: ['机场', '航站'], zones: ['航站楼 A 区', '航站楼 B 区', '行李处理机房', '能源中心', '消控室'] },
    { kw: ['医院', '卫生院'], zones: ['住院楼', '门诊楼', '医技楼', '地下车库', '屋面消防泵房'] },
    { kw: ['酒店', '客栈', '宾馆'], zones: ['客房层', '大堂中庭', '地下车库', '后勤区', '屋面'] },
    { kw: ['化工', '制药'], zones: ['生产车间', '罐区', '原料库区', '综合楼', '消控室'] },
    { kw: ['钢铁', '冶金'], zones: ['炼钢车间', '轧钢车间', '管网走廊区', '制氧站', '消控室'] },
    { kw: ['景区', '文旅', '度假'], zones: ['游客中心', '索道上站', '民宿集群', '南片区', '消控室'] },
    { kw: ['政务', '行政'], zones: ['办事大厅', '办公区', '地下车库', '档案库区', '消控室'] },
    { kw: ['学校', '学院', '附中', '中学', '小学', '大学'], zones: ['教学楼', '学生公寓', '食堂', '图书馆', '消控室'] },
    { kw: ['广场', '商场', '万达'], zones: ['商业裙楼', '地下超市', '影院区', '地下车库', '屋面冷却区'] },
    { kw: ['园区', '产业园', '工业园', '科技园', '厂区', '厂房'], zones: ['厂房一', '厂房二', '综合楼', '地下车库', '消控室'] },
  ];
  const ZONE_FALLBACK: Record<string, string[]> = {
    GC: ['一区', '二区', '裙楼三层', '地下车库', '屋面机房层'],
    WB: ['主楼', '附楼', '地下车库', '屋面消防泵房', '消控室'],
    JC: ['单体一', '单体二', '办公区', '地下车库', '消控室'],
    RJ: ['核心区', '接入机房', '值班室', '南片区', '消控室'],
    QT: ['客房层', '地下车库', '屋面', '后勤区', '大堂中庭'],
  };
  const siteKw = `${P.name}${P.customer}${P.type ?? ''}`;
  const ZONES = (ZONE_RULES.find((r) => r.kw.some((k) => siteKw.includes(k)))?.zones)
    ?? ZONE_FALLBACK[P.biz] ?? ZONE_FALLBACK.GC;
  const zoneAt = (i: number) => pickOne(`${proj}z${i}`, ZONES);
  const SITE_TEXT: Record<string, ((z: (i: number) => string) => string)[]> = {
    GC: [
      (z) => `${z(0)}喷淋支管安装 ${pick(`${proj}l1`, 60, 260)} 米，隐蔽验收记录已上传归档。`,
      (z) => `${z(1)}报警总线敷设，第 ${pick(`${proj}l2`, 2, 4)} 批材料进场报验单经监理签认。`,
      () => `雨天停止室外作业，转为消控室主机接线与回路测试（${pick(`${proj}l3`, 60, 180)} 点）。`,
      (z) => `${z(2)}管线安装完成并通过隐蔽验收，监理签认 ${pick(`${proj}l4`, 2, 5)} 份。`,
    ],
    WB: [
      () => `月度例行巡检：报警主机、喷淋末端、消火栓共 ${pick(`${proj}l1`, 96, 268)} 点，发现 ${pick(`${proj}l1b`, 1, 4)} 项待处理。`,
      () => `更换到期灭火器 ${pick(`${proj}l2`, 12, 48)} 具，旧瓶统一回收并登记去向。`,
      (z) => `${z(0)}末端试水装置压力表渗漏，已更换密封垫并复测合格。`,
      (z) => `${z(1)}季度联动测试：排烟风机、防火卷帘、消防泵逐一动作试验，出具季度检测报告。`,
    ],
    JC: [
      (z) => `进场核对${z(0)}图纸与现场一致性，确认检测范围与抽样点位。`,
      () => `火灾报警系统检测：抽测 ${pick(`${proj}l2`, 120, 460)} 点，回路绝缘与联动功能逐项记录。`,
      (z) => `${z(1)}喷淋末端试水与消防泵性能检测，数据同步录入原始记录表。`,
      () => `当日检测发现 ${pick(`${proj}l4`, 1, 5)} 项不合格项，已下达整改通知单并约定复检窗口。`,
    ],
    RJ: [
      (z) => `${z(0)}现场踏勘完成，网关点位与网络条件已与甲方确认。`,
      () => `消控室网关安装联网，平台侧创建 ${pick(`${proj}l2`, 6, 32)} 个设备对象。`,
      () => `完成 ${pick(`${proj}l3`, 8, 24)} 路传感与视频接入联调，数据回传正常。`,
      (z) => `${z(1)}组织甲方值班人员使用培训，交付操作手册与账号清单。`,
    ],
    QT: [
      (z) => `接报后 ${pick(`${proj}l1`, 1, 3)} 小时到场，确认为${z(0)}喷淋主阀后管道破裂，先做止水与排水。`,
      () => `更换破裂管段 DN100 共 ${pick(`${proj}l2`, 3, 12)} 米，试压 1.4MPa 保压 30 分钟无渗漏。`,
      (z) => `${z(1)}系统恢复充水并复测报警联动，现场清理后向物业移交。`,
      () => `出具抢修报告与临时修复说明，纳入后续整改报价范围（${pick(`${proj}l4`, 2, 5)} 项整改建议）。`,
    ],
  };
  const siteText = SITE_TEXT[P.biz] ?? SITE_TEXT.GC;
  const WEATHER = ['晴', '多云', '阴', '晴'];
  const siteLogs: PjSiteLog[] = siteText.map((gen, i) => ({
    date: past(1 + i * 2), weather: `${WEATHER[i % WEATHER.length]} 18~26℃`, text: gen(zoneAt),
    photos: pick(`${proj}log${i}`, 3, 8),
    att: `AT${addDays(TODAY, -(1 + i * 2)).replace(/-/g, '')}${String(pick(`${proj}log${i}a`, 1, 9)).padStart(3, '0')}`,
  }));

  /* 相关方按业务线裁剪：监理只存在于施工类，检测机构只在「我方不是检测方」时出现；
     联系人一律从客户 / 供应商主数据取（与「客户档案」「供应商档案」同源），不再写死「刘经理」。 */
  const cust = CUSTOMERS.find((c) => c.name === P.customer);
  /* 演示数据里部分客户名做了脱敏（××），主数据中查不到 —— 这类按项目 id 派生接洽人，
     不留「—」也不复用同一个「刘经理」（后者正是「点开任何项目都同一套人」的老毛病）。 */
  const ownerName = cust?.contact ?? pickOne(`${proj}ownn`, ['王经理', '李主任', '张工', '陈主管', '赵科长', '孙老师']);
  const ownerPhone = cust?.phone ?? `138****${String(pick(`${proj}ownp`, 1000, 9999))}`;
  const SUP_ORGS = ['云南××工程监理有限公司', '云南××建设工程监理有限公司', '云南××建设项目管理有限公司'];
  const hasSuper = P.biz === 'GC';
  const hasTester = checkInfo.org !== '—' && P.biz !== 'JC';
  const GOV_ROW: Record<string, [string, string]> = {
    GC: ['消防备案对接人', '属地消防救援大队'],
    WB: ['维保项目备案对接人', '消防技术服务信息系统'],
    JC: ['检测报告备案对接人', '消防技术服务信息系统'],
    RJ: ['平台接入与备案对接人', '甲方信息化归口'],
    QT: ['抢修备案对接人', '属地消防救援大队'],
  };
  const govRow = GOV_ROW[P.biz] ?? GOV_ROW.GC;
  const parties = ([
    {
      key: 'owner', g: '建设单位', tone: 'green',
      rows: [{ name: ownerName, role: '项目对接人', org: P.customer, phone: ownerPhone, st: '合作中' }],
    },
    {
      key: 'sup', g: '监理单位', tone: 'orange',
      rows: hasSuper ? [{
        name: pickOne(`${proj}supn`, ['何监理', '罗监理', '谢监理']), role: '总监理工程师',
        org: pickOne(`${proj}supo`, SUP_ORGS), phone: '139****7702', st: '合作中',
      }] : [],
    },
    {
      key: 'test', g: P.biz === 'JC' ? '委托方 / 见证方' : '第三方检测机构', tone: 'purple',
      rows: hasTester
        ? [{ name: testSupplier?.contact ?? '吴经理', role: '检测项目负责人', org: checkInfo.org, phone: testSupplier?.phone ?? '—', st: '合作中' }]
        : (P.biz === 'JC'
          ? [{ name: ownerName, role: '委托方代表（现场见证）', org: P.customer, phone: ownerPhone, st: '合作中' }]
          : []),
    },
    {
      key: 'gov', g: '监管与备案', tone: 'blue',
      rows: [{ name: '李工', role: govRow[0], org: govRow[1], phone: '0871-6****119', st: inAccept ? '受理中' : '待申报' }],
    },
    {
      key: 'vendor', g: '供应商 / 分包', tone: 'purple',
      rows: buyCt.slice(0, 2).map((b) => {
        const sup = SUPPLIERS.find((s) => s.name === b.party);
        return {
          name: sup?.contact ?? '商务对接人', role: b.type === '分包合同' ? '劳务负责人' : '供货负责人',
          org: b.party, phone: sup?.phone ?? '138****3301', st: '合作中',
        };
      }),
    },
  ] as PjPartyGroup[]).filter((g) => g.rows.length > 0);

  const ops: PjOpRow[] = [
    ...payRows.filter((r) => r.kind === '无合同付款').slice(0, 1).map((r) => ({
      t: `${r.date} 09:12`, w: '系统', tag: '自动',
      d: `无合同付款 ${r.id} 提交审批（${r.use} · 暂计入成本流水）`,
    })),
    ...payRows.filter((r) => r.mergedTo).map((r) => ({
      t: `${r.date} 17:42`, w: P.owner, tag: '手动',
      d: `${r.id} 归并 → ${r.mergedTo}（原行保留并置灰）`,
    })),
    ...payRows.filter((r) => r.hc).map((r) => ({
      t: `${r.date} 10:18`, w: '财务 · 王会计', tag: '手动', d: `红字冲销 ${r.id} → ${r.hc}`,
    })),
    ...changes.map((c) => ({
      t: `${c.date} 11:05`, w: c.by, tag: '手动',
      d: `合同侧发起变更 ${c.id}（+${c.amt.toLocaleString()}）· ${c.st}`,
    })),
    ...(curMileName ? [{ t: `${TODAY} 09:30`, w: '系统', tag: '自动', d: `里程碑推进至「${curMileName}」· 节点准入资料待补齐` }] : []),
  ];

  return {
    scene,
    mileRows, attach, attCnt, curMileName, curReq, curFiles, curMiss, mileAxis,
    workItems, progActual, progPlan,
    cashIn, payRows, overdue, overdueAmt, overdueDays, sumIn, sumOut,
    costRows, machRows, machSum, matRows, matSum, laborRows, laborSum,
    changes, visas, deposits,
    arrivals, hidden, safeRows, rectifyRounds, checkInfo,
    siteLogs, parties, ops,
  };
}

/* ==================================================================
 * 五、合同树分组（收款类 / 付款类）—— 从 ProjectCenterPage 搬来，保持单一实现
 * ================================================================== */
export function groupContracts(contracts: Contract[]): { saleCt: PjSaleContract[]; buyCt: { code: string; name: string; st: string; tone: 'blue' | 'green' | 'orange'; amt: number; warn?: string }[] } {
  const tone = (s: string): 'blue' | 'orange' | 'green' => (s === '履约中' ? 'green' : s === '待审批' ? 'orange' : s === '已签约' ? 'blue' : s === '已终止' ? 'orange' : 'blue');
  const saleCt: PjSaleContract[] = contracts
    /* 顶层 = 无 parentId；或父合同不在本项目合同集合（如框架执行单 FK000008：挂跨项目的框架协议 FK000001，
       父协议不挂项目，但执行单服务本项目，须在项目合同树可见） */
    .filter((c) => !isBuyCt(c) && (!c.parentId || !contracts.some((p) => p.id === c.parentId)))
    .map((c) => {
      const kids = contracts.filter((k) => k.parentId === c.id);
      const delta = c.execAmt - c.amt;
      const orphanKid = !!c.parentId && !contracts.some((p) => p.id === c.parentId);
      return {
        code: c.id, name: c.name, st: c.status, tone: tone(c.status), amt: c.amt, role: c.contractRole,
        badge: `${orphanKid ? `框架执行单（挂 ${c.parentId}）· ` : ''}合同额 ${c.amt.toLocaleString()} · 执行额 ${c.execAmt.toLocaleString()}${delta ? `（含已生效变更 ${delta > 0 ? '+' : ''}${delta.toLocaleString()}）` : ''}`,
        payplan: c.installments?.length
          ? c.installments.map((i) => ({ ...i, st: instSt(i), note: i.note ?? '' }))
          : undefined,
        children: kids.length ? kids.map((k) => ({
          code: k.id, name: k.name, amt: k.amt,
          note: k.contractRole === 'supplement_price' ? '价格调整补充协议（增量：合同额不动，只加执行额）' : '服务类补充协议（独立成行）',
        })) : undefined,
      };
    });
  const buyCt = contracts.filter(isBuyCt).map((c) => ({
    code: c.id, name: c.name, st: c.status, tone: tone(c.status), amt: c.amt,
    warn: c.status === '待审批' ? '待审批：合同未生效，付款须走预付款审批' : undefined,
  }));
  return { saleCt, buyCt };
}

/** 收款期次状态：由「实收 / 应收 / 开票 / 计划日」派生（与全站语义色一致） */
export function instSt(i: Installment): string {
  if (i.got >= i.amt && i.amt > 0) return '已到账';
  if (i.got > 0) return '部分到账';
  if (i.inv === '已开票' && daysBetween(i.plan, TODAY) > 0) return '逾期未收';
  if (i.inv === '已开票') return '已开票·待到账';
  return '未到期';
}
