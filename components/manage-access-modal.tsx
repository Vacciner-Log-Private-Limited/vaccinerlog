"use client"

import type React from "react"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/toast-provider"
import {
  ApiError,
  createInvite,
  getAccessList,
  revokeAccess,
  type AccessEntry,
  type InviteResult,
  type Patient,
} from "@/lib/api"

interface ManageAccessModalProps {
  isOpen: boolean
  patient: Patient | null
  onClose: () => void
  onChanged?: () => void
}

export function ManageAccessModal({ isOpen, patient, onClose, onChanged }: ManageAccessModalProps) {
  const { showToast } = useToast()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [invite, setInvite] = useState<InviteResult | null>(null)
  const [entries, setEntries] = useState<AccessEntry[]>([])
  const [entriesLoading, setEntriesLoading] = useState(false)

  const loadEntries = useCallback(() => {
    if (!patient) return
    setEntriesLoading(true)
    getAccessList(patient.id)
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setEntriesLoading(false))
  }, [patient])

  useEffect(() => {
    if (isOpen && patient) {
      setEmail("")
      setInvite(null)
      loadEntries()
    }
  }, [isOpen, patient, loadEntries])

  if (!isOpen || !patient) return null

  const claimLink =
    invite && typeof window !== "undefined"
      ? `${window.location.origin}/claim?code=${encodeURIComponent(invite.code)}`
      : ""

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      showToast("Enter the email this person will sign in with.", "error")
      return
    }
    setLoading(true)
    try {
      const res = await createInvite(patient.id, email.trim())
      setInvite(res)
      showToast("Claim code generated.", "success")
      loadEntries()
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not generate a claim code."
      showToast(message, "error")
    } finally {
      setLoading(false)
    }
  }

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast(`${label} copied.`, "success")
    } catch {
      showToast("Copy failed — select and copy manually.", "error")
    }
  }

  const handleRevoke = async (entry: AccessEntry) => {
    if (!window.confirm(`Remove access for ${entry.email}?`)) return
    try {
      await revokeAccess(patient.id, entry.userId)
      showToast("Access removed.", "success")
      loadEntries()
      onChanged?.()
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not remove access."
      showToast(message, "error")
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center overflow-y-auto">
      <div className="bg-background w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold text-foreground">Shared access</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-5">
          Give <span className="font-medium text-foreground">{patient.fullName}</span> their own sign-in.
          You keep full access — you&apos;ll both manage this profile.
        </p>

        {/* Current access */}
        <div className="mb-6">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Who has access</Label>
          <div className="mt-2 space-y-2">
            {entriesLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.userId}
                  className="flex items-center gap-2 rounded-lg border border-border p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{entry.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.role === "SELF" ? "The person themselves" : "Guardian"}
                      {entry.isYou ? " · you" : ""}
                    </p>
                  </div>
                  <Badge variant={entry.role === "SELF" ? "default" : "secondary"} className="text-xs">
                    {entry.role === "SELF" ? "Owner" : "Guardian"}
                  </Badge>
                  {entries.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => handleRevoke(entry)}
                      aria-label={`Remove access for ${entry.email}`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {invite ? (
          /* Generated code view */
          <div className="space-y-4">
            <div className="rounded-xl border border-primary/30 bg-accent/50 p-4">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Claim code</Label>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 break-all rounded-lg bg-background px-3 py-2 text-sm font-mono">
                  {invite.code}
                </code>
                <Button type="button" size="sm" onClick={() => copy(invite.code, "Code")}>
                  Copy
                </Button>
              </div>
              <div className="mt-3">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Claim link</Label>
                <div className="mt-1 flex items-center gap-2">
                  <code className="flex-1 break-all rounded-lg bg-background px-3 py-2 text-xs font-mono">
                    {claimLink}
                  </code>
                  <Button type="button" size="sm" onClick={() => copy(claimLink, "Link")}>
                    Copy
                  </Button>
                </div>
              </div>
            </div>
            <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground leading-relaxed">
              Share this with <span className="font-medium text-foreground">{invite.email}</span>. They sign
              up (or log in) with that exact email, then open the link or paste the code at{" "}
              <span className="font-mono">/claim</span>. It works once and expires in 48 hours.
            </div>
            <Button variant="outline" className="w-full bg-transparent" onClick={() => setInvite(null)}>
              Generate another
            </Button>
          </div>
        ) : (
          /* Generate form */
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <Label htmlFor="invite-email">Their sign-in email</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="person@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                required
              />
              <p className="mt-1 text-xs text-muted-foreground">
                The claim code only works for an account with this email.
              </p>
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Generating…" : "Generate claim code"}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
