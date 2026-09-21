// 诺安云 6.0 · 设备管理（本期占位）· PRD §17
import React from 'react';
import { Btn, Card, DataTable, PageHead, Tag, type Col } from '../components/ui';
import { DEVICES } from '../components/data';

type Dev = (typeof DEVICES)[number];

export default function DevicePage({ go, role }: { go: (p: string) => void; role: string }) {
  const cols: Col<Dev>[] = [
    { key: 'id', title: '设备编号', width: 120, render: (d) => <span className="num">{d.id}</span> },
    { key: 'name', title: '设备名称', render: (d) => <><div>{d.name}</div><div className="nc-tiny nc-muted">规格：{d.spec}</div></> },
    { key: 'cat', title: '分类', width: 100, render: (d) => <Tag tone="blue">{d.cat}</Tag> },
    { key: 'qty', title: '数量', width: 90, align: 'right', render: (d) => <span className="num">{d.qty} {d.unit}</span> },
    { key: 'status', title: '权属状态', width: 100, render: (d) => <Tag tone={d.status === '自有' ? 'green' : 'orange'}>{d.status}</Tag> },
    { key: 'location', title: '当前所在', width: 160 },
    { key: 'keeper', title: '保管人', width: 90 },
    { key: 'checkDate', title: '最近检查', width: 110, render: (d) => <span className="num">{d.checkDate}</span> },
  ];

  return (
    <>
      <PageHead
        crumbs={['供应链', '设备管理']}
        title="设备管理"
        actions={<Btn kind="primary" disabled title="本期仅占位，功能待后续版本开放">+ 新增设备</Btn>}
      />

      <Card hd="设备台账（只读预览）" extra={<span className="nc-muted">数据来源：现有台账同步 · 不可编辑</span>} flush>
        <DataTable cols={cols} rows={DEVICES as unknown as Dev[]} rowKey={(d) => d.id} minWidth={1040} />
      </Card>

      <Card hd="后续版本规划">
        <table className="nc-tbl" style={{ minWidth: 760 }}>
          <thead><tr><th style={{ width: 60 }}>序</th><th style={{ width: 200 }}>能力</th><th>说明</th><th style={{ width: 100 }}>状态</th></tr></thead>
          <tbody>
            {[
              { n: '设备台账与权属管理', d: '自有 / 外租 / 借入三类权属，含进出场登记', s: '待开放' },
              { n: '外租计费与结算', d: '按台班 / 天 / 月计费，自动关联采购合同与付款申请', s: '待开放' },
              { n: '安全检查与维保记录', d: '定期检查、特种设备年检提醒、失效锁定', s: '待开放' },
              { n: '设备与项目关联', d: '项目占用设备一览，退场后释放', s: '待开放' },
              { n: '检测仪器校准管理', d: '校准有效期提醒，过期仪器不可出具报告', s: '待开放' },
            ].map((r, i) => (
              <tr key={r.n}><td className="num">{i + 1}</td><td><b>{r.n}</b></td><td className="nc-tiny">{r.d}</td><td><Tag tone="gray">{r.s}</Tag></td></tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
