[← タスク一覧に戻る](../README.md)

# 第 2 段階：模擬面接・プロフィール・履歴の振り返り（9/24〜9/27）

ゴール：**条件を選んで模擬面接（3 往復 → 総評 → 自動保存）ができ、履歴で往復を読み返せる。**
対応ストーリー：US-12〜US-23

| # | 機能 | ファイル | 日 | 主な依存 | 状態 |
| --- | --- | --- | --- | --- | --- |
| 1 | DB（turns・profiles） | [01_DB.md](./01_DB.md) | 9/24 | 第 1 段階 | [x] |
| 2 | プロフィール（API・画面・プロンプト連携） | [02_profile.md](./02_profile.md) | 9/24 | 1 | [x] |
| 3 | 面接プロンプト | [03_interview_prompts.md](./03_interview_prompts.md) | 9/24 | - | [x] |
| 4 | 面接 API（質問・総評） | [04_interview_api.md](./04_interview_api.md) | 9/24 | 2, 3 | [x] |
| 5 | 模擬面接画面：基盤と出題 | [05_interview_questions.md](./05_interview_questions.md) | 9/25 | 4 | [x] |
| 6 | 模擬面接画面：回答 | [06_interview_answer.md](./06_interview_answer.md) | 9/25 | 5 | [x] |
| 7 | 模擬面接画面：進行・中断・総評・保存 | [07_interview_summary.md](./07_interview_summary.md) | 9/25 | 6 | [x] |
| 8 | セッション API（模擬面接の保存） | [08_sessions_api.md](./08_sessions_api.md) | 9/25 | 1 | [x] |
| 9 | 履歴（タブ・往復表示） | [09_history.md](./09_history.md) | 9/26 | 8 | [x] |
| 10 | トップ画面の更新 | [10_top_screen.md](./10_top_screen.md) | 9/26 | 2, 5 | [x] |
| 11 | 確認・提出 | [11_verification_release.md](./11_verification_release.md) | 9/26〜27 | すべて | [~] |

## 時間が押した場合

- 09：タブと往復表示をやめ、一覧に「模擬面接」ラベル＋詳細は総評のみ（`turns` は保存だけ）。
- 02：職務経歴書の行形式をやめ、ES・職務経歴書・資格を 3 つの `textarea` にする（注意書きは残す）。
- 06 の T-225（マイク不可時フォールバック）を第 3 段階へ。
