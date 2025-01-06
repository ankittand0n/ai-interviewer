/*
  Warnings:

  - You are about to drop the `ATSTags` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "ATSTags";

-- CreateTable
CREATE TABLE "JobTags" (
    "id" SERIAL NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "extractedTags" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobTags_pkey" PRIMARY KEY ("id")
);
