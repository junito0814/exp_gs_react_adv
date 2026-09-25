// lib/options.ts
// 面接条件の選択肢。画面（プルダウン）・API（検証）・プロンプト（表示名）で共有する。
// 選択肢を増減するときはここだけを変える。

export type Option<K extends string = string> = { key: K; label: string };

export const INDUSTRIES = [
    { key: "it", label: "IT" },
    { key: "maker", label: "メーカー" },
    { key: "finance", label: "金融" },
    { key: "trading", label: "商社" },
    { key: "retail", label: "小売・サービス" },
    { key: "medical", label: "医療・福祉" },
    { key: "public", label: "公務員" },
    { key: "other", label: "その他" },
] as const satisfies readonly Option[];
export type IndustryKey = (typeof INDUSTRIES)[number]["key"];

export const JOBS = [
    { key: "engineer", label: "エンジニア" },
    { key: "sales", label: "営業" },
    { key: "planning", label: "企画・マーケ" },
    { key: "clerical", label: "事務" },
    { key: "service", label: "接客・販売" },
    { key: "research", label: "研究・開発" },
    { key: "other", label: "その他" },
] as const satisfies readonly Option[];
export type JobKey = (typeof JOBS)[number]["key"];

export const CAREERS = [
    { key: "new", label: "新卒" },
    { key: "mid", label: "中途" },
] as const satisfies readonly Option[];
export type CareerKey = (typeof CAREERS)[number]["key"];

export const LEVELS = [
    { key: "kind", label: "優しい" },
    { key: "strict", label: "厳しい" },
    { key: "harsh", label: "意地悪" },
] as const satisfies readonly Option[];
export type LevelKey = (typeof LEVELS)[number]["key"];

// 講評モードの定番テーマ（区分で切り替える）。新卒に「転職理由」は出さない
export const TOPICS_BY_CAREER: Record<CareerKey, readonly string[]> = {
    new: ["自己紹介", "ガクチカ", "自己PR", "志望動機", "長所・短所", "挫折経験"],
    mid: ["自己紹介", "職務経歴・実績", "転職理由", "志望動機", "長所・短所", "マネジメント経験"],
};

// 「現職／学部・専攻」欄のラベル（区分で切り替える）
export const BACKGROUND_LABEL: Record<CareerKey, string> = {
    new: "学部・専攻",
    mid: "現職（業界・職種・年数）",
};
export const BACKGROUND_PLACEHOLDER: Record<CareerKey, string> = {
    new: "例：経済学部、独学でプログラミング",
    mid: "例：総合商社 営業企画 10 年",
};

export const INTERVIEW_TURNS = 3;  // 模擬面接の往復数（画面表示とプロンプトで共有）

export const BACKGROUND_MAX = 100; // 現職／学部の最大文字数
export const TOPIC_MAX = 100;      // 自由入力テーマの最大文字数

// キー → 表示名。未知のキーは空文字
export function labelOf(list: readonly Option[], key: string): string {
    return list.find((o) => o.key === key)?.label ?? "";
}

// キーが選択肢に含まれるか
export function isKeyOf<T extends readonly Option[]>(list: T, key: unknown): key is T[number]["key"] {
    return typeof key === "string" && list.some((o) => o.key === key);
}
