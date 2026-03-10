"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Play, Pause, Square, SkipForward, SkipBack, Volume2, ChevronDown, ChevronUp, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface TTSPlayerProps {
  paragraphs: string[]
  novelSlug: string
  currentChapter: number
  maxChapter: number
  chapterTitle: string
  isOpen?: boolean
  onClose?: () => void
  isExpanded?: boolean
  onExpandedChange?: (val: boolean) => void
}

export function TTSPlayer({ paragraphs, novelSlug, currentChapter, maxChapter, chapterTitle, isOpen = true, onClose, isExpanded = false, onExpandedChange }: TTSPlayerProps) {
  const router = useRouter()
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0)
  const [rate, setRate] = useState(1.0)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoiceURI, setSelectedVoiceURI] = useState("")
  const [autoNextChapter, setAutoNextChapter] = useState(true)
  const [isSupported, setIsSupported] = useState(false)

  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const isPlayingRef = useRef(false)
  const currentIndexRef = useRef(0)

  // Keep refs in sync
  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  useEffect(() => {
    currentIndexRef.current = currentParagraphIndex
  }, [currentParagraphIndex])

  // Check TTS support
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true)
    }
  }, [])

  // Load voices
  useEffect(() => {
    if (!isSupported) return

    const loadVoices = () => {
      const available = speechSynthesis.getVoices()
      // First try to find any Vietnamese voice ('vi-VN', 'Google Tiếng Việt', etc.)
      const viVoices = available.filter(
        (v) => v.lang.startsWith("vi") || v.name.toLowerCase().includes("vietnam") || v.name.toLowerCase().includes("tiếng việt")
      )

      // Filter out overly robotic generic fallbacks if we have good ones
      let goodViVoices = viVoices.filter(v => 
        v.name.includes("Google") || 
        v.name.includes("Microsoft") || 
        v.name.includes("Natural") ||
        v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("nữ")
      )

      // Sort to prioritize female voices
      goodViVoices.sort((a, b) => {
        const aIsFemale = a.name.toLowerCase().includes("female") || a.name.toLowerCase().includes("nữ")
        const bIsFemale = b.name.toLowerCase().includes("female") || b.name.toLowerCase().includes("nữ")
        if (aIsFemale && !bIsFemale) return -1
        if (!aIsFemale && bIsFemale) return 1
        return 0
      })

      const preferredViVoices = goodViVoices.length > 0 ? goodViVoices : viVoices

      // Sort preferred voices again just to be sure if not using goodViVoices
      if (preferredViVoices === viVoices) {
        preferredViVoices.sort((a, b) => {
          const aIsFemale = a.name.toLowerCase().includes("female") || a.name.toLowerCase().includes("nữ")
          const bIsFemale = b.name.toLowerCase().includes("female") || b.name.toLowerCase().includes("nữ")
          if (aIsFemale && !bIsFemale) return -1
          if (!aIsFemale && bIsFemale) return 1
          return 0
        })
      }

      // If we still have NO vi voices, fallback to ALL voices so the user isn't stuck with an empty list
      const allUsable = preferredViVoices.length > 0 ? preferredViVoices : available

      setVoices(allUsable)
      if (allUsable.length > 0 && !selectedVoiceURI) {
        // Automatically default to the first Vietnamese voice if available, otherwise just the first system voice
        setSelectedVoiceURI(allUsable[0].voiceURI)
      }
    }

    loadVoices()
    speechSynthesis.addEventListener("voiceschanged", loadVoices)
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", loadVoices)
    }
  }, [isSupported, selectedVoiceURI])

  // Acquire Wake Lock for background playback on mobile
  const acquireWakeLock = useCallback(async () => {
    if ("wakeLock" in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request("screen")
      } catch {
        // Wake Lock not available or denied
      }
    }
  }, [])

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release()
        wakeLockRef.current = null
      } catch {
        // ignore
      }
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      speechSynthesis.cancel()
      releaseWakeLock()
    }
  }, [releaseWakeLock])

  // Highlight current paragraph in the DOM
  useEffect(() => {
    if (!isPlaying && !isPaused) return

    const articleEl = document.querySelector(".chapter-content")
    if (!articleEl) return

    const pElements = articleEl.querySelectorAll("p[data-p-index]")
    pElements.forEach((el) => {
      el.classList.remove("tts-active-paragraph")
    })

    const activeEl = articleEl.querySelector(`p[data-p-index="${currentParagraphIndex}"]`)
    if (activeEl) {
      activeEl.classList.add("tts-active-paragraph")
      activeEl.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }, [currentParagraphIndex, isPlaying, isPaused])

  // Clean highlights when stopped completely (not playing and not paused)
  useEffect(() => {
    if (!isPlaying && !isPaused) {
      const articleEl = document.querySelector(".chapter-content")
      if (articleEl) {
        articleEl.querySelectorAll("p[data-p-index]").forEach((el) => {
          el.classList.remove("tts-active-paragraph")
        })
      }
    }
  }, [isPlaying, isPaused])



  const speakParagraph = useCallback(
    (index: number) => {
      if (index >= paragraphs.length) {
        // Chapter finished
        setIsPlaying(false)
        setIsPaused(false)
        releaseWakeLock()

        if (autoNextChapter && currentChapter < maxChapter) {
          // Auto navigate to next chapter
          router.push(`/truyen/${novelSlug}/${currentChapter + 1}?tts=auto`)
        }
        return
      }

      speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(paragraphs[index])
      utterance.rate = rate
      utterance.lang = "vi-VN"

      const voice = voices.find((v) => v.voiceURI === selectedVoiceURI)
      if (voice) {
        utterance.voice = voice
      }

      utterance.onend = () => {
        if (isPlayingRef.current) {
          const nextIndex = currentIndexRef.current + 1
          setCurrentParagraphIndex(nextIndex)
          speakParagraph(nextIndex)
        }
      }

      utterance.onerror = (e) => {
        console.error("TTS Playback Error:", e.error, e)
        if (e.error !== "canceled" && e.error !== "interrupted") {
          setIsPlaying(false)
          setIsPaused(false)
          releaseWakeLock()

          if (e.error === "synthesis-failed" || e.error === "network") {
            // Toast notification is tricky here without importing sonner, let's just log and stop cleanly without crashing
            console.warn("Trình duyệt không hỗ trợ đọc giọng nói này hoặc bị lỗi kết nối.")
          }
        }
      }

      utteranceRef.current = utterance
      setCurrentParagraphIndex(index)
      speechSynthesis.speak(utterance)
    },
    [paragraphs, rate, voices, selectedVoiceURI, autoNextChapter, currentChapter, maxChapter, novelSlug, router, releaseWakeLock]
  )

  const handlePlay = useCallback(() => {
    if (!isSupported) return

    if (isPlaying) {
      // Pause
      speechSynthesis.cancel()
      setIsPlaying(false)
      setIsPaused(true)
      releaseWakeLock()
    } else {
      // Play / Resume
      setIsPlaying(true)
      setIsPaused(false)
      acquireWakeLock()
      speakParagraph(currentParagraphIndex)
    }
  }, [isSupported, isPlaying, currentParagraphIndex, speakParagraph, acquireWakeLock, releaseWakeLock])

  const handleStop = useCallback(() => {
    speechSynthesis.cancel()
    setIsPlaying(false)
    setIsPaused(false)
    setCurrentParagraphIndex(0)
    releaseWakeLock()
    onClose?.()
  }, [releaseWakeLock, onClose])

  const handlePrevParagraph = useCallback(() => {
    const newIndex = Math.max(0, currentParagraphIndex - 1)
    setCurrentParagraphIndex(newIndex)
    if (isPlaying) {
      speechSynthesis.cancel()
      speakParagraph(newIndex)
    }
  }, [currentParagraphIndex, isPlaying, speakParagraph])

  const handleNextParagraph = useCallback(() => {
    const newIndex = Math.min(paragraphs.length - 1, currentParagraphIndex + 1)
    setCurrentParagraphIndex(newIndex)
    if (isPlaying) {
      speechSynthesis.cancel()
      speakParagraph(newIndex)
    }
  }, [currentParagraphIndex, paragraphs.length, isPlaying, speakParagraph])

  // Listen for clicks on paragraphs to jump TTS
  useEffect(() => {
    if (!isOpen) {
      document.querySelector(".chapter-content")?.classList.remove("tts-selection-mode")
      return
    }

    const articleEl = document.querySelector(".chapter-content")
    if (!articleEl) return

    articleEl.classList.add("tts-selection-mode")

    const handleParagraphClick = (e: Event) => {
      const target = e.currentTarget as HTMLElement
      const idxStr = target.getAttribute("data-p-index")
      if (idxStr !== null) {
        const index = parseInt(idxStr, 10)
        
        // Stop current speech
        speechSynthesis.cancel()
        
        // Set new index and play
        setCurrentParagraphIndex(index)
        setIsPlaying(true)
        setIsPaused(false)
        acquireWakeLock()
        
        // Since speakParagraph is a useCallback with all valid deps, it's safe to call here:
        speakParagraph(index)
      }
    }

    const pElements = articleEl.querySelectorAll("p[data-p-index]")
    pElements.forEach((el) => {
      el.addEventListener("click", handleParagraphClick)
    })

    return () => {
      articleEl.classList.remove("tts-selection-mode")
      pElements.forEach((el) => {
        el.removeEventListener("click", handleParagraphClick)
      })
    }
  }, [isOpen, acquireWakeLock, speakParagraph])

  // Auto-play TTS when coming from previous chapter auto-advance
  useEffect(() => {
    if (!isSupported) return
    const params = new URLSearchParams(window.location.search)
    if (params.get("tts") === "auto") {
      // Small delay to let the page render
      const timer = setTimeout(() => {
        setIsPlaying(true)
        acquireWakeLock()
        speakParagraph(0)
      }, 500)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported])

  if (!isSupported) return null

  const progress = paragraphs.length > 0 ? ((currentParagraphIndex + 1) / paragraphs.length) * 100 : 0

  return (
    <>
      {/* Floating TTS bar */}
      <div className={cn("fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.1)] transition-transform duration-300", !isOpen && "translate-y-full")}>
        {/* Progress bar */}
        <div className="h-0.5 w-full bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mx-auto max-w-3xl px-4 py-2">
          {/* Compact bar */}
          <div className="flex items-center gap-3">
            {/* Play controls */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePrevParagraph} disabled={currentParagraphIndex <= 0}>
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                className="h-9 w-9 rounded-full"
                onClick={handlePlay}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleNextParagraph} disabled={currentParagraphIndex >= paragraphs.length - 1}>
                <SkipForward className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleStop}>
                <Square className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Info */}
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-xs font-medium text-foreground">
                {chapterTitle}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {currentParagraphIndex + 1}/{paragraphs.length} doan
              </span>
            </div>

            {/* Voice Selection (Always accessible) */}
            <div className="hidden md:block w-32 shrink-0">
              <Select value={selectedVoiceURI} onValueChange={setSelectedVoiceURI}>
                <SelectTrigger className="h-8 text-xs bg-muted/50 border-0">
                  <SelectValue placeholder="Chọn giọng..." />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((voice) => (
                    <SelectItem key={voice.voiceURI} value={voice.voiceURI} className="text-[10px] py-1">
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Speed control */}
            <div className="hidden items-center gap-1 sm:flex">
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setRate(Math.max(0.5, rate - 0.25))}
                disabled={rate <= 0.5}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-12 text-center text-xs font-medium text-muted-foreground">
                {rate.toFixed(2)}x
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7"
                onClick={() => setRate(Math.min(3, rate + 0.25))}
                disabled={rate >= 3}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            {/* Expand/Collapse */}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onExpandedChange?.(!isExpanded)}>
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>

          {/* Expanded settings */}
          {isExpanded && (
            <div className="mt-3 flex flex-col gap-4 border-t border-border pt-4">
              {/* Speed on mobile */}
              <div className="flex items-center gap-3 sm:hidden">
                <span className="text-xs font-medium text-muted-foreground w-16 shrink-0">Tốc độ:</span>
                <Slider
                  value={[rate]}
                  min={0.5}
                  max={3}
                  step={0.25}
                  onValueChange={([v]) => setRate(v)}
                  className="flex-1"
                />
                <span className="w-10 text-right text-xs font-medium">{rate.toFixed(2)}x</span>
              </div>

              {/* Voice selector (Mobile only, desktop has it on main bar) */}
              <div className="flex flex-col gap-1.5 md:hidden">
                <label className="text-xs font-medium text-muted-foreground">Giọng đọc:</label>
                <div className="flex items-center gap-3">
                  <Volume2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <Select value={selectedVoiceURI} onValueChange={setSelectedVoiceURI}>
                    <SelectTrigger className="h-9 w-full bg-background text-xs">
                      <SelectValue placeholder="Chọn giọng đọc..." />
                    </SelectTrigger>
                    <SelectContent>
                      {voices.map((voice) => (
                        <SelectItem key={voice.voiceURI} value={voice.voiceURI} className="text-xs">
                          {voice.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Auto next chapter toggle */}
              <label className="flex cursor-pointer items-center gap-3">
                <div
                  role="switch"
                  aria-checked={autoNextChapter}
                  tabIndex={0}
                  className={cn(
                    "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                    autoNextChapter ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                  onClick={() => setAutoNextChapter(!autoNextChapter)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setAutoNextChapter(!autoNextChapter) }}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-background shadow transition-transform",
                      autoNextChapter && "translate-x-4"
                    )}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  Tự động chuyển chương {currentChapter < maxChapter ? `(chương ${currentChapter + 1})` : "(đã là chương cuối)"}
                </span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Spacer so content isn't hidden behind the player bar - only active when open */}
      <div className={cn("transition-all duration-300", isOpen ? (isExpanded ? "h-44" : "h-16") : "h-0")} />

      {/* TTS highlight styles */}
      <style>{`
        .tts-active-paragraph {
          background: var(--primary) !important;
          color: var(--primary-foreground) !important;
          border-radius: 0.375rem;
          padding: 0.5rem 0.75rem;
          margin-left: -0.75rem;
          margin-right: -0.75rem;
          transition: background 0.3s ease, color 0.3s ease;
        }

        .tts-selection-mode p[data-p-index] {
          cursor: pointer;
          transition: background 0.2s ease, padding 0.2s ease, margin 0.2s ease;
          border-radius: 0.375rem;
          padding-left: 0.75rem;
          padding-right: 0.75rem;
          margin-left: -0.75rem;
          margin-right: -0.75rem;
        }

        .tts-selection-mode p[data-p-index]:hover:not(.tts-active-paragraph) {
          background: hsl(var(--primary) / 0.15);
        }
      `}</style>
    </>
  )
}
