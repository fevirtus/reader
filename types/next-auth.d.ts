import NextAuth from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            name?: string | null
            email?: string | null
            image?: string | null
            role: string
        }
        accessToken?: string | null
    }

    interface User {
        role: string
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id?: string
        role?: string
        accessToken?: string | null
        picture?: string | null
    }
}
