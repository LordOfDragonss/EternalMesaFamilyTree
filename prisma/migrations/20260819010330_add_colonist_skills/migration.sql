-- CreateEnum
CREATE TYPE "Passion" AS ENUM ('Apathy', 'None', 'Interested', 'Burning', 'Natural', 'Critical');

-- CreateTable
CREATE TABLE "Skill" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColonistSkill" (
    "id" SERIAL NOT NULL,
    "colonistId" INTEGER NOT NULL,
    "skillId" INTEGER NOT NULL,
    "level" INTEGER NOT NULL,
    "passion" "Passion" NOT NULL,

    CONSTRAINT "ColonistSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColonistExpertise" (
    "id" SERIAL NOT NULL,
    "colonistSkillId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL,

    CONSTRAINT "ColonistExpertise_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ColonistSkill_colonistId_skillId_key" ON "ColonistSkill"("colonistId", "skillId");

-- AddForeignKey
ALTER TABLE "ColonistSkill" ADD CONSTRAINT "ColonistSkill_colonistId_fkey" FOREIGN KEY ("colonistId") REFERENCES "Colonist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColonistSkill" ADD CONSTRAINT "ColonistSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColonistExpertise" ADD CONSTRAINT "ColonistExpertise_colonistSkillId_fkey" FOREIGN KEY ("colonistSkillId") REFERENCES "ColonistSkill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
