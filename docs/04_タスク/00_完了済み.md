[← 一覧に戻る](./README.md)

# 完了済み（Day 1〜3）

要求を拡張する前に実装済みの作業。対応欄の US-/FR- は旧ドキュメントの ID（現在の ID 体系とは異なる）。記録として残す。

## Day 1: 土台と AI フィードバック

| ID | タスク | 対応（旧 ID） | 状態 |
| --- | --- | --- | --- |
| T-01 | `create-next-app` でプロジェクト作成（Next.js 16 / React 19 / Tailwind 4） | - | [x] |
| T-02 | `.env.local` に `GROQ_API_KEY` を設定し、`.gitignore` 対象にする | NFR-01, 02 | [x] |
| T-03 | 練習画面: トピック選択・回答テキストエリア・送信ボタンを実装 | US-01, 03 | [x] |
| T-04 | `POST /api/coach` を実装（プロンプト構築 → Groq → `{feedback}`） | US-06 | [x] |
| T-05 | 不正 JSON（400）・Groq 失敗（502）のエラーハンドリング | FR-40 | [x] |
| T-06 | フロントで try/catch/finally によるエラー表示・ローディング表示 | FR-06, 08 | [x] |
| T-07 | 口調セレクトを追加し、プロンプトに反映 | US-05 | [x] |
| T-08 | フィードバックの出力フォーマット（3 セクション・空行区切り・250〜350 文字）をプロンプトで固定 | FR-07 | [x] |

## Day 2: 表情・音声

| ID | タスク | 対応（旧 ID） | 状態 |
| --- | --- | --- | --- |
| T-10 | `public/models` に face-api のモデル（tinyFaceDetector / faceExpressionNet）を配置 | US-04 | [x] |
| T-11 | `FaceMeter` コンポーネント: カメラ起動・0.5 秒間隔で笑顔率を計測・親へ通知 | US-04 | [x] |
| T-12 | face-api を動的 import にし、SSR で読み込まれないようにする | NFR-04 | [x] |
| T-13 | クリーンアップでカメラ停止・二重起動防止（`cancelled` フラグ） | FR-10 | [x] |
| T-14 | `Recorder` コンポーネント: MediaRecorder で録音 → webm を `/api/transcribe` へ送信 | US-02 | [x] |
| T-15 | `POST /api/transcribe` を実装（Groq Whisper, `language=ja`） | FR-41 | [x] |
| T-16 | マイク／カメラ許可エラー時の案内メッセージ | FR-04, 10 | [x] |
| T-17 | `POST /api/tts` を実装（Edge TTS → mp3 base64） | FR-42 | [x] |
| T-18 | 読み上げ UI: 再生／停止／続きから／最初から、二重再生ガード、失敗時のロック解除 | US-07 | [x] |
| T-19 | 音量・速度スライダー（再生中も即時反映） | FR-12 | [x] |

## Day 3: 保存と履歴

| ID | タスク | 対応（旧 ID） | 状態 |
| --- | --- | --- | --- |
| T-20 | Neon プロジェクト作成、`DATABASE_URL` を `.env.local` に設定 | NFR-01 | [x] |
| T-21 | Drizzle 導入（`db/index.ts`, `db/schema.ts`, `drizzle.config.ts`） | データ要件 | [x] |
| T-22 | `sessions` テーブル定義とマイグレーション生成・適用（`drizzle/0000_*.sql`） | データ要件 | [x] |
| T-23 | `GET/POST /api/sessions` を実装 | FR-43, 44 | [x] |
| T-24 | `GET/DELETE /api/sessions/[id]` を実装（`params` は `await`） | FR-45, 46 | [x] |
| T-25 | 練習画面に「保存する」ボタンとメモ欄を追加 | US-08 | [x] |
| T-26 | `/history` 一覧ページ（Server Component, `force-dynamic`, 新しい順, 件数表示, 0 件案内） | US-09 | [x] |
| T-27 | 一覧に笑顔スコアの棒グラフを追加 | US-10 | [x] |
| T-28 | `/history/[id]` 詳細ページ（回答・フィードバック・not found） | US-11 | [x] |
| T-29 | `DeleteButton`（confirm → DELETE → `router.refresh()`） | US-12 | [x] |
| T-30 | 練習画面 ⇄ 一覧 ⇄ 詳細 の相互リンク | FR-15, 32 | [x] |
