import { PublicKey } from "@solana/web3.js";
import { Layout, publicKey, struct, u64, u8, vec } from "@project-serum/borsh";
import BN from "bn.js";
import InstructionVariant from "./instructionsVariants";

const LAYOUT: Layout<{
  id: InstructionVariant,
  owners: PublicKey[],
  threshold: BN
}> = struct([
  u8("id"),
  vec(publicKey(), "owners"),
  u64("threshold")
]);

export default function createData(id: InstructionVariant, owners: PublicKey[], threshold: number = 0) {
  let data = Buffer.alloc(1000);
  LAYOUT.encode({id, owners, threshold: new BN(threshold)}, data);
  return data.subarray(0, LAYOUT.getSpan(data));
}