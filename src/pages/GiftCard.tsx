import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Gift, CheckCircle, XCircle } from 'lucide-react';

const BRANDS = ['Amazon', 'Apple', 'Google Play', 'Netflix', 'Steam', 'Xbox', 'PlayStation', 'Vanilla Visa'];
const VALUES = [10, 25, 50, 100, 200, 500];
const CURRENCIES = ['USD', 'GBP', 'EUR', 'CAD', 'AUD'];

interface Redemption {
  id: string;
  reference_number: string;
  brand: string;
  card_value: number;
  card_currency: string;
  commission_amount: number;
  usdt_payout: number;
  status: string;
  rejection_reason: string | null;
  created_at: string;
}

export default function GiftCard() {
  const { user } = useAuth();
  const [brand, setBrand] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [value, setValue] = useState<number | ''>('');
  const [customValue, setCustomValue] = useState('');
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeRedemption, setActiveRedemption] = useState<Redemption | null>(null);
  const [history, setHistory] = useState<Redemption[]>([]);
  const [tab, setTab] = useState<'submit' | 'history'>('submit');

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  useEffect(() => {
    if (!activeRedemption || activeRedemption.status !== 'pending') return;
    const channel = supabase
      .channel(`redemption-${activeRedemption.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'gift_card_redemptions', filter: `id=eq.${activeRedemption.id}` },
        (payload) => { setActiveRedemption(payload.new as Redemption); fetchHistory(); }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeRedemption]);

  const fetchHistory = async () => {
    const { data } = await supabase.from('gift_card_redemptions').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
    if (data) setHistory(data as Redemption[]);
  };

  const cardValue = value === '' ? Number(customValue) : value;
  const commission = cardValue * 0.3;
  const payout = cardValue - commission;

  const formatCode = (val: string) => val.replace(/[^A-Z0-9]/gi, '').toUpperCase().replace(/(.{4})/g, '$1 ').trim();

  const handleSubmit = async () => {
    if (!brand || cardValue <= 0 || !code || !confirmed) return;
    setLoading(true);

    const ref = `NXL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;

    const { data, error } = await supabase.from('gift_card_redemptions').insert({
      user_id: user!.id,
      user_email: user!.email,
      reference_number: ref,
      brand,
      card_currency: currency,
      card_value: cardValue,
      card_code: code.replace(/\s/g, ''),
      card_pin: pin || null,
      commission_rate: 0.3,
      commission_amount: commission,
      usdt_payout: payout,
      status: 'pending',
      submitted_at: new Date().toISOString(),
    }).select().single();

    setLoading(false);
    if (!error && data) {
      setActiveRedemption(data as Redemption);
      setBrand(''); setCode(''); setPin(''); setConfirmed(false); setValue('');
    }
  };

  // Render active redemption states
  if (activeRedemption) {
    if (activeRedemption.status === 'pending') {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="nexol-card p-8 max-w-md w-full text-center space-y-6">
            <div className="text-xs text-muted-foreground font-mono">{activeRedemption.reference_number}</div>
            <div className="mx-auto w-24 h-24 rounded-full border-4 border-amber flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-2 border-amber border-t-transparent rounded-full" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Validating your {activeRedemption.brand} gift card...</h2>
              <p className="text-sm text-muted-foreground mt-2">Our team is manually checking your card balance. Do not close this page.</p>
            </div>
          </div>
        </div>
      );
    }

    if (activeRedemption.status === 'approved') {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="nexol-card p-8 max-w-md w-full text-center space-y-6">
            <CheckCircle className="h-16 w-16 text-primary mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Redemption Complete! 🎉</h2>
            <p className="font-mono text-2xl text-primary font-bold">${Number(activeRedemption.usdt_payout).toFixed(2)} USDC</p>
            <p className="text-sm text-muted-foreground">credited to your wallet</p>
            <p className="text-xs text-muted-foreground font-mono">{activeRedemption.reference_number}</p>
            <div className="flex gap-3">
              <button onClick={() => setActiveRedemption(null)} className="nexol-btn-primary flex-1">Redeem Another</button>
              <button onClick={() => { setActiveRedemption(null); setTab('history'); }} className="nexol-btn-outline flex-1">View History</button>
            </div>
          </div>
        </div>
      );
    }

    if (activeRedemption.status === 'rejected') {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="nexol-card p-8 max-w-md w-full text-center space-y-6">
            <XCircle className="h-16 w-16 text-destructive mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Redemption Failed</h2>
            <p className="text-sm text-muted-foreground">{activeRedemption.rejection_reason ?? 'Card could not be verified'}</p>
            <button onClick={() => setActiveRedemption(null)} className="nexol-btn-primary">Try Again</button>
          </div>
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Redeem Gift Card</h1>
      <p className="text-muted-foreground text-sm">Receive USDC in ~90 seconds</p>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab('submit')} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${tab === 'submit' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
          Submit Card
        </button>
        <button onClick={() => setTab('history')} className={`flex-1 py-2.5 rounded-xl text-sm font-medium ${tab === 'history' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
          History
        </button>
      </div>

      {tab === 'submit' && (
        <div className="space-y-6">
          {/* Brand selection */}
          <div>
            <label className="text-sm text-muted-foreground mb-3 block">Select Brand</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {BRANDS.map((b) => (
                <button key={b} onClick={() => setBrand(b)}
                  className={`nexol-card p-4 text-center text-sm font-medium transition-all ${brand === b ? 'ring-2 ring-primary text-primary' : 'text-foreground'}`}>
                  {b}
                </button>
              ))}
            </div>
          </div>

          {brand && (
            <>
              {/* Currency */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Card Currency</label>
                <div className="flex gap-2">
                  {CURRENCIES.map((c) => (
                    <button key={c} onClick={() => setCurrency(c)}
                      className={`px-4 py-2 rounded-full text-sm font-medium ${currency === c ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Value */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Card Value</label>
                <div className="flex flex-wrap gap-2">
                  {VALUES.map((v) => (
                    <button key={v} onClick={() => { setValue(v); setCustomValue(''); }}
                      className={`px-4 py-2 rounded-full text-sm font-medium font-mono ${value === v ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                      ${v}
                    </button>
                  ))}
                  <button onClick={() => setValue('')}
                    className={`px-4 py-2 rounded-full text-sm font-medium ${value === '' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
                    Custom
                  </button>
                </div>
                {value === '' && (
                  <input type="number" value={customValue} onChange={(e) => setCustomValue(e.target.value)}
                    className="nexol-input font-mono mt-2" placeholder="Enter amount" />
                )}
              </div>

              {/* Code & PIN */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Gift Card Code</label>
                <input type="text" value={code} onChange={(e) => setCode(formatCode(e.target.value))}
                  className="nexol-input font-mono tracking-widest text-lg" placeholder="XXXX XXXX XXXX XXXX" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">PIN (if required)</label>
                <input type="password" value={pin} onChange={(e) => setPin(e.target.value)}
                  className="nexol-input" placeholder="Optional" />
              </div>

              <label className="flex items-start gap-3 text-sm text-muted-foreground">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 accent-primary" />
                I confirm this card has not been previously used or partially redeemed
              </label>

              {/* Summary */}
              {cardValue > 0 && (
                <div className="nexol-card p-5 space-y-2 text-sm">
                  <h3 className="font-semibold text-foreground">Redemption Summary</h3>
                  <div className="flex justify-between"><span className="text-muted-foreground">Brand:</span><span>{brand} {currency}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Card Value:</span><span className="font-mono">${cardValue.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Commission (30%):</span><span className="font-mono text-destructive">-${commission.toFixed(2)}</span></div>
                  <div className="border-t border-border pt-2 flex justify-between font-bold">
                    <span>You Receive:</span><span className="font-mono text-primary">${payout.toFixed(2)} USDC</span>
                  </div>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground">Estimated Time:</span><span>~90 seconds</span></div>
                </div>
              )}

              <button onClick={handleSubmit} disabled={loading || !confirmed || cardValue <= 0 || !code}
                className="nexol-btn-primary w-full disabled:opacity-50">
                {loading ? 'Submitting...' : 'Submit for Redemption →'}
              </button>
            </>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="nexol-card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left text-muted-foreground font-medium px-4 py-3">Date</th>
              <th className="text-left text-muted-foreground font-medium px-4 py-3">Brand</th>
              <th className="text-right text-muted-foreground font-medium px-4 py-3">Value</th>
              <th className="text-right text-muted-foreground font-medium px-4 py-3">USDC</th>
              <th className="text-left text-muted-foreground font-medium px-4 py-3">Status</th>
            </tr></thead>
            <tbody>
              {history.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-muted-foreground py-8">No redemptions yet</td></tr>
              ) : history.map((r) => (
                <tr key={r.id} className="border-b border-border/50">
                  <td className="px-4 py-3 text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{r.brand}</td>
                  <td className="px-4 py-3 text-right font-mono">${Number(r.card_value).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono text-primary">${Number(r.usdt_payout).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={r.status === 'approved' ? 'nexol-badge-success' : r.status === 'rejected' ? 'nexol-badge-error' : 'nexol-badge-pending'}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
