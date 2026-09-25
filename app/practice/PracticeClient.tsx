"use client";
// app/practice/PracticeClient.tsx（講評モード。旧トップ画面を移動し、面接条件に対応）

import { useState, useRef } from "react";
import FaceMeter from "@/app/FaceMeter";
import Recorder from "@/app/Recorder";
import Link from "next/link";
import { TOPICS_BY_CAREER, TOPIC_MAX } from "@/lib/options";
import { describeConditions, type Conditions } from "@/lib/conditions";

const FREE_TOPIC = "__free__"; // プルダウンの「自由入力」を表す値

export default function PracticeClient({ conditions }: { conditions: Conditions }) {
  const topics = TOPICS_BY_CAREER[conditions.career];
  const [answer, setAnswer] = useState("");
  const [topicSelect, setTopicSelect] = useState<string>(topics[0]); // 定番 or FREE_TOPIC
  const [freeTopic, setFreeTopic] = useState("");                     // 自由入力の内容
  const topic = (topicSelect === FREE_TOPIC ? freeTopic : topicSelect).trim(); // 実際に使うテーマ
  const [memo, setMemo] = useState("")
  const [smileScore, setSmileScore] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false); //再生途中で止めたか
  const [volume, setVolume] = useState(1); //音声　０〜１
  const [rate, setRate] = useState(1); //再生速度:１が標準
  const audioRef = useRef<HTMLAudioElement | null>(null); //再生中のAudioを保持


  async function handleSubmit() {
    setLoading(true);
    setFeedback("");

    // 自分のAPI(/api/coach)を呼ぶ（Groqのキーはこの先＝サーバー側にある）
    // 通信やAPI側の失敗で画面が無反応にならないよう try/catch/finally で守る
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, answer, conditions }),
      });
      // if (res.ok) {
      //   setAnswer("");
      // }
      const data = await res.json();
      setFeedback(data.feedback ?? "エラーが起きました。もう一度お試しください。");
    } catch {
      setFeedback("通信に失敗しました。ネットワークを確認してください。");
    } finally {
      setLoading(false);
    }
  }
    async function speak() {
      if (isSpeaking) return; //念の為の二重ガード

      setIsSpeaking(true); //開始時にロックして押せなくする
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
          setIsPaused(false);
          audioRef.current = null;
        }

        // ★再生自体が失敗した場合もロック解除(でないと永久に押せなくなる)
        audio.onerror = () => {
          setIsSpeaking(false);
          setIsPaused(false);
          audioRef.current = null;
        }

        await audio.play();
      } catch (e) {
        console.error(e);
        setIsSpeaking(false); // ★fetch失敗時などもロック解除
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
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "practice", conditions, topic, answer, smileScore, feedback, memo }),
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
        <p className="text-gray-600 dark:text-gray-300 mb-6">{describeConditions(conditions)}</p>

        <FaceMeter
          onScore={setSmileScore} />
      
        <Recorder onText={(t) => setAnswer(t)} />

        <div className="text-lg">
          テーマ：
          <select
            value={topicSelect}
            onChange={(e) => setTopicSelect(e.target.value)}
            className="cursor-pointer">
            {topics.map((t) => <option key={t} value={t}>{t}</option>)}
            <option value={FREE_TOPIC}>自由入力</option>
          </select>
        </div>
        {topicSelect === FREE_TOPIC && (
          <input
            type="text"
            value={freeTopic}
            maxLength={TOPIC_MAX}
            onChange={(e) => setFreeTopic(e.target.value)}
            className="w-full max-w-xl mt-3 ring-2 rounded p-2"
            placeholder="例：挫折経験、10 年後のキャリア、あなたにとって仕事とは"
          />
        )}

        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={5}
          className="w-full max-w-xl m-10 ring-2 rounded p-2"
          placeholder="ここに回答を入力"
        />

        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={5}
          className="h-20 w-full max-w-xl  ring-2 rounded p-2"
          placeholder="ここにメモを入力"
        />

        <button
          className="bg-red-400 text-white px-4 py-2 rounded 
        hover:bg-red-500 transition duration-300 transform hover:scale-110 cursor-pointer"
          onClick={handleSubmit}
          disabled={answer.trim() === "" || topic === "" || loading}>
          {loading ? "生成中…" : "コーチに見てもらう"}
        </button>

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
            {isSpeaking && (
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
