import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// ⚠️ Astro 7 破坏性变更（照抄 v5/v6 教程必炸）：
//   1. 本文件位置是 src/content.config.ts（不是 src/content/config.ts）
//   2. type:'content' 已废弃，必须给 loader: glob({ base, pattern })
//   3. 渲染用 render(entry)（函数式），不是 entry.render()
//   4. entry.slug → entry.id，且 id 含目录前缀
//   5. base 相对【项目根】，不是相对本文件；写错不报错，只是集合为空

const LICENSE = z.enum([
  'pd',              // 公有领域
  'cc0',             // CC0 1.0
  'cc-by-4.0',       // CC BY 4.0
  'cc-by-sa-4.0',    // CC BY-SA 4.0
  'cc-by-nc-4.0',    // CC BY-NC 4.0
  'cc-by-nc-sa-4.0', // CC BY-NC-SA 4.0（原创默认）
  'arr',             // 保留所有权利
]);

const LANG = z.enum(['zh-Hans', 'zh-Hant', 'lzh']);

const baseFields = {
  title: z.string().min(1, '标题不能为空'),
  date: z.coerce.date(),
  updated: z.coerce.date().optional(),
  authors: z.array(z.string()).min(1, '至少一个署名'),
  tags: z.array(z.string()).default([]),
  summary: z.string().max(200).optional(),
  license: LICENSE,
  lang: LANG.default('zh-Hans'),
  source: z.string().optional(),
  draft: z.boolean().default(false),
  featured: z.boolean().default(false),
  slug: z.string().optional(),
};

const docs = defineCollection({
  loader: glob({ base: './src/content/docs', pattern: '**/*.{md,mdx}' }),
  schema: z.object({ ...baseFields }),
});

const poems = defineCollection({
  loader: glob({ base: './src/content/poems', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    ...baseFields,
    dynasty: z.string().min(1),
    form: z.enum(['五绝', '七绝', '五律', '七律', '古体', '乐府', '词', '曲', '楚辞', '骈赋', '新诗']),
    ci_pai: z.string().optional(),
    rhyme: z.string().optional(),
  }).refine(
    (d) => d.form !== '词' || !!d.ci_pai,
    { message: 'form 为「词」时必须填写 ci_pai（词牌）', path: ['ci_pai'] },
  ),
});

const essays = defineCollection({
  loader: glob({ base: './src/content/essays', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    ...baseFields,
    genre: z.enum(['记叙', '议论', '说明', '抒情', '散文', '小说', '随笔', '应用文']),
    grade: z.string().optional(),
  }),
});

const excerpts = defineCollection({
  loader: glob({ base: './src/content/excerpts', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    ...baseFields,
    excerpt_from: z.string().min(1, '必须写明整理自何书/何文'),
    excerpt_ref: z.string().min(1, '必须写明卷次/篇次/页码'),
    excerpt_kind: z.enum(['摘录', '题跋', '批注', '校勘', '辑佚', '转载']),
    original_author: z.string().optional(),
  }),
});

export const collections = { docs, poems, essays, excerpts };
