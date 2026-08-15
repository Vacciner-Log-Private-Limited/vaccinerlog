"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Syringe,
  Building2,
  ScrollText,
  Bell,
  LogOut,
  ShieldCheck,
} from "lucide-react"

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
]

const MANAGE = [
  { href: "/admin/vaccines", label: "Vaccines", icon: Syringe },
  { href: "/admin/providers", label: "Providers", icon: Building2 },
  { href: "/admin/certificates", label: "Certificates", icon: ScrollText },
  { href: "/admin/reminders", label: "Reminders", icon: Bell },
]

function NavLink({
  href,
  label,
  Icon,
  active,
  onClose,
}: {
  href: string
  label: string
  Icon: typeof Users
  active: boolean
  onClose: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon className="w-4.5 h-4.5" />
      {label}
    </Link>
  )
}

export function AdminSidebar({
  open,
  onClose,
  email,
  onLogout,
}: {
  open: boolean
  onClose: () => void
  email: string
  onLogout: () => void
}) {
  const pathname = usePathname()

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={onClose} aria-hidden />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 bg-card border-r border-border flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary grid place-items-center text-primary-foreground flex-shrink-0">
            <ShieldCheck className="w-4.5 h-4.5" strokeWidth={2.2} />
          </div>
          <div className="leading-tight">
            <p className="font-semibold text-foreground text-sm">Vacciner Log</p>
            <p className="text-[11px] text-muted-foreground">Admin</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Menu</p>
          <ul className="space-y-0.5">
            {NAV.map((item) => (
              <li key={item.href}>
                <NavLink
                  href={item.href}
                  label={item.label}
                  Icon={item.icon}
                  active={pathname === item.href}
                  onClose={onClose}
                />
              </li>
            ))}
          </ul>

          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-6 mb-1.5">
            Management
          </p>
          <ul className="space-y-0.5">
            {MANAGE.map((item) => (
              <li key={item.href}>
                <NavLink
                  href={item.href}
                  label={item.label}
                  Icon={item.icon}
                  active={pathname === item.href}
                  onClose={onClose}
                />
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer: admin + logout */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-muted grid place-items-center text-muted-foreground text-xs font-semibold flex-shrink-0">
              {email.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-foreground truncate">{email}</p>
              <p className="text-[11px] text-muted-foreground">Administrator</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="mt-1 w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <LogOut className="w-4.5 h-4.5" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  )
}
