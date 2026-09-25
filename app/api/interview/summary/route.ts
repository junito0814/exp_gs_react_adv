// app/api/interview/summary/route.ts — 模擬面接の総評（内容面・表情・話し方）
import { requireUserId, unauthorized } from "@/lib/auth";
import { parseConditions } from "@/lib/conditions";
import { getProfile, formatProfileForPrompt } from "@/lib/profile";
import { buildSummarySystemPrompt, buildSummaryPrompt } from "@/lib/prompts";
import { validateTurns } from "@/lib/interview";
import { chat } from "@/lib/groq";

export async function POST(request: Request) {
    const userId = await requireUserId();
    if (!userId) return unauthorized();

    let body;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: "リクエストの形式が不正です" }, { status: 400 });
    }

    const conditions = parseConditions(body.conditions ?? {});
    // 総評には笑顔スコアと回答秒数も必要（中断時は 1〜2 往復でもよい）
    const turns = validateTurns(body.turns, { requireMetrics: true });
    if (!turns.ok) return Response.json({ error: turns.error }, { status: 400 });
    if (turns.value.length === 0) {
        return Response.json({ error: "回答がありません" }, { status: 400 });
    }

    const profileText = formatProfileForPrompt(await getProfile(userId));
    const result = await chat([
        { role: "system", content: buildSummarySystemPrompt(conditions, profileText) },
        { role: "user", content: buildSummaryPrompt(turns.value) },
    ]);
    if (!result.ok) return Response.json({ error: result.error }, { status: 502 });

    const summary = result.content.trim();
    if (!summary) return Response.json({ error: "総評の生成に失敗しました" }, { status: 502 });
    return Response.json({ summary });
}
