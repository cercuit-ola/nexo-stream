import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useStellar } from '@/contexts/StellarContext';
import { useNavigate } from 'react-router-dom';
import { Wallet, CalendarClock, Lock, TrendingUp, Gift, ArrowRight, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';

export default function Dashboard() {
  const { profile, user } = useAuth();
  const { connected, balance: walletBalance } = useWallet();
  const { network } = useStellar();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ scheduled: 0, vaulted: 0, earned: 0, nextPayout: null as Date | null });

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      const [schedulerRes, vaultRes, schedulerTxRes] = await Promise.all([
        supabase.from('scheduler_positions').select('total_amount').eq('user_id', user.id).eq('status', 'active'),
        supabase.from('vault_positions').select('principal_amount, apy_rate, deposit_date').eq('user_id', user.id).eq('status', 'active'),
        supabase.from('scheduler_transactions').select('unlock_timestamp').eq('user_id', user.id).eq('submitted', false).order('unlock_timestamp', { ascending: true }).limit(1),
      ]);

      const scheduled = schedulerRes.data?.reduce((s, r) => s + Number(r.total_amount), 0) ?? 0;
      const vaulted = vaultRes.data?.reduce((s, r) => s + Number(r.principal_amount), 0) ?? 0;
      const earned = vaultRes.data?.reduce((s, r) => {
        const days = (Date.now() - new Date(r.deposit_date).getTime()) / (1000 * 60 * 60 * 24);
        return s + Number(r.principal_amount) * (Number(r.apy_rate) / 100) * (days / 365);
      }, 0) ?? 0;

      const nextPayout = schedulerTxRes.data?.[0]
        ? new Date(Number(schedulerTxRes.data[0].unlock_timestamp) * 1000)
        : null;

      setStats({ scheduled, vaulted, earned, nextPayout });
    };

    fetchStats();
  }, [user]);

  const statCards = [
    { label: 'NexolPay Balance', value: profile?.usdc_balance ?? 0, unit: 'USDC', icon: Wallet, color: 'text-primary' },
    { label: 'Total Scheduled', value: stats.scheduled, unit: 'in Stellar Escrow', icon: CalendarClock, color: 'text-blue-400' },
    { label: 'Total Vaulted', value: stats.vaulted, unit: 'earning yield', icon: Lock, color: 'text-primary' },
    { label: 'Total Earned', value: stats.earned, unit: 'yield earned', icon: TrendingUp, color: 'text-gold' },
  ];

  const quickActions = [
    { icon: CalendarClock, title: 'Schedule My Income', desc: 'Split payments weekly', to: '/dashboard/scheduler' },
    { icon: Lock, title: 'Lock in Vault', desc: 'Earn 5.2% to 12.5% APY', to: '/dashboard/vault' },
    { icon: Wallet, title: 'Convert to Naira', desc: 'USDC → NGN to your bank', to: '/dashboard/wallet' },
    { icon: Gift, title: 'Redeem Gift Card', desc: 'Amazon & Apple → USDC', to: '/dashboard/giftcard' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back 👋</h1>
          <p className="text-muted-foreground text-sm">Here's your NexolPay overview</p>
        </div>
      </div>

      {/* Wallet connection prompt */}
      {!connected && (
        <div className="nexol-card p-5 border-l-4 border-l-amber flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Wallet Not Connected</p>
              <p className="text-xs text-muted-foreground">Connect your Stellar wallet to deposit, schedule, and sign transactions.</p>
            </div>
          </div>
          <ConnectWalletButton />
        </div>
      )}

      {/* Connected wallet mini card */}
      {connected && walletBalance && (
        <div className="nexol-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse flex-shrink-0" />
            <span className="text-sm text-muted-foreground whitespace-nowrap">Wallet Balance:</span>
            <span className="font-mono text-sm font-bold text-foreground">{walletBalance} ETH</span>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${network === 'mainnet' ? 'bg-primary/20 text-primary' : 'bg-amber/20 text-amber'}`}>
            {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

      {/* Next Payout */}
      {stats.nextPayout && (
        <div className="nexol-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Next Scheduled Payout:</span>
          </div>
          <span className="font-mono text-sm font-bold text-foreground">
            {stats.nextPayout.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <button key={action.title} onClick={() => navigate(action.to)}
              className="nexol-card p-5 text-left hover:border-primary/30 transition-colors group cursor-pointer">
              <action.icon className="h-8 w-8 text-primary mb-3" />
              <h3 className="font-semibold text-foreground text-sm mb-1">{action.title}</h3>
              <p className="text-xs text-muted-foreground">{action.desc}</p>
              <ArrowRight className="h-4 w-4 text-muted-foreground mt-3 group-hover:text-primary transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
