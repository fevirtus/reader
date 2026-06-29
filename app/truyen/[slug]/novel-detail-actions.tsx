"use client"

import Link from "next/link"
import { BookOpen, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useBookmarks } from "@/lib/bookmark-context"
import { isBookshelfCompleted } from "@/lib/bookshelf-status"
import { toast } from "sonner"

interface NovelDetailActionsProps {
  novelId: string
  novelSlug: string
  firstChapterNumber?: number
  totalChapters?: number
}

export function NovelDetailActions({
  novelId,
  novelSlug,
  firstChapterNumber,
  totalChapters,
}: NovelDetailActionsProps) {
  const { user } = useAuth()
  const { getProgress, markAsRead } = useBookmarks()

  const progress = getProgress(novelId)
  const novelMeta = totalChapters != null ? { totalChapters } : undefined
  const completed = progress ? isBookshelfCompleted(progress, novelMeta) : false

  const readLink = progress?.lastChapterNumber
    ? `/truyen/${novelSlug}/${progress.lastChapterNumber}`
    : firstChapterNumber
      ? `/truyen/${novelSlug}/${firstChapterNumber}`
      : "#"

  const handleMarkAsRead = async () => {
    try {
      await markAsRead(novelId)
      toast.success("Đã đánh dấu truyện đã đọc")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể đánh dấu đã đọc")
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {completed ? (
        <Button disabled className="bg-muted text-muted-foreground font-bold px-6 border-0 shadow-sm cursor-default">
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Đã đọc
        </Button>
      ) : (
        <Button asChild className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 border-0 shadow-sm">
          <Link href={readLink}>
            <BookOpen className="mr-2 h-4 w-4" />
            {progress?.lastChapterNumber ? `Đọc tiếp Ch. ${progress.lastChapterNumber}` : "Đọc từ đầu"}
          </Link>
        </Button>
      )}

      {user && !completed ? (
        <Button
          variant="outline"
          onClick={() => void handleMarkAsRead()}
          className="font-semibold px-4 border-transparent bg-[#334155] hover:bg-[#475569] text-white"
        >
          <CheckCircle2 className="mr-2 h-4 w-4" />
          Đánh dấu đã đọc
        </Button>
      ) : !user ? (
        <Button variant="outline" asChild className="font-semibold px-4 border-transparent bg-[#334155] hover:bg-[#475569] text-white">
          <Link href="/dang-nhap">
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Đánh dấu đã đọc
          </Link>
        </Button>
      ) : null}
    </div>
  )
}
