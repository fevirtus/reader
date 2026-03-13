"use client"

import { useState, useEffect, useMemo, useRef } from "react"
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
    DialogTrigger,
} from "@/components/ui/dialog"
import { BookOpen, Loader2, Plus, Upload, Edit, Trash2, LayoutGrid, List, Image as ImageIcon, Search, FileText, X, Check, FolderOpen, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { getNovelStatusBadgeClass } from "@/lib/novel-status"
import { Progress } from "@/components/ui/progress"

interface Novel {
    id: string
    title: string
    slug: string
    authorName: string
    status: string
    totalChapters: number
    coverUrl?: string
    series?: {
        id: string
        name: string
        slug: string
    } | null
}

interface Genre {
    id: string
    name: string
}

interface SeriesOption {
    id: string
    name: string
    slug: string
    _count?: {
        novels: number
    }
}

interface EpubPreviewData {
    fileName: string
    splitMode: "toc" | "regex"
    detectedStructureType: "standard" | "light_novel"
    hasCoverFromEpub?: boolean
    parserInfo?: {
        splitMode: "toc" | "regex"
        chapterRegexUsed?: string | null
        regexPreset?: string | null
        sourceSections: number
        chaptersDetected: number
        chaptersFinal?: number
        insertedMissingChapters?: number
        detectedMaxChapterNumber?: number
    }
    novel: {
        title: string
        authorName: string
        description: string
        detectedGenres?: string[]
        totalChapters: number
    }
    chaptersPreview: {
        number: number
        title: string
        isPlaceholder?: boolean
        volumeNumber: number | null
        volumeTitle: string | null
        volumeChapterNumber: number | null
        excerpt: string
    }[]
}

type BulkUploadStatus = "pending" | "uploading" | "success" | "failed" | "skipped"
type BulkDuplicateHandling = "ask" | "replace-all" | "skip-all"

interface BulkUploadProgressItem {
    fileKey: string
    displayName: string
    progress: number
    status: BulkUploadStatus
    message?: string
}

interface EpubUploadResponseData {
    error?: string
    code?: string
    canReplace?: boolean
    existingNovel?: {
        id: string
        title: string
        slug: string
    }
    replaced?: boolean
}

const CHAPTER_REGEX_PRESETS = [
    {
        id: "vi_chuong",
        name: "VN - Chương 1: ...",
        pattern: "^(?:Chương|Ch\\.)\\s*\\d+(?:\\.\\d+)?[^\\n]*$",
    },
    {
        id: "en_chapter",
        name: "EN - Chapter 1: ...",
        pattern: "^(?:Chapter|Ch\\.)\\s*\\d+(?:\\.\\d+)?[^\\n]*$",
    },
    {
        id: "mix_chapter",
        name: "Mixed - Chương/Chapter",
        pattern: "^(?:Chương|Chapter|Ch\\.)\\s*\\d+(?:\\.\\d+)?[^\\n]*$",
    },
    {
        id: "bracket_chapter",
        name: "[Chương 01] ...",
        pattern: "^\\[?\\s*(?:Chương|Chapter)\\s*\\d+(?:\\.\\d+)?\\s*\\]?[^\\n]*$",
    },
]

export function NovelClient() {
    const [novels, setNovels] = useState<Novel[]>([])
    const [loading, setLoading] = useState(true)
    const [openAdd, setOpenAdd] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [uploadingEpub, setUploadingEpub] = useState(false)
    const [previewingEpub, setPreviewingEpub] = useState(false)
    const [openEpubPreview, setOpenEpubPreview] = useState(false)
    const [openBulkEpubImport, setOpenBulkEpubImport] = useState(false)
    const [epubPreviewData, setEpubPreviewData] = useState<EpubPreviewData | null>(null)
    const [pendingEpubFile, setPendingEpubFile] = useState<File | null>(null)
    const [pendingEpubFiles, setPendingEpubFiles] = useState<File[]>([])
    const [epubTitle, setEpubTitle] = useState("")
    const [epubAuthorName, setEpubAuthorName] = useState("")
    const [epubDescription, setEpubDescription] = useState("")
    const [epubSeriesMode, setEpubSeriesMode] = useState<"none" | "existing" | "new">("none")
    const [epubSeriesId, setEpubSeriesId] = useState("")
    const [epubSeriesName, setEpubSeriesName] = useState("")
    const [epubSplitMode, setEpubSplitMode] = useState<"toc" | "regex">("toc")
    const [epubRegexPreset, setEpubRegexPreset] = useState<string>("vi_chuong")
    const [epubCustomRegex, setEpubCustomRegex] = useState("")
    const epubInputRef = useRef<HTMLInputElement>(null)
    const epubFolderInputRef = useRef<HTMLInputElement>(null)

    // Form states
    const [title, setTitle] = useState("")
    const [originalTitle, setOriginalTitle] = useState("")
    const [authorName, setAuthorName] = useState("")
    const [originalAuthorName, setOriginalAuthorName] = useState("")
    const [description, setDescription] = useState("")
    const [coverUrl, setCoverUrl] = useState("")
    const [seriesMode, setSeriesMode] = useState<"none" | "existing" | "new">("none")
    const [selectedSeriesId, setSelectedSeriesId] = useState("")
    const [newSeriesName, setNewSeriesName] = useState("")
    const [status, setStatus] = useState("Đang ra")
    
    // View state
    const [viewMode, setViewMode] = useState<"list" | "grid">("list")
    const [uploadingCover, setUploadingCover] = useState(false)

    // Edit states
    const [openEdit, setOpenEdit] = useState(false)
    const [editingNovel, setEditingNovel] = useState<Novel | null>(null)
    const [loadingEditData, setLoadingEditData] = useState(false)

    // Genre states
    const [genres, setGenres] = useState<Genre[]>([])
    const [seriesList, setSeriesList] = useState<SeriesOption[]>([])
    const [selectedGenres, setSelectedGenres] = useState<string[]>([])
    const [genreQuery, setGenreQuery] = useState("")
    const [addingGenre, setAddingGenre] = useState(false)

    // Delete states
    const [openDelete, setOpenDelete] = useState(false)
    const [deletingNovelId, setDeletingNovelId] = useState<string | null>(null)

    // Bulk states
    const [searchKeyword, setSearchKeyword] = useState("")
    const [selectedNovelIds, setSelectedNovelIds] = useState<string[]>([])
    const [bulkSubmitting, setBulkSubmitting] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [bulkProgress, setBulkProgress] = useState<Record<string, BulkUploadProgressItem>>({})
    const [bulkDuplicateHandling, setBulkDuplicateHandling] = useState<BulkDuplicateHandling>("ask")

    const getSelectedChapterRegex = () => {
        if (epubRegexPreset === "custom") {
            return epubCustomRegex.trim()
        }

        return CHAPTER_REGEX_PRESETS.find((preset) => preset.id === epubRegexPreset)?.pattern || CHAPTER_REGEX_PRESETS[0].pattern
    }

    const normalizeEpubFiles = (files: File[]) => {
        return files.filter((file) => file.name.toLowerCase().endsWith(".epub"))
    }

    const buildEpubFileKey = (file: File) => {
        const relativePath = file.webkitRelativePath || file.name
        return `${relativePath}::${file.size}::${file.lastModified}`
    }

    const cloneFormData = (source: FormData): FormData => {
        const next = new FormData()
        for (const [key, value] of source.entries()) {
            next.append(key, value)
        }
        return next
    }

    const uploadEpubRequest = async (
        formData: FormData,
        onProgress?: (progress: number) => void
    ): Promise<{ status: number; ok: boolean; data: EpubUploadResponseData }> => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest()
            xhr.open("POST", "/api/mod/epub")

            xhr.upload.onprogress = (event) => {
                if (!onProgress || !event.lengthComputable) return
                const percent = Math.round((event.loaded / event.total) * 100)
                onProgress(Math.min(99, Math.max(0, percent)))
            }

            xhr.onerror = () => reject(new Error("Không thể kết nối tới server"))

            xhr.onload = () => {
                let data: EpubUploadResponseData = {}
                try {
                    data = xhr.responseText ? JSON.parse(xhr.responseText) : {}
                } catch {
                    data = {}
                }

                resolve({
                    status: xhr.status,
                    ok: xhr.status >= 200 && xhr.status < 300,
                    data,
                })
            }

            xhr.send(formData)
        })
    }

    const setBulkProgressItem = (fileKey: string, patch: Partial<BulkUploadProgressItem>) => {
        setBulkProgress((prev) => {
            const current = prev[fileKey]
            if (!current) return prev

            return {
                ...prev,
                [fileKey]: {
                    ...current,
                    ...patch,
                },
            }
        })
    }

    const initializeBulkProgress = (files: File[]) => {
        const initial: Record<string, BulkUploadProgressItem> = {}
        for (const file of files) {
            const fileKey = buildEpubFileKey(file)
            initial[fileKey] = {
                fileKey,
                displayName: file.webkitRelativePath || file.name,
                progress: 0,
                status: "pending",
            }
        }
        setBulkProgress(initial)
    }

    const mergeUniqueEpubFiles = (base: File[], incoming: File[]) => {
        const merged: File[] = [...base]
        const picked = new Set(base.map((file) => buildEpubFileKey(file)))

        for (const file of incoming) {
            const key = buildEpubFileKey(file)
            if (picked.has(key)) continue
            picked.add(key)
            merged.push(file)
        }

        return merged
    }

    const appendPendingBulkEpubFiles = (incomingFiles: File[]) => {
        const merged = mergeUniqueEpubFiles(pendingEpubFiles, incomingFiles)
        const addedCount = merged.length - pendingEpubFiles.length

        if (addedCount <= 0) {
            toast.info("Các file EPUB đã có sẵn trong hàng đợi")
        } else {
            toast.success(`Đã thêm ${addedCount} file EPUB vào hàng đợi import`)
        }

        setPendingEpubFile(null)
        setOpenEpubPreview(false)
        setPendingEpubFiles(merged)
        initializeBulkProgress(merged)
        setOpenBulkEpubImport(true)
    }

    const fetchNovels = async () => {
        try {
            const res = await fetch("/api/mod/truyen")
            if (!res.ok) throw new Error("Lấy danh sách lỗi")
            const data = await res.json()
            setNovels(data)
            setSelectedNovelIds((prev) => prev.filter((id) => data.some((novel: Novel) => novel.id === id)))
        } catch {
            toast.error("Không thể tải danh sách truyện")
        } finally {
            setLoading(false)
        }
    }

    const fetchGenres = async () => {
        try {
            const res = await fetch("/api/mod/the-loai")
            if (res.ok) {
                const data = await res.json()
                setGenres(data)
            }
        } catch {
            console.error("Failed to fetch genres")
        }
    }

    const fetchSeries = async () => {
        try {
            const res = await fetch("/api/mod/series")
            if (res.ok) {
                const data = await res.json()
                setSeriesList(data)
            }
        } catch {
            console.error("Failed to fetch series")
        }
    }

    useEffect(() => {
        fetchNovels()
        fetchGenres()
        fetchSeries()
    }, [])

    const filteredNovels = useMemo(() => {
        const keyword = searchKeyword.trim().toLowerCase()
        if (!keyword) return novels

        return novels.filter((novel) => {
            const searchable = [novel.title, novel.authorName, novel.series?.name || ""].join(" ").toLowerCase()
            return searchable.includes(keyword)
        })
    }, [novels, searchKeyword])

    const totalPages = Math.max(1, Math.ceil(filteredNovels.length / pageSize))

    const pagedNovels = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        return filteredNovels.slice(start, start + pageSize)
    }, [filteredNovels, currentPage, pageSize])

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages)
        }
    }, [currentPage, totalPages])

    useEffect(() => {
        setCurrentPage(1)
    }, [searchKeyword])

    const normalizedGenreQuery = genreQuery.trim().toLowerCase()
    const matchedGenres = useMemo(() => {
        if (!normalizedGenreQuery) return []
        return genres
            .filter((genre) => genre.name.toLowerCase().includes(normalizedGenreQuery))
            .slice(0, 8)
    }, [genres, normalizedGenreQuery])

    const exactMatchedGenre = useMemo(() => {
        if (!normalizedGenreQuery) return null
        return genres.find((genre) => genre.name.trim().toLowerCase() === normalizedGenreQuery) || null
    }, [genres, normalizedGenreQuery])

    const selectedGenreItems = useMemo(() => {
        const byId = new Map(genres.map((genre) => [genre.id, genre]))
        return selectedGenres
            .map((id) => byId.get(id))
            .filter((genre): genre is Genre => Boolean(genre))
    }, [genres, selectedGenres])

    const visibleNovelIds = useMemo(() => pagedNovels.map((novel) => novel.id), [pagedNovels])
    const allVisibleSelected = visibleNovelIds.length > 0 && visibleNovelIds.every((id) => selectedNovelIds.includes(id))

    const bulkProgressItems = useMemo(() => {
        return pendingEpubFiles
            .map((file) => bulkProgress[buildEpubFileKey(file)])
            .filter((item): item is BulkUploadProgressItem => Boolean(item))
    }, [pendingEpubFiles, bulkProgress])

    const processedBulkCount = useMemo(
        () => bulkProgressItems.filter((item) => ["success", "failed", "skipped"].includes(item.status)).length,
        [bulkProgressItems]
    )

    const overallBulkProgress = useMemo(() => {
        if (bulkProgressItems.length === 0) return 0
        return Math.round((processedBulkCount / bulkProgressItems.length) * 100)
    }, [bulkProgressItems, processedBulkCount])

    const toggleNovelSelection = (id: string) => {
        setSelectedNovelIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id])
    }

    const toggleSelectAllVisible = () => {
        setSelectedNovelIds((prev) => {
            if (allVisibleSelected) {
                return prev.filter((id) => !visibleNovelIds.includes(id))
            }

            const merged = new Set([...prev, ...visibleNovelIds])
            return Array.from(merged)
        })
    }

    const handleBulkDelete = async () => {
        if (selectedNovelIds.length === 0) {
            toast.error("Vui lòng chọn truyện cần xóa")
            return
        }

        if (!confirm(`Bạn có chắc muốn xóa ${selectedNovelIds.length} truyện đã chọn?`)) return

        setBulkSubmitting(true)
        try {
            const res = await fetch("/api/mod/truyen/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "delete", ids: selectedNovelIds }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Không thể xóa hàng loạt")

            toast.success(`Đã xóa ${data.deletedCount || selectedNovelIds.length} truyện`)
            setSelectedNovelIds([])
            fetchNovels()
            fetchSeries()
        } catch (error: any) {
            toast.error(error.message || "Lỗi khi xóa hàng loạt")
        } finally {
            setBulkSubmitting(false)
        }
    }

    const toggleGenre = (id: string) => {
        setSelectedGenres(prev =>
            prev.includes(id) ? prev.filter(gId => gId !== id) : [...prev, id]
        )
    }

    const handleAddGenre = async () => {
        const inputName = genreQuery.trim()
        if (!inputName) return

        const existed = genres.find((genre) => genre.name.trim().toLowerCase() === inputName.toLowerCase())
        if (existed) {
            setSelectedGenres((prev) => prev.includes(existed.id) ? prev : [...prev, existed.id])
            setGenreQuery("")
            return
        }

        setAddingGenre(true)
        try {
            const res = await fetch("/api/mod/the-loai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: inputName, description: "" })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Thêm lỗi")

            toast.success("Thêm thể loại thành công")
            setGenreQuery("")
            fetchGenres()
            setSelectedGenres(prev => prev.includes(data.id) ? prev : [...prev, data.id])
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setAddingGenre(false)
        }
    }

    const handleDeleteGenre = async (id: string, name: string) => {
        if (!confirm(`Bạn có chắc muốn xóa thể loại "${name}" khỏi hệ thống?`)) return;

        try {
            const res = await fetch(`/api/mod/the-loai?id=${id}`, {
                method: "DELETE"
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Xóa lỗi")
            }
            toast.success("Đã xóa thể loại thành công")
            fetchGenres()
            // Clean up from selected lists
            setSelectedGenres(prev => prev.filter(gId => gId !== id))
            if (genreQuery.trim() && genreQuery.trim().toLowerCase() === name.trim().toLowerCase()) {
                setGenreQuery("")
            }
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const renderGenreSelector = (label: string) => {
        const actionLabel = exactMatchedGenre
            ? (selectedGenres.includes(exactMatchedGenre.id) ? "Đã chọn" : "Chọn")
            : "Tạo"

        return (
            <div className="space-y-2">
                <label className="text-sm font-medium">{label}</label>
                <div className="flex gap-2">
                    <Input
                        placeholder="Nhập để tìm thể loại..."
                        value={genreQuery}
                        onChange={(e) => setGenreQuery(e.target.value)}
                        className="flex-1"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault()
                                handleAddGenre()
                            }
                        }}
                    />
                    <Button type="button" variant="secondary" onClick={handleAddGenre} disabled={addingGenre || !genreQuery.trim()}>
                        {addingGenre ? <Loader2 className="w-4 h-4 animate-spin" /> : actionLabel}
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                    Nhập tên thể loại để tìm trong hệ thống. Nếu chưa có, bấm Tạo để thêm mới.
                </p>

                <div className="space-y-2 rounded-md border bg-card p-2">
                    <div className="flex flex-wrap gap-2">
                        {selectedGenreItems.map((genre) => (
                            <div key={genre.id} className="flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs text-primary">
                                <span className="font-medium">{genre.name}</span>
                                <button
                                    type="button"
                                    className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-muted hover:text-foreground"
                                    onClick={() => toggleGenre(genre.id)}
                                    title="Bỏ chọn"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-destructive hover:text-destructive-foreground"
                                    onClick={() => handleDeleteGenre(genre.id, genre.name)}
                                    title="Xóa khỏi hệ thống"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                        {selectedGenreItems.length === 0 && (
                            <span className="p-1 text-xs text-muted-foreground">Chưa chọn thể loại nào</span>
                        )}
                    </div>

                    {genreQuery.trim().length > 0 && (
                        <div className="border-t pt-2">
                            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Kết quả phù hợp</p>
                            <div className="flex flex-wrap gap-2">
                                {matchedGenres.map((genre) => {
                                    const isSelected = selectedGenres.includes(genre.id)
                                    return (
                                        <div
                                            key={genre.id}
                                            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted/50 text-muted-foreground"}`}
                                        >
                                            <button
                                                type="button"
                                                className="inline-flex items-center gap-1"
                                                onClick={() => toggleGenre(genre.id)}
                                            >
                                                {genre.name}
                                                {isSelected && <Check className="h-3 w-3" />}
                                            </button>
                                            <button
                                                type="button"
                                                className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-destructive hover:text-destructive-foreground"
                                                onClick={() => handleDeleteGenre(genre.id, genre.name)}
                                                title="Xóa khỏi hệ thống"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    )
                                })}
                                {matchedGenres.length === 0 && (
                                    <span className="p-1 text-xs text-muted-foreground">Không có thể loại phù hợp. Bấm Tạo để thêm mới.</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title || !authorName || !description) {
            toast.error("Vui lòng điền đầy đủ thông tin")
            return
        }

        const resolvedNewSeriesName = seriesMode === "new"
            ? (newSeriesName.trim() || title.trim())
            : ""

        if (seriesMode === "existing" && !selectedSeriesId) {
            toast.error("Vui lòng chọn series đã có")
            return
        }

        if (seriesMode === "new" && !resolvedNewSeriesName) {
            toast.error("Vui lòng nhập tên series mới")
            return
        }

        setSubmitting(true)
        try {
            const res = await fetch("/api/mod/truyen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title,
                    originalTitle,
                    authorName,
                    originalAuthorName,
                    description,
                    coverUrl,
                    genreIds: selectedGenres,
                    seriesId: seriesMode === "existing" ? selectedSeriesId : undefined,
                    seriesName: seriesMode === "new" ? resolvedNewSeriesName : undefined,
                }),
            })
            if (!res.ok) throw new Error("Thêm mới thất bại")
            toast.success("Đã thêm truyện thành công!")
            setOpenAdd(false)
            setTitle("")
            setOriginalTitle("")
            setAuthorName("")
            setOriginalAuthorName("")
            setDescription("")
            setCoverUrl("")
            setSeriesMode("none")
            setSelectedSeriesId("")
            setNewSeriesName("")
            setStatus("Đang ra")
            setSelectedGenres([])
            setGenreQuery("")
            fetchNovels()
            fetchSeries()
        } catch {
            toast.error("Lỗi khi thêm truyện mới")
        } finally {
            setSubmitting(false)
        }
    }

    const resetEpubPreviewState = () => {
        setOpenEpubPreview(false)
        setOpenBulkEpubImport(false)
        setEpubPreviewData(null)
        setPendingEpubFile(null)
        setPendingEpubFiles([])
        setBulkProgress({})
        setBulkDuplicateHandling("ask")
        setEpubTitle("")
        setEpubAuthorName("")
        setEpubDescription("")
        setEpubSeriesMode("none")
        setEpubSeriesId("")
        setEpubSeriesName("")
        setEpubSplitMode("toc")
        setEpubRegexPreset("vi_chuong")
        setEpubCustomRegex("")
        if (epubInputRef.current) {
            epubInputRef.current.value = ""
        }
        if (epubFolderInputRef.current) {
            epubFolderInputRef.current.value = ""
        }
    }

    const requestEpubPreview = async (
        file: File,
        options?: {
            splitMode?: "toc" | "regex"
            regexPreset?: string
            regexInput?: string
            preserveEditedMetadata?: boolean
        }
    ) => {
        const splitMode = options?.splitMode || epubSplitMode
        const regexPreset = options?.regexPreset || epubRegexPreset
        const regexInput = options?.regexInput ?? (regexPreset === "custom" ? epubCustomRegex.trim() : getSelectedChapterRegex())

        if (splitMode === "regex" && !regexInput) {
            throw new Error("Vui lòng nhập regex tách chương")
        }

        setPreviewingEpub(true)

        const formData = new FormData()
        formData.append("file", file)
        formData.append("preview", "true")
        formData.append("seriesMode", epubSeriesMode)
        if (epubSeriesMode === "existing") formData.append("seriesId", epubSeriesId)
        if (epubSeriesMode === "new") formData.append("seriesName", epubSeriesName)
        formData.append("splitMode", splitMode)

        if (splitMode === "regex") {
            formData.append("chapterRegexPreset", regexPreset)
            formData.append("chapterRegex", regexInput)
        }

        const res = await fetch("/api/mod/epub", {
            method: "POST",
            body: formData,
        })

        const data = await res.json()
        if (!res.ok) {
            throw new Error(data.error || "Không thể phân tích EPUB")
        }

        setEpubPreviewData(data)
        setEpubSplitMode(data.splitMode || splitMode)

        if (!options?.preserveEditedMetadata) {
            setEpubTitle(data.novel?.title || "")
            setEpubAuthorName(data.novel?.authorName || "")
            setEpubDescription(data.novel?.description || "")
        }

        setOpenEpubPreview(true)
    }

    const handleEpubSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || [])
        if (selectedFiles.length === 0) return

        const epubFiles = normalizeEpubFiles(selectedFiles)
        if (epubFiles.length === 0) {
            toast.error("Không tìm thấy file .epub trong lựa chọn")
            e.target.value = ""
            return
        }

        if (epubFiles.length !== selectedFiles.length) {
            toast.info(`Đã bỏ qua ${selectedFiles.length - epubFiles.length} file không phải EPUB`)
        }

        if (epubFiles.length > 1 || openBulkEpubImport) {
            appendPendingBulkEpubFiles(epubFiles)
            e.target.value = ""
            return
        }

        const file = epubFiles[0]

        setPendingEpubFile(file)

        try {
            await requestEpubPreview(file, {
                splitMode: "toc",
                regexPreset: "vi_chuong",
                regexInput: CHAPTER_REGEX_PRESETS[0].pattern,
                preserveEditedMetadata: false,
            })
        } catch (err: any) {
            toast.error(err.message || "Có lỗi xảy ra khi xử lý file EPUB")
            setPendingEpubFile(null)
        } finally {
            setPreviewingEpub(false)
            e.target.value = ""
        }
    }

    const handleEpubFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || [])
        if (selectedFiles.length === 0) return

        const epubFiles = normalizeEpubFiles(selectedFiles)
        if (epubFiles.length === 0) {
            toast.error("Không tìm thấy file .epub trong thư mục đã chọn")
            e.target.value = ""
            return
        }

        appendPendingBulkEpubFiles(epubFiles)
        e.target.value = ""
    }

    const handleReparseEpub = async () => {
        if (!pendingEpubFile) {
            toast.error("Không tìm thấy file EPUB để phân tích lại")
            return
        }

        try {
            await requestEpubPreview(pendingEpubFile, {
                splitMode: epubSplitMode,
                regexPreset: epubRegexPreset,
                regexInput: epubRegexPreset === "custom" ? epubCustomRegex.trim() : getSelectedChapterRegex(),
                preserveEditedMetadata: true,
            })
        } catch (err: any) {
            toast.error(err.message || "Không thể phân tích lại EPUB")
        } finally {
            setPreviewingEpub(false)
        }
    }

    const handleConfirmEpubUpload = async () => {
        if (!pendingEpubFile) {
            toast.error("Không tìm thấy file EPUB để tải lên")
            return
        }

        if (epubSplitMode === "regex" && epubRegexPreset === "custom" && !epubCustomRegex.trim()) {
            toast.error("Vui lòng nhập regex tùy chỉnh trước khi tải lên")
            return
        }

        if (epubSeriesMode === "existing" && !epubSeriesId) {
            toast.error("Vui lòng chọn series đã có")
            return
        }

        if (epubSeriesMode === "new" && !epubSeriesName.trim()) {
            toast.error("Vui lòng nhập tên series mới")
            return
        }

        setUploadingEpub(true)
        const formData = new FormData()
        formData.append("file", pendingEpubFile)
        formData.append("title", epubTitle)
        formData.append("authorName", epubAuthorName)
        formData.append("description", epubDescription)
        formData.append("seriesMode", epubSeriesMode)
        if (epubSeriesMode === "existing") formData.append("seriesId", epubSeriesId)
        if (epubSeriesMode === "new") formData.append("seriesName", epubSeriesName.trim())
        formData.append("splitMode", epubSplitMode)

        if (epubSplitMode === "regex") {
            const selectedRegex = epubRegexPreset === "custom" ? epubCustomRegex.trim() : getSelectedChapterRegex()
            formData.append("chapterRegexPreset", epubRegexPreset)
            formData.append("chapterRegex", selectedRegex)
        }

        try {
            let upload = await uploadEpubRequest(formData)

            if (upload.status === 409 && upload.data?.code === "DUPLICATE_TITLE") {
                const duplicateTitle = upload.data.existingNovel?.title || epubTitle
                if (upload.data.canReplace === false) {
                    throw new Error(upload.data.error || `Truyện ${duplicateTitle} đã tồn tại và bạn không có quyền ghi đè`)
                }

                const shouldReplace = window.confirm(`Truyện "${duplicateTitle}" đã tồn tại. Bạn có muốn replace truyện này không?`)
                if (!shouldReplace) {
                    toast.info("Đã hủy upload vì trùng tên truyện")
                    return
                }

                const retryFormData = cloneFormData(formData)
                retryFormData.set("replaceExisting", "true")
                upload = await uploadEpubRequest(retryFormData)
            }

            if (!upload.ok) {
                throw new Error(upload.data?.error || "Lỗi khi tải lên EPUB")
            }

            if (upload.data?.replaced) {
                toast.success("Đã replace truyện từ EPUB thành công")
            } else {
                toast.success("Đã tải lên EPUB thành công")
            }
            resetEpubPreviewState()
            fetchNovels()
            fetchSeries()
        } catch (err: any) {
            toast.error(err.message || "Có lỗi xảy ra khi xuất bản truyện")
        } finally {
            setUploadingEpub(false)
        }
    }

    const handleBulkEpubUpload = async () => {
        if (pendingEpubFiles.length === 0) {
            toast.error("Không có file EPUB để tải lên")
            return
        }

        if (epubSeriesMode === "existing" && !epubSeriesId) {
            toast.error("Vui lòng chọn series đã có")
            return
        }

        if (epubSeriesMode === "new" && !epubSeriesName.trim()) {
            toast.error("Vui lòng nhập tên series mới")
            return
        }

        setUploadingEpub(true)
        initializeBulkProgress(pendingEpubFiles)

        let success = 0
        let failed = 0
        let skipped = 0
        let replaced = 0

        try {
            for (const file of pendingEpubFiles) {
                const fileKey = buildEpubFileKey(file)
                const formData = new FormData()
                formData.append("file", file)
                formData.append("seriesMode", epubSeriesMode)
                if (epubSeriesMode === "existing") formData.append("seriesId", epubSeriesId)
                if (epubSeriesMode === "new") formData.append("seriesName", epubSeriesName.trim())
                formData.append("splitMode", "toc")

                setBulkProgressItem(fileKey, {
                    status: "uploading",
                    progress: 1,
                    message: "Đang upload...",
                })

                let upload = await uploadEpubRequest(formData, (progress) => {
                    setBulkProgressItem(fileKey, { progress, status: "uploading" })
                })

                if (upload.status === 409 && upload.data?.code === "DUPLICATE_TITLE") {
                    const duplicateTitle = upload.data.existingNovel?.title || file.name

                    if (upload.data.canReplace === false) {
                        failed += 1
                        setBulkProgressItem(fileKey, {
                            status: "failed",
                            progress: 100,
                            message: upload.data.error || `Trùng tên ${duplicateTitle} nhưng không đủ quyền replace`,
                        })
                        continue
                    }

                    let shouldReplace = false
                    if (bulkDuplicateHandling === "replace-all") {
                        shouldReplace = true
                    } else if (bulkDuplicateHandling === "skip-all") {
                        shouldReplace = false
                    } else {
                        shouldReplace = window.confirm(`File ${file.name} trùng với truyện "${duplicateTitle}". Bạn có muốn replace không?`)
                    }

                    if (!shouldReplace) {
                        skipped += 1
                        setBulkProgressItem(fileKey, {
                            status: "skipped",
                            progress: 100,
                            message: bulkDuplicateHandling === "skip-all" ? "Bỏ qua theo cấu hình" : "Đã bỏ qua do trùng tên",
                        })
                        continue
                    }

                    const retryFormData = cloneFormData(formData)
                    retryFormData.set("replaceExisting", "true")
                    upload = await uploadEpubRequest(retryFormData, (progress) => {
                        setBulkProgressItem(fileKey, { progress, status: "uploading" })
                    })
                }

                if (upload.ok) {
                    success += 1
                    if (upload.data?.replaced) {
                        replaced += 1
                    }
                    setBulkProgressItem(fileKey, {
                        status: "success",
                        progress: 100,
                        message: upload.data?.replaced ? "Đã replace thành công" : "Upload thành công",
                    })
                } else {
                    failed += 1
                    setBulkProgressItem(fileKey, {
                        status: "failed",
                        progress: 100,
                        message: upload.data?.error || "Upload thất bại",
                    })
                }
            }

            if (success > 0 && failed === 0 && skipped === 0) {
                toast.success(`Đã import ${success} file EPUB thành công${replaced > 0 ? ` (${replaced} file replace)` : ""}`)
            } else if (success > 0 || skipped > 0) {
                toast.warning(`Import: thành công ${success}${replaced > 0 ? ` (${replaced} replace)` : ""}, thất bại ${failed}, bỏ qua ${skipped}`)
            } else {
                toast.error("Import EPUB thất bại")
            }

            resetEpubPreviewState()
            fetchNovels()
            fetchSeries()
        } finally {
            setUploadingEpub(false)
        }
    }

    const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            toast.error("Vui lòng chọn file hình ảnh")
            e.target.value = ""
            return
        }

        setUploadingCover(true)
        const formData = new FormData()
        formData.append("file", file)

        try {
            const res = await fetch("/api/mod/upload-cover", {
                method: "POST",
                body: formData,
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Lỗi khi tải lên ảnh bìa")

            setCoverUrl(data.url)
            toast.success("Tải ảnh bìa thành công!")
        } catch (err: any) {
            toast.error(err.message || "Có lỗi xảy ra khi xử lý ảnh bìa")
        } finally {
            setUploadingCover(false)
            e.target.value = ""
        }
    }

    const handleOpenEdit = async (novel: Novel) => {
        setEditingNovel(novel)
        setTitle(novel.title)
        setAuthorName(novel.authorName)
        if (novel.series?.id) {
            setSeriesMode("existing")
            setSelectedSeriesId(novel.series.id)
            setNewSeriesName("")
        } else {
            setSeriesMode("none")
            setSelectedSeriesId("")
            setNewSeriesName("")
        }
        setStatus(novel.status)
        setDescription("")
        setGenreQuery("")
        setOriginalTitle("")
        setOriginalAuthorName("")
        setCoverUrl(novel.coverUrl || "")
        setOpenEdit(true)
        setLoadingEditData(true)

        try {
            const res = await fetch(`/api/mod/truyen/${novel.id}`)
            if (res.ok) {
                const data = await res.json()
                setDescription(data.description || "")
                setOriginalTitle(data.originalTitle || "")
                setOriginalAuthorName(data.originalAuthorName || "")
                if (data.series?.id) {
                    setSeriesMode("existing")
                    setSelectedSeriesId(data.series.id)
                    setNewSeriesName("")
                }
                if (data.genres && Array.isArray(data.genres)) {
                    setSelectedGenres(data.genres.map((g: any) => g.genreId))
                } else {
                    setSelectedGenres([])
                }
            } else {
                toast.error("Không tải được chi tiết truyện")
            }
        } catch {
            toast.error("Không tải được chi tiết truyện")
        } finally {
            setLoadingEditData(false)
        }
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingNovel || !title || !authorName) {
            toast.error("Vui lòng nhập tên truyện và tác giả")
            return
        }

        if (seriesMode === "existing" && !selectedSeriesId) {
            toast.error("Vui lòng chọn series đã có")
            return
        }

        if (seriesMode === "new" && !newSeriesName.trim()) {
            toast.error("Vui lòng nhập tên series mới")
            return
        }

        setSubmitting(true)
        try {
            const res = await fetch("/api/mod/truyen", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editingNovel.id,
                    title,
                    originalTitle,
                    authorName,
                    originalAuthorName,
                    description,
                    coverUrl,
                    genreIds: selectedGenres,
                    status: status
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Lỗi cập nhật")

            toast.success("Cập nhật truyện thành công!")
            setOpenEdit(false)
            fetchNovels()
            fetchSeries()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleDeleteSubmit = async () => {
        if (!deletingNovelId) return
        setSubmitting(true)

        try {
            const res = await fetch(`/api/mod/truyen?id=${deletingNovelId}`, {
                method: "DELETE",
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Xóa thất bại")
            }
            toast.success("Đã xóa truyện thành công")
            setOpenDelete(false)
            fetchNovels()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSubmitting(false)
        }
    }


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-card p-4 rounded-xl border shadow-sm">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <BookOpen className="h-6 w-6 text-primary" /> Quản lý truyện
                </h1>

                <div className="flex gap-3">
                    <div className="flex bg-muted rounded-md p-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 px-2 ${viewMode === 'list' ? 'bg-background shadow-sm' : ''}`}
                            onClick={() => setViewMode('list')}
                            title="Dạng danh sách"
                        >
                            <List className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 px-2 ${viewMode === 'grid' ? 'bg-background shadow-sm' : ''}`}
                            onClick={() => setViewMode('grid')}
                            title="Dạng lưới"
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                    </div>

                    <input
                        type="file"
                        id="epub-upload"
                        ref={epubInputRef}
                        accept=".epub,application/epub+zip"
                        multiple
                        className="hidden"
                        onChange={handleEpubSelect}
                        disabled={previewingEpub || uploadingEpub}
                    />
                    <input
                        type="file"
                        id="epub-folder-upload"
                        ref={epubFolderInputRef}
                        multiple
                        className="hidden"
                        onChange={handleEpubFolderSelect}
                        disabled={previewingEpub || uploadingEpub}
                        {...({ webkitdirectory: "", directory: "" } as any)}
                    />
                    <Button
                        variant="secondary"
                        className="gap-2"
                        disabled={previewingEpub || uploadingEpub}
                        onClick={() => document.getElementById('epub-upload')?.click()}
                    >
                        {previewingEpub || uploadingEpub ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {previewingEpub ? "Đang phân tích EPUB..." : uploadingEpub ? "Đang xuất bản..." : "Chọn file EPUB"}
                    </Button>
                    <Button
                        variant="outline"
                        className="gap-2"
                        disabled={previewingEpub || uploadingEpub}
                        onClick={() => document.getElementById('epub-folder-upload')?.click()}
                    >
                        <FolderOpen className="h-4 w-4" />
                        Chọn thư mục EPUB
                    </Button>

                    <Dialog
                        open={openEpubPreview}
                        onOpenChange={(open) => {
                            if (!open && !uploadingEpub) {
                                resetEpubPreviewState()
                            } else {
                                setOpenEpubPreview(open)
                            }
                        }}
                    >
                        <DialogContent className="w-[96vw] max-w-[96vw] sm:!max-w-[960px] max-h-[85vh] overflow-y-auto overflow-x-hidden">
                            <DialogHeader>
                                <DialogTitle>Xem trước truyện từ EPUB</DialogTitle>
                                <DialogDescription>
                                    Kiểm tra nội dung sẽ được import trước khi tải lên chính thức.
                                </DialogDescription>
                            </DialogHeader>

                            {epubPreviewData ? (
                                <div className="space-y-4">
                                    <div className="rounded-md border bg-muted/30 p-3 text-sm">
                                        <p><span className="font-semibold">File:</span> {epubPreviewData.fileName}</p>
                                        <p><span className="font-semibold">Số chương:</span> {epubPreviewData.novel.totalChapters}</p>
                                        {Array.isArray(epubPreviewData.novel.detectedGenres) && epubPreviewData.novel.detectedGenres.length > 0 && (
                                            <p>
                                                <span className="font-semibold">Thể loại nhận diện:</span>{" "}
                                                {epubPreviewData.novel.detectedGenres.join(", ")}
                                            </p>
                                        )}
                                        <p>
                                            <span className="font-semibold">Cover từ EPUB:</span>{" "}
                                            {epubPreviewData.hasCoverFromEpub ? "Có (sẽ tự gán làm ảnh bìa)" : "Không tìm thấy cover"}
                                        </p>
                                        <p>
                                            <span className="font-semibold">Nhận diện cấu trúc:</span>{" "}
                                            {epubPreviewData.detectedStructureType === "light_novel" ? "Theo quyển" : "Chuẩn"}
                                        </p>
                                        {epubPreviewData.parserInfo && (
                                            <>
                                                <p>
                                                    <span className="font-semibold">Parser:</span>{" "}
                                                    {epubPreviewData.parserInfo.splitMode === "regex" ? "Regex" : "TOC"}
                                                </p>
                                                <p>
                                                    <span className="font-semibold">Nguồn phân tích:</span>{" "}
                                                    {epubPreviewData.parserInfo.sourceSections} mục EPUB
                                                </p>
                                                {typeof epubPreviewData.parserInfo.chaptersDetected === "number" && (
                                                    <p>
                                                        <span className="font-semibold">Chương bắt được:</span>{" "}
                                                        {epubPreviewData.parserInfo.chaptersDetected}
                                                    </p>
                                                )}
                                                {typeof epubPreviewData.parserInfo.insertedMissingChapters === "number" && (
                                                    <p>
                                                        <span className="font-semibold">Chương thiếu đã chèn:</span>{" "}
                                                        {epubPreviewData.parserInfo.insertedMissingChapters}
                                                    </p>
                                                )}
                                                {epubPreviewData.parserInfo.chapterRegexUsed && (
                                                    <p className="break-all">
                                                        <span className="font-semibold">Regex dùng:</span>{" "}
                                                        {epubPreviewData.parserInfo.chapterRegexUsed}
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    <div className="grid gap-3 rounded-md border p-3">
                                        <p className="text-sm font-semibold">Tùy chọn parser EPUB</p>
                                        <div className="grid gap-2 md:grid-cols-2">
                                            <div className="grid gap-2">
                                                <label className="text-xs font-medium text-muted-foreground">Chế độ tách chương</label>
                                                <select
                                                    value={epubSplitMode}
                                                    onChange={(e) => setEpubSplitMode(e.target.value as "toc" | "regex")}
                                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                >
                                                    <option value="toc">Theo TOC trong EPUB</option>
                                                    <option value="regex">Theo Regex</option>
                                                </select>
                                            </div>

                                            {epubSplitMode === "regex" && (
                                                <div className="grid gap-2">
                                                    <label className="text-xs font-medium text-muted-foreground">Preset Regex</label>
                                                    <select
                                                        value={epubRegexPreset}
                                                        onChange={(e) => setEpubRegexPreset(e.target.value)}
                                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                    >
                                                        {CHAPTER_REGEX_PRESETS.map((preset) => (
                                                            <option key={preset.id} value={preset.id}>{preset.name}</option>
                                                        ))}
                                                        <option value="custom">Tự nhập regex</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        {epubSplitMode === "regex" && (
                                            <>
                                                {epubRegexPreset !== "custom" ? (
                                                    <div className="rounded-md bg-muted/40 p-2 text-xs break-all">
                                                        {CHAPTER_REGEX_PRESETS.find((preset) => preset.id === epubRegexPreset)?.pattern}
                                                    </div>
                                                ) : (
                                                    <div className="grid gap-2">
                                                        <label className="text-xs font-medium text-muted-foreground">Regex tùy chỉnh</label>
                                                        <Input
                                                            value={epubCustomRegex}
                                                            onChange={(e) => setEpubCustomRegex(e.target.value)}
                                                            placeholder="Ví dụ: ^(?:Chương|Chapter)\\s*\\d+[^\\n]*$"
                                                        />
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        <div className="flex justify-end">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={handleReparseEpub}
                                                disabled={previewingEpub || (epubSplitMode === "regex" && epubRegexPreset === "custom" && !epubCustomRegex.trim())}
                                            >
                                                {previewingEpub && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Phân tích lại theo cấu hình
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid gap-3 rounded-md border p-3">
                                        <p className="text-sm font-semibold">Chỉnh sửa nhanh metadata</p>
                                        <div className="grid gap-2">
                                            <label className="text-xs font-medium text-muted-foreground">Tên truyện</label>
                                            <Input value={epubTitle} onChange={(e) => setEpubTitle(e.target.value)} />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-xs font-medium text-muted-foreground">Tác giả</label>
                                            <Input value={epubAuthorName} onChange={(e) => setEpubAuthorName(e.target.value)} />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-xs font-medium text-muted-foreground">Mô tả</label>
                                            <Textarea value={epubDescription} onChange={(e) => setEpubDescription(e.target.value)} rows={3} />
                                        </div>
                                        <div className="grid gap-2">
                                            <label className="text-xs font-medium text-muted-foreground">Series (tùy chọn)</label>
                                            <select
                                                value={epubSeriesMode}
                                                onChange={(e) => {
                                                    const mode = e.target.value as "none" | "existing" | "new"
                                                    setEpubSeriesMode(mode)
                                                    if (mode !== "existing") setEpubSeriesId("")
                                                    if (mode === "new" && !epubSeriesName.trim()) {
                                                        setEpubSeriesName(epubTitle.trim())
                                                    }
                                                    if (mode !== "new") setEpubSeriesName("")
                                                }}
                                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            >
                                                <option value="none">Không gán series</option>
                                                <option value="existing">Thêm vào series có sẵn</option>
                                                <option value="new">Tạo series mới</option>
                                            </select>
                                        </div>

                                        {epubSeriesMode === "existing" && (
                                            <div className="grid gap-2">
                                                <label className="text-xs font-medium text-muted-foreground">Chọn series</label>
                                                <select
                                                    value={epubSeriesId}
                                                    onChange={(e) => setEpubSeriesId(e.target.value)}
                                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                >
                                                    <option value="">-- Chọn series --</option>
                                                    {seriesList.map((series) => (
                                                        <option key={series.id} value={series.id}>{series.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {epubSeriesMode === "new" && (
                                            <div className="grid gap-2">
                                                <label className="text-xs font-medium text-muted-foreground">Tên series mới</label>
                                                <Input
                                                    value={epubSeriesName}
                                                    onChange={(e) => setEpubSeriesName(e.target.value)}
                                                    placeholder="Ví dụ: Harry Potter"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <p className="mb-2 text-sm font-semibold">Danh sách chương (xem trước tối đa 20 chương đầu)</p>
                                        <div className="max-h-72 space-y-2 overflow-y-auto rounded-md border p-3 custom-scrollbar">
                                            {epubPreviewData.chaptersPreview.length === 0 ? (
                                                <p className="text-sm text-muted-foreground">Không tìm thấy chương hợp lệ trong file EPUB.</p>
                                            ) : (
                                                epubPreviewData.chaptersPreview.map((chapter) => (
                                                    <div key={chapter.number} className="rounded-md border bg-card p-2">
                                                        {(chapter.volumeTitle || chapter.volumeNumber) && (
                                                            <p className="mb-1 text-xs font-semibold text-primary">
                                                                {chapter.volumeTitle || `Quyển ${chapter.volumeNumber}`}
                                                            </p>
                                                        )}
                                                        {(() => {
                                                            const titleHasHeading = /^(?:ch(?:ương|apter)?|ch\.)\s*\d+/i.test(chapter.title)
                                                            const chapterLabel = chapter.volumeChapterNumber
                                                                ? `Chương ${chapter.volumeChapterNumber}`
                                                                : `Chương ${chapter.number}`

                                                            return (
                                                                <p className="text-sm font-medium">
                                                                    {titleHasHeading ? chapter.title : `${chapterLabel}: ${chapter.title}`}
                                                                </p>
                                                            )
                                                        })()}
                                                        {chapter.isPlaceholder && (
                                                            <p className="mt-1 text-[11px] font-semibold text-amber-600">
                                                                Placeholder chương thiếu - cần bổ sung nội dung sau
                                                            </p>
                                                        )}
                                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                                            {chapter.excerpt || "(Không có nội dung xem trước)"}
                                                        </p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-6">
                                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                </div>
                            )}

                            <DialogFooter>
                                <Button variant="outline" onClick={resetEpubPreviewState} disabled={uploadingEpub}>Huỷ</Button>
                                <Button
                                    onClick={handleConfirmEpubUpload}
                                    disabled={
                                        uploadingEpub ||
                                        !epubPreviewData ||
                                        !epubTitle.trim() ||
                                        !epubAuthorName.trim() ||
                                        (epubSeriesMode === "existing" && !epubSeriesId) ||
                                        (epubSeriesMode === "new" && !epubSeriesName.trim()) ||
                                        (epubSplitMode === "regex" && epubRegexPreset === "custom" && !epubCustomRegex.trim())
                                    }
                                >
                                    {uploadingEpub && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Xác nhận tải lên
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog
                        open={openBulkEpubImport}
                        onOpenChange={(open) => {
                            if (!open && !uploadingEpub) {
                                resetEpubPreviewState()
                            } else {
                                setOpenBulkEpubImport(open)
                            }
                        }}
                    >
                        <DialogContent className="w-[96vw] max-w-[96vw] sm:!max-w-[920px] max-h-[85vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Import nhiều EPUB vào series</DialogTitle>
                                <DialogDescription>
                                    Đã chọn {pendingEpubFiles.length} file EPUB (từ file lẻ hoặc thư mục con). Mỗi file sẽ tạo thành một truyện và được gán vào cùng series.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                    <Button type="button" variant="outline" size="sm" onClick={() => epubInputRef.current?.click()} disabled={uploadingEpub}>
                                        <Upload className="mr-1.5 h-3.5 w-3.5" />
                                        Thêm file EPUB
                                    </Button>
                                    <Button type="button" variant="outline" size="sm" onClick={() => epubFolderInputRef.current?.click()} disabled={uploadingEpub}>
                                        <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
                                        Thêm thư mục
                                    </Button>
                                </div>

                                <div className="grid gap-2 rounded-md border bg-muted/20 p-3">
                                    <label className="text-sm font-medium">Khi trùng tên truyện</label>
                                    <select
                                        value={bulkDuplicateHandling}
                                        onChange={(e) => setBulkDuplicateHandling(e.target.value as BulkDuplicateHandling)}
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        disabled={uploadingEpub}
                                    >
                                        <option value="ask">Hỏi từng file</option>
                                        <option value="replace-all">Replace tất cả file trùng tên</option>
                                        <option value="skip-all">Bỏ qua tất cả file trùng tên</option>
                                    </select>
                                    <p className="text-xs text-muted-foreground">
                                        Gợi ý: dùng "Replace tất cả" khi import lại bộ truyện cũ theo lô để không bị popup lặp.
                                    </p>
                                </div>

                                <div className="rounded-md border bg-muted/20 p-2">
                                    <div className="mb-2 flex items-center justify-between">
                                        <p className="text-xs font-medium text-muted-foreground">Tiến trình import từng file</p>
                                        <span className="text-xs text-muted-foreground">{processedBulkCount}/{bulkProgressItems.length}</span>
                                    </div>

                                    <Progress value={overallBulkProgress} className="mb-2 bg-muted/70" />

                                    <div className="max-h-44 overflow-auto pr-1 custom-scrollbar">
                                        <div className="min-w-[760px] space-y-2">
                                        {bulkProgressItems.map((item) => (
                                            <div key={item.fileKey} className="space-y-1 rounded border bg-background/70 p-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <p className="text-xs font-medium whitespace-nowrap" title={item.displayName}>{item.displayName}</p>
                                                    <span className={`shrink-0 text-[11px] font-medium ${item.status === "success"
                                                        ? "text-emerald-600"
                                                        : item.status === "failed"
                                                            ? "text-red-600"
                                                            : item.status === "skipped"
                                                                ? "text-amber-600"
                                                                : item.status === "uploading"
                                                                    ? "text-blue-600"
                                                                    : "text-muted-foreground"}`}>
                                                        {item.status === "success"
                                                            ? "Thành công"
                                                            : item.status === "failed"
                                                                ? "Thất bại"
                                                                : item.status === "skipped"
                                                                    ? "Bỏ qua"
                                                                    : item.status === "uploading"
                                                                        ? "Đang upload"
                                                                        : "Chờ"}
                                                    </span>
                                                </div>
                                                <Progress
                                                    value={item.progress}
                                                    className={item.status === "success"
                                                        ? "bg-emerald-100/50 [&>[data-slot=progress-indicator]]:bg-emerald-500"
                                                        : item.status === "failed"
                                                            ? "bg-red-100/50 [&>[data-slot=progress-indicator]]:bg-red-500"
                                                            : item.status === "skipped"
                                                                ? "bg-amber-100/50 [&>[data-slot=progress-indicator]]:bg-amber-500"
                                                                : item.status === "pending"
                                                                    ? "bg-muted [&>[data-slot=progress-indicator]]:bg-muted-foreground/40"
                                                                    : "bg-blue-100/50 [&>[data-slot=progress-indicator]]:bg-blue-500"
                                                    }
                                                />
                                                {item.message && <p className="text-[11px] text-muted-foreground">{item.message}</p>}
                                            </div>
                                        ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">Series</label>
                                    <select
                                        value={epubSeriesMode}
                                        onChange={(e) => {
                                            const mode = e.target.value as "none" | "existing" | "new"
                                            setEpubSeriesMode(mode)
                                            if (mode !== "existing") setEpubSeriesId("")
                                            if (mode === "new" && !epubSeriesName.trim()) {
                                                const fallbackTitle = pendingEpubFiles[0]?.name?.replace(/\.epub$/i, "") || ""
                                                setEpubSeriesName(fallbackTitle)
                                            }
                                            if (mode !== "new") setEpubSeriesName("")
                                        }}
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="none">Không gán series</option>
                                        <option value="existing">Thêm vào series có sẵn</option>
                                        <option value="new">Tạo series mới</option>
                                    </select>
                                </div>

                                {epubSeriesMode === "existing" && (
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Chọn series</label>
                                        <select
                                            value={epubSeriesId}
                                            onChange={(e) => setEpubSeriesId(e.target.value)}
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        >
                                            <option value="">-- Chọn series --</option>
                                            {seriesList.map((series) => (
                                                <option key={series.id} value={series.id}>{series.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {epubSeriesMode === "new" && (
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">Tên series mới</label>
                                        <Input
                                            value={epubSeriesName}
                                            onChange={(e) => setEpubSeriesName(e.target.value)}
                                            placeholder="Ví dụ: Chronicles of Narnia"
                                        />
                                    </div>
                                )}
                            </div>

                            <DialogFooter className="sticky bottom-0 bg-background pt-2">
                                <Button variant="outline" onClick={resetEpubPreviewState} disabled={uploadingEpub}>Huỷ</Button>
                                <Button
                                    onClick={handleBulkEpubUpload}
                                    disabled={
                                        uploadingEpub ||
                                        pendingEpubFiles.length === 0 ||
                                        (epubSeriesMode === "existing" && !epubSeriesId) ||
                                        (epubSeriesMode === "new" && !epubSeriesName.trim())
                                    }
                                >
                                    {uploadingEpub && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Import hàng loạt
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={openAdd} onOpenChange={(val) => {
                        setOpenAdd(val);
                        if (val) {
                                setTitle(""); setOriginalTitle(""); setAuthorName(""); setOriginalAuthorName(""); setDescription(""); setCoverUrl(""); setSeriesMode("none"); setSelectedSeriesId(""); setNewSeriesName(""); setSelectedGenres([]); setGenreQuery("");
                        }
                    }}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" /> Thêm truyện
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Thêm Truyện Mới</DialogTitle>
                                <DialogDescription>
                                    Nhập thông tin cơ bản cho đầu truyện mới của bạn.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tên truyện</label>
                                    <Input
                                        value={title}
                                        onChange={(e) => {
                                            const nextTitle = e.target.value
                                            const shouldSyncSeriesName = seriesMode === "new" && (!newSeriesName.trim() || newSeriesName === title)
                                            setTitle(nextTitle)
                                            if (shouldSyncSeriesName) {
                                                setNewSeriesName(nextTitle)
                                            }
                                        }}
                                        placeholder="Ví dụ: Phàm Nhân Tu Tiên"
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tên gốc (Tùy chọn)</label>
                                    <Input value={originalTitle} onChange={(e) => setOriginalTitle(e.target.value)} placeholder="Ví dụ: 凡人修仙传" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tác giả</label>
                                    <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Ví dụ: Vong Ngữ" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tác giả gốc (Tùy chọn)</label>
                                    <Input value={originalAuthorName} onChange={(e) => setOriginalAuthorName(e.target.value)} placeholder="Ví dụ: 忘语" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Series</label>
                                    <select
                                        value={seriesMode}
                                        onChange={(e) => {
                                            const mode = e.target.value as "none" | "existing" | "new"
                                            setSeriesMode(mode)
                                            if (mode !== "existing") setSelectedSeriesId("")
                                            if (mode === "new" && !newSeriesName.trim()) {
                                                setNewSeriesName(title.trim())
                                            }
                                            if (mode !== "new") setNewSeriesName("")
                                        }}
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    >
                                        <option value="none">Không gán series</option>
                                        <option value="existing">Chọn series có sẵn</option>
                                        <option value="new">Tạo series mới</option>
                                    </select>
                                </div>
                                {seriesMode === "existing" && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Chọn series</label>
                                        <select
                                            value={selectedSeriesId}
                                            onChange={(e) => setSelectedSeriesId(e.target.value)}
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        >
                                            <option value="">-- Chọn series --</option>
                                            {seriesList.map((series) => (
                                                <option key={series.id} value={series.id}>{series.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {seriesMode === "new" && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Tên series mới</label>
                                        <Input
                                            value={newSeriesName}
                                            onChange={(e) => setNewSeriesName(e.target.value)}
                                            placeholder="Ví dụ: Chronicles of Narnia"
                                        />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Ảnh bìa (Tùy chọn)</label>
                                    <div className="flex gap-2">
                                        <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="URL ảnh..." className="flex-1" />
                                        <input type="file" id="cover-upload-add" className="hidden" accept="image/*" onChange={handleCoverUpload} />
                                        <Button type="button" variant="secondary" onClick={() => document.getElementById('cover-upload-add')?.click()} disabled={uploadingCover}>
                                            {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                                        </Button>
                                    </div>
                                    {coverUrl && (
                                        <div className="mt-2 w-24 h-32 rounded border overflow-hidden">
                                            <img src={coverUrl} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                </div>
                                {renderGenreSelector("Thể loại")}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Giới thiệu ngắn (Mô tả)</label>
                                    <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tóm tắt về câu chuyện..." rows={4} />
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={submitting}>
                                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Hoàn thành
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Chỉnh Sửa Truyện</DialogTitle>
                                <DialogDescription>
                                    Cập nhật thông tin cho tác phẩm của bạn.
                                </DialogDescription>
                            </DialogHeader>
                            {loadingEditData ? (
                                <div className="flex-1 flex justify-center items-center py-8">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <form onSubmit={handleEditSubmit} className="space-y-4 pt-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Tên truyện</label>
                                        <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Tên gốc (Tùy chọn)</label>
                                        <Input value={originalTitle} onChange={(e) => setOriginalTitle(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Tác giả</label>
                                        <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Tác giả gốc (Tùy chọn)</label>
                                        <Input value={originalAuthorName} onChange={(e) => setOriginalAuthorName(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Series</label>
                                        <Input
                                            value={editingNovel?.series?.name || "Độc lập"}
                                            disabled
                                            className="bg-muted"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Không thể chỉnh sửa series tại màn hình sửa truyện.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Ảnh bìa (Tùy chọn)</label>
                                        <div className="flex gap-2">
                                            <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="URL ảnh..." className="flex-1" />
                                            <input type="file" id="cover-upload-edit" className="hidden" accept="image/*" onChange={handleCoverUpload} />
                                            <Button type="button" variant="secondary" onClick={() => document.getElementById('cover-upload-edit')?.click()} disabled={uploadingCover}>
                                                {uploadingCover ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                                            </Button>
                                        </div>
                                        {coverUrl && (
                                            <div className="mt-2 w-24 h-32 rounded border overflow-hidden">
                                                <img src={coverUrl} alt="Preview" className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                    </div>
                                    {renderGenreSelector("Cập nhật thể loại")}
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Trạng thái</label>
                                        <select
                                            value={status}
                                            onChange={(e) => setStatus(e.target.value)}
                                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="Đang ra">Đang ra</option>
                                            <option value="Hoàn thành">Hoàn thành</option>
                                            <option value="Tạm dừng">Tạm dừng</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Giới thiệu ngắn (Mô tả mới)</label>
                                        <Textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Để trống nếu không muốn thay đổi..."
                                            rows={4}
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setOpenEdit(false)}>Hủy</Button>
                                        <Button type="submit" disabled={submitting}>
                                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Lưu Thay Đổi
                                        </Button>
                                    </DialogFooter>
                                </form>
                            )}
                        </DialogContent>
                    </Dialog>

                    <Dialog
                        open={openDelete}
                        onOpenChange={setOpenDelete}
                    >
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="text-destructive">Cảnh báo xóa vĩnh viễn truyện</DialogTitle>
                                <DialogDescription>
                                    Hành động này sẽ xóa vĩnh viễn truyện khỏi hệ thống và xóa toàn bộ chương liên quan.
                                    Bình luận, bookmark liên quan cũng sẽ mất theo. Không thể hoàn tác.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="mt-4">
                                <Button variant="outline" onClick={() => setOpenDelete(false)}>Hủy bỏ</Button>
                                <Button variant="destructive" onClick={handleDeleteSubmit} disabled={submitting}>
                                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Xóa vĩnh viễn
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="rounded-xl border bg-card p-4 shadow-sm space-y-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="relative w-full md:max-w-md">
                        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                            placeholder="Tìm theo tên truyện, tác giả, series..."
                            className="pl-8"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={String(pageSize)}
                            onChange={(e) => {
                                const nextSize = Number(e.target.value)
                                setPageSize(nextSize)
                                setCurrentPage(1)
                            }}
                            className="h-10 rounded-md border bg-background px-3 text-sm"
                        >
                            <option value="10">10 / trang</option>
                            <option value="20">20 / trang</option>
                            <option value="30">30 / trang</option>
                            <option value="50">50 / trang</option>
                        </select>

                        <Button type="button" variant="outline" onClick={toggleSelectAllVisible}>
                            {allVisibleSelected ? "Bỏ chọn trang hiện tại" : "Chọn trang hiện tại"}
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                    <span>
                        Trang {currentPage}/{totalPages} - Hiển thị {pagedNovels.length} trên {filteredNovels.length} truyện
                    </span>
                    <div className="flex items-center gap-1">
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage <= 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage >= totalPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {selectedNovelIds.length > 0 && (
                    <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                        <p className="text-sm font-medium text-foreground">Đã chọn {selectedNovelIds.length} truyện</p>

                        <div className="flex flex-wrap items-center justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setSelectedNovelIds([])} disabled={bulkSubmitting}>
                                Bỏ chọn
                            </Button>
                            <Button type="button" variant="destructive" onClick={handleBulkDelete} disabled={bulkSubmitting}>
                                {bulkSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Xóa hàng loạt
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
                {viewMode === 'list' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                                <tr>
                                    <th scope="col" className="px-4 py-4 font-semibold text-center w-12">
                                        <input
                                            type="checkbox"
                                            checked={allVisibleSelected}
                                            onChange={toggleSelectAllVisible}
                                            className="h-4 w-4 rounded border-input"
                                        />
                                    </th>
                                    <th scope="col" className="px-5 py-4 font-semibold">Tên truyện</th>
                                    <th scope="col" className="px-5 py-4 font-semibold">Tác giả</th>
                                    <th scope="col" className="px-5 py-4 font-semibold">Series</th>
                                    <th scope="col" className="px-5 py-4 font-semibold">Số chương</th>
                                    <th scope="col" className="px-5 py-4 font-semibold">Trạng thái</th>
                                    <th scope="col" className="px-5 py-4 text-right font-semibold">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></td></tr>
                                ) : filteredNovels.length === 0 ? (
                                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Không có truyện phù hợp với từ khóa tìm kiếm.</td></tr>
                                ) : (
                                    pagedNovels.map((novel) => (
                                        <tr key={novel.id} className="border-b border-border hover:bg-muted/30 transition-colors last:border-0">
                                            <td className="px-4 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedNovelIds.includes(novel.id)}
                                                    onChange={() => toggleNovelSelection(novel.id)}
                                                    className="h-4 w-4 rounded border-input"
                                                />
                                            </td>
                                            <td className="px-5 py-4 font-medium text-foreground flex items-center gap-3">
                                                {novel.coverUrl ? (
                                                    <img src={novel.coverUrl} alt={novel.title} className="w-8 h-10 rounded bg-muted object-contain shadow-sm hidden sm:block" />
                                                ) : (
                                                    <div className="w-8 h-10 bg-muted rounded shadow-sm hidden sm:flex items-center justify-center text-muted-foreground"><BookOpen className="w-4 h-4" /></div>
                                                )}
                                                {novel.title}
                                            </td>
                                            <td className="px-5 py-4 text-muted-foreground">{novel.authorName}</td>
                                            <td className="px-5 py-4">
                                                <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${novel.series ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" : "bg-muted text-muted-foreground"}`}>
                                                    {novel.series?.name || "Độc lập"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                                    {novel.totalChapters}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${getNovelStatusBadgeClass(novel.status)}`}>
                                                    {novel.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button size="icon" variant="outline" className="h-8 w-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50" asChild>
                                                        <Link href={`/mod/chuong?novelId=${novel.id}`}>
                                                            <FileText className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button size="icon" variant="outline" className="h-8 w-8 text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => handleOpenEdit(novel)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="outline" className="h-8 w-8 text-red-600 border-red-200 hover:bg-red-50" onClick={() => {
                                                        setDeletingNovelId(novel.id)
                                                        setOpenDelete(true)
                                                    }}>
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
                ) : (
                    <div className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                        {loading ? (
                            <div className="col-span-full py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                        ) : filteredNovels.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-muted-foreground">Không có truyện phù hợp với từ khóa tìm kiếm.</div>
                        ) : (
                            pagedNovels.map((novel) => (
                                <div key={novel.id} className="group relative flex flex-col rounded-xl overflow-hidden border shadow-sm transition-all hover:-translate-y-1 hover:shadow-md bg-card">
                                    <div className="aspect-[2/3] w-full bg-muted relative border-b">
                                        <div className="absolute left-2 top-2 z-10">
                                            <input
                                                type="checkbox"
                                                checked={selectedNovelIds.includes(novel.id)}
                                                onChange={() => toggleNovelSelection(novel.id)}
                                                className="h-4 w-4 rounded border-input"
                                            />
                                        </div>
                                        {novel.coverUrl ? (
                                            <img src={novel.coverUrl} alt={novel.title} className="w-full h-full object-contain" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2">
                                                <BookOpen className="w-8 h-8 opacity-20" />
                                                <span className="text-xs opacity-50 font-medium">No Cover</span>
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2">
                                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm dark:bg-emerald-900 dark:text-emerald-300">
                                                {novel.totalChapters} Chương
                                            </span>
                                        </div>
                                        <div className="absolute left-2 top-8">
                                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shadow-sm ${getNovelStatusBadgeClass(novel.status)}`}>
                                                {novel.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="p-3 flex flex-col flex-1">
                                        <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1" title={novel.title}>{novel.title}</h3>
                                        <p className="text-xs text-muted-foreground mb-3">{novel.authorName}</p>
                                        <p className="text-[11px] mb-3">
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold ${novel.series ? "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300" : "bg-muted text-muted-foreground"}`}>
                                                {novel.series?.name || "Độc lập"}
                                            </span>
                                        </p>
                                        
                                        <div className="mt-auto grid grid-cols-3 gap-1.5">
                                            <Button size="sm" variant="outline" className="w-full h-7 text-xs px-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" asChild>
                                                <Link href={`/mod/chuong?novelId=${novel.id}`}>
                                                    <FileText className="h-3 w-3 mr-1" /> Chương
                                                </Link>
                                            </Button>
                                            <Button size="sm" variant="outline" className="w-full h-7 text-xs px-0" onClick={() => handleOpenEdit(novel)}>
                                                <Edit className="h-3 w-3 mr-1" /> Sửa
                                            </Button>
                                            <Button size="sm" variant="outline" className="w-full h-7 text-xs px-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => {
                                                setDeletingNovelId(novel.id)
                                                setOpenDelete(true)
                                            }}>
                                                <Trash2 className="h-3 w-3 mr-1" /> Xóa
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
