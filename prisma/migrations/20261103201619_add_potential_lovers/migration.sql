-- CreateTable
CREATE TABLE "PotentialLover" (
    "id" SERIAL NOT NULL,
    "colonistAId" INTEGER NOT NULL,
    "colonistBId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PotentialLover_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PotentialLover_colonistAId_idx" ON "PotentialLover"("colonistAId");

-- CreateIndex
CREATE INDEX "PotentialLover_colonistBId_idx" ON "PotentialLover"("colonistBId");

-- CreateIndex
CREATE UNIQUE INDEX "PotentialLover_colonistAId_colonistBId_key" ON "PotentialLover"("colonistAId", "colonistBId");

-- AddForeignKey
ALTER TABLE "PotentialLover" ADD CONSTRAINT "PotentialLover_colonistAId_fkey" FOREIGN KEY ("colonistAId") REFERENCES "Colonist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PotentialLover" ADD CONSTRAINT "PotentialLover_colonistBId_fkey" FOREIGN KEY ("colonistBId") REFERENCES "Colonist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
