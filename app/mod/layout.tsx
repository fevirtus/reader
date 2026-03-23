import { redirect } from "next/navigation"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { CollapsibleSidebar } from "./collapsible-sidebar"

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
            <CollapsibleSidebar />

            {/* Main Content */}
            <main className="flex-1 p-6">
                {children}
            </main>
        </div>
    )
}
