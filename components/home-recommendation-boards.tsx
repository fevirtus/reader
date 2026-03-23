"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Star } from "lucide-react"
import { Button } from "@/components/ui/button"

type RecommendationNovel = {
  id: string
  slug: string
  title: string
  authorName: string
  coverUrl: string | null
  rating: number
}

type TopRecommendationItem = {
  novel: RecommendationNovel
  recommendCount: number
}

type EditorRecommendationItem = {
  novel: RecommendationNovel
  editorName: string
  recommendCount: number
}

interface HomeRecommendationBoardsProps {
  topItems: TopRecommendationItem[]
  editorItems: EditorRecommendationItem[]
  pageSize?: number
}

function BoardHeader({
  title,
  page,
  totalPages,
  onPrev,
  onNext,
}: {
  title: string
  page: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={onPrev}
          disabled={totalPages <= 1 || page === 0}
          aria-label="Trang trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={onNext}
          disabled={totalPages <= 1 || page >= totalPages - 1}
          aria-label="Trang sau"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export function HomeRecommendationBoards({ topItems, editorItems, pageSize = 5 }: HomeRecommendationBoardsProps) {
  const [topPage, setTopPage] = useState(0)
  const [editorPage, setEditorPage] = useState(0)

  const sortedTopItems = useMemo(() => {
    return [...topItems].sort((a, b) => b.recommendCount - a.recommendCount)
  }, [topItems])

  const sortedEditorItems = useMemo(() => {
    return [...editorItems].sort((a, b) => {
      if (b.recommendCount !== a.recommendCount) return b.recommendCount - a.recommendCount
      return a.editorName.localeCompare(b.editorName, "vi")
    })
  }, [editorItems])

  const totalTopPages = Math.max(1, Math.ceil(sortedTopItems.length / pageSize))
  const totalEditorPages = Math.max(1, Math.ceil(sortedEditorItems.length / pageSize))

  const topPageStart = topPage * pageSize
  const editorPageStart = editorPage * pageSize

  const visibleTopItems = sortedTopItems.slice(topPageStart, topPageStart + pageSize)
  const visibleEditorItems = sortedEditorItems.slice(editorPageStart, editorPageStart + pageSize)

  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
        <BoardHeader
          title="Top đề cử"
          page={topPage}
          totalPages={totalTopPages}
          onPrev={() => setTopPage((prev) => Math.max(0, prev - 1))}
          onNext={() => setTopPage((prev) => Math.min(totalTopPages - 1, prev + 1))}
        />
        <div className="space-y-2">
          {visibleTopItems.length > 0 ? visibleTopItems.map((item, index) => (
            <Link
              key={item.novel.id}
              href={`/truyen/${item.novel.slug}`}
              className="group flex items-center gap-3 rounded-xl border border-border bg-background/80 p-2.5 transition hover:border-primary/40"
            >
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {topPageStart + index + 1}
              </span>
              <img
                src={item.novel.coverUrl || "/default-cover.svg"}
                alt={item.novel.title}
                className="h-20 w-14 shrink-0 rounded-md border border-border/70 object-cover"
              />
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-1 text-sm font-semibold text-foreground group-hover:text-primary">{item.novel.title}</h3>
                <p className="text-xs text-muted-foreground">{item.novel.authorName}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.recommendCount} đề cử</p>
              </div>
              <div className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                {item.novel.rating.toFixed(1)}
              </div>
            </Link>
          )) : (
            <p className="text-sm text-muted-foreground">Chưa có truyện đề cử.</p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border/70 bg-card/70 p-4">
        <BoardHeader
          title="Biên tập viên đề cử"
          page={editorPage}
          totalPages={totalEditorPages}
          onPrev={() => setEditorPage((prev) => Math.max(0, prev - 1))}
          onNext={() => setEditorPage((prev) => Math.min(totalEditorPages - 1, prev + 1))}
        />
        <div className="space-y-2">
          {visibleEditorItems.length > 0 ? visibleEditorItems.map((item, index) => (
            <Link
              key={`${item.novel.id}-${item.editorName}-${editorPageStart + index}`}
              href={`/truyen/${item.novel.slug}`}
              className="group flex items-center gap-3 rounded-xl border border-border bg-background/80 p-2.5 transition hover:border-primary/40"
            >
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {editorPageStart + index + 1}
              </span>
              <img
                src={item.novel.coverUrl || "/default-cover.svg"}
                alt={item.novel.title}
                className="h-20 w-14 shrink-0 rounded-md border border-border/70 object-cover"
              />
              <div className="min-w-0 flex-1">
                <h3 className="line-clamp-1 text-sm font-semibold text-foreground group-hover:text-primary">{item.novel.title}</h3>
                <p className="text-xs text-muted-foreground">{item.novel.authorName}</p>
                <p className="mt-1 text-xs text-muted-foreground">Biên tập viên: {item.editorName}</p>
                <p className="text-xs text-muted-foreground">{item.recommendCount} đề cử</p>
              </div>
              <div className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                {item.novel.rating.toFixed(1)}
              </div>
            </Link>
          )) : (
            <p className="text-sm text-muted-foreground">Chưa có đề cử từ biên tập viên.</p>
          )}
        </div>
      </div>
    </section>
  )
}
