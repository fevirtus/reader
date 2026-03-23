import Link from "next/link"
import { ArrowRight, Clock3, Flame, MessageSquare, Shuffle, Trophy } from "lucide-react"
import { formatViews } from "@/lib/utils"
import connectToMongoDB from "@/lib/mongoose"
import { Chapter } from "@/lib/models/chapter"
import { EditorRecommendation } from "@/lib/models/editor-recommendation"
import { UserRecommendation } from "@/lib/models/user-recommendation"
import { HomeHotCarousel, type HotCarouselItem } from "@/components/home-hot-carousel"
import { HomeRecommendationBoards } from "@/components/home-recommendation-boards"

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
  uploader?: {
    name: string | null
    role: "USER" | "MOD" | "ADMIN"
  } | null
}

type EditorRecommendedItem = {
  novel: HomeNovel
  editorName: string
  recommendCount: number
}

type RecommendedByCountItem = {
  novel: HomeNovel
  recommendCount: number
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
  uploader: {
    select: {
      name: true,
      role: true,
    },
  },
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

function withTimeout<T>(promise: Promise<T>, label: string, timeoutMs = 4000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })
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

async function fetchManualRecommendationData(): Promise<{
  recommendedByCountItems: RecommendedByCountItem[]
  editorRecommendedItems: EditorRecommendedItem[]
}> {
  try {
    await connectToMongoDB()
    const editorDocs = (await EditorRecommendation.find({}).sort({ createdAt: -1 }).limit(2000).lean()) as Array<{
      novelId: string
      editorId: string
      createdAt?: Date
    }>
    const userDocs = (await UserRecommendation.find({}).sort({ createdAt: -1 }).limit(5000).lean()) as Array<{
      novelId: string
      createdAt?: Date
    }>

    if (editorDocs.length === 0 && userDocs.length === 0) {
      return {
        recommendedByCountItems: [],
        editorRecommendedItems: [],
      }
    }

    const novelIds = Array.from(
      new Set(
        [...editorDocs.map((doc) => doc.novelId), ...userDocs.map((doc) => doc.novelId)].filter(Boolean)
      )
    )
    const editorIds = Array.from(new Set(editorDocs.map((doc) => doc.editorId).filter(Boolean)))

    const [novels, editors] = await Promise.all([
      prisma.novel.findMany({
        where: { id: { in: novelIds } },
        select: BASE_NOVEL_SELECT,
      }),
      prisma.user.findMany({
        where: { id: { in: editorIds } },
        select: { id: true, name: true },
      }),
    ])

    const novelMap = new Map(novels.map((novel) => [novel.id, novel as HomeNovel]))
    const editorMap = new Map(editors.map((editor) => [editor.id, editor]))
    const recommendCountMap = new Map<string, number>()

    for (const doc of editorDocs) {
      recommendCountMap.set(doc.novelId, (recommendCountMap.get(doc.novelId) || 0) + 1)
    }

    for (const doc of userDocs) {
      recommendCountMap.set(doc.novelId, (recommendCountMap.get(doc.novelId) || 0) + 1)
    }

    const recommendedByCountItems = Array.from(recommendCountMap.entries())
      .map(([novelId, recommendCount]) => ({
        novel: novelMap.get(novelId),
        recommendCount,
      }))
      .filter((row): row is { novel: HomeNovel; recommendCount: number } => Boolean(row.novel))
      .sort((a, b) => {
        if (b.recommendCount !== a.recommendCount) return b.recommendCount - a.recommendCount
        if (b.novel.rating !== a.novel.rating) return b.novel.rating - a.novel.rating
        return b.novel.views - a.novel.views
      })

    const editorRecommendedItems = editorDocs
      .map((doc) => {
        const novel = novelMap.get(doc.novelId)
        if (!novel) return null

        return {
          novel,
          editorName: editorMap.get(doc.editorId)?.name || "Biên tập viên",
          recommendCount: recommendCountMap.get(doc.novelId) || 0,
          createdAt: doc.createdAt ? new Date(doc.createdAt).getTime() : 0,
        }
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => {
        if (b.recommendCount !== a.recommendCount) return b.recommendCount - a.recommendCount
        return b.createdAt - a.createdAt
      })
      .map((item) => ({
        novel: item.novel,
        editorName: item.editorName,
        recommendCount: item.recommendCount,
      }))

    return {
      recommendedByCountItems,
      editorRecommendedItems,
    }
  } catch (error) {
    console.warn("Homepage manual recommendation query failed", error)
    return {
      recommendedByCountItems: [],
      editorRecommendedItems: [],
    }
  }
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
  let recommendedByCountItems: RecommendedByCountItem[] = []
  let editorRecommendedItems: EditorRecommendedItem[] = []
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
      recommendationResult,
      commentsResult,
    ] = await Promise.allSettled([
      withTimeout(fetchRankingByDailyViews({ since: weekStart, take: 600 }), "Homepage weekly ranking"),
      withTimeout(fetchRankingByDailyViews({ since: monthStart, take: 600 }), "Homepage monthly ranking"),
      withTimeout(fetchRankingByDailyViews({ take: 800 }), "Homepage all-time ranking"),
      withTimeout(prisma.novel.findMany({
        take: 400,
        select: BASE_NOVEL_SELECT,
        orderBy: [{ views: "desc" }, { updatedAt: "desc" }],
      }), "Homepage popular fallback"),
      withTimeout(prisma.novel.findMany({
        take: 420,
        select: BASE_NOVEL_SELECT,
        orderBy: [{ updatedAt: "desc" }],
      }), "Homepage random pool"),
      withTimeout(fetchManualRecommendationData(), "Homepage recommendations"),
      withTimeout(prisma.comment.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          content: true,
          createdAt: true,
          user: { select: { name: true } },
          novel: { select: { slug: true, title: true } },
        },
      }), "Homepage comments"),
    ])

    if (weeklyResult.status === "rejected") console.warn("Homepage weekly ranking query failed", weeklyResult.reason)
    if (monthlyResult.status === "rejected") console.warn("Homepage monthly ranking query failed", monthlyResult.reason)
    if (allTimeResult.status === "rejected") console.warn("Homepage all-time ranking query failed", allTimeResult.reason)
    if (popularFallbackResult.status === "rejected") console.warn("Homepage popular fallback query failed", popularFallbackResult.reason)
    if (randomPoolResult.status === "rejected") console.warn("Homepage random pool query failed", randomPoolResult.reason)
    if (recommendationResult.status === "rejected") console.warn("Homepage recommendation query failed", recommendationResult.reason)
    if (commentsResult.status === "rejected") console.warn("Homepage comments query failed", commentsResult.reason)

    const weeklyRaw = weeklyResult.status === "fulfilled" ? weeklyResult.value : []
    const monthlyRaw = monthlyResult.status === "fulfilled" ? monthlyResult.value : []
    const allTimeRaw = allTimeResult.status === "fulfilled" ? allTimeResult.value : []
    const popularFallbackRaw = popularFallbackResult.status === "fulfilled" ? popularFallbackResult.value : []
    const randomPoolRaw = randomPoolResult.status === "fulfilled" ? randomPoolResult.value : []
    const recommendationData = recommendationResult.status === "fulfilled"
      ? recommendationResult.value
      : { recommendedByCountItems: [], editorRecommendedItems: [] }
    const commentsPool = commentsResult.status === "fulfilled" ? commentsResult.value : []

    const popularFallbackRows: RankingEntry[] = (popularFallbackRaw as HomeNovel[]).map((novel) => ({
      id: novel.id,
      seriesId: novel.seriesId,
      novel,
      aggregatedViews: novel.views,
    }))

    weeklyRanking = fillUniqueRows(collapseSeriesRows(weeklyRaw), collapseSeriesRows(popularFallbackRows), 5)
    monthlyRanking = fillUniqueRows(collapseSeriesRows(monthlyRaw), collapseSeriesRows(popularFallbackRows), 5)
    allTimeRanking = fillUniqueRows(collapseSeriesRows(allTimeRaw), collapseSeriesRows(popularFallbackRows), 5)

    const hotWeekly = weeklyRanking.slice(0, 5).map((entry) => ({ ...entry, source: "week" as const }))
    const hotMonthly = monthlyRanking.slice(0, 5).map((entry) => ({ ...entry, source: "month" as const }))
    const hotAllTime = allTimeRanking.slice(0, 8).map((entry) => ({ ...entry, source: "all" as const }))

    hotSlides = fillUniqueRows(
      toHotCarouselItems([...hotWeekly, ...hotMonthly]),
      toHotCarouselItems(hotAllTime),
      10,
    )

    const usedHotIds = new Set(hotSlides.map((item) => item.id))
    const randomPool = randomPoolRaw as HomeNovel[]
    const randomCandidates = collapseSeriesRows(shuffleRows(randomPool)).filter((item) => !usedHotIds.has(item.id))
    randomNovels = fillUniqueRows(randomCandidates, shuffleRows(randomPool), 12)

    recommendedByCountItems = recommendationData.recommendedByCountItems
    editorRecommendedItems = recommendationData.editorRecommendedItems

    recentComments = commentsPool as RecentCommentItem[]

    try {
      // Latest-updated list is based only on newly created chapters, not on novel metadata edits.
      // Sampling recent inserts by Mongo _id keeps this query on the default index and avoids scanning the whole collection.
      await withTimeout(connectToMongoDB(), "Homepage chapter Mongo connect")
      const recentChapterRows = await withTimeout(
        Chapter.find(
          {},
          {
            novelId: 1,
            number: 1,
            title: 1,
            createdAt: 1,
          }
        )
          .sort({ _id: -1 })
          .limit(400)
          .lean() as Promise<Array<{
            novelId?: string
            number?: number
            title?: string
            createdAt?: Date
          }>>,
        "Homepage recent chapters"
      )

      const latestNovelIdsByChapter: string[] = []
      const latestSeenNovelIds = new Set<string>()

      for (const row of recentChapterRows) {
        const novelId = String(row.novelId || "").trim()
        if (!novelId || latestSeenNovelIds.has(novelId)) continue

        latestSeenNovelIds.add(novelId)
        latestNovelIdsByChapter.push(novelId)
        latestChapterMap.set(novelId, {
          chapterNumber: typeof row.number === "number" ? row.number : null,
          chapterTitle: typeof row.title === "string" ? row.title : null,
          chapterCreatedAt: row.createdAt ? new Date(row.createdAt) : null,
        })

        if (latestNovelIdsByChapter.length >= 500) break
      }

      if (latestNovelIdsByChapter.length > 0) {
        const latestNovelPool = await withTimeout(
          prisma.novel.findMany({
            where: { id: { in: latestNovelIdsByChapter } },
            select: BASE_NOVEL_SELECT,
          }),
          "Homepage latest novel pool"
        )

        const latestNovelMap = new Map(latestNovelPool.map((novel) => [novel.id, novel as HomeNovel]))
        const orderedLatestByChapter = latestNovelIdsByChapter
          .map((id) => latestNovelMap.get(id))
          .filter((row): row is HomeNovel => Boolean(row))

        latestNovels = collapseSeriesRows(orderedLatestByChapter).slice(0, 5)
      }
    } catch (error) {
      console.warn("Homepage latest chapter section skipped", error)
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

      <HomeRecommendationBoards topItems={recommendedByCountItems} editorItems={editorRecommendedItems} pageSize={5} />

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

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
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
        </div>

        <aside className="rounded-2xl border border-border/70 bg-card/70 p-4">
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
    </div>
  )
}
