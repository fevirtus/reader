"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useBookmarks } from "@/lib/bookmark-context"

interface ChapterReaderProgressProps {
  novelId: string
  chapterId: string
  chapterNumber: number
}

export function ChapterReaderProgress({ novelId, chapterId, chapterNumber }: ChapterReaderProgressProps) {
  const { user } = useAuth()
  const { updateProgress } = useBookmarks()

  useEffect(() => {
    if (user) {
      updateProgress(novelId, chapterId, chapterNumber)
    }
  }, [user, novelId, chapterId, chapterNumber, updateProgress])

  return null
}
