import { Keypair, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import { RESERVED_PUBLIC_KEY } from "../constants/program";
import { Contract } from "../contexts/contractManager";
import createNewConnection from "./createNewConnection";
import InstructionVariant from "./instructionsVariants";
import createData from "./createData";

export default async function executeTransaction(signer: Keypair, contract: Contract, toAddress: PublicKey = RESERVED_PUBLIC_KEY) {
  const data = createData({
    id: InstructionVariant.ExecuteTransaction,
  });

  const transaction = new Transaction().add({
    keys: [
      {pubkey: signer.publicKey, isSigner: true, isWritable: false},
      {pubkey: contract.wallet!.keypair.publicKey, isSigner: false, isWritable: true},
      {pubkey: contract.programDerivedAddress!, isSigner: false, isWritable: true},
      {pubkey: toAddress, isSigner: false, isWritable: true},
      {pubkey: SystemProgram.programId, isSigner: false, isWritable: false}
    ],
    programId: contract.programId!,
    data
  });

  const connection = createNewConnection();

  return await sendAndConfirmTransaction(
    connection,
    transaction,
    [signer]
  );
}