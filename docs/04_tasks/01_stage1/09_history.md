[← 第 1 段階に戻る](./README.md)　9/23

# 履歴改修（ユーザー分離・条件表示）

対応：US-02, US-10, US-11／FR-H01, H03〜H07, D01, D03, D04

## T-161 一覧 `/history`

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-161.1 | `requireUserId()`。無ければ `redirect("/sign-in")`（proxy で守られているが二重に） | - | [x] |
| T-161.2 | クエリに `where(eq(sessions.userId, userId))` を追加 | 別アカウントの記録が出ない | [x] |
| T-161.3 | 各行：テーマ／笑顔 NN%／`describeConditions(row)`／`createdAt` を `YYYY/MM/DD HH:mm` で表示 | - | [x] |
| T-161.4 | 戻るリンクを「← トップに戻る」（`/`）に変更 | - | [x] |
| T-161.5 | 棒グラフ・0 件案内・件数は既存のまま | - | [x] |

## T-162 詳細 `/history/[id]`

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-162.1 | `requireUserId()` ＋ `where(and(eq(id), eq(userId)))`。無ければ「見つかりませんでした」 | 他人の URL で「見つかりませんでした」 | [x] |
| T-162.2 | `id` が整数でない場合も「見つかりませんでした」 | `/history/abc` | [x] |
| T-162.3 | 条件（`describeConditions`）とメモ（あれば）を表示 | - | [x] |

## T-163 削除ボタン

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-163.1 | `DeleteButton.tsx`：`!res.ok` のとき status に応じて「見つかりませんでした」「削除に失敗しました」 | - | [x] |

## 完了条件

- [x] US-02, US-10, US-11 の AC が通る
