"use client"

import { useState, useEffect, Suspense } from "react"
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
import { FileText, Loader2, Plus, ArrowLeft, Wand2, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Chapter {
    _id: string
    number: number
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
    const [optRemovePrefix, setOptRemovePrefix] = useState(true)
    const [optRenumber, setOptRenumber] = useState(true)
    const [optimizedChapters, setOptimizedChapters] = useState<Chapter[]>([])

    // Edit states
    const [openEdit, setOpenEdit] = useState(false)
    const [editingChapterId, setEditingChapterId] = useState<string | null>(null)
    const [loadingEditData, setLoadingEditData] = useState(false)

    // Delete states
    const [openDelete, setOpenDelete] = useState(false)
    const [deletingChapterId, setDeletingChapterId] = useState<string | null>(null)

    // Form states
    const [number, setNumber] = useState("")
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")

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
                body: JSON.stringify({ novelId, number: parseInt(number), title, content }),
            })

            const resData = await res.json()
            if (!res.ok) throw new Error(resData.error || "Thêm mới thất bại")

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

    const handlePreviewOptimize = () => {
        let newChapters = [...chapters]

        if (optRenumber) {
            newChapters.sort((a, b) => a.number - b.number)
            newChapters = newChapters.map((ch, idx) => ({
                ...ch,
                number: idx + 1
            }))
        }

        if (optRemovePrefix) {
            newChapters = newChapters.map((ch, i) => {
                let newTitle = ch.title.replace(/^(Chương|Ch\.)\s*\d+\s*[:-]?\s*/i, "")
                if (!newTitle) newTitle = `Chương ${ch.number}`
                return { ...ch, title: newTitle }
            })
        }

        setOptimizedChapters(newChapters)
        setPreviewMode(true)
    }

    const handleApplyOptimize = async () => {
        if (optimizedChapters.length === 0) return
        setOptimizing(true)
        try {
            const updates = optimizedChapters.map(ch => ({
                id: ch._id,
                title: ch.title,
                number: ch.number
            }))

            const res = await fetch("/api/mod/chuong/optimize", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ novelId, updates }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Lỗi tối ưu hóa")

            toast.success(`Đã tổi ưu ${data.modifiedCount} chương!`)
            setOpenOptimize(false)
            setPreviewMode(false)
            fetchChapters(currentPage)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setOptimizing(false)
        }
    }

    const handleOpenEdit = async (chapter: Chapter) => {
        setEditingChapterId(chapter._id)
        setNumber(chapter.number.toString())
        setTitle(chapter.title)
        setContent("") // Khởi tạo rỗng trong lúc chờ fetch nội dung
        setOpenEdit(true)
        setLoadingEditData(true)

        try {
            // Lấy chi tiết chương từ list db để có nội dung qua API GET /api/mod/chuong/[id] vừa tạo
            const res = await fetch(`/api/mod/chuong/${chapter._id}`)
            if (res.ok) {
                const data = await res.json()
                setContent(data.content)
            } else {
                toast.error("Không tải được nội dung chương")
            }
        } catch {
            toast.error("Không tải được nội dung chương")
        } finally {
            setLoadingEditData(false)
        }
    }

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!number || !title || !content || !novelId || !editingChapterId) {
            toast.error("Vui lòng điền đầy đủ")
            return
        }

        setSubmitting(true)
        try {
            const res = await fetch("/api/mod/chuong", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: editingChapterId, novelId, number: parseInt(number), title, content }),
            })

            const resData = await res.json()
            if (!res.ok) throw new Error(resData.error || "Cập nhật thất bại")

            toast.success("Đã cập nhật chương thành công!")
            setOpenEdit(false)
            fetchChapters()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSubmitting(false)
        }
    }

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
                    }} disabled={chapters.length === 0}>
                        <Wand2 className="h-4 w-4" /> Tối ưu hóa
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
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="space-y-2 col-span-1">
                                        <label className="text-sm font-medium">Chương số</label>
                                        <Input type="number" value={number} onChange={(e) => setNumber(e.target.value)} required />
                                    </div>
                                    <div className="space-y-2 col-span-3">
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

                    <Dialog open={openEdit} onOpenChange={setOpenEdit}>
                        <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle>Chỉnh Sửa Chương</DialogTitle>
                                <DialogDescription>
                                    Thay đổi nội dung hoặc thông tin chương truyện.
                                </DialogDescription>
                            </DialogHeader>
                            {loadingEditData ? (
                                <div className="flex-1 flex justify-center items-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <form onSubmit={handleEditSubmit} className="flex flex-col gap-4 pt-4 flex-1 h-full overflow-hidden">
                                    <div className="grid grid-cols-4 gap-4">
                                        <div className="space-y-2 col-span-1">
                                            <label className="text-sm font-medium">Chương số</label>
                                            <Input type="number" value={number} onChange={(e) => setNumber(e.target.value)} required />
                                        </div>
                                        <div className="space-y-2 col-span-3">
                                            <label className="text-sm font-medium">Tên chương</label>
                                            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
                                        </div>
                                    </div>
                                    <div className="space-y-2 flex-1 flex flex-col h-full">
                                        <label className="text-sm font-medium">Nội dung văn bản</label>
                                        <Textarea
                                            value={content}
                                            onChange={(e) => setContent(e.target.value)}
                                            className="flex-1 w-full p-4 resize-none min-h-[300px]"
                                            required
                                        />
                                    </div>
                                    <DialogFooter className="mt-auto pt-4">
                                        <Button type="button" variant="outline" onClick={() => setOpenEdit(false)}>Hủy</Button>
                                        <Button type="submit" disabled={submitting}>
                                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Lưu thay đổi
                                        </Button>
                                    </DialogFooter>
                                </form>
                            )}
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

                    <Dialog open={openOptimize} onOpenChange={setOpenOptimize}>
                        <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
                            <DialogHeader>
                                <DialogTitle>Tối Ưu Hóa Chương Hàng Loạt</DialogTitle>
                                <DialogDescription>
                                    Công cụ dọn dẹp tên chương và đánh lại số thứ tự tự động tiện lợi sau khi đăng ép từ tệp EPUB.
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
                                            {optimizedChapters.map((newCh, i) => {
                                                const oldCh = chapters[i]
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
                                    <Button onClick={handlePreviewOptimize}>Kiểm tra trước</Button>
                                ) : (
                                    <>
                                        <Button variant="secondary" onClick={() => setPreviewMode(false)} disabled={optimizing}>Quay lại Option</Button>
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
                                <th scope="col" className="px-5 py-4 font-semibold">Tên chương</th>
                                <th scope="col" className="px-5 py-4 font-semibold text-right">Lượt đọc</th>
                                <th scope="col" className="px-5 py-4 text-right font-semibold">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></td></tr>
                            ) : chapters.length === 0 ? (
                                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Chưa có chương nào được đăng.</td></tr>
                            ) : (
                                chapters.map((ch) => (
                                    <tr key={ch._id} className="border-b border-border hover:bg-muted/30 transition-colors last:border-0">
                                        <td className="px-5 py-4 font-medium text-foreground">Chương {ch.number}</td>
                                        <td className="px-5 py-4 text-muted-foreground">{ch.title}</td>
                                        <td className="px-5 py-4 text-right">{ch.views}</td>
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button size="sm" variant="outline" className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => handleOpenEdit(ch)}>
                                                    <Edit className="w-4 h-4 mr-1" /> Sửa
                                                </Button>
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
