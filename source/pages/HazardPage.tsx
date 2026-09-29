// 诺安云 6.0 · 合规与档案 · 隐患与整改
// 六步闭环（2026-09-28 评审 P0）：发现 → 定级（一般/重大）→ 整改单 → 整改 → 复核 → 闭环。
// 定位：经营侧跟踪台账——签收 / 提交复核 / 复核闭环在此留痕，作业执行在外部系统。
// 角色分工：wbtech / jceng 签收与提交整改；复核闭环须 safety / boss / deputy / pm / sysadmin（整改人自查自复核分离）。
import React, { useMemo, useState } from 'react';
import {
  Banner, Btn, Card, DataTable, Drawer, EntityLink, Field, KvGrid, ListToolbar, Modal,
  Op, OpSep, PageHead, TableFoot, Tag, Tabs, Tile, Timeline, Tip, useToast, type Col, type TagTone, pressProps,
} from '../components/ui';
import { HAZARDS, PROJECTS, TODAY, can, fmtWan } from '../components/data';
import { Ico } from '../components/icons';
import { getUserName } from '../components/export';

type Hz = (typeof HAZARDS)[number] & { closedDate?: string };
type Tpl = { date: string; text: string; tone: 'ok' | 'gray' | 'red' };

/** 日期差（天）：a − b */
const dayDiff = (a: string, b: string) => Math.round((new Date(`${a}T00:00:00`).getTime() - new Date(`${b}T00:00:00`).getTime()) / 86400000);
const projName = (pid: string) => PROJECTS.find((p) => p.id === pid)?.name ?? pid;
/** 逾期派生：未闭环且已过整改期限（状态流转后自动正确，不存静态字段） */
const isOverdue = (h: Hz) => h.status !== '已闭环' && h.limitDate < TODAY;
const overdueDays = (h: Hz) => (isOverdue(h) ? dayDiff(TODAY, h.limitDate) : 0);
/** 复核闭环权限：整改人（wbtech/jceng）不能复核自己提交的整改 */
const REVIEWERS = ['boss', 'deputy', 'pm', 'safety', 'sysadmin'];

const ST_TONE: Record<string, TagTone> = { 待整改: 'orange', 整改中: 'blue', 复核中: 'purple', 已闭环: 'green' };
const SOURCES = ['维保巡检', '检测判定', '施工自查', '验收整改', '外部检查'];

