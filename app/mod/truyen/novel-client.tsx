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
import { BookOpen, Loader2, Plus, Upload, Edit, Trash2, LayoutGrid, List, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Novel {
    id: string
    title: string
    slug: string
    authorName: string
    status: string
    totalChapters: number
    coverUrl?: string
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
    const [originalTitle, setOriginalTitle] = useState("")
    const [authorName, setAuthorName] = useState("")
    const [originalAuthorName, setOriginalAuthorName] = useState("")
    const [description, setDescription] = useState("")
    const [coverUrl, setCoverUrl] = useState("")
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
                body: JSON.stringify({ title, originalTitle, authorName, originalAuthorName, description, coverUrl, genreIds: selectedGenres }), // Can add status here later if API accepts it on create
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
                            setTitle(""); setOriginalTitle(""); setAuthorName(""); setOriginalAuthorName(""); setDescription(""); setCoverUrl(""); setSelectedGenres([]); setNewGenreName("");
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
                {viewMode === 'list' ? (
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
                                            <td className="px-5 py-4 font-medium text-foreground flex items-center gap-3">
                                                {novel.coverUrl ? (
                                                    <img src={novel.coverUrl} alt={novel.title} className="w-8 h-10 object-cover rounded shadow-sm hidden sm:block" />
                                                ) : (
                                                    <div className="w-8 h-10 bg-muted rounded shadow-sm hidden sm:flex items-center justify-center text-muted-foreground"><BookOpen className="w-4 h-4" /></div>
                                                )}
                                                {novel.title}
                                            </td>
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
                ) : (
                    <div className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
                        {loading ? (
                            <div className="col-span-full py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                        ) : novels.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-muted-foreground">Bạn chưa đăng truyện nào. Hãy thêm truyện mới!</div>
                        ) : (
                            novels.map((novel) => (
                                <div key={novel.id} className="group relative flex flex-col rounded-xl overflow-hidden border shadow-sm transition-all hover:-translate-y-1 hover:shadow-md bg-card">
                                    <div className="aspect-[2/3] w-full bg-muted relative border-b">
                                        {novel.coverUrl ? (
                                            <img src={novel.coverUrl} alt={novel.title} className="w-full h-full object-cover" />
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
                                    </div>
                                    <div className="p-3 flex flex-col flex-1">
                                        <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1" title={novel.title}>{novel.title}</h3>
                                        <p className="text-xs text-muted-foreground mb-3">{novel.authorName}</p>
                                        
                                        <div className="mt-auto grid grid-cols-2 gap-1.5">
                                            <Button size="sm" variant="outline" className="w-full h-7 text-xs px-0" onClick={() => handleOpenEdit(novel)}>
                                                <Edit className="h-3 w-3 mr-1" /> Sửa
                                            </Button>
                                            <Button size="sm" variant="outline" className="w-full h-7 text-xs px-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => {
                                                setDeletingNovelId(novel.id)
                                                setOpenDelete(true)
                                            }}>
                                                <Trash2 className="h-3 w-3 mr-1" /> Xóa
                                            </Button>
                                            <Link href={`/mod/chuong?novelId=${novel.id}`} className="col-span-2">
                                                <Button size="sm" className="w-full h-7 text-xs">
                                                    <List className="h-3 w-3 mr-1" /> DS Chương
                                                </Button>
                                            </Link>
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
