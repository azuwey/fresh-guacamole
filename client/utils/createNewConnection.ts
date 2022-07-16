import { Connection } from "@solana/web3.js";

const RPC_ENDPOINT = "http://127.0.0.1:8899"; // TODO: Make me customizable from the UI

export default function createNewConnection() {
  return new Connection(RPC_ENDPOINT, "confirmed");
}