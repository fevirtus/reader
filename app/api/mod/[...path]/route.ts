import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const readerApiOrigin = (process.env.READER_API_ORIGIN || "http://localhost:8000").replace(/\/+$/, "")

async function proxyToReaderApi(req: NextRequest, path: string[]) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const accessToken = typeof (token as any)?.accessToken === "string" ? (token as any).accessToken : null

  const url = new URL(req.url)
  const query = url.search || ""
  const targetUrl = `${readerApiOrigin}/api/mod/${path.join("/")}${query}`

  const headers = new Headers(req.headers)
  headers.delete("host")
  if (accessToken) {
    headers.set("authorization", `Bearer ${accessToken}`)
  }

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