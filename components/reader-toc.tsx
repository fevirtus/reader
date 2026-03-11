"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { List, Loader2, ChevronLeft, ChevronRight } from "lucide-react"

interface ReaderTOCProps {
  novelId: string
  novelSlug: string
  currentChapterNumber: number
}

interface TOCChapter {
  id: string
  number: number
  title: string
  volumeNumber?: number | null
  volumeTitle?: string | null
  volumeChapterNumber?: number | null
}

export function ReaderTOC({ novelId, novelSlug, currentChapterNumber }: ReaderTOCProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [chapters, setChapters] = useState<TOCChapter[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Each page will fetch 100 chapters to make scrolling efficient
  const ITEMS_PER_PAGE = 100

  // Calculate the initial page where the current chapter belongs
  useEffect(() => {
    const initialPage = Math.ceil(currentChapterNumber / ITEMS_PER_PAGE)
    setCurrentPage(initialPage || 1)
  }, [currentChapterNumber])

  // Fetch chapters when page changes and TOC is open
  useEffect(() => {
    if (!isOpen) return

    const fetchChapters = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/truyen/${novelId}/chapters?page=${currentPage}&limit=${ITEMS_PER_PAGE}`)
        if (res.ok) {
          const data = await res.json()
          setChapters(data.chapters)
          setTotalPages(data.totalPages)
        }
      } catch (error) {
        console.error("Failed to load chapters for TOC", error)
      } finally {
        setLoading(false)
      }
    }

    fetchChapters()
  }, [isOpen, currentPage, novelId])

  // Optional: Auto-scroll to the current chapter on initial load
  useEffect(() => {
    if (!loading && isOpen && chapters.length > 0) {
      setTimeout(() => {
        const activeItem = document.getElementById(`toc-chap-${currentChapterNumber}`)
        if (activeItem) {
          activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }, [loading, isOpen, chapters, currentChapterNumber])


  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="relative h-10 w-10 rounded-full shadow-md group md:h-12 md:w-12"
        >
          <List className="h-4 w-4 md:h-5 md:w-5" />
          <span className="absolute right-full mr-3 hidden whitespace-nowrap rounded bg-foreground/90 px-2 py-1 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100 md:inline">
            Mục lục
          </span>
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[300px] sm:w-[350px] flex flex-col p-4">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle>Mục lục chương</SheetTitle>
          <SheetDescription className="sr-only">Danh sách mục lục chương được liệt kê theo danh sách để điều hướng thuận tiện</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar -mx-4 px-4 py-2 space-y-1 relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            (() => {
              let lastVolumeKey: string | null = null
              return chapters.map((chap) => {
              const isActive = chap.number === currentChapterNumber
              const volumeKey = chap.volumeNumber || chap.volumeTitle
                ? `${chap.volumeNumber ?? "no-num"}-${chap.volumeTitle ?? "no-title"}`
                : null
              const showVolumeHeader = volumeKey !== null && volumeKey !== lastVolumeKey
              if (volumeKey !== null) {
                lastVolumeKey = volumeKey
              }

              return (
                <div key={chap.id}>
                  {showVolumeHeader && (
                    <div className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-primary">
                      {chap.volumeTitle || `Quyển ${chap.volumeNumber}`}
                    </div>
                  )}
                  <Link
                    id={`toc-chap-${chap.number}`}
                    href={`/truyen/${novelSlug}/${chap.number}`}
                    onClick={() => setIsOpen(false)}
                    className={`block px-3 py-2 text-sm rounded-md transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'hover:bg-muted text-foreground/80'
                    }`}
                  >
                    <span className={isActive ? "text-primary-foreground/90 font-bold mr-2 lg:mr-3" : "text-muted-foreground mr-2 lg:mr-3"}>
                      {chap.volumeChapterNumber || chap.number}.
                    </span>
                    <span className="truncate inline-block align-bottom max-w-[80%]">{chap.title}</span>
                  </Link>
                </div>
              )
              })
            })()
          )}
        </div>

        {/* Pagination Details */}
        {totalPages > 1 && (
          <div className="pt-4 border-t flex items-center justify-between gap-2 mt-auto">
            <Button 
               variant="outline" 
               size="icon" 
               className="h-8 w-8"
               disabled={currentPage <= 1 || loading}
               onClick={() => setCurrentPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">
              Trang {currentPage} / {totalPages}
            </span>
            <Button 
               variant="outline" 
               size="icon" 
               className="h-8 w-8"
               disabled={currentPage >= totalPages || loading}
               onClick={() => setCurrentPage(p => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
