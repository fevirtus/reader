"use client"

import { use, useCallback, useEffect, useRef, useState } from "react"
import { Headphones, RefreshCw, Loader2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AudioBookVoicePicker, type AudioBookVoice } from "@/components/audio-book-voice-picker"
import { useAuth } from "@/lib/auth-context"

type Chapter = { id: string; number: number; title: string; assetId: string | null; url: string | null; duration: number; status: string; hasUpdate: boolean }
type Edition = { id: string; novelId: string; title: string; voiceId: string; revision: string; readyCount: number; chapters: Chapter[]; export: { url: string; chapterCount: number; hasUpdate: boolean } | null }
type Voice = AudioBookVoice
type Progress = { userId?: string; editionId: string; assetId: string; position: number; eventId: string; occurredAt: string }

async function api(path: string, body?: unknown) {
  const response = await fetch(`/api/audiobooks/${path}`, { method: body ? "POST" : "GET", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined, cache: "no-store" })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(response.status === 401 ? "Đăng nhập để yêu cầu Audio book" : error.detail || "Không thể kết nối. Vui lòng thử lại.")
  }
  return response.json()
}

export default function AudioBookPage({ params }: { params: Promise<{ novelId: string }> }) {
  const { novelId } = use(params)
  const { user } = useAuth()
  const [novelTitle, setNovelTitle] = useState("")
  const [editions, setEditions] = useState<Edition[]>([])
  const [voices, setVoices] = useState<Voice[]>([])
  const [editionId, setEditionId] = useState("")
  const [voice, setVoice] = useState("anh-khoi")
  const [previewStopToken, setPreviewStopToken] = useState(0)
  const [active, setActive] = useState<{ edition: Edition; chapter: Chapter; position: number } | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState(false)
  const [speed, setSpeed] = useState(1)
  const audio = useRef<HTMLAudioElement>(null)
  const lastSave = useRef(0)
  const wantsPlayback = useRef(false)
  const streamFailed = useRef(false)
  const resumeAt = useRef(0)
  const [loadAttempt, setLoadAttempt] = useState(0)
  useEffect(() => {
    const reconnect = () => {
      if (!wantsPlayback.current || !streamFailed.current || !navigator.onLine) return
      setActive(current => current ? { ...current, position: resumeAt.current } : null)
      setLoadAttempt(value => value + 1)
    }
    const timer = setInterval(reconnect, 10000)
    window.addEventListener("online", reconnect)
    return () => { clearInterval(timer); window.removeEventListener("online", reconnect) }
  }, [])
  useEffect(() => {
    wantsPlayback.current = false
    streamFailed.current = false
    setActive(null)
  }, [user?.id, novelId])
  const accountKey = `audiobook:${user?.id || "guest"}:${novelId}`
  const selected = editions.find(e => e.id === editionId) || editions[0]
  const refresh = useCallback(async () => {
    try {
      const [data, catalog] = await Promise.all([api(`novels/${encodeURIComponent(novelId)}`), api("voices")])
      setNovelTitle(data.title || ""); setEditions(data.editions); setVoices(catalog.voices); setError("")
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }, [novelId])
  useEffect(() => { void refresh(); const timer = setInterval(() => { if (!document.hidden) void refresh() }, 30000); return () => clearInterval(timer) }, [refresh])
  useEffect(() => {
    if (!user) return
    let alive = true
    const reconcile = async () => {
      try {
        const pending = localStorage.getItem(accountKey + ":pending")
        if (pending) {
          const p = JSON.parse(pending)
          const ack = await api(`progress/${novelId}`, p)
          if (ack.acknowledgedEventId === p.eventId && localStorage.getItem(accountKey + ":pending") === pending) localStorage.removeItem(accountKey + ":pending")
        }
        const data = await api(`progress/${novelId}`)
        const local = JSON.parse(localStorage.getItem(accountKey) || "null")
        if (alive && data.progress && (!local || data.progress.occurredAt > local.occurredAt)) localStorage.setItem(accountKey, JSON.stringify(data.progress))
      } catch { /* Keep offline progress until acknowledged. */ }
    }
    void reconcile(); window.addEventListener("online", reconcile)
    return () => { alive = false; window.removeEventListener("online", reconcile) }
  }, [accountKey, novelId, user])
  const save = async () => {
    if (!active || !audio.current || streamFailed.current || audio.current.readyState === 0) return
    const p: Progress = { userId: user?.id, editionId: active.edition.id, assetId: active.chapter.assetId!, position: audio.current.currentTime, occurredAt: new Date().toISOString(), eventId: crypto.randomUUID() }
    try {
      localStorage.setItem(accountKey, JSON.stringify(p))
      if (!user) return
      localStorage.setItem(accountKey + ":pending", JSON.stringify(p))
      const ack = await api(`progress/${novelId}`, p)
      const current = JSON.parse(localStorage.getItem(accountKey + ":pending") || "null")
      if (ack.acknowledgedEventId === current?.eventId) localStorage.removeItem(accountKey + ":pending")
    } catch { /* Local progress remains durable. */ }
  }
  const play = (edition: Edition, chapter: Chapter) => {
    if (!chapter.url) { setError("Chương này chưa có audio. Hệ thống sẽ tạo theo hàng đợi."); return }
    void save()
    let position = 0
    try { const p = JSON.parse(localStorage.getItem(accountKey) || "null"); if (p?.assetId === chapter.assetId) position = p.position } catch {}
    resumeAt.current = position; wantsPlayback.current = true; streamFailed.current = false
    setLoadAttempt(value => value + 1)
    setActive({ edition, chapter, position }); setError("")
  }
  const next = () => {
    if (!active) return
    const edition = editions.find(e => e.id === active.edition.id) || active.edition
    const index = edition.chapters.findIndex(c => c.id === active.chapter.id)
    const chapter = edition.chapters[index + 1]
    if (chapter) play(edition, chapter)
  }
  return <main className="mx-auto max-w-4xl px-4 py-8 pb-40">
    <Button variant="ghost" onClick={() => history.back()}><ArrowLeft className="mr-2 h-4 w-4" />Quay lại</Button>
    <div className="mt-6 flex items-start justify-between gap-4">
      <div><p className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><Headphones className="h-4 w-4" />Audio book</p><h1 className="mt-2 text-2xl font-bold">{selected?.title || novelTitle || "Audio book"}</h1><p className="mt-2 text-muted-foreground">Nghe trực tuyến từng chương với giọng bạn chọn. Cần kết nối mạng để phát Audio book.</p></div>
      <Button variant="outline" size="icon" aria-label="Làm mới" onClick={() => void refresh()}><RefreshCw className="h-4 w-4" /></Button>
    </div>
    {error && <p role="alert" className="my-4 rounded-lg border border-destructive p-3 text-sm">{error}</p>}
    <section className="my-6 flex flex-wrap items-end gap-3 rounded-xl border bg-muted/30 p-4">
      <AudioBookVoicePicker voices={voices} selected={voice} onSelect={setVoice} stopToken={previewStopToken} onPreviewStart={() => { wantsPlayback.current = false; streamFailed.current = false; audio.current?.pause() }} />
      <Button disabled={requesting || !voices.length} onClick={async () => { setRequesting(true); try { const edition = await api(`novels/${novelId}/requests`, { voiceId: voice }); setEditionId(edition.id); await refresh() } catch(e) { setError((e as Error).message) } finally { setRequesting(false) } }}>{requesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Yêu cầu tạo Audio book</Button>
      <p className="w-full text-xs text-muted-foreground">Yêu cầu trùng sẽ được gộp. Chương hoàn tất có thể nghe ngay, không cần chờ cả truyện.</p>
    </section>
    {loading ? <p>Đang tải các bản giọng…</p> : !editions.length ? <p className="py-10 text-center text-muted-foreground">Truyện chưa có Audio book. Chọn giọng phía trên để yêu cầu tạo.</p> : <>
      <nav aria-label="Các bản giọng" className="mb-5 flex flex-wrap gap-2">{editions.map(e => <Button key={e.id} variant={selected?.id === e.id ? "default" : "outline"} onClick={() => setEditionId(e.id)}>{voices.find(v => v.id === e.voiceId)?.name || e.voiceId} · {e.readyCount}/{e.chapters.length}</Button>)}</nav>
      <ol className="divide-y rounded-xl border">{selected?.chapters.map(c => <li key={c.id}><button className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-muted/50 disabled:cursor-default" disabled={!c.url} onClick={() => play(selected, c)}><span><span className="text-xs text-muted-foreground">Chương {c.number}</span><span className="block font-medium">{c.title || `Chương ${c.number}`}</span></span><span className="shrink-0 text-xs text-muted-foreground">{c.hasUpdate ? "Đang tạo bản cập nhật" : c.url ? "Nghe" : c.status === "rendering" ? "Đang tạo" : c.status === "failed" ? "Tạo thất bại" : "Đang chờ"}</span></button></li>)}</ol>
    </>}
    {active && <section className="fixed inset-x-0 bottom-0 z-40 border-t bg-background p-4"><div className="mx-auto max-w-4xl"><p className="mb-2 truncate text-sm font-medium">Chương {active.chapter.number} · {active.chapter.title}</p><div className="flex items-center gap-3"><audio key={`${active.chapter.assetId}:${loadAttempt}`} ref={audio} controls controlsList="nodownload" autoPlay preload="metadata" className="min-w-0 flex-1" src={active.chapter.url!} onLoadedMetadata={() => { if (audio.current) { audio.current.currentTime = active.position; audio.current.playbackRate = speed } }} onPlay={() => { wantsPlayback.current = true; setPreviewStopToken(value => value + 1) }} onCanPlay={() => { streamFailed.current = false; setError("") }} onPause={() => { if (!audio.current?.error && !streamFailed.current) wantsPlayback.current = false; void save() }} onTimeUpdate={() => { if (!streamFailed.current && audio.current) resumeAt.current = audio.current.currentTime; if (Date.now() - lastSave.current > 5000) { lastSave.current = Date.now(); void save() } }} onEnded={next} onError={() => { streamFailed.current = true; setError("Kết nối bị gián đoạn. Sẽ tự phát tiếp khi kết nối trở lại.") }} />{streamFailed.current && <Button variant="outline" onClick={() => { wantsPlayback.current = !wantsPlayback.current; if (!wantsPlayback.current) { streamFailed.current = false; setError("Đã tạm dừng. Chọn chương để nghe tiếp.") } }}>Dừng thử lại</Button>}<select aria-label="Tốc độ nghe" className="rounded border bg-background p-2" value={speed} onChange={e => { const n = Number(e.target.value); setSpeed(n); if(audio.current) audio.current.playbackRate = n }}>{[0.75,1,1.25,1.5,2].map(n => <option key={n} value={n}>{n}×</option>)}</select></div></div></section>}
  </main>
}
