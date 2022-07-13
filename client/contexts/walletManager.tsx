import React, { createContext, useState, PropsWithChildren } from "react";
import { Keypair } from "@solana/web3.js";

const DEFAULT_BALANCE = 0;

export interface Wallet {
  keypair: Keypair
  mnemonic: string;
  balance: number;
}

export type WalletWithoutBalance = Omit<Wallet, "balance">;

interface WalletManager {
  wallets: Wallet[];
  addWallet: (wallet: WalletWithoutBalance) => void;
  setWalletBalance: (walletIndex: number, newBalance: number) => void;
}

export const WalletManagerContext = createContext<WalletManager>({
  wallets: [],
  addWallet: () => {
    throw new Error('WalletManagerContext cannot be used without WalletManagerContextProvider!');
  },
  setWalletBalance: () => {
    throw new Error('WalletManagerContext cannot be used without WalletManagerContextProvider!');
  },
});

export function WalletManagerContextProvider({ children }: PropsWithChildren<{}>) {
  const [wallets, setWallets] = useState<Wallet[]>([]);

  const addWallet = (wallet: WalletWithoutBalance) =>
    setWallets((previousWallets) => previousWallets.concat(
      {
        ...wallet,
        balance: DEFAULT_BALANCE,
      }
    ));

  const setWalletBalance = (walletIndex: number, newBalance: number) =>
    setWallets((previousWallets) => {
      const walletsCopy = previousWallets.slice();
      if (walletsCopy?.[walletIndex]) {
        walletsCopy[walletIndex].balance = newBalance;
      }

      return walletsCopy;
    });

  return (
    <WalletManagerContext.Provider value={{ wallets, addWallet, setWalletBalance }}>
      {children}
    </WalletManagerContext.Provider>
  );
}
