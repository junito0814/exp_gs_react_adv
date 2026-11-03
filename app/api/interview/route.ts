// app/api/interview/route.ts — 模擬面接の質問生成（初回の出題と、回答を踏まえた深掘り）
import { requireUserId, unauthorized } from "@/lib/auth";
import { parseConditions } from "@/lib/conditions";
import { formatProfileForPrompt } from "@/lib/profile";
import { getProfile } from "@/lib/profile-db";
import {
    buildInterviewerSystemPrompt, buildFirstQuestionPrompt, buildFollowUpPrompt, parseQuestion,
} from "@/lib/prompts";
import { INTERVIEW_TURNS } from "@/lib/options";
import { validateTurns, pickTopic, isKnownTopic } from "@/lib/interview";
import { chat } from "@/lib/groq";
import { parseJsonBody } from "@/lib/http";
import { QUESTION_MAX, finalizeText, interviewRequestSchema } from "@/lib/schemas";

export async function POST(request: Request) {
    const userId = await requireUserId();
    if (!userId) return unauthorized();

    const parsed = await parseJsonBody(request, interviewRequestSchema);
    if (!parsed.ok) return parsed.response;
    const body = parsed.value;

    const conditions = parseConditions(body.conditions);
    // これまでの往復（質問・回答）。3 往復目まで終わっていれば質問はもう作らない
    const turns = validateTurns(body.turns, { requireMetrics: false });
    if (!turns.ok) return Response.json({ error: turns.error }, { status: 400 });
    if (turns.value.length >= INTERVIEW_TURNS) {
        return Response.json({ error: "面接は終了しています" }, { status: 400 });
    }

    const profileText = formatProfileForPrompt(await getProfile(userId));
    // 1 問目のテーマ。2 問目以降は body.topic（1 問目で使ったテーマ）を引き継ぐ。
    // topic はプロンプトに入るので、定番テーマのどれかと一致するときだけ使い、それ以外は選び直す（#70）
    const topic = isKnownTopic(conditions.career, body.topic)
        ? body.topic
        : pickTopic(conditions.career, isKnownTopic(conditions.career, body.lastTopic) ? body.lastTopic : null);

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: buildInterviewerSystemPrompt(conditions, profileText) },
        { role: "user", content: buildFirstQuestionPrompt(conditions, topic) },
    ];
    // 2 問目以降は、これまでのやり取りを会話として渡してから深掘りを依頼する
    for (const [i, t] of turns.value.entries()) {
        messages.push({ role: "assistant", content: JSON.stringify({ question: t.question }) });
        const isLast = i === turns.value.length - 1;
        // 最後の回答のあとにだけ深掘りの指示を付ける（それ以前は会話の流れとして渡す）
        messages.push({
            role: "user",
            content: isLast ? `${t.answer}\n\n${buildFollowUpPrompt(conditions, turns.value.length)}` : t.answer,
        });
    }

    const result = await chat(messages);
    if (!result.ok) return Response.json({ error: result.error }, { status: 502 });

    // 次のリクエストで turns として送り返されるので、受け付ける形（整形・上限）にそろえておく（#70）
    const question = finalizeText(parseQuestion(result.content), QUESTION_MAX);
    if (!question) {
        // 出力には回答やプロフィールが反映されているので、本文はログに残さない
        console.error("質問が空でした（出力の長さ）:", result.content.length);
        return Response.json({ error: "質問の生成に失敗しました" }, { status: 502 });
    }
    // topic は次のリクエストでそのまま返してもらう（テーマを固定するため）
    return Response.json({ question, topic });
}
