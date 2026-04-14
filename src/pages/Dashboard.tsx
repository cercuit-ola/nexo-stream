import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Wallet, CalendarClock, Lock, TrendingUp, Gift, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Transaction {
  id: string;
  type: string;
  description: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function Dashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ scheduled: 0, vaulted: 0, earned: 0 });
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      const [schedulerRes, vaultRes] = await Promise.all([
        supabase.from('scheduler_positions').select('total_amount').eq('user_id', user.id).eq('status', 'active'),
        supabase.from('vault_positions').select('principal_amount, apy_rate, deposit_date').eq('user_id', user.id).eq('status', 'active'),
      ]);

      const scheduled = schedulerRes.data?.reduce((s, r) => s + Number(r.total_amount), 0) ?? 0;
      const vaulted = vaultRes.data?.reduce((s, r) => s + Number(r.principal_amount), 0) ?? 0;
      const earned = vaultRes.data?.reduce((s, r) => {
        const days = (Date.now() - new Date(r.deposit_date).getTime()) / (1000 * 60 * 60 * 24);
        return s + Number(r.principal_amount) * (Number(r.apy_rate) / 100) * (days / 365);
      }, 0) ?? 0;

      setStats({ scheduled, vaulted, earned });
    };

    fetchStats();
  }, [user]);

  const statCards = [
    { label: 'Wallet Balance', value: profile?.usdc_balance ?? 0, unit: 'USDC', icon: Wallet, color: 'text-primary' },
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
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome back 👋</h1>
        <p className="text-muted-foreground text-sm">Here's your NexolPay overview</p>
      </div>

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

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h2>
        <div className="nexol-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-muted-foreground font-medium px-4 py-3">Type</th>
                  <th className="text-left text-muted-foreground font-medium px-4 py-3">Description</th>
                  <th className="text-right text-muted-foreground font-medium px-4 py-3">Amount</th>
                  <th className="text-left text-muted-foreground font-medium px-4 py-3">Date</th>
                  <th className="text-left text-muted-foreground font-medium px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTx.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted-foreground py-8">
                      No transactions yet. Start by scheduling your income or locking funds in the vault.
                    </td>
                  </tr>
                ) : (
                  recentTx.map((tx) => (
                    <tr key={tx.id} className="border-b border-border/50">
                      <td className="px-4 py-3">{tx.type}</td>
                      <td className="px-4 py-3">{tx.description}</td>
                      <td className="px-4 py-3 text-right font-mono">${tx.amount.toFixed(2)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={tx.status === 'completed' ? 'nexol-badge-success' : 'nexol-badge-pending'}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
