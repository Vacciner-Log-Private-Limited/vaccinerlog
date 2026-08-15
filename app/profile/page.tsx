"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BottomNav } from "@/components/bottom-nav"
import { useToast } from "@/components/toast-provider"
import { getMe, getToken, logout, updatePatient, type Me } from "@/lib/api"

function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

const EMPTY_FORM = { dob: "", gender: "", nationality: "", idProofType: "", idProofNumber: "" }

export default function ProfilePage() {
  const router = useRouter()
  const { showToast } = useToast()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [me, setMe] = useState<Me | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => setMounted(true), [])

  const loadMe = useCallback(() => {
    return getMe().then((m) => {
      setMe(m)
      const s = m.patients.find((p) => p.relation === "SELF") ?? m.patients[0]
      if (s) {
        setForm({
          dob: s.dob ? new Date(s.dob).toISOString().slice(0, 10) : "",
          gender: s.gender ?? "",
          nationality: s.nationality ?? "",
          idProofType: s.idProofType ?? "",
          idProofNumber: s.idProofNumber ?? "",
        })
      }
    })
  }, [])

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login")
      return
    }
    loadMe().catch(() => router.replace("/login"))
  }, [router, loadMe])

  const self = me?.patients.find((p) => p.relation === "SELF") ?? me?.patients[0]
  const displayName = self?.fullName ?? "..."

  const handleSave = async () => {
    if (!self) return
    setSaving(true)
    try {
      await updatePatient(self.id, {
        dob: form.dob || undefined,
        gender: form.gender || undefined,
        nationality: form.nationality || undefined,
        idProofType: form.idProofType || undefined,
        idProofNumber: form.idProofNumber || undefined,
      })
      showToast("Profile updated!", "success")
      await loadMe()
    } catch {
      showToast("Could not save profile.", "error")
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.replace("/login")
  }

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-background content-with-nav">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary p-6 pb-12 rounded-b-3xl">
          <div className="flex items-center justify-between mb-6">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white">Profile</h1>
            <div className="w-10" />
          </div>

          <div className="flex flex-col items-center">
            <Avatar className="w-24 h-24 border-4 border-white shadow-lg mb-3">
              <AvatarFallback className="bg-white text-primary font-bold text-2xl">
                {initials(displayName)}
              </AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold text-white mb-1">{displayName}</h2>
            <p className="text-white/80 text-sm">{me?.email ?? "—"}</p>
          </div>
        </div>

        {/* Personal Information */}
        <div className="p-6 space-y-4">
          <h3 className="font-semibold text-lg text-foreground">Personal Information</h3>
          <Card className="p-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Full Name</span>
              <span className="font-medium">{displayName}</span>
            </div>
            <div className="border-t border-border" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="font-medium text-sm">{me?.email ?? "—"}</span>
            </div>
            <div className="border-t border-border" />
            <div>
              <Label htmlFor="dob" className="text-sm text-muted-foreground">Date of Birth</Label>
              <Input
                id="dob"
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="gender" className="text-sm text-muted-foreground">Gender</Label>
              <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v })}>
                <SelectTrigger id="gender" className="mt-1">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          <h3 className="font-semibold text-lg text-foreground pt-4">Identity &amp; ID Proof</h3>
          <Card className="p-4 space-y-4">
            <div>
              <Label htmlFor="nationality" className="text-sm text-muted-foreground">Nationality</Label>
              <Input
                id="nationality"
                placeholder="e.g. Indian"
                value={form.nationality}
                onChange={(e) => setForm({ ...form, nationality: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="idProofType" className="text-sm text-muted-foreground">ID Proof Type</Label>
              <Select value={form.idProofType} onValueChange={(v) => setForm({ ...form, idProofType: v })}>
                <SelectTrigger id="idProofType" className="mt-1">
                  <SelectValue placeholder="Select ID proof" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AADHAAR">Aadhaar</SelectItem>
                  <SelectItem value="DRIVING_LICENCE">Driving Licence</SelectItem>
                  <SelectItem value="PASSPORT">Passport</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="idProofNumber" className="text-sm text-muted-foreground">ID Proof Number</Label>
              <Input
                id="idProofNumber"
                placeholder="Enter the document number"
                value={form.idProofNumber}
                onChange={(e) => setForm({ ...form, idProofNumber: e.target.value })}
                className="mt-1"
              />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </Card>

          {/* Settings */}
          <h3 className="font-semibold text-lg text-foreground pt-4">Settings</h3>
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dark-mode" className="font-medium">
                  Dark Mode
                </Label>
                <p className="text-xs text-muted-foreground">Enable dark theme</p>
              </div>
              <Switch
                id="dark-mode"
                checked={mounted && theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
            <div className="border-t border-border" />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications" className="font-medium">
                  Notifications
                </Label>
                <p className="text-xs text-muted-foreground">Vaccine reminders & updates</p>
              </div>
              <Switch id="notifications" defaultChecked />
            </div>
            <div className="border-t border-border" />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="language" className="font-medium">
                  Language
                </Label>
                <p className="text-xs text-muted-foreground">English</p>
              </div>
              <Button variant="ghost" size="sm">
                Change
              </Button>
            </div>
          </Card>

          {/* Quick Links */}
          <h3 className="font-semibold text-lg text-foreground pt-4">Quick Links</h3>
          <Card className="p-4 space-y-3">
            {me?.role === "ADMIN" && (
              <>
                <Link href="/admin">
                  <button className="w-full flex items-center justify-between py-2 hover:bg-accent/50 rounded-lg px-2 transition-colors">
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                      <span className="font-medium">Admin Dashboard</span>
                    </div>
                    <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </Link>
                <div className="border-t border-border" />
              </>
            )}
            <Link href="/family">
              <button className="w-full flex items-center justify-between py-2 hover:bg-accent/50 rounded-lg px-2 transition-colors">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span className="font-medium">Manage Family</span>
                </div>
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </Link>
            <div className="border-t border-border" />
            <Link href="/support">
              <button className="w-full flex items-center justify-between py-2 hover:bg-accent/50 rounded-lg px-2 transition-colors">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span className="font-medium">Help & Support</span>
                </div>
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </Link>
            <div className="border-t border-border" />
            <button className="w-full flex items-center justify-between py-2 hover:bg-accent/50 rounded-lg px-2 transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium">About Vacciner Log</span>
              </div>
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </Card>

          {/* Logout Button */}
          <Button
            variant="destructive"
            className="w-full h-12 mt-6"
            size="lg"
            onClick={handleLogout}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </Button>

          <p className="text-center text-xs text-muted-foreground pt-4 pb-2">
            Vacciner Log v1.0.0 • Powered by National Health Mission
          </p>
        </div>
      </div>

      <BottomNav active="profile" />
    </div>
  )
}
