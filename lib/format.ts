// lib/format.ts — 表示用の整形
// 日時を「2026/09/25 22:10」形式に（日本時間）
export function formatDate(d: Date): string {
    return new Intl.DateTimeFormat("ja-JP", {
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", hour12: false,
        timeZone: "Asia/Tokyo",
    }).format(d);
}

// 長い文字列を省略する（一覧で質問文をそのまま出すと長いため）
export function truncate(text: string, max: number): string {
    return text.length > max ? text.slice(0, max) + "…" : text;
}
