import Link from "next/link"
import { ArrowRight, BookOpen, Sparkles, Flame, Heart, Swords, Building2, Rocket, Crown, Laugh, Search, Shield } from "lucide-react"
import { NovelCard } from "@/components/novel-card"
import { genres } from "@/lib/data"
import { prisma } from "@/lib/prisma"

const iconMap: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="h-5 w-5" />,
  Flame: <Flame className="h-5 w-5" />,
  Heart: <Heart className="h-5 w-5" />,
  Sword: <Swords className="h-5 w-5" />,
  Building: <Building2 className="h-5 w-5" />,
  Rocket: <Rocket className="h-5 w-5" />,
  Crown: <Crown className="h-5 w-5" />,
  Laugh: <Laugh className="h-5 w-5" />,
  Search: <Search className="h-5 w-5" />,
  Shield: <Shield className="h-5 w-5" />,
}

export default async function HomePage() {
  const popularNovels = await prisma.novel.findMany({
    take: 6,
    orderBy: { views: "desc" },
  })

  const latestNovels = await prisma.novel.findMany({
    take: 6,
    orderBy: { updatedAt: "desc" },
  })

  const topRated = await prisma.novel.findMany({
    take: 4,
    orderBy: { rating: "desc" },
  })

  // get the most popular as featured (can be empty if DB is new)
  const featured = popularNovels[0]

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Hero / Featured Novel */}
      {featured && (
        <section className="mb-10">
          <Link
            href={`/truyen/${featured.slug}`}
            className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card md:flex-row"
          >
            <div className={`flex h-48 items-center justify-center bg-gradient-to-br ${featured.coverColor || "from-slate-700 to-slate-800"} md:h-auto md:w-72`}>
              <BookOpen className="h-16 w-16 text-background/80" />
            </div>
            <div className="flex flex-1 flex-col justify-center gap-3 p-6">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">Truyện Nổi Bật</span>
              <h1 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors text-balance md:text-3xl">
                {featured.title}
              </h1>
              <p className="text-sm text-muted-foreground">Tác giả: {featured.authorName}</p>
              <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {featured.description}
              </p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{featured.totalChapters} chương</span>
                <span>{featured.status}</span>
                <span className="flex items-center gap-1 text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  {featured.rating}
                </span>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Popular Novels */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Truyện Hot</h2>
          <Link href="/tim-kiem?sort=popular" className="flex items-center gap-1 text-sm text-primary hover:underline">
            Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {popularNovels.length > 0 ? popularNovels.map((novel) => (
            <NovelCard key={novel.id} novel={novel} />
          )) : <p className="text-sm text-muted-foreground col-span-full">Chưa có truyện nào trong hệ thống.</p>}
        </div>
      </section>

      {/* Latest Updated */}
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Mới Cập Nhật</h2>
          <Link href="/tim-kiem?sort=latest" className="flex items-center gap-1 text-sm text-primary hover:underline">
            Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {latestNovels.length > 0 ? latestNovels.map((novel) => (
            <NovelCard key={novel.id} novel={novel} variant="compact" />
          )) : <p className="text-sm text-muted-foreground col-span-full">Chưa có truyện nào được cập nhật.</p>}
        </div>
      </section>

      {/* Two columns: Top Rated + Genres */}
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Top Rated */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-foreground">Đánh Giá Cao</h2>
          <div className="flex flex-col gap-3">
            {topRated.length > 0 ? topRated.map((novel, idx) => (
              <Link
                key={novel.id}
                href={`/truyen/${novel.slug}`}
                className="group flex items-center gap-4 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/30"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {idx + 1}
                </span>
                <div className={`flex h-12 w-9 shrink-0 items-center justify-center rounded bg-gradient-to-br ${novel.coverColor || "from-slate-700 to-slate-800"}`}>
                  <BookOpen className="h-4 w-4 text-background/80" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{novel.title}</h3>
                  <p className="text-xs text-muted-foreground">{novel.authorName} - Ch. {novel.totalChapters}</p>
                </div>
                <div className="flex items-center gap-1 text-sm font-semibold text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  {novel.rating}
                </div>
              </Link>
            )) : <p className="text-sm text-muted-foreground">Chưa có đánh giá.</p>}
          </div>
        </section>

        {/* Genres */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Thể Loại</h2>
            <Link href="/the-loai" className="flex items-center gap-1 text-sm text-primary hover:underline">
              Xem tất cả <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {genres.slice(0, 8).map((genre) => (
              <Link
                key={genre.id}
                href={`/the-loai/${genre.slug}`}
                className="group flex items-center gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/30 hover:bg-accent/50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  {iconMap[genre.icon] || <BookOpen className="h-5 w-5" />}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{genre.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{genre.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
