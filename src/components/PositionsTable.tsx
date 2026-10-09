import { useState } from 'react';
import { Position, ClosedTrade } from '../types/trading';

interface PositionsTableProps {
  openPositions: Position[];
  closedTrades: ClosedTrade[];
  onClosePosition: (id: string) => void;
}

export function PositionsTable({
  openPositions,
  closedTrades,
  onClosePosition,
}: PositionsTableProps) {
  const [activeTab, setActiveTab] = useState<'open' | 'history'>('open');

  return (
    <div className="bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden shadow-xl flex flex-col">
      {/* Header Tabs */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('open')}
            className={`cursor-pointer px-3 py-1 font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'open'
                ? 'bg-amber-400 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Posisi Terbuka ({openPositions.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`cursor-pointer px-3 py-1 font-medium rounded transition-colors whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-amber-400 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Riwayat Transaksi ({closedTrades.length})
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
          {activeTab === 'open'
            ? `Total Lot Aktif: ${openPositions.reduce((acc, p) => acc + p.lots, 0).toFixed(2)}`
            : `Total Eksekusi Robot: ${closedTrades.length}`}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto min-h-[160px] max-h-[320px] overflow-y-auto">
        {activeTab === 'open' ? (
          openPositions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
              <span className="text-sm font-medium text-slate-400">Tidak ada posisi terbuka saat ini</span>
              <span className="text-xs text-slate-500 mt-1">
                Bot sedang menganalisis pasar untuk mendeteksi sinyal presisi tinggi atau klik BUY/SELL manual di atas.
              </span>
            </div>
          ) : (
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-900/80 text-slate-400 text-[11px] uppercase tracking-wider sticky top-0 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Order ID</th>
                  <th className="py-2.5 px-3">Simbol</th>
                  <th className="py-2.5 px-3">Tipe</th>
                  <th className="py-2.5 px-3 text-right">Lot</th>
                  <th className="py-2.5 px-3 text-right">Harga Buka</th>
                  <th className="py-2.5 px-3 text-right">Harga Sekarang</th>
                  <th className="py-2.5 px-3 text-right">Stop Loss</th>
                  <th className="py-2.5 px-3 text-right">Take Profit</th>
                  <th className="py-2.5 px-3 text-right">Profit ($)</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {openPositions.map((pos) => {
                  const isProfit = pos.pnl >= 0;
                  return (
                    <tr
                      key={pos.id}
                      className={`transition-colors ${
                        isProfit ? 'bg-cyan-950/20 hover:bg-cyan-950/30' : 'hover:bg-slate-900/40'
                      }`}
                    >
                      <td className="py-2 px-3 text-slate-400">{pos.id.slice(-8)}</td>
                      <td className="py-2 px-3 font-semibold text-slate-200">{pos.symbol}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            pos.side === 'BUY'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {pos.side}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right text-slate-200">{pos.lots.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-slate-300">{pos.openPrice.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-slate-300">{pos.currentPrice.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-rose-400">{pos.sl ? pos.sl.toFixed(2) : '-'}</td>
                      <td className="py-2 px-3 text-right text-emerald-400">{pos.tp ? pos.tp.toFixed(2) : '-'}</td>
                      <td
                        className={`py-2 px-3 text-right font-bold tabular-nums ${
                          isProfit ? 'text-cyan-400' : 'text-rose-400'
                        }`}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          {isProfit && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              BIRU
                            </span>
                          )}
                          <span>{isProfit ? '+' : ''}${pos.pnl.toFixed(2)}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 block font-normal">
                          {pos.pnlPips > 0 ? '+' : ''}{pos.pnlPips} pips
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center">
                        <button
                          onClick={() => onClosePosition(pos.id)}
                          className="cursor-pointer px-2 py-1 bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-300 rounded transition-colors text-[10px]"
                        >
                          Tutup
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        ) : closedTrades.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <span className="text-sm font-medium text-slate-400">Belum ada riwayat transaksi</span>
            <span className="text-xs text-slate-500 mt-1">
              Setiap posisi yang ditutup oleh robot (Take Profit atau Stop Loss) akan tercatat di sini secara transparan.
            </span>
          </div>
        ) : (
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/80 text-slate-400 text-[11px] uppercase tracking-wider sticky top-0 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Ticket ID</th>
                <th className="py-2.5 px-3">Tipe</th>
                <th className="py-2.5 px-3 text-right">Lot</th>
                <th className="py-2.5 px-3 text-right">Harga Buka</th>
                <th className="py-2.5 px-3 text-right">Harga Tutup</th>
                <th className="py-2.5 px-3 text-right">Hasil ($)</th>
                <th className="py-2.5 px-3 text-right">Pips</th>
                <th className="py-2.5 px-3">Status Penutupan</th>
                <th className="py-2.5 px-3">Waktu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {closedTrades.slice(-25).reverse().map((trade) => {
                const isProfit = trade.pnl >= 0;
                return (
                  <tr key={trade.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2 px-3 text-slate-400">{trade.id.slice(-8)}</td>
                    <td className="py-2 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          trade.side === 'BUY'
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {trade.side}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right text-slate-300">{trade.lots.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right text-slate-400">{trade.openPrice.toFixed(2)}</td>
                    <td className="py-2 px-3 text-right text-slate-200">{trade.closePrice.toFixed(2)}</td>
                    <td
                      className={`py-2 px-3 text-right font-bold tabular-nums ${
                        isProfit ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isProfit ? '+' : ''}${trade.pnl.toFixed(2)}
                    </td>
                    <td
                      className={`py-2 px-3 text-right tabular-nums ${
                        trade.pnlPips >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {trade.pnlPips >= 0 ? '+' : ''}{trade.pnlPips}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`text-[10px] font-semibold ${
                          trade.closeReason === 'BLUE_PROFIT_TARGET' || trade.closeReason === 'TP_HIT'
                            ? 'text-cyan-400'
                            : trade.closeReason === 'TRAILING_BLUE' || trade.closeReason === 'BEP_LOCK' || trade.closeReason === 'TRAILING_STOP'
                            ? 'text-emerald-400'
                            : trade.closeReason === 'SL_HIT'
                            ? 'text-rose-400'
                            : 'text-sky-400'
                        }`}
                      >
                        {trade.closeReason === 'BLUE_PROFIT_TARGET'
                          ? '✓ Target Biru Banyak (TP Hit)'
                          : trade.closeReason === 'TRAILING_BLUE'
                          ? '⟲ Trailing Profit Biru'
                          : trade.closeReason === 'BEP_LOCK'
                          ? '🔒 Kunci BEP Biru (+Profit)'
                          : trade.closeReason === 'TP_HIT'
                          ? '✓ Target TP Hit'
                          : trade.closeReason === 'SL_HIT'
                          ? '✕ Stop Loss Terpicu'
                          : trade.closeReason === 'TRAILING_STOP'
                          ? '⟲ Trailing Profit'
                          : 'Manual Close'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-500 text-[11px]">
                      {new Date(trade.closeTime * 1000).toLocaleTimeString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
