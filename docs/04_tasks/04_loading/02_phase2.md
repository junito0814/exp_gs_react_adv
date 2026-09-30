[← ローディングに戻る](./README.md)

# phase 2：画面遷移

対応：決定事項 33 ／ NFR-12 ／ US-32 ／ FR-T07・FR-H09・FR-D06・FR-F07

`/` `/history` `/history/[id]` `/profile` は DB を読む（`force-dynamic`）ため、
リンクを押してから数百 ms〜数秒、**前の画面のまま固まる**。骨組み（スケルトン）を出して、
切り替わっていることが分かるようにする。

## タスク

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-402.1 | 骨組みの共通部品 `app/Skeleton.tsx`（`SkeletonBox` / `SkeletonLines`）。色の薄い箱をゆっくり点滅させるだけにする | 4 枚の骨組みで同じ見た目 | [x] |
| T-402.2 | トップの `loading.tsx`。あわせて `app/page.tsx` を **ルートグループ `app/(home)/`** へ移す（理由は下記） | `/interview` へ移動したときにトップの骨組みが出ない | [x] |
| T-402.3 | `app/history/loading.tsx`（戻る・見出し・タブ・棒グラフ・一覧 3 行） | 一覧と同じ位置に箱が出る | [x] |
| T-402.4 | `app/history/[id]/loading.tsx`（見出し・条件と日時・カード 2 枚） | 詳細と同じ位置に箱が出る | [x] |
| T-402.5 | `app/profile/loading.tsx`（3 セクションと保存ボタン） | プロフィールと同じ位置に箱が出る | [x] |
| T-402.6 | タブ切り替えとモード選択ボタンの進行中表示（`app/history/TabLink.tsx` に `useLinkStatus`、`ConditionForm` に `useTransition`） | タブを押すと押した側が薄くなる。「模擬面接を始める」が「準備しています…」になる | [x] |

## なぜトップだけルートグループに入れたか

`loading.js` は **同じ階層の `page.js` と、その下のすべてのページ** を `<Suspense>` で包む
（`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md`）。
そのため `app/loading.tsx` を置くと、`/interview` `/practice` `/sign-in` へ移動したときにも
**トップの骨組み**が出てしまう。

`app/(home)/page.tsx` + `app/(home)/loading.tsx` にすると範囲がトップだけに閉じる。
括弧付きのフォルダは URL に含まれないので、URL は `/` のまま。

## なぜタブは `loading.tsx` で足りないか

タブ切り替えは同じ画面の `?mode=` を変えるだけで、別のセグメントへの遷移ではない。
`loading.tsx` の fallback は出ないため、`useLinkStatus`（Link の進行中を拾うフック）で
押した側を薄くする。先読みすると押した瞬間に完了してしまうので `prefetch={false}` にする。

`/interview` `/practice` は DB を読まないので `loading.tsx` を置かない。
代わりにトップのボタン自体を「準備しています…」にして、押したことが分かるようにした（T-402.6）。

## 完了条件

- [x] `npx tsc --noEmit` と `npm run build` が通る（`FaceMeter` の既存警告 1 件のみ＝T-903）
- [x] ビルド結果に `/` が残っている（ルートグループで URL が変わっていない）

ブラウザで手で確認する項目：

- [ ] `/` `/history` `/history/[id]` `/profile` の読み込み中に骨組みが出る
- [ ] 履歴のタブを切り替えると、押した側が薄くなる
- [ ] 「模擬面接を始める」「講評モードで練習」が「準備しています…」になり、二度押しできない
- [ ] `/interview` へ移動したときにトップの骨組みが出ない
- [ ] ダークモードで骨組みが背景から浮かない（NFR-07）

## この phase では直さないもの

| 内容 | 行き先 |
| --- | --- |
| 「面接を始める」のマイク許可待ち、質問の読み上げ生成、保存中の文言、再保存ボタン、講評結果のスケルトン | phase 3 |
