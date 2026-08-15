"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { PageHeader, Panel, Table, Th, Tr, Td, Badge, Select } from "@/components/admin/ui"
import { getAdminReminders, type AdminReminderRow } from "@/lib/api"

const STATUS_TONE: Record<string, "accent" | "neutral" | "warning" | "success" | "danger"> = {
  PENDING: "warning",
  SENT: "accent",
  DONE: "success",
  CANCELLED: "neutral",
}

function Spinner() {
  return (
    <div className="grid place-items-center py-20">
      <div className="w-7 h-7 border-2 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  )
}

export default function AdminRemindersPage() {
  const router = useRouter()
  const [items, setItems] = useState<AdminReminderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("all")

  useEffect(() => {
    getAdminReminders()
      .then(setItems)
      .catch(() => router.replace("/dashboard"))
      .finally(() => setLoading(false))
  }, [router])

  const filtered = useMemo(
    () => (status === "all" ? items : items.filter((r) => r.status === status)),
    [items, status],
  )

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader
        title="Reminders"
        description={`${items.length} reminder${items.length === 1 ? "" : "s"} across the platform.`}
        action={
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="SENT">Sent</option>
            <option value="DONE">Done</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        }
      />

      <Panel className="overflow-hidden">
        <Table>
          <thead>
            <tr>
              <Th>Vaccine</Th>
              <Th>Person</Th>
              <Th>Account owner</Th>
              <Th>Due date</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <Tr key={r.id}>
                <Td className="font-medium text-foreground whitespace-nowrap">
                  {r.vaccine}
                  <span className="text-muted-foreground font-normal"> · Dose {r.doseNumber}</span>
                </Td>
                <Td className="text-foreground">{r.person}</Td>
                <Td className="text-muted-foreground">{r.owner}</Td>
                <Td className="text-muted-foreground whitespace-nowrap">
                  {format(new Date(r.dueDate), "MMM d, yyyy")}
                </Td>
                <Td>
                  <Badge tone={STATUS_TONE[r.status] ?? "neutral"}>{r.status}</Badge>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-10">No reminders with this status.</p>
        )}
      </Panel>
    </div>
  )
}
