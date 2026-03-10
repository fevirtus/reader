import { notFound } from "next/navigation"
import Link from "next/link"
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

export const dynamic = "force-dynamic"

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

  const chapterCommentsData = await prisma.comment.findMany({
    where: { novelId: novel.id, chapterId: { not: null } },
    include: { user: true },
    orderBy: { createdAt: "desc" }
  })

  // Format explicitly as the CommentProp type
  const chapterComments = chapterCommentsData.map(c => ({
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
        <img src={novel.coverUrl || "/default-cover.svg"} alt={novel.title} className="h-64 w-44 shrink-0 self-center rounded-xl object-cover shadow-lg md:self-start bg-muted" />

        {/* Info */}
        <div className="flex flex-1 flex-col gap-3">
          <h1 title={novel.title} className="text-2xl font-bold text-foreground text-balance md:text-3xl">{novel.title}</h1>

          <div className="flex flex-col gap-1 text-sm text-muted-foreground mt-1">
            <div className="flex items-center gap-1.5">
              <span>Tác giả:</span>
              <Link href={`/tim-kiem?q=${encodeURIComponent(novel.authorName)}`} className="text-red-500 font-medium hover:underline">
                {novel.authorName}
              </Link>
              {novel.originalAuthorName && <span>({novel.originalAuthorName})</span>}
            </div>
            {novel.originalTitle && 
              <div className="flex items-center gap-1.5">
                <span>Tên gốc:</span>
                <span>{novel.originalTitle}</span>
              </div>
            }
          </div>

          <div className="flex flex-col gap-3 mt-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Trạng thái:</span>
              <span className={`inline-block rounded-full px-4 py-1.5 text-xs font-semibold ${
                novel.status === "Hoàn thành" ? "bg-green-500/10 text-green-600 dark:text-green-400" :
                novel.status === "Tạm dừng" || novel.status === "Tạm ngưng" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                "bg-primary/10 text-primary" // Đang ra
              }`}>
                {novel.status}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              {novelGenres.map((g, i) => (
                <Link 
                  key={g.id} 
                  href={`/the-loai/${g.slug}`}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors hover:opacity-80 ${
                    i % 2 === 0 ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  }`}
                >
                  {g.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-6 mt-4 md:gap-8 overflow-hidden">
            <div className="flex flex-col items-center">
              <span className="text-xl md:text-2xl font-bold text-foreground">{novel.totalChapters}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">Chương</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl md:text-2xl font-bold text-foreground">{novel.views}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">Lượt đọc</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl md:text-2xl font-bold text-foreground">{novel.bookmarkCount}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">Cất giữ</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xl md:text-2xl font-bold text-foreground">{novel.ratingCount}</span>
              <span className="text-xs text-muted-foreground whitespace-nowrap">Đề cử</span>
            </div>
          </div>

          <div className="mt-4">
            <NovelDetailActions novelId={novel.id} novelSlug={novel.slug} firstChapterNumber={formattedChapters[0]?.number} />
          </div>
        </div>
      </div>

      {/* Description */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-foreground">Giới Thiệu</h2>
        <div className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">{novel.description}</div>
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
        <CommentSection 
          comments={comments as any} 
          chapterComments={chapterComments as any}
          novelId={novel.id} 
        />
      </section>
    </div>
  )
}
