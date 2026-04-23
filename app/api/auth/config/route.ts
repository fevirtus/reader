import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const googleClientId =
    (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "").trim()

  return NextResponse.json(
    {
      googleClientId,
    },
    { status: 200 },
  )
}
