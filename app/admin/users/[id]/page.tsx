"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ArrowLeft, ClipboardList, ShieldCheck, Bell, UserRound } from "lucide-react"
import {
  PageHeader,
  Panel,
  PanelHeader,
  StatCard,
  Badge,
  Button,
  Select,
  Table,
  Th,
  Tr,
  Td,
} from "@/components/admin/ui"
import { Modal } from "@/components/admin/modal"
import { useToast } from "@/components/toast-provider"
import {
  getAdminUserDetail,
  getMe,
  setUserRole,
  adminDeleteUser,
  adminDeletePatient,
  type AdminUserDetail,
  type AdminPatient,
} from "@/lib/api"

const ROLE_TONE: Record<string, "accent" | "neutral" | "warning"> = {
  ADMIN: "accent",
  PROVIDER: "warning",
  USER: "neutral",
}
const RELATION_LABEL: Record<string, string> = {
  SELF: "Self",
  SPOUSE: "Spouse",
  CHILD: "Child",
  PARENT: "Parent",
  SIBLING: "Sibling",
  OTHER: "Other",
}
const GENDER_LABEL: Record<string, string> = { MALE: "Male", FEMALE: "Female", OTHER: "Other" }
const IDPROOF_LABEL: Record<string, string> = {
  AADHAAR: "Aadhaar",
  DRIVING_LICENCE: "Driving Licence",
  PASSPORT: "Passport",
  OTHER: "Other",
}

function ageText(dob: string | null): string {
  if (!dob) return "—"
  const y = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000))
  return `${y} yrs`
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground mt-0.5 break-words">{value}</p>
    </div>
  )
}

