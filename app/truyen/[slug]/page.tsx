import { notFound } from "next/navigation"
import Link from "next/link"
import { StarRating } from "@/components/star-rating"
import { ChapterList } from "@/components/chapter-list"
import { NovelDetailActions } from "./novel-detail-actions"
import { getNovelStatusBadgeClass } from "@/lib/novel-status"
import { readerApiFetch, readerApiFetchNullable } from "@/lib/server-api"

export const dynamic = "force-dynamic"

type NovelGenre = {
  id: string
  name: string
  slug: string
}

type NovelDetail = {
  id: string
  title: string
  slug: string
  originalTitle: string | null
  authorName: string
  originalAuthorName: string | null
  description: string | null
  coverUrl: string | null
  status: string
  totalChapters: number
  views: number
  rating: number
  ratingCount: number
  bookmarkCount: number
  genres: NovelGenre[]
}

type ChaptersResponse = {
  chapters: Array<{
    id: string
    number: number
    title: string
    views: number
    createdAt: string | null
    volumeNumber?: number | null
    volumeTitle?: string | null
    volumeChapterNumber?: number | null
  }>
  totalChapters: number
  totalPages: number
}

export default async function NovelDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}) {
  const { slug } = await params
  const { page } = await searchParams

  const currentPage = Math.max(1, parseInt(page || "1", 10) || 1)
  const limit = 20

  const novel = await readerApiFetchNullable<NovelDetail>(`/api/novels/${encodeURIComponent(slug)}`)

  if (!novel) {
    notFound()
  }

  let formattedChapters: any[] = []
  let totalChapters = 0
  let totalPages = 1
  let firstChapterNumber: number | undefined
  const [firstChapterData, chaptersData] = await Promise.all([
    readerApiFetch<ChaptersResponse>(`/api/truyen/${encodeURIComponent(novel.id)}/chapters?page=1&limit=1`),
    readerApiFetch<ChaptersResponse>(
      `/api/truyen/${encodeURIComponent(novel.id)}/chapters?page=${currentPage}&limit=${limit}`,
    ),
  ])

  firstChapterNumber = firstChapterData.chapters[0]?.number

  totalChapters = chaptersData.totalChapters
  totalPages = Math.max(1, chaptersData.totalPages || 1)
  formattedChapters = chaptersData.chapters.map((chapter) => ({
    id: chapter.id,
    novelId: novel.id,
    number: chapter.number,
    volumeNumber: chapter.volumeNumber ?? null,
    volumeTitle: chapter.volumeTitle ?? null,
    volumeChapterNumber: chapter.volumeChapterNumber ?? null,
    title: chapter.title,
    createdAt: chapter.createdAt ? chapter.createdAt.split("T")[0] : "",
    views: chapter.views || 0,
    content: "",
  }))

  const novelGenres = novel.genres || []

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex flex-col gap-6 md:flex-row">
        <img
          src={novel.coverUrl || "/default-cover.svg"}
          alt={novel.title}
          className="h-64 w-44 shrink-0 self-center rounded-xl bg-muted object-contain shadow-lg md:self-start"
        />

        <div className="flex flex-1 flex-col gap-3">
          <h1 title={novel.title} className="text-2xl font-bold text-foreground text-balance md:text-3xl">
            {novel.title}
          </h1>

          <div className="flex flex-col gap-1 text-sm text-muted-foreground mt-1">
            <div className="flex items-center gap-1.5">
              <span>Tác giả:</span>
              <Link
                href={`/tim-kiem?q=${encodeURIComponent(novel.authorName)}`}
                className="text-red-500 font-medium hover:underline"
              >
                {novel.authorName}
              </Link>
              {novel.originalAuthorName && <span>({novel.originalAuthorName})</span>}
            </div>
            {novel.originalTitle && (
              <div className="flex items-center gap-1.5">
                <span>Tên gốc:</span>
                <span>{novel.originalTitle}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 mt-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Trạng thái:</span>
              <span
                className={`inline-block rounded-full px-4 py-1.5 text-xs font-semibold ${getNovelStatusBadgeClass(novel.status)}`}
              >
                {novel.status}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {novelGenres.map((g, i) => (
                <Link
                  key={g.id}
                  href={`/the-loai/${g.slug}`}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors hover:opacity-80 ${
                    i % 2 === 0
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                  }`}
                >
                  {g.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-2">
            <StarRating rating={novel.rating} ratingCount={novel.ratingCount} interactive novelId={novel.id} />
          </div>

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
          </div>

          <div className="mt-4">
            <NovelDetailActions
              novelId={novel.id}
              novelSlug={novel.slug}
              firstChapterNumber={firstChapterNumber}
              totalChapters={novel.totalChapters}
            />
          </div>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-foreground">Giới Thiệu</h2>
        <div className="text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">{novel.description || ""}</div>
      </section>

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
    </div>
  )
}
