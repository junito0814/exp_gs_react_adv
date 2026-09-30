// app/history/HistorySkeleton.tsx — 履歴一覧の「一覧部分」の骨組み
//
// 2 か所から使う。
//  - loading.tsx（画面ごと開くとき）
//  - page.tsx の <Suspense fallback>（タブを切り替えたとき。一覧だけ差し替わる）

import { SkeletonBox } from "@/app/Skeleton";

export function HistoryListSkeleton() {
    return (
        <div aria-busy="true">
            {/* 笑顔スコアの棒グラフ（高さは実際と同じ h-24） */}
            <div className="flex gap-1 items-end h-24 mb-8 justify-center">
                {["h-10", "h-16", "h-12", "h-20", "h-14"].map((h, i) => (
                    <SkeletonBox key={i} className={`w-4 ${h}`} />
                ))}
            </div>

            {/* 一覧（3 行） */}
            <ul className="flex flex-col gap-3">
                {Array.from({ length: 3 }, (_, i) => (
                    <li key={i} className="flex items-center justify-between gap-4 p-4
                        bg-red-50 dark:bg-gray-700 border-l-4 border-red-500 rounded-r-lg shadow-md">
                        <div className="flex flex-col gap-2 min-w-0 w-full">
                            <SkeletonBox className="h-5 w-3/4" />
                            <SkeletonBox className="h-3 w-1/2" />
                        </div>
                        <SkeletonBox className="h-7 w-14 shrink-0" />
                    </li>
                ))}
            </ul>
        </div>
    );
}
