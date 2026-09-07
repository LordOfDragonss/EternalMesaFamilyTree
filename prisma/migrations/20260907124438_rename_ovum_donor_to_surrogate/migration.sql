/*
  Warnings:

  - The values [OvumDonor] on the enum `ParentType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ParentType_new" AS ENUM ('Biological', 'Surrogate', 'Other');
ALTER TABLE "ParentChild" ALTER COLUMN "type" TYPE "ParentType_new" USING ("type"::text::"ParentType_new");
ALTER TYPE "ParentType" RENAME TO "ParentType_old";
ALTER TYPE "ParentType_new" RENAME TO "ParentType";
DROP TYPE "public"."ParentType_old";
COMMIT;