export default function HazardPage({ go, role }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  const [rows, setRows] = useState<Hz[]>(() => HAZARDS.map((h) => ({ ...h })));
  const [tab, setTab] = useState('all');
  const [levelF, setLevelF] = useState('all');
  const [srcF, setSrcF] = useState('all');
  const [kw, setKw] = useState('');
  const [detail, setDetail] = useState<Hz | null>(null);
  const [closeOpen, setCloseOpen] = useState<Hz | null>(null);
  const [closeNote, setCloseNote] = useState('');
  const [reportOpen, setReportOpen] = useState<Hz | null>(null);
  const [reportNote, setReportNote] = useState('');
  const [newOpen, setNewOpen] = useState(false);
  const [nTitle, setNTitle] = useState('');
  const [nLevel, setNLevel] = useState('一般');
  const [nSource, setNSource] = useState('维保巡检');
  const [nProject, setNProject] = useState('');
  const [nLoc, setNLoc] = useState('');
  const [nOwner, setNOwner] = useState('');
  const [nLimit, setNLimit] = useState('');
  const [nErr, setNErr] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const canWrite = can(role, 'hazard');
  const canReview = REVIEWERS.includes(role);

  /** 状态流转（签收 / 提交复核 / 复核闭环共用），详情抽屉同步 */
  const patch = (id: string, p: Partial<Hz>, msg: string) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
    setDetail((d) => (d && d.id === id ? { ...d, ...p } : d));
    toast(msg);
  };

  const open = rows.filter((h) => h.status !== '已闭环');
  const majorOpen = open.filter((h) => h.level === '重大');
  const overdue = open.filter(isOverdue);
  const reviewing = rows.filter((h) => h.status === '复核中');
  const closed = rows.filter((h) => h.status === '已闭环');
  const closeRate = rows.length ? Math.round((closed.length / rows.length) * 100) : 0;

  const filtered = rows.filter((h) =>
    (tab === 'all' || h.status === tab)
    && (levelF === 'all' || h.level === levelF)
    && (srcF === 'all' || h.source === srcF)
    && (!kw || h.id.includes(kw) || h.title.includes(kw) || h.location.includes(kw) || h.owner.includes(kw)));
  const tabBase = rows.filter((h) => tab === 'all' || h.status === tab);
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  const timelineOf = (h: Hz): Tpl[] => {
    const items: Tpl[] = [{ date: h.foundDate, text: `发现登记 · 来源：${h.source} · 定级${h.level}`, tone: 'gray' }];
    if (h.status !== '待整改') items.push({ date: h.foundDate, text: `整改责任人 ${h.owner} 签收，进入整改`, tone: 'gray' });
    if (h.status === '复核中') items.push({ date: h.limitDate < TODAY ? h.limitDate : TODAY, text: '整改完成，提交复核', tone: 'gray' });
    if (h.status === '已闭环' && h.closedDate) items.push({ date: h.closedDate, text: `复核通过 · 闭环归档（复核人 ${role === 'safety' ? getUserName(role) : '安全/项目管理岗'}）`, tone: 'ok' });
    if (isOverdue(h)) items.push({ date: h.limitDate, text: `超过整改期限 ${overdueDays(h)} 天仍未闭环${h.level === '重大' ? '，重大隐患须上报监管' : ''}`, tone: 'red' });
    return items;
  };

  const cols: Col<Hz>[] = [
    { key: 'id', title: '编号', width: 100, hide: true, render: (h) => <span className="num nc-link" onClick={() => setDetail(h)} {...pressProps(() => setDetail(h))}>{h.id}</span> },
    {
      key: 'title', title: '隐患 / 部位', sticky: 'left', width: 250, render: (h) => (
        <span>
          <b style={{ display: 'block' }}>{h.title}</b>
          <span className="nc-cell-sub">{h.id} · {h.location}</span>
        </span>
      ),
    },
    { key: 'level', title: '定级', width: 78, render: (h) => <Tag tone={h.level === '重大' ? 'red' : 'gray'}>{h.level}</Tag> },
    { key: 'source', title: '来源', width: 92 },
    {
      key: 'project', title: '关联项目', width: 190, render: (h) => (
        <EntityLink target="project-center" id={h.project} go={go} title="下钻到项目详情">{projName(h.project)}</EntityLink>
      ),
    },
    { key: 'owner', title: '整改责任人', width: 100 },
    { key: 'foundDate', title: '发现日期', width: 106, align: 'right', render: (h) => <span className="num">{h.foundDate}</span> },
    {
      key: 'limitDate', title: <>整改期限 <Tip w={300} text="逾期 = 未闭环且已过期限，按当前日期派生；状态流转后自动更新。" /></>, width: 128, align: 'right',
      render: (h) => isOverdue(h)
        ? <span className="num" style={{ color: 'var(--c-danger)' }}>逾期 {overdueDays(h)} 天</span>
        : <span className="num">{h.limitDate}</span>,
    },
    { key: 'status', title: '状态', width: 88, render: (h) => <Tag tone={ST_TONE[h.status] || 'gray'}>{h.status}</Tag> },
    {
      key: 'op', title: '操作', width: 168, render: (h) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Op onClick={() => setDetail(h)}>详情</Op>
          {canWrite && h.status === '待整改' && <><OpSep /><Op onClick={() => patch(h.id, { status: '整改中' }, `${h.id} 已签收，进入整改`)}>签收</Op></>}
          {canWrite && h.status === '整改中' && <><OpSep /><Op onClick={() => patch(h.id, { status: '复核中' }, `${h.id} 整改完成，已提交复核`)}>提交复核</Op></>}
          {canReview && h.status === '复核中' && <><OpSep /><Op onClick={() => { setCloseOpen(h); setCloseNote(''); }}>复核闭环</Op></>}
          {h.level === '重大' && h.status !== '已闭环' && <><OpSep /><Op gold onClick={() => { setReportOpen(h); setReportNote(''); }} title="重大隐患上报住建/消防监管部门（台账留痕，报送在外部系统执行）">上报监管</Op></>}
        </span>
      ),
    },
  ];

  const doClose = () => {
    if (!closeOpen) return;
    patch(closeOpen.id, { status: '已闭环', closedDate: TODAY }, `${closeOpen.id} 复核通过，已闭环归档`);
    setCloseOpen(null);
  };

  const doNew = () => {
    if (!nTitle.trim() || !nProject || !nLimit) { setNErr('隐患描述、关联项目、整改期限为必填'); return; }
    const id = `YH${String(rows.length + 1).padStart(6, '0')}`;
    setRows((rs) => [{ id, title: nTitle.trim(), level: nLevel, source: nSource, project: nProject, location: nLoc.trim() || '—', foundDate: TODAY, limitDate: nLimit, owner: nOwner.trim() || getUserName(role), status: '待整改' }, ...rs]);
    setNewOpen(false);
    setNTitle(''); setNLoc(''); setNOwner(''); setNLimit(''); setNErr('');
    setPage(1);
    toast(`${id} 已登记，待责任人签收`);
  };

  const doReport = () => {
    if (!reportOpen) return;
    toast(`${reportOpen.id} 已登记上报（住建/消防监管部门），报送凭证归档至文档中心`);
    setReportOpen(null);
  };

  return (
    <>
      <PageHead
        crumbs={['合规', '隐患与整改']}
        title="隐患与整改"
        badges={<><Tag tone="orange">未闭环 {open.length}</Tag>{overdue.length > 0 && <Tag tone="red">逾期未闭环 {overdue.length}</Tag>}<Tag tone="green">已闭环 {closed.length}</Tag></>}
        sub="发现 → 定级 → 整改单 → 整改 → 复核 → 闭环；作业执行在外部系统，此处留痕跟踪"
        actions={canWrite && <Btn kind="primary" onClick={() => { setNewOpen(true); setNErr(''); }}><Ico n="plus" size={16} /> 登记隐患</Btn>}
      />

      {/* 重大隐患警示条：限期未闭环即触发上报出口（评审 P0 的监管职责出口） */}
      {majorOpen.length > 0 && (
        <Banner tone="danger" actions={<Btn size="sm" onClick={() => setReportOpen(majorOpen[0]!)}>上报监管</Btn>}>
          <Ico n="ban" size={14} style={{ color: 'var(--c-danger)' }} /> <b>重大隐患 {majorOpen.length} 条未闭环</b>
          ：{majorOpen.map((h) => `${h.id}（${isOverdue(h) ? `逾期 ${overdueDays(h)} 天` : h.status}）`).join('、')}——限期未闭环须上报住建/消防监管部门。
        </Banner>
      )}

      <div className="nc-tiles nc-tiles-5">
        <Tile label="未闭环" value={open.length} tone={open.length > 0 ? 'orange' : 'green'} sub={`在册共 ${rows.length} 条`} />
        <Tile label="重大在办" value={majorOpen.length} tone={majorOpen.length > 0 ? 'red' : undefined} sub="定级重大 · 限期整改" />
        <Tile label="逾期未闭环" value={overdue.length} tone={overdue.length > 0 ? 'red' : undefined} sub="超期即进驾驶舱风险榜" />
        <Tile label="待复核" value={reviewing.length} tone={reviewing.length > 0 ? 'blue' : undefined} sub="整改完成 · 等待复核" />
        <Tile label="闭环率" value={`${closeRate}%`} sub={`已闭环 ${closed.length} / 在册 ${rows.length}`} />
      </div>

      <Card flush>
        <div style={{ padding: '12px 16px 0' }}>
          <Tabs value={tab} onChange={(k: string) => { setTab(k); setPage(1); }} items={[
            { key: 'all', label: '全部', cnt: rows.length },
            { key: '待整改', label: '待整改', cnt: rows.filter((h) => h.status === '待整改').length },
            { key: '整改中', label: '整改中', cnt: rows.filter((h) => h.status === '整改中').length },
            { key: '复核中', label: '复核中', cnt: reviewing.length },
            { key: '已闭环', label: '已闭环', cnt: closed.length },
          ]} />
        </div>
        <div style={{ padding: '0 16px 12px' }}>
          <ListToolbar
            rows={[
              {
                label: '定级', value: levelF, onChange: (k) => { setLevelF(k); setPage(1); },
                items: [
                  { key: 'all', label: '全部定级', cnt: rows.length },
                  { key: '重大', label: '重大', cnt: rows.filter((h) => h.level === '重大').length },
                  { key: '一般', label: '一般', cnt: rows.filter((h) => h.level === '一般').length },
                ],
              },
              {
                label: '来源', value: srcF, onChange: (k) => { setSrcF(k); setPage(1); },
                items: [
                  { key: 'all', label: '全部来源', cnt: rows.length },
                  ...SOURCES.map((s) => ({ key: s, label: s, cnt: rows.filter((h) => h.source === s).length })),
                ],
              },
            ]}
            search={{ value: kw, onChange: (v) => { setKw(v); setPage(1); }, placeholder: '搜索编号 / 描述 / 部位 / 责任人' }}
            onReset={() => { setKw(''); setLevelF('all'); setSrcF('all'); setPage(1); }}
          />
        </div>
        <DataTable cols={cols} rows={paged} rowKey={(h) => h.id} minWidth={1250} onRowClick={(h) => setDetail(h)}
          empty="没有符合筛选条件的隐患；新发现的设施故障（喷头漏水、误报、遮挡、压力不足等）请先登记再派整改"
          rowClass={(h) => (isOverdue(h) ? 'is-muted-row' : '')}
          foot={<TableFoot total={tabBase.length} filtered={filtered.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />} />
      </Card>

      {/* ============ 隐患详情 ============ */}
      <Drawer open={!!detail} width={720} onClose={() => setDetail(null)} title={`隐患详情 · ${detail?.id || ''}`}
        foot={detail && (
          <>
            <Btn onClick={() => setDetail(null)}>关闭</Btn>
            {canWrite && detail.status === '待整改' && <Btn kind="primary" onClick={() => { patch(detail.id, { status: '整改中' }, `${detail.id} 已签收，进入整改`); }}>签收整改</Btn>}
            {canWrite && detail.status === '整改中' && <Btn kind="primary" onClick={() => { patch(detail.id, { status: '复核中' }, `${detail.id} 整改完成，已提交复核`); }}>提交复核</Btn>}
            {canReview && detail.status === '复核中' && <Btn kind="primary" onClick={() => { setCloseOpen(detail); setCloseNote(''); }}>复核闭环</Btn>}
            {detail.level === '重大' && detail.status !== '已闭环' && <Btn kind="primary" onClick={() => { setReportOpen(detail); setReportNote(''); }}>上报监管</Btn>}
          </>
        )}>
        {detail && (
          <Field label="基础信息" span={4}>
            <KvGrid cols={2} rows={[
              { k: '隐患描述', v: detail.title },
              { k: '定级', v: <Tag tone={detail.level === '重大' ? 'red' : 'gray'}>{detail.level}</Tag> },
              { k: '来源', v: detail.source },
              { k: '状态', v: <Tag tone={ST_TONE[detail.status] || 'gray'}>{detail.status}</Tag> },
              { k: '关联项目', v: <EntityLink target="project-center" id={detail.project} go={go} title="下钻到项目详情">{projName(detail.project)}</EntityLink> },
              { k: '部位', v: detail.location },
              { k: '整改责任人', v: detail.owner },
              { k: '发现日期', v: <span className="num">{detail.foundDate}</span> },
              { k: '整改期限', v: <span className="num">{detail.limitDate}{isOverdue(detail) && <span style={{ color: 'var(--c-danger)' }}>（逾期 {overdueDays(detail)} 天）</span>}</span> },
              ...(detail.closedDate ? [{ k: '闭环日期', v: <span className="num">{detail.closedDate}</span> }] : []),
            ]} />
          </Field>
        )}
        {detail && (
          <Field label="处置记录" span={4}>
            <Timeline items={timelineOf(detail)} />
          </Field>
        )}
        {detail?.level === '重大' && detail.status !== '已闭环' && (
          <Field label="监管出口" span={4}>
            <Banner tone="warn">重大隐患限期未闭环须上报住建/消防监管部门（报送动作在外部系统执行，此处登记上报凭证号并归档至文档中心）。</Banner>
          </Field>
        )}
      </Drawer>

      {/* ============ 复核闭环 ============ */}
      <Modal open={!!closeOpen} title={`复核闭环 · ${closeOpen?.id || ''}`} width={520} onClose={() => setCloseOpen(null)}
        foot={<><Btn onClick={() => setCloseOpen(null)}>取消</Btn>
          <Btn kind="primary" disabled={!closeNote.trim()} onClick={doClose}>确认闭环</Btn></>}>
        {closeOpen && <KvGrid rows={[
          { k: '隐患', v: closeOpen.title },
          { k: '整改责任人', v: closeOpen.owner },
          { k: '整改期限', v: closeOpen.limitDate },
        ]} />}
        <Field label="复核结论" req note={`${closeNote.length}/200 字 · 复核通过即闭环归档，闭环前须现场复查`}>
          <textarea className="nc-input" rows={3} value={closeNote} onChange={(e) => setCloseNote(e.target.value)} placeholder="例：现场复查 3 只喷头已更换并试压合格，同意闭环" />
        </Field>
      </Modal>

      {/* ============ 上报监管 ============ */}
      <Modal open={!!reportOpen} title={`重大隐患上报监管 · ${reportOpen?.id || ''}`} width={560} onClose={() => setReportOpen(null)}
        foot={<><Btn onClick={() => setReportOpen(null)}>取消</Btn>
          <Btn kind="primary" disabled={!reportNote.trim()} onClick={doReport}>登记上报</Btn></>}>
        {reportOpen && (
          <>
            <Banner tone="warn"><Ico n="ban" size={16} /> 定级<b>重大</b>且限期未闭环的隐患须上报；报送与整改执行在外部系统，此处完成台账登记与凭证归档。</Banner>
            <KvGrid rows={[
              { k: '隐患', v: `${reportOpen.title}（${reportOpen.project} · ${reportOpen.location}）` },
              { k: '超期情况', v: isOverdue(reportOpen) ? `已逾期 ${overdueDays(reportOpen)} 天` : reportOpen.status },
              { k: '整改责任人', v: reportOpen.owner },
            ]} />
            <Field label="上报说明 / 受理凭证号" req note={`${reportNote.length}/200 字`}>
              <textarea className="nc-input" rows={3} value={reportNote} onChange={(e) => setReportNote(e.target.value)} placeholder="例：已向区住建局报送（回执号 PC-2026-0912），整改方案随附" />
            </Field>
          </>
        )}
      </Modal>

      {/* ============ 登记隐患 ============ */}
      <Modal open={newOpen} title="登记隐患" width={640} onClose={() => setNewOpen(false)}
        foot={<><Btn onClick={() => setNewOpen(false)}>取消</Btn>
          <Btn kind="primary" onClick={doNew}>保存登记</Btn></>}>
        {nErr && <Banner tone="danger">{nErr}</Banner>}
        <Field label="隐患描述" req span={2}>
          <input className="nc-input" value={nTitle} onChange={(e) => setNTitle(e.target.value)} placeholder="例：地下车库喷淋头渗漏 ×3" />
        </Field>
        <Field label="定级" req note="重大隐患限期未闭环触发监管上报">
          <select className="nc-input" value={nLevel} onChange={(e) => setNLevel(e.target.value)}><option>一般</option><option>重大</option></select>
        </Field>
        <Field label="发现来源" req>
          <select className="nc-input" value={nSource} onChange={(e) => setNSource(e.target.value)}>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select>
        </Field>
        <Field label="关联项目" req span={2}>
          <select className="nc-input" value={nProject} onChange={(e) => setNProject(e.target.value)}>
            <option value="">选择项目…</option>
            {PROJECTS.map((p) => <option key={p.id} value={p.id}>{p.id} · {p.name}</option>)}
          </select>
        </Field>
        <Field label="部位" span={2}><input className="nc-input" value={nLoc} onChange={(e) => setNLoc(e.target.value)} placeholder="例：B2 车库北区" /></Field>
        <Field label="整改责任人"><input className="nc-input" value={nOwner} onChange={(e) => setNOwner(e.target.value)} placeholder={`默认 ${getUserName(role)}`} /></Field>
        <Field label="整改期限" req><input className="nc-input" type="date" value={nLimit} onChange={(e) => setNLimit(e.target.value)} /></Field>
      </Modal>
    </>
  );
}
