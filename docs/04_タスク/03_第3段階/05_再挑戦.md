[← 第 3 段階に戻る](./README.md)

# 履歴からの再挑戦

対応：US-28／FR-D05／REQ-30

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-305.1 | `lib/conditions.ts`：`sessions` の行から `Conditions` を作る `conditionsFromRow(row)` | - | [ ] |
| T-305.2 | `/history/[id]`：「同じ条件で模擬面接」→ `/interview?${toQuery(conditions)}` | - | [ ] |
| T-305.3 | 講評の記録：「このテーマでもう一度（講評）」→ `/practice?${toQuery(conditions)}&topic=${row.topic}` | - | [ ] |
| T-305.4 | `/practice`：`topic` クエリがあれば、定番にあるならそれを選択、無ければ「自由入力」＋入力欄に入れる | テーマが入った状態で開く | [ ] |
| T-305.5 | 模擬面接の記録にも「このテーマで講評モード」（`topic = turns[0].question`）を置く | - | [ ] |
