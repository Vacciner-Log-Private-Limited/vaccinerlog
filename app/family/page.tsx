"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BottomNav } from "@/components/bottom-nav"
import { AddFamilyModal } from "@/components/add-family-modal"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useToast } from "@/components/toast-provider"
import {
  deletePatient,
  getPatients,
  getRecords,
  getToken,
  type Patient,
  type VaccinationRecord,
} from "@/lib/api"

const RELATION_LABEL: Record<string, string> = {
  SPOUSE: "Spouse",
  CHILD: "Child",
  PARENT: "Parent",
  SIBLING: "Sibling",
  OTHER: "Other",
}

const GENDER_LABEL: Record<string, string> = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function ageFromDob(dob?: string | null): string {
  if (!dob) return "—"
  const years = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000))
  return `${years} years`
}

export default function FamilyPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [records, setRecords] = useState<VaccinationRecord[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    return Promise.all([getPatients(), getRecords()])
      .then(([p, r]) => {
        setPatients(p)
        setRecords(r)
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false))
  }, [router])

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login")
      return
    }
    load()
  }, [router, load])

  const handleDelete = async (patient: Patient) => {
    if (!window.confirm(`Remove ${patient.fullName} and all their records?`)) return
    try {
      await deletePatient(patient.id)
      showToast(`${patient.fullName} removed.`, "success")
      setPatients((prev) => prev.filter((p) => p.id !== patient.id))
    } catch {
      showToast("Could not remove this member.", "error")
    }
  }

  const family = patients.filter((p) => p.relation !== "SELF")
  const recordCount = (patientId: string) =>
    records.filter((r) => r.patient?.id === patientId).length

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-background content-with-nav">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary p-6 pb-8 rounded-b-3xl">
          <div className="flex items-center justify-between mb-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white">My Family</h1>
            <div className="w-10" />
          </div>
          <p className="text-white/90 text-sm">Manage vaccination records for your family members</p>
        </div>

        <div className="p-6 pb-4">
          <Button
            className="w-full h-12 bg-success hover:bg-success/90"
            size="lg"
            onClick={() => setAddModalOpen(true)}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Family Member
          </Button>
        </div>

        {loading ? (
          <LoadingSpinner size="lg" />
        ) : (
          <div className="px-6 pb-6 space-y-3">
            {family.length === 0 && (
              <Card className="p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No family members yet. Add one to manage their records.
                </p>
              </Card>
            )}

            {family.map((member) => (
              <Card key={member.id} className="p-4 mobile-card">
                <div className="flex items-start gap-3 mb-4">
                  <Avatar className="w-14 h-14 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                      {initials(member.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{member.fullName}</h3>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {RELATION_LABEL[member.relation] ?? member.relation}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {ageFromDob(member.dob)}
                        {member.gender ? ` · ${GENDER_LABEL[member.gender] ?? member.gender}` : ""}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(member)}
                    aria-label={`Remove ${member.fullName}`}
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
                </div>

                <div className="grid grid-cols-2 gap-3 mb-1">
                  <div className="bg-accent/50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-primary mb-1">{recordCount(member.id)}</div>
                    <div className="text-xs text-muted-foreground">Total Vaccines</div>
                  </div>
                  <div className="bg-accent/50 rounded-lg p-3">
                    <div className="text-sm font-semibold text-foreground mb-1">
                      {member.healthId ?? "Not linked"}
                    </div>
                    <div className="text-xs text-muted-foreground">Health ID</div>
                  </div>
                </div>
              </Card>
            ))}

            {/* Info Card */}
            <Card className="bg-accent/50 border-primary/20 p-4">
              <div className="flex gap-3">
                <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Add Family Members</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Add the people you care for and manage their vaccination records from your account.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      <BottomNav active="family" />
      <AddFamilyModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} onAdded={load} />
    </div>
  )
}
