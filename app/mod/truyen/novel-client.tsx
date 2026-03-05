"use client"

import { useState, useEffect } from "react"
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
import { BookOpen, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Novel {
    id: string
    title: string
    slug: string
    authorName: string
    status: string
    totalChapters: number
}

export function NovelClient() {
    const [novels, setNovels] = useState<Novel[]>([])
    const [loading, setLoading] = useState(true)
    const [openAdd, setOpenAdd] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    // Form states
    const [title, setTitle] = useState("")
    const [authorName, setAuthorName] = useState("")
    const [description, setDescription] = useState("")

    const fetchNovels = async () => {
        try {
            const res = await fetch("/api/mod/truyen")
            if (!res.ok) throw new Error("Lấy danh sách lỗi")
            const data = await res.json()
            setNovels(data)
        } catch {
            toast.error("Không thể tải danh sách truyện")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchNovels()
    }, [])

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title || !authorName || !description) {
            toast.error("Vui lòng điền đầy đủ thông tin")
            return
        }

        setSubmitting(true)
        try {
            const res = await fetch("/api/mod/truyen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, authorName, description }),
            })
            if (!res.ok) throw new Error("Thêm mới thất bại")
            toast.success("Đã thêm truyện thành công!")
            setOpenAdd(false)
            setTitle("")
            setAuthorName("")
            setDescription("")
            fetchNovels()
        } catch {
            toast.error("Lỗi khi thêm truyện mới")
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

                <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" /> Thêm truyện
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Thêm Truyện Mới</DialogTitle>
                            <DialogDescription>
                                Nhập thông tin cơ bản cho đầu truyện mới của bạn.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleAddSubmit} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tên truyện</label>
                                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: Phàm Nhân Tu Tiên" autoFocus />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tác giả gốc</label>
                                <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Ví dụ: Vong Ngữ" />
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
            </div>

            <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs uppercase bg-muted/50 text-muted-foreground border-b border-border">
                            <tr>
                                <th scope="col" className="px-5 py-4 font-semibold">Tên truyện</th>
                                <th scope="col" className="px-5 py-4 font-semibold">Tác giả</th>
                                <th scope="col" className="px-5 py-4 font-semibold">Số chương</th>
                                <th scope="col" className="px-5 py-4 font-semibold">Trạng thái</th>
                                <th scope="col" className="px-5 py-4 text-right font-semibold">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></td></tr>
                            ) : novels.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Bạn chưa đăng truyện nào. Hãy thêm truyện mới!</td></tr>
                            ) : (
                                novels.map((novel) => (
                                    <tr key={novel.id} className="border-b border-border hover:bg-muted/30 transition-colors last:border-0">
                                        <td className="px-5 py-4 font-medium text-foreground">{novel.title}</td>
                                        <td className="px-5 py-4 text-muted-foreground">{novel.authorName}</td>
                                        <td className="px-5 py-4">
                                            <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                                {novel.totalChapters}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="bg-emerald-100 text-emerald-800 text-xs font-medium px-2.5 py-1 rounded-md dark:bg-emerald-900/40 dark:text-emerald-300">
                                                {novel.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right space-x-3">
                                            <Link href={`/mod/chuong?novelId=${novel.id}`} className="font-medium text-blue-500 hover:text-blue-600 hover:underline">
                                                Đăng chương
                                            </Link>
                                            <button className="font-medium text-amber-500 hover:text-amber-600 hover:underline">Sửa</button>
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
