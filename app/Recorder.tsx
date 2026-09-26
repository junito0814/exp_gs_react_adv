"use client";
// app/Recorder.tsx — 録音して文字起こしする
//
// 2 通りの使い方がある。
//  - 手動（講評モード）：ボタンを押して話し始める。マイクはこの中で取得する
//  - 自動（模擬面接）：`autoStart` を付けてマウントすると同時に録音を始める。
//    マイクは親が保持しているものを `stream` で渡す（面接中に何度も許可を求めないため）

import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
    onText: (t: string, info?: { speechStart?: number }) => void; // 文字起こし結果と、声が出るまでの秒数
    onStart?: () => void;          // 録音を開始した
    onStop?: () => void;           // 録音を止めた（このあと文字起こし）
    onError?: () => void;          // マイクが使えなかった／文字起こしに失敗した
    disabled?: boolean;
    startLabel?: string;           // 開始前のボタン文言
    stopLabel?: string;            // 話している間のボタン文言
    stream?: MediaStream | null;   // 親が保持しているマイク（省略時は自分で取得する）
    autoStart?: boolean;           // マウントと同時に録音を始める
};

export default function Recorder({
    onText, onStart, onStop, onError, disabled,
    startLabel = "🎤 話す",
    stopLabel = "■ 話し終わり",
    stream,
    autoStart = false,
}: Props) {
    const [recording, setRecording] = useState(false);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    // 自分で取得したマイクかどうか。自分のものだけ停止する（親のものは面接中使い回す）
    const ownStreamRef = useRef<MediaStream | null>(null);

    const startRec = useCallback(async () => {
        let mic = stream ?? null;
        if (!mic) {
            try {
                mic = await navigator.mediaDevices.getUserMedia({ audio: true });
                ownStreamRef.current = mic;
            } catch (e) {
                console.error(e);
                alert("マイクを使えませんでした。ブラウザでマイクを『許可』してください。");
                onError?.();
                return;
            }
        }
        const recorder = new MediaRecorder(mic);
        chunksRef.current = [];
        recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
        recorder.onstop = async () => {
            const blob = new Blob(chunksRef.current, { type: "audio/webm" });
            const form = new FormData();
            form.append("audio", blob, "audio.webm");
            try {
                const res = await fetch("/api/transcribe", { method: "POST", body: form });
                const data = await res.json();
                if (!res.ok || typeof data.text !== "string") {
                    alert("文字起こしに失敗しました。もう一度お試しください。");
                    onError?.();
                    return;
                }
                onText(data.text, {
                    speechStart: typeof data.speechStart === "number" ? data.speechStart : undefined,
                }); // 文字起こし結果を親に渡す
            } catch {
                alert("文字起こしに失敗しました。通信を確認してください。");
                onError?.();
            }
        };
        recorder.start();
        recorderRef.current = recorder;
        setRecording(true);
        onStart?.();
    }, [stream, onText, onStart, onError]);

    // 自動開始：このコンポーネントは 1 往復ごとに新しく作られる（親が key を変える）。
    // マウント時に 1 回だけ録音を始めたいので、依存配列は空にしている。
    // setTimeout を挟むのは、effect の中で同期的に state を更新しないため
    useEffect(() => {
        if (!autoStart) return;
        const t = setTimeout(() => void startRec(), 0);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function stopRec() {
        recorderRef.current?.stop();
        // 自分で取得したマイクだけ離す（親から渡されたものは面接が終わるまで使う）
        ownStreamRef.current?.getTracks().forEach((t) => t.stop());
        ownStreamRef.current = null;
        setRecording(false);
        onStop?.();
    }

    // 自動開始のときは開始ボタンを出さない（押すのは「話し終わり」だけ）
    if (autoStart && !recording) {
        return <p className="text-gray-500 dark:text-gray-400">マイクを準備しています…</p>;
    }

    return (
        <button onClick={recording ? stopRec : startRec} disabled={disabled} className="disabled:opacity-50">
            {recording ? stopLabel : startLabel}
        </button>
    );
}
