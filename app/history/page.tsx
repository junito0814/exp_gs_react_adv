// app/history/page.tsx — 履歴一覧（本人の記録のみ・模擬面接／講評をタブで切り替え）
//
// 見出しとタブは DB を待たずに出し、一覧（グラフ＋行）だけ <Suspense> の中で待つ。
// タブを切り替えたときは loading.tsx の fallback が出ない（同じ画面の ?mode= を
// 変えるだけで別セグメントへの遷移ではない）ため、変わる場所だけを骨組みにする。
import { Suspense } from "react";
import { db } from "@/db";
import { sessions } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DeleteButton } from "./DeleteButton";
import TabLink from "./TabLink";
import { HistoryListSkeleton } from "./HistorySkeleton";
import { requireUserId } from "@/lib/auth";
import { describeConditions } from "@/lib/conditions";
import { formatDate, truncate } from "@/lib/format";

// このページは毎回サーバーで作り直す（DBの最新を必ず出すため）
export const dynamic = "force-dynamic";

const TABS = [
    { mode: "interview", label: "模擬面接" },
    { mode: "practice", label: "講評" },
] as const;

type Mode = (typeof TABS)[number]["mode"];
type Row = typeof sessions.$inferSelect;

// await せずに呼び、件数表示と一覧の 2 か所で同じ Promise を使う（クエリは 1 回）
async function fetchRows(userId: string, mode: Mode): Promise<Row[]> {
    return db.select().from(sessions)
        .where(and(eq(sessions.userId, userId), eq(sessions.mode, mode)))
        .orderBy(desc(sessions.createdAt));
}

// 選択中のタブに付く件数。出るまでは何も出さない
async function TabCount({ rows }: { rows: Promise<Row[]> }) {
    return <>（{(await rows).length}）</>;
}

// 一覧本体（笑顔グラフ＋行）。ここだけが DB を待つ
async function HistoryList({ rows, mode }: { rows: Promise<Row[]>; mode: Mode }) {
    const list = await rows;

    if (list.length === 0) {
        return (
            <p className="text-center text-gray-500 dark:text-gray-400">
                {mode === "interview"
                    ? "まだありません。トップから「模擬面接を始める」で練習しましょう。"
                    : "まだありません。講評モードで練習して「保存」しましょう。"}
            </p>
        );
    }

    return (
        <>      {/* 成長グラフ（古い→新しい の順に並べ替えて棒で表示） */}
            <div className="flex gap-1 items-end h-24 mb-8 justify-center">
                {[...list].reverse().map((row) => (
                    <div
                        key={row.id}
                        title={`${row.smileScore ?? 0}%`}
                        className="w-4 bg-red-400 rounded-t"
                        style={{ height: `${row.smileScore ?? 0}%` }}
                    />
                ))}
            </div>
            <ul className="flex flex-col gap-3">
                {list.map((row) => (
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
    );
}

export default async function HistoryPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const userId = await requireUserId();
    if (!userId) redirect("/sign-in"); // proxy でも守られているが二重に

    // 既定は模擬面接。practice 以外はすべて interview 扱い
    const raw = (await searchParams).mode;
    const mode: Mode = (Array.isArray(raw) ? raw[0] : raw) === "practice" ? "practice" : "interview";

    const rows = fetchRows(userId, mode); // ここでは await しない

    return (
        <main className="flex-1 leading-loose p-10">
            <div className="max-w-2xl mx-auto">
                <Link href="/" className="text-red-400 hover:underline">← トップに戻る</Link>
                <h1 className="font-serif text-4xl text-center p-3 mt-6 mb-6">練習の記録</h1>

                {/* モードのタブ。URL に ?mode= が付くのでリロードしても保たれる */}
                <div className="flex justify-center border-b border-gray-300 dark:border-gray-600 mb-8">
                    {TABS.map((tab) => (
                        <TabLink
                            key={tab.mode}
                            mode={tab.mode}
                            label={tab.label}
                            current={tab.mode === mode}>
                            {tab.mode === mode && (
                                // 件数も DB を待つので、一覧と同じように後から出す
                                <Suspense fallback={null}>
                                    <TabCount rows={rows} />
                                </Suspense>
                            )}
                        </TabLink>
                    ))}
                </div>

                {/* タブを切り替えると、この中だけが骨組みに変わる */}
                <Suspense key={mode} fallback={<HistoryListSkeleton />}>
                    <HistoryList rows={rows} mode={mode} />
                </Suspense>
            </div>
        </main>
    );
}
