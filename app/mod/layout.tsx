import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import { AlertTriangle, BookOpen, Home } from "lucide-react"

export default async function ModLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await getServerSession(authOptions)

    // Kiểm tra quyền
    if (!session || (session.user.role !== "MOD" && session.user.role !== "ADMIN")) {
        redirect("/") // Không đủ quyền, đưa về trang chủ
    }

    return (
        <div className="flex min-h-[calc(100vh-3.5rem)] bg-muted/20">
            {/* Sidebar */}
            <aside className="w-64 border-r bg-background p-4 hidden md:block">
                <h2 className="mb-6 px-2 text-lg font-bold">Mod Dashboard</h2>
                <nav className="flex flex-col gap-2">
                    <Link href="/mod" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary">
                        <Home className="h-4 w-4" /> Tổng quan
                    </Link>
                    <Link href="/mod/truyen" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary">
                        <BookOpen className="h-4 w-4" /> Quản lý truyện
                    </Link>
                    <Link href="/mod/thieu-thong-tin" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary">
                        <AlertTriangle className="h-4 w-4" /> Truyện thiếu dữ liệu
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6">
                {children}
            </main>
        </div>
    )
}
