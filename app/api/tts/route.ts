// app/api/tts/route.ts — テキストを音声（mp3 の base64）に変換
import { EdgeTTS } from "@andresaya/edge-tts";
import { requireUserId, unauthorized } from "@/lib/auth";
import { voiceFor } from "@/lib/voice";

export async function POST(request: Request) {
    const userId = await requireUserId();
    if (!userId) return unauthorized();

    let text = "";
    let level: unknown = undefined;
    try {
        const body = await request.json();
        if (typeof body.text === "string") text = body.text.trim();
        level = body.level;
    } catch {
        // JSON でない
    }
    if (!text) return Response.json({ error: "text が空です" }, { status: 400 });

    // 面接官レベルで声を変える。声名はサーバー側で決める（body の値はキーの検証だけに使う）
    const { voice, rate, pitch } = voiceFor(level);

    try {
        const tts = new EdgeTTS();
        await tts.synthesize(text, voice, { rate, pitch });
        const base64 = tts.toBase64(); // 音声(mp3)をbase64で受け取る
        return Response.json({ audio: base64 });
    } catch (e) {
        console.error("TTSエラー:", e);
        return Response.json({ error: "音声の生成に失敗しました" }, { status: 502 });
    }
}
