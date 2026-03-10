"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import { BookOpen, Menu, X, Search, User as UserIcon, LogOut, BookMarked, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { useAuth } from "@/lib/auth-context"

const navLinks = [
  { label: "Trang Chủ", href: "/" },
  { label: "Thể Loại", href: "/the-loai" },
  { label: "Danh Sách", href: "/tim-kiem" },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [open, setOpen] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/tim-kiem?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery("")
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2 pr-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <span className="text-lg font-bold text-foreground">Virtus's Reader</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname === link.href
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Search */}
        <form onSubmit={handleSearch} className="hidden flex-1 md:flex md:max-w-sm md:ml-auto">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Tìm truyện..."
              className="h-9 pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>

        {/* Right Actions */}
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <ThemeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.username} className="h-6 w-6 rounded-full" />
                  ) : (
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-background ${user.avatarColor}`}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-foreground">{user.username}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                {(user.role === "MOD" || user.role === "ADMIN") && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/mod" className="flex items-center gap-2 text-primary font-medium">
                        <Shield className="h-4 w-4" />
                        Trang Quản Trị
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/tu-sach" className="flex items-center gap-2">
                    <BookMarked className="h-4 w-4" />
                    Tủ Sách
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="flex items-center gap-2 text-destructive">
                  <LogOut className="h-4 w-4" />
                  Đăng Xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex">
              <Button size="sm" asChild>
                <Link href="/dang-nhap">Dang Nhap</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="sr-only">Menu điều hướng</SheetTitle>
              <div className="flex flex-col gap-4 pt-4">
                <form onSubmit={(e) => { handleSearch(e); setOpen(false) }}>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Tìm truyện..."
                      className="pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </form>
                <nav className="flex flex-col gap-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        pathname === link.href
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                  {user && (
                    <>
                      {(user.role === "MOD" || user.role === "ADMIN") && (
                        <Link
                          href="/mod"
                          onClick={() => setOpen(false)}
                          className="rounded-md px-3 py-2 text-sm font-medium text-primary hover:bg-secondary flex items-center gap-2"
                        >
                          <Shield className="h-4 w-4" />
                          Trang Quản Trị
                        </Link>
                      )}
                      <Link
                        href="/tu-sach"
                        onClick={() => setOpen(false)}
                        className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground flex items-center gap-2"
                      >
                        <BookMarked className="h-4 w-4" />
                        Tủ Sách
                      </Link>
                    </>
                  )}
                </nav>
                {!user && (
                  <div className="border-t border-border pt-4">
                    <Button asChild onClick={() => setOpen(false)}>
                      <Link href="/dang-nhap">Dang Nhap</Link>
                    </Button>
                  </div>
                )}
                {user && (
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center gap-2 px-3 pb-3">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.username} className="h-8 w-8 rounded-full" />
                      ) : (
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-background ${user.avatarColor}`}>
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.username}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full justify-start text-destructive" onClick={() => { logout(); setOpen(false) }}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Đăng Xuất
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
