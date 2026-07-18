-- AlterTable
ALTER TABLE "Discussion" ADD COLUMN     "yearGroupId" TEXT,
ALTER COLUMN "classId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Discussion_yearGroupId_updatedAt_idx" ON "Discussion"("yearGroupId", "updatedAt");

-- AddForeignKey
ALTER TABLE "Discussion" ADD CONSTRAINT "Discussion_yearGroupId_fkey" FOREIGN KEY ("yearGroupId") REFERENCES "YearGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
