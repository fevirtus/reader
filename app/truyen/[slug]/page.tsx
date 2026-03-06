import { notFound } from "next/navigation"
import { BookOpen, Eye, BookMarked, User, Clock, Layers } from "lucide-react"
import { formatViews } from "@/lib/utils"
import { GenreBadge } from "@/components/genre-badge"
import { StarRating } from "@/components/star-rating"
import { ChapterList } from "@/components/chapter-list"
import { CommentSection } from "@/components/comment-section"
import { NovelDetailActions } from "./novel-detail-actions"
import { prisma } from "@/lib/prisma"
import connectToMongoDB from "@/lib/mongoose"
import { Chapter } from "@/lib/models/chapter"

export default async function NovelDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>,
  searchParams: Promise<{ page?: string }>
}) {
  const { slug } = await params
  const { page } = await searchParams

  const currentPage = parseInt(page || "1")
  const limit = 20

  const novel = await prisma.novel.findUnique({
    where: { slug },
    include: {
      genres: {
        include: { genre: true }
      }
    }
  })

  if (!novel) {
    notFound()
  }

  // Increment view quietly
  prisma.novel.update({
    where: { id: novel.id },
    data: { views: { increment: 1 } }
  }).catch(e => console.error("Error incrementing view:", e))

  // Fetch chapters from MongoDB
  await connectToMongoDB()
  const skip = (currentPage - 1) * limit

  const [chapters, totalChapters] = await Promise.all([
    Chapter.find({ novelId: novel.id })
      .sort({ number: 1 })
      .skip(skip)
      .limit(limit)
      .select("id novelId number title createdAt views")
      .lean(),
    Chapter.countDocuments({ novelId: novel.id })
  ])

  const totalPages = Math.ceil(totalChapters / limit)

  // Convert Mongoose documents to plain objects for Server Component
  const formattedChapters = chapters.map(c => ({
    id: c._id.toString(),
    novelId: c.novelId,
    number: c.number,
    title: c.title,
    createdAt: (c.createdAt as Date).toISOString(),
    views: c.views || 0,
    content: "" // We don't fetch content for the list
  }))

  const commentsData = await prisma.comment.findMany({
    where: { novelId: novel.id, chapterId: null },
    include: { user: true },
    orderBy: { createdAt: "desc" }
  })

  // Format explicitly as the CommentProp type
  const comments = commentsData.map(c => ({
    id: c.id,
    userId: c.user.id,
    username: c.user.name || "User",
    avatarColor: c.user.image || "bg-primary",
    novelId: c.novelId,
    content: c.content,
    createdAt: c.createdAt.toISOString().split("T")[0]
  }))

  const novelGenres = novel.genres.map(ng => ng.genre) || []

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Novel Header */}
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Cover */}
        <div className={`flex h-64 w-44 shrink-0 items-center justify-center self-center rounded-xl bg-gradient-to-br shadow-lg md:self-start ${novel.coverColor || "from-slate-700 to-slate-800"}`}>
          <BookOpen className="h-14 w-14 text-background/80" />
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col gap-3">
          <h1 className="text-2xl font-bold text-foreground text-balance md:text-3xl">{novel.title}</h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{novel.authorName}</span>
            <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" />{novel.totalChapters} chương</span>
            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{formatViews(novel.views)} lượt xem</span>
            <span className="flex items-center gap-1"><BookMarked className="h-3.5 w-3.5" />{formatViews(novel.bookmarkCount)} bookmark</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Cập nhật: {novel.updatedAt.toLocaleDateString('vi-VN')}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${novel.status === "Hoàn thành" ? "bg-green-500/10 text-green-600 dark:text-green-400" :
              novel.status === "Đang ra" ? "bg-primary/10 text-primary" :
                "bg-muted text-muted-foreground"
              }`}>
              {novel.status}
            </span>
          </div>

          <StarRating rating={novel.rating} ratingCount={novel.ratingCount} novelId={novel.id} interactive />

          <div className="flex flex-wrap gap-1.5">
            {novelGenres.map((g) => (
              <GenreBadge key={g.id} slug={g.slug} name={g.name} variant="link" />
            ))}
          </div>

          <NovelDetailActions novelId={novel.id} novelSlug={novel.slug} firstChapterNumber={formattedChapters[0]?.number} />
        </div>
      </div>

      {/* Description */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-foreground">Giới Thiệu</h2>
        <p className="text-sm leading-relaxed text-foreground/80">{novel.description}</p>
      </section>

      {/* Chapter list */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-foreground">Danh Sách Chương</h2>
        <div className="rounded-lg border border-border bg-card">
          <ChapterList
            chapters={formattedChapters as any}
            novelSlug={novel.slug}
            currentPage={currentPage}
            totalPages={totalPages}
            totalChapters={totalChapters}
          />
        </div>
      </section>

      {/* Comments */}
      <section className="mt-8">
        <CommentSection comments={comments as any} novelId={novel.id} />
      </section>
    </div>
  )
}
