import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Lock, Plus, TrendingUp } from 'lucide-react';

const TIERS = [
  { key: '3m', label: '3 Months', apy: 5.2, days: 90, example: '$102.60' },
  { key: '6m', label: '6 Months', apy: 7.8, days: 180, example: '$103.90' },
  { key: '12m', label: '12 Months', apy: 12.5, days: 365, example: '$112.50' },
] as const;

interface VaultPosition {
  id: string;
  lock_tier: string;
  apy_rate: number;
  principal_amount: number;
  deposit_date: string;
  unlock_date: string;
  status: string;
  reference_number: string;
}

export default function Vault() {
  const { user, profile, refreshProfile } = useAuth();
  const [positions, setPositions] = useState<VaultPosition[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<typeof TIERS[number]>(TIERS[1]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [calcAmount, setCalcAmount] = useState(1000);
  const [calcTier, setCalcTier] = useState<typeof TIERS[number]>(TIERS[1]);

  useEffect(() => {
    if (!user) return;
    fetchPositions();
  }, [user]);

  const fetchPositions = async () => {
    const { data } = await supabase
      .from('vault_positions')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    if (data) setPositions(data as VaultPosition[]);
  };

  const calcYield = (principal: number, apy: number, days: number) =>
    principal * (apy / 100) * (days / 365);

  const handleCreate = async () => {
    if (!amount || Number(amount) <= 0 || !agreed) return;
    setLoading(true);

    const unlockDate = new Date();
    unlockDate.setDate(unlockDate.getDate() + selectedTier.days);

    const ref = `VLT-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;

    // Deduct balance and create position
    const { error: balError } = await supabase
      .from('users')
      .update({ usdc_balance: (profile?.usdc_balance ?? 0) - Number(amount) })
      .eq('id', user!.id);

    if (balError) { setLoading(false); return; }

    const { error } = await supabase.from('vault_positions').insert({
      user_id: user!.id,
      lock_tier: selectedTier.key,
      apy_rate: selectedTier.apy,
      principal_amount: Number(amount),
      deposit_date: new Date().toISOString(),
      unlock_date: unlockDate.toISOString(),
      status: 'active',
      simulation_mode: true,
      reference_number: ref,
    });

    setLoading(false);
    if (!error) {
      setShowModal(false);
      setAmount('');
      setAgreed(false);
      fetchPositions();
      refreshProfile();
    }
  };

  const handleClaim = async (pos: VaultPosition) => {
    const yieldEarned = calcYield(Number(pos.principal_amount), Number(pos.apy_rate), pos.lock_tier === '3m' ? 90 : pos.lock_tier === '6m' ? 180 : 365);
    const total = Number(pos.principal_amount) + yieldEarned;

    await supabase.from('users').update({
      usdc_balance: (profile?.usdc_balance ?? 0) + total,
    }).eq('id', user!.id);

    await supabase.from('vault_positions').update({ status: 'withdrawn' }).eq('id', pos.id);
    fetchPositions();
    refreshProfile();
  };

  const totalVaulted = positions.filter(p => p.status === 'active').reduce((s, p) => s + Number(p.principal_amount), 0);
  const totalYield = positions.filter(p => p.status === 'active').reduce((s, p) => {
    const days = (Date.now() - new Date(p.deposit_date).getTime()) / (1000 * 60 * 60 * 24);
    return s + calcYield(Number(p.principal_amount), Number(p.apy_rate), days);
  }, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">NexolPay Vault</h1>
          <p className="text-muted-foreground text-sm">Yield-bearing savings with fixed lock periods</p>
        </div>
        <button onClick={() => setShowModal(true)} className="nexol-btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> Lock New Position
        </button>
      </div>

      {/* Banner */}
      <div className="nexol-card p-4 border-l-4 border-l-amber">
        <p className="text-sm text-amber">
          🧪 Simulation Mode — Yield is calculated locally. Base Mainnet integration coming soon.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="nexol-stat-card">
          <span className="text-muted-foreground text-sm">Total Vaulted</span>
          <div className="font-mono text-2xl font-bold text-foreground mt-1">${totalVaulted.toFixed(2)}</div>
        </div>
        <div className="nexol-stat-card">
          <span className="text-muted-foreground text-sm">Total Yield Earned</span>
          <div className="font-mono text-2xl font-bold text-primary mt-1">${totalYield.toFixed(2)}</div>
        </div>
        <div className="nexol-stat-card">
          <span className="text-muted-foreground text-sm">Best APY</span>
          <div className="font-mono text-2xl font-bold text-gold mt-1">12.5%</div>
        </div>
        <div className="nexol-stat-card">
          <span className="text-muted-foreground text-sm">Active Positions</span>
          <div className="font-mono text-2xl font-bold text-foreground mt-1">{positions.filter(p => p.status === 'active').length}</div>
        </div>
      </div>

      {/* Yield Calculator */}
      <div className="nexol-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" /> Yield Calculator
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Amount (USDC)</label>
              <input type="range" min={10} max={50000} value={calcAmount} onChange={(e) => setCalcAmount(Number(e.target.value))}
                className="w-full accent-primary" />
              <div className="font-mono text-lg text-foreground mt-1">${calcAmount.toLocaleString()}</div>
            </div>
            <div className="flex gap-2">
              {TIERS.map((t) => (
                <button key={t.key} onClick={() => setCalcTier(t)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${calcTier.key === t.key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="nexol-card p-5 bg-secondary/30 space-y-3">
            <h4 className="text-sm font-semibold text-primary">💰 Yield Preview</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Principal:</span><span className="font-mono text-foreground">${calcAmount.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Lock Period:</span><span className="text-foreground">{calcTier.label}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">APY:</span><span className="text-primary font-bold">{calcTier.apy}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Yield Earned:</span><span className="font-mono text-primary">${calcYield(calcAmount, calcTier.apy, calcTier.days).toFixed(2)}</span></div>
              <div className="border-t border-border pt-2 flex justify-between font-semibold">
                <span className="text-foreground">Total at Unlock:</span>
                <span className="font-mono text-foreground">${(calcAmount + calcYield(calcAmount, calcTier.apy, calcTier.days)).toFixed(2)}</span>
              </div>
            </div>
            <button onClick={() => { setSelectedTier(calcTier); setAmount(String(calcAmount)); setShowModal(true); }}
              className="nexol-btn-primary w-full mt-2 text-sm">Lock & Earn</button>
          </div>
        </div>
      </div>

      {/* Positions */}
      <div className="space-y-4">
        {positions.length === 0 ? (
          <div className="nexol-card p-12 text-center">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Vault Positions</h3>
            <p className="text-muted-foreground text-sm">Lock USDC to earn yield.</p>
          </div>
        ) : positions.map((pos) => {
          const daysElapsed = (Date.now() - new Date(pos.deposit_date).getTime()) / (1000 * 60 * 60 * 24);
          const totalDays = pos.lock_tier === '3m' ? 90 : pos.lock_tier === '6m' ? 180 : 365;
          const progress = Math.min(100, (daysElapsed / totalDays) * 100);
          const yieldEarned = calcYield(Number(pos.principal_amount), Number(pos.apy_rate), daysElapsed);
          const isUnlocked = new Date(pos.unlock_date) <= new Date();
          const daysRemaining = Math.max(0, Math.ceil((new Date(pos.unlock_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

          return (
            <div key={pos.id} className="nexol-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    {pos.lock_tier === '3m' ? '3-Month' : pos.lock_tier === '6m' ? '6-Month' : '12-Month'} Lock
                  </span>
                  <span className="text-xs text-muted-foreground font-mono">{pos.reference_number}</span>
                  <span className="font-mono text-xs text-primary font-bold">{pos.apy_rate}% APY</span>
                </div>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">Simulated</span>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                <div><span className="text-muted-foreground">Principal</span><div className="font-mono font-bold text-foreground">${Number(pos.principal_amount).toFixed(2)}</div></div>
                <div><span className="text-muted-foreground">Yield Earned</span><div className="font-mono font-bold text-primary">${yieldEarned.toFixed(2)}</div></div>
                <div><span className="text-muted-foreground">Total Value</span><div className="font-mono font-bold text-foreground">${(Number(pos.principal_amount) + yieldEarned).toFixed(2)}</div></div>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress</span><span>{progress.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Locked: {new Date(pos.deposit_date).toLocaleDateString()}</span>
                <span>Unlocks: {new Date(pos.unlock_date).toLocaleDateString()}</span>
                <span>{daysRemaining} days remaining</span>
              </div>
              {pos.status === 'active' && isUnlocked && (
                <button onClick={() => handleClaim(pos)} className="nexol-btn-primary w-full mt-4 animate-pulse-glow">
                  Claim ${(Number(pos.principal_amount) + yieldEarned).toFixed(2)}
                </button>
              )}
              {pos.status === 'withdrawn' && (
                <div className="nexol-badge-success mt-4">✅ Claimed</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="nexol-card w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Lock New Position</h2>
              <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {TIERS.map((t) => (
                <button key={t.key} onClick={() => setSelectedTier(t)}
                  className={`nexol-card p-4 text-center transition-all ${selectedTier.key === t.key ? 'ring-2 ring-primary' : ''}`}>
                  <div className="text-sm font-semibold text-foreground">{t.label}</div>
                  <div className="text-2xl font-bold text-primary mt-1">{t.apy}%</div>
                  <div className="text-xs text-muted-foreground">APY</div>
                </button>
              ))}
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Amount (USDC)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="nexol-input font-mono text-lg" placeholder="0.00" />
              <p className="text-xs text-muted-foreground mt-1">Available: ${profile?.usdc_balance?.toFixed(2) ?? '0.00'}</p>
            </div>

            {Number(amount) > 0 && (
              <div className="nexol-card p-4 bg-secondary/30 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Principal:</span><span className="font-mono">${Number(amount).toFixed(2)} USDC</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Lock Period:</span><span>{selectedTier.label}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">APY:</span><span className="text-primary">{selectedTier.apy}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Projected Yield:</span><span className="font-mono text-primary">${calcYield(Number(amount), selectedTier.apy, selectedTier.days).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Unlock Date:</span><span>{new Date(Date.now() + selectedTier.days * 86400000).toLocaleDateString()}</span></div>
                <div className="border-t border-border pt-2 flex justify-between font-bold">
                  <span>Total Payout:</span><span className="font-mono">${(Number(amount) + calcYield(Number(amount), selectedTier.apy, selectedTier.days)).toFixed(2)}</span>
                </div>
              </div>
            )}

            <label className="flex items-start gap-3 text-sm text-muted-foreground">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 accent-primary" />
              I understand I cannot withdraw before {new Date(Date.now() + selectedTier.days * 86400000).toLocaleDateString()}
            </label>

            <button onClick={handleCreate} disabled={loading || !amount || Number(amount) <= 0 || !agreed}
              className="nexol-btn-primary w-full disabled:opacity-50">
              {loading ? 'Locking...' : 'Confirm & Lock'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
