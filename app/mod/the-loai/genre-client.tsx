"use client"

import { useEffect, useMemo, useState } from "react"
import { GitMerge, Loader2, Pencil, Plus, Save, Tag, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Genre {
  id: string
  name: string
  slug: string
  description?: string | null
  icon?: string | null
  novelCount?: number
}

export function GenreClient() {
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [keyword, setKeyword] = useState("")

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formName, setFormName] = useState("")
  const [formDesc, setFormDesc] = useState("")
  const [formIcon, setFormIcon] = useState("")

  // Merge dialog
  const [mergeOpen, setMergeOpen] = useState(false)
  const [mergeSource, setMergeSource] = useState<Genre | null>(null)
  const [mergeTargetId, setMergeTargetId] = useState("")
  const [mergeKeyword, setMergeKeyword] = useState("")

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<Genre | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    if (!q) return genres
    return genres.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.slug.toLowerCase().includes(q)
    )
  }, [keyword, genres])

  const mergeTargetOptions = useMemo(() => {
    const q = mergeKeyword.trim().toLowerCase()
    return genres.filter(
      (g) =>
        g.id !== mergeSource?.id &&
        (!q || g.name.toLowerCase().includes(q) || g.slug.toLowerCase().includes(q))
    )
  }, [genres, mergeSource, mergeKeyword])

  const fetchGenres = async () => {
    try {
      const res = await fetch("/api/mod/the-loai")
      if (!res.ok) throw new Error("Không thể tải danh sách thể loại")
      const data: Genre[] = await res.json()
      // Enrich with novelCount from public endpoint
      const countRes = await fetch("/api/genres")
      if (countRes.ok) {
        const countData: Genre[] = await countRes.json()
        const countMap = Object.fromEntries(countData.map((g) => [g.id, g.novelCount ?? 0]))
        data.forEach((g) => { g.novelCount = countMap[g.id] ?? 0 })
      }
      setGenres(data)
    } catch (err: any) {
      toast.error(err.message || "Lỗi tải thể loại")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchGenres() }, [])

  const resetForm = () => {
    setEditingId(null)
    setFormName("")
    setFormDesc("")
    setFormIcon("")
  }

  const handleEdit = (g: Genre) => {
    setEditingId(g.id)
    setFormName(g.name)
    setFormDesc(g.description || "")
    setFormIcon(g.icon || "")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) { toast.error("Vui lòng nhập tên thể loại"); return }

    setSubmitting(true)
    try {
      const payload: Record<string, any> = {
        name: formName.trim(),
        description: formDesc.trim() || null,
        icon: formIcon.trim() || null,
      }
      if (editingId) payload.id = editingId

      const res = await fetch("/api/mod/the-loai", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Không thể lưu")
      toast.success(editingId ? "Đã cập nhật thể loại" : "Đã tạo thể loại")
      resetForm()
      fetchGenres()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = (g: Genre) => {
    setDeleteTarget(g)
    setDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/mod/the-loai?id=${deleteTarget.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Không thể xóa")
      toast.success(`Đã xóa thể loại "${deleteTarget.name}"`)
      if (editingId === deleteTarget.id) resetForm()
      setDeleteOpen(false)
      fetchGenres()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const openMerge = (g: Genre) => {
    setMergeSource(g)
    setMergeTargetId("")
    setMergeKeyword("")
    setMergeOpen(true)
  }

  const handleMerge = async () => {
    if (!mergeSource || !mergeTargetId) { toast.error("Vui lòng chọn thể loại đích"); return }
    setSubmitting(true)
    try {
      const res = await fetch("/api/mod/the-loai/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId: mergeSource.id, targetId: mergeTargetId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || "Không thể gộp")
      const target = genres.find((g) => g.id === mergeTargetId)
      toast.success(`Đã gộp "${mergeSource.name}" vào "${target?.name}"`)
      setMergeOpen(false)
      if (editingId === mergeSource.id) resetForm()
      fetchGenres()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Tag className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Quản lý Thể Loại</h1>
      </div>

      {/* Form tạo / chỉnh sửa */}
      <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-5 space-y-4">
        <h2 className="font-semibold text-base">{editingId ? "Chỉnh sửa thể loại" : "Tạo thể loại mới"}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium">Tên thể loại <span className="text-destructive">*</span></label>
            <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ví dụ: Kiếm Hiệp" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Icon (tên Lucide)</label>
            <Input value={formIcon} onChange={(e) => setFormIcon(e.target.value)} placeholder="Ví dụ: Sword, Flame, Heart..." />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Mô tả</label>
          <Textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Mô tả ngắn về thể loại..." rows={2} />
        </div>
        <div className="flex gap-2">
          <Button type="submit" disabled={submitting} size="sm">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            <span className="ml-1">{editingId ? "Lưu thay đổi" : "Tạo thể loại"}</span>
          </Button>
          {editingId && (
            <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
              <X className="h-4 w-4" /><span className="ml-1">Hủy</span>
            </Button>
          )}
        </div>
      </form>

      {/* Danh sách */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center gap-3 border-b px-5 py-3">
          <Input
            placeholder="Tìm theo tên, slug..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="max-w-xs h-8 text-sm"
          />
          <span className="ml-auto text-sm text-muted-foreground whitespace-nowrap">{filtered.length} / {genres.length} thể loại</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Không tìm thấy thể loại nào</div>
        ) : (
          <div className="divide-y">
            {filtered.map((g) => (
              <div key={g.id} className={`flex items-center gap-3 px-5 py-3 hover:bg-muted/40 transition-colors ${editingId === g.id ? "bg-primary/5" : ""}`}>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{g.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{g.slug}{g.description ? ` · ${g.description}` : ""}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                  {g.novelCount ?? 0} truyện
                </span>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Chỉnh sửa" onClick={() => handleEdit(g)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Gộp thể loại" onClick={() => openMerge(g)}>
                    <GitMerge className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="Xóa" onClick={() => confirmDelete(g)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog xóa */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa thể loại</DialogTitle>
            <DialogDescription>
              Thể loại <strong>"{deleteTarget?.name}"</strong> sẽ bị xóa vĩnh viễn
              {(deleteTarget?.novelCount ?? 0) > 0 && (
                <> và bị gỡ khỏi <strong>{deleteTarget?.novelCount} truyện</strong></>
              )}. Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteOpen(false)}>Hủy</Button>
            <Button variant="destructive" disabled={submitting} onClick={handleDelete}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog gộp */}
      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gộp thể loại</DialogTitle>
            <DialogDescription>
              Tất cả truyện của <strong>"{mergeSource?.name}"</strong> sẽ được chuyển sang thể loại đích,
              sau đó <strong>"{mergeSource?.name}"</strong> sẽ bị xóa.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 my-2">
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Nguồn (sẽ bị xóa): </span>
              <strong>{mergeSource?.name}</strong>
              {(mergeSource?.novelCount ?? 0) > 0 && <span className="text-muted-foreground"> · {mergeSource?.novelCount} truyện</span>}
            </div>

            <Input
              placeholder="Tìm thể loại đích..."
              value={mergeKeyword}
              onChange={(e) => setMergeKeyword(e.target.value)}
              className="h-8 text-sm"
            />

            <div className="max-h-52 overflow-y-auto rounded-md border divide-y">
              {mergeTargetOptions.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">Không có thể loại nào</p>
              ) : (
                mergeTargetOptions.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setMergeTargetId(g.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors ${mergeTargetId === g.id ? "bg-primary/10 font-medium" : ""}`}
                  >
                    <span className="flex-1">{g.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{g.novelCount ?? 0} truyện</span>
                  </button>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setMergeOpen(false)}>Hủy</Button>
            <Button disabled={!mergeTargetId || submitting} onClick={handleMerge}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <GitMerge className="h-4 w-4 mr-1" />}
              Gộp thể loại
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
