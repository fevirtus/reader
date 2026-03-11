"use client"

import { useEffect, useMemo, useState } from "react"
import { Layers, Loader2, Pencil, Plus, Save, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

interface SeriesItem {
  id: string
  name: string
  slug: string
  description?: string | null
  _count?: {
    novels: number
  }
}

export function SeriesClient() {
  const [series, setSeries] = useState<SeriesItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [keyword, setKeyword] = useState("")

  const filteredSeries = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    if (!q) return series
    return series.filter((item) => {
      return (
        item.name.toLowerCase().includes(q) ||
        item.slug.toLowerCase().includes(q) ||
        (item.description || "").toLowerCase().includes(q)
      )
    })
  }, [keyword, series])

  const fetchSeries = async () => {
    try {
      const res = await fetch("/api/mod/series")
      if (!res.ok) throw new Error("Không thể tải danh sách series")
      const data = await res.json()
      setSeries(data)
    } catch (error: any) {
      toast.error(error.message || "Không thể tải danh sách series")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSeries()
  }, [])

  const resetForm = () => {
    setEditingId(null)
    setName("")
    setDescription("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("Vui lòng nhập tên series")
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        id: editingId,
        name: name.trim(),
        description: description.trim(),
      }

      const res = await fetch("/api/mod/series", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Không thể lưu series")
      }

      toast.success(editingId ? "Đã cập nhật series" : "Đã tạo series")
      resetForm()
      fetchSeries()
    } catch (error: any) {
      toast.error(error.message || "Không thể lưu series")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (item: SeriesItem) => {
    setEditingId(item.id)
    setName(item.name)
    setDescription(item.description || "")
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn chắc chắn muốn xóa series này?")) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/mod/series?id=${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Không thể xóa series")
      }

      toast.success("Đã xóa series")
      if (editingId === id) resetForm()
      fetchSeries()
    } catch (error: any) {
      toast.error(error.message || "Không thể xóa series")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border shadow-sm p-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Layers className="h-6 w-6 text-primary" /> Quản lý series
        </h1>
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm series..."
          className="max-w-xs"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-1 rounded-xl border bg-card p-4 shadow-sm">
          <h2 className="text-base font-semibold mb-3">{editingId ? "Chỉnh sửa series" : "Tạo series mới"}</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tên series</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ví dụ: Overlord" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Mô tả</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả ngắn về series"
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting} className="gap-2">
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingId ? "Lưu" : "Tạo"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm} className="gap-2">
                  <X className="h-4 w-4" /> Hủy
                </Button>
              )}
            </div>
          </form>
        </div>

        <div className="xl:col-span-2 rounded-xl border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-4 py-3 font-semibold">Tên</th>
                  <th className="px-4 py-3 font-semibold">Slug</th>
                  <th className="px-4 py-3 font-semibold">Số truyện</th>
                  <th className="px-4 py-3 font-semibold">Mô tả</th>
                  <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : filteredSeries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      Chưa có series nào
                    </td>
                  </tr>
                ) : (
                  filteredSeries.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{item.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{item.slug}</td>
                      <td className="px-4 py-3">{item._count?.novels ?? 0}</td>
                      <td className="px-4 py-3 text-muted-foreground max-w-sm truncate">{item.description || "-"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleEdit(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
