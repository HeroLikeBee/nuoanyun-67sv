// 新增项目（极简立项 · 《研发级功能规格》PRJ-01）
//
// 三个入口，共用一个表单（来源与闸口按入口切换）：
//   入口 A · 合同交底（合同详情 → 创建项目）：
//     自动带入合同要素（客户 / 金额 / 工期 / 收款节点），并生成「合同要点摘要卡」
//     （工期 / 付款节点 / 质保期 / 履约保证金 / 证件要求），项目经理勾选「已阅读确认」= 交底留痕。
//     来源不再自造「合同立项」，而是由来源合同的上游外键继承（投标 → 报价 → 商机，见 projectSourceOfContract）。
//   入口 B · 极简立项（项目列表 → 新建项目）：
//     只填 项目名* / 客户* / 类型* / 来源* / 负责人* / 项目经理，预计额与关联合同可空；保存后状态 = 待启动。
//   入口 C · 无合同立项（投标补建 / 商机转项目）：
//     投标中标补建 → 落 bidId 外键、来源「投标中标」；商机转项目（应急抢修）→ 落 oppId 外键、来源「应急工程」，
//     自动置「无合同施工」标记与 30 日补签期限，进驾驶舱风险榜，补签合同后出榜。
//
// 规则：立项不强制有合同、不强制挂证书（软提示）；计划 / 团队 / 里程碑在项目详情补充。
// ⚠️ 合同额口径（规格 §6.1）：contractAmt = **关联销售合同汇总**，无合同时为 0；
//    预计额另存 expectAmt，避免把「预计」当成「已签」污染回款比例与亏损判定。
// 施工型项目建成后，进入详情页会提示「套用里程碑模板」。
import React, { useEffect, useMemo, useState } from 'react';
import {
  Banner, Btn, Card, Check, Field, Money, PageHead, Tag, Tip, useToast, pressProps,
} from '../components/ui';
import {
  CERTS, CUSTOMERS, DEPT_STAFF, PROJECT_SOURCES, PROJ_TYPES, TODAY, addDays, fmt, fmtAmt,
  isContractClosed, normContractStatus, occCount, projectSourceOfContract,
} from '../components/data';
import type { Project } from '../components/data';
import {
  addProject, consumePendingProject, getBids, getContracts, getPendingProject, getProjects, getQuotes, patchContract,
  reassignCertsToProject,
} from '../components/store';
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

