[← 第 1 段階に戻る](./README.md)　9/23

# 音声 API 改修（transcribe / tts）

対応：FR-X04, X05, X11／NFR-06
現状は失敗時に例外が素通りする。第 2 段階の模擬面接で「失敗しても続行」するために整える。

## T-155

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-155.1 | `POST /api/transcribe`：`requireUserId()`。`audio` が無ければ 400 | - | [x] |
| T-155.2 | Groq 呼び出しを try/catch。`!res.ok` または `data.text` 無しなら 502 `{ error }` | キーを壊して確認 | [x] |
| T-155.3 | `POST /api/tts`：`requireUserId()`。`text` が空なら 400。`synthesize` を try/catch し失敗は 502 `{ error }` | - | [x] |
| T-155.4 | `Recorder.tsx`：`res.ok` でなければ `alert("文字起こしに失敗しました")` して `onText` を呼ばない | - | [x] |

## 完了条件

- [x] 各 API が未ログインで 401、失敗時に 502 を返す
- [x] 既存の講評モードの録音・読み上げが変わらず動く
