"use client"

import { useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BottomNav } from "@/components/bottom-nav"
import { VerifyCertificateModal } from "@/components/verify-certificate-modal"
import { EmptyState } from "@/components/empty-state"
import { useToast } from "@/components/toast-provider"

const certificates = [
  {
    id: 1,
    name: "COVID-19 Vaccination Certificate",
    vaccine: "Covishield",
    doses: "2/2",
    date: "Oct 20, 2025",
    verified: true,
  },
  {
    id: 2,
    name: "Influenza Vaccination Certificate",
    vaccine: "Flu Shot",
    doses: "1/1",
    date: "Aug 10, 2025",
    verified: true,
  },
  {
    id: 3,
    name: "Hepatitis B Certificate",
    vaccine: "Hepatitis B",
    doses: "2/3",
    date: "Jul 5, 2025",
    verified: true,
  },
]

export default function CertificatesPage() {
  const [verifyModalOpen, setVerifyModalOpen] = useState(false)
  const [selectedCert, setSelectedCert] = useState<string>("")
  const { showToast } = useToast()

  const handleDownload = (certName: string) => {
    showToast(`Downloading ${certName}...`, "success")
  }

  const handleVerify = (certName: string) => {
    setSelectedCert(certName)
    setVerifyModalOpen(true)
  }

  if (certificates.length === 0) {
    return (
      <div className="mobile-container">
        <div className="min-h-screen bg-background content-with-nav">
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
              <div className="w-10" />
            </div>
          </div>

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
            description="Get vaccinated to receive your first digital certificate verified by the government."
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
        {/* Header */}
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

        {/* Certificates List */}
        <div className="p-6 space-y-4">
          {certificates.map((cert) => (
            <Card key={cert.id} className="p-4 mobile-card">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{cert.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {cert.vaccine} • {cert.doses} doses
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-success text-success-foreground text-xs">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Verified
                    </Badge>
                    <span className="text-xs text-muted-foreground">{cert.date}</span>
                  </div>
                </div>
                <div className="w-16 h-16 bg-white border border-border rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-full h-full p-1" viewBox="0 0 100 100">
                    <rect width="100" height="100" fill="white" />
                    <rect x="10" y="10" width="10" height="10" fill="black" />
                    <rect x="30" y="10" width="10" height="10" fill="black" />
                    <rect x="50" y="10" width="10" height="10" fill="black" />
                    <rect x="70" y="10" width="10" height="10" fill="black" />
                    <rect x="10" y="30" width="10" height="10" fill="black" />
                    <rect x="70" y="30" width="10" height="10" fill="black" />
                    <rect x="10" y="50" width="10" height="10" fill="black" />
                    <rect x="30" y="50" width="10" height="10" fill="black" />
                    <rect x="50" y="50" width="10" height="10" fill="black" />
                    <rect x="70" y="50" width="10" height="10" fill="black" />
                    <rect x="10" y="70" width="10" height="10" fill="black" />
                    <rect x="70" y="70" width="10" height="10" fill="black" />
                  </svg>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 bg-transparent"
                  onClick={() => handleVerify(cert.name)}
                >
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
                <Button size="sm" className="flex-1" onClick={() => handleDownload(cert.name)}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download
                </Button>
              </div>
            </Card>
          ))}

          {/* Info Card */}
          <Card className="bg-accent/50 border-primary/20 p-4">
            <div className="flex gap-3">
              <svg
                className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Digitally Verified Certificates</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  All certificates are digitally verified by the Government of India and can be shared via QR code for
                  instant verification.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <BottomNav active="certificates" />
      <VerifyCertificateModal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        certificateName={selectedCert}
      />
    </div>
  )
}
