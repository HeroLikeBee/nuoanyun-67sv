// 诺安云 6.0 · 消防产品身份标识（A / B 签）验真
// ------------------------------------------------------------------
// 一期解决「本企业账里有没有这批号段」，二期解决「站在第三方角度，能不能证明这樘产品是真的」。
// 这两件事不能混为一谈：账面有货只说明我们采录过，外部查不到备案就是根本性的否证。
// 所以这里同时做两路核对，各自只说一件事，避免互相顶替：
//   · 外部服务：生产厂家 / 型号 / 认证证书 / 施加依据（判定"物"本身的真伪）
//   · 本企业账：入库批次 → 领用 → 安装 / 报验的流向链（判定"账"能不能对上实物）
// 结论由 verdictOf 汇总，本组件不自创判定分支（不做第二套话术）。
import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Alert, Banner, Btn, Drawer, Field, KvGrid, Op, Tag, Timeline } from './ui';
import { Ico } from './icons';
import {
  ID_MARK_DIGITS, VERDICT_CN, fmtMark, idMarkVersion, lookupMarkLocal, outerVerify, subscribeIdMark,
  type MarkLocal, type MarkOuter, type MarkVerdict, verdictOf,
} from './data';

type Probe = { mark: string; local: MarkLocal; outer: MarkOuter; verdict: MarkVerdict };

