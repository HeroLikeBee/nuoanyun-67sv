// 文档中心 —— 结构化资料库（分类导航 / 多维筛选 / 搜索 / 列表 / 详情）
// 核心：九大分类归集 · 关键字+标签+摘要检索 · 版本管理 · 竣工资料完整度 · 打包导出 · 在线发送（水印+有效期）
// 筛选维度：业务维（行业 · 项目类型 · 项目金额 · 具体项目）× 文档维（阶段 · 状态 · 类型 · 上传人 · 时间 · 必备）
//   业务维来自「项目 → 客户行业 / 项目类型 / 合同额」，可组合出「化工行业 + 100 万以上 + 检测项目」这类跨项目口径
//   已选条件统一回显为可删除标签，避免多层筛选后用户不知道当前筛了什么
import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
  Banner, Btn, Card, Code, DataTable, Drawer, Field, KvGrid, Modal, Money, Op, OpMore, OpSep,
  PageHead, ProjectPicker, TableFoot, Tabs, Tag, Timeline, Tip, useToast, Check, ContractPicker, Progress, EntityLink, WatermarkModal, type TagTone, ConfirmModal, pressProps, Tile,
} from '../components/ui';
import {
  DOCS, DOC_CATS, DOC_STATUS, DOC_STAGES, DOC_VERSIONS, DOC_LOGS, PROJECTS, CUSTOMERS, TODAY,
  idMarkFlowsOfProj, idMarkVersion, subscribeIdMark,
} from '../components/data';
import { consumePageAction, setFocus } from '../components/store';
import { Ico, StatusIco, type IconName } from '../components/icons';
import { getUserName } from '../components/export';

type D = (typeof DOCS)[number];

/**
 * 评审 D6：分类 / 类型徽标与状态徽标共用色板，同一行出现两个绿色（分类 green + 状态 green），
 * 用户无法凭色区分「分类」与「状态」。现将分类 / 类型收敛到中性色板（gray / blue / link / purple），
 * 把 green · orange · red · gold 保留给「状态 / 风险 / 时间临近」语义（见 STATUS_TONE）。
 */
/** 一级分类 → 徽标色（中性色板） */
const CAT_TONE: Record<string, TagTone> = {
  资质证照: 'gray', 招投标: 'blue', 合同协议: 'gray', 施工过程: 'blue',
  检测报告: 'blue', 验收交付: 'gray', 维护保养记录: 'gray', 财务票据: 'gray', 体系文件: 'gray',
};
/** 二级类型 → 徽标色（中性色板） */
const SUB_TONE: Record<string, TagTone> = {
  招标文件: 'blue', 投标文件: 'blue', 中标通知书: 'blue', 答疑澄清: 'blue',
  主合同: 'gray', 补充协议: 'gray', 安全协议: 'gray', 技术协议: 'gray',
  隐蔽验收记录: 'blue', 材料合格证: 'gray', 影像资料: 'blue', 施工组织设计: 'blue', 技术交底: 'gray',
  联动测试: 'blue', 第三方检测: 'blue', 材料送检: 'blue',
  竣工图: 'gray', 验收查验记录: 'gray', 竣工验收报告: 'gray', 移交清单: 'gray',
  巡检记录: 'gray', 维修工单: 'gray', 年度检测: 'blue',
  结算单: 'gray', 发票: 'gray', 付款凭证: 'gray',
  资质证书: 'gray', 营业执照: 'gray', 人员证书: 'gray', 安全生产许可证: 'gray',
  管理制度: 'gray', 作业指导书: 'gray', 表单模板: 'gray',
};
/** 状态 → 徽标色（语义色板，与分类色板互斥） */
const STATUS_TONE: Record<string, TagTone> = { 已归档: 'green', 待审核: 'orange', 已作废: 'red' };

/**
 * 消防验收资料清单（硬拦截校验依据）。
 * 末项「产品身份标识」= B 签清单：强制性认证目录内产品竣工验收必备，
 * 由物料域领用回写的号段自动生成（项目详情 · 质量验收子页可导出），缺它竣工资料完整度不成立。
 */
const ACCEPT_CHECKLIST = ['检测报告', '合格证', '图纸', '隐蔽验收记录', '产品身份标识'];

/** 热搜词（点击即搜） */
const HOT_KW = ['万达', '竣工图', '检测报告', '强制性认证', '验收查验记录', '维护保养'];
/** 搜索范围 */
const SCOPES = ['全部字段', '文件名', '文档编号', '标签', '摘要'];

const SORTS = ['最近更新', '最早更新', '名称 A→Z', '下载最多', '体积最大'];

/* ============================ 业务维度筛选口径 ============================ */
/** 项目合同额区间（单位：元） */
const AMT_BUCKETS = [
  { key: '', label: '全部金额', test: () => true },
  { key: 'lt50', label: '50 万以下', test: (a: number) => a > 0 && a < 500000 },
  { key: '50-100', label: '50 ~ 100 万', test: (a: number) => a >= 500000 && a < 1000000 },
  { key: '100-500', label: '100 ~ 500 万', test: (a: number) => a >= 1000000 && a < 5000000 },
  { key: 'ge500', label: '500 万以上', test: (a: number) => a >= 5000000 },
  { key: 'custom', label: '自定义…', test: () => true },
];
/** 上传时间区间（天） */
const DATE_RANGES = [
  { key: '', label: '全部时间', days: 0 },
  { key: '7', label: '近 7 天', days: 7 },
  { key: '30', label: '近 30 天', days: 30 },
  { key: '90', label: '近 90 天', days: 90 },
  { key: '365', label: '近一年', days: 365 },
];

/** 项目 → 客户行业（公司级文档返回 ''） */
const projOf = (id: string) => PROJECTS.find((p) => p.id === id);
const industryOf = (projId: string) => {
  if (!projId) return '';
  const p = projOf(projId);
  if (!p) return '';
  const c = CUSTOMERS.find((x) => x.id === p.customerId) || CUSTOMERS.find((x) => x.name === p.customer);
  return c?.industry ?? '';
};
const amtOf = (projId: string) => projOf(projId)?.contractAmt ?? 0;
const ptypeOf = (projId: string) => projOf(projId)?.type ?? '';
/** 距今天数（负数为未来） */
const daysAgo = (d: string) => Math.round((Date.parse(TODAY) - Date.parse(d)) / 86400000);

/** 体积 → KB（用于排序） */
const sizeKb = (s: string) => {
  const m = /^([\d.]+)\s*(KB|MB|GB|B)?$/i.exec(s.trim());
  if (!m) return 0;
  const n = Number(m[1]);
  const u = (m[2] || 'B').toUpperCase();
  return u === 'GB' ? n * 1024 * 1024 : u === 'MB' ? n * 1024 : u === 'KB' ? n : n / 1024;
};

