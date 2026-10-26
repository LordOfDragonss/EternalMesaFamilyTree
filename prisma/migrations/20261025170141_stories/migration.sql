-- CreateEnum
CREATE TYPE "StoryStatus" AS ENUM ('DRAFT', 'COMPLETE');

-- CreateEnum
CREATE TYPE "StoryDateType" AS ENUM ('SINGLE', 'RANGE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "ReferenceMaterialType" AS ENUM ('IMAGE', 'TEXT', 'FILE', 'OTHER');

-- CreateTable
CREATE TABLE "Story" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "type" TEXT NOT NULL,
    "status" "StoryStatus" NOT NULL DEFAULT 'DRAFT',
    "content" JSONB NOT NULL,
    "editorialNotes" TEXT,
    "dateType" "StoryDateType" NOT NULL DEFAULT 'UNKNOWN',
    "dateStartDay" INTEGER,
    "dateStartMonth" INTEGER,
    "dateStartYear" INTEGER,
    "dateStartApproximate" BOOLEAN NOT NULL DEFAULT false,
    "dateEndDay" INTEGER,
    "dateEndMonth" INTEGER,
    "dateEndYear" INTEGER,
    "dateEndApproximate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryTag" (
    "storyId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,

    CONSTRAINT "StoryTag_pkey" PRIMARY KEY ("storyId","tagId")
);

-- CreateTable
CREATE TABLE "StoryCollection" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryCollection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryCollectionMembership" (
    "storyId" INTEGER NOT NULL,
    "collectionId" INTEGER NOT NULL,

    CONSTRAINT "StoryCollectionMembership_pkey" PRIMARY KEY ("storyId","collectionId")
);

