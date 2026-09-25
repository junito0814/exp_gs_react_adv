// lib/profile.ts — プロフィール（ES・職務経歴書・免許資格）の型・上限・検証・整形
// DB アクセスは lib/profile-db.ts に分けている。
// このファイルはクライアントコンポーネント（ProfileForm）からも import するため、
// db/index.ts（neon の接続）を読み込んではいけない（ブラウザで DATABASE_URL が無く落ちる）
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

// PUT /api/profile の body を検証する。問題なければ { ok: true, value }、だめなら理由を返す
export function validateProfile(body: unknown): { ok: true; value: Profile } | { ok: false; error: string } {
    if (typeof body !== "object" || body === null) return { ok: false, error: "リクエストの形式が不正です" };
    const b = body as Record<string, unknown>;

    const es = typeof b.es === "string" ? b.es : "";
    if (es.length > ES_MAX) return { ok: false, error: `ES は ${ES_MAX} 文字までです` };

    const qualifications = typeof b.qualifications === "string" ? b.qualifications : "";
    if (qualifications.length > QUALIFICATIONS_MAX) {
        return { ok: false, error: `免許・資格は ${QUALIFICATIONS_MAX} 文字までです` };
    }

    if (b.history !== undefined && !Array.isArray(b.history)) {
        return { ok: false, error: "職務経歴書の形式が不正です" };
    }
    const rawRows = Array.isArray(b.history) ? b.history : [];
    if (rawRows.length > HISTORY_MAX_ROWS) {
        return { ok: false, error: `職務経歴書は ${HISTORY_MAX_ROWS} 行までです` };
    }

    const thisYear = new Date().getFullYear();
    const history: HistoryRow[] = [];
    for (const [i, raw] of rawRows.entries()) {
        if (typeof raw !== "object" || raw === null) return { ok: false, error: `職務経歴書 ${i + 1} 行目の形式が不正です` };
        const r = raw as Record<string, unknown>;
        const text = typeof r.text === "string" ? r.text.trim() : "";
        if (!text && !r.year && !r.month) continue; // 完全に空の行は無視する
        if (!text) return { ok: false, error: `職務経歴書 ${i + 1} 行目の内容を入力してください` };
        if (text.length > HISTORY_TEXT_MAX) {
            return { ok: false, error: `職務経歴書 ${i + 1} 行目の内容は ${HISTORY_TEXT_MAX} 文字までです` };
        }
        const year = Number(r.year), month = Number(r.month);
        if (!Number.isInteger(year) || year < HISTORY_YEAR_MIN || year > thisYear) {
            return { ok: false, error: `職務経歴書 ${i + 1} 行目の年は ${HISTORY_YEAR_MIN}〜${thisYear} で入力してください` };
        }
        if (!Number.isInteger(month) || month < 1 || month > 12) {
            return { ok: false, error: `職務経歴書 ${i + 1} 行目の月は 1〜12 で入力してください` };
        }
        history.push({ year, month, text });
    }

    return { ok: true, value: { es, history, qualifications } };
}


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
