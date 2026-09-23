"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Headphones, HardDrive, RefreshCw, Loader2 } from "lucide-react"

type Edition = { id: string; novelId: string; title: string; voiceId: string; total: number; ready: number; current: number; queued: number; rendering: number; failed: number; audioBytes: number; exportBytes: number; cleanup: { files: number; bytes: number }; active: { number: number; attempts: number; elapsedSeconds: number }[]; errors: { number: number; attempts: number; error: string; retryAt: string }[] }
type Overview = { items: Edition[]; total: number; pageSize: number; storage: { audioBytes: number; exportBytes: number; cleanupBytes: number }; queue: { workerLockHeld: boolean; eligible: number; backoff: number; exhausted: number } }
const bytes = (n: number) => `${(n / 1024 / 1024).toLocaleString("vi-VN", { maximumFractionDigits: 1 })} MB`
async function api(path = "", body?: object) {
  const r = await fetch(`/api/audiobooks/admin${path}`, { cache: "no-store", method: body ? "POST" : "GET", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined })
  const data = await r.json()
  if (!r.ok) throw new Error(typeof data.detail === "string" ? data.detail : "Không thể tải quản lý Audio book")
  return data
}
export default function AudioBookAdmin() {
  const [data, setData] = useState<Overview | null>(null)
  const [q, setQ] = useState("")
  const [page, setPage] = useState(1)
  const [busy, setBusy] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [voices, setVoices] = useState<Record<string, string>>({})
  const refresh = useCallback(async () => { try { setData(await api(`?page=${page}&q=${encodeURIComponent(q)}`)); setError("") } catch (e) { setError((e as Error).message) } }, [q, page])
  useEffect(() => { const delay = setTimeout(() => void refresh(), 250); const timer = setInterval(() => { if (!document.hidden) void refresh() }, 15000); return () => { clearTimeout(delay); clearInterval(timer) } }, [refresh])
  useEffect(() => { void fetch("/api/audiobooks/voices").then(r => r.json()).then(d => setVoices(Object.fromEntries(d.voices.map((v: { id: string; name: string }) => [v.id, v.name])))).catch(() => {}) }, [])
  async function action(e: Edition, type: "render" | "cleanup") {
    if (type === "cleanup" && !window.confirm(`Dọn ${e.cleanup.files} bản chương cũ (${bytes(e.cleanup.bytes)})? Giữ bản hiện hành, bản đang nghe và toàn bộ nội dung truyện.`)) return
    setBusy(e.id); setNotice("")
    try { const result = await api(`/editions/${e.id}/${type}`, {}); setNotice(type === "render" ? `Đã thêm ${result.added} chương và xếp lại ${result.retried} chương lỗi.` : `Đã xếp ${result.files} tệp vào hàng đợi dọn dẹp. Dung lượng được thu hồi khi worker xử lý.`); await refresh() } catch (e) { setError((e as Error).message) } finally { setBusy("") }
  }
  return <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
    <div className="flex items-center justify-between gap-3"><div><h1 className="flex items-center gap-3 text-2xl font-bold"><Headphones />Quản lý Audio book</h1><p className="mt-2 text-sm text-muted-foreground">Bản giọng, hàng đợi render và dung lượng audio. Tự cập nhật mỗi 15 giây.</p></div><Button variant="outline" size="icon" aria-label="Làm mới" onClick={() => void refresh()}><RefreshCw className="h-4 w-4" /></Button></div>
    {error && <p role="alert" className="rounded-xl border border-destructive p-4 text-destructive">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-primary/10 p-4">{notice}</p>}
    {data && <><div className="grid gap-3 sm:grid-cols-3">{[["Audio từng chương", bytes(data.storage.audioBytes)], ["Bản xuất cả truyện", bytes(data.storage.exportBytes)], ["Đang chờ thu hồi", bytes(data.storage.cleanupBytes)]].map(([label, value]) => <div key={label} className="rounded-2xl border bg-card p-5"><HardDrive className="mb-3 h-5 w-5 text-muted-foreground" /><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>)}</div>
    <p className="text-xs text-muted-foreground">Dung lượng tệp audio do hệ thống quản lý, không phải tổng dung lượng ổ đĩa. Giữ bản xuất cả truyện để sử dụng sau này.</p>
    <div className="rounded-xl bg-muted/50 p-4 text-sm">{data.queue.workerLockHeld ? "Worker đang giữ quyền xử lý" : "Chưa có worker giữ quyền xử lý"} · {data.queue.eligible} chương chờ chạy · {data.queue.backoff} đang chờ thử lại · {data.queue.exhausted} cần xử lý lỗi</div></>}
    <input className="w-full rounded-xl border bg-background p-3" aria-label="Tìm truyện" placeholder="Tìm truyện có yêu cầu Audio book…" value={q} onChange={e => { setQ(e.target.value); setPage(1) }} />
    {!data && !error && <p>Đang tải…</p>}
    {data?.items.map(e => <article key={e.id} className="rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><Link href={`/audio-book/${e.novelId}`} className="font-semibold hover:underline">{e.title}</Link><p className="mt-1 text-sm text-muted-foreground">{voices[e.voiceId] || e.voiceId}</p></div><p className="text-sm font-medium">{e.ready}/{e.total} chương nghe được</p></div>
      <progress className="my-4 h-2 w-full accent-primary" value={e.ready} max={Math.max(1, e.total)} aria-label="Chương đã render" />
      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm"><span>{Math.max(0, e.total - e.ready)} chưa có audio</span><span>{e.current} bản mới nhất</span><span>{e.queued} chờ · {e.rendering} đang chạy · {e.failed} lỗi</span><span>{bytes(e.audioBytes)} audio · {bytes(e.exportBytes)} bản xuất</span></div>
      {e.active.map(a => <p key={a.number} className="mt-3 flex items-center gap-2 text-sm text-primary"><Loader2 className="h-4 w-4 animate-spin" />Đang render chương {a.number} · {Math.floor(a.elapsedSeconds / 60)} phút · lần {a.attempts}</p>)}
      {!!e.errors.length && <details className="mt-3 text-sm"><summary className="cursor-pointer text-destructive">Lỗi gần nhất ({e.failed} chương)</summary>{e.errors.map(a => <p key={a.number} className="mt-2 break-words rounded bg-muted p-3">Chương {a.number}, lần {a.attempts}: {a.error || "Không có chi tiết"}</p>)}</details>}
      <div className="mt-5 flex flex-wrap gap-2"><Button disabled={!!busy} onClick={() => void action(e, "render")}>{busy === e.id ? "Đang xử lý…" : "Render thêm / thử lại lỗi"}</Button><Button variant="outline" disabled={!!busy || !e.cleanup.files} onClick={() => void action(e, "cleanup")}>Dọn bản cũ · {bytes(e.cleanup.bytes)}</Button></div>
      <p className="mt-3 text-xs text-muted-foreground">Chỉ dọn audio cũ hơn 7 ngày, đã có bản thay thế mới nhất và không có tiến độ nghe đang tham chiếu.</p>
    </article>)}
    {data && !data.items.length && <p className="py-8 text-center text-muted-foreground">Không có Audio book phù hợp.</p>}
    {data && <div className="flex items-center justify-between"><Button variant="outline" disabled={page === 1} onClick={() => setPage(p => p-1)}>Trước</Button><span className="text-sm">Trang {page} · {data.total} bản giọng</span><Button variant="outline" disabled={page * data.pageSize >= data.total} onClick={() => setPage(p => p+1)}>Sau</Button></div>}
  </div>
}
