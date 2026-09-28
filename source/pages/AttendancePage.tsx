// 考勤管理 —— 外包用工月度考勤矩阵 · 人工成本自动派生
// 口径：出勤天数 = Σ 符号值（√ 1 天 / 半 0.5 天 / 加 1.5 天 / 休·假·空 0）；人工成本 = 出勤天数 × 岗位单价
// 岗位单价唯一来源：LABOR_RATES（在「岗位单价」页维护，改动留痕）；考勤按「项目 + 班组」归属外包成本
// 时间维度（年 / 月 / 日）：月份决定矩阵天数与「已过天数」，日期决定「在场」口径与高亮列；考勤只录在基准月
// 防误触：格子默认只读，须先点「编辑考勤」进入编辑态；改动落副本，点「保存」先弹改动清单二次确认，确认后才生效
// 基础数据（都在本页页签里维护，不再散在 data.ts 常量里）：
//   · 班组 = 考勤归属主数据（人员挂班组，考勤按「项目 + 班组」归属外包成本）
//   · 人员档案 = 挂班组；项目归属由「派工」决定 —— 换项目只改派工并留痕，不重建档案
//   · 岗位单价 = 人工费的唯一来源
// 导入：现场每月一张《考勤记录表》，用「导入考勤」把整月数据一次带进来（.xlsx / .csv / 直接粘贴）
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Banner, Btn, Card, Check, DataTable, EntityLink, Field, ListToolbar, Modal, Op, OpMore, OpSep, PageHead,
  TableFoot, Tabs, Tag, Tile, Tip, usePaged, useToast, ProjectPicker,
} from '../components/ui';
import { ExportButton, useExport, getUserName, ExportDialog, type ExportField } from '../components/export';
import type { Col } from '../components/ui';
import {
  ATT_BASE_YM, ATT_MARKS, ATT_TEAM_STATUS, ATT_WORKER_STATUS, LABOR_RATES, PROJECTS, TODAY,
  attDays, attMarksOf, canSeeMoney, fmt, fmtWan, type AttTeam, type AttWorker,
} from '../components/data';
import {
  addAttTeam, addAttWorker, attTeamNameOf, dispatchAttWorker, getActiveAttTeams,
  getAttTeams, getAttWorkers, importAttMonth, nextAttTeamNo, nextAttWorkerNo,
  patchAttTeam, patchAttWorker, subscribeStore, toggleAttTeam, toggleAttWorker, updateAttWorkers,
} from '../components/store';
import { parseAttGrid, sumMarks, type ImpGrid } from '../components/attImport';
import { parseDelimited, readTableFile } from '../components/xlsx';
import { Ico } from '../components/icons';

/* ---------------- 时间维度：年 / 月 / 日 ---------------- */
const pad2 = (n: number) => String(n).padStart(2, '0');
/** 「2026-09-20」→ { y, m, d } */
const parseYmd = (s: string) => {
  const [y, m, d] = s.split('-').map(Number);
  return { y, m, d };
};
/** 某年某月的天数（m 为 1~12） */
const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();
/** 拼成「2026-09-05」 */
const toYmd = (y: number, m: number, d: number) => `${y}-${pad2(m)}-${pad2(d)}`;
/** 基准日（TODAY = 2026-09-20）：决定默认考勤月 / 查看日，以及「已过天数」 */
const BASE = parseYmd(TODAY);
/* 默认考勤月取「种子考勤所在月」而非 TODAY 的月份：
   有数据的那一月由种子决定，两者在 data.ts 里是同一个月份（见 ATT_BASE_YM 的注释）。 */
const BASE_YM = ATT_BASE_YM;

/** 项目名（派工弹窗 / 列表展示用）：未知 id 回落原值，避免显示成空白 */
const projNameOf = (id: string) => PROJECTS.find((p) => p.id === id)?.name ?? id;

type Rate = { trade: string; rate: number };

