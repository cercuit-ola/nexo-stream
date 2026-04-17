import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Contract, Milestone, fmtUSDC } from '@/lib/contracts';
import { ContractStatusBadge } from '@/components/contracts/StatusBadge';
import { NewContractModal } from '@/components/contracts/NewContractModal';
import { Plus, Briefcase, ArrowRight, Loader2 } from 'lucide-react';

export default function Contracts() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState<'freelancer' | 'client'>('freelancer');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [milestonesMap, setMilestonesMap] = useState<Record<string, Milestone[]>>({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const query = supabase.from('contracts').select('*').order('created_at', { ascending: false });
    const { data: list } = tab === 'freelancer'
      ? await query.eq('freelancer_id', user.id)
      : await query.or(`client_id.eq.${user.id},client_email.eq.${profile?.email ?? user.email}`);

    setContracts((list as Contract[]) ?? []);

    if (list && list.length > 0) {
      const ids = list.map(c => c.id);
      const { data: ms } = await supabase
        .from('contract_milestones')
        .select('*')
        .in('contract_id', ids)
        .order('position');
      const map: Record<string, Milestone[]> = {};
      (ms ?? []).forEach((m: any) => {
        if (!map[m.contract_id]) map[m.contract_id] = [];
        map[m.contract_id].push(m as Milestone);
      });
      setMilestonesMap(map);
    } else {
      setMilestonesMap({});
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user, tab, profile?.email]);

  const stats = {
    active: contracts.filter(c => c.status === 'active').length,
    inEscrow: contracts.filter(c => c.status === 'active').reduce((s, c) => {
      const ms = milestonesMap[c.id] ?? [];
      const remaining = ms.filter(m => m.status !== 'paid').reduce((a, m) => a + Number(m.amount), 0);
      return s + remaining;
    }, 0),
    earned: contracts.reduce((s, c) => {
      const ms = milestonesMap[c.id] ?? [];
      return s + ms.filter(m => m.status === 'paid').reduce((a, m) => a + Number(m.amount), 0);
    }, 0),
    pending: contracts.reduce((s, c) => {
      const ms = milestonesMap[c.id] ?? [];
      return s + ms.filter(m => m.status === 'pending_approval').length;
    }, 0),
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Freelance Contracts</h1>
          <p className="text-muted-foreground mt-1">Get paid on time. Every time.</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Contract
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Contracts" value={String(stats.active)} />
        <StatCard label="In Escrow" value={fmtUSDC(stats.inEscrow)} mono />
        <StatCard label="Total Earned" value={fmtUSDC(stats.earned)} mono accent />
        <StatCard label="Pending Approval" value={String(stats.pending)} />
      </div>

      <div className="border-b border-border flex gap-6">
        {(['freelancer', 'client'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            As {t === 'freelancer' ? 'Freelancer' : 'Client'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-dashed border-border">
          <Briefcase className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-bold">No contracts yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {tab === 'freelancer' ? 'Create your first contract to get started.' : 'Contracts where you are the client will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map(c => {
            const ms = milestonesMap[c.id] ?? [];
            const paid = ms.filter(m => m.status === 'paid').length;
            const total = ms.length || 1;
            return (
              <Link
                key={c.id}
                to={`/dashboard/contracts/${c.id}`}
                className="block bg-card rounded-2xl border border-border p-6 hover:border-primary/30 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-bold">{c.title}</h3>
                    <p className="text-xs text-muted-foreground font-mono mt-1">{c.contract_code} · {tab === 'freelancer' ? c.client_email : c.freelancer_email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-primary">{fmtUSDC(c.total_amount)}</span>
                    <ContractStatusBadge status={c.status} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{paid} of {total} milestones paid</span>
                    <span>Deadline: {new Date(c.deadline).toLocaleDateString()}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-input overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${(paid / total) * 100}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-end mt-4 text-sm text-muted-foreground">
                  View details <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <NewContractModal open={showModal} onOpenChange={setShowModal} onCreated={load} />
    </div>
  );
}

function StatCard({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: boolean }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      <p className={`mt-3 text-2xl font-bold ${mono ? 'font-mono' : ''} ${accent ? 'text-primary' : ''}`}>{value}</p>
    </div>
  );
}
