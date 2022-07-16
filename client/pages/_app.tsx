import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { RPC_ENDPOINT } from "../constants/program";
import { ContractManagerContextProvider } from "../contexts/contractManager";
import { WalletManagerContextProvider } from "../contexts/walletManager";
import { ConnectionManagerContext, ConnectionManagerContextProvider } from "../contexts/connectionManager";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ConnectionManagerContextProvider rpcEndpoint={RPC_ENDPOINT}>
      <ContractManagerContextProvider connectionManager={ConnectionManagerContext}>
          <WalletManagerContextProvider connectionManager={ConnectionManagerContext}>
            <Component {...pageProps} />
          </WalletManagerContextProvider>
      </ContractManagerContextProvider>
    </ConnectionManagerContextProvider>
  );
}

export default MyApp
