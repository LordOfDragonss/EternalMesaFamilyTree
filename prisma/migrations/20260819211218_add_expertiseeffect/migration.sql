-- CreateTable
CREATE TABLE "ExpertiseEffect" (
    "id" SERIAL NOT NULL,
    "expertiseId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,

    CONSTRAINT "ExpertiseEffect_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ExpertiseEffect" ADD CONSTRAINT "ExpertiseEffect_expertiseId_fkey" FOREIGN KEY ("expertiseId") REFERENCES "Expertise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
