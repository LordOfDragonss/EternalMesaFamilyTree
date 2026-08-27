/*
  Warnings:

  - You are about to drop the column `partner1Id` on the `Partnership` table. All the data in the column will be lost.
  - You are about to drop the column `partner2Id` on the `Partnership` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[partnerAId,partnerBId]` on the table `Partnership` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `partnerAId` to the `Partnership` table without a default value. This is not possible if the table is not empty.
  - Added the required column `partnerBId` to the `Partnership` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Partnership" DROP CONSTRAINT "Partnership_partner1Id_fkey";

-- DropForeignKey
ALTER TABLE "Partnership" DROP CONSTRAINT "Partnership_partner2Id_fkey";

-- DropIndex
DROP INDEX "Partnership_partner1Id_partner2Id_key";

-- AlterTable
ALTER TABLE "Partnership" DROP COLUMN "partner1Id",
DROP COLUMN "partner2Id",
ADD COLUMN     "partnerAId" INTEGER NOT NULL,
ADD COLUMN     "partnerBId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Partnership_partnerAId_partnerBId_key" ON "Partnership"("partnerAId", "partnerBId");

-- AddForeignKey
ALTER TABLE "Partnership" ADD CONSTRAINT "Partnership_partnerAId_fkey" FOREIGN KEY ("partnerAId") REFERENCES "Colonist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partnership" ADD CONSTRAINT "Partnership_partnerBId_fkey" FOREIGN KEY ("partnerBId") REFERENCES "Colonist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
