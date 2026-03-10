import Link from "next/link"
import { BookOpen, Sparkles, Flame, Heart, Swords, Building2, Rocket, Crown, Laugh, Search, Shield } from "lucide-react"
import { prisma } from "@/lib/prisma"

const iconMap: Record<string, React.ReactNode> = {
  Sparkles: <Sparkles className="h-6 w-6" />,
  Flame: <Flame className="h-6 w-6" />,
  Heart: <Heart className="h-6 w-6" />,
  Sword: <Swords className="h-6 w-6" />,
  Building: <Building2 className="h-6 w-6" />,
  Rocket: <Rocket className="h-6 w-6" />,
  Crown: <Crown className="h-6 w-6" />,
  Laugh: <Laugh className="h-6 w-6" />,
  Search: <Search className="h-6 w-6" />,
  Shield: <Shield className="h-6 w-6" />,
}

export const dynamic = "force-dynamic"

export default async function GenresPage() {
  let genres: any[] = []

  try {
    genres = await prisma.genre.findMany({
      include: {
        _count: {
          select: { novels: true }
        }
      }
    })
  } catch (error) {
    console.error("Failed to fetch genres during build/runtime", error)
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">Thể Loại Truyện</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {genres.map((genre) => {
          const novelCount = genre._count.novels
          return (
            <Link
              key={genre.id}
              href={`/the-loai/${genre.slug}`}
              className="group flex items-start gap-4 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                {genre.icon && iconMap[genre.icon] ? iconMap[genre.icon] : <BookOpen className="h-6 w-6" />}
              </span>
              <div>
                <h2 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">{genre.name}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{genre.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">{novelCount} truyện</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
