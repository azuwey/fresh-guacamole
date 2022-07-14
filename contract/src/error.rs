use solana_program::{program_error::ProgramError};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum MultiSigWalletError {
    #[error("MultiSigWallet not initialized yet")]
    UninitializedAccount,

    #[error("PDA does not equal PDA passed in")]
    InvalidPDA,

    #[error("Threshold greater than 3 or less than 2")]
    InvalidThreshold,

    #[error("Length of the owners is greater than 3 or less than 2")]
    InvalidOwnersLength,

    #[error("Initializer not an owner in the wallet")]
    InvalidOwner,

    #[error("Unexpected transaction")]
    UnexpectedTransaction,
}

impl From<MultiSigWalletError> for ProgramError {
    fn from(e: MultiSigWalletError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

