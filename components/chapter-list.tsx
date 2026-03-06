import Link from "next/link"
import { Eye } from "lucide-react"
import type { Chapter } from "@/lib/types"
import { formatViews } from "@/lib/utils"

interface ChapterListProps {
  chapters: {
    id: string
    novelId: string
    number: number
    title: string
    createdAt: string
    views: number
  }[]
  novelSlug: string
  currentPage: number
  totalPages: number
  totalChapters: number
}

const generatePagination = (currentPage: number, totalPages: number) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  if (currentPage <= 3) {
    return [1, 2, 3, 4, '...', totalPages]
  }
  if (currentPage >= totalPages - 2) {
    return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }
  return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
}

export function ChapterList({ chapters, novelSlug, currentPage, totalPages, totalChapters }: ChapterListProps) {
  return (
    <div className="flex flex-col">
      {chapters.map((chapter) => (
        <Link
          key={chapter.id}
          href={`/truyen/${novelSlug}/${chapter.number}`}
          className="flex items-center justify-between border-b border-border px-2 py-3 text-sm transition-colors hover:bg-muted/50 last:border-0"
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="shrink-0 font-medium text-muted-foreground">Ch. {chapter.number}</span>
            <span className="truncate text-foreground">{chapter.title}</span>
          </div>
          <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
            <span className="hidden items-center gap-1 sm:flex">
              <Eye className="h-3 w-3" />
              {formatViews(chapter.views)}
            </span>
            <span>{chapter.createdAt}</span>
          </div>
        </Link>
      ))}

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border p-4 bg-muted/10">
          <div className="text-sm text-muted-foreground">
            Trang <span className="font-medium text-foreground">{currentPage}</span> / {totalPages} (Tổng {totalChapters} chương)
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={currentPage > 1 ? `/truyen/${novelSlug}?page=${currentPage - 1}` : '#'}
              className={`inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md border border-input px-3 text-sm font-medium shadow-sm transition-colors ${currentPage <= 1 ? 'pointer-events-none opacity-50 bg-muted/50 text-muted-foreground' : 'bg-background hover:bg-accent hover:text-accent-foreground'}`}
              aria-disabled={currentPage <= 1}
            >
              Trước
            </Link>

            {generatePagination(currentPage, totalPages).map((p, i) => (
              <div key={i} className="hidden sm:block">
                {p === '...' ? (
                  <span className="px-2 text-muted-foreground">...</span>
                ) : (
                  <Link
                    href={`/truyen/${novelSlug}?page=${p}`}
                    className={`inline-flex h-9 w-9 items-center justify-center whitespace-nowrap rounded-md border text-sm font-medium shadow-sm transition-colors ${currentPage === p ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' : 'bg-background border-input hover:bg-accent hover:text-accent-foreground'}`}
                  >
                    {p}
                  </Link>
                )}
              </div>
            ))}

            <Link
              href={currentPage < totalPages ? `/truyen/${novelSlug}?page=${currentPage + 1}` : '#'}
              className={`inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md border border-input px-3 text-sm font-medium shadow-sm transition-colors ${currentPage >= totalPages ? 'pointer-events-none opacity-50 bg-muted/50 text-muted-foreground' : 'bg-background hover:bg-accent hover:text-accent-foreground'}`}
              aria-disabled={currentPage >= totalPages}
            >
              Sau
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
