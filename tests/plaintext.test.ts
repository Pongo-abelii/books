import { describe, it, expect } from 'vitest';
import { toPlainText, stripMarkdown, markdownToPlainText, addParagraphAnchors } from '../src/lib/plaintext';

describe('toPlainText（输入是渲染后的 HTML）', () => {
  it('段落转换为换行分隔，不产生空行', () => {
    expect(toPlainText('<p>一</p><p>二</p>')).toBe('一\n二');
  });

  it('多段落保持单换行', () => {
    expect(toPlainText('<p>一</p><p>二</p><p>三</p>')).toBe('一\n二\n三');
  });

  it('诗句两行紧邻', () => {
    expect(toPlainText('<p>西风入雨寒，高树湿尘鞍。</p><p>陌上行人远，灯前语未阑。</p>'))
      .toBe('西风入雨寒，高树湿尘鞍。\n陌上行人远，灯前语未阑。');
  });

  it('去掉行内标签', () => {
    expect(toPlainText('<p><em>斜</em><strong>体</strong></p>')).toBe('斜体');
  });

  it('链接保留文字', () => {
    expect(toPlainText('<p>见<a href="/x/">此处</a></p>')).toBe('见此处');
  });

  it('ruby 注音只留字', () => {
    expect(toPlainText('<p><ruby>字<rt>zì</rt></ruby></p>')).toBe('字');
  });

  it('列表项加圆点与空格', () => {
    expect(toPlainText('<ul><li>甲</li><li>乙</li></ul>')).toBe('· 甲\n· 乙');
  });

  it('br 转换行', () => {
    expect(toPlainText('<p>一<br>二</p>')).toBe('一\n二');
  });

  it('解码常用实体且保留空格', () => {
    expect(toPlainText('<p>&lt;a&gt; &amp; &quot;b&quot;</p>')).toBe('<a> & "b"');
  });

  it('去掉 script 与 style', () => {
    expect(toPlainText('<script>bad()</script><p>好</p><style>x{}</style>')).toBe('好');
  });

  it('表格单元格用制表符', () => {
    expect(toPlainText('<table><tr><td>甲</td><td>乙</td></tr></table>')).toBe('甲\t乙');
  });

  it('空输入返回空串', () => {
    expect(toPlainText('')).toBe('');
  });
});

describe('stripMarkdown / markdownToPlainText（输入是 Markdown 原文）', () => {
  it('去掉 frontmatter', () => {
    expect(stripMarkdown('---\ntitle: x\n---\n正文')).toBe('正文');
  });

  it('去掉标题标记', () => {
    expect(stripMarkdown('## 标题')).toBe('标题');
  });

  it('链接保留文字', () => {
    expect(stripMarkdown('[文字](https://x.com)')).toBe('文字');
  });

  it('去掉图片', () => {
    expect(stripMarkdown('前![图](/a.png)后')).toBe('前后');
  });

  it('去掉强调标记', () => {
    expect(stripMarkdown('**粗** 与 *斜*')).toBe('粗 与 斜');
  });

  it('引用标记去除', () => {
    expect(stripMarkdown('> 引文')).toBe('引文');
  });

  it('分隔线去除且不产生多余空行', () => {
    expect(stripMarkdown('正文\n\n---\n\n附')).toBe('正文\n\n附');
  });

  it('markdownToPlainText 是 stripMarkdown 的语义化别名', () => {
    const md = '西风入雨寒，高树湿尘鞍。\n\n陌上行人远，灯前语未阑。\n\n---\n\n*附：不重字。*';
    expect(markdownToPlainText(md)).toBe(
      '西风入雨寒，高树湿尘鞍。\n\n陌上行人远，灯前语未阑。\n\n附：不重字。',
    );
  });
});

describe('addParagraphAnchors', () => {
  it('给段落加递增 id', () => {
    expect(addParagraphAnchors('<p>一</p><p>二</p>')).toBe('<p id="p1">一</p><p id="p2">二</p>');
  });

  it('已有 id 的段落不覆盖', () => {
    const out = addParagraphAnchors('<p id="keep">一</p><p>二</p>');
    expect(out).toContain('id="keep"');
    expect(out).toContain('id="p1"');
  });

  it('保留原有属性', () => {
    expect(addParagraphAnchors('<p class="x">一</p>')).toBe('<p class="x" id="p1">一</p>');
  });
});
