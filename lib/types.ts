// lib/types.ts — DB の jsonb カラムに入れる型

// 模擬面接の 1 往復（質問 → 回答）
export type Turn = {
    question: string;       // 面接官の質問
    answer: string;         // 回答（文字起こし結果）
    smileScore: number;     // 話している間の平均の笑顔スコア（0〜100）
    answerSeconds: number;  // 録音開始から話し終えるまでの秒数
    thinkingSeconds?: number; // 面接官が話し終えてから声を出すまでの秒数（測れなければ省略）
};

// 職務経歴書の 1 行（履歴書と同じ「年・月・内容」）
export type HistoryRow = {
    year: number;   // 西暦 4 桁
    month: number;  // 1〜12
    text: string;   // 学歴・職歴の内容（最大 100 文字）
};
