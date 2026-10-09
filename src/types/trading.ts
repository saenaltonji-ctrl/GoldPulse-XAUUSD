export type OrderSide = 'BUY' | 'SELL';

export interface Candle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Position {
  id: string;
  symbol: string;
  side: OrderSide;
  lots: number;
  openPrice: number;
  currentPrice: number;
  openTime: number;
  sl: number | null;
  tp: number | null;
  trailingStop: number | null; // distance in pips/points if enabled
  pnl: number;
  pnlPips: number;
  strategyName: string;
}

export interface ClosedTrade {
  id: string;
  symbol: string;
  side: OrderSide;
  lots: number;
  openPrice: number;
  closePrice: number;
  openTime: number;
  closeTime: number;
  sl: number | null;
  tp: number | null;
  pnl: number;
  pnlPips: number;
  closeReason: 'TP_HIT' | 'SL_HIT' | 'MANUAL' | 'TRAILING_STOP' | 'SIGNAL_EXIT' | 'BLUE_PROFIT_TARGET' | 'TRAILING_BLUE' | 'BEP_LOCK';
  strategyName: string;
}

export type StrategyId = 'sniper_99' | 'smart_grid' | 'trend_momentum' | 'ai_confluence';

export interface BotConfig {
  strategyId: StrategyId;
  lotSize: number;
  lotMode: 'fixed' | 'risk_percent';
  riskPercent: number; // e.g. 1% or 2%
  takeProfitPips: number; // e.g. 30 pips ($3.00 on Gold)
  stopLossPips: number; // e.g. 20 pips ($2.00 on Gold)
  useTrailingStop: boolean;
  trailingStopPips: number;
  breakEvenPips: number; // move to BE after X pips
  maxOpenTrades: number;
  confluenceThreshold: number; // 70 to 99%
  maxDailyLossUsd: number;
  dailyProfitTargetUsd: number;
  enableEmergencyProtection: boolean;
  spreadPips: number; // simulated broker spread (e.g. 25 = $0.25)
  // Mode Khusus: Tutup Hanya Saat Profit / Biru
  onlyCloseInProfit: boolean; // Jika aktif, posisi TIDAK PERNAH ditutup dalam keadaan minus/merah
  profitLockBEP: boolean; // Kunci ke profit biru (+2 pips) begitu floating profit tercapai
  minBlueProfitPips: number; // Minimal profit biru sebelum boleh ditutup dinamis (pips)
  // Mode Arah Transaksi: Dua Arah (BUY & SELL)
  tradeDirection: 'BOTH' | 'BUY_ONLY' | 'SELL_ONLY' | 'HEDGING_DUAL'; // BOTH = Beli saat naik & Jual saat turun
}

export interface AccountState {
  initialBalance: number;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  currency: string;
  leverage: number;
}

export interface MarketSignal {
  side: OrderSide;
  confidence: number; // 0 - 100%
  reason: string;
  suggestedSL: number;
  suggestedTP: number;
  timestamp: number;
  indicators: {
    rsi: number;
    emaFast: number;
    emaSlow: number;
    ema200: number;
    trend: 'BULLISH' | 'BEARISH' | 'RANGING';
    fvgDetected: boolean;
    fvgType?: 'BULLISH' | 'BEARISH';
  };
}

export interface BacktestResult {
  strategyId: StrategyId;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  netProfit: number;
  grossProfit: number;
  grossLoss: number;
  profitFactor: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  sharpeRatio: number;
  averageTradeDurationMin: number;
  equityCurve: { time: number; equity: number; balance: number }[];
  trades: ClosedTrade[];
}
