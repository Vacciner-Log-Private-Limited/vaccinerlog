"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Globe,
  Info,
  Plane,
  PlusCircle,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BottomNav } from "@/components/bottom-nav"
import { LoadingSpinner } from "@/components/loading-spinner"
import { AddReminderModal } from "@/components/add-reminder-modal"
import { useToast } from "@/components/toast-provider"
import {
  CDC_MAIN_URL,
  CDC_TRAVEL_HOME,
  DestinationCountry,
  getCdcDestinationUrl,
  matchVaccineWithRecords,
  ORIGIN_COUNTRY,
  POPULAR_DESTINATIONS,
  VaccineRequirement,
} from "@/lib/travel-vaccines"
import {
  ApiError,
  clearToken,
  getMe,
  getRecords,
  getVaccines,
  getToken,
  type Me,
  type Patient,
  type VaccinationRecord,
  type Vaccine,
} from "@/lib/api"

export default function EmbassyPage() {
  const router = useRouter()
  const { showToast } = useToast()

  const [me, setMe] = useState<Me | null>(null)
  const [records, setRecords] = useState<VaccinationRecord[]>([])
  const [vaccinesList, setVaccinesList] = useState<Vaccine[]>([])
  const [loading, setLoading] = useState(true)

  // Selected traveler (defaults to SELF)
  const [selectedPatientId, setSelectedPatientId] = useState<string>("")

  // Search and country selection
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCountry, setSelectedCountry] = useState<DestinationCountry>(
    POPULAR_DESTINATIONS[0] // Default: Germany
  )
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  // Close search dropdown on outside click or Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsSearchFocused(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("touchstart", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("touchstart", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  // Add Reminder modal
  const [reminderModalOpen, setReminderModalOpen] = useState(false)
  const [preselectedVaccineName, setPreselectedVaccineName] = useState<string>("")

  const loadData = useCallback(async () => {
    try {
      const [meData, recordsData, vaccinesData] = await Promise.all([
        getMe(),
        getRecords(),
        getVaccines(),
      ])
      setMe(meData)
      setRecords(recordsData)
      setVaccinesList(vaccinesData)

      const selfPatient =
        meData.patients.find((p) => p.accessRole === "SELF") ??
        meData.patients.find((p) => p.relation === "SELF") ??
        meData.patients[0]

      if (selfPatient && !selectedPatientId) {
        setSelectedPatientId(selfPatient.id)
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken()
        router.replace("/login")
      }
    } finally {
      setLoading(false)
    }
  }, [router, selectedPatientId])

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login")
      return
    }
    loadData()
  }, [router, loadData])

  // Current selected traveler
  const currentTraveler = useMemo(() => {
    if (!me?.patients?.length) return null
    return (
      me.patients.find((p) => p.id === selectedPatientId) ??
      me.patients.find((p) => p.accessRole === "SELF") ??
      me.patients[0]
    )
  }, [me, selectedPatientId])

  // Records for the selected traveler
  const travelerRecords = useMemo(() => {
    if (!currentTraveler) return []
    return records.filter((r) => r.patient?.id === currentTraveler.id)
  }, [records, currentTraveler])

  // Autocomplete country suggestions based on user search
  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return POPULAR_DESTINATIONS.slice(0, 8)
    return POPULAR_DESTINATIONS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    )
  }, [searchQuery])

  // Compare destination requirements with the traveler's recorded vaccines
  const vaccineAnalysis = useMemo(() => {
    const missing: { requirement: VaccineRequirement }[] = []
    const completed: {
      requirement: VaccineRequirement
      matchedRecord: VaccinationRecord
    }[] = []

    for (const req of selectedCountry.vaccines) {
      const match = matchVaccineWithRecords(req.matchKeywords, travelerRecords)
      if (match.isTaken && match.matchedRecord) {
        completed.push({
          requirement: req,
          matchedRecord: match.matchedRecord,
        })
      } else {
        missing.push({ requirement: req })
      }
    }

    const mandatoryMissing = missing.filter(
      (m) => m.requirement.type === "MANDATORY"
    )

    return {
      missing,
      completed,
      mandatoryMissing,
      hasMandatoryMissing: mandatoryMissing.length > 0,
    }
  }, [selectedCountry, travelerRecords])

  const handleCountrySelect = (country: DestinationCountry) => {
    setSelectedCountry(country)
    setSearchQuery("")
    setIsSearchFocused(false)
  }

  const handleOpenReminder = (vaccineName: string) => {
    setPreselectedVaccineName(vaccineName)
    setReminderModalOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mobile-container bg-background content-with-nav">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-secondary p-5 pb-8 rounded-b-3xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-9 w-9"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-1.5">
                  <Plane className="w-5 h-5 text-white/90" />
                  Embassy &amp; Travel
                </h1>
                <p className="text-white/80 text-xs">
                  International vaccination guidelines &amp; entry rules
                </p>
              </div>
            </div>

            <Link href="/profile">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-9 w-9 bg-slate-700/50"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </Button>
            </Link>
          </div>

          {/* Traveler Switcher (Myself vs Family members) */}
          {me?.patients && me.patients.length > 1 && (
            <div className="bg-white/15 backdrop-blur-md rounded-2xl p-2.5 flex items-center justify-between gap-2 border border-white/20">
              <span className="text-xs text-white/95 font-medium shrink-0">Checking records for:</span>
              <Select
                value={selectedPatientId}
                onValueChange={(val) => setSelectedPatientId(val)}
              >
                <SelectTrigger className="w-auto min-w-[150px] max-w-[220px] h-8 text-xs font-semibold bg-background text-foreground border-border shadow-xs">
                  <SelectValue placeholder="Select traveler" />
                </SelectTrigger>
                <SelectContent className="z-50 bg-popover text-popover-foreground border-border shadow-lg">
                  {me.patients.map((p) => (
                    <SelectItem
                      key={p.id}
                      value={p.id}
                      className="text-xs font-medium text-foreground cursor-pointer focus:bg-accent focus:text-accent-foreground"
                    >
                      {p.fullName} {p.relation === "SELF" ? "(You)" : `(${p.relation.toLowerCase()})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Origin & Destination Card */}
        <div className="p-4 space-y-4 -mt-3">
          <Card className="p-4 space-y-4 border-border shadow-sm">
            {/* Origin: Default India */}
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{ORIGIN_COUNTRY.flag}</span>
                <div>
                  <span className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider block">
                    Departing From
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {ORIGIN_COUNTRY.name} (Default)
                  </span>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                Citizen Origin
              </Badge>
            </div>

            {/* Destination Search Box */}
            <div className="relative" ref={searchContainerRef}>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="destination-search"
                  className="text-xs font-semibold text-foreground"
                >
                  Travel to which country?
                </label>
                {isSearchFocused && (
                  <button
                    type="button"
                    onClick={() => setIsSearchFocused(false)}
                    className="text-[11px] text-muted-foreground hover:text-foreground font-medium"
                  >
                    Close
                  </button>
                )}
              </div>
              <div className="relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <Input
                  id="destination-search"
                  type="text"
                  placeholder="Search destination country (e.g., Germany, USA, Saudi Arabia)..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setIsSearchFocused(true)
                  }}
                  onFocus={() => setIsSearchFocused(true)}
                  className="pl-9 pr-8 text-sm"
                />
                {searchQuery.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("")
                      setIsSearchFocused(false)
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown */}
              {isSearchFocused && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-card border border-border rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-border/60">
                  <div className="p-2 bg-muted/40 flex items-center justify-between border-b border-border text-[11px] text-muted-foreground">
                    <span>Select a destination ({suggestions.length} available)</span>
                    <button
                      type="button"
                      onClick={() => setIsSearchFocused(false)}
                      className="text-primary hover:underline font-medium text-[11px]"
                    >
                      Dismiss
                    </button>
                  </div>
                  {suggestions.length === 0 ? (
                    <div className="p-3 text-center text-xs text-muted-foreground">
                      No matching country found in quick list. You can still verify on the CDC portal below.
                    </div>
                  ) : (
                    suggestions.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => handleCountrySelect(c)}
                        className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between hover:bg-muted/60 transition-colors ${
                          selectedCountry.code === c.code ? "bg-primary/5 font-semibold" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-muted text-foreground border border-border shrink-0 uppercase tracking-wider">
                            {c.code}
                          </span>
                          <div>
                            <div className="text-xs font-medium text-foreground flex items-center gap-1.5">
                              <span>{c.name}</span>
                              <span className="text-xs">{c.flag}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground">{c.region}</div>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Popular Destination Quick Chips */}
            <div>
              <p className="text-[11px] text-muted-foreground font-medium mb-1.5">
                Popular destinations:
              </p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                {POPULAR_DESTINATIONS.slice(0, 6).map((c) => (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleCountrySelect(c)}
                    className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all border ${
                      selectedCountry.code === c.code
                        ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                        : "bg-muted/40 hover:bg-muted text-foreground border-border/80"
                    }`}
                  >
                    <span>{c.flag}</span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Selected Destination Banner */}
          <Card className="p-4 space-y-3.5 border-border bg-gradient-to-br from-card via-card to-primary/5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-4xl p-1 bg-background rounded-xl border border-border shadow-xs">
                  {selectedCountry.flag}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-foreground">{selectedCountry.name}</h2>
                    <Badge variant="outline" className="text-[10px] font-normal">
                      {selectedCountry.region}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Official Embassy &amp; CDC Travel Health Regulations
                  </p>
                </div>
              </div>
            </div>

            {/* Embassy Advisory Notice */}
            <div className="flex items-start gap-2 bg-muted/40 p-3 rounded-xl border border-border/70 text-xs text-foreground/90">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="leading-relaxed">{selectedCountry.embassyNotice}</p>
            </div>

            {/* CDC Official Verification Portal Card */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Globe className="w-4 h-4" />
                  <span>Official CDC Travel Health Embassy Portal</span>
                </div>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                  Verified Source
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Click below to cross-check and confirm real-time embassy health notices directly on the Centers for Disease Control and Prevention (CDC) database for {selectedCountry.name}.
              </p>

              <div className="flex flex-col gap-2 pt-1 w-full">
                <a
                  href={getCdcDestinationUrl(selectedCountry.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full block"
                >
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full text-xs font-semibold justify-center gap-1.5 shadow-sm py-2.5 h-auto whitespace-normal leading-tight text-center"
                  >
                    <span>View {selectedCountry.name} on CDC Portal</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-1" />
                  </Button>
                </a>

                <div className="grid grid-cols-2 gap-2 w-full">
                  <a
                    href={CDC_TRAVEL_HOME}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full min-w-0 block"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-[11px] gap-1 justify-center h-8 px-2 truncate bg-background/80 hover:bg-muted"
                    >
                      <span className="truncate">CDC Travel Home</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </Button>
                  </a>

                  <a
                    href={CDC_MAIN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full min-w-0 block"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-[11px] gap-1 justify-center h-8 px-2 truncate bg-background/80 hover:bg-muted"
                    >
                      <span className="truncate">CDC.gov Main</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Metrics & Analysis Summary */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <Card className="p-2.5 border-border">
              <span className="text-xs text-muted-foreground block">Required</span>
              <span className="text-xl font-bold text-foreground">
                {selectedCountry.vaccines.length}
              </span>
            </Card>
            <Card className="p-2.5 border-border">
              <span className="text-xs text-muted-foreground block">In Your Log</span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {vaccineAnalysis.completed.length}
              </span>
            </Card>
            <Card className="p-2.5 border-border">
              <span className="text-xs text-muted-foreground block">Need to Take</span>
              <span
                className={`text-xl font-bold ${
                  vaccineAnalysis.missing.length > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-foreground"
                }`}
              >
                {vaccineAnalysis.missing.length}
              </span>
            </Card>
          </div>

          {/* Alert if mandatory vaccines are missing */}
          {vaccineAnalysis.hasMandatoryMissing && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Mandatory entry requirement missing!</strong>
                <span>
                  {selectedCountry.name} requires proof of specific vaccination before entry (e.g.,{" "}
                  {vaccineAnalysis.mandatoryMissing.map((m) => m.requirement.name).join(", ")}).
                  Obtain this vaccine and document it before your visa/flight.
                </span>
              </div>
            </div>
          )}

          {/* Section: Vaccines You Need to Take (Excluding already taken) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  Vaccines You Need to Take ({vaccineAnalysis.missing.length})
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Required or advised for {selectedCountry.name}, not found in your Vacciner Log
                </p>
              </div>
            </div>

            {vaccineAnalysis.missing.length === 0 ? (
              <Card className="p-5 text-center border-emerald-300/40 bg-emerald-500/5 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                <h4 className="text-sm font-bold text-foreground">You are fully up to date!</h4>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  All vaccines recommended for {selectedCountry.name} are already logged in your Vacciner Log records for {currentTraveler?.fullName}.
                </p>
              </Card>
            ) : (
              <div className="space-y-2.5">
                {vaccineAnalysis.missing.map(({ requirement }) => (
                  <Card
                    key={requirement.name}
                    className={`p-3.5 border transition-all ${
                      requirement.type === "MANDATORY"
                        ? "border-destructive/40 bg-destructive/5"
                        : "border-amber-300/40 dark:border-amber-800/40 bg-amber-500/5"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-foreground">
                            {requirement.name}
                          </span>
                          {requirement.type === "MANDATORY" ? (
                            <Badge className="bg-destructive text-destructive-foreground text-[10px] px-2 py-0.5">
                              Mandatory Entry
                            </Badge>
                          ) : requirement.type === "CONDITIONAL" ? (
                            <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700 dark:text-amber-300">
                              Conditional Risk
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-foreground/80 mt-1 font-medium">
                          {requirement.reason}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {requirement.details}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenReminder(requirement.name)}
                        className="text-xs gap-1 shrink-0 bg-background hover:bg-muted"
                      >
                        <PlusCircle className="w-3.5 h-3.5 text-primary" />
                        <span>Schedule</span>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Section: Already Vaccinated in Vacciner Log */}
          {vaccineAnalysis.completed.length > 0 && (
            <div className="space-y-3 pt-4">
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Already in Your Vacciner Log ({vaccineAnalysis.completed.length})
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Vaccines you have completed that match {selectedCountry.name}&apos;s travel criteria
                </p>
              </div>

              <div className="space-y-2">
                {vaccineAnalysis.completed.map(({ requirement, matchedRecord }) => (
                  <Card
                    key={requirement.name}
                    className="p-3 border-emerald-300/40 dark:border-emerald-800/40 bg-emerald-500/5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">
                          {matchedRecord.vaccine.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Dose {matchedRecord.doseNumber} · Administered on{" "}
                          {format(new Date(matchedRecord.dateAdministered), "dd MMM yyyy")}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {matchedRecord.verified && (
                        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 text-[10px]">
                          Verified
                        </Badge>
                      )}
                      <Link href="/certificates">
                        <Button variant="ghost" size="sm" className="h-7 px-2 text-[11px]">
                          Certificate
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Travel Health Tips & Embassy Advice */}
          <div className="pt-2">
            <Card className="p-4 space-y-2.5 border-border bg-muted/20">
              <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Travel Preparation Recommendations</span>
              </div>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4 leading-relaxed">
                <li>
                  <strong>Plan 4–6 weeks ahead:</strong> Most travel vaccines (like Hepatitis A, Typhoid, Yellow Fever) need up to 2 weeks to build effective protective antibodies.
                </li>
                <li>
                  <strong>Carry Physical / Digital Proof:</strong> Border officers and visa consulars frequently check certificates. Keep your digital certificates downloaded from the Vacciner Log Certificates tab.
                </li>
                <li>
                  <strong>Check Visa &amp; Consular Updates:</strong> In addition to CDC travel notices, verify consular visa rules via the destination country&apos;s embassy website.
                </li>
              </ul>
            </Card>
          </div>
        </div>

        {/* Add Reminder Modal for Scheduling Missing Doses */}
        {me?.patients && (
          <AddReminderModal
            isOpen={reminderModalOpen}
            onClose={() => setReminderModalOpen(false)}
            patients={me.patients}
            vaccines={vaccinesList}
            onAdded={() => {
              showToast("Reminder created! Check the Reminders tab.", "success")
              loadData()
            }}
          />
        )}

        {/* Bottom Navigation */}
        <BottomNav active="embassy" />
      </div>
    </div>
  )
}
