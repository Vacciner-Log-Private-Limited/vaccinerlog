"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BottomNav } from "@/components/bottom-nav"
import { LoadingSpinner } from "@/components/loading-spinner"
import { AddRecordModal } from "@/components/add-record-modal"
import { useToast } from "@/components/toast-provider"
import {
  getPatients,
  getProviders,
  getRecords,
  getToken,
  getVaccines,
  issueCertificate,
  type Patient,
  type Provider,
  type Vaccine,
  type VaccinationRecord,
} from "@/lib/api"

function ageLabel(dob?: string | null): string {
  if (!dob) return ""
  const years = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000))
  return years >= 0 ? ` · ${years} yrs` : ""
}

export default function VaccinesPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [records, setRecords] = useState<VaccinationRecord[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [vaccines, setVaccines] = useState<Vaccine[]>([])
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [personFilter, setPersonFilter] = useState("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [editRecord, setEditRecord] = useState<VaccinationRecord | null>(null)
  const [generatingId, setGeneratingId] = useState<string | null>(null)

  const load = useCallback(() => {
    return Promise.all([getRecords(), getPatients(), getVaccines(), getProviders()])
      .then(([r, p, v, pr]) => {
        setRecords(r)
        setPatients(p)
        setVaccines(v)
        setProviders(pr)
      })
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false))
  }, [router])

  const openAdd = () => {
    setEditRecord(null)
    setAddOpen(true)
  }
  const openEdit = (r: VaccinationRecord) => {
    setEditRecord(r)
    setAddOpen(true)
  }
  const closeModal = () => {
    setAddOpen(false)
    setEditRecord(null)
  }

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login")
      return
    }
    load()
  }, [router, load])

  const handleGenerate = async (id: string) => {
    setGeneratingId(id)
    try {
      await issueCertificate(id)
      showToast("Certificate generated!", "success")
      await load()
    } catch {
      showToast("Could not generate certificate.", "error")
    } finally {
      setGeneratingId(null)
    }
  }

  const filtered = records.filter((r) => {
    const dateStr = format(new Date(r.dateAdministered), "MMM d, yyyy").toLowerCase()
    const q = searchQuery.toLowerCase()
    const matchesSearch =
      r.vaccine.name.toLowerCase().includes(q) ||
      dateStr.includes(q) ||
      (r.provider?.name.toLowerCase().includes(q) ?? false) ||
      (r.patient?.fullName.toLowerCase().includes(q) ?? false)
    const matchesFilter = filter === "all" || (filter === "verified" && r.verified)
    const matchesPerson = personFilter === "all" || r.patient?.id === personFilter
    return matchesSearch && matchesFilter && matchesPerson
  })

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
            <h1 className="text-2xl font-bold text-white">My Vaccines</h1>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={openAdd}
              aria-label="Add record"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input
              type="text"
              placeholder="Search by vaccine name or date"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-white"
            />
          </div>
        </div>

        {/* Filters: person + status */}
        <div className="p-6 pb-4 grid grid-cols-2 gap-3">
          <Select value={personFilter} onValueChange={setPersonFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Person" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All people</SelectItem>
              {patients.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.fullName}
                  {p.relation === "SELF" ? " (You)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vaccines</SelectItem>
              <SelectItem value="verified">Verified Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Vaccine List */}
        {loading ? (
          <LoadingSpinner size="lg" />
        ) : (
          <div className="px-6 pb-6 space-y-3">
            {filtered.length === 0 && (
              <Card className="p-6 text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  {records.length === 0 ? "No vaccination records yet." : "No records match your search."}
                </p>
                {records.length === 0 && <Button onClick={openAdd}>Add your first record</Button>}
              </Card>
            )}

            {filtered.map((r) => (
              <Card
                key={r.id}
                className="p-4 mobile-card cursor-pointer"
                onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">{r.vaccine.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Dose {r.doseNumber}
                      {r.vaccine.totalDoses > 1 ? ` of ${r.vaccine.totalDoses}` : ""}
                    </p>
                    {r.patient && (
                      <span className="inline-flex items-center gap-1 mt-1.5 text-xs text-primary bg-primary/10 rounded-full px-2 py-0.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {r.patient.fullName}
                        {ageLabel(r.patient.dob)}
                      </span>
                    )}
                  </div>
                  {r.verified ? (
                    <Badge className="bg-success text-success-foreground">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Verified
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Pending</Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    {format(new Date(r.dateAdministered), "MMM d, yyyy")}
                  </div>
                </div>

                <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <span>{r.provider?.name ?? "Provider not recorded"}</span>
                </div>

                {expandedId === r.id && (
                  <div className="pt-3 border-t border-border space-y-2 animate-fade-in">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Person:</span>
                      <span className="font-medium">{r.patient?.fullName ?? "—"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Batch Number:</span>
                      <span className="font-medium">{r.batchNumber ?? "—"}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-medium">{r.verified ? "Verified" : "Pending"}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">Symptoms:</span>
                      <p className="font-medium mt-0.5">{r.symptoms || "None reported"}</p>
                    </div>

                    {r.certificate ? (
                      <Link href={`/verify/${r.certificate.verificationCode}`} onClick={(e) => e.stopPropagation()}>
                        <Button variant="outline" className="w-full mt-3 bg-transparent" size="sm">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          View Certificate
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        className="w-full mt-3"
                        size="sm"
                        disabled={generatingId === r.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleGenerate(r.id)
                        }}
                      >
                        {generatingId === r.id ? "Generating..." : "Generate Certificate"}
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      className="w-full mt-2 bg-transparent"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        openEdit(r)
                      }}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Edit Record
                    </Button>
                  </div>
                )}

                {expandedId !== r.id && (
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    View Details
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNav active="vaccines" />
      <AddRecordModal
        isOpen={addOpen}
        onClose={closeModal}
        patients={patients}
        vaccines={vaccines}
        providers={providers}
        editRecord={editRecord}
        onSaved={load}
      />
    </div>
  )
}
