"use client"

import { useState } from "react"
import type { InputHTMLAttributes } from "react"
import { Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

/** Đồng bộ với `MOD_EPUB_MAX_CHAPTERS` trên reader-api. */
const BATCH_IMPORT_MAX_CHAPTERS = 4000
/** Một EPUB: preview + AI + parse + import — vượt quá thì hủy và sang file kế. */
const BATCH_IMPORT_MAX_MS_PER_FILE = 25 * 60 * 1000

type Genre = { id: string; name: string }

type BatchRow = {
  fileName: string
  ok: boolean
  novelId?: string
  /** Tiêu đề sau preview (dùng so trùng DB / hiển thị cho mod). */
  resolvedTitle?: string
  error?: string
  skippedDuplicate?: boolean
  skippedGuard?: boolean
  chapters?: number
}

function isAbortError(e: unknown): boolean {
  return e instanceof DOMException && e.name === "AbortError"
}

/** Đường dẫn hiển thị khi chọn từ thư mục (Chrome: folder/book.epub) */
function getFileLabel(file: File): string {
  const rp = (file as File & { webkitRelativePath?: string }).webkitRelativePath
  return rp && rp.trim().length > 0 ? rp.trim() : file.name || "upload.epub"
}

function epubFilesOnly(files: FileList | File[]): File[] {
  return Array.from(files).filter((f) => /\.epub$/i.test(f.name))
}

/** Giống chuẩn hóa tiêu đề khi so `Novel.lower(title)` trên API. */
function normalizeNovelTitle(raw: string): string {
  return raw.split(/\s+/).join(" ").trim()
}

export function ImportBatchClient() {
  const [splitMode, setSplitMode] = useState<"toc" | "regex">("toc")
  const [chapterStartPattern, setChapterStartPattern] = useState(
    "^\\s*(?:[#>*\\-\\[]\\s*)*(?:ch(?:u\\.?|ương|uong)?|chapter|hồi|hoi|quyển|quyen|phần|phan|tập|tap)\\s*\\d+(?:[\\.:\\-\\)]\\s*|\\s+).+$",
  )
  const [replaceExisting, setReplaceExisting] = useState(false)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [rows, setRows] = useState<BatchRow[]>([])

  const fetchGenres = async (signal?: AbortSignal): Promise<Genre[]> => {
    const res = await fetch("/api/mod/the-loai", { credentials: "include", signal })
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || data?.detail || "Không lấy được thể loại")
    return Array.isArray(data) ? (data as Genre[]) : []
  }

  const ensureGenreIdsByNames = async (names: string[], signal?: AbortSignal): Promise<string[]> => {
    const uniqueNames = [...new Set(names.map((n) => n.trim()).filter(Boolean))].slice(0, 6)
    if (uniqueNames.length === 0) return []

    let genreList = await fetchGenres(signal)
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
        signal,
        body: JSON.stringify({ name, description: "" }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || data?.detail || `Không thể tạo thể loại: ${name}`)
      }
      if (data?.id) {
        ids.push(data.id)
      }
      genreList = await fetchGenres(signal)
    }

    return [...new Set(ids)].slice(0, 6)
  }

  const processOneFile = async (file: File, signal: AbortSignal): Promise<BatchRow> => {
    const displayPath = getFileLabel(file)
    const baseName = file.name || "upload.epub"

    const formPreview = new FormData()
    formPreview.append("file", file)
    const r1 = await fetch("/api/import/uploads/preview", {
      method: "POST",
      credentials: "include",
      body: formPreview,
      signal,
    })
    const d1 = await r1.json().catch(() => ({}))
    if (!r1.ok) {
      return {
        fileName: displayPath,
        ok: false,
        error: String(d1?.detail || "Bước 1: preview EPUB thất bại"),
      }
    }

    const title =
      String(d1?.suggested?.title || "").trim() || baseName.replace(/\.epub$/i, "") || "Untitled"
    const author = String(d1?.suggested?.author || "").trim() || "Unknown"
    const normalizedTitle = normalizeNovelTitle(title) || "Untitled"

    if (!replaceExisting) {
      const checkUrl = `/api/mod/truyen/by-title?title=${encodeURIComponent(normalizedTitle)}`
      const cr = await fetch(checkUrl, { credentials: "include", signal })
      const cd = await cr.json().catch(() => ({}))
      if (cr.ok && cd?.exists === true && cd?.novel?.id) {
        const nt = String(cd.novel.title || normalizedTitle)
        const nid = String(cd.novel.id)
        return {
          fileName: displayPath,
          ok: false,
          skippedDuplicate: true,
          resolvedTitle: title,
          novelId: nid,
          error: `Đã có trong DB — bỏ qua batch · «${nt}» · novelId: ${nid}`,
        }
      }
    }

    const formAi = new FormData()
    formAi.append("file", file)
    formAi.append("splitMode", splitMode)
    if (splitMode === "regex") formAi.append("chapterRegex", chapterStartPattern)
    formAi.append("title", title)
    formAi.append("authorName", author)

    const r2 = await fetch("/api/mod/epub/ai-suggest", {
      method: "POST",
      credentials: "include",
      body: formAi,
      signal,
    })
    const d2 = await r2.json().catch(() => ({}))
    if (!r2.ok) {
      return {
        fileName: displayPath,
        ok: false,
        resolvedTitle: title,
        error: String(d2?.detail || "Bước 2: AI gợi ý thất bại"),
      }
    }

    const genreNames: string[] = (d2?.suggestedGenres || []).slice(0, 6)
    let genreIds: string[] = []
    try {
      genreIds = await ensureGenreIdsByNames(genreNames, signal)
    } catch (e) {
      return {
        fileName: displayPath,
        ok: false,
        resolvedTitle: title,
        error: e instanceof Error ? e.message : "Bước 2: tạo/ghép thể loại thất bại",
      }
    }

    const description = String(d2?.shortDescription || "").trim()
    const statusRaw = String(d2?.suggestedStatus || "").trim()
    const status =
      statusRaw === "Hoàn thành" || statusRaw === "Tạm ngưng" || statusRaw === "Đang ra" ? statusRaw : "Đang ra"

    const formParse = new FormData()
    formParse.append("file", file)
    formParse.append("preview", "true")
    formParse.append("splitMode", splitMode)
    if (splitMode === "regex") formParse.append("chapterRegex", chapterStartPattern)

    const r3 = await fetch("/api/mod/epub", { method: "POST", credentials: "include", body: formParse, signal })
    const d3 = await r3.json().catch(() => ({}))
    if (!r3.ok) {
      return {
        fileName: displayPath,
        ok: false,
        resolvedTitle: title,
        error: String(d3?.detail || "Bước 3: tách chương (preview) thất bại"),
      }
    }

    const chapterCount = Number(d3?.novel?.totalChapters ?? d3?.chapterCount ?? 0)
    if (d3?.importBlocked === true || chapterCount > BATCH_IMPORT_MAX_CHAPTERS) {
      return {
        fileName: displayPath,
        ok: false,
        skippedGuard: true,
        resolvedTitle: title,
        chapters: chapterCount || undefined,
        error: String(
          d3?.importBlockedReason ||
            `Quá ${BATCH_IMPORT_MAX_CHAPTERS.toLocaleString()} chương (${chapterCount.toLocaleString()}) — đã bỏ qua`,
        ),
      }
    }
    const sampleLen = Array.isArray(d3?.sample) ? d3.sample.length : 0
    const chaptersPrevLen = Array.isArray(d3?.chaptersPreview) ? d3.chaptersPreview.length : 0
    if (chapterCount <= 0 && sampleLen <= 0 && chaptersPrevLen <= 0) {
      return {
        fileName: displayPath,
        ok: false,
        resolvedTitle: title,
        error: "Bước 3: không tách được chương với cấu hình TOC/Regex hiện tại",
      }
    }

    const formImport = new FormData()
    formImport.append("file", file)
    formImport.append("preview", "false")
    formImport.append("splitMode", splitMode)
    if (splitMode === "regex") formImport.append("chapterRegex", chapterStartPattern)
    formImport.append("title", title)
    formImport.append("authorName", author)
    formImport.append("status", status)
    formImport.append("description", description)
    formImport.append("genreIds", genreIds.join(","))
    formImport.append("replaceExisting", String(replaceExisting))

    const r4 = await fetch("/api/mod/epub", { method: "POST", credentials: "include", body: formImport, signal })
    const d4 = await r4.json().catch(() => ({}))

    if (r4.status === 409 && d4?.code === "DUPLICATE_TITLE") {
      const ex = d4?.existingNovel as { id?: string; title?: string } | undefined
      const nid = ex?.id ? String(ex.id) : ""
      const nt = ex?.title ? String(ex.title) : ""
      return {
        fileName: displayPath,
        ok: false,
        skippedDuplicate: true,
        resolvedTitle: title,
        novelId: nid || undefined,
        error: nid
          ? `Đã có trong DB — bỏ qua · «${nt || title}» · novelId: ${nid}`
          : String(d4?.error || "Trùng tiêu đề"),
      }
    }
    if (!r4.ok) {
      const detail = String(d4?.detail || "Bước 4: import thất bại")
      const limitHit =
        r4.status === 400 &&
        (detail.includes("giới hạn") || detail.includes("Quá giới hạn") || detail.includes("chương sau khi tách"))
      return {
        fileName: displayPath,
        ok: false,
        skippedGuard: limitHit,
        resolvedTitle: title,
        error: detail,
      }
    }

    return {
      fileName: displayPath,
      ok: true,
      resolvedTitle: title,
      novelId: String(d4?.novelId || ""),
      chapters: Number(d4?.totalChapters ?? chapterCount),
    }
  }

  const runBatch = async (fileList: FileList | null) => {
    if (!fileList?.length) {
      toast.error("Chọn ít nhất một file EPUB")
      return
    }
    const list = epubFilesOnly(fileList)
    if (!list.length) {
      toast.error("Không thấy file .epub (kiểm tra đuôi hoặc chọn đúng thư mục chứa EPUB)")
      return
    }

    setRows([])
    setRunning(true)
    setProgress({ current: 0, total: list.length })

    const out: BatchRow[] = []
    for (let i = 0; i < list.length; i++) {
      setProgress({ current: i + 1, total: list.length })
      const ac = new AbortController()
      const limitTimer = window.setTimeout(() => ac.abort(), BATCH_IMPORT_MAX_MS_PER_FILE)
      try {
        const row = await processOneFile(list[i], ac.signal)
        out.push(row)
      } catch (e) {
        if (isAbortError(e)) {
          out.push({
            fileName: getFileLabel(list[i]),
            ok: false,
            skippedGuard: true,
            error: `Quá ${Math.round(BATCH_IMPORT_MAX_MS_PER_FILE / 60000)} phút cho một file — đã bỏ qua, chuyển file kế`,
          })
        } else {
          out.push({
            fileName: getFileLabel(list[i]),
            ok: false,
            error: e instanceof Error ? e.message : "Lỗi không xác định",
          })
        }
      } finally {
        window.clearTimeout(limitTimer)
      }
      setRows([...out])
    }

    setRunning(false)
    const okCount = out.filter((r) => r.ok).length
    const dupSkip = out.filter((r) => !r.ok && r.skippedDuplicate).length
    const guardSkip = out.filter((r) => !r.ok && r.skippedGuard).length
    const errCount = out.filter((r) => !r.ok && !r.skippedDuplicate && !r.skippedGuard).length
    toast.success(
      `Hoàn tất ${list.length} file: ${okCount} import OK · ${dupSkip} đã có (bỏ qua) · ${guardSkip} bỏ qua (giới hạn/thời gian) · ${errCount} lỗi`,
      { duration: 8000 },
    )
  }

  const pct = progress.total ? Math.round((progress.current / progress.total) * 100) : 0

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-bold">Import nhiều EPUB (tự động)</h1>
      </div>

      <section className="space-y-3 rounded-xl border p-4">
        <p className="text-sm font-medium">Cấu hình chung</p>
        <div className="flex flex-wrap items-center gap-3 rounded-md border bg-muted/30 p-3">
          <label className="text-sm">Tách chương:</label>
          <select
            className="rounded border px-2 py-1 text-sm"
            value={splitMode}
            onChange={(e) => setSplitMode(e.target.value as "toc" | "regex")}
            disabled={running}
          >
            <option value="toc">TOC</option>
            <option value="regex">Regex tiếng Việt</option>
          </select>
          {splitMode === "regex" && (
            <Input
              className="max-w-xl font-mono text-xs"
              value={chapterStartPattern}
              onChange={(e) => setChapterStartPattern(e.target.value)}
              disabled={running}
              placeholder="Regex bắt đầu chương"
            />
          )}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={replaceExisting} onChange={(e) => setReplaceExisting(e.target.checked)} disabled={running} />
          Ghi đè nếu trùng tiêu đề (tắt = batch chỉ skip khi đã có truyện cùng tiêu đề)
        </label>
        <p className="text-xs text-muted-foreground">
          An toàn batch: tối đa {BATCH_IMPORT_MAX_CHAPTERS.toLocaleString()} chương sau khi tách mỗi file; quá{" "}
          {Math.round(BATCH_IMPORT_MAX_MS_PER_FILE / 60000)} phút/file thì bỏ qua và xử lý file tiếp theo.
        </p>
      </section>

      <section className="space-y-4 rounded-xl border p-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Thư mục cha (quét đệ quy)</p>
          <Input
            type="file"
            {...({ webkitdirectory: "", mozdirectory: "" } as InputHTMLAttributes<HTMLInputElement>)}
            disabled={running}
            className="cursor-pointer"
            onChange={(e) => {
              const fl = e.target.files
              void runBatch(fl)
              e.currentTarget.value = ""
            }}
          />
        </div>
        {running && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang xử lý {progress.current}/{progress.total}…
            </div>
            <Progress value={pct} />
          </div>
        )}
      </section>

      {rows.length > 0 && (
        <section className="rounded-xl border">
          <div className="border-b px-4 py-2 text-sm font-medium">Kết quả</div>
          <div className="flex flex-wrap gap-3 border-b bg-muted/20 px-4 py-2 text-xs text-muted-foreground">
            <span>
              Thành công:{" "}
              <strong className="text-emerald-600">{rows.filter((r) => r.ok).length}</strong>
            </span>
            <span>
              Đã có (skip):{" "}
              <strong className="text-amber-700">{rows.filter((r) => r.skippedDuplicate).length}</strong>
            </span>
            <span>
              Bỏ qua an toàn:{" "}
              <strong className="text-amber-700">{rows.filter((r) => r.skippedGuard).length}</strong>
            </span>
            <span>
              Lỗi:{" "}
              <strong className="text-destructive">
                {rows.filter((r) => !r.ok && !r.skippedDuplicate && !r.skippedGuard).length}
              </strong>
            </span>
            <span>
              Tổng: <strong className="text-foreground">{rows.length}</strong>
            </span>
          </div>
          <div className="max-h-[480px] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-xs text-muted-foreground">
                  <th className="px-3 py-2">File</th>
                  <th className="px-3 py-2">Tiêu đề (preview)</th>
                  <th className="px-3 py-2">Trạng thái</th>
                  <th className="px-3 py-2">Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={`${r.fileName}-${idx}`} className="border-b last:border-0">
                    <td className="max-w-[220px] break-all px-3 py-2 align-top">{r.fileName}</td>
                    <td className="max-w-[200px] break-words px-3 py-2 align-top text-xs">
                      {r.resolvedTitle || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 align-top">
                      {r.ok ? (
                        <span className="text-emerald-600">OK</span>
                      ) : r.skippedDuplicate ? (
                        <span className="text-amber-600">Đã có · skip</span>
                      ) : r.skippedGuard ? (
                        <span className="text-amber-600">Bỏ qua</span>
                      ) : (
                        <span className="text-destructive">Lỗi</span>
                      )}
                    </td>
                    <td className="min-w-[200px] px-3 py-2 align-top text-xs text-muted-foreground">
                      {r.ok && r.novelId ? (
                        <>
                          novelId: {r.novelId}
                          {typeof r.chapters === "number" ? ` · ${r.chapters} chương` : ""}
                        </>
                      ) : (
                        r.error || "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
