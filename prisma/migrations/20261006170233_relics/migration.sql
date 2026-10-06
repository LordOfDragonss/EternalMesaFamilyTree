-- CreateEnum
CREATE TYPE "RelicCategory" AS ENUM ('IDEOLOGY', 'WEAPON', 'PERSONAL', 'LEGACY', 'STORY', 'SYMBOLIC', 'OTHER');

-- CreateTable
CREATE TABLE "Relic" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categories" "RelicCategory"[],
    "primaryImageURL" TEXT,
    "origin" TEXT,
    "ownerId" INTEGER,
    "locationId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Relic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelicOwnership" (
    "id" SERIAL NOT NULL,
    "relicId" INTEGER NOT NULL,
    "colonistId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RelicOwnership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RelicImage" (
    "id" SERIAL NOT NULL,
    "imageURL" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "relicId" INTEGER NOT NULL,

    CONSTRAINT "RelicImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Relic" ADD CONSTRAINT "Relic_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Colonist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Relic" ADD CONSTRAINT "Relic_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelicOwnership" ADD CONSTRAINT "RelicOwnership_relicId_fkey" FOREIGN KEY ("relicId") REFERENCES "Relic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelicOwnership" ADD CONSTRAINT "RelicOwnership_colonistId_fkey" FOREIGN KEY ("colonistId") REFERENCES "Colonist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RelicImage" ADD CONSTRAINT "RelicImage_relicId_fkey" FOREIGN KEY ("relicId") REFERENCES "Relic"("id") ON DELETE CASCADE ON UPDATE CASCADE;
