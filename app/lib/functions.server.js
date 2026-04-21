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

  // 查询是否已存在
  const existing = await admin.graphql(
    `#graphql
    query getShopMetafield {
      shop {
        metafield(namespace: "${GWP_CONFIG_NAMESPACE}", key: "settings") {
          id
        }
      }
    }`
  );

  const existingJson = await existing.json();
  const metafieldId = existingJson?.data?.shop?.metafield?.id;

  if (metafieldId) {
    // 更新
    const response = await admin.graphql(
      `#graphql
      mutation updateMetafield($id: ID!, $value: String!) {
        metafieldUpdate(input: { id: $id, value: $value }) {
          metafield {
            id
            key
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          id: metafieldId,
          value: configJson,
        },
      }
    );
    return response.json();
  } else {
    // 创建
    const response = await admin.graphql(
      `#graphql
      mutation createMetafield($metafield: MetafieldInput!) {
        metafieldCreate(input: $metafield) {
          metafield {
            id
            key
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          metafield: {
            namespace: GWP_CONFIG_NAMESPACE,
            key: "settings",
            type: "json",
            value: configJson,
            ownerType: "SHOP",
          },
        },
      }
    );
    return response.json();
  }
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
