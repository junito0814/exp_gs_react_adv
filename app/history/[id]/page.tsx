// app/history/[id]/page.tsx — 履歴詳細（本人の記録のみ）
// 模擬面接は往復（Q/A/笑顔/秒数）を並べて最後に総評、講評モードは回答・講評・メモを表示する
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUserId } from "@/lib/auth";
import { describeConditions } from "@/lib/conditions";
import { formatDate } from "@/lib/format";

const cardClass = "bg-red-50 dark:bg-gray-700 border-l-4 border-red-500 rounded-r-lg shadow-md leading-relaxed";
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

    const isInterview = row.mode === "interview";
    const turns = row.turns ?? [];

    return (
        <main className="flex-1 leading-loose p-10">
            <div className="max-w-2xl mx-auto">
                {/* 元のタブに戻る */}
                <Link href={`/history?mode=${row.mode}`} className="text-red-400 hover:underline">← 一覧に戻る</Link>

                <h1 className="font-serif text-4xl text-center p-3 mt-10 mb-2">
                    {isInterview ? "模擬面接" : row.topic}
                </h1>
                <p className="text-center text-gray-500 dark:text-gray-400 mb-2">
                    {describeConditions(row)} ／ {formatDate(row.createdAt)}
                </p>

                {isInterview ? (
                    <>
                        <p className="text-center text-lg mb-6">{turns.length} 往復</p>

                        {turns.map((turn, i) => (
                            <div key={i} className={`${cardClass} mb-6 overflow-hidden`}>
                                <div className="p-6 border-b border-red-200 dark:border-gray-600">
                                    <span className="font-bold">Q{i + 1}.</span>{" "}
                                    <span className="whitespace-pre-wrap">{turn.question}</span>
                                </div>
                                <div className="p-6">
                                    <span className="font-bold">A.</span>{" "}
                                    <span className="whitespace-pre-wrap">{turn.answer}</span>
                                    <div className="flex justify-end gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                                        <span>😊 笑顔 {turn.smileScore}%</span>
                                        <span>⏱ {turn.answerSeconds} 秒</span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <div className={`${cardClass} p-6 whitespace-pre-wrap`}>
                            <h2 className={cardTitleClass}>🤖 総評</h2>
                            <div>{row.feedback}</div>
                        </div>
                    </>
                ) : (
                    <>
                        <p className="text-center text-lg mb-6">😊 笑顔スコア {row.smileScore ?? 0}%</p>

                        <div className={`${cardClass} p-6 mb-6 whitespace-pre-wrap`}>
                            <h2 className={cardTitleClass}>🗣 回答</h2>
                            <div>{row.answerText}</div>
                        </div>

                        <div className={`${cardClass} p-6 mb-6 whitespace-pre-wrap`}>
                            <h2 className={cardTitleClass}>🤖 フィードバック</h2>
                            <div>{row.feedback}</div>
                        </div>

                        {row.memo && (
                            <div className={`${cardClass} p-6 whitespace-pre-wrap`}>
                                <h2 className={cardTitleClass}>📝 メモ</h2>
                                <div>{row.memo}</div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
