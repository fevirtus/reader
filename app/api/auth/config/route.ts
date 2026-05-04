import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const candidates = [
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.WEB_GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_ID,
  ]
  const raw = String(candidates.find((value) => String(value || "").trim()) || "").trim()
  const googleClientId = raw.includes(",") ? raw.split(",").map((part) => part.trim()).find(Boolean) || "" : raw

  return NextResponse.json(
    {
      googleClientId,
    },
    { status: 200 },
  )
}
