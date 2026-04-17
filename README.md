# NexolPay

> **Income management and payment infrastructure for African creators and freelancers.**
> Split income. Lock savings. Get paid on time. Built on Stellar.

[![Stellar](https://img.shields.io/badge/Blockchain-Stellar-00D98B?style=flat-square)](https://stellar.org)
[![USDC](https://img.shields.io/badge/Stablecoin-USDC-2775CA?style=flat-square)](https://circle.com/usdc)
[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014-black?style=flat-square)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=flat-square)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-white?style=flat-square)](LICENSE)

---

## Table of Contents

- [Overview](#overview)
- [Why NexolPay Exists](#why-nexolpay-exists)
- [Core Features](#core-features)
  - [Income Scheduler — Stellar Escrow](#1-income-scheduler--stellar-escrow)
  - [Freelance Contracts — Milestone Escrow](#2-freelance-contracts--milestone-escrow)
  - [Gift Card Redemption → USDT](#3-gift-card-redemption--usdt)
  - [NexolPay Vault — Yield Savings](#4-nexolpay-vault--yield-savings)
  - [Wallet — USDC to NGN Off-Ramp](#5-wallet--usdc-to-ngn-off-ramp)
  - [AI Agent — Automated Rules](#6-ai-agent--automated-rules)
- [Architecture](#architecture)
- [Stellar Foundation Integration](#stellar-foundation-integration)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [Supabase Edge Functions](#supabase-edge-functions)
- [Admin Panel](#admin-panel)
- [Roadmap](#roadmap)
- [Team](#team)

---

## Overview

NexolPay is a fullstack financial dashboard built for African creators, freelancers, and digital earners who receive income in crypto or gift cards and need a complete system to manage, save, and spend it.

The platform combines **Stellar blockchain escrow** for payment scheduling and freelance contracts, **Base L2** for yield-bearing savings, and a **manual OTC pipeline** for gift card redemption — all wrapped in a clean, dark-themed web dashboard.

**Live dashboard:** [nexo-sana-spark.lovable.app/dashboard](https://nexo-sana-spark.lovable.app/dashboard)

---

## Why NexolPay Exists

| Problem | Scale | Source |
|---|---|---|
| Nigerian gift card market runs through unprotected WhatsApp traders at 35–50% haircuts | $900M annually | Industry 2024 |
| Monthly P2P crypto volume with no formal off-ramp since CBN-Binance shutdown | $400M/month | Chainalysis 2024 |
| Salary earners who exhaust entire monthly income in week one | 57% | EFInA 2023 |
| African freelancers who get ghosted by clients after delivering work | No formal escrow infrastructure | — |

NexolPay closes all four gaps in a single platform.

---

## Core Features

---

### 1. Income Scheduler — Stellar Escrow

**The problem it solves:** African salary earners and freelancers receive lump-sum payments and spend everything in week one. There is no infrastructure that enforces a savings rhythm the way a smart contract can.

**How it works:**

When a user deposits a monthly income into the Income Scheduler, NexolPay creates a dedicated **Stellar escrow account** and pre-signs four time-locked payment transactions — one per week. Each transaction has a `min_time` TimeBound set to its exact unlock timestamp. The funds physically cannot be accessed before the scheduled date. No admin override. No early withdrawal. Stellar enforces it at the protocol level.

```
User deposits $1,000 USDC
          ↓
NexolPay Backend creates Stellar escrow account
          ↓
4 pre-signed time-locked transactions stored in DB
  Week 1 XDR: unlocks timestamp + (7 * 86400)
  Week 2 XDR: unlocks timestamp + (14 * 86400)
  Week 3 XDR: unlocks timestamp + (21 * 86400)
  Week 4 XDR: unlocks timestamp + (28 * 86400)
          ↓
Supabase pg_cron checks every 30 minutes
          ↓
Due XDR envelopes submitted to Stellar Horizon
          ↓
$250 USDC released to user wallet every Monday
          ↓
Supabase Realtime pushes notification to UI
```

**Two schedule types:**

| Type | Description | Use Case |
|---|---|---|
| 7-Day Lock | Full deposit locked for exactly 7 days | Hold a payment before spending, short-term commitment |
| Monthly Split | Deposit ÷ 4 released every 7 days for 4 weeks | Weekly salary management, income discipline |

**Stellar SDK implementation (Edge Function):**

```typescript
import {
  Keypair, Server, TransactionBuilder,
  Network, Asset, Operation
} from '@stellar/stellar-sdk'

const HORIZON_URL = 'https://horizon.stellar.org'
const NETWORK_PASSPHRASE = Network.PUBLIC_NETWORK_PASSPHRASE
const USDC_ASSET = new Asset(
  'USDC',
  'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN'
)

async function createIncomeSchedule(
  totalAmount: string,
  numWeeks: number,
  startTimestamp: number
) {
  const server = new Server(HORIZON_URL)
  const escrowKeypair = Keypair.random()

  // 1. Create and fund escrow account
  // 2. Set USDC trustline on escrow
  // 3. Transfer USDC from user to escrow
  // 4. Pre-sign weekly release transactions with TimeBounds
  const weeklyTxs = []

  for (let week = 1; week <= numWeeks; week++) {
    const unlockTime = startTimestamp + (week * 7 * 24 * 60 * 60)
    const escrowAccount = await server.loadAccount(escrowKeypair.publicKey())

    const releaseTx = new TransactionBuilder(escrowAccount, {
      fee: await server.fetchBaseFee(),
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(Operation.payment({
        destination: userPublicKey,
        asset: USDC_ASSET,
        amount: (Number(totalAmount) / numWeeks).toFixed(7),
      }))
      .addTimebounds(unlockTime, unlockTime + 86400) // 24hr submission window
      .build()

    releaseTx.sign(escrowKeypair)

    weeklyTxs.push({
      week,
      unlock_timestamp: unlockTime,
      tx_envelope: releaseTx.toXDR(),
    })
  }

  return { escrowKeypair, weeklyTxs }
}
```

**ZK Privacy Layer:**

The Income Scheduler includes a Zero Knowledge commitment layer. Instead of storing the deposit amount in the Stellar transaction memo (publicly visible), NexolPay stores a SHA-256 commitment hash:

```
commitment = SHA256(amount + userId + timestamp + salt)
```

The commitment is stored in the Stellar memo. The actual amount is encrypted in Supabase and only visible to the authenticated user. This means:

- ✅ Anyone can verify the escrow account exists on Stellar
- ✅ Anyone can verify a payment was released on schedule
- ❌ Nobody can see how much is locked or the recipient address from the memo alone

Users can also generate a **Balance Proof** — a signed hash that proves their balance exceeds a minimum threshold without revealing the exact amount. Useful for proving creditworthiness or savings discipline to a third party.

---

### 2. Freelance Contracts — Milestone Escrow

**The problem it solves:** African freelancers frequently deliver work and never get paid. Clients frequently pay and receive incomplete work. There is no escrow infrastructure built for the way African freelancers actually work.

**How it works:**

A freelancer creates a contract with defined milestones. The client funds the **full project amount upfront** into a Stellar escrow account. Funds release automatically per milestone when the client approves delivery. If the client does not respond within 72 hours, the milestone releases automatically. If there is a genuine dispute, NexolPay arbitration resolves it within 48 hours.

```
Freelancer creates contract with milestones
          ↓
Client receives email invitation + funding link
          ↓
Client deposits full project amount to Stellar escrow
          ↓
Freelancer begins work
          ↓
Freelancer completes milestone → marks complete
          ↓
Client receives approval request notification
          ↓
          ├─ Client approves → milestone amount released
          ├─ Client silent 72hrs → auto-release fires
          └─ Dispute raised → NexolPay arbitration
          ↓
Next milestone unlocks
          ↓
Repeat until all milestones complete
```

**Escrow architecture on Stellar:**

Each contract creates one Stellar escrow account holding the full project value. NexolPay is added as a co-signer with weight 1, meaning:

- Normal milestone releases: signed by escrow keypair alone (weight 1 = sufficient)
- Dispute resolution: NexolPay co-signature added, allowing fund redirection without both parties

```typescript
// Set up co-signing for dispute capability
const setOptionsOp = Operation.setOptions({
  signer: {
    ed25519PublicKey: NEXOLPAY_MASTER_PUBLIC_KEY,
    weight: 1,
  },
  masterWeight: 1,
  lowThreshold: 1,
  medThreshold: 1,
  highThreshold: 1,
})
```

**Milestone release flow:**

```typescript
async function releaseMilestone(
  escrowSecret: string,
  freelancerPublicKey: string,
  milestoneAmount: string
) {
  const server = new Server(HORIZON_URL)
  const escrowKeypair = Keypair.fromSecret(escrowSecret)
  const escrowAccount = await server.loadAccount(escrowKeypair.publicKey())

  const releaseTx = new TransactionBuilder(escrowAccount, {
    fee: await server.fetchBaseFee(),
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(Operation.payment({
      destination: freelancerPublicKey,
      asset: USDC_ASSET,
      amount: milestoneAmount,
    }))
    .setTimeout(180)
    .build()

  releaseTx.sign(escrowKeypair)

  const result = await server.submitTransaction(releaseTx)
  return result.hash
}
```

**Auto-release mechanism:**

```sql
-- pg_cron job runs every 15 minutes
SELECT cron.schedule(
  'auto-release-milestones',
  '*/15 * * * *',
  $$
  UPDATE contract_milestones
  SET status = 'auto_releasing'
  WHERE status = 'awaiting_approval'
    AND auto_release_at <= NOW()
    AND dispute_raised = false;
  $$
);
```

**Dispute freeze:**

When a dispute is raised, the escrow account threshold is raised to require both signatures before any funds move:

```typescript
// Freeze funds — require both escrow + NexolPay to sign
const freezeOp = Operation.setOptions({
  medThreshold: 2,
  highThreshold: 2,
})
```

**Contract states:**

| Status | Description |
|---|---|
| `awaiting_funding` | Contract created, client email sent, no deposit yet |
| `active` | Client funded escrow, freelancer can begin |
| `disputed` | Dispute raised, funds frozen, arbitration in progress |
| `completed` | All milestones paid, contract closed |
| `cancelled` | Cancelled before funding |

---

### 3. Gift Card Redemption → USDT

**The problem it solves:** Nigeria's $900M gift card market runs through unprotected WhatsApp traders. Users get scammed, overcharged 35–50%, and have no receipt or recourse.

**How it works — Manual OTC Pipeline:**

> **Important note on gift card APIs:** There is no free public API that automatically redeems gift cards to USDT. All services (Raise, CardCash, GiftDeals) require paid B2B agreements and enterprise minimum volumes. NexolPay uses a **Manual OTC (Over-The-Counter)** approach — the industry standard for gift card desks in emerging markets.

The flow:

```
User submits gift card brand, denomination,
card code, and PIN (if required)
          ↓
NexolPay deducts commission preview: 30%
User sees: $100 card → $70 USDT
          ↓
User confirms submission
          ↓
Reference generated: NXL-2026-XXXXX
          ↓
90-second countdown timer shown on screen
          ↓
Admin receives card in /admin/giftcards panel
Admin manually validates card balance using
official brand balance checker URL:
  Amazon:  amazon.com/gc/redeem
  Apple:   iforgot.apple.com
  Google:  play.google.com/redeem
  Netflix: netflix.com/redeem
  Steam:   store.steampowered.com/account/redeemwalletcode
          ↓
Admin clicks APPROVE or REJECT in admin panel
          ↓
Supabase Realtime pushes decision to user's screen
          ↓
If APPROVED: $70 USDC credited to user's wallet
If REJECTED: reason shown, user can try again
```

**Supported brands:**

| Brand | Regions |
|---|---|
| Amazon | US, UK, EU, CA, AU |
| Apple | US, UK, EU, CA, AU |
| Google Play | US, UK, EU, CA, AU |
| Netflix | US, UK |
| Steam | US, UK, EU |
| Xbox | US, UK |
| PlayStation | US, UK |
| Vanilla Visa | US |

**Commission structure:**

```
Commission rate: 30% flat on all redemptions

$10  card → $7.00  USDT
$25  card → $17.50 USDT
$50  card → $35.00 USDT
$100 card → $70.00 USDT
$200 card → $140.00 USDT
$500 card → $350.00 USDT
```

This is still significantly cheaper than WhatsApp traders (35–50%) and provides a receipt, a reference number, and full dispute protection.

**Security:**

- Card codes and PINs encrypted at rest in Supabase using `pgcrypto`
- Card codes never returned to frontend after submission
- Duplicate detection: same card code blocked within 24 hours
- Rate limiting: max 3 submissions per user per hour
- All admin actions logged to `audit_log` with timestamp and admin ID

**Admin panel flow:**

```
Admin sees pending queue in real time
Each item shows:
  Reference | User email | Brand | Card Value
  Full card code (copyable) | PIN | Submitted X mins ago

Admin validates card on brand website
Admin clicks APPROVE → confirm modal
  "Release $70 USDC to user@email.com"
  Commission retained: $30

On confirm:
  usdc_balance += 70 in users table
  status = 'approved'
  Supabase Realtime fires → user sees success
```

---

### 4. NexolPay Vault — Yield Savings

**The problem it solves:** African retail users have no access to yield-bearing stablecoin savings products. Nigerian banks offer near-zero interest. DeFi yield requires technical knowledge most users don't have.

**How it works:**

Users lock USDC for a fixed period and earn APY on their deposit. Funds are locked — no early withdrawal. Yield accrues automatically and is paid out at unlock alongside principal.

**Lock tiers:**

| Period | APY | $1,000 yield | Total payout |
|---|---|---|---|
| 3 months | 5.2% | $13.00 | $1,013.00 |
| 6 months | 7.8% | $39.00 | $1,039.00 |
| 12 months | 12.5% | $125.00 | $1,125.00 |

**Architecture:**

Vault yield is powered by **Aave V3 on Base L2** under the hood. User-facing yield rates are slightly below Aave market rates — the spread (1–2%) is NexolPay's yield revenue. Users never interact with Aave directly.

Current status: Vault runs in **simulation mode** with JavaScript-calculated yield until Base mainnet contracts are audited and deployed. Simulation is clearly marked with a "Base Integration Coming" badge.

**Live yield calculation:**

```typescript
function calculateAccruedYield(
  principal: number,
  apyRate: number,
  depositDate: Date
): number {
  const daysElapsed = (Date.now() - depositDate.getTime()) / 86400000
  return principal * (apyRate / 100) * (daysElapsed / 365)
}
```

---

### 5. Wallet — USDC to NGN Off-Ramp

**The problem it solves:** Nigeria's formal crypto off-ramp collapsed after the 2024 CBN-Binance shutdown. $400M in monthly P2P crypto volume has nowhere reliable to go.

**How it works:**

Users convert their USDC balance to Nigerian Naira and receive it in any Nigerian bank account. Rate fetched live from CoinGecko. Admin processes payout via Paystack. Zero withdrawal fee at launch.

**Supported banks:**

GTBank · Access Bank · Zenith Bank · First Bank · UBA · Kuda · OPay · Moniepoint · Sterling · Wema · Fidelity

**Rate source:**

```
GET https://api.coingecko.com/api/v3/simple/price
    ?ids=usd-coin&vs_currencies=ngn
Refreshed every 60 seconds
```

**Bank account verification:**

```
Paystack Resolve API:
GET https://api.paystack.co/bank/resolve
    ?account_number=XXXXXXXXXX&bank_code=XXX
Authorization: Bearer PAYSTACK_SECRET_KEY

Returns: { account_name, account_number, bank_id }
```

**Off-ramp flow:**

```
User enters USDC amount
Live NGN equivalent shown
Bank account selected (verified via Paystack)
"Convert & Withdraw" clicked
  ↓
usdc_amount deducted from usdc_balance
withdrawal_requests record created: status=pending
  ↓
Admin receives in /admin/withdrawals queue
Admin processes Paystack payout manually
Admin marks completed
  ↓
Supabase Realtime notifies user
"₦155,000 has been sent to your GTBank account"
```

---

### 6. AI Agent — Automated Rules

**The problem it solves:** Managing multiple financial products manually requires constant attention. Most users forget to re-lock savings, miss good exchange rates, or delay splitting income.

**How it works:**

Users describe a financial rule in plain English. The **NexolPay Agent** (powered by Claude API) parses the rule into a structured action object and executes it automatically every 30 minutes via Supabase pg_cron.

**Example rules:**

```
"Every time my balance exceeds $500, 
 create a monthly income split schedule"

"When my vault unlocks, automatically 
 re-lock 80% for another 6 months"

"Every Monday, convert $50 USDC to NGN 
 and send to my GTBank account"

"When my balance drops below $20, 
 send me a notification"
```

**Rule parsing (Claude API):**

```typescript
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-20250514',
  max_tokens: 500,
  system: `Parse user financial rules into JSON with fields:
    trigger_type, trigger_value, action_type, 
    action_amount, action_params, frequency.
    Return only valid JSON.`,
  messages: [{ role: 'user', content: ruleText }],
})
```

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   NexolPay Dashboard                 │
│                  (Next.js 14 App Router)             │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
    ┌────▼───┐  ┌────▼───┐  ┌───▼────┐
    │Supabase│  │Stellar │  │  Base  │
    │  DB +  │  │Mainnet │  │   L2   │
    │  Auth  │  │        │  │        │
    │Realtime│  │ Escrow │  │  Vault │
    └────┬───┘  │Scheduler│  │  Yield │
         │      │Contracts│  └────────┘
         │      └────┬────┘
    ┌────▼────┐       │
    │ Edge    │  ┌────▼───────────────────┐
    │Functions│  │ Stellar Horizon API     │
    │(Deno)   │  │ horizon.stellar.org     │
    └────┬────┘  └────────────────────────┘
         │
    ┌────▼───────────────────────────────┐
    │ External APIs                       │
    │ • Paystack (NGN bank off-ramp)      │
    │ • CoinGecko (USDC/NGN live rate)    │
    │ • Anthropic Claude (agent rules)   │
    └────────────────────────────────────┘
```

---

## Stellar Foundation Integration

NexolPay uses Stellar as the core payment settlement layer for two features: Income Scheduler and Freelance Contracts.

**Why Stellar:**

| Factor | Stellar | Ethereum/Base |
|---|---|---|
| Transaction fee | ~$0.000001 | ~$0.01–$0.10 |
| Native time-locks | Built into protocol | Requires Gelato/keepers |
| USDC support | Native (Circle-issued) | Native (Circle-issued) |
| Finality | 3–5 seconds | 2 seconds |
| Account model | Account-based | Account-based |
| Escrow primitive | Native | Requires smart contract |

Stellar's `TimeBounds` transaction feature means NexolPay does not need to deploy and maintain custom smart contracts for time-locked payments. The scheduling is enforced at the protocol level — cryptographically, not administratively.

**Mainnet configuration:**

```
Network: Public Global Stellar Network
Passphrase: Public Global Stellar Network ; September 2015
Horizon URL: https://horizon.stellar.org
USDC Issuer: GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN
Explorer: https://stellarchain.io
```

**Escrow account lifecycle:**

```
1. Keypair.random() → fresh escrow keypair per contract/schedule
2. CreateAccount operation → fund with 2 XLM (minimum balance)
3. ChangeTrust operation → set USDC trustline (limit: 10,000)
4. Payment operation → transfer USDC from user to escrow
5. Pre-signed release transactions stored as XDR in Supabase
6. XDR submitted to Horizon when unlock_timestamp passes
7. Escrow account closed after final release (XLM returned)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 App Router |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime |
| Backend | Supabase Edge Functions (Deno) |
| Blockchain — Payments | Stellar Mainnet |
| Blockchain — Yield | Base L2 (Aave V3) |
| Stellar SDK | @stellar/stellar-sdk |
| Bank payments | Paystack API |
| Exchange rate | CoinGecko free API |
| AI Agent | Anthropic Claude API |
| Scheduling | Supabase pg_cron |
| Email | Supabase Edge Functions + Resend |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account and project
- Stellar account funded with XLM (mainnet)
- Paystack account (for NGN off-ramp)
- Anthropic API key (for AI agent)

### Installation

```bash
# Clone the repository
git clone https://github.com/fluffydev0/nexo-stream-fluffy.git
cd nexo-stream-fluffy

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Fill in your environment variables (see below)
# Then run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Supabase Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run migrations
supabase db push

# Deploy Edge Functions
supabase functions deploy create-stellar-schedule
supabase functions deploy submit-weekly-releases
supabase functions deploy release-milestone
supabase functions deploy auto-release-check
supabase functions deploy parse-agent-rule
supabase functions deploy get-live-rate
supabase functions deploy resolve-bank-account
```

### Stellar Account Setup

```bash
# Generate your NexolPay master Stellar keypair
# Use Stellar Laboratory: https://laboratory.stellar.org

# Fund the master account with at least 10 XLM
# (covers escrow account creation for multiple users)
# Each new escrow account requires ~2 XLM

# Set env vars:
STELLAR_MASTER_PUBLIC_KEY=G...
STELLAR_MASTER_SECRET_KEY=S...
```

---

## Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stellar Mainnet
STELLAR_NETWORK=mainnet
STELLAR_HORIZON_URL=https://horizon.stellar.org
STELLAR_NETWORK_PASSPHRASE=Public Global Stellar Network ; September 2015
STELLAR_MASTER_PUBLIC_KEY=G...
STELLAR_MASTER_SECRET_KEY=S...
STELLAR_USDC_ISSUER=GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN

# Paystack (NGN off-ramp)
PAYSTACK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_...

# Anthropic (AI Agent)
ANTHROPIC_API_KEY=sk-ant-...

# CoinGecko (free tier — no key required)
COINGECKO_API_URL=https://api.coingecko.com/api/v3
```

---

## Database Schema

### Core Tables

```sql
-- Users (extends Supabase auth.users)
CREATE TABLE users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  phone TEXT,
  usdc_balance NUMERIC DEFAULT 0,
  kyc_status TEXT DEFAULT 'pending',
  -- pending | verified | rejected
  bvn TEXT, -- encrypted
  nin TEXT, -- encrypted
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Income Scheduler positions (Stellar)
CREATE TABLE scheduler_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type TEXT, -- '7day' | 'monthly'
  escrow_pubkey TEXT,
  escrow_secret TEXT, -- encrypted
  total_amount NUMERIC,
  weekly_amount NUMERIC,
  num_weeks INT DEFAULT 4,
  start_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  reference_number TEXT UNIQUE,
  zk_commitment TEXT,  -- ZK hash of amount
  zk_salt TEXT,        -- encrypted salt
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Income Scheduler weekly transactions
CREATE TABLE scheduler_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID REFERENCES scheduler_positions(id),
  user_id UUID REFERENCES users(id),
  week_number INT,
  amount NUMERIC,
  unlock_timestamp BIGINT,
  tx_envelope TEXT,   -- XDR signed envelope
  submitted BOOLEAN DEFAULT FALSE,
  stellar_tx_hash TEXT,
  submitted_at TIMESTAMPTZ,
  zk_release_proof TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Freelance Contracts
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID REFERENCES users(id),
  client_id UUID REFERENCES users(id),
  client_email TEXT,
  title TEXT,
  description TEXT,
  total_amount NUMERIC,
  deadline DATE,
  dispute_method TEXT, -- 'auto_release' | 'arbitration'
  escrow_pubkey TEXT,
  escrow_secret TEXT,  -- encrypted
  status TEXT DEFAULT 'awaiting_funding',
  reference_number TEXT UNIQUE,
  contract_link_id TEXT UNIQUE,
  funded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contract milestones
CREATE TABLE contract_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID REFERENCES contracts(id),
  freelancer_id UUID REFERENCES users(id),
  title TEXT,
  description TEXT,
  amount NUMERIC,
  due_date DATE,
  order_index INT,
  status TEXT DEFAULT 'locked',
  -- locked|active|awaiting_approval|paid|disputed
  deliverable_url TEXT,
  approval_requested_at TIMESTAMPTZ,
  auto_release_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  stellar_tx_hash TEXT,
  dispute_raised BOOLEAN DEFAULT FALSE,
  dispute_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gift card redemptions
CREATE TABLE gift_card_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  user_email TEXT,
  reference_number TEXT UNIQUE,
  brand TEXT,
  card_currency TEXT,
  card_value NUMERIC,
  card_code TEXT,  -- encrypted
  card_pin TEXT,   -- encrypted, nullable
  commission_rate NUMERIC DEFAULT 0.30,
  commission_amount NUMERIC,
  usdt_payout NUMERIC,
  status TEXT DEFAULT 'pending',
  -- pending | approved | rejected
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  actioned_at TIMESTAMPTZ,
  actioned_by TEXT
);

-- Vault positions
CREATE TABLE vault_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  lock_tier TEXT, -- '3m' | '6m' | '12m'
  apy_rate NUMERIC, -- 5.2 | 7.8 | 12.5
  principal_amount NUMERIC,
  deposit_date TIMESTAMPTZ DEFAULT NOW(),
  unlock_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  -- active | unlocked | withdrawn
  simulation_mode BOOLEAN DEFAULT TRUE,
  reference_number TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NGN withdrawal requests
CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  usdc_amount NUMERIC,
  ngn_amount NUMERIC,
  exchange_rate NUMERIC,
  bank_name TEXT,
  bank_code TEXT,
  account_number TEXT,
  account_name TEXT,
  paystack_reference TEXT,
  status TEXT DEFAULT 'pending',
  reference_number TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- AI Agent rules
CREATE TABLE agent_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  rule_text TEXT,
  parsed_rule JSONB,
  status TEXT DEFAULT 'active', -- active | paused
  times_fired INT DEFAULT 0,
  last_fired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Supabase Edge Functions

| Function | Trigger | Description |
|---|---|---|
| `create-stellar-schedule` | User action | Creates Stellar escrow, pre-signs XDR envelopes, stores in DB |
| `submit-weekly-releases` | pg_cron every 30min | Submits due XDR envelopes to Stellar Horizon |
| `create-contract` | User action | Creates Stellar escrow for freelance contract, emails client |
| `fund-contract` | Client action | Transfers USDC to contract escrow, notifies freelancer |
| `request-milestone-payment` | Freelancer action | Sets awaiting_approval, starts 72hr auto-release timer |
| `approve-milestone` | Client action | Submits Stellar payment from escrow to freelancer |
| `auto-release-check` | pg_cron every 15min | Releases milestones where 72hr timer expired |
| `raise-dispute` | User action | Freezes escrow, creates arbitration ticket |
| `parse-agent-rule` | User action | Calls Claude API to parse natural language rule to JSON |
| `run-agent-checks` | pg_cron every 30min | Evaluates and executes active agent rules |
| `get-live-rate` | Client request | Fetches USDC/NGN rate from CoinGecko, caches 60s |
| `resolve-bank-account` | User action | Calls Paystack resolve API, returns account name |

---

## Admin Panel

Access at `/admin` — requires admin role in Supabase.

| Route | Purpose |
|---|---|
| `/admin/giftcards` | Gift card approval queue — approve or reject with reason |
| `/admin/withdrawals` | NGN withdrawal queue — mark as completed with Paystack reference |
| `/admin/disputes` | Freelance contract disputes — release to freelancer or refund client |
| `/admin/kyc` | KYC review — approve or reject user verification |
| `/admin/users` | User list with USDC balances and transaction history |

All admin actions are logged to `audit_log` with timestamp, admin ID, and full action details.

---

## Roadmap

| Milestone | Status |
|---|---|
| Beta Flutter mobile app — gift card redemption | ✅ Live |
| Web dashboard — overview, scheduler, vault UI | ✅ Live |
| Stellar mainnet income scheduler | ✅ Live |
| Freelance contracts with Stellar escrow | ✅ Live |
| Gift card manual OTC redemption | ✅ Live |
| USDC → NGN off-ramp (Paystack) | 🔄 In progress |
| Base mainnet vault contracts (Aave V3) | 🔄 In development |
| AI Agent — rule automation | 🔄 In development |
| ZK privacy layer for scheduler | 🔄 In development |
| EUR + KRW off-ramp corridors | 📋 Planned |
| Mobile app — vault + contracts | 📋 Planned |
| Series A raise | 📋 Q4 2026 |

---

## Team

**Samuel Okediji — Founder & CEO**
DevOps Engineer · Web3 Developer · Technical Writer
[GitHub](https://github.com/cercuit-ola) · [LinkedIn](https://linkedin.com/in/okedijisamuelolaide) · [@onchain0x](https://twitter.com/onchain0x)

**Toyib Mustapha — Co-Founder & Backend Engineer**
Flutter Engineer · Fintech infrastructure (Bitnob, Izifin)
[LinkedIn](https://linkedin.com/in/toyibmustapha)

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

*NexolPay — Your income. Your rules. Your future.*
*Built on Stellar · Made for Africa*