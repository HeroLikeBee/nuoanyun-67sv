// 项目详情 · 项目文档（④ docs，11/13-Tab 统一骨架）
//
// 文档镜像视角：全部归档文件的平铺清单 + 按归属节点筛选 + 下载；
// 「齐不齐」的准入口径在「项目进度 · 节点准入与档案」，本页只做文档检索与盘点，不重复缺件拦截。
// ⚠️ 数据经 PjCtx（buildPjDemo 按本项目派生），不持有跨项目常量。
import React, { useMemo, useState } from 'react';
import { Btn, Tag, Tip } from '../ui';
import { Ico } from '../icons';
import { PjSection } from './PjSection';
import type { PjCtx } from './ctx';

export default function DocsSub({ C }: { C: PjCtx }) {
  const [mile, setMile] = useState('全部');
  const miles = useMemo(() => C.attach.map((g) => g.mile), [C.attach]);
  const groups = mile === '全部' ? C.attach : C.attach.filter((g) => g.mile === mile);
  const files = groups.flatMap((g) => g.files.map((f) => ({ ...f, mile: g.mile })));

  return (
    <PjSection
      title={<>项目文档</>}
      extra={<>
        <span className="nc-cell-sub">已归档 {C.attCnt} 份 · {C.attach.length} 个节点</span>
        <Tip w={420} text="本页是项目全部档案的镜像清单（按节点归组）；资料齐套与节点确认的硬拦截在「项目进度 · 节点准入与档案」，上传入口两处一致。" />
        <Btn size="sm" kind="primary" onClick={() => C.openM('upload')}>＋ 上传档案</Btn>
      </>}
    >
      {miles.length > 1 && (
        <div className="nc-subtabs">
          <button className={`nc-subtab${mile === '全部' ? ' is-on' : ''}`} onClick={() => setMile('全部')}>全部</button>
          {miles.map((m) => (
            <button key={m} className={`nc-subtab${mile === m ? ' is-on' : ''}`} onClick={() => setMile(m)}>{m}</button>
          ))}
        </div>
      )}
      {files.length === 0
        ? <div className="nc-empty">{mile === '全部' ? '本项目暂无归档文件。' : '该节点暂无归档文件。'}</div>
        : (
          <table className="nc-tbl" style={{ minWidth: 860 }}>
            <thead><tr>
              <th>文件名</th>
              <th style={{ width: 190 }}>归属节点</th>
              <th style={{ width: 100 }} className="is-num">大小</th>
              <th style={{ width: 100 }}>上传人</th>
              <th style={{ width: 110 }} className="is-num">归档日期</th>
              <th style={{ width: 90 }}>操作</th>
            </tr></thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.mile + f.name}>
                  <td>
                    <Ico n="paperclip" size={14} /> {f.name}
                    {f.name.includes('B 签') && <> <Tag tone="gray">身份标识</Tag></>}
                  </td>
                  <td className="nc-cell-sub">{f.mile}</td>
                  <td className="is-num num">{f.size}</td>
                  <td>{f.by}</td>
                  <td className="is-num num">{f.date}</td>
                  <td><Btn size="sm" onClick={() => C.toast(`「${f.name}」已下载（演示）`)}>下载</Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      <div className="nc-cell-sub" style={{ marginTop: 8 }}>
        验收报验所需的 B 签清单、检测报告、备案凭证等法定资料由各业务环节自动归档到对应节点。
      </div>
    </PjSection>
  );
}
