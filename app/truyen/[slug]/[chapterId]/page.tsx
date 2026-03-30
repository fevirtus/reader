import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, ChevronRight, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CommentSection } from "@/components/comment-section"
import { ReaderFAB } from "@/components/reader-fab"
import { ChapterReaderProgress } from "./chapter-reader-progress"
import { readerApiFetch, readerApiFetchNullable } from "@/lib/server-api"

export const dynamic = "force-dynamic"

type NovelDetail = {
  id: string
  title: string
  slug: string
}

type ChapterDetail = {
  id: string
  novelId: string
  number: number
  title: string
  content: string
  volumeNumber?: number | null
  volumeTitle?: string | null
  volumeChapterNumber?: number | null
  prevChapterNumber?: number | null
  nextChapterNumber?: number | null
  maxChapter: number
}

type CommentsResponse = {
  comments: Array<{
    id: string
    userId: string
    username: string
    content: string
    chapterId?: string | null
    createdAt: string | null
  }>
}

export default async function ChapterReaderPage({ params }: { params: Promise<{ slug: string; chapterId: string }> }) {
  const { slug, chapterId } = await params
  const chapterNumber = parseInt(chapterId, 10)

  if (isNaN(chapterNumber)) {
    notFound()
  }

  const novel = await readerApiFetchNullable<NovelDetail>(`/api/novels/${encodeURIComponent(slug)}`)
  if (!novel) {
    notFound()
  }

  const chapter = await readerApiFetchNullable<ChapterDetail>(`/api/truyen/${encodeURIComponent(novel.id)}/chapters/by-number/${chapterNumber}`)
  if (!chapter) {
    notFound()
  }

  const commentsData = await readerApiFetch<CommentsResponse>(
    `/api/truyen/${encodeURIComponent(novel.id)}/comments?chapterId=${encodeURIComponent(chapter.id)}&page=1&limit=50`
  )

  const comments = commentsData.comments.map((comment) => ({
    id: comment.id,
    userId: comment.userId,
    username: comment.username || "User",
    avatarColor: "bg-primary",
    novelId: novel.id,
    chapterId: comment.chapterId || undefined,
    content: comment.content,
    createdAt: comment.createdAt ? comment.createdAt.split("T")[0] : "",
  }))

  const hasPrev = Boolean(chapter.prevChapterNumber)
  const hasNext = Boolean(chapter.nextChapterNumber)
  const paragraphs = chapter.content.split("\n").map((p: string) => p.trim()).filter(Boolean)
  const chapterLabel = chapter.volumeChapterNumber ? `Chương ${chapter.volumeChapterNumber}` : `Chương ${chapter.number}`
  const volumeLabel = chapter.volumeTitle || (chapter.volumeNumber ? `Quyển ${chapter.volumeNumber}` : null)

  return (
    <div className="mx-auto max-w-4xl px-3 py-4 md:px-8 md:py-6 lg:max-w-screen-lg">
      <div className="mb-6 flex flex-col gap-3">
        <Link href={`/truyen/${slug}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> {novel.title}
        </Link>

        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-bold text-foreground md:text-xl lg:text-2xl">
            {volumeLabel ? `${volumeLabel} - ` : ""}{chapterLabel}: {chapter.title}
          </h1>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between gap-2">
        <Button variant="outline" size="sm" disabled={!hasPrev} asChild={hasPrev}>
          {hasPrev ? (
            <Link href={`/truyen/${slug}/${chapter.prevChapterNumber}`}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">Ch. trước</span>
              <span className="sm:hidden">Trước</span>
            </Link>
          ) : (
            <span>
              <ChevronLeft className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">Ch. trước</span>
              <span className="sm:hidden">Trước</span>
            </span>
          )}
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/truyen/${slug}`}>
            <List className="mr-1 h-4 w-4" /> Mục lục
          </Link>
        </Button>
        <Button variant="outline" size="sm" disabled={!hasNext} asChild={hasNext}>
          {hasNext ? (
            <Link href={`/truyen/${slug}/${chapter.nextChapterNumber}`}>
              <span className="hidden sm:inline">Ch. sau</span>
              <span className="sm:hidden">Sau</span>
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          ) : (
            <span>
              <span className="hidden sm:inline">Ch. sau</span>
              <span className="sm:hidden">Sau</span>
              <ChevronRight className="ml-1 h-4 w-4" />
            </span>
          )}
        </Button>
      </div>

      <article className="chapter-content mb-8 rounded-lg border border-border bg-card p-4 font-serif text-foreground/90 text-justify md:p-8 lg:p-12">
        {paragraphs.map((text: string, idx: number) => (
          <p key={idx} data-p-index={idx} className="mb-4 last:mb-0">
            {text}
          </p>
        ))}
      </article>

      <div className="mb-8 flex items-center justify-between gap-2">
        <Button variant="outline" size="sm" disabled={!hasPrev} asChild={hasPrev}>
          {hasPrev ? (
            <Link href={`/truyen/${slug}/${chapter.prevChapterNumber}`}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">Chương trước</span>
              <span className="sm:hidden">Trước</span>
            </Link>
          ) : (
            <span>
              <ChevronLeft className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">Chương trước</span>
              <span className="sm:hidden">Trước</span>
            </span>
          )}
        </Button>
        <Button variant="outline" size="sm" disabled={!hasNext} asChild={hasNext}>
          {hasNext ? (
            <Link href={`/truyen/${slug}/${chapter.nextChapterNumber}`}>
              <span className="hidden sm:inline">Chương sau</span>
              <span className="sm:hidden">Sau</span>
              <ChevronRight className="ml-1 h-4 w-4" />
            </Link>
          ) : (
            <span>
              <span className="hidden sm:inline">Chương sau</span>
              <span className="sm:hidden">Sau</span>
              <ChevronRight className="ml-1 h-4 w-4" />
            </span>
          )}
        </Button>
      </div>

      <ChapterReaderProgress novelId={novel.id} chapterId={chapter.id} chapterNumber={chapter.number} />

      <section className="border-t border-border pt-8">
        <CommentSection comments={comments} novelId={novel.id} chapterId={chapter.id} />
      </section>

      <ReaderFAB
        novelId={novel.id}
        novelSlug={slug}
        paragraphs={paragraphs}
        currentChapter={chapterNumber}
        maxChapter={chapter.maxChapter}
        chapterTitle={`${volumeLabel ? `${volumeLabel} - ` : ""}${chapterLabel}: ${chapter.title}`}
      />
    </div>
  )
}
