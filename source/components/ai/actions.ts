// 诺安云 6.0 · AI 助手 · 页面快捷操作
//
// 诉求（用户 2026-09-24）：「比如很多页面用到的 OCR 识别，就可以在对应页面路由时就能快捷操作」
//
// 为什么要有这一层：
//   OCR 识别 / 导入 / 上传这类能力散落在各页的按钮里，用户得先知道「这个功能在哪个页、
//   哪个按钮」才能用。助手既然知道用户当前在哪一页，就该把该页最常用的入口直接摆出来 ——
//   点一下跳过去并打开，不必自己找。
//
// ⚠️ 与「预置问题」的分工（两者不重叠）：
//     预置问题 = 解释口径，回答「为什么这样算」（产出是文字）
//     快捷操作 = 直达入口，回答「我要动手做，入口在哪」（产出是打开一个入口）
//
// ⚠️ 助手只负责「打开入口 + 预置上下文」，不代替用户提交。
//    写操作不该由问答组件代劳 —— 真正的填写与提交仍在页面里由用户完成。
import type { AiRoute } from './store';
import type { IconName } from '../icons';

export type PageAction = {
  id: string;
  /** 按钮文案：业务语言，动词开头，说清「点了会发生什么」 */
  label: string;
  /** 图标名（取自 components/icons.tsx 的既有集合，用 IconName 约束避免写错） */
  ico: IconName;
  /** 一句话说明：让人点之前知道这是什么 */
  hint: string;
  /** 目标页；缺省 = 当前所在页（多数动作是「在本页打开入口」） */
  to?: string;
};

/**
 * 页面 → 该页可用的快捷操作。
 * 选取标准：① 该页确实是这个动作的入口；② 这个动作在本页够高频；
 *          ③ 用户自己找入口的成本高（散在弹窗里、或需要先选类型）。
 */
export const PAGE_ACTIONS: Record<string, PageAction[]> = {
  /* 证书管理：OCR 建档是这里最省事的入口 —— 证书多是纸质拍照，手工录一本要几分钟 */
  cert: [
    { id: 'new-ocr', label: 'OCR 识别证书建档', ico: 'camera', hint: '上传证书照片，自动预填字段后逐项核对' },
    { id: 'new', label: '手工新增证书', ico: 'plus', hint: '没有照片、或字段需要手工填写时用' },
  ],
  /* 文档中心：检测报告、验收资料多为扫描件 */
  doc: [
    { id: 'upload', label: '上传文档', ico: 'upload', hint: '扫描件 / 检测报告归集到项目' },
  ],
  /* 客户管理：客户档案批量导入 + 现场拜访留痕 */
  customer: [
    { id: 'import', label: 'Excel 导入客户', ico: 'upload', hint: '按模板批量导入，自动跳过重复客户' },
    { id: 'quick', label: '现场拍照登记', ico: 'camera', hint: '带水印与定位的拜访留痕' },
  ],
  /* 合同管理：新签合同多为对方发来的 PDF / 扫描件 */
  contract: [
    { id: 'new-ocr', label: 'OCR 识别创建合同', ico: 'camera', hint: '上传合同扫描件，识别后左图右字段校对', to: 'contract-new' },
  ],
};

/** 取某页的快捷操作；未配置的页面返回空数组（该页不显示操作区） */
export function actionsFor(page: string): PageAction[] {
  return PAGE_ACTIONS[page] ?? [];
}

/** 快捷操作 → 路由（跳页 + 携带动作标识），供助手的 doAction 使用 */
export function actionRoute(page: string, a: PageAction): AiRoute {
  return { label: a.label, page: a.to ?? page };
}

/* ============================================================================
   导入识别（面板内的工作入口）
   ----------------------------------------------------------------------------
   诉求（用户 2026-09-24）：「在 AI 窗口就可以导入识别了，提供快速工作的入口」

   与「页面快捷操作」的分工：
     页面快捷操作 = 跳过去、把页面里的入口替你打开（仍需自己去那个页）
     导入识别     = 在助手窗口内就把文件收进来、把字段读出来，只把「核对确认」留给业务页

   ⚠️ 为什么核对不放在助手窗口：核对需要「左图右字段」的大界面（原件与字段并排比对），
      384px 的浮窗放不下，硬塞进去只会让两边都难用。助手负责「快速启动 + 先看到结果」，
      业务页负责「精细核对 + 提交」—— 这条边界是有意的，不是偷懒。

   ⚠️ 演示态：不真的解析文件。选/拖入文件后模拟识别进度，产出预置字段样例。
   ============================================================================ */
export type ImpKind = {
  id: string;
  label: string;
  ico: IconName;
  /** 识别完成后「去核对」的目标页 */
  toPage: string;
  /** 复用页面快捷操作的 action 通道，落到目标页就打开对应入口 */
  actionId: string;
  /** 「去核对」按钮文案 */
  goLabel: string;
  /** 演示态：识别出的字段样例（业务语言，不出现表名 / 字段名） */
  fields: { k: string; v: string }[];
};

export const IMP_KINDS: ImpKind[] = [
  {
    id: 'cert', label: '证书照片', ico: 'shield',
    toPage: 'cert', actionId: 'new-ocr', goLabel: '带到证书管理核对',
    fields: [
      { k: '证书名称', v: '消防设施工程专业承包 一级' },
      { k: '证书编号', v: 'D237012345' },
      { k: '有效期至', v: '2027-06-30' },
      { k: '持证主体', v: '诺盾博达消防科技有限公司' },
    ],
  },
  {
    id: 'contract', label: '合同扫描件', ico: 'scroll',
    toPage: 'contract-new', actionId: 'new-ocr', goLabel: '带到新建合同核对',
    fields: [
      { k: '合同名称', v: '昆明万达广场消防改造工程合同' },
      { k: '相对方', v: '昆明万达广场商业管理有限公司' },
      { k: '合同金额', v: '¥3,200,000' },
      { k: '工期', v: '2026-09-01 至 2026-12-31' },
    ],
  },
  {
    id: 'doc', label: '检测报告', ico: 'file',
    toPage: 'doc', actionId: 'upload', goLabel: '带到文档中心归集',
    fields: [
      { k: '文档名称', v: '消防设施检测报告' },
      { k: '报告编号', v: 'JC-2026-0918' },
      { k: '所属项目', v: '昆明万达广场消防改造工程' },
    ],
  },
  {
    id: 'customer', label: '客户名单', ico: 'users',
    toPage: 'customer', actionId: 'import', goLabel: '带到客户管理导入',
    fields: [
      { k: '识别结果', v: '12 条客户记录' },
      { k: '疑似重复', v: '2 条（按名称 + 税号判定）' },
    ],
  },
];

/** 取某类导入的识别步骤文案（进度条分段用，让人知道卡在哪一步） */
export const IMP_STEPS = ['上传文件', '版面分析与文字识别', '字段提取', '完成'];
