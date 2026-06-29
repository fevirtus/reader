"use client"

import { useState } from "react"
import Link from "next/link"
import { BookOpen, Trash2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { useBookmarks } from "@/lib/bookmark-context"
import { getNovelStatusBadgeClass } from "@/lib/novel-status"
import { resolveBookshelfShelfStatus } from "@/lib/bookshelf-status"
import { cn } from "@/lib/utils"

type Tab = "dang-doc" | "da-doc"

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "dang-doc", label: "Đang đọc", icon: <BookOpen className="h-4 w-4" /> },
  { id: "da-doc", label: "Đã đọc", icon: <CheckCircle2 className="h-4 w-4" /> },
]

function NovelRow({
  coverUrl,
  title,
  slug,
  authorName,
  status,
  extra,
  action,
  onRemove,
  removeLabel,
}: {
  coverUrl?: string
  title: string
  slug: string
  authorName: string
  status: string
  extra?: React.ReactNode
  action: React.ReactNode
  onRemove: () => void
  removeLabel: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/20">
      <Link href={`/truyen/${slug}`}>
        <img
          src={coverUrl || "/default-cover.svg"}
          alt={title}
          className="h-16 w-12 shrink-0 rounded-md bg-muted object-contain hover:opacity-90"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link
          title={title}
          href={`/truyen/${slug}`}
          className="truncate text-sm font-semibold text-foreground hover:text-primary transition-colors"
        >
          {title}
        </Link>
        <p className="text-xs text-muted-foreground">{authorName}</p>
        <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${getNovelStatusBadgeClass(status)}`}>
          {status}
        </span>
        {extra}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {action}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          aria-label={removeLabel}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <BookOpen className="mb-3 h-8 w-8 text-muted-foreground/40" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export default function BookshelfPage() {
  const { user } = useAuth()
  const { bookmarks, removeBookmark } = useBookmarks()
  const [activeTab, setActiveTab] = useState<Tab>("dang-doc")

  if (!user) {
    return (
      <div className="flex min-h-[calc(100svh-8rem)] flex-col items-center justify-center px-4 text-center">
        <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <h1 className="text-xl font-bold text-foreground">Tủ Sách</h1>
        <p className="mt-2 text-sm text-muted-foreground">Đăng nhập để xem danh sách truyện đã lưu</p>
        <Button className="mt-4" asChild>
          <Link href="/dang-nhap">Đăng Nhập</Link>
        </Button>
      </div>
    )
  }

  const withNovel = bookmarks.filter((b) => b.novel).map((b) => ({ novel: b.novel as any, bookmark: b }))

  const dangDocList = withNovel.filter(
    ({ bookmark, novel }) => resolveBookshelfShelfStatus(bookmark, novel) === "reading",
  )
  const daDocList = withNovel.filter(
    ({ bookmark, novel }) => resolveBookshelfShelfStatus(bookmark, novel) === "completed",
  )

  const counts: Record<Tab, number> = {
    "dang-doc": dangDocList.length,
    "da-doc": daDocList.length,
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Tủ Sách</h1>

      <div className="flex gap-6">
        <aside className="hidden w-44 shrink-0 sm:block">
          <nav className="flex flex-col gap-1">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left",
                  activeTab === tab.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {tab.icon}
                <span className="flex-1">{tab.label}</span>
                {counts[tab.id] > 0 && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                      activeTab === tab.id ? "bg-primary/20 text-primary" : "bg-muted-foreground/20 text-muted-foreground",
                    )}
                  >
                    {counts[tab.id]}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        <div className="mb-4 flex w-full gap-1 sm:hidden">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-medium transition-colors",
                activeTab === tab.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          {activeTab === "dang-doc" &&
            (dangDocList.length === 0 ? (
              <EmptyState message="Bạn chưa bắt đầu đọc truyện nào." />
            ) : (
              <div className="flex flex-col gap-3">
                {dangDocList.map(({ novel, bookmark }) => (
                  <NovelRow
                    key={novel.id}
                    coverUrl={novel.coverUrl}
                    title={novel.title}
                    slug={novel.slug}
                    authorName={novel.authorName}
                    status={novel.status}
                    action={
                      <Button size="sm" asChild>
                        <Link href={`/truyen/${novel.slug}/${bookmark.lastChapterNumber}`}>Đọc tiếp</Link>
                      </Button>
                    }
                    extra={
                      <p className="text-xs text-muted-foreground">
                        Chương {bookmark.lastChapterNumber} / {novel.totalChapters}
                      </p>
                    }
                    onRemove={() => void removeBookmark(novel.id)}
                    removeLabel="Xóa khỏi tủ sách"
                  />
                ))}
              </div>
            ))}

          {activeTab === "da-doc" &&
            (daDocList.length === 0 ? (
              <EmptyState message="Bạn chưa hoàn thành truyện nào." />
            ) : (
              <div className="flex flex-col gap-3">
                {daDocList.map(({ novel, bookmark }) => (
                  <NovelRow
                    key={novel.id}
                    coverUrl={novel.coverUrl}
                    title={novel.title}
                    slug={novel.slug}
                    authorName={novel.authorName}
                    status={novel.status}
                    action={
                      <Button size="sm" disabled className="cursor-default">
                        Đã đọc
                      </Button>
                    }
                    extra={
                      <p className="text-xs text-muted-foreground">
                        {bookmark.markedAsRead ? "Đánh dấu đã đọc" : `Đã đọc hết ${novel.totalChapters} chương`}
                      </p>
                    }
                    onRemove={() => void removeBookmark(novel.id)}
                    removeLabel="Xóa khỏi tủ sách"
                  />
                ))}
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
