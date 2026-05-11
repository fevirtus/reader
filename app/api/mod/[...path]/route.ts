import { NextRequest, NextResponse } from "next/server"
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie"
import { readerApiLongFetch } from "@/lib/reader-api-long-fetch"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
/** Import EPUB nhiều chương + ghi NAS chậm có thể kéo dài nhiều phút (đặc biệt khi Next làm proxy BFF). */
export const maxDuration = 900

const readerApiOrigin = (process.env.READER_API_ORIGIN || "http://localhost:8000").replace(/\/+$/, "")

async function proxyToReaderApi(req: NextRequest, path: string[]) {
  const accessToken = req.cookies.get(AUTH_COOKIE_NAME)?.value || null

  const url = new URL(req.url)
  const query = url.search || ""
  const targetUrl = `${readerApiOrigin}/api/mod/${path.join("/")}${query}`

  const headers = new Headers(req.headers)
  headers.delete("host")
  headers.delete("cookie")
  if (accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`)
  }

  const isBodyMethod = req.method !== "GET" && req.method !== "HEAD"
  const upstream = await readerApiLongFetch(targetUrl, {
    method: req.method,
    headers,
    body: isBodyMethod ? req.body : undefined,
    cache: "no-store",
    duplex: "half",
  })

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: upstream.headers,
  })
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  return proxyToReaderApi(req, path)
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  return proxyToReaderApi(req, path)
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  return proxyToReaderApi(req, path)
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  return proxyToReaderApi(req, path)
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const { path } = await ctx.params
  return proxyToReaderApi(req, path)
}