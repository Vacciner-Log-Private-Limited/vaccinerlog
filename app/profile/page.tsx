"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { BottomNav } from "@/components/bottom-nav"

export default function ProfilePage() {
  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-background content-with-nav">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary p-6 pb-12 rounded-b-3xl">
          <div className="flex items-center justify-between mb-6">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white">Profile</h1>
            <div className="w-10" />
          </div>

          <div className="flex flex-col items-center">
            <Avatar className="w-24 h-24 border-4 border-white shadow-lg mb-3">
              <AvatarFallback className="bg-white text-primary font-bold text-2xl">YK</AvatarFallback>
            </Avatar>
            <h2 className="text-xl font-bold text-white mb-1">Yashwanth Kumar</h2>
            <p className="text-white/80 text-sm">Health ID: 91-XXXX-XXXX-1234</p>
          </div>
        </div>

        {/* Personal Information */}
        <div className="p-6 space-y-4">
          <h3 className="font-semibold text-lg text-foreground">Personal Information</h3>
          <Card className="p-4 space-y-3">
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Full Name</span>
              <span className="font-medium">Yashwanth Kumar</span>
            </div>
            <div className="border-t border-border" />
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Date of Birth</span>
              <span className="font-medium">Jan 15, 1995</span>
            </div>
            <div className="border-t border-border" />
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Gender</span>
              <span className="font-medium">Male</span>
            </div>
            <div className="border-t border-border" />
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-muted-foreground">Aadhaar Number</span>
              <span className="font-medium">XXXX XXXX 1234</span>
            </div>
          </Card>

          {/* Settings */}
          <h3 className="font-semibold text-lg text-foreground pt-4">Settings</h3>
          <Card className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="dark-mode" className="font-medium">
                  Dark Mode
                </Label>
                <p className="text-xs text-muted-foreground">Enable dark theme</p>
              </div>
              <Switch id="dark-mode" />
            </div>
            <div className="border-t border-border" />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications" className="font-medium">
                  Notifications
                </Label>
                <p className="text-xs text-muted-foreground">Vaccine reminders & updates</p>
              </div>
              <Switch id="notifications" defaultChecked />
            </div>
            <div className="border-t border-border" />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="language" className="font-medium">
                  Language
                </Label>
                <p className="text-xs text-muted-foreground">English</p>
              </div>
              <Button variant="ghost" size="sm">
                Change
              </Button>
            </div>
          </Card>

          {/* Quick Links */}
          <h3 className="font-semibold text-lg text-foreground pt-4">Quick Links</h3>
          <Card className="p-4 space-y-3">
            <Link href="/family">
              <button className="w-full flex items-center justify-between py-2 hover:bg-accent/50 rounded-lg px-2 transition-colors">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span className="font-medium">Manage Family</span>
                </div>
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </Link>
            <div className="border-t border-border" />
            <Link href="/support">
              <button className="w-full flex items-center justify-between py-2 hover:bg-accent/50 rounded-lg px-2 transition-colors">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                  <span className="font-medium">Help & Support</span>
                </div>
                <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </Link>
            <div className="border-t border-border" />
            <button className="w-full flex items-center justify-between py-2 hover:bg-accent/50 rounded-lg px-2 transition-colors">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="font-medium">About Vacciner Log</span>
              </div>
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </Card>

          {/* Logout Button */}
          <Button
            variant="destructive"
            className="w-full h-12 mt-6"
            size="lg"
            onClick={() => (window.location.href = "/login")}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </Button>

          <p className="text-center text-xs text-muted-foreground pt-4 pb-2">
            Vacciner Log v1.0.0 • Powered by National Health Mission
          </p>
        </div>
      </div>

      <BottomNav active="profile" />
    </div>
  )
}
