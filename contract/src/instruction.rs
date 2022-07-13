use borsh::{BorshDeserialize};
use solana_program::{program_error::ProgramError};

pub enum MultiSigWalletInstruction {
    SetOwners {
        ids: Vec<u64>
    },
    SetThreshold {
        threshold: u64
    }
}

#[derive(BorshDeserialize)]
pub struct MultiSigWalletInstructionPayload {
    ids: Vec<u64>,
    threshold: u64
}

impl MultiSigWalletInstruction {
    pub fn unpack(instruction_data: &[u8]) -> Result<Self, ProgramError> {
        let (&instruction_variant, rest) = instruction_data.split_first().ok_or(ProgramError::InvalidInstructionData)?;
        let payload = MultiSigWalletInstructionPayload::try_from_slice(rest).unwrap();

        Ok(match instruction_variant {
            0 => Self::SetOwners {
                ids: payload.ids
            },
            1 => Self::SetThreshold {
                threshold: payload.threshold
            },
            _ => return Err(ProgramError::InvalidInstructionData)
        })
    }
}