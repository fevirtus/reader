import { NextRequest, NextResponse } from "next/server"
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const readerApiOrigin = (process.env.READER_API_ORIGIN || "").replace(/\/+$/, "")

async function proxy(req: NextRequest, path: string[]) {
  if (!readerApiOrigin) {
    return NextResponse.json({ error: "Missing READER_API_ORIGIN" }, { status: 500 })
  }

  const accessToken = req.cookies.get(AUTH_COOKIE_NAME)?.value || null

  const url = new URL(req.url)
  const query = url.search || ""
  const targetUrl = `${readerApiOrigin}/api/audiobooks/${path.join("/")}${query}`

  const headers = new Headers(req.headers)
  headers.delete("host")
  headers.delete("cookie")
  headers.set("accept-encoding", "identity")
  if (accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`)
  }

  const isBodyMethod = req.method !== "GET" && req.method !== "HEAD"
  let upstream: Response
  try {
    upstream = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: isBodyMethod ? req.body : undefined,
    cache: "no-store",
    duplex: "half",
  } as any)
  } catch {
    return NextResponse.json({ detail: "Không kết nối được dịch vụ Audio book" }, { status: 502 })
  }

  // Node fetch decodes compressed responses. Forwarding the original encoding
  // would make the browser decompress JSON a second time (e.g. via Cloudflare).
  const responseHeaders = new Headers(upstream.headers)
  if (responseHeaders.has("content-encoding")) {
    responseHeaders.delete("content-encoding")
    responseHeaders.delete("content-length")
  }
  responseHeaders.delete("transfer-encoding")
  responseHeaders.delete("connection")
  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  })
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  return proxy(req, path)
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  return proxy(req, path)
}

export async function HEAD(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  return proxy(req, (await ctx.params).path)
}