export default function AttendancePage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  const money = canSeeMoney(role);
  const [tab, setTab] = useState('sheet');
  /* 时间维度：ym = 考勤所属年月（决定矩阵天数与「已过天数」）；day = 查看日期（决定「在场」口径与高亮列） */
  const [ym, setYm] = useState(BASE_YM);
  const [day, setDay] = useState(BASE.d);
  const [projF, setProjF] = useState('全部');
  /* 班组筛选存班组 id（不是名字）—— 班组改名后筛选依然有效 */
  const [teamF, setTeamF] = useState('全部');
  /* 考勤人员 / 班组改由 store 托管：本页的增删改与项目详情的现场投入同源 */
  const [workers, setWorkers] = useState<AttWorker[]>(getAttWorkers());
  const [teams, setTeams] = useState<AttTeam[]>(getAttTeams());
  const [tick, setTick] = useState(0);
  useEffect(() => subscribeStore(() => {
    setWorkers(getAttWorkers());
    setTeams(getAttTeams());
    setTick((n) => n + 1);
  }), []);
  /* 班组管理：草稿非空 = 弹窗打开（id 为空串 = 新增） */
  const [teamDraft, setTeamDraft] = useState<AttTeam | null>(null);
  const [teamKw, setTeamKw] = useState('');
  const [teamSt, setTeamSt] = useState('全部');
  /* 人员档案：草稿非空 = 弹窗打开（id 为空串 = 新增） */
  const [wDraft, setWDraft] = useState<AttWorker | null>(null);
  const [wKw, setWKw] = useState('');
  const [wStF, setWStF] = useState('全部');
  const [wTeamF, setWTeamF] = useState('全部');
  /* 派工弹窗 */
  const [dispW, setDispW] = useState<AttWorker | null>(null);
  const [dispProj, setDispProj] = useState('');
  const [dispNote, setDispNote] = useState('');
  /* 导入考勤：两步（pick 选文件 → check 核对） */
  const [impOpen, setImpOpen] = useState(false);
  const [impStep, setImpStep] = useState<'pick' | 'check'>('pick');
  const [impText, setImpText] = useState('');
  const [impFileName, setImpFileName] = useState('');
  const [impErr, setImpErr] = useState('');
  const [impBusy, setImpBusy] = useState(false);
  const [impDrag, setImpDrag] = useState(false);
  const [impGrid, setImpGrid] = useState<ImpGrid | null>(null);
  const [impProj, setImpProj] = useState('');
  const [impYm, setImpYm] = useState(BASE_YM);
  const [impAutoNew, setImpAutoNew] = useState(false);
  const [impTeam, setImpTeam] = useState('');
  const [impTrade, setImpTrade] = useState(LABOR_RATES[0].trade);
  const [impDispatch, setImpDispatch] = useState(true);
  const impFileRef = useRef<HTMLInputElement>(null);
  /* 防误触：draft 非空 = 编辑态。改动先落副本，二次确认后才写回 workers */
  const [draft, setDraft] = useState<AttWorker[] | null>(null);
  /* 二次确认弹窗：save = 保存前确认改动清单；cancel = 放弃未保存改动前确认 */
  const [confirm, setConfirm] = useState<'' | 'save' | 'cancel'>('');
  /* 岗位单价：页面内可改（原值来自 LABOR_RATES） */
  const [rates, setRates] = useState<Rate[]>(LABOR_RATES.map((r) => ({ ...r })));
  const [rateEdit, setRateEdit] = useState<Rate | null>(null);
  const [rateVal, setRateVal] = useState('');
  const [attendanceSel, setAttendanceSel] = useState<string[]>([]);
  /* 单价改动留痕 */
  const [rateLog, setRateLog] = useState<{ trade: string; old: number; nu: number; t: string }[]>([]);
  /* 考勤矩阵按人分页（日列横向滚动保留） */
  const [sheetPage, setSheetPage] = useState(1);
  const [sheetSize, setSheetSize] = useState(20);

  /* ---- 时间维度派生 ---- */
  const cur = parseYmd(`${ym}-01`);
  const monthDays = daysInMonth(cur.y, cur.m);
  /** 查看日：夹取到本月天数内（避免在 30 天的月份里停留在 31 日） */
  const vd = Math.min(day, monthDays);
  /** 该月已过天数：基准月 → 截至 TODAY；更早的月份 → 整月；未来月份 → 0 */
  const elapsed = ym === BASE_YM ? BASE.d : ym < BASE_YM ? monthDays : 0;
  /** 渲染源：编辑中读副本（实时看到合计变化），否则读已保存值 */
  const src = draft ?? workers;
  const editing = !!draft;
  /** 该月是否已有考勤记录：任何人录过即为有 —— 导入某月后该月即从空态转为有数据 */
  const hasData = useMemo(() => src.some((w) => Object.keys(w.marksByMonth[ym] ?? {}).length > 0), [src, ym]);

  const rateOf = (trade: string) => rates.find((r) => r.trade === trade)?.rate ?? 0;
  const daysOf = (w: AttWorker) => attDays(w, ym, monthDays);
  const costOf = (w: AttWorker) => Math.round(daysOf(w) * rateOf(w.trade));

  /* 矩阵只统计在册人员：已离场的人不再出现在考勤表与人工成本里 */
  const list = useMemo(
    () => src.filter((w) => w.status === '在册'
      && (projF === '全部' || w.proj === projF)
      && (teamF === '全部' || w.teamId === teamF)),
    [src, projF, teamF],
  );
  /** 在册总人数（不受筛选影响） */
  const onDuty = useMemo(() => src.filter((w) => w.status === '在册').length, [src]);
  /** 已建档但还没派工的人：不进项目成本归属，汇总页要显式提示 */
  const noProj = useMemo(() => src.filter((w) => w.status === '在册' && !w.proj).length, [src]);

  const totalDays = Math.round(list.reduce((a, w) => a + daysOf(w), 0) * 10) / 10;
  const totalCost = list.reduce((a, w) => a + costOf(w), 0);
  const onSite = list.filter((w) => {
    const m = attMarksOf(w, ym);
    return (m[vd] ?? '') && m[vd] !== '假';
  }).length;

  /** 点击格子：循环切换符号（√ → 半 → 加 → 休 → 假 → 空 → √）。只在编辑态可触发 */
  const cycleMark = (wid: string, d: number) => {
    setDraft((ds) => ds && ds.map((w) => {
      if (w.id !== wid) return w;
      const month = { ...(w.marksByMonth[ym] ?? {}) };
      const idx = ATT_MARKS.findIndex((m) => m.k === (month[d] ?? ''));
      const next = ATT_MARKS[(idx + 1) % ATT_MARKS.length].k;
      /* 空符号即「未在现场」——删掉这个键，而不是存一个空串，
         否则 attMarksOf 里「没录过」和「录成空」无法区分 */
      if (next) month[d] = next; else delete month[d];
      return { ...w, marksByMonth: { ...w.marksByMonth, [ym]: month } };
    }));
  };

  /** 进入编辑态：把已保存值深拷贝成副本（改动先落副本，取消即整体丢弃） */
  const startEdit = () => {
    /* 深拷贝到副本：marksByMonth 是两层嵌套，浅拷贝会让改动直接写到 store 上 */
    setDraft(workers.map((w) => ({
      ...w,
      marksByMonth: Object.fromEntries(Object.entries(w.marksByMonth).map(([k, v]) => [k, { ...v }])),
      dispatches: w.dispatches.map((d) => ({ ...d })),
    })));
    toast('已进入编辑状态 · 点击格子循环切换符号，改完点「保存」');
  };

  /** 本次编辑的改动清单（谁 / 哪天 / 旧 → 新）—— 保存前逐条确认的依据 */
  const changes = useMemo(() => {
    if (!draft) return [];
    const out: { id: string; name: string; d: number; from: string; to: string }[] = [];
    draft.forEach((w) => {
      const o = workers.find((x) => x.id === w.id);
      if (!o) return;
      const a0 = o.marksByMonth[ym] ?? {};
      const b0 = w.marksByMonth[ym] ?? {};
      for (let i = 1; i <= monthDays; i++) {
        const a = a0[i] ?? '';
        const b = b0[i] ?? '';
        if (a !== b) out.push({ id: w.id, name: w.name, d: i, from: a, to: b });
      }
    });
    return out;
  }, [draft, workers, monthDays, ym]);

  /** 二次确认通过 → 写回已保存值 */
  const commit = () => {
    if (!draft) return;
    const next = draft.map((w) => ({ ...w, marksByMonth: { ...w.marksByMonth } }));
    /* 落 store 而不是只改本页 state：项目详情的「现场投入」与本页同源，保存后那边也跟着变 */
    updateAttWorkers(() => next);
    setDraft(null);
    setConfirm('');
    toast(`考勤已保存 · ${changes.length} 处改动生效，人工成本已按新出勤重算`);
  };

  /** 放弃编辑：无改动直接退出，有改动先二次确认 */
  const dropEdit = () => {
    setDraft(null);
    setConfirm('');
    toast('已放弃本次考勤改动（未保存）');
  };

  /* 按项目 / 按岗位汇总 */
  const byProj = useMemo(() => PROJECTS.map((p) => {
    const ws = src.filter((w) => w.proj === p.id && w.status === '在册');
    return {
      id: p.id, name: p.name, cnt: ws.length,
      days: Math.round(ws.reduce((a, w) => a + daysOf(w), 0) * 10) / 10,
      cost: ws.reduce((a, w) => a + costOf(w), 0),
    };
  }).filter((r) => r.cnt > 0), [src, rates, tick]);

  const byTrade = useMemo(() => rates.map((r) => {
    const ws = src.filter((w) => w.trade === r.trade && w.status === '在册');
    return {
      trade: r.trade, rate: r.rate, cnt: ws.length,
      days: Math.round(ws.reduce((a, w) => a + daysOf(w), 0) * 10) / 10,
      cost: ws.reduce((a, w) => a + costOf(w), 0),
    };
  }).filter((r) => r.cnt > 0), [src, rates, tick]);

  /* ---- 班组管理 / 人员档案：筛选后的列表 ---- */
  const teamList = useMemo(() => teams.filter((t) => {
    if (teamSt !== '全部' && t.status !== teamSt) return false;
    const k = teamKw.trim().toLowerCase();
    if (!k) return true;
    return `${t.id} ${t.name} ${t.laborUnit} ${t.leader} ${t.trade}`.toLowerCase().includes(k);
  }), [teams, teamSt, teamKw]);

  const workerList = useMemo(() => workers.filter((w) => {
    if (wStF !== '全部' && w.status !== wStF) return false;
    if (wTeamF !== '全部' && w.teamId !== wTeamF) return false;
    const k = wKw.trim().toLowerCase();
    if (!k) return true;
    return `${w.id} ${w.name} ${w.trade} ${w.phone} ${attTeamNameOf(w.teamId)} ${w.proj}`.toLowerCase().includes(k);
  }), [workers, wStF, wTeamF, wKw, tick]);

  /* ---- 班组管理：增 / 改 / 停用 ---- */
  const openNewTeam = () => setTeamDraft({
    id: '', name: '', laborUnit: '', leader: '', phone: '',
    trade: LABOR_RATES[0].trade, status: '启用', note: '',
  });
  const openEditTeam = (t: AttTeam) => setTeamDraft({ ...t });

  const saveTeam = () => {
    if (!teamDraft) return;
    const name = teamDraft.name.trim();
    if (!name) { toast('请填写班组名称'); return; }
    if (teams.some((t) => t.name === name && t.id !== teamDraft.id)) { toast(`班组「${name}」已存在，请换个名称`); return; }
    if (teamDraft.id) {
      patchAttTeam(teamDraft.id, { ...teamDraft, name });
      toast(`班组「${name}」已更新`);
    } else {
      const id = nextAttTeamNo();
      addAttTeam({ ...teamDraft, id, name });
      toast(`班组「${name}」已新增（${id}），可到「人员档案」往里加人`);
    }
    setTeamDraft(null);
  };

  const doToggleTeam = (t: AttTeam) => {
    const next = t.status === '启用' ? '停用' : '启用';
    toggleAttTeam(t.id);
    toast(next === '停用'
      ? `班组「${t.name}」已停用（不再可选新人员，已在册人员归属保留）`
      : `班组「${t.name}」已启用`);
  };

  /* ---- 人员档案：增 / 改 / 离场 / 派工 ---- */
  const openNewWorker = () => setWDraft({
    id: '', name: '', trade: LABOR_RATES[0].trade,
    teamId: getActiveAttTeams()[0]?.id ?? '',
    phone: '', status: '在册', proj: '', marksByMonth: {}, dispatches: [],
  });
  const openEditWorker = (w: AttWorker) => setWDraft({ ...w });

  const saveWorker = () => {
    if (!wDraft) return;
    const name = wDraft.name.trim();
    if (!name) { toast('请填写姓名'); return; }
    if (!wDraft.teamId) { toast('请选择所属班组（没有可选班组时，先去「班组管理」新增或启用一个）'); return; }
    if (wDraft.id) {
      patchAttWorker(wDraft.id, { ...wDraft, name });
      toast(`${name} 的人员档案已更新`);
    } else {
      const id = nextAttWorkerNo();
      addAttWorker({ ...wDraft, id, name });
      toast(`${name} 已建档（${id}），下一步用「派工」指派项目`);
    }
    setWDraft(null);
  };

  const doToggleWorker = (w: AttWorker) => {
    toggleAttWorker(w.id);
    toast(w.status === '在册'
      ? `${w.name} 已标记离场（不再进考勤矩阵与人工成本）`
      : `${w.name} 已复职（回到在册，可继续录考勤）`);
  };

  const openDispatch = (w: AttWorker) => { setDispW(w); setDispProj(w.proj); setDispNote(''); };

  const saveDispatch = () => {
    if (!dispW) return;
    if (!dispProj) { toast('请选择要派往的项目'); return; }
    if (dispProj === dispW.proj) { toast(`${dispW.name} 已在 ${dispProj}，无需改派`); return; }
    dispatchAttWorker(dispW.id, dispProj, dispNote.trim() || '派工调整');
    toast(`${dispW.name} 已派往 ${dispProj} ${projNameOf(dispProj)}（留痕已记录，人工成本按新项目归属）`);
    setDispW(null);
  };

  /* ---- 导入考勤：解析 → 核对 → 落库 ---- */
  const openImport = () => {
    setImpOpen(true);
    setImpStep('pick');
    setImpText('');
    setImpFileName('');
    setImpErr('');
    setImpGrid(null);
    setImpAutoNew(false);
    setImpBusy(false);
    /* 已经筛了某个项目 → 默认就是它，省一次选择 */
    setImpProj(projF !== '全部' ? projF : '');
    setImpYm(ym);
    setImpTeam(getActiveAttTeams()[0]?.id ?? '');
  };

  /** 二维网格 → 考勤记录；顺带把标题里的项目名反查成项目编号 */
  const acceptGrid = (grid: string[][]) => {
    try {
      const g = parseAttGrid(grid);
      setImpGrid(g);
      setImpErr('');
      if (g.ym) setImpYm(g.ym);
      if (!impProj && g.projName) {
        const hit = PROJECTS.find((p) => g.projName.includes(p.name) || p.name.includes(g.projName));
        if (hit) setImpProj(hit.id);
      }
      setImpStep('check');
    } catch (e) {
      setImpErr(e instanceof Error ? e.message : '解析失败，请确认文件格式');
    }
  };

  const onPickFile = async (f: File) => {
    setImpBusy(true);
    setImpErr('');
    setImpFileName(f.name);
    try { acceptGrid(await readTableFile(f)); }
    catch (e) { setImpErr(e instanceof Error ? e.message : '读取文件失败'); }
    finally { setImpBusy(false); }
  };

  /** 文件里每行 ↔ 人员档案的匹配结果（重名时优先取已在目标项目的那个） */
  const impRows = useMemo(() => {
    if (!impGrid) return [];
    return impGrid.rows.map((r) => {
      const cands = workers.filter((w) => w.name === r.name);
      const hit = cands.find((w) => w.proj === impProj) ?? cands[0] ?? null;
      const days = sumMarks(r.marks);
      const fileNum = Number(r.fileDays);
      const daysBad = r.fileDays !== '' && Number.isFinite(fileNum) && Math.abs(fileNum - days) > 0.05;
      return {
        r, hit, days, daysBad,
        dup: cands.length > 1,
        projDiff: !!hit && !!impProj && hit.proj !== impProj,
      };
    });
  }, [impGrid, workers, impProj]);

  const impStat = useMemo(() => ({
    matched: impRows.filter((x) => x.hit).length,
    miss: impRows.filter((x) => !x.hit).length,
    dup: impRows.filter((x) => x.dup).length,
    daysBad: impRows.filter((x) => x.daysBad).length,
    projDiff: impRows.filter((x) => x.projDiff).length,
    badSym: impGrid ? impGrid.rows.reduce((a, r) => a + r.bad.length, 0) : 0,
  }), [impRows, impGrid]);

  const impDays = impGrid?.days ?? 31;

  const doImport = () => {
    if (!impGrid) return;
    if (!impYm) { toast('请选择考勤月份'); return; }
    if (!impProj) { toast('请选择这批考勤属于哪个项目'); return; }
    if (impAutoNew && !impTeam) { toast('自动建档需要先选一个班组（没有可选班组请先去「班组管理」启用一个）'); return; }
    const entries: { workerId: string; marks: Record<number, string> }[] = [];
    let created = 0;
    impRows.forEach(({ r, hit }) => {
      if (hit) { entries.push({ workerId: hit.id, marks: r.marks }); return; }
      if (!impAutoNew) return;
      /* 自动建档：班组 / 工种由用户在弹窗里指定 —— 不猜工种，猜错了人工成本就错了 */
      const id = nextAttWorkerNo();
      addAttWorker({
        id, name: r.name, trade: impTrade, teamId: impTeam, phone: '',
        status: '在册', proj: impProj, marksByMonth: {},
        dispatches: [{ at: TODAY, fromProjId: '', toProjId: impProj, by: '蓝峰', note: `${impYm} 考勤导入建档` }],
      });
      entries.push({ workerId: id, marks: r.marks });
      created++;
    });
    if (!entries.length) { toast('没有可导入的人员：文件里的姓名在人员档案里都找不到'); return; }
    importAttMonth(impYm, entries, impProj, impDispatch);
    setImpOpen(false);
    setYm(impYm);
    toast(`已导入 ${impYm} 考勤 · ${entries.length} 人${created ? `（含新建档 ${created} 人）` : ''}，人工成本已按新出勤重算`);
  };

  const MAIN_TABS = [
    { key: 'sheet', label: '月度考勤表' },
    { key: 'team', label: '班组管理', cnt: teams.length },
    { key: 'worker', label: '人员档案', cnt: onDuty },
    { key: 'rate', label: '岗位单价', cnt: rates.length },
    { key: 'cost', label: '人工成本汇总' },
  ];

  /* ---- 班组管理列表列（编号列 hide：行身份由「班组名称」承担，名称冻结） ---- */
  const teamCols: Col<AttTeam>[] = [
    { key: 'name', title: '班组名称', sticky: 'left', width: 220, render: (t) => (
      <span><b>{t.name}</b><span style={{ marginLeft: 6 }}><Tag tone={t.status === '启用' ? 'green' : 'gray'}>{t.status}</Tag></span></span>
    ) },
    { key: 'id', title: '班组编号', hide: true },
    { key: 'laborUnit', title: '劳务单位', width: 220, hideSm: true },
    { key: 'leader', title: '班组长', width: 100 },
    { key: 'trade', title: '主要工种', width: 130, hideSm: true, render: (t) => <Tag tone="gray">{t.trade}</Tag> },
    { key: 'cnt', title: '在册人数', width: 100, align: 'right', render: (t) => (
      <b className="num">{workers.filter((w) => w.teamId === t.id && w.status === '在册').length}</b>
    ) },
    { key: 'projs', title: '在场项目', width: 100, align: 'right', hideSm: true, render: (t) => (
      <span className="num">{new Set(workers.filter((w) => w.teamId === t.id && w.status === '在册' && w.proj).map((w) => w.proj)).size}</span>
    ) },
    { key: 'note', title: '备注', hideSm: true, render: (t) => <span className="nc-cell-sub">{t.note || '—'}</span> },
    { key: 'op', title: '操作', width: 150, render: (t) => (
      <>
        <Op onClick={() => openEditTeam(t)}>编辑</Op>
        <OpSep />
        <Op onClick={() => doToggleTeam(t)} danger={t.status === '启用'}>{t.status === '启用' ? '停用' : '启用'}</Op>
      </>
    ) },
  ];

  /* ---- 人员档案列表列 ---- */
  const workerCols: Col<AttWorker>[] = [
    { key: 'name', title: '姓名', sticky: 'left', width: 150, render: (w) => (
      <span><b>{w.name}</b><span style={{ marginLeft: 6 }}><Tag tone={w.status === '在册' ? 'green' : 'gray'}>{w.status}</Tag></span></span>
    ) },
    { key: 'id', title: '人员号', hide: true },
    { key: 'trade', title: '岗位 / 工种', width: 140, render: (w) => <Tag tone="gray">{w.trade}</Tag> },
    { key: 'teamId', title: '所属班组', width: 180, render: (w) => attTeamNameOf(w.teamId) },
    { key: 'proj', title: '当前项目', width: 250, render: (w) => (w.proj
      ? <EntityLink target="project-center" id={w.proj} go={go} title="下钻到项目详情">{w.proj} {projNameOf(w.proj)}</EntityLink>
      : <Tag tone="orange">未派工</Tag>) },
    { key: 'phone', title: '联系电话', width: 130, hideSm: true, render: (w) => <span className="num">{w.phone || '—'}</span> },
    { key: 'days', title: '当月出勤', width: 100, align: 'right', render: (w) => (
      <b className="num">{attDays(w, ym, monthDays)}</b>
    ) },
    { key: 'cost', title: '当月人工成本', width: 130, align: 'right', hideSm: true, render: (w) => (
      <span className="num">{money ? fmt(Math.round(attDays(w, ym, monthDays) * rateOf(w.trade))) : '—'}</span>
    ) },
    { key: 'op', title: '操作', width: 190, render: (w) => (
      <>
        <Op onClick={() => openEditWorker(w)}>编辑</Op>
        <OpSep />
        <Op onClick={() => openDispatch(w)} disabled={w.status !== '在册'} title={w.status !== '在册' ? '已离场人员不参与派工' : '改派到另一个项目（留痕）'}>派工</Op>
        <OpSep />
        <Op onClick={() => doToggleWorker(w)} danger={w.status === '在册'}>{w.status === '在册' ? '离场' : '复职'}</Op>
      </>
    ) },
  ];

  const exportFields: ExportField[] = [
    { key: 'name', label: '姓名' },
    { key: 'trade', label: '岗位/工种' },
    { key: 'teamName', label: '所属班组' },
    { key: 'proj', label: '当前项目' },
    { key: 'days', label: '出勤天数' },
    { key: 'cost', label: '人工成本' },
  ];
  const exportApi = useExport({
    pageKey: 'attendance', pageName: '考勤表',
    fields: exportFields, defaultFieldKeys: exportFields.map((f) => f.key),
    totalCount: list.length, filteredCount: list.length, selectedCount: attendanceSel.length,
    previewRows: list.slice(0, 5),
    userName: getUserName(role),
    onExport: (cfg) => toast(`已导出考勤表（${cfg.format}·${cfg.scope === 'all' ? '全部' : cfg.scope === 'filtered' ? '当前筛选' : `勾选${attendanceSel.length}条`}·${list.length} 人）`),
  });
  /* ============ 各页签列表分页：主列表一律带分页 + 总计数（列表页布局规范） ============ */
  const teamPaged = usePaged(teamList);
  const workerPaged = usePaged(workerList);
  const ratePaged = usePaged(byTrade);
  /* 矩阵按人分页：日列保持横向滚动，表尾统一 TableFoot */
  const sheetPages = Math.max(1, Math.ceil(list.length / sheetSize));
  const sheetCur = Math.min(sheetPage, sheetPages);
  const pageList = list.slice((sheetCur - 1) * sheetSize, sheetCur * sheetSize);

  return (
    <>
      <PageHead
        crumbs={['履约交付', '考勤管理']}
        title="考勤管理"
        badges={<>
          <Tag tone="blue">{cur.y} 年 {cur.m} 月</Tag>
          <Tag tone="orange">在册 {onDuty} 人</Tag>
          <Tag tone="gray">班组 {teams.length}</Tag>
        </>}
        sub={<span>外包用工月度考勤与人工成本<Tip w={360} text="出勤天数 = Σ 符号值（√ 1 · 半 0.5 · 加 1.5）；人工成本 = 出勤天数 × 岗位单价，按「项目 + 班组」归属外包成本。" /></span>}
        actions={<>
          <Btn onClick={() => setTab('team')}><Ico n="users" size={16} /> 班组管理</Btn>
          <Btn onClick={() => setTab('worker')}><Ico n="user" size={16} /> 人员档案</Btn>
          <Btn onClick={() => setTab('rate')}><Ico n="edit" size={16} /> 岗位单价</Btn>
        </>}
      />

      <div className="nc-tiles nc-tiles-4">
        <Tile label={`在场人数（${cur.m} 月 ${vd} 日）`} value={onSite} tone="orange"
          tip="当日有出勤标记且非「假」计为在场" sub={`已过 ${elapsed} 天`} />
        <Tile label="本月出勤天数" value={totalDays}
          tip="Σ 符号值：√ 1 天 · 半 0.5 · 加 1.5" sub="工日" />
        <Tile label="外包人工成本" value={money ? (totalCost >= 10000 ? fmtWan(totalCost) : fmt(totalCost)) : '—'}
          tip="出勤天数 × 岗位单价，计入项目成本" sub="计入项目成本" />
        <Tile label="在用岗位" value={byTrade.length} sub={`${rates.length} 个单价在册`} />
      </div>

      <Card flush>
        <div style={{ padding: '12px 16px 0' }}>
          <Tabs value={tab} onChange={setTab} items={MAIN_TABS} />
        </div>

        {/* ============ 月度考勤表 ============ */}
        {tab === 'sheet' && (
          <div style={{ padding: 16 }}>
            <div className="nc-atd-toolbar">
              <span className="nc-ltlbl" style={{ width: 'auto' }}>考勤月份</span>
              <input className="nc-input" type="month" style={{ width: 130 }} value={ym} disabled={editing}
                title={editing ? '编辑中不可切换月份（改动清单按当前月份比对）' : '切换考勤所属年月（矩阵天数随月份变化）'}
                onChange={(e) => { if (e.target.value) setYm(e.target.value); }} />
              <span className="nc-ltlbl" style={{ width: 'auto' }}>查看日期</span>
              <input className="nc-input" type="date" style={{ width: 150 }} disabled={editing}
                value={toYmd(cur.y, cur.m, vd)}
                min={toYmd(cur.y, cur.m, 1)} max={toYmd(cur.y, cur.m, monthDays)}
                title="选定某一天：上方「在场人数」按该日统计，表中该日整列高亮"
                onChange={(e) => { const v = Number(e.target.value.slice(-2)); if (v) setDay(v); }} />
              <ProjectPicker
                value={projF === '全部' ? '' : projF} onChange={(id) => setProjF(id || '全部')}
                scope="all" clearLabel="全部项目" placeholder="全部项目" width={230}
              />
              <select className="nc-input" style={{ width: 190 }} value={teamF} onChange={(e) => setTeamF(e.target.value)}
                title="按班组筛选考勤（班组在「班组管理」页签维护）">
                <option value="全部">全部班组</option>
                {teams.map((t) => <option key={t.id} value={t.id}>{t.name}{t.status === '停用' ? '（已停用）' : ''}</option>)}
              </select>
              <Btn kind="link" size="sm" onClick={() => { setProjF('全部'); setTeamF('全部'); }}>重置</Btn>
              <span className="nc-cell-sub" style={{ marginLeft: 'auto' }}>
                符号口径<Tip w={300} text="√ 出勤 1 天 · 半 0.5 天 · 加 1.5 天 · 休 现场休息不计考勤 · 假 离开现场 · 空 未在现场。格子默认只读，点「编辑考勤」后才可点击切换。" />
              </span>
              <OpMore items={[{
                label: <><Ico n="upload" size={16} /> 导入考勤</>,
                disabled: editing,
                title: editing ? '请先保存或取消当前编辑' : '导入《考勤记录表》（.xlsx / .csv / 直接粘贴表格内容）',
                onClick: () => { if (!editing) openImport(); },
              }]} />
              {!editing ? (
                <>
                  <ExportButton onClick={exportApi.trigger} selectedCount={attendanceSel.length} />
                  <Btn onClick={startEdit} title="进入编辑状态后才能修改格子（避免误触）"><Ico n="edit" size={16} /> 编辑考勤</Btn>
                </>
              ) : (
                <>
                  <Btn onClick={() => (changes.length ? setConfirm('cancel') : dropEdit())} title="放弃本次未保存的改动">取消</Btn>
                  <ExportButton onClick={exportApi.trigger} selectedCount={attendanceSel.length} />
                  <Btn kind="primary" onClick={() => (changes.length ? setConfirm('save') : toast('没有需要保存的改动'))}
                    title="保存前会逐条列出改动清单供确认">
                    <Ico n="check" size={16} /> 保存{changes.length ? `（${changes.length} 处）` : ''}
                  </Btn>
                </>
              )}
            </div>

            {editing && (
              <Banner tone="warn">
                正在编辑考勤：点击格子循环切换符号，改动<b>尚未保存</b>（已改 {changes.length} 处）。改完点「保存」，会先列出改动清单让你确认。
              </Banner>
            )}

            {!hasData ? (
              <div className="nc-empty-mini">
                {cur.y} 年 {cur.m} 月暂无考勤记录。可点上方「导入考勤」把该月的《考勤记录表》导进来，
                或
                <Btn kind="link" size="sm" onClick={() => { setYm(BASE_YM); setDay(BASE.d); }}>回到 {BASE.y} 年 {BASE.m} 月</Btn>
              </div>
            ) : list.length ? (
              <>
              <div className="nc-atd-wrap">
                <table className="nc-tbl nc-atd-tbl" style={{ minWidth: 1240 }}>
                  <thead>
                    <tr>
<th style={{ width: 36 }} className="is-center"><input type="checkbox" className="nc-check" checked={list.length > 0 && list.every((w) => attendanceSel.includes(w.id))} onChange={() => setAttendanceSel((prev) => list.every((w) => prev.includes(w.id)) ? prev.filter((id) => !list.some((w) => w.id === id)) : Array.from(new Set([...prev, ...list.map((w) => w.id)])))} /></th>
                      <th style={{ width: 40 }}>序</th>
                      <th style={{ width: 160 }}>姓名 / 岗位</th>
                      {Array.from({ length: monthDays }, (_, i) => {
                        const dd = i + 1;
                        return (
                          <th key={dd} style={{ width: 26 }}
                            className={`is-center is-day${dd > elapsed ? ' is-future' : ''}${dd === vd ? ' is-sel' : ''}`}
                            title={`查看 ${cur.m} 月 ${dd} 日`}
                            onClick={() => setDay(dd)}>{dd}</th>
                        );
                      })}
                      <th style={{ width: 72 }} className="is-num">出勤</th>
                      <th style={{ width: 96 }} className="is-num">岗位单价</th>
                      <th style={{ width: 108 }} className="is-num">人工成本</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageList.map((w, i) => {
                      const wd = daysOf(w);
                      const r = rateOf(w.trade);
                      const wm = attMarksOf(w, ym);
                      return (
                        <tr key={w.id}>
                          <td className="is-center"><input type="checkbox" className="nc-check" checked={attendanceSel.includes(w.id)} onChange={() => setAttendanceSel((prev) => prev.includes(w.id) ? prev.filter((x) => x !== w.id) : [...prev, w.id])} /></td>
                          <td className="num">{(sheetCur - 1) * sheetSize + i + 1}</td>
                          <td>
                            <b>{w.name}</b>
                            <span style={{ marginLeft: 6 }}><Tag tone="gray">{w.trade} · {attTeamNameOf(w.teamId)}</Tag></span>
                          </td>
                          {Array.from({ length: monthDays }, (_, k) => {
                            const dd = k + 1;
                            const mk = wm[dd] ?? '';
                            const cls = mk === '√' ? ' is-on' : mk === '半' ? ' is-half' : mk === '加' ? ' is-plus'
                              : mk === '假' ? ' is-off' : mk === '休' ? ' is-rest' : '';
                            const label = ATT_MARKS.find((m) => m.k === mk)?.label ?? '未在现场';
                            return (
                              <td
                                key={dd}
                                className={`nc-atd-cell${cls}${dd === vd ? ' is-selday' : ''}${editing ? '' : ' is-locked'}`}
                                onClick={editing ? () => cycleMark(w.id, dd) : undefined}
                                title={`${w.name} · ${cur.m} 月 ${dd} 日：${label}${editing ? ' · 点击切换' : '（只读 · 点「编辑考勤」后可修改）'}`}
                              >
                                {mk || '·'}
                              </td>
                            );
                          })}
                          <td className="is-num num"><b>{wd}</b></td>
                          <td className="is-num num nc-muted">{r >= 10000 ? fmtWan(r) : fmt(r)}</td>
                          <td className="is-num num"><b>{money ? (wd * r >= 10000 ? fmtWan(Math.round(wd * r)) : fmt(Math.round(wd * r))) : '—'}</b></td>
                        </tr>
                      );
                    })}
                    <tr className="nc-atd-sum">
                      <td colSpan={3}><b>合计（{list.length} 人）</b></td>
                      {Array.from({ length: monthDays }, (_, i) => <td key={i} />)}
                      <td className="is-num num"><b>{totalDays}</b></td>
                      <td />
                      <td className="is-num num"><b>{money ? (totalCost >= 10000 ? fmtWan(totalCost) : fmt(totalCost)) : '—'}</b></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <TableFoot unit="人" total={list.length} page={sheetCur} pageSize={sheetSize}
                onPage={(p) => setSheetPage(p)} onPageSize={(n) => { setSheetSize(n); setSheetPage(1); }} />
              </>
            ) : (
              <div className="nc-empty-mini">
                当前筛选下无在册人员的考勤记录。请调整项目 / 班组筛选，或到「人员档案」新增人员并派工。
              </div>
            )}
          </div>
        )}

        {/* ============ 班组管理（考勤归属主数据） ============ */}
        {tab === 'team' && (
          <div style={{ padding: 16 }}>
            <ListToolbar
              rows={[{
                label: '状态', value: teamSt, onChange: setTeamSt,
                items: [
                  { key: '全部', label: '全部', cnt: teams.length },
                  { key: '启用', label: '启用', cnt: teams.filter((t) => t.status === '启用').length },
                  { key: '停用', label: '停用', cnt: teams.filter((t) => t.status === '停用').length },
                ],
              }]}
              search={{ value: teamKw, onChange: setTeamKw, placeholder: '搜索班组 / 劳务单位 / 班组长', width: 260 }}
              onReset={() => { setTeamKw(''); setTeamSt('全部'); }}
              actions={<Btn kind="primary" onClick={openNewTeam}><Ico n="plus" size={16} /> 新增班组</Btn>}
            />
            <DataTable cols={teamCols} rows={teamPaged.paged} rowKey={(t) => t.id} minWidth={980}
              empty="没有匹配的班组" foot={teamPaged.foot} />
          </div>
        )}

        {/* ============ 人员档案（挂班组 · 项目归属由派工决定） ============ */}
        {tab === 'worker' && (
          <div style={{ padding: 16 }}>
            <ListToolbar
              rows={[
                {
                  label: '班组', value: wTeamF, onChange: setWTeamF,
                  items: [
                    { key: '全部', label: '全部', cnt: workers.length },
                    ...teams.map((t) => ({ key: t.id, label: t.name, cnt: workers.filter((w) => w.teamId === t.id).length })),
                  ],
                },
                {
                  label: '状态', value: wStF, onChange: setWStF,
                  items: [
                    { key: '全部', label: '全部', cnt: workers.length },
                    { key: '在册', label: '在册', cnt: workers.filter((w) => w.status === '在册').length },
                    { key: '已离场', label: '已离场', cnt: workers.filter((w) => w.status === '已离场').length },
                  ],
                },
              ]}
              search={{ value: wKw, onChange: setWKw, placeholder: '搜索姓名 / 人员号 / 工种', width: 240 }}
              onReset={() => { setWKw(''); setWTeamF('全部'); setWStF('全部'); }}
              actions={<Btn kind="primary" onClick={openNewWorker}><Ico n="plus" size={16} /> 新增人员</Btn>}
            />
            <DataTable cols={workerCols} rows={workerPaged.paged} rowKey={(w) => w.id} minWidth={1180}
              empty="没有匹配的考勤人员" foot={workerPaged.foot} />
          </div>
        )}

        {/* ============ 岗位单价 ============ */}
        {tab === 'rate' && (
          <div style={{ padding: 16 }}>
            <table className="nc-tbl" style={{ minWidth: 620 }}>
              <thead><tr>
                <th>岗位 / 工种</th>
                <th style={{ width: 130 }} className="is-num">单价（元 / 工日）</th>
                <th style={{ width: 110 }} className="is-num">在册人数</th>
                <th style={{ width: 130 }} className="is-num">本月人工成本</th>
                <th style={{ width: 90 }}>操作</th>
              </tr></thead>
              <tbody>
                {ratePaged.paged.map((r) => (
                  <tr key={r.trade}>
                    <td><b>{r.trade}</b></td>
                    <td className="is-num num">{fmt(r.rate)}</td>
                    <td className="is-num num">{r.cnt}</td>
                    <td className="is-num num">{money ? fmt(r.cost) : '—'}</td>
                    <td><Op onClick={() => { setRateEdit({ trade: r.trade, rate: r.rate }); setRateVal(String(r.rate)); }}>调整单价</Op></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ratePaged.foot}

            {rateLog.length > 0 && (
              <>
                <div className="nc-sec-title" style={{ marginTop: 16 }}>单价调整留痕（{rateLog.length}）</div>
                <table className="nc-tbl" style={{ minWidth: 520 }}>
                  <thead><tr><th>岗位</th><th style={{ width: 170 }}>旧值 → 新值</th><th style={{ width: 130 }}>时间</th></tr></thead>
                  <tbody>
                    {rateLog.map((h, i) => (
                      <tr key={i}>
                        <td>{h.trade}</td>
                        <td className="num">{fmt(h.old)} → <b>{fmt(h.nu)}</b></td>
                        <td className="nc-tiny nc-muted">{h.t}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* ============ 人工成本汇总 ============ */}
        {tab === 'cost' && (
          <div style={{ padding: 16 }}>
            {noProj > 0 && (
              <div className="nc-listhint" style={{ marginBottom: 10 }}>
                <span>未派工 {noProj} 人<Tip w={340} text="人员档案里已建档但还没派工的人，不计入任何项目的成本归属。到「人员档案 · 派工」指派项目后，即按该项目归集人工成本。" /></span>
              </div>
            )}
            <div className="nc-sec-title">按项目汇总（外包成本归属）</div>
            <table className="nc-tbl" style={{ minWidth: 720 }}>
              <thead><tr>
                <th style={{ width: 120 }}>项目编号</th>
                <th>项目名称</th>
                <th style={{ width: 100 }} className="is-num">用工人数</th>
                <th style={{ width: 110 }} className="is-num">出勤天数</th>
                <th style={{ width: 130 }} className="is-num">人工成本</th>
                <th style={{ width: 100 }}>操作</th>
              </tr></thead>
              <tbody>
                {byProj.map((r) => (
                  <tr key={r.id}>
                    <td className="num nc-id-cell"><EntityLink target="project-center" id={r.id} go={go} title="下钻到项目详情">{r.id}</EntityLink></td>
                    <td>{r.name}</td>
                    <td className="is-num num">{r.cnt}</td>
                    <td className="is-num num">{r.days}</td>
                    <td className="is-num num"><b>{money ? fmt(r.cost) : '—'}</b></td>
                    <td><Op onClick={() => { setProjF(r.id); setTab('sheet'); }}>查看考勤</Op></td>
                  </tr>
                ))}
                <tr className="nc-atd-sum">
                  <td colSpan={2}><b>合计（{byProj.length} 个项目）</b></td>
                  <td className="is-num num"><b>{byProj.reduce((a, r) => a + r.cnt, 0)}</b></td>
                  <td className="is-num num"><b>{Math.round(byProj.reduce((a, r) => a + r.days, 0) * 10) / 10}</b></td>
                  <td className="is-num num"><b>{money ? fmt(byProj.reduce((a, r) => a + r.cost, 0)) : '—'}</b></td>
                  <td />
                </tr>
              </tbody>
            </table>
            <TableFoot total={byProj.length} page={1} pageSize={byProj.length} unit="个项目" />

            <div className="nc-sec-title" style={{ marginTop: 16 }}>按岗位汇总</div>
            <table className="nc-tbl" style={{ minWidth: 720 }}>
              <thead><tr>
                <th>岗位 / 工种</th>
                <th style={{ width: 130 }} className="is-num">单价</th>
                <th style={{ width: 100 }} className="is-num">人数</th>
                <th style={{ width: 110 }} className="is-num">出勤天数</th>
                <th style={{ width: 130 }} className="is-num">人工成本</th>
              </tr></thead>
              <tbody>
                {byTrade.map((r) => (
                  <tr key={r.trade}>
                    <td><b>{r.trade}</b></td>
                    <td className="is-num num">{fmt(r.rate)}</td>
                    <td className="is-num num">{r.cnt}</td>
                    <td className="is-num num">{r.days}</td>
                    <td className="is-num num"><b>{money ? fmt(r.cost) : '—'}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <TableFoot total={byTrade.length} page={1} pageSize={byTrade.length} unit="个岗位" />

            <div className="nc-listhint" style={{ marginTop: 12 }}>
              <span>成本口径<Tip w={340} text="外包人工成本 = Σ（个人出勤天数 × 岗位单价）；本页为考勤口径的人工成本，登记成本（CB）时可按项目引用本金额，避免重复计入。" /></span>
            </div>
          </div>
        )}
      </Card>

      {/* ============ 导入考勤（选文件 → 核对 → 落库） ============ */}
      <Modal open={impOpen} onClose={() => setImpOpen(false)} width={impStep === 'pick' ? 720 : 980}
        title={impStep === 'pick' ? '导入考勤 · 选择文件' : '导入考勤 · 核对'}
        foot={impStep === 'pick' ? (
          <>
            <Btn onClick={() => setImpOpen(false)}>取消</Btn>
            <Btn kind="primary" disabled={!impText.trim()} onClick={() => acceptGrid(parseDelimited(impText))}>
              <Ico n="check" size={16} /> 解析粘贴内容
            </Btn>
          </>
        ) : (
          <>
            <Btn onClick={() => setImpStep('pick')}>返回上一步</Btn>
            <Btn kind="primary" onClick={doImport}>
              <Ico n="check" size={16} /> 确认导入（{impStat.matched + (impAutoNew ? impStat.miss : 0)} 人）
            </Btn>
          </>
        )}>

        {/* ---------- 第一步：选文件 ---------- */}
        {impStep === 'pick' && (
          <>
            <Banner tone="info">
              支持 <b>.xlsx</b>（Excel 工作簿）与 <b>.csv</b>；也可以在 Excel 里选中整块 <b>Ctrl+C</b>，
              粘到下面的框里直接解析。
            </Banner>
            <div
              className={`nc-dropzone${impDrag ? ' is-drag' : ''}`}
              onClick={() => impFileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setImpDrag(true); }}
              onDragLeave={() => setImpDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setImpDrag(false);
                const f = e.dataTransfer.files?.[0];
                if (f) void onPickFile(f);
              }}
            >
              <Ico n="upload" size={16} /> {impBusy ? '正在解析…' : '点击选择文件，或把文件拖到这里'}
              <div className="nc-cell-sub">.xlsx / .xlsm / .csv / .txt · 单文件 ≤ 5MB</div>
              <input ref={impFileRef} type="file" accept=".xlsx,.xlsm,.csv,.txt" style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void onPickFile(f); e.target.value = ''; }} />
            </div>
            {impFileName && !impErr && <div className="nc-cell-sub" style={{ marginTop: -4 }}>已选文件：{impFileName}</div>}

            <Field label="或粘贴表格内容" span={2}>
              <textarea className="nc-input" rows={5} value={impText}
                placeholder="在 Excel 里选中「序号 / 姓名 / 出勤天数 / 1…31」整块，Ctrl+C 后粘到这里"
                onChange={(e) => setImpText(e.target.value)} />
            </Field>
            {impErr && <Banner tone="danger">{impErr}</Banner>}

            <div className="nc-sec-title" style={{ margin: '14px 0 8px' }}>文件格式</div>
            <table className="nc-tbl" style={{ minWidth: 480 }}>
              <thead><tr><th style={{ width: 100 }}>位置</th><th>内容</th></tr></thead>
              <tbody>
                <tr><td>第 1 行</td><td>标题：项目名 + 考勤记录表（用于反查项目）</td></tr>
                <tr><td>第 2 行</td><td>月份：如「月份：2026年8月」，以及符号说明</td></tr>
                <tr><td>第 3 行</td><td>表头：序号 · 姓名 · 出勤天数 · 1 · 2 · … · 31</td></tr>
                <tr><td>第 4 行起</td><td>每人一行：序号 · 姓名 · 出勤天数 · 每日符号</td></tr>
              </tbody>
            </table>
            <div className="nc-listhint" style={{ marginTop: 10 }}>
              <span>符号口径<Tip w={360} text="√ 出勤 1 天 · 半 0.5 天 · 加 1.5 天 · 休 现场休息不计考勤 · 假 离开现场 · 空格 未在现场。与页面口径完全一致，无需转换。" /></span>
            </div>
            <div className="nc-cell-sub" style={{ marginTop: 6 }}>
              标题行、说明行、空行都可以有多余的，表头按「姓名 + 出勤天数」自动定位；
              「出勤天数」列会被重新核算并与文件里的值比对。
            </div>
          </>
        )}

        {/* ---------- 第二步：核对 ---------- */}
        {impStep === 'check' && impGrid && (
          <>
            <Banner tone="info">
              已读取 <b>{impGrid.rows.length}</b> 人
              {impGrid.projName ? <>，标题识别为「<b>{impGrid.projName}</b>」</> : null}
              {impGrid.ym ? <>，月份 <b>{impGrid.ym}</b></> : null}。
              请确认归属，再核对下面的逐日符号。
            </Banner>
            {impGrid.warns.map((w, i) => <Banner key={i} tone="warn">{w}</Banner>)}

            <div className="nc-form-grid">
              <Field label="考勤月份" req tip="导入会把该月已有的考勤整月覆盖（只影响这批人）" tipW={300}>
                <input className="nc-input" type="month" value={impYm} onChange={(e) => setImpYm(e.target.value)} />
              </Field>
              <Field label="归属项目" req tip="标题里的项目名会自动反查；认不出时请手动选择" tipW={300}>
                <ProjectPicker value={impProj} onChange={setImpProj} scope="all"
                  placeholder="选择这批考勤属于哪个项目" />
              </Field>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', margin: '12px 0 4px' }}>
              <span className="nc-ltlbl" style={{ width: 'auto' }}>核对结果</span>
              <Tag tone="green">匹配 {impStat.matched} 人</Tag>
              {impStat.miss > 0 && <Tag tone="orange">未匹配 {impStat.miss} 人</Tag>}
              {impStat.daysBad > 0 && <Tag tone="gold">出勤天数不符 {impStat.daysBad} 人</Tag>}
              {impStat.badSym > 0 && <Tag tone="red">符号认不出 {impStat.badSym} 处</Tag>}
              {impStat.dup > 0 && <Tag tone="blue">同名 {impStat.dup} 人</Tag>}
              {impStat.projDiff > 0 && <Tag tone="purple">不在该项目 {impStat.projDiff} 人</Tag>}
            </div>

            {impStat.miss > 0 && (
              <div className="nc-field" style={{ marginTop: 8 }}>
                <Check checked={impAutoNew} onChange={setImpAutoNew}
                  label={`为未匹配的 ${impStat.miss} 人自动建档（需指定班组与工种，不会替你猜）`} />
                {impAutoNew && (
                  <div className="nc-form-grid" style={{ marginTop: 8 }}>
                    <Field label="建档班组" req>
                      <select className="nc-input" value={impTeam} onChange={(e) => setImpTeam(e.target.value)}>
                        <option value="">请选择班组</option>
                        {teams.map((t) => (
                          <option key={t.id} value={t.id} disabled={t.status === '停用'}>
                            {t.name}{t.status === '停用' ? '（已停用）' : ''}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="建档工种" req tip="工种决定人工单价，务必选对" tipW={260}>
                      <select className="nc-input" value={impTrade} onChange={(e) => setImpTrade(e.target.value)}>
                        {LABOR_RATES.map((r) => <option key={r.trade}>{r.trade}</option>)}
                      </select>
                    </Field>
                  </div>
                )}
              </div>
            )}

            {impStat.projDiff > 0 && (
              <div className="nc-field" style={{ marginTop: 8 }}>
                <Check checked={impDispatch} onChange={setImpDispatch}
                  label={`把这 ${impStat.projDiff} 人一并派工到「${impProj}」（写入派工留痕；不勾选则只导考勤、不改项目归属）`} />
              </div>
            )}

            <div className="nc-sec-title" style={{ margin: '14px 0 8px' }}>
              逐日符号核对（{impGrid.rows.length} 人 · {impDays} 天）
            </div>
            <div className="nc-atd-wrap" style={{ maxHeight: 340 }}>
              <table className="nc-tbl nc-atd-tbl" style={{ minWidth: 470 + impDays * 26 }}>
                <thead>
                  <tr>
                    <th style={{ width: 90 }}>姓名</th>
                    <th style={{ width: 88 }}>匹配</th>
                    <th style={{ width: 200 }}>当前项目</th>
                    <th style={{ width: 64 }} className="is-num">文件</th>
                    <th style={{ width: 84 }} className="is-num">重算</th>
                    {Array.from({ length: impDays }, (_, i) => (
                      <th key={i} style={{ width: 26 }} className="is-center">{i + 1}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {impRows.map(({ r, hit, days, daysBad }, i) => (
                    <tr key={`${r.name}-${i}`} style={hit ? undefined : { opacity: 0.55 }}>
                      <td><b>{r.name}</b></td>
                      <td>{hit
                        ? <Tag tone="green">已匹配</Tag>
                        : <Tag tone={impAutoNew ? 'blue' : 'orange'}>{impAutoNew ? '将建档' : '未匹配'}</Tag>}</td>
                      <td className="nc-cell-sub">{hit
                        ? (hit.proj ? `${hit.proj} ${projNameOf(hit.proj)}` : '未派工')
                        : '—'}</td>
                      <td className="is-num num">{r.fileDays || '—'}</td>
                      <td className="is-num num">
                        <b>{days}</b>{daysBad && <Tag tone="gold">不符</Tag>}
                      </td>
                      {Array.from({ length: impDays }, (_, k) => {
                        const dd = k + 1;
                        const mk = r.marks[dd] ?? '';
                        const bad = r.bad.find((b) => b.d === dd);
                        const cls = bad ? ' is-off'
                          : mk === '√' ? ' is-on' : mk === '半' ? ' is-half' : mk === '加' ? ' is-plus'
                          : mk === '假' ? ' is-off' : mk === '休' ? ' is-rest' : '';
                        return (
                          <td key={dd} className={`nc-atd-cell is-locked${cls}`}
                            title={bad ? `认不出的符号：${bad.raw}` : `${r.name} · ${dd} 日：${mk || '未在现场'}`}>
                            {bad ? '?' : (mk || '·')}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="nc-listhint" style={{ marginTop: 10 }}>
              <span>覆盖说明<Tip w={340} text="导入会把这批人的该月考勤整月覆盖（文件里空格 = 未在现场），其余月份与他人不受影响。人工成本按导入后的出勤天数 × 岗位单价重算。" /></span>
            </div>
          </>
        )}
      </Modal>

      {/* ============ 新增 / 编辑班组 ============ */}
      <Modal open={!!teamDraft} onClose={() => setTeamDraft(null)} width={580}
        title={teamDraft?.id ? `编辑班组 · ${teamDraft.name}` : '新增班组'}
        foot={<>
          <Btn onClick={() => setTeamDraft(null)}>取消</Btn>
          <Btn kind="primary" onClick={saveTeam}><Ico n="check" size={16} /> 保存</Btn>
        </>}>
        {teamDraft && (
          <>
            {!teamDraft.id && (
              <Banner tone="info">班组编号自动生成（<b>{nextAttTeamNo()}</b>），保存后不可改。</Banner>
            )}
            <div className="nc-form-grid">
              <Field label="班组名称" req span={2}>
                <input className="nc-input" value={teamDraft.name} placeholder="如：宏基劳务班组"
                  onChange={(e) => setTeamDraft({ ...teamDraft, name: e.target.value })} />
              </Field>
              <Field label="劳务单位" span={2}>
                <input className="nc-input" value={teamDraft.laborUnit} placeholder="外包公司名称；自有班组填「本公司」"
                  onChange={(e) => setTeamDraft({ ...teamDraft, laborUnit: e.target.value })} />
              </Field>
              <Field label="班组长">
                <input className="nc-input" value={teamDraft.leader}
                  onChange={(e) => setTeamDraft({ ...teamDraft, leader: e.target.value })} />
              </Field>
              <Field label="联系电话">
                <input className="nc-input" value={teamDraft.phone}
                  onChange={(e) => setTeamDraft({ ...teamDraft, phone: e.target.value })} />
              </Field>
              <Field label="主要工种">
                <select className="nc-input" value={teamDraft.trade}
                  onChange={(e) => setTeamDraft({ ...teamDraft, trade: e.target.value })}>
                  {LABOR_RATES.map((r) => <option key={r.trade}>{r.trade}</option>)}
                </select>
              </Field>
              <Field label="状态" tip="停用后不能再往该班组新增人员；已在册人员的归属保留" tipW={300}>
                <select className="nc-input" value={teamDraft.status}
                  onChange={(e) => setTeamDraft({ ...teamDraft, status: e.target.value as AttTeam['status'] })}>
                  {ATT_TEAM_STATUS.map((st) => <option key={st}>{st}</option>)}
                </select>
              </Field>
              <Field label="备注" span={2}>
                <input className="nc-input" value={teamDraft.note ?? ''} placeholder="如：长期合作，主做电气安装"
                  onChange={(e) => setTeamDraft({ ...teamDraft, note: e.target.value })} />
              </Field>
            </div>
          </>
        )}
      </Modal>

      {/* ============ 新增 / 编辑考勤人员 ============ */}
      <Modal open={!!wDraft} onClose={() => setWDraft(null)} width={580}
        title={wDraft?.id ? `编辑人员 · ${wDraft.name}` : '新增考勤人员'}
        foot={<>
          <Btn onClick={() => setWDraft(null)}>取消</Btn>
          <Btn kind="primary" onClick={saveWorker}><Ico n="check" size={16} /> 保存</Btn>
        </>}>
        {wDraft && (
          <>
            {!wDraft.id && (
              <Banner tone="info">人员号自动生成（<b>{nextAttWorkerNo()}</b>）。建档后到「派工」里指派项目。</Banner>
            )}
            <div className="nc-form-grid">
              <Field label="姓名" req>
                <input className="nc-input" value={wDraft.name}
                  onChange={(e) => setWDraft({ ...wDraft, name: e.target.value })} />
              </Field>
              <Field label="联系电话">
                <input className="nc-input" value={wDraft.phone}
                  onChange={(e) => setWDraft({ ...wDraft, phone: e.target.value })} />
              </Field>
              <Field label="岗位 / 工种" tip="决定人工单价（岗位单价在「岗位单价」页签维护）" tipW={300}>
                <select className="nc-input" value={wDraft.trade}
                  onChange={(e) => setWDraft({ ...wDraft, trade: e.target.value })}>
                  {LABOR_RATES.map((r) => <option key={r.trade}>{r.trade}</option>)}
                </select>
              </Field>
              <Field label="所属班组" req tip="班组是考勤归属主数据，在「班组管理」页签维护" tipW={300}>
                <select className="nc-input" value={wDraft.teamId}
                  onChange={(e) => setWDraft({ ...wDraft, teamId: e.target.value })}>
                  <option value="">请选择班组</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id} disabled={t.status === '停用' && t.id !== wDraft.teamId}>
                      {t.name}{t.status === '停用' ? '（已停用）' : ''}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="在册状态" span={2} tip="标记「已离场」后不再进考勤矩阵与人工成本" tipW={300}>
                <select className="nc-input" value={wDraft.status}
                  onChange={(e) => setWDraft({ ...wDraft, status: e.target.value as AttWorker['status'] })}>
                  {ATT_WORKER_STATUS.map((st) => <option key={st}>{st}</option>)}
                </select>
              </Field>
            </div>
          </>
        )}
      </Modal>

      {/* ============ 派工（换项目 · 只改归属并留痕） ============ */}
      <Modal open={!!dispW} onClose={() => setDispW(null)} width={640}
        title={`派工 · ${dispW?.name ?? ''}`}
        foot={<>
          <Btn onClick={() => setDispW(null)}>取消</Btn>
          <Btn kind="primary" onClick={saveDispatch}><Ico n="check" size={16} /> 确认派工</Btn>
        </>}>
        {dispW && (
          <>
            <Banner tone="info">
              派工只改「当前项目」并留痕，<b>人员档案与历史考勤原样保留</b>；外包人工成本按新项目归属。
            </Banner>
            <div className="nc-form-grid">
              <Field label="当前项目">
                <input className="nc-input" readOnly value={dispW.proj ? `${dispW.proj} ${projNameOf(dispW.proj)}` : '未派工'} />
              </Field>
              <Field label="当前班组">
                <input className="nc-input" readOnly value={attTeamNameOf(dispW.teamId)} />
              </Field>
              <Field label="改派到" req span={2}>
                <ProjectPicker value={dispProj} onChange={setDispProj} scope="all"
                  placeholder="选择要派往的项目（可按编号 / 名称 / 客户 / 类型搜索）" />
              </Field>
              <Field label="派工说明" span={2}>
                <input className="nc-input" value={dispNote} placeholder="如：安装班组增援 / 完工退场"
                  onChange={(e) => setDispNote(e.target.value)} />
              </Field>
            </div>
            <div className="nc-sec-title" style={{ margin: '12px 0 8px' }}>派工留痕（{dispW.dispatches.length}）</div>
            {dispW.dispatches.length ? (
              <table className="nc-tbl" style={{ minWidth: 440 }}>
                <thead><tr>
                  <th style={{ width: 110 }}>日期</th>
                  <th>原项目 → 新项目</th>
                  <th style={{ width: 90 }}>操作人</th>
                </tr></thead>
                <tbody>
                  {dispW.dispatches.map((d, i) => (
                    <tr key={i}>
                      <td className="num">{d.at}</td>
                      <td>
                        <span className="nc-muted">{d.fromProjId || '未派工'}</span>
                        <span className="nc-muted"> → </span>
                        <b>{d.toProjId || '退场'}</b>
                        {d.note && <span className="nc-cell-sub" style={{ marginLeft: 8 }}>{d.note}</span>}
                      </td>
                      <td>{d.by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <div className="nc-empty-mini">暂无派工记录。</div>}
          </>
        )}
      </Modal>

      {/* ============ 调整岗位单价 ============ */}
      <Modal open={!!rateEdit} onClose={() => setRateEdit(null)} width={480}
        title={`调整岗位单价 · ${rateEdit?.trade ?? ''}`}
        foot={<><Btn onClick={() => setRateEdit(null)}>取消</Btn><Btn kind="primary" onClick={() => {
          const v = Number(rateVal);
          if (!(v > 0)) { toast('单价须 > 0'); return; }
          if (rateEdit) {
            setRates((rs) => rs.map((r) => (r.trade === rateEdit.trade ? { ...r, rate: v } : r)));
            setRateLog((h) => [{ trade: rateEdit.trade, old: rateEdit.rate, nu: v, t: TODAY }, ...h]);
            toast(`${rateEdit.trade} 单价 ${fmt(rateEdit.rate)} → ${fmt(v)}（已留痕，人工成本已重算）`);
          }
          setRateEdit(null);
        }}>保存</Btn></>}>
        <Banner tone="warn">单价调整将<b>重算全部在册考勤</b>的人工成本并留痕（谁 / 何时 / 旧值 → 新值）。</Banner>
        <div className="nc-form-grid">
          <Field label="岗位 / 工种" span={2}><input className="nc-input" readOnly value={rateEdit?.trade ?? ''} /></Field>
          <Field label="当前单价" span={2}><input className="nc-input" readOnly value={rateEdit ? fmt(rateEdit.rate) : ''} /></Field>
          <Field label="新单价（元 / 工日）" req span={2}>
            <input className="nc-input" type="number" value={rateVal} onChange={(e) => setRateVal(e.target.value)} />
          </Field>
        </div>
      </Modal>

      {/* ============ 保存前二次确认（逐条列出改动清单） ============ */}
      <Modal open={confirm === 'save'} onClose={() => setConfirm('')} width={560}
        title={`确认保存考勤 · ${cur.y} 年 ${cur.m} 月`}
        foot={<>
          <Btn onClick={() => setConfirm('')}>返回修改</Btn>
          <Btn kind="primary" onClick={commit}><Ico n="check" size={16} /> 确认保存（{changes.length} 处）</Btn>
        </>}>
        <Banner tone="info">保存后将按新的出勤天数重算外包人工成本（出勤天数 × 岗位单价）。</Banner>
        <div className="nc-sec-title" style={{ margin: '12px 0 8px' }}>本次改动清单（{changes.length} 处）</div>
        <div style={{ maxHeight: 280, overflow: 'auto', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)' }}>
          <table className="nc-tbl" style={{ minWidth: 420 }}>
            <thead><tr>
              <th>姓名</th>
              <th style={{ width: 96 }} className="is-center">日期</th>
              <th style={{ width: 140 }} className="is-center">原 → 新</th>
            </tr></thead>
            <tbody>
              {changes.map((c) => (
                <tr key={`${c.id}-${c.d}`}>
                  <td>{c.name}</td>
                  <td className="is-center num">{cur.m} 月 {c.d} 日</td>
                  <td className="is-center">{c.from || '空'} <span className="nc-muted">→</span> <b>{c.to || '空'}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* ============ 放弃未保存改动前二次确认 ============ */}
      <Modal open={confirm === 'cancel'} onClose={() => setConfirm('')} width={480}
        title="放弃未保存的改动？"
        foot={<>
          <Btn onClick={() => setConfirm('')}>继续编辑</Btn>
          <Btn kind="danger" onClick={dropEdit}>放弃改动</Btn>
        </>}>
        <Banner tone="warn">本次编辑有 <b>{changes.length} 处</b>改动尚未保存，放弃后无法恢复。</Banner>
      </Modal>

      {/* ============ 导出考勤表（统一导出弹窗） ============ */}
      <ExportDialog {...exportApi.dialogProps} />
    </>
  );
}
