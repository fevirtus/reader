import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import connectToMongoDB from "@/lib/mongoose"
import { Chapter } from "@/lib/models/chapter"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const novelId = searchParams.get("novelId")

    if (!novelId) {
        return NextResponse.json({ error: "novelId is required" }, { status: 400 })
    }

    try {
        await connectToMongoDB()
        const chapters = await Chapter.find({ novelId }).sort({ number: 1 }).select("-content")
        return NextResponse.json(chapters)
    } catch (error) {
        console.error("GET Chapter Error:", error)
        return NextResponse.json({ error: "Failed to fetch chapters" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "MOD" && session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const data = await req.json()
        const { novelId, number, title, content } = data

        // Xác minh truyện thuộc về Mod này
        const novel = await prisma.novel.findFirst({
            where: { id: novelId, uploaderId: session.user.id },
        })

        if (!novel) {
            return NextResponse.json({ error: "Truyện không tồn tại hoặc không đủ quyền" }, { status: 403 })
        }

        await connectToMongoDB()

        // Kiểm tra chương đã tồn tại
        const existingChapter = await Chapter.findOne({ novelId, number })
        if (existingChapter) {
            return NextResponse.json({ error: "Chương này đã tồn tại" }, { status: 400 })
        }

        const newChapter = await Chapter.create({
            novelId,
            number,
            title,
            content,
        })

        // Cập nhật số chương trong table PostgreSQL, tự động đếm lại
        const totalChapters = await Chapter.countDocuments({ novelId })
        await prisma.novel.update({
            where: { id: novelId },
            data: { totalChapters },
        })

        return NextResponse.json(newChapter, { status: 201 })
    } catch (error) {
        console.error("POST Chapter Error:", error)
        return NextResponse.json({ error: "Failed to create chapter" }, { status: 500 })
    }
}
