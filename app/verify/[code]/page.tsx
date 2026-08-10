"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/loading-spinner"
import { verifyCertificate, type VerifyResult } from "@/lib/api"

export default function VerifyCodePage() {
  const params = useParams<{ code: string }>()
  const code = String(params.code)
  const [result, setResult] = useState<VerifyResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    verifyCertificate(code)
      .then(setResult)
      .catch(() => setResult({ valid: false }))
      .finally(() => setLoading(false))
  }, [code])

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex flex-col">
        {/* Brand header */}
        <div className="bg-gradient-to-r from-primary to-secondary p-6 pb-8 rounded-b-3xl text-center">
          <h1 className="text-2xl font-bold text-white">Vacciner Log</h1>
          <p className="text-white/90 text-sm mt-1">Certificate Verification</p>
        </div>

        <div className="flex-1 p-6">
          {loading ? (
            <LoadingSpinner size="lg" />
          ) : result?.valid && result.certificate ? (
            <Card className="p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-11 h-11 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-foreground">Certificate Verified</h2>
                <p className="text-sm text-muted-foreground mt-1">This certificate is genuine and on record.</p>
              </div>

              <div className="bg-accent/50 rounded-lg p-4 space-y-3">
                <Row label="Name" value={result.certificate.personName} />
                <Divider />
                <Row
                  label="Vaccine"
                  value={`${result.certificate.vaccine} — Dose ${result.certificate.doseNumber} of ${result.certificate.totalDoses}`}
                />
                <Divider />
                <Row
                  label="Date administered"
                  value={format(new Date(result.certificate.dateAdministered), "MMM d, yyyy")}
                />
                <Divider />
                <Row label="Provider" value={result.certificate.provider ?? "Not recorded"} />
                <Divider />
                <Row
                  label="Issued"
                  value={format(new Date(result.certificate.issuedAt), "MMM d, yyyy")}
                />
                <Divider />
                <Row label="Verification code" value={result.certificate.verificationCode} mono />
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-11 h-11 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-foreground">Not Verified</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  No certificate matches the code <span className="font-mono">{code}</span>. It may be invalid or
                  revoked.
                </p>
              </div>
            </Card>
          )}

          <div className="mt-6 text-center">
            <Link href="/dashboard">
              <Button variant="link" className="text-primary">
                Go to Vacciner Log
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground flex-shrink-0">{label}</span>
      <span className={`font-medium text-right ${mono ? "font-mono text-xs break-all" : ""}`}>{value}</span>
    </div>
  )
}

function Divider() {
  return <div className="border-t border-border" />
}
