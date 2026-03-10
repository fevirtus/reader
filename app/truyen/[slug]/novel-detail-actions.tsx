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
    <div className="flex flex-wrap gap-3">
      <Button asChild className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 border-0 shadow-sm">
        <Link href={readLink}>
          <BookOpen className="mr-2 h-4 w-4" />
          {progress?.lastChapterNumber ? `Đọc tiếp Ch. ${progress.lastChapterNumber}` : "Đọc truyện"}
        </Link>
      </Button>
      {user ? (
        <Button 
          variant="outline" 
          onClick={() => toggleBookmark(novelId)}
          className={`font-semibold px-4 border ${bookmarked ? 'bg-primary/10 border-primary text-primary hover:bg-primary/20' : 'bg-[#334155] hover:bg-[#475569] text-white border-transparent'}`}
        >
          {bookmarked ? <BookmarkCheck className="mr-2 h-4 w-4 fill-primary" /> : <BookMarked className="mr-2 h-4 w-4" />}
          {bookmarked ? "Đã Đánh dấu" : "Đánh dấu"}
        </Button>
      ) : (
        <Button variant="outline" asChild className="font-semibold px-4 border-transparent bg-[#334155] hover:bg-[#475569] text-white">
          <Link href="/dang-nhap">
            <BookMarked className="mr-2 h-4 w-4" />
            Đánh dấu
          </Link>
        </Button>
      )}
      
      {/* Mocking ThumbsUp (Đề cử) button */}
      <Button variant="outline" className="font-semibold px-4 border-transparent bg-[#334155] hover:bg-[#475569] text-white" onClick={() => alert("Chức năng đề cử đang phát triển.")}>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 h-4 w-4"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>
        Đề cử
      </Button>
    </div>
  )
}
