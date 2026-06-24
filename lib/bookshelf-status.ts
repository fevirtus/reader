export type BookshelfShelfStatus = "reading" | "completed" | "saved"

export interface BookshelfBookmarkLike {
  lastChapterNumber?: number | null
  readChapters?: number[]
  shelfStatus?: BookshelfShelfStatus | string | null
}

export interface BookshelfNovelLike {
  totalChapters?: number | null
}

export function resolveBookshelfShelfStatus(
  bookmark: BookshelfBookmarkLike,
  novel?: BookshelfNovelLike | null,
): BookshelfShelfStatus {
  const explicit = bookmark.shelfStatus
  if (explicit === "reading" || explicit === "completed" || explicit === "saved") {
    return explicit
  }

  const lastChapterNumber = bookmark.lastChapterNumber ?? null
  const readChapters = bookmark.readChapters ?? []
  const totalChapters = Number(novel?.totalChapters ?? 0)
  const hasProgress = lastChapterNumber != null || readChapters.length > 0

  if (hasProgress && totalChapters > 0 && lastChapterNumber != null && lastChapterNumber >= totalChapters) {
    return "completed"
  }
  if (hasProgress) {
    return "reading"
  }
  return "saved"
}
