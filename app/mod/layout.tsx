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
            <main className="flex-1 p-6">
                {children}
            </main>
        </div>
    )
}
