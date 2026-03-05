import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface GenreBadgeProps {
  slug: string
  name: string
  variant?: "default" | "link"
}

export function GenreBadge({ slug, name, variant = "default" }: GenreBadgeProps) {
  if (variant === "link") {
    return (
      <Link href={`/the-loai/${slug}`}>
        <Badge variant="secondary" className="cursor-pointer transition-colors hover:bg-primary hover:text-primary-foreground">
          {name}
        </Badge>
      </Link>
    )
  }

  return (
    <Badge variant="secondary">
      {name}
    </Badge>
  )
}
