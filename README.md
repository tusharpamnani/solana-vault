# Solana Vault

A modern web app for securely storing, depositing, and withdrawing SOL tokens on the Solana blockchain. Built with Next.js, React, Tailwind CSS, and Anchor.

## Features
- Connect your Solana wallet (Phantom, Solflare, etc.)
- Initialize a personal on-chain vault
- Deposit and withdraw SOL tokens securely
- View real-time vault balance
- Close your vault and reclaim funds
- Powered by [Anchor](https://project-serum.github.io/anchor/) and [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)

## Getting Started

### 1. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to use the app.

### 3. Connect your wallet
- Click the wallet button to connect Phantom, Solflare, or another supported wallet.
- The app uses Solana Devnet by default.

### 4. Using the Vault
- **Initialize Vault:** Creates your personal vault on-chain.
- **Deposit:** Enter an amount and deposit SOL into your vault.
- **Withdraw:** Withdraw SOL from your vault to your wallet.
- **Close Vault:** Closes your vault and returns all funds.

## Project Structure
- `src/app/` — Main Next.js app (edit `src/app/page.tsx` for the main page)
- `src/components/` — UI and wallet context components
- `src/utils/idl/` — Anchor program IDL and address (`vault.json`)

## Solana Program
- Program ID: `heiD65tNjyZVxNARhVVsrsa1HPzFThbaxoAmiyV1vzd` (Devnet)
- IDL: See `src/utils/idl/vault.json`

## Tech Stack
- Next.js 15
- React 19
- Tailwind CSS 4
- TypeScript
- @solana/web3.js, @coral-xyz/anchor
- Solana Wallet Adapter

## Customization
- To use a different Solana cluster, update the endpoint in `src/components/WalletContextProvider.tsx` and `src/app/layout.tsx`.
- To use a different Anchor program, replace the IDL and address in `src/utils/idl/vault.json`.

## Learn More
- [Next.js Documentation](https://nextjs.org/docs)
- [Solana Docs](https://docs.solana.com/)
- [Anchor Docs](https://book.anchor-lang.com/)
- [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)
