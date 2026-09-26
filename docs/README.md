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

## 更新ルール

- 要求 → 要件定義 → ユーザーストーリー → タスク の順に上流から下流へ整合させる。
- 仕様を変えるときは上流のドキュメントから直し、影響するタスクを更新する。
- ID（REQ-xx / FR-xx / NFR-xx / US-xx / T-xx）は一度振ったら変えない。
