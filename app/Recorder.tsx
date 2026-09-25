"use client";
// src/app/Recorder.tsx

import { useRef, useState } from "react";

type Props = {
    onText: (t: string) => void;   // 文字起こし結果
    onStart?: () => void;          // 録音を開始した
    onStop?: () => void;           // 録音を止めた（このあと文字起こし）
    onError?: () => void;          // マイクが使えなかった／文字起こしに失敗した
    disabled?: boolean;
};

export default function Recorder({ onText, onStart, onStop, onError, disabled }: Props) {
    const [recording, setRecording] = useState(false);
    const recorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    async function startRec() {
        let stream: MediaStream;
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (e) {
            console.error(e);
            alert("マイクを使えませんでした。ブラウザでマイクを『許可』してください。");
            onError?.();
            return;
        }
        const recorder = new MediaRecorder(stream);
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
                onText(data.text); // 文字起こし結果を親に渡す
            } catch {
                alert("文字起こしに失敗しました。通信を確認してください。");
                onError?.();
            }
        };
        recorder.start();
        recorderRef.current = recorder;
        setRecording(true);
        onStart?.();
    }

    function stopRec() {
        recorderRef.current?.stop();
        // マイクを離す（カメラと違い MediaRecorder では自動で止まらない）
        recorderRef.current?.stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        onStop?.();
    }

    return (
        <button onClick={recording ? stopRec : startRec} disabled={disabled} className="disabled:opacity-50">
            {recording ? "■ 録音停止して文字にする" : "🎤 録音する"}
        </button>
    );
}