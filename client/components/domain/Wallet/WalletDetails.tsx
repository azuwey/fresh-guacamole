import React, { useContext, useState } from "react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { ContractManagerContext } from "../../../contexts/contractManager";
import { TransactionManagerContext } from "../../../contexts/transactionManager";
import { WalletManagerContext } from "../../../contexts/walletManager";
import getWalletBalance from "../../../utils/getWalletBalance";
import requestAirdrop from "../../../utils/requestAirdrop";
import createTransaction from "../../../utils/createTransaction";
import confirmTransaction from "../../../utils/confirmTransaction";
import rejectTransaction from "../../../utils/rejectTransaction";
import executeTransaction from "../../../utils/executeTransaction";
import cancelTransaction from "../../../utils/cancelTransaction";
import TransactionVariant from "../../../utils/transactionVariant";
import Button from "../../Button";
import Input from "../../Input";

interface Props {
  index: number;
}

export default function WalletDetails({ index }: Props) {
  const [contract, setContract] = useContext(ContractManagerContext);
  const [transaction, setTransaction] = useContext(TransactionManagerContext);
  const { wallets, setWalletBalance } = useContext(WalletManagerContext);
  const [amount, setAmount] = useState(0);

  const { keypair, balance, mnemonic } = wallets[index];
  const publicKeyString = keypair.publicKey.toString();

  const handleSendRequest = async () => {
    await createTransaction(wallets[index].keypair, contract, {
      variant: TransactionVariant.Send,
      amount: amount * LAMPORTS_PER_SOL,
    }, new PublicKey(transaction.toAddress));

    setTransaction((prevState) => ({
      ...prevState,
      isInitiated: true,
      signers: [publicKeyString],
      opponents: [],
    }));
  };

  const publicKeyStringFilter = (_publicKeyString: string): boolean => {
    return _publicKeyString !== publicKeyString;
  }

  const handleConfirmTransaction = async () => {
    await confirmTransaction(wallets[index].keypair, contract);
    setTransaction((prevState) => ({
      ...prevState,
      signers: prevState.signers.concat(publicKeyString),
      opponents: prevState.opponents.filter(publicKeyStringFilter),
    }));
  };

  const handleRejectTransaction = async () => {
    await rejectTransaction(wallets[index].keypair, contract);
    setTransaction((prevState) => ({
      ...prevState,
      signers: prevState.signers.filter(publicKeyStringFilter),
      opponents: prevState.opponents.concat(publicKeyString)
    }));
  };

  const handleExecuteTransaction = async () => {
    await executeTransaction(wallets[index].keypair, contract, new PublicKey(transaction.toAddress));
    setTransaction({
      isInitiated: false,
      toAddress: '',
      signers: [],
      opponents: [],
    });
  };

  const handleCancelTransaction = async () => {
    await cancelTransaction(wallets[index].keypair, contract);
    setTransaction({
      isInitiated: false,
      toAddress: '',
      signers: [],
      opponents: [],
    });
  };

  const handleRefreshBalance = async () => {
    const newBalance = await getWalletBalance(keypair.publicKey);
    setWalletBalance(index, newBalance);
  }

  const handleRequestAirdrop = async () => {
    await requestAirdrop(keypair.publicKey);
    await handleRefreshBalance();
  };

  const handleAddOwner = () => {
    setContract((prevState) => ({
        ...prevState,
        owners: prevState.owners.concat(publicKeyString),
    }));
  };

  const handleRemoveOwner = () => {
    setContract((prevState) => ({
      ...prevState,
      owners: prevState.owners.filter(publicKeyStringFilter),
    }));
  };

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
        <div className="flex-1 items-center flex flex-row gap-x-2">
          {!transaction.isInitiated && contract.wallet && contract.wallet.balance > 0 && (
            <>
              <p className="inline font-normal text-sm text-gray-600">Address:</p>
              <Input
                placeholder="Address"
                value={transaction.toAddress}
                onChange={(e) => setTransaction((prevState) => ({ ...prevState, toAddress: e.target.value }))}
              />
              <p className="inline font-normal text-sm text-gray-600">Amount (SOL):</p>
              <Input
                placeholder="Amount (lamports)"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.valueAsNumber)}
              />
              <Button label="Send SOL" onClick={handleSendRequest} />
            </>
          )}
          {transaction.isInitiated && balance > 0 && (
            <>
              {!transaction.signers.includes(publicKeyString) && balance > 0 && (
                <Button label="Confirm transaction" onClick={handleConfirmTransaction} />
              )}
              {!transaction.opponents.includes(publicKeyString) && balance > 0 && (
                <Button label="Reject transaction" onClick={handleRejectTransaction} />
              )}
              <Button label="Execute transaction" onClick={handleExecuteTransaction} />
              <Button label="Cancel transaction" onClick={handleCancelTransaction} />
            </>
          )}
        </div>
        <div className="flex flex-row gap-x-2">
          <Button label="Refresh balance" onClick={handleRefreshBalance} />
          <Button label="Request airdrop" onClick={handleRequestAirdrop} />
          {contract.owners.includes(publicKeyString) ? (
            <Button label="Mark as not owner" onClick={handleRemoveOwner} />
          ) : (
            <Button label="Mark as owner" onClick={handleAddOwner} />
          )}
        </div>
      </div>
    </>
  );
}