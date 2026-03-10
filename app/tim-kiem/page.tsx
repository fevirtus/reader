// Server component instead of client component
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NovelCard } from "@/components/novel-card"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

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

  // Build where clause
  let where: any = {}

  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { authorName: { contains: q, mode: "insensitive" } },
    ]
  }

  if (genreFilter !== "all") {
    where.genres = {
      some: {
        genre: {
          slug: genreFilter
        }
      }
    }
  }

  if (statusFilter !== "all") {
    where.status = statusFilter
  }

  // Build order clause
  let orderBy: any = {}
  switch (sortBy) {
    case "popular":
      orderBy = { views: "desc" }
      break
    case "rating":
      orderBy = { rating: "desc" }
      break
    case "name":
      orderBy = { title: "asc" }
      break
    case "latest":
    default:
      orderBy = { updatedAt: "desc" }
  }

  const filteredNovels = await prisma.novel.findMany({
    where,
    orderBy,
    take: 20,
  })

  const genres = await prisma.genre.findMany()

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Tìm Kiếm Truyện</h1>

      {/* Search and Filters - This requires a client component wrapper ideally, but for now we can rely on standard form submissions to update searchParams */}
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

          <button type="submit" className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium">Lọc</button>
        </div>
      </form>

      {/* Results */}
      <p className="mb-4 text-sm text-muted-foreground">{filteredNovels.length} kết quả</p>
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
    </div>
  )
}
