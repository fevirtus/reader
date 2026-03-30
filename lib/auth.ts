import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const readerApiOrigin = (process.env.READER_API_ORIGIN || "http://localhost:8000").replace(/\/+$/, "")

type MobileLoginResponse = {
    accessToken: string
    user: {
        id: string
        email?: string | null
        name?: string | null
        image?: string | null
        role?: string | null
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "demo-id",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "demo-secret",
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, account }) {
            if (account?.provider === "google" && account.id_token) {
                try {
                    const response = await fetch(`${readerApiOrigin}/api/auth/mobile-login`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ googleIdToken: account.id_token }),
                    })

                    if (response.ok) {
                        const data = (await response.json()) as MobileLoginResponse
                        token.sub = data.user.id
                        ;(token as any).id = data.user.id
                        ;(token as any).role = data.user.role || "USER"
                        ;(token as any).name = data.user.name || token.name || null
                        ;(token as any).email = data.user.email || token.email || null
                        ;(token as any).picture = data.user.image || (token as any).picture || null
                        ;(token as any).accessToken = data.accessToken
                    }
                } catch (error) {
                    console.error("Failed to sync Google login with reader-api", error)
                }
            }

            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = String((token as any).id || token.sub || "")
                session.user.role = String((token as any).role || "USER")
                session.user.name = ((token as any).name ?? token.name ?? session.user.name ?? null) as string | null
                session.user.email = ((token as any).email ?? token.email ?? session.user.email ?? null) as string | null
                session.user.image = ((token as any).picture ?? (token as any).image ?? session.user.image ?? null) as string | null
                ;(session as any).accessToken = (token as any).accessToken || null
            }
            return session
        },
    },
    secret: process.env.NEXTAUTH_SECRET,
}
