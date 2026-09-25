// lib/groq.ts — Groq のチャット API 呼び出し（失敗しても例外を投げない）
const MODEL = "openai/gpt-oss-120b";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
export type ChatResult = { ok: true; content: string } | { ok: false; error: string };

export async function chat(messages: ChatMessage[]): Promise<ChatResult> {
    try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({ model: MODEL, messages }),
        });
        const data = await res.json();
        if (!res.ok || !data.choices?.[0]?.message?.content) {
            console.error("Groqエラー:", data);
            // 回数制限のときはユーザーに分かる文言を返す
            const message: string = data?.error?.message ?? "";
            if (res.status === 429 || message.includes("Rate limit")) {
                return { ok: false, error: "AI の利用制限に達しました。少し待ってからもう一度お試しください。" };
            }
            return { ok: false, error: "AI との通信に失敗しました。もう一度お試しください。" };
        }
        return { ok: true, content: data.choices[0].message.content as string };
    } catch (e) {
        console.error("Groq通信エラー:", e);
        return { ok: false, error: "AI との通信に失敗しました。ネットワークを確認してください。" };
    }
}
