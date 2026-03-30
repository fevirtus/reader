import Link from "next/link"
import { ArrowRight, Clock3, Flame, MessageSquare, Shuffle, Trophy } from "lucide-react"
import { formatViews } from "@/lib/utils"
import { HomeHotCarousel, type HotCarouselItem } from "@/components/home-hot-carousel"
import { HomeRecommendationBoards } from "@/components/home-recommendation-boards"
import { readerApiFetch } from "@/lib/server-api"

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
  updatedAt: string | null
}

type EditorRecommendedItem = {
  novel: {
    id: string
    slug: string
    title: string
    authorName: string
    coverUrl: string | null
    rating: number
  }
  editorName: string
  recommendCount: number
}

type RecommendedByCountItem = {
  novel: {
    id: string
    slug: string
    title: string
    authorName: string
    coverUrl: string | null
    rating: number
  }
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
  createdAt: string | null
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
  chapterCreatedAt: string | null
}

type HomeApiResponse = {
  hotSlides: HotCarouselItem[]
  randomNovels: HomeNovel[]
  recommendedByCountItems: RecommendedByCountItem[]
  editorRecommendedItems: EditorRecommendedItem[]
  weeklyRanking: RankingEntry[]
  monthlyRanking: RankingEntry[]
  allTimeRanking: RankingEntry[]
  latestNovels: Array<HomeNovel & { latestChapter?: { number?: number | null; title?: string | null; createdAt?: string | null } | null }>
  recentComments: RecentCommentItem[]
}

function formatRelativeTime(value: string | Date | null | undefined): string {
  if (!value) return "Vừa cập nhật"

  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) return "Vừa cập nhật"

  const now = Date.now()
  const ts = parsed.getTime()
  const diff = Math.max(0, now - ts)
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return "Vừa xong"
  if (diff < hour) return `${Math.floor(diff / minute)} phút trước`
  if (diff < day) return `${Math.floor(diff / hour)} giờ trước`
  if (diff < day * 30) return `${Math.floor(diff / day)} ngày trước`

  return parsed.toLocaleDateString("vi-VN")
}

function compactLine(text: string, max = 140): string {
  const normalized = text.replace(/\s+/g, " ").trim()
  if (normalized.length <= max) return normalized
  return `${normalized.slice(0, max).trim()}...`
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
  let latestNovels: Array<HomeNovel & { latestChapter?: { number?: number | null; title?: string | null; createdAt?: string | null } | null }> = []
  let recentComments: RecentCommentItem[] = []
  let weeklyRanking: RankingEntry[] = []
  let monthlyRanking: RankingEntry[] = []
  let allTimeRanking: RankingEntry[] = []
  const latestChapterMap = new Map<string, LatestChapterInfo>()

  try {
    const homeData = await readerApiFetch<HomeApiResponse>("/api/home")
    hotSlides = homeData.hotSlides
    randomNovels = homeData.randomNovels
    recommendedByCountItems = homeData.recommendedByCountItems
    editorRecommendedItems = homeData.editorRecommendedItems
    latestNovels = homeData.latestNovels
    recentComments = homeData.recentComments
    weeklyRanking = homeData.weeklyRanking
    monthlyRanking = homeData.monthlyRanking
    allTimeRanking = homeData.allTimeRanking

    for (const novel of latestNovels) {
      latestChapterMap.set(novel.id, {
        chapterNumber: novel.latestChapter?.number ?? null,
        chapterTitle: novel.latestChapter?.title ?? null,
        chapterCreatedAt: novel.latestChapter?.createdAt ?? null,
      })
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
