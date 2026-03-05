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
    if (user) {
      const stored = localStorage.getItem(`truyen-chu-bookmarks-${user.id}`)
      if (stored) {
        try {
          setBookmarks(JSON.parse(stored))
        } catch {
          setBookmarks([])
        }
      } else {
        setBookmarks([])
      }
    } else {
      setBookmarks([])
    }
  }, [user])

  const persist = useCallback((newBookmarks: Bookmark[]) => {
    if (user) {
      localStorage.setItem(`truyen-chu-bookmarks-${user.id}`, JSON.stringify(newBookmarks))
    }
  }, [user])

  const isBookmarked = useCallback((novelId: string) => {
    return bookmarks.some((b) => b.novelId === novelId)
  }, [bookmarks])

  const toggleBookmark = useCallback((novelId: string) => {
    setBookmarks((prev) => {
      const exists = prev.find((b) => b.novelId === novelId)
      const next = exists
        ? prev.filter((b) => b.novelId !== novelId)
        : [...prev, { novelId, addedAt: new Date().toISOString() }]
      persist(next)
      return next
    })
  }, [persist])

  const updateProgress = useCallback((novelId: string, chapterId: string, chapterNumber: number) => {
    setBookmarks((prev) => {
      const idx = prev.findIndex((b) => b.novelId === novelId)
      let next: Bookmark[]
      if (idx >= 0) {
        next = [...prev]
        next[idx] = { ...next[idx], lastChapterId: chapterId, lastChapterNumber: chapterNumber }
      } else {
        next = [...prev, { novelId, lastChapterId: chapterId, lastChapterNumber: chapterNumber, addedAt: new Date().toISOString() }]
      }
      persist(next)
      return next
    })
  }, [persist])

  const getProgress = useCallback((novelId: string) => {
    return bookmarks.find((b) => b.novelId === novelId)
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
