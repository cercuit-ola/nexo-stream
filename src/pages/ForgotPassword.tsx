import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import nexolLogo from '@/assets/nexolpay-logo.png';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  if (sent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="nexol-card p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">📧</div>
          <h2 className="text-xl font-bold text-foreground mb-2">Check Your Email</h2>
          <p className="text-muted-foreground text-sm mb-6">
            We've sent a password reset link to <strong className="text-foreground">{email}</strong>.
          </p>
          <Link to="/login" className="nexol-btn-primary inline-block w-full text-center">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <img src={nexolLogo} alt="NexolPay" className="h-16 w-16 rounded-2xl mb-4" />
          <h1 className="text-2xl font-bold text-foreground">NexolPay</h1>
          <p className="text-muted-foreground text-sm mt-1">Reset your password</p>
        </div>

        <form onSubmit={handleSubmit} className="nexol-card p-8 space-y-5">
          {error && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            Enter your email and we'll send you a link to reset your password.
          </p>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="nexol-input" placeholder="you@example.com" required />
          </div>
          <button type="submit" disabled={loading} className="nexol-btn-primary w-full disabled:opacity-50">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/login" className="text-primary hover:underline">Back to Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
