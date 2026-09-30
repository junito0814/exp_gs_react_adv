// app/loading.tsx — トップの読み込み中（認証とプロフィールの読み込みを待つ間）
import { SkeletonBox } from "@/app/Skeleton";
import { WAITING } from "@/lib/messages";

export default function Loading() {
    return (
        <main className="flex-1 text-center leading-loose p-10" aria-busy="true">
            <p role="status" aria-live="polite" className="sr-only">{WAITING.loading}</p>

            <SkeletonBox className="h-10 w-72 mx-auto mt-3 mb-8" />   {/* タイトル */}
            <SkeletonBox className="h-4 w-96 max-w-full mx-auto mb-10" />

            {/* 面接条件のカード（見出し＋入力 5 つ） */}
            <div className="max-w-xl mx-auto text-left">
                <SkeletonBox className="h-6 w-28 mb-4" />
                <div className="flex flex-col gap-4 p-6 rounded-lg ring-2 ring-gray-200 dark:ring-gray-700">
                    {Array.from({ length: 5 }, (_, i) => (
                        <div key={i} className="flex flex-col gap-1">
                            <SkeletonBox className="h-3 w-24" />
                            <SkeletonBox className="h-10 w-full max-w-md" />
                        </div>
                    ))}
                </div>
                {/* 2 つのモードのボタン */}
                <div className="flex flex-wrap gap-6 justify-center mt-8">
                    <SkeletonBox className="h-12 w-52" />
                    <SkeletonBox className="h-12 w-52" />
                </div>
            </div>

            <div className="flex gap-8 justify-center mt-10">
                <SkeletonBox className="h-5 w-28" />
                <SkeletonBox className="h-5 w-36" />
            </div>
        </main>
    );
}
