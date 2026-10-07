"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/loading-spinner"
import { DoctorBottomNav } from "@/components/doctor-bottom-nav"
import {
  getDoctorHistory,
  getToken,
  type DoctorEncounterSummary,
} from "@/lib/api"

export default function DoctorHistoryPage() {
  const router = useRouter()
  const [items, setItems] = useState<DoctorEncounterSummary[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    getDoctorHistory()
      .then(setItems)
      .catch(() => router.replace("/doctor"))
      .finally(() => setLoading(false))
  }, [router])

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login")
      return
    }
    load()
  }, [router, load])

  const uniquePatients = useMemo(
    () => new Set(items.map((i) => i.patientId)).size,
    [items],
  )

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-background content-with-nav">
        <div className="bg-gradient-to-r from-primary to-secondary p-6 pb-8 rounded-b-3xl">
          <h1 className="text-2xl font-bold text-white mb-1">History</h1>
          <p className="text-white/90 text-sm">
            {items.length} visit{items.length === 1 ? "" : "s"} · {uniquePatients} patient
            {uniquePatients === 1 ? "" : "s"} seen
          </p>
        </div>

        {loading ? (
          <LoadingSpinner size="lg" />
        ) : (
          <div className="p-6 space-y-3">
            {items.length === 0 && (
              <div className="bg-card rounded-2xl border border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No visits yet. Start one from the “New visit” tab when a patient shares their code.
                </p>
                <Link href="/doctor/scan">
                  <Button className="mt-4">Start a visit</Button>
                </Link>
              </div>
            )}

            {items.map((e) => (
              <div key={e.id} className="bg-card rounded-2xl border border-border shadow-sm p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground">{e.patientName}</h3>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(e.occurredAt), "dd MMM yyyy · h:mm a")}
                    </p>
                  </div>
                  {e.sharedWithPatient && (
                    <Badge variant="secondary" className="text-xs flex-shrink-0">Shared</Badge>
                  )}
                </div>

                {e.problem ? (
                  <p className="text-sm text-foreground mt-2">{e.problem}</p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-2 italic">No note recorded</p>
                )}

                {e.problemTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {e.problemTags.map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {e.recommendation && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    <span className="font-medium text-foreground">Advice:</span> {e.recommendation}
                  </p>
                )}

                {e.prescriptionCount > 0 && (
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {e.prescriptionCount} medicine{e.prescriptionCount === 1 ? "" : "s"} prescribed
                  </p>
                )}
              </div>
            ))}

            {items.length > 0 && (
              <p className="text-center text-xs text-muted-foreground pt-2">
                To view a patient’s current records again, ask them to share a new code.
              </p>
            )}
          </div>
        )}
      </div>

      <DoctorBottomNav active="history" />
    </div>
  )
}
