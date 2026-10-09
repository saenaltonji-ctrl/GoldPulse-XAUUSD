import { useState } from 'react';
import { BotConfig } from '../types/trading';
import { generateMql5Code, generateMql4Code, generatePineScriptCode, generatePythonCode } from '../utils/codeExport';

interface CodeExportViewProps {
  config: BotConfig;
}

export function CodeExportView({ config }: CodeExportViewProps) {
  const [activeTab, setActiveTab] = useState<'mql5' | 'mql4' | 'pine' | 'python'>('mql5');
  const [copied, setCopied] = useState<boolean>(false);

  const mql5Code = generateMql5Code(config);
  const mql4Code = generateMql4Code(config);
  const pineCode = generatePineScriptCode(config);
  const pythonCode = generatePythonCode(config);

  const currentCode =
    activeTab === 'mql5'
      ? mql5Code
      : activeTab === 'mql4'
      ? mql4Code
      : activeTab === 'pine'
      ? pineCode
      : pythonCode;

  const currentFileName =
    activeTab === 'mql5'
      ? 'GoldPulse_XAUUSD_Pro.mq5'
      : activeTab === 'mql4'
      ? 'GoldPulse_XAUUSD_Pro.mq4'
      : activeTab === 'pine'
      ? 'GoldPulse_Strategy.pine'
      : 'goldpulse_bot.py';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([currentCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = currentFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 py-2">
      {/* Real vs Demo Readiness Banner */}
      <div className="bg-slate-950 border border-emerald-900/50 rounded-xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full inline-block animate-pulse" />
              <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider font-mono">
                Kompatibilitas Penuh: Akun Demo & Akun Riil (Real)
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-100">
              Expert Advisor (EA) Siap Diterapkan di MetaTrader 5 & 4
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Kode robot di bawah ini menggunakan arsitektur trading murni MQL5 dan MQL4 dengan proteksi spread otomatis,
              slippage control, trailing stop, dan magic number. Dapat langsung dijalankan di akun Demo untuk verifikasi,
              maupun akun Riil pada broker Forex/Gold mana pun (Exness, IC Markets, XM, FBS, Octa, HFM, dll).
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleDownload}
              className="cursor-pointer px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md shadow-emerald-950 flex items-center gap-1.5"
            >
              <span>⬇ Unduh File ({activeTab.toUpperCase()})</span>
            </button>
            <button
              onClick={handleCopy}
              className="cursor-pointer px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-md shadow-amber-950 flex items-center gap-1.5"
            >
              <span>{copied ? '✓ Berhasil Disalin!' : 'Salin Kode'}</span>
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('mql5')}
            className={`cursor-pointer px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'mql5'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            MetaTrader 5 (MQL5 EA) · Rekomendasi
          </button>
          <button
            onClick={() => setActiveTab('mql4')}
            className={`cursor-pointer px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'mql4'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            MetaTrader 4 (MQL4 EA) · Klasik MT4
          </button>
          <button
            onClick={() => setActiveTab('pine')}
            className={`cursor-pointer px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'pine'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            TradingView (Pine Script v5)
          </button>
          <button
            onClick={() => setActiveTab('python')}
            className={`cursor-pointer px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'python'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            Python (Async Bot Engine)
          </button>
        </div>
      </div>

      {/* Code Display Box */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <span className="text-slate-200 font-semibold">{currentFileName}</span>
            <span className="text-slate-500">·</span>
            <span className="text-emerald-400 font-medium">Bisa Akun Demo & Riil</span>
          </div>
          <span className="text-[11px] text-slate-400">
            Lot: {config.lotSize.toFixed(2)} | TP: {config.takeProfitPips}p | SL: {config.stopLossPips}p | Trailing: {config.useTrailingStop ? 'Aktif' : 'Nonaktif'}
          </span>
        </div>

        <pre className="p-4 text-xs font-mono text-slate-200 bg-slate-950 overflow-x-auto max-h-[440px] leading-relaxed selection:bg-amber-400/20">
          <code>{currentCode}</code>
        </pre>
      </div>

      {/* DEDICATED PANDUAN LANGKAH-DEMI-LANGKAH PEMASANGAN DI METATRADER 4 (MT4) */}
      <div className="bg-slate-950 border border-amber-500/40 rounded-xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-amber-400 rounded-full inline-block animate-pulse" />
            <h3 className="font-bold text-slate-100 text-sm">
              Panduan Langkah-demi-Langkah Pemasangan di MetaTrader 4 (MT4)
            </h3>
          </div>
          <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Panduan Resmi MT4 (Demo & Riil)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Step 1 */}
          <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-amber-400">Langkah 1</span>
                <span className="text-[10px] text-slate-400 font-mono">01/05</span>
              </div>
              <span className="font-semibold text-slate-200 block mb-1">Unduh File .MQ4</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Pilih tab <strong>MetaTrader 4 (MQL4 EA)</strong> di atas, lalu klik tombol hijau <strong>⬇ Unduh File (MQL4)</strong> untuk menyimpan file <code>GoldPulse_XAUUSD_Pro.mq4</code> di komputer/laptop Anda.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-emerald-400 font-mono">
              ✓ File MQL4 Siap
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-amber-400">Langkah 2</span>
                <span className="text-[10px] text-slate-400 font-mono">02/05</span>
              </div>
              <span className="font-semibold text-slate-200 block mb-1">Buka Folder Data MT4</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Buka aplikasi MT4 Anda. Klik menu kiri atas: <br/>
                <code className="text-cyan-300 text-[10px]">File → Open Data Folder</code>.<br/>
                Lalu masuk ke folder: <br/>
                <code className="text-cyan-300 text-[10px]">MQL4 → Experts</code>.<br/>
                Tempel (Paste) file robot Anda di sini.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-cyan-400 font-mono">
              Folder MQL4/Experts
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-amber-400">Langkah 3</span>
                <span className="text-[10px] text-slate-400 font-mono">03/05</span>
              </div>
              <span className="font-semibold text-slate-200 block mb-1">Compile / Refresh</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Di MT4, buka jendela <strong>Navigator</strong> (<kbd className="px-1 bg-slate-800 rounded font-mono">Ctrl+N</kbd>).<br/>
                Klik kanan pada <strong>Expert Advisors</strong> → Klik <strong>Refresh</strong>.<br/>
                Robot <code>GoldPulse_XAUUSD_Pro</code> akan langsung muncul di daftar!
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
              Refresh Navigator
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-amber-400">Langkah 4</span>
                <span className="text-[10px] text-slate-400 font-mono">04/05</span>
              </div>
              <span className="font-semibold text-slate-200 block mb-1">Izin AutoTrading</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Tekan <kbd className="px-1 bg-slate-800 rounded font-mono">Ctrl+O</kbd> (Options) di MT4, buka tab <strong>Expert Advisors</strong>. Centang:<br/>
                ✓ <em>Allow automated trading</em><br/>
                ✓ <em>Allow DLL imports</em><br/>
                Lalu klik <strong>OK</strong>.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-amber-400 font-mono">
              Opsi Izin Trading
            </div>
          </div>

          {/* Step 5 */}
          <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-emerald-400">Langkah 5</span>
                <span className="text-[10px] text-slate-400 font-mono">05/05</span>
              </div>
              <span className="font-semibold text-slate-200 block mb-1">Pasang ke Chart Emas</span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Buka grafik <strong>XAUUSD / GOLD</strong> timeframe <strong>M1</strong> atau <strong>M5</strong>.<br/>
                Tarik robot ke grafik. Di tab <em>Common</em>, centang <strong>Allow live trading</strong>.<br/>
                Pastikan tombol <strong>AutoTrading</strong> toolbar atas menyala hijau & muncul ikon senyum 😊!
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-emerald-400 font-mono">
              Ikon Senyum 😊 Aktif
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-Step Implementation Guide for Demo and Real Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Phase 1: Demo Account Testing */}
        <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-amber-400 text-sm">
              Fase 1: Penerapan di Akun Demo (Wajib Uji 1–2 Minggu)
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
              Langkah Pertama
            </span>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
            <li>
              Buka akun <strong>Demo</strong> di broker Anda dengan modal yang realistis (misal $1,000 atau $5,000, jangan gunakan demo $100,000 yang tidak realistis).
            </li>
            <li>
              Buka MetaTrader (MT5 atau MT4), tekan tombol <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-slate-200">F4</kbd> untuk membuka <strong>MetaEditor</strong>.
            </li>
            <li>
              Klik <em>File → New → Expert Advisor (template)</em>, beri nama <code className="text-slate-200 font-mono">GoldPulse_XAUUSD</code>.
            </li>
            <li>
              Hapus isi bawaan, paste kode di atas, lalu tekan <kbd className="px-1.5 py-0.5 bg-slate-800 rounded font-mono text-slate-200">F7</kbd> untuk Compile (pastikan <em>0 errors</em>).
            </li>
            <li>
              Di jendela utama MT5/MT4, buka chart <strong>XAUUSD / GOLD</strong> timeframe <strong>M1</strong> atau <strong>M5</strong>.
            </li>
            <li>
              Tarik (drag) robot dari panel Navigator ke chart. Pastikan tombol <strong>Algo Trading</strong> di toolbar atas berwarna <strong>Hijau</strong>.
            </li>
            <li>
              Amati eksekusi robot selama beberapa hari untuk memastikan trailing stop dan TP/SL berjalan mulus.
            </li>
          </ol>
        </div>

        {/* Phase 2: Transition to Real Account Safely */}
        <div className="bg-slate-950 border border-emerald-900/40 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-emerald-400 text-sm">
              Fase 2: Penerapan Aman di Akun Riil (Real Account)
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              Uang Nyata
            </span>
          </div>
          <ol className="list-decimal list-inside space-y-2 text-xs text-slate-300 leading-relaxed">
            <li>
              <strong>Pilih Akun Tipe ECN / Raw Spread</strong>: Emas (XAUUSD) membutuhkan spread sekecil mungkin agar strategi sniper dan scalping meraih TP optimal.
            </li>
            <li>
              <strong>Mulai dengan Lot Terkecil (0.01 Lot)</strong>: Jangan langsung menggunakan lot besar. Uji stabilitas koneksi broker di akun riil dengan modal terkecil terlebih dahulu.
            </li>
            <li>
              <strong>Gunakan VPS (Virtual Private Server)</strong>: Pasang robot di VPS Windows (seperti di New York/London) agar robot dapat berjalan 24 jam nonstop tanpa tergantung laptop yang mati atau koneksi internet rumah yang terputus.
            </li>
            <li>
              <strong>Aktifkan Fitur Filter Spread</strong>: Kode EA di atas sudah dilengkapi fitur pencegah trading saat spread melar (*News Spike Protection* saat rilis NFP/FOMC).
            </li>
            <li>
              <strong>Kirim Notifikasi ke HP</strong>: Masukkan ID MetaQuotes Anda di <em>MT5 → Tools → Options → Notifications</em> untuk menerima notifikasi instan di aplikasi MT5 HP setiap kali robot melakukan open/close posisi.
            </li>
          </ol>
        </div>
      </div>

      {/* Technical FAQ & Android Guide */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
            <h3 className="font-bold text-slate-100 text-sm">
              Panduan Khusus: Cara Menerapkan & Memantau Robot di MetaTrader Android (HP)
            </h3>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
            100% Berjalan di HP Android
          </span>
        </div>

        {/* The Reality of Mobile MT4/MT5 */}
        <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed">
          <p className="mb-2">
            <strong>Fakta Teknis:</strong> Aplikasi resmi <em>MetaTrader 4 & 5 di Google Play Store</em> dirancang oleh MetaQuotes sebagai aplikasi terminal monitor. Aplikasi di Android <strong>tidak memiliki compiler internal</strong> untuk file <code>.mq5</code> / <code>.mq4</code> secara langsung di memori HP.
          </p>
          <p className="text-amber-300 font-medium">
            Namun, Anda dapat menjalankan robot trading ini secara otomatis 24 jam nonstop dan mengendalikannya 100% dari HP Android menggunakan metode standar profesional di bawah ini:
          </p>
        </div>

        {/* 3 Mobile Execution Methods */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Method 1 */}
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-emerald-400">Metode 1: VPS + Remote Desktop HP</span>
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                  Paling Populer
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mb-2 leading-relaxed">
                Robot berjalan di server cloud VPS (aktif 24 jam nonstop), sementara Anda mengontrol dan memantau hasilnya langsung dari aplikasi MT5 Android di HP Anda.
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
                <li>Sewa VPS Windows murah ($3-$5/bln) atau klaim VPS gratis dari broker Anda.</li>
                <li>Unduh aplikasi <strong>RD Client (Microsoft Remote Desktop)</strong> dari Play Store di HP Android.</li>
                <li>Buka MT5 di VPS lewat HP, pasang file EA <code>GoldPulse_XAUUSD</code>.</li>
                <li>Buka aplikasi <strong>MT5 Android</strong> biasa di HP Anda: Semua order & profit biru akan sinkron otomatis secara live!</li>
              </ol>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500">
              ✓ Baterai HP hemat & tidak perlu menyalakan laptop.
            </div>
          </div>

          {/* Method 2 */}
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-cyan-400">Metode 2: Virtual Hosting MQL5</span>
                <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/20 px-1.5 py-0.5 rounded">
                  1-Klik Bawaan
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mb-2 leading-relaxed">
                Fitur server cloud resmi bawaan MetaQuotes yang dapat diaktifkan hanya dengan 1-klik tanpa konfigurasi server manual.
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
                <li>Di MT5 PC, klik kanan pada akun Anda di panel Navigator.</li>
                <li>Pilih <em>Register a Virtual Server</em> (MQL5 Cloud VPS).</li>
                <li>Pilih opsi <em>Synchronize Experts, Indicators and Signal</em>.</li>
                <li>Setelah sinkron, tutup MT5 PC Anda. Robot terus berjalan otomatis di cloud.</li>
                <li>Pantau posisi dan saldo langsung di aplikasi MT5 Android Anda kapan saja.</li>
              </ol>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500">
              ✓ Server terhubung langsung ke data center broker.
            </div>
          </div>

          {/* Method 3 */}
          <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-amber-400">Metode 3: Notifikasi Push ke HP</span>
                <span className="text-[10px] font-mono text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded">
                  Peringatan Instan
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mb-2 leading-relaxed">
                Setiap kali robot membuka order berpotensi tinggi atau mengunci keuntungan biru, notifikasi pop-up langsung muncul di layar Android Anda.
              </p>
              <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
                <li>Buka aplikasi <strong>MetaTrader di HP Android</strong> Anda.</li>
                <li>Buka menu <em>Pengaturan (Settings) → Pesan (Messages)</em>.</li>
                <li>Catat kode <strong>MetaQuotes ID</strong> unik Anda (misal: <code>4B82A1C9</code>).</li>
                <li>Di MT5 PC/VPS: Masuk ke <em>Tools → Options → Notifications</em>, masukkan MetaQuotes ID tersebut.</li>
                <li>HP Anda akan berbunyi notifikasi setiap robot meraih Take Profit biru!</li>
              </ol>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 text-[10px] text-slate-500">
              ✓ Pemberitahuan langsung setiap detik tanpa harus memantau grafik terus-menerus.
            </div>
          </div>
        </div>
      </div>

      {/* Technical FAQ */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-5 shadow-xl">
        <h3 className="font-bold text-slate-100 text-sm mb-3">
          Tanya Jawab Teknis Penggunaan Robot di MetaTrader:
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
          <div className="bg-slate-900/50 p-3.5 rounded-lg border border-slate-800">
            <span className="font-bold text-slate-200 block mb-1">Apakah broker memperbolehkan robot trading?</span>
            <p className="leading-relaxed">
              Ya, 99% broker forex internasional (Exness, XM, IC Markets, dll) secara resmi mengizinkan Expert Advisor (EA / Robot). Cukup pastikan opsi <em>Allow Algorithmic Trading</em> diaktifkan.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
            <span className="font-bold text-slate-200 block mb-1">Simbol Emas di Broker Berbeda-beda?</span>
            <p className="leading-relaxed">
              Sebagian broker menamai emas dengan <code className="text-amber-400">XAUUSD</code>, <code className="text-amber-400">GOLD</code>, atau <code className="text-amber-400">XAUUSDm</code>. Robot ini otomatis menyesuaikan dengan simbol chart tempat Anda memasangnya.
            </p>
          </div>

          <div className="bg-slate-900/50 p-3.5 rounded-lg border border-slate-800">
            <span className="font-bold text-slate-200 block mb-1">Berapa modal awal ideal di akun riil?</span>
            <p className="leading-relaxed">
              Untuk lot 0.01, disarankan modal minimal $300 - $500 (atau gunakan akun <em>Cent</em> dengan deposit $10 - $50) agar ketahanan margin terhadap fluktuasi emas tetap aman.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
