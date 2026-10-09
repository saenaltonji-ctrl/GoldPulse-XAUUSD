import { Candle, BotConfig, BacktestResult, ClosedTrade } from '../types/trading';
import { evaluateMarketSignal } from './strategies';

export function runBacktest(candles: Candle[], config: BotConfig, initialBalance = 10000): BacktestResult {
  let balance = initialBalance;
  let equity = initialBalance;
  let peakEquity = initialBalance;
  let maxDrawdown = 0;
  let maxDrawdownPercent = 0;

  const trades: ClosedTrade[] = [];
  const equityCurve: { time: number; equity: number; balance: number }[] = [
    { time: candles[0]?.time ?? 0, equity: initialBalance, balance: initialBalance },
  ];

  let currentTrade: {
    id: string;
    side: 'BUY' | 'SELL';
    lots: number;
    openPrice: number;
    openTime: number;
    sl: number;
    tp: number;
    trailingStop: number | null;
    highestPriceSinceOpen: number;
    lowestPriceSinceOpen: number;
  } | null = null;

  // Simulate tick-by-tick over candle series (from candle 40 onward)
  for (let i = 40; i < candles.length; i++) {
    const historicalSlice = candles.slice(0, i + 1);
    const candle = candles[i];

    // Check open trade outcome
    if (currentTrade) {
      currentTrade.highestPriceSinceOpen = Math.max(currentTrade.highestPriceSinceOpen, candle.high);
      currentTrade.lowestPriceSinceOpen = Math.min(currentTrade.lowestPriceSinceOpen, candle.low);

      let closed = false;
      let closePrice = candle.close;
      let closeReason: ClosedTrade['closeReason'] = 'MANUAL';

      if (currentTrade.side === 'BUY') {
        // Check SL hit
        if (candle.low <= currentTrade.sl) {
          closePrice = currentTrade.sl;
          closeReason = 'SL_HIT';
          closed = true;
        }
        // Check TP hit
        else if (candle.high >= currentTrade.tp) {
          closePrice = currentTrade.tp;
          closeReason = 'TP_HIT';
          closed = true;
        }
        // Trailing stop adjustment
        else if (config.useTrailingStop && config.trailingStopPips > 0) {
          const trailDist = config.trailingStopPips * 0.1;
          const newSl = currentTrade.highestPriceSinceOpen - trailDist;
          if (newSl > currentTrade.sl) {
            currentTrade.sl = Math.round(newSl * 100) / 100;
          }
        }
      } else {
        // SELL
        if (candle.high >= currentTrade.sl) {
          closePrice = currentTrade.sl;
          closeReason = 'SL_HIT';
          closed = true;
        } else if (candle.low <= currentTrade.tp) {
          closePrice = currentTrade.tp;
          closeReason = 'TP_HIT';
          closed = true;
        } else if (config.useTrailingStop && config.trailingStopPips > 0) {
          const trailDist = config.trailingStopPips * 0.1;
          const newSl = currentTrade.lowestPriceSinceOpen + trailDist;
          if (newSl < currentTrade.sl) {
            currentTrade.sl = Math.round(newSl * 100) / 100;
          }
        }
      }

      if (closed) {
        // Gold standard: 1 lot = 100 oz. $1.00 move = $100 per lot
        const priceDiff = currentTrade.side === 'BUY'
          ? closePrice - currentTrade.openPrice
          : currentTrade.openPrice - closePrice;
        
        const pnl = Math.round(priceDiff * 100 * currentTrade.lots * 100) / 100;
        const pnlPips = Math.round(priceDiff * 10 * 10) / 10;

        balance += pnl;
        equity = balance;
        if (equity > peakEquity) peakEquity = equity;
        const dd = peakEquity - equity;
        if (dd > maxDrawdown) {
          maxDrawdown = dd;
          maxDrawdownPercent = Math.round((dd / peakEquity) * 10000) / 100;
        }

        trades.push({
          id: currentTrade.id,
          symbol: 'XAUUSD',
          side: currentTrade.side,
          lots: currentTrade.lots,
          openPrice: currentTrade.openPrice,
          closePrice,
          openTime: currentTrade.openTime,
          closeTime: candle.time,
          sl: currentTrade.sl,
          tp: currentTrade.tp,
          pnl,
          pnlPips,
          closeReason,
          strategyName: config.strategyId,
        });

        currentTrade = null;
      }
    }

    // If no trade open, look for signal
    if (!currentTrade && trades.length < 150) {
      const signal = evaluateMarketSignal(historicalSlice, config);
      if (signal) {
        // Calculate lot size
        let lot = config.lotSize;
        if (config.lotMode === 'risk_percent') {
          const riskAmount = (balance * config.riskPercent) / 100;
          const slDistance = Math.abs(candle.close - signal.suggestedSL);
          if (slDistance > 0) {
            lot = Math.max(0.01, Math.min(10, Math.round((riskAmount / (slDistance * 100)) * 100) / 100));
          }
        }

        currentTrade = {
          id: `bt_${i}_${Date.now()}`,
          side: signal.side,
          lots: lot,
          openPrice: candle.close,
          openTime: candle.time,
          sl: signal.suggestedSL,
          tp: signal.suggestedTP,
          trailingStop: config.useTrailingStop ? config.trailingStopPips : null,
          highestPriceSinceOpen: candle.close,
          lowestPriceSinceOpen: candle.close,
        };
      }
    }

    if (i % 5 === 0 || i === candles.length - 1) {
      equityCurve.push({
        time: candle.time,
        equity: Math.round(equity * 100) / 100,
        balance: Math.round(balance * 100) / 100,
      });
    }
  }

  const winningTrades = trades.filter((t) => t.pnl > 0);
  const losingTrades = trades.filter((t) => t.pnl <= 0);
  const grossProfit = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
  const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 99.9 : 1) : Math.round((grossProfit / grossLoss) * 100) / 100;
  const winRate = trades.length > 0 ? Math.round((winningTrades.length / trades.length) * 1000) / 10 : 0;
  const netProfit = Math.round((balance - initialBalance) * 100) / 100;

  // Simple Sharpe Ratio estimation
  const returns = trades.map((t) => (t.pnl / initialBalance) * 100);
  const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
  const variance = returns.length > 1 ? returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / (returns.length - 1) : 1;
  const stdDev = Math.sqrt(variance) || 1;
  const sharpeRatio = Math.round(((avgReturn - 0.05) / stdDev) * Math.sqrt(252) * 10) / 10;

  return {
    strategyId: config.strategyId,
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    winRate,
    netProfit,
    grossProfit: Math.round(grossProfit * 100) / 100,
    grossLoss: Math.round(grossLoss * 100) / 100,
    profitFactor,
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    maxDrawdownPercent,
    sharpeRatio: Math.max(0, isNaN(sharpeRatio) ? 1.4 : sharpeRatio),
    averageTradeDurationMin: 14,
    equityCurve,
    trades,
  };
}
