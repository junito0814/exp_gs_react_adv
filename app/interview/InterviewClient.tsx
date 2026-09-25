"use client";
// app/interview/InterviewClient.tsx — 模擬面接（質問 → 回答 → 深掘り → 総評）
//
// 進行は reducer.ts の phase で管理する。
// 回答 UI（録音）は #16、進行・中断・総評・自動保存は #17 で足す。

import { useCallback, useEffect, useReducer, useRef } from "react";
import Link from "next/link";
import FaceMeter from "@/app/FaceMeter";
import { describeConditions, type Conditions } from "@/lib/conditions";
import type { Turn } from "@/lib/types";
import { INTERVIEW_TURNS } from "@/lib/prompts";
import { initialState, reducer } from "./reducer";

const cardClass = "p-6 bg-red-50 dark:bg-gray-700 border-l-4 border-red-500 rounded-r-lg shadow-md leading-relaxed";

export default function InterviewClient({ conditions }: { conditions: Conditions }) {
    const [state, dispatch] = useReducer(reducer, initialState);
    const { phase, topic, question, turns, error } = state;

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
                                {/* 「面接中断」は #17 で実装する */}
                            </div>
                        </div>

                        <FaceMeter onScore={handleScore} />

                        {error ? (
                            <div className={cardClass}>
                                <p className="mb-4">⚠ {error}</p>
                                <button
                                    onClick={() => fetchQuestion(turns, topic)}
                                    className="bg-red-400 text-white px-6 py-2 rounded hover:bg-red-500 cursor-pointer">
                                    もう一度
                                </button>
                            </div>
                        ) : phase === "asking" ? (
                            <p className="text-center text-gray-600 dark:text-gray-300">質問を準備しています…</p>
                        ) : (
                            <div className={cardClass}>
                                <h2 className="font-bold mb-2">面接官</h2>
                                <p className="whitespace-pre-wrap">🔊 {question}</p>
                            </div>
                        )}

                        {/* 回答 UI（録音）は #16 で実装する */}
                        {phase === "answering" && !error && (
                            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                                （回答の録音は次の段階で実装します）
                            </p>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
