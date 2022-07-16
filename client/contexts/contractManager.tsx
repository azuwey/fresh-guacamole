import React, { createContext, useState, PropsWithChildren, useContext, useEffect } from "react";
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  AccountMeta,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { MULTI_SIG_WALLET, RESERVED_PUBLIC_KEY } from "../constants/program";
import InstructionVariant from "../utils/instructionsVariants";
import TransactionVariant from "../utils/transactionVariant";
import { ConnectionManagerContext } from "./connectionManager";
import encodeInstructionData, {InstructionData} from "../utils/encodeInstructionData";

interface Props {
  connectionManager: typeof ConnectionManagerContext;
}

interface TransactionDetails {
  toAddress: string;
  signerPublicKeyStrings: string[];
  opponentPublicKeyStrings: string[];
}

type OptionalAccountMeta = Omit<Partial<AccountMeta>, 'pubkey'> & {
  pubkey: PublicKey,
}

interface AccountMetas {
  signer: OptionalAccountMeta,
  base: OptionalAccountMeta,
  pda: OptionalAccountMeta,
  to?: OptionalAccountMeta,
}

interface Contract {
  programId: PublicKey;
  pda: PublicKey;
  baseKeypair: Keypair;
  mnemonic: string;
  balance: number;
  ownerPublicKeyStrings: string[];
  threshold: number;
  transactionDetails: TransactionDetails | null;
  tx: string;
}

export interface ContractManager {
  contractState: Contract,
  createMultiSigWallet: (signer: Keypair, programId: string) => void;
  setOwners: (signer: Keypair, ownerPublicKeyStrings: string[]) => void;
  setThreshold: (signer: Keypair, threshold: number) => void;
  send: (signer: Keypair, to: PublicKey, amount: number) => void;
  confirmTransaction: (signer: Keypair) => void;
  rejectTransaction: (signer: Keypair) => void;
  executeTransaction: (signer: Keypair) => void;
  cancelTransaction: (signer: Keypair) => void;
  refreshBalance: () => void;
  requestAirdrop: () => void;
}

export const ContractManagerContext = createContext<ContractManager>({
  contractState: {
    programId: RESERVED_PUBLIC_KEY,
    pda: RESERVED_PUBLIC_KEY,
    baseKeypair: new Keypair(),
    mnemonic: "",
    balance: 0,
    ownerPublicKeyStrings: [],
    threshold: 2,
    transactionDetails: null,
    tx: '',
  },
  createMultiSigWallet: () => {
    throw new Error('ContractManagerContext cannot be used without ContractManagerContextProvider!');
  },
  setOwners: () => {
    throw new Error('ContractManagerContext cannot be used without ContractManagerContextProvider!');
  },
  setThreshold: () => {
    throw new Error('ContractManagerContext cannot be used without ContractManagerContextProvider!');
  },
  send: () => {
    throw new Error('ContractManagerContext cannot be used without ContractManagerContextProvider!');
  },
  confirmTransaction: () => {
    throw new Error('ContractManagerContext cannot be used without ContractManagerContextProvider!');
  },
  rejectTransaction: () => {
    throw new Error('ContractManagerContext cannot be used without ContractManagerContextProvider!');
  },
  executeTransaction: () => {
    throw new Error('ContractManagerContext cannot be used without ContractManagerContextProvider!');
  },
  cancelTransaction: () => {
    throw new Error('ContractManagerContext cannot be used without ContractManagerContextProvider!');
  },
  refreshBalance: () => {
    throw new Error('ContractManagerContext cannot be used without ContractManagerContextProvider!');
  },
  requestAirdrop: () => {
    throw new Error('ContractManagerContext cannot be used without ContractManagerContextProvider!');
  },
});

