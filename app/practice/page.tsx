// app/practice/page.tsx — 講評モード（Server Component）
// URL クエリの面接条件を検証して Client に渡す。条件が無ければトップへ
import { redirect } from "next/navigation";
import { parseConditions } from "@/lib/conditions";
import PracticeClient from "./PracticeClient";

export default async function PracticePage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { isEmpty, ...conditions } = parseConditions(await searchParams);
    if (isEmpty) redirect("/");
    return <PracticeClient conditions={conditions} />;
}
