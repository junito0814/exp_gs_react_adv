// db/schema.ts
import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const sessions = pgTable("sessions", {
    id: serial("id").primaryKey(),              // 通し番号（主キー・自動）
    userId: text("user_id").notNull(),          // Clerk の userId
    mode: text("mode").notNull(),               // "practice"（講評）/ "interview"（模擬面接）
    // 面接条件（lib/options.ts のキー）
    industry: text("industry").notNull(),       // 志望業界
    job: text("job").notNull(),                 // 志望職種
    career: text("career").notNull(),           // "new" / "mid"
    background: text("background"),             // 現職（中途）/ 学部・専攻（新卒）
    level: text("level").notNull(),             // 面接官レベル "kind" / "strict" / "harsh"
    topic: text("topic").notNull(),             // お題（講評）/ 最初の質問（模擬面接）
    answerText: text("answer_text"),            // 回答（講評モード）
    smileScore: integer("smile_score"),         // 笑顔スコア（送信時点）
    feedback: text("feedback"),                 // AI のフィードバック / 総評
    createdAt: timestamp("created_at").defaultNow().notNull(), // 作成日時
    memo: text("memo"),                         // メモ（講評モード）
});
