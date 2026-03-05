"use client"

import { use, useMemo } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, ChevronRight, List } from "lucide-react"
import { getNovelBySlug, getChapter, getChaptersByNovelId, getCommentsByChapterId } from "@/lib/data"
import { Button } from "@/components/ui/button"
import { ReadingSettings } from "@/components/reading-settings"
import { CommentSection } from "@/components/comment-section"
import { TTSPlayer } from "@/components/tts-player"
import { ChapterReaderProgress } from "./chapter-reader-progress"

export default function ChapterReaderPage({ params }: { params: Promise<{ slug: string; chapterId: string }> }) {
  const { slug, chapterId } = use(params)
  const chapterNumber = parseInt(chapterId, 10)
  const novel = getNovelBySlug(slug)

  if (!novel || isNaN(chapterNumber)) {
    notFound()
  }

  const chapter = getChapter(novel.id, chapterNumber)
  const allChapters = getChaptersByNovelId(novel.id)
  const maxChapter = allChapters.length

  if (!chapter) {
    notFound()
  }

  const comments = getCommentsByChapterId(chapter.id)
  const hasPrev = chapterNumber > 1
  const hasNext = chapterNumber < maxChapter

  // Extract paragraphs for TTS
  const paragraphs = useMemo(
    () => chapter.content.split("\n").map((p) => p.trim()).filter(Boolean),
    [chapter.content]
  )

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Top navigation */}
      <div className="mb-6 flex flex-col gap-3">
        <Link href={`/truyen/${slug}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" /> {novel.title}
        </Link>

        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-bold text-foreground">
            Chương {chapter.number}: {chapter.title}
          </h1>
          <div className="flex items-center gap-2">
            <ReadingSettings />
          </div>
        </div>
      </div>

      {/* Chapter navigation top */}
      <div className="mb-6 flex items-center justify-between">
        <Button variant="outline" size="sm" disabled={!hasPrev} asChild={hasPrev}>
          {hasPrev ? (
            <Link href={`/truyen/${slug}/${chapterNumber - 1}`}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Ch. trước
            </Link>
          ) : (
            <span><ChevronLeft className="mr-1 h-4 w-4" /> Ch. trước</span>
          )}
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/truyen/${slug}`}>
            <List className="mr-1 h-4 w-4" /> Mục lục
          </Link>
        </Button>
        <Button variant="outline" size="sm" disabled={!hasNext} asChild={hasNext}>
          {hasNext ? (
            <Link href={`/truyen/${slug}/${chapterNumber + 1}`}>
              Ch. sau <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          ) : (
            <span>Ch. sau <ChevronRight className="ml-1 h-4 w-4" /></span>
          )}
        </Button>
      </div>

      {/* Chapter content */}
      <article className="chapter-content mb-8 rounded-lg border border-border bg-card p-6 font-serif text-foreground/90 md:p-8">
        {paragraphs.map((text, idx) => (
          <p key={idx} data-p-index={idx} className="mb-4 last:mb-0">
            {text}
          </p>
        ))}
      </article>

      {/* Chapter navigation bottom */}
      <div className="mb-8 flex items-center justify-between">
        <Button variant="outline" size="sm" disabled={!hasPrev} asChild={hasPrev}>
          {hasPrev ? (
            <Link href={`/truyen/${slug}/${chapterNumber - 1}`}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Chương trước
            </Link>
          ) : (
            <span><ChevronLeft className="mr-1 h-4 w-4" /> Chương trước</span>
          )}
        </Button>
        <Button variant="outline" size="sm" disabled={!hasNext} asChild={hasNext}>
          {hasNext ? (
            <Link href={`/truyen/${slug}/${chapterNumber + 1}`}>
              Chương sau <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          ) : (
            <span>Chương sau <ChevronRight className="ml-1 h-4 w-4" /></span>
          )}
        </Button>
      </div>

      {/* Save reading progress */}
      <ChapterReaderProgress novelId={novel.id} chapterId={chapter.id} chapterNumber={chapter.number} />

      {/* Comments */}
      <section className="border-t border-border pt-8">
        <CommentSection comments={comments} novelId={novel.id} chapterId={chapter.id} />
      </section>

      {/* TTS Player */}
      <TTSPlayer
        paragraphs={paragraphs}
        novelSlug={slug}
        currentChapter={chapterNumber}
        maxChapter={maxChapter}
        chapterTitle={`Chuong ${chapter.number}: ${chapter.title}`}
      />
    </div>
  )
}
