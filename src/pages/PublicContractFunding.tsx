import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { fmtUSDC, Milestone } from '@/lib/contracts';
import { Loader2, ShieldCheck, Lock, Check } from 'lucide-react';
import nexolLogo from '@/assets/nexolpay-logo.png';

interface PublicContract {
  id: string;
  contract_code: string;
  title: string;
  description: string | null;
  freelancer_email: string;
  client_email: string;
  total_amount: number;
  currency: string;
  deadline: string;
  status: string;
  escrow_pubkey: string | null;
  stellar_network: string;
  funded_at: string | null;
}

export default function PublicContractFunding() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [contract, setContract] = useState<PublicContract | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [funding, setFunding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!code) return;
      try {
        const { data, error } = await supabase.functions.invoke('get-public-contract', {
          body: undefined,
          method: 'GET',
          // @ts-ignore
        });
        // The functions.invoke doesn't carry query strings well; fetch directly
      } catch {}

      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-public-contract?code=${encodeURIComponent(code)}`;
        const res = await fetch(url, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed');
        setContract(json.contract);
        setMilestones(json.milestones);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [code]);

  const handleFund = async () => {
    if (!user) {
      navigate(`/signup?redirect=/contract/${code}`);
      return;
    }
    if (!contract) return;
    const userEmail = (profile?.email ?? user.email ?? '').toLowerCase();
    if (userEmail !== contract.client_email.toLowerCase()) {
      toast({
        title: 'Email mismatch',
        description: `This contract was sent to ${contract.client_email}. Sign in with that email to fund it.`,
        variant: 'destructive',
      });
      return;
    }

    setFunding(true);
    try {
      const { data, error } = await supabase.functions.invoke('fund-contract', {
        body: { share_code: code },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Contract funded', description: 'Funds locked in Stellar escrow' });
      navigate(`/dashboard/contracts/${data.contract_id}`);
    } catch (e: any) {
      toast({ title: 'Funding failed', description: e.message, variant: 'destructive' });
    } finally {
      setFunding(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  if (error || !contract) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold">Contract not found</h1>
          <p className="text-muted-foreground mt-2">{error ?? 'This invitation link is invalid or expired.'}</p>
          <Link to="/" className="text-primary text-sm mt-4 inline-block">Go home</Link>
        </div>
      </div>
    );
  }

  const alreadyFunded = contract.status !== 'awaiting_funding';

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <img src={nexolLogo} alt="NexolPay" className="h-8 w-8 rounded-lg" />
          <span className="font-bold">NexolPay</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-6">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Contract Invitation</p>
          <h1 className="text-2xl sm:text-3xl font-bold mt-2">You've been invited to fund a freelance contract</h1>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <div className="space-y-3">
            <Row label="Project" value={contract.title} />
            <Row label="Freelancer" value={contract.freelancer_email} />
            <Row label="Total Amount" value={`${fmtUSDC(contract.total_amount)} USDC`} mono accent />
            <Row label="Deadline" value={new Date(contract.deadline).toLocaleDateString()} />
            <Row label="Contract ID" value={contract.contract_code} mono />
          </div>

          {contract.description && (
            <div className="pt-4 border-t border-border">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Description</p>
              <p className="text-sm">{contract.description}</p>
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-3">Milestones</p>
            <div className="space-y-2">
              {milestones.map(m => (
                <div key={m.id} className="flex justify-between items-center text-sm py-2">
                  <div>
                    <p className="font-medium">{m.position}. {m.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Due {new Date(m.due_date).toLocaleDateString()}</p>
                  </div>
                  <span className="font-mono">{fmtUSDC(m.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <h3 className="font-bold">How this works</h3>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />You deposit {fmtUSDC(contract.total_amount)} USDC once into Stellar escrow</li>
            <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />Funds are locked — freelancer can't access them yet</li>
            <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />You release each milestone payment as work is delivered</li>
            <li className="flex gap-2"><Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />Disputes are resolved automatically (72h auto-release)</li>
          </ul>
        </div>

        {alreadyFunded ? (
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <Check className="w-10 h-10 text-primary mx-auto mb-3" />
            <p className="font-bold">This contract is already funded</p>
            <p className="text-sm text-muted-foreground mt-1">Status: {contract.status}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {!authLoading && !user && (
              <p className="text-sm text-muted-foreground text-center">
                You need a NexolPay account (using <strong>{contract.client_email}</strong>) to fund this contract.
              </p>
            )}
            <Button className="w-full" size="lg" onClick={handleFund} disabled={funding}>
              <Lock className="w-4 h-4 mr-2" />
              {funding ? 'Funding...' : user ? `Fund ${fmtUSDC(contract.total_amount)} into Escrow` : 'Sign Up to Fund'}
            </Button>
            {user && (
              <p className="text-xs text-center text-muted-foreground">
                Signed in as {user.email}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm text-right ${mono ? 'font-mono' : ''} ${accent ? 'text-primary font-bold' : 'font-medium'}`}>{value}</span>
    </div>
  );
}
