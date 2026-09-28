// 诺安云 6.0 · 供应商管理（准入状态机）· PRD §18
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Banner, Btn, Card, ChainBar, Check, DataTable, Drawer, Field, KvGrid, ListToolbar, Modal,
  EntityLink, Money, Op, OpSep, PageHead, TableFoot, Tag, Tabs, Tile, Timeline, maskPhone, canSeePhone, useToast, type Col, pressProps,} from '../components/ui';
import { CONTRACTS, ITEMS, MATERIALS, SUPPLIERS, TODAY, fmt, fmtWan, supScore } from '../components/data';
import { getFocus } from '../components/store';
import { Ico } from '../components/icons';
import { ExportButton, useExport, getUserName, ExportDialog, type ExportField } from '../components/export';
import { RecognitionWorkbench, type RecognitionField } from '../components/RecognitionWorkbench';

/* ============ 准入状态机 ============ */
type St = '待准入' | '已准入' | '已拒绝' | '已冻结';
const ST_TONE: Record<string, string> = { 待准入: 'orange', 已准入: 'green', 已拒绝: 'red', 已冻结: 'gray' };
const ST_DESC: Record<string, string> = {
  待准入: '资质审核中，不可参与询比价与下单',
  已准入: '可参与询比价、下单与结算',
  已拒绝: '资质不合规，永久不可下单（可申诉一次）',
  已冻结: '合作中出现重大问题，暂停全部业务往来',
};

/* 准入资料清单（硬校验） */
const ACCESS_DOCS = [
  { k: '营业执照', req: true },
  { k: '消防产品认证证书（CCCF）', req: true },
  { k: '安全生产许可证', req: false },
  { k: '开户许可证 / 银行信息', req: true },
  { k: '一般纳税人资格证明', req: true },
  { k: '近三年业绩证明', req: false },
];

/** 营业执照识别 → 识别工作台 mock 字段 */
const SUP_RECOG_FIELDS: RecognitionField[] = [
  { key: 'creditCode', label: '统一社会信用代码', value: '91530100MA6KXXXXXX', type: 'text' },
  { key: 'name', label: '企业名称', value: '昆明XX商贸有限公司', type: 'text' },
  { key: 'legalRep', label: '法定代表人', value: '李四', type: 'text' },
  { key: 'regCap', label: '注册资本', value: '500万元', type: 'text' },
  { key: 'estDate', label: '成立日期', value: '2018-03-15', type: 'date' },
  { key: 'bizScope', label: '经营范围', value: '建筑材料销售；消防设备及器材批发；五金产品零售', type: 'text' },
];

type Sup = (typeof SUPPLIERS)[number] & { docs?: Record<string, boolean>; applyAt?: string; applicant?: string; reason?: string };

