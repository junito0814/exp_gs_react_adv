// app/api/interview/route.ts — 模擬面接の質問生成（初回の出題と、回答を踏まえた深掘り）
import { requireUserId, unauthorized } from "@/lib/auth";
import { parseConditions } from "@/lib/conditions";
import { formatProfileForPrompt } from "@/lib/profile";
import { getProfile } from "@/lib/profile-db";
import {
    buildInterviewerSystemPrompt, buildFirstQuestionPrompt, FOLLOW_UP_PROMPT, parseQuestion,
} from "@/lib/prompts";
import { INTERVIEW_TURNS } from "@/lib/options";
import { validateTurns, pickTopic } from "@/lib/interview";
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
    // これまでの往復（質問・回答）。3 往復目まで終わっていれば質問はもう作らない
    const turns = validateTurns(body.turns, { requireMetrics: false });
    if (!turns.ok) return Response.json({ error: turns.error }, { status: 400 });
    if (turns.value.length >= INTERVIEW_TURNS) {
        return Response.json({ error: "面接は終了しています" }, { status: 400 });
    }

    const profileText = formatProfileForPrompt(await getProfile(userId));
    // 1 問目のテーマ。2 問目以降は body.topic（1 問目で使ったテーマ）を引き継ぐ
    const topic = typeof body.topic === "string" && body.topic.trim()
        ? body.topic.trim()
        : pickTopic(conditions.career, typeof body.lastTopic === "string" ? body.lastTopic : null);

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: buildInterviewerSystemPrompt(conditions, profileText) },
        { role: "user", content: buildFirstQuestionPrompt(conditions, topic) },
    ];
    // 2 問目以降は、これまでのやり取りを会話として渡してから深掘りを依頼する
    for (const [i, t] of turns.value.entries()) {
        messages.push({ role: "assistant", content: JSON.stringify({ question: t.question }) });
        const isLast = i === turns.value.length - 1;
        messages.push({ role: "user", content: isLast ? `${t.answer}\n\n${FOLLOW_UP_PROMPT}` : t.answer });
    }

    const result = await chat(messages);
    if (!result.ok) return Response.json({ error: result.error }, { status: 502 });

    const question = parseQuestion(result.content);
    if (!question) {
        console.error("質問が空でした:", result.content);
        return Response.json({ error: "質問の生成に失敗しました" }, { status: 502 });
    }
    // topic は次のリクエストでそのまま返してもらう（テーマを固定するため）
    return Response.json({ question, topic });
}
