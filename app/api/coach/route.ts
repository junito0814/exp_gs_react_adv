// app/api/coach/route.ts — 講評モードのフィードバック生成
import { requireUserId, unauthorized } from "@/lib/auth";
import { parseConditions } from "@/lib/conditions";
import { buildSystemPrompt, buildCoachPrompt } from "@/lib/prompts";
import { formatProfileForPrompt } from "@/lib/profile";
import { getProfile } from "@/lib/profile-db";
import { chat } from "@/lib/groq";
import { parseJsonBody } from "@/lib/http";
import { FEEDBACK_MAX, coachRequestSchema, finalizeText } from "@/lib/schemas";

export async function POST(request: Request) {
    const userId = await requireUserId();
    if (!userId) return unauthorized();

    // ① 入力を受け取る（テーマ・回答・面接条件）。形式・文字数はスキーマで検証する（#70）
    const parsed = await parseJsonBody(request, coachRequestSchema);
    if (!parsed.ok) return parsed.response;
    const { topic, answer } = parsed.value;
    // 面接条件はクライアントの値を信用せず再検証する（不正値は初期値に丸まる）
    const conditions = parseConditions(parsed.value.conditions);

    // ② AIへの"お願い文"を組み立てる（口調・禁止事項は system、フォーマットは user）
    //    プロフィール（ES・職務経歴書）はサーバー側で読む。ブラウザからは送らせない
    const profileText = formatProfileForPrompt(await getProfile(userId));

    // ③ Groq を叩く（キーはサーバー側の環境変数から。ブラウザには出ない）
    const result = await chat([
        { role: "system", content: buildSystemPrompt(conditions, profileText) },
        { role: "user", content: buildCoachPrompt(topic, answer) },
    ]);
    if (!result.ok) return Response.json({ error: result.error }, { status: 502 });

    // ④ 画面に返す。保存・読み上げで受け付ける形（整形・上限）にそろえておく
    const feedback = finalizeText(result.content, FEEDBACK_MAX);
    if (!feedback) return Response.json({ error: "講評の生成に失敗しました" }, { status: 502 });
    return Response.json({ feedback });
}
