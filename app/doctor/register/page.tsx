"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Stethoscope, LogIn, UserPlus, ArrowLeft, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/toast-provider"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ApiError, registerDoctor, login } from "@/lib/api"

function DoctorAuthContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()

  // Default to signin if mode=signin, otherwise default to register if mode=register or unassigned
  const initialMode = searchParams?.get("mode") === "signin"
  const [isSignIn, setIsSignIn] = useState(initialMode)

  // Sign In state
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  // Register state
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    registrationNumber: "",
    specialization: "",
    clinicName: "",
    city: "",
    phone: "",
  })
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerError, setRegisterError] = useState<string | null>(null)

  useEffect(() => {
    const mode = searchParams?.get("mode")
    if (mode === "signin") {
      setIsSignIn(true)
    } else if (mode === "register") {
      setIsSignIn(false)
    }
  }, [searchParams])

  const setFormField = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  // Handle Doctor Sign In
  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setLoginError(null)

    if (!loginEmail.trim() || !loginPassword) {
      setLoginError("Please enter both email and password.")
      return
    }

    setLoginLoading(true)
    try {
      const res = await login({
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
      })

      if (res.user.role === "PROVIDER") {
        showToast("Welcome back, Doctor!", "success")
        router.replace("/doctor")
      } else if (res.user.role === "ADMIN") {
        showToast("Signed in as Administrator.", "success")
        router.replace("/admin")
      } else {
        showToast("Signed in successfully.", "success")
        router.replace("/dashboard")
      }
    } catch (err: any) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Invalid email or password. Please verify your credentials."
      setLoginError(msg)
      showToast(msg, "error")
    } finally {
      setLoginLoading(false)
    }
  }

  // Handle Doctor Registration
  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    setRegisterError(null)

    if (!form.fullName.trim() || !form.email.trim() || !form.password || !form.registrationNumber.trim()) {
      setRegisterError("Full name, email, password, and medical registration number are required.")
      showToast("Please fill in all required fields.", "error")
      return
    }

    if (form.password.length < 8) {
      setRegisterError("Password must be at least 8 characters long.")
      showToast("Password must be at least 8 characters.", "error")
      return
    }

    setRegisterLoading(true)
    try {
      await registerDoctor({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        registrationNumber: form.registrationNumber.trim(),
        specialization: form.specialization.trim() || undefined,
        clinicName: form.clinicName.trim() || undefined,
        city: form.city.trim() || undefined,
        phone: form.phone.trim() || undefined,
      })

      showToast("Doctor account created — awaiting admin approval.", "success")
      router.replace("/doctor")
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : "Could not create doctor account."
      setRegisterError(msg)
      showToast(msg, "error")
    } finally {
      setRegisterLoading(false)
    }
  }

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-background pb-12">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary via-primary/95 to-secondary p-6 pb-10 rounded-b-3xl text-white shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Link href="/login">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-9 w-9">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                {isSignIn ? "Doctor Sign-in" : "Doctor Sign-up"}
              </h1>
            </div>
          </div>
          <p className="text-white/90 text-xs leading-relaxed max-w-sm">
            {isSignIn
              ? "Sign in to access your consultations, scheduled appointments, patient records, and peer community."
              : "Register your practice. An admin verifies your medical registration number before you can see patients."}
          </p>
        </div>

        <div className="p-5 space-y-4 -mt-5">
          <div className="bg-card rounded-2xl shadow-lg border border-border p-5 space-y-4">
            {/* Top Switcher: Sign In vs Register */}
            <div className="flex bg-muted p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setIsSignIn(true)
                  setLoginError(null)
                }}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  isSignIn
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignIn(false)
                  setRegisterError(null)
                }}
                className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  !isSignIn
                    ? "bg-card text-foreground shadow-xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Register Practice
              </button>
            </div>

            {/* ==================== DOCTOR SIGN IN FORM ==================== */}
            {isSignIn ? (
              <form onSubmit={handleSignIn} className="space-y-4 pt-1">
                <div>
                  <Label htmlFor="loginEmail" className="text-xs font-semibold">
                    Doctor Email Address
                  </Label>
                  <Input
                    id="loginEmail"
                    type="email"
                    placeholder="dr.suresh@clinic.in"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="mt-1 h-11 text-xs rounded-xl"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="loginPassword" className="text-xs font-semibold">
                    Password
                  </Label>
                  <Input
                    id="loginPassword"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="mt-1 h-11 text-xs rounded-xl"
                    required
                  />
                </div>

                {loginError && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs leading-relaxed">
                    {loginError}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full h-11 rounded-xl text-xs font-bold shadow-xs gap-2"
                >
                  {loginLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Signing In...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Sign In to Doctor Portal
                    </>
                  )}
                </Button>

                <div className="pt-2 text-center">
                  <p className="text-xs text-muted-foreground">
                    Don&apos;t have a registered doctor account yet?{" "}
                    <button
                      type="button"
                      onClick={() => setIsSignIn(false)}
                      className="text-primary font-bold hover:underline"
                    >
                      Register practice
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              /* ==================== DOCTOR SIGN UP FORM ==================== */
              <form onSubmit={handleRegister} className="space-y-3.5 pt-1">
                <div>
                  <Label htmlFor="fullName" className="text-xs font-semibold">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    placeholder="Dr. Suresh Rao"
                    value={form.fullName}
                    onChange={setFormField("fullName")}
                    className="mt-1 h-10 text-xs rounded-xl"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="registrationNumber" className="text-xs font-semibold">
                    Medical Council Registration Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="registrationNumber"
                    placeholder="TSMC-2015-44718"
                    value={form.registrationNumber}
                    onChange={setFormField("registrationNumber")}
                    className="mt-1 h-10 text-xs rounded-xl"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    State or National Medical Commission registration ID.
                  </p>
                </div>

                <div>
                  <Label htmlFor="specialization" className="text-xs font-semibold">
                    Specialization
                  </Label>
                  <Input
                    id="specialization"
                    placeholder="e.g. Pediatrician, General Physician, Immunologist"
                    value={form.specialization}
                    onChange={setFormField("specialization")}
                    className="mt-1 h-10 text-xs rounded-xl"
                  />
                </div>

                <div>
                  <Label htmlFor="clinicName" className="text-xs font-semibold">
                    Clinic / Hospital / Practice
                  </Label>
                  <Input
                    id="clinicName"
                    placeholder="Apollo Clinic / Rainbow Children Hospital"
                    value={form.clinicName}
                    onChange={setFormField("clinicName")}
                    className="mt-1 h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <Label htmlFor="city" className="text-xs font-semibold">
                      City
                    </Label>
                    <Input
                      id="city"
                      placeholder="Hyderabad"
                      value={form.city}
                      onChange={setFormField("city")}
                      className="mt-1 h-10 text-xs rounded-xl"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-xs font-semibold">
                      Contact Number
                    </Label>
                    <Input
                      id="phone"
                      placeholder="+91 98765 43210"
                      value={form.phone}
                      onChange={setFormField("phone")}
                      className="mt-1 h-10 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="border-t border-border pt-3 space-y-3">
                  <div>
                    <Label htmlFor="email" className="text-xs font-semibold">
                      Login Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="dr.suresh@clinic.in"
                      value={form.email}
                      onChange={setFormField("email")}
                      className="mt-1 h-10 text-xs rounded-xl"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-xs font-semibold">
                      Password (min 8 characters) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={setFormField("password")}
                      className="mt-1 h-10 text-xs rounded-xl"
                      required
                    />
                  </div>
                </div>

                {registerError && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs leading-relaxed space-y-1">
                    <p>{registerError}</p>
                    {registerError.includes("already exists") && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsSignIn(true)
                          setLoginEmail(form.email)
                        }}
                        className="text-xs font-bold underline block text-primary"
                      >
                        Click here to Sign In with this email instead
                      </button>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={registerLoading}
                  className="w-full h-11 rounded-xl text-xs font-bold shadow-xs gap-2 mt-1"
                >
                  {registerLoading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Creating Doctor Account...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Create Doctor Account
                    </>
                  )}
                </Button>

                <div className="pt-2 text-center">
                  <p className="text-xs text-muted-foreground">
                    Already registered your practice?{" "}
                    <button
                      type="button"
                      onClick={() => setIsSignIn(true)}
                      className="text-primary font-bold hover:underline"
                    >
                      Sign in with email &amp; password
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Not a healthcare provider?{" "}
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Citizen portal sign-in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function DoctorRegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <DoctorAuthContent />
    </Suspense>
  )
}
