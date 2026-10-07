# Doctor Portal — Implementation Plan

> Status: **planning only** — nothing in the app is changed yet. This document
> describes what we will build, how, and in what order, for review before any
> code is written.

## 1. What we are building

A **doctor-facing application** inside Vacciner Log where a verified doctor can:

- **See a patient's vaccine records** — but only after the **patient grants
  access** at the visit (via a QR code or a short code the patient shares), and
  only for a **limited time**, never standing/always-on.
- Write a **consultation note** for the visit — the patient's **problem /
  diagnosis**, the doctor's **recommendation**, and any **prescription** —
  stored as the doctor's own record.
- Keep a **records history** of every patient they have seen (an encounter log),
  now including the problem seen and what was recommended.
- View an **analytics dashboard** aggregating patients, problems, prescriptions
  and doses across their practice.
- Manage their own **doctor profile**.
- *(Optional, phase 2)* **Record a vaccination** they administer, which becomes
  a verified record on the patient's timeline.

The guiding principle, matching your requirement *"it should not be access all
the time for the doctor"*:

> **The doctor never holds standing access to any patient.** The patient hands
> over access for a single visit; it is time-boxed, single-use, and revocable.
> What the doctor keeps afterwards is only their **own consultation notes** and
> the **doses they personally administered** — not the patient's live records.

## 2. Core principle — consent-based, time-boxed access

Three separate ideas, kept distinct on purpose:

| Concept | Lives how long | What it gives |
|---|---|---|
| **Consent grant** (QR/code) | ~15 min to redeem; ~60 min of access once redeemed | Live read of the patient's full vaccine records during the visit |
| **Encounter / consultation note** | Permanent (doctor's own record) | "Saw patient X on date Y" + problem, recommendation, prescription |
| **Administered record** | Permanent (a normal `VaccinationRecord`) | Doses the doctor gave, marked verified, visible to both patient and doctor |

So after the consent window closes, the doctor can still see **their history and
their administered doses**, but must ask for **fresh consent** to view the
patient's current full record again. This is exactly "not all the time."

## 3. Roles & accounts

- A doctor is a `User` with `role = PROVIDER` (the role already exists in the
  schema, currently unused) plus a new **`DoctorProfile`** (1:1 with the user).
- A doctor must be **verified/approved by a platform admin** (checking their
  medical registration number) before they can consume any consent or see any
  patient. Until then they can log in but land on an "awaiting approval" screen.
- Citizens and their family profiles are unchanged; they gain one new ability:
  **"Share with a doctor"** (generate a consent QR/code), and — if we share
  prescriptions back — a read-only view of the doctor's recommendation.

## 4. Features in detail

### 4.1 Doctor onboarding & verification
- Doctor self-registers: name, specialization, **medical registration number**,
  clinic/practice name, city, contact, email + password.
- Account starts `PENDING`. Admin reviews and **approves / rejects** from the
  existing admin dashboard (a new "Doctors" section next to Users/Providers).
- Only `APPROVED` doctors can use the consent and patient features.

### 4.2 The consent handshake (the heart of it)
1. **Patient side** (in their existing app): a **"Share with a doctor"** button
   lets them pick which profile (self or a family member) and a scope
   (*view only* or *view + let them add a dose / prescription*), then shows a
   **QR code** and a short human-readable code, valid ~15 minutes.
2. **Doctor side**: on the **Scan / New visit** screen, the doctor either
   **scans the QR** with the device camera or **types the code**.
3. The server validates the code (exists, not used, not expired), records that
   **this doctor** consumed it, creates an **Encounter**, and opens a
   **time-boxed access session** (~60 min) to that patient's records.
4. When the session expires (or the patient revokes), live access ends
   automatically.

### 4.3 Patient records view (during an active visit)
While a consent session is active, the doctor sees, read-only:
- The patient's vaccine records (vaccine, dose, date, provider, batch).
- Certificates.
- Clinical & surgical health details (conditions, prior complications) — exactly
  what helps them treat and vaccinate safely.
Every one of these reads is gated by an **active consent check** on the server.

### 4.4 Consultation note & prescription (core)
During the active visit, the doctor fills a **consultation note** on the
encounter:
- **Problem / diagnosis** — free text, plus optional **problem tags** (e.g.
  "Fever", "Respiratory", "Follow-up") that make analytics possible.
- **Recommendation / advice** — free text (rest, tests, referral, next visit).
- **Prescription** — a small structured list of items
  `{ medicine, dosage, frequency, durationDays }`, plus a free-text field for
  anything unstructured.
- A general **note** field.

This note is the doctor's **own persistent record** (survives after consent
ends). Optionally (a decision below) a **read-only copy is shared back to the
patient** so they can see what the doctor advised.

