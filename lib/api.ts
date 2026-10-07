// Frontend API client for the Vacciner Log backend.
// All calls go through `request`, which attaches the JWT and normalizes errors.

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"

const TOKEN_KEY = "vacciner_token"

// ---- token storage (localStorage) ----------------------------------------

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function isLoggedIn(): boolean {
  return !!getToken()
}

// ---- core request helper ---------------------------------------------------

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  })

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (Array.isArray(body.message)) message = body.message.join(", ")
      else if (body.message) message = body.message
    } catch {
      // response had no JSON body
    }
    throw new ApiError(message, res.status)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ---- types -----------------------------------------------------------------

export interface Patient {
  id: string
  fullName: string
  relation: string
  healthId: string | null
  dob?: string | null
  gender?: string | null
  nationality?: string | null
  idProofType?: string | null // AADHAAR | DRIVING_LICENCE | PASSPORT | OTHER
  idProofNumber?: string | null
  accessRole?: "SELF" | "GUARDIAN" | null // how the current user reaches this profile
  healthConditions?: string[] | null
  hasPriorComplications?: boolean | null
  complicationNotes?: string | null
  hasSurgicalComplications?: boolean | null
  surgicalComplicationNotes?: string | null
  height?: number | null // in cm
  weight?: number | null // in kg
}

export interface PatientInput {
  fullName?: string
  relation?: string
  dob?: string
  gender?: string
  healthId?: string
  phone?: string
  nationality?: string
  idProofType?: string
  idProofNumber?: string
  healthConditions?: string[]
  hasPriorComplications?: boolean
  complicationNotes?: string
  hasSurgicalComplications?: boolean
  surgicalComplicationNotes?: string
  height?: number | null
  weight?: number | null
}

export interface Me {
  id: string
  email: string
  role: string
  createdAt: string
  patients: Patient[]
}

export type DoctorStatus = "PENDING" | "APPROVED" | "REJECTED"

export interface DoctorProfile {
  id: string
  userId: string
  email: string
  fullName: string
  specialization: string | null
  registrationNumber: string
  clinicName: string | null
  city: string | null
  phone: string | null
  status: DoctorStatus
  createdAt: string
}

export interface Vaccine {
  id: string
  name: string
  description?: string | null
  totalDoses: number
}

export interface Provider {
  id: string
  name: string
  city?: string | null
}

export interface VaccinationRecord {
  id: string
  doseNumber: number
  dateAdministered: string
  status: string
  verified: boolean
  batchNumber?: string | null
  symptoms?: string | null
  vaccine: Vaccine
  provider: Provider | null
  patient?: { id: string; fullName: string; relation: string; dob?: string | null }
  certificate?: { id: string; verificationCode: string } | null
}

export interface Certificate {
  id: string
  verificationCode: string
  issuedAt: string
  record: {
    id: string
    doseNumber: number
    dateAdministered: string
    vaccine: Vaccine
    provider: Provider | null
    patient: { id: string; fullName: string; relation: string }
  }
}

export interface VerifyResult {
  valid: boolean
  certificate?: {
    verificationCode: string
    issuedAt: string
    personName: string
    vaccine: string
    doseNumber: number
    totalDoses: number
    dateAdministered: string
    provider: string | null
  }
}

export interface Reminder {
  id: string
  doseNumber: number
  dueDate: string
  status: string // PENDING | SENT | DONE | CANCELLED
  vaccine: Vaccine
  patient: { id: string; fullName: string; relation: string }
}

export interface AdminStats {
  totals: {
    users: number
    patients: number
    records: number
    certificates: number
    providers: number
    vaccines: number
    remindersPending: number
  }
  vaccineDistribution: { name: string; count: number }[]
  recordsByMonth: { month: string; count: number }[]
  recentUsers: { id: string; email: string; role: string; createdAt: string }[]
  recentRecords: { id: string; vaccine: string; person: string; date: string }[]
}

export interface AdminUser {
  id: string
  email: string
  role: string
  createdAt: string
  patients: number
}

