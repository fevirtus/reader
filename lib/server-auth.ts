import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie"

const readerApiOrigin = (process.env.READER_API_ORIGIN || "http://localhost:8000").replace(/\/+$/, "")

export type ApiSessionUser = {
  id: string
  email?: string | null
  name?: string | null
  image?: string | null
  role?: string | null
}

export async function getApiSessionUser(): Promise<ApiSessionUser | null> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(AUTH_COOKIE_NAME)?.value || ""

  if (!accessToken) {
    return null
  }

  try {
    const response = await fetch(`${readerApiOrigin}/api/auth/session`, {
      method: "GET",
      headers: { authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return (data?.user || null) as ApiSessionUser | null
  } catch {
    return null
  }
}

export async function requireModSessionUser(): Promise<ApiSessionUser> {
  const user = await getApiSessionUser()
  if (!user || (user.role !== "MOD" && user.role !== "ADMIN")) {
    redirect("/")
  }

  return user
}
