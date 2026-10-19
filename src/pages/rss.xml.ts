import rss from '@astrojs/rss';
import { allPublished, entryUrl } from '../lib/content';
import { markdownToPlainText } from '../lib/plaintext';
import { SITE } from '../consts';
import { basePrefix } from '../lib/url';

export async function GET(context: { site: URL }) {
  const items = await allPublished();
  return rss({
    title: SITE.title,
    description: SITE.description,
    site: context.site ?? SITE.url,
    xmlns: { atom: 'http://www.w3.org/2005/Atom' },
    customData: `<language>zh-cn</language><atom:link href="${SITE.url}${basePrefix}/rss.xml" rel="self" type="application/rss+xml" />`,
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
