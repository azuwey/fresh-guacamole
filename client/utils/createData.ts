import { PublicKey } from "@solana/web3.js";
import { Layout as layout, publicKey, struct, u64, u8, vec } from "@project-serum/borsh";
import BN from "bn.js";
import InstructionVariant from "./instructionsVariants";
import TransactionVariant from "./transactionVariant";

export interface Layout {
  id: InstructionVariant,
  amount?: number,
  owners?: PublicKey[],
  threshold?: number,
  variant?: TransactionVariant,
}

const LAYOUT: layout<Omit<Required<Layout>, 'threshold' | 'amount'> & {
  threshold: BN,
  amount: BN,
}> = struct([
  u8("id"),
  u8("variant"),
  u64("amount"),
  vec(publicKey(), "owners"),
  u64("threshold"),
]);

export default function createData({
  id,
  owners,
  threshold,
  amount,
  variant,
}: Layout)  {
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