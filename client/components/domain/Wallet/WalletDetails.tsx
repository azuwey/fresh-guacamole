import React, { useContext, useState } from "react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { ContractManagerContext } from "../../../contexts/contractManager";
import { WalletManagerContext } from "../../../contexts/walletManager";
import Button from "../../Button";
import Input from "../../Input";

interface Props {
  index: number;
}

export default function WalletDetails({ index }: Props) {
  const {
    contractState,
    setOwners,
    send,
    confirmTransaction,
    rejectTransaction,
    executeTransaction,
    cancelTransaction,
  } = useContext(ContractManagerContext);
  const { wallets, refreshBalance, requestAirdrop } = useContext(WalletManagerContext);
  const [toAddress, setToAddress] = useState(wallets[index].keypair.publicKey.toString());
  const [amount, setAmount] = useState(0);

  const { keypair, balance, mnemonic } = wallets[index];
  const publicKeyString = keypair.publicKey.toString();

  const publicKeyStringFilter = (_publicKeyString: string): boolean => {
    return _publicKeyString !== publicKeyString;
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
          {contractState.tx === '' && !wallets[index].tx ? (
            <>
              {contractState.transactionDetails === null && contractState.balance > 0 && balance > 0 && (
                <>
                  <p className="inline font-normal text-sm text-gray-600">Address:</p>
                  <Input
                    placeholder="Address"
                    value={toAddress}
                    onChange={(e) => setToAddress(e.target.value)}
                  />
                  <p className="inline font-normal text-sm text-gray-600">Amount (SOL):</p>
                  <Input
                    placeholder="Amount (SOL)"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.valueAsNumber)}
                  />
                  <Button label="Send SOL" onClick={() => send(keypair, new PublicKey(toAddress), amount * LAMPORTS_PER_SOL)} />
                </>
              )}
              {contractState.transactionDetails !== null && contractState.balance > 0 && balance > 0 && (
                <>
                  {!contractState.transactionDetails.signerPublicKeyStrings.includes(publicKeyString) && (
                    <Button label="Confirm transaction" onClick={() => confirmTransaction(keypair)} />
                  )}
                  {!contractState.transactionDetails.opponentPublicKeyStrings.includes(publicKeyString) && (
                    <Button label="Reject transaction" onClick={() => rejectTransaction(keypair)} />
                  )}
                  <Button label="Execute transaction" onClick={() => executeTransaction(keypair, new PublicKey(toAddress))} />
                  <Button label="Cancel transaction" onClick={() => cancelTransaction(keypair)} />
                </>
              )}
            </>
          ) : (
            <p className="inline font-normal text-sm text-gray-600">Waiting...</p>
          )}
        </div>
        <div className="flex items-center flex-row gap-x-2">
          {!wallets[index].tx && (
            <>
              <Button label="Refresh balance" onClick={() => refreshBalance(index)} />
              <Button label="Request airdrop" onClick={() => requestAirdrop(index)} />
            </>
          )}
          {index !== 0 && (
            contractState.ownerPublicKeyStrings.includes(publicKeyString) ? (
              <Button
                label="Remove wallet as owner"
                onClick={() => setOwners(wallets[0].keypair, contractState.ownerPublicKeyStrings.filter(publicKeyStringFilter))}
              />
            ) : (
              <Button
                label="Add wallet as owner"
                onClick={() => setOwners(wallets[0].keypair, contractState.ownerPublicKeyStrings.concat(publicKeyString))}
              />
            )
          )}
        </div>
      </div>
    </>
  );
}