// app/profile/loading.tsx — プロフィール設定の読み込み中（DB から 1 件取る間）
import { SkeletonBox } from "@/app/Skeleton";
import { WAITING } from "@/lib/messages";

export default function Loading() {
    return (
        <main className="flex-1 leading-loose p-10" aria-busy="true">
            <div className="max-w-2xl mx-auto">
                <p role="status" aria-live="polite" className="sr-only">{WAITING.loading}</p>

                <SkeletonBox className="h-5 w-28" />                          {/* トップへ戻る */}
                <SkeletonBox className="h-10 w-72 mx-auto mt-6 mb-2" />       {/* プロフィール設定 */}
                <SkeletonBox className="h-4 w-96 max-w-full mx-auto mb-6" />  {/* 説明文 */}

                {/* ES（大きい入力欄）／職務経歴書／免許・資格 の 3 セクション */}
                <div className="flex flex-col gap-6">
                    {Array.from({ length: 3 }, (_, i) => (
                        <div key={i} className="flex flex-col gap-2">
                            <SkeletonBox className="h-6 w-48" />
                            <SkeletonBox className="h-3 w-64" />
                            <SkeletonBox className={i === 0 ? "h-56 w-full" : i === 1 ? "h-40 w-full" : "h-24 w-full"} />
                        </div>
                    ))}
                </div>

                <div className="flex justify-center mt-8">
                    <SkeletonBox className="h-12 w-40" />                     {/* 保存する */}
                </div>
            </div>
        </main>
    );
}
