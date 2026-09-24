/**
 * 穿透预览（只读）—— 全站 EntityLink 查看型穿透统一改为「当前页打开」：
 *   全部实体统一用居中弹窗承载，不再整页跳转打断操作；
 *   只读展示核心完整信息，操作型跳转（编辑 / 新建 / 转合同等）仍走整页。
 */
import React from 'react';
import { CUSTOMERS, OPPS, SUPPLIERS, catPath, catScopeName } from './data';
import { getBids, getContracts, getOpps, getProjects, getQuotes } from './store';
import { Banner, Btn, Card, Code, KvGrid, Modal, Money, Tag } from './ui';
import { closePreview, usePreview } from './entityPreviewState';

/* ---------------- 只读详情子组件 ---------------- */

/** 供应商（内容少 → 抽屉） */
function SupplierDetail({ id, role }: { id: string; role: string }) {
  const s = SUPPLIERS.find((x) => x.id === id);
  if (!s) return <div className="nc-empty-mini">未找到供应商 {id}</div>;
  const score = (s.q + s.d + s.p + s.s) / 4;
  return (
    <>
      <Banner tone="info">只读穿透预览 · 准入状态 {s.status}，完整操作请进入供应商管理页</Banner>
      <Card hd="准入信息">
        <KvGrid rows={[
          { k: '供应商', v: <b>{s.name}</b> },
          { k: '合作类别', v: s.cats.join(' / ') },
          { k: '准入状态', v: <Tag tone={s.status === '已准入' ? 'green' : s.status === '已冻结' ? 'red' : 'orange'}>{s.status}</Tag> },
          { k: '等级', v: <Tag tone={s.level === 'A' ? 'blue' : s.level === 'D' ? 'red' : 'gray'}>{s.level}</Tag> },
          { k: '合作年限', v: `${s.coop} 年` },
          { k: '累计合作金额', v: <Money v={s.amt} role={role} wan /> },
          { k: '准入有效期至', v: s.validTo || '—' },
          { k: '联系人', v: `${s.contact} ${s.phone}` },
          { k: '价格协议', v: <span className="nc-cell-sub">{s.priceAgr}</span> },
          { k: '黑名单', v: s.blacklist ? <Tag tone="red">已冻结 / 黑名单</Tag> : <Tag tone="gray">否</Tag> },
        ]} cols={2} />
      </Card>
      <Card hd="绩效评分">
        <KvGrid rows={[
          { k: '综合评分', v: <b className="num">{score.toFixed(1)}</b> },
          { k: '质量 Q', v: <span className="num">{s.q}</span> },
          { k: '交付 D', v: <span className="num">{s.d}</span> },
          { k: '价格 P', v: <span className="num">{s.p}</span> },
          { k: '服务 S', v: <span className="num">{s.s}</span> },
          { k: '按时交付率', v: <span className="num">{s.onTime}%</span> },
          { k: '验收合格率', v: <span className="num">{s.qualRate}%</span> },
        ]} cols={2} />
      </Card>
    </>
  );
}

