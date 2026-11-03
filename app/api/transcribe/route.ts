// app/api/transcribe/route.ts — 録音した音声を文字起こし（Groq Whisper）
import { requireUserId, unauthorized } from "@/lib/auth";
import { declaredTooLarge, errorSummary } from "@/lib/http";
import { ANSWER_MAX, AUDIO_MAX_BYTES, finalizeText } from "@/lib/schemas";

// フォームの境界文字列などの分
const FORM_OVERHEAD_BYTES = 64 * 1024;
// 受け付ける音声の種類（MediaRecorder が作る形式）と、Groq に渡すファイル名の拡張子
const AUDIO_EXTENSIONS: Record<string, string> = {
    "audio/webm": "webm", "audio/ogg": "ogg", "audio/mp4": "mp4", "audio/mpeg": "mp3", "audio/wav": "wav",
};
const TIMEOUT_MS = 60_000;

export async function POST(request: Request) {
    const userId = await requireUserId();
    if (!userId) return unauthorized();

    // 読み込む前に、形式と宣言サイズで断る（#70）
    const type = (request.headers.get("content-type") ?? "").toLowerCase();
    if (!type.startsWith("multipart/form-data")) {
        return Response.json({ error: "Content-Type は multipart/form-data にしてください" }, { status: 415 });
    }
    if (declaredTooLarge(request, AUDIO_MAX_BYTES + FORM_OVERHEAD_BYTES)) {
        return Response.json({ error: "音声ファイルが大きすぎます" }, { status: 413 });
    }

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
    if (audio.size > AUDIO_MAX_BYTES) {
        return Response.json({ error: "音声ファイルが大きすぎます" }, { status: 413 });
    }
    const ext = AUDIO_EXTENSIONS[audio.type.split(";")[0].trim().toLowerCase()];
    if (!ext) return Response.json({ error: "音声ファイルの形式が不正です" }, { status: 415 });

    // Groqの音声API(Whisper)へ転送する形に詰め替える
    const groqForm = new FormData();
    groqForm.append("file", audio, `audio.${ext}`);
    groqForm.append("model", "whisper-large-v3-turbo");
    groqForm.append("language", "ja");
    // segments のタイムスタンプが要る（最初に声が出た位置＝考えていた時間）
    groqForm.append("response_format", "verbose_json");

    try {
        const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
            method: "POST",
            headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
            body: groqForm, // ← FormDataのときは Content-Type を自分で付けない
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        const data = await res.json();
        if (!res.ok || typeof data.text !== "string") {
            // 応答本文には文字起こし結果が含まれうるので、状態とエラー文だけ残す
            console.error("Groq(Whisper)エラー:", res.status, data?.error?.message ?? "");
            return Response.json({ error: "文字起こしに失敗しました" }, { status: 502 });
        }
        // 最初の segment の start = 録音開始から声が出るまでの秒数。返らないこともある
        const start = Array.isArray(data.segments) ? Number(data.segments[0]?.start) : NaN;
        const speechStart = Number.isFinite(start) && start >= 0 ? start : undefined;
        // 回答として受け付ける形（整形・上限）にそろえておく（保存・講評で弾かれないように）
        return Response.json({ text: finalizeText(data.text, ANSWER_MAX), speechStart });
    } catch (e) {
        console.error("Groq(Whisper)通信エラー:", errorSummary(e));
        return Response.json({ error: "文字起こしに失敗しました" }, { status: 502 });
    }
}
