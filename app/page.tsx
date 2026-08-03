"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function SplashScreen() {
  const router = useRouter()
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true)
      setTimeout(() => {
        router.push("/login")
      }, 500)
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="mobile-container">
      <div
        className={`flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-primary to-secondary p-6 transition-opacity duration-500 ${
          fadeOut ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="flex items-center justify-center w-32 h-32 bg-white rounded-3xl shadow-lg mb-6 animate-fade-in p-4">
          <Image src="/logo.jpg" alt="Vacciner Log" width={120} height={120} className="object-contain" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-3 text-center animate-fade-in">Vacciner Log</h1>
        <p className="text-white/90 text-center text-lg max-w-xs animate-fade-in">
          Your trusted health record, verified by the government
        </p>
        <div className="mt-12 animate-pulse">
          <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      </div>
    </div>
  )
}
