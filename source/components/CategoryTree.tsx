// 诺安云 6.0 · 多级分类树维护组件（主数据共用）
// 依据参考「主数据管理.html」TREE 模型 + 规范.md §5.4：
//   · 两棵根树（产品目录 / 材料目录），支持任意层级嵌套
//   · ＋新增子分类 / 重命名 / 删除（有子级或被引用禁删，留痕）
//   · 同级重名校验、树上计数（含后代）、点击=过滤、搜索分类
import React, { useMemo, useState } from 'react';
import { Btn, Field, Modal, useToast, pressProps} from './ui';
import { Ico } from './icons';
import { CAT_TREE, newCatId, type CatNode } from './data';

export type CatRootKey = 'prod' | 'mat';

type Props = {
  /** 当前选中分类 ID（'' = 全部） */
  value: string;
  onChange: (id: string) => void;
  /** 分类下的条目计数（按分类 ID 统计，含后代由组件内部汇总） */
  countOf: (id: string) => number;
  /** 被引用分类 ID 集合 —— 在这些分类上有数据时禁止删除 */
  usedIds: string[];
  /** 允许维护（增改删）；false 时只读浏览 */
  editable?: boolean;
  /** 只显示某一棵根树（不传 = 两棵都显示） */
  rootFilter?: CatRootKey;
};

/** 深度优先遍历（先序） */
function walk(node: CatNode, depth: number, fn: (n: CatNode, d: number, parent: CatNode | null) => void, parent: CatNode | null = null) {
  fn(node, depth, parent);
  (node.ch || []).forEach((c) => walk(c, depth + 1, fn, node));
}

/** 收集所有节点（用于重名校验） */
function allNodes(): CatNode[] {
  const out: CatNode[] = [];
  Object.values(CAT_TREE).forEach((r) => walk(r, 0, (n) => out.push(n)));
  return out;
}

