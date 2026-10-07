"use client"

import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Info, Scale, Sparkles } from "lucide-react"

export interface BmiCalculatorCardProps {
  heightCm?: number | null
  weightKg?: number | null
  dob?: string | null
  onChange: (metrics: { height?: number | null; weight?: number | null }) => void
}

type UnitSystem = "metric" | "imperial"

interface BmiCategory {
  label: string
  color: string
  badgeTone: string
  description: string
}

function getBmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) {
    return {
      label: "Underweight",
      color: "text-sky-500 dark:text-sky-400",
      badgeTone: "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800",
      description: "Below the standard healthy range. Consider consulting your doctor about nutrition and strength.",
    }
  }
  if (bmi < 25) {
    return {
      label: "Normal / Healthy Weight",
      color: "text-emerald-500 dark:text-emerald-400",
      badgeTone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800",
      description: "Within the optimal healthy range for your height. Keep up a balanced diet and regular physical activity.",
    }
  }
  if (bmi < 30) {
    return {
      label: "Overweight",
      color: "text-amber-500 dark:text-amber-400",
      badgeTone: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800",
      description: "Slightly above the optimal weight range. Regular physical activity and mindful nutrition can help maintain health.",
    }
  }
  return {
    label: "Obese",
    color: "text-rose-500 dark:text-rose-400",
    badgeTone: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800",
    description: "Higher weight relative to height. Consult your healthcare provider for personalized guidance and health management.",
  }
}

