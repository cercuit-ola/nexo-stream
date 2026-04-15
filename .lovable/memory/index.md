# Project Memory

## Core
Dark fintech dashboard. Primary #00D98B (green), bg #0A0A0A, cards #131B24. Inter body, Space Mono for numbers.
React + Vite + Supabase. No Next.js. Stellar mainnet-ready with testnet toggle. Paystack for NGN off-ramp.
NexolPay - crypto dashboard with scheduler, vault, wallet, gift card features.
Freighter wallet integration via WalletContext. StellarContext manages network config.

## Memories
- [Design tokens](mem://design/tokens) — Full NexolPay color palette, typography, card styles
- [DB schema](mem://features/db-schema) — All Supabase tables: users, bank_accounts, scheduler_positions, scheduler_transactions, vault_positions, withdrawal_requests, gift_card_redemptions, notifications, audit_log, user_roles
- [App routes](mem://features/routes) — Auth: /login, /signup. Dashboard: /dashboard/* (scheduler, vault, wallet, giftcard, transactions, settings). Admin: /admin/*
- [Wallet architecture](mem://features/wallet) — StellarContext (network toggle, horizon URL), WalletContext (Freighter connect/disconnect, balance, signing), ConnectWalletButton component