export interface AdminPatientRecord {
  id: string
  doseNumber: number
  dateAdministered: string
  verified: boolean
  symptoms: string | null
  batchNumber: string | null
  vaccine: { name: string; totalDoses: number }
  provider: { name: string } | null
  certificate: { id: string; verificationCode: string } | null
}

export interface AdminPatientReminder {
  id: string
  doseNumber: number
  dueDate: string
  status: string
  vaccine: { name: string }
}

export interface AdminPatient {
  id: string
  fullName: string
  relation: string
  dob: string | null
  gender: string | null
  nationality: string | null
  idProofType: string | null
  idProofNumber: string | null
  healthId: string | null
  records: AdminPatientRecord[]
  reminders: AdminPatientReminder[]
}

export interface AdminUserDetail {
  id: string
  email: string
  role: string
  createdAt: string
  counts: { patients: number; records: number; certificates: number; reminders: number }
  patients: AdminPatient[]
}

export interface Summary {
  totalVaccines: number
  nextDue: number
  certificates: number
}

export interface AuthResponse {
  accessToken: string
  user: { id: string; email: string; role: string }
}

// ---- auth ------------------------------------------------------------------

export async function register(data: {
  email: string
  password: string
  fullName: string
}): Promise<AuthResponse> {
  const res = await request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  })
  setToken(res.accessToken)
  return res
}

export async function login(data: {
  email: string
  password: string
}): Promise<AuthResponse> {
  const res = await request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  })
  setToken(res.accessToken)
  return res
}

export function logout(): void {
  clearToken()
}

// ---- doctor account ---------------------------------------------------------

export async function registerDoctor(data: {
  email: string
  password: string
  fullName: string
  registrationNumber: string
  specialization?: string
  clinicName?: string
  city?: string
  phone?: string
}): Promise<AuthResponse> {
  const res = await request<AuthResponse>("/doctor/register", {
    method: "POST",
    body: JSON.stringify(data),
  })
  setToken(res.accessToken)
  return res
}

export const getDoctorMe = () => request<DoctorProfile>("/doctor/me")

export interface DoctorEncounterSummary {
  id: string
  patientId: string
  patientName: string
  occurredAt: string
  problem: string | null
  problemTags: string[]
  recommendation: string | null
  sharedWithPatient: boolean
  prescriptionCount: number
}

export const getDoctorHistory = () => request<DoctorEncounterSummary[]>("/doctor/history")

export interface DoctorAnalytics {
  totals: { visits: number; uniquePatients: number; prescriptions: number; shared: number }
  visitsByMonth: { month: string; count: number }[]
  topProblems: { name: string; count: number }[]
  topMedicines: { name: string; count: number }[]
}

export const getDoctorAnalytics = () => request<DoctorAnalytics>("/doctor/analytics")

export const updateDoctorMe = (data: {
  fullName?: string
  specialization?: string
  clinicName?: string
  city?: string
  phone?: string
}) =>
  request<DoctorProfile>("/doctor/me", {
    method: "PATCH",
    body: JSON.stringify(data),
  })

// ---- Doctor Community & Research Papers ------------------------------------

export type PublicationType =
  | "RESEARCH_PAPER"
  | "ACHIEVEMENT"
  | "CASE_STUDY"
  | "CLINICAL_UPDATE"

export interface DoctorPublication {
  id: string
  doctorUserId: string
  type: PublicationType
  title: string
  summary: string
  specialization: string | null
  tags: string[]
  journalOrIssuer: string | null
  publicationUrl: string | null
  year: number | null
  likesCount: number
  hasLiked: boolean
  isMine: boolean
  createdAt: string
  updatedAt: string
  author: {
    userId: string
    fullName: string
    specialization: string | null
    clinicName: string | null
    city: string | null
    registrationNumber: string | null
  }
}

export interface CreatePublicationPayload {
  title: string
  type: PublicationType
  summary: string
  specialization?: string
  tags?: string[]
  journalOrIssuer?: string
  publicationUrl?: string
  year?: number
}