export default function CategoryTree({ value, onChange, countOf, usedIds, editable = true, rootFilter }: Props) {
  const toast = useToast();
  /* 本地可写副本：让新增 / 重命名 / 删除即时可见（原型级，不落库） */
  const [tree, setTree] = useState<Record<CatRootKey, CatNode>>(() => JSON.parse(JSON.stringify(CAT_TREE)));
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ prod: true, mat: true, p11: true, p12: true, m1: true, m2: true });
  const [q, setQ] = useState('');
  const [modal, setModal] = useState<{ mode: 'add' | 'edit'; root: CatRootKey; parent: CatNode | null; edit: CatNode | null } | null>(null);
  const [delTarget, setDelTarget] = useState<{ root: CatRootKey; node: CatNode } | null>(null);
  const [name, setName] = useState('');
  const [owner, setOwner] = useState('');
  const [err, setErr] = useState('');

  const roots: CatRootKey[] = rootFilter ? [rootFilter] : ['prod', 'mat'];
  const flat = useMemo(() => {
    const out: { n: CatNode; d: number; root: CatRootKey; parent: CatNode | null }[] = [];
    roots.forEach((k) => walk(tree[k], 0, (n, d, p) => out.push({ n, d, root: k, parent: p })));
    return out;
  }, [tree, roots.join(',')]);

  /** 子树 ID 集合（含自身） */
  const subIds = (n: CatNode) => {
    const out: string[] = [];
    walk(n, 0, (x) => out.push(x.id));
    return out;
  };
  /** 计数：自身 + 后代 */
  const cntOf = (n: CatNode) => subIds(n).reduce((s, id) => s + countOf(id), 0);

  const visible = (n: CatNode) => !q || flat.some((f) => f.n.id === n.id && f.n.n.includes(q)) || subIds(n).some((id) => flat.find((f) => f.n.id === id)?.n.n.includes(q));

  const openAdd = (root: CatRootKey, parent: CatNode | null) => {
    setModal({ mode: 'add', root, parent, edit: null }); setName(''); setOwner(''); setErr('');
  };
  const openEdit = (root: CatRootKey, node: CatNode) => {
    setModal({ mode: 'edit', root, parent: null, edit: node }); setName(node.n); setOwner(node.owner || ''); setErr('');
  };

  const submit = () => {
    if (!modal) return;
    const nm = name.trim();
    if (!nm) { setErr('分类名称必填'); return; }
    /* 同级重名校验 */
    const siblings = modal.mode === 'add' ? (modal.parent ? modal.parent.ch || [] : [tree[modal.root]]) : ((() => {
      const rs = flat.find((f) => f.n.id === modal.edit!.id);
      const p = rs?.parent;
      return p ? (p.ch || []) : [tree[modal.root]];
    })());
    if (siblings.some((x) => x.n === nm && x.id !== modal.edit?.id)) { setErr(`同级已存在分类「${nm}」，请改名`); return; }
    /* 全局重名校验（跨树提示，避免"消防水"在产品与材料下重名混淆） */
    if (modal.mode === 'add' && allNodes().some((x) => x.n === nm && x.id !== modal.parent?.id)) {
      const dup = flat.find((f) => f.n.n === nm);
      if (dup) toast(`提示：其它层级已存在「${nm}」，原型允许重名但建议区分`, 'err');
    }

    setTree((t) => {
      const nt = JSON.parse(JSON.stringify(t)) as Record<CatRootKey, CatNode>;
      if (modal.mode === 'add') {
        const id = newCatId(modal.root);
        const node: CatNode = { id, n: nm, owner: owner.trim() || undefined };
        if (modal.parent) {
          const target = findIn(nt[modal.root], modal.parent.id);
          if (target) { target.ch = target.ch || []; target.ch.push(node); }
        } else { nt[modal.root] = node; }
      } else {
        const target = findIn(nt[modal.root], modal.edit!.id);
        if (target) { target.n = nm; target.owner = owner.trim() || undefined; }
      }
      return nt;
    });
    toast(modal.mode === 'add' ? `已新增分类「${nm}」，已同步至表单下拉` : `已重命名分类为「${nm}」`);
    if (modal.mode === 'add' && modal.parent) setExpanded((e) => ({ ...e, [modal.parent!.id]: true }));
    setModal(null);
  };

  const del = (root: CatRootKey, node: CatNode) => {
    if ((node.ch || []).length) { toast(`「${node.n}」有子分类，禁止删除`, 'err'); return; }
    const ids = subIds(node);
    if (usedIds.some((u) => ids.includes(u))) { toast(`「${node.n}」下存在材料 / 产品，被引用禁删`, 'err'); return; }
    /* 危险操作二次确认（规范 §6.2） */
    setDelTarget({ root, node });
  };

  return (
    <div className="nc-cattree">
      <div className="nc-cattree-hd">
        <b>分类目录</b>
        <span className="nc-cattree-sub">任意层级 · 点击=过滤</span>
      </div>
      <div className="nc-cattree-search">
        <Ico n="search" size={13} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索分类…" />
      </div>

      <div className="nc-cattree-body">
        <button className={`nc-tnode${value === '' ? ' is-on' : ''}`} onClick={() => onChange('')}>
          <span className="nc-tnode-nm">全部分类</span>
          <em className="num">{flat.filter((f) => f.d > 0).reduce((s, f) => s + countOf(f.n.id), 0)}</em>
        </button>

        {roots.map((k) => {
          const root = tree[k];
          const open = expanded[root.id];
          return (
            <div key={k} className="nc-troot">
              <div className="nc-troot-hd" onClick={() => setExpanded((e) => ({ ...e, [root.id]: !open }))} {...pressProps(() => setExpanded((e) => ({ ...e, [root.id]: !open })))}>
                <span className={`nc-tcaret${open ? ' is-open' : ''}`}>▸</span>
                <span className="nc-troot-nm">{root.n}</span>
                <em className="num">{cntOf(root)}</em>
              </div>
              {open && (
                <div className="nc-troot-bd">
                  {/* 根下子节点 */}
                  {(root.ch || []).filter(visible).map((c) => (
                    <Branch
                      key={c.id} node={c} depth={0} value={value} expanded={expanded}
                      onToggle={(id) => setExpanded((e) => ({ ...e, [id]: !e[id] }))}
                      onPick={(id) => onChange(id)} cntOf={cntOf} visible={visible}
                      editable={editable}
                      onAdd={(n) => openAdd(k, n)} onEdit={(n) => openEdit(k, n)} onDel={(n) => del(k, n)}
                    />
                  ))}
                  {editable && (
                    <button className="nc-tadd" onClick={() => openAdd(k, null)}>＋ 新增一级分类</button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 新增 / 重命名 */}
      <Modal
        open={!!modal} onClose={() => setModal(null)} width={520}
        title={modal?.mode === 'add' ? `新增分类${modal.parent ? ` · 上级「${modal.parent.n}」` : ` · ${tree[modal.root].n}`}` : `重命名分类 · ${modal?.edit?.n ?? ''}`}
        foot={<>
          <Btn onClick={() => setModal(null)}>取消</Btn>
          <Btn kind="primary" onClick={submit}>保存</Btn>
        </>}
      >
        <div className="nc-dnote" style={{ marginBottom: 12 }}>
          支持任意层级；同级重名校验；被引用分类禁删。分类保存后自动同步到材料 / 产品表单下拉。
        </div>
        <Field label="分类名称" req err={err}>
          <input className="nc-input" value={name} onChange={(e) => { setName(e.target.value); setErr(''); }} placeholder="如：管阀件 / 火灾自动报警" />
        </Field>
        <Field label="分类负责人（选填）" note="用于「谁维护这类主数据」的归属提示">
          <input className="nc-input" value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="如：张仓" />
        </Field>
      </Modal>

      {/* 删除二次确认（危险操作 · 规范 §6.2） */}
      <Modal
        open={!!delTarget} onClose={() => setDelTarget(null)} width={480} title="删除分类"
        foot={<>
          <Btn onClick={() => setDelTarget(null)}>取消</Btn>
          <Btn danger onClick={() => {
            if (!delTarget) return;
            setTree((t) => {
              const nt = JSON.parse(JSON.stringify(t)) as Record<CatRootKey, CatNode>;
              const rm = (list: CatNode[]): CatNode[] => list.filter((x) => x.id !== delTarget.node.id).map((x) => ({ ...x, ch: x.ch ? rm(x.ch) : undefined }));
              nt[delTarget.root] = { ...nt[delTarget.root], ch: rm(nt[delTarget.root].ch || []) };
              return nt;
            });
            if (value === delTarget.node.id) onChange('');
            toast(`已删除分类「${delTarget.node.n}」（留痕）`);
            setDelTarget(null);
          }}>确认删除</Btn>
        </>}
      >
        <div className="nc-warnbox is-red" style={{ marginBottom: 10 }}>
          <Ico n="ban" size={16} /> 「{delTarget?.node.n}」删除后不可恢复，历史引用单据不受影响。
        </div>
        <div className="nc-cell-sub">该操作将写入变更日志（操作人 / 时间 / 内容）。</div>
      </Modal>
    </div>
  );
}

/** 递归分支节点 */
function Branch({
  node, depth, value, expanded, onToggle, onPick, cntOf, visible, editable, onAdd, onEdit, onDel,
}: {
  node: CatNode; depth: number; value: string; expanded: Record<string, boolean>;
  onToggle: (id: string) => void; onPick: (id: string) => void;
  cntOf: (n: CatNode) => number; visible: (n: CatNode) => boolean; editable: boolean;
  onAdd: (n: CatNode) => void; onEdit: (n: CatNode) => void; onDel: (n: CatNode) => void;
}) {
  const hasCh = (node.ch || []).length > 0;
  const open = expanded[node.id];
  const kids = (node.ch || []).filter(visible);
  if (!visible(node) && !kids.length) return null;
  return (
    <>
      <div
        className={`nc-tnode d${depth}${value === node.id ? ' is-on' : ''}`}
        style={{ paddingLeft: 10 + depth * 14 }}
        title={node.owner ? `分类负责人：${node.owner}` : undefined}
      >
        {hasCh
          ? <span className={`nc-tcaret${open ? ' is-open' : ''}`} onClick={(e) => { e.stopPropagation(); onToggle(node.id); }} {...pressProps(() => onToggle(node.id))}>▸</span>
          : <span className="nc-tdot" />}
        <span className="nc-tnode-nm" onClick={() => onPick(node.id)} {...pressProps(() => onPick(node.id))}>{node.n}</span>
        {node.owner && <span className="nc-towner">{node.owner}</span>}
        <em className="num">{cntOf(node)}</em>
        {editable && (
          <span className="nc-tacts" onClick={(e) => e.stopPropagation()}>
            <a onClick={() => onAdd(node)} title="新增子分类">＋</a>
            <a onClick={() => onEdit(node)} title="重命名">✎</a>
            <a className="dg" onClick={() => onDel(node)} title="删除">✕</a>
          </span>
        )}
      </div>
      {open && kids.map((c) => (
        <Branch
          key={c.id} node={c} depth={depth + 1} value={value} expanded={expanded}
          onToggle={onToggle} onPick={onPick} cntOf={cntOf} visible={visible}
          editable={editable} onAdd={onAdd} onEdit={onEdit} onDel={onDel}
        />
      ))}
    </>
  );
}

/** 在树中查节点（返回可变引用） */
function findIn(root: CatNode, id: string): CatNode | null {
  if (root.id === id) return root;
  for (const c of root.ch || []) {
    const hit = findIn(c, id);
    if (hit) return hit;
  }
  return null;
}
