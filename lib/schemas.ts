// lib/schemas.ts — 入力検証のスキーマ（画面のフォームと API で共有する。#70）
// 画面（react-hook-form）とサーバー（Route Handler）で同じ規則を使うことで、
// 画面の検証をすり抜けた値（Bruno・改ざんしたリクエスト）もサーバーで同じように弾く。
// クライアントからも import するので、DB やサーバー専用のモジュールを読み込まないこと
import { z } from "zod";
import {
    INDUSTRIES, JOBS, CAREERS, LEVELS, STAGES, COMPANIES,
    BACKGROUND_MAX, OTHER_MAX, TOPIC_MAX, type Option,
} from "./options";

// ---- 上限 ----
// AI の出力（質問・講評・総評）と文字起こしは、生成した API 側でこの上限に切り詰めてから返す。
// プロンプトでは質問 100〜140 字・講評 450 字以内と指示しているので、上限には十分な余裕がある
export const ANSWER_MAX = 4000;    // 回答（手入力・文字起こし）
export const QUESTION_MAX = 1000;  // 面接官の質問
export const MEMO_MAX = 2000;      // 講評モードのメモ
export const FEEDBACK_MAX = 4000;  // AI の講評・総評
const TTS_TEXT_MAX = FEEDBACK_MAX; // 読み上げる文章（質問・講評・総評をそのまま読む）
const SECONDS_MAX = 3600;          // 回答・考える時間の秒数（超えたら頭打ち）
// 録音ファイルの上限。Vercel の関数が受け取れる本文（4.5MB）より小さくする。
// Recorder は 4 分で自動停止する（128kbps で録られても収まる）
export const AUDIO_MAX_BYTES = 4 * 1024 * 1024;

// ---- 文字列の整形 ----

// 取り除く文字。画面に見えないまま AI への指示を紛れ込ませたり、表示の向きを入れ替えたりできないようにする
//  - 制御文字（Cc）。改行・タブは残す（1 行の欄では cleanText が空白にする）
//  - 書式文字（Cf）：ゼロ幅・双方向制御・BOM・ソフトハイフン・タグ文字（U+E0000〜）など。
//    ZWJ（U+200D）は絵文字の合成に使うので残す。タグ文字で表す地域旗（イングランド旗など）は黒旗だけになる
//  - 私用領域（Co）・未割り当て（Cn）・孤立したサロゲート（Cs。DB の jsonb / text が受け付けない）
//  - 異体字セレクタ U+FE00〜FE0E、モンゴル文字の自由異体字セレクタ、クメール文字の不可視母音、
//    結合書記素ジョイナー、ハングルの埋め字、点字の空白、置換用オブジェクト文字
//  絵文字の U+FE0F と、人名の異体字（「葛」の字形違いなど）に使う漢字用の異体字セレクタ（U+E0100〜）は残す。
//  ただし漢字用の異体字セレクタは漢字の直後の 1 つだけ（それ以外は情報の埋め込みに使えるので IVS_STRAY で消す）
const INVISIBLE =
    /(?![\n\t\u200D])[\p{Cc}\p{Cf}\p{Co}\p{Cn}\p{Cs}\u034F\u115F\u1160\u17B4\u17B5\u180B-\u180F\u2800\u3164\uFFA0\uFFFC\uFE00-\uFE0E]/gu;
const IVS_STRAY = /(?<!\p{Ideographic})[\u{E0100}-\u{E01EF}]/gu;
// 改行として扱う文字（CRLF・CR・NEL・行区切り・段落区切り）
const LINE_BREAK = /\r\n?|[\u0085\u2028\u2029]/g;
// 目に見える文字が 1 つでもあるか（ZWJ や異体字セレクタだけの入力を空とみなす）
const VISIBLE = /[^\s\u200D\uFE0F\u{E0100}-\u{E01EF}]/u;

// multiline: false の欄（1 行入力）は改行・タブも空白に置き換える。
// NFC 正規化は結合文字が長く続くと時間がかかる（2 乗のオーダー）ので、長さを抑えてから呼ぶこと（RAW_FACTOR）
export function cleanText(s: string, { multiline }: { multiline: boolean }): string {
    const t = s.normalize("NFC").replace(LINE_BREAK, "\n").replace(INVISIBLE, "").replace(IVS_STRAY, "");
    return multiline ? t : t.replace(/[\n\t]+/g, " ");
}

