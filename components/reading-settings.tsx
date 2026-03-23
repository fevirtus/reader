"use client"

import { useState, useEffect } from "react"
import { Minus, Plus, ALargeSmall, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
interface ReadingSettingsProps {
  fontSize: number
  setFontSize: (v: number) => void
  lineHeight: number
  setLineHeight: (v: number) => void
  letterSpacing: number
  setLetterSpacing: (v: number) => void
  fontFamily: string
  setFontFamily: (v: string) => void
}

export function ReadingSettingsContent({
  fontSize, setFontSize,
  lineHeight, setLineHeight,
  letterSpacing, setLetterSpacing,
  fontFamily, setFontFamily
}: ReadingSettingsProps) {
  return (
    <>
      <div className="flex flex-col gap-4">
            <div>
              <label className="mb-2 block text-xs font-medium text-muted-foreground">Cỡ chữ: {fontSize}px</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setFontSize(Math.max(14, fontSize - 1))}
                  disabled={fontSize <= 14}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <div className="h-1.5 flex-1 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${((fontSize - 14) / 12) * 100}%` }}
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setFontSize(Math.min(26, fontSize + 1))}
                  disabled={fontSize >= 26}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-muted-foreground">Khoảng cách dòng: {lineHeight.toFixed(1)}</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setLineHeight(Math.max(1.4, lineHeight - 0.1))}
                  disabled={lineHeight <= 1.4}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <div className="h-1.5 flex-1 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${((lineHeight - 1.4) / 1.2) * 100}%` }}
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setLineHeight(Math.min(2.6, lineHeight + 0.1))}
                  disabled={lineHeight >= 2.6}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-muted-foreground">Khoảng cách chữ: {letterSpacing.toFixed(1)}px</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setLetterSpacing(Math.max(-1, letterSpacing - 0.5))}
                  disabled={letterSpacing <= -1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <div className="h-1.5 flex-1 rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${((letterSpacing + 1) / 4) * 100}%` }}
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setLetterSpacing(Math.min(3, letterSpacing + 0.5))}
                  disabled={letterSpacing >= 3}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            <div>
              <label className="mb-2 block text-xs font-medium text-muted-foreground">Phông chữ</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={fontFamily === "font-serif" ? "default" : "outline"}
                  size="sm"
                  className="font-serif text-xs"
                  onClick={() => setFontFamily("font-serif")}
                >
                  Serif
                </Button>
                <Button
                  variant={fontFamily === "font-sans" ? "default" : "outline"}
                  size="sm"
                  className="font-sans text-xs"
                  onClick={() => setFontFamily("font-sans")}
                >
                  Sans
                </Button>
                <Button
                  variant={fontFamily === "font-mono" ? "default" : "outline"}
                  size="sm"
                  className="font-mono text-xs"
                  onClick={() => setFontFamily("font-mono")}
                >
                  Mono
                </Button>
              </div>
            </div>

            <div className="pt-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setFontSize(18)
                  setLineHeight(1.8)
                  setLetterSpacing(0)
                  setFontFamily("font-serif")
                }}
              >
                <RotateCcw className="mr-2 h-3 w-3" />
                Khôi phục mặc định
              </Button>
            </div>
      </div>
    </>
  )
}

export function ReadingSettings() {
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
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <ALargeSmall className="h-4 w-4" />
          <span className="hidden sm:inline">Cài đặt</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <ReadingSettingsContent 
          fontSize={fontSize} setFontSize={setFontSize}
          lineHeight={lineHeight} setLineHeight={setLineHeight}
          letterSpacing={letterSpacing} setLetterSpacing={setLetterSpacing}
          fontFamily={fontFamily} setFontFamily={setFontFamily}
        />
      </PopoverContent>
    </Popover>
    {/* Inject styles */}
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
    </>
  )
}
