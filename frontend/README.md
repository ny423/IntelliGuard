# IntelliGuard Frontend Demo

This is a Next.js project demonstrating wallet connection functionality with RainbowKit and a custom transaction hook.

## Features

- **Wallet Connection**: Connect to your Ethereum wallet using RainbowKit
- **Custom Transaction Hook**: Demonstrates how to trigger custom logic after a user clicks on a transaction button but before they sign the transaction
- **Modern UI**: Built with TailwindCSS for a responsive and modern design

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Update the WalletConnect project ID:

Open `src/app/providers.tsx` and update the `projectId` value with your WalletConnect project ID. You can get one at [WalletConnect Cloud](https://cloud.walletconnect.com).

3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Project Structure

- `/src/app/components`: UI components for the demo
- `/src/app/hooks`: Custom hooks, including the transaction hook
- `/src/app/providers.tsx`: RainbowKit and wagmi providers setup
- `/src/app/page.tsx`: Main demo page

## How the Transaction Hook Works

The custom transaction hook (`useTransactionHook`) demonstrates how to separate the transaction preparation and execution phases, allowing you to insert custom logic between:

1. When a user initiates a transaction
2. When the wallet extension pops up for signature

This can be useful for:
- Pre-transaction validation
- Showing confirmation dialogs
- Logging analytics
- Security checks
- User education about transactions

## Technologies Used

- Next.js
- TypeScript
- TailwindCSS
- RainbowKit
- wagmi
- viem
- React Query

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [RainbowKit Documentation](https://www.rainbowkit.com/docs/introduction)
- [wagmi Documentation](https://wagmi.sh)
