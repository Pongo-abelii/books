/**
 * URL 帮助函数
 *
 * 站点支持两种部署形态（见 astro.config.mjs）：
 *   A. 自定义域名 books.ailmel.top → BASE_URL = '/'
 *   B. GitHub Pages 项目站点       → BASE_URL = '/books'
 *
 * 站内所有链接都必须经 url() 处理，否则在形态 B 下会指向站点根、404。
 * Astro 不会自动重写 HTML 中的 href。
 */

const BASE = import.meta.env.BASE_URL || '/';

/** 把站内绝对路径加上 base 前缀 */
export function url(path: string): string {
  const b = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}`;
}

/** 当前 base 前缀（无尾斜杠），供需要自行拼接的场合使用 */
export const basePrefix = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;
