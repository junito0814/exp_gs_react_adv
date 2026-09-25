"use client";
// app/ConditionForm.tsx
// トップ画面の面接条件フォーム。選んだ条件は URL クエリで /practice /interview に渡す

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    INDUSTRIES, JOBS, CAREERS, LEVELS,
    BACKGROUND_LABEL, BACKGROUND_PLACEHOLDER, BACKGROUND_MAX,
    INTERVIEW_TURNS, descriptionOf,
} from "@/lib/options";
import { DEFAULT_CONDITIONS, toQuery, type Conditions } from "@/lib/conditions";

const selectClass =
    "w-full max-w-md ring-2 ring-gray-300 dark:ring-gray-600 rounded p-2 bg-white dark:bg-gray-700 cursor-pointer";

export default function ConditionForm({ initial }: { initial?: Conditions }) {
    const router = useRouter();
    const [c, setC] = useState<Conditions>(initial ?? DEFAULT_CONDITIONS);
    const update = <K extends keyof Conditions>(key: K, value: Conditions[K]) =>
        setC((prev) => ({ ...prev, [key]: value }));

    return (
        <div className="max-w-xl mx-auto text-left">
            <h2 className="font-bold text-xl mb-4">面接条件</h2>
            <div className="flex flex-col gap-4 p-6 rounded-lg ring-2 ring-gray-200 dark:ring-gray-700">
                <label className="flex flex-col gap-1">
                    <span className="text-sm">志望業界</span>
                    <select className={selectClass} value={c.industry}
                        onChange={(e) => update("industry", e.target.value as Conditions["industry"])}>
                        {INDUSTRIES.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                    </select>
                </label>

                <label className="flex flex-col gap-1">
                    <span className="text-sm">志望職種</span>
                    <select className={selectClass} value={c.job}
                        onChange={(e) => update("job", e.target.value as Conditions["job"])}>
                        {JOBS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                    </select>
                </label>

                <fieldset className="flex flex-col gap-1">
                    <legend className="text-sm">区分</legend>
                    <div className="flex gap-6">
                        {CAREERS.map((o) => (
                            <label key={o.key} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="career" value={o.key} checked={c.career === o.key}
                                    onChange={() => update("career", o.key)} />
                                {o.label}
                            </label>
                        ))}
                    </div>
                </fieldset>

                <label className="flex flex-col gap-1">
                    <span className="text-sm">{BACKGROUND_LABEL[c.career]}（任意）</span>
                    <input type="text" className={selectClass.replace("cursor-pointer", "")}
                        value={c.background} maxLength={BACKGROUND_MAX}
                        placeholder={BACKGROUND_PLACEHOLDER[c.career]}
                        onChange={(e) => update("background", e.target.value)} />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        入力すると質問が具体的になります（{c.background.length}/{BACKGROUND_MAX}）
                    </span>
                </label>

                <label className="flex flex-col gap-1">
                    <span className="text-sm">面接官レベル</span>
                    <select className={selectClass} value={c.level}
                        onChange={(e) => update("level", e.target.value as Conditions["level"])}>
                        {LEVELS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                    </select>
                    {/* 選んだレベルで何が起きるかを示す */}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {descriptionOf(LEVELS, c.level)}
                    </span>
                </label>
            </div>

            {/* 2 つのモード。違いが分かるよう一言添える */}
            <div className="flex flex-wrap gap-6 justify-center mt-8">
                <div className="flex flex-col items-center gap-2">
                    <button
                        type="button"
                        onClick={() => router.push(`/interview?${toQuery(c)}`)}
                        className="bg-red-400 text-white px-6 py-3 rounded hover:bg-red-500 transition duration-300 transform hover:scale-105 cursor-pointer">
                        🎤 模擬面接を始める
                    </button>
                    <span className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-[15rem]">
                        面接官が出題し、回答を深掘りします（{INTERVIEW_TURNS} 往復・録音のみ）
                    </span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <button
                        type="button"
                        onClick={() => router.push(`/practice?${toQuery(c)}`)}
                        className="px-6 py-3 rounded border border-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition duration-300 cursor-pointer">
                        ✎ 講評モードで練習
                    </button>
                    <span className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-[15rem]">
                        テーマを自分で選んで 1 問だけ講評をもらいます
                    </span>
                </div>
            </div>
        </div>
    );
}
