-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('PLAYABLE_MAP', 'OUTPOST', 'OTHER');

-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LocationType" NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationPreviousName" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "locationId" INTEGER NOT NULL,

    CONSTRAINT "LocationPreviousName_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationImage" (
    "id" SERIAL NOT NULL,
    "imageURL" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "locationId" INTEGER NOT NULL,

    CONSTRAINT "LocationImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationLandmark" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "locationId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocationLandmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationLandmarkImage" (
    "id" SERIAL NOT NULL,
    "imageURL" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "landmarkId" INTEGER NOT NULL,

    CONSTRAINT "LocationLandmarkImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ColonistToLocation" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_ColonistToLocation_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_LegacyToLocation" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_LegacyToLocation_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ColonistToLocation_B_index" ON "_ColonistToLocation"("B");

-- CreateIndex
CREATE INDEX "_LegacyToLocation_B_index" ON "_LegacyToLocation"("B");

-- AddForeignKey
ALTER TABLE "LocationPreviousName" ADD CONSTRAINT "LocationPreviousName_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationImage" ADD CONSTRAINT "LocationImage_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationLandmark" ADD CONSTRAINT "LocationLandmark_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LocationLandmarkImage" ADD CONSTRAINT "LocationLandmarkImage_landmarkId_fkey" FOREIGN KEY ("landmarkId") REFERENCES "LocationLandmark"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ColonistToLocation" ADD CONSTRAINT "_ColonistToLocation_A_fkey" FOREIGN KEY ("A") REFERENCES "Colonist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ColonistToLocation" ADD CONSTRAINT "_ColonistToLocation_B_fkey" FOREIGN KEY ("B") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LegacyToLocation" ADD CONSTRAINT "_LegacyToLocation_A_fkey" FOREIGN KEY ("A") REFERENCES "Legacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_LegacyToLocation" ADD CONSTRAINT "_LegacyToLocation_B_fkey" FOREIGN KEY ("B") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;
