import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { ContractManagerContextProvider } from "../contexts/contractManager";
import { TransactionManagerContextProvider } from "../contexts/transactionManager";
import { WalletManagerContextProvider } from "../contexts/walletManager";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ContractManagerContextProvider>
      <TransactionManagerContextProvider>
        <WalletManagerContextProvider>
          <Component {...pageProps} />
        </WalletManagerContextProvider>
      </TransactionManagerContextProvider>
    </ContractManagerContextProvider>
  );
}

export default MyApp
