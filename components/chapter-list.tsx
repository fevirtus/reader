import Link from "next/link"
import { Eye } from "lucide-react"
import type { Chapter } from "@/lib/types"
import { formatViews } from "@/lib/data"

interface ChapterListProps {
  chapters: Chapter[]
  novelSlug: string
}

export function ChapterList({ chapters, novelSlug }: ChapterListProps) {
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
    </div>
  )
}
