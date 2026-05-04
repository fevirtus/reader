"use client"

import { useEffect, useMemo, useState } from "react"
import { Check, Loader2, Sparkles, Trash2, UploadCloud, X, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

type AssetItem = {
  id: string
  path?: string
  title?: string | null
  author?: string | null
  status: string
  updatedAt: string
}

type ParsePreviewSample = {
  bucket: string
  number: number
  title: string
  chars: number
  preview: string
}

type Genre = {
  id: string
  name: string
}

export function ImportClient() {
  const [step, setStep] = useState(1)
  const [uploadingEpub, setUploadingEpub] = useState(false)
  const [asset, setAsset] = useState<AssetItem | null>(null)
  const [epubFile, setEpubFile] = useState<File | null>(null)
  const [coverDetected, setCoverDetected] = useState(false)
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("")
  const [uploadingCover, setUploadingCover] = useState(false)

  const [title, setTitle] = useState("")
  const [author, setAuthor] = useState("")
  const [shortDescription, setShortDescription] = useState("")
  const [genres, setGenres] = useState<Genre[]>([])
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([])
  const [genreQuery, setGenreQuery] = useState("")
  const [addingGenre, setAddingGenre] = useState(false)
  const [splitMode, setSplitMode] = useState<"toc" | "regex">("toc")
  const [chapterStartPattern, setChapterStartPattern] = useState("^\\s*(?:[#>*\\-\\[]\\s*)*(?:ch(?:u\\.?|ương|uong)?|chapter|hồi|hoi|quyển|quyen|phần|phan|tập|tap)\\s*\\d+(?:[\\.:\\-\\)]\\s*|\\s+).+$")
  const [replaceExisting, setReplaceExisting] = useState(false)

  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewItems, setPreviewItems] = useState<ParsePreviewSample[]>([])
  const [chapterCount, setChapterCount] = useState(0)
  const [parseError, setParseError] = useState("")

  const [aiLoading, setAiLoading] = useState(false)
  const [aiModel, setAiModel] = useState("")
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)

  const normalizedGenreQuery = genreQuery.trim().toLowerCase()
  const exactMatchedGenre = useMemo(
    () => genres.find((genre) => genre.name.trim().toLowerCase() === normalizedGenreQuery) || null,
    [genres, normalizedGenreQuery],
  )
  const matchedGenres = useMemo(() => {
    if (!normalizedGenreQuery) return []
    return genres.filter((genre) => genre.name.toLowerCase().includes(normalizedGenreQuery)).slice(0, 20)
  }, [genres, normalizedGenreQuery])
  const selectedGenreItems = useMemo(
    () => genres.filter((genre) => selectedGenreIds.includes(genre.id)),
    [genres, selectedGenreIds],
  )

  const fetchGenres = async (): Promise<Genre[]> => {
    const res = await fetch("/api/mod/the-loai", { credentials: "include" })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || data?.detail || "Không lấy được thể loại")
    const next = Array.isArray(data) ? (data as Genre[]) : []
    setGenres(next)
    return next
  }

  const toggleGenre = (id: string) => {
    setSelectedGenreIds((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]))
  }

  const handleAddGenre = async () => {
    const name = genreQuery.trim()
    if (!name) return
      const existed = genres.find((genre) => genre.name.trim().toLowerCase() === name.toLowerCase())
      if (existed) {
      setSelectedGenreIds((prev) => (prev.includes(existed.id) ? prev : [...prev, existed.id]))
      setGenreQuery("")
      return
    }
    setAddingGenre(true)
    try {
      const res = await fetch("/api/mod/the-loai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, description: "" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || data?.detail || "Không tạo được thể loại")
      await fetchGenres()
      if (data?.id) {
        setSelectedGenreIds((prev) => (prev.includes(data.id) ? prev : [...prev, data.id]))
      }
      setGenreQuery("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tạo được thể loại")
    } finally {
      setAddingGenre(false)
    }
  }

  const handleDeleteGenre = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc muốn xóa thể loại "${name}" khỏi hệ thống?`)) return
    try {
      const res = await fetch(`/api/mod/the-loai?id=${id}`, { method: "DELETE", credentials: "include" })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || data?.detail || "Không xóa được thể loại")
      await fetchGenres()
      setSelectedGenreIds((prev) => prev.filter((v) => v !== id))
      if (genreQuery.trim().toLowerCase() === name.trim().toLowerCase()) {
        setGenreQuery("")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không xóa được thể loại")
    }
  }

  const ensureGenreIdsByNames = async (names: string[]): Promise<string[]> => {
    const uniqueNames = [...new Set(names.map((n) => n.trim()).filter(Boolean))].slice(0, 6)
    if (uniqueNames.length === 0) return []

    let genreList = await fetchGenres()
    const ids: string[] = []

    for (const name of uniqueNames) {
      const existing = genreList.find((g) => g.name.trim().toLowerCase() === name.toLowerCase())
      if (existing) {
        ids.push(existing.id)
        continue
      }

      const res = await fetch("/api/mod/the-loai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, description: "" }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || data?.detail || `Không thể tạo thể loại: ${name}`)
      }
      if (data?.id) {
        ids.push(data.id)
      }
      genreList = await fetchGenres()
    }

    return [...new Set(ids)].slice(0, 6)
  }

  const onUploadEpub = async (file: File) => {
    setUploadingEpub(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/import/uploads/preview", { method: "POST", credentials: "include", body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || "Không tải được EPUB")
      setEpubFile(file)
      const item: AssetItem = {
        id: `preview-${Date.now()}`,
        title: data.suggested?.title || file.name,
        author: data.suggested?.author || "Unknown",
        status: "discovered",
        updatedAt: new Date().toISOString(),
      }
      await onSelectAsset(item, data)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được EPUB")
    } finally {
      setUploadingEpub(false)
    }
  }

  const onSelectAsset = async (item: AssetItem, previewData?: any) => {
    setAsset(item)
    setStep(2)
    setCoverPreviewUrl("")
    try {
      const data = previewData || {}
      const suggested = data?.suggested || {}
      setCoverDetected(Boolean(data?.coverDetected))
      setCoverPreviewUrl(typeof data?.coverPreviewDataUrl === "string" ? data.coverPreviewDataUrl : "")
      setTitle(suggested.title || item.title || "")
      setAuthor(suggested.author || item.author || "Unknown")
      setShortDescription(suggested.shortDescription || "")
      const genreList = await fetchGenres()
      const suggestedGenres: string[] = suggested.genres || []
      if (suggestedGenres.length > 0) {
        const lowered = suggestedGenres.map((v) => v.trim().toLowerCase())
        const ids = genreList.filter((g) => lowered.includes(g.name.trim().toLowerCase())).map((g) => g.id)
        setSelectedGenreIds(ids.slice(0, 6))
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không lấy được metadata")
    }
  }

  const onUploadReplacementCover = async (file: File) => {
    if (!asset) return
    setUploadingCover(true)
    try {
      setCoverDetected(true)
      setCoverPreviewUrl(URL.createObjectURL(file))
      toast.success("Da upload cover thay the")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload cover that bai")
    } finally {
      setUploadingCover(false)
    }
  }

  const onAiSuggest = async () => {
    if (!asset || !epubFile) return
    setAiLoading(true)
    try {
      const form = new FormData()
      form.append("file", epubFile)
      form.append("preview", "true")
      form.append("splitMode", splitMode)
      if (splitMode === "regex") form.append("chapterRegex", chapterStartPattern)
      form.append("title", title)
      form.append("authorName", author)
      const res = await fetch("/api/mod/epub/ai-suggest", { method: "POST", credentials: "include", body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || "AI suggest failed")
      const suggestedGenres: string[] = (data?.suggestedGenres || []).slice(0, 6)
      setAiModel(String(data?.model || data?.source || ""))
      setGenreQuery("")
      if (suggestedGenres.length > 0) {
        const ensuredIds = await ensureGenreIdsByNames(suggestedGenres)
        setSelectedGenreIds(ensuredIds)
      }
      setShortDescription(data?.shortDescription || "")
      toast.success("Đã áp dụng gợi ý AI")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI suggest lỗi")
    } finally {
      setAiLoading(false)
    }
  }

  const onSaveReview = async () => {
    if (!asset) return
    try {
      toast.success("Đã lưu review")
      setPreviewItems([])
      setChapterCount(0)
      setStep(3)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lưu review thất bại")
    }
  }

  const onParsePreview = async () => {
    if (!asset || !epubFile) return
    setPreviewLoading(true)
    setPreviewItems([])
    setChapterCount(0)
    setParseError("")
    try {
      const form = new FormData()
      form.append("file", epubFile)
      form.append("preview", "true")
      form.append("splitMode", splitMode)
      if (splitMode === "regex") form.append("chapterRegex", chapterStartPattern)
      const res = await fetch("/api/mod/epub", { method: "POST", credentials: "include", body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || "Parse preview thất bại")
      const chapters = Array.isArray(data?.chaptersPreview) ? data.chaptersPreview : []
      setPreviewItems(chapters.map((c: any) => ({ bucket: "preview", number: c.number || 0, title: c.title || "", chars: (c.excerpt || "").length, preview: c.excerpt || "" })))
      setChapterCount(Number(data?.novel?.totalChapters || chapters.length || 0))
      if ((Number(data?.novel?.totalChapters || chapters.length || 0)) <= 0) {
        setParseError("Không tách được chương từ EPUB này với cấu hình hiện tại. Thử đổi TOC/Regex rồi parse lại.")
      }
      toast.success("Đã tạo preview chương")
    } catch (error) {
      setParseError(error instanceof Error ? error.message : "Preview thất bại")
      toast.error(error instanceof Error ? error.message : "Preview thất bại")
    } finally {
      setPreviewLoading(false)
    }
  }

  const onStartImport = async () => {
    if (!asset || !epubFile) return
    setImporting(true)
    try {
      const form = new FormData()
      form.append("file", epubFile)
      form.append("preview", "false")
      form.append("splitMode", splitMode)
      if (splitMode === "regex") form.append("chapterRegex", chapterStartPattern)
      form.append("title", title)
      form.append("authorName", author)
      form.append("description", shortDescription)
      form.append("replaceExisting", String(replaceExisting))
      const res = await fetch("/api/mod/epub", { method: "POST", credentials: "include", body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.detail || "Start import thất bại")
      setResult(data || null)
      setStep(4)
      setImporting(false)
      toast.success("Import hoàn tất")
    } catch (error) {
      setImporting(false)
      toast.error(error instanceof Error ? error.message : "Không bắt đầu import được")
    }
  }

  useEffect(() => {
    setPreviewItems([])
    setChapterCount(0)
    setParseError("")
  }, [splitMode, chapterStartPattern])

  useEffect(() => {
    if (step === 3 && asset) {
      void onParsePreview()
    }
  }, [step, asset?.id])

  useEffect(() => {
    fetchGenres().catch(() => {
      setGenres([])
    })
  }, [])

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Import EPUB Wizard</h1>
        <p className="text-sm text-muted-foreground">4 bước: Upload -&gt; Metadata -&gt; Chapter Preview -&gt; Import</p>
      </div>

      <div className="grid gap-2 md:grid-cols-4">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className={`rounded-lg border p-3 text-sm ${step >= n ? "border-primary bg-primary/5" : "border-border"}`}>
            Bước {n}
          </div>
        ))}
      </div>

      {step === 1 && (
        <section className="space-y-3 rounded-xl border p-4">
          <p className="text-sm text-muted-foreground">Chọn file EPUB từ máy của bạn để bắt đầu.</p>
          <Input
            type="file"
            accept=".epub,application/epub+zip"
            disabled={uploadingEpub}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                void onUploadEpub(file)
              }
              e.currentTarget.value = ""
            }}
          />
          {uploadingEpub && <p className="text-xs text-muted-foreground">Đang tải và phân tích EPUB...</p>}
        </section>
      )}

      {step === 2 && asset && (
        <section className="space-y-3 rounded-xl border p-4">
          <h2 className="font-semibold">Review metadata</h2>
          <p className={`text-xs ${coverDetected ? "text-emerald-600" : "text-muted-foreground"}`}>
            {coverDetected
              ? "Da nhan dien duoc cover trong EPUB. He thong se upload len R2 khi bat dau import."
              : "Chua nhan dien duoc cover trong EPUB (neu co)."}
          </p>
          <div className="flex flex-wrap items-start gap-4 rounded-md border bg-muted/20 p-3">
            <div className="h-44 w-32 overflow-hidden rounded border bg-background">
              {coverPreviewUrl ? (
                <img
                  src={coverPreviewUrl}
                  alt="Cover preview"
                  className="h-full w-full object-cover"
                  onError={() => {
                    setCoverPreviewUrl("")
                    setCoverDetected(false)
                    toast.error("Khong tai duoc cover preview tu server")
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Khong co preview</div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cover thay the (neu can)</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    void onUploadReplacementCover(file)
                  }
                }}
                disabled={uploadingCover}
              />
              <p className="text-xs text-muted-foreground">Upload anh thay the de uu tien dung cover nay khi import.</p>
            </div>
          </div>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Tiêu đề" />
          <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Tác giả" />
          <Textarea value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} placeholder="Mô tả ngắn" rows={4} />
          <div className="space-y-2 rounded-md border bg-card p-3">
            <div className="flex gap-2">
              <Input
                value={genreQuery}
                onChange={(e) => setGenreQuery(e.target.value)}
                placeholder="Nhập để tìm hoặc tạo thể loại..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    void handleAddGenre()
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={handleAddGenre} disabled={addingGenre || !genreQuery.trim()}>
                {addingGenre ? <Loader2 className="h-4 w-4 animate-spin" /> : (exactMatchedGenre ? (selectedGenreIds.includes(exactMatchedGenre.id) ? "Đã chọn" : "Chọn") : "Tạo")}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedGenreItems.map((genre) => (
                <div key={genre.id} className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs text-primary">
                  <span className="font-medium">{genre.name}</span>
                  <button type="button" className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-muted" onClick={() => toggleGenre(genre.id)}>
                    <X className="h-3 w-3" />
                  </button>
                  <button type="button" className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleDeleteGenre(genre.id, genre.name)}>
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {selectedGenreItems.length === 0 && <span className="text-xs text-muted-foreground">Chưa chọn thể loại</span>}
            </div>
            {genreQuery.trim().length > 0 && (
              <div className="border-t pt-2">
                <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Kết quả phù hợp</p>
                <div className="flex flex-wrap gap-2">
                  {matchedGenres.map((genre) => {
                    const isSelected = selectedGenreIds.includes(genre.id)
                    return (
                      <div key={genre.id} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted/50 text-muted-foreground"}`}>
                        <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleGenre(genre.id)}>
                          {genre.name}
                          {isSelected && <Check className="h-3 w-3" />}
                        </button>
                        <button type="button" className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-destructive hover:text-destructive-foreground" onClick={() => handleDeleteGenre(genre.id, genre.name)}>
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={replaceExisting} onChange={(e) => setReplaceExisting(e.target.checked)} />
            Replace chapter đã tồn tại
          </label>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onAiSuggest} disabled={aiLoading}>{aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} AI gợi ý</Button>
            <Button onClick={onSaveReview}>Lưu & sang bước 3</Button>
          </div>
          {aiModel && <p className="text-xs text-muted-foreground">AI model: {aiModel}</p>}
        </section>
      )}

      {step === 3 && asset && (
        <section className="space-y-3 rounded-xl border p-4">
          <div className="flex flex-wrap items-center gap-3 rounded-md border bg-muted/30 p-3">
            <label className="text-sm font-medium">Tách chương:</label>
            <select className="rounded border px-2 py-1 text-sm" value={splitMode} onChange={(e) => setSplitMode(e.target.value as "toc" | "regex")}>
              <option value="toc">TOC (lọc intro/mục lục)</option>
              <option value="regex">Regex tiếng Việt</option>
            </select>
            {splitMode === "regex" && (
              <Input value={chapterStartPattern} onChange={(e) => setChapterStartPattern(e.target.value)} placeholder="Regex bắt đầu chương" />
            )}
          </div>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Preview chapters</h2>
            <Button onClick={onParsePreview} disabled={previewLoading}>{previewLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Parse preview</Button>
          </div>
          <p className="text-sm text-muted-foreground">Số chương phát hiện: {chapterCount}</p>
          {parseError && (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{parseError}</p>
          )}
          <div className="max-h-[420px] space-y-2 overflow-auto rounded-lg border p-3">
            {previewItems.map((item) => (
              <div key={`${item.bucket}-${item.number}`} className="rounded border p-2">
                <p className="text-xs text-muted-foreground">{item.bucket.toUpperCase()} • Chương {item.number} • {item.chars} chars</p>
                <p className="font-medium">{item.title || `Chương ${item.number}`}</p>
                <p className="text-sm text-muted-foreground">{item.preview}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep(2)}>Quay lại bước 2</Button>
            <Button onClick={onStartImport} disabled={importing || previewItems.length === 0}>{importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />} Bắt đầu import</Button>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="space-y-3 rounded-xl border p-4">
          <h2 className="font-semibold">Import result</h2>
          {result && (
            <pre className="overflow-auto rounded bg-muted p-3 text-xs">{JSON.stringify(result, null, 2)}</pre>
          )}
        </section>
      )}
    </div>
  )
}
