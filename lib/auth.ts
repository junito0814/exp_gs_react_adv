// lib/auth.ts
// サーバー側（Route Handler / Server Component）でログインユーザーの id を取るヘルパー
import { auth } from "@clerk/nextjs/server";

// ログイン中なら Clerk の userId、未ログインなら null
export async function requireUserId(): Promise<string | null> {
    const { userId } = await auth();
    return userId ?? null;
}

// Route Handler 用: 未ログイン時に返すレスポンス
export function unauthorized() {
    return Response.json({ error: "unauthorized" }, { status: 401 });
}
