"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/toast-provider"
import { ApiError, createPatient } from "@/lib/api"

interface AddFamilyModalProps {
  isOpen: boolean
  onClose: () => void
  onAdded?: () => void
}

// Maps the friendly dropdown value to the backend Relation enum + a gender guess.
const RELATION_MAP: Record<string, { relation: string; gender?: string }> = {
  spouse: { relation: "SPOUSE" },
  son: { relation: "CHILD", gender: "MALE" },
  daughter: { relation: "CHILD", gender: "FEMALE" },
  father: { relation: "PARENT", gender: "MALE" },
  mother: { relation: "PARENT", gender: "FEMALE" },
  brother: { relation: "SIBLING", gender: "MALE" },
  sister: { relation: "SIBLING", gender: "FEMALE" },
  other: { relation: "OTHER" },
}

export function AddFamilyModal({ isOpen, onClose, onAdded }: AddFamilyModalProps) {
  const [name, setName] = useState("")
  const [relation, setRelation] = useState("")
  const [gender, setGender] = useState("")
  const [dob, setDob] = useState("")
  const [healthId, setHealthId] = useState("")
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  if (!isOpen) return null

  const reset = () => {
    setName("")
    setRelation("")
    setGender("")
    setDob("")
    setHealthId("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !relation) {
      showToast("Please enter a name and relationship.", "error")
      return
    }
    const mapped = RELATION_MAP[relation] ?? { relation: "OTHER" }
    setLoading(true)
    try {
      await createPatient({
        fullName: name,
        relation: mapped.relation,
        gender: gender || mapped.gender, // explicit choice overrides the guess
        dob: dob || undefined,
        healthId: healthId || undefined,
      })
      showToast("Family member added successfully!", "success")
      reset()
      onClose()
      onAdded?.()
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not add family member."
      showToast(message, "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center overflow-y-auto">
      <div className="bg-background w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Add Family Member</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="relation">Relationship</Label>
            <Select value={relation} onValueChange={setRelation} required>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="spouse">Spouse</SelectItem>
                <SelectItem value="son">Son</SelectItem>
                <SelectItem value="daughter">Daughter</SelectItem>
                <SelectItem value="father">Father</SelectItem>
                <SelectItem value="mother">Mother</SelectItem>
                <SelectItem value="brother">Brother</SelectItem>
                <SelectItem value="sister">Sister</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="gender">Gender</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="dob">Date of Birth (for age)</Label>
            <Input
              id="dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="healthId">Aadhaar / ABHA Number (optional)</Label>
            <Input
              id="healthId"
              type="text"
              placeholder="Enter Aadhaar or ABHA number"
              value={healthId}
              onChange={(e) => setHealthId(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Adding..." : "Add Member"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
