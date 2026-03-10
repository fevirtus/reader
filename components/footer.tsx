import Link from "next/link"
import { BookOpen } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold text-foreground">Virtus's Reader</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground">Trang Chủ</Link>
            <Link href="/the-loai" className="transition-colors hover:text-foreground">Thể Loại</Link>
            <Link href="/tim-kiem" className="transition-colors hover:text-foreground">Tìm Kiếm</Link>
          </nav>
          <p className="text-xs text-muted-foreground text-center">
            Virtus's Reader - Đọc truyện chữ online
          </p>
        </div>
      </div>
    </footer>
  )
}
