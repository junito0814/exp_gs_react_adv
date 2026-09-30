"use client";
// app/history/TabLink.tsx — 履歴一覧のタブ 1 つ
//
// タブの切り替えは同じ画面の `?mode=` を変えるだけなので、
// loading.tsx（別セグメントへの遷移で出るもの）は出ない。
// そのため Link の進行中状態を useLinkStatus で拾って、押したことが分かるようにする。

import Link from "next/link";
import { useLinkStatus } from "next/link";

// useLinkStatus は Link の子孫でしか使えないので、中身を別コンポーネントにする
function TabLabel({ label, current, count }: { label: string; current: boolean; count?: number }) {
    const { pending } = useLinkStatus();
    return (
        <span className={pending ? "opacity-50" : undefined}>
            {label}
            {current && count !== undefined && `（${count}）`}
        </span>
    );
}

export default function TabLink({
    mode, label, current, count,
}: {
    mode: string;
    label: string;
    current: boolean;
    count?: number;
}) {
    return (
        <Link
            href={`/history?mode=${mode}`}
            // 押した瞬間に pending を取りたいので先読みはしない（DB を毎回読む画面のため）
            prefetch={false}
            aria-current={current ? "page" : undefined}
            className={`px-6 py-2 ${current
                ? "font-bold border-b-4 border-red-500"
                : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"}`}>
            <TabLabel label={label} current={current} count={count} />
        </Link>
    );
}
