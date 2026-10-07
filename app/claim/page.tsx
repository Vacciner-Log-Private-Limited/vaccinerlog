"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/toast-provider"
import { ApiError, acceptInvite, getToken } from "@/lib/api"

const PENDING_KEY = "vacciner_pending_claim"

export default function ClaimPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [code, setCode] = useState("")
  const [authed, setAuthed] = useState(false)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState<{ name: string } | null>(null)

  // Read the code from the URL (or a stashed one) and check auth — client only.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get("code")
    const stashed = localStorage.getItem(PENDING_KEY)
    const resolved = fromUrl ?? stashed ?? ""
    setCode(resolved)
    setAuthed(!!getToken())
    setReady(true)
  }, [])

  const goSignIn = () => {
    if (code) localStorage.setItem(PENDING_KEY, code)
    router.push("/login")
  }

  const handleClaim = async () => {
    if (!code.trim()) {
      showToast("Enter the claim code you were given.", "error")
      return
    }
    setLoading(true)
    try {
      const profile = await acceptInvite(code.trim())
      localStorage.removeItem(PENDING_KEY)
      setDone({ name: profile.fullName })
      showToast("Access granted!", "success")
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not claim access."
      showToast(message, "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mobile-container">
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/5 to-background p-6">
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center w-16 h-16 bg-primary rounded-2xl shadow-lg mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Claim your records</h1>
            <p className="text-muted-foreground text-sm">
              A family guardian invited you to take over your own vaccination profile.
            </p>
          </div>

          {!ready ? null : done ? (
            <Card className="p-6 text-center space-y-4">
              <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-success/15">
                <svg className="w-7 h-7 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-foreground">You now have access to {done.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your guardian keeps access too — you both manage this profile from now on.
                </p>
              </div>
              <Button className="w-full" onClick={() => router.push("/dashboard")}>
                Go to my dashboard
              </Button>
            </Card>
          ) : !authed ? (
            <Card className="p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                First, sign in (or create an account) with the{" "}
                <span className="font-medium text-foreground">exact email</span> your guardian used for the
                invite. We&apos;ll bring you right back here.
              </p>
              <Button className="w-full" onClick={goSignIn}>
                Sign in to continue
              </Button>
              {code && (
                <p className="text-xs text-muted-foreground break-all">
                  Saved code: <span className="font-mono">{code}</span>
                </p>
              )}
            </Card>
          ) : (
            <Card className="p-6 space-y-4">
              <div>
                <Label htmlFor="claim-code">Claim code</Label>
                <Input
                  id="claim-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Paste your claim code"
                  className="mt-1 font-mono"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  The code only works for the account it was issued to, once, within 48 hours.
                </p>
              </div>
              <Button className="w-full" onClick={handleClaim} disabled={loading}>
                {loading ? "Claiming…" : "Claim access"}
              </Button>
              <Link href="/dashboard" className="block text-center text-sm text-muted-foreground">
                Skip for now
              </Link>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
