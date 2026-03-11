import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { NovelCard } from "@/components/novel-card"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

function collapseSeriesRows<T extends { id: string; seriesId?: string | null }>(rows: T[]): T[] {
  const pickedSeries = new Set<string>()
  const output: T[] = []

  for (const row of rows) {
    if (!row.seriesId) {
      output.push(row)
      continue
    }

    if (pickedSeries.has(row.seriesId)) continue
    pickedSeries.add(row.seriesId)
    output.push(row)
  }

  return output
}

export default async function GenreDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const genre = await prisma.genre.findUnique({
    where: { slug }
  })

  if (!genre) {
    notFound()
  }

  const allNovelsRaw = await prisma.novel.findMany({
    where: {
      genres: {
        some: {
          genreId: genre.id
        }
      }
    },
    select: {
      id: true,
      slug: true,
      title: true,
      authorName: true,
      coverColor: true,
      coverUrl: true,
      rating: true,
      views: true,
      totalChapters: true,
      status: true,
      seriesId: true,
    },
    orderBy: {
      updatedAt: "desc"
    },
    take: 80
  })

  const allNovels = collapseSeriesRows(allNovelsRaw).slice(0, 20)

  // Basic layout without sort for purely server side representation without search params. Optional searchParams can be added later if needed.
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6">
        <Link href="/the-loai" className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="h-4 w-4" /> Thể Loại
        </Link>
        <h1 className="text-2xl font-bold text-foreground">{genre.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{genre.description}</p>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{allNovels.length} truyện</p>
        <div className="w-40" /> {/* Spacer for symmetry if we add sort later */}
      </div>

      {allNovels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <p className="text-lg font-medium">Chưa có truyện nào</p>
          <p className="text-sm">Thể loại này chưa có truyện, hãy quay lại sau.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {allNovels.map((novel) => (
            <NovelCard key={novel.id} novel={novel} />
          ))}
        </div>
      )}
    </div>
  )
}
