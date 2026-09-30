"use client";
// app/FaceMeter.tsx — カメラ映像から笑顔率を測る（映像はブラウザの外へ出さない）

import { useEffect, useRef, useState } from "react";
import Pending from "@/app/Pending";
import { WAITING } from "@/lib/messages";

export default function FaceMeter({ onScore }: { onScore: (n: number) => void }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    // 親から渡された関数は ref 経由で呼ぶ。
    // カメラを起動する useEffect の依存に onScore を入れると、
    // 関数が変わるたびにカメラが止まって再起動してしまう。
    // 依存は空のままにし、渡された関数だけを差し替える（T-903）
    const onScoreRef = useRef(onScore);
    // ref の書き換えは描画中にはできないので effect で行う
    useEffect(() => {
        onScoreRef.current = onScore;
    }, [onScore]);
    const [smile, setSmile] = useState(0);
    // モデルの読み込みとカメラ起動には数秒かかる。その間は映像が黒いままなので、
    // 準備中であることを出し、笑顔率も出さない（「笑顔 0%」を測れたように見せない）
    const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        let stream: MediaStream | null = null; // 片付けでカメラを止めるために保持
        let cancelled = false;                 // 片付け済みなら以降の処理をやめる印

        async function start() {
            // ① face-api を "ブラウザで動き始めてから" 読み込む（重要・下の⚠️参照）
            const faceapi = await import("@vladmandic/face-api"); //動的インポートに変更

            // ② モデルを読み込む（public/models から）
            await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
            await faceapi.nets.faceExpressionNet.loadFromUri("/models");
            if (cancelled) return; // 読み込み中に画面を離れていたら、ここで終わる

            // ③ カメラを起動して video に流す
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (cancelled) {
                    stream.getTracks().forEach((t) => t.stop()); // 使わないので即止める
                    return;
                }
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    // ← srcObject 代入だけだと再生されず真っ黒な環境がある
                    // ← .catch() は「開発モードの2回実行」で出る AbortError を無視するため
                    await videoRef.current.play().catch(() => { });
                }
            } catch (e) {
                console.error(e);
                alert("カメラを使えませんでした。ブラウザのアドレスバーでカメラを『許可』してから、ページを再読み込みしてください。");
                setStatus("failed");
                return;
            }

            setStatus("ready");

            // ④ 0.5秒ごとに表情を測る
            timer = setInterval(async () => {
                if (!videoRef.current) return;
                const result = await faceapi
                    .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
                    .withFaceExpressions();
                if (result) {
                    const happy = Math.round(result.expressions.happy * 100);
                    setSmile(happy);
                    onScoreRef.current(happy); // 親にも笑顔率を渡す
                }
            }, 500);
        }

        start();
        // 片付け（画面を離れたとき／開発モードの2回目実行の前に呼ばれる）
        return () => {
            cancelled = true;
            clearInterval(timer);
            stream?.getTracks().forEach((t) => t.stop()); // ★カメラを止める（ランプが消える）
        };
        // 依存は空でよい：onScore は ref 経由で呼ぶので、
        // 親がインライン関数を渡してもカメラは再起動しない
    }, []);

    return (
        <div>
            {/* 枠の大きさは準備中も同じ（表示が出たときに画面が動かないように） */}
            <div className="relative mx-auto w-80 h-60">
                <video
                    ref={videoRef} autoPlay muted playsInline
                    width={320} height={240}
                    // 準備できるまで映像は隠す。要素は残す（srcObject を入れる先が必要）
                    className={`absolute inset-0 w-full h-full object-cover rounded
                        ${status === "ready" ? "opacity-100" : "opacity-0"}`} />
                {status !== "ready" && (
                    <div className="absolute inset-0 flex items-center justify-center
                        rounded bg-gray-100 dark:bg-gray-700">
                        {status === "loading"
                            ? <Pending>{WAITING.camera}</Pending>
                            : <p className="text-gray-600 dark:text-gray-300">{WAITING.cameraFailed}</p>}
                    </div>
                )}
            </div>
            {/* 測れていないうちは数字を出さない */}
            {status === "ready" && (
                <p>
                    {smile >= 70 ? "🤩" : smile >= 40 ? "🙂" : "😑"} 笑顔 {smile}%
                </p>
            )}
        </div>
    );
}