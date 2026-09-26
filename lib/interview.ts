// lib/interview.ts — 模擬面接の往復データの検証
import { INTERVIEW_TURNS } from "./options";
import { TOPICS_BY_CAREER, type CareerKey } from "./options";
import type { Turn } from "./types";

// 面接のテーマを定番から 1 つ選ぶ。
// AI に選ばせると「学生時代のプロジェクト」などに偏るため、サーバー側で抽選する。
// exclude には直近の面接のテーマを渡すと、2 回続けて同じテーマになりにくい
export function pickTopic(career: CareerKey, exclude?: string | null): string {
    const all = TOPICS_BY_CAREER[career];
    const candidates = exclude ? all.filter((t) => t !== exclude) : all;
    const list = candidates.length > 0 ? candidates : all;
    return list[Math.floor(Math.random() * list.length)];
}

const ANSWER_MAX = 4000; // 文字起こし結果の上限（長すぎる入力を弾く）

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

// body.turns を検証する。
// requireMetrics: true のとき smileScore と answerSeconds も必須（総評用）
export function validateTurns(
    raw: unknown,
    { requireMetrics }: { requireMetrics: boolean },
): Result<Turn[]> {
    if (raw === undefined || raw === null) return { ok: true, value: [] };
    if (!Array.isArray(raw)) return { ok: false, error: "turns の形式が不正です" };
    if (raw.length > INTERVIEW_TURNS) {
        return { ok: false, error: `turns は ${INTERVIEW_TURNS} 件までです` };
    }

    const turns: Turn[] = [];
    for (const [i, item] of raw.entries()) {
        if (typeof item !== "object" || item === null) {
            return { ok: false, error: `turns[${i}] の形式が不正です` };
        }
        const t = item as Record<string, unknown>;
        const question = typeof t.question === "string" ? t.question.trim() : "";
        const answer = typeof t.answer === "string" ? t.answer.trim() : "";
        if (!question) return { ok: false, error: `turns[${i}].question が空です` };
        if (!answer) return { ok: false, error: `turns[${i}].answer が空です` };
        if (answer.length > ANSWER_MAX) {
            return { ok: false, error: `turns[${i}].answer が長すぎます` };
        }

        // スコアと秒数は 0 以上の整数に丸める（総評では必須）
        const smileScore = Number(t.smileScore);
        const answerSeconds = Number(t.answerSeconds);
        if (requireMetrics) {
            if (!Number.isFinite(smileScore) || smileScore < 0 || smileScore > 100) {
                return { ok: false, error: `turns[${i}].smileScore が不正です` };
            }
            if (!Number.isFinite(answerSeconds) || answerSeconds < 0) {
                return { ok: false, error: `turns[${i}].answerSeconds が不正です` };
            }
        }
        const thinking = Number(t.thinkingSeconds);
        turns.push({
            question,
            answer,
            ...(Number.isFinite(thinking) && thinking >= 0 ? { thinkingSeconds: Math.round(thinking) } : {}),
            smileScore: Number.isFinite(smileScore) ? Math.round(Math.min(Math.max(smileScore, 0), 100)) : 0,
            answerSeconds: Number.isFinite(answerSeconds) ? Math.round(Math.max(answerSeconds, 0)) : 0,
        });
    }
    return { ok: true, value: turns };
}
