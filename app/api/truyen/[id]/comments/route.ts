import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: novelId } = await params
        const body = await req.json()
        const { content, chapterId } = body

        if (!content || typeof content !== "string") {
            return NextResponse.json({ error: "Content is required" }, { status: 400 })
        }

        const newComment = await prisma.comment.create({
            data: {
                content: content.trim(),
                userId: session.user.id,
                novelId,
                chapterId: chapterId || null
            },
            include: {
                user: true
            }
        })

        return NextResponse.json({
            id: newComment.id,
            userId: newComment.user.id,
            username: newComment.user.name || "User",
            avatarColor: newComment.user.image || "bg-primary",
            novelId: newComment.novelId,
            chapterId: newComment.chapterId,
            content: newComment.content,
            createdAt: newComment.createdAt.toISOString().split("T")[0]
        })
    } catch (error) {
        console.error("POST Comment Error", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
