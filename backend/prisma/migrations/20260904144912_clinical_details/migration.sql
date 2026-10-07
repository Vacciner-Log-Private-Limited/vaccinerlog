-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "complicationNotes" TEXT,
ADD COLUMN     "hasPriorComplications" BOOLEAN,
ADD COLUMN     "healthConditions" TEXT[] DEFAULT ARRAY[]::TEXT[];
