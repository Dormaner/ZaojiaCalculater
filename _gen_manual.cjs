/**
 * 《工程造价计算器 用户手册》生成脚本
 * 用法：node _gen_manual.cjs
 * 输出：工程造价计算器用户手册.docx
 */
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, AlignmentType, PageBreak,
  TableOfContents, Footer, PageNumber, SectionType, HeadingLevel,
} = require('docx');

const U = require('./_gen_utils.cjs');
const { BODY_FONT, HEAD_FONT, CAP_FONT } = U;

const contentA = require('./_gen_content_a.cjs');
const contentB = require('./_gen_content_b.cjs');

const PAGE = { width: 11906, height: 16838 }; // A4
const MARGIN = { top: 1440, bottom: 1440, left: 1700, right: 1700 };

const blank = (size = 24, times = 1) =>
  Array.from({ length: times }, () => new Paragraph({ spacing: { line: 320 }, children: [new TextRun({ text: '', size })] }));

const center = (text, size, font, opts = {}) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: opts.before || 0, after: opts.after || 120, line: 400 },
    children: [new TextRun({ text, font, size, bold: !!opts.bold, characterSpacing: opts.characterSpacing })],
  });

/* ---------------------------- 封面 ---------------------------- */
const cover = [
  ...blank(24, 5),
  center('工程造价计算器', 72, HEAD_FONT, { bold: true, after: 200, characterSpacing: 60 }),
  center('用  户  手  册', 44, HEAD_FONT, { after: 600 }),
  ...blank(24, 6),
  center('版　　本：v2.4.0', 26, BODY_FONT, { after: 160 }),
  center('编制日期：2026 年 9 月', 26, BODY_FONT, { after: 160 }),
  center('适用对象：工程造价、工程咨询从业人员', 26, BODY_FONT, { after: 160 }),
  center('编制单位：', 26, BODY_FONT, { after: 160 }),
];

/* ---------------------------- 目录 ---------------------------- */
const tocPage = [
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 320 },
    children: [new TextRun({ text: '目\u3000\u3000录', font: HEAD_FONT, size: 36, bold: true })],
  }),
  new TableOfContents('目录', { hyperlink: true, headingStyleRange: '1-2' }),
];

/* --------------------------- 分节与页脚 --------------------------- */
const footer = new Footer({
  children: [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: '第 ', font: BODY_FONT, size: 18 }),
        new TextRun({ children: [PageNumber.CURRENT], font: BODY_FONT, size: 18 }),
        new TextRun({ text: ' 页', font: BODY_FONT, size: 18 }),
      ],
    }),
  ],
});

/* ---------------------------- 文档 ---------------------------- */
const body = [...contentA(), ...contentB()];

const doc = new Document({
  creator: '工程造价计算器',
  title: '工程造价计算器 用户手册',
  description: '工程造价计算器 v2.4.0 用户手册',
  features: { updateFields: true },
  styles: {
    default: {
      document: {
        run: { font: BODY_FONT, size: 24, color: '000000' },
        paragraph: { spacing: { line: 340 } },
      },
      heading1: {
        run: { font: HEAD_FONT, size: 32, bold: true, color: '000000' },
        paragraph: { spacing: { before: 360, after: 240, line: 400 }, alignment: AlignmentType.LEFT, outlineLevel: 0 },
      },
      heading2: {
        run: { font: HEAD_FONT, size: 27, bold: true, color: '000000' },
        paragraph: { spacing: { before: 280, after: 160, line: 380 }, alignment: AlignmentType.LEFT, outlineLevel: 1 },
      },
      heading3: {
        run: { font: HEAD_FONT, size: 24, bold: true, color: '000000' },
        paragraph: { spacing: { before: 220, after: 120, line: 360 }, alignment: AlignmentType.LEFT, outlineLevel: 2 },
      },
    },
    paragraphStyles: [
      { id: 'TOC1', name: 'toc 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: BODY_FONT, size: 23 }, paragraph: { spacing: { line: 340 } } },
      { id: 'TOC2', name: 'toc 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { font: BODY_FONT, size: 21 }, paragraph: { spacing: { line: 320 }, indent: { left: 420 } } },
    ],
  },
  sections: [
    {
      properties: {
        page: { size: PAGE, margin: MARGIN, pageNumbers: { start: 1 } },
      },
      children: [...cover, new Paragraph({ children: [new PageBreak()] }), ...tocPage],
    },
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: { size: PAGE, margin: MARGIN, pageNumbers: { start: 1 } },
      },
      footers: { default: footer },
      children: body,
    },
  ],
});

const outFile = path.join(__dirname, '工程造价计算器用户手册.docx');
Packer.toBuffer(doc).then((buf) => {
  const write = (p) => {
    fs.writeFileSync(p, buf);
    return p;
  };
  let target = outFile;
  try {
    write(target);
  } catch (e) {
    if (e && e.code === 'EBUSY') {
      target = path.join(__dirname, '工程造价计算器用户手册（修订版）.docx');
      write(target);
      console.log('原文件被占用（可能已在 Word 中打开），已另存为修订版。');
    } else {
      throw e;
    }
  }
  console.log(`生成完成：${target}（${Math.round(buf.length / 1024)} KB）`);
  console.log(`正文块数量：${body.length}`);
});
