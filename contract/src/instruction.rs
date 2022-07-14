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
        threshold: u64,
        nonce: Pubkey
    },
    SetOwners {
        owners: Vec<Pubkey>,
        nonce: Pubkey
    },
    SetThreshold {
        threshold: u64,
        nonce: Pubkey
    }
}

#[derive(BorshDeserialize)]
pub struct MultiSigWalletInstructionPayload {
    owners: Vec<Pubkey>,
    threshold: u64,
    nonce: Pubkey
}

impl MultiSigWalletInstruction {
    pub fn unpack(instruction_data: &[u8]) -> Result<Self, ProgramError> {
        let (&instruction_variant, rest) = instruction_data.split_first().ok_or(ProgramError::InvalidInstructionData)?;
        let payload = MultiSigWalletInstructionPayload::try_from_slice(rest).unwrap();

        Ok(match instruction_variant {
            0 => Self::CreateWallet {
                owners: payload.owners,
                threshold: payload.threshold,
                nonce: payload.nonce
            },
            1 => Self::SetOwners {
                owners: payload.owners,
                nonce: payload.nonce
            },
            2 => Self::SetThreshold {
                threshold: payload.threshold,
                nonce: payload.nonce
            },
            _ => return Err(ProgramError::InvalidInstructionData)
        })
    }
}