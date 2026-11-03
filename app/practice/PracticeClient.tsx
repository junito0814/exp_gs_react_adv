"use client";
// app/practice/PracticeClient.tsx（講評モード。旧トップ画面を移動し、面接条件に対応）

import { useState, useRef } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FaceMeter from "@/app/FaceMeter";
import Recorder from "@/app/Recorder";
import Link from "next/link";
import { TOPICS_BY_CAREER, TOPIC_MAX } from "@/lib/options";
import { describeConditions, type Conditions } from "@/lib/conditions";
import Notice from "@/app/Notice";
import Pending from "@/app/Pending";
import { SkeletonBox, SkeletonLines } from "@/app/Skeleton";
import FieldError from "@/app/FieldError";
import { PRACTICE_SEND_NOTICE, WAITING } from "@/lib/messages";
import { ANSWER_MAX, FREE_TOPIC, MEMO_MAX, practiceFormSchema } from "@/lib/schemas";
import type { z } from "zod";

type PracticeForm = z.output<typeof practiceFormSchema>;

// 実際に使うテーマ（定番 or 自由入力）
const topicOf = (v: { topicSelect: string; freeTopic: string }) =>
  (v.topicSelect === FREE_TOPIC ? v.freeTopic : v.topicSelect).trim();

export default function PracticeClient({ conditions }: { conditions: Conditions }) {
  const topics = TOPICS_BY_CAREER[conditions.career];
  // テーマ・回答・メモは lib/schemas.ts の practiceFormSchema で検証する（API と同じ上限。#70）
  const { register, control, handleSubmit, setValue, trigger, getValues, formState: { errors } } = useForm({
    resolver: zodResolver(practiceFormSchema),
    defaultValues: { topicSelect: topics[0], freeTopic: "", answer: "", memo: "" },
    mode: "onBlur",
  });
  const [topicSelect, freeTopic, answer] = useWatch({ control, name: ["topicSelect", "freeTopic", "answer"] });
  const topic = topicOf({ topicSelect, freeTopic });
  const [smileScore, setSmileScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  // 講評を作れなかった理由。講評の枠（保存・読み上げボタン付き）には入れない
  const [feedbackError, setFeedbackError] = useState("");
  // 講評を頼んだときのテーマ・回答・笑顔スコア。あとで欄を書き換えても、保存するのは講評と対になるこの内容
  const [reviewed, setReviewed] = useState<{ topic: string; answer: string; smileScore: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  // 音声を作っている間（押してから音が出るまで）。停止ボタンだけ出るのを避ける
  const [preparingAudio, setPreparingAudio] = useState(false);
  const [isPaused, setIsPaused] = useState(false); //再生途中で止めたか
  const [volume, setVolume] = useState(1); //音声　０〜１
  const [rate, setRate] = useState(1); //再生速度:１が標準
  const audioRef = useRef<HTMLAudioElement | null>(null); //再生中のAudioを保持


  async function requestFeedback(values: PracticeForm) {
    setLoading(true);
    setFeedback("");
    setFeedbackError("");

    // 自分のAPI(/api/coach)を呼ぶ（Groqのキーはこの先＝サーバー側にある）
    // 通信やAPI側の失敗で画面が無反応にならないよう try/catch/finally で守る
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topicOf(values), answer: values.answer, conditions }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && typeof data.feedback === "string") {
        setFeedback(data.feedback);
        setReviewed({ topic: topicOf(values), answer: values.answer, smileScore });
      }
      else setFeedbackError(typeof data.error === "string" ? data.error : "エラーが起きました。もう一度お試しください。");
    } catch {
      setFeedbackError("通信に失敗しました。ネットワークを確認してください。");
    } finally {
      setLoading(false);
    }
  }
    async function speak() {
      if (isSpeaking || preparingAudio) return; //念の為の二重ガード

      setIsSpeaking(true); //開始時にロックして押せなくする
      setPreparingAudio(true); //音声を作っている間の表示
      setIsPaused(false);

      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: feedback, level: conditions.level }),
        });

        if (!res.ok) {
          throw new Error("TTSに失敗しました");
        }

        const data = await res.json();
        const audio = new Audio("data:audio/mp3;base64," + data.audio);
        audio.volume = volume;      // ★作成時点の音量を反映
        audio.playbackRate = rate;  // ★作成時点の速度を反映
        audioRef.current = audio;

        // ★再生が終わったらロック解除
        audio.onended = () => {
          setIsSpeaking(false);
          setPreparingAudio(false);
          setIsPaused(false);
          audioRef.current = null;
        }

        // ★再生自体が失敗した場合もロック解除(でないと永久に押せなくなる)
        audio.onerror = () => {
          setIsSpeaking(false);
          setPreparingAudio(false);
          setIsPaused(false);
          audioRef.current = null;
        }

        await audio.play();
        setPreparingAudio(false); // 音が出たら準備中の表示を消す
      } catch (e) {
        console.error(e);
        setIsSpeaking(false); // ★fetch失敗時などもロック解除
        setPreparingAudio(false);
        setIsPaused(false);
        audioRef.current = null;
      }
  }  
  
  //音声読み上げ
  function stopSpeaking() {
    if (audioRef.current) {
      audioRef.current.pause();  //currentTimeをリセットしない -> 続きから再生可能
    }
    setIsSpeaking(false);
    setIsPaused(true); //「停止中」の状態にする
  }

  // 続きから再生
  async function resumeSpeaking() {
    if (!audioRef.current) return;
    setIsSpeaking(true);
    setIsPaused(false);
    await audioRef.current.play(); // pause位置から自動的に再開される
  }

  // 最初から再生
  async function restartSpeaking() {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0; // ★再生位置を先頭に戻す
    setIsSpeaking(true);
    setIsPaused(false);
    await audioRef.current.play();
  }  

 // ★音量スライダーを動かした時
  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = Number(e.target.value);
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.volume = v; // 再生中でも即座に反映
    }
  }

  // ★速度スライダーを動かした時
  function handleRateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const r = Number(e.target.value);
    setRate(r);
    if (audioRef.current) {
      audioRef.current.playbackRate = r; // 再生中でも即座に反映
    }
  } 

  const [saving, setSaving] = useState(false);
  async function save() {
    if (saving || !reviewed) return;
    // 保存のときに確かめるのはメモだけ（テーマ・回答は講評を頼んだ時点で検証済み）
    if (!(await trigger("memo"))) return;
    setSaving(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "practice", conditions, ...reviewed, feedback, memo: getValues("memo"),
        }),
      });
      alert(res.ok ? "保存しました" : "保存に失敗しました");
    } catch {
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }


    return (
      <main className="flex-1 text-center leading-loose p-10">
        <div className="max-w-2xl mx-auto flex justify-between text-sm">
          <Link href="/" className="text-red-400 hover:underline">← トップへ戻る</Link>
          <Link href="/history" className="text-red-400 hover:underline">一覧へ →</Link>
        </div>
        <h1 className="font-serif text-4xl p-3 mt-6 mb-2">講評モード</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-2">{describeConditions(conditions)}</p>
        {/* 録音より前に読める位置に置く（NFR-04 / FR-P17） */}
        <div className="max-w-xl mx-auto mb-6">
          <Notice>{PRACTICE_SEND_NOTICE}</Notice>
        </div>

        <FaceMeter
          onScore={setSmileScore} />
      
        <Recorder onText={(t) => setValue("answer", t, { shouldValidate: true, shouldDirty: true })} />

        <div className="text-lg">
          テーマ：
          <select
            {...register("topicSelect")}
            className="cursor-pointer">
            {topics.map((t) => <option key={t} value={t}>{t}</option>)}
            <option value={FREE_TOPIC}>自由入力</option>
          </select>
        </div>
        {topicSelect === FREE_TOPIC && (
          <div className="max-w-xl mx-auto">
            <input
              type="text"
              {...register("freeTopic")}
              maxLength={TOPIC_MAX}
              aria-label="テーマ（自由入力）"
              aria-invalid={!!errors.freeTopic}
              aria-describedby="freeTopic-error"
              className="w-full mt-3 ring-2 rounded p-2 aria-[invalid=true]:ring-red-400"
              placeholder="例：挫折経験、10 年後のキャリア、あなたにとって仕事とは"
            />
            <FieldError id="freeTopic-error" message={errors.freeTopic?.message} />
          </div>
        )}

        <div className="max-w-xl mx-auto my-10">
          <textarea
            {...register("answer")}
            rows={5}
            maxLength={ANSWER_MAX}
            aria-label="回答"
            aria-invalid={!!errors.answer}
            aria-describedby="answer-error"
            className="w-full ring-2 rounded p-2 aria-[invalid=true]:ring-red-400"
            placeholder="ここに回答を入力"
          />
          <FieldError id="answer-error" message={errors.answer?.message} />
        </div>

        <div className="max-w-xl mx-auto">
          <textarea
            {...register("memo")}
            rows={5}
            maxLength={MEMO_MAX}
            aria-label="メモ"
            aria-invalid={!!errors.memo}
            aria-describedby="memo-error"
            className="h-20 w-full ring-2 rounded p-2 aria-[invalid=true]:ring-red-400"
            placeholder="ここにメモを入力"
          />
          <FieldError id="memo-error" message={errors.memo?.message} />
        </div>

        <button
          className="bg-red-400 text-white px-4 py-2 rounded 
        hover:bg-red-500 transition duration-300 transform hover:scale-110 cursor-pointer"
          onClick={handleSubmit(requestFeedback)}
          disabled={answer.trim() === "" || topic === "" || loading}>
          {loading ? "生成中…" : "コーチに見てもらう"}
        </button>
        {feedbackError && <p role="alert" className="mt-4 text-sm text-red-500">{feedbackError}</p>}

        {loading && (
          <div
            className="mt-12 max-w-2xl mx-auto p-6 text-left
           bg-red-50 dark:bg-gray-700 border-l-4 border-red-500 rounded-r-lg shadow-md"
            aria-busy="true">
            <SkeletonBox className="h-7 w-48 mb-4" />
            <div className="flex flex-col gap-6">
              <SkeletonLines count={3} />
              <SkeletonLines count={3} />
              <SkeletonLines count={2} />
            </div>
          </div>
        )}

        {feedback && (
          <div
            className="mt-12 max-w-2xl mx-auto p-6 text-left whitespace-pre-wrap
           bg-red-50 dark:bg-gray-700 border-l-4 border-red-500 rounded-r-lg shadow-md leading-relaxed">
            <h2 className="font-bold text-xl mb-4 border-b pb-2 border-red-200 dark:border-gray-600">
              フィードバック結果
            </h2>
            <div>{feedback}</div>

            <div className="flex flex-col gap-3 max-w-xs mx-auto mt-6 text-sm">
              <label className="flex items-center gap-3">
                <span className="w-16 text-left">🔊 音量</span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={handleVolumeChange}
                  className="flex-1"
                />
                <span className="w-10 text-right">{Math.round(volume * 100)}%</span>
              </label>

              <label className="flex items-center gap-3">
                <span className="w-16 text-left">⏩ 速度</span>
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={rate}
                  onChange={handleRateChange}
                  className="flex-1"
                />
                <span className="w-10 text-right">{rate.toFixed(1)}x</span>
              </label>
            </div>
            
            <div className="flex justify-center">
            {preparingAudio && <Pending className="mt-8">{WAITING.tts}</Pending>}

            {isSpeaking && !preparingAudio && (
                <button
                  onClick={stopSpeaking}
                  className="mt-8 bg-blue-500 rounded">⏸ 停止</button>
            )}

            {isPaused && (
                <div className="flex gap-4">
                  <button
                    onClick={resumeSpeaking}
                    className="mt-8 bg-blue-500 rounded justify-center"
                  >▶ 続きから再生</button>
                  <button
                    onClick={restartSpeaking}
                    className="mt-8 bg-blue-500 rounded justify-center"
                  >⏮ 最初から再生</button>
              </div>
            )}

              {!isSpeaking && !isPaused && (
              <div className="grid gap-3">
                <button
                  onClick={speak}
                  className="mt-8 bg-blue-500 rounded">▶ 音声読み上げ
                  </button>
                  <button
                    onClick={save}
                    disabled={saving}
                    className="bg-blue-500 rounded disabled:opacity-50">{saving ? "保存中…" : "保存する"}
                  </button>
                </div>
            )}
            </div>
          </div>
        )}
      </main>
    );
  }
