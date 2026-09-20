// proxy.ts（Next.js 16 では Middleware が Proxy に改名された）
// /sign-in と /models 以外のすべてのページ・API を Clerk で保護する
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/models(.*)", // face-api のモデルファイル（public/models）
]);
const isApiRoute = createRouteMatcher(["/api(.*)"]);

export default clerkMiddleware(async (auth, req) => {
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
