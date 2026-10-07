"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader, Panel, Table, Th, Tr, Td, Button, Badge } from "@/components/admin/ui"
import { useToast } from "@/components/toast-provider"
import {
  ApiError,
  getAdminDoctors,
  setDoctorStatus,
  type AdminDoctor,
  type DoctorStatus,
} from "@/lib/api"

function Spinner() {
  return (
    <div className="grid place-items-center py-20">
      <div className="w-7 h-7 border-2 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  )
}

const STATUS_TONE: Record<DoctorStatus, "warning" | "success" | "danger"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
}

export default function AdminDoctorsPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [items, setItems] = useState<AdminDoctor[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = () => getAdminDoctors().then(setItems)

  useEffect(() => {
    getAdminDoctors()
      .then(setItems)
      .catch(() => router.replace("/dashboard"))
      .finally(() => setLoading(false))
  }, [router])

  const change = async (d: AdminDoctor, status: DoctorStatus) => {
    setBusyId(d.id)
    try {
      await setDoctorStatus(d.id, status)
      showToast(`${d.fullName} ${status === "APPROVED" ? "approved" : "rejected"}.`, "success")
      await load()
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Could not update.", "error")
    } finally {
      setBusyId(null)
    }
  }

  if (loading) return <Spinner />

  const pending = items.filter((d) => d.status === "PENDING").length

  return (
    <div>
      <PageHeader
        title="Doctors"
        description={
          items.length === 0
            ? "No doctors have registered yet."
            : `${items.length} registered · ${pending} awaiting approval.`
        }
      />

      <Panel className="overflow-hidden">
        <Table>
          <thead>
            <tr>
              <Th>Doctor</Th>
              <Th>Registration no.</Th>
              <Th>Specialization</Th>
              <Th>Clinic / city</Th>
              <Th>Status</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <Tr key={d.id}>
                <Td className="whitespace-nowrap">
                  <div className="font-medium text-foreground">{d.fullName}</div>
                  <div className="text-xs text-muted-foreground">{d.email}</div>
                </Td>
                <Td className="text-muted-foreground">{d.registrationNumber}</Td>
                <Td className="text-muted-foreground">{d.specialization ?? "—"}</Td>
                <Td className="text-muted-foreground">
                  {[d.clinicName, d.city].filter(Boolean).join(" · ") || "—"}
                </Td>
                <Td>
                  <Badge tone={STATUS_TONE[d.status]}>{d.status}</Badge>
                </Td>
                <Td className="text-right whitespace-nowrap">
                  {d.status !== "APPROVED" && (
                    <Button
                      variant="ghost"
                      className="text-success hover:bg-success/10"
                      disabled={busyId === d.id}
                      onClick={() => change(d, "APPROVED")}
                    >
                      Approve
                    </Button>
                  )}
                  {d.status !== "REJECTED" && (
                    <Button
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      disabled={busyId === d.id}
                      onClick={() => change(d, "REJECTED")}
                    >
                      Reject
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </div>
  )
}
