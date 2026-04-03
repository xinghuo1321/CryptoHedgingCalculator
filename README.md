# Crypto Hedging Calculator (BTC/ETH) 🚀

一个基于波动率（Beta）的专业加密货币对冲计算工具，专为 BTC 和 ETH 交易员设计。通过实时获取币安（Binance）市场数据，自动计算最优对冲仓位，帮助您在波动市场中有效管理风险。

![License](https://img.shields.io/badge/license-Apache--2.0-blue)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.0-38B2AC?logo=tailwind-css)

## 🌟 核心功能

- **实时市场数据**：直接对接币安 API，获取 BTCUSDT 和 ETHUSDT 的实时价格。
- **动态波动率分析**：自动获取过去 30 天的 K 线数据，实时计算年化波动率（σ）和相关系数（ρ）。
- **Beta 对冲策略**：采用专业公式 `Beta = ρ × (ETH σ / BTC σ)`，精准计算资产敏感度。
- **双向对冲模式**：
  - **Hold ETH / Short BTC**：持有 ETH 时，计算对冲所需的 BTC 空单数量。
  - **Hold BTC / Short ETH**：持有 BTC 时，计算对冲所需的 ETH 空单数量。
- **多单位输入**：支持以 **USD（美元价值）** 或 **COIN（代币数量）** 作为输入基准。
- **自动化更新**：每小时自动刷新指标，支持手动“立即更新”。
- **响应式设计**：完美适配桌面与移动端，提供深色金融终端风格 UI。

## 🧪 核心公式

本工具严格遵循以下对冲逻辑：

1. **Beta 系数**：
   $$Beta = Correlation(BTC, ETH) \times \frac{Volatility(ETH)}{Volatility(BTC)}$$
2. **对冲仓位**：
   - **ETH -> BTC**: $Short\_BTC = \frac{ETH\_Value \times Beta}{BTC\_Price}$
   - **BTC -> ETH**: $Short\_ETH = \frac{BTC\_Value / Beta}{ETH\_Price}$

## 🛠️ 技术栈

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS 4.0
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Data Fetching**: Binance Public API

## 🚀 快速开始

### 本地运行

1. **克隆仓库**
   ```bash
   git clone https://github.com/your-username/crypto-hedging-calculator.git
   cd crypto-hedging-calculator
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **构建生产版本**
   ```bash
   npm run build
   ```

### 部署到 Cloudflare Pages

1. 将代码推送至 GitHub。
2. 在 Cloudflare 控制台创建新项目，连接至该仓库。
3. 设置构建命令为 `npm run build`，输出目录为 `dist`。
4. 保存并部署。

## 📝 免责声明

本工具仅供参考和教育目的。加密货币交易具有高风险，对冲策略并不能完全消除损失。在进行任何真实交易之前，请务必进行充分的风险评估。作者不对因使用本工具导致的任何财务损失负责。

## 📄 开源协议

本项目采用 [Apache-2.0](LICENSE) 协议开源。