> Governance note: this is a **record-keeping** tool for the doctor's own
> tracking and analytics, not a regulated e-prescription / e-pharmacy system.
> The data is sensitive and is access-controlled to the doctor (and the patient
> if shared).

### 4.5 Records history (patients seen)
- A list of all **encounters**: patient name (snapshot), date, the **problem**,
  the **recommendation/prescription**, what was administered, and a note.
- This is the doctor's **own** persistent data and needs no live consent to view.
- Opening a past patient to see their **current** vaccine records requires a
  **new** consent (a "request access again" action).

### 4.6 Analytics dashboard
Aggregated over the doctor's encounters, notes and administered doses:
- Patients seen (total + unique), encounters over time (monthly trend).
- **Top problems / diagnoses** seen (from problem tags).
- **Most prescribed** medicines; number of prescriptions given.
- Doses administered: total, **by vaccine**, by month.
- Demographics of patients seen: **age bands**, gender split.
- Certificates issued by this doctor.

### 4.7 Doctor profile
- View/edit: name, specialization, registration number (read-only after
  approval), clinic, city, contact. Shows verification status.

### 4.8 *(Optional, phase 2)* Record a vaccination
- If the consent scope allows it, the doctor can log a dose they administered:
  vaccine, batch, manufacturer, dose #, date, site, next-due, adverse event.
- Creates a `VaccinationRecord` with `source = PROVIDER`, `verified = true`,
  `administeredByUserId = doctor`, and auto-issues the certificate.
- The patient instantly sees it marked **"verified by Dr. X."**

## 5. Data model changes (Prisma)

```prisma
enum VerificationStatus { PENDING APPROVED REJECTED }
enum ConsentStatus     { PENDING USED EXPIRED REVOKED }
enum ConsentScope      { VIEW VIEW_AND_RECORD }
enum RecordSource      { SELF PROVIDER }   // if not already added

model DoctorProfile {
  id                 String             @id @default(uuid())
  userId             String             @unique
  user               User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  fullName           String
  specialization     String?
  registrationNumber String             @unique        // medical council reg no.
  clinicName         String?
  city               String?
  phone              String?
  status             VerificationStatus @default(PENDING)
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt
}

model ConsentGrant {
  id              String        @id @default(uuid())
  patientId       String
  patient         Patient       @relation(fields: [patientId], references: [id], onDelete: Cascade)
  codeHash        String        @unique          // sha256(rawCode) — raw never stored
  scope           ConsentScope  @default(VIEW)
  status          ConsentStatus @default(PENDING)
  expiresAt       DateTime                       // deadline to redeem (~15 min)
  doctorUserId    String?                        // set when a doctor redeems it
  accessExpiresAt DateTime?                      // live-access session end (~60 min)
  usedAt          DateTime?
  createdAt       DateTime      @default(now())
  @@index([patientId])
}

model Encounter {
  id             String             @id @default(uuid())
  doctorUserId   String
  patientId      String
  patientName    String                              // snapshot at visit time
  problem        String?                             // chief complaint / diagnosis (free text)
  problemTags    String[]           @default([])     // categorized, for analytics
  recommendation String?                             // advice / plan (free text)
  prescriptionText String?                           // unstructured prescription
  sharedWithPatient Boolean         @default(false)  // is the note visible to the patient?
  note           String?
  occurredAt     DateTime           @default(now())
  prescriptions  PrescriptionItem[]
  @@index([doctorUserId])
  @@index([patientId])
}

model PrescriptionItem {
  id           String    @id @default(uuid())
  encounterId  String
  encounter    Encounter @relation(fields: [encounterId], references: [id], onDelete: Cascade)
  medicine     String
  dosage       String?                              // e.g. "500 mg"
  frequency    String?                              // e.g. "twice daily"
  durationDays Int?
  @@index([encounterId])
}

// On VaccinationRecord (some may already exist from the hospital-portal plan):
//   source               RecordSource @default(SELF)
//   administeredByUserId  String?
```

