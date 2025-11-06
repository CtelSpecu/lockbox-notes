import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  rainbowWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { sepolia } from "wagmi/chains";
import { http } from "wagmi";

// Mock indexedDB for SSR to prevent WalletConnect crash
if (typeof window === "undefined" && !(global as any).indexedDB) {
  (global as any).indexedDB = {
    open: () => ({
      result: {
        createObjectStore: () => {},
      },
      addEventListener: () => {},
      onupgradeneeded: () => {},
      onsuccess: () => {},
    }),
  } as any;
}

const localRpcUrl =
  process.env.NEXT_PUBLIC_LOCAL_RPC_URL || "http://127.0.0.1:8545";

// Custom Hardhat local chain with chainId 31337 to match hardhat.config.ts
export const hardhatLocal = {
  id: 31337,
  name: "Hardhat Local",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: { http: [localRpcUrl] },
    public: { http: [localRpcUrl] },
  },
};

export const config = getDefaultConfig({
  appName: "Lockbox Notes",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
    "LOCKBOX_NOTES_PLACEHOLDER_PROJECT_ID",
  chains: [hardhatLocal, sepolia],
  wallets: [
    {
      groupName: "Recommended",
      wallets: [metaMaskWallet, rainbowWallet],
    },
  ],
  transports: {
    [hardhatLocal.id]: http(localRpcUrl),
    [sepolia.id]: http(),
  },
  ssr: false,
});