/** 商机（内容少 → 抽屉） */
function OppDetail({ id, role }: { id: string; role: string }) {
  const o = getOpps().find((x) => x.id === id) ?? OPPS.find((x) => x.id === id);
  if (!o) return <div className="nc-empty-mini">未找到商机 {id}</div>;
  const oppQuotes = getQuotes().filter((q) => q.opp === id);
  const oppBids = getBids().filter((b) => b.opp === id);
  return (
    <>
      <Banner tone="info">只读穿透预览 · 完整跟进 / 推进操作请进入商机管理页</Banner>
      <Card hd="商机信息">
        <KvGrid rows={[
          { k: '商机名称', v: <b>{o.name}</b> },
          { k: '所属客户', v: o.customer },
          { k: '当前阶段', v: <Tag tone="blue">{o.stage}</Tag> },
          { k: '状态', v: <Tag tone={o.status === '跟进中' ? 'orange' : o.status === '赢单' ? 'green' : 'red'}>{o.status}</Tag> },
          { k: '预计金额', v: <Money v={o.amt} role={role} wan /> },
          { k: '预计签约', v: o.signDate || '—' },
          { k: '负责人', v: o.owner },
          { k: '类型 / 业务线', v: `${o.type} · ${o.biz}` },
          { k: '行业', v: o.industry },
          { k: '最近跟进', v: `${o.last}（${o.lastDays} 天前）` },
          ...(o.status === '输单' ? [{ k: '输单原因', v: `${o.loseReason ?? '—'}${o.loseCompetitor ? ` · 输给 ${o.loseCompetitor}` : ''}` }] : []),
        ]} cols={2} />
      </Card>
      <Card hd="关联业务">
        <div className="nc-cell-sub" style={{ marginBottom: 8 }}>
          关联报价 {oppQuotes.length} 单 · 关联投标 {oppBids.length} 单
        </div>
        {oppQuotes.length > 0 && oppQuotes.map((q) => (
          <div key={q.id} className="nc-refrow"><div className="nc-refname"><Code>{q.id}</Code> {q.name}<div className="nc-cell-sub">{q.ver} · {q.status}</div></div><span className="nc-refval num"><Money v={q.total} role={role} wan /></span></div>
        ))}
        {oppQuotes.length === 0 && oppBids.length === 0 && <div className="nc-cell-sub">暂无关联报价 / 投标</div>}
      </Card>
    </>
  );
}

