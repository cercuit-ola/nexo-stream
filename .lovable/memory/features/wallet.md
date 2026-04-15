---
name: Wallet & Stellar architecture
description: StellarContext for network toggle, WalletContext for Freighter wallet, ConnectWalletButton component
type: feature
---
- StellarContext: manages mainnet/testnet toggle, stores in localStorage, provides horizonUrl, networkPassphrase, explorerBaseUrl
- WalletContext: Freighter wallet integration, connect/disconnect, balance fetch from Horizon, signTransaction, persists pubkey in localStorage
- ConnectWalletButton: two variants - 'default' (full card) and 'compact' (header chip with dropdown)
- DashboardLayout header shows: back button (on sub-pages), compact wallet button, network badge (mainnet green / testnet amber)
- Sidebar has network toggle at bottom
- Scheduler requires wallet connection to create schedules, shows confirmation modal before locking funds
- WalletPage has 3 tabs: Deposit (from wallet), Convert & Withdraw (USDC→NGN), Receive USDC
