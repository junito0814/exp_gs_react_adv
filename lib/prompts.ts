// lib/prompts.ts
// AI に渡すプロンプト。講評（/api/coach）と模擬面接（/api/interview）で共通の system プロンプトをここで組み立てる。
import { INDUSTRIES, JOBS, CAREERS, LEVELS, BACKGROUND_LABEL, INTERVIEW_TURNS, labelOf, type LevelKey, type CareerKey } from "./options";
import type { Conditions } from "./conditions";

// 面接官レベルごとの振る舞い（要件定義 5.1）
export const LEVEL_BEHAVIOR: Record<LevelKey, string> = {
    kind: `当たりの強さは「やさしめ」。まず肯定から入り、深掘りは「もう少し教えてください」のように答えやすい形で行う。改善点には言い換え例を多めに添える。`,
    strict: `当たりの強さは「厳しめ」。端的に話し、根拠・数字・具体例を求める。曖昧な回答には「具体的には？」と返す。褒め言葉は最小限にする。`,
    harsh: `当たりの強さは「圧迫」。圧迫面接の面接官として、回答の矛盾や弱点を突いて詰める。「本当にそうですか？」「それは他の会社でもできるのでは？」のように厳しく深掘りする。ただし下記の禁止事項は必ず守り、批判は必ず質問または改善提案の形にする。回答者が言っていないことを前提にした決めつけはしない。`,
};

// NG 表現の指摘（講評・総評の両方で使う。面接官レベルに関わらず必ず指摘させる）
export const NG_EXPRESSIONS = `【NG 表現の指摘（面接官レベルに関わらず必ず行う）】
回答のなかに次のような表現があれば、**必ず 1 つ以上を取り上げて**指摘し、言い換え例を添えてください。
- 現職・前職・学校・上司・同僚への不満や批判（例：「残業が多い」「評価されない」）
- 他責的な言い回し（例：「会社が◯◯してくれない」「環境が悪かった」）
- 根拠や数字のない実績・成果（例：「売上に貢献した」）
- 抽象的な形容（例：「頑張った」「いろいろ」「しっかり」「さまざま」）
指摘するときは、その表現を「」で引用し、続けて「→ 言い換え例：「…」」の形で示してください。
NG 表現のために新しい見出し（■）を作らず、既定のセクションの中に収めてください。
これらが 1 つも無い場合は、改善点の最後に「NG 表現はありません。」と書いてください。`;

// 禁止事項（全レベル共通）
export const PROHIBITED = `【禁止事項（必ず守る）】
- 人格否定・侮辱・暴言をしない。
- 年齢・性別・出身地・国籍・家族構成・結婚や出産の予定・思想信条・宗教・支持政党・病歴など、公正な採用選考の観点で不適切な事柄には触れず、質問もしない。
- 回答者が上記に自ら触れた場合も、そこを深掘りせず話題を戻す。`;

// 区分による出題・評価の傾向
export const CAREER_TENDENCY: Record<CareerKey, string> = {
    new: `回答者は新卒（学生）。学生時代の経験（学業・サークル・アルバイト・インターン）、志望動機、人柄・価値観を中心に扱う。「転職理由」「前職」など社会人経験を前提にした話題は出さない。`,
    mid: `回答者は中途（社会人）。これまでの実績（できれば数字）、転職理由、その経験が志望先でどう再現できるかを中心に扱う。`,
};

// 条件の説明文
function describeForPrompt(c: Conditions): string {
    const lines = [
        `- 志望業界：${labelOf(INDUSTRIES, c.industry)}`,
        `- 志望職種：${labelOf(JOBS, c.job)}`,
        `- 区分：${labelOf(CAREERS, c.career)}`,
        `- 面接官レベル：${labelOf(LEVELS, c.level)}`,
    ];
    if (c.background) lines.push(`- ${BACKGROUND_LABEL[c.career]}：${c.background}`);
    return lines.join("\n");
}

// 共通 system プロンプト。profileText はプロフィール（ES・職務経歴書）を整形した文字列（未登録なら省略）
export function buildSystemPrompt(c: Conditions, profileText?: string | null): string {
    const parts = [
        `あなたは就職・転職の面接練習を支援する面接官です。以下の条件の回答者に対応してください。`,
        `【回答者の条件】\n${describeForPrompt(c)}`,
        `【面接官の振る舞い】\n${LEVEL_BEHAVIOR[c.level]}`,
        `【出題・評価の傾向】\n${CAREER_TENDENCY[c.career]}`,
    ];
    if (c.background) {
        parts.push(
            c.career === "mid"
                ? `【現状と志望先の差分】\n現職（${c.background}）から志望先（${labelOf(INDUSTRIES, c.industry)}・${labelOf(JOBS, c.job)}）への転職理由や、現職の経験が志望先でどう活きるかを、必ず 1 度は問う・または評価に含める。`
                : `【現状と志望先の差分】\n学部・専攻（${c.background}）と志望先（${labelOf(INDUSTRIES, c.industry)}・${labelOf(JOBS, c.job)}）のつながり（なぜその分野から志望するのか）を、必ず 1 度は問う・または評価に含める。`,
        );
    }
    if (profileText && profileText.trim()) {
        parts.push(
            `【回答者のプロフィール】\n${profileText.trim()}\n\n上記のプロフィールにある具体的な内容（経験・実績・会社名・数字）を「ES にある○○について」「○○での経験は」のように名指しで参照して、質問や講評を具体的にすること。`,
        );
    }
    parts.push(PROHIBITED);
    parts.push(`出力はすべて日本語。`);
    return parts.join("\n\n");
}

