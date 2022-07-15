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
            MultiSigWalletInstruction::CreateWallet { owners, threshold } => {
                msg!("Instruction: CreateWallet");
                Self::create_wallet(program_id, accounts, owners, threshold)
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
            },
            MultiSigWalletInstruction::CreateTransaction { amount } => {
                msg!("Instruction: CreateTransaction");
                Self::create_transaction(program_id, accounts, amount)
            },
            MultiSigWalletInstruction::ConfirmTransaction {} => {
                msg!("Instruction: ConfirmTransaction");
                Self::confirm_transaction(program_id, accounts)
            },
            MultiSigWalletInstruction::RejectTransaction {} => {
                msg!("Instruction: RejectTransaction");
                Self::reject_transaction(program_id, accounts)
            },
            MultiSigWalletInstruction::ExecuteTransaction {} => {
                msg!("Instruction: ExecuteTransaction");
                Self::execute_transaction(program_id, accounts)
            },
        }
    }

    fn create_wallet(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        owners: Vec<Pubkey>,
        threshold: u64
    ) -> ProgramResult {
        if threshold < 2 || threshold > 3 {
            msg!("Invalid threshold");
            return Err(MultiSigWalletError::InvalidThreshold.into())
        }

        if owners.len() < threshold as usize {
            msg!("Invalid owners length");
            return Err(MultiSigWalletError::InvalidOwnersLength.into())
        }

        let account_info_iter = &mut accounts.iter();
        let initializer = next_account_info(account_info_iter)?;
        let base = next_account_info(account_info_iter)?;
        let client_program_derived_account = next_account_info(account_info_iter)?;
        let system_program = next_account_info(account_info_iter)?;

        if !initializer.is_signer || !base.is_signer {
            msg!("Missing required signature");
            return Err(ProgramError::MissingRequiredSignature)
        }

        let (program_derived_account, bump_seed) = Pubkey::find_program_address(&[b"MultiSigWallet".as_ref(), base.key.as_ref()], program_id);

        if program_derived_account != *client_program_derived_account.key {
            msg!("Invalid seeds for PDA");
            return Err(MultiSigWalletError::InvalidPDA.into())
        }

        let account_len: usize = 1 + (4 + (3 * 32)) + 8 + (4 + 32) + 1 + (4 + (3 * 32)) + (4 + (3 * 32)) + 8;
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
            &[&[b"MultiSigWallet".as_ref(), base.key.as_ref(), &[bump_seed]]],
        )?;

        let mut account_data = try_from_slice_unchecked::<MultiSigWalletState>(&client_program_derived_account.data.borrow()).unwrap();

        if account_data.is_initialized() {
            msg!("Account already initialized");
            return Err(ProgramError::AccountAlreadyInitialized);
        }

        account_data.is_initialized = true;
        account_data.owners = owners;
        account_data.threshold = threshold;
        account_data.transaction.is_executed = true;

        account_data.serialize(&mut &mut client_program_derived_account.data.borrow_mut()[..])?;

        Ok(())
    }

    fn create_transaction(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        amount: u64
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let initializer = next_account_info(account_info_iter)?;
        let base = next_account_info(account_info_iter)?;
        let client_program_derived_account = next_account_info(account_info_iter)?;
        let to_account = next_account_info(account_info_iter)?;

        if client_program_derived_account.owner != program_id {
            msg!("PDA not owned by the program");
            return Err(ProgramError::IllegalOwner)
        }

        if !initializer.is_signer {
            msg!("Missing required signature");
            return Err(ProgramError::MissingRequiredSignature)
        }

        let (program_derived_account, _bump_seed) = Pubkey::find_program_address(&[b"MultiSigWallet".as_ref(), base.key.as_ref()], program_id);

        if program_derived_account != *client_program_derived_account.key {
            msg!("Invalid seeds for PDA");
            return Err(MultiSigWalletError::InvalidPDA.into())
        }

        if client_program_derived_account.lamports() <= amount {
            msg!("PDA have insufficient balance");
            return Err(ProgramError::InsufficientFunds)
        }

        let mut account_data = try_from_slice_unchecked::<MultiSigWalletState>(&client_program_derived_account.data.borrow()).unwrap();

        if !account_data.is_initialized() {
            msg!("Wallet not initialized");
            return Err(MultiSigWalletError::UninitializedAccount.into());
        }

        if !account_data.owners.iter().any(|owner| owner == initializer.key) {
            msg!("Initializer not an owner");
            return Err(MultiSigWalletError::InvalidOwner.into());
        }

        if !account_data.transaction.is_executed {
            msg!("Previous transaction not executed");
            return Err(MultiSigWalletError::UnexpectedTransaction.into());
        }

        account_data.transaction.to_address = *to_account.key;
        account_data.transaction.amount = amount;
        account_data.transaction.is_executed = false;
        account_data.transaction.signers = Vec::new();
        account_data.transaction.opponents = Vec::new();
        account_data.transaction.signers.append(&mut vec![initializer.key.clone()]);

        account_data.serialize(&mut &mut client_program_derived_account.data.borrow_mut()[..])?;

        Ok(())
    }

    fn confirm_transaction(
        program_id: &Pubkey,
        accounts: &[AccountInfo]
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let initializer = next_account_info(account_info_iter)?;
        let base = next_account_info(account_info_iter)?;
        let client_program_derived_account = next_account_info(account_info_iter)?;

        if client_program_derived_account.owner != program_id {
            msg!("PDA not owned by the program");
            return Err(ProgramError::IllegalOwner)
        }

        if !initializer.is_signer {
            msg!("Missing required signature");
            return Err(ProgramError::MissingRequiredSignature)
        }

        let (program_derived_account, _bump_seed) = Pubkey::find_program_address(&[b"MultiSigWallet".as_ref(), base.key.as_ref()], program_id);

        if program_derived_account != *client_program_derived_account.key {
            msg!("Invalid seeds for PDA");
            return Err(MultiSigWalletError::InvalidPDA.into())
        }

        let mut account_data = try_from_slice_unchecked::<MultiSigWalletState>(&client_program_derived_account.data.borrow()).unwrap();

        if !account_data.is_initialized() {
            msg!("Wallet not initialized");
            return Err(MultiSigWalletError::UninitializedAccount.into());
        }

        if !account_data.owners.iter().any(|owner| owner == initializer.key) {
            msg!("Initializer not an owner");
            return Err(MultiSigWalletError::InvalidOwner.into());
        }

        if account_data.transaction.is_executed {
            msg!("Transaction has been executed already");
            return Err(MultiSigWalletError::UnexpectedInstruction.into());
        }

        if account_data.transaction.signers.iter().any(|owner| owner == initializer.key) {
            msg!("Initializer already signed the transaction");
            return Err(MultiSigWalletError::InvalidInstruction.into());
        }

        account_data.transaction.opponents.retain(|owner| owner != initializer.key);
        account_data.transaction.signers.append(&mut vec![initializer.key.clone()]);

        account_data.serialize(&mut &mut client_program_derived_account.data.borrow_mut()[..])?;

        Ok(())
    }

    fn reject_transaction(
        program_id: &Pubkey,
        accounts: &[AccountInfo]
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let initializer = next_account_info(account_info_iter)?;
        let base = next_account_info(account_info_iter)?;
        let client_program_derived_account = next_account_info(account_info_iter)?;

        if client_program_derived_account.owner != program_id {
            msg!("PDA not owned by the program");
            return Err(ProgramError::IllegalOwner)
        }

        if !initializer.is_signer {
            msg!("Missing required signature");
            return Err(ProgramError::MissingRequiredSignature)
        }

        let (program_derived_account, _bump_seed) = Pubkey::find_program_address(&[b"MultiSigWallet".as_ref(), base.key.as_ref()], program_id);

        if program_derived_account != *client_program_derived_account.key {
            msg!("Invalid seeds for PDA");
            return Err(MultiSigWalletError::InvalidPDA.into())
        }

        let mut account_data = try_from_slice_unchecked::<MultiSigWalletState>(&client_program_derived_account.data.borrow()).unwrap();

        if !account_data.is_initialized() {
            msg!("Wallet not initialized");
            return Err(MultiSigWalletError::UninitializedAccount.into());
        }

        if !account_data.owners.iter().any(|owner| owner == initializer.key) {
            msg!("Initializer not an owner");
            return Err(MultiSigWalletError::InvalidOwner.into());
        }

        if account_data.transaction.is_executed {
            msg!("Transaction has been executed already");
            return Err(MultiSigWalletError::UnexpectedInstruction.into());
        }

        if account_data.transaction.opponents.iter().any(|owner| owner == initializer.key) {
            msg!("Initializer already rejected the transaction");
            return Err(MultiSigWalletError::InvalidInstruction.into());
        }

        account_data.transaction.signers.retain(|owner| owner != initializer.key);
        account_data.transaction.opponents.append(&mut vec![initializer.key.clone()]);

        account_data.serialize(&mut &mut client_program_derived_account.data.borrow_mut()[..])?;

        Ok(())
    }

    fn execute_transaction(
        program_id: &Pubkey,
        accounts: &[AccountInfo]
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let initializer = next_account_info(account_info_iter)?;
        let base = next_account_info(account_info_iter)?;
        let client_program_derived_account = next_account_info(account_info_iter)?;
        let to_account = next_account_info(account_info_iter)?;

        if client_program_derived_account.owner != program_id {
            msg!("PDA not owned by the program");
            return Err(ProgramError::IllegalOwner)
        }

        if !initializer.is_signer {
            msg!("Missing required signature");
            return Err(ProgramError::MissingRequiredSignature)
        }

        let (program_derived_account, _bump_seed) = Pubkey::find_program_address(&[b"MultiSigWallet".as_ref(), base.key.as_ref()], program_id);

        if program_derived_account != *client_program_derived_account.key {
            msg!("Invalid seeds for PDA");
            return Err(MultiSigWalletError::InvalidPDA.into())
        }

        let mut account_data = try_from_slice_unchecked::<MultiSigWalletState>(&client_program_derived_account.data.borrow()).unwrap();

        if !account_data.is_initialized() {
            msg!("Wallet not initialized");
            return Err(MultiSigWalletError::UninitializedAccount.into());
        }

        if !account_data.owners.iter().any(|owner| owner == initializer.key) {
            msg!("Initializer not an owner");
            return Err(MultiSigWalletError::InvalidOwner.into());
        }

        if account_data.transaction.is_executed {
            msg!("Transaction has been executed already");
            return Err(MultiSigWalletError::UnexpectedInstruction.into());
        }


        if account_data.transaction.to_address != *to_account.key {
            msg!("The provided address does not match with the stored address");
            return Err(MultiSigWalletError::InvalidInstruction.into());
        }

        **client_program_derived_account.try_borrow_mut_lamports()? -= account_data.transaction.amount;
        **to_account.try_borrow_mut_lamports()? += account_data.transaction.amount;

        account_data.transaction.is_executed = true;

        account_data.serialize(&mut &mut client_program_derived_account.data.borrow_mut()[..])?;

        Ok(())
    }
}