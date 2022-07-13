import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { TransactionManagerContextProvider } from "../contexts/transactionManager";
import { WalletManagerContextProvider } from "../contexts/walletManager";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <TransactionManagerContextProvider>
      <WalletManagerContextProvider>
        <Component {...pageProps} />
      </WalletManagerContextProvider>
    </TransactionManagerContextProvider>
  );
}

export default MyApp
