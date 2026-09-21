// 证书管理（列表 · 三视角）—— 证书台账三视角与借还闭环
// 术语强制：借给项目 / 用完收回 · 登记使用 · 外借 / 收回外借 · 续证安排 · 一证一项目/多项目引用/按次登记
// 硬规则：建造师三要素 · 安许过期=全部投标废标 · B 证不单独借出 · 周期止早于起拦截
import React, { useMemo, useState } from 'react';
import {
  Banner, Btn, Card, DataTable, Drawer, Field, KvGrid, Modal, Money, Op, OpNone, OpMore, OpSep,
  PageHead, TableFoot, Tag, Timeline, Tip, useToast, Code, Check, Alert, Progress, ConfirmModal, EntityLink,
  pressProps,
} from '../components/ui';
import { CERTS, TODAY, fmt, fmtWan, PROJECTS, BIDS } from '../components/data';
import { setFocus } from '../components/store';
import { Ico, StatusIco } from '../components/icons';

const MODE_LABEL: Record<string, string> = { single: '一证一项目', multi: '多项目引用', log: '按次登记' };

/* ============ 证书大类（筛选 chips 用） ============ */
/** subType → 大类：注册类（人员注册执业）/ 技能类（特种作业操作）/ 安全类（安全生产）/ 资质类（企业资质） */
const CAT_OF: Record<string, string> = {
  注册消防工程师: 'reg', 建造师: 'reg', B证: 'reg',
  电工: 'skill', 焊工: 'skill', 建构筑物消防员: 'skill',
  安许: 'safety',
  施工资质: 'qual', 维护保养资质: 'qual', 设计资质: 'qual',
};
const CERT_CATS = [
  { key: '', label: '全部' },
  { key: 'reg', label: '注册类' },
  { key: 'skill', label: '技能类' },
  { key: 'safety', label: '安全类' },
  { key: 'qual', label: '资质类' },
] as const;
const MODE_TONE: Record<string, 'red' | 'blue' | 'gray'> = { single: 'red', multi: 'blue', log: 'gray' };
const MODE_DESC: Record<string, string> = {
  single: '同一时间仅 1 个项目，法定独占（建造师、注册消防工程师）',
  multi: '公司资质，可被多项目同时使用（资质等级、安许、ISO、软著）',
  log: '不占用，只记录用在哪个项目（电工/焊工证、八大员、B 证）',
};
type C = (typeof CERTS)[number];

/* ============ 归属与保管人 ============ */
/** 公司证书由保管人负责（可外借投标 / 履约）；个人证书登记到员工名下（可设持证补贴） */
const isCompany = (c: C) => c.type === '企业资质';
const CUSTODIAN: Record<string, string> = {
  ZS000031: '行政 · 证书管理员', ZS000035: '行政 · 证书管理员',
  ZS000041: '行政 · 证书管理员', ZS000044: '行政 · 证书管理员',
};
const custodianOf = (c: C) => (isCompany(c) ? (CUSTODIAN[c.id] || '行政 · 证书管理员') : '');

/* ============ 长期有效 / 到期提前提醒 ============ */
/** 职业资格类（消防设施操作员等）长期有效，不设到期日 */
const LONG_TERM_IDS = ['ZS000022'];
const isLongTerm = (c: C) => LONG_TERM_IDS.includes(c.id);
const REMIND_DAYS: Record<string, number> = { ZS000015: 30, ZS000035: 60, ZS000044: 60, ZS000055: 30 };
const remindOf = (c: C) => (isLongTerm(c) ? 0 : (REMIND_DAYS[c.id] ?? 30));

