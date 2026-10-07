"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ChevronRight } from "lucide-react"
import { PageHeader, Panel, Table, Th, Tr, Td, Badge, Button } from "@/components/admin/ui"
import { getAdminUsers, type AdminUser } from "@/lib/api"

const ROLE_TONE: Record<string, "accent" | "neutral" | "warning"> = {
  ADMIN: "accent",
  PROVIDER: "warning",
  USER: "neutral",
}

function Spinner() {
  return (
    <div className="grid place-items-center py-20">
      <div className="w-7 h-7 border-2 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  )
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminUsers()
      .then(setUsers)
      .catch(() => router.replace("/dashboard"))
      .finally(() => setLoading(false))
  }, [router])

  if (loading) return <Spinner />

  return (
    <div>
      <PageHeader
        title="Users"
        description={`${users.length} account${users.length === 1 ? "" : "s"}. Click a user to view their full profile.`}
      />

      <Panel className="overflow-hidden">
        <Table>
          <thead>
            <tr>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th className="text-right">People</Th>
              <Th>Joined</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <Tr key={u.id}>
                <Td className="font-medium text-foreground">{u.email}</Td>
                <Td>
                  <Badge tone={ROLE_TONE[u.role] ?? "neutral"}>{u.role}</Badge>
                </Td>
                <Td className="text-right tabular-nums text-muted-foreground">{u.patients}</Td>
                <Td className="text-muted-foreground whitespace-nowrap">
                  {format(new Date(u.createdAt), "MMM d, yyyy")}
                </Td>
                <Td className="text-right">
                  <Link href={`/admin/users/${u.id}`}>
                    <Button variant="secondary">
                      View
                      <ChevronRight className="w-4 h-4 -mr-1" />
                    </Button>
                  </Link>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Panel>
    </div>
  )
}
