-- CreateTable
CREATE TABLE "DoubleBed" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "screenshotURL" TEXT,
    "notes" TEXT,
    "locationId" INTEGER NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoubleBed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoubleBedAssignment" (
    "id" SERIAL NOT NULL,
    "bedId" INTEGER NOT NULL,
    "colonistId" INTEGER NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vacatedAt" TIMESTAMP(3),

    CONSTRAINT "DoubleBedAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DoubleBed_locationId_order_idx" ON "DoubleBed"("locationId", "order");

-- CreateIndex
CREATE INDEX "DoubleBedAssignment_bedId_vacatedAt_idx" ON "DoubleBedAssignment"("bedId", "vacatedAt");

-- CreateIndex
CREATE INDEX "DoubleBedAssignment_colonistId_vacatedAt_idx" ON "DoubleBedAssignment"("colonistId", "vacatedAt");

-- AddForeignKey
ALTER TABLE "DoubleBed" ADD CONSTRAINT "DoubleBed_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoubleBedAssignment" ADD CONSTRAINT "DoubleBedAssignment_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "DoubleBed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoubleBedAssignment" ADD CONSTRAINT "DoubleBedAssignment_colonistId_fkey" FOREIGN KEY ("colonistId") REFERENCES "Colonist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
