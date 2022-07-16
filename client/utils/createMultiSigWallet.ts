import { Keypair, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import { WalletWithOptionalBalance } from "../contexts/walletManager";
import { MULTI_SIG_WALLET, RESERVED_PUBLIC_KEY } from "../constants/program";
import createNewConnection from "./createNewConnection";
import InstructionVariant from "./instructionsVariants";
import createData from "./createData";

export default async function createMultiSigWallet(programId: PublicKey, signer: Keypair, multiSigWallet: WalletWithOptionalBalance, owners: string[], threshold: number) {
  const base = multiSigWallet!.keypair;
  const [programDerivedAddress] = await PublicKey.findProgramAddress([Buffer.from(MULTI_SIG_WALLET, 'utf-8'), base.publicKey.toBuffer()], programId);

  const data = createData({
    id: InstructionVariant.CreateWallet,
    owners: owners.map((owner) => new PublicKey(owner)),
    threshold
  });

  const transaction = new Transaction().add({
    keys: [
      {pubkey: signer.publicKey, isSigner: true, isWritable: false},
      {pubkey: base.publicKey, isSigner: true, isWritable: false},
      {pubkey: programDerivedAddress, isSigner: false, isWritable: true},
      {pubkey: RESERVED_PUBLIC_KEY, isSigner: false, isWritable: false},
      {pubkey: SystemProgram.programId, isSigner: false, isWritable: false}
    ],
    programId,
    data
  });

  const connection = createNewConnection();

  await sendAndConfirmTransaction(
    connection,
    transaction,
    [signer, base],
  );

  return programDerivedAddress;
}