export default function IdMarkVerify({ open, onClose, initMark = '' }: {
  open: boolean;
  onClose: () => void;
  /** 由物料详情的身份标识表带入的明码（点了某批号段的「验真」） */
  initMark?: string;
}) {
  /* 号段 / 流向账同源订阅：别处新增入库或回写流向，验真结果里的流向链同步刷新 */
  useSyncExternalStore(subscribeIdMark, idMarkVersion, idMarkVersion);
  const [mark, setMark] = useState(initMark);
  const [busy, setBusy] = useState(false);
  const [probe, setProbe] = useState<Probe | null>(null);
  const [hist, setHist] = useState<Probe[]>([]);
  /** 竞态保护：连续多次核对时，只有最后一次请求的结果允许落地 */
  const seq = useRef(0);

  /* 带入明码时（换了另一樘）自动跑一次，省一步点击 */
  useEffect(() => {
    if (!open) return;
    setMark(initMark);
    if (initMark) void run(initMark);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initMark]);

  async function run(m: string) {
    const raw = (m || '').replace(/\s+/g, '');
    if (!raw) return;
    const token = seq.current + 1;
    seq.current = token;
    setBusy(true);
    const local = lookupMarkLocal(raw);
    const outer = await outerVerify(raw);
    if (seq.current !== token) return;
    const p: Probe = { mark: raw, local, outer, verdict: verdictOf(local, outer) };
    setProbe(p);
    setHist((h) => [p, ...h.filter((x) => x.mark !== raw)].slice(0, 5));
    setBusy(false);
  }

  return (
    <Drawer open={open} title="身份标识验真" width={640} onClose={onClose}
      sub="A / B 签明码 → 外部备案服务核对 + 本企业流向回查"
      foot={<Btn onClick={onClose}>关闭</Btn>}>
      <div className="nc-cell-sub" style={{ marginBottom: 10 }}>
        明码为 {ID_MARK_DIGITS} 位数字（前 8 位厂家备案号段 + 后 6 位产品流水）；
        可从物料详情的身份标识表点某批号段的「验真」直接带入，也可手工录入或由扫码枪读入。
      </div>

      <div className="nc-form-grid">
        <Field label="身份标识明码" req span={4}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input className="nc-input num" style={{ flex: 1, letterSpacing: 1 }} autoFocus
              value={mark} onChange={(e) => setMark(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void run(mark); }}
              placeholder={`${ID_MARK_DIGITS} 位数字，如 50727825000001`} />
            <Btn kind="primary" disabled={busy || !mark.trim()} onClick={() => void run(mark)}>
              <Ico n="search" size={16} /> {busy ? '核对中…' : '验真'}
            </Btn>
          </div>
        </Field>
      </div>

      {busy && <Banner tone="info">正在向外部备案服务取回记录 —— 认证备案不在本企业系统内，须实时查询。</Banner>}

      {probe && !busy && (() => {
        const { local, outer, verdict } = probe;
        const V = VERDICT_CN[verdict];
        return (
          <div style={{ marginTop: 12 }}>
            <Alert tone={verdict === 'ok' ? undefined : verdict === 'warn' ? 'warn' : 'danger'}
              icon={<Ico n={verdict === 'ok' ? 'check' : 'warning'} size={16} />}
              title={<><span className="num">{fmtMark(probe.mark)}</span> <Tag tone={V.tone}>{V.tag}</Tag></>}
              sub={outer.ok ? V.line : (outer.reason || V.line)} />

            <div className="nc-form-grid" style={{ marginTop: 10 }}>
              <Field label="外部备案服务返回（判定依据在这份记录里，不在本企业账）" span={4}>
                {outer.ok ? (
                  <KvGrid cols={2} rows={[
                    { k: '备案生产厂', v: outer.maker },
                    { k: '型号规格', v: outer.model },
                    { k: '认证证书编号', v: <span className="num">{outer.certNo}</span> },
                    {
                      k: '证书有效期',
                      v: outer.certTo === '—'
                        ? <span className="nc-muted">长期有效</span>
                        : <span className={outer.expired ? 'nc-v-red' : ''}>
                          <span className="num">{outer.certTo}</span>{outer.expired ? ' 已失效' : ''}
                        </span>,
                    },
                    { k: '强制目录施加依据', v: outer.law },
                    { k: '厂家备案号段', v: <span className="num">{probe.mark.slice(0, 8)}</span> },
                  ]} />
                ) : (
                  <div className="nc-muted nc-tiny">未取得备案记录。</div>
                )}
              </Field>

              <Field label="本企业流向回查（账能不能对上这樘实物）" span={4}>
                {local.range ? (
                  <Timeline items={[
                    {
                      date: local.range.date, tone: 'ok',
                      text: <>
                        入库采录 <b className="num">{fmtMark(local.range.from)} ~ {fmtMark(local.range.to)}</b>
                        ｜批次 <b className="num">{local.range.batch}</b>｜{local.range.wh}
                        {local.range.po ? `｜来源 ${local.range.po}` : ''}｜经办 {local.range.by}
                      </>,
                    },
                    ...(local.flow ? [{
                      date: local.flow.date,
                      tone: local.flow.status === '已报验' ? 'ok' as const : 'gold' as const,
                      text: <>
                        流向 <b>{local.flow.proj}</b> · {local.flow.part}
                        ｜<b className="num">{local.flow.qty}</b>{local.item?.unit ?? '件'}
                        ｜经办 {local.flow.by}
                        ｜<Tag tone={local.flow.status === '已报验' ? 'green' : local.flow.status === '已安装' ? 'blue' : 'orange'}>{local.flow.status}</Tag>
                      </>,
                    }] : []),
                  ]} />
                ) : (
                  <div className="nc-warnbox is-info">
                    <b>本企业无该明码的采购入库记录</b>
                    <div>
                      {outer.ok
                        ? '备案有效却查不到本企业入库，可能是串货（其他单位的货流到本项目）或尚未采录 —— 不得据此认定为本批次正品。'
                        : '外部亦无备案记录，请核对是否为伪造标识。'}
                    </div>
                  </div>
                )}
              </Field>
            </div>
          </div>
        );
      })()}

      {hist.length > 1 && (
        <div className="nc-form-grid" style={{ marginTop: 10 }}>
          <Field label="本次连续核对记录" span={4}>
            <table className="nc-tbl" style={{ minWidth: 520 }}>
              <thead><tr><th style={{ width: 190 }}>明码</th><th style={{ width: 96 }}>结论</th><th>型号</th></tr></thead>
              <tbody>
                {hist.map((h) => (
                  <tr key={h.mark}>
                    <td><Op onClick={() => { setMark(h.mark); void run(h.mark); }}><span className="num">{fmtMark(h.mark)}</span></Op></td>
                    <td><Tag tone={VERDICT_CN[h.verdict].tone}>{VERDICT_CN[h.verdict].tag}</Tag></td>
                    <td className="nc-tiny">{h.outer.ok ? h.outer.model : <span className="nc-v-red">无备案记录</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Field>
        </div>
      )}
    </Drawer>
  );
}
