import React, { createContext, useState, PropsWithChildren } from "react";

export interface Transaction {
  id: string;
  initiator: string;
}

export const TransactionManagerContext = createContext<[(Transaction | null), React.Dispatch<React.SetStateAction<Transaction | null>>]>([
  null,
  () => {
    throw new Error('TransactionManagerContext cannot be used without TransactionManagerContextProvider!');
  },
]);

export function TransactionManagerContextProvider({ children }: PropsWithChildren<{}>) {
  const transactionState = useState<Transaction | null>(null);

  return (
    <TransactionManagerContext.Provider value={transactionState}>
      {children}
    </TransactionManagerContext.Provider>
  );
}
