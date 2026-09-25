# デプロイ手順（Vercel）

このアプリは **Vercel の GitHub 連携** でデプロイする。`main` に push すると本番、PR を作ると Preview URL が自動で出る。
GitHub Actions 側はチェック（型・lint・ビルド）だけを担当し、デプロイには関与しない。

## 1. Vercel にリポジトリを Import

1. [vercel.com](https://vercel.com) にログイン → **Add New → Project**
2. `junito0814/exp_gs_react_adv` を選ぶ
3. Framework Preset が **Next.js** になっていることを確認（自動で判定される）
4. **この時点では Deploy を押さない。** 先に次の環境変数を登録する（登録前にビルドすると必ず失敗する）

## 2. 環境変数を登録

**Settings → Environment Variables** で以下を登録する。`.env.local` は Git にも Vercel にも渡らないので、ここで入れ直す必要がある。

| 変数 | 値の取得先 | 対象環境 |
| --- | --- | --- |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) → API Keys | Production / Preview / Development |
| `DATABASE_URL` | Neon のプロジェクト → Connection string | Production / Preview / Development |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [dashboard.clerk.com](https://dashboard.clerk.com) → API Keys | Production / Preview / Development |
| `CLERK_SECRET_KEY` | 同上 | Production / Preview / Development |

- **3 つの環境すべてにチェックを入れる。** Preview に入れ忘れると PR のプレビューだけ失敗する。
- 値の前後に空白や引用符が混ざらないよう注意（空文字は未設定と同じ扱いになる）。
- `NEXT_PUBLIC_` が付く変数はブラウザにも配られる公開情報。それ以外（`CLERK_SECRET_KEY` など）は絶対にクライアントへ渡さない。

登録後に **Deploy** を押す。

## 3. Clerk の本番設定

開発用のキー（`pk_test_` / `sk_test_`）のままでも動くが、Clerk のダッシュボードで利用上限がかかる開発インスタンスのままになる。

- **Domains** に Vercel のドメイン（`<project>.vercel.app`）を追加する
- 本番運用するなら Clerk で Production インスタンスを作り、`pk_live_` / `sk_live_` に差し替える
- **SSO Connections で Google が ON**、Email / Password / Username / Phone が OFF になっていることを確認（Google ログインのみにするため）

## 4. DB のテーブルを用意

**マイグレーションは自動実行しない。** `npm run db:push` はスキーマを直接書き換えるため、デプロイに組み込むと事故につながる。
スキーマを変えたときは、手元から本番の `DATABASE_URL` に対して実行する。

```bash
# .env.local の DATABASE_URL が本番を指していることを確認してから
npm run db:generate   # SQL を生成（記録用。drizzle/ に残す）
npm run db:push       # スキーマを DB に適用
```

Neon は 1 つのプロジェクト内でブランチを作れるので、Preview 用に別ブランチの接続文字列を使うと本番データを汚さずに試せる。

## 5. 動作確認

デプロイ後、次を確認する。

1. `/` を開くと `/sign-in` にリダイレクトされる
2. Google でログインできる（Clerk の Domains に Vercel ドメインを入れていないとここで失敗する）
3. トップで条件を選び、講評モードで講評が返る（= `GROQ_API_KEY` が効いている）
4. 保存 → `/history` に出る（= `DATABASE_URL` が効いている）
5. 模擬面接でカメラ・マイクの許可が出る（**HTTPS でないと出ない**。Vercel は HTTPS なので問題ない）

## つまずきやすい点

| 症状 | 原因 |
| --- | --- |
| `Missing required environment variables` 系でビルドが落ちる | Vercel に環境変数を入れる前に Deploy した。登録して Redeploy する |
| PR のプレビューだけ落ちる | 環境変数の対象環境に Preview を入れていない |
| ログインで Clerk のエラー | Clerk の Domains に Vercel のドメインを追加していない |
| 講評が「AI との通信に失敗しました」 | `GROQ_API_KEY` が未設定、または無料枠のレート制限（TPM 8000）。時間を置くか Dev Tier にする |
| 履歴が空・保存に失敗 | `DATABASE_URL` が未設定、または `npm run db:push` をしていない |
| カメラ・マイクが起動しない | ブラウザで許可していない。アドレスバーのアイコンから許可する |

## ローカル開発との違い

ローカルでは `npm run dev` に `NODE_OPTIONS=--no-network-family-autoselection` を付けている（環境によって Neon への接続が IPv6 でタイムアウトするため）。Vercel 上では不要。
