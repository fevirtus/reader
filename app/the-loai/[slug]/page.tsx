"use client"

import { use, useState, useMemo } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { getGenreBySlug, getNovelsByGenre } from "@/lib/data"
import { NovelCard } from "@/components/novel-card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { notFound } from "next/navigation"

export default function GenreDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const genre = getGenreBySlug(slug)
  
  if (!genre) {
    notFound()
  }

  return <GenreContent genreName={genre.name} genreSlug={genre.slug} genreDescription={genre.description} />
}

function GenreContent({ genreName, genreSlug, genreDescription }: { genreName: string; genreSlug: string; genreDescription: string }) {
  const [sortBy, setSortBy] = useState("latest")
  const allNovels = getNovelsByGenre(genreSlug)

  const sortedNovels = useMemo(() => {
    const sorted = [...allNovels]
    switch (sortBy) {
      case "popular":
        sorted.sort((a, b) => b.views - a.views)
        break
      case "rating":
        sorted.sort((a, b) => b.rating - a.rating)
        break
      case "latest":
      default:
        sorted.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
    }
    return sorted
  }, [allNovels, sortBy])

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6">
        <Link href="/the-loai" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" /> Thể Loại
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{genreName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{genreDescription}</p>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{sortedNovels.length} truyện</p>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">Mới nhất</SelectItem>
            <SelectItem value="popular">Xem nhiều</SelectItem>
            <SelectItem value="rating">Đánh giá cao</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {sortedNovels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">Chưa có truyện nào</p>
          <p className="text-sm">Thể loại này chưa có truyện, hãy quay lại sau.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {sortedNovels.map((novel) => (
            <NovelCard key={novel.id} novel={novel} />
          ))}
        </div>
      )}
    </div>
  )
}
