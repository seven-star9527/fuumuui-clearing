import React, { useState, useEffect } from "react";
import {
  render,
  useCartLines,
  useApi,
  useTranslate,
  Banner,
  BlockStack,
  Box,
  Button,
  InlineLayout,
  ProgressIndicator,
  Text,
  TextField,
} from "@shopify/ui-extensions-react/checkout";
import { ProgressBar } from "./ProgressBar";
import { GiftModal } from "./GiftModal";

// 阶梯配置
const DEFAULT_TIERS = [
  { minAmount: 39, giftValue: 20 },
  { minAmount: 59, giftValue: 30 },
  { minAmount: 79, giftValue: 40 },
  { minAmount: 99, giftValue: 50 },
  { minAmount: 119, giftValue: 70 },
  { minAmount: 139, giftValue: 100 },
  { minAmount: 159, giftValue: 120 },
];

// 默认赠品识别标签
const DEFAULT_GIFT_TAG = "is_free_gift";

export default render("checkout.targeting.render-before", () => {
  const { cart } = useApi();
  const translate = useTranslate();

  const [showModal, setShowModal] = useState(false);
  const [config, setConfig] = useState({
    tiers: DEFAULT_TIERS,
    giftTag: DEFAULT_GIFT_TAG,
  });

  // 加载配置
  useEffect(() => {
    const loadConfig = async () => {
      // 从 metafield 读取配置
      const metafields = cart.metafields;
      const gwpConfig = metafields?.find(
        (m: any) => m?.key === "settings" && m?.namespace === "gwp_config"
      );

      if (gwpConfig?.value) {
        try {
          const parsed = JSON.parse(gwpConfig.value);
          setConfig({
            tiers: parsed.tiers || DEFAULT_TIERS,
            giftTag: parsed.giftRule?.giftTag || DEFAULT_GIFT_TAG,
          });
        } catch (e) {
          console.error("Failed to parse GWP config:", e);
        }
      }
    };

    loadConfig();
  }, [cart.metafields]);

  // 计算当前购物车金额（排除赠品）
  const cartLines = cart.lines || [];
  const subtotal = cartLines
    .filter((line: any) => {
      const tags = line.merchandise?.product?.tags || [];
      return !tags.includes(config.giftTag);
    })
    .reduce((sum: number, line: any) => {
      const price = parseFloat(line.merchandise?.price?.amount || 0);
      return sum + price * (line.quantity || 1);
    }, 0);

  // 计算下一个阶梯
  const sortedTiers = [...config.tiers].sort(
    (a: any, b: any) => a.minAmount - b.minAmount
  );
  const nextTier = sortedTiers.find(
    (tier: any) => subtotal < tier.minAmount
  );
  const currentTier = [...sortedTiers]
    .reverse()
    .find((tier: any) => subtotal >= tier.minAmount);

  // 计算进度
  const progress = nextTier
    ? (subtotal / nextTier.minAmount) * 100
    : 100;

  // 剩余金额
  const remaining = nextTier
    ? nextTier.minAmount - subtotal
    : 0;

  return (
    <BlockStack spacing="base">
      {/* 进度条 Banner */}
      <Banner>
        <BlockStack spacing="base">
          <InlineLayout columns={["auto", "1fr", "auto"]} spacing="base">
            <Text size="medium" fontWeight="bold">
              🎁 GWP 赠品活动
            </Text>
            <Text size="small" appearance="subdued">
              {nextTier
                ? `再消费 $${remaining.toFixed(2)} 即可获得 $${nextTier.giftValue} 赠品额度`
                : `🎉 您已达到最高赠品额度 $${currentTier?.giftValue || 0}`}
            </Text>
            <Button onPress={() => setShowModal(true)} size="small">
              查看详情
            </Button>
          </InlineLayout>

          <ProgressBar value={Math.min(progress, 100)} />

          <InlineLayout columns={["1fr", "1fr"]} spacing="tight">
            <Text size="small" appearance="subdued">
              当前消费: ${subtotal.toFixed(2)}
            </Text>
            <Text size="small" appearance="subdued" alignment="trailing">
              {nextTier
                ? `目标: $${nextTier.minAmount}`
                : `已解锁全部额度`}
            </Text>
          </InlineLayout>
        </BlockStack>
      </Banner>

      {/* 赠品弹窗 */}
      {showModal && (
        <GiftModal
          subtotal={subtotal}
          tiers={config.tiers}
          onClose={() => setShowModal(false)}
        />
      )}
    </BlockStack>
  );
});
