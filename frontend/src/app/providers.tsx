'use client';

import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia, celo, celoAlfajores, polygon, polygonAmoy } from 'wagmi/chains';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { getDefaultWallets } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

// Create configuration on the client side only
const projectId = '3800122e15c6d92b7c8dfd1e481f2e73'; // Get one at https://cloud.walletconnect.com

// Setup wallets
const { connectors } = getDefaultWallets({
    appName: 'IntelliGuard Demo',
    projectId
});

// Create wagmi config
const config = createConfig({
    chains: [mainnet, sepolia, celo, celoAlfajores, polygon, polygonAmoy],
    transports: {
        [mainnet.id]: http(),
        [sepolia.id]: http(),
        [celo.id]: http(),
        [celoAlfajores.id]: http(),
        [polygon.id]: http(),
        [polygonAmoy.id]: http(),
    },
    connectors
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider theme={darkTheme()}>
                    {children}
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    );
} 