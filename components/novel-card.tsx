import Link from "next/link"
import { BookOpen, Eye, Star } from "lucide-react"
import { formatViews } from "@/lib/utils"

export interface CardNovel {
  id: string
  slug: string
  title: string
  authorName: string
  coverColor: string | null
  coverUrl?: string | null
  rating: number
  views: number
  totalChapters: number
  status: string
}

interface NovelCardProps {
  novel: CardNovel
  variant?: "default" | "compact"
}

export function NovelCard({ novel, variant = "default" }: NovelCardProps) {
  if (variant === "compact") {
    return (
      <Link
        href={`/truyen/${novel.slug}`}
        className="group flex gap-3 rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/30 hover:bg-accent/50"
      >
        <div className="relative h-16 w-12 shrink-0 rounded overflow-hidden">
          <img src={novel.coverUrl || "/default-cover.svg"} alt={novel.title} className="h-full w-full object-cover" />
        </div>
        <div className="flex min-w-0 flex-col justify-center">
          <h3 title={novel.title} className="line-clamp-2 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            {novel.title}
          </h3>
          <p className="text-xs text-muted-foreground">{novel.authorName}</p>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-primary text-primary" />
              {novel.rating}
            </span>
            <span>Ch. {novel.totalChapters}</span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/truyen/${novel.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all hover:border-primary/30 hover:shadow-md"
    >
      <div className="relative h-44 w-full">
        <img src={novel.coverUrl || "/default-cover.svg"} alt={novel.title} className="h-full w-full object-cover" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
        {novel.status === "Đang ra" && (
          <span className="absolute right-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
            Đang ra
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 title={novel.title} className="line-clamp-2 h-10 text-sm leading-tight font-semibold text-foreground group-hover:text-primary transition-colors">
          {novel.title}
        </h3>
        <p className="text-xs text-muted-foreground">{novel.authorName}</p>
        <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-primary text-primary" />
            {novel.rating}
          </span>
          <span className="flex items-center gap-0.5">
            <Eye className="h-3 w-3" />
            {formatViews(novel.views)}
          </span>
          <span className="ml-auto">Ch. {novel.totalChapters}</span>
        </div>
      </div>
    </Link>
  )
}
