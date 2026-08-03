"use client"

import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BottomNav } from "@/components/bottom-nav"

const reminders = [
  {
    id: 1,
    vaccine: "Hepatitis B",
    dose: "Dose 3 of 3",
    date: "Nov 15, 2025",
    status: "upcoming",
    daysLeft: 19,
  },
  {
    id: 2,
    vaccine: "Influenza (Flu)",
    dose: "Annual Dose",
    date: "Dec 10, 2025",
    status: "upcoming",
    daysLeft: 44,
  },
  {
    id: 3,
    vaccine: "COVID-19 Booster",
    dose: "Booster",
    date: "Jan 20, 2026",
    status: "scheduled",
    daysLeft: 85,
  },
]

export default function RemindersPage() {
  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-background content-with-nav">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 pb-8 rounded-b-3xl">
          <div className="flex items-center justify-between mb-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-white">Reminders</h1>
            <div className="w-10" />
          </div>
          <p className="text-white/90 text-sm">Never miss a vaccination with timely reminders</p>
        </div>

        {/* Add Reminder Button */}
        <div className="p-6 pb-4">
          <Button className="w-full h-12 bg-orange-500 hover:bg-orange-600" size="lg">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Custom Reminder
          </Button>
        </div>

        {/* Reminders List */}
        <div className="px-6 pb-6 space-y-3">
          {reminders.map((reminder) => (
            <Card key={reminder.id} className="p-4 mobile-card">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{reminder.vaccine}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{reminder.dose}</p>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={
                        reminder.status === "upcoming"
                          ? "bg-orange-500 text-white"
                          : "bg-secondary text-secondary-foreground"
                      }
                    >
                      {reminder.status === "upcoming" ? "Due Soon" : "Scheduled"}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{reminder.daysLeft} days left</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>Scheduled for {reminder.date}</span>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Mark as Done
                </Button>
                <Button size="sm" className="flex-1 bg-orange-500 hover:bg-orange-600">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Reschedule
                </Button>
              </div>
            </Card>
          ))}

          {/* Calendar Sync Card */}
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
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground mb-1">Sync with Calendar</p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  Connect your Google Calendar to automatically sync vaccine reminders
                </p>
                <Button size="sm" variant="outline">
                  Connect Calendar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
