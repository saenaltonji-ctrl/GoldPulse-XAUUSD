export interface TopNavProps {
  activeTab: 'terminal' | 'backtest' | 'config' | 'masterclass' | 'export';
  setActiveTab: (tab: 'terminal' | 'backtest' | 'config' | 'masterclass' | 'export') => void;
  isAutoTrading: boolean;
  setIsAutoTrading: (val: boolean) => void;
  floatingPnl: number;
}

export function TopNav({
  activeTab,
  setActiveTab,
  isAutoTrading,
  setIsAutoTrading,
  floatingPnl,
}: TopNavProps) {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800/80 bg-slate-950/95 sticky top-0 z-50 backdrop-blur-md">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setActiveTab('terminal')}
          className="text-left group cursor-pointer focus:outline-none"
        >
          <span className="text-lg font-bold tracking-tight text-amber-400 group-hover:text-amber-300 transition-colors whitespace-nowrap">
            GoldPulse Quant
          </span>
          <span className="text-xs text-slate-400 block -mt-1 font-mono">
            XAU/USD Auto Studio
          </span>
        </button>
      </div>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('terminal')}
          className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 hover:text-slate-100 ${
            activeTab === 'terminal' ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5' : ''
          }`}
        >
          Terminal Live
        </button>
        <button
          onClick={() => setActiveTab('backtest')}
          className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 hover:text-slate-100 ${
            activeTab === 'backtest' ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5' : ''
          }`}
        >
          Backtester
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 hover:text-slate-100 ${
            activeTab === 'config' ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5' : ''
          }`}
        >
          Parameter Robot
        </button>
        <button
          onClick={() => setActiveTab('masterclass')}
          className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 hover:text-slate-100 ${
            activeTab === 'masterclass' ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5' : ''
          }`}
        >
          Realita Akurasi 99%
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`cursor-pointer transition-colors whitespace-nowrap shrink-0 hover:text-slate-100 ${
            activeTab === 'export' ? 'text-amber-400 font-semibold border-b-2 border-amber-400 pb-0.5' : ''
          }`}
        >
          Ekspor MT4/MT5 (Demo & Riil)
        </button>
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden sm:flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
          <span className="text-slate-400">Floating:</span>
          <span className={`font-semibold ${floatingPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {floatingPnl >= 0 ? '+' : ''}${floatingPnl.toFixed(2)}
          </span>
        </div>

        <button
          onClick={() => setIsAutoTrading(!isAutoTrading)}
          className={`cursor-pointer px-4 py-2 text-xs font-bold rounded-lg transition-all duration-200 whitespace-nowrap shrink-0 flex items-center gap-2 ${
            isAutoTrading
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-950/50'
              : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-lg shadow-emerald-950/50'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isAutoTrading ? 'bg-white animate-ping' : 'bg-slate-950'}`} />
          {isAutoTrading ? 'Matikan Auto-Trading' : 'Aktifkan Auto-Trading'}
        </button>
      </div>
    </header>
  );
}
