import React, {useContext, useState} from "react";
import { ContractManagerContext } from "../../../contexts/contractManager";
import { WalletManagerContext } from "../../../contexts/walletManager";
import createOrRestoreWalletWithoutBalance from "../../../utils/createOrRestoreWalletWithoutBalance";
import getWalletBalance from "../../../utils/getWalletBalance";
import Button from "../../Button";
import Input from "../../Input";
import WalletDetails from "./WalletDetails";

interface Props {
  index: number;
}

export default function Wallet({ index }: Props) {
  const [contract, setContract] = useContext(ContractManagerContext);
  const { wallets, addWallet } = useContext(WalletManagerContext);
  const [mnemonic, setMnemonic] = useState('');

  const handleGenerateWallet = () => {
    const newWallet = createOrRestoreWalletWithoutBalance();
    addWallet(newWallet);
    if (contract.programId === null) {
      setContract((prevState) => ({
        ...prevState,
        owners: prevState.owners.concat(newWallet.keypair.publicKey.toString()),
      }));
    }
  };

  const handleRestoreWallet = async () => {
    const newWallet = createOrRestoreWalletWithoutBalance(mnemonic);
    const balance = await getWalletBalance(newWallet.keypair.publicKey);
    addWallet({ ...newWallet, balance });
  };

  return (
    <div className="h-40 overflow-hidden px-2">
      <span className="text-xl font-semibold">{`Wallet #${index + 1}`}</span>
      <div className="py-4">
        {!wallets?.[index] ? (
          <>
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
          </>
        ): (
          <WalletDetails index={index} />
        )}
      </div>
    </div>
  );
}