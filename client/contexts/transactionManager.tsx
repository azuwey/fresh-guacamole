import React, { createContext, useState, PropsWithChildren } from "react";

export interface Transaction {
  toAddress: string;
  isInitiated: boolean;
  signers: string[],
  opponents: string[]
}

export const TransactionManagerContext = createContext<[(Transaction), React.Dispatch<React.SetStateAction<Transaction>>]>([
  {
    toAddress: '',
    isInitiated: false,
    signers: [],
    opponents: []
  },
  () => {
    throw new Error('TransactionManagerContext cannot be used without TransactionManagerContextProvider!');
  },
]);

export function TransactionManagerContextProvider({ children }: PropsWithChildren<{}>) {
  const transactionState = useState<Transaction>({
    toAddress: '',
    isInitiated: false,
    signers: [],
    opponents: []
  });

  return (
    <TransactionManagerContext.Provider value={transactionState}>
      {children}
    </TransactionManagerContext.Provider>
  );
}
