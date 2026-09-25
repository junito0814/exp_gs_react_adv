"use client";
// app/profile/ProfileForm.tsx — ES / 職務経歴書（履歴書形式）/ 免許・資格の入力

import { useState } from "react";
import { AI_SEND_NOTICE } from "@/lib/messages";
import {
    ES_MAX, QUALIFICATIONS_MAX, HISTORY_MAX_ROWS, HISTORY_TEXT_MAX, HISTORY_YEAR_MIN,
    type Profile,
} from "@/lib/profile";
import type { HistoryRow } from "@/lib/types";

const THIS_YEAR = new Date().getFullYear();
const inputClass = "ring-2 ring-gray-300 dark:ring-gray-600 rounded p-2 bg-white dark:bg-gray-700";

function Notice() {
    return (
        <p className="text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-900/30
            border border-amber-300 dark:border-amber-700 rounded p-3 leading-relaxed">
            ⚠ {AI_SEND_NOTICE}
        </p>
    );
}

function Section({ title, desc, children }: { title: string; desc?: string; children: React.ReactNode }) {
    return (
        <section className="flex flex-col gap-2 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h2 className="font-bold text-lg">{title}</h2>
            {desc && <p className="text-sm text-gray-500 dark:text-gray-400">{desc}</p>}
            {children}
        </section>
    );
}

export default function ProfileForm({ initial }: { initial: Profile }) {
    const [es, setEs] = useState(initial.es);
    const [history, setHistory] = useState<HistoryRow[]>(initial.history);
    const [qualifications, setQualifications] = useState(initial.qualifications);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    function addRow() {
        if (history.length >= HISTORY_MAX_ROWS) return;
        setHistory([...history, { year: THIS_YEAR, month: 4, text: "" }]);
    }
    function updateRow(i: number, patch: Partial<HistoryRow>) {
        setHistory(history.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
    }
    function removeRow(i: number) {
        setHistory(history.filter((_, idx) => idx !== i));
    }

    async function save() {
        if (saving) return;
        setSaving(true); setMessage(""); setError("");
        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ es, history, qualifications }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) setMessage("保存しました");
            else setError(data.error ?? "保存に失敗しました");
        } catch {
            setError("保存に失敗しました。通信を確認してください。");
        } finally {
            setSaving(false);
        }
    }

    return (
        <div className="flex flex-col gap-6 text-left">
            <Section title="ES（エントリーシート）" desc="ガクチカ・自己PR・志望動機の骨子など">
                <textarea
                    value={es} onChange={(e) => setEs(e.target.value)}
                    rows={10} maxLength={ES_MAX}
                    className={`w-full ${inputClass}`}
                    placeholder="例：サークルで新歓の集客を担当し、SNS 運用で参加者を 1.5 倍にした。…"
                />
                <p className="text-sm text-right text-gray-500 dark:text-gray-400">
                    残り {ES_MAX - es.length} 文字
                </p>
                <Notice />
            </Section>

            <Section
                title="職務経歴書（学歴・職歴）"
                desc={`履歴書と同じように、古い順に書いてください。例：2016 年 4 月　○○大学 経済学部 入学`}>
                {history.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="w-24">年</span>
                            <span className="w-20">月</span>
                            <span className="flex-1">内容（{HISTORY_TEXT_MAX} 文字まで）</span>
                            <span className="w-12" />
                        </div>
                        {history.map((row, i) => (
                            <div key={i} className="flex gap-2 items-center">
                                <input
                                    type="number" value={row.year}
                                    min={HISTORY_YEAR_MIN} max={THIS_YEAR}
                                    onChange={(e) => updateRow(i, { year: Number(e.target.value) })}
                                    aria-label={`${i + 1} 行目の年`}
                                    className={`w-24 ${inputClass}`}
                                />
                                <select
                                    value={row.month}
                                    onChange={(e) => updateRow(i, { month: Number(e.target.value) })}
                                    aria-label={`${i + 1} 行目の月`}
                                    className={`w-20 cursor-pointer ${inputClass}`}>
                                    {Array.from({ length: 12 }, (_, m) => m + 1).map((m) => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                                <input
                                    type="text" value={row.text} maxLength={HISTORY_TEXT_MAX}
                                    onChange={(e) => updateRow(i, { text: e.target.value })}
                                    aria-label={`${i + 1} 行目の内容`}
                                    placeholder="○○大学 経済学部 入学"
                                    className={`flex-1 min-w-0 ${inputClass}`}
                                />
                                <button
                                    type="button" onClick={() => removeRow(i)}
                                    aria-label={`${i + 1} 行目を削除`}
                                    className="w-12 py-2 rounded border border-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className="flex justify-between items-center">
                    <button
                        type="button" onClick={addRow} disabled={history.length >= HISTORY_MAX_ROWS}
                        className="px-4 py-2 rounded border border-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700
                            disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                        ＋ 行を追加
                    </button>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {history.length} / {HISTORY_MAX_ROWS} 行
                    </span>
                </div>
                <Notice />
            </Section>

            <Section title="免許・資格">
                <textarea
                    value={qualifications} onChange={(e) => setQualifications(e.target.value)}
                    rows={3} maxLength={QUALIFICATIONS_MAX}
                    className={`w-full ${inputClass}`}
                    placeholder="例：TOEIC 800 点、基本情報技術者"
                />
                <p className="text-sm text-right text-gray-500 dark:text-gray-400">
                    残り {QUALIFICATIONS_MAX - qualifications.length} 文字
                </p>
                <Notice />
            </Section>

            <div className="flex flex-col items-center gap-2 mt-2">
                <button
                    type="button" onClick={save} disabled={saving}
                    className="bg-red-400 text-white px-8 py-3 rounded hover:bg-red-500
                        transition duration-300 disabled:opacity-50 cursor-pointer">
                    {saving ? "保存中…" : "保存する"}
                </button>
                {message && <p className="text-sm">✓ {message}</p>}
                {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
        </div>
    );
}
