import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { CalendarClock, Plus, Lock, CheckCircle, Copy, ExternalLink } from 'lucide-react';

interface Position {
  id: string;
  type: string;
  total_amount: number;
  weekly_amount: number;
  num_weeks: number;
  start_date: string;
  status: string;
  reference_number: string;
  escrow_pubkey: string;
  scheduler_transactions: Transaction[];
}

interface Transaction {
  id: string;
  week_number: number;
  amount: number;
  unlock_timestamp: number;
  submitted: boolean;
  stellar_tx_hash: string | null;
}

export default function Scheduler() {
  const { user, profile } = useAuth();
  const [positions, setPositions] = useState<Position[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState<'7day' | 'monthly'>('monthly');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchPositions();

    const channel = supabase
      .channel('scheduler_updates')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'scheduler_transactions', filter: `user_id=eq.${user.id}` },
        () => fetchPositions()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchPositions = async () => {
    const { data } = await supabase
      .from('scheduler_positions')
      .select('*, scheduler_transactions(*)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    if (data) setPositions(data as Position[]);
  };

  const weeklyAmount = tab === 'monthly' ? Number(amount) / 4 : Number(amount);
  const numWeeks = tab === 'monthly' ? 4 : 1;

  const handleCreate = async () => {
    if (!amount || Number(amount) <= 0) return;
    setLoading(true);

    const { error } = await supabase.functions.invoke('create-stellar-schedule', {
      body: {
        user_id: user!.id,
        type: tab,
        total_amount: Number(amount),
        weekly_amount: weeklyAmount,
        num_weeks: numWeeks,
        start_date: new Date().toISOString(),
      },
    });

    setLoading(false);
    if (!error) {
      setShowModal(false);
      setAmount('');
      fetchPositions();
    }
  };

  const getWeekDates = () => {
    const dates = [];
    const start = new Date();
    for (let i = 0; i < 4; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + (i + 1) * 7);
      dates.push(d);
    }
    return dates;
  };

  const activeCount = positions.filter(p => p.status === 'active').length;
  const totalLocked = positions.filter(p => p.status === 'active').reduce((s, p) => s + Number(p.total_amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Income Scheduler</h1>
          <p className="text-muted-foreground text-sm">Stellar blockchain escrow for scheduled payments</p>
        </div>
        <button onClick={() => setShowModal(true)} className="nexol-btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> New Schedule
        </button>
      </div>

      {/* Info card */}
      <div className="nexol-card p-4 border-l-4 border-l-primary">
        <p className="text-sm text-muted-foreground">
          Income Scheduler uses Stellar blockchain escrow to lock your funds and release them on a fixed schedule. 
          Funds cannot be accessed early — enforced by Stellar time-locks.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="nexol-stat-card">
          <span className="text-muted-foreground text-sm">Active Schedules</span>
          <div className="font-mono text-2xl font-bold text-foreground mt-1">{activeCount}</div>
        </div>
        <div className="nexol-stat-card">
          <span className="text-muted-foreground text-sm">Total Locked</span>
          <div className="font-mono text-2xl font-bold text-foreground mt-1">${totalLocked.toFixed(2)}</div>
        </div>
        <div className="nexol-stat-card">
          <span className="text-muted-foreground text-sm">Released This Month</span>
          <div className="font-mono text-2xl font-bold text-primary mt-1">$0.00</div>
        </div>
        <div className="nexol-stat-card">
          <span className="text-muted-foreground text-sm">Next Release</span>
          <div className="text-lg font-bold text-foreground mt-1">—</div>
        </div>
      </div>

      {/* Positions */}
      <div className="space-y-4">
        {positions.length === 0 ? (
          <div className="nexol-card p-12 text-center">
            <CalendarClock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Schedules Yet</h3>
            <p className="text-muted-foreground text-sm mb-4">Create your first income schedule to lock and release funds on a schedule.</p>
            <button onClick={() => setShowModal(true)} className="nexol-btn-primary">Create Schedule</button>
          </div>
        ) : positions.map((pos) => (
          <div key={pos.id} className="nexol-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  {pos.type === '7day' ? '7-Day Lock' : 'Monthly Split'}
                </span>
                <span className="text-xs text-muted-foreground font-mono">{pos.reference_number}</span>
              </div>
              <span className={pos.status === 'active' ? 'nexol-badge-pending' : 'nexol-badge-success'}>
                {pos.status === 'active' ? '🔒 Active' : '✅ Completed'}
              </span>
            </div>

            {pos.type === 'monthly' && (
              <div className="mb-3">
                <span className="font-mono text-lg font-bold text-foreground">${Number(pos.total_amount).toFixed(2)}</span>
                <span className="text-muted-foreground text-sm ml-2">total · ${Number(pos.weekly_amount).toFixed(2)}/week</span>
              </div>
            )}

            {pos.type === '7day' && (
              <div className="mb-3">
                <span className="font-mono text-lg font-bold text-foreground">${Number(pos.total_amount).toFixed(2)} USDC</span>
              </div>
            )}

            {pos.scheduler_transactions && (
              <div className="space-y-2 mb-4">
                {pos.scheduler_transactions
                  .sort((a, b) => a.week_number - b.week_number)
                  .map((tx) => {
                    const unlockDate = new Date(tx.unlock_timestamp * 1000);
                    const isReleased = tx.submitted;
                    const daysLeft = Math.max(0, Math.ceil((unlockDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                    return (
                      <div key={tx.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/30">
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">WK{tx.week_number}</span>
                          <span className="text-sm text-foreground">{unlockDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          <span className="font-mono text-sm text-foreground">${Number(tx.amount).toFixed(2)}</span>
                        </div>
                        {isReleased ? (
                          <span className="nexol-badge-success"><CheckCircle className="h-3 w-3" /> Released</span>
                        ) : (
                          <span className="nexol-badge-pending"><Lock className="h-3 w-3" /> {daysLeft}d</span>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}

            {pos.escrow_pubkey && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Escrow: {pos.escrow_pubkey.slice(0, 6)}...{pos.escrow_pubkey.slice(-4)}</span>
                <button onClick={() => navigator.clipboard.writeText(pos.escrow_pubkey)}>
                  <Copy className="h-3 w-3" />
                </button>
                <a href={`https://stellar.expert/explorer/testnet/account/${pos.escrow_pubkey}`} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="nexol-card w-full max-w-lg p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Create New Schedule</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
              <button onClick={() => setTab('7day')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${tab === '7day' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                7-Day Lock
              </button>
              <button onClick={() => setTab('monthly')}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${tab === 'monthly' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                Monthly Split
              </button>
            </div>

            <p className="text-sm text-muted-foreground">
              {tab === '7day'
                ? 'Deposit USDC into Stellar escrow. Releases automatically after exactly 7 days.'
                : 'Deposit your monthly income. NexolPay splits it into 4 equal weekly allowances.'}
            </p>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                {tab === '7day' ? 'Lock Amount (USDC)' : 'Monthly Income (USDC)'}
              </label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="nexol-input font-mono text-lg" placeholder="0.00" min="1" />
            </div>

            {tab === 'monthly' && Number(amount) > 0 && (
              <div className="nexol-card p-4 space-y-2 bg-secondary/30">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Monthly Income:</span>
                  <span className="font-mono text-foreground">${Number(amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Weekly Allowance:</span>
                  <span className="font-mono text-foreground">${(Number(amount) / 4).toFixed(2)} × 4</span>
                </div>
                <div className="border-t border-border pt-2 mt-2 space-y-1">
                  {getWeekDates().map((d, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">WEEK {i + 1} · {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      <span className="text-foreground font-mono">${(Number(amount) / 4).toFixed(2)} 🔒</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === '7day' && Number(amount) > 0 && (
              <div className="nexol-card p-4 bg-secondary/30">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lock:</span>
                  <span className="font-mono text-foreground">${Number(amount).toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Releases:</span>
                  <span className="text-foreground">{new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
                </div>
              </div>
            )}

            <button onClick={handleCreate} disabled={loading || !amount || Number(amount) <= 0}
              className="nexol-btn-primary w-full disabled:opacity-50">
              {loading ? 'Creating on Stellar...' : tab === '7day' ? 'Create 7-Day Lock' : 'Create Monthly Split'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
