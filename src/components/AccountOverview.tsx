import { AccountState, ClosedTrade } from '../types/trading';

interface AccountOverviewProps {
  account: AccountState;
  closedTrades: ClosedTrade[];
  floatingPnl: number;
  onCloseAllPositions: () => void;
  onResetAccount: () => void;
  openPositionsCount: number;
}

export function AccountOverview({
  account,
  closedTrades,
  floatingPnl,
  onCloseAllPositions,
  onResetAccount,
  openPositionsCount,
}: AccountOverviewProps) {
  const winningTrades = closedTrades.filter((t) => t.pnl > 0);
  const winRate =
    closedTrades.length > 0
      ? ((winningTrades.length / closedTrades.length) * 100).toFixed(1)
      : '0.0';

  const totalClosedProfit = closedTrades.reduce((sum, t) => sum + t.pnl, 0);
  const buyTrades = closedTrades.filter((t) => t.side === 'BUY');
  const sellTrades = closedTrades.filter((t) => t.side === 'SELL');
  const buyProfit = buyTrades.reduce((sum, t) => sum + t.pnl, 0);
  const sellProfit = sellTrades.reduce((sum, t) => sum + t.pnl, 0);

  return (
    <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200 text-sm">Akun Trading Simulasi XAUUSD</span>
          <span className="text-[11px] text-slate-400 font-mono">
            Leverage 1:{account.leverage} · Mata Uang: USD
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
            Dua Arah (BUY & SELL Aktif)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {openPositionsCount > 0 && (
            <button
              onClick={onCloseAllPositions}
              className="cursor-pointer px-3 py-1.5 text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-lg transition-colors whitespace-nowrap"
            >
              Tutup Semua ({openPositionsCount})
            </button>
          )}

          <button
            onClick={onResetAccount}
            className="cursor-pointer px-3 py-1.5 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/60 rounded-lg transition-colors whitespace-nowrap"
          >
            Reset Modal ($10,000)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Balance */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-lg p-2.5">
          <span className="text-[11px] text-slate-400 block mb-0.5">Saldo (Balance)</span>
          <span className="font-mono text-base font-bold text-slate-100 tabular-nums">
            ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Equity */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-lg p-2.5">
          <span className="text-[11px] text-slate-400 block mb-0.5">Ekuitas (Equity)</span>
          <span
            className={`font-mono text-base font-bold tabular-nums ${
              account.equity >= account.balance ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            ${account.equity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Floating PnL */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-lg p-2.5">
          <span className="text-[11px] text-slate-400 block mb-0.5">Floating PnL</span>
          <span
            className={`font-mono text-base font-bold tabular-nums ${
              floatingPnl >= 0 ? 'text-cyan-400' : 'text-rose-400'
            }`}
          >
            {floatingPnl >= 0 ? '+' : ''}${floatingPnl.toFixed(2)}
          </span>
        </div>

        {/* Total Closed Profit */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-lg p-2.5">
          <span className="text-[11px] text-slate-400 block mb-0.5">Realisasi Profit</span>
          <span
            className={`font-mono text-base font-bold tabular-nums ${
              totalClosedProfit >= 0 ? 'text-cyan-400' : 'text-rose-400'
            }`}
          >
            {totalClosedProfit >= 0 ? '+' : ''}${totalClosedProfit.toFixed(2)}
          </span>
        </div>

        {/* Win Rate */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-lg p-2.5">
          <span className="text-[11px] text-slate-400 block mb-0.5">Akurasi Robot (Win Rate)</span>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-base font-bold text-amber-400 tabular-nums">
              {winRate}%
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              ({winningTrades.length}/{closedTrades.length})
            </span>
          </div>
        </div>

        {/* Free Margin */}
        <div className="bg-slate-900/60 border border-slate-800/60 rounded-lg p-2.5">
          <span className="text-[11px] text-slate-400 block mb-0.5">Margin Bebas</span>
          <span className="font-mono text-base font-bold text-slate-200 tabular-nums">
            ${Math.max(0, account.freeMargin).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Two-Way Profit Breakdown Banner */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
            <span className="text-slate-400">Profit Sisi BUY (Naik):</span>
            <strong className={`tabular-nums ${buyProfit >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
              {buyProfit >= 0 ? '+' : ''}${buyProfit.toFixed(2)}
            </strong>
            <span className="text-[10px] text-slate-500">({buyTrades.length} trade)</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
            <span className="text-slate-400">Profit Sisi SELL (Turun):</span>
            <strong className={`tabular-nums ${sellProfit >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
              {sellProfit >= 0 ? '+' : ''}${sellProfit.toFixed(2)}
            </strong>
            <span className="text-[10px] text-slate-500">({sellTrades.length} trade)</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400">
          Status: <span className="text-emerald-400 font-semibold">Aktif Mengambil Profit Dua Arah (Bullish & Bearish)</span>
        </div>
      </div>
    </div>
  );
}
