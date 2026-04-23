import { NextRequest, NextResponse } from "next/server"
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const readerApiOrigin = (process.env.READER_API_ORIGIN || "http://localhost:8000").replace(/\/+$/, "")

export async function GET(req: NextRequest) {
  const accessToken = req.cookies.get(AUTH_COOKIE_NAME)?.value || ""
  if (!accessToken) {
    return NextResponse.json({ user: null }, { status: 200 })
  }

  try {
    const upstream = await fetch(`${readerApiOrigin}/api/auth/session`, {
      method: "GET",
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    })

    if (!upstream.ok) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    const data = await upstream.json()
    const user = data?.user || null
    return NextResponse.json({ user }, { status: 200 })
  } catch (error) {
    console.error("/api/auth/session failed", error)
    return NextResponse.json({ user: null }, { status: 200 })
  }
}
