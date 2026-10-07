"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import {
  Calendar,
  Clock,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Video,
  Building2,
  ArrowRight,
  ShieldCheck,
  Activity,
  HeartPulse,
  Sparkles,
  Phone,
  MessageSquare,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LoadingSpinner } from "@/components/loading-spinner"
import { DoctorBottomNav } from "@/components/doctor-bottom-nav"
import { useToast } from "@/components/ui/use-toast"
import {
  getDoctorMe,
  getDoctorAppointments,
  scheduleDoctorAppointment,
  declineDoctorAppointment,
  startDoctorAppointmentVisit,
  getToken,
  type DoctorProfile,
  type Appointment,
  type AppointmentStatus,
} from "@/lib/api"

export default function DoctorAppointmentsPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  // Active Queue Tab
  const [activeTab, setActiveTab] = useState<"pending" | "scheduled" | "past">("pending")

  // Schedule Modal State
  const [scheduleTarget, setScheduleTarget] = useState<Appointment | null>(null)
  const [scheduledDateTime, setScheduledDateTime] = useState("")
  const [durationMinutes, setDurationMinutes] = useState(30)
  const [doctorNote, setDoctorNote] = useState("")
  const [scheduling, setScheduling] = useState(false)

  // Decline Modal State
  const [declineTarget, setDeclineTarget] = useState<Appointment | null>(null)
  const [declineReason, setDeclineReason] = useState("")
  const [declining, setDeclining] = useState(false)

  // Starting visit loading state
  const [startingVisitId, setStartingVisitId] = useState<string | null>(null)

  const loadAppointments = useCallback(async () => {
    try {
      const data = await getDoctorAppointments()
      setAppointments(data)
    } catch (err: any) {
      toast({
        title: "Could not load appointments",
        description: err?.message || "Please refresh and try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login")
      return
    }

    getDoctorMe()
      .then((d) => {
        setDoctor(d)
        if (d.status === "APPROVED") {
          loadAppointments()
        } else {
          setLoading(false)
        }
      })
      .catch(() => router.replace("/login"))
  }, [router, loadAppointments])

  // Category counts
  const pendingList = appointments.filter((a) => a.status === "REQUESTED")
  const scheduledList = appointments.filter((a) => a.status === "CONFIRMED")
  const pastList = appointments.filter(
    (a) => a.status === "COMPLETED" || a.status === "DECLINED" || a.status === "CANCELLED",
  )

  // Open Schedule Dialog
  const handleOpenSchedule = (apt: Appointment) => {
    setScheduleTarget(apt)
    // Pre-fill date with preferredDate at 10:00 AM local
    const baseDate = apt.preferredDate.split("T")[0]
    setScheduledDateTime(`${baseDate}T10:00`)
    setDurationMinutes(apt.durationMinutes || 30)
    setDoctorNote(
      apt.mode === "TELE_CONSULT"
        ? "Video consultation: Link will be active at appointment time."
        : `Room 102, ${doctor?.clinicName || "Clinic"}. Please bring vaccination booklet.`,
    )
  }

  // Submit Schedule Confirmation
  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scheduleTarget || !scheduledDateTime) return

    setScheduling(true)
    try {
      const isoString = new Date(scheduledDateTime).toISOString()
      await scheduleDoctorAppointment(scheduleTarget.id, {
        scheduledAt: isoString,
        durationMinutes,
        doctorNote: doctorNote.trim() || undefined,
      })

      toast({
        title: "Appointment Confirmed!",
        description: `Scheduled with ${scheduleTarget.patient.fullName} for ${format(
          new Date(scheduledDateTime),
          "d MMM, h:mm a",
        )}.`,
      })

      setScheduleTarget(null)
      loadAppointments()
      setActiveTab("scheduled")
    } catch (err: any) {
      toast({
        title: "Failed to schedule",
        description: err?.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setScheduling(false)
    }
  }

  // Submit Decline
  const handleDeclineSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!declineTarget) return

    setDeclining(true)
    try {
      await declineDoctorAppointment(declineTarget.id, {
        reason: declineReason.trim() || undefined,
      })

      toast({
        title: "Appointment Declined",
        description: "Patient has been notified.",
      })

      setDeclineTarget(null)
      setDeclineReason("")
      loadAppointments()
    } catch (err: any) {
      toast({
        title: "Failed to decline",
        description: err?.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeclining(false)
    }
  }

  // Start 1-Click Consultation
  const handleStartConsultation = async (apt: Appointment) => {
    setStartingVisitId(apt.id)
    try {
      const res = await startDoctorAppointmentVisit(apt.id)
      toast({
        title: "Live Consultation Started",
        description: `Access session active for ${res.patientName}. Loading clinical records...`,
      })
      // Direct navigation to patient records & consultation form!
      router.push(`/doctor/patients/${res.patientId}`)
    } catch (err: any) {
      toast({
        title: "Could not launch visit",
        description: err?.message || "Please try again.",
        variant: "destructive",
      })
      setStartingVisitId(null)
    }
  }

  if (loading || !doctor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const currentList =
    activeTab === "pending"
      ? pendingList
      : activeTab === "scheduled"
      ? scheduledList
      : pastList

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-background content-with-nav pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary via-primary/95 to-secondary p-6 pb-7 rounded-b-3xl shadow-sm text-white">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-semibold">
              Dr. {doctor.fullName.replace(/^Dr\.?\s*/i, "")}
            </span>
          </div>
          <p className="text-white/85 text-xs leading-relaxed max-w-sm">
            Review patient requests, assign consultation slots, and launch clinical encounters.
          </p>

          {/* Queue Tab Switcher */}
          <div className="mt-4 flex bg-black/15 p-1 rounded-xl backdrop-blur-xs text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("pending")}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "pending"
                  ? "bg-white text-primary shadow-xs"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <span>Pending</span>
              {pendingList.length > 0 && (
                <span className="bg-amber-500 text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                  {pendingList.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("scheduled")}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "scheduled"
                  ? "bg-white text-primary shadow-xs"
                  : "text-white/80 hover:text-white"
              }`}
            >
              <span>Scheduled</span>
              {scheduledList.length > 0 && (
                <span className="bg-emerald-500 text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                  {scheduledList.length}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("past")}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTab === "past"
                  ? "bg-white text-primary shadow-xs"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Past ({pastList.length})
            </button>
          </div>
        </div>

        {/* Doctor Verification Warning */}
        {doctor.status !== "APPROVED" && (
          <div className="p-4 mx-4 mt-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600 dark:text-amber-400 text-xs flex items-start gap-3">
            <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Verification Pending</span>
              Your doctor account is awaiting administrative approval. Patients will be able to book consultations once approved.
            </div>
          </div>
        )}

        <div className="p-4 space-y-4">
          {currentList.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-8 text-center space-y-2.5 mt-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                {activeTab === "pending"
                  ? "No pending requests"
                  : activeTab === "scheduled"
                  ? "No upcoming scheduled visits"
                  : "No past appointments"}
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                {activeTab === "pending"
                  ? "New patient requests will appear here for you to schedule or decline."
                  : activeTab === "scheduled"
                  ? "Confirmed appointments with patient slots will appear here."
                  : "Completed or cancelled consultations will be archived here."}
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {currentList.map((apt) => {
                const isPending = apt.status === "REQUESTED"
                const isConfirmed = apt.status === "CONFIRMED"

                return (
                  <div
                    key={apt.id}
                    className="bg-card rounded-2xl border border-border shadow-xs hover:border-primary/40 transition-all p-4 space-y-3"
                  >
                    {/* Top Row: Mode & Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
                        {apt.mode === "TELE_CONSULT" ? (
                          <>
                            <Video className="w-4 h-4 text-purple-500" />
                            <span>Tele-Consultation</span>
                          </>
                        ) : (
                          <>
                            <Building2 className="w-4 h-4 text-blue-500" />
                            <span>In-Clinic Visit</span>
                          </>
                        )}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                          isPending
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                            : isConfirmed
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : apt.status === "COMPLETED"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {isPending
                          ? "Pending Schedule"
                          : isConfirmed
                          ? "Confirmed"
                          : apt.status === "COMPLETED"
                          ? "Completed"
                          : apt.status.toLowerCase()}
                      </span>
                    </div>

                    {/* Patient Info Card */}
                    <div className="flex items-start gap-3 bg-muted/30 p-3 rounded-xl border border-border/50">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                        {apt.patient.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-foreground truncate">
                            {apt.patient.fullName}
                          </h3>
                          <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground capitalize">
                            {apt.patient.relation.toLowerCase()}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {apt.patient.gender ? `${apt.patient.gender} · ` : ""}
                          {apt.patient.dob
                            ? `${new Date().getFullYear() - new Date(apt.patient.dob).getFullYear()} yrs`
                            : "Age unrecorded"}
                          {apt.patient.height && apt.patient.weight
                            ? ` · ${apt.patient.height}cm / ${apt.patient.weight}kg`
                            : ""}
                        </p>
                        {apt.bookedByEmail && (
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                            Account: {apt.bookedByEmail}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Patient Health Conditions (if any) */}
                    {apt.patient.healthConditions && apt.patient.healthConditions.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px] bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                        <HeartPulse className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <span className="font-semibold text-foreground">Conditions:</span>
                        {apt.patient.healthConditions.map((cond, i) => (
                          <span key={i} className="bg-amber-500/15 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded text-[10px]">
                            {cond}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Schedule / Time Information */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-muted/40 p-2.5 rounded-lg">
                        <span className="text-[10px] text-muted-foreground block font-medium">
                          {isConfirmed ? "Confirmed Slot" : "Patient's Preferred Date"}
                        </span>
                        <span className="font-semibold text-foreground truncate block">
                          {isConfirmed && apt.scheduledAt
                            ? format(parseISO(apt.scheduledAt), "d MMM yyyy · h:mm a")
                            : `${format(parseISO(apt.preferredDate), "d MMM yyyy")} (${apt.preferredWindow?.toLowerCase() || "morning"})`}
                        </span>
                      </div>

                      <div className="bg-muted/40 p-2.5 rounded-lg">
                        <span className="text-[10px] text-muted-foreground block font-medium">Duration</span>
                        <span className="font-semibold text-foreground block">
                          {apt.durationMinutes || 30} minutes
                        </span>
                      </div>
                    </div>

                    {/* Symptoms / Clinical Reason */}
                    <div className="text-xs bg-muted/20 p-2.5 rounded-lg border border-border/40">
                      <span className="font-medium text-foreground block mb-0.5">Symptoms / Visit Reason:</span>
                      <p className="text-muted-foreground leading-relaxed">{apt.reason}</p>
                    </div>

                    {/* Doctor's Note / Room / Teleconsult Link */}
                    {apt.doctorNote && (
                      <div className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 p-2.5 rounded-lg">
                        <span className="font-semibold block">Your Notes / Instructions:</span>
                        <p className="leading-relaxed">{apt.doctorNote}</p>
                      </div>
                    )}

                    {/* Decline Reason */}
                    {apt.status === "DECLINED" && apt.declineReason && (
                      <div className="text-xs bg-destructive/10 border border-destructive/20 text-destructive p-2.5 rounded-lg">
                        <span className="font-semibold block">Decline Reason:</span>
                        <p className="leading-relaxed">{apt.declineReason}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/60">
                      {isPending && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setDeclineTarget(apt)
                              setDeclineReason("")
                            }}
                            className="text-xs text-destructive hover:bg-destructive/10 h-9 px-3 rounded-xl"
                          >
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleOpenSchedule(apt)}
                            className="text-xs font-bold h-9 px-4 rounded-xl gap-1.5 shadow-xs"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            Accept & Schedule
                          </Button>
                        </>
                      )}

                      {isConfirmed && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenSchedule(apt)}
                            className="text-xs h-9 px-3 rounded-xl"
                          >
                            Reschedule
                          </Button>
                          <Button
                            size="sm"
                            disabled={startingVisitId === apt.id}
                            onClick={() => handleStartConsultation(apt)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold h-9 px-4 rounded-xl gap-1.5 shadow-xs"
                          >
                            {startingVisitId === apt.id ? (
                              <>
                                <LoadingSpinner size="sm" />
                                Launching...
                              </>
                            ) : (
                              <>
                                <Activity className="w-3.5 h-3.5" />
                                Start Consultation
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Schedule / Reschedule Dialog */}
      <Dialog open={!!scheduleTarget} onOpenChange={(open) => !open && setScheduleTarget(null)}>
        <DialogContent className="max-w-md w-[92vw] rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Schedule Consultation
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Confirm appointment with {scheduleTarget?.patient.fullName}. Patient requested:{" "}
              <span className="font-semibold text-foreground">
                {scheduleTarget?.preferredDate
                  ? format(parseISO(scheduleTarget.preferredDate), "d MMM yyyy")
                  : ""}{" "}
                ({scheduleTarget?.preferredWindow?.toLowerCase() || "morning"})
              </span>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleScheduleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Confirmed Date & Time Slot <span className="text-destructive">*</span>
              </label>
              <Input
                type="datetime-local"
                value={scheduledDateTime}
                onChange={(e) => setScheduledDateTime(e.target.value)}
                className="rounded-xl text-xs h-10"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Duration</label>
              <div className="grid grid-cols-4 gap-2 text-xs">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDurationMinutes(mins)}
                    className={`py-2 rounded-xl border font-semibold transition-all ${
                      durationMinutes === mins
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Clinic Room, Instructions, or Teleconsult Link
              </label>
              <Textarea
                placeholder="e.g. Room 204, Pediatrics Wing. Fasting not required. OR Google Meet link..."
                value={doctorNote}
                onChange={(e) => setDoctorNote(e.target.value)}
                className="rounded-xl text-xs min-h-[85px] leading-relaxed"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setScheduleTarget(null)}
                className="rounded-xl h-10 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={scheduling}
                className="rounded-xl h-10 text-xs font-bold gap-1.5"
              >
                {scheduling ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm Schedule
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Decline Dialog */}
      <Dialog open={!!declineTarget} onOpenChange={(open) => !open && setDeclineTarget(null)}>
        <DialogContent className="max-w-sm w-[90vw] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Decline Appointment
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Provide a brief reason so the patient understands why you cannot take this appointment.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleDeclineSubmit} className="space-y-3 mt-2">
            <Textarea
              placeholder="e.g. Doctor is unavailable during the requested time window. Please book another day."
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="rounded-xl text-xs min-h-[80px]"
            />

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeclineTarget(null)}
                className="rounded-xl h-9 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={declining}
                className="rounded-xl h-9 text-xs font-semibold"
              >
                {declining ? "Declining..." : "Decline Request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DoctorBottomNav active="appointments" />
    </div>
  )
}
