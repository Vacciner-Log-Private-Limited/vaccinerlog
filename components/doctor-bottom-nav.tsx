"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

interface DoctorBottomNavProps {
  active?: "home" | "appointments" | "scan" | "community" | "history"
}

export function DoctorBottomNav({ active }: DoctorBottomNavProps) {
  const pathname = usePathname()

  const navItems = [
    {
      id: "home",
      label: "Home",
      href: "/doctor",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      ),
    },
    {
      id: "appointments",
      label: "Appts",
      href: "/doctor/appointments",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      ),
    },
    {
      id: "scan",
      label: "New visit",
      href: "/doctor/scan",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v1m0 14v1m8-8h-1M5 12H4m1.6-6.4l.7.7m12.1-.7l-.7.7M6.3 17.7l-.7.7m12.8-.7l.7.7M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      ),
    },
    {
      id: "community",
      label: "Community",
      href: "/doctor/community",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      ),
    },
    {
      id: "history",
      label: "History",
      href: "/doctor/history",
      icon: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
      <div className="mobile-container">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = active === item.id || pathname === item.href
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <svg
                  className={`w-6 h-6 ${isActive ? "stroke-[2.5]" : "stroke-2"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {item.icon}
                </svg>
                <span className={`text-xs ${isActive ? "font-semibold" : "font-medium"}`}>{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
