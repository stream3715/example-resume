export class LocaleConfig {
  static readonly ja_JP: LocaleDetail = {
    splitChar: "",
    punctuation: ["、", "。", "「", "」", "，", "．"],
  };

  static readonly C: LocaleDetail = {
    splitChar: " ",
    punctuation: [],
  };
}

export interface LocaleDetail {
  splitChar: string;
  punctuation: string[];
}
