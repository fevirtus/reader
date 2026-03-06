"use client"

import { useState } from "react"
import { Star } from "lucide-react"

interface StarRatingProps {
  rating: number
  ratingCount: number
  interactive?: boolean
  novelId?: string
  onRate?: (value: number) => void
}

export function StarRating({ rating: initialRating, ratingCount: initialCount, interactive = false, novelId, onRate }: StarRatingProps) {
  const [hover, setHover] = useState(0)
  const [selected, setSelected] = useState(0)
  const [currentRating, setCurrentRating] = useState(initialRating)
  const [currentCount, setCurrentCount] = useState(initialCount)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const displayRating = hover || selected || currentRating

  const handleRate = async (star: number) => {
    if (!interactive || isSubmitting) return

    setSelected(star)

    if (onRate) {
      onRate(star)
      return
    }

    if (novelId) {
      setIsSubmitting(true)
      try {
        const res = await fetch(`/api/truyen/${novelId}/rate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score: star })
        })

        if (res.ok) {
          const data = await res.json()
          setCurrentRating(data.rating)
          setCurrentCount(data.ratingCount)
        }
      } catch (error) {
        console.error("Failed to rate", error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive || isSubmitting}
            className={`${interactive && !isSubmitting ? "cursor-pointer" : "cursor-default opacity-80"}`}
            onMouseEnter={() => interactive && !isSubmitting && setHover(star)}
            onMouseLeave={() => interactive && !isSubmitting && setHover(0)}
            onClick={() => handleRate(star)}
            aria-label={`${star} sao`}
          >
            <Star
              className={`h-4 w-4 transition-colors ${star <= displayRating
                  ? "fill-primary text-primary"
                  : "text-muted-foreground/30"
                }`}
            />
          </button>
        ))}
      </div>
      <span className="text-sm font-semibold text-foreground">{currentRating.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">({currentCount} đánh giá)</span>
    </div>
  )
}
