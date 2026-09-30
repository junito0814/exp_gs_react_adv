// app/Skeleton.tsx — 読み込み中の骨組み（決定事項 33 / NFR-12）
//
// 実際の画面と同じ位置・同じ高さの箱を出す。文字は入れない。
// 画像やスピナーは使わず、色の薄い箱をゆっくり点滅させるだけにする（NFR-07）。

export function SkeletonBox({ className = "" }: { className?: string }) {
    return <div className={`animate-pulse rounded bg-gray-200 dark:bg-gray-700 ${className}`} />;
}

// 見出し＋説明文のように、行を何本か並べたい場所で使う
export function SkeletonLines({ count = 3, className = "" }: { count?: number; className?: string }) {
    return (
        <div className={`flex flex-col gap-3 ${className}`}>
            {Array.from({ length: count }, (_, i) => (
                // 最後の行だけ短くして、文章らしく見せる
                <SkeletonBox key={i} className={`h-4 ${i === count - 1 ? "w-2/3" : "w-full"}`} />
            ))}
        </div>
    );
}
