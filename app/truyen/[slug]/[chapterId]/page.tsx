import Link from "next/link"
import { notFound } from "next/navigation"
import { ChevronLeft, ChevronRight, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CommentSection } from "@/components/comment-section"
import { ReaderFAB } from "@/components/reader-fab"
import { ChapterReaderProgress } from "./chapter-reader-progress"
import { prisma } from "@/lib/prisma"
import connectToMongoDB from "@/lib/mongoose"
import { Chapter as ChapterModel } from "@/lib/models/chapter"

export const dynamic = "force-dynamic"

export default async function ChapterReaderPage({ params }: { params: Promise<{ slug: string; chapterId: string }> }) {
  const { slug, chapterId } = await params
  const chapterNumber = parseInt(chapterId, 10)

  if (isNaN(chapterNumber)) {
    notFound()
  }

  const novel = await prisma.novel.findUnique({
    where: { slug }
  })

  if (!novel) {
    notFound()
  }

  await connectToMongoDB()
  const chapter = await ChapterModel.findOne({ novelId: novel.id, number: chapterNumber }).lean()

  if (!chapter) {
    notFound()
  }

  const maxChapter = await ChapterModel.countDocuments({ novelId: novel.id })

  const commentsData = await prisma.comment.findMany({
    where: { novelId: novel.id, chapterId: chapter._id.toString() },
    include: { user: true },
    orderBy: { createdAt: "desc" }
  })

  const comments = commentsData.map(c => ({
    id: c.id,
    userId: c.user.id,
    username: c.user.name || "User",
    avatarColor: c.user.image || "bg-primary",
    novelId: c.novelId,
    chapterId: c.chapterId || undefined,
    content: c.content,
    createdAt: c.createdAt.toISOString().split("T")[0]
  }))

  // Increment chapter views quietly (fire and forget to not block render)
  ChapterModel.updateOne({ _id: chapter._id }, { $inc: { views: 1 } })
    .catch(e => console.error("Error updating chapter views:", e))

  const hasPrev = chapterNumber > 1
  const hasNext = chapterNumber < maxChapter

  // Extract paragraphs for TTS
  const paragraphs = chapter.content.split("\n").map((p: string) => p.trim()).filter(Boolean)

  return (
    <div className="mx-auto max-w-4xl lg:max-w-screen-lg px-4 py-6 md:px-8">
      {/* Top navigation */}
      <div className="mb-6 flex flex-col gap-3">
        <Link href={`/truyen/${slug}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" /> {novel.title}
        </Link>

        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-bold text-foreground md:text-xl lg:text-2xl">
            Chương {chapter.number}: {chapter.title}
          </h1>
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
      <article className="chapter-content mb-8 rounded-lg border border-border bg-card p-6 font-serif text-foreground/90 md:p-8 lg:p-12 text-justify">
        {paragraphs.map((text: string, idx: number) => (
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
      <ChapterReaderProgress novelId={novel.id} chapterId={chapter._id.toString()} chapterNumber={chapter.number} />

      {/* Comments */}
      <section className="border-t border-border pt-8">
        <CommentSection comments={comments} novelId={novel.id} chapterId={chapter._id.toString()} />
      </section>

      {/* Floating Reader Actions & TTS Player */}
      <ReaderFAB
        novelId={novel.id}
        novelSlug={slug}
        paragraphs={paragraphs}
        currentChapter={chapterNumber}
        maxChapter={maxChapter}
        chapterTitle={`Chương ${chapter.number}: ${chapter.title}`}
      />
    </div>
  )
}
