import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function ModDashboardPage() {
    const session = await getServerSession(authOptions)

    return (
        <div>
            <h1 className="text-2xl font-bold mb-4">Xin chào, {session?.user.name}</h1>
            <p className="text-muted-foreground mb-6">
                Chào mừng bạn đến với trang quản trị dành cho Moderator.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <h3 className="font-semibold text-lg">Truyện của bạn</h3>
                    <p className="text-3xl font-bold mt-2">0</p>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <h3 className="font-semibold text-lg">Tổng lượt xem</h3>
                    <p className="text-3xl font-bold mt-2">0</p>
                </div>
                <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
                    <h3 className="font-semibold text-lg">Bình luận mới</h3>
                    <p className="text-3xl font-bold mt-2">0</p>
                </div>
            </div>
        </div>
    )
}
