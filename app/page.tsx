"use client";
// src/app/page.tsx

import { useState, useRef } from "react";
import FaceMeter from "./FaceMeter"; 
import Recorder from "./Recorder";

export default function Home() {
  const [answer, setAnswer] = useState("");
  const [topic, setTopic] = useState("自己紹介");
  const [tone, setTone] = useState("やさしめ");
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
        body: JSON.stringify({ topic, answer, tone, smileScore }),
      });
      if (res.ok) {
        setAnswer("");
      }
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
          body: JSON.stringify({ text: feedback }),
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


    return (
      <main className="text-center leading-loose p-10 bg-white dark:bg-gray-800 text-black dark:text-white">
        <h1 className="font-serif text-4xl p-3 m-10">AI練習コーチ</h1>

        <FaceMeter
          onScore={setSmileScore} />
      
        <Recorder onText={(t) => setAnswer(t)} />

        <div className="text-lg">
          トピック：
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="cursor-pointer">
            <option value="自己紹介">自己紹介</option>
            <option value="志望動機">志望動機</option>
            <option value="長所">長所</option>
            <option value="転職理由">転職理由</option>
          </select>
        </div>

        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={5}
          className="w-full max-w-xl m-10 ring-2 rounded p-2"
          placeholder="ここに回答を入力"
        />

        <div className="m-8 text-lg">
          口調：
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="cursor-pointer">
            <option value="やさしめ">やさしめ</option>
            <option value="スパルタ">スパルタ</option>
            <option value="ていねい">ていねい</option>
            <option value="関西弁">関西弁</option>
          </select>
        </div>

        <button
          className="bg-red-400 text-white px-4 py-2 rounded 
        hover:bg-red-500 transition duration-300 transform hover:scale-110 cursor-pointer"
          onClick={handleSubmit}
          disabled={answer.trim() === "" || loading}>
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
                <button
                  onClick={speak}
                  className="mt-8 bg-blue-500 rounded">▶ 音声読み上げ</button>
            )}
            </div>
          </div>
        )}
      </main>
    );
  }
