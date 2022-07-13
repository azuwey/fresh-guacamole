import React, { useContext } from "react";
import { WalletManagerContext } from "../../../contexts/walletManager";
import generateWalletWithoutBalance from "../../../utils/generateWalletWithoutBalance";
import Button from "../../Button";
import WalletDetails from "./WalletDetails";

interface Props {
  index: number;
}

export default function Wallet({ index }: Props) {
  const { wallets, addWallet } = useContext(WalletManagerContext);

  const handleGenerateWallet = () => {
    const newWallet = generateWalletWithoutBalance();
    addWallet(newWallet);
  };

  return (
    <div className="h-40 overflow-hidden">
      <span className="text-xl font-semibold">{`Wallet #${index + 1}`}</span>
      <div className="py-4">
        {!wallets?.[index] ? (
          <Button label="Create wallet" onClick={handleGenerateWallet} />
        ): (
          <WalletDetails index={index} />
        )}
      </div>
    </div>
  );
}