import { PublicKey } from "@solana/web3.js";
import createNewConnection from "./createNewConnection";

export default async function getWalletBalance(walletPublicKey: PublicKey): Promise<number> {
  try {
    const connection = createNewConnection();
    return await connection.getBalance(walletPublicKey);
  } catch (error) {
    console.error(error);
    return 0;
  }
}