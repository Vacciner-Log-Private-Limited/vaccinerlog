"use client"

import { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// Vaccination-relevant conditions. The bolded ones in the UI guide (allergies,
// immunocompromised, pregnancy) are the true contraindications/precautions.
export const CLINICAL_CONDITIONS = [
  "Diabetes",
  "Hypertension (high BP)",
  "Asthma / respiratory illness",
  "Heart disease",
  "Kidney disease",
  "Liver disease",
  "Thyroid disorder",
  "Tuberculosis (TB)",
  "Sickle cell / blood disorder",
  "Cancer",
  "HIV / immunocompromised",
  "Neurological condition (e.g. seizures)",
  "Severe allergies (egg, medication, or a previous vaccine)",
  "Currently pregnant",
]

export interface ClinicalValue {
  healthConditions: string[]
  hasPriorComplications: boolean | null
  complicationNotes: string
  hasSurgicalComplications: boolean | null
  surgicalComplicationNotes: string
}

export function emptyClinicalValue(): ClinicalValue {
  return {
    healthConditions: [],
    hasPriorComplications: null,
    complicationNotes: "",
    hasSurgicalComplications: null,
    surgicalComplicationNotes: "",
  }
}

// A reusable "yes / no, and describe if yes" block.
function YesNoDescribe({
  question,
  describeLabel,
  placeholder,
  has,
  notes,
  onSet,
  onNotes,
  id,
}: {
  question: string
  describeLabel: string
  placeholder: string
  has: boolean | null
  notes: string
  onSet: (v: boolean) => void
  onNotes: (v: string) => void
  id: string
}) {
  return (
    <div>
      <Label>{question}</Label>
      <div className="flex gap-2 mt-1.5">
        <Button
          type="button"
          variant={has === true ? "default" : "outline"}
          onClick={() => onSet(true)}
          className={`flex-1 ${has === true ? "" : "bg-transparent"}`}
        >
          Yes
        </Button>
        <Button
          type="button"
          variant={has === false ? "default" : "outline"}
          onClick={() => onSet(false)}
          className={`flex-1 ${has === false ? "" : "bg-transparent"}`}
        >
          No
        </Button>
      </div>
      {has === true && (
        <div className="mt-3">
          <Label htmlFor={id}>{describeLabel}</Label>
          <Textarea
            id={id}
            value={notes}
            onChange={(e) => onNotes(e.target.value)}
            placeholder={placeholder}
            maxLength={1000}
            className="mt-1 min-h-24"
          />
        </div>
      )}
    </div>
  )
}

export function ClinicalDetailsFields({
  value,
  onChange,
}: {
  value: ClinicalValue
  onChange: (patch: Partial<ClinicalValue>) => void
}) {
  const [customInput, setCustomInput] = useState("")
  const selected = value.healthConditions

  const toggle = (c: string) =>
    onChange({
      healthConditions: selected.includes(c)
        ? selected.filter((x) => x !== c)
        : [...selected, c],
    })

  const addCustom = () => {
    const c = customInput.trim()
    if (c && !selected.includes(c)) onChange({ healthConditions: [...selected, c] })
    setCustomInput("")
  }

  const remove = (c: string) =>
    onChange({ healthConditions: selected.filter((x) => x !== c) })

  return (
    <div className="space-y-4">
      {/* Health conditions — multi-select dropdown */}
      <div>
        <Label>Health conditions</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-between mt-1 font-normal bg-transparent"
            >
              <span className={selected.length ? "" : "text-muted-foreground"}>
                {selected.length ? `${selected.length} selected` : "Select any that apply"}
              </span>
              <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="p-2 max-h-72 overflow-y-auto"
            style={{ width: "var(--radix-popover-trigger-width)" }}
          >
            {CLINICAL_CONDITIONS.map((c) => (
              <label
                key={c}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer text-sm"
              >
                <Checkbox checked={selected.includes(c)} onCheckedChange={() => toggle(c)} />
                <span>{c}</span>
              </label>
            ))}
            <div className="flex gap-2 pt-2 mt-2 border-t border-border">
              <Input
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addCustom()
                  }
                }}
                placeholder="Other…"
                className="h-8"
              />
              <Button type="button" size="sm" onClick={addCustom} className="h-8">
                Add
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {selected.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {selected.map((c) => (
              <Badge key={c} variant="secondary" className="gap-1 font-normal">
                {c}
                <button
                  type="button"
                  onClick={() => remove(c)}
                  aria-label={`Remove ${c}`}
                  className="ml-0.5 text-muted-foreground hover:text-foreground"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Clinical complications */}
      <YesNoDescribe
        id="complicationNotes"
        question="Have you had any clinical complications before?"
        describeLabel="Please describe them"
        placeholder="e.g. Fever and rash after a previous tetanus shot in 2019"
        has={value.hasPriorComplications}
        notes={value.complicationNotes}
        onSet={(v) =>
          onChange(v ? { hasPriorComplications: true } : { hasPriorComplications: false, complicationNotes: "" })
        }
        onNotes={(v) => onChange({ complicationNotes: v })}
      />

      {/* Surgical complications */}
      <YesNoDescribe
        id="surgicalComplicationNotes"
        question="Have you had any surgical complications before?"
        describeLabel="Please describe them"
        placeholder="e.g. Excess bleeding during an appendectomy in 2021"
        has={value.hasSurgicalComplications}
        notes={value.surgicalComplicationNotes}
        onSet={(v) =>
          onChange(
            v
              ? { hasSurgicalComplications: true }
              : { hasSurgicalComplications: false, surgicalComplicationNotes: "" },
          )
        }
        onNotes={(v) => onChange({ surgicalComplicationNotes: v })}
      />
    </div>
  )
}