export default function ProjectNewPage({ go, role, nav }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();

  /* ---------- 入口判定（三类，共用一个表单） ---------- */
  const pend = useMemo(() => getPendingProject(), []);
  const srcContract = useMemo(() => {
    /* 读共享 store：修复前读 data.ts 常量，本次会话新建的合同从合同详情点「创建项目」查不到，
       入口 A 会静默退化为入口 B（合同要素全部带不出来）。 */
    return pend?.contractId ? getContracts().find((c) => c.id === pend.contractId) || null : null;
  }, [pend]);
  const srcBid = useMemo(
    () => (pend?.bidId ? getBids().find((b) => b.id === pend.bidId) || null : null),
    [pend],
  );
  const entryA = !!srcContract;              // 入口 A · 合同交底
  const entryBid = !!srcBid;                 // 入口 C · 投标中标补建
  const entryOpp = !!pend?.oppId;            // 入口 C · 商机直签（应急抢修）
  /** 无合同立项（入口 C 两种） */
  const entryNoCt = entryBid || entryOpp;
  /** 合同补签期限：立项日 + 30 日 */
  const backfillBy = useMemo(() => addDays(TODAY, 30), []);
  /** 无合同先施工原因（由商机 / 投标带过来，写入立项留痕） */
  const noCtReason = pend?.noContractReason || '';

  /**
   * 来源报价：合同本身不直接存报价外键，报价由「中标投标单」带回
   * （合同.bidId → 投标单.quoteId → 报价单），与全链路其它下钻路径同源。
   */
  const srcQuote = useMemo(() => {
    if (!srcContract) return undefined;
    const bid = getBids().find((b) => b.id === srcContract.bidId);
    return getQuotes().find((q) => q.id === bid?.quoteId);
  }, [srcContract]);
  /** 报价成本明细合计（Σ 数量 × 成本单价）：与项目成本科目同源，直接作目标成本基线 */
  const quoteCost = Math.round((srcQuote?.lines ?? []).reduce((a, l) => a + l.qty * l.cost, 0));

  /* ---------- 表单（入口 B 只暴露 6 项必填 + 2 项可空） ---------- */
  const [name, setName] = useState(
    srcContract ? `${srcContract.name.replace(/合同$/, '')}` : (srcBid?.name || pend?.name || ''),
  );
  const [customer, setCustomer] = useState(srcContract?.party || srcBid?.customer || pend?.customer || '');
  const [ptype, setPtype] = useState(srcContract ? typeOfContract(srcContract.type) : '新建');
  const [source, setSource] = useState<string>(entryOpp ? '应急工程' : entryBid ? '投标中标' : '商机直签');
  const [owner, setOwner] = useState('蓝峰');
  const [pm, setPm] = useState('');
  const [amt, setAmt] = useState(srcContract ? srcContract.amt : (srcBid?.amt || pend?.amt || 0));
  const [budget, setBudget] = useState(0);
  const [budgetSrc, setBudgetSrc] = useState<'manual' | 'quote'>('manual');
  const [contractId, setContractId] = useState(srcContract?.id || '');
  /* 来源（规格 §6.1 四值）：入口 A 由来源合同的上游外键继承，其余入口按带入值固定，均不手选。
     自造值「合同立项」已从 PROJECT_SOURCES 删除 —— 它是操作路径，不是业务来源。 */
  const derivedSource = entryA ? projectSourceOfContract(srcContract) : source;
  const srcFromUpstream = !!(srcContract?.bidId || srcContract?.quoteId || srcContract?.oppId);

  /* 「从关联报价带入」要真的带进来：选定来源后自动把报价成本合计写入目标成本并锁定输入，
     避免「来源选了一项、数字还是手填」的假联动。无来源报价时给出提示，允许回退手工编制。 */
  useEffect(() => {
    if (budgetSrc === 'quote' && quoteCost > 0) setBudget(quoteCost);
  }, [budgetSrc, quoteCost]);
  const budgetLocked = budgetSrc === 'quote' && quoteCost > 0;

  /* ---------- 合同交底（入口 A） ---------- */
  const [read, setRead] = useState(false);
  const [tried, setTried] = useState(false);

  const usedNos = useMemo(() => getProjects().map((p) => p.id), [nav]);
  const projectNo = useMemo(() => nextProjectNo(usedNos), [usedNos]);

  /* 可关联合同：同客户、未挂到其它项目、且处于可立项状态（已签约 / 履约中）。
     修复前只过滤「未挂项目」，草稿 / 待审批 / 已终止的合同同样能被选中立项 —— 立项闸口形同虚设。 */
  const ctOptions = useMemo(
    () => getContracts().filter((c) => !c.project && !isContractClosed(c)
      && ['已签约', '履约中'].includes(normContractStatus(c.status))
      && (!customer || c.party === customer)),
    [customer, nav],
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

  /**
   * 项目经理资格（M9）：与投标「建造师三要素」同口径。
   *   工程施工类（新建 / 改造 / 检测）：建造师证有效 + B 证有效 + 无在建，三要素齐备；
   *   维护保养类：注册消防工程师证有效且未被占用。
   * 「无在建」按 occCount() 判定（证书占用记录已排除终态项目），不用 c.used.length。
   */
  const pmCheck = useMemo(() => {
    if (!pm) return null;
    if (ptype === '维护保养') {
      const cert = CERTS.find((c) => c.subType === '注册消防工程师' && c.holder === pm);
      if (!cert) return { pass: false, label: '注册消防工程师证', note: `${pm} 名下无注册消防工程师证` };
      const used = occCount(cert.id);
      const ok = cert.validTo >= TODAY && used === 0;
      return {
        pass: ok, label: '注册消防工程师证',
        note: ok ? `${cert.id} 有效期至 ${cert.validTo}，且未被占用`
          : `${cert.id} ${cert.validTo < TODAY ? `已于 ${cert.validTo} 过期` : `正被 ${used} 个项目占用`}`,
      };
    }
    const b = CERTS.find((c) => (c as { isBuilder?: boolean }).isBuilder && c.holder === pm);
    if (!b) return { pass: false, label: '建造师三要素', note: `${pm} 名下无注册建造师证，工程施工类不可担任项目经理` };
    const okValid = b.validTo >= TODAY;
    const okB = !!(b as { hasB?: boolean }).hasB && ((b as { bValidTo?: string }).bValidTo || '') >= TODAY;
    const okFree = occCount(b.id) === 0;
    const miss = [!okValid && `建造师证${b.validTo < TODAY ? '已过期' : '无效'}`, !okB && 'B 证无效 / 已过期', !okFree && '存在在建项目'].filter(Boolean);
    return {
      pass: !miss.length, label: '建造师三要素',
      note: miss.length ? `${b.id}：${miss.join(' / ')}，三要素未齐备` : `${b.id} 建造师证 + B 证有效，且无在建项目`,
    };
  }, [pm, ptype]);

  /* ---------- 保存 → 待启动 ---------- */
  const save = () => {
    setTried(true);
    if (!name.trim() || !customer || !pm || (entryA && !read)) {
      toast(entryA ? '请补全必填项并确认已阅读合同要点' : '请补全必填项（项目名 / 客户 / 项目经理）', 'err');
      return;
    }
    /* M9 资格闸口：项目经理不满足证件要求时硬拦截（与投标侧 builderCheck 同口径） */
    if (pmCheck && !pmCheck.pass) {
      toast(`项目经理资格未通过：${pmCheck.note}`, 'err');
      return;
    }
    /* 立项闸口（入口 A 与手选合同共同适用）：
       ① 合同必须存在；② 状态必须是「已签约 / 履约中」—— 草稿、待审批、已终止的合同不可立项；
       ③ 同一合同不可重复立项（已被其它项目占用时硬拦截）。 */
    if (contractId) {
      const ct = getContracts().find((c) => c.id === contractId);
      if (!ct) { toast(`合同 ${contractId} 不存在，请重新选择`, 'err'); return; }
      const cs = normContractStatus(ct.status);
      if (isContractClosed(ct) || !['已签约', '履约中'].includes(cs)) {
        toast(`合同 ${ct.id} 当前状态为「${cs}」，仅「已签约 / 履约中」的合同可立项`, 'err');
        return;
      }
      if (ct.project && ct.project !== projectNo) {
        toast(`合同 ${ct.id} 已挂接项目 ${ct.project}，同一合同不可重复立项`, 'err');
        return;
      }
    }
    /* 无合同立项：合同额记 0，预计额另存 —— 规格 §6.1 定义 contractAmt = 关联销售合同汇总，
       写成预计额会让项目中心的合同额虚高、回款比例分母失真，并让「合同额 < 成本」的亏损判定误报。 */
    const noCt = !contractId;
    const p: Project = {
      id: projectNo,
      name: name.trim(),
      type: ptype,
      biz: ptype === '维护保养' ? 'WB' : ptype === '检测' ? 'JC' : 'GC',
      source: derivedSource,
      customer,
      customerId: CUSTOMERS.find((c) => c.name === customer)?.id || '',
      owner,
      pm,
      contractAmt: noCt ? 0 : amt,
      execAmt: noCt ? 0 : amt,
      expectAmt: noCt ? amt : undefined,
      budget: budget || undefined,
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
      ...(srcBid ? { bidId: srcBid.id } : {}),
      ...(pend?.oppId ? { oppId: pend.oppId } : {}),
      /* 无合同施工标记与补签期限：置位后才会进驾驶舱「无合同施工」风险榜，
         补签合同（关联合同）后由项目详情解除。 */
      ...(noCt ? { noContract: true, backfillBy } : {}),
      updatedAt: TODAY,
      logs: entryA
        ? [{ at: TODAY, from: '—', to: '待启动', by: owner, reason: `合同交底已确认（来源合同 ${contractId}）` }]
        : srcBid
          ? [{ at: TODAY, from: '—', to: '待启动', by: owner, reason: `中标补建项目（来源投标 ${srcBid.id}）` }]
          : noCt
            ? [{ at: TODAY, from: '—', to: '待启动', by: owner, reason: `无合同先施工立项（来源商机 ${pend?.oppId}）· 原因：${noCtReason || '未填写'} · 须于 ${backfillBy} 前补签合同` }]
            : [{ at: TODAY, from: '—', to: '待启动', by: owner, reason: '极简立项创建' }],
    };
    addProject(p);
    /* 合同回写：立项后把项目编号写回合同的 project 字段，合同详情「关联项目」与项目详情的
       溯源链据此反查上游。修复前不回写，同一合同可被无限次立项且合同侧看不到已立项。 */
    if (contractId) patchContract(contractId, { project: projectNo });
    /* 中标转项目：把该投标的证书占用记录改归属到项目（规格 §4.4 BID-04「改归属留痕，不重建」），
       证书继续占用不释放 —— 未中标 / 放弃时才由投标侧释放。 */
    if (srcBid) {
      const moved = reassignCertsToProject(srcBid.id, projectNo, p.name);
      if (moved) toast(`证书占用已由投标 ${srcBid.id} 改归属到项目 ${projectNo}（${moved} 条，留痕不重建）`);
    }
    consumePendingProject();
    toast(noCt
      ? `项目「${p.name}」已创建 · 编号 ${projectNo} · 状态「待启动」· 无合同先施工，须于 ${backfillBy} 前补签合同`
      : `项目「${p.name}」已创建 · 编号 ${projectNo} · 状态「待启动」 · 已回写合同 ${contractId}`);
    go('project-center');
  };

  const cancel = () => { consumePendingProject(); go(entryA ? 'contract' : 'project'); };

  return (
    <>
      <PageHead
        crumbs={['项目管理', entryA ? '合同交底' : entryNoCt ? '无合同立项' : '新建项目']}
        title={entryA ? '创建项目 · 合同交底' : entryNoCt ? '创建项目 · 无合同先施工' : '新建项目'}
        sub={entryA
          ? `来源合同 ${srcContract?.id} · 合同要素已自动带入，确认交底后即可创建`
          : entryBid
            ? `来源投标 ${srcBid?.id} · 中标标的已带入，未关联合同`
            : entryOpp
              ? `来源商机 ${pend?.oppId} · 应急抢修场景，合同后补`
              : '极简立项：只填 6 项必填，不排计划；团队、里程碑、预算创建后在项目详情补充'}
        actions={<>
          <Btn onClick={cancel}>取消</Btn>
          <Btn kind="primary" onClick={save}>{entryA ? '确认交底并创建项目' : entryNoCt ? '创建待启动项目' : '保存为待启动'}</Btn>
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

      {/* ============ 入口 C：无合同先施工（软提示 + 补签期限 + 原因留痕） ============ */}
      {entryNoCt && (
        <Card hd={<span><Ico n="warning" size={16} /> 无合同先施工 · 补签提示 <Tag tone="orange">入口 C</Tag></span>}
          extra={<span className="nc-cell-sub">补签期限 <b className="num">{backfillBy}</b></span>}>
          <Banner tone="warn">
            本单不关联销售合同：项目以「无合同先施工」建立，<b>合同额记 0</b>，预计合同额单独留存作对照。
            须在 <b>{backfillBy}</b> 前补签合同并在项目详情「关联合同」挂接；期间项目会出现在驾驶舱「无合同施工」风险榜，补签后自动出榜。
          </Banner>
          {noCtReason && (
            <div className="nc-kv" style={{ marginTop: 12 }}>
              <span className="nc-k">无合同先施工原因</span>
              <span className="nc-v">{noCtReason}</span>
            </div>
          )}
        </Card>
      )}

      {/* ============ 立项表单 ============ */}
      <Card hd={entryA ? '项目信息（合同已带入，可微调）' : '项目信息'}>
        {!entryA && !entryNoCt && (
          <Banner tone="info">
            立项只填最少信息即可建成「待启动」项目；<b>计划、团队、里程碑可创建后补充</b>。
            立项不强制有合同、不强制挂证书（缺合同的项目会进风险榜提示补签）。
          </Banner>
        )}
        <div className="nc-form-grid" style={{ marginTop: 12 }}>
          <Field label="项目编号" note="系统生成">
            <input className="nc-input" readOnly value={projectNo} />
          </Field>
          <Field label="来源" req
            note={entryA
              ? (srcFromUpstream ? '由来源合同的上游自动继承（投标 / 报价 / 商机）' : '来源合同无上游单据，可手选')
              : '由带入单据决定，创建后不可修改'}>
            {entryA && !srcFromUpstream
              ? (
                <select className="nc-input" value={source} onChange={(e) => setSource(e.target.value)}>
                  {PROJECT_SOURCES.map((s) => <option key={s}>{s}</option>)}
                </select>
              )
              : <input className="nc-input" readOnly value={derivedSource} />}
          </Field>
          <Field label="项目名" req span={2} err={nameErr || undefined}>
            <input className="nc-input" value={name} placeholder="如 昆明万达广场消防改造工程"
              onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="客户" req err={custErr || undefined}>
            {(entryA || entryBid || entryOpp)
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
            {pmCheck && (
              <div className={pmCheck.pass ? 'nc-field-note' : 'nc-field-err'}>
                {pmCheck.pass ? <Ico n="check" size={14} /> : <Ico n="ban" size={14} />} {pmCheck.label}：{pmCheck.note}
              </div>
            )}
          </Field>
          <Field label="预计合同额（元）" note="可空 · 立项后在经营中心只读">
            <input className="nc-input" type="number" value={amt || ''} placeholder="暂不确定可留空"
              onChange={(e) => setAmt(Number(e.target.value) || 0)} />
          </Field>
          <Field label="目标成本（立项预算，元）"
            note={budgetLocked ? `取自 ${srcQuote?.id} 的成本明细合计` : '仅作「目标 vs 实际」对比基线，不强制勾稽合同额'}>
            <input className="nc-input" type="number" value={budget || ''} readOnly={budgetLocked}
              placeholder="如 1300000" onChange={(e) => setBudget(Number(e.target.value) || 0)} />
          </Field>
          <Field label="目标成本来源"
            note={srcQuote ? `来源报价 ${srcQuote.id} · 成本合计 ${fmt(quoteCost)}` : '当前合同未关联报价，只能手工编制'}>
            <select className="nc-input" value={budgetSrc} onChange={(e) => setBudgetSrc(e.target.value as 'manual' | 'quote')}>
              <option value="manual">手工编制</option>
              <option value="quote">从关联报价带入</option>
            </select>
          </Field>
          <Field label="关联合同" span={2}
            note={entryA ? '入口 A 已预关联，不可更改' : '可空 · 仅列同客户且未挂其它项目的合同；不关联则按「无合同先施工」处理并进风险榜'}>
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
          <Tip w={330} text="项目编号由系统生成（前缀 XM + 6 位流水）；来源由系统自动带入，创建后不可修改；状态、金额、成本等运行数据只在项目详情只读展示。" />
        </div>
      </Card>

      <div className="nc-wizard-foot">
        <Btn onClick={cancel}>取消</Btn>
        <Btn kind="primary" onClick={save}>{entryA ? '确认交底并创建项目' : entryNoCt ? '创建待启动项目' : '保存为待启动'}</Btn>
        <span className="nc-cell-sub" style={{ marginLeft: 10 }}>
          {entryNoCt
            ? `保存后项目状态为「待启动」· 合同额记 0 · 须于 ${backfillBy} 前补签合同`
            : '保存后项目状态为「待启动」，可在项目详情推进为「执行中」。'}
        </span>
      </div>
    </>
  );
}
