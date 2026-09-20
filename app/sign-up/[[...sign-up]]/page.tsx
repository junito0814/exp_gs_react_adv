// app/sign-up/[[...sign-up]]/page.tsx
// Google ログインのみなので実質サインインと同じ。Clerk が /sign-up を参照したとき用
import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
    return (
        <main className="flex-1 flex flex-col items-center justify-center gap-8 p-10 bg-white dark:bg-gray-800 text-black dark:text-white">
            <h1 className="font-serif text-4xl">AI 面接コーチ</h1>
            <SignUp />
        </main>
    );
}
