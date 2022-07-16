import React, { createContext, PropsWithChildren } from "react";
import { Connection } from "@solana/web3.js";

interface Props {
  rpcEndpoint: string;
}

export interface ConnectionManager {
  connection: Connection
}

export const ConnectionManagerContext = createContext<ConnectionManager>({
  connection: new Connection("http://invalid.com"),
});

export function ConnectionManagerContextProvider({ children, rpcEndpoint }: PropsWithChildren<Props>) {
  console.log(rpcEndpoint);
  const connection = new Connection(rpcEndpoint);

  return (
    <ConnectionManagerContext.Provider value={{ connection }}>
      {children}
    </ConnectionManagerContext.Provider>
  );
}
