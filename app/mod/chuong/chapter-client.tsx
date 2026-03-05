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
import { FileText, Loader2, Plus, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Chapter {
    _id: string
    number: number
    title: string
    views: number
    createdAt: string
}

function ChapterManager() {
    const searchParams = useSearchParams()
    const novelId = searchParams.get("novelId")

    const [chapters, setChapters] = useState<Chapter[]>([])
    const [loading, setLoading] = useState(true)
    const [openAdd, setOpenAdd] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Form states
    const [number, setNumber] = useState("")
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")

    const fetchChapters = async () => {
        if (!novelId) return
        try {
            const res = await fetch(`/api/mod/chuong?novelId=${novelId}`)
            if (!res.ok) throw new Error("Lỗi fetch")
            const data = await res.json()
            setChapters(data)
            if (data.length > 0) {
                setNumber((data[data.length - 1].number + 1).toString())
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
        fetchChapters()
    }, [novelId])

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
            </div>

            <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
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
                                        <td className="px-5 py-4 text-right space-x-3">
                                            <button className="font-medium text-amber-500 hover:text-amber-600 hover:underline">Sửa nội dung</button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
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
