// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

// 默认阶梯配置
const DEFAULT_TIERS = [
  { minAmount: 39, giftValue: 20 },
  { minAmount: 59, giftValue: 30 },
  { minAmount: 79, giftValue: 40 },
  { minAmount: 99, giftValue: 50 },
  { minAmount: 119, giftValue: 70 },
  { minAmount: 139, giftValue: 100 },
  { minAmount: 159, giftValue: 120 },
];

const DEFAULT_GIFT_TAG = "is_free_gift";

/**
 * 从 Cart metafield 解析 GWP 配置
 */
function parseConfig(cart) {
  const metafield = cart?.metafield;
  if (!metafield?.value) {
    console.log("[GWP] No config found in cart metafield, using defaults");
    return {
      tiers: DEFAULT_TIERS,
      giftRule: { giftTag: DEFAULT_GIFT_TAG, useMetafield: false, metafieldKey: "_is_gift" },
      campaign: null,
    };
  }
  try {
    return JSON.parse(metafield.value);
  } catch (e) {
    console.error("[GWP] Failed to parse config:", e);
    return {
      tiers: DEFAULT_TIERS,
      giftRule: { giftTag: DEFAULT_GIFT_TAG, useMetafield: false, metafieldKey: "_is_gift" },
      campaign: null,
    };
  }
}

/**
 * 检查是否是赠品行
 * 注意：Shopify Function schema 使用 hasAnyTag() 而非 tags 数组
 * metafield 使用单数形式 metafield() 而非 metafields()
 */
function isGiftLine(line, config) {
  const product = line.merchandise?.product;
  if (!product) return false;

  if (config?.useMetafield) {
    // 通过 metafield 识别
    const giftMetafield = product.metafield;
    return giftMetafield?.value === "true";
  }

  // 通过 hasAnyTag 识别（GraphQL 已经帮我们检查过了）
  return product.hasAnyTag === true;
}

/**
 * 获取商品单价（从 CartLineCost 获取）
 */
function getLinePrice(line) {
  return parseFloat(line.cost?.amountPerQuantity?.amount || "0");
}

/**
 * 检查活动是否在有效期内
 */
function isCampaignActive(campaign) {
  if (!campaign) return true;
  const now = new Date();
  const startTime = new Date(campaign.startTime);
  const endTime = campaign.endTime ? new Date(campaign.endTime) : null;
  if (now < startTime) return false;
  if (endTime && now > endTime) return false;
  return true;
}

/**
 * 根据购物车金额获取赠品额度
 */
function getAllowedGiftValue(subtotal, tiers) {
  if (!tiers || tiers.length === 0) return 0;
  const sortedTiers = [...tiers].sort((a, b) => b.minAmount - a.minAmount);
  for (const tier of sortedTiers) {
    if (subtotal >= tier.minAmount) {
      return tier.giftValue;
    }
  }
  return 0;
}


/**
 * 核心算法：价值扣减
 * 从低到高排序赠品，确保 totalDiscountValue <= allowedValue
 */
function calculateDiscountTargets(giftLines, allowedValue) {
  const sortedGiftLines = [...giftLines].sort((a, b) => a.price - b.price);
  const targets = [];
  let currentValueUsed = 0;

  for (const line of sortedGiftLines) {
    const remainingValue = allowedValue - currentValueUsed;
    if (remainingValue <= 0) break;

    // Math.floor 确保不会超额度
    const affordableQty = Math.floor(remainingValue / line.price);
    const actualQty = Math.min(line.quantity, affordableQty);

    if (actualQty > 0) {
      targets.push({
        lineItemId: line.id,
        quantity: actualQty,
      });
      currentValueUsed += line.price * actualQty;
      console.log(`[GWP] Line ${line.id}: price=${line.price}, discountQty=${actualQty}, totalUsed=${currentValueUsed}`);
    }
  }

  console.log(`[GWP] Final: allowedValue=${allowedValue}, usedValue=${currentValueUsed}`);
  return targets;
}

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  console.log("[GWP] Function started");

  // 1. 从购物车读取配置（有配置用配置，没有用默认值）
  const cart = input?.cart;
  const config = parseConfig(cart);

  // 2. 检查活动是否在有效期内
  if (!isCampaignActive(config.campaign)) {
    console.log("[GWP] Campaign not active");
    return {
      discountApplicationStrategy: DiscountApplicationStrategy.First,
      discounts: [],
    };
  }

  // 3. 校验购物车
  if (!cart || !cart.lines || cart.lines.length === 0) {
    console.log("[GWP] Empty cart");
    return {
      discountApplicationStrategy: DiscountApplicationStrategy.First,
      discounts: [],
    };
  }

  // 4. 分离赠品和正价商品
  const giftLines = [];
  const regularLines = [];

  for (const line of cart.lines) {
    if (!line || !line.merchandise) continue;
    const lineData = {
      id: line.id,
      quantity: line.quantity || 1,
      price: getLinePrice(line),
    };
    if (isGiftLine(line, config.giftRule)) {
      giftLines.push(lineData);
    } else {
      regularLines.push(lineData);
    }
  }

  console.log(`[GWP] Gift lines: ${giftLines.length}, Regular lines: ${regularLines.length}`);

  if (giftLines.length === 0) {
    return {
      discountApplicationStrategy: DiscountApplicationStrategy.First,
      discounts: [],
    };
  }

  // 5. 计算正价商品总额
  const subtotal = regularLines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  console.log(`[GWP] Cart subtotal (excluding gifts): $${subtotal.toFixed(2)}`);

  // 6. 获取赠品额度
  const tiers = config.tiers || DEFAULT_TIERS;
  const allowedGiftValue = getAllowedGiftValue(subtotal, tiers);
  console.log(`[GWP] Allowed gift value: $${allowedGiftValue}`);

  if (allowedGiftValue <= 0) {
    console.log("[GWP] Subtotal does not meet any tier");
    return {
      discountApplicationStrategy: DiscountApplicationStrategy.First,
      discounts: [],
    };
  }

  // 7. 计算折扣目标
  const targets = calculateDiscountTargets(giftLines, allowedGiftValue);

  if (targets.length === 0) {
    return {
      discountApplicationStrategy: DiscountApplicationStrategy.First,
      discounts: [],
    };
  }

  // 8. 返回 100% 折扣
  return {
    discountApplicationStrategy: DiscountApplicationStrategy.First,
    discounts: [
      {
        productDiscount: {
          value: {
            percentage: 100,
          },
          targets: targets,
          message: `GWP: You qualify for $${allowedGiftValue} worth of free gifts!`,
        },
      },
    ],
  };
}