export const getDoctorPublications = (params?: {
  type?: PublicationType
  search?: string
  mine?: boolean
}) => {
  const query = new URLSearchParams()
  if (params?.type) query.set("type", params.type)
  if (params?.search) query.set("search", params.search)
  if (params?.mine) query.set("mine", "true")
  const qs = query.toString()
  return request<DoctorPublication[]>(`/doctor/publications${qs ? `?${qs}` : ""}`)
}

export const createDoctorPublication = (data: CreatePublicationPayload) =>
  request<DoctorPublication>("/doctor/publications", {
    method: "POST",
    body: JSON.stringify(data),
  })

export const deleteDoctorPublication = (id: string) =>
  request<{ success: boolean; message: string }>(`/doctor/publications/${id}`, {
    method: "DELETE",
  })

export const toggleDoctorPublicationLike = (id: string) =>
  request<{ liked: boolean; likesCount: number }>(`/doctor/publications/${id}/like`, {
    method: "POST",
  })

// ---- Doctor Appointment System --------------------------------------------

export type AppointmentStatus =
  | "REQUESTED"
  | "CONFIRMED"
  | "COMPLETED"
  | "CANCELLED"
  | "DECLINED"

export type ConsultationMode = "IN_CLINIC" | "TELE_CONSULT"

export interface ApprovedDoctorSummary {
  id: string
  userId: string
  email: string
  fullName: string
  specialization: string | null
  clinicName: string | null
  city: string | null
  phone: string | null
  registrationNumber: string
  publicationCount: number
}

export interface PatientSummaryInAppointment {
  id: string
  fullName: string
  relation: string
  dob: string | null
  gender: string | null
  healthConditions?: string[]
  hasPriorComplications?: boolean | null
  complicationNotes?: string | null
  hasSurgicalComplications?: boolean | null
  surgicalComplicationNotes?: string | null
  height?: number | null
  weight?: number | null
}

export interface Appointment {
  id: string
  patientId: string
  patient: PatientSummaryInAppointment
  doctorUserId: string
  doctor?: {
    fullName: string
    specialization: string | null
    clinicName: string | null
    city: string | null
    phone: string | null
  }
  bookedByEmail?: string
  status: AppointmentStatus
  mode: ConsultationMode
  preferredDate: string
  preferredWindow: string | null
  reason: string
  scheduledAt: string | null
  durationMinutes: number
  doctorNote: string | null
  declineReason: string | null
  encounterId: string | null
  createdAt: string
}

export interface CreateAppointmentPayload {
  patientId: string
  doctorUserId: string
  mode?: ConsultationMode
  preferredDate: string
  preferredWindow?: string
  reason: string
}

export interface ScheduleAppointmentPayload {
  scheduledAt: string
  durationMinutes?: number
  doctorNote?: string
}

export interface DeclineAppointmentPayload {
  reason?: string
}

// Patient API:
export const getApprovedDoctors = (params?: { search?: string; specialization?: string }) => {
  const query = new URLSearchParams()
  if (params?.search) query.set("search", params.search)
  if (params?.specialization) query.set("specialization", params.specialization)
  const qs = query.toString()
  return request<ApprovedDoctorSummary[]>(`/appointments/doctors${qs ? `?${qs}` : ""}`)
}

export const createAppointment = (payload: CreateAppointmentPayload) =>
  request<Appointment>("/appointments", {
    method: "POST",
    body: JSON.stringify(payload),
  })

export const getUserAppointments = () => request<Appointment[]>("/appointments/my")

export const cancelUserAppointment = (id: string) =>
  request<Appointment>(`/appointments/${id}/cancel`, {
    method: "PATCH",
  })

// Doctor API:
export const getDoctorAppointments = (status?: AppointmentStatus) => {
  const query = status ? `?status=${status}` : ""
  return request<Appointment[]>(`/doctor/appointments${query}`)
}

