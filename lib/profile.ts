// lib/profile.ts — プロフィール（ES・職務経歴書・免許資格）の型・上限・検証・整形
// DB アクセスは lib/profile-db.ts に分けている。
// このファイルはクライアントコンポーネント（ProfileForm）からも import するため、
// db/index.ts（neon の接続）を読み込んではいけない（ブラウザで DATABASE_URL が無く落ちる）
import { z } from "zod";
import { textField } from "./schemas";
import type { HistoryRow } from "./types";

export const ES_MAX = 2000;
export const QUALIFICATIONS_MAX = 500;
export const HISTORY_MAX_ROWS = 30;
export const HISTORY_TEXT_MAX = 100;
export const HISTORY_YEAR_MIN = 1950;

export type Profile = {
    es: string;
    history: HistoryRow[];
    qualifications: string;
};

export const EMPTY_PROFILE: Profile = { es: "", history: [], qualifications: "" };

// 職務経歴書の 1 行。年は検証する時点の西暦を上限にする（年をまたいで開いたままでもずれない）
const historyRowSchema = z.strictObject(
    {
        year: z
            .number({ error: "年を入力してください" })
            .int("年は整数で入力してください")
            .min(HISTORY_YEAR_MIN, `年は ${HISTORY_YEAR_MIN} 年以降で入力してください`)
            .refine((y) => y <= new Date().getFullYear(), "年は今年までで入力してください"),
        month: z
            .number({ error: "月を選んでください" })
            .int("月は 1〜12 で選んでください")
            .min(1, "月は 1〜12 で選んでください")
            .max(12, "月は 1〜12 で選んでください"),
        text: textField("内容", HISTORY_TEXT_MAX, { required: true }),
    },
    { error: "職務経歴書の行の形式が不正です" },
);

// プロフィール（PUT /api/profile の body と、プロフィール画面のフォームで共有する）
export const profileSchema = z.strictObject({
    es: textField("ES", ES_MAX, { multiline: true }),
    history: z
        .array(historyRowSchema, { error: "職務経歴書の形式が不正です" })
        .max(HISTORY_MAX_ROWS, `職務経歴書は ${HISTORY_MAX_ROWS} 行までです`),
    qualifications: textField("免許・資格", QUALIFICATIONS_MAX, { multiline: true }),
});

// 3 項目すべて空か（トップの案内表示に使う）
export function isProfileEmpty(p: Profile): boolean {
    return !p.es.trim() && p.history.length === 0 && !p.qualifications.trim();
}

// プロンプトに載せる形に整形（空の項目は省略）。未登録なら null
export function formatProfileForPrompt(p: Profile): string | null {
    if (isProfileEmpty(p)) return null;
    const parts: string[] = [];
    if (p.es.trim()) parts.push(`【ES】\n${p.es.trim()}`);
    if (p.history.length > 0) {
        const lines = p.history.map((r) => `${r.year} 年 ${r.month} 月　${r.text}`).join("\n");
        parts.push(`【学歴・職歴】\n${lines}`);
    }
    if (p.qualifications.trim()) parts.push(`【免許・資格】\n${p.qualifications.trim()}`);
    return parts.join("\n\n");
}
