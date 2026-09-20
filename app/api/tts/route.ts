// app/api/tts/route.ts — テキストを音声（mp3 の base64）に変換
import { EdgeTTS } from "@andresaya/edge-tts";
import { requireUserId, unauthorized } from "@/lib/auth";

export async function POST(request: Request) {
    const userId = await requireUserId();
    if (!userId) return unauthorized();

    let text = "";
    try {
        const body = await request.json();
        if (typeof body.text === "string") text = body.text.trim();
    } catch {
        // JSON でない
    }
    if (!text) return Response.json({ error: "text が空です" }, { status: 400 });

    try {
        const tts = new EdgeTTS();
        await tts.synthesize(text, "ja-JP-NanamiNeural"); // 日本語の自然な声
        const base64 = tts.toBase64(); // 音声(mp3)をbase64で受け取る
        return Response.json({ audio: base64 });
    } catch (e) {
        console.error("TTSエラー:", e);
        return Response.json({ error: "音声の生成に失敗しました" }, { status: 502 });
    }
}
