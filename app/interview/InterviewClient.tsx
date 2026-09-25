"use client";
// app/interview/InterviewClient.tsx — 模擬面接（質問 → 回答 → 深掘り → 総評）
//
// 進行は reducer.ts の phase で管理する。
// 回答 UI（録音）は #16、進行・中断・総評・自動保存は #17 で足す。

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import FaceMeter from "@/app/FaceMeter";
import Recorder from "@/app/Recorder";
import { describeConditions, type Conditions } from "@/lib/conditions";
import type { Turn } from "@/lib/types";
import { INTERVIEW_TURNS } from "@/lib/prompts";
import { initialState, reducer } from "./reducer";

const cardClass = "p-6 bg-red-50 dark:bg-gray-700 border-l-4 border-red-500 rounded-r-lg shadow-md leading-relaxed";

export default function InterviewClient({ conditions }: { conditions: Conditions }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { phase, topic, question, turns, transcript, answerSeconds, summary, savedId, error, saveError, fallbackText } = state;
    const router = useRouter();

    // 笑顔スコアは 0.5 秒ごとに届くので、state ではなく ref で持つ（毎回の再描画を避ける）
    const smileRef = useRef(0);
    // FaceMeter に渡す関数は固定する（毎回新しい関数だとカメラが再起動する）
    const handleScore = useCallback((n: number) => { smileRef.current = n; }, []);

    // 読み上げ中の音声。録音開始時や次の質問に進むときに止める
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const stopSpeaking = useCallback(() => {
        audioRef.current?.pause();
        audioRef.current = null;
    }, []);

    // 質問を取得する（turnsNow が空なら初回の出題、あれば深掘り）
    // テーマ（topicNow）は 1 回の面接で固定するため、そのまま送り返す
    const fetchQuestion = useCallback(async (turnsNow: Turn[], topicNow: string) => {
        dispatch({ type: "ask" });
        try {
            const res = await fetch("/api/interview", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conditions, turns: turnsNow, topic: topicNow || undefined }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.question) {
                dispatch({ type: "failed", error: data.error ?? "質問の取得に失敗しました" });
                return;
            }
            dispatch({ type: "question", question: data.question, topic: data.topic ?? topicNow });
        } catch {
            dispatch({ type: "failed", error: "通信に失敗しました。ネットワークを確認してください。" });
        }
    }, [conditions]);

    // 録音の開始時刻と、画面に出す経過秒数
    const startedAtRef = useRef(0);
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
        if (phase !== "recording") return;
        // 1 秒ごとに経過を更新する（0 に戻すのは録音開始のハンドラ側）
        const timer = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
        }, 1000);
        return () => clearInterval(timer);
    }, [phase]);

    // 録音を始めたら読み上げを止める（自分の声と重ならないように）
    const handleRecordStart = useCallback(() => {
        stopSpeaking();
        startedAtRef.current = Date.now();
        setElapsed(0);
        dispatch({ type: "recordStart" });
    }, [stopSpeaking]);

    const handleRecordStop = useCallback(() => {
        dispatch({ type: "recordStop" });
    }, []);

    // 文字起こしが返ってきた（送信待ちにする）
    const handleText = useCallback((text: string) => {
        const seconds = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
        dispatch({ type: "transcript", text, seconds });
    }, []);

    // マイクが使えない／文字起こしに失敗した
    const handleRecorderError = useCallback(() => {
        dispatch({ type: "transcribeFailed" });
        dispatch({ type: "useTextFallback" });
    }, []);

    // 回答を送信する（送信後のやり直しはできない）
    const submit = useCallback(() => {
        const answer = transcript.trim();
        if (!answer) return;
        dispatch({
            type: "submit",
            turn: {
                question,
                answer,
                smileScore: smileRef.current,
                answerSeconds: answerSeconds || Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)),
            },
        });
    }, [transcript, question, answerSeconds]);

    // 面接の記録を保存する（失敗したら「再保存」で同じ内容をもう一度送る）
    const save = useCallback(async (turnsNow: Turn[], summaryText: string) => {
        try {
            const res = await fetch("/api/sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mode: "interview", conditions, turns: turnsNow, summary: summaryText }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.id) {
                dispatch({ type: "saveFailed", error: data.error ?? "保存に失敗しました" });
                return;
            }
            dispatch({ type: "saved", id: data.id });
        } catch {
            dispatch({ type: "saveFailed", error: "保存に失敗しました。通信を確認してください。" });
        }
    }, [conditions]);

    // 総評の読み上げ（自動では流さない。既存の講評モードと同じ操作）
    const [volume, setVolume] = useState(1);
    const [rate, setRate] = useState(1);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const summaryAudioRef = useRef<HTMLAudioElement | null>(null);

    async function speakSummary() {
        if (isSpeaking) return;
        setIsSpeaking(true);
        try {
            const res = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: state.summary }),
            });
            if (!res.ok) throw new Error("TTS に失敗しました");
            const data = await res.json();
            const audio = new Audio("data:audio/mp3;base64," + data.audio);
            audio.volume = volume;
            audio.playbackRate = rate;
            summaryAudioRef.current = audio;
            const reset = () => { setIsSpeaking(false); summaryAudioRef.current = null; };
            audio.onended = reset;
            audio.onerror = reset;
            await audio.play();
        } catch (e) {
            console.error(e);
            setIsSpeaking(false);
            summaryAudioRef.current = null;
        }
    }
    function stopSummary() {
        summaryAudioRef.current?.pause();
        setIsSpeaking(false);
    }

    // 総評を作って自動保存する（3 往復終了時・中断時）
    const fetchSummary = useCallback(async (turnsNow: Turn[]) => {
        dispatch({ type: "summarize" });
        stopSpeaking();
        let text = "";
        try {
            const res = await fetch("/api/interview/summary", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conditions, turns: turnsNow }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.summary) {
                dispatch({ type: "failed", error: data.error ?? "総評の生成に失敗しました" });
                return;
            }
            text = data.summary;
            dispatch({ type: "summary", summary: text });
        } catch {
            dispatch({ type: "failed", error: "通信に失敗しました。ネットワークを確認してください。" });
            return;
        }
        // 総評ができたら保存まで自動で行う（保存ボタンは押させない）
        await save(turnsNow, text);
    }, [conditions, stopSpeaking, save]);

    // 回答を送ったら、3 往復目までは深掘り、3 往復に達したら総評へ
    useEffect(() => {
        if (phase !== "submitting") return;
        if (turns.length < INTERVIEW_TURNS) fetchQuestion(turns, topic);
        else fetchSummary(turns);
    }, [phase, turns, topic, fetchQuestion, fetchSummary]);

    // 面接中断：1 往復以上あればそこまでで総評、0 往復なら保存せずトップへ
    const abort = useCallback(() => {
        if (!confirm("面接を中断しますか？ここまでの内容で総評を出します")) return;
        stopSpeaking();
        if (turns.length === 0) {
            router.push("/");
            return;
        }
        fetchSummary(turns);
    }, [turns, fetchSummary, stopSpeaking, router]);

    // 画面を離れるときは読み上げを止める
    useEffect(() => stopSpeaking, [stopSpeaking]);

    // 質問が変わったら自動で読み上げる。失敗しても面接は続ける
    useEffect(() => {
        if (!question) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch("/api/tts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: question }),
                });
                if (!res.ok) throw new Error("TTS に失敗しました");
                const data = await res.json();
                if (cancelled) return;
                const audio = new Audio("data:audio/mp3;base64," + data.audio);
                audioRef.current = audio;
                audio.onended = () => { audioRef.current = null; };
                await audio.play();
            } catch (e) {
                // 読み上げが失敗してもテキストは出ているので、そのまま進める
                console.error("質問の読み上げに失敗:", e);
            }
        })();
        return () => { cancelled = true; };
    }, [question]);

    const started = phase !== "idle";
    const turnNumber = Math.min(turns.length + 1, INTERVIEW_TURNS);

    return (
        <main className="flex-1 leading-loose p-10">
            <div className="max-w-2xl mx-auto flex flex-col gap-6">
                {!started ? (
                    <>
                        <Link href="/" className="text-red-400 hover:underline text-sm">← トップへ戻る</Link>
                        <div className="text-center">
                            <h1 className="font-serif text-4xl p-3">模擬面接</h1>
                            <p className="text-gray-600 dark:text-gray-300">{describeConditions(conditions)}</p>
                        </div>
                        <div className={cardClass}>
                            <ul className="list-disc list-inside">
                                <li>この面接は {INTERVIEW_TURNS} 往復です。</li>
                                <li>質問は音声で読み上げられます。</li>
                                <li>回答は録音のみで、送信後のやり直しはできません。</li>
                                <li>カメラとマイクの許可が必要です。</li>
                            </ul>
                        </div>
                        <div className="flex justify-center">
                            <button
                                onClick={() => fetchQuestion([], "")}
                                className="bg-red-400 text-white px-8 py-3 rounded hover:bg-red-500
                                    transition duration-300 transform hover:scale-105 cursor-pointer">
                                面接を始める
                            </button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">{describeConditions(conditions)}</span>
                            <div className="flex items-center gap-4">
                                <span className="px-3 py-1 rounded-full border border-gray-400">
                                    {turnNumber} / {INTERVIEW_TURNS}
                                </span>
                                {phase !== "done" && (
                                    <button
                                        onClick={abort}
                                        className="px-3 py-1 rounded border border-gray-400
                                            hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                        面接中断
                                    </button>
                                )}
                            </div>
                        </div>

                        {phase !== "summarizing" && phase !== "done" && <FaceMeter onScore={handleScore} />}

                        {error ? (
                            <div className={cardClass}>
                                <p className="mb-4">⚠ {error}</p>
                                <button
                                    onClick={() => (summary || turns.length >= INTERVIEW_TURNS
                                        ? fetchSummary(turns)
                                        : fetchQuestion(turns, topic))}
                                    className="bg-red-400 text-white px-6 py-2 rounded hover:bg-red-500 cursor-pointer">
                                    もう一度
                                </button>
                            </div>
                        ) : phase === "asking" ? (
                            <p className="text-center text-gray-600 dark:text-gray-300">質問を準備しています…</p>
                        ) : phase === "summarizing" ? (
                            <p className="text-center text-gray-600 dark:text-gray-300">総評をまとめています…</p>
                        ) : phase !== "done" ? (
                            <div className={cardClass}>
                                <h2 className="font-bold mb-2">面接官</h2>
                                <p className="whitespace-pre-wrap">🔊 {question}</p>
                            </div>
                        ) : null}

                        {/* 回答（録音のみ。マイクが使えないときだけテキスト入力に切り替わる） */}
                        {!error && (phase === "answering" || phase === "recording" || phase === "transcribing") && (
                            <div className="flex flex-col gap-4 items-center">
                                {phase === "recording" && (
                                    <p className="text-lg">
                                        <span className="inline-block w-3 h-3 rounded-full bg-red-500 mr-2" />
                                        録音中　{String(Math.floor(elapsed / 60)).padStart(2, "0")}:{String(elapsed % 60).padStart(2, "0")}
                                    </p>
                                )}
                                {phase === "transcribing" && (
                                    <p className="text-gray-600 dark:text-gray-300">文字にしています…</p>
                                )}

                                {fallbackText ? (
                                    <div className="w-full flex flex-col gap-2">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            マイクが使えないため、テキストで回答します。
                                        </p>
                                        <textarea
                                            value={transcript}
                                            onChange={(e) => {
                                                if (!startedAtRef.current) startedAtRef.current = Date.now();
                                                dispatch({ type: "transcript", text: e.target.value, seconds: 0 });
                                            }}
                                            rows={5}
                                            className="w-full ring-2 ring-gray-300 dark:ring-gray-600 rounded p-2 bg-white dark:bg-gray-700"
                                            placeholder="ここに回答を入力"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        {transcript ? (
                                            <div className={`${cardClass} w-full border-dashed`}>
                                                <div className="flex justify-between items-baseline mb-2">
                                                    <h2 className="font-bold">あなたの回答（編集できません）</h2>
                                                    <span className="text-sm">⏱ {answerSeconds} 秒</span>
                                                </div>
                                                <p className="whitespace-pre-wrap">{transcript}</p>
                                            </div>
                                        ) : (
                                            <Recorder
                                                onText={handleText}
                                                onStart={handleRecordStart}
                                                onStop={handleRecordStop}
                                                onError={handleRecorderError}
                                                disabled={phase === "transcribing"}
                                            />
                                        )}
                                    </>
                                )}

                                {(transcript || fallbackText) && phase === "answering" && (
                                    <div className="flex flex-col items-center gap-2">
                                        <button
                                            onClick={submit}
                                            disabled={transcript.trim() === ""}
                                            className="bg-red-400 text-white px-8 py-3 rounded hover:bg-red-500
                                                transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                                            送信する
                                        </button>
                                        {transcript.trim() === "" && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                回答が空です。もう一度録音してください。
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 総評（表示時点で保存は済んでいる） */}
                        {phase === "done" && (
                            <>
                                <p className="text-center text-sm">
                                    {saveError ? (
                                        <span className="text-red-500">
                                            ⚠ {saveError}{" "}
                                            <button
                                                onClick={() => save(turns, summary)}
                                                className="underline cursor-pointer">再保存</button>
                                        </span>
                                    ) : (
                                        <span>✓ 保存しました</span>
                                    )}
                                </p>

                                <div className={cardClass}>
                                    <h2 className="font-bold text-xl mb-4 border-b pb-2 border-red-200 dark:border-gray-600">
                                        総評
                                    </h2>
                                    <div className="whitespace-pre-wrap">{summary}</div>

                                    <div className="flex flex-col gap-3 max-w-xs mx-auto mt-6 text-sm">
                                        <label className="flex items-center gap-3">
                                            <span className="w-16 text-left">🔊 音量</span>
                                            <input type="range" min={0} max={1} step={0.05} value={volume}
                                                onChange={(e) => {
                                                    const v = Number(e.target.value);
                                                    setVolume(v);
                                                    if (summaryAudioRef.current) summaryAudioRef.current.volume = v;
                                                }}
                                                className="flex-1" />
                                            <span className="w-10 text-right">{Math.round(volume * 100)}%</span>
                                        </label>
                                        <label className="flex items-center gap-3">
                                            <span className="w-16 text-left">⏩ 速度</span>
                                            <input type="range" min={0.5} max={2} step={0.1} value={rate}
                                                onChange={(e) => {
                                                    const r = Number(e.target.value);
                                                    setRate(r);
                                                    if (summaryAudioRef.current) summaryAudioRef.current.playbackRate = r;
                                                }}
                                                className="flex-1" />
                                            <span className="w-10 text-right">{rate.toFixed(1)}x</span>
                                        </label>
                                    </div>

                                    <div className="flex justify-center mt-4">
                                        <button
                                            onClick={isSpeaking ? stopSummary : speakSummary}
                                            className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer">
                                            {isSpeaking ? "⏸ 停止" : "▶ 音声読み上げ"}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-6 justify-center">
                                    <Link
                                        href={savedId ? `/history/${savedId}` : "/history"}
                                        className="px-6 py-3 rounded border border-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        📋 この面接の記録を見る
                                    </Link>
                                    <Link
                                        href="/"
                                        className="px-6 py-3 rounded border border-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        トップへ戻る
                                    </Link>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
