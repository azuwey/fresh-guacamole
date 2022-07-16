import React, { useContext, useState } from "react";
import { ContractManagerContext } from "../../../contexts/contractManager";
import { Wallet as WalletContent, WalletManagerContext } from "../../../contexts/walletManager";
import createOrRestoreWalletWithoutBalance from "../../../utils/createOrRestoreWalletWithoutBalance";
import Button from "../../Button";
import Input from "../../Input";
import WalletDetails from "./WalletDetails";

interface Props {
  index: number;
}

export default function Wallet({ index }: Props) {
  const { contractState, setOwners } = useContext(ContractManagerContext);
  const { createWallet, refreshBalance } = useContext(WalletManagerContext);
  const [mnemonic, setMnemonic] = useState("");
  const [wallet, setWallet] = useState<WalletContent | null>(null);

  const handleGenerateWallet = () => {
    const newWallet = createWallet(createOrRestoreWalletWithoutBalance());
    if (contractState.mnemonic === "") {
      setOwners(newWallet.keypair, contractState.ownerPublicKeyStrings.concat(newWallet.keypair.publicKey.toString()));
    }
    setWallet(newWallet);
  };

  const handleRestoreWallet = () => {
    const newWallet = createWallet(createOrRestoreWalletWithoutBalance(mnemonic));
    if (contractState.mnemonic === "") {
      setOwners(newWallet.keypair, contractState.ownerPublicKeyStrings.concat(newWallet.keypair.publicKey.toString()));
    }
    setWallet(newWallet);
    void refreshBalance(index);
  };

  return (
    <div className="h-40 overflow-hidden px-2">
      <span className="text-xl font-semibold">{`Wallet #${index + 1}`}</span>
      <div className="py-4">
        {!wallet ? (
          <div className="flex items-center py-4 gap-2">
            <p className="inline font-normal text-sm text-gray-600">Mnemonic:</p>
            <Input
              placeholder="Mnemonic"
              value={mnemonic}
              onChange={(e) => setMnemonic(e.target.value )}
            />
            {mnemonic.length === 0 ? (
              <Button label="Create wallet" onClick={handleGenerateWallet} />
            ) : (
              <Button label="Restore wallet" onClick={handleRestoreWallet} />
            )}
          </div>
        ): (
          <WalletDetails index={index} />
        )}
      </div>
    </div>
  );
}