/**
 * 授权模型：license 枚举 → 声明文案
 *
 * 设计要点（私人文集场景）：
 *   - 自己写的诗、文章、文档 → cc-by-nc-sa-4.0（允许署名转载，禁商用）
 *   - 整理转载的他人作品原文 → pd 或原作者授权档（原作版权不因整理而转移）
 *   - 自己的注解、校勘、译文 → 独立授权，与原文分开标注
 */

export type LicenseId =
  | 'pd' | 'cc0' | 'cc-by-4.0' | 'cc-by-sa-4.0'
  | 'cc-by-nc-4.0' | 'cc-by-nc-sa-4.0' | 'arr';

export interface LicenseInfo {
  /** 显示名 */
  name: string;
  /** 官方地址 */
  url?: string;
  /** 能否转载 */
  canReproduce: boolean;
  /** 是否要求署名 */
  requiresAttribution: boolean;
  /** 能否改作 / 商用 */
  canAdapt: boolean;
  canCommercial: boolean;
  /** 简短说明 */
  note: string;
}

export const LICENSES: Record<LicenseId, LicenseInfo> = {
  pd: {
    name: '公有领域',
    canReproduce: true, requiresAttribution: false, canAdapt: true, canCommercial: true,
    note: '作品已进入公有领域，可自由使用，无需授权。',
  },
  cc0: {
    name: 'CC0 1.0 公共领域贡献',
    url: 'https://creativecommons.org/publicdomain/zero/1.0/',
    canReproduce: true, requiresAttribution: false, canAdapt: true, canCommercial: true,
    note: '作者放弃全部权利，可自由使用。',
  },
  'cc-by-4.0': {
    name: 'CC BY 4.0',
    url: 'https://creativecommons.org/licenses/by/4.0/',
    canReproduce: true, requiresAttribution: true, canAdapt: true, canCommercial: true,
    note: '可自由转载、改作（含商用），须署名。',
  },
  'cc-by-sa-4.0': {
    name: 'CC BY-SA 4.0',
    url: 'https://creativecommons.org/licenses/by-sa/4.0/',
    canReproduce: true, requiresAttribution: true, canAdapt: true, canCommercial: true,
    note: '可自由转载、改作（含商用），须署名，且改作须以相同协议共享。',
  },
  'cc-by-nc-4.0': {
    name: 'CC BY-NC 4.0',
    url: 'https://creativecommons.org/licenses/by-nc/4.0/',
    canReproduce: true, requiresAttribution: true, canAdapt: true, canCommercial: false,
    note: '可自由转载、改作，须署名，不得用于商业目的。',
  },
  'cc-by-nc-sa-4.0': {
    name: 'CC BY-NC-SA 4.0',
    url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/',
    canReproduce: true, requiresAttribution: true, canAdapt: true, canCommercial: false,
    note: '可自由转载、改作，须署名，不得商用，改作须以相同协议共享。',
  },
  arr: {
    name: '保留所有权利',
    canReproduce: false, requiresAttribution: true, canAdapt: false, canCommercial: false,
    note: '未经作者许可，不得转载或改作。',
  },
};

export function getLicense(id: string): LicenseInfo {
  return LICENSES[id as LicenseId] ?? LICENSES.arr;
}

/**
 * 生成页脚授权声明（按栏目区分文案）
 * @param licenseId frontmatter 中的 license
 * @param url       本文绝对地址
 * @param section   所属栏目
 * @param author    署名
 */
export function licenseStatement(
  licenseId: string,
  url: string,
  section: string,
  author: string,
): string {
  const info = getLicense(licenseId);

  if (section === 'excerpts') {
    return [
      `本文原作版权归原作者所有（或已进入公有领域），本站仅作整理转载，不主张原作权利。`,
      `整理、注释部分为${author}成果，采用 ${info.name} 授权：${info.note}`,
      `原文链接：${url}`,
    ].join('\n');
  }

  if (licenseId === 'arr') {
    return [
      `本文为${author}原创作品，保留所有权利。`,
      `未经作者许可，不得转载或改作。`,
      `原文链接：${url}`,
    ].join('\n');
  }

  return [
    `本文为${author}原创作品，采用 ${info.name} 授权：${info.note}`,
    `转载请注明作者与原文链接：${url}`,
  ].join('\n');
}
