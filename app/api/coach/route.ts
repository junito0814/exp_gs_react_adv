// src/app/api/coach/route.ts
export async function POST(request: Request) {
    // ① 入力を受け取る（画面から送られてくる お題 と 回答）
    //   Body が空/JSONでない時に備えて、try で受け止める
    let body;
    try {
        body = await request.json();
    } catch {
        return Response.json({ feedback: "リクエストの形式が不正です（BrunoのBodyがJSONか確認してください）" }, { status: 400 });
    }
    const { topic, answer, tone } = body;

    // ② AIへの"お願い文"を組み立てる
    const prompt = `あなたは就職活動・面接の練習コーチです。
                    「${tone}」な口調で、以下の回答にフィードバックを行ってください。

                    「お題」${topic}
                    「回答」${answer}

                    必ず以下の項目ごとに改行（空行）を挟んで、段落を明確に分けて出力してください。

                    あなたの回答
                    ${answer}

                    ■ 良かった点
                    ・（良かった点を1〜2点）

                    ■ 改善点とアドバイス
                    ・（改善点を1〜2点）
                    → 言い換え例：「（具体的な言い換え表現）」

                    ■ 面接官からの深掘り質問
                    ・（想定質問1）
                    ・（想定質問2）

                    【指示】
                    1. 上記のフォーマットをそのまま使用し、各セクションの間に必ず空行を入れてください。
                    2. 全体で250〜350文字程度に収めてください。
                    3. 全体を通して「${tone}」の口調を徹底してください。`;

    // ③ Groq を叩く（キーはサーバー側の環境変数から。ブラウザには出ない）
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages: [{ role: "user", content: prompt }],
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