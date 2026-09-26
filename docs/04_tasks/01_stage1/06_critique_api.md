[← 第 1 段階に戻る](./README.md)　9/22

# 講評 API `POST /api/coach` 改修

対応：US-08／FR-X01, FR-X11／要件 5.1, 5.2

## T-151

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-151.1 | 先頭で `requireUserId()`。無ければ 401 | 未ログインで 401 | [x] |
| T-151.2 | body を `{ topic, answer, conditions }` として受け取り、`conditions` は `parseConditions` 相当で再検証（クライアントの値を信用しない） | 不正値は初期値に丸まる | [x] |
| T-151.3 | `topic` `answer` が空なら 400 | - | [x] |
| T-151.4 | `messages` を `[ { role: "system", content: buildSystemPrompt(conditions) }, { role: "user", content: buildCoachPrompt(topic, answer) } ]` にする。既存の `tone` 埋め込みプロンプトを削除 | - | [x] |
| T-151.5 | 既存の 400／502 処理はそのまま | Groq キーを一時的に壊して 502 を確認 | [x] |
| T-151.6 | 3 レベル × 新卒／中途 で 1 回ずつ叩き、口調の差と禁止事項違反の有無を目視 | Bruno（`test/opencollection.yml`）を更新して叩く | [x] |

## 完了条件

- [x] US-08 の AC が通る（口調セレクトが無い／レベル差が出る／不適切な言及が無い／3 セクション）
