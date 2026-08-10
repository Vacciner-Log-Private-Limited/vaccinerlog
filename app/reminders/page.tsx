"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BottomNav } from "@/components/bottom-nav"
import { LoadingSpinner } from "@/components/loading-spinner"
import { AddReminderModal } from "@/components/add-reminder-modal"
import { useToast } from "@/components/toast-provider"
import {
  completeReminder,
  deleteReminder,
  getPatients,
  getReminders,
  getToken,
  getVaccines,
  type Patient,
  type Reminder,
  type Vaccine,
} from "@/lib/api"

const DAY = 24 * 60 * 60 * 1000

function daysLeft(dueDate: string): number {
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / DAY)
}

export default function RemindersPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [reminders, setReminders] = useState<Reminder[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [vaccines, setVaccines] = useState<Vaccine[]>([])
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)

  const load = useCallback(() => {
    return Promise.all([getReminders(), getPatients(), getVaccines()])
      .then(([r, p, v]) => {
        setReminders(r)
        setPatients(p)
        setVaccines(v)
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

  const handleComplete = async (id: string) => {
    try {
      await completeReminder(id)
      showToast("Marked as done!", "success")
      setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, status: "DONE" } : r)))
    } catch {
      showToast("Could not update reminder.", "error")
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this reminder?")) return
    try {
      await deleteReminder(id)
      showToast("Reminder deleted.", "success")
      setReminders((prev) => prev.filter((r) => r.id !== id))
    } catch {
      showToast("Could not delete reminder.", "error")
    }
  }

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-background content-with-nav">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 pb-8 rounded-b-3xl">
          <div className="flex items-center justify-between mb-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white">Reminders</h1>
            <div className="w-10" />
          </div>
          <p className="text-white/90 text-sm">Never miss a vaccination with timely reminders</p>
        </div>

        {/* Add Reminder Button */}
        <div className="p-6 pb-4">
          <Button
            className="w-full h-12 bg-orange-500 hover:bg-orange-600"
            size="lg"
            onClick={() => setAddOpen(true)}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Custom Reminder
          </Button>
        </div>

        {/* Reminders List */}
        {loading ? (
          <LoadingSpinner size="lg" />
        ) : (
          <div className="px-6 pb-6 space-y-3">
            {reminders.length === 0 && (
              <Card className="p-6 text-center">
                <p className="text-sm text-muted-foreground">No reminders yet. Add one to stay on schedule.</p>
              </Card>
            )}

            {reminders.map((r) => {
              const left = daysLeft(r.dueDate)
              const done = r.status === "DONE"
              const overdue = !done && left < 0
              return (
                <Card key={r.id} className="p-4 mobile-card">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">
                        {r.vaccine.name}
                        {r.doseNumber > 1 ? ` - Dose ${r.doseNumber}` : ""}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">For {r.patient.fullName}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {done ? (
                          <Badge className="bg-success text-success-foreground">Completed</Badge>
                        ) : overdue ? (
                          <Badge className="bg-destructive text-destructive-foreground">Overdue</Badge>
                        ) : (
                          <Badge className="bg-orange-500 text-white">Upcoming</Badge>
                        )}
                        {!done && (
                          <span className="text-xs text-muted-foreground">
                            {overdue ? `${-left} days overdue` : `${left} days left`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Due {format(new Date(r.dueDate), "MMM d, yyyy")}</span>
                  </div>

                  {!done && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-transparent"
                        onClick={() => handleComplete(r.id)}
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Mark as Done
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(r.id)}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </Button>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <BottomNav />
      <AddReminderModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        patients={patients}
        vaccines={vaccines}
        onAdded={load}
      />
    </div>
  )
}
