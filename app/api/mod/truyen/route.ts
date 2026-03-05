import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

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
        // Tạo slug từ title
        const slug = data.title
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "")

        const newNovel = await prisma.novel.create({
            data: {
                title: data.title,
                slug: slug,
                authorName: data.authorName,
                description: data.description,
                uploaderId: session.user.id,
            },
        })
        return NextResponse.json(newNovel, { status: 201 })
    } catch (error) {
        return NextResponse.json({ error: "Failed to create novel" }, { status: 500 })
    }
}
