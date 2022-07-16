use borsh::{
    BorshDeserialize
};
use solana_program::{
    program_error::ProgramError,
    pubkey::Pubkey
};

pub enum MultiSigWalletInstruction {
    CreateWallet {
        owners: Vec<Pubkey>,
        threshold: u64
    },
    CreateTransaction {
        variant: u8,
        amount: u64,
        owners: Vec<Pubkey>,
        threshold: u64
    },
    ConfirmTransaction {},
    RejectTransaction {},
    ExecuteTransaction {},
    CancelTransaction {}
}

#[derive(BorshDeserialize)]
pub struct MultiSigWalletInstructionPayload {
    variant: u8,
    amount: u64,
    owners: Vec<Pubkey>,
    threshold: u64
}

impl MultiSigWalletInstruction {
    pub fn unpack(instruction_data: &[u8]) -> Result<Self, ProgramError> {
        let (&instruction_variant, rest) = instruction_data.split_first().ok_or(ProgramError::InvalidInstructionData)?;
        let payload = MultiSigWalletInstructionPayload::try_from_slice(rest).unwrap();

        Ok(match instruction_variant {
            0 => Self::CreateWallet {
                owners: payload.owners,
                threshold: payload.threshold
            },
            1 => Self::CreateTransaction {
                variant: payload.variant,
                amount: payload.amount,
                owners: payload.owners,
                threshold: payload.threshold
            },
            2 => Self::ConfirmTransaction {},
            3 => Self::RejectTransaction {},
            4 => Self::ExecuteTransaction {},
            5 => Self::CancelTransaction {},
            _ => return Err(ProgramError::InvalidInstructionData)
        })
    }
}