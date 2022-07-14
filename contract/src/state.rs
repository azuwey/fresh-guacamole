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
pub struct MultiSigWalletState {
    pub is_initialized: bool,
    pub owners: Vec<Pubkey>,
    pub threshold: u64,
    pub nonce: Pubkey
}

impl Sealed for MultiSigWalletState {}

impl IsInitialized for MultiSigWalletState {
    fn is_initialized(&self) -> bool {
        self.is_initialized
    }
}
