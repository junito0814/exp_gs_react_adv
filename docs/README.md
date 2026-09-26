# docs

「AI練習コーチ」（面接練習アプリ）に関するドキュメント置き場。

| ファイル | 内容 |
| --- | --- |
| [01_requests.md](./01_requests.md) | 誰が・なぜ・何を求めているか（背景・目的・ユーザーの要望） |
| [02_requirements.md](./02_requirements.md) | 要求を実現するために「システムが満たすべきこと」（機能要件・非機能要件・制約） |
| [03_user_stories/](./03_user_stories/README.md) | ユーザー視点の利用シナリオと受け入れ条件 |
| [04_tasks/](./04_tasks/README.md) | 実装タスク一覧と進捗 |
| [05_wireframes.md](./05_wireframes.md) | 画面ごとの構成要素と配置、画面遷移図 |
| [deployment.md](./deployment.md) | デプロイ手順（Vercel）・環境変数・DB の適用・つまずきやすい点 |

## 旧パスからの対応表（2026-09-26 リネーム）

フォルダ名・ファイル名を英語にした。古いリンクを見かけたときはここで対応を確認する。
本文（日本語）とドキュメント内のリンクは更新済み。マージ済み PR の本文には旧パスが残っている。

| 旧 | 新 |
| --- | --- |
| `03_ユーザーストーリー/` | `03_user_stories/` |
| `04_タスク/` | `04_tasks/` |
| `04_タスク/01_第1段階/`〜`03_第3段階/` | `04_tasks/01_stage1/`〜`03_stage3/` |
| `01_要求.md` / `02_要件定義.md` / `05_ワイヤーフレーム.md` | `01_requests.md` / `02_requirements.md` / `05_wireframes.md` |
| `A_ログインして自分の記録を守る.md` | `A_protect_my_records.md` |
| `B_面接条件を決めて練習に入る.md` | `B_choose_conditions.md` |
| `C_講評モードで練習する.md` | `C_critique_mode.md` |
| `D_履歴を見る.md` | `D_view_history.md` |
| `E_模擬面接を受ける.md` | `E_mock_interview.md` |
| `F_プロフィールを登録して深掘りを具体的にする.md` | `F_profile.md` |
| `G_模擬面接を振り返る.md` | `G_review_interview.md` |
| `H_第3段階.md` | `H_stage3.md` |
| `00_完了済み.md` / `99_バックログ.md` | `00_done.md` / `99_backlog.md` |
| `01_認証.md` / `02_共通定義.md` / `04_トップ画面.md` / `05_講評モード.md` | `01_auth.md` / `02_shared_definitions.md` / `04_top_screen.md` / `05_critique_mode.md` |
| `06_講評API.md` / `07_セッションAPI.md` / `08_音声API.md` / `09_履歴.md` / `10_確認.md` | `06_critique_api.md` / `07_sessions_api.md` / `08_speech_api.md` / `09_history.md` / `10_verification.md` |
| `02_プロフィール.md` / `03_面接プロンプト.md` / `04_面接API.md` | `02_profile.md` / `03_interview_prompts.md` / `04_interview_api.md` |
| `05_模擬面接_出題.md` / `06_模擬面接_回答.md` / `07_模擬面接_総評.md` | `05_interview_questions.md` / `06_interview_answer.md` / `07_interview_summary.md` |
| `10_トップ画面.md` / `11_確認・提出.md` | `10_top_screen.md` / `11_verification_release.md` |
| `01_面接段階・企業タイプ.md` / `02_考える時間.md` / `03_短い回答への促し.md` | `01_stage_and_company.md` / `02_thinking_time.md` / `03_short_answer_prompt.md` |
| `04_前回条件の記憶.md` / `05_再挑戦.md` / `06_前回回答との比較.md` | `04_remember_conditions.md` / `05_retry.md` / `06_compare_previous.md` |
| `07_NG表現の指摘.md` / `08_その他の自由入力.md` / `09_レベルの表示名.md` / `10_圧迫の体感差.md` | `07_ng_expressions.md` / `08_other_free_text.md` / `09_level_labels.md` / `10_pressure_feel.md` |

## 更新ルール

- 要求 → 要件定義 → ユーザーストーリー → タスク の順に上流から下流へ整合させる。
- 仕様を変えるときは上流のドキュメントから直し、影響するタスクを更新する。
- ID（REQ-xx / FR-xx / NFR-xx / US-xx / T-xx）は一度振ったら変えない。
