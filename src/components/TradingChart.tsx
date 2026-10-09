import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Candle, Position, OrderSide } from '../types/trading';
import { calculateEMA, calculateBollingerBands, detectFVGs } from '../utils/indicators';

interface TradingChartProps {
  candles: Candle[];
  currentBid: number;
  currentAsk: number;
  timeframe: 'M1' | 'M5' | 'M15' | 'H1';
  setTimeframe: (tf: 'M1' | 'M5' | 'M15' | 'H1') => void;
  openPositions: Position[];
  lastSignalSide?: OrderSide | null;
}

export function TradingChart({
  candles,
  currentBid,
  currentAsk,
  timeframe,
  setTimeframe,
  openPositions,
}: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [showEMA, setShowEMA] = useState(true);
  const [showBB, setShowBB] = useState(false);
  const [showFVG, setShowFVG] = useState(true);
  const [hoverData, setHoverData] = useState<{
    candle: Candle | null;
    x: number;
    y: number;
    price: number;
  } | null>(null);

  const closes = useMemo(() => candles.map((c) => c.close), [candles]);
  const ema9 = useMemo(() => (showEMA ? calculateEMA(closes, 9) : []), [closes, showEMA]);
  const ema21 = useMemo(() => (showEMA ? calculateEMA(closes, 21) : []), [closes, showEMA]);
  const ema200 = useMemo(() => (showEMA ? calculateEMA(closes, 50) : []), [closes, showEMA]);
  const bb = useMemo(() => (showBB ? calculateBollingerBands(closes, 20, 2) : null), [closes, showBB]);
  const fvgs = useMemo(() => (showFVG ? detectFVGs(candles) : []), [candles, showFVG]);

  // Main canvas render loop
  const renderChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background
    ctx.fillStyle = '#070a12';
    ctx.fillRect(0, 0, width, height);

    // Grid config
    const margin = { top: 25, right: 65, bottom: 25, left: 10 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Compute visible min/max price
    const visibleCount = Math.min(candles.length, 65);
    const visibleCandles = candles.slice(-visibleCount);
    let minPrice = Math.min(...visibleCandles.map((c) => c.low));
    let maxPrice = Math.max(...visibleCandles.map((c) => c.high));

    // Also include active position SL/TP in vertical bounds if open
    openPositions.forEach((pos) => {
      if (pos.tp) maxPrice = Math.max(maxPrice, pos.tp);
      if (pos.sl) minPrice = Math.min(minPrice, pos.sl);
    });

    const priceBuffer = (maxPrice - minPrice) * 0.1 || 1;
    minPrice -= priceBuffer;
    maxPrice += priceBuffer;
    const priceRange = maxPrice - minPrice || 1;

    const candleWidth = Math.max(3, chartWidth / visibleCount);
    const candleGap = candleWidth * 0.25;
    const barWidth = Math.max(2, candleWidth - candleGap);

    const priceToY = (price: number) => {
      return margin.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
    };

    // Draw horizontal grid lines & price labels
    ctx.strokeStyle = '#151d2f';
    ctx.lineWidth = 1;
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';

    const steps = 6;
    for (let i = 0; i <= steps; i++) {
      const p = minPrice + (priceRange / steps) * i;
      const y = priceToY(p);
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(width - margin.right, y);
      ctx.stroke();

      ctx.fillText(p.toFixed(2), width - margin.right + 6, y + 3);
    }

    // Draw FVG zones if enabled
    if (showFVG && fvgs.length > 0) {
      const startIndex = candles.length - visibleCount;
      fvgs.forEach((fvg) => {
        if (fvg.index >= startIndex) {
          const visibleIdx = fvg.index - startIndex;
          const x = margin.left + visibleIdx * candleWidth;
          const yTop = priceToY(fvg.topPrice);
          const yBottom = priceToY(fvg.bottomPrice);
          const zoneHeight = Math.abs(yBottom - yTop);

          ctx.fillStyle =
            fvg.type === 'BULLISH'
              ? 'rgba(16, 185, 129, 0.12)'
              : 'rgba(239, 68, 68, 0.12)';
          ctx.fillRect(x, Math.min(yTop, yBottom), chartWidth - (x - margin.left), zoneHeight);

          ctx.strokeStyle =
            fvg.type === 'BULLISH' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(239, 68, 68, 0.35)';
          ctx.setLineDash([2, 2]);
          ctx.strokeRect(x, Math.min(yTop, yBottom), chartWidth - (x - margin.left), zoneHeight);
          ctx.setLineDash([]);
        }
      });
    }

    // Draw Bollinger Bands if enabled
    if (showBB && bb) {
      const startIndex = candles.length - visibleCount;
      const drawBand = (data: (number | null)[], color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < visibleCount; i++) {
          const idx = startIndex + i;
          const val = data[idx];
          if (val != null) {
            const x = margin.left + i * candleWidth + candleWidth / 2;
            const y = priceToY(val);
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
        }
        ctx.stroke();
      };
      drawBand(bb.upper, 'rgba(56, 189, 248, 0.4)');
      drawBand(bb.middle, 'rgba(148, 163, 184, 0.3)');
      drawBand(bb.lower, 'rgba(56, 189, 248, 0.4)');
    }

    // Draw Candlesticks
    for (let i = 0; i < visibleCount; i++) {
      const c = visibleCandles[i];
      const x = margin.left + i * candleWidth;
      const isBull = c.close >= c.open;
      const color = isBull ? '#10b981' : '#f43f5e';

      const yOpen = priceToY(c.open);
      const yClose = priceToY(c.close);
      const yHigh = priceToY(c.high);
      const yLow = priceToY(c.low);

      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, yHigh);
      ctx.lineTo(x + candleWidth / 2, yLow);
      ctx.stroke();

      // Body
      const bodyTop = Math.min(yOpen, yClose);
      const bodyHeight = Math.max(1.5, Math.abs(yClose - yOpen));
      ctx.fillStyle = color;
      ctx.fillRect(x + candleGap / 2, bodyTop, barWidth, bodyHeight);
    }

    // Draw EMAs
    if (showEMA) {
      const startIndex = candles.length - visibleCount;
      const drawEmaLine = (emaSeries: (number | null)[], strokeStyle: string, widthPx = 1.5) => {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = widthPx;
        ctx.beginPath();
        let started = false;
        for (let i = 0; i < visibleCount; i++) {
          const idx = startIndex + i;
          const val = emaSeries[idx];
          if (val != null) {
            const x = margin.left + i * candleWidth + candleWidth / 2;
            const y = priceToY(val);
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
        }
        ctx.stroke();
      };

      drawEmaLine(ema9, '#06b6d4', 1.5); // Cyan Fast
      drawEmaLine(ema21, '#f59e0b', 1.5); // Amber Medium
      drawEmaLine(ema200, '#a855f7', 1.8); // Purple Baseline
    }

    // Draw Active Positions & Orders (Entry, TP, SL)
    openPositions.forEach((pos) => {
      const entryY = priceToY(pos.openPrice);
      const color = pos.side === 'BUY' ? '#10b981' : '#f43f5e';

      // Entry line
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(margin.left, entryY);
      ctx.lineTo(width - margin.right, entryY);
      ctx.stroke();

      // Entry badge
      ctx.fillStyle = color;
      ctx.fillRect(width - margin.right, entryY - 9, margin.right, 18);
      ctx.fillStyle = '#090d16';
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillText(`${pos.side} ${pos.lots}L`, width - margin.right + 4, entryY + 3);

      // TP line
      if (pos.tp) {
        const tpY = priceToY(pos.tp);
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(margin.left, tpY);
        ctx.lineTo(width - margin.right, tpY);
        ctx.stroke();

        ctx.fillStyle = '#22c55e';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText(`TP: ${pos.tp.toFixed(2)}`, margin.left + 8, tpY - 4);
      }

      // SL line
      if (pos.sl) {
        const slY = priceToY(pos.sl);
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(margin.left, slY);
        ctx.lineTo(width - margin.right, slY);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText(`SL: ${pos.sl.toFixed(2)}`, margin.left + 8, slY - 4);
      }

      ctx.setLineDash([]);
    });

    // Draw Live Current Price Line (Bid & Ask)
    const bidY = priceToY(currentBid);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 2]);
    ctx.beginPath();
    ctx.moveTo(margin.left, bidY);
    ctx.lineTo(width - margin.right, bidY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Price tag on axis
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(width - margin.right, bidY - 9, margin.right, 18);
    ctx.fillStyle = '#040d1a';
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.fillText(currentBid.toFixed(2), width - margin.right + 4, bidY + 4);

    // Draw crosshair if hovering
    if (hoverData) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(hoverData.x, margin.top);
      ctx.lineTo(hoverData.x, height - margin.bottom);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(margin.left, hoverData.y);
      ctx.lineTo(width - margin.right, hoverData.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Floating price tag
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(width - margin.right, hoverData.y - 8, margin.right, 16);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.fillText(hoverData.price.toFixed(2), width - margin.right + 4, hoverData.y + 4);
    }
  }, [candles, currentBid, currentAsk, openPositions, showEMA, showBB, showFVG, ema9, ema21, ema200, bb, fvgs, hoverData]);

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      renderChart();
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderChart]);

  // Redraw when candles or prices update
  useEffect(() => {
    renderChart();
  }, [renderChart]);

  // Mouse Move for Crosshair
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const margin = { top: 25, right: 65, bottom: 25, left: 10 };
    const chartWidth = canvas.width - margin.left - margin.right;
    const chartHeight = canvas.height - margin.top - margin.bottom;

    const visibleCount = Math.min(candles.length, 65);
    const visibleCandles = candles.slice(-visibleCount);
    let minPrice = Math.min(...visibleCandles.map((c) => c.low));
    let maxPrice = Math.max(...visibleCandles.map((c) => c.high));
    const priceBuffer = (maxPrice - minPrice) * 0.1 || 1;
    minPrice -= priceBuffer;
    maxPrice += priceBuffer;
    const priceRange = maxPrice - minPrice;

    const candleWidth = chartWidth / visibleCount;
    const candleIdx = Math.floor((x - margin.left) / candleWidth);
    const candle = visibleCandles[candleIdx] ?? null;

    const price = maxPrice - ((y - margin.top) / chartHeight) * priceRange;

    setHoverData({
      candle,
      x,
      y,
      price: Math.max(0, price),
    });
  };

  const handleMouseLeave = () => {
    setHoverData(null);
  };

  const latestCandle = candles[candles.length - 1];

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Bar for Chart Control */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 text-xs">
        {/* Left: Symbol & Live Pricing */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-slate-100 text-sm tracking-wide">
            <span className="text-amber-400">XAU/USD</span>
            <span className="text-slate-400 font-normal text-xs">Gold Spot (AUXUSD)</span>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-700/60 font-mono">
            <span className="text-slate-400">Bid:</span>
            <span className="text-cyan-400 font-semibold">{currentBid.toFixed(2)}</span>
            <span className="text-slate-400 ml-1">Ask:</span>
            <span className="text-amber-400 font-semibold">{currentAsk.toFixed(2)}</span>
            <span className="text-slate-500 text-[10px]">
              (Spread: {((currentAsk - currentBid) * 10).toFixed(0)} pips)
            </span>
          </div>
        </div>

        {/* Center: Timeframe selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          {(['M1', 'M5', 'M15', 'H1'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`cursor-pointer px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${
                timeframe === tf
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Right: Technical Indicator Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEMA(!showEMA)}
            className={`cursor-pointer px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
              showEMA
                ? 'bg-slate-800 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-900/50 border-slate-800 text-slate-500'
            }`}
          >
            EMA (9/21/50)
          </button>
          <button
            onClick={() => setShowBB(!showBB)}
            className={`cursor-pointer px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
              showBB
                ? 'bg-slate-800 border-sky-500/50 text-sky-300'
                : 'bg-slate-900/50 border-slate-800 text-slate-500'
            }`}
          >
            Bollinger Bands
          </button>
          <button
            onClick={() => setShowFVG(!showFVG)}
            className={`cursor-pointer px-2 py-1 rounded text-[11px] font-medium border transition-colors ${
              showFVG
                ? 'bg-slate-800 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900/50 border-slate-800 text-slate-500'
            }`}
          >
            ICT FVG Liquidity
          </button>
        </div>
      </div>

      {/* OHLC Bar Legend */}
      <div className="flex items-center gap-4 px-4 py-1.5 bg-slate-950/90 border-b border-slate-900 text-[11px] font-mono text-slate-400">
        {latestCandle && (
          <>
            <div>
              O: <span className="text-slate-200">{latestCandle.open.toFixed(2)}</span>
            </div>
            <div>
              H: <span className="text-slate-200">{latestCandle.high.toFixed(2)}</span>
            </div>
            <div>
              L: <span className="text-slate-200">{latestCandle.low.toFixed(2)}</span>
            </div>
            <div>
              C:{' '}
              <span
                className={
                  latestCandle.close >= latestCandle.open ? 'text-emerald-400' : 'text-rose-400'
                }
              >
                {latestCandle.close.toFixed(2)}
              </span>
            </div>
            <div className="hidden sm:inline">
              Vol: <span className="text-slate-300">{latestCandle.volume}</span>
            </div>
          </>
        )}

        {showEMA && (
          <div className="hidden md:flex items-center gap-3 ml-auto text-[10px]">
            <span className="text-cyan-400">■ EMA 9</span>
            <span className="text-amber-400">■ EMA 21</span>
            <span className="text-purple-400">■ EMA Baseline</span>
          </div>
        )}
      </div>

      {/* Canvas Viewport */}
      <div ref={containerRef} className="relative flex-1 w-full min-h-[380px]">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="absolute inset-0 w-full h-full cursor-crosshair"
        />
      </div>
    </div>
  );
}
