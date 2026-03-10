"use client"

import { useState, useEffect } from "react"
import { List, Settings2, Headphones, X, Settings, Menu, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { ReadingSettingsContent } from "./reading-settings"
import { TTSPlayer } from "./tts-player"
import { ReaderTOC } from "./reader-toc"

interface ReaderFABProps {
  novelId: string
  novelSlug: string
  // TTS Props
  paragraphs: string[]
  currentChapter: number
  maxChapter: number
  chapterTitle: string
}

export function ReaderFAB({ novelId, novelSlug, paragraphs, currentChapter, maxChapter, chapterTitle }: ReaderFABProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isTTSOpen, setIsTTSOpen] = useState(false)
  const [isTTSExpanded, setIsTTSExpanded] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Reading settings state lifted up for persistence
  const [fontSize, setFontSize] = useState(18)
  const [lineHeight, setLineHeight] = useState(1.8)
  const [letterSpacing, setLetterSpacing] = useState(0)

  return (
    <>
      <div className={cn(
        "fixed right-6 z-50 flex flex-col items-center gap-3 transition-all duration-300",
        isTTSOpen ? (isTTSExpanded ? "bottom-[12rem]" : "bottom-24") : "bottom-6"
      )}>
      {/* Main FAB Toggle (Mobile mostly, but works as container) */}
      <Button
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Action Items */}
      <div 
        className={cn(
          "flex flex-col gap-3 transition-all duration-300 origin-bottom center",
          isOpen ? "scale-100 opacity-100" : "scale-0 opacity-0 pointer-events-none md:scale-100 md:opacity-100 md:pointer-events-auto"
        )}
      >
        {/* TTS Toggle */}
        <Button
          variant={isTTSOpen ? "default" : "secondary"}
          size="icon"
          className="h-12 w-12 rounded-full shadow-md relative group"
          onClick={() => {
            setIsTTSOpen(!isTTSOpen)
            setIsOpen(false)
          }}
        >
          <Headphones className="h-5 w-5" />
          <span className="absolute right-full mr-3 whitespace-nowrap rounded bg-foreground/90 px-2 py-1 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100">
            {isTTSOpen ? "Đóng Audio" : "Nghe Audio"}
          </span>
        </Button>

        {/* TOC */}
        <ReaderTOC 
          novelId={novelId} 
          novelSlug={novelSlug} 
          currentChapterNumber={currentChapter} 
        />

        {/* Settings */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="h-12 w-12 rounded-full shadow-md relative group"
            >
              <Settings2 className="h-5 w-5" />
              <span className="absolute right-full mr-3 whitespace-nowrap rounded bg-foreground/90 px-2 py-1 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100">
                Tùy chỉnh
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 mb-2 mr-4 flex" align="end" side="left">
            <ReadingSettingsContent 
              fontSize={fontSize} setFontSize={setFontSize}
              lineHeight={lineHeight} setLineHeight={setLineHeight}
              letterSpacing={letterSpacing} setLetterSpacing={setLetterSpacing}
            />
          </PopoverContent>
        </Popover>

        {/* Scroll to Top */}
        <Button
          variant="secondary"
          size="icon"
          className={cn(
            "h-12 w-12 rounded-full shadow-md relative group transition-all duration-300",
            showScrollTop ? "opacity-100 scale-100" : "opacity-0 scale-0 pointer-events-none"
          )}
          onClick={handleScrollToTop}
        >
          <ArrowUp className="h-5 w-5" />
          <span className="absolute right-full mr-3 whitespace-nowrap rounded bg-foreground/90 px-2 py-1 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100">
            Lên đầu trang
          </span>
        </Button>
      </div>
    </div>

    {/* Inject styles OUTSIDE the popover so it survives */}
    <style>{`
      .chapter-content {
        font-size: ${fontSize}px !important;
        line-height: ${lineHeight} !important;
        letter-spacing: ${letterSpacing}px !important;
      }
    `}</style>

    {/* Render the TTS Player connected to this FAB state */}
    <TTSPlayer 
      isOpen={isTTSOpen}
      onClose={() => setIsTTSOpen(false)}
      isExpanded={isTTSExpanded}
      onExpandedChange={setIsTTSExpanded}
      paragraphs={paragraphs}
      novelSlug={novelSlug}
      currentChapter={currentChapter}
      maxChapter={maxChapter}
      chapterTitle={chapterTitle}
    />
    </>
  )
}
