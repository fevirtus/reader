"use client"

import { useState, useEffect, Suspense, useRef, Fragment } from "react"
import { useSearchParams } from "next/navigation"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileText, Loader2, Plus, ArrowLeft, Wand2, Edit, Trash2, Upload, Search, BookOpen } from "lucide-react"
import { toast } from "sonner"
import {
    appendEpubSplitFormFields,
    DEFAULT_EPUB_CHAPTER_TAG,
    EPUB_HTML_TAG_PRESETS,
    type EpubSplitMode,
} from "@/lib/epub-split"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
// @ts-ignore
import * as mammoth from "mammoth"

const CHAPTER_REGEX_PRESETS = [
    {
        id: "vi_chuong_hoi",
        name: "VN - Chương/Hồi/Tiết/Phần 1: ...",
        pattern: "^(?:Chương|Hồi|Tiết|Phần|Thứ|Quyển|Ch\\.)\\s*\\d+(?:\\.\\d+)?[^\\n]*$",
    },
    {
        id: "mix_chapter",
        name: "Mixed - Chương/Hồi/Chapter...",
        pattern: "^(?:Chương|Hồi|Tiết|Phần|Thứ|Quyển|Chapter|Ch\\.)\\s*\\d+(?:\\.\\d+)?[^\\n]*$",
    },
    {
        id: "numeric_only",
        name: "Chỉ có số (1. ...)",
        pattern: "^\\d+(?:\\.\\d+)?\\s*[\\.\\:\\-\\]\\)]?(?:\\s+|$)[^\\n]*$",
    },
]

interface Chapter {
    id?: string
    _id: string
    number: number
    volumeNumber?: number | null
    volumeTitle?: string | null
    volumeChapterNumber?: number | null
    title: string
    views: number
    createdAt: string
}

interface EpubPreviewData {
    preview: true
    fileName: string
    splitMode: EpubSplitMode
    detectedStructureType: "light_novel" | "standard"
    parserInfo?: {
        splitMode: string
        chapterRegexUsed?: string
        chapterTagUsed?: string
        regexPreset?: string
        sourceSections: number
        chaptersDetected: number
        chaptersFinal: number
        insertedMissingChapters: number
        detectedMaxChapterNumber: number
        detectedNumberAssignments: number
    }
    chaptersPreview: Array<{
        number: number
        title: string
        isPlaceholder: boolean
        volumeNumber?: number
        volumeTitle?: string
        volumeChapterNumber?: number
        excerpt: string
    }>
}

