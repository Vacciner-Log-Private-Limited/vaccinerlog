"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/loading-spinner"
import {
  ApiError,
  getDoctorPatientRecords,
  getToken,
  type DoctorEncounter,
  type DoctorPatientView,
} from "@/lib/api"
import { ConsultationNoteForm } from "@/components/consultation-note-form"
import { format } from "date-fns"

function age(dob: string | null): string {
  if (!dob) return "—"
  const y = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000))
  return `${y} yrs`
}

function mmss(iso: string | null): string {
  if (!iso) return "—"
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return "0:00"
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

export default function DoctorPatientPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const patientId = params.id
  const [data, setData] = useState<DoctorPatientView | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [, force] = useState(0)

  const load = useCallback(() => {
    getDoctorPatientRecords(patientId)
      .then((d) => {
        setData(d)
        setError(null)
      })
      .catch((err) => {
        if (err instanceof ApiError) setError(err.message)
        else router.replace("/doctor")
      })
      .finally(() => setLoading(false))
  }, [patientId, router])

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login")
      return
    }
    load()
  }, [router, load])

  // Tick for the countdown.
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="mobile-container">
        <div className="min-h-screen bg-background p-6 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg className="w-7 h-7 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <div>
            <p className="font-semibold text-foreground">Access unavailable</p>
            <p className="text-sm text-muted-foreground mt-1">{error ?? "Something went wrong."}</p>
          </div>
          <Link href="/doctor/scan">
            <Button>Start a new visit</Button>
          </Link>
        </div>
      </div>
    )
  }

  const p = data.patient

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-background pb-8">
        <div className="bg-gradient-to-r from-primary to-secondary p-6 pb-8 rounded-b-3xl">
          <div className="flex items-center gap-2 mb-3">
            <Link href="/doctor/scan">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white">{p.fullName}</h1>
          </div>
          <p className="text-white/90 text-sm">
            {age(p.dob)}
            {p.gender ? ` · ${p.gender.toLowerCase()}` : ""}
            {p.healthId ? ` · ${p.healthId}` : ""}
          </p>
        </div>

        <div className="p-6 space-y-4 -mt-4">
          {/* Session banner */}
          <div className="flex items-center gap-2 rounded-xl bg-accent/50 border border-primary/20 px-4 py-3">
            <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-foreground">
              Access ends in <span className="font-semibold tabular-nums">{mmss(data.session.expiresAt)}</span>
            </p>
          </div>

          {/* Clinical details */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-5">
            <h3 className="font-semibold text-foreground mb-3">Clinical health details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Conditions</p>
                {p.healthConditions.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {p.healthConditions.map((c) => (
                      <Badge key={c} variant="secondary" className="font-normal">{c}</Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-foreground">None recorded</p>
                )}
              </div>
              <Complication label="Prior clinical complications" has={p.hasPriorComplications} note={p.complicationNotes} />
              <Complication label="Prior surgical complications" has={p.hasSurgicalComplications} note={p.surgicalComplicationNotes} />

              {(p.height || p.weight) && (
                <div className="pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1.5">Body metrics &amp; BMI</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-muted/40 rounded-lg p-2 text-center border border-border/50">
                      <span className="text-[10px] text-muted-foreground block">Height</span>
                      <span className="font-semibold text-sm text-foreground">{p.height ? `${p.height} cm` : "—"}</span>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-2 text-center border border-border/50">
                      <span className="text-[10px] text-muted-foreground block">Weight</span>
                      <span className="font-semibold text-sm text-foreground">{p.weight ? `${p.weight} kg` : "—"}</span>
                    </div>
                    <div className="bg-muted/40 rounded-lg p-2 text-center border border-border/50">
                      <span className="text-[10px] text-muted-foreground block">BMI</span>
                      <span className="font-bold text-sm text-primary">
                        {p.height && p.weight ? (p.weight / ((p.height / 100) ** 2)).toFixed(1) : "—"}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vaccine records */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-5">
            <h3 className="font-semibold text-foreground mb-3">
              Vaccination records <span className="text-muted-foreground font-normal">({data.records.length})</span>
            </h3>
            {data.records.length === 0 ? (
              <p className="text-sm text-muted-foreground">No vaccination records yet.</p>
            ) : (
              <div className="space-y-2.5">
                {data.records.map((r) => (
                  <div key={r.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{r.vaccine.name}</span>
                        {r.verified && (
                          <span className="inline-flex items-center gap-1 text-xs text-success">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Dose {r.doseNumber} of {r.vaccine.totalDoses}
                        {r.provider ? ` · ${r.provider.name}` : ""}
                        {r.batchNumber ? ` · batch ${r.batchNumber}` : ""}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(r.dateAdministered), "dd MMM yyyy")}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Consultation note */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-5">
            <h3 className="font-semibold text-foreground mb-3">Consultation note</h3>
            <ConsultationNoteForm
              patientId={p.id}
              encounter={data.encounter}
              onSaved={(e: DoctorEncounter) =>
                setData((prev) => (prev ? { ...prev, encounter: e } : prev))
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function Complication({
  label,
  has,
  note,
}: {
  label: string
  has: boolean | null
  note: string | null
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {has === true ? (
        <p className="text-sm text-foreground">Yes{note ? ` — ${note}` : ""}</p>
      ) : has === false ? (
        <p className="text-sm text-foreground">No</p>
      ) : (
        <p className="text-sm text-muted-foreground">Not answered</p>
      )}
    </div>
  )
}
