import React, { useContext } from "react";
import { PublicKey } from "@solana/web3.js";
import { WalletManagerContext } from "../../../contexts/walletManager";
import setOwners from "../../../utils/setOwners";
import Button from "../../Button";

let programId = new PublicKey(
  "8Tk2mqWR8TnrMgyoRQ355LzG9kWnY3s4Uh2ZYRXhaGAf" // TODO: Make me customizable from the UI
);

export default function Contract() {
  const { wallets } = useContext(WalletManagerContext);

  const handleCallProgram = async () => {
      console.log(await setOwners(programId, wallets[0].keypair, [wallets[0], wallets[1]]))
  }

  return (
    <div className="h-40 overflow-hidden">
      <span className="text-xl font-semibold">Contract</span>
      <div className="py-4">
        <Button label="Call program" onClick={handleCallProgram} />
        <div>TODO: set owners</div>
        <div>TODO: set threshold</div>
      </div>
    </div>
  );
}