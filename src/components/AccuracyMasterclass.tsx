import { useState, useMemo } from 'react';

export function AccuracyMasterclass() {
  const [testWinRate, setTestWinRate] = useState(95);
  const [testRewardRatio, setTestRewardRatio] = useState(0.2); // Typical Martingale 99% has tiny reward vs huge risk
  const [lossMultiple, setLossMultiple] = useState(10); // Loss is 10x larger when it finally hits

  // Expected Value calculation
  const expectedValue = useMemo(() => {
    const winProbability = testWinRate / 100;
    const lossProbability = 1 - winProbability;
    const winAmount = 100 * testRewardRatio;
    const lossAmount = 100 * (lossMultiple / 10);
    const ev = winProbability * winAmount - lossProbability * lossAmount;
    return {
      winAmount,
      lossAmount,
      ev,
      isPositive: ev > 0,
    };
  }, [testWinRate, testRewardRatio, lossMultiple]);

  // 100-Trade Simulation data
  const simulationOutcome = useMemo(() => {
    let balance = 10000;
    const points = [balance];
    for (let i = 1; i <= 100; i++) {
      const isWin = Math.random() * 100 <= testWinRate;
      if (isWin) {
        balance += expectedValue.winAmount;
      } else {
        balance -= expectedValue.lossAmount;
      }
      points.push(Math.max(0, balance));
    }
    return {
      finalBalance: balance,
      points,
    };
  }, [testWinRate, expectedValue]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-2">
      {/* Hero Banner / Manifesto */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-6 shadow-2xl relative overflow-hidden">
        <div className="max-w-3xl">
          <span className="text-amber-400 font-mono text-xs font-semibold uppercase tracking-wider block mb-1">
            Panduan Kuantitatif & Sains Probabilitas Finansial
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mb-2">
            Membongkar Mitos &quot;Akurasi 99% Keuntungan Tanpa Batas&quot; di XAU/USD (Emas)
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Di pasar finansial nyata, tidak ada satu pun institusi perbankan atau hedge fund kuantitatif di dunia yang
            beroperasi dengan klaim &quot;keuntungan tanpa batas tanpa risiko&quot;. Memahami matematika di balik rasio
            akurasi dan rasio risiko adalah kunci mengapa 1% trader konsisten bertahan puluhan tahun sementara 99% trader
            gugur.
          </p>
        </div>
      </div>

      {/* Side-by-side Reality Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Model A: The 99% Trap */}
        <div className="bg-slate-950 border border-rose-900/40 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-rose-400 text-sm">
                Model A: Perangkap Robot &quot;Akurasi 99%&quot; (Martingale Tanpa SL)
              </span>
              <span className="text-[10px] font-mono bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30">
                Palsu / Berbahaya
              </span>
            </div>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Robot jenis ini selalu mencatat &quot;menang terus&quot; karena posisi floating minus tidak pernah ditutup (tidak
              memakai Stop Loss) atau melipatgandakan lot (Martingale) saat harga jatuh.
            </p>
            <div className="space-y-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>99 Transaksi Menang (@+$10):</span>
                <span className="text-emerald-400 font-bold">+$990</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>1 Transaksi Loss (Tren Emas Meledak):</span>
                <span className="text-rose-400 font-bold">-$5,000</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 font-bold">
                <span className="text-slate-300">Hasil Akhir:</span>
                <span className="text-rose-500">Margin Call (Akun Ludes)</span>
              </div>
            </div>
          </div>
          <div className="mt-4 text-[11px] text-slate-400 bg-rose-950/20 p-2.5 rounded border border-rose-900/30">
            <strong>Kesimpulan:</strong> Akurasi 99% tidak ada artinya jika 1 kali kekalahan sanggup menghabiskan seluruh
            modal dan keuntungan akumulasi.
          </div>
        </div>

        {/* Model B: The Quant Alpha Edge */}
        <div className="bg-slate-950 border border-emerald-900/40 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold text-emerald-400 text-sm">
                Model B: Robot Quant Profesional (Edge Matematis & Rasio 1:2)
              </span>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                Standar Hedge Fund
              </span>
            </div>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Memiliki batas risiko ketat (Stop Loss 1-2% per transaksi) dan menargetkan keuntungan minimal 2x lipat dari
              risiko (Risk-to-Reward 1:2). Akurasi cukup 60%, namun profit bertumbuh konsisten.
            </p>
            <div className="space-y-2 bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs font-mono">
              <div className="flex justify-between text-slate-400">
                <span>60 Transaksi Menang (@+$200):</span>
                <span className="text-emerald-400 font-bold">+$12,000</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>40 Transaksi Rugi Terkendali (@-$100):</span>
                <span className="text-rose-400 font-bold">-$4,000</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 font-bold">
                <span className="text-slate-300">Hasil Akhir:</span>
                <span className="text-emerald-400">+$8,000 Bersih (Modal Aman)</span>
              </div>
            </div>
          </div>
          <div className="mt-4 text-[11px] text-slate-400 bg-emerald-950/20 p-2.5 rounded border border-emerald-900/30">
            <strong>Kesimpulan:</strong> Hedge fund ternama dunia seperti Renaissance Technologies (Medallion Fund)
            memiliki rata-rata win-rate 52-58%, namun menghasilkan miliaran dolar dengan manajemen risiko murni.
          </div>
        </div>
      </div>

      {/* Interactive Probability & Expected Value Simulator */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-6 shadow-xl">
        <div className="mb-4">
          <h3 className="font-bold text-slate-100 text-base mb-1">
            Simulator Nilai Harapan Matematis (Expected Value / EV)
          </h3>
          <p className="text-xs text-slate-400">
            Uji rumus matematika nyata: <code className="text-amber-400">EV = (Win Rate × Win Size) - (Loss Rate × Loss Size)</code>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900/40 p-4 rounded-xl border border-slate-800 mb-4">
          {/* Slider 1: Win Rate */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400">Target Win Rate:</span>
              <span className="font-mono font-bold text-amber-400">{testWinRate}%</span>
            </div>
            <input
              type="range"
              min="40"
              max="99"
              value={testWinRate}
              onChange={(e) => setTestWinRate(parseInt(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block mt-1">Persentase trade profit</span>
          </div>

          {/* Slider 2: Reward Ratio */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400">Rasio Keuntungan per Win:</span>
              <span className="font-mono font-bold text-emerald-400">${expectedValue.winAmount.toFixed(0)}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.1"
              value={testRewardRatio}
              onChange={(e) => setTestRewardRatio(parseFloat(e.target.value))}
              className="w-full accent-emerald-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block mt-1">Keuntungan saat target TP tercapai</span>
          </div>

          {/* Slider 3: Loss Severity */}
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-slate-400">Besar Kerugian saat Kalah:</span>
              <span className="font-mono font-bold text-rose-400">${expectedValue.lossAmount.toFixed(0)}</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              value={lossMultiple}
              onChange={(e) => setLossMultiple(parseInt(e.target.value))}
              className="w-full accent-rose-400 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block mt-1">
              {lossMultiple > 15 ? '⚠️ Ekstrem (Tanpa Stop Loss / Martingale)' : 'Terkontrol dengan SL'}
            </span>
          </div>
        </div>

        {/* Live Calculation Output Card */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-slate-900 border border-slate-800">
          <div>
            <span className="text-xs text-slate-400 block mb-0.5">Nilai Harapan per Transaksi (Expected Value / EV):</span>
            <div className="flex items-center gap-2">
              <span
                className={`text-xl font-bold font-mono tabular-nums ${
                  expectedValue.isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {expectedValue.isPositive ? '+' : ''}${expectedValue.ev.toFixed(2)}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded font-medium ${
                  expectedValue.isPositive
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-rose-500/20 text-rose-300'
                }`}
              >
                {expectedValue.isPositive ? 'Strategi Menguntungkan Jangka Panjang' : 'Strategi Merugikan (Kebangkrutan Pasti)'}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block mb-0.5">Hasil Simulasi 100 Trade (Modal Awal $10,000):</span>
            <span
              className={`font-mono text-lg font-bold tabular-nums ${
                simulationOutcome.finalBalance >= 10000 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              ${simulationOutcome.finalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* 4 Golden Rules to Safely Run the Bot */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-6 shadow-xl">
        <h3 className="font-bold text-slate-100 text-base mb-3">
          4 Aturan Emas Menjalankan Robot Trading XAUUSD Secara Otomatis
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-slate-900/50 p-3.5 rounded-lg border border-slate-800">
            <span className="font-bold text-amber-400 block mb-1">1. Selalu Pasang Stop Loss</span>
            <p className="text-slate-400 leading-relaxed">
              Emas (XAUUSD) dapat bergerak $30-$60 dalam 1 hari saat rilis berita NFP atau CPI. Stop Loss adalah sabuk pengaman agar tidak terkena Margin Call.
            </p>
          </div>

          <div className="bg-slate-900/50 p-3.5 rounded-lg border border-slate-800">
            <span className="font-bold text-cyan-400 block mb-1">2. Ambang Konfluensi Tinggi (&gt;85%)</span>
            <p className="text-slate-400 leading-relaxed">
              Jangan biarkan robot trading setiap menit. Mode Sniper menyaring pasar sehingga hanya masuk ketika minimal 3 indikator dan likuiditas mengonfirmasi.
            </p>
          </div>

          <div className="bg-slate-900/50 p-3.5 rounded-lg border border-slate-800">
            <span className="font-bold text-emerald-400 block mb-1">3. Aktifkan Trailing Stop</span>
            <p className="text-slate-400 leading-relaxed">
              Saat posisi Anda sudah floating profit +20 pips, trailing stop otomatis mengunci titik impas (Break-Even) sehingga trade mustahil berbalik jadi rugi.
            </p>
          </div>

          <div className="bg-slate-900/50 p-3.5 rounded-lg border border-slate-800">
            <span className="font-bold text-purple-400 block mb-1">4. Proteksi Kerugian Harian</span>
            <p className="text-slate-400 leading-relaxed">
              Tentukan batas rugi maksimal per hari (misal $200). Jika batas tercapai karena pasar anomali, bot berhenti otomatis sampai sesi berikutnya.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