// 先頭から max 文字（UTF-16 の長さ。maxLength 属性・zod の max と同じ数え方）に切り詰める。
// 絵文字などのサロゲートペアの途中で切ると DB に保存できない文字列になるので、その手前で切る
export function clip(s: string, max: number): string {
    if (s.length <= max) return s;
    const last = s.charCodeAt(max - 1);
    return s.slice(0, last >= 0xd800 && last <= 0xdbff ? max - 1 : max);
}

// 整形前の長さの上限は、整形後の上限の何倍までにするか（見えない文字を除く分の余裕）
export const RAW_FACTOR = 2;

// AI の出力・文字起こしを、受け付ける形（整形・上限）にそろえてから返す。
// 次のリクエストで送り返されたときに、整形で長さが変わって上限を超えることがないようにする
export function finalizeText(s: string, max: number): string {
    return clip(cleanText(clip(s, max * RAW_FACTOR), { multiline: true }).trim(), max);
}

// 文字列の欄。整形前に長さを抑え（重い正規化を長い入力にかけない）、
// 整形して前後の空白を除いたあとで、必須・上限を確かめる
export function textField(
    label: string,
    max: number,
    { multiline = false, required = false }: { multiline?: boolean; required?: boolean } = {},
) {
    const checked = z.string().max(max, `${label}は ${max} 文字までです`);
    return z
        .string({ error: `${label}の形式が不正です` })
        .max(max * RAW_FACTOR, `${label}は ${max} 文字までです`)
        .transform((s) => cleanText(s, { multiline }).trim())
        .pipe(required ? checked.refine((s) => VISIBLE.test(s), `${label}を入力してください`) : checked);
}

// 検証エラーを日本語の 1 文にする。配列の中の項目なら「n 件目：」を付ける（職務経歴書の行・面接の往復）
export function issueMessage(issue: z.core.$ZodIssue | undefined): string {
    if (!issue) return "リクエストの形式が不正です";
    if (issue.code === "unrecognized_keys") return "想定外の項目が含まれています";
    // body そのものがオブジェクトでない（配列・文字列など）。zod の既定文（英語）は出さない
    if (issue.path.length === 0) return "リクエストの形式が不正です";
    const index = issue.path.find((p) => typeof p === "number");
    return index === undefined ? issue.message : `${index + 1} 件目：${issue.message}`;
}

// 選択肢のキーだけを受け付ける欄
function optionField<T extends readonly Option[]>(list: T, label: string) {
    const keys = list.map((o) => o.key) as [T[number]["key"], ...T[number]["key"][]];
    return z.enum(keys, { error: `${label}は選択肢から選んでください` });
}

// ---- 面接条件（トップのフォーム） ----
// サーバーでは URL クエリからも組み立てるため、寛容な parseConditions（不正値は初期値に丸める）を使う。
// フォームでは「その他」を選んだら中身の入力を必須にする
export const conditionsSchema = z
    .strictObject({
        industry: optionField(INDUSTRIES, "志望業界"),
        job: optionField(JOBS, "志望職種"),
        career: optionField(CAREERS, "区分"),
        level: optionField(LEVELS, "面接官レベル"),
        background: textField("現職・学部", BACKGROUND_MAX),
        stage: optionField(STAGES, "面接の段階"),
        company: optionField(COMPANIES, "企業の規模・タイプ"),
        industryOther: textField("業界", OTHER_MAX),
        jobOther: textField("職種", OTHER_MAX),
    })
    .superRefine((c, ctx) => {
        if (c.industry === "other" && !c.industryOther) {
            ctx.addIssue({ code: "custom", path: ["industryOther"], message: "業界を入力してください" });
        }
        if (c.job === "other" && !c.jobOther) {
            ctx.addIssue({ code: "custom", path: ["jobOther"], message: "職種を入力してください" });
        }
    });

// ---- 講評モードのフォーム ----
export const FREE_TOPIC = "__free__"; // テーマのプルダウンの「自由入力」を表す値

