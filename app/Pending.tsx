// app/Pending.tsx — 処理中であることを示す 1 行（決定事項 33 / NFR-12）
//
// 文言は lib/messages.ts の WAITING に揃える。
// 画面全体を覆うオーバーレイは作らず、その操作の近くに出す。

export default function Pending({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        // 読み上げソフトにも「進行中」が伝わるようにする
        <p role="status" aria-live="polite" className={`text-gray-600 dark:text-gray-300 ${className}`}>
            {children}
        </p>
    );
}