export default function SupplierPage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  const [tab, setTab] = useState('all');
  const [kw, setKw] = useState('');
  const [cat, setCat] = useState('all');
  const [level, setLevel] = useState('all');
  const [detail, setDetail] = useState<Sup | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [freeze, setFreeze] = useState<Sup | null>(null);
  const [freezeTxt, setFreezeTxt] = useState('');
  const [reject, setReject] = useState<Sup | null>(null);
  const [rejectTxt, setRejectTxt] = useState('');
  const [blackTxt, setBlackTxt] = useState('');
  const [blackOnly, setBlackOnly] = useState(false);
  const [freezeBlack, setFreezeBlack] = useState(false);
  /* G1：新增供应商表单改为受控（原全 uncontrolled，提交时读不到任何值，只能 toast） */
  const [nName, setNName] = useState('');
  const [nCats, setNCats] = useState<string[]>(['物料']);
  const [nContact, setNContact] = useState('');
  const [nPhone, setNPhone] = useState('');
  const [nValid, setNValid] = useState('2027-06-30');
  /* 项21：量化评级依据字段（资质等级/年合作金额/合作年限），用于自动建议评级 */
  const [nCertGrade, setNCertGrade] = useState('无');
  const [nAmt, setNAmt] = useState('');
  const [nYears, setNYears] = useState('');
  const [nLevel, setNLevel] = useState('C');
  /* 项22：统一社会信用代码（受控，OCR 可自动填入）+ 经营范围（OCR mock）+ 资料分类型上传 */
  const [nCreditCode, setNCreditCode] = useState('');
  /** 营业执照识别工作台开关 */
  const [recogOpen, setRecogOpen] = useState(false);
  const [nBizScope, setNBizScope] = useState('');
  const [nDocType, setNDocType] = useState('营业执照');
  const [nUploadedDocs, setNUploadedDocs] = useState<string[]>([]);
  /* 供货范围「引用主数据」：从物料主数据勾选该供应商供应的物料 / 服务，保留手填品类 */
  const [scopePickOpen, setScopePickOpen] = useState(false);
  const [scopePicked, setScopePicked] = useState<string[]>([]);
  const SCOPE_KINDS = ['物料', '服务', '套件', '软件'] as const;
  /** 新增供应商表单：打开时与提交后统一重置 */
  const resetNewSup = () => { setNName(''); setNCats(['物料']); setNContact(''); setNPhone(''); setNValid('2027-06-30'); setNCertGrade('无'); setNAmt(''); setNYears(''); setNLevel('C'); setNCreditCode(''); setNBizScope(''); setNDocType('营业执照'); setNUploadedDocs([]); setScopePicked([]); };

  /* 项21：根据量化指标自动建议评级（示例规则：资质甲级且年合作≥500万→A；乙级或年合作≥100万→B；其余→C） */
  const suggestedLevel = (() => {
    const amt = parseFloat(nAmt) || 0;
    if (nCertGrade === '甲级' && amt >= 500) return 'A';
    if (nCertGrade === '乙级' || amt >= 100) return 'B';
    return 'C';
  })();
  /* 量化依据变化时自动同步建议值到评级 select（用户仍可手动微调） */
  const syncSuggested = (grade: string, amt: string, years: string) => {
    const v = parseFloat(amt) || 0;
    const lv = grade === '甲级' && v >= 500 ? 'A' : (grade === '乙级' || v >= 100 ? 'B' : 'C');
    setNLevel(lv);
  };
  /* 项22：OCR 识别营业执照（mock：自动填入社会信用代码/名称/经营范围） */
  const mockOcr = () => {
    setNCreditCode('91530100MA6KXXXXXX');
    if (!nName.trim()) setNName('昆明XX商贸有限公司');
    setNBizScope('建筑材料销售；消防设备及器材批发；五金产品零售；（依法须经批准的项目，经相关部门批准后方可开展经营活动）');
    toast('已识别营业执照信息，请核对');
  };

  /** 识别工作台「全部确认并写入」：把核对后的字段填入新增供应商表单 */
  const onSupRecog = (fs: RecognitionField[]) => {
    const get = (k: string) => fs.find((f) => f.key === k)?.value ?? '';
    setNCreditCode(get('creditCode'));
    const nm = get('name');
    if (nm && !nName.trim()) setNName(nm);
    setNBizScope(get('bizScope'));
    toast('已填入识别结果，请核对');
  };
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  /** 导出勾选（与列表勾选列同源） */
  const [supSel, setSupSel] = useState<string[]>([]);
  /* 项15：供应商导入（Excel 模板，mock） */
  const [importOpen, setImportOpen] = useState(false);

  /* G1：原 rows 为 useMemo 派生常量，准入 / 冻结 / 拒绝 / 解冻等写操作只 toast 不改数据。
     改为可写 state，状态机真实回流列表、筛选计数与详情抽屉。 */
  const [rows, setRows] = useState<Sup[]>(() => SUPPLIERS.map((s) => ({
    ...s,
    docs: {
      '营业执照': true,
      '消防产品认证证书（CCCF）': s.cats.includes('物料'),
      '安全生产许可证': s.cats.includes('分包') || s.cats.includes('服务'),
      '开户许可证 / 银行信息': s.status !== '待准入',
      '一般纳税人资格证明': s.level !== 'C',
      '近三年业绩证明': s.coop > 0,
    },
    applyAt: s.status === '待准入' ? '2026-09-15' : '2026-05-08',
    applicant: '行政 · 王敏',
    reason: s.status === '已冻结' ? '连续 2 批次到货延期超 15 天，且线缆抽检不合格（2026-06-18 通报）'
      : s.status === '已拒绝' ? 'CCCF 证书系伪造（资质造假），永久拒绝，可申诉一次' : '',
  })));

  /**
   * 跨页穿透：从物料价格库 / 询比价邀约 / 比价矩阵等页面下钻进来时，按聚焦 ID 自动打开供应商档案。
   * 以 nav（路由脉冲）为依赖，保证反复下钻同一页也能重新定位。
   */
  useEffect(() => {
    const id = getFocus('supplier');
    if (!id) return;
    const hit = rows.find((x) => x.id === id);
    if (hit) setDetail(hit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nav]);

  const filtered = rows.filter((s) =>
    (tab === 'all' || s.status === tab)
    && (cat === 'all' || s.cats.includes(cat))
    && (level === 'all' || s.level === level)
    && (!blackOnly || s.blacklist)
    && (!kw || s.name.includes(kw) || s.id.includes(kw) || s.contact.includes(kw)));
  /* TableFoot total 以当前页签视图为基数 */
  const tabBase = rows.filter((s) => tab === 'all' || s.status === tab);

  const paged = filtered.slice((page - 1) * pageSize, page * pageSize);

  /* ============ 统一导出（联系人 / 电话 / 银行账户为敏感字段） ============ */
  const exportFields: ExportField[] = [
    { key: 'id', label: '供应商编号' },
    { key: 'name', label: '名称' },
    { key: 'cats', label: '类型' },
    { key: 'contact', label: '联系人', sensitive: true },
    { key: 'phone', label: '电话', sensitive: true },
    { key: 'bank', label: '银行账户', sensitive: true },
    { key: 'status', label: '合作状态' },
    { key: 'level', label: '评级' },
  ];
  const exportApi = useExport({
    pageKey: 'supplier',
    pageName: '供应商台账',
    fields: exportFields,
    defaultFieldKeys: exportFields.map((f) => f.key),
    totalCount: rows.length,
    filteredCount: filtered.length,
    selectedCount: supSel.length,
    previewRows: filtered.slice(0, 5),
    userName: getUserName(role),
    onExport: () => { /* 原型：导出动作与审计上报由 useExport 内置完成 */ },
  });

  const docOk = (s: Sup) => {
    const must = ACCESS_DOCS.filter((d) => d.req);
    return must.every((d) => s.docs?.[d.k]);
  };

  /** 项15：补传准入资料（mock：缺失 / 未提交项可补传，标记为已提交并同步列表） */
  const resupDoc = (docKey: string) => {
    if (!detail) return;
    const upd: Sup = { ...detail, docs: { ...(detail.docs || {}), [docKey]: true } };
    setRows((rs) => rs.map((x) => (x.id === detail.id ? upd : x)));
    setDetail(upd);
    toast(`已补传「${docKey}」，准入资料清单与审核状态刷新`);
  };

  const setStatus = (s: Sup, st: St, reason = '', blackOverride?: boolean) => {
    setRows((rs) => rs.map((x) => (x.id === s.id
      ? { ...x, status: st, blacklist: blackOverride !== undefined ? blackOverride : st === '已冻结' ? true : st === '已准入' ? false : x.blacklist, reason: reason || x.reason }
      : x)));
    setDetail(null); setFreeze(null); setReject(null); setFreezeTxt(''); setRejectTxt('');
    toast(`${s.name} 已${st === '已准入' ? '通过准入审核' : st === '已拒绝' ? '标记为已拒绝' : st === '已冻结' ? '冻结（同步至黑名单拦截规则）' : '解冻 / 恢复合作'}`);
  };

  const cols: Col<Sup>[] = [
    { key: 'id', title: '供应商编号', width: 120, hide: true, render: (s) => <span className="num nc-link" onClick={() => setDetail(s)} {...pressProps(() => setDetail(s))}>{s.id}</span> },
    {
      key: 'name', title: '供应商名称', sticky: 'left', render: (s) => (
        <span>{s.name}{s.blacklist && <span className="nc-black-tag">黑名单</span>}
          {s.validTo && s.validTo < TODAY && <Tag tone="red">资质过期</Tag>}
        </span>
      ),
    },
    { key: 'cats', title: '供货范围', width: 140, render: (s) => <>{s.cats.map((c) => <Tag key={c} tone="blue">{c}</Tag>)}</> },
    {
      /* 对齐参考《主数据管理》339-340 行：综合评分 = 质量 40% + 交期 30% + 价格 20% + 服务 10% */
      key: 'score', title: '综合评分', width: 96, align: 'right', render: (s) => {
        const sc = supScore(s);
        return s.coop === 0
          ? <span className="nc-muted">—</span>
          : <b className="num" title={`质量 ${s.q}×40% + 交期 ${s.d}×30% + 价格 ${s.p}×20% + 服务 ${s.s}×10%`} style={{ color: sc >= 90 ? 'var(--c-success)' : sc >= 75 ? 'var(--c-warning-deep)' : 'var(--c-danger)' }}>{sc}</b>;
      },
    },
    { key: 'onTime', title: '准时率', width: 86, align: 'right', render: (s) => s.coop === 0 ? <span className="nc-muted">—</span> : <span className="num nc-cursor-help" title="准时率 = 按时交付批次 ÷ 总交付批次，源自履约记录">{s.onTime}%</span> },
    { key: 'qualRate', title: '质量合格率', width: 96, align: 'right', render: (s) => s.coop === 0 ? <span className="nc-muted">—</span> : <span className="num nc-cursor-help" title="合格率 = 抽检合格批次 ÷ 总抽检批次，源自质检记录">{s.qualRate}%</span> },
    { key: 'priceAgr', title: '价格协议', width: 160, render: (s) => <span className="nc-tiny nc-muted">{s.priceAgr}</span> },
    { key: 'level', title: '评级', width: 78, align: 'center', render: (s) => <b className={s.level === 'A' ? 'nc-v-green' : s.level === 'D' ? 'nc-v-red' : ''}>{s.level}</b> },
    { key: 'coop', title: '合作次数', width: 88, align: 'right', render: (s) => <span className="num">{s.coop}</span> },
    { key: 'amt', title: '累计合作额', width: 120, align: 'right', render: (s) => (s.amt ? <b className="num"><Money v={s.amt} role={role} wan /></b> : <span className="nc-muted">—</span>) },
    { key: 'validTo', title: '资质有效期', width: 120, align: 'right', render: (s) => s.validTo ? <span style={{ whiteSpace: 'nowrap' }} className={`num${s.validTo < TODAY ? ' nc-v-red' : ''}`} title={s.validTo < TODAY ? '资质已过期，不可参与询比价与下单' : undefined}>{s.validTo}{s.validTo < TODAY ? ' 已过期' : ''}</span> : <span className="nc-muted">—</span> },
    { key: 'status', title: '准入状态', width: 100, render: (s) => <Tag tone={ST_TONE[s.status] as 'orange'}>{s.status}</Tag> },
    {
      key: 'op', title: '操作', width: 150, render: (s) => (
        <span onClick={(e) => e.stopPropagation()}>
          <Op onClick={() => setDetail(s)}>详情</Op>
          {s.status === '待准入' && <>
            <OpSep />
            <Op onClick={() => docOk(s) ? setStatus(s, '已准入') : toast(`资料不齐：${ACCESS_DOCS.filter((d) => d.req && !s.docs?.[d.k]).map((d) => d.k).join('、')}`, 'err')}>准入</Op>
            <OpSep />
            <Op danger onClick={() => { setReject(s); setRejectTxt(''); }}>拒绝</Op>
          </>}
          {s.status === '已准入' && <><OpSep /><Op danger onClick={() => { setFreeze(s); setFreezeTxt(''); setFreezeBlack(!!s.blacklist); }}>冻结</Op></>}
          {(s.status === '已冻结' || s.status === '已拒绝') && <><OpSep /><Op onClick={() => setStatus(s, '已准入')}>解冻 / 恢复</Op></>}
        </span>
      ),
    },
  ];

  const ACCESS_STEPS = (s: Sup) => [
    { label: '提交准入申请', sub: s.applicant, state: 'done' as const },
    { label: '资质资料审核', sub: docOk(s) ? '必需资料齐全' : '资料缺失', state: docOk(s) ? 'done' as const : 'cur' as const },
    { label: '准入审批', sub: '部门负责人 → 分管副总', state: s.status === '已准入' ? 'done' as const : s.status === '已拒绝' ? 'rejected' as const : 'cur' as const },
    { label: '准入生效', sub: s.status === '已准入' ? '已可参与询比价' : '待生效', state: s.status === '已准入' ? 'done' as const : 'todo' as const },
  ];

  /** 合作记录：采购合同中「乙方 = 当前供应商」，此前未按供应商过滤（所有供应商都看到同一份清单） */
  const coopRows = detail
    ? CONTRACTS.filter((c) => c.type === '采购合同' && c.party === detail.name)
    : [];

  return (
    <>
      <PageHead
        crumbs={['供应链', '供应商管理']}
        title="供应商管理"
        badges={<><Tag tone="orange">待准入 {rows.filter((s) => s.status === '待准入').length}</Tag><Tag tone="red">黑名单 {rows.filter((s) => s.blacklist).length}</Tag></>}
        actions={<><Btn onClick={() => go('settings')} title="准入资料清单与黑名单规则见系统设置"><Ico n="gear" size={16} /> 准入规则</Btn></>}
      />

      <div className="nc-tiles nc-tiles-6">
        <Tile label="供应商总数" value={rows.length} sub="在册供方" />
        <Tile label="已准入" value={rows.filter((s) => s.status === '已准入').length} sub="可正常下单" />
        <Tile label="待准入" value={rows.filter((s) => s.status === '待准入').length} tone="orange" sub="审核中 · 不可下单" />
        <Tile label="已冻结" value={rows.filter((s) => s.status === '已冻结').length} tone="orange" sub="暂停往来" />
        <Tile label="A 级供应商" value={rows.filter((s) => s.level === 'A').length} sub="优先询比价" />
        <Tile label="资质临期" value={rows.filter((s) => s.validTo && s.validTo < '2026-12-31').length} tone="orange" sub="90 天内到期" />
      </div>

      <Banner tone="danger" actions={<Btn size="sm" kind={blackOnly ? 'primary' : 'danger'} onClick={() => setBlackOnly((v) => !v)}>{blackOnly ? '退出黑名单视图' : '查看黑名单'}</Btn>}>
        <b>黑名单硬拦截：</b>黑名单供应商在询比价 / 下单 / 付款三环节直接拦截，不可绕过。
      </Banner>

      <Card flush>
        <div style={{ padding: '12px 16px 0' }}>
          <Tabs value={tab} onChange={(k) => { setTab(k); setPage(1); }} items={[
            { key: 'all', label: '全部', cnt: rows.length },
            { key: '已准入', label: '已准入', cnt: rows.filter((s) => s.status === '已准入').length },
            { key: '待准入', label: '待准入', cnt: rows.filter((s) => s.status === '待准入').length },
            { key: '已拒绝', label: '已拒绝', cnt: rows.filter((s) => s.status === '已拒绝').length },
            { key: '已冻结', label: '已冻结', cnt: rows.filter((s) => s.status === '已冻结').length },
          ]} />
        </div>
        <div style={{ padding: '0 16px 12px' }}>
          <ListToolbar
            rows={[
              {
                label: '评级', value: level, onChange: (k) => { setLevel(k); setPage(1); },
                items: [
                  { key: 'all', label: '全部评级', cnt: rows.length },
                  ...['A', 'B', 'C', 'D'].map((c) => ({ key: c, label: `${c} 级`, cnt: rows.filter((s) => s.level === c).length })),
                ],
              },
              {
                label: '范围', value: cat, onChange: (k) => { setCat(k); setPage(1); },
                items: [
                  { key: 'all', label: '全部范围', cnt: rows.length },
                  ...['物料', '分包', '服务', '机械', '检测'].map((c) => ({ key: c, label: c, cnt: rows.filter((s) => s.cats.includes(c)).length })),
                ],
              },
            ]}
            search={{ value: kw, onChange: (v) => { setKw(v); setPage(1); }, placeholder: '搜索编号 / 名称 / 联系人' }}
            onReset={() => { setKw(''); setCat('all'); setLevel('all'); setPage(1); }}
            moreMenu={[{ label: '导入（Excel 模板）', onClick: () => setImportOpen(true) }]}
            actions={<>
              <ExportButton onClick={exportApi.trigger} selectedCount={supSel.length} />
              <Btn kind="primary" onClick={() => { setNewOpen(true); resetNewSup(); }}>+ 新增供应商</Btn>
            </>}
          />
        </div>
        <DataTable cols={cols} rows={paged} rowKey={(s) => s.id} minWidth={1440} onRowClick={(s) => setDetail(s)}
        selectable selected={supSel} onSelectAll={setSupSel} onSelectRow={(id) => setSupSel((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])}
        empty="没有符合筛选条件的供应商；黑名单供应商在合同 / 付款 / 询价环节一律硬拦截"
        emptyCta={<Btn kind="primary" onClick={() => { setNewOpen(true); resetNewSup(); }}>＋ 新增供应商</Btn>}
          /* 条目背景色统一：黑名单供应商不再整行铺红底，改由「黑名单」标签承担 */
          foot={<TableFoot total={tabBase.length} filtered={filtered.length} page={page} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />} />
      </Card>

      {/* ============ 详情抽屉 ============ */}
      <Drawer open={!!detail} width={800} onClose={() => setDetail(null)} title={detail?.name || ''}
        sub={`${detail?.id} · ${detail?.contact} · ${detail?.phone ? (canSeePhone(role) ? detail.phone : maskPhone(detail.phone)) : '—'}`}
        foot={detail && (<>
          {detail.status === '待准入' && <>
            <Btn onClick={() => { setReject(detail); setRejectTxt(''); }} danger>拒绝准入</Btn>
            <Btn kind="primary" onClick={() => docOk(detail) ? setStatus(detail, '已准入') : toast('必需资料不齐，不可准入', 'err')}>通过准入</Btn>
          </>}
          {detail.status === '已准入' && <><Btn onClick={() => toast('已发起年度复评')}>发起复评</Btn><Btn kind="danger" onClick={() => { setFreeze(detail); setFreezeTxt(''); setFreezeBlack(!!detail.blacklist); }}>冻结供应商</Btn></>}
          {(detail.status === '已冻结' || detail.status === '已拒绝') && <Btn kind="primary" onClick={() => setStatus(detail, '已准入')}>解冻 / 恢复合作</Btn>}
        </>)}>
        {detail && <>
          {detail.blacklist && <Alert icon="" tone="danger" title="该供应商已列入黑名单" sub="所有询比价邀请、采购下单、付款申请均被系统拦截。" />}

          <Field label="准入流程" span={4}>
            <div style={{ marginTop: 8 }}><ChainBar nodes={ACCESS_STEPS(detail)} /></div>
          </Field>

          <Field label="基础信息" span={4}>
            <KvGrid cols={3} rows={[
              { k: '准入状态', v: <><Tag tone={ST_TONE[detail.status] as 'green'}>{detail.status}</Tag> <span className="nc-cell-sub">{ST_DESC[detail.status]}</span></> },
              { k: '供应商编号', v: detail.id },
              { k: '供货范围（大类）', v: detail.cats.join(' / ') },
              { k: '具体供货范围', v: detail.scopeCodes && detail.scopeCodes.length
                ? detail.scopeCodes.map((c) => ITEMS.find((x) => x.code === c)?.name ?? c).join('、')
                : <span className="nc-muted">—（未引用主数据，见上方大类标签）</span> },
              { k: '评级', v: detail.level + ' 级' },
              { k: '合作次数', v: String(detail.coop) },
              { k: '累计合作额', v: <Money v={detail.amt} role={role} /> },
              { k: '资质有效期', v: detail.validTo || '—' },
              { k: '联系人', v: detail.contact },
              { k: '联系电话', v: detail.phone ? (canSeePhone(role) ? detail.phone : <span title="当前角色列表内电话脱敏，详情见权限矩阵">{maskPhone(detail.phone)}</span>) : '—' },
              { k: '申请时间', v: detail.applyAt || '—' },
            ]} />
          </Field>

          <Field label="准入资料清单（必需项缺失不可准入）" span={4}>
            <table className="nc-tbl" style={{ minWidth: 560 }}>
              <thead><tr><th>资料名称</th><th style={{ width: 90 }}>是否必需</th><th style={{ width: 90 }}>提交状态</th><th style={{ width: 90 }}>操作</th></tr></thead>
              <tbody>
                {ACCESS_DOCS.map((d) => (
                  <tr key={d.k}>
                    <td>{d.k}</td>
                    <td>{d.req ? <Tag tone="red">必需</Tag> : <Tag tone="gray">选填</Tag>}</td>
                    <td>{detail.docs?.[d.k] ? <Tag tone="green">已提交</Tag> : <Tag tone={d.req ? 'red' : 'gray'}>{d.req ? '缺失' : '未提交'}</Tag>}</td>
                    <td>{!detail.docs?.[d.k] && <Btn size="sm" onClick={() => resupDoc(d.k)}>补传</Btn>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Field>

          {detail.reason && (
            <Field label="冻结 / 拒绝原因" span={4}>
              <div className="nc-warnbox is-danger"><div>{detail.reason}</div></div>
            </Field>
          )}

          <Field label={`合作记录（${coopRows.length} 笔采购合同）`} span={4}
            note="按「采购合同 · 乙方 = 本供应商」过滤，与合同台账同源">
            <table className="nc-tbl" style={{ minWidth: 560 }}>
              <thead><tr><th>合同编号</th><th>合同名称</th><th style={{ width: 120, textAlign: 'right' }}>金额</th><th style={{ width: 110 }}>状态</th></tr></thead>
              <tbody>
                {coopRows.map((c) => (
                  <tr key={c.id}><td><EntityLink target="contract" id={c.id} go={go} title="下钻到合同详情">{c.id}</EntityLink></td><td>{c.name}</td><td className="is-num num"><Money v={c.amt} role={role} wan /></td><td><Tag tone={c.status === '履约中' ? 'green' : 'gray'}>{c.status}</Tag></td></tr>
                ))}
                {!coopRows.length && <tr><td colSpan={4} className="nc-muted">暂无合作记录：该供应商名下尚无采购合同</td></tr>}
              </tbody>
            </table>
          </Field>

          <Field label="操作日志" span={4}>
            <Timeline items={[
              { date: detail.applyAt || '2026-05-08', text: `提交准入申请（${detail.applicant}）`, tone: 'gray' },
              { date: '2026-05-09', text: '资料审核通过 · 必需资料齐全', tone: 'ok' },
              { date: '2026-05-10', text: '准入审批通过 · 部门负责人 → 分管副总', tone: 'ok' },
              ...(detail.status === '已冻结' ? [{ date: '2026-06-18', text: `冻结：${detail.reason}`, tone: 'red' as const }] : []),
            ]} />
          </Field>
        </>}
      </Drawer>

      {/* ============ 冻结 ============ */}
      <Modal open={!!freeze} title={`冻结供应商 · ${freeze?.name || ''}`} width={480} onClose={() => setFreeze(null)}
        foot={<><Btn onClick={() => setFreeze(null)}>取消</Btn>
          <Btn kind="primary" danger disabled={!freezeTxt.trim()} title={freezeTxt.trim() ? undefined : '冻结须填写原因（必填，同步至黑名单硬拦截）'} onClick={() => { if (freeze) { setBlackTxt(''); setStatus(freeze, '已冻结', freezeTxt, freezeBlack); toast(freezeBlack ? '已冻结并同步至黑名单拦截规则' : '已冻结（未列入黑名单，仅暂停业务往来）'); } }}>确认冻结</Btn></>}>
        <div className="nc-warnbox is-danger">
          <b><Ico n="warning" size={16} /> 冻结后立即生效</b>
          <div>① 不可再被询比价邀请；② 未下单的采购申请被拦截；③ 未付款的付款申请将被暂停（须财务二次确认）。</div>
        </div>
        <Field label="冻结原因" req note={`${freezeTxt.length}/200 字`}>
          <textarea className="nc-input" rows={4} maxLength={200} value={freezeTxt} onChange={(e) => setFreezeTxt(e.target.value)} placeholder="如：连续 2 批次到货延期超 15 天，且抽检不合格" />
        </Field>
        <div style={{ marginTop: 12 }}>
          <Check checked={freezeBlack} onChange={setFreezeBlack} label="同时列入黑名单（永久拦截）" />
        </div>
      </Modal>

      {/* ============ 拒绝准入 ============ */}
      <Modal open={!!reject} title={`拒绝准入 · ${reject?.name || ''}`} width={480} onClose={() => setReject(null)}
        foot={<><Btn onClick={() => setReject(null)}>取消</Btn>
          <Btn kind="primary" danger disabled={!rejectTxt.trim()} title={rejectTxt.trim() ? undefined : '拒绝准入须填写原因（必填）'} onClick={() => reject && setStatus(reject, '已拒绝', rejectTxt)}>确认拒绝</Btn></>}>
        <Field label="拒绝原因" req note={`${rejectTxt.length}/200 字 · 将通知申请人`}>
          <textarea className="nc-input" rows={4} maxLength={200} value={rejectTxt} onChange={(e) => setRejectTxt(e.target.value)} placeholder="如：消防产品认证证书（CCCF）缺失且未在补正期内提交" />
        </Field>
      </Modal>

      {/* ============ 新增供应商 ============ */}
      <Drawer open={newOpen} title="新增供应商（提交准入申请）" width={840} onClose={() => setNewOpen(false)}
        foot={<><Btn onClick={() => setNewOpen(false)}>取消</Btn><Btn kind="primary" onClick={() => {
          if (!nName.trim()) { toast('供应商名称未填写', 'err'); return; }
          if (!nCats.length) { toast('供货范围至少选择 1 项', 'err'); return; }
          if (!nContact.trim() || !nPhone.trim()) { toast('联系人 / 联系电话未填写', 'err'); return; }
          const maxGys = rows.reduce((m, r) => { const mm = /^GYS(\d+)$/.exec(r.id); return mm ? Math.max(m, parseInt(mm[1], 10)) : m; }, 0);
          const id = `GYS${String(maxGys + 1).padStart(6, '0')}`;
          const one: Sup = {
            id, name: nName.trim(), cats: nCats, status: '待准入', level: nLevel as Sup['level'], coop: 0, amt: 0,
            blacklist: false, validTo: nValid, contact: nContact.trim(), phone: nPhone.trim(),
            scopeCodes: scopePicked,
            docs: Object.fromEntries(ACCESS_DOCS.map((d) => [d.k, false])),
            applyAt: TODAY, applicant: '行政 · 王敏', reason: '',
          } as Sup;
          setRows((rs) => [one, ...rs]);
          setNewOpen(false);
          resetNewSup();
          toast(`${one.name}（${id}）准入申请已提交，状态「待准入」· 补齐必需资料后方可通过准入`);
        }}>提交准入申请</Btn></>}>
        <div className="nc-warnbox is-info">
          <b>提交后进入「待准入」状态</b>
          <div>必需资料（营业执照、CCCF 认证、开户信息、一般纳税人证明）齐全后方可通过准入审核；审核通过前不可参与询比价与下单。</div>
        </div>
        <div className="nc-form-grid">
          <Field label="供应商名称" req span={2} err={nName.trim() ? undefined : undefined}>
            <input className="nc-input" value={nName} onChange={(e) => setNName(e.target.value)} placeholder="如：云南××消防设备有限公司" />
          </Field>
          <Field label="统一社会信用代码" req note="可 OCR 识别营业执照自动填入">
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="nc-input" value={nCreditCode} onChange={(e) => setNCreditCode(e.target.value)} placeholder="91530xxxxxxxxxxxxx" />
              <Btn size="sm" onClick={() => setRecogOpen(true)} title="OCR 识别营业执照 → 识别工作台核对"><Ico n="search" size={14} /> OCR识别营业执照</Btn>
            </div>
          </Field>
          {nBizScope && (
            <Field label="经营范围（OCR 识别，请核对）" span={4}>
              <div className="nc-tiny nc-muted" style={{ background: 'var(--bg-2,#f5f6f8)', padding: 8, borderRadius: 6 }}>{nBizScope}</div>
            </Field>
          )}
          <Field label="供货范围" req note="先选大类；可再「引用主数据」勾选具体供应的物料 / 服务，保留手填">
            <div className="nc-pick-inline">
              {['物料', '分包', '服务', '机械', '检测'].map((c) => (
                <label key={c} className={`nc-pick-chip${nCats.includes(c) ? ' is-on' : ''}`}>
                  <input type="checkbox" className="nc-check" checked={nCats.includes(c)}
                    onChange={(e) => setNCats((cs) => (e.target.checked ? [...cs, c] : cs.filter((x) => x !== c)))} />
                  <span>{c}</span>
                </label>
              ))}
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <Btn size="sm" onClick={() => setScopePickOpen(true)}><Ico n="building" size={14} /> 引用主数据（已选 {scopePicked.length} 项）</Btn>
              {scopePicked.map((code) => {
                const it = ITEMS.find((x) => x.code === code);
                return it ? <Tag key={code} tone="blue">{it.name} <span className="nc-muted">({it.code})</span></Tag> : null;
              })}
            </div>
          </Field>
          <Field label="联系人" req><input className="nc-input" value={nContact} onChange={(e) => setNContact(e.target.value)} placeholder="刘经理" /></Field>
          <Field label="联系电话" req><input className="nc-input" value={nPhone} onChange={(e) => setNPhone(e.target.value)} placeholder="138xxxxxxxx" /></Field>
          <Field label="资质有效期" req><input className="nc-input" type="date" value={nValid} onChange={(e) => setNValid(e.target.value)} /></Field>
          {/* 项21：量化评级依据字段 */}
          <Field label="资质等级" note="用于自动建议评级">
            <select className="nc-input" value={nCertGrade} onChange={(e) => { setNCertGrade(e.target.value); syncSuggested(e.target.value, nAmt, nYears); }}>
              {['甲级', '乙级', '丙级', '无'].map((g) => <option key={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="年合作金额" note="单位：万元">
            <input className="nc-input" type="number" value={nAmt} onChange={(e) => { setNAmt(e.target.value); syncSuggested(nCertGrade, e.target.value, nYears); }} placeholder="如 500" />
          </Field>
          <Field label="合作年限" note="单位：年">
            <input className="nc-input" type="number" value={nYears} onChange={(e) => { setNYears(e.target.value); syncSuggested(nCertGrade, nAmt, e.target.value); }} placeholder="如 3" />
          </Field>
          <Field label="建议评级" note={`评级依据：资质等级40% + 合作金额40% + 合作年限20%（示例规则）· 当前自动建议 ${suggestedLevel} 级，可手动微调`}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select className="nc-input" value={nLevel} onChange={(e) => setNLevel(e.target.value)}>
                {['D', 'C', 'B', 'A'].map((l) => <option key={l}>{l}</option>)}
              </select>
              <Tag tone="blue">自动建议 {suggestedLevel} 级</Tag>
            </div>
          </Field>
          {/* 项22：资料分类型上传 */}
          <Field label="资料类型" req>
            <select className="nc-input" value={nDocType} onChange={(e) => setNDocType(e.target.value)}>
              {['营业执照', '资质证书', '开户许可证', '其他'].map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="上传资料" req span={3} note={nUploadedDocs.length ? `已上传：${nUploadedDocs.join('、')}` : '按类型分别上传'}>
            <div className="nc-dropzone" onClick={() => { if (!nUploadedDocs.includes(nDocType)) { setNUploadedDocs((p) => [...p, nDocType]); toast(`已上传${nDocType}`); } else { toast(`${nDocType} 已上传，可继续补充`); } }}>
              <Ico n="paperclip" size={16} /> 点击或拖拽上传：{nDocType}
              {nUploadedDocs.includes(nDocType) && <Tag tone="green">已上传</Tag>}
            </div>
          </Field>
          <Field label="备注" span={4}><textarea className="nc-input" rows={2} placeholder="选填" /></Field>
        </div>
      </Drawer>

      {/* 营业执照识别 → 识别工作台 */}
      <RecognitionWorkbench
        open={recogOpen}
        onClose={() => setRecogOpen(false)}
        title="营业执照识别"
        fields={SUP_RECOG_FIELDS}
        onConfirm={onSupRecog}
      />

      {/* ============ 供应商导入（项15：Excel 模板，mock） ============ */}
      <Modal open={importOpen} width={480} title="批量导入供应商" onClose={() => setImportOpen(false)}
        foot={<><Btn onClick={() => { setImportOpen(false); toast('已下载导入模板（含供货范围 / 联系人 / 资质有效期等列校验规则）'); }}>下载模板</Btn>
          <Btn kind="primary" onClick={() => { setImportOpen(false); toast('导入完成 · 成功 0 条 / 跳过重复 0 条（演示态）'); }}>开始导入</Btn></>}>
        <Banner tone="gold">
          导入前校验统一社会信用代码重复 / 字典字段 / 必需资料，不通过整行跳过并输出错误清单；导入后默认进入「待准入」。
        </Banner>
        <div className="nc-empty-mini" style={{ marginTop: 12 }}><Ico n="file" size={16} /> 拖拽 .xlsx 到此处，或点击「下载模板」按格式填写</div>
      </Modal>

      {/* 供货范围「引用主数据」：从物料主数据勾选该供应商供应的物料 / 服务 */}
      <Modal open={scopePickOpen} onClose={() => setScopePickOpen(false)} width={720} title="引用物料主数据 · 选择供应范围"
        foot={<><Btn onClick={() => setScopePickOpen(false)}>取消</Btn>
          <Btn kind="primary" onClick={() => { setScopePickOpen(false); toast(`已关联 ${scopePicked.length} 项物料 / 服务主数据`); }}>确定（已选 {scopePicked.length} 项）</Btn></>}>
        <Banner tone="info">勾选该供应商可供货的物料 / 服务 / 套件；与上方大类「供货范围」并存，保留手填能力。</Banner>
        {SCOPE_KINDS.map((k) => {
          const list = ITEMS.filter((it) => it.ty === k && it.status === '启用');
          if (!list.length) return null;
          return (
            <div key={k} style={{ marginTop: 12 }}>
              <div className="nc-ledhd">{k}（{list.length}）</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {list.map((it) => {
                  const on = scopePicked.includes(it.code);
                  return (
                    <button type="button" key={it.code}
                      className={`nc-fchip${on ? ' is-on' : ''}`}
                      onClick={() => setScopePicked((ps) => (on ? ps.filter((c) => c !== it.code) : [...ps, it.code]))}>
                      {it.name} <span className="num nc-muted">{it.code}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </Modal>

      {/* ============ 统一导出弹窗 ============ */}
      <ExportDialog {...exportApi.dialogProps} />
    </>
  );
}
