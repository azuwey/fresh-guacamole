import { Connection } from "@solana/web3.js";

const RPC_ENDPOINT = "http://127.0.0.1:8899";

export default function createNewConnection() {
  return new Connection(RPC_ENDPOINT, "confirmed");
}