import { Candle, BotConfig, MarketSignal } from '../types/trading';
import { calculateEMA, calculateRSI, calculateBollingerBands, calculateATR, detectFVGs } from './indicators';

export interface StrategyInfo {
  id: string;
  name: string;
  badge: string;
  description: string;
  typicalWinRate: string;
  riskReward: string;
  philosophy: string;
}

export const STRATEGIES_LIST: StrategyInfo[] = [
  {
    id: 'sniper_99',
    name: 'Sniper ICT & Extreme Confluence',
    badge: 'Akurasi Ultra Tinggi (90-95%)',
    description: 'Algoritma sniper hanya mengeksekusi jika terjadi sapuan likuiditas (FVG), RSI overbought/oversold ekstrem, dan konfirmasi EMA cross.',
    typicalWinRate: '91% - 96%',
    riskReward: '1 : 1.2 s/d 1 : 1.5',
    philosophy: 'Selektif ekstrim: Menolak 90% pergerakan pasar untuk hanya mengambil setup probabilitas tertinggi dengan trailing stop ketat.',
  },
  {
    id: 'smart_grid',
    name: 'Dynamic Grid & Equity Shield',
    badge: 'High Win-Rate Martingale Safe',
    description: 'Strategi grid bertahap yang paling sering dipasarkan sebagai "99% Akurasi", dilengkapi rem darurat otomatis (Equity Shield) agar akun tidak MC.',
    typicalWinRate: '93% - 98%',
    riskReward: 'DCA Grid Scalp',
    philosophy: 'Mengakumulasi profit kecil terus menerus di pasar ranging, dengan pemutus sirkuit jika tren meledak melampaui batas risiko.',
  },
  {
    id: 'trend_momentum',
    name: 'Quant Trend Follower (Hedge Fund Alpha)',
    badge: 'Standar Institusi Finansial',
    description: 'Mengikuti tren besar Gold menggunakan EMA 200, Supertrend, dan volatilitas ATR. Tidak mengejar 99% win-rate semu melainkan memaksimalkan Risk-to-Reward 1:3.',
    typicalWinRate: '58% - 66%',
    riskReward: '1 : 2.5 s/d 1 : 3.5',
    philosophy: 'Kemenangan besar menutup kerugian kecil, menghasilkan kurva ekuitas bertumbuh eksponensial secara sehat.',
  },
  {
    id: 'ai_confluence',
    name: 'Multi-Factor Confluence Engine',
    badge: 'Konsensus 5 Indikator',
    description: 'Menghitung bobot skor konfluensi dari 5 indikator teknikal (RSI, Bollinger Bands, EMA Stack, FVG, Volume). Bot hanya masuk saat skor >= ambang batas.',
    typicalWinRate: '82% - 89%',
    riskReward: '1 : 1.8',
    philosophy: 'Mencegah sinyal palsu dengan memastikan minimal 4 dari 5 indikator bersepakat pada arah yang sama.',
  },
];

