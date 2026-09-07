import React, { useState } from 'react';
import { BOARD_CARDS_DATA } from '../data/boardCards';
import { soundFx } from '../utils/audio';

export interface ChanceAndIMFModalProps {
  spaceType: 'CHANCE' | 'IMF';
  playerName: string;
  playerMoney: number;
  onUpdateMoney: (newMoney: number) => void;
  onSendToJail?: () => void;
  onClose: () => void;
  soundEnabled?: boolean;
}

export default function ChanceAndIMFModal({
  spaceType,
  playerName,
  playerMoney,
  onUpdateMoney,
  onSendToJail,
  onClose,
  soundEnabled = true,
}: ChanceAndIMFModalProps) {
  const [rolledNumber, setRolledNumber] = useState<number | null>(null);
  const [cardResult, setCardResult] = useState<{ roll: number; text: string; amountDelta?: number } | null>(null);
  const [isRollingAnimation, setIsRollingAnimation] = useState(false);

  // Handle rolling a number between 2 and 12
  const handleRollCard = () => {
    setIsRollingAnimation(true);
    if (soundEnabled) soundFx.playMove();

    setTimeout(() => {
      const roll = Math.floor(Math.random() * 11) + 2; // Generates random number from 2 to 12
      setRolledNumber(roll);
      setIsRollingAnimation(false);

      const isEven = roll % 2 === 0;
      let selectedCategory: 'chanceEven' | 'chanceOdd' | 'imfEven' | 'imfOdd';

      if (spaceType === 'CHANCE') {
        selectedCategory = isEven ? 'chanceEven' : 'chanceOdd';
      } else {
        selectedCategory = isEven ? 'imfEven' : 'imfOdd';
      }

      const actionText =
        BOARD_CARDS_DATA[selectedCategory].actions[roll] ||
        `International economic development event. Collect $2,000.`;

      const delta = parseAndApplyTransaction(actionText);
      setCardResult({ roll, text: actionText, amountDelta: delta });

      if (actionText.toLowerCase().includes('go to jail') || actionText.toLowerCase().includes('jail')) {
        if (onSendToJail) onSendToJail();
      }
    }, 400);
  };

  const parseAndApplyTransaction = (text: string): number => {
    const amountMatch = text.match(/\$([0-9,]+)/);
    if (!amountMatch) return 0;

    const amount = parseInt(amountMatch[1].replace(/,/g, ''), 10);
    let delta = 0;
    let newMoney = playerMoney;

    const lowerText = text.toLowerCase();
    if (lowerText.includes('pay') || lowerText.includes('deposit') || lowerText.includes('fine') || lowerText.includes('penalty')) {
      newMoney = Math.max(0, playerMoney - amount);
      delta = -amount;
      if (soundEnabled) soundFx.playCapture();
    } else if (lowerText.includes('collect') || lowerText.includes('receive') || lowerText.includes('won') || lowerText.includes('grant') || lowerText.includes('dividend')) {
      newMoney = playerMoney + amount;
      delta = amount;
      if (soundEnabled) soundFx.playCheck();
    }

    onUpdateMoney(newMoney);
    return delta;
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-slate-900 border-2 border-yellow-500 rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.3)] text-white p-6 text-center relative">
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-yellow-400 rounded-tl-2xl"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-yellow-400 rounded-tr-2xl"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-yellow-400 rounded-bl-2xl"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-yellow-400 rounded-br-2xl"></div>

        {/* Header */}
        <div className="mb-4">
          <span className="text-xs uppercase tracking-widest text-yellow-400 font-bold bg-yellow-500/10 px-3.5 py-1 rounded-full border border-yellow-500/30 inline-block shadow-sm">
            {spaceType === 'CHANCE' ? '🎲 Business Chance Card' : '🏦 International Monetary Fund'}
          </span>
          <h2 className="text-2xl font-black mt-2 text-white tracking-tight">
            {playerName}'s Draw
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Current Treasury: <span className="text-yellow-400 font-mono font-bold">${playerMoney.toLocaleString()}</span>
          </p>
        </div>

        {/* Content Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 mb-5 min-h-[140px] flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#eab308_1px,transparent_1px)] [background-size:12px_12px]"></div>

          {rolledNumber === null ? (
            <div className="space-y-2 z-10">
              <div className="w-12 h-12 mx-auto rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-2xl text-yellow-400">
                {spaceType === 'CHANCE' ? '❓' : '🏛️'}
              </div>
              <p className="text-slate-300 text-sm font-medium">
                Click below to roll a 2-dice number (2 to 12) and draw your fortune
              </p>
            </div>
          ) : (
            <div className="space-y-3 animate-fadeIn z-10 w-full">
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-400 text-slate-950 font-black text-lg px-4 py-1.5 rounded-lg shadow-md">
                <span>Rolled: {rolledNumber}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-950/20 uppercase">
                  {rolledNumber % 2 === 0 ? 'Even' : 'Odd'}
                </span>
              </div>
              
              <p className="text-sm sm:text-base font-semibold text-slate-100 leading-snug bg-slate-900/90 p-3 rounded-lg border border-slate-700/60">
                {cardResult?.text}
              </p>

              {cardResult?.amountDelta !== undefined && cardResult.amountDelta !== 0 && (
                <div
                  className={`text-xs font-black font-mono px-3 py-1 rounded-md inline-block ${
                    cardResult.amountDelta > 0
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {cardResult.amountDelta > 0
                    ? `+ $${cardResult.amountDelta.toLocaleString()}`
                    : `- $${Math.abs(cardResult.amountDelta).toLocaleString()}`}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex gap-3">
          {rolledNumber === null ? (
            <button
              onClick={handleRollCard}
              disabled={isRollingAnimation}
              className="w-full bg-gradient-to-r from-yellow-500 to-amber-400 hover:from-yellow-400 hover:to-amber-300 text-slate-950 font-black py-3 rounded-xl shadow-lg transition-all uppercase tracking-wider text-sm active:scale-95 disabled:opacity-50"
            >
              {isRollingAnimation ? 'Rolling Dice...' : 'Roll Card Number (2-12)'}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl shadow transition-all uppercase tracking-wider text-sm active:scale-95 border border-slate-700"
            >
              Confirm & Continue Turn
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
