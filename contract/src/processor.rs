use solana_program::{account_info::AccountInfo, entrypoint::ProgramResult, pubkey::Pubkey, msg};
use crate::instruction::{MultiSigWalletInstruction};

pub struct Processor;
impl Processor {
    pub fn process(_program_id: &Pubkey, _accounts: &[AccountInfo], instruction_data: &[u8]) -> ProgramResult {
        let instruction = MultiSigWalletInstruction::unpack(instruction_data)?;
        match instruction {
            MultiSigWalletInstruction::CreateWallet { owners, threshold } => {
                msg!("Instruction: SetOwners");
                msg!("Owners {:?}", owners);
                msg!("Threshold {:?}", threshold);
                Ok(())
            },
            MultiSigWalletInstruction::SetOwners { owners } => {
                msg!("Instruction: SetOwners");
                msg!("Owners {:?}", owners);
                Ok(())
            },
            MultiSigWalletInstruction::SetThreshold { threshold } => {
                msg!("Instruction: SetThreshold");
                msg!("Threshold {:?}", threshold);
                Ok(())
            }
        }
    }
}