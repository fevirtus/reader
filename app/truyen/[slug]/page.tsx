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
import { getNovelStatusBadgeClass } from "@/lib/novel-status"

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

  let formattedChapters: any[] = []
  let totalChapters = 0
  let totalPages = 1
  let firstChapterNumber: number | undefined
  let seriesVolumes: Array<{
    id: string
    slug: string
    title: string
    status: string
    totalChapters: number
    coverUrl: string | null
    updatedAt: Date
  }> = []

  await connectToMongoDB()

  if (novel.seriesId) {
    const [firstChapter, volumes] = await Promise.all([
      Chapter.findOne({ novelId: novel.id }).sort({ number: 1 }).select("number").lean(),
      prisma.novel.findMany({
        where: { seriesId: novel.seriesId },
        select: {
          id: true,
          slug: true,
          title: true,
          status: true,
          totalChapters: true,
          coverUrl: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "asc" },
      }),
    ])

    firstChapterNumber = (firstChapter as any)?.number
    seriesVolumes = volumes
  } else {
    const skip = (currentPage - 1) * limit
    const [chapters, chaptersCount, firstChapter] = await Promise.all([
      Chapter.find({ novelId: novel.id })
        .sort({ number: 1 })
        .skip(skip)
        .limit(limit)
        .select("id novelId number title createdAt views volumeNumber volumeTitle volumeChapterNumber")
        .lean(),
      Chapter.countDocuments({ novelId: novel.id }),
      Chapter.findOne({ novelId: novel.id }).sort({ number: 1 }).select("number").lean(),
    ])

    totalChapters = chaptersCount
    totalPages = Math.ceil(totalChapters / limit)
    firstChapterNumber = (firstChapter as any)?.number

    formattedChapters = chapters.map(c => ({
      id: c._id.toString(),
      novelId: c.novelId,
      number: c.number,
      volumeNumber: (c as any).volumeNumber ?? null,
      volumeTitle: (c as any).volumeTitle ?? null,
      volumeChapterNumber: (c as any).volumeChapterNumber ?? null,
      title: c.title,
      createdAt: c.createdAt ? (c.createdAt as Date).toISOString() : new Date().toISOString(),
      views: c.views || 0,
      content: ""
    }))
  }

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
        <img src={novel.coverUrl || "/default-cover.svg"} alt={novel.title} className="h-64 w-44 shrink-0 self-center rounded-xl bg-muted object-contain shadow-lg md:self-start" />

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
              <span className={`inline-block rounded-full px-4 py-1.5 text-xs font-semibold ${getNovelStatusBadgeClass(novel.status)}`}>
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
            <NovelDetailActions novelId={novel.id} novelSlug={novel.slug} firstChapterNumber={firstChapterNumber} />
          </div>
        </div>
      </div>

      {/* Description */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-foreground">Giới Thiệu</h2>
        <div className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">{novel.description}</div>
      </section>

      {/* Chapter list or series volumes */}
      {novel.seriesId ? (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-foreground">Danh Sách Quyển</h2>
          <div className="rounded-lg border border-border bg-card divide-y divide-border">
            {seriesVolumes.map((volume, idx) => (
              <Link
                key={volume.id}
                href={`/truyen/${volume.slug}`}
                className={`flex items-center gap-4 px-4 py-3 hover:bg-muted/40 transition-colors ${volume.id === novel.id ? "bg-primary/5" : ""}`}
              >
                <span className="w-8 text-center text-sm font-semibold text-muted-foreground">{idx + 1}</span>
                <img
                  src={volume.coverUrl || "/default-cover.svg"}
                  alt={volume.title}
                  className="h-14 w-10 rounded bg-muted object-contain"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{volume.title}</p>
                  <p className="text-xs text-muted-foreground">{volume.totalChapters} chương</p>
                </div>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${getNovelStatusBadgeClass(volume.status)}`}>
                  {volume.status}
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : (
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
      )}

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
