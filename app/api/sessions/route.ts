// app/api/sessions/route.ts
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { requireUserId, unauthorized } from "@/lib/auth";
import { parseConditions } from "@/lib/conditions";
import { TOPIC_MAX } from "@/lib/options";
import { validateTurns } from "@/lib/interview";

const MODES = ["practice", "interview"] as const;
type Mode = (typeof MODES)[number];

// 一覧を取得（本人のみ・新しい順）。?mode=practice|interview で絞り込み
export async function GET(request: Request) {
    const userId = await requireUserId();
    if (!userId) return unauthorized();

    const mode = new URL(request.url).searchParams.get("mode");
    const where = mode && (MODES as readonly string[]).includes(mode)
        ? and(eq(sessions.userId, userId), eq(sessions.mode, mode))
        : eq(sessions.userId, userId);

    const rows = await db.select().from(sessions).where(where).orderBy(desc(sessions.createdAt));
    return Response.json(rows);
}

// 1件保存（userId は Clerk から取る。body の userId は無視）
export async function POST(request: Request) {
    const userId = await requireUserId();
    if (!userId) return unauthorized();

    let body;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: "リクエストの形式が不正です" }, { status: 400 });
    }

    const mode: Mode = body.mode;
    if (!(MODES as readonly string[]).includes(mode)) {
        return Response.json({ error: "mode が不正です" }, { status: 400 });
    }

    // 面接条件はクライアントの値を信用せず再検証する
    const c = parseConditions(body.conditions ?? {});
    const conditionColumns = {
        industry: c.industry,
        job: c.job,
        career: c.career,
        background: c.background || null,
        level: c.level,
    };

    // 保存する内容をモードごとに決める
    let values;
    if (mode === "interview") {
        // 模擬面接：往復（質問・回答・笑顔・秒数）と総評。中断していれば 1〜2 往復のこともある
        const turns = validateTurns(body.turns, { requireMetrics: true });
        if (!turns.ok) return Response.json({ error: turns.error }, { status: 400 });
        if (turns.value.length === 0) return Response.json({ error: "turns が空です" }, { status: 400 });

        const summary = typeof body.summary === "string" ? body.summary.trim() : "";
        if (!summary) return Response.json({ error: "summary が空です" }, { status: 400 });

        values = {
            userId,
            mode,
            ...conditionColumns,
            // 一覧では最初の質問をテーマとして見せる
            topic: turns.value[0].question.slice(0, TOPIC_MAX),
            answerText: null,
            smileScore: turns.value[turns.value.length - 1].smileScore,
            feedback: summary,
            turns: turns.value,
            memo: null,
        };
    } else {
        // 講評モード：テーマ・回答・講評・メモ
        const topic = typeof body.topic === "string" ? body.topic.trim().slice(0, TOPIC_MAX) : "";
        if (!topic) return Response.json({ error: "topic が空です" }, { status: 400 });

        values = {
            userId,
            mode,
            ...conditionColumns,
            topic,
            answerText: typeof body.answer === "string" ? body.answer : null,
            smileScore: Number.isFinite(body.smileScore) ? Math.round(body.smileScore) : null,
            feedback: typeof body.feedback === "string" ? body.feedback : null,
            memo: typeof body.memo === "string" ? body.memo : null,
        };
    }

    const [row] = await db.insert(sessions).values(values).returning({ id: sessions.id });
    return Response.json({ ok: true, id: row.id });
}
