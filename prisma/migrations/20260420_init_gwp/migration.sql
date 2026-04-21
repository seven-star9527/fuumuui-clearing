-- CreateTable: GWPTier
CREATE TABLE IF NOT EXISTS "GWPTier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "minAmount" REAL NOT NULL,
    "giftValue" REAL NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable: GWPGiftRule
CREATE TABLE IF NOT EXISTS "GWPGiftRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "giftTag" TEXT NOT NULL DEFAULT 'is_free_gift',
    "useMetafield" INTEGER NOT NULL DEFAULT 0,
    "metafieldKey" TEXT NOT NULL DEFAULT '_is_gift',
    "maxGiftsAllowed" INTEGER NOT NULL DEFAULT 10,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable: GWPCampaign
CREATE TABLE IF NOT EXISTS "GWPCampaign" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "shop" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME,
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "GWPTier_shop_minAmount_key" ON "GWPTier"("shop", "minAmount");
CREATE UNIQUE INDEX IF NOT EXISTS "GWPGiftRule_shop_key" ON "GWPGiftRule"("shop");
CREATE INDEX IF NOT EXISTS "GWPCampaign_shop_isActive_idx" ON "GWPCampaign"("shop", "isActive");
