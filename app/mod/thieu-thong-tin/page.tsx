import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { MissingFieldsClient } from "./missing-fields-client"

export default async function ModMissingFieldsPage() {
    const session = await getServerSession(authOptions)

    if (!session || (session.user.role !== "MOD" && session.user.role !== "ADMIN")) {
        redirect("/")
    }

    return <MissingFieldsClient />
}
