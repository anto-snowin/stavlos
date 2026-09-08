import { createPublicClient, http, Chain } from "viem";

/**
 * Explicit Chain Definitions for Tracked EVM Networks.
 * Avoids importing the 500-chain definitions tree for lightning-fast bundling.
 */
export const mainnetChain: Chain = {
  id: 1,
  name: "Ethereum",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://cloudflare-eth.com"] },
  },
};

export const arbitrumChain: Chain = {
  id: 42161,
  name: "Arbitrum One",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://arb1.arbitrum.io/rpc"] },
  },
};

export const optimismChain: Chain = {
  id: 10,
  name: "OP Mainnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://mainnet.optimism.io"] },
  },
};

export const baseChain: Chain = {
  id: 8453,
  name: "Base",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://mainnet.base.org"] },
  },
};

export const sepoliaChain: Chain = {
  id: 11155111,
  name: "Sepolia Testnet",
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.sepolia.org"] },
  },
  testnet: true,
};

export const SUPPORTED_CHAINS = [
  mainnetChain,
  arbitrumChain,
  optimismChain,
  baseChain,
  sepoliaChain,
] as const;

export const viemClients = {
  [mainnetChain.id]: createPublicClient({
    chain: mainnetChain,
    transport: http("https://cloudflare-eth.com"),
  }),
  [arbitrumChain.id]: createPublicClient({
    chain: arbitrumChain,
    transport: http("https://arb1.arbitrum.io/rpc"),
  }),
  [optimismChain.id]: createPublicClient({
    chain: optimismChain,
    transport: http("https://mainnet.optimism.io"),
  }),
  [baseChain.id]: createPublicClient({
    chain: baseChain,
    transport: http("https://mainnet.base.org"),
  }),
  [sepoliaChain.id]: createPublicClient({
    chain: sepoliaChain,
    transport: http("https://rpc.sepolia.org"),
  }),
};
