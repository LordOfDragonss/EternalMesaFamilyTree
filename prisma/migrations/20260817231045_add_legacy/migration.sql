-- AlterTable
ALTER TABLE "Colonist" ADD COLUMN     "legacyId" INTEGER;

-- CreateTable
CREATE TABLE "Legacy" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "foundingColonistId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Legacy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegacyNotableColonist" (
    "legacyId" INTEGER NOT NULL,
    "colonistId" INTEGER NOT NULL,

    CONSTRAINT "LegacyNotableColonist_pkey" PRIMARY KEY ("legacyId","colonistId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Legacy_name_key" ON "Legacy"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Legacy_foundingColonistId_key" ON "Legacy"("foundingColonistId");

-- AddForeignKey
ALTER TABLE "Colonist" ADD CONSTRAINT "Colonist_legacyId_fkey" FOREIGN KEY ("legacyId") REFERENCES "Legacy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Legacy" ADD CONSTRAINT "Legacy_foundingColonistId_fkey" FOREIGN KEY ("foundingColonistId") REFERENCES "Colonist"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegacyNotableColonist" ADD CONSTRAINT "LegacyNotableColonist_legacyId_fkey" FOREIGN KEY ("legacyId") REFERENCES "Legacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegacyNotableColonist" ADD CONSTRAINT "LegacyNotableColonist_colonistId_fkey" FOREIGN KEY ("colonistId") REFERENCES "Colonist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
