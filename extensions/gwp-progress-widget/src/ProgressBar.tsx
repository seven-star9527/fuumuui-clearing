import React from "react";
import { View, StyleSheet } from "@shopify/ui-extensions-react/checkout";

interface ProgressBarProps {
  value: number; // 0-100
  height?: number;
  backgroundColor?: string;
  fillColor?: string;
}

export function ProgressBar({
  value,
  height = 8,
  backgroundColor = "#E5E7EB",
  fillColor = "linear-gradient(90deg, #8B5CF6 0%, #3B82F6 100%)",
}: ProgressBarProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);

  return (
    <View
      style={{
        height: `${height}px`,
        backgroundColor: backgroundColor,
        borderRadius: `${height / 2}px`,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* 渐变填充 */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: "100%",
          width: `${clampedValue}%`,
          background: fillColor,
          borderRadius: `${height / 2}px`,
          transition: "width 0.3s ease-out",
        }}
      />
      {/* 发光效果 */}
      {clampedValue > 0 && (
        <View
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            height: "100%",
            width: "4px",
          }}
        />
      )}
    </View>
  );
}
