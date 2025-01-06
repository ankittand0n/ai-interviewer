/*
  Warnings:

  - Added the required column `jobTitle` to the `JobTags` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "JobTags" ADD COLUMN     "jobTitle" TEXT NOT NULL;
