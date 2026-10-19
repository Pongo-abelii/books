/**
 * 纯文本端点：/raw/<id>.txt
 *
 * 转载方直接 curl 即可取用，无需爬 HTML。头部附出处、授权与引用格式。
 * 这是「降低合规成本」的设计：对方不必解析 DOM，自然愿意保留出处。
 */
import { getCollection } from 'astro:content';
import { markdownToPlainText } from '../../lib/plaintext';
import { citation } from '../../lib/cite';
import { entryUrl, isoDate } from '../../lib/content';
import { getLicense } from '../../lib/license';
import { SITE, type SectionKey } from '../../consts';

const SECTIONS: SectionKey[] = ['docs', 'poems', 'essays', 'excerpts'];

export async function getStaticPaths() {
  const groups = await Promise.all(
    SECTIONS.map(async (section) => {
      const items = await getCollection(section as any, ({ data }: any) => !data.draft);
      return items.map((entry: any) => ({ params: { id: `${entry.id}.txt` }, props: { section, entry } }));
    }),
  );
  return groups.flat();
}

export async function GET({ props, site }: { props: any; site: URL | undefined }) {
  const { section, entry } = props as { section: SectionKey; entry: any };
  const url = entryUrl(site, section, entry);
  const info = getLicense(entry.data.license);

  const header = [
    `# ${entry.data.title}`,
    `# 作者：${entry.data.authors.join('、')}`,
    entry.data.dynasty ? `# 朝代：${entry.data.dynasty}` : null,
    entry.data.form ? `# 体裁：${entry.data.form}${entry.data.ci_pai ? ` · ${entry.data.ci_pai}` : ''}` : null,
    entry.data.excerpt_from ? `# 整理自：《${entry.data.excerpt_from}》${entry.data.excerpt_ref ? ` · ${entry.data.excerpt_ref}` : ''}` : null,
    entry.data.original_author ? `# 原作者：${entry.data.original_author}` : null,
    `# 日期：${isoDate(entry.data.date)}`,
    `# 来源：${url}`,
    `# 授权：${info.name}`,
    `# 引用：${citation({
      authors: entry.data.authors,
      title: entry.data.title,
      siteName: SITE.title,
      url,
      date: entry.data.date,
      originalAuthor: entry.data.original_author,
    }, 'gbt7714')}`,
    '# ' + '-'.repeat(58),
  ].filter(Boolean).join('\n');

  const body = markdownToPlainText(entry.body ?? '');
  const text = `${header}\n\n${body}\n`;

  return new Response(text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Robots-Tag': 'all',
    },
  });
}
