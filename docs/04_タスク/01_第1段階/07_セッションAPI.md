[← 第 1 段階に戻る](./README.md)　9/23

# セッション API 改修

対応：US-02, US-09, US-11／FR-X06〜X09, X11／NFR-03

## T-152 `POST /api/sessions`

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-152.1 | `requireUserId()`。無ければ 401。`userId = "demo"` を削除 | - | [x] |
| T-152.2 | body の `mode` を `"practice"` に限定（第 2 段階で `"interview"` を追加）。それ以外は 400 | - | [x] |
| T-152.3 | `conditions` を再検証して `industry` `job` `career` `background` `level` に展開して insert | Neon で行を確認 | [x] |
| T-152.4 | body に `userId` があっても無視する | - | [x] |

## T-153 `GET /api/sessions?mode=`

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-153.1 | `requireUserId()`。`where(eq(sessions.userId, userId))` を必ず付ける | 別アカウントの行が返らない | [x] |
| T-153.2 | `?mode=` があれば `and(eq(sessions.mode, mode))` | - | [x] |

## T-154 `GET/DELETE /api/sessions/[id]`

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-154.1 | `Number(id)` が整数でなければ 400 | `/api/sessions/abc` → 400 | [x] |
| T-154.2 | GET：`where(and(eq(id), eq(userId)))`。無ければ 404 `{ error: "not found" }` | 他人の id → 404 | [x] |
| T-154.3 | DELETE：同じ条件で削除。`returning()` が空なら 404 | 他人の id → 404 で削除されない | [x] |

## 完了条件

- [x] US-02 の API 系 AC（他人の DELETE が 404、未ログイン 401）が通る
- [x] Bruno コレクションを更新