`User` gains back-relations for `doctorProfile` and `encounters`. Migration:
`prisma migrate dev --name doctor_portal` (stop the backend first — Windows
Prisma DLL lock). Existing rows are unaffected.

## 6. Backend

New module `backend/src/doctor/` plus a small consent module and admin additions.

| Endpoint | Who | Purpose |
|---|---|---|
| `POST /doctor/register` | public | Create doctor user + `DoctorProfile` (PENDING) |
| `GET /doctor/me` | doctor | Profile + verification status |
| `PATCH /doctor/me` | doctor | Edit profile |
| `GET /admin/doctors` | admin | List doctors (+ status) |
| `PATCH /admin/doctors/:id/status` | admin | Approve / reject |
| `POST /consent/generate` | citizen | Make a QR/code (scope + validity) for a chosen profile |
| `POST /consent/:id/revoke` | citizen | Revoke a live grant |
| `POST /doctor/visits/consume` | doctor | Redeem a code → create Encounter + open session |
| `GET /doctor/visits/:patientId/records` | doctor | Live patient records (consent-gated) |
| `PUT /doctor/visits/:encounterId/note` | doctor | Save the consultation note + prescription (consent-gated) |
| `GET /doctor/history` | doctor | Encounters/notes (patients seen) |
| `GET /doctor/analytics` | doctor | Aggregates over the doctor's own data |
| `POST /doctor/records` | doctor | *(phase 2)* Record a dose (needs VIEW_AND_RECORD) |

**Guards / security layers** (stacked on every patient-touching route):
1. `JwtAuthGuard` — authenticated.
2. `DoctorGuard` — `role = PROVIDER` **and** `DoctorProfile.status = APPROVED`.
3. `DoctorAccessService.assertConsent(doctorUserId, patientId)` — an **active,
   unexpired** `ConsentGrant` links this doctor to this patient. This is the
   single checkpoint (mirrors the existing `AccessService`), so live patient
   data and note-writing are impossible without current consent.
4. `@nestjs/throttler` rate limits on `consume` / `generate` (already installed).

