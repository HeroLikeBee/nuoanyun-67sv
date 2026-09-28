// 投标详情（独立页）—— 由原「投标详情抽屉」迁移而来：
// 去掉右侧抽屉遮罩 / 定宽 aside / 关闭按钮，改为页内面包屑 + 返回列表，
// 与合同详情（ContractDetailPage）同一模式。二级操作（证书池选择 / 结果登记）
// 由 Drawer 改为 Modal，消除「详情抽屉上再叠一层抽屉」。
// 数据：当前投标由 getFocus('bid-detail') 解析（列表 openDetail 先 setFocus 再 go）。
import React, { useEffect, useState, useSyncExternalStore } from 'react';
import {
  Btn, Banner, ChainBar, Check, Code, ConfirmModal, EntityLink, Field, KvGrid, Modal,
  Money, Op, Progress, Tabs, Tag, Timeline, Tip, useToast,
} from '../components/ui';
import type { Cert } from '../components/data';
import {
  BIDS, BID_STAGES, BID_RESULT_TYPES, BID_ABANDON_REASONS, isBidClosed,
  fmt, fmtWan, TODAY, can, CERT_CATS, CERT_CAT_OF,
} from '../components/data';
import {
  getBids, getCerts, patchBid as storePatchBid, getFocus,
  setPendingContract, setPendingProject, subscribeStore,
} from '../components/store';
import { Ico } from '../components/icons';

const ST_TONE: Record<string, 'gray' | 'blue' | 'green' | 'red' | 'gold' | 'orange'> = {
  报名: 'gray', 购买文件: 'blue', 做标书: 'blue', 开标: 'blue',
  中标: 'green', 未中标: 'gray', 已放弃: 'gray',
};
const DEP_TONE: Record<string, 'gray' | 'blue' | 'green' | 'red'> = { 未交: 'gray', 已交: 'blue', 未退: 'red', 已退: 'green', 未涉及: 'gray' };
type B = (typeof BIDS)[number];
const bidIdx = (s: string) => (BID_STAGES as readonly string[]).indexOf(s);

const CERT_MODE_LABEL: Record<string, string> = { single: '一证一项目', multi: '多项目引用', log: '按次登记' };

/** 项7：一键打包业绩 · 默认打包材料清单（mock） */
const PACK_ITEMS = [
  { key: 'notice', label: '中标通知书', desc: '中标结果登记时上传的扫描件' },
  { key: 'contract', label: '合同', desc: '中标后生成的销售合同正本' },
  { key: 'accept', label: '验收证明', desc: '竣工验收报告 / 交付证明' },
  { key: 'bid', label: '投标文件', desc: '本次投标商务 + 技术标书' },
];

/** 开标结果主选择：中标 / 未中标 */
const RESULT_KINDS = ['中标', '未中标'] as const;

/** 保证金缴纳方式 */
const DEP_METHODS = ['银行转账', '银行保函', '保证保险'];

/** 跟进记录：人工登记（可增删改，提交后不可改） */
const followsOf = (b: B) => [
  { date: '2026-09-05', text: `电话跟进招标代理，确认资格预审要求（需证书 ${b.certNeed} 本）`, by: b.owner },
  { date: '2026-09-12', text: `现场踏勘：${b.name}，重点核对${b.certNeed > 3 ? '消防主机房与管网走向' : '作业面与工期窗口'}`, by: b.owner },
];
/** 操作记录：系统自动生成（不可编辑、不可删除） */
const opsOf = (b: B) => {
  const l: { date: string; text: string; by: string }[] = [
    { date: '2026-09-01', text: '创建投标 · 独立新建', by: b.owner },
  ];
  if (b.certGot > 0) l.push({ date: '2026-09-08', text: `引用证书：${b.certGot} 本（并行占用 +${b.certGot}）`, by: b.owner });
  if (['已交', '未退', '已退'].includes(b.depositSt)) l.push({ date: '2026-09-12', text: `保证金登记已交：${fmtWan(b.deposit)}（银行转账）`, by: b.owner });
  if (b.depositSt === '已退') l.push({ date: '2026-09-20', text: `保证金登记已退：${fmtWan(b.deposit)}`, by: '财务' });
  if (bidIdx(b.stage) >= bidIdx('开标')) l.push({ date: b.openDate, text: '流转：做标书 → 开标（标书递交并完成开标，证书引用锁定）', by: b.owner });
  if (b.stage === '中标') l.push({ date: b.openDate, text: `登记结果：中标 ${fmtWan(b.amt)}（已回写商机）`, by: b.owner });
  if (b.stage === '未中标') l.push({ date: b.openDate, text: `登记结果：${b.resultType || '未中标'}（${b.risk || '价稍高'}）`, by: b.owner });
  if (b.stage === '已放弃') l.push({ date: b.openDate, text: `放弃投标（原因：${b.abandonReason || '—'}）· 证书占用已释放 · 保证金转「未退」`, by: b.owner });
  l.push({ date: TODAY, text: `当前阶段：${b.stage}`, by: '系统' });
  return l;
};