export function ContractManagerContextProvider({ children, connectionManager }: PropsWithChildren<Props>) {
  const { connection } = useContext(connectionManager);

  const [contract, setContract] = useState<Contract>({
    programId: RESERVED_PUBLIC_KEY,
    pda: RESERVED_PUBLIC_KEY,
    baseKeypair: new Keypair(),
    mnemonic: "",
    balance: 0,
    ownerPublicKeyStrings: [],
    threshold: 2,
    transactionDetails: null,
    tx: '',
  });

  const createAndConfirmTransaction = async (
    programId: PublicKey,
    instructionData: InstructionData,
    accountMetas: AccountMetas,
    signers: Keypair[],
  ) => {
    const data = encodeInstructionData(instructionData);
    const transaction = new Transaction().add({
      keys: [
        {
          pubkey: accountMetas.signer.pubkey,
          isSigner: accountMetas.signer?.isSigner ?? true,
          isWritable: accountMetas.signer?.isWritable ?? false
        },
        {
          pubkey: accountMetas.base.pubkey,
          isSigner: accountMetas.base?.isSigner ?? false,
          isWritable: accountMetas.base?.isWritable ?? false
        },
        {
          pubkey: accountMetas.pda.pubkey,
          isSigner: accountMetas.pda?.isSigner ?? false,
          isWritable: accountMetas.pda?.isWritable ?? true
        },
        {
          pubkey: accountMetas.to?.pubkey ?? RESERVED_PUBLIC_KEY,
          isSigner: accountMetas.to?.isSigner ?? false,
          isWritable: accountMetas.to?.isWritable ?? false
        },
        {
          pubkey: SystemProgram.programId,
          isSigner: false,
          isWritable: false,
        }
      ],
      programId: programId,
      data,
    });

    const tx = await connection.sendTransaction(transaction, signers);
    setContract((prevState) => ({
      ...prevState,
      tx,
    }));
  };

  const createMultiSigWallet = async (signer: Keypair, programIdPublicKeyString: string) => {
    const programId = new PublicKey(programIdPublicKeyString);

    const mnemonic = generateMnemonic();
    const seed = mnemonicToSeedSync(mnemonic).subarray(0, 32);
    const baseKeypair = Keypair.fromSeed(seed);

    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from(MULTI_SIG_WALLET, 'utf-8'), baseKeypair.publicKey.toBuffer()],
      programId,
    );

    await createAndConfirmTransaction(programId, {
      id: InstructionVariant.CreateWallet,
      owners: contract.ownerPublicKeyStrings.map((owner) => new PublicKey(owner)),
      threshold: contract.threshold,
    }, {
      signer: { pubkey: signer.publicKey },
      base: { pubkey: baseKeypair.publicKey, isSigner: true },
      pda: { pubkey: pda },
    }, [signer, baseKeypair]);

    setContract((prevState) => ({
      ...prevState,
      programId,
      baseKeypair,
      mnemonic,
      pda,
    }));
  };

  const setOwners = async (signer: Keypair, ownerPublicKeyStrings: string[]) => {
    contract.mnemonic !== '' && await createAndConfirmTransaction(contract.programId, {
      id: InstructionVariant.CreateTransaction,
      variant: TransactionVariant.SetOwners,
      owners: ownerPublicKeyStrings.map((ownerPublicKeyString) => new PublicKey(ownerPublicKeyString)),
    }, {
      signer: { pubkey: signer.publicKey },
      base: { pubkey: contract.baseKeypair.publicKey },
      pda: { pubkey: contract.pda },
      to: { pubkey: contract.pda },
    }, [signer]);

    setContract((prevState) => ({
      ...prevState,
      ownerPublicKeyStrings,
      transactionDetails: contract.mnemonic === '' ? null : {
        toAddress: contract.pda.toString(),
        signerPublicKeyStrings: [signer.publicKey.toString()],
        opponentPublicKeyStrings: []
      },
    }));
  };

  const setThreshold = async (signer: Keypair, threshold: number) => {
    contract.mnemonic !== '' && await createAndConfirmTransaction(contract.programId, {
      id: InstructionVariant.CreateTransaction,
      variant: TransactionVariant.SetOwners,
      threshold,
    }, {
      signer: { pubkey: signer.publicKey },
      base: { pubkey: contract.baseKeypair.publicKey },
      pda: { pubkey: contract.pda },
      to: { pubkey: contract.pda },
    }, [signer]);

    setContract((prevState) => ({
      ...prevState,
      threshold,
      transactionDetails: contract.mnemonic === '' ? null : {
        toAddress: contract.pda.toString(),
        signerPublicKeyStrings: [signer.publicKey.toString()],
        opponentPublicKeyStrings: []
      },
    }));
  };

  const send = async (signer: Keypair, to: PublicKey, amount: number) => {
    await createAndConfirmTransaction(contract.programId, {
      id: InstructionVariant.CreateTransaction,
      variant: TransactionVariant.Send,
      amount,
    }, {
      signer: { pubkey: signer.publicKey },
      base: { pubkey: contract.baseKeypair.publicKey },
      pda: { pubkey: contract.pda },
      to: { pubkey: to }
    }, [signer]);

    setContract((prevState) => ({
      ...prevState,
      balance: prevState.balance - amount,
      transactionDetails: {
        toAddress: to.toString(),
        signerPublicKeyStrings: [signer.publicKey.toString()],
        opponentPublicKeyStrings: []
      },
    }));
  };

  const confirmTransaction = async (signer: Keypair) => {
    await createAndConfirmTransaction(contract.programId, {
      id: InstructionVariant.ConfirmTransaction,
    }, {
      signer: { pubkey: signer.publicKey },
      base: { pubkey: contract.baseKeypair.publicKey },
      pda: { pubkey: contract.pda },
    }, [signer]);

    setContract((prevState) => ({
      ...prevState,
      transactionDetails: {
        ...prevState.transactionDetails!,
        signerPublicKeyStrings: prevState.transactionDetails!.signerPublicKeyStrings.concat(signer.publicKey.toString()),
        opponentPublicKeyStrings: prevState.transactionDetails!.opponentPublicKeyStrings.filter(
          (publicKeyString) => publicKeyString != signer.publicKey.toString()
        ),
      },
    }));
  };

  const rejectTransaction = async (signer: Keypair) => {
    await createAndConfirmTransaction(contract.programId, {
      id: InstructionVariant.RejectTransaction,
    }, {
      signer: { pubkey: signer.publicKey },
      base: { pubkey: contract.baseKeypair.publicKey },
      pda: { pubkey: contract.pda },
    }, [signer]);

    setContract((prevState) => ({
      ...prevState,
      transactionDetails: {
        ...prevState.transactionDetails!,
        signerPublicKeyStrings: prevState.transactionDetails!.signerPublicKeyStrings.filter(
          (publicKeyString) => publicKeyString != signer.publicKey.toString()
        ),
        opponentPublicKeyStrings: prevState.transactionDetails!.opponentPublicKeyStrings.concat(signer.publicKey.toString()),
      },
    }));
  };
  
  const executeTransaction = async (signer: Keypair) => {
    await createAndConfirmTransaction(contract.programId, {
      id: InstructionVariant.ExecuteTransaction,
    }, {
      signer: { pubkey: signer.publicKey },
      base: { pubkey: contract.baseKeypair.publicKey },
      pda: { pubkey: contract.pda },
      to: { pubkey: new PublicKey(contract.transactionDetails!.toAddress) }
    }, [signer]);

    setContract((prevState) => ({
      ...prevState,
      transactionDetails: null,
    }));
  };

  const cancelTransaction = async (signer: Keypair) => {
    await createAndConfirmTransaction(contract.programId, {
      id: InstructionVariant.CancelTransaction,
    }, {
      signer: { pubkey: signer.publicKey },
      base: { pubkey: contract.baseKeypair.publicKey },
      pda: { pubkey: contract.pda },
    }, [signer]);

    setContract((prevState) => ({
      ...prevState,
      transactionDetails: null,
    }));
  };

  const refreshBalance = async () => {
    const balance = await connection.getBalance(contract.pda);

    setContract((prevState) => ({
      ...prevState,
      balance,
    }));
  };

  const requestAirdrop = async () => {
    const tx = await connection.requestAirdrop(contract.pda, LAMPORTS_PER_SOL);
    setContract((prevState) => ({ ...prevState, tx }));
  };

  useEffect(() => {
    let interval: NodeJS.Timer;
    if (contract.tx !== '') {
      interval = setInterval(async () => {
        const status = await connection.getTransaction(contract.tx);
        if (status === null) {
          return;
        }

        const balance = await connection.getBalance(contract.pda);
        setContract((prevState) => ({
          ...prevState,
          balance,
          tx: '',
        }));
      }, 3000);
    }

    return () => clearInterval(interval);
  }, [contract.tx]);

  return (
    <ContractManagerContext.Provider value={{
      contractState: contract,
      createMultiSigWallet,
      setOwners,
      setThreshold,
      send,
      confirmTransaction,
      rejectTransaction,
      executeTransaction,
      cancelTransaction,
      refreshBalance,
      requestAirdrop,
    }}>
      {children}
    </ContractManagerContext.Provider>
  );
}
