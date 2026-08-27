/*
  Warnings:

  - You are about to drop the column `name` on the `ColonistExpertise` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[colonistSkillId,expertiseId]` on the table `ColonistExpertise` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `expertiseId` to the `ColonistExpertise` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ColonistExpertise" DROP COLUMN "name",
ADD COLUMN     "expertiseId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Expertise" (
    "id" SERIAL NOT NULL,
    "skillId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,

    CONSTRAINT "Expertise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Expertise_name_key" ON "Expertise"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ColonistExpertise_colonistSkillId_expertiseId_key" ON "ColonistExpertise"("colonistSkillId", "expertiseId");

-- AddForeignKey
ALTER TABLE "ColonistExpertise" ADD CONSTRAINT "ColonistExpertise_expertiseId_fkey" FOREIGN KEY ("expertiseId") REFERENCES "Expertise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expertise" ADD CONSTRAINT "Expertise_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
