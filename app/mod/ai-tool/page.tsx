"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { Bot, Loader2, Search, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

type NovelRow = {
  id: string
  title: string
  originalTitle?: string | null
  slug: string
  authorName: string
  originalAuthorName?: string | null
  description: string
  coverUrl?: string | null
  status: string
  updatedAt: string
}

type AISuggestion = {
  title: string
  originalTitle?: string
  authorName: string
  originalAuthorName?: string
  description: string
  coverUrl?: string
  status?: "Đang ra" | "Hoàn thành" | "Tạm ngưng"
  genresSuggested?: string[]
  confidence?: number
  source?: string
  sourceUrl?: string
  firstPublishYear?: number
}

type AttemptStatus = {
  provider: "google" | "openrouter" | "deepseek"
  model: string
  status: "success" | "failed" | "skipped"
  message?: string
  latencyMs?: number
}

type Genre = {
  id: string
  name: string
}

type EnrichResponse = {
  novel: {
    id: string
    title: string
    originalTitle?: string | null
    slug: string
    authorName: string
    originalAuthorName?: string | null
    description: string
    coverUrl?: string | null
    status: string
    updatedAt: string
    genres: string[]
  }
  provider: string
  model: string
  attempts: AttemptStatus[]
  results: AISuggestion[]
}

type EditableSuggestion = {
  title: string
  originalTitle: string
  authorName: string
  originalAuthorName: string
  description: string
  coverUrl: string
  status: "Đang ra" | "Hoàn thành" | "Tạm ngưng"
  genresSuggested: string[]
}

function normalizeDisplayText(value?: string | null): string {
  const trimmed = (value || "").trim()
  if (!trimmed) return ""

  const normalized = trimmed
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  if (["chua co gioi thieu", "khong co gioi thieu", "khong co mo ta", "chua co mo ta"].includes(normalized)) {
    return "Chưa có giới thiệu"
  }

  return trimmed
}

function normalizeStatus(value?: string | null): "Đang ra" | "Hoàn thành" | "Tạm ngưng" {
  const text = normalizeDisplayText(value)
  if (text === "Hoàn thành") return "Hoàn thành"
  if (text === "Tạm ngưng") return "Tạm ngưng"
  return "Đang ra"
}

function normalizeGenreKey(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function dedupeGenreNames(values: Array<string | null | undefined>): string[] {
  const result: string[] = []
  const seen = new Set<string>()

  for (const value of values) {
    const name = normalizeDisplayText(value)
    if (!name) continue
    const key = normalizeGenreKey(name)
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(name)
  }

  return result
}

function areGenreSetsEqual(a: string[], b: string[]): boolean {
  const left = dedupeGenreNames(a).map((name) => normalizeGenreKey(name)).sort()
  const right = dedupeGenreNames(b).map((name) => normalizeGenreKey(name)).sort()
  if (left.length !== right.length) return false
  return left.every((item, idx) => item === right[idx])
}

function createEditableSuggestion(novel: EnrichResponse["novel"], ai: AISuggestion): EditableSuggestion {
  const aiGenres = Array.isArray(ai.genresSuggested) ? ai.genresSuggested : []
  const mergedGenres = dedupeGenreNames(aiGenres.length > 0 ? aiGenres : novel.genres)

  return {
    title: normalizeDisplayText(ai.title) || normalizeDisplayText(novel.title),
    originalTitle: normalizeDisplayText(ai.originalTitle) || normalizeDisplayText(novel.originalTitle),
    authorName: normalizeDisplayText(ai.authorName) || normalizeDisplayText(novel.authorName),
    originalAuthorName: normalizeDisplayText(ai.originalAuthorName) || normalizeDisplayText(novel.originalAuthorName),
    description: normalizeDisplayText(ai.description) || normalizeDisplayText(novel.description),
    coverUrl: normalizeDisplayText(ai.coverUrl) || normalizeDisplayText(novel.coverUrl),
    status: normalizeStatus(ai.status || novel.status),
    genresSuggested: mergedGenres,
  }
}

function FieldDiff({ label, current, suggested }: { label: string; current?: string | null; suggested?: string | null }) {
  const left = normalizeDisplayText(current)
  const right = normalizeDisplayText(suggested)
  const changed = left !== right

  return (
    <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-2">
      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label} - hiện tại</p>
        <p className="mt-1 text-sm">{left || "(trống)"}</p>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label} - AI đề xuất</p>
        <p className={`mt-1 text-sm ${changed ? "text-primary font-medium" : ""}`}>{right || "(trống)"}</p>
      </div>
    </div>
  )
}

