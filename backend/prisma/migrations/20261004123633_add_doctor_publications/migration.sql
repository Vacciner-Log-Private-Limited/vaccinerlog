-- CreateEnum
CREATE TYPE "PublicationType" AS ENUM ('RESEARCH_PAPER', 'ACHIEVEMENT', 'CASE_STUDY', 'CLINICAL_UPDATE');

-- CreateTable
CREATE TABLE "doctor_publications" (
    "id" TEXT NOT NULL,
    "doctorUserId" TEXT NOT NULL,
    "type" "PublicationType" NOT NULL DEFAULT 'RESEARCH_PAPER',
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "specialization" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "journalOrIssuer" TEXT,
    "publicationUrl" TEXT,
    "year" INTEGER,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "doctor_publications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "doctor_publication_likes" (
    "id" TEXT NOT NULL,
    "publicationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "doctor_publication_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "doctor_publications_doctorUserId_idx" ON "doctor_publications"("doctorUserId");

-- CreateIndex
CREATE INDEX "doctor_publications_type_idx" ON "doctor_publications"("type");

-- CreateIndex
CREATE INDEX "doctor_publication_likes_publicationId_idx" ON "doctor_publication_likes"("publicationId");

-- CreateIndex
CREATE INDEX "doctor_publication_likes_userId_idx" ON "doctor_publication_likes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_publication_likes_publicationId_userId_key" ON "doctor_publication_likes"("publicationId", "userId");

-- AddForeignKey
ALTER TABLE "doctor_publications" ADD CONSTRAINT "doctor_publications_doctorUserId_fkey" FOREIGN KEY ("doctorUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_publication_likes" ADD CONSTRAINT "doctor_publication_likes_publicationId_fkey" FOREIGN KEY ("publicationId") REFERENCES "doctor_publications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "doctor_publication_likes" ADD CONSTRAINT "doctor_publication_likes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
