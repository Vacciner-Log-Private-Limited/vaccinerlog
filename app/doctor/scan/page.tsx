"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/loading-spinner"
import { DoctorBottomNav } from "@/components/doctor-bottom-nav"
import { useToast } from "@/components/toast-provider"
import { ApiError, consumeConsent, getDoctorMe, getToken } from "@/lib/api"

export default function DoctorScanPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [checking, setChecking] = useState(true)
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)

  const guard = useCallback(() => {
    getDoctorMe()
      .then((d) => {
        if (d.status !== "APPROVED") {
          showToast("Your account isn't approved yet.", "info")
          router.replace("/doctor")
        }
      })
      .catch(() => router.replace("/doctor"))
      .finally(() => setChecking(false))
  }, [router, showToast])

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login")
      return
    }
    guard()
  }, [router, guard])

  const start = async () => {
    if (code.trim().length < 6) {
      showToast("Enter the code the patient is showing you.", "error")
      return
    }
    setLoading(true)
    try {
      const res = await consumeConsent(code.trim())
      showToast("Visit started.", "success")
      router.push(`/doctor/patients/${res.patient.id}`)
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Could not start the visit.", "error")
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-background content-with-nav">
        <div className="bg-gradient-to-r from-primary to-secondary p-6 pb-10 rounded-b-3xl">
          <div className="flex items-center gap-2 mb-3">
            <Link href="/doctor">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white">New visit</h1>
          </div>
          <p className="text-white/90 text-sm">
            Ask the patient to open “Share with a doctor” and read out the code (or show the QR).
          </p>
        </div>

        <div className="p-6 space-y-4 -mt-4">
          <div className="bg-card rounded-2xl shadow-lg p-5 space-y-4">
            <div>
              <Label htmlFor="code">Patient code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && start()}
                placeholder="e.g. SC87JGU7JE"
                className="mt-1 font-mono tracking-widest text-lg h-12"
                autoCapitalize="characters"
                autoComplete="off"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                The code works once and expires 15 minutes after the patient generates it.
              </p>
            </div>
            <Button onClick={start} disabled={loading} className="w-full h-12">
              {loading ? "Starting…" : "Start visit"}
            </Button>
          </div>
        </div>
      </div>
      <DoctorBottomNav active="scan" />
    </div>
  )
}