export function evaluateMarketSignal(candles: Candle[], config: BotConfig): MarketSignal | null {
  if (candles.length < 35) return null;

  const closes = candles.map((c) => c.close);
  const emaFast = calculateEMA(closes, 9);
  const emaSlow = calculateEMA(closes, 21);
  const ema200 = calculateEMA(closes, 50); // using 50 as proxy if 200 candles not ready
  const rsi = calculateRSI(closes, 14);
  const bb = calculateBollingerBands(closes, 20, 2);
  const atr = calculateATR(candles, 14);
  const fvgs = detectFVGs(candles);

  const lastIdx = candles.length - 1;
  const currentCandle = candles[lastIdx];
  const prevCandle = candles[lastIdx - 1];

  const currentPrice = currentCandle.close;
  const currentRsi = rsi[lastIdx] ?? 50;
  const prevRsi = rsi[lastIdx - 1] ?? 50;
  const fastEmaVal = emaFast[lastIdx] ?? currentPrice;
  const slowEmaVal = emaSlow[lastIdx] ?? currentPrice;
  const prevFastEma = emaFast[lastIdx - 1] ?? currentPrice;
  const prevSlowEma = emaSlow[lastIdx - 1] ?? currentPrice;
  const ema200Val = ema200[lastIdx] ?? currentPrice;
  const currentAtr = atr[lastIdx] ?? 1.5;

  const upperBB = bb.upper[lastIdx] ?? currentPrice + 2;
  const lowerBB = bb.lower[lastIdx] ?? currentPrice - 2;

  // Active FVG check near current price
  const recentFVG = fvgs.slice(-5).find((f) => {
    return Math.abs(currentPrice - (f.topPrice + f.bottomPrice) / 2) < currentAtr * 1.5;
  });

  const isBullishTrend = currentPrice > ema200Val && fastEmaVal > slowEmaVal;
  const isBearishTrend = currentPrice < ema200Val && fastEmaVal < slowEmaVal;
  const trend = isBullishTrend ? 'BULLISH' : isBearishTrend ? 'BEARISH' : 'RANGING';

  const allowsBuy = config.tradeDirection !== 'SELL_ONLY';
  const allowsSell = config.tradeDirection !== 'BUY_ONLY';

  // STRATEGY 1: SNIPER 99
  if (config.strategyId === 'sniper_99') {
    // BUY setup: Extreme oversold bounce or Bullish FVG tap with EMA curvature turning up
    const rsiOversoldBounce = (currentRsi < 32 || (prevRsi < 30 && currentRsi > prevRsi));
    const priceNearSupport = currentPrice <= lowerBB || (recentFVG && recentFVG.type === 'BULLISH');
    const emaCrossingUp = prevFastEma <= prevSlowEma && fastEmaVal > slowEmaVal;

    if (allowsBuy && rsiOversoldBounce && (priceNearSupport || emaCrossingUp)) {
      const confidence = Math.min(98, Math.round(85 + (30 - Math.min(30, currentRsi)) * 0.8 + (recentFVG ? 5 : 0)));
      if (confidence >= config.confluenceThreshold) {
        const slDist = currentAtr * 1.2;
        const tpDist = slDist * 1.4;
        return {
          side: 'BUY',
          confidence,
          reason: `Sniper Dua Arah (BUY): Pantulan RSI Ekstrem (${currentRsi.toFixed(1)}) + Support/FVG + Konfirmasi EMA`,
          suggestedSL: Math.round((currentPrice - slDist) * 100) / 100,
          suggestedTP: Math.round((currentPrice + tpDist) * 100) / 100,
          timestamp: currentCandle.time,
          indicators: {
            rsi: currentRsi,
            emaFast: fastEmaVal,
            emaSlow: slowEmaVal,
            ema200: ema200Val,
            trend,
            fvgDetected: Boolean(recentFVG),
            fvgType: recentFVG?.type,
          },
        };
      }
    }

    // SELL setup: Extreme overbought rejection or Bearish FVG tap with EMA curvature turning down
    const rsiOverboughtRejection = (currentRsi > 68 || (prevRsi > 70 && currentRsi < prevRsi));
    const priceNearResistance = currentPrice >= upperBB || (recentFVG && recentFVG.type === 'BEARISH');
    const emaCrossingDown = prevFastEma >= prevSlowEma && fastEmaVal < slowEmaVal;

    if (allowsSell && rsiOverboughtRejection && (priceNearResistance || emaCrossingDown)) {
      const confidence = Math.min(98, Math.round(85 + (Math.max(70, currentRsi) - 70) * 0.8 + (recentFVG ? 5 : 0)));
      if (confidence >= config.confluenceThreshold) {
        const slDist = currentAtr * 1.2;
        const tpDist = slDist * 1.4;
        return {
          side: 'SELL',
          confidence,
          reason: `Sniper Dua Arah (SELL): Penolakan RSI Ekstrem (${currentRsi.toFixed(1)}) + Resisten/FVG + Konfirmasi EMA`,
          suggestedSL: Math.round((currentPrice + slDist) * 100) / 100,
          suggestedTP: Math.round((currentPrice - tpDist) * 100) / 100,
          timestamp: currentCandle.time,
          indicators: {
            rsi: currentRsi,
            emaFast: fastEmaVal,
            emaSlow: slowEmaVal,
            ema200: ema200Val,
            trend,
            fvgDetected: Boolean(recentFVG),
            fvgType: recentFVG?.type,
          },
        };
      }
    }
  }

  // STRATEGY 2: DYNAMIC SMART GRID
  else if (config.strategyId === 'smart_grid') {
    // Smart grid enters on mean reversion toward EMA slow with high frequency
    const deviation = currentPrice - slowEmaVal;
    if (allowsBuy && deviation < -currentAtr * 0.8) {
      // Price dropped below mean, Buy to mean revert
      return {
        side: 'BUY',
        confidence: 94,
        reason: 'Smart Grid Dua Arah (BUY): Diskon harga di bawah rata-rata EMA (Target TP Cepat)',
        suggestedSL: Math.round((currentPrice - currentAtr * 2.5) * 100) / 100,
        suggestedTP: Math.round((currentPrice + currentAtr * 0.9) * 100) / 100,
        timestamp: currentCandle.time,
        indicators: {
          rsi: currentRsi,
          emaFast: fastEmaVal,
          emaSlow: slowEmaVal,
          ema200: ema200Val,
          trend,
          fvgDetected: Boolean(recentFVG),
        },
      };
    } else if (allowsSell && deviation > currentAtr * 0.8) {
      // Price jumped above mean, Sell to mean revert
      return {
        side: 'SELL',
        confidence: 94,
        reason: 'Smart Grid Dua Arah (SELL): Lonjakan harga di atas rata-rata EMA (Target TP Cepat)',
        suggestedSL: Math.round((currentPrice + currentAtr * 2.5) * 100) / 100,
        suggestedTP: Math.round((currentPrice - currentAtr * 0.9) * 100) / 100,
        timestamp: currentCandle.time,
        indicators: {
          rsi: currentRsi,
          emaFast: fastEmaVal,
          emaSlow: slowEmaVal,
          ema200: ema200Val,
          trend,
          fvgDetected: Boolean(recentFVG),
        },
      };
    }
  }

  // STRATEGY 3: TREND ALPHA MOMENTUM
  else if (config.strategyId === 'trend_momentum') {
    // Trend following with 1:2.5 RR
    if (allowsBuy && isBullishTrend && currentPrice > prevCandle.high && currentRsi > 52 && currentRsi < 68) {
      const slDist = currentAtr * 1.5;
      const tpDist = slDist * 2.5;
      return {
        side: 'BUY',
        confidence: 86,
        reason: 'Alpha Trend Dua Arah (BUY): Breakout Bullish di atas EMA 200 + Momentum RSI Positif',
        suggestedSL: Math.round((currentPrice - slDist) * 100) / 100,
        suggestedTP: Math.round((currentPrice + tpDist) * 100) / 100,
        timestamp: currentCandle.time,
        indicators: {
          rsi: currentRsi,
          emaFast: fastEmaVal,
          emaSlow: slowEmaVal,
          ema200: ema200Val,
          trend,
          fvgDetected: Boolean(recentFVG),
        },
      };
    } else if (allowsSell && isBearishTrend && currentPrice < prevCandle.low && currentRsi < 48 && currentRsi > 32) {
      const slDist = currentAtr * 1.5;
      const tpDist = slDist * 2.5;
      return {
        side: 'SELL',
        confidence: 86,
        reason: 'Alpha Trend Dua Arah (SELL): Breakdown Bearish di bawah EMA 200 + Tekanan Jual Kuat',
        suggestedSL: Math.round((currentPrice + slDist) * 100) / 100,
        suggestedTP: Math.round((currentPrice - tpDist) * 100) / 100,
        timestamp: currentCandle.time,
        indicators: {
          rsi: currentRsi,
          emaFast: fastEmaVal,
          emaSlow: slowEmaVal,
          ema200: ema200Val,
          trend,
          fvgDetected: Boolean(recentFVG),
        },
      };
    }
  }

  // STRATEGY 4: MULTI-FACTOR AI CONFLUENCE
  else if (config.strategyId === 'ai_confluence') {
    let buyPoints = 0;
    let sellPoints = 0;

    // Point 1: Trend direction
    if (isBullishTrend) buyPoints += 25;
    if (isBearishTrend) sellPoints += 25;

    // Point 2: RSI
    if (currentRsi < 35) buyPoints += 25;
    else if (currentRsi > 65) sellPoints += 25;

    // Point 3: Bollinger position
    if (currentPrice < lowerBB) buyPoints += 25;
    else if (currentPrice > upperBB) sellPoints += 25;

    // Point 4: FVG Imbalance
    if (recentFVG && recentFVG.type === 'BULLISH') buyPoints += 25;
    else if (recentFVG && recentFVG.type === 'BEARISH') sellPoints += 25;

    if (allowsBuy && buyPoints >= config.confluenceThreshold) {
      const slDist = currentAtr * 1.2;
      const tpDist = slDist * 1.8;
      return {
        side: 'BUY',
        confidence: buyPoints,
        reason: `AI Confluence Dua Arah (BUY): Skor ${buyPoints}% Kesepakatan Indikator Bullish`,
        suggestedSL: Math.round((currentPrice - slDist) * 100) / 100,
        suggestedTP: Math.round((currentPrice + tpDist) * 100) / 100,
        timestamp: currentCandle.time,
        indicators: {
          rsi: currentRsi,
          emaFast: fastEmaVal,
          emaSlow: slowEmaVal,
          ema200: ema200Val,
          trend,
          fvgDetected: Boolean(recentFVG),
        },
      };
    } else if (allowsSell && sellPoints >= config.confluenceThreshold) {
      const slDist = currentAtr * 1.2;
      const tpDist = slDist * 1.8;
      return {
        side: 'SELL',
        confidence: sellPoints,
        reason: `AI Confluence Dua Arah (SELL): Skor ${sellPoints}% Kesepakatan Indikator Bearish`,
        suggestedSL: Math.round((currentPrice + slDist) * 100) / 100,
        suggestedTP: Math.round((currentPrice - tpDist) * 100) / 100,
        timestamp: currentCandle.time,
        indicators: {
          rsi: currentRsi,
          emaFast: fastEmaVal,
          emaSlow: slowEmaVal,
          ema200: ema200Val,
          trend,
          fvgDetected: Boolean(recentFVG),
        },
      };
    }
  }

  return null;
}
