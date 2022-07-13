import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import { Keypair } from "@solana/web3.js";
import { WalletWithoutBalance } from "../contexts/walletManager";

export default function generateWalletWithoutBalance(): WalletWithoutBalance {
  const mnemonic = generateMnemonic();
  const seed = mnemonicToSeedSync(mnemonic).subarray(0, 32);
  const keypair = Keypair.fromSeed(seed);

  return { keypair, mnemonic }
}