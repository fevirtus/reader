import { NextRequest, NextResponse } from "next/server"
import { AUTH_COOKIE_MAX_AGE_SECONDS, AUTH_COOKIE_NAME } from "@/lib/auth-cookie"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const readerApiOrigin = (process.env.READER_API_ORIGIN || "http://localhost:8000").replace(/\/+$/, "")

type MobileLoginResponse = {
  accessToken: string
  expiresIn?: number
  user: {
    id: string
    email?: string | null
    name?: string | null
    image?: string | null
    role?: string | null
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const googleIdToken = String(body?.googleIdToken || "").trim()

    if (!googleIdToken) {
      return NextResponse.json({ detail: "googleIdToken is required" }, { status: 400 })
    }

    const upstream = await fetch(`${readerApiOrigin}/api/auth/mobile-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ googleIdToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    })

    if (!upstream.ok) {
      const raw = await upstream.text()
      let detail = "Authentication failed"
      try {
        const parsed = JSON.parse(raw) as { detail?: unknown }
        if (typeof parsed.detail === "string") {
          detail = parsed.detail
        } else if (raw.trim()) {
          detail = raw.trim()
        }
      } catch {
        if (raw.trim()) detail = raw.trim()
      }
      return NextResponse.json({ detail }, { status: upstream.status })
    }

    const data = (await upstream.json()) as MobileLoginResponse

    const response = NextResponse.json(
      {
        user: {
          id: data.user.id,
          email: data.user.email || null,
          name: data.user.name || null,
          image: data.user.image || null,
          role: data.user.role || "USER",
        },
      },
      { status: 200 },
    )

    response.cookies.set(AUTH_COOKIE_NAME, data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: data.expiresIn || AUTH_COOKIE_MAX_AGE_SECONDS,
    })

    return response
  } catch (error) {
    console.error("/api/auth/login failed", error)
    const cause = error instanceof Error ? error.cause : null
    const code =
      cause && typeof cause === "object" && "code" in cause
        ? String((cause as { code?: unknown }).code || "")
        : ""
    if (code === "ECONNREFUSED" || (error instanceof Error && error.message.includes("fetch failed"))) {
      return NextResponse.json(
        {
          detail: `Không kết nối được reader-api tại ${readerApiOrigin}. Kiểm tra READER_API_ORIGIN và đảm bảo API đang chạy (ví dụ cổng 18080).`,
        },
        { status: 503 },
      )
    }
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 })
  }
}
