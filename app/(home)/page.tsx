// app/(home)/page.tsx — トップ画面（面接条件を選んで練習へ）
//
// ルートグループ `(home)` に入れているのは loading.tsx の範囲を `/` だけに閉じるため。
// app/loading.tsx は下位のすべてのページ（/interview /practice /sign-in …）の
// fallback にもなるので、トップの骨組みが別の画面でも出てしまう。URL は `/` のまま。
//
// 面接条件のフォームはプロフィールを使わないので、DB を待たずに出す。
// プロフィール未登録の案内（FR-T04）だけを <Suspense> の中で待つ。
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import ConditionForm from "../ConditionForm";
import { requireUserId } from "@/lib/auth";
import { isProfileEmpty } from "@/lib/profile";
import { getProfile } from "@/lib/profile-db";

export const dynamic = "force-dynamic";

// プロフィール未登録のときだけ出る案内。登録済みなら何も出さない
async function ProfileHint({ userId }: { userId: string }) {
    if (!isProfileEmpty(await getProfile(userId))) return null;
    return (
        <p className="max-w-xl mx-auto mb-6 text-sm text-gray-600 dark:text-gray-300">
            <Link href="/profile" className="text-red-400 hover:underline">プロフィールを登録</Link>
            すると、ES や職務経歴を踏まえた深掘りが受けられます。
        </p>
    );
}

export default async function Home() {
    const userId = await requireUserId();
    if (!userId) redirect("/sign-in");

    return (
        <main className="flex-1 text-center leading-loose p-10">
            <h1 className="font-serif text-4xl p-3 mb-6">AI 面接コーチ</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
                志望先と面接官のレベルを選んで、面接練習を始めましょう。
            </p>

            {/* 案内は出ないこともあるので、待っている間は場所を取らない */}
            <Suspense fallback={null}>
                <ProfileHint userId={userId} />
            </Suspense>

            <ConditionForm />

            <div className="flex gap-8 justify-center mt-10 text-lg">
                <Link href="/history?mode=interview" className="text-red-400 hover:underline">📋 履歴を見る</Link>
                <Link href="/profile" className="text-red-400 hover:underline">⚙ プロフィール設定</Link>
            </div>
        </main>
    );
}
