-- CreateTable
CREATE TABLE "Colonist" (
    "id" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "nickname" TEXT,
    "lastName" TEXT NOT NULL,
    "birthdate" TIMESTAMP(3),
    "deathDate" TIMESTAMP(3),
    "imageURL" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Colonist_pkey" PRIMARY KEY ("id")
);
