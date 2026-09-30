// app/history/loading.tsx — 履歴一覧の読み込み中（DB から全件取る間）
import { SkeletonBox } from "@/app/Skeleton";
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
        </main>
    );
}