export const scheduleDoctorAppointment = (id: string, payload: ScheduleAppointmentPayload) =>
  request<Appointment>(`/doctor/appointments/${id}/schedule`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })

export const declineDoctorAppointment = (id: string, payload: DeclineAppointmentPayload) =>
  request<Appointment>(`/doctor/appointments/${id}/decline`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })

export const startDoctorAppointmentVisit = (id: string) =>
  request<{
    appointmentId: string
    patientId: string
    patientName: string
    mode: ConsultationMode
    accessExpiresAt: string
  }>(`/doctor/appointments/${id}/start-visit`, {
    method: "POST",
  })

// ---- consent (patient shares access with a doctor) -------------------------

export type ConsentScope = "VIEW" | "VIEW_AND_RECORD"

export interface ConsentGenerated {
  id: string
  code: string
  scope: ConsentScope
  patientId: string
  patientName: string
  expiresAt: string
}

export interface ActiveConsent {
  id: string
  patientId: string
  patientName: string
  scope: ConsentScope
  status: "PENDING" | "USED"
  expiresAt: string
  accessExpiresAt: string | null
  doctor: { name: string; specialization: string | null } | null
}

export interface ConsumedVisit {
  encounterId: string
  scope: ConsentScope
  sessionExpiresAt: string
  patient: { id: string; fullName: string; dob: string | null; gender: string | null }
}

export const generateConsent = (patientId: string, scope: ConsentScope = "VIEW") =>
  request<ConsentGenerated>("/consent/generate", {
    method: "POST",
    body: JSON.stringify({ patientId, scope }),
  })

export const getActiveConsents = () => request<ActiveConsent[]>("/consent")

export const revokeConsent = (id: string) =>
  request<{ revoked: boolean }>(`/consent/${id}`, { method: "DELETE" })

/** Doctor: redeem a patient's code to start a visit. */
export const consumeConsent = (code: string) =>
  request<ConsumedVisit>("/doctor/visits/consume", {
    method: "POST",
    body: JSON.stringify({ code }),
  })

export interface DoctorPrescription {
  id: string
  medicine: string
  dosage: string | null
  frequency: string | null
  durationDays: number | null
}

export interface DoctorEncounter {
  id: string
  problem: string | null
  problemTags: string[]
  recommendation: string | null
  prescriptionText: string | null
  sharedWithPatient: boolean
  note: string | null
  prescriptions: DoctorPrescription[]
}

export interface DoctorPatientView {
  patient: {
    id: string
    fullName: string
    dob: string | null
    gender: string | null
    healthId: string | null
    nationality: string | null
    healthConditions: string[]
    hasPriorComplications: boolean | null
    complicationNotes: string | null
    hasSurgicalComplications: boolean | null
    surgicalComplicationNotes: string | null
    height?: number | null
    weight?: number | null
  }
  records: VaccinationRecord[]
  encounter: DoctorEncounter | null
  session: { scope: ConsentScope; expiresAt: string | null }
}

/** Doctor: the patient's records during a live session (consent-gated). */
export const getDoctorPatientRecords = (patientId: string) =>
  request<DoctorPatientView>(`/doctor/visits/${patientId}/records`)

export interface PrescriptionItemInput {
  medicine: string
  dosage?: string
  frequency?: string
  durationDays?: number
}

/** Doctor: save the consultation note + prescription for the current visit. */
export const saveConsultationNote = (
  patientId: string,
  data: {
    problem?: string
    problemTags?: string[]
    recommendation?: string
    prescriptionText?: string
    sharedWithPatient?: boolean
    note?: string
    prescriptions?: PrescriptionItemInput[]
  },
) =>
  request<DoctorEncounter>(`/doctor/visits/${patientId}/note`, {
    method: "PUT",
    body: JSON.stringify(data),
  })

// ---- data ------------------------------------------------------------------

export const getMe = () => request<Me>("/auth/me")
export const getSummary = () => request<Summary>("/records/summary")
export const getRecords = (patientId?: string) =>
  request<VaccinationRecord[]>(
    `/records${patientId ? `?patientId=${patientId}` : ""}`,
  )
