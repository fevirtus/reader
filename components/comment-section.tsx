"use client"

import { useState } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-context"
import type { Comment } from "@/lib/types"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CommentSectionProps {
  comments: Comment[]
  chapterComments?: Comment[]
  novelId: string
  chapterId?: string
}

export function CommentSection({ comments: initialComments, chapterComments, novelId, chapterId }: CommentSectionProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState(initialComments)
  const [content, setContent] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || !user || isSubmitting) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/truyen/${novelId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), chapterId })
      })

      if (res.ok) {
        const newComment = await res.json()
        setComments((prev) => [newComment, ...prev])
        setContent("")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h3 className="mb-4 text-lg font-bold text-foreground">
        Bình luận ({comments.length})
      </h3>

      {/* Add comment form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-3">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className="h-8 w-8 shrink-0 rounded-full" />
            ) : (
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-background ${user.avatarColor}`}>
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <Textarea
                placeholder="Viết bình luận..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-20 resize-none"
              />
              <div className="mt-2 flex justify-end">
                <Button type="submit" size="sm" disabled={!content.trim() || isSubmitting}>
                  <Send className="mr-1.5 h-3.5 w-3.5" />
                  Gửi
                </Button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-6 rounded-lg border border-border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
          <Link href="/dang-nhap" className="font-medium text-primary hover:underline">Đăng nhập</Link> để viết bình luận.
        </div>
      )}

      {/* Comments list with Tabs for Novel Details Page */}
      {chapterComments ? (
        <Tabs defaultValue="novel" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="novel">Bình luận Truyện ({comments.length})</TabsTrigger>
            <TabsTrigger value="chapter">Bình luận Chương ({chapterComments.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="novel" className="flex flex-col gap-4 mt-0">
            {comments.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Chưa có bình luận nào cho truyện này. Hãy là người đầu tiên!</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-background ${comment.avatarColor}`}>
                    {comment.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{comment.username}</span>
                      <span className="text-xs text-muted-foreground">{comment.createdAt}</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/90">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="chapter" className="flex flex-col gap-4 mt-0">
            {chapterComments.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Chưa có bình luận nào trên các chương.</p>
            ) : (
              chapterComments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-background ${comment.avatarColor}`}>
                    {comment.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{comment.username}</span>
                      <span className="text-xs text-muted-foreground">{comment.createdAt}</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/90">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="flex flex-col gap-4">
          {comments.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-background ${comment.avatarColor}`}>
                  {comment.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">{comment.username}</span>
                    <span className="text-xs text-muted-foreground">{comment.createdAt}</span>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/90">{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
