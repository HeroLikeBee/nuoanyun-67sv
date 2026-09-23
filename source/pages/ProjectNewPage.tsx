// 新增项目（极简立项 · 《研发级功能规格》PRJ-01）
//
// 入口 A（合同详情 → 创建项目）：
//   自动带入合同要素（客户 / 金额 / 工期 / 收款节点），来源固定为「合同立项」；
//   自动生成「合同要点摘要卡」（工期 / 付款节点 / 质保期 / 履约保证金 / 证件要求），
//   项目经理勾选「已阅读确认」= 合同交底留痕。
// 入口 B（项目列表 → 新建项目）：
//   只填 项目名* / 客户* / 类型* / 来源* / 负责人* / 项目经理，预计额与关联合同可空；
//   不排计划，保存后状态 = 待启动。
//
// 规则：立项不强制有合同、不强制挂证书（软提示）；计划 / 团队 / 里程碑在项目经营中心补充。
// 施工型项目建成后，进入详情页会提示「套用里程碑模板」。
import React, { useMemo, useState } from 'react';
import {
  Banner, Btn, Card, Check, Field, Money, PageHead, Tag, Tip, useToast, pressProps,
} from '../components/ui';
import {
  CONTRACTS, CUSTOMERS, DEPT_STAFF, PROJECT_SOURCES, PROJ_TYPES, TODAY, fmt, fmtAmt,
} from '../components/data';
import type { Project } from '../components/data';
import { addProject, consumePendingProject, getPendingProject, getProjects } from '../components/store';
import { Ico } from '../components/icons';

/** 项目编号：XM + 6 位流水（《研发级功能规格》§0.2） */
function nextProjectNo(used: string[]) {
  const max = used
    .filter((id) => /^XM\d{6}$/.test(id))
    .map((id) => Number(id.slice(2)))
    .reduce((a, b) => Math.max(a, b), 0);
  return `XM${String(max + 1).padStart(6, '0')}`;
}

/** 合同类型 → 项目类型映射（规格 §6.1 项目类型） */
const typeOfContract = (ct: string) =>
  ct.includes('维护保养') ? '维护保养' : ct.includes('检测') ? '检测' : '改造';

/** 证件要求：按项目类型给出必需证件（软提示，不强制挂证） */
const certReqOf = (type: string) => (type === '维护保养'
  ? ['消防设施维护保养检测资质', '注册消防工程师（有效且未被占用）']
  : ['消防设施工程专业承包资质', '注册建造师（机电）+ B 证（有效且无在建）', '安全生产许可证']);

