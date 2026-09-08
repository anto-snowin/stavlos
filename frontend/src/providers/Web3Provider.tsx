"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { formatUnits } from "viem";
import { viemClients } from "@/config/wagmi";
import { SUPPORTED_STABLECOINS, ERC20_READ_ABI, TokenConfig } from "@/config/tokens";

export interface TokenBalance {
  token: TokenConfig;
  rawBalance: bigint;
  formatted: number;
}

interface Web3ContextType {
  address: `0x${string}` | null;
  isConnected: boolean;
  chainId: number | null;
  chainName: string;
  isConnecting: boolean;
  isDemoMode: boolean;
  balances: TokenBalance[];
  isLoadingBalances: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  simulateDemoWallet: (demoAddress?: `0x${string}`) => void;
  refreshBalances: () => Promise<void>;
}

const Web3Context = createContext<Web3ContextType>({
  address: null,
  isConnected: false,
  chainId: null,
  chainName: "Not Connected",
  isConnecting: false,
  isDemoMode: false,
  balances: [],
  isLoadingBalances: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
  simulateDemoWallet: () => {},
  refreshBalances: async () => {},
});

const publicClients = viemClients;

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [chainName, setChainName] = useState<string>("Not Connected");
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [isLoadingBalances, setIsLoadingBalances] = useState<boolean>(false);

  const getChainName = (id: number | null): string => {
    switch (id) {
      case 1:
        return "Ethereum";
      case 42161:
        return "Arbitrum";
      case 10:
        return "Optimism";
      case 8453:
        return "Base";
      case 11155111:
        return "Sepolia Testnet";
      default:
        return "EVM Connected";
    }
  };

  // Fetch balances across all supported chains via Viem PublicClients
  const fetchBalances = useCallback(async (targetAddress: `0x${string}`) => {
    setIsLoadingBalances(true);
    try {
      const results = await Promise.all(
        SUPPORTED_STABLECOINS.map(async (token) => {
          const client = (publicClients as any)[token.chainId] || (publicClients as any)[1];
          try {
            const raw = (await client.readContract({
              address: token.address,
              abi: ERC20_READ_ABI,
              functionName: "balanceOf",
              args: [targetAddress],
            })) as bigint;

            const formatted = parseFloat(formatUnits(raw, token.decimals));
            return {
              token,
              rawBalance: raw,
              formatted,
            };
          } catch (e) {
            // If RPC or token read fails on that specific network, return 0 gracefully
            return {
              token,
              rawBalance: BigInt(0),
              formatted: 0,
            };
          }
        })
      );

      setBalances(results);
    } catch (e) {
      console.error("Error fetching multi-chain balances:", e);
    } finally {
      setIsLoadingBalances(false);
    }
  }, []);

  // Connect via non-custodial browser wallet (MetaMask, Rabby, Rainbow, Coinbase)
  const connectWallet = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      alert("No Ethereum browser wallet detected. You can click 'Simulate Demo Wallet' to test read-only analytics.");
      return;
    }

    setIsConnecting(true);
    try {
      const provider = (window as any).ethereum;
      const accounts: string[] = await provider.request({
        method: "eth_requestAccounts",
      });

      if (accounts && accounts.length > 0) {
        const userAddr = accounts[0] as `0x${string}`;
        const hexChainId = await provider.request({ method: "eth_chainId" });
        const numChainId = parseInt(hexChainId, 16);

        setAddress(userAddr);
        setIsConnected(true);
        setChainId(numChainId);
        setChainName(getChainName(numChainId));
        setIsDemoMode(false);
        await fetchBalances(userAddr);
      }
    } catch (err: any) {
      console.warn("Wallet connection rejected or cancelled:", err);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect cleanly
  const disconnectWallet = () => {
    setAddress(null);
    setIsConnected(false);
    setChainId(null);
    setChainName("Not Connected");
    setIsDemoMode(false);
    setBalances([]);
  };

  // Simulate a read-only institutional portfolio (e.g. for testing without an installed browser wallet)
  const simulateDemoWallet = (demoAddress: `0x${string}` = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045") => {
    setAddress(demoAddress);
    setIsConnected(true);
    setChainId(1);
    setChainName("Ethereum (Demo Read-Only)");
    setIsDemoMode(true);
    fetchBalances(demoAddress);
  };

  // Listen for account or chain changes in the user's browser wallet
  useEffect(() => {
    if (typeof window === "undefined" || !(window as any).ethereum) return;
    const provider = (window as any).ethereum;

    const handleAccountsChanged = (accounts: string[]) => {
      if (!accounts || accounts.length === 0) {
        disconnectWallet();
      } else {
        const newAddr = accounts[0] as `0x${string}`;
        setAddress(newAddr);
        fetchBalances(newAddr);
      }
    };

    const handleChainChanged = (hexChainId: string) => {
      const numChainId = parseInt(hexChainId, 16);
      setChainId(numChainId);
      setChainName(getChainName(numChainId));
      if (address) {
        fetchBalances(address);
      }
    };

    provider.on?.("accountsChanged", handleAccountsChanged);
    provider.on?.("chainChanged", handleChainChanged);

    return () => {
      provider.removeListener?.("accountsChanged", handleAccountsChanged);
      provider.removeListener?.("chainChanged", handleChainChanged);
    };
  }, [address, fetchBalances]);

  return (
    <Web3Context.Provider
      value={{
        address,
        isConnected,
        chainId,
        chainName,
        isConnecting,
        isDemoMode,
        balances,
        isLoadingBalances,
        connectWallet,
        disconnectWallet,
        simulateDemoWallet,
        refreshBalances: () => (address ? fetchBalances(address) : Promise.resolve()),
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);
