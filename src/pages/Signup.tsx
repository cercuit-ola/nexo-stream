import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function Signup() {
  const [step, setStep] = useState<'register' | 'kyc' | 'done'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  // KYC fields
  const [fullName, setFullName] = useState('');
  const [bvn, setBvn] = useState('');
  const [nin, setNin] = useState('');
  const [phone, setPhone] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password);
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setStep('kyc');
      setLoading(false);
    }
  };

  const handleKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('users').upsert({
      id: user.id,
      email: user.email,
      display_name: fullName,
      phone,
      bvn,
      nin,
      kyc_status: 'pending',
      usdc_balance: 0,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setStep('done');
      setLoading(false);
    }
  };

  if (step === 'done') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="nexol-card p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-foreground mb-2">Account Created!</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Your KYC is under review. You can browse the dashboard but cannot transact until verified.
          </p>
          <button onClick={() => navigate('/dashboard')} className="nexol-btn-primary w-full">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary font-bold text-primary-foreground text-2xl mb-4">
            N
          </div>
          <h1 className="text-2xl font-bold text-foreground">NexolPay</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {step === 'register' ? 'Create your account' : 'Complete KYC verification'}
          </p>
        </div>

        {step === 'register' && (
          <form onSubmit={handleRegister} className="nexol-card p-8 space-y-5">
            {error && <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="nexol-input" placeholder="you@example.com" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="nexol-input" placeholder="••••••••" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="nexol-input" placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} className="nexol-btn-primary w-full disabled:opacity-50">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </form>
        )}

        {step === 'kyc' && (
          <form onSubmit={handleKyc} className="nexol-card p-8 space-y-5">
            {error && <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="nexol-input" placeholder="John Doe" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">BVN</label>
              <input type="text" value={bvn} onChange={(e) => setBvn(e.target.value)} className="nexol-input" placeholder="Bank Verification Number" required maxLength={11} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">NIN</label>
              <input type="text" value={nin} onChange={(e) => setNin(e.target.value)} className="nexol-input" placeholder="National Identification Number" required maxLength={11} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Phone Number</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="nexol-input" placeholder="+234..." required />
            </div>
            <button type="submit" disabled={loading} className="nexol-btn-primary w-full disabled:opacity-50">
              {loading ? 'Submitting...' : 'Submit KYC'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
