"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/toast-provider"
import { ApiError, createReminder, type Patient, type Vaccine } from "@/lib/api"

interface AddReminderModalProps {
  isOpen: boolean
  onClose: () => void
  patients: Patient[]
  vaccines: Vaccine[]
  onAdded?: () => void
}

export function AddReminderModal({ isOpen, onClose, patients, vaccines, onAdded }: AddReminderModalProps) {
  const [patientId, setPatientId] = useState("")
  const [vaccineId, setVaccineId] = useState("")
  const [doseNumber, setDoseNumber] = useState("1")
  const [dueDate, setDueDate] = useState("")
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  if (!isOpen) return null

  const reset = () => {
    setPatientId("")
    setVaccineId("")
    setDoseNumber("1")
    setDueDate("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patientId || !vaccineId || !dueDate) {
      showToast("Please choose a person, a vaccine and a due date.", "error")
      return
    }
    setLoading(true)
    try {
      await createReminder({
        patientId,
        vaccineId,
        doseNumber: Number(doseNumber) || 1,
        dueDate,
      })
      showToast("Reminder added!", "success")
      reset()
      onClose()
      onAdded?.()
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not add reminder."
      showToast(message, "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center overflow-y-auto">
      <div className="bg-background w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Add Reminder</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="r-patient">Person</Label>
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
          </div>

          <div>
            <Label htmlFor="r-vaccine">Vaccine</Label>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="r-dose">Dose Number</Label>
              <Input
                id="r-dose"
                type="number"
                min={1}
                value={doseNumber}
                onChange={(e) => setDoseNumber(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="r-due">Due Date</Label>
              <Input
                id="r-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-orange-500 hover:bg-orange-600">
              {loading ? "Saving..." : "Add Reminder"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
