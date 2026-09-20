// lib/prompts.ts
// AI に渡すプロンプト。講評（/api/coach）と模擬面接（/api/interview）で共通の system プロンプトをここで組み立てる。
import { INDUSTRIES, JOBS, CAREERS, LEVELS, BACKGROUND_LABEL, labelOf, type LevelKey, type CareerKey } from "./options";
import type { Conditions } from "./conditions";

// 面接官レベルごとの振る舞い（要件定義 5.1）
export const LEVEL_BEHAVIOR: Record<LevelKey, string> = {
    kind: `口調は「優しい」。まず肯定から入り、深掘りは「もう少し教えてください」のように答えやすい形で行う。改善点には言い換え例を多めに添える。`,
    strict: `口調は「厳しい」。端的に話し、根拠・数字・具体例を求める。曖昧な回答には「具体的には？」と返す。褒め言葉は最小限にする。`,
    harsh: `口調は「意地悪」。回答の矛盾や弱点を突き、「本当にそうですか？」「それは他の会社でもできるのでは？」のように圧迫気味に深掘りする。ただし下記の禁止事項は必ず守り、批判は必ず質問または改善提案の形にする。`,
};

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

【指示】
1. 上記のフォーマットをそのまま使用し、各セクションの間に必ず空行を入れてください。
2. 全体で250〜350文字程度に収めてください。
3. 面接官の振る舞い（口調）は system の指示に従ってください。`;
}
