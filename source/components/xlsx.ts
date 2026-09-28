// 通用表格读取（零依赖）—— 考勤导入 / 证书批量导入共用
//
// 为什么自己写解析而不用 SheetJS：本仓库是原型工程，不引第三方解析库。
// .xlsx 本质是 ZIP + XML，浏览器原生就有 DecompressionStream('deflate-raw')，
// 因此「解压 → 读 sharedStrings.xml → 读 sheet1.xml」三段足够覆盖
// 「Excel 另存的工作簿」这一类输入；不支持的形态（加密 / 宏 / zip64）给出明确报错，
// 不静默失败。
//
// 本文件只负责「文件 → 二维字符串网格」，不认识任何业务语义。
// 业务识别（考勤逐日符号 / 证书字段）在各自的模块里做：
//   - components/attImport.ts  → 考勤记录表
//   - components/certImport.ts → 证书台账表 + 证书照片识别

/* ============================ 一、ZIP 解压 ============================ */

/** deflate-raw 解压（浏览器原生，无需依赖） */
async function inflateRaw(raw: Uint8Array): Promise<Uint8Array> {
  /* 拷一份再喂给解压流：subarray 得到的是 ArrayBufferLike 视图，
     而 Writer.write 要 BufferSource；顺带避开共享缓冲区被后续写入影响 */
  const copy = new Uint8Array(raw.length);
  copy.set(raw);
  const ds = new DecompressionStream('deflate-raw');
  const w = ds.writable.getWriter();
  void w.write(copy);
  void w.close();
  return new Uint8Array(await new Response(ds.readable).arrayBuffer());
}

/**
 * 读取 ZIP 内所有条目。
 * 只解析中央目录（Central Directory）—— 它带准确的文件名与压缩信息，
 * 且本地头的 extra 字段长度可能与中央目录不同，所以数据起点必须按本地头重算。
 */
