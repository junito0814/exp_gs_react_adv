// app/Notice.tsx — 注意事項（AI に送られる・AI が解析する）を示す枠
//
// プロフィール設定・講評モード・模擬面接で同じ見た目にする。
// 文言は lib/messages.ts に置き、ここでは枠と ⚠ だけを持つ。

export default function Notice({ children }: { children: React.ReactNode }) {
    return (
        <p className="text-sm text-left text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/30
            border border-amber-300 dark:border-amber-700 rounded p-3 leading-relaxed">
            ⚠ {children}
        </p>
    );
}
