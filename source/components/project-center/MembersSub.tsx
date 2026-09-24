// 项目详情 · 团队与干系人子页
//
// 回答「谁在干、证书够不够、外部各环节对接谁」。
// 我方团队 + 成员持证（证书占用）+ 外部干系人（建设 / 监理 / 检测 / 监管 / 供应商分包）。
// 节点准入档案已并入「进度履约」（资料挂在节点上）；本页只管人与组织。
//
// ⚠️ 数据全部经 PjCtx（buildPjDemo 按本项目派生），不持有跨项目常量。
import React, { useMemo, useState } from 'react';
import { Banner, Btn, Card, Code, EntityLink, Tag, Tip } from '../ui';
import { Ico } from '../icons';
import { TODAY } from '../data';
import { PjSection } from './PjSection';
import type { PjCtx } from './ctx';

/** 我方团队：有项目团队用项目团队，缺省给通用班组 */
function Team({ C }: { C: PjCtx }) {
  const rows = useMemo(() => {
    return C.teamRows.map((m) => {
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
  }, [C.teamRows]);
  return (
    <PjSection
      title={<><Ico n="user" size={16} /> 项目团队</>}
      extra={<>
        <span className="nc-cell-sub">{rows.length} 人 · 项目经理 {C.P.pm}</span>
        <Btn size="sm" onClick={() => C.openM('team')}>调整团队</Btn>
        <Btn size="sm" onClick={() => C.go('attendance')}>查看考勤</Btn>
      </>}
    >
      {rows.length === 0
        ? <div className="nc-empty">本项目尚未组建团队。</div>
        : (
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
        )}
      <div className="nc-cell-sub" style={{ marginTop: 8 }}>
        出勤与人工费取自移动端报工记录（本平台只读消费）。
      </div>
    </PjSection>
  );
}

/** 证书占用：本项目在用的证书，显示有效期与到期风险（已过期 / 项目周期内到期） */
function Certs({ C }: { C: PjCtx }) {
  const rows = C.certRows.map((c) => {
    const id = String(c.certId ?? c.id ?? '');
    const to = C.certValidTo(id);
    const expired = to !== '—' && to <= TODAY;
    const soon = to !== '—' && !expired && to <= C.P.end;
    return { id, to, expired, soon, name: String((c as { certName?: string }).certName ?? c.name ?? '—'), holder: String((c as { holder?: string }).holder ?? '—') };
  });
  const expired = rows.filter((r) => r.expired);
  const soon = rows.filter((r) => r.soon);
  return (
    <PjSection
      title={<><Ico n="shield" size={16} /> 证书占用</>}
      extra={<>
        <span className="nc-cell-sub">{rows.length} 项在占{expired.length ? ` · 已过期 ${expired.length} 项` : ''}{soon.length ? ` · 项目周期内到期 ${soon.length} 项` : ''}</span>
        <Tip w={400} text="证书是独立实体，通过占用记录与项目关联；项目周期内到期的证书须提前续期，否则影响节点准入与验收签字。" />
        <Btn size="sm" onClick={() => C.go('cert')}>证书台账</Btn>
      </>}
    >
      {rows.length === 0 && <div className="nc-empty-mini">本项目暂未占用证书</div>}
      {rows.length > 0 && (
        <table className="nc-tbl" style={{ minWidth: 760 }}>
          <thead><tr>
            <th style={{ width: 130 }}>证书号</th><th>证书名称</th>
            <th style={{ width: 110 }}>持证人</th><th style={{ width: 120 }}>有效期至</th>
            <th style={{ width: 110 }}>占用状态</th><th style={{ width: 140 }}>到期风险</th>
          </tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={r.expired || r.soon ? 'is-warn-row' : ''}>
                <td><EntityLink target="cert" id={r.id} go={C.go} title="下钻到证书管理"><Code>{r.id}</Code></EntityLink></td>
                <td><b>{r.name}</b></td>
                <td>{r.holder}</td>
                <td className="num">{r.to}</td>
                <td><Tag tone="blue">本项目在用</Tag></td>
                <td>
                  {r.expired ? <Tag tone="red">已过期</Tag>
                    : r.soon ? <Tag tone="orange">项目周期内到期</Tag>
                      : <Tag tone="green">无风险</Tag>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </PjSection>
  );
}

/** 外部干系人（由 buildPjDemo 按本项目派生）：建设 / 监理 / 检测 / 监管 / 供应商分包 */
function Parties({ C }: { C: PjCtx }) {
  if (C.parties.length === 0) {
    return (
      <PjSection title={<><Ico n="user" size={16} /> 外部干系人</>}>
        <div className="nc-empty">本项目暂无外部干系人记录。</div>
      </PjSection>
    );
  }
  return (
    <PjSection
      title={<><Ico n="user" size={16} /> 外部干系人</>}
      extra={<span className="nc-cell-sub">{C.parties.map((g) => g.g).join(' / ')} · 对接人与联系方式</span>}
    >
      <div className="nc-2col">
        {C.parties.map((g) => (
          <Card key={g.key} hd={<span><Tag tone={g.tone}>{g.g}</Tag> <span className="nc-cell-sub">{g.rows.length} 人</span></span>}>
            <table className="nc-tbl">
              <thead><tr>
                <th style={{ width: 90 }}>姓名</th><th style={{ width: 140 }}>角色</th>
                <th>单位</th><th style={{ width: 120 }}>联系电话</th><th style={{ width: 90 }}>状态</th>
              </tr></thead>
              <tbody>
                {g.rows.map((r, i) => (
                  <tr key={`${r.name}-${r.role}-${i}`}>
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

export default function MembersSub({ C }: { C: PjCtx }) {
  const rows = C.certRows.map((c) => {
    const id = String(c.certId ?? c.id ?? '');
    const to = C.certValidTo(id);
    return { expired: to !== '—' && to <= TODAY, soon: to !== '—' && to > TODAY && to <= C.P.end };
  });
  const expired = rows.filter((r) => r.expired);
  const soon = rows.filter((r) => r.soon);
  return (
    <>
      {(expired.length > 0 || soon.length > 0) && (
        <Banner tone={expired.length > 0 ? 'danger' : 'warn'} actions={<Btn size="sm" onClick={() => C.go('cert')}>去续期</Btn>}>
          {expired.length > 0
            ? `本项目占用证书中有 ${expired.length} 项已过期 —— 须立即续期，否则影响节点签字与验收受理。`
            : `本项目占用证书中有 ${soon.length} 项将在项目周期内（${C.P.end} 前）到期 —— 请提前续期。`}
        </Banner>
      )}
      <Team C={C} />
      <Certs C={C} />
      <Parties C={C} />
    </>
  );
}