export default function ProjectNewPage({ go, role }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();

  /* ---------- 入口判定：有来源合同 → 入口 A；否则入口 B ---------- */
  const srcContract = useMemo(() => {
    const pend = getPendingProject();
    if (!pend) return null;
    return CONTRACTS.find((c) => c.id === pend.contractId) || null;
  }, []);
  const entryA = !!srcContract;

  /* ---------- 表单（入口 B 只暴露 6 项必填 + 2 项可空） ---------- */
  const [name, setName] = useState(srcContract ? `${srcContract.name.replace(/合同$/, '')}` : '');
  const [customer, setCustomer] = useState(srcContract?.party || '');
  const [ptype, setPtype] = useState(srcContract ? typeOfContract(srcContract.type) : '新建');
  const [source, setSource] = useState<string>(entryA ? '合同立项' : '商机直签');
  const [owner, setOwner] = useState('蓝峰');
  const [pm, setPm] = useState('');
  const [amt, setAmt] = useState(srcContract ? srcContract.amt : 0);
  const [contractId, setContractId] = useState(srcContract?.id || '');

  /* ---------- 合同交底（入口 A） ---------- */
  const [read, setRead] = useState(false);
  const [tried, setTried] = useState(false);

  const usedNos = useMemo(() => getProjects().map((p) => p.id), []);
  const projectNo = useMemo(() => nextProjectNo(usedNos), [usedNos]);

  /* 可关联合同：同客户、且未挂到其它项目（入口 B 可空） */
  const ctOptions = useMemo(
    () => CONTRACTS.filter((c) => !c.project && (!customer || c.party === customer)),
    [customer],
  );

  /* ---------- 交底卡派生（全部来自合同，不手填） ---------- */
  const 工期 = srcContract ? `${srcContract.start} ~ ${srcContract.end}` : '';
  const 付款节点 = srcContract?.nodes || '';
  const 质保期 = '12 个月（自消防验收通过日起算）';
  const 履约保证金 = srcContract ? Math.round(srcContract.amt * 0.03) : 0;
  const 证件要求 = certReqOf(ptype);

  const nameErr = tried && !name.trim() ? '请填写项目名' : '';
  const custErr = tried && !customer ? '请选择客户' : '';
  const pmErr = tried && !pm ? '请选择项目经理' : '';
  const readErr = tried && entryA && !read ? '请确认已阅读合同要点' : '';

  /* ---------- 保存 → 待启动 ---------- */
  const save = () => {
    setTried(true);
    if (!name.trim() || !customer || !pm || (entryA && !read)) {
      toast(entryA ? '请补全必填项并确认已阅读合同要点' : '请补全必填项（项目名 / 客户 / 项目经理）', 'err');
      return;
    }
    const p: Project = {
      id: projectNo,
      name: name.trim(),
      type: ptype,
      biz: ptype === '维护保养' ? 'WB' : ptype === '检测' ? 'JC' : 'GC',
      source: entryA ? '合同立项' : source,
      customer,
      customerId: CUSTOMERS.find((c) => c.name === customer)?.id || '',
      owner,
      pm,
      contractAmt: amt,
      execAmt: amt,
      cost: 0,
      milestone: 0,
      milestoneName: '进场准备',
      recvPct: 0,
      risk: 'none',
      status: '待启动',
      start: srcContract?.start || TODAY,
      end: srcContract?.end || '',
      profit: 0,
      contractId: contractId || undefined,
      updatedAt: TODAY,
      logs: entryA
        ? [{ at: TODAY, from: '—', to: '待启动', by: owner, reason: `合同交底已确认（来源合同 ${contractId}）` }]
        : [{ at: TODAY, from: '—', to: '待启动', by: owner, reason: '极简立项创建' }],
    };
    addProject(p);
    consumePendingProject();
    toast(`项目「${p.name}」已创建 · 编号 ${projectNo} · 状态「待启动」`);
    go('project-center');
  };

  const cancel = () => { consumePendingProject(); go(entryA ? 'contract' : 'project'); };

  return (
    <>
      <PageHead
        crumbs={['项目管理', entryA ? '合同立项' : '新建项目']}
        title={entryA ? '创建项目 · 合同立项' : '新建项目'}
        sub={entryA
          ? `来源合同 ${srcContract?.id} · 合同要素已自动带入，确认交底后即可创建`
          : '极简立项：只填 6 项必填，不排计划；团队、里程碑、预算创建后在项目经营中心补充'}
        actions={<>
          <Btn onClick={cancel}>取消</Btn>
          <Btn kind="primary" onClick={save}>{entryA ? '确认交底并创建项目' : '保存为待启动'}</Btn>
        </>}
      />

      {/* ============ 入口 A：合同要点摘要卡（交底留痕） ============ */}
      {entryA && (
        <Card hd={<span><Ico n="clipboard" size={16} /> 合同要点摘要 · 交底卡 <Tag tone="blue">入口 A</Tag></span>}
          extra={<span className="nc-cell-sub">来源 <Tag tone="gray">{srcContract?.id}</Tag></span>}>
          <Banner tone="info">
            以下要点由来源合同自动生成。项目经理逐项确认阅读后勾选「已阅读确认」，系统记录<b>交底留痕</b>（人 / 时间 / 合同号），
            后续发生争议可追溯。
          </Banner>
          <div className="nc-kv-grid nc-kv-grid-3" style={{ marginTop: 12 }}>
            <div className="nc-kv"><span className="nc-k">工期</span><span className="nc-v num">{工期}</span></div>
            <div className="nc-kv"><span className="nc-k">付款节点</span><span className="nc-v">{付款节点}</span></div>
            <div className="nc-kv"><span className="nc-k">质保期</span><span className="nc-v">{质保期}</span></div>
            <div className="nc-kv"><span className="nc-k">履约保证金</span><span className="nc-v num"><Money v={履约保证金} role={role} />（合同额 3%）</span></div>
            <div className="nc-kv"><span className="nc-k">合同金额</span><span className="nc-v num"><Money v={srcContract?.amt || 0} role={role} /></span></div>
            <div className="nc-kv"><span className="nc-k">合同状态</span><span className="nc-v">{srcContract?.status}</span></div>
          </div>
          <div className="nc-kv" style={{ alignItems: 'flex-start' }}>
            <span className="nc-k">证件要求</span>
            <span className="nc-v">
              {证件要求.map((c) => <Tag key={c} tone="gold">{c}</Tag>)}
              <div className="nc-cell-sub" style={{ marginTop: 4 }}>立项阶段不强制挂证，进场前须在「团队与证书」完成挂接并通过校验。</div>
            </span>
          </div>
          <div style={{ marginTop: 12 }}>
            <Check checked={read} onChange={(v: boolean) => setRead(v)} label="我已阅读并确认上述合同要点（生成交底留痕）" />
            {readErr && <div className="nc-field-err">{readErr}</div>}
          </div>
        </Card>
      )}

      {/* ============ 立项表单 ============ */}
      <Card hd={entryA ? '项目信息（合同已带入，可微调）' : '项目信息'}>
        {!entryA && (
          <Banner tone="info">
            立项只填最少信息即可建成「待启动」项目；<b>计划、团队、里程碑可创建后补充</b>。
            立项不强制有合同、不强制挂证书（缺合同的项目会进风险榜提示补签）。
          </Banner>
        )}
        <div className="nc-form-grid" style={{ marginTop: 12 }}>
          <Field label="项目编号" note="系统生成">
            <input className="nc-input" readOnly value={projectNo} />
          </Field>
          <Field label="来源" req note={entryA ? '入口 A 固定为合同立项' : undefined}>
            {entryA
              ? <input className="nc-input" readOnly value="合同立项" />
              : (
                <select className="nc-input" value={source} onChange={(e) => setSource(e.target.value)}>
                  {PROJECT_SOURCES.map((s) => <option key={s}>{s}</option>)}
                </select>
              )}
          </Field>
          <Field label="项目名" req span={2} err={nameErr || undefined}>
            <input className="nc-input" value={name} placeholder="如 昆明万达广场消防改造工程"
              onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="客户" req err={custErr || undefined}>
            {entryA
              ? <input className="nc-input" readOnly value={customer} />
              : (
                <select className="nc-input" value={customer} onChange={(e) => { setCustomer(e.target.value); setContractId(''); }}>
                  <option value="">请选择客户</option>
                  {CUSTOMERS.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              )}
          </Field>
          <Field label="项目类型" req>
            <select className="nc-input" value={ptype} onChange={(e) => setPtype(e.target.value)}>
              {PROJ_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="负责人" req>
            <select className="nc-input" value={owner} onChange={(e) => setOwner(e.target.value)}>
              {DEPT_STAFF.sales.map((s) => <option key={s.name} value={s.name}>{s.name}（{s.role}）</option>)}
            </select>
          </Field>
          <Field label="项目经理" req err={pmErr || undefined}>
            <select className="nc-input" value={pm} onChange={(e) => setPm(e.target.value)}>
              <option value="">请选择项目经理</option>
              {DEPT_STAFF.pm.map((s) => <option key={s.name} value={s.name}>{s.name}（{s.role}）</option>)}
            </select>
          </Field>
          <Field label="预计额（元）" note="可空">
            <input className="nc-input" type="number" value={amt || ''} placeholder="暂不确定可留空"
              onChange={(e) => setAmt(Number(e.target.value) || 0)} />
          </Field>
          <Field label="关联合同" span={2} note={entryA ? '入口 A 已预关联，不可更改' : '可空 · 仅列同客户且未挂其它项目的合同'}>
            {entryA
              ? <input className="nc-input" readOnly value={`${contractId} · ${srcContract?.name || ''}`} />
              : (
                <select className="nc-input" value={contractId} onChange={(e) => setContractId(e.target.value)}>
                  <option value="">暂不关联（后续在「关联合同」Tab 补充）</option>
                  {ctOptions.map((c) => <option key={c.id} value={c.id}>{c.id} · {c.name} · {fmt(c.amt)}</option>)}
                </select>
              )}
          </Field>
        </div>

        {/* 软提示：不强制，但缺了会给预警 */}
        <div className="nc-cell-sub" style={{ marginTop: 12 }}>
          <Ico n="help" size={14} /> 立项软提示：未关联销售合同的项目进入执行中后会计入风险榜「无合同施工」；
          施工型项目建议建成后立即套用里程碑模板。
          <Tip w={330} text="项目编号由系统生成（前缀 XM + 6 位流水）；来源由系统自动带入，创建后不可修改；状态、金额、成本等运行数据只在项目经营中心只读展示。" />
        </div>
      </Card>

      <div className="nc-wizard-foot">
        <Btn onClick={cancel}>取消</Btn>
        <Btn kind="primary" onClick={save}>{entryA ? '确认交底并创建项目' : '保存为待启动'}</Btn>
        <span className="nc-cell-sub" style={{ marginLeft: 10 }}>
          保存后项目状态为「待启动」，可在项目经营中心推进为「执行中」。
        </span>
      </div>
    </>
  );
}
