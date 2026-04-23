import { requireModSessionUser } from "@/lib/server-auth"
import { EditorClient } from "./editor-client"

export default async function ModEditChapterPage({ params }: { params: Promise<{ id: string }> }) {
    await requireModSessionUser()

    const resolvedParams = await params

    return <EditorClient chapterId={resolvedParams.id} />
}
