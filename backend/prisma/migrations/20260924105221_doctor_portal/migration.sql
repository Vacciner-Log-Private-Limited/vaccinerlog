-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('PENDING', 'USED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ConsentScope" AS ENUM ('VIEW', 'VIEW_AND_RECORD');

-- CreateTable
CREATE TABLE "doctor_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "specialization" TEXT,
    "registrationNumber" TEXT NOT NULL,
    "clinicName" TEXT,
    "city" TEXT,
    "phone" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_grants" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "scope" "ConsentScope" NOT NULL DEFAULT 'VIEW',
    "status" "ConsentStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "doctorUserId" TEXT,
    "accessExpiresAt" TIMESTAMP(3),
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "encounters" (
    "id" TEXT NOT NULL,
    "doctorUserId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "problem" TEXT,
    "problemTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recommendation" TEXT,
    "prescriptionText" TEXT,
    "sharedWithPatient" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "encounters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription_items" (
    "id" TEXT NOT NULL,
    "encounterId" TEXT NOT NULL,
    "medicine" TEXT NOT NULL,
    "dosage" TEXT,
    "frequency" TEXT,
    "durationDays" INTEGER,

    CONSTRAINT "prescription_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "doctor_profiles_userId_key" ON "doctor_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_profiles_registrationNumber_key" ON "doctor_profiles"("registrationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "consent_grants_codeHash_key" ON "consent_grants"("codeHash");

-- CreateIndex
CREATE INDEX "consent_grants_patientId_idx" ON "consent_grants"("patientId");

-- CreateIndex
CREATE INDEX "consent_grants_doctorUserId_idx" ON "consent_grants"("doctorUserId");

-- CreateIndex
CREATE INDEX "encounters_doctorUserId_idx" ON "encounters"("doctorUserId");

-- CreateIndex
CREATE INDEX "encounters_patientId_idx" ON "encounters"("patientId");

-- CreateIndex
CREATE INDEX "prescription_items_encounterId_idx" ON "prescription_items"("encounterId");

-- AddForeignKey
ALTER TABLE "doctor_profiles" ADD CONSTRAINT "doctor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_grants" ADD CONSTRAINT "consent_grants_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "encounters" ADD CONSTRAINT "encounters_doctorUserId_fkey" FOREIGN KEY ("doctorUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_items" ADD CONSTRAINT "prescription_items_encounterId_fkey" FOREIGN KEY ("encounterId") REFERENCES "encounters"("id") ON DELETE CASCADE ON UPDATE CASCADE;
