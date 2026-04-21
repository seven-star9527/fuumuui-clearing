import React from "react";
import {
  Modal,
  BlockStack,
  Text,
  InlineLayout,
  Button,
  Divider,
  Badge,
} from "@shopify/ui-extensions-react/checkout";

interface Tier {
  minAmount: number;
  giftValue: number;
}

interface GiftModalProps {
  subtotal: number;
  tiers: Tier[];
  onClose: () => void;
}

export function GiftModal({ subtotal, tiers, onClose }: GiftModalProps) {
  const sortedTiers = [...tiers].sort((a, b) => a.minAmount - b.minAmount);

  return (
    <Modal
      title="🎁 GWP 赠品活动"
      onClose={onClose}
      size="large"
    >
      <BlockStack spacing="base">
        <Text>
          添加带有"is_free_gift"标签的产品至购物车，即可享受赠品优惠！
        </Text>

        <Divider />

        {/* 阶梯表格 */}
        <BlockStack spacing="tight">
          <InlineLayout
            columns={["1fr", "1fr", "auto"]}
            spacing="base"
            padding="base"
          >
            <Text fontWeight="bold">消费金额</Text>
            <Text fontWeight="bold">赠品额度</Text>
            <Text fontWeight="bold">状态</Text>
          </InlineLayout>

          <Divider />

          {sortedTiers.map((tier, index) => {
            const isUnlocked = subtotal >= tier.minAmount;
            const isCurrent = sortedTiers[index - 1]
              ? subtotal >= sortedTiers[index - 1].minAmount &&
                subtotal < tier.minAmount
              : subtotal < tier.minAmount;

            return (
              <BlockStack key={index} spacing="tight">
                <InlineLayout
                  columns={["1fr", "1fr", "auto"]}
                  spacing="base"
                  padding="base"
                  blockAlignment="center"
                >
                  <Text>${tier.minAmount}+</Text>
                  <Text fontWeight="semibold" appearance={isUnlocked ? "success" : undefined}>
                    赠 ${tier.giftValue}
                  </Text>
                  <Badge tone={isUnlocked ? "success" : "neutral"}>
                    {isUnlocked
                      ? "✓ 已解锁"
                      : isCurrent
                      ? "进行中"
                      : "未解锁"}
                  </Badge>
                </InlineLayout>
                {index < sortedTiers.length - 1 && <Divider />}
              </BlockStack>
            );
          })}
        </BlockStack>

        <Divider />

        {/* 操作按钮 */}
        <BlockStack spacing="tight">
          <Button onPress={onClose} fullWidth>
            关闭
          </Button>
        </BlockStack>
      </BlockStack>
    </Modal>
  );
}
