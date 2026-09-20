// app/history/page.tsx — 履歴一覧（本人の記録のみ）
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DeleteButton } from "./DeleteButton";
import { requireUserId } from "@/lib/auth";
import { describeConditions } from "@/lib/conditions";
import { formatDate } from "@/lib/format";

// このページは毎回サーバーで作り直す（DBの最新を必ず出すため）
export const dynamic = "force-dynamic";

export default async function HistoryPage() {
    const userId = await requireUserId();
    if (!userId) redirect("/sign-in"); // proxy でも守られているが二重に

    const rows = await db.select().from(sessions)
        .where(eq(sessions.userId, userId))
        .orderBy(desc(sessions.createdAt));

    return (
        <main className="flex-1 leading-loose p-10">
            <div className="max-w-2xl mx-auto">
                <Link href="/" className="text-red-400 hover:underline">← トップに戻る</Link>
                <h1 className="font-serif text-4xl text-center p-3 m-10">練習の記録（{rows.length}件）</h1>
                {rows.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400">まだありません。練習して「保存」しましょう。</p>
                ) : (
                    <>      {/* 成長グラフ（古い→新しい の順に並べ替えて棒で表示） */}
                        <div className="flex gap-1 items-end h-24 mb-8 justify-center">
                            {[...rows].reverse().map((row) => (
                                <div
                                    key={row.id}
                                    title={`${row.smileScore}%`}
                                    className="w-4 bg-red-400 rounded-t"
                                    style={{ height: `${row.smileScore ?? 0}%` }}
                                />
                            ))}
                        </div>
                        <ul className="flex flex-col gap-3">
                            {rows.map((row) => (
                                <li
                                    key={row.id}
                                    className="flex items-center justify-between gap-4 p-4
                                    bg-red-50 dark:bg-gray-700 border-l-4 border-red-500 rounded-r-lg shadow-md">
                                    <Link href={`/history/${row.id}`} className="hover:underline min-w-0">
                                        <div className="truncate">{row.topic} ／ 笑顔 {row.smileScore ?? 0}%</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                            {describeConditions(row)}　{formatDate(row.createdAt)}
                                        </div>
                                    </Link>
                                    <DeleteButton id={row.id} />
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>
        </main>
    );
}
