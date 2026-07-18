-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('PERSONAL_PROJECT', 'COMMUNITY_PROJECT', 'EXTENDED_ESSAY', 'TOK_ESSAY', 'EXHIBITION');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PortfolioEntryType" AS ENUM ('NOTE', 'WEBSITE', 'FILE', 'PHOTO');

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "yearGroupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ProjectType" NOT NULL,
    "criteria" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectEnrollment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "supervisorId" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "learningGoal" TEXT,
    "productGoal" TEXT,
    "criteriaLevels" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMeeting" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectJournalEntry" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectJournalEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioEntry" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "type" "PortfolioEntryType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "url" TEXT,
    "storagePath" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PortfolioEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Project_yearGroupId_idx" ON "Project"("yearGroupId");

-- CreateIndex
CREATE INDEX "ProjectEnrollment_supervisorId_idx" ON "ProjectEnrollment"("supervisorId");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectEnrollment_projectId_studentId_key" ON "ProjectEnrollment"("projectId", "studentId");

-- CreateIndex
CREATE INDEX "PortfolioEntry_studentId_createdAt_idx" ON "PortfolioEntry"("studentId", "createdAt");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_yearGroupId_fkey" FOREIGN KEY ("yearGroupId") REFERENCES "YearGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectEnrollment" ADD CONSTRAINT "ProjectEnrollment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectEnrollment" ADD CONSTRAINT "ProjectEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectEnrollment" ADD CONSTRAINT "ProjectEnrollment_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMeeting" ADD CONSTRAINT "ProjectMeeting_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "ProjectEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectJournalEntry" ADD CONSTRAINT "ProjectJournalEntry_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "ProjectEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectJournalEntry" ADD CONSTRAINT "ProjectJournalEntry_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioEntry" ADD CONSTRAINT "PortfolioEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
