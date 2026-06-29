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

const STAR_COUNT = 5

function starFillValue(starIndex: number, displayRating: number): number {
  const threshold = starIndex * 2
  if (displayRating >= threshold) return 1
  if (displayRating >= threshold - 1) return 0.5
  return 0
}

export function StarRating({
  rating: initialRating,
  ratingCount: initialCount,
  interactive = false,
  novelId,
  onRate,
}: StarRatingProps) {
  const [hoverScore, setHoverScore] = useState(0)
  const [selectedScore, setSelectedScore] = useState(0)
  const [currentRating, setCurrentRating] = useState(initialRating)
  const [currentCount, setCurrentCount] = useState(initialCount)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const displayRating = hoverScore || selectedScore || currentRating

  const resolveScoreFromEvent = (star: number, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const isLeftHalf = event.clientX - rect.left < rect.width / 2
    return isLeftHalf ? star * 2 - 1 : star * 2
  }

  const handleRate = async (score: number) => {
    if (!interactive || isSubmitting) return

    setSelectedScore(score)

    if (onRate) {
      onRate(score)
      return
    }

    if (novelId) {
      setIsSubmitting(true)
      try {
        const res = await fetch(`/api/truyen/${novelId}/rate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ score }),
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
        {Array.from({ length: STAR_COUNT }, (_, index) => {
          const star = index + 1
          const fill = starFillValue(star, displayRating)
          return (
            <button
              key={star}
              type="button"
              disabled={!interactive || isSubmitting}
              className={`relative ${interactive && !isSubmitting ? "cursor-pointer" : "cursor-default opacity-80"}`}
              onMouseEnter={(event) => interactive && !isSubmitting && setHoverScore(resolveScoreFromEvent(star, event))}
              onMouseMove={(event) => interactive && !isSubmitting && setHoverScore(resolveScoreFromEvent(star, event))}
              onMouseLeave={() => interactive && !isSubmitting && setHoverScore(0)}
              onClick={(event) => void handleRate(resolveScoreFromEvent(star, event))}
              aria-label={`${star} sao`}
            >
              <Star className="h-4 w-4 text-muted-foreground/30" />
              <span
                className="pointer-events-none absolute inset-0 overflow-hidden"
                style={{ width: fill === 0.5 ? "50%" : fill === 1 ? "100%" : "0%" }}
              >
                <Star className="h-4 w-4 fill-primary text-primary" />
              </span>
            </button>
          )
        })}
      </div>
      <span className="text-sm font-semibold text-foreground">{currentRating.toFixed(1)}/10</span>
      <span className="text-xs text-muted-foreground">({currentCount} đánh giá)</span>
    </div>
  )
}
