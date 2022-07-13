import type { NextPage } from 'next'
import Head from 'next/head'
import Wallet from "../components/domain/Wallet";
import Contract from "../components/domain/Contract";

const Home: NextPage = () => {
  return (
    <div>
      <Head>
        <title>Fresh Guacamole Wallet</title>
        <meta name="description" content="Solana multi-sig wallet" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="h-screen mx-auto px-8 pt-20">
        <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 pb-2 border-b-2 border-gray-300">
          Solana Multi-Signature wallet demo
        </h2>
        <div className="grid grid-cols-1 pt-8">
          <Wallet index={0} />
          <Wallet index={1} />
          <Wallet index={2} />
          <Contract />
        </div>
      </main>
    </div>
  );
}

export default Home
