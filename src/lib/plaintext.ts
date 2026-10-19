/**
 * 纯文本转换
 *
 * 两个入口，别用混：
 *   - toPlainText(html)       输入是【渲染后的 HTML】，用于处理 Content 组件的输出
 *   - stripMarkdown(md)       输入是【Markdown 原文】，用于「复制 Markdown」
 *   - markdownToPlainText(md) 输入是【Markdown 原文】，输出纯文本 ← 正文抄录用这个
 *
 * 注意：Astro 的 entry.body 是 Markdown 源码，不是 HTML。
 */

/** 把 HTML 实体还原为字符（仅常用实体，避免引第三方依赖） */
function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/&amp;/g, '&');
}

/**
 * HTML → 纯文本，保留段落结构。
 *
 * 换行策略：先把块级边界统一记为一个哨兵字符，最后再把「哨兵 + 连续空行」
 * 折叠成单个换行。这样 <p>一</p><p>二</p> 得到 "一\n二"，
 * 而不是每个 </p> 和 <p> 各贡献一个换行变成空行。
 */
const NL = '\u0000'; // 块边界哨兵，正文中不会出现

export function toPlainText(html: string): string {
  if (!html) return '';

  let s = html;

  // 去掉 script / style / 注释
  s = s.replace(/<script[\s\S]*?<\/script>/gi, '');
  s = s.replace(/<style[\s\S]*?<\/style>/gi, '');
  s = s.replace(/<!--[\s\S]*?-->/g, '');

  // 注音：<ruby>字<rt>音</rt></ruby> → 字
  s = s.replace(/<ruby[^>]*>([\s\S]*?)<rt[^>]*>[\s\S]*?<\/rt>[\s\S]*?<\/ruby>/gi, '$1');
  s = s.replace(/<\/?rt[^>]*>/gi, '');

  // 表格单元格 → 制表符（在空白压缩之前做，且用哨兵保护）
  s = s.replace(/<td[^>]*>/gi, '');
  s = s.replace(/<th[^>]*>/gi, '');
  s = s.replace(/<\/t[dh]>/gi, '\t');

  // 块级元素 → 哨兵
  s = s.replace(/<\/?(p|div|section|article|blockquote|h[1-6]|ul|ol|dl|table|thead|tbody|tr|figure|figcaption|hr)[^>]*>/gi, NL);
  s = s.replace(/<br\s*\/?>/gi, NL);
  s = s.replace(/<li[^>]*>/gi, NL + '· ');
  s = s.replace(/<\/li>/gi, '');

  // 行内元素直接去标签
  s = s.replace(/<[^>]+>/g, '');

  s = decodeEntities(s);

  // 压缩：只折叠【多个连续空格】，不删单个空格（列表前缀「· 」与实体解码后的空格要保住）
  s = s.replace(/[ \u00a0]{2,}/g, ' ');
  s = s.replace(/ *\u0000 */g, '\u0000');    // 哨兵周围不留空格
  s = s.replace(/\u0000+/g, '\n');            // 连续哨兵折叠为单个换行
  s = s.replace(/ *\n */g, '\n');
  s = s.replace(/\n{3,}/g, '\n\n');

  return s.trim();
}

/** 去掉 Markdown 标记，得到纯文本（保留段落结构） */
export function stripMarkdown(md: string): string {
  if (!md) return '';
  let s = md;
  s = s.replace(/^---\n[\s\S]*?\n---\n/, '');            // frontmatter
  s = s.replace(/```[\s\S]*?```/g, (m) => m.replace(/```[^\n]*\n?/g, '')); // 代码块保留内容
  s = s.replace(/`([^`]+)`/g, '$1');
  s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, '');            // 图片
  s = s.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');         // 链接保留文字
  s = s.replace(/^\s{0,3}#{1,6}\s+/gm, '');              // 标题
  s = s.replace(/^\s{0,3}>\s?/gm, '');                   // 引用
  s = s.replace(/^\s{0,3}[-*+]\s+/gm, '· ');             // 无序列表
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1');
  s = s.replace(/\*([^*]+)\*/g, '$1');
  s = s.replace(/__([^_]+)__/g, '$1');
  s = s.replace(/~~([^~]+)~~/g, '$1');
  s = s.replace(/^\s*-{3,}\s*$/gm, '');                  // 分隔线
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

/**
 * Markdown 原文 → 纯文本正文
 * 正文抄录（CopyBar / raw 端点 / RSS）用这个。
 */
export function markdownToPlainText(md: string): string {
  return stripMarkdown(md);
}

/**
 * 给 HTML 的每个段落加锚点 id（p1, p2, …），支持精准单段引用。
 * 只处理没有 id 的 <p>。
 */
export function addParagraphAnchors(html: string): string {
  let i = 0;
  return html.replace(/<p(\s[^>]*)?>/gi, (match, attrs = '') => {
    if (/\bid=/i.test(attrs)) return match;
    i += 1;
    return `<p${attrs} id="p${i}">`;
  });
}
