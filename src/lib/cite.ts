/**
 * 引用格式生成器
 *
 * 支持四种格式：GB/T 7714-2015（中文）、MLA 9、APA 7、Chicago 17。
 * 纯函数，不依赖 Astro 类型，便于单测。
 *
 * 日期一律用 UTC 取值：Astro 的 z.coerce.date() 把 "2026-10-19" 解析为 UTC 午夜，
 * 若用本地时区方法取值，在 UTC+8 环境下会得到前一天。
 */

export type CitationStyle = 'gbt7714' | 'mla9' | 'apa7' | 'chicago17';

export interface CitationInput {
  /** 署名（本站作者 / 整理者） */
  authors: string[];
  /** 题名 */
  title: string;
  /** 站点名，如「江栖文集」 */
  siteName: string;
  /** 本文绝对地址 */
  url: string;
  /** 创作 / 发布日期 */
  date: Date;
  /** 引用日期（访问日期），缺省为今天 */
  accessDate?: Date;
  /** 整理类内容：原作者。引用主要责任者时优先取它 */
  originalAuthor?: string;
}

export const CITATION_STYLE_LABELS: Record<CitationStyle, string> = {
  gbt7714: 'GB/T 7714',
  mla9: 'MLA 9',
  apa7: 'APA 7',
  chicago17: 'Chicago 17',
};

const MONTHS_MLA = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];
const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function ymd(d: Date): { y: number; m: number; day: number } {
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), day: d.getUTCDate() };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** YYYY-MM-DD */
function isoDate(d: Date): string {
  const { y, m, day } = ymd(d);
  return `${y}-${pad(m + 1)}-${pad(day)}`;
}

/** 主要责任者：整理类取原作者，否则取本站署名 */
function responsibleAuthor(input: CitationInput): string {
  if (input.originalAuthor) return input.originalAuthor;
  return input.authors.join('、');
}

/**
 * GB/T 7714-2015（电子资源）
 * 主要责任者. 题名[EB/OL]. (更新日期)[引用日期]. 获取路径.
 */
function gbt7714(input: CitationInput, access: Date): string {
  const parts: string[] = [];
  parts.push(`${responsibleAuthor(input)}.`);
  parts.push(`${input.title}[EB/OL].`);
  parts.push(`(${isoDate(input.date)})[${isoDate(access)}].`);
  parts.push(`${input.url}.`);
  return parts.join(' ');
}

/**
 * MLA 9（网页）
 * Author. "Title." Site Name, Date, URL.
 */
function mla9(input: CitationInput, _access: Date): string {
  const { y, m, day } = ymd(input.date);
  const dateStr = `${day} ${MONTHS_MLA[m]} ${y}`;
  const author = responsibleAuthor(input);
  return `${author}. "${input.title}." ${input.siteName}, ${dateStr}, ${input.url}.`;
}

/**
 * APA 7（网页）
 * Author. (Year, Month Day). Title. Site Name. URL
 */
function apa7(input: CitationInput, _access: Date): string {
  const { y, m, day } = ymd(input.date);
  const author = responsibleAuthor(input);
  return `${author}. (${y}, ${MONTHS_FULL[m]} ${day}). ${input.title}. ${input.siteName}. ${input.url}`;
}

/**
 * Chicago 17（脚注/参考文献，网页）
 * Author. "Title." Site Name. Month Day, Year. URL.
 */
function chicago17(input: CitationInput, _access: Date): string {
  const { y, m, day } = ymd(input.date);
  const author = responsibleAuthor(input);
  return `${author}. "${input.title}." ${input.siteName}. ${MONTHS_FULL[m]} ${day}, ${y}. ${input.url}.`;
}

const FORMATTERS: Record<CitationStyle, (input: CitationInput, access: Date) => string> = {
  gbt7714,
  mla9,
  apa7,
  chicago17,
};

export function citation(input: CitationInput, style: CitationStyle = 'gbt7714'): string {
  const access = input.accessDate ?? new Date();
  const fmt = FORMATTERS[style];
  if (!fmt) throw new Error(`未知引用格式: ${style}`);
  return fmt(input, access);
}

/** 一次生成全部格式，用于页面上的切换展示 */
export function citationAll(input: CitationInput): Record<CitationStyle, string> {
  const access = input.accessDate ?? new Date();
  return {
    gbt7714: gbt7714(input, access),
    mla9: mla9(input, access),
    apa7: apa7(input, access),
    chicago17: chicago17(input, access),
  };
}
