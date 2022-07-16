import { PublicKey } from "@solana/web3.js";

export const MULTI_SIG_WALLET = "MultiSigWallet";
export const RESERVED_PUBLIC_KEY = new PublicKey("11111111111111111111111111111111");
export const DEFAULT_PROGRAM_ID = process.env.NEXT_PUBLIC_DEFAULT_PROGRAM_ID ?? "6QhuZSVhdX6NFR6FFparMqCFRqwzjWNaSFXVxvZrEwuj";
export const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT ?? "http://127.0.0.1:8899";
