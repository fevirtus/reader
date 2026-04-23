/** @type {import('next').NextConfig} */
const readerApiOrigin = (process.env.READER_API_ORIGIN || "http://localhost:8000").replace(/\/+$/, "")

const nextConfig = {
  output: "standalone",
  // Tắt HTTP keep-alive để tránh stale connection tới Google OAuth.
  // Sau lần đăng nhập đầu, Node.js giữ TCP socket tới oauth2.googleapis.com trong pool.
  // NAT/firewall của Docker drop socket sau vài phút (silently). Khi login lần 2,
  // openid-client (bên trong NextAuth) reuse socket đã chết → request treo → OAUTH_CALLBACK_ERROR 3500ms.
  httpAgentOptions: {
    keepAlive: false,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/api/genres",
          destination: `${readerApiOrigin}/api/genres`,
        },
        {
          source: "/api/novels/:path*",
          destination: `${readerApiOrigin}/api/novels/:path*`,
        },
        {
          source: "/api/truyen/:path*",
          destination: `${readerApiOrigin}/api/truyen/:path*`,
        },
        {
          source: "/api/chapters/:path*",
          destination: `${readerApiOrigin}/api/chapters/:path*`,
        },
        {
          source: "/api/auth/mobile-login",
          destination: `${readerApiOrigin}/api/auth/mobile-login`,
        },
        {
          source: "/api/health",
          destination: `${readerApiOrigin}/api/health`,
        },
          {
            source: "/api/dev/:path*",
            destination: `${readerApiOrigin}/api/dev/:path*`,
          },
      ],
    }
  },
}

export default nextConfig
