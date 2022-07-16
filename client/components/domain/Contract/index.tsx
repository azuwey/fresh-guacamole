import React, { useContext, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ContractManagerContext } from "../../../contexts/contractManager";
import { WalletManagerContext } from "../../../contexts/walletManager";
import { DEFAULT_PROGRAM_ID } from "../../../constants/program";
import Button from "../../Button";
import Input from "../../Input";

export default function Contract() {
  const {
    contractState,
    createMultiSigWallet,
    setThreshold,
    refreshBalance,
    requestAirdrop,
  } = useContext(ContractManagerContext);
  const { wallets } = useContext(WalletManagerContext);
  const [programIdString, setProgramIdString] = useState(DEFAULT_PROGRAM_ID);
  const [contractThreshold, setContractThreshold] = useState(2);

  return (
    <div className="overflow-hidden px-2">
      <span className="text-xl font-semibold">Contract</span>
      {!contractState.mnemonic ? (
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
              value={contractThreshold}
              onChange={(e) => setContractThreshold(e.target.valueAsNumber)}
            />
            {contractState.ownerPublicKeyStrings.length >= 2 && wallets?.[0].balance > 0 && (
              <Button
                label="Create multiSig wallet"
                onClick={() => createMultiSigWallet(wallets[0].keypair, programIdString)}
              />
            )}
          </div>
        </>
      ) : (
        <>
          <div className="pt-4 pb-2">
            <p className="font-normal mt-0.5 text-sm text-gray-600">
              {`ProgramId: ${contractState.programId.toString()}`}
            </p>
            <p className="font-normal mt-0.5 text-sm text-gray-600">
              {`Address: ${contractState.pda.toString()}`}
            </p>
            <p className="font-normal mt-0.5 text-sm text-gray-600">
              {`Mnemonic: ${contractState.mnemonic}`}
            </p>
            <p className="font-normal mt-0.5 text-sm text-gray-600">
              {`Balance: ${contractState.balance / LAMPORTS_PER_SOL} SOL`}
            </p>
          </div>
          <div className="flex items-center gap-2 pb-2">
            <p className="inline font-normal text-sm text-gray-600">Threshold:</p>
            <Input
              placeholder="Threshold"
              type="number"
              min={2}
              max={3}
              value={contractThreshold}
              onChange={(e) => setContractThreshold(e.target.valueAsNumber)}
            />
            {contractState.tx === '' ? (
              <>
                {contractState.transactionDetails === null && (
                  <>
                    <Button
                      label="Set threshold"
                      onClick={() => setThreshold(wallets[0].keypair, contractThreshold)}
                    />
                  </>
                )}
                <Button
                  label="Refresh balance"
                  onClick={() => refreshBalance()}
                />
                <Button
                label="Request airdrop"
                onClick={() => requestAirdrop()}
                />
              </>
            ): (
              <p className="inline font-normal text-sm text-gray-600">Waiting...</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}