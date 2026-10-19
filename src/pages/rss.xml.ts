import rss from '@astrojs/rss';
import { allPublished, entryUrl } from '../lib/content';
import { markdownToPlainText } from '../lib/plaintext';
import { SITE } from '../consts';
import { basePrefix } from '../lib/url';

/**
 * RSS 生成
 *
 * 注意 base 处理：
 *   Astro 的 context.site 只含站点根（如 https://pongo-abelii.github.io），不含 base。
 *   部署在 /books 子路径时，必须把 base 拼上，否则 channel link 会指向站点根、404。
 *   item link 由 entryUrl() 生成，它已内部处理 base。
 */
export async function GET(context: { site: URL }) {
  const items = await allPublished();

  // 站点根 + base，例如 https://host/books/
  const siteRoot = new URL(`${basePrefix}/`, context.site ?? SITE.url);
  const selfUrl = new URL('rss.xml', siteRoot).href;

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: siteRoot,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: `<language>zh-cn</language><atom:link href="${selfUrl}" rel="self" type="application/rss+xml" />`,
    items: items.slice(0, 50).map(({ section, entry }) => {
      const url = entryUrl(context.site, section, entry);
      return {
        title: entry.data.title,
        description: entry.data.summary ?? markdownToPlainText(entry.body ?? '').slice(0, 300),
        link: url,
        pubDate: entry.data.date,
        categories: entry.data.tags ?? [],
        author: entry.data.authors.join('、'),
        content: markdownToPlainText(entry.body ?? ''),
      };
    }),
  });
}