Writing the consultation note requires an active session; once saved it stays on
the encounter (the doctor's record) even after the session ends. Reads of live
patient data reuse the existing `RecordsService` / `CertificatesService` by
`patientId`, never bypassing the consent gate.

## 7. Frontend — mobile-first doctor app

The doctor portal is a **mobile app** (phone width), matching the **citizen
app's** style — `mobile-container`, a **bottom tab bar**, gradient headers and
cards — **not** the desktop admin/sidebar layout. It reuses the citizen app's
mobile building blocks (`BottomNav`, `Card`, gradient header, toast). New route
group `app/doctor/*`, guarded on `role = PROVIDER`.

**Bottom-tab screens:**
- **Home** (`/doctor`) — an "awaiting approval" banner if still pending; a quick
  analytics summary (patients seen, doses, top problems), recent visits, and a
  big **Scan** button.
- **Scan** (`/doctor/scan`) — the point-of-care flow: open the **phone camera**
  to scan the patient's QR (or type the code) → patient appears → view records →
  write the **consultation note / prescription** → *(optional)* record a dose.
- **History** (`/doctor/history`) — patients seen (encounter cards with the
  problem & recommendation; "request access again" to re-open a patient).
- **Profile** (`/doctor/profile`) — doctor profile + verification status.

(The full analytics live inside Home; a deeper analytics view can be a scroll
section rather than a separate desktop page.)

**Citizen side** (mobile, existing app): a **"Share with a doctor"** action that
generates the QR + code (reuses the `qrcode` dep already in the project), a
**"who has access right now"** list with revoke, and — if we share notes — a
**"Doctor's advice"** view of past recommendations.

**Admin side** (desktop, existing admin dashboard): a **Doctors** section to
approve/reject, next to the clickable cards.

**QR:** scanning uses the **phone camera** via the browser `BarcodeDetector` API
(well-suited to mobile), with **manual code entry** as the always-works
fallback. `lib/api.ts` gains the doctor + consent + note types and calls.

## 8. Security & privacy model (summary)

- **No standing access.** Every live patient read and every note write requires
  an active, unexpired, patient-issued consent for *that* doctor and *that*
  patient.
- **Patient-initiated only.** A doctor can never mint access; the patient
  generates the code.
- **Codes**: high-entropy, stored only as SHA-256, single-use, ~15-min expiry,
  and the session itself auto-expires (~60 min).
- **Revocable** by the patient at any time.
- **Least data retained.** After the session, the doctor keeps only their
  consultation notes + doses they administered — not the patient's live record.
- **Consultation notes are sensitive clinical data** — stored against the doctor
  and (only if `sharedWithPatient`) shown read-only to the patient. Never exposed
  to other doctors or the population.
- **Admin-approved doctors** only; unapproved accounts are inert.
- **Isolation**: a doctor's history/analytics cover only their own encounters —
  never another doctor's.
- Optional plus: an **audit log** of consent grants and accesses.

## 9. Build phases (each independently testable)

0. **Data model + migration** — verify tables.
1. **Doctor auth + onboarding + admin approval** — register a doctor, approve it.
2. **Consent handshake** — patient generates a code, doctor consumes it, an
   Encounter is created, a session opens.
3. **Live records view** — consent-gated read of a patient's records.
4. **Consultation note & prescription** — write/save on the encounter.
5. **Records history** — the encounter list with problem & recommendation.
6. **Analytics** — the aggregate dashboard (problems, prescriptions, doses).
7. **Doctor profile.**
8. *(Optional)* **Record a vaccination.**
9. **Frontend polish** (QR scanning) + **security test pass**.

## 10. How it ties to the existing app

- Reuses `Role.PROVIDER`, the `AccessService`/consent-code *pattern*, the
  `RecordsService` & `CertificatesService`, the admin module, and the `qrcode`
  dependency.
- New `DoctorAccessService` is the doctor equivalent of `AccessService` — one
  place that answers "can this doctor see/write for this patient right now?"
- Reuses the **citizen app's mobile design** (`mobile-container`, bottom nav,
  cards, gradient headers) as the visual template — a **phone-first** app, not
  the desktop dashboard. (The admin-side doctor approval stays in the existing
  desktop admin dashboard.)

## 11. Testing approach

- **API smoke script** (like the 14-check family-access test): register + approve
  a doctor, patient generates consent, doctor consumes → sees records → writes a
  note/prescription; session expiry blocks further reads, reuse of a code fails,
  revoke works, another doctor cannot read, unapproved doctor is blocked, and a
  saved note survives after the session ends.
- **UI walkthrough**: two windows (doctor + patient) — patient shares a code,
  doctor scans/enters it, sees records, writes a prescription, history and
  analytics update; after the timer, live access is gone but the note remains.
- **A written test guide** delivered after implementation (as with prior
  features).

## 12. Open decisions (please confirm)

1. **Share the prescription/recommendation back to the patient** (read-only in
   their app), or keep it **private to the doctor**? — Recommend sharing, since a
   prescription is for the patient; `sharedWithPatient` already models the choice.
2. **Structured vs free-text prescription** — recommend the **hybrid**:
   structured items `{medicine, dosage, frequency, duration}` + a free-text field,
   so analytics ("most prescribed") work while writing stays fast.
3. **Does the doctor also administer vaccines**, or **view + advise only**? —
   Recommend include recording as phase 2, patient chooses the scope.
4. **Session length** after a code is redeemed — **60 minutes** suggested.
5. **QR scanning** — browser camera (`BarcodeDetector`, Chrome/Edge) with
   **manual code entry** fallback? Recommended (no extra native app).
6. **History detail** — store a **snapshot** of what was viewed/advised at each
   visit (privacy-preserving) rather than re-pulling live data later. Recommended.
7. **Scope of v1** — consent + view + consultation note + history + analytics,
   deferring "record a vaccination"? Recommended for a first cut.
