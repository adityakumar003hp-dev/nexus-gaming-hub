// src/components/PlayerAndMarketDashboard.tsx
import React from 'react';
import { StockListing, StockHolding, PlayerCashDenominations, PlayerDocuments } from '../utils/gameEconomicsSetup';
import { X, TrendingUp, DollarSign, FileText, Globe } from 'lucide-react';

export interface PlayerPortfolioData {
  name: string;
  money: number;
  cashDenominations?: PlayerCashDenominations;
  documents?: PlayerDocuments;
  stocks?: Record<string, StockHolding>;
  lowIncomeWarnings?: number;
}

export interface PlayerAndMarketDashboardProps {
  player: PlayerPortfolioData;
  stocks: StockListing[];
  onBuyStock: (stockId: string, stockPrice: number, quantity: number) => void;
  onSellStock: (stockId: string, stockPrice: number, quantity: number) => void;
  onCashOutProfit?: (stockId: string, stockPrice: number) => void;
  onRegainDocument?: (docType: 'visa' | 'passport', cost: number) => void;
  onTriggerBlackMoneyCheck?: () => void;
  onClose?: () => void;
}

export default function PlayerAndMarketDashboard({
  player,
  stocks,
  onBuyStock,
  onSellStock,
  onCashOutProfit,
  onRegainDocument,
  onTriggerBlackMoneyCheck,
  onClose
}: PlayerAndMarketDashboardProps) {
  const denominations = player.cashDenominations || {
    "10000": 1,
    "5000": 1,
    "1000": 1,
    "500": 1,
    "100": 1,
    "50": 1
  };

  const documents = player.documents || {
    VISA: 1,
    PASSPORT: 1
  };

  return (
    <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden text-white">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition z-10"
          aria-label="Close Dashboard"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 text-white">
        {/* Player Wallet & Default Credentials Panel */}
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl space-y-3 shadow-xl">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400">
              Player Portfolio: {player.name}
            </h3>
          </div>
          
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-400">Total Liquid Cash</div>
              {player.money < 2500 ? (
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-950/90 border border-amber-500 text-amber-300 animate-pulse">
                  ⚠️ Low Income ({player.lowIncomeWarnings || 1}/3)
                </span>
              ) : (
                <span className="text-[10px] font-bold text-emerald-400">Safe Income</span>
              )}
            </div>
            <div className={`text-2xl font-extrabold ${player.money < 2500 ? 'text-amber-400' : 'text-emerald-400'}`}>
              ${player.money.toLocaleString()}
            </div>
            {player.money < 2500 && (
              <p className="text-[10px] text-rose-400 mt-1">
                Threshold: &lt; $2,500. 3 consecutive warnings trigger automated bankruptcy.
              </p>
            )}
          </div>

          {/* Bill Breakdown */}
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Cash Denomination Reserve (Default $16,650)
            </span>
            <div className="grid grid-cols-3 gap-2 text-xs bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div><span className="text-slate-400">$10k:</span> {denominations["10000"] ?? 1}</div>
              <div><span className="text-slate-400">$5k:</span> {denominations["5000"] ?? 1}</div>
              <div><span className="text-slate-400">$1k:</span> {denominations["1000"] ?? 1}</div>
              <div><span className="text-slate-400">$500:</span> {denominations["500"] ?? 1}</div>
              <div><span className="text-slate-400">$100:</span> {denominations["100"] ?? 1}</div>
              <div><span className="text-slate-400">$50:</span> {denominations["50"] ?? 1}</div>
            </div>
          </div>

          {/* Default Travel Credentials & Black Money Status */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                International Travel Documents
              </span>
              {player.money > 40000 && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-950 border border-rose-600 text-rose-300 animate-pulse">
                  ⚠️ Black Money Risk (&gt;$40k)
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Visa */}
              <div className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                documents.visaCaptured
                  ? 'bg-rose-950/40 border-rose-600/60'
                  : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-cyan-300" />
                    <span className="text-cyan-300 font-bold">Visa</span>
                  </div>
                  {documents.visaCaptured && (
                    <span className="text-[9px] font-black px-1 rounded bg-rose-600 text-white uppercase">
                      Captured
                    </span>
                  )}
                </div>
                <div className="text-[10px] mt-1 flex items-center justify-between">
                  <span className={documents.visaCaptured ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>
                    {documents.visaCaptured ? 'Status: Confiscated' : `Owned: ${documents.VISA ?? 1}`}
                  </span>
                  {documents.visaCaptured && onRegainDocument && (
                    <button
                      onClick={() => onRegainDocument('visa', 10000)}
                      className="px-1.5 py-0.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-[9px] transition cursor-pointer"
                    >
                      Regain ($10k)
                    </button>
                  )}
                </div>
              </div>

              {/* Passport */}
              <div className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                documents.passportCaptured
                  ? 'bg-rose-950/40 border-rose-600/60'
                  : 'bg-slate-950 border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-300" />
                    <span className="text-amber-300 font-bold">Passport</span>
                  </div>
                  {documents.passportCaptured && (
                    <span className="text-[9px] font-black px-1 rounded bg-rose-600 text-white uppercase">
                      Captured
                    </span>
                  )}
                </div>
                <div className="text-[10px] mt-1 flex items-center justify-between">
                  <span className={documents.passportCaptured ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>
                    {documents.passportCaptured ? 'Status: Confiscated' : `Owned: ${documents.PASSPORT ?? 1}`}
                  </span>
                  {documents.passportCaptured && onRegainDocument && (
                    <button
                      onClick={() => onRegainDocument('passport', 5000)}
                      className="px-1.5 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[9px] transition cursor-pointer"
                    >
                      Regain ($5k)
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Stock Market Panel */}
        <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl space-y-3 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Stock Exchange Market
                </h3>
              </div>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                ● Live Ticking
              </span>
            </div>

            <div className="space-y-2 mt-3 max-h-72 overflow-y-auto pr-1">
              {stocks.map(stock => {
                const holding = player.stocks?.[stock.id];
                const holdings = holding?.shares || 0;
                const isUp = stock.isPositive;
                const costBasis = holdings * (holding?.avgBuyPrice || 0);
                const currentValue = holdings * stock.price;
                const profit = currentValue - costBasis;

                return (
                  <div
                    key={stock.id}
                    className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between transition hover:border-slate-700"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-100">{stock.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm font-extrabold text-white">${stock.price.toLocaleString()}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                            isUp ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-rose-950 text-rose-400 border border-rose-800/50'
                          }`}
                        >
                          {stock.changeIndicator || "0.0%"}
                        </span>
                      </div>
                      {holdings > 0 && (
                        <div className="text-[10px] text-purple-400 mt-1 flex items-center gap-2">
                          <span>Shares: <span className="font-bold text-purple-300">{holdings}</span></span>
                          {profit > 0 && (
                            <span className="text-emerald-400 font-bold">
                              Profit: +${profit.toLocaleString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <button
                        onClick={() => onBuyStock(stock.id, stock.price, 1)}
                        className="bg-purple-600 hover:bg-purple-500 active:scale-95 px-2.5 py-1 rounded text-xs font-semibold shadow text-white transition cursor-pointer"
                      >
                        Buy
                      </button>
                      {holdings > 0 && (
                        <button
                          onClick={() => onSellStock(stock.id, stock.price, 1)}
                          className="bg-rose-600 hover:bg-rose-500 active:scale-95 px-2.5 py-1 rounded text-xs font-semibold shadow text-white transition cursor-pointer"
                        >
                          Sell
                        </button>
                      )}
                      {holdings > 0 && onCashOutProfit && (
                        <button
                          onClick={() => onCashOutProfit(stock.id, stock.price)}
                          disabled={profit <= 0}
                          title={profit > 0 ? `Cash out +$${profit.toLocaleString()} gain directly to cash balance` : 'No profit available to cash out'}
                          className={`px-2.5 py-1 rounded text-xs font-semibold shadow transition cursor-pointer ${
                            profit > 0
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white animate-pulse active:scale-95'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          Cash Out Profit
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