export const practiceFormSchema = z
    .strictObject({
        topicSelect: z.string(),
        freeTopic: textField("テーマ", TOPIC_MAX),
        answer: textField("回答", ANSWER_MAX, { multiline: true, required: true }),
        memo: textField("メモ", MEMO_MAX, { multiline: true }),
    })
    .superRefine((v, ctx) => {
        if (v.topicSelect === FREE_TOPIC && !v.freeTopic) {
            ctx.addIssue({ code: "custom", path: ["freeTopic"], message: "テーマを入力してください" });
        }
    });

// ---- API の body ----
// 面接条件は parseConditions で、往復は validateTurns で別に検証するので、ここでは中身を問わない

const smileScoreField = z
    .number({ error: "笑顔スコアは数値で送ってください" })
    .min(0, "笑顔スコアは 0〜100 です")
    .max(100, "笑顔スコアは 0〜100 です")
    .transform(Math.round);

// 秒数。放置して伸びても面接を続けられるよう、上限を超えたら弾かずに頭打ちにする
const secondsField = z
    .number({ error: "秒数は数値で送ってください" })
    .min(0, "秒数は 0 以上です")
    .transform((v) => Math.min(Math.round(v), SECONDS_MAX));

// 模擬面接の 1 往復。数値が無いとき（NaN が JSON で null になった場合も）は null/undefined を許し、
// 必須かどうかは validateTurns（lib/interview.ts）が用途ごとに決める
export const turnSchema = z.strictObject(
    {
        question: textField("質問", QUESTION_MAX, { multiline: true, required: true }),
        answer: textField("回答", ANSWER_MAX, { multiline: true, required: true }),
        smileScore: smileScoreField.nullish(),
        answerSeconds: secondsField.nullish(),
        thinkingSeconds: secondsField.nullish(),
    },
    { error: "往復の形式が不正です" },
);

// POST /api/coach
export const coachRequestSchema = z.strictObject({
    topic: textField("テーマ", TOPIC_MAX, { required: true }),
    answer: textField("回答", ANSWER_MAX, { multiline: true, required: true }),
    conditions: z.unknown().optional(),
});

// POST /api/sessions（mode で中身が変わる）
export const sessionRequestSchema = z.discriminatedUnion(
    "mode",
    [
        z.strictObject({
            mode: z.literal("practice"),
            conditions: z.unknown().optional(),
            topic: textField("テーマ", TOPIC_MAX, { required: true }),
            answer: textField("回答", ANSWER_MAX, { multiline: true }),
            smileScore: smileScoreField.nullish(),
            feedback: textField("講評", FEEDBACK_MAX, { multiline: true }),
            memo: textField("メモ", MEMO_MAX, { multiline: true }),
        }),
        z.strictObject({
            mode: z.literal("interview"),
            conditions: z.unknown().optional(),
            turns: z.unknown(),
            summary: textField("総評", FEEDBACK_MAX, { multiline: true, required: true }),
        }),
    ],
    { error: "mode が不正です" },
);

// POST /api/interview（topic・lastTopic は定番テーマかどうかをルート側で確かめる）
const topicKey = z.string({ error: "topic の形式が不正です" }).max(TOPIC_MAX, "topic が長すぎます");
export const interviewRequestSchema = z.strictObject({
    conditions: z.unknown().optional(),
    turns: z.unknown().optional(),
    topic: topicKey.optional(),
    lastTopic: topicKey.optional(),
});

// POST /api/interview/summary
export const summaryRequestSchema = z.strictObject({
    conditions: z.unknown().optional(),
    turns: z.unknown(),
});

// POST /api/tts（level は lib/voice.ts の voiceFor で選択肢に丸める）
export const ttsRequestSchema = z.strictObject({
    text: textField("読み上げる文章", TTS_TEXT_MAX, { multiline: true, required: true }),
    level: z.unknown().optional(),
});

// ---- URL の id ----
// sessions.id（PostgreSQL の integer）の上限。これを超える id で DB エラー（500）にしない
const ID_MAX = 2147483647;

// URL の id を 1 以上の整数に。そうでなければ null
export function parseId(id: string): number | null {
    if (!/^[1-9]\d{0,9}$/.test(id)) return null;
    const n = Number(id);
    return n <= ID_MAX ? n : null;
}
