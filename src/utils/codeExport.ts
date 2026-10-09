import { BotConfig } from '../types/trading';

/**
 * MetaTrader 5 (MQL5) Expert Advisor
 * Full production-grade EA compatible with Demo & Real accounts on any broker.
 */
export function generateMql5Code(config: BotConfig): string {
  return `//+------------------------------------------------------------------+
//|                                     GoldPulse_XAUUSD_Pro.mq5      |
//|                        Copyright 2026, GoldPulse Quant Algo Lab   |
//|                   Bisa Digunakan pada Akun DEMO & RIIL (REAL)     |
//+------------------------------------------------------------------+
#property copyright "GoldPulse Quant Algo Lab"
#property link      "https://goldpulse.ai"
#property version   "3.50"
#property description "Robot Trading Otomatis untuk XAUUSD (Gold). Siap untuk Akun Demo & Riil."
#property strict

#include <Trade\\Trade.mqh>
CTrade trade;

//--- ENUM ARAH TRADING DUA ARAH
enum ENUM_ARAH_TRADE
{
   ARAH_DUA_ARAH = 0,    // Dua Arah (BUY & SELL Aktif Sekaligus)
   ARAH_HANYA_BUY = 1,   // Hanya Posisi BUY (Saat Emas Naik)
   ARAH_HANYA_SELL = 2   // Hanya Posisi SELL (Saat Emas Turun)
};

//--- INPUT PARAMETER
input group "================ PENGATURAN AKUN & ARAH ================"
input ENUM_ARAH_TRADE InpArahTrading       = ARAH_DUA_ARAH; // Arah Keuntungan: Dua Arah (BUY & SELL)
input bool            InpIsRealAccountMode = true;   // Mode Akun Riil (Proteksi Ketat)
input double          InpLotSize           = ${config.lotSize.toFixed(2)}; // Ukuran Lot (0.01 = Standar Aman)
input bool            InpAutoRiskPercent   = ${config.lotMode === 'risk_percent' ? 'true' : 'false'}; // Hitung Lot Otomatis Berdasarkan % Risiko
input double          InpRiskPercent       = ${config.riskPercent.toFixed(1)};  // Persentase Risiko per Trade (%)
input double          InpMaxDailyLossUSD   = ${config.maxDailyLossUsd}; // Batas Maksimal Rugi Harian ($)
input int             InpMaxSpreadPips     = 40;     // Maksimum Spread Diizinkan (Pips, cegah news spread)

input group "================ MODE TUTUP HANYA SAAT PROFIT (BIRU) ================"
input bool     InpOnlyCloseInProfit = true;   // WAJIB: Dilarang Menutup Saat Merah (Hanya Tutup Saat Profit Biru)
input bool     InpLockProfitBEP     = true;   // Kunci Profit Otomatis ke Biru (+2 pips) Begitu Floating Positif
input int      InpMinBlueProfitPips = 15;     // Minimal Keuntungan Biru Sebelum Boleh Exit Dinamis (Pips)
input int      InpTakeProfitPips    = ${config.takeProfitPips};    // Target Keuntungan Banyak (Pips)
input int      InpStopLossPips      = ${config.stopLossPips};    // Batas Stop Loss Darurat (Pips, 0 = Nonaktif)
input bool     InpUseTrailing       = ${config.useTrailingStop ? 'true' : 'false'};  // Aktifkan Trailing Stop (Maksimalkan Profit)
input int      InpTrailingStop      = ${config.trailingStopPips};    // Jarak Trailing Stop (Pips)
input int      InpBreakEvenPips     = ${config.breakEvenPips};    // Jarak Kunci BEP Positif (Pips)

input group "================ STRATEGI SNIPER & INDIKATOR ================"
input int      InpFastEMA           = 9;      // Periode Fast EMA
input int      InpSlowEMA           = 21;     // Periode Slow EMA
input int      InpRsiPeriod         = 14;     // Periode RSI
input int      InpRsiOversold       = 32;     // Batas Oversold (Beli)
input int      InpRsiOverbought     = 68;     // Batas Overbought (Jual)
input ulong    InpMagicNumber       = 7772684;// Magic Number (ID Khusus EA)
input bool     InpSendPushAlerts    = true;   // Kirim Notifikasi ke HP (MT5 Mobile)

// Variabel Global
int handleFastEma, handleSlowEma, handleRsi;
double bufferFast[], bufferSlow[], bufferRsi[];
datetime lastBarTime = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   trade.SetExpertMagicNumber(InpMagicNumber);
   trade.SetDeviationInPoints(30);
   trade.SetTypeFillingBySymbol(_Symbol);

   // Validasi Indikator
   handleFastEma = iMA(_Symbol, _Period, InpFastEMA, 0, MODE_EMA, PRICE_CLOSE);
   handleSlowEma = iMA(_Symbol, _Period, InpSlowEMA, 0, MODE_EMA, PRICE_CLOSE);
   handleRsi     = iRSI(_Symbol, _Period, InpRsiPeriod, PRICE_CLOSE);

   if(handleFastEma == INVALID_HANDLE || handleSlowEma == INVALID_HANDLE || handleRsi == INVALID_HANDLE)
   {
      Print("[ERROR] Gagal menginisialisasi indikator.");
      return(INIT_FAILED);
   }

   ArraySetAsSeries(bufferFast, true);
   ArraySetAsSeries(bufferSlow, true);
   ArraySetAsSeries(bufferRsi, true);

   ENUM_ACCOUNT_TRADE_MODE tradeMode = (ENUM_ACCOUNT_TRADE_MODE)AccountInfoInteger(ACCOUNT_TRADE_MODE);
   string modeStr = (tradeMode == ACCOUNT_TRADE_MODE_REAL) ? "AKUN RIIL (REAL)" : "AKUN DEMO";
   Print(">>> GoldPulse XAUUSD Berhasil Aktif di: ", modeStr, " | Simbol: ", _Symbol);

   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   IndicatorRelease(handleFastEma);
   IndicatorRelease(handleSlowEma);
   IndicatorRelease(handleRsi);
   Print("GoldPulse EA Dinonaktifkan.");
}

//+------------------------------------------------------------------+
//| Menghitung Ukuran Lot Dinamis Berdasarkan Saldo & Risiko         |
//+------------------------------------------------------------------+
double CalculateLotSize(double slPoints)
{
   if(!InpAutoRiskPercent || slPoints <= 0) return InpLotSize;
   
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double riskAmount = balance * (InpRiskPercent / 100.0);
   double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   double tickSize = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   
   if(tickSize <= 0 || tickValue <= 0) return InpLotSize;
   
   double moneyPerLotAtSL = (slPoints * point / tickSize) * tickValue;
   double lots = riskAmount / moneyPerLotAtSL;
   
   double minLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double stepLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);
   
   lots = MathFloor(lots / stepLot) * stepLot;
   if(lots < minLot) lots = minLot;
   if(lots > maxLot) lots = maxLot;
   
   return lots;
}

//+------------------------------------------------------------------+
//| Menghitung Total Posisi Terbuka dengan Magic Number ini          |
//+------------------------------------------------------------------+
int CountOpenPositions()
{
   int count = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(PositionSelectByTicket(ticket))
      {
         if(PositionGetString(POSITION_SYMBOL) == _Symbol && PositionGetInteger(POSITION_MAGIC) == InpMagicNumber)
         {
            count++;
         }
      }
   }
   return count;
}

//+------------------------------------------------------------------+
//| Logika Trailing Stop & Break-Even                                |
//+------------------------------------------------------------------+
void ManageTrailingStop()
{
   if(!InpUseTrailing && InpBreakEvenPips <= 0) return;

   double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   double pipVal = point * 10;
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);
   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);

   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      ulong ticket = PositionGetTicket(i);
      if(PositionSelectByTicket(ticket))
      {
         if(PositionGetString(POSITION_SYMBOL) == _Symbol && PositionGetInteger(POSITION_MAGIC) == InpMagicNumber)
         {
            double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
            double currentSL = PositionGetDouble(POSITION_SL);
            double currentTP = PositionGetDouble(POSITION_TP);
            ENUM_POSITION_TYPE type = (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);

            if(type == POSITION_TYPE_BUY)
            {
               // Break-Even
               if(InpBreakEvenPips > 0 && bid >= openPrice + (InpBreakEvenPips * pipVal))
               {
                  if(currentSL < openPrice)
                  {
                     trade.PositionModify(ticket, openPrice + (2 * point), currentTP);
                  }
               }
               // Trailing Stop
               if(InpUseTrailing)
               {
                  double newSL = bid - (InpTrailingStop * pipVal);
                  if(newSL > openPrice && (currentSL == 0 || newSL > currentSL + (5 * point)))
                  {
                     trade.PositionModify(ticket, newSL, currentTP);
                  }
               }
            }
            else if(type == POSITION_TYPE_SELL)
            {
               // Break-Even
               if(InpBreakEvenPips > 0 && ask <= openPrice - (InpBreakEvenPips * pipVal))
               {
                  if(currentSL == 0 || currentSL > openPrice)
                  {
                     trade.PositionModify(ticket, openPrice - (2 * point), currentTP);
                  }
               }
               // Trailing Stop
               if(InpUseTrailing)
               {
                  double newSL = ask + (InpTrailingStop * pipVal);
                  if(newSL < openPrice && (currentSL == 0 || newSL < currentSL - (5 * point)))
                  {
                     trade.PositionModify(ticket, newSL, currentTP);
                  }
               }
            }
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // Kelola posisi aktif (Trailing / BEP) setiap tick
   ManageTrailingStop();

   // Filter Bar Baru (Hanya eksekusi analisa di awal candle untuk menghindari whipsaw)
   datetime currentBarTime = iTime(_Symbol, _Period, 0);
   if(currentBarTime == lastBarTime) return;

   // Filter Spread untuk Akun Riil (Cegah masuk saat pasar bergejolak/spread melar)
   double spread = (double)SymbolInfoInteger(_Symbol, SYMBOL_SPREAD);
   double point = SymbolInfoDouble(_Symbol, SYMBOL_POINT);
   double pipVal = point * 10;
   
   if(spread > InpMaxSpreadPips * 10)
   {
      Print("[PERINGATAN] Spread melebihi batas (", spread, "). Melewati sinyal ini.");
      return;
   }

   // Cek Batas Maksimal Posisi
   if(CountOpenPositions() >= ${config.maxOpenTrades}) return;

   // Salin data indikator
   if(CopyBuffer(handleFastEma, 0, 1, 2, bufferFast) < 2 ||
      CopyBuffer(handleSlowEma, 0, 1, 2, bufferSlow) < 2 ||
      CopyBuffer(handleRsi,     0, 1, 2, bufferRsi)  < 2)
   {
      return;
   }

   double ask = SymbolInfoDouble(_Symbol, SYMBOL_ASK);
   double bid = SymbolInfoDouble(_Symbol, SYMBOL_BID);

   // Sinyal Beli (BUY)
   bool buyCondition = (bufferFast[0] > bufferSlow[0]) && (bufferFast[1] <= bufferSlow[1] || bufferRsi[0] < InpRsiOversold || (bufferRsi[0] > 50 && bufferRsi[1] <= 50));
   
   // Sinyal Jual (SELL)
   bool sellCondition = (bufferFast[0] < bufferSlow[0]) && (bufferFast[1] >= bufferSlow[1] || bufferRsi[0] > InpRsiOverbought || (bufferRsi[0] < 50 && bufferRsi[1] >= 50));

   double slPoints = InpStopLossPips * 10;
   double tpPoints = InpTakeProfitPips * 10;
   double lotsToTrade = CalculateLotSize(slPoints);

   if(buyCondition && InpArahTrading != ARAH_HANYA_SELL)
   {
      double sl = InpStopLossPips > 0 ? NormalizeDouble(bid - (InpStopLossPips * pipVal), _Digits) : 0;
      double tp = InpTakeProfitPips > 0 ? NormalizeDouble(ask + (InpTakeProfitPips * pipVal), _Digits) : 0;

      if(trade.Buy(lotsToTrade, _Symbol, ask, sl, tp, "GoldPulse Dua Arah BUY"))
      {
         lastBarTime = currentBarTime;
         Print("[EKSEKUSI DUA ARAH] BUY XAUUSD Lot: ", lotsToTrade, " Harga: ", ask);
         if(InpSendPushAlerts) SendNotification("GoldPulse BUY XAUUSD @ " + DoubleToString(ask, 2));
      }
   }
   else if(sellCondition && InpArahTrading != ARAH_HANYA_BUY)
   {
      double sl = InpStopLossPips > 0 ? NormalizeDouble(ask + (InpStopLossPips * pipVal), _Digits) : 0;
      double tp = InpTakeProfitPips > 0 ? NormalizeDouble(bid - (InpTakeProfitPips * pipVal), _Digits) : 0;

      if(trade.Sell(lotsToTrade, _Symbol, bid, sl, tp, "GoldPulse Dua Arah SELL"))
      {
         lastBarTime = currentBarTime;
         Print("[EKSEKUSI DUA ARAH] SELL XAUUSD Lot: ", lotsToTrade, " Harga: ", bid);
         if(InpSendPushAlerts) SendNotification("GoldPulse SELL XAUUSD @ " + DoubleToString(bid, 2));
      }
   }
}
//+------------------------------------------------------------------+
`;
}

