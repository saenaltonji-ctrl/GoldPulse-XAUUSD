import { Candle } from '../types/trading';

export const INITIAL_GOLD_PRICE = 2684.50;

/**
 * Generates initial realistic historical candles for XAUUSD (Gold)
 */
export function generateInitialGoldCandles(count = 120, timeframeSec = 60, startPrice = INITIAL_GOLD_PRICE): Candle[] {
  const candles: Candle[] = [];
  const now = Math.floor(Date.now() / 1000);
  let currentClose = startPrice;

  // Generate historical backwards then reverse
  const startTime = now - count * timeframeSec;

  for (let i = 0; i < count; i++) {
    const candleTime = startTime + i * timeframeSec;
    // Gold volatility: 0.8 - 2.5 per candle on M1/M5
    const volatility = 0.6 + Math.random() * 1.8;
    // Micro trend bias (sine wave + random walk)
    const trendComponent = Math.sin(i / 15) * 0.4;
    const randomShift = (Math.random() - 0.49) * volatility + trendComponent;

    const open = Math.round(currentClose * 100) / 100;
    const close = Math.round((open + randomShift) * 100) / 100;
    const wickHigh = Math.random() * 1.2;
    const wickLow = Math.random() * 1.2;
    const high = Math.round((Math.max(open, close) + wickHigh) * 100) / 100;
    const low = Math.round((Math.min(open, close) - wickLow) * 100) / 100;
    const volume = Math.floor(400 + Math.random() * 1200);

    candles.push({
      time: candleTime,
      open,
      high,
      low,
      close,
      volume,
    });

    currentClose = close;
  }

  return candles;
}

/**
 * Generates next tick price for Gold
 */
export function generateGoldTick(currentPrice: number, trendBias = 0): {
  bid: number;
  ask: number;
  last: number;
  spread: number;
} {
  // Gold tick size standard: 0.01
  const spreadPoints = 0.25; // standard gold raw spread $0.25 (25 points)
  // Volatility jump: brownian motion with occasional jump process
  const isSpike = Math.random() < 0.04;
  const delta = isSpike
    ? (Math.random() - 0.48) * 0.95
    : (Math.random() - 0.495) * 0.22 + trendBias * 0.05;

  const nextPrice = Math.max(1000, Math.round((currentPrice + delta) * 100) / 100);
  const bid = nextPrice;
  const ask = Math.round((nextPrice + spreadPoints) * 100) / 100;

  return {
    bid,
    ask,
    last: nextPrice,
    spread: spreadPoints,
  };
}
