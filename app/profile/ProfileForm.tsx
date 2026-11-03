"use client";
// app/profile/ProfileForm.tsx — ES / 職務経歴書（履歴書形式）/ 免許・資格の入力

import { useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Notice from "@/app/Notice";
import FieldError from "@/app/FieldError";
import { AI_SEND_NOTICE } from "@/lib/messages";
import {
    ES_MAX, QUALIFICATIONS_MAX, HISTORY_MAX_ROWS, HISTORY_TEXT_MAX, HISTORY_YEAR_MIN,
    profileSchema, type Profile,
} from "@/lib/profile";

const THIS_YEAR = new Date().getFullYear();
const inputClass = "ring-2 ring-gray-300 dark:ring-gray-600 rounded p-2 bg-white dark:bg-gray-700";
// エラーのある欄は枠を赤くする
const invalidClass = "aria-[invalid=true]:ring-red-400";

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
    // 検証は API と同じスキーマ（lib/profile.ts）で行う。送るのは整形後（trim・見えない文字の除去）の値
    const { register, control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(profileSchema),
        defaultValues: initial,
        mode: "onBlur",
    });
    const { fields, append, remove } = useFieldArray({ control, name: "history" });
    const es = useWatch({ control, name: "es" }) ?? "";
    const qualifications = useWatch({ control, name: "qualifications" }) ?? "";
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    async function save(values: Profile) {
        setMessage(""); setError("");
        try {
            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setMessage("保存しました");
            } else {
                setError(typeof data.error === "string" ? data.error : "保存に失敗しました");
            }
        } catch {
            setError("保存に失敗しました。通信を確認してください。");
        }
    }

    return (
        // <form> にすると入力欄で Enter を押しただけで保存されるので、div のまま保存ボタンで検証する
        <div className="flex flex-col gap-6 text-left">
            {/* 入力欄より前に 1 回だけ出す（#66） */}
            <Notice>{AI_SEND_NOTICE}</Notice>

            <Section title="ES（エントリーシート）" desc="ガクチカ・自己PR・志望動機の骨子など">
                <textarea
                    {...register("es")}
                    rows={10} maxLength={ES_MAX}
                    aria-invalid={!!errors.es} aria-describedby="es-error"
                    className={`w-full ${inputClass} ${invalidClass}`}
                    placeholder="例：サークルで新歓の集客を担当し、SNS 運用で参加者を 1.5 倍にした。…"
                />
                <p className="text-sm text-right text-gray-500 dark:text-gray-400">
                    残り {ES_MAX - es.length} 文字
                </p>
                <FieldError id="es-error" message={errors.es?.message} />
            </Section>

            <Section
                title="職務経歴書（学歴・職歴）"
                desc={`履歴書と同じように、古い順に書いてください。例：2016 年 4 月　○○大学 経済学部 入学`}>
                {fields.length > 0 && (
                    <div className="flex flex-col gap-2">
                        <div className="flex gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="w-24">年</span>
                            <span className="w-20">月</span>
                            <span className="flex-1">内容（{HISTORY_TEXT_MAX} 文字まで）</span>
                            <span className="w-12" />
                        </div>
                        {fields.map((field, i) => {
                            const rowError = errors.history?.[i];
                            const errorId = `history-${field.id}-error`;
                            return (
                                <div key={field.id} className="flex flex-col gap-1">
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="number" inputMode="numeric"
                                            {...register(`history.${i}.year`, { valueAsNumber: true })}
                                            min={HISTORY_YEAR_MIN} max={THIS_YEAR} step={1}
                                            aria-label={`${i + 1} 行目の年`}
                                            aria-invalid={!!rowError?.year} aria-describedby={errorId}
                                            className={`w-24 ${inputClass} ${invalidClass}`}
                                        />
                                        <select
                                            {...register(`history.${i}.month`, { valueAsNumber: true })}
                                            aria-label={`${i + 1} 行目の月`}
                                            aria-invalid={!!rowError?.month} aria-describedby={errorId}
                                            className={`w-20 cursor-pointer ${inputClass} ${invalidClass}`}>
                                            {Array.from({ length: 12 }, (_, m) => m + 1).map((m) => (
                                                <option key={m} value={m}>{m}</option>
                                            ))}
                                        </select>
                                        <input
                                            type="text" maxLength={HISTORY_TEXT_MAX}
                                            {...register(`history.${i}.text`)}
                                            aria-label={`${i + 1} 行目の内容`}
                                            aria-invalid={!!rowError?.text} aria-describedby={errorId}
                                            placeholder="○○大学 経済学部 入学"
                                            className={`flex-1 min-w-0 ${inputClass} ${invalidClass}`}
                                        />
                                        <button
                                            type="button" onClick={() => remove(i)}
                                            aria-label={`${i + 1} 行目を削除`}
                                            className="w-12 py-2 rounded border border-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
                                            ✕
                                        </button>
                                    </div>
                                    <FieldError
                                        id={errorId}
                                        message={rowError?.year?.message ?? rowError?.month?.message ?? rowError?.text?.message}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
                <div className="flex justify-between items-center">
                    <button
                        type="button"
                        onClick={() => append({ year: THIS_YEAR, month: 4, text: "" })}
                        disabled={fields.length >= HISTORY_MAX_ROWS}
                        className="px-4 py-2 rounded border border-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700
                            disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                        ＋ 行を追加
                    </button>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        {fields.length} / {HISTORY_MAX_ROWS} 行
                    </span>
                </div>
                <FieldError id="history-error" message={errors.history?.message ?? errors.history?.root?.message} />
            </Section>

            <Section title="免許・資格">
                <textarea
                    {...register("qualifications")}
                    rows={3} maxLength={QUALIFICATIONS_MAX}
                    aria-invalid={!!errors.qualifications} aria-describedby="qualifications-error"
                    className={`w-full ${inputClass} ${invalidClass}`}
                    placeholder="例：TOEIC 800 点、基本情報技術者"
                />
                <p className="text-sm text-right text-gray-500 dark:text-gray-400">
                    残り {QUALIFICATIONS_MAX - qualifications.length} 文字
                </p>
                <FieldError id="qualifications-error" message={errors.qualifications?.message} />
            </Section>

            <div className="flex flex-col items-center gap-2 mt-2">
                <button
                    type="button" onClick={handleSubmit(save)} disabled={isSubmitting}
                    className="bg-red-400 text-white px-8 py-3 rounded hover:bg-red-500
                        transition duration-300 disabled:opacity-50 cursor-pointer">
                    {isSubmitting ? "保存中…" : "保存する"}
                </button>
                {message && <p className="text-sm">✓ {message}</p>}
                {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
        </div>
    );
}
