// 项目列表（项目管理）—— 只列项目台账，商机管道归「商机管理」页
//
// 对齐《产品设计文档》§9.1：
//   筛选  编号 / 名称、类型（新建 / 改造 / 维护保养 / 检测）、来源、状态、项目经理、客户、风险标记
//   列    编号、项目名、类型、客户、状态、项目经理、合同额、执行额、实际成本（权限）、
//         毛利率、回款比例、风险标记组、更新时间
//   行操作 查看、编辑（抽屉）
//   顶部   〔新建项目〕
//   特殊   「无合同施工」行左侧红色竖条
// 状态取项目 8 态（《研发级功能规格》§6.2）；旧数据经 normProjectStatus 归一。
import React, { useEffect, useMemo, useState } from 'react';
import {
  Banner, Btn, Card, DataTable, Drawer, EntityLink, Field, IdCell, Money, Op, OpMore,
  PageHead, Progress, TableFoot, Tag, Tip, useToast,
} from '../components/ui';
import type { OpMoreItem } from '../components/ui';
import {
  ACCEPT_FLOW, ACCEPT_TONE, CONTRACTS, CUSTOMERS, PROJECT_RISKS, PROJECT_SOURCES, PROJECT_STATUS,
  PROJECT_STATUS_TONE, PROJECT_TERMINAL, PROJ_TYPES, TODAY, canSeeMoney, fmt, fmtAmt, fmtPct,
  isServiceProject, normProjectStatus, riskOf,
} from '../components/data';
import { getProjects, setFocus, subscribeStore } from '../components/store';
import { Ico } from '../components/icons';

/* 排序规则显式化（不用无标识的升降箭头） */
const SORTS = [
  { key: 'updated', label: '按更新时间 ↓' },
  { key: 'amt', label: '按合同额 ↓' },
  { key: 'exec', label: '按执行额 ↓' },
  { key: 'progress', label: '按施工进度 ↑' },
] as const;

type Row = {
  id: string; name: string; type: string; source: string;
  customer: string; customerId?: string; industry: string;
  status: string; pm: string;
  contractAmt: number; execAmt: number; cost: number;
  profitPct: number; recvPct: number; progress: number;
  accept: string; risk: string; updated: string;
  noContract: boolean; milestoneName: string; service: boolean;
};

/** PROJECTS → 列表行：全部字段来自项目台账，不再派生商机段 */
const buildRows = (list: ReturnType<typeof getProjects>): Row[] => list.map((p) => {
  const cus = CUSTOMERS.find((c) => c.id === p.customerId);
  const status = normProjectStatus(p.status);
  /* 验收状态：已登记取登记值，未登记按里程碑进度推断（口径与详情页「检测与验收」一致） */
  const accept = p.acceptStatus || (p.milestone >= 100 ? '已通过' : p.milestone >= 88 ? '已申报' : '未申报');
  return {
    id: p.id, name: p.name, type: p.type, source: p.source,
    customer: p.customer, customerId: p.customerId, industry: cus?.industry ?? '其他',
    status, pm: p.pm,
    contractAmt: p.contractAmt, execAmt: p.execAmt, cost: p.cost,
    profitPct: p.profit, recvPct: p.recvPct, progress: Math.min(100, Math.max(0, p.milestone)),
    accept, risk: p.risk, updated: p.updatedAt || p.start,
    noContract: !!p.noContract || p.risk === 'nocontract',
    milestoneName: p.milestoneName, service: isServiceProject(p),
  };
});

/** 上游合同：按 contractId / 项目外键反查真实单据号 */
const contractOf = (pid: string) =>
  CONTRACTS.find((c) => c.project === pid)?.id
  ?? ((getProjects().find((p) => p.id === pid) as { contractId?: string } | undefined)?.contractId || null);

