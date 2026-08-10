"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/toast-provider"
import {
  ApiError,
  createRecord,
  updateRecord,
  type Patient,
  type Provider,
  type Vaccine,
  type VaccinationRecord,
} from "@/lib/api"

interface AddRecordModalProps {
  isOpen: boolean
  onClose: () => void
  patients: Patient[]
  vaccines: Vaccine[]
  providers: Provider[]
  onSaved?: () => void
  editRecord?: VaccinationRecord | null
}

export function AddRecordModal({
  isOpen,
  onClose,
  patients,
  vaccines,
  providers,
  onSaved,
  editRecord,
}: AddRecordModalProps) {
  const isEdit = !!editRecord
  const [patientId, setPatientId] = useState("")
  const [vaccineId, setVaccineId] = useState("")
  const [providerId, setProviderId] = useState("")
  const [doseNumber, setDoseNumber] = useState("1")
  const [date, setDate] = useState("")
  const [batchNumber, setBatchNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  // Pre-fill when opening in edit mode; reset when opening for a new record.
  useEffect(() => {
    if (!isOpen) return
    if (editRecord) {
      setPatientId(editRecord.patient?.id ?? "")
      setVaccineId(editRecord.vaccine.id)
      setProviderId(editRecord.provider?.id ?? "")
      setDoseNumber(String(editRecord.doseNumber))
      setDate(editRecord.dateAdministered.slice(0, 10))
      setBatchNumber(editRecord.batchNumber ?? "")
    } else {
      setPatientId("")
      setVaccineId("")
      setProviderId("")
      setDoseNumber("1")
      setDate("")
      setBatchNumber("")
    }
  }, [isOpen, editRecord])

  if (!isOpen) return null

  const patientName =
    patients.find((p) => p.id === patientId)?.fullName ?? editRecord?.patient?.fullName ?? "—"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!isEdit && !patientId) || !vaccineId || !date) {
      showToast("Please choose a person, a vaccine and a date.", "error")
      return
    }
    setLoading(true)
    try {
      if (isEdit && editRecord) {
        await updateRecord(editRecord.id, {
          vaccineId,
          providerId: providerId || null,
          doseNumber: Number(doseNumber) || 1,
          dateAdministered: date,
          batchNumber: batchNumber || undefined,
        })
        showToast("Record updated!", "success")
      } else {
        await createRecord({
          patientId,
          vaccineId,
          providerId: providerId || undefined,
          doseNumber: Number(doseNumber) || 1,
          dateAdministered: date,
          batchNumber: batchNumber || undefined,
        })
        showToast("Vaccination record added!", "success")
      }
      onClose()
      onSaved?.()
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not save record."
      showToast(message, "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center overflow-y-auto">
      <div className="bg-background w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">
            {isEdit ? "Edit Vaccination Record" : "Add Vaccination Record"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="patient">Person</Label>
            {isEdit ? (
              <Input value={patientName} disabled className="mt-1 opacity-70" />
            ) : (
              <Select value={patientId} onValueChange={setPatientId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select person" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.fullName}
                      {p.relation === "SELF" ? " (You)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <Label htmlFor="vaccine">Vaccine</Label>
            <Select value={vaccineId} onValueChange={setVaccineId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select vaccine" />
              </SelectTrigger>
              <SelectContent>
                {vaccines.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="provider">Hospital / Provider</Label>
            <Select value={providerId} onValueChange={setProviderId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select provider (optional)" />
              </SelectTrigger>
              <SelectContent>
                {providers.map((pr) => (
                  <SelectItem key={pr.id} value={pr.id}>
                    {pr.name}
                    {pr.city ? ` — ${pr.city}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="dose">Dose Number</Label>
              <Input
                id="dose"
                type="number"
                min={1}
                value={doseNumber}
                onChange={(e) => setDoseNumber(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="date">Date Given</Label>
              <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
            </div>
          </div>

          <div>
            <Label htmlFor="batch">Batch Number (optional)</Label>
            <Input
              id="batch"
              type="text"
              placeholder="e.g. LOT-12345"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Saving..." : isEdit ? "Save Changes" : "Add Record"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
