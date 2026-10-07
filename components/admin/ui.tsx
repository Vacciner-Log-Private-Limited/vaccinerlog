"use client"

import type React from "react"
import Link from "next/link"
import { Button as UiButton } from "@/components/ui/button"
import { Input as UiInput } from "@/components/ui/input"

/**
 * Admin design system — built on the app's shadcn/ui components and theme
 * tokens, so it matches the rest of the app and fully supports dark mode.
 */

// ---- Panel (uses the app's Card surface tokens) ----------------------------

export function Panel({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`bg-card text-card-foreground border border-border rounded-xl shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function PanelHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {action}
    </div>
  )
}

// ---- Page header -----------------------------------------------------------

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}

// ---- Stat card -------------------------------------------------------------

export function StatCard({
  label,
  value,
  icon,
  href,
}: {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
  href?: string // when set, the whole card links here
}) {
  const inner = (
    <Panel
      className={`p-5 h-full ${
        href
          ? "transition-colors hover:border-primary/50 hover:bg-muted/40 group"
          : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {icon && (
          <span
            className={`w-8 h-8 rounded-lg bg-muted text-muted-foreground grid place-items-center flex-shrink-0 ${
              href ? "group-hover:bg-primary/10 group-hover:text-primary transition-colors" : ""
            }`}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold text-foreground mt-3 tabular-nums">{value}</div>
    </Panel>
  )

  if (!href) return inner

  return (
    <Link
      href={href}
      className="block h-full rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {inner}
    </Link>
  )
}

// ---- Badge (tones via theme tokens) ----------------------------------------

type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger"

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  accent: "bg-primary/10 text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  danger: "bg-destructive/10 text-destructive",
}

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  )
}

// ---- Button (wraps the app's Button) ---------------------------------------

type BtnVariant = "primary" | "secondary" | "ghost" | "danger"

const VARIANT_MAP: Record<BtnVariant, "default" | "outline" | "ghost" | "destructive"> = {
  primary: "default",
  secondary: "outline",
  ghost: "ghost",
  danger: "destructive",
}

export function Button({
  variant = "secondary",
  className,
  ...props
}: { variant?: BtnVariant } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <UiButton variant={VARIANT_MAP[variant]} size="sm" className={className} {...props} />
}

// ---- Select (theme-aware native) -------------------------------------------

export function Select({ className = "", ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`h-9 pl-3 pr-8 rounded-md border border-input bg-background text-sm text-foreground transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:opacity-50 disabled:pointer-events-none ${className}`}
      {...props}
    />
  )
}

// ---- Input + Field (wraps the app's Input) ---------------------------------

export function Input(props: React.ComponentProps<"input">) {
  return <UiInput {...props} />
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export function SearchInput({ className = "", ...props }: React.ComponentProps<"input">) {
  return <UiInput type="search" className={`sm:w-72 ${className}`} {...props} />
}

// ---- Table primitives ------------------------------------------------------

export function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  )
}

export function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={`text-left font-medium text-muted-foreground text-xs uppercase tracking-wide px-5 py-3 border-b border-border whitespace-nowrap ${className}`}
    >
      {children}
    </th>
  )
}

export function Tr({ children }: { children: React.ReactNode }) {
  return <tr className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">{children}</tr>
}

export function Td({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-3.5 text-foreground align-middle ${className}`}>{children}</td>
}

// ---- Horizontal bar (lightweight chart) ------------------------------------

export function BarRow({ label, count, max }: { label: string; count: number; max: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="text-foreground">{label}</span>
        <span className="text-muted-foreground tabular-nums">{count}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${Math.max((count / max) * 100, 3)}%` }}
        />
      </div>
    </div>
  )
}

// ---- Spinner (theme-aware, shared) -----------------------------------------

export function Spinner() {
  return (
    <div className="grid place-items-center py-20">
      <div className="w-7 h-7 border-2 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  )
}
