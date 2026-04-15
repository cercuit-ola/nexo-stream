import { useWallet, getChainName } from '@/contexts/WalletContext';
import { Wallet, LogOut, Copy, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export function ConnectWalletButton({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
  const { address, balance, chainId, connected, connecting, error, connect, disconnect } = useWallet();
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncatedAddr = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  const chainName = getChainName(chainId);

  if (!connected) {
    return (
      <div className="space-y-1">
        <button
          onClick={connect}
          disabled={connecting}
          className="nexol-btn-primary flex items-center gap-2 text-sm px-5 py-2.5"
        >
          <Wallet className="h-4 w-4" />
          {connecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
        {error && <p className="text-xs text-destructive max-w-[250px]">{error}</p>}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 bg-secondary rounded-full px-3 py-1.5 text-sm hover:bg-secondary/80 transition-colors"
        >
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="font-mono text-foreground text-xs">{truncatedAddr}</span>
        </button>

        {showDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
            <div className="absolute right-0 top-full mt-2 z-50 nexol-card p-3 min-w-[240px] space-y-2">
              <div className="text-xs text-muted-foreground">Connected Wallet</div>
              <div className="font-mono text-xs text-foreground break-all">{address}</div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Network:</span>
                <span className="text-xs font-medium text-foreground">{chainName}</span>
              </div>
              {balance && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Balance:</span>
                  <span className="font-mono font-bold text-primary">{balance} ETH</span>
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button onClick={copyAddress} className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground">
                  {copied ? <CheckCircle className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button onClick={() => { disconnect(); setShowDropdown(false); }} className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded-lg bg-destructive/20 hover:bg-destructive/30 text-destructive">
                  <LogOut className="h-3 w-3" /> Disconnect
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Default full variant
  return (
    <div className="nexol-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium text-foreground">Wallet Connected</span>
        </div>
        <button onClick={disconnect} className="text-xs text-destructive hover:underline flex items-center gap-1">
          <LogOut className="h-3 w-3" /> Disconnect
        </button>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-muted-foreground">{truncatedAddr}</span>
        <button onClick={copyAddress} className="text-muted-foreground hover:text-foreground">
          {copied ? <CheckCircle className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      <div className="text-xs text-muted-foreground">{chainName}</div>
      {balance && (
        <div className="font-mono text-2xl font-bold text-foreground">{balance} <span className="text-sm text-muted-foreground">ETH</span></div>
      )}
    </div>
  );
}
