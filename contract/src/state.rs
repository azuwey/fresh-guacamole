use solana_program::{
    pubkey::Pubkey,
    program_pack::{
        IsInitialized,
        Sealed
    }
};
use borsh::{
    BorshSerialize,
    BorshDeserialize
};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct TransactionState {
    pub is_executed: bool,
    pub variant: u8,
    pub signers: Vec<Pubkey>,
    pub opponents: Vec<Pubkey>,
    pub to_address: Pubkey,
    pub amount: u64,
    pub owners: Vec<Pubkey>,
    pub threshold: u64
}

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct MultiSigWalletState {
    pub is_initialized: bool,
    pub owners: Vec<Pubkey>,
    pub threshold: u64,
    pub seed: Pubkey,
    pub transaction: TransactionState
}

impl Sealed for MultiSigWalletState {}

impl IsInitialized for MultiSigWalletState {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}
