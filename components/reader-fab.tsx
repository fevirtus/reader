"use client"

import { useState, useEffect } from "react"
import { Settings2, Headphones, X, Menu, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
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
  const [isMobileControlsVisible, setIsMobileControlsVisible] = useState(true)

  useEffect(() => {
    let lastScrollY = window.scrollY

    const handleScroll = () => {
      const currentY = window.scrollY
      setShowScrollTop(currentY > 400)

      const isMobile = window.innerWidth < 768
      if (!isMobile) {
        setIsMobileControlsVisible(true)
        lastScrollY = currentY
        return
      }

      const delta = currentY - lastScrollY
      if (Math.abs(delta) < 12) {
        return
      }

      if (currentY < 120) {
        setIsMobileControlsVisible(true)
      } else if (delta > 0 && !isOpen && !isTTSOpen) {
        setIsMobileControlsVisible(false)
      } else if (delta < 0) {
        setIsMobileControlsVisible(true)
      }

      lastScrollY = currentY
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isOpen, isTTSOpen])

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Reading settings state lifted up for persistence
  const [fontSize, setFontSize] = useState(18)
  const [lineHeight, setLineHeight] = useState(1.8)
  const [letterSpacing, setLetterSpacing] = useState(0)
  const [fontFamily, setFontFamily] = useState("font-serif")

  useEffect(() => {
    // Dùng local storage chạy tạm thời gian đầu để khỏi giật màn hình
    const savedFontSize = localStorage.getItem("reader_fontSize")
    const savedLineHeight = localStorage.getItem("reader_lineHeight")
    const savedLetterSpacing = localStorage.getItem("reader_letterSpacing")
    const savedFontFamily = localStorage.getItem("reader_fontFamily")

    if (savedFontSize) setFontSize(Number(savedFontSize))
    if (savedLineHeight) setLineHeight(Number(savedLineHeight))
    if (savedLetterSpacing) setLetterSpacing(Number(savedLetterSpacing))
    if (savedFontFamily) setFontFamily(savedFontFamily)

    // Đồng bộ Settings từ DB về (Ghi đè nếu có)
    fetch("/api/user/settings")
      .then(res => res.json())
      .then(data => {
        if (data && !data.error && data.fontSize) {
          setFontSize(data.fontSize)
          setLineHeight(data.lineHeight)
          setLetterSpacing(data.letterSpacing)
          setFontFamily(data.fontFamily)
          
          localStorage.setItem("reader_fontSize", data.fontSize.toString())
          localStorage.setItem("reader_lineHeight", data.lineHeight.toString())
          localStorage.setItem("reader_letterSpacing", data.letterSpacing.toString())
          localStorage.setItem("reader_fontFamily", data.fontFamily)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    localStorage.setItem("reader_fontSize", fontSize.toString())
    localStorage.setItem("reader_lineHeight", lineHeight.toString())
    localStorage.setItem("reader_letterSpacing", letterSpacing.toString())
    localStorage.setItem("reader_fontFamily", fontFamily)

    const timer = setTimeout(() => {
      fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fontSize, lineHeight, letterSpacing, fontFamily })
      }).catch(() => {})
    }, 1000)

    return () => clearTimeout(timer)
  }, [fontSize, lineHeight, letterSpacing, fontFamily])

  return (
    <>
      <div className={cn(
        "fixed right-3 z-50 flex flex-col items-center gap-2.5 transition-all duration-300 md:right-6 md:gap-3",
        isTTSOpen ? (isTTSExpanded ? "bottom-[10.5rem] md:bottom-[12rem]" : "bottom-[4.75rem] md:bottom-24") : "bottom-3 md:bottom-6",
        isMobileControlsVisible ? "max-md:translate-y-0 max-md:opacity-100" : "max-md:translate-y-20 max-md:opacity-0 max-md:pointer-events-none"
      )}>
      {/* Main FAB Toggle (Mobile mostly, but works as container) */}
      <Button
        size="icon"
        className="h-11 w-11 rounded-full shadow-lg md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
          className="h-10 w-10 rounded-full shadow-md relative group md:h-12 md:w-12"
          onClick={() => {
            setIsTTSOpen(!isTTSOpen)
            setIsOpen(false)
          }}
        >
          <Headphones className="h-4 w-4 md:h-5 md:w-5" />
          <span className="absolute right-full mr-3 hidden whitespace-nowrap rounded bg-foreground/90 px-2 py-1 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100 md:inline">
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
              className="h-10 w-10 rounded-full shadow-md relative group md:h-12 md:w-12"
            >
              <Settings2 className="h-4 w-4 md:h-5 md:w-5" />
              <span className="absolute right-full mr-3 hidden whitespace-nowrap rounded bg-foreground/90 px-2 py-1 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100 md:inline">
                Tùy chỉnh
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="mb-2 mr-2 flex w-64 md:mr-4" align="end" side="left">
            <ReadingSettingsContent 
              fontSize={fontSize} setFontSize={setFontSize}
              lineHeight={lineHeight} setLineHeight={setLineHeight}
              letterSpacing={letterSpacing} setLetterSpacing={setLetterSpacing}
              fontFamily={fontFamily} setFontFamily={setFontFamily}
            />
          </PopoverContent>
        </Popover>

        {/* Scroll to Top */}
        <Button
          variant="secondary"
          size="icon"
          className={cn(
            "h-10 w-10 rounded-full shadow-md relative group transition-all duration-300 md:h-12 md:w-12",
            showScrollTop ? "opacity-100 scale-100" : "opacity-0 scale-0 pointer-events-none"
          )}
          onClick={handleScrollToTop}
        >
          <ArrowUp className="h-4 w-4 md:h-5 md:w-5" />
          <span className="absolute right-full mr-3 hidden whitespace-nowrap rounded bg-foreground/90 px-2 py-1 text-xs text-background opacity-0 transition-opacity group-hover:opacity-100 md:inline">
            Lên đầu trang
          </span>
        </Button>
      </div>
    </div>

    {/* Inject styles OUTSIDE the popover so it survives */}
    <style>{`
      .chapter-content, .chapter-content p {
        font-size: ${fontSize}px !important;
        line-height: ${lineHeight} !important;
        letter-spacing: ${letterSpacing}px !important;
        font-family: ${fontFamily === 'font-serif' ? 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' : 
                       fontFamily === 'font-sans' ? 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif' : 
                       'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'} !important;
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