export const getPatients = () => request<Patient[]>("/patients")
export const getVaccines = () => request<Vaccine[]>("/vaccines")
export const getProviders = () => request<Provider[]>("/providers")

export const createPatient = (data: PatientInput) =>
  request<Patient>("/patients", {
    method: "POST",
    body: JSON.stringify(data),
  })

export const updatePatient = (id: string, data: PatientInput) =>
  request<Patient>(`/patients/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })

export const deletePatient = (id: string) =>
  request<{ deleted: boolean }>(`/patients/${id}`, { method: "DELETE" })

// ---- shared access / delegation --------------------------------------------

export interface InviteResult {
  code: string
  email: string
  patientName: string
  expiresAt: string
}

export interface AccessEntry {
  userId: string
  email: string
  role: "SELF" | "GUARDIAN"
  since: string
  isYou: boolean
}

/** Guardian: mint a one-time claim code for an adult member. */
export const createInvite = (patientId: string, email: string) =>
  request<InviteResult>(`/patients/${patientId}/access/invite`, {
    method: "POST",
    body: JSON.stringify({ email }),
  })

/** List every account that can reach a profile. */
export const getAccessList = (patientId: string) =>
  request<AccessEntry[]>(`/patients/${patientId}/access`)

/** Remove an account's access to a profile. */
export const revokeAccess = (patientId: string, userId: string) =>
  request<{ revoked: boolean }>(`/patients/${patientId}/access/${userId}`, {
    method: "DELETE",
  })

/** Invited person: redeem a claim code to gain access to their profile. */
export const acceptInvite = (code: string) =>
  request<{ id: string; fullName: string; relation: string }>("/access/accept", {
    method: "POST",
    body: JSON.stringify({ code }),
  })

export const createRecord = (data: {
  patientId: string
  vaccineId: string
  doseNumber?: number
  dateAdministered: string
  batchNumber?: string
  symptoms?: string
  providerId?: string
}) =>
  request<VaccinationRecord>("/records", {
    method: "POST",
    body: JSON.stringify(data),
  })

export const updateRecord = (
  id: string,
  data: {
    vaccineId?: string
    providerId?: string | null
    doseNumber?: number
    dateAdministered?: string
    batchNumber?: string
    symptoms?: string
    status?: string
  },
) =>
  request<VaccinationRecord>(`/records/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })

export const deleteRecord = (id: string) =>
  request<{ deleted: boolean }>(`/records/${id}`, { method: "DELETE" })

// ---- certificates ----------------------------------------------------------

export const getCertificates = () => request<Certificate[]>("/certificates")

export const issueCertificate = (recordId: string) =>
  request<{ id: string; verificationCode: string }>("/certificates", {
    method: "POST",
    body: JSON.stringify({ recordId }),
  })

// Public — works without a token (used by the verify page a QR scan lands on).
export const verifyCertificate = (code: string) =>
  request<VerifyResult>(`/verify/${code}`)

// ---- reminders -------------------------------------------------------------

export const getReminders = () => request<Reminder[]>("/reminders")

export const createReminder = (data: {
  patientId: string
  vaccineId: string
  doseNumber?: number
  dueDate: string
}) =>
  request<Reminder>("/reminders", {
    method: "POST",
    body: JSON.stringify(data),
  })

export const completeReminder = (id: string) =>
  request<Reminder>(`/reminders/${id}/complete`, { method: "POST" })

export const deleteReminder = (id: string) =>
  request<{ deleted: boolean }>(`/reminders/${id}`, { method: "DELETE" })

// ---- admin -----------------------------------------------------------------

export const getAdminStats = () => request<AdminStats>("/admin/stats")

export const getAdminUsers = () => request<AdminUser[]>("/admin/users")

export const setUserRole = (id: string, role: string) =>
  request<{ id: string; email: string; role: string }>(`/admin/users/${id}/role`, {
    method: "PATCH",
    body: JSON.stringify({ role }),
  })

