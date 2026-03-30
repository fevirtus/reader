import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import { cookies } from "next/headers"

const readerApiOrigin = (process.env.READER_API_ORIGIN || "http://localhost:8000").replace(/\/+$/, "")

export default async function ModDashboardPage() {
    const session = await getServerSession(authOptions)

    let novelCount = 0
    let totalViews = 0
    let commentCount = 0
    let seriesCount = 0

    try {
        const cookieHeader = (await cookies()).toString()
        const res = await fetch(`${readerApiOrigin}/api/mod/overview`, {
            cache: "no-store",
            headers: cookieHeader ? { cookie: cookieHeader } : undefined,
        })
        if (res.ok) {
            const data = await res.json()
            novelCount = Number(data?.novelCount || 0)
            totalViews = Number(data?.totalViews || 0)
            commentCount = Number(data?.commentCount || 0)
            seriesCount = Number(data?.seriesCount || 0)
        }
    } catch (error) {
        console.error("Failed to fetch mod overview", error)
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Xin chào, {session?.user.name}</h1>
            <p className="text-muted-foreground mb-6">
                Chào mừng bạn đến với trang quản trị dành cho Moderator.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <h3 className="font-semibold text-lg">Tổng truyện</h3>
                    <p className="text-3xl font-bold mt-2">{novelCount}</p>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <h3 className="font-semibold text-lg">Tổng lượt xem</h3>
                    <p className="text-3xl font-bold mt-2">{totalViews}</p>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <h3 className="font-semibold text-lg">Bình luận mới</h3>
                    <p className="text-3xl font-bold mt-2">{commentCount}</p>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <h3 className="font-semibold text-lg">Tổng series</h3>
                    <p className="text-3xl font-bold mt-2">{seriesCount}</p>
                </div>
            </div>

            <div className="mt-6 rounded-xl border bg-card text-card-foreground shadow p-6">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Tool
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    Công cụ AI hỗ trợ tìm kiếm và tự bổ sung thông tin truyện vào form quản lý.
                </p>
                <Link
                    href="/mod/ai-tool"
                    className="mt-4 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                    Mở AI Tool
                </Link>
            </div>
        </div>
    )
}
