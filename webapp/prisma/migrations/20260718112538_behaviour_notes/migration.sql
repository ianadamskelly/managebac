-- CreateTable
CREATE TABLE "BehaviourType" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "positive" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "BehaviourType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BehaviourNote" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "typeId" TEXT,
    "title" TEXT NOT NULL,
    "positive" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT NOT NULL,
    "nextStep" TEXT,
    "authorId" TEXT NOT NULL,
    "incidentOn" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BehaviourNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BehaviourType_schoolId_title_key" ON "BehaviourType"("schoolId", "title");

-- CreateIndex
CREATE INDEX "BehaviourNote_studentId_createdAt_idx" ON "BehaviourNote"("studentId", "createdAt");

-- AddForeignKey
ALTER TABLE "BehaviourNote" ADD CONSTRAINT "BehaviourNote_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehaviourNote" ADD CONSTRAINT "BehaviourNote_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "BehaviourType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BehaviourNote" ADD CONSTRAINT "BehaviourNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
