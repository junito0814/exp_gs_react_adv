[← 第 2 段階に戻る](./README.md)　9/25

# セッション API（模擬面接の保存）

対応：US-18／FR-X07

## T-241 `POST /api/sessions` に `mode: "interview"` を追加

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-241.1 | `mode === "interview"` のとき body `{ conditions, turns, summary }` を検証（`turns` 1〜3 件、各要素の型） | 不正なら 400 | [ ] |
| T-241.2 | 保存内容：`topic = turns[0].question`、`turns`、`feedback = summary`、`smileScore = turns[turns.length - 1].smileScore`、`answerText = null`、`memo = null` | Neon で行を確認 | [ ] |
| T-241.3 | レスポンスに `{ ok: true, id }` を含める（総評後の「履歴を見る」で使う） | - | [ ] |
| T-241.4 | `mode === "practice"` の既存処理は変えない | 講評モードの保存が動く | [ ] |

## 完了条件

- [ ] 模擬面接を 1 回通すと `sessions` に `mode = interview` の行が 1 件できる
