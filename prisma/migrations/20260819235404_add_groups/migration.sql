-- CreateTable
CREATE TABLE "Group" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColonistGroup" (
    "colonistId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,

    CONSTRAINT "ColonistGroup_pkey" PRIMARY KEY ("colonistId","groupId")
);

-- AddForeignKey
ALTER TABLE "ColonistGroup" ADD CONSTRAINT "ColonistGroup_colonistId_fkey" FOREIGN KEY ("colonistId") REFERENCES "Colonist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColonistGroup" ADD CONSTRAINT "ColonistGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
