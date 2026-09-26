[← 第 2 段階に戻る](./README.md)　9/26

# 履歴（タブ・往復表示）

対応：US-22, US-23／FR-H02, H05, D02

## T-242 一覧のタブ

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-242.1 | `app/history/page.tsx`：`const { mode } = await searchParams`。`"practice"` 以外は `"interview"` 扱い | - | [x] |
| T-242.2 | クエリに `and(eq(userId), eq(mode))` | - | [x] |
| T-242.3 | タブ UI：`<Link href="/history?mode=interview">模擬面接</Link>` `<Link href="/history?mode=practice">講評</Link>`。選択中を下線＋太字 | リロードしてもタブが保たれる | [x] |
| T-242.4 | 見出しの件数、棒グラフ、一覧をタブの rows で描画（模擬面接の棒は `smileScore` ＝ 最終往復） | タブごとに件数が変わる | [x] |
| T-242.5 | 模擬面接の行：`topic`（初回質問）を 30 文字で省略表示 | - | [x] |

## T-243 詳細の往復表示

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-243.1 | `app/history/[id]/page.tsx`：`row.mode` で分岐 | - | [x] |
| T-243.2 | 模擬面接：条件 → `turns.map` で「Q{n}. 質問」「A. 回答」「😊 笑顔 NN%　⏱ MM 秒」のカードを順に → 最後に「🤖 総評」カード | 3 往復分＋総評 | [x] |
| T-243.3 | 講評：既存表示（回答／講評／メモ） | - | [x] |
| T-243.4 | 戻るリンクを `/history?mode=${row.mode}` にする | 元のタブに戻る | [x] |

## 完了条件

- [x] US-22, US-23 の AC が通る
