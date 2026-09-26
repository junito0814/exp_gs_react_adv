// app/api/transcribe/route.ts — 録音した音声を文字起こし（Groq Whisper）
import { requireUserId, unauthorized } from "@/lib/auth";

export async function POST(request: Request) {
    const userId = await requireUserId();
    if (!userId) return unauthorized();

    // 画面から送られた音声ファイルを受け取る
    let audio: File | null = null;
    try {
        const inForm = await request.formData();
        const v = inForm.get("audio");
        if (v instanceof File && v.size > 0) audio = v;
    } catch {
        // formData でない
    }
    if (!audio) return Response.json({ error: "音声ファイルがありません" }, { status: 400 });

    // Groqの音声API(Whisper)へ転送する形に詰め替える
    const groqForm = new FormData();
    groqForm.append("file", audio, "audio.webm");
    groqForm.append("model", "whisper-large-v3-turbo");
    groqForm.append("language", "ja");
    // segments のタイムスタンプが要る（最初に声が出た位置＝考えていた時間）
    groqForm.append("response_format", "verbose_json");

    try {
        const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
            method: "POST",
            headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
            body: groqForm, // ← FormDataのときは Content-Type を自分で付けない
        });
        const data = await res.json();
        if (!res.ok || typeof data.text !== "string") {
            console.error("Groq(Whisper)エラー:", data);
            return Response.json({ error: "文字起こしに失敗しました" }, { status: 502 });
        }
        // 最初の segment の start = 録音開始から声が出るまでの秒数。返らないこともある
        const start = Array.isArray(data.segments) ? Number(data.segments[0]?.start) : NaN;
        const speechStart = Number.isFinite(start) && start >= 0 ? start : undefined;
        return Response.json({ text: data.text, speechStart });
    } catch (e) {
        console.error("Groq(Whisper)通信エラー:", e);
        return Response.json({ error: "文字起こしに失敗しました" }, { status: 502 });
    }
}
