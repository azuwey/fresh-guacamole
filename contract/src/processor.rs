use solana_program::{
    account_info::{
        AccountInfo,
        next_account_info
    },
    borsh::try_from_slice_unchecked,
    entrypoint::ProgramResult,
    pubkey::Pubkey,
    program::invoke_signed,
    program_error::ProgramError,
    rent::Rent,
    sysvar::Sysvar,
    system_instruction,
    msg
};
use borsh::{
    BorshSerialize
};
use solana_program::program_pack::IsInitialized;
use crate::instruction::{
    MultiSigWalletInstruction
};
use crate::state::{
    MultiSigWalletState
};
use crate::error::{
    MultiSigWalletError
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
        if owners.len() < 2 || owners.len() > 3 {
            msg!("Invalid owners length");
            return Err(MultiSigWalletError::InvalidOwnersLength.into())
        }

        if threshold < 2 || threshold > 3 {
            msg!("Invalid threshold");
            return Err(MultiSigWalletError::InvalidThreshold.into())
        }

        let account_info_iter = &mut accounts.iter();
        let initializer = next_account_info(account_info_iter)?;
        let client_program_derived_account = next_account_info(account_info_iter)?;
        let system_program = next_account_info(account_info_iter)?;

        if !initializer.is_signer {
            msg!("Missing required signature");
            return Err(ProgramError::MissingRequiredSignature)
        }

        let (program_derived_account, bump_seed) = Pubkey::find_program_address(&[initializer.key.as_ref(), nonce.as_ref()], program_id);

        if program_derived_account != *client_program_derived_account.key {
            msg!("Invalid seeds for PDA");
            return Err(MultiSigWalletError::InvalidPDA.into())
        }

        let account_len: usize = 1 + (4 + (owners.len() * 32)) + 8 + (4 + nonce.to_bytes().len());
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

        let mut account_data = try_from_slice_unchecked::<MultiSigWalletState>(&client_program_derived_account.data.borrow()).unwrap();

        if account_data.is_initialized() {
            msg!("Account already initialized");
            return Err(ProgramError::AccountAlreadyInitialized);
        }

        account_data.is_initialized = true;
        account_data.owners = owners;
        account_data.threshold = threshold;
        account_data.nonce = nonce;

        account_data.serialize(&mut &mut client_program_derived_account.data.borrow_mut()[..])?;

        Ok(())
    }
}