// 講評モードの user メッセージ（既存 /api/coach のフォーマットを移植。口調は system 側に任せる）
export function buildCoachPrompt(topic: string, answer: string): string {
    return `以下の回答にフィードバックを行ってください。

「お題」${topic}
「回答」${answer}

必ず以下の項目ごとに改行（空行）を挟んで、段落を明確に分けて出力してください。

あなたの回答
${answer}

■ 良かった点
・（良かった点を1〜2点）

■ 改善点とアドバイス
・（改善点を1〜2点）
→ 言い換え例：「（具体的な言い換え表現）」

■ 面接官からの深掘り質問
・（想定質問1）
・（想定質問2）

${NG_EXPRESSIONS}

【指示】
1. 上記のフォーマットをそのまま使用し、各セクションの間に必ず空行を入れてください。見出し（■）を増やさないでください。
2. 「■ 改善点とアドバイス」には、上記の NG 表現の指摘を必ず含めてください。
3. 全体で300〜450文字に収めてください（450文字を超えないこと）。
4. 面接官の振る舞い（口調）は system の指示に従ってください。`;
}

// ============================================================
// 模擬面接（/api/interview, /api/interview/summary）
// ============================================================

export const QUESTION_MAX_CHARS = 100;     // 質問の文字数上限（プロンプトで指示）
// 圧迫は「一度否定してから問い直す」ため 2 文必要になる。その分だけ上限を上げる
export const QUESTION_MAX_CHARS_HARSH = 140;
const ANSWER_SECONDS_GUIDE = "45〜90 秒";  // 回答の長さの目安
const ANSWER_CHARS_GUIDE = "200〜400 文字";

// 面接官としての system プロンプト（質問を 1 つだけ返す）
export function buildInterviewerSystemPrompt(c: Conditions, profileText?: string | null): string {
    // 圧迫は「否定 → 問い直し」の 2 文を許す。それ以外は 1 文に絞る
    const isHarsh = c.level === "harsh";
    const lengthRule = isHarsh
        ? `- 返答は ${QUESTION_MAX_CHARS_HARSH} 文字以内、2 文までにしてください（1 文目で回答の弱さを指摘し、2 文目で問い直す形でもよい）。`
        : `- 質問は ${QUESTION_MAX_CHARS} 文字以内の 1 文にしてください。`;
    return [
        buildSystemPrompt(c, profileText),
        `【面接の進め方】
- あなたは面接官です。1 回の返答で質問は 1 つだけにしてください。
- 講評・励まし・解説・相槌・前置きは一切書かないでください。返答は必ず質問で終えてください。
${lengthRule}
- 回答者がまだ言っていないことを事実として前提にしないでください（例：「不満があると聞きましたが」のように、聞いていない話を決めつけない）。
- 回答者の名前は知らないので、名前で呼びかけないでください（「〇〇さん」などの伏せ字も使わない）。
- 出力は次の JSON だけにしてください（前後に文章を付けない）：{"question": "質問文"}`,
    ].join("\n\n");
}

// 最初の質問を求める user メッセージ。
// テーマは AI に選ばせると偏るため、サーバー側（pickTopic）で決めて渡す
export function buildFirstQuestionPrompt(c: Conditions, topic: string): string {
    return `この面接のテーマは「${topic}」です。このテーマについて最初の質問をしてください。
- 志望業界（${labelOf(INDUSTRIES, c.industry)}）・志望職種（${labelOf(JOBS, c.job)}）${c.background ? `・${BACKGROUND_LABEL[c.career]}（${c.background}）` : ""}に合わせた聞き方にしてください。
- これから ${INTERVIEW_TURNS} 往復の面接を行うため、1 問目は答えやすい入口となる質問にしてください。
- 質問文に「テーマ」という言葉は使わないでください。`;
}

