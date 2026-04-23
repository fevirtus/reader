"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import type { User } from "./types"

let googleScriptPromise: Promise<void> | null = null
let googleInitializedClientId = ""
let pendingCredentialResolver: ((token: string) => void) | null = null

function waitForDocumentReady() {
  if (typeof window === "undefined") return Promise.resolve()
  if (document.readyState !== "loading") return Promise.resolve()

  return new Promise<void>((resolve) => {
    document.addEventListener("DOMContentLoaded", () => resolve(), { once: true })
  })
}

async function ensureGoogleIdentityScript() {
  if (typeof window === "undefined") return Promise.resolve()
  if ((window as any).google?.accounts?.id) return Promise.resolve()
  if (googleScriptPromise) return googleScriptPromise

  await waitForDocumentReady()

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

async function initializeGoogleIdentity(clientId: string) {
  await ensureGoogleIdentityScript()

  const googleApi = (window as any).google?.accounts?.id
  if (!googleApi) {
    throw new Error("Google Identity API is unavailable")
  }

  // Avoid repeated initialize() calls that cause unstable GSI behavior.
  if (googleInitializedClientId === clientId) {
    return
  }

  googleApi.initialize({
    client_id: clientId,
    callback: (response: { credential?: string }) => {
      const credential = (response?.credential || "").trim()
      if (!credential || !pendingCredentialResolver) {
        return
      }

      const resolver = pendingCredentialResolver
      pendingCredentialResolver = null
      resolver(credential)
    },
    auto_select: false,
    cancel_on_tap_outside: true,
    use_fedcm_for_prompt: true,
  })

  googleInitializedClientId = clientId
}

async function requestGoogleIdToken(clientId: string): Promise<string> {
  await initializeGoogleIdentity(clientId)

  return new Promise((resolve, reject) => {
    const googleApi = (window as any).google?.accounts?.id
    if (!googleApi) {
      reject(new Error("Google Identity API is unavailable"))
      return
    }

    pendingCredentialResolver = resolve
    const timeoutId = window.setTimeout(() => {
      if (!pendingCredentialResolver) {
        return
      }
      pendingCredentialResolver = null
      reject(new Error("Google sign-in timed out. Please try again."))
    }, 15000)

    const originalResolver = pendingCredentialResolver
    pendingCredentialResolver = (token: string) => {
      window.clearTimeout(timeoutId)
      if (!originalResolver) {
        reject(new Error("Google sign-in did not complete"))
        return
      }
      resolve(token)
    }

    googleApi.prompt()
  })
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>
}

// Giữ nguyên custom hook `useAuth` để tương thích ngược với UI components hiện tại
export function useAuth() {
  const [sessionUser, setSessionUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [googleClientId, setGoogleClientId] = useState("")

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

  useEffect(() => {
    let active = true

    const fetchAuthConfig = async () => {
      try {
        const res = await fetch("/api/auth/config", { cache: "no-store" })
        if (!res.ok) {
          return
        }

        const data = await res.json()
        if (active) {
          setGoogleClientId(String(data?.googleClientId || "").trim())
        }
      } catch {
        if (active) {
          setGoogleClientId("")
        }
      }
    }

    void fetchAuthConfig()

    return () => {
      active = false
    }
  }, [])

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
    const clientId = googleClientId.trim()
    if (!clientId) {
      throw new Error("Google client id is not configured on server runtime")
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

