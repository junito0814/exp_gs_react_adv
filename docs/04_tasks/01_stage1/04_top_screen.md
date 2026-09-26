[← 第 1 段階に戻る](./README.md)　9/22

# トップ画面 `/`

対応：US-03, US-04, US-05, US-10／FR-T01〜T03, T06

## T-131 既存画面の移動

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-131.1 | `app/page.tsx` を `app/practice/page.tsx` に移動（`git mv`）。import パスを直す | `/practice` で今まで通り動く | [x] |
| T-131.2 | `FaceMeter.tsx` `Recorder.tsx` は `app/` 直下のまま（`/interview` でも使うため） | - | [x] |

## T-132 条件フォーム（Client Component）

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-132.1 | `app/ConditionForm.tsx`（`"use client"`）：`useState<Conditions>(DEFAULT_CONDITIONS)` | - | [x] |
| T-132.2 | 志望業界・志望職種・区分・面接官レベルの `<select>` を `lib/options.ts` から生成 | 選択肢の並びが要求 4.1 と同じ | [x] |
| T-132.3 | `background` の `<input maxLength={100}>`。ラベルは `BACKGROUND_LABEL[career]`。下に「入力すると質問が具体的になります」 | 区分を切り替えるとラベルが変わる | [x] |
| T-132.4 | 年齢・性別などの欄が無いことを確認（要求 4.1.2） | - | [x] |
| T-132.5 | 新しい `app/page.tsx`（Server Component）：見出し「AI 面接コーチ」＋ `<ConditionForm />` ＋ リンク群 | - | [x] |

## T-133 遷移

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-133.1 | 「講評モードで練習」ボタン：`router.push("/practice?" + toQuery(conditions))` | 遷移先 URL に 5 キーが付く（`background` 空なら 4） | [x] |
| T-133.2 | 「模擬面接を始める」ボタン：第 1 段階では `disabled` ＋「第 2 段階で有効化」のツールチップ | 押せない | [x] |

## T-134 リンクとカメラ

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-134.1 | 「履歴を見る」→ `/history` | - | [x] |
| T-134.2 | 「プロフィール設定」の場所を空けておく（第 2 段階で追加） | - | [x] |
| T-134.3 | トップに `FaceMeter` `Recorder` を置かない | トップでカメラのランプが点かない | [x] |

## 完了条件

- [x] US-03, US-04 の AC が通る
- [x] US-05 の「遷移先 URL」「リロードしても残る」が通る
