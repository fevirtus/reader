import Link from "next/link"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { NovelCard } from "@/components/novel-card"
import { readerApiFetch } from "@/lib/server-api"

export const dynamic = "force-dynamic"
const PAGE_SIZE = 20

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

type GenreItem = {
  id: string
  name: string
  slug: string
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

function buildBrowsePath(params: Record<string, string>) {
  const search = new URLSearchParams(params)
  return `/api/novels/browse?${search.toString()}`
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>
}) {
  const resolvedParams = await searchParams
  const q = resolvedParams.q || ""
  const sortBy = resolvedParams.sort || "latest"
  const genreFilter = resolvedParams.genreFilter || "all"
  const statusFilter = resolvedParams.statusFilter || "all"
  const requestedPage = Math.max(1, Number(resolvedParams.page || "1") || 1)

  const genres = await readerApiFetch<GenreItem[]>("/api/genres")

  let filteredNovels: BrowseNovel[] = []
  let totalResults = 0
  let totalPages = 1
  let currentPage = requestedPage

  if (q) {
    const browse = await readerApiFetch<BrowseResponse>(
      buildBrowsePath({
        q,
        sort: sortBy,
        genre: genreFilter === "all" ? "" : genreFilter,
        status: statusFilter === "all" ? "" : statusFilter,
        page: String(requestedPage),
        limit: String(PAGE_SIZE),
      })
    )

    filteredNovels = browse.items
    totalResults = browse.totalCount
    totalPages = Math.max(1, browse.totalPages || 1)
    currentPage = Math.min(requestedPage, totalPages)
  } else {
    const browse = await readerApiFetch<BrowseResponse>(
      buildBrowsePath({
        sort: sortBy,
        genre: genreFilter === "all" ? "" : genreFilter,
        status: statusFilter === "all" ? "" : statusFilter,
        page: String(requestedPage),
        limit: String(PAGE_SIZE),
        collapse_series: "true",
      })
    )

    filteredNovels = browse.items
    totalResults = browse.totalCount
    totalPages = Math.max(1, browse.totalPages || 1)
    currentPage = Math.min(requestedPage, totalPages)
  }

  const pageRangeStart = Math.max(1, currentPage - 2)
  const pageRangeEnd = Math.min(totalPages, currentPage + 2)
  const pageNumbers = Array.from(
    { length: pageRangeEnd - pageRangeStart + 1 },
    (_, index) => pageRangeStart + index
  )

  const buildPageHref = (page: number) => {
    const params = new URLSearchParams()

    if (q) params.set("q", q)
    if (sortBy !== "latest") params.set("sort", sortBy)
    if (genreFilter !== "all") params.set("genreFilter", genreFilter)
    if (statusFilter !== "all") params.set("statusFilter", statusFilter)
    params.set("page", String(page))

    return `/tim-kiem?${params.toString()}`
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Tìm Kiếm Truyện</h1>

      <form method="GET" action="/tim-kiem">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            type="search"
            placeholder="Tìm theo tên truyện, tác giả..."
            className="pl-9"
            defaultValue={q}
          />
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <select name="genreFilter" defaultValue={genreFilter} className="flex h-9 items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
            <option value="all">Tất cả thể loại</option>
            {genres.map((g) => (
              <option key={g.slug} value={g.slug}>{g.name}</option>
            ))}
          </select>

          <select name="statusFilter" defaultValue={statusFilter} className="flex h-9 items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
            <option value="all">Tất cả trạng thái</option>
            <option value="Đang ra">Đang ra</option>
            <option value="Hoàn thành">Hoàn thành</option>
            <option value="Tạm ngưng">Tạm ngưng</option>
          </select>

          <select name="sort" defaultValue={sortBy} className="flex h-9 items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
            <option value="latest">Mới nhất</option>
            <option value="popular">Xem nhiều</option>
            <option value="rating">Đánh giá cao</option>
            <option value="name">Theo tên</option>
          </select>

          <button type="submit" className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">Lọc</button>
        </div>
      </form>

      <p className="mb-4 text-sm text-muted-foreground">
        {totalResults} kết quả {totalResults > 0 && `(Trang ${currentPage}/${totalPages})`}
      </p>
      {filteredNovels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Search className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-lg font-medium">Không tìm thấy truyện</p>
          <p className="text-sm">Thử tìm kiếm với từ khóa khác hoặc thay đổi bộ lọc.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filteredNovels.map((novel) => (
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