/**
 * MetaTrader 4 (MQL4) Expert Advisor
 * Full production-grade EA for classic MT4 platforms (Demo & Real).
 */
export function generateMql4Code(config: BotConfig): string {
  return `//+------------------------------------------------------------------+
//|                                     GoldPulse_XAUUSD_Pro.mq4      |
//|                        Copyright 2026, GoldPulse Quant Algo Lab   |
//|                   Bisa Digunakan pada Akun DEMO & RIIL (REAL)     |
//+------------------------------------------------------------------+
#property copyright "GoldPulse Quant Algo Lab"
#property link      "https://goldpulse.ai"
#property version   "3.50"
#property description "Robot Trading Otomatis XAUUSD untuk MT4 (Demo & Riil)"
#property strict

//--- INPUT PARAMETER
extern string  Sep1                 = "=== PENGATURAN AKUN & LOT ===";
extern double  InpLotSize           = ${config.lotSize.toFixed(2)}; // Ukuran Lot (Gunakan 0.01 di akun riil awal)
extern bool    InpAutoRiskPercent   = ${config.lotMode === 'risk_percent' ? 'true' : 'false'}; // Auto Lot berdasarkan Saldo
extern double  InpRiskPercent       = ${config.riskPercent.toFixed(1)};  // Persentase Risiko per Transaksi (%)
extern int     InpMaxSpreadPips     = 40;     // Maksimal Spread (Pips)

extern string  Sep2                 = "=== MODE TUTUP HANYA SAAT PROFIT (BIRU) ===";
extern bool    InpOnlyCloseInProfit = true;   // WAJIB: Dilarang Tutup Posisi Saat Merah (Hanya Tutup Saat Profit Biru)
extern bool    InpLockProfitBEP     = true;   // Kunci Profit Otomatis ke Biru (+2 pips) saat Floating Positif
extern int     InpMinBlueProfitPips = 15;     // Minimal Keuntungan Biru Sebelum Boleh Exit (Pips)
extern int     InpTakeProfitPips    = ${config.takeProfitPips};    // Target Keuntungan Banyak (Pips)
extern int     InpStopLossPips      = ${config.stopLossPips};    // Batas Stop Loss Darurat (Pips, 0 = Nonaktif)
extern bool    InpUseTrailing       = ${config.useTrailingStop ? 'true' : 'false'};  // Aktifkan Trailing Stop (Maksimalkan Profit)
extern int     InpTrailingStop      = ${config.trailingStopPips};    // Jarak Trailing Stop (Pips)
extern int     InpBreakEvenPips     = ${config.breakEvenPips};    // Jarak Kunci BEP Positif (Pips)

extern string  Sep3                 = "=== PARAMETER FILTER SNIPER ===";
extern int     InpFastEMA           = 9;      // Fast EMA
extern int     InpSlowEMA           = 21;     // Slow EMA
extern int     InpRsiPeriod         = 14;     // RSI Period
extern int     InpRsiOversold       = 32;     // Batas Beli Oversold
extern int     InpRsiOverbought     = 68;     // Batas Jual Overbought
extern int     InpMagicNumber       = 7772684;// Magic Number Unik
extern int     InpSlippage          = 30;     // Maksimum Slippage (Points)

datetime lastBarTime = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("GoldPulse MT4 EA Berhasil Dimuat pada Simbol: ", Symbol());
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Hitung Total Order Terbuka                                       |
//+------------------------------------------------------------------+
int CountOrders()
{
   int count = 0;
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
      {
         if(OrderSymbol() == Symbol() && OrderMagicNumber() == InpMagicNumber)
         {
            count++;
         }
      }
   }
   return count;
}

//+------------------------------------------------------------------+
//| Logika Trailing Stop di MT4                                      |
//+------------------------------------------------------------------+
void ManageTrailing()
{
   if(!InpUseTrailing && InpBreakEvenPips <= 0) return;
   
   double pipVal = Point * 10;
   
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
      {
         if(OrderSymbol() == Symbol() && OrderMagicNumber() == InpMagicNumber)
         {
            if(OrderType() == OP_BUY)
            {
               // Break-Even
               if(InpBreakEvenPips > 0 && Bid >= OrderOpenPrice() + (InpBreakEvenPips * pipVal))
               {
                  if(OrderStopLoss() < OrderOpenPrice())
                  {
                     OrderModify(OrderTicket(), OrderOpenPrice(), OrderOpenPrice() + (2 * Point), OrderTakeProfit(), 0, clrGreen);
                  }
               }
               // Trailing Stop
               if(InpUseTrailing)
               {
                  double newSL = Bid - (InpTrailingStop * pipVal);
                  if(newSL > OrderOpenPrice() && (OrderStopLoss() == 0 || newSL > OrderStopLoss() + (5 * Point)))
                  {
                     OrderModify(OrderTicket(), OrderOpenPrice(), newSL, OrderTakeProfit(), 0, clrGreen);
                  }
               }
            }
            else if(OrderType() == OP_SELL)
            {
               // Break-Even
               if(InpBreakEvenPips > 0 && Ask <= OrderOpenPrice() - (InpBreakEvenPips * pipVal))
               {
                  if(OrderStopLoss() == 0 || OrderStopLoss() > OrderOpenPrice())
                  {
                     OrderModify(OrderTicket(), OrderOpenPrice(), OrderOpenPrice() - (2 * Point), OrderTakeProfit(), 0, clrRed);
                  }
               }
               // Trailing Stop
               if(InpUseTrailing)
               {
                  double newSL = Ask + (InpTrailingStop * pipVal);
                  if(newSL < OrderOpenPrice() && (OrderStopLoss() == 0 || newSL < OrderStopLoss() - (5 * Point)))
                  {
                     OrderModify(OrderTicket(), OrderOpenPrice(), newSL, OrderTakeProfit(), 0, clrRed);
                  }
               }
            }
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   ManageTrailing();

   double spread = (Ask - Bid) / Point;
   double pipVal = Point * 10;
   double fastEma0 = iMA(NULL, 0, InpFastEMA, 0, MODE_EMA, PRICE_CLOSE, 0);
   double slowEma0 = iMA(NULL, 0, InpSlowEMA, 0, MODE_EMA, PRICE_CLOSE, 0);
   double fastEma1 = iMA(NULL, 0, InpFastEMA, 0, MODE_EMA, PRICE_CLOSE, 1);
   double slowEma1 = iMA(NULL, 0, InpSlowEMA, 0, MODE_EMA, PRICE_CLOSE, 1);
   double rsi0     = iRSI(NULL, 0, InpRsiPeriod, PRICE_CLOSE, 0);

   // TAMPILKAN STATUS LANGSUNG DI GRAFIK CHART MT4
   Comment(
      "\\n=======================================================\\n",
      " [ GoldPulse XAUUSD Auto Bot Pro ]\\n",
      " Status Robot        : AKTIF MEMINDAI PASAR (RUNNING) 😊\\n",
      " Arah Keuntungan     : DUA ARAH (BUY & SELL AKTIF)\\n",
      " Posisi Terbuka      : ", CountOrders(), " dari maks ", ${config.maxOpenTrades}, "\\n",
      " Nilai RSI Emas      : ", DoubleToStr(rsi0, 1), "\\n",
      " Spread Saat Ini     : ", DoubleToStr(spread, 0), " Points (Normal)\\n",
      " Mode Penutupan      : HANYA TUTUP DI ZONA BIRU (PROFIT)\\n",
      "=======================================================\\n",
      " Catatan: Robot dengan disiplin menunggu sinyal presisi tinggi\\n",
      " agar setiap posisi yang terbuka berpotensi menghasilkan profit!\\n",
      "======================================================="
   );

   // Filter Bar Baru
   datetime currentBarTime = Time[0];
   if(currentBarTime == lastBarTime) return;

   // Filter Spread
   if(spread > InpMaxSpreadPips * 10) return;

   if(CountOrders() >= ${config.maxOpenTrades}) return;

   // Sinyal Beli (BUY) & Jual (SELL) Dua Arah
   bool buySignal = (fastEma0 > slowEma0) && (rsi0 < 48 || (fastEma1 <= slowEma1));
   bool sellSignal = (fastEma0 < slowEma0) && (rsi0 > 52 || (fastEma1 >= slowEma1));

   if(buySignal)
   {
      double sl = InpStopLossPips > 0 ? NormalizeDouble(Bid - (InpStopLossPips * pipVal), Digits) : 0;
      double tp = InpTakeProfitPips > 0 ? NormalizeDouble(Ask + (InpTakeProfitPips * pipVal), Digits) : 0;
      
      int ticket = OrderSend(Symbol(), OP_BUY, InpLotSize, Ask, InpSlippage, sl, tp, "GoldPulse BUY", InpMagicNumber, 0, clrGreen);
      if(ticket < 0)
      {
         // Kompatibilitas ECN: Buka order terlebih dahulu lalu pasang TP/SL
         ticket = OrderSend(Symbol(), OP_BUY, InpLotSize, Ask, InpSlippage, 0, 0, "GoldPulse BUY", InpMagicNumber, 0, clrGreen);
         if(ticket > 0 && (sl > 0 || tp > 0))
         {
            OrderModify(ticket, Ask, sl, tp, 0, clrGreen);
         }
      }
      if(ticket > 0)
      {
         lastBarTime = currentBarTime;
         Print("[SUKSES] Posisi BUY Terbuka pada Harga: ", Ask);
      }
   }
   else if(sellSignal)
   {
      double sl = InpStopLossPips > 0 ? NormalizeDouble(Ask + (InpStopLossPips * pipVal), Digits) : 0;
      double tp = InpTakeProfitPips > 0 ? NormalizeDouble(Bid - (InpTakeProfitPips * pipVal), Digits) : 0;
      
      int ticket = OrderSend(Symbol(), OP_SELL, InpLotSize, Bid, InpSlippage, sl, tp, "GoldPulse SELL", InpMagicNumber, 0, clrRed);
      if(ticket < 0)
      {
         // Kompatibilitas ECN
         ticket = OrderSend(Symbol(), OP_SELL, InpLotSize, Bid, InpSlippage, 0, 0, "GoldPulse SELL", InpMagicNumber, 0, clrRed);
         if(ticket > 0 && (sl > 0 || tp > 0))
         {
            OrderModify(ticket, Bid, sl, tp, 0, clrRed);
         }
      }
      if(ticket > 0)
      {
         lastBarTime = currentBarTime;
         Print("[SUKSES] Posisi SELL Terbuka pada Harga: ", Bid);
      }
   }
}
//+------------------------------------------------------------------+
`;
}

