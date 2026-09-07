import React, { useState, useEffect } from 'react';
import { 
  History, 
  Gift, 
  Flame, 
  Trophy, 
  Coins, 
  Sparkles, 
  Copy, 
  Check, 
  Play, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  X, 
  RefreshCw,
  Share2,
  Users,
  ShieldCheck
} from 'lucide-react';
import { 
  CoinTransactionRecord, 
  fetchCoinHistory, 
  getDailyLoginStatus, 
  claimDailyLoginReward, 
  getMysteryBoxStatus, 
  claimMysteryBox, 
  getAdRewardStatus, 
  claimAdWatchReward, 
  getWinStreak, 
  generateUserReferralCode, 
  claimReferralCode,
  DAILY_LADDER_REWARDS
} from '../utils/coinRewardEngine';
import { getUserPoints, getUserGems } from '../utils/pointsManager';

interface CoinHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'ledger' | 'earn' | 'streaks';
  username?: string;
}

export const CoinHistoryModal: React.FC<CoinHistoryModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'ledger',
  username = 'Player'
}) => {
  const [activeTab, setActiveTab] = useState<'ledger' | 'earn' | 'streaks'>(defaultTab);
  const [transactions, setTransactions] = useState<CoinTransactionRecord[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [referralInput, setReferralInput] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Live state
  const [userCoins, setUserCoins] = useState(() => getUserPoints());
  const [userGems, setUserGems] = useState(() => getUserGems());
  const [dailyStatus, setDailyStatus] = useState(() => getDailyLoginStatus());
  const [mysteryStatus, setMysteryStatus] = useState(() => getMysteryBoxStatus());
  const [adStatus, setAdStatus] = useState(() => getAdRewardStatus());
  const [winStreak, setWinStreakState] = useState(() => getWinStreak());

  const myReferralCode = generateUserReferralCode(username);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const records = await fetchCoinHistory(40);
      setTransactions(records);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      loadData();
      setUserCoins(getUserPoints());
      setUserGems(getUserGems());
      setDailyStatus(getDailyLoginStatus());
      setMysteryStatus(getMysteryBoxStatus());
      setAdStatus(getAdRewardStatus());
      setWinStreakState(getWinStreak());
    }
  }, [isOpen, defaultTab]);

  useEffect(() => {
    const handlePointsUpdate = () => {
      setUserCoins(getUserPoints());
      setUserGems(getUserGems());
    };
    const handleTxLogged = () => {
      loadData();
    };

    window.addEventListener('chess_points_updated', handlePointsUpdate);
    window.addEventListener('chess_gems_updated', handlePointsUpdate);
    window.addEventListener('coin_transaction_logged', handleTxLogged);

    return () => {
      window.removeEventListener('chess_points_updated', handlePointsUpdate);
      window.removeEventListener('chess_gems_updated', handlePointsUpdate);
      window.removeEventListener('coin_transaction_logged', handleTxLogged);
    };
  }, []);

  // Periodic timer for countdown updates
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setDailyStatus(getDailyLoginStatus());
      setMysteryStatus(getMysteryBoxStatus());
      setAdStatus(getAdRewardStatus());
    }, 5000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const showNotification = (text: string, type: 'success' | 'error') => {
    setActionFeedback({ text, type });
    setTimeout(() => setActionFeedback(null), 3500);
  };

  const handleClaimDaily = async () => {
    const res = await claimDailyLoginReward();
    if (res.success) {
      showNotification(res.message, 'success');
      setDailyStatus(getDailyLoginStatus());
      loadData();
    } else {
      showNotification(res.message, 'error');
    }
  };

  const handleClaimMystery = async () => {
    const res = await claimMysteryBox();
    if (res.success) {
      showNotification(res.message, 'success');
      setMysteryStatus(getMysteryBoxStatus());
      loadData();
    } else {
      showNotification(res.message, 'error');
    }
  };

  const handleWatchAd = async () => {
    const res = await claimAdWatchReward();
    if (res.success) {
      showNotification(res.message, 'success');
      setAdStatus(getAdRewardStatus());
      loadData();
    } else {
      showNotification(res.message, 'error');
    }
  };

  const handleRedeemReferral = async () => {
    if (!referralInput.trim()) return;
    const res = await claimReferralCode(referralInput);
    if (res.success) {
      showNotification(res.message, 'success');
      setReferralInput('');
      loadData();
    } else {
      showNotification(res.message, 'error');
    }
  };

  const handleCopyReferral = () => {
    try {
      navigator.clipboard.writeText(myReferralCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
      showNotification('Referral code copied to clipboard!', 'success');
    } catch {
      showNotification(`Code: ${myReferralCode}`, 'success');
    }
  };

  if (!isOpen) return null;

  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'all') return true;
    if (filterType === 'earnings') return t.amount > 0;
    if (filterType === 'spent') return t.amount < 0;
    if (filterType === 'matches') return t.type === 'match_win' || t.type === 'match_draw' || t.type === 'match_entry';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-3 sm:p-4 animate-fadeIn">
      <div className="bg-[#0b0f19] border border-slate-800/90 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl shadow-black/95 flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-[#070a12] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black text-xl shadow-[0_0_15px_rgba(245,158,11,0.5)] border border-amber-300">
              🪙
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
                <span>Coin Ledger &amp; Rewards Hub</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/40">
                  Firestore Ledger
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Track transactions, claim daily earnings, and boost match rewards
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Balances Pill */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="font-mono text-xs font-black text-amber-300">
                🪙 {userCoins.toLocaleString()}
              </span>
              <span className="text-slate-600">|</span>
              <span className="font-mono text-xs font-black text-fuchsia-300">
                💎 {userGems.toLocaleString()}
              </span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {actionFeedback && (
          <div className={`px-4 py-2 text-xs font-bold text-center border-b ${
            actionFeedback.type === 'success' 
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' 
              : 'bg-rose-950/80 text-rose-300 border-rose-500/40'
          }`}>
            {actionFeedback.text}
          </div>
        )}

        {/* Top Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-[#080c16] px-4 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('ledger')}
            className={`pb-3 px-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'ledger'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Transaction Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab('earn')}
            className={`pb-3 px-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'earn'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Earn Free Coins</span>
            {dailyStatus.canClaim && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('streaks')}
            className={`pb-3 px-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'streaks'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Streak Multipliers</span>
            {winStreak > 0 && (
              <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-mono">
                {winStreak}x
              </span>
            )}
          </button>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          
          {/* ------------------------------------------------------------- */}
          {/* TAB 1: TRANSACTION LEDGER                                     */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'ledger' && (
            <div className="space-y-4">
              {/* Filter Row */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      filterType === 'all' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All ({transactions.length})
                  </button>
                  <button
                    onClick={() => setFilterType('earnings')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      filterType === 'earnings' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Earnings (+)
                  </button>
                  <button
                    onClick={() => setFilterType('spent')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      filterType === 'spent' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Spent (-)
                  </button>
                  <button
                    onClick={() => setFilterType('matches')}
                    className={`px-3 py-1 rounded-lg font-bold transition ${
                      filterType === 'matches' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Matches
                  </button>
                </div>

                <button
                  onClick={loadData}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Transactions List */}
              {filteredTransactions.length === 0 ? (
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-8 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 mx-auto flex items-center justify-center text-slate-500 text-xl">
                    📜
                  </div>
                  <div className="text-sm font-bold text-white">No transactions recorded yet</div>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Play matches, spin the Daily Wheel, or claim login bonuses to see your coin history logged here.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTransactions.map((tx) => {
                    const isPositive = tx.amount > 0;
                    return (
                      <div
                        key={tx.txId}
                        className="bg-[#0e1322] border border-slate-800/80 hover:border-slate-700/90 rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-3 transition"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                            isPositive
                              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                              : 'bg-rose-950/60 border-rose-500/40 text-rose-400'
                          }`}>
                            {isPositive ? (
                              <ArrowUpRight className="w-4 h-4" />
                            ) : (
                              <ArrowDownRight className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-white truncate">
                              {tx.description}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                              <span>{new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span>•</span>
                              <span className="capitalize">{tx.type.replace(/_/g, ' ')}</span>
                              <span>•</span>
                              <span className="text-slate-500">Balance: 🪙 {tx.balanceAfter?.toLocaleString() || '—'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className={`font-mono text-xs sm:text-sm font-black ${
                            isPositive ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {isPositive ? `+${tx.amount.toLocaleString()}` : tx.amount.toLocaleString()} 🪙
                          </div>
                          <div className="text-[9px] font-bold text-slate-500 flex items-center gap-1 justify-end">
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                            <span>Verified</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 2: EARN FREE COINS                                        */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'earn' && (
            <div className="space-y-4">
              
              {/* Daily Login 7-Day Progressive Ladder */}
              <div className="bg-gradient-to-br from-[#121829] to-[#0c101c] border border-indigo-500/30 rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>7-Day Daily Login Calendar</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white">
                      Consecutive Days Reward Ladder
                    </h3>
                  </div>

                  <button
                    onClick={handleClaimDaily}
                    disabled={!dailyStatus.canClaim}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition shadow-md flex items-center gap-1.5 ${
                      dailyStatus.canClaim
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 cursor-pointer shadow-amber-500/30'
                        : 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    {dailyStatus.canClaim ? (
                      <>
                        <Gift className="w-3.5 h-3.5" />
                        <span>Claim Day {dailyStatus.currentDay} (+{dailyStatus.rewardForToday.coins} 🪙)</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Claimed (Cooldown)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 7-Day Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 pt-1">
                  {DAILY_LADDER_REWARDS.map((item) => {
                    const isToday = item.day === dailyStatus.currentDay;
                    const isPast = item.day < dailyStatus.currentDay;
                    return (
                      <div
                        key={item.day}
                        className={`rounded-xl p-2.5 text-center border transition flex flex-col items-center justify-between ${
                          isToday
                            ? 'bg-amber-500/20 border-amber-400/80 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                            : isPast
                            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300/70'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400'
                        }`}
                      >
                        <span className="text-[10px] font-black uppercase text-slate-400">
                          Day {item.day}
                        </span>
                        <div className="my-1.5 text-base">
                          {item.day === 7 ? '👑' : item.gems > 0 ? '💎' : '🪙'}
                        </div>
                        <span className={`text-xs font-mono font-black ${
                          isToday ? 'text-amber-300' : 'text-white'
                        }`}>
                          +{item.coins}
                        </span>
                        {item.gems > 0 && (
                          <span className="text-[9px] font-mono text-fuchsia-300">
                            +{item.gems}💎
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2 Side-by-Side Retention Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* 1. Timed Mystery Chest (Every 2h) */}
                <div className="bg-[#0e1322] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-500/40 flex items-center justify-center text-xl">
                        🎁
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Timed Mystery Box</div>
                        <div className="text-[10px] text-slate-400">Claim 30–75 Coins every 2 hours</div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleClaimMystery}
                    disabled={!mysteryStatus.canClaim}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                      mysteryStatus.canClaim
                        ? 'bg-purple-600 hover:bg-purple-500 text-white cursor-pointer shadow-lg shadow-purple-600/30'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    {mysteryStatus.canClaim ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Open Mystery Chest</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        <span>Ready in ~{Math.ceil(mysteryStatus.cooldownRemainingMs / (60 * 1000))}m</span>
                      </>
                    )}
                  </button>
                </div>

                {/* 2. Rewarded Sponsor Ad Video */}
                <div className="bg-[#0e1322] border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-xl">
                        📺
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Watch Sponsor Video</div>
                        <div className="text-[10px] text-slate-400">Earn instant +100 Coins reward</div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleWatchAd}
                    disabled={!adStatus.canWatch}
                    className={`w-full py-2.5 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                      adStatus.canWatch
                        ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white cursor-pointer shadow-lg shadow-cyan-600/30'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    }`}
                  >
                    {adStatus.canWatch ? (
                      <>
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Watch Ad (+100 Coins)</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        <span>Available in {Math.ceil(adStatus.cooldownMs / 1000)}s</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Referral & Invite Friends System */}
              <div className="bg-[#0e1322] border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wider">
                  <Users className="w-4 h-4" />
                  <span>Referral &amp; Social Growth Program</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Share My Code */}
                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-white">Your Unique Referral Code</div>
                    <p className="text-[10px] text-slate-400">
                      Give this code to friends. When they enter it, both of you earn <strong className="text-amber-300">+200 Coins</strong>!
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-sm font-black text-amber-300">
                        {myReferralCode}
                      </div>
                      <button
                        onClick={handleCopyReferral}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1 transition"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Redeem Code */}
                  <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
                    <div className="text-xs font-bold text-white">Enter Friend's Referral Code</div>
                    <p className="text-[10px] text-slate-400">
                      Got an invite code from a friend? Claim your <strong className="text-emerald-300">+200 Coins</strong> sign-up bonus.
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="ENTER CODE"
                        value={referralInput}
                        onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                        maxLength={12}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 font-mono text-xs uppercase text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                      />
                      <button
                        onClick={handleRedeemReferral}
                        disabled={!referralInput.trim()}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs transition"
                      >
                        Redeem
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* TAB 3: STREAKS & GAMEPLAY REWARDS                            */}
          {/* ------------------------------------------------------------- */}
          {activeTab === 'streaks' && (
            <div className="space-y-4">
              
              {/* Win Streak Multiplier Banner */}
              <div className="bg-gradient-to-r from-amber-950/50 via-slate-900 to-indigo-950/50 border border-amber-500/40 rounded-2xl p-5 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wider">
                    <Flame className="w-4 h-4 text-amber-400 fill-amber-400/20 animate-pulse" />
                    <span>Active Match Win Streak</span>
                  </div>
                  <h3 className="text-2xl font-black text-white font-mono">
                    {winStreak} Consecutively Won Matches
                  </h3>
                  <p className="text-xs text-slate-300">
                    {winStreak >= 3 
                      ? `Active Streak Bonus: +${Math.min(250, (winStreak - 2) * 50)} bonus coins on your next victory!`
                      : 'Win 3 matches in a row to activate consecutive win streak bonus multipliers!'}
                  </p>
                </div>

                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex flex-col items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                  <span className="text-xl">🔥</span>
                  <span className="text-xs font-mono font-black text-amber-300">{winStreak}x</span>
                </div>
              </div>

              {/* Reward Rules Table */}
              <div className="bg-[#0e1322] border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Gameplay &amp; Activity Coin Reward Rates
                </h4>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">🏆</span>
                      <div>
                        <div className="font-bold text-white">Match Victory</div>
                        <div className="text-[10px] text-slate-400">Awarded for beating AI or human opponent</div>
                      </div>
                    </div>
                    <span className="font-mono font-black text-emerald-400">+100 Coins</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">🔥</span>
                      <div>
                        <div className="font-bold text-white">Win Streak Bonus (3+ Wins)</div>
                        <div className="text-[10px] text-slate-400">Cumulative bonus per win beyond 2 wins</div>
                      </div>
                    </div>
                    <span className="font-mono font-black text-amber-400">+50 to +250 Coins</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">🤝</span>
                      <div>
                        <div className="font-bold text-white">Draw / Stalemate</div>
                        <div className="text-[10px] text-slate-400">Consolation reward for evenly matched games</div>
                      </div>
                    </div>
                    <span className="font-mono font-black text-slate-300">+25 Coins</span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">📢</span>
                      <div>
                        <div className="font-bold text-white">Victory Social Share</div>
                        <div className="text-[10px] text-slate-400">Share match victory progress card</div>
                      </div>
                    </div>
                    <span className="font-mono font-black text-sky-400">+50 Coins</span>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
