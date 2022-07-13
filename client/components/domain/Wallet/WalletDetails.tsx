import React, { useContext } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TransactionManagerContext } from "../../../contexts/transactionManager";
import { WalletManagerContext } from "../../../contexts/walletManager";
import getWalletBalance from "../../../utils/getWalletBalance";
import requestAirdrop from "../../../utils/requestAirdrop";
import Button from "../../Button";

interface Props {
  index: number;
}

export default function WalletDetails({ index }: Props) {
  const { wallets, setWalletBalance } = useContext(WalletManagerContext);
  const [currentTransaction, setCurrentTransaction] = useContext(TransactionManagerContext);

  const { keypair, balance, mnemonic } = wallets[index];
  const publicKeyString = keypair.publicKey.toString();

  const handleCreateTransaction = () => {
    setCurrentTransaction({
      id: 'FAKE', // TODO: fix me!
      initiator: publicKeyString,
    })
  };

  const handleRefreshBalance = async () => {
    const newBalance = await getWalletBalance(keypair.publicKey);
    setWalletBalance(index, newBalance);
  }

  const handleRequestAirdrop = async () => {
    await requestAirdrop(keypair.publicKey);
    await handleRefreshBalance();
  }

  return (
    <>
      <p className="font-normal mt-0.5 text-sm text-gray-600">
        {`Public key: ${publicKeyString}`}
      </p>
      <p className="font-normal mt-0.5 text-sm text-gray-600">
        {`Mnemonic: ${mnemonic}`}
      </p>
      <p className="font-normal mt-0.5 text-sm text-gray-600">
        {`Balance: ${balance / LAMPORTS_PER_SOL} SOL`}
      </p>
      <div className="flex flex-row gap-x-2 pt-2">
        <div className="flex-1 flex flex-row gap-x-2">
          {currentTransaction === null && (
            <Button label="Create transaction" onClick={handleCreateTransaction} />
          )}
          {currentTransaction !== null && currentTransaction.initiator === publicKeyString && (
            <p className="font-extrabold mt-0.5 text-sm text-gray-600">
              Waiting...
            </p>
          )}
          {currentTransaction !== null && currentTransaction.initiator !== publicKeyString && (
            <>
              <Button label="Confirm transaction" />
              <Button label="Reject transaction" />
            </>
          )}
        </div>
        <div className="flex flex-row gap-x-2">
          <Button label="Refresh balance" onClick={handleRefreshBalance} />
          <Button label="Request airdrop" onClick={handleRequestAirdrop} />
        </div>
      </div>
    </>
  );
}