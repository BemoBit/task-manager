/*
  Warnings:

  - You are about to drop the column `isPublic` on the `templates` table. All the data in the column will be lost.
  - Added the required column `createdBy` to the `template_versions` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TemplateAccessLevel" AS ENUM ('PRIVATE', 'SHARED', 'PUBLIC');

-- CreateEnum
CREATE TYPE "TemplatePermission" AS ENUM ('VIEW', 'EDIT', 'ADMIN');

-- CreateEnum
CREATE TYPE "CollaborationAction" AS ENUM ('CURSOR_MOVE', 'SELECTION', 'EDIT', 'COMMENT');

-- AlterTable
ALTER TABLE "template_versions" ADD COLUMN     "branchName" TEXT DEFAULT 'main',
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "isMerged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mergedAt" TIMESTAMP(3),
ADD COLUMN     "parentId" TEXT;

-- AlterTable
ALTER TABLE "templates" DROP COLUMN "isPublic",
ADD COLUMN     "accessLevel" "TemplateAccessLevel" NOT NULL DEFAULT 'PRIVATE',
ADD COLUMN     "category" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "forkCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "forkedFrom" TEXT,
ADD COLUMN     "isDeleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rating" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "ratingCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "usageCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "template_shares" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" "TemplatePermission" NOT NULL,
    "sharedBy" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_analytics" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "userId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "template_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "template_shares_templateId_idx" ON "template_shares"("templateId");

-- CreateIndex
CREATE INDEX "template_shares_userId_idx" ON "template_shares"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "template_shares_templateId_userId_key" ON "template_shares"("templateId", "userId");

-- CreateIndex
CREATE INDEX "template_analytics_templateId_idx" ON "template_analytics"("templateId");

-- CreateIndex
CREATE INDEX "template_analytics_event_idx" ON "template_analytics"("event");

-- CreateIndex
CREATE INDEX "template_analytics_createdAt_idx" ON "template_analytics"("createdAt");

-- CreateIndex
CREATE INDEX "template_versions_branchName_idx" ON "template_versions"("branchName");

-- CreateIndex
CREATE INDEX "templates_accessLevel_idx" ON "templates"("accessLevel");

-- CreateIndex
CREATE INDEX "templates_isDeleted_idx" ON "templates"("isDeleted");

-- CreateIndex
CREATE INDEX "templates_category_idx" ON "templates"("category");

-- AddForeignKey
ALTER TABLE "templates" ADD CONSTRAINT "templates_forkedFrom_fkey" FOREIGN KEY ("forkedFrom") REFERENCES "templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_shares" ADD CONSTRAINT "template_shares_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template_analytics" ADD CONSTRAINT "template_analytics_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
