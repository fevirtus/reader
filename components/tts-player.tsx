"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Play, Pause, Square, SkipForward, SkipBack, Volume2, ChevronDown, ChevronUp, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface TTSPlayerProps {
  paragraphs: string[]
  novelSlug: string
  currentChapter: number
  maxChapter: number
  chapterTitle: string
}

export function TTSPlayer({ paragraphs, novelSlug, currentChapter, maxChapter, chapterTitle }: TTSPlayerProps) {
  const router = useRouter()
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0)
  const [rate, setRate] = useState(1.0)
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [selectedVoiceURI, setSelectedVoiceURI] = useState("")
  const [isExpanded, setIsExpanded] = useState(false)
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
      const viVoices = available.filter(
        (v) => v.lang.startsWith("vi") || v.name.toLowerCase().includes("vietnam")
      )
      const allUsable = viVoices.length > 0 ? viVoices : available.slice(0, 10)
      setVoices(allUsable)
      if (allUsable.length > 0 && !selectedVoiceURI) {
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
    if (!isPlaying) return

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
  }, [currentParagraphIndex, isPlaying])

  // Clean highlights when stopped
  useEffect(() => {
    if (!isPlaying) {
      const articleEl = document.querySelector(".chapter-content")
      if (articleEl) {
        articleEl.querySelectorAll("p[data-p-index]").forEach((el) => {
          el.classList.remove("tts-active-paragraph")
        })
      }
    }
  }, [isPlaying])

  const speakParagraph = useCallback(
    (index: number) => {
      if (index >= paragraphs.length) {
        // Chapter finished
        setIsPlaying(false)
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
        if (e.error !== "canceled" && e.error !== "interrupted") {
          setIsPlaying(false)
          releaseWakeLock()
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
      releaseWakeLock()
    } else {
      // Play / Resume
      setIsPlaying(true)
      acquireWakeLock()
      speakParagraph(currentParagraphIndex)
    }
  }, [isSupported, isPlaying, currentParagraphIndex, speakParagraph, acquireWakeLock, releaseWakeLock])

  const handleStop = useCallback(() => {
    speechSynthesis.cancel()
    setIsPlaying(false)
    setCurrentParagraphIndex(0)
    releaseWakeLock()
  }, [releaseWakeLock])

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
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md shadow-lg">
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
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </Button>
          </div>

          {/* Expanded settings */}
          {isExpanded && (
            <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3">
              {/* Speed on mobile */}
              <div className="flex items-center gap-3 sm:hidden">
                <span className="text-xs text-muted-foreground w-16 shrink-0">Toc do:</span>
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

              {/* Voice selector */}
              {voices.length > 1 && (
                <div className="flex items-center gap-3">
                  <Volume2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <select
                    className="flex-1 rounded-md border border-input bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                    value={selectedVoiceURI}
                    onChange={(e) => setSelectedVoiceURI(e.target.value)}
                  >
                    {voices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))}
                  </select>
                </div>
              )}

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
                  Tu dong chuyen chuong {currentChapter < maxChapter ? `(chuong ${currentChapter + 1})` : "(da la chuong cuoi)"}
                </span>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Spacer so content isn't hidden behind the player bar */}
      <div className={cn("h-16", isExpanded && "h-44")} />

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
      `}</style>
    </>
  )
}
