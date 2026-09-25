// app/profile/page.tsx — プロフィール設定（Server Component）
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUserId } from "@/lib/auth";
import { getProfile } from "@/lib/profile";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
    const userId = await requireUserId();
    if (!userId) redirect("/sign-in");

    const profile = await getProfile(userId);

    return (
        <main className="flex-1 leading-loose p-10">
            <div className="max-w-2xl mx-auto">
                <Link href="/" className="text-red-400 hover:underline">← トップへ戻る</Link>
                <h1 className="font-serif text-4xl text-center p-3 mt-6 mb-2">プロフィール設定</h1>
                <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
                    登録すると、面接官がその内容を踏まえて深掘りします。すべて任意です。
                </p>
                <ProfileForm initial={profile} />
            </div>
        </main>
    );
}
