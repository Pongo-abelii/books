# 江栖文集

个人诗文文集静态站点。发布自作诗词、文章，以及整理转载的佳作。

- **线上地址**：https://books.ailmel.top
- **仓库**：https://github.com/Pongo-abelii/books
- **署名**：江栖

## 技术栈

| 组件 | 用途 |
|---|---|
| [Astro](https://astro.build) 7 | 静态站点生成，默认零 JS |
| Content Collections + zod | 内容 schema 构建期校验 |
| [Pagefind](https://pagefind.app) | 全站搜索，构建期生成索引，原生支持中文 |
| GitHub Pages | 托管 |
| GitHub Actions | 构建与部署 |

## 本地开发

```bash
npm ci
npm run dev        # 开发服务器
npm run check      # 类型检查 + 内容门禁
npm test           # 单元测试
npm run build      # 构建（产物在 dist/）
npm run search     # 构建后生成搜索索引
```

## 目录结构

```
src/
├─ content.config.ts      内容集合 schema（Astro 7：在 src/ 下，不在 src/content/ 下）
├─ consts.ts              站点常量、栏目定义
├─ lib/
│  ├─ cite.ts             引用格式生成（GB/T 7714 / MLA 9 / APA 7 / Chicago 17）
│  ├─ plaintext.ts        HTML → 纯文本
│  ├─ content.ts          内容查询、URL、聚合
│  ├─ license.ts          授权模型
│  └─ url.ts              站内链接的 base 处理
├─ content/
│  ├─ docs/               文档
│  ├─ poems/              古诗
│  ├─ essays/             作文
│  └─ excerpts/           整理（转载他人佳作）
├─ layouts/               Base / Entry
├─ components/            CopyBar / CitationBox / LicenseBar / EntryList
├─ pages/                 页面路由
└─ styles/global.css
scripts/check-content.mjs 内容门禁
tests/                    单元测试
```

## 写一篇内容

在对应栏目目录下新建 `.md` 文件，文件名用拼音或英译（**不要用中文**，会被 URL 编码），中文标题写在 frontmatter 里。

诗词示例：

```yaml
---
title: 秋情
date: 2026-10-18
authors: [江栖]
tags: [五言, 秋]
license: cc-by-nc-sa-4.0
dynasty: 当代
form: 五绝
---
```

整理转载示例（`src/content/excerpts/`）：

```yaml
---
title: 归去来兮辞
date: 2026-10-19
authors: [江栖]
license: pd
excerpt_from: 陶渊明集
excerpt_ref: 卷五
excerpt_kind: 转载
original_author: 陶渊明
---
```

字段说明见 `src/content.config.ts`。缺字段或取值非法会在构建时报错。

## 抄录与转载

每篇正文上方有抄录工具条（纯文本 / Markdown / 带出处 / 链接 / 分享 / 打印），
页脚有四种引用格式，另有稳定纯文本端点：

```
https://books.ailmel.top/raw/<路径>.txt
```

## 授权

- 原创作品：CC BY-NC-SA 4.0
- 整理转载内容：原作权利归原作者，整理部分 CC BY-NC-SA 4.0

## 部署

推送到 `main` 即触发 Actions 构建与部署。

### 两种部署形态

`astro.config.mjs` 按 `public/CNAME` 是否存在自动切换：

| 形态 | CNAME | site | base |
|---|---|---|---|
| 自定义域名 | 存在 | `https://books.ailmel.top` | `/` |
| Pages 项目站点 | 不存在 | `https://pongo-abelii.github.io` | `/books` |

接入自定义域名时，加 `public/CNAME`（内容为域名）；若 Cloudflare 托管 DNS，
记录必须是 **DNS only（灰云）**，否则会破坏 GitHub Pages 的证书签发。

## 注意

本仓库为公开仓库。**任何凭据、token、密钥都不要写进本仓库的任何文件。**
