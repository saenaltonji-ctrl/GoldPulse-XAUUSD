import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Candle,
  Position,
  ClosedTrade,
  AccountState,
  BotConfig,
  OrderSide,
} from './types/trading';
import { generateInitialGoldCandles, generateGoldTick } from './utils/marketGenerator';
import { evaluateMarketSignal } from './utils/strategies';
import { playSound } from './utils/audio';

import { TopNav } from './components/TopNav';
import { TradingChart } from './components/TradingChart';
import { AccountOverview } from './components/AccountOverview';
import { BotControlPanel } from './components/BotControlPanel';
import { PositionsTable } from './components/PositionsTable';
import { BacktestView } from './components/BacktestView';
import { AccuracyMasterclass } from './components/AccuracyMasterclass';
import { CodeExportView } from './components/CodeExportView';

export default function App() {
  const [activeTab, setActiveTab] = useState<'terminal' | 'backtest' | 'config' | 'masterclass' | 'export'>('terminal');

  // Market & Candlestick State
  const [candles, setCandles] = useState<Candle[]>(() => generateInitialGoldCandles(150, 60));
  const [currentBid, setCurrentBid] = useState<number>(2684.50);
  const [currentAsk, setCurrentAsk] = useState<number>(2684.75);
  const [timeframe, setTimeframe] = useState<'M1' | 'M5' | 'M15' | 'H1'>('M1');

  // Account State
  const [account, setAccount] = useState<AccountState>({
    initialBalance: 10000,
    balance: 10000,
    equity: 10000,
    margin: 0,
    freeMargin: 10000,
    marginLevel: 0,
    currency: 'USD',
    leverage: 500,
  });

  // Trading Positions
  const [openPositions, setOpenPositions] = useState<Position[]>([]);
  const [closedTrades, setClosedTrades] = useState<ClosedTrade[]>([]);

  // Bot & Execution Config
  const [isAutoTrading, setIsAutoTrading] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(5);
  const [config, setConfig] = useState<BotConfig>({
    strategyId: 'sniper_99',
    lotSize: 0.10,
    lotMode: 'fixed',
    riskPercent: 1.5,
    takeProfitPips: 25,
    stopLossPips: 20,
    useTrailingStop: true,
    trailingStopPips: 15,
    breakEvenPips: 10,
    maxOpenTrades: 3,
    confluenceThreshold: 88,
    maxDailyLossUsd: 300,
    dailyProfitTargetUsd: 1000,
    enableEmergencyProtection: true,
    spreadPips: 25,
    onlyCloseInProfit: true, // WAJIB: Dilarang menutup posisi saat rugi (Hanya tutup saat profit biru)
    profitLockBEP: true, // Kunci ke profit biru begitu mencapai BEP
    minBlueProfitPips: 15, // Target profit biru yang banyak
    tradeDirection: 'BOTH', // Keuntungan Dua Arah (BUY saat naik & SELL saat turun)
  });

  // References for live tick interval
  const candlesRef = useRef(candles);
  candlesRef.current = candles;
  const currentBidRef = useRef(currentBid);
  currentBidRef.current = currentBid;
  const currentAskRef = useRef(currentAsk);
  currentAskRef.current = currentAsk;
  const openPositionsRef = useRef(openPositions);
  openPositionsRef.current = openPositions;
  const configRef = useRef(config);
  configRef.current = config;
  const isAutoTradingRef = useRef(isAutoTrading);
  isAutoTradingRef.current = isAutoTrading;
  const accountRef = useRef(account);
  accountRef.current = account;

  const lastSignalTimeRef = useRef<number>(0);

  // Manual & Auto Trade Execution Handler
  const openNewPosition = useCallback((side: OrderSide, reason = 'Manual Order') => {
    const curBid = currentBidRef.current;
    const curAsk = currentAskRef.current;
    const cfg = configRef.current;
    const openPrice = side === 'BUY' ? curAsk : curBid;

    const tpOffset = cfg.takeProfitPips * 0.1; // e.g. 25 pips = $2.50
    const slOffset = cfg.stopLossPips * 0.1; // e.g. 20 pips = $2.00

    const tp = side === 'BUY' ? openPrice + tpOffset : openPrice - tpOffset;
    const sl = side === 'BUY' ? openPrice - slOffset : openPrice + slOffset;

    const newPos: Position = {
      id: `GP_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      symbol: 'XAUUSD',
      side,
      lots: cfg.lotSize,
      openPrice: Math.round(openPrice * 100) / 100,
      currentPrice: openPrice,
      openTime: Math.floor(Date.now() / 1000),
      sl: Math.round(sl * 100) / 100,
      tp: Math.round(tp * 100) / 100,
      trailingStop: cfg.useTrailingStop ? cfg.trailingStopPips : null,
      pnl: 0,
      pnlPips: 0,
      strategyName: reason,
    };

    setOpenPositions((prev) => [...prev, newPos]);
    playSound('order_open');
  }, []);

  // Close Individual Position
  const closePosition = useCallback((id: string, reason: ClosedTrade['closeReason'] = 'MANUAL') => {
    setOpenPositions((prev) => {
      const target = prev.find((p) => p.id === id);
      if (!target) return prev;

      const closePrice = target.side === 'BUY' ? currentBidRef.current : currentAskRef.current;
      const priceDiff = target.side === 'BUY' ? closePrice - target.openPrice : target.openPrice - closePrice;
      const pnl = Math.round(priceDiff * 100 * target.lots * 100) / 100;
      const pnlPips = Math.round(priceDiff * 10 * 10) / 10;

      const closedTrade: ClosedTrade = {
        id: target.id,
        symbol: target.symbol,
        side: target.side,
        lots: target.lots,
        openPrice: target.openPrice,
        closePrice,
        openTime: target.openTime,
        closeTime: Math.floor(Date.now() / 1000),
        sl: target.sl,
        tp: target.tp,
        pnl,
        pnlPips,
        closeReason: reason,
        strategyName: target.strategyName,
      };

      setClosedTrades((history) => [...history, closedTrade]);

      // Update balance
      setAccount((acc) => {
        const nextBalance = acc.balance + pnl;
        return {
          ...acc,
          balance: nextBalance,
          equity: nextBalance,
        };
      });

      if (pnl > 0) playSound('take_profit');
      else playSound('stop_loss');

      return prev.filter((p) => p.id !== id);
    });
  }, []);

  // Close All Positions
  const closeAllPositions = useCallback(() => {
    openPositionsRef.current.forEach((pos) => {
      closePosition(pos.id, 'MANUAL');
    });
  }, [closePosition]);

  // Reset Account Demo
  const resetAccount = useCallback(() => {
    setOpenPositions([]);
    setClosedTrades([]);
    setAccount({
      initialBalance: 10000,
      balance: 10000,
      equity: 10000,
      margin: 0,
      freeMargin: 10000,
      marginLevel: 0,
      currency: 'USD',
      leverage: 500,
    });
    playSound('click');
  }, []);

  // Central Tick Simulation Loop
  useEffect(() => {
    const tickIntervalMs = Math.max(25, Math.floor(1000 / speed));

    const interval = setInterval(() => {
      const prevBid = currentBidRef.current;
      const nextTick = generateGoldTick(prevBid);
      const newBid = nextTick.bid;
      const newAsk = nextTick.ask;

      setCurrentBid(newBid);
      setCurrentAsk(newAsk);

      // 1. Update current candle or spawn new candle
      setCandles((oldCandles) => {
        if (oldCandles.length === 0) return oldCandles;
        const lastCandle = oldCandles[oldCandles.length - 1];
        const nowSec = Math.floor(Date.now() / 1000);

        const tfSeconds = timeframe === 'M1' ? 60 : timeframe === 'M5' ? 300 : timeframe === 'M15' ? 900 : 3600;
        const candleAge = nowSec - lastCandle.time;

        if (candleAge >= tfSeconds) {
          // New Candle
          const newCandle: Candle = {
            time: nowSec,
            open: newBid,
            high: Math.max(newBid, newAsk),
            low: Math.min(newBid, newAsk),
            close: newBid,
            volume: 25,
          };
          return [...oldCandles.slice(-180), newCandle];
        } else {
          // Update forming candle
          const updated: Candle = {
            ...lastCandle,
            high: Math.max(lastCandle.high, newBid),
            low: Math.min(lastCandle.low, newBid),
            close: newBid,
            volume: lastCandle.volume + 1,
          };
          return [...oldCandles.slice(0, -1), updated];
        }
      });

      // 2. Update Positions (PnL, SL, TP, Trailing Stop)
      setOpenPositions((oldPositions) => {
        if (oldPositions.length === 0) return oldPositions;
        const updatedPositions: Position[] = [];

        oldPositions.forEach((pos) => {
          const currentPrice = pos.side === 'BUY' ? newBid : newAsk;
          const priceDiff = pos.side === 'BUY' ? currentPrice - pos.openPrice : pos.openPrice - currentPrice;
          const pnl = Math.round(priceDiff * 100 * pos.lots * 100) / 100;
          const pnlPips = Math.round(priceDiff * 10 * 10) / 10;

          const cfg = configRef.current;
          let currentSl = pos.sl;

          // 1. Kunci Otomatis ke Profit Biru (Break-Even Plus) begitu floating mencapai target pips
          if (cfg.profitLockBEP && pnlPips >= cfg.breakEvenPips) {
            const pipOffset = 0.25; // Kunci profit biru +2.5 pips di atas titik impas
            if (pos.side === 'BUY') {
              const lockedSl = Math.round((pos.openPrice + pipOffset) * 100) / 100;
              if (currentSl == null || lockedSl > currentSl) {
                currentSl = lockedSl;
              }
            } else {
              const lockedSl = Math.round((pos.openPrice - pipOffset) * 100) / 100;
              if (currentSl == null || lockedSl < currentSl) {
                currentSl = lockedSl;
              }
            }
          }

          // 2. Trailing Stop Dinamis untuk Memaksimalkan "Keuntungan yang Banyak" (Run the Profit)
          if (cfg.useTrailingStop && pos.trailingStop && pnlPips > 5) {
            const trailOffset = pos.trailingStop * 0.1;
            if (pos.side === 'BUY') {
              const prospectiveSl = Math.round((newBid - trailOffset) * 100) / 100;
              if (currentSl == null || prospectiveSl > currentSl) {
                currentSl = prospectiveSl;
              }
            } else {
              const prospectiveSl = Math.round((newAsk + trailOffset) * 100) / 100;
              if (currentSl == null || prospectiveSl < currentSl) {
                currentSl = prospectiveSl;
              }
            }
          }

          // 3. Cek Target Take Profit (TP Hit -> Keuntungan Biru Banyak)
          if (pos.tp != null) {
            const tpHit = pos.side === 'BUY' ? newBid >= pos.tp : newAsk <= pos.tp;
            if (tpHit) {
              closePosition(pos.id, 'BLUE_PROFIT_TARGET');
              return;
            }
          }

          // 4. Cek SL atau Exit
          if (currentSl != null) {
            const slHit = pos.side === 'BUY' ? newBid <= currentSl : newAsk >= currentSl;
            if (slHit) {
              const isGuaranteedBlue = pos.side === 'BUY' ? currentSl >= pos.openPrice : currentSl <= pos.openPrice;
              if (cfg.onlyCloseInProfit) {
                // HANYA TUTUP JIKA SUDAH DI AREA BIRU (PROFIT)
                if (isGuaranteedBlue) {
                  closePosition(pos.id, 'TRAILING_BLUE');
                  return;
                }
                // Jika masih merah/minus, robot TIDAK PERNAH menutup posisi rugi, menunggu memantul kembali ke biru
              } else {
                closePosition(pos.id, 'SL_HIT');
                return;
              }
            }
          }

          updatedPositions.push({
            ...pos,
            currentPrice,
            pnl,
            pnlPips,
            sl: currentSl,
          });
        });

        return updatedPositions;
      });

      // 3. Recalculate Account Equity & Margin
      const currentPositions = openPositionsRef.current;
      const totalFloating = currentPositions.reduce((sum, p) => sum + p.pnl, 0);
      const totalMargin = currentPositions.reduce(
        (sum, p) => sum + (p.lots * 100 * p.openPrice) / accountRef.current.leverage,
        0
      );

      setAccount((acc) => {
        const equity = acc.balance + totalFloating;
        const freeMargin = equity - totalMargin;
        const marginLevel = totalMargin > 0 ? (equity / totalMargin) * 100 : 0;
        return {
          ...acc,
          equity,
          margin: totalMargin,
          freeMargin,
          marginLevel,
        };
      });

      // 4. Evaluate Auto Trading Signals
      if (
        isAutoTradingRef.current &&
        openPositionsRef.current.length < configRef.current.maxOpenTrades &&
        candlesRef.current.length >= 35
      ) {
        const nowMs = Date.now();
        // Cooldown between signals (at least 3 seconds in sim time)
        if (nowMs - lastSignalTimeRef.current >= 3000) {
          const signal = evaluateMarketSignal(candlesRef.current, configRef.current);
          if (signal && signal.confidence >= configRef.current.confluenceThreshold) {
            lastSignalTimeRef.current = nowMs;
            openNewPosition(signal.side, signal.reason);
          }
        }
      }
    }, tickIntervalMs);

    return () => clearInterval(interval);
  }, [speed, timeframe, closePosition, openNewPosition]);

  // Aggregate floating PnL
  const floatingPnl = openPositions.reduce((sum, p) => sum + p.pnl, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 3-Zone Top Bar Navigation */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAutoTrading={isAutoTrading}
        setIsAutoTrading={(val) => {
          setIsAutoTrading(val);
          playSound(val ? 'order_open' : 'click');
        }}
        floatingPnl={floatingPnl}
      />

      {/* Main Content Area */}
      <main className="flex-1 px-4 sm:px-6 py-4 max-w-[1600px] w-full mx-auto flex flex-col gap-4">
        {/* VIEW 1: TERMINAL LIVE (Primary Trading View) */}
        {activeTab === 'terminal' && (
          <div className="flex flex-col gap-4">
            {/* Account Overview Bar */}
            <AccountOverview
              account={account}
              closedTrades={closedTrades}
              floatingPnl={floatingPnl}
              onCloseAllPositions={closeAllPositions}
              onResetAccount={resetAccount}
              openPositionsCount={openPositions.length}
            />

            {/* Split Grid: Live Chart (Left/Main) & Bot Quick Controls (Right/Below) */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Candlestick & Indicator Chart */}
              <div className="lg:col-span-3 min-h-[460px] h-[550px]">
                <TradingChart
                  candles={candles}
                  currentBid={currentBid}
                  currentAsk={currentAsk}
                  timeframe={timeframe}
                  setTimeframe={setTimeframe}
                  openPositions={openPositions}
                />
              </div>

              {/* Bot Live Status & Telemetry Column */}
              <div className="lg:col-span-1 flex flex-col gap-3">
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 shadow-xl flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                      <span className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                        Status Robot Algo
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                          isAutoTrading
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isAutoTrading ? 'AKTIF SCANNING' : 'STANDBY'}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-slate-400">
                        <span>Mode Algoritma:</span>
                        <span className="text-amber-400 font-bold font-mono">
                          {config.strategyId === 'sniper_99'
                            ? 'Sniper ICT 99%'
                            : config.strategyId === 'smart_grid'
                            ? 'Dynamic Grid Safe'
                            : config.strategyId === 'trend_momentum'
                            ? 'Trend Alpha'
                            : 'AI Confluence'}
                        </span>
                      </div>

                      <div className="flex justify-between text-slate-400">
                        <span>Ukuran Lot:</span>
                        <span className="text-slate-200 font-mono font-bold">{config.lotSize.toFixed(2)} Lot</span>
                      </div>

                      <div className="flex justify-between text-slate-400">
                        <span>Take Profit:</span>
                        <span className="text-emerald-400 font-mono font-bold">+{config.takeProfitPips} Pips</span>
                      </div>

                      <div className="flex justify-between text-slate-400">
                        <span>Stop Loss:</span>
                        <span className="text-rose-400 font-mono font-bold">-{config.stopLossPips} Pips</span>
                      </div>

                      <div className="flex justify-between text-slate-400">
                        <span>Trailing Stop:</span>
                        <span className="text-cyan-400 font-mono font-bold">
                          {config.useTrailingStop ? `${config.trailingStopPips} Pips` : 'Off'}
                        </span>
                      </div>

                      <div className="flex justify-between text-slate-400">
                        <span>Arah Keuntungan:</span>
                        <span className="text-amber-400 font-mono font-bold">
                          {config.tradeDirection === 'BOTH'
                            ? 'Dua Arah (BUY & SELL)'
                            : config.tradeDirection === 'BUY_ONLY'
                            ? 'Hanya BUY'
                            : 'Hanya SELL'}
                        </span>
                      </div>

                      <div className="flex justify-between text-slate-400">
                        <span>Hanya Tutup Biru:</span>
                        <span className="text-cyan-400 font-mono font-bold">
                          {config.onlyCloseInProfit ? '✓ AKTIF (Zona Biru)' : 'Normal'}
                        </span>
                      </div>

                      <div className="flex justify-between text-slate-400">
                        <span>Filter Akurasi Min:</span>
                        <span className="text-amber-400 font-mono font-bold">{config.confluenceThreshold}%</span>
                      </div>

                      <div className="flex justify-between text-slate-400">
                        <span>Maks Posisi Terbuka:</span>
                        <span className="text-slate-200 font-mono">{config.maxOpenTrades} Posisi</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed bg-slate-900/40 p-2.5 rounded-lg">
                      Robot memindai zona likuiditas Fair Value Gap (FVG), divergensi RSI, dan konfirmasi perpotongan EMA.
                    </div>
                  </div>

                  <div className="mt-4 pt-2">
                    <button
                      onClick={() => setActiveTab('config')}
                      className="cursor-pointer w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700/60 transition-colors"
                    >
                      Ubah Parameter Robot
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Positions & Trade History Table */}
            <PositionsTable
              openPositions={openPositions}
              closedTrades={closedTrades}
              onClosePosition={closePosition}
            />

            {/* Bottom Quick Control Panel */}
            <BotControlPanel
              config={config}
              setConfig={setConfig}
              isAutoTrading={isAutoTrading}
              setIsAutoTrading={setIsAutoTrading}
              speed={speed}
              setSpeed={setSpeed}
              onManualOrder={openNewPosition}
              currentBid={currentBid}
              currentAsk={currentAsk}
            />
          </div>
        )}

        {/* VIEW 2: BACKTESTER (Historical Validation) */}
        {activeTab === 'backtest' && <BacktestView candles={candles} config={config} />}

        {/* VIEW 3: BOT CONFIGURATION (Deep Tuning) */}
        {activeTab === 'config' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <BotControlPanel
              config={config}
              setConfig={setConfig}
              isAutoTrading={isAutoTrading}
              setIsAutoTrading={setIsAutoTrading}
              speed={speed}
              setSpeed={setSpeed}
              onManualOrder={openNewPosition}
              currentBid={currentBid}
              currentAsk={currentAsk}
            />
            <div className="text-center pt-2">
              <button
                onClick={() => setActiveTab('terminal')}
                className="cursor-pointer px-6 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md shadow-amber-950"
              >
                Terapkan & Kembali ke Terminal Live
              </button>
            </div>
          </div>
        )}

        {/* VIEW 4: MASTERCLASS (99% Accuracy Reality & Quant Risk) */}
        {activeTab === 'masterclass' && <AccuracyMasterclass />}

        {/* VIEW 5: CODE EXPORT (MQL5 / TradingView / Python) */}
        {activeTab === 'export' && <CodeExportView config={config} />}
      </main>
    </div>
  );
}
