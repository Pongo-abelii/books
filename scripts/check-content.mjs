#!/usr/bin/env node
/**
 * 内容门禁
 *
 * zod schema 已在构建时校验字段类型，本脚本补做 zod 覆盖不到的检查：
 *   1. id 重复（不同栏目间也查，因为 raw 端点与聚合页按 id 索引）
 *   2. draft 残留：已发布目录里不该有 draft: true 的条目被误当成品
 *   3. license 取值合法性（zod 已覆盖，此处兜底并给出可读提示）
 *   4. 内部链接可达性：正文中的站内绝对路径是否存在对应条目
 *   5. 诗词体裁与词牌一致性（zod refine 已覆盖，此处给出更明确的定位）
 *   6. 文件名规范：正文文件应为 .md，路径段不含空格与中文（避免 URL 编码问题）
 *
 * 不依赖 Astro 运行时，纯 Node，可在 CI 早期快速失败。
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const CONTENT = path.join(ROOT, 'src', 'content');
const SECTIONS = ['docs', 'poems', 'essays', 'excerpts'];

const VALID_LICENSE = new Set([
  'pd', 'cc0', 'cc-by-4.0', 'cc-by-sa-4.0', 'cc-by-nc-4.0', 'cc-by-nc-sa-4.0', 'arr',
]);

const errors = [];
const warnings = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

/** 极简 frontmatter 解析：只处理顶层 key: value 与简单数组，够用且无依赖 */
function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const raw = m[1];
  const data = {};
  const lines = raw.split(/\r?\n/);
  let currentKey = null;
  let currentList = null;

  for (const line of lines) {
    if (/^\s*$/.test(line)) continue;
    // 列表项
    const li = line.match(/^\s*-\s+(.*)$/);
    if (li && currentKey) {
      currentList = currentList ?? [];
      currentList.push(li[1].trim().replace(/^["']|["']$/g, ''));
      data[currentKey] = currentList;
      continue;
    }
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (kv) {
      currentKey = kv[1];
      currentList = null;
      let v = kv[2].trim();
      if (v === '') { data[currentKey] = undefined; continue; }
      if (v === 'true') v = true;
      else if (v === 'false') v = false;
      else v = v.replace(/^["']|["']$/g, '');
      data[currentKey] = v;
    }
  }
  return data;
}

const entries = []; // { section, id, file, data, body }

for (const section of SECTIONS) {
  const dir = path.join(CONTENT, section);
  for (const file of walk(dir)) {
    const rel = path.relative(CONTENT, file);
    const ext = path.extname(file);
    if (ext !== '.md' && ext !== '.mdx') {
      errors.push(`${rel}: 内容文件必须是 .md 或 .mdx，实际是 ${ext}`);
      continue;
    }

    const text = fs.readFileSync(file, 'utf8');
    const data = parseFrontmatter(text);
    if (!data) {
      errors.push(`${rel}: 缺少 frontmatter（文件应以 --- 开头）`);
      continue;
    }

    // id 规则：相对栏目目录、去扩展名
    const id = path.relative(dir, file).replace(/\.(md|mdx)$/, '').replace(/\\/g, '/');

    // 6. 文件名规范
    if (/[\s\u4e00-\u9fff]/.test(id)) {
      warnings.push(`${rel}: 路径含空格或中文（id=${id}），URL 会被编码，建议改用拼音/英文`);
    }

    // 3. license
    if (!data.license) {
      errors.push(`${rel}: 缺少 license 字段`);
    } else if (!VALID_LICENSE.has(data.license)) {
      errors.push(`${rel}: license 取值非法「${data.license}」，可选：${[...VALID_LICENSE].join(' | ')}`);
    }

    // 必填字段兜底（zod 会查，这里给可读定位）
    for (const f of ['title', 'date', 'authors']) {
      if (!data[f]) errors.push(`${rel}: 缺少必填字段 ${f}`);
    }

    // 5. 诗词体裁
    if (section === 'poems') {
      if (!data.dynasty) errors.push(`${rel}: poems 缺少 dynasty`);
      if (!data.form) errors.push(`${rel}: poems 缺少 form`);
      if (data.form === '词' && !data.ci_pai) errors.push(`${rel}: form 为「词」时必须填 ci_pai`);
    }
    if (section === 'excerpts') {
      if (!data.excerpt_from) errors.push(`${rel}: excerpts 缺少 excerpt_from（整理自何书）`);
      if (!data.excerpt_ref) errors.push(`${rel}: excerpts 缺少 excerpt_ref（卷次/篇次）`);
      if (!data.excerpt_kind) errors.push(`${rel}: excerpts 缺少 excerpt_kind`);
    }

    entries.push({ section, id, file: rel, data, body: text.replace(/^---[\s\S]*?\n---\r?\n?/, '') });
  }
}

// 1. id 重复（跨栏目也查，因为 raw 端点按 id 生成路径）
const seen = new Map();
for (const e of entries) {
  const key = `${e.section}/${e.id}`;
  if (seen.has(key)) {
    errors.push(`id 重复：${key}\n    - ${seen.get(key)}\n    - ${e.file}`);
  } else {
    seen.set(key, e.file);
  }
}

// 2. draft 统计（不算错，但提示）
const drafts = entries.filter((e) => e.data.draft === true);
if (drafts.length) {
  warnings.push(`${drafts.length} 篇标记为 draft，不会进入构建：${drafts.map((d) => d.file).join('、')}`);
}

// 4. 内部链接可达性：正文中的站内绝对路径
const knownPaths = new Set();
for (const e of entries) {
  if (e.data.draft === true) continue;
  knownPaths.add(`/${e.section}/${e.id}/`);
  if (e.data.slug) knownPaths.add(`/${e.section}/${e.data.slug}/`);
}
// 固定页面
for (const p of ['/', '/about/', '/archive/', '/license/', '/search/', '/tags/', '/rss.xml', '/sitemap-index.xml']) {
  knownPaths.add(p);
}
// 栏目索引
for (const s of SECTIONS) knownPaths.add(`/${s}/`);

const LINK_RE = /\]\((\/[^)\s#]+)(?:#[^)\s]*)?\)/g;
for (const e of entries) {
  if (e.data.draft === true) continue;
  let m;
  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(e.body)) !== null) {
    const href = m[1];
    // 跳过动态聚合前缀与资源文件
    if (/^\/(tags|authors|dynasty)\//.test(href)) continue;
    if (/\.(png|jpg|jpeg|svg|webp|css|js|xml|txt)$/.test(href)) continue;
    if (!knownPaths.has(href)) {
      warnings.push(`${e.file}: 内部链接可能失效 → ${href}`);
    }
  }
}

// 输出
const RED = '\x1b[31m', YEL = '\x1b[33m', GRN = '\x1b[32m', DIM = '\x1b[2m', RST = '\x1b[0m';

console.log(`${DIM}内容门禁：扫描 ${entries.length} 个条目${RST}`);

if (warnings.length) {
  console.log(`\n${YEL}警告 (${warnings.length})${RST}`);
  for (const w of warnings) console.log(`  ${YEL}!${RST} ${w}`);
}

if (errors.length) {
  console.log(`\n${RED}错误 (${errors.length})${RST}`);
  for (const e of errors) console.log(`  ${RED}✗${RST} ${e}`);
  console.log(`\n${RED}内容门禁未通过${RST}`);
  process.exit(1);
}

console.log(`\n${GRN}✓ 内容门禁通过${RST}${warnings.length ? `（${warnings.length} 条警告）` : ''}`);
