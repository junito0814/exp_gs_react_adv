// app/interview/page.tsx — 模擬面接（Server Component）
// URL クエリの面接条件を検証して Client に渡す。条件が無ければトップへ
import { redirect } from "next/navigation";
import { parseConditions } from "@/lib/conditions";
import InterviewClient from "./InterviewClient";

export default async function InterviewPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { isEmpty, ...conditions } = parseConditions(await searchParams);
    if (isEmpty) redirect("/");
    return <InterviewClient conditions={conditions} />;
}
