import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { EditorClient } from "./editor-client"

export default async function ModEditChapterPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "MOD" && session.user.role !== "ADMIN")) {
        redirect("/")
    }

    const resolvedParams = await params

    return <EditorClient chapterId={resolvedParams.id} />
}
