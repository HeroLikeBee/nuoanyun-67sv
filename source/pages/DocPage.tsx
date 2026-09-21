// 文档中心 —— 结构化资料库（分类导航 / 搜索 / 列表 / 详情）
// 核心：九大分类归集 · 关键字+标签+摘要检索 · 版本管理 · 竣工资料完整度 · 打包导出 · 在线发送（水印+有效期）
import React, { useEffect, useMemo, useState } from 'react';
import {
  Banner, Btn, Card, Code, DataTable, Drawer, Field, KvGrid, ListToolbar, Modal, Op, OpSep,
  PageHead, TableFoot, Tabs, Tag, Timeline, Tip, useToast, Check, Progress, EntityLink, type TagTone, ConfirmModal, pressProps,} from '../components/ui';
import {
  DOCS, DOC_CATS, DOC_STATUS, DOC_STAGES, DOC_VERSIONS, DOC_LOGS, PROJECTS, TODAY,
} from '../components/data';
import { setFocus } from '../components/store';
import { Ico, StatusIco, type IconName } from '../components/icons';

type D = (typeof DOCS)[number];

/**
 * 评审 D6：分类 / 类型徽标与状态徽标共用色板，同一行出现两个绿色（分类 green + 状态 green），
 * 用户无法凭色区分「分类」与「状态」。现将分类 / 类型收敛到中性色板（gray / blue / link / purple），
 * 把 green · orange · red · gold 保留给「状态 / 风险 / 时间临近」语义（见 STATUS_TONE）。
 */
/** 一级分类 → 徽标色（中性色板） */
const CAT_TONE: Record<string, TagTone> = {
  资质证照: 'gray', 招投标: 'blue', 合同协议: 'link', 施工过程: 'blue',
  检测报告: 'purple', 验收交付: 'link', 维护保养记录: 'purple', 财务票据: 'gray', 体系文件: 'gray',
};
/** 二级类型 → 徽标色（中性色板） */
const SUB_TONE: Record<string, TagTone> = {
  招标文件: 'blue', 投标文件: 'blue', 中标通知书: 'blue', 答疑澄清: 'blue',
  主合同: 'link', 补充协议: 'link', 安全协议: 'link', 技术协议: 'link',
  隐蔽验收记录: 'blue', 材料合格证: 'blue', 影像资料: 'blue', 施工组织设计: 'blue', 技术交底: 'link',
  联动测试: 'purple', 第三方检测: 'purple', 材料送检: 'purple',
  竣工图: 'link', 竣工验收消防查验记录: 'link', 竣工验收报告: 'link', 移交清单: 'link',
  巡检记录: 'purple', 维修工单: 'purple', 年度检测: 'purple',
  结算单: 'gray', 发票: 'gray', 付款凭证: 'gray',
  资质证书: 'gray', 营业执照: 'gray', 人员证书: 'gray', 安全生产许可证: 'gray',
  管理制度: 'gray', 作业指导书: 'gray', 表单模板: 'gray',
};
/** 状态 → 徽标色（语义色板，与分类色板互斥） */
const STATUS_TONE: Record<string, TagTone> = { 已归档: 'green', 待审核: 'orange', 已作废: 'red' };

/** 消防验收资料清单（硬拦截校验依据） */
const ACCEPT_CHECKLIST = ['检测报告', '合格证', '图纸', '隐蔽验收记录'];

/** 热搜词（点击即搜） */
const HOT_KW = ['万达', '竣工图', '检测报告', '强制性认证', '竣工验收消防查验记录', '维护保养'];
/** 搜索范围 */
const SCOPES = ['全部字段', '文件名', '文档编号', '标签', '摘要'];

