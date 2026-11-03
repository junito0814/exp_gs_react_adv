// app/api/profile/route.ts — プロフィール（ES・職務経歴書・免許資格）の取得・保存
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { requireUserId, unauthorized } from "@/lib/auth";
import { parseJsonBody, writeDb } from "@/lib/http";
import { profileSchema } from "@/lib/profile";
import { getProfile } from "@/lib/profile-db";

export async function GET() {
    const userId = await requireUserId();
    if (!userId) return unauthorized();
    return Response.json(await getProfile(userId));
}

export async function PUT(request: Request) {
    const userId = await requireUserId();
    if (!userId) return unauthorized();

    // 画面のフォームと同じスキーマで検証する（#70）
    const parsed = await parseJsonBody(request, profileSchema);
    if (!parsed.ok) return parsed.response;

    // 1 ユーザー 1 行。あれば上書き（updatedAt も更新）
    return writeDb(async () => {
        await db.insert(profiles)
            .values({ userId, ...parsed.value })
            .onConflictDoUpdate({
                target: profiles.userId,
                set: { ...parsed.value, updatedAt: new Date() },
            });
        return Response.json({ ok: true });
    });
}
