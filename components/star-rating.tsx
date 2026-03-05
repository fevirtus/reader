"use client"

import { useState } from "react"
import { Star } from "lucide-react"

interface StarRatingProps {
  rating: number
  ratingCount: number
  interactive?: boolean
  onRate?: (value: number) => void
}

export function StarRating({ rating, ratingCount, interactive = false, onRate }: StarRatingProps) {
  const [hover, setHover] = useState(0)
  const [selected, setSelected] = useState(0)

  const displayRating = hover || selected || rating

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            className={`${interactive ? "cursor-pointer" : "cursor-default"}`}
            onMouseEnter={() => interactive && setHover(star)}
            onMouseLeave={() => interactive && setHover(0)}
            onClick={() => {
              if (interactive && onRate) {
                setSelected(star)
                onRate(star)
              }
            }}
            aria-label={`${star} sao`}
          >
            <Star
              className={`h-4 w-4 transition-colors ${
                star <= displayRating
                  ? "fill-primary text-primary"
                  : "text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
      </div>
      <span className="text-sm font-semibold text-foreground">{rating.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">({ratingCount} đánh giá)</span>
    </div>
  )
}
