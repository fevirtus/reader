"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import type { User } from "./types"

let googleScriptPromise: Promise<void> | null = null

function ensureGoogleIdentityScript() {
  if (typeof window === "undefined") return Promise.resolve()
  if ((window as any).google?.accounts?.id) return Promise.resolve()
  if (googleScriptPromise) return googleScriptPromise

  googleScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error("Failed to load Google script")), { once: true })
      return
    }

    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Google script"))
    document.head.appendChild(script)
  })

  return googleScriptPromise
}

async function requestGoogleIdToken(clientId: string): Promise<string> {
  await ensureGoogleIdentityScript()

  return new Promise((resolve, reject) => {
    const googleApi = (window as any).google?.accounts?.id
    if (!googleApi) {
      reject(new Error("Google Identity API is unavailable"))
      return
    }

    let settled = false

    googleApi.initialize({
      client_id: clientId,
      callback: (response: { credential?: string }) => {
        if (settled) return
        settled = true
        const credential = (response?.credential || "").trim()
        if (!credential) {
          reject(new Error("Google did not return ID token"))
          return
        }
        resolve(credential)
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    })

    googleApi.prompt((notification: any) => {
      if (settled) return

      if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
        settled = true
        reject(new Error("Google sign-in prompt was closed or not displayed"))
      }
    })
  })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

// Giữ nguyên custom hook `useAuth` để tương thích ngược với UI components hiện tại
export function useAuth() {
  const [sessionUser, setSessionUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchSession = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch("/api/auth/session", { cache: "no-store" })
      if (!res.ok) {
        setSessionUser(null)
        return
      }

      const data = await res.json()
      setSessionUser(data?.user || null)
    } catch {
      setSessionUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSession()
  }, [fetchSession])

  const user: User | null = useMemo(() => {
    if (!sessionUser) return null
    return {
      id: (sessionUser as any).id || "",
      username: (sessionUser as any).name || "Người dùng",
      email: (sessionUser as any).email || "",
      avatarUrl: (sessionUser as any).image || "",
      avatarColor: "bg-blue-500", // Mặc định
      role: (sessionUser as any).role || "USER",
      createdAt: new Date().toISOString().split("T")[0],
    }
  }, [sessionUser])

  const loginWithGoogle = async () => {
    const clientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").trim()
    if (!clientId) {
      throw new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not configured")
    }

    const googleIdToken = await requestGoogleIdToken(clientId)

    const result = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ googleIdToken }),
    })

    if (!result.ok) {
      const errorText = await result.text()
      throw new Error(errorText || "Đăng nhập thất bại")
    }

    const payload = await result.json()
    setSessionUser(payload?.user || null)

    return payload
  }

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } finally {
      setSessionUser(null)
    }
  }

  return { user, isLoading, loginWithGoogle, logout }
}

