"use client"

import { useCallback, useEffect, useState } from "react"
import QRCode from "qrcode"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/toast-provider"
import {
  ApiError,
  generateConsent,
  getActiveConsents,
  revokeConsent,
  type ActiveConsent,
  type ConsentGenerated,
  type ConsentScope,
  type Patient,
} from "@/lib/api"

function mmss(target: string): string {
  const ms = new Date(target).getTime() - Date.now()
  if (ms <= 0) return "0:00"
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
}

export function ShareWithDoctorModal({
  isOpen,
  onClose,
  patients,
}: {
  isOpen: boolean
  onClose: () => void
  patients: Patient[]
}) {
  const { showToast } = useToast()
  const [patientId, setPatientId] = useState("")
  const [scope, setScope] = useState<ConsentScope>("VIEW")
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState<ConsentGenerated | null>(null)
  const [qr, setQr] = useState("")
  const [active, setActive] = useState<ActiveConsent[]>([])
  const [, force] = useState(0)

  const loadActive = useCallback(() => {
    getActiveConsents().then(setActive).catch(() => setActive([]))
  }, [])

  useEffect(() => {
    if (isOpen) {
      const self = patients.find((p) => p.accessRole === "SELF") ?? patients[0]
      setPatientId(self?.id ?? "")
      setScope("VIEW")
      setGenerated(null)
      setQr("")
      loadActive()
    }
  }, [isOpen, patients, loadActive])

  // Tick every second so countdowns update.
  useEffect(() => {
    if (!isOpen) return
    const t = setInterval(() => force((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [isOpen])

  if (!isOpen) return null

  const generate = async () => {
    if (!patientId) {
      showToast("Choose whose records to share.", "error")
      return
    }
    setGenerating(true)
    try {
      const res = await generateConsent(patientId, scope)
      setGenerated(res)
      setQr(await QRCode.toDataURL(res.code, { width: 240, margin: 1 }))
      loadActive()
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Could not create a code.", "error")
    } finally {
      setGenerating(false)
    }
  }

  const revoke = async (c: ActiveConsent) => {
    try {
      await revokeConsent(c.id)
      showToast("Access revoked.", "success")
      loadActive()
      if (generated?.id === c.id) {
        setGenerated(null)
        setQr("")
      }
    } catch {
      showToast("Could not revoke.", "error")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center overflow-y-auto">
      <div className="bg-background w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold text-foreground">Share with a doctor</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Generate a one-time code the doctor scans or types. It expires in 15 minutes and access ends
          automatically — you can revoke it any time.
        </p>

        {generated ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-primary/30 bg-accent/40 p-5 flex flex-col items-center">
              {qr && <img src={qr} alt="Consent QR code" className="w-48 h-48 rounded-lg bg-white p-2" />}
              <div className="mt-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Code</p>
                <p className="text-2xl font-bold font-mono tracking-widest text-foreground">{generated.code}</p>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Expires in <span className="font-semibold text-foreground tabular-nums">{mmss(generated.expiresAt)}</span>
              </p>
            </div>
            <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground leading-relaxed">
              Sharing <span className="font-medium text-foreground">{generated.patientName}</span> ·{" "}
              {generated.scope === "VIEW_AND_RECORD" ? "view + let them add a record" : "view only"}.
              Show the QR to your doctor, or read out the code.
            </div>
            <Button variant="outline" className="w-full bg-transparent" onClick={() => { setGenerated(null); setQr("") }}>
              Generate another
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Whose records</Label>
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a profile" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.fullName}
                      {p.accessRole === "SELF" ? " (You)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>What the doctor can do</Label>
              <div className="flex gap-2 mt-1.5">
                <Button
                  type="button"
                  variant={scope === "VIEW" ? "default" : "outline"}
                  onClick={() => setScope("VIEW")}
                  className={`flex-1 ${scope === "VIEW" ? "" : "bg-transparent"}`}
                >
                  View only
                </Button>
                <Button
                  type="button"
                  variant={scope === "VIEW_AND_RECORD" ? "default" : "outline"}
                  onClick={() => setScope("VIEW_AND_RECORD")}
                  className={`flex-1 ${scope === "VIEW_AND_RECORD" ? "" : "bg-transparent"}`}
                >
                  View + record
                </Button>
              </div>
            </div>
            <Button onClick={generate} disabled={generating} className="w-full h-12">
              {generating ? "Generating…" : "Generate code"}
            </Button>
          </div>
        )}

        {/* Who has access now */}
        <div className="mt-6">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Access right now</Label>
          <div className="mt-2 space-y-2">
            {active.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active codes or sessions.</p>
            ) : (
              active.map((c) => (
                <div key={c.id} className="flex items-center gap-2 rounded-lg border border-border p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.patientName}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.status === "PENDING"
                        ? `Code waiting · expires in ${mmss(c.expiresAt)}`
                        : `${c.doctor?.name ?? "A doctor"} · ends in ${c.accessExpiresAt ? mmss(c.accessExpiresAt) : "—"}`}
                    </p>
                  </div>
                  <Badge variant={c.status === "USED" ? "default" : "secondary"} className="text-xs">
                    {c.status === "USED" ? "Active" : "Waiting"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => revoke(c)}
                  >
                    Revoke
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
