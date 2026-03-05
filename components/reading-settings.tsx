"use client"

import { useState } from "react"
import { Minus, Plus, ALargeSmall } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export function ReadingSettings() {
  const [fontSize, setFontSize] = useState(18)
  const [lineHeight, setLineHeight] = useState(1.8)

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
          </div>
        </PopoverContent>
      </Popover>

      {/* Inject styles */}
      <style>{`
        .chapter-content {
          font-size: ${fontSize}px;
          line-height: ${lineHeight};
        }
      `}</style>
    </>
  )
}
