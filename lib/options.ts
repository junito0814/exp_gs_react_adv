// lib/options.ts
// 面接条件の選択肢。画面（プルダウン）・API（検証）・プロンプト（表示名）で共有する。
// 選択肢を増減するときはここだけを変える。

export type Option<K extends string = string> = { key: K; label: string; description?: string };

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

// 面接官の当たりの強さ。当初は「優しい／厳しい／意地悪」だったが、
// 「意地悪」は性格を指して軸がずれており、AI が不誠実な質問（言っていないことの決めつけ）をしたため、
// 圧迫面接という既成の言葉に変更した（#43）
export const LEVELS = [
    { key: "kind", label: "やさしめ", description: "肯定から入り、答えやすい形で深掘りします" },
    { key: "strict", label: "厳しめ", description: "根拠・数字・具体例を求めます" },
    { key: "harsh", label: "圧迫", description: "矛盾や弱点を突き、詰めてきます（圧迫面接の練習）" },
] as const satisfies readonly Option[];
export type LevelKey = (typeof LEVELS)[number]["key"];

// 面接の段階。同じ志望先でも、一次と最終では聞かれることが変わる（US-24）
export const STAGES = [
    { key: "first", label: "一次", description: "人物と基本を広く確認します（自己紹介・経歴・志望動機の概要）" },
    { key: "second", label: "二次", description: "経験を深く掘ります（役割・行動・数字の根拠）" },
    { key: "final", label: "最終", description: "志望度と入社後を問います（なぜ当社か・入社後にどうしたいか）" },
] as const satisfies readonly Option[];
export type StageKey = (typeof STAGES)[number]["key"];

// 企業の規模・タイプ。志望動機の突き方が変わる
export const COMPANIES = [
    { key: "large", label: "大手", description: "規模・制度・組織の中での立ち回りを問われます" },
    { key: "sme", label: "中小", description: "裁量の広さと、一人で複数の役割を担えるかを問われます" },
    { key: "startup", label: "ベンチャー", description: "変化への適応と自走できるかを問われます" },
    { key: "public", label: "公的機関", description: "公共性・公平性と、なぜ民間でないのかを問われます" },
] as const satisfies readonly Option[];
export type CompanyKey = (typeof COMPANIES)[number]["key"];

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

// キー → 説明文（画面に添える）。無ければ空文字
export function descriptionOf(list: readonly Option[], key: string): string {
    return list.find((o) => o.key === key)?.description ?? "";
}

// キーが選択肢に含まれるか
export function isKeyOf<T extends readonly Option[]>(list: T, key: unknown): key is T[number]["key"] {
    return typeof key === "string" && list.some((o) => o.key === key);
}
