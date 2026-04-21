/*
  Warnings:

  - You are about to alter the column `isActive` on the `GWPCampaign` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Boolean`.
  - You are about to alter the column `isActive` on the `GWPGiftRule` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Boolean`.
  - You are about to alter the column `useMetafield` on the `GWPGiftRule` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Boolean`.
  - You are about to alter the column `isActive` on the `GWPTier` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Boolean`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_GWPCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_GWPCampaign" ("createdAt", "endTime", "id", "isActive", "name", "shop", "startTime", "updatedAt") SELECT "createdAt", "endTime", "id", "isActive", "name", "shop", "startTime", "updatedAt" FROM "GWPCampaign";
DROP TABLE "GWPCampaign";
ALTER TABLE "new_GWPCampaign" RENAME TO "GWPCampaign";
CREATE INDEX "GWPCampaign_shop_isActive_idx" ON "GWPCampaign"("shop", "isActive");
CREATE TABLE "new_GWPGiftRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "giftTag" TEXT NOT NULL DEFAULT 'is_free_gift',
    "useMetafield" BOOLEAN NOT NULL DEFAULT false,
    "metafieldKey" TEXT NOT NULL DEFAULT '_is_gift',
    "maxGiftsAllowed" INTEGER NOT NULL DEFAULT 10,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_GWPGiftRule" ("createdAt", "giftTag", "id", "isActive", "maxGiftsAllowed", "metafieldKey", "shop", "updatedAt", "useMetafield") SELECT "createdAt", "giftTag", "id", "isActive", "maxGiftsAllowed", "metafieldKey", "shop", "updatedAt", "useMetafield" FROM "GWPGiftRule";
DROP TABLE "GWPGiftRule";
ALTER TABLE "new_GWPGiftRule" RENAME TO "GWPGiftRule";
CREATE UNIQUE INDEX "GWPGiftRule_shop_key" ON "GWPGiftRule"("shop");
CREATE TABLE "new_GWPTier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "minAmount" REAL NOT NULL,
    "giftValue" REAL NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_GWPTier" ("createdAt", "giftValue", "id", "isActive", "minAmount", "shop", "sortOrder", "updatedAt") SELECT "createdAt", "giftValue", "id", "isActive", "minAmount", "shop", "sortOrder", "updatedAt" FROM "GWPTier";
DROP TABLE "GWPTier";
ALTER TABLE "new_GWPTier" RENAME TO "GWPTier";
CREATE UNIQUE INDEX "GWPTier_shop_minAmount_key" ON "GWPTier"("shop", "minAmount");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
