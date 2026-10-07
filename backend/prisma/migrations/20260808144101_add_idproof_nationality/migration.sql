-- CreateEnum
CREATE TYPE "IdProofType" AS ENUM ('AADHAAR', 'DRIVING_LICENCE', 'PASSPORT', 'OTHER');

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "idProofNumber" TEXT,
ADD COLUMN     "idProofType" "IdProofType",
ADD COLUMN     "nationality" TEXT;
