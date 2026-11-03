"use client";
// app/ConditionForm.tsx
// トップ画面の面接条件フォーム。選んだ条件は URL クエリで /practice /interview に渡す

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import FieldError from "@/app/FieldError";
import {
    INDUSTRIES, JOBS, CAREERS, LEVELS, STAGES, COMPANIES,
    BACKGROUND_LABEL, BACKGROUND_PLACEHOLDER, BACKGROUND_MAX, OTHER_MAX,
    INTERVIEW_TURNS, descriptionOf,
} from "@/lib/options";
import { DEFAULT_CONDITIONS, toQuery, type Conditions } from "@/lib/conditions";
import { WAITING } from "@/lib/messages";
import { conditionsSchema } from "@/lib/schemas";

const selectClass =
    "w-full max-w-md ring-2 ring-gray-300 dark:ring-gray-600 rounded p-2 bg-white dark:bg-gray-700 cursor-pointer";
const inputClass = `${selectClass.replace("cursor-pointer", "")} aria-[invalid=true]:ring-red-400`;

export default function ConditionForm({ initial }: { initial?: Conditions }) {
    const router = useRouter();
    // 検証は lib/schemas.ts の conditionsSchema（「その他」を選んだら自由入力が必須）。#70
    const { register, control, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(conditionsSchema),
        defaultValues: initial ?? DEFAULT_CONDITIONS,
        mode: "onBlur",
    });
    // 選んだ値によって表示を変える欄（ラベル・説明文・自由入力の出し分け）
    const [industry, job, career, stage, company, level, background] = useWatch({
        control,
        name: ["industry", "job", "career", "stage", "company", "level", "background"],
    });
    // 押してから練習画面が出るまでの間。どちらを押したか分かるように行き先も持つ
    const [moving, startTransition] = useTransition();
    const [movingTo, setMovingTo] = useState<"interview" | "practice" | null>(null);
    // 検証を通った（整形後の）値だけを URL に載せる
    const go = (to: "interview" | "practice") => handleSubmit((c: Conditions) => {
        if (moving) return;
        setMovingTo(to);
        startTransition(() => router.push(`/${to}?${toQuery(c)}`));
    })();

    return (
        <div className="max-w-xl mx-auto text-left">
            <h2 className="font-bold text-xl mb-4">面接条件</h2>
            <div className="flex flex-col gap-4 p-6 rounded-lg ring-2 ring-gray-200 dark:ring-gray-700">
                <label className="flex flex-col gap-1">
                    <span className="text-sm">志望業界</span>
                    <select className={selectClass} {...register("industry")}>
                        {INDUSTRIES.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                    </select>
                    {industry === "other" && (
                        <>
                            <input type="text" className={inputClass}
                                {...register("industryOther")} maxLength={OTHER_MAX}
                                aria-label="志望業界（その他）"
                                aria-invalid={!!errors.industryOther} aria-describedby="industryOther-error"
                                placeholder="例：不動産、教育、物流" />
                            <FieldError id="industryOther-error" message={errors.industryOther?.message} />
                        </>
                    )}
                </label>

                <label className="flex flex-col gap-1">
                    <span className="text-sm">志望職種</span>
                    <select className={selectClass} {...register("job")}>
                        {JOBS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                    </select>
                    {job === "other" && (
                        <>
                            <input type="text" className={inputClass}
                                {...register("jobOther")} maxLength={OTHER_MAX}
                                aria-label="志望職種（その他）"
                                aria-invalid={!!errors.jobOther} aria-describedby="jobOther-error"
                                placeholder="例：人事、経理、デザイナー" />
                            <FieldError id="jobOther-error" message={errors.jobOther?.message} />
                        </>
                    )}
                </label>

                <fieldset className="flex flex-col gap-1">
                    <legend className="text-sm">区分</legend>
                    <div className="flex gap-6">
                        {CAREERS.map((o) => (
                            <label key={o.key} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" value={o.key} {...register("career")} />
                                {o.label}
                            </label>
                        ))}
                    </div>
                </fieldset>

                <label className="flex flex-col gap-1">
                    <span className="text-sm">{BACKGROUND_LABEL[career]}（任意）</span>
                    <input type="text" className={inputClass}
                        {...register("background")} maxLength={BACKGROUND_MAX}
                        aria-invalid={!!errors.background} aria-describedby="background-error"
                        placeholder={BACKGROUND_PLACEHOLDER[career]} />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        入力すると質問が具体的になります（{background.length}/{BACKGROUND_MAX}）
                    </span>
                    <FieldError id="background-error" message={errors.background?.message} />
                </label>

                {/* 何の面接か（段階と志望先のタイプ）。出題の傾向と志望動機の突き方が変わる */}
                <label className="flex flex-col gap-1">
                    <span className="text-sm">面接の段階</span>
                    <select className={selectClass} {...register("stage")}>
                        {STAGES.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                    </select>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {descriptionOf(STAGES, stage)}
                    </span>
                </label>

                <label className="flex flex-col gap-1">
                    <span className="text-sm">企業の規模・タイプ</span>
                    <select className={selectClass} {...register("company")}>
                        {COMPANIES.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                    </select>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {descriptionOf(COMPANIES, company)}
                    </span>
                </label>

                <label className="flex flex-col gap-1">
                    <span className="text-sm">面接官レベル</span>
                    <select className={selectClass} {...register("level")}>
                        {LEVELS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                    </select>
                    {/* 選んだレベルで何が起きるかを示す */}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {descriptionOf(LEVELS, level)}
                    </span>
                </label>
            </div>

            {/* 2 つのモード。違いが分かるよう一言添える */}
            <div className="flex flex-wrap gap-6 justify-center mt-8">
                <div className="flex flex-col items-center gap-2">
                    <button
                        type="button"
                        onClick={() => go("interview")}
                        disabled={moving}
                        className="bg-red-400 text-white px-6 py-3 rounded hover:bg-red-500 transition duration-300
                            transform hover:scale-105 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                            disabled:transform-none">
                        {movingTo === "interview" ? WAITING.moving : "🎤 模擬面接を始める"}
                    </button>
                    <span className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-[15rem]">
                        面接官が出題し、回答を深掘りします（{INTERVIEW_TURNS} 往復・録音のみ）
                    </span>
                </div>
                <div className="flex flex-col items-center gap-2">
                    <button
                        type="button"
                        onClick={() => go("practice")}
                        disabled={moving}
                        className="px-6 py-3 rounded border border-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700
                            transition duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                        {movingTo === "practice" ? WAITING.moving : "✎ 講評モードで練習"}
                    </button>
                    <span className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-[15rem]">
                        テーマを自分で選んで 1 問だけ講評をもらいます
                    </span>
                </div>
            </div>
        </div>
    );
}
