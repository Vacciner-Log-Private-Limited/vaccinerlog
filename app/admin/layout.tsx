"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import Link from "next/link"
import { Menu, Moon, Sun } from "lucide-react"
import { AdminSidebar } from "@/components/admin/sidebar"
import { Button } from "@/components/admin/ui"
import { getMe, getToken, logout } from "@/lib/api"

function Spinner() {
  return (
    <div className="min-h-screen bg-background grid place-items-center">
      <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [state, setState] = useState<"checking" | "ok" | "denied">("checking")
  const [email, setEmail] = useState("")
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login")
      return
    }
    getMe()
      .then((me) => {
        if (me.role === "ADMIN") {
          setEmail(me.email)
          setState("ok")
        } else {
          setState("denied")
          setTimeout(() => router.replace("/dashboard"), 1600)
        }
      })
      .catch(() => router.replace("/login"))
  }, [router])

  if (state === "checking") return <Spinner />

  if (state === "denied") {
    return (
      <div className="min-h-screen bg-background grid place-items-center p-6">
        <div className="text-center">
          <h1 className="text-lg font-semibold text-foreground">Admins only</h1>
          <p className="text-sm text-muted-foreground mt-1">
            This account doesn&apos;t have admin access. Taking you back to the app…
          </p>
        </div>
      </div>
    )
  }

  const handleLogout = () => {
    logout()
    router.replace("/login")
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminSidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        email={email}
        onLogout={handleLogout}
      />

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 h-16 bg-card/85 backdrop-blur border-b border-border flex items-center gap-3 px-4 sm:px-6">
          <button
            onClick={() => setMenuOpen(true)}
            className="lg:hidden text-muted-foreground hover:bg-muted rounded-lg p-2 -ml-2 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="lg:hidden font-semibold text-foreground">Admin</span>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg p-2 transition-colors"
              aria-label="Toggle light/dark theme"
              title="Toggle theme"
            >
              {mounted && theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link href="/dashboard">
              <Button variant="ghost">View app</Button>
            </Link>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
