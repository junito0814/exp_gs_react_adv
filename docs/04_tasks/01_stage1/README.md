[← タスク一覧に戻る](../README.md)

# 第 1 段階：ログイン・トップ画面・講評モード改修（9/21〜9/23）

ゴール：**既存機能（講評・履歴）がログイン付きで、新しい面接条件体系の上で動く。**
対応ストーリー：US-01〜US-11

| # | 機能 | ファイル | 日 | 主な依存 | 状態 |
| --- | --- | --- | --- | --- | --- |
| 1 | 認証（Clerk） | [01_auth.md](./01_auth.md) | 9/21 | - | [x] |
| 2 | 共通定義（選択肢・条件・プロンプト） | [02_shared_definitions.md](./02_shared_definitions.md) | 9/21 | - | [x] |
| 3 | DB スキーマ変更 | [03_DB.md](./03_DB.md) | 9/21 | - | [x] |
| 4 | トップ画面 | [04_top_screen.md](./04_top_screen.md) | 9/22 | 2 | [x] |
| 5 | 講評モード改修 | [05_critique_mode.md](./05_critique_mode.md) | 9/22 | 2, 4 | [x] |
| 6 | 講評 API 改修 | [06_critique_api.md](./06_critique_api.md) | 9/22 | 1, 2 | [x] |
| 7 | セッション API 改修 | [07_sessions_api.md](./07_sessions_api.md) | 9/23 | 1, 3 | [x] |
| 8 | 音声 API 改修 | [08_speech_api.md](./08_speech_api.md) | 9/23 | 1 | [x] |
| 9 | 履歴改修 | [09_history.md](./09_history.md) | 9/23 | 1, 3, 7 | [x] |
| 10 | 確認・コミット | [10_verification.md](./10_verification.md) | 9/23 | すべて | [x] |

凡例: `[ ]` 未着手 / `[~]` 進行中 / `[x]` 完了

## 時間が押した場合

- 05 の「テーマ自由入力・区分別定番」（T-142.x）を第 3 段階へ回し、テーマは既存 4 択のまま。
