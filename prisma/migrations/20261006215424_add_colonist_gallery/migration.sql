-- CreateTable
CREATE TABLE "ColonistImage" (
    "id" SERIAL NOT NULL,
    "imageURL" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "colonistId" INTEGER NOT NULL,

    CONSTRAINT "ColonistImage_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ColonistImage" ADD CONSTRAINT "ColonistImage_colonistId_fkey" FOREIGN KEY ("colonistId") REFERENCES "Colonist"("id") ON DELETE CASCADE ON UPDATE CASCADE;
