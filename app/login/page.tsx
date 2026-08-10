"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/toast-provider"
import { ApiError, login, register } from "@/lib/api"

const DEMO_CREDENTIALS = {
  email: "demo@vaccinerlog.app",
  password: "demo1234",
  fullName: "Demo User",
}

export default function LoginPage() {
  const router = useRouter()
  const { showToast } = useToast()

  const [showEmailForm, setShowEmailForm] = useState(false)
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleEmailSubmit = async () => {
    setError(null)
    if (!email || !password || (isRegister && !fullName)) {
      setError("Please fill in all fields.")
      return
    }
    setLoading(true)
    try {
      if (isRegister) {
        await register({ email, password, fullName })
        showToast("Account created!", "success")
      } else {
        await login({ email, password })
        showToast("Welcome back!", "success")
      }
      router.push("/dashboard")
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Something went wrong. Is the backend running?"
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleDemoMode = async () => {
    setLoading(true)
    setError(null)
    try {
      // Try to log in to the shared demo account; create it the first time.
      try {
        await login({ email: DEMO_CREDENTIALS.email, password: DEMO_CREDENTIALS.password })
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          await register(DEMO_CREDENTIALS)
        } else {
          throw err
        }
      }
      showToast("Signed in to demo account", "success")
      router.push("/dashboard")
    } catch {
      showToast("Could not reach the backend. Is it running on port 3001?", "error")
    } finally {
      setLoading(false)
    }
  }

  const comingSoon = () =>
    showToast("This login method is coming soon — use Email or Demo Mode.", "info")

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

          {!showEmailForm ? (
            <div className="space-y-4">
              <Button
                onClick={handleDemoMode}
                disabled={loading}
                className="w-full h-14 text-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                size="lg"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Demo Mode (Skip Login)
                  </>
                )}
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
                onClick={() => {
                  setShowEmailForm(true)
                  setError(null)
                }}
                className="w-full h-14 text-lg bg-primary hover:bg-primary/90"
                size="lg"
              >
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                Continue with Email
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-muted"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-background text-muted-foreground">Coming soon</span>
                </div>
              </div>

              <Button onClick={comingSoon} variant="outline" className="w-full h-12" size="lg">
                Continue with Google
              </Button>
              <Button onClick={comingSoon} variant="outline" className="w-full h-12" size="lg">
                Login with Mobile Number
              </Button>
              <Button onClick={comingSoon} variant="outline" className="w-full h-12" size="lg">
                Login with Aadhaar
              </Button>
              <Button onClick={comingSoon} variant="outline" className="w-full h-12" size="lg">
                Login with ABHA / Health ID
              </Button>
            </div>
          ) : (
            <div className="bg-card rounded-2xl shadow-lg p-6 space-y-5">
              <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => {
                    setIsRegister(false)
                    setError(null)
                  }}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                    !isRegister ? "bg-background shadow text-foreground" : "text-muted-foreground"
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setIsRegister(true)
                    setError(null)
                  }}
                  className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                    isRegister ? "bg-background shadow text-foreground" : "text-muted-foreground"
                  }`}
                >
                  Create Account
                </button>
              </div>

              {isRegister && (
                <div>
                  <Label htmlFor="fullName" className="text-base">
                    Full Name
                  </Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Yashwanth Kumar"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-2 h-12"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="email" className="text-base">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 h-12"
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-base">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
                  className="mt-2 h-12"
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="space-y-3">
                <Button onClick={handleEmailSubmit} disabled={loading} className="w-full h-12 text-base" size="lg">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Please wait...
                    </>
                  ) : isRegister ? (
                    "Create Account"
                  ) : (
                    "Sign In"
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowEmailForm(false)
                    setError(null)
                  }}
                  variant="ghost"
                  className="w-full"
                >
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
    </div>
  )
}
