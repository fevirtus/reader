import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import connectToMongoDB from "@/lib/mongoose"
import { Chapter } from "@/lib/models/chapter"
import path from "path"
import os from "os"
import { promises as fs } from "fs"
import { convert } from "html-to-text"

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "MOD" && session.user.role !== "ADMIN")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const formData = await req.formData()
        const epubFile = formData.get("file") as File
        if (!epubFile) {
            return NextResponse.json({ error: "Thiếu file EPUB" }, { status: 400 })
        }

        const buffer = Buffer.from(await epubFile.arrayBuffer())
        const tempFilePath = path.join(os.tmpdir(), `upload-${Date.now()}.epub`)
        await fs.writeFile(tempFilePath, buffer)

        // Phân tích EPUB file
        const parsedData = await new Promise<any>((resolve, reject) => {
            const EPub = require("epub2").EPub || require("epub2")
            const epub = new EPub(tempFilePath, "", "")

            epub.on("error", (err: any) => reject(err))
            epub.on("end", async () => {
                const metadata = epub.metadata
                const flow = epub.flow // TOC array
                const chapters = []

                for (let i = 0; i < flow.length; i++) {
                    const chapterData = flow[i]
                    const text = await new Promise<string>((res) => {
                        epub.getChapter(chapterData.id, (err: any, d: string) => {
                            if (err) res("")
                            else res(d)
                        })
                    })

                    if (text && text.trim().length > 0) {
                        const plainText = convert(text, { wordwrap: false })
                        chapters.push({
                            title: chapterData.title || `Chương ${i + 1}`,
                            content: plainText
                        })
                    }
                }

                resolve({ metadata, chapters })
            })

            epub.parse()
        })

        // Xóa file tạm
        await fs.unlink(tempFilePath).catch(() => { })

        const { metadata, chapters } = parsedData

        let novelTitle = metadata.title || "Truyện chưa đặt tên"
        let novelAuthor = metadata.creator || "Khuyết danh"
        let novelDesc = metadata.description || "Chưa có giới thiệu"

        // Generate base slug
        const baseSlug = novelTitle
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "")

        let slug = baseSlug
        let slugCounter = 1

        // Đảm bảo slug là duy nhất
        while (await prisma.novel.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${slugCounter}`
            slugCounter++
        }

        const newNovel = await prisma.novel.create({
            data: {
                title: novelTitle,
                slug: slug,
                authorName: novelAuthor,
                description: convert(novelDesc, { wordwrap: false }), // metadata metadata có thể chứa html
                uploaderId: session.user.id,
                totalChapters: chapters.length,
            },
        })

        // Lưu chapters xuống MongoDB
        await connectToMongoDB()
        const chapterDocs = chapters.map((ch: any, i: number) => ({
            novelId: newNovel.id,
            number: i + 1,
            title: ch.title,
            content: ch.content,
            views: 0
        }))

        if (chapterDocs.length > 0) {
            await Chapter.insertMany(chapterDocs)
        }

        return NextResponse.json(newNovel, { status: 201 })
    } catch (error: any) {
        console.error("EPUB upload error:", error)
        return NextResponse.json({ error: "Lỗi xử lý file EPUB", details: error.message }, { status: 500 })
    }
}
