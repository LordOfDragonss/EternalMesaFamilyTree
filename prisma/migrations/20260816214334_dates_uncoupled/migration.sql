/*
  Warnings:

  - You are about to drop the column `birthdate` on the `Colonist` table. All the data in the column will be lost.
  - You are about to drop the column `deathDate` on the `Colonist` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Colonist" DROP COLUMN "birthdate",
DROP COLUMN "deathDate",
ADD COLUMN     "birthDay" INTEGER,
ADD COLUMN     "birthMonth" INTEGER,
ADD COLUMN     "birthYear" INTEGER,
ADD COLUMN     "deathDay" INTEGER,
ADD COLUMN     "deathMonth" INTEGER,
ADD COLUMN     "deathYear" INTEGER;
