// app/history/[id]/page.tsx — 履歴詳細（本人の記録のみ）
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUserId } from "@/lib/auth";
import { describeConditions } from "@/lib/conditions";
import { formatDate } from "@/lib/format";

const cardClass = "p-6 whitespace-pre-wrap bg-red-50 dark:bg-gray-700 border-l-4 border-red-500 rounded-r-lg shadow-md leading-relaxed";
const cardTitleClass = "font-bold text-xl mb-4 border-b pb-2 border-red-200 dark:border-gray-600";

export default async function HistoryDetail({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const userId = await requireUserId();
    if (!userId) redirect("/sign-in");

    const { id } = await params;
    // id が数値でない・他人の記録・存在しない はすべて「見つかりませんでした」
    const row = /^\d+$/.test(id)
        ? (await db.select().from(sessions)
            .where(and(eq(sessions.id, Number(id)), eq(sessions.userId, userId))))[0]
        : undefined;

    if (!row) {
        return (
            <main className="flex-1 p-10">
                <div className="max-w-2xl mx-auto">
                    <Link href="/history" className="text-red-400 hover:underline">← 一覧に戻る</Link>
                    <p className="mt-6">見つかりませんでした。</p>
                </div>
            </main>
        );
    }

    return (
        <main className="flex-1 leading-loose p-10">
            <div className="max-w-2xl mx-auto">
                <Link href="/history" className="text-red-400 hover:underline">← 一覧に戻る</Link>
                <h1 className="font-serif text-4xl text-center p-3 mt-10 mb-2">{row.topic}</h1>
                <p className="text-center text-gray-500 dark:text-gray-400 mb-2">
                    {describeConditions(row)} ／ {formatDate(row.createdAt)}
                </p>
                <p className="text-center text-lg mb-6">😊 笑顔スコア {row.smileScore ?? 0}%</p>

                <div className={`${cardClass} mb-6`}>
                    <h2 className={cardTitleClass}>🗣 回答</h2>
                    <div>{row.answerText}</div>
                </div>

                <div className={`${cardClass} mb-6`}>
                    <h2 className={cardTitleClass}>🤖 フィードバック</h2>
                    <div>{row.feedback}</div>
                </div>

                {row.memo && (
                    <div className={cardClass}>
                        <h2 className={cardTitleClass}>📝 メモ</h2>
                        <div>{row.memo}</div>
                    </div>
                )}
            </div>
        </main>
    );
}
