"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AlertTriangle, BookOpen, Home, Star, Tag, ChevronLeft, ChevronRight, UploadCloud } from "lucide-react"
import { cn } from "@/lib/utils"

export function CollapsibleSidebar() {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        const saved = localStorage.getItem("mod-sidebar-collapsed")
        if (saved === "true") setCollapsed(true)
    }, [])

    const toggle = () => {
        const next = !collapsed
        setCollapsed(next)
        localStorage.setItem("mod-sidebar-collapsed", String(next))
    }

    if (!mounted) {
        return <aside className="w-64 border-r bg-background p-4 hidden md:block transition-all duration-300"></aside>
    }

    const navItems = [
        { href: "/mod", label: "Tổng quan", icon: Home },
        { href: "/mod/truyen", label: "Quản lý truyện", icon: BookOpen },
        { href: "/mod/thieu-thong-tin", label: "Truyện thiếu dữ liệu", icon: AlertTriangle },
        { href: "/mod/the-loai", label: "Quản lý thể loại", icon: Tag },
        { href: "/mod/import", label: "Import EPUB", icon: UploadCloud },
        { href: "/mod/de-cu", label: "Quản lý đề cử", icon: Star },
    ]

    return (
        <aside className={cn(
            "border-r bg-background hidden md:flex flex-col relative transition-all duration-300",
            collapsed ? "w-16 items-center py-4" : "w-64 p-4"
        )}>
            <button 
                onClick={toggle}
                className="absolute -right-3 top-6 bg-background border rounded-full p-1 hover:bg-muted text-muted-foreground hover:text-foreground z-10 transition-transform shadow-sm"
            >
                {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>

            {!collapsed && <h2 className="mb-6 px-2 text-lg font-bold whitespace-nowrap overflow-hidden">Mod Dashboard</h2>}
            {collapsed && <div className="mb-6 h-7" />}

            <nav className="flex flex-col gap-2 w-full">
                {navItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                        <Link 
                            key={item.href}
                            href={item.href} 
                            className={cn(
                                "flex items-center rounded-md font-medium transition-colors hover:bg-muted group relative",
                                collapsed ? "justify-center p-2 mx-auto w-10 h-10" : "px-3 py-2 gap-3 text-sm",
                                isActive ? "bg-primary/10 text-primary hover:bg-primary/20" : "text-muted-foreground"
                            )}
                            title={collapsed ? item.label : undefined}
                        >
                            <Icon className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />
                            {!collapsed && <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.label}</span>}
                            
                            {collapsed && (
                                <div className="absolute left-full ml-3 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible whitespace-nowrap z-50 shadow-md border">
                                    {item.label}
                                </div>
                            )}
                        </Link>
                    )
                })}
            </nav>
        </aside>
    )
}
