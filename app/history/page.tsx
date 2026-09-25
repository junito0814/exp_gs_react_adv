// app/history/page.tsx — 履歴一覧（本人の記録のみ・模擬面接／講評をタブで切り替え）
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DeleteButton } from "./DeleteButton";
import { requireUserId } from "@/lib/auth";
import { describeConditions } from "@/lib/conditions";
import { formatDate, truncate } from "@/lib/format";

// このページは毎回サーバーで作り直す（DBの最新を必ず出すため）
export const dynamic = "force-dynamic";

const TABS = [
    { mode: "interview", label: "模擬面接" },
    { mode: "practice", label: "講評" },
] as const;

export default async function HistoryPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const userId = await requireUserId();
    if (!userId) redirect("/sign-in"); // proxy でも守られているが二重に

    // 既定は模擬面接。practice 以外はすべて interview 扱い
    const raw = (await searchParams).mode;
    const mode = (Array.isArray(raw) ? raw[0] : raw) === "practice" ? "practice" : "interview";

    const rows = await db.select().from(sessions)
        .where(and(eq(sessions.userId, userId), eq(sessions.mode, mode)))
        .orderBy(desc(sessions.createdAt));

    return (
        <main className="flex-1 leading-loose p-10">
            <div className="max-w-2xl mx-auto">
                <Link href="/" className="text-red-400 hover:underline">← トップに戻る</Link>
                <h1 className="font-serif text-4xl text-center p-3 mt-6 mb-6">練習の記録</h1>

                {/* モードのタブ。URL に ?mode= が付くのでリロードしても保たれる */}
                <div className="flex justify-center border-b border-gray-300 dark:border-gray-600 mb-8">
                    {TABS.map((tab) => (
                        <Link
                            key={tab.mode}
                            href={`/history?mode=${tab.mode}`}
                            aria-current={tab.mode === mode ? "page" : undefined}
                            className={`px-6 py-2 ${tab.mode === mode
                                ? "font-bold border-b-4 border-red-500"
                                : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"}`}>
                            {tab.label}
                            {tab.mode === mode && `（${rows.length}）`}
                        </Link>
                    ))}
                </div>

                {rows.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400">
                        {mode === "interview"
                            ? "まだありません。トップから「模擬面接を始める」で練習しましょう。"
                            : "まだありません。講評モードで練習して「保存」しましょう。"}
                    </p>
                ) : (
                    <>      {/* 成長グラフ（古い→新しい の順に並べ替えて棒で表示） */}
                        <div className="flex gap-1 items-end h-24 mb-8 justify-center">
                            {[...rows].reverse().map((row) => (
                                <div
                                    key={row.id}
                                    title={`${row.smileScore ?? 0}%`}
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
                                        <div className="truncate">
                                            {truncate(row.topic, 30)} ／ 笑顔 {row.smileScore ?? 0}%
                                            {mode === "interview" && row.turns && `／ ${row.turns.length} 往復`}
                                        </div>
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
