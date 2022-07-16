import React, { useContext, useState } from "react";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { ContractManagerContext } from "../../../contexts/contractManager";
import { TransactionManagerContext } from "../../../contexts/transactionManager";
import { WalletManagerContext } from "../../../contexts/walletManager";
import { DEFAULT_PROGRAM_ID, RESERVED_PUBLIC_KEY_STRING } from "../../../constants/program";
import createOrRestoreWalletWithoutBalance from "../../../utils/createOrRestoreWalletWithoutBalance";
import createMultiSigWallet from "../../../utils/createMultiSigWallet";
import requestAirdrop from "../../../utils/requestAirdrop";
import getWalletBalance from "../../../utils/getWalletBalance";
import createTransaction from "../../../utils/createTransaction";
import TransactionVariant from "../../../utils/transactionVariant";
import Button from "../../Button";
import Input from "../../Input";

export default function Contract() {
  const [contract, setContract] = useContext(ContractManagerContext)
  const [transaction, setTransaction] = useContext(TransactionManagerContext)
  const { wallets } = useContext(WalletManagerContext);
  const [programIdString, setProgramIdString] = useState(DEFAULT_PROGRAM_ID);
  const [threshold, setThreshold] = useState(2);

  const handleCreateMultiSigWallet = async () => {
    const multiSigWallet = createOrRestoreWalletWithoutBalance();
    const programId = new PublicKey(programIdString);
    const programDerivedAddress = await createMultiSigWallet(programId, wallets[0].keypair, multiSigWallet, contract.owners, threshold);
    setContract((prevState) => ({ ...prevState, programId, wallet: { ...multiSigWallet, balance: 0 }, threshold, programDerivedAddress }));
  };

  const handleRefreshBalance = async () => {
    const balance = await getWalletBalance(contract.programDerivedAddress!);
    setContract((prevState) => ({
      ...prevState,
      wallet: {
        ...prevState.wallet!,
        balance
      }
    }));
  };

  const handleRequestAirdrop = async () => {
    await requestAirdrop(contract.programDerivedAddress!);
    await handleRefreshBalance();
  };

  const handleChangeOwners = async () => {
    await createTransaction(wallets[0].keypair, contract, {
      variant: TransactionVariant.ChangeOwners,
      owners: contract.owners.map((owner) => new PublicKey(owner)),
    });
    setTransaction((prevState) => ({
      ...prevState,
      toAddress: RESERVED_PUBLIC_KEY_STRING,
      isInitiated: true,
      signers: [wallets[0].keypair.publicKey.toString()]
    }));
  };

  const handleChangeThreshold = async () => {
    await createTransaction(wallets[0].keypair, contract, {
      variant: TransactionVariant.ChangeThreshold,
      threshold: contract.threshold,
    });
    setTransaction((prevState) => ({
      ...prevState,
      toAddress: RESERVED_PUBLIC_KEY_STRING,
      isInitiated: true,
      signers: [wallets[0].keypair.publicKey.toString()]
    }));
  };

  return (
    <div className="overflow-hidden px-2">
      <span className="text-xl font-semibold">Contract</span>
      {!contract?.wallet || !contract.programId ? (
        <>
          <div className="flex items-center py-4 gap-2">
            <p className="inline font-normal text-sm text-gray-600">ProgramId:</p>
            <Input
              placeholder="ProgramId"
              value={programIdString}
              onChange={(e) => setProgramIdString(e.target.value )}
            />
            <p className="inline font-normal text-sm text-gray-600">Threshold:</p>
            <Input
              placeholder="Threshold"
              type="number"
              min={2}
              max={3}
              value={threshold}
              onChange={(e) => setThreshold(e.target.valueAsNumber)}
            />
            {contract.owners.length >= 2 && wallets?.[0].balance > 0 && (
              <Button
                label="Create multiSig wallet"
                onClick={handleCreateMultiSigWallet}
              />
            )}
          </div>
        </>
      ) : (
        <>
          <div className="pt-4 pb-2">
            <p className="font-normal mt-0.5 text-sm text-gray-600">
              {`ProgramId: ${contract.programId.toString()}`}
            </p>
            <p className="font-normal mt-0.5 text-sm text-gray-600">
              {`Address: ${contract.programDerivedAddress!.toString()}`}
            </p>
            <p className="font-normal mt-0.5 text-sm text-gray-600">
              {`Mnemonic: ${contract.wallet.mnemonic}`}
            </p>
            <p className="font-normal mt-0.5 text-sm text-gray-600">
              {`Balance: ${contract.wallet.balance / LAMPORTS_PER_SOL} SOL`}
            </p>
            <p className="font-normal mt-0.5 text-sm text-gray-600">
              {`Threshold: ${contract.threshold}`}
            </p>
            <p className="font-normal mt-0.5 text-sm text-gray-600">
              {`Owners: ${contract.owners.join(', ')}`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <p className="inline font-normal text-sm text-gray-600">Threshold:</p>
            <Input
              placeholder="Threshold"
              type="number"
              min={2}
              max={3}
              value={contract.threshold}
              onChange={(e) => setContract((prevState) => ({ ...prevState, threshold: e.target.valueAsNumber }))}
            />
            {!transaction.isInitiated && (
              <>
                <Button
                  label="Set threshold"
                  onClick={handleChangeThreshold}
                />
                <Button
                  label="Set owners"
                  onClick={handleChangeOwners}
                />
              </>
            )}
            <Button
              label="Refresh balance"
              onClick={handleRefreshBalance}
            />
            <Button
              label="Request airdrop"
              onClick={handleRequestAirdrop}
            />
          </div>
        </>
      )}
    </div>
  );
}