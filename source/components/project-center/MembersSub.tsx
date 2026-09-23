// 项目详情 · 团队资料子页
//
// 回答「谁在干、证书够不够、资料齐不齐」。
// 关键闭环：节点准入清单 —— 每个里程碑节点需要哪些资料、缺哪份、谁签认，缺件硬拦截。
// 无项目团队数据时展示通用班组，避免整域空白（与团队接口打通前的兜底展示）。
import React, { useMemo, useState } from 'react';
import { Banner, Btn, Card, Code, EntityLink, Tag, Tip } from '../ui';
import { Ico } from '../icons';
import { ATT_WORKERS, TODAY, MILESTONE_LEGAL, teamOfProject, attDays, attCost, laborRate } from '../data';
import { PjSection } from './PjSection';
import type { PjCtx } from './ctx';

/** 外部相关方：建设单位 / 监理 / 检测机构 / 备案监管 / 供应商分包 */
const PARTIES: { key: string; g: string; tone: 'blue' | 'green' | 'orange' | 'purple'; rows: { name: string; role: string; org: string; phone: string; st: string }[] }[] = [
  {
    key: 'owner', g: '建设单位', tone: 'green',
    rows: [{ name: '刘经理', role: '项目对接人', org: '昆明万达广场商业管理有限公司', phone: '138****6601', st: '合作中' }],
  },
  {
    key: 'sup', g: '监理单位', tone: 'orange',
    rows: [{ name: '何监理', role: '总监理工程师', org: '云南××工程监理有限公司', phone: '139****7702', st: '合作中' }],
  },
  {
    key: 'test', g: '第三方检测机构', tone: 'purple',
    rows: [{ name: '杨工', role: '检测项目负责人', org: '云南××消防检测有限公司', phone: '137****5503', st: '合作中' }],
  },
  {
    key: 'gov', g: '消防备案 / 监管', tone: 'blue',
    rows: [{ name: '李工', role: '消防备案对接人', org: '昆明市西山区消防救援大队', phone: '0871-6****119', st: '合作中' }],
  },
  {
    key: 'vendor', g: '供应商 / 分包', tone: 'purple',
    rows: [
      { name: '刘经理', role: '供货负责人', org: '云南××消防设备有限公司', phone: '138****3301', st: '合作中' },
      { name: '张经理', role: '劳务负责人', org: '昆明××建筑劳务有限公司', phone: '138****4402', st: '合作中' },
    ],
  },
];

