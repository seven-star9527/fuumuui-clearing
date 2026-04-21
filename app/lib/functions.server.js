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

export { GWP_CONFIG_NAMESPACE };
