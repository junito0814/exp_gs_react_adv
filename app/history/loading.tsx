// app/history/loading.tsx — 履歴一覧の読み込み中（画面ごと開くとき）
//
// タブを切り替えたときは、この fallback は出ない（同じ画面の ?mode= を変えるだけで
// 別セグメントへの遷移ではないため）。その場合は page.tsx の <Suspense> が
// 一覧部分だけを HistoryListSkeleton に差し替える。

import { SkeletonBox } from "@/app/Skeleton";
import { HistoryListSkeleton } from "./HistorySkeleton";
import { WAITING } from "@/lib/messages";

export default function Loading() {
    return (
        <main className="flex-1 leading-loose p-10" aria-busy="true">
            <div className="max-w-2xl mx-auto">
                <p role="status" aria-live="polite" className="sr-only">{WAITING.loading}</p>

                <SkeletonBox className="h-5 w-28" />                        {/* 戻るリンク */}
                <SkeletonBox className="h-10 w-56 mx-auto mt-6 mb-6" />     {/* 練習の記録 */}

                {/* タブ */}
                <div className="flex justify-center gap-6 border-b border-gray-300 dark:border-gray-600 mb-8 pb-2">
                    <SkeletonBox className="h-6 w-28" />
                    <SkeletonBox className="h-6 w-20" />
                </div>

                <HistoryListSkeleton />
            </div>
        </main>
    );
}
