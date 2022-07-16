import { Keypair, PublicKey, } from "@solana/web3.js";
import { WalletWithOptionalBalance } from "../contexts/walletManager";

export default async function restoreMultiSigWallet(programId: PublicKey, signer: Keypair, multiSigWallet: WalletWithOptionalBalance) {
  return (await PublicKey.findProgramAddress([signer.publicKey.toBuffer(), multiSigWallet!.keypair.publicKey.toBuffer()], programId))[0];
}