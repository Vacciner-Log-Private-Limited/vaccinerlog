"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { PageHeader, Panel, Table, Th, Tr, Td, SearchInput } from "@/components/admin/ui"
import { getAdminCertificates, type AdminCertificateRow } from "@/lib/api"

function Spinner() {
  return (
    <div className="grid place-items-center py-20">
      <div className="w-7 h-7 border-2 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  )
}

export default function AdminCertificatesPage() {
  const router = useRouter()
  const [items, setItems] = useState<AdminCertificateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")

  useEffect(() => {
    getAdminCertificates()
      .then(setItems)
      .catch(() => router.replace("/dashboard"))
      .finally(() => setLoading(false))
  }, [router])

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim()
    if (!s) return items
    return items.filter(
      (c) =>
        c.vaccine.toLowerCase().includes(s) ||
        c.person.toLowerCase().includes(s) ||
        c.owner.toLowerCase().includes(s) ||
        c.verificationCode.toLowerCase().includes(s),
    )
  }, [items, q])

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader
        title="Certificates"
        description={`${items.length} certificate${items.length === 1 ? "" : "s"} issued across the platform.`}
        action={
          <SearchInput placeholder="Search vaccine, person, owner, code…" value={q} onChange={(e) => setQ(e.target.value)} />
        }
      />

      <Panel className="overflow-hidden">
        <Table>
          <thead>
            <tr>
              <Th>Vaccine</Th>
              <Th>Person</Th>
              <Th>Account owner</Th>
              <Th>Code</Th>
              <Th>Issued</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <Tr key={c.id}>
                <Td className="font-medium text-foreground whitespace-nowrap">
                  {c.vaccine}
                  <span className="text-muted-foreground font-normal"> · Dose {c.doseNumber}</span>
                </Td>
                <Td className="text-foreground">{c.person}</Td>
                <Td className="text-muted-foreground">{c.owner}</Td>
                <Td className="font-mono text-xs text-muted-foreground">{c.verificationCode}</Td>
                <Td className="text-muted-foreground whitespace-nowrap">
                  {format(new Date(c.issuedAt), "MMM d, yyyy")}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-10">No certificates match your search.</p>
        )}
      </Panel>
    </div>
  )
}
