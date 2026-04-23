import { requireModSessionUser } from "@/lib/server-auth"
import { NovelClient } from "./novel-client"

export default async function ModTruyenPage() {
    await requireModSessionUser()

    return <NovelClient />
}
