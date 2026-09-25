// app/page.tsx — トップ画面（面接条件を選んで練習へ）
import Link from "next/link";
import { redirect } from "next/navigation";
import ConditionForm from "./ConditionForm";
import { requireUserId } from "@/lib/auth";
import { isProfileEmpty } from "@/lib/profile";
import { getProfile } from "@/lib/profile-db";

export const dynamic = "force-dynamic";

export default async function Home() {
    const userId = await requireUserId();
    if (!userId) redirect("/sign-in");
    const noProfile = isProfileEmpty(await getProfile(userId));

    return (
        <main className="flex-1 text-center leading-loose p-10">
            <h1 className="font-serif text-4xl p-3 mb-6">AI 面接コーチ</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
                志望先と面接官のレベルを選んで、面接練習を始めましょう。
            </p>

            {noProfile && (
                <p className="max-w-xl mx-auto mb-6 text-sm text-gray-600 dark:text-gray-300">
                    <Link href="/profile" className="text-red-400 hover:underline">プロフィールを登録</Link>
                    すると、ES や職務経歴を踏まえた深掘りが受けられます。
                </p>
            )}

            <ConditionForm />

            <div className="flex gap-8 justify-center mt-10 text-lg">
                <Link href="/history" className="text-red-400 hover:underline">📋 履歴を見る</Link>
                <Link href="/profile" className="text-red-400 hover:underline">⚙ プロフィール設定</Link>
            </div>
        </main>
    );
}
