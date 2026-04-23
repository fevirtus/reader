import { requireModSessionUser } from "@/lib/server-auth"
import { ChapterClient } from "./chapter-client"

export default async function ModChuongPage() {
    await requireModSessionUser()

    return <ChapterClient />
}
