// proxy.ts（Next.js 16 では Middleware が Proxy に改名された）
// /sign-in と /models 以外のすべてのページ・API を Clerk で保護する
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

const isPublicRoute = createRouteMatcher([
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/models(.*)", // face-api のモデルファイル（public/models）
]);
const isApiRoute = createRouteMatcher(["/api(.*)"]);
const SAFE_METHODS = ["GET", "HEAD", "OPTIONS"];

// 別オリジンのページから API へ書き込ませない（CSRF の多層防御。#70）。
//  1. Sec-Fetch-Site（今のブラウザは必ず付け、ページからは書き換えられない）が same-origin 以外なら拒否
//  2. 付いていない古いブラウザでは、Origin のホストを Host ヘッダー（ブラウザが実際に接続した先）と比べる
//  3. どちらも無いのは Bruno などブラウザ以外からの呼び出し。Clerk のセッションが必要なのでここでは通す
// nextUrl.host はサーバーの待ち受け名（localhost など）になることがあり、127.0.0.1 や独自ドメインで
// 開いたときに正しいリクエストまで弾くので使わない
function isCrossOriginWrite(req: NextRequest): boolean {
    if (SAFE_METHODS.includes(req.method)) return false;
    const site = req.headers.get("sec-fetch-site");
    if (site !== null) return site !== "same-origin";
    const origin = req.headers.get("origin");
    if (origin === null) return false;
    try {
        return new URL(origin).host !== req.headers.get("host");
    } catch {
        return true; // "null"（サンドボックスの iframe など）や壊れた値
    }
}

export default clerkMiddleware(async (auth, req) => {
    if (isApiRoute(req) && isCrossOriginWrite(req)) {
        return NextResponse.json({ error: "不正なリクエストです" }, { status: 403 });
    }
    if (isPublicRoute(req)) return;

    const { userId, redirectToSignIn } = await auth();
    if (userId) return;

    // API は 401 を返す（画面はログインページへ）
    if (isApiRoute(req)) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    return redirectToSignIn({ returnBackUrl: req.url });
});

export const config = {
    matcher: [
        // Next.js の内部ファイルと静的ファイル以外
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // API は常に通す
        "/(api|trpc)(.*)",
    ],
};
