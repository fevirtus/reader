"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Check, Loader2, RefreshCw, Save, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

type MissingKey = "author" | "cover" | "description" | "genres"

type Genre = {
    id: string
    name: string
}

type MissingNovel = {
    id: string
    title: string
    slug: string
    authorName: string
    coverUrl: string | null
    description: string
    totalChapters: number
    updatedAt: string
    series: {
        id: string
        name: string
        slug: string
    } | null
    genres: Genre[]
    missing: Record<MissingKey, boolean>
}

type RowDraft = {
    authorName: string
    coverUrl: string
    description: string
    genreIds: string[]
}

const missingKeyLabel: Record<MissingKey, string> = {
    author: "Thiếu tác giả",
    cover: "Thiếu ảnh bìa",
    description: "Thiếu giới thiệu",
    genres: "Thiếu thể loại",
}

const allMissingKeys: MissingKey[] = ["author", "cover", "description", "genres"]

function toDraft(novel: MissingNovel): RowDraft {
    return {
        authorName: novel.authorName || "",
        coverUrl: novel.coverUrl || "",
        description: novel.description || "",
        genreIds: novel.genres.map((genre) => genre.id),
    }
}

function normalizeGenreName(value: string): string {
    return value.trim().replace(/\s+/g, " ")
}

type GenreTagSelectorProps = {
    genres: Genre[]
    selectedIds: string[]
    onChange: (next: string[]) => void
    onEnsureGenre: (name: string) => Promise<string | null>
    placeholder?: string
}

