// app/api/coach/route.ts — 講評モードのフィードバック生成
import { requireUserId, unauthorized } from "@/lib/auth";
import { parseConditions } from "@/lib/conditions";
import { TOPIC_MAX } from "@/lib/options";
import { buildSystemPrompt, buildCoachPrompt } from "@/lib/prompts";
import { formatProfileForPrompt } from "@/lib/profile";
import { getProfile } from "@/lib/profile-db";

export async function POST(request: Request) {
    const userId = await requireUserId();
    if (!userId) return unauthorized();

    // ① 入力を受け取る（テーマ・回答・面接条件）
    //   Body が空/JSONでない時に備えて、try で受け止める
    let body;
    try {
        body = await request.json();
    } catch {
        return Response.json({ feedback: "リクエストの形式が不正です（BrunoのBodyがJSONか確認してください）" }, { status: 400 });
    }
    const topic = typeof body.topic === "string" ? body.topic.trim().slice(0, TOPIC_MAX) : "";
    const answer = typeof body.answer === "string" ? body.answer.trim() : "";
    if (!topic || !answer) {
        return Response.json({ feedback: "テーマと回答を入力してください" }, { status: 400 });
    }
    // 面接条件はクライアントの値を信用せず再検証する（不正値は初期値に丸まる）
    const conditions = parseConditions(body.conditions ?? {});

    // ② AIへの"お願い文"を組み立てる（口調・禁止事項は system、フォーマットは user）
    //    プロフィール（ES・職務経歴書）はサーバー側で読む。ブラウザからは送らせない
    const profileText = formatProfileForPrompt(await getProfile(userId));
    const messages = [
        { role: "system", content: buildSystemPrompt(conditions, profileText) },
        { role: "user", content: buildCoachPrompt(topic, answer) },
    ];

    // ③ Groq を叩く（キーはサーバー側の環境変数から。ブラウザには出ない）
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages,
        }),
    });

    // ④ 返事を取り出す
    const data = await res.json();

    // Groqがエラーを返した時（キー違い・回数制限など）はここで気づける
    if (!res.ok || !data.choices) {
        console.error("Groqエラー:", data);
        return Response.json(
            { feedback: "AIとの通信に失敗しました。ターミナルの赤い文字（キー違い・回数制限など）を確認してください。" },
            { status: 502 },
        );
    }

    const feedback = data.choices[0].message.content;

    // ⑤ 画面に返す
    return Response.json({ feedback });
}
