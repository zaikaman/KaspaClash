# Quickstart Guide: KaspaClash Development

**Date**: 2025-12-31  
**Purpose**: Get developers up and running with local development

---

## Prerequisites

- **Node.js**: v20+ LTS ([download](https://nodejs.org/))
- **pnpm**: v8+ (recommended) or npm
- **Git**: For version control
- **Kaspa Wallet**: Kasware or Kaspium browser extension
- **Supabase Account**: Free tier at [supabase.com](https://supabase.com)

---

## 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/zaikaman/KaspaClash.git
cd KaspaClash

# Install dependencies
pnpm install
# or: npm install
```

---

## 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in the required values:

```env
# .env.local

# Supabase (get from supabase.com dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Kaspa Network
NEXT_PUBLIC_KASPA_NETWORK=testnet
NEXT_PUBLIC_KASPA_NODE_URL=wss://testnet.kaspathon.com/wrpc

# Relayer Hot Wallet (for sponsored transactions)
RELAYER_PRIVATE_KEY=your-hot-wallet-private-key
RELAYER_ADDRESS=kaspa:your-hot-wallet-address

# App URL (for share links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 3. Supabase Setup

### Create a New Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy the Project URL and API keys to `.env.local`

### Run Database Migrations

Option A: Using Supabase CLI (recommended):

```bash
# Install Supabase CLI
pnpm add -g supabase

# Login and link project
supabase login
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

Option B: Manual SQL execution:

1. Go to Supabase Dashboard → SQL Editor
2. Copy contents from `specs/001-core-fighting-game/data-model.md` (Migration 001 and 002)
3. Execute the SQL

### Enable Realtime

1. Go to Database → Replication
2. Enable realtime for tables: `matches`, `rounds`
3. Go to Database → API → Realtime and enable

---

## 4. Kaspa Testnet Setup

### Get Testnet Wallet

1. Install [Kasware](https://kasware.xyz/) or [Kaspium](https://kaspium.io/) browser extension
2. Create a new wallet or import existing
3. Switch to **Testnet** network in wallet settings

### Get Testnet KAS

1. Go to [Kaspa Testnet Faucet](https://faucet-tn10.kaspanet.io/)
2. Enter your testnet address
3. Request testnet KAS (you'll receive ~1000 KAS)

### Relayer Hot Wallet

For the relayer service, create a separate wallet:

```bash
# Generate a new wallet using Kaspa CLI (or use wallet extension)
# Export the private key and address to .env.local
```

Fund the hot wallet with testnet KAS for sponsoring player transactions.

---

## 5. Run Development Server

```bash
# Start Next.js dev server
pnpm dev
# or: npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Project Structure Overview

```
src/
├── app/                    # Next.js App Router pages
│   ├── (game)/            # Game routes (lobby, play, practice)
│   ├── (social)/          # Social routes (leaderboard, profiles)
│   ├── api/               # API routes
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── ui/               # shadcn/ui primitives
│   ├── game/             # Game-specific components
│   └── wallet/           # Wallet connection
├── game/                  # Phaser.js game engine
│   ├── scenes/           # Phaser scenes
│   └── entities/         # Game objects
├── lib/                   # Core utilities
│   ├── kaspa/            # Kaspa SDK wrapper
│   ├── supabase/         # Database client
│   └── matchmaking/      # Matchmaking logic
├── hooks/                 # React hooks
├── stores/               # Zustand state stores
└── types/                # TypeScript types
```

---

## 7. Development Workflow

### Running Tests

```bash
# Unit tests
pnpm test

# E2E tests (requires running dev server)
pnpm test:e2e
```

### Linting and Formatting

```bash
# Lint code
pnpm lint

# Format code
pnpm format
```

### Type Checking

```bash
pnpm typecheck
```

---

## 8. Testing Game Flow

### Practice Mode (No Transactions)

1. Open http://localhost:3000
2. Click "Practice Mode" (no wallet needed)
3. Select a character
4. Play against the bot

### Online Match (Testnet Transactions)

1. Open http://localhost:3000 in two browsers
2. Connect Kaspa testnet wallets in both
3. Browser 1: Click "Create Private Room"
4. Copy the room code
5. Browser 2: Click "Join Room", enter code
6. Both select characters
7. Play! Each move triggers a testnet transaction

### Verifying On-Chain

1. After a move, note the transaction ID shown
2. Go to [Kaspa Testnet Explorer](https://explorer-tn10.kaspa.org/)
3. Search for the transaction ID
4. Verify the transaction details

---

## 9. Key Development Tasks

### Adding a New Character

1. Add sprite sheets to `public/assets/sprites/[character-id]/`
2. Update `src/game/config/characters.ts`
3. Add database seed in migration

### Modifying Move Damage

Edit `src/game/config/moves.ts`:

```typescript
export const MOVE_PROPERTIES = {
  punch: { damage: 10, beats: "kick", losesTo: "block" },
  // ...
};
```

### Customizing UI Theme

1. Edit `tailwind.config.ts` for colors
2. shadcn/ui components in `src/components/ui/`

---

## 10. Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
pnpm add -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Environment Variables for Production

- Change `NEXT_PUBLIC_KASPA_NETWORK` to `mainnet`
- Update `NEXT_PUBLIC_KASPA_NODE_URL` to mainnet node
- Use production Supabase project
- Secure the relayer private key

---

## 11. Troubleshooting

### WASM Loading Issues

```
Error: WebAssembly.instantiate()
```

**Solution**: Ensure webpack config in `next.config.js`:

```javascript
module.exports = {
  webpack: (config) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
};
```

### Wallet Not Detected

**Solution**: 
1. Ensure wallet extension is installed
2. Refresh the page
3. Check browser console for `kaspa:provider` events

### Supabase Realtime Not Working

**Solution**:
1. Check Realtime is enabled in Supabase dashboard
2. Verify RLS policies allow access
3. Check browser network tab for WebSocket connections

### Transaction Failures

**Solution**:
1. Ensure sufficient testnet KAS balance
2. Check Kaspa node connection
3. Verify wallet is on correct network (testnet vs mainnet)

---

## 12. Useful Links

- **Kaspa Documentation**: https://kaspa.org/docs
- **Kaspa SDK Docs**: https://kaspa.aspectron.org/docs/
- **Supabase Docs**: https://supabase.com/docs
- **Phaser.js Docs**: https://phaser.io/docs
- **Next.js Docs**: https://nextjs.org/docs
- **shadcn/ui**: https://ui.shadcn.com/

---

## 13. Getting Help

- **Discord**: Join the Kaspa Community Discord, #kaspathon channel
- **GitHub Issues**: Report bugs or request features
- **Email**: kaspathon@kaspathon.com

Happy building! 🎮
