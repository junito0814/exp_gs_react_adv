// lib/conditions.ts
// 面接条件の型と、URL クエリ ⇄ オブジェクト の変換。
// トップ画面で選んだ条件は URL クエリで /practice /interview に渡す（リロードしても残る）。
import {
    INDUSTRIES, JOBS, CAREERS, LEVELS, STAGES, COMPANIES,
    BACKGROUND_MAX, isKeyOf, labelOf,
    type IndustryKey, type JobKey, type CareerKey, type LevelKey,
    type StageKey, type CompanyKey,
} from "./options";

export type Conditions = {
    industry: IndustryKey;   // 志望業界
    job: JobKey;             // 志望職種
    career: CareerKey;       // 新卒 / 中途
    level: LevelKey;         // 面接官レベル
    background: string;      // 現職（中途）/ 学部・専攻（新卒）。任意
    stage: StageKey;         // 面接の段階（一次 / 二次 / 最終）
    company: CompanyKey;     // 企業の規模・タイプ
};

export const DEFAULT_CONDITIONS: Conditions = {
    industry: "it",
    job: "engineer",
    career: "new",
    level: "kind",
    background: "",
    stage: "first",
    company: "large",
};

const KEYS = ["industry", "job", "career", "level", "background", "stage", "company"] as const;

// searchParams（Next.js の `await searchParams` の結果や URLSearchParams、API body）から条件を組み立てる。
// 不正な値は初期値に丸め、background は 100 文字で切り詰める。
// isEmpty: 条件のキーが 1 つも無かった（= 直接 URL を開いた）とき true
export function parseConditions(
    input: Record<string, string | string[] | undefined> | URLSearchParams | null | undefined,
): Conditions & { isEmpty: boolean } {
    const get = (k: string): string | undefined => {
        if (!input) return undefined;
        if (input instanceof URLSearchParams) return input.get(k) ?? undefined;
        const v = input[k];
        return Array.isArray(v) ? v[0] : v;
    };
    const isEmpty = KEYS.every((k) => get(k) === undefined);
    const industry = get("industry"), job = get("job"), career = get("career"), level = get("level");
    const stage = get("stage"), company = get("company");
    return {
        industry: isKeyOf(INDUSTRIES, industry) ? industry : DEFAULT_CONDITIONS.industry,
        job: isKeyOf(JOBS, job) ? job : DEFAULT_CONDITIONS.job,
        career: isKeyOf(CAREERS, career) ? career : DEFAULT_CONDITIONS.career,
        level: isKeyOf(LEVELS, level) ? level : DEFAULT_CONDITIONS.level,
        background: (get("background") ?? "").trim().slice(0, BACKGROUND_MAX),
        stage: isKeyOf(STAGES, stage) ? stage : DEFAULT_CONDITIONS.stage,
        company: isKeyOf(COMPANIES, company) ? company : DEFAULT_CONDITIONS.company,
        isEmpty,
    };
}

// 条件 → クエリ文字列（先頭の ? は付けない）。空の background は省略
export function toQuery(c: Conditions): string {
    const p = new URLSearchParams({
        industry: c.industry, job: c.job, career: c.career, level: c.level,
        stage: c.stage, company: c.company,
    });
    if (c.background) p.set("background", c.background);
    return p.toString();
}

// 画面上部・履歴の表示用：「IT／エンジニア／新卒／一次／大手／やさしめ」
// DB の行もそのまま渡せる。stage / company を持たない古い記録（null）はその欄を飛ばす
export function describeConditions(c: {
    industry: string; job: string; career: string; level: string;
    stage?: string | null; company?: string | null;
}): string {
    return [
        labelOf(INDUSTRIES, c.industry),
        labelOf(JOBS, c.job),
        labelOf(CAREERS, c.career),
        labelOf(STAGES, c.stage ?? ""),
        labelOf(COMPANIES, c.company ?? ""),
        labelOf(LEVELS, c.level),
    ].filter(Boolean).join("／");
}