export default function ProjectPage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  const money = canSeeMoney(role);

  /* 项目台账走共享 store：立项提交 / 状态流转后本列表实时刷新 */
  const [projects, setProjects] = useState(getProjects);
  useEffect(() => subscribeStore(() => setProjects(getProjects())), []);
  const ALL: Row[] = useMemo(() => buildRows(projects), [projects]);

  /* ---------- 筛选（§9.1） ---------- */
  const [kw, setKw] = useState('');
  const [type, setType] = useState('');
  const [source, setSource] = useState('');
  const [status, setStatus] = useState('');
  const [pm, setPm] = useState('');
  const [customer, setCustomer] = useState('');
  const [risk, setRisk] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [sortKey, setSortKey] = useState<string>('updated');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ---------- 抽屉 ---------- */
  const [edit, setEdit] = useState<Row | null>(null);

  const pms = [...new Set(ALL.map((r) => r.pm))];
  const custs = [...new Set(ALL.map((r) => r.customer))];
  const riskKeys = [...new Set(ALL.map((r) => r.risk).filter((x) => x !== 'none' && PROJECT_RISKS[x]))];

  const rows = useMemo(() => {
    const list = ALL.filter((r) => {
      if (type && r.type !== type) return false;
      if (source && r.source !== source) return false;
      if (status && r.status !== status) return false;
      if (pm && r.pm !== pm) return false;
      if (customer && r.customer !== customer) return false;
      if (risk && r.risk !== risk) return false;
      if (kw && !`${r.id}${r.name}${r.customer}`.includes(kw)) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      if (sortKey === 'amt') return b.contractAmt - a.contractAmt;
      if (sortKey === 'exec') return b.execAmt - a.execAmt;
      if (sortKey === 'progress') return a.progress - b.progress;
      return (b.updated || '').localeCompare(a.updated || '');
    });
  }, [ALL, type, source, status, pm, customer, risk, kw, sortKey]);

  const paged = rows.slice((page - 1) * pageSize, page * pageSize);

  /* 统计卡口径：全部项目（含终态），金额类按角色权限脱敏 */
  const sumCt = ALL.reduce((a, r) => a + r.contractAmt, 0);
  const sumExec = ALL.reduce((a, r) => a + r.execAmt, 0);
  const sumCost = ALL.reduce((a, r) => a + r.cost, 0);
  const sumRecv = ALL.reduce((a, r) => a + (r.contractAmt * r.recvPct) / 100, 0);
  const inProgress = ALL.filter((r) => ['执行中', '暂停', '验收结算中'].includes(r.status)).length;
  const riskCnt = ALL.filter((r) => r.risk !== 'none' && PROJECT_RISKS[r.risk]).length;

  const reset = () => {
    setKw(''); setType(''); setSource(''); setStatus(''); setPm(''); setCustomer(''); setRisk('');
    setSortKey('updated'); setPage(1); toast('已重置筛选条件');
  };

  /** 查看：进入项目经营中心 */
  const openProject = (r: Row) => { setFocus('project-center', r.id); go('project-center'); };

  const cols = [
    {
      key: 'id', title: '编号', width: 132, sticky: 'left' as const,
      render: (r: Row) => <IdCell onClick={() => openProject(r)} title="打开项目经营中心">{r.id}</IdCell>,
    },
    {
      key: 'name', title: '项目名 · 客户', width: 214,
      render: (r: Row) => (
        <div className="nc-cell-main">
          <div className="nc-ellip" title={r.name}><b>{r.name}</b>{r.noContract && <Tag tone="red">无合同</Tag>}</div>
          <div className="nc-cell-sub nc-ellip" title={r.customer}>
            {r.customerId
              ? <EntityLink target="customer" id={r.customerId} go={go} title="下钻到客户档案">{r.customer}</EntityLink>
              : r.customer}
            {` · ${r.industry}`}
          </div>
        </div>
      ),
    },
    {
      key: 'type', title: '类型', width: 84,
      render: (r: Row) => <Tag tone={r.service ? 'purple' : r.type === '检测' ? 'gold' : 'blue'}>{r.type}</Tag>,
    },
    {
      key: 'status', title: '状态', width: 132,
      render: (r: Row) => (
        <div className="nc-cell-main">
          <Tag tone={(PROJECT_STATUS_TONE[r.status] || 'gray') as 'gray'} pill>{r.status}</Tag>
          {/* 副行：验收结算中的项目显示消防验收推进；其余显示当前里程碑 */}
          <div className="nc-cell-sub nc-ellip" title={r.status === '验收结算中' ? `消防验收：${r.accept}` : r.milestoneName}>
            {r.status === '验收结算中'
              ? <>消防验收 <Tag tone={(ACCEPT_TONE[r.accept] || 'gray') as 'gray'}>{r.accept}</Tag></>
              : r.milestoneName}
          </div>
        </div>
      ),
    },
    {
      key: 'pm', title: '项目经理', width: 92,
      render: (r: Row) => <span><span className="nc-avatar">{r.pm[0]}</span> {r.pm}</span>,
    },
    {
      key: 'contractAmt', title: '合同额', width: 112, align: 'right' as const,
      render: (r: Row) => (!r.contractAmt
        ? <span className="nc-v-orange">未填</span>
        : <b className="num"><Money v={r.contractAmt} role={role} /></b>),
    },
    {
      key: 'execAmt', title: '执行额', width: 112, align: 'right' as const,
      render: (r: Row) => (!r.execAmt
        ? <span className="nc-cell-sub">—</span>
        : <span className="num"><Money v={r.execAmt} role={role} /></span>),
    },
    {
      key: 'cost', title: '实际成本', width: 112, align: 'right' as const,
      render: (r: Row) => (!money
        ? <span className="nc-muted">—</span>
        : r.cost > 0
          ? <span className="num"><Money v={r.cost} role={role} /></span>
          : <span className="nc-cell-sub">—</span>),
    },
    {
      key: 'profit', title: '毛利率', width: 88, align: 'right' as const,
      render: (r: Row) => (r.contractAmt > 0 && r.cost > 0
        ? <b className={'num' + (r.profitPct < 20 ? ' nc-v-red' : r.profitPct < 28 ? ' nc-v-orange' : ' nc-v-green')}>{fmtPct(r.profitPct)}</b>
        : <span className="nc-cell-sub">—</span>),
    },
    {
      key: 'recv', title: '回款比例', width: 104,
      render: (r: Row) => (
        <div className="nc-prog-cell">
          <Progress value={r.recvPct} tone={r.recvPct >= 90 ? 'green' : r.recvPct === 0 ? 'red' : undefined} />
          <b className="num">{fmtPct(r.recvPct)}</b>
        </div>
      ),
    },
    {
      key: 'progress', title: '施工进度', width: 104,
      render: (r: Row) => (r.status === '待启动'
        ? <span className="nc-cell-sub">未开工</span>
        : (
          <div className="nc-prog-cell">
            <Progress value={r.progress} tone={r.progress >= 100 ? 'green' : r.progress < 30 ? 'red' : undefined} />
            <b className="num">{r.progress}%</b>
          </div>
        )),
    },
    {
      key: 'risk', title: '风险标记', width: 128,
      render: (r: Row) => {
        const k = riskOf(r.risk);
        return k
          ? <span title={k.hint}><Tag tone={k.tone}>{k.label}</Tag></span>
          : <span className="nc-cell-sub">—</span>;
      },
    },
    {
      key: 'updated', title: '更新时间', width: 100,
      render: (r: Row) => <span className="num">{r.updated}</span>,
    },
    {
      key: 'op', title: '操作', width: 96, align: 'right' as const, sticky: 'right' as const,
      render: (r: Row) => {
        const done = (PROJECT_TERMINAL as readonly string[]).includes(r.status);
        const ct = contractOf(r.id);
        const more: OpMoreItem[] = [
          { label: '查看', onClick: () => openProject(r) },
          { label: '编辑', disabled: done, title: done ? '终态项目不可编辑' : '编辑基础信息与甲方对接人（抽屉）', onClick: () => setEdit(r) },
          ...(ct ? [{ label: '查看合同', onClick: () => { setFocus('contract', ct); go('contract'); } }] : []),
          ...(r.customerId ? [{ label: '下钻客户档案', onClick: () => { setFocus('customer', r.customerId!); go('customer'); } }] : []),
          ...(r.noContract ? [{ label: '去补签合同', title: '无合同施工：补签并关联销售合同', onClick: () => go('contract-new') }] : []),
        ];
        return (
          <div className="nc-ops" onClick={(e) => e.stopPropagation()}>
            <Op onClick={() => openProject(r)} title="打开项目经营中心">查看</Op>
            {done ? <span className="nc-cell-sub">—</span> : <Op onClick={() => setEdit(r)} title="编辑基础信息与甲方对接人">编辑</Op>}
            <OpMore items={more} />
          </div>
        );
      },
    },
  ];

  return (
    <>
      <PageHead
        title="项目管理"
        sub={`共 ${ALL.length} 个项目 · 在建 ${inProgress} · 风险 ${riskCnt} · 数据来源：项目台账（商机管道见「商机管理」）`}
        actions={<Btn kind="primary" onClick={() => go('project-new')}>＋ 新建项目</Btn>}
      />

      {riskCnt > 0 && (
        <Banner tone="warn" actions={<Btn size="sm" onClick={() => { setRisk(ALL.find((r) => r.risk !== 'none')?.risk || ''); setPage(1); }}>只看风险项目</Btn>}>
          <Ico n="warning" size={14} style={{ color: 'var(--c-warning-mid)' }} /> <b>风险提醒：</b>
          {riskCnt} 个项目存在风险标记
          {ALL.some((r) => r.noContract) && <> ｜ {ALL.filter((r) => r.noContract).length} 个<b>无合同施工</b>（行左侧红条标识）</>}
          ｜ 成本超支、里程碑逾期、收款逾期均按同一口径计入。
        </Banner>
      )}

      {/* 统计卡：口径 = 全部项目台账（金额类按角色权限脱敏） */}
      <div className="nc-tiles nc-tiles-4">
        <button className="nc-tile is-clickable" onClick={() => { setStatus(''); setPage(1); }} title="口径：全部项目合同额合计（含终态）">
          <div className="nc-tile-value num">{sumCt > 0 ? <Money v={sumCt} role={role} wan /> : <span className="nc-muted">—</span>}</div>
          <div className="nc-tile-label">合同额合计</div>
          <div className="nc-tile-sub">{ALL.length} 个项目</div>
        </button>
        <button className="nc-tile is-clickable" onClick={() => { setStatus('执行中'); setPage(1); }} title="口径：全部项目执行额合计（关联销售合同汇总）">
          <div className="nc-tile-value num">{sumExec > 0 ? <Money v={sumExec} role={role} wan /> : <span className="nc-muted">—</span>}</div>
          <div className="nc-tile-label">执行额合计</div>
          <div className="nc-tile-sub">在建 {inProgress} 个</div>
        </button>
        <button className="nc-tile is-clickable" onClick={() => { setStatus(''); setPage(1); }} title="口径：全部项目已发生实际成本合计">
          <div className={'nc-tile-value num' + (sumCost > 0 ? '' : ' nc-muted')}>{sumCost > 0 ? <Money v={sumCost} role={role} wan /> : '—'}</div>
          <div className="nc-tile-label">实际成本</div>
          <div className="nc-tile-sub">{sumCost > 0 && sumCt > 0 ? `成本率 ${((sumCost / sumCt) * 100).toFixed(1)}%` : '暂无成本数据'}</div>
        </button>
        <button className="nc-tile is-clickable" onClick={() => { setStatus(''); setPage(1); }} title="口径：全部项目已回款合计（合同额 × 回款比例）">
          <div className="nc-tile-value num nc-v-green">{sumRecv > 0 ? <Money v={sumRecv} role={role} wan /> : <span className="nc-muted">—</span>}</div>
          <div className="nc-tile-label">已回款</div>
          <div className="nc-tile-sub">{sumCt > 0 ? `回款率 ${((sumRecv / sumCt) * 100).toFixed(1)}%` : '暂无回款数据'}</div>
        </button>
      </div>

      <Card flush>
        <div className="nc-ctbar" style={{ padding: '10px 12px', borderBottom: '1px solid var(--c-hairline)' }}>
          <input
            className="nc-input nc-ct-search" value={kw} placeholder="搜索编号 / 项目名 / 客户"
            onChange={(e) => { setKw(e.target.value); setPage(1); }}
          />
          <select className="nc-input" style={{ width: 156 }} value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
            <option value="">全部类型</option>
            {PROJ_TYPES.map((t) => <option key={t} value={t}>{t}（{ALL.filter((r) => r.type === t).length}）</option>)}
          </select>
          <select className="nc-input" style={{ width: 152 }} value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">全部状态</option>
            {PROJECT_STATUS.map((s) => <option key={s} value={s}>{s}（{ALL.filter((r) => r.status === s).length}）</option>)}
          </select>
          <select className="nc-input" style={{ width: 148 }} value={sortKey} onChange={(e) => { setSortKey(e.target.value); setPage(1); }} title="排序规则">
            {SORTS.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
          </select>
          <Btn size="sm" onClick={() => setMoreOpen(!moreOpen)}>{moreOpen ? '收起筛选 ▴' : '展开筛选 ▾'}</Btn>
          {moreOpen && (<>
            <select className="nc-input" style={{ width: 148 }} value={source} onChange={(e) => { setSource(e.target.value); setPage(1); }}>
              <option value="">全部来源</option>
              {PROJECT_SOURCES.map((s) => <option key={s} value={s}>{s}（{ALL.filter((r) => r.source === s).length}）</option>)}
            </select>
            <select className="nc-input" style={{ width: 132 }} value={pm} onChange={(e) => { setPm(e.target.value); setPage(1); }}>
              <option value="">全部项目经理</option>
              {pms.map((o) => <option key={o} value={o}>{o}（{ALL.filter((r) => r.pm === o).length}）</option>)}
            </select>
            <select className="nc-input" style={{ width: 200 }} value={customer} onChange={(e) => { setCustomer(e.target.value); setPage(1); }}>
              <option value="">全部客户</option>
              {custs.map((c) => <option key={c} value={c}>{c}（{ALL.filter((r) => r.customer === c).length}）</option>)}
            </select>
            <select className="nc-input" style={{ width: 168 }} value={risk} onChange={(e) => { setRisk(e.target.value); setPage(1); }}>
              <option value="">全部风险</option>
              {riskKeys.map((k) => <option key={k} value={k}>{PROJECT_RISKS[k].label}（{ALL.filter((r) => r.risk === k).length}）</option>)}
            </select>
            <Btn size="sm" onClick={reset}>重置</Btn>
          </>)}
          <span style={{ marginLeft: 'auto' }}>
            <Btn size="sm" onClick={() => go('cert')}>证书占用 →</Btn>
          </span>
        </div>

        <DataTable
          cols={cols} rows={paged} rowKey={(r) => r.id} minWidth={1660}
          /* 行底色：终态灰底弱化；无合同施工行左侧红色竖条（§9.1 特殊） */
          rowClass={(r) => [
            (PROJECT_TERMINAL as readonly string[]).includes(r.status) ? 'is-dead-row' : '',
            r.noContract ? 'is-nocontract-row' : '',
          ].filter(Boolean).join(' ')}
          onRowClick={(r) => openProject(r)}
          empty="没有符合条件的项目"
          emptyCta={<Btn kind="primary" onClick={() => go('project-new')}>＋ 新建项目</Btn>}
        />
        <TableFoot
          unit="个项目" total={ALL.length} filtered={rows.length} page={page} pageSize={pageSize}
          onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }}
          extra={<span className="nc-cell-sub"> ｜ 行点击进入项目经营中心 ｜ 来源：{PROJECT_SOURCES.join(' / ')}</span>}
        />
      </Card>

      {/* ============ 编辑抽屉（§9.4：960px，基础信息 / 甲方对接人 / 备注） ============ */}
      <Drawer
        open={!!edit} onClose={() => setEdit(null)} width={840}
        title={`编辑项目 · ${edit?.name ?? ''}`} sub={edit ? `${edit.id} · 状态 ${edit.status}` : ''}
        foot={<><Btn onClick={() => setEdit(null)}>取消</Btn><Btn kind="primary" onClick={() => { toast(`「${edit?.name}」基础信息已保存`); setEdit(null); }}>保存</Btn></>}
      >
        {edit && (<>
          <div className="nc-ledhd">基础信息
            <Tip w={330} text="编号与来源为系统生成，不可修改；状态、金额、成本等运行数据只在项目经营中心只读展示。" />
          </div>
          <div className="nc-form-grid">
            <Field label="项目编号"><input className="nc-input" readOnly value={edit.id} /></Field>
            <Field label="来源"><input className="nc-input" readOnly value={edit.source} /></Field>
            <Field label="项目名" req span={2}><input className="nc-input" defaultValue={edit.name} /></Field>
            <Field label="客户" req span={2}><input className="nc-input" defaultValue={edit.customer} /></Field>
            <Field label="项目类型" req>
              <select className="nc-input" defaultValue={edit.type}>{PROJ_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
            </Field>
            <Field label="项目经理" req>
              <select className="nc-input" defaultValue={edit.pm}>{pms.map((o) => <option key={o}>{o}</option>)}</select>
            </Field>
          </div>

          <div className="nc-ledhd" style={{ marginTop: 18 }}>甲方现场对接人
            <Tip w={300} text="独立于客户单位联系人，用于现场施工沟通与验收签认。" />
          </div>
          <div className="nc-form-grid">
            <Field label="姓名"><input className="nc-input" placeholder="如 杨科长" /></Field>
            <Field label="联系电话"><input className="nc-input" placeholder="139****3321" /></Field>
            <Field label="职务" span={2}><input className="nc-input" placeholder="如 后勤科科长" /></Field>
          </div>

          <div className="nc-ledhd" style={{ marginTop: 18 }}>扩展</div>
          <div className="nc-form-grid">
            <Field label="备注" span={4}><textarea className="nc-input" rows={3} placeholder="现场约束、施工窗口、特殊要求等" /></Field>
          </div>
        </>)}
      </Drawer>
    </>
  );
}