function Spinner() {
  return (
    <div className="grid place-items-center py-20">
      <div className="w-7 h-7 border-2 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  )
}

export default function AdminUserDetailPage() {
  const params = useParams<{ id: string }>()
  const id = String(params.id)
  const router = useRouter()
  const { showToast } = useToast()

  const [data, setData] = useState<AdminUserDetail | null>(null)
  const [meId, setMeId] = useState("")
  const [loading, setLoading] = useState(true)
  const [roleDraft, setRoleDraft] = useState("")
  const [savingRole, setSavingRole] = useState(false)
  const [confirmUser, setConfirmUser] = useState(false)
  const [busy, setBusy] = useState(false)
  const [confirmPatient, setConfirmPatient] = useState<{ id: string; name: string } | null>(null)

  useEffect(() => {
    Promise.all([getAdminUserDetail(id), getMe()])
      .then(([d, me]) => {
        setData(d)
        setRoleDraft(d.role)
        setMeId(me.id)
      })
      .catch(() => router.replace("/admin/users"))
      .finally(() => setLoading(false))
  }, [id, router])

  const saveRole = async () => {
    if (!data) return
    setSavingRole(true)
    try {
      await setUserRole(data.id, roleDraft)
      setData({ ...data, role: roleDraft })
      showToast("Role updated.", "success")
    } catch {
      showToast("Could not update role.", "error")
    } finally {
      setSavingRole(false)
    }
  }

  const deleteUser = async () => {
    if (!data) return
    setBusy(true)
    try {
      await adminDeleteUser(data.id)
      showToast("Account deleted.", "success")
      router.replace("/admin/users")
    } catch {
      showToast("Could not delete account.", "error")
      setBusy(false)
    }
  }

  const deletePatient = async () => {
    if (!confirmPatient || !data) return
    setBusy(true)
    try {
      await adminDeletePatient(confirmPatient.id)
      setData({ ...data, patients: data.patients.filter((p) => p.id !== confirmPatient.id) })
      showToast("Family member removed.", "success")
      setConfirmPatient(null)
    } catch {
      showToast("Could not remove member.", "error")
    } finally {
      setBusy(false)
    }
  }

  if (loading || !data) return <Spinner />

  const isSelf = data.id === meId
  const c = data.counts

  return (
    <div>
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to users
      </Link>

      <PageHeader
        title={data.email}
        description={`Joined ${format(new Date(data.createdAt), "MMM d, yyyy")}`}
        action={
          !isSelf && (
            <Button variant="danger" onClick={() => setConfirmUser(true)}>
              Delete account
            </Button>
          )
        }
      />

      {/* Counts */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Family members" value={c.patients} icon={<UserRound className="w-4 h-4" />} />
        <StatCard label="Vaccination records" value={c.records} icon={<ClipboardList className="w-4 h-4" />} />
        <StatCard label="Certificates" value={c.certificates} icon={<ShieldCheck className="w-4 h-4" />} />
        <StatCard label="Reminders" value={c.reminders} icon={<Bell className="w-4 h-4" />} />
      </div>

      {/* Access & role */}
      <Panel className="mt-4">
        <PanelHeader title="Access & role" />
        <div className="p-5 flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Role</label>
            <Select
              value={roleDraft}
              onChange={(e) => setRoleDraft(e.target.value)}
              disabled={isSelf}
              className="w-48"
            >
              <option value="USER">User</option>
              <option value="PROVIDER">Provider</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </div>
          <Button variant="primary" onClick={saveRole} disabled={savingRole || isSelf || roleDraft === data.role}>
            {savingRole ? "Saving…" : "Save role"}
          </Button>
          <span className="ml-auto self-center">
            <Badge tone={ROLE_TONE[data.role] ?? "neutral"}>Current: {data.role}</Badge>
          </span>
        </div>
      </Panel>

      {/* Family members */}
      <div className="flex items-center justify-between mt-8 mb-3">
        <h2 className="text-base font-semibold text-foreground">Family members &amp; vaccinations</h2>
        <span className="text-sm text-muted-foreground">{data.patients.length} people</span>
      </div>

      {data.patients.length === 0 && (
        <Panel className="p-6 text-center text-sm text-muted-foreground">This account has no profiles.</Panel>
      )}

      <div className="space-y-4">
        {data.patients.map((p) => (
          <MemberCard key={p.id} p={p} onRemove={() => setConfirmPatient({ id: p.id, name: p.fullName })} />
        ))}
      </div>

      {/* Confirm: delete account */}
      <Modal
        open={confirmUser}
        onClose={() => setConfirmUser(false)}
        title="Delete this account?"
        description={data.email}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmUser(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={deleteUser} disabled={busy}>
              {busy ? "Deleting…" : "Delete account"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-foreground">
          This permanently removes the account and <strong>all</strong> its family members, records, certificates and
          reminders. This cannot be undone.
        </p>
      </Modal>

      {/* Confirm: remove family member */}
      <Modal
        open={!!confirmPatient}
        onClose={() => setConfirmPatient(null)}
        title="Remove family member?"
        description={confirmPatient?.name}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmPatient(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={deletePatient} disabled={busy}>
              {busy ? "Removing…" : "Remove"}
            </Button>
          </>
        }
      >
        <p className="text-sm text-foreground">
          This removes {confirmPatient?.name} and all of their vaccination records and certificates.
        </p>
      </Modal>
    </div>
  )
}

function MemberCard({ p, onRemove }: { p: AdminPatient; onRemove: () => void }) {
  return (
    <Panel>
      <PanelHeader
        title={p.fullName}
        action={
          p.relation !== "SELF" && (
            <Button variant="ghost" className="text-destructive hover:bg-destructive/10" onClick={onRemove}>
              Remove
            </Button>
          )
        }
      />
      <div className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Badge tone="neutral">{RELATION_LABEL[p.relation] ?? p.relation}</Badge>
          <span className="text-sm text-muted-foreground">
            {ageText(p.dob)}
            {p.gender ? ` · ${GENDER_LABEL[p.gender] ?? p.gender}` : ""}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
          <Info label="Nationality" value={p.nationality ?? "—"} />
          <Info
            label="ID proof"
            value={p.idProofType ? `${IDPROOF_LABEL[p.idProofType] ?? p.idProofType}` : "—"}
          />
          <Info label="ID number" value={p.idProofNumber ?? "—"} />
          <Info label="Health ID" value={p.healthId ?? "—"} />
          <Info label="Date of birth" value={p.dob ? format(new Date(p.dob), "MMM d, yyyy") : "—"} />
        </div>

        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Vaccination records ({p.records.length})
        </p>
        {p.records.length === 0 ? (
          <p className="text-sm text-muted-foreground mb-2">No vaccination records.</p>
        ) : (
          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <thead>
                <tr>
                  <Th>Vaccine</Th>
                  <Th>Dose</Th>
                  <Th>Date</Th>
                  <Th>Provider</Th>
                  <Th>Status</Th>
                  <Th>Certificate</Th>
                </tr>
              </thead>
              <tbody>
                {p.records.map((r) => (
                  <Tr key={r.id}>
                    <Td className="font-medium text-foreground">
                      {r.vaccine.name}
                      {r.symptoms && (
                        <div className="text-xs text-muted-foreground font-normal">Symptoms: {r.symptoms}</div>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap text-muted-foreground">
                      {r.doseNumber} of {r.vaccine.totalDoses}
                    </Td>
                    <Td className="whitespace-nowrap text-muted-foreground">
                      {format(new Date(r.dateAdministered), "MMM d, yyyy")}
                    </Td>
                    <Td className="text-muted-foreground">{r.provider?.name ?? "—"}</Td>
                    <Td>
                      {r.verified ? (
                        <Badge tone="success">Verified</Badge>
                      ) : (
                        <Badge tone="neutral">Pending</Badge>
                      )}
                    </Td>
                    <Td className="font-mono text-xs text-muted-foreground">
                      {r.certificate?.verificationCode ?? "—"}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}

        {p.reminders.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Reminders ({p.reminders.length})
            </p>
            <ul className="space-y-1.5">
              {p.reminders.map((rm) => (
                <li key={rm.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">
                    {rm.vaccine.name} · Dose {rm.doseNumber}
                  </span>
                  <span className="text-muted-foreground">
                    Due {format(new Date(rm.dueDate), "MMM d, yyyy")} · {rm.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Panel>
  )
}