-- CreateTable
CREATE TABLE "StoryEditorialComment" (
    "id" TEXT NOT NULL,
    "storyId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoryEditorialComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferenceMaterial" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "kind" "ReferenceMaterialType" NOT NULL,
    "source" TEXT,
    "content" TEXT,
    "assetId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReferenceMaterial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryReference" (
    "storyId" INTEGER NOT NULL,
    "referenceId" INTEGER NOT NULL,
    "contextNote" TEXT,

    CONSTRAINT "StoryReference_pkey" PRIMARY KEY ("storyId","referenceId")
);

-- CreateTable
CREATE TABLE "StoredAsset" (
    "id" SERIAL NOT NULL,
    "objectKey" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoredAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoryInlineAsset" (
    "storyId" INTEGER NOT NULL,
    "assetId" INTEGER NOT NULL,

    CONSTRAINT "StoryInlineAsset_pkey" PRIMARY KEY ("storyId","assetId")
);

-- CreateTable
CREATE TABLE "StoryColonist" (
    "storyId" INTEGER NOT NULL,
    "colonistId" INTEGER NOT NULL,
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "isInline" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StoryColonist_pkey" PRIMARY KEY ("storyId","colonistId")
);

-- CreateTable
CREATE TABLE "StoryLegacy" (
    "storyId" INTEGER NOT NULL,
    "legacyId" INTEGER NOT NULL,
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "isInline" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StoryLegacy_pkey" PRIMARY KEY ("storyId","legacyId")
);

-- CreateTable
CREATE TABLE "StoryGroup" (
    "storyId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "isInline" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StoryGroup_pkey" PRIMARY KEY ("storyId","groupId")
);

-- CreateTable
CREATE TABLE "StoryLocation" (
    "storyId" INTEGER NOT NULL,
    "locationId" INTEGER NOT NULL,
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "isInline" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StoryLocation_pkey" PRIMARY KEY ("storyId","locationId")
);

-- CreateTable
CREATE TABLE "StoryRelic" (
    "storyId" INTEGER NOT NULL,
    "relicId" INTEGER NOT NULL,
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "isInline" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StoryRelic_pkey" PRIMARY KEY ("storyId","relicId")
);

-- CreateTable
CREATE TABLE "StoryRelatedStory" (
    "storyId" INTEGER NOT NULL,
    "relatedStoryId" INTEGER NOT NULL,
    "isManual" BOOLEAN NOT NULL DEFAULT false,
    "isInline" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "StoryRelatedStory_pkey" PRIMARY KEY ("storyId","relatedStoryId")
);

-- CreateIndex
CREATE INDEX "Story_status_updatedAt_idx" ON "Story"("status", "updatedAt");

-- CreateIndex
CREATE INDEX "Story_dateType_dateStartYear_idx" ON "Story"("dateType", "dateStartYear");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "StoryTag_tagId_idx" ON "StoryTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "StoryCollection_name_key" ON "StoryCollection"("name");

-- CreateIndex
CREATE INDEX "StoryCollectionMembership_collectionId_idx" ON "StoryCollectionMembership"("collectionId");

-- CreateIndex
CREATE INDEX "StoryEditorialComment_storyId_createdAt_idx" ON "StoryEditorialComment"("storyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReferenceMaterial_assetId_key" ON "ReferenceMaterial"("assetId");

-- CreateIndex
CREATE INDEX "ReferenceMaterial_kind_title_idx" ON "ReferenceMaterial"("kind", "title");

-- CreateIndex
CREATE INDEX "StoryReference_referenceId_idx" ON "StoryReference"("referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "StoredAsset_objectKey_key" ON "StoredAsset"("objectKey");

-- CreateIndex
CREATE INDEX "StoryInlineAsset_assetId_idx" ON "StoryInlineAsset"("assetId");

-- CreateIndex
CREATE INDEX "StoryColonist_colonistId_idx" ON "StoryColonist"("colonistId");

-- CreateIndex
CREATE INDEX "StoryLegacy_legacyId_idx" ON "StoryLegacy"("legacyId");

-- CreateIndex
CREATE INDEX "StoryGroup_groupId_idx" ON "StoryGroup"("groupId");

-- CreateIndex
CREATE INDEX "StoryLocation_locationId_idx" ON "StoryLocation"("locationId");

-- CreateIndex
CREATE INDEX "StoryRelic_relicId_idx" ON "StoryRelic"("relicId");

-- CreateIndex
CREATE INDEX "StoryRelatedStory_relatedStoryId_idx" ON "StoryRelatedStory"("relatedStoryId");

-- AddForeignKey
ALTER TABLE "StoryTag" ADD CONSTRAINT "StoryTag_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryTag" ADD CONSTRAINT "StoryTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryCollectionMembership" ADD CONSTRAINT "StoryCollectionMembership_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryCollectionMembership" ADD CONSTRAINT "StoryCollectionMembership_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "StoryCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryEditorialComment" ADD CONSTRAINT "StoryEditorialComment_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferenceMaterial" ADD CONSTRAINT "ReferenceMaterial_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "StoredAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryReference" ADD CONSTRAINT "StoryReference_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryReference" ADD CONSTRAINT "StoryReference_referenceId_fkey" FOREIGN KEY ("referenceId") REFERENCES "ReferenceMaterial"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryInlineAsset" ADD CONSTRAINT "StoryInlineAsset_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryInlineAsset" ADD CONSTRAINT "StoryInlineAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "StoredAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryColonist" ADD CONSTRAINT "StoryColonist_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryColonist" ADD CONSTRAINT "StoryColonist_colonistId_fkey" FOREIGN KEY ("colonistId") REFERENCES "Colonist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryLegacy" ADD CONSTRAINT "StoryLegacy_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryLegacy" ADD CONSTRAINT "StoryLegacy_legacyId_fkey" FOREIGN KEY ("legacyId") REFERENCES "Legacy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryGroup" ADD CONSTRAINT "StoryGroup_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryGroup" ADD CONSTRAINT "StoryGroup_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryLocation" ADD CONSTRAINT "StoryLocation_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryLocation" ADD CONSTRAINT "StoryLocation_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryRelic" ADD CONSTRAINT "StoryRelic_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryRelic" ADD CONSTRAINT "StoryRelic_relicId_fkey" FOREIGN KEY ("relicId") REFERENCES "Relic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryRelatedStory" ADD CONSTRAINT "StoryRelatedStory_storyId_fkey" FOREIGN KEY ("storyId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoryRelatedStory" ADD CONSTRAINT "StoryRelatedStory_relatedStoryId_fkey" FOREIGN KEY ("relatedStoryId") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;
