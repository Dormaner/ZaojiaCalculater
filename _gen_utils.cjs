/**
 * 《工程造价计算器 用户手册》生成脚本 —— 公共排版工具
 * 依赖：docx（node_modules 内已安装）
 */
const fs = require('fs');
const path = require('path');
const {
  Paragraph,
  TextRun,
  HeadingLevel,
  ImageRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  VerticalAlign,
  PageBreak,
  TableOfContents,
  Footer,
  PageNumber,
  SectionType,
} = require('docx');

const ROOT = __dirname;
const SHOT_DIR = path.join(ROOT, '用户手册_截图');

/** 正文字体：中文宋体 / 西文 Times New Roman；标题字体：微软雅黑 */
const BODY_FONT = { ascii: 'Times New Roman', hAnsi: 'Times New Roman', eastAsia: '宋体', cs: 'Times New Roman' };
const HEAD_FONT = { ascii: 'Arial', hAnsi: 'Arial', eastAsia: '微软雅黑', cs: 'Arial' };
const CAP_FONT = { ascii: 'Times New Roman', hAnsi: 'Times New Roman', eastAsia: '楷体', cs: 'Times New Roman' };

const NONE_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const LINE_BORDER = { style: BorderStyle.SINGLE, size: 8, color: '000000' };
const THICK_BORDER = { style: BorderStyle.SINGLE, size: 14, color: '000000' };
const THIN_BORDER = { style: BorderStyle.SINGLE, size: 6, color: '000000' };

/** 待核实内容的标注颜色（红色） */
const RED = 'FF0000';
/** 单元格/文字使用 { red: '文字' } 表示以红色输出 */
const isRed = (v) => !!v && typeof v === 'object' && typeof v.red === 'string';
const cellText = (v) => (isRed(v) ? v.red : v);
const cellColor = (v) => (isRed(v) ? RED : undefined);

/** 红色提示段落（用于标注未能核实的政府文件信息） */
const pRed = (text) =>
  new Paragraph({
    alignment: AlignmentType.BOTH,
    spacing: { line: 320, before: 60, after: 120 },
    indent: { firstLine: 480 },
    children: [new TextRun({ text, font: BODY_FONT, size: 21, color: RED })],
  });

/* ------------------------------------------------------------------ */
/* 标题                                                                */
/* ------------------------------------------------------------------ */

const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text, font: HEAD_FONT })] });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text, font: HEAD_FONT })] });
const h3 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun({ text, font: HEAD_FONT })] });

/* ------------------------------------------------------------------ */
/* 正文段落                                                            */
/* ------------------------------------------------------------------ */

/** 正文段落（首行缩进 2 字符） */
const p = (text, opts = {}) =>
  new Paragraph({
    alignment: opts.align || AlignmentType.BOTH,
    spacing: { line: 340, before: 40, after: 40 },
    indent: opts.noIndent ? undefined : { firstLine: 480 },
    children: [new TextRun({ text, font: BODY_FONT, size: 24, bold: !!opts.bold })],
  });

/** 正文段落（无缩进，用于题注、说明、列表前导语） */
const pl = (text, opts = {}) => p(text, Object.assign({}, opts, { noIndent: true }));

/** 带项目符号的条目（悬挂缩进） */
const item = (text, level = 0) =>
  new Paragraph({
    alignment: AlignmentType.BOTH,
    spacing: { line: 320, before: 30, after: 30 },
    indent: { left: 420 + level * 360, hanging: 300 },
    children: [new TextRun({ text: `（${text.slice(0, 0)}）` === '（）' ? text : text, font: BODY_FONT, size: 24 })],
  });

/** 圆点条目 */
const dot = (text, level = 0) =>
  new Paragraph({
    alignment: AlignmentType.BOTH,
    spacing: { line: 320, before: 30, after: 30 },
    indent: { left: 420 + level * 360, hanging: 260 },
    children: [new TextRun({ text: `·\u3000${text}`, font: BODY_FONT, size: 24 })],
  });

/** 提示框文本（楷体小一号） */
const tip = (text) =>
  new Paragraph({
    alignment: AlignmentType.BOTH,
    spacing: { line: 320, before: 80, after: 80 },
    indent: { left: 300, right: 300, firstLine: 0 },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: '808080', space: 8 } },
    children: [new TextRun({ text, font: CAP_FONT, size: 21 })],
  });

/* ------------------------------------------------------------------ */
/* 图与图注                                                            */
/* ------------------------------------------------------------------ */

const imgData = (file) => fs.readFileSync(path.join(SHOT_DIR, file));

/** 图片段落（原图 390 × 844，按宽度等比缩放） */
const figure = (file, widthPx) => {
  const heightPx = Math.round((widthPx * 844) / 390);
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 120, after: 60 },
    children: [new ImageRun({ type: 'png', data: imgData(file), transformation: { width: widthPx, height: heightPx } })],
  });
};

/** 图注 */
const cap = (text) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 20, after: 200 },
    children: [new TextRun({ text, font: CAP_FONT, size: 19 })],
  });

/** 单图（通栏居中） */
const fig = (file, caption) => [figure(file, 210), cap(caption)];

