"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format, parseISO } from "date-fns"
import {
  Calendar,
  Clock,
  MapPin,
  Building2,
  Stethoscope,
  Video,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Search,
  Plus,
  ShieldCheck,
  ChevronRight,
  GraduationCap,
  ArrowLeft,
  X,
  Phone,
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
import { BottomNav } from "@/components/bottom-nav"
import { useToast } from "@/components/ui/use-toast"
import {
  getApprovedDoctors,
  getUserAppointments,
  createAppointment,
  cancelUserAppointment,
  getPatients,
  getToken,
  type Appointment,
  type ApprovedDoctorSummary,
  type Patient,
  type ConsultationMode,
  type AppointmentStatus,
} from "@/lib/api"

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; badgeClass: string; icon: any }
> = {
  REQUESTED: {
    label: "Awaiting Schedule",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: Clock,
  },
  CONFIRMED: {
    label: "Confirmed & Scheduled",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: CheckCircle2,
  },
  COMPLETED: {
    label: "Completed",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: "Cancelled",
    badgeClass: "bg-muted text-muted-foreground border-border",
    icon: XCircle,
  },
  DECLINED: {
    label: "Declined",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
    icon: AlertCircle,
  },
}

export default function AppointmentsPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<"my" | "book">("my")
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<ApprovedDoctorSummary[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)

  // Booking Form State
  const [selectedPatientId, setSelectedPatientId] = useState<string>("")
  const [selectedDoctor, setSelectedDoctor] = useState<ApprovedDoctorSummary | null>(null)
  const [doctorSearch, setDoctorSearch] = useState("")
  const [selectedMode, setSelectedMode] = useState<ConsultationMode>("IN_CLINIC")
  const [preferredDate, setPreferredDate] = useState("")
  const [preferredWindow, setPreferredWindow] = useState("MORNING")
  const [reason, setReason] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Cancel Modal State
  const [cancelTargetId, setCancelTargetId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  // Status Filter in My Appointments
  const [statusFilter, setStatusFilter] = useState<"ALL" | AppointmentStatus>("ALL")

  const loadData = useCallback(async () => {
    try {
      const [apptsData, docsData, patientsData] = await Promise.all([
        getUserAppointments(),
        getApprovedDoctors(),
        getPatients(),
      ])
      setAppointments(apptsData)
      setDoctors(docsData)
      setPatients(patientsData)
      if (patientsData.length > 0 && !selectedPatientId) {
        setSelectedPatientId(patientsData[0].id)
      }
    } catch (err: any) {
      toast({
        title: "Could not load data",
        description: err?.message || "Please refresh and try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [selectedPatientId, toast])

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login")
      return
    }
    loadData()
  }, [router, loadData])

  // Filtered doctors for search
  const filteredDoctors = doctors.filter((doc) => {
    if (!doctorSearch.trim()) return true
    const q = doctorSearch.toLowerCase()
    return (
      doc.fullName.toLowerCase().includes(q) ||
      (doc.specialization && doc.specialization.toLowerCase().includes(q)) ||
      (doc.clinicName && doc.clinicName.toLowerCase().includes(q)) ||
      (doc.city && doc.city.toLowerCase().includes(q))
    )
  })

  // Filtered appointments
  const filteredAppointments = appointments.filter((apt) => {
    if (statusFilter === "ALL") return true
    return apt.status === statusFilter
  })

  // Handle Booking Submission
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatientId) {
      toast({ title: "Select a Patient", description: "Please choose who this appointment is for.", variant: "destructive" })
      return
    }
    if (!selectedDoctor) {
      toast({ title: "Select a Doctor", description: "Please pick a doctor for consultation.", variant: "destructive" })
      return
    }
    if (!preferredDate) {
      toast({ title: "Select a Date", description: "Please choose your preferred appointment date.", variant: "destructive" })
      return
    }
    if (!reason.trim()) {
      toast({ title: "Reason Required", description: "Please briefly describe the symptoms or reason for visit.", variant: "destructive" })
      return
    }

    setSubmitting(true)
    try {
      await createAppointment({
        patientId: selectedPatientId,
        doctorUserId: selectedDoctor.userId,
        mode: selectedMode,
        preferredDate,
        preferredWindow,
        reason: reason.trim(),
      })

      toast({
        title: "Appointment Requested!",
        description: `Your request was sent to Dr. ${selectedDoctor.fullName}. The doctor will confirm the schedule shortly.`,
      })

      // Reset form and switch to My Appointments
      setSelectedDoctor(null)
      setPreferredDate("")
      setReason("")
      setActiveTab("my")
      loadData()
    } catch (err: any) {
      toast({
        title: "Booking Failed",
        description: err?.message || "Could not book appointment.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Cancel
  const handleCancelConfirm = async () => {
    if (!cancelTargetId) return
    setCancelling(true)
    try {
      await cancelUserAppointment(cancelTargetId)
      toast({
        title: "Appointment Cancelled",
        description: "Your appointment request has been cancelled.",
      })
      setCancelTargetId(null)
      loadData()
    } catch (err: any) {
      toast({
        title: "Cancellation Failed",
        description: err?.message || "Could not cancel appointment.",
        variant: "destructive",
      })
    } finally {
      setCancelling(false)
    }
  }

  // Format Helper
  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "—"
    try {
      return format(parseISO(dateStr), "EEE, d MMM yyyy · h:mm a")
    } catch {
      return dateStr
    }
  }

  const formatDateOnly = (dateStr?: string | null) => {
    if (!dateStr) return "—"
    try {
      return format(parseISO(dateStr), "EEE, d MMM yyyy")
    } catch {
      return dateStr
    }
  }

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-background content-with-nav pb-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary via-primary/95 to-secondary p-6 pb-7 rounded-b-3xl shadow-sm text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <Link href="/dashboard" className="p-1 -ml-1 text-white/80 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
            </div>
            {activeTab === "my" && (
              <Button
                size="sm"
                onClick={() => setActiveTab("book")}
                className="bg-white text-primary hover:bg-white/90 font-semibold rounded-full px-3.5 h-8 text-xs gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Book New
              </Button>
            )}
          </div>
          <p className="text-white/85 text-xs leading-relaxed max-w-sm">
            Consult verified physicians and pediatricians for vaccinations, clinical follow-ups, and advice.
          </p>

          {/* Tab Switcher */}
          <div className="mt-4 flex bg-black/15 p-1 rounded-xl backdrop-blur-xs text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab("my")}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTab === "my"
                  ? "bg-white text-primary shadow-xs"
                  : "text-white/80 hover:text-white"
              }`}
            >
              My Appointments ({appointments.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("book")}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                activeTab === "book"
                  ? "bg-white text-primary shadow-xs"
                  : "text-white/80 hover:text-white"
              }`}
            >
              + Book Consultation
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-xs text-muted-foreground">Loading appointment details...</p>
          </div>
        ) : activeTab === "my" ? (
          /* ==================== TAB 1: MY APPOINTMENTS ==================== */
          <div className="p-4 space-y-4">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
              <button
                type="button"
                onClick={() => setStatusFilter("ALL")}
                className={`px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
                  statusFilter === "ALL"
                    ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                All ({appointments.length})
              </button>
              {(["CONFIRMED", "REQUESTED", "COMPLETED", "CANCELLED"] as AppointmentStatus[]).map(
                (st) => {
                  const count = appointments.filter((a) => a.status === st).length
                  const conf = STATUS_CONFIG[st]
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
                        statusFilter === st
                          ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                          : "bg-card text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {conf.label} ({count})
                    </button>
                  )
                },
              )}
            </div>

            {filteredAppointments.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-8 text-center space-y-3 mt-2">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-foreground">No appointments found</h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  {statusFilter === "ALL"
                    ? "You haven't booked any doctor consultations yet. Connect with a verified doctor today."
                    : `No appointments with status "${statusFilter.toLowerCase()}".`}
                </p>
                <Button
                  onClick={() => setActiveTab("book")}
                  className="rounded-full h-10 px-5 text-xs font-semibold gap-1.5 mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Book an Appointment
                </Button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredAppointments.map((apt) => {
                  const conf = STATUS_CONFIG[apt.status]
                  const StatusIcon = conf.icon
                  const isPendingOrConfirmed =
                    apt.status === "REQUESTED" || apt.status === "CONFIRMED"

                  return (
                    <div
                      key={apt.id}
                      className="bg-card rounded-2xl border border-border shadow-xs hover:border-primary/40 transition-all p-4 space-y-3"
                    >
                      {/* Top Header: Mode & Status */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          {apt.mode === "TELE_CONSULT" ? (
                            <>
                              <Video className="w-3.5 h-3.5 text-purple-500" />
                              <span>Tele-Consultation</span>
                            </>
                          ) : (
                            <>
                              <Building2 className="w-3.5 h-3.5 text-blue-500" />
                              <span>In-Clinic Visit</span>
                            </>
                          )}
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${conf.badgeClass}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {conf.label}
                        </span>
                      </div>

                      {/* Doctor Info */}
                      <div className="flex items-start gap-3 bg-muted/30 p-3 rounded-xl border border-border/50">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 mt-0.5">
                          {apt.doctor?.fullName
                            ? apt.doctor.fullName
                                .replace(/^Dr\.?\s*/i, "")
                                .split(" ")
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()
                            : "DR"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-foreground truncate">
                            Dr. {apt.doctor?.fullName.replace(/^Dr\.?\s*/i, "") || "Verified Doctor"}
                          </h3>
                          <p className="text-xs text-primary font-medium truncate">
                            {apt.doctor?.specialization || "Physician"}
                          </p>
                          {(apt.doctor?.clinicName || apt.doctor?.city) && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                              <MapPin className="w-3 h-3 shrink-0" />
                              {[apt.doctor.clinicName, apt.doctor.city].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Patient & Schedule Details */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-muted/40 p-2.5 rounded-lg">
                          <span className="text-[10px] text-muted-foreground block font-medium">Patient</span>
                          <span className="font-semibold text-foreground truncate block">
                            {apt.patient.fullName} ({apt.patient.relation})
                          </span>
                        </div>

                        <div className="bg-muted/40 p-2.5 rounded-lg">
                          <span className="text-[10px] text-muted-foreground block font-medium">
                            {apt.status === "CONFIRMED" ? "Confirmed Slot" : "Requested Date"}
                          </span>
                          <span className="font-semibold text-foreground truncate block">
                            {apt.status === "CONFIRMED" && apt.scheduledAt
                              ? formatDateTime(apt.scheduledAt)
                              : `${formatDateOnly(apt.preferredDate)} (${apt.preferredWindow?.toLowerCase() || "morning"})`}
                          </span>
                        </div>
                      </div>

                      {/* Symptoms / Reason */}
                      <div className="text-xs text-muted-foreground bg-muted/20 p-2.5 rounded-lg border border-border/40">
                        <span className="font-medium text-foreground block mb-0.5">Reason for Visit:</span>
                        <p className="leading-relaxed">{apt.reason}</p>
                      </div>

                      {/* Doctor Notes / Instructions */}
                      {apt.doctorNote && (
                        <div className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 p-2.5 rounded-lg space-y-0.5">
                          <span className="font-semibold block flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" /> Doctor&apos;s Instructions / Room:
                          </span>
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

                      {/* Footer Actions */}
                      {isPendingOrConfirmed && (
                        <div className="flex items-center justify-end pt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCancelTargetId(apt.id)}
                            className="text-xs text-destructive hover:bg-destructive/10 hover:text-destructive h-8 px-3 rounded-lg"
                          >
                            Cancel Appointment
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          /* ==================== TAB 2: BOOK CONSULTATION ==================== */
          <form onSubmit={handleBookingSubmit} className="p-4 space-y-5">
            {/* Step 1: Choose Patient Profile */}
            <div className="bg-card rounded-2xl border border-border p-4 space-y-2.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <UserIcon className="w-4 h-4 text-primary" />
                1. Select Patient (Who is this visit for?)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {patients.map((p) => {
                  const isSelected = selectedPatientId === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPatientId(p.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all text-xs ${
                        isSelected
                          ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                          : "border-border bg-card text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <span className="block font-bold truncate text-foreground">{p.fullName}</span>
                      <span className="text-[11px] text-muted-foreground capitalize">
                        {p.relation.toLowerCase()} {p.gender ? `· ${p.gender.toLowerCase()}` : ""}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 2: Choose Doctor */}
            <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-primary" />
                  2. Choose Verified Doctor
                </label>
                {selectedDoctor && (
                  <button
                    type="button"
                    onClick={() => setSelectedDoctor(null)}
                    className="text-[11px] text-primary hover:underline font-semibold"
                  >
                    Change Doctor
                  </button>
                )}
              </div>

              {selectedDoctor ? (
                /* Selected Doctor Card */
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {selectedDoctor.fullName
                        .replace(/^Dr\.?\s*/i, "")
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <h4 className="text-xs font-bold text-foreground truncate">
                          Dr. {selectedDoctor.fullName.replace(/^Dr\.?\s*/i, "")}
                        </h4>
                        <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                      </div>
                      <p className="text-[11px] text-primary font-medium truncate">
                        {selectedDoctor.specialization || "Physician"}
                      </p>
                      {(selectedDoctor.clinicName || selectedDoctor.city) && (
                        <p className="text-[10px] text-muted-foreground truncate">
                          {[selectedDoctor.clinicName, selectedDoctor.city].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-card text-[10px] shrink-0 border-primary/30">
                    Selected
                  </Badge>
                </div>
              ) : (
                /* Doctor Search & Directory */
                <div className="space-y-2.5">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                      placeholder="Search doctor name, specialty, hospital..."
                      value={doctorSearch}
                      onChange={(e) => setDoctorSearch(e.target.value)}
                      className="pl-8 text-xs h-9 rounded-xl"
                    />
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {filteredDoctors.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        No verified doctors match your search.
                      </p>
                    ) : (
                      filteredDoctors.map((doc) => (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => setSelectedDoctor(doc)}
                          className="w-full p-2.5 rounded-xl border border-border/80 hover:border-primary/50 bg-card hover:bg-muted/40 transition-all text-left flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-foreground truncate">
                                Dr. {doc.fullName.replace(/^Dr\.?\s*/i, "")}
                              </span>
                              <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {doc.specialization || "General Physician"} ·{" "}
                              {doc.clinicName || doc.city || "Clinic"}
                            </p>
                            {doc.publicationCount > 0 && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                                <GraduationCap className="w-3 h-3" />
                                {doc.publicationCount} research publications
                              </span>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Consultation Mode */}
            <div className="bg-card rounded-2xl border border-border p-4 space-y-2.5">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-primary" />
                3. Consultation Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMode("IN_CLINIC")}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 text-xs transition-all ${
                    selectedMode === "IN_CLINIC"
                      ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>In-Clinic Physical Visit</span>
                  <span className="text-[10px] font-normal text-muted-foreground">Vaccine dose / Exam</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMode("TELE_CONSULT")}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-1 text-xs transition-all ${
                    selectedMode === "TELE_CONSULT"
                      ? "border-primary bg-primary/10 text-primary font-semibold shadow-xs"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>Tele-Consult / Online</span>
                  <span className="text-[10px] font-normal text-muted-foreground">Follow-up / Advice</span>
                </button>
              </div>
            </div>

            {/* Step 4: Preferred Date & Time Window */}
            <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-primary" />
                4. Preferred Date & Time Window
              </label>

              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">Preferred Date</span>
                <Input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="rounded-xl text-xs h-10"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-muted-foreground">Convenient Time Window</span>
                <div className="grid grid-cols-3 gap-1.5 text-xs">
                  {[
                    { id: "MORNING", label: "Morning", time: "9am - 12pm" },
                    { id: "AFTERNOON", label: "Afternoon", time: "12pm - 4pm" },
                    { id: "EVENING", label: "Evening", time: "4pm - 8pm" },
                  ].map((win) => {
                    const isSelected = preferredWindow === win.id
                    return (
                      <button
                        key={win.id}
                        type="button"
                        onClick={() => setPreferredWindow(win.id)}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                            : "border-border bg-card text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <span className="block text-xs">{win.label}</span>
                        <span className="block text-[10px] font-normal text-muted-foreground">{win.time}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Step 5: Reason for Visit / Symptoms */}
            <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
              <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-primary" />
                5. Reason for Visit or Symptoms
              </label>
              <Textarea
                placeholder="e.g. Due for MMR booster dose, mild rash after previous vaccine, or general pediatric growth evaluation..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="rounded-xl text-xs min-h-[90px] leading-relaxed"
                required
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={submitting || !selectedDoctor || !preferredDate}
              className="w-full h-12 rounded-xl text-xs font-bold gap-2 shadow-sm"
            >
              {submitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Sending Request to Doctor...
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  Confirm & Request Appointment
                </>
              )}
            </Button>
          </form>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={!!cancelTargetId} onOpenChange={(open) => !open && setCancelTargetId(null)}>
        <DialogContent className="max-w-sm w-[90vw] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              Cancel Appointment
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure you want to cancel this appointment request? You can book another appointment anytime.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCancelTargetId(null)}
              className="rounded-xl h-9 text-xs"
            >
              Keep Appointment
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={cancelling}
              onClick={handleCancelConfirm}
              className="rounded-xl h-9 text-xs font-semibold"
            >
              {cancelling ? "Cancelling..." : "Yes, Cancel"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  )
}
