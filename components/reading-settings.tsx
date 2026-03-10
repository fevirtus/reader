"use client"

import { useState } from "react"
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
}

export function ReadingSettingsContent({
  fontSize, setFontSize,
  lineHeight, setLineHeight,
  letterSpacing, setLetterSpacing
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
            
            <div className="pt-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setFontSize(18)
                  setLineHeight(1.8)
                  setLetterSpacing(0)
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
        />
      </PopoverContent>
    </Popover>
    {/* Inject styles */}
    <style>{`
      .chapter-content {
        font-size: ${fontSize}px !important;
        line-height: ${lineHeight} !important;
        letter-spacing: ${letterSpacing}px !important;
      }
    `}</style>
    </>
  )
}
