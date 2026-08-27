/*
  Warnings:

  - Made the column `gender` on table `Colonist` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Colonist" ALTER COLUMN "gender" SET NOT NULL;
