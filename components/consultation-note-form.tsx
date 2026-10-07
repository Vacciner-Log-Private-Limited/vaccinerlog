"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/toast-provider"
import {
  ApiError,
  saveConsultationNote,
  type DoctorEncounter,
} from "@/lib/api"

const PROBLEM_TAGS = [
  "Fever",
  "Respiratory",
  "Gastro",
  "Injury",
  "Pain",
  "Skin",
  "Infection",
  "Follow-up",
  "Routine check",
]

interface Rx {
  medicine: string
  dosage: string
  frequency: string
  durationDays: string
}

function toRx(e: DoctorEncounter | null): Rx[] {
  if (!e || e.prescriptions.length === 0) return [{ medicine: "", dosage: "", frequency: "", durationDays: "" }]
  return e.prescriptions.map((p) => ({
    medicine: p.medicine,
    dosage: p.dosage ?? "",
    frequency: p.frequency ?? "",
    durationDays: p.durationDays != null ? String(p.durationDays) : "",
  }))
}

export function ConsultationNoteForm({
  patientId,
  encounter,
  onSaved,
}: {
  patientId: string
  encounter: DoctorEncounter | null
  onSaved?: (e: DoctorEncounter) => void
}) {
  const { showToast } = useToast()
  const [problem, setProblem] = useState(encounter?.problem ?? "")
  const [tags, setTags] = useState<string[]>(encounter?.problemTags ?? [])
  const [recommendation, setRecommendation] = useState(encounter?.recommendation ?? "")
  const [prescriptionText, setPrescriptionText] = useState(encounter?.prescriptionText ?? "")
  const [shared, setShared] = useState(encounter?.sharedWithPatient ?? false)
  const [items, setItems] = useState<Rx[]>(toRx(encounter))
  const [saving, setSaving] = useState(false)

  const toggleTag = (t: string) =>
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))

  const setItem = (i: number, k: keyof Rx, v: string) =>
    setItems((prev) => prev.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)))

  const addItem = () => setItems((prev) => [...prev, { medicine: "", dosage: "", frequency: "", durationDays: "" }])
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i))

  const save = async () => {
    setSaving(true)
    try {
      const prescriptions = items
        .filter((r) => r.medicine.trim())
        .map((r) => ({
          medicine: r.medicine.trim(),
          dosage: r.dosage.trim() || undefined,
          frequency: r.frequency.trim() || undefined,
          durationDays: r.durationDays ? Number(r.durationDays) : undefined,
        }))
      const updated = await saveConsultationNote(patientId, {
        problem: problem.trim() || undefined,
        problemTags: tags,
        recommendation: recommendation.trim() || undefined,
        prescriptionText: prescriptionText.trim() || undefined,
        sharedWithPatient: shared,
        prescriptions,
      })
      showToast("Consultation note saved.", "success")
      onSaved?.(updated)
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Could not save the note.", "error")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* Problem */}
      <div>
        <Label htmlFor="problem">Problem / diagnosis</Label>
        <Textarea
          id="problem"
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="Chief complaint and findings"
          maxLength={2000}
          className="mt-1 min-h-20"
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {PROBLEM_TAGS.map((t) => {
            const on = tags.includes(t)
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  on
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:border-primary/40"
                }`}
              >
                {t}
              </button>
            )
          })}
        </div>
      </div>

      {/* Recommendation */}
      <div>
        <Label htmlFor="recommendation">Recommendation / advice</Label>
        <Textarea
          id="recommendation"
          value={recommendation}
          onChange={(e) => setRecommendation(e.target.value)}
          placeholder="Advice, tests, referral, next visit"
          maxLength={2000}
          className="mt-1 min-h-20"
        />
      </div>

      {/* Prescription */}
      <div>
        <Label>Prescription</Label>
        <div className="mt-1 space-y-2">
          {items.map((row, i) => (
            <div key={i} className="rounded-xl border border-border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={row.medicine}
                  onChange={(e) => setItem(i, "medicine", e.target.value)}
                  placeholder="Medicine"
                  className="flex-1"
                />
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    aria-label="Remove medicine"
                    className="text-muted-foreground hover:text-destructive p-1"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Input value={row.dosage} onChange={(e) => setItem(i, "dosage", e.target.value)} placeholder="Dose" className="h-9 text-sm" />
                <Input value={row.frequency} onChange={(e) => setItem(i, "frequency", e.target.value)} placeholder="Frequency" className="h-9 text-sm" />
                <Input
                  value={row.durationDays}
                  onChange={(e) => setItem(i, "durationDays", e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Days"
                  inputMode="numeric"
                  className="h-9 text-sm"
                />
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" className="w-full bg-transparent" onClick={addItem}>
            + Add medicine
          </Button>
          <Textarea
            value={prescriptionText}
            onChange={(e) => setPrescriptionText(e.target.value)}
            placeholder="Other instructions (optional)"
            maxLength={2000}
            className="min-h-16"
          />
        </div>
      </div>

      {/* Share toggle */}
      <div className="flex items-center justify-between rounded-xl border border-border p-3">
        <div>
          <p className="text-sm font-medium text-foreground">Share with patient</p>
          <p className="text-xs text-muted-foreground">Let them see this advice in their app.</p>
        </div>
        <Switch checked={shared} onCheckedChange={setShared} />
      </div>

      <Button onClick={save} disabled={saving} className="w-full h-12">
        {saving ? "Saving…" : "Save consultation note"}
      </Button>
    </div>
  )
}
