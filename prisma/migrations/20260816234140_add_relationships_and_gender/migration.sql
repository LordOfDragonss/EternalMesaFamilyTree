-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('Male', 'Female');

-- CreateEnum
CREATE TYPE "ParentType" AS ENUM ('Biological', 'OvumDonor', 'Other');

-- CreateEnum
CREATE TYPE "PartnershipType" AS ENUM ('Lover', 'Married', 'Ex');

-- AlterTable
ALTER TABLE "Colonist" ADD COLUMN     "gender" "Gender";

-- CreateTable
CREATE TABLE "ParentChild" (
    "id" SERIAL NOT NULL,
    "parentId" INTEGER NOT NULL,
    "childId" INTEGER NOT NULL,
    "type" "ParentType" NOT NULL,

    CONSTRAINT "ParentChild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partnership" (
    "id" SERIAL NOT NULL,
    "partner1Id" INTEGER NOT NULL,
    "partner2Id" INTEGER NOT NULL,
    "type" "PartnershipType" NOT NULL,

    CONSTRAINT "Partnership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ParentChild_parentId_childId_key" ON "ParentChild"("parentId", "childId");

-- CreateIndex
CREATE UNIQUE INDEX "Partnership_partner1Id_partner2Id_key" ON "Partnership"("partner1Id", "partner2Id");

-- AddForeignKey
ALTER TABLE "ParentChild" ADD CONSTRAINT "ParentChild_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Colonist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParentChild" ADD CONSTRAINT "ParentChild_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Colonist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partnership" ADD CONSTRAINT "Partnership_partner1Id_fkey" FOREIGN KEY ("partner1Id") REFERENCES "Colonist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partnership" ADD CONSTRAINT "Partnership_partner2Id_fkey" FOREIGN KEY ("partner2Id") REFERENCES "Colonist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
