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
  vaccine: Vaccine
  provider: Provider | null
  patient?: { id: string; fullName: string; relation: string }
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

/** Fetches the PDF with the auth header, then triggers a browser download. */
export async function downloadCertificatePdf(id: string, filename: string): Promise<void> {
  const token = getToken()
  const res = await fetch(`${API_URL}/certificates/${id}/pdf`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!res.ok) throw new ApiError("Download failed", res.status)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
