import React, { createContext, useState, PropsWithChildren } from "react";
import { PublicKey } from "@solana/web3.js";
import { Wallet } from "./walletManager";

export interface Contract {
  programId: PublicKey | null;
  wallet: Wallet | null;
  owners: string[];
  threshold: number;
  programDerivedAddress: PublicKey | null;
}

export const ContractManagerContext = createContext<[Contract, React.Dispatch<React.SetStateAction<Contract>>]>([
  {
    programId: null,
    wallet: null,
    owners: [],
    threshold: 0,
    programDerivedAddress: null
  },
  () => {
    throw new Error('ContractManagerContext cannot be used without ContractManagerContextProvider!');
  },
]);

export function ContractManagerContextProvider({ children }: PropsWithChildren<{}>) {
  const contractState = useState<Contract>({
    programId: null,
    wallet: null,
    owners: [],
    threshold: 0,
    programDerivedAddress: null,
  });

  return (
    <ContractManagerContext.Provider value={contractState}>
      {children}
    </ContractManagerContext.Provider>
  );
}
