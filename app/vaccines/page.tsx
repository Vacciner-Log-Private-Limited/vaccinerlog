"use client"

import { useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BottomNav } from "@/components/bottom-nav"

const vaccines = [
  {
    id: 1,
    name: "COVID-19 - Covishield",
    dose: "Dose 2 of 2",
    date: "Oct 20, 2025",
    hospital: "Apollo Hospital, Hyderabad",
    verified: true,
    batch: "COV-2025-1234",
  },
  {
    id: 2,
    name: "COVID-19 - Covishield",
    dose: "Dose 1 of 2",
    date: "Sep 15, 2025",
    hospital: "Apollo Hospital, Hyderabad",
    verified: true,
    batch: "COV-2025-0987",
  },
  {
    id: 3,
    name: "Influenza (Flu)",
    dose: "Annual Dose",
    date: "Aug 10, 2025",
    hospital: "Care Hospital, Hyderabad",
    verified: true,
    batch: "FLU-2025-5678",
  },
  {
    id: 4,
    name: "Hepatitis B",
    dose: "Dose 2 of 3",
    date: "Jul 5, 2025",
    hospital: "KIMS Hospital, Hyderabad",
    verified: true,
    batch: "HEP-2025-3456",
  },
  {
    id: 5,
    name: "Tetanus",
    dose: "Booster",
    date: "Jun 12, 2025",
    hospital: "Yashoda Hospital, Hyderabad",
    verified: true,
    batch: "TET-2025-7890",
  },
]

export default function VaccinesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filter, setFilter] = useState("all")
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const filteredVaccines = vaccines.filter((vaccine) => {
    const matchesSearch =
      vaccine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vaccine.date.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filter === "all" || (filter === "verified" && vaccine.verified)
    return matchesSearch && matchesFilter
  })

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
            <h1 className="text-2xl font-bold text-white">My Vaccines</h1>
            <div className="w-10" />
          </div>

          {/* Search Bar */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <Input
              type="text"
              placeholder="Search by vaccine name or date"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-white"
            />
          </div>
        </div>

        {/* Filter */}
        <div className="p-6 pb-4">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter vaccines" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vaccines</SelectItem>
              <SelectItem value="verified">Verified Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Vaccine List */}
        <div className="px-6 pb-6 space-y-3">
          {filteredVaccines.map((vaccine) => (
            <Card
              key={vaccine.id}
              className="p-4 mobile-card cursor-pointer"
              onClick={() => setExpandedId(expandedId === vaccine.id ? null : vaccine.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">{vaccine.name}</h3>
                  <p className="text-sm text-muted-foreground">{vaccine.dose}</p>
                </div>
                {vaccine.verified && (
                  <Badge className="bg-success text-success-foreground">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Verified
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {vaccine.date}
                </div>
              </div>

              <div className="flex items-start gap-2 text-sm text-muted-foreground mb-3">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span>{vaccine.hospital}</span>
              </div>

              {expandedId === vaccine.id && (
                <div className="pt-3 border-t border-border space-y-2 animate-fade-in">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Batch Number:</span>
                    <span className="font-medium">{vaccine.batch}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Manufacturer:</span>
                    <span className="font-medium">Serum Institute</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expiry Date:</span>
                    <span className="font-medium">Dec 2026</span>
                  </div>
                  <Link href={`/certificates/${vaccine.id}`}>
                    <Button className="w-full mt-3" size="sm">
                      View Certificate
                    </Button>
                  </Link>
                </div>
              )}

              {expandedId !== vaccine.id && (
                <Button variant="outline" size="sm" className="w-full bg-transparent">
                  View Details
                </Button>
              )}
            </Card>
          ))}
        </div>
      </div>

      <BottomNav active="vaccines" />
    </div>
  )
}