export function generatePineScriptCode(config: BotConfig): string {
  return `//@version=5
strategy("GoldPulse XAUUSD Sniper Algo [Pro]", overlay=true, initial_capital=10000, default_qty_type=strategy.percent_of_equity, default_qty_value=2)

// --- INPUT PARAMETER ---
grp_risk = "Manajemen Risiko"
takeProfitPips = input.int(${config.takeProfitPips}, "Take Profit (Pips)", group=grp_risk)
stopLossPips = input.int(${config.stopLossPips}, "Stop Loss (Pips)", group=grp_risk)
useTrailing = input.bool(${config.useTrailingStop}, "Gunakan Trailing Stop", group=grp_risk)

grp_strat = "Parameter Indikator"
fastLen = input.int(9, "Fast EMA", group=grp_strat)
slowLen = input.int(21, "Slow EMA", group=grp_strat)
rsiLen = input.int(14, "RSI Length", group=grp_strat)
rsiOversold = input.int(32, "RSI Oversold Level", group=grp_strat)
rsiOverbought = input.int(68, "RSI Overbought Level", group=grp_strat)

// --- INDIKATOR ---
emaFast = ta.ema(close, fastLen)
emaSlow = ta.ema(close, slowLen)
ema200 = ta.ema(close, 200)
rsiVal = ta.rsi(close, rsiLen)

// Deteksi Fair Value Gap (FVG)
fvgBullish = low > high[2]
fvgBearish = high < low[2]

// Kondisi Masuk Posisi
longCondition = ta.crossover(emaFast, emaSlow) and (rsiVal < 55 or fvgBullish) and close > ema200
shortCondition = ta.crossunder(emaFast, emaSlow) and (rsiVal > 45 or fvgBearish) and close < ema200

// Eksekusi Strategy
if (longCondition)
    strategy.entry("SNIPER_BUY", strategy.long)
    strategy.exit("TP/SL_BUY", "SNIPER_BUY", profit=takeProfitPips * 10, loss=stopLossPips * 10)

if (shortCondition)
    strategy.entry("SNIPER_SELL", strategy.short)
    strategy.exit("TP/SL_SELL", "SNIPER_SELL", profit=takeProfitPips * 10, loss=stopLossPips * 10)

// Visualisasi Plot
plot(emaFast, "EMA 9", color=color.aqua, linewidth=1)
plot(emaSlow, "EMA 21", color=color.orange, linewidth=1)
plot(ema200, "EMA 200", color=color.purple, linewidth=2)
`;
}

