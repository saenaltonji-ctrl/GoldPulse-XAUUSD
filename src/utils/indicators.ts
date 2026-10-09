import { Candle } from '../types/trading';

/**
 * Calculates Exponential Moving Average (EMA)
 */
export function calculateEMA(data: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(data.length).fill(null);
  if (data.length < period) return result;

  // Simple Moving Average for initial value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  let prevEMA = sum / period;
  result[period - 1] = prevEMA;

  const multiplier = 2 / (period + 1);
  for (let i = period; i < data.length; i++) {
    const currentEMA = (data[i] - prevEMA) * multiplier + prevEMA;
    result[i] = currentEMA;
    prevEMA = currentEMA;
  }
  return result;
}

/**
 * Calculates Relative Strength Index (RSI)
 */
export function calculateRSI(closes: number[], period = 14): (number | null)[] {
  const result: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length <= period) return result;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change >= 0) gains += change;
    else losses += Math.abs(change);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  result[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      result[i] = 100;
    } else {
      const rs = avgGain / avgLoss;
      result[i] = 100 - 100 / (1 + rs);
    }
  }

  return result;
}

/**
 * Calculates Bollinger Bands (period 20, multiplier 2)
 */
export function calculateBollingerBands(
  closes: number[],
  period = 20,
  multiplier = 2
): { middle: (number | null)[]; upper: (number | null)[]; lower: (number | null)[] } {
  const middle: (number | null)[] = new Array(closes.length).fill(null);
  const upper: (number | null)[] = new Array(closes.length).fill(null);
  const lower: (number | null)[] = new Array(closes.length).fill(null);

  for (let i = period - 1; i < closes.length; i++) {
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    middle[i] = mean;
    upper[i] = mean + multiplier * stdDev;
    lower[i] = mean - multiplier * stdDev;
  }

  return { middle, upper, lower };
}

/**
 * Calculates Average True Range (ATR)
 */
export function calculateATR(candles: Candle[], period = 14): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  if (candles.length <= period) return result;

  const trs: number[] = [candles[0].high - candles[0].low];
  for (let i = 1; i < candles.length; i++) {
    const hl = candles[i].high - candles[i].low;
    const hpc = Math.abs(candles[i].high - candles[i - 1].close);
    const lpc = Math.abs(candles[i].low - candles[i - 1].close);
    trs.push(Math.max(hl, hpc, lpc));
  }

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += trs[i];
  }
  let prevATR = sum / period;
  result[period - 1] = prevATR;

  for (let i = period; i < candles.length; i++) {
    prevATR = (prevATR * (period - 1) + trs[i]) / period;
    result[i] = prevATR;
  }

  return result;
}

/**
 * Detects Fair Value Gaps (FVG) - ICT Smart Money Concept
 * A 3-candle imbalance pattern on Gold
 */
export interface FVGZone {
  index: number;
  type: 'BULLISH' | 'BEARISH';
  topPrice: number;
  bottomPrice: number;
}

export function detectFVGs(candles: Candle[]): FVGZone[] {
  const fvgs: FVGZone[] = [];
  if (candles.length < 3) return fvgs;

  for (let i = 2; i < candles.length; i++) {
    const c0 = candles[i - 2];
    const c2 = candles[i];

    // Bullish FVG: candle 0 High < candle 2 Low
    if (c2.low > c0.high) {
      fvgs.push({
        index: i - 1,
        type: 'BULLISH',
        topPrice: c2.low,
        bottomPrice: c0.high,
      });
    }
    // Bearish FVG: candle 0 Low > candle 2 High
    else if (c2.high < c0.low) {
      fvgs.push({
        index: i - 1,
        type: 'BEARISH',
        topPrice: c0.low,
        bottomPrice: c2.high,
      });
    }
  }

  return fvgs;
}