// 深掘りを求める user メッセージ（直前の回答のあとに付ける）。
// answered: これまでに答え終えた往復数（1 なら次が 2 問目）
export function buildFollowUpPrompt(c: Conditions, answered: number): string {
    const base = `いまの回答を踏まえて、深掘りの質問を 1 つしてください。
- 回答に出てきた言葉を引用・参照して、具体的に掘り下げてください。
- テーマは変えないでください。
- 回答が曖昧・抽象的なら、根拠や具体例（できれば数字）を求めてください。`;
    if (c.level !== "harsh") return base;

    // 圧迫のときは「一度否定してから問い直す」。最後の質問では志望度そのものを疑う
    const isLast = answered >= INTERVIEW_TURNS - 1;
    return [
        base,
        `【この質問での圧迫の出し方】
- 相槌や肯定から始めないでください。
- 回答が抽象的・主語が曖昧・数字がないときは、まず「それは他の方でも言えますよね」「それはどの会社でもできることではないですか」のように一度否定してから問い直してください。`,
        isLast
            ? `- これが最後の質問です。「当社でなくてもよいのではないですか」と志望度そのものを疑う一文を必ず入れてください。`
            : `- 志望度を疑う質問（「当社でなくてもよいのでは」）は最後の質問で使うので、ここでは使わないでください。`,
    ].join("\n");
}

// 総評用の system プロンプト。
// 面接官用（buildInterviewerSystemPrompt）は「JSON で質問だけ返す」と指示しているため、
// 総評ではそれを使わない（使うと総評の代わりに質問が返ってしまう）
export function buildSummarySystemPrompt(c: Conditions, profileText?: string | null): string {
    return [
        buildSystemPrompt(c, profileText),
        `【今の役割】
面接が終わったので、面接官として面接全体を振り返る総評を書いてください。
質問はもうせず、JSON ではなく指定されたフォーマットの文章で出力してください。`,
    ].join("\n\n");
}

// 模擬面接の往復（総評の入力）
export type SummaryTurn = {
    question: string;
    answer: string;
    smileScore: number;
    answerSeconds: number;
};

// 総評を求める user メッセージ
export function buildSummaryPrompt(turns: SummaryTurn[]): string {
    const log = turns
        .map((t, i) => {
            const n = i + 1;
            return `【${n} 問目】
Q: ${t.question}
A: ${t.answer}
（笑顔スコア ${t.smileScore}%、回答時間 ${t.answerSeconds} 秒、回答 ${t.answer.length} 文字）`;
        })
        .join("\n\n");

    return `面接が終わりました（全 ${turns.length} 往復）。以下のやり取りをもとに総評を書いてください。

${log}

必ず次のフォーマットで、各セクションの間に空行を入れて出力してください。

■ 内容面
・（良かった点を1〜2点）
・（改善点を1〜2点）→ 言い換え例：「（具体的な言い換え表現）」

■ 表情
・（各問の笑顔スコアの推移を挙げ、それをもとに一言）

■ 話し方
・（各回答の秒数と文字数を挙げ、長すぎ／短すぎ／ちょうどよい を根拠とともに一言）

${NG_EXPRESSIONS}

【指示】
1. 全体で300〜450文字に収めてください（450文字を超えないこと）。見出し（■）を増やさないでください。
2. 「■ 内容面」の改善点には、上記の NG 表現の指摘を必ず含めてください。
3. 「■ 表情」では実際のスコアの数値を挙げてください（例：1 問目 35% → 2 問目 62%）。
4. 「■ 話し方」の目安は 1 回答あたり ${ANSWER_SECONDS_GUIDE}・${ANSWER_CHARS_GUIDE} です。
5. 面接官の振る舞い（口調）は system の指示に従ってください。
6. 質問はもうしないでください。`;
}

// AI の返答から質問文を取り出す。JSON で来なかった場合も落とさない
export function parseQuestion(text: string): string {
    const raw = (text ?? "").trim();
    if (!raw) return "";

    // JSON として読めたら question を返す（空なら空文字＝呼び出し側でエラー扱い）
    const fromJson = (s: string): string | null => {
        try {
            const o = JSON.parse(s);
            if (o && typeof o === "object" && "question" in o && typeof o.question === "string") {
                return o.question.trim();
            }
        } catch {
            // JSON ではない
        }
        return null;
    };

    // ① そのまま JSON
    const direct = fromJson(raw);
    if (direct !== null) return direct;

    // ② ```json ... ``` や前後に文章が付いている場合、最初の { 〜 最後の } を試す
    const start = raw.indexOf("{"), end = raw.lastIndexOf("}");
    if (start !== -1 && end > start) {
        const inner = fromJson(raw.slice(start, end + 1));
        if (inner !== null) return inner;
    }

    // ③ JSON で来なかった場合は本文全体を質問として扱う（コードフェンスだけ落とす）
    return raw.replace(/^```(?:json)?\s*/i, "").replace(/```$/i, "").trim();
}