export const getAdminUserDetail = (id: string) => request<AdminUserDetail>(`/admin/users/${id}`)

export const adminDeleteUser = (id: string) =>
  request<{ deleted: boolean }>(`/admin/users/${id}`, { method: "DELETE" })

export const adminDeletePatient = (id: string) =>
  request<{ deleted: boolean }>(`/admin/patients/${id}`, { method: "DELETE" })

// vaccine catalog
export interface AdminVaccine {
  id: string
  name: string
  description: string | null
  totalDoses: number
  records: number
}

export const getAdminVaccines = () => request<AdminVaccine[]>("/admin/vaccines")
export const createAdminVaccine = (data: { name: string; description?: string; totalDoses?: number }) =>
  request<AdminVaccine>("/admin/vaccines", { method: "POST", body: JSON.stringify(data) })
export const updateAdminVaccine = (
  id: string,
  data: { name?: string; description?: string; totalDoses?: number },
) => request<AdminVaccine>(`/admin/vaccines/${id}`, { method: "PATCH", body: JSON.stringify(data) })
export const deleteAdminVaccine = (id: string) =>
  request<{ deleted: boolean }>(`/admin/vaccines/${id}`, { method: "DELETE" })

// providers
export interface AdminProvider {
  id: string
  name: string
  city: string | null
  registrationNumber: string | null
  records: number
}

export const getAdminProviders = () => request<AdminProvider[]>("/admin/providers")
export const createAdminProvider = (data: { name: string; city?: string; registrationNumber?: string }) =>
  request<AdminProvider>("/admin/providers", { method: "POST", body: JSON.stringify(data) })
export const updateAdminProvider = (
  id: string,
  data: { name?: string; city?: string; registrationNumber?: string },
) => request<AdminProvider>(`/admin/providers/${id}`, { method: "PATCH", body: JSON.stringify(data) })
export const deleteAdminProvider = (id: string) =>
  request<{ deleted: boolean }>(`/admin/providers/${id}`, { method: "DELETE" })

// oversight (read-only)
export interface AdminCertificateRow {
  id: string
  verificationCode: string
  issuedAt: string
  doseNumber: number
  vaccine: string
  person: string
  owner: string
}
export interface AdminReminderRow {
  id: string
  doseNumber: number
  dueDate: string
  status: string
  vaccine: string
  person: string
  owner: string
}

export const getAdminCertificates = () => request<AdminCertificateRow[]>("/admin/certificates")
export const getAdminReminders = () => request<AdminReminderRow[]>("/admin/reminders")

// doctors (verification)
export interface AdminDoctor {
  id: string
  userId: string
  email: string
  fullName: string
  specialization: string | null
  registrationNumber: string
  clinicName: string | null
  city: string | null
  phone: string | null
  status: DoctorStatus
  createdAt: string
}

export const getAdminDoctors = () => request<AdminDoctor[]>("/admin/doctors")

export const setDoctorStatus = (id: string, status: DoctorStatus) =>
  request<{ id: string; fullName: string; status: DoctorStatus }>(
    `/admin/doctors/${id}/status`,
    { method: "PATCH", body: JSON.stringify({ status }) },
  )

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/** Fetches a single certificate PDF with the auth header, then downloads it. */
export async function downloadCertificatePdf(id: string, filename: string): Promise<void> {
  const token = getToken()
  const res = await fetch(`${API_URL}/certificates/${id}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new ApiError("Download failed", res.status)
  triggerBlobDownload(await res.blob(), filename)
}

/** Downloads several certificates combined into one PDF. */
export async function downloadCertificatesBundle(ids: string[], filename: string): Promise<void> {
  const token = getToken()
  const res = await fetch(`${API_URL}/certificates/download`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ ids }),
  })
  if (!res.ok) throw new ApiError("Download failed", res.status)
  triggerBlobDownload(await res.blob(), filename)
}
