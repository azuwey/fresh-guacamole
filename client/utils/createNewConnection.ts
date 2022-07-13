import {clusterApiUrl, Connection} from "@solana/web3.js";

const RPC_ENDPOINT = clusterApiUrl("devnet"); // TODO: Make me customizable from the UI

export default function createNewConnection() {
  return new Connection(RPC_ENDPOINT, "confirmed");
}