async function unzip(buf: ArrayBuffer): Promise<Record<string, Uint8Array>> {
  const u8 = new Uint8Array(buf);
  const dv = new DataView(buf);
  /* EOCD 签名 0x06054b50，注释最长 65535 字节，故从尾部往前最多扫 65535+22 */
  let eocd = -1;
  const from = Math.max(0, u8.length - 22 - 65535);
  for (let i = u8.length - 22; i >= from; i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('不是有效的 .xlsx（未找到 ZIP 结构），请确认文件未损坏');
  const count = dv.getUint16(eocd + 10, true);
  let off = dv.getUint32(eocd + 16, true);
  const out: Record<string, Uint8Array> = {};
  for (let i = 0; i < count; i++) {
    if (off + 46 > u8.length || dv.getUint32(off, true) !== 0x02014b50) break;
    const method = dv.getUint16(off + 10, true);
    const compSize = dv.getUint32(off + 20, true);
    const nameLen = dv.getUint16(off + 28, true);
    const extraLen = dv.getUint16(off + 30, true);
    const cmtLen = dv.getUint16(off + 32, true);
    const lho = dv.getUint32(off + 42, true);
    const name = new TextDecoder().decode(u8.subarray(off + 46, off + 46 + nameLen));
    if (lho + 30 <= u8.length) {
      /* 本地头的 nameLen / extraLen 才是数据真正的偏移依据 */
      const lNameLen = dv.getUint16(lho + 26, true);
      const lExtraLen = dv.getUint16(lho + 28, true);
      const start = lho + 30 + lNameLen + lExtraLen;
      const raw = u8.subarray(start, start + compSize);
      out[name] = method === 8 ? await inflateRaw(raw) : raw;
    }
    off += 46 + nameLen + extraLen + cmtLen;
  }
  return out;
}

/* ============================ 二、工作表 → 二维网格 ============================ */

/** A1 / BC12 → 0 基列号 */
export function colIdx(ref: string): number {
  const m = /^([A-Z]+)/.exec(ref);
  if (!m) return 0;
  let n = 0;
  for (const ch of m[1]) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

/** 共享字符串表：<si> 下可能由多个 <r><t> 拼成，全部取 <t> 再连接 */
function parseSharedStrings(xml: string): string[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  return Array.from(doc.getElementsByTagName('si')).map((si) =>
    Array.from(si.getElementsByTagName('t')).map((t) => t.textContent ?? '').join(''));
}

/**
 * 工作表 XML → 二维字符串数组。
 * ⚠️ 单元格是稀疏的（空单元格不会出现在 XML 里），必须按 r 属性还原列号，
 *    否则「第 8 天没填」会把后面所有符号整体左移一格 —— 考勤表最怕这个。
 */
function parseSheet(xml: string, shared: string[]): string[][] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const out: string[][] = [];
  for (const r of Array.from(doc.getElementsByTagName('row'))) {
    const ri = Number(r.getAttribute('r') ?? out.length + 1) - 1;
    const line: string[] = [];
    for (const c of Array.from(r.getElementsByTagName('c'))) {
      const ci = colIdx(c.getAttribute('r') ?? '');
      const t = c.getAttribute('t');
      let v = '';
      if (t === 'inlineStr') {
        v = Array.from(c.getElementsByTagName('t')).map((x) => x.textContent ?? '').join('');
      } else {
        const raw = c.getElementsByTagName('v')[0]?.textContent ?? '';
        v = t === 's' ? (shared[Number(raw)] ?? '') : raw;
      }
      while (line.length < ci) line.push('');
      line[ci] = v;
    }
    while (out.length < ri) out.push([]);
    out[ri] = line;
  }
  return out;
}

/** .xlsx → 二维网格（只取第一张工作表） */
export async function readXlsx(buf: ArrayBuffer): Promise<string[][]> {
  const files = await unzip(buf);
  const names = Object.keys(files);
  const sheetName = names.find((n) => /^xl\/worksheets\/sheet1\.xml$/i.test(n))
    ?? names.find((n) => /^xl\/worksheets\/[^/]+\.xml$/i.test(n));
  if (!sheetName) throw new Error('这个文件里没有找到工作表，请确认是 Excel 工作簿');
  const dec = new TextDecoder();
  const shared = files['xl/sharedStrings.xml']
    ? parseSharedStrings(dec.decode(files['xl/sharedStrings.xml']))
    : [];
  return parseSheet(dec.decode(files[sheetName]), shared);
}

/* ============================ 三、分隔符文本 → 二维网格 ============================ */

/** 单行按分隔符切分（支持 "双引号包裹" 与 "" 转义） */
function splitLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; } else quoted = false;
      } else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delim) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

/** .csv / .txt / 从 Excel 直接粘贴（制表符分隔）→ 二维网格 */
export function parseDelimited(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const body = clean.split('\n').filter((l) => l.trim() !== '');
  if (!body.length) return [];
  /* 制表符优先：从 Excel 复制粘贴出来的一定是 TSV，比逗号可靠（姓名里可能有逗号） */
  const delim = body[0].includes('\t') ? '\t' : ',';
  return body.map((l) => splitLine(l, delim));
}

/* ============================ 四、入口：按文件名挑解析方式 ============================ */

/** 图片 / 扫描件（走识别而非解析） */
export const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.webp', '.bmp', '.gif', '.pdf'];
/** 表格（走解析） */
export const TABLE_EXTS = ['.xlsx', '.xlsm', '.csv', '.txt'];

const extOf = (name: string) => {
  const i = name.lastIndexOf('.');
  return i < 0 ? '' : name.slice(i).toLowerCase();
};

export const isImageFile = (name: string) => IMAGE_EXTS.includes(extOf(name));
export const isTableFile = (name: string) => TABLE_EXTS.includes(extOf(name));

/** 表格文件 → 二维网格 */
export async function readTableFile(file: File): Promise<string[][]> {
  const lower = file.name.toLowerCase();
  if (lower.endsWith('.xlsx') || lower.endsWith('.xlsm')) return readXlsx(await file.arrayBuffer());
  if (lower.endsWith('.xls')) {
    throw new Error('不支持 Excel 97-2003 的 .xls 旧格式，请在 Excel 里另存为 .xlsx 后重试');
  }
  return parseDelimited(await file.text());
}
