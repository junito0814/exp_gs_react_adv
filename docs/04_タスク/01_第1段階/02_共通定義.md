[← 第 1 段階に戻る](./README.md)　9/21

# 共通定義（選択肢・面接条件・プロンプト）

対応：要件 3 章, 5.1／FR-P03, FR-P01／NFR-08
画面・API・プロンプトで同じ定義を使うために `lib/` に切り出す。

## T-111 `lib/options.ts`：選択肢

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-111.1 | `INDUSTRIES`：`{ key, label }[]`。IT／メーカー／金融／商社／小売・サービス／医療・福祉／公務員／その他 | - | [x] |
| T-111.2 | `JOBS`：エンジニア／営業／企画・マーケ／事務／接客・販売／研究・開発／その他 | - | [x] |
| T-111.3 | `CAREERS`：`new`（新卒）／`mid`（中途） | - | [x] |
| T-111.4 | `LEVELS`：`kind`（やさしめ）／`strict`（厳しめ）／`harsh`（圧迫）※表示名は #43 で変更 | - | [x] |
| T-111.5 | `TOPICS_BY_CAREER`：`new` = 自己紹介／ガクチカ／自己PR／志望動機／長所・短所／挫折経験、`mid` = 自己紹介／職務経歴・実績／転職理由／志望動機／長所・短所／マネジメント経験 | 新卒側に「転職理由」がない | [x] |
| T-111.6 | `BACKGROUND_LABEL`：`new` → 「学部・専攻」、`mid` → 「現職（業界・職種・年数）」。`BACKGROUND_MAX = 100`, `TOPIC_MAX = 100` | - | [x] |
| T-111.7 | `labelOf(list, key)`：キー → 表示名（未知のキーは空文字） | - | [x] |

## T-112 `lib/conditions.ts`：面接条件の型と変換

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-112.1 | `type Conditions = { industry; job; career; level; background }` | - | [x] |
| T-112.2 | `DEFAULT_CONDITIONS`：IT／エンジニア／new／kind／"" | - | [x] |
| T-112.3 | `parseConditions(searchParams)`：各キーを検証し、不正値は初期値に丸める。`background` は 100 文字で切り詰め。戻り値に `isEmpty`（クエリが 1 つも無い）を含める | `?industry=xxx` → IT に丸まる | [x] |
| T-112.4 | `toQuery(conditions)`：`URLSearchParams` 文字列に変換（空の `background` は省略） | `/practice?` に付けてリロードしても同じ条件 | [x] |
| T-112.5 | `describeConditions(conditions)`：「IT／エンジニア／新卒／やさしめ」形式の文字列 | 画面上部の表示に使う | [x] |

## T-113 `lib/prompts.ts`：共通 system プロンプト

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-113.1 | `LEVEL_BEHAVIOR`：レベルごとの振る舞い文（要件 5.1 の表を文章化） | - | [x] |
| T-113.2 | `PROHIBITED`：禁止事項（人格否定・暴言、年齢・性別・出身地・家族構成・思想信条・宗教への言及や質問） | - | [x] |
| T-113.3 | `CAREER_TENDENCY`：新卒＝学生時代の経験・志望動機・人柄、中途＝実績・転職理由・志望先での再現性。新卒に転職理由を出さない | - | [x] |
| T-113.4 | `buildSystemPrompt(conditions, profile?)`：上記＋条件の説明＋`background` があれば「現状→志望先の差分を必ず 1 度は問う」＋`profile` があれば「ES にある内容を具体的に参照する」を結合 | 引数を変えて出力を目視 | [x] |
| T-113.5 | `buildCoachPrompt(topic, answer)`：既存の講評フォーマット（3 セクション・250〜350 文字）を user メッセージとして生成。口調の指示は `LEVEL_BEHAVIOR` に委ねる | 既存 `route.ts` の文面を移植 | [x] |

## 完了条件

- [x] `lib/options.ts` `lib/conditions.ts` `lib/prompts.ts` が型エラーなく import できる
- [x] 画面・API 側に選択肢やプロンプト文をハードコードしていない
