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
    SetOwners {
        owners: Vec<Pubkey>
    },
    SetThreshold {
        threshold: u64
    },
    CreateTransaction {
        address: Pubkey,
        amount: u64
    },
    ConfirmTransaction {},
    RejectTransaction {}
}

#[derive(BorshDeserialize)]
pub struct MultiSigWalletInstructionPayload {
    owners: Vec<Pubkey>,
    threshold: u64,
    address: Pubkey,
    amount: u64
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
            1 => Self::SetOwners {
                owners: payload.owners
            },
            2 => Self::SetThreshold {
                threshold: payload.threshold
            },
            3 => Self::CreateTransaction {
                address: payload.address,
                amount: payload.amount
            },
            4 => Self::ConfirmTransaction {},
            5 => Self::RejectTransaction {},
            _ => return Err(ProgramError::InvalidInstructionData)
        })
    }
}