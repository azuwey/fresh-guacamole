import React, {createContext, useState, PropsWithChildren, useContext, useEffect} from "react";
import { Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ConnectionManagerContext } from "./connectionManager";

const DEFAULT_BALANCE = 0;

interface Props {
  connectionManager: typeof ConnectionManagerContext;
}

export interface Wallet {
  keypair: Keypair;
  mnemonic: string;
  balance: number;
  tx: string;
}

export type WalletWithOptionalBalance = Omit<Wallet, "balance"> & {
  balance?: Wallet['balance']
};

interface WalletManager {
  wallets: Wallet[];
  createWallet: (wallet: WalletWithOptionalBalance) => Wallet;
  refreshBalance: (index: number) => void;
  requestAirdrop: (index: number) => void;
}

export const WalletManagerContext = createContext<WalletManager>({
  wallets: [],
  createWallet: () => {
    throw new Error('WalletManagerContext cannot be used without WalletManagerContextProvider!');
  },
  refreshBalance: () => {
    throw new Error('WalletManagerContext cannot be used without WalletManagerContextProvider!');
  },
  requestAirdrop: () => {
    throw new Error('WalletManagerContext cannot be used without WalletManagerContextProvider!');
  },
});

export function WalletManagerContextProvider({ children, connectionManager }: PropsWithChildren<Props>) {
  const { connection } = useContext(connectionManager);
  const [wallets, setWallets] = useState<Wallet[]>([]);

  const addWallet = (wallet: WalletWithOptionalBalance) => {
    const newWallet = {
      ...wallet,
      balance: wallet.balance ?? DEFAULT_BALANCE,
    };
    setWallets((previousWallets) => previousWallets.concat(newWallet));
    return newWallet;
  }

  const refreshBalance = async (index: number) => {
    const balance = await connection.getBalance(wallets[index].keypair.publicKey);

    setWallets((prevState) => {
      const _wallets = prevState.slice();
      _wallets[index].balance = balance;
      return _wallets;
    });
  };

  const requestAirdrop = async (index: number) => {
    const tx = await connection.requestAirdrop(wallets[index].keypair.publicKey, LAMPORTS_PER_SOL);

    setWallets((prevState) => {
      const _wallets = prevState.slice();
      _wallets[index].tx = tx;
      return _wallets;
    });
  };

  useEffect(() => {
    const intervals = wallets
      .filter(({ tx}) => tx)
      .map(({ tx, keypair }) => {
        return  setInterval(async () => {
          const status = await connection.getTransaction(tx);
          if (status === null) {
            return;
          }

          const balance = await connection.getBalance(keypair.publicKey);
          setWallets((prevState) => {
            const _wallets = prevState.slice();
            const index = _wallets.findIndex((_wallet) => _wallet.keypair.publicKey.toString() === keypair.publicKey.toString());
            _wallets[index].tx = "";
            _wallets[index].balance = balance;
            return _wallets;
          });
        }, 3000);
      });

    return () => intervals.forEach((interval) => clearInterval(interval));
  }, [wallets])

  return (
    <WalletManagerContext.Provider value={{ wallets, createWallet: addWallet, refreshBalance, requestAirdrop }}>
      {children}
    </WalletManagerContext.Provider>
  );
}
