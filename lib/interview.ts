// lib/interview.ts — 模擬面接の往復データの検証
import { INTERVIEW_TURNS, TOPICS_BY_CAREER, type CareerKey } from "./options";
import { z } from "zod";
import { issueMessage, turnSchema } from "./schemas";
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

// 定番テーマに含まれるか。クライアントから返ってきた topic は、これを満たすときだけ使う
// （任意の文字列をそのままプロンプトに入れさせない。#70）
export function isKnownTopic(career: CareerKey, topic: unknown): topic is string {
    return typeof topic === "string" && TOPICS_BY_CAREER[career].includes(topic);
}

type Result<T> = { ok: true; value: T } | { ok: false; error: string };

const turnsSchema = z
    .array(turnSchema, { error: "turns の形式が不正です" })
    .max(INTERVIEW_TURNS, `turns は ${INTERVIEW_TURNS} 件までです`);

// body.turns を検証する（形式・文字数は lib/schemas.ts の turnSchema。未知の項目は拒否）。
// requireMetrics: true のとき smileScore と answerSeconds も必須（総評・保存用）
export function validateTurns(
    raw: unknown,
    { requireMetrics }: { requireMetrics: boolean },
): Result<Turn[]> {
    if (raw === undefined || raw === null) return { ok: true, value: [] };
    const parsed = turnsSchema.safeParse(raw);
    if (!parsed.success) {
        const issue = parsed.error.issues[0];
        // 配列でない・多すぎるなど turns そのものの誤りは、turnsSchema に書いた文言をそのまま出す
        return { ok: false, error: issue?.path.length === 0 ? issue.message : `turns: ${issueMessage(issue)}` };
    }

    const turns: Turn[] = [];
    for (const [i, t] of parsed.data.entries()) {
        if (requireMetrics && (t.smileScore == null || t.answerSeconds == null)) {
            return { ok: false, error: `turns: ${i + 1} 件目：笑顔スコアと回答秒数が必要です` };
        }
        turns.push({
            question: t.question,
            answer: t.answer,
            ...(t.thinkingSeconds != null ? { thinkingSeconds: t.thinkingSeconds } : {}),
            smileScore: t.smileScore ?? 0,
            answerSeconds: t.answerSeconds ?? 0,
        });
    }
    return { ok: true, value: turns };
}
