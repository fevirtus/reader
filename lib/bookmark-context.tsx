"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { Bookmark } from "./types"
import { useAuth } from "./auth-context"

interface BookmarkContextType {
  bookmarks: Bookmark[]
  isBookmarked: (novelId: string) => boolean
  toggleBookmark: (novelId: string) => void
  updateProgress: (novelId: string, chapterId: string, chapterNumber: number) => void
  getProgress: (novelId: string) => Bookmark | undefined
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined)

export function BookmarkProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])

  useEffect(() => {
    let mounted = true
    const fetchBookmarks = async () => {
      if (!user) {
        setBookmarks([])
        return
      }
      try {
        const res = await fetch("/api/user/bookmarks")
        if (res.ok) {
          const data = await res.json()
          if (mounted) setBookmarks(data)
        }
      } catch (e) {
        console.error("Failed to fetch bookmarks", e)
      }
    }
    fetchBookmarks()
    return () => { mounted = false }
  }, [user])

  const toggleBookmark = useCallback(async (novelId: string) => {
    if (!user) return

    // Optimistic update
    setBookmarks((prev) => {
      const exists = prev.find((b) => b.novelId === novelId)
      if (exists) {
        return prev.filter((b) => b.novelId !== novelId)
      }
      return [...prev, { novelId, addedAt: new Date().toISOString() } as any]
    })

    try {
      await fetch("/api/user/bookmarks", {
        method: "POST",
        body: JSON.stringify({ action: "toggle", novelId })
      })
    } catch (e) {
      console.error(e)
    }
  }, [user])

  const updateProgress = useCallback(async (novelId: string, chapterId: string, chapterNumber: number) => {
    if (!user) return

    // Optimistic update
    setBookmarks((prev) => {
      const exists = prev.find((b) => b.novelId === novelId)
      if (exists) {
        return prev.map(b => b.novelId === novelId ? { ...b, lastChapterId: chapterId, lastChapterNumber: chapterNumber } : b)
      }
      return [...prev, { novelId, lastChapterId: chapterId, lastChapterNumber: chapterNumber, addedAt: new Date().toISOString() } as any]
    })

    try {
      await fetch("/api/user/bookmarks", {
        method: "POST",
        body: JSON.stringify({ action: "updateProgress", novelId, lastChapterId: chapterId, lastChapterNumber: chapterNumber })
      })
    } catch (e) {
      console.error(e)
    }
  }, [user])

  const getProgress = useCallback((novelId: string) => {
    return bookmarks.find((b) => b.novelId === novelId)
  }, [bookmarks])

  const isBookmarked = useCallback((novelId: string) => {
    return bookmarks.some((b) => b.novelId === novelId)
  }, [bookmarks])

  return (
    <BookmarkContext.Provider value={{ bookmarks, isBookmarked, toggleBookmark, updateProgress, getProgress }}>
      {children}
    </BookmarkContext.Provider>
  )
}

export function useBookmarks() {
  const context = useContext(BookmarkContext)
  if (!context) throw new Error("useBookmarks must be used within BookmarkProvider")
  return context
}