/** 我方团队：有项目团队用项目团队，缺省给通用班组，保证 Tab 不空 */
function Team({ C }: { C: PjCtx }) {
  /** 归一为同一行结构：项目团队与兜底班组字段不同名，先在此收敛，表格只认一种形状 */
  const rows = useMemo(() => {
    const src = C.teamRows.length ? C.teamRows : teamOfProject(C.P.id, C.P.pm);
    return src.map((m) => {
      const o = m as unknown as Record<string, string | undefined>;
      return {
        name: m.name,
        role: o.role ?? m.role ?? '—',
        trade: o.trade ?? m.role ?? '—',
        org: o.org ?? o.team ?? '本公司',
        phone: o.phone ?? '—',
        cert: o.cert ?? '',
        st: o.st ?? '在场',
      };
    });
  }, [C.P.id, C.P.pm, C.teamRows]);
  return (
    <PjSection
      title={<><Ico n="user" size={16} /> 项目团队</>}
      extra={<>
        <span className="nc-cell-sub">{rows.length} 人 · 项目经理 {C.P.pm}</span>
        <Btn size="sm" onClick={() => C.openM('team')}>调整团队</Btn>
        <Btn size="sm" onClick={() => C.go('attendance')}>查看考勤</Btn>
      </>}
    >
      <div className="nc-card-bd" style={{ padding: 0 }}>
        <table className="nc-tbl" style={{ minWidth: 860 }}>
          <thead><tr>
            <th>姓名</th><th style={{ width: 120 }}>岗位 / 工种</th><th style={{ width: 160 }}>所属单位 / 班组</th>
            <th style={{ width: 140 }}>联系电话</th><th style={{ width: 120 }}>持证情况</th>
            <th style={{ width: 110 }}>在场状态</th><th style={{ width: 100 }}>操作</th>
          </tr></thead>
          <tbody>
            {rows.map((m, i) => (
              <tr key={`${m.name}-${i}`}>
                <td><b>{m.name}</b>{m.name === C.P.pm && <Tag tone="blue">项目经理</Tag>}</td>
                <td>{m.role !== '—' ? m.role : m.trade}</td>
                <td className="nc-cell-sub">{m.org}</td>
                <td className="num">{m.phone}</td>
                <td>
                  {m.cert
                    ? <Tag tone="green">{m.cert}</Tag>
                    : <Tag tone="gray">无强制持证要求</Tag>}
                </td>
                <td><Tag tone={m.st === '已离场' ? 'gray' : 'green'}>{m.st}</Tag></td>
                <td>
                  <Btn size="sm" onClick={() => C.openM('team')}>离场</Btn>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="nc-cell-sub" style={{ marginTop: 8 }}>
        本项目在册人员共 {ATT_WORKERS.filter((w) => w.proj === C.P.id).length || rows.length} 人；出勤与人工费取自移动端报工记录（本平台只读消费）。
      </div>
    </PjSection>
  );
}

/** 证书占用：本项目在用的证书，显示有效期与到期风险 */
function Certs({ C }: { C: PjCtx }) {
  const soon = C.certRows.filter((c) => {
    const d = C.certValidTo(String(c.certId ?? c.id ?? ''));
    return d !== '—' && d <= '2027-03-31';
  });
  return (
    <PjSection
      title={<><Ico n="shield" size={16} /> 证书占用</>}
      extra={<>
        <span className="nc-cell-sub">{C.certRows.length} 项在占 · 项目周期内到期 {soon.length} 项</span>
        <Tip w={400} text="证书是独立实体，通过占用记录与项目关联；项目周期内到期的证书须提前续期，否则影响节点准入与验收签字。" />
        <Btn size="sm" onClick={() => C.go('cert')}>证书台账</Btn>
      </>}
    >
      {C.certRows.length === 0 && <div className="nc-empty-mini">本项目暂未占用证书</div>}
      {C.certRows.length > 0 && (
        <table className="nc-tbl" style={{ minWidth: 760 }}>
          <thead><tr>
            <th style={{ width: 130 }}>证书号</th><th>证书名称</th>
            <th style={{ width: 110 }}>持证人</th><th style={{ width: 120 }}>有效期至</th>
            <th style={{ width: 110 }}>占用状态</th><th style={{ width: 140 }}>到期风险</th>
          </tr></thead>
          <tbody>
            {C.certRows.map((c, i) => {
              const id = String(c.certId ?? c.id ?? '');
              const to = C.certValidTo(id);
              const risk = to !== '—' && to <= '2027-03-31';
              return (
                <tr key={id + i} className={risk ? 'is-warn-row' : ''}>
                  <td><EntityLink target="cert" id={id} go={C.go} title="下钻到证书管理"><Code>{id}</Code></EntityLink></td>
                  <td><b>{String((c as { certName?: string }).certName ?? c.name ?? '—')}</b></td>
                  <td>{String((c as { holder?: string }).holder ?? '—')}</td>
                  <td className="num">{to}</td>
                  <td><Tag tone="blue">本项目在用</Tag></td>
                  <td>{risk ? <Tag tone="orange">项目周期内到期</Tag> : <Tag tone="green">无风险</Tag>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </PjSection>
  );
}

/** 外部相关方 */
function Parties({ C }: { C: PjCtx }) {
  return (
    <PjSection
      title={<><Ico n="user" size={16} /> 外部相关方</>}
      extra={<span className="nc-cell-sub">建设单位 / 监理 / 检测 / 备案 / 供应商分包 · 对接人与联系方式</span>}
    >
      <div className="nc-2col">
        {PARTIES.map((g) => (
          <Card key={g.key} hd={<span><Tag tone={g.tone}>{g.g}</Tag> <span className="nc-cell-sub">{g.rows.length} 人</span></span>}>
            <table className="nc-tbl">
              <thead><tr>
                <th style={{ width: 90 }}>姓名</th><th style={{ width: 140 }}>角色</th>
                <th>单位</th><th style={{ width: 120 }}>联系电话</th><th style={{ width: 90 }}>状态</th>
              </tr></thead>
              <tbody>
                {g.rows.map((r) => (
                  <tr key={r.name + r.role}>
                    <td><b>{r.name}</b></td>
                    <td>{r.role}</td>
                    <td className="nc-cell-sub">{r.org}</td>
                    <td className="num">{r.phone}</td>
                    <td><Tag tone="green">{r.st}</Tag></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ))}
      </div>
    </PjSection>
  );
}

/** 节点准入与资料齐备性：每个里程碑节点需要哪些资料、缺哪份、谁签认 —— 缺件硬拦截 */
function GateAndFiles({ C }: { C: PjCtx }) {
  const [open, setOpen] = useState<string | null>(C.curMile?.name.slice(0, 2) ?? null);
  return (
    <PjSection
      title={<><Ico n="paperclip" size={16} /> 节点准入与档案</>}
      extra={<>
        <span className="nc-cell-sub">{C.attach.length} 组 · 已归档 {C.attCnt} 份</span>
        <Tip w={440} text="节点准入清单由里程碑模板带出：每个节点有必传资料项，缺件时节点无法确认（硬拦截），不允许「先确认后补件」。法定节点（隐蔽验收 / 第三方检测 / 消防验收备案）另有删除二次确认。" />
        <Btn size="sm" kind="primary" onClick={() => C.openM('upload')}>＋ 上传档案</Btn>
      </>}
    >
      {C.curMiss.length > 0 && (
        <div className="nc-gate-block">
          <Ico n="warning" size={14} />
          当前节点「{C.curMile?.name}」还缺 {C.curMiss.length} 项必传资料（{C.curMiss.join('、')}）—— 「确认里程碑」按钮在补齐前不可提交。
        </div>
      )}
      <div className="nc-gate" style={{ marginTop: 10 }}>
        {C.attach.map((g) => {
          const mileKey = g.mile.slice(0, 2);
          const isCur = C.curMile?.name.startsWith(mileKey);
          const miss = g.req.filter((r) => !g.files.some((f) => f.name.includes(r.slice(0, 4))));
          const isOpen = open === mileKey;
          return (
            <div key={g.mile}>
              <div className="nc-gate-row" style={{ background: isCur ? 'var(--c-primary-bg)' : undefined }}>
                <span className="nc-gate-n">
                  <button
                    className="nc-id-cell is-link" style={{ font: 'inherit', color: 'inherit' }}
                    onClick={() => setOpen(isOpen ? null : mileKey)}
                  >
                    {isOpen ? '▾ ' : '▸ '}<b>{g.mile}</b>
                  </button>
                  {isCur && <Tag tone="blue">当前节点</Tag>}
                  {MILESTONE_LEGAL.includes(g.mile.replace(/^M\d+\s*/, '').split('（')[0]) && <Tag tone="gray">法定</Tag>}
                  {g.req.length === 0 && <span className="nc-cell-sub">无必传项</span>}
                  {g.req.length > 0 && miss.length === 0 && <Tag tone="green">必传项齐备</Tag>}
                  {miss.length > 0 && <Tag tone={g.reached ? 'red' : 'gray'}>{g.reached ? `已到节点仍缺 ${miss.length} 项` : `缺 ${miss.length} 项（未到节点）`}</Tag>}
                  <div className="nc-cell-sub">
                    必传：{g.req.length ? g.req.join(' / ') : '—'}　已归档 {g.files.length} 份
                    {miss.length > 0 && `　缺：${miss.join(' / ')}`}
                  </div>
                </span>
                <span className="nc-gate-s"><Btn size="sm" onClick={() => C.openM('upload')}>上传</Btn></span>
              </div>
              {isOpen && (
                <div style={{ padding: '4px 12px 10px 24px' }}>
                  {g.files.length === 0 && <div className="nc-empty-mini">该节点暂无归档文件</div>}
                  {g.files.map((f) => (
                    <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', fontSize: 13 }}>
                      <Ico n="paperclip" size={14} />
                      <span style={{ flex: 1, minWidth: 0 }}>{f.name}</span>
                      <span className="nc-cell-sub">{f.size}</span>
                      <span className="nc-cell-sub">{f.by}</span>
                      <span className="nc-cell-sub num">{f.date}</span>
                      <Btn size="sm" onClick={() => C.toast(`「${f.name}」已下载（演示）`)}>下载</Btn>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PjSection>
  );
}

export default function MembersSub({ C }: { C: PjCtx }) {
  const soon = C.certRows.filter((c) => C.certValidTo(String(c.certId ?? c.id ?? '')) <= '2027-03-31');
  return (
    <>
      {soon.length > 0 && (
        <Banner tone="warn" actions={<Btn size="sm" onClick={() => C.go('cert')}>去续期</Btn>}>
          本项目占用证书中有 {soon.length} 项将在项目周期内（2027-03-31 前）到期 —— 到期将影响节点签字与验收受理，请提前续期。
        </Banner>
      )}
      <Team C={C} />
      <Certs C={C} />
      <GateAndFiles C={C} />
      <Parties C={C} />
      <div className="nc-cell-sub" style={{ paddingBottom: 4 }}>
        档案齐备性最后核对时间：{TODAY} —— 已归档 {C.attCnt} 份，其中含影像资料与签字件。
      </div>
    </>
  );
}