function calculateAgeFromDob(dobString?: string | null): number | null {
  if (!dobString) return null
  const birth = new Date(dobString)
  if (isNaN(birth.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age >= 0 ? age : null
}

export function BmiCalculatorCard({
  heightCm,
  weightKg,
  dob,
  onChange,
}: BmiCalculatorCardProps) {
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric")

  // Local input strings to allow smooth typing (including decimals)
  const [metricHeightStr, setMetricHeightStr] = useState<string>(
    heightCm ? String(heightCm) : ""
  )
  const [metricWeightStr, setMetricWeightStr] = useState<string>(
    weightKg ? String(weightKg) : ""
  )

  // Imperial input states
  const [feetStr, setFeetStr] = useState<string>("")
  const [inchesStr, setInchesStr] = useState<string>("")
  const [lbsStr, setLbsStr] = useState<string>("")

  // Age state (auto-sync with dob or manual override)
  const derivedAge = useMemo(() => calculateAgeFromDob(dob), [dob])
  const [manualAgeStr, setManualAgeStr] = useState<string>("")

  // When external heightCm / weightKg update (e.g. loaded from backend), sync inputs
  useEffect(() => {
    if (heightCm) {
      setMetricHeightStr(String(heightCm))
      const totalInches = heightCm / 2.54
      const ft = Math.floor(totalInches / 12)
      const inches = Math.round(totalInches % 12)
      setFeetStr(String(ft))
      setInchesStr(String(inches))
    } else {
      setMetricHeightStr("")
      setFeetStr("")
      setInchesStr("")
    }
  }, [heightCm])

  useEffect(() => {
    if (weightKg) {
      setMetricWeightStr(String(weightKg))
      setLbsStr(String(Math.round(weightKg * 2.20462 * 10) / 10))
    } else {
      setMetricWeightStr("")
      setLbsStr("")
    }
  }, [weightKg])

  // Current numeric height (cm) and weight (kg)
  const currentHeightCm = useMemo(() => {
    if (unitSystem === "metric") {
      const val = parseFloat(metricHeightStr)
      return isNaN(val) || val <= 0 ? null : val
    } else {
      const ft = parseFloat(feetStr) || 0
      const inches = parseFloat(inchesStr) || 0
      const totalIn = ft * 12 + inches
      return totalIn > 0 ? Math.round(totalIn * 2.54 * 10) / 10 : null
    }
  }, [unitSystem, metricHeightStr, feetStr, inchesStr])

  const currentWeightKg = useMemo(() => {
    if (unitSystem === "metric") {
      const val = parseFloat(metricWeightStr)
      return isNaN(val) || val <= 0 ? null : val
    } else {
      const lbs = parseFloat(lbsStr)
      return isNaN(lbs) || lbs <= 0 ? null : Math.round((lbs / 2.20462) * 10) / 10
    }
  }, [unitSystem, metricWeightStr, lbsStr])

  // Current age
  const displayAge = useMemo(() => {
    if (manualAgeStr.trim()) {
      const a = parseInt(manualAgeStr, 10)
      return isNaN(a) ? null : a
    }
    return derivedAge
  }, [manualAgeStr, derivedAge])

  // BMI calculation
  const bmiData = useMemo(() => {
    if (!currentHeightCm || !currentWeightKg || currentHeightCm <= 0 || currentWeightKg <= 0) {
      return null
    }
    const heightMeters = currentHeightCm / 100
    const rawBmi = currentWeightKg / (heightMeters * heightMeters)
    if (!isFinite(rawBmi) || rawBmi <= 0 || rawBmi > 100) return null

    const roundedBmi = Math.round(rawBmi * 10) / 10
    const category = getBmiCategory(roundedBmi)

    // Healthy weight range for this height (BMI 18.5 - 24.9)
    const minHealthyKg = Math.round(18.5 * heightMeters * heightMeters * 10) / 10
    const maxHealthyKg = Math.round(24.9 * heightMeters * heightMeters * 10) / 10

    const minHealthyLbs = Math.round(minHealthyKg * 2.20462 * 10) / 10
    const maxHealthyLbs = Math.round(maxHealthyKg * 2.20462 * 10) / 10

    // Position on a scale from 15 to 35 for the gauge pointer (0% to 100%)
    const clamped = Math.max(15, Math.min(35, roundedBmi))
    const gaugePercent = ((clamped - 15) / (35 - 15)) * 100

    return {
      bmi: roundedBmi,
      category,
      minHealthyKg,
      maxHealthyKg,
      minHealthyLbs,
      maxHealthyLbs,
      gaugePercent,
    }
  }, [currentHeightCm, currentWeightKg])

  // Handler for metric height changes
  const handleMetricHeightChange = (val: string) => {
    setMetricHeightStr(val)
    const num = parseFloat(val)
    const validHeight = !isNaN(num) && num > 0 ? num : null
    onChange({
      height: validHeight,
      weight: currentWeightKg,
    })
    if (validHeight) {
      const totalIn = validHeight / 2.54
      setFeetStr(String(Math.floor(totalIn / 12)))
      setInchesStr(String(Math.round(totalIn % 12)))
    }
  }

  // Handler for metric weight changes
  const handleMetricWeightChange = (val: string) => {
    setMetricWeightStr(val)
    const num = parseFloat(val)
    const validWeight = !isNaN(num) && num > 0 ? num : null
    onChange({
      height: currentHeightCm,
      weight: validWeight,
    })
    if (validWeight) {
      setLbsStr(String(Math.round(validWeight * 2.20462 * 10) / 10))
    }
  }

  // Handler for imperial height changes
  const handleImperialHeightChange = (ftVal: string, inVal: string) => {
    setFeetStr(ftVal)
    setInchesStr(inVal)
    const ft = parseFloat(ftVal) || 0
    const inches = parseFloat(inVal) || 0
    const totalIn = ft * 12 + inches
    const cm = totalIn > 0 ? Math.round(totalIn * 2.54 * 10) / 10 : null
    setMetricHeightStr(cm ? String(cm) : "")
    onChange({
      height: cm,
      weight: currentWeightKg,
    })
  }

  // Handler for imperial weight changes
  const handleImperialWeightChange = (val: string) => {
    setLbsStr(val)
    const lbs = parseFloat(val)
    const kg = !isNaN(lbs) && lbs > 0 ? Math.round((lbs / 2.20462) * 10) / 10 : null
    setMetricWeightStr(kg ? String(kg) : "")
    onChange({
      height: currentHeightCm,
      weight: kg,
    })
  }

  return (
    <Card className="p-5 space-y-5 border-border shadow-sm">
      {/* Header & Unit Switcher */}
      <div className="flex items-center justify-between gap-2 border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-sm text-foreground">Body Mass Index (BMI)</h4>
            <p className="text-xs text-muted-foreground">Track body metrics &amp; health ratio</p>
          </div>
        </div>

        {/* Unit Toggle Buttons */}
        <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5 text-xs font-medium">
          <button
            type="button"
            onClick={() => setUnitSystem("metric")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              unitSystem === "metric"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Metric (cm/kg)
          </button>
          <button
            type="button"
            onClick={() => setUnitSystem("imperial")}
            className={`px-2.5 py-1 rounded-md transition-all ${
              unitSystem === "imperial"
                ? "bg-background text-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Imperial (ft/lbs)
          </button>
        </div>
      </div>

      {/* Input Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Height Input */}
        {unitSystem === "metric" ? (
          <div>
            <Label htmlFor="height-cm" className="text-xs text-muted-foreground font-medium">
              Height (cm)
            </Label>
            <div className="relative mt-1">
              <Input
                id="height-cm"
                type="number"
                step="0.1"
                min="50"
                max="260"
                placeholder="e.g. 172"
                value={metricHeightStr}
                onChange={(e) => handleMetricHeightChange(e.target.value)}
                className="pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                cm
              </span>
            </div>
            {currentHeightCm && (
              <p className="text-[11px] text-muted-foreground mt-1">
                ≈ {Math.floor(currentHeightCm / 2.54 / 12)}&apos; {Math.round((currentHeightCm / 2.54) % 12)}&quot;
              </p>
            )}
          </div>
        ) : (
          <div>
            <Label className="text-xs text-muted-foreground font-medium">Height (ft &amp; in)</Label>
            <div className="grid grid-cols-2 gap-1.5 mt-1">
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  max="8"
                  placeholder="Feet"
                  value={feetStr}
                  onChange={(e) => handleImperialHeightChange(e.target.value, inchesStr)}
                  className="pr-7 text-xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                  ft
                </span>
              </div>
              <div className="relative">
                <Input
                  type="number"
                  min="0"
                  max="11"
                  placeholder="Inches"
                  value={inchesStr}
                  onChange={(e) => handleImperialHeightChange(feetStr, e.target.value)}
                  className="pr-7 text-xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                  in
                </span>
              </div>
            </div>
            {currentHeightCm && (
              <p className="text-[11px] text-muted-foreground mt-1">≈ {currentHeightCm} cm</p>
            )}
          </div>
        )}

        {/* Weight Input */}
        {unitSystem === "metric" ? (
          <div>
            <Label htmlFor="weight-kg" className="text-xs text-muted-foreground font-medium">
              Weight (kg)
            </Label>
            <div className="relative mt-1">
              <Input
                id="weight-kg"
                type="number"
                step="0.1"
                min="10"
                max="300"
                placeholder="e.g. 68.5"
                value={metricWeightStr}
                onChange={(e) => handleMetricWeightChange(e.target.value)}
                className="pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                kg
              </span>
            </div>
            {currentWeightKg && (
              <p className="text-[11px] text-muted-foreground mt-1">
                ≈ {Math.round(currentWeightKg * 2.20462 * 10) / 10} lbs
              </p>
            )}
          </div>
        ) : (
          <div>
            <Label htmlFor="weight-lbs" className="text-xs text-muted-foreground font-medium">
              Weight (lbs)
            </Label>
            <div className="relative mt-1">
              <Input
                id="weight-lbs"
                type="number"
                step="0.5"
                min="20"
                max="650"
                placeholder="e.g. 150"
                value={lbsStr}
                onChange={(e) => handleImperialWeightChange(e.target.value)}
                className="pr-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                lbs
              </span>
            </div>
            {currentWeightKg && (
              <p className="text-[11px] text-muted-foreground mt-1">≈ {currentWeightKg} kg</p>
            )}
          </div>
        )}

        {/* Age (auto-sync or manual override) */}
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="bmi-age" className="text-xs text-muted-foreground font-medium">
              Age (years)
            </Label>
            {derivedAge !== null && (
              <span className="text-[10px] text-primary font-medium">From DOB</span>
            )}
          </div>
          <div className="relative mt-1">
            <Input
              id="bmi-age"
              type="number"
              min="1"
              max="125"
              placeholder={derivedAge !== null ? String(derivedAge) : "e.g. 28"}
              value={manualAgeStr}
              onChange={(e) => setManualAgeStr(e.target.value)}
              className="pr-12"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
              yrs
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">
            {displayAge !== null ? `Calculated age: ${displayAge} yrs` : "Enter age or set Date of Birth"}
          </p>
        </div>
      </div>

      {/* Calculated Results Area */}
      {bmiData ? (
        <div className="space-y-4 rounded-xl bg-muted/40 p-4 border border-border/80">
          {/* Main Score & Badge */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Calculated BMI
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-extrabold tracking-tight text-foreground">
                  {bmiData.bmi}
                </span>
                <span className="text-xs text-muted-foreground">kg/m²</span>
              </div>
            </div>

            <Badge
              variant="outline"
              className={`text-xs px-3 py-1 font-semibold border ${bmiData.category.badgeTone}`}
            >
              {bmiData.category.label}
            </Badge>
          </div>

          {/* Visual Gauge Bar */}
          <div>
            <div className="relative w-full h-3 rounded-full overflow-hidden flex bg-muted shadow-inner">
              <div className="w-[17.5%] bg-sky-400" title="Underweight (<18.5)" />
              <div className="w-[32%] bg-emerald-400" title="Normal (18.5 - 24.9)" />
              <div className="w-[25.5%] bg-amber-400" title="Overweight (25 - 29.9)" />
              <div className="w-[25%] bg-rose-400" title="Obese (≥30)" />
            </div>

            {/* Needle indicator */}
            <div className="relative w-full h-3 -mt-3 pointer-events-none">
              <div
                className="absolute top-0 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-white bg-foreground shadow-md transition-all duration-300"
                style={{ left: `${bmiData.gaugePercent}%` }}
              />
            </div>

            {/* Threshold Labels */}
            <div className="flex justify-between text-[10px] text-muted-foreground pt-1.5 px-0.5">
              <span>Underweight (&lt;18.5)</span>
              <span>18.5</span>
              <span>25.0</span>
              <span>30.0+ Obese</span>
            </div>
          </div>

          {/* Category description & Ideal Range */}
          <div className="space-y-2 pt-1 border-t border-border/60">
            <p className="text-xs text-foreground/80 leading-relaxed">
              {bmiData.category.description}
            </p>

            <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-background/80 rounded-lg p-2.5 border border-border/50">
              <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">Healthy weight target for your height: </span>
                {unitSystem === "metric" ? (
                  <span>
                    <strong>{bmiData.minHealthyKg} kg</strong> – <strong>{bmiData.maxHealthyKg} kg</strong>
                  </span>
                ) : (
                  <span>
                    <strong>{bmiData.minHealthyLbs} lbs</strong> ({bmiData.minHealthyKg} kg) –{" "}
                    <strong>{bmiData.maxHealthyLbs} lbs</strong> ({bmiData.maxHealthyKg} kg)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Pediatric Notice if under 18 */}
          {displayAge !== null && displayAge < 18 && (
            <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 rounded-lg p-2.5 border border-amber-300 dark:border-amber-800">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>
                <strong>Pediatric notice:</strong> For individuals under 18 years old, adult BMI categories are approximate. Healthcare professionals evaluate child growth using pediatric age-and-sex percentiles.
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-6 px-4 rounded-xl border border-dashed border-border bg-muted/20">
          <Scale className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-xs font-medium text-foreground">
            Enter both your height and weight above to calculate your BMI
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">
            Your results and healthy target weight range will appear here instantly.
          </p>
        </div>
      )}

      {/* Clinical relevance note */}
      <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-muted/20 p-2.5 rounded-lg border border-border/40">
        <Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
        <p>
          <strong>Why BMI in Vacciner Log?</strong> Clinicians use height and weight to assess metabolic health, select appropriate needle lengths for intramuscular vaccine delivery, and evaluate immune response.
        </p>
      </div>
    </Card>
  )
}
