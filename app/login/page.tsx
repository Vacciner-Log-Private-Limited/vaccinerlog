"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export default function LoginPage() {
  const router = useRouter()
  const [loginMethod, setLoginMethod] = useState<"aadhaar" | "abha" | "mobile" | "google" | null>(null)
  const [idNumber, setIdNumber] = useState("")
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [consent, setConsent] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  const handleSendOtp = () => {
    const minLength = loginMethod === "mobile" ? 10 : 12
    if (idNumber.length >= minLength && consent) {
      setShowOtpModal(true)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp]
      newOtp[index] = value
      setOtp(newOtp)

      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`)
        nextInput?.focus()
      }
    }
  }

  const handleVerifyOtp = () => {
    setIsVerifying(true)
    setTimeout(() => {
      router.push("/dashboard")
    }, 1500)
  }

  const handleGoogleLogin = () => {
    setIsVerifying(true)
    // Simulate Google OAuth flow
    setTimeout(() => {
      router.push("/dashboard")
    }, 1500)
  }

  const handleDemoMode = () => {
    console.log("[v0] Demo mode activated")
    router.push("/dashboard")
  }

  return (
    <div className="mobile-container">
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/5 to-background p-6">
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center w-20 h-20 bg-primary rounded-2xl shadow-lg mx-auto mb-4 p-2">
              <Image src="/logo.jpg" alt="Vacciner Log" width={80} height={80} className="object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome to Vacciner Log</h1>
            <p className="text-muted-foreground">Access your vaccination records securely</p>
          </div>

          {!loginMethod ? (
            <div className="space-y-4">
              <Button
                onClick={handleDemoMode}
                className="w-full h-14 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                size="lg"
              >
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Demo Mode (Skip Login)
              </Button>

              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-muted"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-background text-muted-foreground">Or login with</span>
                </div>
              </div>

              <Button
                onClick={handleGoogleLogin}
                className="w-full h-14 text-lg bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-200"
                size="lg"
              >
                <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              <Button
                onClick={() => setLoginMethod("mobile")}
                className="w-full h-14 text-lg bg-accent hover:bg-accent/90"
                size="lg"
              >
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                Login with Mobile Number
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-muted"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-background text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                onClick={() => setLoginMethod("aadhaar")}
                className="w-full h-14 text-lg bg-primary hover:bg-primary/90"
                size="lg"
              >
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                  />
                </svg>
                Login with Aadhaar
              </Button>
              <Button
                onClick={() => setLoginMethod("abha")}
                className="w-full h-14 text-lg bg-secondary hover:bg-secondary/90"
                size="lg"
              >
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Login with ABHA / Health ID
              </Button>
            </div>
          ) : (
            <div className="bg-card rounded-2xl shadow-lg p-6 space-y-6">
              <div>
                <Label htmlFor="id-number" className="text-base">
                  {loginMethod === "aadhaar"
                    ? "Aadhaar Number"
                    : loginMethod === "mobile"
                      ? "Mobile Number"
                      : "ABHA / Health ID"}
                </Label>
                <Input
                  id="id-number"
                  type="text"
                  placeholder={
                    loginMethod === "aadhaar"
                      ? "XXXX XXXX XXXX"
                      : loginMethod === "mobile"
                        ? "+91 XXXXX XXXXX"
                        : "Enter Health ID"
                  }
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  className="mt-2 h-12 text-lg"
                  maxLength={loginMethod === "aadhaar" ? 12 : loginMethod === "mobile" ? 10 : 14}
                />
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="consent"
                  checked={consent}
                  onCheckedChange={(checked) => setConsent(checked as boolean)}
                  className="mt-1"
                />
                <label htmlFor="consent" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                  I authorize Vacciner Log to access my vaccination records from the government database
                </label>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handleSendOtp}
                  disabled={!consent || idNumber.length < (loginMethod === "mobile" ? 10 : 12)}
                  className="w-full h-12 text-base"
                  size="lg"
                >
                  Send OTP
                </Button>
                <Button onClick={() => setLoginMethod(null)} variant="ghost" className="w-full">
                  Back to login options
                </Button>
              </div>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground mt-8">
            Powered by India&apos;s National Health Mission
          </p>
        </div>
      </div>

      <Dialog open={showOtpModal} onOpenChange={setShowOtpModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Enter OTP</DialogTitle>
            <DialogDescription>We&apos;ve sent a 6-digit code to your registered mobile number</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  className="w-12 h-12 text-center text-xl font-semibold"
                />
              ))}
            </div>
            <Button
              onClick={handleVerifyOtp}
              disabled={otp.some((d) => !d) || isVerifying}
              className="w-full h-12"
              size="lg"
            >
              {isVerifying ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Verifying...
                </>
              ) : (
                "Verify & Continue"
              )}
            </Button>
            <button className="text-sm text-primary hover:underline w-full text-center">Resend OTP</button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
