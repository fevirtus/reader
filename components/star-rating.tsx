"use client"

import { useEffect, useState } from "react"
import { Star } from "lucide-react"

interface StarRatingProps {
  rating: number
  ratingCount: number
  userRating?: number | null
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
  userRating: initialUserRating = null,
  interactive = false,
  novelId,
  onRate,
}: StarRatingProps) {
  const [hoverScore, setHoverScore] = useState(0)
  const [userRating, setUserRating] = useState<number | null>(initialUserRating)
  const [averageRating, setAverageRating] = useState(initialRating)
  const [ratingCount, setRatingCount] = useState(initialCount)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setAverageRating(initialRating)
    setRatingCount(initialCount)
    setUserRating(initialUserRating)
  }, [initialRating, initialCount, initialUserRating])

  useEffect(() => {
    if (!interactive || !novelId || initialUserRating != null) return

    let cancelled = false
    void (async () => {
      try {
        const res = await fetch(`/api/truyen/${novelId}/rate`)
        if (!res.ok) return
        const data = (await res.json()) as { userRating?: number | null }
        if (!cancelled && typeof data.userRating === "number") {
          setUserRating(data.userRating)
        }
      } catch (error) {
        console.error("Failed to load user rating", error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [interactive, novelId, initialUserRating])

  const displayRating = hoverScore || userRating || 0

  const resolveScoreFromEvent = (star: number, event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const isLeftHalf = event.clientX - rect.left < rect.width / 2
    return isLeftHalf ? star * 2 - 1 : star * 2
  }

  const handleRate = async (score: number) => {
    if (!interactive || isSubmitting) return

    if (onRate) {
      onRate(score)
      setUserRating(score)
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
          setAverageRating(data.rating)
          setRatingCount(data.ratingCount)
          if (typeof data.userRating === "number") {
            setUserRating(data.userRating)
          } else {
            setUserRating(score)
          }
        }
      } catch (error) {
        console.error("Failed to rate", error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
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
      {userRating != null && (
        <span className="text-sm font-semibold text-foreground">Bạn: {userRating.toFixed(1)}/10</span>
      )}
      <span className="text-sm text-muted-foreground">
        TB: {averageRating.toFixed(1)}/10 ({ratingCount} người)
      </span>
    </div>
  )
}