/** 双图并排（无边框表格承载） */
const fig2 = (a, ca, b, cb) => {
  const cell = (file, caption) =>
    new TableCell({
      width: { size: 50, type: WidthType.PERCENTAGE },
      verticalAlign: VerticalAlign.TOP,
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
      children: [figure(file, 165), cap(caption)],
    });
  return [
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: NONE_BORDER, bottom: NONE_BORDER, left: NONE_BORDER, right: NONE_BORDER,
        insideHorizontal: NONE_BORDER, insideVertical: NONE_BORDER,
      },
      rows: [new TableRow({ children: [cell(a, ca), cell(b, cb)] })],
    }),
  ];
};

/* ------------------------------------------------------------------ */
/* 表格                                                                */
/* ------------------------------------------------------------------ */

/**
 * 三线表
 * @param {string[]} headers 表头
 * @param {string[][]} rows 数据行
 * @param {number[]} widths 各列百分比宽度（合计 100）
 */
const table = (headers, rows, widths, opts = {}) => {
  const size = opts.size || 19;
  const mk = (text, bold, align, headBorder) =>
    new TableCell({
      width: { size: widths[0] ? undefined : 100, type: WidthType.PERCENTAGE },
      verticalAlign: VerticalAlign.CENTER,
      margins: { top: 50, bottom: 50, left: 70, right: 70 },
      borders: {
        top: NONE_BORDER,
        left: NONE_BORDER,
        right: NONE_BORDER,
        bottom: headBorder ? THIN_BORDER : NONE_BORDER,
      },
      children: [
        new Paragraph({
          alignment: align,
          spacing: { line: 260, before: 10, after: 10 },
          children: [new TextRun({ text: String(text ?? ''), font: BODY_FONT, size, bold })],
        }),
      ],
    });

  const w = (i) => ({ size: widths[i], type: WidthType.PERCENTAGE });

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((t, i) =>
      new TableCell({
        width: w(i),
        verticalAlign: VerticalAlign.CENTER,
        margins: { top: 50, bottom: 50, left: 70, right: 70 },
        borders: { top: THICK_BORDER, left: NONE_BORDER, right: NONE_BORDER, bottom: THIN_BORDER },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: 260, before: 10, after: 10 },
            children: [new TextRun({ text: String(cellText(t)), font: BODY_FONT, size, bold: true, color: cellColor(t) })],
          }),
        ],
      }),
    ),
  });

  const bodyRows = rows.map(
    (r, ri) =>
      new TableRow({
        children: r.map((t, i) =>
          new TableCell({
            width: w(i),
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 50, bottom: 50, left: 70, right: 70 },
            borders: {
              top: NONE_BORDER, left: NONE_BORDER, right: NONE_BORDER,
              bottom: ri === rows.length - 1 ? THICK_BORDER : NONE_BORDER,
            },
            children: [
              new Paragraph({
                alignment: i === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
                spacing: { line: 260, before: 10, after: 10 },
                children: [new TextRun({ text: String(cellText(t) ?? ''), font: BODY_FONT, size, color: cellColor(t) })],
              }),
            ],
          }),
        ),
      }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: NONE_BORDER, bottom: NONE_BORDER, left: NONE_BORDER, right: NONE_BORDER,
      insideHorizontal: NONE_BORDER, insideVertical: NONE_BORDER,
    },
    rows: [headerRow, ...bodyRows],
  });
};

/** 表标题（置于表上方，居中） */
const tabCap = (text) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 180, after: 90 },
    children: [new TextRun({ text, font: BODY_FONT, size: 21, bold: true })],
  });

/** 表下注释 */
const tabNote = (text) =>
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { before: 70, after: 180 },
    children: [new TextRun({ text, font: CAP_FONT, size: 19 })],
  });

/* ------------------------------------------------------------------ */
/* 报告示例（等宽文本块）                                              */
/* ------------------------------------------------------------------ */

const reportBlock = (lines) =>
  lines.map(
    (line, i) =>
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: 280, before: i === 0 ? 60 : 0, after: 0 },
        indent: { left: 300, right: 200 },
        children: [new TextRun({ text: line || '\u3000', font: { ascii: 'Consolas', hAnsi: 'Consolas', eastAsia: '宋体', cs: 'Consolas' }, size: 19 })],
      }),
  );

const pageBreak = () => new Paragraph({ children: [new PageBreak()] });

module.exports = {
  ROOT, SHOT_DIR,
  BODY_FONT, HEAD_FONT, CAP_FONT,
  NONE_BORDER, LINE_BORDER, THICK_BORDER, THIN_BORDER, RED,
  pRed,
  Paragraph, TextRun, HeadingLevel, ImageRun, Table, TableRow, TableCell,
  WidthType, AlignmentType, BorderStyle, ShadingType, VerticalAlign,
  PageBreak, TableOfContents, Footer, PageNumber, SectionType,
  h1, h2, h3, p, pl, item, dot, tip,
  fig, fig2, figure, cap, table, tabCap, tabNote, reportBlock, pageBreak,
};
