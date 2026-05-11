import { NextRequest, NextResponse } from "next/server"
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie"
import { readerApiLongFetch } from "@/lib/reader-api-long-fetch"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 900

const readerApiOrigin = (process.env.READER_API_ORIGIN || "http://localhost:8000").replace(/\/+$/, "")

async function proxyUploadPreview(req: NextRequest) {
  const accessToken = req.cookies.get(AUTH_COOKIE_NAME)?.value || null

  const url = new URL(req.url)
  const query = url.search || ""
  const targetUrl = `${readerApiOrigin}/api/import/uploads/preview${query}`

  const headers = new Headers(req.headers)
  headers.delete("host")
  headers.delete("cookie")
  if (accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`)
  }

  const upstream = await readerApiLongFetch(targetUrl, {
    method: req.method,
    headers,
    body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
    cache: "no-store",
    duplex: "half",
  })

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: upstream.headers,
  })
}

export async function POST(req: NextRequest) {
  return proxyUploadPreview(req)
}
