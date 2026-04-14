import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { CalendarClock, Lock, Wallet, Gift, Download } from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  type: 'scheduler' | 'vault' | 'offramp' | 'giftcard';
  description: string;
  amount: number;
  status: string;
  reference: string;
}

const TYPE_META = {
  scheduler: { icon: CalendarClock, color: 'text-blue-400', label: 'Scheduler' },
  vault: { icon: Lock, color: 'text-primary', label: 'Vault' },
  offramp: { icon: Wallet, color: 'text-gold', label: 'Off-Ramp' },
  giftcard: { icon: Gift, color: 'text-purple-400', label: 'Gift Card' },
};

export default function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user]);

  const fetchAll = async () => {
    const txs: Transaction[] = [];

    const [scheduler, vault, offramp, giftcard] = await Promise.all([
      supabase.from('scheduler_positions').select('*').eq('user_id', user!.id),
      supabase.from('vault_positions').select('*').eq('user_id', user!.id),
      supabase.from('withdrawal_requests').select('*').eq('user_id', user!.id),
      supabase.from('gift_card_redemptions').select('*').eq('user_id', user!.id),
    ]);

    scheduler.data?.forEach((r: any) => txs.push({
      id: r.id, date: r.created_at, type: 'scheduler',
      description: `${r.type === '7day' ? '7-Day Lock' : 'Monthly Split'} - ${r.reference_number}`,
      amount: Number(r.total_amount), status: r.status, reference: r.reference_number,
    }));

    vault.data?.forEach((r: any) => txs.push({
      id: r.id, date: r.created_at, type: 'vault',
      description: `${r.lock_tier} Lock at ${r.apy_rate}% APY`,
      amount: Number(r.principal_amount), status: r.status, reference: r.reference_number,
    }));

    offramp.data?.forEach((r: any) => txs.push({
      id: r.id, date: r.created_at, type: 'offramp',
      description: `USDC → ₦${Number(r.ngn_amount).toLocaleString()} to ${r.bank_name}`,
      amount: Number(r.usdc_amount), status: r.status, reference: r.reference_number,
    }));

    giftcard.data?.forEach((r: any) => txs.push({
      id: r.id, date: r.created_at, type: 'giftcard',
      description: `${r.brand} $${Number(r.card_value)} card`,
      amount: Number(r.usdt_payout), status: r.status, reference: r.reference_number,
    }));

    txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTransactions(txs);
  };

  const filtered = transactions.filter(t =>
    (typeFilter === 'all' || t.type === typeFilter) &&
    (statusFilter === 'all' || t.status === statusFilter)
  );

  const exportCSV = () => {
    const csv = ['Date,Type,Description,Amount,Status,Reference',
      ...filtered.map(t => `${new Date(t.date).toLocaleDateString()},${t.type},${t.description},${t.amount},${t.status},${t.reference}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'nexolpay-transactions.csv'; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
        <button onClick={exportCSV} className="nexol-btn-outline flex items-center gap-2 text-sm">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="nexol-input w-auto">
          <option value="all">All Types</option>
          <option value="scheduler">Scheduler</option>
          <option value="vault">Vault</option>
          <option value="offramp">Off-Ramp</option>
          <option value="giftcard">Gift Card</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="nexol-input w-auto">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="nexol-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left text-muted-foreground font-medium px-4 py-3">#</th>
              <th className="text-left text-muted-foreground font-medium px-4 py-3">Date</th>
              <th className="text-left text-muted-foreground font-medium px-4 py-3">Type</th>
              <th className="text-left text-muted-foreground font-medium px-4 py-3">Description</th>
              <th className="text-right text-muted-foreground font-medium px-4 py-3">Amount</th>
              <th className="text-left text-muted-foreground font-medium px-4 py-3">Status</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-muted-foreground py-8">No transactions found</td></tr>
              ) : filtered.map((t, i) => {
                const meta = TYPE_META[t.type];
                return (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-secondary/20">
                    <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-2 ${meta.color}`}>
                        <meta.icon className="h-4 w-4" /> {meta.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-foreground">{t.description}</td>
                    <td className="px-4 py-3 text-right font-mono text-foreground">${t.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={
                        ['completed', 'approved', 'withdrawn'].includes(t.status) ? 'nexol-badge-success' :
                        ['rejected', 'failed'].includes(t.status) ? 'nexol-badge-error' : 'nexol-badge-pending'
                      }>{t.status}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
