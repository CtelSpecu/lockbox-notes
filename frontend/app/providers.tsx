"use client";

import type { ReactNode } from "react";

import { MetaMaskProvider } from "@/hooks/metamask/useMetaMaskProvider";
import { InMemoryStorageProvider } from "@/hooks/useInMemoryStorage";
import { MetaMaskEthersSignerProvider } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { config } from "@/config/wagmi";

type Props = {
  children: ReactNode;
};

const queryClient = new QueryClient();

export function Providers({ children }: Props) {
  const localRpcUrl =
    process.env.NEXT_PUBLIC_LOCAL_RPC_URL || "http://127.0.0.1:8545";

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <MetaMaskProvider>
            <MetaMaskEthersSignerProvider initialMockChains={{ 31337: localRpcUrl }}>
              <InMemoryStorageProvider>{children}</InMemoryStorageProvider>
            </MetaMaskEthersSignerProvider>
          </MetaMaskProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
