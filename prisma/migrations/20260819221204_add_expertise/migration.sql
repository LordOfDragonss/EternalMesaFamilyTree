/*
  Warnings:

  - A unique constraint covering the columns `[expertiseId,name]` on the table `ExpertiseEffect` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ExpertiseEffect" ALTER COLUMN "unit" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "ExpertiseEffect_expertiseId_name_key" ON "ExpertiseEffect"("expertiseId", "name");
