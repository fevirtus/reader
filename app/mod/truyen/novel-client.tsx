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
import { BookOpen, Loader2, Plus, Upload, Edit, Trash2, LayoutGrid, List, Image as ImageIcon, Search, FileText } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { getNovelStatusBadgeClass } from "@/lib/novel-status"

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
    const [newGenreName, setNewGenreName] = useState("")
    const [addingGenre, setAddingGenre] = useState(false)

    // Delete states
    const [openDelete, setOpenDelete] = useState(false)
    const [deletingNovelId, setDeletingNovelId] = useState<string | null>(null)

    // Bulk states
    const [searchKeyword, setSearchKeyword] = useState("")
    const [selectedNovelIds, setSelectedNovelIds] = useState<string[]>([])
    const [bulkSubmitting, setBulkSubmitting] = useState(false)

    const getSelectedChapterRegex = () => {
        if (epubRegexPreset === "custom") {
            return epubCustomRegex.trim()
        }

        return CHAPTER_REGEX_PRESETS.find((preset) => preset.id === epubRegexPreset)?.pattern || CHAPTER_REGEX_PRESETS[0].pattern
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

    const visibleNovelIds = useMemo(() => filteredNovels.map((novel) => novel.id), [filteredNovels])
    const allVisibleSelected = visibleNovelIds.length > 0 && visibleNovelIds.every((id) => selectedNovelIds.includes(id))

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
        if (!newGenreName.trim()) return
        setAddingGenre(true)
        try {
            const res = await fetch("/api/mod/the-loai", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newGenreName, description: "" })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Thêm lỗi")

            toast.success("Thêm thể loại thành công")
            setNewGenreName("")
            fetchGenres()
            setSelectedGenres(prev => [...prev, data.id])
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
        } catch (error: any) {
            toast.error(error.message)
        }
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
        const files = Array.from(e.target.files || [])
        if (files.length === 0) return

        if (files.some((file) => !file.name.endsWith('.epub'))) {
            toast.error("Vui lòng chọn file định dạng .epub")
            e.target.value = "" // Reset input
            return
        }

        if (files.length > 1) {
            setPendingEpubFiles(files)
            setOpenBulkEpubImport(true)
            e.target.value = ""
            return
        }

        const file = files[0]

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
            const res = await fetch("/api/mod/epub", {
                method: "POST",
                body: formData,
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Lỗi khi tải lên EPUB")
            }

            toast.success("Đã tải lên EPUB thành công")
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
        let success = 0
        let failed = 0

        try {
            for (const file of pendingEpubFiles) {
                const formData = new FormData()
                formData.append("file", file)
                formData.append("seriesMode", epubSeriesMode)
                if (epubSeriesMode === "existing") formData.append("seriesId", epubSeriesId)
                if (epubSeriesMode === "new") formData.append("seriesName", epubSeriesName.trim())
                formData.append("splitMode", "toc")

                const res = await fetch("/api/mod/epub", {
                    method: "POST",
                    body: formData,
                })

                if (res.ok) success += 1
                else failed += 1
            }

            if (success > 0 && failed === 0) {
                toast.success(`Đã import ${success} file EPUB vào series thành công`)
            } else if (success > 0) {
                toast.warning(`Import thành công ${success} file, thất bại ${failed} file`)
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
                    <Button
                        variant="secondary"
                        className="gap-2"
                        disabled={previewingEpub || uploadingEpub}
                        onClick={() => document.getElementById('epub-upload')?.click()}
                    >
                        {previewingEpub || uploadingEpub ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {previewingEpub ? "Đang phân tích EPUB..." : uploadingEpub ? "Đang xuất bản..." : "Tải lên EPUB"}
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
                        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
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
                                                        <p className="text-sm font-medium">
                                                            {chapter.volumeChapterNumber
                                                                ? `Chương ${chapter.volumeChapterNumber}`
                                                                : `Chương ${chapter.number}`}
                                                            : {chapter.title}
                                                        </p>
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
                        <DialogContent className="sm:max-w-[560px]">
                            <DialogHeader>
                                <DialogTitle>Import nhiều EPUB vào series</DialogTitle>
                                <DialogDescription>
                                    Đã chọn {pendingEpubFiles.length} file EPUB. Mỗi file sẽ tạo thành một truyện và được gán vào cùng series.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3">
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

                            <DialogFooter>
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
                                setTitle(""); setOriginalTitle(""); setAuthorName(""); setOriginalAuthorName(""); setDescription(""); setCoverUrl(""); setSeriesMode("none"); setSelectedSeriesId(""); setNewSeriesName(""); setSelectedGenres([]); setNewGenreName("");
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
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Thêm thể loại</label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Tên thể loại mới..."
                                            value={newGenreName}
                                            onChange={(e) => setNewGenreName(e.target.value)}
                                            className="flex-1"
                                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddGenre(); } }}
                                        />
                                        <Button type="button" variant="secondary" onClick={handleAddGenre} disabled={addingGenre || !newGenreName.trim()}>
                                            {addingGenre ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tạo"}
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto p-2 border rounded-md custom-scrollbar bg-card">
                                        {genres.map(genre => (
                                            <div
                                                key={genre.id}
                                                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border transition-colors select-none ${selectedGenres.includes(genre.id) ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-muted/50 text-muted-foreground'}`}
                                            >
                                                <span className="cursor-pointer" onClick={() => toggleGenre(genre.id)}>{genre.name}</span>
                                                <div
                                                    className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5 ml-1 inline-flex items-center justify-center transition-colors"
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteGenre(genre.id, genre.name); }}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </div>
                                            </div>
                                        ))}
                                        {genres.length === 0 && <span className="text-xs text-muted-foreground p-1">Chưa có thể loại nào</span>}
                                    </div>
                                </div>
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
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Cập nhật thể loại</label>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="Tên thể loại mới..."
                                                value={newGenreName}
                                                onChange={(e) => setNewGenreName(e.target.value)}
                                                className="flex-1"
                                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddGenre(); } }}
                                            />
                                            <Button type="button" variant="secondary" onClick={handleAddGenre} disabled={addingGenre || !newGenreName.trim()}>
                                                {addingGenre ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tạo"}
                                            </Button>
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-2 max-h-32 overflow-y-auto p-2 border rounded-md custom-scrollbar bg-card">
                                            {genres.map(genre => (
                                                <div
                                                    key={genre.id}
                                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border transition-colors select-none ${selectedGenres.includes(genre.id) ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-muted/50 text-muted-foreground'}`}
                                                >
                                                    <span className="cursor-pointer" onClick={() => toggleGenre(genre.id)}>{genre.name}</span>
                                                    <div
                                                        className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground rounded-full p-0.5 ml-1 inline-flex items-center justify-center transition-colors"
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteGenre(genre.id, genre.name); }}
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
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

                    <Button type="button" variant="outline" onClick={toggleSelectAllVisible}>
                        {allVisibleSelected ? "Bỏ chọn danh sách đang lọc" : "Chọn danh sách đang lọc"}
                    </Button>
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
                                    filteredNovels.map((novel) => (
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
                            filteredNovels.map((novel) => (
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
