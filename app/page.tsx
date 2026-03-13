import Link from "next/link"
import { ArrowRight, Clock3, Flame, MessageSquare, Shuffle, Star, Trophy } from "lucide-react"
import { formatViews } from "@/lib/utils"
import connectToMongoDB from "@/lib/mongoose"
import { Chapter } from "@/lib/models/chapter"
import { HomeHotCarousel, type HotCarouselItem } from "@/components/home-hot-carousel"

import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

type HomeNovel = {
  id: string
  slug: string
  title: string
  authorName: string
  coverColor: string | null
  coverUrl: string | null
  rating: number
  views: number
  totalChapters: number
  status: string
  description: string
  bookmarkCount: number
  seriesId: string | null
  updatedAt: Date
}

type RankingEntry = {
  id: string
  seriesId: string | null
  novel: HomeNovel
  aggregatedViews: number
}

type RecentCommentItem = {
  id: string
  content: string
  createdAt: Date
  user: {
    name: string | null
  }
  novel: {
    slug: string
    title: string
  }
}

type LatestChapterInfo = {
  chapterNumber: number | null
  chapterTitle: string | null
  chapterCreatedAt: Date | null
}

const BASE_NOVEL_SELECT = {
  id: true,
  slug: true,
  title: true,
  authorName: true,
  coverColor: true,
  coverUrl: true,
  rating: true,
  views: true,
  totalChapters: true,
  status: true,
  description: true,
  bookmarkCount: true,
  seriesId: true,
  updatedAt: true,
} as const

function toUTCDateOnly(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
}

function shuffleRows<T>(rows: T[]): T[] {
  const next = [...rows]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = next[i]
    next[i] = next[j]
    next[j] = tmp
  }
  return next
}

function fillUniqueRows<T extends { id: string }>(primary: T[], fallback: T[], target: number): T[] {
  const picked = new Set<string>()
  const output: T[] = []

  for (const row of primary) {
    if (picked.has(row.id)) continue
    picked.add(row.id)
    output.push(row)
    if (output.length >= target) return output
  }

  for (const row of fallback) {
    if (picked.has(row.id)) continue
    picked.add(row.id)
    output.push(row)
    if (output.length >= target) return output
  }

  return output
}

function formatRelativeTime(value: Date | null | undefined): string {
  if (!value) return "Vừa cập nhật"

  const now = Date.now()
  const ts = value.getTime()
  const diff = Math.max(0, now - ts)
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return "Vừa xong"
  if (diff < hour) return `${Math.floor(diff / minute)} phút trước`
  if (diff < day) return `${Math.floor(diff / hour)} giờ trước`
  if (diff < day * 30) return `${Math.floor(diff / day)} ngày trước`

  return value.toLocaleDateString("vi-VN")
}

function compactLine(text: string, max = 140): string {
  const normalized = text.replace(/\s+/g, " ").trim()
  if (normalized.length <= max) return normalized
  return `${normalized.slice(0, max).trim()}...`
}

function collapseSeriesRows<T extends { id: string; seriesId?: string | null }>(rows: T[]): T[] {
  const pickedSeries = new Set<string>()
  const output: T[] = []

  for (const row of rows) {
    if (!row.seriesId) {
      output.push(row)
      continue
    }

    if (pickedSeries.has(row.seriesId)) continue
    pickedSeries.add(row.seriesId)
    output.push(row)
  }

  return output
}

