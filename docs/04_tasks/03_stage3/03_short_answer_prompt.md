[← 第 3 段階に戻る](./README.md)

# 短い回答への促し

対応：US-26／FR-I20／決定事項 6

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-303.1 | 閾値を決める（`MIN_ANSWER_CHARS`、30 文字程度） | - | [ ] |
| T-303.2 | `InterviewClient`：送信時に `transcript.length < MIN_ANSWER_CHARS` かつ `prompted === false` なら、API を呼ばずに「もう少し詳しく教えてください」を質問として表示し `prompted = true`。`turns` には積まない | 往復カウンタが増えない | [ ] |
| T-303.3 | 促し後の回答は元の質問への回答として `turns` に積む（`question` は元の質問） | - | [ ] |
| T-303.4 | 2 回目以降の短い回答はそのまま送信する | - | [ ] |
| T-303.5 | 促し文も TTS で読み上げる | - | [ ] |
