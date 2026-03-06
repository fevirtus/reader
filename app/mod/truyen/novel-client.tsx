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
import { BookOpen, Loader2, Plus, Upload, Edit, Trash2 } from "lucide-react"
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

interface Genre {
    id: string
    name: string
}

export function NovelClient() {
    const [novels, setNovels] = useState<Novel[]>([])
    const [loading, setLoading] = useState(true)
    const [openAdd, setOpenAdd] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [uploadingEpub, setUploadingEpub] = useState(false)

    // Form states
    const [title, setTitle] = useState("")
    const [authorName, setAuthorName] = useState("")
    const [description, setDescription] = useState("")
    const [status, setStatus] = useState("Đang ra")

    // Edit states
    const [openEdit, setOpenEdit] = useState(false)
    const [editingNovel, setEditingNovel] = useState<Novel | null>(null)
    const [loadingEditData, setLoadingEditData] = useState(false)

    // Genre states
    const [genres, setGenres] = useState<Genre[]>([])
    const [selectedGenres, setSelectedGenres] = useState<string[]>([])
    const [newGenreName, setNewGenreName] = useState("")
    const [addingGenre, setAddingGenre] = useState(false)

    // Delete states
    const [openDelete, setOpenDelete] = useState(false)
    const [deletingNovelId, setDeletingNovelId] = useState<string | null>(null)

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

    useEffect(() => {
        fetchNovels()
        fetchGenres()
    }, [])

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

        setSubmitting(true)
        try {
            const res = await fetch("/api/mod/truyen", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ title, authorName, description, genreIds: selectedGenres }), // Can add status here later if API accepts it on create
            })
            if (!res.ok) throw new Error("Thêm mới thất bại")
            toast.success("Đã thêm truyện thành công!")
            setOpenAdd(false)
            setTitle("")
            setAuthorName("")
            setDescription("")
            setStatus("Đang ra")
            setSelectedGenres([])
            fetchNovels()
        } catch {
            toast.error("Lỗi khi thêm truyện mới")
        } finally {
            setSubmitting(false)
        }
    }

    const handleEpubUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.name.endsWith('.epub')) {
            toast.error("Vui lòng chọn file định dạng .epub")
            e.target.value = "" // Reset input
            return
        }

        setUploadingEpub(true)
        const formData = new FormData()
        formData.append("file", file)

        try {
            const res = await fetch("/api/mod/epub", {
                method: "POST",
                body: formData,
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Lỗi khi tải lên EPUB")
            }

            toast.success("Phân tích và xuất bản EPUB thành công!")
            fetchNovels()
        } catch (err: any) {
            toast.error(err.message || "Có lỗi xảy ra khi xử lý file EPUB")
        } finally {
            setUploadingEpub(false)
            e.target.value = "" // Reset input
        }
    }

    const handleOpenEdit = async (novel: Novel) => {
        setEditingNovel(novel)
        setTitle(novel.title)
        setAuthorName(novel.authorName)
        setStatus(novel.status)
        setDescription("")
        setOpenEdit(true)
        setLoadingEditData(true)

        try {
            const res = await fetch(`/api/mod/truyen/${novel.id}`)
            if (res.ok) {
                const data = await res.json()
                setDescription(data.description || "")
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

        setSubmitting(true)
        try {
            const res = await fetch("/api/mod/truyen", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: editingNovel.id,
                    title,
                    authorName,
                    description,
                    genreIds: selectedGenres,
                    status: status
                }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Lỗi cập nhật")

            toast.success("Cập nhật truyện thành công!")
            setOpenEdit(false)
            fetchNovels()
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
                    <input
                        type="file"
                        id="epub-upload"
                        accept=".epub,application/epub+zip"
                        className="hidden"
                        onChange={handleEpubUpload}
                        disabled={uploadingEpub}
                    />
                    <Button
                        variant="secondary"
                        className="gap-2"
                        disabled={uploadingEpub}
                        onClick={() => document.getElementById('epub-upload')?.click()}
                    >
                        {uploadingEpub ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        Tải lên EPUB
                    </Button>

                    <Dialog open={openAdd} onOpenChange={(val) => {
                        setOpenAdd(val);
                        if (val) {
                            setTitle(""); setAuthorName(""); setDescription(""); setSelectedGenres([]); setNewGenreName("");
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
                                    <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: Phàm Nhân Tu Tiên" autoFocus />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tác giả gốc</label>
                                    <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} placeholder="Ví dụ: Vong Ngữ" />
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
                                        <label className="text-sm font-medium">Tác giả gốc</label>
                                        <Input value={authorName} onChange={(e) => setAuthorName(e.target.value)} required />
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

                    <Dialog open={openDelete} onOpenChange={setOpenDelete}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle className="text-destructive">Xác nhận xóa truyện</DialogTitle>
                                <DialogDescription>
                                    Bạn có chắc chắn muốn xóa bộ truyện này? Hành động này sẽ ẩn đầu truyện khỏi hệ thống.
                                    <br /><br />
                                    Lưu ý: Các chương liên quan (trong MongoDB) sẽ cần được dọn dẹp riêng.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="mt-4">
                                <Button variant="outline" onClick={() => setOpenDelete(false)}>Hủy bỏ</Button>
                                <Button variant="destructive" onClick={handleDeleteSubmit} disabled={submitting}>
                                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Tiếp tục xóa
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
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
                                        <td className="px-5 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/mod/chuong?novelId=${novel.id}`}>
                                                    <Button size="sm" variant="outline" className="h-8">
                                                        Cập nhật chương
                                                    </Button>
                                                </Link>
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
            </div>
        </div>
    )
}
