"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BottomNav } from "@/components/bottom-nav"
import { LoadingSpinner } from "@/components/loading-spinner"
import { EmptyState } from "@/components/empty-state"
import { QrCode } from "@/components/qr-code"
import { useToast } from "@/components/toast-provider"
import { downloadCertificatePdf, getCertificates, getToken, type Certificate } from "@/lib/api"

function Header() {
  return (
    <div className="bg-gradient-to-r from-primary to-secondary p-6 pb-8 rounded-b-3xl">
      <div className="flex items-center justify-between mb-4">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-white">Certificates</h1>
        <Link href="/verify">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </Button>
        </Link>
      </div>
      <p className="text-white/90 text-sm">Download and share your verified vaccination certificates</p>
    </div>
  )
}

export default function CertificatesPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [certs, setCerts] = useState<Certificate[]>([])
  const [loading, setLoading] = useState(true)
  const [origin, setOrigin] = useState("")
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    setOrigin(window.location.origin)
    if (!getToken()) {
      router.replace("/login")
      return
    }
    getCertificates()
      .then(setCerts)
      .catch(() => router.replace("/login"))
      .finally(() => setLoading(false))
  }, [router])

  const handleDownload = async (cert: Certificate) => {
    setDownloadingId(cert.id)
    try {
      await downloadCertificatePdf(cert.id, `certificate-${cert.record.vaccine.name}.pdf`)
    } catch {
      showToast("Download failed.", "error")
    } finally {
      setDownloadingId(null)
    }
  }

  if (loading) {
    return (
      <div className="mobile-container">
        <div className="min-h-screen bg-background content-with-nav">
          <Header />
          <LoadingSpinner size="lg" />
        </div>
        <BottomNav active="certificates" />
      </div>
    )
  }

  if (certs.length === 0) {
    return (
      <div className="mobile-container">
        <div className="min-h-screen bg-background content-with-nav">
          <Header />
          <EmptyState
            icon={
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            }
            title="No certificates yet"
            description="Open a vaccine record and tap 'Generate Certificate' to create your first verified certificate."
            actionLabel="View Vaccines"
            onAction={() => (window.location.href = "/vaccines")}
          />
        </div>
        <BottomNav active="certificates" />
      </div>
    )
  }

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-background content-with-nav">
        <Header />

        <div className="p-6 space-y-4">
          {certs.map((cert) => {
            const verifyUrl = `${origin}/verify/${cert.verificationCode}`
            return (
              <Card key={cert.id} className="p-4 mobile-card">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-1">
                      {cert.record.vaccine.name} Certificate
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      {cert.record.patient.fullName} • Dose {cert.record.doseNumber} of{" "}
                      {cert.record.vaccine.totalDoses}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-success text-success-foreground text-xs">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Verified
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(cert.issuedAt), "MMM d, yyyy")}
                      </span>
                    </div>
                  </div>
                  <div className="w-20 h-20 bg-white border border-border rounded-lg p-1 flex-shrink-0">
                    <QrCode value={verifyUrl} size={72} />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mb-3 font-mono">Code: {cert.verificationCode}</p>

                <div className="flex gap-2">
                  <Link href={`/verify/${cert.verificationCode}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full bg-transparent">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Verify
                    </Button>
                  </Link>
                  <Button size="sm" className="flex-1" disabled={downloadingId === cert.id} onClick={() => handleDownload(cert)}>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    {downloadingId === cert.id ? "..." : "Download"}
                  </Button>
                </div>
              </Card>
            )
          })}

          <Card className="bg-accent/50 border-primary/20 p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Verifiable certificates</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Each certificate has a unique QR code. Anyone can scan it to instantly confirm it is genuine — no
                  login required.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <BottomNav active="certificates" />
    </div>
  )
}
