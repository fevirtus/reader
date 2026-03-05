"use client"

import Link from "next/link"
import { BookOpen, BookMarked, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useBookmarks } from "@/lib/bookmark-context"
import { getNovelById } from "@/lib/data"

export default function BookshelfPage() {
  const { user } = useAuth()
  const { bookmarks, toggleBookmark } = useBookmarks()

  if (!user) {
    return (
      <div className="flex min-h-[calc(100svh-8rem)] flex-col items-center justify-center px-4 text-center">
        <BookMarked className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <h1 className="text-xl font-bold text-foreground">Tủ Sách</h1>
        <p className="mt-2 text-sm text-muted-foreground">Đăng nhập để xem danh sách truyện đã lưu</p>
        <Button className="mt-4" asChild>
          <Link href="/dang-nhap">Đăng Nhập</Link>
        </Button>
      </div>
    )
  }

  const bookmarkedNovels = bookmarks
    .map((b) => {
      const novel = getNovelById(b.novelId)
      return novel ? { novel, bookmark: b } : null
    })
    .filter(Boolean) as Array<{ novel: NonNullable<ReturnType<typeof getNovelById>>; bookmark: typeof bookmarks[number] }>

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Tủ Sách</h1>

      {bookmarkedNovels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-lg font-medium text-muted-foreground">Chưa có truyện nào</p>
          <p className="text-sm text-muted-foreground">Hãy thêm truyện yêu thích vào tủ sách của bạn.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/">Khám phá truyện</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {bookmarkedNovels.map(({ novel, bookmark }) => {
            const readLink = bookmark.lastChapterNumber
              ? `/truyen/${novel.slug}/${bookmark.lastChapterNumber}`
              : `/truyen/${novel.slug}/1`

            return (
              <div
                key={novel.id}
                className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/20"
              >
                <Link href={`/truyen/${novel.slug}`} className={`flex h-16 w-12 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${novel.coverColor}`}>
                  <BookOpen className="h-5 w-5 text-background/80" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Link href={`/truyen/${novel.slug}`} className="truncate text-sm font-semibold text-foreground hover:text-primary transition-colors">
                    {novel.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">{novel.author}</p>
                  {bookmark.lastChapterNumber && (
                    <p className="text-xs text-muted-foreground">
                      Đang đọc: Chương {bookmark.lastChapterNumber} / {novel.totalChapters}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button size="sm" asChild>
                    <Link href={readLink}>
                      {bookmark.lastChapterNumber ? "Đọc tiếp" : "Đọc"}
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => toggleBookmark(novel.id)}
                    aria-label="Xóa khỏi tủ sách"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
