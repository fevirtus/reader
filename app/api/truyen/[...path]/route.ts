import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const readerApiOrigin = (process.env.READER_API_ORIGIN || "").replace(/\/+$/, "")

async function proxy(req: NextRequest, path: string[]) {
  if (!readerApiOrigin) {
    return NextResponse.json({ error: "Missing READER_API_ORIGIN" }, { status: 500 })
  }

  const url = new URL(req.url)
  const query = url.search || ""
  const targetUrl = `${readerApiOrigin}/api/truyen/${path.join("/")}${query}`

  const headers = new Headers(req.headers)
  headers.delete("host")
  headers.delete("cookie")

  const isBodyMethod = req.method !== "GET" && req.method !== "HEAD"
  const upstream = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: isBodyMethod ? req.body : undefined,
    cache: "no-store",
    duplex: "half",
  } as any)

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: upstream.headers,
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
