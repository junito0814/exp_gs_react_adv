# AI 面接コーチ

[![CI](https://github.com/junito0814/exp_gs_react_adv/actions/workflows/ci.yml/badge.svg)](https://github.com/junito0814/exp_gs_react_adv/actions/workflows/ci.yml)

ブラウザだけで面接練習ができる Web アプリ。AI が面接官役になって出題・深掘りし、**回答の内容・表情（笑顔）・話し方** の 3 軸で講評します。

- **内容** … 良かった点と改善点。言い換え例つき。現職への不満や数字のない実績は必ず指摘します
- **表情** … 話している間の笑顔率の平均（0.5 秒ごとにブラウザ内で計測）
- **話し方** … 回答の秒数と文字数、そして **回答までの沈黙の長さ**

## 2 つの練習モード

| モード | 質問 | 回答 | 流れ |
| --- | --- | --- | --- |
| **模擬面接** `/interview` | 面接官（AI）が条件に合わせて出題。選べない | **声のみ**。読み上げが終わると自動で録音が始まり、押すのは「話し終わり」だけ（編集・やり直し不可） | 質問（自動読み上げ）→ 回答 → 深掘り → 3 往復で総評 → 自動保存 |
| **講評モード** `/practice` | 定番テーマから選ぶ／自由入力 | 録音またはテキスト | 1 問 1 答 → 講評 → 手動で保存 |

面接官のレベルは 3 つ。**選ぶと読み上げの声も変わります**（[lib/voice.ts](lib/voice.ts)）。

| レベル | 振る舞い | 声 |
| --- | --- | --- |
| やさしめ | 肯定から入り、答えやすい形で深掘りする | 女性・標準の速さ |
| 厳しめ | 根拠・数字・具体例を求める | 男性・やや早口 |
| 圧迫 | 相槌を挟まず、弱い回答は一度否定して問い直す。最後に志望度を疑う | 男性・低め・早口 |

どのレベルでも、人格否定や、年齢・性別・家族構成などの不適切な質問はしません。回答者が言っていないことを前提にした決めつけも禁止しています。

## 画面

| パス | 内容 |
| --- | --- |
| `/sign-in` | ログイン（Google のみ） |
| `/sign-up` | 初回ログイン時に Clerk が参照する。見た目はログインと同じ |
| `/` | 面接条件（志望業界・職種・新卒/中途・現職または学部・面接の段階・企業の規模タイプ・面接官レベル）を選んで各モードへ |
| `/interview` | 模擬面接 |
| `/practice` | 講評モード |
| `/profile` | プロフィール設定（ES／職務経歴書／免許・資格） |
| `/history` | 履歴一覧（模擬面接・講評のタブ、笑顔スコアの推移グラフ） |
| `/history/[id]` | 履歴詳細（模擬面接は往復ごとの Q&A・笑顔・秒数と総評） |

## 使っている技術

- **Next.js 16**（App Router）/ React 19 / Tailwind CSS 4 / TypeScript
- **認証**: Clerk（Google ログインのみ）。`proxy.ts`（Next.js 16 で Middleware から改名）で全ページ・全 API を保護
- **AI**: Groq API — LLM `openai/gpt-oss-120b`（質問生成・講評・総評）、音声認識 `whisper-large-v3-turbo`（`verbose_json` のタイムスタンプから「回答までの沈黙」も測る）
- **読み上げ**: `@andresaya/edge-tts`。面接官レベルごとに声・速さ・ピッチを変える（日本語は `ja-JP-NanamiNeural` と `ja-JP-KeitaNeural` の 2 種類しかないため、速さとピッチで差を作る）
- **表情解析**: `@vladmandic/face-api`（ブラウザ内で推論。映像はサーバーに送らない）
- **DB**: Neon (PostgreSQL) + Drizzle ORM

## セットアップ

### 1. 依存関係

```bash
npm install
```

Node.js 20 以上が必要です。

### 2. 環境変数

`.env.example` をコピーして `.env.local` を作り、値を入れます（`.env.local` は Git 管理外）。

```bash
cp .env.example .env.local
```

| 変数 | 取得先 |
| --- | --- |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) → API Keys |
| `DATABASE_URL` | [Neon](https://neon.tech) のプロジェクト → Connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` | [Clerk](https://dashboard.clerk.com) → API Keys |

Clerk 側では **SSO Connections で Google を ON**、**Email / Password / Username / Phone を OFF** にします（Google ログインのみにするため）。

### 3. 顔認識のモデル

`public/models/` に face-api のモデル（`tiny_face_detector` と `face_expression`）を置きます。リポジトリに同梱済みです。

### 4. DB のテーブル

```bash
npm run db:push
```

スキーマは [db/schema.ts](db/schema.ts) です。`npm run db:generate` で SQL（`drizzle/`）を生成できますが、この DB は `push` で管理しています（`__drizzle_migrations` の記録が無いため `migrate` は使えません）。

### 5. 起動

```bash
npm run dev
```

http://localhost:3000 を開き、Google でログインします。**カメラとマイクの許可**が必要です。

> `npm run dev` と `npm run db:push` には `NODE_OPTIONS=--no-network-family-autoselection` が付いています。これが無いと環境によって Neon への接続が IPv6 でタイムアウトします。

## CI / デプロイ

- **CI**：PR と `main` への push で GitHub Actions が型チェック・lint・本番ビルドを回す（[.github/workflows/ci.yml](.github/workflows/ci.yml)）。キーはダミー値で通るため、本物のキーは GitHub に置いていない。
- **デプロイ**：Vercel の GitHub 連携。`main` に push で本番、PR ごとに Preview URL。手順と環境変数は [docs/deployment.md](docs/deployment.md) を参照。
- **DB のマイグレーションは自動実行しない**。`npm run db:push` は手元から実行する（理由は deployment.md）。

## スクリプト

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバー |
| `npm run build` | 本番ビルド |
| `npm start` | ビルド済みのものを起動 |
| `npm run lint` | ESLint（警告が 1 件でもあれば失敗する。CI と同じ条件） |
| `npm run db:generate` | スキーマから SQL を生成（記録用） |
| `npm run db:push` | スキーマを DB に適用 |

## プライバシー

- カメラ映像はブラウザ内で解析し、サーバーには送りません。
- 音声は文字起こしのためだけに Groq へ送り、保存しません。
- **プロフィール（ES・職務経歴書）は質問生成のために Groq へ送信されます。**
- **読み上げは Microsoft の音声合成サービス（`@andresaya/edge-tts`）を使うため、質問と総評の文章もそちらへ送信されます。** 総評には回答内容が含まれます。
- 上記はプロフィール画面と練習画面（模擬面接・講評）に明記しています。
- API キーはすべてサーバー側で扱い、ブラウザには出しません（Clerk の公開キーを除く）。

## ドキュメント

設計は [docs/](docs/README.md) にあります。

| ファイル | 内容 |
| --- | --- |
| [docs/01_requests.md](docs/01_requests.md) | 背景・ペルソナ・要求一覧・決定事項 |
| [docs/02_requirements.md](docs/02_requirements.md) | 機能要件・データ要件・非機能要件・プロンプト要件 |
| [docs/03_user_stories/](docs/03_user_stories/README.md) | 受け入れ条件 |
| [docs/04_tasks/](docs/04_tasks/README.md) | 実装タスクと進捗 |
| [docs/05_wireframes.md](docs/05_wireframes.md) | 画面構成と遷移 |
| [docs/deployment.md](docs/deployment.md) | デプロイ手順（Vercel）・環境変数・つまずきやすい点 |
