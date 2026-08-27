-- CreateTable
CREATE TABLE "Trait" (
    "id" SERIAL NOT NULL,
    "defName" TEXT NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trait_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColonistTrait" (
    "id" SERIAL NOT NULL,
    "colonistId" INTEGER NOT NULL,
    "traitId" INTEGER NOT NULL,

    CONSTRAINT "ColonistTrait_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Trait_defName_key" ON "Trait"("defName");

-- CreateIndex
CREATE UNIQUE INDEX "ColonistTrait_colonistId_traitId_key" ON "ColonistTrait"("colonistId", "traitId");

-- AddForeignKey
ALTER TABLE "ColonistTrait" ADD CONSTRAINT "ColonistTrait_colonistId_fkey" FOREIGN KEY ("colonistId") REFERENCES "Colonist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColonistTrait" ADD CONSTRAINT "ColonistTrait_traitId_fkey" FOREIGN KEY ("traitId") REFERENCES "Trait"("id") ON DELETE CASCADE ON UPDATE CASCADE;
