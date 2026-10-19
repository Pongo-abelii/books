/**
 * 站点常量与栏目元数据
 */

export const SITE = {
  /** 站点名（站内展示） */
  title: '江栖文集',
  /** 站点短名 */
  shortTitle: '江栖文集',
  /** 作者笔名 */
  author: '江栖',
  description: '江栖的个人诗文文集：自作诗词、文章，以及整理转载的佳作。',
  /** 站点正式地址，与 astro.config.mjs 的 site 保持一致 */
  url: 'https://books.ailmel.top',
  lang: 'zh-Hans',
  locale: 'zh_CN',
  /** 建站年份，用于页脚 */
  since: 2026,
} as const;

/** 栏目定义：路径段 → 元数据 */
export const SECTIONS = {
  docs: { path: 'docs', name: '文档', desc: '说明、随笔与工具性长文' },
  poems: { path: 'poems', name: '古诗', desc: '诗、词、曲、赋' },
  essays: { path: 'essays', name: '作文', desc: '记叙、议论、散文等成篇文字' },
  excerpts: { path: 'excerpts', name: '整理', desc: '他处佳作的整理与转载，标注出处' },
} as const;

export type SectionKey = keyof typeof SECTIONS;

/** 栏目顺序，用于首页与导航 */
export const SECTION_ORDER: SectionKey[] = ['poems', 'essays', 'docs', 'excerpts'];

/** 导航项 */
export const NAV = [
  { href: '/poems/', label: '古诗' },
  { href: '/essays/', label: '作文' },
  { href: '/docs/', label: '文档' },
  { href: '/excerpts/', label: '整理' },
  { href: '/search/', label: '搜索' },
  { href: '/about/', label: '关于' },
] as const;

/** 朝代排序（用于聚合页排序） */
export const DYNASTY_ORDER = [
  '先秦', '秦', '汉', '魏晋', '南北朝', '隋', '唐', '五代', '宋', '辽', '金', '元', '明', '清', '近现代', '当代',
] as const;
