// app/api/profile/route.ts — プロフィール（ES・職務経歴書・免許資格）の取得・保存
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { requireUserId, unauthorized } from "@/lib/auth";
import { validateProfile } from "@/lib/profile";
import { getProfile } from "@/lib/profile-db";

export async function GET() {
    const userId = await requireUserId();
    if (!userId) return unauthorized();
    return Response.json(await getProfile(userId));
}

export async function PUT(request: Request) {
    const userId = await requireUserId();
    if (!userId) return unauthorized();

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return Response.json({ error: "リクエストの形式が不正です" }, { status: 400 });
    }

    const result = validateProfile(body);
    if (!result.ok) return Response.json({ error: result.error }, { status: 400 });

    // 1 ユーザー 1 行。あれば上書き（updatedAt も更新）
    await db.insert(profiles)
        .values({ userId, ...result.value })
        .onConflictDoUpdate({
            target: profiles.userId,
            set: { ...result.value, updatedAt: new Date() },
        });

    return Response.json({ ok: true });
}
