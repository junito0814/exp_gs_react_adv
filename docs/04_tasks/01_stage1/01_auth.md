[← 第 1 段階に戻る](./README.md)　9/21

# 認証（Clerk / Google のみ）

対応：US-01, US-02／FR-A01〜A05, FR-X11／NFR-03, NFR-09
実装前に `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` と `02-guides/authentication.md` を読む（Next.js 16 では Middleware が `proxy.ts` に改名されている）。

## T-101 Clerk の準備

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-101.1 | Clerk ダッシュボードでアプリを作成 | - | [x] |
| T-101.2 | Sign-in options：**Google のみ** ON。Email / Password / Username / Phone を OFF | サインイン画面に Google ボタンだけが出る | [x] |
| T-101.3 | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` `CLERK_SECRET_KEY` を `.env.local` に追記（変数名は追記済み、値は貼り付け待ち）。`.gitignore` に含まれていることを再確認 | `git status` に `.env.local` が出ない | [x] |
| T-101.4 | `npm i @clerk/nextjs` | `package.json` に追加される | [x] |

## T-102 Provider

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-102.1 | `app/layout.tsx`：`<ClerkProvider>` で `<html>` を包む | ビルドエラーなし | [x] |
| T-102.2 | `app/layout.tsx`：ヘッダーを追加し、`<SignedIn><UserButton /></SignedIn>` を右上に置く | ログイン後にアイコンが出て、そこからログアウトできる | [x] |

## T-103 ルート保護（`proxy.ts`）

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-103.1 | プロジェクト直下に `proxy.ts` を作成し、`clerkMiddleware` を export。`createRouteMatcher(["/sign-in(.*)"])` を公開ルートにし、それ以外は `auth.protect()` | 未ログインで `/` を開くと `/sign-in` へ | [x] |
| T-103.2 | `config.matcher` を Clerk 推奨の値（静的ファイル除外＋`/(api|trpc)(.*)`）にする | `/api/sessions` に未ログインで GET すると 401（Clerk が返す） | [x] |
| T-103.3 | ログイン後のリダイレクト先を `/` にする（`NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/` または `SignIn` の props） | ログイン後トップに戻る | [x] |

## T-104 サインインページ

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-104.1 | `app/sign-in/[[...sign-in]]/page.tsx` を作成し、`<SignIn />` を中央に配置 | Google ボタンのみ表示される | [x] |
| T-104.2 | 既存ページと同じ配色（`bg-white dark:bg-gray-800`）で包む | ダークモードで違和感がない | [x] |

## T-106 サーバー側の userId 取得ヘルパー

| ID | やること | 確認 | 状態 |
| --- | --- | --- | --- |
| T-106.1 | `lib/auth.ts`：`requireUserId()` を作る。`const { userId } = await auth()`、無ければ `null` を返す | - | [x] |
| T-106.2 | Route Handler 用に `unauthorized()`（`Response.json({ error: "unauthorized" }, { status: 401 })`）を同ファイルに置く | 後続の API 改修で使う | [x] |

## 完了条件

- [x] US-01 の AC がすべて通る（未ログイン→`/sign-in`、Google のみ、ログアウトできる、ログアウト後に `/history` → `/sign-in`）
- [x] `npm run build` が通る
