"use client"

import Link from "next/link"
import { FormEvent, useEffect, useMemo, useState } from "react"
import { Loader2, Search, Star, Trash2, UserRoundCheck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type NovelLite = {
  id: string
  title: string
  slug: string
  authorName: string
  coverUrl: string | null
  status: string
  totalChapters: number
}

type RecommendationItem = {
  id: string
  createdAt: string | null
  recommendCount: number
  novel: NovelLite
  editor: {
    id: string
    name: string
  }
}

type SummaryItem = {
  novel: NovelLite
  recommendCount: number
}

type CandidateNovel = NovelLite & {
  alreadyRecommended: boolean
  recommendCount: number
}

type RecommendationResponse = {
  items: RecommendationItem[]
  summary: SummaryItem[]
  candidates: CandidateNovel[]
  myNovelIds: string[]
  currentUser: {
    id: string
    role: string
    recommendationCount: number
    maxRecommendationCount: number
  }
}

function formatRelativeTime(value: string | null): string {
  if (!value) return "Vừa đề cử"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Vừa đề cử"

  const diff = Date.now() - date.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return "Vừa xong"
  if (diff < hour) return `${Math.floor(diff / minute)} phút trước`
  if (diff < day) return `${Math.floor(diff / hour)} giờ trước`
  if (diff < day * 30) return `${Math.floor(diff / day)} ngày trước`

  return date.toLocaleDateString("vi-VN")
}

export function RecommendationClient() {
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [submittingNovelId, setSubmittingNovelId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [keyword, setKeyword] = useState("")
  const [activeQuery, setActiveQuery] = useState("")

  const [items, setItems] = useState<RecommendationItem[]>([])
  const [summary, setSummary] = useState<SummaryItem[]>([])
  const [candidates, setCandidates] = useState<CandidateNovel[]>([])
  const [currentUser, setCurrentUser] = useState<{
    id: string
    role: string
    recommendationCount: number
    maxRecommendationCount: number
  } | null>(null)

  const fetchData = async (query: string, initial = false) => {
    if (initial) {
      setLoading(true)
    } else {
      setSearching(true)
    }

    try {
      const url = query.trim() ? `/api/mod/de-cu?q=${encodeURIComponent(query.trim())}` : "/api/mod/de-cu"
      const res = await fetch(url)
      const data = (await res.json()) as RecommendationResponse & { error?: string }

      if (!res.ok) {
        throw new Error(data.error || "Không thể tải dữ liệu đề cử")
      }

      setItems(data.items || [])
      setSummary(data.summary || [])
      setCandidates(data.candidates || [])
      setCurrentUser(data.currentUser || null)
      setActiveQuery(query.trim())
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể tải dữ liệu đề cử"
      toast.error(message)
    } finally {
      setLoading(false)
      setSearching(false)
    }
  }

  useEffect(() => {
    fetchData("", true)
  }, [])

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault()
    await fetchData(keyword)
  }

  const handleRecommend = async (novelId: string) => {
    setSubmittingNovelId(novelId)
    try {
      const res = await fetch("/api/mod/de-cu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ novelId }),
      })

      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        throw new Error(data.error || "Không thể thêm đề cử")
      }

      toast.success("Đã thêm đề cử")
      await fetchData(activeQuery)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể thêm đề cử"
      toast.error(message)
    } finally {
      setSubmittingNovelId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa đề cử này?")) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/mod/de-cu?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      const data = (await res.json()) as { error?: string }

      if (!res.ok) {
        throw new Error(data.error || "Không thể xóa đề cử")
      }

      toast.success("Đã xóa đề cử")
      await fetchData(activeQuery)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Không thể xóa đề cử"
      toast.error(message)
    } finally {
      setDeletingId(null)
    }
  }

  const canDelete = (item: RecommendationItem) => {
    if (!currentUser) return false
    return currentUser.role === "ADMIN" || currentUser.id === item.editor.id
  }

  const rankedSummary = useMemo(() => summary.slice(0, 12), [summary])
  const hasReachedLimit =
    Boolean(currentUser) &&
    (currentUser?.recommendationCount || 0) >= (currentUser?.maxRecommendationCount || 0)

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <UserRoundCheck className="h-6 w-6 text-primary" /> Quản lý đề cử biên tập
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Mỗi biên tập viên có thể đề cử truyện thủ công. Trang chủ sẽ lấy dữ liệu từ danh sách này.
        </p>
        {currentUser && (
          <p className="mt-2 text-xs text-primary">
            Bạn đang dùng {currentUser.recommendationCount}/{currentUser.maxRecommendationCount} đề cử.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-1">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h2 className="mb-3 text-base font-semibold">Tìm truyện để đề cử</h2>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Nhập tên truyện, tác giả hoặc slug"
              />
              <Button type="submit" variant="outline" className="gap-2" disabled={searching}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                Tìm
              </Button>
            </form>

            <div className="mt-3 space-y-2">
              {searching ? (
                <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Đang tìm...
                </div>
              ) : candidates.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nhập từ khóa rồi bấm tìm để hiện danh sách truyện.</p>
              ) : (
                candidates.map((novel) => (
                  <div key={novel.id} className="rounded-lg border border-border bg-background/60 p-2.5">
                    <div className="flex items-start gap-2">
                      <img
                        src={novel.coverUrl || "/default-cover.svg"}
                        alt={novel.title}
                        className="h-14 w-10 rounded border border-border/70 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <Link href={`/truyen/${novel.slug}`} className="line-clamp-1 text-sm font-semibold hover:text-primary">
                          {novel.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">{novel.authorName}</p>
                        <p className="text-xs text-muted-foreground">{novel.recommendCount} đề cử</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      className="mt-2 w-full gap-2"
                      disabled={
                        novel.alreadyRecommended ||
                        submittingNovelId === novel.id ||
                        (hasReachedLimit && !novel.alreadyRecommended)
                      }
                      onClick={() => handleRecommend(novel.id)}
                    >
                      {submittingNovelId === novel.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                      {novel.alreadyRecommended
                        ? "Bạn đã đề cử"
                        : hasReachedLimit
                        ? "Đã đạt giới hạn 5 truyện"
                        : "Đề cử truyện này"}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h2 className="mb-3 text-base font-semibold">Top theo số lượng đề cử</h2>
            <div className="space-y-2">
              {rankedSummary.length === 0 ? (
                <p className="text-sm text-muted-foreground">Chưa có dữ liệu đề cử.</p>
              ) : (
                rankedSummary.map((item, index) => (
                  <Link
                    key={item.novel.id}
                    href={`/truyen/${item.novel.slug}`}
                    className="flex items-center gap-2 rounded-lg border border-border bg-background/60 p-2.5 hover:border-primary/40"
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                      {index + 1}
                    </span>
                    <img
                      src={item.novel.coverUrl || "/default-cover.svg"}
                      alt={item.novel.title}
                      className="h-12 w-9 rounded border border-border/70 object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-medium">{item.novel.title}</p>
                      <p className="text-xs text-muted-foreground">{item.recommendCount} đề cử</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card shadow-sm xl:col-span-2">
          <div className="border-b border-border p-4">
            <h2 className="text-base font-semibold">Danh sách đề cử hiện tại</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-semibold">Truyện</th>
                  <th className="px-4 py-3 font-semibold">Biên tập viên</th>
                  <th className="px-4 py-3 font-semibold">Tổng đề cử</th>
                  <th className="px-4 py-3 font-semibold">Thời gian</th>
                  <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Chưa có đề cử nào
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <Link href={`/truyen/${item.novel.slug}`} className="font-medium hover:text-primary">
                          {item.novel.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">{item.novel.authorName}</p>
                      </td>
                      <td className="px-4 py-3">{item.editor.name}</td>
                      <td className="px-4 py-3">{item.recommendCount}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatRelativeTime(item.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {canDelete(item) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                          >
                            {deletingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            Xóa
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Không có quyền xóa</span>
                        )}
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
