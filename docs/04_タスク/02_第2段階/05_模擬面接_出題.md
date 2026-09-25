[← 第 2 段階に戻る](./README.md)　9/25

# 模擬面接画面（1）基盤と出題

対応：US-12, US-13／FR-I01〜I04

## T-221 画面の骨格と状態管理

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-221.1 | `app/interview/page.tsx`（Server）：`await searchParams` → `parseConditions`、`isEmpty` なら `redirect("/")`。`InterviewClient` に渡す | - | [x] |
| T-221.2 | `app/interview/InterviewClient.tsx`（Client）：`useReducer` で状態 `phase: "idle" \| "asking" \| "answering" \| "recording" \| "transcribing" \| "submitting" \| "summarizing" \| "done"`、`question`、`turns: Turn[]`、`transcript`、`error`、`summary` | 要件 4.4 の状態遷移図と対応 | [x] |
| T-221.3 | 上部に `describeConditions`、「面接中断」ボタンの枠（07 で実装）、往復カウンタ「1 / 3」 | - | [x] |
| T-221.4 | `phase === "idle"` のとき「面接を始める」ボタンのみ表示 | - | [x] |

## T-222 カメラと初回質問

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-222.1 | 「面接を始める」で `FaceMeter` をマウント（`onScore` は `useCallback` で固定。インライン関数だとカメラが再起動する） | ランプが点く | [x] |
| T-222.2 | `fetchQuestion(turns)`：`POST /api/interview` → `question` を state に入れ、`phase = "answering"` | 数秒で質問が出る | [x] |
| T-222.3 | 失敗時は `error` に入れ、`phase = "asking"` のまま「もう一度」ボタンを出す（07 の T-230 と共通化） | - | [x] |

## T-223 自動読み上げ

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-223.1 | `question` が変わるたびに `POST /api/tts` → `new Audio(...)` で自動再生。既存の音量・速度 state を流用 | 質問と同時に音声 | [x] |
| T-223.2 | TTS 失敗（`!res.ok` or `play()` 拒否）は無視して続行。コンソールにだけ出す | キーを壊しても録音に進める | [x] |
| T-223.3 | 読み上げ中に録音を開始したら読み上げを停止する | - | [x] |

## 完了条件

- [x] US-12, US-13 の AC が通る
