// app/api/sessions/[id]/route.ts
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireUserId, unauthorized } from "@/lib/auth";

// URL の id を整数に。数値でなければ null
function parseId(id: string): number | null {
    return /^\d+$/.test(id) ? Number(id) : null;
}

// 1件だけ取得（本人のもののみ。他人・不在は 404）
export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await requireUserId();
    if (!userId) return unauthorized();

    const { id } = await params; // Next.js16では params は await が必要
    const num = parseId(id);
    if (num === null) return Response.json({ error: "id が不正です" }, { status: 400 });

    const rows = await db.select().from(sessions)
        .where(and(eq(sessions.id, num), eq(sessions.userId, userId)));
    if (!rows[0]) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json(rows[0]);
}

// 1件 削除（本人のもののみ。他人・不在は 404）
export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const userId = await requireUserId();
    if (!userId) return unauthorized();

    const { id } = await params;
    const num = parseId(id);
    if (num === null) return Response.json({ error: "id が不正です" }, { status: 400 });

    const deleted = await db.delete(sessions)
        .where(and(eq(sessions.id, num), eq(sessions.userId, userId)))
        .returning({ id: sessions.id });
    if (deleted.length === 0) return Response.json({ error: "not found" }, { status: 404 });
    return Response.json({ ok: true });
}
