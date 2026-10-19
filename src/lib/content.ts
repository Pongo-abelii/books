/**
 * 内容查询与 URL 工具
 *
 * Astro 7 中 entry.id 是相对 base 的路径（去掉扩展名），含目录前缀，
 * 例如 poems/tang/li-bai/ye-si.md → id "tang/li-bai/ye-si"。
 * 本模块统一处理：draft 过滤、URL 生成、排序、聚合。
 */

import { getCollection, type CollectionEntry } from 'astro:content';
import { SECTIONS, type SectionKey } from '../consts';
import { basePrefix } from './url';

export type AnyEntry = CollectionEntry<SectionKey>;

/** 取某栏目已发布（非 draft）条目，按日期倒序 */
export async function published<K extends SectionKey>(
  section: K,
): Promise<CollectionEntry<K>[]> {
  const items = await getCollection(section as any, ({ data }: any) => !data.draft);
  return (items as CollectionEntry<K>[]).sort(
    (a: any, b: any) => b.data.date.getTime() - a.data.date.getTime(),
  );
}

/** 取全部栏目的已发布条目 */
export async function allPublished(): Promise<Array<{ section: SectionKey; entry: AnyEntry }>> {
  const keys: SectionKey[] = ['poems', 'essays', 'docs', 'excerpts'];
  const groups = await Promise.all(
    keys.map(async (k) => (await published(k)).map((entry) => ({ section: k, entry: entry as AnyEntry }))),
  );
  return groups.flat().sort((a, b) => b.entry.data.date.getTime() - a.entry.data.date.getTime());
}

/**
 * entry.id → 站内路径（不含 base 前缀，供 url() 再处理）
 * 若 frontmatter 指定 slug 则优先用之（仍保留栏目前缀）
 */
export function entryPath(section: SectionKey, entry: { id: string; data: { slug?: string } }): string {
  const id = entry.data.slug ?? entry.id;
  return `/${SECTIONS[section].path}/${id}/`;
}

/**
 * 拼绝对地址（用于引用格式、raw 端点、RSS、canonical）
 * 必须带上 base 前缀：站点部署在 /books 子路径时，
 * new URL('/poems/x/', site) 会得到 https://host/poems/x/ —— 缺了 /books，是错的。
 */
export function entryUrl(
  site: URL | undefined,
  section: SectionKey,
  entry: { id: string; data: { slug?: string } },
): string {
  const path = entryPath(section, entry);
  const withBase = basePrefix ? `${basePrefix}${path}` : path;
  return site ? new URL(withBase, site).href : withBase;
}

/** 按字段聚合并排序，用于标签 / 作者 / 朝代页 */
export function groupBy<T>(items: T[], keyFn: (item: T) => string | string[] | undefined): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const raw = keyFn(item);
    if (!raw) continue;
    const keys = Array.isArray(raw) ? raw : [raw];
    for (const k of keys) {
      if (!k) continue;
      const list = map.get(k) ?? [];
      list.push(item);
      map.set(k, list);
    }
  }
  return map;
}

/** 格式化日期（中文） */
export function formatDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return `${y} 年 ${m} 月 ${day} 日`;
}

/** 简易 ISO 日期，供 datetime 属性与引用格式使用 */
export function isoDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
