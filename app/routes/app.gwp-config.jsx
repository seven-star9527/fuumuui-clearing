/**
 * GWP 配置主页面
 * 提供阶梯配置、赠品规则、活动时间的设置界面
 */

import { useState, useEffect } from "react";
import { data, useFetcher, useLoaderData, useRouteError } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { authenticate } from "../shopify.server";
import {
  saveTiers,
  saveGiftRule,
  saveCampaign,
  getFullConfig,
} from "../lib/gwp-config.server";
import { syncConfigToMetafield } from "../lib/functions.server";

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

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const config = await getFullConfig(session.shop);

  return {
    config,
    shop: session.shop,
  };
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  try {
    const formData = await request.formData();
    const actionType = formData.get("action");
    const dataObj = JSON.parse(formData.get("data") || "{}");

    switch (actionType) {
      case "save_tiers": {
        const tiers = await saveTiers(shop, dataObj.tiers);
        const fullConfig = await getFullConfig(shop);
        await syncConfigToMetafield(admin, shop, fullConfig);
        return { success: true, tiers };
      }
      case "save_gift_rule": {
        const giftRule = await saveGiftRule(shop, dataObj);
        const fullConfig = await getFullConfig(shop);
        await syncConfigToMetafield(admin, shop, fullConfig);
        return { success: true, giftRule };
      }
      case "save_campaign": {
        const campaign = await saveCampaign(shop, dataObj);
        const fullConfig = await getFullConfig(shop);
        await syncConfigToMetafield(admin, shop, fullConfig);
        return { success: true, campaign };
      }
      default:
        return data({ success: false, error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("GWP Config Action Error:", error);
    return data({ success: false, error: error.message }, { status: 500 });
  }
};

export default function GWPConfig() {
  const { config, shop } = useLoaderData();
  const fetcher = useFetcher();

  // 状态管理
  const [tiers, setTiers] = useState(config.tiers?.length > 0 ? config.tiers.map(t => ({
    minAmount: t.minAmount,
    giftValue: t.giftValue,
  })) : DEFAULT_TIERS);

  const [giftRule, setGiftRule] = useState(config.giftRule || {
    giftTag: "is_free_gift",
    useMetafield: false,
    metafieldKey: "_is_gift",
    maxGiftsAllowed: 10,
  });

  const [campaign, setCampaign] = useState(config.campaign || {
    name: "GWP 促销活动",
    startTime: new Date().toISOString().slice(0, 16),
    endTime: "",
  });

  const [activeTab, setActiveTab] = useState("tiers");
  const [isSaving, setIsSaving] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  // 保存操作
  const saveData = async (action, data) => {
    setIsSaving(true);
    const formData = new FormData();
    formData.append("action", action);
    formData.append("data", JSON.stringify(data));
    fetcher.submit(formData, { method: "POST" });
  };

  // 监听保存结果
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      setIsSaving(false);
      if (fetcher.data.success) {
        setSyncStatus({ type: "success", message: "保存成功！" });
      } else {
        setSyncStatus({ type: "error", message: "保存失败" });
      }
      setTimeout(() => setSyncStatus(null), 3000);
    }
  }, [fetcher.state, fetcher.data]);

  // 添加阶梯
  const addTier = () => {
    setTiers([...tiers, { minAmount: 0, giftValue: 0 }]);
  };

  // 删除阶梯
  const removeTier = (index) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  // 更新阶梯
  const updateTier = (index, field, value) => {
    const newTiers = [...tiers];
    newTiers[index][field] = parseFloat(value) || 0;
    setTiers(newTiers);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🎁 GWP 赠品配置
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                配置购物车满额赠品活动规则
              </p>
            </div>
            {syncStatus && (
              <div
                className={`px-4 py-2 rounded-lg text-sm font-medium ${
                  syncStatus.type === "success"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {syncStatus.message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "tiers", label: "📊 阶梯配置", icon: "📊" },
            { id: "rules", label: "🏷️ 赠品规则", icon: "🏷️" },
            { id: "campaign", label: "⏰ 活动时间", icon: "⏰" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-200"
                  : "bg-white text-gray-600 hover:bg-gray-50 shadow-sm"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* 阶梯配置 */}
          {activeTab === "tiers" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    消费阶梯设置
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    设置购物车金额与赠品额度对应关系
                  </p>
                </div>
                <button
                  onClick={addTier}
                  className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium"
                >
                  + 添加阶梯
                </button>
              </div>

              <div className="space-y-4">
                {tiers.map((tier, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
                  >
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        消费满 (USD)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          $
                        </span>
                        <input
                          type="number"
                          value={tier.minAmount}
                          onChange={(e) =>
                            updateTier(index, "minAmount", e.target.value)
                          }
                          className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="0"
                          step="1"
                          min="0"
                        />
                      </div>
                    </div>

                    <div className="text-gray-400 mt-6">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                    </div>

                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        赠品额度 (USD)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                          $
                        </span>
                        <input
                          type="number"
                          value={tier.giftValue}
                          onChange={(e) =>
                            updateTier(index, "giftValue", e.target.value)
                          }
                          className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="0"
                          step="1"
                          min="0"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => removeTier(index)}
                      className="mt-6 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {tiers.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <p>暂无阶梯配置，点击上方按钮添加</p>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => saveData("save_tiers", { tiers })}
                  disabled={isSaving}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-200 transition-all disabled:opacity-50"
                >
                  {isSaving ? "保存中..." : "💾 保存阶梯配置"}
                </button>
              </div>
            </div>
          )}

          {/* 赠品规则 */}
          {activeTab === "rules" && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                赠品识别规则
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    赠品识别方式
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!giftRule.useMetafield}
                        onChange={() =>
                          setGiftRule({ ...giftRule, useMetafield: false })
                        }
                        className="w-4 h-4 text-purple-600"
                      />
                      <span className="text-gray-700">
                        使用产品标签识别
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={giftRule.useMetafield}
                        onChange={() =>
                          setGiftRule({ ...giftRule, useMetafield: true })
                        }
                        className="w-4 h-4 text-purple-600"
                      />
                      <span className="text-gray-700">
                        使用 Metafield 识别
                      </span>
                    </label>
                  </div>
                </div>

                {!giftRule.useMetafield ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      赠品标签名称
                    </label>
                    <input
                      type="text"
                      value={giftRule.giftTag}
                      onChange={(e) =>
                        setGiftRule({ ...giftRule, giftTag: e.target.value })
                      }
                      className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="is_free_gift"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      添加到此标签的产品将被识别为赠品
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Metafield Key
                    </label>
                    <input
                      type="text"
                      value={giftRule.metafieldKey}
                      onChange={(e) =>
                        setGiftRule({ ...giftRule, metafieldKey: e.target.value })
                      }
                      className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="_is_gift"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      设置为此 key 的 metafield 值为 "true" 的产品将被识别为赠品
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    单次最大赠品数量
                  </label>
                  <input
                    type="number"
                    value={giftRule.maxGiftsAllowed}
                    onChange={(e) =>
                      setGiftRule({
                        ...giftRule,
                        maxGiftsAllowed: parseInt(e.target.value) || 10,
                      })
                    }
                    className="w-32 px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    min="1"
                    max="100"
                  />
                </div>

                <div className="pt-4 border-t">
                  <button
                    onClick={() => saveData("save_gift_rule", giftRule)}
                    disabled={isSaving}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-200 transition-all disabled:opacity-50"
                  >
                    {isSaving ? "保存中..." : "💾 保存赠品规则"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 活动时间 */}
          {activeTab === "campaign" && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                活动时间设置
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    活动名称
                  </label>
                  <input
                    type="text"
                    value={campaign.name}
                    onChange={(e) =>
                      setCampaign({ ...campaign, name: e.target.value })
                    }
                    className="w-full max-w-md px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="GWP 促销活动"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      开始时间
                    </label>
                    <input
                      type="datetime-local"
                      value={campaign.startTime}
                      onChange={(e) =>
                        setCampaign({ ...campaign, startTime: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      结束时间（留空为无期限）
                    </label>
                    <input
                      type="datetime-local"
                      value={campaign.endTime || ""}
                      onChange={(e) =>
                        setCampaign({ ...campaign, endTime: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => saveData("save_campaign", campaign)}
                    disabled={isSaving}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-purple-200 transition-all disabled:opacity-50"
                  >
                    {isSaving ? "保存中..." : "💾 保存活动时间"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preview Section */}
        <div className="mt-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white">
          <h3 className="text-lg font-bold mb-4">📋 配置预览</h3>
          <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
            <pre className="text-sm overflow-x-auto">
              {JSON.stringify(
                {
                  tiers: tiers.sort((a, b) => a.minAmount - b.minAmount),
                  giftRule,
                  campaign: campaign.endTime
                    ? campaign
                    : { ...campaign, endTime: "无期限" },
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};

export function ErrorBoundary() {
  const error = useRouteError();
  return (
    <div style={{ padding: "20px", color: "red", fontFamily: "sans-serif" }}>
      <h2>Error Loading GWP Config</h2>
      <pre>{error.message || JSON.stringify(error, null, 2)}</pre>
    </div>
  );
}
