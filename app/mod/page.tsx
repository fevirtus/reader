import Link from "next/link"
import { cookies } from "next/headers"
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie"
import { requireModSessionUser } from "@/lib/server-auth"

const readerApiOrigin = (process.env.READER_API_ORIGIN || "http://localhost:8000").replace(/\/+$/, "")

export default async function ModDashboardPage() {
    const sessionUser = await requireModSessionUser()

    let novelCount = 0
    let totalViews = 0
    let commentCount = 0

    try {
        const accessToken = (await cookies()).get(AUTH_COOKIE_NAME)?.value || ""
        const res = await fetch(`${readerApiOrigin}/api/mod/overview`, {
            cache: "no-store",
            headers: accessToken ? { authorization: `Bearer ${accessToken}` } : undefined,
        })
        if (res.ok) {
            const data = await res.json()
            novelCount = Number(data?.novelCount || 0)
            totalViews = Number(data?.totalViews || 0)
            commentCount = Number(data?.commentCount || 0)
        }
    } catch (error) {
        console.error("Failed to fetch mod overview", error)
    }

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Xin chào, {sessionUser?.name || "Moderator"}</h1>
            <p className="text-muted-foreground mb-6">
                Chào mừng bạn đến với trang quản trị dành cho Moderator.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            </div>
        </div>
    )
}
