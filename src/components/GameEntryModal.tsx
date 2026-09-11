import React, { useEffect, useState } from 'react';
import { GameEconomy } from '../utils/gameEconomy';
import { getUserPoints, getUserGems } from '../utils/pointsManager';

interface GameEntryModalProps {
  onOpenWheel?: () => void;
  onMatchStarted?: () => void;
}

export const GameEntryModal: React.FC<GameEntryModalProps> = ({
  onOpenWheel,
  onMatchStarted,
}) => {
  const [activeGameTitle, setActiveGameTitle] = useState<string>(
    GameEconomy.playerState.activeGameTitle || 'Game'
  );
  const [coins, setCoins] = useState<number>(getUserPoints());
  const [gems, setGems] = useState<number>(getUserGems());
  const [, setEconomyTick] = useState<number>(0);

  useEffect(() => {
    if (onMatchStarted) {
      GameEconomy.setMatchStartListener(onMatchStarted);
    }
    if (onOpenWheel) {
      GameEconomy.setWheelOpenListener(onOpenWheel);
    }

    const handleEconomyUpdate = () => {
      setCoins(getUserPoints());
      setGems(getUserGems());
      setEconomyTick((t) => t + 1);
    };

    const handleModalOpened = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.gameTitle) {
        setActiveGameTitle(customEvent.detail.gameTitle);
      } else if (GameEconomy.playerState.activeGameTitle) {
        setActiveGameTitle(GameEconomy.playerState.activeGameTitle);
      }
      setCoins(getUserPoints());
      setGems(getUserGems());
      setEconomyTick((t) => t + 1);
    };

    window.addEventListener('admin_fee_updated', handleEconomyUpdate);
    window.addEventListener('admin_economy_updated', handleEconomyUpdate);
    window.addEventListener('global_config_updated', handleEconomyUpdate);
    window.addEventListener('chess_points_updated', handleEconomyUpdate);
    window.addEventListener('chess_gems_updated', handleEconomyUpdate);
    window.addEventListener('game_entry_modal_opened', handleModalOpened);
    window.addEventListener('storage', handleEconomyUpdate);

    return () => {
      window.removeEventListener('admin_fee_updated', handleEconomyUpdate);
      window.removeEventListener('admin_economy_updated', handleEconomyUpdate);
      window.removeEventListener('global_config_updated', handleEconomyUpdate);
      window.removeEventListener('chess_points_updated', handleEconomyUpdate);
      window.removeEventListener('chess_gems_updated', handleEconomyUpdate);
      window.removeEventListener('game_entry_modal_opened', handleModalOpened);
      window.removeEventListener('storage', handleEconomyUpdate);
    };
  }, [onMatchStarted, onOpenWheel]);

  const isFree = GameEconomy.isFreeMode();
  const feeCoins = isFree ? 0 : GameEconomy.getFeeCoins(activeGameTitle);
  const feeGems = isFree ? 0 : GameEconomy.getFeeGems(activeGameTitle);
  const isZero = isFree || (feeCoins === 0 && feeGems === 0);

  const coinsButtonLabel = isZero
    ? 'Play Free (0 🪙)'
    : `Play with ${feeCoins.toLocaleString()} 🪙`;

  const gemsButtonLabel = isZero
    ? 'Play Free (0 💎)'
    : `Play with ${feeGems.toLocaleString()} 💎`;

  return (
    <div
      id="gameEntryModal"
      className="admin-modal-overlay hidden"
      style={{
        display: 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(0,0,0,0.85)',
        zIndex: 9999,
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        className="auth-card"
        style={{
          background: '#11111c',
          border: '1px solid #232336',
          borderRadius: '16px',
          padding: '24px',
          textAlign: 'center',
          width: '360px',
          color: '#fff',
        }}
      >
        {/* Step A: Select Payment Method */}
        <div id="entrySelectStep">
          <h2
            id="entryGameTitle"
            style={{ color: '#60a5fa', margin: '0 0 8px 0', fontSize: '20px', fontWeight: 'bold' }}
          >
            🎮 Play {activeGameTitle}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>
            Choose currency to start match:
          </p>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <button
              id="btnPlayWithCoins"
              type="button"
              onClick={() => GameEconomy.confirmAndStartGame('coins', activeGameTitle)}
              style={{
                flex: 1,
                background: isZero ? '#10b981' : '#eab308',
                color: isZero ? '#fff' : '#000',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              {coinsButtonLabel}
            </button>
            <button
              id="btnPlayWithGems"
              type="button"
              onClick={() => GameEconomy.confirmAndStartGame('gems', activeGameTitle)}
              style={{
                flex: 1,
                background: isZero ? '#059669' : '#3b82f6',
                color: '#fff',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              {gemsButtonLabel}
            </button>
          </div>

          {/* Real-time player balance summary */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '6px 10px',
              background: '#181828',
              borderRadius: '8px',
              fontSize: '11px',
              color: '#94a3b8',
              marginBottom: '16px',
              fontFamily: 'monospace',
            }}
          >
            <span id="playerCoinsModal">🪙 {coins.toLocaleString()} Coins</span>
            <span id="playerGemsModal">💎 {gems.toLocaleString()} Gems</span>
          </div>

          <button
            id="btnCancelEntry"
            type="button"
            onClick={() => GameEconomy.closeEntryModal()}
            style={{
              width: '100%',
              background: '#262626',
              color: '#aaa',
              border: 'none',
              padding: '10px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>

        {/* Step B: Insufficient Balance Warning */}
        <div id="insufficientStep" className="hidden">
          <h2
            id="insufficientTitle"
            style={{ color: '#ef4444', margin: '0 0 8px 0', fontSize: '20px', fontWeight: 'bold' }}
          >
            ⚠️ Insufficient Funds
          </h2>
          <p
            id="insufficientMsg"
            style={{ color: '#cbd5e1', fontSize: '13px', marginBottom: '20px', lineHeight: '1.5' }}
          ></p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              id="btnSpinWheelFromModal"
              type="button"
              onClick={() => GameEconomy.spinWheel()}
              style={{
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                color: '#fff',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              🎡 Spin Wheel of Fortune
            </button>
            <button
              id="btnCloseInsufficient"
              type="button"
              onClick={() => GameEconomy.closeEntryModal()}
              style={{
                background: '#262626',
                color: '#aaa',
                border: 'none',
                padding: '10px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
