"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BottomNav } from "@/components/bottom-nav"
import { LoadingSpinner } from "@/components/loading-spinner"
import {
  ApiError,
  clearToken,
  getMe,
  getRecords,
  getSummary,
  getToken,
  type Me,
  type Summary,
  type VaccinationRecord,
} from "@/lib/api"

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export default function DashboardPage() {
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [records, setRecords] = useState<VaccinationRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login")
      return
    }
    Promise.all([getMe(), getSummary(), getRecords()])
      .then(([meData, summaryData, recordsData]) => {
        setMe(meData)
        setSummary(summaryData)
        setRecords(recordsData)
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          clearToken()
          router.replace("/login")
        }
      })
      .finally(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const self = me?.patients.find((p) => p.relation === "SELF") ?? me?.patients[0]
  const displayName = self?.fullName ?? "there"
  const firstName = displayName.split(" ")[0]
  const healthId = self?.healthId ?? "Not linked yet"

  return (
    <div className="min-h-screen bg-background">
      <div className="mobile-container bg-background pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary p-4 pb-6 rounded-b-3xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Avatar className="w-10 h-10 border-2 border-white">
                <AvatarFallback className="bg-white text-primary font-semibold text-sm">
                  {initials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-white font-semibold text-base">Hello, {firstName} 👋</h2>
                <p className="text-white/80 text-xs">Health ID: {healthId}</p>
              </div>
            </div>
            <Link href="/profile">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-9 w-9 bg-slate-700">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Button>
            </Link>
          </div>

          {/* Summary Cards */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            <Card className="min-w-[110px] bg-white/95 backdrop-blur p-3 border-0 shadow-md">
              <div className="text-2xl font-bold text-primary mb-0.5">{summary?.totalVaccines ?? 0}</div>
              <div className="text-xs text-muted-foreground">Total Vaccines</div>
            </Card>
            <Card className="min-w-[110px] bg-white/95 backdrop-blur p-3 border-0 shadow-md">
              <div className="text-2xl font-bold mb-0.5 text-primary">{summary?.nextDue ?? 0}</div>
              <div className="text-xs text-muted-foreground">Next Due</div>
            </Card>
            <Card className="min-w-[110px] bg-white/95 backdrop-blur p-3 border-0 shadow-md">
              <div className="text-2xl font-bold text-success mb-0.5">{summary?.certificates ?? 0}</div>
              <div className="text-xs text-muted-foreground">Certificates</div>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 pt-4 pb-3">
          <h3 className="font-semibold text-base text-foreground mb-2.5">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2.5">
            <Link href="/vaccines" className="mobile-card">
              <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-primary/20">
                <div className="flex flex-col items-center text-center gap-1.5">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-neutral-200">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  </div>
                  <span className="font-medium text-xs">View Vaccines</span>
                </div>
              </Card>
            </Link>

            <Link href="/certificates" className="mobile-card">
              <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-primary/20">
                <div className="flex flex-col items-center text-center gap-1.5">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-neutral-200">
                    <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        className="text-primary"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <span className="font-medium text-xs">Certificates</span>
                </div>
              </Card>
            </Link>

            <Link href="/family" className="mobile-card">
              <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-primary/20">
                <div className="flex flex-col items-center text-center gap-1.5">
                  <div className="w-11 h-11 bg-success/10 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                  </div>
                  <span className="font-medium text-xs">Add Family</span>
                </div>
              </Card>
            </Link>

            <Link href="/reminders" className="mobile-card">
              <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-primary/20">
                <div className="flex flex-col items-center text-center gap-1.5">
                  <div className="w-11 h-11 bg-orange-500/10 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </div>
                  <span className="font-medium text-xs">Reminders</span>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Vaccinations */}
        <div className="px-4 pb-3">
          <div className="flex items-center justify-between mb-2.5">
            <h3 className="font-semibold text-base text-foreground">Recent Vaccinations</h3>
            <Link href="/vaccines">
              <Button variant="ghost" size="sm" className="text-primary h-8 text-xs">
                View All
              </Button>
            </Link>
          </div>

          {records.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">No vaccination records yet.</p>
              <Link href="/vaccines">
                <Button size="sm">Add your first record</Button>
              </Link>
            </Card>
          ) : (
            <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {records.slice(0, 8).map((r) => (
                <Card key={r.id} className="min-w-[250px] p-3">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-9 h-9 bg-success/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {r.vaccine.name}
                        {r.doseNumber > 1 ? ` - Dose ${r.doseNumber}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(r.dateAdministered), "MMM d, yyyy")}
                      </p>
                    </div>
                    {r.verified ? (
                      <Badge className="bg-success text-success-foreground text-[10px] px-1.5 py-0.5">Verified</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                        Pending
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.provider?.name ?? "Provider not recorded"}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Health Updates */}
        <div className="px-4 pb-6">
          <h3 className="font-semibold text-base text-foreground mb-2.5">Health Updates</h3>
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20 p-3">
            <div className="flex gap-2.5">
              <svg className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
                />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground mb-1">New Vaccine Guidelines Released</p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                  The Ministry of Health has updated vaccination guidelines for adults. Check if you need any booster
                  doses.
                </p>
                <Button variant="link" size="sm" className="h-auto p-0 text-primary text-xs">
                  Read More →
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <BottomNav active="home" />
    </div>
  )
}
