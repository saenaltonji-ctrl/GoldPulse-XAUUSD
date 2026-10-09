import { useState, useMemo } from 'react';
import { Candle, BotConfig, BacktestResult, StrategyId } from '../types/trading';
import { runBacktest } from '../utils/backtester';
import { STRATEGIES_LIST } from '../utils/strategies';

interface BacktestViewProps {
  candles: Candle[];
  config: BotConfig;
}

export function BacktestView({ candles, config }: BacktestViewProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyId>(config.strategyId);
  const [candleCount, setCandleCount] = useState<number>(500);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [result, setResult] = useState<BacktestResult | null>(null);

  // Auto-generate backtest or user clicked Run
  const handleExecuteBacktest = () => {
    setIsRunning(true);
    setTimeout(() => {
      const testCandles = candles.slice(-candleCount);
      const testConfig = { ...config, strategyId: selectedStrategy };
      const res = runBacktest(testCandles, testConfig, 10000);
      setResult(res);
      setIsRunning(false);
    }, 250);
  };

  // Initial trigger if not run yet
  useMemo(() => {
    if (!result && candles.length >= 40) {
      const res = runBacktest(candles.slice(-candleCount), { ...config, strategyId: selectedStrategy }, 10000);
      setResult(res);
    }
  }, [candles, candleCount, config, selectedStrategy, result]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-2">
      {/* Backtester Setup Card */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              Mesin Backtesting Algoritmik XAU/USD (Gold)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulasi performa strategi kuantitatif pada data historis sebelum dijalankan secara live
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExecuteBacktest}
              disabled={isRunning}
              className="cursor-pointer px-5 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-lg shadow-amber-950/40 flex items-center gap-2"
            >
              <span>{isRunning ? 'Menjalankan Simulasi...' : 'Jalankan Backtest Sekarang'}</span>
            </button>
          </div>
        </div>

        {/* Configuration Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Strategi Robot yang Diuji:</label>
            <select
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value as StrategyId)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-medium"
            >
              {STRATEGIES_LIST.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.badge})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Jumlah Candlestick Historis:</label>
            <select
              value={candleCount}
              onChange={(e) => setCandleCount(parseInt(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-400 font-mono"
            >
              <option value={100}>100 Candles (Sesi Terkini)</option>
              <option value={300}>300 Candles (Intraday Multi-Session)</option>
              <option value={500}>500 Candles (Uji Kuat Komprehensif)</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400 block mb-1">Modal Awal Simulasi:</label>
            <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-400 font-bold">
              $10,000.00 USD (Standar Akun Standar/ECN)
            </div>
          </div>
        </div>
      </div>

      {/* Metrics KPI Cards */}
      {result && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Win Rate */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 shadow-lg">
              <span className="text-[11px] text-slate-400 block mb-1">Tingkat Kemenangan</span>
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-xl font-bold text-amber-400 tabular-nums">
                  {result.winRate}%
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  ({result.winningTrades}/{result.totalTrades})
                </span>
              </div>
            </div>

            {/* Net Profit */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 shadow-lg">
              <span className="text-[11px] text-slate-400 block mb-1">Keuntungan Bersih (Net)</span>
              <span
                className={`font-mono text-xl font-bold tabular-nums ${
                  result.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {result.netProfit >= 0 ? '+' : ''}${result.netProfit.toFixed(2)}
              </span>
            </div>

            {/* Profit Factor */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 shadow-lg">
              <span className="text-[11px] text-slate-400 block mb-1">Faktor Keuntungan (PF)</span>
              <span className="font-mono text-xl font-bold text-cyan-400 tabular-nums">
                {result.profitFactor.toFixed(2)}
              </span>
            </div>

            {/* Max Drawdown */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 shadow-lg">
              <span className="text-[11px] text-slate-400 block mb-1">Maksimum Drawdown</span>
              <div className="flex items-baseline gap-1">
                <span className="font-mono text-xl font-bold text-rose-400 tabular-nums">
                  {result.maxDrawdownPercent}%
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  (${result.maxDrawdown.toFixed(0)})
                </span>
              </div>
            </div>

            {/* Sharpe Ratio */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 shadow-lg">
              <span className="text-[11px] text-slate-400 block mb-1">Rasio Sharpe (Efisiensi)</span>
              <span className="font-mono text-xl font-bold text-purple-400 tabular-nums">
                {result.sharpeRatio.toFixed(2)}
              </span>
            </div>

            {/* Total Trades */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 shadow-lg">
              <span className="text-[11px] text-slate-400 block mb-1">Total Eksekusi Trade</span>
              <span className="font-mono text-xl font-bold text-slate-100 tabular-nums">
                {result.totalTrades}
              </span>
            </div>
          </div>

          {/* Visual Equity Curve SVG Chart */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-200 text-sm">
                Kurva Pertumbuhan Ekuitas (Equity Growth Curve)
              </h3>
              <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-emerald-400 rounded-sm inline-block" />
                  Saldo Akhir: ${(10000 + result.netProfit).toFixed(2)}
                </span>
              </div>
            </div>

            {/* SVG Line Graph */}
            <div className="w-full h-48 bg-slate-900/40 rounded-lg p-2 border border-slate-800/60 relative">
              {result.equityCurve.length > 1 ? (
                <svg className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  {(() => {
                    const minE = Math.min(...result.equityCurve.map((p) => p.equity)) * 0.99;
                    const maxE = Math.max(...result.equityCurve.map((p) => p.equity)) * 1.01;
                    const range = maxE - minE || 1;

                    const points = result.equityCurve.map((pt, idx) => {
                      const x = (idx / (result.equityCurve.length - 1)) * 100;
                      const y = 100 - ((pt.equity - minE) / range) * 100;
                      return `${x},${y}`;
                    });

                    const pathD = `M ${points.join(' L ')}`;
                    const areaD = `${pathD} L 100,100 L 0,100 Z`;

                    return (
                      <>
                        <path d={areaD} fill="url(#equityGrad)" />
                        <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                      </>
                    );
                  })()}
                </svg>
              ) : (
                <div className="flex items-center justify-center h-full text-xs text-slate-500">
                  Data kurva ekuitas akan muncul setelah simulasi selesai.
                </div>
              )}
            </div>
          </div>

          {/* Trade Execution Log */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden shadow-xl">
            <div className="px-4 py-3 bg-slate-900/60 border-b border-slate-800 text-xs font-semibold text-slate-200">
              Daftar Eksekusi Trade Backtest ({result.trades.length} Transaksi)
            </div>
            <div className="max-h-64 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900/80 text-slate-400 text-[11px] uppercase tracking-wider sticky top-0 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">Tipe</th>
                    <th className="py-2 px-3 text-right">Lot</th>
                    <th className="py-2 px-3 text-right">Harga Buka</th>
                    <th className="py-2 px-3 text-right">Harga Tutup</th>
                    <th className="py-2 px-3 text-right">Hasil PnL</th>
                    <th className="py-2 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {result.trades.map((t, idx) => {
                    const isWin = t.pnl >= 0;
                    return (
                      <tr key={t.id} className="hover:bg-slate-900/40">
                        <td className="py-2 px-3 text-slate-500">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <span className={t.side === 'BUY' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                            {t.side}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right text-slate-300">{t.lots.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right text-slate-400">{t.openPrice.toFixed(2)}</td>
                        <td className="py-2 px-3 text-right text-slate-200">{t.closePrice.toFixed(2)}</td>
                        <td
                          className={`py-2 px-3 text-right font-bold tabular-nums ${
                            isWin ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isWin ? '+' : ''}${t.pnl.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-[11px]">
                          <span className={isWin ? 'text-emerald-400' : 'text-rose-400'}>
                            {t.closeReason === 'TP_HIT' ? 'Target TP Tercapai' : 'Stop Loss Terpicu'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
