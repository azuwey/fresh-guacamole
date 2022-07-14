use solana_program::{account_info::{
    AccountInfo,
    next_account_info
}, entrypoint::ProgramResult, pubkey::Pubkey, rent::Rent, sysvar::Sysvar, msg, system_instruction};
use solana_program::program::invoke_signed;
use crate::instruction::{
    MultiSigWalletInstruction
};

pub struct Processor;
impl Processor {
    pub fn process(program_id: &Pubkey, accounts: &[AccountInfo], instruction_data: &[u8]) -> ProgramResult {
        let instruction = MultiSigWalletInstruction::unpack(instruction_data)?;
        match instruction {
            MultiSigWalletInstruction::CreateWallet { owners, threshold, nonce } => {
                msg!("Instruction: CreateWallet");
                Self::create_wallet(program_id, accounts, owners, threshold, nonce)
            },
            MultiSigWalletInstruction::SetOwners { owners, nonce } => {
                msg!("Instruction: SetOwners");
                msg!("Owners {:?}", owners);
                msg!("Nonce {:?}", nonce);
                Ok(())
            },
            MultiSigWalletInstruction::SetThreshold { threshold, nonce } => {
                msg!("Instruction: SetThreshold");
                msg!("Threshold {:?}", threshold);
                msg!("Nonce {:?}", nonce);
                Ok(())
            }
        }
    }

    fn create_wallet(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        owners: Vec<Pubkey>,
        threshold: u64,
        nonce: Pubkey
    ) -> ProgramResult {
        msg!("owners {:?}", owners);
        msg!("threshold {:?}", threshold);
        msg!("nonce {:?}", nonce);

        let account_info_iter = &mut accounts.iter();
        let initializer = next_account_info(account_info_iter)?;
        let client_program_derived_account = next_account_info(account_info_iter)?;
        let system_program = next_account_info(account_info_iter)?;
        let (program_derived_account, bump_seed) = Pubkey::find_program_address(&[initializer.key.as_ref(), nonce.as_ref()], program_id);

        let account_len: usize = (4 + owners.len()) + 8 + (4 + owners.len());
        let rent = Rent::get()?;
        let rent_lamports = rent.minimum_balance(account_len);

        invoke_signed(
            &system_instruction::create_account(
                initializer.key,
                client_program_derived_account.key,
                rent_lamports,
                account_len.try_into().unwrap(),
                program_id,
            ),
            &[initializer.clone(), client_program_derived_account.clone(), system_program.clone()],
            &[&[initializer.key.as_ref(), nonce.as_ref(), &[bump_seed]]],
        )?;

        msg!("program_derived_account created {:?}", program_derived_account);

        Ok(())
    }
}