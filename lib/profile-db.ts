// lib/profile-db.ts — プロフィールの読み出し（サーバー専用）
// "server-only" を付けておくと、誤ってクライアントコンポーネントから import したときに
// ブラウザで落ちる前にビルドエラーで気づける
import "server-only";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { EMPTY_PROFILE, type Profile } from "./profile";

// 本人のプロフィールを取得（未登録なら空）
export async function getProfile(userId: string): Promise<Profile> {
    const rows = await db.select().from(profiles).where(eq(profiles.userId, userId));
    const row = rows[0];
    if (!row) return EMPTY_PROFILE;
    return { es: row.es, history: row.history ?? [], qualifications: row.qualifications };
}
