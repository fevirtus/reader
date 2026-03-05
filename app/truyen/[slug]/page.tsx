"use client"

import { use } from "react"
import { notFound } from "next/navigation"
import { BookOpen, Eye, BookMarked, User, Clock, Layers } from "lucide-react"
import { getNovelBySlug, getChaptersByNovelId, getCommentsByNovelId, genres, formatViews } from "@/lib/data"
import { GenreBadge } from "@/components/genre-badge"
import { StarRating } from "@/components/star-rating"
import { ChapterList } from "@/components/chapter-list"
import { CommentSection } from "@/components/comment-section"
import { NovelDetailActions } from "./novel-detail-actions"

export default function NovelDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const novel = getNovelBySlug(slug)

  if (!novel) {
    notFound()
  }

  const chapters = getChaptersByNovelId(novel.id)
  const comments = getCommentsByNovelId(novel.id)

  const novelGenres = novel.genres
    .map((gSlug) => genres.find((g) => g.slug === gSlug))
    .filter(Boolean) as typeof genres

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Novel Header */}
      <div className="flex flex-col gap-6 md:flex-row">
        {/* Cover */}
        <div className={`flex h-64 w-44 shrink-0 items-center justify-center self-center rounded-xl bg-gradient-to-br shadow-lg md:self-start ${novel.coverColor}`}>
          <BookOpen className="h-14 w-14 text-background/80" />
        </div>

        {/* Info */}
        <div className="flex flex-1 flex-col gap-3">
          <h1 className="text-2xl font-bold text-foreground text-balance md:text-3xl">{novel.title}</h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{novel.author}</span>
            <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" />{novel.totalChapters} chương</span>
            <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{formatViews(novel.views)} lượt xem</span>
            <span className="flex items-center gap-1"><BookMarked className="h-3.5 w-3.5" />{formatViews(novel.bookmarkCount)} bookmark</span>
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Cập nhật: {novel.lastUpdated}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              novel.status === "Hoàn thành" ? "bg-green-500/10 text-green-600 dark:text-green-400" :
              novel.status === "Đang ra" ? "bg-primary/10 text-primary" :
              "bg-muted text-muted-foreground"
            }`}>
              {novel.status}
            </span>
          </div>

          <StarRating rating={novel.rating} ratingCount={novel.ratingCount} interactive />

          <div className="flex flex-wrap gap-1.5">
            {novelGenres.map((g) => (
              <GenreBadge key={g.id} slug={g.slug} name={g.name} variant="link" />
            ))}
          </div>

          <NovelDetailActions novelId={novel.id} novelSlug={novel.slug} firstChapterNumber={chapters[0]?.number} />
        </div>
      </div>

      {/* Description */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-foreground">Giới Thiệu</h2>
        <p className="text-sm leading-relaxed text-foreground/80">{novel.description}</p>
      </section>

      {/* Chapter list */}
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-foreground">Danh Sách Chương</h2>
        <div className="rounded-lg border border-border bg-card">
          <ChapterList chapters={chapters} novelSlug={novel.slug} />
        </div>
      </section>

      {/* Comments */}
      <section className="mt-8">
        <CommentSection comments={comments} novelId={novel.id} />
      </section>
    </div>
  )
}
