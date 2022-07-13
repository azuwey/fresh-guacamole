import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import createNewConnection from "./createNewConnection";

export default async function requestAirdrop(walletPublicKey: PublicKey) {
  try {
    const connection = createNewConnection();
    const airdropSignature = await connection.requestAirdrop(walletPublicKey, LAMPORTS_PER_SOL);
    const latestBlockHash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      blockhash: latestBlockHash.blockhash,
      lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
      signature: airdropSignature,
    });
  } catch (error) {
    console.error(error);
  }
}