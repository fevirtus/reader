import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/utils"

export async function GET() {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "MOD" && session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const novels = await prisma.novel.findMany({
            where: { uploaderId: session.user.id },
            orderBy: { updatedAt: "desc" },
        })
        return NextResponse.json(novels)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch novels" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "MOD" && session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const data = await req.json()
        const { title, originalTitle, authorName, originalAuthorName, description, coverUrl, genreIds = [] } = data
        // Tạo slug từ title
        const slug = slugify(title)

        const newNovel = await prisma.novel.create({
            data: {
                title,
                originalTitle,
                slug: slug,
                authorName,
                originalAuthorName,
                description,
                coverUrl,
                uploaderId: session.user.id,
                genres: {
                    create: genreIds.map((id: string) => ({
                        genre: { connect: { id } }
                    }))
                }
            },
        })
        return NextResponse.json(newNovel, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: "Failed to create novel" }, { status: 500 })
    }
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "MOD" && session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const data = await req.json()
        const { id, title, originalTitle, authorName, originalAuthorName, description, coverUrl, status, genreIds } = data

        // Update basic info and recreate genre relations
        const updatedNovel = await prisma.novel.update({
            where: { id: id, uploaderId: session.user.id }, // Make sure they own it
            data: {
                title,
                originalTitle,
                authorName,
                originalAuthorName,
                description,
                coverUrl,
                status,
                // Replace all existing genres if genreIds is provided
                ...(genreIds !== undefined && {
                    genres: {
                        deleteMany: {},
                        create: genreIds.map((gId: string) => ({
                            genre: { connect: { id: gId } }
                        }))
                    }
                })
            },
        })
        return NextResponse.json(updatedNovel)
    } catch (error) {
        return NextResponse.json({ error: "Failed to update novel" }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "MOD" && session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const url = new URL(req.url)
        const id = url.searchParams.get("id")

        if (!id) return NextResponse.json({ error: "Thiếu ID truyện" }, { status: 400 })

        // Xóa truyện. (Chapters trong MongoDB nên được xóa bằng một cron job hoặc API khác để tránh block UI quá lâu, 
        // ở đây chúng ta chỉ xóa record của Postgres để ẩn truyện).
        await prisma.novel.delete({
            where: { id: id, uploaderId: session.user.id },
        })

        return NextResponse.json({ message: "Đã xóa truyện thành công" })
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete novel" }, { status: 500 })
    }
}
