use solana_program::{pubkey::Pubkey};
use borsh::{BorshSerialize, BorshDeserialize};

#[derive(BorshSerialize, BorshDeserialize)]
struct MultiSigWalletState {
    owners: Vec<Pubkey>,
    threshold: u64,
    nonce: Pubkey
}
