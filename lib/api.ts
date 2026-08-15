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
}

export interface Me {
  id: string
  email: string
  role: string
  createdAt: string
  patients: Patient[]
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