const SORTS = ['最近更新', '最早更新', '名称 A→Z', '下载最多', '体积最大'];

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

  /* ---------- 筛选 / 排序 / 分页 ---------- */
  const [typeF, setTypeF] = useState('');
  const [byF, setByF] = useState('');
  const [statusF, setStatusF] = useState('');
  const [needOnly, setNeedOnly] = useState(false);
  const [sort, setSort] = useState('最近更新');
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
  const [shareWater, setShareWater] = useState(true);
  const [upType, setUpType] = useState('检测报告');
  const [upCat, setUpCat] = useState('检测报告');
  const [upStage, setUpStage] = useState<string>('施工');
  const [upProj, setUpProj] = useState(PROJECTS[0]?.id || '');
  const [missList, setMissList] = useState<string[]>([]);

  /* Ctrl + K 唤起全局检索 */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); (e as unknown as { __ncHandled?: boolean }).__ncHandled = true; setGOpen(true); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  /* ---------- 过滤 + 排序 ---------- */
  const rows = useMemo(() => {
    const k = kw.trim();
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
      if (typeF && d.type !== typeF) return false;
      if (byF && d.by !== byF) return false;
      if (statusF && d.status !== statusF) return false;
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
  }, [dirMode, activeCat, activeSub, activeDir, activeStage, typeF, byF, statusF, needOnly, kw, scope, sort]);

  const paged = rows.slice((page - 1) * pageSize, page * pageSize);
  const allOn = rows.length > 0 && rows.every((r) => sel.includes(r.id));

  const pushHist = (v: string) => {
    const t = v.trim();
    if (!t) return;
    setHist((h) => [t, ...h.filter((x) => x !== t)].slice(0, 6));
  };
  const doSearch = (v: string) => { setKw(v); setPage(1); pushHist(v); };

  /* ---------- 分类树（带计数） ---------- */
  const catTree = useMemo(
    () => DOC_CATS.map((c) => ({
      ...c,
      n: DOCS.filter((d) => d.cat === c.key).length,
      subs: c.subs.map((s) => ({ key: s, n: DOCS.filter((d) => d.cat === c.key && d.sub === s).length })),
    })),
    [],
  );

  const dirs = dirMode === 'proj'
    ? PROJECTS.map((p) => ({ key: p.id, label: p.name, sub: p.id, n: DOCS.filter((d) => d.proj === p.id).length }))
    : dirMode === 'contract'
      ? [...new Set(DOCS.filter((d) => d.contract).map((d) => d.contract))].map((c) => ({
        key: c, label: c, sub: DOCS.find((d) => d.contract === c)?.name.split('-')[1] || '',
        n: DOCS.filter((d) => d.contract === c).length,
      }))
      : DOC_STAGES.map((s) => ({ key: s, label: s + '阶段', sub: '', n: DOCS.filter((d) => d.stage === s).length }));

  /* ---------- 项目资料完整度 ---------- */
  const completeness = (pid: string) => {
    const all = DOCS.filter((d) => d.proj === pid);
    const need = all.filter((d) => d.need);
    const done = need.filter((d) => d.status === '已归档');
    const pct = need.length ? Math.round((done.length / need.length) * 100) : 0;
    return { pct, done: done.length, total: need.length };
  };

  const doUpload = () => {
    const miss = ACCEPT_CHECKLIST.filter((c) => !DOCS.some((d) => d.type === c && d.proj === upProj));
    const newMiss = upType === '检测报告' ? miss.filter((m) => !DOCS.some((d) => d.type === m)) : [];
    setMissList(newMiss);
    if (newMiss.length) { toast(`资料清单校验未通过：缺少「${newMiss.join('、')}」，请补齐后上传`); return; }
    toast(`已上传「${upType}」至 ${upProj} · ${upStage} 阶段 · 分类【${upCat}】· 完整度已刷新`);
    setUpOpen(false);
  };

  /* 评审 I2：打包为后台异步任务，原来点击后只有一条 toast、按钮无进行中反馈，
     用户会重复点击。改为 loading 态（禁用 + spinner）并在完成后恢复。 */
  const doPack = () => {
    if (!sel.length || packing) { toast('请先勾选文件'); return; }
    setPacking(true);
    window.setTimeout(() => {
      setPacking(false);
      toast(`已提交后台打包 ${sel.length} 个文件（清单封面页 + 目录索引）· 完成后通知下载`);
    }, 900);
  };

  const toggleFav = (id: string) => {
    setFav((f) => {
      const on = f.includes(id);
      toast(on ? '已取消收藏' : '已加入我的收藏');
      return on ? f.filter((x) => x !== id) : [...f, id];
    });
  };

  /* ---------- 列表列 ---------- */
  const cols = [
    {
      key: 'name', title: '文件名 / 编号', width: 330,
      render: (d: D) => (
        <div className="nc-cell-main">
          <div>
            <span className={`nc-fav${fav.includes(d.id) ? ' is-on' : ''}`} onClick={(e) => { e.stopPropagation(); toggleFav(d.id); }} title={fav.includes(d.id) ? '取消收藏' : '收藏'} {...pressProps(() => toggleFav(d.id))}>
              <Ico n="star" size={13} />
            </span>
            {' '}<Ico n="file" size={13} /> {d.name}
          </div>
          <div className="nc-cell-sub"><Code>{d.id}</Code> · {d.size} · {d.tags.slice(0, 2).map((t) => `#${t}`).join(' ')}</div>
        </div>
      ),
    },
    { key: 'cat', title: '分类', width: 150, render: (d: D) => <div className="nc-cell-main"><div><Tag tone={CAT_TONE[d.cat] || 'gray'}>{d.cat}</Tag></div><div className="nc-cell-sub">{d.sub}</div></div> },
    { key: 'type', title: '类型', width: 120, render: (d: D) => <Tag tone={SUB_TONE[d.type] || 'gray'}>{d.type}</Tag> },
    { key: 'belong', title: '归属项目 / 合同', width: 220, render: (d: D) => <div className="nc-cell-main"><div>{d.proj ? <EntityLink target="project-center" id={d.proj} go={go} title="下钻到项目经营中心">{PROJECTS.find((p) => p.id === d.proj)?.name ?? d.proj}</EntityLink> : '公司级'}</div><div className="nc-cell-sub">{d.contract ? <EntityLink target="contract" id={d.contract} go={go} title="下钻到合同详情"><Code>{d.contract}</Code></EntityLink> : d.stage + ' 阶段'}</div></div> },
    { key: 'ver', title: '版本', width: 70, align: 'center' as const, render: (d: D) => <span className="num">{d.ver}</span> },
    { key: 'by', title: '上传人', width: 90 },
    { key: 'date', title: '更新时间', width: 100 },
    { key: 'dl', title: '下载', width: 64, align: 'right' as const, render: (d: D) => <span className="num">{d.dl}</span> },
    { key: 'status', title: '状态', width: 84, render: (d: D) => <Tag tone={STATUS_TONE[d.status] || 'gray'}>{d.status}</Tag> },
    { key: 'need', title: '必备', width: 64, align: 'center' as const, render: (d: D) => (d.need ? <Tag tone="red">必备</Tag> : <span className="nc-cell-sub">—</span>) },
    {
      key: 'op', title: '操作', width: 176, align: 'right' as const,
      render: (d: D) => (
        <div className="nc-ops" onClick={(e) => e.stopPropagation()}>
          <Op onClick={() => { setDetail(d); setDTab('base'); }}>详情</Op><OpSep />
          <Op onClick={() => toast('已打开预览（水印：预览人 + 时间 + 租户）')}>预览</Op><OpSep />
          <Op onClick={() => setShareOpen(true)}>发送</Op><OpSep />
          <Op danger onClick={() => toast('已提交借阅申请 · 待审批后开放下载')}>借阅</Op>
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
            <Btn size="sm" onClick={() => toast('已打开在线预览（水印：预览人 + 时间 + 租户）')}>在线预览</Btn>
          </div>
          <KvGrid cols={2} rows={[
            { k: '文档编号', v: <Code>{detail.id}</Code> },
            { k: '当前版本', v: <span className="num">{detail.ver}</span> },
            { k: '一级分类', v: <Tag tone={CAT_TONE[detail.cat] || 'gray'}>{detail.cat}</Tag> },
            { k: '二级类型', v: <Tag tone={SUB_TONE[detail.type] || 'gray'}>{detail.type}</Tag> },
            { k: '归属项目', v: detail.proj ? <EntityLink target="project-center" id={detail.proj} go={go} title="下钻到项目经营中心">{PROJECTS.find((p) => p.id === detail.proj)?.name ?? detail.proj}</EntityLink> : '公司级（无项目归属）' },
            { k: '关联合同', v: detail.contract ? <EntityLink target="contract" id={detail.contract} go={go} title="下钻到合同详情">{detail.contract}</EntityLink> : '/' },
            { k: '所属阶段', v: <Tag tone="blue">{detail.stage}</Tag> },
            { k: '是否必备', v: detail.need ? <Tag tone="red">必备（清单校验项）</Tag> : '非必备' },
            { k: '文件状态', v: <Tag tone={STATUS_TONE[detail.status] || 'gray'}>{detail.status}</Tag> },
            { k: '下载次数', v: <span className="num">{detail.dl}</span> },
            { k: '上传人 · 时间', v: `${detail.by} · ${detail.date}` },
            { k: '可见范围', v: detail.vis },
          ]} />
          <div className="nc-sec-title">标签</div>
          <div className="nc-doc-tags">{detail.tags.map((t) => <span key={t} className="nc-doc-tag">#{t}</span>)}</div>
          <div className="nc-sec-title">摘要</div>
          <div className="nc-warnbox is-info">{detail.summary}</div>
          <div className="nc-sec-title">同源链接</div>
          <div className="nc-warnbox">与<b>项目经营中心 → 项目附件</b>、<b>合同详情 → 附件分类</b>双向同源：任一入口上传 / 删除均实时同步。</div>
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
                  <tr key={v.ver} className={v.ver === detail.ver ? 'is-warn-row' : ''}>
                    <td><b className="num">{v.ver}</b>{v.ver === detail.ver && <Tag tone="blue">当前</Tag>}</td>
                    <td className="num">{v.date}</td><td>{v.by}</td><td className="num">{v.size}</td>
                    <td>{v.note}</td>
                    <td><Op onClick={() => toast(`已定位 ${v.ver} 历史版本（只读）`)}>查看</Op></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <div className="nc-empty"><div className="nc-empty-ico"><Ico n="folder" size={16} /></div><div>该文档暂无历史版本</div></div>}
          <div className="nc-warnbox is-green"><Ico n="check" size={16} /> 上传新版本将自动归档旧版本，引用该文档的审批单 / 交付物同步提示「有更新版本」。</div>
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
                <td>{detail.proj ? <EntityLink target="project-center" id={detail.proj} go={go} title="下钻到项目经营中心">{PROJECTS.find((p) => p.id === detail.proj)?.name ?? detail.proj} <span className="nc-cell-sub">{detail.proj}</span></EntityLink> : <span className="nc-cell-sub">公司级文档，无项目归属</span>}</td>
                <td>{detail.proj && <Op onClick={() => { setDetail(null); setFocus('project-center', detail.proj!); go('project-center'); }}>打开</Op>}</td>
              </tr>
              <tr>
                <td>合同</td>
                <td>{detail.contract ? <EntityLink target="contract" id={detail.contract} go={go} title="下钻到合同详情">{detail.contract}</EntityLink> : <span className="nc-cell-sub">未关联合同</span>}</td>
                <td>{detail.contract && <Op onClick={() => { setDetail(null); setFocus('contract', detail.contract!); go('contract'); }}>打开</Op>}</td>
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
          <Btn disabled={!sel.length} title={sel.length ? `打包导出 ${sel.length} 个文件（自动加水印：导出人 + 时间 + 租户）` : '请先勾选至少一个文档'} loading={packing} onClick={doPack}><Ico n="package" size={16} /> {packing ? '打包中…' : `打包导出 ZIP${sel.length ? ` (${sel.length})` : ''}`}</Btn>
          <Btn onClick={() => setBorrowOpen(true)}>借阅记录</Btn>
          <Btn onClick={() => setGOpen(true)}><Ico n="search" size={16} /> 检索 Ctrl+K</Btn>
          <Btn kind="primary" onClick={() => setUpOpen(true)}>＋ 上传文档</Btn>
        </>}
      />

      {/* ============ 搜索区 ============ */}
      <Card>
        <div className="nc-doc-searchbar">
          <div className="nc-doc-search">
            <span className="nc-doc-search-ico"><Ico n="search" size={16} /></span>
            <input
              className="nc-input"
              value={kw}
              placeholder="搜索文件名 / 编号 / 标签 / 摘要 / 项目 / 合同"
              onChange={(e) => { setKw(e.target.value); setPage(1); }}
              onKeyDown={(e) => { if (e.key === 'Enter') pushHist(kw); }}
            />
            <select className="nc-input nc-doc-scope" value={scope} onChange={(e) => { setScope(e.target.value); setPage(1); }}>
              {SCOPES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <Btn kind="primary" onClick={() => doSearch(kw)}>搜索</Btn>
            {!!kw && <Btn onClick={() => { setKw(''); setPage(1); }}>清空</Btn>}
          </div>
          <div className="nc-doc-hot">
            <span className="nc-ltlbl">热搜</span>
            {HOT_KW.map((h) => (
              <button key={h} className="nc-doc-hotbtn" onClick={() => doSearch(h)}>{h}</button>
            ))}
            {!!hist.length && <>
              <span className="nc-ltlbl" style={{ marginLeft: 8 }}>最近</span>
              {hist.map((h) => (
                <button key={h} className="nc-doc-hotbtn is-hist" onClick={() => doSearch(h)}>{h} <Ico n="close" size={11} /></button>
              ))}
            </>}
          </div>
        </div>
      </Card>

      <div className="nc-doc-layout">
        {/* ==================== 左侧分类导航 ==================== */}
        <div className="nc-doc-side">
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

          {dirMode === 'cat' && catTree.map((c) => {
            const open = expanded.includes(c.key);
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
                hd={<span>竣工资料完整度 · {PROJECTS.find((p) => p.id === activeDir)?.name}</span>}
                extra={<Btn size="sm" onClick={() => toast('已导出竣工资料包（含封面页 + 目录索引）')}>一键导出资料包</Btn>}
              >
                <div className="nc-completeness">
                  <Progress value={pct} tone={pct >= 90 ? 'green' : pct >= 60 ? 'orange' : 'red'} />
                  <b className="num">{pct}%</b>
                  <span className="nc-cell-sub">必备 {done}/{total} 已归档</span>
                </div>
                <div className="nc-check-grid">
                  {ACCEPT_CHECKLIST.map((c) => {
                    const ok = DOCS.some((d) => d.proj === activeDir && d.type === c);
                    return (
                      <div key={c} className={`nc-check-cell${ok ? ' is-ok' : ' is-miss'}`}>
                        <StatusIco kind={ok ? 'ok' : 'ban'} /> {c}
                        <span className="nc-cell-sub">{ok ? `已归集 ${DOCS.filter((d) => d.proj === activeDir && d.type === c).length} 份` : '缺失'}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="nc-listhint">
                  <span>上传要求<Tip w={340} text="验收类节点强制上传【竣工验收消防查验记录】+ 影像 + 签字件；通过后资料自动归档至【项目附件】对应里程碑。" /></span>
                </div>
              </Card>
            );
          })()}

          <Card flush>
            <ListToolbar
              rows={[
                {
                  label: '状态', value: statusF, onChange: (k) => { setStatusF(k); setPage(1); },
                  items: [
                    { key: '', label: '全部状态', cnt: DOCS.length },
                    ...DOC_STATUS.map((s) => ({ key: s, label: s, cnt: DOCS.filter((d) => d.status === s).length })),
                  ],
                },
                {
                  label: '类型', value: typeF, onChange: (k) => { setTypeF(k); setPage(1); },
                  items: [
                    { key: '', label: '全部类型', cnt: DOCS.length },
                    ...[...new Set(DOCS.map((d) => d.type))].sort().map((t) => ({ key: t, label: t, cnt: DOCS.filter((d) => d.type === t).length })),
                  ],
                },
                {
                  label: '上传人', value: byF, onChange: (k) => { setByF(k); setPage(1); },
                  items: [
                    { key: '', label: '全部上传人', cnt: DOCS.length },
                    ...[...new Set(DOCS.map((d) => d.by))].sort().map((b) => ({ key: b, label: b, cnt: DOCS.filter((d) => d.by === b).length })),
                  ],
                },
              ]}
              right={<>
                <select className="nc-input nc-lt-select" value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }} title="排序">
                  {SORTS.map((s) => <option key={s}>{s}</option>)}
                </select>
                <input
                  className="nc-input nc-lt-search" value={kw} placeholder="快速过滤…"
                  onChange={(e) => { setKw(e.target.value); setPage(1); }}
                />
                <Btn onClick={() => { setKw(''); setTypeF(''); setByF(''); setStatusF(''); setNeedOnly(false); setSort('最近更新'); setPage(1); }}>重置</Btn>
              </>}
            >
              <div className="nc-ltrow">
                <span className="nc-ltlbl">快速</span>
                <Check checked={needOnly} onChange={(v) => { setNeedOnly(v); setPage(1); }} label="只看验收清单必备项" />
                <Check checked={fav.length > 0 && rows.every((r) => fav.includes(r.id)) && rows.length > 0} onChange={() => { setKw(''); setTypeF(''); setByF(''); setStatusF(''); }} label={`我的收藏（${fav.length}）`} />
                <span className="nc-cell-sub">命中 {rows.length} 条 · 已选 {sel.length} 条</span>
              </div>
            </ListToolbar>
            <DataTable
              cols={cols} rows={paged} rowKey={(d) => d.id} minWidth={1480}
              empty="没有符合筛选条件的文档；文档按「项目 × 阶段 × 分类」归口，支持多版本与借阅留痕"
              emptyCta={<Btn size="sm" kind="primary" onClick={() => setUpOpen(true)}>＋ 上传文档</Btn>}
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
        open={!!detail} onClose={() => setDetail(null)} width={760}
        title={<span>文档详情 {detail && <Code>{detail.id}</Code>}</span>}
        sub={detail?.name}
        foot={<>
          <Btn size="sm" onClick={() => toast('已打开预览（水印：预览人 + 时间 + 租户）')}>预览</Btn>
          <Btn size="sm" onClick={() => toast('已开始下载 · 下载行为留痕')}>下载</Btn>
          <Btn size="sm" onClick={() => setShareOpen(true)}>在线发送</Btn>
          <Btn size="sm" onClick={() => setUpVerOpen(true)}>上传新版本</Btn>
          <Btn size="sm" onClick={() => toast('已提交借阅申请 · 待审批后开放下载')}>借阅</Btn>
          <Btn size="sm" danger onClick={() => setDelOpen(true)}>删除</Btn>
        </>}
      >
        {detailBody}
      </Drawer>

      {/* ============ 上传文档 ============ */}
      <Modal
        open={upOpen} onClose={() => setUpOpen(false)} width={680} title="上传文档"
        foot={<><Btn onClick={() => setUpOpen(false)}>取消</Btn><Btn kind="primary" onClick={doUpload}>上传并归集</Btn></>}
      >
        <Banner tone="warn"><Ico n="ban" size={16} /> 资料清单校验（硬拦截）：按消防验收资料清单校验（检测报告 / 合格证 / 图纸 / 隐蔽验收记录），缺失项将拦截并定位。</Banner>
        <div className="nc-dropzone"><Ico n="paperclip" size={16} /> 拖入文件或 <Btn size="sm">选择文件</Btn><div className="nc-cell-sub">支持 PDF / DWG / JPG / PNG / ZIP / XLSX，单文件 ≤ 200MB</div></div>
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
            <select className="nc-input" value={upProj} onChange={(e) => setUpProj(e.target.value)}>
              <option value="">公司级（不归属项目）</option>
              {PROJECTS.map((p) => <option key={p.id} value={p.id}>{p.id} · {p.name}</option>)}
            </select>
          </Field>
          <Field label="关联合同">
            <select className="nc-input"><option value="">暂不关联</option>{[...new Set(DOCS.filter((d) => d.contract).map((d) => d.contract))].map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
          <Field label="是否必备"><div className="nc-inline-checks"><Check checked={true} onChange={() => {}} label="清单必备项" /></div></Field>
          <Field label="标签" span={2} note="逗号分隔，用于检索"><input className="nc-input" placeholder="如：万达,强制性认证,验收" /></Field>
        </div>
        {!!missList.length && <div className="nc-warnbox is-red"><div className="nc-warnbox-hd"><Ico n="ban" size={16} /> 校验未通过：缺少 {missList.join('、')}</div>请先补齐缺失的清单资料，或联系资料管理员。</div>}
        <div className="nc-sec-title">已自动归集（同源）</div>
        <div className="nc-warnbox is-green"><Ico n="check" size={16} /> 上传后将自动出现在「项目经营中心 → 项目附件」与「合同详情 → 附件分类」，无需重复上传。</div>
      </Modal>

      {/* ============ 上传新版本 ============ */}
      <Modal
        open={upVerOpen} onClose={() => setUpVerOpen(false)} width={560} title="上传新版本"
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
        open={shareOpen} onClose={() => setShareOpen(false)} width={560} title="在线发送（分享链接）"
        foot={<><Btn onClick={() => setShareOpen(false)}>取消</Btn><Btn kind="primary" onClick={() => { toast(`已生成分享链接 · 有效期 ${shareDays} 天${shareWater ? ' · 已加水印' : ''}`); setShareOpen(false); }}>生成分享链接</Btn></>}
      >
        <Banner tone="info">在线发送：生成分享链接 → 带<b>水印</b>（接收人 + 时间 + 租户）+ <b>有效期</b>，到期自动失效。</Banner>
        <div className="nc-form-grid">
          <Field label="有效期（天）" req note="默认 7 天">
            <select className="nc-input" value={shareDays} onChange={(e) => setShareDays(Number(e.target.value))}>
              <option value={3}>3 天</option><option value={7}>7 天</option><option value={15}>15 天</option><option value={30}>30 天</option>
            </select>
          </Field>
          <Field label="接收人"><input className="nc-input" placeholder="对方邮箱 / 手机号" /></Field>
          <Field label="水印" span={2}><Check checked={shareWater} onChange={setShareWater} label="启用水印（接收人 + 时间 + 租户）" /></Field>
          <Field label="是否允许下载"><div className="nc-inline-checks"><Check checked={true} onChange={() => {}} label="允许" /></div></Field>
          <Field label="提取码"><input className="nc-input" placeholder="自动生成" readOnly /></Field>
        </div>
        <div className="nc-listhint">
          <span>外发留痕<Tip text="外发行为留痕：谁 · 何时 · 发给谁 · 哪一版；到期后链接自动失效且不可恢复。" /></span>
        </div>
      </Modal>

      {/* ============ 借阅记录 ============ */}
      <Modal open={borrowOpen} onClose={() => setBorrowOpen(false)} width={680} title="借阅记录" foot={<Btn kind="primary" onClick={() => setBorrowOpen(false)}>关闭</Btn>}>
        <table className="nc-tbl" style={{ minWidth: 620 }}>
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
      <Modal open={gOpen} onClose={() => setGOpen(false)} width={860} title="全局文档检索">
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
    </>
  );
}
