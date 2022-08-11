import { PDFFont, PDFPage } from "pdf-lib";
import { LocaleConfig, LocaleDetail } from "./locale";
import { Coordinate } from "./types";

export const mmToPoints = (mm: number): number => {
  return (mm / 25.4) * 72;
};

export type RenderTextOptions = Coordinate & {
  /**
   * @description font size
   */
  size: number;
  /**
   * @description line height
   */
  lineHeight?: number;
  /**
   * @description vertical alignment
   * @default "middle"
   */
  verticalAlign?: "top" | "middle" | "bottom";
  /**
   * @description horizontal alignment
   * @default "left"
   */
  horizontalAlign?: "left" | "center" | "right";
  /**
   * @description vertical offset
   * @default 0
   */
  verticalOffset?: number;
  /**
   * @description horizontal offset
   * @default 0
   */
  horizontalOffset?: number;
  /**
   * @description locale settings
   * @default C
   */
  locale?: LocaleDetail;
};

const breakSentenceIntoMultipleLines = (
  sentence: string,
  options: {
    maxWidth: number;
    font: PDFFont;
    fontSize: number;
    locale: LocaleDetail;
  }
) => {
  const elements = sentence.split(options.locale.splitChar);
  const lines: string[] = [];
  let line = "";

  for (let [i, e] of elements.entries()) {
    const nextLineState = `${line}${options.locale.splitChar}${e}`;
    if (
      options.font.widthOfTextAtSize(nextLineState, options.fontSize) <=
      options.maxWidth
    ) {
      if (
        options.locale.splitChar === "" &&
        options.locale.punctuation.includes(elements[i + 1]) &&
        options.font.widthOfTextAtSize(
          `${nextLineState}${elements[i + 1]}`,
          options.fontSize
        ) > options.maxWidth
      ) {
        lines.push(line);
        line = e ?? "";
      } else {
        if (line !== "" && options.locale.splitChar !== "") {
          line += options.locale.splitChar;
        }
        line += e;
      }
    } else {
      lines.push(line);
      line = e ?? "";
    }
  }
  if (line.length > 0) {
    lines.push(line);
  }
  return lines;
};

export const breakTextIntoLines = (
  text: string,
  options: {
    maxWidth: number;
    font: PDFFont;
    fontSize: number;
    locale: LocaleDetail;
  }
) => {
  // まず入力を行ごとに分割
  const rawLines = text.split(/\n?\r\n/);
  // 行ごとに改行対応し、結合して返却
  return rawLines
    .map((line) => breakSentenceIntoMultipleLines(line, options))
    .reduce((acc, elm) => acc.concat(elm));
};

export class PDFTextRenderer {
  constructor(private readonly page: PDFPage, private readonly font: PDFFont) {}

  renderText(text: string, opt: RenderTextOptions) {
    const {
      size: fontSize,
      lineHeight = fontSize,
      horizontalAlign = "left",
      verticalAlign = "middle",
      horizontalOffset = 0,
      verticalOffset = 0,
      locale = LocaleConfig.C,
    } = opt;

    const { height: pageHeight } = this.page.getSize();
    const textHeight = this.font.heightAtSize(fontSize, { descender: false });

    const lines = breakTextIntoLines(text, {
      maxWidth: opt.w,
      font: this.font,
      fontSize,
      locale,
    });

    const boxHeight = textHeight + lineHeight * (lines.length - 1);

    let top_left_origin_y = pageHeight - opt.y - opt.h;
    switch (verticalAlign) {
      case "top":
        top_left_origin_y -= boxHeight - opt.h;
        break;
      case "middle":
        top_left_origin_y -= (boxHeight - opt.h) / 2;
        break;
    }

    lines.forEach((line, i) => {
      let hOffset = horizontalOffset;
      {
        const lineWidth = this.font.widthOfTextAtSize(line.trim(), fontSize);
        if (horizontalAlign === "center") {
          hOffset += (opt.w - lineWidth) / 2;
        } else if (horizontalAlign === "right") {
          hOffset += opt.w - lineWidth;
        }
      }

      let vOffset = verticalOffset;
      vOffset += lineHeight * (i - lines.length + 1);

      this.page.drawText(line, {
        x: opt.x + hOffset,
        y: top_left_origin_y - vOffset,
        font: this.font,
        size: fontSize,
      });
    });
  }
}
