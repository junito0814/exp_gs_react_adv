[← 第 2 段階に戻る](./README.md)　9/24

# 面接 API

対応：US-12, US-15, US-17／FR-X02, X03, X11

## T-212 `POST /api/interview`

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-212.1 | `app/api/interview/route.ts`：`requireUserId()`。body `{ conditions, turns }` を検証（`turns` は配列、各要素に `question` `answer` 文字列。3 件以上なら 400） | - | [x] |
| T-212.2 | `getProfile(userId)` → `formatProfileForPrompt` → `buildInterviewerSystemPrompt` | - | [x] |
| T-212.3 | `turns.length === 0` なら初回用、そうでなければ深掘り用の `messages` を組み立てて Groq を呼ぶ（`response_format: { type: "json_object" }` が使えれば付ける） | - | [x] |
| T-212.4 | `parseQuestion` で `{ question }` を返す。Groq 失敗は 502 `{ error }` | - | [x] |

## T-213 `POST /api/interview/summary`

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-213.1 | `app/api/interview/summary/route.ts`：`requireUserId()`。body `{ conditions, turns }`（`smileScore` `answerSeconds` 必須、1〜3 件） | - | [x] |
| T-213.2 | `buildSummaryPrompt` で Groq を呼び `{ summary }` を返す。失敗は 502 | - | [x] |

## T-214 出題の偏り確認（要件 未決事項 1）

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-214.1 | Bruno で「IT／エンジニア／新卒／優しい」の初回質問を 5 回取得し、テーマを記録 | - | [x] |
| T-214.2 | **実施**：AI 任せでは 5 回中 4 回が「学生時代のプロジェクト」に偏ったため、`lib/interview.ts` の `pickTopic()` で定番から抽選し、AI には言い回しだけ任せる方式に変更（直近テーマを除外する引数付き） | 5 回中 4 種類（基準クリア） | [x] |
| T-214.3 | 深掘りを 2 段まで叩き、直前回答の引用があること・テーマが変わらないこと・質問文で終わることを確認 | - | [x] |
| T-214.4 | 「意地悪」で 3 往復 ＋ 総評を叩き、禁止事項違反が無いか読む | - | [x] |

## 実装で分かったこと

- 出題を AI に任せるとテーマが偏る（IT／エンジニア／新卒で 5 回中 4 回が「学生時代のプロジェクト」）。
  → `pickTopic()` でサーバー側抽選に変更し、5 回中 4 種類まで改善。
- テーマは 1 回の面接で固定する必要があるため、`/api/interview` はレスポンスに `topic` を含め、
  クライアントは 2 問目以降それをそのまま送り返す。
- Groq 呼び出しは `lib/groq.ts` に切り出し、429（回数制限）のときは専用の文言を返す。

## 完了条件

- [x] API 単体で「初回質問 → 深掘り × 2 → 総評」が返る
- [x] Bruno コレクションに 3 リクエストを追加
