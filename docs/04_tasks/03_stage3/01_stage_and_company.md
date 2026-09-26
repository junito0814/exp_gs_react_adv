[← 第 3 段階に戻る](./README.md)

# 面接の段階・企業タイプ

対応：US-24／FR-T01（`stage` `company`）／要件 3 章

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-301.1 | `lib/options.ts`：`STAGES`（first／second／final）、`COMPANIES`（large／sme／startup／public） | - | [ ] |
| T-301.2 | `lib/conditions.ts`：`Conditions` に `stage` `company` を追加（任意、初期値 first／large）。parse／toQuery／describe を更新 | - | [ ] |
| T-301.3 | `ConditionForm`：プルダウン 2 つを追加 | - | [ ] |
| T-301.4 | `lib/prompts.ts`：段階ごとの出題傾向（一次＝人物・基本、二次＝経験の深掘り、最終＝志望度・ビジョン）、企業タイプごとの志望動機の突き方を system に追加 | 最終で「入社後」系の質問が出る | [ ] |
| T-301.5 | `db/schema.ts`：`sessions` に `stage` `company`（text, nullable）を追加してマイグレーション。履歴の条件表示に含める | - | [ ] |
