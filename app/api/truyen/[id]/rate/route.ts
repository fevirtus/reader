import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await req.json()
        const { score } = body

        if (typeof score !== 'number' || score < 1 || score > 5) {
            return NextResponse.json({ error: "Invalid score" }, { status: 400 })
        }

        // Fetch current rating
        const novel = await prisma.novel.findUnique({
            where: { id },
            select: { rating: true, ratingCount: true }
        })

        if (!novel) {
            return NextResponse.json({ error: "Novel not found" }, { status: 404 })
        }

        const { rating, ratingCount } = novel
        const newRatingCount = ratingCount + 1
        const newRating = ((rating * ratingCount) + score) / newRatingCount

        const updatedNovel = await prisma.novel.update({
            where: { id },
            data: {
                rating: newRating,
                ratingCount: newRatingCount
            }
        })

        return NextResponse.json({
            rating: updatedNovel.rating,
            ratingCount: updatedNovel.ratingCount
        })
    } catch (error) {
        console.error("Rating Error", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