export default function BidDetailPage({ go, role }: { go: (p: string) => void; role: string; nav?: number }) {
  const toast = useToast();
  /* 当前投标由 getFocus('bid-detail') 解析（与 contract-detail 同模式），取不到给空态 */
  const focusId = getFocus('bid-detail');
  const [bids, setBids] = useState<B[]>(() => getBids());
  useEffect(() => subscribeStore(() => setBids([...getBids()])), []);
  const cur = bids.find((b) => b.id === focusId) ?? null;

  /* 证书池读跨页 store：证书管理页续证 / 收回后，本页可引用池与三要素校验即时跟随 */
  const certs = useSyncExternalStore(subscribeStore, getCerts, getCerts);
  const canWrite = can(role, 'bid');

  /* 页内 Tab：概览 / 引用证书 / 跟进记录 / 操作记录 */
  const [tab, setTab] = useState('overview');
  /* 证书池选择（已由 Drawer 改为 Modal，不再抽屉叠加） */
  const [poolOpen, setPoolOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>(['ZS000015']);
  const [useText, setUseText] = useState<Record<string, string>>({});
  const [poolKw, setPoolKw] = useState('');
  const [poolCat, setPoolCat] = useState('');
  /* 风险二次确认 */
  const [riskOpen, setRiskOpen] = useState(false);
  const [riskAck, setRiskAck] = useState(false);
  /* 结果登记（已由 Drawer 改为 Modal） */
  const [resultOpen, setResultOpen] = useState<B | null>(null);
  const [resultType, setResultType] = useState('中标');
  const [winAmt, setWinAmt] = useState(0);
  const [loseType, setLoseType] = useState<string>('未中标');
  const [loseReason, setLoseReason] = useState('');
  const [loseText, setLoseText] = useState('');
  /* 中标通知书文件名 + 预览弹窗 */
  const [winNotice, setWinNotice] = useState('');
  const [noticePreview, setNoticePreview] = useState(false);
  /* 一键打包业绩预览弹窗 */
  const [packOpen, setPackOpen] = useState(false);
  const [packSel, setPackSel] = useState<string[]>(['notice', 'contract', 'accept']);
  /* 放弃投标（终态，原因必填） */
  const [abandonOpen, setAbandonOpen] = useState<B | null>(null);
  const [abandonReason, setAbandonReason] = useState('');
  /* 保证金登记 */
  const [depOpen, setDepOpen] = useState<B | null>(null);
  const [depMethod, setDepMethod] = useState('银行转账');
  const [depAmt, setDepAmt] = useState(0);
  /* 跟进记录（人工登记） */
  const [followOpen, setFollowOpen] = useState(false);
  const [followText, setFollowText] = useState('');
  /* 移除证书引用（二次确认） */
  const [unrefOpen, setUnrefOpen] = useState<Cert | null>(null);

  const daysUntil = (d: string) => Math.round((new Date(d).getTime() - new Date(TODAY).getTime()) / 86400000);

  /* 投标单据回写：写共享 store（订阅回调会同步刷新本页 cur） */
  const patchBid = (id: string, patch: Partial<B>, msg: string) => {
    storePatchBid(id, patch);
    toast(msg);
  };

  /* 建造师三要素校验（硬拦截） */
  const builderCheck = (b: B) => {
    const builder = certs.find((c) => c.isBuilder && c.holder === b.projMgr);
    const okValid = !!builder && builder.validTo >= TODAY;
    const okB = b.pmB === '有效';
    const okBusy = !b.pmBusy;
    return { okValid, okB, okBusy, pass: okValid && okB && okBusy, builder };
  };

  const advance = (b: B) => {
    if (b.stage === '开标') { setResultOpen(b); setWinAmt(b.amt); return; }
    const seq = BID_STAGES as readonly string[];
    const i = seq.indexOf(b.stage);
    const next = i >= 0 && i < seq.indexOf('开标') ? seq[i + 1] : b.stage;
    if (next === b.stage) { toast('当前阶段需通过「登记开标结果」推进'); return; }
    patchBid(b.id, { stage: next as B['stage'] }, `${b.id} 阶段已推进：${b.stage} → ${next}（开标当日锁定不可回退）`);
  };

  /** 放弃投标（终态）：已交保证金转「未退」；证书占用立即释放 */
  const doAbandon = () => {
    const b = abandonOpen;
    if (!b) return;
    if (!abandonReason) { toast('放弃原因必填（终态操作，用于投标复盘）', 'err'); return; }
    const released = b.certGot;
    const depSt = b.depositSt === '已交' ? '未退' : b.depositSt;
    patchBid(b.id, {
      stage: '已放弃', abandonReason,
      depositSt: depSt as B['depositSt'], certGot: 0,
      risk: `已放弃 · 证书已释放${depSt === '未退' ? ' · 保证金未退' : ''}`,
    }, `${b.id} 已放弃投标（原因：${abandonReason}）· 释放证书 ${released} 本${depSt === '未退' ? ' · 保证金转「未退」并进入风险榜' : ''}`);
    setAbandonOpen(null); setAbandonReason('');
  };

  /* 项8：证书池搜索 + 大类筛选（过期/占满置灰逻辑不变，仅过滤渲染） */
  const poolList = certs.filter((c) => {
    if (poolCat && CERT_CAT_OF[c.subType] !== poolCat) return false;
    if (poolKw.trim() && !(c.name + c.id + c.certNo + c.holder).toLowerCase().includes(poolKw.trim().toLowerCase())) return false;
    return true;
  });

  /* 未定位到投标（focus 失效 / 台账为空）：给可返回的空态 */
  if (!cur) {
    return (
      <div className="nc-detail-page">
        <div className="nc-crumbs"><a className="nc-link" onClick={() => go('bid')}>投标管理</a><span className="nc-crumbs-sep">/</span><span>详情</span></div>
        <div className="nc-empty">未找到投标（聚焦 ID：{focusId || '空'}）<Btn size="sm" kind="primary" onClick={() => go('bid')}>返回投标管理</Btn></div>
      </div>
    );
  }

  const bc = builderCheck(cur);
  const d = daysUntil(cur.openDate);
  const locked = bidIdx(cur.stage) >= bidIdx('开标');

  return (
    <>
      <div className="nc-detail-page">
        {/* ---------- 面包屑 ---------- */}
        <div className="nc-crumbs">
          <a className="nc-link" onClick={() => go('bid')}>投标管理</a>
          <span className="nc-crumbs-sep">/</span>
          <span>{cur.id}</span>
        </div>

        {/* ---------- 页头 ---------- */}
        <div className="nc-d2-head">
          <div className="nc-d2-titlerow">
            <span className="nc-d2-id">{cur.id}</span>
            <Tag tone={ST_TONE[cur.stage]}>{cur.stage}</Tag>
            <span className="spacer" />
            <Btn kind="primary" onClick={() => go('bid')} title="返回投标列表">← 返回列表</Btn>
          </div>
          <div className="nc-d2-name">{cur.name}</div>
          <div className="nc-d2-sub">
            <span>{cur.customer}</span>
            <span>预估 {fmtWan(cur.amt)}</span>
            <span>负责人 {cur.owner}</span>
            <span>开标 {cur.openDate}</span>
          </div>
        </div>

        {/* ---------- 问题条：红/橙/金三级 ---------- */}
        <div className="nc-issues">
          {cur.certGot < cur.certNeed && <div className="nc-issue is-red"><Ico n="ban" size={16} /> 证书硬缺口 {cur.certNeed - cur.certGot} 本 —— 开标资格审查将废标</div>}
          {!bc.pass && <div className="nc-issue is-red"><Ico n="ban" size={16} /> 建造师三要素不通过：{!bc.okValid ? '建造师证书过期/缺失' : !bc.okB ? '同人 B 证无效' : '存在在建项目'}</div>}
          {cur.depositSt === '未退' && <div className="nc-issue is-orange"><Ico n="warning" size={16} /> 保证金 {fmtWan(cur.deposit)} 未退（已 {Math.abs(d)} 天）</div>}
          {d >= 0 && d <= 7 && !isBidClosed(cur) && <div className="nc-issue is-gold"><Ico n="bell" size={16} /> 开标临近：剩 {d} 天（{cur.openDate}）</div>}
          {bc.pass && cur.depositSt !== '未退' && !(d >= 0 && d <= 7) && cur.certGot >= cur.certNeed && <div className="nc-issue is-ok"><Ico n="check" size={16} /> 资格预检通过：证书齐备 · 建造师三要素通过 · 保证金正常</div>}
        </div>

        {/* ---------- 7 阶段长条 ---------- */}
        <ChainBar compact nodes={BID_STAGES.map((s) => {
          const ci = bidIdx(cur.stage);
          const idx = bidIdx(s);
          const isReject = (cur.stage === '未中标' || cur.stage === '已放弃') && s === cur.stage;
          const state = isReject ? 'rejected' : idx < ci ? 'done' : idx === ci ? 'cur' : 'todo';
          return { label: s, state: state as 'done' | 'cur' | 'todo' | 'rejected' };
        })} />

        {/* ---------- 操作区（原详情抽屉 foot） ---------- */}
        <div className="nc-d2-actions">
          {!isBidClosed(cur) && <Btn kind="primary" size="sm" onClick={() => advance(cur)}>{cur.stage === '开标' ? '登记开标结果' : '推进阶段'}</Btn>}
          {cur.stage === '开标' && <Btn size="sm" danger onClick={() => setRiskOpen(true)}>提交登记（风险确认）</Btn>}
          {cur.stage === '中标' && <>
            <Btn kind="primary" size="sm" onClick={() => {
              setPendingContract({ bidId: cur.id, customer: cur.customer, name: cur.name, amt: cur.amt });
              go('contract-new');
            }}>中标 → 生成合同</Btn>
            <Btn size="sm" onClick={() => {
              setPendingProject({ bidId: cur.id, name: cur.name, customer: cur.customer, amt: cur.amt });
              go('project-new');
            }}>中标 → 补建项目</Btn>
          </>}
          {(cur.depositSt === '未交' || cur.depositSt === '未退') && (
            <Btn size="sm" onClick={() => { setDepAmt(cur.deposit); setDepOpen(cur); }}>
              {cur.depositSt === '未交' ? '登记保证金已交' : '解除 / 登记已退'}
            </Btn>
          )}
          <Btn size="sm" onClick={() => setPoolOpen(true)}>证书池选择</Btn>
          <Btn size="sm" onClick={() => { setPackSel(['notice', 'contract', 'accept']); setPackOpen(true); }}>一键打包业绩</Btn>
          {!isBidClosed(cur) && <Btn size="sm" danger onClick={() => { setAbandonOpen(cur); setAbandonReason(''); }}>放弃投标</Btn>}
        </div>

        {/* ---------- Tab ---------- */}
        <div className="nc-d2-tabs">
          <Tabs
            items={[
              { key: 'overview', label: '概览' },
              { key: 'cert', label: '引用证书 ' + picked.length },
              { key: 'log', label: '跟进记录 ' + followsOf(cur).length },
              { key: 'ops', label: '操作记录 ' + opsOf(cur).length },
            ]}
            value={tab} onChange={setTab}
          />
        </div>

        {tab === 'overview' && (
          <>
            <KvGrid cols={2} rows={[
              { k: '投标编号', v: <Code>{cur.id}</Code> },
              { k: '阶段', v: <Tag tone={ST_TONE[cur.stage]}>{cur.stage}</Tag> },
              { k: '项目名称', v: cur.name },
              { k: '客户', v: <EntityLink target="customer" id={cur.customerId} go={go} title="下钻到客户档案">{cur.customer}</EntityLink> },
              { k: '预估金额', v: <Money v={cur.amt} role={role} /> },
              { k: '保证金', v: <><Money v={cur.deposit} role={role} wan /> · {cur.depositSt}</> },
              { k: '开标时间', v: `${cur.openDate}（${d >= 0 ? '剩 ' + d + ' 天' : '已开标'}）` },
              { k: '负责人', v: cur.owner },
              { k: '拟派项目经理', v: cur.projMgr },
              { k: '证书占用', v: <span className={cur.certGot < cur.certNeed ? 'is-red' : ''}>{cur.certGot}/{cur.certNeed}{cur.certGot < cur.certNeed ? <><Ico n="warning" size={12} style={{ color: 'var(--c-warning-mid)' }} /> 缺口 {cur.certNeed - cur.certGot}</> : null}</span> },
              { k: '证书引用状态', v: locked ? <Tag tone="red">已锁定（{cur.stage} 后不可移除）</Tag> : <Tag tone="green">可增删（做标书前）</Tag> },
              { k: '风险提示', v: cur.risk || '/' },
            ]} />

            <div className="nc-sec-title">建造师三要素校验</div>
            <div className={`nc-warnbox ${bc.pass ? 'is-green' : 'is-red'}`}>
              <div className="nc-warnbox-hd">{bc.pass ? ' 三要素全部满足，可担任本项目经理' : ' 三要素不满足，不可提交投标文件'}</div>
              <ul className="nc-check-list">
                <li>{bc.okValid ? <Ico n="check" size={13} style={{ color: 'var(--c-success-deep)' }} /> : <Ico n="ban" size={13} style={{ color: 'var(--c-danger)' }} />} 建造师证书有效{bc.builder ? `（${bc.builder.name} · 有效期至 ${bc.builder.validTo}）` : '（未找到该建造师证书）'}</li>
                <li>{bc.okB ? <Ico n="check" size={13} style={{ color: 'var(--c-success-deep)' }} /> : <Ico n="ban" size={13} style={{ color: 'var(--c-danger)' }} />} 同人 B 证有效（当前：{cur.pmB}）</li>
                <li>{bc.okBusy ? <Ico n="check" size={13} style={{ color: 'var(--c-success-deep)' }} /> : <Ico n="ban" size={13} style={{ color: 'var(--c-danger)' }} />} 无在建项目（当前：{cur.pmBusy ? '存在在建项目' : '无在建'}）</li>
              </ul>
            </div>

            <div className="nc-sec-title">保证金流转</div>
            <Timeline items={[
              { date: cur.openDate > TODAY ? TODAY : cur.openDate, text: `保证金 ${fmtWan(cur.deposit)} · 当前状态「${cur.depositSt}」`, tone: cur.depositSt === '未退' ? 'red' : cur.depositSt === '已退' ? 'ok' : 'gray' },
              ...(cur.depositSt === '未交' ? [{ date: TODAY, text: '待缴纳（保证金未交不可进入「开标」）', tone: 'gold' as const }] : []),
              ...(cur.depositSt === '未退' ? [{ date: TODAY, text: `已超 30 天未退，请跟进招标代理机构（保证金独立流转）`, tone: 'red' as const }] : []),
            ]} />
          </>
        )}

        {tab === 'cert' && (
          <>
            {locked && <Banner tone="warn"><Ico n="ban" size={16} /> 当前阶段证书引用已锁定，不可移除（{cur.stage} 后锁定）。如需变更请联系商务负责人走变更流程。</Banner>}
            <div className="nc-sec-title">引用证书（配额 {cur.certGot}/{cur.certNeed}）</div>
            <Progress value={(cur.certGot / cur.certNeed) * 100} tone={cur.certGot >= cur.certNeed ? 'green' : cur.certGot >= cur.certNeed - 1 ? 'orange' : 'red'} />
            <table className="nc-tbl" style={{ minWidth: 640 }}>
              <thead><tr><th>证书名称</th><th style={{ width: 100 }}>占用方式</th><th style={{ width: 100 }}>持有人</th><th style={{ width: 110 }}>有效期至</th><th style={{ width: 90 }} className="is-center">移除</th></tr></thead>
              <tbody>
                {certs.slice(0, cur.certGot).map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}<div className="nc-cell-sub"><Code>{c.id}</Code></div></td>
                    <td><Tag tone={c.mode === 'single' ? 'red' : c.mode === 'multi' ? 'blue' : 'gray'}>{CERT_MODE_LABEL[c.mode]}</Tag></td>
                    <td>{c.holder}</td>
                    <td className={c.validTo < TODAY ? 'is-red' : c.warnDays ? 'is-orange' : ''}>{c.validTo}</td>
                    <td className="is-center">{locked ? <Op disabled title="该证书正被项目占用，须先在证书台账「用完收回」后才能移除引用">锁定</Op> : <Op danger onClick={() => setUnrefOpen(c)}>移除</Op>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {cur.certNeed > cur.certGot && (
              <div className="nc-warnbox is-danger">
                <div className="nc-warnbox-hd"><Ico n="ban" size={16} /> 证书硬缺口 {cur.certNeed - cur.certGot} 本</div>
                开标资格审查将废标，请立即补配或走提额流程。
                <div className="nc-ops" style={{ marginTop: 8 }}>
                  <Btn size="sm" kind="primary" onClick={() => setPoolOpen(true)}>从证书池补配</Btn>
                  <Btn size="sm" onClick={() => toast('提额申请已发起（超出并行占用上限）')}>申请提额</Btn>
                </div>
              </div>
            )}
            {picked.some((id) => certs.find((c) => c.id === id)?.mode === 'log') && (
              <div className="nc-warnbox is-warn">
                <Ico n="check" size={14} style={{ color: 'var(--c-success-deep)' }} /> 已引用「按次登记」类证书（电工证 / 焊工证等），请在下方登记使用人
              </div>
            )}
          </>
        )}

        {tab === 'log' && (
          <>
            <div className="nc-sec-title" style={{ marginBottom: 12 }}>
              跟进记录（人工登记）
              <span className="nc-hint" style={{ fontWeight: 400, marginLeft: 8 }}>仅记录人工跟进动作；提交后不可改，错误走「更正」</span>
            </div>
            <Timeline items={followsOf(cur).map((f) => ({
              date: f.date, tone: 'ok' as const, text: <>{f.text} <span className="nc-hint">· {f.by}</span></>,
            }))} />
            <Btn size="sm" onClick={() => { setFollowText(''); setFollowOpen(true); }}>＋ 登记跟进</Btn>
          </>
        )}

        {tab === 'ops' && (
          <>
            <div className="nc-sec-title" style={{ marginBottom: 12 }}>操作记录（{opsOf(cur).length}）</div>
            <Timeline items={opsOf(cur).map((o) => ({
              date: o.date,
              tone: o.by === '系统' ? 'gray' as const : o.text.includes('中标') ? 'ok' as const : 'gold' as const,
              text: <>{o.text} <span className="nc-hint">· {o.by}</span></>,
            }))} />
          </>
        )}
      </div>

      {/* ================= 证书池选择（Drawer → Modal，消除抽屉叠加） ================= */}
      <Modal open={poolOpen} onClose={() => setPoolOpen(false)} size="L" title="证书池选择"
        foot={<><Btn onClick={() => setPoolOpen(false)}>取消</Btn><Btn kind="primary" onClick={() => { toast(`已引用 ${picked.length} 本证书，并行占用 +${picked.length}`); setPoolOpen(false); }}>确认引用（{picked.length}）</Btn></>}>
        <Banner tone="warn"><Ico n="ban" size={16} /> 硬拦截：过期证书不可引用 · 超出并行占用上限不可引用 · 开标后引用锁定不可移除。不可用证书置灰并显示原因。</Banner>
        <div className="nc-toolbar" style={{ margin: '8px 0' }}>
          <input className="nc-input nc-input-sm" style={{ width: 220 }} value={poolKw} onChange={(e) => setPoolKw(e.target.value)} placeholder="搜索证书名称 / 编号 / 持有人" />
          <select className="nc-input nc-input-sm" value={poolCat} onChange={(e) => setPoolCat(e.target.value)}>
            {CERT_CATS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
          <span className="nc-cell-sub">筛选 {poolList.length} / {certs.length} 本</span>
        </div>
        <table className="nc-tbl" style={{ minWidth: 700 }}>
          <thead><tr><th style={{ width: 44 }} /><th>证书名称 / 编号</th><th style={{ width: 110 }}>占用方式</th><th style={{ width: 100 }}>持有人</th><th style={{ width: 110 }}>有效期至</th><th style={{ width: 90 }} className="is-num">占用</th></tr></thead>
          <tbody>
            {poolList.map((c) => {
              const expired = c.validTo < TODAY;
              const full = c.mode === 'single' && c.used.length >= c.cap;
              const dis = expired || full;
              const why = expired ? '已过期' : full ? `已达并行占用上限（${c.used.length}/${c.cap}）` : '';
              return (
                <tr key={c.id} className={dis ? 'is-muted' : ''}>
                  <td>
                    <input type="checkbox" className="nc-check" disabled={dis} checked={picked.includes(c.id)}
                      onChange={() => setPicked((p) => (p.includes(c.id) ? p.filter((x) => x !== c.id) : [...p, c.id]))} />
                  </td>
                  <td>
                    {c.name}
                    <div className="nc-cell-sub"><Code>{c.id}</Code> · {c.issue}{dis && <span className="is-red"> · <Ico n="ban" size={12} /> {why}</span>}</div>
                    {c.mode === 'log' && picked.includes(c.id) && (
                      <div className="nc-pick-row">
                        <input className="nc-cell-in" placeholder="请输入使用人（按次登记必填）" value={useText[c.id] || ''} onChange={(e) => setUseText((p) => ({ ...p, [c.id]: e.target.value }))} />
                      </div>
                    )}
                    {c.mode === 'single' && full && <div className="nc-cell-sub is-red">占用明细：{c.used.join('、')} · 可申请提额</div>}
                  </td>
                  <td><Tag tone={c.mode === 'single' ? 'red' : c.mode === 'multi' ? 'blue' : 'gray'}>{CERT_MODE_LABEL[c.mode]}</Tag></td>
                  <td>{c.holder}</td>
                  <td className={expired ? 'is-red' : c.warnDays ? 'is-orange' : ''}>{c.validTo}</td>
                  <td className="is-num">{c.used.length}/{c.cap === 99 ? '∞' : c.cap}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Modal>

      {/* ================= 风险二次确认 ================= */}
      <Modal open={riskOpen} onClose={() => setRiskOpen(false)} width={480} title="证书硬缺口风险确认"
        foot={<><Btn onClick={() => setRiskOpen(false)}>取消</Btn><Btn danger disabled={!riskAck} title={riskAck ? undefined : '请先勾选「已知悉废标风险」后方可登记'} onClick={() => { toast('已提交登记（已知悉废标风险）'); setRiskOpen(false); setRiskAck(false); }}>确认提交</Btn></>}>
        <Banner tone="danger">存在证书硬缺口，开标资格审查将废标，请二次确认：</Banner>
        <Check checked={riskAck} onChange={setRiskAck} label="已知悉废标风险，仍要求提交登记" />
      </Modal>

      {/* 中标通知书预览（mock） */}
      <Modal open={noticePreview} onClose={() => setNoticePreview(false)} width={480} title="中标通知书预览"
        foot={<Btn onClick={() => setNoticePreview(false)}>关闭</Btn>}>
        <div style={{ textAlign: 'center', padding: '28px 0' }}>
          <Ico n="file" size={48} />
          <div style={{ marginTop: 12 }}><b>{winNotice || '中标通知书.pdf'}</b></div>
          <div className="nc-cell-sub">演示预览：实际将在线渲染 PDF / 扫描件（含签章页）</div>
        </div>
      </Modal>

      {/* 一键打包业绩 · 预览 / 勾选调整 */}
      <Modal open={packOpen} onClose={() => setPackOpen(false)} width={520} title="一键打包业绩 · 预览"
        foot={<><Btn onClick={() => setPackOpen(false)}>取消</Btn><Btn kind="primary" disabled={!packSel.length} onClick={() => {
          const labels = PACK_ITEMS.filter((i) => packSel.includes(i.key)).map((i) => i.label).join(' + ');
          toast(`已打包 ${packSel.length} 份业绩材料：${labels}`);
          setPackOpen(false);
        }}>确认打包（{packSel.length}）</Btn></>}>
        <Banner tone="info">按「业绩组合」自动归集本投标相关证明材料，可勾选调整后再打包。</Banner>
        <div style={{ marginTop: 12 }}>
          {PACK_ITEMS.map((it) => (
            <div key={it.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--c-border, #eee)' }}>
              <Check checked={packSel.includes(it.key)} onChange={(v) => setPackSel((p) => v ? [...new Set([...p, it.key])] : p.filter((x) => x !== it.key))} />
              <div>
                <div>{it.label}</div>
                <div className="nc-cell-sub">{it.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* ================= 结果登记（Drawer → Modal） ================= */}
      <Modal open={!!resultOpen} onClose={() => setResultOpen(null)} width={640} title={`开标结果登记 · ${resultOpen?.id ?? ''}`}
        foot={<><Btn onClick={() => setResultOpen(null)}>取消</Btn><Btn kind="primary" onClick={() => {
          if (!resultOpen) return;
          if (resultType === '中标' && !(winAmt > 0 || resultOpen.amt > 0)) { toast('请填写中标金额', 'err'); return; }
          if (resultType === '未中标' && (!loseReason || !loseText.trim())) { toast('未中标须选择原因并填写说明（≤200 字）', 'err'); return; }
          if (resultType === '中标') {
            const amt = winAmt > 0 ? winAmt : resultOpen.amt;
            patchBid(resultOpen.id, { stage: '中标', amt }, `已登记中标 ¥${amt.toLocaleString('en-US')} → 可生成项目 XM 编号（重复登记不会生成第二个项目）`);
          } else {
            patchBid(resultOpen.id, { stage: '未中标', resultType: loseType, loseReason, loseText: loseText.trim() },
              `已登记「${loseType}」· 原因：${loseReason} · 保证金进入待退流程，同步回写商机丢标原因`);
          }
          setResultOpen(null); setLoseType('未中标'); setLoseReason(''); setLoseText('');
        }}>确认登记</Btn></>}>
        <Banner tone="info">
          中标金额默认取投标金额可改；未中标须选原因并填写说明。
        </Banner>
        <div className="nc-form-grid">
          <Field label="结果" req><select className="nc-input" value={resultType} onChange={(e) => setResultType(e.target.value)}>{RESULT_KINDS.map((t) => <option key={t}>{t}</option>)}</select></Field>
          <Field label="开标日期"><input className="nc-input" type="date" defaultValue={resultOpen?.openDate} /></Field>
          {resultType === '中标' ? (
            <>
              <Field label="中标金额" req note="默认取投标金额，可改"><input className="nc-input" type="number" value={winAmt} onChange={(e) => setWinAmt(Number(e.target.value))} /></Field>
              <Field label="中标通知书" note="支持 PDF / 扫描件，≤20MB">
                <input className="nc-input" type="file" onChange={(e) => setWinNotice(e.target.files?.[0]?.name || '')} />
                {winNotice && (
                  <div className="nc-cell-sub" style={{ marginTop: 4 }}>
                    <Ico n="paperclip" size={13} /> 已选 <span className="nc-link" onClick={() => setNoticePreview(true)} role="link" tabIndex={0}>{winNotice}</span>
                    <span style={{ marginLeft: 6 }}>（点击文件名预览）</span>
                  </div>
                )}
              </Field>
            </>
          ) : (
            <>
              <Field label="结果口径" req note="供报表统计">
                <select className="nc-input" value={loseType} onChange={(e) => setLoseType(e.target.value)}>
                  {BID_RESULT_TYPES.map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="未中标原因" req>
                <select className="nc-input" value={loseReason} onChange={(e) => setLoseReason(e.target.value)}>
                  <option value="">请选择原因</option>
                  <option>报价高于对手</option><option>技术标得分低</option><option>资质/证书不符</option>
                  <option>业绩不足</option><option>客户关系因素</option><option>其他</option>
                </select>
              </Field>
              <Field label={loseType === '流标' ? '流标说明' : loseType === '废标' ? '废标说明' : '说明'} req span={2} note={`${loseText.length}/200 字`}>
                <textarea className="nc-input" rows={3} maxLength={200} value={loseText} onChange={(e) => setLoseText(e.target.value)}
                  placeholder={loseType === '流标' ? '如 三家投标均超最高限价，招标人流标（≤200 字）'
                    : loseType === '废标' ? '如 投标文件未按要求密封，被否决投标（≤200 字）'
                    : '补充说明（≤200 字）'} />
              </Field>
            </>
          )}
        </div>
      </Modal>

      {/* ================= 放弃投标（终态） ================= */}
      <Modal open={!!abandonOpen} onClose={() => setAbandonOpen(null)} width={480} title={`放弃投标 · ${abandonOpen?.id ?? ''}`}
        foot={<><Btn onClick={() => setAbandonOpen(null)}>取消</Btn><Btn danger onClick={doAbandon}>确认放弃</Btn></>}>
        <Banner tone="warn">
          放弃为<b>终态操作</b>，不可恢复。已交保证金将转「未退」并进入风险榜；占用的证书<b>立即释放</b>，可重新投入其他投标。
        </Banner>
        <div className="nc-form-grid" style={{ marginTop: 12 }}>
          <Field label="放弃原因" req span={2} note="用于投标复盘与资质策略调整">
            <select className="nc-input" value={abandonReason} onChange={(e) => setAbandonReason(e.target.value)}>
              <option value="">请选择原因</option>
              {BID_ABANDON_REASONS.map((r) => <option key={r}>{r}</option>)}
            </select>
          </Field>
          {abandonOpen && (
            <Field label="连带影响" span={2}>
              <span className="nc-cell-sub">
                释放证书 {abandonOpen.certGot} 本 ·
                {abandonOpen.depositSt === '已交'
                  ? ` 保证金 ¥${abandonOpen.deposit.toLocaleString('en-US')} 转「未退」`
                  : ` 保证金当前「${abandonOpen.depositSt}」，无待退款项`}
              </span>
            </Field>
          )}
        </div>
      </Modal>

      {/* ================= 保证金登记（缴纳方式） ================= */}
      <Modal open={!!depOpen} onClose={() => setDepOpen(null)} width={480} title={`保证金登记 · ${depOpen?.id ?? ''}`}
        foot={<><Btn onClick={() => setDepOpen(null)}>取消</Btn>
          <Btn kind="primary" onClick={() => {
            if (!(depAmt > 0)) { toast('请填写保证金金额', 'err'); return; }
            if (!depOpen) return;
            const to = depOpen.depositSt === '未交' ? '已交' : '已退';
            patchBid(depOpen.id, { depositSt: to as B['depositSt'], deposit: depAmt }, `保证金已登记为「${to}」：${fmt(depAmt)}（${depMethod}）`);
            setDepOpen(null);
          }}>确认登记</Btn></>}>
        <Banner tone="info">
          保证金<b>独立流转</b>，未交不可开标。
        </Banner>
        <div className="nc-form-grid" style={{ marginTop: 12 }}>
          <Field label="保证金金额" req>
            <input className="nc-input" type="number" value={depAmt || ''} onChange={(e) => setDepAmt(Number(e.target.value))} />
          </Field>
          <Field label="登记动作" req>
            <select className="nc-input" defaultValue={depOpen?.depositSt === '未交' ? '已交' : '已退'}>
              <option>已交</option><option>已退</option>
            </select>
          </Field>
          <Field label="缴纳方式" req note="银行转账 / 银行保函 / 保证保险">
            <select className="nc-input" value={depMethod} onChange={(e) => setDepMethod(e.target.value)}>
              {DEP_METHODS.map((m) => <option key={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="发生日期" req><input className="nc-input" type="date" defaultValue={TODAY} /></Field>
          <Field label="凭证编号" span={2} note="银行回单 / 保函编号 / 保单号"><input className="nc-input" placeholder="如 20260920-ICBC-008721" /></Field>
        </div>
      </Modal>

      {/* ================= 登记跟进（人工） ================= */}
      <Modal open={followOpen} onClose={() => setFollowOpen(false)} width={480} title="登记跟进 · 人工记录"
        foot={<><Btn onClick={() => setFollowOpen(false)}>取消</Btn>
          <Btn kind="primary" onClick={() => {
            if (!followText.trim()) { toast('请填写跟进内容', 'err'); return; }
            setFollowOpen(false); toast('跟进已登记 · 提交后不可改，错误走「更正」');
          }}>提交跟进</Btn></>}>
        <Banner tone="info">跟进记录为<b>人工登记</b>，与系统自动生成的「操作记录」分离；提交后不可修改。</Banner>
        <div className="nc-form-grid" style={{ marginTop: 12 }}>
          <Field label="跟进方式" req><select className="nc-input"><option>电话</option><option>现场踏勘</option><option>会议</option><option>微信/邮件</option></select></Field>
          <Field label="跟进日期" req><input className="nc-input" type="date" defaultValue={TODAY} /></Field>
          <Field label="跟进内容" req span={2} note={`${followText.length}/500 字`}>
            <textarea className="nc-input" rows={3} maxLength={500} value={followText} onChange={(e) => setFollowText(e.target.value)} placeholder="如 与招标代理确认资格预审需补充安许副本" />
          </Field>
        </div>
      </Modal>

      {/* ============ 移除证书引用（二次确认 + 原因必填） ============ */}
      <ConfirmModal
        open={!!unrefOpen} onClose={() => setUnrefOpen(null)} okText="确认移除"
        title="移除投标证书引用"
        reason reasonLabel="移除原因"
        impact={unrefOpen && <>将解除 <b>{cur.id} {cur.name}</b> 对证书 <b>{unrefOpen.name}</b>（{unrefOpen.id}）的引用。<br />移除后该投标的<b>证书数量将低于资格审查要求</b>，开标资格审查存在废标风险，名额释放后可被其他投标占用。</>}
        onOk={(r) => { toast(`已移除证书引用（${unrefOpen?.name}）并留痕，原因：${r}`); setUnrefOpen(null); }}
      />
    </>
  );
}
