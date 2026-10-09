import { BotConfig, StrategyId } from '../types/trading';
import { STRATEGIES_LIST } from '../utils/strategies';

interface BotControlPanelProps {
  config: BotConfig;
  setConfig: React.Dispatch<React.SetStateAction<BotConfig>>;
  isAutoTrading: boolean;
  setIsAutoTrading: (val: boolean) => void;
  speed: number;
  setSpeed: (val: number) => void;
  onManualOrder: (side: 'BUY' | 'SELL') => void;
  currentBid: number;
  currentAsk: number;
}

export function BotControlPanel({
  config,
  setConfig,
  isAutoTrading,
  setIsAutoTrading,
  speed,
  setSpeed,
  onManualOrder,
  currentBid,
  currentAsk,
}: BotControlPanelProps) {
  const currentStrategy = STRATEGIES_LIST.find((s) => s.id === config.strategyId) ?? STRATEGIES_LIST[0];

  return (
    <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 shadow-xl flex flex-col gap-4">
      {/* Header with Auto-Trading status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <span className="font-semibold text-slate-200 text-sm block">
            Pusat Kendali Robot Algoritmik XAUUSD
          </span>
          <span className="text-xs text-slate-400">
            Eksekusi otomatis tanpa emosi dengan parameter risiko terukur
          </span>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
          <span className="text-slate-400 px-2 font-mono">Kecepatan:</span>
          {[1, 5, 20, 50].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`cursor-pointer px-2 py-1 rounded font-mono font-medium transition-colors ${
                speed === s
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Strategy Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {STRATEGIES_LIST.map((strat) => {
          const isSelected = config.strategyId === strat.id;
          return (
            <button
              key={strat.id}
              onClick={() => setConfig((prev) => ({ ...prev, strategyId: strat.id as StrategyId }))}
              className={`cursor-pointer text-left p-3 rounded-lg border transition-all ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-400/80 shadow-md shadow-amber-500/5'
                  : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className={`text-xs font-bold ${isSelected ? 'text-amber-400' : 'text-slate-200'}`}>
                  {strat.name}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">{strat.description}</p>
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-slate-800/60 pt-1.5">
                <span>Akurasi: <strong className="text-emerald-400">{strat.typicalWinRate}</strong></span>
                <span>R:R: <strong className="text-cyan-400">{strat.riskReward}</strong></span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Mode Khusus: Tutup Hanya Saat Profit (Biru) Banner & Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-lg bg-cyan-950/30 border border-cyan-800/60 text-xs">
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse shrink-0" />
          <div>
            <span className="font-bold text-cyan-300 block">
              Mode Eksekusi: Tutup Hanya Saat Profit / Berwarna Biru
            </span>
            <span className="text-[11px] text-slate-400">
              Posisi hanya dibuka jika potensi profit tinggi, dan dilarang tutup dalam kondisi minus/merah sampai menghasilkan keuntungan biru.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-slate-300 font-medium">Hanya Tutup Saat Biru:</span>
            <input
              type="checkbox"
              checked={config.onlyCloseInProfit}
              onChange={(e) => setConfig((prev) => ({ ...prev, onlyCloseInProfit: e.target.checked }))}
              className="accent-cyan-400 w-4 h-4 cursor-pointer"
            />
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-slate-300 font-medium">Kunci BEP (+2 pips):</span>
            <input
              type="checkbox"
              checked={config.profitLockBEP}
              onChange={(e) => setConfig((prev) => ({ ...prev, profitLockBEP: e.target.checked }))}
              className="accent-cyan-400 w-4 h-4 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Pilihan Arah Keuntungan: Dua Arah (BUY & SELL) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">Arah Keuntungan:</span>
          <span className="text-[11px] text-slate-400">
            {config.tradeDirection === 'BOTH'
              ? 'Dua Arah Aktif: Menghasilkan profit dari transaksi BUY (saat naik) dan SELL (saat turun)'
              : config.tradeDirection === 'BUY_ONLY'
              ? 'Hanya Transaksi Beli (BUY) saat harga emas naik'
              : 'Hanya Transaksi Jual (SELL) saat harga emas turun'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setConfig((prev) => ({ ...prev, tradeDirection: 'BOTH' }))}
            className={`cursor-pointer px-3 py-1 rounded font-semibold text-[11px] transition-colors ${
              config.tradeDirection === 'BOTH'
                ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Dua Arah (BUY & SELL)
          </button>
          <button
            onClick={() => setConfig((prev) => ({ ...prev, tradeDirection: 'BUY_ONLY' }))}
            className={`cursor-pointer px-3 py-1 rounded font-semibold text-[11px] transition-colors ${
              config.tradeDirection === 'BUY_ONLY'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hanya BUY
          </button>
          <button
            onClick={() => setConfig((prev) => ({ ...prev, tradeDirection: 'SELL_ONLY' }))}
            className={`cursor-pointer px-3 py-1 rounded font-semibold text-[11px] transition-colors ${
              config.tradeDirection === 'SELL_ONLY'
                ? 'bg-rose-500 text-white font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Hanya SELL
          </button>
        </div>
      </div>

      {/* Parameter Controls Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 bg-slate-900/40 p-3.5 rounded-lg border border-slate-800/70">
        {/* Lot Size */}
        <div>
          <label className="text-[11px] text-slate-400 block mb-1">Ukuran Lot</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="10.0"
              value={config.lotSize}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, lotSize: Math.max(0.01, parseFloat(e.target.value) || 0.01) }))
              }
              className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-400"
            />
          </div>
          <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">1 Lot = 100 Oz Emas</span>
        </div>

        {/* Take Profit (Pips) */}
        <div>
          <label className="text-[11px] text-slate-400 block mb-1">Take Profit (Pips)</label>
          <input
            type="number"
            step="5"
            min="5"
            max="500"
            value={config.takeProfitPips}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, takeProfitPips: Math.max(5, parseInt(e.target.value) || 10) }))
            }
            className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs font-mono text-emerald-400 focus:outline-none focus:border-emerald-400"
          />
          <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">
            = ${(config.takeProfitPips * 0.1).toFixed(2)} Target Harga
          </span>
        </div>

        {/* Stop Loss (Pips) */}
        <div>
          <label className="text-[11px] text-slate-400 block mb-1">Stop Loss (Pips)</label>
          <input
            type="number"
            step="5"
            min="5"
            max="500"
            value={config.stopLossPips}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, stopLossPips: Math.max(5, parseInt(e.target.value) || 10) }))
            }
            className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs font-mono text-rose-400 focus:outline-none focus:border-rose-400"
          />
          <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">
            = ${(config.stopLossPips * 0.1).toFixed(2)} Batas Rugi
          </span>
        </div>

        {/* Trailing Stop */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] text-slate-400">Trailing Stop</label>
            <input
              type="checkbox"
              checked={config.useTrailingStop}
              onChange={(e) => setConfig((prev) => ({ ...prev, useTrailingStop: e.target.checked }))}
              className="accent-amber-400 cursor-pointer"
            />
          </div>
          <input
            type="number"
            step="5"
            min="5"
            disabled={!config.useTrailingStop}
            value={config.trailingStopPips}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, trailingStopPips: Math.max(5, parseInt(e.target.value) || 10) }))
            }
            className="w-full bg-slate-950 border border-slate-700 disabled:opacity-40 rounded px-2.5 py-1 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-400"
          />
          <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">Kunci profit saat floating</span>
        </div>

        {/* Confluence Threshold */}
        <div>
          <label className="text-[11px] text-slate-400 block mb-1">
            Ambang Konfluensi: <strong className="text-amber-400 font-mono">{config.confluenceThreshold}%</strong>
          </label>
          <input
            type="range"
            min="70"
            max="98"
            value={config.confluenceThreshold}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, confluenceThreshold: parseInt(e.target.value) }))
            }
            className="w-full accent-amber-400 cursor-pointer mt-1.5"
          />
          <span className="text-[10px] text-slate-500 block font-mono">Filter sinyal sniper akurasi tinggi</span>
        </div>

        {/* Max Daily Loss Guard */}
        <div>
          <label className="text-[11px] text-slate-400 block mb-1">Proteksi Rugi Harian ($)</label>
          <input
            type="number"
            step="50"
            min="50"
            value={config.maxDailyLossUsd}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, maxDailyLossUsd: Math.max(50, parseInt(e.target.value) || 100) }))
            }
            className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs font-mono text-slate-100 focus:outline-none focus:border-amber-400"
          />
          <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">Kill-switch jika rugi melampaui</span>
        </div>
      </div>

      {/* Manual Instant Trigger & Auto Toggle Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">Eksekusi Manual Cepat:</span>
          <button
            onClick={() => onManualOrder('BUY')}
            className="cursor-pointer px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-2 shadow-md shadow-emerald-950"
          >
            <span>BUY MARKET</span>
            <span className="font-mono opacity-80">@{currentAsk.toFixed(2)}</span>
          </button>
          <button
            onClick={() => onManualOrder('SELL')}
            className="cursor-pointer px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-2 shadow-md shadow-rose-950"
          >
            <span>SELL MARKET</span>
            <span className="font-mono opacity-80">@{currentBid.toFixed(2)}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
          <span>Strategi Terpilih:</span>
          <span className="text-amber-400 font-semibold">{currentStrategy.name}</span>
          <span className="text-slate-600">·</span>
          <span className="text-emerald-400">{currentStrategy.badge}</span>
        </div>
      </div>
    </div>
  );
}
