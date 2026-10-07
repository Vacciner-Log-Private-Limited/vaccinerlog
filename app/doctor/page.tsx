"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/loading-spinner"
import { DoctorBottomNav } from "@/components/doctor-bottom-nav"
import {
  ApiError,
  getDoctorAnalytics,
  getDoctorMe,
  getToken,
  logout,
  type DoctorAnalytics,
  type DoctorProfile,
} from "@/lib/api"

const STATUS_UI: Record<
  DoctorProfile["status"],
  { tone: string; badge: string; title: string; body: string }
> = {
  PENDING: {
    tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    badge: "Awaiting approval",
    title: "Your account is under review",
    body: "An administrator is verifying your medical registration number. You'll be able to see patients once you're approved.",
  },
  APPROVED: {
    tone: "bg-success/15 text-success",
    badge: "Verified",
    title: "You're verified",
    body: "Start a visit by scanning the patient's code — then view their records and write a consultation note.",
  },
  REJECTED: {
    tone: "bg-destructive/10 text-destructive",
    badge: "Not approved",
    title: "Your account wasn't approved",
    body: "Please contact the platform administrator to review your registration details.",
  },
}

export default function DoctorHomePage() {
  const router = useRouter()
  const [doctor, setDoctor] = useState<DoctorProfile | null>(null)
  const [analytics, setAnalytics] = useState<DoctorAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    getDoctorMe()
      .then((d) => {
        setDoctor(d)
        if (d.status === "APPROVED") {
          getDoctorAnalytics().then(setAnalytics).catch(() => setAnalytics(null))
        }
      })
      .catch((err) => {
        // Not a doctor account → send them to the citizen app.
        if (err instanceof ApiError && err.status === 404) router.replace("/dashboard")
        else router.replace("/login")
      })
      .finally(() => setLoading(false))
  }, [router])

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login")
      return
    }
    load()
  }, [router, load])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }
  if (!doctor) return null

  const ui = STATUS_UI[doctor.status]

  const handleLogout = () => {
    logout()
    router.replace("/login")
  }

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-background content-with-nav">
        <div className="bg-gradient-to-r from-primary to-secondary p-6 pb-10 rounded-b-3xl">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Doctor</h1>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-white/20">
              Sign out
            </Button>
          </div>
          <p className="text-white/90 text-sm">Dr. {doctor.fullName.replace(/^Dr\.?\s*/i, "")}</p>
        </div>

        <div className="p-6 space-y-4 -mt-4">
          {/* Status card */}
          <div className="bg-card rounded-2xl shadow-lg p-5">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${ui.tone}`}>
              {ui.badge}
            </span>
            <h2 className="text-lg font-semibold text-foreground mt-3">{ui.title}</h2>
            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{ui.body}</p>
            {doctor.status === "APPROVED" && (
              <div className="flex flex-col gap-2 mt-4">
                <Link href="/doctor/scan">
                  <Button className="w-full h-12">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m0 14v1m8-8h-1M5 12H4m1.6-6.4l.7.7m12.1-.7l-.7.7M6.3 17.7l-.7.7m12.8-.7l.7.7M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Start a visit
                  </Button>
                </Link>
                <Link href="/doctor/community">
                  <Button variant="outline" className="w-full h-11 border-primary/20 text-primary hover:bg-primary/5">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    Research & Community
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Analytics (approved doctors) */}
          {doctor.status === "APPROVED" && analytics && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <StatTile label="Patients seen" value={analytics.totals.uniquePatients} />
                <StatTile label="Visits" value={analytics.totals.visits} />
                <StatTile label="Prescriptions" value={analytics.totals.prescriptions} />
                <StatTile label="Notes shared" value={analytics.totals.shared} />
              </div>

              {analytics.totals.visits > 0 && (
                <div className="bg-card rounded-2xl shadow-sm border border-border p-5">
                  <h3 className="font-semibold text-foreground mb-3">Visits by month</h3>
                  <MonthBars data={analytics.visitsByMonth} />
                </div>
              )}

              {analytics.topProblems.length > 0 && (
                <div className="bg-card rounded-2xl shadow-sm border border-border p-5">
                  <h3 className="font-semibold text-foreground mb-3">Top problems</h3>
                  <BarList data={analytics.topProblems} />
                </div>
              )}

              {analytics.topMedicines.length > 0 && (
                <div className="bg-card rounded-2xl shadow-sm border border-border p-5">
                  <h3 className="font-semibold text-foreground mb-3">Most prescribed</h3>
                  <BarList data={analytics.topMedicines} />
                </div>
              )}
            </>
          )}

          {/* Profile summary */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-5 space-y-3">
            <h3 className="font-semibold text-foreground">Your details</h3>
            <Row label="Name" value={doctor.fullName} />
            <Row label="Registration no." value={doctor.registrationNumber} />
            <Row label="Specialization" value={doctor.specialization ?? "—"} />
            <Row label="Clinic" value={doctor.clinicName ?? "—"} />
            <Row label="City" value={doctor.city ?? "—"} />
            <Row label="Email" value={doctor.email} />
          </div>
        </div>
      </div>
      <DoctorBottomNav active="home" />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right truncate">{value}</span>
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-4">
      <div className="text-2xl font-bold text-foreground tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
    </div>
  )
}

function BarList({ data }: { data: { name: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.name}>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-foreground truncate pr-2">{d.name}</span>
            <span className="text-muted-foreground tabular-nums flex-shrink-0">{d.count}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${(d.count / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function MonthBars({ data }: { data: { month: string; count: number }[] }) {
  const max = Math.max(...data.map((d) => d.count), 1)
  return (
    <div className="flex items-end justify-between gap-2 h-28">
      {data.map((d) => (
        <div key={d.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
          <span className="text-xs text-muted-foreground tabular-nums">{d.count || ""}</span>
          <div
            className="w-full bg-primary/80 rounded-t-md min-h-[2px]"
            style={{ height: `${(d.count / max) * 100}%` }}
          />
          <span className="text-[10px] text-muted-foreground">{d.month}</span>
        </div>
      ))}
    </div>
  )
}
