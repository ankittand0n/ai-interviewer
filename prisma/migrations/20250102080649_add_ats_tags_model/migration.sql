-- CreateTable
CREATE TABLE "ATSTags" (
    "id" SERIAL NOT NULL,
    "jobDescription" TEXT NOT NULL,
    "extractedTags" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ATSTags_pkey" PRIMARY KEY ("id")
);
