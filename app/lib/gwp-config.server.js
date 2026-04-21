/**
 * GWP 配置服务
 * 处理阶梯配置、赠品规则、活动时间的 CRUD 操作
 */

import prisma from "../db.server";

/**
 * 获取店铺的阶梯配置
 */
export async function getTiers(shop) {
  return prisma.gWPTier.findMany({
    where: { shop, isActive: true },
    orderBy: { minAmount: "asc" },
  });
}

/**
 * 获取店铺的赠品规则
 */
export async function getGiftRule(shop) {
  return prisma.gWPGiftRule.findUnique({
    where: { shop },
  });
}

/**
 * 获取店铺的活动配置
 */
export async function getCampaign(shop) {
  return prisma.gWPCampaign.findFirst({
    where: { shop, isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * 保存阶梯配置（批量）
 */
export async function saveTiers(shop, tiers) {
  // 先删除旧的
  await prisma.gWPTier.deleteMany({
    where: { shop },
  });

  // 创建新的
  if (tiers && tiers.length > 0) {
    await prisma.gWPTier.createMany({
      data: tiers.map((tier, index) => ({
        shop,
        minAmount: parseFloat(tier.minAmount),
        giftValue: parseFloat(tier.giftValue),
        sortOrder: index,
        isActive: true,
      })),
    });
  }

  return getTiers(shop);
}

/**
 * 保存赠品规则
 */
export async function saveGiftRule(shop, rule) {
  return prisma.gWPGiftRule.upsert({
    where: { shop },
    update: {
      giftTag: rule.giftTag || "is_free_gift",
      useMetafield: rule.useMetafield || false,
      metafieldKey: rule.metafieldKey || "_is_gift",
      maxGiftsAllowed: rule.maxGiftsAllowed || 10,
    },
    create: {
      shop,
      giftTag: rule.giftTag || "is_free_gift",
      useMetafield: rule.useMetafield || false,
      metafieldKey: rule.metafieldKey || "_is_gift",
      maxGiftsAllowed: rule.maxGiftsAllowed || 10,
    },
  });
}

/**
 * 保存活动时间
 */
export async function saveCampaign(shop, campaign) {
  return prisma.gWPCampaign.upsert({
    where: { shop },
    update: {
      name: campaign.name,
      startTime: new Date(campaign.startTime),
      endTime: campaign.endTime ? new Date(campaign.endTime) : null,
      isActive: true,
    },
    create: {
      shop,
      name: campaign.name,
      startTime: new Date(campaign.startTime),
      endTime: campaign.endTime ? new Date(campaign.endTime) : null,
    },
  });
}

/**
 * 获取所有配置（合并返回）
 */
export async function getFullConfig(shop) {
  const [tiers, giftRule, campaign] = await Promise.all([
    getTiers(shop),
    getGiftRule(shop),
    getCampaign(shop),
  ]);

  return {
    tiers,
    giftRule: giftRule || {
      giftTag: "is_free_gift",
      useMetafield: false,
      metafieldKey: "_is_gift",
      maxGiftsAllowed: 10,
    },
    campaign,
  };
}

/**
 * 根据购物车金额获取对应的赠品额度
 */
export function getTierBySubtotal(subtotal, tiers) {
  if (!tiers || tiers.length === 0) return null;

  // 按金额降序排列，找到第一个满足条件的阶梯
  const sortedTiers = [...tiers].sort((a, b) => b.minAmount - a.minAmount);

  for (const tier of sortedTiers) {
    if (subtotal >= tier.minAmount) {
      return tier;
    }
  }

  return null;
}

/**
 * 检查活动是否在有效期内
 */
export function isCampaignActive(campaign) {
  if (!campaign || !campaign.isActive) return false;

  const now = new Date();

  if (now < campaign.startTime) return false;
  if (campaign.endTime && now > campaign.endTime) return false;

  return true;
}
