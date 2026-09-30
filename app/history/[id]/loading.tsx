// app/history/[id]/loading.tsx — 履歴詳細の読み込み中（DB から 1 件取る間）
import { SkeletonBox, SkeletonLines } from "@/app/Skeleton";
import { WAITING } from "@/lib/messages";

export default function Loading() {
    return (
        <main className="flex-1 leading-loose p-10" aria-busy="true">
            <div className="max-w-2xl mx-auto">
                <p role="status" aria-live="polite" className="sr-only">{WAITING.loading}</p>

                <SkeletonBox className="h-5 w-28" />                        {/* 一覧に戻る */}
                <SkeletonBox className="h-10 w-64 mx-auto mt-10 mb-2" />    {/* テーマ／模擬面接 */}
                <SkeletonBox className="h-4 w-80 max-w-full mx-auto mb-6" />{/* 条件・日時 */}

                {/* 本文のカード 2 枚（往復 or 回答・講評） */}
                <div className="flex flex-col gap-6">
                    {Array.from({ length: 2 }, (_, i) => (
                        <div key={i} className="p-6 bg-red-50 dark:bg-gray-700
                            border-l-4 border-red-500 rounded-r-lg shadow-md">
                            <SkeletonBox className="h-6 w-32 mb-4" />
                            <SkeletonLines count={4} />
                        </div>
                    ))}
                </div>
            </div>
        </main>
    );
}
