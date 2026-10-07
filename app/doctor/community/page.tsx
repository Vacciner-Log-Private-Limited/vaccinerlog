"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  BookOpen,
  Award,
  FileText,
  Activity,
  Heart,
  Share2,
  ExternalLink,
  Plus,
  Search,
  Trash2,
  Building2,
  Sparkles,
  CheckCircle2,
  Calendar,
  Tag,
  GraduationCap,
  X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LoadingSpinner } from "@/components/loading-spinner"
import { DoctorBottomNav } from "@/components/doctor-bottom-nav"
import { useToast } from "@/components/ui/use-toast"
import {
  ApiError,
  getDoctorMe,
  getDoctorPublications,
  createDoctorPublication,
  deleteDoctorPublication,
  toggleDoctorPublicationLike,
  getToken,
  type DoctorProfile,
  type DoctorPublication,
  type PublicationType,
} from "@/lib/api"

type FilterType = "ALL" | PublicationType

const TYPE_CONFIG: Record<
  PublicationType,
  { label: string; icon: any; color: string; badgeClass: string }
> = {
  RESEARCH_PAPER: {
    label: "Research Paper",
    icon: BookOpen,
    color: "text-blue-500",
    badgeClass: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  CASE_STUDY: {
    label: "Case Study",
    icon: FileText,
    color: "text-purple-500",
    badgeClass: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  },
  ACHIEVEMENT: {
    label: "Achievement & Award",
    icon: Award,
    color: "text-amber-500",
    badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  CLINICAL_UPDATE: {
    label: "Clinical Update",
    icon: Activity,
    color: "text-emerald-500",
    badgeClass: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
}

export default function DoctorCommunityPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [doctor, setDoctor] = useState<DoctorProfile | null>(null)
  const [publications, setPublications] = useState<DoctorPublication[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("ALL")
  const [viewOnlyMine, setViewOnlyMine] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Create post modal state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formType, setFormType] = useState<PublicationType>("RESEARCH_PAPER")
  const [formTitle, setFormTitle] = useState("")
  const [formSummary, setFormSummary] = useState("")
  const [formSpecialization, setFormSpecialization] = useState("")
  const [formJournal, setFormJournal] = useState("")
  const [formUrl, setFormUrl] = useState("")
  const [formYear, setFormYear] = useState<string>(new Date().getFullYear().toString())
  const [formTags, setFormTags] = useState("")

  // Delete modal state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Expanded summaries tracker
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({})

  // Load doctor profile & publications
  const loadPublications = useCallback(async () => {
    try {
      const data = await getDoctorPublications({
        type: selectedFilter === "ALL" ? undefined : selectedFilter,
        search: searchQuery.trim() || undefined,
        mine: viewOnlyMine,
      })
      setPublications(data)
    } catch (err: any) {
      toast({
        title: "Failed to load publications",
        description: err?.message || "Please refresh and try again.",
        variant: "destructive",
      })
    }
  }, [selectedFilter, searchQuery, viewOnlyMine, toast])

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login")
      return
    }

    getDoctorMe()
      .then((d) => {
        setDoctor(d)
        if (d.specialization) {
          setFormSpecialization(d.specialization)
        }
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) router.replace("/dashboard")
        else router.replace("/login")
      })
  }, [router])

  useEffect(() => {
    if (!doctor) return
    setLoading(true)
    loadPublications().finally(() => setLoading(false))
  }, [doctor, loadPublications])

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Handle Like / Applaud
  const handleLike = async (id: string) => {
    // Optimistic update
    setPublications((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const newLiked = !p.hasLiked
          const newCount = newLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1)
          return { ...p, hasLiked: newLiked, likesCount: newCount }
        }
        return p
      }),
    )

    try {
      const res = await toggleDoctorPublicationLike(id)
      setPublications((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, hasLiked: res.liked, likesCount: res.likesCount } : p,
        ),
      )
    } catch {
      // Revert if error
      loadPublications()
    }
  }

  // Handle Share / Copy link
  const handleShare = (pub: DoctorPublication) => {
    const shareText = `"${pub.title}" by Dr. ${pub.author.fullName}${
      pub.journalOrIssuer ? ` (${pub.journalOrIssuer})` : ""
    }${pub.publicationUrl ? ` - ${pub.publicationUrl}` : ""}`

    if (navigator?.clipboard) {
      navigator.clipboard.writeText(shareText)
      toast({
        title: "Citation Copied",
        description: "Paper details copied to clipboard.",
      })
    }
  }

  // Handle publication creation
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTitle.trim() || !formSummary.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please provide both a title and abstract/summary.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const parsedTags = formTags
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0)

      const parsedYear = formYear ? parseInt(formYear, 10) : undefined

      await createDoctorPublication({
        title: formTitle.trim(),
        type: formType,
        summary: formSummary.trim(),
        specialization: formSpecialization.trim() || undefined,
        journalOrIssuer: formJournal.trim() || undefined,
        publicationUrl: formUrl.trim() || undefined,
        year: isNaN(parsedYear as number) ? undefined : parsedYear,
        tags: parsedTags,
      })

      toast({
        title: "Published Successfully",
        description: "Your post is now visible to the doctor community.",
      })

      setIsCreateOpen(false)
      // Reset form
      setFormTitle("")
      setFormSummary("")
      setFormJournal("")
      setFormUrl("")
      setFormTags("")
      setFormYear(new Date().getFullYear().toString())

      // Refresh list
      loadPublications()
    } catch (err: any) {
      toast({
        title: "Failed to publish",
        description: err?.message || "An error occurred while publishing.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  // Handle delete
  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return
    setDeleting(true)
    try {
      await deleteDoctorPublication(deleteTargetId)
      toast({
        title: "Publication Removed",
        description: "The publication was deleted successfully.",
      })
      setDeleteTargetId(null)
      setPublications((prev) => prev.filter((p) => p.id !== deleteTargetId))
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err?.message || "Could not delete this publication.",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="mobile-container">
      <div className="min-h-screen bg-background content-with-nav pb-20">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-primary via-primary/95 to-secondary p-6 pb-8 rounded-b-3xl shadow-sm text-white">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-sm">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Community</h1>
            </div>
            {doctor.status === "APPROVED" && (
              <Button
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="bg-white text-primary hover:bg-white/90 shadow-sm font-semibold rounded-full px-4 h-9 gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Publish
              </Button>
            )}
          </div>
          <p className="text-white/85 text-xs leading-relaxed max-w-sm">
            Exchange clinical insights, research papers, and case studies with verified peer doctors.
          </p>

          {/* Search bar inside header area */}
          <div className="mt-4 relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search papers, topics, authors, journals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-card text-foreground placeholder:text-muted-foreground text-sm shadow-inner border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Not Approved Notice */}
        {doctor.status !== "APPROVED" && (
          <div className="p-4 mx-4 mt-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-600 dark:text-amber-400 text-xs flex items-start gap-3">
            <Sparkles className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Verification in Progress</span>
              The doctor community is read-only until your medical council registration is approved by the platform administrator.
            </div>
          </div>
        )}

        <div className="p-4 space-y-4">
          {/* Navigation Controls / Filter Pills */}
          <div className="space-y-2.5">
            {/* View Scope Toggle */}
            <div className="flex items-center justify-between text-xs font-medium">
              <div className="flex bg-muted p-1 rounded-xl w-full">
                <button
                  type="button"
                  onClick={() => setViewOnlyMine(false)}
                  className={`flex-1 py-1.5 text-center rounded-lg transition-all ${
                    !viewOnlyMine
                      ? "bg-card text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All Peer Insights
                </button>
                <button
                  type="button"
                  onClick={() => setViewOnlyMine(true)}
                  className={`flex-1 py-1.5 text-center rounded-lg transition-all ${
                    viewOnlyMine
                      ? "bg-card text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  My Publications
                </button>
              </div>
            </div>

            {/* Category Filter Pills (Horizontal Scroll) */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
              <button
                type="button"
                onClick={() => setSelectedFilter("ALL")}
                className={`px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
                  selectedFilter === "ALL"
                    ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                All Categories
              </button>
              {(
                [
                  "RESEARCH_PAPER",
                  "CASE_STUDY",
                  "ACHIEVEMENT",
                  "CLINICAL_UPDATE",
                ] as PublicationType[]
              ).map((type) => {
                const conf = TYPE_CONFIG[type]
                const Icon = conf.icon
                const isActive = selectedFilter === type
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedFilter(type)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                        : "bg-card text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {conf.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Results count indicator */}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              Showing {publications.length} {publications.length === 1 ? "contribution" : "contributions"}
            </span>
            {searchQuery && (
              <span className="italic truncate max-w-[180px]">Filter: &quot;{searchQuery}&quot;</span>
            )}
          </div>

          {/* Main Feed Content */}
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <LoadingSpinner size="lg" />
              <p className="text-xs text-muted-foreground">Loading peer publications...</p>
            </div>
          ) : publications.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">No publications found</h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                {viewOnlyMine
                  ? "You haven't posted any research papers or clinical achievements yet."
                  : searchQuery
                  ? "No contributions matched your search criteria. Try a different keyword."
                  : "Be the first verified doctor to publish recent research or case studies to the community!"}
              </p>
              {doctor.status === "APPROVED" && (
                <Button
                  onClick={() => setIsCreateOpen(true)}
                  className="rounded-full h-10 px-5 text-xs font-semibold gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Publish First Entry
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {publications.map((pub) => {
                const conf = TYPE_CONFIG[pub.type]
                const Icon = conf.icon
                const isExpanded = !!expandedIds[pub.id]
                const isLongSummary = pub.summary.length > 220

                return (
                  <article
                    key={pub.id}
                    className="bg-card rounded-2xl border border-border shadow-xs hover:border-primary/40 transition-all p-5 space-y-3.5"
                  >
                    {/* Top Row: Category Badge + Year + Actions */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${conf.badgeClass}`}
                        >
                          <Icon className="w-3 h-3" />
                          {conf.label}
                        </span>
                        {pub.year && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                            <Calendar className="w-3 h-3" />
                            {pub.year}
                          </span>
                        )}
                      </div>

                      {/* Delete button if author */}
                      {pub.isMine && (
                        <button
                          type="button"
                          onClick={() => setDeleteTargetId(pub.id)}
                          title="Delete publication"
                          className="text-muted-foreground/60 hover:text-destructive p-1 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Title */}
                    <h2 className="text-base font-bold text-foreground leading-snug">
                      {pub.title}
                    </h2>

                    {/* Author Byline */}
                    <div className="flex items-center gap-3 bg-muted/30 p-2.5 rounded-xl border border-border/50">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {pub.author.fullName
                          .replace(/^Dr\.?\s*/i, "")
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-foreground truncate">
                            Dr. {pub.author.fullName.replace(/^Dr\.?\s*/i, "")}
                          </span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {pub.author.specialization || pub.specialization || "Physician"}
                          {pub.author.clinicName ? ` · ${pub.author.clinicName}` : ""}
                          {pub.author.city ? `, ${pub.author.city}` : ""}
                        </div>
                      </div>
                    </div>

                    {/* Journal / Conference / Issuer */}
                    {pub.journalOrIssuer && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary/10 dark:bg-secondary/20 px-3 py-1.5 rounded-lg border border-secondary/20">
                        <Building2 className="w-3.5 h-3.5 text-secondary shrink-0" />
                        <span className="font-medium text-foreground">Publication/Issuer:</span>
                        <span className="truncate">{pub.journalOrIssuer}</span>
                      </div>
                    )}

                    {/* Summary / Abstract */}
                    <div className="text-xs text-muted-foreground leading-relaxed">
                      <p className={!isExpanded && isLongSummary ? "line-clamp-3" : ""}>
                        {pub.summary}
                      </p>
                      {isLongSummary && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(pub.id)}
                          className="mt-1 text-primary hover:underline font-semibold text-[11px] inline-block"
                        >
                          {isExpanded ? "Show less" : "Read full abstract..."}
                        </button>
                      )}
                    </div>

                    {/* Tags */}
                    {pub.tags && pub.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                        {pub.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[10px] bg-muted px-2 py-0.5 rounded-md text-muted-foreground font-medium"
                          >
                            <Tag className="w-2.5 h-2.5" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Bottom Action Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/60">
                      {/* Applaud / Like Button */}
                      <button
                        type="button"
                        onClick={() => handleLike(pub.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                          pub.hasLiked
                            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-xs"
                            : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <Heart
                          className={`w-3.5 h-3.5 transition-transform ${
                            pub.hasLiked ? "fill-rose-500 text-rose-500 scale-110" : ""
                          }`}
                        />
                        <span>{pub.likesCount}</span>
                        <span className="text-[10px] font-normal">Applaud</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        {/* Copy citation */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleShare(pub)}
                          title="Copy citation"
                          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground rounded-lg"
                        >
                          <Share2 className="w-3.5 h-3.5 mr-1" />
                          Share
                        </Button>

                        {/* External Paper Link */}
                        {pub.publicationUrl && (
                          <a
                            href={pub.publicationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold rounded-lg shadow-xs transition-colors"
                          >
                            <span>Read Paper</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Publish Modal Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md w-[92vw] max-h-[90vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              Publish Contribution
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Share your research papers, clinical achievements, or case studies with verified peer doctors.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 mt-2">
            {/* Type selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Publication Type</label>
              <Select
                value={formType}
                onValueChange={(val) => setFormType(val as PublicationType)}
              >
                <SelectTrigger className="h-10 rounded-xl text-xs">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-popover text-popover-foreground">
                  <SelectItem value="RESEARCH_PAPER">Research Paper</SelectItem>
                  <SelectItem value="CASE_STUDY">Case Study</SelectItem>
                  <SelectItem value="ACHIEVEMENT">Achievement & Award</SelectItem>
                  <SelectItem value="CLINICAL_UPDATE">Clinical Update</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g. Immunogenicity and Safety of Pentavalent Booster in Infants"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="rounded-xl text-xs h-10"
                required
              />
            </div>

            {/* Journal / Organization / Awarding Body */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Journal, Conference or Awarding Institution
              </label>
              <Input
                placeholder="e.g. Indian Journal of Medical Research / AIIMS New Delhi"
                value={formJournal}
                onChange={(e) => setFormJournal(e.target.value)}
                className="rounded-xl text-xs h-10"
              />
            </div>

            {/* External DOI or Link */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Publication URL or DOI Link
              </label>
              <Input
                type="url"
                placeholder="https://doi.org/10... or https://pubmed.ncbi.nlm.nih.gov/..."
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                className="rounded-xl text-xs h-10"
              />
              <p className="text-[10px] text-muted-foreground">
                Peer doctors will be able to click directly through to read the full published paper.
              </p>
            </div>

            {/* Specialization & Year */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Specialization</label>
                <Input
                  placeholder="e.g. Pediatrics"
                  value={formSpecialization}
                  onChange={(e) => setFormSpecialization(e.target.value)}
                  className="rounded-xl text-xs h-10"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Year</label>
                <Input
                  type="number"
                  min={1960}
                  max={2035}
                  value={formYear}
                  onChange={(e) => setFormYear(e.target.value)}
                  className="rounded-xl text-xs h-10"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Keywords & Tags (comma separated)
              </label>
              <Input
                placeholder="e.g. Pediatrics, mRNA, Vaccine Trial, Immunology"
                value={formTags}
                onChange={(e) => setFormTags(e.target.value)}
                className="rounded-xl text-xs h-10"
              />
            </div>

            {/* Abstract / Summary */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Abstract / Description <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="Provide a clinical summary, key findings, methodology, or background of the paper..."
                value={formSummary}
                onChange={(e) => setFormSummary(e.target.value)}
                className="rounded-xl text-xs min-h-[110px] leading-relaxed"
                required
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-xl h-10 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-xl h-10 text-xs font-semibold gap-1.5"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Publish Entry
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <DialogContent className="max-w-sm w-[90vw] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-destructive flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Delete Publication
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Are you sure you want to remove this publication from the community? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTargetId(null)}
              className="rounded-xl h-9 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={handleDeleteConfirm}
              className="rounded-xl h-9 text-xs font-semibold"
            >
              {deleting ? "Deleting..." : "Delete Entry"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bottom Nav */}
      <DoctorBottomNav active="community" />
    </div>
  )
}
