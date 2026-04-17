import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Contract, Milestone, fmtUSDC, shortAddr } from '@/lib/contracts';
import { ContractStatusBadge, MilestoneStatusBadge } from '@/components/contracts/StatusBadge';
import { AutoReleaseCountdown } from '@/components/contracts/AutoReleaseCountdown';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useStellar } from '@/contexts/StellarContext';
import { ArrowLeft, ExternalLink, Loader2, Check } from 'lucide-react';

export default function ContractDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { explorerBaseUrl } = useStellar();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [contract, setContract] = useState<Contract | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestMs, setRequestMs] = useState<Milestone | null>(null);
  const [delivUrl, setDelivUrl] = useState('');
  const [delivNote, setDelivNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const { data: c } = await supabase.from('contracts').select('*').eq('id', id).maybeSingle();
    setContract(c as Contract | null);
    const { data: ms } = await supabase.from('contract_milestones').select('*').eq('contract_id', id).order('position');
    setMilestones((ms as Milestone[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  if (!contract) return <div className="text-center py-20 text-muted-foreground">Contract not found.</div>;

  const isFreelancer = user?.id === contract.freelancer_id;
  const isClient = user?.id === contract.client_id;
  const released = milestones.filter(m => m.status === 'paid').reduce((s, m) => s + Number(m.amount), 0);
  const inEscrow = contract.status === 'active' ? Number(contract.total_amount) - released : 0;

  const handleRequestPayment = async () => {
    if (!requestMs) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('request-milestone-payment', {
        body: { milestone_id: requestMs.id, deliverable_url: delivUrl, deliverable_note: delivNote },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Payment requested', description: 'Awaiting client approval (auto-releases in 72h)' });
      setRequestMs(null); setDelivUrl(''); setDelivNote('');
      load();
    } catch (e: any) {
      toast({ title: 'Could not request payment', description: e.message, variant: 'destructive' });
    } finally { setBusy(false); }
  };

  const handleApprove = async (m: Milestone) => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke('approve-milestone', { body: { milestone_id: m.id } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Milestone approved', description: 'Funds released to freelancer' });
      load();
    } catch (e: any) {
      toast({ title: 'Could not approve', description: e.message, variant: 'destructive' });
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/dashboard/contracts')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Freelance Contracts
      </button>

      <div>
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">{contract.title}</h1>
          <ContractStatusBadge status={contract.status} />
        </div>
        <p className="text-sm text-muted-foreground font-mono">{contract.contract_code}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {isFreelancer ? 'Client' : 'Freelancer'}: {isFreelancer ? contract.client_email : contract.freelancer_email}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Milestones</h2>
          <div className="space-y-4">
            {milestones.map((m) => {
              const dotColor = m.status === 'paid' ? 'bg-primary' : m.status === 'in_progress' || m.status === 'pending_approval' ? 'bg-amber animate-pulse' : 'bg-muted';
              return (
                <div key={m.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${dotColor} mt-2`} />
                    <div className="flex-1 w-px bg-border my-2" />
                  </div>
                  <div className="flex-1 bg-card rounded-2xl border border-border p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Milestone {m.position}</p>
                        <h3 className="font-bold mt-1">{m.title}</h3>
                        {m.description && <p className="text-sm text-muted-foreground mt-1">{m.description}</p>}
                      </div>
                      <MilestoneStatusBadge status={m.status} />
                    </div>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                      <div>
                        <p className="font-mono font-bold text-primary">{fmtUSDC(m.amount)}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Due {new Date(m.due_date).toLocaleDateString()}</p>
                      </div>
                      <div>
                        {m.status === 'in_progress' && isFreelancer && (
                          <Button size="sm" onClick={() => setRequestMs(m)}>Request Payment</Button>
                        )}
                        {m.status === 'pending_approval' && isClient && (
                          <Button size="sm" onClick={() => handleApprove(m)} disabled={busy}>
                            <Check className="w-4 h-4 mr-1" /> Approve
                          </Button>
                        )}
                        {m.status === 'pending_approval' && isFreelancer && m.auto_release_at && (
                          <div className="text-xs text-right">
                            <p className="text-muted-foreground">Auto-releases in</p>
                            <AutoReleaseCountdown target={m.auto_release_at} />
                          </div>
                        )}
                        {m.status === 'paid' && m.stellar_tx_hash && (
                          <a
                            href={`${explorerBaseUrl}/tx/${m.stellar_tx_hash}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-xs text-primary inline-flex items-center gap-1"
                          >
                            View TX <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                    {m.deliverable_url && (
                      <a href={m.deliverable_url} target="_blank" rel="noopener noreferrer" className="block mt-3 text-xs text-primary truncate">
                        🔗 {m.deliverable_url}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
            <h3 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Contract Details</h3>
            <Row label="Total Value" value={fmtUSDC(contract.total_amount)} mono />
            <Row label="In Escrow" value={fmtUSDC(inEscrow)} mono accent />
            <Row label="Released" value={fmtUSDC(released)} mono />
          </div>
          <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
            <h3 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Stellar Escrow</h3>
            <p className="font-mono text-xs text-muted-foreground break-all">{shortAddr(contract.escrow_pubkey, 8)}</p>
            {contract.escrow_pubkey && (
              <a
                href={`${explorerBaseUrl}/account/${contract.escrow_pubkey}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary"
              >
                View on Stellar Explorer <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <p className="text-xs text-muted-foreground">{contract.stellar_network} · Secured by Stellar</p>
          </div>
          <div className="bg-card rounded-2xl border border-border p-5 space-y-3">
            <h3 className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground">Dispute Method</h3>
            <p className="text-sm">{contract.dispute_method === 'auto_release_72h' ? 'Auto-release 72h' : 'NexolPay Arbitration'}</p>
          </div>
          {contract.status === 'awaiting_funding' && isFreelancer && (
            <div className="bg-amber/10 border border-amber/25 rounded-2xl p-5">
              <p className="text-xs text-amber font-bold uppercase tracking-wider">Awaiting Client Funding</p>
              <p className="text-sm mt-2 text-muted-foreground">
                Share this link with your client:
              </p>
              <div className="font-mono text-xs bg-input rounded-lg p-2 mt-2 break-all">
                {window.location.origin}/contract/{contract.public_share_code}
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!requestMs} onOpenChange={(v) => !v && setRequestMs(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Request payment for {requestMs?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">{requestMs && fmtUSDC(requestMs.amount)} USDC</p>
            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Deliverable URL (optional)</Label>
              <Input value={delivUrl} onChange={(e) => setDelivUrl(e.target.value)} placeholder="https://figma.com/..." />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Note for client (optional)</Label>
              <Textarea value={delivNote} onChange={(e) => setDelivNote(e.target.value)} rows={3} />
            </div>
            <Button className="w-full" onClick={handleRequestPayment} disabled={busy}>
              {busy ? 'Sending...' : 'Send Payment Request'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`${mono ? 'font-mono' : ''} ${accent ? 'text-primary font-bold' : 'font-medium'}`}>{value}</span>
    </div>
  );
}