export default function ModAIToolPage() {
  const [keyword, setKeyword] = useState("")
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState("")
  const [novels, setNovels] = useState<NovelRow[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  const [enrichingNovelId, setEnrichingNovelId] = useState<string | null>(null)
  const [provider, setProvider] = useState("")
  const [model, setModel] = useState("")
  const [attempts, setAttempts] = useState<AttemptStatus[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [genreQuery, setGenreQuery] = useState("")
  const [comparisonNovel, setComparisonNovel] = useState<EnrichResponse["novel"] | null>(null)
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null)
  const [editableSuggestion, setEditableSuggestion] = useState<EditableSuggestion | null>(null)
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [enrichError, setEnrichError] = useState("")
  const [applyingSuggestion, setApplyingSuggestion] = useState(false)
  const [applyError, setApplyError] = useState("")
  const [applySuccess, setApplySuccess] = useState("")

  const [missingFilter, setMissingFilter] = useState(false)
  const [autoEnrichLogs, setAutoEnrichLogs] = useState<{ id: string, title: string, status: "pending" | "processing" | "success" | "failed", message?: string }[]>([])
  const [isAutoEnriching, setIsAutoEnriching] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [isGlobalEnriching, setIsGlobalEnriching] = useState(false)
  const autoEnrichingRef = useRef(false)
  const globalEnrichingRef = useRef(false)

  const trimmedKeyword = keyword.trim()
  const canSearch = trimmedKeyword.length >= 1 || missingFilter

  const matchedGenres = useMemo(() => {
    const q = normalizeGenreKey(genreQuery)
    if (!q) return [] as Genre[]

    return genres
      .filter((genre) => normalizeGenreKey(genre.name).includes(q))
      .slice(0, 12)
  }, [genreQuery, genres])

  const selectedGenreNames = useMemo(() => {
    if (!editableSuggestion) return []
    return dedupeGenreNames(editableSuggestion.genresSuggested)
  }, [editableSuggestion])

  const changedPayload = useMemo(() => {
    if (!comparisonNovel || !editableSuggestion) {
      return { payload: null as Record<string, unknown> | null, changedKeys: [] as string[] }
    }

    const changedKeys: string[] = []
    const payload: Record<string, unknown> = { id: comparisonNovel.id }

    const currentTitle = normalizeDisplayText(comparisonNovel.title)
    const currentOriginalTitle = normalizeDisplayText(comparisonNovel.originalTitle)
    const currentAuthorName = normalizeDisplayText(comparisonNovel.authorName)
    const currentOriginalAuthorName = normalizeDisplayText(comparisonNovel.originalAuthorName)
    const currentDescription = normalizeDisplayText(comparisonNovel.description)
    const currentCoverUrl = normalizeDisplayText(comparisonNovel.coverUrl)
    const currentStatus = normalizeStatus(comparisonNovel.status)
    const currentGenres = dedupeGenreNames(comparisonNovel.genres)
    const nextGenres = dedupeGenreNames(editableSuggestion.genresSuggested)

    if (editableSuggestion.title.trim() !== currentTitle) {
      payload.title = editableSuggestion.title.trim()
      changedKeys.push("title")
    }

    if (editableSuggestion.originalTitle.trim() !== currentOriginalTitle) {
      payload.originalTitle = editableSuggestion.originalTitle.trim()
      changedKeys.push("originalTitle")
    }

    if (editableSuggestion.authorName.trim() !== currentAuthorName) {
      payload.authorName = editableSuggestion.authorName.trim()
      changedKeys.push("authorName")
    }

    if (editableSuggestion.originalAuthorName.trim() !== currentOriginalAuthorName) {
      payload.originalAuthorName = editableSuggestion.originalAuthorName.trim()
      changedKeys.push("originalAuthorName")
    }

    if (editableSuggestion.description.trim() !== currentDescription) {
      payload.description = editableSuggestion.description.trim()
      changedKeys.push("description")
    }

    if (editableSuggestion.coverUrl.trim() !== currentCoverUrl) {
      payload.coverUrl = editableSuggestion.coverUrl.trim()
      changedKeys.push("coverUrl")
    }

    if (editableSuggestion.status !== currentStatus) {
      payload.status = editableSuggestion.status
      changedKeys.push("status")
    }

    if (!areGenreSetsEqual(currentGenres, nextGenres)) {
      changedKeys.push("genres")
    }

    return { payload, changedKeys }
  }, [comparisonNovel, editableSuggestion])

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await fetch("/api/mod/the-loai", { cache: "no-store" })
        const data = await res.json().catch(() => [])
        if (!res.ok) return
        setGenres(Array.isArray(data) ? data : [])
      } catch {
        // ignore fetch errors here; genre editor can still work with manual names.
      }
    }

    void fetchGenres()
  }, [])

  useEffect(() => {
    if (!canSearch) {
      setSearching(false)
      setSearchError("")
      setNovels([])
      setPage(1)
      setHasMore(false)
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      setSearching(true)
      setSearchError("")

      try {
        const res = await fetch(`/api/mod/ai-tools/novel-search?q=${encodeURIComponent(trimmedKeyword)}&missing=${missingFilter}&page=1`, {
          signal: controller.signal,
        })
        const data = await res.json()

        if (!res.ok) {
           throw new Error(data.error || "Không thể tìm truyện trong database")
        }

        const rows = Array.isArray(data) ? data : data.novels || []
        setNovels(rows)
        setHasMore(!!data.hasMore)
        setPage(1)
      } catch (error: any) {
        if (controller.signal.aborted) return
        setSearchError(error?.message || "Không thể tìm truyện trong database")
        setNovels([])
        setHasMore(false)
      } finally {
        if (!controller.signal.aborted) {
          setSearching(false)
        }
      }
    }, 250)

    return () => {
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [canSearch, trimmedKeyword, missingFilter])

  const handleLoadMore = async () => {
    if (!canSearch || !hasMore || searching) return
    setSearching(true)
    try {
      const nextPage = page + 1
      const res = await fetch(`/api/mod/ai-tools/novel-search?q=${encodeURIComponent(trimmedKeyword)}&missing=${missingFilter}&page=${nextPage}`)
      if (!res.ok) throw new Error("Lỗi tải thêm")
      const data = await res.json()
      
      const rows = Array.isArray(data) ? data : data.novels || []
      setNovels(prev => [...prev, ...rows])
      setHasMore(!!data.hasMore)
      setPage(nextPage)
    } catch (error: any) {
      toast.error(error.message || "Không thể tải thêm dòng.")
    } finally {
      setSearching(false)
    }
  }

  const handleEnrich = async (novelId: string) => {
    setEnrichingNovelId(novelId)
    setEnrichError("")
    setApplyError("")
    setApplySuccess("")
    setGenreQuery("")
    setAttempts([])

    try {
      const res = await fetch(`/api/mod/ai-tools/novel-enrich?novelId=${encodeURIComponent(novelId)}`)
      const data = (await res.json()) as EnrichResponse & { error?: string }
      if (!res.ok) {
        throw new Error(data.error || "Không thể bổ sung thông tin")
      }

      const rows = Array.isArray(data.results) ? data.results : []
      const best = rows[0] || null

      setComparisonNovel(data.novel)
      setSuggestions(rows)
      setSuggestion(best)
      setEditableSuggestion(best ? createEditableSuggestion(data.novel, best) : null)
      setProvider(data.provider || "")
      setModel(data.model || "")
      setAttempts(Array.isArray(data.attempts) ? data.attempts : [])

      if (!best) {
        setEnrichError("AI không trả về kết quả hợp lệ")
      }
    } catch (error: any) {
      setEnrichError(error?.message || "Không thể bổ sung thông tin")
    } finally {
      setEnrichingNovelId(null)
    }
  }

  const processNovelList = async (novelList: NovelRow[]) => {
    const logs = novelList.map(n => ({ id: n.id, title: n.title, status: "pending" as const }))
    setAutoEnrichLogs(logs)
    setEnrichError("")

    const BATCH_SIZE = 5
    for (let i = 0; i < novelList.length; i += BATCH_SIZE) {
      if (!autoEnrichingRef.current) break
      
      const batch = novelList.slice(i, i + BATCH_SIZE)
      setAutoEnrichLogs(prev => prev.map(l => batch.some(b => b.id === l.id) ? { ...l, status: "processing" } : l))

      try {
        const batchRes = await fetch("/api/mod/ai-tools/novel-enrich-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ novelIds: batch.map(n => n.id) })
        })

        const batchData = await batchRes.json()

        if (!batchRes.ok) throw new Error(batchData.error || "Lỗi giao tiếp AI Batch")

        const results = batchData.results || []

        for (const novel of batch) {
          try {
            const best = results.find((r: any) => r.id === novel.id)
            if (!best) throw new Error("AI không phân tích được truyện này (có thể do lỗi cấu trúc)")

            const fullNovel = batchData.sourceNovels?.find((n: any) => n.id === novel.id) || novel
            const editable = createEditableSuggestion(fullNovel, best)

            const currentTitle = normalizeDisplayText(fullNovel.title)
            const currentOriginalTitle = normalizeDisplayText(fullNovel.originalTitle)
            const currentAuthorName = normalizeDisplayText(fullNovel.authorName)
            const currentOriginalAuthorName = normalizeDisplayText(fullNovel.originalAuthorName)
            const currentDescription = normalizeDisplayText(fullNovel.description)
            const currentCoverUrl = normalizeDisplayText(fullNovel.coverUrl)
            const currentStatus = normalizeStatus(fullNovel.status)
            const currentGenres = dedupeGenreNames(fullNovel.genres?.map((g: any) => g.genre?.name || g.name))
            const nextGenres = dedupeGenreNames(editable.genresSuggested)

            const payload: Record<string, unknown> = { id: novel.id }
            let hasChanges = false

            if (editable.title.trim() !== currentTitle) { payload.title = editable.title.trim(); hasChanges = true }
            if (editable.originalTitle.trim() !== currentOriginalTitle) { payload.originalTitle = editable.originalTitle.trim(); hasChanges = true }
            if (editable.authorName.trim() !== currentAuthorName) { payload.authorName = editable.authorName.trim(); hasChanges = true }
            if (editable.originalAuthorName.trim() !== currentOriginalAuthorName) { payload.originalAuthorName = editable.originalAuthorName.trim(); hasChanges = true }
            if (editable.description.trim() !== currentDescription) { payload.description = editable.description.trim(); hasChanges = true }
            if (editable.coverUrl.trim() !== currentCoverUrl) { payload.coverUrl = editable.coverUrl.trim(); hasChanges = true }
            if (editable.status !== currentStatus) { payload.status = editable.status; hasChanges = true }
            if (!areGenreSetsEqual(currentGenres, nextGenres)) { payload.genres = true; hasChanges = true }

            if (!hasChanges) {
              setAutoEnrichLogs(prev => prev.map(l => l.id === novel.id ? { ...l, status: "success", message: "Không cần thay đổi" } : l))
              continue
            }

            if (payload.genres) {
              payload.genreIds = await resolveGenreIdsFromNames(editable.genresSuggested)
              delete payload.genres
            }

            const updateRes = await fetch("/api/mod/truyen", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            })

            if (!updateRes.ok) {
              const errData = await updateRes.json().catch(() => ({}))
              throw new Error(errData?.error || "Lưu DB thất bại")
            }

            setAutoEnrichLogs(prev => prev.map(l => l.id === novel.id ? { ...l, status: "success", message: "Đã cập nhật" } : l))
          } catch (innerErr: any) {
             setAutoEnrichLogs(prev => prev.map(l => l.id === novel.id ? { ...l, status: "failed", message: innerErr.message } : l))
          }
        }

      } catch (err: any) {
         setAutoEnrichLogs(prev => prev.map(l => batch.some(b => b.id === l.id) && l.status === "processing" ? { ...l, status: "failed", message: err.message } : l))
      }
    }
  }

  const handleStartAutoEnrich = async () => {
    if (novels.length === 0) return
    setIsAutoEnriching(true)
    autoEnrichingRef.current = true

    await processNovelList(novels)

    setIsAutoEnriching(false)
    autoEnrichingRef.current = false
  }

  const handleStartGlobalAutoEnrich = async () => {
    setIsGlobalEnriching(true)
    globalEnrichingRef.current = true
    setIsAutoEnriching(true)
    autoEnrichingRef.current = true

    while (globalEnrichingRef.current) {
      try {
        const res = await fetch("/api/mod/ai-tools/novel-search?missing=true")
        if (!res.ok) throw new Error("Chủ động dừng hoặc lỗi truy xuất.")
        const data = await res.json()
        const fetchedNovels = Array.isArray(data) ? data : data.novels || []
        
        if (!fetchedNovels || fetchedNovels.length === 0) {
          toast.success("Tuyệt vời! Đã bù đắp xong toàn bộ truyện bị thiếu thông tin.")
          break
        }

        setNovels(fetchedNovels)
        await processNovelList(fetchedNovels)

      } catch (err: any) {
        toast.error("Tiến trình tự động toàn cục bị dừng: " + err.message)
        break
      }
    }

    setIsGlobalEnriching(false)
    globalEnrichingRef.current = false
    setIsAutoEnriching(false)
    autoEnrichingRef.current = false
  }

  const handleStopAutoEnrich = () => {
    autoEnrichingRef.current = false
    globalEnrichingRef.current = false
    setIsAutoEnriching(false)
    setIsGlobalEnriching(false)
  }

  const handleTestConnection = async () => {
    if (testingConnection) return
    setTestingConnection(true)
    toast.info("Đang kiểm tra kết nối DeepSeek...")

    try {
      const res = await fetch("/api/mod/ai-tools/test-connection")
      const data = await res.json()
      
      if (res.ok) {
        toast.success(`OK! ${data.message}`)
      } else {
        toast.error(data.error || "Thất bại")
      }
    } catch (err: any) {
      toast.error(err.message || "Lỗi Network")
    } finally {
      setTestingConnection(false)
    }
  }

  const handleAddGenreName = (name: string) => {
    const cleaned = normalizeDisplayText(name)
    if (!cleaned) return

    setEditableSuggestion((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        genresSuggested: dedupeGenreNames([...prev.genresSuggested, cleaned]),
      }
    })
    setGenreQuery("")
  }

  const handleRemoveGenreName = (name: string) => {
    const target = normalizeGenreKey(name)
    if (!target) return

    setEditableSuggestion((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        genresSuggested: prev.genresSuggested.filter((item) => normalizeGenreKey(item) !== target),
      }
    })
  }

  const resolveGenreIdsFromNames = async (names: string[]): Promise<string[]> => {
    const wanted = dedupeGenreNames(names)
    if (wanted.length === 0) return []

    let workingGenres = [...genres]
    let hasGenreListChanged = false
    const resolvedByKey = new Map<string, string>()

    for (const genreName of wanted) {
      const key = normalizeGenreKey(genreName)
      const existed = workingGenres.find((item) => normalizeGenreKey(item.name) === key)
      if (existed) {
        resolvedByKey.set(key, existed.id)
        continue
      }

      const createRes = await fetch("/api/mod/the-loai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: genreName, description: "" }),
      })

      const createData = await createRes.json().catch(() => ({} as Partial<Genre> & { error?: string }))
      if (createRes.ok && typeof createData?.id === "string") {
        const createdGenre: Genre = {
          id: createData.id,
          name: typeof createData.name === "string" ? createData.name : genreName,
        }
        workingGenres = [...workingGenres, createdGenre]
        hasGenreListChanged = true
        resolvedByKey.set(key, createdGenre.id)
      }
    }

    const unresolved = wanted.filter((name) => !resolvedByKey.has(normalizeGenreKey(name)))
    if (unresolved.length > 0) {
      const refreshRes = await fetch("/api/mod/the-loai", { cache: "no-store" })
      const refreshData = await refreshRes.json().catch(() => [])
      if (refreshRes.ok && Array.isArray(refreshData)) {
        workingGenres = refreshData
        hasGenreListChanged = true

        for (const name of unresolved) {
          const key = normalizeGenreKey(name)
          const matched = workingGenres.find((item) => normalizeGenreKey(item.name) === key)
          if (matched) {
            resolvedByKey.set(key, matched.id)
          }
        }
      }
    }

    if (hasGenreListChanged) {
      setGenres(workingGenres)
    }

    const missing = wanted.filter((name) => !resolvedByKey.has(normalizeGenreKey(name)))
    if (missing.length > 0) {
      throw new Error(`Không thể xử lý thể loại: ${missing.slice(0, 3).join(", ")}`)
    }

    return wanted
      .map((name) => resolvedByKey.get(normalizeGenreKey(name)) || "")
      .filter(Boolean)
  }

  const handleApplySuggestion = async () => {
    if (!comparisonNovel || !editableSuggestion || !changedPayload.payload) return

    if (changedPayload.changedKeys.length === 0) {
      setApplySuccess("Không có trường nào thay đổi để cập nhật.")
      setApplyError("")
      return
    }

    setApplyingSuggestion(true)
    setApplyError("")
    setApplySuccess("")

    try {
      const payload: Record<string, unknown> = { ...changedPayload.payload }
      if (changedPayload.changedKeys.includes("genres")) {
        payload.genreIds = await resolveGenreIdsFromNames(editableSuggestion.genresSuggested)
      }

      const res = await fetch("/api/mod/truyen", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || "Không thể cập nhật truyện")
      }

      setComparisonNovel((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          title: editableSuggestion.title,
          originalTitle: editableSuggestion.originalTitle,
          authorName: editableSuggestion.authorName,
          originalAuthorName: editableSuggestion.originalAuthorName,
          description: editableSuggestion.description,
          coverUrl: editableSuggestion.coverUrl,
          status: editableSuggestion.status,
          genres: dedupeGenreNames(editableSuggestion.genresSuggested),
          updatedAt: new Date().toISOString(),
        }
      })

      setNovels((prev) =>
        prev.map((row) =>
          row.id === comparisonNovel.id
            ? {
                ...row,
                title: editableSuggestion.title,
                originalTitle: editableSuggestion.originalTitle,
                authorName: editableSuggestion.authorName,
                originalAuthorName: editableSuggestion.originalAuthorName,
                description: editableSuggestion.description,
                coverUrl: editableSuggestion.coverUrl,
                status: editableSuggestion.status,
                updatedAt: new Date().toISOString(),
              }
            : row
        )
      )

      setApplySuccess(`Đã cập nhật ${changedPayload.changedKeys.length} trường thay đổi.`)
    } catch (error: any) {
      setApplyError(error?.message || "Không thể cập nhật truyện")
    } finally {
      setApplyingSuggestion(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Công cụ AI</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Tìm truyện trong database trước. Sau đó bấm "Bổ sung thông tin" để AI tìm và đề xuất metadata.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Thứ tự provider hiện tại: Google AI {">"} DeepSeek (OpenRouter đang tạm dừng)
        </p>
        {(provider || model) && (
          <p className="mt-2 text-xs text-primary">
            Provider được dùng: {provider || "không rõ"} {model ? `| Model: ${model}` : ""}
          </p>
        )}
      </div>

      <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
        <label className="text-sm font-medium">Tìm truyện trong database</label>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-4 mb-2 border-b pb-4 border-border/50">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary" checked={missingFilter} onChange={(e) => setMissingFilter(e.target.checked)} />
              Chỉ hiện truyện thiếu thông tin
            </label>
            
            <div className="flex items-center gap-2 ml-auto">
              <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={testingConnection || isAutoEnriching || isGlobalEnriching}>
                {testingConnection ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                Test API DeepSeek
              </Button>
              {(!isAutoEnriching && !isGlobalEnriching) ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleStartAutoEnrich} disabled={novels.length === 0}>
                    <Bot className="mr-2 h-4 w-4" /> Bổ sung Trang này
                  </Button>
                  <Button variant="default" size="sm" onClick={handleStartGlobalAutoEnrich} disabled={!missingFilter}>
                    <Sparkles className="mr-2 h-4 w-4" /> Tự động Bù toàn bộ
                  </Button>
                </>
              ) : (
                <Button variant="destructive" size="sm" onClick={handleStopAutoEnrich}>
                   Dừng Bổ sung {isGlobalEnriching ? "Toàn bộ" : ""}
                </Button>
              )}
            </div>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            {searching && <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
            <Input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Nhập tên truyện, tác giả, slug..."
              className="pl-8 pr-8"
              disabled={isAutoEnriching}
            />
          </div>
          <p className="text-xs text-muted-foreground">Ô tìm kiếm này là live search, kết quả sẽ tự động cập nhật khi bạn nhập.</p>
        </div>

        {autoEnrichLogs.length > 0 && (
          <div className="mb-4 rounded-md border p-3 bg-muted/30">
            <div className="flex items-center justify-between mb-2">
               <h3 className="text-sm font-semibold">Tiến trình bổ sung hàng loạt:</h3>
               <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setAutoEnrichLogs([])}>Xóa log</Button>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-1 text-xs custom-scrollbar pr-2">
              {autoEnrichLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-1.5 border-b last:border-0 border-border/50">
                  <span className="font-medium truncate w-[60%]" title={log.title}>{log.title}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {log.status === "pending" && <span className="text-muted-foreground">Chờ xử lý...</span>}
                    {log.status === "processing" && <span className="text-blue-500 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin"/> Đang phân tích...</span>}
                    {log.status === "success" && <span className="text-emerald-600 font-medium">{log.message || "Thành công"}</span>}
                    {log.status === "failed" && <span className="text-destructive font-medium">{log.message || "Lỗi"}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {searchError && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {searchError}
          </div>
        )}

        <div className="space-y-3">
          {novels.length === 0 && !searching ? (
            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
              {canSearch ? "Không tìm thấy truyện phù hợp." : "Nhập từ khóa hoặc tick chọn Lọc truyện thiếu thông tin để bắt đầu."}
            </div>
          ) : (
            novels.map((novel) => (
              <div key={novel.id} className="rounded-lg border p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  <div className="h-20 w-14 shrink-0 overflow-hidden rounded-md border bg-muted">
                    {novel.coverUrl ? <img src={novel.coverUrl} alt={novel.title} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{novel.title}</p>
                    <p className="text-xs text-muted-foreground">Tác giả: {novel.authorName}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{normalizeDisplayText(novel.description) || "(Không có mô tả)"}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => void handleEnrich(novel.id)}
                    disabled={enrichingNovelId === novel.id || isAutoEnriching}
                    className="shrink-0"
                  >
                    {enrichingNovelId === novel.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                    Bổ sung thông tin
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {hasMore && (
          <div className="flex justify-center pt-4">
            <Button variant="secondary" onClick={handleLoadMore} disabled={searching || isAutoEnriching || isGlobalEnriching}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Tải thêm (Page {page + 1})
            </Button>
          </div>
        )}
      </div>

      {attempts.length > 0 && (
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Trạng thái model/provider</p>
          <div className="space-y-2">
            {attempts.map((item, idx) => (
              <div key={`${item.provider}-${item.model}-${idx}`} className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full border px-2 py-0.5 bg-background">{item.provider}</span>
                <span className="rounded-full border px-2 py-0.5 bg-background">{item.model}</span>
                <span
                  className={`rounded-full px-2 py-0.5 font-semibold ${
                    item.status === "success"
                      ? "bg-emerald-100 text-emerald-700"
                      : item.status === "failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {item.status === "success" ? "Thành công" : item.status === "failed" ? "Thất bại" : "Bỏ qua"}
                </span>
                {typeof item.latencyMs === "number" && <span className="text-muted-foreground">{item.latencyMs}ms</span>}
                {item.message && <span className="text-muted-foreground">- {item.message}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {enrichError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {enrichError}
        </div>
      )}

      {applyError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          {applyError}
        </div>
      )}

      {applySuccess && (
        <div className="rounded-md border border-emerald-400/40 bg-emerald-500/10 p-3 text-sm text-emerald-700">
          {applySuccess}
        </div>
      )}

      {comparisonNovel && editableSuggestion && (
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold">So sánh thông tin trước/sau bổ sung</h2>
            <Button onClick={() => void handleApplySuggestion()} disabled={applyingSuggestion || changedPayload.changedKeys.length === 0}>
              {applyingSuggestion ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Xác nhận cập nhật
            </Button>
          </div>

          <div className="rounded-md border p-3 space-y-3">
            <p className="text-sm font-medium">Bạn có thể chỉnh tay dữ liệu AI trước khi cập nhật</p>
            <p className="text-xs text-muted-foreground">Hiện có {changedPayload.changedKeys.length} trường thay đổi so với dữ liệu hiện tại.</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Tên truyện</label>
                <Input
                  value={editableSuggestion.title}
                  onChange={(e) => setEditableSuggestion((prev) => (prev ? { ...prev, title: e.target.value } : prev))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Tên gốc</label>
                <Input
                  value={editableSuggestion.originalTitle}
                  onChange={(e) => setEditableSuggestion((prev) => (prev ? { ...prev, originalTitle: e.target.value } : prev))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Tác giả</label>
                <Input
                  value={editableSuggestion.authorName}
                  onChange={(e) => setEditableSuggestion((prev) => (prev ? { ...prev, authorName: e.target.value } : prev))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Tác giả gốc</label>
                <Input
                  value={editableSuggestion.originalAuthorName}
                  onChange={(e) => setEditableSuggestion((prev) => (prev ? { ...prev, originalAuthorName: e.target.value } : prev))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Trạng thái</label>
                <select
                  value={editableSuggestion.status}
                  onChange={(e) =>
                    setEditableSuggestion((prev) =>
                      prev
                        ? {
                            ...prev,
                            status: (e.target.value as "Đang ra" | "Hoàn thành" | "Tạm ngưng"),
                          }
                        : prev
                    )
                  }
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                >
                  <option value="Đang ra">Đang ra</option>
                  <option value="Hoàn thành">Hoàn thành</option>
                  <option value="Tạm ngưng">Tạm ngưng</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Link ảnh bìa</label>
                <Input
                  value={editableSuggestion.coverUrl}
                  onChange={(e) => setEditableSuggestion((prev) => (prev ? { ...prev, coverUrl: e.target.value } : prev))}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Mô tả</label>
              <textarea
                value={editableSuggestion.description}
                onChange={(e) => setEditableSuggestion((prev) => (prev ? { ...prev, description: e.target.value } : prev))}
                rows={6}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Thể loại</label>
              <div className="flex gap-2">
                <Input
                  value={genreQuery}
                  onChange={(e) => setGenreQuery(e.target.value)}
                  placeholder="Nhập thể loại rồi bấm Thêm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddGenreName(genreQuery)
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={() => handleAddGenreName(genreQuery)} disabled={!genreQuery.trim()}>
                  Thêm
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5 rounded-md border bg-background p-2">
                {selectedGenreNames.length === 0 ? (
                  <span className="text-xs text-muted-foreground">Chưa có thể loại nào.</span>
                ) : (
                  selectedGenreNames.map((name) => (
                    <span key={name} className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs">
                      {name}
                      <button
                        type="button"
                        className="rounded px-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                        onClick={() => handleRemoveGenreName(name)}
                        aria-label={`Xóa thể loại ${name}`}
                      >
                        x
                      </button>
                    </span>
                  ))
                )}
              </div>

              {genreQuery.trim().length > 0 && matchedGenres.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {matchedGenres.map((genre) => (
                    <button
                      key={genre.id}
                      type="button"
                      onClick={() => handleAddGenreName(genre.name)}
                      className="rounded-full border bg-muted px-2 py-0.5 text-xs hover:bg-muted/80"
                    >
                      {genre.name}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Khi cập nhật, hệ thống sẽ tự map thể loại theo dữ liệu hiện có và tự tạo thể loại mới nếu chưa tồn tại.
              </p>
            </div>
          </div>

          <FieldDiff label="Tên truyện" current={comparisonNovel.title} suggested={editableSuggestion.title} />
          <FieldDiff label="Tên gốc" current={comparisonNovel.originalTitle} suggested={editableSuggestion.originalTitle} />
          <FieldDiff label="Tác giả" current={comparisonNovel.authorName} suggested={editableSuggestion.authorName} />
          <FieldDiff label="Tác giả gốc" current={comparisonNovel.originalAuthorName} suggested={editableSuggestion.originalAuthorName} />
          <FieldDiff label="Trạng thái" current={comparisonNovel.status} suggested={editableSuggestion.status} />
          <FieldDiff label="Mô tả" current={comparisonNovel.description} suggested={editableSuggestion.description} />
          <FieldDiff
            label="Thể loại"
            current={dedupeGenreNames(comparisonNovel.genres).join(", ")}
            suggested={dedupeGenreNames(editableSuggestion.genresSuggested).join(", ")}
          />

          {Array.isArray(suggestion?.genresSuggested) && suggestion.genresSuggested.length > 0 && (
            <div className="rounded-md border p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Thể loại AI đề xuất</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {suggestion.genresSuggested.map((genre) => (
                  <span key={genre} className="rounded-full bg-muted px-2 py-0.5 text-xs">{genre}</span>
                ))}
              </div>
            </div>
          )}

          {suggestions.length > 1 && (
            <div className="rounded-md border p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Các kết quả AI khác</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {suggestions.slice(1).map((row, idx) => (
                  <li key={`${row.title}-${idx}`} className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-2 py-1.5">
                    <span>
                      {row.title} - {row.authorName} ({row.confidence || 0}%)
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (!comparisonNovel) return
                        setSuggestion(row)
                        setEditableSuggestion(createEditableSuggestion(comparisonNovel, row))
                        setGenreQuery("")
                        setApplyError("")
                        setApplySuccess("")
                      }}
                    >
                      Dùng kết quả này
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
