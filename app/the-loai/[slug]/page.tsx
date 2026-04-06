import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { NovelCard } from "@/components/novel-card"
import { notFound } from "next/navigation"
import { readerApiFetch, readerApiFetchNullable } from "@/lib/server-api"

export const dynamic = "force-dynamic"

const PAGE_SIZE = 24

type GenreItem = {
  id: string
  name: string
  slug: string
  description: string | null
}

type BrowseNovel = {
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
  seriesId?: string | null
}

type BrowseResponse = {
  items: BrowseNovel[]
  totalCount: number
  totalPages: number
  currentPage: number
}

export default async function GenreDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const { slug } = await params
  const resolved = await searchParams
  const sort = resolved.sort || "latest"
  const requestedPage = Math.max(1, Number(resolved.page || "1") || 1)

  const genre = await readerApiFetchNullable<GenreItem>(`/api/genres/${encodeURIComponent(slug)}`)

  if (!genre) {
    notFound()
  }

  const browse = await readerApiFetch<BrowseResponse>(
    `/api/novels/browse?genre=${encodeURIComponent(slug)}&sort=${sort}&page=${requestedPage}&limit=${PAGE_SIZE}&collapse_series=true`
  )

  const totalPages = Math.max(1, browse.totalPages || 1)
  const currentPage = Math.min(requestedPage, totalPages)

  const pageRangeStart = Math.max(1, currentPage - 2)
  const pageRangeEnd = Math.min(totalPages, currentPage + 2)
  const pageNumbers = Array.from(
    { length: pageRangeEnd - pageRangeStart + 1 },
    (_, i) => pageRangeStart + i
  )

  const buildPageHref = (page: number) => {
    const p = new URLSearchParams()
    if (sort !== "latest") p.set("sort", sort)
    p.set("page", String(page))
    return `/the-loai/${slug}?${p.toString()}`
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6">
        <Link href="/the-loai" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" /> Thể Loại
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{genre.name}</h1>
        {genre.description && (
          <p className="mt-1 text-sm text-muted-foreground">{genre.description}</p>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {browse.totalCount} truyện {totalPages > 1 && `(Trang ${currentPage}/${totalPages})`}
        </p>
        <form method="GET" action={`/the-loai/${slug}`} className="flex items-center gap-2">
          <select
            name="sort"
            defaultValue={sort}
            className="flex h-9 items-center rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="latest">Mới nhất</option>
            <option value="popular">Xem nhiều</option>
            <option value="rating">Đánh giá cao</option>
            <option value="name">Theo tên</option>
          </select>
          <button type="submit" className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Lọc</button>
        </form>
      </div>

      {browse.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">Chưa có truyện nào</p>
          <p className="text-sm">Thể loại này chưa có truyện, hãy quay lại sau.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {browse.items.map((novel) => (
            <NovelCard key={novel.id} novel={novel} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Link
            href={buildPageHref(Math.max(1, currentPage - 1))}
            className={`rounded-md border px-3 py-1.5 text-sm ${currentPage <= 1 ? "pointer-events-none opacity-50" : "hover:bg-muted"}`}
          >
            Trước
          </Link>
          {pageNumbers.map((page) => (
            <Link
              key={page}
              href={buildPageHref(page)}
              className={`rounded-md border px-3 py-1.5 text-sm ${page === currentPage ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              {page}
            </Link>
          ))}
          <Link
            href={buildPageHref(Math.min(totalPages, currentPage + 1))}
            className={`rounded-md border px-3 py-1.5 text-sm ${currentPage >= totalPages ? "pointer-events-none opacity-50" : "hover:bg-muted"}`}
          >
            Sau
          </Link>
        </div>
      )}
    </div>
  )
}
