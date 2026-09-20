// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
    return (
        <main className="flex-1 flex flex-col items-center justify-center gap-8 p-10 bg-white dark:bg-gray-800 text-black dark:text-white">
            <h1 className="font-serif text-4xl">AI 面接コーチ</h1>
            <SignIn />
        </main>
    );
}