function GenreTagSelector({
    genres,
    selectedIds,
    onChange,
    onEnsureGenre,
    placeholder = "Nhập để tìm thể loại...",
}: GenreTagSelectorProps) {
    const [query, setQuery] = useState("")
    const [saving, setSaving] = useState(false)

    const normalizedQuery = query.trim().toLowerCase()
    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

    const selectedItems = useMemo(() => {
        const byId = new Map(genres.map((genre) => [genre.id, genre]))
        return selectedIds
            .map((id) => byId.get(id))
            .filter((genre): genre is Genre => Boolean(genre))
    }, [genres, selectedIds])

    const matchedGenres = useMemo(() => {
        if (!normalizedQuery) return []
        return genres
            .filter((genre) => genre.name.toLowerCase().includes(normalizedQuery))
            .slice(0, 8)
    }, [genres, normalizedQuery])

    const exactMatchedGenre = useMemo(() => {
        if (!normalizedQuery) return null
        return genres.find((genre) => genre.name.trim().toLowerCase() === normalizedQuery) || null
    }, [genres, normalizedQuery])

    const toggleGenre = (id: string) => {
        onChange(selectedSet.has(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id])
    }

    const handleAddOrPick = async () => {
        const name = normalizeGenreName(query)
        if (!name) return

        if (exactMatchedGenre) {
            if (!selectedSet.has(exactMatchedGenre.id)) {
                onChange([...selectedIds, exactMatchedGenre.id])
            }
            setQuery("")
            return
        }

        setSaving(true)
        try {
            const createdId = await onEnsureGenre(name)
            if (createdId && !selectedSet.has(createdId)) {
                onChange([...selectedIds, createdId])
            }
            if (createdId) {
                setQuery("")
            }
        } finally {
            setSaving(false)
        }
    }

    const actionLabel = exactMatchedGenre
        ? (selectedSet.has(exactMatchedGenre.id) ? "Đã chọn" : "Chọn")
        : "Tạo"

    return (
        <div className="space-y-2">
            <div className="flex gap-2">
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={placeholder}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault()
                            handleAddOrPick()
                        }
                    }}
                />
                <Button type="button" variant="secondary" size="sm" onClick={handleAddOrPick} disabled={saving || !query.trim()}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : actionLabel}
                </Button>
            </div>

            <div className="rounded-md border bg-muted/20 p-2">
                <div className="flex flex-wrap gap-1.5">
                    {selectedItems.length === 0 && (
                        <span className="text-xs text-muted-foreground">Chưa chọn thể loại</span>
                    )}
                    {selectedItems.map((genre) => (
                        <button
                            key={genre.id}
                            type="button"
                            onClick={() => toggleGenre(genre.id)}
                            className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs text-primary"
                            title="Bỏ chọn"
                        >
                            {genre.name}
                            <X className="h-3 w-3" />
                        </button>
                    ))}
                </div>

                {query.trim().length > 0 && (
                    <div className="mt-2 border-t pt-2">
                        <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Gợi ý</p>
                        <div className="flex flex-wrap gap-1.5">
                            {matchedGenres.length === 0 && (
                                <span className="text-xs text-muted-foreground">Không có thể loại phù hợp, bấm Tạo để thêm mới.</span>
                            )}
                            {matchedGenres.map((genre) => {
                                const selected = selectedSet.has(genre.id)
                                return (
                                    <button
                                        key={genre.id}
                                        type="button"
                                        onClick={() => toggleGenre(genre.id)}
                                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${selected
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : "border-border bg-background text-muted-foreground"}`}
                                    >
                                        {genre.name}
                                        {selected && <Check className="h-3 w-3" />}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export function MissingFieldsClient() {
    const [loading, setLoading] = useState(true)
    const [reloading, setReloading] = useState(false)
    const [items, setItems] = useState<MissingNovel[]>([])
    const [genres, setGenres] = useState<Genre[]>([])
    const [drafts, setDrafts] = useState<Record<string, RowDraft>>({})
    const [savingIds, setSavingIds] = useState<string[]>([])

    const [queryInput, setQueryInput] = useState("")
    const [searchKeyword, setSearchKeyword] = useState("")
    const [selectedMissing, setSelectedMissing] = useState<Record<MissingKey, boolean>>({
        author: true,
        cover: true,
        description: true,
        genres: true,
    })

    const [selectedNovelIds, setSelectedNovelIds] = useState<string[]>([])
    const [bulkSaving, setBulkSaving] = useState(false)

    const [bulkApplyAuthor, setBulkApplyAuthor] = useState(false)
    const [bulkApplyCover, setBulkApplyCover] = useState(false)
    const [bulkApplyDescription, setBulkApplyDescription] = useState(false)
    const [bulkApplyGenres, setBulkApplyGenres] = useState(false)

    const [bulkAuthorName, setBulkAuthorName] = useState("")
    const [bulkCoverUrl, setBulkCoverUrl] = useState("")
    const [bulkDescription, setBulkDescription] = useState("")
    const [bulkGenreIds, setBulkGenreIds] = useState<string[]>([])

    const activeMissingKeys = useMemo(() => {
        return allMissingKeys.filter((key) => selectedMissing[key])
    }, [selectedMissing])

    const selectedNovelSet = useMemo(() => new Set(selectedNovelIds), [selectedNovelIds])

    const pendingCount = items.length

    const fetchGenres = async (): Promise<Genre[]> => {
        try {
            const res = await fetch("/api/mod/the-loai")
            if (!res.ok) return []

            const data = await res.json()
            const rows = Array.isArray(data) ? data : []
            setGenres(rows)
            return rows
        } catch {
            // Ignore genre preload errors for now.
            return []
        }
    }

    const ensureGenre = async (rawName: string): Promise<string | null> => {
        const name = normalizeGenreName(rawName)
        if (!name) return null

        const existed = genres.find((genre) => genre.name.trim().toLowerCase() === name.toLowerCase())
        if (existed) return existed.id

        try {
            const res = await fetch("/api/mod/the-loai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description: "" }),
            })

            const data = await res.json()
            if (!res.ok) {
                if (res.status === 400) {
                    const refreshed = await fetchGenres()
                    const maybeExisted = refreshed.find((genre) => genre.name.trim().toLowerCase() === name.toLowerCase())
                    if (maybeExisted) return maybeExisted.id
                }
                throw new Error(data?.error || "Không thể tạo thể loại")
            }

            const created = data as Genre
            setGenres((prev) => {
                if (prev.some((genre) => genre.id === created.id)) return prev
                return [...prev, created].sort((a, b) => a.name.localeCompare(b.name, "vi"))
            })
            toast.success(`Đã tạo thể loại ${created.name}`)
            return created.id
        } catch (error: any) {
            toast.error(error?.message || "Không thể tạo thể loại")
            return null
        }
    }

    const fetchMissingNovels = async (isReload = false) => {
        try {
            if (isReload) setReloading(true)
            else setLoading(true)

            const params = new URLSearchParams()
            params.set("missing", activeMissingKeys.join(","))
            if (searchKeyword.trim()) {
                params.set("q", searchKeyword.trim())
            }

            const res = await fetch(`/api/mod/truyen/missing?${params.toString()}`)
            if (!res.ok) {
                throw new Error("Không thể tải danh sách truyện thiếu thông tin")
            }

            const data = await res.json()
            const rows: MissingNovel[] = Array.isArray(data?.items) ? data.items : []

            setItems(rows)
            setSelectedNovelIds((prev) => prev.filter((id) => rows.some((row) => row.id === id)))
            setDrafts((prev) => {
                const next: Record<string, RowDraft> = {}
                for (const row of rows) {
                    next[row.id] = prev[row.id] || toDraft(row)
                }
                return next
            })
        } catch (error: any) {
            toast.error(error?.message || "Không thể tải dữ liệu")
        } finally {
            setLoading(false)
            setReloading(false)
        }
    }

    useEffect(() => {
        fetchGenres()
    }, [])

    useEffect(() => {
        fetchMissingNovels()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchKeyword, activeMissingKeys.join(",")])

    useEffect(() => {
        if (!selectedMissing.author) setBulkApplyAuthor(false)
        if (!selectedMissing.cover) setBulkApplyCover(false)
        if (!selectedMissing.description) setBulkApplyDescription(false)
        if (!selectedMissing.genres) setBulkApplyGenres(false)
    }, [selectedMissing])

    const toggleMissingFilter = (key: MissingKey) => {
        setSelectedMissing((prev) => {
            const next = { ...prev, [key]: !prev[key] }
            const selectedCount = allMissingKeys.filter((item) => next[item]).length
            if (selectedCount === 0) {
                return prev
            }
            return next
        })
    }

    const toggleSelectNovel = (id: string) => {
        setSelectedNovelIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
    }

    const toggleSelectAll = () => {
        if (selectedNovelIds.length === items.length) {
            setSelectedNovelIds([])
            return
        }
        setSelectedNovelIds(items.map((item) => item.id))
    }

    const updateDraft = (id: string, patch: Partial<RowDraft>) => {
        setDrafts((prev) => ({
            ...prev,
            [id]: {
                ...(prev[id] || { authorName: "", coverUrl: "", description: "", genreIds: [] }),
                ...patch,
            },
        }))
    }

    const saveOne = async (id: string) => {
        const draft = drafts[id]
        if (!draft) return

        const update: Record<string, any> = { id }
        if (selectedMissing.author) update.authorName = draft.authorName
        if (selectedMissing.cover) update.coverUrl = draft.coverUrl
        if (selectedMissing.description) update.description = draft.description
        if (selectedMissing.genres) update.genreIds = draft.genreIds

        setSavingIds((prev) => [...prev, id])

        try {
            const res = await fetch("/api/mod/truyen/missing", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    updates: [update],
                }),
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data?.error || "Cập nhật thất bại")
            }

            if (data.failureCount > 0) {
                throw new Error(data.failures?.[0]?.error || "Có lỗi khi cập nhật")
            }

            toast.success("Đã cập nhật truyện")
            await fetchMissingNovels(true)
        } catch (error: any) {
            toast.error(error?.message || "Không thể cập nhật")
        } finally {
            setSavingIds((prev) => prev.filter((item) => item !== id))
        }
    }

    const applyBulkUpdate = async () => {
        if (selectedNovelIds.length === 0) {
            toast.error("Chưa chọn truyện để cập nhật")
            return
        }

        const hasAnyVisibleBulkApply =
            (selectedMissing.author && bulkApplyAuthor) ||
            (selectedMissing.cover && bulkApplyCover) ||
            (selectedMissing.description && bulkApplyDescription) ||
            (selectedMissing.genres && bulkApplyGenres)

        if (!hasAnyVisibleBulkApply) {
            toast.error("Chọn ít nhất một trường để áp dụng hàng loạt")
            return
        }

        const updates = selectedNovelIds.map((id) => {
            const next: Record<string, any> = { id }

            if (selectedMissing.author && bulkApplyAuthor) {
                next.authorName = bulkAuthorName
            }

            if (selectedMissing.cover && bulkApplyCover) {
                next.coverUrl = bulkCoverUrl
            }

            if (selectedMissing.description && bulkApplyDescription) {
                next.description = bulkDescription
            }

            if (selectedMissing.genres && bulkApplyGenres) {
                next.genreIds = bulkGenreIds
            }

            return next
        })

        setBulkSaving(true)
        try {
            const res = await fetch("/api/mod/truyen/missing", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ updates }),
            })

            const data = await res.json()
            if (!res.ok) {
                throw new Error(data?.error || "Cập nhật hàng loạt thất bại")
            }

            if (data.failureCount > 0) {
                toast.warning(`Đã cập nhật ${data.updatedCount} truyện, lỗi ${data.failureCount} truyện`)
            } else {
                toast.success(`Đã cập nhật ${data.updatedCount} truyện`)
            }

            setSelectedNovelIds([])
            await fetchMissingNovels(true)
        } catch (error: any) {
            toast.error(error?.message || "Không thể cập nhật hàng loạt")
        } finally {
            setBulkSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Bổ sung dữ liệu truyện còn thiếu</h1>
                        <p className="text-sm text-muted-foreground">Lọc nhanh truyện thiếu tác giả, ảnh bìa, giới thiệu hoặc thể loại và sửa trực tiếp ngay tại bảng.</p>
                    </div>
                    <Button type="button" variant="outline" onClick={() => fetchMissingNovels(true)} disabled={reloading || loading}>
                        {reloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Làm mới
                    </Button>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
                    <div className="flex gap-2">
                        <Input
                            value={queryInput}
                            onChange={(e) => setQueryInput(e.target.value)}
                            placeholder="Tìm theo tên truyện, slug, tác giả, series..."
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    setSearchKeyword(queryInput)
                                }
                            }}
                        />
                        <Button type="button" onClick={() => setSearchKeyword(queryInput)}>Lọc</Button>
                    </div>

                    <div className="text-sm text-muted-foreground lg:text-right">
                        Đang hiển thị <span className="font-semibold text-foreground">{pendingCount}</span> truyện cần bổ sung.
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                    {allMissingKeys.map((key) => (
                        <label key={key} className="inline-flex items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm">
                            <input
                                type="checkbox"
                                checked={selectedMissing[key]}
                                onChange={() => toggleMissingFilter(key)}
                            />
                            {missingKeyLabel[key]}
                        </label>
                    ))}
                </div>
            </div>

            {selectedNovelIds.length > 0 && (
                <div className="rounded-xl border bg-card p-5 shadow-sm space-y-4">
                    <h2 className="text-lg font-semibold">Cập nhật hàng loạt cho {selectedNovelIds.length} truyện đã chọn</h2>

                    <div className="grid gap-3 lg:grid-cols-2">
                        {selectedMissing.author && (
                            <label className="space-y-2 text-sm">
                                <span className="inline-flex items-center gap-2 font-medium">
                                    <input type="checkbox" checked={bulkApplyAuthor} onChange={(e) => setBulkApplyAuthor(e.target.checked)} />
                                    Áp dụng tác giả
                                </span>
                                <Input value={bulkAuthorName} onChange={(e) => setBulkAuthorName(e.target.value)} placeholder="Tên tác giả" />
                            </label>
                        )}

                        {selectedMissing.cover && (
                            <label className="space-y-2 text-sm">
                                <span className="inline-flex items-center gap-2 font-medium">
                                    <input type="checkbox" checked={bulkApplyCover} onChange={(e) => setBulkApplyCover(e.target.checked)} />
                                    Áp dụng ảnh bìa
                                </span>
                                <Input value={bulkCoverUrl} onChange={(e) => setBulkCoverUrl(e.target.value)} placeholder="URL ảnh bìa (để trống để xóa)" />
                            </label>
                        )}
                    </div>

                    {selectedMissing.description && (
                        <label className="space-y-2 text-sm block">
                            <span className="inline-flex items-center gap-2 font-medium">
                                <input type="checkbox" checked={bulkApplyDescription} onChange={(e) => setBulkApplyDescription(e.target.checked)} />
                                Áp dụng giới thiệu ngắn
                            </span>
                            <Textarea value={bulkDescription} onChange={(e) => setBulkDescription(e.target.value)} rows={3} placeholder="Giới thiệu ngắn" />
                        </label>
                    )}

                    {selectedMissing.genres && (
                        <div className="space-y-2 text-sm">
                            <span className="inline-flex items-center gap-2 font-medium">
                                <input type="checkbox" checked={bulkApplyGenres} onChange={(e) => setBulkApplyGenres(e.target.checked)} />
                                Áp dụng thể loại
                            </span>
                            <GenreTagSelector
                                genres={genres}
                                selectedIds={bulkGenreIds}
                                onChange={setBulkGenreIds}
                                onEnsureGenre={ensureGenre}
                            />
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button type="button" onClick={applyBulkUpdate} disabled={bulkSaving}>
                            {bulkSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Cập nhật hàng loạt
                        </Button>
                    </div>
                </div>
            )}

            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="p-10 text-center text-muted-foreground">Không tìm thấy truyện phù hợp bộ lọc hiện tại.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px] text-sm">
                            <thead className="bg-muted/40 border-b">
                                <tr>
                                    <th className="px-3 py-3 text-left">
                                        <input type="checkbox" checked={selectedNovelIds.length === items.length} onChange={toggleSelectAll} />
                                    </th>
                                    <th className="px-3 py-3 text-left font-semibold">Truyện</th>
                                    {selectedMissing.author && <th className="px-3 py-3 text-left font-semibold">Tác giả</th>}
                                    {selectedMissing.cover && <th className="px-3 py-3 text-left font-semibold">Ảnh bìa</th>}
                                    {selectedMissing.description && <th className="px-3 py-3 text-left font-semibold">Giới thiệu</th>}
                                    {selectedMissing.genres && <th className="px-3 py-3 text-left font-semibold">Thể loại</th>}
                                    <th className="px-3 py-3 text-right font-semibold">Lưu</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => {
                                    const draft = drafts[item.id] || toDraft(item)
                                    const rowSaving = savingIds.includes(item.id)

                                    return (
                                        <tr key={item.id} className="border-b align-top last:border-b-0">
                                            <td className="px-3 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedNovelSet.has(item.id)}
                                                    onChange={() => toggleSelectNovel(item.id)}
                                                />
                                            </td>
                                            <td className="px-3 py-3 space-y-2 min-w-[220px]">
                                                <Link href={`/truyen/${item.slug}`} className="font-semibold text-primary hover:underline" target="_blank">
                                                    {item.title}
                                                </Link>
                                                <p className="text-xs text-muted-foreground">{item.series?.name || "Độc lập"} - {item.totalChapters} chương</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {allMissingKeys.filter((key) => item.missing[key]).map((key) => (
                                                        <span key={key} className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                                            {missingKeyLabel[key]}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            {selectedMissing.author && (
                                                <td className="px-3 py-3 min-w-[170px]">
                                                    <Input
                                                        value={draft.authorName}
                                                        onChange={(e) => updateDraft(item.id, { authorName: e.target.value })}
                                                        placeholder="Tác giả"
                                                    />
                                                </td>
                                            )}
                                            {selectedMissing.cover && (
                                                <td className="px-3 py-3 min-w-[220px]">
                                                    <Input
                                                        value={draft.coverUrl}
                                                        onChange={(e) => updateDraft(item.id, { coverUrl: e.target.value })}
                                                        placeholder="URL ảnh bìa"
                                                    />
                                                </td>
                                            )}
                                            {selectedMissing.description && (
                                                <td className="px-3 py-3 min-w-[340px]">
                                                    <Textarea
                                                        value={draft.description}
                                                        onChange={(e) => updateDraft(item.id, { description: e.target.value })}
                                                        rows={4}
                                                        placeholder="Giới thiệu ngắn"
                                                    />
                                                </td>
                                            )}
                                            {selectedMissing.genres && (
                                                <td className="px-3 py-3 min-w-[300px]">
                                                    <GenreTagSelector
                                                        genres={genres}
                                                        selectedIds={draft.genreIds}
                                                        onChange={(next) => updateDraft(item.id, { genreIds: next })}
                                                        onEnsureGenre={ensureGenre}
                                                    />
                                                </td>
                                            )}
                                            <td className="px-3 py-3 text-right">
                                                <Button type="button" size="sm" onClick={() => saveOne(item.id)} disabled={rowSaving}>
                                                    {rowSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                </Button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
