# GWP (Gift With Purchase) 应用

基于 Shopify CLI 3.x + React Router 7 的多阶梯购物车赠品全栈应用。

## 功能特性

- 🎁 **多阶梯赠品配置**：根据购物车金额自动匹配赠品额度
- 💰 **精确价值扣减**：从低到高排序赠品，确保免单金额不超额度
- 🎨 **精美前端UI**：React + Tailwind CSS 美观界面
- ⚡ **实时进度条**：购物车页面显示赠品进度
- 🔧 **灵活配置**：支持标签/Metafield 识别赠品

## 阶梯规则 (USD)

| 消费满 | 赠品额度 |
|--------|----------|
| $39 | $20 |
| $59 | $30 |
| $79 | $40 |
| $99 | $50 |
| $119 | $70 |
| $139 | $100 |
| $159 | $120 |

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 填写 SHOPIFY_API_KEY 等
```

### 3. 数据库迁移

```bash
npm run db:migrate
```

### 4. 启动开发服务器

```bash
npm run dev
```

## 项目结构

```
├── app/
│   ├── lib/
│   │   ├── gwp-config.server.js   # GWP 配置服务
│   │   └── functions.server.js    # Shopify Admin API
│   ├── routes/
│   │   ├── app.gwp-config.jsx     # GWP 配置页面
│   │   └── app.gwp-config.$action.jsx  # API 路由
│   └── root.jsx
├── extensions/
│   ├── cart-discount-function/    # Shopify Function
│   │   └── src/run.ts            # 核心算法
│   └── gwp-progress-widget/      # Theme App Extension
└── prisma/
    └── schema.prisma             # 数据库模型
```

## 核心算法说明

### run.js 价值扣减逻辑

```javascript
// 1. 分离购物车
const giftLines = cart.lines.filter(isGiftLine);
const regularLines = cart.lines.filter(line => !isGiftLine);

// 2. 计算正价总额
const subtotal = regularLines.reduce((sum, line) => 
  sum + parseFloat(line.price.amount) * line.quantity, 0);

// 3. 匹配阶梯获取额度
const allowedValue = getTierBySubtotal(subtotal, tiers);

// 4. 价值扣减（从低到高）
giftLines.sort((a, b) => a.price - b.price);
let usedValue = 0;
const targets = [];

for (const line of giftLines) {
  const remaining = allowedValue - usedValue;
  // Math.floor 确保不会超额度
  const affordableQty = Math.floor(remaining / line.price);
  const actualQty = Math.min(line.quantity, affordableQty);
  
  if (actualQty > 0) {
    targets.push({ quantity: actualQty, lineId: line.id });
    usedValue += line.price * actualQty;
  }
}

// 5. 返回 100% 折扣
return { targets, discountPercentage: 100 };
```

## 使用指南

### 配置赠品

1. 在 Shopify 后台打开应用
2. 进入 `GWP Config` 页面
3. 设置阶梯配置、赠品规则、活动时间
4. 保存后配置会自动同步到 Shopify Metafield

### 标记赠品

两种方式可选：

**方式一：产品标签**
- 给产品添加标签 `is_free_gift`（可在配置中修改）

**方式二：Metafield**
- 设置产品的 metafield：`_is_gift: "true"`

### 测试

1. 将赠品加入购物车
2. 添加正价商品达到阶梯金额
3. 结账时赠品将自动享受 100% 折扣

## 技术栈

- **前端框架**: React Router 7 (Remix)
- **UI 组件**: Tailwind CSS + Polaris
- **后端**: Node.js + Prisma
- **Shopify**: Shopify Functions + Theme App Extension
- **数据库**: SQLite (开发) / PostgreSQL (生产)
