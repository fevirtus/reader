"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

export type AudioBookVoice = {
  id: string; name: string; default: boolean; gender?: string; region?: string; previewUrl?: string | null
}

export function AudioBookVoicePicker({ voices, selected, onSelect, onPreviewStart, stopToken }: {
  voices: AudioBookVoice[]; selected: string; onSelect: (id: string) => void;
  onPreviewStart: () => void; stopToken: number
}) {
  const [query, setQuery] = useState("")
  const [preview, setPreview] = useState<AudioBookVoice | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const audio = useRef<HTMLAudioElement>(null)
  const generation = useRef(0)
  const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g,"d")
  const visible = voices.filter(v => normalize(`${v.name} ${v.gender || ""} ${v.region || ""}`).includes(normalize(query)))
  useEffect(() => { generation.current++; audio.current?.pause(); setPreview(null); setBusy(false) }, [stopToken])
  useEffect(() => {
    const element = audio.current
    return () => { generation.current++; element?.pause() }
  }, [])
  const listen = async (voice: AudioBookVoice) => {
    const request = ++generation.current
    if (preview?.id === voice.id) { audio.current?.pause(); setPreview(null); setBusy(false); return }
    if (!voice.previewUrl || !audio.current) return
    onPreviewStart(); onSelect(voice.id)
    audio.current.pause()
    setPreview(voice); setBusy(true); setError("")
    audio.current.src = voice.previewUrl
    try { await audio.current.play() }
    catch { if (generation.current === request) { setError("Không nghe được đoạn mẫu. Vui lòng thử lại."); setPreview(null) } }
    finally { if (generation.current === request) setBusy(false) }
  }
  return <fieldset className="w-full min-w-0">
    <legend className="text-base font-semibold">Chọn giọng đọc <span className="font-normal text-muted-foreground">· {voices.length} giọng</span></legend>
    <p className="mt-1 text-sm text-muted-foreground">Nghe cùng một đoạn mẫu để chọn giọng bạn thích. Nghe thử không tạo yêu cầu render truyện.</p>
    <input aria-label="Tìm giọng đọc" placeholder="Tìm tên giọng, nam/nữ, Bắc/Trung/Nam…" value={query} onChange={e=>setQuery(e.target.value)} className="my-3 w-full rounded-lg border bg-background px-3 py-2.5 text-sm" />
    <div className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2" role="radiogroup" aria-label="Giọng muốn nghe">
      {visible.map(v=><div key={v.id} className={`flex items-center gap-2 rounded-lg border p-3 ${selected===v.id ? "border-primary bg-primary/5" : "bg-background"}`}>
        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
          <input type="radio" name="audiobook-voice" value={v.id} checked={selected===v.id} onChange={()=>onSelect(v.id)} className="accent-primary" />
          <span className="min-w-0"><span className="block text-sm font-medium">{v.name}{v.default ? " · Mặc định" : ""}</span><span className="text-xs text-muted-foreground">{v.gender} · Miền {v.region}</span></span>
        </label>
        <Button type="button" size="sm" variant="outline" disabled={!v.previewUrl} aria-label={`${preview?.id===v.id ? "Dừng nghe thử" : "Nghe thử"} ${v.name}`} onClick={()=>void listen(v)}>{!v.previewUrl ? "Đang chuẩn bị" : preview?.id===v.id ? busy ? "Đang tải…" : "Dừng" : "Nghe thử"}</Button>
      </div>)}
      {!visible.length && <p className="p-3 text-sm text-muted-foreground">Không tìm thấy giọng phù hợp.</p>}
    </div>
    <audio ref={audio} preload="none" onError={() => { if (audio.current?.error) { setError("Không nghe được đoạn mẫu. Vui lòng thử lại."); setPreview(null); setBusy(false) } }} onEnded={()=>{setPreview(null); setBusy(false)}} />
    <p aria-live="polite" className="mt-2 text-sm text-muted-foreground">{error || (preview ? `Đang nghe thử: ${preview.name}` : `Đã chọn: ${voices.find(v=>v.id===selected)?.name || "…"}`)}</p>
  </fieldset>
}
