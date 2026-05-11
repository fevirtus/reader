import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const readerApiOrigin = (process.env.READER_API_ORIGIN || "http://localhost:8000").replace(/\/+$/, "")

const nextConfig = {
  // Tránh Turbopack suy luận sai root (lỗi: tìm next từ `reader/app` → dev server exit 1).
  turbopack: {
    root: __dirname,
  },
  output: "standalone",
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
