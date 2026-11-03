import type { NextConfig } from "next";

// すべての応答に付けるセキュリティヘッダー（#70）
const securityHeaders = [
  // Content-Type を推測させない（アップロード等を別の種類として解釈させない）
  { key: "X-Content-Type-Options", value: "nosniff" },
  // 他サイトの iframe に埋め込ませない（クリックジャッキング対策）。CSP の frame-ancestors と二重に
  { key: "X-Frame-Options", value: "DENY" },
  // script-src 等は Clerk の読み込み元の洗い出しが要るので、影響の無い指定だけにする
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
  // 他サイトへ移動するときは URL のパス・クエリ（面接条件の自由入力を含む）を渡さない
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // カメラ（笑顔の計測）とマイク（録音）は自サイトだけ。それ以外は使わない
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  // 以後は HTTPS だけで接続させる（HTTP の localhost では無視される）。
  // 独自ドメインの他のサブドメインに影響しないよう includeSubDomains は付けない
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
];

const nextConfig: NextConfig = {
  // フレームワーク名を応答に出さない
  poweredByHeader: false,
  experimental: {
    // proxy.ts を通るリクエストの本文は、ログイン確認の前にメモリへ読み込まれる（既定 10MB）。
    // 最大の正しい本文（録音 lib/schemas.ts の AUDIO_MAX_BYTES = 4MB + フォームの余白）に合わせて絞る
    proxyClientMaxBodySize: "5mb",
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
