"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Loader2, ArrowLeft, Save, SplitSquareHorizontal, Search, Trash2, X, Plus } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

// Helper to convert plain text with URLs to HTML with <a> tags
const renderWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    return text.split('\n').map((paragraph, index) => {
        if (!paragraph.trim()) return <br key={index} />
        
        const parts = paragraph.split(urlRegex)
        return (
            <p key={index} className="mb-4 leading-relaxed">
                {parts.map((part, i) => {
                    if (part.match(urlRegex)) {
                        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{part}</a>
                    }
                    return <span key={i}>{part}</span>
                })}
            </p>
        )
    })
}

export function EditorClient({ chapterId }: { chapterId: string }) {
    const router = useRouter()
    
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [novel, setNovel] = useState<any>(null)
    
    // Core states
    const [number, setNumber] = useState("")
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [originalNovelId, setOriginalNovelId] = useState("")

    // Tool states
    const [openToolDialog, setOpenToolDialog] = useState(false)
    const [toolAction, setToolAction] = useState<"replace" | "trash">("replace")
    const [toolScope, setToolScope] = useState<"chapter" | "novel">("chapter")
    const [toolFindText, setToolFindText] = useState("")
    const [toolReplaceText, setToolReplaceText] = useState("")
    const [toolTrashWords, setToolTrashWords] = useState("") // Just for the input box
    const [novelTrashWords, setNovelTrashWords] = useState<string[]>([]) // Persisted DB array
    const [toolMatchCase, setToolMatchCase] = useState(false)
    const [toolExecuting, setToolExecuting] = useState(false)
    const [toolPreviewing, setToolPreviewing] = useState(false)
    const [toolPreviewResults, setToolPreviewResults] = useState<any[]>([])
    
    // UI Layout states
    const [splitView, setSplitView] = useState(true)

    // Sync Scroll Refs
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const previewRef = useRef<HTMLDivElement>(null)
    const isScrolling = useRef<'textarea' | 'preview' | null>(null)
    const scrollTimeout = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        const fetchChapter = async () => {
            try {
                const res = await fetch(`/api/mod/chuong/${chapterId}`)
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}))
                    console.error("Fetch chapter error:", res.status, errorData)
                    throw new Error(errorData.error || `Không thể tải chương (${res.status})`)
                }
                const data = await res.json()
                
                setNumber(data.number.toString())
                setTitle(data.title)
                setContent(data.content)
                setOriginalNovelId(data.novelId)
                
                // Fetch novel details to show breadcrumbs
                const novelRes = await fetch(`/api/truyen?slug=${data.novelId}`)
                if (novelRes.ok) {
                    const novelData = await novelRes.json()
                    setNovel(novelData)
                }
            } catch (error: any) {
                console.error("Failed to load:", error)
                toast.error(error.message || "Lỗi khi tải dữ liệu chương")
            } finally {
                setLoading(false)
            }
        }
        
        fetchChapter()
    }, [chapterId])

    useEffect(() => {
        if (!originalNovelId) return
        const fetchTrashWords = async () => {
            try {
                const res = await fetch(`/api/mod/truyen/${originalNovelId}/trash-words`)
                if (res.ok) {
                    const data = await res.json()
                    setNovelTrashWords(data.trashWords || [])
                }
            } catch (e) {
                console.error("Fetch trash words error:", e)
            }
        }
        fetchTrashWords()
    }, [originalNovelId])

    const handleTextareaScroll = () => {
        if (!textareaRef.current || !previewRef.current) return
        if (isScrolling.current === 'preview') return
        isScrolling.current = 'textarea'
        
        const { scrollTop, scrollHeight, clientHeight } = textareaRef.current
        const percentage = scrollTop / (scrollHeight - clientHeight) || 0
        
        const maxPreviewScroll = previewRef.current.scrollHeight - previewRef.current.clientHeight
        previewRef.current.scrollTop = percentage * maxPreviewScroll
        
        if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
        scrollTimeout.current = setTimeout(() => { isScrolling.current = null }, 50)
    }

    const handlePreviewScroll = () => {
        if (!textareaRef.current || !previewRef.current) return
        if (isScrolling.current === 'textarea') return
        isScrolling.current = 'preview'
        
        const { scrollTop, scrollHeight, clientHeight } = previewRef.current
        const percentage = scrollTop / (scrollHeight - clientHeight) || 0
        
        const maxTextareaScroll = textareaRef.current.scrollHeight - textareaRef.current.clientHeight
        textareaRef.current.scrollTop = percentage * maxTextareaScroll
        
        if (scrollTimeout.current) clearTimeout(scrollTimeout.current)
        scrollTimeout.current = setTimeout(() => { isScrolling.current = null }, 50)
    }

    const handleAddTrashWord = async () => {
        if (!toolTrashWords.trim()) return
        const newWords = [...novelTrashWords, toolTrashWords]
        setNovelTrashWords(newWords)
        setToolTrashWords("")
        try {
            await fetch(`/api/mod/truyen/${originalNovelId}/trash-words`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ trashWords: newWords })
            })
        } catch (e) {
            console.error("Save trash words error:", e)
        }
    }

    const handleRemoveTrashWord = async (index: number) => {
        const newWords = novelTrashWords.filter((_, i) => i !== index)
        setNovelTrashWords(newWords)
        try {
            await fetch(`/api/mod/truyen/${originalNovelId}/trash-words`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ trashWords: newWords })
            })
        } catch (e) {
            console.error("Save trash words error:", e)
        }
    }

    const handleSave = async () => {
        if (!title || !content || !number) {
            toast.error("Vui lòng điền đủ thông tin")
            return
        }

        setSaving(true)
        try {
            const res = await fetch("/api/mod/chuong", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: chapterId,
                    novelId: originalNovelId,
                    number: parseInt(number),
                    title,
                    content
                })
            })

            if (!res.ok) throw new Error("Cập nhật thất bại")
            
            toast.success("Đã lưu chương thành công!")
            router.push(`/mod/chuong?novelId=${originalNovelId}`)
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setSaving(false)
        }
    }

    const handleToolExecute = async (isPreview: boolean = false) => {
        if (toolAction === "replace" && !toolFindText) {
            toast.error("Vui lòng nhập từ khóa cần tìm")
            return
        }
        if (toolAction === "trash" && novelTrashWords.length === 0) {
            toast.error("Danh sách từ rác trống. Vui lòng thêm từ rác trước.")
            return
        }

        if (toolScope === "chapter") {
            if (isPreview) {
                toast.info("Xem trước chỉ áp dụng cho Toàn Truyện. Xin hãy áp dụng ngay cho chương này.")
                return
            }
            
            let newContent = content
            let count = 0
            const flags = toolMatchCase ? 'g' : 'gi'

            if (toolAction === "replace") {
                const safeFindText = toolFindText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                const regex = new RegExp(safeFindText, flags)
                const matches = newContent.match(regex)
                if (matches) count = matches.length
                newContent = newContent.replace(regex, toolReplaceText)
                toast.success(`Đã thay thế ${count} lần nhóm từ "${toolFindText}" thành "${toolReplaceText}"`)
            } else {
                novelTrashWords.forEach(word => {
                    const safeWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                    const regex = new RegExp(safeWord, flags)
                    const matches = newContent.match(regex)
                    if (matches) count += matches.length
                    newContent = newContent.replace(regex, '')
                })
                toast.success(`Đã lọc bỏ ${count} từ rác`)
            }
            setContent(newContent)
            setOpenToolDialog(false)
            return
        }

        // Global replace (Entire novel scope)
        if (isPreview) setToolPreviewing(true)
        else setToolExecuting(true)

        try {
            const res = await fetch("/api/mod/chuong/global-replace", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    novelId: originalNovelId, 
                    action: toolAction,
                    findText: toolFindText, 
                    replaceText: toolReplaceText,
                    trashWords: novelTrashWords,
                    matchCase: toolMatchCase,
                    preview: isPreview
                }),
            })
            
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Thao tác thất bại")

            if (isPreview) {
                setToolPreviewResults(data.previews || [])
                if (data.previews?.length === 0) {
                    toast.info("Không tìm thấy kết quả nào trùng khớp trên toàn truyện")
                }
            } else {
                toast.success(`Đã chạy công cụ thành công trên ${data.updatedChapters} chương!`)
                toast.info("Trang đang tự tải lại để cập nhật nội dung mới...", { duration: 2000 })
                setTimeout(() => window.location.reload(), 2000)
                setOpenToolDialog(false)
                setToolPreviewResults([])
                setToolFindText("")
                setToolReplaceText("")
                setToolTrashWords("")
            }
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            if (isPreview) setToolPreviewing(false)
            else setToolExecuting(false)
        }
    }


    if (loading) {
        return <div className="flex justify-center items-center h-[50vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
    }

    return (
        <div className="space-y-4 max-w-7xl mx-auto flex flex-col h-[calc(100vh-6rem)]">
            {/* Header & Breadcrumb */}
            <div className="flex items-center justify-between bg-card p-4 rounded-xl border shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <Link href={`/mod/chuong?novelId=${originalNovelId}`}>
                        <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold">Chỉnh sửa Chương {number}</h1>
                        <p className="text-sm text-muted-foreground">{novel?.title || `Novel ID: ${originalNovelId}`}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => setSplitView(!splitView)} className="hidden md:flex gap-2">
                        <SplitSquareHorizontal className="w-4 h-4" />
                        {splitView ? "Tắt Xem Trước" : "Bật Xem Trước"}
                    </Button>
                    <Button onClick={handleSave} disabled={saving} className="gap-2">
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Lưu Thay Đổi
                    </Button>
                </div>
            </div>

            {/* Quick Tools Bar */}
            <div className="bg-card p-3 rounded-xl border shadow-sm flex flex-wrap items-center gap-4 shrink-0">
                <Button variant="secondary" onClick={() => { setToolAction("replace"); setOpenToolDialog(true) }} className="gap-2">
                    <Search className="w-4 h-4 text-muted-foreground" /> Tìm & Thay Thế
                </Button>
                <Button variant="outline" onClick={() => { setToolAction("trash"); setOpenToolDialog(true) }} className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                    <Trash2 className="w-4 h-4" /> Dọn Dẹp Từ Rác
                </Button>

                <Dialog open={openToolDialog} onOpenChange={(open) => {
                    setOpenToolDialog(open)
                    if (!open) setToolPreviewResults([])
                }}>
                    <DialogContent className="sm:max-w-[700px] max-h-[85vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>
                                {toolAction === "replace" ? "Bộ công cụ: Tìm Kiếm & Thay Thế" : "Bộ công cụ: Dọn Dẹp Từ Rác"}
                            </DialogTitle>
                            <DialogDescription>
                                {toolAction === "replace" 
                                    ? "Thay thế cụm từ trên chương này hoặc trên toàn bộ truyện."
                                    : "Xóa bỏ các cụm từ rác, watermark trên chương này hoặc trên toàn bộ truyện."}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar pr-2">
                            {toolPreviewResults.length > 0 ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-semibold text-lg">Bản xem trước ({toolPreviewResults.length} ví dụ)</h3>
                                        <Button variant="ghost" size="sm" onClick={() => setToolPreviewResults([])}>
                                            <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại tuỳ chỉnh
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {toolPreviewResults.map((res: any) => (
                                            <div key={res.chapterId} className="p-3 border rounded-lg bg-card text-left">
                                                <div className="text-sm font-medium mb-1">Chương {res.number}: {res.title}</div>
                                                <div className="text-sm text-muted-foreground bg-muted p-2 rounded italic font-serif">
                                                    {res.snippet}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {/* Scope Selector */}
                                    <div className="p-3 border rounded-lg bg-muted/30">
                                        <div className="text-sm font-medium mb-2">Phạm vi áp dụng thao tác:</div>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="toolScope" checked={toolScope === "chapter"} onChange={() => setToolScope("chapter")} />
                                                <span>Chỉ Chương Này</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="radio" name="toolScope" checked={toolScope === "novel"} onChange={() => setToolScope("novel")} />
                                                <span className="text-primary font-medium">Toàn Bộ Truyện</span>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Action Content */}
                                    {toolAction === "replace" ? (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Tìm cụm từ:</label>
                                                <Input 
                                                    placeholder="Ví dụ: truyenchu.vn" 
                                                    value={toolFindText} 
                                                    onChange={(e) => setToolFindText(e.target.value)} 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Thay thế bằng (Bỏ trống để xóa hoàn toàn):</label>
                                                <Input 
                                                    placeholder="..." 
                                                    value={toolReplaceText} 
                                                    onChange={(e) => setToolReplaceText(e.target.value)} 
                                                />
                                            </div>
                                            <label className="flex items-center gap-2 cursor-pointer mt-2 w-max">
                                                <input type="checkbox" className="w-4 h-4 rounded" checked={toolMatchCase} onChange={(e) => setToolMatchCase(e.target.checked)} />
                                                <span className="text-sm">Phân biệt chữ Hoa / chữ thường</span>
                                            </label>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {novelTrashWords.length > 0 && (
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Danh sách từ rác hiện tại:</label>
                                                    <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                                        {novelTrashWords.map((word, idx) => (
                                                            <div key={idx} className="flex items-start gap-2 p-3 relative bg-red-50 dark:bg-red-950/20 text-red-900 border border-red-200 dark:border-red-900/50 rounded-lg group">
                                                                <pre className="text-sm flex-1 whitespace-pre-wrap font-sans">{word}</pre>
                                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500 hover:text-red-700 hover:bg-red-100 shrink-0" onClick={() => handleRemoveTrashWord(idx)}>
                                                                    <X className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <div className="space-y-2 mt-4 pt-4 border-t">
                                                <label className="text-sm font-medium">Thêm từ rác (Hỗ trợ nhiều dòng với Enter):</label>
                                                <Textarea 
                                                    placeholder="Ví dụ:\n\n.\n\n.\n\n." 
                                                    value={toolTrashWords} 
                                                    onChange={(e) => setToolTrashWords(e.target.value)}
                                                    className="resize-none h-24"
                                                />
                                                <Button type="button" variant="secondary" onClick={handleAddTrashWord} disabled={!toolTrashWords.trim()} className="w-full">
                                                    <Plus className="w-4 h-4 mr-2" /> Thêm vào danh sách CSDL
                                                </Button>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-2">
                                                Các cụm từ rác sẽ được lưu lại cho toàn bộ truyện. Chế độ lọc rác tự động tìm kiếm không phân biệt Hoa/thường.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <DialogFooter className="mt-auto pt-4 border-t">
                            <Button variant="outline" onClick={() => {
                                setOpenToolDialog(false)
                                setToolPreviewResults([])
                            }}>Đóng</Button>
                            
                            {toolPreviewResults.length === 0 ? (
                                                <>
                                                    <Button variant="secondary" onClick={() => handleToolExecute(true)} disabled={toolPreviewing || toolScope === 'chapter' || (toolAction === 'replace' ? !toolFindText : novelTrashWords.length === 0)}>
                                                        {toolPreviewing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                        Xem Trước
                                                    </Button>
                                                    <Button variant="destructive" onClick={() => handleToolExecute(false)} disabled={toolExecuting || (toolAction === 'trash' && novelTrashWords.length === 0)}>
                                                        {toolExecuting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                        Áp Dụng Thực Thay
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button variant="destructive" onClick={() => handleToolExecute(false)} disabled={toolExecuting || (toolAction === 'trash' && novelTrashWords.length === 0)}>
                                                    {toolExecuting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                                    Đã Chắc Chắn, Bắt Đầu Thay Thế!
                                                </Button>
                                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Editor Workspace */}
            <div className="flex flex-col flex-1 pb-4 min-h-0">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 shrink-0">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">Chương số</label>
                        <Input type="number" value={number} onChange={(e) => setNumber(e.target.value)} className="font-mono" />
                    </div>
                    <div className="space-y-1 md:col-span-3">
                        <label className="text-xs font-semibold uppercase text-muted-foreground">Tên chương</label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                </div>

                <div className={`flex-1 flex gap-4 min-h-0 ${splitView ? 'flex-row' : 'flex-col'}`}>
                    {/* Left: Raw Textarea */}
                    <div className={`flex flex-col flex-1 h-full min-h-0 border rounded-xl overflow-hidden bg-background shadow-inner`}>
                        <div className="bg-muted px-4 py-2 border-b text-xs font-semibold uppercase text-muted-foreground shrink-0">
                            Nội Dung Nguồn
                        </div>
                        <Textarea
                            ref={textareaRef}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onScroll={handleTextareaScroll}
                            className="flex-1 w-full p-4 resize-none border-0 focus-visible:ring-0 rounded-none h-full custom-scrollbar text-base"
                            placeholder="Nội dung chương..."
                        />
                    </div>

                    {/* Right: Preview (Only shown if splitView is true and on tablet/desktop) */}
                    <div className={`flex flex-col flex-1 h-full min-h-0 border rounded-xl overflow-hidden bg-background shadow-inner ${splitView ? 'hidden md:flex' : 'hidden'}`}>
                        <div className="bg-muted px-4 py-2 border-b text-xs font-semibold uppercase text-muted-foreground shrink-0 flex justify-between">
                            <span>Bản Hiển Thị</span>
                            <span className="text-primary normal-case">Link được nhận diện tự động</span>
                        </div>
                        <div 
                            ref={previewRef}
                            onScroll={handlePreviewScroll}
                            className="flex-1 overflow-y-auto p-6 bg-card custom-scrollbar"
                        >
                            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none font-serif">
                                {content ? renderWithLinks(content) : <p className="text-muted-foreground italic">Nội dung trống...</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
