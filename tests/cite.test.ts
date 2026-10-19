import { describe, it, expect } from 'vitest';
import { citation, citationAll, CITATION_STYLE_LABELS } from '../src/lib/cite';

const base = {
  authors: ['江栖'],
  title: '秋情',
  siteName: '江栖文集',
  url: 'https://books.ailmel.top/poems/qiuse/',
  date: new Date(Date.UTC(2026, 9, 18)), // 2026-10-18
  accessDate: new Date(Date.UTC(2026, 9, 19)), // 2026-10-19
};

describe('citation — GB/T 7714-2015', () => {
  it('生成电子资源格式', () => {
    const s = citation(base, 'gbt7714');
    expect(s).toContain('江栖');
    expect(s).toContain('秋情[EB/OL]');
    expect(s).toContain('(2026-10-18)');
    expect(s).toContain('[2026-10-19]');
    expect(s).toContain('https://books.ailmel.top/poems/qiuse/');
  });

  it('整理类内容以原作者为主要责任者', () => {
    const s = citation({ ...base, originalAuthor: '陶渊明' }, 'gbt7714');
    expect(s.startsWith('陶渊明.')).toBe(true);
    expect(s).not.toContain('江栖.');
  });
});

describe('citation — MLA 9', () => {
  it('含站点名、日期与 URL', () => {
    const s = citation(base, 'mla9');
    expect(s).toBe('江栖. "秋情." 江栖文集, 18 Oct. 2026, https://books.ailmel.top/poems/qiuse/.');
  });
});

describe('citation — APA 7', () => {
  it('含年份与完整月份名', () => {
    const s = citation(base, 'apa7');
    expect(s).toBe('江栖. (2026, October 18). 秋情. 江栖文集. https://books.ailmel.top/poems/qiuse/');
  });
});

describe('citation — Chicago 17', () => {
  it('含完整月份名与日期', () => {
    const s = citation(base, 'chicago17');
    expect(s).toBe('江栖. "秋情." 江栖文集. October 18, 2026. https://books.ailmel.top/poems/qiuse/.');
  });
});

describe('citation — 边界', () => {
  it('未知格式抛错', () => {
    // @ts-expect-error 故意传非法值
    expect(() => citation(base, 'bogus')).toThrow('未知引用格式');
  });

  it('缺省 accessDate 用当前时间', () => {
    const { accessDate, ...noAccess } = base;
    const s = citation(noAccess, 'gbt7714');
    expect(s).toMatch(/\[\d{4}-\d{2}-\d{2}\]/);
  });

  it('citationAll 返回四种格式', () => {
    const all = citationAll(base);
    expect(Object.keys(all).sort()).toEqual(['apa7', 'chicago17', 'gbt7714', 'mla9']);
  });

  it('四种格式标签齐全', () => {
    expect(Object.keys(CITATION_STYLE_LABELS)).toHaveLength(4);
  });

  it('UTC 取值不受本地时区影响（UTC+8 下不倒退一天）', () => {
    // 2026-10-18T00:00:00Z 在 UTC+8 是 10-18 08:00，不应出现 10-17
    const s = citation(base, 'gbt7714');
    expect(s).toContain('2026-10-18');
    expect(s).not.toContain('2026-10-17');
  });
});