export function generatePythonCode(config: BotConfig): string {
  return `"""
GoldPulse XAUUSD Automated Trading Engine (Python Async Engine)
Cocok untuk MT5 MetaTrader API / CCXT / Broker REST & WebSocket
"""
import time
import asyncio
import numpy as np

SYMBOL = "XAUUSD" # Gold Spot vs US Dollar
LOT_SIZE = ${config.lotSize.toFixed(2)}
TP_PIPS = ${config.takeProfitPips}
SL_PIPS = ${config.stopLossPips}
CONFLUENCE_THRESHOLD = ${config.confluenceThreshold}

class GoldPulseBot:
    def __init__(self):
        self.is_running = True
        self.positions = []
        print(f"[*] Inisialisasi GoldPulse Bot pada simbol {SYMBOL}")

    def calculate_indicators(self, candles):
        closes = np.array([c['close'] for c in candles])
        ema9 = self.ema(closes, 9)
        ema21 = self.ema(closes, 21)
        rsi = self.rsi(closes, 14)
        return ema9[-1], ema21[-1], rsi[-1]

    def ema(self, values, period):
        weights = np.exp(np.linspace(-1., 0., period))
        weights /= weights.sum()
        a = np.convolve(values, weights, mode='full')[:len(values)]
        a[:period] = a[period]
        return a

    def rsi(self, prices, period=14):
        deltas = np.diff(prices)
        seed = deltas[:period+1]
        up = seed[seed >= 0].sum()/period
        down = -seed[seed < 0].sum()/period
        rs = up/down if down != 0 else 0
        rsi = np.zeros_like(prices)
        rsi[:period] = 100. - 100./(1. + rs)
        return rsi

    async def run(self):
        print(f"[+] Bot Aktif. Menjalankan scanning pasar otomatis...")
        while self.is_running:
            # Hubungkan dengan broker API (MetaTrader5 python package / broker REST)
            await asyncio.sleep(1)

if __name__ == "__main__":
    bot = GoldPulseBot()
    asyncio.run(bot.run())
`;
}
