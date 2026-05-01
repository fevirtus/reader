"use client"

import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

type Asset = { id: string; path: string; status: string }
type Job = { id: string; sourceAssetId: string; path?: string; status: string; error?: string | null }

export function ImportClient() {
  const [assets, setAssets] = useState<Asset[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([])
  const [lastIndex, setLastIndex] = useState<number | null>(null)
  const [assetQuery, setAssetQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [offset, setOffset] = useState(0)
  const [limit] = useState(50)

  const [selectedJobId, setSelectedJobId] = useState("")
  const [mapNovelId, setMapNovelId] = useState("")
  const [tab, setTab] = useState<"unconverted" | "converted">("unconverted")

  const visibleAssets = useMemo(
    () => tab === "unconverted" ? assets.filter((a) => a.status !== "completed") : assets,
    [assets, tab],
  )

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(assetQuery.trim()), 250)
    return () => clearTimeout(t)
  }, [assetQuery])

  const refresh = async () => {
    setLoading(true)
    try {
      const aUrl = tab === "unconverted"
        ? `/api/mod-import/assets?unconvertedOnly=true&limit=${limit}&offset=${offset}${debouncedQuery ? `&q=${encodeURIComponent(debouncedQuery)}` : ""}`
        : `/api/mod-import/assets?status=completed&limit=${limit}&offset=${offset}${debouncedQuery ? `&q=${encodeURIComponent(debouncedQuery)}` : ""}`
      const [aRes, jRes] = await Promise.all([fetch(aUrl), fetch("/api/mod-import/review-required")])
      const aData = await aRes.json().catch(() => [])
      const jData = await jRes.json().catch(() => [])
      if (!aRes.ok) throw new Error("Không tải được danh sách EPUB")
      if (!jRes.ok) throw new Error("Không tải được mismatch jobs")
      setAssets(Array.isArray(aData) ? aData : [])
      setJobs(Array.isArray(jData) ? jData : [])
    } catch (e: any) {
      toast.error(e?.message || "Lỗi tải dữ liệu")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [debouncedQuery, offset, tab])

  const selectItem = (assetId: string, index: number, shiftKey: boolean) => {
    if (shiftKey && lastIndex !== null) {
      const start = Math.min(lastIndex, index)
      const end = Math.max(lastIndex, index)
      const range = visibleAssets.slice(start, end + 1).map((x) => x.id)
      setSelectedAssetIds((prev) => Array.from(new Set([...prev, ...range])))
      return
    }
    setLastIndex(index)
    setSelectedAssetIds((prev) => (prev.includes(assetId) ? prev.filter((x) => x !== assetId) : [...prev, assetId]))
  }

  const convertSelected = async () => {
    if (selectedAssetIds.length === 0) return toast.error("Chưa chọn EPUB")
    let success = 0
    for (const assetId of selectedAssetIds) {
      const approveRes = await fetch(`/api/mod-import/assets/${assetId}/approve`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      })
      if (!approveRes.ok) continue

      const createRes = await fetch("/api/mod-import/jobs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sourceAssetId: assetId }),
      })
      const createData = await createRes.json().catch(() => ({}))
      if (!createRes.ok) continue

      const runRes = await fetch(`/api/mod-import/jobs/${createData.id}/run`, { method: "POST" })
      if (runRes.ok) success += 1
    }
    toast.success(`Đã convert ${success}/${selectedAssetIds.length} EPUB`)
    setSelectedAssetIds([])
    refresh()
  }

  const autoReview = async () => {
    const res = await fetch("/api/mod-import/assets/auto-review?limit=5000", { method: "POST" })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return toast.error((data as any)?.detail || "Auto-review thất bại")
    toast.success(`Đã phân loại ${data.processed}: approved ${data.approved}, review ${data.reviewRequired}`)
    refresh()
  }

  const mapMismatch = async () => {
    if (!selectedJobId || !mapNovelId) return toast.error("Chọn mismatch job và nhập novelId")
    const res = await fetch(`/api/mod-import/jobs/${selectedJobId}/apply-mapping`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ novelId: mapNovelId, overwrite: true }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return toast.error((data as any)?.detail || "Map thất bại")
    toast.success(`Map xong: ${data.mapped || 0} chương, thiếu ${data.missing || 0}`)
    refresh()
  }

  const markConverted = async (assetId: string) => {
    if (!confirm("Đánh dấu EPUB này đã convert (ẩn khỏi danh sách chưa convert)?")) return
    const res = await fetch(`/api/mod-import/assets/${assetId}/mark-converted`, { method: "POST" })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return toast.error((data as any)?.detail || "Mark converted thất bại")
    toast.success("Đã đánh dấu converted")
    setSelectedAssetIds((prev) => prev.filter((x) => x !== assetId))
    refresh()
  }

  const unmarkConverted = async (assetId: string) => {
    if (!confirm("Bỏ trạng thái converted để convert lại?")) return
    const res = await fetch(`/api/mod-import/assets/${assetId}/unmark-converted`, { method: "POST" })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return toast.error((data as any)?.detail || "Unmark thất bại")
    toast.success("Đã unmark converted")
    refresh()
  }

  const deleteMismatchJob = async (jobId: string) => {
    if (!confirm("Xoá mismatch job này và xoá luôn thư mục content trên NAS?")) return
    const res = await fetch(`/api/mod-import/jobs/${jobId}?removeContent=true`, { method: "DELETE" })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return toast.error((data as any)?.detail || "Xoá job thất bại")
    toast.success(`Đã xoá job ${jobId}`)
    if (selectedJobId === jobId) setSelectedJobId("")
    refresh()
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold">EPUB nguồn (chưa convert)</h3>
            <p className="text-xs text-muted-foreground mt-1">Click để chọn, Shift + click để chọn một khoảng, sau đó bấm Convert.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={autoReview} className="rounded border px-3 py-2 text-sm">Auto Review</button>
            <button onClick={refresh} className="rounded border px-3 py-2 text-sm">{loading ? "Đang tải..." : "Refresh"}</button>
          </div>
        </div>
        <div className="mb-3 flex gap-2">
          <button onClick={() => { setTab("unconverted"); setOffset(0) }} className={`rounded px-3 py-1 text-sm ${tab === "unconverted" ? "bg-primary text-primary-foreground" : "border"}`}>Chưa convert</button>
          <button onClick={() => { setTab("converted"); setOffset(0) }} className={`rounded px-3 py-1 text-sm ${tab === "converted" ? "bg-primary text-primary-foreground" : "border"}`}>Đã convert</button>
        </div>
        <input className="border rounded px-3 py-2 text-sm w-full mb-3" placeholder="Tìm theo tên file/thư mục..." value={assetQuery} onChange={(e) => setAssetQuery(e.target.value)} />
        <div className="space-y-2">
          {visibleAssets.map((a, idx) => (
            <div key={a.id} className={`rounded-xl border p-3 transition ${selectedAssetIds.includes(a.id) ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}>
              <button
                onClick={(e) => selectItem(a.id, idx, e.shiftKey)}
                className="w-full text-left"
              >
                <div className="text-sm font-medium">{a.path}</div>
                <div className="text-xs text-muted-foreground mt-1">status: {a.status}</div>
              </button>
              <div className="mt-2 flex justify-end gap-2">
                {tab === "unconverted" ? <button onClick={() => markConverted(a.id)} className="rounded border px-2 py-1 text-xs">Mark Converted</button> : null}
                {tab === "converted" ? <button onClick={() => unmarkConverted(a.id)} className="rounded border px-2 py-1 text-xs">Unmark</button> : null}
              </div>
            </div>
          ))}
          {visibleAssets.length === 0 && <div className="text-sm text-muted-foreground">Không có EPUB phù hợp</div>}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">Đã chọn {selectedAssetIds.length} file</div>
          <div className="flex items-center gap-2">
            <button className="rounded border px-2 py-1 text-xs disabled:opacity-50" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>Prev</button>
            <button className="rounded border px-2 py-1 text-xs" onClick={() => setOffset(offset + limit)}>Next</button>
            <button disabled={selectedAssetIds.length === 0} onClick={convertSelected} className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">Convert</button>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <h3 className="font-semibold">Mismatch / Review Jobs</h3>
        <p className="text-xs text-muted-foreground mt-1">Danh sách job bị mismatch (sum/path/mapping). Chọn job rồi nhập novelId để map lại, không convert lại EPUB.</p>
        <div className="space-y-2 mt-3">
          {jobs.map((j) => (
            <div key={j.id} className={`w-full rounded-xl border p-3 ${selectedJobId === j.id ? "border-primary bg-primary/5" : "hover:bg-muted/40"}`}>
              <button onClick={() => setSelectedJobId(j.id)} className="w-full text-left">
                <div className="text-xs text-muted-foreground">{j.id}</div>
                <div className="text-sm font-medium">{j.path || j.sourceAssetId}</div>
                <div className="text-xs text-amber-700 mt-1">{j.error || "review_required"}</div>
              </button>
              <div className="mt-2">
                <button onClick={() => deleteMismatchJob(j.id)} className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50">Xoá job + content</button>
              </div>
            </div>
          ))}
          {jobs.length === 0 && <div className="text-sm text-muted-foreground">Không có mismatch job</div>}
        </div>
        <div className="mt-3 flex gap-2">
          <input value={mapNovelId} onChange={(e) => setMapNovelId(e.target.value)} className="border rounded px-3 py-2 text-sm flex-1" placeholder="Novel ID cần map lại" />
          <button disabled={!selectedJobId || !mapNovelId} onClick={mapMismatch} className="rounded border px-3 py-2 text-sm disabled:opacity-50">Map lại</button>
        </div>
      </div>
    </div>
  )
}
