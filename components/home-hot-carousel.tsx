"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Flame, Star } from "lucide-react"
import { getNovelStatusBadgeClass } from "@/lib/novel-status"
import { formatViews } from "@/lib/utils"

export type HotCarouselItem = {
    id: string
    slug: string
    title: string
    authorName: string
    description: string
    coverUrl: string | null
    totalChapters: number
    rating: number
    views: number
    status: string
    hotSource: "week" | "month" | "all"
}

function sourceLabel(source: HotCarouselItem["hotSource"]) {
    if (source === "week") return "Top tuần"
    if (source === "month") return "Top tháng"
    return "Top tổng"
}

function sourceClass(source: HotCarouselItem["hotSource"]) {
    if (source === "week") return "border-emerald-400/30 bg-emerald-500/20 text-emerald-300"
    if (source === "month") return "border-orange-400/30 bg-orange-500/20 text-orange-300"
    return "border-primary/30 bg-primary/20 text-primary"
}

function compactLine(text: string, max = 180) {
    const normalized = text.replace(/\s+/g, " ").trim()
    if (normalized.length <= max) return normalized
    return `${normalized.slice(0, max).trim()}...`
}

export function HomeHotCarousel({ items }: { items: HotCarouselItem[] }) {
    const [activeIndex, setActiveIndex] = useState(0)
    const total = items.length

    useEffect(() => {
        if (total <= 1) return

        const timer = window.setInterval(() => {
            setActiveIndex((current) => (current + 1) % total)
        }, 6500)

        return () => {
            window.clearInterval(timer)
        }
    }, [total])

    useEffect(() => {
        if (activeIndex >= total) {
            setActiveIndex(0)
        }
    }, [activeIndex, total])

    const current = useMemo(() => items[activeIndex], [items, activeIndex])
    if (!current) return null

    return (
        <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/90 shadow-[0_20px_60px_-40px_rgba(251,146,60,0.45)]">
                <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
                    {items.map((item) => (
                        <div key={item.id} className="min-w-full">
                            <Link href={`/truyen/${item.slug}`} className="group block">
                                <div className="grid gap-0 md:grid-cols-[320px_1fr]">
                                    <div className="relative h-[420px] overflow-hidden bg-muted/60 md:h-[460px]">
                                        <img
                                            src={item.coverUrl || "/default-cover.svg"}
                                            alt={item.title}
                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                                        />
                                    </div>

                                    <div className="relative flex flex-col justify-center gap-4 p-6 md:p-8">
                                        <span className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${sourceClass(item.hotSource)}`}>
                                            <Flame className="mr-1 h-3 w-3" />
                                            {sourceLabel(item.hotSource)}
                                        </span>

                                        <h2 className="text-balance text-2xl font-bold text-foreground md:text-3xl lg:text-4xl">
                                            {item.title}
                                        </h2>
                                        <p className="text-sm text-muted-foreground">Tác giả: {item.authorName}</p>
                                        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground md:line-clamp-4">
                                            {compactLine(item.description)}
                                        </p>

                                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                            <span>{item.totalChapters} chương</span>
                                            <span>{formatViews(item.views)} lượt đọc</span>
                                            <span className="inline-flex items-center gap-1 text-primary">
                                                <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                                                {item.rating.toFixed(1)}
                                            </span>
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${getNovelStatusBadgeClass(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>

                {total > 1 && (
                    <>
                        <button
                            type="button"
                            aria-label="Previous"
                            onClick={() => setActiveIndex((activeIndex - 1 + total) % total)}
                            className="absolute left-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-background/90 text-foreground/80 transition hover:bg-background"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            aria-label="Next"
                            onClick={() => setActiveIndex((activeIndex + 1) % total)}
                            className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border/80 bg-background/90 text-foreground/80 transition hover:bg-background"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </>
                )}
            </div>

            {total > 1 && (
                <div className="flex items-center justify-center gap-2">
                    {items.map((item, index) => (
                        <button
                            key={item.id}
                            type="button"
                            aria-label={`Slide ${index + 1}`}
                            onClick={() => setActiveIndex(index)}
                            className={`h-2.5 rounded-full transition-all ${index === activeIndex ? "w-8 bg-primary" : "w-2.5 bg-muted-foreground/40 hover:bg-muted-foreground/60"}`}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