export default function DocPage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  /* 身份标识流向账同源订阅：物料域领用回写后，本页完整度与清单即时刷新 */
  useSyncExternalStore(subscribeIdMark, idMarkVersion, idMarkVersion);

  /* ---------- 分类导航 ---------- */
  const [dirMode, setDirMode] = useState<'cat' | 'proj' | 'contract' | 'stage'>('cat');
  const [activeCat, setActiveCat] = useState('');
  const [activeSub, setActiveSub] = useState('');
  const [activeDir, setActiveDir] = useState('');
  const [activeStage, setActiveStage] = useState('');
  const [expanded, setExpanded] = useState<string[]>(['招投标', '合同协议']);

  /* ---------- 搜索 ---------- */
  const [kw, setKw] = useState('');
  const [scope, setScope] = useState('全部字段');
  const [hist, setHist] = useState<string[]>(['检测报告']);
  const [gOpen, setGOpen] = useState(false);
  const [gKw, setGKw] = useState('');

  /* ---------- 业务维度筛选 ---------- */
  /** 行业（多选，来自项目所属客户行业） */
  const [inds, setInds] = useState<string[]>([]);
  /** 项目类型：改造 / 维护保养 / 新建 / 检测 */
  const [ptypeF, setPtypeF] = useState('');
  /** 项目金额区间 + 自定义下限（万元） */
  const [amtF, setAmtF] = useState('');
  const [amtMin, setAmtMin] = useState('');
  /** 指定项目 */
  const [projF, setProjF] = useState('');
  /** 业务维筛选时是否仍保留公司级（无项目归属）文档 */
  const [incCompany, setIncCompany] = useState(false);

  /* ---------- 文档维度筛选 / 排序 / 分页 ---------- */
  const [stageF, setStageF] = useState('');
  const [typeF, setTypeF] = useState('');
  const [byF, setByF] = useState('');
  const [statusF, setStatusF] = useState('');
  const [dateF, setDateF] = useState('');
  const [needOnly, setNeedOnly] = useState(false);
  const [sort, setSort] = useState('最近更新');
  const [moreOpen, setMoreOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sel, setSel] = useState<string[]>([]);
  const [fav, setFav] = useState<string[]>(['DOC0010', 'DOC0004']);

  /* ---------- 详情 ---------- */
  const [detail, setDetail] = useState<D | null>(null);
  const [dTab, setDTab] = useState('base');

  /* ---------- 弹窗 ---------- */
  const [upOpen, setUpOpen] = useState(false);
  /* I2：后台打包任务进行中 */
  const [packing, setPacking] = useState(false);
  const [upVerOpen, setUpVerOpen] = useState(false);
  // 评审 I1：文档删除属高影响操作（必备资料直接关联验收资料完整度）
  const [delOpen, setDelOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [borrowOpen, setBorrowOpen] = useState(false);
  const [shareDays, setShareDays] = useState(7);
  /** 水印设置：'pack' 打包导出 / 'share' 分享链接；wmCfg 为当前生效的水印文本 */
  const [wmOpen, setWmOpen] = useState(false);
  const [wmFor, setWmFor] = useState<'pack' | 'share' | null>(null);
  /** 水印弹窗「作用范围」文案：打包导出 / 竣工资料包 / 分享链接 三个入口各自传入 */
  const [wmScopeLabel, setWmScopeLabel] = useState('');
  const [wmCfg, setWmCfg] = useState('仅限本项目使用');
  const [upType, setUpType] = useState('检测报告');
  const [upCat, setUpCat] = useState('检测报告');
  const [upStage, setUpStage] = useState<string>('施工');
  const [upProj, setUpProj] = useState(PROJECTS[0]?.id || '');
  const [upContract, setUpContract] = useState('');
  /** 项9：是否清单必备项 —— 默认勾选但可取消（原为硬编码 checked=true 不可改），口径=投标文件资料清单要求项 */
  const [upNeed, setUpNeed] = useState(true);
  const [missList, setMissList] = useState<string[]>([]);
  /* 项11：文档预览抽屉 */
  const [previewDoc, setPreviewDoc] = useState<D | null>(null);
  /* 项12：左侧分类树搜索 */
  const [catKw, setCatKw] = useState('');
  /* 项14：批量上传已选文件 */
  const [upFiles, setUpFiles] = useState<string[]>([]);

  /* Ctrl + K 唤起全局检索 */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); (e as unknown as { __ncHandled?: boolean }).__ncHandled = true; setGOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* AI 助手快捷操作：助手在本页点「上传文档」→ 跳本页并直接打开上传窗口。
     以 nav（路由脉冲）为依赖，已在文档中心时再点一次也能重新打开。 */
  useEffect(() => {
    if (consumePageAction('doc') === 'upload') setUpOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav]);

  /* ---------- 筛选项来源（带命中计数） ---------- */
  /** 行业列表：按文档数降序（文档 → 项目 → 客户行业） */
  const INDUSTRIES = useMemo(() => {
    const m = new Map<string, number>();
    DOCS.forEach((d) => { const i = industryOf(d.proj); if (i) m.set(i, (m.get(i) ?? 0) + 1); });
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([key, n]) => ({ key, n }));
  }, []);
  /** 项目类型列表 */
  const PTYPES = useMemo(() => [...new Set(PROJECTS.map((p) => p.type))], []);

  /* ---------- 过滤 + 排序 ---------- */
  const rows = useMemo(() => {
    const k = kw.trim();
    const bizOn = !!inds.length || !!ptypeF || !!amtF || !!projF;
    const minWan = Number(amtMin);
    let r = DOCS.filter((d) => {
      if (dirMode === 'cat') {
        if (activeCat && d.cat !== activeCat) return false;
        if (activeSub && d.sub !== activeSub) return false;
      } else if (dirMode === 'proj') {
        if (activeDir && d.proj !== activeDir) return false;
      } else if (dirMode === 'contract') {
        if (activeDir && d.contract !== activeDir) return false;
      } else if (dirMode === 'stage') {
        if (activeStage && d.stage !== activeStage) return false;
      }
      /* ---- 业务维度 ---- */
      if (bizOn && !d.proj && !incCompany) return false;
      if (inds.length && !inds.includes(industryOf(d.proj))) return false;
      if (ptypeF && ptypeOf(d.proj) !== ptypeF) return false;
      if (projF && d.proj !== projF) return false;
      if (amtF) {
        const amt = amtOf(d.proj);
        if (amtF === 'custom') { if (minWan > 0 && !(amt >= minWan * 10000)) return false; }
        else { const b = AMT_BUCKETS.find((x) => x.key === amtF); if (b && !b.test(amt)) return false; }
      }
      /* ---- 文档维度 ---- */
      if (stageF && d.stage !== stageF) return false;
      if (typeF && d.type !== typeF) return false;
      if (byF && d.by !== byF) return false;
      if (statusF && d.status !== statusF) return false;
      if (dateF) { const ago = daysAgo(d.date); if (!(ago >= 0 && ago <= Number(dateF))) return false; }
      if (needOnly && !d.need) return false;
      if (k) {
        const hay = scope === '文件名' ? d.name
          : scope === '文档编号' ? d.id
            : scope === '标签' ? d.tags.join(' ')
              : scope === '摘要' ? d.summary
                : `${d.name} ${d.id} ${d.tags.join(' ')} ${d.summary} ${d.proj} ${d.contract} ${d.by}`;
        if (!hay.toLowerCase().includes(k.toLowerCase())) return false;
      }
      return true;
    });
    const cmp: Record<string, (a: D, b: D) => number> = {
      最近更新: (a, b) => b.date.localeCompare(a.date),
      最早更新: (a, b) => a.date.localeCompare(b.date),
      '名称 A→Z': (a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'),
      下载最多: (a, b) => b.dl - a.dl,
      体积最大: (a, b) => sizeKb(b.size) - sizeKb(a.size),
    };
    r = [...r].sort(cmp[sort] || cmp['最近更新']);
    return r;
  }, [dirMode, activeCat, activeSub, activeDir, activeStage, inds, ptypeF, amtF, amtMin, projF, incCompany,
    stageF, typeF, byF, statusF, dateF, needOnly, kw, scope, sort]);

  const paged = rows.slice((page - 1) * pageSize, page * pageSize);
  const allOn = rows.length > 0 && rows.every((r) => sel.includes(r.id));
  /** 业务维筛选下被排除的公司级文档数（提示用，避免用户以为数据丢了） */
  const hiddenCompany = useMemo(() => {
    const bizOn = !!inds.length || !!ptypeF || !!amtF || !!projF;
    if (!bizOn || incCompany) return 0;
    return DOCS.filter((d) => !d.proj).length;
  }, [inds, ptypeF, amtF, projF, incCompany]);
  /* 统计瓦片基数 */
  const needMiss = DOCS.filter((d) => d.need && d.status !== '已归档').length;
  const thisMonth = DOCS.filter((d) => d.date.startsWith(TODAY.slice(0, 7))).length;
  const pendingReview = DOCS.filter((d) => d.status === '待审核').length;

  const pushHist = (v: string) => {
    const t = v.trim();
    if (!t) return;
    setHist((h) => [t, ...h.filter((x) => x !== t)].slice(0, 6));
  };
  const doSearch = (v: string) => { setKw(v); setPage(1); pushHist(v); };

  /* ---------- 已选条件（回显 + 单个删除 + 全部清空） ---------- */
  const amtLabel = amtF === 'custom'
    ? (Number(amtMin) > 0 ? `金额 ≥ ${amtMin} 万` : '自定义金额')
    : (AMT_BUCKETS.find((b) => b.key === amtF)?.label ?? '');
  const activeFilters = [
    ...inds.map((i) => ({ k: 'ind-' + i, label: '行业：' + i, clear: () => setInds((v) => v.filter((x) => x !== i)) })),
    ...(ptypeF ? [{ k: 'ptype', label: '项目类型：' + ptypeF, clear: () => setPtypeF('') }] : []),
    ...(amtF ? [{ k: 'amt', label: amtLabel, clear: () => { setAmtF(''); setAmtMin(''); } }] : []),
    ...(projF ? [{ k: 'proj', label: '项目：' + (projOf(projF)?.name ?? projF), clear: () => setProjF('') }] : []),
    ...(stageF ? [{ k: 'stage', label: '阶段：' + stageF, clear: () => setStageF('') }] : []),
    ...(statusF ? [{ k: 'status', label: '状态：' + statusF, clear: () => setStatusF('') }] : []),
    ...(typeF ? [{ k: 'type', label: '类型：' + typeF, clear: () => setTypeF('') }] : []),
    ...(byF ? [{ k: 'by', label: '上传人：' + byF, clear: () => setByF('') }] : []),
    ...(dateF ? [{ k: 'date', label: '时间：' + (DATE_RANGES.find((r) => r.key === dateF)?.label ?? ''), clear: () => setDateF('') }] : []),
    ...(needOnly ? [{ k: 'need', label: '只看验收清单必备项', clear: () => setNeedOnly(false) }] : []),
    ...(kw.trim() ? [{ k: 'kw', label: '关键字：' + kw.trim(), clear: () => setKw('') }] : []),
  ];
  const clearAll = () => {
    setInds([]); setPtypeF(''); setAmtF(''); setAmtMin(''); setProjF(''); setStageF('');
    setStatusF(''); setTypeF(''); setByF(''); setDateF(''); setNeedOnly(false); setKw(''); setSort('最近更新'); setPage(1);
  };

  const doUpload = () => {
    /* 「产品身份标识」由物料域号段回写产生，不参与上传类资料校验（传 PDF 也补不了） */
    const miss = ACCEPT_CHECKLIST
      .filter((c) => c !== '产品身份标识')
      .filter((c) => !DOCS.some((d) => d.type === c && d.proj === upProj));
    const newMiss = upType === '检测报告' ? miss.filter((m) => !DOCS.some((d) => d.type === m)) : [];
    setMissList(newMiss);
    if (newMiss.length) { toast(`资料清单校验未通过：缺少「${newMiss.join('、')}」，请补齐后上传`); return; }
    const n = upFiles.length || 1;
    toast(`已上传 ${n} 份文档「${upType}」至 ${upProj} · ${upStage} 阶段 · 分类【${upCat}】${upNeed ? ' · 标记为清单必备项' : ''} · 完整度已刷新`);
    setUpFiles([]);
    setUpOpen(false);
  };

  /* 评审 I2：打包为后台异步任务，原来点击后只有一条 toast、按钮无进行中反馈，
     用户会重复点击。改为 loading 态（禁用 + spinner）并在完成后恢复。 */
  const doPack = () => {
    if (!sel.length || packing) { toast('请先勾选文件'); return; }
    setWmFor('pack'); setWmScopeLabel(`打包导出 ${sel.length} 个文档`); setWmOpen(true);
  };
  /** 水印确认后真正执行打包（后台异步任务 + loading 态，防重复点击） */
  const runPack = (wm: string) => {
    setPacking(true);
    window.setTimeout(() => {
      setPacking(false);
      toast(`已提交后台打包 ${sel.length} 个文件（水印：${wm}）· 完成后通知下载`);
    }, 900);
  };

  const toggleFav = (id: string) => {
    setFav((f) => {
      const on = f.includes(id);
      toast(on ? '已取消收藏' : '已加入我的收藏');
      return on ? f.filter((x) => x !== id) : [...f, id];
    });
  };

  const toggleInd = (i: string) => setInds((v) => (v.includes(i) ? v.filter((x) => x !== i) : [...v, i]));

  /* ---------- 分类树（带计数） ---------- */
  const catTree = useMemo(
    () => DOC_CATS.map((c) => ({
      ...c,
      n: DOCS.filter((d) => d.cat === c.key).length,
      subs: c.subs.map((s) => ({ key: s, n: DOCS.filter((d) => d.cat === c.key && d.sub === s).length })),
    })),
    [],
  );
  /* 项12：分类树搜索过滤 —— 匹配分类名→整类；匹配文档名→所属分类+该子类 */
  const filteredCatTree = useMemo(() => {
    const k = catKw.trim().toLowerCase();
    if (!k) return catTree;
    return catTree
      .map((c) => {
        if (c.key.toLowerCase().includes(k)) return c;
        const matchingSubs = c.subs.filter((s) =>
          s.key.toLowerCase().includes(k)
          || DOCS.some((d) => d.cat === c.key && d.sub === s.key && d.name.toLowerCase().includes(k)));
        return matchingSubs.length ? { ...c, subs: matchingSubs } : null;
      })
      .filter(Boolean) as typeof catTree;
  }, [catTree, catKw]);

  const dirs = dirMode === 'proj'
    ? PROJECTS.map((p) => ({ key: p.id, label: p.name, sub: p.id, n: DOCS.filter((d) => d.proj === p.id).length }))
    : dirMode === 'contract'
      ? [...new Set(DOCS.filter((d) => d.contract).map((d) => d.contract))].map((c) => ({
        key: c, label: c, sub: DOCS.find((d) => d.contract === c)?.name.split('-')[1] || '',
        n: DOCS.filter((d) => d.contract === c).length,
      }))
      : DOC_STAGES.map((s) => ({ key: s, label: s + '阶段', sub: '', n: DOCS.filter((d) => d.stage === s).length }));

  /* ---------- 项目资料完整度 ---------- */
  /**
   * 「产品身份标识（B 签）」不算文档：它由物料域领用回写的号段自动产生，
   * 不能靠上传 PDF 补齐，因此单独判定后并入同一份完整度 —— 与下方清单格数一致（5 项）。
   */
  const idMarkDone = (pid: string) => idMarkFlowsOfProj(pid).filter((f) => f.status !== '已领未装');
  const completeness = (pid: string) => {
    const need = DOCS.filter((d) => d.proj === pid && d.need);
    const done = need.filter((d) => d.status === '已归档');
    const total = need.length + 1;
    const ok = done.length + (idMarkDone(pid).length ? 1 : 0);
    const pct = total ? Math.round((ok / total) * 100) : 0;
    return { pct, done: ok, total };
  };

  /* ---------- 列表列 ---------- */
  const cols = [
    {
      key: 'name', title: '文件名 / 编号', width: 320, sticky: 'left' as const,
      render: (d: D) => (
        <div className="nc-cell-main">
          <div>
            <span className={`nc-fav${fav.includes(d.id) ? ' is-on' : ''}`} onClick={(e) => { e.stopPropagation(); toggleFav(d.id); }} title={fav.includes(d.id) ? '取消收藏' : '收藏'} {...pressProps(() => toggleFav(d.id))}>
              <Ico n="star" size={13} />
            </span>
            {' '}<Ico n="file" size={13} /> {d.name}
          </div>
          <div className="nc-cell-sub"><Code>{d.id}</Code></div>
        </div>
      ),
    },
    {
      key: 'belong', title: '归属项目（行业）', width: 250,
      render: (d: D) => {
        const ind = industryOf(d.proj);
        return (
          <div className="nc-cell-main">
            <div>
              {d.proj
                ? <EntityLink target="project-center" id={d.proj} go={go} title="下钻到项目详情">{projOf(d.proj)?.name ?? d.proj}</EntityLink>
                : <span className="nc-cell-sub">公司级</span>}
              {!!ind && <Tag tone="gray">{ind}</Tag>}
            </div>
            <div className="nc-cell-sub">
              {d.contract
                ? <EntityLink target="contract" id={d.contract} go={go} title="下钻到合同详情"><Code>{d.contract}</Code></EntityLink>
                : d.stage + ' 阶段'}
            </div>
          </div>
        );
      },
    },
    { key: 'cat', title: '分类 / 阶段', width: 160, render: (d: D) => <div className="nc-cell-main"><div><Tag tone={CAT_TONE[d.cat] || 'gray'}>{d.cat}</Tag></div><div className="nc-cell-sub">{d.sub} · {d.stage} 阶段</div></div> },
    { key: 'ver', title: '版本', width: 66, align: 'center' as const, render: (d: D) => <span className="num">{d.ver}</span> },
    { key: 'by', title: '上传人', width: 84 },
    { key: 'date', title: '上传时间 ↕', width: 100 },
    { key: 'dl', title: '下载 ↕', width: 60, align: 'right' as const, render: (d: D) => <span className="num">{d.dl}</span> },
    { key: 'status', title: '状态', width: 80, render: (d: D) => <Tag tone={STATUS_TONE[d.status] || 'gray'}>{d.status}</Tag> },
    { key: 'need', title: '必备', width: 56, align: 'center' as const, render: (d: D) => (d.need ? <Tag tone="gray" pill>必</Tag> : <span className="nc-cell-sub">—</span>) },
    {
      key: 'op', title: '操作', width: 150, align: 'right' as const,
      render: (d: D) => (
        <div className="nc-ops" onClick={(e) => e.stopPropagation()}>
          <Op onClick={() => setPreviewDoc(d)}>预览</Op><OpSep />
          <Op onClick={() => toast(`已开始下载「${d.name}」· 下载行为留痕`)}>下载</Op><OpSep />
          <Op onClick={() => { setDetail(d); setDTab('base'); }}>详情</Op><OpSep />
          <OpMore items={[{ label: '删除', danger: true, onClick: () => { setDetail(d); setDTab('base'); setDelOpen(true); } }]} />
        </div>
      ),
    },
  ];

  /* ---------- 详情抽屉内容 ---------- */
  const detailVer = detail ? DOC_VERSIONS.filter((v) => v.doc === detail.id) : [];
  const detailLog = detail ? DOC_LOGS.filter((l) => l.doc === detail.id) : [];

  const detailBody = detail && (
    <>
      <Tabs
        items={[
          { key: 'base', label: '基本信息', cnt: 8 },
          { key: 'ver', label: '版本记录', cnt: detailVer.length },
          { key: 'rel', label: '关联业务' },
          { key: 'log', label: '操作记录', cnt: detailLog.length },
        ]}
        value={dTab} onChange={setDTab}
      />
      {dTab === 'base' && (
        <>
          <div className="nc-doc-preview">
            <div className="nc-doc-preview-ico"><Ico n="file" size={16} /></div>
            <div className="nc-doc-preview-meta">
              <div className="nc-doc-preview-name">{detail.name}</div>
              <div className="nc-cell-sub">{detail.ver} · {detail.size} · 更新于 {detail.date} · {detail.by}</div>
            </div>
            <Btn size="sm" onClick={() => setPreviewDoc(detail)}>在线预览</Btn>
          </div>
          <KvGrid cols={2} rows={[
            { k: '文档编号', v: <Code>{detail.id}</Code> },
            { k: '当前版本', v: <span className="num">{detail.ver}</span> },
            { k: '一级分类', v: <Tag tone={CAT_TONE[detail.cat] || 'gray'}>{detail.cat}</Tag> },
            { k: '二级类型', v: <Tag tone={SUB_TONE[detail.type] || 'gray'}>{detail.type}</Tag> },
            { k: '归属项目', v: detail.proj ? <EntityLink target="project-center" id={detail.proj} go={go} title="下钻到项目详情">{projOf(detail.proj)?.name ?? detail.proj}</EntityLink> : '公司级（无项目归属）' },
            { k: '所属行业', v: industryOf(detail.proj) ? <Tag tone="gray">{industryOf(detail.proj)}</Tag> : '—' },
            { k: '项目类型', v: ptypeOf(detail.proj) || '—' },
            { k: '项目合同额', v: amtOf(detail.proj) > 0 ? <Money v={amtOf(detail.proj)} role={role} wan /> : '—' },
            { k: '关联合同', v: detail.contract ? <EntityLink target="contract" id={detail.contract} go={go} title="下钻到合同详情">{detail.contract}</EntityLink> : '/' },
            { k: '所属阶段', v: <Tag tone="blue">{detail.stage}</Tag> },
            { k: '是否必备', v: <>{detail.need ? <Tag tone="gray" pill>必</Tag> : <span className="nc-cell-sub">非必</span>}<div className="nc-cell-sub">口径：投标文件资料清单要求项；勾选后纳入竣工资料完整度校验，删除须管理员审批</div></> },
            { k: '文件状态', v: <Tag tone={STATUS_TONE[detail.status] || 'gray'}>{detail.status}</Tag> },
            { k: '下载次数', v: <span className="nc-num">{detail.dl}</span> },
            { k: '上传人 · 时间', v: `${detail.by} · ${detail.date}` },
            { k: '可见范围', v: <>{detail.vis}<div className="nc-cell-sub">与项目详情·项目档案、合同详情·附件分类双向同源，任一入口上传 / 删除均实时同步</div></> },
          ]} />
          <div className="nc-sec-title">标签</div>
          <div className="nc-doc-tags">{detail.tags.map((t) => <span key={t} className="nc-doc-tag">#{t}</span>)}</div>
          <div className="nc-sec-title">摘要</div>
          <div className="nc-warnbox is-info">{detail.summary}</div>
        </>
      )}
      {dTab === 'ver' && (
        <>
          <div className="nc-listhint">
            <span>版本记录<Tip text="版本逐次留痕：谁 · 何时 · 变更说明；旧版本只读保留，不可覆盖删除。" /></span>
          </div>
          {detailVer.length ? (
            <table className="nc-tbl" style={{ minWidth: 620 }}>
              <thead><tr><th style={{ width: 60 }}>版本</th><th style={{ width: 100 }}>时间</th><th style={{ width: 90 }}>操作人</th><th style={{ width: 80 }}>大小</th><th>变更说明</th><th style={{ width: 80 }}>操作</th></tr></thead>
              <tbody>
                {detailVer.map((v) => (
                  <tr key={v.ver}>
                    <td><b className="num">{v.ver}</b>{v.ver === detail.ver && <Tag tone="blue">当前</Tag>}</td>
                    <td className="num">{v.date}</td><td>{v.by}</td><td className="num">{v.size}</td>
                    <td>{v.note}</td>
                    <td><Op onClick={() => toast(`已定位 ${v.ver} 历史版本（只读）`)}>查看</Op></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="nc-empty"><div className="nc-empty-ico"><Ico n="folder" size={16} /></div><div>该文档暂无历史版本</div></div>}
          <div className="nc-warnbox is-success"><Ico n="check" size={16} /> 上传新版本将自动归档旧版本，引用该文档的审批单 / 交付物同步提示「有更新版本」。</div>
        </>
      )}
      {dTab === 'rel' && (
        <>
          <div className="nc-sec-title">关联业务对象</div>
          <table className="nc-tbl" style={{ minWidth: 520 }}>
            <thead><tr><th style={{ width: 100 }}>对象类型</th><th>对象</th><th style={{ width: 80 }}>操作</th></tr></thead>
            <tbody>
              <tr>
                <td>项目</td>
                <td>{detail.proj ? <EntityLink target="project-center" id={detail.proj} go={go} title="下钻到项目详情">{projOf(detail.proj)?.name ?? detail.proj} <span className="nc-cell-sub">{detail.proj}</span></EntityLink> : <span className="nc-cell-sub">公司级文档，无项目归属</span>}</td>
                <td>{detail.proj && <Op onClick={() => { setDetail(null); setFocus('project-center', detail.proj!); go('project-center'); }}>打开</Op>}</td>
              </tr>
              <tr>
                <td>合同</td>
                <td>{detail.contract ? <EntityLink target="contract" id={detail.contract} go={go} title="下钻到合同详情">{detail.contract}</EntityLink> : <span className="nc-cell-sub">未关联合同</span>}</td>
                <td>{detail.contract && <Op onClick={() => { setDetail(null); setFocus('contract-detail', detail.contract!); go('contract-detail'); }}>打开</Op>}</td>
              </tr>
              <tr>
                <td>阶段</td>
                <td><Tag tone="blue">{detail.stage}</Tag> <span className="nc-cell-sub">来源于项目里程碑</span></td>
                <td>—</td>
              </tr>
            </tbody>
          </table>
          <div className="nc-sec-title">同项目文档（{DOCS.filter((d) => d.proj === detail.proj && d.id !== detail.id).length}）</div>
          <div className="nc-doc-rellist">
            {DOCS.filter((d) => d.proj === detail.proj && d.id !== detail.id).slice(0, 8).map((d) => (
              <div key={d.id} className="nc-doc-relitem" onClick={() => { setDetail(d); setDTab('base'); }} {...pressProps(() => { setDetail(d); setDTab('base'); })}>
                <span><Ico n="file" size={16} /> {d.name}</span><span className="nc-cell-sub">{d.cat} · {d.ver} · {d.date}</span>
              </div>
            ))}
            {DOCS.filter((d) => d.proj === detail.proj && d.id !== detail.id).length === 0 && (
              <div className="nc-cell-sub">暂无同项目文档</div>
            )}
          </div>
        </>
      )}
      {dTab === 'log' && (
        <>
          <Timeline items={[
            { date: detail.date, text: `上传「${detail.type}」（${detail.by}）· 自动归集至【${detail.cat} / ${detail.sub}】· ${detail.stage} 阶段`, tone: 'ok' },
            ...(detail.need
              ? [{ date: detail.date, text: ' 资料清单校验通过（检测报告 / 合格证 / 图纸 / 隐蔽验收记录）', tone: 'ok' as const }]
              : [{ date: detail.date, text: '非清单必备项，已归档备用', tone: 'gray' as const }]),
            ...detailLog.map((l) => ({ date: l.time.slice(0, 10), text: `${l.act} · ${l.by} · ${l.note}`, tone: 'gray' as const })),
          ]} />
          <div className="nc-listhint">
            <span>操作留痕<Tip text="全量留痕：预览 / 下载 / 发送 / 借阅 / 版本变更均记录（谁 · 何时 · 做了什么）。" /></span>
          </div>
        </>
      )}
    </>
  );

  return (
    <>
      <PageHead
        title="文档中心"
        badges={<Tag tone="gray">{DOCS.length} 份文档</Tag>}
        actions={<>
          <Btn onClick={() => setBorrowOpen(true)}>借阅记录</Btn>
        </>}
      />

      {/* 统计瓦片：与列表筛选同源 */}
      <div className="nc-tiles nc-tiles-4">
        <Tile label="文档总数" value={DOCS.length} sub="全部资料" onClick={() => clearAll()} active={!activeFilters.length} />
        <Tile label="必备缺项" value={needMiss} tone={needMiss ? 'orange' : undefined} sub="未归档的验收必备项" onClick={() => { setNeedOnly(true); setPage(1); }} active={needOnly} />
        <Tile label="本月上传" value={thisMonth} sub="本月新增资料" />
        <Tile label="待归档" value={pendingReview} tone={pendingReview ? 'orange' : undefined} sub="待审核未归档" onClick={() => { setStatusF('待审核'); setPage(1); }} active={statusF === '待审核'} />
      </div>

      <div className="nc-doc-layout">
        {/* ==================== 左侧分类导航 ==================== */}
        <div className="nc-doc-side">
          <input
            className="nc-input" style={{ marginBottom: 12 }}
            value={catKw} onChange={(e) => setCatKw(e.target.value)}
            placeholder="搜索分类/文档"
          />
          <div className="nc-seg" style={{ width: '100%', marginBottom: 12 }}>
            <button className={`nc-seg-btn${dirMode === 'cat' ? ' is-on' : ''}`} onClick={() => { setDirMode('cat'); setActiveDir(''); setActiveStage(''); }}>按分类</button>
            <button className={`nc-seg-btn${dirMode === 'proj' ? ' is-on' : ''}`} onClick={() => { setDirMode('proj'); setActiveCat(''); setActiveSub(''); setActiveStage(''); }}>按项目</button>
            <button className={`nc-seg-btn${dirMode === 'contract' ? ' is-on' : ''}`} onClick={() => { setDirMode('contract'); setActiveCat(''); setActiveSub(''); setActiveStage(''); }}>按合同</button>
            <button className={`nc-seg-btn${dirMode === 'stage' ? ' is-on' : ''}`} onClick={() => { setDirMode('stage'); setActiveCat(''); setActiveSub(''); setActiveDir(''); }}>按阶段</button>
          </div>

          <button
            className={`nc-dir-item${!activeCat && !activeSub && !activeDir && !activeStage ? ' is-on' : ''}`}
            onClick={() => { setActiveCat(''); setActiveSub(''); setActiveDir(''); setActiveStage(''); setPage(1); }}
          >
            <span>全部文档</span><span className="nc-dir-n num">{DOCS.length}</span>
          </button>

          {dirMode === 'cat' && filteredCatTree.map((c) => {
            const open = catKw.trim() ? true : expanded.includes(c.key);
            return (
              <div key={c.key} className="nc-cat-node">
                <div className="nc-cat-head">
                  <button
                    className="nc-cat-arrow"
                    onClick={() => setExpanded((e) => (e.includes(c.key) ? e.filter((x) => x !== c.key) : [...e, c.key]))}
                    title={open ? '收起' : '展开'}
                  >{open ? '▾' : '▸'}</button>
                  <button
                    className={`nc-dir-item is-flex${activeCat === c.key ? ' is-on' : ''}`}
                    onClick={() => { setActiveCat(c.key); setActiveSub(''); setPage(1); }}
                  >
                    <span><Ico n={c.icon as IconName} size={14} /> {c.key}</span><span className="nc-dir-n num">{c.n}</span>
                  </button>
                </div>
                {open && (
                  <div className="nc-cat-subs">
                    {c.subs.map((s) => (
                      <button
                        key={s.key}
                        className={`nc-cat-sub${activeCat === c.key && activeSub === s.key ? ' is-on' : ''}`}
                        onClick={() => { setActiveCat(c.key); setActiveSub(s.key); setPage(1); }}
                      >
                        <span>{s.key}</span><span className="nc-dir-n num">{s.n}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {dirMode !== 'cat' && dirs.map((d) => (
            <button
              key={d.key}
              className={`nc-dir-item${activeDir === d.key ? ' is-on' : ''}`}
              onClick={() => { setActiveDir(d.key); if (dirMode === 'stage') setActiveStage(d.key); setPage(1); }}
            >
              <span>{d.label}<div className="nc-cell-sub">{d.sub}</div></span>
              <span className="nc-dir-n num">{d.n}</span>
            </button>
          ))}

          <div className="nc-doc-side-foot">
            <div className="nc-listhint">分类维护<Tip text="分类由资料管理员统一维护；上传时自动归集，不可自定义新建。" /></div>
          </div>
        </div>

        {/* ==================== 右侧列表 ==================== */}
        <div className="nc-doc-main">
          {(activeDir || activeCat) && dirMode === 'proj' && (() => {
            const { pct, done, total } = completeness(activeDir);
            return (
              <Card
                hd={<span>竣工资料完整度 · {projOf(activeDir)?.name}</span>}
                extra={<Btn size="sm" onClick={() => { setWmFor('pack'); setWmScopeLabel('竣工资料包'); setWmOpen(true); }}>一键导出资料包</Btn>}
              >
                <div className="nc-completeness">
                  <Progress value={pct} tone={pct >= 90 ? 'green' : pct >= 60 ? 'orange' : 'red'} />
                  <b className="num">{pct}%</b>
                  <span className="nc-cell-sub">必备 {done}/{total} 已具备</span>
                </div>
                <div className="nc-check-grid">
                  {ACCEPT_CHECKLIST.map((c) => {
                    const isMark = c === '产品身份标识';
                    const marks = idMarkDone(activeDir);
                    const ok = isMark ? marks.length > 0 : DOCS.some((d) => d.proj === activeDir && d.type === c);
                    return (
                      <div key={c} className={`nc-check-cell${ok ? ' is-ok' : ' is-miss'}`}>
                        <StatusIco kind={ok ? 'ok' : 'ban'} /> {c}
                        <span className="nc-cell-sub">
                          {ok
                            ? (isMark
                              ? `物料域已回写 ${marks.length} 段（${marks.reduce((s, f) => s + f.qty, 0)} 件）`
                              : `已归集 ${DOCS.filter((d) => d.proj === activeDir && d.type === c).length} 份`)
                            : (isMark ? '缺失 · 须在物料域领用回写' : '缺失')}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="nc-listhint">
                  <span>上传要求<Tip w={340} text="验收类节点强制上传【验收查验记录】+ 影像 + 签字件；通过后资料自动归档至【项目档案】对应里程碑。" /></span>
                </div>
              </Card>
            );
          })()}

          <Card flush>
            {/* ============ 多维筛选面板 ============ */}
            <div className="nc-doc-filters">
              {/* 主行：搜索 + 更多筛选 + 高频 chips（状态 / 必备） */}
              <div className="nc-doc-frow">
                <input
                  className="nc-input" style={{ width: 260 }} value={kw} placeholder="搜索文件名 / 编号 / 标签 / 摘要"
                  onChange={(e) => { setKw(e.target.value); setPage(1); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') pushHist(kw); }}
                />
                <Tip w={320} text="搜索范围：文件名 + 文档编号 + 标签 + 内容摘要；图片 / ZIP 内文不参与检索" />
                <Btn onClick={() => setMoreOpen((v) => !v)}>{moreOpen ? '收起筛选 ▴' : '更多筛选 ▾'}</Btn>
                <div className="nc-doc-fchips">
                  {DOC_STATUS.map((s) => (
                    <button key={s} className={`nc-chipbtn${statusF === s ? ' is-on' : ''}`} onClick={() => { setStatusF(statusF === s ? '' : s); setPage(1); }}>
                      {s}<span className="nc-chip-cnt">{DOCS.filter((d) => d.status === s).length}</span>
                    </button>
                  ))}
                </div>
                <Check checked={needOnly} onChange={(v) => { setNeedOnly(v); setPage(1); }} label="只看必备项" />
              </div>

              {/* 低频筛选展开区：行业 / 项目 / 金额 / 阶段 / 类型 / 上传人 / 时间 */}
              {moreOpen && (<>
                <div className="nc-doc-frow">
                  <span className="nc-doc-flbl">行业</span>
                  <div className="nc-doc-fchips">
                    <button className={`nc-chipbtn${inds.length === 0 ? ' is-on' : ''}`} onClick={() => setInds([])}>全部</button>
                    {INDUSTRIES.map((i) => (
                      <button key={i.key} className={`nc-chipbtn${inds.includes(i.key) ? ' is-on' : ''}`} onClick={() => { toggleInd(i.key); setPage(1); }} title={`只看${i.key}行业项目的文档`}>
                        {i.key}<span className="nc-chip-cnt">{i.n}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="nc-doc-frow">
                  <span className="nc-doc-flbl">项目</span>
                  <div className="nc-doc-fchips">
                    <button className={`nc-chipbtn${!ptypeF ? ' is-on' : ''}`} onClick={() => { setPtypeF(''); setPage(1); }}>全部类型</button>
                    {PTYPES.map((t) => (
                      <button key={t} className={`nc-chipbtn${ptypeF === t ? ' is-on' : ''}`} onClick={() => { setPtypeF(ptypeF === t ? '' : t); setPage(1); }}>{t}</button>
                    ))}
                  </div>
                  <span className="nc-doc-fsep" />
                  <select className="nc-input nc-doc-fsel" value={amtF} onChange={(e) => { setAmtF(e.target.value); if (e.target.value !== 'custom') setAmtMin(''); setPage(1); }} title="按项目合同额筛选">
                    {AMT_BUCKETS.map((b) => <option key={b.key} value={b.key}>{b.label}</option>)}
                  </select>
                  {amtF === 'custom' && (
                    <span className="nc-doc-fmin">
                      <input className="nc-input" style={{ width: 76 }} type="number" min={0} value={amtMin} placeholder="110" onChange={(e) => { setAmtMin(e.target.value); setPage(1); }} />
                      <span className="nc-cell-sub">万元以上</span>
                    </span>
                  )}
                  <ProjectPicker value={projF} onChange={(id) => { setProjF(id); setPage(1); }} scope="all" clearLabel="全部项目" placeholder="全部项目" width={168} />
                  <Check checked={incCompany} onChange={(v) => { setIncCompany(v); setPage(1); }} label="含公司级" />
                </div>
                <div className="nc-doc-frow">
                  <span className="nc-doc-flbl">阶段 / 类型</span>
                  <div className="nc-doc-fchips">
                    {DOC_STAGES.map((s) => (
                      <button key={s} className={`nc-chipbtn${stageF === s ? ' is-on' : ''}`} onClick={() => { setStageF(stageF === s ? '' : s); setPage(1); }}>
                        {s}<span className="nc-chip-cnt">{DOCS.filter((d) => d.stage === s).length}</span>
                      </button>
                    ))}
                  </div>
                  <select className="nc-input nc-doc-fsel is-wide" value={typeF} onChange={(e) => { setTypeF(e.target.value); setPage(1); }} title="文档类型">
                    <option value="">全部类型</option>
                    {[...new Set(DOCS.map((d) => d.type))].sort().map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <select className="nc-input nc-doc-fsel" value={byF} onChange={(e) => { setByF(e.target.value); setPage(1); }} title="上传人">
                    <option value="">全部上传人</option>
                    {[...new Set(DOCS.map((d) => d.by))].sort().map((b) => <option key={b}>{b}</option>)}
                  </select>
                  <select className="nc-input nc-doc-fsel" value={dateF} onChange={(e) => { setDateF(e.target.value); setPage(1); }} title="上传时间">
                    {DATE_RANGES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                  </select>
                </div>
              </>)}

              {/* 已选条件回显 */}
              {!!activeFilters.length && (
                <div className="nc-doc-frow is-active">
                  <span className="nc-doc-flbl">已选</span>
                  <div className="nc-doc-fchips">
                    {activeFilters.map((f) => (
                      <span key={f.k} className="nc-fcond">
                        {f.label}
                        <button onClick={() => { f.clear(); setPage(1); }} title="移除该条件"><Ico n="close" size={11} /></button>
                      </span>
                    ))}
                    <button className="nc-doc-fclear" onClick={clearAll}>清空全部</button>
                  </div>
                </div>
              )}
            </div>

            {/* 结果条：左侧命中统计；弹性分隔后最右「打包导出 ZIP / ＋上传文档」。
                排序下拉移除（改列头点击排序，暂未支持 sortable，保留默认「最近更新」）；
                重置已收进上方已选条件回显行的「清空全部」（link 样式）。 */}
            <div className="nc-doc-fresult">
              <span className="nc-doc-fcount">
                命中 <b className="num">{rows.length}</b> 份
                {rows.length !== DOCS.length && <span className="nc-cell-sub"> / 共 {DOCS.length} 份</span>}
                {' · 已选 '}<b className="num">{sel.length}</b> 份
              </span>
              {!!hiddenCompany && <span className="nc-cell-sub">（已排除 {hiddenCompany} 份公司级文档）</span>}
              <span style={{ flex: 1 }} />
              <Btn disabled={!sel.length} title={sel.length ? `打包导出 ${sel.length} 个文件（可设置水印）` : '请先勾选至少一个文档'} loading={packing} onClick={doPack}><Ico n="package" size={16} /> {packing ? '打包中…' : `打包导出 ZIP${sel.length ? ` (${sel.length})` : ''}`}</Btn>
              <Btn kind="primary" onClick={() => setUpOpen(true)}>＋ 上传文档</Btn>
            </div>

            <DataTable
              cols={cols} rows={paged} rowKey={(d) => d.id} minWidth={1420}
              empty="没有符合筛选条件的文档；可放宽行业 / 金额 / 项目类型任一条件，或勾选「含公司级」把公司级文档纳入"
              emptyCta={<Btn kind="primary" onClick={() => setUpOpen(true)}>＋ 上传文档</Btn>}
              selectable selected={sel}
              onSelectAll={() => setSel(allOn ? [] : rows.map((r) => r.id))}
              onSelectRow={(id) => setSel((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
              onRowClick={(d) => { setDetail(d); setDTab('base'); }}
              foot={<TableFoot total={DOCS.length} filtered={rows.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} unit="份" extra={<span className="nc-cell-sub"> ｜ 行点击打开详情</span>} />}
            />
          </Card>
        </div>
      </div>

      {/* ============ 详情抽屉 ============ */}
      <Drawer
        open={!!detail} onClose={() => setDetail(null)} width={800}
        title={<span>文档详情 {detail && <Code>{detail.id}</Code>}</span>}
        sub={detail?.name}
        foot={<>
          <Btn size="sm" onClick={() => setPreviewDoc(detail)}>预览</Btn>
          <Btn size="sm" onClick={() => toast('已开始下载 · 下载行为留痕')}>下载</Btn>
          <Btn size="sm" onClick={() => setShareOpen(true)}>在线发送</Btn>
          <Btn size="sm" onClick={() => setUpVerOpen(true)}>上传新版本</Btn>
          <Btn size="sm" onClick={() => toast('已提交借阅申请 · 待审批后开放下载')}>借阅</Btn>
        </>}
      >
        {detailBody}
      </Drawer>

      {/* ============ 上传文档 ============ */}
      <Drawer
        open={upOpen} onClose={() => setUpOpen(false)} width={640} title="上传文档"
        foot={<><Btn onClick={() => setUpOpen(false)}>取消</Btn><Btn kind="primary" onClick={doUpload}>上传 {upFiles.length ? `${upFiles.length} 份` : '并归集'}</Btn></>}
      >
        <Banner tone="warn"><Ico n="ban" size={16} /> 资料清单校验（硬拦截）：按消防验收资料清单校验（检测报告 / 合格证 / 图纸 / 隐蔽验收记录），缺失项将拦截并定位。</Banner>
        <div
          className="nc-dropzone"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file'; input.multiple = true;
            input.onchange = () => {
              const names = Array.from(input.files ?? []).map((f) => f.name);
              if (names.length) setUpFiles((prev) => [...prev, ...names]);
            };
            input.click();
          }}
        ><Ico n="paperclip" size={16} /> 拖入文件或 <Btn size="sm">选择文件（可多选）</Btn><div className="nc-cell-sub">支持 PDF / DWG / JPG / PNG / ZIP / XLSX，单文件 ≤ 200MB</div></div>
        {upFiles.length > 0 && (
          <div style={{ margin: '8px 0' }}>
            <div className="nc-cell-sub" style={{ marginBottom: 4 }}>已选 {upFiles.length} 个文件：</div>
            {upFiles.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0' }}>
                <Ico n="paperclip" size={14} />
                <span style={{ flex: 1, fontSize: 13 }}>{f}</span>
                <Btn size="sm" danger onClick={() => setUpFiles((prev) => prev.filter((_, j) => j !== i))}>移除</Btn>
              </div>
            ))}
          </div>
        )}
        <div className="nc-form-grid">
          <Field label="一级分类" req>
            <select className="nc-input" value={upCat} onChange={(e) => setUpCat(e.target.value)}>
              {DOC_CATS.map((c) => <option key={c.key}>{c.key}</option>)}
            </select>
          </Field>
          <Field label="二级类型" req>
            <select className="nc-input" value={upType} onChange={(e) => setUpType(e.target.value)}>
              {[...new Set(DOCS.map((d) => d.type))].sort().map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="上传至阶段" req>
            <select className="nc-input" value={upStage} onChange={(e) => setUpStage(e.target.value)}>
              {DOC_STAGES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="归属项目">
            <ProjectPicker value={upProj} onChange={setUpProj} scope="all" clearLabel="公司级（不归属项目）" />
          </Field>
          <Field label="关联合同">
            <ContractPicker value={upContract} onChange={setUpContract} scope="all" clearLabel="暂不关联" />
          </Field>
          <Field label="是否必备" note="口径：投标文件资料清单要求项；勾选后纳入竣工资料完整度校验"><div className="nc-inline-checks"><Check checked={upNeed} onChange={setUpNeed} label="清单必备项" /></div></Field>
          <Field label="标签" span={2} note="逗号分隔，用于检索"><input className="nc-input" placeholder="如：万达,强制性认证,验收" /></Field>
        </div>
        {!!missList.length && <div className="nc-warnbox is-danger"><div className="nc-warnbox-hd"><Ico n="ban" size={16} /> 校验未通过：缺少 {missList.join('、')}</div>请先补齐缺失的清单资料，或联系资料管理员。</div>}
        <div className="nc-sec-title">已自动归集（同源）</div>
      </Drawer>

      {/* ============ 上传新版本 ============ */}
      <Modal
        open={upVerOpen} onClose={() => setUpVerOpen(false)} width={480} title="上传新版本"
        foot={<><Btn onClick={() => setUpVerOpen(false)}>取消</Btn><Btn kind="primary" onClick={() => { toast(`已上传新版本 · ${detail?.ver} → V${Number((detail?.ver || 'V1').slice(1)) + 1} · 旧版本自动归档`); setUpVerOpen(false); }}>上传</Btn></>}
      >
        <Banner tone="info">上传新版本不会覆盖旧版本：旧版本<b>只读保留</b>，引用该文档的审批单 / 交付物同步提示「有更新版本」。</Banner>
        <div className="nc-dropzone is-mini"><Ico n="paperclip" size={16} /> 拖入新版本文件，或点击选择</div>
        <div className="nc-form-grid">
          <Field label="当前版本"><input className="nc-input" value={detail?.ver || ''} readOnly /></Field>
          <Field label="新版本号"><input className="nc-input" value={`V${Number((detail?.ver || 'V1').slice(1)) + 1}`} readOnly /></Field>
          <Field label="变更说明" span={2} req><textarea className="nc-input" rows={3} placeholder="如：按现场变更补绘 F2 层喷淋走向" /></Field>
        </div>
      </Modal>

      {/* ============ 在线发送 ============ */}
      <Modal
        open={shareOpen} onClose={() => setShareOpen(false)} width={480} title="在线发送（分享链接）"
        foot={<><Btn onClick={() => setShareOpen(false)}>取消</Btn><Btn kind="primary" onClick={() => { setWmFor('share'); setWmScopeLabel('分享链接'); setWmOpen(true); }}>生成分享链接</Btn></>}
      >
        <Banner tone="info">分享链接带<b>水印</b> + <b>有效期</b>，到期自动失效。</Banner>
        <div className="nc-form-grid">
          <Field label="有效期（天）" req note="默认 7 天">
            <select className="nc-input" value={shareDays} onChange={(e) => setShareDays(Number(e.target.value))}>
              <option value={3}>3 天</option><option value={7}>7 天</option><option value={15}>15 天</option><option value={30}>30 天</option>
            </select>
          </Field>
          <Field label="接收人"><input className="nc-input" placeholder="对方邮箱 / 手机号" /></Field>
          <Field label="水印" span={2} note="可自定义水印文字（如「仅限××项目使用」）">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="nc-cell-sub" style={{ flex: 1 }}>{wmCfg}</span>
              <Btn size="sm" onClick={() => { setWmFor('share'); setWmScopeLabel('分享链接'); setWmOpen(true); }}>设置水印</Btn>
            </div>
          </Field>
          <Field label="是否允许下载"><div className="nc-inline-checks"><Check checked={true} onChange={() => {}} label="允许" /></div></Field>
          <Field label="提取码"><input className="nc-input" placeholder="自动生成" readOnly /></Field>
        </div>
        <div className="nc-listhint">
          <span>外发留痕<Tip text="外发行为留痕：谁 · 何时 · 发给谁 · 哪一版；到期后链接自动失效且不可恢复。" /></span>
        </div>
      </Modal>

      {/* ============ 水印设置（导出 / 分享共用） ============ */}
      <WatermarkModal
        open={wmOpen}
        scope={wmScopeLabel}
        userName={getUserName(role)}
        onClose={() => setWmOpen(false)}
        onConfirm={(cfg) => {
          setWmCfg(cfg.text);
          setWmOpen(false);
          if (wmFor === 'pack') runPack(cfg.text);
          else if (wmFor === 'share') { toast(`已生成分享链接 · 有效期 ${shareDays} 天 · 水印：${cfg.text}`); setShareOpen(false); }
        }}
      />

      {/* ============ 借阅记录 ============ */}
      <Modal open={borrowOpen} onClose={() => setBorrowOpen(false)} width={640} title="借阅记录" foot={<Btn kind="primary" onClick={() => setBorrowOpen(false)}>关闭</Btn>}>
        <table className="nc-tbl" style={{ minWidth: 560 }}>
          <thead><tr><th>借阅单号</th><th>文档</th><th style={{ width: 90 }}>借阅人</th><th style={{ width: 110 }}>申请时间</th><th style={{ width: 90 }}>状态</th><th style={{ width: 80 }}>操作</th></tr></thead>
          <tbody>
            <tr><td><Code>JY000017</Code></td><td>昆明万达广场合同扫描件</td><td>行政</td><td>2026-09-17</td><td><Tag tone="green">已通过</Tag></td><td><Op onClick={() => toast('已查看')}>查看</Op></td></tr>
            <tr><td><Code>JY000018</Code></td><td>柳州钢铁竣工图</td><td>赵薇</td><td>2026-09-19</td><td><Tag tone="blue">待审批</Tag></td><td><Op onClick={() => toast('已通过借阅申请')}>通过</Op></td></tr>
            <tr><td><Code>JY000019</Code></td><td>检测报告-消防联动测试</td><td>张工</td><td>{TODAY}</td><td><Tag tone="blue">待审批</Tag></td><td><Op onClick={() => toast('已通过借阅申请')}>通过</Op></td></tr>
          </tbody>
        </table>
        <div className="nc-listhint">
          <span>借阅留痕<Tip text="借阅申请经审批后开放下载权限；下载行为全量留痕（谁 / 何时 / 哪份文档）。" /></span>
        </div>
      </Modal>

      {/* ============ 全局检索（Ctrl+K） ============ */}
      <Modal open={gOpen} onClose={() => setGOpen(false)} width={640} title="全局文档检索">
        <input
          className="nc-input" autoFocus value={gKw} placeholder="输入关键字检索全部文档（名称 / 编号 / 标签 / 摘要）"
          onChange={(e) => setGKw(e.target.value)}
        />
        <div className="nc-listhint" style={{ margin: '8px 0' }}>
          命中 {DOCS.filter((d) => !gKw.trim() || `${d.name}${d.id}${d.tags.join('')}${d.summary}`.toLowerCase().includes(gKw.toLowerCase())).length} 条
        </div>
        <div className="nc-doc-rellist" style={{ maxHeight: 380, overflowY: 'auto' }}>
          {DOCS.filter((d) => !gKw.trim() || `${d.name}${d.id}${d.tags.join('')}${d.summary}`.toLowerCase().includes(gKw.toLowerCase())).map((d) => (
            <div key={d.id} className="nc-doc-relitem" onClick={() => { setDetail(d); setDTab('base'); setGOpen(false); }} {...pressProps(() => { setDetail(d); setDTab('base'); setGOpen(false); })}>
              <span><Ico n="file" size={16} /> {d.name} <Tag tone={CAT_TONE[d.cat] || 'gray'}>{d.cat}</Tag></span>
              <span className="nc-cell-sub">{d.id} · {d.ver} · {d.date} · {d.by}</span>
            </div>
          ))}
        </div>
      </Modal>

      {/* ============ 删除文档（评审 I1：二次确认 + 二次输入 + 原因） ============ */}
      <ConfirmModal
        open={delOpen} onClose={() => setDelOpen(false)} okText="提交删除申请"
        title="删除文档"
        reason reasonLabel="删除原因"
        typed={detail?.name ?? ''} typedLabel={`请输入文档全名「${detail?.name ?? ''}」以确认`}
        impact={detail && <>将删除文档 <b>{detail.name}</b>（{detail.id} · {detail.ver}）。<br />{ACCEPT_CHECKLIST.includes(detail.sub ?? detail.name) || detail.cat === '验收交付'
          ? ' 该资料属<b>竣工验收必备资料</b>，删除后项目竣工资料完整度将下降，直接影响竣工验收与结算。'
          : '删除后版本链与借阅记录一并归档（软删除，可追溯）。'}<br />必备资料不可直接删除，须管理员审批。</>}
        onOk={(r) => { toast(`已提交删除申请（${detail?.name}），原因：${r} · 待管理员审批`); setDelOpen(false); }}
      />

      {/* ============ 文档预览（项11：按文件类型渲染 mock 内容） ============ */}
      <Drawer open={!!previewDoc} onClose={() => setPreviewDoc(null)} width={720}
        title={<span>文档预览 {previewDoc && <Code>{previewDoc.id}</Code>}</span>}
        sub={previewDoc?.name}
        foot={<><Btn onClick={() => setPreviewDoc(null)}>关闭</Btn>
          <Btn kind="primary" onClick={() => toast(`已开始下载「${previewDoc?.name}」· 下载行为留痕`)}>下载</Btn></>}>
        {previewDoc && (() => {
          const ext = (/\.(\w+)$/.exec(previewDoc.name)?.[1] || '').toLowerCase();
          return (
            <>
              <div className="nc-doc-preview">
                <div className="nc-doc-preview-ico"><Ico n="file" size={16} /></div>
                <div className="nc-doc-preview-meta">
                  <div className="nc-doc-preview-name">{previewDoc.name}</div>
                  <div className="nc-cell-sub">{previewDoc.ver} · {previewDoc.size} · 更新于 {previewDoc.date} · {previewDoc.by} · 水印：预览人 + 时间 + 租户</div>
                </div>
              </div>
              <div style={{ background: '#fafafa', border: '1px solid #e5e5e5', borderRadius: 6, padding: 24, minHeight: 320 }}>
                {(ext === 'pdf' || ext === 'dwg') && (
                  <div style={{ maxWidth: 560, margin: '0 auto', lineHeight: 2 }}>
                    <h3 style={{ margin: '0 0 16px' }}>{previewDoc.name.replace(/\.\w+$/, '')}</h3>
                    <p style={{ textIndent: '2em' }}>{previewDoc.summary}</p>
                    <p style={{ textIndent: '2em' }}>本文件为{previewDoc.cat}类文档，由{previewDoc.by}于{previewDoc.date}上传归档，当前版本{previewDoc.ver}，文件大小{previewDoc.size}。</p>
                    <p style={{ textIndent: '2em' }}>文档内容依据现场实际情况编制，经项目团队审核确认。如需下载原件，请点击底部「下载」按钮。</p>
                  </div>
                )}
                {ext === 'xlsx' && (
                  <table className="nc-tbl" style={{ minWidth: 520 }}>
                    <thead><tr><th>序号</th><th>项目</th><th>内容</th><th style={{ textAlign: 'right' }}>数值</th></tr></thead>
                    <tbody>
                      <tr><td>1</td><td>文档名称</td><td>{previewDoc.name}</td><td className="num">{previewDoc.size}</td></tr>
                      <tr><td>2</td><td>分类</td><td>{previewDoc.cat} / {previewDoc.sub}</td><td className="num">{previewDoc.ver}</td></tr>
                      <tr><td>3</td><td>阶段</td><td>{previewDoc.stage}</td><td className="num">{previewDoc.dl} 次下载</td></tr>
                      <tr><td>4</td><td>上传人</td><td>{previewDoc.by}</td><td className="num">{previewDoc.date}</td></tr>
                    </tbody>
                  </table>
                )}
                {(ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'zip') && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280, background: '#f0f0f0', borderRadius: 4 }}>
                    <div style={{ textAlign: 'center', color: '#999' }}>
                      <Ico n="file" size={48} />
                      <div style={{ marginTop: 8 }}>{ext === 'zip' ? '压缩包内容预览（共 18 个文件）' : '图片预览（缩略图）'}</div>
                    </div>
                  </div>
                )}
                {(ext === 'docx' || ext === 'doc') && (
                  <div style={{ maxWidth: 560, margin: '0 auto', lineHeight: 2 }}>
                    <h2 style={{ textAlign: 'center', margin: '0 0 20px' }}>{previewDoc.name.replace(/\.\w+$/, '')}</h2>
                    <p style={{ textIndent: '2em' }}>{previewDoc.summary}</p>
                    <p style={{ textIndent: '2em' }}>一、文档概述：本文件属于{previewDoc.cat}类别，子类型为{previewDoc.sub}，归属阶段为{previewDoc.stage}。</p>
                    <p style={{ textIndent: '2em' }}>二、编制说明：文件由{previewDoc.by}编制并上传，经审核后归档管理。</p>
                    <p style={{ textIndent: '2em' }}>三、附件清单：详见文件附件页。</p>
                  </div>
                )}
                {!['pdf','dwg','xlsx','jpg','jpeg','png','zip','docx','doc'].includes(ext) && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280, color: '#999' }}>
                    <div style={{ textAlign: 'center' }}>
                      <Ico n="file" size={48} />
                      <div style={{ marginTop: 8 }}>「{previewDoc.name}」预览（{previewDoc.size}）</div>
                    </div>
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </Drawer>
    </>
  );
}