async function fetchRankingByDailyViews(options?: { since?: Date; take?: number }): Promise<RankingEntry[]> {
  const delegate = (prisma as any).novelViewDaily
  if (!delegate || typeof delegate.groupBy !== "function") {
    return []
  }

  let grouped: Array<{ novelId: string; _sum: { views: number | null } }> = []
  try {
    grouped = await delegate.groupBy({
      by: ["novelId"],
      where: options?.since ? { day: { gte: toUTCDateOnly(options.since) } } : undefined,
      _sum: { views: true },
      orderBy: { _sum: { views: "desc" } },
      take: options?.take || 300,
    })
  } catch (error) {
    console.warn("novelViewDaily aggregate unavailable, fallback to Novel.views", error)
    return []
  }

  if (grouped.length === 0) return []

  const ids = grouped.map((row) => row.novelId)
  const novels = await prisma.novel.findMany({
    where: { id: { in: ids } },
    select: BASE_NOVEL_SELECT,
  })

  const novelMap = new Map(novels.map((novel) => [novel.id, novel as HomeNovel]))
  const entries: RankingEntry[] = []

  for (const row of grouped) {
    const novel = novelMap.get(row.novelId)
    if (!novel) continue

    entries.push({
      id: novel.id,
      seriesId: novel.seriesId,
      novel,
      aggregatedViews: row._sum.views || 0,
    })
  }

  return entries
}

function toHotCarouselItems(rows: Array<RankingEntry & { source: HotCarouselItem["hotSource"] }>): HotCarouselItem[] {
  return rows.map((row) => ({
    id: row.novel.id,
    slug: row.novel.slug,
    title: row.novel.title,
    authorName: row.novel.authorName,
    description: row.novel.description,
    coverUrl: row.novel.coverUrl,
    totalChapters: row.novel.totalChapters,
    rating: row.novel.rating,
    views: row.aggregatedViews,
    status: row.novel.status,
    hotSource: row.source,
  }))
}

function RankingBoard({
  title,
  entries,
  emptyText,
}: {
  title: string
  entries: RankingEntry[]
  emptyText: string
}) {
  return (
    <section className="rounded-2xl border border-border/70 bg-card/70 p-4 backdrop-blur">
      <div className="mb-3 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground/90">{title}</h3>
      </div>

      <div className="space-y-2">
        {entries.length > 0 ? entries.map((entry, index) => (
          <Link
            key={entry.id}
            href={`/truyen/${entry.novel.slug}`}
            className="group flex items-center gap-3 rounded-lg border border-border/70 bg-background/70 p-2.5 transition hover:border-primary/40"
          >
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
              {index + 1}
            </span>
            <img
              src={entry.novel.coverUrl || "/default-cover.svg"}
              alt={entry.novel.title}
              className="h-12 w-9 shrink-0 rounded-md border border-border/70 object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">{entry.novel.title}</p>
              <p className="text-xs text-muted-foreground">{formatViews(entry.aggregatedViews)} lượt đọc</p>
            </div>
          </Link>
        )) : (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        )}
      </div>
    </section>
  )
}

