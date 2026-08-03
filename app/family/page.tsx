"use client"

import { useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { BottomNav } from "@/components/bottom-nav"
import { AddFamilyModal } from "@/components/add-family-modal"

const familyMembers = [
  {
    id: 1,
    name: "Priya Kumar",
    relationship: "Spouse",
    age: 28,
    vaccines: 10,
    nextDue: "Nov 20, 2025",
    initials: "PK",
  },
  {
    id: 2,
    name: "Aarav Kumar",
    relationship: "Son",
    age: 5,
    vaccines: 15,
    nextDue: "Dec 5, 2025",
    initials: "AK",
  },
  {
    id: 3,
    name: "Lakshmi Kumar",
    relationship: "Mother",
    age: 62,
    vaccines: 8,
    nextDue: "Jan 10, 2026",
    initials: "LK",
  },
]

export default function FamilyPage() {
  const [addModalOpen, setAddModalOpen] = useState(false)

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
            <h1 className="text-2xl font-bold text-white">My Family</h1>
            <div className="w-10" />
          </div>
          <p className="text-white/90 text-sm">Manage vaccination records for your family members</p>
        </div>

        <div className="p-6 pb-4">
          <Button
            className="w-full h-12 bg-success hover:bg-success/90"
            size="lg"
            onClick={() => setAddModalOpen(true)}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Family Member
          </Button>
        </div>

        {/* Family Members List */}
        <div className="px-6 pb-6 space-y-3">
          {familyMembers.map((member) => (
            <Card key={member.id} className="p-4 mobile-card">
              <div className="flex items-start gap-3 mb-4">
                <Avatar className="w-14 h-14 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                    {member.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{member.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {member.relationship}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{member.age} years</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-accent/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-primary mb-1">{member.vaccines}</div>
                  <div className="text-xs text-muted-foreground">Total Vaccines</div>
                </div>
                <div className="bg-accent/50 rounded-lg p-3">
                  <div className="text-sm font-semibold text-foreground mb-1">{member.nextDue}</div>
                  <div className="text-xs text-muted-foreground">Next Due</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  View Records
                </Button>
                <Button size="sm" className="flex-1">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Certificates
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
                <p className="text-sm font-medium text-foreground mb-1">Add Family Members</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You can add up to 5 family members and manage their vaccination records from your account. Each member
                  needs their own Aadhaar or ABHA number.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <BottomNav active="family" />
      <AddFamilyModal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} />
    </div>
  )
}
