// lib/messages.ts — 画面で共有する文言
// プロフィール入力欄の注意書き（ES・職務経歴書・免許資格の 3 か所で同じ文を出す）
export const AI_SEND_NOTICE =
    "ここに入力した会社名・学校名などの情報は、面接の質問生成のために AI（外部サービス：Groq）へ送信されます。書きたくない情報は省略してください。";

// 待ち時間の表示（決定事項 33 / NFR-12）。
// ボタンの中は「生成中…」「保存中…」のまま。ボタンの外に出す説明はここに集める
export const WAITING = {
    mic: "マイクを準備しています…",          // 自動録音の開始待ち
    camera: "カメラを準備しています…",        // face-api の読み込み〜カメラ起動
    cameraFailed: "カメラを使えませんでした",  // 許可されなかった・使えなかった
    transcribing: "文字にしています…",        // 録音 → /api/transcribe
    question: "質問を準備しています…",         // /api/interview で質問を作っている
    summary: "総評をまとめています…",          // /api/interview/summary
    tts: "音声を準備しています…",             // /api/tts で音声を作っている
    deleting: "削除中…",                     // 履歴の削除（ボタン文言）
} as const;
