# AI 面接コーチ

ブラウザだけで面接練習ができる Web アプリ。AI が面接官役になって出題・深掘りし、**回答の内容・表情（笑顔）・話し方** の 3 軸で講評します。

## 2 つの練習モード

| モード | 質問 | 回答 | 流れ |
| --- | --- | --- | --- |
| **模擬面接** `/interview` | 面接官（AI）が条件に合わせて出題。選べない | **録音のみ**（送信後のやり直し不可） | 質問（自動読み上げ）→ 回答 → 深掘り → 3 往復で総評 → 自動保存 |
| **講評モード** `/practice` | 定番テーマから選ぶ／自由入力 | 録音またはテキスト | 1 問 1 答 → 講評 → 手動で保存 |

面接官のレベルは「優しい／厳しい／意地悪」から選べます。どのレベルでも、人格否定や、年齢・性別・家族構成などの不適切な質問はしない指示を入れています。

## 画面

| パス | 内容 |
| --- | --- |
| `/sign-in` | ログイン（Google のみ） |
| `/` | 面接条件（志望業界・職種・新卒/中途・現職または学部・面接官レベル）を選んで各モードへ |
| `/interview` | 模擬面接 |
| `/practice` | 講評モード |
| `/profile` | プロフィール設定（ES／職務経歴書／免許・資格） |
| `/history` | 履歴一覧（模擬面接・講評のタブ、笑顔スコアの推移グラフ） |
| `/history/[id]` | 履歴詳細（模擬面接は往復ごとの Q&A・笑顔・秒数と総評） |

## 使っている技術

- **Next.js 16**（App Router）/ React 19 / Tailwind CSS 4 / TypeScript
- **認証**: Clerk（Google ログインのみ）。`proxy.ts`（Next.js 16 で Middleware から改名）で全ページ・全 API を保護
- **AI**: Groq API — LLM `openai/gpt-oss-120b`（質問生成・講評・総評）、音声認識 `whisper-large-v3-turbo`
- **読み上げ**: `@andresaya/edge-tts`（`ja-JP-NanamiNeural`）
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

## スクリプト

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバー |
| `npm run build` | 本番ビルド |
| `npm run lint` | ESLint |
| `npm run db:generate` | スキーマから SQL を生成（記録用） |
| `npm run db:push` | スキーマを DB に適用 |

## プライバシー

- カメラ映像はブラウザ内で解析し、サーバーには送りません。
- 音声は文字起こしのためだけに Groq へ送り、保存しません。
- **プロフィール（ES・職務経歴書）は質問生成のために Groq へ送信されます。** その旨を入力画面に明記しています。
- API キーはすべてサーバー側で扱い、ブラウザには出しません（Clerk の公開キーを除く）。

## ドキュメント

設計は [docs/](docs/README.md) にあります。

| ファイル | 内容 |
| --- | --- |
| [docs/01_要求.md](docs/01_要求.md) | 背景・ペルソナ・要求一覧・決定事項 |
| [docs/02_要件定義.md](docs/02_要件定義.md) | 機能要件・データ要件・非機能要件・プロンプト要件 |
| [docs/03_ユーザーストーリー/](docs/03_ユーザーストーリー/README.md) | 受け入れ条件 |
| [docs/04_タスク/](docs/04_タスク/README.md) | 実装タスクと進捗 |
| [docs/05_ワイヤーフレーム.md](docs/05_ワイヤーフレーム.md) | 画面構成と遷移 |
