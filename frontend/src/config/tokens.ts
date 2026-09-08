/**
 * Canonical Stablecoin Token Configurations across Supported Chains.
 * Contains contract addresses and standard read-only ERC-20 ABI definitions.
 */

export interface TokenConfig {
  symbol: string;
  name: string;
  address: `0x${string}`;
  decimals: number;
  chain: string;
  chainId: number;
}

export const ERC20_READ_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "decimals",
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
  {
    constant: true,
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    type: "function",
  },
] as const;

export const SUPPORTED_STABLECOINS: TokenConfig[] = [
  // Ethereum Mainnet (Chain ID 1)
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6,
    chain: "Ethereum",
    chainId: 1,
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    decimals: 6,
    chain: "Ethereum",
    chainId: 1,
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    decimals: 18,
    chain: "Ethereum",
    chainId: 1,
  },
  {
    symbol: "USDS",
    name: "USDS Stablecoin",
    address: "0xdC035D45d973E3EC169d2276DDab1CED49B07373",
    decimals: 18,
    chain: "Ethereum",
    chainId: 1,
  },

  // Arbitrum One (Chain ID 42161)
  {
    symbol: "USDC",
    name: "USD Coin (Native)",
    address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    decimals: 6,
    chain: "Arbitrum",
    chainId: 42161,
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
    decimals: 6,
    chain: "Arbitrum",
    chainId: 42161,
  },

  // Optimism Mainnet (Chain ID 10)
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    decimals: 6,
    chain: "Optimism",
    chainId: 10,
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    decimals: 6,
    chain: "Optimism",
    chainId: 10,
  },

  // Base (Chain ID 8453)
  {
    symbol: "USDC",
    name: "USD Coin (Native)",
    address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    decimals: 6,
    chain: "Base",
    chainId: 8453,
  },

  // Sepolia Testnet (Chain ID 11155111)
  {
    symbol: "USDC",
    name: "Sepolia Test USDC (Aave Faucet)",
    address: "0x94a9D9AC8a22534E3FaCa9E4e7F72Ddc57B0120F",
    decimals: 6,
    chain: "Sepolia",
    chainId: 11155111,
  },
  {
    symbol: "DAI",
    name: "Sepolia Test DAI (Aave Faucet)",
    address: "0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357",
    decimals: 18,
    chain: "Sepolia",
    chainId: 11155111,
  },
];
