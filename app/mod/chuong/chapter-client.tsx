"use client"

import { useState, useEffect, Suspense, useRef } from "react"
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
import { FileText, Loader2, Plus, ArrowLeft, Wand2, Edit, Trash2, Upload, Search } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
// @ts-ignore
import * as mammoth from "mammoth"

interface Chapter {
    _id: string
    number: number
    volumeNumber?: number | null
    volumeTitle?: string | null
    volumeChapterNumber?: number | null
    title: string
    views: number
    createdAt: string
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
    const [optimizedChapters, setOptimizedChapters] = useState<Chapter[]>([])
    const [optimizeSourceChapters, setOptimizeSourceChapters] = useState<Chapter[]>([])

    // Edit states
    const [openEdit, setOpenEdit] = useState(false)
    const [editingChapterId, setEditingChapterId] = useState<string | null>(null)
    const [loadingEditData, setLoadingEditData] = useState(false)

    // Delete states
    const [openDelete, setOpenDelete] = useState(false)
    const [deletingChapterId, setDeletingChapterId] = useState<string | null>(null)


    // Form states
    const [number, setNumber] = useState("")
    const [volumeNumber, setVolumeNumber] = useState("")
    const [volumeTitle, setVolumeTitle] = useState("")
    const [volumeChapterNumber, setVolumeChapterNumber] = useState("")
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")

    // Multi-upload states
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploadingMulti, setUploadingMulti] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [totalUpload, setTotalUpload] = useState(0)

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

        const limit = 200
        let page = 1
        let total = 1
        const all: Chapter[] = []

        while (page <= total) {
            const res = await fetch(`/api/mod/chuong?novelId=${novelId}&page=${page}&limit=${limit}`)
            if (!res.ok) {
                throw new Error("Không thể tải toàn bộ chương để tối ưu")
            }

            const data = await res.json()
            all.push(...(data.chapters || []))
            total = data.totalPages || 1
            page++
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
                    volumeNumber: volumeNumber ? parseInt(volumeNumber) : null,
                    volumeTitle: volumeTitle.trim() || null,
                    volumeChapterNumber: volumeChapterNumber ? parseInt(volumeChapterNumber) : null,
                    title,
                    content,
                }),
            })

            const resData = await res.json()
            if (!res.ok) throw new Error(resData.error || "Thêm mới thất bại")

            toast.success("Đã đăng chương mới thành công!")
            setOpenAdd(false)
            setTitle("")
            setContent("")
            setVolumeNumber("")
            setVolumeTitle("")
            setVolumeChapterNumber("")
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

        if (!optRemovePrefix && !optRenumber) {
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
            const sourceById = new Map(optimizeSourceChapters.map((ch) => [ch._id, ch]))
            const updates = optimizedChapters
                .filter((ch) => {
                    const old = sourceById.get(ch._id)
                    return !!old && (old.number !== ch.number || old.title !== ch.title)
                })
                .map((ch) => ({
                    id: ch._id,
                    title: ch.title,
                    number: ch.number
                }))

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
                throw new Error(data.error || "Xóa thất bại")
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
                                <div className="grid grid-cols-6 gap-4">
                                    <div className="space-y-2 col-span-1">
                                        <label className="text-sm font-medium">Chương số</label>
                                        <Input type="number" value={number} onChange={(e) => setNumber(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2 col-span-1">
                                        <label className="text-sm font-medium">Quyển số</label>
                                        <Input type="number" value={volumeNumber} onChange={(e) => setVolumeNumber(e.target.value)} placeholder="VD: 1" />
                                    </div>
                                    <div className="space-y-2 col-span-1">
                                        <label className="text-sm font-medium">Chương trong quyển</label>
                                        <Input type="number" value={volumeChapterNumber} onChange={(e) => setVolumeChapterNumber(e.target.value)} placeholder="VD: 5" />
                                    </div>
                                    <div className="space-y-2 col-span-3">
                                        <label className="text-sm font-medium">Tên quyển (Tuỳ chọn)</label>
                                        <Input value={volumeTitle} onChange={(e) => setVolumeTitle(e.target.value)} placeholder="VD: Quyển 1 - Khởi đầu" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="space-y-2 col-span-4">
                                        <label className="text-sm font-medium">Tên chương</label>
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
                <div className="overflow-x-auto">
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
                                chapters.map((ch) => (
                                    <tr key={ch._id} className="border-b border-border hover:bg-muted/30 transition-colors last:border-0">
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
