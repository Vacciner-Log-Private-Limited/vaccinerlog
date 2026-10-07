"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  Users,
  UserRound,
  ClipboardList,
  ShieldCheck,
  Building2,
  Syringe,
  BellRing,
} from "lucide-react"
import {
  Panel,
  PanelHeader,
  PageHeader,
  StatCard,
  Badge,
  BarRow,
} from "@/components/admin/ui"
import { getAdminStats, type AdminStats } from "@/lib/api"

function ChartSpinner() {
  return (
    <div className="grid place-items-center py-20">
      <div className="w-7 h-7 border-2 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  )
}

const ROLE_TONE: Record<string, "accent" | "neutral" | "warning"> = {
  ADMIN: "accent",
  PROVIDER: "warning",
  USER: "neutral",
}

export default function AdminOverviewPage() {
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAdminStats()
      .then(setStats)
      .catch(() => router.replace("/dashboard"))
      .finally(() => setLoading(false))
  }, [router])

  if (loading || !stats) return <ChartSpinner />

  const t = stats.totals
  const iconCls = "w-4 h-4"
  const maxVax = Math.max(...stats.vaccineDistribution.map((v) => v.count), 1)
  const maxMonth = Math.max(...stats.recordsByMonth.map((m) => m.count), 1)

  return (
    <div>
      <PageHeader title="Overview" description="Platform-wide metrics and recent activity." />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Users" value={t.users} icon={<Users className={iconCls} />} href="/admin/users" />
        <StatCard label="People" value={t.patients} icon={<UserRound className={iconCls} />} />
        <StatCard label="Records" value={t.records} icon={<ClipboardList className={iconCls} />} />
        <StatCard label="Certificates" value={t.certificates} icon={<ShieldCheck className={iconCls} />} href="/admin/certificates" />
        <StatCard label="Providers" value={t.providers} icon={<Building2 className={iconCls} />} href="/admin/providers" />
        <StatCard label="Vaccine types" value={t.vaccines} icon={<Syringe className={iconCls} />} href="/admin/vaccines" />
        <StatCard label="Pending reminders" value={t.remindersPending} icon={<BellRing className={iconCls} />} href="/admin/reminders" />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Panel>
          <PanelHeader title="Most administered vaccines" />
          <div className="p-5 space-y-4">
            {stats.vaccineDistribution.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              stats.vaccineDistribution.map((v) => (
                <BarRow key={v.name} label={v.name} count={v.count} max={maxVax} />
              ))
            )}
          </div>
        </Panel>

        <Panel>
          <PanelHeader title="Vaccinations by month" />
          <div className="p-5 space-y-4">
            {stats.recordsByMonth.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            ) : (
              stats.recordsByMonth.map((m) => (
                <BarRow key={m.month} label={m.month} count={m.count} max={maxMonth} />
              ))
            )}
          </div>
        </Panel>
      </div>

      {/* Recent activity */}
      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Panel>
          <PanelHeader title="Recent sign-ups" />
          <ul className="divide-y divide-border">
            {stats.recentUsers.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <span className="text-sm text-foreground truncate">{u.email}</span>
                <div className="flex items-center gap-2.5 flex-shrink-0">
                  <Badge tone={ROLE_TONE[u.role] ?? "neutral"}>{u.role}</Badge>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {format(new Date(u.createdAt), "MMM d")}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel>
          <PanelHeader title="Recent vaccinations" />
          <ul className="divide-y divide-border">
            {stats.recentRecords.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{r.vaccine}</p>
                  <p className="text-xs text-muted-foreground truncate">{r.person}</p>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums">
                  {format(new Date(r.date), "MMM d, yyyy")}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  )
}
