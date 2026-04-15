import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';
import { useStellar } from '@/contexts/StellarContext';
import { supabase } from '@/lib/supabase';
import { Wallet, Copy, ArrowDownUp, Building2, ExternalLink, AlertTriangle } from 'lucide-react';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';

const BANKS = [
  { name: 'GTBank', code: '058' }, { name: 'Access Bank', code: '044' },
  { name: 'Zenith Bank', code: '057' }, { name: 'First Bank', code: '011' },
  { name: 'UBA', code: '033' }, { name: 'Kuda', code: '090267' },
  { name: 'OPay', code: '100004' }, { name: 'Moniepoint', code: '50515' },
  { name: 'Sterling', code: '232' }, { name: 'Wema Bank', code: '035' },
  { name: 'Fidelity', code: '070' },
];

interface BankAccount {
  id: string;
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
  is_default: boolean;
}

interface Withdrawal {
  id: string;
  usdc_amount: number;
  ngn_amount: number;
  bank_name: string;
  status: string;
  reference_number: string;
  created_at: string;
}

export default function WalletPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { connected, address, balance: walletBalance, refreshBalance } = useWallet();
  const { network, explorerBaseUrl } = useStellar();
  const [tab, setTab] = useState<'wallet' | 'convert' | 'receive'>('wallet');
  const [rate, setRate] = useState(1550);
  const [amount, setAmount] = useState('');
  const [banks, setBanks] = useState<BankAccount[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(false);

  // Bank form
  const [showBankForm, setShowBankForm] = useState(false);
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchRate();
    if (user) { fetchBanks(); fetchWithdrawals(); }
    const interval = setInterval(fetchRate, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchRate = async () => {
    try {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=usd-coin&vs_currencies=ngn');
      const data = await res.json();
      if (data['usd-coin']?.ngn) setRate(data['usd-coin'].ngn);
    } catch {}
  };

  const fetchBanks = async () => {
    const { data } = await supabase.from('bank_accounts').select('*').eq('user_id', user!.id);
    if (data) setBanks(data as BankAccount[]);
  };

  const fetchWithdrawals = async () => {
    const { data } = await supabase.from('withdrawal_requests').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
    if (data) setWithdrawals(data as Withdrawal[]);
  };

  const verifyAccount = async () => {
    if (accountNumber.length !== 10 || !bankCode) return;
    setVerifying(true);
    try {
      const { data } = await supabase.functions.invoke('resolve-bank-account', {
        body: { account_number: accountNumber, bank_code: bankCode },
      });
      if (data?.account_name) setAccountName(data.account_name);
    } catch {}
    setVerifying(false);
  };

  const saveBank = async () => {
    if (!accountName || !bankCode || !accountNumber) return;
    const bankName = BANKS.find(b => b.code === bankCode)?.name ?? '';
    await supabase.from('bank_accounts').insert({
      user_id: user!.id,
      bank_name: bankName,
      bank_code: bankCode,
      account_number: accountNumber,
      account_name: accountName,
      is_default: banks.length === 0,
      verified: true,
    });
    setShowBankForm(false);
    setAccountName('');
    setAccountNumber('');
    setBankCode('');
    fetchBanks();
  };

  const handleWithdraw = async () => {
    const usdcAmt = Number(amount);
    if (usdcAmt <= 0 || usdcAmt > (profile?.usdc_balance ?? 0)) return;
    const defaultBank = banks.find(b => b.is_default) ?? banks[0];
    if (!defaultBank) return;
    setLoading(true);

    const ngnAmt = usdcAmt * rate;
    const ref = `WDR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, '0')}`;

    await supabase.from('users').update({ usdc_balance: (profile?.usdc_balance ?? 0) - usdcAmt }).eq('id', user!.id);

    await supabase.from('withdrawal_requests').insert({
      user_id: user!.id,
      usdc_amount: usdcAmt,
      ngn_amount: ngnAmt,
      exchange_rate: rate,
      bank_name: defaultBank.bank_name,
      bank_code: defaultBank.bank_code,
      account_number: defaultBank.account_number,
      account_name: defaultBank.account_name,
      status: 'pending',
      reference_number: ref,
    });

    setLoading(false);
    setAmount('');
    refreshProfile();
    fetchWithdrawals();
  };

  const ngnAmount = Number(amount) * rate;
  const defaultBank = banks.find(b => b.is_default) ?? banks[0];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Wallet & Off-Ramp</h1>

      {/* Wallet Connection Card */}
      {!connected ? (
        <div className="nexol-card p-6 text-center space-y-4">
          <Wallet className="h-10 w-10 text-primary mx-auto" />
          <h3 className="text-lg font-semibold text-foreground">Connect Your Stellar Wallet</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Connect your Freighter wallet to view your on-chain balance, deposit funds, and manage transactions.
          </p>
          <div className="flex justify-center">
            <ConnectWalletButton />
          </div>
        </div>
      ) : (
        <ConnectWalletButton />
      )}

      {/* NexolPay Balance */}
      <div className="nexol-card p-6">
        <div className="flex items-center gap-3 mb-2">
          <Wallet className="h-6 w-6 text-primary" />
          <span className="text-muted-foreground text-sm">NexolPay Balance</span>
        </div>
        <div className="font-mono text-4xl font-bold text-foreground mb-1">
          ${profile?.usdc_balance?.toFixed(2) ?? '0.00'}
        </div>
        <div className="text-sm text-muted-foreground font-mono">
          ≈ ₦{((profile?.usdc_balance ?? 0) * rate).toLocaleString()} NGN
        </div>
        {connected && address && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{address.slice(0, 8)}...{address.slice(-4)}</span>
            <a href={`${explorerBaseUrl}/account/${address}`} target="_blank" rel="noreferrer" className="hover:text-primary">
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('wallet')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${tab === 'wallet' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
          Deposit
        </button>
        <button onClick={() => setTab('convert')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${tab === 'convert' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
          Convert & Withdraw
        </button>
        <button onClick={() => setTab('receive')}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${tab === 'receive' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>
          Receive USDC
        </button>
      </div>

      {tab === 'wallet' && (
        <div className="space-y-4">
          {connected ? (
            <div className="nexol-card p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Deposit from Wallet</h3>
              <p className="text-sm text-muted-foreground">
                Deposit USDC from your connected Stellar wallet into NexolPay to use with the scheduler, vault, or off-ramp.
              </p>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Amount (USDC)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="nexol-input font-mono text-lg" placeholder="0.00" />
                {walletBalance && (
                  <p className="text-xs text-muted-foreground mt-1">Wallet Balance: {walletBalance} USDC</p>
                )}
              </div>
              <button
                disabled={!amount || Number(amount) <= 0}
                className="nexol-btn-primary w-full disabled:opacity-50"
              >
                Deposit to NexolPay
              </button>
              <p className="text-xs text-muted-foreground text-center">
                Your wallet will prompt you to sign the transaction.
              </p>
            </div>
          ) : (
            <div className="nexol-card p-6 text-center">
              <AlertTriangle className="h-8 w-8 text-amber mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Connect your wallet to deposit funds.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'convert' && (
        <div className="space-y-4">
          <div className="nexol-card p-6 space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">You Pay</label>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-foreground bg-secondary px-3 py-2 rounded-lg">USDC</span>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="nexol-input font-mono text-lg" placeholder="0.00" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Balance: {profile?.usdc_balance?.toFixed(2)} USDC</p>
            </div>
            <div className="flex justify-center"><ArrowDownUp className="h-5 w-5 text-muted-foreground" /></div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">You Receive</label>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-foreground bg-secondary px-3 py-2 rounded-lg">NGN</span>
                <div className="nexol-input font-mono text-lg bg-secondary/50">{ngnAmount > 0 ? `₦${ngnAmount.toLocaleString()}` : '₦0.00'}</div>
              </div>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between"><span>Current Rate:</span><span className="font-mono">1 USDC = ₦{rate.toLocaleString()}</span></div>
              <div className="flex justify-between"><span>Processing Time:</span><span>Instant - 10 minutes</span></div>
            </div>
          </div>

          {defaultBank ? (
            <div className="nexol-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm font-semibold text-foreground">{defaultBank.bank_name}</div>
                  <div className="text-xs text-muted-foreground">****{defaultBank.account_number.slice(-4)} · {defaultBank.account_name}</div>
                </div>
              </div>
              <button onClick={() => setShowBankForm(true)} className="text-xs text-primary hover:underline">Change</button>
            </div>
          ) : (
            <button onClick={() => setShowBankForm(true)} className="nexol-btn-outline w-full flex items-center justify-center gap-2">
              <Building2 className="h-4 w-4" /> Add Bank Account
            </button>
          )}

          <button onClick={handleWithdraw} disabled={loading || !amount || Number(amount) <= 0 || !defaultBank}
            className="nexol-btn-primary w-full disabled:opacity-50">
            {loading ? 'Processing...' : 'Convert & Withdraw'}
          </button>
        </div>
      )}

      {tab === 'receive' && (
        <div className="nexol-card p-6 text-center space-y-4">
          <p className="text-sm text-muted-foreground">Send USDC to this address to top up your NexolPay balance.</p>
          <div className="bg-secondary rounded-xl p-4 font-mono text-xs text-foreground break-all">
            {connected && address ? address : 'Connect wallet to view address'}
          </div>
          {connected && address && (
            <button onClick={() => navigator.clipboard.writeText(address)}
              className="nexol-btn-outline flex items-center gap-2 mx-auto">
              <Copy className="h-4 w-4" /> Copy Address
            </button>
          )}
          <p className="text-xs text-muted-foreground">
            Supports USDC on Stellar {network === 'mainnet' ? 'Mainnet' : 'Testnet'}. Credits within 5-15 minutes.
          </p>
        </div>
      )}

      {/* Withdrawal History */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Withdrawal History</h3>
        <div className="nexol-card overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left text-muted-foreground font-medium px-4 py-3">Date</th>
              <th className="text-right text-muted-foreground font-medium px-4 py-3">USDC</th>
              <th className="text-right text-muted-foreground font-medium px-4 py-3">NGN</th>
              <th className="text-left text-muted-foreground font-medium px-4 py-3">Bank</th>
              <th className="text-left text-muted-foreground font-medium px-4 py-3">Status</th>
            </tr></thead>
            <tbody>
              {withdrawals.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-muted-foreground py-8">No withdrawals yet</td></tr>
              ) : withdrawals.map((w) => (
                <tr key={w.id} className="border-b border-border/50">
                  <td className="px-4 py-3 text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right font-mono">${Number(w.usdc_amount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono">₦{Number(w.ngn_amount).toLocaleString()}</td>
                  <td className="px-4 py-3">{w.bank_name}</td>
                  <td className="px-4 py-3">
                    <span className={w.status === 'completed' ? 'nexol-badge-success' : w.status === 'failed' ? 'nexol-badge-error' : 'nexol-badge-pending'}>
                      {w.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bank Form Modal */}
      {showBankForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="nexol-card w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between"><h2 className="text-lg font-bold text-foreground">Add Bank Account</h2>
              <button onClick={() => setShowBankForm(false)} className="text-muted-foreground">✕</button>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Bank</label>
              <select value={bankCode} onChange={(e) => setBankCode(e.target.value)} className="nexol-input">
                <option value="">Select bank</option>
                {BANKS.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Account Number</label>
              <input type="text" maxLength={10} value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}
                className="nexol-input font-mono" placeholder="0123456789" />
            </div>
            <button onClick={verifyAccount} disabled={verifying || accountNumber.length !== 10 || !bankCode}
              className="nexol-btn-outline w-full disabled:opacity-50">
              {verifying ? 'Verifying...' : 'Verify Account'}
            </button>
            {accountName && (
              <div className="nexol-card p-3 bg-primary/10">
                <span className="text-sm text-primary font-semibold">{accountName}</span>
              </div>
            )}
            <button onClick={saveBank} disabled={!accountName} className="nexol-btn-primary w-full disabled:opacity-50">
              Save Bank Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
