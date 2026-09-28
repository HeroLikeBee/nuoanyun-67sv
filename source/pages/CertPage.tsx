// 证书管理（列表 · 三视角）—— 证书台账三视角与借还闭环
// 术语强制：借给项目 / 用完收回 · 登记使用 · 外借 / 收回外借 · 续证安排 · 一证一项目/多项目引用/按次登记
// 硬规则：建造师三要素 · 安许过期=全部投标废标 · B 证不单独借出 · 周期止早于起拦截
import React, { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import {
  Banner, Btn, Card, DataTable, Drawer, Field, KvGrid, Modal, Money, Op, OpNone, OpMore, OpSep,
  PageHead, TableFoot, Tag, Timeline, Tip, useToast, Code, Check, Alert, Progress, ConfirmModal, EntityLink,
  pressProps, ProjectPicker,
} from '../components/ui';
import { ExportButton, useExport, getUserName, ExportDialog, type ExportField } from '../components/export';
import {
  TODAY, fmt, fmtWan, PROJECTS, BIDS,
  CERT_CATS, CERT_CAT_OF, CERT_SUBTYPES, CERT_SUBTYPE_META, CERT_ISSUERS,
} from '../components/data';
import type { Cert } from '../components/data';
import {
  addCert, addCerts, consumePageAction, getCerts, nextCertNos,
  patchCert as patchCertStore, renewCert, setFocus, subscribeStore,
  pushApproval, nextApprovalNo,
} from '../components/store';
import {
  CERT_FIELD_CN, capOf, draftToCert, modeOf, ownerOf, parseCertGrid, readCertFiles,
  type CertDraft, type CertField,
} from '../components/certImport';
import { parseDelimited } from '../components/xlsx';
import { Ico, StatusIco } from '../components/icons';
import { RecognitionWorkbench, type RecognitionField } from '../components/RecognitionWorkbench';

const MODE_LABEL: Record<string, string> = { single: '一证一项目', multi: '多项目引用', log: '按次登记' };

/** 证书照片识别 → 识别工作台 mock 字段 */
const CERT_RECOG_FIELDS: RecognitionField[] = [
  { key: 'certNo', label: '证书编号', value: '建[造]01234567', type: 'text' },
  { key: 'holder', label: '持证人姓名', value: '张三', type: 'text' },
  { key: 'certType', label: '证书类型', value: '注册建造师', type: 'text' },
  { key: 'major', label: '专业', value: '建筑工程', type: 'text' },
  { key: 'validTo', label: '有效期至', value: '2028-12-31', type: 'date' },
  { key: 'issue', label: '发证机关', value: '云南省住建厅', type: 'text' },
];

/** 待处理条分组：组顺序 = 展示顺序；配色遵循统计卡规范（红=高危 / 橙=关注 / 蓝=信息） */
const STRIP_GROUPS = [
  { key: 'expired', label: '已过期', cls: 'is-red' },
  { key: 'due30', label: '30 天内到期', cls: 'is-orange' },
  { key: 'due60', label: '60 天内到期', cls: 'is-amber' },
  { key: 'occupy', label: '并行占用', cls: 'is-blue' },
] as const;

/* ============ 证书大类（筛选 chips 用） ============
 * 字典已上移到 data.ts（CERT_CAT_OF / CERT_CATS）—— 批量导入会造出新证书，
 * 大类映射若只留在本页，导入进来的子类会「凭空消失」（计数不进任何一档）。
 * ⚠️ 往 CERT_SUBTYPES 加子类时，必须同时在 CERT_CAT_OF / CERT_SUBTYPE_META 补一行。 */
const CAT_OF = CERT_CAT_OF;
const MODE_TONE: Record<string, 'red' | 'blue' | 'gray'> = { single: 'gray', multi: 'blue', log: 'gray' };
const MODE_DESC: Record<string, string> = {
  single: '同一时间仅 1 个项目，法定独占（建造师、注册消防工程师）',
  multi: '公司资质，可被多项目同时使用（资质等级、安许、ISO、软著）',
  log: '不占用，只记录用在哪个项目（电工/焊工证、八大员、B 证）',
};
type C = Cert;

/** 低置信 / 待补全字段的底色 —— 复用告警色 token，不新增色值 */
const LOW_STYLE: React.CSSProperties = {
  background: 'var(--c-warning-bg)', boxShadow: 'inset 0 0 0 1px var(--c-warning-border)',
};
const lowIf = (cond: boolean) => (cond ? LOW_STYLE : undefined);
/** 置信度低于此值即标黄，要求人工复核 */
const CONF_LOW = 0.9;

/** 一条草稿缺什么就拦什么 —— 缺的字段直接决定入不了库 */
function impBlock(d: CertDraft): string[] {
  const out: string[] = [];
  if (!d.name.trim()) out.push('证书名称');
  if (!d.certNo.trim()) out.push('证书编号');
  if (!d.subType) out.push('专业子类');
  if (!d.holder.trim()) out.push('持证人');
  if (!d.longTerm && !d.validTo) out.push('有效期至');
  return out;
}

/* ============ 归属与保管人 ============ */
/** 公司证书由保管人负责（可外借投标 / 履约）；个人证书登记到员工名下（可设持证补贴） */
const isCompany = (c: C) => c.type === '企业资质';
const CUSTODIAN: Record<string, string> = {
  ZS000031: '行政 · 证书管理员', ZS000035: '行政 · 证书管理员',
  ZS000041: '行政 · 证书管理员', ZS000044: '行政 · 证书管理员',
};
const custodianOf = (c: C) => (isCompany(c) ? (CUSTODIAN[c.id] || '行政 · 证书管理员') : '');

/* ============ 长期有效 / 到期提前提醒 ============ */
/** 职业资格类（消防设施操作员等）长期有效，不设到期日。
 *  ⚠️ 以**模型字段** `Cert.longTerm` 为准，id 白名单只作历史数据兜底 ——
 *  批量导入产生的新证书拿不到老 id，只靠白名单会把「长期有效」当成「有效期为空 → 已过期」。 */
const LONG_TERM_IDS = ['ZS000022'];
const isLongTerm = (c: C) => c.longTerm === true || LONG_TERM_IDS.includes(c.id);
const REMIND_DAYS: Record<string, number> = { ZS000015: 30, ZS000035: 60, ZS000044: 60, ZS000055: 30 };
const remindOf = (c: C) => (isLongTerm(c) ? 0 : (c.remind ?? REMIND_DAYS[c.id] ?? 30));

/* ============ 持证补贴（仅个人证书） ============ */
type SubMode = 'none' | 'monthly' | 'yearly' | 'once';
type Subsidy = { mode: SubMode; amount: number; start: string };
const SUB_LABEL: Record<SubMode, string> = { none: '无补贴', monthly: '按月发放', yearly: '按年发放', once: '一次性' };
const SUB_UNIT: Record<SubMode, string> = { none: '', monthly: '月', yearly: '年', once: '次' };
const NO_SUBSIDY: Subsidy = { mode: 'none', amount: 0, start: '' };
const SUBSIDY_SEED: Record<string, Subsidy> = {
  ZS000015: { mode: 'monthly', amount: 2500, start: '2025-10-18' },
  ZS000018: { mode: 'monthly', amount: 2500, start: '2025-06-30' },
  ZS000022: { mode: 'monthly', amount: 800, start: '2026-03-15' },
  ZS000008: { mode: 'yearly', amount: 3000, start: '2024-12-20' },
  ZS000028: { mode: 'monthly', amount: 600, start: '2025-12-28' },
  ZS000050: { mode: 'once', amount: 30000, start: '2025-08-31' },
  ZS000051: { mode: 'yearly', amount: 12000, start: '2024-12-15' },
  ZS000055: { mode: 'none', amount: 0, start: '' },
};
/** 持证补贴：以模型字段为准，历史数据回落 id 白名单（新增 / 批量导入的证书走前者） */
const subsidyOf = (c: C): Subsidy => (isCompany(c) ? NO_SUBSIDY : (c.subsidy ?? SUBSIDY_SEED[c.id] ?? NO_SUBSIDY));
/** 补贴文案：¥2,500/月 */
const subText = (c: C) => { const s = subsidyOf(c); return s.mode === 'none' || !s.amount ? '' : `${fmt(s.amount)}/${SUB_UNIT[s.mode]}`; };
/** 年化成本：月 ×12 + 年 ×1；一次性按证书到期年计入 */
const yearCost = (c: C) => { const s = subsidyOf(c); return s.mode === 'monthly' ? s.amount * 12 : s.mode === 'yearly' ? s.amount : 0; };
const onceThisYear = (c: C) => { const s = subsidyOf(c); return s.mode === 'once' && s.amount && c.validTo.slice(0, 4) === TODAY.slice(0, 4) ? s.amount : 0; };

/* ============ 附件 ============ */
type Attach = { name: string; size: number; at: string };
const ATTACH_SEED: Record<string, Attach[]> = {
  ZS000015: [{ name: '注册消防工程师注册证.pdf', size: 820, at: '2025-10-18' }, { name: '延续注册受理单.pdf', size: 340, at: '2025-09-20' }],
  ZS000044: [{ name: '安全生产许可证（正本）.pdf', size: 1180, at: '2024-11-18' }],
  ZS000031: [{ name: '维护保养检测资质（二级）.pdf', size: 960, at: '2024-01-31' }],
  ZS000050: [{ name: '一级建造师注册证书.pdf', size: 760, at: '2025-08-31' }],
};
const attachOf = (c: C) => ATTACH_SEED[c.id] || [];

/* ============ 借出用途 / 续借 ============ */
const PURPOSES = ['投标资格审查', '投标标书递交', '项目履约配备', '资质核查 / 年审', '其他'];

export default function CertPage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  const [view, setView] = useState<'cert' | 'person' | 'project'>('cert');
  const [kw, setKw] = useState('');
  /** 状态筛选（下拉单选）：'' 全部 / 正常 / expiring 即将到期 / 已过期 / long 长期有效 / lent 借出中 */
  const [statusF, setStatusF] = useState('');
  /** 证书大类筛选（chips）：'' 全部 / reg 注册类 / skill 技能类 / safety 安全类 / qual 资质类 */
  const [catF, setCatF] = useState('');
  /** 排序：exp-asc 最早到期在前（默认）/ exp-desc 最晚到期在前 / sub-desc 补贴成本从高到低 */
  const [sortKey, setSortKey] = useState('exp-asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detail, setDetail] = useState<C | null>(null);
  const [lendOpen, setLendOpen] = useState<C | null>(null);
  const [useOpen, setUseOpen] = useState<C | null>(null);
  const [outOpen, setOutOpen] = useState<C | null>(null);
  // 评审 I1：解除证书占用直接影响投标/项目资格校验，改为二次确认 + 原因必填
  const [freeOpen, setFreeOpen] = useState<string | null>(null);
  const [renewOpen, setRenewOpen] = useState<C | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [ocrTip, setOcrTip] = useState(false);
  /** 证书照片识别工作台开关 */
  const [recogOpen, setRecogOpen] = useState(false);
  const [certSel, setCertSel] = useState<string[]>([]);
  const firstProj = PROJECTS[0]?.id || '';
  const [lendProj, setLendProj] = useState(firstProj);
  const [lendNote, setLendNote] = useState('');
  const [usePerson, setUsePerson] = useState('');
  const [useProj, setUseProj] = useState(firstProj);
  const [outUnit, setOutUnit] = useState('');
  const [outFrom, setOutFrom] = useState(TODAY);
  const [outTo, setOutTo] = useState('');
  const [outErr, setOutErr] = useState('');
  const [renewPeriod, setRenewPeriod] = useState('');
  const [renewTo, setRenewTo] = useState('');
  const [renewErr, setRenewErr] = useState('');
  // 待处理黄条：默认只显示分组摘要行，点击组名展开该组明细
  const [stripOpenGroups, setStripOpenGroups] = useState<Record<string, boolean>>({});
  // 借出用途 / 续借
  const [lendPurpose, setLendPurpose] = useState(PURPOSES[0]);
  const [lendErr, setLendErr] = useState('');
  const [renewBorrowOpen, setRenewBorrowOpen] = useState<C | null>(null);
  const [rbTo, setRbTo] = useState('');
  const [rbErr, setRbErr] = useState('');
  /* ---- 项8：一键生成证书报告（独立于台账导出，纯 mock 预览，不接真实 PDF 引擎） ---- */
  const [reportOpen, setReportOpen] = useState(false);
  /** 报告包含的证书 id 集合（打开时默认全选） */
  const [reportIds, setReportIds] = useState<string[]>([]);
  /** 报告范围里按大类过滤（仅作用于下方勾选清单，不改变是否纳入报告的勾选态） */
  const [reportCat, setReportCat] = useState('');
  const [reportFmt, setReportFmt] = useState<'xlsx' | 'pdf'>('xlsx');
  /* ---- 新增证书：全部字段受控 —— 保存真正落库，与批量导入同一套口径 ---- */
  const [nOwnerType, setNOwnerType] = useState<'人员证书' | '企业资质'>('人员证书');
  const [nName, setNName] = useState('');
  const [nSubType, setNSubType] = useState<string>(CERT_SUBTYPES[0]);
  const [nCertNo, setNCertNo] = useState('');
  const [nHolder, setNHolder] = useState('');
  const [nIssue, setNIssue] = useState('');
  const [nValidTo, setNValidTo] = useState('');
  const [nLongTerm, setNLongTerm] = useState(false);
  const [nRemind, setNRemind] = useState('30');
  const [nMode, setNMode] = useState<'single' | 'multi' | 'log'>('single');
  const [nCap, setNCap] = useState(1);
  const [nSubMode, setNSubMode] = useState<SubMode>('none');
  const [nSubAmt, setNSubAmt] = useState(0);
  const [nSubStart, setNSubStart] = useState('');
  /** 新增证书表单：打开时与保存后统一重置，避免残留上次输入 */
  const resetNewCert = () => {
    setNOwnerType('人员证书'); setNName(''); setNSubType(CERT_SUBTYPES[0]); setNCertNo('');
    setNHolder(''); setNIssue(''); setNValidTo(''); setNLongTerm(false); setNRemind('30');
    setNMode('single'); setNCap(1); setNSubMode('none'); setNSubAmt(0); setNSubStart(''); setOcrTip(false);
  };
  /** 选子类即带出归属 / 占用方式 / 上限（子类决定这三项，不让用户重复填） */
  const pickSubType = (st: string) => {
    setNSubType(st);
    const meta = CERT_SUBTYPE_META[st];
    if (meta) { setNOwnerType(meta.owner); setNMode(meta.mode); setNCap(meta.cap); }
  };

  /** 识别工作台「全部确认并写入」：把核对后的字段填入新增证书表单 */
  const onCertRecog = (fs: RecognitionField[]) => {
    const get = (k: string) => fs.find((f) => f.key === k)?.value ?? '';
    setNCertNo(get('certNo'));
    setNHolder(get('holder'));
    const major = get('major');
    setNName(get('certType') + (major ? ` · ${major}` : ''));
    setNValidTo(get('validTo'));
    setNIssue(get('issue'));
    setOcrTip(true);
    toast('已填入识别结果，请核对');
  };

  /**
   * 新增证书保存：与批量导入同一套口径 —— 缺什么拦什么，不静默存半条。
   * ⚠️ 编号重复直接拦下：certNo 是业务唯一键，重复会让「批量导入去重」失去依据。
   */
  const saveNewCert = () => {
    if (!nName.trim()) { toast('请填写证书名称', 'err'); return; }
    if (!nCertNo.trim()) { toast('请填写证书编号（用于判断是否与台账重复）', 'err'); return; }
    if (!nHolder.trim()) { toast(`请填写${nOwnerType === '企业资质' ? '保管人' : '持证人'}`, 'err'); return; }
    if (!nIssue.trim()) { toast('请填写发证机关', 'err'); return; }
    if (!nLongTerm && !nValidTo) { toast('请填写有效期至，或勾选长期有效', 'err'); return; }
    if (nSubMode !== 'none' && !(nSubAmt > 0)) { toast('已选择补贴模式，请填写补贴金额', 'err'); return; }
    if (nSubMode !== 'none' && !nSubStart) { toast('请填写补贴起算日期', 'err'); return; }
    if (certs.some((c) => c.certNo === nCertNo.trim())) {
      toast(`证书编号 ${nCertNo.trim()} 已在台账里，请核对后再保存`, 'err'); return;
    }
    const cert = draftToCert({
      src: '手动新增',
      name: nName.trim(), certNo: nCertNo.trim(), subType: nSubType,
      holder: nHolder.trim(), issue: nIssue.trim(),
      validTo: nLongTerm ? '' : nValidTo, longTerm: nLongTerm,
      remind: Number(nRemind) || 30, conf: {}, bad: {}, warns: [],
      mode: nMode, cap: nCap,
      subsidy: nSubMode === 'none' ? undefined : { mode: nSubMode, amount: nSubAmt, start: nSubStart },
    }, nextCertNos(1)[0]);
    addCert(cert);
    toast(`证书已新增到台账 · ${nOwnerType === '企业资质' ? `公司证书（保管人 ${nHolder.trim()}）` : '个人证书'}${nLongTerm ? ' · 长期有效' : ''}`);
    setNewOpen(false); resetNewCert();
  };

  /* ---- 批量导入：选文件 → 核对 → 批量入库（表格走解析，照片走识别） ---- */
  const [impOpen, setImpOpen] = useState(false);
  const [impStep, setImpStep] = useState<'pick' | 'check'>('pick');
  const [impText, setImpText] = useState('');
  const [impNames, setImpNames] = useState<string[]>([]);
  const [impErr, setImpErr] = useState('');
  const [impBusy, setImpBusy] = useState(false);
  const [impDrag, setImpDrag] = useState(false);
  const [impDrafts, setImpDrafts] = useState<CertDraft[]>([]);
  const [impSkip, setImpSkip] = useState<string[]>([]);
  /** 逐条是否入库；与台账已有编号重复的默认不勾 */
  const [impOn, setImpOn] = useState<boolean[]>([]);
  const impFileRef = useRef<HTMLInputElement>(null);

  /* AI 助手快捷操作：助手在本页点「OCR 识别证书建档」→ 跳本页并直接打开新增窗口（带 OCR 预填提示）。
     以 nav（路由脉冲）为依赖 —— 已在证书页时再点一次也能重新打开（onNavigate 每次都 setNav+1）。 */
  useEffect(() => {
    const a = consumePageAction('cert');
    if (!a) return;
    resetNewCert();
    setNewOpen(true);
    if (a === 'new-ocr') setOcrTip(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav]);

  const daysLeft = (d: string) => Math.round((new Date(d).getTime() - new Date(TODAY).getTime()) / 86400000);
  const validTone = (d: string) => { const n = daysLeft(d); return n < 0 ? 'is-red' : n <= 30 ? 'is-orange' : n <= 90 ? 'is-gold' : ''; };

  /* G1（二次修复）：证书写操作必须落**跨页 store**。
     上一版改成 useState(CERTS) 只解决了「本页不刷新」，写进去的仍是本页副本 ——
     投标页读 data.ts 常量、侧栏徽标与驾驶舱预警各读各的，于是
     「证书管理页续了安许，投标页照样提示安许已过期」。
     现在读写同一份 store：本页一改，所有引用证书的页面同步跟上。 */
  const certs = useSyncExternalStore(subscribeStore, getCerts, getCerts);

  /* ---- 批量导入：解析 / 识别 → 核对 → 批量入库 ---- */
  const openImport = () => {
    setImpOpen(true); setImpStep('pick'); setImpText(''); setImpNames([]);
    setImpErr(''); setImpDrafts([]); setImpSkip([]); setImpOn([]); setImpBusy(false);
  };

  /**
   * 草稿 → 核对清单。
   * 默认勾选规则：**只有「必填齐全 且 不与台账重复」的才默认勾上**。
   * ⚠️ 待补全的也默认勾上的话，用户点「确认入库」必然撞校验 —— 先让他看见红标、补完再勾。
   */
  const acceptDrafts = (drafts: CertDraft[], skipped: string[]) => {
    const seen = new Set<string>();
    const on = drafts.map((d) => {
      if (impBlock(d).length) return false;          // 必填不全 → 默认不勾
      const key = d.certNo.trim();
      if (!key) return true;                         // 没编号无从判定重复，交给用户
      const dup = certs.some((c) => c.certNo === key) || seen.has(key);
      seen.add(key);
      return !dup;
    });
    setImpDrafts(drafts); setImpSkip(skipped); setImpOn(on); setImpErr(''); setImpStep('check');
  };

  const onPickFiles = async (list: File[]) => {
    if (!list.length) return;
    setImpBusy(true); setImpErr(''); setImpNames(list.map((f) => f.name));
    try {
      const r = await readCertFiles(list);
      acceptDrafts(r.drafts, r.skipped);
    } catch (e) {
      setImpErr(e instanceof Error ? e.message : '读取文件失败');
    } finally { setImpBusy(false); }
  };

  const patchDraft = (i: number, patch: Partial<CertDraft>) =>
    setImpDrafts((list) => list.map((d, k) => (k === i ? { ...d, ...patch } : d)));

  /** 逐行重复标记（与台账已有编号重复，或本次文件内自重复） */
  const impDup = useMemo(() => {
    const seen = new Set<string>();
    return impDrafts.map((d) => {
      const key = d.certNo.trim();
      if (!key) return false;
      const dup = certs.some((c) => c.certNo === key) || seen.has(key);
      seen.add(key);
      return dup;
    });
  }, [impDrafts, certs]);

  const impStat = useMemo(() => {
    let needFix = 0, lowConf = 0;
    impDrafts.forEach((d) => {
      if (impBlock(d).length) needFix++;
      if (Object.values(d.conf).some((v) => (v ?? 1) < CONF_LOW)) lowConf++;
    });
    return {
      dup: impDup.filter(Boolean).length,
      needFix, lowConf,
      on: impOn.filter(Boolean).length,
      off: impOn.filter((v) => !v).length,
    };
  }, [impDrafts, impOn, impDup]);

  const doImport = () => {
    const picked: { d: CertDraft; i: number }[] = [];
    impDrafts.forEach((d, i) => { if (impOn[i]) picked.push({ d, i }); });
    if (!picked.length) { toast('请至少勾选一条要入库的证书'); return; }
    /* 勾了但必填不全的，用「来源」逐条指名 —— 说「第 N 条」用户在长列表里数不清是哪一个 */
    const blocked = picked.filter(({ d }) => impBlock(d).length);
    if (blocked.length) {
      const head = blocked.slice(0, 2).map(({ d }) => `${d.src} 缺 ${impBlock(d).join(' / ')}`).join('；');
      toast(`${blocked.length} 条已勾选但必填不全：${head}${blocked.length > 2 ? ' 等' : ''}`, 'err');
      return;
    }
    const ids = nextCertNos(picked.length);
    addCerts(picked.map(({ d }, k) => draftToCert(d, ids[k])));
    setImpOpen(false);
    const off = impOn.length - picked.length;
    toast(`已批量入库 ${picked.length} 条证书${off > 0 ? `，未选 ${off} 条` : ''}；临期提醒与统计已同步刷新`);
  };

  /** 借还回写：used 为占用项目 id 数组 */
  const patchCert = (id: string, patch: Partial<C>, msg: string) => {
    patchCertStore(id, patch);
    setDetail((d) => (d && d.id === id ? ({ ...d, ...patch } as C) : d));
    toast(msg);
  };
  const rows = useMemo(() => {
    const list = certs.filter((c) => {
      if (kw && !(c.name + c.id + c.holder + c.subType).includes(kw)) return false;
      if (catF && CAT_OF[c.subType] !== catF) return false;
      // 状态口径互斥：正常（不含长期有效）/ 即将到期（30/60 天内）/ 已过期 / 长期有效 / 借出中
      if (statusF === '正常' && !(c.status === '正常' && !isLongTerm(c))) return false;
      if (statusF === 'expiring' && !c.status.includes('到期')) return false;
      if (statusF === '已过期' && !(!isLongTerm(c) && c.validTo < TODAY)) return false;
      if (statusF === 'long' && !isLongTerm(c)) return false;
      if (statusF === 'lent' && !(c.used.length > 0)) return false;
      return true;
    });
    if (sortKey === 'exp-asc') list.sort((a, b) => a.validTo.localeCompare(b.validTo));
    else if (sortKey === 'exp-desc') list.sort((a, b) => b.validTo.localeCompare(a.validTo));
    else if (sortKey === 'sub-desc') list.sort((a, b) => (yearCost(b) + onceThisYear(b)) - (yearCost(a) + onceThisYear(a)));
    return list;
  }, [certs, kw, catF, statusF, sortKey]);

  const paged = rows.slice((page - 1) * pageSize, page * pageSize);
  const builders = certs.filter((c) => c.isBuilder);
  const safety = certs.find((c) => c.subType === '安许');

  // 三视角分组
  const byPerson = useMemo(() => {
    const m: Record<string, C[]> = {} as Record<string, C[]>;
    certs.forEach((c) => { (m[c.holder] = m[c.holder] || []).push(c); });
    return Object.entries(m);
  }, []);
  const byProject = useMemo(() => {
    const m: Record<string, C[]> = {} as Record<string, C[]>;
    PROJECTS.forEach((p) => { m[p.id] = certs.filter((c) => (c.used as string[]).includes(p.id)); });
    return Object.entries(m).filter(([, v]) => v.length);
  }, []);

  /** 待处理条：过期 / 临期 / 占用满载 —— 按类型分组展示，点击直达详情安排续期 */
  const stripItems = useMemo(() => {
    const out: { id: string; kind: 'expired' | 'due30' | 'due60' | 'occupy'; badge: string; name: string; holder: string; action: string }[] = [];
    certs.forEach((c) => {
      if (isLongTerm(c) || c.subType === '安许') return; // 安许过期由顶部横幅承担，避免重复
      if (c.validTo < TODAY) out.push({ id: c.id, kind: 'expired', badge: '已过期', name: c.name, holder: c.holder, action: `已过期 ${Math.abs(daysLeft(c.validTo))} 天 · 须立即续期` });
      else if (c.warnDays > 0 && c.warnDays <= 30) out.push({ id: c.id, kind: 'due30', badge: '30 天内到期', name: c.name, holder: c.holder, action: `剩 ${daysLeft(c.validTo)} 天 · 安排续期` });
      else if (c.warnDays > 30 && c.warnDays <= 90) out.push({ id: c.id, kind: 'due60', badge: '60 天内到期', name: c.name, holder: c.holder, action: `剩 ${daysLeft(c.validTo)} 天 · 提前准备材料` });
      if (c.mode === 'single' && c.used.length >= c.cap) out.push({ id: c.id, kind: 'occupy', badge: '并行占用', name: c.name, holder: c.holder, action: `已达上限 ${c.used.length}/${c.cap} · 需提额或释放` });
    });
    return out;
  }, [certs]);

  /** 年度补贴成本 = Σ年化 + 本年度到期的一次性补贴 */
  const subsidyYear = certs.reduce((a, c) => a + yearCost(c) + onceThisYear(c), 0);

  /* 统计瓦片基数（与列表筛选同源，保证「点击瓦片」复现的结果与瓦片数字一致） */
  const d30Count = certs.filter((c) => !isLongTerm(c) && c.warnDays > 0 && c.warnDays <= 30).length;
  const d90Count = certs.filter((c) => !isLongTerm(c) && c.warnDays > 0 && c.warnDays <= 90).length;
  const expiredCount = certs.filter((c) => !isLongTerm(c) && c.validTo < TODAY).length;
  const longTermCount = certs.filter(isLongTerm).length;

  // 注意：Modal 的 foot / children 作为 prop 会在 Modal 内部 open 判断之前求值，
  // 因此 canLend / lendWhy 必须容忍 null（弹窗关闭时为 null）。
  const canLend = (c: C | null) => !!c && (isLongTerm(c) || c.validTo >= TODAY) && c.mode !== 'log' && c.subType !== 'B证';
  const lendWhy = (c: C | null) => !c ? ''
    : (!isLongTerm(c) && c.validTo < TODAY) ? ' 已过期，不可借出（过期证书借出 / 投标将被硬拦截）'
    : c.subType === 'B证' ? ' B 证随注册使用，不单独借出'
    : c.mode === 'log' ? ' 按次登记类，请改用「登记使用」'
    : c.mode === 'single' && c.used.length >= c.cap ? `已达并行占用上限（${c.used.length}/${c.cap}），需先提额` : '';

  const certCols = [
    {
      key: 'name', title: '证书名称', width: 240, sticky: 'left' as const,
      render: (c: C) => (
        <div className="nc-cell-main">
          <div>{c.name}{c.level === 'company-red' && <Tag tone="red">公司级红色风险项</Tag>}</div>
          <div className="nc-cell-sub"><Code>{c.id}</Code> · {c.issue}</div>
        </div>
      ),
    },
    { key: 'type', title: '类型', width: 90, render: (c: C) => c.type },
    { key: 'subType', title: '专业', width: 120, render: (c: C) => c.subType },
    { key: 'holder', title: '持有人 / 保管人', width: 150, render: (c: C) => (isCompany(c)
      ? <><span style={{ color: 'var(--c-warning-deep)' }}>公司证书</span><div className="nc-cell-sub">保管 {custodianOf(c)}</div></>
      : <>{c.holder}</>) },
    { key: 'validTo', title: <>有效期至 ↕ <Tip text="证书到期后自动置为「已过期」，投标引用、项目派单、外借均被拦截；续证安排需提前发起。" /></>, width: 160, render: (c: C) => (isLongTerm(c)
      ? <Tag tone="green">长期有效</Tag>
      : <span className={validTone(c.validTo)} style={{ whiteSpace: 'nowrap' }} title={validTone(c.validTo) ? '提前 30 天提醒，到期后禁用投标 / 借用' : undefined}><span className="num">{c.validTo}</span>{c.validTo < TODAY ? ' · 已过期' : c.warnDays ? ` · 剩 ${daysLeft(c.validTo)} 天` : ''}</span>) },
    { key: 'status', title: '状态', width: 100, render: (c: C) => <Tag tone={c.status === '正常' ? 'green' : c.status === '已过期' ? 'red' : 'orange'}>{c.status}</Tag> },
    { key: 'mode', title: '占用方式', width: 110, render: (c: C) => <Tag tone={MODE_TONE[c.mode]}>{MODE_LABEL[c.mode]}</Tag> },
    { key: 'used', title: <>并行占用 ↕ <Tip text="占用三分法：一证一项目（法定独占）/ 多项目引用（公司资质）/ 按次登记（不占用，记一笔）。" /></>, width: 96, align: 'right' as const, render: (c: C) => <span className={`num${c.mode === 'single' && c.used.length >= c.cap ? ' is-red' : ''}`}>{c.used.length}/{c.cap === 99 ? '∞' : c.cap}</span> },
    {
      key: 'op', title: '操作', width: 260, align: 'right' as const,
      /* 评审改造：操作列统一为「3 个固定槽位 + 更多收口」。
         槽位①详情（恒可用）②借给项目 ③登记使用 —— 位置跨行恒定；
         该行无对应权限/不适用时留「—」占位并悬停说明原因，避免不同行的按钮位置漂移；
         其余操作（用完收回 / 外借 / 收回外借）收进「更多 ⋯」。 */
      render: (c: C) => (
        <div className="nc-ops" onClick={(e) => e.stopPropagation()}>
          <Op onClick={() => setDetail(c)}>详情</Op>
          <OpSep />
          {c.mode === 'log'
            ? <Op onClick={() => { setUseOpen(c); setUsePerson(''); }}>登记使用</Op>
            : canLend(c)
              ? <Op title={lendWhy(c) || '借走后仅该项目可用'} onClick={() => { setLendOpen(c); setLendProj(firstProj); setLendNote(''); setLendErr(''); setLendPurpose(PURPOSES[0]); }}>借给项目</Op>
              : <OpNone title={lendWhy(c) || '该证书当前不可借给项目'} />}
          <OpSep />
          <OpMore items={[
            {
              label: '用完收回', disabled: !c.used.length,
              title: !c.used.length ? '当前无借出记录' : '释放名额并留痕',
              onClick: () => patchCert(c.id, { used: [] }, `已「用完收回」· 释放 ${c.used.length} 个名额并留痕`),
            },
            {
              label: '外借', title: '外借期间本司项目不可用',
              onClick: () => { setOutOpen(c); setOutUnit(''); setOutErr(''); setOutTo(''); },
            },
            {
              label: '收回外借', disabled: !c.used.length,
              title: !c.used.length ? '当前无外借记录' : '释放名额并留痕',
              onClick: () => patchCert(c.id, { used: [] }, '已「收回外借」· 本司项目恢复可用'),
            },
          ]} />
        </div>
      ),
    },
  ];

  const exportFields: ExportField[] = [
    { key: 'id', label: '证书编号' },
    { key: 'name', label: '证书名称' },
    { key: 'type', label: '类型' },
    { key: 'subType', label: '专业' },
    { key: 'holder', label: '持有人/保管人' },
    { key: 'validTo', label: '有效期至' },
    { key: 'status', label: '状态' },
    { key: 'mode', label: '占用方式' },
    { key: 'used', label: '并行占用' },
  ];
  const exportApi = useExport({
    pageKey: 'cert', pageName: '证书台账',
    fields: exportFields, defaultFieldKeys: exportFields.map((f) => f.key),
    totalCount: certs.length, filteredCount: rows.length, selectedCount: certSel.length,
    previewRows: rows.slice(0, 5),
    userName: getUserName(role),
    onExport: (cfg) => toast(`已导出证书台账（${cfg.format}·${cfg.scope === 'all' ? '全部' : cfg.scope === 'filtered' ? '当前筛选' : `勾选${certSel.length}条`}·含水印）`),
  });

  /* ---- 项8：证书报告弹窗派生数据（按已勾选证书实时统计，纯 mock） ---- */
  /** 报告清单按大类过滤后的可勾选集合（勾选态独立保留，过滤只改变显示） */
  const reportList = certs.filter((c) => !reportCat || CAT_OF[c.subType] === reportCat);
  /** 已纳入报告的证书（始终按 certs 全集统计，不受 reportCat 过滤影响） */
  const reportSel = certs.filter((c) => reportIds.includes(c.id));
  const reportSummary = {
    total: reportSel.length,
    expired: reportSel.filter((c) => !isLongTerm(c) && c.validTo < TODAY).length,
    expiring: reportSel.filter((c) => !isLongTerm(c) && c.warnDays > 0 && c.warnDays <= 90).length,
    longTerm: reportSel.filter(isLongTerm).length,
    used: reportSel.filter((c) => c.used.length > 0).length,
  };
  /** 打开报告弹窗：默认全选当前在册证书 */
  const openReport = () => {
    setReportIds(certs.map((c) => c.id));
    setReportCat('');
    setReportFmt('xlsx');
    setReportOpen(true);
  };
  const toggleReportId = (id: string, v: boolean) =>
    setReportIds((prev) => (v ? Array.from(new Set([...prev, id])) : prev.filter((x) => x !== id)));
  const genReport = () => {
    toast(`证书报告已生成（${reportFmt.toUpperCase()}）· 含 ${reportSel.length} 本证书 · 已加入下载任务`);
    setReportOpen(false);
  };

  return (
    <>
      <PageHead
        title="证书管理"
        badges={<Tag tone="blue">在册 {certs.length} 本</Tag>}
      />

      {/* 安许全局警示条：口径与侧栏徽标 / 驾驶舱预警一致（已过期 或 落在预警档位内），
          原先写死 `validTo < '2026-12-31'` —— 一个与 TODAY 无关的魔法日期，
          证书续到更远就自动失效、改成过期也说不清依据。 */}
      {safety && (safety.validTo < TODAY || safety.warnDays > 0) && (
        <Banner tone="warn" actions={<Btn size="sm" onClick={() => { setRenewOpen(safety); setRenewPeriod(''); setRenewTo(''); setRenewErr(''); }}>安排续证</Btn>}>
          <Ico n="ban" size={14} style={{ color: 'var(--c-danger)' }} /> <b>{safety.name}</b>（{safety.id}）有效期至 {safety.validTo}
          （{safety.validTo < TODAY ? `已过期 ${Math.abs(daysLeft(safety.validTo))} 天` : `剩 ${daysLeft(safety.validTo)} 天`}）——依「安全生产许可证过期 = <b>全部投标废标</b>」，请立即完成<b>续证安排</b>。
        </Banner>
      )}

      {/* 待处理条：过期 / 临期 / 占用满载 —— 默认只显示分组摘要行，点击组名展开该组明细 */}
      {stripItems.length > 0 && (
        <div className="nc-cert-strip">
          <div className="nc-cert-strip-head">
            <b><Ico n="clock" size={16} /> {stripItems.length} 条证书待处理</b>
            <span className="nc-cs-hint">点击分组展开明细，直达证书安排续期 / 归还 / 复审</span>
          </div>
          {STRIP_GROUPS.map((g) => {
            const items = stripItems.filter((it) => it.kind === g.key);
            if (!items.length) return null;
            const open = !!stripOpenGroups[g.key];
            const names = items.slice(0, 3).map((it) => it.name).join(' / ');
            return (
              <div className="nc-cert-strip-group" key={g.key}>
                <button type="button" className={`nc-cert-strip-gtitle ${g.cls}`} style={{ width: '100%', cursor: 'pointer', background: 'none', border: 0, textAlign: 'left' }}
                  onClick={() => setStripOpenGroups((m) => ({ ...m, [g.key]: !m[g.key] }))}>
                  <span>{g.label} <b>{items.length}</b></span>
                  <span style={{ fontWeight: 400, marginLeft: 8 }}>{names}{items.length > 3 ? ` 等 ${items.length} 项` : ''}</span>
                  <span style={{ marginLeft: 'auto' }}>{open ? '▾' : '▸'}</span>
                </button>
                {open && (
                  <div className="nc-cert-strip-items">
                    {items.map((it) => (
                      <button key={`${it.id}-${it.kind}`} type="button" className={`nc-cert-strip-item ${g.cls}`}
                        onClick={() => { const c = certs.find((x) => x.id === it.id); if (c) setDetail(c); }}>
                        <span className="nc-cert-strip-badge">{it.badge}</span>
                        <span className="nc-cert-strip-name">{it.name}</span>
                        <span className="nc-cert-strip-holder">{it.holder}</span>
                        <span className="nc-cert-strip-act">{it.action}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/*
        统计卡 4 张
        评审问题：原先仅靠「红字」传达严重程度 —— 色觉障碍用户与黑白打印场景会丢失全部层级信息，
        且瓦片不可点击，「看到本周有 3 本到期」之后仍需自行去筛选器里找条件，路径断裂。
        改法：① 每个瓦片补「字形 + 文字后缀」双重冗余编码（颜色不再是唯一通道）；
              ② 可下钻的瓦片点击即完成筛选 + 回首页 + 切回证书视角，与列表联动保持同一状态源；
              ③ 标签口径与点击后的筛选结果严格一致（原「90 天内到期」实际含 31–90 与 ≤30 两档，
                 点击后无法复现同一批数据，属虚假引导，故改为口径闭合的「30 天内到期」）。
      */}
      <div className="nc-tiles nc-tiles-4">
        {[
          {
            key: 'all', label: '证书总数', filter: '' as string | null,
            n: certs.length, glyph: '≡', sev: '', sfx: '本', wan: false, gap: false, tip: '' as string | undefined,
            sub: '在册（有效 + 到期）',
          },
          {
            key: 'subsidy', label: '年度补贴成本', filter: null,
            n: subsidyYear, glyph: '¥', sev: ' is-gold', sfx: '/年', wan: true, gap: false, tip: '月度 ×12 + 年度；一次性按到期年计入',
            sub: '',
          },
          {
            key: 'd30', label: '30 天内到期', filter: 'expiring' as string | null,
            n: d30Count, glyph: '!!!', sev: d30Count > 0 ? ' is-red' : '', sfx: '本', wan: false, gap: true, tip: '' as string | undefined,
            sub: `另 31–90 天 ${d90Count - d30Count} 本`,
          },
          {
            key: 'expired', label: '已过期', filter: '已过期' as string | null,
            n: expiredCount, glyph: '✕', sev: expiredCount > 0 ? ' is-red' : '', sfx: '本', wan: false, gap: false, tip: '' as string | undefined,
            sub: `另有长期有效 ${longTermCount} 本（不设到期日）`,
          },
        ].map((t) => {
          const clickable = t.filter !== null;
          const active = clickable && statusF === t.filter;
          const goFilter = clickable
            ? () => { setStatusF(t.filter as string); setPage(1); setView('cert'); }
            : undefined;
          return (
            <div
              key={t.key}
              className={`nc-tile${clickable ? ' is-clickable' : ''}${active ? ' is-active' : ''}`}
              style={t.gap ? { marginLeft: 16 } : undefined}
              onClick={goFilter}
              title={t.tip || (clickable ? `筛选出「${t.label}」的证书` : undefined)}
              {...pressProps(goFilter)}
            >
              <div className="nc-tile-label">
                {t.label}
                <span className={`nc-tile-glyph${t.glyph === '!!!' || t.glyph === '✕' ? ' is-alert' : ''}`} aria-hidden="true">{t.glyph}</span>
              </div>
              <div className={`nc-tile-value num${t.sev}`}>
                {t.wan ? <Money v={t.n} role={role} wan /> : <span className="num">{t.n}</span>}
                <span className="nc-tile-sfx">{t.sfx}</span>
              </div>
              <div className="nc-tile-sub">{t.sub}</div>
            </div>
          );
        })}
      </div>

      {/* 筛选行：左「状态 ▾ / 重置 / 搜索」（仅证书视角）；弹性分隔后最右「｜ 视角切换 / 导出台账 / 新增证书」 */}
      <div className="nc-toolbar" style={{ marginBottom: 12 }}>
        {view === 'cert' && (
          <>
            <select
              className="nc-input nc-cert-sel" aria-label="按状态筛选" value={statusF}
              onChange={(e) => { setStatusF(e.target.value); setPage(1); }}
            >
              <option value="">全部状态</option>
              <option value="正常">正常</option>
              <option value="expiring">即将到期</option>
              <option value="已过期">已过期</option>
              <option value="long">长期有效</option>
              <option value="lent">借出中</option>
            </select>
            <Btn kind="link" size="sm" onClick={() => { setStatusF(''); setSortKey('exp-asc'); setKw(''); setPage(1); }}>重置</Btn>
            <input
              className="nc-input nc-lt-search" value={kw} placeholder="搜索姓名 / 证书 / 编号"
              onChange={(e) => { setKw(e.target.value); setPage(1); }}
            />
          </>
        )}
        <span style={{ flex: 1 }} />
        <span className="nc-ltbar-div" />
        <div className="nc-seg">
          <button className={`nc-seg-btn${view === 'cert' ? ' is-on' : ''}`} onClick={() => { setView('cert'); setCertSel([]); }}>按证书</button>
          <button className={`nc-seg-btn${view === 'person' ? ' is-on' : ''}`} onClick={() => { setView('person'); setCertSel([]); }}>按人员</button>
          <button className={`nc-seg-btn${view === 'project' ? ' is-on' : ''}`} onClick={() => { setView('project'); setCertSel([]); }}>按项目</button>
        </div>
        <ExportButton onClick={exportApi.trigger} selectedCount={certSel.length} />
        <Btn title="按证书范围生成含封面 / 清单 / 统计摘要的报告（PDF / Excel），区别于台账导出" onClick={openReport}>
          <Ico n="file" size={16} /> 生成证书报告
        </Btn>
        <OpMore items={[{ label: '批量导入', title: '批量导入证书台账表，或上传证书照片批量识别后核对入库', onClick: openImport }]} />
        <Btn kind="primary" onClick={() => { setNewOpen(true); resetNewCert(); }}>＋ 新增证书</Btn>
      </div>

      {view === 'cert' ? (
        <Card flush style={{ paddingBottom: 64 }}>
          {/* 证书大类 chips（带计数，与「全部状态」下拉纵向互补：大类横向切、状态纵向筛） */}
          <div className="nc-ltrow" style={{ padding: '12px 16px 4px' }}>
            {CERT_CATS.map((cat) => (
              <button
                key={cat.key} type="button"
                className={`nc-fchip${catF === cat.key ? ' is-on' : ''}`}
                onClick={() => { setCatF(cat.key); setPage(1); }}
              >
                {cat.label}<span className="n">{cat.key === '' ? certs.length : certs.filter((c) => CAT_OF[c.subType] === cat.key).length}</span>
              </button>
            ))}
          </div>
          <DataTable
            cols={certCols} rows={paged} rowKey={(c) => c.id} minWidth={1420}
            selectable selected={certSel}
            onSelectAll={setCertSel}            onSelectRow={(id) => setCertSel((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])}
            empty="没有符合条件的证书"
            emptyCta={<Btn kind="primary" onClick={() => { setNewOpen(true); resetNewCert(); }}>＋ 新增证书</Btn>}
            /* 条目背景色统一：证件到期 / 高风险不再整行铺色，改由行内标签与状态列承担 */
            onRowClick={(c) => setDetail(c)}
            foot={<TableFoot total={certs.length} filtered={rows.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} unit="本" extra={<span className="nc-cell-sub"> ｜ 行点击打开详情</span>} />}
          />
        </Card>
      ) : view === 'person' ? (
        <Card hd="按人员视角" extra={<span className="nc-cell-sub">一位持有人名下的全部证书 · B 证随注册使用</span>}>
          <table className="nc-tbl" style={{ minWidth: 980 }}>
            <thead><tr><th style={{ width: 130 }}>持有人</th><th>持有证书</th><th style={{ width: 120 }}>注册类证书</th><th style={{ width: 96 }} className="is-num">并行占用</th><th style={{ width: 90 }} className="is-num">借出中</th><th style={{ width: 110 }} className="is-num">年补贴</th><th style={{ width: 140 }}>最早到期</th><th style={{ width: 180 }}>操作</th></tr></thead>
            <tbody>
              {byPerson.map(([person, cs]) => {
                const earliest = cs.map((c) => c.validTo).sort()[0];
                const isBuilder = cs.some((c) => c.isBuilder);
                return (
                  <tr key={person}>
                    <td><b>{person}</b>{isBuilder && <div className="nc-cell-sub">建造师</div>}</td>
                    <td>{cs.map((c) => <div key={c.id} className="nc-cell-sub">{c.name} <Code>{c.id}</Code></div>)}</td>
                    <td>{cs.some((c) => c.subType === '注册消防工程师' || c.subType === '建造师') ? <Tag tone="red">一证一项目</Tag> : <Tag tone="gray">非注册类</Tag>}</td>
                    <td className="is-num">{cs.reduce((a, c) => a + c.used.length, 0)}/{cs.reduce((a, c) => a + (c.cap === 99 ? 0 : c.cap), 0) || '—'}</td>
                    <td className="is-num">{cs.filter((c) => c.used.length > 0).length} / {cs.length}</td>
                    <td className="is-num">{cs.reduce((a, c) => a + yearCost(c) + onceThisYear(c), 0) ? fmt(cs.reduce((a, c) => a + yearCost(c) + onceThisYear(c), 0)) : '—'}</td>
                    <td className={cs.some(isLongTerm) ? '' : validTone(earliest)}>{cs.some(isLongTerm) ? '含长期有效' : earliest}</td>
                    <td><div className="nc-ops">
                      <Op onClick={() => toast('已打开人员证书汇总')}>汇总</Op>
                      <OpSep />
                      <Op gold onClick={() => toast('请切换到「证书台账」视图，逐张证书借给项目')}>借给项目</Op>
                      <OpSep />
                      <OpMore items={[{ label: '导出名单', onClick: () => toast('已导出该持有人证书名单（演示）') }]} />
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card hd="按项目视角" extra={<span className="nc-cell-sub">项目名下的证书配备与配额（×1~×2 可调）</span>}>
          <table className="nc-tbl" style={{ minWidth: 980 }}>
            <thead><tr><th style={{ width: 230 }}>项目</th><th>已配备证书</th><th style={{ width: 120 }}>配备度</th><th style={{ width: 130 }}>缺口</th><th style={{ width: 160 }}>操作</th></tr></thead>
            <tbody>
              {byProject.map(([pid, cs]) => {
                const proj = PROJECTS.find((p) => p.id === pid);
                // 除零防护：certNeed 可能为 0（未预判需求）→ 兜底为 1，避免 0/0 = NaN 让进度条失效
                const quota = Math.max(1, (proj as any)?.certNeed ?? cs.length);
                const gap = Math.max(0, quota - cs.length);
                const equipRate = Math.min(100, (cs.length / quota) * 100);
                return (
                  <tr key={pid}>
                    <td><b>{proj?.name ?? pid}</b><div className="nc-cell-sub"><EntityLink target="project-center" id={pid} go={go} title="下钻到项目详情"><Code>{pid}</Code></EntityLink></div></td>
                    <td>{cs.map((c) => <div key={c.id} className="nc-cell-sub">{c.name} · {c.holder}</div>)}</td>
                    <td><Progress value={equipRate} tone={gap ? 'red' : 'green'} /><span className="nc-cell-sub num">{cs.length}/{quota}</span></td>
                    <td>{gap ? <Tag tone="red">缺口 {gap}</Tag> : <Tag tone="green">已齐备</Tag>}</td>
                    <td><div className="nc-ops">
                      <Op onClick={() => { setFocus('project-center', pid); go('project-center'); }}>经营中心</Op>
                      <OpSep />
                      <Op gold onClick={() => toast('项目证书需求已按行业映射表重新预判')}>重算需求</Op>
                      <OpSep />
                      <OpMore items={[{ label: '导出配备清单', onClick: () => toast('已导出该项目证书配备清单（演示）') }]} />
                    </div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* ================ 详情抽屉 ================ */}
      <Drawer
        open={!!detail} onClose={() => setDetail(null)} width={800}
        title={<span>{detail?.name} {detail && <Code>{detail.id}</Code>}</span>}
        sub={detail && <>{detail.issue} · 持有人 {detail.holder} · 有效期至 {detail.validTo}</>}
        foot={detail && (
          <div className="nc-ops">
            {canLend(detail) && <Btn kind="primary" size="sm" onClick={() => { setLendOpen(detail); setLendProj(firstProj); setLendNote(''); setLendErr(''); setLendPurpose(PURPOSES[0]); setDetail(null); }}>借给项目</Btn>}
            {!!detail.used.length && <Btn size="sm" onClick={() => patchCert(detail.id, { used: [] }, `已「用完收回」· 释放 ${detail.used.length} 个名额并留痕`)}>用完收回</Btn>}
            {detail.mode === 'log' && <Btn size="sm" kind="primary" onClick={() => { setUseOpen(detail); setUsePerson(''); setDetail(null); }}>登记使用</Btn>}
            <Btn size="sm" onClick={() => { setOutOpen(detail); setOutUnit(''); setOutFrom(TODAY); setOutTo(''); setOutErr(''); setDetail(null); }}>外借</Btn>
            {!!detail.used.length && <Btn size="sm" onClick={() => { setRbTo(''); setRbErr(''); setRenewBorrowOpen(detail); }}>续借</Btn>}
            <Btn size="sm" onClick={() => { setRenewOpen(detail); setRenewPeriod(''); setRenewTo(''); setRenewErr(''); setDetail(null); }}>续证安排</Btn>
          </div>
        )}
      >
        {detail && (
          <>
            {detail.validTo < TODAY && <Alert tone="danger" icon={<Ico n="ban" size={16} />} title="证书已过期" sub="到期后禁用投标 / 派单 / 借用；借出与投标将被硬拦截（安许过期 = 全部投标废标）。" />}
            {detail.isBuilder && <BuilderCheck name={detail.holder} cert={detail} />}

            <KvGrid cols={2} rows={[
              { k: '证书编号', v: <Code>{detail.id}</Code> },
              { k: '证书类型', v: `${detail.type} · ${detail.subType}` },
              {
                k: '证书归属',
                v: isCompany(detail)
                  ? <span style={{ color: 'var(--c-warning-deep)' }}>公司证书 · 由保管人负责，可外借投标 / 履约</span>
                  : <span>个人证书 · 登记到员工名下，可设置持证补贴</span>,
              },
              { k: isCompany(detail) ? '保管人' : '持有人', v: isCompany(detail) ? custodianOf(detail) : detail.holder },
              { k: '发证机关', v: detail.issue },
              {
                k: '有效期至',
                v: isLongTerm(detail)
                  ? <Tag tone="green">长期有效 · 不设到期日</Tag>
                  : <span className={validTone(detail.validTo)}>{detail.validTo}（剩 {daysLeft(detail.validTo)} 天）</span>,
              },
              { k: '到期提前提醒', v: isLongTerm(detail) ? '—' : `提前 ${remindOf(detail)} 天` },
              ...(isCompany(detail) ? [] : [{
                k: '持证补贴',
                v: (() => {
                  const s = subsidyOf(detail);
                  return s.mode === 'none' || !s.amount
                    ? <span className="nc-muted">无补贴</span>
                    : <>{fmt(s.amount)} / {SUB_UNIT[s.mode]} · {SUB_LABEL[s.mode]} · 起算 {s.start || '—'}
                      <div className="nc-cell-sub">年化成本 {fmt(yearCost(detail))}{onceThisYear(detail) ? ` · 本年度到期一次性 ${fmt(onceThisYear(detail))}` : ''}</div></>;
                })(),
              }]),
              { k: '并行占用上限', v: detail.cap === 99 ? '不限（公司资质）' : `${detail.cap} 个项目` },
              { k: '占用方式', v: <Tag tone={MODE_TONE[detail.mode]}>{MODE_LABEL[detail.mode]}</Tag> },
              { k: '语义', v: MODE_DESC[detail.mode] },
              { k: '状态', v: <Tag tone={detail.status === '正常' ? 'green' : detail.status === '已过期' ? 'red' : 'orange'}>{detail.status}</Tag> },
              { k: '最近跟进', v: '2026-09-15 · 行政 · 已核对扫描件' },
            ]} />

            <div className="nc-sec-title">并行引用面板（挂在哪些投标 / 项目）</div>
            <div className="nc-warnbox">
              <div className="nc-warnbox-hd">当前占用 {detail.used.length}/{detail.cap === 99 ? '∞' : detail.cap}</div>
              {detail.used.length ? (
                <table className="nc-tbl" style={{ minWidth: 520 }}>
                  <thead><tr><th>占用对象</th><th style={{ width: 110 }}>类型</th><th style={{ width: 120 }}>占用自</th><th style={{ width: 80 }}>操作</th></tr></thead>
                  <tbody>
                    {detail.used.map((u) => (
                      <tr key={u}>
                        <td>{u.startsWith('XM') ? <EntityLink target="project-center" id={u} go={go} title="下钻到项目详情">{PROJECTS.find((p) => p.id === u)?.name ?? u}</EntityLink> : <EntityLink target="bid" id={u} go={go} title="下钻到投标详情">{u}</EntityLink>} <Code>{u}</Code></td>
                        <td><Tag tone={u.startsWith('XM') ? 'green' : 'blue'}>{u.startsWith('XM') ? '项目' : '投标'}</Tag></td>
                        <td className="nc-cell-sub">2026-09-01</td>
                        <td><Op danger onClick={() => setFreeOpen(u)}>释放</Op></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : <div>/ 当前无占用</div>}
            </div>

            <div className="nc-sec-title">借出归还 / 外借记录</div>
            <Timeline items={[
              { date: '2026-09-01', text: `借给项目 XM000123 昆明万达广场消防改造（借走后仅该项目可用）`, tone: 'ok' },
              { date: '2026-09-08', text: `借给项目 XM000105 曲靖万达广场消防维护保养`, tone: 'ok' },
              { date: '2026-08-20', text: `外借至 云南××消防工程有限公司（外借期间本司项目不可用）`, tone: 'gold' },
              { date: '2026-08-28', text: `收回外借（本司项目恢复可用）`, tone: 'ok' },
            ]} />

            <div className="nc-sec-title">提额记录</div>
            <div className="nc-warnbox">提额 1 次 · 2026-08-12 由 2 → 3 个项目 · 理由「年度指标冲刺，并行投标需求」 · 审批：分管副总</div>

            <div className="nc-sec-title">续期历史</div>
            <div className="nc-warnbox">2025-10-18 完成「续证安排」· 延续注册至 {detail.validTo} · 依据《注册消防工程师管理规定》</div>

            <div className="nc-sec-title">
              附件（{attachOf(detail).length}）
              <span className="nc-hint" style={{ fontWeight: 400, marginLeft: 8 }}>扫描件 / 受理单 / 延续注册材料 · 用于年审与投标资格审查</span>
            </div>
            {attachOf(detail).length ? (
              <div>
                {attachOf(detail).map((f, i) => (
                  <span className="nc-filechip" key={`${f.name}-${i}`}>
                    <b>{f.name}</b>
                    <span className="nc-cell-sub">{f.size} KB · {f.at}</span>
                    <Op onClick={() => toast(`已下载「${f.name}」`)}>下载</Op>
                  </span>
                ))}
                <div style={{ marginTop: 8 }}>
                  <Btn size="sm" onClick={() => toast('已上传附件：证书扫描件-补充.pdf（演示）')}>＋ 添加附件</Btn>
                </div>
              </div>
            ) : <div className="nc-empty-mini">暂无附件 · 建议上传证书扫描件以便投标资格审查</div>}

            <div className="nc-sec-title">业绩库入口</div>
            <div className="nc-warnbox">本证书支撑业绩 4 项 · <Op onClick={() => go('project')}>查看业绩库 →</Op></div>
          </>
        )}
      </Drawer>

      {/* ================ 借给项目 ================ */}
      <Modal
        open={!!lendOpen} onClose={() => setLendOpen(null)} width={480} title={`借给项目 · ${lendOpen?.name ?? ''}`}
        foot={<><Btn onClick={() => setLendOpen(null)}>取消</Btn><Btn kind="primary" disabled={!canLend(lendOpen)} onClick={() => {
          if (lendOpen && lendOpen.validTo < TODAY) { toast(' 证书已过期，不可借出'); return; }
          if (lendOpen && lendOpen.mode === 'single' && lendOpen.used.length >= lendOpen.cap) { toast(`已达并行占用上限（${lendOpen.used.length}/${lendOpen.cap}），请先申请提额`); return; }
          if (!lendPurpose) { setLendErr('请选择借用用途'); return; }
          setLendErr('');
          if (!lendOpen) return;
          patchCert(lendOpen.id, { used: [...lendOpen.used, lendProj] },
            `已借给项目 ${lendProj} · 用途「${lendPurpose}」· 借走后仅该项目可用 · 并行占用 ${lendOpen.used.length + 1}/${lendOpen.cap === 99 ? '∞' : lendOpen.cap}`);
          setLendOpen(null);
        }}>确认借出</Btn></>}>
        {lendOpen && (
          <>
            <Banner tone={canLend(lendOpen) ? 'info' : 'warn'}>{lendWhy(lendOpen) || '标准用语：借给项目 / 用完收回（禁用「分配 / 回收」）；借走后仅该项目可用。'}</Banner>
            <div className="nc-form-grid">
              <Field label="选择项目" req span={2}>
                <ProjectPicker value={lendProj} onChange={setLendProj} />
              </Field>
              <Field label="借用用途" req err={lendErr || undefined} note="用于借还留痕与责任追溯">
                <select className="nc-input" value={lendPurpose} onChange={(e) => { setLendPurpose(e.target.value); setLendErr(''); }}>
                  {PURPOSES.map((p) => <option key={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="借出日期" req><input className="nc-input" type="date" defaultValue={TODAY} /></Field>
              <Field label="预计归还"><input className="nc-input" type="date" /></Field>
              <Field label="备注" span={2}><input className="nc-input" value={lendNote} onChange={(e) => setLendNote(e.target.value)} placeholder="例：投标使用，开标后收回" /></Field>
            </div>
            <div className="nc-warnbox">占用方式：<Tag tone={MODE_TONE[lendOpen.mode]}>{MODE_LABEL[lendOpen.mode]}</Tag> · 当前占用 {lendOpen.used.length}/{lendOpen.cap === 99 ? '∞' : lendOpen.cap} · 借出后并行占用 +1 并留痕</div>
          </>
        )}
      </Modal>

      {/* ================ 登记使用 ================ */}
      <Modal
        open={!!useOpen} onClose={() => setUseOpen(null)} width={480} title={`登记使用 · ${useOpen?.name ?? ''}`}
        foot={<><Btn onClick={() => setUseOpen(null)}>取消</Btn><Btn kind="primary" onClick={() => {
          if (!usePerson.trim()) { toast('请输入使用人（按次登记必填）'); return; }
          if (!useOpen) return;
          patchCert(useOpen.id, {}, `已登记使用：${usePerson} · 用于 ${useProj}（按次登记类不占并行额度，仅留痕）`);
          setUseOpen(null);
        }}>确认登记</Btn></>}>
        <Banner tone="info"><Ico n="check" size={16} /> 按次登记类证书：<b>不占用</b>并行额度，只记录「用在哪个项目 / 谁使用」。标准用语「登记使用」（禁用旧词「报备」）。</Banner>
        <div className="nc-form-grid">
          <Field label="使用人" req err={!usePerson ? undefined : undefined} note="必填 · 用于安全交底与责任追溯">
            <input className="nc-input" value={usePerson} onChange={(e) => setUsePerson(e.target.value)} placeholder="请输入使用人" />
          </Field>
          <Field label="使用项目" req>
            <ProjectPicker value={useProj} onChange={setUseProj} />
          </Field>
          <Field label="使用日期" req><input className="nc-input" type="date" defaultValue={TODAY} /></Field>
          <Field label="工作内容"><input className="nc-input" placeholder="例：报警系统接线调试" /></Field>
        </div>
      </Modal>

      {/* ================ 外借 ================ */}
      <Modal
        open={!!outOpen} onClose={() => setOutOpen(null)} width={480} title={`外借 · ${outOpen?.name ?? ''}`}
        foot={<><Btn onClick={() => setOutOpen(null)}>取消</Btn><Btn kind="primary" onClick={() => {
          if (!outUnit.trim()) { setOutErr('借用单位必填'); return; }
          if (outTo && outTo < outFrom) { setOutErr(' 归还日期不得早于借出日期（周期校验拦截）'); return; }
          setOutErr('');
          if (!outOpen) return;
          pushApproval({
            id: nextApprovalNo(),
            ap: '蓝峰', type: '证书外借',
            obj: `${outOpen.name} 外借至 ${outUnit}`,
            ref: `${outOpen.id} 证书外借`,
            amt: 0, time: `${TODAY} ${new Date().toTimeString().slice(0, 5)}`,
            status: '待审批', level: '部门负责人', node: 1, reason: '', cc: [],
          } as never);
          toast('已提交外借审批 · 审批通过后证书标记为「已外借」');
          setOutOpen(null);
        }}>确认外借</Btn></>}>
        <Banner tone="warn">外借期间<b>本司项目不可用</b>。标准用语「外借 / 收回外借」（禁用旧词「挂靠 / 退挂」）。</Banner>
        <div className="nc-form-grid">
          <Field label="借用单位" req span={2} err={outErr.startsWith('借用单位') ? outErr : undefined}>
            <input className="nc-input" value={outUnit} onChange={(e) => setOutUnit(e.target.value)} placeholder="例：云南××消防工程有限公司" />
          </Field>
          <Field label="外借起" req><input className="nc-input" type="date" value={outFrom} onChange={(e) => setOutFrom(e.target.value)} /></Field>
          <Field label="外借止" req err={outErr.startsWith('') ? outErr : undefined}><input className="nc-input" type="date" value={outTo} onChange={(e) => setOutTo(e.target.value)} /></Field>
          <Field label="外借费用"><input className="nc-input" type="number" placeholder="元 / 月" /></Field>
          <Field label="审批人"><select className="nc-input"><option>分管副总</option><option>总经理</option></select></Field>
        </div>
      </Modal>

      {/* ================ 续证安排 ================ */}
      <Drawer
        open={!!renewOpen} onClose={() => setRenewOpen(null)} width={640} title={`续证安排 · ${renewOpen?.name ?? ''}`}
        foot={<><Btn onClick={() => setRenewOpen(null)}>取消</Btn><Btn kind="primary" onClick={() => {
          if (!renewOpen) return;
          if (!renewPeriod.trim() || !renewTo) { setRenewErr('周期起止必填'); return; }
          if (renewTo < renewPeriod) { setRenewErr(' 周期止不得早于周期起（硬拦截）'); return; }
          setRenewErr('');
          /* 「周期止」就是新的有效期止 —— 必须回写证书台账。
             只 toast 不落库的话，列表上的「有效期至」永远不动、预警档位也不重算，
             续证这个动作等于没发生，投标页仍按旧日期硬拦截。 */
          renewCert(renewOpen.id, renewTo);
          toast(`续证安排已登记 · ${renewOpen.name} 有效期延至 ${renewTo}（预警档位已重算）`);
          setRenewOpen(null);
        }}>登记续证安排</Btn></>}>
        <Banner tone="info">标准用语「<b>续证安排</b>」（禁用旧词「换证计划」）：复审 · 延续注册 · 换证的待办，<b>临近 7 天二次提醒</b>。</Banner>
        <div className="nc-form-grid">
          <Field label="续证类型" req><select className="nc-input"><option>延续注册</option><option>复审</option><option>换证</option></select></Field>
          <Field label="当前有效期至"><input className="nc-input" value={renewOpen?.validTo ?? ''} readOnly /></Field>
          <Field label="周期起" req err={renewErr.startsWith('周期起止') ? renewErr : undefined}><input className="nc-input" type="date" value={renewPeriod} onChange={(e) => setRenewPeriod(e.target.value)} /></Field>
          <Field label="周期止" req err={renewErr.startsWith('') ? renewErr : undefined}><input className="nc-input" type="date" value={renewTo} onChange={(e) => setRenewTo(e.target.value)} /></Field>
          <Field label="责任人" req><select className="nc-input"><option>行政</option><option>证书管理员</option></select></Field>
          <Field label="预计费用"><input className="nc-input" type="number" placeholder="元" /></Field>
          <Field label="备注" span={2}><input className="nc-input" placeholder="例：需提前 30 天提交延续注册材料" /></Field>
        </div>
      </Drawer>

      {/* ================ 续借 ================ */}
      <Modal
        open={!!renewBorrowOpen} onClose={() => setRenewBorrowOpen(null)} width={480} title={`续借 · ${renewBorrowOpen?.name ?? ''}`}
        foot={<><Btn onClick={() => setRenewBorrowOpen(null)}>取消</Btn><Btn kind="primary" onClick={() => {
          if (!rbTo) { setRbErr('请填写续借后归还日期'); return; }
          if (rbTo <= TODAY) { setRbErr(' 续借归还日期须晚于今天（周期校验拦截）'); return; }
          setRbErr('');
          toast(`已续借至 ${rbTo} · 原占用保持不变并留痕`);
          setRenewBorrowOpen(null);
        }}>确认续借</Btn></>}>
        <Banner tone="info">续借用于延长已借出证书的占用周期：<b>不改变并行占用数</b>，仅更新归还日期并留痕。</Banner>
        {renewBorrowOpen && (
          <>
            <div className="nc-warnbox">
              <div className="nc-warnbox-hd">当前借用</div>
              占用对象 {renewBorrowOpen.used.join('、') || '—'} · 占用 {renewBorrowOpen.used.length}/{renewBorrowOpen.cap === 99 ? '∞' : renewBorrowOpen.cap}
            </div>
            <div className="nc-form-grid" style={{ marginTop: 12 }}>
              <Field label="续借后归还日期" req err={rbErr || undefined}>
                <input className="nc-input" type="date" value={rbTo} onChange={(e) => { setRbTo(e.target.value); setRbErr(''); }} />
              </Field>
              <Field label="续借次数上限" note="同一借出最多续借 2 次">
                <input className="nc-input is-locked" readOnly value="已续借 0 / 2 次" />
              </Field>
              <Field label="续借理由" span={2}><input className="nc-input" placeholder="例：项目竣工验收延期，需继续配备" /></Field>
            </div>
          </>
        )}
      </Modal>

      {/* ================ 新增证书 ================ */}
      <Drawer
        open={newOpen} onClose={() => setNewOpen(false)} width={840} title="新增证书"
        foot={<>
          <Btn onClick={() => setRecogOpen(true)}><Ico n="camera" size={16} /> 从证书照片识别</Btn>
          <Btn kind="primary" onClick={saveNewCert}>保存</Btn>
        </>}>
        {ocrTip && <Banner tone="warn">已按照片识别预填，请<b>逐项核对后保存</b>（识别置信度低于 90% 的字段将以黄底标出）。</Banner>}
        <div className="nc-form-grid">
          <Field label="证书名称" req span={2}>
            <input className="nc-input" value={nName} onChange={(e) => setNName(e.target.value)} placeholder="例：一级注册消防工程师" />
          </Field>
          <Field label="专业 / 子类" req note="子类决定归属类型与占用方式，选完自动带出">
            <select className="nc-input" value={nSubType} onChange={(e) => pickSubType(e.target.value)}>
              {CERT_SUBTYPES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="证书归属" req note="归属创建后不可修改，如需变更请注销后重新创建">
            <select className="nc-input" value={nOwnerType} onChange={(e) => setNOwnerType(e.target.value as '人员证书' | '企业资质')}>
              <option value="人员证书">个人证书（登记到员工名下，可设持证补贴）</option>
              <option value="企业资质">公司证书（由保管人负责，可外借投标 / 履约）</option>
            </select>
          </Field>
          <Field label={nOwnerType === '企业资质' ? '保管人' : '持有人'} req>
            <input className="nc-input" value={nHolder} onChange={(e) => setNHolder(e.target.value)}
              placeholder={nOwnerType === '企业资质' ? '例：诺盾博达消防科技有限公司' : '例：张工'} />
          </Field>
          <Field label="证书编号" req note="业务唯一键，用于判断是否与台账已有证书重复">
            <input className="nc-input" value={nCertNo} onChange={(e) => setNCertNo(e.target.value)} placeholder="例：XF1012025000431" />
          </Field>
          <Field label="有效期至" req note={nLongTerm ? '已勾选长期有效，无需填写' : undefined}>
            <input className="nc-input" type="date" value={nValidTo} disabled={nLongTerm} onChange={(e) => setNValidTo(e.target.value)} />
          </Field>
          <Field label="到期提前提醒" note="临近提醒天数">
            <select className="nc-input" value={nRemind} onChange={(e) => setNRemind(e.target.value)} disabled={nLongTerm}>
              <option value="7">7 天</option><option value="15">15 天</option><option value="30">30 天</option><option value="60">60 天</option><option value="90">90 天</option>
            </select>
          </Field>
          <Field label="长期有效" span={2}>
            <Check checked={nLongTerm} onChange={(v) => { setNLongTerm(v); if (v) setNValidTo(''); }}
              label="长期有效（不设到期日 · 如消防设施操作员职业资格证书）" />
          </Field>
          <Field label="发证机关" req>
            <input className="nc-input" list="nc-cert-issuers" value={nIssue} onChange={(e) => setNIssue(e.target.value)} placeholder="例：住建部 / 云南省消防救援总队" />
          </Field>
          <Field label="证书扫描件（正反面）" note="必传：证书正面+反面照片，用于核验证书真伪"><input className="nc-input" type="file" /></Field>
          {nOwnerType === '人员证书' && (
            <>
              <div className="nc-sec-title" style={{ gridColumn: '1 / -1', margin: '4px 0 0' }}>
                持证补贴（选填，发放给持有人）
              </div>
              <Field label="补贴模式">
                <select className="nc-input" value={nSubMode} onChange={(e) => setNSubMode(e.target.value as SubMode)}>
                  {(Object.keys(SUB_LABEL) as SubMode[]).map((m) => <option key={m} value={m}>{SUB_LABEL[m]}</option>)}
                </select>
              </Field>
              <Field label="补贴年化成本" note="月度 ×12 + 年度；一次性按证书到期年计入">
                <div className="nc-dnote">
                  {nSubMode === 'none' || !nSubAmt ? '—' : nSubMode === 'monthly' ? `${fmt(nSubAmt * 12)} / 年` : nSubMode === 'yearly' ? `${fmt(nSubAmt)} / 年` : `一次性 ${fmt(nSubAmt)}（到期年计入）`}
                </div>
              </Field>
              {nSubMode !== 'none' && (
                <>
                  <Field label="补贴金额（元）" req><input className="nc-input" type="number" min={0} value={nSubAmt || ''} onChange={(e) => setNSubAmt(Number(e.target.value))} placeholder="如：3000" /></Field>
                  <Field label="起算日期" req><input className="nc-input" type="date" value={nSubStart} onChange={(e) => setNSubStart(e.target.value)} /></Field>
                </>
              )}
            </>
          )}
          <Field label="占用方式" req span={2} note="一证一项目 = 法定独占；多项目引用 = 公司资质；按次登记 = 不占用">
            <select className="nc-input" value={nMode} onChange={(e) => setNMode(e.target.value as 'single' | 'multi' | 'log')}>
              <option value="single">一证一项目（single）</option>
              <option value="multi">多项目引用（multi）</option>
              <option value="log">按次登记（log）</option>
            </select>
          </Field>
          <Field label="并行占用上限" req>
            <input className="nc-input" type="number" min={1} value={nCap} onChange={(e) => setNCap(Math.max(1, Number(e.target.value) || 1))} />
          </Field>
          <Field label="资质页扫描件" note="选传：资质认定页/附表扫描件，用于补充资质信息"><input className="nc-input" type="file" /></Field>
        </div>
        {/* 发证机关候选（input list 用，不占布局） */}
        <datalist id="nc-cert-issuers">{CERT_ISSUERS.map((s) => <option key={s} value={s} />)}</datalist>
      </Drawer>

      {/* 证书照片识别 → 识别工作台 */}
      <RecognitionWorkbench
        open={recogOpen}
        onClose={() => setRecogOpen(false)}
        title="证书信息识别"
        fields={CERT_RECOG_FIELDS}
        onConfirm={onCertRecog}
      />

      {/* ================ 批量导入证书（选文件 → 核对 → 批量入库） ================ */}
      <Modal open={impOpen} onClose={() => setImpOpen(false)} width={impStep === 'pick' ? 720 : 1180}
        title={impStep === 'pick' ? '批量导入证书 · 选择文件' : '批量导入证书 · 核对'}
        foot={impStep === 'pick' ? (
          <>
            <Btn onClick={() => setImpOpen(false)}>取消</Btn>
            <Btn kind="primary" disabled={!impText.trim()} onClick={() => {
              try {
                const g = parseCertGrid(parseDelimited(impText), '粘贴内容');
                acceptDrafts(g.drafts, g.warns);
              } catch (e) { setImpErr(e instanceof Error ? e.message : '解析失败，请确认表格内容'); }
            }}>
              <Ico n="check" size={16} /> 解析粘贴内容
            </Btn>
          </>
        ) : (
          <>
            <Btn onClick={() => setImpStep('pick')}>返回上一步</Btn>
            <Btn kind="primary" onClick={doImport}>
              <Ico n="check" size={16} /> 确认入库（{impStat.on} 条）
            </Btn>
          </>
        )}>

        {/* ---------- 第一步：选文件 ---------- */}
        {impStep === 'pick' && (
          <>
            <Banner tone="info">
              支持 <b>证书台账表</b>（.xlsx / .csv）与 <b>证书照片 / 扫描件</b>（.png / .jpg / .pdf 等）；
              一次可以选多个文件，也可以在 Excel 里框选整块 <b>Ctrl+C</b> 粘到下面的框里。
            </Banner>
            <div
              className={`nc-dropzone${impDrag ? ' is-drag' : ''}`}
              onClick={() => impFileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setImpDrag(true); }}
              onDragLeave={() => setImpDrag(false)}
              onDrop={(e) => { e.preventDefault(); setImpDrag(false); void onPickFiles(Array.from(e.dataTransfer.files ?? [])); }}
            >
              <Ico n="upload" size={16} /> {impBusy ? '正在解析 / 识别…' : '点击选择文件，或把文件拖到这里'}
              <div className="nc-cell-sub">表格 .xlsx / .xlsm / .csv / .txt · 照片 .png / .jpg / .webp / .pdf · 可多选</div>
              <input ref={impFileRef} type="file" multiple
                accept=".xlsx,.xlsm,.csv,.txt,.png,.jpg,.jpeg,.webp,.bmp,.gif,.pdf" style={{ display: 'none' }}
                onChange={(e) => { void onPickFiles(Array.from(e.target.files ?? [])); e.target.value = ''; }} />
            </div>
            {impNames.length > 0 && !impErr && (
              <div className="nc-cell-sub" style={{ marginTop: -4 }}>已选 {impNames.length} 个文件：{impNames.join('、')}</div>
            )}

            <Field label="或粘贴表格内容" span={2}>
              <textarea className="nc-input" rows={5} value={impText}
                placeholder="在 Excel 里选中「证书名称 / 证书编号 / 专业子类 / 持证人 / 发证机关 / 有效期至」整块，Ctrl+C 后粘到这里"
                onChange={(e) => setImpText(e.target.value)} />
            </Field>
            {impErr && <Banner tone="danger">{impErr}</Banner>}

            <div className="nc-sec-title" style={{ margin: '14px 0 8px' }}>台账表格式（表头按名称自动识别，列的顺序随意）</div>
            <table className="nc-tbl" style={{ minWidth: 560 }}>
              <thead><tr><th style={{ width: 150 }}>列名</th><th style={{ width: 76 }}>必填</th><th>说明</th></tr></thead>
              <tbody>
                <tr><td>证书名称</td><td><Tag tone="red">必填</Tag></td><td>表头里必须有这一列，否则认不出是证书台账</td></tr>
                <tr><td>证书编号</td><td><Tag tone="red">必填</Tag></td><td>业务唯一键 —— 靠它判断是否与台账已有证书重复</td></tr>
                <tr><td>专业子类</td><td><Tag tone="red">必填</Tag></td><td>可写完整证书名（如「消防设施工程专业承包（二级）」），系统会收敛到 10 个子类</td></tr>
                <tr><td>持证人 / 持有人</td><td><Tag tone="red">必填</Tag></td><td>人员证书填人名；企业资质填公司名</td></tr>
                <tr><td>发证机关</td><td>选填</td><td>如 住建部 / 云南省住建厅 / 应急管理部</td></tr>
                <tr><td>有效期至</td><td><Tag tone="red">必填</Tag></td><td>支持 2027-06-30 / 2027/6/30 / 2027年6月30日；长期有效写「长期」</td></tr>
                <tr><td>占用方式 / 并行上限</td><td>选填</td><td>不填则按子类自动带出（一证一项目 / 多项目引用 / 按次登记）</td></tr>
              </tbody>
            </table>
            <div className="nc-listhint" style={{ marginTop: 10 }}>
              <span>照片识别<Tip w={350} text="上传证书照片或扫描件，系统识别出证书名称、编号、持证人、发证机关与有效期。识别置信度低于 90% 的字段会在核对清单里标黄，需要你对照原件确认后再入库。" /></span>
            </div>
            <div className="nc-cell-sub" style={{ marginTop: 6 }}>
              标题行、说明行、空行都可以有多余的；同一次可以混传表格与照片，系统按文件类型分别处理。
            </div>
          </>
        )}

        {/* ---------- 第二步：核对 ---------- */}
        {impStep === 'check' && (
          <>
            <Banner tone="info">
              共读到 <b>{impDrafts.length}</b> 条证书，已勾选 <b>{impStat.on}</b> 条准备入库。
              标黄的是识别置信度低的字段，标红的是必填未填；<b>必填不全或与台账重复的默认不勾选</b>，
              补全 / 确认后再手工勾上。
            </Banner>
            {impSkip.map((s, i) => <Banner key={i} tone="warn">{s}</Banner>)}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '12px 0 4px' }}>
              <span className="nc-ltlbl" style={{ width: 'auto' }}>核对结果</span>
              <Tag tone="blue">待入库 {impStat.on} 条</Tag>
              {impStat.off > 0 && <Tag tone="gray">未勾选 {impStat.off} 条</Tag>}
              {impStat.dup > 0 && <Tag tone="orange">与台账重复 {impStat.dup} 条</Tag>}
              {impStat.needFix > 0 && <Tag tone="red">待补全 {impStat.needFix} 条（默认未勾选）</Tag>}
              {impStat.lowConf > 0 && <Tag tone="gold">识别置信度低 {impStat.lowConf} 条</Tag>}
              <span style={{ flex: 1 }} />
              <Btn size="sm" onClick={() => setImpOn(impDrafts.map(() => true))}>全选</Btn>
              <Btn size="sm" onClick={() => setImpOn(impDrafts.map(() => false))}>全不选</Btn>
            </div>

            <div className="nc-atd-wrap" style={{ maxHeight: 380 }}>
              <table className="nc-tbl nc-atd-tbl" style={{ minWidth: 1240 }}>
                <thead>
                  <tr>
                    <th style={{ width: 44 }} className="is-center">入库</th>
                    <th style={{ width: 150 }}>来源</th>
                    <th style={{ width: 200 }}>证书名称</th>
                    <th style={{ width: 200 }}>证书编号</th>
                    <th style={{ width: 132 }}>专业子类</th>
                    <th style={{ width: 116 }}>持证人</th>
                    <th style={{ width: 156 }}>发证机关</th>
                    <th style={{ width: 152 }}>有效期至</th>
                    <th style={{ width: 128 }}>归属 / 占用</th>
                    <th>提示</th>
                  </tr>
                </thead>
                <tbody>
                  {impDrafts.map((d, i) => {
                    const miss = impBlock(d);
                    const bad = (f: CertField) => d.bad[f];
                    const low = (f: CertField) => (d.conf[f] ?? 1) < CONF_LOW;
                    const lowTip = (f: CertField) => (low(f)
                      ? `识别置信度 ${Math.round((d.conf[f] ?? 0) * 100)}%（${CERT_FIELD_CN[f]}），请对照原件确认` : undefined);
                    return (
                      <tr key={i} style={impOn[i] ? undefined : { opacity: 0.5 }}>
                        <td className="is-center">
                          <Check checked={!!impOn[i]} onChange={(v) => setImpOn((a) => a.map((x, k) => (k === i ? v : x)))} />
                        </td>
                        <td className="nc-cell-sub">{d.src}</td>
                        <td style={lowIf(low('name'))} title={lowTip('name')}>
                          <input className="nc-input" value={d.name} onChange={(e) => patchDraft(i, { name: e.target.value })} />
                        </td>
                        <td style={lowIf(low('certNo') || !!bad('certNo'))} title={lowTip('certNo')}>
                          <input className="nc-input" value={d.certNo}
                            placeholder={bad('certNo') ? `未识别（${bad('certNo')}）` : '必填'}
                            onChange={(e) => patchDraft(i, { certNo: e.target.value })} />
                        </td>
                        <td style={lowIf(low('subType') || !!bad('subType'))} title={lowTip('subType')}>
                          <select className="nc-input" value={d.subType} onChange={(e) => patchDraft(i, { subType: e.target.value })}>
                            <option value="">请选择</option>
                            {CERT_SUBTYPES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td style={lowIf(low('holder') || !!bad('holder'))} title={lowTip('holder')}>
                          <input className="nc-input" value={d.holder} onChange={(e) => patchDraft(i, { holder: e.target.value })} />
                        </td>
                        <td style={lowIf(low('issue') || !!bad('issue'))} title={lowTip('issue')}>
                          <input className="nc-input" list="nc-cert-issuers" value={d.issue}
                            onChange={(e) => patchDraft(i, { issue: e.target.value })} />
                        </td>
                        <td style={lowIf(low('validTo') || !!bad('validTo'))} title={lowTip('validTo')}>
                          <input className="nc-input" type="date" value={d.validTo} disabled={d.longTerm}
                            onChange={(e) => patchDraft(i, { validTo: e.target.value })} />
                          <Check checked={d.longTerm} label="长期有效"
                            onChange={(v) => patchDraft(i, { longTerm: v, validTo: v ? '' : d.validTo })} />
                        </td>
                        <td className="nc-cell-sub">
                          {d.subType
                            ? <>{ownerOf(d.subType)}<div>{MODE_LABEL[modeOf(d)]} · {capOf(d) === 99 ? '∞' : capOf(d)}</div></>
                            : '—'}
                        </td>
                        <td>
                          {impDup[i] && <Tag tone="orange">与台账重复</Tag>}
                          {miss.length > 0 && <Tag tone="red">缺 {miss.join(' / ')}</Tag>}
                          {d.warns.map((w, k) => (
                            <div key={k} className="nc-cell-sub" style={{ marginTop: 2 }}>{w}</div>
                          ))}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="nc-listhint" style={{ marginTop: 10 }}>
              <span>入库口径<Tip w={360} text="归属类型（人员证书 / 企业资质）、占用方式与并行上限都由「专业子类」自动带出；有效期为空且勾了「长期有效」的证书不计入临期提醒。与台账已有编号重复的默认不勾选，确认要覆盖历史记录时才手工勾上。" /></span>
            </div>
          </>
        )}
      </Modal>

      {/* ============ 解除证书占用（评审 I1：二次确认 + 原因必填） ============ */}
      <ConfirmModal
        open={!!freeOpen} onClose={() => setFreeOpen(null)} okText="确认释放"
        title="解除证书占用"
        reason reasonLabel="解除原因"
        impact={freeOpen && <>将解除证书 <b>{detail?.name}</b>（{detail?.id}）对 <b>{freeOpen}</b> 的占用。<br />释放后该对象的<b>投标资格校验 / 项目证书校验将立即失败</b>（如建造师三要素缺项），且名额可被其他投标或项目抢占。</>}
        onOk={(r) => { toast(`已解除占用（${freeOpen}）并留痕，原因：${r}`); setFreeOpen(null); }}
      />

      <ExportDialog {...exportApi.dialogProps} />

      {/* 项8：一键生成证书报告（mock：封面 + 证书清单 + 统计摘要，不接真实 PDF 引擎） */}
      <Modal open={reportOpen} onClose={() => setReportOpen(false)} size="L" title="生成证书报告"
        foot={<><Btn onClick={() => setReportOpen(false)}>取消</Btn>
          <Btn kind="primary" disabled={!reportSel.length} onClick={genReport}>
            <Ico n="file" size={16} /> 生成报告（已选 {reportSel.length} 本 · {reportFmt.toUpperCase()}）
          </Btn></>}>
        <div className="nc-export-dialog">
          {/* ① 证书范围 */}
          <div className="nc-export-block">
            <div className="nc-export-block-title">① 证书范围<span className="nc-export-block-ops">
              <Btn kind="link" size="sm" onClick={() => setReportIds(reportList.map((c) => c.id))}>勾选本类</Btn>
              <Btn kind="link" size="sm" onClick={() => setReportIds([])}>清空</Btn>
            </span></div>
            <div className="nc-export-chips" style={{ marginBottom: 8 }}>
              <span className="nc-export-chip-label">大类过滤：</span>
              {CERT_CATS.map((c) => (
                <button key={c.key} type="button" className={`nc-fchip${reportCat === c.key ? ' is-on' : ''}`} onClick={() => setReportCat(c.key)}>{c.label}</button>
              ))}
              <span className="nc-cell-sub" style={{ marginLeft: 8 }}>已选 {reportSel.length}/{certs.length}</span>
            </div>
            <div style={{ maxHeight: 200, overflow: 'auto', border: '1px solid var(--c-border,#e5e6eb)', borderRadius: 6, padding: 8 }}>
              {reportList.length === 0 && <div className="nc-cell-sub" style={{ padding: 8 }}>该大类下暂无证书</div>}
              {reportList.map((c) => (
                <div key={c.id} style={{ padding: '1px 0' }}>
                  <Check checked={reportIds.includes(c.id)} onChange={(v) => toggleReportId(c.id, v)}
                    label={`${c.name} · ${c.subType} · ${c.holder} · ${c.longTerm ? '长期有效' : '至 ' + c.validTo}`} />
                </div>
              ))}
            </div>
          </div>

          {/* ② 报告内容预览（静态模板 mock：封面 + 统计摘要 + 清单表） */}
          <div className="nc-export-block">
            <div className="nc-export-block-title">② 报告内容预览</div>
            <div style={{ border: '1px solid var(--c-border,#e5e6eb)', borderRadius: 6, padding: 12 }}>
              <div style={{ textAlign: 'center', padding: '8px 0 12px', borderBottom: '2px solid var(--c-primary,#2b6bf5)', marginBottom: 12 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>云南诺安消防 · 证书管理报告</div>
                <div className="nc-cell-sub" style={{ marginTop: 4 }}>统计截止 {TODAY} · 生成人 {getUserName(role)}</div>
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12, fontSize: 12 }}>
                <span>在册 <b>{reportSummary.total}</b> 本</span>
                <span>未过期 <b>{reportSummary.total - reportSummary.expired}</b></span>
                <span style={{ color: 'var(--c-danger)' }}>已过期 <b>{reportSummary.expired}</b></span>
                <span>90 天内到期 <b>{reportSummary.expiring}</b></span>
                <span>长期有效 <b>{reportSummary.longTerm}</b></span>
                <span>在外占用 <b>{reportSummary.used}</b></span>
              </div>
              <table className="nc-export-mini-tbl">
                <thead><tr><th>证书编号</th><th>证书名称</th><th>持有人</th><th>有效期至</th><th>状态</th></tr></thead>
                <tbody>
                  {reportSel.slice(0, 5).map((c) => (
                    <tr key={c.id}><td>{c.id}</td><td>{c.name}</td><td>{c.holder}</td><td>{c.longTerm ? '长期' : c.validTo}</td><td>{c.status}</td></tr>
                  ))}
                </tbody>
              </table>
              <div className="nc-export-wmpreview-note" style={{ marginTop: 6 }}>实际报告含 {reportSel.length} 本证书完整清单，预览仅示意前 5 行</div>
            </div>
          </div>

          {/* ③ 输出格式 */}
          <div className="nc-export-block">
            <div className="nc-export-block-title">③ 输出格式</div>
            <div className="nc-export-radios">
              {([{ k: 'xlsx', l: 'Excel（.xlsx）· 便于归档统计' }, { k: 'pdf', l: 'PDF（.pdf）· 便于打印 / 对外报送' }] as { k: 'xlsx' | 'pdf'; l: string }[]).map((o) => (
                <label key={o.k} className="nc-export-radio">
                  <input type="radio" name="nc-cert-report-fmt" checked={reportFmt === o.k} onChange={() => setReportFmt(o.k)} />
                  <span>{o.l}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </Modal>

    </>
  );
}

/* 建造师三要素校验子组件（硬拦截） */
function BuilderCheck({ name, cert }: { name: string; cert: C }) {
  const bValid = cert.validTo >= TODAY;
  const hasB = cert.hasB !== false;
  // 占用上限口径：cap = 99 表示公司资质「不限并行占用」；否则按已占用 < 上限判定。
  // 原写法 `cert.cap || 1` 会把 cap = 0（尚未配置配额）当成 1，导致校验恒为真。
  const cap = cert.cap ?? 1;
  const usedN = cert.used?.length ?? 0;
  const noBusy = cap === 99 ? true : usedN < cap;
  const pass = bValid && hasB && noBusy;
  return (
    <div className={`nc-warnbox ${pass ? 'is-green' : 'is-red'}`}>
      <div className="nc-warnbox-hd">建造师三要素校验（投标项目经理资格）· {name}</div>
      <ul className="nc-check-list">
        <li><StatusIco kind={bValid ? 'ok' : 'ban'} /> 建造师证书有效（当前有效期至 {cert.validTo}{bValid ? '' : ' · 已过期'}）</li>
        <li><StatusIco kind={hasB ? 'ok' : 'ban'} /> 同人 B 证有效（{hasB ? `有效期至 ${cert.bValidTo || '2027-05-31'}` : '无 B 证或已失效'}）</li>
        <li><StatusIco kind={noBusy ? 'ok' : 'ban'} /> 无在建项目（当前占用 {cert.used?.length ?? 0}/{cert.cap === 99 ? '∞' : cert.cap ?? 1}）</li>
      </ul>
      {!pass && <div><Ico n="ban" size={16} /> 任一不满足即不可担任本项目经理（硬拦截）。</div>}
    </div>
  );
}

