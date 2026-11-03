// lib/http.ts — Route Handler 用：リクエスト本文の読み取りと検証（#70）
import "server-only";
import type { z } from "zod";
import { issueMessage } from "./schemas";

// JSON 本文の上限。最大は模擬面接の保存（回答・質問 3 往復 + 総評）で、日本語 3 バイト換算でも 60KB 弱
const JSON_BODY_MAX_BYTES = 128 * 1024;

type Parsed<T> = { ok: true; value: T } | { ok: false; response: Response };

function fail(status: number, error: string): { ok: false; response: Response } {
    return { ok: false, response: Response.json({ error }, { status }) };
}

// 本文を上限つきで読む。Content-Length が無い・偽っている場合に備え、読みながらバイト数を数える
async function readLimited(request: Request, maxBytes: number): Promise<Uint8Array | null> {
    if (!request.body) return new Uint8Array();
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) {
            await reader.cancel();
            return null;
        }
        chunks.push(value);
    }
    const out = new Uint8Array(size);
    let offset = 0;
    for (const c of chunks) {
        out.set(c, offset);
        offset += c.byteLength;
    }
    return out;
}

// 宣言されたサイズが上限を超えていれば true（読む前に断る）
export function declaredTooLarge(request: Request, maxBytes: number): boolean {
    const declared = Number(request.headers.get("content-length"));
    return Number.isFinite(declared) && declared > maxBytes;
}

// JSON 本文を読み、スキーマで検証する。
// Content-Type が JSON でない（415）・大きすぎる（413）・JSON として壊れている（400）・スキーマ違反（400）
export async function parseJsonBody<S extends z.ZodType>(
    request: Request,
    schema: S,
    maxBytes = JSON_BODY_MAX_BYTES,
): Promise<Parsed<z.output<S>>> {
    const type = (request.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
    if (type !== "application/json") return fail(415, "Content-Type は application/json にしてください");
    if (declaredTooLarge(request, maxBytes)) return fail(413, "リクエストが大きすぎます");

    let body: unknown;
    try {
        const bytes = await readLimited(request, maxBytes);
        if (!bytes) return fail(413, "リクエストが大きすぎます");
        // 不正な UTF-8 は置き換えずにエラーにする
        body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    } catch {
        return fail(400, "リクエストの形式が不正です");
    }

    const result = schema.safeParse(body);
    if (!result.success) return fail(400, issueMessage(result.error.issues[0]));
    return { ok: true, value: result.data };
}

// 例外をログ用に要約する（名前と原因のコードだけ）。
// drizzle の DrizzleQueryError はメッセージに SQL の値（ユーザーの入力）をそのまま含むなど、
// 例外の本文には入力が混ざりうるので残さない
export function errorSummary(e: unknown): string {
    if (!(e instanceof Error)) return typeof e;
    const code = (e.cause as { code?: unknown } | undefined)?.code;
    return code === undefined ? e.name : `${e.name} (${String(code)})`;
}

// DB に書き込む。失敗したら入力を含まないログだけ残して 500 を返す（例外のまま投げると全文がログに出る）
export async function writeDb(run: () => Promise<Response>): Promise<Response> {
    try {
        return await run();
    } catch (e) {
        console.error("DB エラー:", errorSummary(e));
        return Response.json({ error: "保存に失敗しました。時間をおいてもう一度お試しください。" }, { status: 500 });
    }
}

