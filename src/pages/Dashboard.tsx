import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useStellar } from '@/contexts/StellarContext';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, TrendingUp, Gift, Briefcase, ArrowRight, DollarSign, X, Sparkles, Clock, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';

export default function Dashboard() {
  const { profile, user } = useAuth();
  const { connected, balance: walletBalance } = useWallet();
  const { network } = useStellar();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ scheduled: 0, vaulted: 0, earned: 0, redeemed: 0, nextPayout: null as Date | null });
  const [showStory, setShowStory] = useState(() => {
    return localStorage.getItem('nexol-story-dismissed') !== 'true';
  });

  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'there';

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      const [schedulerRes, schedulerTxRes, giftCardRes] = await Promise.all([
        supabase.from('scheduler_positions').select('total_amount').eq('user_id', user.id).eq('status', 'active'),
        supabase.from('scheduler_transactions').select('unlock_timestamp').eq('user_id', user.id).eq('submitted', false).order('unlock_timestamp', { ascending: true }).limit(1),
        supabase.from('gift_card_redemptions').select('usdt_payout').eq('user_id', user.id).eq('status', 'approved'),
      ]);

      const scheduled = schedulerRes.data?.reduce((s, r) => s + Number(r.total_amount), 0) ?? 0;
      const vaulted = 0;
      const earned = 0;
      const redeemed = giftCardRes.data?.reduce((s, r) => s + Number(r.usdt_payout), 0) ?? 0;

      const nextPayout = schedulerTxRes.data?.[0]
        ? new Date(Number(schedulerTxRes.data[0].unlock_timestamp) * 1000)
        : null;

      setStats({ scheduled, vaulted, earned, redeemed, nextPayout });
    };

    fetchStats();
  }, [user]);

  const dismissStory = () => {
    setShowStory(false);
    localStorage.setItem('nexol-story-dismissed', 'true');
  };

  const statCards = [
    { label: 'Wallet Balance', value: profile?.usdc_balance ?? 0, unit: 'USDC', icon: DollarSign, color: 'text-primary' },
    { label: 'Scheduled', value: stats.scheduled, unit: 'in escrow', icon: CalendarClock, color: 'text-primary' },
    { label: 'Gift Cards Redeemed', value: stats.redeemed, unit: 'USDC payouts', icon: TrendingUp, color: 'text-primary' },
  ];

  const quickActions = [
    { icon: CalendarClock, title: 'Income Scheduler', desc: 'Automate weekly payouts', to: '/dashboard/scheduler' },
    { icon: Gift, title: 'Redeem Gift Card', desc: 'Amazon & Apple → USDC', to: '/dashboard/giftcard' },
    { icon: Briefcase, title: 'Freelancer Escrow', desc: 'Milestone-based payments', to: '/dashboard/contracts' },
  ];

  return (
    <div className="space-y-6">
      {/* User Story Popup Card */}
      {showStory && (
        <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-5 sm:p-6">
          <button
            onClick={dismissStory}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-muted/30 hover:bg-muted/60 transition-colors z-10"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2 pr-8 sm:pr-4">
              <h3 className="text-base font-semibold text-foreground">Why NexolPay?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="text-foreground font-medium">Meet Tunde</span> — a freelancer in Lagos who gets paid in gift cards.
                With NexolPay, he converts them to USDC instantly, schedules weekly payouts to his bank, and secures
                client work through <span className="text-primary font-medium">freelancer escrow</span>. No middlemen. No delays.
                Just your money, working for you.
              </p>
              <div className="flex flex-wrap gap-3 pt-1">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/20 px-2.5 py-1 rounded-full">
                  <Clock className="h-3 w-3" /> Auto-schedule payouts
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/20 px-2.5 py-1 rounded-full">
                  <Zap className="h-3 w-3" /> Instant gift card conversion
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/20 px-2.5 py-1 rounded-full">
                  <TrendingUp className="h-3 w-3" /> Earn yield on idle funds
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Greeting */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          Welcome back, <span className="text-primary">{displayName}</span> 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">Here's your NexolPay overview</p>
      </div>

      {/* Wallet connection prompt */}
      {!connected && (
        <div className="nexol-card p-4 border-l-4 border-l-amber flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-2 w-2 rounded-full bg-amber animate-pulse flex-shrink-0" />
            <p className="text-sm text-muted-foreground">Connect your wallet to unlock full features</p>
          </div>
          <ConnectWalletButton />
        </div>
      )}

      {/* Connected wallet mini card */}
      {connected && walletBalance && (
        <div className="nexol-card p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
            <span className="text-sm text-muted-foreground">Wallet:</span>
            <span className="font-mono text-sm font-bold text-foreground">{walletBalance} ETH</span>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${network === 'mainnet' ? 'bg-primary/20 text-primary' : 'bg-amber/20 text-amber'}`}>
            {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
          </span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className="nexol-stat-card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-muted-foreground text-sm">{card.label}</span>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </div>
            <div className="font-mono text-2xl font-bold text-foreground">
              ${card.value.toFixed(2)}
            </div>
            <span className="text-xs text-muted-foreground">{card.unit}</span>
          </div>
        ))}
      </div>

      {/* Scheduler Highlight Card */}
      <button
        onClick={() => navigate('/dashboard/scheduler')}
        className="w-full text-left nexol-card p-5 border border-primary/20 hover:border-primary/40 transition-all group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <CalendarClock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Income & Payment Scheduler</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {stats.scheduled > 0
                  ? `$${stats.scheduled.toFixed(2)} in escrow · ${stats.nextPayout ? `Next payout ${stats.nextPayout.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}` : 'Active'}`
                  : 'Automate weekly payouts & split income effortlessly'}
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
        </div>
      </button>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.title}
              onClick={() => navigate(action.to)}
              className="nexol-card p-4 text-left hover:border-primary/30 transition-colors group flex items-center gap-4"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <action.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-foreground text-sm">{action.title}</h3>
                <p className="text-xs text-muted-foreground">{action.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 hidden sm:block" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
