"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function VerifyIndexPage() {
  const router = useRouter()
  const [code, setCode] = useState("")

  const submit = () => {
    const trimmed = code.trim()
    if (trimmed) router.push(`/verify/${encodeURIComponent(trimmed)}`)
  }

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col">
        <div className="bg-gradient-to-r from-primary to-secondary p-6 pb-8 rounded-b-3xl">
          <div className="flex items-center justify-between mb-2">
            <Link href="/certificates">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white">Verify a Certificate</h1>
            <div className="w-10" />
          </div>
        </div>

        <div className="flex-1 p-6">
          <Card className="p-6 space-y-4">
            <p className="text-sm text-muted-foreground">
              Scan a certificate&apos;s QR code, or enter its verification code below to confirm it is genuine.
            </p>
            <div>
              <Label htmlFor="code">Verification Code</Label>
              <Input
                id="code"
                placeholder="e.g. VL-359F53B39F75"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                className="mt-2 h-12 font-mono"
              />
            </div>
            <Button onClick={submit} disabled={!code.trim()} className="w-full h-12">
              Verify
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
