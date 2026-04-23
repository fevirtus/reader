import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function disabled() {
	return NextResponse.json(
		{
			detail: "Legacy NextAuth route is disabled. Use /api/auth/login, /api/auth/session, /api/auth/logout.",
		},
		{ status: 410 },
	)
}

export async function GET() {
	return disabled()
}

export async function POST() {
	return disabled()
}
