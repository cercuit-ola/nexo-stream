import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Check, Clock, Scale, Copy, ExternalLink } from 'lucide-react';
import { fmtUSDC } from '@/lib/contracts';

interface Milestone {
  title: string;
  description: string;
  amount: string;
  due_date: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: () => void;
}

export function NewContractModal({ open, onOpenChange, onCreated }: Props) {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [deadline, setDeadline] = useState('');

  const [milestones, setMilestones] = useState<Milestone[]>([
    { title: '', description: '', amount: '', due_date: '' },
    { title: '', description: '', amount: '', due_date: '' },
  ]);

  const [disputeMethod, setDisputeMethod] = useState<'auto_release_72h' | 'nexolpay_arbitration'>('auto_release_72h');

  const [created, setCreated] = useState<{ code: string; share: string } | null>(null);

  const total = Number(totalAmount) || 0;
  const allocated = milestones.reduce((s, m) => s + (Number(m.amount) || 0), 0);
  const remaining = total - allocated;

  const reset = () => {
    setStep(1);
    setTitle(''); setDescription(''); setClientEmail(''); setTotalAmount(''); setDeadline('');
    setMilestones([
      { title: '', description: '', amount: '', due_date: '' },
      { title: '', description: '', amount: '', due_date: '' },
    ]);
    setDisputeMethod('auto_release_72h');
    setCreated(null);
  };

  const close = () => {
    onOpenChange(false);
    setTimeout(reset, 300);
  };

  const updateMs = (i: number, k: keyof Milestone, v: string) => {
    setMilestones(ms => ms.map((m, idx) => idx === i ? { ...m, [k]: v } : m));
  };

  const addMs = () => {
    if (milestones.length >= 6) return;
    setMilestones([...milestones, { title: '', description: '', amount: '', due_date: '' }]);
  };

  const removeMs = (i: number) => {
    if (milestones.length <= 1) return;
    setMilestones(milestones.filter((_, idx) => idx !== i));
  };

  const step1Valid = title && clientEmail && totalAmount && deadline && Number(totalAmount) > 0;
  const step2Valid = milestones.every(m => m.title && m.amount && m.due_date && Number(m.amount) > 0)
    && Math.abs(remaining) < 0.01;

  const submit = async () => {
    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('create-contract', {
        body: {
          title,
          description,
          client_email: clientEmail,
          total_amount: Number(totalAmount),
          deadline: new Date(deadline).toISOString(),
          dispute_method: disputeMethod,
          milestones: milestones.map(m => ({
            title: m.title,
            description: m.description,
            amount: Number(m.amount),
            due_date: new Date(m.due_date).toISOString(),
          })),
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setCreated({ code: data.contract_code, share: data.public_share_code });
      onCreated?.();
    } catch (e: any) {
      toast({ title: 'Could not create contract', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const shareUrl = created ? `${window.location.origin}/contract/${created.share}` : '';

  return (
    <Dialog open={open} onOpenChange={(v) => v ? onOpenChange(true) : close()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {created ? 'Contract Created' : 'New Freelance Contract'}
          </DialogTitle>
        </DialogHeader>

        {!created && (
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className="flex-1">
                <div className={`h-1 rounded-full ${s <= step ? 'bg-primary' : 'bg-muted'}`} />
                <div className={`mt-2 text-[10px] uppercase tracking-wider font-semibold ${s <= step ? 'text-primary' : 'text-muted-foreground'}`}>
                  {['Basics', 'Milestones', 'Dispute', 'Review'][s - 1]}
                </div>
              </div>
            ))}
          </div>
        )}

        {created ? (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold">Contract created and invitation sent</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {clientEmail} can now fund this contract using the link below.
              </p>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Contract ID</Label>
              <div className="font-mono text-sm bg-input rounded-xl px-4 py-3">{created.code}</div>
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Share Link</Label>
              <div className="flex gap-2">
                <div className="flex-1 font-mono text-xs bg-input rounded-xl px-4 py-3 truncate">{shareUrl}</div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    toast({ title: 'Copied to clipboard' });
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button className="w-full" onClick={close}>Done</Button>
          </div>
        ) : step === 1 ? (
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Project Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Brand Identity Design" />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the deliverables..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Client Email</Label>
              <Input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@email.com" />
              <p className="text-xs text-muted-foreground">Client must sign up with this email to fund the contract.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Total Value (USDC)</Label>
                <Input type="number" step="0.01" value={totalAmount} onChange={(e) => setTotalAmount(e.target.value)} placeholder="1000.00" className="font-mono" />
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] uppercase tracking-wider text-muted-foreground">Final Deadline</Label>
                <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setStep(2)} disabled={!step1Valid}>Continue →</Button>
            </div>
          </div>
        ) : step === 2 ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              Break the project into milestones. Each releases a portion when client approves.
            </p>
            {milestones.map((m, i) => (
              <div key={i} className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold">Milestone {i + 1}</span>
                  {milestones.length > 1 && (
                    <button onClick={() => removeMs(i)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <Input value={m.title} onChange={(e) => updateMs(i, 'title', e.target.value)} placeholder="e.g. Initial concepts" />
                <Textarea value={m.description} onChange={(e) => updateMs(i, 'description', e.target.value)} placeholder="What you will deliver" rows={2} />
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" step="0.01" value={m.amount} onChange={(e) => updateMs(i, 'amount', e.target.value)} placeholder="Amount USDC" className="font-mono" />
                  <Input type="date" value={m.due_date} onChange={(e) => updateMs(i, 'due_date', e.target.value)} />
                </div>
              </div>
            ))}
            {milestones.length < 6 && (
              <Button variant="outline" onClick={addMs} className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Add Milestone
              </Button>
            )}
            <div className="rounded-xl bg-input p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Allocated</span>
                <span className="font-mono">{fmtUSDC(allocated)} / {fmtUSDC(total)}</span>
              </div>
              <div className="mt-2 h-2 bg-background rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${Math.abs(remaining) < 0.01 ? 'bg-primary' : 'bg-amber'}`}
                  style={{ width: `${total ? Math.min(100, (allocated / total) * 100) : 0}%` }}
                />
              </div>
              {Math.abs(remaining) >= 0.01 && (
                <p className={`text-xs mt-2 ${remaining < 0 ? 'text-destructive' : 'text-amber'}`}>
                  {remaining > 0 ? `${fmtUSDC(remaining)} unallocated` : `${fmtUSDC(Math.abs(remaining))} over total`}
                </p>
              )}
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(1)}>← Back</Button>
              <Button onClick={() => setStep(3)} disabled={!step2Valid}>Continue →</Button>
            </div>
          </div>
        ) : step === 3 ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              How should disagreements be handled?
            </p>
            <button
              onClick={() => setDisputeMethod('auto_release_72h')}
              className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                disputeMethod === 'auto_release_72h' ? 'border-primary bg-primary/5' : 'border-border hover:border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold">Auto-Release After 72 Hours</h4>
                    {disputeMethod === 'auto_release_72h' && <Check className="w-5 h-5 text-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    If client doesn't respond in 72hrs, funds release automatically.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">Best for established relationships</p>
                </div>
              </div>
            </button>
            <button
              onClick={() => setDisputeMethod('nexolpay_arbitration')}
              className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                disputeMethod === 'nexolpay_arbitration' ? 'border-primary bg-primary/5' : 'border-border hover:border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                <Scale className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold">NexolPay Arbitration</h4>
                    {disputeMethod === 'nexolpay_arbitration' && <Check className="w-5 h-5 text-primary" />}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    NexolPay reviews evidence and decides within 48hrs.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">2% arbitration fee · Best for new clients</p>
                </div>
              </div>
            </button>
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(2)}>← Back</Button>
              <Button onClick={() => setStep(4)}>Continue →</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-border p-4 space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Project</span><span className="font-medium">{title}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Client</span><span className="font-medium">{clientEmail}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Value</span><span className="font-mono font-bold text-primary">{fmtUSDC(total)} USDC</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Deadline</span><span>{new Date(deadline).toLocaleDateString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Dispute</span><span>{disputeMethod === 'auto_release_72h' ? 'Auto-release 72h' : 'Arbitration'}</span></div>
            </div>
            <div className="rounded-xl border border-border p-4 space-y-2">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2">Milestones</p>
              {milestones.map((m, i) => (
                <div key={i} className="flex justify-between text-sm py-1">
                  <span>{i + 1}. {m.title}</span>
                  <span className="font-mono">{fmtUSDC(Number(m.amount))} · {new Date(m.due_date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 text-sm space-y-1.5">
              <p className="font-bold text-primary text-[11px] uppercase tracking-wider">What happens next</p>
              <p className="text-muted-foreground">1. Stellar testnet escrow created</p>
              <p className="text-muted-foreground">2. Client receives funding invitation</p>
              <p className="text-muted-foreground">3. Funds locked in escrow</p>
              <p className="text-muted-foreground">4. You deliver → request payment per milestone</p>
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep(3)} disabled={submitting}>← Back</Button>
              <Button onClick={submit} disabled={submitting}>
                {submitting ? 'Creating...' : 'Create Contract & Invite Client'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
