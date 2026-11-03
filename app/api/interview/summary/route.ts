// app/api/interview/summary/route.ts — 模擬面接の総評（内容面・表情・話し方）
import { requireUserId, unauthorized } from "@/lib/auth";
import { parseConditions } from "@/lib/conditions";
import { formatProfileForPrompt } from "@/lib/profile";
import { getProfile } from "@/lib/profile-db";
import { buildSummarySystemPrompt, buildSummaryPrompt } from "@/lib/prompts";
import { validateTurns } from "@/lib/interview";
import { chat } from "@/lib/groq";
import { parseJsonBody } from "@/lib/http";
import { FEEDBACK_MAX, finalizeText, summaryRequestSchema } from "@/lib/schemas";

export async function POST(request: Request) {
    const userId = await requireUserId();
    if (!userId) return unauthorized();

    const parsed = await parseJsonBody(request, summaryRequestSchema);
    if (!parsed.ok) return parsed.response;

    const conditions = parseConditions(parsed.value.conditions);
    // 総評には笑顔スコアと回答秒数も必要（中断時は 1〜2 往復でもよい）
    const turns = validateTurns(parsed.value.turns, { requireMetrics: true });
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

    // 保存・読み上げで受け付ける形（整形・上限）にそろえておく
    const summary = finalizeText(result.content, FEEDBACK_MAX);
    if (!summary) return Response.json({ error: "総評の生成に失敗しました" }, { status: 502 });
    return Response.json({ summary });
}
