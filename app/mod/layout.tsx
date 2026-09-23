import Link from "next/link"
import { requireModSessionUser } from "@/lib/server-auth"
import { CollapsibleSidebar } from "./collapsible-sidebar"

export default async function ModLayout({
    children,
}: {
    children: React.ReactNode
}) {
    await requireModSessionUser()

    return (
        <div className="flex min-h-[calc(100vh-3.5rem)] bg-muted/20">
            <CollapsibleSidebar />

            {/* Main Content */}
            <main className="min-w-0 flex-1 p-2 md:p-6">
                <nav className="flex gap-4 overflow-x-auto p-3 text-sm md:hidden"><Link href="/mod">Tổng quan</Link><Link href="/mod/truyen">Truyện</Link><Link href="/mod/audio-books">Audio book</Link></nav>
                {children}
            </main>
        </div>
    )
}
