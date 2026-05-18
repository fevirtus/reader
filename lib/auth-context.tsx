"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { User } from "./types"

// ─── Google Identity Services helpers ───────────────────────────────────────

let googleScriptPromise: Promise<void> | null = null
let googleInitializedClientId = ""
let pendingCredentialResolver: ((token: string) => void) | null = null
let pendingCredentialRejecter: ((err: Error) => void) | null = null

function waitForDocumentReady(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  if (document.readyState !== "loading") return Promise.resolve()
  return new Promise<void>((resolve) => {
    document.addEventListener("DOMContentLoaded", () => resolve(), { once: true })
  })
}

async function ensureGoogleIdentityScript(): Promise<void> {
  if (typeof window === "undefined") return
  if ((window as any).google?.accounts?.id) return
  if (googleScriptPromise) return googleScriptPromise

  await waitForDocumentReady()

  googleScriptPromise = new Promise((resolve, reject) => {
    // Script may already exist (e.g. injected by extension)
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (existing) {
      if ((window as any).google?.accounts?.id) {
        resolve()
        return
      }
      existing.addEventListener("load", () => resolve(), { once: true })
      existing.addEventListener("error", () => reject(new Error("Failed to load Google script")), {
        once: true,
      })
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

async function initializeGoogleIdentity(clientId: string): Promise<void> {
  await ensureGoogleIdentityScript()

  const googleApi = (window as any).google?.accounts?.id
  if (!googleApi) throw new Error("Google Identity API is unavailable")

  if (googleInitializedClientId === clientId) return

  const hostname = typeof window !== "undefined" ? window.location.hostname : ""
  const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1"

  // Re-initialize with new clientId (or first time)
  googleApi.initialize({
    client_id: clientId,
    callback: (response: { credential?: string }) => {
      const credential = (response?.credential || "").trim()
      const resolver = pendingCredentialResolver
      const rejecter = pendingCredentialRejecter
      pendingCredentialResolver = null
      pendingCredentialRejecter = null

      if (!credential) {
        rejecter?.(new Error("Google sign-in did not return a credential"))
        return
      }
      resolver?.(credential)
    },
    auto_select: false,
    cancel_on_tap_outside: true,
    // FedCM on localhost often yields tokens backend cannot verify; production keeps FedCM.
    use_fedcm_for_prompt: !isLocalHost,
  })

  googleInitializedClientId = clientId
}

async function requestGoogleIdToken(clientId: string): Promise<string> {
  await initializeGoogleIdentity(clientId)

  return new Promise<string>((resolve, reject) => {
    const googleApi = (window as any).google?.accounts?.id
    if (!googleApi) {
      reject(new Error("Google Identity API is unavailable"))
      return
    }

    // Reject any previous in-flight request
    pendingCredentialRejecter?.(new Error("A new sign-in request was started"))
    pendingCredentialResolver = null
    pendingCredentialRejecter = null

    const timeoutId = window.setTimeout(() => {
      pendingCredentialResolver = null
      pendingCredentialRejecter = null
      reject(new Error("Google sign-in timed out. Please try again."))
    }, 15000)

    pendingCredentialResolver = (token: string) => {
      window.clearTimeout(timeoutId)
      resolve(token)
    }
    pendingCredentialRejecter = (err: Error) => {
      window.clearTimeout(timeoutId)
      reject(err)
    }

    googleApi.prompt()
  })
}

// ─── Auth Context ────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  loginWithGoogle: () => Promise<unknown>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessionUser, setSessionUser] = useState<Record<string, unknown> | null>(null)
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
      setSessionUser((data?.user as Record<string, unknown>) || null)
    } catch {
      setSessionUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchSession()
  }, [fetchSession])

  useEffect(() => {
    let active = true
    const fetchAuthConfig = async () => {
      try {
        const res = await fetch("/api/auth/config", { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        if (active) setGoogleClientId(String(data?.googleClientId || "").trim())
      } catch {
        if (active) setGoogleClientId("")
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
      id: String(sessionUser.id || ""),
      username: String(sessionUser.name || "Người dùng"),
      email: String(sessionUser.email || ""),
      avatarUrl: String(sessionUser.image || ""),
      avatarColor: "bg-blue-500",
      role: (sessionUser.role as "USER" | "MOD" | "ADMIN") || "USER",
      createdAt: new Date().toISOString().split("T")[0],
    }
  }, [sessionUser])

  const loginWithGoogle = useCallback(async () => {
    const clientId = googleClientId.trim()
    if (!clientId) throw new Error("Google client id is not configured on server runtime")

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
    setSessionUser((payload?.user as Record<string, unknown>) || null)
    return payload
  }, [googleClientId])

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } finally {
      setSessionUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, isLoading, loginWithGoogle, logout }),
    [user, isLoading, loginWithGoogle, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

