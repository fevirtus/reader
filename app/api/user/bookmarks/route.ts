import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Lấy danh sách bookmark
export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const bookmarks = await prisma.bookmark.findMany({
            where: { userId: session.user.id },
            include: { novel: true },
            orderBy: { createdAt: "desc" }
        })

        return NextResponse.json(bookmarks)
    } catch (error) {
        console.error("GET Bookmarks Error", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

// Thêm, cập nhật hoặc xóa bookmark
export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { action, novelId, lastChapterId, lastChapterNumber } = body

        if (!novelId || !action) {
            return NextResponse.json({ error: "Bad Request" }, { status: 400 })
        }

        if (action === "toggle") {
            const existing = await prisma.bookmark.findUnique({
                where: {
                    userId_novelId: {
                        userId: session.user.id,
                        novelId,
                    }
                }
            })

            if (existing) {
                // Xoá
                await prisma.$transaction([
                    prisma.bookmark.delete({ where: { id: existing.id } }),
                    prisma.novel.update({ where: { id: novelId }, data: { bookmarkCount: { decrement: 1 } } })
                ])
                return NextResponse.json({ status: "removed" })
            } else {
                // Thêm mới
                const newBookmark = await prisma.$transaction(async (tx) => {
                    const b = await tx.bookmark.create({
                        data: {
                            userId: session.user.id,
                            novelId,
                            lastChapterId,
                            lastChapterNumber
                        }
                    })
                    await tx.novel.update({ where: { id: novelId }, data: { bookmarkCount: { increment: 1 } } })
                    return b
                })
                return NextResponse.json({ status: "added", bookmark: newBookmark })
            }
        } else if (action === "updateProgress") {
            // Cập nhật tiến độ lưu trang
            if (!lastChapterId || !lastChapterNumber) {
                return NextResponse.json({ error: "Missing chapter info" }, { status: 400 })
            }

            const bookmark = await prisma.bookmark.upsert({
                where: {
                    userId_novelId: {
                        userId: session.user.id,
                        novelId,
                    }
                },
                update: {
                    lastChapterId,
                    lastChapterNumber
                },
                create: {
                    userId: session.user.id,
                    novelId,
                    lastChapterId,
                    lastChapterNumber
                }
            })
            return NextResponse.json({ status: "updated", bookmark })
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 })

    } catch (error) {
        console.error("POST Bookmarks Error", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
