// app/page.tsx — トップ画面（面接条件を選んで練習へ）
import Link from "next/link";
import ConditionForm from "./ConditionForm";

export default function Home() {
    return (
        <main className="flex-1 text-center leading-loose p-10">
            <h1 className="font-serif text-4xl p-3 mb-6">AI 面接コーチ</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
                志望先と面接官のレベルを選んで、面接練習を始めましょう。
            </p>

            <ConditionForm />

            <div className="flex gap-8 justify-center mt-10 text-lg">
                <Link href="/history" className="text-red-400 hover:underline">📋 履歴を見る</Link>
                {/* 第 2 段階で「⚙ プロフィール設定」を追加 */}
            </div>
        </main>
    );
}