const generatePagination = (currentPage: number, totalPages: number) => {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    if (currentPage <= 3) {
        return [1, 2, 3, 4, '...', totalPages]
    }
    if (currentPage >= totalPages - 2) {
        return [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages]
}

function ChapterManager() {
    const searchParams = useSearchParams()
    const novelId = searchParams.get("novelId")

    const [chapters, setChapters] = useState<Chapter[]>([])
    const [loading, setLoading] = useState(true)
    const [openAdd, setOpenAdd] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalChapters, setTotalChapters] = useState(0)

    // Optimization states
    const [openOptimize, setOpenOptimize] = useState(false)
    const [previewMode, setPreviewMode] = useState(false)
    const [optimizing, setOptimizing] = useState(false)
    const [loadingOptimizeSource, setLoadingOptimizeSource] = useState(false)
    const [optRemovePrefix, setOptRemovePrefix] = useState(true)
    const [optRenumber, setOptRenumber] = useState(true)
    const [optNormalizeTitles, setOptNormalizeTitles] = useState(true)
    const [optNormalizeGenericOnly, setOptNormalizeGenericOnly] = useState(true)
    const [optimizedChapters, setOptimizedChapters] = useState<Chapter[]>([])
    const [optimizeSourceChapters, setOptimizeSourceChapters] = useState<Chapter[]>([])

    // Edit states
    const [openEdit, setOpenEdit] = useState(false)
    const [editingChapterId, setEditingChapterId] = useState<string | null>(null)
    const [loadingEditData, setLoadingEditData] = useState(false)

    // Delete states
    const [openDelete, setOpenDelete] = useState(false)
    const [deletingChapterId, setDeletingChapterId] = useState<string | null>(null)
    const [openBulkDelete, setOpenBulkDelete] = useState(false)
    const [bulkDeleteFrom, setBulkDeleteFrom] = useState("")
    const [bulkDeleteTo, setBulkDeleteTo] = useState("")
    const [bulkDeleting, setBulkDeleting] = useState(false)

    // Form states
    const [number, setNumber] = useState("")
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")

    // Multi-upload states
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploadingMulti, setUploadingMulti] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [totalUpload, setTotalUpload] = useState(0)

    // EPUB append states
    const [openEpubAppend, setOpenEpubAppend] = useState(false)
    const [epubFile, setEpubFile] = useState<File | null>(null)
    const epubInputRef = useRef<HTMLInputElement>(null)
    const [epubSplitMode, setEpubSplitMode] = useState<EpubSplitMode>("regex")
    const [epubRegexPreset, setEpubRegexPreset] = useState("vi_chuong_hoi")
    const [epubCustomRegex, setEpubCustomRegex] = useState("")
    const [epubTagPreset, setEpubTagPreset] = useState("a")
    const [epubCustomTag, setEpubCustomTag] = useState(DEFAULT_EPUB_CHAPTER_TAG)
    const [appendingEpub, setAppendingEpub] = useState(false)
    const [epubPreviewData, setEpubPreviewData] = useState<EpubPreviewData | null>(null)

    const getEpubSourceRegex = () => {
        if (epubRegexPreset === "custom") {
            return epubCustomRegex.trim()
        }
        return CHAPTER_REGEX_PRESETS.find((preset) => preset.id === epubRegexPreset)?.pattern || CHAPTER_REGEX_PRESETS[0].pattern
    }

    const getEpubSourceTag = () => {
        if (epubTagPreset === "custom") {
            return epubCustomTag.trim() || DEFAULT_EPUB_CHAPTER_TAG
        }
        return EPUB_HTML_TAG_PRESETS.find((preset) => preset.id === epubTagPreset)?.tag || DEFAULT_EPUB_CHAPTER_TAG
    }

    const handleEpubAppendPreview = async () => {
        if (!epubFile || !novelId) return

        setAppendingEpub(true)
        setEpubPreviewData(null)
        const toastId = toast.loading("Đang đọc và phân tích EPUB...")

        try {
            const formData = new FormData()
            formData.append("file", epubFile)
            appendEpubSplitFormFields(formData, epubSplitMode, {
                chapterRegex: getEpubSourceRegex(),
                chapterTag: getEpubSourceTag(),
            })
            formData.append("chapterRegexPreset", epubRegexPreset)
            formData.append("appendTargetNovelId", novelId)
            formData.append("preview", "true")

            const xhr = new XMLHttpRequest()
            const result = await new Promise<{ status: number; ok: boolean; data: any }>((resolve, reject) => {
                xhr.open("POST", "/api/mod/epub")
                xhr.timeout = 250000 
                xhr.onload = () => resolve({ status: xhr.status, ok: xhr.status >= 200 && xhr.status < 300, data: JSON.parse(xhr.responseText || "{}") })
                xhr.onerror = () => reject(new Error("Lỗi mạng khi phân tích EPUB"))
                xhr.ontimeout = () => reject(new Error("Quá thời gian chờ khi xử lý EPUB"))
                xhr.send(formData)
            })

            if (!result.ok) {
                throw new Error(result.data.error || result.data.detail || "Phân tích EPUB thất bại")
            }

            setEpubPreviewData(result.data)
            toast.success("Phân tích thành công. Vui lòng kiểm tra lại trước khi chèn.", { id: toastId })
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Lỗi khi phân tích file EPUB", { id: toastId })
        } finally {
            setAppendingEpub(false)
        }
    }

    const handleEpubAppendSubmit = async () => {
        if (!epubFile || !novelId) return

        setAppendingEpub(true)
        const toastId = toast.loading("Đang đọc và tách chương từ EPUB...")

        try {
            const formData = new FormData()
            formData.append("file", epubFile)
            appendEpubSplitFormFields(formData, epubSplitMode, {
                chapterRegex: getEpubSourceRegex(),
                chapterTag: getEpubSourceTag(),
            })
            formData.append("chapterRegexPreset", epubRegexPreset)
            formData.append("appendTargetNovelId", novelId)

            const xhr = new XMLHttpRequest()
            const result = await new Promise<{ status: number; ok: boolean; data: any }>((resolve, reject) => {
                xhr.open("POST", "/api/mod/epub")
                xhr.timeout = 250000 
                xhr.onload = () => resolve({ status: xhr.status, ok: xhr.status >= 200 && xhr.status < 300, data: JSON.parse(xhr.responseText || "{}") })
                xhr.onerror = () => reject(new Error("Lỗi mạng khi upload EPUB"))
                xhr.ontimeout = () => reject(new Error("Quá thời gian chờ khi xử lý EPUB"))
                xhr.send(formData)
            })

            if (!result.ok) {
                throw new Error(result.data.error || result.data.detail || "Nhập EPUB thất bại")
            }

            toast.success(`Nhập EPUB thành công! Đã chêm thêm ${result.data.parserInfo?.chaptersFinal || result.data.totalChapters} chương.`, { id: toastId })
            setEpubPreviewData(null)
            setOpenEpubAppend(false)
            setEpubFile(null)
            fetchChapters()
        } catch (error: any) {
            toast.error(error.message, { id: toastId })
        } finally {
            setAppendingEpub(false)
            if (epubInputRef.current) epubInputRef.current.value = ""
        }
    }

    const handleBulkDeleteSubmit = async () => {
        if (!bulkDeleteFrom || !bulkDeleteTo || !novelId) return
        setBulkDeleting(true)
        const toastId = toast.loading("Đang xóa hàng loạt chương...")
        try {
            const res = await fetch("/api/mod/chuong/bulk-delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    novelId,
                    fromNumber: Number(bulkDeleteFrom),
                    toNumber: Number(bulkDeleteTo)
                })
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || data.detail || "Xóa thất bại")
            
            toast.success(`Đã xóa thành công ${data.deletedCount} chương!`, { id: toastId })
            setOpenBulkDelete(false)
            setBulkDeleteFrom("")
            setBulkDeleteTo("")
            fetchChapters()
        } catch (error: any) {
            toast.error(error.message, { id: toastId })
        } finally {
            setBulkDeleting(false)
        }
    }

    const fetchChapters = async (pageToFetch = 1) => {
        if (!novelId) return
        setLoading(true)
        try {
            const res = await fetch(`/api/mod/chuong?novelId=${novelId}&page=${pageToFetch}&limit=50`)
            if (!res.ok) throw new Error("Lỗi fetch")
            const data = await res.json()
            setChapters(data.chapters)
            setTotalPages(data.totalPages)
            setCurrentPage(data.currentPage)
            setTotalChapters(data.totalChapters)

            if (data.chapters.length > 0) {
                setNumber((data.chapters[data.chapters.length - 1].number + 1).toString())
            } else {
                setNumber("1")
            }
        } catch {
            toast.error("Không tải được danh sách chương")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (novelId) {
            fetchChapters(currentPage)
        }
    }, [novelId, currentPage])

    const fetchAllChaptersForOptimize = async (): Promise<Chapter[]> => {
        if (!novelId) return []

        const limit = 100
        let page = 1
        let total = 1
        let expectedTotal = 0
        const all: Chapter[] = []

        while (page <= total) {
            const res = await fetch(`/api/mod/chuong?novelId=${novelId}&page=${page}&limit=${limit}`)
            if (!res.ok) {
                throw new Error("Không thể tải toàn bộ chương để tối ưu")
            }

            const data = await res.json()
            if (page === 1) {
                expectedTotal = Number(data.totalChapters || 0)
            }
            all.push(...(data.chapters || []))
            total = data.totalPages || 1
            page++
        }

        if (expectedTotal > 0 && all.length < expectedTotal) {
            throw new Error(`Chỉ tải được ${all.length}/${expectedTotal} chương. Vui lòng thử lại để tối ưu toàn bộ truyện.`)
        }

        return all.sort((a, b) => a.number - b.number)
    }

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!number || !title || !content || !novelId) {
            toast.error("Vui lòng điền đầy đủ")
            return
        }

        setSubmitting(true)
        try {
            const res = await fetch("/api/mod/chuong", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    novelId,
                    number: parseInt(number),
                    title,
                    content,
                }),
            })

            const resData = await res.json()
            if (!res.ok) throw new Error(resData.error || resData.detail || "Thêm mới thất bại")

            toast.success("Đã đăng chương mới thành công!")
            setOpenAdd(false)
            setTitle("")
            setContent("")
            setNumber((parseInt(number) + 1).toString())
            fetchChapters()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleMultiFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        if (files.length === 0 || !novelId) return

        setUploadingMulti(true)
        setTotalUpload(files.length)
        setUploadProgress(0)

        // Sort files by name to ensure order (e.g. Chapter 1, Chapter 2)
        files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }))

        try {
            let currentNumber = parseInt(number) || 1
            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                let content = ""
                if (file.name.endsWith(".txt")) {
                    content = await file.text()
                } else if (file.name.endsWith(".docx")) {
                    const arrayBuffer = await file.arrayBuffer()
                    const result = await mammoth.extractRawText({ arrayBuffer })
                    content = result.value
                } else {
                    continue
                }

                if (!content.trim()) continue // Bỏ qua file rỗng

                let fileTitle = file.name.replace(/\.[^/.]+$/, "")
                
                // Loại bỏ "Chương X: " khỏi file title nếu cần thiết
                let cleanedTitle = fileTitle.replace(/^(Chương|Ch\.)\s*\d+\s*[:-]?\s*/i, "")
                if (!cleanedTitle) cleanedTitle = fileTitle
                
                const res = await fetch("/api/mod/chuong", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ novelId, number: currentNumber, title: cleanedTitle, content }),
                })

                if (!res.ok) {
                    const data = await res.json()
                    throw new Error(data.error || `Lỗi khi lưu file ${file.name}`)
                }

                currentNumber++
                setUploadProgress(i + 1)
            }

            toast.success(`Đã tải lên thành công ${files.length} chương!`)
            fetchChapters()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setUploadingMulti(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const handlePreviewOptimize = async () => {
        if (!novelId) return

        if (!optRemovePrefix && !optRenumber && !optNormalizeTitles) {
            toast.error("Vui lòng chọn ít nhất một tùy chọn tối ưu hóa")
            return
        }

        setLoadingOptimizeSource(true)

        try {
            const allChapters = await fetchAllChaptersForOptimize()
            if (allChapters.length === 0) {
                toast.info("Truyện này chưa có chương để tối ưu")
                return
            }

            setOptimizeSourceChapters(allChapters)
            let newChapters = [...allChapters]

            if (optNormalizeTitles) {
                const previewRes = await fetch("/api/mod/chuong/normalize-titles/preview", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        novelId,
                        overwriteGenericOnly: optNormalizeGenericOnly,
                    }),
                })
                const previewData = await previewRes.json().catch(() => ({}))
                if (!previewRes.ok) {
                    throw new Error(previewData.detail || previewData.error || "Không thể tạo gợi ý tiêu đề chương")
                }
                const titleById = new Map<string, string>(
                    (previewData.items || []).map((item: { id: string; suggestedTitle: string }) => [
                        item.id,
                        item.suggestedTitle,
                    ]),
                )
                newChapters = newChapters.map((ch) => {
                    const key = ch._id || ch.id
                    const suggested = key ? titleById.get(key) : undefined
                    return suggested ? { ...ch, title: suggested } : ch
                })
                const changeCount = Number(previewData.changeCount || 0)
                if (changeCount === 0) {
                    toast.info("Không tìm thấy tiêu đề chương nào cần chuẩn hóa theo bộ lọc hiện tại")
                }
            }

            if (optRenumber) {
                newChapters.sort((a, b) => a.number - b.number)
                newChapters = newChapters.map((ch, idx) => ({
                    ...ch,
                    number: idx + 1
                }))
            }

            if (optRemovePrefix) {
                newChapters = newChapters.map((ch) => {
                    let newTitle = ch.title.replace(/^(Chương|Ch\.)\s*\d+\s*[:-]?\s*/i, "")
                    if (!newTitle) newTitle = `Chương ${ch.number}`
                    return { ...ch, title: newTitle }
                })
            }

            setOptimizedChapters(newChapters)
            setPreviewMode(true)
            toast.success(`Đã tạo xem trước cho toàn bộ ${newChapters.length} chương`)
        } catch (error: any) {
            toast.error(error.message || "Không thể tạo bản xem trước")
        } finally {
            setLoadingOptimizeSource(false)
        }
    }

    const handleApplyOptimize = async () => {
        if (optimizedChapters.length === 0) return
        setOptimizing(true)
        try {
            const sourceById = new Map(
                optimizeSourceChapters
                    .map((ch) => {
                        const key = ch._id || ch.id
                        return key ? [key, ch] : null
                    })
                    .filter((row): row is [string, Chapter] => !!row)
            )
            const updates = optimizedChapters
                .filter((ch) => {
                    const key = ch._id || ch.id
                    if (!key) return false
                    const old = sourceById.get(key)
                    return !!old && (old.number !== ch.number || old.title !== ch.title)
                })
                .map((ch) => ({
                    id: ch._id || ch.id,
                    title: ch.title,
                    number: ch.number
                }))
                .filter((item): item is { id: string; title: string; number: number } => !!item.id)

            if (updates.length === 0) {
                toast.info("Không có thay đổi nào cần lưu")
                setOptimizing(false)
                return
            }

            const res = await fetch("/api/mod/chuong/optimize", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ novelId, updates }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Lỗi tối ưu hóa")

            toast.success(`Đã tối ưu ${data.modifiedCount} chương trên toàn bộ truyện!`)
            setOpenOptimize(false)
            setPreviewMode(false)
            setOptimizedChapters([])
            setOptimizeSourceChapters([])
            fetchChapters(currentPage)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setOptimizing(false)
        }
    }


    // handleOpenEdit has been removed because edit is now via dedicated page

    // handleDelete remains the same
    const handleDelete = async () => {
        if (!deletingChapterId || !novelId) return
        setSubmitting(true)
        try {
            const res = await fetch(`/api/mod/chuong?id=${deletingChapterId}&novelId=${novelId}`, {
                method: "DELETE",
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || data.detail || "Xóa thất bại")
            }
            toast.success("Đã xóa chương thành công")
            setOpenDelete(false)
            fetchChapters()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSubmitting(false)
        }
    }




    if (!novelId) {
        return (
            <div className="text-center py-20 text-muted-foreground">
                Vui lòng chọn một truyện từ mục Quản lý truyện để xem danh sách chương.
                <br />
                <Link href="/mod/truyen">
                    <Button variant="link" className="mt-4"><ArrowLeft className="mr-2 h-4 w-4" /> Quay lại Quản lý truyện</Button>
                </Link>
            </div>
        )
    }

    const optimizeSourceMap = new Map(optimizeSourceChapters.map((source) => [source._id, source]))

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-card p-4 rounded-xl border shadow-sm">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <FileText className="h-6 w-6 text-primary" /> Quản lý chương
                </h1>

                <div className="flex gap-3">

                    <Button variant="secondary" className="gap-2" onClick={() => {
                        setOpenOptimize(true)
                        setPreviewMode(false)
                        setOptimizedChapters([])
                        setOptimizeSourceChapters([])
                    }} disabled={chapters.length === 0}>
                        <Wand2 className="h-4 w-4" /> Tối ưu hóa
                    </Button>

                    <Button variant="destructive" className="gap-2" onClick={() => setOpenBulkDelete(true)} disabled={chapters.length === 0}>
                        <Trash2 className="h-4 w-4" /> Xóa theo khoảng
                    </Button>

                    <input 
                        type="file" 
                        ref={epubInputRef} 
                        onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                                setEpubPreviewData(null)
                                setEpubSplitMode("regex")
                                setEpubFile(file)
                                setOpenEpubAppend(true)
                            }
                            if (e.target) e.target.value = ""
                        }} 
                        accept=".epub" 
                        className="hidden" 
                    />
                    <Button variant="secondary" className="gap-2" onClick={() => epubInputRef.current?.click()}>
                        <BookOpen className="h-4 w-4" /> Nhập từ EPUB
                    </Button>

                    <Dialog open={openEpubAppend} onOpenChange={(val) => {
                        setOpenEpubAppend(val)
                        if (!val) {
                            setEpubPreviewData(null)
                            if (epubInputRef.current) epubInputRef.current.value = ""
                        }
                    }}>
                        <DialogContent className="sm:max-w-[750px] max-h-[90vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle>Bổ sung chương từ file EPUB</DialogTitle>
                                <DialogDescription>
                                    Đọc và trích xuất hàng loạt chương từ file EPUB vào truyện này.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6 pt-4 flex-1 overflow-y-auto pr-2 pb-4">
                                <div className="space-y-2 rounded-md border p-4 bg-muted/50">
                                    <h3 className="font-semibold text-sm">Chế độ ghi đè thông minh (Smart Merge Overwrite)</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Hệ thống sẽ tự động ghép nối các dải chương. Những chương thiếu sẽ được điền khuyết (Insert), những chương mới sẽ được chêm vào. Các chương có cùng số thứ tự sẽ bị <strong>Ghi đè</strong> bằng nội dung lấy từ EPUB để đảm bảo độ chính xác.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="font-semibold text-sm border-b pb-2">Giải Thuật Tách Chương</h3>
                                    <div className="flex items-center gap-4">
                                        <Label className="w-1/4">Phiên bản Text</Label>
                                        <RadioGroup value={epubSplitMode} onValueChange={(v: EpubSplitMode) => {
                                            setEpubSplitMode(v)
                                            setEpubPreviewData(null)
                                        }} className="flex flex-wrap items-center gap-4">
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="toc" id="toc_mode_a" />
                                                <Label htmlFor="toc_mode_a" className="cursor-pointer font-normal">Mục lục (TOC)</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="regex" id="regex_mode_a" />
                                                <Label htmlFor="regex_mode_a" className="cursor-pointer font-normal">Quy tắc (Regex)</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="tag" id="tag_mode_a" />
                                                <Label htmlFor="tag_mode_a" className="cursor-pointer font-normal">Thẻ HTML</Label>
                                            </div>
                                        </RadioGroup>
                                    </div>

                                    {epubSplitMode === "tag" && (
                                        <div className="space-y-3 pt-2">
                                            <div className="flex flex-col gap-2">
                                                <Label>Thẻ HTML tách chương</Label>
                                                <Select value={epubTagPreset} onValueChange={(v) => {
                                                    setEpubTagPreset(v)
                                                    setEpubPreviewData(null)
                                                }}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {EPUB_HTML_TAG_PRESETS.map((preset) => (
                                                            <SelectItem key={preset.id} value={preset.id}>
                                                                {preset.name}
                                                            </SelectItem>
                                                        ))}
                                                        <SelectItem value="custom">Tùy chỉnh tên thẻ...</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {epubTagPreset === "custom" && (
                                                <div className="flex flex-col gap-2">
                                                    <Label>Tên thẻ (ví dụ: a, h2)</Label>
                                                    <Input
                                                        value={epubCustomTag}
                                                        onChange={(e) => {
                                                            setEpubCustomTag(e.target.value)
                                                            setEpubPreviewData(null)
                                                        }}
                                                        placeholder="a"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {epubSplitMode === "regex" && (
                                        <div className="space-y-3 pt-2">
                                            <div className="flex flex-col gap-2">
                                                <Label>Mẫu Regex có sẵn</Label>
                                                <Select value={epubRegexPreset} onValueChange={(v) => {
                                                    setEpubRegexPreset(v)
                                                    setEpubPreviewData(null)
                                                }}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {CHAPTER_REGEX_PRESETS.map((preset) => (
                                                            <SelectItem key={preset.id} value={preset.id}>
                                                                {preset.name}
                                                            </SelectItem>
                                                        ))}
                                                        <SelectItem value="custom">Nâng cao (Tùy chỉnh Regex)...</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {epubRegexPreset === "custom" && (
                                                <div className="flex flex-col gap-2">
                                                    <Label>Regex Tùy Chỉnh</Label>
                                                    <Input
                                                        value={epubCustomRegex}
                                                        onChange={(e) => {
                                                            setEpubCustomRegex(e.target.value)
                                                            setEpubPreviewData(null)
                                                        }}
                                                        placeholder="Vd: /^(Chương|Hồi) \d+/gm"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {epubPreviewData && epubPreviewData.parserInfo && (
                                    <div className="space-y-4 border-t pt-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="font-semibold text-sm">Kết quả trích xuất dự kiến (30 mục đầu)</h3>
                                            <div className="text-xs space-y-1 text-right">
                                                <p><span className="text-muted-foreground">Flow file HTML:</span> {epubPreviewData.parserInfo.sourceSections}</p>
                                                <p><span className="text-muted-foreground">Phát hiện:</span> {epubPreviewData.parserInfo.chaptersDetected} chương</p>
                                                {epubPreviewData.parserInfo.chapterTagUsed && (
                                                    <p><span className="text-muted-foreground">Thẻ HTML:</span> &lt;{epubPreviewData.parserInfo.chapterTagUsed}&gt;</p>
                                                )}
                                            </div>
                                        </div>

                                        {epubPreviewData.chaptersPreview.length === 0 ? (
                                            <div className="p-4 text-center border border-dashed rounded bg-muted/40 text-muted-foreground text-sm">
                                                Không tách được chương nào. Xem lại chế độ tách (TOC / Regex / Thẻ HTML).
                                            </div>
                                        ) : (
                                            <div className="space-y-3 max-h-[300px] overflow-y-auto border rounded-md p-2 bg-card">
                                                {epubPreviewData.chaptersPreview.map((chapter) => (
                                                    <div key={`preview-${chapter.number}`} className="flex border rounded overflow-hidden shadow-sm text-sm">
                                                        <div className="w-16 bg-muted border-r flex flex-col justify-center items-center shrink-0">
                                                            <span className="text-xs text-muted-foreground">Ch.</span>
                                                            <span className="font-semibold">{chapter.number}</span>
                                                        </div>
                                                        <div className="p-3 flex-1 min-w-0">
                                                            <h4 className="font-semibold mb-1 truncate text-foreground flex items-center gap-2">
                                                                {chapter.title} 
                                                                {chapter.isPlaceholder && (
                                                                    <span className="bg-destructive/10 text-destructive text-[10px] px-1.5 py-0.5 rounded uppercase font-bold">Lỗi tách chờ XL</span>
                                                                )}
                                                            </h4>
                                                            <p className="text-xs text-muted-foreground line-clamp-2">{chapter.excerpt}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            <DialogFooter className="mt-auto pt-4 border-t">
                                <Button variant="outline" onClick={() => setOpenEpubAppend(false)} disabled={appendingEpub}>Huỷ</Button>
                                {!epubPreviewData ? (
                                    <Button onClick={handleEpubAppendPreview} disabled={appendingEpub || (epubSplitMode === "regex" && epubRegexPreset === "custom" && !epubCustomRegex.trim()) || (epubSplitMode === "tag" && epubTagPreset === "custom" && !epubCustomTag.trim())}>
                                        {appendingEpub && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Xem trước dữ liệu
                                    </Button>
                                ) : (
                                    <Button onClick={handleEpubAppendSubmit} disabled={appendingEpub || epubPreviewData.chaptersPreview.length === 0}>
                                        {appendingEpub && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Xác nhận ghi đè
                                    </Button>
                                )}
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleMultiFileUpload} 
                        multiple 
                        accept=".txt,.docx" 
                        className="hidden" 
                    />
                    <Button variant="secondary" className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={uploadingMulti}>
                        {uploadingMulti ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        {uploadingMulti ? `Đang tải lên ${uploadProgress}/${totalUpload}...` : "Tải lên hàng loạt"}
                    </Button>

                    <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" /> Đăng chương mới
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle>Đăng Chương Mới</DialogTitle>
                                <DialogDescription>
                                    Thêm nội dung một chương truyện để gửi đến độc giả.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleAddSubmit} className="flex flex-col gap-4 pt-4 flex-1 h-full overflow-hidden">
                                <div className="grid grid-cols-6 gap-4 border-b pb-4">
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-sm font-medium text-primary">Chương số</label>
                                        <Input type="number" step="any" value={number} onChange={(e) => setNumber(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2 col-span-4">
                                        <label className="text-sm font-medium text-primary">Tên chương</label>
                                        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: Thiếu niên kỳ bạt" required autoFocus />
                                    </div>
                                </div>
                                <div className="space-y-2 flex-1 flex flex-col h-full">
                                    <label className="text-sm font-medium">Nội dung văn bản (Hỗ trợ xuống dòng)</label>
                                    <Textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        className="flex-1 w-full p-4 resize-none min-h-[300px]"
                                        placeholder="Paste văn bản của chương vào đây..."
                                        required
                                    />
                                </div>
                                <DialogFooter className="mt-auto pt-4">
                                    <Button type="submit" disabled={submitting}>
                                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Đăng ngay
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={openBulkDelete} onOpenChange={setOpenBulkDelete}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="text-destructive flex items-center gap-2">
                                    <Trash2 className="h-5 w-5" /> Xóa hàng loạt chương
                                </DialogTitle>
                                <DialogDescription>
                                    Cẩn thận! Thao tác này sẽ xóa vĩnh viễn các chương nằm trong khoảng bạn chọn. Không thể khôi phục!
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Từ chương số</Label>
                                        <Input type="number" value={bulkDeleteFrom} onChange={(e) => setBulkDeleteFrom(e.target.value)} placeholder="Ví dụ: 10" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Đến chương số</Label>
                                        <Input type="number" value={bulkDeleteTo} onChange={(e) => setBulkDeleteTo(e.target.value)} placeholder="Ví dụ: 20" />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setOpenBulkDelete(false)} disabled={bulkDeleting}>Huỷ</Button>
                                <Button variant="destructive" onClick={handleBulkDeleteSubmit} disabled={bulkDeleting || !bulkDeleteFrom || !bulkDeleteTo}>
                                    {bulkDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Xác nhận Xóa
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={openDelete} onOpenChange={setOpenDelete}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="text-destructive">Xác nhận xóa chương</DialogTitle>
                                <DialogDescription>
                                    Hành động này không thể hoàn tác. Chương này sẽ bị xóa vĩnh viễn khỏi cơ sở dữ liệu.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="mt-4">
                                <Button variant="outline" onClick={() => setOpenDelete(false)}>Hủy bỏ</Button>
                                <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
                                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Tiếp tục xóa
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog
                        open={openOptimize}
                        onOpenChange={(nextOpen) => {
                            setOpenOptimize(nextOpen)
                            if (!nextOpen) {
                                setPreviewMode(false)
                                setOptimizedChapters([])
                                setOptimizeSourceChapters([])
                                setLoadingOptimizeSource(false)
                            }
                        }}
                    >
                        <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle>Tối Ưu Hóa Chương Hàng Loạt</DialogTitle>
                                <DialogDescription>
                                    Công cụ sẽ áp dụng trên toàn bộ chương của truyện hiện tại, không chỉ page bạn đang xem.
                                </DialogDescription>
                            </DialogHeader>

                            {!previewMode ? (
                                <div className="flex flex-col gap-4 py-4 flex-1">
                                    <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                        <input type="checkbox" className="w-5 h-5 rounded" checked={optRemovePrefix} onChange={(e) => setOptRemovePrefix(e.target.checked)} />
                                        <div>
                                            <p className="font-medium text-base">Xóa tiền tố "Chương X:" dư thừa</p>
                                            <p className="text-sm text-muted-foreground mt-1">Ví dụ: <span className="line-through">Chương 1: Bắt đầu</span> sẽ thành <strong>Bắt đầu</strong></p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                        <input type="checkbox" className="w-5 h-5 rounded" checked={optRenumber} onChange={(e) => setOptRenumber(e.target.checked)} />
                                        <div>
                                            <p className="font-medium text-base">Đánh lại số thứ tự tự động</p>
                                            <p className="text-sm text-muted-foreground mt-1">Sắp xếp và gán lại số chương liên tục từ 1 đến N để sửa lỗi nhảy cóc</p>
                                        </div>
                                    </label>
                                    <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                                        <input type="checkbox" className="w-5 h-5 rounded" checked={optNormalizeTitles} onChange={(e) => setOptNormalizeTitles(e.target.checked)} />
                                        <div>
                                            <p className="font-medium text-base">Chuẩn hóa tiêu đề từ nội dung đầu chương</p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Ví dụ: dòng <span className="line-through">Chương 8</span> + dòng <strong>Tất Cả Đều Là Ảo Giác</strong> → tiêu đề <strong>Tất Cả Đều Là Ảo Giác</strong>
                                            </p>
                                            {optNormalizeTitles && (
                                                <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 rounded"
                                                        checked={optNormalizeGenericOnly}
                                                        onChange={(e) => setOptNormalizeGenericOnly(e.target.checked)}
                                                    />
                                                    Chỉ sửa tiêu đề dạng &quot;Chương N&quot; (giữ tiêu đề đã đặt tay)
                                                </label>
                                            )}
                                        </div>
                                    </label>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-auto border rounded-lg my-4 custom-scrollbar">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted sticky top-0 shadow-sm">
                                            <tr>
                                                <th className="px-4 py-3 w-1/2 border-r">Nội dung gốc (Hiện tại)</th>
                                                <th className="px-4 py-3 w-1/2">Xem trước kết quả (Mới)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                            {optimizedChapters.map((newCh) => {
                                                const oldCh = optimizeSourceMap.get(newCh._id) || newCh
                                                return (
                                                    <tr key={newCh._id} className="hover:bg-muted/20">
                                                        <td className="px-4 py-3 border-r text-muted-foreground">
                                                            <span className="font-mono text-xs mr-2 inline-block w-8 text-right">#{oldCh.number}</span>
                                                            <span className={oldCh.title !== newCh.title ? "line-through opacity-70" : ""}>{oldCh.title}</span>
                                                        </td>
                                                        <td className="px-4 py-3 text-foreground font-medium">
                                                            <span className="font-mono text-xs mr-2 text-primary inline-block w-8 text-right">#{newCh.number}</span>
                                                            <span className={oldCh.title !== newCh.title ? "text-primary" : ""}>{newCh.title}</span>
                                                        </td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <DialogFooter className="mt-auto pt-2">
                                <Button variant="outline" onClick={() => setOpenOptimize(false)}>Hủy bỏ</Button>
                                {!previewMode ? (
                                    <Button onClick={handlePreviewOptimize} disabled={loadingOptimizeSource}>
                                        {loadingOptimizeSource && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Kiểm tra toàn bộ truyện
                                    </Button>
                                ) : (
                                    <>
                                        <Button variant="secondary" onClick={() => setPreviewMode(false)} disabled={optimizing || loadingOptimizeSource}>Quay lại Option</Button>
                                        <Button onClick={handleApplyOptimize} disabled={optimizing}>
                                            {optimizing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Lưu thay đổi vào DB
                                        </Button>
                                    </>
                                )}
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                </div>
            </div>

            <div className="rounded-xl border bg-card shadow-sm">
                <div className="overflow-x-auto overflow-y-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                            <tr>
                                <th scope="col" className="px-5 py-4 font-semibold w-24">Chương</th>
                                <th scope="col" className="px-5 py-4 font-semibold">Quyển</th>
                                <th scope="col" className="px-5 py-4 font-semibold">Tên chương</th>
                                <th scope="col" className="px-5 py-4 font-semibold text-right">Lượt đọc</th>
                                <th scope="col" className="px-5 py-4 text-right font-semibold">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></td></tr>
                            ) : chapters.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Chưa có chương nào được đăng.</td></tr>
                            ) : (
                                chapters.map((ch, index) => (
                                    <Fragment key={ch._id}>
                                        <tr className="border-b border-border hover:bg-muted/30 transition-colors last:border-0 relative group">
                                            <td className="px-5 py-4 font-medium text-foreground">Chương {ch.number}</td>
                                            <td className="px-5 py-4 text-muted-foreground">
                                                {ch.volumeNumber || ch.volumeTitle
                                                    ? `${ch.volumeTitle || `Quyển ${ch.volumeNumber}`}${ch.volumeChapterNumber ? ` · Ch.${ch.volumeChapterNumber}` : ""}`
                                                    : "-"}
                                            </td>
                                            <td className="px-5 py-4 text-muted-foreground">{ch.title}</td>
                                            <td className="px-5 py-4 text-right">{ch.views}</td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/mod/chuong/${ch._id}`}>
                                                        <Button size="sm" variant="outline" className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                                            <Edit className="w-4 h-4 mr-1" /> Sửa
                                                        </Button>
                                                    </Link>
                                                    <Button size="sm" variant="outline" className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => {
                                                        setDeletingChapterId(ch._id)
                                                        setOpenDelete(true)
                                                    }}>
                                                        <Trash2 className="w-4 h-4 mr-1" /> Xóa
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                        <tr className="group/insert">
                                            <td colSpan={5} className="p-0 border-none relative">
                                                <div className="h-2 flex items-center justify-center opacity-0 group-hover/insert:opacity-100 transition-opacity -my-1 z-10">
                                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-dashed border-primary/50"></div></div>
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline" 
                                                        className="h-6 rounded-full px-2 text-primary relative z-20 bg-background hover:bg-primary hover:text-primary-foreground text-xs" 
                                                        onClick={() => {
                                                            const nextCh = chapters[index + 1]
                                                            let suggestedNum = ch.number + 1 
                                                            if (nextCh && nextCh.number <= ch.number + 1) {
                                                                suggestedNum = Number((ch.number + 0.1).toFixed(2))
                                                            }
                                                            setNumber(suggestedNum.toString())
                                                            setTitle("")
                                                            setContent("")
                                                            setOpenAdd(true)
                                                        }}
                                                    >
                                                        <Plus className="w-3 h-3 mr-1" /> Chèn chương ở đây
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    </Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="border-t p-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/20">
                        <div className="text-sm text-muted-foreground">
                            Trang <span className="font-medium text-foreground">{currentPage}</span> / {totalPages} (Tổng {totalChapters} chương)
                        </div>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage <= 1 || loading}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            >
                                Trước
                            </Button>

                            {generatePagination(currentPage, totalPages).map((p, i) => (
                                <div key={i} className="hidden sm:block">
                                    {p === '...' ? (
                                        <span className="px-2 text-muted-foreground">...</span>
                                    ) : (
                                        <Button
                                            variant={currentPage === p ? "default" : "outline"}
                                            size="sm"
                                            className="w-8 h-8 p-0"
                                            disabled={loading}
                                            onClick={() => setCurrentPage(p as number)}
                                        >
                                            {p}
                                        </Button>
                                    )}
                                </div>
                            ))}

                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage >= totalPages || loading}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            >
                                Sau
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export function ChapterClient() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>}>
            <ChapterManager />
        </Suspense>
    )
}
