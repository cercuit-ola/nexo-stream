import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface WalletContextType {
  address: string | null;
  balance: string | null;
  chainId: number | null;
  connected: boolean;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

function getEthereum(): any {
  return (window as any).ethereum;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(() => localStorage.getItem('nexol_wallet_address'));
  const [balance, setBalance] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async (addr: string) => {
    try {
      const ethereum = getEthereum();
      if (!ethereum) return;
      const balHex = await ethereum.request({ method: 'eth_getBalance', params: [addr, 'latest'] });
      const balWei = BigInt(balHex);
      const balEth = Number(balWei) / 1e18;
      setBalance(balEth.toFixed(4));
    } catch {
      setBalance('0.0000');
    }
  }, []);

  const fetchChainId = useCallback(async () => {
    try {
      const ethereum = getEthereum();
      if (!ethereum) return;
      const id = await ethereum.request({ method: 'eth_chainId' });
      setChainId(parseInt(id, 16));
    } catch {}
  }, []);

  const refreshBalance = useCallback(async () => {
    if (address) await fetchBalance(address);
  }, [address, fetchBalance]);

  // Listen for account/chain changes
  useEffect(() => {
    const ethereum = getEthereum();
    if (!ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAddress(null);
        setBalance(null);
        localStorage.removeItem('nexol_wallet_address');
      } else {
        const addr = accounts[0];
        setAddress(addr);
        localStorage.setItem('nexol_wallet_address', addr);
        fetchBalance(addr);
      }
    };

    const handleChainChanged = (id: string) => {
      setChainId(parseInt(id, 16));
      if (address) fetchBalance(address);
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      ethereum.removeListener('accountsChanged', handleAccountsChanged);
      ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [address, fetchBalance]);

  // Auto-reconnect
  useEffect(() => {
    const saved = localStorage.getItem('nexol_wallet_address');
    if (saved) {
      const ethereum = getEthereum();
      if (ethereum) {
        ethereum.request({ method: 'eth_accounts' }).then((accounts: string[]) => {
          if (accounts.includes(saved)) {
            setAddress(saved);
            fetchBalance(saved);
            fetchChainId();
          } else {
            localStorage.removeItem('nexol_wallet_address');
            setAddress(null);
          }
        }).catch(() => {});
      }
    }
  }, [fetchBalance, fetchChainId]);

  const connect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const ethereum = getEthereum();
      if (!ethereum) {
        setError('MetaMask not found. Please install the MetaMask browser extension.');
        setConnecting(false);
        return;
      }

      const accounts: string[] = await ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        setError('No accounts found. Please unlock MetaMask.');
        setConnecting(false);
        return;
      }

      const addr = accounts[0];
      setAddress(addr);
      localStorage.setItem('nexol_wallet_address', addr);
      await fetchBalance(addr);
      await fetchChainId();

      // Save wallet address to user profile
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('users').update({ wallet_address: addr }).eq('id', user.id);
      }
    } catch (err: any) {
      if (err.code === 4001) {
        setError('Connection rejected by user.');
      } else {
        setError(err?.message ?? 'Failed to connect wallet');
      }
    }
    setConnecting(false);
  };

  const disconnect = () => {
    setAddress(null);
    setBalance(null);
    setChainId(null);
    localStorage.removeItem('nexol_wallet_address');
  };

  return (
    <WalletContext.Provider value={{
      address,
      balance,
      chainId,
      connected: !!address,
      connecting,
      error,
      connect,
      disconnect,
      refreshBalance,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}

// Helper to get chain name
export function getChainName(chainId: number | null): string {
  switch (chainId) {
    case 1: return 'Ethereum';
    case 137: return 'Polygon';
    case 56: return 'BNB Chain';
    case 42161: return 'Arbitrum';
    case 10: return 'Optimism';
    case 8453: return 'Base';
    case 43114: return 'Avalanche';
    case 5: return 'Goerli';
    case 11155111: return 'Sepolia';
    default: return chainId ? `Chain ${chainId}` : 'Unknown';
  }
}
