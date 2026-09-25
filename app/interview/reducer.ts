// app/interview/reducer.ts — 模擬面接の状態遷移（要件定義 4.4）
//
// [開始前] idle ──▶ asking（質問を取得中）──▶ answering（回答待ち）
//                                           ├─▶ recording（録音中）──▶ transcribing（文字起こし中）──▶ answering
//                                           └─▶ submitting（送信・次へ）──▶ asking / summarizing
//                              summarizing（総評を生成中）──▶ done（総評表示・保存済み）
import type { Turn } from "@/lib/types";

export type Phase =
    | "idle"          // 開始前
    | "asking"        // 質問を取得中
    | "answering"     // 質問が出て回答待ち（文字起こし後の送信待ちも含む）
    | "recording"     // 録音中
    | "transcribing"  // 文字起こし中
    | "submitting"    // 回答を送って次の質問 or 総評へ
    | "summarizing"   // 総評を生成中
    | "done";         // 総評を表示（保存済み）

export type State = {
    phase: Phase;
    topic: string;        // 面接のテーマ（API が決めた値を引き継ぐ）
    question: string;     // いま表示している質問
    turns: Turn[];        // 送信済みの往復
    transcript: string;   // 文字起こし結果（送信待ちの回答）
    answerSeconds: number;// 直前の回答にかかった秒数
    summary: string;      // 総評
    savedId: number | null; // 保存された記録の id
    error: string;        // 質問取得・総評生成の失敗メッセージ
    saveError: string;    // 自動保存の失敗メッセージ
    fallbackText: boolean;// マイクが使えずテキスト入力に切り替えたか
};

export const initialState: State = {
    phase: "idle",
    topic: "",
    question: "",
    turns: [],
    transcript: "",
    answerSeconds: 0,
    summary: "",
    savedId: null,
    error: "",
    saveError: "",
    fallbackText: false,
};

export type Action =
    | { type: "ask" }                                             // 質問の取得を開始
    | { type: "question"; question: string; topic: string }       // 質問が届いた
    | { type: "recordStart" }
    | { type: "recordStop" }
    | { type: "transcript"; text: string; seconds: number }       // 文字起こしが届いた
    | { type: "transcribeFailed" }
    | { type: "submit"; turn: Turn }                              // 回答を送信
    | { type: "summarize" }                                       // 総評の生成を開始
    | { type: "summary"; summary: string }                        // 総評が届いた
    | { type: "saved"; id: number }
    | { type: "saveFailed"; error: string }
    | { type: "failed"; error: string }                           // 質問・総評の失敗
    | { type: "useTextFallback" };

export function reducer(state: State, action: Action): State {
    switch (action.type) {
        case "ask":
            return { ...state, phase: "asking", error: "", transcript: "", answerSeconds: 0 };
        case "question":
            return { ...state, phase: "answering", question: action.question, topic: action.topic, error: "" };
        case "recordStart":
            return { ...state, phase: "recording", transcript: "" };
        case "recordStop":
            return { ...state, phase: "transcribing" };
        case "transcript":
            return { ...state, phase: "answering", transcript: action.text, answerSeconds: action.seconds };
        case "transcribeFailed":
            return { ...state, phase: "answering", transcript: "" };
        case "submit":
            return { ...state, phase: "submitting", turns: [...state.turns, action.turn], transcript: "" };
        case "summarize":
            return { ...state, phase: "summarizing", error: "" };
        case "summary":
            return { ...state, summary: action.summary };
        case "saved":
            return { ...state, phase: "done", savedId: action.id, saveError: "" };
        case "saveFailed":
            return { ...state, phase: "done", saveError: action.error };
        case "failed":
            return { ...state, error: action.error };
        case "useTextFallback":
            return { ...state, fallbackText: true };
    }
}
