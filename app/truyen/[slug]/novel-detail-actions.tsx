"use client"

import Link from "next/link"
import { BookOpen, BookMarked, BookmarkCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useBookmarks } from "@/lib/bookmark-context"

interface NovelDetailActionsProps {
  novelId: string
  novelSlug: string
  firstChapterNumber?: number
}

export function NovelDetailActions({ novelId, novelSlug, firstChapterNumber }: NovelDetailActionsProps) {
  const { user } = useAuth()
  const { isBookmarked, toggleBookmark, getProgress } = useBookmarks()

  const bookmarked = isBookmarked(novelId)
  const progress = getProgress(novelId)

  const readLink = progress?.lastChapterNumber
    ? `/truyen/${novelSlug}/${progress.lastChapterNumber}`
    : firstChapterNumber
    ? `/truyen/${novelSlug}/${firstChapterNumber}`
    : "#"

  return (
    <div className="flex flex-wrap gap-2 pt-1">
      <Button asChild>
        <Link href={readLink}>
          <BookOpen className="mr-1.5 h-4 w-4" />
          {progress?.lastChapterNumber ? `Đọc tiếp Ch. ${progress.lastChapterNumber}` : "Đọc Truyện"}
        </Link>
      </Button>
      {user ? (
        <Button variant={bookmarked ? "secondary" : "outline"} onClick={() => toggleBookmark(novelId)}>
          {bookmarked ? <BookmarkCheck className="mr-1.5 h-4 w-4" /> : <BookMarked className="mr-1.5 h-4 w-4" />}
          {bookmarked ? "Đã Lưu" : "Lưu Truyện"}
        </Button>
      ) : (
        <Button variant="outline" asChild>
          <Link href="/dang-nhap">
            <BookMarked className="mr-1.5 h-4 w-4" />
            Lưu Truyện
          </Link>
        </Button>
      )}
    </div>
  )
}
