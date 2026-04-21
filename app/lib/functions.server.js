/**
 * Shopify Admin API 封装
 * 用于将 GWP 配置写入 Shopify Metafields
 */

const GWP_CONFIG_NAMESPACE = "gwp_config";

/**
 * 将配置写入 Shop metafield
 */
export async function syncConfigToMetafield(admin, shop, config) {
  const configJson = JSON.stringify({
    tiers: config.tiers.map((t) => ({
      minAmount: t.minAmount,
      giftValue: t.giftValue,
    })),
    giftRule: {
      giftTag: config.giftRule.giftTag,
      useMetafield: config.giftRule.useMetafield,
      metafieldKey: config.giftRule.metafieldKey,
      maxGiftsAllowed: config.giftRule.maxGiftsAllowed,
    },
    campaign: config.campaign
      ? {
          name: config.campaign.name,
          startTime: config.campaign.startTime?.toISOString(),
          endTime: config.campaign.endTime?.toISOString(),
        }
      : null,
    updatedAt: new Date().toISOString(),
  });

  // 先查询当前店铺的真实 ID
  const shopQuery = await admin.graphql(`
    #graphql
    query { shop { id } }
  `);
  const shopData = await shopQuery.json();
  const shopId = shopData.data?.shop?.id;

  if (!shopId) {
    throw new Error("Could not fetch Shop ID for metafieldsSet.");
  }

  // 使用最新的 metafieldsSet API
  const response = await admin.graphql(
    `#graphql
    mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          key
          namespace
          value
          createdAt
          updatedAt
        }
        userErrors {
          field
          message
          code
        }
      }
    }`,
    {
      variables: {
        metafields: [
          {
            key: "settings",
            namespace: GWP_CONFIG_NAMESPACE,
            ownerId: shopId,
            type: "json",
            value: configJson,
          },
        ],
      },
    }
  );

  const responseJson = await response.json();
  
  if (responseJson.data?.metafieldsSet?.userErrors?.length > 0) {
    console.error("Metafield Set Errors:", responseJson.data.metafieldsSet.userErrors);
    throw new Error(responseJson.data.metafieldsSet.userErrors[0].message);
  }
  
  return responseJson;
}

/**
 * 从 Metafield 读取配置
 */
export async function getConfigFromMetafield(admin) {
  const response = await admin.graphql(
    `#graphql
    query getGWPConfig {
      shop {
        metafield(namespace: "${GWP_CONFIG_NAMESPACE}", key: "settings") {
          id
          value
        }
      }
    }`
  );

  const json = await response.json();
  const value = json?.data?.shop?.metafield?.value;

  if (value) {
    try {
      return JSON.parse(value);
    } catch (e) {
      console.error("Failed to parse GWP config:", e);
    }
  }

  return null;
}

/**
 * 确保折扣节点存在
 */
export async function ensureDiscountNodeExists(admin, shop, campaignName) {
  // 1. 查询现有的 App Discounts
  const discountsQuery = await admin.graphql(`
    #graphql
    query {
      discountNodes(first: 10, query: "status:active") {
        nodes {
          id
          discount {
            ... on DiscountAutomaticApp {
              title
              appDiscountType {
                functionId
              }
            }
          }
        }
      }
    }
  `);
  
  const discountsData = await discountsQuery.json();
  const activeAppDiscounts = discountsData.data?.discountNodes?.nodes || [];
  
  // 检查是否已有 GWP 折扣在运行
  const hasGwpDiscount = activeAppDiscounts.some(node => 
    node.discount?.title?.includes("GWP") || node.discount?.title === (campaignName || "GWP Automatic Discount")
  );

  if (hasGwpDiscount) {
    return { success: true, message: "Discount already exists" };
  }

  // 2. 查询我们的 Function ID
  const functionsQuery = await admin.graphql(`
    #graphql
    query {
      shopifyFunctions(first: 10) {
        nodes {
          id
          title
          apiType
        }
      }
    }
  `);

  const functionsData = await functionsQuery.json();
  const gwpFunction = functionsData.data?.shopifyFunctions?.nodes?.find(
    fn => fn.title.includes("cart-discount-function") || fn.title.includes("GWP") || fn.apiType === "product_discounts"
  );

  if (!gwpFunction) {
    console.error("GWP Function not found installed on this shop.");
    return { success: false, error: "GWP Function extension not found" };
  }

  // 3. 创建自动折扣
  const createMutation = await admin.graphql(`
    #graphql
    mutation discountAutomaticAppCreate($automaticAppDiscount: DiscountAutomaticAppInput!) {
      discountAutomaticAppCreate(automaticAppDiscount: $automaticAppDiscount) {
        automaticAppDiscount {
          id
        }
        userErrors {
          field
          message
        }
      }
    }
  `, {
    variables: {
      automaticAppDiscount: {
        title: campaignName || "GWP Automatic Discount",
        functionId: gwpFunction.id,
        startsAt: new Date().toISOString()
      }
    }
  });

  const createResult = await createMutation.json();
  if (createResult.data?.discountAutomaticAppCreate?.userErrors?.length > 0) {
    console.error("Create discount error:", createResult.data.discountAutomaticAppCreate.userErrors);
    return { success: false, error: createResult.data.discountAutomaticAppCreate.userErrors[0].message };
  }

  return { success: true };
}

export { GWP_CONFIG_NAMESPACE };