/** 报价（内容少 → 抽屉） */
function QuoteDetail({ id, role }: { id: string; role: string }) {
  const q = getQuotes().find((x) => x.id === id);
  if (!q) return <div className="nc-empty-mini">未找到报价单 {id}</div>;
  const tax = q.taxMode === '含税' ? Math.round(q.total * q.taxRate / (100 + q.taxRate)) : Math.round(q.total * q.taxRate / 100);
  const lines = q.lines ?? [];
  return (
    <>
      <Banner tone="info">只读穿透预览 · 编辑 / 升版 / 提交审批请进入报价编辑页</Banner>
      <Card hd="报价信息">
        <KvGrid rows={[
          { k: '报价单', v: <b>{q.id}</b> },
          { k: '报价名称', v: <span style={{ maxWidth: 380 }}>{q.name}</span> },
          { k: '客户', v: q.customer },
          { k: '关联商机', v: q.opp || '—' },
          { k: '报价总额（含税）', v: <b className="num"><Money v={q.total} role={role} /></b> },
          { k: '税额', v: <span className="num"><Money v={tax} role={role} />（{q.taxRate}%）</span> },
          { k: '当前版本', v: <Tag tone="blue">{q.ver}</Tag> },
          { k: '状态', v: <Tag tone={q.status === '草稿' ? 'gray' : q.status === '待审批' ? 'orange' : q.status === '已审批' ? 'green' : q.status === '已转化' ? 'blue' : 'red'}>{q.status}</Tag> },
          { k: '负责人', v: `${q.owner} · ${q.update}` },
          { k: '整体浮率', v: <span className="num">{q.markup}%</span> },
          { k: '审批级别', v: q.approveLevel },
        ]} cols={2} />
      </Card>
      <Card hd={`明细 ${lines.length} 行`}>
        {lines.length > 0 ? (
          <table className="nc-tbl" style={{ minWidth: 560 }}>
            <thead><tr><th>内容</th><th className="is-num">数量</th><th className="is-num">单价</th><th className="is-num">小计</th></tr></thead>
            <tbody>
              {lines.slice(0, 10).map((l, i) => (
                <tr key={`${i}-${l.name}`}>
                  <td>{l.name}<div className="nc-cell-sub">{l.catId ? catPath(l.catId) : catScopeName(l.catId)} · {l.spec}</div></td>
                  <td className="is-num">{l.qty.toLocaleString('en-US')} {l.unit}</td>
                  <td className="is-num"><Money v={l.price} role={role} /></td>
                  <td className="is-num"><Money v={Math.round(l.qty * l.price)} role={role} /></td>
                </tr>
              ))}
              {lines.length > 10 && <tr><td colSpan={4} className="nc-cell-sub">…共 {lines.length} 行，完整明细见详情页</td></tr>}
            </tbody>
          </table>
        ) : <div className="nc-cell-sub">该单未落库明细</div>}
      </Card>
      {q.versions && q.versions.length > 0 && (
        <Card hd="版本历史">
          {q.versions.map((v) => (
            <div key={v.ver} className="nc-refrow">
              <div className="nc-refname"><Tag tone={v.ver === q.ver ? 'blue' : 'gray'}>{v.ver}{v.ver === q.ver ? ' · 当前' : ''}</Tag><div className="nc-cell-sub">{v.at} · {v.by} · {v.note}</div></div>
              <span className="nc-refval num"><Money v={v.amt} role={role} /></span>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}

/** 客户（内容多 → 弹窗） */
function CustomerDetail({ id, role }: { id: string; role: string }) {
  const c = CUSTOMERS.find((x) => x.id === id);
  if (!c) return <div className="nc-empty-mini">未找到客户 {id}</div>;
  const opps = OPPS.filter((o) => o.customerId === id);
  const quotes = getQuotes().filter((q) => q.customerId === id);
  const contracts = getContracts().filter((ct) => ct.party === c.name);
  return (
    <>
      <Banner tone="info">只读穿透预览 · 完整跟进与业务台账请进入客户管理页</Banner>
      <Card hd="客户档案">
        <KvGrid rows={[
          { k: '客户名称', v: <b>{c.name}</b> },
          { k: '客户等级', v: <Tag tone={c.grade === 'A' ? 'red' : c.grade === 'B' ? 'blue' : 'gray'}>{c.grade}</Tag> },
          { k: '状态', v: <Tag tone={c.status === '成交' ? 'green' : 'orange'}>{c.status}</Tag> },
          { k: '行业', v: c.industry },
          { k: '区域', v: c.region },
          { k: '来源', v: c.source },
          { k: '负责人', v: c.owner },
          { k: '联系人', v: `${c.contact} ${c.phone}` },
          { k: '最近跟进', v: `${c.lastFollow}（${c.lastFollowDays} 天前）` },
          { k: '累计成交', v: <Money v={c.dealAmt} role={role} wan /> },
          { k: '累计回款', v: <Money v={c.recv} role={role} wan /> },
          { k: '合作起始', v: c.since },
        ]} cols={2} />
        {c.note && <div className="nc-warnbox" style={{ marginTop: 10 }}><div className="nc-warnbox-hd">客户备注</div><div>{c.note}</div></div>}
      </Card>
      <Card hd={`关联业务 · 商机 ${opps.length} / 报价 ${quotes.length} / 合同 ${contracts.length}`}>
        {opps.length > 0 && <div style={{ marginBottom: 6 }}><span className="nc-cell-sub">商机：</span>{opps.map((o) => <Tag key={o.id} tone="gray">{o.id}</Tag>).reduce((acc, t, i) => <>{acc}{i > 0 ? ' ' : ''}{t}</>, <></>)}</div>}
        {quotes.length > 0 && <div style={{ marginBottom: 6 }}><span className="nc-cell-sub">报价：</span>{quotes.map((q) => <Tag key={q.id} tone="gray">{q.id}</Tag>).reduce((acc, t, i) => <>{acc}{i > 0 ? ' ' : ''}{t}</>, <></>)}</div>}
        {contracts.length > 0 && <div><span className="nc-cell-sub">合同：</span>{contracts.map((ct) => <Tag key={ct.id} tone="gray">{ct.id}</Tag>).reduce((acc, t, i) => <>{acc}{i > 0 ? ' ' : ''}{t}</>, <></>)}</div>}
        {opps.length + quotes.length + contracts.length === 0 && <div className="nc-cell-sub">暂无关联业务</div>}
      </Card>
    </>
  );
}

/** 投标（内容多 → 弹窗） */
function BidDetail({ id, role }: { id: string; role: string }) {
  const b = getBids().find((x) => x.id === id);
  if (!b) return <div className="nc-empty-mini">未找到投标单 {id}</div>;
  return (
    <>
      <Banner tone="info">只读穿透预览 · 完整阶段推进 / 登记操作请进入投标管理页</Banner>
      <Card hd="投标信息">
        <KvGrid rows={[
          { k: '投标单', v: <b>{b.id}</b> },
          { k: '项目名称', v: <span style={{ maxWidth: 480 }}>{b.name}</span> },
          { k: '客户', v: b.customer },
          { k: '当前阶段', v: <Tag tone="blue">{b.stage}</Tag> },
          { k: '投标金额', v: <Money v={b.amt} role={role} wan /> },
          { k: '保证金', v: <span><Money v={b.deposit} role={role} wan /> · {b.depositSt === '未退' ? <Tag tone="orange">未退</Tag> : <Tag tone="gray">{b.depositSt}</Tag>}</span> },
          { k: '开标日期', v: b.openDate },
          { k: '负责人', v: b.owner },
          { k: '证书', v: `${b.certGot} / ${b.certNeed} 本` },
          { k: '项目经理', v: b.projMgr },
          { k: '风险标记', v: b.risk !== 'none' ? <Tag tone="red">{b.risk}</Tag> : <Tag tone="gray">无</Tag> },
          { k: '关联', v: `${b.opp ? `商机 ${b.opp}` : ''}${b.opp && b.quoteId ? ' · ' : ''}${b.quoteId ? `报价 ${b.quoteId}` : ''}` || '—' },
        ]} cols={2} />
      </Card>
    </>
  );
}

/** 合同（内容多 → 弹窗） */
function ContractDetail({ id, role }: { id: string; role: string }) {
  const ct = getContracts().find((x) => x.id === id);
  if (!ct) return <div className="nc-empty-mini">未找到合同 {id}</div>;
  return (
    <>
      <Banner tone="info">只读穿透预览 · 完整条款 / 收付 / 变更操作请进入合同详情页</Banner>
      <Card hd="合同信息">
        <KvGrid rows={[
          { k: '合同编号', v: <b>{ct.id}</b> },
          { k: '合同名称', v: <span style={{ maxWidth: 480 }}>{ct.name}</span> },
          { k: '类型', v: ct.type },
          { k: '相对方', v: ct.party },
          { k: '合同额', v: <Money v={ct.amt} role={role} wan /> },
          { k: '执行额', v: <Money v={ct.execAmt} role={role} wan /> },
          { k: '状态', v: <Tag tone={ct.status === '履约中' ? 'green' : ct.status === '已终止' ? 'red' : 'gray'}>{ct.status}</Tag> },
          { k: '收款', v: <span><b className="num">{ct.recvPct}%</b> · 已收 <Money v={ct.recv} role={role} wan /></span> },
          { k: '负责人', v: ct.owner },
          { k: '签署 / 起始', v: `${ct.sign} · ${ct.start}` },
          { k: '结束', v: ct.end },
          { k: '节点', v: ct.nodes },
          ...(ct.overdue ? [{ k: '标记', v: <Tag tone="red">收款逾期</Tag> }] : []),
          ...(ct.overpay ? [{ k: '标记', v: <Tag tone="red">超付风险</Tag> }] : []),
          ...(ct.signStatus && ct.signStatus !== '未发起' ? [{ k: '电子签', v: <Tag tone={ct.signStatus === '已签' ? 'green' : 'orange'}>{ct.signStatus}</Tag> }] : []),
          { k: '合同角色', v: <Tag tone="gray">{ct.contractRole === 'supplement_price' ? '价格调整补充' : ct.contractRole === 'supplement_service' ? (ct.parentId ? '框架执行单' : '新增服务补充') : ct.contractRole === 'maintenance' ? '维保合同' : '主合同'}</Tag> },
          ...(ct.parentId ? [{ k: '挂载父合同', v: <span className="num">{ct.parentId}</span> }] : []),
        ]} cols={2} />
      </Card>
    </>
  );
}

/** 项目（内容多 → 弹窗） */
function ProjectDetail({ id, role }: { id: string; role: string }) {
  const p = getProjects().find((x) => x.id === id);
  if (!p) return <div className="nc-empty-mini">未找到项目 {id}</div>;
  return (
    <>
      <Banner tone="info">只读穿透预览 · 完整经营指标与进度操作请进入项目经营中心</Banner>
      <Card hd="项目信息">
        <KvGrid rows={[
          { k: '项目', v: <b>{p.id}</b> },
          { k: '项目名称', v: <span style={{ maxWidth: 480 }}>{p.name}</span> },
          { k: '类型 / 业务线', v: `${p.type} · ${p.biz}` },
          { k: '来源', v: p.source },
          { k: '客户', v: p.customer },
          { k: '状态', v: <Tag tone={p.status === '在建' ? 'green' : p.status === '暂停' ? 'orange' : p.status === '竣工' ? 'blue' : 'gray'}>{p.status}</Tag> },
          { k: '合同额', v: <Money v={p.contractAmt} role={role} wan /> },
          { k: '执行额', v: <Money v={p.execAmt} role={role} wan /> },
          { k: '成本', v: <Money v={p.cost} role={role} wan /> },
          { k: '里程碑', v: `${p.milestoneName}（${p.milestone}%）` },
          { k: '收款比例', v: <span className="num">{p.recvPct}%</span> },
          { k: '利润', v: <Money v={p.profit} role={role} wan /> },
          { k: '负责人 / PM', v: `${p.owner} · ${p.pm}` },
          { k: '起止', v: `${p.start} ~ ${p.end}` },
          { k: '风险', v: p.risk !== 'none' ? <Tag tone="red">{p.risk}</Tag> : <Tag tone="gray">无</Tag> },
          { k: '溯源', v: `${p.oppId ? `商机 ${p.oppId} ` : ''}${p.quoteId ? `报价 ${p.quoteId} ` : ''}${p.bidId ? `投标 ${p.bidId} ` : ''}${p.contractId ? `合同 ${p.contractId}` : ''}` || '—' },
        ]} cols={2} />
      </Card>
    </>
  );
}

/* ---------------- 宿主：按 target 分发 抽屉 / 弹窗 ---------------- */
export function EntityPreviewHost({ role }: { role: string }) {
  const p = usePreview();
  if (!p) return null;
  const { target, id } = p;
  const close = closePreview;
  const titleOf: Record<string, string> = {
    supplier: '供应商档案', quote: '报价单详情', opp: '商机详情',
    customer: '客户档案', bid: '投标单详情', contract: '合同详情', 'project-center': '项目详情',
  };
  const title = <>{titleOf[target] ?? '详情'} · <Code>{id}</Code></>;
  const body = (() => {
    switch (target) {
      case 'supplier': return <SupplierDetail id={id} role={role} />;
      case 'opp': return <OppDetail id={id} role={role} />;
      case 'quote': return <QuoteDetail id={id} role={role} />;
      case 'customer': return <CustomerDetail id={id} role={role} />;
      case 'bid': return <BidDetail id={id} role={role} />;
      case 'contract': return <ContractDetail id={id} role={role} />;
      case 'project-center': return <ProjectDetail id={id} role={role} />;
      default: return <div className="nc-empty-mini">暂不支持该实体的穿透预览（{target}）</div>;
    }
  })();
  const foot = <Btn kind="primary" onClick={close}>关闭</Btn>;

  /* 统一弹窗：供应商 / 商机 / 报价 680，客户 / 投标 720，合同 760，项目 780 */
  return (
    <Modal open title={title} width={target === 'project-center' ? 780 : target === 'contract' ? 760 : target === 'quote' ? 680 : 720} onClose={close} foot={foot}>
      {body}
    </Modal>
  );
}
