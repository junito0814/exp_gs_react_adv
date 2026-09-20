import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, Show, UserButton } from "@clerk/nextjs";
import { jaJP } from "@clerk/localizations";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI 面接コーチ",
  description: "AI が面接官役になって質問・深掘り・講評をする面接練習アプリ",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider localization={jaJP}>
      <html
        lang="ja"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-white dark:bg-gray-800 text-black dark:text-white">
          {/* 共通ヘッダー: ログイン中はアカウントボタン（ログアウトはここから） */}
          <header className="flex items-center justify-between h-14 px-6 border-b border-gray-200 dark:border-gray-700">
            <Link href="/" className="font-serif text-lg">AI 面接コーチ</Link>
            <Show when="signed-in">
              <UserButton />
            </Show>
          </header>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