/* ============ 持证补贴（仅个人证书） ============ */
type SubMode = 'none' | 'monthly' | 'yearly' | 'once';
const SUB_LABEL: Record<SubMode, string> = { none: '无补贴', monthly: '按月发放', yearly: '按年发放', once: '一次性' };
const SUB_UNIT: Record<SubMode, string> = { none: '', monthly: '月', yearly: '年', once: '次' };
const SUBSIDY_SEED: Record<string, { mode: SubMode; amount: number; start: string }> = {
  ZS000015: { mode: 'monthly', amount: 2500, start: '2025-10-18' },
  ZS000018: { mode: 'monthly', amount: 2500, start: '2025-06-30' },
  ZS000022: { mode: 'monthly', amount: 800, start: '2026-03-15' },
  ZS000008: { mode: 'yearly', amount: 3000, start: '2024-12-20' },
  ZS000028: { mode: 'monthly', amount: 600, start: '2025-12-28' },
  ZS000050: { mode: 'once', amount: 30000, start: '2025-08-31' },
  ZS000051: { mode: 'yearly', amount: 12000, start: '2024-12-15' },
  ZS000055: { mode: 'none', amount: 0, start: '' },
};
const subsidyOf = (c: C) => (isCompany(c) ? { mode: 'none' as SubMode, amount: 0, start: '' } : (SUBSIDY_SEED[c.id] || { mode: 'none' as SubMode, amount: 0, start: '' }));
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
  // 待处理黄条
  const [stripOpen, setStripOpen] = useState(false);
  // 借出用途 / 续借
  const [lendPurpose, setLendPurpose] = useState(PURPOSES[0]);
  const [lendErr, setLendErr] = useState('');
  const [renewBorrowOpen, setRenewBorrowOpen] = useState<C | null>(null);
  const [rbTo, setRbTo] = useState('');
  const [rbErr, setRbErr] = useState('');
  // 新增证书：归属 / 保管人 / 长期有效 / 提醒 / 补贴
  const [nOwnerType, setNOwnerType] = useState<'人员证书' | '企业资质'>('人员证书');
  const [nCustodian, setNCustodian] = useState('');
  const [nLongTerm, setNLongTerm] = useState(false);
  const [nRemind, setNRemind] = useState('30');
  const [nSubMode, setNSubMode] = useState<SubMode>('none');
  const [nSubAmt, setNSubAmt] = useState(0);
  const [nSubStart, setNSubStart] = useState('');
  /** 新增证书表单：打开时与保存后统一重置，避免残留上次输入 */
  const resetNewCert = () => {
    setNOwnerType('人员证书'); setNCustodian(''); setNLongTerm(false); setNRemind('30');
    setNSubMode('none'); setNSubAmt(0); setNSubStart(''); setOcrTip(false);
  };

  const daysLeft = (d: string) => Math.round((new Date(d).getTime() - new Date(TODAY).getTime()) / 86400000);
  const validTone = (d: string) => { const n = daysLeft(d); return n < 0 ? 'is-red' : n <= 30 ? 'is-red' : n <= 60 ? 'is-orange' : n <= 90 ? 'is-gold' : ''; };

  /* G1：原直接读模块常量 CERTS，借出 / 收回 / 登记使用等写操作只 toast 不改数据，
     台账与「并行占用」列永远不变。改为可写 state，写操作真实回流。 */
  const [certs, setCerts] = useState(CERTS);
  /** 借还回写：used 为占用项目 id 数组 */
  const patchCert = (id: string, patch: Partial<C>, msg: string) => {
    setCerts((cs) => cs.map((x) => (x.id === id ? ({ ...x, ...patch } as C) : x)));
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
      if (statusF === '已过期' && !(c.validTo < TODAY)) return false;
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

  /** 待处理黄条：过期 / 临期 / 占用满载 / 外借未归还 —— 点击直达详情安排续期 */
  const stripItems = useMemo(() => certs.flatMap((c) => {
    const out: { id: string; txt: string; bad: boolean }[] = [];
    if (!isLongTerm(c) && c.validTo < TODAY) out.push({ id: c.id, txt: `${c.name}（${c.holder}）已过期 ${Math.abs(daysLeft(c.validTo))} 天 · 须立即续期`, bad: true });
    else if (!isLongTerm(c) && c.warnDays > 0 && c.warnDays <= 30) out.push({ id: c.id, txt: `${c.name}（${c.holder}）${c.warnDays} 天内到期 · 安排续期`, bad: true });
    else if (!isLongTerm(c) && c.warnDays > 30 && c.warnDays <= 90) out.push({ id: c.id, txt: `${c.name}（${c.holder}）${c.warnDays} 天内到期 · 提前准备材料`, bad: false });
    if (c.mode === 'single' && c.used.length >= c.cap) out.push({ id: c.id, txt: `${c.name}（${c.holder}）已达并行占用上限 ${c.used.length}/${c.cap} · 需提额或释放`, bad: false });
    return out;
  }), []);

  /** 年度补贴成本 = Σ年化 + 本年度到期的一次性补贴 */
  const subsidyYear = certs.reduce((a, c) => a + yearCost(c) + onceThisYear(c), 0);

  /* 统计瓦片基数（与列表筛选同源，保证「点击瓦片」复现的结果与瓦片数字一致） */
  const d30Count = certs.filter((c) => !isLongTerm(c) && c.warnDays > 0 && c.warnDays <= 30).length;
  const d90Count = certs.filter((c) => !isLongTerm(c) && c.warnDays > 0 && c.warnDays <= 90).length;
  const expiredCount = certs.filter((c) => c.validTo < TODAY).length;
  const longTermCount = certs.filter(isLongTerm).length;

  // 注意：Modal 的 foot / children 作为 prop 会在 Modal 内部 open 判断之前求值，
  // 因此 canLend / lendWhy 必须容忍 null（弹窗关闭时为 null）。
  const canLend = (c: C | null) => !!c && c.validTo >= TODAY && c.mode !== 'log' && c.subType !== 'B证';
  const lendWhy = (c: C | null) => !c ? ''
    : c.validTo < TODAY ? ' 已过期，不可借出（过期证书借出 / 投标将被硬拦截）'
    : c.subType === 'B证' ? ' B 证随注册使用，不单独借出'
    : c.mode === 'log' ? ' 按次登记类，请改用「登记使用」'
    : c.mode === 'single' && c.used.length >= c.cap ? `已达并行占用上限（${c.used.length}/${c.cap}），需先提额` : '';

  const certCols = [
    {
      key: 'name', title: '证书名称', width: 240,
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
      : <>{c.holder}{subText(c) && <div className="nc-cell-sub" style={{ color: 'var(--c-warning-deep)' }}>补贴 {subText(c)}</div>}</>) },
    { key: 'validTo', title: '有效期至', width: 140, render: (c: C) => (isLongTerm(c)
      ? <Tag tone="green">长期有效</Tag>
      : <span className={validTone(c.validTo)}>{c.validTo}{c.validTo < TODAY ? ' · 已过期' : c.warnDays ? ` · 剩 ${daysLeft(c.validTo)} 天` : ''}</span>) },
    { key: 'status', title: '状态', width: 100, render: (c: C) => <Tag tone={c.status === '正常' ? 'green' : c.status === '已过期' ? 'red' : 'orange'}>{c.status}</Tag> },
    { key: 'mode', title: '占用方式', width: 110, render: (c: C) => <Tag tone={MODE_TONE[c.mode]}>{MODE_LABEL[c.mode]}</Tag> },
    { key: 'used', title: '并行占用', width: 96, align: 'right' as const, render: (c: C) => <span className={`num${c.mode === 'single' && c.used.length >= c.cap ? ' is-red' : ''}`}>{c.used.length}/{c.cap === 99 ? '∞' : c.cap}</span> },
    {
      key: 'op', title: '操作', width: 260, align: 'right' as const,
      /* 评审改造：操作列统一为「3 个固定槽位 + 更多收口」。
         槽位①详情（恒可用）②借给项目 ③登记使用 —— 位置跨行恒定；
         该行无对应权限/不适用时留「—」占位并悬停说明原因，避免不同行的按钮位置漂移；
         其余操作（用完收回 / 外借 / 收回外借）收进「更多 ⋯」。 */
      render: (c: C) => (
        <div className="nc-ops" onClick={(e) => e.stopPropagation()}>
          <Op onClick={() => setDetail(c)}>详情</Op><OpSep />
          {canLend(c)
            ? <Op gold title={lendWhy(c) || '借走后仅该项目可用'} onClick={() => { setLendOpen(c); setLendProj(firstProj); setLendNote(''); setLendErr(''); setLendPurpose(PURPOSES[0]); }}>借给项目</Op>
            : <OpNone title={lendWhy(c) || '该证书不支持借给项目'} />}<OpSep />
          {c.mode === 'log'
            ? <Op onClick={() => { setUseOpen(c); setUsePerson(''); }}>登记使用</Op>
            : <OpNone title="非按次登记类证书，无需登记使用" />}<OpSep />
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

  return (
    <>
      <PageHead
        title="证书管理"
        badges={<Tag tone="blue">在册 {certs.length} 本</Tag>}
        actions={<>
          <Btn onClick={() => toast('已导出台账（水印：导出人 + 时间 + 租户）')}>导出台账</Btn>
          <Btn kind="primary" onClick={() => { setNewOpen(true); resetNewCert(); }}>＋ 新增证书</Btn>
        </>}
      />

      {safety && safety.validTo < '2026-12-31' && (
        <Banner tone="warn" actions={<Btn size="sm" onClick={() => { setRenewOpen(safety); setRenewPeriod(''); setRenewTo(''); setRenewErr(''); }}>安排续证</Btn>}>
          <Ico n="ban" size={14} style={{ color: 'var(--c-danger)' }} /> <b>{safety.name}</b>（{safety.id}）有效期至 {safety.validTo}（剩 {daysLeft(safety.validTo)} 天）——依「安全生产许可证过期 = <b>全部投标废标</b>」，请立即完成<b>续证安排</b>。
        </Banner>
      )}

      {/* 待处理黄条：过期 / 临期 / 占用满载 —— 点击直达证书详情 */}
      {stripItems.length > 0 && (
        <div className="nc-issuestrip" style={{ marginBottom: 12 }}>
          <span className="nc-issue is-gold"><b><Ico n="clock" size={16} /> {stripItems.length} 条证书待处理</b></span>
          {stripItems.map((it, i) => (
            <button key={`${it.id}-${i}`} type="button" className={`nc-issue ${it.bad ? 'is-red' : 'is-orange'}`}
              style={(!stripOpen && i >= 4) ? { display: 'none', cursor: 'pointer' } : { cursor: 'pointer' }}
              onClick={() => { const c = certs.find((x) => x.id === it.id); if (c) setDetail(c); }}>
              <b>{it.txt}</b>
            </button>
          ))}
          {stripItems.length > 4 && (
            <button type="button" className="nc-cs-more" onClick={() => setStripOpen(!stripOpen)}>
              {stripOpen ? '收起' : `展开全部 ${stripItems.length} 项`}
            </button>
          )}
          <span className="nc-cs-hint">点击条目直达证书详情，安排续期 / 归还 / 复审</span>
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
            n: certs.length, glyph: '≡', sev: '', sfx: '本', wan: false,
            sub: '在册（有效 + 到期）',
          },
          {
            key: 'd30', label: '30 天内到期', filter: 'expiring' as string | null,
            n: d30Count, glyph: '!!!', sev: d30Count > 0 ? ' is-red' : '', sfx: '本', wan: false,
            sub: `紧急续证 · 另 31–90 天 ${d90Count - d30Count} 本`,
          },
          {
            key: 'expired', label: '已过期', filter: '已过期' as string | null,
            n: expiredCount, glyph: '✕', sev: expiredCount > 0 ? ' is-red' : '', sfx: '本', wan: false,
            sub: `另有长期有效 ${longTermCount} 本（不设到期日）`,
          },
          {
            key: 'subsidy', label: '年度补贴成本', filter: null,
            n: subsidyYear, glyph: '¥', sev: ' is-gold', sfx: '/年', wan: true,
            sub: '月度 ×12 + 年度；一次性按到期年计入',
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
              onClick={goFilter}
              title={clickable ? `筛选出「${t.label}」的证书` : undefined}
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

      {/* 视角切换 + 筛选行（截图口径）：左「按证书/按人员/按项目」，右「状态 ▾ / 排序 ▾ / 搜索」，仅证书视角出现筛选控件 */}
      <div className="nc-toolbar" style={{ marginBottom: 12 }}>
        <div className="nc-seg">
          <button className={`nc-seg-btn${view === 'cert' ? ' is-on' : ''}`} onClick={() => setView('cert')}>按证书</button>
          <button className={`nc-seg-btn${view === 'person' ? ' is-on' : ''}`} onClick={() => setView('person')}>按人员</button>
          <button className={`nc-seg-btn${view === 'project' ? ' is-on' : ''}`} onClick={() => setView('project')}>按项目</button>
        </div>
        <span className="nc-listhint">证书占用<Tip w={340} text="占用三分法：一证一项目（独占）/ 多项目引用（公司资质）/ 按次登记（不占用，记一笔）。" /></span>
        {view === 'cert' && (
          <div className="nc-certfilter">
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
            <select
              className="nc-input nc-cert-sel" aria-label="排序方式" value={sortKey}
              onChange={(e) => { setSortKey(e.target.value); setPage(1); }}
            >
              <option value="exp-asc">最早到期在前</option>
              <option value="exp-desc">最晚到期在前</option>
              <option value="sub-desc">补贴成本从高到低</option>
            </select>
            <input
              className="nc-input nc-lt-search" value={kw} placeholder="搜索姓名 / 证书 / 编号"
              onChange={(e) => { setKw(e.target.value); setPage(1); }}
            />
          </div>
        )}
      </div>

      {view === 'cert' ? (
        <Card flush>
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
            <span className="nc-listhint nc-listhint-sp">过期证书禁用投标 / 派单 / 借用<Tip text="证书到期后自动置为「已过期」，投标引用、项目派单、外借均被拦截；续证安排需提前发起。" /></span>
          </div>
          <DataTable
            cols={certCols} rows={paged} rowKey={(c) => c.id} minWidth={1420}
            empty="没有符合筛选条件的证书；证书分人员证书 / 企业资质两类，支持 OCR 扫码建档"
            emptyCta={<Btn size="sm" kind="primary" onClick={() => { setNewOpen(true); resetNewCert(); }}>＋ 新增证书</Btn>}
            rowClass={(c) => (c.validTo < TODAY ? 'is-danger-row' : c.level === 'company-red' ? 'is-warn-row' : '')}
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
                    <td><b>{proj?.name ?? pid}</b><div className="nc-cell-sub"><EntityLink target="project-center" id={pid} go={go} title="下钻到项目经营中心"><Code>{pid}</Code></EntityLink></div></td>
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
        open={!!detail} onClose={() => setDetail(null)} width={720}
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
                        <td>{u.startsWith('XM') ? <EntityLink target="project-center" id={u} go={go} title="下钻到项目经营中心">{PROJECTS.find((p) => p.id === u)?.name ?? u}</EntityLink> : <EntityLink target="bid" id={u} go={go} title="下钻到投标详情">{u}</EntityLink>} <Code>{u}</Code></td>
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
        open={!!lendOpen} onClose={() => setLendOpen(null)} width={560} title={`借给项目 · ${lendOpen?.name ?? ''}`}
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
                <select className="nc-input" value={lendProj} onChange={(e) => setLendProj(e.target.value)}>
                  {PROJECTS.map((p) => <option key={p.id} value={p.id}>{p.id} · {p.name}</option>)}
                </select>
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
        open={!!useOpen} onClose={() => setUseOpen(null)} width={560} title={`登记使用 · ${useOpen?.name ?? ''}`}
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
            <select className="nc-input" value={useProj} onChange={(e) => setUseProj(e.target.value)}>
              {PROJECTS.map((p) => <option key={p.id} value={p.id}>{p.id} · {p.name}</option>)}
            </select>
          </Field>
          <Field label="使用日期" req><input className="nc-input" type="date" defaultValue={TODAY} /></Field>
          <Field label="工作内容"><input className="nc-input" placeholder="例：报警系统接线调试" /></Field>
        </div>
      </Modal>

      {/* ================ 外借 ================ */}
      <Modal
        open={!!outOpen} onClose={() => setOutOpen(null)} width={560} title={`外借 · ${outOpen?.name ?? ''}`}
        foot={<><Btn onClick={() => setOutOpen(null)}>取消</Btn><Btn kind="primary" onClick={() => {
          if (!outUnit.trim()) { setOutErr('借用单位必填'); return; }
          if (outTo && outTo < outFrom) { setOutErr(' 归还日期不得早于借出日期（周期校验拦截）'); return; }
          setOutErr('');
          toast(`已外借至 ${outUnit} · 外借期间本司项目不可用（标准用语「外借」，禁用「挂靠」）`);
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
      <Modal
        open={!!renewOpen} onClose={() => setRenewOpen(null)} width={580} title={`续证安排 · ${renewOpen?.name ?? ''}`}
        foot={<><Btn onClick={() => setRenewOpen(null)}>取消</Btn><Btn kind="primary" onClick={() => {
          if (!renewPeriod.trim() || !renewTo) { setRenewErr('周期起止必填'); return; }
          if (renewTo < renewPeriod) { setRenewErr(' 周期止不得早于周期起（硬拦截）'); return; }
          setRenewErr('');
          toast('续证安排已登记 · 临近 7 天二次提醒已开启');
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
      </Modal>

      {/* ================ 续借 ================ */}
      <Modal
        open={!!renewBorrowOpen} onClose={() => setRenewBorrowOpen(null)} width={520} title={`续借 · ${renewBorrowOpen?.name ?? ''}`}
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
      <Modal
        open={newOpen} onClose={() => setNewOpen(false)} width={680} title="新增证书"
        foot={<><Btn onClick={() => { setNewOpen(false); setOcrTip(true); }}><Ico n="camera" size={16} /> 从证书照片识别</Btn><Btn kind="primary" onClick={() => {
            if (nSubMode !== 'none' && !(nSubAmt > 0)) { toast('已选择补贴模式，请填写补贴金额', 'err'); return; }
            if (nSubMode !== 'none' && !nSubStart) { toast('请填写补贴起算日期', 'err'); return; }
            if (nOwnerType === '企业资质' && !nCustodian.trim()) { toast('公司证书须指定保管人', 'err'); return; }
            toast(`证书已新增到台账 · ${nOwnerType === '企业资质' ? '公司证书（保管人 ' + nCustodian + '）' : '个人证书'}${nLongTerm ? ' · 长期有效' : ''}`);
            setNewOpen(false); resetNewCert();
          }}>保存</Btn></>}>
        {ocrTip && <Banner tone="warn">已按照片识别预填，请<b>逐项核对后保存</b>（识别置信度低于 90% 的字段将以黄底标出）。</Banner>}
        <div className="nc-form-grid">
          <Field label="证书名称" req span={2}><input className="nc-input" placeholder="例：一级注册消防工程师" /></Field>
          <Field label="证书归属" req note="归属创建后不可修改，如需变更请注销后重新创建">
            <select className="nc-input" value={nOwnerType} onChange={(e) => setNOwnerType(e.target.value as '人员证书' | '企业资质')}>
              <option value="人员证书">个人证书（登记到员工名下，可设持证补贴）</option>
              <option value="企业资质">公司证书（由保管人负责，可外借投标 / 履约）</option>
            </select>
          </Field>
          <Field label="专业 / 子类" req><select className="nc-input"><option>注册消防工程师</option><option>建造师</option><option>B证</option><option>电工</option><option>焊工</option><option>建构筑物消防员</option></select></Field>
          <Field label={nOwnerType === '企业资质' ? '保管人' : '持有人'} req>
            <input className="nc-input" value={nCustodian}
              onChange={(e) => setNCustodian(e.target.value)}
              placeholder={nOwnerType === '企业资质' ? '例：行政 · 证书管理员' : '例：张工'} />
          </Field>
          <Field label="证书编号" req><input className="nc-input" placeholder="例：ZJ101-2026-0093" /></Field>
          <Field label="有效期至" req note={nLongTerm ? '已勾选长期有效，无需填写' : undefined}>
            <input className="nc-input" type="date" disabled={nLongTerm} />
          </Field>
          <Field label="到期提前提醒" note="临近提醒天数">
            <select className="nc-input" value={nRemind} onChange={(e) => setNRemind(e.target.value)} disabled={nLongTerm}>
              <option value="7">7 天</option><option value="15">15 天</option><option value="30">30 天</option><option value="60">60 天</option><option value="90">90 天</option>
            </select>
          </Field>
          <Field label="长期有效" span={2}>
            <Check checked={nLongTerm} onChange={setNLongTerm} label="长期有效（不设到期日 · 如消防设施操作员职业资格证书）" />
          </Field>
          <Field label="发证机关" req><input className="nc-input" placeholder="例：住建部 / 云南省消防救援总队" /></Field>
          <Field label="扫描件"><input className="nc-input" type="file" /></Field>
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
            <select className="nc-input"><option>一证一项目（single）</option><option>多项目引用（multi）</option><option>按次登记（log）</option></select>
          </Field>
          <Field label="并行占用上限" req><input className="nc-input" type="number" defaultValue={1} /></Field>
          <Field label="扫描件"><input className="nc-input" type="file" /></Field>
        </div>
      </Modal>

      {/* ============ 解除证书占用（评审 I1：二次确认 + 原因必填） ============ */}
      <ConfirmModal
        open={!!freeOpen} onClose={() => setFreeOpen(null)} okText="确认释放"
        title="解除证书占用"
        reason reasonLabel="解除原因"
        impact={freeOpen && <>将解除证书 <b>{detail?.name}</b>（{detail?.id}）对 <b>{freeOpen}</b> 的占用。<br />释放后该对象的<b>投标资格校验 / 项目证书校验将立即失败</b>（如建造师三要素缺项），且名额可被其他投标或项目抢占。</>}
        onOk={(r) => { toast(`已解除占用（${freeOpen}）并留痕，原因：${r}`); setFreeOpen(null); }}
      />
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

