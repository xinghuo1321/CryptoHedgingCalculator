import { format, addHours } from 'date-fns';

export interface BinancePrice {
  symbol: string;
  price: string;
}

export interface KLine {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
}

export interface MarketMetrics {
  btcPrice: number;
  ethPrice: number;
  btcVol: number;
  ethVol: number;
  correlation: number;
  beta: number;
  lastUpdated: Date;
  nextUpdate: Date;
}

const BINANCE_API = 'https://api.binance.com/api/v3';

async function fetchKLines(symbol: string, limit: number = 31): Promise<number[]> {
  const response = await fetch(`${BINANCE_API}/klines?symbol=${symbol}&interval=1d&limit=${limit}`);
  if (!response.ok) throw new Error(`Failed to fetch K-lines for ${symbol}`);
  const data = await response.json();
  // Index 4 is close price
  return data.map((d: any) => parseFloat(d[4]));
}

async function fetchCurrentPrice(symbol: string): Promise<number> {
  const response = await fetch(`${BINANCE_API}/ticker/price?symbol=${symbol}`);
  if (!response.ok) throw new Error(`Failed to fetch price for ${symbol}`);
  const data = await response.json();
  return parseFloat(data.price);
}

function calculateReturns(prices: number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  return returns;
}

function calculateStdDev(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denX = 0;
  let denY = 0;
  
  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    numerator += diffX * diffY;
    denX += diffX * diffX;
    denY += diffY * diffY;
  }
  
  return numerator / Math.sqrt(denX * denY);
}

export async function getMarketMetrics(): Promise<MarketMetrics> {
  const [btcPrices, ethPrices, btcCurrent, ethCurrent] = await Promise.all([
    fetchKLines('BTCUSDT'),
    fetchKLines('ETHUSDT'),
    fetchCurrentPrice('BTCUSDT'),
    fetchCurrentPrice('ETHUSDT'),
  ]);

  const btcReturns = calculateReturns(btcPrices);
  const ethReturns = calculateReturns(ethPrices);

  // Annualized Volatility (30-day based)
  const btcVol = calculateStdDev(btcReturns) * Math.sqrt(365);
  const ethVol = calculateStdDev(ethReturns) * Math.sqrt(365);

  // Correlation
  const correlation = calculateCorrelation(btcReturns, ethReturns);

  // Beta = ρ * (ETH_Vol / BTC_Vol)
  const beta = correlation * (ethVol / btcVol);

  const now = new Date();
  return {
    btcPrice: btcCurrent,
    ethPrice: ethCurrent,
    btcVol,
    ethVol,
    correlation,
    beta,
    lastUpdated: now,
    nextUpdate: addHours(now, 1),
  };
}
