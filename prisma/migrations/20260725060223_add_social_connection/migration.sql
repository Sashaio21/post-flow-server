/*
  Warnings:

  - You are about to drop the column `coverHtml` on the `Template` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Template" DROP COLUMN "coverHtml";

-- CreateTable
CREATE TABLE "SocialConnection" (
    "id" SERIAL NOT NULL,
    "platform" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "accountName" TEXT NOT NULL,
    "metadata" JSONB,
    "ownerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialConnection_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SocialConnection" ADD CONSTRAINT "SocialConnection_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
