"use client"

import { useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { NovelCard } from "@/components/novel-card"
import { novels, genres, searchNovels } from "@/lib/data"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""
  const initialSort = searchParams.get("sort") || "latest"

  const [query, setQuery] = useState(initialQuery)
  const [sortBy, setSortBy] = useState(initialSort)
  const [genreFilter, setGenreFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredNovels = useMemo(() => {
    let results = query.trim() ? searchNovels(query) : [...novels]

    if (genreFilter !== "all") {
      results = results.filter((n) => n.genres.includes(genreFilter))
    }

    if (statusFilter !== "all") {
      results = results.filter((n) => n.status === statusFilter)
    }

    switch (sortBy) {
      case "popular":
        results.sort((a, b) => b.views - a.views)
        break
      case "rating":
        results.sort((a, b) => b.rating - a.rating)
        break
      case "name":
        results.sort((a, b) => a.title.localeCompare(b.title))
        break
      case "latest":
      default:
        results.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
    }

    return results
  }, [query, sortBy, genreFilter, statusFilter])

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Tìm Kiếm Truyện</h1>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Tìm theo tên truyện, tác giả..."
          className="pl-9"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Select value={genreFilter} onValueChange={setGenreFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Thể loại" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả thể loại</SelectItem>
            {genres.map((g) => (
              <SelectItem key={g.slug} value={g.slug}>{g.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="Đang ra">Đang ra</SelectItem>
            <SelectItem value="Hoàn thành">Hoàn thành</SelectItem>
            <SelectItem value="Tạm ngưng">Tạm ngưng</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Sắp xếp" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Mới nhất</SelectItem>
            <SelectItem value="popular">Xem nhiều</SelectItem>
            <SelectItem value="rating">Đánh giá cao</SelectItem>
            <SelectItem value="name">Theo tên</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
