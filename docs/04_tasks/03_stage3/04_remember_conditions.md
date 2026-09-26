[← 第 3 段階に戻る](./README.md)

# 前回条件の記憶

対応：US-27／FR-T05／REQ-29

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-304.1 | `db/schema.ts`：`profiles.lastConditions jsonb` を追加してマイグレーション（各列に default があるので空行を作れる） | - | [ ] |
| T-304.2 | `POST /api/sessions` の保存時に `profiles.lastConditions` を upsert（講評・模擬面接どちらでも） | - | [ ] |
| T-304.3 | `app/page.tsx`（Server）で `lastConditions` を読み、`ConditionForm` の初期値に渡す | 次回トップで前回の値が入る | [ ] |
| T-304.4 | 「初期値に戻す」リンクを置く | - | [ ] |
