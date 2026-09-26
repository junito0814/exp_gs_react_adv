[← 第 2 段階に戻る](./README.md)　9/25

# 模擬面接画面（2）回答

対応：US-14／FR-I05〜I08, I16, I17

## T-224 録音のみの回答 UI

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-224.1 | `Recorder.tsx` に `onStart?` `onStop?` を追加（録音開始・停止のタイミングを親に通知）。既存の講評モードには影響しない | 講評モードが変わらず動く | [x] |
| T-224.2 | `phase === "answering"` で `Recorder` を表示。`onStart` で `phase = "recording"`、録音開始時刻を保持 | - | [x] |
| T-224.3 | `phase === "recording"` 中は経過秒数を 1 秒ごとに表示（上限なし） | - | [x] |
| T-224.4 | `onStop` で `phase = "transcribing"`、`answerSeconds` を計算。`onText` で `transcript` に入れ `phase = "answering"`（送信待ち） | - | [x] |
| T-224.5 | `transcript` は `<p>` で表示（`textarea` にしない＝編集不可）。「録り直し」ボタンは置かない | - | [x] |
| T-224.6 | 「送信」ボタン：`transcript.trim() === ""` なら `disabled` ＋「回答が空です。もう一度録音してください」 | 空で押せない | [x] |
| T-224.7 | 送信時に `{ question, answer: transcript, smileScore: 現在値, answerSeconds }` を `turns` に push し `phase = "submitting"` | - | [x] |

## T-225 マイク不可時のフォールバック

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-225.1 | `Recorder` の `getUserMedia` 失敗を `onError` で親に通知 | - | [x] |
| T-225.2 | 通知を受けたら `fallbackText = true` にし、以降は `<textarea>` ＋「送信」に切り替え（`answerSeconds` は入力開始〜送信） | ブラウザでマイクをブロックして確認 | [x] |

## 完了条件

- [x] US-14 の AC が通る
