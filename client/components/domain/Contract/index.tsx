import React, { useContext } from "react";
import { WalletManagerContext } from "../../../contexts/walletManager";

export default function Contract() {
  const { wallets } = useContext(WalletManagerContext);

  return (
    <div className="h-40 overflow-hidden">
      <span className="text-xl font-semibold">Contract</span>
      <div className="py-4">
        <div>TODO: set owners</div>
        <div>TODO: set threshold</div>
      </div>
    </div>
  );
}