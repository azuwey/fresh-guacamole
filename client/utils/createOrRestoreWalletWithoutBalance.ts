import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import { Keypair } from "@solana/web3.js";
import { WalletWithOptionalBalance } from "../contexts/walletManager";

export default function createOrRestoreWalletWithoutBalance(mnemonic?: string): WalletWithOptionalBalance {
  const generatedMnemonic = mnemonic ?? generateMnemonic();
  const seed = mnemonicToSeedSync(generatedMnemonic).subarray(0, 32);
  const keypair = Keypair.fromSeed(seed);

  return { keypair, mnemonic: generatedMnemonic }
}