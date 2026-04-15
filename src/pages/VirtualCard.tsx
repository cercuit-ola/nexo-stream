import { useState } from 'react';
import { CreditCard, Plus, Eye, EyeOff, Copy, Check, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface VCard {
  id: string;
  last4: string;
  balance: number;
  status: 'active' | 'frozen';
  created: string;
  label: string;
}

export default function VirtualCard() {
  const { profile } = useAuth();
  const [cards] = useState<VCard[]>([]);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Virtual Cards</h1>
          <p className="text-sm text-muted-foreground">Create and manage virtual USDT debit cards</p>
        </div>
        <button className="nexol-btn-primary flex items-center gap-2 w-full sm:w-auto justify-center">
          <Plus className="h-4 w-4" />
          Create Card
        </button>
      </div>

      {/* Balance overview */}
      <div className="nexol-card p-5">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm text-muted-foreground">Available for Cards</span>
        </div>
        <div className="font-mono text-3xl font-bold text-foreground">
          ${(profile?.usdc_balance ?? 0).toFixed(2)} <span className="text-base text-muted-foreground font-normal">USDT</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Fund your virtual cards from your USDT balance</p>
      </div>

      {/* Cards list */}
      {cards.length === 0 ? (
        <div className="nexol-card p-8 sm:p-12 text-center">
          <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Virtual Cards Yet</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Create your first virtual USDT card to make online purchases, pay subscriptions, or shop internationally.
          </p>
          <button className="nexol-btn-primary inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Your First Card
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card) => (
            <div key={card.id} className="nexol-card p-5 space-y-4">
              {/* Card visual */}
              <div className="relative bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl p-5 min-h-[160px] flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground font-medium">{card.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    card.status === 'active' ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'
                  }`}>
                    {card.status}
                  </span>
                </div>
                <div>
                  <div className="font-mono text-lg text-foreground tracking-wider">
                    •••• •••• •••• {card.last4}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">USDT Virtual</span>
                    <span className="font-mono text-sm font-bold text-foreground">${card.balance.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDetails(showDetails === card.id ? null : card.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-secondary text-sm text-foreground hover:bg-secondary/80 transition-colors"
                >
                  {showDetails === card.id ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {showDetails === card.id ? 'Hide' : 'Details'}
                </button>
                <button
                  onClick={() => handleCopy(card.last4)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-secondary text-sm text-foreground hover:bg-secondary/80 transition-colors"
                >
                  {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                  Copy
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info */}
      <div className="nexol-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">How It Works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Create Card', desc: 'Generate a virtual card funded from your USDT balance' },
            { step: '2', title: 'Use Anywhere', desc: 'Pay online, subscriptions, and international purchases' },
            { step: '3', title: 'Track Spending', desc: 'Monitor transactions and manage card limits' },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                {item.step}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