export default async function HomePage() {
  let hotSlides: HotCarouselItem[] = []
  let randomNovels: HomeNovel[] = []
  let recommendedNovels: HomeNovel[] = []
  let latestNovels: HomeNovel[] = []
  let recentComments: RecentCommentItem[] = []
  let weeklyRanking: RankingEntry[] = []
  let monthlyRanking: RankingEntry[] = []
  let allTimeRanking: RankingEntry[] = []
  const latestChapterMap = new Map<string, LatestChapterInfo>()

  try {
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 7)
    const monthStart = new Date(now)
    monthStart.setDate(now.getDate() - 30)

    const [
      weeklyResult,
      monthlyResult,
      allTimeResult,
      popularFallbackResult,
      randomPoolResult,
      recommendedPoolResult,
      latestPoolResult,
      commentsResult,
    ] = await Promise.allSettled([
      fetchRankingByDailyViews({ since: weekStart, take: 600 }),
      fetchRankingByDailyViews({ since: monthStart, take: 600 }),
      fetchRankingByDailyViews({ take: 800 }),
      prisma.novel.findMany({
        take: 400,
        select: BASE_NOVEL_SELECT,
        orderBy: [{ views: "desc" }, { updatedAt: "desc" }],
      }),
      prisma.novel.findMany({
        take: 420,
        select: BASE_NOVEL_SELECT,
        orderBy: [{ updatedAt: "desc" }],
      }),
      prisma.novel.findMany({
        take: 220,
        select: BASE_NOVEL_SELECT,
        orderBy: [{ rating: "desc" }, { bookmarkCount: "desc" }, { views: "desc" }],
      }),
      prisma.novel.findMany({
        take: 180,
        select: BASE_NOVEL_SELECT,
        orderBy: [{ updatedAt: "desc" }],
      }),
      prisma.comment.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          content: true,
          createdAt: true,
          user: { select: { name: true } },
          novel: { select: { slug: true, title: true } },
        },
      }),
    ])

    if (weeklyResult.status === "rejected") console.warn("Homepage weekly ranking query failed", weeklyResult.reason)
    if (monthlyResult.status === "rejected") console.warn("Homepage monthly ranking query failed", monthlyResult.reason)
    if (allTimeResult.status === "rejected") console.warn("Homepage all-time ranking query failed", allTimeResult.reason)
    if (popularFallbackResult.status === "rejected") console.warn("Homepage popular fallback query failed", popularFallbackResult.reason)
    if (randomPoolResult.status === "rejected") console.warn("Homepage random pool query failed", randomPoolResult.reason)
    if (recommendedPoolResult.status === "rejected") console.warn("Homepage recommended pool query failed", recommendedPoolResult.reason)
    if (latestPoolResult.status === "rejected") console.warn("Homepage latest pool query failed", latestPoolResult.reason)
    if (commentsResult.status === "rejected") console.warn("Homepage comments query failed", commentsResult.reason)

    const weeklyRaw = weeklyResult.status === "fulfilled" ? weeklyResult.value : []
    const monthlyRaw = monthlyResult.status === "fulfilled" ? monthlyResult.value : []
    const allTimeRaw = allTimeResult.status === "fulfilled" ? allTimeResult.value : []
    const popularFallbackRaw = popularFallbackResult.status === "fulfilled" ? popularFallbackResult.value : []
    const randomPoolRaw = randomPoolResult.status === "fulfilled" ? randomPoolResult.value : []
    const recommendedPoolRaw = recommendedPoolResult.status === "fulfilled" ? recommendedPoolResult.value : []
    const latestPoolRaw = latestPoolResult.status === "fulfilled" ? latestPoolResult.value : []
    const commentsPool = commentsResult.status === "fulfilled" ? commentsResult.value : []

    const popularFallbackRows: RankingEntry[] = (popularFallbackRaw as HomeNovel[]).map((novel) => ({
      id: novel.id,
      seriesId: novel.seriesId,
      novel,
      aggregatedViews: novel.views,
    }))

    weeklyRanking = fillUniqueRows(collapseSeriesRows(weeklyRaw), collapseSeriesRows(popularFallbackRows), 10)
    monthlyRanking = fillUniqueRows(collapseSeriesRows(monthlyRaw), collapseSeriesRows(popularFallbackRows), 10)
    allTimeRanking = fillUniqueRows(collapseSeriesRows(allTimeRaw), collapseSeriesRows(popularFallbackRows), 10)

    const hotWeekly = weeklyRanking.slice(0, 5).map((entry) => ({ ...entry, source: "week" as const }))
    const hotMonthly = monthlyRanking.slice(0, 5).map((entry) => ({ ...entry, source: "month" as const }))

    hotSlides = toHotCarouselItems([...hotWeekly, ...hotMonthly]).slice(0, 10)

    const usedHotIds = new Set(hotSlides.map((item) => item.id))
    const randomPool = randomPoolRaw as HomeNovel[]
    const randomCandidates = collapseSeriesRows(shuffleRows(randomPool)).filter((item) => !usedHotIds.has(item.id))
    randomNovels = fillUniqueRows(randomCandidates, shuffleRows(randomPool), 12)

    recommendedNovels = fillUniqueRows(
      collapseSeriesRows(recommendedPoolRaw as HomeNovel[]),
      collapseSeriesRows(popularFallbackRaw as HomeNovel[]),
      10,
    )

    latestNovels = fillUniqueRows(
      collapseSeriesRows(latestPoolRaw as HomeNovel[]),
      collapseSeriesRows(popularFallbackRaw as HomeNovel[]),
      12,
    )
    recentComments = commentsPool as RecentCommentItem[]

    const latestIds = latestNovels.map((item) => item.id)
    if (latestIds.length > 0) {
      await connectToMongoDB()
      const rows = await Chapter.aggregate([
        { $match: { novelId: { $in: latestIds } } },
        { $sort: { novelId: 1, createdAt: -1, number: -1 } },
        {
          $group: {
            _id: "$novelId",
            chapterNumber: { $first: "$number" },
            chapterTitle: { $first: "$title" },
            chapterCreatedAt: { $first: "$createdAt" },
          },
        },
      ])

      for (const row of rows) {
        latestChapterMap.set(String(row._id), {
          chapterNumber: typeof row.chapterNumber === "number" ? row.chapterNumber : null,
          chapterTitle: typeof row.chapterTitle === "string" ? row.chapterTitle : null,
          chapterCreatedAt: row.chapterCreatedAt ? new Date(row.chapterCreatedAt) : null,
        })
      }
    }
  } catch (error) {
    console.error("Failed to fetch data for homepage during build/runtime", error)
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-6">
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="inline-flex items-center gap-2 text-2xl font-bold text-foreground md:text-3xl">
              <Flame className="h-6 w-6 text-primary" />
              Truyện hot hôm nay
            </h1>
            <p className="text-sm text-muted-foreground">Mỗi lần trượt hiển thị 1 truyện, dữ liệu lấy từ log đọc theo tuần và tháng.</p>
          </div>
          <Link href="/tim-kiem?sort=popular" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {hotSlides.length > 0 ? (
          <HomeHotCarousel items={hotSlides} />
        ) : (
          <p className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">Chưa có dữ liệu hot để hiển thị.</p>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="inline-flex items-center gap-2 text-xl font-bold text-foreground"><Shuffle className="h-5 w-5 text-primary" />Truyện ngẫu nhiên</h2>
          <span className="text-xs text-muted-foreground">Luôn cố gắng lấp đầy đủ 2 hàng</span>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {randomNovels.length > 0 ? randomNovels.map((novel) => (
            <Link
              key={novel.id}
              href={`/truyen/${novel.slug}`}
              className="group overflow-hidden rounded-xl border border-border/70 bg-card transition hover:border-primary/40"
            >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted/50">
                <img
                  src={novel.coverUrl || "/default-cover.svg"}
                  alt={novel.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="space-y-1 p-3">
                <h3 className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary">{novel.title}</h3>
                <p className="truncate text-xs text-muted-foreground">{novel.authorName}</p>
                <p className="text-[11px] text-muted-foreground">{formatViews(novel.views)} lượt đọc</p>
              </div>
            </Link>
          )) : (
            <p className="col-span-full text-sm text-muted-foreground">Không có truyện để hiển thị.</p>
          )}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="rounded-2xl border border-border/70 bg-card/70 p-4 lg:col-span-3">
          <h2 className="mb-4 text-xl font-bold text-foreground">Top truyện đề cử</h2>
          <div className="space-y-2">
            {recommendedNovels.length > 0 ? recommendedNovels.map((novel, index) => (
              <Link
                key={novel.id}
                href={`/truyen/${novel.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-border bg-background/80 p-2.5 transition hover:border-primary/40"
              >
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <img
                  src={novel.coverUrl || "/default-cover.svg"}
                  alt={novel.title}
                  className="h-20 w-14 shrink-0 rounded-md border border-border/70 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-1 text-sm font-semibold text-foreground group-hover:text-primary">{novel.title}</h3>
                  <p className="text-xs text-muted-foreground">{novel.authorName}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatViews(novel.bookmarkCount)} theo dõi</p>
                </div>
                <div className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                  {novel.rating.toFixed(1)}
                </div>
              </Link>
            )) : (
              <p className="text-sm text-muted-foreground">Chưa có truyện đề cử.</p>
            )}
          </div>
        </div>

        <aside className="rounded-2xl border border-border/70 bg-card/70 p-4 lg:col-span-2">
          <h2 className="mb-4 inline-flex items-center gap-2 text-xl font-bold text-foreground"><MessageSquare className="h-5 w-5 text-primary" />Bình luận mới</h2>

          <div className="space-y-2">
            {recentComments.length > 0 ? recentComments.map((comment) => (
              <Link
                key={comment.id}
                href={`/truyen/${comment.novel.slug}`}
                className="group block rounded-lg border border-border bg-background/80 p-3 transition hover:border-primary/40"
              >
                <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="truncate">{comment.user.name || "Người dùng"}</span>
                  <span>{formatRelativeTime(comment.createdAt)}</span>
                </div>
                <p className="truncate text-xs font-medium text-primary">{comment.novel.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-foreground/90">{compactLine(comment.content, 120)}</p>
              </Link>
            )) : (
              <p className="text-sm text-muted-foreground">Chưa có bình luận mới.</p>
            )}
          </div>
        </aside>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card/70 p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="inline-flex items-center gap-2 text-xl font-bold text-foreground"><Clock3 className="h-5 w-5 text-primary" />Truyện mới cập nhật</h2>
          <Link href="/tim-kiem?sort=latest" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="space-y-2">
          {latestNovels.length > 0 ? latestNovels.map((novel) => {
            const chapter = latestChapterMap.get(novel.id)
            const chapterLabel = chapter?.chapterNumber ? `Chương ${chapter.chapterNumber}` : "Chưa có chương"
            const chapterTitle = chapter?.chapterTitle ? compactLine(chapter.chapterTitle, 100) : "Đang cập nhật nội dung chương"
            const updatedTime = formatRelativeTime(chapter?.chapterCreatedAt || novel.updatedAt)

            return (
              <Link
                key={novel.id}
                href={`/truyen/${novel.slug}`}
                className="group flex items-center gap-3 rounded-xl border border-border bg-background/80 p-3 transition hover:border-primary/40"
              >
                <img
                  src={novel.coverUrl || "/default-cover.svg"}
                  alt={novel.title}
                  className="h-20 w-14 shrink-0 rounded-md border border-border/70 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <h3 className="line-clamp-1 text-sm font-semibold text-foreground group-hover:text-primary">{novel.title}</h3>
                  <p className="text-xs text-muted-foreground">{novel.authorName}</p>
                  <p className="mt-1 text-xs text-primary">{chapterLabel}</p>
                  <p className="line-clamp-1 text-xs text-muted-foreground">{chapterTitle}</p>
                </div>
                <div className="text-right text-[11px] text-muted-foreground">{updatedTime}</div>
              </Link>
            )
          }) : (
            <p className="text-sm text-muted-foreground">Chưa có truyện mới cập nhật.</p>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-foreground">Bảng xếp hạng độ hot</h2>
          <p className="text-sm text-muted-foreground">So sánh độ nóng theo tuần, tháng và toàn thời gian.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <RankingBoard title="Hot theo tuần" entries={weeklyRanking} emptyText="Tuần này chưa có dữ liệu nổi bật." />
          <RankingBoard title="Hot theo tháng" entries={monthlyRanking} emptyText="Tháng này chưa có dữ liệu nổi bật." />
          <RankingBoard title="Hot toàn thời gian" entries={allTimeRanking} emptyText="Chưa có dữ liệu toàn thời gian." />
        </div>
      </section>
    </div>
  )
}
