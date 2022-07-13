import { Keypair, PublicKey, sendAndConfirmTransaction, SystemProgram, Transaction } from "@solana/web3.js";
import { Wallet } from "../contexts/walletManager";
import createNewConnection from "./createNewConnection";
import InstructionVariant from "./instructionsVariants";
import createData from "./createData";

export default async function setOwners(programId: PublicKey, signer: Keypair, owners: Wallet[]) {
  const data = createData(InstructionVariant.SetOwners, owners.map((owner) => owner.keypair.publicKey));
  const [programDerivedAddress] = await PublicKey.findProgramAddress([signer.publicKey.toBuffer()], programId);
  const transaction = new Transaction().add({
    keys: [
      {pubkey: programDerivedAddress, isSigner: false, isWritable: true},
      {pubkey: signer.publicKey, isSigner: true, isWritable: false},
      {pubkey: SystemProgram.programId, isSigner: false, isWritable: false}
    ],
    programId,
    data
  });

  const connection = createNewConnection()

  return await sendAndConfirmTransaction(
    connection,
    transaction,
    [signer]
  );
}