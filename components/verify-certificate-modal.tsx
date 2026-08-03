"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface VerifyCertificateModalProps {
  isOpen: boolean
  onClose: () => void
  certificateName: string
}

export function VerifyCertificateModal({ isOpen, onClose, certificateName }: VerifyCertificateModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
      <div className="bg-background w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Verify Certificate</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        <div className="text-center space-y-4">
          <div className="w-48 h-48 mx-auto bg-white border-2 border-border rounded-lg flex items-center justify-center">
            <svg className="w-full h-full p-4" viewBox="0 0 100 100">
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

          <div>
            <Badge className="bg-success text-success-foreground mb-2">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Verified
            </Badge>
            <h3 className="font-semibold text-lg text-foreground mb-1">{certificateName}</h3>
            <p className="text-sm text-muted-foreground">
              This certificate is digitally verified by the Government of India
            </p>
          </div>

          <div className="bg-accent/50 rounded-lg p-4 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Certificate ID:</span>
              <span className="font-medium">CERT-2025-1234</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Issued Date:</span>
              <span className="font-medium">Oct 20, 2025</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Issuing Authority:</span>
              <span className="font-medium">National Health Mission</span>
            </div>
          </div>

          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
