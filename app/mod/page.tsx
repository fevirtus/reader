import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function ModDashboardPage() {
    const session = await getServerSession(authOptions)

    const novelWhere = session?.user.role === "ADMIN"
        ? {}
        : {
            OR: [
                { uploaderId: session?.user.id },
                { uploaderId: null },
            ],
        }

    const [novelCount, novelViewsAgg, commentCount, seriesCount] = await Promise.all([
        prisma.novel.count({ where: novelWhere }),
        prisma.novel.aggregate({
            where: novelWhere,
            _sum: { views: true },
        }),
        prisma.comment.count({
            where: {
                novel: novelWhere,
            },
        }),
        prisma.series.count({
            where: session?.user.role === "ADMIN"
                ? {}
                : {
                    OR: [
                        { novels: { some: { uploaderId: session?.user.id } } },
                        { novels: { some: { uploaderId: null } } },
                        { novels: { none: {} } },
                    ],
                },
        }),
    ])

    const totalViews = novelViewsAgg._sum.views || 0

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
        </div>
    )
}
