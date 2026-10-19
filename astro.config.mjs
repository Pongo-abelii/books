import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { existsSync } from 'node:fs';

/**
 * 部署形态自适应
 *
 * 同一份配置要同时支持两种形态：
 *   A. 自定义域名 books.ailmel.top      → site = https://books.ailmel.top,  base = '/'
 *   B. GitHub Pages 项目站点 .../books  → site = https://pongo-abelii.github.io, base = '/books'
 *
 * 判定依据：public/CNAME 是否存在。
 *   - 放了 CNAME（内容为自定义域名）→ 形态 A
 *   - 没放 CNAME                     → 形态 B
 *
 * 这样切换自定义域名时只需增删 public/CNAME，不必改配置，也不会出现
 * site 与 base 不一致导致 sitemap / RSS / 绝对链接指向错误地址的情况。
 *
 * 站内链接一律经 src/lib/url.ts 的 url() 处理；Markdown 正文里的
 * 站内绝对链接由下方 rehype 插件自动补 base 前缀，作者写正文时照常写 /xxx/ 即可。
 */
const hasCname = existsSync(new URL('./public/CNAME', import.meta.url));

const site = hasCname ? 'https://books.ailmel.top' : 'https://pongo-abelii.github.io';
const base = hasCname ? '/' : '/books';
const prefix = base.endsWith('/') ? base.slice(0, -1) : base;

/**
 * rehype 插件：给 Markdown 正文里的站内绝对链接补 base 前缀。
 * 只处理以 / 开头、且尚未带 base 前缀的 href。
 */
function rehypeBaseLinks() {
  return (tree) => {
    const walk = (node) => {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'element' && node.tagName === 'a' && node.properties?.href) {
        const href = String(node.properties.href);
        if (href.startsWith('/') && prefix && !href.startsWith(`${prefix}/`)) {
          node.properties.href = `${prefix}${href}`;
        }
      }
      for (const child of node.children ?? []) walk(child);
    };
    walk(tree);
  };
}

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  markdown: {
    shikiConfig: { theme: 'github-light', wrap: true },
    rehypePlugins: [rehypeBaseLinks],
  },
  integrations: [sitemap()],
  devToolbar: { enabled: false },
});
