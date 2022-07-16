import BN from "bn.js";
import { PublicKey } from "@solana/web3.js";
import { Layout, publicKey, struct, u64, u8, vec } from "@project-serum/borsh";
import InstructionVariant from "./instructionsVariants";
import TransactionVariant from "./transactionVariant";

export interface InstructionData {
  id: InstructionVariant,
  amount?: number,
  owners?: PublicKey[],
  threshold?: number,
  variant?: TransactionVariant,
}

const LAYOUT: Layout<Omit<Required<InstructionData>, 'threshold' | 'amount'> & {
  threshold: BN,
  amount: BN,
}> = struct([
  u8("id"),
  u8("variant"),
  u64("amount"),
  vec(publicKey(), "owners"),
  u64("threshold"),
]);

export default function encodeInstructionData({
  id,
  owners,
  threshold,
  amount,
  variant,
}: InstructionData)  {
  let data = Buffer.alloc(1000);
  LAYOUT.encode(
    {
      id,
      variant: variant ?? 0,
      owners: owners ?? [],
      threshold: new BN(threshold ?? 0),
      amount: new BN(amount ?? 0),
    },
    data
  );
  return data.subarray(0, LAYOUT.getSpan(data));
}